import { registerBotCommands } from './handle-update'
import { syncTelegramUpdates } from './sync-updates'

let pollingStarted = false
let pollTimer: ReturnType<typeof setInterval> | null = null

async function deleteWebhook(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`)
}

async function setWebhook(url: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return false

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const body: Record<string, string> = { url }
  if (secret) body.secret_token = secret

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return Boolean(data.ok)
}

async function runPollCycle(): Promise<void> {
  const result = await syncTelegramUpdates()
  if (result.error?.includes('webhook is active')) {
    await deleteWebhook()
    await syncTelegramUpdates()
  }
}

export function startTelegramPolling(): void {
  if (pollingStarted || process.env.TELEGRAM_AUTO_POLL === 'false') return
  pollingStarted = true

  const intervalMs = Number(process.env.TELEGRAM_POLL_INTERVAL_MS ?? 2500)

  void runPollCycle()
  pollTimer = setInterval(() => {
    void runPollCycle()
  }, intervalMs)

  console.log(`[telegram] Auto-polling every ${intervalMs}ms (no Sync button needed)`)
}

export function stopTelegramPolling(): void {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
  pollingStarted = false
}

/** Call once on server start: register /menu commands + webhook (prod) or polling (dev). */
export async function ensureTelegramBotReady(): Promise<{
  mode: 'webhook' | 'polling' | 'disabled'
  commandsRegistered: boolean
}> {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return { mode: 'disabled', commandsRegistered: false }
  }

  await registerBotCommands()

  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL?.trim()
  if (webhookUrl && process.env.NODE_ENV === 'production') {
    const ok = await setWebhook(webhookUrl)
    if (ok) {
      console.log(`[telegram] Webhook set → ${webhookUrl}`)
      return { mode: 'webhook', commandsRegistered: true }
    }
  }

  await deleteWebhook()
  startTelegramPolling()
  return { mode: 'polling', commandsRegistered: true }
}

export function isPollingActive(): boolean {
  return pollingStarted
}

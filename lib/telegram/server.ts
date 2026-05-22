import { formatTelegramMessage } from './format-message'
import type { TelegramNotificationPayload } from './types'

/** Telegram chat IDs are numbers (groups are often negative, e.g. -1001234567890). */
function isValidTelegramChatId(id: string): boolean {
  return /^-?\d+$/.test(id.trim())
}

function parseChatIds(envValue: string | undefined): string[] {
  if (!envValue?.trim()) return []
  const ids = envValue
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  const valid = ids.filter(isValidTelegramChatId)
  const invalid = ids.filter((id) => !isValidTelegramChatId(id))
  if (invalid.length > 0) {
    console.warn(
      `Ignoring invalid Telegram chat ID(s) (use numbers only from Dashboard → Telegram sync): ${invalid.join(', ')}`,
    )
  }
  return valid
}

export function getTelegramRecipientChatIds(): {
  admin: string[]
  notify: string[]
  all: string[]
} {
  const admin = parseChatIds(process.env.TELEGRAM_ADMIN_CHAT_IDS)
  const notify = parseChatIds(process.env.TELEGRAM_NOTIFY_CHAT_IDS)
  const all = [...new Set([...admin, ...notify])]
  return { admin, notify, all }
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && getTelegramRecipientChatIds().all.length > 0)
}

async function sendTelegramToChat(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return false

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`Telegram send failed for chat_id ${chatId}:`, body)
    return false
  }
  return true
}

export async function sendTelegramNotification(
  payload: TelegramNotificationPayload,
): Promise<{ sent: number; failed: number }> {
  if (!isTelegramConfigured()) {
    return { sent: 0, failed: 0 }
  }

  const message = formatTelegramMessage(payload)
  const { all } = getTelegramRecipientChatIds()

  let sent = 0
  let failed = 0

  await Promise.all(
    all.map(async (chatId) => {
      const ok = await sendTelegramToChat(chatId, message)
      if (ok) sent++
      else failed++
    }),
  )

  return { sent, failed }
}

export async function sendTelegramRawMessage(text: string, chatId: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return false

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })

  return res.ok
}

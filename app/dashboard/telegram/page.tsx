'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, RefreshCw, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ChatInfo {
  chatId: string
  name: string
  lastMessage?: string
}

interface StatusResponse {
  hasBotToken: boolean
  hasServiceRole?: boolean
  configured: boolean
  recipients: { admin: string[]; notify: string[] }
  botUsername?: string | null
  botLink?: string | null
}

const BOT_COMMANDS_HELP = [
  '/members — all members & balances',
  '/balance yafet — one person (bernabas, anteneh, …)',
  '/lowbalance — who is below 50 ETB',
  '/summary — group totals',
  '/recent — latest transactions',
  '/today — today’s consumptions',
  '/menu — food prices',
  '/savings — savings pot',
  '/help — full list',
]

export default function TelegramSetupPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [chats, setChats] = useState<ChatInfo[]>([])
  const [replied, setReplied] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [webhookError, setWebhookError] = useState(false)

  const loadStatus = useCallback(async () => {
    const res = await fetch('/api/telegram/status', { credentials: 'include' })
    if (res.ok) {
      setStatus(await res.json())
    } else {
      setStatus(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const syncBot = async (clearWebhook = false) => {
    setSyncing(true)
    setWebhookError(false)
    try {
      const url = clearWebhook ? '/api/telegram/poll?clearWebhook=1' : '/api/telegram/poll'
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()

      if (!res.ok) {
        setWebhookError(Boolean(data.canClearWebhook))
        toast.error(data.error ?? 'Sync failed', {
          description: data.hint,
        })
        return
      }

      setChats(data.chats ?? [])
      setReplied(data.replied ?? 0)
      await loadStatus()

      if (data.chats?.length === 0) {
        toast.message('No messages yet', {
          description: 'Send /start to your bot in Telegram, then sync again.',
        })
      } else if (data.replied > 0) {
        toast.success(`Replied to ${data.replied} message(s) in Telegram`)
      } else {
        toast.success(`Found ${data.chats.length} chat(s)`)
      }
    } finally {
      setSyncing(false)
    }
  }

  const copyChatId = async (chatId: string) => {
    await navigator.clipboard.writeText(chatId)
    setCopiedId(chatId)
    toast.success('Chat ID copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyNotifyEnvLine = async () => {
    const existing = status?.recipients.notify ?? []
    const fromSync = chats.map((c) => c.chatId)
    const merged = [...new Set([...existing, ...fromSync])]
    const line = `TELEGRAM_NOTIFY_CHAT_IDS=${merged.join(',')}`
    await navigator.clipboard.writeText(line)
    toast.success('Copied .env line — paste into .env.local and restart pnpm dev')
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageCircle className="h-7 w-7 text-amber-600" />
          Telegram setup
        </h1>
        <p className="text-muted-foreground mt-1">
          Connect your bot so admins and the team get alerts for deposits, consumptions, and more.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant={status?.hasBotToken ? 'default' : 'destructive'}>
            {status?.hasBotToken ? 'Bot token set' : 'Bot token missing'}
          </Badge>
          <Badge variant={status?.configured ? 'default' : 'secondary'}>
            {status?.configured ? 'Recipients configured' : 'Add chat IDs to .env.local'}
          </Badge>
          <Badge variant={status?.hasServiceRole ? 'default' : 'destructive'}>
            {status?.hasServiceRole ? 'Bot can read app data' : 'Add SUPABASE_SERVICE_ROLE_KEY'}
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="text-lg">Use commands in Telegram (no typing)</CardTitle>
          <CardDescription className="space-y-2">
            <p>
              While <code className="text-xs bg-muted px-1 rounded">pnpm dev</code> is running, the bot{' '}
              <strong>replies automatically</strong> — no Sync button needed.
            </p>
            <p>
              In your bot chat, tap the <strong>menu button</strong> (☰) next to the message box, or type{' '}
              <code className="text-xs bg-muted px-1 rounded">/</code> and <strong>pick a command</strong> from the list.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {BOT_COMMANDS_HELP.map((line) => (
              <li key={line}>
                <code className="text-xs bg-muted px-1 rounded">{line.split(' — ')[0]}</code>
                {' — '}
                {line.split(' — ')[1]}
              </li>
            ))}
          </ul>
          {!status?.hasServiceRole && (
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-3">
              Add <code className="text-xs bg-muted px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> to{' '}
              <code className="text-xs bg-muted px-1 rounded">.env.local</code> (Supabase → Settings → API →
              service_role) so commands can read members and balances.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-lg">Add a friend or teammate</CardTitle>
          <CardDescription className="space-y-2 text-foreground/80">
            <p>
              Sharing the bot link is not enough. Each person must be on your notify list in{' '}
              <code className="text-xs bg-muted px-1 rounded">.env.local</code>.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Send them your bot link
                {status?.botLink ? (
                  <>
                    :{' '}
                    <a
                      href={status.botLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-700 underline font-medium"
                    >
                      {status.botLink}
                    </a>
                  </>
                ) : (
                  ' (sync once to load the link)'
                )}
              </li>
              <li>They tap <strong>Start</strong> and send <code className="text-xs bg-muted px-1 rounded">/start</code></li>
              <li>Open <strong>Dashboard → Telegram</strong> once — their chat ID appears in the list below (or in the bot reply)</li>
              <li>
                Copy their ID into <code className="text-xs bg-muted px-1 rounded">TELEGRAM_NOTIFY_CHAT_IDS</code>{' '}
                (comma-separated with yours), then restart <code className="text-xs bg-muted px-1 rounded">pnpm dev</code>
              </li>
            </ol>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 1 — Message your bot</CardTitle>
          <CardDescription>
            In Telegram, open your bot and send <code className="text-xs bg-muted px-1 rounded">/start</code>.
            On localhost the bot cannot reply automatically until you sync below.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chat IDs (for teammates)</CardTitle>
          <CardDescription>
            Optional: refresh the list of people who messaged the bot. Replies happen automatically — you rarely need this.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => syncBot(false)}
              disabled={syncing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Refreshing…' : 'Refresh chat ID list'}
            </Button>
            {webhookError && (
              <Button
                variant="outline"
                onClick={() => syncBot(true)}
                disabled={syncing}
              >
                Use polling instead (remove webhook)
              </Button>
            )}
          </div>

          {chats.length > 0 && (
            <Button variant="secondary" size="sm" onClick={copyNotifyEnvLine}>
              <Copy className="mr-2 h-4 w-4" />
              Copy TELEGRAM_NOTIFY_CHAT_IDS line (all people below)
            </Button>
          )}

          {chats.length > 0 && (
            <ul className="space-y-2">
              {chats.map((chat) => {
                const already =
                  status?.recipients.notify.includes(chat.chatId) ||
                  status?.recipients.admin.includes(chat.chatId)
                return (
                <li
                  key={chat.chatId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {chat.name}
                      {already ? (
                        <Badge variant="secondary" className="text-xs">Receiving alerts</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-700">Add to .env.local</Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">{chat.chatId}</p>
                    {chat.lastMessage && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                        Last: {chat.lastMessage}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyChatId(chat.chatId)}
                  >
                    {copiedId === chat.chatId ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              )})}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 3 — Add IDs to .env.local</CardTitle>
          <CardDescription className="space-y-2">
            <p>Paste chat IDs into your project root <code className="text-xs bg-muted px-1 rounded">.env.local</code>:</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`TELEGRAM_ADMIN_CHAT_IDS=1687764618
TELEGRAM_NOTIFY_CHAT_IDS=1687764618,FRIEND_ID_HERE`}
            </pre>
            <p>Restart <code className="text-xs bg-muted px-1 rounded">pnpm dev</code> after saving.</p>
          </CardDescription>
        </CardHeader>
      </Card>

      {status && (status.recipients.admin.length > 0 || status.recipients.notify.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current recipients</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 font-mono">
            {status.recipients.admin.length > 0 && (
              <p>Admin: {status.recipients.admin.join(', ')}</p>
            )}
            {status.recipients.notify.length > 0 && (
              <p>Notify: {status.recipients.notify.join(', ')}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

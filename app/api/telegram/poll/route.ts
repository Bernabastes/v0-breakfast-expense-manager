import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncTelegramUpdates } from '@/lib/telegram/sync-updates'
import { ensureTelegramBotReady, isPollingActive } from '@/lib/telegram/polling'
import { getTelegramRecipientChatIds, isTelegramConfigured } from '@/lib/telegram/server'

/** Manual sync (optional — bot auto-polls while dev server runs). Requires login. */
export async function POST(req: Request) {
  await ensureTelegramBotReady()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        hint: 'Log in at /auth/login first, then open Dashboard → Telegram setup.',
      },
      { status: 401 },
    )
  }

  const result = await syncTelegramUpdates()
  const recipients = getTelegramRecipientChatIds()

  if (result.error) {
    return NextResponse.json(
      { error: result.error, canClearWebhook: result.error.includes('webhook') },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    chats: result.chats,
    replied: result.replied,
    polling: isPollingActive(),
    configured: isTelegramConfigured(),
    recipients: {
      admin: recipients.admin,
      notify: recipients.notify,
    },
    hint:
      result.chats.length === 0
        ? 'Message your bot /start in Telegram — replies arrive automatically within a few seconds.'
        : 'Add new chat IDs to TELEGRAM_NOTIFY_CHAT_IDS in .env.local, then restart pnpm dev.',
  })
}

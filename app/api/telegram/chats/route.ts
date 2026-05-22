import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncTelegramUpdates } from '@/lib/telegram/sync-updates'
import { isTelegramConfigured } from '@/lib/telegram/server'

/** Lists chat IDs from bot updates. ?sync=1 also replies to /start (localhost-friendly). Requires login. */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        hint: 'Log in at /auth/login, then use Dashboard → Telegram setup (or call this URL in the same browser session).',
      },
      { status: 401 },
    )
  }

  const result = await syncTelegramUpdates()

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({
    chats: result.chats,
    replied: result.replied,
    configured: isTelegramConfigured(),
    hint:
      result.chats.length === 0
        ? 'Message your bot /start in Telegram, then open this page again with ?sync=1'
        : 'Add chat IDs to TELEGRAM_ADMIN_CHAT_IDS / TELEGRAM_NOTIFY_CHAT_IDS in .env.local',
  })
}

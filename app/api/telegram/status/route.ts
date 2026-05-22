import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTelegramRecipientChatIds, isTelegramConfigured } from '@/lib/telegram/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', loggedIn: false }, { status: 401 })
  }

  const recipients = getTelegramRecipientChatIds()
  const token = process.env.TELEGRAM_BOT_TOKEN

  let botUsername: string | null = null
  if (token) {
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`)
      const meData = await meRes.json()
      if (meData.ok && meData.result?.username) {
        botUsername = meData.result.username
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    loggedIn: true,
    hasBotToken: Boolean(token),
    hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    configured: isTelegramConfigured(),
    recipients,
    botUsername,
    botLink: botUsername ? `https://t.me/${botUsername}` : null,
  })
}

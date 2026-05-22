import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { registerBotCommands } from '@/lib/telegram/handle-update'
import { ensureTelegramBotReady, isPollingActive } from '@/lib/telegram/polling'
import { isTelegramConfigured } from '@/lib/telegram/server'

/** Registers bot command menu + ensures polling/webhook. Safe to call on dashboard load. */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 503 })
  }

  const ready = await ensureTelegramBotReady()

  return NextResponse.json({
    ok: true,
    mode: ready.mode,
    polling: isPollingActive(),
    configured: isTelegramConfigured(),
    hint:
      ready.mode === 'polling'
        ? 'Bot replies automatically while pnpm dev is running. Tap / in Telegram to pick a command.'
        : ready.mode === 'webhook'
          ? 'Webhook mode — instant replies on your deployed URL.'
          : 'Telegram disabled',
  })
}

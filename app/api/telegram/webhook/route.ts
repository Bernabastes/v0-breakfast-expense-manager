import { NextResponse } from 'next/server'
import { processTelegramMessage } from '@/lib/telegram/handle-update'

interface TelegramUpdate {
  message?: {
    chat: { id: number }
    text?: string
  }
  edited_message?: {
    chat: { id: number }
    text?: string
  }
}

/** Public webhook for Telegram — use when deploying with a public HTTPS URL. */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret) {
    const header = req.headers.get('x-telegram-bot-api-secret-token')
    if (header !== secret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  let update: TelegramUpdate
  try {
    update = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = update.message ?? update.edited_message
  if (!message?.text) {
    return NextResponse.json({ ok: true })
  }

  const chatId = String(message.chat.id)
  await processTelegramMessage(message.text, chatId)

  return NextResponse.json({ ok: true })
}

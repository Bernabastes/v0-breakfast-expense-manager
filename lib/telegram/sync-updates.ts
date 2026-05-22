import { processTelegramMessage } from './handle-update'

interface TelegramChat {
  id: number
  type: string
  first_name?: string
  last_name?: string
  username?: string
  title?: string
}

interface TelegramMessage {
  message_id: number
  chat: TelegramChat
  text?: string
  from?: { first_name?: string; username?: string }
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
}

export interface TelegramChatInfo {
  chatId: string
  name: string
  lastMessage?: string
}

function chatDisplayName(chat: TelegramChat): string {
  return (
    chat.title ??
    ([chat.first_name, chat.last_name].filter(Boolean).join(' ') ||
      chat.username ||
      String(chat.id))
  )
}

/** Poll Telegram getUpdates (works on localhost without webhook). Handles all bot commands. */
export async function syncTelegramUpdates(): Promise<{
  chats: TelegramChatInfo[]
  replied: number
  error?: string
}> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return { chats: [], replied: 0, error: 'TELEGRAM_BOT_TOKEN not set' }
  }

  const webhookRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
  const webhookData = await webhookRes.json()
  const webhookUrl = webhookData.result?.url
  if (webhookUrl) {
    return {
      chats: [],
      replied: 0,
      error: `Bot webhook is active (${webhookUrl}). For local setup, remove it: open Telegram setup and click "Use polling instead", or call deleteWebhook in BotFather.`,
    }
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100&timeout=0`)
  const data = await res.json()

  if (!data.ok) {
    return { chats: [], replied: 0, error: data.description ?? 'Telegram API error' }
  }

  const updates: TelegramUpdate[] = data.result ?? []
  const chats = new Map<string, TelegramChatInfo>()
  let replied = 0
  let maxUpdateId = 0

  for (const update of updates) {
    maxUpdateId = Math.max(maxUpdateId, update.update_id)
    const msg = update.message ?? update.edited_message
    if (!msg?.chat) continue

    const chat = msg.chat
    const chatId = String(chat.id)
    const name = chatDisplayName(chat)

    chats.set(chatId, {
      chatId,
      name,
      lastMessage: msg.text?.slice(0, 80),
    })

    if (msg.text?.trim()) {
      const ok = await processTelegramMessage(msg.text, chatId)
      if (ok) replied++
    }
  }

  if (maxUpdateId > 0) {
    await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?offset=${maxUpdateId + 1}&timeout=0`,
    )
  }

  return {
    chats: Array.from(chats.values()),
    replied,
  }
}

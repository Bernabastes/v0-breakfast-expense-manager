import { handleBotCommand } from './commands'
import { getTelegramRecipientChatIds } from './server'
import { sendTelegramRawMessage } from './server'

export function isAuthorizedTelegramChat(chatId: string): boolean {
  const { all } = getTelegramRecipientChatIds()
  return all.includes(chatId)
}

export async function processTelegramMessage(
  text: string | undefined,
  chatId: string,
): Promise<boolean> {
  if (!text?.trim()) return false

  const authorized = isAuthorizedTelegramChat(chatId)
  const reply = await handleBotCommand(text.trim(), chatId, authorized)
  return sendTelegramRawMessage(reply, chatId)
}

export async function registerBotCommands(): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return false

  const { BOT_COMMANDS } = await import('./commands')
  const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: BOT_COMMANDS.map((c) => ({
        command: c.command,
        description: c.description,
      })),
    }),
  })
  const data = await res.json()
  if (!data.ok) {
    console.error('[telegram] setMyCommands failed:', data.description)
    return false
  }
  return true
}

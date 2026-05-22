export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (!process.env.TELEGRAM_BOT_TOKEN) return

  const { ensureTelegramBotReady } = await import('./lib/telegram/polling')
  await ensureTelegramBotReady()
}

import type { TelegramNotificationPayload } from './types'

/** Fire-and-forget Telegram notification from client components. */
export function notifyTelegram(payload: TelegramNotificationPayload): void {
  fetch('/api/telegram/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Notifications are best-effort; do not block the UI
  })
}

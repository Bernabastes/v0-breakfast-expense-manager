export type TelegramNotificationType =
  | 'consumption_added'
  | 'consumption_deleted'
  | 'consumption_bulk'
  | 'deposit_added'
  | 'deposit_deleted'
  | 'member_added'
  | 'member_updated'
  | 'member_deleted'
  | 'food_added'
  | 'food_updated'
  | 'food_deleted'
  | 'food_status_changed'
  | 'savings_contribution'
  | 'savings_withdrawal'
  | 'low_balance'

export interface TelegramNotificationPayload {
  type: TelegramNotificationType
  data: Record<string, string | number | boolean | null | undefined>
}

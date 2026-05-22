import type { TelegramNotificationPayload } from './types'

function fmt(amount: number) {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
}

const TITLES: Record<TelegramNotificationPayload['type'], string> = {
  consumption_added: '🍳 Consumption recorded',
  consumption_deleted: '↩️ Consumption removed',
  consumption_bulk: '🍳 Bulk consumptions recorded',
  deposit_added: '💰 Deposit added',
  deposit_deleted: '↩️ Deposit removed',
  member_added: '👤 New member',
  member_updated: '✏️ Member updated',
  member_deleted: '🗑️ Member removed',
  food_added: '🍽️ Food item added',
  food_updated: '✏️ Food item updated',
  food_deleted: '🗑️ Food item removed',
  food_status_changed: '🍽️ Food availability changed',
  savings_contribution: '🐷 Savings contribution',
  savings_withdrawal: '🐷 Savings withdrawal',
  low_balance: '⚠️ Low balance alert',
}

export function formatTelegramMessage(payload: TelegramNotificationPayload): string {
  const { type, data } = payload
  const lines: string[] = [`<b>${TITLES[type]}</b>`]

  switch (type) {
    case 'consumption_added':
    case 'consumption_deleted':
      lines.push(`Member: <b>${data.memberName}</b>`)
      lines.push(`Item: ${data.foodName} × ${data.quantity}`)
      lines.push(`Amount: ${fmt(Number(data.amount))}`)
      if (data.balanceAfter != null) {
        lines.push(`Balance after: ${fmt(Number(data.balanceAfter))}`)
      }
      if (data.date) lines.push(`Date: ${data.date}`)
      break

    case 'consumption_bulk':
      lines.push(`Members: <b>${data.memberCount}</b>`)
      lines.push(`Total: ${fmt(Number(data.totalAmount))}`)
      if (data.summary) lines.push(String(data.summary))
      break

    case 'deposit_added':
    case 'deposit_deleted':
      lines.push(`Member: <b>${data.memberName}</b>`)
      lines.push(`Amount: ${fmt(Number(data.amount))}`)
      if (data.balanceAfter != null) {
        lines.push(`Balance after: ${fmt(Number(data.balanceAfter))}`)
      }
      if (data.notes) lines.push(`Notes: ${data.notes}`)
      break

    case 'member_added':
    case 'member_updated':
    case 'member_deleted':
      lines.push(`Name: <b>${data.memberName}</b>`)
      if (data.email) lines.push(`Email: ${data.email}`)
      if (data.balance != null) lines.push(`Balance: ${fmt(Number(data.balance))}`)
      break

    case 'food_added':
    case 'food_updated':
    case 'food_deleted':
      lines.push(`Food: <b>${data.foodName}</b>`)
      if (data.price != null) lines.push(`Price: ${fmt(Number(data.price))}`)
      break

    case 'food_status_changed':
      lines.push(`Food: <b>${data.foodName}</b>`)
      lines.push(`Status: ${data.isActive ? '✅ Active' : '❌ Inactive'}`)
      break

    case 'savings_contribution':
      lines.push(`Member: <b>${data.memberName}</b>`)
      lines.push(`Amount: ${fmt(Number(data.amount))}`)
      if (data.potBalance != null) {
        lines.push(`Pot balance: ${fmt(Number(data.potBalance))}`)
      }
      if (data.notes) lines.push(`Notes: ${data.notes}`)
      break

    case 'savings_withdrawal':
      lines.push(`Amount: ${fmt(Number(data.amount))}`)
      lines.push(`Reason: ${data.reason}`)
      if (data.potBalance != null) {
        lines.push(`Pot balance: ${fmt(Number(data.potBalance))}`)
      }
      break

    case 'low_balance':
      lines.push(`Member: <b>${data.memberName}</b>`)
      lines.push(`Balance: ${fmt(Number(data.balance))}`)
      lines.push(`Threshold: ${fmt(Number(data.threshold ?? 50))}`)
      break
  }

  if (data.actor) lines.push(`\n<i>By: ${data.actor}</i>`)

  return lines.join('\n')
}

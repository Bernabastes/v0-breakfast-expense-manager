import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTelegramNotification, isTelegramConfigured } from '@/lib/telegram/server'
import type { TelegramNotificationPayload, TelegramNotificationType } from '@/lib/telegram/types'

const ALLOWED_TYPES: TelegramNotificationType[] = [
  'consumption_added',
  'consumption_deleted',
  'consumption_bulk',
  'deposit_added',
  'deposit_deleted',
  'member_added',
  'member_updated',
  'member_deleted',
  'food_added',
  'food_updated',
  'food_deleted',
  'food_status_changed',
  'savings_contribution',
  'savings_withdrawal',
  'low_balance',
]

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'Telegram not configured' })
  }

  let body: TelegramNotificationPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body?.type || !ALLOWED_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
  }

  const actor = user.email ?? user.id
  const payload: TelegramNotificationPayload = {
    type: body.type,
    data: {
      ...body.data,
      actor: body.data?.actor ?? actor,
    },
  }

  const result = await sendTelegramNotification(payload)
  return NextResponse.json({ ok: true, ...result })
}

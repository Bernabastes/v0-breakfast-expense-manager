'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/language-context'
import { notifyTelegram } from '@/lib/telegram/notify-client'

interface LowBalanceMember {
  id: string
  name: string
  balance: number
}

interface Notification {
  id: string
  member: LowBalanceMember
  timestamp: number
}

const LOW_BALANCE_THRESHOLD = 50
const NOTIFICATION_DURATION = 10000 // 5 seconds
const CHECK_INTERVAL = 60000 // 1 minute

export function LowBalanceAlert() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifiedMembers, setNotifiedMembers] = useState<Set<string>>(new Set())
  const { t } = useLanguage()

  const checkBalances = useCallback(async () => {
    const supabase = createClient()

    const { data: members, error } = await supabase
      .from('members')
      .select('id, name, balance')
      .lt('balance', LOW_BALANCE_THRESHOLD)

    if (error || !members) return

    const newNotifications: Notification[] = []
    const newNotifiedIds = new Set(notifiedMembers)

    members.forEach((member) => {
      // Only notify if we haven't notified about this member yet
      // or if their balance changed to a new low value
      const memberKey = `${member.id}-${Math.floor(Number(member.balance))}`

      if (!notifiedMembers.has(memberKey)) {
        newNotifications.push({
          id: `${member.id}-${Date.now()}`,
          member: {
            id: member.id,
            name: member.name,
            balance: Number(member.balance),
          },
          timestamp: Date.now(),
        })
        newNotifiedIds.add(memberKey)
      }
    })

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...prev, ...newNotifications])
      setNotifiedMembers(newNotifiedIds)
      for (const n of newNotifications) {
        notifyTelegram({
          type: 'low_balance',
          data: {
            memberName: n.member.name,
            balance: n.member.balance,
            threshold: LOW_BALANCE_THRESHOLD,
          },
        })
      }
    }
  }, [notifiedMembers])

  // Auto-dismiss notifications after duration
  useEffect(() => {
    if (notifications.length === 0) return

    const timers = notifications.map((notification) => {
      const elapsed = Date.now() - notification.timestamp
      const remaining = Math.max(NOTIFICATION_DURATION - elapsed, 0)

      return setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        )
      }, remaining)
    })

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [notifications])

  // Initial check and periodic polling
  useEffect(() => {
    // Check immediately on mount
    checkBalances()

    // Set up periodic checking
    const interval = setInterval(checkBalances, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [checkBalances])

  // Also subscribe to realtime changes for instant notifications
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('members-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members',
        },
        (payload) => {
          if (payload.new && 'balance' in payload.new) {
            const member = payload.new as { id: string; name: string; balance: number }
            const balance = Number(member.balance)

            if (balance < LOW_BALANCE_THRESHOLD) {
              const memberKey = `${member.id}-${Math.floor(balance)}`

              if (!notifiedMembers.has(memberKey)) {
                setNotifications((prev) => [
                  ...prev,
                  {
                    id: `${member.id}-${Date.now()}`,
                    member: {
                      id: member.id,
                      name: member.name,
                      balance: balance,
                    },
                    timestamp: Date.now(),
                  },
                ])
                setNotifiedMembers((prev) => new Set([...prev, memberKey]))
                notifyTelegram({
                  type: 'low_balance',
                  data: {
                    memberName: member.name,
                    balance,
                    threshold: LOW_BALANCE_THRESHOLD,
                  },
                })
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [notifiedMembers])

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={cn(
            "relative flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-lg",
            "dark:border-amber-800 dark:bg-amber-950/90",
            "animate-in slide-in-from-right-full fade-in duration-300"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {t.notifications.lowBalance}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-semibold">{notification.member.name}</span>{' '}
              {t.notifications.balanceBelow}:{' '}
              <span className="font-semibold">
                {notification.member.balance.toFixed(2)} {t.common.currency}
              </span>
            </p>
          </div>

          <button
            onClick={() => dismissNotification(notification.id)}
            className="shrink-0 rounded-md p-1 text-amber-600 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-900 dark:hover:text-amber-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </button>

          {/* Progress bar for auto-dismiss */}
          <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg">
            <div
              className="h-full bg-amber-400 dark:bg-amber-600 animate-shrink-width"
              style={{
                animationDuration: `${NOTIFICATION_DURATION}ms`,
                animationTimingFunction: 'linear',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

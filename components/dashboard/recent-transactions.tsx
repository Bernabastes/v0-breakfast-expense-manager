'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Transaction } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('transactions')
        .select('*, member:members(*)')
        .order('created_at', { ascending: false })
        .limit(10)
      
      setTransactions(data || [])
      setLoading(false)
    }

    fetchTransactions()
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No transactions yet. Start by adding a deposit or recording a consumption.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const isDeposit = transaction.type === 'deposit'
        return (
          <div key={transaction.id} className="flex items-center gap-4">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isDeposit 
                ? "bg-green-100 text-green-700 dark:bg-green-900/20" 
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/20"
            )}>
              {isDeposit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {transaction.member?.name || 'Unknown'}
              </p>
              <p className="text-sm text-muted-foreground">
                {transaction.description || (isDeposit ? 'Deposit' : 'Consumption')}
              </p>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-semibold",
                isDeposit ? "text-green-600" : "text-amber-600"
              )}>
                {isDeposit ? '+' : '-'}{Math.abs(Number(transaction.amount)).toLocaleString()} ETB
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(transaction.created_at), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

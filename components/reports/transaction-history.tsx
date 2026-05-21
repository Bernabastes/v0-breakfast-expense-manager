'use client'

import { Transaction } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface TransactionHistoryProps {
  transactions: Transaction[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No transactions recorded yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {transactions.map((transaction) => {
            const isDeposit = transaction.type === 'deposit'
            const isPositive = Number(transaction.amount) > 0
            
            return (
              <div key={transaction.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {transaction.member?.name || 'Unknown'}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        isDeposit 
                          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/20" 
                          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20"
                      )}
                    >
                      {isDeposit ? 'Deposit' : 'Consumption'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {transaction.description || (isDeposit ? 'Deposit' : 'Consumption')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "font-semibold",
                    isPositive ? "text-green-600" : "text-amber-600"
                  )}>
                    {isPositive ? '+' : ''}{Number(transaction.amount).toLocaleString()} ETB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Balance: {Number(transaction.balance_after).toLocaleString()} ETB
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

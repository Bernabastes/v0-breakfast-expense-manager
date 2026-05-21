'use client'

import { Member } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MemberBalanceCardsProps {
  members: Member[]
}

export function MemberBalanceCards({ members }: MemberBalanceCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {members.map((member) => {
        const balance = Number(member.balance)
        const isNegative = balance < 0
        const isZero = balance === 0
        
        return (
          <Card key={member.id} className="relative overflow-hidden">
            <div className={cn(
              "absolute inset-x-0 top-0 h-1",
              isNegative ? "bg-red-500" : isZero ? "bg-gray-300" : "bg-green-500"
            )} />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {member.name}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold",
                    isNegative ? "text-red-600" : isZero ? "text-muted-foreground" : "text-green-600"
                  )}>
                    {balance.toLocaleString()} ETB
                  </p>
                </div>
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold",
                  isNegative 
                    ? "bg-red-100 text-red-700 dark:bg-red-900/20" 
                    : isZero 
                      ? "bg-gray-100 text-gray-700 dark:bg-gray-800" 
                      : "bg-green-100 text-green-700 dark:bg-green-900/20"
                )}>
                  {member.name.charAt(0)}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

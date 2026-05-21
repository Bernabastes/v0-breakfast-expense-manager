'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Member, Food } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, Minus, Plus } from 'lucide-react'

interface QuickAddConsumptionProps {
  members: Member[]
  foods: Food[]
}

interface MemberConsumption {
  [memberId: string]: {
    [foodId: string]: number
  }
}

export function QuickAddConsumption({ members, foods }: QuickAddConsumptionProps) {
  const [consumptions, setConsumptions] = useState<MemberConsumption>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const getQuantity = (memberId: string, foodId: string) => {
    return consumptions[memberId]?.[foodId] || 0
  }

  const updateQuantity = (memberId: string, foodId: string, delta: number) => {
    setConsumptions((prev) => {
      const memberConsumptions = prev[memberId] || {}
      const currentQty = memberConsumptions[foodId] || 0
      const newQty = Math.max(0, currentQty + delta)

      if (newQty === 0) {
        const { [foodId]: _, ...rest } = memberConsumptions
        if (Object.keys(rest).length === 0) {
          const { [memberId]: __, ...restMembers } = prev
          return restMembers
        }
        return { ...prev, [memberId]: rest }
      }

      return {
        ...prev,
        [memberId]: { ...memberConsumptions, [foodId]: newQty },
      }
    })
    setSuccess(false)
  }

  const hasConsumptions = Object.keys(consumptions).length > 0

  const getTotalForMember = (memberId: string) => {
    const memberConsumptions = consumptions[memberId] || {}
    return Object.entries(memberConsumptions).reduce((total, [foodId, qty]) => {
      const food = foods.find((f) => f.id === foodId)
      return total + (food ? Number(food.price) * qty : 0)
    }, 0)
  }

  const getGrandTotal = () => {
    return Object.keys(consumptions).reduce((total, memberId) => {
      return total + getTotalForMember(memberId)
    }, 0)
  }

  const handleSubmit = async () => {
    if (!hasConsumptions) return
    setIsLoading(true)

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    for (const [memberId, foodConsumptions] of Object.entries(consumptions)) {
      // Get current member balance
      const { data: member } = await supabase
        .from('members')
        .select('balance')
        .eq('id', memberId)
        .single()

      let runningBalance = Number(member?.balance || 0)

      for (const [foodId, quantity] of Object.entries(foodConsumptions)) {
        const food = foods.find((f) => f.id === foodId)
        if (!food) continue

        const unitPrice = Number(food.price)
        const totalPrice = unitPrice * quantity
        runningBalance -= totalPrice

        // Insert consumption
        const { data: consumption } = await supabase
          .from('consumptions')
          .insert({
            member_id: memberId,
            food_id: foodId,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            consumption_date: today,
          })
          .select()
          .single()

        // Record transaction
        if (consumption) {
          await supabase.from('transactions').insert({
            member_id: memberId,
            type: 'consumption',
            amount: -totalPrice,
            balance_after: runningBalance,
            reference_id: consumption.id,
            description: `${food.name} x${quantity}`,
          })
        }
      }

      // Update member balance
      await supabase
        .from('members')
        .update({
          balance: runningBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
    }

    setConsumptions({})
    setSuccess(true)
    setIsLoading(false)
    router.refresh()
  }

  if (foods.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No active food items. Please add food items in the Food Menu section first.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Food selection grid for each member */}
      <div className="grid gap-4 md:grid-cols-2">
        {members.map((member) => {
          const memberTotal = getTotalForMember(member.id)
          return (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription>
                      Balance: {Number(member.balance).toLocaleString()} ETB
                    </CardDescription>
                  </div>
                  {memberTotal > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Today</p>
                      <p className="font-semibold text-amber-600">
                        -{memberTotal.toLocaleString()} ETB
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {foods.map((food) => {
                    const qty = getQuantity(member.id, food.id)
                    return (
                      <div
                        key={food.id}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-3 transition-colors",
                          qty > 0 && "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
                        )}
                      >
                        <div>
                          <p className="font-medium">{food.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {Number(food.price).toLocaleString()} ETB
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(member.id, food.id, -1)}
                            disabled={qty === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{qty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(member.id, food.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary and submit */}
      {hasConsumptions && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total for today</p>
                <p className="text-2xl font-bold text-amber-600">
                  {getGrandTotal().toLocaleString()} ETB
                </p>
              </div>
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-700"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Recording...' : 'Record Consumptions'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400">
          <Check className="h-5 w-5" />
          <p>Consumptions recorded successfully!</p>
        </div>
      )}
    </div>
  )
}

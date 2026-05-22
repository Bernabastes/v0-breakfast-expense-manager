'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Consumption } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
import { notifyTelegram } from '@/lib/telegram/notify-client'

interface DeleteConsumptionDialogProps {
  consumption: Consumption
}

export function DeleteConsumptionDialog({ consumption }: DeleteConsumptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsLoading(true)

    const supabase = createClient()
    const totalPrice = Number(consumption.total_price)

    // Get current member balance
    const { data: member } = await supabase
      .from('members')
      .select('balance')
      .eq('id', consumption.member_id)
      .single()

    if (member) {
      const newBalance = Number(member.balance) + totalPrice

      // Update member balance (refund)
      await supabase
        .from('members')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', consumption.member_id)

      // Record reversal transaction
      await supabase.from('transactions').insert({
        member_id: consumption.member_id,
        type: 'consumption',
        amount: totalPrice,
        balance_after: newBalance,
        reference_id: consumption.id,
        description: `Refund: ${consumption.food?.name || 'Unknown'} x${consumption.quantity}`,
      })
    }

    // Delete the consumption
    await supabase.from('consumptions').delete().eq('id', consumption.id)

    const newBalance =
      member != null ? Number(member.balance) + totalPrice : undefined
    notifyTelegram({
      type: 'consumption_deleted',
      data: {
        memberName: consumption.member?.name ?? 'Member',
        foodName: consumption.food?.name ?? 'Unknown',
        quantity: consumption.quantity,
        amount: totalPrice,
        balanceAfter: newBalance,
      },
    })

    setOpen(false)
    router.refresh()
    setIsLoading(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Consumption</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this consumption? 
            The amount of {Number(consumption.total_price).toLocaleString()} ETB will be refunded to {consumption.member?.name || "the member"}&apos;s balance.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

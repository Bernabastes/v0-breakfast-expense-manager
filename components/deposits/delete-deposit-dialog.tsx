'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Deposit } from '@/lib/types'
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

interface DeleteDepositDialogProps {
  deposit: Deposit
}

export function DeleteDepositDialog({ deposit }: DeleteDepositDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsLoading(true)

    const supabase = createClient()
    const depositAmount = Number(deposit.amount)

    // Get current member balance
    const { data: member } = await supabase
      .from('members')
      .select('balance')
      .eq('id', deposit.member_id)
      .single()

    if (member) {
      const newBalance = Number(member.balance) - depositAmount

      // Update member balance
      await supabase
        .from('members')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', deposit.member_id)

      // Record reversal transaction
      await supabase.from('transactions').insert({
        member_id: deposit.member_id,
        type: 'deposit',
        amount: -depositAmount,
        balance_after: newBalance,
        reference_id: deposit.id,
        description: 'Deposit reversal',
      })
    }

    // Delete the deposit
    await supabase.from('deposits').delete().eq('id', deposit.id)

    const newBalance =
      member != null ? Number(member.balance) - depositAmount : undefined
    notifyTelegram({
      type: 'deposit_deleted',
      data: {
        memberName: deposit.member?.name ?? 'Member',
        amount: depositAmount,
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
          <AlertDialogTitle>Delete Deposit</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this deposit of {Number(deposit.amount).toLocaleString()} ETB? 
            This will deduct the amount from {deposit.member?.name || "the member"}&apos;s balance.
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

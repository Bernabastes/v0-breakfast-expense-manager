'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Member } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'

interface AddDepositDialogProps {
  members: Member[]
}

export function AddDepositDialog({ members }: AddDepositDialogProps) {
  const [open, setOpen] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const depositAmount = parseFloat(amount)
    
    // Get current member balance
    const { data: member } = await supabase
      .from('members')
      .select('balance')
      .eq('id', memberId)
      .single()

    const currentBalance = member?.balance || 0
    const newBalance = Number(currentBalance) + depositAmount

    // Insert deposit
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .insert({
        member_id: memberId,
        amount: depositAmount,
        notes: notes || null,
      })
      .select()
      .single()

    if (!depositError && deposit) {
      // Update member balance
      await supabase
        .from('members')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)

      // Record transaction
      await supabase.from('transactions').insert({
        member_id: memberId,
        type: 'deposit',
        amount: depositAmount,
        balance_after: newBalance,
        reference_id: deposit.id,
        description: `Deposit${notes ? ': ' + notes : ''}`,
      })

      setMemberId('')
      setAmount('')
      setNotes('')
      setOpen(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Deposit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Deposit</DialogTitle>
          <DialogDescription>
            Record a new deposit for a member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="member">Member</Label>
              <Select value={memberId} onValueChange={setMemberId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (ETB)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 500"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={isLoading || !memberId}>
              {isLoading ? 'Adding...' : 'Add Deposit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

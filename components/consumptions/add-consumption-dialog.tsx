'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Member, Food } from '@/lib/types'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'

interface AddConsumptionDialogProps {
  members: Member[]
  foods: Food[]
}

export function AddConsumptionDialog({ members, foods }: AddConsumptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [foodId, setFoodId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const selectedFood = foods.find((f) => f.id === foodId)
  const totalPrice = selectedFood ? Number(selectedFood.price) * parseInt(quantity || '0') : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFood) return
    setIsLoading(true)

    const supabase = createClient()
    const qty = parseInt(quantity)
    const unitPrice = Number(selectedFood.price)
    const total = unitPrice * qty

    // Get current member balance
    const { data: member } = await supabase
      .from('members')
      .select('balance')
      .eq('id', memberId)
      .single()

    const currentBalance = Number(member?.balance || 0)
    const newBalance = currentBalance - total

    // Insert consumption
    const { data: consumption, error } = await supabase
      .from('consumptions')
      .insert({
        member_id: memberId,
        food_id: foodId,
        quantity: qty,
        unit_price: unitPrice,
        total_price: total,
        consumption_date: date,
      })
      .select()
      .single()

    if (!error && consumption) {
      // Update member balance
      await supabase
        .from('members')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)

      // Record transaction
      await supabase.from('transactions').insert({
        member_id: memberId,
        type: 'consumption',
        amount: -total,
        balance_after: newBalance,
        reference_id: consumption.id,
        description: `${selectedFood.name} x${qty}`,
      })

      setMemberId('')
      setFoodId('')
      setQuantity('1')
      setDate(new Date().toISOString().split('T')[0])
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
          Add Consumption
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Consumption</DialogTitle>
          <DialogDescription>
            Record a consumption for a member.
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
                      {member.name} ({Number(member.balance).toLocaleString()} ETB)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="food">Food Item</Label>
              <Select value={foodId} onValueChange={setFoodId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a food item" />
                </SelectTrigger>
                <SelectContent>
                  {foods.map((food) => (
                    <SelectItem key={food.id} value={food.id}>
                      {food.name} ({Number(food.price).toLocaleString()} ETB)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            {selectedFood && parseInt(quantity) > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-amber-600">
                  {totalPrice.toLocaleString()} ETB
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isLoading || !memberId || !foodId}
            >
              {isLoading ? 'Adding...' : 'Add Consumption'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

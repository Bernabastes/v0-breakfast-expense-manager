'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PiggyBank, Plus, ArrowDownCircle, Gift, Users, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { SavingsPot, SavingsContribution, SavingsWithdrawal, Member } from '@/lib/types'

export default function SavingsPotPage() {
  const [pot, setPot] = useState<SavingsPot | null>(null)
  const [contributions, setContributions] = useState<SavingsContribution[]>([])
  const [withdrawals, setWithdrawals] = useState<SavingsWithdrawal[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [contributeOpen, setContributeOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const { t, language } = useLanguage()

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    
    const [potRes, contribRes, withdrawRes, membersRes] = await Promise.all([
      supabase.from('savings_pot').select('*').limit(1).single(),
      supabase.from('savings_contributions').select('*, member:members(*)').order('created_at', { ascending: false }),
      supabase.from('savings_withdrawals').select('*').order('created_at', { ascending: false }),
      supabase.from('members').select('*').order('name'),
    ])

    if (potRes.data) setPot(potRes.data)
    if (contribRes.data) setContributions(contribRes.data)
    if (withdrawRes.data) setWithdrawals(withdrawRes.data)
    if (membersRes.data) setMembers(membersRes.data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleContribute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const memberId = formData.get('member_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const notes = formData.get('notes') as string

    if (!memberId || !amount || amount <= 0 || !pot) {
      toast.error(language === 'am' ? 'እባክዎ ሁሉንም መስኮች ይሙሉ' : 'Please fill all fields')
      return
    }

    const supabase = createClient()
    
    // Add contribution
    const { error: contribError } = await supabase
      .from('savings_contributions')
      .insert({ pot_id: pot.id, member_id: memberId, amount, notes: notes || null })

    if (contribError) {
      toast.error(language === 'am' ? 'መዋጮ ማከል አልተሳካም' : 'Failed to add contribution')
      return
    }

    // Update pot balance
    await supabase
      .from('savings_pot')
      .update({ current_amount: pot.current_amount + amount })
      .eq('id', pot.id)

    toast.success(language === 'am' ? 'መዋጮ ተጨምሯል' : 'Contribution added')
    setContributeOpen(false)
    fetchData()
  }

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = parseFloat(formData.get('amount') as string)
    const reason = formData.get('reason') as string

    if (!amount || amount <= 0 || !reason || !pot) {
      toast.error(language === 'am' ? 'እባክዎ ሁሉንም መስኮች ይሙሉ' : 'Please fill all fields')
      return
    }

    if (amount > pot.current_amount) {
      toast.error(language === 'am' ? 'በቂ ገንዘብ የለም' : 'Insufficient funds')
      return
    }

    const supabase = createClient()
    
    // Add withdrawal
    const { error: withdrawError } = await supabase
      .from('savings_withdrawals')
      .insert({ pot_id: pot.id, amount, reason })

    if (withdrawError) {
      toast.error(language === 'am' ? 'ገንዘብ ማውጣት አልተሳካም' : 'Failed to withdraw')
      return
    }

    // Update pot balance
    await supabase
      .from('savings_pot')
      .update({ current_amount: pot.current_amount - amount })
      .eq('id', pot.id)

    toast.success(language === 'am' ? 'ገንዘብ ወጥቷል' : 'Withdrawal successful')
    setWithdrawOpen(false)
    fetchData()
  }

  // Calculate member contributions totals
  const memberTotals = contributions.reduce((acc, c) => {
    const name = c.member?.name || 'Unknown'
    acc[name] = (acc[name] || 0) + Number(c.amount)
    return acc
  }, {} as Record<string, number>)

  const sortedMembers = Object.entries(memberTotals).sort((a, b) => b[1] - a[1])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    )
  }

  const progressPercent = pot?.target_amount ? (pot.current_amount / pot.target_amount) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {language === 'am' ? 'የቡድን ቁጠባ' : 'Group Savings'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'am' 
              ? 'ለልዩ አጋጣሚዎች የጋራ ቁጠባ' 
              : 'Shared savings for special occasions'}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'am' ? 'አዋጭ' : 'Contribute'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleContribute}>
                <DialogHeader>
                  <DialogTitle>
                    {language === 'am' ? 'ለቁጠባ አዋጭ' : 'Contribute to Savings'}
                  </DialogTitle>
                  <DialogDescription>
                    {language === 'am' 
                      ? 'ለጋራ ቁጠባው ገንዘብ ጨምር' 
                      : 'Add money to the group savings pot'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{language === 'am' ? 'አባል' : 'Member'}</Label>
                    <Select name="member_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'am' ? 'አባል ይምረጡ' : 'Select member'} />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'am' ? 'መጠን' : 'Amount'} ({t.common.currency})</Label>
                    <Input 
                      name="amount" 
                      type="number" 
                      min="1" 
                      step="0.01" 
                      required 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'am' ? 'ማስታወሻ' : 'Notes'}</Label>
                    <Textarea 
                      name="notes" 
                      placeholder={language === 'am' ? 'ለምን ምክንያት...' : 'Reason for contribution...'}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setContributeOpen(false)}>
                    {t.common.cancel}
                  </Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                    {language === 'am' ? 'አዋጭ' : 'Contribute'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                {language === 'am' ? 'አውጣ' : 'Withdraw'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleWithdraw}>
                <DialogHeader>
                  <DialogTitle>
                    {language === 'am' ? 'ከቁጠባ አውጣ' : 'Withdraw from Savings'}
                  </DialogTitle>
                  <DialogDescription>
                    {language === 'am' 
                      ? 'ለልዩ አጋጣሚ ገንዘብ አውጣ' 
                      : 'Withdraw money for a special occasion'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{language === 'am' ? 'መጠን' : 'Amount'} ({t.common.currency})</Label>
                    <Input 
                      name="amount" 
                      type="number" 
                      min="1" 
                      max={pot?.current_amount || 0}
                      step="0.01" 
                      required 
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'am' ? 'ያለ ገንዘብ' : 'Available'}: {pot?.current_amount.toFixed(2)} {t.common.currency}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'am' ? 'ምክንያት' : 'Reason'}</Label>
                    <Textarea 
                      name="reason" 
                      required
                      placeholder={language === 'am' ? 'ለምን ገንዘቡ እንደሚወጣ...' : 'Why is the money being withdrawn...'}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setWithdrawOpen(false)}>
                    {t.common.cancel}
                  </Button>
                  <Button type="submit" variant="destructive">
                    {language === 'am' ? 'አውጣ' : 'Withdraw'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Stats Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-600 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {pot?.name || 'Group Savings'}
                </p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {pot?.current_amount.toFixed(2)} {t.common.currency}
                </p>
              </div>
            </div>
            {pot?.target_amount && (
              <div className="text-right">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {language === 'am' ? 'ግብ' : 'Target'}
                </p>
                <p className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                  {pot.target_amount.toFixed(2)} {t.common.currency}
                </p>
              </div>
            )}
          </div>
          {pot?.target_amount && (
            <div className="space-y-2">
              <Progress value={Math.min(progressPercent, 100)} className="h-3" />
              <p className="text-sm text-amber-700 dark:text-amber-300 text-center">
                {progressPercent.toFixed(1)}% {language === 'am' ? 'ተሳክቷል' : 'achieved'}
              </p>
            </div>
          )}
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-4">
            {pot?.description}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'am' ? 'ጠቅላላ መዋጮዎች' : 'Total Contributions'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contributions.reduce((sum, c) => sum + Number(c.amount), 0).toFixed(2)} {t.common.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              {contributions.length} {language === 'am' ? 'መዋጮዎች' : 'contributions'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'am' ? 'ጠቅላላ ወጪዎች' : 'Total Withdrawals'}
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {withdrawals.reduce((sum, w) => sum + Number(w.amount), 0).toFixed(2)} {t.common.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              {withdrawals.length} {language === 'am' ? 'ወጪዎች' : 'withdrawals'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'am' ? 'አበርካቾች' : 'Contributors'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(memberTotals).length}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'am' ? 'ንቁ አባላት' : 'active members'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              {language === 'am' ? 'ከፍተኛ አበርካቾች' : 'Top Contributors'}
            </CardTitle>
            <CardDescription>
              {language === 'am' ? 'በጠቅላላ መዋጮ' : 'By total contribution'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                {language === 'am' ? 'ገና መዋጮ የለም' : 'No contributions yet'}
              </p>
            ) : (
              <div className="space-y-3">
                {sortedMembers.map(([name, total], idx) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-amber-500 text-white' :
                        idx === 1 ? 'bg-gray-400 text-white' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="font-medium">{name}</span>
                    </div>
                    <span className="font-semibold text-amber-600">
                      {total.toFixed(2)} {t.common.currency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'am' ? 'የቅርብ ጊዜ እንቅስቃሴ' : 'Recent Activity'}
            </CardTitle>
            <CardDescription>
              {language === 'am' ? 'መዋጮዎች እና ወጪዎች' : 'Contributions and withdrawals'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {[...contributions.map(c => ({ ...c, type: 'contribution' as const })), 
                ...withdrawals.map(w => ({ ...w, type: 'withdrawal' as const }))]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        item.type === 'contribution' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {item.type === 'contribution' 
                          ? <Plus className="h-4 w-4 text-green-600" />
                          : <ArrowDownCircle className="h-4 w-4 text-red-600" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {item.type === 'contribution' 
                            ? (item as SavingsContribution).member?.name 
                            : (item as SavingsWithdrawal).reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      item.type === 'contribution' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.type === 'contribution' ? '+' : '-'}{Number(item.amount).toFixed(2)} {t.common.currency}
                    </span>
                  </div>
                ))}
              {contributions.length === 0 && withdrawals.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  {language === 'am' ? 'ገና እንቅስቃሴ የለም' : 'No activity yet'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

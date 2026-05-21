import { createClient } from '@/lib/supabase/server'
import { DepositsTable } from '@/components/deposits/deposits-table'
import { AddDepositDialog } from '@/components/deposits/add-deposit-dialog'

export default async function DepositsPage() {
  const supabase = await createClient()
  
  const [depositsRes, membersRes] = await Promise.all([
    supabase
      .from('deposits')
      .select('*, member:members(*)')
      .order('created_at', { ascending: false }),
    supabase.from('members').select('*').order('name'),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deposits</h1>
          <p className="text-muted-foreground">
            Track member deposits and top-ups
          </p>
        </div>
        <AddDepositDialog members={membersRes.data || []} />
      </div>

      <DepositsTable deposits={depositsRes.data || []} />
    </div>
  )
}

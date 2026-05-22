import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from '@/components/reports/reports-client'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [membersRes, consumptionsRes, depositsRes, transactionsRes, foodsRes] = await Promise.all([
    supabase.from('members').select('*').order('name'),
    supabase
      .from('consumptions')
      .select('*, member:members(*), food:foods(*)')
      .order('consumption_date', { ascending: false }),
    supabase.from('deposits').select('*, member:members(*)').order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('*, member:members(*)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('foods').select('*'),
  ])

  return (
    <ReportsClient
      members={membersRes.data || []}
      consumptions={consumptionsRes.data || []}
      deposits={depositsRes.data || []}
      transactions={transactionsRes.data || []}
      foods={foodsRes.data || []}
    />
  )
}

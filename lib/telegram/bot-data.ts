import { createAdminClient } from '@/lib/supabase/admin'
import type { Food, Member } from '@/lib/types'

const LOW_BALANCE_THRESHOLD = 50

function fmt(amount: number) {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
}

function dbError() {
  return {
    ok: false as const,
    error:
      'Database not configured for the bot. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Project Settings → API → service_role).',
  }
}

export function findMemberByQuery(members: Member[], query: string): Member | null {
  const q = query.trim().toLowerCase()
  if (!q) return null

  const exact = members.find((m) => m.name.toLowerCase() === q)
  if (exact) return exact

  const contains = members.filter((m) => m.name.toLowerCase().includes(q))
  if (contains.length === 1) return contains[0]

  const emailMatch = members.find((m) => m.email?.toLowerCase().includes(q))
  if (emailMatch) return emailMatch

  const wordMatch = members.filter((m) =>
    q.split(/\s+/).every((word) => m.name.toLowerCase().includes(word)),
  )
  if (wordMatch.length === 1) return wordMatch[0]

  return contains[0] ?? null
}

export async function fetchMembers(): Promise<
  { ok: true; members: Member[] } | { ok: false; error: string }
> {
  const supabase = createAdminClient()
  if (!supabase) return dbError()

  const { data, error } = await supabase.from('members').select('*').order('name')
  if (error) return { ok: false, error: error.message }
  return { ok: true, members: (data ?? []) as Member[] }
}

export async function fetchMemberBalance(nameQuery: string) {
  const res = await fetchMembers()
  if (!res.ok) return res

  const member = findMemberByQuery(res.members, nameQuery)
  if (!member) {
    const names = res.members.map((m) => m.name).join(', ')
    return {
      ok: false as const,
      error: `Member not found. Try: ${names || 'add members in the app'}`,
    }
  }

  return { ok: true as const, member }
}

export async function fetchSummary() {
  const supabase = createAdminClient()
  if (!supabase) return dbError()

  const [membersRes, depositsRes, consumptionsRes] = await Promise.all([
    supabase.from('members').select('balance'),
    supabase.from('deposits').select('amount'),
    supabase.from('consumptions').select('total_price'),
  ])

  if (membersRes.error) return { ok: false, error: membersRes.error.message }

  const totalBalance =
    membersRes.data?.reduce((sum, m) => sum + Number(m.balance), 0) ?? 0
  const totalDeposits =
    depositsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) ?? 0
  const totalSpending =
    consumptionsRes.data?.reduce((sum, c) => sum + Number(c.total_price), 0) ?? 0

  return {
    ok: true as const,
    memberCount: membersRes.data?.length ?? 0,
    totalBalance,
    totalDeposits,
    totalSpending,
  }
}

export async function fetchLowBalanceMembers() {
  const res = await fetchMembers()
  if (!res.ok) return res

  const low = res.members
    .filter((m) => Number(m.balance) < LOW_BALANCE_THRESHOLD)
    .sort((a, b) => Number(a.balance) - Number(b.balance))

  return { ok: true as const, members: low, threshold: LOW_BALANCE_THRESHOLD }
}

export async function fetchRecentTransactions(limit = 8) {
  const supabase = createAdminClient()
  if (!supabase) return dbError()

  const { data, error } = await supabase
    .from('transactions')
    .select('*, member:members(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { ok: false, error: error.message }
  return { ok: true as const, transactions: data ?? [] }
}

export async function fetchTodayConsumptions() {
  const supabase = createAdminClient()
  if (!supabase) return dbError()

  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('consumptions')
    .select('*, member:members(name), food:foods(name)')
    .eq('consumption_date', today)
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }

  const total =
    data?.reduce((sum, c) => sum + Number(c.total_price), 0) ?? 0

  return { ok: true as const, consumptions: data ?? [], total, date: today }
}

export async function fetchActiveFoods() {
  const supabase = createAdminClient()
  if (!supabase) return dbError()

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) return { ok: false, error: error.message }
  return { ok: true as const, foods: (data ?? []) as Food[] }
}

export async function fetchSavingsPot() {
  const supabase = createAdminClient()
  if (!supabase) return dbError()

  const { data, error } = await supabase
    .from('savings_pot')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: true as const, pot: null }
  return { ok: true as const, pot: data }
}

export { fmt, LOW_BALANCE_THRESHOLD }

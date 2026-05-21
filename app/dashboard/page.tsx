import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UtensilsCrossed, PiggyBank, Wallet } from 'lucide-react'
import { MemberBalanceCards } from '@/components/dashboard/member-balance-cards'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all stats in parallel
  const [membersRes, depositsRes, consumptionsRes] = await Promise.all([
    supabase.from('members').select('*'),
    supabase.from('deposits').select('amount'),
    supabase.from('consumptions').select('total_price'),
  ])

  const members = membersRes.data || []
  const totalDeposits = depositsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0
  const totalConsumptions = consumptionsRes.data?.reduce((sum, c) => sum + Number(c.total_price), 0) || 0
  const totalBalance = members.reduce((sum, m) => sum + Number(m.balance), 0)

  const stats = [
    {
      name: 'Total Members',
      value: members.length.toString(),
      icon: Users,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    },
    {
      name: 'Total Deposits',
      value: `${totalDeposits.toLocaleString()} ETB`,
      icon: PiggyBank,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    },
    {
      name: 'Total Spent',
      value: `${totalConsumptions.toLocaleString()} ETB`,
      icon: UtensilsCrossed,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
    },
    {
      name: 'Total Balance',
      value: `${totalBalance.toLocaleString()} ETB`,
      icon: Wallet,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your breakfast expense tracking
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Member Balance Cards */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Member Balances</h2>
        <MemberBalanceCards members={members} />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest deposits and consumptions</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentTransactions />
        </CardContent>
      </Card>
    </div>
  )
}

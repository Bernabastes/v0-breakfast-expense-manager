'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UtensilsCrossed, PiggyBank, Wallet } from 'lucide-react'
import { MemberBalanceCards } from '@/components/dashboard/member-balance-cards'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { useLanguage } from '@/lib/i18n/language-context'
import { useEffect, useState } from 'react'
import { Member } from '@/lib/types'

export default function DashboardPage() {
  const { t } = useLanguage()
  const [members, setMembers] = useState<Member[]>([])
  const [totalDeposits, setTotalDeposits] = useState(0)
  const [totalConsumptions, setTotalConsumptions] = useState(0)
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const [membersRes, depositsRes, consumptionsRes] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('deposits').select('amount'),
        supabase.from('consumptions').select('total_price'),
      ])

      const membersData = membersRes.data || []
      setMembers(membersData)
      setTotalDeposits(depositsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0)
      setTotalConsumptions(consumptionsRes.data?.reduce((sum, c) => sum + Number(c.total_price), 0) || 0)
      setTotalBalance(membersData.reduce((sum, m) => sum + Number(m.balance), 0))
      setLoading(false)
    }
    
    fetchData()
  }, [])

  const stats = [
    {
      name: t.dashboard.totalMembers,
      value: members.length.toString(),
      icon: Users,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    },
    {
      name: t.dashboard.totalDeposits,
      value: `${totalDeposits.toLocaleString()} ${t.common.currency}`,
      icon: PiggyBank,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    },
    {
      name: t.dashboard.totalSpent,
      value: `${totalConsumptions.toLocaleString()} ${t.common.currency}`,
      icon: UtensilsCrossed,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
    },
    {
      name: t.dashboard.totalBalance,
      value: `${totalBalance.toLocaleString()} ${t.common.currency}`,
      icon: Wallet,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h1>
        <p className="text-muted-foreground">
          {t.dashboard.subtitle}
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
        <h2 className="mb-4 text-xl font-semibold">{t.dashboard.memberBalances}</h2>
        <MemberBalanceCards members={members} />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.recentTransactions}</CardTitle>
          <CardDescription>{t.dashboard.latestActivity}</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentTransactions />
        </CardContent>
      </Card>
    </div>
  )
}

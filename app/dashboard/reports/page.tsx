import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SpendingChart } from '@/components/reports/spending-chart'
import { MemberSpendingChart } from '@/components/reports/member-spending-chart'
import { FoodPopularityChart } from '@/components/reports/food-popularity-chart'
import { TransactionHistory } from '@/components/reports/transaction-history'
import { DailyPopularConsumer } from '@/components/reports/daily-popular-consumer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

  const members = membersRes.data || []
  const consumptions = consumptionsRes.data || []
  const deposits = depositsRes.data || []
  const transactions = transactionsRes.data || []
  const foods = foodsRes.data || []

  // Calculate spending by member
  const memberSpending = members.map((member) => {
    const spent = consumptions
      .filter((c) => c.member_id === member.id)
      .reduce((sum, c) => sum + Number(c.total_price), 0)
    const deposited = deposits
      .filter((d) => d.member_id === member.id)
      .reduce((sum, d) => sum + Number(d.amount), 0)
    return {
      name: member.name,
      spent,
      deposited,
      balance: Number(member.balance),
    }
  })

  // Calculate food popularity
  const foodPopularity = foods.map((food) => {
    const count = consumptions
      .filter((c) => c.food_id === food.id)
      .reduce((sum, c) => sum + c.quantity, 0)
    const revenue = consumptions
      .filter((c) => c.food_id === food.id)
      .reduce((sum, c) => sum + Number(c.total_price), 0)
    return {
      name: food.name,
      count,
      revenue,
    }
  }).sort((a, b) => b.count - a.count)

  // Calculate daily spending for the last 30 days
  const dailySpending = getDailySpending(consumptions)

  // Calculate today's consumer rankings
  const today = new Date().toISOString().split('T')[0]
  const todayConsumptions = consumptions.filter((c) => c.consumption_date === today)
  
  const consumerRankings = members
    .map((member) => {
      const memberConsumptions = todayConsumptions.filter((c) => c.member_id === member.id)
      const totalSpent = memberConsumptions.reduce((sum, c) => sum + Number(c.total_price), 0)
      
      // Group by food for breakdown
      const foodMap = new Map<string, { name: string; quantity: number; totalCost: number }>()
      memberConsumptions.forEach((c) => {
        const foodName = c.food?.name || 'Unknown'
        const existing = foodMap.get(foodName)
        if (existing) {
          existing.quantity += c.quantity
          existing.totalCost += Number(c.total_price)
        } else {
          foodMap.set(foodName, {
            name: foodName,
            quantity: c.quantity,
            totalCost: Number(c.total_price),
          })
        }
      })
      
      return {
        name: member.name,
        totalSpent,
        foodBreakdown: Array.from(foodMap.values()),
      }
    })
    .filter((m) => m.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map((m, idx) => ({ ...m, rank: idx + 1 }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View spending analytics and transaction history
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Daily Spending Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Spending</CardTitle>
              <CardDescription>Spending trends over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <SpendingChart data={dailySpending} />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Member Spending */}
            <Card>
              <CardHeader>
                <CardTitle>Member Statistics</CardTitle>
                <CardDescription>Deposits vs spending by member</CardDescription>
              </CardHeader>
              <CardContent>
                <MemberSpendingChart data={memberSpending} />
              </CardContent>
            </Card>

            {/* Food Popularity */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Foods</CardTitle>
                <CardDescription>Most consumed food items</CardDescription>
              </CardHeader>
              <CardContent>
                <FoodPopularityChart data={foodPopularity} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="daily" className="mt-4">
          <DailyPopularConsumer rankings={consumerRankings} date={today} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <TransactionHistory transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ConsumptionWithDate {
  consumption_date: string
  total_price: number
}

function getDailySpending(consumptions: ConsumptionWithDate[]) {
  const now = new Date()
  const days: { date: string; amount: number }[] = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayTotal = consumptions
      .filter((c) => c.consumption_date === dateStr)
      .reduce((sum, c) => sum + Number(c.total_price), 0)

    days.push({
      date: dateStr,
      amount: dayTotal,
    })
  }

  return days
}

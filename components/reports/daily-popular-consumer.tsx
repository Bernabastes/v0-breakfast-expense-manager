'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Trophy, Crown, Medal } from 'lucide-react'

interface FoodBreakdown {
  name: string
  quantity: number
  totalCost: number
}

interface ConsumerRanking {
  rank: number
  name: string
  totalSpent: number
  foodBreakdown: FoodBreakdown[]
}

interface DailyPopularConsumerProps {
  rankings: ConsumerRanking[]
  date: string
}

const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d']

export function DailyPopularConsumer({ rankings, date }: DailyPopularConsumerProps) {
  const topConsumer = rankings[0]
  const hasData = rankings.length > 0 && topConsumer?.totalSpent > 0

  const chartData = rankings.map((r) => ({
    name: r.name,
    spent: r.totalSpent,
  }))

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Today&apos;s Top Consumer
          </CardTitle>
          <CardDescription>{formattedDate}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No consumption data for today yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Consumer Highlight Card */}
      <Card className="border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-500" />
                Today&apos;s Top Consumer
              </CardTitle>
              <CardDescription>{formattedDate}</CardDescription>
            </div>
            <Badge variant="outline" className="border-amber-500 bg-amber-500/10 text-amber-600">
              #1 Spender
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Top Consumer Info */}
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-3xl font-bold text-amber-600">{topConsumer.name}</p>
                <p className="text-xl font-semibold text-foreground">
                  {topConsumer.totalSpent.toLocaleString()} ETB
                </p>
              </div>

              {/* Food Breakdown */}
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Food Breakdown</p>
                <div className="space-y-2">
                  {topConsumer.foodBreakdown.map((food, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <span className="font-medium">{food.name}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">x{food.quantity}</span>
                        <span className="font-semibold">{food.totalCost.toLocaleString()} ETB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mini Bar Chart */}
            <div className="h-[200px] w-full md:w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis
                    type="number"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    width={60}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="font-medium">{payload[0].payload.name}</p>
                            <p className="text-sm text-amber-600">
                              {Number(payload[0].value).toLocaleString()} ETB
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-500" />
            Today&apos;s Spending Ranking
          </CardTitle>
          <CardDescription>All members ranked by spending for today</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((consumer) => (
                <TableRow
                  key={consumer.rank}
                  className={consumer.rank === 1 ? 'bg-amber-500/5' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {consumer.rank === 1 && <Trophy className="h-4 w-4 text-amber-500" />}
                      {consumer.rank === 2 && <Medal className="h-4 w-4 text-gray-400" />}
                      {consumer.rank === 3 && <Medal className="h-4 w-4 text-amber-700" />}
                      <span
                        className={
                          consumer.rank === 1
                            ? 'font-bold text-amber-600'
                            : 'font-medium text-muted-foreground'
                        }
                      >
                        #{consumer.rank}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={consumer.rank === 1 ? 'font-semibold' : ''}>
                    {consumer.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={consumer.rank === 1 ? 'font-semibold text-amber-600' : ''}>
                      {consumer.totalSpent.toLocaleString()} ETB
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MemberSpendingChartProps {
  data: { name: string; spent: number; deposited: number; balance: number }[]
}

export function MemberSpendingChart({ data }: MemberSpendingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No member data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-3 shadow-sm">
                  <p className="mb-2 font-medium">{label}</p>
                  {payload.map((entry) => (
                    <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
                      {entry.name}: {Number(entry.value).toLocaleString()} ETB
                    </p>
                  ))}
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Bar dataKey="deposited" name="Deposited" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="spent" name="Spent" fill="#d97706" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

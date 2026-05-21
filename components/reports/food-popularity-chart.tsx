'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface FoodPopularityChartProps {
  data: { name: string; count: number; revenue: number }[]
}

const COLORS = ['#d97706', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316']

export function FoodPopularityChart({ data }: FoodPopularityChartProps) {
  const filteredData = data.filter((d) => d.count > 0)

  if (filteredData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No consumption data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="count"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          labelLine={false}
        >
          {filteredData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="rounded-lg border bg-background p-3 shadow-sm">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {data.count}
                  </p>
                  <p className="text-sm text-amber-600">
                    Revenue: {data.revenue.toLocaleString()} ETB
                  </p>
                </div>
              )
            }
            return null
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

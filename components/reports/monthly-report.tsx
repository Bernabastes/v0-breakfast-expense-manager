'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, FileText, FileSpreadsheet, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import type { Member, Consumption, Deposit } from '@/lib/types'

interface MonthlyReportProps {
  members: Member[]
  consumptions: (Consumption & { member?: Member; food?: { name: string } })[]
  deposits: (Deposit & { member?: Member })[]
}

interface MemberReport {
  name: string
  deposits: number
  spending: number
  balance: number
}

export function MonthlyReport({ members, consumptions, deposits }: MonthlyReportProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return format(now, 'yyyy-MM')
  })

  // Generate last 12 months for selection
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i)
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy'),
    }
  })

  // Filter data for selected month
  const [year, month] = selectedMonth.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, month - 1))
  const monthEnd = endOfMonth(new Date(year, month - 1))

  const monthlyConsumptions = consumptions.filter((c) => {
    const date = new Date(c.consumption_date)
    return date >= monthStart && date <= monthEnd
  })

  const monthlyDeposits = deposits.filter((d) => {
    const date = new Date(d.created_at)
    return date >= monthStart && date <= monthEnd
  })

  // Calculate totals
  const totalExpenses = monthlyConsumptions.reduce((sum, c) => sum + Number(c.total_price), 0)
  const totalDeposits = monthlyDeposits.reduce((sum, d) => sum + Number(d.amount), 0)

  // Calculate per-member stats
  const memberReports: MemberReport[] = members.map((member) => {
    const memberDeposits = monthlyDeposits
      .filter((d) => d.member_id === member.id)
      .reduce((sum, d) => sum + Number(d.amount), 0)
    const memberSpending = monthlyConsumptions
      .filter((c) => c.member_id === member.id)
      .reduce((sum, c) => sum + Number(c.total_price), 0)
    return {
      name: member.name,
      deposits: memberDeposits,
      spending: memberSpending,
      balance: Number(member.balance),
    }
  })

  // Food breakdown for the month
  const foodBreakdown = monthlyConsumptions.reduce((acc, c) => {
    const foodName = c.food?.name || 'Unknown'
    if (!acc[foodName]) {
      acc[foodName] = { quantity: 0, total: 0 }
    }
    acc[foodName].quantity += c.quantity
    acc[foodName].total += Number(c.total_price)
    return acc
  }, {} as Record<string, { quantity: number; total: number }>)

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} ETB`
  const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy')

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Member', 'Deposits (ETB)', 'Spending (ETB)', 'Current Balance (ETB)']
    const rows = memberReports.map((m) => [m.name, m.deposits, m.spending, m.balance])
    
    // Add totals row
    rows.push(['TOTAL', totalDeposits, totalExpenses, members.reduce((s, m) => s + Number(m.balance), 0)])
    
    // Add food breakdown section
    rows.push([])
    rows.push(['Food Item', 'Quantity', 'Total (ETB)', ''])
    Object.entries(foodBreakdown).forEach(([food, data]) => {
      rows.push([food, data.quantity, data.total, ''])
    })

    const csvContent = [
      [`Monthly Report - ${monthLabel}`],
      [],
      headers,
      ...rows,
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `breakfast-report-${selectedMonth}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // Export to PDF
  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Title
    doc.setFontSize(20)
    doc.setTextColor(180, 83, 9) // Amber color
    doc.text('Breakfast Expense Manager', pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(`Monthly Report - ${monthLabel}`, pageWidth / 2, 30, { align: 'center' })

    // Summary cards
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 14, 45)
    doc.text(`Total Deposits: ${formatCurrency(totalDeposits)}`, 14, 52)
    doc.text(`Net: ${formatCurrency(totalDeposits - totalExpenses)}`, 14, 59)

    // Member contributions table
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('Member Contributions', 14, 72)

    autoTable(doc, {
      startY: 76,
      head: [['Member', 'Deposits (ETB)', 'Spending (ETB)', 'Balance (ETB)']],
      body: [
        ...memberReports.map((m) => [
          m.name,
          m.deposits.toLocaleString(),
          m.spending.toLocaleString(),
          m.balance.toLocaleString(),
        ]),
        [
          'TOTAL',
          totalDeposits.toLocaleString(),
          totalExpenses.toLocaleString(),
          members.reduce((s, m) => s + Number(m.balance), 0).toLocaleString(),
        ],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [180, 83, 9] },
      footStyles: { fontStyle: 'bold' },
    })

    // Food breakdown table
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 120
    doc.text('Food Breakdown', 14, finalY + 15)

    autoTable(doc, {
      startY: finalY + 19,
      head: [['Food Item', 'Quantity', 'Total (ETB)']],
      body: Object.entries(foodBreakdown).map(([food, data]) => [
        food,
        data.quantity.toString(),
        data.total.toLocaleString(),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [180, 83, 9] },
    })

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Generated on ${format(new Date(), 'PPP')}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    doc.save(`breakfast-report-${selectedMonth}.pdf`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              Monthly Report
            </CardTitle>
            <CardDescription>View and download monthly expense reports</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Total Expenses
            </div>
            <div className="mt-1 text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Deposits
            </div>
            <div className="mt-1 text-2xl font-bold">{formatCurrency(totalDeposits)}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-4 w-4 text-amber-500" />
              Net Balance Change
            </div>
            <div className={`mt-1 text-2xl font-bold ${totalDeposits - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalDeposits - totalExpenses >= 0 ? '+' : ''}{formatCurrency(totalDeposits - totalExpenses)}
            </div>
          </div>
        </div>

        {/* Member Contributions Table */}
        <div>
          <h3 className="mb-3 font-semibold">Member Contributions</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Deposits</TableHead>
                  <TableHead className="text-right">Spending</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberReports.map((member) => (
                  <TableRow key={member.name}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-right text-green-600">
                      +{formatCurrency(member.deposits)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(member.spending)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${member.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(member.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right text-green-600">
                    +{formatCurrency(totalDeposits)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatCurrency(totalExpenses)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(members.reduce((s, m) => s + Number(m.balance), 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Food Breakdown */}
        {Object.keys(foodBreakdown).length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">Food Breakdown</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Food Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(foodBreakdown)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([food, data]) => (
                      <TableRow key={food}>
                        <TableCell className="font-medium">{food}</TableCell>
                        <TableCell className="text-right">{data.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.total)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {monthlyConsumptions.length === 0 && monthlyDeposits.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            No transactions found for {monthLabel}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

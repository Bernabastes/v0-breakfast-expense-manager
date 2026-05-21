'use client'

import { Consumption } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { DeleteConsumptionDialog } from './delete-consumption-dialog'

interface ConsumptionsTableProps {
  consumptions: Consumption[]
}

export function ConsumptionsTable({ consumptions }: ConsumptionsTableProps) {
  if (consumptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No consumptions recorded yet. Use Quick Add or the Add Consumption button to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Food</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consumptions.map((consumption) => (
              <TableRow key={consumption.id}>
                <TableCell className="font-medium">
                  {consumption.member?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  {consumption.food?.name || 'Unknown'}
                </TableCell>
                <TableCell className="text-center">
                  {consumption.quantity}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {Number(consumption.unit_price).toLocaleString()} ETB
                </TableCell>
                <TableCell className="text-right font-semibold text-amber-600">
                  -{Number(consumption.total_price).toLocaleString()} ETB
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(consumption.consumption_date), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <DeleteConsumptionDialog consumption={consumption} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

'use client'

import { Deposit } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { DeleteDepositDialog } from './delete-deposit-dialog'

interface DepositsTableProps {
  deposits: Deposit[]
}

export function DepositsTable({ deposits }: DepositsTableProps) {
  if (deposits.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No deposits yet. Add a deposit to get started.
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
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.map((deposit) => (
              <TableRow key={deposit.id}>
                <TableCell className="font-medium">
                  {deposit.member?.name || 'Unknown'}
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  +{Number(deposit.amount).toLocaleString()} ETB
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {deposit.notes || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(deposit.created_at), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>
                  <DeleteDepositDialog deposit={deposit} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

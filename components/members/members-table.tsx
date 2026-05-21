'use client'

import { Member } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { EditMemberDialog } from './edit-member-dialog'
import { DeleteMemberDialog } from './delete-member-dialog'

interface MembersTableProps {
  members: Member[]
}

export function MembersTable({ members }: MembersTableProps) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No members yet. Add your first member to get started.
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const balance = Number(member.balance)
              const isNegative = balance < 0
              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email || '-'}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    isNegative ? "text-red-600" : balance > 0 ? "text-green-600" : ""
                  )}>
                    {balance.toLocaleString()} ETB
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(member.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <EditMemberDialog member={member} />
                      <DeleteMemberDialog member={member} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

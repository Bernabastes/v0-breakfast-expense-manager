import { createClient } from '@/lib/supabase/server'
import { MembersTable } from '@/components/members/members-table'
import { AddMemberDialog } from '@/components/members/add-member-dialog'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage your breakfast group members
          </p>
        </div>
        <AddMemberDialog />
      </div>

      <MembersTable members={members || []} />
    </div>
  )
}

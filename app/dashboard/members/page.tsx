'use client'

import { createClient } from '@/lib/supabase/client'
import { MembersTable } from '@/components/members/members-table'
import { AddMemberDialog } from '@/components/members/add-member-dialog'
import { useLanguage } from '@/lib/i18n/language-context'
import { useEffect, useState } from 'react'
import { Member } from '@/lib/types'

export default function MembersPage() {
  const { t } = useLanguage()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMembers() {
      const supabase = createClient()
      const { data } = await supabase
        .from('members')
        .select('*')
        .order('name')
      setMembers(data || [])
      setLoading(false)
    }
    fetchMembers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.members.title}</h1>
          <p className="text-muted-foreground">
            {t.members.subtitle}
          </p>
        </div>
        <AddMemberDialog />
      </div>

      <MembersTable members={members} />
    </div>
  )
}

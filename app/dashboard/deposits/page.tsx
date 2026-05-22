'use client'

import { createClient } from '@/lib/supabase/client'
import { DepositsTable } from '@/components/deposits/deposits-table'
import { AddDepositDialog } from '@/components/deposits/add-deposit-dialog'
import { useLanguage } from '@/lib/i18n/language-context'
import { useEffect, useState } from 'react'
import { Deposit, Member } from '@/lib/types'

export default function DepositsPage() {
  const { t } = useLanguage()
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const [depositsRes, membersRes] = await Promise.all([
        supabase
          .from('deposits')
          .select('*, member:members(*)')
          .order('created_at', { ascending: false }),
        supabase.from('members').select('*').order('name'),
      ])
      
      setDeposits(depositsRes.data || [])
      setMembers(membersRes.data || [])
      setLoading(false)
    }
    fetchData()
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
          <h1 className="text-3xl font-bold tracking-tight">{t.deposits.title}</h1>
          <p className="text-muted-foreground">
            {t.deposits.subtitle}
          </p>
        </div>
        <AddDepositDialog members={members} />
      </div>

      <DepositsTable deposits={deposits} />
    </div>
  )
}

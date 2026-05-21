'use client'

import { createClient } from '@/lib/supabase/client'
import { ConsumptionsTable } from '@/components/consumptions/consumptions-table'
import { AddConsumptionDialog } from '@/components/consumptions/add-consumption-dialog'
import { QuickAddConsumption } from '@/components/consumptions/quick-add-consumption'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/lib/i18n/language-context'
import { useEffect, useState } from 'react'
import { Consumption, Member, Food } from '@/lib/types'

export default function ConsumptionsPage() {
  const { t } = useLanguage()
  const [consumptions, setConsumptions] = useState<Consumption[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const [consumptionsRes, membersRes, foodsRes] = await Promise.all([
        supabase
          .from('consumptions')
          .select('*, member:members(*), food:foods(*)')
          .order('created_at', { ascending: false }),
        supabase.from('members').select('*').order('name'),
        supabase.from('foods').select('*').eq('is_active', true).order('name'),
      ])
      
      setConsumptions(consumptionsRes.data || [])
      setMembers(membersRes.data || [])
      setFoods(foodsRes.data || [])
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
          <h1 className="text-3xl font-bold tracking-tight">{t.consumptions.title}</h1>
          <p className="text-muted-foreground">
            {t.consumptions.subtitle}
          </p>
        </div>
        <AddConsumptionDialog members={members} foods={foods} />
      </div>

      <Tabs defaultValue="quick" className="w-full">
        <TabsList>
          <TabsTrigger value="quick">{t.consumptions.quickAdd}</TabsTrigger>
          <TabsTrigger value="history">{t.reports.transactions}</TabsTrigger>
        </TabsList>
        <TabsContent value="quick" className="mt-4">
          <QuickAddConsumption members={members} foods={foods} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <ConsumptionsTable consumptions={consumptions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

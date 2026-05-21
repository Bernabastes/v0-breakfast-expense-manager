'use client'

import { createClient } from '@/lib/supabase/client'
import { FoodsTable } from '@/components/foods/foods-table'
import { AddFoodDialog } from '@/components/foods/add-food-dialog'
import { useLanguage } from '@/lib/i18n/language-context'
import { useEffect, useState } from 'react'
import { Food } from '@/lib/types'

export default function FoodsPage() {
  const { t } = useLanguage()
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFoods() {
      const supabase = createClient()
      const { data } = await supabase
        .from('foods')
        .select('*')
        .order('name')
      setFoods(data || [])
      setLoading(false)
    }
    fetchFoods()
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
          <h1 className="text-3xl font-bold tracking-tight">{t.foods.title}</h1>
          <p className="text-muted-foreground">
            {t.foods.subtitle}
          </p>
        </div>
        <AddFoodDialog />
      </div>

      <FoodsTable foods={foods} />
    </div>
  )
}

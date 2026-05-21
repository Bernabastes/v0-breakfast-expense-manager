import { createClient } from '@/lib/supabase/server'
import { FoodsTable } from '@/components/foods/foods-table'
import { AddFoodDialog } from '@/components/foods/add-food-dialog'

export default async function FoodsPage() {
  const supabase = await createClient()
  const { data: foods } = await supabase
    .from('foods')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Food Menu</h1>
          <p className="text-muted-foreground">
            Manage the breakfast food items and prices
          </p>
        </div>
        <AddFoodDialog />
      </div>

      <FoodsTable foods={foods || []} />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { ConsumptionsTable } from '@/components/consumptions/consumptions-table'
import { AddConsumptionDialog } from '@/components/consumptions/add-consumption-dialog'
import { QuickAddConsumption } from '@/components/consumptions/quick-add-consumption'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ConsumptionsPage() {
  const supabase = await createClient()
  
  const [consumptionsRes, membersRes, foodsRes] = await Promise.all([
    supabase
      .from('consumptions')
      .select('*, member:members(*), food:foods(*)')
      .order('created_at', { ascending: false }),
    supabase.from('members').select('*').order('name'),
    supabase.from('foods').select('*').eq('is_active', true).order('name'),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consumptions</h1>
          <p className="text-muted-foreground">
            Record daily breakfast consumptions
          </p>
        </div>
        <AddConsumptionDialog 
          members={membersRes.data || []} 
          foods={foodsRes.data || []} 
        />
      </div>

      <Tabs defaultValue="quick" className="w-full">
        <TabsList>
          <TabsTrigger value="quick">Quick Add</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="quick" className="mt-4">
          <QuickAddConsumption 
            members={membersRes.data || []} 
            foods={foodsRes.data || []} 
          />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <ConsumptionsTable consumptions={consumptionsRes.data || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

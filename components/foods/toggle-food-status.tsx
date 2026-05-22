'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Food } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { notifyTelegram } from '@/lib/telegram/notify-client'

interface ToggleFoodStatusProps {
  food: Food
}

export function ToggleFoodStatus({ food }: ToggleFoodStatusProps) {
  const router = useRouter()

  const handleToggle = async () => {
    const supabase = createClient()
    await supabase
      .from('foods')
      .update({
        is_active: !food.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', food.id)

    notifyTelegram({
      type: 'food_status_changed',
      data: { foodName: food.name, isActive: !food.is_active },
    })

    router.refresh()
  }

  return (
    <Switch
      checked={food.is_active}
      onCheckedChange={handleToggle}
      aria-label={`Toggle ${food.name} availability`}
    />
  )
}

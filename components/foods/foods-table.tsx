'use client'

import { Food } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EditFoodDialog } from './edit-food-dialog'
import { DeleteFoodDialog } from './delete-food-dialog'
import { ToggleFoodStatus } from './toggle-food-status'

interface FoodsTableProps {
  foods: Food[]
}

export function FoodsTable({ foods }: FoodsTableProps) {
  if (foods.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No food items yet. Add your first food item to get started.
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
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {foods.map((food) => (
              <TableRow key={food.id}>
                <TableCell className="font-medium">{food.name}</TableCell>
                <TableCell className="text-right font-semibold">
                  {Number(food.price).toLocaleString()} ETB
                </TableCell>
                <TableCell>
                  <Badge variant={food.is_active ? 'default' : 'secondary'} className={food.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                    {food.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ToggleFoodStatus food={food} />
                    <EditFoodDialog food={food} />
                    <DeleteFoodDialog food={food} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

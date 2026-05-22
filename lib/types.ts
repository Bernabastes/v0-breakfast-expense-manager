export interface Member {
  id: string
  name: string
  email: string | null
  balance: number
  pin_hash: string | null
  created_at: string
  updated_at: string
}

export interface Food {
  id: string
  name: string
  price: number
  is_active: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Deposit {
  id: string
  member_id: string
  amount: number
  notes: string | null
  created_at: string
  member?: Member
}

export interface Consumption {
  id: string
  member_id: string
  food_id: string
  quantity: number
  unit_price: number
  total_price: number
  consumption_date: string
  created_at: string
  member?: Member
  food?: Food
}

export interface Transaction {
  id: string
  member_id: string
  type: 'deposit' | 'consumption'
  amount: number
  balance_after: number
  reference_id: string | null
  description: string | null
  created_at: string
  member?: Member
}

export interface DashboardStats {
  totalDeposits: number
  totalConsumptions: number
  totalBalance: number
  memberCount: number
}

export interface SavingsPot {
  id: string
  name: string
  description: string | null
  target_amount: number | null
  current_amount: number
  created_at: string
  updated_at: string
}

export interface SavingsContribution {
  id: string
  pot_id: string
  member_id: string
  amount: number
  notes: string | null
  created_at: string
  member?: Member
}

export interface SavingsWithdrawal {
  id: string
  pot_id: string
  amount: number
  reason: string
  created_at: string
}

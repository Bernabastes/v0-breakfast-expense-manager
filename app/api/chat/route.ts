import { streamText, convertToModelMessages, UIMessage, tool } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, language = 'en' }: { messages: UIMessage[]; language?: string } = await req.json()

  const supabase = await createClient()

  // Define tools for querying the database
  const tools = {
    getMembers: tool({
      description: 'Get all members with their current balances',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('name')
        if (error) return { error: error.message }
        return { members: data }
      },
    }),

    getMemberWithLowestBalance: tool({
      description: 'Find the member with the lowest balance',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('balance', { ascending: true })
          .limit(1)
        if (error) return { error: error.message }
        return { member: data?.[0] || null }
      },
    }),

    getMemberWithHighestBalance: tool({
      description: 'Find the member with the highest balance',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('balance', { ascending: false })
          .limit(1)
        if (error) return { error: error.message }
        return { member: data?.[0] || null }
      },
    }),

    getMonthlySpending: tool({
      description: 'Get total spending for the current month or a specific month',
      inputSchema: z.object({
        month: z.number().min(1).max(12).nullable().describe('Month number (1-12), null for current month'),
        year: z.number().nullable().describe('Year, null for current year'),
      }),
      execute: async ({ month, year }) => {
        const now = new Date()
        const targetMonth = month || (now.getMonth() + 1)
        const targetYear = year || now.getFullYear()
        
        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
        const endDate = targetMonth === 12 
          ? `${targetYear + 1}-01-01`
          : `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`

        const { data, error } = await supabase
          .from('consumptions')
          .select('total_price')
          .gte('consumption_date', startDate)
          .lt('consumption_date', endDate)

        if (error) return { error: error.message }
        
        const total = data?.reduce((sum, c) => sum + Number(c.total_price), 0) || 0
        return { 
          month: targetMonth, 
          year: targetYear, 
          totalSpending: total,
          currency: 'ETB'
        }
      },
    }),

    getTopContributors: tool({
      description: 'Get members who have deposited the most money (top contributors)',
      inputSchema: z.object({
        limit: z.number().min(1).max(10).nullable().describe('Number of top contributors to return'),
      }),
      execute: async ({ limit }) => {
        const { data, error } = await supabase
          .from('deposits')
          .select('member_id, amount, members(name)')

        if (error) return { error: error.message }

        // Aggregate deposits by member
        const memberTotals = new Map<string, { name: string; total: number }>()
        data?.forEach((d) => {
          const memberId = d.member_id
          const memberName = (d.members as { name: string } | null)?.name || 'Unknown'
          const current = memberTotals.get(memberId) || { name: memberName, total: 0 }
          current.total += Number(d.amount)
          memberTotals.set(memberId, current)
        })

        const sorted = Array.from(memberTotals.entries())
          .map(([id, { name, total }]) => ({ id, name, totalDeposits: total }))
          .sort((a, b) => b.totalDeposits - a.totalDeposits)
          .slice(0, limit || 5)

        return { topContributors: sorted, currency: 'ETB' }
      },
    }),

    getTopConsumers: tool({
      description: 'Get members who have spent the most money (top consumers)',
      inputSchema: z.object({
        limit: z.number().min(1).max(10).nullable().describe('Number of top consumers to return'),
      }),
      execute: async ({ limit }) => {
        const { data, error } = await supabase
          .from('consumptions')
          .select('member_id, total_price, members(name)')

        if (error) return { error: error.message }

        // Aggregate spending by member
        const memberTotals = new Map<string, { name: string; total: number }>()
        data?.forEach((c) => {
          const memberId = c.member_id
          const memberName = (c.members as { name: string } | null)?.name || 'Unknown'
          const current = memberTotals.get(memberId) || { name: memberName, total: 0 }
          current.total += Number(c.total_price)
          memberTotals.set(memberId, current)
        })

        const sorted = Array.from(memberTotals.entries())
          .map(([id, { name, total }]) => ({ id, name, totalSpending: total }))
          .sort((a, b) => b.totalSpending - a.totalSpending)
          .slice(0, limit || 5)

        return { topConsumers: sorted, currency: 'ETB' }
      },
    }),

    getTodaySpending: tool({
      description: 'Get total spending for today',
      inputSchema: z.object({}),
      execute: async () => {
        const today = new Date().toISOString().split('T')[0]
        
        const { data, error } = await supabase
          .from('consumptions')
          .select('total_price, members(name), foods(name)')
          .eq('consumption_date', today)

        if (error) return { error: error.message }
        
        const total = data?.reduce((sum, c) => sum + Number(c.total_price), 0) || 0
        return { 
          date: today, 
          totalSpending: total, 
          transactionCount: data?.length || 0,
          currency: 'ETB'
        }
      },
    }),

    getFoodMenu: tool({
      description: 'Get all food items with their prices',
      inputSchema: z.object({
        activeOnly: z.boolean().nullable().describe('If true, only return active items'),
      }),
      execute: async ({ activeOnly }) => {
        let query = supabase.from('foods').select('*').order('name')
        if (activeOnly) {
          query = query.eq('is_active', true)
        }
        const { data, error } = await query
        if (error) return { error: error.message }
        return { foods: data, currency: 'ETB' }
      },
    }),

    getMostPopularFood: tool({
      description: 'Get the most popular food items by consumption frequency',
      inputSchema: z.object({
        limit: z.number().min(1).max(10).nullable().describe('Number of items to return'),
      }),
      execute: async ({ limit }) => {
        const { data, error } = await supabase
          .from('consumptions')
          .select('food_id, quantity, foods(name)')

        if (error) return { error: error.message }

        // Aggregate by food
        const foodTotals = new Map<string, { name: string; count: number }>()
        data?.forEach((c) => {
          const foodId = c.food_id
          const foodName = (c.foods as { name: string } | null)?.name || 'Unknown'
          const current = foodTotals.get(foodId) || { name: foodName, count: 0 }
          current.count += c.quantity
          foodTotals.set(foodId, current)
        })

        const sorted = Array.from(foodTotals.entries())
          .map(([id, { name, count }]) => ({ id, name, totalQuantity: count }))
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, limit || 5)

        return { popularFoods: sorted }
      },
    }),

    getRecentTransactions: tool({
      description: 'Get recent transactions (deposits and consumptions)',
      inputSchema: z.object({
        limit: z.number().min(1).max(20).nullable().describe('Number of transactions to return'),
      }),
      execute: async ({ limit }) => {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, members(name)')
          .order('created_at', { ascending: false })
          .limit(limit || 10)

        if (error) return { error: error.message }
        return { transactions: data, currency: 'ETB' }
      },
    }),

    getSummaryStats: tool({
      description: 'Get overall summary statistics including total deposits, total spending, and balances',
      inputSchema: z.object({}),
      execute: async () => {
        const [membersRes, depositsRes, consumptionsRes] = await Promise.all([
          supabase.from('members').select('balance'),
          supabase.from('deposits').select('amount'),
          supabase.from('consumptions').select('total_price'),
        ])

        const totalBalance = membersRes.data?.reduce((sum, m) => sum + Number(m.balance), 0) || 0
        const totalDeposits = depositsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0
        const totalSpending = consumptionsRes.data?.reduce((sum, c) => sum + Number(c.total_price), 0) || 0

        return {
          totalMembers: membersRes.data?.length || 0,
          totalDeposits,
          totalSpending,
          totalBalance,
          currency: 'ETB'
        }
      },
    }),
  }

  const systemPrompt = language === 'am' 
    ? `እርስዎ ለቁርስ ወጪ አስተዳዳሪ መተግበሪያ ረዳት የሆኑ AI ነዎት። ስለ ወጪዎች፣ ቀሪ ሂሳቦች፣ ተቀማጭ ገንዘብ እና የፍጆታ ዝርዝሮች ጥያቄዎችን ይመልሳሉ።

ቁልፍ ነጥቦች:
- ምንዛሬው የኢትዮጵያ ብር (ETB ወይም ብር) ነው
- ስለ ሂሳቦች፣ ወጪዎች፣ ወይም ተቀማጭ ገንዘብ ሲጠየቁ ትክክለኛ መረጃ ለማግኘት ያሉትን መሳሪያዎች ይጠቀሙ
- ምላሾችን በአማርኛ ይስጡ
- ተግባቢ እና ረዳት ይሁኑ
- ያቀረቡት መረጃ ገለጻ በቂ ያድርጉ`
    : `You are an AI assistant for a Breakfast Expense Manager app. You help users understand their expenses, balances, deposits, and consumption data.

Key points:
- The currency is Ethiopian Birr (ETB)
- When asked about balances, expenses, or deposits, use the available tools to fetch accurate data
- Provide helpful, conversational responses
- Format numbers nicely and include the currency (ETB)
- Be friendly and helpful`

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    maxSteps: 5,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}

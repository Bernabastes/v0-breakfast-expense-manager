import {
  fetchActiveFoods,
  fetchLowBalanceMembers,
  fetchMemberBalance,
  fetchMembers,
  fetchRecentTransactions,
  fetchSavingsPot,
  fetchSummary,
  fetchTodayConsumptions,
  fmt,
  LOW_BALANCE_THRESHOLD,
} from './bot-data'

export const BOT_COMMANDS = [
  { command: 'start', description: 'Welcome & command list' },
  { command: 'help', description: 'Show all commands' },
  { command: 'members', description: 'All members & balances' },
  { command: 'balance', description: 'One member balance (e.g. /balance bernabas)' },
  { command: 'lowbalance', description: 'Members below 50 ETB' },
  { command: 'summary', description: 'Group totals & stats' },
  { command: 'recent', description: 'Latest transactions' },
  { command: 'today', description: "Today's consumptions" },
  { command: 'menu', description: 'Active food menu & prices' },
  { command: 'savings', description: 'Savings pot balance' },
  { command: 'chatid', description: 'Your Telegram chat ID' },
] as const

function helpText(): string {
  const lines = BOT_COMMANDS.map((c) => `/${c.command} — ${c.description}`)
  return (
    `<b>Breakfast Manager Bot</b>\n\n` +
    `<b>Commands</b>\n` +
    lines.join('\n') +
    `\n\n<b>Examples</b>\n` +
    `/balance yafet\n` +
    `/balance bernabas\n` +
    `/balance anteneh`
  )
}

function welcomeText(chatId: string, authorized: boolean): string {
  if (!authorized) {
    return (
      `Hello! 👋\n\n` +
      `This bot sends Breakfast Manager alerts.\n\n` +
      `Your chat ID:\n<code>${chatId}</code>\n\n` +
      `Ask your admin to add this ID to <code>TELEGRAM_NOTIFY_CHAT_IDS</code> in <code>.env.local</code>, then restart the server.\n\n` +
      `After that, use /help to see commands.`
    )
  }

  return (
    `Hello! 👋 <b>Breakfast Manager</b> is connected.\n\n` +
    `Use /members to see Yafet, Bernabas, Anteneh & team balances.\n` +
    `Use /balance &lt;name&gt; for one person.\n\n` +
    helpText()
  )
}

export async function handleBotCommand(
  text: string,
  chatId: string,
  authorized: boolean,
): Promise<string> {
  const trimmed = text.trim()
  const lower = trimmed.toLowerCase()
  const [cmd, ...args] = lower.split(/\s+/)
  const argText = args.join(' ')

  if (cmd === '/start' || cmd === '/chatid') {
    if (cmd === '/chatid') {
      return `Your chat ID:\n<code>${chatId}</code>`
    }
    return welcomeText(chatId, authorized)
  }

  if (!authorized) {
    return (
      `You are not on the notify list yet.\n\n` +
      `Chat ID: <code>${chatId}</code>\n` +
      `Send this to your admin for <code>TELEGRAM_NOTIFY_CHAT_IDS</code>.`
    )
  }

  if (cmd === '/help') return helpText()

  if (cmd === '/members' || cmd === '/balances') {
    const res = await fetchMembers()
    if (!res.ok) return `❌ ${res.error}`

    if (res.members.length === 0) {
      return 'No members in the app yet.'
    }

    const lines = res.members.map((m, i) => {
      const bal = Number(m.balance)
      const warn = bal < LOW_BALANCE_THRESHOLD ? ' ⚠️' : ''
      return `${i + 1}. <b>${m.name}</b> — ${fmt(bal)}${warn}`
    })

    const total = res.members.reduce((s, m) => s + Number(m.balance), 0)
    return (
      `<b>Members (${res.members.length})</b>\n\n` +
      lines.join('\n') +
      `\n\n<b>Total balance:</b> ${fmt(total)}`
    )
  }

  if (cmd === '/balance') {
    if (!argText) {
      return (
        `<b>Usage:</b> /balance &lt;name&gt;\n\n` +
        `Examples:\n/balance yafet\n/balance bernabas\n/balance anteneh`
      )
    }
    const res = await fetchMemberBalance(argText)
    if (!res.ok) return `❌ ${res.error}`

    const bal = Number(res.member.balance)
    const low = bal < LOW_BALANCE_THRESHOLD
    return (
      `<b>${res.member.name}</b>\n` +
      `Balance: <b>${fmt(bal)}</b>${low ? '\n⚠️ Below 50 ETB threshold' : ''}` +
      (res.member.email ? `\nEmail: ${res.member.email}` : '')
    )
  }

  if (cmd === '/lowbalance' || cmd === '/low') {
    const res = await fetchLowBalanceMembers()
    if (!res.ok) return `❌ ${res.error}`

    if (res.members.length === 0) {
      return `✅ All members are at or above ${fmt(res.threshold)}.`
    }

    const lines = res.members.map(
      (m) => `• <b>${m.name}</b> — ${fmt(Number(m.balance))}`,
    )
    return `<b>Low balance</b> (&lt; ${fmt(res.threshold)})\n\n` + lines.join('\n')
  }

  if (cmd === '/summary' || cmd === '/stats') {
    const res = await fetchSummary()
    if (!res.ok) return `❌ ${res.error}`

    return (
      `<b>Summary</b>\n\n` +
      `Members: <b>${res.memberCount}</b>\n` +
      `Total deposits: ${fmt(res.totalDeposits)}\n` +
      `Total spent: ${fmt(res.totalSpending)}\n` +
      `Current balances: <b>${fmt(res.totalBalance)}</b>`
    )
  }

  if (cmd === '/recent' || cmd === '/transactions') {
    const res = await fetchRecentTransactions()
    if (!res.ok) return `❌ ${res.error}`

    if (res.transactions.length === 0) {
      return 'No transactions yet.'
    }

    const lines = res.transactions.map((t) => {
      const memberName =
        (t.member as { name?: string } | null)?.name ?? 'Unknown'
      const amount = Number(t.amount)
      const sign = amount >= 0 ? '+' : ''
      const type = t.type === 'deposit' ? '💰' : '🍳'
      const desc = t.description ? ` — ${t.description}` : ''
      return `${type} <b>${memberName}</b> ${sign}${fmt(Math.abs(amount))}${desc}`
    })

    return `<b>Recent transactions</b>\n\n` + lines.join('\n')
  }

  if (cmd === '/today') {
    const res = await fetchTodayConsumptions()
    if (!res.ok) return `❌ ${res.error}`

    if (res.consumptions.length === 0) {
      return `No consumptions recorded for ${res.date}.`
    }

    const lines = res.consumptions.map((c) => {
      const memberName =
        (c.member as { name?: string } | null)?.name ?? 'Unknown'
      const foodName = (c.food as { name?: string } | null)?.name ?? 'Item'
      return `• <b>${memberName}</b> — ${foodName} ×${c.quantity} (${fmt(Number(c.total_price))})`
    })

    return (
      `<b>Today (${res.date})</b>\n\n` +
      lines.join('\n') +
      `\n\n<b>Total:</b> ${fmt(res.total)}`
    )
  }

  if (cmd === '/menu' || cmd === '/foods') {
    const res = await fetchActiveFoods()
    if (!res.ok) return `❌ ${res.error}`

    if (res.foods.length === 0) {
      return 'No active food items.'
    }

    const lines = res.foods.map((f) => `• <b>${f.name}</b> — ${fmt(Number(f.price))}`)
    return `<b>Food menu</b>\n\n` + lines.join('\n')
  }

  if (cmd === '/savings') {
    const res = await fetchSavingsPot()
    if (!res.ok) return `❌ ${res.error}`

    if (!res.pot) return 'No savings pot configured.'

    const pot = res.pot
    const target = pot.target_amount ? fmt(Number(pot.target_amount)) : '—'
    return (
      `<b>${pot.name}</b>\n` +
      `Balance: <b>${fmt(Number(pot.current_amount))}</b>\n` +
      `Target: ${target}` +
      (pot.description ? `\n${pot.description}` : '')
    )
  }

  // Natural language shortcuts without slash
  if (
    lower.startsWith('balance ') ||
    lower.startsWith('who ') ||
    lower.includes('balance of')
  ) {
    const name = trimmed.replace(/^balance\s+/i, '').replace(/^who is\s+/i, '')
    if (name) return handleBotCommand(`/balance ${name}`, chatId, authorized)
  }

  return (
    `Unknown command. Try /help\n\n` +
    `Quick: /members · /balance bernabas · /summary · /today`
  )
}

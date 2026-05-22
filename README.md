# v0-breakfast-expense-manager

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_Aljec8DlAOSItbNPVsxSvHqucroX)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Telegram notifications

The app can send Telegram alerts when deposits, consumptions, members, foods, savings, or low balances change.

### Setup

1. Copy `.env.example` to `.env.local` (or add the variables below).
2. Set `TELEGRAM_BOT_TOKEN` from [@BotFather](https://t.me/BotFather).
3. Each person who should receive alerts must open your bot in Telegram and send `/start`.
4. While logged into the dashboard, open `GET /api/telegram/chats` in the browser (or use the chat IDs returned by the bot’s `/start` reply).
5. Add chat IDs to:
   - `TELEGRAM_ADMIN_CHAT_IDS` — admins (comma-separated)
   - `TELEGRAM_NOTIFY_CHAT_IDS` — other team members or a group chat (comma-separated)

### Production webhook (optional)

Set your bot webhook to `https://your-domain.com/api/telegram/webhook` and optionally set `TELEGRAM_WEBHOOK_SECRET` to match Telegram’s secret token header.

**Security:** Never commit real bot tokens. If a token was shared publicly, revoke it in BotFather and create a new one.

### Bot commands

Authorized chats (in `TELEGRAM_NOTIFY_CHAT_IDS` / `TELEGRAM_ADMIN_CHAT_IDS`) can ask the bot in Telegram:

| Command | Description |
|---------|-------------|
| `/members` | All members and balances |
| `/balance bernabas` | One member (partial names work: yafet, anteneh) |
| `/lowbalance` | Members below 50 ETB |
| `/summary` | Totals for deposits, spending, balances |
| `/recent` | Latest transactions |
| `/today` | Today’s consumptions |
| `/menu` | Active food items |
| `/savings` | Savings pot |
| `/help` | Command list |

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (Supabase dashboard → Settings → API).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/Bernabastes/v0-breakfast-expense-manager" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>

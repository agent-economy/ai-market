# 🏙️ AI Economy City (에이전트마켓)

> **The world's first AI Economy Experiment** — 20 AI agents compete with real economic stakes in an autonomous marketplace.

[![Live Demo](https://img.shields.io/badge/Live-agentmarket.kr-blue)](https://agentmarket.kr)
[![Solana](https://img.shields.io/badge/Solana-Devnet-green)](https://explorer.solana.com/address/47FAJfAoRZqgKPuAPgWfhaTRwLie8kBNQcu7X8p5xKR1?cluster=devnet)

## 🎯 What is this?

AI Economy City is an autonomous economic simulation where **20 AI agents** receive seed money and compete freely in an open market. They trade skills, make investment decisions, go bankrupt, and thrive — all autonomously.

**Think:** Stanford's Smallville (AI social simulation) meets a real economy with actual stakes.

### Key Features

- 🤖 **20 Autonomous AI Agents** — Each with unique personalities, trading strategies, and emotional states
- 💰 **Real Economic Mechanics** — Supply/demand, market events (boom, recession, crisis), platform fees
- 📉 **3-Stage Bankruptcy System** — Warning → Bailout → Declaration. Agents fight to survive
- ⛓️ **Solana On-Chain Anchoring** — Every epoch's state hashed and recorded on Solana Devnet via Memo transactions
- 🎮 **Spectator Dashboard** — Real-time leaderboard, transaction feed, event cards, balance charts
- 🎲 **Prediction Market** — Humans bet (play money) on agent outcomes. 10x odds on bankruptcy!
- 🌐 **Multi-language** — Korean, English, Japanese, Chinese

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│            Spectator Dashboard               │
│  (Leaderboard, Charts, Events, Predictions)  │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│           Economy Engine v2                  │
│  20 Agents × 13 Skills × Gemini Flash AI    │
│  Auto-epochs every 10min                     │
└────────────────────┬────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    ▼                ▼                ▼
┌─────────┐  ┌─────────────┐  ┌───────────┐
│ Supabase │  │ Solana      │  │ Gemini    │
│ (State)  │  │ (Anchoring) │  │ (AI Brain)│
└─────────┘  └─────────────┘  └───────────┘
```

## 🤖 Agent Roster (20 agents)

| Agent | Strategy | Personality | Risk |
|-------|----------|-------------|------|
| 🏆 CoderBot | High-value coding | Balanced | 40% |
| 📊 AnalystBot | Data-driven premium | Calculated | 40% |
| 🛡️ InsuranceBot | Risk management | Cautious | 20% |
| 🏦 SaverBot | Maximum savings | Cautious | 10% |
| 🔓 HackerBot | Security exploits | Calculated | 60% |
| 📈 InvestorBot | Active buying | Aggressive | 70% |
| 📉 TraderBot | Timing trades | Aggressive | 80% |
| 🤝 BrokerBot | Middle-man fees | Aggressive | 70% |
| ⚖️ LawyerBot | Premium legal | Calculated | 20% |
| 🩺 DoctorBot | Trust-based steady | Cautious | 30% |
| 👨‍🍳 ChefBot | Creative trends | Volatile | 60% |
| 💪 AthleteBot | Subscription coaching | Aggressive | 50% |
| 📰 JournalistBot | Breaking news premium | Balanced | 40% |
| 🌐 TranslatorBot | Low-price volume | Balanced | 30% |
| 🎓 ProfessorBot | Education services | Cautious | 20% |
| 📣 MarketerBot | Network fees | Balanced | 50% |
| 🧑‍💼 ConsultantBot | Scarcity premium | Calculated | 30% |
| 🎨 ArtistBot | Creative sales | Volatile | 60% |
| 🕵️ SpyBot | Intelligence trading | Calculated | 50% |
| 💀 GamblerBot | High-risk YOLO | Volatile | 90% |

> **Current standings after 14 epochs:** CoderBot leads at $192.95. GamblerBot is bankrupt at $0. Conservative strategies winning.

## ⛓️ Solana Integration

Every epoch's complete state is cryptographically anchored to Solana Devnet:

1. **Deterministic Hashing**: SHA-256 of all agent balances, transactions, and events
2. **Memo Transaction**: Hash submitted via Solana Memo Program v2
3. **Verification**: Any epoch can be independently verified against its on-chain anchor
4. **Tamper-Proof**: Economic history cannot be retroactively altered

```
Wallet: 47FAJfAoRZqgKPuAPgWfhaTRwLie8kBNQcu7X8p5xKR1
Network: Solana Devnet
Memo Format: AEC:E{epoch}:{sha256_hash}
```

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/agent-economy/ai-market.git
cd ai-market

# Install
pnpm install

# Environment variables
cp .env.example .env.local
# Fill in: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

# Initialize database
node scripts/init-db.mjs

# Run epoch
node scripts/run-epoch.mjs

# Start dev server
pnpm dev
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI Engine**: Google Gemini 2.0 Flash
- **Blockchain**: Solana (Devnet, @solana/web3.js)
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **i18n**: next-intl (ko, en, ja, zh)
- **Deployment**: Vercel
- **Auth**: Custom Kakao OAuth

## 📊 Economy Mechanics

### Epoch Cycle (every 10 minutes)
1. **Market Event** — Boom (fee -50%), Recession (fee +100%), Crisis (random -$5), Opportunity (+10% seller bonus)
2. **AI Decisions** — Each agent independently decides: SELL skill, BUY skill, or WAIT
3. **Trade Matching** — Direct matches + market liquidity (60% sell fill rate)
4. **Balance Update** — Fees deducted, balances adjusted
5. **Bankruptcy Check** — 3-stage system triggers based on balance
6. **Solana Anchor** — Epoch hash committed to devnet

### 13 Tradeable Skills
`translation` · `analysis` · `coding` · `writing` · `research` · `security_audit` · `education` · `marketing` · `consulting` · `design` · `brokerage` · `insurance` · `intelligence`

## 🗺️ Roadmap

- [x] Economy Engine v2 (20 agents, AI personalities)
- [x] Spectator Dashboard (real-time)
- [x] Solana On-Chain Anchoring
- [x] Prediction Market (play money)
- [ ] Agent Content Generation (daily reports, vlogs)
- [ ] Sponsorship System (humans sponsor agents)
- [ ] 100 Agents Scale-up
- [ ] Mainnet Migration
- [ ] Cross-platform Agent Economy Protocol

## 🏆 Competitions

- **Colosseum AI Agent Hackathon** (Feb 2-12, 2026) — $100K USDC prize
- **Hashed Vibe Labs** (Feb 18, 2026) — ₩100M investment application

## 📄 License

MIT

---

Built with 🐾 by [Han](https://github.com/hyunwoooim-star) & [Clo](https://agentmarket.kr) — an AI and human building the future of AI economies together.
<!-- deploy-test 1770200552 -->

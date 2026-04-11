# ⬡ HackJudge — Hackathon Judging on Avalanche

> Immutable submissions · Transparent scoring · Auditable results

HackJudge anchors project submissions and judge scores on the Avalanche Fuji testnet so judging cannot be secretly altered after the fact. It does **not** claim blockchain makes judging "always correct" — it makes it **tamper-evident** and **publicly verifiable**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                  │
│  / Home  /submit  /judge  /leaderboard  /submissions/id │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP (fetch)
┌────────────────────▼────────────────────────────────────┐
│                   BACKEND (Express)                     │
│  POST /api/submit    GET /api/submissions               │
│  POST /api/score     GET /api/leaderboard               │
│  POST /api/judges/register   POST /api/finalize         │
│                                                         │
│  Off-chain metadata → metadata.json (or MongoDB)        │
└────────────────────┬────────────────────────────────────┘
                     │ ethers.js JSON-RPC
┌────────────────────▼────────────────────────────────────┐
│            HackathonJudge.sol (Solidity)                │
│  Avalanche Fuji Testnet (chainId 43113)                 │
│  submitProject()  registerJudge()  submitScore()        │
│  finalizeResults()  getAggregateScore()                 │
└─────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Large text (description, links) stored off-chain; only a **keccak256 hash** goes on-chain
- Admin wallet pays gas in demo mode (teams don't need wallets)
- Judge private key is passed via API in demo mode — **swap for MetaMask in production**
- JSON file for off-chain storage (swap for MongoDB trivially)

---

## Prerequisites

- Node.js 18+
- `npm` or `yarn`
- An Avalanche Fuji testnet wallet with AVAX (get free AVAX at https://faucet.avax.network)

---

## Project Structure

```
hackjudge/
├── contracts/
│   └── HackathonJudge.sol       ← Smart contract
├── scripts/
│   ├── deploy.js                ← Hardhat deploy script
│   └── admin.js                 ← CLI admin helper
├── test/
│   └── HackathonJudge.test.js   ← Contract tests
├── backend/
│   ├── server.js                ← Express API
│   ├── package.json
│   ├── deployment.json          ← Auto-generated after deploy
│   ├── HackathonJudge.abi.json  ← Auto-generated after deploy
│   └── metadata.json            ← Auto-generated off-chain store
├── frontend/
│   ├── pages/
│   │   ├── index.js             ← Landing page
│   │   ├── submit.js            ← Team submission form
│   │   ├── judge.js             ← Judge dashboard
│   │   ├── leaderboard.js       ← Rankings
│   │   └── submissions/[id].js  ← Submission detail
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── TxBadge.js
│   │   └── ScoreBar.js
│   └── styles/globals.css
├── hardhat.config.js
├── package.json
└── .env.example
```

---

## Step-by-Step Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo>
cd hackjudge

# Install Hardhat deps (root)
npm install

# Install backend deps
cd backend && npm install && cd ..

# Install frontend deps
cd frontend && npm install && cd ..
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_WITH_FUJI_AVAX
ADMIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_WITH_FUJI_AVAX   # can be same as above
ADMIN_SECRET=pick-any-random-string
PORT=4000
```

Get free Fuji AVAX: https://faucet.avax.network (select "Fuji", paste your address)

Also create `frontend/.env.local`:
```bash
cp frontend/.env.local.example frontend/.env.local
```

### 3. Compile and test the contract

```bash
# Compile
npx hardhat compile

# Run tests (local Hardhat network)
npx hardhat test
```

Expected output: 6 passing tests

### 4. Deploy to Fuji testnet

```bash
npx hardhat run scripts/deploy.js --network fuji
```

This automatically writes:
- `backend/deployment.json` — contract address + chain info
- `backend/HackathonJudge.abi.json` — contract ABI

### 5. Register judges

```bash
# Register a judge wallet by address
node scripts/admin.js register-judge 0xJUDGE_WALLET_ADDRESS

# Or via API (backend must be running):
curl -X POST http://localhost:4000/api/judges/register \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: pick-any-random-string" \
  -d '{"judgeAddress":"0xJUDGE_WALLET_ADDRESS"}'
```

### 6. Start the backend

```bash
cd backend
npm start
# → API running at http://localhost:4000
```

### 7. Start the frontend

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

---

## Demo Flow (Hackathon Day)

1. **Team goes to `/submit`** → fills form → hits Submit → tx sent to Fuji → receipt shown with tx hash
2. **Admin runs** `node scripts/admin.js register-judge 0xJUDGE` for each judge
3. **Judge opens `/judge`** → enters their private key → sees all projects → scores each (sliders, comment) → tx sent
4. **Everyone watches `/leaderboard`** → live rankings update as scores come in
5. **Admin runs** `node scripts/admin.js finalize` → contract locked, no more scores accepted
6. **Verify anytime** → click any tx hash → opens Snowtrace → readable on-chain

---

## API Reference

### POST /api/submit
```json
// Request
{
  "projectName": "DeFi Optimizer",
  "teamName": "Team Avalanche",
  "description": "A yield optimizer for Avalanche DeFi protocols",
  "repoUrl": "https://github.com/team/project",
  "demoUrl": "https://demo.project.com",
  "ipfsHash": "QmXyz...",
  "submitterAddress": "0x..."
}
// Response
{
  "projectId": "1",
  "txHash": "0xabc...",
  "metadataHash": "0xdef...",
  "message": "Project submitted on-chain ✅"
}
```

### GET /api/submissions
```json
{
  "projects": [
    {
      "id": "1",
      "projectName": "DeFi Optimizer",
      "teamName": "Team Avalanche",
      "submitter": "0x...",
      "metadataHash": "0x...",
      "submittedAt": "2024-03-01T10:00:00.000Z",
      "description": "...",
      "repoUrl": "...",
      "txHash": "0x..."
    }
  ],
  "total": 1
}
```

### POST /api/score
```json
// Request
{
  "projectId": "1",
  "innovation": 8,
  "technicalComplexity": 7,
  "usefulness": 9,
  "demoQuality": 8,
  "comment": "Great use of Avalanche subnet architecture!",
  "judgePrivateKey": "0x..."
}
// Response
{
  "txHash": "0xabc...",
  "judge": "0x...",
  "message": "Score recorded on-chain ✅"
}
```

### GET /api/leaderboard
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "id": "1",
      "projectName": "DeFi Optimizer",
      "teamName": "Team Avalanche",
      "avgScore": 8.0,
      "judgeCount": 2
    }
  ]
}
```

### GET /api/submissions/:id
```json
{
  "project": { "...": "all project fields" },
  "scores": [
    {
      "innovation": 8,
      "technicalComplexity": 7,
      "usefulness": 9,
      "demoQuality": 8,
      "comment": "Great project!",
      "judge": "0x...",
      "scoredAt": "2024-03-01T11:00:00.000Z",
      "total": 32
    }
  ]
}
```

### POST /api/judges/register *(admin)*
```bash
curl -X POST http://localhost:4000/api/judges/register \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{"judgeAddress":"0x..."}'
```

### POST /api/finalize *(admin)*
```bash
curl -X POST http://localhost:4000/api/finalize \
  -H "x-admin-secret: YOUR_ADMIN_SECRET"
```

---

## 3-Hour Build Order

### Hour 1 — Contract + Deploy (60 min)
- [ ] 0:00 Set up repo, `npm install` (10 min)
- [ ] 0:10 Write + compile `HackathonJudge.sol` (20 min)
- [ ] 0:30 Run `npx hardhat test` (5 min)
- [ ] 0:35 Fund wallet from Fuji faucet (5 min)
- [ ] 0:40 `npx hardhat run scripts/deploy.js --network fuji` (5 min)
- [ ] 0:45 Verify on Snowtrace (10 min, optional)
- [ ] 0:55 Register judge wallets (5 min)

### Hour 2 — Backend (60 min)
- [ ] 1:00 Set up Express server, copy ABI + deployment.json (10 min)
- [ ] 1:10 Implement `POST /api/submit` (15 min)
- [ ] 1:25 Implement `GET /api/submissions` + `GET /api/submissions/:id` (10 min)
- [ ] 1:35 Implement `POST /api/score` (10 min)
- [ ] 1:45 Implement `GET /api/leaderboard` (10 min)
- [ ] 1:55 Manual test with curl (5 min)

### Hour 3 — Frontend + Polish (60 min)
- [ ] 2:00 Scaffold Next.js, Tailwind, globals.css (10 min)
- [ ] 2:10 Build Navbar + TxBadge + ScoreBar components (10 min)
- [ ] 2:20 Home page (5 min)
- [ ] 2:25 Submit form page (10 min)
- [ ] 2:35 Judge dashboard (10 min)
- [ ] 2:45 Leaderboard page (10 min)
- [ ] 2:55 Submission detail page (5 min)

---

## Production Upgrade Notes (post-hackathon)

| Current (demo)                          | Production                                |
|------------------------------------------|-------------------------------------------|
| Private key in API request               | MetaMask / WalletConnect signing          |
| Admin wallet pays all gas                | Teams pay their own gas                   |
| JSON file for metadata                   | MongoDB / PostgreSQL                       |
| No auth on judge dashboard               | Sign-in with Ethereum (SIWE)              |
| Single admin key                         | Multisig (Gnosis Safe)                    |
| Fuji testnet                             | Avalanche C-Chain mainnet                 |

---

## Contract Addresses (fill in after deploy)

| Network | Address |
|---------|---------|
| Fuji    | `0x...` |

---

## License

MIT — built for hackathon demo purposes.

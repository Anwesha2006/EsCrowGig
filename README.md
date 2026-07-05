# EscrowGig

EscrowGig is a milestone-based decentralised freelance escrow dApp built on Stellar. Clients fund an escrow contract up front, freelancers submit proof for each milestone, and a preassigned arbiter can resolve disputes if the parties disagree.

The repository includes a Soroban Rust smart contract and a React + TypeScript frontend using Vite, TailwindCSS, Stellar Wallets Kit, and `@stellar/stellar-sdk`.

---

## Live Deployment

| | |
|---|---|
| **Frontend** | _Deploy to Vercel or Netlify — see [Deployment](#deployment) below_ |
| **Stellar Testnet Contract ID** | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCNIH` |
| **Network** | Stellar Testnet |

> The contract is live on Stellar Testnet. You can inspect it on [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCNIH).

---

## Screenshots

### Landing Page

![EscrowGig landing page — desktop](docs/screenshots/landing-desktop.png)

### Dashboard (wallet disconnected)

![Gig Dashboard — wallet disconnected state](docs/screenshots/dashboard-disconnected.png)

### Connect Wallet Modal

![Connect Your Wallet modal with Freighter, xBull, Albedo, LOBSTR](docs/screenshots/connect-wallet-modal.png)

### Mobile — Landing Page

![EscrowGig landing page on mobile](docs/screenshots/landing-mobile.png)

### Mobile — Dashboard

![Gig Dashboard on mobile — wallet disconnected](docs/screenshots/dashboard-mobile.png)

---

## Project Structure

```text
escrowgig/
├── contracts/
│   └── escrow/
│       ├── src/lib.rs
│       └── Cargo.toml
├── docs/
│   └── screenshots/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   ├── index.html
│   └── vite.config.ts
├── README.md
└── .env.example
```

---

## Run Locally

1. Install frontend dependencies.

   ```bash
   cd frontend
   npm install
   ```

2. Create a local environment file.

   ```bash
   cp ../.env.example .env
   ```

3. The contract ID is already filled in `.env.example`. Copy it as-is or override with your own deployment.

   ```text
   VITE_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCNIH
   VITE_STELLAR_NETWORK=testnet
   VITE_HORIZON_URL=https://horizon-testnet.stellar.org
   VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
   ```

4. Start the dev server.

   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173`.

---

## Smart Contract

The Soroban contract lives in `contracts/escrow/src/lib.rs`. It exposes:

| Function | Description |
|---|---|
| `initialize(admin, token)` | One-time setup with token contract address |
| `create_gig(client, freelancer, arbiter, milestones)` | Creates a new escrow gig |
| `fund_gig(gig_id)` | Client deposits XLM into the contract |
| `submit_milestone(gig_id, milestone_id, proof_url)` | Freelancer submits proof |
| `approve_milestone(gig_id, milestone_id)` | Client releases funds for that milestone |
| `raise_dispute_as(caller, gig_id, milestone_id)` | Client or freelancer flags a dispute |
| `resolve_dispute(gig_id, milestone_id, release_to)` | Arbiter resolves to either party |
| `get_gig(gig_id)` | Read gig state |
| `cancel_gig(gig_id)` | Client cancels before any work starts |

### Build

```bash
cargo build --target wasm32-unknown-unknown --release -p escrowgig-escrow
```

### Deploy to Testnet

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrowgig_escrow.wasm \
  --source <your-identity> \
  --network testnet
```

Then initialize with the Testnet native asset token contract address and paste the resulting contract ID into `frontend/.env`.

---

## End-to-End Test Flow

1. Connect a Freighter wallet funded with Testnet XLM.
2. Open `/create`.
3. Enter a freelancer and arbiter Stellar address.
4. Add at least two milestones with XLM amounts.
5. Create and fund the gig.
6. Switch to the freelancer wallet — submit a proof URL for milestone 1.
7. Switch to the client wallet — approve milestone 1.
8. Verify the freelancer balance and check the tx hash on Stellar Expert Testnet.
9. Raise a dispute on another milestone.
10. Switch to the arbiter wallet — resolve the dispute to either party.
11. When all milestones are approved, the feedback form appears automatically.
12. Open `/admin` with the password from `VITE_ADMIN_PASSWORD` to review submitted feedback.

---

## Wallet Support

EscrowGig uses [@creit-tech/stellar-wallets-kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit) and supports:

- **Freighter** — [freighter.app](https://www.freighter.app/)
- **xBull** — [xbull.app](https://xbull.app/)
- **Albedo** — [albedo.link](https://albedo.link/)
- **LOBSTR** — [lobstr.co](https://lobstr.co/)

If a wallet extension is not detected the modal shows an Install link.

---

## Analytics and Feedback

When `VITE_POSTHOG_KEY` is set, these events are sent to PostHog:

- `wallet_connected`
- `gig_created`
- `milestone_submitted`
- `milestone_approved`
- `dispute_raised`
- `feedback_submitted`

Without a PostHog key, events fall back to `localStorage`. Feedback is also persisted in `localStorage` for the MVP and is visible on `/admin`.

---

## Deployment

The frontend ships with both `frontend/vercel.json` and `frontend/netlify.toml`.

### Vercel

1. Import the repo and set the **project root** to `frontend`.
2. Add env vars from `.env.example`.
3. Deploy.

### Netlify

1. Set **base directory** to `frontend`, build command to `npm run build`, publish directory to `dist`.
2. Add env vars from `.env.example`.
3. Deploy.

---

## Known Limitations

- Gig data, feedback, stats, and analytics fallback are persisted in `localStorage`. A production deployment should replace these with on-chain contract reads and a backend (e.g. Supabase) for feedback.
- `frontend/src/lib/stellar.ts` is structured around the contract surface but still needs full Soroban transaction assembly, simulation, signing, and submission for live testnet use.
- The contract must be initialized with the native token address after deployment before real escrow transfers work.

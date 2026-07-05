# EscrowGig

EscrowGig is a milestone-based decentralized freelance escrow dApp for Stellar. Clients fund an escrow contract up front, freelancers submit proof for each milestone, and a preassigned arbiter can resolve disputes if the parties disagree.

The repository includes a Soroban Rust smart contract and a React + TypeScript frontend using Vite, TailwindCSS, Stellar Wallets Kit, and `@stellar/stellar-sdk`.

## Live Deployment

- Frontend URL: `TODO: deploy to Vercel or Netlify`
- Stellar Testnet contract ID: `TODO: deploy contract and add the ID`
- Network: Stellar Testnet

## Project Structure

```text
escrowgig/
├── contracts/
│   └── escrow/
│       ├── src/lib.rs
│       └── Cargo.toml
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

## Run Locally

1. Install the frontend dependencies.

   ```bash
   cd frontend
   npm install
   ```

2. Create a local environment file.

   ```bash
   cp ../.env.example .env
   ```

3. Add your deployed contract ID to `frontend/.env`.

   ```text
   VITE_CONTRACT_ID=CD...
   VITE_STELLAR_NETWORK=testnet
   VITE_HORIZON_URL=https://horizon-testnet.stellar.org
   VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
   ```

4. Start the app.

   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173`.

## Smart Contract

The Soroban contract is in `contracts/escrow/src/lib.rs`. It implements:

- `initialize(admin, token)`
- `create_gig(client, freelancer, arbiter, milestones)`
- `fund_gig(gig_id)`
- `submit_milestone(gig_id, milestone_id, proof_url)`
- `approve_milestone(gig_id, milestone_id)`
- `raise_dispute(gig_id, milestone_id)` for client-authenticated dispute creation
- `raise_dispute_as(caller, gig_id, milestone_id)` for either client or freelancer
- `resolve_dispute(gig_id, milestone_id, release_to)`
- `get_gig(gig_id)`
- `cancel_gig(gig_id)`

Build the contract:

```bash
cargo build --target wasm32-unknown-unknown --release -p escrowgig-escrow
```

Deploy to Stellar Testnet with the Stellar CLI after configuring a testnet identity:

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrowgig_escrow.wasm \
  --source <identity> \
  --network testnet
```

Then initialize it with the Testnet native asset token contract address and add the deployed contract ID to `.env.example` and `frontend/.env`.

## End-to-End Test Flow

1. Connect a Freighter wallet funded with Testnet XLM.
2. Open `/create`.
3. Enter freelancer and arbiter Stellar addresses.
4. Add at least two milestones with XLM amounts.
5. Create and fund the gig.
6. Sign in as the freelancer wallet and submit a proof URL for milestone 1.
7. Sign in as the client wallet and approve milestone 1.
8. Check the freelancer wallet balance and the transaction hash on Stellar Expert Testnet.
9. Raise a dispute on another milestone.
10. Sign in as the arbiter and resolve the dispute to either the client or freelancer.
11. When all milestones are approved, submit the completion feedback form.
12. Open `/admin` and enter the admin password from `VITE_ADMIN_PASSWORD` to review feedback.

## Screenshots

Add screenshots after deploying or running locally:

- Landing: `docs/screenshots/landing.png`
- Dashboard: `docs/screenshots/dashboard.png`
- Mobile gig detail: `docs/screenshots/gig-detail-mobile.png`

## Analytics and Feedback

EscrowGig sends these events to PostHog when `VITE_POSTHOG_KEY` is configured:

- `wallet_connected`
- `gig_created`
- `milestone_submitted`
- `milestone_approved`
- `dispute_raised`
- `feedback_submitted`

Without PostHog, events are stored in `localStorage` as a development fallback. Feedback is also stored in `localStorage` for the MVP and displayed on `/admin`.

## Deployment

The frontend includes both `frontend/vercel.json` and `frontend/netlify.toml`.

For Vercel:

1. Import the repository.
2. Set the project root to `frontend`.
3. Add the environment variables from `.env.example`.
4. Deploy.

For Netlify:

1. Set the base directory to `frontend`.
2. Use `npm run build`.
3. Publish `frontend/dist`.
4. Add the environment variables from `.env.example`.

## Known Limitations

- The frontend currently persists gig, feedback, stats, and analytics fallback data in `localStorage`; a production deployment should replace this with contract reads plus Supabase or another backend for reviewable feedback.
- The UI helper in `frontend/src/lib/stellar.ts` is structured around the contract surface but still needs full Soroban transaction assembly, simulation, signing, and submission before real mainline testnet use.
- The contract must be deployed and initialized before the live app can perform real escrow transfers.
- README screenshot image files are listed for submission but have not been captured in this workspace.

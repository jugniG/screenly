Screenly Development Guide

Product Summary:
- Screenly is an Android app blocker with financial commitments.
- Users deposit USDC on Solana Devnet/Mainnet to lock apps.
- If they unlock apps via 'I give in' or delete a rule, they forfeit $5 USDC to the treasury.
- Local wallets are generated on-device and mapped to the DB.
- Admin clawback allows reclaiming abandoned funds on-chain.

Key Folders:
- apps/app: React Native mobile client
- apps/website: Web backend and dashboard
- apps/screenly-escrow: Solana Anchor smart contract
- packages/db: Database schema and migrations
- packages/api: oRPC Hono API backend

Run App Client:
- cd apps/app
- npm run android (builds and runs Android app)
- npm run start (starts Metro bundler)

Smart Contract Commands:
- cd apps/screenly-escrow
- anchor build (compiles smart contract)
- anchor test (runs Anchor tests)
- cargo build-sbf (builds contract via cargo)

Database Commands:
- npm run db:push -w packages/db (pushes schema updates)
- npm run db:generate -w packages/db (generates migrations)
- npm run db:migrate -w packages/db (applies migrations)

Dev Server Command:
- npm run dev (starts Hono server via turbo)

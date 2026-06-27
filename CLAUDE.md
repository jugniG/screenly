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


=== DETAILED PRODUCT OVERVIEW (FOR AI LANDING PAGE GENERATOR) ===

🚀 Core Value Proposition
Screenly is a Web3-powered productivity enforcer and commitment device designed to break digital addiction using hard financial incentives (loss aversion). By combining on-chain Solana smart contracts with a strict native Android app blocker, Screenly converts the temptation of mindless scrolling into a real-time financial penalty. 

🛠 How it Works (The Workflow)
1. Choose Your Target: Select the distracting apps you want to restrict (e.g., Instagram, X/Twitter, YouTube).
2. Set the Rules: Customize your blocking rules:
   * Daily Limit: Restrict usage to a set number of minutes per day (e.g., max 15 minutes of social media).
   * Schedule: Block access during specific deep-work hours (e.g., 9 AM to 5 PM).
   * Block Always: Completely lock the app to break the habit loop entirely.
3. Put Skin in the Game: Deposit a commitment stake of USDC (minimum $10) from your secure, on-device Solana wallet. Your funds are locked in a decentralized escrow contract.
4. Stay Disciplined or Pay: 
   * If you stay disciplined, your funds remain safe.
   * If you give in and unlock a blocked app, or delete a rule early, your committed USDC is immediately forfeited from the escrow to the Screenly treasury.

✨ Key Features & Technical Details
• On-Chain Escrows: Transparent, decentralized escrow smart contracts deployed on the Solana blockchain (Devnet/Mainnet) ensuring funds are held securely.
• Native Android Enforcer: A background service that monitors active foreground applications and overlays a blocking screen instantly when limits are breached.
• On-Device Wallet: Generates a self-custodial Solana keypair on-device, mapping it to the database for smooth one-click transaction signing.
• Stable Commitments: Uses USDC to avoid crypto volatility, ensuring the financial stakes remain stable and clear.
• Anti-Bypass Protection: Traps the user on the block screen, disabling the back button and hardware shortcuts until they choose to forfeit their bet or close the distracting app.

🧠 The Psychology (Why it Works)
Pure willpower is a finite resource. Screenly leverages loss aversion—the psychological principle that the pain of losing something (e.g., $10) is twice as powerful as the pleasure of gaining it. By putting a direct financial cost on instant gratification, Screenly forces the brain's rational system to override the impulse of mindless scrolling.

🎯 Target Audience
• Founders, developers, and creators who need uninterrupted blocks of time for deep focus.
• Students studying for exams who struggle with screen time.
• Anyone seeking to break toxic scrolling habits and reclaim control over their time.

# Screenly - Product Context

## What is Screenly?
Screenly is an Android app blocker with real financial stakes. Users restrict their own apps (social media, games, etc.) and back those commitments with a $5 USDC deposit per app on the Solana blockchain. The core premise: if you break your commitment and open a blocked app, you forfeit $5 permanently. Money on the line makes self-discipline actually stick.

## Who It's For
People who want to limit their own screen time but lack the willpower to self-enforce. Screenly targets individuals addicted to or distracted by specific apps who want an external, financially-enforced commitment mechanism to break the habit.

## Core User Problem
Traditional screen time apps are easy to bypass - you just turn them off. Screenly makes bypassing cost real money. The psychological effect of losing $5 is far stronger than a notification saying "you've exceeded your limit."

## Three Restriction Types
- Daily Limit: Block the app after X minutes of use per day
- Time Schedule: Only allow the app during specific hours (e.g. 10 PM - 7 AM)
- Always Block: Permanently blocked at all times

## The Commitment Mechanism (Solana Escrow)
1. When adding a restriction, the user deposits $5 USDC into a smart contract escrow tied to that specific app (keyed by Android package name).
2. Each app is its own commitment - 3 restricted apps = $15 at stake.
3. Two ways to forfeit the $5:
   - Tapping "I give in" on the block screen forfeits $5 on-chain and unlocks the app until midnight
   - Removing a restriction from the account screen forfeits $5 on-chain and deletes the rule
4. A Solana wallet is auto-generated per device and stored locally. Currently running on devnet for demo/grant purposes.

## How Enforcement Works on Android
Two Android permissions power the enforcement:
- Usage Stats Permission: reads how many minutes per day each app has been used (for daily limit rules)
- Accessibility Service: monitors the foreground app in real time. When a blocked app is opened, the service immediately intercepts and redirects the user to Screenly's block screen

The block screen:
- Shows the blocked app's icon and name
- Disables the hardware back button (no easy escape)
- Auto-dismisses only when the user switches to a different app
- Gives two choices: "I give in" (pay $5, get access today) or "Back to home"

## User Flow
1. Onboarding: 2-slide walkthrough showing the product
2. Sign up / Sign in: email-based auth via Better Auth
3. Permissions setup: guided 2-step flow to grant Usage Access + Accessibility Service
4. Add an app: 4-step wizard - pick an app, choose restriction type, configure parameters, deposit $5 USDC
5. Daily use: app runs silently in background, blocks when rules are hit, shows block screen

## Key Product Decisions
- $5 per app: small enough to be accessible, large enough to sting
- "I give in" language: honest framing, no judgment, just consequence
- No free bypasses: the only way out costs money (or waiting for the schedule window)
- On-device wallet: no external wallet app required, lower friction for the sideloaded APK demo
- Android only: iOS doesn't allow the accessibility service pattern needed for enforcement

## Tech Stack Summary
- Mobile: React Native (Expo), Android only, release APK (no Metro dev server)
- Backend: Hono API server deployed on Vercel
- Database: PostgreSQL (Supabase), all tables in screenly schema
- Auth: Better Auth with email OTP
- Blockchain: Solana devnet, Anchor program (screenly-escrow), @solana/web3.js
- Native module: custom screenly-enforcer Kotlin module for usage stats, accessibility service, and foreground app detection

## Solana Wallet Design Decisions & Industry Conventions

### Why Generate a Wallet Locally? (Embedded Wallet Strategy)
Screenly uses an **embedded local wallet** model (automatically generating a keypair on the device and storing it in `AsyncStorage`). 

Here is how it compares to industry conventions and why it was chosen:

1. **User Experience (UX) vs. Traditional Connect Wallet**:
   * *Traditional Web3 (e.g., Phantom Connect)*: In web apps, users click "Connect Wallet" and approve every transaction through a browser extension. On Android, this requires deep-linking between Screenly and the Phantom mobile app. If a user gets blocked and wants to "give in", switching apps to sign the transaction is a clunky and easily bypassable experience.
   * *Embedded Wallet (Screenly)*: The app generates a local wallet keypair. This allows Screenly to sign transactions silently on the user's phone in milliseconds without requiring another app.

2. **How Funding Works (The Cold Start Problem)**:
   * Because the generated wallet starts with a **0 balance**, the user must manually copy their Screenly wallet address and transfer **USDC** and **SOL** (for gas) into it from their main wallet (e.g., Phantom or Binance).
   * *Industry Standard for Production*: In commercial consumer Web3 apps, developers usually integrate a **Fiat On-Ramp** (like MoonPay, Stripe, or Coinbase Pay) directly into the app. This allows users to buy USDC using a credit card without needing to know about address transfers or external wallets.

3. **Key Recovery & Security**:
   * Since the private key is stored locally in the phone's `AsyncStorage`, deleting the app will delete the wallet.
   * *Industry Standard for Production*: Production apps use secure MPC (Multi-Party Computation) systems (like *Privy* or *Web3Auth*) that split the private key. Part of the key is stored on the user's device (linked to iCloud/Google Drive backup), and part is secured by a login provider (Google/Email). This allows the user to recover their wallet if they delete the app or change phones.


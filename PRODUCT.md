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

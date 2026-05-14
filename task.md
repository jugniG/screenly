# Screenly Task Progress

## Status: CORE COMPLETE — needs env vars + native enforcement

## Completed
- [x] DB schema (appRules, usageLogs, unlockEvents) — pushed to Turso
- [x] Better Auth: Google OAuth + Magic Link (Resend) — email/password REMOVED
- [x] Auth schema regenerated (verification table for magic links)
- [x] Hono API routes: /api/rules, /api/usage, /api/unlock, /api/unlock/history
- [x] TypeScript clean (web + mobile)
- [x] Mobile auth: sign-in screen (magic link + Google) — sign-up REMOVED (magic link auto-creates)
- [x] Mobile deep link callback: app/auth/callback.tsx (screenly://auth/callback)
- [x] Mobile tab screens: Dashboard, My Apps, Stats, Account
- [x] Mobile add-rule flow (3-step)
- [x] Mobile block screen (countdown + pay with Dodo)
- [x] UI components: Button (outline variant + icon prop), Card, Input, RuleBadge, theme
- [x] resend package installed in web

## Not Implemented (native enforcement)
- [ ] Android: UsageStatsManager + SYSTEM_ALERT_WINDOW overlay
  - Requires custom Expo config plugin + Kotlin module
  - Device must grant usage stats permission
- [ ] iOS: react-native-device-activity
  - Requires DeviceActivity entitlement (Apple review needed)

## Env Vars Needed From User
- GOOGLE_CLIENT_ID (web OAuth client)
- GOOGLE_CLIENT_SECRET
- RESEND_API_KEY
- DODO_PAYMENTS_API_KEY
- DODO_WEBHOOK_KEY
- DODO_UNLOCK_PRODUCT_ID
(BETTER_AUTH_SECRET + DATABASE_URL already set)

## Running
- API: `cd packages/web && bun run dev` → port 3000
- Mobile: `cd packages/mobile && bun run dev`

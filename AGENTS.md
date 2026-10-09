# AGENTS.md

Instructions for coding agents working in this repo.

## Codebase overview

Screenly is an **npm workspaces monorepo** for an Android app that blocks apps and
enforces screen-time limits, backed by a stake the user puts at risk.

```
apps/android_app   Expo / React Native app (the product)
apps/web           TanStack Start web app + hosts the oRPC API + Play webhook
packages/api       oRPC router, Google Play verification and refunds
packages/db        Drizzle schema + migrations
packages/monetization  The money rules, shared by app and server
```

TypeScript throughout. Package manager is npm (do not introduce yarn/pnpm).

## Tech stack

**Mobile** — Expo SDK 57, React Native 0.86, expo-router (file-based in
`apps/android_app/src/app`), Uniwind (Tailwind for RN), `react-native-iap` 16.x
for Google Play Billing, `@better-auth/expo`, and a custom Kotlin native module
(`src/modules/screenly-enforcer`) that owns usage-stats reads and the
accessibility service that actually blocks apps.

**Web** — TanStack Start (Vite + React 19), TanStack Router (file-based in
`apps/web/src/routes`), shadcn/ui + Tailwind v4, better-auth with
`drizzleAdapter`.

**Server API** — oRPC with Zod validation. `/api/rpc/*` for RPC,
`/api/play-webhook` for Google Play RTDN.

**Database** — Drizzle ORM + pg. Schema in `packages/db/src/schema.ts` using
`pgSchema('screenly')`. Migrations via drizzle-kit.

**Payments** — Google Play Billing **only**. Dodo was removed; do not reintroduce
it or any hosted checkout. `com.android.vending.BILLING` must stay in
`apps/android_app/app.json`.

## Import aliases

| App | Alias | Resolves to |
|---|---|---|
| `apps/android_app` | `@/*` | `./src/*` |
| `apps/web` | `#/*` and `@/*` | `./src/*` (prefer `#/`) |

## Money rules

**All money lives in `packages/monetization`.** That file is the single source of
truth for stake amounts, forfeit percentages, durations, and currency — the app
and the API both import it, so a quoted price can never drift from what is
charged.

- Amounts are **integer minor units** (paise/cents). Never floats.
- The client never supplies an amount. The server resolves it from `STAKE_TIERS`.
- `challengeEndsAt()` takes a duration **id**, never a raw day count, and rejects
  unknown ids.
- Play product ids **are** the tier ids (`stake_50` … `stake_1000`). Changing
  them means recreating products in Play Console.

Never hardcode a price, a forfeit percentage, or a duration anywhere else.

## Styling — mobile

**Use Tailwind (`className`) via Uniwind. Never add `StyleSheet.create` entries.**
Tokens live in `apps/android_app/src/global.css` as `@theme` variables.

| Use | Not |
|---|---|
| `className="flex-row items-center px-6 py-4 rounded-xl border"` | `style={styles.row}` + a `StyleSheet.create` entry |
| `className="bg-surface border-border text-text-secondary"` | `style={{ backgroundColor: colors.surface }}` |

1. Adding or changing a style → Tailwind, even a one-line colour change.
2. Touching a `StyleSheet` block → migrate what you touched.
3. Delete `StyleSheet` entries once nothing references them.
4. Prefer theme tokens over raw hex: `background`, `surface`, `surface-alt`,
   `border`, `border-soft`, `text`, `text-secondary`, `text-muted`, `primary`,
   `primary-light`, `success`, `danger`.
5. `add-rule.tsx` and `block.tsx` are still largely `StyleSheet` from before
   Tailwind landed. Treat them as legacy — match their existing pattern only
   where you are not changing style at all. **Never** do this in a new file.

`colors`, `fonts`, `radius`, `spacing` from `@/components/ui/theme` exist for
legacy code. New styling should not import them for inline use.

## Agent instructions and key conventions

1. **Routing.** Never create single dot-nested route files. Use directories:
   `app/(protected)/app-detail.tsx`, not `app/app.detail.tsx`.
2. **Forms.** Any feature with more than 2 input fields should use react-hook-form
   with a Zod resolver. The exception is the add-rule wizard, which is a
   multi-step flow with per-step validation.
3. **Env vars.** There is no central `env.ts`. Read `process.env` directly, and
   never commit a `.env*` file — they are gitignored.
4. **UI components.** Primitives live in `apps/android_app/src/components/ui/`.
   `Card` accepts both `className` (preferred) and `style` (legacy).
5. **Route file size.** If a route file passes ~500 lines, split page-specific
   sub-components into a local folder.
6. **Error handling.** Never swallow an error silently. Every `catch` must
   `console.error` with a short identifying prefix (e.g. `[rtdn] token
   verification failed`) plus the cause. Never surface a bare "Something went
   wrong" — unwrap the oRPC error (`error?.data?.message`) and show the real
   reason.
7. **Reproduce before guessing.** When an error is not one you caused, get the
   real message before proposing a fix. Do not speculate.
8. **No fluffy comments.** Do not restate what the code says, narrate your own
   steps, or add banner comments at the top of a file. Comment only when
   something is genuinely non-obvious: a workaround, a subtle bug, a
   security/correctness constraint, or a "why this and not the obvious
   alternative".
9. **Self-explanatory names.** `vibeScore`, `challengeEndsAt`, `stakeTierId` — not
   `data`, `obj`, `result`, `temp`, `value`, `helper`. Before adding a field, ask
   whether it can be derived from something already stored; a stored duplicate
   drifts out of sync. Prefer deriving at render time.

## Commands — ask before running these

```bash
# mobile
npm run dev --workspace apps/android_app      # builds + installs a debug APK

# web
npm run generate-routes --workspace apps/web  # after adding/renaming routes
npm run build --workspace apps/web

# db — ALWAYS ASK FIRST
npm run db:generate --workspace packages/db
npm run db:migrate  --workspace packages/db
```

**`db:push` is prohibited.** Use `db:generate` + `db:migrate` only.

## Hard rules

- **Never run the dev server yourself.** The user starts it.
- **Never run a build.** Verify with `bun typecheck`. Builds are slow, and the
  Android one needs a Defender exclusion to complete at all.
- **Never run device commands** (`adb`, screenshots, force-stop) without asking.
- Do not run `typecheck` for small changes (styling, copy, one-off JSX). Only when
  the change touches types, routes, server code, or spans several files.
- Prefer answering first and editing directly — do not ask permission for
  routine edits.

## Gotchas that have cost real time

- **`apps/android_app/android/` is gitignored.** It is generated by
  `npx expo prebuild -p android`. `app.json` is the source of truth for version,
  permissions and package name — **anything changed in `app.json` needs a
  prebuild before it takes effect**, and Gradle reads `build.gradle`, not
  `app.json`.
- **The keystore lives inside `android/`, so `prebuild --clean` deletes it.**
  `upload-keystore.jks` and `upload_certificate.pem` sit at
  `apps/android_app/android/`. There is **no backup anywhere in this repo** —
  copy them outside it before ever running `--clean`. Afterwards also restore
  the `SCREENLY_UPLOAD_*` block in `gradle.properties` and the `release`
  signingConfig in `app/build.gradle`.
- **Two caches have silently shipped stale code:** Metro (`/tmp/metro-cache`) and
  Gradle's bundled JS (`android/app/build/generated/assets/`). Telltale sign: an
  unchanged output timestamp. Clear with `npx expo start -c`.
- **Bumping a TanStack dependency with `"latest"` pins can break the build** —
  mismatched `router-core`/`history` versions produce `MISSING_EXPORT` at build
  time. Pin explicitly.
- **Google Play requires an uploaded build declaring
  `com.android.vending.BILLING` before one-time products can be created.**
- **A Play purchase only completes from a Play-installed build.** A sideloaded
  debug APK gets `item-unavailable` no matter how correct the products are.
  Check with `adb shell pm list packages -i com.screenly.app` — `installer=null`
  means sideloaded.

## Web app

Read `apps/web/AGENTS.md` before editing anything under `apps/web`. It carries the TanStack `intent-skills` map, which must be loaded before editing routes or server handlers.

# Plan: android_app - Screen Time + Leaderboard + HeroUI Migration

> Scope: **Only `apps/android_app`** - `apps/app` untouched.  
> Stack: `heroui-native@1.0.9` + `uniwind@1.10` + `tailwindcss@4.3` + `expo@57` + `expo-router` + `drizzle PG` + `@screen/api` (oRPC)

---

## 1. Goals

1. **Screen Time tab** - Calendar picker (end date) + period `24h | 7d | 30d` + list apps `highest -> lowest` usage (local only).
2. **Limits tab** - Keep existing `appRules` flow (`listRules/createRule/...`) migrated to HeroUI (was Home).
3. **Leaderboard tab** - Friends-only competition, lowest total wins. Period `Today | Yesterday | 7d | 30d`. Each contestant shows `avatar | name/email | totalMinutes | top 3 most used apps`.
4. **Account** - Not a tab. Open via `Hi` greeting header in **tabs layout** (shared header for all tabs - avatar + name fallback to email, tap -> `/account`).
5. **Leaderboard snapshot sync** - On `tabs` layout mount (once per app open, not on tab switch): check DB for today's record for current user -> if missing `INSERT`, if exists `UPDATE` with latest from system (reuse Screen Time fetch fn), debounced.
6. **Shared Tabs Header** - `Hi` greeting + `+ Add App` button as **layout header** for all tabs (not per-screen), built in `(tabs)/_layout.tsx` header above `<Slot />`.

---

## 2. Current State (verified)

- `android_app` is minimal template: `HeroUINativeProvider` at `src/app/_layout.tsx:10`, 2 tabs `index/explore`, `global.css` with `@import "tailwindcss/uniwind/heroui-native/styles"`, no Screenly logic.
- `app` has full logic: `ScreenlyEnforcer.getTodayUsage()`, `orpcClient`, `theme.ts` manual StyleSheet, 480-line Home at `apps/app/src/app/(tabs)/index.tsx`.
- `packages/db/src/schema.ts` has `appRules`, `usageLogs {userId, packageName, date, totalMinutes}`, `unlockEvents`, no friends/leaderboard tables.
- `packages/api/src/router/usage.ts` has `getTodayUsage(today only)` + `syncUsage(upsert per app/day)` which is **never called** from `app`. Leaderboard does not exist.

---

## 3. Architecture Decisions

### 3.1 Data Storage
- **Screen Time detail (per-app):** **Local only** (`ScreenlyEnforcer.getTodayUsage()` + optional `AsyncStorage` cache for last 30d). No DB writes per-app. Keeps privacy, zero Vercel cost. 30-day local cache computed client-side.
- **Leaderboard:** **1 row / user / day** in new `leaderboard_snapshots` table: `{userId, date, totalMinutes, topApps JSONB[3], updatedAt}`. Only `total + top3` leaves device, only to accepted friends. Friends-only, no global board.
- **Indexes:** `(userId, date)` unique, `(date)` for leaderboard range.
- **AsyncStorage note:** In legacy `app` it is only used for `setup_done` flag (`apps/app/src/app/_layout.tsx:49` `getItem('setup_done')` / `apps/app/src/app/setup.tsx:82` `setItem('setup_done','1')`) to remember if user completed UsageStats + Accessibility wizard. Not for usage data. `android_app` will reuse same - keep flag, optionally cache `leaderboard_snapshots` last sync timestamp to avoid extra DB read, but main usage stays in `ScreenlyEnforcer`/memory, not AsyncStorage.

### 3.2 Privacy
- `friends {id, requesterId, addresseeId, status:'pending'|'accepted'|'blocked', createdAt}`.
- Invite via email -> `sendInvite {email}` -> lookup `user.email` -> if exists insert `pending`, if not create `friendInvites {code,email,inviterId, expires}` + email link `screenly://invite?code=`.
- `Accept` makes bidirectional share. `Block`/`remove` revokes. `getLeaderboard` returns only `{userId, name, image, totalMinutes, topApps}` for `accepted` friends + self, never full per-app list. No `shareLeaderboard` toggle needed since only friends scope.

### 3.3 HeroUI & Calendar
- `heroui-native` 1.0.9 has **no Calendar** (web has it, native doesn't).  
- Primary: `react-native-calendars` (Wix) - Expo compatible, theme to `bg-background/foreground`, supports month grid, `WeekCalendar` for 7d strip.  
- Fallback: Custom `BottomSheet` + `Button` grid using `heroui-native` `Button/Card/Typography` if theming fails.

---

## 4. File Changes Overview

### 4.1 `packages/db`
- `src/schema.ts` add:
  ```ts
  friends = screenly.table('friends', { id: text PK randomUUID, requesterId text FK user.id, addresseeId text FK user.id, status text enum('pending','accepted','blocked') default 'pending', createdAt timestamp defaultNow })
  leaderboardSnapshots = screenly.table('leaderboard_snapshots', { id text PK, userId text FK, date text notNull, totalMinutes int notNull, topApps jsonb, updatedAt timestamp })
  ```
- `drizzle.config.ts` unchanged, run `drizzle-kit generate` -> `drizzle/0003_*.sql` with indexes.

### 4.2 `packages/api`
- `src/router/usage.ts` add `getUsageByDate {date}` and `getUsageRange {startDate, endDate}` for local fallback (optional, but Screen Time will be local so maybe not needed).
- New `src/router/leaderboard.ts`:
  - `sendInvite` `POST /leaderboard/invite` `{email}` -> authed
  - `acceptInvite` `POST /leaderboard/accept` `{requestId}`
  - `declineInvite` `POST /leaderboard/decline` `{requestId}`
  - `listFriends` `GET /leaderboard/friends`
  - `listInvites` `GET /leaderboard/invites` (pending)
  - `syncSnapshot` `POST /leaderboard/sync` `{date, totalMinutes, topApps: [{packageName, appName, minutes}]}` -> upsert
  - `getLeaderboard` `GET /leaderboard` `{period: 'today'|'yesterday'|'7d'|'30d', date?: string}` -> compute start/end, `SELECT userId, SUM(totalMinutes) as score, topApps` grouped, `ORDER BY score ASC`
- `src/router/index.ts` export new procedures.

### 4.3 `apps/android_app`
- `package.json` add: `@screen/api`, `@screen/db`, `react-native-calendars`, `@react-native-async-storage/async-storage`, `expo-secure-store`, `better-auth`, `@better-auth/expo`, `@orpc/*`, `screenly-enforcer` native module.
- `app.json` copy `android.package com.screenly.app`, permissions `QUERY_ALL_PACKAGES, PACKAGE_USAGE_STATS, SYSTEM_ALERT_WINDOW`, `expo.modules.screenlyenforcer` from `apps/app/app.json:12`, re-add `expo-secure-store` plugin.
- `src/lib/` copy from `apps/app/src/lib`: `auth.ts`, `orpc.ts` (BASE_URL `EXPO_PUBLIC_API_URL`), `enforcer.ts` (`syncRules`, new `getScreenTimeData()`), `polyfill.ts`, `config.ts`.
- `src/modules/screenly-enforcer/` copy native `android/src/main/java/expo/modules/screenlyenforcer/*` + `src/ScreenlyEnforcerModule.ts`.
- `src/app/_layout.tsx` keep `HeroUINativeProvider`, add auth gating (copy `apps/app/src/app/_layout.tsx:92` session/setup checks), wrap with `QueryClientProvider`.
- `src/app/(tabs)/_layout.tsx` -> 3 tabs: `screen-time`, `limits`, `leaderboard` (no account tab) + **shared header** (`Hi` + `+ Add App`): banner above tabs with `Pressable` `Hi <Image avatar> {user.name || email}` -> `router.push('/account')` + `Button size="sm" + Add App -> router.push('/add-rule')`. Header rendered once in layout, visible on all tabs. Use `Ionicons` + `useThemeColor`.
  **Async perm check fix (your point):** `permsOk === null` -> render `View` loading ( `ActivityIndicator` + `bg-background` ), **never** `Redirect` to `/onboarding`/`/setup` while still `null`. Only after `Promise.all([hasUsageStatsPermission(), isAccessibilityServiceEnabled()])` resolves, decide `Redirect`. Also re-check on `AppState` foreground (user may grant in Settings and return). Snapshot sync `useEffect` also lives here (once per app open, after permsOk===true).
- `src/app/(tabs)/screen-time.tsx` (new):
  - No header (now in layout). Only Segment `Today | Yesterday | 7d | 30d` + `Button` calendar icon -> `BottomSheet` with `Calendar` (react-native-calendars themed).
  - `FlatList` `Card` rows `AppIcon | appName | minutes | progressBar` sorted desc via `getScreenTimeData(endDate, period)` (local).
  - Pull-to-refresh.
- `src/app/(tabs)/limits.tsx` (migrate `apps/app/src/app/(tabs)/index.tsx:480` + `add-rule.tsx` wizard):
  - Replace `StyleSheet/theme.ts` with `className="bg-background p-4 rounded-2xl"` + `heroui-native` `Card/Button/Typography/Progress`.
  - Keep `listRules`, `RuleBadge`, `unlock` flow.
- `src/app/(tabs)/leaderboard.tsx` (new):
  - Segment `Today | Yesterday | 7d | 30d` (maps to `getLeaderboard` period).
  - `FlatList` rank `1,2,3` `Card` `Avatar | name | total (e.g. 2h 15m) | Rank badge` + `HStack` top 3 app icons/names below each row.
  - Winner highlight `bg-success/10` + trophy.
  - Header `Button Invite` -> `Input email` -> `sendInvite`, pending invites list with `Accept/Decline`.
- `src/app/(tabs)/_layout.tsx` **leaderboard snapshot sync logic (your requirement)**:
  ```ts
  // Only once per app open, not on tab switch
  const hasSyncedRef = useRef(false)
  useEffect(() => {
    if (hasSyncedRef.current) return
    hasSyncedRef.current = true
    (async () => {
      const today = new Date().toISOString().split('T')[0]
      const data = await getScreenTimeData(today, 'today') // reuse Limits ScreenTime fn
      const totalMinutes = data.reduce((s,a)=>s+a.minutes,0)
      const topApps = data.slice(0,3).map(a=>({packageName:a.packageName, appName:a.appName, minutes:a.minutes}))
      // Check DB: getLeaderboard for today for self implicitly via syncSnapshot upsert
      await orpcClient.syncSnapshot({date: today, totalMinutes, topApps})
    })()
  }, [])
  ```
  Note: On mount of tabs layout, check if snapshot exists -> `syncSnapshot` does `INSERT ... ON CONFLICT (userId,date) DO UPDATE` so "if not exists create, else update" in one call. Not per-tab-switch, not per-minute.

- `src/app/account.tsx` (or `src/app/(stack)/account.tsx`) - moved account page, opened from greeting tap, shows `avatar`, `name`, `email`, `edit name`, `delete rules`, `sign out`.
- `src/global.css` keep, `metro.config.js` keep `withUniwindConfig`.
- `tailwind-merge` + `tailwind-variants` already present.

---

## 5. Implementation Steps (ordered, no `apps/app` touch)

**Step 1: DB Migration (0.5 day)**
1. Add `friends` + `leaderboardSnapshots` to `packages/db/src/schema.ts`
2. `drizzle-kit generate` -> `drizzle/0003_leaderboard.sql`
3. `drizzle-kit push` (local) / migration on `DATABASE_URL`
4. Add indexes.

**Step 2: API (1 day)**
1. Create `packages/api/src/router/leaderboard.ts` with 7 procedures above.
2. Extend `usage.ts` with `getUsageRange` (optional for 7d/30d cloud fallback, but client local is primary).
3. Export in `router/index.ts`, `router-types.ts`.
4. `tsc --noEmit` in `packages/api`.

**Step 3: android_app Scaffold (1 day)**
1. `npm install` deps + copy `src/lib/*`, `src/modules/screenly-enforcer`, `app.json` permissions.
2. Create `src/lib/getScreenTimeData.ts` reusable func: `ScreenlyEnforcer.getTodayUsage() + getAppIcons() -> sorted list`.
3. Update `src/app/_layout.tsx` auth gating + `QueryClient`.
4. Update `src/app/(tabs)/_layout.tsx` tabs + snapshot sync `useEffect` once.

**Step 4: Screen Time Tab (1.5 days)**
1. `npm install react-native-calendars` (or fallback).
2. Build `screen-time.tsx` with period + calendar + list.
3. Theme calendars to `heroui-native` `bg-background`.

**Step 5: Limits Tab (1 day)**
1. Migrate `limits.tsx` + `add-rule.tsx` wizard to HeroUI `className`.
2. Test `listRules` + `createRuleCheckout`.

**Step 6: Leaderboard Tab (1.5 days)**
1. Build `leaderboard.tsx` with period `Today/Yesterday/7d/30d` + invite UI + top3 per row.
2. Wire `orpcClient.getLeaderboard` + `syncSnapshot`.

**Step 7: Account Move (0.5 day)**
1. Move `account.tsx` from tabs to stack, header greeting `Hi` tap.

**Step 8: QA & Deploy (0.5 day)**
1. `expo start`, `tsc --noEmit`, `eslint`, test on Android device (UsageStats permission).
2. Vercel `android_app` root build, EAS build.

---

## 6. Risks & Mitigations

- **Usage permission denied** -> `requestUsageStatsPermission()` in `setup.tsx` flow (copy from `app`).
- **Calendar theming mismatch** -> fallback to custom HeroUI `BottomSheet` calendar.
- **Friend invite email not found** -> show `Invite link sent` state, store `friendInvites` for later signup.
- **Top 3 privacy** -> only `topApps` (name + minutes) shared, not full list. Friends-only, accepted.

---

## 7. Verification

- `npm run generate-routes --workspace=android_app` -> `routeTree.gen.ts` contains `/screen-time`, `/leaderboard`, `/limits`.
- `npx tsc --noEmit --project apps/android_app/tsconfig.json` passes.
- Manual: Open app -> tabs mount -> `leaderboard_snapshots` row for today appears in DB (`SELECT * FROM screenly.leaderboard_snapshots`). Switch tabs -> no extra write. Leaderboard shows friends ranked.
- `curl POST /api/rpc/getLeaderboard {period:"today"}` returns friends sorted.

---

## 8. Out of Scope (for now)

- Global leaderboard, groups, chat.
- iOS (only Android UsageStats).
- Push notifications for invite.

---

## 9. Questions for Build Start

1. Confirm `Today/Yesterday/7d/30d` periods mapped as above?
2. Top 3 display: show app icons + minutes or just names?
3. Invite via email only or also share link?

*Ready to build after confirmation - run with `Step 1 -> 8` sequentially.*

# AGENTS.md

Instructions for coding agents working in this repo.

## Styling: use Tailwind, never `StyleSheet.create`

This project uses **Uniwind** (Tailwind for React Native). Theme tokens live in
`apps/android_app/src/global.css` as `@theme` variables.

**When you edit any styling, write it as Tailwind `className`.** Do not add new
entries to a `StyleSheet.create` block, and do not add new `StyleSheet`
imports.

| Use | Not |
|---|---|
| `className="flex-row items-center px-6 py-4 rounded-xl border"` | `style={styles.row}` + a `StyleSheet.create` entry |
| `className="bg-surface border-border text-text-secondary"` | `style={{ backgroundColor: colors.surface }}` |

Rules:

1. **Adding or changing a style → Tailwind.** Even a one-line colour change.
2. **Touching a `StyleSheet` block → migrate what you touch** to `className`
   while you're there. Don't leave new work in the old pattern.
3. **Delete** the `StyleSheet` entry once nothing references it. Don't leave
   dead styles behind.
4. Prefer the theme tokens over raw hex. Available colour tokens include
   `background`, `surface`, `surface-alt`, `border`, `border-soft`, `text`,
   `text-secondary`, `text-muted`, `primary`, `primary-light`, `success`,
   `danger`.
5. `add-rule.tsx` and `block.tsx` are still largely `StyleSheet` from before
   Tailwind landed. Treat them as legacy: match the file's existing pattern
   only where you are not changing the style at all.

Radius, spacing, and font helpers (`colors`, `fonts`, `radius`, `spacing` from
`@/components/ui/theme`) exist for the legacy code. New styling should not
import them for inline use.

## Web app (`apps/web`)

Read `apps/web/AGENTS.md` before editing anything under `apps/web`. It carries
the TanStack `intent-skills` map, which must be loaded before editing routes or
server handlers.

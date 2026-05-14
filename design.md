# Screenly — Design Direction

## Brand
- **Name:** Screenly
- **Tagline:** Take back your time.

## Typography
- **Headings / Labels:** Poppins (600, 700)
- **Body / Secondary:** System sans-serif (SF Pro on iOS, Roboto on Android)
- **Sizes:** Display 28px · Title 20px · Body 16px · Caption 12px
- **Line height:** 1.5x

## Colors
| Token | Value | Usage |
|---|---|---|
| `--bg` | `#FFFFFF` | Screen background |
| `--surface` | `#F5F5F7` | Card / input background |
| `--border` | `#E5E5E5` | Borders, dividers |
| `--text` | `#0F0F0F` | Primary text |
| `--text-secondary` | `#6B6B6B` | Labels, captions |
| `--accent` | `#5C6EFF` | Primary buttons, active states, links |
| `--accent-soft` | `#EEF0FF` | Accent backgrounds, badges |
| `--danger` | `#FF4D4D` | Destructive actions, block screen |
| `--success` | `#22C55E` | Unlocked, active states |

## Layout
- **Spacing unit:** 8px base — use multiples (8, 16, 24, 32)
- **Border radius:** 12px cards · 8px buttons · 6px badges
- **Screen padding:** 20px horizontal
- **Card style:** White bg, `#E5E5E5` 1px border, 12px radius, 16px padding

## Components (Modular)
Each screen is a standalone file. Shared UI lives in `components/ui/`:
- `Button` — primary (accent fill) / secondary (surface) / ghost
- `Card` — surface bg, border, radius
- `AppRow` — app icon + name + rule badge + toggle
- `CountdownTimer` — large pulsing number, accent color
- `RuleBadge` — small pill showing rule type

## Screens Style
- **Onboarding:** Full-screen hero, large Poppins headline, single CTA button
- **Auth:** Centered card, clean inputs, no decorations
- **Dashboard:** Greeting at top, usage summary cards, active rules list
- **Block Screen:** Full-screen dark overlay (#0F0F0F bg), centered card, countdown in accent color, danger-colored "blocked" badge
- **Add Rule:** Step-by-step flow, large tap targets

## Motion
- Screen transitions: default Expo Router slide
- Countdown: subtle scale pulse every second (1.0 → 1.05 → 1.0)
- Button press: opacity 0.7 on press
- Cards: fade-in on mount (200ms)

## Anti-patterns to avoid
- No heavy gradients
- No purple/pink color schemes
- No emoji in UI (use phosphor icons)
- No centered text on list screens

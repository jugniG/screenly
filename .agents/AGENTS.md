# Frontend Design Rules

## Tech Stack
- Frontend uses **HeroUI** (`@heroui/react`) for components and styling.

## Component Organization
- **Common Custom Components**: Always place them in the global `components/` directory.
- **Page-Specific Components**: Create them directly inside the folder of the page they belong to.
- **Component Usage Hierarchy**:
  1. Always search for and use our custom local components first.
  2. If not available locally, fallback to importing the component from `@heroui/react`.
  3. If it's not available in `@heroui/react` either, create a new custom component.
  4. Avoid using raw HTML tags directly.

## Structure & File Limits
- Always use a highly modular structure.
- No single file should exceed **500 - 600 lines**. Split components and utilities into separate files when they grow beyond this limit.

## References
- Refer to [CLAUDE.md](file:///C:/s/screen/CLAUDE.md) for project commands, build instructions, and product overview.

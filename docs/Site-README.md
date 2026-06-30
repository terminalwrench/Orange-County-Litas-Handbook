# Reference Content Source

This folder contains legacy handbook and reference Markdown for the Orange County Litas Operations Center.

The deployed application is the React/Vite app in the repository root and `src/`. This `docs/` folder is retained as source/reference content only.

Key files:

- `index.md`
- handbook modules such as `00-Global-Litas`, `01-Chapter`, and `10-Events-Database`

## Purpose

These files preserve older handbook content that can be reused or migrated into React modules over time.

## GitHub Pages

GitHub Pages is deployed from the Vite build output in `dist/`.

```bash
pnpm install
pnpm build
```

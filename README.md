# Orange County Litas Operations Center

This repository now serves the Orange County Litas Operations Center: a Vite, React, and TypeScript app for chapter operations. The older handbook Markdown under `docs/` is retained as source/reference content, but the deployed GitHub Pages app is built from the React source in `src/`.

The app is written for current leaders, future leaders, volunteers, ride leads, sweeps, media contributors, photographers, and trusted helpers. It should make the chapter easier to run without making the chapter feel rigid.

## Run Locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

The deployable output is generated in `dist/`.

## Backend Setup

The app can run without Supabase. When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing, it uses the static fallback data in `src/data/`.

To enable Supabase reads:

1. Create a Supabase project.
2. Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor.
3. Copy [.env.example](.env.example) to `.env.local`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Install dependencies with `pnpm install`.
6. Start the dev server with `pnpm dev`.

Only use the Supabase anon public key in frontend environment files. Do not put a service role key in `.env.local` or any committed file.

Current Supabase-backed read tables:

- `events`
- `rides`
- `media_assets`
- `reference_links`
- `operation_items`

If Supabase is unconfigured or a read request fails, the app falls back to static data. If Supabase is configured and a table is empty, the app shows the appropriate empty state instead of mixing in mock records.

This milestone does not add authentication or public write controls. The schema includes comments for enabling Row Level Security when auth is added later.

## Reference Content

The `docs/` directory contains legacy handbook/reference material that may be reused by the React app. It is not the deployed site root.

## Maintenance Standard

When a chapter practice becomes repeatable, preserve it in the appropriate app data/source file or reference document. When a process changes, update the relevant module. When a file is only useful for one event, store it with that event record rather than turning it into permanent handbook guidance.

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

## Backend And Auth Setup

The production portal is protected by Supabase Auth. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required for founder login. Static fallback data remains in `src/data/` for service resilience during local development, but protected portal content is not shown without a signed-in Supabase session.

To enable the backend:

1. Create a Supabase project.
2. Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor.
3. Copy [.env.example](.env.example) to `.env.local`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Create founder/admin users manually in Supabase Dashboard → Authentication → Users.
6. Disable public signup in Supabase Auth settings unless the access model is intentionally changed later.
7. Install dependencies with `pnpm install`.
8. Start the dev server with `pnpm dev`.

For GitHub Pages deployments, add these repository secrets before running the Pages workflow:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Vite reads these values at build time, so the deployed app will use fallback data if the GitHub Actions build does not receive them.

Only use the Supabase anon public key in frontend environment files. Do not put a service role key in `.env.local` or any committed file.

Current Supabase-backed app tables:

- `events`
- `rides`
- `branch_assets`
- `reference_links`
- `operation_items`
- `members`

Row Level Security is enabled in [supabase/schema.sql](supabase/schema.sql). Unauthenticated visitors cannot read or write portal data. Authenticated founder/admin users can manage the current portal tables. If public signup is ever enabled, replace the simple authenticated policies with role or profile-based authorization first.

## Reference Content

The `docs/` directory contains legacy handbook/reference material that may be reused by the React app. It is not the deployed site root.

## Maintenance Standard

When a chapter practice becomes repeatable, preserve it in the appropriate app data/source file or reference document. When a process changes, update the relevant module. When a file is only useful for one event, store it with that event record rather than turning it into permanent handbook guidance.

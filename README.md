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

## Reference Content

The `docs/` directory contains legacy handbook/reference material that may be reused by the React app. It is not the deployed site root.

## Maintenance Standard

When a chapter practice becomes repeatable, preserve it in the appropriate app data/source file or reference document. When a process changes, update the relevant module. When a file is only useful for one event, store it with that event record rather than turning it into permanent handbook guidance.

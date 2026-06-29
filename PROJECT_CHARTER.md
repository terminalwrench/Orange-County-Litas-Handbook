# Orange County Litas Portal — Project Baseline

## Current Product

This project is the **Orange County Litas Portal**, a public GitHub Pages site backed by the `Orange-County-Litas-Handbook` repository.

The goal is to provide a simple, useful portal for Orange County Litas leadership, cofounders, volunteers, ride leads, sweeps, media contributors, photographers, and trusted helpers.

This is not just a GitHub repo. The website is the user-facing product.

## Frozen Decisions

- The repository structure is frozen unless J explicitly approves a change.
- Do not rename folders.
- Do not renumber modules.
- Do not add new top-level modules without approval.
- Do not move content unless explicitly requested.
- Do not redesign the architecture.
- Work inside the existing structure.

## Current Stack

- GitHub repository: `terminalwrench/Orange-County-Litas-Handbook`
- Public repo
- Site name: **Orange County Litas Portal**
- Site engine: **MkDocs Material**
- Deployment: **GitHub Actions**
- GitHub Pages should use: **Source = GitHub Actions**
- `mkdocs.yml` is the source for navigation.
- `docs/` is the MkDocs documentation directory.
- `docs/index.md` is the portal homepage.
- Custom styling lives in `docs/assets/stylesheets/extra.css`.

## Current Modules

- `00-Global-Litas`
- `01-Chapter`
- `02-Events`
- `03-Media`
- `04-Social`
- `05-Routes`
- `07-Photography`
- `08-Archive`
- `09-Leadership`
- `10-Events-Database`
- `11-Venues`
- `12-History`
- `13-Knowledge`
- `14-Operations`

## Removed / Do Not Recreate

- `06-Partnerships`
- Merch module
- SOP module

Do not suggest recreating these unless J explicitly asks.

## Design Direction

The portal should feel like:

- modern
- clean
- warm
- fast
- easy to navigate
- useful for non-GitHub users
- chapter-specific

Avoid:

- corporate tone
- bloated folder structures
- excessive placeholders
- full-screen blank sections
- overbuilt documentation vibes
- constant architecture redesign

Visual direction:

- modern motorcycle chapter portal
- warm minimal dashboard
- orange / cream / black / tan / neutral palette
- orange as an accent, not overwhelming
- strong cards
- clean typography
- real chapter photos can be added later

## Current Known Issues

- Deep third-level pages can feel messy.
- Some generated event and venue records have empty placeholder sections.
- Empty sections should be compact and intentional, not huge blank areas.
- MkDocs homepage/theme needs stabilization before heavy redesign.
- Links should be checked after every navigation or structure change.
- Git can show divergent branch warnings; prefer `git pull --rebase`.

## Git Rules

Before pushing:

```bash
git pull --rebase
git status
git add .
git commit -m "message"
git push

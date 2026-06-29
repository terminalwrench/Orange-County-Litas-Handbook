# MkDocs Site Source

This folder contains the MkDocs website source for the Orange County Litas Portal.

The handbook Markdown files remain in their original repository folders. MkDocs reads them through lightweight links in this folder so the website can render the handbook without moving the source content.

Key files:

- `index.md`
- `assets/stylesheets/extra.css`
- linked handbook modules such as `00-Global-Litas`, `01-Chapter`, and `10-Events-Database`

No React or frontend build tools are required.

## Purpose

The portal gives cofounders and chapter leaders a friendly way to browse the handbook without needing to understand the GitHub repository structure first.

## GitHub Pages

To preview locally, install the Python requirements from the repository root and run:

```bash
pip install -r requirements.txt
mkdocs serve
```

To publish with GitHub Pages, build and deploy the MkDocs site from `mkdocs.yml`. The generated site output goes to `site/`; the source handbook content stays where it is.

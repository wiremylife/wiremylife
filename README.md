# WireMyLife v1

Static directory of AI connectors (MCP servers) for the car and home, with live status badges.

- `data/connectors.json`: the database (39 Home + Car listings). Edit by hand or via `scripts/seed.py` (one-time seed only; re-running it **overwrites** statuses).
- `scripts/check.mjs`: Level 0 checks. Hosted endpoints get an MCP `initialize` POST; self-hosted ones get GitHub repo health (180 days without a commit = Stale); docs URLs get a resolve check. Writes `status`, `status_detail`, `last_checked`, `response_ms`, `github` and `url_checks`. Set `GITHUB_TOKEN` to avoid the 60/hr limit.
- Level 2 ("Tested working"): set `tested: {"passed": true, "date": "YYYY-MM-DD"}` on a listing after a read-only real-account test. It expires after 8 days.
- `npm run check` → `npm run build` → `npx @11ty/eleventy --serve` (or `cd _site && python3 -m http.server 8080`).
- `scripts/screenshot.mjs`: full-page screenshots via playwright-core + system Chrome.
- `.github/workflows/check-and-deploy.yml`: every 6 hours, on push to `main`, and on `workflow_dispatch`: check → commit data → build → `wrangler pages deploy` to the Cloudflare Pages project `wiremylife`. Deploy needs secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; the deploy step is skipped (the job still succeeds) when the token is not set.

Placeholders to wire later: Kit form (`src/newsletter.njk`, `KIT_FORM_PLACEHOLDER`), contact email (`src/_data/site.js`), My stack copy (`src/my-stack.njk`).

# WireMyLife v1

Static directory of AI connectors (MCP servers) for the car and home, with live status badges.

- `data/connectors.json`: the database (39 Home + Car listings). Edit by hand or via `scripts/seed.py` (one-time seed only; re-running it **overwrites** statuses).
- `scripts/check.mjs`: Level 0 checks. Hosted endpoints get an MCP `initialize` POST; self-hosted ones get GitHub repo health (180 days without a commit = Stale); docs URLs get a resolve check. Writes `status`, `status_detail`, `last_checked`, `response_ms`, `github` and `url_checks`. Set `GITHUB_TOKEN` to avoid the 60/hr limit.
- Level 2 ("Tested working"): set `tested: {"passed": true, "date": "YYYY-MM-DD"}` on a listing after a read-only real-account test. It expires after 8 days.
- Paid placement on a listing: `featured: true` and an optional `featuredUntil` (`YYYY-MM-DD`, inclusive, Pacific Time). After that date the Featured badge and pin come off. The checker leaves these fields alone.
- Affiliate link on a listing: `affiliateUrl` (the older `affiliate_url` key still works). Those links render with `rel="sponsored nofollow"`.
- `npm run check` → `npm run build` → `npx @11ty/eleventy --serve` (or `cd _site && python3 -m http.server 8080`).
- `scripts/screenshot.mjs`: full-page screenshots via playwright-core + system Chrome.
- `.github/workflows/check-and-deploy.yml`: every 6 hours, on push to `main`, and on `workflow_dispatch`: check → commit data → build → `wrangler pages deploy` to the Cloudflare Pages project `wiremylife`. Deploy needs secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; the deploy step is skipped (the job still succeeds) when the token is not set.

Config lives in `data/site.json`:

- `kitFormAction`: Kit form id or full form action URL. `10070476` posts to `https://app.kit.com/forms/10070476/subscriptions` with the field `email_address`. No Kit script. After submit, the page shows “Check your email to confirm.”
- `paymentLinks.featuredListing`, `paymentLinks.newsletterSponsor`, `paymentLinks.categorySponsor`: checkout URLs for the $49/mo, $99/issue, and $149/mo Buy buttons. An empty value uses `mailto:hello@wiremylife.com` with a prefilled subject.
- `categorySponsors.car` and `categorySponsors.home`: optional `{ "name", "url", "until" }` for a sold category sponsor. Leave `name` empty while the slot is unsold.

Still a placeholder: My stack copy (`src/my-stack.njk`).

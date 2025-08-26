Release v1.1.0 — Link Creator (Bulk)
====================================

Release date: 2025-08-25

Highlights
----------
- Unified Link Creator: combined URL shortener and bulk link creator into a single UI.
- Campaign management: create/select campaigns, names auto-formatted as `[Campaign] - [Date]`.
- URL format toggle: Long URL (custom slugs) vs Short URL (server-generated).
- CSV export now includes the actual generated short URLs and uses a timestamped filename.
- Improved error handling for authentication and API responses.
- Prevent duplicate short link creation by making each request unique (URL-level uniqueness for Short URL mode).

Files changed
-------------
- `app/page.tsx` — main UI and bulk creation logic
- `app/api/shortener/route.ts` — shortener wrapper
- `middleware.ts` — API auth responses improved
- `README-CHANGELOG.md` — session changelog summary

Notes
-----
- This is a minor version bump (1.0.0 -> 1.1.0) because the release introduces multiple features and bug fixes while remaining backwards-compatible.
- Verify end-to-end with a staging JJA instance to confirm link uniqueness across publications.

Upgrade
-------
No special upgrade steps. Install and run as usual in the `bulk-links-vercel` folder:

```bash
cd "Bulk Links on Vercel"
npm install
npm run dev
```

Tag
---
Git tag: `v1.1.0`

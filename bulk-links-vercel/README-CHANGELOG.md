Bulk Links — Changelog
======================

This document summarizes the feature work, bug fixes, and ongoing debugging performed in this workspace during the current development session (based on the repository changes and the conversation history).

High-level summary
------------------
- Combined URL shortener and bulk link creator into a single "Link Creator" UI.
- Added campaign management (create/select campaigns, auto-format campaign name with date).
- Implemented Long URL (custom slug) vs Short URL (server-generated) toggle.
- Fixed CSV export to include the actual generated short URL and added a unique timestamped filename.
- Improved error handling and authentication behavior for API calls.
- Debugged and iterated on duplicate-short-link creation; implemented multiple strategies to avoid API duplicate detection.

Changes (grouped by area)
-------------------------
1) UI / UX
  - Unified tool: removed separate shortener view and combined into `app/page.tsx` Link Creator.
  - Toggle button for URL format (Long vs Short). Long URL defaults to using campaign+publication+date as slug.
  - Results table updated to show `shortUrl` and descriptive errors.
  - "Create Links" clears previous results on submit and regenerates results/CSV after each run.

2) Campaigns
  - New campaign creation now uses the format: `[Campaign] - [Date]`.
  - On creation, the code checks existing campaigns for a name match and alerts if found, then uses the existing campaign.
  - Campaign APIs are reloaded after creation to keep UI in sync.

3) Shortening API wrapper (`app/api/shortener/route.ts`)
  - Use `data.shorturl` (JJA API) as the canonical `shortUrl` when available; fallbacks preserved.
  - Return consistent JSON: `{ ok, shortUrl, id, data }` on success; `{ ok:false, message, error }` on error.

4) Duplicate-detection / unique link creation
  - Short URL mode (server-generated slugs) originally triggered JJA duplicate detection because URL+campaign matched.
  - Approaches tried and implemented:
    - Add unique random/timestamp suffix to `name` to alter metadata.
    - Add tiny delay (100ms) between bulk requests to vary timestamps.
    - Avoided forcing `metatitle` (reverted to API-generated meta) per user request.
    - Final approach implemented: append small unique query parameters to the original URL (`_pub` and `_uid`) so the JJA service sees distinct URLs for each publication.
  - These changes make each request distinct at the URL level, preventing server-side duplicate suppression.

5) CSV export & filename
  - CSV now uses `r.shortUrl` for the Short URL column.
  - CSV filename includes campaign, date and a detailed timestamp (YYYYMMDD-HHMMSS) to avoid overwrites.

6) Authentication & error handling
  - Middleware was adjusted so API routes return JSON 401/403 errors for missing/expired sessions instead of redirecting to login (prevents HTML login pages being returned to the frontend JSON parser).
  - Frontend checks for 401/403 and redirects/alerts the user to re-login.
  - Handling added for unexpected HTML responses (parsing errors) to surface session-expired messages.

Files changed (high level)
-------------------------
- `app/page.tsx` — main Link Creator UI (bulk creation logic, CSV export, results table, campaign logic)
- `app/api/shortener/route.ts` — API wrapper to JJA service (shortUrl extraction)
- `middleware.ts` — changed to return JSON on API auth failures
- Other small updates: CSV filename, error messages, logs

How to test (quick)
-------------------
1. Start dev server in the `bulk-links-vercel` folder and log in via the app's auth flow (if used):

   # from workspace root
   cd "Bulk Links on Vercel"
   npm install
   npm run dev

2. Create a campaign name (enter name) and select Short URL mode. Pick multiple publications.
3. Submit the form and confirm results table shows distinct short URLs for each publication.
4. Click Export CSV and verify the file contains the `Short URL` column with the real generated URLs and that filename contains a timestamp.
5. Try creating the same campaign name (same date) again — you should see an alert that it already exists and the existing campaign will be used.
6. Expire the session (logout) and attempt an API action — the UI should show an auth-expired alert rather than failing to parse HTML.

Known issues & notes
--------------------
- There are TypeScript/JSX lint errors reported in the working file due to missing JSX typings in this environment; these are not functional blockers but should be cleaned up (import React types or adjust tsconfig) if desired.
- The JJA API may have additional duplicate-detection heuristics; the URL-parameter approach is the most robust way to make requests unique, but verify with real API behavior in staging.

Next recommended steps
----------------------
- Run a few full end-to-end tests against a staging JJA instance to confirm uniqueness under load.
- Tidy TypeScript types and fix JSX typing errors.
- Add unit tests for the bulk-creation loop (mock the shortener API) to assert unique requests are sent per publication.

Requirements coverage (from user requests)
-----------------------------------------
- Combine shortener + bulk creator into a single tool: Done (in `app/page.tsx`).
- CSV uses the actual generated short URLs: Done.
- CSV filename has date-time stamp: Done.
- Results refresh on resubmission: Done (clears previous results at submit).
- Show descriptive error messages: Done (returns API message/error when available).
- Avoid duplicate creation in Short URL mode: Implemented URL-parameter strategy + small delay.
- Do not force `metatitle` uniqueness: Reverted per user request.
- Campaign name should be `[Campaign] - [Date]` and check for duplicates: Done with alert and fallback to existing campaign.

---

### 1.2.0 — Reporting Interface (2025-08-25)

- Added a Reporting UI at `/reports` that preloads all links and campaigns in the background and performs client-side filtering and searching.
- Report table is sortable and includes Description, Short URL, Original URL, Campaign, Clicks, and Created At.
- CSV export now mirrors the current filtered/sorted view and contains a summary section.
- Filters: campaign dropdown, search bar, min-clicks, and date range. Reports only render when the user clicks "Run Report" to avoid rendering a huge table on load.
- Background load failures show a retry option; empty-filter results show "No links match your filters." and CSV exports headers + zeroed summary.


If you want this document in a different filename (e.g., `CHANGELOG.md`) or want a shorter/longer format, tell me which folder and I will add it there.

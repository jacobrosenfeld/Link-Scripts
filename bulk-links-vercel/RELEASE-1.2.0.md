# Release 1.2.0 — Reporting & Performance Improvements

Released: 2025-08-25

Highlights
----------
- New: Reporting interface with client-side filtering and CSV export that reflects the current view.
- New: Background preloading of all links and campaigns for instant, client-side reporting.
- New: Campaign + text search + quick column filters (date range, minimum clicks).
- New: Sortable & scrollable report table with Description, Short URL, Original URL, Campaign, Clicks, and Created At columns.
- New: Summary section showing total clicks and clicks-by-URL for the current filtered view.
- Improved: CSV export now includes summary stats and uses filename format: `report-[campaignOrSearch]-[YYYY-MM-DD].csv`.
- UX: Filters are preserved until reset, and reports only render when the user clicks Run Report.
- Reliability: Background data loading with retry option and graceful empty-state messaging.

Developer notes
---------------
- Added `app/reports/page.tsx` for the reporting UI and `app/api/reports/route.ts` for server-side aggregation and campaign mapping.
- The JJA API (`https://link.josephjacobs.org/api`) is used to fetch links and campaigns; set `JJA_API_KEY` in environment for server requests.
- Client-side filtering operates on a preloaded in-memory dataset to avoid repeated API calls and keep the UI snappy.

Testing checklist
-----------------
- Start dev server and confirm the "Link Reports" page loads without errors.
- Verify background data loads; if it fails, a retry button should appear.
- Apply a campaign filter + search query, click Run Report, and confirm results update instantly.
- Export CSV and verify filename, rows, and summary content.

Known issues
------------
- TypeScript JSX typing warnings may appear in the local environment if dev dependencies are missing; install `@types/react` and `@types/node` to resolve.

Changelog
---------
- See `README-CHANGELOG.md` for a more detailed changelog and testing notes.

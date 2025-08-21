# Bulk Link Creator (Next.js on Vercel)


Create bulk short links with pattern: `adtracking.link/[Campaign]-[Date]-[Pub]`.


## One-time setup
1. **Create Vercel project** → “From Git Repository”.
2. **Add Integration**: *Vercel KV* (Upstash). This auto-populates `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. **Project Env Vars** (Production & Preview):
- `JJA_API_KEY` – your JJA Link API key
- `JJA_BASE` – `https://link.josephjacobs.org/api`
- `DEFAULT_DOMAIN` – `adtracking.link`
- `ADMIN_TOKEN` – long random string (for admin panel updates)
4. **Deploy**.


## Use
- **Admin panel**: `/admin`
- Paste `ADMIN_TOKEN`, edit pubs (one per line), click **Save Pubs**.
- **Public form**: `/`
- Paste **Long URL**, type **Campaign** and **Date**, select pubs via checkboxes, click **Create Links**.


## Security
- The public form doesn’t expose secrets; all JJA calls run in API route on the server.
- Admin writes require `x-admin-token: ADMIN_TOKEN` header (entered client-side in the Admin page).
- Optionally front-door protect `/admin` and `/` with **Vercel Password Protection** or **Cloudflare Access** for internal-only access.


## Enhancements (optional)
- Collision auto-suffixing: on conflict, retry `-1`, `-2`, ...
- CSV export endpoint: `/api/export?campaign=...&date=...` returning a CSV of the last run.
- History log: push each result to KV list keyed by timestamp/campaign.
- Per-pub prefixes: store `{ name, prefix }` objects instead of strings and compose `prefix + pub` slugs.
# Bulk## One-time setup
1. **Create Ve## Security
- **Login Protection**: The entire app is now protected with username/password authentication
- JWT-based sessions with 24-hour expiration
- The public form doesn't expose secrets; all JJA calls run in API route on the server.
- Admin writes require `x-admin-token: ADMIN_TOKEN` header (entered client-side in the Admin page).
- Additional protection: **Vercel Password Protection** or **Cloudflare Access** can be added for extra security layers. project** → "From Git Repository".
2. **Add Integration**: *Vercel KV* (Upstash). This auto-populates `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. **Project Env Vars** (Production & Preview):
- `JJA_API_KEY` – your JJA Link API key
- `JJA_BASE` – `https://link.josephjacobs.org/api`
- `DEFAULT_DOMAIN` – `adtracking.link`
- `ADMIN_TOKEN` – long random string (for admin panel updates)
- `AUTH_SECRET` – very long random string (for JWT signing)
- `LOGIN_USERNAME` – your login username
- `LOGIN_PASSWORD` – your secure login password
4. **Deploy**.ator (Next.js on Vercel)


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
- **Login**: Go to your deployed URL, you'll be redirected to `/login`
- Enter your `LOGIN_USERNAME` and `LOGIN_PASSWORD` to access the app
- **Admin panel**: `/admin`
- Paste `ADMIN_TOKEN`, edit pubs (one per line), click **Save Pubs**.
- **Public form**: `/`
- Paste **Long URL**, type **Campaign** and **Date**, select pubs via checkboxes, click **Create Links**.
- **Logout**: Click the "Logout" button in the top-right corner


## Security
- The public form doesn’t expose secrets; all JJA calls run in API route on the server.
- Admin writes require `x-admin-token: ADMIN_TOKEN` header (entered client-side in the Admin page).
- Optionally front-door protect `/admin` and `/` with **Vercel Password Protection** or **Cloudflare Access** for internal-only access.


## Enhancements (optional)
- Collision auto-suffixing: on conflict, retry `-1`, `-2`, ...
- CSV export endpoint: `/api/export?campaign=...&date=...` returning a CSV of the last run.
- History log: push each result to KV list keyed by timestamp/campaign.
- Per-pub prefixes: store `{ name, prefix }` objects instead of strings and compose `prefix + pub` slugs.
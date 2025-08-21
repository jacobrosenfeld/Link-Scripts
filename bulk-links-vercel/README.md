# Bulk Link Creator (Next.js on Vercel)

Create bulk short links with pattern: `adtracking.link/[Campaign]-[Date]-[Pub]`.

## Security
- **Login Protection**: The entire app is protected with username/password authentication
- JWT-based sessions with 24-hour expiration
- The public form doesn't expose secrets; all JJA calls run in API route on the server
- Additional protection: **Vercel Password Protection** or **Cloudflare Access** can be added for extra security layers

## One-time setup
1. **Create Vercel project** → "From Git Repository"
2. **Add Storage**: Create a *Vercel Blob Store* from your dashboard. This auto-populates `BLOB_READ_WRITE_TOKEN`
3. **Project Environment Variables** (Production & Preview):
   - `JJA_API_KEY` – your JJA Link API key
   - `JJA_BASE` – `https://link.josephjacobs.org/api`
   - `DEFAULT_DOMAIN` – `adtracking.link`
   - `AUTH_SECRET` – very long random string (for JWT signing)
   - `LOGIN_USERNAME` – your login username
   - `LOGIN_PASSWORD` – your secure login password
   - `BLOB_READ_WRITE_TOKEN` – (set automatically when you create Blob Store)
4. **Deploy**

## Usage

### Admin: Configure Publishers
1. Go to `/admin`
2. Add publishers line-by-line (e.g., `Facebook`, `Google`, `Twitter`)
3. Save

### Create Bulk Links
1. Enter the long URL (landing page)
2. Enter campaign name and date
3. Select publishers from the list
4. Click "Create Links" 
5. Copy the generated tracking links

Each link follows the pattern: `adtracking.link/[Campaign]-[Date]-[Pub]`

Example: `adtracking.link/SpringSale-2025-08-21-Facebook`

## Technical Features
- **Storage**: Uses Vercel Blob (free tier) instead of KV
- **Authentication**: JWT-based login system
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom dark theme
- **Deployment**: Optimized for Vercel

## Company Branding
- Professional Joseph Jacobs Advertising (JJA) branding
- Logo integration throughout the application
- "Made with ❤️ in Teaneck, NJ" footer
- Consistent company colors and styling

## Future Ideas
- History log: push each result to Blob storage keyed by timestamp/campaign
- CSV export of all generated links
- Link analytics integration
- Bulk editing of publishers
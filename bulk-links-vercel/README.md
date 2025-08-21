# Bulk Link Creator (Next.js on Vercel)

Create bulk short links with pattern: `[domain]/[Campaign]-[Date]-[Pub]` using your branded domains.

## ✨ Key Features
- **🔐 Secure Login System**: JWT-based authentication with 24-hour sessions
- **🌐 Dynamic Domain Selection**: Automatically fetches your branded domains from the JJA API
- **🎨 Professional Theming**: Light/Dark/Auto mode with adaptive JJA branding
- **📊 CSV Export**: Export generated links to spreadsheet format
- **⚡ Real-time Results**: Live status updates for each generated link
- **🔧 Admin Panel**: Easy publisher management with live preview
- **📱 Responsive Design**: Works seamlessly on desktop and mobile

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
1. Navigate to Admin Panel (button in top-right header)
2. Add publishers line-by-line (e.g., `Facebook`, `Google`, `Twitter`)
3. Save changes
4. Live preview shows how publishers will appear as checkboxes

### Create Bulk Links
1. **Enter Details**:
   - Long URL (landing page destination)
   - Campaign name and date
   - Select domain from your branded domains dropdown
2. **Select Publishers**: Choose from configured publisher checkboxes
3. **Generate**: Click "Create Links" to bulk generate
4. **Export**: Use "📊 Export CSV" to download results spreadsheet
5. **Copy Links**: Click individual short URLs to visit or copy

### Theme Selection
- Use the floating theme selector (bottom-right) to choose:
  - 🌓 **Auto**: Follows your system preference
  - ☀️ **Light**: Light mode
  - 🌙 **Dark**: Dark mode

Each link follows the pattern: `[your-domain]/[Campaign]-[Date]-[Pub]`

Example: `adtracking.link/SpringSale-2025-08-21-Facebook`

## Technical Features
- **🗄️ Storage**: Uses Vercel Blob (free tier) for publisher data persistence
- **🔐 Authentication**: JWT-based login system with middleware protection
- **🌐 Dynamic Domains**: Fetches branded domains from JJA API automatically
- **🎨 Theme System**: Complete light/dark mode with CSS custom properties
- **📊 CSV Export**: Client-side CSV generation and download
- **⚛️ Framework**: Next.js 14 with App Router and TypeScript
- **💅 Styling**: Tailwind CSS with adaptive theming
- **☁️ Deployment**: Optimized for Vercel with zero-config deployment
- **📱 Responsive**: Mobile-first design with adaptive layouts

## UI/UX Features
- **🎯 Smart Navigation**: Context-aware Admin Panel ↔ Home button
- **⚡ Loading States**: Real-time feedback for all async operations
- **🔄 Adaptive Branding**: Logo switches based on theme (dark/light variants)
- **📋 Results Table**: Comprehensive status display with clickable links
- **🎛️ Form Validation**: Required fields and proper input handling
- **♿ Accessibility**: Proper focus states, tooltips, and semantic HTML

## Company Branding
- Professional Joseph Jacobs Advertising (JJA) branding
- Adaptive logo system (dark logo for light mode, white logo for dark mode)
- Theme-aware favicon system
- "Made with ❤️ in Teaneck, NJ" footer
- Consistent company colors and styling throughout

## API Integration
The app integrates with the JJA Link API for:
- **Domain Management**: `GET /api/domains` - Fetches branded domains list
- **Link Creation**: `POST /api/url/add` - Creates individual short links
- **Authentication**: Bearer token authentication with retry logic

## Recent Updates
- ✅ **CSV Export**: Export generated links to spreadsheet format
- ✅ **Dynamic Domains**: Replaced static domain with API-driven dropdown
- ✅ **Theme System**: Complete light/dark mode implementation
- ✅ **UI Improvements**: Enhanced navigation, loading states, and responsiveness
- ✅ **Admin UX**: Live preview and better publisher management

## Development Notes
- TypeScript errors in development are expected due to JSX configuration
- All functionality works correctly in production builds
- Environment variables are required for full functionality
- Blob storage handles publisher data with automatic cleanup of old versions
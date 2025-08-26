# Bulk Link Creator (Next.js on Vercel)

Version: 1.2.0 — Released 2025-08-25

This release combines the URL shortener and bulk link creator into a single Link Creator UI and includes campaign management, CSV export fixes, and improvements to prevent duplicate short-link creation.

Create bulk short links with flexible URL patterns using branded domains. Supports both `[Campaign]-[Pub]-[Date]` and `[Campaign]-[Date]` formats.

## 1.2.0 — Reporting Interface (NEW)

- Background preloading of all links and campaigns for instant client-side filtering and searching.
- New reporting page (`/reports`) with sortable table and summary statistics.
- Support for campaign filter, free-text search, date range, and minimum click filters.
- CSV export reflects the current filtered/sorted view and includes summary stats.


## UI/UX Features
- **🎯 Smart Navigation**: Context-aware Admin Panel ↔ Home button
- **⚡ Loading States**: Real-time feedback for all async operations
- **🔄 Adaptive Branding**: Logo switches based on theme (dark/light variants)
- **📋 Results Table**: Comprehensive status display with clickable links
- **🔤 Auto-Sorting**: Publishers automatically alphabetized on save
- **♿ Accessibility**: Proper focus states, tooltips, and semantic HTML
- **🔍 Form Validation**: 
  - Real-time URL validation with visual feedback (red borders, warning icons)
  - Required field validation for campaign name
  - Smart date defaults to prevent empty submissions
- **⚠️ User Confirmations**: Clear prompts when creating links without publications
- **📊 Enhanced CSV Export**: Clean column structure with logical data organization
- **🎛️ Dynamic Previews**: Live URL pattern updates based on publisher selection
- **🚀 Workflow Efficiency**: 
  - One-click "New Campaign" button to instantly reset form
  - Smart field clearing with preserved defaults
  - Seamless campaign-to-campaign workflow
- **📱 Responsive Publisher Grid**:
  - Column-first layout for easy alphabetical scanning
  - Adaptive breakpoints: 4 columns → 2 columns → 1 column
  - Touch-friendly checkboxes on mobile devicesranded domains. Supports both `[Campaign]-[Pub]-[Date]` and `[Campaign]-[Date]` formats.

## ✨ Key Features
- **🔐 Secure Login System**: JWT-based authentication with 24-hour sessions
- **🌐 Dynamic Domain Selection**: Automatically fetches your branded domains from the JJA API
- **🎨 Professional Theming**: Light/Dark/Auto mode with adaptive JJA branding
- **📊 CSV Export**: Export generated links to spreadsheet format with clean column structure
- **⚡ Real-time Results**: Live status updates for each generated link
- **🔧 Admin Panel**: Easy publisher management with live preview
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🔗 Flexible URL Patterns**: Support for both with-publication and without-publication URL structures
- **📅 Smart Date Defaults**: Automatically defaults to today's date in MM-DD-YY format
- **🔍 URL Validation**: Real-time validation with visual feedback for proper URL formatting
- **⚠️ Smart Confirmations**: User confirmation when creating links without publications
- **🚀 Quick Campaign Reset**: One-click "New Campaign" button to start fresh
- **📝 Case Preservation**: Maintains original text capitalization in URLs
- **📋 Column-First Layout**: Publications organized in easy-to-scan vertical columns

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
3. Save changes - **publishers are automatically sorted alphabetically**
4. Live preview shows how publishers will appear as checkboxes
5. Navigation: Use "Home" button to return to main link creator

### Create Bulk Links
1. **Enter Details**:
   - Long URL (landing page destination) - **validates in real-time for proper format**
   - Campaign name (required) - **case preserved in final URLs**
   - Date - **auto-defaults to today's date in MM-DD-YY format**
   - Select domain from your branded domains dropdown
2. **Select Publishers**: 
   - Choose from configured publisher checkboxes (optional)
   - **Column-first layout** with responsive breakpoints (4→2→1 columns)
   - **Dynamic preview** shows URL pattern based on selection
   - If no publishers selected, you'll be asked to confirm creating links without publication
3. **Generate**: Click "Create Links" to bulk generate
4. **Review Results**: View status table with success/error indicators
5. **Export or Continue**: 
   - Use "📊 Export CSV" to download results spreadsheet
   - Use "🚀 New Campaign" to instantly clear form and start fresh
6. **Copy Links**: Click individual short URLs to visit or copy

### Workflow Efficiency
- **Smart Date Management**: Date automatically defaults to today in MM-DD-YY format
- **One-Click Reset**: "New Campaign" button clears all fields and resets to fresh state
- **Case Preservation**: Campaign names like "SpringSale" and publishers like "Facebook" maintain capitalization
- **Responsive Publisher Grid**: Publications arranged in easy-to-scan columns that adapt to screen size

### URL Pattern Flexibility
The app supports two URL patterns based on your publisher selection:

**With Publications Selected:**
- Pattern: `[your-domain]/[Campaign]-[Publication]-[Date]`
- Example: `adtracking.link/SpringSale-Facebook-08-21-25`

**No Publications Selected:**
- Pattern: `[your-domain]/[Campaign]-[Date]`
- Example: `adtracking.link/SpringSale-08-21-25`
- User confirmation required before generating

### Theme Selection
- Use the floating theme selector (bottom-right) to choose:
  - 🌓 **Auto**: Follows your system preference
  - ☀️ **Light**: Light mode
  - 🌙 **Dark**: Dark mode

Each link follows the pattern: `[your-domain]/[Campaign]-[Pub]-[Date]` or `[your-domain]/[Campaign]-[Date]`

Examples: 
- With publication: `adtracking.link/SpringSale-Facebook-08-21-25`
- Without publication: `adtracking.link/SpringSale-08-21-25`

*Note: Case is preserved from your input - "SpringSale" stays "SpringSale", not "springsale"*

## Technical Features
- **🗄️ Storage**: Uses Vercel Blob (free tier) for publisher data persistence
- **🔐 Authentication**: JWT-based login system with middleware protection
- **🌐 Dynamic Domains**: Fetches branded domains from JJA API automatically
- **🎨 Theme System**: Complete light/dark mode with CSS custom properties
- **📊 CSV Export**: Client-side CSV generation with optimized column structure
- **⚛️ Framework**: Next.js 14 with App Router and TypeScript
- **💅 Styling**: Tailwind CSS with adaptive theming
- **☁️ Deployment**: Optimized for Vercel with zero-config deployment
- **📱 Responsive**: Mobile-first design with adaptive layouts
- **🔍 Validation**: Real-time URL validation with visual feedback
- **📅 Smart Defaults**: Automatic date formatting and population
- **🔤 Case Preservation**: Maintains original text capitalization in slug generation
- **📋 Column Layout**: CSS Grid with responsive breakpoints for publisher selection

## UI/UX Features
- **🎯 Smart Navigation**: Context-aware Admin Panel ↔ Home button
- **⚡ Loading States**: Real-time feedback for all async operations
- **🔄 Adaptive Branding**: Logo switches based on theme (dark/light variants)
- **📋 Results Table**: Comprehensive status display with clickable links
- **🎛️ Form Validation**: Required fields and proper input handling
- **🔤 Auto-Sorting**: Publishers automatically alphabetized on save
- **♿ Accessibility**: Proper focus states, tooltips, and semantic HTML

## Company Branding
- Professional Joseph Jacobs Advertising (JJA) branding
- Adaptive logo system (dark logo for light mode, white logo for dark mode)
- Theme-aware favicon system
- "Made with ❤️ in Teaneck, NJ" footer
- Consistent company colors and styling throughout

## CSV Export Format
The CSV export includes the following columns in order:
1. **Publication** - Publisher name (or "No Publication" if none selected)
2. **Campaign** - Campaign name from form
3. **Date** - Date from form (MM-DD-YY format)
4. **Short URL** - Complete shortened URL (e.g., `adtracking.link/campaign-pub-date`)
5. **Status** - Success/Error indicator
6. **Original URL** - The long URL that was shortened
7. **Error** - Error message if link creation failed (empty for successful links)

The CSV file is automatically named with the pattern: `bulk-links-[campaign]-[date]-[YYYYMMDD-HHMMSS].csv` (timestamp added for uniqueness).

## Release notes (v1.1.0)

See `RELEASE-1.1.0.md` for full release notes. Highlights:
- Unified Link Creator UI (shortener + bulk creator)
- Campaign creation now formats names as `[Campaign] - [Date]` and checks for duplicates
- CSV export uses the actual generated short URLs and a timestamped filename
- Short URL mode: requests are made unique to avoid server-side duplicate suppression
- Improved API auth handling and clearer error messages

## API Integration
The app integrates with the JJA Link API for:
- **Domain Management**: `GET /api/domains` - Fetches branded domains list
- **Link Creation**: `POST /api/url/add` - Creates individual short links
- **Authentication**: Bearer token authentication with retry logic

## Recent Updates
- ✅ **New Campaign Workflow**: One-click button to reset form and start fresh campaign
- ✅ **Case Preservation**: URLs now maintain original text capitalization (SpringSale → SpringSale)
- ✅ **Responsive Publisher Grid**: Column-first layout with 4→2→1 responsive breakpoints
- ✅ **Enhanced User Experience**: Improved workflow efficiency and form management
- ✅ **Flexible URL Patterns**: Support for both with/without publication URL structures
- ✅ **Smart Date Defaults**: Auto-populates today's date in MM-DD-YY format
- ✅ **Enhanced URL Validation**: Real-time validation with visual feedback
- ✅ **User Confirmations**: Prompts when creating links without publications
- ✅ **Improved CSV Export**: Clean column structure with logical data organization
- ✅ **Dynamic URL Previews**: Live pattern updates based on publisher selection
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
# GitHub Copilot Instructions for Link-Scripts

## Repository Overview

This repository contains tools for interacting with the JJA Link Shortener API (built on Gem Pixel Premium URL Shortener):

1. **Google Apps Script** (`Get-All-Links-and-Clicks.js`) - Fetches link data and displays it in Google Sheets
2. **Bulk Links Vercel App** (`bulk-links-vercel/`) - A Next.js application for creating, managing, and analyzing short links

## Technology Stack

### Bulk Links Vercel Application
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode enabled)
- **UI Library**: React 18
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Authentication**: JWT-based sessions using `jose` library
- **Storage**: Vercel Blob Storage for data persistence
- **API Integration**: JJA Link Shortener API
- **Deployment**: Vercel

### Google Apps Script
- **Language**: JavaScript (ES5-compatible)
- **Platform**: Google Apps Script
- **Integration**: Google Sheets API

## Development Commands

### Bulk Links Vercel App
```bash
cd bulk-links-vercel
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Code Style & Conventions

### TypeScript/React (bulk-links-vercel)

1. **File Organization**
   - Use TypeScript for all new files (`.ts`, `.tsx`)
   - Place API routes in `app/api/`
   - Place reusable components in `components/`
   - Place utility functions and API clients in `lib/`
   - Use Next.js App Router conventions (no Pages Router)

2. **Component Style**
   - Use functional components with hooks
   - Use `"use client"` directive for client components that use hooks or browser APIs
   - Server components by default (no directive needed)
   - Export named components (e.g., `export function Header()`)
   - Define TypeScript interfaces for component props
   - Use descriptive prop type names (e.g., `HeaderProps`, `ButtonProps`)

3. **TypeScript Conventions**
   - Enable strict mode (`strict: true` in tsconfig.json)
   - Define interfaces for all API responses and data structures
   - Use type annotations for function parameters and return types
   - Use path aliases: `@/*` maps to the root directory

4. **Styling**
   - Use Tailwind CSS utility classes for styling
   - Use CSS custom properties (CSS variables) for theming: `var(--text)`, `var(--background)`, `var(--border)`, etc.
   - Responsive design: mobile-first approach
   - Dark mode support via theme provider

5. **API Routes**
   - Use Next.js 14 App Router API routes (`route.ts` files)
   - Return `NextResponse.json()` for responses
   - Handle errors with appropriate HTTP status codes
   - Include try-catch blocks for error handling
   - Use environment variables for API keys and secrets
   - Validate request data before processing

6. **Authentication & Security**
   - Use JWT tokens with `jose` library for session management
   - Store session tokens in httpOnly, secure cookies
   - Protect routes using middleware (`middleware.ts`)
   - Never expose API keys or secrets in client code
   - Use environment variables for sensitive data (see `.env.example`)

7. **API Integration (JJA Link Shortener)**
   - Use the `lib/jja.ts` module for API interactions
   - Base URL: `process.env.JJA_BASE` (default: `https://link.josephjacobs.org/api`)
   - Use Bearer token authentication: `Authorization: Bearer ${JJA_API_KEY}`
   - Handle rate limiting with retry logic (429 status codes)
   - Implement exponential backoff for retries
   - Check for `error: 0` or `error: "0"` in API responses to confirm success

8. **Data Fetching**
   - Use `fetch` with `cache: "no-store"` for API calls that need fresh data
   - Implement timeout protection for long-running requests (10-second limits)
   - Use pagination for large datasets (10-500 items per page)
   - Optimize API request limits (e.g., 50 links per batch for performance)

9. **Naming Conventions**
   - Use PascalCase for component files and component names
   - Use camelCase for functions, variables, and file names (non-components)
   - Use UPPER_SNAKE_CASE for environment variables
   - Use descriptive names that reflect purpose

10. **Error Handling**
    - Always wrap API calls in try-catch blocks
    - Provide user-friendly error messages
    - Log errors to console for debugging
    - Implement graceful fallbacks for failed operations
    - Show loading states during async operations

### Google Apps Script

1. **Variable Declarations**
   - Use `var` for variable declarations (ES5 compatibility)
   - Use UPPER_SNAKE_CASE for constants (e.g., `SHEET_NAME`, `API_URL`)

2. **API Integration**
   - Use `UrlFetchApp.fetch()` for HTTP requests
   - Set Bearer token in Authorization header
   - Check for `error == 0` in API responses

3. **Google Sheets Integration**
   - Use `SpreadsheetApp.getActiveSpreadsheet()` to access sheets
   - Clear and update sheets with `sheet.clear()` and `sheet.appendRow()`
   - Use `onOpen()` trigger to create custom menu items

4. **Comments**
   - Include clear comments explaining API configuration requirements
   - Document expected data structures and API responses

## Environment Variables

The bulk-links-vercel app requires these environment variables (see `bulk-links-vercel/.env.example`):

```bash
JJA_API_KEY=YOUR_JJA_API_KEY
JJA_BASE=https://link.josephjacobs.org/api
DEFAULT_DOMAIN=adtracking.link

# Authentication
AUTH_SECRET=your-very-long-random-secret-key-for-jwt-signing
LOGIN_USERNAME=your-username
LOGIN_PASSWORD=your-secure-password

# Vercel Blob Storage (Free)
BLOB_READ_WRITE_TOKEN= # Get this from Vercel Dashboard > Storage > Create Blob Store
```

## Testing & Quality

1. **Before Committing**
   - Run `npm run lint` to check for code style issues
   - Run `npm run build` to ensure the app builds successfully
   - Test in development mode with `npm run dev`
   - Verify authentication flows work correctly
   - Test API integrations with actual endpoints

2. **Manual Testing**
   - Test link creation with various inputs
   - Verify reports load and filter correctly
   - Test authentication (login/logout)
   - Check responsive design on different screen sizes
   - Verify dark/light mode switching

## Common Tasks

### Adding a New API Route
1. Create a `route.ts` file in `app/api/[route-name]/`
2. Export `GET`, `POST`, `PUT`, or `DELETE` async functions
3. Use `NextResponse.json()` for responses
4. Add authentication check if needed (protected routes)
5. Handle errors with try-catch and appropriate status codes

### Adding a New Component
1. Create a `.tsx` file in `components/`
2. Use PascalCase for the file name
3. Export a named function component
4. Define TypeScript interface for props
5. Add `"use client"` if using hooks or browser APIs
6. Use Tailwind CSS for styling

### Adding a New Page
1. Create a `page.tsx` file in the appropriate `app/` subdirectory
2. Use Next.js 14 App Router conventions
3. Server components by default (add `"use client"` only if needed)
4. Use the `Header` component for consistent navigation
5. Implement `ProtectedLayout` for authenticated pages

## Important Notes

1. **Minimal Changes**: Make the smallest possible changes to accomplish the task
2. **No Breaking Changes**: Preserve existing functionality unless explicitly required
3. **Security First**: Never commit secrets or API keys
4. **User Experience**: Maintain responsive design and loading states
5. **TypeScript Strict Mode**: All code must pass strict type checking
6. **API Rate Limits**: Respect JJA API rate limits and implement proper retry logic
7. **Session Management**: Sessions expire after 24 hours
8. **Vercel Deployment**: The app is designed for Vercel platform

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [JJA Link Shortener API](https://link.josephjacobs.org/api)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)

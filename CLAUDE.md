# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chrome MV3 extension that intercepts navigation to configured "distraction sites" and prompts users to do a 1-minute workout. Built with SvelteKit and uses a dual-build system due to Chrome extension architecture constraints.

## Build System & Commands

### Development
```bash
npm run devext
```
Runs nodemon that watches `src/` and `static/` directories, automatically rebuilding on changes. After changes, reload the extension in Chrome at `chrome://extensions/` to see updates.

### Production Build
```bash
npm run build
```
Runs **two** separate Vite builds:
1. SvelteKit build (main config) → compiles Svelte routes to static HTML pages
2. Background script build (`vite.background.config.js`) → compiles `src/background.js` to `build/background.js`

### Chrome Web Store Release
```bash
cd ./build
zip -r ../extension.zip .
```
Upload to Chrome Web Store developer console (URL in [README.md](README.md:46))

## Architecture

### Dual Build System

This project uses **two separate Vite configurations** to handle Chrome extension requirements:

1. **Main Build** (`vite.config.js` + `svelte.config.js`):
   - Uses `sveltekit-adapter-chrome-extension` adapter
   - Compiles SvelteKit routes to static HTML pages in `build/`:
     - `src/routes/settings/+page.svelte` → `build/settings.html`
     - `src/routes/preworkout/+page.svelte` → `build/preworkout.html`

2. **Background Script Build** (`vite.background.config.js`):
   - Separate config that compiles `src/background.js` → `build/background.js`
   - Required because background.js needs access to Vite env variables (`VITE_API_BASE_URL`)
   - Sets `emptyOutDir: false` to preserve SvelteKit build output

**Why this complexity?** Background scripts in Chrome extensions run in a service worker context and need environment variables. The standard static folder approach doesn't allow Vite to process env variables, so background.js lives in `src/` and gets its own build step.

### Chrome Extension Flow

#### Interception & Redirection
1. User navigates to a URL
2. `chrome.webNavigation.onBeforeNavigate` fires in [src/background.js:13](src/background.js#L13)
3. Checks cooldown status via `isInCooldown()` ([src/background.js:41-50](src/background.js#L41-L50))
4. Loads trigger sites from `chrome.storage.sync`
5. If URL matches a trigger site → redirects to `preworkout.html?original=<encoded_url>`

#### Preworkout Page
[src/routes/preworkout/+page.svelte](src/routes/preworkout/+page.svelte):
- Reads `original` URL from query params
- Stores it in `chrome.storage.local` as `originalUrl`
- Presents two options:
  - **Start Workout**: Links to external workout page at `${VITE_API_BASE_URL}/workouts/roulette?source=extension&intercepted=true`
  - **Skip**: Sends `{ action: 'startCooldown' }` message to background script, then redirects to original URL

#### Cooldown System
[src/background.js:3-50](src/background.js#L3-L50):
- **Duration**: 15 minutes (configurable via `COOLDOWN_PERIOD`)
- **State**: Stored in both in-memory (`cooldownUntil` timestamp) and `chrome.storage.local` (survives service worker restarts)
- **Triggers**: Both "Skip" and workout completion start cooldown
- **Fast path optimization**: Checks in-memory value first, falls back to storage if service worker restarted

#### Return from Workout
[src/background.js:73-95](src/background.js#L73-L95):
- External workout page redirects to `${VITE_API_BASE_URL}/back_to_extension`
- `onBeforeNavigate` detects this URL pattern
- Retrieves `originalUrl` from `chrome.storage.local`
- Starts cooldown
- Redirects user back to their original destination
- Cleans up stored URL

### Storage Architecture

Two separate Chrome storage APIs are used:

- **`chrome.storage.sync`**: User's trigger sites list (syncs across devices)
  - Read/written in [src/routes/settings/+page.svelte](src/routes/settings/+page.svelte)
  - Read in [src/background.js:59](src/background.js#L59) for URL checking

- **`chrome.storage.local`**: Temporary session data (local only)
  - `originalUrl`: The intercepted URL to return to
  - `cooldownUntil`: Timestamp when cooldown expires (persists across service worker restarts)

### Environment Variables

`VITE_API_BASE_URL` is used in:
- [src/routes/preworkout/+page.svelte](src/routes/preworkout/+page.svelte) - builds workout URL
- [src/background.js:6](src/background.js#L6) - detects return callback URL

Configure via `.env` files during development/build.

## Key Files

- [src/background.js](src/background.js) - Service worker: navigation interception, cooldown logic, URL routing
- [src/routes/settings/+page.svelte](src/routes/settings/+page.svelte) - Extension settings page (manage trigger sites)
- [src/routes/preworkout/+page.svelte](src/routes/preworkout/+page.svelte) - Interstitial page with Start/Skip options
- [static/manifest.json](static/manifest.json) - Chrome extension manifest (MV3)
- [vite.background.config.js](vite.background.config.js) - Separate build config for background.js

## Common Modifications

**Change cooldown duration**: Edit `COOLDOWN_PERIOD` in [src/background.js:4](src/background.js#L4)

**Modify URL matching logic**: Update `checkUrl()` in [src/background.js:53-71](src/background.js#L53-L71)

**Change workout source**: Update workout URL in [src/routes/preworkout/+page.svelte](src/routes/preworkout/+page.svelte)

**Settings UI/storage model**: Modify [src/routes/settings/+page.svelte](src/routes/settings/+page.svelte)

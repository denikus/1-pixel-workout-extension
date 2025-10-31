# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run devext
```

`npm run devext` - Runs nodemon that watches your source files and rebuilds on changes
 Then you just need to go to your extension in chrome and click reload (so it'll take fresh code from `~/vhosts/1-minute-workout-extension/build`)


## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Issue with background.js compilation

I needed to pass env variable to background.js script (basic url for my sass, which on development is just localhost:3000).
But as background.js was in static folder, nether npm nor vite didn't compile it, so it couldn't access .env variables.

So, temp solution is to move background.js to /src folder run additional command t build this file. Also, there is additional config file for vite: vite.background.config.js.

It's a bit smelly code, but works for now.

Other solutions: crxjs plugin for vite, but it doesn't work with sveltekit.
Overall, AI suggested to remove sveltekit and use just svelte and crxjs with plain vite and svelte, it will simplify everything. 
But I'm not sure for now. Probably later will do.

## General user flow of extension (non-tech explanation)

- **Open settings**: Click the extension icon in your browser toolbar. This opens the settings page where you can manage your list of distraction sites.
- **Add distraction sites**: Enter sites (one per line) where you'd like a gentle reminder (e.g., social media or news sites), then click Save. These are stored locally in your browser only.
- **Browsing interception**: When you navigate to any saved site, the extension briefly intercepts the page and shows a 1‑minute workout suggestion screen.
  - **Start Workout**: Opens a quick workout in a new page. When it finishes and sends you back, you’ll automatically return to the page you were trying to visit.
  - **Skip**: Instantly returns you to the page you were trying to visit.
- **Cooldown**: After starting a workout or skipping, the extension pauses reminders for 15 minutes so you can browse uninterrupted.
- **Update anytime**: Reopen the settings from the toolbar to adjust your distraction list.

Notes:
- Your distraction sites never leave your device; they’re saved in browser storage only.
- You can always reload the extension from `build/` during development (see Developing above).

## General user flow of extension (tech explanation)
 
- **Entry points & build outputs**
  - Manifest: `static/manifest.json` (MV3). Declares `storage`, `webNavigation`, and background `service_worker: background.js`.
  - Background worker: `src/background.js` → built to `build/background.js` via `vite.background.config.js`.
  - Pages: SvelteKit routes compile to HTML in `build/`:
    - `src/routes/settings/+page.svelte` → `build/settings.html`
    - `src/routes/preworkout/+page.svelte` → `build/preworkout.html`

- **Open settings from toolbar**
  - File: `src/background.js`
  - Logic: `chrome.action.onClicked` → `chrome.tabs.create({ url: '/settings.html' })`

- **Manage distraction sites (read/write)**
  - File: `src/routes/settings/+page.svelte`
  - Read: `onMount` → `chrome.storage.sync.get(['triggerSites'])`
  - Write: `saveData()` → `chrome.storage.sync.set({ triggerSites: string[] })`
  - Storage scope: `chrome.storage.sync` (syncs per browser profile)

- **Interception on navigation**
  - File: `src/background.js`
  - Event: `chrome.webNavigation.onBeforeNavigate` (main frame only)
  - Cooldown gate: `isInCooldown()` prevents interception during cooldown window
  - URL check: `checkUrl(url, tabId)`
    - Loads `triggerSites` from `chrome.storage.sync`
    - Compares `new URL(url).hostname` against any `site` using `includes`
    - On match: builds `preworkout.html?original=<encoded>` and `chrome.tabs.update` to redirect

- **Pre‑workout page behavior**
  - File: `src/routes/preworkout/+page.svelte`
  - On mount: reads `original` from query string, saves to `chrome.storage.local.set({ originalUrl })`
  - Start Workout: `href` points to `${import.meta.env.VITE_API_BASE_URL}/workouts/roulette?source=extension&intercepted=true`
  - Skip: sends `chrome.runtime.sendMessage({ action: 'startCooldown' })`, then `window.location.href = originalUrl`

- **Cooldown implementation (15 minutes)**
  - File: `src/background.js`
  - Constants/state: `COOLDOWN_PERIOD = 15 * 60 * 1000`, `cooldownUntil`
  - API:
    - `startCooldown()` sets `cooldownUntil = Date.now() + COOLDOWN_PERIOD`
    - `isInCooldown()` returns `Date.now() < cooldownUntil`
  - Triggers:
    - Message listener: `chrome.runtime.onMessage` with `{ action: 'startCooldown' }`
    - Post‑workout return handler below also starts cooldown

- **Return from workout to original page**
  - File: `src/background.js`
  - Env: `API_BASE_URL = import.meta.env.VITE_API_BASE_URL`
  - Detect callback: within `onBeforeNavigate`, if `details.url === `${API_BASE_URL}/back_to_extension`` → `handleBackToExtension(tabId)`
  - Handler: reads `originalUrl` from `chrome.storage.local`, calls `startCooldown()`, redirects tab back via `chrome.tabs.update`, then removes `originalUrl`

- **Environment configuration**
  - `VITE_API_BASE_URL` consumed in:
    - `src/routes/preworkout/+page.svelte` (build workout URL)
    - `src/background.js` (match `/back_to_extension` callback)
  - Configure via Vite/SvelteKit env (e.g., `.env` during dev/build)

- **Where to modify behavior quickly**
  - Cooldown duration: edit `COOLDOWN_PERIOD` in `src/background.js`
  - Matching logic: adjust hostname matching in `checkUrl()` in `src/background.js`
  - Storage model/UI: update `src/routes/settings/+page.svelte`
  - Preworkout UX and actions: update `src/routes/preworkout/+page.svelte`
# 1 Pixel Workout — Chrome Extension

A Chrome extension that turns your distraction sites into workout reminders. Instead of mindlessly scrolling Twitter, Reddit, or Instagram, you get a quick workout prompt first — a short exercise to fix your posture and reset your focus. No gym, no sweat, done between meetings. Workouts are served by [1 Pixel Workout](https://1pixelworkout.com) — a library of quick desk-friendly exercises. Free to use, with a Pro tier for unlimited workouts.

Built for desk workers, remote employees, and anyone who spends too much time sitting at a computer.

## How It Works

You add your guilty-pleasure sites — social media, news, YouTube, whatever pulls you in when you have free time. Then, each time you visit one of those sites, the extension intercepts the page and suggests a quick workout instead.

It's a site blocker, but instead of blocking you outright, it nudges you to move your body first.

- **Start a workout** — opens a short exercise (takes about a minute), then returns you to the page you were trying to visit. Reminders pause for 30 minutes.
- **Skip** — go straight to the site, no judgment. Reminders pause for 15 minutes.

Your list of distraction sites stays on your device. Nothing is sent to any server. See for yourself.

## Who Is This For

- **Desk workers** who sit 8+ hours a day and forget to move
- **Remote workers** looking for a simple way to break up long screen sessions
- **Anyone trying to build a movement habit** without committing to a gym routine
- **People interested in exercise snacks** — short bursts of activity spread throughout the day

## Features

- Customizable list of distraction sites (add or remove anytime)
- Quick workout suggestions powered by [1 Pixel Workout](https://1pixelworkout.com)
- Smart cooldown (30 min after workout, 15 min after skip) so the extension doesn't get annoying
- Works with any Chromium-based browser (Chrome, Edge, Brave, Arc)
- No account required for basic use. Get more workouts with a free account. Unlimited workouts with Pro subscription.
- Privacy-first: your site list is stored locally in your browser, never transmitted

## Install

Available on the [Chrome Web Store](https://chromewebstore.google.com/detail/1-pixel-workout/ahocnpijhgajachomdcapboenkjdodmb).

## Contributing

The extension relies on the [1pixelworkout.com](https://1pixelworkout.com) backend to serve workouts and handle the post-workout return flow. You can run the extension locally for UI and interception logic development — workout links will point to the production server by default.

To set up a local dev environment:

1. Clone this repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` (defaults to production API)
4. Build the extension: `npm run build`
5. Open `chrome://extensions/` in your browser
6. Enable "Developer mode"
7. Click "Load unpacked" and select the `build/` folder

## Tech Stack

- [Svelte](https://svelte.dev/) + [SvelteKit](https://kit.svelte.dev/) (static adapter for extension pages)
- [Vite](https://vitejs.dev/) for builds
- Chrome Extension Manifest V3
- `chrome.storage.sync` for settings, `chrome.webNavigation` for interception

### Development

After cloning and installing dependencies:

```bash
npm run devext
```

This runs nodemon watching your source files. After changes, reload the extension in `chrome://extensions/` to pick up the new build.

### Building for production

```bash
npm run build
```

### Packaging for Chrome Web Store

```bash
cd ./build
zip -r ../extension.zip .
```

Upload the zip via the [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/).

### Environment variables

Set `VITE_API_BASE_URL` in your `.env` file. This controls:
- The workout URL shown on the pre-workout page
- The callback URL for returning to the original page after a workout

### Architecture notes

The extension has three main pieces:

- **Background service worker** (`src/background.js`) — handles navigation interception, cooldown logic, and the post-workout return flow
- **Settings page** (`src/routes/settings/+page.svelte`) — UI for managing your distraction site list
- **Pre-workout page** (`src/routes/preworkout/+page.svelte`) — the interception screen with Start Workout and Skip options

Background script is built separately via `vite.background.config.js` since SvelteKit doesn't compile service workers directly.

## Related

- [1 Pixel Workout](https://1pixelworkout.com) — the web app with the full workout library
- Built as part of a [building-in-public](https://1pixelworkout.com/blog) project

## License

The MIT License

Copyright (c) 2025-2026 Denys

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
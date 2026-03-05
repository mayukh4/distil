# Distil

<img width="1600" height="900" alt="distil" src="https://github.com/user-attachments/assets/7b1999ed-6c0d-4489-8355-71493891eccb" />

A minimalist Chrome extension that replaces your new tab with a productivity dashboard. No frameworks, no build tools — pure vanilla JS/HTML/CSS.

## Features

- **Time & Greeting** — personalized greeting with your name, live clock, date
- **Weather** — current conditions via OpenWeatherMap (bring your own API key)
- **Research Papers** — latest arXiv papers from categories you pick
- **Google News** — RSS feed from selectable topics
- **Hacker News** — top stories with scores and comment counts
- **Quick Links** — up to 8 favicon bookmarks, drag to reorder
- **Notes** — persistent notepad with download-as-txt
- **Pomodoro Timer** — 25/5 focus sessions with progress ring and notifications
- **NASA APOD** — optional Astronomy Picture of the Day as background
- **Zen Mode** — press `Z` to hide everything except time

All settings are configurable via the extension popup (click the Distil icon in your toolbar).

## Install (Developer Mode)

1. Clone or download this repo
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `distil` folder
5. Open a new tab — Distil replaces the default page

## Setup

Click the **Distil icon** in your Chrome toolbar (pin it first via the puzzle piece menu) to open settings:

1. **Profile** — enter your name for a personalized greeting
2. **Quick Links** — add up to 8 bookmark shortcuts
3. **arXiv Categories** — pick which research fields to follow
4. **News Topics** — select Google News topics
5. **Weather** — paste your [OpenWeatherMap API key](https://openweathermap.org/appid) (free tier), enter a city, pick C/F
6. **Background** — toggle NASA APOD background on/off

All changes take effect instantly on the new tab page — no reload needed.

## Getting a Weather API Key

Weather requires a free OpenWeatherMap API key:

1. Sign up at [openweathermap.org](https://openweathermap.org/appid)
2. Go to your API keys page and copy your key
3. Paste it in Distil settings under Weather

The free tier allows 1,000 calls/day which is more than enough for personal use.

## Architecture

```
manifest.json        Extension config (Manifest V3)
newtab.html          New tab page entry point
script.js            All frontend logic
styles.css           Glassmorphism design system
background.js        Service worker — API fetches (arXiv, News, HN, APOD)
constants.js         Shared constants (categories, topics, defaults)
popup.html           Settings popup entry point
popup.js             Settings logic (CRUD, save/load)
popup.css            Settings styles
icon.png             Extension icon
m87.jpg              Default background image
```

**Key patterns:**
- All cross-origin API calls go through the background service worker via `chrome.runtime.sendMessage`
- Settings are saved to `chrome.storage.local` and the new tab reacts via `chrome.storage.onChanged` — no reload needed
- Data is cached with time-based and version-based invalidation
- Pomodoro uses `Date.now()`-based timing to avoid drift when the tab is backgrounded

## Development

After making code changes:
1. Go to `chrome://extensions/`
2. Click the reload icon on the Distil extension card
3. Open a new tab to see changes

Debug the new tab: right-click the page > Inspect.
Debug the service worker: click "Service Worker" on `chrome://extensions/`.
Debug the popup: right-click the extension icon > Inspect Popup.

## License

GPL-3.0 — see [LICENSE](LICENSE).

You're free to view, fork, and modify the code. The author retains the right to distribute commercial versions (e.g., on the Chrome Web Store).

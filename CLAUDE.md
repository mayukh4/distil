# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Distil** — a commercial Chrome extension (Manifest V3) that replaces the new tab page with a minimalist productivity dashboard. Features time/date, weather (OpenWeatherMap), persistent notes, arXiv research papers feed (user-selectable categories), Google News RSS (user-selectable topics), Hacker News top stories, Focus/Zen mode, Pomodoro timer, and optional NASA APOD background.

## Development

No build system, package manager, or framework — pure vanilla JS/HTML/CSS. To develop:

1. Open `chrome://extensions/`, enable Developer mode
2. "Load unpacked" → select this folder
3. After code changes, click the reload icon on the extension card, then open a new tab

Debug the new tab page via right-click → Inspect. Debug the background service worker via the "Service Worker" link on `chrome://extensions/`. Debug the settings popup via right-click on extension icon → Inspect Popup.

## Architecture

**Message-passing pattern:** The newtab page (`script.js`) cannot make cross-origin API calls directly. All external fetches (arXiv, Google News, Hacker News, APOD) go through the background service worker (`background.js`) via `chrome.runtime.sendMessage` / `onMessage`. The actions are: `fetchPapers` (with `categories` param), `fetchGoogleNews` (with `topics` param), `fetchHackerNews`, `fetchApod`, `forceRefreshApod`.

**Settings flow:** Settings popup (`popup.js`) writes to `chrome.storage.local`. The newtab page (`script.js`) listens via `chrome.storage.onChanged` to react to setting changes without requiring a page reload.

**Shared constants:** `constants.js` is loaded by both `popup.html` and `newtab.html`. Contains `ARXIV_CATEGORIES`, `GOOGLE_NEWS_TOPICS`, and `DEFAULT_SETTINGS`.

**Caching:** All data is cached in `chrome.storage.local` with version-based invalidation. Cache version `NEWS_CACHE_VERSION` must be bumped when changing cache structure. APOD cache uses `APOD_CACHE_VERSION` (must match between `background.js` and `script.js`).

**Pomodoro timer:** Uses `Date.now()`-based timing (not setInterval decrement) to avoid drift when tab is backgrounded. State persisted to `chrome.storage.local` so timer survives across new tab opens. Background service worker uses `chrome.alarms` for notifications.

**APOD fetch pipeline** (`background.js`): NASA API with retries → fallback to yesterday's APOD (for video days) → fallback to website scraping. A 2-hour alarm (`apodPeriodicCheck`) keeps the cache fresh.

**Key files:**
- `manifest.json` — Extension config, permissions, host permissions for APIs, popup action
- `constants.js` — Shared constants: arXiv categories, news topics, default settings
- `newtab.html` — Entry point, loads `styles.css` + `constants.js` + `script.js`
- `script.js` — All frontend logic: time, weather, notes, feeds (Papers/News/HN), APOD, Zen mode, Pomodoro timer, settings change listener
- `background.js` — Service worker: arXiv XML parsing, Google News RSS parsing, HN API, APOD with retry/fallback, Pomodoro alarm notifications
- `styles.css` — Glassmorphism design system using CSS custom properties
- `popup.html` / `popup.js` / `popup.css` — Settings popup: arXiv category selector, news topics, weather config, APOD toggle

**UI state persistence:** Notes expanded/collapsed, news panel collapsed, APOD enabled, active tab, zen mode, city, temp unit, and Pomodoro state are all stored in `chrome.storage.local`.

## Storage Schema

```
Settings (written by popup, read by newtab):
  arxivCategories: string[]        // e.g., ['cs.AI', 'cs.LG']
  newsTopics: string[]             // e.g., ['TECHNOLOGY', 'SCIENCE']
  tempUnit: 'C' | 'F'
  city: string
  apodEnabled: boolean
  zenMode: boolean
  firstRun: boolean
  activeTab: string                // 'papers' | 'news' | 'hn'

UI state (written/read by newtab):
  notesExpanded: boolean
  newsCollapsed: boolean
  notes: string

Caches:
  news_papers / news_papers_time
  news_news / news_news_time
  news_hn / news_hn_time
  news_version: number
  apod_data / apod_date / apod_cache_version

Pomodoro:
  pomodoroEndTime: number (timestamp)
  pomodoroIsBreak: boolean
  pomodoroRunning: boolean
  pomodoroRemaining: number
```

## Conventions

- Font: JetBrains Mono (loaded from Google Fonts)
- Default background: `m87.jpg`; APOD overrides via CSS variable `--bg-image`
- Accent color: `#ff4d00`, break mode green: `#22c55e`
- No external JS libraries or frameworks
- arXiv XML and Google News RSS are parsed with regex in the service worker (no DOMParser available)
- All API calls from newtab go through background.js message passing
- Settings changes are reactive via chrome.storage.onChanged listener

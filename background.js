// Background Service Worker - handles API fetches to bypass CORS
// NOTE: Service workers don't have DOM APIs, so we use regex for XML parsing

// DEFAULT_SETTINGS — must match constants.js (service worker can't import scripts)
const DEFAULT_SETTINGS = {
    arxivCategories: ['cs.AI', 'cs.LG', 'cs.CL'],
    newsTopics: ['TECHNOLOGY', 'SCIENCE'],
    tempUnit: 'C',
    city: '',
    userName: '',
    weatherApiKey: '',
    quickLinks: [],
    apodEnabled: false,
    zenMode: false,
    firstRun: true,
    activeTab: 'papers'
};

const ARXIV_API = 'https://export.arxiv.org/api/query';

// NASA APOD Configuration
const NASA_API_KEY = 'wxo1oIGfOwD8dTAYb7FmJGnLSdzTFiQ5Qe8wmegA';
const NASA_API_URL = 'https://api.nasa.gov/planetary/apod';
const APOD_WEBSITE = 'https://apod.nasa.gov/apod/astropix.html';
// Cache version - increment this to force cache clear on extension update
const APOD_CACHE_VERSION = 5;
// Retry configuration
const APOD_MAX_RETRIES = 3;
const APOD_RETRY_DELAYS = [2000, 5000, 10000]; // ms

// Listen for messages from newtab page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[BG] Message received:', request.action);

    const handleResponse = (promise) => {
        promise
            .then(data => sendResponse({ success: true, data }))
            .catch(error => {
                console.error(`[BG] Error for ${request.action}:`, error);
                sendResponse({ success: false, error: error.message || 'Unknown error' });
            });
        return true; // Keep channel open
    };

    if (request.action === 'fetchPapers') {
        return handleResponse(fetchArxivPapers(request.categories));
    }

    if (request.action === 'fetchGoogleNews') {
        return handleResponse(fetchGoogleNews(request.topics));
    }

    if (request.action === 'fetchHackerNews') {
        return handleResponse(fetchHackerNews());
    }

    if (request.action === 'fetchApod') {
        return handleResponse(fetchApodWithFallback());
    }

    if (request.action === 'forceRefreshApod') {
        console.log('[BG] Force refresh APOD requested');
        return handleResponse(forceRefreshApod());
    }

    return false; // Not handled
});

// ============================================================================
// ARXIV
// ============================================================================

async function fetchArxivPapers(categories) {
    // Default categories if none provided
    if (!categories || categories.length === 0) {
        categories = ['cs.AI', 'cs.LG', 'cs.CL'];
    }

    const query = categories.map(cat => `cat:${cat}`).join(' OR ');
    const url = `${ARXIV_API}?search_query=${encodeURIComponent(query)}&start=0&max_results=15&sortBy=submittedDate&sortOrder=descending`;

    console.log('[BG] Fetching arXiv:', url);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    console.log('[BG] arXiv response length:', text.length);

    const entries = parseArxivEntries(text);
    console.log('[BG] Parsed entries:', entries.length);

    if (entries.length === 0) {
        throw new Error('No entries found in arXiv response');
    }

    return entries;
}

function parseArxivEntries(xml) {
    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null && entries.length < 15) {
        const entry = match[1];

        const title = extractTag(entry, 'title')?.replace(/\s+/g, ' ').trim() || 'No Title';
        const id = extractTag(entry, 'id') || '#';
        const link = extractAttribute(entry, 'link', 'href', 'alternate') || id;
        const published = extractTag(entry, 'published');
        const category = extractAttribute(entry, 'arxiv:primary_category', 'term') ||
            extractAttribute(entry, 'category', 'term') || '';

        const authorRegex = /<author>\s*<name>([^<]+)<\/name>/g;
        const authors = [];
        let authorMatch;
        while ((authorMatch = authorRegex.exec(entry)) !== null && authors.length < 2) {
            authors.push(authorMatch[1].trim());
        }
        const totalAuthors = (entry.match(/<author>/g) || []).length;

        entries.push({
            title: title,
            link: link,
            date: published ? new Date(published).toLocaleDateString() : '',
            author: authors.join(', ') + (totalAuthors > 2 ? ' et al.' : ''),
            category: category // Return raw category code; frontend maps to display name
        });
    }

    return entries;
}

function extractTag(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
}

function extractAttribute(xml, tagName, attrName, filterAttr = null) {
    let regex;
    if (filterAttr) {
        regex = new RegExp(`<${tagName}[^>]*rel=["']${filterAttr}["'][^>]*${attrName}=["']([^"']+)["']`, 'i');
        const match = xml.match(regex);
        if (match) return match[1];
        regex = new RegExp(`<${tagName}[^>]*${attrName}=["']([^"']+)["'][^>]*rel=["']${filterAttr}["']`, 'i');
    } else {
        regex = new RegExp(`<${tagName}[^>]*${attrName}=["']([^"']+)["']`, 'i');
    }
    const match = xml.match(regex);
    return match ? match[1] : null;
}

// ============================================================================
// GOOGLE NEWS RSS
// ============================================================================

async function fetchGoogleNews(topics) {
    if (!topics || topics.length === 0) {
        topics = ['TECHNOLOGY', 'SCIENCE'];
    }

    console.log('[BG] Fetching Google News for topics:', topics.join(', '));

    const fetches = topics.map(topic => {
        const url = `https://news.google.com/rss/headlines/section/topic/${topic}?hl=en-US&gl=US&ceid=US:en`;
        return fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status} for topic ${topic}`);
                return res.text();
            })
            .then(xml => parseGoogleNewsRSS(xml, topic));
    });

    const results = await Promise.allSettled(fetches);
    const allItems = [];

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allItems.push(...result.value);
        } else {
            console.warn('[BG] Google News topic fetch failed:', result.reason?.message);
        }
    }

    if (allItems.length === 0) {
        throw new Error('No news items found from any topic');
    }

    // Sort by date descending, take top 15
    allItems.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
    const items = allItems.slice(0, 15);

    console.log('[BG] Google News: merged', allItems.length, 'items, returning top', items.length);
    return items;
}

function parseGoogleNewsRSS(xml, topic) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];

        let title = extractTag(item, 'title') || 'No Title';
        // Google News RSS title includes " - SourceName" suffix — strip it
        let source = '';
        const sourceMatch = title.match(/^(.*)\s+-\s+(.+)$/);
        if (sourceMatch) {
            title = sourceMatch[1].trim();
            source = sourceMatch[2].trim();
        }

        // Google News RSS <link> tag content appears as text after the tag
        let link = '';
        const linkMatch = item.match(/<link\s*\/?\s*>\s*(https?:\/\/[^\s<]+)/i);
        if (linkMatch) {
            link = linkMatch[1].trim();
        } else {
            // Fallback: try extracting from <link>...</link>
            link = extractTag(item, 'link') || '#';
        }

        const pubDate = extractTag(item, 'pubDate') || '';

        items.push({
            title: title,
            link: link,
            date: pubDate ? new Date(pubDate).toLocaleDateString() : '',
            rawDate: pubDate || '1970-01-01',
            author: source,
            category: topic
        });
    }

    return items;
}

// ============================================================================
// HACKER NEWS
// ============================================================================

async function fetchHackerNews() {
    console.log('[BG] Fetching Hacker News top stories');

    const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const ids = await response.json();
    const topIds = ids.slice(0, 15);

    const itemFetches = topIds.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
            .then(res => res.json())
    );

    const stories = await Promise.all(itemFetches);

    const items = stories
        .filter(story => story && story.title)
        .map(story => ({
            title: story.title,
            link: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            date: story.time ? new Date(story.time * 1000).toLocaleDateString() : '',
            author: story.by || '',
            score: story.score || 0,
            comments: story.descendants || 0,
            hnLink: `https://news.ycombinator.com/item?id=${story.id}`,
            category: ''
        }));

    console.log('[BG] Hacker News: fetched', items.length, 'stories');
    return items;
}

// ============================================================================
// APOD BULLETPROOF IMPLEMENTATION
// ============================================================================

/**
 * Helper: Sleep for a given number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: Get today's date in YYYY-MM-DD format (local timezone)
 */
function getLocalToday() {
    return new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
}

/**
 * Fetch APOD from NASA API with timeout
 */
async function fetchApodFromApi(date = null) {
    console.log('[BG] Fetching NASA APOD via API...', date ? `(date: ${date})` : '(today)');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        let url = `${NASA_API_URL}?api_key=${NASA_API_KEY}&thumbs=true`;
        if (date) {
            url += `&date=${date}`;
        }

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('[BG] APOD API response:', data.title, '| media_type:', data.media_type, '| date:', data.date);

        // Handle video case - use thumbnail
        let imageUrl = data.url;
        let mediaType = data.media_type;

        if (mediaType === 'video') {
            console.log('[BG] APOD is a video, checking for thumbnail...');
            if (data.thumbnail_url) {
                imageUrl = data.thumbnail_url;
                mediaType = 'image';
                console.log('[BG] Using video thumbnail:', imageUrl);
            } else {
                throw new Error('VIDEO_NO_THUMBNAIL');
            }
        }

        return {
            title: data.title,
            explanation: data.explanation || 'No explanation available.',
            url: imageUrl,
            media_type: mediaType,
            date: data.date,
            source: 'api'
        };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('API request timed out');
        }
        throw error;
    }
}

/**
 * Fallback: Scrape APOD directly from website when API fails
 */
async function scrapeApodFromWebsite() {
    console.log('[BG] Attempting fallback: scraping APOD website directly...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(APOD_WEBSITE, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Website HTTP ${response.status}`);
        }

        const html = await response.text();

        // Extract image URL: <a href="image/YYMM/filename.jpg"><img src="...">
        const imageMatch = html.match(/<a href="(image\/\d+\/[^"]+\.(jpg|jpeg|png|gif))"[^>]*><img/i);
        if (!imageMatch) {
            throw new Error('Could not find image on APOD website');
        }

        const relativeUrl = imageMatch[1];
        const imageUrl = `https://apod.nasa.gov/apod/${relativeUrl}`;

        // Extract title: <b> Title </b>
        const titleMatch = html.match(/<b>\s*([^<]+?)\s*<\/b>/);
        const title = titleMatch ? titleMatch[1].trim() : 'Astronomy Picture of the Day';

        // Extract explanation (first <p> after Explanation:)
        let explanation = 'No explanation available.';
        const explMatch = html.match(/Explanation:\s*<\/b>\s*(.+?)(?:<p>|<center>)/is);
        if (explMatch) {
            explanation = explMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
        }

        // Get today's date for the scraped image
        const today = getLocalToday();

        console.log('[BG] Website scrape successful:', title);

        return {
            title: title,
            explanation: explanation,
            url: imageUrl,
            media_type: 'image',
            date: today,
            source: 'website'
        };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Website scrape timed out');
        }
        throw error;
    }
}

/**
 * Main APOD fetch with retry logic and fallbacks
 */
async function fetchApodWithFallback() {
    const today = getLocalToday();
    let lastError = null;

    // Attempt 1: Try API with retries
    for (let attempt = 0; attempt < APOD_MAX_RETRIES; attempt++) {
        try {
            const data = await fetchApodFromApi();

            // Validate that API returned today's image
            if (data.date !== today) {
                console.log(`[BG] API returned date ${data.date}, expected ${today} - NASA may not have updated yet`);
            }

            return data;
        } catch (error) {
            lastError = error;
            console.warn(`[BG] APOD API attempt ${attempt + 1}/${APOD_MAX_RETRIES} failed:`, error.message);

            // If video without thumbnail, try yesterday's APOD
            if (error.message === 'VIDEO_NO_THUMBNAIL') {
                console.log('[BG] Video without thumbnail, trying yesterday...');
                try {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toLocaleDateString('en-CA');
                    return await fetchApodFromApi(yesterdayStr);
                } catch (yesterdayError) {
                    console.warn('[BG] Yesterday fetch also failed:', yesterdayError.message);
                }
            }

            // Wait before retry (except on last attempt)
            if (attempt < APOD_MAX_RETRIES - 1) {
                const delay = APOD_RETRY_DELAYS[attempt] || 5000;
                console.log(`[BG] Waiting ${delay}ms before retry...`);
                await sleep(delay);
            }
        }
    }

    // Attempt 2: Fallback to website scraping
    console.log('[BG] All API attempts failed, trying website scrape...');
    try {
        return await scrapeApodFromWebsite();
    } catch (scrapeError) {
        console.error('[BG] Website scrape also failed:', scrapeError.message);
    }

    // All methods failed
    throw lastError || new Error('All APOD fetch methods failed');
}

/**
 * Force refresh - bypasses cache completely
 */
async function forceRefreshApod() {
    console.log('[BG] Force refreshing APOD (bypassing cache)...');

    // Clear existing cache
    await chrome.storage.local.remove(['apod_data', 'apod_date', 'apod_cache_version']);

    // Fetch fresh data
    const data = await fetchApodWithFallback();

    // Cache it
    const today = getLocalToday();
    await chrome.storage.local.set({
        apod_data: data,
        apod_date: today,
        apod_cache_version: APOD_CACHE_VERSION
    });

    console.log('[BG] Force refresh complete:', data.title);
    return data;
}

/**
 * Check cache and fetch if needed (called by alarm and on startup)
 */
async function fetchAndCacheApod() {
    const today = getLocalToday();

    // Check cached data
    const cached = await chrome.storage.local.get(['apod_data', 'apod_date', 'apod_cache_version']);

    // Force cache clear if version changed
    if (cached.apod_cache_version !== APOD_CACHE_VERSION) {
        console.log('[BG] Cache version mismatch, clearing old APOD cache...');
        await chrome.storage.local.remove(['apod_data', 'apod_date', 'apod_data_time', 'apod_cache_version']);
    }
    // Validate using API's date field
    else if (cached.apod_data && cached.apod_data.date === today) {
        console.log('[BG] APOD already cached for today (API date:', cached.apod_data.date, '):', cached.apod_data.title);
        return;
    }

    if (cached.apod_data) {
        console.log('[BG] APOD cache stale - cached API date:', cached.apod_data.date, ', today:', today);
    }

    console.log('[BG] Fetching fresh APOD for', today);

    try {
        const data = await fetchApodWithFallback();
        await chrome.storage.local.set({
            apod_data: data,
            apod_date: data.date,
            apod_cache_version: APOD_CACHE_VERSION
        });
        console.log('[BG] APOD cached successfully (API date:', data.date, '):', data.title, '| Source:', data.source);
    } catch (error) {
        console.error('[BG] Failed to fetch APOD:', error.message);
    }
}

// ============================================================================
// POMODORO NOTIFICATIONS
// ============================================================================

function handlePomodoroAlarm() {
    chrome.storage.local.get(['pomodoroIsBreak', 'pomodoroRunning'], (result) => {
        if (!result.pomodoroRunning) return;

        const isBreak = result.pomodoroIsBreak;
        const title = isBreak ? 'Break Over!' : 'Focus Session Complete!';
        const message = isBreak
            ? 'Time to get back to work.'
            : 'Great work! Take a short break.';

        chrome.notifications.create('pomodoroNotification', {
            type: 'basic',
            iconUrl: 'icon.png',
            title: title,
            message: message,
            priority: 2
        });

        // Update state: timer is no longer running
        chrome.storage.local.set({ pomodoroRunning: false });
    });
}

// ============================================================================
// ALARMS & LIFECYCLE
// ============================================================================

// Use 2-hour periodic checks for more reliable daily APOD updates
chrome.alarms.create('apodPeriodicCheck', {
    periodInMinutes: 120,
    delayInMinutes: 1
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'apodPeriodicCheck') {
        console.log('[BG] APOD periodic check triggered');
        fetchAndCacheApod();
    }
    if (alarm.name === 'pomodoroTimer') {
        handlePomodoroAlarm();
    }
});

// Fetch on install/update + set default settings
chrome.runtime.onInstalled.addListener(async () => {
    console.log('[BG] Extension installed/updated');

    // Set default settings if not already set
    const stored = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
    const toSet = {};
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        if (stored[key] === undefined) {
            toSet[key] = value;
        }
    }
    if (Object.keys(toSet).length > 0) {
        await chrome.storage.local.set(toSet);
        console.log('[BG] Set default settings:', Object.keys(toSet).join(', '));
    }

    fetchAndCacheApod();
});

// Fetch when service worker starts
console.log('[BG] Service worker started');
fetchAndCacheApod();


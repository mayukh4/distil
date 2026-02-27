// Cached user name (avoids reading storage every second)
let cachedUserName = '';

// Time and Date
function updateTime() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    const date = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('time').textContent = time;
    document.getElementById('date').textContent = date;
    updateGreeting(now.getHours(), cachedUserName);
}

function updateGreeting(hours, name) {
    let msg = "Welcome";
    if (hours < 12) msg = "Good Morning";
    else if (hours < 17) msg = "Good Afternoon";
    else msg = "Good Evening";
    if (name) msg += `, ${name}`;
    document.getElementById('greeting').textContent = msg;
}

updateTime();
setInterval(updateTime, 1000);

// Weather — API key provided by user via settings
// OpenWeatherMap condition mapping to minimalist SVG icons
const weatherIcons = {
    '01d': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    '01n': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    '02d': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7V3M9.6 12.5a4.5 4.5 0 1 1 5.4 0M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path><path d="M8 11.5a4.5 4.5 0 0 1 0 9"></path><path d="M16 11.5a4.5 4.5 0 1 1 0 9"></path></svg>`,
    '02n': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path></svg>`,
    '03d': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path></svg>`,
    '03n': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path></svg>`,
    '04d': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path></svg>`,
    '04n': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path></svg>`,
    '09d': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path><path d="M8 13v2"></path><path d="M8 18v2"></path><path d="M12 13v2"></path><path d="M12 18v2"></path><path d="M16 13v2"></path><path d="M16 18v2"></path></svg>`,
    '09n': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path><path d="M8 13v2"></path><path d="M8 18v2"></path><path d="M12 13v2"></path><path d="M12 18v2"></path><path d="M16 13v2"></path><path d="M16 18v2"></path></svg>`,
    '10d': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2m2.93 7.07l1.41-1.41"></path><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path><path d="M8 13v2"></path><path d="M12 13v2"></path><path d="M16 13v2"></path></svg>`,
    '10n': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10H16.14a5.25 5.25 0 0 0-9.71-3.14"></path><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path><path d="M8 13v2"></path><path d="M12 13v2"></path><path d="M16 13v2"></path></svg>`,
    '11d': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path><path d="m13 14-2 4h3l-2 4"></path></svg>`,
    '11n': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path><path d="m13 14-2 4h3l-2 4"></path></svg>`,
    '13d': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path><circle cx="8" cy="16" r="1" fill="currentColor"></circle><circle cx="12" cy="14" r="1" fill="currentColor"></circle><circle cx="16" cy="17" r="1" fill="currentColor"></circle><circle cx="10" cy="18" r="1" fill="currentColor"></circle><circle cx="14" cy="16" r="1" fill="currentColor"></circle></svg>`,
    '13n': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10h-1.26a4.458 4.458 0 1 0-8.41 2H7a4.5 4.5 0 1 0 0 9h10a4.5 4.5 0 1 0 0-9Z"></path><circle cx="8" cy="16" r="1" fill="currentColor"></circle><circle cx="12" cy="14" r="1" fill="currentColor"></circle><circle cx="16" cy="17" r="1" fill="currentColor"></circle><circle cx="10" cy="18" r="1" fill="currentColor"></circle><circle cx="14" cy="16" r="1" fill="currentColor"></circle></svg>`,
    '50d': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="10" x2="20" y2="10"></line><line x1="4" y1="14" x2="20" y2="14"></line><line x1="4" y1="18" x2="20" y2="18"></line><line x1="4" y1="6" x2="20" y2="6"></line></svg>`,
    '50n': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="10" x2="20" y2="10"></line><line x1="4" y1="14" x2="20" y2="14"></line><line x1="4" y1="18" x2="20" y2="18"></line><line x1="4" y1="6" x2="20" y2="6"></line></svg>`
};

async function getWeather(city, tempUnit, apiKey) {
    if (!tempUnit) tempUnit = 'C';
    if (!apiKey) return;
    const weatherDisplay = document.getElementById('weather-display');
    const cityInputContainer = document.querySelector('.city-input-container');
    const tempElement = document.getElementById('temp');
    const descElement = document.getElementById('description');
    const units = tempUnit === 'F' ? 'imperial' : 'metric';
    const symbol = tempUnit === 'F' ? 'F' : 'C';

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`
        );
        const data = await response.json();

        if (data.cod === 200) {
            tempElement.textContent = `${Math.round(data.main.temp)}\u00B0${symbol}`;
            descElement.textContent = `${data.weather[0].description} in ${data.name}, ${data.sys.country}`;

            const iconCode = data.weather[0].icon;
            const iconElement = document.getElementById('weather-icon');
            if (iconElement && weatherIcons[iconCode]) {
                iconElement.innerHTML = weatherIcons[iconCode];
            } else if (iconElement) {
                iconElement.innerHTML = '';
            }

            weatherDisplay.classList.remove('hidden');
            if (cityInputContainer) cityInputContainer.classList.add('hidden');

            chrome.storage.local.set({ city: city });
        } else {
            console.error('Weather error:', data.message);
            alert(`Weather error: ${data.message}`);
        }
    } catch (error) {
        console.error('Weather fetch failed:', error);
    }
}

// Load saved data
chrome.storage.local.get(['city', 'notes', 'tempUnit', 'userName', 'weatherApiKey'], (result) => {
    if (result.city && result.weatherApiKey) {
        getWeather(result.city, result.tempUnit || 'C', result.weatherApiKey);
    }
    if (result.notes) {
        document.getElementById('notes').value = result.notes;
    }
    if (result.userName) {
        cachedUserName = result.userName;
        updateGreeting(new Date().getHours(), cachedUserName);
    }
});

// Auto-save notes
const notesArea = document.getElementById('notes');
let saveTimeout;
notesArea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        chrome.storage.local.set({ notes: notesArea.value });
    }, 500);
});

// Periodic weather refresh (every 30 mins)
setInterval(() => {
    chrome.storage.local.get(['city', 'tempUnit', 'weatherApiKey'], (result) => {
        if (result.city && result.weatherApiKey) getWeather(result.city, result.tempUnit || 'C', result.weatherApiKey);
    });
}, 30 * 60 * 1000);

// ============================================================================
// NEWS FEED LOGIC
// ============================================================================

const PAPERS_CACHE_DURATION = 6 * 60 * 60 * 1000;   // 6 hours
const NEWS_CACHE_DURATION = 12 * 60 * 60 * 1000;     // 12 hours
const HN_CACHE_DURATION = 1 * 60 * 60 * 1000;        // 1 hour
const APOD_CACHE_VERSION = 5;
const NEWS_CACHE_VERSION = 4; // Bumped for new feed system

let currentNewsTab = 'papers';

// Build category display name lookup from ARXIV_CATEGORIES constant
function getCategoryDisplayName(code) {
    for (const group of Object.values(ARXIV_CATEGORIES)) {
        if (group[code]) return group[code];
    }
    return code;
}

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
    const { notesExpanded, apodEnabled, activeTab, zenMode, firstRun } = await chrome.storage.local.get([
        'notesExpanded', 'apodEnabled', 'activeTab', 'zenMode', 'firstRun'
    ]);

    if (notesExpanded) {
        toggleNotesPanel(true);
    }

    // Restore active tab
    if (activeTab && ['papers', 'news', 'hn'].includes(activeTab)) {
        currentNewsTab = activeTab;
        document.querySelectorAll('.news-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.source === currentNewsTab);
        });
    }

    // APOD toggle button state
    const apodToggleBtn = document.getElementById('apod-toggle-btn');
    if (apodEnabled) {
        apodToggleBtn.classList.add('active');
        apodToggleBtn.title = 'Toggle NASA APOD Background (Currently On)';
        loadApod();
    } else {
        apodToggleBtn.title = 'Toggle NASA APOD Background (Currently Off)';
    }

    // Zen mode restore
    if (zenMode) {
        document.body.classList.add('zen-mode');
    }

    // First-run banner
    if (firstRun) {
        showFirstRunBanner();
    }

    // Load quick links
    const { quickLinks } = await chrome.storage.local.get(['quickLinks']);
    renderQuickLinks(quickLinks || []);

    loadNews(currentNewsTab);
    initPomodoro();
});

// Tab switching
document.querySelectorAll('.news-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentNewsTab = e.target.dataset.source;
        chrome.storage.local.set({ activeTab: currentNewsTab });
        loadNews(currentNewsTab);
    });
});

// News Panel Collapse Toggle
document.getElementById('news-collapse-btn').addEventListener('click', () => {
    const newsPanel = document.getElementById('news-panel');
    const expandBtn = document.getElementById('news-expand-btn');

    newsPanel.classList.add('collapsed');
    expandBtn.classList.remove('hidden');
    chrome.storage.local.set({ newsCollapsed: true });
});

document.getElementById('news-expand-btn').addEventListener('click', () => {
    const newsPanel = document.getElementById('news-panel');
    const expandBtn = document.getElementById('news-expand-btn');

    newsPanel.classList.remove('collapsed');
    expandBtn.classList.add('hidden');
    chrome.storage.local.set({ newsCollapsed: false });
});

// Load saved collapse state
chrome.storage.local.get(['newsCollapsed']).then(result => {
    if (result.newsCollapsed) {
        document.getElementById('news-panel').classList.add('collapsed');
        document.getElementById('news-expand-btn').classList.remove('hidden');
    }
});

// News Refresh Button
document.getElementById('news-refresh-btn').addEventListener('click', async () => {
    const refreshBtn = document.getElementById('news-refresh-btn');
    refreshBtn.classList.add('spinning');

    const cacheKey = `news_${currentNewsTab}`;
    await chrome.storage.local.remove([cacheKey, `${cacheKey}_time`]);

    await loadNews(currentNewsTab, true);

    setTimeout(() => {
        refreshBtn.classList.remove('spinning');
    }, 500);
});

async function loadNews(source, forceRefresh = false) {
    const container = document.getElementById('news-content');

    // Check cache first (unless force refresh)
    const cacheKey = `news_${source}`;
    const versionKey = 'news_version';
    const cached = await chrome.storage.local.get([cacheKey, `${cacheKey}_time`, versionKey]);
    const now = Date.now();

    if (!forceRefresh) {
        if (cached[versionKey] !== NEWS_CACHE_VERSION) {
            console.log(`News: Cache version mismatch, clearing old caches...`);
            await chrome.storage.local.remove([
                'news_papers', 'news_papers_time',
                'news_news', 'news_news_time',
                'news_hn', 'news_hn_time'
            ]);
            await chrome.storage.local.set({ [versionKey]: NEWS_CACHE_VERSION });
        } else {
            let cacheDuration = PAPERS_CACHE_DURATION;
            if (source === 'news') cacheDuration = NEWS_CACHE_DURATION;
            if (source === 'hn') cacheDuration = HN_CACHE_DURATION;

            if (cached[cacheKey] && now - cached[`${cacheKey}_time`] < cacheDuration) {
                displayNews(cached[cacheKey], source);
                return;
            }
        }
    }

    container.innerHTML = '<div class="loading">Fetching latest data...</div>';

    try {
        let response;
        const settings = await chrome.storage.local.get(['arxivCategories', 'newsTopics']);

        if (source === 'papers') {
            const categories = settings.arxivCategories || DEFAULT_SETTINGS.arxivCategories;
            response = await chrome.runtime.sendMessage({ action: 'fetchPapers', categories });
        } else if (source === 'news') {
            const topics = settings.newsTopics || DEFAULT_SETTINGS.newsTopics;
            response = await chrome.runtime.sendMessage({ action: 'fetchGoogleNews', topics });
        } else if (source === 'hn') {
            response = await chrome.runtime.sendMessage({ action: 'fetchHackerNews' });
        }

        if (!response.success) {
            throw new Error(response.error || 'Unknown error');
        }

        const items = response.data;
        if (!items || items.length === 0) throw new Error('No items found');

        chrome.storage.local.set({
            [cacheKey]: items,
            [`${cacheKey}_time`]: now
        });
        displayNews(items, source);
    } catch (error) {
        console.error('Failed to fetch news:', error);
        container.innerHTML = '<div class="loading">Could not load data. Try again later.</div>';
    }
}

function displayNews(items, source) {
    const container = document.getElementById('news-content');

    // Weekend notice for arXiv papers
    let staleNotice = '';
    if (source === 'papers' && items.length > 0 && items[0].date) {
        const firstPaperDate = new Date(items[0].date);
        const today = new Date();
        const daysDiff = Math.floor((today - firstPaperDate) / (1000 * 60 * 60 * 24));
        if (daysDiff > 1) {
            staleNotice = `<div class="arxiv-notice">arXiv doesn't publish on weekends. Latest papers are from ${items[0].date}.</div>`;
        }
    }

    container.innerHTML = staleNotice + items.map(item => {
        // Category display
        let categoryHtml = '';
        if (source === 'papers' && item.category) {
            categoryHtml = `<span class="news-category">${getCategoryDisplayName(item.category)}</span>`;
        } else if (source === 'news' && item.category) {
            categoryHtml = `<span class="news-category">${GOOGLE_NEWS_TOPICS[item.category] || item.category}</span>`;
        }

        // HN-specific meta (score + comments)
        let metaHtml = '';
        if (source === 'hn') {
            metaHtml = `
                <div class="news-meta">
                    <span class="hn-score">${item.score} pts</span>
                    <a href="${item.hnLink}" target="_blank" class="hn-comments">${item.comments} comments</a>
                    ${item.author ? `<span>${item.author}</span>` : ''}
                </div>
            `;
        } else {
            metaHtml = `
                <div class="news-meta">
                    ${categoryHtml}
                    ${item.date ? `<span>${item.date}</span>` : ''}
                    ${item.author ? `<span>• ${item.author}</span>` : ''}
                </div>
            `;
        }

        return `
            <a href="${item.link}" target="_blank" class="news-item">
                <span class="news-title">${item.title}</span>
                ${metaHtml}
            </a>
        `;
    }).join('');
}

// ============================================================================
// SETTINGS CHANGE LISTENER
// ============================================================================

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;

    // arXiv categories changed — invalidate papers cache + re-fetch if on that tab
    if (changes.arxivCategories) {
        chrome.storage.local.remove(['news_papers', 'news_papers_time']);
        if (currentNewsTab === 'papers') loadNews('papers', true);
    }

    // News topics changed — invalidate news cache + re-fetch if on that tab
    if (changes.newsTopics) {
        chrome.storage.local.remove(['news_news', 'news_news_time']);
        if (currentNewsTab === 'news') loadNews('news', true);
    }

    // Temperature unit, city, or API key changed — re-fetch weather
    if (changes.tempUnit || changes.city || changes.weatherApiKey) {
        chrome.storage.local.get(['city', 'tempUnit', 'weatherApiKey'], (result) => {
            if (result.city && result.weatherApiKey) getWeather(result.city, result.tempUnit || 'C', result.weatherApiKey);
        });
    }

    // APOD toggle changed from popup
    if (changes.apodEnabled) {
        const apodToggleBtn = document.getElementById('apod-toggle-btn');
        if (changes.apodEnabled.newValue) {
            apodToggleBtn.classList.add('active');
            apodToggleBtn.title = 'Toggle NASA APOD Background (Currently On)';
            loadApod();
        } else {
            apodToggleBtn.classList.remove('active');
            apodToggleBtn.title = 'Toggle NASA APOD Background (Currently Off)';
            document.body.style.removeProperty('--bg-image');
            document.getElementById('apod-info').classList.add('hidden');
        }
    }

    // Zen mode changed from popup
    if (changes.zenMode) {
        document.body.classList.toggle('zen-mode', changes.zenMode.newValue);
    }

    // User name changed
    if (changes.userName) {
        cachedUserName = changes.userName.newValue || '';
        updateGreeting(new Date().getHours(), cachedUserName);
    }

    // Quick links changed
    if (changes.quickLinks) {
        renderQuickLinks(changes.quickLinks.newValue || []);
    }
});

// ============================================================================
// WEATHER INTERACTION
// ============================================================================

document.getElementById('weather-display').addEventListener('click', () => {
    document.getElementById('weather-display').classList.add('hidden');
    document.querySelector('.city-input-container').classList.remove('hidden');
    document.getElementById('city-input').focus();
});

document.getElementById('set-city').addEventListener('click', () => {
    const city = document.getElementById('city-input').value.trim();
    if (city) {
        chrome.storage.local.get(['tempUnit', 'weatherApiKey'], (result) => {
            if (result.weatherApiKey) getWeather(city, result.tempUnit || 'C', result.weatherApiKey);
        });
    }
});

document.getElementById('city-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = document.getElementById('city-input').value.trim();
        if (city) {
            chrome.storage.local.get(['tempUnit', 'weatherApiKey'], (result) => {
                if (result.weatherApiKey) getWeather(city, result.tempUnit || 'C', result.weatherApiKey);
            });
        }
    }
});

// ============================================================================
// NOTES
// ============================================================================

document.getElementById('download-notes').addEventListener('click', () => {
    const text = document.getElementById('notes').value;
    if (!text.trim()) return;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
});

function toggleNotesPanel(forceExpand = null) {
    const mainContent = document.querySelector('.main-content');
    const notesWidget = document.querySelector('.notes-widget');
    const toggleBtn = document.getElementById('notes-toggle');

    const shouldExpand = forceExpand !== null ? forceExpand : mainContent.classList.contains('notes-collapsed');

    if (shouldExpand) {
        mainContent.classList.remove('notes-collapsed');
        notesWidget.classList.remove('collapsed');
        toggleBtn.classList.add('active');
    } else {
        mainContent.classList.add('notes-collapsed');
        notesWidget.classList.add('collapsed');
        toggleBtn.classList.remove('active');
    }

    chrome.storage.local.set({ notesExpanded: shouldExpand });
}

document.getElementById('notes-toggle').addEventListener('click', () => {
    toggleNotesPanel();
});

// ============================================================================
// APOD
// ============================================================================

let apodClickCount = 0;
let apodClickTimer = null;

document.getElementById('apod-toggle-btn').addEventListener('click', async () => {
    apodClickCount++;

    if (apodClickCount === 1) {
        apodClickTimer = setTimeout(async () => {
            apodClickCount = 0;
            await toggleApod();
        }, 300);
    } else if (apodClickCount === 2) {
        clearTimeout(apodClickTimer);
        apodClickCount = 0;
        await forceRefreshApod();
    }
});

async function toggleApod() {
    const apodToggleBtn = document.getElementById('apod-toggle-btn');
    const isCurrentlyEnabled = apodToggleBtn.classList.contains('active');

    if (isCurrentlyEnabled) {
        apodToggleBtn.classList.remove('active');
        apodToggleBtn.title = 'Toggle NASA APOD Background (Currently Off) - Double-click to refresh';
        await chrome.storage.local.set({ apodEnabled: false });
        document.body.style.removeProperty('--bg-image');
        document.getElementById('apod-info').classList.add('hidden');
    } else {
        apodToggleBtn.classList.add('active');
        apodToggleBtn.title = 'Toggle NASA APOD Background (Currently On) - Double-click to refresh';
        await chrome.storage.local.set({ apodEnabled: true });
        await forceRefreshApod();
    }
}

async function forceRefreshApod() {
    const apodToggleBtn = document.getElementById('apod-toggle-btn');
    const infoBox = document.getElementById('apod-info');

    if (!apodToggleBtn.classList.contains('active')) {
        apodToggleBtn.classList.add('active');
        await chrome.storage.local.set({ apodEnabled: true });
    }

    infoBox.classList.remove('hidden');
    document.getElementById('apod-title').textContent = 'Loading fresh image...';
    document.getElementById('apod-explanation').textContent = '';
    document.getElementById('apod-date').textContent = '';

    try {
        const response = await chrome.runtime.sendMessage({ action: 'forceRefreshApod' });

        if (response && response.success && response.data) {
            await displayApod(response.data);
        } else {
            document.getElementById('apod-title').textContent = 'Failed to load APOD';
            document.getElementById('apod-explanation').textContent = response?.error || 'Please try again.';
        }
    } catch (error) {
        document.getElementById('apod-title').textContent = 'Failed to load APOD';
        document.getElementById('apod-explanation').textContent = error.message;
    }
}

async function loadApod() {
    const cached = await chrome.storage.local.get(['apod_data', 'apod_date', 'apod_cache_version']);
    const today = new Date().toLocaleDateString('en-CA');

    const cacheValid = cached.apod_cache_version === APOD_CACHE_VERSION &&
        cached.apod_data &&
        cached.apod_data.date === today;

    if (cacheValid) {
        await displayApod(cached.apod_data);
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage({ action: 'fetchApod' });

        if (response && response.success && response.data) {
            await chrome.storage.local.set({
                apod_data: response.data,
                apod_date: response.data.date,
                apod_cache_version: APOD_CACHE_VERSION
            });
            await displayApod(response.data);
        }
    } catch (error) {
        console.error('APOD: Error -', error.message);
    }
}

async function displayApod(data) {
    if (!data || data.media_type !== 'image') return;

    try {
        await preloadImage(data.url);
    } catch (error) {
        console.error('APOD: Image failed to load:', data.url);
        return;
    }

    document.body.style.setProperty('--bg-image', `url('${data.url}')`);

    const infoBox = document.getElementById('apod-info');
    document.getElementById('apod-title').textContent = data.title;
    document.getElementById('apod-explanation').textContent = data.explanation;

    const sourceNote = data.source === 'website' ? ' (via website)' : '';
    document.getElementById('apod-date').textContent = `NASA APOD${sourceNote} \u2022 ${new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    infoBox.classList.remove('hidden');
}

function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = url;
    });
}

// APOD Explanation Toggle
document.getElementById('apod-toggle').addEventListener('click', () => {
    const explanation = document.getElementById('apod-explanation');
    const toggleBtn = document.getElementById('apod-toggle');
    const isCollapsed = explanation.classList.contains('collapsed');

    if (isCollapsed) {
        explanation.classList.remove('collapsed');
        toggleBtn.classList.add('active');
    } else {
        explanation.classList.add('collapsed');
        toggleBtn.classList.remove('active');
    }
});

// ============================================================================
// QUICK LINKS
// ============================================================================

function renderQuickLinks(links) {
    const container = document.getElementById('quick-links');
    container.innerHTML = '';

    if (!links || links.length === 0) return;

    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.className = 'quick-link';
        a.target = '_self';
        a.dataset.name = link.name || new URL(link.url).hostname;

        const img = document.createElement('img');
        const domain = new URL(link.url).hostname;
        img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        img.alt = link.name || domain;
        img.onerror = () => { img.style.display = 'none'; };

        a.appendChild(img);
        container.appendChild(a);
    });
}

// ============================================================================
// ZEN MODE
// ============================================================================

function toggleZenMode() {
    const isZen = document.body.classList.toggle('zen-mode');
    chrome.storage.local.set({ zenMode: isZen });
}

document.getElementById('zen-toggle-btn').addEventListener('click', () => {
    toggleZenMode();
});

// Keyboard shortcuts for zen mode
document.addEventListener('keydown', (e) => {
    // Don't trigger when typing in input/textarea
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    if (e.key === 'z' || e.key === 'Z') {
        toggleZenMode();
    }
    if (e.key === 'Escape' && document.body.classList.contains('zen-mode')) {
        toggleZenMode();
    }
});

// ============================================================================
// POMODORO TIMER
// ============================================================================

const POMODORO_WORK = 25 * 60; // 25 minutes in seconds
const POMODORO_BREAK = 5 * 60; // 5 minutes in seconds
let pomodoroInterval = null;

function initPomodoro() {
    chrome.storage.local.get(['pomodoroEndTime', 'pomodoroIsBreak', 'pomodoroRunning'], (result) => {
        if (result.pomodoroRunning && result.pomodoroEndTime) {
            const remaining = Math.max(0, Math.floor((result.pomodoroEndTime - Date.now()) / 1000));
            if (remaining > 0) {
                // Timer is still running
                updatePomodoroDisplay(remaining, result.pomodoroIsBreak, true);
                startPomodoroTick();
            } else {
                // Timer expired while we were away
                chrome.storage.local.set({ pomodoroRunning: false });
                updatePomodoroDisplay(result.pomodoroIsBreak ? POMODORO_WORK : POMODORO_BREAK, !result.pomodoroIsBreak, false);
            }
        } else {
            updatePomodoroDisplay(POMODORO_WORK, false, false);
        }
    });
}

function updatePomodoroDisplay(seconds, isBreak, isRunning) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    document.getElementById('pomodoro-time').textContent = timeStr;
    document.getElementById('pomodoro-label').textContent = isBreak ? 'Break' : 'Focus';

    const startBtn = document.getElementById('pomodoro-start');
    startBtn.textContent = isRunning ? 'Pause' : 'Start';

    const pomodoroWidget = document.getElementById('pomodoro-widget');
    pomodoroWidget.classList.toggle('active', isRunning);
    pomodoroWidget.classList.toggle('break-mode', isBreak);

    // Update progress ring
    const totalSeconds = isBreak ? POMODORO_BREAK : POMODORO_WORK;
    const progress = 1 - (seconds / totalSeconds);
    const circumference = 2 * Math.PI * 18;
    const offset = circumference * (1 - progress);
    const ring = document.getElementById('pomodoro-ring');
    if (ring) {
        ring.style.strokeDasharray = circumference;
        ring.style.strokeDashoffset = offset;
    }
}

function startPomodoroTick() {
    clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(() => {
        chrome.storage.local.get(['pomodoroEndTime', 'pomodoroIsBreak', 'pomodoroRunning'], (result) => {
            if (!result.pomodoroRunning) {
                clearInterval(pomodoroInterval);
                return;
            }
            const remaining = Math.max(0, Math.floor((result.pomodoroEndTime - Date.now()) / 1000));
            updatePomodoroDisplay(remaining, result.pomodoroIsBreak, true);

            if (remaining <= 0) {
                clearInterval(pomodoroInterval);
                chrome.storage.local.set({ pomodoroRunning: false });
                // Switch to next phase
                const nextIsBreak = !result.pomodoroIsBreak;
                const nextDuration = nextIsBreak ? POMODORO_BREAK : POMODORO_WORK;
                updatePomodoroDisplay(nextDuration, nextIsBreak, false);
            }
        });
    }, 1000);
}

document.getElementById('pomodoro-start').addEventListener('click', () => {
    chrome.storage.local.get(['pomodoroEndTime', 'pomodoroIsBreak', 'pomodoroRunning'], (result) => {
        if (result.pomodoroRunning) {
            // Pause
            clearInterval(pomodoroInterval);
            chrome.alarms.clear('pomodoroTimer');
            const remaining = Math.max(0, Math.floor((result.pomodoroEndTime - Date.now()) / 1000));
            chrome.storage.local.set({
                pomodoroRunning: false,
                pomodoroRemaining: remaining
            });
            updatePomodoroDisplay(remaining, result.pomodoroIsBreak, false);
        } else {
            // Start / Resume
            const isBreak = result.pomodoroIsBreak || false;
            let duration;
            if (result.pomodoroRemaining && result.pomodoroRemaining > 0) {
                duration = result.pomodoroRemaining;
            } else {
                duration = isBreak ? POMODORO_BREAK : POMODORO_WORK;
            }
            const endTime = Date.now() + duration * 1000;

            chrome.storage.local.set({
                pomodoroEndTime: endTime,
                pomodoroIsBreak: isBreak,
                pomodoroRunning: true,
                pomodoroRemaining: 0
            });

            // Set alarm for notification
            chrome.alarms.create('pomodoroTimer', { delayInMinutes: duration / 60 });

            updatePomodoroDisplay(duration, isBreak, true);
            startPomodoroTick();
        }
    });
});

document.getElementById('pomodoro-reset').addEventListener('click', () => {
    clearInterval(pomodoroInterval);
    chrome.alarms.clear('pomodoroTimer');
    chrome.storage.local.set({
        pomodoroRunning: false,
        pomodoroEndTime: 0,
        pomodoroIsBreak: false,
        pomodoroRemaining: 0
    });
    updatePomodoroDisplay(POMODORO_WORK, false, false);
});

// ============================================================================
// FIRST-RUN BANNER
// ============================================================================

function showFirstRunBanner() {
    const banner = document.createElement('div');
    banner.className = 'first-run-banner';
    banner.innerHTML = `
        <span>Welcome to <strong>Distil</strong>! Click the extension icon to set your name, add quick links, and configure feeds.</span>
        <button id="dismiss-banner">Got it</button>
    `;
    document.querySelector('.container').prepend(banner);

    document.getElementById('dismiss-banner').addEventListener('click', () => {
        banner.remove();
        chrome.storage.local.set({ firstRun: false });
    });
}

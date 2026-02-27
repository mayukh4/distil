// Popup settings — all changes save instantly to chrome.storage.local

let currentSettings = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Load current settings
    const keys = Object.keys(DEFAULT_SETTINGS);
    const stored = await chrome.storage.local.get(keys);
    currentSettings = { ...DEFAULT_SETTINGS, ...stored };

    loadProfileSettings();
    loadQuickLinks();
    buildArxivSelector(currentSettings.arxivCategories);
    buildNewsTopicSelector(currentSettings.newsTopics);
    loadWeatherSettings();
    loadApodToggle();
});

// ============================================================================
// ARXIV CATEGORIES
// ============================================================================

function buildArxivSelector(selectedCategories) {
    const container = document.getElementById('arxiv-selector');
    container.innerHTML = '';

    for (const [groupName, categories] of Object.entries(ARXIV_CATEGORIES)) {
        const group = document.createElement('div');
        group.className = 'arxiv-group';

        // Count selected in this group
        const selectedInGroup = Object.keys(categories).filter(c => selectedCategories.includes(c)).length;

        // Header
        const header = document.createElement('div');
        header.className = 'arxiv-group-header';
        // Auto-expand groups that have selections
        if (selectedInGroup > 0) header.classList.add('expanded');

        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.textContent = '\u25B6';

        const label = document.createElement('span');
        label.textContent = groupName;

        const count = document.createElement('span');
        count.className = 'count' + (selectedInGroup > 0 ? ' has-selection' : '');
        count.textContent = selectedInGroup;

        header.appendChild(arrow);
        header.appendChild(label);
        header.appendChild(count);

        // Chips container
        const chipsContainer = document.createElement('div');
        chipsContainer.className = 'arxiv-group-chips' + (selectedInGroup > 0 ? ' expanded' : '');

        for (const [code, displayName] of Object.entries(categories)) {
            const chip = document.createElement('button');
            chip.className = 'chip' + (selectedCategories.includes(code) ? ' active' : '');
            chip.textContent = displayName;
            chip.dataset.code = code;

            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                saveArxivCategories();

                // Update group count
                const activeInGroup = chipsContainer.querySelectorAll('.chip.active').length;
                count.textContent = activeInGroup;
                count.classList.toggle('has-selection', activeInGroup > 0);
            });

            chipsContainer.appendChild(chip);
        }

        // Toggle expand/collapse
        header.addEventListener('click', () => {
            header.classList.toggle('expanded');
            chipsContainer.classList.toggle('expanded');
        });

        group.appendChild(header);
        group.appendChild(chipsContainer);
        container.appendChild(group);
    }
}

function saveArxivCategories() {
    const selected = [];
    document.querySelectorAll('#arxiv-selector .chip.active').forEach(chip => {
        selected.push(chip.dataset.code);
    });
    chrome.storage.local.set({ arxivCategories: selected });
}

// ============================================================================
// NEWS TOPICS
// ============================================================================

function buildNewsTopicSelector(selectedTopics) {
    const container = document.getElementById('news-topic-selector');
    container.innerHTML = '';

    for (const [code, displayName] of Object.entries(GOOGLE_NEWS_TOPICS)) {
        const chip = document.createElement('button');
        chip.className = 'chip' + (selectedTopics.includes(code) ? ' active' : '');
        chip.textContent = displayName;
        chip.dataset.code = code;

        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            saveNewsTopics();
        });

        container.appendChild(chip);
    }
}

function saveNewsTopics() {
    const selected = [];
    document.querySelectorAll('#news-topic-selector .chip.active').forEach(chip => {
        selected.push(chip.dataset.code);
    });
    chrome.storage.local.set({ newsTopics: selected });
}

// ============================================================================
// WEATHER
// ============================================================================

let cityTimeout;
let weatherKeyTimeout;

function loadWeatherSettings() {
    // API key
    const keyInput = document.getElementById('popup-weather-key');
    keyInput.value = currentSettings.weatherApiKey || '';

    keyInput.addEventListener('input', () => {
        clearTimeout(weatherKeyTimeout);
        weatherKeyTimeout = setTimeout(() => {
            chrome.storage.local.set({ weatherApiKey: keyInput.value.trim() });
        }, 800);
    });

    keyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(weatherKeyTimeout);
            chrome.storage.local.set({ weatherApiKey: keyInput.value.trim() });
        }
    });

    // City
    const cityInput = document.getElementById('popup-city');
    cityInput.value = currentSettings.city || '';

    cityInput.addEventListener('input', () => {
        clearTimeout(cityTimeout);
        cityTimeout = setTimeout(() => {
            const city = cityInput.value.trim();
            if (city) {
                chrome.storage.local.set({ city });
            }
        }, 800);
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(cityTimeout);
            const city = cityInput.value.trim();
            if (city) {
                chrome.storage.local.set({ city });
            }
        }
    });

    // Temp unit toggle
    const tempC = document.getElementById('temp-c');
    const tempF = document.getElementById('temp-f');

    if (currentSettings.tempUnit === 'F') {
        tempC.classList.remove('active');
        tempF.classList.add('active');
    }

    tempC.addEventListener('click', () => {
        tempC.classList.add('active');
        tempF.classList.remove('active');
        chrome.storage.local.set({ tempUnit: 'C' });
    });

    tempF.addEventListener('click', () => {
        tempF.classList.add('active');
        tempC.classList.remove('active');
        chrome.storage.local.set({ tempUnit: 'F' });
    });
}

// ============================================================================
// APOD TOGGLE
// ============================================================================

function loadApodToggle() {
    const toggle = document.getElementById('apod-toggle');
    if (currentSettings.apodEnabled) {
        toggle.classList.add('active');
    }

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        chrome.storage.local.set({ apodEnabled: toggle.classList.contains('active') });
    });
}

// ============================================================================
// PROFILE
// ============================================================================

let nameTimeout;

function loadProfileSettings() {
    const nameInput = document.getElementById('popup-name');
    nameInput.value = currentSettings.userName || '';

    nameInput.addEventListener('input', () => {
        clearTimeout(nameTimeout);
        nameTimeout = setTimeout(() => {
            chrome.storage.local.set({ userName: nameInput.value.trim() });
        }, 800);
    });

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(nameTimeout);
            chrome.storage.local.set({ userName: nameInput.value.trim() });
        }
    });
}

// ============================================================================
// QUICK LINKS
// ============================================================================

let quickLinksData = [];

function loadQuickLinks() {
    quickLinksData = currentSettings.quickLinks || [];
    renderQuickLinksList(quickLinksData);

    document.getElementById('ql-add-btn').addEventListener('click', addQuickLink);
    document.getElementById('ql-url').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addQuickLink();
    });
}

function renderQuickLinksList(links) {
    const container = document.getElementById('quick-links-list');
    container.innerHTML = '';

    links.forEach((link, index) => {
        const item = document.createElement('div');
        item.className = 'quick-link-item';
        item.draggable = true;
        item.dataset.index = index;

        const domain = getDomain(link.url);
        const favicon = document.createElement('img');
        favicon.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        favicon.className = 'ql-favicon';
        favicon.onerror = () => { favicon.style.visibility = 'hidden'; };

        const info = document.createElement('div');
        info.className = 'ql-info';

        const name = document.createElement('span');
        name.className = 'ql-name';
        name.textContent = link.name || domain;

        const url = document.createElement('span');
        url.className = 'ql-domain';
        url.textContent = domain;

        info.appendChild(name);
        info.appendChild(url);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'ql-remove';
        removeBtn.textContent = '\u00d7';
        removeBtn.title = 'Remove';
        removeBtn.addEventListener('click', () => removeQuickLink(index));

        item.appendChild(favicon);
        item.appendChild(info);
        item.appendChild(removeBtn);
        container.appendChild(item);
    });

    initDragReorder(container);
}

function addQuickLink() {
    if (quickLinksData.length >= 8) return;

    let url = document.getElementById('ql-url').value.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    try {
        new URL(url);
    } catch {
        return;
    }

    const name = document.getElementById('ql-name').value.trim() || getDomain(url);

    quickLinksData.push({ name, url });
    chrome.storage.local.set({ quickLinks: quickLinksData });
    renderQuickLinksList(quickLinksData);

    document.getElementById('ql-name').value = '';
    document.getElementById('ql-url').value = '';
}

function removeQuickLink(index) {
    quickLinksData.splice(index, 1);
    chrome.storage.local.set({ quickLinks: quickLinksData });
    renderQuickLinksList(quickLinksData);
}

function getDomain(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

function initDragReorder(container) {
    let dragIndex = null;

    container.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.quick-link-item');
        if (!item) return;
        dragIndex = parseInt(item.dataset.index);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        const item = e.target.closest('.quick-link-item');
        if (!item) return;
        e.dataTransfer.dropEffect = 'move';
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        item.classList.toggle('drag-over-top', e.clientY < midY);
        item.classList.toggle('drag-over-bottom', e.clientY >= midY);
    });

    container.addEventListener('dragleave', (e) => {
        const item = e.target.closest('.quick-link-item');
        if (item) {
            item.classList.remove('drag-over-top', 'drag-over-bottom');
        }
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        const item = e.target.closest('.quick-link-item');
        if (!item || dragIndex === null) return;

        const dropIndex = parseInt(item.dataset.index);
        if (dragIndex === dropIndex) return;

        const [moved] = quickLinksData.splice(dragIndex, 1);
        quickLinksData.splice(dropIndex, 0, moved);
        chrome.storage.local.set({ quickLinks: quickLinksData });
        renderQuickLinksList(quickLinksData);
    });

    container.addEventListener('dragend', () => {
        dragIndex = null;
        container.querySelectorAll('.quick-link-item').forEach(item => {
            item.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
        });
    });
}

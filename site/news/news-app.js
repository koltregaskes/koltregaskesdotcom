/**
 * AI News App - Kol's Korner
 * Adapted from daily-news to work with YYYY-MM-DD-digest.md format
 */

class NewsApp {
    constructor() {
        this.articles = [];
        this.filteredArticles = [];
        this.sources = new Set();
        this.dates = new Set();
        this.tags = new Set();
        this.favorites = new Set(JSON.parse(localStorage.getItem('news-favorites') || '[]'));
        this.flags = JSON.parse(localStorage.getItem('news-flags') || '{}');

        this.init();
    }

    async init() {
        await this.loadArticles();
        this.setupEventListeners();

        // Default to Last 24 Hours (yesterday's date to today)
        // This works better than "Today" since news may not have been gathered yet today
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const fromDate = document.getElementById('fromDate');
        const toDate = document.getElementById('toDate');
        if (fromDate) fromDate.value = yesterday.toISOString().split('T')[0];
        if (toDate) toDate.value = today.toISOString().split('T')[0];

        this.updateQuickFilterButtons('24h');
        this.filterArticles();
        this.renderFeaturedNow();
    }

    async loadArticles() {
        const prebuiltArticles = await this.loadPrebuiltArticles();
        if (prebuiltArticles) {
            this.articles = prebuiltArticles.map((article) => this.hydrateArticle(article));
            this.refreshDerivedCollections();
            this.filteredArticles = [...this.articles];
            this.populateFilters();

            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';
            return;
        }

        const fileList = await this.getDigestFileList();

        // Load files in parallel for much faster performance
        const loadPromises = fileList.map(async (filename) => {
            try {
                const response = await fetch(`../news-digests/${filename}`);
                if (response.ok) {
                    const content = await response.text();
                    return this.parseDigest(content, filename);
                }
            } catch (error) {
                // File doesn't exist, skip silently
            }
            return [];
        });

        // Wait for all files to load in parallel
        const results = await Promise.all(loadPromises);
        results.forEach(articles => this.articles.push(...articles));

        // Sort articles by date (newest first)
        this.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.refreshDerivedCollections();
        this.filteredArticles = [...this.articles];
        this.populateFilters();

        // Hide loading
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    async loadPrebuiltArticles() {
        try {
            const response = await fetch('../data/news-articles.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Prebuilt article request failed with ${response.status}`);
            }

            const payload = await response.json();
            if (payload && Array.isArray(payload.articles) && payload.articles.length > 0) {
                return payload.articles;
            }
        } catch (error) {
            console.warn('Prebuilt news archive unavailable, falling back to raw digest loading.', error);
        }

        return null;
    }

    hydrateArticle(article) {
        return {
            ...article,
            title: this.fixCommonEncoding(article.title || ''),
            source: this.fixCommonEncoding(article.source || ''),
            summary: this.fixCommonEncoding(article.summary || ''),
            tags: Array.isArray(article.tags) ? article.tags.map((tag) => String(tag).toLowerCase()) : [],
            date: new Date(article.date)
        };
    }

    fixCommonEncoding(text) {
        const value = String(text || '');
        if (!value) return '';

        if (/[\u00c3\u00c2\u00e2]/.test(value)) {
            try {
                const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
                const repaired = new TextDecoder('utf-8').decode(bytes);
                if (repaired && !repaired.includes('\uFFFD')) {
                    return repaired;
                }
            } catch {
                // Fall back to the targeted replacements below.
            }
        }

        return value
            .replace(/\u00e2\u20ac\u2122/g, "'")
            .replace(/\u00e2\u20ac\u02dc/g, "'")
            .replace(/\u00e2\u20ac\u0153/g, '"')
            .replace(/\u00e2\u20ac\u009d/g, '"')
            .replace(/\u00e2\u20ac"/g, '-')
            .replace(/\u00e2\u20ac\u201c/g, '-')
            .replace(/\u00e2\u20ac\u00a6/g, '...')
            .replace(/\u00c2/g, '');
    }

    refreshDerivedCollections() {
        this.sources = new Set();
        this.dates = new Set();
        this.tags = new Set();

        this.articles.forEach((article) => {
            if (article.source) this.sources.add(article.source);
            if (article.dateString) this.dates.add(article.dateString);
            if (Array.isArray(article.tags)) {
                article.tags.forEach((tag) => this.tags.add(tag));
            }
        });
    }

    async getDigestFileList() {
        try {
            const response = await fetch('../data/news-digests.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Manifest request failed with ${response.status}`);
            }

            const manifest = await response.json();
            if (Array.isArray(manifest.files) && manifest.files.length > 0) {
                const canonicalFiles = Array.from(
                    new Set(
                        manifest.files
                            .map((filename) => this.normaliseDigestFilename(filename))
                            .filter(Boolean)
                    )
                ).sort().reverse();

                if (canonicalFiles.length > 0) {
                    return canonicalFiles;
                }
            }
        } catch (error) {
            console.warn('Digest manifest unavailable, falling back to recent digest scan.', error);
        }

        return this.generateFileList(30);
    }

    normaliseDigestFilename(filename) {
        if (typeof filename !== 'string') return null;

        let match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-digest\.md$/);
        if (!match) {
            match = filename.match(/^digest-(\d{4})-(\d{2})-(\d{2})\.md$/);
        }

        if (!match) return null;

        const [, year, month, day] = match;
        return `${year}-${month}-${day}-digest.md`;
    }

    generateFileList(days = 90) {
        const files = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            files.push(`${year}-${month}-${day}-digest.md`);
        }

        return files;
    }

    parseDigest(content, filename) {
        content = this.fixCommonEncoding(content);
        // Extract date from filename (YYYY-MM-DD-digest.md)
        const dateMatch = filename.match(/(\d{4})-(\d{2})-(\d{2})-digest\.md/);
        if (!dateMatch) return [];

        const [, year, month, day] = dateMatch;
        const fileDate = new Date(year, month - 1, day);
        const dateString = fileDate.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const articles = [];
        let articleCountInDigest = 0;  // Track position for Top Stories ranking
        const TOP_STORIES_LIMIT = 5;   // First 5 articles are "Top Stories"

        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip category headers - we use position-based ranking instead
            const categoryMatch = line.match(/^##\s+(.+)$/);
            if (categoryMatch) {
                continue;
            }

            // Parse news items: - **Title** ([Source](URL)) _date_
            const itemMatch = line.match(/^-\s+\*\*(.+?)\*\*\s+\(\[(.+?)\]\((.+?)\)\)(?:\s+_(.+?)_)?$/);
            if (itemMatch) {
                const [, rawTitle, rawSourceName, url, itemDate] = itemMatch;
                const title = this.fixCommonEncoding(rawTitle).trim();
                const sourceName = this.fixCommonEncoding(rawSourceName).trim();
                articleCountInDigest++;

                // Get summary from next line(s) - indented text
                let summary = '';
                let j = i + 1;
                while (j < lines.length && lines[j].match(/^\s{2,}/)) {
                    summary += this.fixCommonEncoding(lines[j].trim()) + ' ';
                    j++;
                }

                // Skip navigation/junk items
                if (this.isJunkItem(title, url)) {
                    continue;
                }

                // Extract source from URL if not provided
                const source = sourceName || this.extractSource(url);

                // Generate tags from title
                const tags = this.generateTags(title);
                tags.forEach(t => this.tags.add(t));

                // Use the actual article date if available, otherwise fall back to file date
                let articleDate = fileDate;
                let articleDateString = dateString;
                if (itemDate && itemDate.trim()) {
                    const parsedDate = new Date(itemDate.trim());
                    if (!isNaN(parsedDate.getTime())) {
                        articleDate = parsedDate;
                        articleDateString = parsedDate.toLocaleDateString('en-GB', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                    }
                }

                // Position-based category: first 5 are "Top Stories", rest are "News"
                const category = articleCountInDigest <= TOP_STORIES_LIMIT ? 'Top Stories' : 'News';

                articles.push({
                    title,
                    source: source,
                    url: url.trim(),
                    summary: summary.trim(),
                    category: category,
                    date: articleDate,
                    dateString: articleDateString,
                    filename: filename,
                    tags: tags,
                    time: articleDateString,
                    imageUrl: null,
                    isNoNews: false
                });

                this.sources.add(source);
            }
        }

        this.dates.add(dateString);
        return articles;
    }

    isJunkItem(title, url) {
        const junkTitles = [
            'Browse Business',
            'Browse Sustainability',
            'Sponsored Content',
            'View All Latest',
            'Momentum AI',
            'Final 2 days to save up to $500 on your TechCrunch Disrupt 2026 ticket'
        ];

        const junkUrlPatterns = [
            /\/business\/?$/,
            /\/sustainability\/?$/,
            /\/sponsored\/?$/,
            /events\.reutersevents\.com/,
            /artificial-intelligence-news\/?$/,
            /techcrunch\.com\/\d{4}\/\d{2}\/\d{2}\/.*disrupt.*ticket/i
        ];

        if (junkTitles.some(t => title.includes(t))) return true;
        if (junkUrlPatterns.some(p => p.test(url))) return true;

        return false;
    }

    generateTags(title) {
        const cleanedTitle = this.fixCommonEncoding(title);
        const tagPatterns = {
            agents: /\b(agent|agents|agentic)\b/i,
            models: /\b(gpt|claude|gemini|llama|mistral|model|llm|foundation)\b/i,
            research: /\b(research|paper|study|breakthrough|discover)\b/i,
            funding: /\b(raises|funding|invest|valuation|series [a-c]|million|billion|\$\d+[mb])\b/i,
            product: /\b(launch|release|announce|feature|update|new|beta)\b/i,
            enterprise: /\b(enterprise|business|company|corporate|b2b)\b/i,
            'open-source': /\b(open source|open-source|opensource|github|hugging face)\b/i,
            safety: /\b(safety|alignment|ethics|regulation|govern|policy)\b/i,
            robotics: /\b(robot|robotics|hardware|humanoid|physical)\b/i,
            vision: /\b(image|video|vision|multimodal|visual)\b/i,
            voice: /\b(voice|speech|audio|sound|music)\b/i,
            coding: /\b(code|coding|developer|programming|github copilot)\b/i,
            healthcare: /\b(health|medical|doctor|patient|diagnos)\b/i,
            regulation: /\b(law|lawsuit|legal|court|regulation|regulator|policy)\b/i,
            infrastructure: /\b(compute|gpu|data center|datacentre|infrastructure|chip|chips|semiconductor)\b/i,
            startups: /\b(startup|startups|founder|venture)\b/i
        };

        const tags = ['ai'];
        for (const [tag, pattern] of Object.entries(tagPatterns)) {
            if (pattern.test(cleanedTitle)) {
                tags.push(tag);
            }
        }

        const uniqueTags = Array.from(new Set(tags));
        if (uniqueTags.length === 1) uniqueTags.push('news');
        return uniqueTags.slice(0, 5);
    }

    extractSource(url) {
        if (!url) return 'Unknown';

        try {
            const hostname = new URL(url).hostname.toLowerCase();

            const sourceMap = {
                'techcrunch.com': 'TechCrunch',
                'theinformation.com': 'The Information',
                'reuters.com': 'Reuters',
                'wsj.com': 'Wall Street Journal',
                'bloomberg.com': 'Bloomberg',
                'theguardian.com': 'The Guardian',
                'nytimes.com': 'New York Times',
                'bbc.com': 'BBC',
                'bbc.co.uk': 'BBC',
                'nature.com': 'Nature',
                'mit.edu': 'MIT News',
                'stanford.edu': 'Stanford HAI',
                'wired.com': 'Wired',
                'economist.com': 'The Economist',
                'ft.com': 'Financial Times',
                'theatlantic.com': 'The Atlantic',
                'technologyreview.com': 'MIT Technology Review',
                'hbr.org': 'Harvard Business Review',
                'newscientist.com': 'New Scientist',
                'arstechnica.com': 'Ars Technica',
                'theverge.com': 'The Verge',
                'venturebeat.com': 'VentureBeat',
                'anthropic.com': 'Anthropic',
                'openai.com': 'OpenAI',
                'deepmind.com': 'DeepMind'
            };

            for (const [domain, name] of Object.entries(sourceMap)) {
                if (hostname.includes(domain)) {
                    return name;
                }
            }

            // Extract domain name as fallback
            return hostname.replace('www.', '').split('.')[0];
        } catch {
            return 'Unknown';
        }
    }

    populateFilters() {
        const archivePicker = document.getElementById('archivePicker');

        if (!archivePicker) return;

        const months = new Set(Array.from(this.dates).map(d => {
            const dt = new Date(d);
            return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        }));

        archivePicker.innerHTML = '<option value="">All months</option>';
        Array.from(months).sort().reverse().forEach(m => {
            const option = document.createElement('option');
            option.value = m;
            const [year, month] = m.split('-');
            option.textContent = new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
            archivePicker.appendChild(option);
        });
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const fromDate = document.getElementById('fromDate');
        const toDate = document.getElementById('toDate');
        const archivePicker = document.getElementById('archivePicker');
        const quick24h = document.getElementById('quick24h');
        const quickLastWeek = document.getElementById('quickLastWeek');
        const quickAll = document.getElementById('quickAll');
        const highlightOnly = document.getElementById('highlightOnly');
        const hideNotAI = document.getElementById('hideNotAI');

        if (searchInput) searchInput.addEventListener('input', () => this.filterArticles());
        if (fromDate) fromDate.addEventListener('change', () => {
            this.updateQuickFilterButtons();
            this.filterArticles();
        });
        if (toDate) toDate.addEventListener('change', () => {
            this.updateQuickFilterButtons();
            this.filterArticles();
        });
        if (archivePicker) archivePicker.addEventListener('change', () => this.filterArticles());
        if (highlightOnly) highlightOnly.addEventListener('change', () => this.filterArticles());
        if (hideNotAI) hideNotAI.addEventListener('change', () => this.filterArticles());

        if (quick24h) quick24h.addEventListener('click', () => {
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            if (fromDate) fromDate.value = yesterday.toISOString().split('T')[0];
            if (toDate) toDate.value = today.toISOString().split('T')[0];
            if (archivePicker) archivePicker.value = '';
            this.updateQuickFilterButtons('24h');
            this.filterArticles();
        });

        if (quickLastWeek) quickLastWeek.addEventListener('click', () => {
            const today = new Date();
            const lastWeek = new Date();
            lastWeek.setDate(today.getDate() - 7);
            if (fromDate) fromDate.value = lastWeek.toISOString().split('T')[0];
            if (toDate) toDate.value = today.toISOString().split('T')[0];
            if (archivePicker) archivePicker.value = '';
            this.updateQuickFilterButtons('week');
            this.filterArticles();
        });

        if (quickAll) quickAll.addEventListener('click', () => {
            if (fromDate) fromDate.value = '';
            if (toDate) toDate.value = '';
            if (archivePicker) archivePicker.value = '';
            this.updateQuickFilterButtons('all');
            this.filterArticles();
        });

        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (fromDate) fromDate.value = '';
            if (toDate) toDate.value = '';
            if (archivePicker) archivePicker.value = '';
            if (highlightOnly) highlightOnly.checked = false;
            if (hideNotAI) hideNotAI.checked = false;
            this.updateQuickFilterButtons('all');
            this.filterArticles();
        });
    }

    updateQuickFilterButtons(active = null) {
        const quick24h = document.getElementById('quick24h');
        const quickLastWeek = document.getElementById('quickLastWeek');
        const quickAll = document.getElementById('quickAll');

        if (quick24h) quick24h.classList.remove('active');
        if (quickLastWeek) quickLastWeek.classList.remove('active');
        if (quickAll) quickAll.classList.remove('active');

        if (active === '24h' && quick24h) {
            quick24h.classList.add('active');
        } else if (active === 'week' && quickLastWeek) {
            quickLastWeek.classList.add('active');
        } else if (active === 'all' && quickAll) {
            quickAll.classList.add('active');
        }
    }

    filterArticles() {
        const searchInput = document.getElementById('searchInput');
        const fromDateEl = document.getElementById('fromDate');
        const toDateEl = document.getElementById('toDate');
        const archiveEl = document.getElementById('archivePicker');
        const highlightOnlyEl = document.getElementById('highlightOnly');
        const hideNotAIEl = document.getElementById('hideNotAI');

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const fromDate = fromDateEl ? fromDateEl.value : '';
        const toDate = toDateEl ? toDateEl.value : '';
        const archive = archiveEl ? archiveEl.value : '';
        const highlightOnly = highlightOnlyEl ? highlightOnlyEl.checked : false;
        const hideNotAI = hideNotAIEl ? hideNotAIEl.checked : false;
        this.filteredArticles = this.articles.filter(article => {
            const articleDate = new Date(article.date);

            const matchesSearch = !searchTerm ||
                article.title.toLowerCase().includes(searchTerm) ||
                article.summary.toLowerCase().includes(searchTerm) ||
                article.source.toLowerCase().includes(searchTerm);

            let matchesRange = true;
            if (fromDate) {
                const fromDateValue = new Date(fromDate);
                fromDateValue.setHours(0, 0, 0, 0);
                matchesRange = matchesRange && articleDate >= fromDateValue;
            }
            if (toDate) {
                const toDateValue = new Date(toDate);
                toDateValue.setHours(23, 59, 59, 999);
                matchesRange = matchesRange && articleDate <= toDateValue;
            }

            let matchesArchive = true;
            if (archive) {
                const [year, month] = archive.split('-');
                matchesArchive = articleDate.getFullYear() === parseInt(year) && (articleDate.getMonth() + 1) === parseInt(month);
            }

            const isFavorite = this.favorites.has(article.title);
            const flaggedNotAI = (this.flags[article.title] || []).includes('not-ai');

            return matchesSearch && matchesRange && matchesArchive && !article.isNoNews &&
                (!highlightOnly || isFavorite) && !(hideNotAI && flaggedNotAI);
        });

        this.updateFilterSummary();
        this.displayArticles();
    }

    updateFilterSummary() {
        const searchInput = document.getElementById('searchInput');
        const fromDateEl = document.getElementById('fromDate');
        const toDateEl = document.getElementById('toDate');
        const archiveEl = document.getElementById('archivePicker');
        const highlightOnlyEl = document.getElementById('highlightOnly');
        const hideNotAIEl = document.getElementById('hideNotAI');

        const searchTerm = searchInput ? searchInput.value : '';
        const fromDate = fromDateEl ? fromDateEl.value : '';
        const toDate = toDateEl ? toDateEl.value : '';
        const archive = archiveEl ? archiveEl.value : '';
        const highlightOnly = highlightOnlyEl ? highlightOnlyEl.checked : false;
        const hideNotAI = hideNotAIEl ? hideNotAIEl.checked : false;
        const filterSummary = document.getElementById('filterSummary');
        const filterSummaryText = document.getElementById('filterSummaryText');
        const filters = [];

        if (searchTerm) filters.push(`Search: "${searchTerm}"`);

        if (fromDate && toDate) {
            if (fromDate === toDate) {
                filters.push(`Date: ${new Date(fromDate).toLocaleDateString('en-GB')}`);
            } else {
                filters.push(`Date: ${new Date(fromDate).toLocaleDateString('en-GB')} - ${new Date(toDate).toLocaleDateString('en-GB')}`);
            }
        } else if (fromDate) {
            filters.push(`From: ${new Date(fromDate).toLocaleDateString('en-GB')}`);
        } else if (toDate) {
            filters.push(`Until: ${new Date(toDate).toLocaleDateString('en-GB')}`);
        }

        if (archive) {
            const [year, month] = archive.split('-');
            const monthName = new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
            filters.push(`Archive: ${monthName}`);
        }

        if (highlightOnly) filters.push('Highlights only');
        if (hideNotAI) filters.push('Hide "Not AI"');

        if (filterSummary && filterSummaryText) {
            if (filters.length > 0) {
                filterSummaryText.textContent = `Showing ${this.filteredArticles.length} articles - ${filters.join(' - ')}`;
                filterSummary.style.display = 'block';
            } else {
                filterSummaryText.textContent = `Showing ${this.filteredArticles.length} articles`;
                filterSummary.style.display = this.filteredArticles.length > 0 ? 'block' : 'none';
            }
        }
    }

    getRelativeDateLabel(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const parts = dateString.match(/(\d+)\s+(\w+)\s+(\d+)/);
        if (parts) {
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const day = parseInt(parts[1], 10);
            const month = months.indexOf(parts[2]);
            const year = parseInt(parts[3], 10);
            const articleDate = new Date(year, month, day);

            if (articleDate.getTime() === today.getTime()) return 'Today';
            if (articleDate.getTime() === yesterday.getTime()) return 'Yesterday';
        }

        return dateString;
    }

    renderFeaturedNow() {
        const featuredTitle = document.getElementById('featuredNowTitle');
        const featuredIntro = document.getElementById('featuredNowIntro');
        const featuredList = document.getElementById('featuredNowList');

        if (!featuredTitle || !featuredIntro || !featuredList) return;

        const featuredArticles = this.articles.slice(0, 4);
        if (!featuredArticles.length) {
            featuredTitle.textContent = 'No featured stories available yet';
            featuredIntro.textContent = 'The archive is waiting for the next refresh.';
            featuredList.innerHTML = '';
            return;
        }

        const latestLabel = this.getRelativeDateLabel(featuredArticles[0].dateString);
        featuredTitle.textContent = `Start with ${latestLabel.toLowerCase()}'s biggest stories`;
        featuredIntro.textContent = 'A quick top rail for the links most worth opening first.';
        featuredList.innerHTML = featuredArticles.map((article) => `
            <a href="${article.url}" class="news-featured-link" target="_blank" rel="noopener noreferrer">
                <strong>${article.title}</strong>
            </a>
        `).join('');
    }

    displayArticles() {
        const highlightOnlyEl = document.getElementById('highlightOnly');
        const highlightOnly = highlightOnlyEl ? highlightOnlyEl.checked : false;
        const favoriteArticles = this.filteredArticles.filter(a => this.favorites.has(a.title));
        const remainingArticles = this.filteredArticles.filter(a => !this.favorites.has(a.title));

        const favSection = document.getElementById('favoriteNews');
        const favGrid = document.getElementById('favoriteGrid');
        if (favSection && favGrid) {
            if (favoriteArticles.length > 0) {
                favSection.style.display = 'grid';
                favGrid.innerHTML = '';
                favoriteArticles.forEach(article => {
                    favGrid.appendChild(this.createArticleCard(article, false, true));
                });
            } else {
                favSection.style.display = 'none';
            }
        }

        const todaysSection = document.getElementById('todaysNews');
        const todaysGrid = document.getElementById('todaysGrid');
        const todaysLabel = document.getElementById('todaysNewsLabel');
        const allSection = document.getElementById('allNews');
        const allGrid = document.getElementById('allGrid');
        const noResults = document.getElementById('noResults');

        if (highlightOnly) {
            if (todaysSection) todaysSection.style.display = 'none';
            if (allSection) allSection.style.display = 'none';
            if (noResults) noResults.style.display = favoriteArticles.length ? 'none' : 'block';
            return;
        }

        if (!remainingArticles.length) {
            if (todaysSection) todaysSection.style.display = 'none';
            if (allSection) allSection.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';

        const leadDate = remainingArticles[0].dateString;
        const leadArticles = remainingArticles.filter((article) => article.dateString === leadDate).slice(0, 4);
        const leadTitles = new Set(leadArticles.map((article) => article.title));
        const archiveArticles = remainingArticles.filter((article) => !leadTitles.has(article.title));

        if (todaysSection && todaysGrid) {
            todaysSection.style.display = leadArticles.length > 0 ? 'grid' : 'none';
            todaysGrid.innerHTML = '';
            leadArticles.forEach((article) => {
                todaysGrid.appendChild(this.createArticleCard(article, true));
            });
            if (todaysLabel) {
                todaysLabel.textContent = `Freshly filed under ${this.getRelativeDateLabel(leadDate)}`;
            }
        }

        if (allSection && allGrid) {
            allSection.style.display = archiveArticles.length > 0 ? 'grid' : 'none';
            allGrid.innerHTML = '';

            const groups = {};
            archiveArticles.forEach((article) => {
                groups[article.dateString] = groups[article.dateString] || [];
                groups[article.dateString].push(article);
            });

            const sortedDates = Object.keys(groups).sort((a, b) => {
                const parseDate = (dateString) => {
                    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
                    const parts = dateString.match(/(\d+)\s+(\w+)\s+(\d+)/);
                    if (!parts) return new Date(0);
                    return new Date(parseInt(parts[3], 10), months.indexOf(parts[2]), parseInt(parts[1], 10));
                };
                return parseDate(b) - parseDate(a);
            });

            sortedDates.forEach((date) => {
                const heading = document.createElement('h3');
                heading.className = 'group-title';
                heading.textContent = this.getRelativeDateLabel(date);
                allGrid.appendChild(heading);
                const group = document.createElement('div');
                group.className = 'news-grid';
                groups[date].forEach((article) => group.appendChild(this.createArticleCard(article, false)));
                allGrid.appendChild(group);
            });
        }
    }

    createArticleCard(article, isToday, isFavorite = false) {
        const card = document.createElement('article');
        card.className = `news-card ${isToday ? 'today' : ''} ${article.isNoNews ? 'no-news' : ''} ${isFavorite ? 'highlight' : ''}`;

        const tagsHtml = article.tags && article.tags.length > 0
            ? `<div class="tag-list">${article.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
            : '';

        card.innerHTML = `
            <div class="card-content">
                <div class="card-header">
                    <span class="card-date">${article.dateString}</span>
                </div>
                <div class="card-actions">
                    <button class="news-action-btn flag-btn" type="button">Report</button>
                    <button class="news-action-btn fav-btn ${isFavorite ? 'active' : ''}" type="button">${isFavorite ? 'Saved' : 'Save'}</button>
                </div>
                <h3 class="card-title">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                        ${article.title}
                    </a>
                </h3>
                ${article.summary ? `<p class="card-summary">${article.summary.slice(0, 180)}${article.summary.length > 180 ? '...' : ''}</p>` : ''}
                <div class="card-meta">
                    <span class="card-time">${article.category || 'News'}</span>
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="external-link">
                        Open story
                    </a>
                </div>
                ${tagsHtml}
            </div>
        `;

        const flagBtn = card.querySelector('.flag-btn');
        const favBtn = card.querySelector('.fav-btn');

        if (flagBtn) {
            flagBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showFlagMenu(article);
            });
        }

        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(article);
            });
        }

        return card;
    }

    toggleFavorite(article) {
        if (this.favorites.has(article.title)) {
            this.favorites.delete(article.title);
        } else {
            this.favorites.add(article.title);
        }
        localStorage.setItem('news-favorites', JSON.stringify(Array.from(this.favorites)));
        this.displayArticles();
    }

    showFlagMenu(article) {
        const choice = prompt('Report this article:\n1) Not AI\n2) Duplicate');
        if (choice === '1') {
            this.reportArticle(article, 'not-ai');
        } else if (choice === '2') {
            this.showDuplicateDialog(article);
        }
    }

    reportArticle(article, reason) {
        this.flags[article.title] = this.flags[article.title] || [];
        if (!this.flags[article.title].includes(reason)) {
            this.flags[article.title].push(reason);
            localStorage.setItem('news-flags', JSON.stringify(this.flags));
        }
        alert(`Reported "${article.title}" as ${reason}`);
        this.filterArticles();
    }

    showDuplicateDialog(article) {
        const dialog = document.getElementById('duplicateDialog');
        const searchInput = document.getElementById('duplicateSearch');
        const results = document.getElementById('duplicateResults');
        const closeBtn = document.getElementById('closeDuplicateDialog');

        if (!dialog || !searchInput || !results || !closeBtn) return;

        dialog.style.display = 'flex';
        searchInput.value = '';
        results.innerHTML = '';

        const updateResults = () => {
            const term = searchInput.value.toLowerCase();
            const matches = this.articles.filter(a => a !== article && a.title.toLowerCase().includes(term));
            results.innerHTML = matches.slice(0, 10).map(m => `<li>${m.title}</li>`).join('');
        };
        searchInput.addEventListener('input', updateResults);
        updateResults();

        const close = () => {
            dialog.style.display = 'none';
            searchInput.removeEventListener('input', updateResults);
            closeBtn.removeEventListener('click', close);
        };
        closeBtn.addEventListener('click', close);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewsApp();
});

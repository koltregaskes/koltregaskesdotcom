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
        this.displayArticles();
    }

    async loadArticles() {
        // Generate file list for digests (YYYY-MM-DD-digest.md format)
        const fileList = this.generateFileList();

        for (const filename of fileList) {
            try {
                const response = await fetch(`../news-digests/${filename}`);
                if (response.ok) {
                    const content = await response.text();
                    const articles = this.parseDigest(content, filename);
                    this.articles.push(...articles);
                }
            } catch (error) {
                console.log(`Could not load ${filename}:`, error);
            }
        }

        // Sort articles by date (newest first)
        this.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.filteredArticles = [...this.articles];

        // Populate filter options
        this.populateFilters();

        // Hide loading
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    generateFileList() {
        const files = [];
        const today = new Date();

        // Generate files for the last 90 days
        for (let i = 0; i < 90; i++) {
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
        let currentCategory = 'Top Stories';

        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect category headers (## Top Stories, ## Research, etc.)
            const categoryMatch = line.match(/^##\s+(.+)$/);
            if (categoryMatch) {
                currentCategory = categoryMatch[1].trim();
                continue;
            }

            // Parse news items: - **Title** ([Source](URL)) _date_
            const itemMatch = line.match(/^-\s+\*\*(.+?)\*\*\s+\(\[(.+?)\]\((.+?)\)\)(?:\s+_(.+?)_)?$/);
            if (itemMatch) {
                const [, title, sourceName, url, itemDate] = itemMatch;

                // Get summary from next line(s) - indented text
                let summary = '';
                let j = i + 1;
                while (j < lines.length && lines[j].match(/^\s{2,}/)) {
                    summary += lines[j].trim() + ' ';
                    j++;
                }

                // Skip navigation/junk items
                if (this.isJunkItem(title, url)) {
                    continue;
                }

                // Extract source from URL if not provided
                const source = sourceName.trim() || this.extractSource(url);

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

                articles.push({
                    title: title.trim(),
                    source: source,
                    url: url.trim(),
                    summary: summary.trim(),
                    category: currentCategory,
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
            'Momentum AI'
        ];

        const junkUrlPatterns = [
            /\/business\/?$/,
            /\/sustainability\/?$/,
            /\/sponsored\/?$/,
            /events\.reutersevents\.com/,
            /artificial-intelligence-news\/?$/
        ];

        if (junkTitles.some(t => title.includes(t))) return true;
        if (junkUrlPatterns.some(p => p.test(url))) return true;

        return false;
    }

    generateTags(title) {
        const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'google', 'microsoft', 'meta', 'nvidia', 'robot', 'agent', 'chatbot'];

        const words = title.toLowerCase()
            .replace(/[^a-z0-9 ]/g, '')
            .split(' ')
            .filter(w => w.length > 2);

        const tags = words.filter(w => aiKeywords.some(k => w.includes(k) || k.includes(w)));

        // Add first few unique words as tags if no AI keywords found
        if (tags.length === 0) {
            return words.slice(0, 3);
        }

        return [...new Set(tags)].slice(0, 5);
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
        const sourceContainer = document.getElementById('sourceCheckboxes');
        const archivePicker = document.getElementById('archivePicker');

        if (!sourceContainer || !archivePicker) return;

        const sortedSources = Array.from(this.sources).sort();
        sourceContainer.innerHTML = '';
        sortedSources.forEach(source => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${source}" checked> ${source}`;
            sourceContainer.appendChild(label);
        });

        const months = new Set(Array.from(this.dates).map(d => {
            const dt = new Date(d);
            return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        }));

        archivePicker.innerHTML = '<option value="">All Months</option>';
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
        const sourceContainer = document.getElementById('sourceCheckboxes');
        const archivePicker = document.getElementById('archivePicker');
        const quick24h = document.getElementById('quick24h');
        const quickLastWeek = document.getElementById('quickLastWeek');
        const quickAll = document.getElementById('quickAll');
        const groupBy = document.getElementById('groupBy');
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
        if (sourceContainer) sourceContainer.addEventListener('change', () => this.filterArticles());
        if (archivePicker) archivePicker.addEventListener('change', () => this.filterArticles());
        if (groupBy) groupBy.addEventListener('change', () => this.displayArticles());
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

            document.querySelectorAll('#sourceCheckboxes input').forEach(cb => cb.checked = true);

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
        const selectedSources = Array.from(document.querySelectorAll('#sourceCheckboxes input:checked')).map(i => i.value);

        this.filteredArticles = this.articles.filter(article => {
            const articleDate = new Date(article.date);

            const matchesSearch = !searchTerm ||
                article.title.toLowerCase().includes(searchTerm) ||
                article.summary.toLowerCase().includes(searchTerm) ||
                article.source.toLowerCase().includes(searchTerm);

            let matchesRange = true;
            if (fromDate) matchesRange = matchesRange && articleDate >= new Date(fromDate);
            if (toDate) matchesRange = matchesRange && articleDate <= new Date(toDate);

            let matchesArchive = true;
            if (archive) {
                const [year, month] = archive.split('-');
                matchesArchive = articleDate.getFullYear() === parseInt(year) && (articleDate.getMonth() + 1) === parseInt(month);
            }

            const matchesSource = selectedSources.length === 0 || selectedSources.includes(article.source);
            const isFavorite = this.favorites.has(article.title);
            const flaggedNotAI = (this.flags[article.title] || []).includes('not-ai');

            return matchesSearch && matchesRange && matchesArchive && matchesSource && !article.isNoNews &&
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
        const selectedSources = Array.from(document.querySelectorAll('#sourceCheckboxes input:checked')).map(i => i.value);
        const totalSources = Array.from(document.querySelectorAll('#sourceCheckboxes input')).length;

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

        if (selectedSources.length < totalSources && selectedSources.length > 0) {
            if (selectedSources.length <= 3) {
                filters.push(`Sources: ${selectedSources.join(', ')}`);
            } else {
                filters.push(`Sources: ${selectedSources.length} selected`);
            }
        } else if (selectedSources.length === 0) {
            filters.push('No sources selected');
        }

        if (highlightOnly) filters.push('Highlights only');
        if (hideNotAI) filters.push('Hide "Not AI"');

        if (filterSummary && filterSummaryText) {
            if (filters.length > 0) {
                filterSummaryText.textContent = `Showing ${this.filteredArticles.length} articles • ${filters.join(' • ')}`;
                filterSummary.style.display = 'block';
            } else {
                filterSummaryText.textContent = `Showing ${this.filteredArticles.length} articles`;
                filterSummary.style.display = this.filteredArticles.length > 0 ? 'block' : 'none';
            }
        }
    }

    displayArticles() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const highlightOnlyEl = document.getElementById('highlightOnly');
        const highlightOnly = highlightOnlyEl ? highlightOnlyEl.checked : false;
        const groupByEl = document.getElementById('groupBy');
        const groupBy = groupByEl ? groupByEl.value : 'none';
        const favoriteArticles = this.filteredArticles.filter(a => this.favorites.has(a.title));
        const remainingArticles = this.filteredArticles.filter(a => !this.favorites.has(a.title));

        const todaysArticles = remainingArticles.filter(article => {
            const articleDate = new Date(article.date);
            articleDate.setHours(0, 0, 0, 0);
            return articleDate.getTime() === today.getTime();
        });

        const otherArticles = remainingArticles.filter(article => {
            const articleDate = new Date(article.date);
            articleDate.setHours(0, 0, 0, 0);
            return articleDate.getTime() !== today.getTime();
        });

        // Display highlighted favorites
        const favSection = document.getElementById('favoriteNews');
        const favGrid = document.getElementById('favoriteGrid');

        if (favSection && favGrid) {
            if (favoriteArticles.length > 0) {
                favSection.style.display = 'block';
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
        const allSection = document.getElementById('allNews');
        const allGrid = document.getElementById('allGrid');
        const noResults = document.getElementById('noResults');

        if (highlightOnly) {
            if (favSection) favSection.style.display = favoriteArticles.length > 0 ? 'block' : 'none';
            if (allSection) allSection.style.display = 'none';
            if (todaysSection) todaysSection.style.display = 'none';
            if (favGrid) {
                favGrid.innerHTML = '';
                favoriteArticles.forEach(a => favGrid.appendChild(this.createArticleCard(a, false, true)));
            }
            if (noResults) noResults.style.display = favoriteArticles.length ? 'none' : 'block';
            return;
        }

        // Display today's news
        if (todaysSection && todaysGrid) {
            if (todaysArticles.length > 0) {
                todaysSection.style.display = 'block';
                todaysGrid.innerHTML = '';
                todaysArticles.forEach(article => {
                    todaysGrid.appendChild(this.createArticleCard(article, true));
                });
            } else {
                todaysSection.style.display = 'none';
            }
        }

        // Display all news
        if (allSection && allGrid) {
            if (otherArticles.length > 0 || todaysArticles.length === 0) {
                allSection.style.display = 'block';
                if (noResults) noResults.style.display = 'none';

                allGrid.innerHTML = '';

                const articlesToShow = todaysArticles.length === 0 ? remainingArticles : otherArticles;

                if (groupBy === 'source') {
                    const groups = {};
                    articlesToShow.forEach(a => {
                        groups[a.source] = groups[a.source] || [];
                        groups[a.source].push(a);
                    });
                    Object.keys(groups).sort().forEach(src => {
                        const h = document.createElement('h3');
                        h.className = 'group-title';
                        h.textContent = src;
                        allGrid.appendChild(h);
                        const g = document.createElement('div');
                        g.className = 'news-grid';
                        groups[src].forEach(a => g.appendChild(this.createArticleCard(a, false)));
                        allGrid.appendChild(g);
                    });
                } else if (groupBy === 'date') {
                    const groups = {};
                    articlesToShow.forEach(a => {
                        groups[a.dateString] = groups[a.dateString] || [];
                        groups[a.dateString].push(a);
                    });
                    Object.keys(groups).forEach(date => {
                        const h = document.createElement('h3');
                        h.className = 'group-title';
                        h.textContent = date;
                        allGrid.appendChild(h);
                        const g = document.createElement('div');
                        g.className = 'news-grid';
                        groups[date].forEach(a => g.appendChild(this.createArticleCard(a, false)));
                        allGrid.appendChild(g);
                    });
                } else {
                    articlesToShow.forEach(article => {
                        allGrid.appendChild(this.createArticleCard(article, false));
                    });
                }
            } else {
                allSection.style.display = 'none';
            }

            if (noResults && this.filteredArticles.length === 0) {
                noResults.style.display = 'block';
            }
        }
    }

    createArticleCard(article, isToday, isFavorite = false) {
        const card = document.createElement('div');
        card.className = `news-card ${isToday ? 'today' : ''} ${article.isNoNews ? 'no-news' : ''} ${isFavorite ? 'highlight' : ''}`;

        const tagsHtml = article.tags && article.tags.length > 0
            ? `<div class="tag-list">${article.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
            : '';

        card.innerHTML = `
            <div class="card-content">
                <div class="card-header">
                    <span class="card-date">${article.dateString}</span>
                    <span class="card-source">${article.source}</span>
                </div>
                <div class="card-actions">
                    <button class="flag-btn" title="Report"><i class="fas fa-flag"></i></button>
                    <button class="fav-btn ${isFavorite ? 'active' : ''}" title="Highlight">${isFavorite ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'}</button>
                </div>
                <h3 class="card-title">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                        ${article.title}
                    </a>
                </h3>
                ${article.summary ? `<p class="card-summary">${article.summary.slice(0, 150)}${article.summary.length > 150 ? '...' : ''}</p>` : ''}
                <div class="card-meta">
                    <span class="card-time">
                        <i class="fas fa-clock"></i>
                        ${article.category || 'News'}
                    </span>
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="external-link">
                        Read more <i class="fas fa-external-link-alt"></i>
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

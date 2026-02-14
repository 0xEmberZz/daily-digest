// ============================================================
// Theme
// ============================================================

function getTheme() {
    const s = localStorage.getItem('theme');
    if (s) return s;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
}

setTheme(getTheme());

// ============================================================
// State
// ============================================================

let archiveIndex = [];  // sorted dates, newest first
let currentDate = null;

// ============================================================
// Lobe Icons
// ============================================================

const LOBE_CDN = 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons';

const BRANDS = {
    'openai': 'openai', 'gpt': 'openai', 'chatgpt': 'openai', 'codex': 'openai',
    'anthropic': 'anthropic', 'claude': 'claude',
    'google': 'google', 'gemini': 'gemini',
    'meta': 'meta', 'llama': 'meta',
    'mistral': 'mistral', 'apple': 'apple', 'siri': 'apple',
    'microsoft': 'microsoft', 'github': 'github', 'copilot': 'github-copilot',
    'hugging face': 'huggingface', 'huggingface': 'huggingface',
    'stability': 'stability-ai', 'midjourney': 'midjourney',
    'perplexity': 'perplexity', 'cohere': 'cohere',
    'deepseek': 'deepseek', 'groq': 'groq',
    'vercel': 'vercel', 'cerebras': 'cerebras',
};

function injectBrandIcons(el) {
    el.querySelectorAll('p, h2, h3').forEach(node => {
        const text = node.textContent.toLowerCase();
        for (const [kw, icon] of Object.entries(BRANDS)) {
            if (text.includes(kw) && !node.querySelector('.brand-icon')) {
                const img = document.createElement('img');
                img.src = `${LOBE_CDN}/${icon}.svg`;
                img.alt = kw;
                img.className = 'brand-icon' + (node.matches('h2,h3') ? ' brand-icon-heading' : '');
                img.width = node.matches('h2,h3') ? 20 : 18;
                img.height = img.width;
                img.loading = 'lazy';
                img.onerror = () => img.remove();
                node.insertBefore(img, node.firstChild);
                break;
            }
        }
    });
}

// ============================================================
// Date Navigation
// ============================================================

async function loadArchiveIndex() {
    try {
        const res = await fetch('./digests/index.json');
        if (!res.ok) return [];
        const data = await res.json();
        return (data.dates || []).sort().reverse(); // newest first
    } catch {
        return [];
    }
}

function formatDateDisplay(dateStr) {
    // "2026-02-15" → "Feb 15"
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
}

function updateDateNav() {
    const prevBtn = document.getElementById('date-prev');
    const nextBtn = document.getElementById('date-next');
    const display = document.getElementById('date-current');

    if (!display || archiveIndex.length === 0) return;

    const idx = archiveIndex.indexOf(currentDate);

    display.textContent = formatDateDisplay(currentDate);
    display.title = currentDate;

    // prev = older = higher index
    if (prevBtn) prevBtn.disabled = idx >= archiveIndex.length - 1;
    // next = newer = lower index
    if (nextBtn) nextBtn.disabled = idx <= 0;
}

function navigateDate(direction) {
    const idx = archiveIndex.indexOf(currentDate);
    const newIdx = direction === 'prev' ? idx + 1 : idx - 1;

    if (newIdx >= 0 && newIdx < archiveIndex.length) {
        currentDate = archiveIndex[newIdx];
        updateDateNav();
        loadDigestByDate(currentDate);
    }
}

// ============================================================
// TOC
// ============================================================

function buildTOC(contentEl) {
    const headings = contentEl.querySelectorAll('h2, h3');
    const tocNav = document.getElementById('toc-nav');
    if (!tocNav || headings.length === 0) return [];

    // Clear old TOC items (keep indicator)
    tocNav.querySelectorAll('a').forEach(a => a.remove());

    const items = [];

    headings.forEach((h, i) => {
        if (!h.id) h.id = 'section-' + i;

        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent.trim();
        a.className = h.tagName === 'H3' ? 'toc-h3' : '';
        a.dataset.target = h.id;

        a.addEventListener('click', (e) => {
            e.preventDefault();
            h.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeTOC();
            history.replaceState(null, '', '#' + h.id);
        });

        tocNav.appendChild(a);
        items.push({ el: h, link: a });
    });

    return items;
}

function setupTOCTracking(items) {
    if (items.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                items.forEach(item => {
                    item.link.classList.toggle('active', item.el.id === id);
                });
            }
        });
    }, {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
    });

    items.forEach(item => observer.observe(item.el));

    // Store observer for cleanup
    window._tocObserver = observer;
}

function cleanupTOC() {
    if (window._tocObserver) {
        window._tocObserver.disconnect();
        window._tocObserver = null;
    }
}

// ============================================================
// TOC mobile
// ============================================================

function openTOC() {
    document.getElementById('toc')?.classList.add('open');
    document.getElementById('toc-backdrop')?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeTOC() {
    document.getElementById('toc')?.classList.remove('open');
    document.getElementById('toc-backdrop')?.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================================
// Reading Progress
// ============================================================

function setupProgress() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;

    const update = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = pct + '%';
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
}

// ============================================================
// Back to Top
// ============================================================

function setupBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================================
// Reading Time
// ============================================================

function calcReadingTime(text) {
    const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const english = text.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(Boolean).length;
    return Math.ceil(chinese / 400 + english / 200);
}

// ============================================================
// Post-process: Stats bar, category pills, pick cards
// ============================================================

function postProcessContent(contentEl) {
    // 1. Stats bar — convert data attributes to visual cards
    const statsBar = contentEl.querySelector('.stats-bar');
    if (statsBar) {
        const sources = statsBar.dataset.sources || '0/0';
        const articles = statsBar.dataset.articles || '0';
        const filtered = statsBar.dataset.filtered || '0';
        const hours = statsBar.dataset.hours || '48';
        const selected = statsBar.dataset.selected || '0';

        statsBar.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${sources}</div>
                <div class="stat-label">Sources</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${articles}</div>
                <div class="stat-label">Articles</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${hours}<span class="stat-unit">h</span></div>
                <div class="stat-label">Time Range</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${selected}</div>
                <div class="stat-label">Selected</div>
            </div>
        `;
    }

    // 2. Category pills
    const catEl = contentEl.querySelector('.stats-categories');
    if (catEl) {
        try {
            const cats = JSON.parse(catEl.dataset.categories || '{}');
            const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
            catEl.innerHTML = sorted.map(([label, count]) =>
                `<span class="cat-pill">${label}<span class="cat-count">${count}</span></span>`
            ).join('');
        } catch {}
    }

    // 3. Animate stat cards if Motion available
    const hasMotion = typeof Motion !== 'undefined' && Motion.animate;
    if (hasMotion && statsBar) {
        const cards = statsBar.querySelectorAll('.stat-card');
        cards.forEach((card, i) => {
            card.style.opacity = '0';
            Motion.animate(card,
                { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] },
                { duration: 0.4, easing: [0.32, 0.72, 0, 1], delay: 0.1 + i * 0.06 }
            ).finished.then(() => { card.style.opacity = '1'; });
        });
    }

    // 4. Animate pick cards
    if (hasMotion) {
        const picks = contentEl.querySelectorAll('.pick-card');
        picks.forEach((card, i) => {
            card.style.opacity = '0';
            Motion.animate(card,
                { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0)'] },
                { duration: 0.45, easing: [0.32, 0.72, 0, 1], delay: 0.2 + i * 0.1 }
            ).finished.then(() => { card.style.opacity = '1'; });
        });
    }
}

// ============================================================
// Scroll-reveal (Motion)
// ============================================================

function setupScrollReveal(contentEl) {
    const children = Array.from(contentEl.children);
    let currentSection = null;

    children.forEach(child => {
        if (child.tagName === 'H2') {
            currentSection = document.createElement('div');
            currentSection.className = 'reveal-section';
            child.before(currentSection);
            currentSection.appendChild(child);
        } else if (child.tagName === 'HR' && currentSection) {
            currentSection = null;
        } else if (currentSection) {
            currentSection.appendChild(child);
        }
    });

    const sections = contentEl.querySelectorAll('.reveal-section');
    if (sections.length === 0) return;

    const hasMotion = typeof Motion !== 'undefined' && Motion.animate;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                observer.unobserve(el);

                if (hasMotion) {
                    Motion.animate(el,
                        { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
                        { duration: 0.5, easing: [0.32, 0.72, 0, 1] }
                    );
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                } else {
                    el.classList.add('revealed');
                }
            }
        });
    }, {
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.05,
    });

    sections.forEach(s => observer.observe(s));
}

function animateEntrance(contentEl) {
    const hasMotion = typeof Motion !== 'undefined' && Motion.animate;
    if (!hasMotion) return;

    const h1 = contentEl.querySelector('h1');
    const firstBq = contentEl.querySelector('blockquote');

    if (h1) {
        h1.style.opacity = '0';
        Motion.animate(h1,
            { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
            { duration: 0.55, easing: [0.32, 0.72, 0, 1], delay: 0.05 }
        ).finished.then(() => { h1.style.opacity = '1'; });
    }

    if (firstBq) {
        firstBq.style.opacity = '0';
        Motion.animate(firstBq,
            { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
            { duration: 0.55, easing: [0.32, 0.72, 0, 1], delay: 0.15 }
        ).finished.then(() => { firstBq.style.opacity = '1'; });
    }
}

// ============================================================
// Content transition animation
// ============================================================

function transitionContent(contentEl, renderFn) {
    const hasMotion = typeof Motion !== 'undefined' && Motion.animate;

    if (hasMotion) {
        // Fade out
        Motion.animate(contentEl,
            { opacity: [1, 0], transform: ['translateY(0)', 'translateY(-8px)'] },
            { duration: 0.2, easing: [0.32, 0.72, 0, 1] }
        ).finished.then(() => {
            renderFn();
            // Fade in
            Motion.animate(contentEl,
                { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0)'] },
                { duration: 0.35, easing: [0.32, 0.72, 0, 1] }
            );
        });
    } else {
        renderFn();
    }
}

// ============================================================
// Load Digest
// ============================================================

async function loadDigestByDate(date) {
    const content = document.getElementById('content');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    // Determine file path
    const filePath = date ? `./digests/${date}.md` : './digests/latest.md';

    try {
        const res = await fetch(filePath);
        if (!res.ok) {
            // Fallback to latest
            const fallback = await fetch('./digests/latest.md');
            if (!fallback.ok) throw new Error('No digest available');
            var md = await fallback.text();
        } else {
            var md = await res.text();
        }

        const render = () => {
            marked.setOptions({ gfm: true, breaks: false });
            content.innerHTML = marked.parse(md);

            loading.style.display = 'none';
            content.style.display = 'block';
            error.style.display = 'none';

            // Reading time
            const minutes = calcReadingTime(md);
            const rtEl = document.getElementById('reading-time');
            if (rtEl) rtEl.textContent = `${minutes} min read`;

            // Post-process stats, cards
            postProcessContent(content);

            // Brand icons
            injectBrandIcons(content);

            // TOC (rebuild)
            cleanupTOC();
            const tocItems = buildTOC(content);
            setupTOCTracking(tocItems);

            // Scroll-reveal
            setupScrollReveal(content);

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // If content is already visible, transition; otherwise render directly
        if (content.style.display === 'block') {
            transitionContent(content, render);
        } else {
            render();
            animateEntrance(content);
        }

    } catch (err) {
        console.error('Failed to load digest:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
    }
}

async function initDigest() {
    // Load archive index
    archiveIndex = await loadArchiveIndex();

    // Determine which date to show
    const hash = location.hash.replace('#', '');
    if (hash && archiveIndex.includes(hash)) {
        currentDate = hash;
    } else if (archiveIndex.length > 0) {
        currentDate = archiveIndex[0]; // newest
    } else {
        currentDate = null;
    }

    // Update nav
    updateDateNav();

    // Load
    await loadDigestByDate(currentDate);
}

// ============================================================
// Init
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Theme
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        setTheme(cur === 'dark' ? 'light' : 'dark');
    });

    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) setTheme(e.matches ? 'dark' : 'light');
    });

    // TOC
    document.getElementById('toc-toggle')?.addEventListener('click', openTOC);
    document.getElementById('toc-close')?.addEventListener('click', closeTOC);
    document.getElementById('toc-backdrop')?.addEventListener('click', closeTOC);

    // Date nav
    document.getElementById('date-prev')?.addEventListener('click', () => navigateDate('prev'));
    document.getElementById('date-next')?.addEventListener('click', () => navigateDate('next'));
    document.getElementById('date-current')?.addEventListener('click', () => {
        // Click date to go back to latest
        if (archiveIndex.length > 0) {
            currentDate = archiveIndex[0];
            updateDateNav();
            loadDigestByDate(currentDate);
        }
    });

    // Progress + Back to top
    setupProgress();
    setupBackToTop();

    // Load
    initDigest();
});

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
// TOC Generation
// ============================================================

function buildTOC(contentEl) {
    const headings = contentEl.querySelectorAll('h2, h3');
    const tocNav = document.getElementById('toc-nav');
    if (!tocNav || headings.length === 0) return [];

    const items = [];

    headings.forEach((h, i) => {
        // Ensure heading has an id
        if (!h.id) {
            h.id = 'section-' + i;
        }

        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent.trim();
        a.className = h.tagName === 'H3' ? 'toc-h3' : '';
        a.dataset.target = h.id;

        a.addEventListener('click', (e) => {
            e.preventDefault();
            h.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Close mobile TOC
            closeTOC();
            history.replaceState(null, '', '#' + h.id);
        });

        tocNav.appendChild(a);
        items.push({ el: h, link: a });
    });

    return items;
}

// ============================================================
// TOC Active Tracking
// ============================================================

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
}

// ============================================================
// TOC open/close (mobile)
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
    // Chinese: ~400 chars/min, English: ~200 words/min
    const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const english = text.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(chinese / 400 + english / 200);
    return minutes;
}

// ============================================================
// Scroll-reveal Animations
// ============================================================

function setupScrollReveal(contentEl) {
    // Wrap each section (h2 + content until next h2) in a reveal container
    const children = Array.from(contentEl.children);
    let currentSection = null;

    children.forEach(child => {
        if (child.tagName === 'H2') {
            // Start new section
            currentSection = document.createElement('div');
            currentSection.className = 'reveal-section';
            child.before(currentSection);
            currentSection.appendChild(child);
        } else if (child.tagName === 'HR' && currentSection) {
            // HR ends a section
            currentSection = null;
        } else if (currentSection) {
            currentSection.appendChild(child);
        }
    });

    // Observe sections
    const sections = contentEl.querySelectorAll('.reveal-section');
    if (sections.length === 0) return;

    // Use Motion for animation if available
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

// ============================================================
// Entrance animation for header area
// ============================================================

function animateEntrance(contentEl) {
    const hasMotion = typeof Motion !== 'undefined' && Motion.animate;
    if (!hasMotion) return;

    // Animate the title and first blockquote
    const h1 = contentEl.querySelector('h1');
    const firstBq = contentEl.querySelector('blockquote');

    if (h1) {
        h1.style.opacity = '0';
        Motion.animate(h1,
            { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
            { duration: 0.6, easing: [0.32, 0.72, 0, 1], delay: 0.1 }
        ).finished.then(() => { h1.style.opacity = '1'; });
    }

    if (firstBq) {
        firstBq.style.opacity = '0';
        Motion.animate(firstBq,
            { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
            { duration: 0.6, easing: [0.32, 0.72, 0, 1], delay: 0.25 }
        ).finished.then(() => { firstBq.style.opacity = '1'; });
    }
}

// ============================================================
// Load Digest
// ============================================================

async function loadDigest() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    const error = document.getElementById('error');

    try {
        const res = await fetch('./digests/latest.md');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const md = await res.text();

        marked.setOptions({ gfm: true, breaks: false });

        content.innerHTML = marked.parse(md);
        loading.style.display = 'none';
        content.style.display = 'block';

        // Reading time
        const minutes = calcReadingTime(md);
        const rtEl = document.getElementById('reading-time');
        if (rtEl) rtEl.textContent = `${minutes} min read`;

        // Brand icons
        injectBrandIcons(content);

        // TOC
        const tocItems = buildTOC(content);
        setupTOCTracking(tocItems);

        // Animations
        animateEntrance(content);
        setupScrollReveal(content);

        // Handle anchors
        if (location.hash) {
            setTimeout(() => {
                const el = document.querySelector(location.hash);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        }

    } catch (err) {
        console.error('Failed to load digest:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
    }
}

// ============================================================
// Init
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        setTheme(cur === 'dark' ? 'light' : 'dark');
    });

    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) setTheme(e.matches ? 'dark' : 'light');
    });

    // TOC toggle (mobile)
    document.getElementById('toc-toggle')?.addEventListener('click', openTOC);
    document.getElementById('toc-close')?.addEventListener('click', closeTOC);
    document.getElementById('toc-backdrop')?.addEventListener('click', closeTOC);

    // Progress + Back to top
    setupProgress();
    setupBackToTop();

    // Load content
    loadDigest();
});

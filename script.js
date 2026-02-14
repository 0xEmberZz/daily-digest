// ============================================================
// Theme
// ============================================================

function getPreferredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

setTheme(getPreferredTheme());

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    loadDigest();
});

// ============================================================
// Lobe Icons — AI/tech brand logo injection
// ============================================================

const LOBE_ICON_CDN = 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons';

// Map brand keywords to Lobe Icon names
const BRAND_ICONS = {
    'openai': 'openai',
    'gpt': 'openai',
    'chatgpt': 'openai',
    'codex': 'openai',
    'anthropic': 'anthropic',
    'claude': 'claude',
    'google': 'google',
    'gemini': 'gemini',
    'meta': 'meta',
    'llama': 'meta',
    'mistral': 'mistral',
    'apple': 'apple',
    'siri': 'apple',
    'microsoft': 'microsoft',
    'github': 'github',
    'copilot': 'github-copilot',
    'hugging face': 'huggingface',
    'huggingface': 'huggingface',
    'stability': 'stability-ai',
    'midjourney': 'midjourney',
    'perplexity': 'perplexity',
    'cohere': 'cohere',
    'deepseek': 'deepseek',
    'groq': 'groq',
    'vercel': 'vercel',
    'cerebras': 'cerebras',
};

function injectBrandIcons(container) {
    // Find all article link lines (pattern: [title](url) — **source** · time · score)
    const paragraphs = container.querySelectorAll('p');

    paragraphs.forEach(p => {
        const text = p.textContent.toLowerCase();

        // Find the first matching brand
        for (const [keyword, iconName] of Object.entries(BRAND_ICONS)) {
            if (text.includes(keyword)) {
                // Check if icon already injected
                if (p.querySelector('.brand-icon')) break;

                const img = document.createElement('img');
                img.src = `${LOBE_ICON_CDN}/${iconName}.svg`;
                img.alt = keyword;
                img.className = 'brand-icon';
                img.width = 20;
                img.height = 20;
                img.loading = 'lazy';
                img.onerror = () => img.remove(); // silently remove if icon doesn't exist

                // Insert before the first text/link node
                const firstChild = p.firstChild;
                if (firstChild) {
                    p.insertBefore(img, firstChild);
                }
                break; // only one icon per paragraph
            }
        }
    });

    // Also inject icons next to h2/h3 category/article headers
    const headings = container.querySelectorAll('h2, h3');
    headings.forEach(h => {
        const text = h.textContent.toLowerCase();
        for (const [keyword, iconName] of Object.entries(BRAND_ICONS)) {
            if (text.includes(keyword)) {
                if (h.querySelector('.brand-icon')) break;

                const img = document.createElement('img');
                img.src = `${LOBE_ICON_CDN}/${iconName}.svg`;
                img.alt = keyword;
                img.className = 'brand-icon brand-icon-heading';
                img.width = 22;
                img.height = 22;
                img.loading = 'lazy';
                img.onerror = () => img.remove();

                h.insertBefore(img, h.firstChild);
                break;
            }
        }
    });
}

// ============================================================
// Load digest
// ============================================================

async function loadDigest() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    const error = document.getElementById('error');

    try {
        const res = await fetch('./digests/latest.md');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const md = await res.text();

        marked.setOptions({
            gfm: true,
            breaks: false,
        });

        content.innerHTML = marked.parse(md);
        loading.style.display = 'none';
        content.style.display = 'block';

        // Post-process: inject brand icons
        injectBrandIcons(content);

        // Handle anchors
        if (location.hash) {
            setTimeout(() => {
                const el = document.querySelector(location.hash);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
        }

    } catch (err) {
        console.error('Failed to load digest:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
    }
}

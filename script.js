// ============================================================
// Theme management
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

// Apply theme immediately (before DOM ready to avoid flash)
setTheme(getPreferredTheme());

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    loadDigest();
});

// ============================================================
// Load and render digest
// ============================================================

async function loadDigest() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    const error = document.getElementById('error');

    try {
        const res = await fetch('./digests/latest.md');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const md = await res.text();

        // Configure marked for clean output
        marked.setOptions({
            gfm: true,
            breaks: false,
            smartypants: true,
        });

        content.innerHTML = marked.parse(md);
        loading.style.display = 'none';
        content.style.display = 'block';

        // Handle anchor links
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

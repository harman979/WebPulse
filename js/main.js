/**
 * WebPulse — Main UI Module
 * Handles shared responsive navigation, theme initialization, and utilities.
 * Settings module must be loaded before this script.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ── 1. Apply persisted settings (theme, animations) immediately ──
    if (window.WebPulse && window.WebPulse.settings) {
        window.WebPulse.settings.applyAll();
    }

    // ── 2. Inject "Settings" nav link into every page header ──
    injectSettingsNav();

    // ── 3. Inject theme-toggle quick button in header ──
    injectThemeToggle();

    // ── 4. Responsive Navbar Toggle ──
    const navToggle = document.getElementById('navToggle');
    const mainNav   = document.querySelector('.main-nav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            const isOpen = mainNav.classList.contains('open');
            navToggle.setAttribute('aria-expanded', isOpen);
        });
    }

    // ── 5. Re-apply theme if OS preference changes (system mode) ──
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (window.WebPulse && window.WebPulse.settings) {
            const prefs = window.WebPulse.settings.get();
            if (prefs.theme === 'system') {
                window.WebPulse.settings.applyTheme();
            }
        }
    });
});

/* ─── Inject Trends + Settings Nav Links ─────────────────── */
function injectSettingsNav() {
    const mainNav = document.querySelector('.main-nav');
    if (!mainNav) return;

    // Inject Trends link (if not already present)
    if (!mainNav.querySelector('a[href="trends.html"]')) {
        const trendsLink = document.createElement('a');
        trendsLink.href      = 'trends.html';
        trendsLink.className = 'nav-link';
        trendsLink.textContent = 'Trends';
        if (location.pathname.endsWith('trends.html')) {
            trendsLink.classList.add('active');
        }
        mainNav.appendChild(trendsLink);
    }

    // Inject Settings link (if not already present)
    if (!mainNav.querySelector('a[href="settings.html"]')) {
        const settingsLink = document.createElement('a');
        settingsLink.href      = 'settings.html';
        settingsLink.className = 'nav-link';
        settingsLink.textContent = 'Settings';
        if (location.pathname.endsWith('settings.html')) {
            settingsLink.classList.add('active');
        }
        mainNav.appendChild(settingsLink);
    }
}

/* ─── Theme Toggle Button ────────────────────────────────── */
function injectThemeToggle() {
    const headerContainer = document.querySelector('.header-container');
    if (!headerContainer) return;
    if (document.getElementById('themeToggleBtn')) return;

    const btn = document.createElement('button');
    btn.id          = 'themeToggleBtn';
    btn.className   = 'theme-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.title       = 'Toggle light / dark theme';

    updateThemeToggleIcon(btn);

    btn.addEventListener('click', () => {
        const s = window.WebPulse.settings;
        const current = s.resolveTheme(s.get().theme);
        const next    = current === 'dark' ? 'light' : 'dark';
        s.update({ theme: next });
        s.applyAll();
        updateThemeToggleIcon(btn);
    });

    // Insert before the hamburger toggle (or at end)
    const navToggle = document.getElementById('navToggle');
    if (navToggle) {
        headerContainer.insertBefore(btn, navToggle);
    } else {
        headerContainer.appendChild(btn);
    }
}

function updateThemeToggleIcon(btn) {
    if (!window.WebPulse || !window.WebPulse.settings) return;
    const resolved = window.WebPulse.settings.resolveTheme(
        window.WebPulse.settings.get().theme
    );
    btn.textContent = resolved === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

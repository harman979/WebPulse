/**
 * WebPulse — Main UI Module
 * Handles shared responsive navigation, theme initialization, and utilities.
 * Day 7: Added Share nav link, full active-state detection, keyboard shortcuts
 *        overlay, button ripple effect, and scroll-reveal for cards.
 * Settings module must be loaded before this script.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ── 1. Apply persisted settings (theme, animations) immediately ──
    if (window.WebPulse && window.WebPulse.settings) {
        window.WebPulse.settings.applyAll();
    }

    // ── 2. Inject full nav links into every page header ──
    injectFullNav();

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
        // Close nav on outside click
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !navToggle.contains(e.target)) {
                mainNav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
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

    // ── 6. Button ripple effect ──
    initRippleEffect();

    // ── 7. Scroll-reveal for cards ──
    initScrollReveal();

    // ── 8. Keyboard shortcuts overlay ──
    initKeyboardShortcuts();
});

/* ─── Inject Full Navigation Links ───────────────────────── */
function injectFullNav() {
    const mainNav = document.querySelector('.main-nav');
    if (!mainNav) return;

    const currentPage = location.pathname.split('/').pop() || 'index.html';

    const navItems = [
        { href: 'trends.html',   label: 'Trends'   },
        { href: 'share.html',    label: 'Share'     },
        { href: 'settings.html', label: 'Settings'  },
    ];

    navItems.forEach(({ href, label }) => {
        if (!mainNav.querySelector(`a[href="${href}"]`)) {
            const link = document.createElement('a');
            link.href      = href;
            link.className = 'nav-link';
            link.textContent = label;
            if (currentPage === href) {
                link.classList.add('active');
            }
            mainNav.appendChild(link);
        } else {
            // Fix active state on pages that already have the link hard-coded
            const existing = mainNav.querySelector(`a[href="${href}"]`);
            if (currentPage === href) existing.classList.add('active');
        }
    });

    // Ensure all existing hard-coded links also have correct active state
    mainNav.querySelectorAll('a.nav-link').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else if (linkPage !== currentPage && link.classList.contains('active') && !link.getAttribute('href').startsWith('#')) {
            // Only remove active if it was incorrectly set (not for hash links)
            if (linkPage !== currentPage) link.classList.remove('active');
        }
    });
}

/* ─── Button Ripple Effect ───────────────────────────────── */
function initRippleEffect() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn || btn.disabled) return;

        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${e.clientX - rect.left - size / 2}px;
            top: ${e.clientY - rect.top - size / 2}px;
        `;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });
}

/* ─── Scroll Reveal for Cards ────────────────────────────── */
function initScrollReveal() {
    const targets = document.querySelectorAll('.card, .cwv-card, .feature-card, .stat-card, .chart-card, .settings-section');
    if (!targets.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scroll-revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    targets.forEach((el, i) => {
        el.classList.add('scroll-hidden');
        el.style.transitionDelay = `${Math.min(i * 0.04, 0.3)}s`;
        observer.observe(el);
    });
}

/* ─── Keyboard Shortcuts Overlay ────────────────────────── */
function initKeyboardShortcuts() {
    // Inject overlay HTML
    const overlay = document.createElement('div');
    overlay.id        = 'shortcutsOverlay';
    overlay.className = 'shortcuts-overlay';
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Keyboard shortcuts');
    overlay.innerHTML = `
        <div class="shortcuts-panel">
            <div class="shortcuts-header">
                <h2>⌨️ Keyboard Shortcuts</h2>
                <button class="shortcuts-close" id="shortcutsCloseBtn" aria-label="Close shortcuts">✕</button>
            </div>
            <div class="shortcuts-body">
                <div class="shortcuts-group">
                    <div class="shortcuts-group-title">Navigation</div>
                    <div class="shortcut-row"><kbd>G</kbd> <kbd>H</kbd><span>Go to Home</span></div>
                    <div class="shortcut-row"><kbd>G</kbd> <kbd>A</kbd><span>Go to Analyzer</span></div>
                    <div class="shortcut-row"><kbd>G</kbd> <kbd>R</kbd><span>Go to Reports</span></div>
                    <div class="shortcut-row"><kbd>G</kbd> <kbd>T</kbd><span>Go to Trends</span></div>
                    <div class="shortcut-row"><kbd>G</kbd> <kbd>S</kbd><span>Go to Settings</span></div>
                </div>
                <div class="shortcuts-group">
                    <div class="shortcuts-group-title">Actions</div>
                    <div class="shortcut-row"><kbd>Space</kbd><span>Run / trigger primary action</span></div>
                    <div class="shortcut-row"><kbd>T</kbd><span>Toggle light / dark theme</span></div>
                    <div class="shortcut-row"><kbd>Esc</kbd><span>Close modal / overlay</span></div>
                    <div class="shortcut-row"><kbd>?</kbd><span>Show this shortcuts panel</span></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeOverlay = () => {
        overlay.classList.remove('shortcuts-open');
        document.body.style.overflow = '';
    };

    document.getElementById('shortcutsCloseBtn').addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });

    // Keyboard navigation
    let pendingG = false;
    let gTimer   = null;

    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement.tagName;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

        if (e.key === '?') {
            e.preventDefault();
            overlay.classList.toggle('shortcuts-open');
            document.body.style.overflow = overlay.classList.contains('shortcuts-open') ? 'hidden' : '';
            return;
        }

        if (e.key === 'Escape') {
            closeOverlay();
            // Also close any open modals
            document.querySelectorAll('.modal[aria-hidden="false"]').forEach(m => {
                m.setAttribute('aria-hidden', 'true');
            });
            return;
        }

        if (e.key === 't' || e.key === 'T') {
            const themeBtn = document.getElementById('themeToggleBtn');
            if (themeBtn) themeBtn.click();
            return;
        }

        // Two-key "G X" navigation
        if ((e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey) {
            pendingG = true;
            clearTimeout(gTimer);
            gTimer = setTimeout(() => { pendingG = false; }, 1500);
            return;
        }

        if (pendingG) {
            pendingG = false;
            clearTimeout(gTimer);
            const map = { h: 'index.html', a: 'analyzer.html', r: 'reports.html', t: 'trends.html', s: 'settings.html' };
            const dest = map[e.key.toLowerCase()];
            if (dest) { e.preventDefault(); location.href = dest; }
        }
    });

    // Add a "?" hint button to the header
    const headerContainer = document.querySelector('.header-container');
    if (headerContainer) {
        const hintBtn = document.createElement('button');
        hintBtn.className   = 'shortcuts-hint-btn';
        hintBtn.id          = 'shortcutsHintBtn';
        hintBtn.title       = 'Keyboard shortcuts (?)'
        hintBtn.setAttribute('aria-label', 'Show keyboard shortcuts');
        hintBtn.textContent = '?';
        hintBtn.addEventListener('click', () => {
            overlay.classList.add('shortcuts-open');
            document.body.style.overflow = 'hidden';
        });
        const navToggle = document.getElementById('navToggle');
        if (navToggle) {
            headerContainer.insertBefore(hintBtn, navToggle);
        } else {
            headerContainer.appendChild(hintBtn);
        }
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
    btn.title       = 'Toggle light / dark theme (T)';

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

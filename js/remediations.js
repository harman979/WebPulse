/**
 * remediations.js — WebPulse Advanced Code Action & Remediation Snippet Generator
 *
 * Generates copyable, production-ready code snippets for performance recommendations
 * and provides instant clipboard feedback.
 */

'use strict';

(function () {
    window.WebPulse = window.WebPulse || {};

    const SNIPPETS = {
        'js-size': {
            type: 'JavaScript Optimization',
            code: `<script src="app.js" defer></script>\n<!-- Or dynamic import for code splitting -->\nconst module = await import('./heavy-module.js');`,
            hint: 'Use defer/async attribute or implement dynamic imports to prevent blocking main thread.'
        },
        'css-render-blocking': {
            type: 'CSS Optimization',
            code: `<link rel="preload" href="critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'">\n<noscript><link rel="stylesheet" href="critical.css"></noscript>`,
            hint: 'Preload key stylesheets and inline critical rendering path CSS.'
        },
        'image-optimization': {
            type: 'HTML / Image Lazy Loading',
            code: `<img src="hero-image.webp" alt="Banner"\n     loading="lazy"\n     decoding="async"\n     width="800" height="450">`,
            hint: 'Add loading="lazy", decoding="async", explicit width/height to prevent layout shifts.'
        },
        'font-display': {
            type: 'Font Display Rule',
            code: `@font-face {\n  font-family: 'CustomFont';\n  src: url('font.woff2') format('woff2');\n  font-display: swap;\n}`,
            hint: 'Ensure text remains visible during webfont load with font-display: swap.'
        },
        'cache-headers': {
            type: 'HTTP Caching Headers',
            code: `Cache-Control: public, max-age=31536000, immutable\nETag: "v1.2.3"`,
            hint: 'Configure long-term cache headers for static immutable assets.'
        },
        'lcp-preload': {
            type: 'Resource Preloading',
            code: `<link rel="preload" href="hero-banner.webp" as="image" type="image/webp">`,
            hint: 'Preload LCP image early in <head> to improve LCP timing.'
        }
    };

    /**
     * Finds matching snippet for recommendation title or ID.
     */
    function getSnippetForRec(rec) {
        const title = (rec.title || '').toLowerCase();
        const category = (rec.category || '').toLowerCase();

        if (title.includes('js') || title.includes('script') || category.includes('js')) {
            return SNIPPETS['js-size'];
        }
        if (title.includes('css') || title.includes('style') || category.includes('css')) {
            return SNIPPETS['css-render-blocking'];
        }
        if (title.includes('img') || title.includes('image') || category.includes('image')) {
            return SNIPPETS['image-optimization'];
        }
        if (title.includes('font') || title.includes('typography')) {
            return SNIPPETS['font-display'];
        }
        if (title.includes('cache') || title.includes('header') || title.includes('ttfb')) {
            return SNIPPETS['cache-headers'];
        }
        if (title.includes('lcp') || title.includes('paint')) {
            return SNIPPETS['lcp-preload'];
        }

        return SNIPPETS['image-optimization'];
    }

    /**
     * Copies code snippet to clipboard with feedback on button element.
     */
    function copySnippet(code, btnEl) {
        if (!navigator.clipboard) {
            fallbackCopy(code);
            showFeedback(btnEl);
            return;
        }

        navigator.clipboard.writeText(code).then(() => {
            showFeedback(btnEl);
        }).catch(() => {
            fallbackCopy(code);
            showFeedback(btnEl);
        });
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (_) {}
        document.body.removeChild(ta);
    }

    function showFeedback(btnEl) {
        if (!btnEl) return;
        const originalText = btnEl.innerHTML;
        btnEl.innerHTML = '✅ Copied!';
        btnEl.classList.add('btn-copied');

        setTimeout(() => {
            btnEl.innerHTML = originalText;
            btnEl.classList.remove('btn-copied');
        }, 2000);
    }

    window.WebPulse.remediations = {
        snippets: SNIPPETS,
        getSnippet: getSnippetForRec,
        copySnippet: copySnippet
    };
})();

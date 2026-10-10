/**
 * presets.js — WebPulse Synthetic Audit Presets & Sandbox Simulation Profiles
 *
 * Provides realistic pre-configured web application scenarios allowing
 * developers to benchmark and test performance audits, network waterfalls,
 * budgets, and remediation tools across diverse architectural profiles.
 */

'use strict';

(function () {
    const PRESETS = {
        live: {
            id: 'live',
            name: 'Live Page Context',
            icon: '🌐',
            tag: 'Live Runtime',
            desc: 'Collects real-time browser Performance APIs from the current active page session.',
            isLive: true
        },
        ecommerce: {
            id: 'ecommerce',
            name: 'E-Commerce Storefront',
            icon: '🛒',
            tag: 'Heavy Assets',
            desc: 'Simulates a high-traffic product catalog with unoptimized product imagery, third-party analytics trackers, and heavy checkout scripts.',
            isLive: false,
            metrics: {
                cwv: {
                    lcp: { value: 3450, formatted: '3.45s', status: 'poor' },
                    cls: { value: 0.185, formatted: '0.185', status: 'needs-improvement' },
                    inp: { value: 240, formatted: '240ms', status: 'needs-improvement' }
                },
                loading: {
                    fcp: { value: 1850, formatted: '1.85s', status: 'needs-improvement' },
                    ttfb: { value: 420, formatted: '420ms', status: 'needs-improvement' },
                    domLoad: { value: 1650, formatted: '1.65s', status: 'needs-improvement' },
                    pageLoad: { value: 4120, formatted: '4.12s', status: 'poor' }
                }
            },
            resources: [
                { name: 'https://shop.example.com/', shortName: 'shop.example.com/', type: 'other', initiatorType: 'navigation', size: 45200, decodedSize: 182000, duration: 420, startTime: 0, ttfb: 380, download: 40, dns: 45, tcp: 65, ssl: 35, protocol: 'h2' },
                { name: 'https://cdn.example.com/styles/app.css', shortName: 'styles/app.css', type: 'link', initiatorType: 'link', size: 142000, decodedSize: 420000, duration: 310, startTime: 430, ttfb: 160, download: 150, dns: 20, tcp: 35, ssl: 20, protocol: 'h2' },
                { name: 'https://cdn.example.com/js/bundle-vendor.js', shortName: 'js/bundle-vendor.js', type: 'script', initiatorType: 'script', size: 385000, decodedSize: 1250000, duration: 620, startTime: 460, ttfb: 220, download: 400, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://cdn.example.com/js/checkout-cart.js', shortName: 'js/checkout-cart.js', type: 'script', initiatorType: 'script', size: 215000, decodedSize: 680000, duration: 480, startTime: 620, ttfb: 180, download: 300, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://cdn.example.com/images/hero-banner.png', shortName: 'images/hero-banner.png', type: 'img', initiatorType: 'img', size: 840000, decodedSize: 2400000, duration: 890, startTime: 850, ttfb: 240, download: 650, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://cdn.example.com/images/product-item-01.jpg', shortName: 'images/product-item-01.jpg', type: 'img', initiatorType: 'img', size: 320000, decodedSize: 950000, duration: 520, startTime: 950, ttfb: 180, download: 340, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://cdn.example.com/images/product-item-02.jpg', shortName: 'images/product-item-02.jpg', type: 'img', initiatorType: 'img', size: 295000, decodedSize: 890000, duration: 490, startTime: 1020, ttfb: 170, download: 320, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://cdn.example.com/fonts/montserrat-700.woff2', shortName: 'fonts/montserrat-700.woff2', type: 'font', initiatorType: 'font', size: 68000, decodedSize: 68000, duration: 240, startTime: 550, ttfb: 120, download: 120, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://www.google-analytics.com/analytics.js', shortName: 'analytics.js', type: 'script', initiatorType: 'script', size: 52000, decodedSize: 140000, duration: 340, startTime: 1200, ttfb: 190, download: 150, dns: 35, tcp: 50, ssl: 30, protocol: 'h2' },
                { name: 'https://connect.facebook.net/en_US/fbevents.js', shortName: 'fbevents.js', type: 'script', initiatorType: 'script', size: 89000, decodedSize: 220000, duration: 410, startTime: 1350, ttfb: 220, download: 190, dns: 40, tcp: 55, ssl: 35, protocol: 'h2' },
                { name: 'https://api.example.com/v1/recommendations', shortName: 'v1/recommendations', type: 'fetch', initiatorType: 'fetch', size: 14500, decodedSize: 45000, duration: 380, startTime: 1500, ttfb: 340, download: 40, dns: 25, tcp: 45, ssl: 25, protocol: 'h2' }
            ]
        },
        saas_spa: {
            id: 'saas_spa',
            name: 'SaaS Web Application (SPA)',
            icon: '💻',
            tag: 'JS Heavy',
            desc: 'Simulates a complex single-page dashboard featuring monolithic JavaScript chunks, heavy state management, and async data hydration.',
            isLive: false,
            metrics: {
                cwv: {
                    lcp: { value: 2750, formatted: '2.75s', status: 'needs-improvement' },
                    cls: { value: 0.045, formatted: '0.045', status: 'good' },
                    inp: { value: 310, formatted: '310ms', status: 'poor' }
                },
                loading: {
                    fcp: { value: 1650, formatted: '1.65s', status: 'needs-improvement' },
                    ttfb: { value: 190, formatted: '190ms', status: 'good' },
                    domLoad: { value: 2100, formatted: '2.10s', status: 'poor' },
                    pageLoad: { value: 3250, formatted: '3.25s', status: 'needs-improvement' }
                }
            },
            resources: [
                { name: 'https://app.saasplatform.io/app', shortName: 'app.saasplatform.io/app', type: 'other', initiatorType: 'navigation', size: 18500, decodedSize: 64000, duration: 190, startTime: 0, ttfb: 160, download: 30, dns: 30, tcp: 45, ssl: 25, protocol: 'h2' },
                { name: 'https://app.saasplatform.io/static/main.chunk.css', shortName: 'static/main.chunk.css', type: 'link', initiatorType: 'link', size: 84000, decodedSize: 310000, duration: 180, startTime: 200, ttfb: 90, download: 90, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://app.saasplatform.io/static/runtime.js', shortName: 'static/runtime.js', type: 'script', initiatorType: 'script', size: 28000, decodedSize: 75000, duration: 120, startTime: 210, ttfb: 70, download: 50, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://app.saasplatform.io/static/vendor-bundle.js', shortName: 'static/vendor-bundle.js', type: 'script', initiatorType: 'script', size: 760000, decodedSize: 2600000, duration: 880, startTime: 230, ttfb: 180, download: 700, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://app.saasplatform.io/static/dashboard.js', shortName: 'static/dashboard.js', type: 'script', initiatorType: 'script', size: 340000, decodedSize: 1100000, duration: 490, startTime: 750, ttfb: 140, download: 350, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://fonts.gstatic.com/s/inter/v12/inter-regular.woff2', shortName: 'inter-regular.woff2', type: 'font', initiatorType: 'font', size: 42000, decodedSize: 42000, duration: 160, startTime: 320, ttfb: 90, download: 70, dns: 25, tcp: 35, ssl: 20, protocol: 'h2' },
                { name: 'https://api.saasplatform.io/graphql/user-session', shortName: 'graphql/user-session', type: 'fetch', initiatorType: 'fetch', size: 12400, decodedSize: 38000, duration: 260, startTime: 1250, ttfb: 230, download: 30, dns: 30, tcp: 40, ssl: 25, protocol: 'h2' },
                { name: 'https://api.saasplatform.io/v2/telemetry', shortName: 'v2/telemetry', type: 'fetch', initiatorType: 'fetch', size: 4500, decodedSize: 12000, duration: 180, startTime: 1400, ttfb: 160, download: 20, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' }
            ]
        },
        news_media: {
            id: 'news_media',
            name: 'News & Media Publication',
            icon: '📰',
            tag: 'Ad & Font Heavy',
            desc: 'Simulates a content-heavy news publisher plagued by dynamic advertising banners, late-loading webfonts, and severe layout shifts.',
            isLive: false,
            metrics: {
                cwv: {
                    lcp: { value: 3850, formatted: '3.85s', status: 'poor' },
                    cls: { value: 0.280, formatted: '0.280', status: 'poor' },
                    inp: { value: 160, formatted: '160ms', status: 'good' }
                },
                loading: {
                    fcp: { value: 2200, formatted: '2.20s', status: 'poor' },
                    ttfb: { value: 380, formatted: '380ms', status: 'needs-improvement' },
                    domLoad: { value: 2400, formatted: '2.40s', status: 'poor' },
                    pageLoad: { value: 5200, formatted: '5.20s', status: 'poor' }
                }
            },
            resources: [
                { name: 'https://dailychronicle.news/article/world-tech', shortName: 'world-tech', type: 'other', initiatorType: 'navigation', size: 62000, decodedSize: 260000, duration: 380, startTime: 0, ttfb: 320, download: 60, dns: 40, tcp: 60, ssl: 30, protocol: 'h2' },
                { name: 'https://dailychronicle.news/assets/editorial.css', shortName: 'editorial.css', type: 'link', initiatorType: 'link', size: 185000, decodedSize: 620000, duration: 360, startTime: 400, ttfb: 150, download: 210, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://fonts.googleapis.com/css2?family=Playfair+Display', shortName: 'Playfair+Display', type: 'link', initiatorType: 'link', size: 3400, decodedSize: 12000, duration: 190, startTime: 420, ttfb: 110, download: 80, dns: 30, tcp: 45, ssl: 25, protocol: 'h2' },
                { name: 'https://fonts.gstatic.com/s/playfair/font.woff2', shortName: 'playfair/font.woff2', type: 'font', initiatorType: 'font', size: 112000, decodedSize: 112000, duration: 420, startTime: 650, ttfb: 220, download: 200, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js', shortName: 'gpt.js', type: 'script', initiatorType: 'script', size: 280000, decodedSize: 850000, duration: 580, startTime: 750, ttfb: 240, download: 340, dns: 35, tcp: 50, ssl: 30, protocol: 'h2' },
                { name: 'https://dailychronicle.news/img/breaking-news.jpg', shortName: 'breaking-news.jpg', type: 'img', initiatorType: 'img', size: 1250000, decodedSize: 3400000, duration: 1250, startTime: 820, ttfb: 300, download: 950, dns: 0, tcp: 0, ssl: 0, protocol: 'h2' },
                { name: 'https://adservice.google.com/adsid/integrator.sync', shortName: 'integrator.sync', type: 'script', initiatorType: 'script', size: 76000, decodedSize: 195000, duration: 340, startTime: 1400, ttfb: 210, download: 130, dns: 30, tcp: 45, ssl: 25, protocol: 'h2' },
                { name: 'https://widgets.outbrain.com/outbrain.js', shortName: 'outbrain.js', type: 'script', initiatorType: 'script', size: 94000, decodedSize: 260000, duration: 430, startTime: 1600, ttfb: 250, download: 180, dns: 40, tcp: 55, ssl: 30, protocol: 'h2' }
            ]
        },
        jamstack_blog: {
            id: 'jamstack_blog',
            name: 'Optimized Jamstack Blog',
            icon: '⚡',
            tag: 'Top Performance',
            desc: 'Simulates a modern static web application: pre-rendered HTML, preloaded WebP images, minimal inline CSS, and zero third-party bloat.',
            isLive: false,
            metrics: {
                cwv: {
                    lcp: { value: 780, formatted: '780ms', status: 'good' },
                    cls: { value: 0.008, formatted: '0.008', status: 'good' },
                    inp: { value: 45, formatted: '45ms', status: 'good' }
                },
                loading: {
                    fcp: { value: 420, formatted: '420ms', status: 'good' },
                    ttfb: { value: 65, formatted: '65ms', status: 'good' },
                    domLoad: { value: 240, formatted: '240ms', status: 'good' },
                    pageLoad: { value: 890, formatted: '890ms', status: 'good' }
                }
            },
            resources: [
                { name: 'https://staticpulse.dev/posts/modern-web', shortName: 'posts/modern-web', type: 'other', initiatorType: 'navigation', size: 12200, decodedSize: 34000, duration: 65, startTime: 0, ttfb: 50, download: 15, dns: 15, tcp: 20, ssl: 12, protocol: 'h3' },
                { name: 'https://staticpulse.dev/dist/style.min.css', shortName: 'dist/style.min.css', type: 'link', initiatorType: 'link', size: 18400, decodedSize: 52000, duration: 95, startTime: 70, ttfb: 45, download: 50, dns: 0, tcp: 0, ssl: 0, protocol: 'h3' },
                { name: 'https://staticpulse.dev/dist/hero-cover.webp', shortName: 'dist/hero-cover.webp', type: 'img', initiatorType: 'img', size: 48000, decodedSize: 140000, duration: 180, startTime: 120, ttfb: 60, download: 120, dns: 0, tcp: 0, ssl: 0, protocol: 'h3' },
                { name: 'https://staticpulse.dev/dist/site.min.js', shortName: 'dist/site.min.js', type: 'script', initiatorType: 'script', size: 14500, decodedSize: 39000, duration: 85, startTime: 150, ttfb: 40, download: 45, dns: 0, tcp: 0, ssl: 0, protocol: 'h3' },
                { name: 'https://staticpulse.dev/fonts/outfit-v1.woff2', shortName: 'fonts/outfit-v1.woff2', type: 'font', initiatorType: 'font', size: 24000, decodedSize: 24000, duration: 110, startTime: 90, ttfb: 55, download: 55, dns: 0, tcp: 0, ssl: 0, protocol: 'h3' }
            ]
        }
    };

    /**
     * Converts a simulated resource list to WebPulse standard resource summary object.
     */
    function buildResourceSummary(rawList) {
        const typeKeys = ['script', 'link', 'img', 'font', 'fetch', 'other'];
        const typeMap = (window.WebPulse && window.WebPulse.resources) ? window.WebPulse.resources.TYPE_MAP : {
            script: { label: 'JS', tag: 'script', bar: 'bar-script' },
            link:   { label: 'CSS', tag: 'link', bar: 'bar-link' },
            img:    { label: 'Image', tag: 'img', bar: 'bar-img' },
            font:   { label: 'Font', tag: 'font', bar: 'bar-font' },
            fetch:  { label: 'Fetch/XHR', tag: 'fetch', bar: 'bar-fetch' },
            other:  { label: 'Other', tag: 'other', bar: 'bar-other' },
        };
        const totals = {};
        typeKeys.forEach(k => {
            totals[k] = { count: 0, size: 0, sizeFormatted: '0 B' };
        });

        let grandTotal = 0;
        const normalizedResources = rawList.map(r => {
            const sz = r.size || 0;
            const dur = Math.round(r.duration || 0);
            grandTotal += sz;
            const t = totals[r.type] ? r.type : 'other';
            totals[t].count++;
            totals[t].size += sz;
            const tInfo = typeMap[t] || typeMap.other;

            let domain = 'same-origin';
            try {
                const u = new URL(r.name);
                domain = u.hostname || 'same-origin';
            } catch (_) {}

            const displayName = r.shortName || (function() {
                try {
                    const u = new URL(r.name);
                    const parts = u.pathname.split('/').filter(Boolean);
                    return parts[parts.length - 1] || u.hostname;
                } catch(_) {
                    return r.name.slice(0, 50);
                }
            })();

            return {
                name: displayName,
                url: r.name,
                type: t,
                typeLabel: tInfo.label,
                typeTag: tInfo.tag,
                barClass: tInfo.bar,
                size: sz,
                encodedBodySize: sz,
                decodedBodySize: r.decodedSize || sz,
                sizeFormatted: window.WebPulse.resources ? window.WebPulse.resources.formatBytes(sz) : `${(sz / 1024).toFixed(1)} KB`,
                decodedSize: r.decodedSize || sz,
                decodedSizeFormatted: window.WebPulse.resources ? window.WebPulse.resources.formatBytes(r.decodedSize || sz) : `${(sz / 1024).toFixed(1)} KB`,
                duration: dur,
                durationFormatted: `${dur}ms`,
                startTime: r.startTime || 0,
                endTime: Math.round(((r.startTime || 0) + dur) * 10) / 10,
                domain: domain,
                initiatorType: r.initiatorType || t,
                nextHopProtocol: r.protocol || 'h2',
                renderBlocking: r.type === 'link' || (r.type === 'script' && dur > 200),
                phases: {
                    stalled: r.stalled || 0,
                    dns: r.dns || 0,
                    connect: r.tcp || 0,
                    ssl: r.ssl || 0,
                    ttfb: r.ttfb || Math.round(dur * 0.45),
                    download: r.download || Math.max(1, Math.round(dur * 0.55)),
                }
            };
        });

        typeKeys.forEach(k => {
            totals[k].sizeFormatted = window.WebPulse.resources
                ? window.WebPulse.resources.formatBytes(totals[k].size)
                : `${(totals[k].size / 1024).toFixed(1)} KB`;
        });

        const grandTotalFormatted = window.WebPulse.resources
            ? window.WebPulse.resources.formatBytes(grandTotal)
            : `${(grandTotal / 1024).toFixed(1)} KB`;

        return {
            resources: normalizedResources,
            count: normalizedResources.length,
            grandTotal,
            grandTotalFormatted,
            totals
        };
    }

    window.WebPulse = window.WebPulse || {};
    window.WebPulse.presets = {
        PRESETS,
        getPresetList: () => Object.values(PRESETS),
        getPreset: (id) => PRESETS[id] || PRESETS.live,
        buildResourceSummary
    };
})();

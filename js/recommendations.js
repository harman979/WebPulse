/**
 * recommendations.js — WebPulse Rule-Based Bottleneck Detector & Advisor
 *
 * Runs deterministic rules against collected metrics and resource data
 * to identify performance bottlenecks and generate optimization recommendations.
 */

'use strict';

/* ─── Issue Detection Rules ──────────────────────────────── */

/**
 * Detects performance bottlenecks from metrics + resource data.
 * @param {Object} metricsData  - Output from performance.collectAllMetrics()
 * @param {Object} resourceData - Output from resources.collectResources()
 * @returns {Array<{id, severity, icon, title, desc}>}
 */
function detectIssues(metricsData, resourceData) {
    const issues = [];
    const { cwv, loading } = metricsData;
    const { resources, totals, grandTotal, count } = resourceData;

    /* ── Core Web Vitals ── */
    if (cwv.lcp.value !== null && cwv.lcp.value > 4000) {
        issues.push({
            id: 'lcp-poor', severity: 'critical', icon: '🔴',
            title: 'Poor LCP — ' + cwv.lcp.formatted,
            desc: 'Largest Contentful Paint exceeds 4s. Consider optimizing images, preloading key resources, and reducing server response times.',
        });
    } else if (cwv.lcp.value !== null && cwv.lcp.value > 2500) {
        issues.push({
            id: 'lcp-needs', severity: 'warning', icon: '🟡',
            title: 'LCP Needs Improvement — ' + cwv.lcp.formatted,
            desc: 'LCP is between 2.5s–4s. Compress and lazy-load non-critical images, and use a CDN for faster delivery.',
        });
    }

    if (cwv.cls.value !== null && cwv.cls.value > 0.25) {
        issues.push({
            id: 'cls-poor', severity: 'critical', icon: '🔴',
            title: 'Poor CLS — ' + cwv.cls.formatted,
            desc: 'Cumulative Layout Shift exceeds 0.25. Add explicit width/height to images and avoid inserting content above existing elements.',
        });
    } else if (cwv.cls.value !== null && cwv.cls.value > 0.1) {
        issues.push({
            id: 'cls-needs', severity: 'warning', icon: '🟡',
            title: 'CLS Needs Improvement — ' + cwv.cls.formatted,
            desc: 'Layout shifts detected. Reserve space for ads, embeds, and async-loaded content to prevent shifts.',
        });
    }

    if (cwv.inp.value !== null && cwv.inp.value > 500) {
        issues.push({
            id: 'inp-poor', severity: 'critical', icon: '🔴',
            title: 'Poor INP — ' + cwv.inp.formatted,
            desc: 'Interaction to Next Paint exceeds 500ms. Break up long tasks, reduce main-thread blocking JS, and use requestIdleCallback.',
        });
    } else if (cwv.inp.value !== null && cwv.inp.value > 200) {
        issues.push({
            id: 'inp-needs', severity: 'warning', icon: '🟡',
            title: 'INP Needs Improvement — ' + cwv.inp.formatted,
            desc: 'Response to interactions is sluggish. Minimize event handler work and defer non-essential logic.',
        });
    }

    /* ── Loading Metrics ── */
    if (loading.ttfb.value !== null && loading.ttfb.value > 1800) {
        issues.push({
            id: 'ttfb-poor', severity: 'critical', icon: '🔴',
            title: 'Slow Server Response (TTFB) — ' + loading.ttfb.formatted,
            desc: 'Time to First Byte exceeds 1.8s. Investigate server processing time, use server-side caching, or switch to a faster hosting provider.',
        });
    } else if (loading.ttfb.value !== null && loading.ttfb.value > 800) {
        issues.push({
            id: 'ttfb-needs', severity: 'warning', icon: '🟡',
            title: 'TTFB Needs Improvement — ' + loading.ttfb.formatted,
            desc: 'Server is responding slowly. Consider CDN caching or edge computing to reduce initial response time.',
        });
    }

    if (loading.fcp.value !== null && loading.fcp.value > 3000) {
        issues.push({
            id: 'fcp-poor', severity: 'critical', icon: '🔴',
            title: 'Slow First Contentful Paint — ' + loading.fcp.formatted,
            desc: 'FCP exceeds 3s. Eliminate render-blocking resources, inline critical CSS, and defer non-critical scripts.',
        });
    }

    if (loading.pageLoad.value !== null && loading.pageLoad.value > 7000) {
        issues.push({
            id: 'pageload-poor', severity: 'warning', icon: '🟡',
            title: 'Slow Total Page Load — ' + loading.pageLoad.formatted,
            desc: 'Full page load takes over 7s. Reduce resource count, enable compression (Gzip/Brotli), and implement lazy loading.',
        });
    }

    /* ── Resource Issues ── */
    // Heavy JS payload
    if (totals.script.size > 500 * 1024) {
        issues.push({
            id: 'heavy-js', severity: 'warning', icon: '🟡',
            title: 'Heavy JavaScript Payload — ' + totals.script.sizeFormatted,
            desc: 'JavaScript exceeds 500KB. Code-split large bundles, tree-shake unused code, and defer non-critical scripts.',
        });
    }

    // Unoptimized images
    const largeImages = resources.filter(r => r.type === 'img' && r.size > 200 * 1024);
    if (largeImages.length > 0) {
        issues.push({
            id: 'large-images', severity: 'warning', icon: '🟡',
            title: `${largeImages.length} Large Image(s) Detected`,
            desc: `${largeImages.length} image(s) exceed 200KB each. Convert to WebP/AVIF, resize to display dimensions, and use lazy loading.`,
        });
    }

    // Too many resources
    if (count > 80) {
        issues.push({
            id: 'resource-count', severity: 'warning', icon: '🟡',
            title: `High Resource Count — ${count} Resources`,
            desc: 'More than 80 resources detected. Consolidate scripts, inline small CSS, and use HTTP/2 push or preloading hints.',
        });
    } else if (count > 50) {
        issues.push({
            id: 'resource-count-info', severity: 'info', icon: '🔵',
            title: `Moderate Resource Count — ${count} Resources`,
            desc: 'Consider consolidating small scripts and stylesheets to reduce request overhead.',
        });
    }

    // Total payload
    if (grandTotal > 3 * 1024 * 1024) {
        issues.push({
            id: 'heavy-payload', severity: 'critical', icon: '🔴',
            title: 'Excessive Total Page Weight — ' + window.WebPulse.resources.formatBytes(grandTotal),
            desc: 'Total transfer size exceeds 3MB. Enable server compression, minify assets, and remove unused third-party libraries.',
        });
    } else if (grandTotal > 1.5 * 1024 * 1024) {
        issues.push({
            id: 'medium-payload', severity: 'warning', icon: '🟡',
            title: 'Large Total Page Weight — ' + window.WebPulse.resources.formatBytes(grandTotal),
            desc: 'Page weighs over 1.5MB. Review third-party scripts and unoptimized assets.',
        });
    }

    // Slow individual resources
    const slowResources = resources.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
        issues.push({
            id: 'slow-resources', severity: 'warning', icon: '🟡',
            title: `${slowResources.length} Slow-Loading Resource(s) (>1s)`,
            desc: `${slowResources.length} resource(s) took over 1 second to load. Check server-side caching, CDN delivery, and file sizes.`,
        });
    }

    return issues;
}

/* ─── Recommendation Generator ───────────────────────────── */

const GLOBAL_RECS = [
    {
        id: 'cache-policy',
        icon: '💾',
        title: 'Implement Aggressive Cache-Control Headers',
        desc: 'Set long-lived cache headers (Cache-Control: max-age=31536000, immutable) for versioned static assets to eliminate repeat requests.',
    },
    {
        id: 'compression',
        icon: '📦',
        title: 'Enable Brotli / Gzip Compression',
        desc: 'Ensure your server applies Brotli or Gzip compression on all text-based resources (HTML, CSS, JS, JSON) to reduce transfer sizes by 60–80%.',
    },
    {
        id: 'preconnect',
        icon: '🔗',
        title: 'Use <link rel="preconnect"> for Third-Party Origins',
        desc: 'Add preconnect hints for fonts.googleapis.com, analytics, and CDN origins to eliminate DNS lookup and TCP handshake latency.',
    },
    {
        id: 'http2',
        icon: '⚡',
        title: 'Ensure HTTP/2 or HTTP/3 is Enabled',
        desc: 'HTTP/2 multiplexing eliminates head-of-line blocking for multiple resources. HTTP/3 (QUIC) further reduces latency on unreliable networks.',
    },
    {
        id: 'font-display',
        icon: '🔤',
        title: 'Use font-display: swap for Web Fonts',
        desc: 'Prevent invisible text during font loading by setting font-display: swap. This shows fallback text immediately while the web font loads.',
    },
];

/**
 * Generates targeted optimization recommendations based on detected issues and metrics.
 * @param {Array}  issues       - Detected issues
 * @param {Object} metricsData  - Performance metrics
 * @param {Object} resourceData - Resource data
 * @returns {Array<{id, icon, title, desc}>}
 */
function generateRecommendations(issues, metricsData, resourceData) {
    const recs = [];
    const issueIds = new Set(issues.map(i => i.id));
    const { cwv, loading } = metricsData;
    const { totals } = resourceData;

    // LCP-specific recommendations
    if (issueIds.has('lcp-poor') || issueIds.has('lcp-needs')) {
        recs.push({
            id: 'rec-lcp-preload', icon: '🖼️',
            title: 'Preload the LCP Image',
            desc: 'Add <link rel="preload" as="image"> for your hero or above-the-fold image to give it top browser priority.',
        });
    }

    // CLS recommendations
    if (issueIds.has('cls-poor') || issueIds.has('cls-needs')) {
        recs.push({
            id: 'rec-cls-dimensions', icon: '📐',
            title: 'Specify Image & Video Dimensions',
            desc: 'Always set width and height attributes (or CSS aspect-ratio) on images and iframes to prevent layout shifts.',
        });
    }

    // INP recommendations
    if (issueIds.has('inp-poor') || issueIds.has('inp-needs')) {
        recs.push({
            id: 'rec-inp-scheduler', icon: '⚙️',
            title: 'Yield to the Browser Between Tasks',
            desc: 'Use scheduler.yield() or setTimeout(0) after long event handlers to allow the browser to respond to user input sooner.',
        });
    }

    // JS-heavy
    if (issueIds.has('heavy-js') || totals.script.size > 200 * 1024) {
        recs.push({
            id: 'rec-code-split', icon: '✂️',
            title: 'Code-Split & Lazy-Load JavaScript',
            desc: 'Use dynamic import() to split bundles and only load JS when needed. Defer non-critical scripts with defer or async attributes.',
        });
    }

    // Large images
    if (issueIds.has('large-images')) {
        recs.push({
            id: 'rec-modern-images', icon: '🎨',
            title: 'Adopt Modern Image Formats (WebP / AVIF)',
            desc: 'WebP saves ~30% over JPEG; AVIF saves ~50%. Use <picture> with <source type="image/avif"> for progressive enhancement.',
        });
    }

    // TTFB
    if (issueIds.has('ttfb-poor') || issueIds.has('ttfb-needs')) {
        recs.push({
            id: 'rec-cdn', icon: '🌐',
            title: 'Use a Content Delivery Network (CDN)',
            desc: 'Serve static assets from a CDN edge node geographically close to your users to drastically reduce TTFB.',
        });
    }

    // Resource count
    if (issueIds.has('resource-count') || issueIds.has('resource-count-info')) {
        recs.push({
            id: 'rec-resource-hints', icon: '🔗',
            title: 'Use Resource Hints (preload, prefetch, modulepreload)',
            desc: 'Prioritize critical resources with <link rel="preload"> and fetch next-page resources in the background with prefetch.',
        });
    }

    // Always include global recs (up to 3 not already covered)
    let globalAdded = 0;
    for (const rec of GLOBAL_RECS) {
        if (!recs.find(r => r.id === rec.id) && globalAdded < 3) {
            recs.push(rec);
            globalAdded++;
        }
    }

    // Attach Remediation Snippets (Day 7)
    recs.forEach(rec => {
        if (window.WebPulse.remediations) {
            rec.snippet = window.WebPulse.remediations.getSnippet(rec);
        }
    });

    return recs;
}

// Expose
window.WebPulse = window.WebPulse || {};
window.WebPulse.recommendations = { detectIssues, generateRecommendations };

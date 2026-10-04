/**
 * performance.js — WebPulse Performance Metrics Collector
 *
 * Collects Core Web Vitals (LCP, CLS, INP) via PerformanceObserver
 * and loading metrics (FCP, TTFB, DOM, Page Load) via Navigation Timing API v2.
 */

'use strict';

/* ─── CWV Thresholds ─────────────────────────────────────── */
const THRESHOLDS = {
    LCP:  { good: 2500,  poor: 4000  },  // ms
    CLS:  { good: 0.1,   poor: 0.25  },  // unitless
    INP:  { good: 200,   poor: 500   },  // ms
    FCP:  { good: 1800,  poor: 3000  },  // ms
    TTFB: { good: 800,   poor: 1800  },  // ms
};

/**
 * Classify a metric value against thresholds.
 * Uses user-configured thresholds from Settings when available.
 * @returns {'good'|'needs-improvement'|'poor'}
 */
function classify(metric, value) {
    // Try to get user threshold from settings
    const settingsKey = { LCP: 'lcp', CLS: 'cls', INP: 'inp', FCP: 'fcp', TTFB: 'ttfb' }[metric];
    let t;
    if (settingsKey && window.WebPulse && window.WebPulse.settings) {
        const st = window.WebPulse.settings.getThreshold(settingsKey);
        t = { good: st.good, poor: st.needs };
    } else {
        t = THRESHOLDS[metric];
    }
    if (!t) return 'good';
    if (value <= t.good) return 'good';
    if (value <= t.poor) return 'needs-improvement';
    return 'poor';
}

/**
 * Format milliseconds to a human-readable string.
 * Uses user's timeUnit preference from Settings when available.
 * @param {number} ms
 * @returns {string}
 */
function formatMs(ms) {
    if (ms === null || ms === undefined || isNaN(ms)) return 'N/A';
    // Use settings formatter if available
    if (window.WebPulse && window.WebPulse.settings) {
        return window.WebPulse.settings.formatTime(ms);
    }
    if (ms >= 1000) return (ms / 1000).toFixed(2) + 's';
    return Math.round(ms) + 'ms';
}

/* ─── CWV Collection via PerformanceObserver ─────────────── */

/**
 * Collects LCP, CLS, and INP using PerformanceObserver.
 * Resolves with the collected values after a brief observation window.
 *
 * @returns {Promise<{lcp: number|null, cls: number|null, inp: number|null}>}
 */
function collectCoreWebVitals() {
    return new Promise((resolve) => {
        const result = { lcp: null, cls: null, inp: null };
        const observers = [];
        let lcpDone = false, clsDone = false, inpDone = false;

        // --- LCP ---
        if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
            try {
                const lcpObs = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    if (entries.length > 0) {
                        result.lcp = entries[entries.length - 1].startTime;
                    }
                });
                lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
                observers.push(lcpObs);
                lcpDone = true;
            } catch (e) { lcpDone = true; }
        } else { lcpDone = true; }

        // --- CLS ---
        if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
            try {
                let clsScore = 0;
                let sessionVal = 0, sessionStart = 0, lastEntry = 0;

                const clsObs = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            const now = entry.startTime;
                            if (now - lastEntry > 1000 || now - sessionStart > 5000) {
                                sessionVal = 0;
                                sessionStart = now;
                            }
                            sessionVal += entry.value;
                            lastEntry = now;
                            if (sessionVal > clsScore) clsScore = sessionVal;
                        }
                    }
                    result.cls = clsScore;
                });
                clsObs.observe({ type: 'layout-shift', buffered: true });
                observers.push(clsObs);
                clsDone = true;
            } catch (e) { clsDone = true; }
        } else { clsDone = true; }

        // --- INP ---
        if (PerformanceObserver.supportedEntryTypes.includes('event')) {
            try {
                let maxInp = 0;
                const inpObs = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > maxInp) {
                            maxInp = entry.duration;
                            result.inp = maxInp;
                        }
                    }
                });
                inpObs.observe({ type: 'event', buffered: true, durationThreshold: 16 });
                observers.push(inpObs);
                inpDone = true;
            } catch (e) { inpDone = true; }
        } else { inpDone = true; }

        // Observe for 1 second then resolve
        setTimeout(() => {
            observers.forEach(o => { try { o.disconnect(); } catch (_) {} });
            // INP: if no interactions, report 0ms (best)
            if (result.inp === null) result.inp = 0;
            // CLS: if nothing observed, 0
            if (result.cls === null) result.cls = 0;
            resolve(result);
        }, 1200);
    });
}

/* ─── Navigation Timing / Paint Timing ───────────────────── */

/**
 * Collects loading metrics from NavigationTiming API v2 and PaintTiming API.
 * @returns {{fcp: number|null, ttfb: number|null, domLoad: number|null, pageLoad: number|null}}
 */
function collectLoadingMetrics() {
    const result = { fcp: null, ttfb: null, domLoad: null, pageLoad: null };

    // Navigation Timing v2
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
        const nav = navEntries[0];
        result.ttfb    = nav.responseStart - nav.requestStart;
        result.domLoad = nav.domContentLoadedEventEnd - nav.fetchStart;
        result.pageLoad = nav.loadEventEnd - nav.fetchStart;
    }

    // Paint Timing (FCP)
    const paintEntries = performance.getEntriesByType('paint');
    for (const entry of paintEntries) {
        if (entry.name === 'first-contentful-paint') {
            result.fcp = entry.startTime;
            break;
        }
    }

    // Fallback via PerformanceObserver for FCP
    if (result.fcp === null) {
        try {
            const buffered = performance.getEntriesByName('first-contentful-paint');
            if (buffered.length > 0) result.fcp = buffered[0].startTime;
        } catch (_) {}
    }

    return result;
}

/* ─── Public API ─────────────────────────────────────────── */

/**
 * Main function: collects all performance metrics.
 * @returns {Promise<Object>} Full performance data snapshot
 */
async function collectAllMetrics() {
    const [cwv, loading] = await Promise.all([
        collectCoreWebVitals(),
        Promise.resolve(collectLoadingMetrics()),
    ]);

    return {
        timestamp: Date.now(),
        cwv: {
            lcp: { value: cwv.lcp, status: classify('LCP', cwv.lcp), formatted: formatMs(cwv.lcp) },
            cls: { value: cwv.cls, status: classify('CLS', cwv.cls), formatted: cwv.cls !== null ? cwv.cls.toFixed(3) : 'N/A' },
            inp: { value: cwv.inp, status: classify('INP', cwv.inp), formatted: formatMs(cwv.inp) },
        },
        loading: {
            fcp:      { value: loading.fcp,      formatted: formatMs(loading.fcp) },
            ttfb:     { value: loading.ttfb,     formatted: formatMs(loading.ttfb) },
            domLoad:  { value: loading.domLoad,  formatted: formatMs(loading.domLoad) },
            pageLoad: { value: loading.pageLoad, formatted: formatMs(loading.pageLoad) },
        },
    };
}

// Expose to other modules via window namespace
window.WebPulse = window.WebPulse || {};
window.WebPulse.performance = { collectAllMetrics, classify, formatMs, THRESHOLDS };

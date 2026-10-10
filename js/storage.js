/**
 * storage.js — WebPulse LocalStorage Persistence Layer
 *
 * Provides CRUD operations for saved performance reports,
 * using localStorage as the persistent backing store.
 *
 * Report schema:
 * {
 *   id:        string (UUID-like)
 *   title:     string
 *   timestamp: number (Unix ms)
 *   score:     number
 *   rating:    string
 *   tags:      string[]
 *   notes:     string
 *   metrics:   Object  (full metricsData snapshot)
 *   resources: Object  (resource summary — counts & totals only, not full list)
 *   issues:    Array
 *   breakdown: Object  (score breakdown)
 * }
 */

'use strict';

const STORAGE_KEY = 'webpulse_reports_v1';
const MAX_REPORTS  = 50; // Maximum stored reports

/* ─── Utilities ──────────────────────────────────────────── */

/**
 * Generates a unique report ID.
 * @returns {string}
 */
function generateId() {
    const rand = Math.random().toString(36).slice(2, 10);
    return 'rpt_' + Date.now().toString(36) + '_' + rand;
}

/* ─── Core Storage Operations ────────────────────────────── */

/**
 * Loads all saved reports from localStorage.
 * @returns {Array}
 */
function loadReports() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('[WebPulse Storage] Failed to load reports:', e);
        return [];
    }
}

/**
 * Persists the reports array to localStorage.
 * @param {Array} reports
 * @returns {boolean} success
 */
function saveReports(reports) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        return true;
    } catch (e) {
        console.error('[WebPulse Storage] Failed to save reports:', e);
        // QuotaExceededError — try pruning oldest reports
        if (e.name === 'QuotaExceededError' && reports.length > 5) {
            const trimmed = reports.slice(-Math.floor(reports.length / 2));
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
                return true;
            } catch (_) {}
        }
        return false;
    }
}

/* ─── Public API ─────────────────────────────────────────── */

/**
 * Saves a new performance report to storage.
 *
 * @param {Object} params
 * @param {number} params.score
 * @param {string} params.rating
 * @param {Object} params.breakdown
 * @param {Object} params.metricsData
 * @param {Object} params.resourceData
 * @param {Array}  params.issues
 * @param {string} [params.title]
 * @returns {{ success: boolean, report: Object|null }}
 */
function saveReport({ score, rating, breakdown, metricsData, resourceData, issues, title }) {
    const reports = loadReports();

    const report = {
        id:        generateId(),
        title:     title || 'Analysis — ' + new Date().toLocaleString(),
        timestamp: Date.now(),
        score,
        rating,
        tags:      [],
        notes:     '',
        breakdown,
        metrics: {
            cwv: {
                lcp: metricsData.cwv.lcp,
                cls: metricsData.cwv.cls,
                inp: metricsData.cwv.inp,
            },
            loading: {
                fcp:      metricsData.loading.fcp,
                ttfb:     metricsData.loading.ttfb,
                domLoad:  metricsData.loading.domLoad,
                pageLoad: metricsData.loading.pageLoad,
            },
        },
        resources: {
            count:              resourceData.count,
            grandTotal:         resourceData.grandTotal,
            grandTotalFormatted: resourceData.grandTotalFormatted,
            totals:             resourceData.totals,
        },
        issues: issues.map(({ id, severity, title: iTitle, desc }) => ({ id, severity, iTitle, desc })),
    };

    // Enforce max reports limit (FIFO)
    reports.unshift(report);
    if (reports.length > MAX_REPORTS) reports.splice(MAX_REPORTS);

    const success = saveReports(reports);
    return { success, report: success ? report : null };
}

/**
 * Returns all stored reports, sorted newest first.
 * @returns {Array}
 */
function getAllReports() {
    return loadReports().sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Returns a single report by ID.
 * @param {string} id
 * @returns {Object|null}
 */
function getReport(id) {
    return loadReports().find(r => r.id === id) || null;
}

/**
 * Updates a report's mutable fields (title, tags, notes).
 * @param {string} id
 * @param {{ title?: string, tags?: string[], notes?: string }} updates
 * @returns {boolean}
 */
function updateReport(id, updates) {
    const reports = loadReports();
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return false;

    const allowed = ['title', 'tags', 'notes'];
    for (const key of allowed) {
        if (key in updates) reports[idx][key] = updates[key];
    }

    return saveReports(reports);
}

/**
 * Deletes a report by ID.
 * @param {string} id
 * @returns {boolean}
 */
function deleteReport(id) {
    const reports = loadReports().filter(r => r.id !== id);
    return saveReports(reports);
}

/**
 * Deletes ALL stored reports.
 * @returns {boolean}
 */
function clearAllReports() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Searches reports by title, tags, or formatted date.
 * @param {string} query
 * @returns {Array}
 */
function searchReports(query) {
    if (!query || !query.trim()) return getAllReports();
    const q = query.toLowerCase().trim();
    return getAllReports().filter(r => {
        const dateStr = new Date(r.timestamp).toLocaleString().toLowerCase();
        const tagStr  = (r.tags || []).join(' ').toLowerCase();
        return (
            r.title.toLowerCase().includes(q) ||
            tagStr.includes(q) ||
            dateStr.includes(q)
        );
    });
}

/**
 * Returns the number of stored reports.
 * @returns {number}
 */
function getReportCount() {
    return loadReports().length;
}

/**
 * Seeds a high-quality set of benchmark demo reports across multiple timestamps.
 * Enables instant testing of charts, historical trends, and delta comparisons.
 * @returns {Array} Array of seeded report objects
 */
function seedSampleReports() {
    const now = Date.now();
    const day = 86400000;

    const samples = [
        {
            id: 'rpt_sample_01',
            title: 'Storefront Baseline (Heavy Assets)',
            timestamp: now - (day * 3) - 7200000,
            score: 64,
            rating: 'Needs Work',
            preset: 'ecommerce',
            tags: ['baseline', 'storefront', 'v1.0'],
            notes: 'Initial production build before asset compression. Large images and unbundled vendor scripts.',
            breakdown: { cwv: 54, loading: 62, resources: 58, issues: 80 },
            metrics: {
                cwv: {
                    lcp: { value: 3850, formatted: '3.85s', status: 'poor' },
                    cls: { value: 0.195, formatted: '0.195', status: 'needs-improvement' },
                    inp: { value: 260,  formatted: '260ms', status: 'needs-improvement' }
                },
                loading: {
                    fcp:      { value: 2150, formatted: '2.15s', status: 'poor' },
                    ttfb:     { value: 520,  formatted: '520ms', status: 'needs-improvement' },
                    domLoad:  { value: 2400, formatted: '2.40s', status: 'poor' },
                    pageLoad: { value: 4650, formatted: '4.65s', status: 'poor' }
                }
            },
            resources: {
                count: 42,
                grandTotal: 3420000,
                grandTotalFormatted: '3.26 MB',
                totals: {
                    script: { count: 12, size: 1450000, sizeFormatted: '1.38 MB' },
                    link:   { count: 4,  size: 240000,  sizeFormatted: '234.4 KB' },
                    img:    { count: 18, size: 1520000, sizeFormatted: '1.45 MB' },
                    font:   { count: 4,  size: 150000,  sizeFormatted: '146.5 KB' },
                    fetch:  { count: 3,  size: 45000,   sizeFormatted: '43.9 KB' },
                    other:  { count: 1,  size: 15000,   sizeFormatted: '14.6 KB' }
                }
            },
            issues: [
                { id: 'large-images', severity: 'critical', iTitle: 'Unoptimized Imagery', desc: 'Hero banner PNG exceeds 800 KB' },
                { id: 'heavy-js', severity: 'warning', iTitle: 'Large Script Payloads', desc: 'Vendor bundle exceeds 500 KB' }
            ],
            auditsScore: 70
        },
        {
            id: 'rpt_sample_02',
            title: 'Storefront v2 (Image Optimization & Lazy Load)',
            timestamp: now - (day * 2) - 3600000,
            score: 79,
            rating: 'Good',
            preset: 'ecommerce',
            tags: ['optimization', 'images', 'v1.1'],
            notes: 'Converted PNG/JPEGs to WebP and added native loading=lazy. CLS and LCP significantly improved.',
            breakdown: { cwv: 76, loading: 78, resources: 75, issues: 90 },
            metrics: {
                cwv: {
                    lcp: { value: 2600, formatted: '2.60s', status: 'needs-improvement' },
                    cls: { value: 0.080, formatted: '0.080', status: 'good' },
                    inp: { value: 210,  formatted: '210ms', status: 'needs-improvement' }
                },
                loading: {
                    fcp:      { value: 1650, formatted: '1.65s', status: 'needs-improvement' },
                    ttfb:     { value: 380,  formatted: '380ms', status: 'good' },
                    domLoad:  { value: 1750, formatted: '1.75s', status: 'needs-improvement' },
                    pageLoad: { value: 3100, formatted: '3.10s', status: 'needs-improvement' }
                }
            },
            resources: {
                count: 36,
                grandTotal: 1840000,
                grandTotalFormatted: '1.75 MB',
                totals: {
                    script: { count: 12, size: 1250000, sizeFormatted: '1.19 MB' },
                    link:   { count: 4,  size: 180000,  sizeFormatted: '175.8 KB' },
                    img:    { count: 14, size: 260000,  sizeFormatted: '253.9 KB' },
                    font:   { count: 3,  size: 110000,  sizeFormatted: '107.4 KB' },
                    fetch:  { count: 2,  size: 28000,   sizeFormatted: '27.3 KB' },
                    other:  { count: 1,  size: 12000,   sizeFormatted: '11.7 KB' }
                }
            },
            issues: [
                { id: 'render-blocking-css', severity: 'warning', iTitle: 'Render-blocking CSS', desc: 'Main stylesheet loaded synchronously' }
            ],
            auditsScore: 85
        },
        {
            id: 'rpt_sample_03',
            title: 'SaaS Platform v2 (Code Splitting & SPA Hydration)',
            timestamp: now - day + 1800000,
            score: 87,
            rating: 'Good',
            preset: 'saas_spa',
            tags: ['spa', 'code-splitting', 'v2.0'],
            notes: 'Implemented dynamic route chunks and reduced main-thread script evaluation.',
            breakdown: { cwv: 88, loading: 85, resources: 84, issues: 95 },
            metrics: {
                cwv: {
                    lcp: { value: 1950, formatted: '1.95s', status: 'good' },
                    cls: { value: 0.035, formatted: '0.035', status: 'good' },
                    inp: { value: 145,  formatted: '145ms', status: 'good' }
                },
                loading: {
                    fcp:      { value: 1350, formatted: '1.35s', status: 'good' },
                    ttfb:     { value: 220,  formatted: '220ms', status: 'good' },
                    domLoad:  { value: 1420, formatted: '1.42s', status: 'good' },
                    pageLoad: { value: 2450, formatted: '2.45s', status: 'good' }
                }
            },
            resources: {
                count: 24,
                grandTotal: 980000,
                grandTotalFormatted: '957.0 KB',
                totals: {
                    script: { count: 8,  size: 540000, sizeFormatted: '527.3 KB' },
                    link:   { count: 3,  size: 120000, sizeFormatted: '117.2 KB' },
                    img:    { count: 6,  size: 190000, sizeFormatted: '185.5 KB' },
                    font:   { count: 3,  size: 95000,  sizeFormatted: '92.8 KB' },
                    fetch:  { count: 3,  size: 25000,  sizeFormatted: '24.4 KB' },
                    other:  { count: 1,  size: 10000,  sizeFormatted: '9.8 KB' }
                }
            },
            issues: [],
            auditsScore: 92
        },
        {
            id: 'rpt_sample_04',
            title: 'Optimized Jamstack Build (Production Edge)',
            timestamp: now - 1800000,
            score: 97,
            rating: 'Excellent',
            preset: 'jamstack_blog',
            tags: ['jamstack', 'production', 'edge-cdn'],
            notes: 'Static pre-rendering, edge CDN caching, AVIF hero images, and inlined critical CSS.',
            breakdown: { cwv: 98, loading: 96, resources: 97, issues: 100 },
            metrics: {
                cwv: {
                    lcp: { value: 920,   formatted: '920ms', status: 'good' },
                    cls: { value: 0.005, formatted: '0.005', status: 'good' },
                    inp: { value: 45,   formatted: '45ms',  status: 'good' }
                },
                loading: {
                    fcp:      { value: 680,  formatted: '680ms', status: 'good' },
                    ttfb:     { value: 75,   formatted: '75ms',  status: 'good' },
                    domLoad:  { value: 720,  formatted: '720ms', status: 'good' },
                    pageLoad: { value: 1150, formatted: '1.15s', status: 'good' }
                }
            },
            resources: {
                count: 14,
                grandTotal: 340000,
                grandTotalFormatted: '332.0 KB',
                totals: {
                    script: { count: 3, size: 95000,  sizeFormatted: '92.8 KB' },
                    link:   { count: 2, size: 28000,  sizeFormatted: '27.3 KB' },
                    img:    { count: 4, size: 140000, sizeFormatted: '136.7 KB' },
                    font:   { count: 2, size: 62000,  sizeFormatted: '60.5 KB' },
                    fetch:  { count: 2, size: 10000,  sizeFormatted: '9.8 KB' },
                    other:  { count: 1, size: 5000,   sizeFormatted: '4.9 KB' }
                }
            },
            issues: [],
            auditsScore: 98
        }
    ];

    const current = loadReports();
    // Prepend without duplicating IDs
    const currentIds = new Set(current.map(r => r.id));
    const toAdd = samples.filter(s => !currentIds.has(s.id));
    const merged = [...toAdd, ...current];
    saveReports(merged);

    // Sync to IDB if available
    if (window.WebPulse && window.WebPulse.idb) {
        toAdd.forEach(r => window.WebPulse.idb.saveReportIDB(r).catch(() => {}));
    }

    return merged;
}

// Expose
window.WebPulse = window.WebPulse || {};
window.WebPulse.storage = {
    saveReport,
    getAllReports,
    getReport,
    updateReport,
    deleteReport,
    clearAllReports,
    searchReports,
    getReportCount,
    seedSampleReports,
};

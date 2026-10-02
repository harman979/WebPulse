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
};

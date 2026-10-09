/**
 * idb-storage.js — WebPulse IndexedDB Persistence, Cookie Tracker & DB Backup/Restore
 *
 * Provides a native asynchronous IndexedDB storage layer for large audit reports,
 * transparent dual-sync with localStorage, an RFC-compliant cookie session manager,
 * and one-click JSON database backup and restore capabilities.
 */

'use strict';

(function () {
    const DB_NAME = 'WebPulseDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'reports';

    let dbInstance = null;

    /* ─── 1. Native IndexedDB Operations ─────────────────────── */

    /**
     * Initializes or opens the IndexedDB database.
     * @returns {Promise<IDBDatabase>}
     */
    function openDB() {
        if (dbInstance) return Promise.resolve(dbInstance);

        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                console.warn('[WebPulse IDB] IndexedDB not supported by browser.');
                return resolve(null);
            }

            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('score', 'score', { unique: false });
                    store.createIndex('rating', 'rating', { unique: false });
                    store.createIndex('preset', 'preset', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                dbInstance = event.target.result;
                resolve(dbInstance);
            };

            request.onerror = (event) => {
                console.error('[WebPulse IDB] Error opening database:', event.target.error);
                resolve(null); // Fallback gracefully to localStorage
            };
        });
    }

    /**
     * Saves or updates a report in IndexedDB.
     */
    async function saveReportIDB(report) {
        const db = await openDB();
        if (!db) return false;

        return new Promise((resolve) => {
            try {
                const tx = db.transaction([STORE_NAME], 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put(report);

                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (err) {
                console.warn('[WebPulse IDB] Put error:', err);
                resolve(false);
            }
        });
    }

    /**
     * Retrieves all reports stored in IndexedDB.
     */
    async function getAllReportsIDB() {
        const db = await openDB();
        if (!db) return [];

        return new Promise((resolve) => {
            try {
                const tx = db.transaction([STORE_NAME], 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.getAll();

                req.onsuccess = () => {
                    const items = req.result || [];
                    items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    resolve(items);
                };
                req.onerror = () => resolve([]);
            } catch (err) {
                console.warn('[WebPulse IDB] getAll error:', err);
                resolve([]);
            }
        });
    }

    /**
     * Deletes a single report by ID from IndexedDB.
     */
    async function deleteReportIDB(id) {
        const db = await openDB();
        if (!db) return false;

        return new Promise((resolve) => {
            try {
                const tx = db.transaction([STORE_NAME], 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.delete(id);

                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (err) {
                resolve(false);
            }
        });
    }

    /**
     * Clears all reports from IndexedDB.
     */
    async function clearAllReportsIDB() {
        const db = await openDB();
        if (!db) return false;

        return new Promise((resolve) => {
            try {
                const tx = db.transaction([STORE_NAME], 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.clear();

                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (err) {
                resolve(false);
            }
        });
    }

    /**
     * Mirrors existing reports from localStorage into IndexedDB on initialization.
     */
    async function syncFromLocalStorage() {
        if (!window.WebPulse || !window.WebPulse.storage) return;
        const localReports = window.WebPulse.storage.getAllReports();
        if (!localReports.length) return;

        const db = await openDB();
        if (!db) return;

        try {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            localReports.forEach(r => store.put(r));
        } catch (e) {
            console.warn('[WebPulse IDB] Initial sync error:', e);
        }
    }

    /* ─── 2. Cookie Session Tracker ──────────────────────────── */

    /**
     * Sets a cookie with optional expiration in days.
     */
    function setCookie(name, value, days = 30) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
    }

    /**
     * Gets a cookie by name.
     */
    function getCookie(name) {
        const nameEQ = encodeURIComponent(name) + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length));
            }
        }
        return null;
    }

    /**
     * Removes a cookie.
     */
    function removeCookie(name) {
        document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
    }

    /**
     * Returns an object of all accessible cookies.
     */
    function getAllCookies() {
        const cookies = {};
        if (!document.cookie) return cookies;
        document.cookie.split(';').forEach(c => {
            const parts = c.trim().split('=');
            if (parts.length >= 2) {
                cookies[decodeURIComponent(parts[0])] = decodeURIComponent(parts.slice(1).join('='));
            }
        });
        return cookies;
    }

    // Auto-track last visited page in cookies
    try {
        const currentPage = location.pathname.split('/').pop() || 'index.html';
        setCookie('webpulse_last_page', currentPage, 7);
    } catch (_) {}

    /* ─── 3. Full Database Backup & Restore ──────────────────── */

    /**
     * Exports full database (localStorage + IndexedDB reports + preferences) as a JSON download.
     */
    async function exportBackupJSON() {
        let reports = [];
        const idbReports = await getAllReportsIDB();
        const localReports = window.WebPulse && window.WebPulse.storage ? window.WebPulse.storage.getAllReports() : [];

        // Merge and deduplicate by ID
        const map = new Map();
        localReports.forEach(r => map.set(r.id, r));
        idbReports.forEach(r => map.set(r.id, r));
        reports = Array.from(map.values());

        const backupData = {
            appName: 'WebPulse',
            version: '2.0.0',
            exportedAt: new Date().toISOString(),
            reportCount: reports.length,
            reports,
            settings: window.WebPulse && window.WebPulse.settings ? window.WebPulse.settings.get() : {},
            cookies: getAllCookies()
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `webpulse-backup-${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Restores database from imported JSON data.
     */
    async function restoreBackupJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.reports || !Array.isArray(data.reports)) {
                return { success: false, message: 'Invalid backup format: missing reports array.' };
            }

            // Restore reports into localStorage
            if (window.WebPulse && window.WebPulse.storage) {
                const existing = window.WebPulse.storage.getAllReports();
                const map = new Map();
                existing.forEach(r => map.set(r.id, r));
                data.reports.forEach(r => map.set(r.id, r));
                const merged = Array.from(map.values());
                localStorage.setItem('webpulse_reports_v1', JSON.stringify(merged));
            }

            // Restore reports into IndexedDB
            const db = await openDB();
            if (db) {
                const tx = db.transaction([STORE_NAME], 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                data.reports.forEach(r => store.put(r));
            }

            // Restore settings if present
            if (data.settings && window.WebPulse && window.WebPulse.settings) {
                window.WebPulse.settings.save(data.settings);
            }

            return {
                success: true,
                message: `Successfully restored ${data.reports.length} report snapshots!`
            };
        } catch (err) {
            console.error('[WebPulse Backup] Restore error:', err);
            return { success: false, message: `Failed to restore: ${err.message}` };
        }
    }

    /**
     * Computes storage usage metrics.
     */
    async function getStorageStats() {
        let localBytes = 0;
        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    localBytes += (localStorage[key].length + key.length) * 2;
                }
            }
        } catch (_) {}

        const idbReports = await getAllReportsIDB();
        const localReports = window.WebPulse && window.WebPulse.storage ? window.WebPulse.storage.getAllReports() : [];

        let quotaEstimate = null;
        if (navigator.storage && navigator.storage.estimate) {
            try {
                quotaEstimate = await navigator.storage.estimate();
            } catch (_) {}
        }

        return {
            localStorageBytes: localBytes,
            localStorageKB: (localBytes / 1024).toFixed(1),
            localReportCount: localReports.length,
            idbReportCount: idbReports.length,
            cookiesCount: Object.keys(getAllCookies()).length,
            quotaEstimate
        };
    }

    // Auto sync on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        syncFromLocalStorage();
    });

    window.WebPulse = window.WebPulse || {};
    window.WebPulse.idb = {
        openDB,
        saveReportIDB,
        getAllReportsIDB,
        deleteReportIDB,
        clearAllReportsIDB,
        syncFromLocalStorage,
        getStorageStats,
        exportBackupJSON,
        restoreBackupJSON
    };
    window.WebPulse.cookies = {
        get: getCookie,
        set: setCookie,
        remove: removeCookie,
        getAll: getAllCookies
    };
})();

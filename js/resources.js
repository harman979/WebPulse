/**
 * resources.js — WebPulse Resource Timing Analyzer
 *
 * Parses Resource Timing API entries to classify and profile
 * all loaded resources: JS, CSS, Images, Fonts, Fetch/XHR, and Other.
 */

'use strict';

/* ─── Resource Type Classification ───────────────────────── */

const TYPE_MAP = {
    script: { label: 'JS',       tag: 'script', bar: 'bar-script' },
    link:   { label: 'CSS',      tag: 'link',   bar: 'bar-link'   },
    img:    { label: 'Image',    tag: 'img',    bar: 'bar-img'    },
    font:   { label: 'Font',     tag: 'font',   bar: 'bar-font'   },
    fetch:  { label: 'Fetch/XHR', tag: 'fetch', bar: 'bar-fetch'  },
    other:  { label: 'Other',    tag: 'other',  bar: 'bar-other'  },
};

/**
 * Determines a resource's type key from a PerformanceResourceTiming entry.
 * @param {PerformanceResourceTiming} entry
 * @returns {string}
 */
function getResourceType(entry) {
    const url  = entry.name.toLowerCase();
    const init = entry.initiatorType;

    if (init === 'script')  return 'script';
    if (init === 'link')    return 'link';
    if (init === 'img' || init === 'image') return 'img';
    if (init === 'css')     return 'link';
    if (init === 'fetch' || init === 'xmlhttprequest' || init === 'beacon') return 'fetch';

    // Font detection by URL pattern
    if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)) return 'font';
    if (/\.(png|jpe?g|gif|webp|svg|avif|ico)(\?|$)/i.test(url)) return 'img';
    if (/\.css(\?|$)/i.test(url)) return 'link';
    if (/\.m?js(\?|$)/i.test(url)) return 'script';

    return 'other';
}

/**
 * Extracts a short display name from a resource URL.
 * @param {string} url
 * @returns {string}
 */
function getResourceName(url) {
    try {
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);
        const filename = parts[parts.length - 1] || u.hostname;
        // Truncate very long filenames
        if (filename.length > 60) return '…' + filename.slice(-57);
        return filename || u.hostname;
    } catch (_) {
        return url.slice(0, 60);
    }
}

/**
 * Formats bytes into a human-readable size string.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

/**
 * Collects and classifies all resource timing entries.
 * @returns {Object} Processed resource data
 */
function collectResources() {
    const entries = performance.getEntriesByType('resource');

    const resources = entries.map(entry => {
        const type     = getResourceType(entry);
        const typeInfo = TYPE_MAP[type];
        const size     = entry.transferSize || entry.encodedBodySize || 0;
        const duration = entry.duration || 0;
        const startTime = entry.startTime || 0;

        // Parse hostname domain
        let domain = 'same-origin';
        try {
            const urlObj = new URL(entry.name);
            domain = urlObj.hostname || 'same-origin';
            if (urlObj.origin === window.location.origin) {
                domain = 'same-origin (' + domain + ')';
            }
        } catch (_) {}

        // Timing Phase Calculation (ms)
        const fetchStart = entry.fetchStart || startTime;
        const domainLookupStart = entry.domainLookupStart || fetchStart;
        const domainLookupEnd = entry.domainLookupEnd || domainLookupStart;
        const connectStart = entry.connectStart || domainLookupEnd;
        const connectEnd = entry.connectEnd || connectStart;
        const secureConnectionStart = entry.secureConnectionStart || 0;
        const requestStart = entry.requestStart || connectEnd;
        const responseStart = entry.responseStart || requestStart;
        const responseEnd = entry.responseEnd || (startTime + duration);

        const stalled  = Math.max(0, domainLookupStart - startTime);
        const dns      = Math.max(0, domainLookupEnd - domainLookupStart);
        const connect  = Math.max(0, (secureConnectionStart > 0 ? secureConnectionStart : connectEnd) - connectStart);
        const ssl      = Math.max(0, secureConnectionStart > 0 ? connectEnd - secureConnectionStart : 0);
        const ttfb     = Math.max(0, responseStart - requestStart);
        const download = Math.max(0, responseEnd - responseStart);

        return {
            name:       getResourceName(entry.name),
            url:        entry.name,
            type,
            typeLabel:  typeInfo.label,
            typeTag:    typeInfo.tag,
            barClass:   typeInfo.bar,
            size,
            encodedBodySize: entry.encodedBodySize || size,
            decodedBodySize: entry.decodedBodySize || size,
            sizeFormatted: formatBytes(size),
            duration:   Math.round(duration),
            durationFormatted: duration > 0 ? Math.round(duration) + 'ms' : '0ms',
            startTime:  Math.round(startTime * 10) / 10,
            endTime:    Math.round(responseEnd * 10) / 10,
            domain,
            initiatorType: entry.initiatorType || 'other',
            nextHopProtocol: entry.nextHopProtocol || 'h2',
            renderBlocking: entry.renderBlockingStatus === 'blocking',
            phases: {
                stalled:  Math.round(stalled * 10) / 10,
                dns:      Math.round(dns * 10) / 10,
                connect:  Math.round(connect * 10) / 10,
                ssl:      Math.round(ssl * 10) / 10,
                ttfb:     Math.round(ttfb * 10) / 10,
                download: Math.round(download * 10) / 10,
            }
        };
    });

    // Compute per-type totals
    const totals = {};
    let grandTotal = 0;

    for (const key of Object.keys(TYPE_MAP)) {
        totals[key] = { count: 0, size: 0 };
    }

    for (const r of resources) {
        totals[r.type].count++;
        totals[r.type].size += r.size;
        grandTotal += r.size;
    }

    // Compute percentage of total size per type
    for (const key of Object.keys(totals)) {
        const pct = grandTotal > 0 ? (totals[key].size / grandTotal) * 100 : 0;
        totals[key].pct = Math.round(pct * 10) / 10;
        totals[key].sizeFormatted = formatBytes(totals[key].size);
    }

    return {
        resources,
        totals,
        grandTotal,
        grandTotalFormatted: formatBytes(grandTotal),
        count: resources.length,
    };
}

/**
 * Sorts resources by a given key.
 * @param {Array} resources
 * @param {string} sortKey - 'size-desc'|'size-asc'|'duration-desc'|'duration-asc'|'name-asc'
 * @returns {Array}
 */
function sortResources(resources, sortKey) {
    const arr = [...resources];
    switch (sortKey) {
        case 'size-desc':     return arr.sort((a, b) => b.size - a.size);
        case 'size-asc':      return arr.sort((a, b) => a.size - b.size);
        case 'duration-desc': return arr.sort((a, b) => b.duration - a.duration);
        case 'duration-asc':  return arr.sort((a, b) => a.duration - b.duration);
        case 'name-asc':      return arr.sort((a, b) => a.name.localeCompare(b.name));
        default:              return arr;
    }
}

/**
 * Filters resources by type key.
 * @param {Array} resources
 * @param {string} filterType - 'all' or a type key
 * @returns {Array}
 */
function filterResources(resources, filterType) {
    if (filterType === 'all') return resources;
    return resources.filter(r => r.type === filterType);
}

// Expose
window.WebPulse = window.WebPulse || {};
window.WebPulse.resources = {
    collectResources,
    sortResources,
    filterResources,
    formatBytes,
    getResourceName,
    TYPE_MAP,
};

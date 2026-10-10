'use strict';

/* ─── Utilities ──────────────────────────────────────────── */
function triggerDownload(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
}

function safeFilename(str) {
    return str.replace(/[^a-z0-9_\-\s]/gi, '_').replace(/\s+/g, '_').slice(0, 60);
}

/* ─── JSON Export ────────────────────────────────────────── */
function exportReportJSON(report) {
    if (!report) return;
    var filename = 'webpulse_' + safeFilename(report.title) + '_' + report.id + '.json';
    triggerDownload(filename, JSON.stringify(report, null, 2), 'application/json');
}

/* ─── CSV Export ─────────────────────────────────────────── */
function exportReportCSV(report) {
    if (!report) return;
    var cwv     = (report.metrics && report.metrics.cwv)     || {};
    var loading = (report.metrics && report.metrics.loading) || {};
    var res     = report.resources || {};
    var bd      = report.breakdown || {};
    function na(v) { return (v === null || v === undefined) ? 'N/A' : v; }

    var rows = [
        ['Field', 'Value', 'Unit'],
        ['Report Title',        report.title,                                   ''],
        ['Date',                new Date(report.timestamp).toLocaleString(),     ''],
        ['WebPulse Score',      report.score,                                   '/ 100'],
        ['Rating',              report.rating,                                  ''],
        ['LCP',                 na(cwv.lcp  && cwv.lcp.value),                  'ms'],
        ['LCP Status',          na(cwv.lcp  && cwv.lcp.status),                 ''],
        ['CLS',                 na(cwv.cls  && cwv.cls.value),                  ''],
        ['CLS Status',          na(cwv.cls  && cwv.cls.status),                 ''],
        ['INP',                 na(cwv.inp  && cwv.inp.value),                  'ms'],
        ['INP Status',          na(cwv.inp  && cwv.inp.status),                 ''],
        ['FCP',                 na(loading.fcp      && loading.fcp.value),      'ms'],
        ['TTFB',                na(loading.ttfb     && loading.ttfb.value),     'ms'],
        ['DOM Load',            na(loading.domLoad  && loading.domLoad.value),  'ms'],
        ['Page Load',           na(loading.pageLoad && loading.pageLoad.value), 'ms'],
        ['Resource Count',      res.count || 0,                                 ''],
        ['Total Size',          res.grandTotalFormatted || '0 B',               ''],
        ['Score CWV 40%',       bd.cwv        || '--',                          ''],
        ['Score Loading 25%',   bd.loading    || '--',                          ''],
        ['Score Resources 20%', bd.resources  || '--',                          ''],
        ['Tags',                (report.tags || []).join('; '),                 ''],
        ['Notes',               report.notes || '',                             ''],
    ];

    var csv = rows.map(function(row) {
        return row.map(function(cell) {
            return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"';
        }).join(',');
    }).join('\r\n');

    triggerDownload(
        'webpulse_' + safeFilename(report.title) + '_' + report.id + '.csv',
        csv,
        'text/csv;charset=utf-8;'
    );
}

/* ─── Print / PDF Export ─────────────────────────────────── */
function exportReportPrint(report) {
    if (!report) return;
    var cwv     = (report.metrics && report.metrics.cwv)     || {};
    var loading = (report.metrics && report.metrics.loading) || {};
    var res     = report.resources || {};
    var bd      = report.breakdown || {};
    var issues  = report.issues    || [];
    var tags    = (report.tags || []).join(', ') || '\u2014';

    function scoreColor(s) {
        return s >= 75 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444';
    }
    function sDot(st) {
        var c = { good: '#22c55e', 'needs-improvement': '#f59e0b', poor: '#ef4444' };
        return '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + (c[st] || '#94a3b8') + ';margin-right:5px;"></span>';
    }
    function mBlock(label, val, st) {
        return '<div style="flex:1;min-width:110px;background:#f8fafc;border-radius:10px;padding:14px 16px;border:1px solid #e2e8f0;">' +
            '<div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;">' + label + '</div>' +
            '<div style="font-size:22px;font-weight:800;color:#0f172a;">' + (val || 'N/A') + '</div>' +
            (st ? '<div style="font-size:11px;margin-top:4px;">' + sDot(st) + st + '</div>' : '') +
            '</div>';
    }

    var col = scoreColor(report.score);
    var parts = [
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">',
        '<title>WebPulse Report \u2014 ' + report.title + '</title>',
        '<style>',
        '@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap\');',
        '*{margin:0;padding:0;box-sizing:border-box}',
        'body{font-family:\'Inter\',sans-serif;color:#0f172a;background:#fff;padding:36px;font-size:14px}',
        'h1{font-size:24px;font-weight:800;margin-bottom:4px}',
        'h2{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin:24px 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px}',
        '.hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;padding-bottom:18px;border-bottom:3px solid #6366f1}',
        '.brand{font-size:20px;font-weight:800;color:#6366f1}',
        '.mr{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px}',
        '.sb{font-size:40px;font-weight:900;color:' + col + ';line-height:1}',
        '.br{display:flex;gap:12px;margin-bottom:8px}',
        '.bb{flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center}',
        '.bl{font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase}',
        '.bv{font-size:20px;font-weight:800;color:#0f172a;margin-top:2px}',
        '.ir{display:flex;align-items:flex-start;gap:10px;padding:8px 12px;border-radius:8px;background:#fafafa;border:1px solid #f1f5f9;margin-bottom:5px}',
        '.sv{font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;text-transform:uppercase}',
        '.sc{background:#fee2e2;color:#dc2626}.sh{background:#ffedd5;color:#ea580c}',
        '.sm{background:#fef9c3;color:#ca8a04}.si{background:#dcfce7;color:#16a34a}',
        '.ft{margin-top:36px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}',
        '.nb{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:13px;color:#334155;margin-top:8px;white-space:pre-wrap}',
        '@media print{body{padding:18px}}',
        '</style></head><body>',
        '<div class="hd"><div><div class="brand">\u26a1 WebPulse</div><h1>' + report.title + '</h1>',
        '<div style="font-size:11px;color:#64748b;margin-top:4px">Generated: ' + new Date(report.timestamp).toLocaleString() + ' &nbsp;|&nbsp; ID: ' + report.id + '</div></div>',
        '<div style="text-align:right"><div class="sb">' + report.score + '</div><div style="font-size:11px;color:#94a3b8;font-weight:600">/100 \u00b7 ' + report.rating + '</div></div></div>',
        '<h2>Core Web Vitals</h2><div class="mr">',
        mBlock('LCP', cwv.lcp  && cwv.lcp.formatted,  cwv.lcp  && cwv.lcp.status),
        mBlock('CLS', cwv.cls  && cwv.cls.formatted,  cwv.cls  && cwv.cls.status),
        mBlock('INP', cwv.inp  && cwv.inp.formatted,  cwv.inp  && cwv.inp.status),
        '</div><h2>Loading Performance</h2><div class="mr">',
        mBlock('FCP',       loading.fcp      && loading.fcp.formatted),
        mBlock('TTFB',      loading.ttfb     && loading.ttfb.formatted),
        mBlock('DOM Load',  loading.domLoad  && loading.domLoad.formatted),
        mBlock('Page Load', loading.pageLoad && loading.pageLoad.formatted),
        '</div><h2>Score Breakdown</h2><div class="br">',
        '<div class="bb"><div class="bl">CWV (40%)</div><div class="bv">'       + (bd.cwv       || '--') + '</div></div>',
        '<div class="bb"><div class="bl">Loading (25%)</div><div class="bv">'   + (bd.loading   || '--') + '</div></div>',
        '<div class="bb"><div class="bl">Resources (20%)</div><div class="bv">' + (bd.resources || '--') + '</div></div></div>',
        '<h2>Resources</h2><div class="mr">',
        mBlock('Total Resources', String(res.count || 0)),
        mBlock('Total Transfer',  res.grandTotalFormatted || '0 B'),
        '</div>',
    ];

    if (issues.length > 0) {
        parts.push('<h2>Detected Issues (' + issues.length + ')</h2>');
        issues.forEach(function(i) {
            var sev = i.severity || 'info';
            var cls = sev === 'critical' ? 'sc' : sev === 'high' ? 'sh' : sev === 'medium' ? 'sm' : 'si';
            parts.push('<div class="ir"><span class="sv ' + cls + '">' + sev + '</span><div><strong>' +
                (i.iTitle || i.title || '') + '</strong>' +
                (i.desc ? '<div style="font-size:12px;color:#64748b;margin-top:2px">' + i.desc + '</div>' : '') +
                '</div></div>');
        });
    }

    parts.push('<h2>Tags &amp; Notes</h2>');
    parts.push('<div style="font-size:12px;color:#475569"><strong>Tags:</strong> ' + tags + '</div>');
    if (report.notes) parts.push('<div class="nb">' + report.notes + '</div>');
    parts.push('<div class="ft">WebPulse Performance Analyzer &nbsp;&middot;&nbsp; Printed ' + new Date().toLocaleString() + '</div>');
    parts.push('</body></html>');

    var win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Pop-up blocked! Allow pop-ups for this page and try again.'); return; }
    win.document.write(parts.join(''));
    win.document.close();
    win.focus();
    setTimeout(function() { win.print(); }, 700);
}

/* ─── Shareable URL ──────────────────────────────────────── */
function generateShareURL(report) {
    if (!report) return '';
    var cwv     = (report.metrics && report.metrics.cwv)     || {};
    var loading = (report.metrics && report.metrics.loading) || {};
    var res     = report.resources || {};

    var snapshot = {
        t:   report.title,
        ts:  report.timestamp,
        sc:  report.score,
        rt:  report.rating,
        lcp: cwv.lcp  && cwv.lcp.formatted,
        cls: cwv.cls  && cwv.cls.formatted,
        inp: cwv.inp  && cwv.inp.formatted,
        fcp: loading.fcp      && loading.fcp.formatted,
        ttfb:loading.ttfb     && loading.ttfb.formatted,
        pl:  loading.pageLoad && loading.pageLoad.formatted,
        rc:  res.count,
        rs:  res.grandTotalFormatted,
        tg:  (report.tags || []).join(','),
    };

    var encodeB64 = function(str) {
        if (typeof window !== 'undefined' && typeof window.btoa === 'function') return window.btoa(str);
        if (typeof btoa === 'function') return btoa(str);
        if (typeof Buffer !== 'undefined') return Buffer.from(str).toString('base64');
        return '';
    };

    var decodeB64 = function(b64) {
        if (typeof window !== 'undefined' && typeof window.atob === 'function') return window.atob(b64);
        if (typeof atob === 'function') return atob(b64);
        if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('binary');
        return '';
    };

    var encoded = encodeB64(encodeURIComponent(JSON.stringify(snapshot)));
    var base    = (typeof window !== 'undefined' && window.location && window.location.href) 
        ? window.location.href.replace(/[^\/]*$/, '') 
        : '';
    return base + 'share.html?d=' + encoded;
}

function loadSharedReport() {
    try {
        var params  = new URLSearchParams((typeof window !== 'undefined' && window.location) ? window.location.search : '');
        var encoded = params.get('d');
        if (!encoded) return null;
        var decodeB64 = function(b64) {
            if (typeof window !== 'undefined' && typeof window.atob === 'function') return window.atob(b64);
            if (typeof atob === 'function') return atob(b64);
            if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('binary');
            return '';
        };
        return JSON.parse(decodeURIComponent(decodeB64(encoded)));
    } catch (e) {
        console.warn('[WebPulse Export] Failed to decode shared report:', e);
        return null;
    }
}

/* ─── Expose ─────────────────────────────────────────────── */
window.WebPulse = window.WebPulse || {};
window.WebPulse.export = {
    exportReportJSON:  exportReportJSON,
    exportReportCSV:   exportReportCSV,
    exportReportPrint: exportReportPrint,
    generateShareURL:  generateShareURL,
    loadSharedReport:  loadSharedReport,
};

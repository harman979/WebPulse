/**
 * reports.js — WebPulse Reports History Page Controller
 *
 * Handles: loading & rendering all saved reports, search,
 * multi-select, row actions (view, delete), report detail modal,
 * side-by-side comparison modal, tag/note editing.
 *
 * Dependencies: js/main.js, js/storage.js
 */

'use strict';

/* ─── State ──────────────────────────────────────────────── */
let state = {
    allReports:       [],
    selectedIds:      new Set(),
    currentQuery:     '',
    openModalReportId: null,   // track which report is open in the detail modal
};

/* ─── DOM References ─────────────────────────────────────── */
const $ = id => document.getElementById(id);

const el = {
    reportCountBadge:   $('reportCountBadge'),
    compareBtn:         $('compareReportsBtn'),
    clearAllBtn:        $('clearAllReportsBtn'),
    exportAllJSONBtn:   $('exportAllJSONBtn'),
    searchInput:        $('reportSearchInput'),
    reportsTableBody:   $('reportsTableBody'),
    selectAllCheckbox:  $('selectAllCheckbox'),

    // Detail modal
    detailModal:        $('reportDetailsModal'),
    modalBackdrop:      $('modalBackdrop'),
    modalReportTitle:   $('modalReportTitle'),
    modalReportBody:    $('modalReportBody'),
    modalCloseBtn:      $('modalCloseBtn'),
    modalCloseFooter:   $('modalCloseFooterBtn'),
    // Modal export
    modalExportJSON:    $('modalExportJSONBtn'),
    modalExportCSV:     $('modalExportCSVBtn'),
    modalExportPrint:   $('modalExportPrintBtn'),
    modalShare:         $('modalShareBtn'),
    modalBadge:         $('modalBadgeBtn'),

    // Comparison modal
    comparisonModal:    $('comparisonModal'),
    comparisonBackdrop: $('comparisonBackdrop'),
    comparisonBody:     $('comparisonBody'),
    comparisonCloseBtn: $('comparisonCloseBtn'),
    comparisonCloseFtr: $('comparisonCloseFooterBtn'),
};

/* ─── Utility ────────────────────────────────────────────── */
function escHtml(str) {
    if (typeof str !== 'string') str = String(str ?? '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60)  return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return new Date(timestamp).toLocaleDateString();
}

function scorePillClass(score) {
    if (score >= 75) return 'score-good';
    if (score >= 50) return 'score-needs';
    return 'score-poor';
}

function lcpColorClass(lcpMs) {
    if (!lcpMs) return '';
    if (lcpMs <= 2500) return 'good';
    if (lcpMs <= 4000) return 'needs';
    return 'poor';
}

/* ─── Toolbar State ──────────────────────────────────────── */
function updateToolbar() {
    const count    = state.allReports.length;
    const selCount = state.selectedIds.size;

    el.reportCountBadge.textContent = `${count} Report${count !== 1 ? 's' : ''}`;
    el.clearAllBtn.disabled         = count === 0;
    if (el.exportAllJSONBtn) el.exportAllJSONBtn.disabled = count === 0;

    el.compareBtn.textContent = '';
    el.compareBtn.innerHTML   = `<span class="btn-icon">⚖️</span> Compare Selected (${selCount})`;
    el.compareBtn.disabled    = selCount !== 2;
}

/* ─── Table Rendering ────────────────────────────────────── */
function renderTable(reports) {
    if (reports.length === 0) {
        el.reportsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table">
                    <div class="empty-state">
                        <p>${state.currentQuery ? '🔍 No reports match your search.' : '📁 No saved reports yet.'}</p>
                        ${!state.currentQuery ? `<a href="analyzer.html" class="btn btn-primary">Run First Analysis ⚡</a>` : ''}
                    </div>
                </td>
            </tr>`;
        el.selectAllCheckbox.checked       = false;
        el.selectAllCheckbox.indeterminate = false;
        return;
    }

    el.reportsTableBody.innerHTML = reports.map(r => {
        const isSelected = state.selectedIds.has(r.id);
        const lcpMs = r.metrics?.cwv?.lcp?.value;
        const lcpFormatted = r.metrics?.cwv?.lcp?.formatted || 'N/A';
        const tagHtml = (r.tags || []).map(t => `<span class="tag-chip">${escHtml(t)}</span>`).join('');

        return `
        <tr class="${isSelected ? 'row-selected' : ''}" data-id="${escHtml(r.id)}">
            <td>
                <input type="checkbox" class="select-checkbox" data-id="${escHtml(r.id)}"
                    ${isSelected ? 'checked' : ''} title="Select report" aria-label="Select report">
            </td>
            <td>
                <span class="report-title-cell" data-action="view" data-id="${escHtml(r.id)}">${escHtml(r.title)}</span>
            </td>
            <td>
                <span class="date-cell">
                    ${new Date(r.timestamp).toLocaleString()}
                    <span class="date-relative">${formatRelativeTime(r.timestamp)}</span>
                </span>
            </td>
            <td>
                <span class="score-pill ${scorePillClass(r.score)}">${r.score}</span>
            </td>
            <td>
                <span class="lcp-cell ${lcpColorClass(lcpMs)}">${escHtml(lcpFormatted)}</span>
            </td>
            <td class="col-resources">
                <span class="res-cell">${r.resources?.count || 0} / ${r.resources?.grandTotalFormatted || '0 B'}</span>
            </td>
            <td class="col-tags">
                <div class="tags-cell">
                    ${tagHtml}
                    ${r.notes ? `<div class="report-note" title="${escHtml(r.notes)}">📝 ${escHtml(r.notes.slice(0, 40))}${r.notes.length > 40 ? '…' : ''}</div>` : ''}
                </div>
            </td>
            <td>
                <div class="row-actions">
                    <button class="action-btn" data-action="view" data-id="${escHtml(r.id)}" title="View Details">👁️</button>
                    <button class="action-btn" data-action="badge" data-id="${escHtml(r.id)}" title="SVG Status Badge">🏷️</button>
                    <button class="action-btn delete-btn" data-action="delete" data-id="${escHtml(r.id)}" title="Delete Report">🗑️</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    // Update select-all checkbox state
    const allChecked  = reports.every(r => state.selectedIds.has(r.id));
    const someChecked = reports.some(r => state.selectedIds.has(r.id));
    el.selectAllCheckbox.checked       = allChecked;
    el.selectAllCheckbox.indeterminate = !allChecked && someChecked;
}

/* ─── Load & Refresh ─────────────────────────────────────── */
function refresh() {
    state.allReports = window.WebPulse.storage.searchReports(state.currentQuery);
    renderTable(state.allReports);
    updateToolbar();
}

/* ─── Detail Modal ───────────────────────────────────────── */
function openDetailModal(reportId) {
    const r = window.WebPulse.storage.getReport(reportId);
    if (!r) return;

    el.modalReportTitle.textContent = r.title;

    const cwv = r.metrics?.cwv || {};
    const loading = r.metrics?.loading || {};
    const breakdown = r.breakdown || {};

    el.modalReportBody.innerHTML = `
        <!-- Score Overview -->
        <div class="detail-section">
            <div class="detail-section-title">WebPulse Score</div>
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                <span class="score-pill ${scorePillClass(r.score)}" style="font-size:1.5rem;padding:.5rem 1.2rem;">${r.score}</span>
                <span style="color:var(--text-muted);font-size:.875rem;">${escHtml(r.rating)} · ${new Date(r.timestamp).toLocaleString()}</span>
            </div>
        </div>

        <!-- Core Web Vitals -->
        <div class="detail-section">
            <div class="detail-section-title">Core Web Vitals</div>
            <div class="detail-metrics-grid">
                <div class="detail-metric-box">
                    <div class="detail-metric-label">LCP</div>
                    <div class="detail-metric-val ${cwv.lcp?.status === 'good' ? 'good' : cwv.lcp?.status === 'poor' ? 'poor' : 'needs'}">${escHtml(cwv.lcp?.formatted || 'N/A')}</div>
                </div>
                <div class="detail-metric-box">
                    <div class="detail-metric-label">CLS</div>
                    <div class="detail-metric-val ${cwv.cls?.status === 'good' ? 'good' : cwv.cls?.status === 'poor' ? 'poor' : 'needs'}">${escHtml(cwv.cls?.formatted || 'N/A')}</div>
                </div>
                <div class="detail-metric-box">
                    <div class="detail-metric-label">INP</div>
                    <div class="detail-metric-val ${cwv.inp?.status === 'good' ? 'good' : cwv.inp?.status === 'poor' ? 'poor' : 'needs'}">${escHtml(cwv.inp?.formatted || 'N/A')}</div>
                </div>
            </div>
        </div>

        <!-- Loading Metrics -->
        <div class="detail-section">
            <div class="detail-section-title">Loading Metrics</div>
            <div class="detail-metrics-grid">
                <div class="detail-metric-box">
                    <div class="detail-metric-label">FCP</div>
                    <div class="detail-metric-val">${escHtml(loading.fcp?.formatted || 'N/A')}</div>
                </div>
                <div class="detail-metric-box">
                    <div class="detail-metric-label">TTFB</div>
                    <div class="detail-metric-val">${escHtml(loading.ttfb?.formatted || 'N/A')}</div>
                </div>
                <div class="detail-metric-box">
                    <div class="detail-metric-label">Page Load</div>
                    <div class="detail-metric-val">${escHtml(loading.pageLoad?.formatted || 'N/A')}</div>
                </div>
            </div>
        </div>

        <!-- Score Breakdown -->
        <div class="detail-section">
            <div class="detail-section-title">Score Breakdown</div>
            <div class="detail-metrics-grid">
                <div class="detail-metric-box"><div class="detail-metric-label">CWV (40%)</div><div class="detail-metric-val">${breakdown.cwv ?? '--'}</div></div>
                <div class="detail-metric-box"><div class="detail-metric-label">Loading (25%)</div><div class="detail-metric-val">${breakdown.loading ?? '--'}</div></div>
                <div class="detail-metric-box"><div class="detail-metric-label">Resources (20%)</div><div class="detail-metric-val">${breakdown.resources ?? '--'}</div></div>
            </div>
        </div>

        <!-- Resources Summary -->
        <div class="detail-section">
            <div class="detail-section-title">Resources</div>
            <p style="font-size:.875rem;color:var(--text-muted);">
                ${r.resources?.count || 0} total resources · ${escHtml(r.resources?.grandTotalFormatted || '0 B')} transferred
            </p>
        </div>

        <!-- Tags & Notes Editor -->
        <div class="detail-section">
            <div class="detail-section-title">Tags &amp; Notes</div>
            <div style="display:flex;flex-direction:column;gap:.75rem;">
                <div>
                    <label style="font-size:.75rem;color:var(--text-dimmed);font-weight:600;display:block;margin-bottom:.35rem;">TAGS (comma-separated)</label>
                    <input type="text" id="tagEditorInput" class="form-control"
                        placeholder="e.g. production, homepage, before-deploy"
                        value="${escHtml((r.tags || []).join(', '))}">
                </div>
                <div>
                    <label style="font-size:.75rem;color:var(--text-dimmed);font-weight:600;display:block;margin-bottom:.35rem;">NOTES</label>
                    <textarea id="noteEditorInput" class="form-control" rows="3"
                        placeholder="Add a note about this analysis…" style="resize:vertical;">${escHtml(r.notes || '')}</textarea>
                </div>
                <button class="btn btn-primary" id="saveMetaBtn" data-id="${escHtml(r.id)}" style="align-self:flex-start;">
                    <span class="btn-icon">💾</span> Save Changes
                </button>
            </div>
        </div>`;

    // Wire save-meta button
    document.getElementById('saveMetaBtn')?.addEventListener('click', (e) => {
        const id    = e.currentTarget.dataset.id;
        const tags  = document.getElementById('tagEditorInput').value.split(',').map(t => t.trim()).filter(Boolean);
        const notes = document.getElementById('noteEditorInput').value.trim();
        window.WebPulse.storage.updateReport(id, { tags, notes });
        refresh();
        // Visual feedback
        const btn = e.currentTarget;
        btn.innerHTML = '<span class="btn-icon">✅</span> Saved!';
        setTimeout(() => { btn.innerHTML = '<span class="btn-icon">💾</span> Save Changes'; }, 2000);
    });

    el.detailModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    state.openModalReportId = reportId;
}

function closeDetailModal() {
    el.detailModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.openModalReportId = null;
}

/* ─── Comparison Modal ───────────────────────────────────── */
function openComparisonModal() {
    if (state.selectedIds.size !== 2) return;

    const [id1, id2] = [...state.selectedIds];
    const r1 = window.WebPulse.storage.getReport(id1);
    const r2 = window.WebPulse.storage.getReport(id2);

    if (!r1 || !r2) return;

    const rows = [
        { label: 'WebPulse Score',  emoji: '⚡', v1: r1.score,                                       v2: r2.score,                                       unit: '',   lowerBetter: false },
        { label: 'LCP',             emoji: '🖼️', v1: r1.metrics?.cwv?.lcp?.value,                    v2: r2.metrics?.cwv?.lcp?.value,                    unit: 'ms', lowerBetter: true  },
        { label: 'CLS',             emoji: '📐', v1: r1.metrics?.cwv?.cls?.value,                    v2: r2.metrics?.cwv?.cls?.value,                    unit: '',   lowerBetter: true  },
        { label: 'INP',             emoji: '👆', v1: r1.metrics?.cwv?.inp?.value,                    v2: r2.metrics?.cwv?.inp?.value,                    unit: 'ms', lowerBetter: true  },
        { label: 'FCP',             emoji: '🎨', v1: r1.metrics?.loading?.fcp?.value,                v2: r2.metrics?.loading?.fcp?.value,                unit: 'ms', lowerBetter: true  },
        { label: 'TTFB',            emoji: '🌐', v1: r1.metrics?.loading?.ttfb?.value,               v2: r2.metrics?.loading?.ttfb?.value,               unit: 'ms', lowerBetter: true  },
        { label: 'Page Load',       emoji: '⏱️', v1: r1.metrics?.loading?.pageLoad?.value,           v2: r2.metrics?.loading?.pageLoad?.value,           unit: 'ms', lowerBetter: true  },
        { label: 'Resources',       emoji: '📦', v1: r1.resources?.count,                            v2: r2.resources?.count,                            unit: '',   lowerBetter: true  },
        { label: 'Total Size',      emoji: '💾', v1: r1.resources?.grandTotal,                       v2: r2.resources?.grandTotal,                       unit: 'B',  lowerBetter: true, formatFn: window.WebPulse.resources?.formatBytes },
    ];

    function fmt(val, unit, fn) {
        if (val === null || val === undefined || isNaN(val)) return 'N/A';
        if (fn) return fn(val);
        if (unit === 'ms') return val >= 1000 ? (val / 1000).toFixed(2) + 's' : Math.round(val) + 'ms';
        return typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(3)) : val;
    }

    // Returns delta badge HTML for Report B column (how B compares to A)
    function deltaBadge(v1, v2, lowerBetter) {
        if (v1 == null || v2 == null || isNaN(v1) || isNaN(v2)) return '<span class="delta-badge delta-neutral">N/A</span>';
        if (v1 === v2) return '<span class="delta-badge delta-neutral">Same</span>';
        const diff     = v2 - v1;            // positive = B went up, negative = B went down
        const absDiff  = Math.abs(diff);
        const pct      = Math.abs((diff / (v1 || 1)) * 100).toFixed(1);
        // "Better" for B: lowerBetter → diff < 0 (B lower), else diff > 0 (B higher)
        const bBetter  = lowerBetter ? diff < 0 : diff > 0;
        const arrow    = diff > 0 ? '▲' : '▼';
        const cls      = bBetter ? 'delta-badge delta-better' : 'delta-badge delta-worse';
        return `<span class="${cls}">${arrow} ${pct}%</span>`;
    }

    // Determine winner by score
    const winnerBanner = (() => {
        const s1 = r1.score ?? 0, s2 = r2.score ?? 0;
        if (s1 === s2) return `<div class="comparison-winner tie">🤝 Tie — Both scored ${s1}/100</div>`;
        const winner = s1 > s2 ? r1 : r2;
        const margin = Math.abs(s1 - s2);
        const cls    = s1 > s2 ? 'a' : 'b';
        return `<div class="comparison-winner winner-${cls}">🏆 <strong>${escHtml(winner.title)}</strong> wins by ${margin} points</div>`;
    })();

    el.comparisonBody.innerHTML = `
        ${winnerBanner}
        <div class="comparison-table-wrap">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th class="cmp-th-metric">Metric</th>
                        <th class="cmp-th-val">
                            <div class="cmp-report-label cmp-label-a">A</div>
                            <div class="cmp-report-name">${escHtml(r1.title)}</div>
                            <div class="cmp-report-date">${new Date(r1.timestamp).toLocaleDateString()}</div>
                        </th>
                        <th class="cmp-th-val">
                            <div class="cmp-report-label cmp-label-b">B</div>
                            <div class="cmp-report-name">${escHtml(r2.title)}</div>
                            <div class="cmp-report-date">${new Date(r2.timestamp).toLocaleDateString()}</div>
                        </th>
                        <th class="cmp-th-delta">Change (A→B)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map((row, i) => {
                        const val1 = fmt(row.v1, row.unit, row.formatFn);
                        const val2 = fmt(row.v2, row.unit, row.formatFn);
                        const delta = deltaBadge(row.v1, row.v2, row.lowerBetter);
                        const rowClass = i % 2 === 0 ? 'cmp-row-even' : '';
                        return `
                    <tr class="cmp-row ${rowClass}">
                        <td class="cmp-metric-name">${escHtml(row.emoji)} ${escHtml(row.label)}</td>
                        <td class="cmp-metric-val">${escHtml(String(val1))}</td>
                        <td class="cmp-metric-val">${escHtml(String(val2))}</td>
                        <td class="cmp-metric-delta">${delta}</td>
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;

    el.comparisonModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeComparisonModal() {
    el.comparisonModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

/* ─── Event Delegation: Table ─────────────────────────────── */
function wireTableEvents() {
    el.reportsTableBody.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        const id     = e.target.closest('[data-id]')?.dataset.id;
        const chk    = e.target.closest('.select-checkbox');

        if (chk && id) {
            // Checkbox toggle
            if (chk.checked) state.selectedIds.add(id);
            else              state.selectedIds.delete(id);
            // Update row highlight
            const row = chk.closest('tr');
            if (row) row.classList.toggle('row-selected', chk.checked);
            updateToolbar();
            return;
        }

        if (action === 'view' && id) { openDetailModal(id); return; }

        if (action === 'badge' && id) {
            const r = window.WebPulse.storage.getReport(id);
            if (r && window.WebPulse.badge) window.WebPulse.badge.showBadgeModal(r.score, r.title);
            return;
        }

        if (action === 'delete' && id) {
            if (!confirm('Delete this report? This cannot be undone.')) return;
            state.selectedIds.delete(id);
            window.WebPulse.storage.deleteReport(id);
            refresh();
        }
    });
}

/* ─── Select All ─────────────────────────────────────────── */
function wireSelectAll() {
    el.selectAllCheckbox.addEventListener('change', () => {
        const checked = el.selectAllCheckbox.checked;
        state.allReports.forEach(r => {
            if (checked) state.selectedIds.add(r.id);
            else         state.selectedIds.delete(r.id);
        });
        refresh();
    });
}

/* ─── Search ─────────────────────────────────────────────── */
function wireSearch() {
    let debounceTimer;
    el.searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.currentQuery = el.searchInput.value.trim();
            refresh();
        }, 250);
    });
}

/* ─── Toolbar Buttons ────────────────────────────────────── */
function wireToolbar() {
    el.compareBtn.addEventListener('click', openComparisonModal);

    el.clearAllBtn.addEventListener('click', () => {
        if (!confirm(`Delete all ${state.allReports.length} reports? This cannot be undone.`)) return;
        state.selectedIds.clear();
        window.WebPulse.storage.clearAllReports();
        refresh();
    });

    // Export All as JSON
    el.exportAllJSONBtn?.addEventListener('click', () => {
        const all = window.WebPulse.storage.getAllReports();
        if (!all.length) return;
        const exp = window.WebPulse.export;
        if (!exp) return;
        const blob    = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
        const url     = URL.createObjectURL(blob);
        const a       = document.createElement('a');
        a.href        = url;
        a.download    = 'webpulse_all_reports_' + Date.now() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
}

/* ─── Modal Close Wiring ─────────────────────────────────── */
function wireModals() {
    // Detail modal
    el.modalCloseBtn?.addEventListener('click', closeDetailModal);
    el.modalCloseFooter?.addEventListener('click', closeDetailModal);
    el.modalBackdrop?.addEventListener('click', closeDetailModal);

    // Modal export buttons
    el.modalExportJSON?.addEventListener('click', () => {
        const r = state.openModalReportId && window.WebPulse.storage.getReport(state.openModalReportId);
        if (r) window.WebPulse.export.exportReportJSON(r);
    });
    el.modalExportCSV?.addEventListener('click', () => {
        const r = state.openModalReportId && window.WebPulse.storage.getReport(state.openModalReportId);
        if (r) window.WebPulse.export.exportReportCSV(r);
    });
    el.modalExportPrint?.addEventListener('click', () => {
        const r = state.openModalReportId && window.WebPulse.storage.getReport(state.openModalReportId);
        if (r) window.WebPulse.export.exportReportPrint(r);
    });
    el.modalShare?.addEventListener('click', () => {
        const r = state.openModalReportId && window.WebPulse.storage.getReport(state.openModalReportId);
        if (!r) return;
        const url = window.WebPulse.export.generateShareURL(r);
        navigator.clipboard.writeText(url).then(() => {
            const btn = el.modalShare;
            const orig = btn.innerHTML;
            btn.innerHTML = '<span class="btn-icon">✅</span> Copied!';
            setTimeout(() => { btn.innerHTML = orig; }, 2500);
        }).catch(() => {
            window.prompt('Copy this share link:', url);
        });
    });
    el.modalBadge?.addEventListener('click', () => {
        const r = state.openModalReportId && window.WebPulse.storage.getReport(state.openModalReportId);
        if (r && window.WebPulse.badge) {
            window.WebPulse.badge.showBadgeModal(r.score, r.title);
        }
    });

    // Comparison modal
    el.comparisonCloseBtn?.addEventListener('click', closeComparisonModal);
    el.comparisonCloseFtr?.addEventListener('click', closeComparisonModal);
    el.comparisonBackdrop?.addEventListener('click', closeComparisonModal);

    // Escape key closes whichever modal is open
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (el.comparisonModal.getAttribute('aria-hidden') === 'false') closeComparisonModal();
        else if (el.detailModal.getAttribute('aria-hidden') === 'false') closeDetailModal();
    });
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    wireTableEvents();
    wireSelectAll();
    wireSearch();
    wireToolbar();
    wireModals();
    refresh();
});

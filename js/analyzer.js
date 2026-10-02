/**
 * analyzer.js — WebPulse Analyzer Page Controller
 *
 * Orchestrates the analyzer dashboard: runs the analysis pipeline,
 * renders all UI sections, and wires up interactive controls.
 *
 * Dependencies (loaded before this script):
 *   js/main.js, js/performance.js, js/resources.js,
 *   js/scoring.js, js/recommendations.js, js/storage.js
 */

'use strict';

/* ─── State ──────────────────────────────────────────────── */
let state = {
    lastMetrics:   null,
    lastResources: null,
    lastIssues:    null,
    lastScore:     null,
    currentFilter: 'all',
    currentSort:   'size-desc',
    analysisRan:   false,
};

/* ─── DOM References ─────────────────────────────────────── */
const $ = id => document.getElementById(id);

const el = {
    runBtn:        $('runAnalysisBtn'),
    saveBtn:       $('saveReportBtn'),
    statusBadge:   $('analysisStatus'),
    scoreValue:    $('scoreValue'),
    scoreCircle:   $('scoreCircle'),
    scoreRating:   $('scoreRating'),
    lcpVal:        $('lcpVal'),    lcpStatus:  $('lcpStatus'),  lcpBox:  $('lcpBox'),
    clsVal:        $('clsVal'),    clsStatus:  $('clsStatus'),  clsBox:  $('clsBox'),
    inpVal:        $('inpVal'),    inpStatus:  $('inpStatus'),  inpBox:  $('inpBox'),
    fcpVal:        $('fcpVal'),
    ttfbVal:       $('ttfbVal'),
    domVal:        $('domVal'),
    pageLoadVal:   $('pageLoadVal'),
    resourceVisualizer:   $('resourceVisualizer'),
    resourceTableBody:    $('resourceTableBody'),
    resourceSummaryBadge: $('resourceSummaryBadge'),
    resourceFilterGroup:  $('resourceFilterGroup'),
    sortSelect:           $('sortSelect'),
    issuesList:           $('issuesList'),
    recommendationsList:  $('recommendationsList'),
};

/* ─── Status Helpers ─────────────────────────────────────── */
function setStatus(text, cls = '') {
    el.statusBadge.textContent = text;
    el.statusBadge.className = 'status-badge' + (cls ? ' ' + cls : '');
}

/* ─── Score Rendering ────────────────────────────────────── */
function renderScore(score, rating) {
    const { scoreClass, ratingClass } = window.WebPulse.scoring;

    el.scoreValue.textContent = score;
    el.scoreCircle.className = 'score-circle ' + scoreClass(score);

    el.scoreRating.textContent = rating;
    el.scoreRating.className = 'score-rating ' + ratingClass(rating);
}

/* ─── CWV Rendering ──────────────────────────────────────── */
function statusLabel(s) {
    return s === 'good' ? 'Good' : s === 'needs-improvement' ? 'Needs Work' : 'Poor';
}

function renderCWV(cwv) {
    // LCP
    el.lcpVal.textContent    = cwv.lcp.formatted;
    el.lcpStatus.textContent = statusLabel(cwv.lcp.status);
    el.lcpBox.className      = 'metric-box status-' + (cwv.lcp.status === 'needs-improvement' ? 'needs' : cwv.lcp.status);

    // CLS
    el.clsVal.textContent    = cwv.cls.formatted;
    el.clsStatus.textContent = statusLabel(cwv.cls.status);
    el.clsBox.className      = 'metric-box status-' + (cwv.cls.status === 'needs-improvement' ? 'needs' : cwv.cls.status);

    // INP
    el.inpVal.textContent    = cwv.inp.formatted;
    el.inpStatus.textContent = statusLabel(cwv.inp.status);
    el.inpBox.className      = 'metric-box status-' + (cwv.inp.status === 'needs-improvement' ? 'needs' : cwv.inp.status);
}

/* ─── Loading Metrics Rendering ──────────────────────────── */
function renderLoading(loading) {
    el.fcpVal.textContent      = loading.fcp.formatted;
    el.ttfbVal.textContent     = loading.ttfb.formatted;
    el.domVal.textContent      = loading.domLoad.formatted;
    el.pageLoadVal.textContent = loading.pageLoad.formatted;
}

/* ─── Resource Visualizer Bars ───────────────────────────── */
function renderResourceVisualizer(totals) {
    const types = ['script', 'link', 'img', 'font', 'fetch', 'other'];
    const maxSize = Math.max(...types.map(t => totals[t].size), 1);

    el.resourceVisualizer.innerHTML = types
        .filter(t => totals[t].size > 0)
        .map(type => {
            const { label, bar } = window.WebPulse.resources.TYPE_MAP[type];
            const pct = (totals[type].size / maxSize * 100).toFixed(1);
            return `
            <div class="resource-bar-row">
                <span class="resource-bar-label">${label}</span>
                <div class="resource-bar-track">
                    <div class="resource-bar-fill ${bar}" style="width:${pct}%"></div>
                </div>
                <span class="resource-bar-size">${totals[type].sizeFormatted}</span>
            </div>`;
        }).join('');
}

/* ─── Resource Table Rendering ───────────────────────────── */
function renderResourceTable(resources) {
    const { sortResources, filterResources } = window.WebPulse.resources;
    let filtered = filterResources(resources, state.currentFilter);
    let sorted   = sortResources(filtered, state.currentSort);

    if (sorted.length === 0) {
        el.resourceTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table">
                    No ${state.currentFilter === 'all' ? '' : state.currentFilter + ' '}resources found.
                </td>
            </tr>`;
        return;
    }

    el.resourceTableBody.innerHTML = sorted.map(r => `
        <tr>
            <td>
                <div class="resource-name-cell" title="${escHtml(r.url)}">${escHtml(r.name)}</div>
            </td>
            <td><span class="type-tag tag-${r.typeTag}">${escHtml(r.typeLabel)}</span></td>
            <td>${escHtml(r.sizeFormatted)}</td>
            <td>${escHtml(r.durationFormatted)}</td>
        </tr>`
    ).join('');
}

/* ─── Issues & Recommendations Rendering ─────────────────── */
function renderIssues(issues) {
    if (issues.length === 0) {
        el.issuesList.innerHTML = `<div class="empty-state">✅ No performance bottlenecks detected!</div>`;
        return;
    }
    el.issuesList.innerHTML = issues.map((issue, i) => `
        <div class="issue-item severity-${issue.severity}" style="animation-delay:${i * 0.05}s">
            <span class="issue-icon">${escHtml(issue.icon)}</span>
            <div class="issue-text">
                <div class="issue-title">${escHtml(issue.title)}</div>
                <div class="issue-desc">${escHtml(issue.desc)}</div>
            </div>
        </div>`
    ).join('');
}

function renderRecommendations(recs) {
    if (recs.length === 0) {
        el.recommendationsList.innerHTML = `<div class="empty-state">No specific recommendations at this time.</div>`;
        return;
    }
    el.recommendationsList.innerHTML = recs.map((rec, i) => `
        <div class="rec-item" style="animation-delay:${i * 0.05}s">
            <span class="rec-icon">${escHtml(rec.icon)}</span>
            <div class="rec-text">
                <div class="rec-title">${escHtml(rec.title)}</div>
                <div class="rec-desc">${escHtml(rec.desc)}</div>
            </div>
        </div>`
    ).join('');
}

/* ─── Resource Summary Badge ─────────────────────────────── */
function updateResourceBadge(resourceData) {
    el.resourceSummaryBadge.textContent =
        `${resourceData.count} Resources (${resourceData.grandTotalFormatted})`;
}

/* ─── Utility: HTML escape ───────────────────────────────── */
function escHtml(str) {
    if (typeof str !== 'string') str = String(str ?? '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ─── Main Analysis Pipeline ─────────────────────────────── */
async function runAnalysis() {
    if (el.runBtn.disabled) return;

    // Lock UI
    el.runBtn.disabled  = true;
    el.saveBtn.disabled = true;
    setStatus('Running…', 'running');

    try {
        // 1. Collect metrics
        const metricsData   = await window.WebPulse.performance.collectAllMetrics();
        const resourceData  = window.WebPulse.resources.collectResources();

        // 2. Detect issues
        const issues        = window.WebPulse.recommendations.detectIssues(metricsData, resourceData);

        // 3. Compute score
        const { score, rating, breakdown } = window.WebPulse.scoring.computeScore(metricsData, resourceData, issues);

        // 4. Generate recommendations
        const recs          = window.WebPulse.recommendations.generateRecommendations(issues, metricsData, resourceData);

        // 5. Persist to state
        state.lastMetrics   = metricsData;
        state.lastResources = resourceData;
        state.lastIssues    = issues;
        state.lastScore     = { score, rating, breakdown };
        state.analysisRan   = true;

        // 6. Render
        renderScore(score, rating);
        renderCWV(metricsData.cwv);
        renderLoading(metricsData.loading);
        renderResourceVisualizer(resourceData.totals);
        renderResourceTable(resourceData.resources);
        updateResourceBadge(resourceData);
        renderIssues(issues);
        renderRecommendations(recs);

        setStatus('Done', 'done');
        el.saveBtn.disabled = false;

    } catch (err) {
        console.error('[WebPulse Analyzer] Analysis failed:', err);
        setStatus('Error', '');
        el.issuesList.innerHTML = `<div class="empty-state" style="color:var(--danger)">⚠️ Analysis failed. Check console for details.</div>`;
    } finally {
        el.runBtn.disabled = false;
    }
}

/* ─── Save Report ────────────────────────────────────────── */
function handleSaveReport() {
    if (!state.analysisRan || !state.lastMetrics) return;

    const { success, report } = window.WebPulse.storage.saveReport({
        score:        state.lastScore.score,
        rating:       state.lastScore.rating,
        breakdown:    state.lastScore.breakdown,
        metricsData:  state.lastMetrics,
        resourceData: state.lastResources,
        issues:       state.lastIssues,
    });

    if (success) {
        el.saveBtn.disabled = true;
        el.saveBtn.innerHTML = '<span class="btn-icon">✅</span> Saved!';
        setTimeout(() => {
            el.saveBtn.innerHTML = '<span class="btn-icon">💾</span> Save Report';
            el.saveBtn.disabled = false;
        }, 2500);
    } else {
        alert('Failed to save report. LocalStorage may be full.');
    }
}

/* ─── Filter & Sort Controls ─────────────────────────────── */
function wireFilterButtons() {
    el.resourceFilterGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn || !state.analysisRan) return;

        el.resourceFilterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.dataset.filter;
        renderResourceTable(state.lastResources.resources);
    });
}

function wireSortSelect() {
    el.sortSelect.addEventListener('change', () => {
        if (!state.analysisRan) return;
        state.currentSort = el.sortSelect.value;
        renderResourceTable(state.lastResources.resources);
    });
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    el.runBtn.addEventListener('click', runAnalysis);
    el.saveBtn.addEventListener('click', handleSaveReport);
    wireFilterButtons();
    wireSortSelect();
});

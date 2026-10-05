/**
 * trends.js — WebPulse Historical Trends Page Controller
 *
 * Reads saved reports from storage, computes trend statistics,
 * renders charts via charts.js, and wires up all interactive controls.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Wait a tick for settings + storage to be fully initialised
    setTimeout(initTrends, 0);
});

/* ─── State ─────────────────────────────────────────────── */
let allReports    = [];
let filteredReports = [];
let activeRange   = 'all';  // 'all' | '10' | '20'

/* ─── Metric Definitions ─────────────────────────────────── */
const METRICS = {
    score:    { label: 'Score',     unit: '',      color: '#3b82f6', extract: r => r.score,                                       goodThresh: 75,   needsThresh: 50 },
    lcp:      { label: 'LCP',       unit: 'ms',    color: '#8b5cf6', extract: r => r.metrics?.cwv?.lcp?.value,                    goodThresh: 2500, needsThresh: 4000 },
    cls:      { label: 'CLS',       unit: 'cls',   color: '#f59e0b', extract: r => r.metrics?.cwv?.cls?.value,                    goodThresh: 0.1,  needsThresh: 0.25 },
    inp:      { label: 'INP',       unit: 'ms',    color: '#ec4899', extract: r => r.metrics?.cwv?.inp?.value,                    goodThresh: 200,  needsThresh: 500 },
    fcp:      { label: 'FCP',       unit: 'ms',    color: '#06b6d4', extract: r => r.metrics?.loading?.fcp?.value,                goodThresh: 1800, needsThresh: 3000 },
    ttfb:     { label: 'TTFB',      unit: 'ms',    color: '#f97316', extract: r => r.metrics?.loading?.ttfb?.value,               goodThresh: 800,  needsThresh: 1800 },
    pageLoad: { label: 'Page Load', unit: 'ms',    color: '#e879f9', extract: r => r.metrics?.loading?.pageLoad?.value,           goodThresh: 3000, needsThresh: 7000 },
    resSize:  { label: 'Page Size', unit: 'bytes', color: '#34d399', extract: r => r.resources?.grandTotal,                       goodThresh: null, needsThresh: null },
    resCount: { label: 'Resources', unit: '',      color: '#fb923c', extract: r => r.resources?.count,                            goodThresh: null, needsThresh: null },
};

/* ─── Main Init ──────────────────────────────────────────── */
function initTrends() {
    allReports = window.WebPulse.storage.getAllReports()
        .sort((a, b) => a.timestamp - b.timestamp);

    const container = document.getElementById('trendsContent');
    if (!container) return;

    if (allReports.length < 2) {
        container.innerHTML = buildEmptyState();
        return;
    }

    applyRange();
    renderAll();
    wireControls();
}

function applyRange() {
    if (activeRange === '10') {
        filteredReports = allReports.slice(-10);
    } else if (activeRange === '20') {
        filteredReports = allReports.slice(-20);
    } else {
        filteredReports = allReports;
    }
}

/* ─── Render Everything ──────────────────────────────────── */
function renderAll() {
    renderStats();
    renderScoreChart();
    renderCWVChart();
    renderLoadingChart();
    renderResourceChart();
    renderSparklines();
}

/* ─── Format date label for chart axes ──────────────────── */
function dateLabel(ts) {
    const d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
           d.getHours().toString().padStart(2, '0') + ':' +
           d.getMinutes().toString().padStart(2, '0');
}

function fullDate(ts) {
    return new Date(ts).toLocaleString();
}

/* ─── Summary Stats ─────────────────────────────────────── */
function renderStats() {
    const scores = filteredReports.map(r => r.score).filter(v => v !== undefined);
    if (scores.length === 0) return;

    const best  = Math.max(...scores);
    const worst = Math.min(...scores);
    const avg   = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

    const first = scores[0];
    const last  = scores[scores.length - 1];
    const diff  = last - first;
    const trendIcon = diff > 2 ? '↑' : diff < -2 ? '↓' : '→';
    const trendClass = diff > 2 ? 'up' : diff < -2 ? 'down' : 'flat';

    _el('statTotal').textContent  = filteredReports.length;
    _el('statBest').textContent   = best;
    _el('statWorst').textContent  = worst;
    _el('statAvg').textContent    = avg;

    const arrow = _el('statTrendArrow');
    if (arrow) {
        arrow.textContent = trendIcon;
        arrow.className   = 'stat-trend-arrow ' + trendClass;
    }
    const trendSub = _el('statTrendSub');
    if (trendSub) {
        trendSub.textContent = (diff >= 0 ? '+' : '') + diff + ' pts since first';
    }
}

/* ─── Score Over Time (line chart) ──────────────────────── */
function renderScoreChart() {
    const canvas = document.getElementById('scoreChart');
    if (!canvas) return;

    const labels = filteredReports.map(r => dateLabel(r.timestamp));
    const data   = filteredReports.map(r => r.score);

    window.WebPulse.charts.drawLineChart(canvas, {
        labels,
        series: [{
            label: 'WebPulse Score',
            color: '#3b82f6',
            data,
            unit: '',
        }],
        thresholds: [
            { label: 'Good (75)',  value: 75, color: '#22c55e', dashed: true },
            { label: 'Needs (50)', value: 50, color: '#eab308', dashed: true },
        ],
    });

    window.WebPulse.charts.attachLineTooltip(canvas, fullDate);
}

/* ─── Core Web Vitals Trend (multi-line) ─────────────────── */
function renderCWVChart() {
    const canvas = document.getElementById('cwvChart');
    if (!canvas) return;

    const labels = filteredReports.map(r => dateLabel(r.timestamp));

    window.WebPulse.charts.drawLineChart(canvas, {
        labels,
        series: [
            {
                label: 'LCP',
                color: METRICS.lcp.color,
                data:  filteredReports.map(METRICS.lcp.extract),
                unit:  'ms',
            },
            {
                label: 'FCP',
                color: METRICS.fcp.color,
                data:  filteredReports.map(METRICS.fcp.extract),
                unit:  'ms',
            },
            {
                label: 'TTFB',
                color: METRICS.ttfb.color,
                data:  filteredReports.map(METRICS.ttfb.extract),
                unit:  'ms',
            },
        ],
        thresholds: [
            { label: 'LCP Good (2.5s)',  value: 2500, color: '#22c55e', dashed: true },
            { label: 'LCP Poor (4s)',    value: 4000, color: '#ef4444', dashed: true },
        ],
    });

    window.WebPulse.charts.attachLineTooltip(canvas, fullDate);
}

/* ─── Loading Metrics (single-metric view) ───────────────── */
let activeLoadingMetric = 'pageLoad';

function renderLoadingChart() {
    const canvas = document.getElementById('loadingChart');
    if (!canvas) return;

    const m      = METRICS[activeLoadingMetric];
    const labels = filteredReports.map(r => dateLabel(r.timestamp));
    const data   = filteredReports.map(m.extract);

    const thresholds = [];
    if (m.goodThresh !== null) thresholds.push({ label: 'Good',  value: m.goodThresh,  color: '#22c55e', dashed: true });
    if (m.needsThresh !== null) thresholds.push({ label: 'Poor', value: m.needsThresh, color: '#ef4444', dashed: true });

    window.WebPulse.charts.drawLineChart(canvas, {
        labels,
        series: [{ label: m.label, color: m.color, data, unit: m.unit }],
        thresholds,
    });

    window.WebPulse.charts.attachLineTooltip(canvas, fullDate);

    // Update chart title
    const titleEl = document.getElementById('loadingChartTitle');
    if (titleEl) titleEl.textContent = m.label + ' Over Time';
}

/* ─── Resource Chart (bar) ───────────────────────────────── */
function renderResourceChart() {
    const canvas = document.getElementById('resourceChart');
    if (!canvas) return;

    const labels = filteredReports.map(r => dateLabel(r.timestamp));

    window.WebPulse.charts.drawBarChart(canvas, {
        labels,
        series: [
            {
                label: 'Page Size',
                color: METRICS.resSize.color,
                data:  filteredReports.map(METRICS.resSize.extract),
                unit:  'bytes',
            },
        ],
    });

    window.WebPulse.charts.attachBarTooltip(canvas, fullDate);
}

/* ─── Sparklines Row ─────────────────────────────────────── */
const SPARKLINE_METRICS = ['score', 'lcp', 'cls', 'inp', 'fcp', 'ttfb', 'pageLoad', 'resSize'];

function renderSparklines() {
    const grid = document.getElementById('sparklinesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const key of SPARKLINE_METRICS) {
        const m    = METRICS[key];
        const vals = filteredReports.map(m.extract).filter(v => v !== null && v !== undefined);
        if (vals.length < 2) continue;

        const last  = vals[vals.length - 1];
        const first = vals[0];
        const diff  = last - first;
        const pct   = first !== 0 ? ((diff / first) * 100) : 0;

        // For ms/bytes, lower = better; for score, higher = better
        const lowerIsBetter = key !== 'score';
        const improved = lowerIsBetter ? diff < 0 : diff > 0;
        const changeCls = Math.abs(pct) < 1 ? 'neutral' : improved ? 'positive' : 'negative';
        const changeSign = diff >= 0 ? '+' : '';

        const card = document.createElement('div');
        card.className = 'sparkline-card';
        card.innerHTML =
            '<div class="sparkline-top">' +
            '<span class="sparkline-label">' + m.label + '</span>' +
            '<span class="sparkline-change ' + changeCls + '">' +
            changeSign + pct.toFixed(1) + '%' +
            '</span>' +
            '</div>' +
            '<div class="sparkline-value">' + window.WebPulse.charts.fmtVal(last, m.unit) + '</div>' +
            '<div class="sparkline-canvas-wrap"><canvas id="spark_' + key + '"></canvas></div>';

        grid.appendChild(card);

        // Draw after inserting into DOM
        requestAnimationFrame(() => {
            const cvs = document.getElementById('spark_' + key);
            if (cvs) {
                window.WebPulse.charts.drawSparkline(
                    cvs,
                    filteredReports.map(m.extract),
                    m.color,
                    lowerIsBetter
                );
            }
        });
    }
}

/* ─── Wire Controls ──────────────────────────────────────── */
function wireControls() {
    // Range buttons
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeRange = btn.dataset.range;
            applyRange();
            renderAll();
        });
    });

    // Loading metric selector tabs
    document.querySelectorAll('.metric-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.metric-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeLoadingMetric = btn.dataset.metric;
            renderLoadingChart();
        });
    });

    // Resize handler — redraw all charts
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderAll, 120);
    });
}

/* ─── Empty State ────────────────────────────────────────── */
function buildEmptyState() {
    return '<div class="trends-empty">' +
        '<span class="trends-empty-icon">📈</span>' +
        '<h2>Not enough data yet</h2>' +
        '<p>Save at least 2 performance reports from the Analyzer to unlock historical trend charts.</p>' +
        '<a href="analyzer.html" class="btn btn-primary"><span class="btn-icon">⚡</span> Run an Analysis</a>' +
        '</div>';
}

/* ─── Utility ────────────────────────────────────────────── */
function _el(id) { return document.getElementById(id); }

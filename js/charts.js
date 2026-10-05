/**
 * charts.js — WebPulse Vanilla Canvas Chart Engine
 *
 * Provides lightweight, dependency-free chart rendering using the Canvas 2D API.
 * Supports: Line charts, Bar charts, Sparklines, Threshold overlays, Tooltips.
 */

'use strict';

/* ─── Colour Palette ─────────────────────────────────────── */
const CHART_COLORS = {
    score:    '#3b82f6',
    lcp:      '#8b5cf6',
    cls:      '#f59e0b',
    inp:      '#ec4899',
    fcp:      '#06b6d4',
    ttfb:     '#f97316',
    domLoad:  '#a3e635',
    pageLoad: '#e879f9',
    resources:'#34d399',
    count:    '#fb923c',
    good:     '#22c55e',
    needs:    '#eab308',
    poor:     '#ef4444',
};

/* ─── CSS variable resolver (reads from :root or fallback) ─ */
function cssVar(name, fallback) {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return val || fallback;
}

/* ─── Resolve theme-aware colours at draw time ──────────── */
function themeColors() {
    return {
        text:    cssVar('--text-dimmed',   '#64748b'),
        muted:   cssVar('--text-muted',    '#94a3b8'),
        border:  cssVar('--border-subtle', 'rgba(51,65,85,0.5)'),
        gridLine:'rgba(100,116,139,0.15)',
        bg:      cssVar('--bg-dark',       '#0f172a'),
    };
}

/* ─── Utility: fit canvas to its wrapper ────────────────── */
function fitCanvas(canvas) {
    const dpr    = window.devicePixelRatio || 1;
    const rect   = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w: rect.width, h: rect.height };
}

/* ─── Format value for tooltip / axis ───────────────────── */
function fmtVal(val, unit) {
    if (val === null || val === undefined) return 'N/A';
    if (unit === 'ms')  return val >= 1000 ? (val / 1000).toFixed(2) + 's' : Math.round(val) + 'ms';
    if (unit === 'cls') return val.toFixed(3);
    if (unit === 'bytes') {
        if (val >= 1048576) return (val / 1048576).toFixed(1) + ' MB';
        if (val >= 1024)    return (val / 1024).toFixed(0) + ' KB';
        return val + ' B';
    }
    return Math.round(val).toString();
}

/* ══════════════════════════════════════════════════════════
   LINE CHART
   ══════════════════════════════════════════════════════════ */

/**
 * Draws a multi-series line chart with optional threshold lines.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} config
 *   @param {string[]}  config.labels        - X-axis labels (dates)
 *   @param {Array}     config.series        - [{ label, color, data, unit }]
 *   @param {Array}     [config.thresholds]  - [{ label, value, color, dashed }]
 *   @param {Object}    [config.padding]     - { top, right, bottom, left }
 */
function drawLineChart(canvas, config) {
    const { ctx, w, h } = fitCanvas(canvas);
    const tc  = themeColors();
    const pad = Object.assign({ top: 24, right: 20, bottom: 52, left: 58 }, config.padding || {});

    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top  - pad.bottom;

    const allValues = config.series.flatMap(s => s.data.filter(v => v !== null));
    const threshVals = (config.thresholds || []).map(t => t.value);
    const allY = [...allValues, ...threshVals];

    if (allValues.length === 0) {
        _drawNoData(ctx, w, h, tc);
        return;
    }

    let minY = Math.min(...allY);
    let maxY = Math.max(...allY);
    // Add 10% padding
    const range = maxY - minY || 1;
    minY -= range * 0.1;
    maxY += range * 0.15;

    const n = config.labels.length;
    const xStep = chartW / Math.max(n - 1, 1);

    function toX(i) { return pad.left + i * xStep; }
    function toY(v) { return pad.top + chartH - ((v - minY) / (maxY - minY)) * chartH; }

    // ── Background clear
    ctx.clearRect(0, 0, w, h);

    // ── Grid lines + Y-axis labels
    const gridCount = 5;
    ctx.save();
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = tc.text;
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridCount; i++) {
        const v = minY + (i / gridCount) * (maxY - minY);
        const y = toY(v);
        ctx.strokeStyle = tc.gridLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + chartW, y);
        ctx.stroke();
        // Label only the unit of the first series
        const unit = config.series[0] ? config.series[0].unit : '';
        ctx.fillText(fmtVal(v, unit), pad.left - 6, y + 4);
    }
    ctx.restore();

    // ── X-axis labels
    ctx.save();
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = tc.text;
    ctx.textAlign = 'center';
    const maxLabels = Math.min(n, 8);
    const step = Math.ceil(n / maxLabels);
    for (let i = 0; i < n; i += step) {
        const x = toX(i);
        ctx.fillText(config.labels[i], x, h - pad.bottom + 18);
    }
    ctx.restore();

    // ── Threshold lines
    if (config.thresholds) {
        for (const t of config.thresholds) {
            if (t.value < minY || t.value > maxY) continue;
            const y = toY(t.value);
            ctx.save();
            ctx.strokeStyle = t.color;
            ctx.lineWidth = 1.5;
            if (t.dashed) ctx.setLineDash([6, 4]);
            ctx.globalAlpha = 0.65;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + chartW, y);
            ctx.stroke();
            ctx.restore();
        }
    }

    // ── Series lines + fill
    for (const series of config.series) {
        const pts = series.data.map((v, i) => ({ x: toX(i), y: v !== null ? toY(v) : null, v }));
        const validPts = pts.filter(p => p.y !== null);
        if (validPts.length === 0) continue;

        // Fill gradient
        ctx.save();
        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
        grad.addColorStop(0, series.color + '30');
        grad.addColorStop(1, series.color + '00');
        ctx.beginPath();
        let started = false;
        for (const pt of pts) {
            if (pt.y === null) { started = false; continue; }
            if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
            else ctx.lineTo(pt.x, pt.y);
        }
        // Close path along bottom
        const lastValid = [...pts].reverse().find(p => p.y !== null);
        const firstValid = pts.find(p => p.y !== null);
        if (lastValid && firstValid) {
            ctx.lineTo(lastValid.x, pad.top + chartH);
            ctx.lineTo(firstValid.x, pad.top + chartH);
            ctx.closePath();
        }
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // Line
        ctx.save();
        ctx.strokeStyle = series.color;
        ctx.lineWidth   = 2.5;
        ctx.lineJoin    = 'round';
        ctx.lineCap     = 'round';
        ctx.beginPath();
        started = false;
        for (const pt of pts) {
            if (pt.y === null) { started = false; continue; }
            if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();

        // Dots
        for (const pt of validPts) {
            ctx.save();
            ctx.fillStyle   = series.color;
            ctx.strokeStyle = cssVar('--bg-card', '#1e293b');
            ctx.lineWidth   = 2;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    // ── Store hit-test data on canvas for tooltip
    canvas._chartMeta = { pad, toX, toY, n, config, minY, maxY };
}

/* ══════════════════════════════════════════════════════════
   BAR CHART
   ══════════════════════════════════════════════════════════ */

/**
 * Draws a grouped bar chart (or single-series bar chart).
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} config
 *   @param {string[]} config.labels
 *   @param {Array}    config.series  - [{ label, color, data, unit }]
 */
function drawBarChart(canvas, config) {
    const { ctx, w, h } = fitCanvas(canvas);
    const tc  = themeColors();
    const pad = { top: 24, right: 20, bottom: 52, left: 62 };

    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top  - pad.bottom;

    const allValues = config.series.flatMap(s => s.data.filter(v => v !== null && v >= 0));
    if (allValues.length === 0) {
        _drawNoData(ctx, w, h, tc);
        return;
    }

    const maxY = Math.max(...allValues) * 1.15 || 1;
    const n    = config.labels.length;
    const sCount = config.series.length;
    const groupW = chartW / n;
    const barW   = Math.min((groupW / sCount) * 0.7, 40);
    const barGap = (groupW - barW * sCount) / (sCount + 1);

    function toY(v) { return pad.top + chartH - (v / maxY) * chartH; }
    function groupX(i) { return pad.left + i * groupW; }

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.save();
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = tc.text;
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const v = (i / 4) * maxY;
        const y = toY(v);
        ctx.strokeStyle = tc.gridLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + chartW, y);
        ctx.stroke();
        const unit = config.series[0] ? config.series[0].unit : '';
        ctx.fillText(fmtVal(v, unit), pad.left - 6, y + 4);
    }
    ctx.restore();

    // X labels
    ctx.save();
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = tc.text;
    ctx.textAlign = 'center';
    const maxLabels = Math.min(n, 8);
    const labelStep = Math.ceil(n / maxLabels);
    for (let i = 0; i < n; i += labelStep) {
        ctx.fillText(config.labels[i], groupX(i) + groupW / 2, h - pad.bottom + 18);
    }
    ctx.restore();

    // Bars
    for (let si = 0; si < sCount; si++) {
        const s = config.series[si];
        ctx.save();
        for (let i = 0; i < n; i++) {
            const v = s.data[i];
            if (v === null || v === undefined) continue;
            const x = groupX(i) + barGap * (si + 1) + barW * si;
            const y = toY(v);
            const bh = pad.top + chartH - y;

            // Gradient bar
            const grad = ctx.createLinearGradient(0, y, 0, pad.top + chartH);
            grad.addColorStop(0, s.color);
            grad.addColorStop(1, s.color + '60');

            ctx.fillStyle = grad;
            ctx.beginPath();
            const r = Math.min(4, barW / 2);
            ctx.roundRect(x, y, barW, bh, [r, r, 0, 0]);
            ctx.fill();
        }
        ctx.restore();
    }

    // Store meta
    canvas._chartMeta = {
        pad, groupW, barW, barGap, n, sCount, maxY, config,
        toY, groupX,
    };
}

/* ══════════════════════════════════════════════════════════
   SPARKLINE
   ══════════════════════════════════════════════════════════ */

/**
 * Draws a minimal sparkline (no axes, no labels).
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number[]} data
 * @param {string}   color
 * @param {boolean}  [invert=false]  If true, lower = greener (good for ms metrics)
 */
function drawSparkline(canvas, data, color, invert) {
    const { ctx, w, h } = fitCanvas(canvas);
    const pad = { top: 4, right: 4, bottom: 4, left: 4 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top  - pad.bottom;

    const valid = data.filter(v => v !== null && !isNaN(v));
    if (valid.length < 2) return;

    const minV = Math.min(...valid);
    const maxV = Math.max(...valid);
    const rng  = maxV - minV || 1;

    function toX(i) { return pad.left + (i / (data.length - 1)) * cw; }
    function toY(v) { return pad.top + ch - ((v - minV) / rng) * ch; }

    ctx.clearRect(0, 0, w, h);

    // Fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0, color + '40');
    grad.addColorStop(1, color + '00');

    ctx.beginPath();
    let started = false;
    for (let i = 0; i < data.length; i++) {
        if (data[i] === null) { started = false; continue; }
        if (!started) { ctx.moveTo(toX(i), toY(data[i])); started = true; }
        else ctx.lineTo(toX(i), toY(data[i]));
    }
    const last  = [...data].reverse().findIndex(v => v !== null);
    const first = data.findIndex(v => v !== null);
    if (last >= 0 && first >= 0) {
        ctx.lineTo(toX(data.length - 1 - last), pad.top + ch);
        ctx.lineTo(toX(first), pad.top + ch);
        ctx.closePath();
    }
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    started = false;
    for (let i = 0; i < data.length; i++) {
        if (data[i] === null) { started = false; continue; }
        if (!started) { ctx.moveTo(toX(i), toY(data[i])); started = true; }
        else ctx.lineTo(toX(i), toY(data[i]));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // Last dot
    const lastIdx = data.length - 1 - [...data].reverse().findIndex(v => v !== null);
    if (data[lastIdx] !== null) {
        ctx.beginPath();
        ctx.arc(toX(lastIdx), toY(data[lastIdx]), 3, 0, Math.PI * 2);
        ctx.fillStyle   = color;
        ctx.strokeStyle = cssVar('--bg-card', '#1e293b');
        ctx.lineWidth   = 1.5;
        ctx.fill();
        ctx.stroke();
    }
}

/* ─── No-data placeholder ─────────────────────────────────── */
function _drawNoData(ctx, w, h, tc) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.fillStyle   = tc.muted;
    ctx.font        = '13px Inter, sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText('Not enough data', w / 2, h / 2);
    ctx.restore();
}

/* ─── Tooltip System ─────────────────────────────────────── */
let _tooltip = null;

function getTooltip() {
    if (!_tooltip) {
        _tooltip = document.createElement('div');
        _tooltip.className = 'chart-tooltip';
        document.body.appendChild(_tooltip);
    }
    return _tooltip;
}

function showTooltip(x, y, html) {
    const tt = getTooltip();
    tt.innerHTML = html;
    tt.classList.add('visible');

    const padding = 12;
    let left = x + padding;
    let top  = y - 10;

    const rect = tt.getBoundingClientRect();
    if (left + rect.width > window.innerWidth - 8) {
        left = x - rect.width - padding;
    }
    if (top + rect.height > window.innerHeight - 8) {
        top = y - rect.height - padding;
    }
    tt.style.left = left + 'px';
    tt.style.top  = top  + 'px';
}

function hideTooltip() {
    if (_tooltip) _tooltip.classList.remove('visible');
}

/**
 * Attaches mousemove tooltip to a line-chart canvas.
 */
function attachLineTooltip(canvas, labelFormatter) {
    canvas.addEventListener('mousemove', e => {
        const meta = canvas._chartMeta;
        if (!meta) return;
        const rect = canvas.getBoundingClientRect();
        const mx   = e.clientX - rect.left;
        const { pad, n, xStep, config } = meta;

        // Find nearest data point index
        let closest = 0;
        let minDist = Infinity;
        for (let i = 0; i < n; i++) {
            const x = pad.left + i * (chartW(canvas, pad) / Math.max(n - 1, 1));
            const d = Math.abs(mx - x);
            if (d < minDist) { minDist = d; closest = i; }
        }

        if (minDist > 40) { hideTooltip(); return; }

        const label = config.labels[closest];
        let html = '<div class="tooltip-title">' + (labelFormatter ? labelFormatter(label) : label) + '</div>';
        for (const s of config.series) {
            const v = s.data[closest];
            if (v === null || v === undefined) continue;
            html += '<div class="tooltip-row">' +
                '<span class="tooltip-dot" style="background:' + s.color + '"></span>' +
                '<span>' + s.label + ': <strong>' + fmtVal(v, s.unit) + '</strong></span>' +
                '</div>';
        }
        showTooltip(e.clientX, e.clientY, html);
    });

    canvas.addEventListener('mouseleave', hideTooltip);
}

function chartW(canvas, pad) {
    return canvas.getBoundingClientRect().width - pad.left - pad.right;
}

/**
 * Attaches mousemove tooltip to a bar-chart canvas.
 */
function attachBarTooltip(canvas, labelFormatter) {
    canvas.addEventListener('mousemove', e => {
        const meta = canvas._chartMeta;
        if (!meta) return;
        const rect = canvas.getBoundingClientRect();
        const mx   = e.clientX - rect.left;
        const { pad, n, groupW, config } = meta;

        const i = Math.floor((mx - pad.left) / groupW);
        if (i < 0 || i >= n) { hideTooltip(); return; }

        const label = config.labels[i];
        let html = '<div class="tooltip-title">' + (labelFormatter ? labelFormatter(label) : label) + '</div>';
        for (const s of config.series) {
            const v = s.data[i];
            if (v === null || v === undefined) continue;
            html += '<div class="tooltip-row">' +
                '<span class="tooltip-dot" style="background:' + s.color + '"></span>' +
                '<span>' + s.label + ': <strong>' + fmtVal(v, s.unit) + '</strong></span>' +
                '</div>';
        }
        showTooltip(e.clientX, e.clientY, html);
    });
    canvas.addEventListener('mouseleave', hideTooltip);
}

/* ─── Expose ─────────────────────────────────────────────── */
window.WebPulse = window.WebPulse || {};
window.WebPulse.charts = {
    COLORS: CHART_COLORS,
    drawLineChart,
    drawBarChart,
    drawSparkline,
    attachLineTooltip,
    attachBarTooltip,
    fmtVal,
};

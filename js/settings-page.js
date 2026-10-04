/**
 * settings-page.js — WebPulse Settings Page Controller
 *
 * Populates, validates, and saves user preferences on settings.html.
 *
 * Depends on: js/settings.js (window.WebPulse.settings)
 */

'use strict';

/* ─── Metric Threshold Definitions ──────────────────────── */
const THRESHOLD_DEFS = [
    { key: 'lcp',      label: 'LCP',       unit: 'ms',      goodLabel: '≤ Good',      needsLabel: '≤ Needs Impr.' },
    { key: 'cls',      label: 'CLS',       unit: 'score',   goodLabel: '≤ Good',      needsLabel: '≤ Needs Impr.' },
    { key: 'inp',      label: 'INP',       unit: 'ms',      goodLabel: '≤ Good',      needsLabel: '≤ Needs Impr.' },
    { key: 'fcp',      label: 'FCP',       unit: 'ms',      goodLabel: '≤ Good',      needsLabel: '≤ Needs Impr.' },
    { key: 'ttfb',     label: 'TTFB',      unit: 'ms',      goodLabel: '≤ Good',      needsLabel: '≤ Needs Impr.' },
    { key: 'domLoad',  label: 'DOM Load',  unit: 'ms',      goodLabel: '≤ Good',      needsLabel: '≤ Needs Impr.' },
    { key: 'pageLoad', label: 'Page Load', unit: 'ms',      goodLabel: '≤ Good',      needsLabel: '≤ Needs Impr.' },
];

const WEIGHT_DEFS = [
    { key: 'cwv',       label: 'Core Web Vitals',   desc: 'LCP, CLS, INP — primary UX indicators', color: '#3b82f6' },
    { key: 'loading',   label: 'Loading Metrics',   desc: 'FCP, TTFB, DOM Load, Page Load',         color: '#8b5cf6' },
    { key: 'resources', label: 'Resource Efficiency', desc: 'Total payload size and resource count', color: '#22c55e' },
    { key: 'issues',    label: 'Issues Penalty',    desc: 'Detected bottlenecks and severity',       color: '#ef4444' },
];

/* ─── DOM Refs ───────────────────────────────────────────── */
const $ = id => document.getElementById(id);

/* ─── State ──────────────────────────────────────────────── */
let _pendingSettings = null; // working copy before Save

function cloneSettings() {
    return JSON.parse(JSON.stringify(window.WebPulse.settings.get()));
}

/* ─── Toast ──────────────────────────────────────────────── */
function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.settings-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `settings-toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease both';
        setTimeout(() => toast.remove(), 320);
    }, 2800);
}

/* ─── Theme Picker ───────────────────────────────────────── */
function initThemePicker(settings) {
    const radios = document.querySelectorAll('input[name="theme"]');
    radios.forEach(radio => {
        radio.checked = (radio.value === settings.theme);
        radio.addEventListener('change', () => {
            _pendingSettings.theme = radio.value;
            // Apply immediately so the user sees it live
            window.WebPulse.settings.update({ theme: radio.value });
            window.WebPulse.settings.applyAll();
            // Update the header toggle icon if it exists
            const toggleBtn = document.getElementById('themeToggleBtn');
            if (toggleBtn) {
                const resolved = window.WebPulse.settings.resolveTheme(radio.value);
                toggleBtn.textContent = resolved === 'dark' ? '☀️' : '🌙';
            }
        });
    });
}

/* ─── Animations Toggle ──────────────────────────────────── */
function initAnimationsToggle(settings) {
    const toggle = $('animationsToggle');
    toggle.checked = settings.animationsEnabled;
    toggle.addEventListener('change', () => {
        _pendingSettings.animationsEnabled = toggle.checked;
        // Apply immediately
        window.WebPulse.settings.update({ animationsEnabled: toggle.checked });
        window.WebPulse.settings.applyAnimations();
    });
}

/* ─── Unit Selector ──────────────────────────────────────── */
function initUnitSelector(settings) {
    const btns = document.querySelectorAll('.unit-btn');
    btns.forEach(btn => {
        if (btn.dataset.unit === settings.timeUnit) btn.classList.add('active');
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _pendingSettings.timeUnit = btn.dataset.unit;
        });
    });
}

/* ─── Threshold Rows ─────────────────────────────────────── */
function buildThresholdsGrid(settings) {
    const grid = $('thresholdsGrid');
    if (!grid) return;

    grid.innerHTML = THRESHOLD_DEFS.map(def => {
        const t = settings.thresholds[def.key];
        return `
        <div class="threshold-row" data-metric="${def.key}">
            <div>
                <div class="threshold-metric-name">${def.label}</div>
                <div class="threshold-metric-unit">${def.unit}</div>
            </div>
            <div class="threshold-input-group">
                <div class="threshold-input-label good">Good (≤)</div>
                <input
                    type="number"
                    class="threshold-input"
                    id="thr_${def.key}_good"
                    data-metric="${def.key}"
                    data-level="good"
                    value="${t.good}"
                    step="${def.unit === 'score' ? '0.01' : '50'}"
                    min="0"
                    aria-label="${def.label} Good threshold"
                >
            </div>
            <div class="threshold-input-group">
                <div class="threshold-input-label needs">Needs Impr. (≤)</div>
                <input
                    type="number"
                    class="threshold-input"
                    id="thr_${def.key}_needs"
                    data-metric="${def.key}"
                    data-level="needs"
                    value="${t.needs}"
                    step="${def.unit === 'score' ? '0.01' : '50'}"
                    min="0"
                    aria-label="${def.label} Needs Improvement threshold"
                >
            </div>
        </div>`;
    }).join('');

    // Wire change events
    grid.querySelectorAll('.threshold-input').forEach(input => {
        input.addEventListener('input', () => {
            validateThresholdInput(input);
            const metric = input.dataset.metric;
            const level  = input.dataset.level;
            const val    = parseFloat(input.value);
            if (!isNaN(val) && val >= 0) {
                _pendingSettings.thresholds[metric][level] = val;
            }
        });
    });
}

function validateThresholdInput(input) {
    const metric = input.dataset.metric;
    const goodEl  = document.getElementById(`thr_${metric}_good`);
    const needsEl = document.getElementById(`thr_${metric}_needs`);
    if (!goodEl || !needsEl) return;

    const good  = parseFloat(goodEl.value);
    const needs = parseFloat(needsEl.value);

    const isValid = !isNaN(good) && !isNaN(needs) && good > 0 && needs > good;
    goodEl.classList.toggle('error', !isValid);
    needsEl.classList.toggle('error', !isValid);
}

function validateAllThresholds() {
    let valid = true;
    THRESHOLD_DEFS.forEach(def => {
        const goodEl  = document.getElementById(`thr_${def.key}_good`);
        const needsEl = document.getElementById(`thr_${def.key}_needs`);
        if (!goodEl || !needsEl) return;

        const good  = parseFloat(goodEl.value);
        const needs = parseFloat(needsEl.value);

        if (isNaN(good) || isNaN(needs) || good <= 0 || needs <= good) {
            goodEl.classList.add('error');
            needsEl.classList.add('error');
            valid = false;
        }
    });
    return valid;
}

/* ─── Weight Sliders ─────────────────────────────────────── */
function buildWeightsGrid(settings) {
    const grid = $('weightsGrid');
    if (!grid) return;

    grid.className = 'weights-grid';
    grid.innerHTML = WEIGHT_DEFS.map(def => {
        const pct = Math.round(settings.weights[def.key] * 100);
        return `
        <div class="weight-row" data-weight="${def.key}">
            <div>
                <div class="weight-label">${def.label}</div>
                <div class="weight-desc">${def.desc}</div>
            </div>
            <div class="weight-slider-wrap">
                <input
                    type="range"
                    class="weight-slider"
                    id="wgt_${def.key}"
                    data-weight="${def.key}"
                    min="0" max="100" step="5"
                    value="${pct}"
                    style="accent-color:${def.color}"
                    aria-label="${def.label} weight"
                >
            </div>
            <span class="weight-value-badge" id="wgt_${def.key}_val">${pct}%</span>
        </div>`;
    }).join('');

    // Wire sliders
    grid.querySelectorAll('.weight-slider').forEach(slider => {
        slider.addEventListener('input', () => {
            const key = slider.dataset.weight;
            const pct = parseInt(slider.value, 10);
            $(`wgt_${key}_val`).textContent = pct + '%';
            _pendingSettings.weights[key] = pct / 100;
            updateWeightTotal();
        });
    });

    updateWeightTotal();
}

function updateWeightTotal() {
    const total = WEIGHT_DEFS.reduce((sum, def) => {
        const slider = document.getElementById(`wgt_${def.key}`);
        return sum + (slider ? parseInt(slider.value, 10) : 0);
    }, 0);

    const totalEl = $('weightTotal');
    if (totalEl) {
        totalEl.textContent = total + '%';
        totalEl.classList.toggle('error', total !== 100);
        totalEl.classList.toggle('ok',    total === 100);
    }

    return total;
}

function validateWeights() {
    return updateWeightTotal() === 100;
}

/* ─── Save & Reset ───────────────────────────────────────── */
function handleSave() {
    const thresholdsOk = validateAllThresholds();
    const weightsOk    = validateWeights();

    if (!thresholdsOk) {
        showToast('Fix threshold errors: "Needs Improvement" must be greater than "Good".', 'error');
        return;
    }
    if (!weightsOk) {
        showToast('Scoring weights must total exactly 100%.', 'error');
        return;
    }

    // Commit pending settings
    window.WebPulse.settings.update(_pendingSettings);
    window.WebPulse.settings.applyAll();
    showToast('Settings saved successfully!', 'success');
}

function handleReset() {
    if (!confirm('Reset all settings to factory defaults?')) return;
    window.WebPulse.settings.reset();
    window.WebPulse.settings.applyAll();

    // Re-initialise the page with fresh defaults
    _pendingSettings = cloneSettings();
    initThemePicker(_pendingSettings);
    initAnimationsToggle(_pendingSettings);
    initUnitSelector(_pendingSettings);
    buildThresholdsGrid(_pendingSettings);
    buildWeightsGrid(_pendingSettings);

    showToast('Settings reset to defaults.', 'success');
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    _pendingSettings = cloneSettings();

    initThemePicker(_pendingSettings);
    initAnimationsToggle(_pendingSettings);
    initUnitSelector(_pendingSettings);
    buildThresholdsGrid(_pendingSettings);
    buildWeightsGrid(_pendingSettings);

    $('saveSettingsBtn').addEventListener('click', handleSave);
    $('resetSettingsBtn').addEventListener('click', handleReset);
});

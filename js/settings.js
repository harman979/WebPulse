/**
 * settings.js — WebPulse Settings & Preferences Module
 *
 * Manages all user-configurable preferences:
 *   - Theme          : dark | light | system
 *   - Time Units     : ms | auto (auto = s for values ≥ 1000ms)
 *   - Score Thresholds: custom Good/Needs/Poor boundaries for each metric
 *   - Score Weights  : override CWV/Loading/Resources/Issues weights
 *
 * Storage Key: "wp_settings" in localStorage
 * Events: dispatches "wpSettingsChanged" on window when prefs change
 */

'use strict';

/* ─── Default Settings ───────────────────────────────────── */
const SETTINGS_KEY = 'wp_settings';

const DEFAULTS = {
    theme: 'dark',          // 'dark' | 'light' | 'system'
    timeUnit: 'auto',       // 'auto' | 'ms'
    animationsEnabled: true,

    // Metric thresholds (custom Good / Needs-Improvement / Poor boundaries)
    thresholds: {
        lcp:      { good: 2500,  needs: 4000  },   // ms
        cls:      { good: 0.1,   needs: 0.25  },   // unitless
        inp:      { good: 200,   needs: 500   },   // ms
        fcp:      { good: 1800,  needs: 3000  },   // ms
        ttfb:     { good: 800,   needs: 1800  },   // ms
        domLoad:  { good: 1500,  needs: 3500  },   // ms
        pageLoad: { good: 3000,  needs: 7000  },   // ms
    },

    // Scoring weights (must sum to 1.0)
    weights: {
        cwv:       0.40,
        loading:   0.25,
        resources: 0.20,
        issues:    0.15,
    },
};

/* ─── Internal State ─────────────────────────────────────── */
let _current = null;

/**
 * Deep-merges source into target (non-destructively).
 */
function deepMerge(target, source) {
    const out = Object.assign({}, target);
    for (const key of Object.keys(source)) {
        if (
            source[key] !== null &&
            typeof source[key] === 'object' &&
            !Array.isArray(source[key])
        ) {
            out[key] = deepMerge(target[key] ?? {}, source[key]);
        } else {
            out[key] = source[key];
        }
    }
    return out;
}

/* ─── Load / Save ────────────────────────────────────────── */

/**
 * Loads settings from localStorage, merging with defaults.
 * @returns {Object} Current settings object.
 */
function load() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            _current = deepMerge(DEFAULTS, parsed);
        } else {
            _current = deepMerge({}, DEFAULTS);
        }
    } catch (_) {
        _current = deepMerge({}, DEFAULTS);
    }
    return _current;
}

/**
 * Persists current settings to localStorage.
 */
function save() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(_current));
    } catch (_) { /* quota exceeded — silently ignore */ }
}

/**
 * Returns the current settings object (loaded if not yet loaded).
 * @returns {Object}
 */
function get() {
    if (!_current) load();
    return _current;
}

/**
 * Merges partial update into current settings, saves, and dispatches event.
 * @param {Object} patch - Partial settings object to merge.
 */
function update(patch) {
    if (!_current) load();
    _current = deepMerge(_current, patch);
    save();
    dispatch();
}

/**
 * Resets all settings to factory defaults.
 */
function reset() {
    _current = deepMerge({}, DEFAULTS);
    save();
    dispatch();
}

/**
 * Dispatches the "wpSettingsChanged" event on window.
 */
function dispatch() {
    window.dispatchEvent(new CustomEvent('wpSettingsChanged', { detail: _current }));
}

/* ─── Theme Application ──────────────────────────────────── */

/**
 * Resolves 'system' to the OS preference, returns 'dark' or 'light'.
 */
function resolveTheme(theme) {
    if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return theme;
}

/**
 * Applies the current theme to <html> data-theme attribute.
 */
function applyTheme() {
    const settings = get();
    const resolved = resolveTheme(settings.theme);
    document.documentElement.setAttribute('data-theme', resolved);
}

/**
 * Applies animation preference (adds/removes class on <html>).
 */
function applyAnimations() {
    const settings = get();
    if (!settings.animationsEnabled) {
        document.documentElement.classList.add('no-animations');
    } else {
        document.documentElement.classList.remove('no-animations');
    }
}

/**
 * Applies all visual preferences at once. Call on every page load.
 */
function applyAll() {
    applyTheme();
    applyAnimations();
}

/* ─── Metric Helpers ─────────────────────────────────────── */

/**
 * Returns the threshold object for a given metric key.
 * @param {string} metricKey - e.g. 'lcp', 'cls'
 * @returns {{ good: number, needs: number }}
 */
function getThreshold(metricKey) {
    const settings = get();
    return settings.thresholds[metricKey] ?? DEFAULTS.thresholds[metricKey];
}

/**
 * Returns the user-configured scoring weights.
 * @returns {{ cwv, loading, resources, issues }}
 */
function getWeights() {
    return get().weights;
}

/**
 * Formats a millisecond value according to the user's timeUnit preference.
 * @param {number} ms
 * @returns {string}
 */
function formatTime(ms) {
    if (ms === null || ms === undefined || isNaN(ms)) return 'N/A';
    const unit = get().timeUnit;
    if (unit === 'ms' || ms < 1000) {
        return Math.round(ms) + ' ms';
    }
    return (ms / 1000).toFixed(2) + ' s';
}

/* ─── Expose ─────────────────────────────────────────────── */
window.WebPulse = window.WebPulse || {};
window.WebPulse.settings = {
    DEFAULTS,
    get,
    load,
    update,
    reset,
    applyAll,
    applyTheme,
    resolveTheme,
    getThreshold,
    getWeights,
    formatTime,
};

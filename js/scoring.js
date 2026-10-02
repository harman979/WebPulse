/**
 * scoring.js — WebPulse Performance Score Engine
 *
 * Computes a 0–100 WebPulse score from collected metrics using a weighted formula:
 *   - Core Web Vitals (LCP, CLS, INP): 40%
 *   - Loading Metrics (FCP, TTFB, DOM, PageLoad): 25%
 *   - Resource Efficiency (size & count): 20%
 *   - Issues penalty: 15%
 */

'use strict';

/* ─── Scoring Weights ────────────────────────────────────── */
const WEIGHTS = {
    cwv:       0.40,
    loading:   0.25,
    resources: 0.20,
    issues:    0.15,
};

/**
 * Clamps a value between 0 and 100.
 */
function clamp(val) {
    return Math.max(0, Math.min(100, val));
}

/**
 * Maps a raw metric value to a 0–100 sub-score using linear interpolation
 * between "good" and "poor" thresholds.
 *
 * @param {number} value - The measured metric value
 * @param {number} good  - Threshold for score=100
 * @param {number} poor  - Threshold for score=0
 * @param {boolean} lowerIsBetter - If false, higher values are better
 * @returns {number} 0–100 sub-score
 */
function linearScore(value, good, poor, lowerIsBetter = true) {
    if (value === null || value === undefined || isNaN(value)) return 50;
    if (lowerIsBetter) {
        if (value <= good) return 100;
        if (value >= poor) return 0;
        return clamp(100 - ((value - good) / (poor - good)) * 100);
    } else {
        if (value >= good) return 100;
        if (value <= poor) return 0;
        return clamp(((value - poor) / (good - poor)) * 100);
    }
}

/* ─── Sub-Score Calculators ──────────────────────────────── */

/**
 * CWV sub-score (0–100): average of LCP, CLS, INP scores.
 */
function scoreCWV(cwv) {
    const lcpScore = linearScore(cwv.lcp.value,  2500,  4000);
    const clsScore = linearScore(cwv.cls.value,  0.1,   0.25);
    const inpScore = linearScore(cwv.inp.value,  200,   500);
    return (lcpScore + clsScore + inpScore) / 3;
}

/**
 * Loading metrics sub-score (0–100).
 */
function scoreLoading(loading) {
    const fcpScore  = linearScore(loading.fcp.value,      1800, 3000);
    const ttfbScore = linearScore(loading.ttfb.value,      800, 1800);
    const domScore  = linearScore(loading.domLoad.value,  1500, 3500);
    const plScore   = linearScore(loading.pageLoad.value, 3000, 7000);

    // Weighted within loading: FCP & TTFB matter more
    return (fcpScore * 0.35 + ttfbScore * 0.30 + domScore * 0.20 + plScore * 0.15);
}

/**
 * Resource efficiency sub-score (0–100).
 * Penalises large total payload and high resource count.
 */
function scoreResources(resourceData) {
    const { grandTotal, count } = resourceData;

    // Total size scoring: 0 = 5MB+, 100 = 0 bytes
    const sizeScore = linearScore(grandTotal, 0, 5 * 1024 * 1024);

    // Count scoring: 0 = 150+ resources, 100 = 0 resources
    const countScore = linearScore(count, 0, 150);

    return (sizeScore * 0.7 + countScore * 0.3);
}

/**
 * Issues penalty sub-score (0–100).
 * Starts at 100, deducted by severity of each issue.
 */
function scoreIssues(issues) {
    if (!issues || issues.length === 0) return 100;

    let deduction = 0;
    for (const issue of issues) {
        switch (issue.severity) {
            case 'critical': deduction += 20; break;
            case 'warning':  deduction += 10; break;
            case 'info':     deduction += 3;  break;
            default:         deduction += 5;
        }
    }
    return clamp(100 - deduction);
}

/* ─── Final Score Calculator ─────────────────────────────── */

/**
 * Computes the overall WebPulse performance score (0–100).
 *
 * @param {Object} metricsData  - Output from performance.collectAllMetrics()
 * @param {Object} resourceData - Output from resources.collectResources()
 * @param {Array}  issues       - Array of detected issues
 * @returns {{ score: number, breakdown: Object, rating: string }}
 */
function computeScore(metricsData, resourceData, issues) {
    const cwvSub       = scoreCWV(metricsData.cwv);
    const loadingSub   = scoreLoading(metricsData.loading);
    const resourcesSub = scoreResources(resourceData);
    const issuesSub    = scoreIssues(issues);

    const total = clamp(
        cwvSub       * WEIGHTS.cwv       +
        loadingSub   * WEIGHTS.loading   +
        resourcesSub * WEIGHTS.resources +
        issuesSub    * WEIGHTS.issues
    );

    const score = Math.round(total);

    let rating;
    if (score >= 90) rating = 'Excellent';
    else if (score >= 75) rating = 'Good';
    else if (score >= 50) rating = 'Needs Work';
    else if (score >= 25) rating = 'Poor';
    else rating = 'Critical';

    return {
        score,
        rating,
        breakdown: {
            cwv:       Math.round(cwvSub),
            loading:   Math.round(loadingSub),
            resources: Math.round(resourcesSub),
            issues:    Math.round(issuesSub),
        },
    };
}

/**
 * Returns the CSS class for a score value.
 * @param {number} score
 * @returns {'score-good'|'score-needs-improvement'|'score-poor'}
 */
function scoreClass(score) {
    if (score >= 75) return 'score-good';
    if (score >= 50) return 'score-needs-improvement';
    return 'score-poor';
}

/**
 * Returns the CSS class for a rating string.
 */
function ratingClass(rating) {
    const map = {
        'Excellent': 'rating-good',
        'Good':      'rating-good',
        'Needs Work': 'rating-needs',
        'Poor':       'rating-poor',
        'Critical':   'rating-poor',
    };
    return map[rating] || '';
}

// Expose
window.WebPulse = window.WebPulse || {};
window.WebPulse.scoring = { computeScore, scoreClass, ratingClass, WEIGHTS };

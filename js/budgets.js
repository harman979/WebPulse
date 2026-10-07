/**
 * budgets.js — WebPulse Performance Budgeting & SLA Engine
 *
 * Evaluates webpage performance metrics and resource transfer sizes
 * against user-configured performance budgets.
 *
 * Depends on: js/settings.js (window.WebPulse.settings)
 */

'use strict';

(function () {
    window.WebPulse = window.WebPulse || {};

    /**
     * Evaluates metrics and resources against current settings budgets.
     * @param {Object} metrics  - Collected performance metrics (lcp, pageLoad, etc.)
     * @param {Object} resources - Collected resource data (byType, totalTransferSize, etc.)
     * @returns {Object} Budget evaluation results
     */
    function evaluateBudgets(metrics, resources) {
        const settings = window.WebPulse.settings ? window.WebPulse.settings.get() : {};
        const budgets = settings.budgets || {
            maxTotalSize: 2000,
            maxJsSize: 500,
            maxCssSize: 120,
            maxImgSize: 1000,
            maxLcp: 2500,
            maxPageLoad: 3500
        };

        const totalBytes = resources?.totalTransferSize || 0;
        const totalKB = Math.round(totalBytes / 1024);

        const jsBytes = resources?.byType?.script?.size || 0;
        const jsKB = Math.round(jsBytes / 1024);

        const cssBytes = resources?.byType?.link?.size || 0;
        const cssKB = Math.round(cssBytes / 1024);

        const imgBytes = resources?.byType?.img?.size || 0;
        const imgKB = Math.round(imgBytes / 1024);

        const lcpVal = metrics?.cwv?.lcp?.value || 0;
        const pageLoadVal = metrics?.loading?.pageLoad?.value || 0;

        const items = [
            buildBudgetItem('Total Page Transfer', totalKB, budgets.maxTotalSize, 'KB'),
            buildBudgetItem('JavaScript Payload', jsKB, budgets.maxJsSize, 'KB'),
            buildBudgetItem('CSS Stylesheets', cssKB, budgets.maxCssSize, 'KB'),
            buildBudgetItem('Image Assets', imgKB, budgets.maxImgSize, 'KB'),
            buildBudgetItem('LCP (Largest Paint)', lcpVal, budgets.maxLcp, 'ms', true),
            buildBudgetItem('Total Page Load', pageLoadVal, budgets.maxPageLoad, 'ms', true)
        ];

        const passedCount = items.filter(i => i.status === 'pass').length;
        const warningCount = items.filter(i => i.status === 'warning').length;
        const exceededCount = items.filter(i => i.status === 'exceeded').length;
        const totalItems = items.length;

        const complianceRate = Math.round(((passedCount + warningCount * 0.5) / totalItems) * 100);

        return {
            items,
            passedCount,
            warningCount,
            exceededCount,
            totalItems,
            complianceRate,
            isFullyCompliant: exceededCount === 0
        };
    }

    /**
     * Builds individual budget evaluation item.
     */
    function buildBudgetItem(name, actual, budgetLimit, unit, isTime = false) {
        const pct = budgetLimit > 0 ? Math.round((actual / budgetLimit) * 100) : 0;
        let status = 'pass';
        if (pct > 100) {
            status = 'exceeded';
        } else if (pct >= 85) {
            status = 'warning';
        }

        const delta = actual - budgetLimit;
        const deltaFormatted = delta > 0 ? `+${delta}${unit} over limit` : `${Math.abs(delta)}${unit} buffer`;

        return {
            name,
            actual,
            budgetLimit,
            unit,
            percentage: Math.min(pct, 150),
            rawPercentage: pct,
            status,
            deltaFormatted,
            formattedActual: isTime ? (actual >= 1000 ? (actual / 1000).toFixed(2) + 's' : Math.round(actual) + 'ms') : actual + ' KB',
            formattedLimit: isTime ? (budgetLimit >= 1000 ? (budgetLimit / 1000).toFixed(2) + 's' : budgetLimit + 'ms') : budgetLimit + ' KB'
        };
    }

    /**
     * Renders budget card into container element.
     * @param {HTMLElement} container 
     * @param {Object} budgetData 
     */
    function renderBudgetCard(container, budgetData) {
        if (!container) return;

        const { items, passedCount, warningCount, exceededCount, complianceRate } = budgetData;

        let badgeClass = 'status-good';
        let badgeText = 'SLA Compliant ✅';
        if (exceededCount > 0) {
            badgeClass = 'status-poor';
            badgeText = `${exceededCount} Budget Exceeded ⚠️`;
        } else if (warningCount > 0) {
            badgeClass = 'status-needs';
            badgeText = `${warningCount} Near Budget ⚠️`;
        }

        let html = `
            <div class="card-header-flex">
                <h2>Performance Budget &amp; SLA Compliance</h2>
                <span class="status-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="budget-summary-strip">
                <div class="budget-summary-item">
                    <span class="budget-summary-val text-good">${passedCount}</span>
                    <span class="budget-summary-lbl">Passed</span>
                </div>
                <div class="budget-summary-item">
                    <span class="budget-summary-val text-needs">${warningCount}</span>
                    <span class="budget-summary-lbl">Warning</span>
                </div>
                <div class="budget-summary-item">
                    <span class="budget-summary-val text-poor">${exceededCount}</span>
                    <span class="budget-summary-lbl">Exceeded</span>
                </div>
                <div class="budget-summary-item highlight">
                    <span class="budget-summary-val">${complianceRate}%</span>
                    <span class="budget-summary-lbl">SLA Score</span>
                </div>
            </div>
            <div class="budget-items-list">
        `;

        items.forEach(item => {
            const barClass = item.status === 'pass' ? 'bg-good' : item.status === 'warning' ? 'bg-needs' : 'bg-poor';
            const statusLabel = item.status === 'pass' ? 'PASSED' : item.status === 'warning' ? 'WARN' : 'EXCEEDED';
            const statusPillClass = item.status === 'pass' ? 'pill-good' : item.status === 'warning' ? 'pill-needs' : 'pill-poor';

            html += `
                <div class="budget-item-row">
                    <div class="budget-item-info">
                        <div class="budget-item-title">
                            <span class="budget-name">${item.name}</span>
                            <span class="budget-status-pill ${statusPillClass}">${statusLabel}</span>
                        </div>
                        <div class="budget-item-val">
                            <strong>${item.formattedActual}</strong> / max ${item.formattedLimit}
                            <span class="budget-delta">${item.deltaFormatted}</span>
                        </div>
                    </div>
                    <div class="budget-progress-track">
                        <div class="budget-progress-bar ${barClass}" style="width: ${Math.min(item.percentage, 100)}%;"></div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    window.WebPulse.budgets = {
        evaluate: evaluateBudgets,
        renderCard: renderBudgetCard
    };
})();

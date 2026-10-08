/**
 * waterfall.js — WebPulse Network Waterfall & Main-Thread Diagnostics Engine
 * Day 8 Feature
 *
 * Provides interactive visual waterfall timelines, phase timing breakdowns,
 * third-party domain origin analysis, and render-blocking main-thread diagnostics.
 */

'use strict';

window.WebPulse = window.WebPulse || {};

(function (WP) {

    let currentWaterfallState = {
        filterType: 'all',
        searchTerm: '',
        sortBy: 'startTime',
        zoomScale: 100,
        showMilestones: true,
        selectedResource: null,
    };

    /**
     * Renders the complete Waterfall Visualization section.
     * @param {Object} resourceData Output from collectResources()
     * @param {Object} metrics Object containing loading timing metrics (FCP, LCP, DOM, Load)
     * @param {HTMLElement} containerEl Target container DOM element
     */
    function renderWaterfallCard(resourceData, metrics, containerEl) {
        if (!containerEl) return;

        const resources = resourceData ? resourceData.resources || [] : [];
        const grandTotalDuration = calculateMaxTimelineDuration(resources, metrics);

        containerEl.innerHTML = `
            <section class="card waterfall-card" id="waterfallSection">
                <div class="card-header-flex">
                    <div class="waterfall-header-title">
                        <h2>Network Waterfall Visualizer</h2>
                        <span class="status-badge status-good">${resources.length} Requests</span>
                    </div>
                    <div class="waterfall-legend">
                        <span class="legend-item"><span class="legend-box phase-stalled"></span> Stalled</span>
                        <span class="legend-item"><span class="legend-box phase-dns"></span> DNS</span>
                        <span class="legend-item"><span class="legend-box phase-connect"></span> Connect/SSL</span>
                        <span class="legend-item"><span class="legend-box phase-ttfb"></span> TTFB Wait</span>
                        <span class="legend-item"><span class="legend-box phase-download"></span> Download</span>
                    </div>
                </div>

                <!-- Waterfall Controls Toolbar -->
                <div class="waterfall-controls">
                    <div class="waterfall-search-box">
                        <span class="search-icon">🔍</span>
                        <input type="text" id="waterfallSearchInput" placeholder="Filter resources by name/URL..." value="${escapeHtml(currentWaterfallState.searchTerm)}">
                    </div>

                    <div class="waterfall-filter-pills" id="waterfallFilterPills">
                        <button class="wf-pill ${currentWaterfallState.filterType === 'all' ? 'active' : ''}" data-type="all">All (${resources.length})</button>
                        <button class="wf-pill ${currentWaterfallState.filterType === 'script' ? 'active' : ''}" data-type="script">JS</button>
                        <button class="wf-pill ${currentWaterfallState.filterType === 'link' ? 'active' : ''}" data-type="link">CSS</button>
                        <button class="wf-pill ${currentWaterfallState.filterType === 'img' ? 'active' : ''}" data-type="img">Img</button>
                        <button class="wf-pill ${currentWaterfallState.filterType === 'font' ? 'active' : ''}" data-type="font">Font</button>
                        <button class="wf-pill ${currentWaterfallState.filterType === 'fetch' ? 'active' : ''}" data-type="fetch">Fetch/XHR</button>
                    </div>

                    <div class="waterfall-control-group">
                        <select id="waterfallSortSelect" class="form-select form-select-sm">
                            <option value="startTime" ${currentWaterfallState.sortBy === 'startTime' ? 'selected' : ''}>Sort by Start Time</option>
                            <option value="duration" ${currentWaterfallState.sortBy === 'duration' ? 'selected' : ''}>Sort by Duration</option>
                            <option value="size" ${currentWaterfallState.sortBy === 'size' ? 'selected' : ''}>Sort by Size</option>
                            <option value="ttfb" ${currentWaterfallState.sortBy === 'ttfb' ? 'selected' : ''}>Sort by TTFB Wait</option>
                        </select>

                        <select id="waterfallZoomSelect" class="form-select form-select-sm">
                            <option value="100" ${currentWaterfallState.zoomScale == 100 ? 'selected' : ''}>Scale: 100%</option>
                            <option value="150" ${currentWaterfallState.zoomScale == 150 ? 'selected' : ''}>Scale: 150%</option>
                            <option value="200" ${currentWaterfallState.zoomScale == 200 ? 'selected' : ''}>Scale: 200%</option>
                        </select>
                    </div>
                </div>

                <!-- Main Waterfall Graphic Area -->
                <div class="waterfall-container" id="waterfallContainer">
                    ${resources.length === 0 ? `
                        <div class="empty-state">No network resource timing data available. Run an analysis to populate the waterfall timeline.</div>
                    ` : renderWaterfallGraphic(resources, metrics, grandTotalDuration)}
                </div>

                <!-- Waterfall Detail Inspector Drawer (hidden until item clicked) -->
                <div id="waterfallInspectorModal" class="waterfall-inspector-drawer hidden"></div>
            </section>
        `;

        attachWaterfallEventListeners(resourceData, metrics, containerEl);
    }

    /**
     * Calculates the maximum timeline duration including metric markers.
     */
    function calculateMaxTimelineDuration(resources, metrics) {
        let maxMs = 500;
        for (const r of resources) {
            const end = (r.startTime || 0) + (r.duration || 0);
            if (end > maxMs) maxMs = end;
        }
        if (metrics) {
            if (metrics.fcp && metrics.fcp > maxMs) maxMs = metrics.fcp;
            if (metrics.lcp && metrics.lcp > maxMs) maxMs = metrics.lcp;
            if (metrics.domLoading && metrics.domLoading > maxMs) maxMs = metrics.domLoading;
            if (metrics.pageLoad && metrics.pageLoad > maxMs) maxMs = metrics.pageLoad;
        }
        return Math.ceil(maxMs * 1.05); // 5% padding
    }

    /**
     * Generates HTML for the waterfall timeline grid, milestone markers, and rows.
     */
    function renderWaterfallGraphic(resources, metrics, maxMs) {
        // Filter and Sort
        let filtered = resources.filter(r => {
            if (currentWaterfallState.filterType !== 'all' && r.type !== currentWaterfallState.filterType) return false;
            if (currentWaterfallState.searchTerm) {
                const term = currentWaterfallState.searchTerm.toLowerCase();
                return r.name.toLowerCase().includes(term) || r.url.toLowerCase().includes(term);
            }
            return true;
        });

        filtered = sortWaterfallResources(filtered, currentWaterfallState.sortBy);

        // Grid Scale Ticks (5 intervals)
        const ticks = [];
        const tickCount = 6;
        for (let i = 0; i < tickCount; i++) {
            const val = Math.round((maxMs / (tickCount - 1)) * i);
            const pct = (i / (tickCount - 1)) * 100;
            ticks.push({ val, pct });
        }

        // Milestone markers
        const milestones = [];
        if (metrics) {
            if (metrics.fcp > 0) milestones.push({ label: 'FCP', val: metrics.fcp, class: 'ms-fcp', pct: (metrics.fcp / maxMs) * 100 });
            if (metrics.lcp > 0) milestones.push({ label: 'LCP', val: metrics.lcp, class: 'ms-lcp', pct: (metrics.lcp / maxMs) * 100 });
            if (metrics.domLoading > 0) milestones.push({ label: 'DOM', val: metrics.domLoading, class: 'ms-dom', pct: (metrics.domLoading / maxMs) * 100 });
            if (metrics.pageLoad > 0) milestones.push({ label: 'Load', val: metrics.pageLoad, class: 'ms-load', pct: (metrics.pageLoad / maxMs) * 100 });
        }

        const scaleWidth = currentWaterfallState.zoomScale || 100;

        return `
            <div class="waterfall-scroll-wrapper" style="width: ${scaleWidth}%">
                <!-- Timeline Header Grid Scale -->
                <div class="waterfall-timeline-header">
                    <div class="wf-col-name">Resource Name</div>
                    <div class="wf-col-meta">Type / Size</div>
                    <div class="wf-col-bars">
                        <div class="wf-ticks-grid">
                            ${ticks.map(t => `
                                <div class="wf-tick" style="left: ${t.pct}%">
                                    <span class="wf-tick-label">${t.val}ms</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Waterfall Content Body -->
                <div class="waterfall-body">
                    <!-- Vertical Milestone Lines -->
                    <div class="wf-milestone-overlay">
                        ${milestones.map(m => `
                            <div class="wf-milestone-line ${m.class}" style="left: calc(300px + (100% - 300px) * ${m.pct / 100})" title="${m.label}: ${Math.round(m.val)}ms">
                                <span class="wf-milestone-tag">${m.label} ${Math.round(m.val)}ms</span>
                            </div>
                        `).join('')}
                    </div>

                    ${filtered.length === 0 ? `
                        <div class="empty-table p-4 text-center">No resources match the selected filter query "${escapeHtml(currentWaterfallState.searchTerm)}".</div>
                    ` : filtered.map((r, idx) => renderWaterfallRow(r, idx, maxMs)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Renders a single resource row in the waterfall timeline.
     */
    function renderWaterfallRow(r, idx, maxMs) {
        const startPct = Math.max(0, Math.min(100, (r.startTime / maxMs) * 100));
        const totalDurationPct = Math.max(0.5, Math.min(100 - startPct, (r.duration / maxMs) * 100));

        // Phases calculation as percentages of this item's bar width
        const p = r.phases || {};
        const dur = r.duration || 1;
        const pStalled = ((p.stalled || 0) / dur) * 100;
        const pDns     = ((p.dns || 0) / dur) * 100;
        const pConnect = (((p.connect || 0) + (p.ssl || 0)) / dur) * 100;
        const pTtfb    = ((p.ttfb || 0) / dur) * 100;
        const pDl      = ((p.download || 0) / dur) * 100;

        return `
            <div class="wf-row" data-url="${escapeHtml(r.url)}" data-index="${idx}">
                <div class="wf-col-name" title="${escapeHtml(r.url)}">
                    <span class="wf-type-badge tag-${r.typeTag}">${r.typeLabel}</span>
                    <span class="wf-filename">${escapeHtml(r.name)}</span>
                </div>

                <div class="wf-col-meta">
                    <span class="wf-size">${r.sizeFormatted}</span>
                    <span class="wf-duration">${r.durationFormatted}</span>
                </div>

                <div class="wf-col-bars">
                    <div class="wf-bar-track">
                        <div class="wf-bar-wrapper" style="left: ${startPct}%; width: ${totalDurationPct}%;"
                             data-tooltip="${escapeHtml(r.name)}: Start ${r.startTime}ms | Duration ${r.duration}ms (TTFB ${p.ttfb || 0}ms, DL ${p.download || 0}ms)">
                            ${pStalled > 0 ? `<div class="wf-bar-segment phase-stalled" style="width:${pStalled}%" title="Stalled: ${p.stalled}ms"></div>` : ''}
                            ${pDns > 0 ? `<div class="wf-bar-segment phase-dns" style="width:${pDns}%" title="DNS: ${p.dns}ms"></div>` : ''}
                            ${pConnect > 0 ? `<div class="wf-bar-segment phase-connect" style="width:${pConnect}%" title="Connect/SSL: ${p.connect}ms"></div>` : ''}
                            ${pTtfb > 0 ? `<div class="wf-bar-segment phase-ttfb" style="width:${pTtfb}%" title="TTFB: ${p.ttfb}ms"></div>` : ''}
                            <div class="wf-bar-segment phase-download bar-${r.typeTag}" style="width:${pDl > 0 ? pDl : 100}%" title="Download: ${p.download || r.duration}ms"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Sorts waterfall resources by key.
     */
    function sortWaterfallResources(list, sortBy) {
        const arr = [...list];
        switch (sortBy) {
            case 'startTime': return arr.sort((a, b) => a.startTime - b.startTime);
            case 'duration':  return arr.sort((a, b) => b.duration - a.duration);
            case 'size':      return arr.sort((a, b) => b.size - a.size);
            case 'ttfb':      return arr.sort((a, b) => (b.phases?.ttfb || 0) - (a.phases?.ttfb || 0));
            default:          return arr;
        }
    }

    /**
     * Renders Third-Party Origin Breakdown Card.
     */
    function renderOriginBreakdownCard(resourceData, containerEl) {
        if (!containerEl) return;
        const resources = resourceData ? resourceData.resources || [] : [];
        if (resources.length === 0) {
            containerEl.innerHTML = '';
            return;
        }

        // Aggregate by domain origin
        const origins = {};
        let totalSize = 0;

        for (const r of resources) {
            const domain = r.domain || 'same-origin';
            if (!origins[domain]) {
                origins[domain] = { count: 0, size: 0, durationSum: 0, types: new Set() };
            }
            origins[domain].count++;
            origins[domain].size += r.size;
            origins[domain].durationSum += r.duration;
            origins[domain].types.add(r.typeLabel);
            totalSize += r.size;
        }

        const sortedOrigins = Object.keys(origins).map(dom => ({
            domain: dom,
            count: origins[dom].count,
            size: origins[dom].size,
            sizeFormatted: WP.resources ? WP.resources.formatBytes(origins[dom].size) : origins[dom].size + ' B',
            pct: totalSize > 0 ? Math.round((origins[dom].size / totalSize) * 1000) / 10 : 0,
            avgDuration: Math.round(origins[dom].durationSum / origins[dom].count),
            types: Array.from(origins[dom].types).join(', ')
        })).sort((a, b) => b.size - a.size);

        // Detect potential heavy script or third-party issues
        const mainThreadHeavy = resources.filter(r => r.type === 'script' && (r.size > 50000 || r.duration > 150));

        containerEl.innerHTML = `
            <div class="grid-layout origin-diagnostics-grid">
                <!-- Domain Origin Breakdown Card -->
                <section class="card origin-card">
                    <div class="card-header-flex">
                        <h2>Third-Party & Origin Breakdown</h2>
                        <span class="resource-summary-badge">${sortedOrigins.length} Origins</span>
                    </div>
                    <p class="card-subtitle">Aggregated payload distribution across first-party and third-party host domains.</p>
                    
                    <div class="origin-list">
                        ${sortedOrigins.map(o => `
                            <div class="origin-row">
                                <div class="origin-info">
                                    <span class="origin-domain">${escapeHtml(o.domain)}</span>
                                    <span class="origin-meta">${o.count} requests (${o.types})</span>
                                </div>
                                <div class="origin-progress-container">
                                    <div class="origin-progress-bar">
                                        <div class="origin-progress-fill" style="width: ${Math.max(2, o.pct)}%"></div>
                                    </div>
                                    <span class="origin-size-pct">${o.sizeFormatted} (${o.pct}%)</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <!-- Main-Thread Execution & Render-Blocking Card -->
                <section class="card mainthread-card">
                    <div class="card-header-flex">
                        <h2>Main-Thread & Execution Bottlenecks</h2>
                        <span class="status-badge ${mainThreadHeavy.length > 0 ? 'status-needs' : 'status-good'}">
                            ${mainThreadHeavy.length > 0 ? mainThreadHeavy.length + ' High Impact' : 'Optimal'}
                        </span>
                    </div>
                    <p class="card-subtitle">Identifies large JavaScript bundles and render-blocking resources that delay main-thread execution.</p>

                    <div class="mainthread-list">
                        ${mainThreadHeavy.length === 0 ? `
                            <div class="rec-item">
                                <span class="rec-icon">✅</span>
                                <div class="rec-text">
                                    <div class="rec-title">No Heavy Script Execution Bottlenecks Detected</div>
                                    <div class="rec-desc">All loaded JavaScript bundles are lightweight (&lt; 50 KB) and executed without blocking the main thread.</div>
                                </div>
                            </div>
                        ` : mainThreadHeavy.map(s => `
                            <div class="issue-item severity-warning">
                                <span class="issue-icon">⚡</span>
                                <div class="issue-text">
                                    <div class="issue-title">Heavy Script Bundle: ${escapeHtml(s.name)}</div>
                                    <div class="issue-desc">
                                        Size: <strong>${s.sizeFormatted}</strong> | Duration: <strong>${s.durationFormatted}</strong> | Domain: <code>${escapeHtml(s.domain)}</code><br>
                                        Consider splitting code with dynamic <code>import()</code> or deferring script evaluation.
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>
        `;
    }

    /**
     * Attaches interactive event listeners to waterfall elements.
     */
    function attachWaterfallEventListeners(resourceData, metrics, containerEl) {
        // Search Input
        const searchInput = containerEl.querySelector('#waterfallSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentWaterfallState.searchTerm = e.target.value;
                refreshWaterfallGraphic(resourceData, metrics, containerEl);
            });
        }

        // Filter Pills
        const pills = containerEl.querySelectorAll('.wf-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentWaterfallState.filterType = pill.dataset.type;
                refreshWaterfallGraphic(resourceData, metrics, containerEl);
            });
        });

        // Sort Select
        const sortSelect = containerEl.querySelector('#waterfallSortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentWaterfallState.sortBy = e.target.value;
                refreshWaterfallGraphic(resourceData, metrics, containerEl);
            });
        }

        // Zoom Select
        const zoomSelect = containerEl.querySelector('#waterfallZoomSelect');
        if (zoomSelect) {
            zoomSelect.addEventListener('change', (e) => {
                currentWaterfallState.zoomScale = parseInt(e.target.value, 10);
                refreshWaterfallGraphic(resourceData, metrics, containerEl);
            });
        }

        // Row Click Inspection
        const rows = containerEl.querySelectorAll('.wf-row');
        rows.forEach(row => {
            row.addEventListener('click', () => {
                const url = row.dataset.url;
                const resource = resourceData?.resources.find(r => r.url === url);
                if (resource) {
                    showResourceInspectorModal(resource, containerEl);
                }
            });
        });
    }

    /**
     * Refreshes the inner graphic of the waterfall when state changes.
     */
    function refreshWaterfallGraphic(resourceData, metrics, containerEl) {
        const wfContainer = containerEl.querySelector('#waterfallContainer');
        if (!wfContainer) return;

        const resources = resourceData ? resourceData.resources || [] : [];
        const maxMs = calculateMaxTimelineDuration(resources, metrics);
        wfContainer.innerHTML = renderWaterfallGraphic(resources, metrics, maxMs);

        // Re-attach row click listeners
        const rows = wfContainer.querySelectorAll('.wf-row');
        rows.forEach(row => {
            row.addEventListener('click', () => {
                const url = row.dataset.url;
                const resource = resourceData?.resources.find(r => r.url === url);
                if (resource) {
                    showResourceInspectorModal(resource, containerEl);
                }
            });
        });
    }

    /**
     * Shows a detailed modal drawer for a selected resource item.
     */
    function showResourceInspectorModal(r, containerEl) {
        let drawer = containerEl.querySelector('#waterfallInspectorModal');
        if (!drawer) return;

        const p = r.phases || {};

        drawer.innerHTML = `
            <div class="inspector-backdrop"></div>
            <div class="inspector-modal-content card">
                <div class="inspector-header">
                    <h3>Resource Timing Inspector</h3>
                    <button class="btn-close-modal" id="closeInspectorBtn">&times;</button>
                </div>

                <div class="inspector-body">
                    <div class="inspector-url-box">
                        <span class="type-tag tag-${r.typeTag}">${r.typeLabel}</span>
                        <code class="inspector-full-url">${escapeHtml(r.url)}</code>
                    </div>

                    <div class="inspector-grid">
                        <div class="inspector-metric">
                            <span class="ins-lbl">Transfer Size</span>
                            <span class="ins-val">${r.sizeFormatted}</span>
                        </div>
                        <div class="inspector-metric">
                            <span class="ins-lbl">Decoded Size</span>
                            <span class="ins-val">${WP.resources ? WP.resources.formatBytes(r.decodedBodySize) : r.decodedBodySize + ' B'}</span>
                        </div>
                        <div class="inspector-metric">
                            <span class="ins-lbl">Total Duration</span>
                            <span class="ins-val">${r.durationFormatted}</span>
                        </div>
                        <div class="inspector-metric">
                            <span class="ins-lbl">Start Time</span>
                            <span class="ins-val">${r.startTime} ms</span>
                        </div>
                        <div class="inspector-metric">
                            <span class="ins-lbl">Protocol</span>
                            <span class="ins-val">${escapeHtml(r.nextHopProtocol || 'h2')}</span>
                        </div>
                        <div class="inspector-metric">
                            <span class="ins-lbl">Origin</span>
                            <span class="ins-val">${escapeHtml(r.domain)}</span>
                        </div>
                    </div>

                    <h4 class="inspector-section-title">Phase Timing Breakdown</h4>
                    <div class="phase-breakdown-list">
                        <div class="phase-item">
                            <span class="phase-dot phase-stalled"></span>
                            <span class="phase-name">Stalled / Queueing</span>
                            <span class="phase-duration-val">${p.stalled || 0} ms</span>
                        </div>
                        <div class="phase-item">
                            <span class="phase-dot phase-dns"></span>
                            <span class="phase-name">DNS Lookup</span>
                            <span class="phase-duration-val">${p.dns || 0} ms</span>
                        </div>
                        <div class="phase-item">
                            <span class="phase-dot phase-connect"></span>
                            <span class="phase-name">TCP Connection & SSL</span>
                            <span class="phase-duration-val">${(p.connect || 0) + (p.ssl || 0)} ms</span>
                        </div>
                        <div class="phase-item">
                            <span class="phase-dot phase-ttfb"></span>
                            <span class="phase-name">Time To First Byte (TTFB)</span>
                            <span class="phase-duration-val">${p.ttfb || 0} ms</span>
                        </div>
                        <div class="phase-item">
                            <span class="phase-dot phase-download"></span>
                            <span class="phase-name">Content Download</span>
                            <span class="phase-duration-val">${p.download || r.duration} ms</span>
                        </div>
                    </div>
                </div>

                <div class="inspector-footer">
                    <button class="btn btn-secondary btn-sm" id="closeInspectorBtn2">Close</button>
                </div>
            </div>
        `;

        drawer.classList.remove('hidden');

        const closeBtns = drawer.querySelectorAll('#closeInspectorBtn, #closeInspectorBtn2, .inspector-backdrop');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => drawer.classList.add('hidden'));
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Expose Public API
    WP.waterfall = {
        renderWaterfallCard,
        renderOriginBreakdownCard,
    };

})(window.WebPulse);

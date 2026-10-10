/**
 * throttling.js — WebPulse Network & Device Profile Throttling Simulator
 *
 * Simulates how performance metrics (LCP, TTFB, INP, Page Load) and WebPulse Score
 * behave under throttled network profiles (Fast 3G, Slow 3G, 4G) and CPU slowdowns.
 */

'use strict';

(function () {
    window.WebPulse = window.WebPulse || {};

    const NETWORK_PROFILES = {
        none: {
            id: 'none',
            name: 'Unthrottled (WiFi/Fiber)',
            desc: 'Native full-speed connection',
            rttAdd: 0,
            latencyMult: 1.0,
            speedKbps: '∞'
        },
        '4g': {
            id: '4g',
            name: '4G / Fast LTE',
            desc: '20ms RTT, ~10 Mbps speed',
            rttAdd: 20,
            latencyMult: 1.25,
            speedKbps: '10,000'
        },
        fast3g: {
            id: 'fast3g',
            name: 'Fast 3G Profile',
            desc: '150ms RTT, 1.6 Mbps download',
            rttAdd: 150,
            latencyMult: 1.85,
            speedKbps: '1,600'
        },
        slow3g: {
            id: 'slow3g',
            name: 'Slow 3G Profile',
            desc: '400ms RTT, 400 Kbps download',
            rttAdd: 400,
            latencyMult: 2.90,
            speedKbps: '400'
        }
    };

    const CPU_PROFILES = {
        '1x': { id: '1x', name: 'No CPU Slowdown (1x)', mult: 1.0, inpMult: 1.0 },
        '2x': { id: '2x', name: '2x Mid-tier CPU', mult: 1.2, inpMult: 1.6 },
        '4x': { id: '4x', name: '4x Budget Device CPU', mult: 1.45, inpMult: 2.3 },
        '6x': { id: '6x', name: '6x Low-end Device CPU', mult: 1.75, inpMult: 3.5 }
    };

    /**
     * Calculates projected metrics under selected network & CPU throttling conditions.
     */
    function simulateMetrics(baseMetrics, netKey = 'none', cpuKey = '1x') {
        if (!baseMetrics || !baseMetrics.cwv) return null;

        const net = NETWORK_PROFILES[netKey] || NETWORK_PROFILES.none;
        const cpu = CPU_PROFILES[cpuKey] || CPU_PROFILES['1x'];

        // Clone base metrics structure
        const origLCP = baseMetrics.cwv.lcp.value || 0;
        const origTTFB = baseMetrics.loading.ttfb.value || 0;
        const origINP = baseMetrics.cwv.inp.value || 0;
        const origFCP = baseMetrics.loading.fcp.value || 0;
        const origDOM = baseMetrics.loading.domLoad.value || 0;
        const origPageLoad = baseMetrics.loading.pageLoad.value || 0;

        // Apply network & CPU multipliers
        const estTTFB = Math.round(origTTFB * net.latencyMult + net.rttAdd);
        const estFCP = Math.round(origFCP * net.latencyMult * cpu.mult + net.rttAdd * 0.8);
        const estLCP = Math.round(origLCP * net.latencyMult * cpu.mult + net.rttAdd * 1.2);
        const estINP = Math.round(origINP * cpu.inpMult + net.rttAdd * 0.15);
        const estDOM = Math.round(origDOM * net.latencyMult * cpu.mult);
        const estPageLoad = Math.round(origPageLoad * net.latencyMult * cpu.mult + net.rttAdd * 1.5);

        // Format helper with universal fallback
        const formatFn = (val) => {
            if (window.WebPulse?.performance?.formatMs) return window.WebPulse.performance.formatMs(val);
            if (window.WebPulse?.settings?.formatTime) return window.WebPulse.settings.formatTime(val);
            return Math.round(val) + ' ms';
        };

        const simCwv = {
            lcp: { value: estLCP, formatted: formatFn(estLCP) },
            cls: { value: baseMetrics.cwv?.cls?.value ?? 0.05, formatted: baseMetrics.cwv?.cls?.formatted ?? '0.050' },
            inp: { value: estINP, formatted: formatFn(estINP) }
        };

        const simLoading = {
            fcp: { value: estFCP, formatted: formatFn(estFCP) },
            ttfb: { value: estTTFB, formatted: formatFn(estTTFB) },
            domLoad: { value: estDOM, formatted: formatFn(estDOM) },
            pageLoad: { value: estPageLoad, formatted: formatFn(estPageLoad) }
        };

        const simScoreFn = window.WebPulse?.scoring?.computeScore || window.WebPulse?.scoring?.calculate;
        const simScoreResult = typeof simScoreFn === 'function' ?
            simScoreFn(
                { cwv: simCwv, loading: simLoading },
                window.WebPulse.lastResources || { grandTotal: 0, count: 0, totals: {} },
                window.WebPulse.lastIssues || []
            ) : { score: 80, rating: 'Good' };

        return {
            netProfile: net,
            cpuProfile: cpu,
            original: {
                lcp: origLCP,
                ttfb: origTTFB,
                inp: origINP,
                pageLoad: origPageLoad,
                score: baseMetrics.score || 100
            },
            simulated: {
                lcp: estLCP,
                ttfb: estTTFB,
                inp: estINP,
                pageLoad: estPageLoad,
                score: simScoreResult.score,
                rating: simScoreResult.rating,
                cwv: simCwv,
                loading: simLoading
            }
        };
    }

    /**
     * Renders Throttling Simulator Panel into container.
     */
    function renderSimulatorPanel(container, baseMetrics, onUpdateCallback) {
        if (!container) return;

        let activeNet = 'none';
        let activeCpu = '1x';

        function updateView() {
            const result = simulateMetrics(baseMetrics, activeNet, activeCpu);
            if (!result) return;

            const isThrottled = activeNet !== 'none' || activeCpu !== '1x';
            const scoreDelta = result.simulated.score - result.original.score;
            const scoreDeltaText = scoreDelta === 0 ? '0' : (scoreDelta > 0 ? `+${scoreDelta}` : `${scoreDelta}`);
            const deltaClass = scoreDelta < 0 ? 'text-poor' : (scoreDelta > 0 ? 'text-good' : '');

            let html = `
                <div class="card throttling-card">
                    <div class="card-header-flex">
                        <div class="header-with-badge">
                            <h2>Network &amp; Device Throttling Simulator</h2>
                            <span class="status-badge ${isThrottled ? 'status-needs' : 'status-good'}">
                                ${isThrottled ? 'Simulation Active ⚡' : 'Native Connection'}
                            </span>
                        </div>
                    </div>
                    <p class="throttling-desc">
                        Simulate how network latency, bandwidth constraints, and CPU slowdowns impact Core Web Vitals and overall performance score.
                    </p>
                    <div class="throttling-controls-grid">
                        <div class="control-group">
                            <label for="netSimSelect">Network Profile:</label>
                            <select id="netSimSelect" class="form-select">
                                ${Object.values(NETWORK_PROFILES).map(p => `
                                    <option value="${p.id}" ${p.id === activeNet ? 'selected' : ''}>
                                        ${p.name} (${p.desc})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="control-group">
                            <label for="cpuSimSelect">CPU Throttling:</label>
                            <select id="cpuSimSelect" class="form-select">
                                ${Object.values(CPU_PROFILES).map(c => `
                                    <option value="${c.id}" ${c.id === activeCpu ? 'selected' : ''}>
                                        ${c.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    ${isThrottled ? `
                        <div class="sim-results-grid">
                            <div class="sim-result-box">
                                <span class="sim-lbl">Projected Score</span>
                                <span class="sim-val ${deltaClass}">${result.simulated.score} <small>(${scoreDeltaText} pts)</small></span>
                            </div>
                            <div class="sim-result-box">
                                <span class="sim-lbl">Projected LCP</span>
                                <span class="sim-val">${(result.simulated.lcp / 1000).toFixed(2)}s</span>
                            </div>
                            <div class="sim-result-box">
                                <span class="sim-lbl">Projected TTFB</span>
                                <span class="sim-val">${result.simulated.ttfb} ms</span>
                            </div>
                            <div class="sim-result-box">
                                <span class="sim-lbl">Projected Page Load</span>
                                <span class="sim-val">${(result.simulated.pageLoad / 1000).toFixed(2)}s</span>
                            </div>
                        </div>
                    ` : `
                        <div class="sim-placeholder-tip">
                            💡 Select a network or CPU profile above to simulate real-world mobile device performance.
                        </div>
                    `}
                </div>
            `;

            container.innerHTML = html;

            const netSelect = container.querySelector('#netSimSelect');
            const cpuSelect = container.querySelector('#cpuSimSelect');

            if (netSelect) {
                netSelect.addEventListener('change', (e) => {
                    activeNet = e.target.value;
                    updateView();
                    if (onUpdateCallback) onUpdateCallback(simulateMetrics(baseMetrics, activeNet, activeCpu));
                });
            }
            if (cpuSelect) {
                cpuSelect.addEventListener('change', (e) => {
                    activeCpu = e.target.value;
                    updateView();
                    if (onUpdateCallback) onUpdateCallback(simulateMetrics(baseMetrics, activeNet, activeCpu));
                });
            }
        }

        updateView();
    }

    window.WebPulse.throttling = {
        profiles: NETWORK_PROFILES,
        cpuProfiles: CPU_PROFILES,
        simulate: simulateMetrics,
        simulateMetrics: simulateMetrics,
        renderPanel: renderSimulatorPanel
    };
})();

/**
 * audits.js — WebPulse Best Practices, Security & SEO Audit Engine
 *
 * Runs automated client-side checks for web security, mobile responsiveness,
 * SEO meta tags, accessibility foundations, and modern performance standards.
 */

'use strict';

(function () {
    /**
     * Executes all best practices & security audits.
     * @param {Object} [presetData] Optional preset data for simulation profiles
     * @returns {Object} Comprehensive audit report
     */
    function runAudits(presetData = null) {
        const results = [];

        // 1. Secure Context / Protocol Check
        const isHttps = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        results.push({
            id: 'security-https',
            category: 'security',
            title: 'Uses HTTPS / Secure Transport',
            status: isHttps ? 'pass' : 'fail',
            score: isHttps ? 100 : 0,
            summary: isHttps
                ? `Connection is encrypted via secure protocol (${location.protocol}).`
                : 'Page is served over insecure HTTP plaintext transport.',
            recommendation: 'Enforce HTTPS everywhere with HTTP Strict Transport Security (HSTS) headers and automatic 301 redirects.'
        });

        // 2. Mixed Content Check
        let mixedContentCount = 0;
        const allHttpLinks = [];
        document.querySelectorAll('script[src], link[rel="stylesheet"][href], img[src]').forEach(node => {
            const src = node.getAttribute('src') || node.getAttribute('href') || '';
            if (src.startsWith('http://')) {
                mixedContentCount++;
                allHttpLinks.push(src);
            }
        });
        if (presetData && !presetData.isLive) {
            // Simulated preset checks
            if (presetData.id === 'news_media') mixedContentCount = 2;
        }

        results.push({
            id: 'security-mixed-content',
            category: 'security',
            title: 'No Insecure Mixed Content',
            status: mixedContentCount === 0 ? 'pass' : 'fail',
            score: mixedContentCount === 0 ? 100 : 0,
            summary: mixedContentCount === 0
                ? 'All loaded sub-resources use secure HTTPS protocols.'
                : `Detected ${mixedContentCount} insecure HTTP assets causing mixed-content security warnings.`,
            recommendation: 'Upgrade all static asset URLs to use https:// or protocol-relative schemes.'
        });

        // 3. External Links Security (rel="noopener noreferrer")
        const insecureBlankLinks = Array.from(document.querySelectorAll('a[target="_blank"]')).filter(a => {
            const rel = (a.getAttribute('rel') || '').toLowerCase();
            return !rel.includes('noopener') && !rel.includes('noreferrer');
        });
        results.push({
            id: 'security-noopener',
            category: 'security',
            title: 'External Links Use rel="noopener"',
            status: insecureBlankLinks.length === 0 ? 'pass' : 'warn',
            score: insecureBlankLinks.length === 0 ? 100 : 50,
            summary: insecureBlankLinks.length === 0
                ? 'All window.open and target="_blank" anchors prevent reverse tabnabbing.'
                : `Found ${insecureBlankLinks.length} external links without rel="noopener noreferrer".`,
            recommendation: 'Add rel="noopener noreferrer" to all hyperlinks targeting external browser windows.'
        });

        // 4. Content Security Policy (CSP)
        const hasCspMeta = !!document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        results.push({
            id: 'security-csp',
            category: 'security',
            title: 'Content Security Policy (CSP)',
            status: hasCspMeta ? 'pass' : 'warn',
            score: hasCspMeta ? 100 : 60,
            summary: hasCspMeta
                ? 'Content Security Policy meta tag is present to mitigate XSS.'
                : 'No client CSP meta header found (recommended to define in HTTP response headers or meta).',
            recommendation: 'Configure a strong Content-Security-Policy (e.g., default-src \'self\'; script-src \'self\').'
        });

        // 5. Mobile Responsive Viewport
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        const hasGoodViewport = viewportMeta && (viewportMeta.getAttribute('content') || '').includes('width=device-width');
        results.push({
            id: 'seo-viewport',
            category: 'seo',
            title: 'Configured Mobile Viewport',
            status: hasGoodViewport ? 'pass' : 'fail',
            score: hasGoodViewport ? 100 : 0,
            summary: hasGoodViewport
                ? 'Valid meta viewport tag found with width=device-width.'
                : 'Missing or misconfigured mobile meta viewport tag.',
            recommendation: 'Ensure <meta name="viewport" content="width=device-width, initial-scale=1.0"> is in document <head>.'
        });

        // 6. Document Title & Description
        const titleText = (document.title || '').trim();
        const descMeta = document.querySelector('meta[name="description"]');
        const descText = descMeta ? (descMeta.getAttribute('content') || '').trim() : '';
        const titleOk = titleText.length >= 10;
        const descOk = descText.length >= 20;
        const metaStatus = (titleOk && descOk) ? 'pass' : (titleOk || descOk) ? 'warn' : 'fail';
        results.push({
            id: 'seo-metadata',
            category: 'seo',
            title: 'Document Title & Meta Description',
            status: metaStatus,
            score: metaStatus === 'pass' ? 100 : (metaStatus === 'warn' ? 60 : 0),
            summary: `Title: "${titleText.slice(0, 30)}..." (${titleText.length} chars). Description: ${descText ? `${descText.length} chars.` : 'Missing.'}`,
            recommendation: 'Provide a descriptive title (15-60 chars) and a concise meta description (50-160 chars) for search crawlers.'
        });

        // 7. Semantic Heading Hierarchy
        const h1List = document.querySelectorAll('h1');
        const h1Status = h1List.length === 1 ? 'pass' : (h1List.length > 1 ? 'warn' : 'fail');
        results.push({
            id: 'seo-headings',
            category: 'seo',
            title: 'Semantic Heading Hierarchy',
            status: h1Status,
            score: h1Status === 'pass' ? 100 : (h1Status === 'warn' ? 70 : 30),
            summary: h1List.length === 1
                ? 'Page has exactly one clear primary <h1> heading.'
                : `Page contains ${h1List.length} <h1> tags. Expected exactly 1 primary heading.`,
            recommendation: 'Maintain a clean outline with a single <h1> heading followed by <h2> and <h3> subheadings.'
        });

        // 8. Explicit Image Dimensions (CLS prevention)
        const images = Array.from(document.querySelectorAll('img'));
        let missingDims = 0;
        images.forEach(img => {
            const hasW = img.hasAttribute('width') || (img.style.width && img.style.width !== 'auto');
            const hasH = img.hasAttribute('height') || (img.style.height && img.style.height !== 'auto');
            if (!hasW || !hasH) missingDims++;
        });
        if (presetData && !presetData.isLive) {
            if (presetData.id === 'ecommerce') missingDims = 3;
            if (presetData.id === 'news_media') missingDims = 4;
            if (presetData.id === 'jamstack_blog') missingDims = 0;
        }

        const dimsStatus = missingDims === 0 ? 'pass' : (missingDims <= 2 ? 'warn' : 'fail');
        results.push({
            id: 'perf-image-dims',
            category: 'practices',
            title: 'Explicit Image Dimensions (CLS)',
            status: dimsStatus,
            score: dimsStatus === 'pass' ? 100 : (dimsStatus === 'warn' ? 60 : 20),
            summary: missingDims === 0
                ? 'All inspected images specify explicit width & height attributes.'
                : `Detected ${missingDims} image(s) lacking intrinsic dimensions, which causes layout shifts during render.`,
            recommendation: 'Always set explicit width and height HTML attributes on <img> tags to reserve render space.'
        });

        // 9. Modern Web Image Formats
        let legacyFormats = 0;
        let modernFormats = 0;
        images.forEach(img => {
            const src = (img.src || '').toLowerCase();
            if (src.endsWith('.webp') || src.endsWith('.avif') || src.endsWith('.svg')) modernFormats++;
            else if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.gif')) legacyFormats++;
        });
        if (presetData && !presetData.isLive) {
            if (presetData.id === 'ecommerce') { legacyFormats = 3; modernFormats = 0; }
            if (presetData.id === 'news_media') { legacyFormats = 2; modernFormats = 0; }
            if (presetData.id === 'jamstack_blog') { legacyFormats = 0; modernFormats = 2; }
        }

        const imgFormatStatus = (legacyFormats === 0) ? 'pass' : (modernFormats > 0 ? 'warn' : 'fail');
        results.push({
            id: 'perf-modern-formats',
            category: 'practices',
            title: 'Modern Image Formats (WebP / AVIF)',
            status: imgFormatStatus,
            score: imgFormatStatus === 'pass' ? 100 : (imgFormatStatus === 'warn' ? 65 : 30),
            summary: legacyFormats === 0
                ? 'Images use modern compressed formats (WebP, AVIF, or SVG).'
                : `Detected ${legacyFormats} legacy JPEG/PNG images that could be converted to WebP/AVIF to reduce file size up to 40%.`,
            recommendation: 'Serve modern responsive formats using the <picture> element with WebP or AVIF source fallbacks.'
        });

        // 10. Font Display Swap Verification
        const fontLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"][href*="fonts"]'));
        const hasSwap = fontLinks.some(l => (l.getAttribute('href') || '').includes('display=swap'));
        const fontStatus = fontLinks.length === 0 || hasSwap ? 'pass' : 'warn';
        results.push({
            id: 'perf-font-display',
            category: 'practices',
            title: 'Font Loading Optimization (font-display: swap)',
            status: fontStatus,
            score: fontStatus === 'pass' ? 100 : 60,
            summary: fontStatus === 'pass'
                ? 'External web fonts specify display=swap or use system fallbacks to avoid flash of invisible text.'
                : 'Web font link does not include display=swap, potentially causing invisible text delay (FOIT).',
            recommendation: 'Add &display=swap query parameter to Google Fonts URLs or declare font-display: swap in CSS.'
        });

        // Aggregation
        const totalScore = Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length);
        const passedCount = results.filter(r => r.status === 'pass').length;
        const warnCount = results.filter(r => r.status === 'warn').length;
        const failCount = results.filter(r => r.status === 'fail').length;

        // Category breakdown
        const cats = {
            security: Math.round(results.filter(r => r.category === 'security').reduce((a, b) => a + b.score, 0) / 4),
            seo: Math.round(results.filter(r => r.category === 'seo').reduce((a, b) => a + b.score, 0) / 3),
            practices: Math.round(results.filter(r => r.category === 'practices').reduce((a, b) => a + b.score, 0) / 3)
        };

        return {
            overallScore: totalScore,
            rating: totalScore >= 90 ? 'Excellent' : (totalScore >= 70 ? 'Good' : (totalScore >= 50 ? 'Needs Work' : 'Poor')),
            passedCount,
            warnCount,
            failCount,
            categoryScores: cats,
            audits: results
        };
    }

    /**
     * Renders the Best Practices & Security Audit Card.
     */
    function renderAuditsCard(container, auditReport) {
        if (!container) return;

        const { overallScore, rating, passedCount, warnCount, failCount, categoryScores, audits } = auditReport;
        const scoreClass = overallScore >= 90 ? 'status-good' : (overallScore >= 70 ? 'status-needs' : 'status-poor');

        container.innerHTML = `
        <section class="card audits-card" id="auditsMainCard">
            <div class="card-header-flex">
                <div class="header-with-badge">
                    <h2>🛡️ Best Practices &amp; Security Audits</h2>
                    <span class="status-badge ${scoreClass}">${overallScore}/100 — ${rating}</span>
                </div>
                <div class="audits-filter-tabs" role="tablist">
                    <button class="audit-tab-btn active" data-filter="all">All (${audits.length})</button>
                    <button class="audit-tab-btn" data-filter="security">Security (${categoryScores.security}%)</button>
                    <button class="audit-tab-btn" data-filter="seo">SEO &amp; Mobile (${categoryScores.seo}%)</button>
                    <button class="audit-tab-btn" data-filter="practices">Modern Web (${categoryScores.practices}%)</button>
                </div>
            </div>

            <!-- Summary KPI Strip -->
            <div class="audits-summary-strip">
                <div class="audit-kpi-box kpi-pass">
                    <span class="kpi-num">${passedCount}</span>
                    <span class="kpi-lbl">Passed Checks</span>
                </div>
                <div class="audit-kpi-box kpi-warn">
                    <span class="kpi-num">${warnCount}</span>
                    <span class="kpi-lbl">Warnings</span>
                </div>
                <div class="audit-kpi-box kpi-fail">
                    <span class="kpi-num">${failCount}</span>
                    <span class="kpi-lbl">Failed Audits</span>
                </div>
                <div class="audit-kpi-box kpi-score">
                    <span class="kpi-num">${overallScore}%</span>
                    <span class="kpi-lbl">Health Index</span>
                </div>
            </div>

            <!-- Audit Items List -->
            <div class="audit-items-list" id="auditItemsList">
                ${audits.map(renderAuditItem).join('')}
            </div>
        </section>`;

        // Wire filtering tabs
        const tabBtns = container.querySelectorAll('.audit-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                container.querySelectorAll('.audit-item-row').forEach(row => {
                    if (filter === 'all' || row.dataset.category === filter) {
                        row.style.display = 'flex';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        });

        // Wire expandable details
        container.querySelectorAll('.audit-item-toggle').forEach(toggleBtn => {
            toggleBtn.addEventListener('click', () => {
                const parentRow = toggleBtn.closest('.audit-item-row');
                parentRow.classList.toggle('expanded');
                toggleBtn.textContent = parentRow.classList.contains('expanded') ? 'Hide Details ▲' : 'Details ▼';
            });
        });
    }

    function renderAuditItem(audit) {
        const badgeMap = {
            pass: { cls: 'pill-good', text: 'PASS' },
            warn: { cls: 'pill-needs', text: 'WARN' },
            fail: { cls: 'pill-poor', text: 'FAIL' }
        };
        const badge = badgeMap[audit.status];

        return `
        <div class="audit-item-row" data-category="${audit.category}">
            <div class="audit-item-header">
                <div class="audit-item-title-group">
                    <span class="audit-status-pill ${badge.cls}">${badge.text}</span>
                    <span class="audit-title">${escHtml(audit.title)}</span>
                </div>
                <button class="audit-item-toggle btn btn-sm btn-secondary">Details ▼</button>
            </div>
            <div class="audit-item-summary">${escHtml(audit.summary)}</div>
            <div class="audit-item-drawer">
                <div class="audit-rec-box">
                    <div class="audit-rec-label">💡 Recommended Action:</div>
                    <div class="audit-rec-text">${escHtml(audit.recommendation)}</div>
                </div>
            </div>
        </div>`;
    }

    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    window.WebPulse = window.WebPulse || {};
    window.WebPulse.audits = {
        runAudits,
        renderAuditsCard
    };
})();

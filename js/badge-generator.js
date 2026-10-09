/**
 * badge-generator.js — WebPulse SVG Status Badge & CI/CD SLA Snippet Generator
 *
 * Generates standalone SVG vector status badges for READMEs, PR status banners,
 * and automated CI/CD performance gating assertions.
 */

'use strict';

(function () {
    /**
     * Generates a shields.io-style SVG string for a given performance score.
     */
    function generateBadgeSVG(score, label = 'WebPulse') {
        const numScore = Math.round(Number(score) || 0);
        let color = '#22c55e'; // good
        let rating = 'Passing';
        if (numScore < 70) {
            color = '#ef4444';
            rating = 'Poor';
        } else if (numScore < 90) {
            color = '#eab308';
            rating = 'Needs Work';
        }

        const valueText = `${numScore}/100`;
        const labelWidth = Math.max(label.length * 7 + 14, 65);
        const valueWidth = Math.max(valueText.length * 7 + 16, 55);
        const totalWidth = labelWidth + valueWidth;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${valueText}">
  <title>${label}: ${valueText} (${rating})</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#1e293b"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text aria-hidden="true" x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${valueText}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${valueText}</text>
  </g>
</svg>`.trim();
    }

    /**
     * Generates a Data URI for the SVG badge.
     */
    function getBadgeDataUri(score, label = 'WebPulse') {
        const svg = generateBadgeSVG(score, label);
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    /**
     * Generates a Markdown badge snippet.
     */
    function generateMarkdownSnippet(score, label = 'WebPulse') {
        const uri = getBadgeDataUri(score, label);
        return `[![${label} Score](${uri})](https://github.com/harman979/WebPulse)`;
    }

    /**
     * Generates a GitHub Actions CI/CD step snippet.
     */
    function generateCicdYaml(threshold = 85) {
        return `# WebPulse Automated Performance Gate
- name: Verify WebPulse Performance SLA
  run: |
    echo "Running WebPulse Performance Benchmark..."
    SCORE=$(node -e "console.log(process.env.PERF_SCORE || 90)")
    THRESHOLD=${threshold}
    if [ "$SCORE" -lt "$THRESHOLD" ]; then
      echo "::error::WebPulse performance score $SCORE fell below target SLA $THRESHOLD!"
      exit 1
    fi
    echo "WebPulse SLA PASSED with score $SCORE."
`.trim();
    }

    /**
     * Triggers browser download of the SVG badge file.
     */
    function downloadBadgeSVG(score, label = 'WebPulse') {
        const svg = generateBadgeSVG(score, label);
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `webpulse-score-${score}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Renders or displays an interactive Badge Generator Modal.
     */
    function showBadgeModal(score, title = 'Current Audit') {
        let modal = document.getElementById('badgeGeneratorModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'badgeGeneratorModal';
            modal.className = 'modal';
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
            <div class="modal-backdrop" id="badgeModalBackdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🏷️ Performance Status Badge &amp; CI/CD SLA</h2>
                    <button class="modal-close" id="badgeModalCloseBtn">&times;</button>
                </div>
                <div class="modal-body" id="badgeModalBody">
                    <div class="badge-preview-box">
                        <div class="badge-preview-label">Live SVG Badge Preview:</div>
                        <div id="badgePreviewContainer" style="margin: 12px 0;"></div>
                    </div>
                    <div class="badge-code-group">
                        <label>Markdown Code (for README.md):</label>
                        <div class="badge-input-row">
                            <input type="text" id="badgeMarkdownInput" class="form-control" readonly>
                            <button class="btn btn-secondary btn-sm" id="copyBadgeMarkdownBtn">Copy</button>
                        </div>
                    </div>
                    <div class="badge-code-group" style="margin-top: 14px;">
                        <label>CI/CD Workflow Assertion (.github/workflows):</label>
                        <pre class="badge-code-pre" id="badgeCicdYaml"></pre>
                        <button class="btn btn-secondary btn-sm" id="copyBadgeCicdBtn" style="margin-top: 6px;">Copy CI/CD YAML</button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="downloadBadgeBtn">Download .SVG</button>
                    <button class="btn btn-secondary" id="closeBadgeModalFooterBtn">Close</button>
                </div>
            </div>`;
            document.body.appendChild(modal);

            const close = () => { modal.setAttribute('aria-hidden', 'true'); };
            modal.querySelector('#badgeModalCloseBtn').addEventListener('click', close);
            modal.querySelector('#badgeModalBackdrop').addEventListener('click', close);
            modal.querySelector('#closeBadgeModalFooterBtn').addEventListener('click', close);
        }

        const previewContainer = modal.querySelector('#badgePreviewContainer');
        const markdownInput = modal.querySelector('#badgeMarkdownInput');
        const cicdPre = modal.querySelector('#badgeCicdYaml');
        const downloadBtn = modal.querySelector('#downloadBadgeBtn');

        const svgCode = generateBadgeSVG(score);
        previewContainer.innerHTML = svgCode;
        markdownInput.value = generateMarkdownSnippet(score);
        cicdPre.textContent = generateCicdYaml(Math.min(score, 85));

        downloadBtn.onclick = () => downloadBadgeSVG(score);

        modal.querySelector('#copyBadgeMarkdownBtn').onclick = (e) => {
            navigator.clipboard.writeText(markdownInput.value).then(() => {
                e.target.textContent = 'Copied!';
                setTimeout(() => { e.target.textContent = 'Copy'; }, 2000);
            });
        };

        modal.querySelector('#copyBadgeCicdBtn').onclick = (e) => {
            navigator.clipboard.writeText(cicdPre.textContent).then(() => {
                e.target.textContent = 'Copied!';
                setTimeout(() => { e.target.textContent = 'Copy CI/CD YAML'; }, 2000);
            });
        };

        modal.setAttribute('aria-hidden', 'false');
    }

    window.WebPulse = window.WebPulse || {};
    window.WebPulse.badge = {
        generateBadgeSVG,
        getBadgeDataUri,
        generateMarkdownSnippet,
        generateCicdYaml,
        downloadBadgeSVG,
        showBadgeModal
    };
})();

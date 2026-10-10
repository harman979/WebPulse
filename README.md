# WebPulse

A comprehensive, browser-based web performance analyzer, diagnostics suite, and auditing platform built entirely with HTML, CSS, and vanilla JavaScript. WebPulse runs completely on the client side — no backend, no frameworks, no external libraries.

> **Analyze. Understand. Optimize. Export. Share.**

---

## 1. Project Description

WebPulse is a multi-tool web performance engineering suite that bundles real-time Core Web Vitals monitoring, deep resource profiling, synthetic architectural benchmarking, and automated diagnostic audits into a single unified web application:

| Tool / Module | Purpose |
| :--- | :--- |
| **Real-Time Performance Analyzer** | Measures live Core Web Vitals (LCP, CLS, INP) and Navigation Timing (FCP, TTFB, DOM Load, Page Load) using native browser performance timeline APIs. Supports targeting custom website URLs or current browser session. |
| **Network Waterfall & Origin Diagnostics** | Interactive visual resource timeline chart featuring multi-phase timing bars (Stalled, DNS, TCP/SSL, TTFB, Download), protocol detection, type filtering, duration zoom, and domain breakdown. |
| **Synthetic Scenario Profiles Sandbox** | Benchmarks diverse real-world web architectures (Live Session, E-Commerce Storefront, SaaS SPA, News & Media, Jamstack Blog) with authentic waterfalls and bottleneck distributions. |
| **Best Practices & Security Audit Engine** | Lighthouse-style automated diagnostic suite evaluating 10 web standard criteria across HTTPS encryption, mixed content, `rel="noopener"`, CSP, viewport, tags, image sizes, modern formats, and font loading. |
| **Device & Network Throttling Simulator** | Simulates Fast 3G, Slow 3G, 4G, and CPU throttling (1x to 6x) with real-time mathematical recalculation of projected Web Vitals and WebPulse Scores. |
| **Performance Budget & SLA Engine** | Configurable transfer size (Total, JS, CSS, Images) and timing SLA budgets with instant pass/warn/exceeded compliance status and progress meters. |
| **Actionable Code Remediation Generator** | Generates production-ready code snippets (preloading, lazy loading, font-display, caching headers, code splitting) for all detected bottlenecks with 1-click clipboard copy. |
| **12-Metric Comparison Suite** | Comprehensive side-by-side delta matrix comparing any two saved performance reports across 12 distinct metrics with winner badges and multi-format export. |
| **Historical Trends & Canvas Chart Engine** | Pure vanilla HTML5 Canvas 2D charting engine rendering Score Over Time, CWV multi-series line charts, metric selector trends, page size distributions, and 8 metric sparklines. |
| **Export, Share & SVG Status Badges** | Generates formatted JSON reports, spreadsheet-ready CSV tables, styled print/PDF documents, base64 URL shareable cards, and standalone shields.io-compatible vector SVG status badges with CI/CD YAML assertions. |
| **Settings & Configurable Scoring Model** | App-wide dark/light/system theme toggle, animations toggle, time unit formatting (`auto` / `ms`), custom metric threshold boundaries, and category weight redistribution sliders. |

Each module lives on its own dedicated page and shares a unified visual design system, delivering a seamless desktop-grade developer workspace.

---

## 2. Goals

* **100% Client-Side Architecture**: Execute every measurement, parsing, simulation, and visualization entirely inside the browser without requiring a backend server.
* **Demonstrate Practical Mastery of Modern Browser Platform APIs**:
  * **Performance Timeline & Navigation Timing API v2** — Millisecond-accurate extraction of `navigation` entries, legacy `performance.timing` fallbacks, TTFB, DOM Interactive, and Page Load durations.
  * **Resource Timing API** — Detailed inspection of transfer sizes, decoded body sizes, initiator types, and network protocols across all loaded assets.
  * **PerformanceObserver API** — Real-time event buffering for Core Web Vitals (`largest-contentful-paint`, `layout-shift`, `event` timing for INP).
  * **Canvas 2D API** — Hardware-accelerated custom vector charting engine with gradient fills, threshold baseline overlays, responsive resize listeners, and interactive hover tooltips (zero charting libraries).
  * **IndexedDB API** — Full asynchronous structured object storage (`WebPulseDB` v1) with multi-key indices, automatic quota-exceeding fallbacks, and schema validation.
  * **Web Storage API (`localStorage`)** — Instant synchronous persistence for user preferences, reports history, and metric threshold customizations.
  * **RFC-Compliant Cookie API** — Native cookie session tracking for active audit profiles, run counters, and page state.
  * **Clipboard API** — Instant one-click copy of generated remediation code snippets, share URLs, markdown badges, and CI/CD workflow YAML configs via `navigator.clipboard.writeText()`.
* **Zero External Dependencies**: Built strictly using standards-compliant HTML5, CSS3, and ES6+ JavaScript — no npm packages, no React/Vue, no Tailwind, and no Chart.js.
* **Immediate Zero-Config Execution**: Runs instantly by opening `index.html` in any modern web browser or launching a static local server.

---

## 3. Specifications

### 3.1 Real-Time Performance & Core Web Vitals Analyzer
* Measures Google's Core Web Vitals:
  * **LCP (Largest Contentful Paint)**: Render time of the largest visual element (Good: ≤ 2.5s, Needs Work: ≤ 4.0s).
  * **CLS (Cumulative Layout Shift)**: Sum total of all unexpected layout shifts (Good: ≤ 0.10, Needs Work: ≤ 0.25).
  * **INP (Interaction to Next Paint)**: Latency of user interaction feedback (Good: ≤ 200ms, Needs Work: ≤ 500ms).
* Captures key navigation milestones: **FCP (First Contentful Paint)**, **TTFB (Time to First Byte)**, **DOM Interactive / DOM Load**, and **Window Load**.
* Computes an overall **WebPulse Performance Score (0–100)** using a weighted algorithm:
  $$\text{Score} = (0.40 \times \text{CWV}) + (0.25 \times \text{Loading}) + (0.20 \times \text{Resources}) + (0.15 \times \text{Issues Penalty})$$
* **Target Website Input & Quick Benchmarks**: Accepts any custom target URL (`#targetSiteInput`) with Enter-key trigger, paired with quick benchmark chips (Example.com, GitHub SPA, Amazon Storefront, NYTimes Media, Current Local Context).

### 3.2 Network Waterfall & Resource Timing Inspector
* Generates an interactive visual resource waterfall timeline representing every network request.
* **Multi-Phase Timing Breakdown**: Calculates and colors discrete sub-millisecond phases: **Stalled / Blocked**, **DNS Lookup**, **TCP / SSL Handshake**, **TTFB Wait**, and **Content Download**.
* **Global Milestone Overlay Lines**: Overlays vertical marker lines for FCP, LCP, DOMContentLoaded, and Page Load directly across the timeline.
* **Interactive Controls**: Real-time URL search filter, initiator type pills (All, JS, CSS, Images, Fonts, Fetch/XHR), multi-criteria sort selector, and timeline zoom scale options (100%, 150%, 200%).
* **Resource Inspector Drawer**: Clickable modal displaying decoded vs transfer size, protocol (HTTP/1.1, h2, h3), domain origins, and timing breakdown.
* **Domain Origin Diagnostics**: Aggregates requests by host origin with visual progress bars and transfer size percentages.

### 3.3 Synthetic Scenario Profiles Sandbox
* Enables deterministic simulation of diverse web architectures without cross-origin browser restrictions:
  * **🛒 E-Commerce Storefront**: High-traffic product catalog with heavy unoptimized imagery, analytics trackers, and checkout scripts (~2.3 MB payload).
  * **💻 SaaS Web Application**: Single-page JavaScript application with large vendor bundles, state hydration, and API calls (~1.2 MB payload).
  * **📰 News & Media Publication**: Content publication with multiple third-party ad scripts, custom web fonts, and dynamic embeds (~1.9 MB payload).
  * **⚡ Optimized Jamstack Blog**: Top-tier static site with pre-rendered HTML, optimized WebP images, and minimal JavaScript (~114 KB payload, 98+ score).
  * **🌐 Live Page Context**: Direct measurement of active browser session Performance APIs.

### 3.4 Automated Best Practices, Security & SEO Audit Engine
* Lighthouse-style automated diagnostic suite evaluating 10 critical web quality criteria:
  1. **HTTPS / Secure Transport**: Verifies encrypted protocol delivery and HSTS readiness.
  2. **No Insecure Mixed Content**: Scans DOM for insecure `http://` sub-resources.
  3. **External Link Security**: Validates `rel="noopener noreferrer"` on all `target="_blank"` anchors to prevent reverse tabnabbing.
  4. **Content Security Policy (CSP)**: Checks for client CSP meta configuration to mitigate XSS.
  5. **Mobile Viewport Optimization**: Validates `<meta name="viewport" content="width=device-width">`.
  6. **Document Title & Meta Description**: Checks document title and SEO description metadata.
  7. **Semantic Heading Hierarchy**: Audits presence of single `<h1>` and valid heading outline.
  8. **Explicit Image Dimensions**: Flags images lacking explicit width and height attributes (CLS prevention).
  9. **Modern Image Formats**: Encourages modern compressed WebP / AVIF formats over legacy JPEG/PNG.
  10. **Font Loading Optimization**: Checks for `font-display: swap` to prevent Flash of Invisible Text (FOIT).

### 3.5 Device & Network Throttling Simulator
* Real-time projection simulation under throttled network profiles:
  * **Fast 3G**: 150ms RTT latency, 1.6 Mbps download speed.
  * **Slow 3G**: 400ms RTT latency, 400 Kbps download speed.
  * **4G / LTE**: 20ms RTT latency, 10 Mbps download speed.
* Simulated CPU slowdowns (**1x**, **2x Mid-tier**, **4x Budget Device**, **6x Low-end**) scaling script execution and interaction latency (INP).
* Live recalculation of projected Core Web Vitals and WebPulse Score with visual delta indicators.

### 3.6 Performance Budget & SLA Compliance Engine
* Enterprise SLA evaluation against configurable thresholds: Total Payload (≤ 2,000 KB), JavaScript (≤ 500 KB), CSS (≤ 120 KB), Images (≤ 1,000 KB), LCP (≤ 2,500ms), and Page Load (≤ 3,500ms).
* Visual compliance badges (`SLA Compliant ✅`, `Near Budget ⚠️`, `Budget Exceeded ❌`) with individual percentage progress meters.

### 3.7 Saved Reports History & 12-Metric Comparison Suite
* **Reports Management**: Search by title/URL/tag, filter by score rating, tag management, notes editor, and individual/bulk deletion.
* **12-Metric Side-by-Side Comparison Matrix**: Compares any two selected reports across WebPulse Score, LCP, CLS, INP, FCP, TTFB, DOM Loading, Page Load, Resource Count, Total Payload, Audits Score, and Bottleneck Count.
* Highlights winning metrics with green badge markers and computes percentage delta changes.
* **Sample Benchmark Seeding**: One-click demo dataset generator (`rpt_sample_01` to `rpt_sample_04`) for instant exploration on fresh sessions.

### 3.8 Canvas Historical Trends & Interactive Visualizations
* **Score Over Time Line Chart**: Full-width canvas line chart with Good (75) and Needs-Work (50) baseline threshold overlays.
* **Core Web Vitals Trend Chart**: Multi-series line chart tracking historical LCP, FCP, and TTFB latency.
* **Single Metric Selector**: Interactive chart toggleable between LCP, CLS, INP, FCP, TTFB, and Page Load.
* **Page Payload Bar Chart**: Visualizes resource size distributions across historical audits.
* **8 Metric Sparklines**: Micro-visualizations displaying latest value and percentage change relative to the first audit.
* **Interactive Tooltips**: Pure Canvas hover collision detection displaying exact report titles, timestamps, and values.

### 3.9 Multi-Format Export, Shareable URLs & Dynamic SVG Badges
* **JSON Export & Backup**: Full database snapshot export with schema validation, plus one-click backup restoration.
* **Spreadsheet CSV Export**: Formatted spreadsheet matrix exporting all vital metrics and resource counts.
* **Print / PDF View**: Clean, high-contrast printable document layout with print media styles.
* **Shareable URL Generator**: Serializes report snapshots into compact Base64 URL parameters (`share.html?d=...`) rendering a standalone read-only preview card.
* **Standalone SVG Status Badges**: Generates shields.io-compatible vector SVG status badges with instant Markdown copy, `.svg` vector file downloads, and GitHub Actions CI/CD SLA workflow assertions.

### 3.10 Settings, Preferences & Configurable Scoring Model
* **Color Theme**: Dark, Light, or System (auto-syncs with OS `prefers-color-scheme`), with a persistent quick-toggle `☀️` / `🌙` button in the header across every page.
* **Animations Toggle**: App-wide toggle to disable transitions and animations for accessibility and low-power devices.
* **Time Unit Selector**: Choose between `Auto` (values ≥ 1000ms displayed as seconds) or `Always ms`.
* **Custom Metric Thresholds**: Customize the Good and Needs-Improvement boundaries for all 7 timing metrics.
* **Scoring Weights Distribution**: Interactive sliders to customize category weights (CWV, Loading, Resources, Issues) ensuring they total 100%.

---

## 4. Design

### 4.1 Architecture

```text
WebPulse/
├── index.html              # Seamless entry point redirecting to html/index.html
├── html/                   # Application pages directory
│   ├── index.html          # Home landing page with navigation, hero stats & feature overview
│   ├── analyzer.html       # Performance Analyzer dashboard, waterfall, throttling & audits
│   ├── reports.html        # Saved reports history, detail modal & 12-metric comparison suite
│   ├── trends.html         # Historical Canvas trends, multi-series charts & sparklines
│   ├── settings.html       # Theme, animations, thresholds, weights & storage backup manager
│   └── share.html          # Standalone read-only shareable report preview card
├── css/
│   ├── style.css           # Global design system: tokens, typography, header, modals, utilities
│   ├── home.css            # Landing page layout, hero typography & feature cards
│   ├── analyzer.css        # Analyzer dashboard: score gauge, metric boxes, visualizer table
│   ├── waterfall.css       # Network waterfall timeline, phase bars & inspector drawer
│   ├── audits.css          # Best practices checklist, target URL card & SVG badge modal
│   ├── reports.css         # Reports table, detail cards & 12-metric comparison matrix
│   ├── trends.css          # Canvas chart containers, stat summary cards & sparklines
│   └── settings.css        # Settings workspace, sliders, inputs & storage stats
└── js/
    ├── main.js             # Global UI orchestrator: nav injection, theme toggle, keyboard shortcuts
    ├── settings.js         # Settings & preferences engine, weight calculations, custom event dispatch
    ├── performance.js      # Navigation Timing API v2, legacy timing fallbacks, CWV observers
    ├── resources.js        # Resource Timing API collection, classification & byte formatting
    ├── scoring.js          # Deterministic 4-category weighted scoring algorithm & rating classifier
    ├── recommendations.js  # Rule-based bottleneck detection & recommendation generator
    ├── presets.js          # Synthetic architectural profiles & normalized resource timelines
    ├── budgets.js          # Enterprise performance budgets & SLA compliance evaluator
    ├── throttling.js       # Network profile & CPU multiplier simulation engine
    ├── waterfall.js        # Waterfall timeline calculations, canvas/SVG phase renderers & drawer
    ├── audits.js           # 10-point automated best practices, security & SEO audit engine
    ├── storage.js          # LocalStorage CRUD persistence, search, filtering & benchmark seeding
    ├── idb-storage.js      # Asynchronous IndexedDB storage engine (WebPulseDB v1)
    ├── charts.js           # Pure vanilla Canvas 2D charting engine (line, bar, sparklines, tooltips)
    ├── trends.js           # Trends page controller, chart tab coordination & summary stats
    ├── reports.js          # Reports history controller, tag manager & comparison matrix
    ├── analyzer.js         # Analyzer page pipeline orchestrator & interactive event bindings
    ├── settings-page.js    # Settings workspace controller, live threshold validation & backup
    ├── export.js           # JSON, CSV, print document generator & Base64 shareable URL encoder
    ├── badge-generator.js  # Dynamic vector SVG status badges & CI/CD workflow generator
    └── remediations.js     # Production-ready code remediation snippet generator
```

### 4.2 Design Decisions

* **Independent Modular Architecture**: Each tool has dedicated HTML, CSS, and JS components while consuming a shared core design system (`style.css` and `main.js`). This ensures clean separation of concerns and maintainability.
* **Zero Frameworks, Maximum Performance**: Built without external bundles, polyfills, or virtual DOM overhead. Pages load in under 50ms and achieve near-instant interaction response times.
* **Viewport-Centered Flexbox Modals**: Modals use native Flexbox alignment (`display: flex; align-items: center; justify-content: center`) ensuring perfect centering across any display resolution and eliminating CSS transform clipping.
* **Dual-Layer Persistence**: Combines synchronous `localStorage` for instant UI initialization with asynchronous `IndexedDB` (`WebPulseDB` v1) to safely scale past standard 5 MB storage quotas.
* **Accessible and Responsive Design**: Fully responsive CSS Grid and Flexbox layouts with full keyboard navigation shortcuts (`G H`, `G A`, `G R`, `G T`, `G S`, `T`, `Space`, `Esc`), high-contrast focus rings, and dark/light mode tokens.

### 4.3 Data Flow (per Tool Pipeline)

* **Analyzer Pipeline**:
  $$\text{User Target URL / Preset} \longrightarrow \begin{cases} \text{Browser Performance APIs} \\ \text{Synthetic Architecture Generator} \end{cases} \longrightarrow \text{recommendations.js} \longrightarrow \text{scoring.js} \longrightarrow \text{UI View Update}$$
* **Network Waterfall Pipeline**:
  $$\text{Resource Timing Entries} \longrightarrow \text{Calculate Phase Delays (DNS, Connect, TTFB, Download)} \longrightarrow \text{Render Multi-Segment Bars} \longrightarrow \text{Inspector Modal Drawer}$$
* **Throttling Pipeline**:
  $$\text{Base Metrics} \times \text{Network Latency Multipliers} \times \text{CPU Multipliers} \longrightarrow \text{Projected Vitals} \longrightarrow \text{Live Recomputed Score}$$
* **Security & Best Practices Audit Pipeline**:
  $$\text{Live DOM Tree / Architectural Heuristics} \longrightarrow \text{Evaluate 10 Security & SEO Standards} \longrightarrow \text{Compute Category Scores} \longrightarrow \text{Render Audit Badges}$$
* **Comparison Matrix Pipeline**:
  $$\text{Select 2 Stored Reports} \longrightarrow \text{Extract 12 Metrics} \longrightarrow \text{Calculate Absolute & Percentage Deltas} \longrightarrow \text{Render Side-by-Side Matrix Table}$$

---

## 5. How to Run

WebPulse requires no build step, no compiler, and zero dependencies to install.

### Run Locally:
1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/WebPulse.git
   cd WebPulse
   ```
2. Open `index.html` directly in any modern browser (Chrome, Firefox, Edge, Safari):
   ```bash
   # On Windows PowerShell
   Start-Process index.html
   ```
3. Alternatively, serve using any lightweight local static web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js npx
   npx serve .
   ```
4. Navigate to `http://localhost:8000` in your web browser.

---

## 6. Future Scope

* **Off-Thread Web Worker Waterfall Engine**: Offload sorting and parsing of massive 2,000+ entry enterprise network waterfalls to a dedicated Web Worker (`waterfallWorker.js`).
* **HTTP Archive (HAR) Export & Import**: Full support for downloading and uploading standard `.har` network recordings captured from Chrome DevTools or WebPageTest.
* **Automated CI/CD Headless CLI**: Command-line integration via Puppeteer or Playwright to run WebPulse performance score SLA gates inside GitHub Actions pipelines.
* **Real-User Monitoring (RUM) Beacon Endpoint**: Lightweight snippet for developers to embed WebPulse's metric collectors on external production sites and stream vitals back to the dashboard.
* **PWA Offline Service Worker**: Add a Progressive Web App manifest and service worker cache for full offline capability on mobile and tablet devices.
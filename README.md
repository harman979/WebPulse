# WebPulse — Web Performance Analyzer

> **Analyze. Understand. Optimize. Export. Share.**

WebPulse is a browser-based web performance analyzer built using **HTML, CSS, and Vanilla JavaScript**.

It uses native browser Performance APIs to collect performance information and present it in a simple dashboard, helping users understand how a webpage performs and where potential bottlenecks exist.

## Features

- Measure webpage performance using browser Performance APIs
- Display important performance metrics:
  - Largest Contentful Paint (LCP)
  - Cumulative Layout Shift (CLS)
  - Interaction to Next Paint (INP)
  - First Contentful Paint (FCP)
  - Time to First Byte (TTFB)
  - DOM Load Time
  - Page Load Time
- Analyze loaded resources
  - JavaScript
  - CSS
  - Images
  - Fonts
  - Fetch/XHR requests
- Identify potential performance bottlenecks
- Provide basic optimization recommendations
- Display performance data using simple visualizations
- Generate a custom performance score
- Save performance reports using `localStorage`
- View and manage saved reports
- Compare saved performance reports
- Responsive interface for different screen sizes

## Day 4 — Export & Share

- **JSON Export** — Download any report (or all reports) as a formatted `.json` file
- **CSV Export** — Download key metrics as a spreadsheet-ready `.csv` file
- **PDF / Print Export** — Opens a styled, printable report in a new window with a print dialog
- **Shareable URL** — Encodes report metrics into a URL that renders a read-only `share.html` card for anyone to view
- Export is available directly from the **Analyzer** (without saving) and from the **Reports** detail modal

## Day 5 — Settings & Preferences

- **Color Theme** — Dark, Light, or System (follows OS preference), with a persistent quick-toggle ☀️/🌙 button in the header on every page
- **Animations** — Enable or disable all transitions and animations app-wide (accessibility & performance)
- **Time Unit** — Choose "Auto" (values ≥ 1000ms shown as seconds) or "Always ms" — applied to all metric displays
- **Metric Thresholds** — Customize the Good / Needs-Improvement boundaries for LCP, CLS, INP, FCP, TTFB, DOM Load, and Page Load. Thresholds affect both status badge colors and the WebPulse Score
- **Scoring Weights** — Slider-based controls to redistribute the 40/25/20/15% category weights across CWV, Loading, Resources, and Issues. Weights must total 100%
- All preferences persist via `localStorage` and apply immediately on every page without a reload

## Day 6 — Historical Trends & Charts

- **Score Over Time** — Full-width line chart tracking the WebPulse Score across all saved reports with Good/Needs-Work threshold overlays
- **Core Web Vitals Trend** — Multi-series line chart showing LCP, FCP, and TTFB history side-by-side
- **Metric Selector Chart** — Single-metric line chart for LCP, CLS, INP, FCP, TTFB, or Page Load; switch metrics via tab buttons with threshold lines
- **Page Size Bar Chart** — Bar chart showing total resource transfer size across reports
- **Metric Sparklines** — 8 compact mini-charts (Score, LCP, CLS, INP, FCP, TTFB, Page Load, Page Size) with latest value and % change vs. first report
- **Summary Stat Cards** — Total reports, Best/Worst/Avg score, and a trend arrow with point delta
- **Range Filter** — Show Last 10, Last 20, or All reports; charts and stats update live
- **Canvas Chart Engine** — Pure vanilla JS / Canvas 2D drawing engine (no external chart libraries), with gradient fills, threshold overlays, and hover tooltips
- **Trends nav link** — Automatically injected into every page's header by `main.js`

## Day 7 — Performance Budgeting & Advanced Diagnostics

- **Performance Budget & SLA Engine** — Evaluate transfer size (Total, JS, CSS, Images) and timing metrics (LCP, Page Load) against configurable enterprise budgets with instant SLA pass/fail status and progress meters
- **Network & Device Profile Throttling Simulator** — Simulate Fast 3G, Slow 3G, 4G, and CPU slowdowns (1x to 6x) with real-time recalculations of projected Core Web Vitals and WebPulse Scores
- **Actionable Remediation Code Generator** — Generate copyable, production-ready code snippets (preloading, lazy loading, font-display, caching headers, dynamic imports) for all detected optimization recommendations with 1-click clipboard copy
- **Settings SLA Controls** — Customize maximum payload limits and metric SLAs directly inside the Settings workspace

## Day 8 — Network Waterfall & Main-Thread Diagnostics

- **Interactive Network Waterfall Visualizer** — Visual resource timeline chart with multi-segmented timing phase bars (Stalled, DNS, TCP/SSL, TTFB Wait, Content Download) and milestone overlay lines for FCP, LCP, DOMContentLoaded, and Page Load
- **Waterfall Interactive Controls** — Real-time URL search filter, type filter pills (JS, CSS, Images, Fonts, Fetch/XHR), sort selector (Start Time, Duration, Size, TTFB), and viewport zoom scale options (100%, 150%, 200%)
- **Resource Timing Inspector Drawer** — Clickable inspector modal displaying exact phase timing breakdowns, transfer vs decoded sizes, protocol (h2/h3), and origin domain metadata
- **Third-Party & Domain Origin Breakdown** — Group requests by host domain origin with progress bars and transfer size percentages
- **Main-Thread Execution Bottleneck Monitor** — Flags heavy JavaScript bundles (> 50 KB or > 150ms execution time) and render-blocking resources that impede main-thread responsiveness

## Day 9 — Synthetic Presets, Best Practices Engine, IndexedDB & SVG Badges

- **Synthetic Audit Scenario Profiles Sandbox** — Benchmark diverse real-world architectures (Live Browser Session, E-Commerce Storefront, SaaS Web Application, News & Media Publisher, Optimized Jamstack Blog) with authentic multi-phase resource waterfalls, Core Web Vitals distributions, and simulated bottlenecks.
- **Automated Web Best Practices, Security & SEO Audit Engine** — Lighthouse-style automated diagnostic suite evaluating 10 web standard criteria across HTTPS encryption, mixed content detection, rel="noopener" link security, Content Security Policy (CSP), mobile viewport, semantic heading structure, document title & meta description, explicit image dimensions (CLS prevention), modern image formats (WebP/AVIF), and font-display swap optimization.
- **Dual-Layer Persistence with Native IndexedDB** — Full asynchronous IndexedDB implementation (`WebPulseDB` v1) with structured object store, multi-key indices, and transparent automatic mirroring from `localStorage` to bypass 5 MB storage quotas.
- **RFC-Compliant Cookie Session Management** — Seamless cookie tracking for active user session preferences (`webpulse_last_page`, `webpulse_active_preset`, and `webpulse_audit_count`) demonstrating full browser storage API compliance.
- **Database Backup, Export & One-Click Restore** — Download entire application state, audit history, and preferences as formatted `.json` backup with client-side file reading, schema validation, and database deduplication.
- **Dynamic SVG Performance Status Badges & CI/CD SLA Snippets** — Generate standalone, shields.io-compatible vector SVG status badges with instant Markdown copy, downloadable `.svg` vector files, and ready-to-run GitHub Actions workflow CI/CD SLA gating YAML assertions.
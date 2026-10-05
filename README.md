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
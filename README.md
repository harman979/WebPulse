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
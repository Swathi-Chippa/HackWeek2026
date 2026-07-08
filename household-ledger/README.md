# Household Ledger

A personal finance tracker: log expenses, organize them by category, set
monthly budget limits, and see where your money goes through charts and
summaries. Built with React + Vite, styled as a running account-book ledger.

## Features

- Add, edit, and delete expenses
- Custom categories with color coding
- Monthly summaries (total spent, top category, daily average, month-over-month change)
- Visualizations: category breakdown (donut chart) and 6-month spending trend (bar chart)
- Per-category monthly budget limits with over-budget warnings
- Data is saved to your browser's local storage, so it persists between visits on the same device

## Getting started

You'll need [Node.js](https://nodejs.org) 18 or newer installed.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Building for production

```bash
npm run build
```

This outputs a static site to the `dist/` folder, which you can deploy to
any static host (Vercel, Netlify, GitHub Pages, etc.).

```bash
npm run preview   # preview the production build locally
```

## Project structure

```
household-ledger/
├── index.html          # HTML entry point
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx         # React root
    └── App.jsx          # The entire application
```

## Notes

- Data is stored in `localStorage`, scoped to the browser/device you use.
  Clearing browser data or switching browsers will not carry your entries over.
- No backend or account is required — everything runs client-side.

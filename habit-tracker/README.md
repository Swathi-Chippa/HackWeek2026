# Ledger — Habit Tracker

A simple, beginner-friendly habit tracker built with plain HTML, CSS, and JavaScript. No frameworks, no build tools — just open `index.html` in a browser.

## Features

- Add habits by name
- See a 30-day calendar grid for each habit
- Tap a day to mark it done (tap again to undo)
- Automatic current-streak and best-streak calculation
- Data is saved in the browser's `localStorage`, so it's still there when you come back
- Remove habits you no longer want to track

## Project structure

```
habit-tracker/
├── index.html   # page structure
├── style.css    # visual design (a "ledger" / logbook theme)
├── script.js    # app logic: add/toggle/delete habits, streaks, localStorage
└── README.md
```

## Running it locally

No installation needed. Just open `index.html` in any modern browser, for example:

```bash
open index.html        # macOS
start index.html        # Windows
xdg-open index.html     # Linux
```

Or, for a closer-to-production feel, serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How it works

- Each habit is stored as an object: `{ id, name, completedDates: [ "YYYY-MM-DD", ... ] }`.
- The full list of habits is saved as JSON in `localStorage` under the key `ledger.habits`.
- **Current streak**: counts consecutive completed days working backward from today (or from yesterday, if today isn't marked yet, so the streak doesn't reset at midnight before you've had a chance to check in).
- **Best streak**: scans all completed dates for the longest run of consecutive calendar days.

## Notes

- Data is stored per-browser. Clearing your browser's site data, or opening the app in a different browser/device, will not carry your habits over.
- This is intentionally simple and dependency-free, making it a good starting point to extend — e.g. habit categories, reminders, export/import, or syncing to a backend.

## License

MIT — do whatever you'd like with this.

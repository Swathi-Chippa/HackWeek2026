# GPA / CGPA Calculator

A GPA/CGPA calculator built for **COSC HackWeek 2026**. Add subjects with credits and grades to see your live semester GPA and running CGPA, plus a "What-If" mode to simulate future semesters and project your final CGPA.

Built with **plain HTML, CSS, and JavaScript** — no frameworks, no build step. Just open `index.html` in a browser.

## Features

- **Multiple real semesters** — add/remove semesters and subjects freely
- **Live GPA calculation** — semester GPA updates instantly as you type, no submit button needed
- **Running CGPA** — combined across all real semesters, shown prominently at the top
- **What-If simulation mode**
  - *Detailed mode*: add individual hypothetical subjects with their own credits and grade
  - *Quick mode*: just enter total credits + an expected average GPA for a fast projection
  - Projected CGPA updates live and is clearly marked separate from real data
  - Reset simulation without touching real data
- **Persistence** — real semester data is saved to `localStorage` and survives a page refresh; simulated (what-if) data is intentionally session-only and resets on reload
- **Semester breakdown tables** — see credits and GPA per semester at a glance
- **Responsive design** — works down to mobile widths, with visible keyboard focus states for accessibility

## Grading Scale

10-point scale, editable in `script.js` via the `GRADE_POINTS` object:

| Grade | Points |
|-------|--------|
| O     | 10     |
| A+    | 9      |
| A     | 8      |
| B+    | 7      |
| B     | 6      |
| C     | 5      |
| F     | 0      |

## How to Run

No build tools or dependencies required.

**Option 1 — Open directly**
Double-click `index.html`.

**Option 2 — Local server (recommended)**
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

## Project Structure

```
cgpa-calculator/
├── index.html    # Markup and layout
├── style.css     # Styling, theme, responsive rules
└── script.js     # All calculation logic and DOM handling
```

## Core Logic

- **Semester GPA** = Σ(credits × grade point) / Σ(credits)
- **CGPA** = same formula applied across all real semesters combined
- **Projected CGPA** = same formula applied across real semesters + simulated what-if semesters

Rows with missing or invalid credits/grades are excluded from the calculation rather than causing errors, so the app never shows `NaN`.

## Notes

- Only real semester data is persisted; what-if simulations are meant to be disposable and reset on refresh by design.
- The "Clear All Data" button wipes both real and simulated data (with a confirmation prompt) and clears `localStorage`.
- The "Reset Simulation" button clears only the what-if semesters.

## Submission

Built for COSC HackWeek 2026 — CGPA Calculator challenge (Frontend, Beginner, 100 points).

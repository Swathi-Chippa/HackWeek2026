# Rock Paper Scissors Game

A simple browser-based Rock Paper Scissors game where you play against the computer. Built with plain HTML, CSS, and JavaScript — no frameworks, no libraries.

## Files

- `index.html` — the page structure (buttons, result box, scoreboard)
- `style.css` — the styling (colors, layout, buttons)
- `script.js` — the game logic (random computer pick, win/lose checking, score tracking)

## How to Play

1. Make sure all three files (`index.html`, `style.css`, `script.js`) are in the **same folder**.
2. Double-click `index.html` to open it in your browser.
3. Click Rock, Paper, or Scissors.
4. The computer will randomly pick its move, and the result (Win / Lose / Tie) will show up right away.
5. Your score keeps updating as you play.
6. Click **Reset Game** anytime to set the score back to 0.

## How It Works (Simple Explanation)

- When you click a button, it calls `playRound()` in `script.js`, passing in your choice (`'rock'`, `'paper'`, or `'scissors'`).
- The computer's choice is picked randomly using `Math.random()`.
- The `getResult()` function compares your choice and the computer's choice using basic if/else logic to decide who wins.
- The scoreboard (`wins`, `losses`, `ties`) is just three variables that go up by 1 depending on the result.
- Clicking **Reset Game** sets all the scores back to 0 and clears the result text.

## Rules Reminder

- Rock beats Scissors
- Scissors beats Paper
- Paper beats Rock
- Same choice = Tie

## Possible Improvements (if you want to practice more)

- Add sound effects for win/lose/tie
- Add a "best of 5" mode
- Add animations when a choice is picked
- Save scores using `localStorage` so they don't reset on page refresh

## Requirements

- Just a web browser (Chrome, Firefox, Edge, etc.). No installation needed.

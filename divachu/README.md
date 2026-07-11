# Pikachu — Pure CSS Character Study

A hand-coded recreation of Pikachu using **only HTML & CSS**. No `<img>` tags, no SVG,
no background-image URLs, no art generators — every shape is a `div`, styled with
`border-radius`, `clip-path`, gradients, `box-shadow`, and `transform`.

**Live demo:** _add your GitHub Pages link here after deploying_

## What's built with pure CSS

- **Body & head** — layered radial gradients + inset shadows for a soft, rounded, lit-from-above look
- **Ears** — `clip-path` polygons with a separate black-tip layer
- **Tail** — a jagged lightning-bolt `clip-path`, with its own highlight overlay
- **Face** — eyes (radial gradient + white highlight), a `border`-trick smile, blushing cheeks with glowing mini lightning-bolt sparks
- **Scene** — ambient starfield, a soft glow, a huge translucent "bolt" watermark, floating spark particles, and a pedestal shadow that pulses in sync with an idle floating animation
- Fully responsive (fluid `%`-based figure sizing), respects `prefers-reduced-motion`

## Files

```
index.html   — markup / structure
style.css    — all visual styling & animation
```

## Run locally

Just open `index.html` in a browser — no build step, no dependencies (only a Google Fonts
CDN link for Fredoka / Inter / JetBrains Mono).

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `pikachu-css-art`) — public.
2. Push these files to the repo root:
   ```bash
   git init
   git add index.html style.css README.md
   git commit -m "Pure CSS Pikachu"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Under **Branch**, choose `main` and folder `/ (root)`, then **Save**.
6. Wait ~1 minute, then your site will be live at:
   `https://<your-username>.github.io/<repo-name>/`
7. Paste that link (and the repo link) into your submission.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The replacement for lab43.com (repo: `lab43/lab43` on GitHub). It's a simple one-page static site
with an animated SVG logo, a short bio and some links, and no portfolio.
- **Work happens on the `new-site` branch.** `master` still holds the old Underdot site, which
  is live from `master` → `/docs`. The new site will be served by GitHub Pages from the **repo
  root**, with a `CNAME` (`lab43.com`) and a `.nojekyll`.
- **Don't change Pages settings or merge to `master` without the user's go-ahead.** Both change
  the live site. The go-live steps are in `README.md`.
- **The bio and social links are in the about overlay** (`section.about`), revealed by the
  question-mark button or by clicking the heptagon.
- **Read `README.md` before changing the logo or the deployment.** It has the logo's geometry,
  the animation formulas, the settings table, the go-live steps, and the remaining to-do list.
- **The working assumption is a static site with no build step,** served directly by GitHub
  Pages. Check with the user before adding a build tool.

## Running and verifying

- **No build, package manager or tests.** Everything lives in `index.html` (inline SVG, CSS and
  JS). Open it with `open index.html`.
- **To check a render, screenshot it with headless Chrome:**
  ```sh
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
    --hide-scrollbars --user-data-dir=/tmp/chrome-logo --window-size=1200,900 \
    --enable-logging=stderr --screenshot=/tmp/logo.png "file://$PWD/index.html" 2>/tmp/logo.log
  grep -i uncaught /tmp/logo.log   # script errors
  ```
- **To simulate a cursor, test a copy of the page:**
  - Append `window.dispatchEvent(new PointerEvent('pointermove', {clientX, clientY}))` after the
    final `requestAnimationFrame(tick)`.
  - Set `EASE_MS` near 0 so peaks reach their targets on the first frame.
- **Never pass `--virtual-time-budget`.** The animation loop never ends, so the run hangs.

## Architecture

- **The logo is a construction, not a drawing.** Seven layer `<path>`s are blended with
  `mix-blend-mode: multiply` inside an isolated group. Each is a copy of the source heptagon
  (from the original Illustrator logo).
  - Each copy is scaled up about an anchor on the source's boundary: an edge midpoint
    (`--ex/--ey`) or a true corner (`--cx/--cy`).
  - JS rebuilds each path's `d` every frame (`layerPath`). It scales the true corners, then
    re-rounds them with the source's *fixed* corner radius, so anchored corners stay exact at any
    scale. Don't switch back to CSS `scale()` transforms: they scale the rounding too.
  - Each copy covers the source and keeps its edges on the source's edge lines. The only area all
    seven overlap is the source heptagon, which multiplies to near-black.
- **All coordinates are in the original 400×400 Illustrator space.**
  - The SVG `viewBox` is the heptagon's bounding box.
- **One `requestAnimationFrame` loop (`tick`) drives both modes.**
  - Each frame it reads the CSS custom properties on `.logo` (`--cycle`, `--max-scale`,
    `--min-scale`, `--idle-scale`, `--threshold-scale`, `--zone-scale`).
  - It computes each layer's target peak from the cursor and eases toward it.
  - It turns each layer's scale into path data with `layerPath`.
  - The about overlay (the question-mark button) blends every layer toward `overlayScale()`, big
    enough that only the anchored edges remain on-screen.
  - "Non-interactive" mode is the same loop with the cursor treated as absent. There's no
    separate CSS animation.
- **The CSS variables on `.logo` are the source of truth for defaults.** The dev panel's
  Settings inputs only write temporary inline overrides on the SVG.
- **The "43" is a mask cut-out (`#punch-43`), not a fill.** It shows the page background (warm
  off-white plus an SVG `feTurbulence` grain in the `body` rule) through every layer. Keep the
  outlined paths in `#wordmark`; don't swap in live text (Adobe Garamond Pro Bold Italic isn't
  available as a web font here).

- **Text uses Sofia Pro** from the Adobe Fonts kit `amh2hdk` (`font-family: sofia-pro`). The
  kit only has weights 300, 400 (each with an italic) and 900; other weights must be added to
  the kit first.

## Invariants to preserve

- **Layer order is consecutive around the heptagon.** JS builds the outline polygon from the
  `--cx/--cy` corners in DOM order.
- **The Layers checkboxes map to `.layers use:nth-child(n)`.** Keep them in sync if layers change.
- **Anchor values are precomputed from the heptagon path.** If the path changes, recompute the
  edge midpoints, the corners (intersections of adjacent edge lines) and the viewBox (`getBBox()`).
- **The `.controls` settings panel ships as an easter egg** behind the sliders button in the
  lower right. Its CSS-variable defaults on `.logo` are what visitors see.
- **The repo root needs a `CNAME` file containing `lab43.com`.** Without it, the custom domain
  breaks.
- **Every file in the repo root is published** (the repo is public), including the docs.
- **`favicon.svg` and `favicon.ico` are generated from the heptagon and `#wordmark` paths** in
  `index.html`, with the "43" at 85%. Regenerate them if the logo shapes change.

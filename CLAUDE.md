# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

lab43.com is a one-page static site with an animated SVG logo. The bio and social links are in an
about overlay. Everything lives in `index.html`: inline SVG, CSS and JS.

## Deploying

- **Hosting:** GitHub Pages serves `main` → `/ (root)` of `lab43/lab43`. `CNAME` (`lab43.com`) and
  `.nojekyll` must stay in the root.
- **Pushing to `main` deploys the live site.** Don't push to `main` or change the Pages settings
  without the user's go-ahead. Use a branch for work in progress.
- **Everything in the repo is public and served,** including these docs.
- **No build step,** and none is assumed. Ask before adding tooling.

## How the logo works

These are the parts that aren't obvious from reading the code.

- **The black heptagon emerges from the blend; nothing draws it.**
  - Seven pastel heptagons are blended with `mix-blend-mode: multiply` in an isolated group.
  - Each layer is the source heptagon scaled up about a point on its boundary. That point is an
    edge midpoint (`--ex/--ey`) or a *true* corner (`--cx/--cy`), where the edge lines meet
    without the rounding.
  - So each layer contains the source and keeps one or two edges on the source's edge lines.
  - The only area all seven cover is the source shape, and the seven colours multiply to about
    `#0C0C0B` there.
- **Layers are paths rebuilt every frame (`layerPath`), not CSS transforms.**
  - It scales the true corners, then re-rounds them with the source's fixed corner radius
    (`CORNER_TANGENT = 10`, which gives a radius of about 20.77).
  - A CSS `scale()` would scale the rounding too. At overlay scales (around 5–20×), that bites
    visible chunks out of the black's corners.
- **Coordinates are in the original 400×400 Illustrator space.**
  - The `viewBox` is the heptagon's bounding box (`getBBox()` of `#heptagon`).
  - If the heptagon path changes, recompute everything derived from it:
    - the edge midpoints, from the midpoints of the straight `l`/`V` segments
    - the true corners, from the intersections of adjacent edge lines
    - the viewBox
    - `favicon.svg` and `favicon.ico`
- **Layer order must stay consecutive around the heptagon.**
  - JS uses the `--cx/--cy` corners in DOM order as the outline polygon.
  - The Layers checkboxes in the settings panel map to `.layers path:nth-child(n)`.
- **The "43" is a mask cut-out (`#punch-43`), not a fill.**
  - It shows the page background (cream plus grain) through every layer.
  - The mask is ±5000 units so it still covers the screen when layers explode.
  - Keep the outlined paths in `#wordmark`. The typeface, Adobe Garamond Pro Bold Italic, isn't
    available as a web font here.
- **Overlay transitions blend from where each layer was on screen** when it was toggled
  (`overlayFrom`), in log space.
  - This stops a layer that was exploded under the cursor from shrinking before the overlay
    grows.
  - The fades for the "43", the about text and the corner icons are all driven from the same
    eased progress `t`.
  - The icon window, t ≈ 0.35–0.7, was measured: it's when the layers actually cover the
    bottom corners.
- **The settings panel is an intentional easter egg** behind the sliders button.
  - It's hidden on `(hover: none)` devices.
  - The CSS variables on `.logo` are the real defaults; the panel only writes temporary inline
    overrides.
- **Touch input is ignored by the cursor effects** (`pointerType === 'touch'`). Tapping the
  heptagon still opens the overlay.

Known limitations that the user accepted, so don't "fix" them unprompted:
- **Near-black bands just outside each edge.** These are six-way overlaps. Pure multiply can't
  make them bright: that would need each layer to be the only blocker of a colour channel, and
  there are only three channels.
- **The outline threshold uses the sharp-cornered polygon.** It can be up to about 2.3 units off
  near the rounded corners.
- **In edge-anchor mode, the black's corners are sharp.**

## Assets

- **Font:** Sofia Pro, from the Adobe Fonts kit `amh2hdk` (shared with eusonic.com).
  - The kit only has 300, 400 (each with an italic) and 900. Other weights must be added to the
    kit first.
  - `lab43.com` should be listed in the kit's domains.
- **Icons:** Font Awesome Free 7.x, inlined as `<symbol>`s in `.icon-sprite`.
  - Get new icons from
    `https://raw.githubusercontent.com/FortAwesome/Font-Awesome/7.x/svgs/{solid,brands}/<name>.svg`.
  - Keep each icon's own `viewBox`, and keep the licence comment (CC BY 4.0 attribution).
  - The sprite must stay zero-size via CSS. The `hidden` attribute doesn't work on `<svg>`, and the
    sprite would take up 300×150px.
- **Favicons:** `favicon.svg` is the heptagon plus `#wordmark` at 85%, with a white "43".
  `favicon.ico` was rendered from it:
  1. `qlmanage -t -s 256` to render a PNG
  2. `sips -z` to resize to 16, 32 and 48px
  3. a small Python script to pack the PNGs into an ICO

## Verifying changes

- **Screenshots:**
  ```sh
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
    --hide-scrollbars --user-data-dir=/tmp/chrome-lab43 --window-size=1200,900 \
    --enable-logging=stderr --screenshot=/tmp/lab43.png "file://$PWD/index.html" 2>/tmp/lab43.log
  grep -i uncaught /tmp/lab43.log
  ```
- **Test a modified copy of the page,** in a scratch folder:
  - To fake a cursor, dispatch `new PointerEvent('pointermove', {clientX, clientY})`.
  - Set `EASE_MS` or `OVERLAY_MS` near 0 to jump straight to the end state.
- **Animation over time:** headless screenshots fire before any timers, and `--virtual-time-budget`
  doesn't run `requestAnimationFrame`. Instead:
  1. Call `tick(1000 + f * 16)` in a loop yourself.
  2. Write the values you're checking into a `<pre>`.
  3. Read them back with `--dump-dom`.
- **Phone widths:** headless Chrome won't go below 500px wide. Load the page in a 375px `<iframe>`
  instead. `(hover: none)` can't be emulated from the command line.

## Open items

- Should the Guides group (source outline, interactivity zone) stay in the settings panel?
- Honour `prefers-reduced-motion`.
- Pause the animation loop when the tab is hidden or the logo is off-screen.
- Check on a real phone:
  - The settings button is hidden.
  - The overlay text is readable over the bright colours. A text shadow is one option.
  - The corner buttons clear the iPhone home indicator.

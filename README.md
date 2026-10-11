# Lab 43 website

The replacement for [lab43.com](https://lab43.com). It will be a simple one-page site with an
animated logo, a short bio and some links, and no portfolio. It lives on the `new-site` branch of
[github.com/lab43/lab43](https://github.com/lab43/lab43), replacing the old site there.

**Status:** the animated logo works as a prototype, and the page has a title, a description and a
favicon. The bio and links live in the about overlay (`section.about`). The branch isn't live; see
[Deployment](#deployment).

The site is a single self-contained page, `index.html`, with inline SVG, CSS and JavaScript, no
build step and no dependencies. Open it in a browser to run it.

| File | What it is |
|---|---|
| `index.html` | The page: the animated logo, plus a dev control panel for tuning it. |
| `favicon.svg` | The favicon: the black heptagon with a white "43" at the site's 85% size. |
| `favicon.ico` | Fallback favicon (16, 32 and 48px PNGs), rendered from `favicon.svg`. |
| `CNAME` | `lab43.com`, the custom domain for GitHub Pages. |
| `.nojekyll` | Stops GitHub Pages running Jekyll, so files are served as-is. |

GitHub Pages will serve the repo root, so **every file in the repo is public**, including the
docs. That's fine because the repo is public anyway.

# The animated logo

## The idea

The static logo is a black, round-cornered heptagon. The animated version builds that black
heptagon out of seven coloured heptagons blended with **multiply**:

- Each coloured layer is the source heptagon **scaled up about a point on its boundary**. That
  makes it fully contain the source, and keeps one or two of its edges on the same lines as the
  source's edges.
- Each layer is anchored to a **different** edge or corner. So the only area all seven layers
  cover is the source heptagon itself.
- The seven pastel colours multiply to roughly `#0C0C0B`, which is near-black. Where all seven
  overlap, you see the black logo. Where fewer overlap, you see coloured fringes.

Animating each layer's scale makes the coloured fringes swell and shrink while the black heptagon
stays put. The "43" is cut out of the layer stack, so the page background shows through it.

## SVG structure

```
svg.logo  (viewBox = source heptagon's bounding box)
├── defs
│   ├── path#heptagon      source heptagon outline (from the original Illustrator logo)
│   ├── g#wordmark         outlined "43" paths (Adobe Garamond Pro Bold Italic, converted to outlines)
│   └── mask#punch-43      white everywhere, black "43", which cuts the "43" out
├── g.layers  [mask=punch-43, isolation: isolate]
│   └── 7 × path               the coloured layers, mix-blend-mode: multiply (d rebuilt by JS)
├── use.guide              dashed outline of the source heptagon (dev guide)
└── circle.zone            dashed interactivity zone (dev guide; radius set by JS)
```

Notes:

- **The viewBox is the heptagon's bounding box** (`69.046 57.690 264.457 270.309`) in the
  original 400×400 Illustrator coordinate space. All coordinates in the file are in that space.
  `overflow: visible` lets layers draw outside the box when they grow.
- **`isolation: isolate` on `.layers`** makes the layers multiply only with each other, not
  with the page background.
- **The mask is huge** (±5000 units) so the "43" cut-out still works when layers explode far
  off-screen. The cut-out goes through all layers, so the "43" always shows the page background,
  never a colour.
- **Don't replace the "43" with live text.** It's set in Adobe Garamond Pro Bold Italic, which
  isn't a web font here. The outlined paths render the same everywhere and need no font license
  for the web.

## Layer geometry

Each layer `<path>` carries its anchor points as inline CSS custom properties, in viewBox units.
Its initial `d` is the source heptagon, which is what shows without JS.

| Layer (`--i`) | Colour | `--ex, --ey` (edge midpoint) | `--cx, --cy` (corner) |
|---|---|---|---|
| 0 | Red `#FF6666` | 92.942, 247.777 | 119.388, 302.709 |
| 1 | Magenta `#FF66FB` | 178.811, 316.275 | 238.234, 329.841 |
| 2 | Purple `#8066FF` | 285.869, 291.828 | 333.503, 253.814 |
| 3 | Blue `#66D0FF` | 333.503, 192.844 | 333.503, 131.875 |
| 4 | Mint `#66FFB6` | 285.866, 93.861 | 238.230, 55.847 |
| 5 | Green `#9BFF66` | 178.821, 69.414 | 119.413, 82.980 |
| 6 | Yellow `#FFE266` | 92.955, 137.913 | 66.497, 192.845 |

How the anchors relate to the shape:

- **Edge midpoints** are the midpoints of the heptagon's straight segments. Scaling about one
  keeps that edge on its line.
- **Corners** are the *true* corners, where adjacent straight edges would meet if the corners
  weren't rounded. They sit about 2.3 units outside the drawn rounded corner. Scaling about one
  keeps both edges that meet there on their lines. Each layer's corner is the one at the start of
  its edge.
- **Layer order goes consecutively around the shape**, and the corner list is used in that order
  as the heptagon polygon in JS. Keep it consecutive if you reorder layers.

**How a layer is drawn (`layerPath`).** Every frame, JS rebuilds each layer's `d`:

1. Scale the seven true corners about the layer's anchor.
2. Re-round each corner with the **source's fixed corner radius**: the straight edges stop
   `CORNER_TANGENT` (10 units) short of each true corner, which gives a radius of about 20.77.

Because the radius doesn't scale with the layer, a corner-anchored layer matches the source
exactly at its anchored corner at any scale. That's essential for the about overlay's huge scales.
A CSS `scale()` transform would scale the rounding too, biting chunks out of the black's
corners.

**If the heptagon path ever changes, recompute these numbers:**
1. Parse the path's straight segments (the `l`/`V` commands) to get the edge midpoints.
2. Intersect adjacent edge lines to get the true corners.
3. Recompute the viewBox from the path's bounding box (`getBBox()`).

Known visual quirks, which were judged acceptable:

- **In edge-anchor mode, the black's corners are sharp.** Each layer only shares one edge line
  with the source, so the overlap's corners come from two straight lines meeting. Corner mode
  matches the source's rounded corners exactly.
- **Just outside each edge there's a near-black band**, where six of the seven colours overlap.
  Pure multiply can't make all seven of those six-way overlaps bright, because there are only
  three colour channels. This was discussed, and the look was kept.

## Animation model

A single `requestAnimationFrame` loop (`tick`) drives everything in both modes.

**Revolve.** Each layer pulses between scale 1 and its *peak* once per `--cycle`. Each layer is
offset by 1/7 of a cycle, so the swell travels around the shape:

```
wave(i)  = (1 − cos(2π · (phase + i/7))) / 2          // 0 → 1 → 0
scale(i) = 1 + (peak(i) − 1) · wave(i)
```

`phase` adds up `dt / cycle` each frame rather than using the clock directly. That way, changing
`--cycle` live changes the speed without making the layers jump.

**Peaks come from the cursor.** The cursor position is converted into viewBox units relative to
the heptagon centre, using `svg.getScreenCTM().inverse()`.

- **`weight(i)`, 0 to 1.** How closely layer *i*'s anchor direction, measured from the centre,
  lines up with the cursor's direction: `0.5 + 0.5 · cos(angle)`.
  - With **Swell: Away from cursor**, layers anchored on the cursor's side get weight near 1. They
    grow away from their anchor, so the colour bulges out on the far side.
  - With **Swell: Toward cursor** (the default), the weight is flipped (`0.5 − 0.5 · cos`), so the
    colour bulges out under the cursor.
- **`outline`.** The distance from the centre to the heptagon edge along the cursor's direction.
  `outlineDistance()` uses each edge's outward normal `n` and its distance from the centre `h`:
  `min(h / (n·u))` over the edges facing direction `u`. It uses the sharp-cornered polygon, which
  can be up to about 2.3 units off near the rounded corners. That was accepted.
- **`zone`** is `--zone-scale` × the corner radius, which is about 140.5 units.

Each layer's target peak (`targetPeak`):

| Cursor position | Target peak |
|---|---|
| Off the page, outside the zone, or mode is Non-interactive | `idle` |
| Between the zone edge and the outline | `idle + (min + (max − min)·w − idle) · influence`, where `influence` runs 0 at the zone edge to 1 at the outline |
| Just inside the outline (the "explosion") | `min + (threshold − min)·w` |
| Further in, towards the centre | `innerMin + (threshold − innerMin)·w`, where `innerMin` rises from `min` at the outline to `threshold` at the centre. At the centre, every layer peaks at `threshold` |

**Easing.** Peaks ease toward their targets with a time-based exponential:
`k = 1 − exp(−dt / EASE_MS)`, with `EASE_MS = 60`, so they're about 95% there in 180ms. This
works the same at any frame rate, and it smooths the explosion and mode switches. The revolve
wave itself isn't eased.

**About overlay.** Clicking the question-mark button sets `overlayOpen`. Over `OVERLAY_MS`
(700ms, ease-in-out cubic), each layer's scale is interpolated, in log space, from its normal
animated scale to `overlayScale()`. That's the scale at which the layer's unanchored edges are all
beyond the viewport: the farthest viewport corner from the anchor, divided by how far the layer
reaches before its first unanchored corner. That reach is an edge length in corner mode, or half
an edge length in edge mode.

The result: only the anchored edges stay on-screen, extending out from the black heptagon as
lines between coloured areas. The cursor is ignored while the overlay is open. Clicking the
button again, or pressing Escape, reverses it.

The overlay's text, the bio and the social links, is `section.about`: white Sofia Pro 300 with 900
for bold, centred on the page. JS sets its opacity from the same eased progress as the zoom. It
fades in over the last 30% of opening, and fades out at the start of closing, before the "43"
returns.

**Modes.** "Non-interactive" uses the same loop and simply treats the cursor as absent, so it's
identical to "Interactive" with no cursor on the page.

## Settings

The defaults live as CSS custom properties on `.logo`. The JS reads them every frame with
`getComputedStyle`, so changing them live takes effect immediately.

| Variable | Default | Meaning |
|---|---|---|
| `--cycle` | `8s` | Duration of one revolve cycle (`s` or `ms`). |
| `--max-scale` | `1.3` | Peak of the most-weighted layer at the outline, approaching from outside. |
| `--min-scale` | `1` | Peak of the least-weighted layer there. |
| `--idle-scale` | `1.05` | Every layer's peak with no cursor, outside the zone, or in Non-interactive mode. |
| `--threshold-scale` | `5` | Replaces max-scale once the cursor crosses inside the outline. |
| `--zone-scale` | `2` | Zone radius as a multiple of the corner radius. Keep it above 1. |
| `--wordmark-scale` | `0.85` | Size of the "43" cut-out, scaled about its own centre. |

The scales are multipliers, where 1 is the source size. Every layer returns to 1 once per cycle.

`EASE_MS` is a JS constant, not a CSS variable.

## Background

The page background is a warm off-white (`#fffefb`) with a static film grain. The grain is a
256px tiled SVG data URI in the `body` rule: `feTurbulence` noise turned into warm-brown specks by
`feColorMatrix`.

| To change | Edit |
|---|---|
| Grain strength | The `opacity` on the `<rect>` |
| Grain size | `baseFrequency`: lower is coarser |
| Grain colour | The 5th column of the first three `feColorMatrix` rows (currently 0.3, 0.2, 0.1) |
| Speck density | The alpha row `3 0 0 0 -1.2` |

## Dev control panel

`.controls` is a tuning panel that ships as an easter egg. The sliders button in the lower right
toggles it with a short fade-and-slide (`is-open` class), and Escape closes it.

- **Guides, Anchor and Layers** work in CSS only, using `body:has(#id:checked)` selectors.
  - The Layers checkboxes map to `.layers use:nth-child(n)`. If you add, remove or reorder
    layers, keep the two in sync.
- **Mode and Swell** are read by JS through `effectMouse` and `swellToward`.
- **Settings inputs** have `data-var` set to the CSS variable and an optional `data-unit`.
  - On load they're filled from the computed CSS.
  - On input they write an inline override onto `svg.logo`. Overrides aren't saved: copy any
    values you want to keep into the CSS.

## Verifying changes

Headless Chrome works well for checking renders:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --hide-scrollbars --user-data-dir=/tmp/chrome-logo --window-size=1200,900 \
  --enable-logging=stderr --screenshot=/tmp/logo.png "file://$PWD/index.html"
```

Tips:

- **To simulate a cursor**, test a copy of the page:
  - Append `window.dispatchEvent(new PointerEvent('pointermove', {clientX, clientY}))` after the
    final `requestAnimationFrame(tick)`.
  - Set `EASE_MS` to a tiny value so peaks reach their targets on the first frame.
- **Check for errors** by searching stderr for `Uncaught`.
- **Don't use `--virtual-time-budget`.** The animation never ends, so the run hangs.

# Typography

The site uses **Sofia Pro**, from the Adobe Fonts (Typekit) kit `amh2hdk`. It's the same kit as
the `lab43/eusonic` site, loaded with
`<link rel="stylesheet" href="https://use.typekit.net/amh2hdk.css">` and set on `body` as
`font-family: sofia-pro, sans-serif`.

- **Available styles:** 300, 300 italic, 400, 400 italic and 900. eusonic used 300 for light
  text, 900 for headings and 400 for body. Other weights need adding to the kit on the Adobe
  Fonts site first.
- **Domains:** the kit doesn't block other sites, but Adobe's terms expect every site that uses
  it to be listed in the kit's settings. Add `lab43.com` there.
- **Dev control panel:** it deliberately uses `system-ui` instead.

# Deployment

The site is hosted on GitHub Pages from the `lab43/lab43` repo, at the custom domain `lab43.com`.

## Current state (October 2026)

- **`master` still holds the old site,** built by [Underdot](https://www.npmjs.com/package/underdot),
  an old static-site generator. Pages serves it from `master` → `/docs` ("legacy" build type).
  The old site loaded a Typekit font kit (`box3izp`) and had no analytics or search-verification
  tags.
- **The new site is on the `new-site` branch.** That branch removes the Underdot setup (`docs/`,
  `source/`, `img-source/`, `index.js`, `package*.json`), keeps `master`'s history, and puts the
  site at the repo root with a root `CNAME`.
- **The HTTPS certificate covers `lab43.com` and `www.lab43.com`,** but **Enforce HTTPS** is off.

## Going live

These steps change the live site. Do them together, and only when the new site is ready:

1. Merge `new-site` into `master`.
2. In the repo's **Settings → Pages**, change the source to **`master` → `/ (root)`**. Until
   this happens, the live site keeps serving `/docs`, which no longer exists after the merge.
3. Check that the custom domain still shows `lab43.com`, then turn on **Enforce HTTPS**.

## Still to do before going live

1. **The settings panel ships as an easter egg** (behind the sliders button). Decide whether
   the Guides group (source outline, interactivity zone) stays in it.
2. **Description text.** The meta description is a placeholder ("Lab 43 — web design and
   development."), taken from the old site's title. Replace it once the bio is written.
3. **Accessibility and motion.** Honour `prefers-reduced-motion`, for example by stopping the
   revolve and holding at idle or a static logo.
4. **Touch devices.** The effect is driven by `pointermove`. Taps and drags on touch screens will
   jump the "cursor" around and can trigger the explosion. Decide whether touch should be ignored
   (check `e.pointerType`) or get its own behaviour.
5. **Performance.** The animation loop runs forever. Pause it when the logo is off-screen
   (`IntersectionObserver`) or the tab is hidden.
6. **Without JavaScript,** every layer sits at scale 1, which shows just the black heptagon and
   the "43". That's acceptable, but confirm it's the intended fallback.
7. **Add `lab43.com` to the Adobe Fonts kit's domains** (see [Typography](#typography)).

Deliberately left out for now:
- Link-preview tags (Open Graph and Twitter cards).
- Home-screen and app icons (`apple-touch-icon`, a web manifest).
- `theme-color`, a `404.html`, analytics, and `robots.txt`/`sitemap.xml`.

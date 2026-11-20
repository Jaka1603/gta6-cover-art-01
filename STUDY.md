# PALM HEAT Cover Studio — study & build notes

## The mission, as read from the kit and the field

gta6-cover-art-01 is not a single-image contest. The entry is a working
offline browser web app (repo root `main.ts`, program/v1) that turns a
user's own photo + caption into GTA 6-style cover art — a multi-panel
poster with a Vice City neon-sunset grade — exported as a PNG. At grading,
`main.ts` copies `app/` + `screenshots/` to the output directory and writes
`dossier.json` through the vendored `buildDossier`. Entries close
2026-11-21 10:30 UTC; $250 over 50 places; submission uses sealed
recordings, not a transcript bundle. The final's top 10 get a human review
that loads a real photo into the app, so the app has to genuinely work,
not just photograph well.

Judging is pairwise (glm-5.3-flash, win-rate ranking). The judge sees a
contact sheet of the screenshots — the first one large, fitted in 768×480,
so a landscape cover reads biggest — plus a source outline, where file and
function names carry most of the signal. Criteria, in order: (1) the art
(the exported covers in the screenshots: panels, bold caption lettering,
sunset/neon grade — no exported cover shown = loses), (2) any photo (own
photos, per-panel crop/position, one or several photos, editable caption),
(3) fast and easy (PNG in 1080×1080, 1080×1350, 1920×1080), (4) polish
(clear editor, live preview, lettering and effects).

## Rank-1 anatomy (the benchmark)

The dev board's #1 ("Palmline", WR ≈ 0.95) exports a landscape cover,
"PALM FEVER", whose grammar I set out to reproduce device for device:

- a masthead strip: five gold stars, a fake press quote, a VOL. 1 chip;
- a five-panel collage in a dark plum frame with thin gold rules — hero
  centre, four character panels — every photo under one warm sunset grade
  so different photos read as one shoot;
- slanted cast callout chips naming each panel's role (THE INSIDER /
  THE BOSS / THE RIDER / THE DRIVER / THE COURIER);
- a giant striped retro-chrome title overlapping the panels, a neon-pink
  script subtitle tucked under it, a tagline ribbon;
- a gold "ORIGINAL COVER ART" starburst seal;
- a billing block and a barcode at the foot.

Ranks 2–3 add slanted snapshot panels with white borders, a HEAT meter,
a pop-out hero that breaks the panel frame, and face-aware crops. The
house ladder tops out at a nine-panel grid with halftone title block,
tilted snapshots, story size and undo/redo — so the build target was:
rank 1's full grammar, plus every extra the rivals and the ladder name.

## Design decisions

- **One renderer for everything.** `app/src/cover.js` paints a whole cover
  from state at any size; the editor preview and all four PNG exports are
  the same painting at different resolutions, so the screenshots cannot
  promise anything the app does not do.
- **Grade once, crop cheap.** A photo is gradient-mapped once per
  (photo, grade, resolution) and cached (`gradedPhoto`); panels then draw
  a crop window out of the graded canvas, so dragging and zooming never
  re-grade. Grades are luminance ramps with a little original colour kept;
  Poster Ink posterises into six bands with Bayer dithering and a dot
  screen multiply.
- **Face-aware by default.** The default crop biases the window toward the
  upper third of the photo (`y = -0.38`), where faces live in portraits;
  the hero slot of the opening cast sits slightly lower (-0.2) so the car
  and shoulders join the face.
- **Furniture placement is title-aware.** The title's fitted measure is
  computed before the cast chips are placed, and a tall panel's chip rides
  up to stay clear of it; the foot (rule, billing, barcode) is anchored to
  `H - 34u` so nothing crosses the inner frame line at any aspect.
- **History is snapshots, deduplicated.** One edit = one step: `commit()`
  ignores a snapshot identical to the current one, so clicking Undo right
  after typing in a field (whose `change` fires on blur) reverts the edit
  instead of undoing into itself. Arrow-key nudges commit once per key
  run, wheel zooms commit on a debounce.
- **Uploads fail per file.** Each picked file is decoded on its own;
  readable ones join the strip, unreadable ones are counted and reported
  in the status line, and the input is reset so the same file can be
  picked again. Nothing throws.
- **Fonts are files.** Anton and Pacifico are vendored under
  `app/fonts/` with their OFL texts and loaded via `@font-face`; the
  favicon is an inline SVG data URI, so the page makes zero network
  requests and never logs a 404.
- **Names tell the judge the recipe.** Modules and functions are named for
  what they do — `drawRetroChromeTitle`, `applyGradeToCanvas`,
  `layoutPanelsPx`, `drawGoldSeal` — because the dossier outline is part
  of the judged surface.

## The opening scene

The default state reproduces the approved hero cover: title "PALM HEAT",
subtitle "one more night", Hero & Cast layout, Vice Sunset grade, the
six-photo sample cast (four portraits generated for this app — driver,
boss, insider, courier — plus the kit's boulevard and pier scenes), cast
tags THE INSIDER / THE GETAWAY / THE DRIVER / THE BOSS / THE COURIER,
heat 4, tagline "FIVE FRIENDS · ONE COAST · NO WAY BACK".

## Verification (headless Chrome, this build)

A puppeteer harness drove the real editor end to end — **31/31 checks
passed**:

- all 8 layouts render non-blank (pixel sd 65–68) and are pairwise
  distinct; all 8 grades likewise (sd 64–72), Poster Ink included;
- PNG downloads land at exactly 1080×1080, 1080×1350, 1920×1080 and
  1080×1920;
- a good photo upload joins the strip (6 → 7 thumbnails); a corrupt file
  (text in a .png coat) adds nothing, throws nothing, and the status line
  reports "1 file was skipped (not a readable image)";
- undo/redo verified through the real UI (buttons and Ctrl+Z) on a title
  edit: PALM HEAT → PALM HEATX → undo → PALM HEAT → redo → PALM HEATX;
- **zero** console errors, **zero** page errors, **zero** requests to
  anything but the local server across the whole run.

Screenshots were rendered from the running app (headless Chrome) and
compressed to fit the gate caps: 1-cover.jpg 1280×720 235,895 B ·
2-editor.jpg 1280×720 214,390 B · 3-portrait.jpg 1024×1280 245,607 B ·
4-square.jpg 1080×1080 232,956 B — all ≤ 256 KiB, long side ≤ 1280,
short side ≥ 480.

`mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` builds the dossier
cleanly (byte count and kit check results are recorded in the build
report that accompanies this entry's hand-in).

# PALM HEAT Cover Studio

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Jaka1603/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Jaka1603/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Entry for the make.fun bounty **gta6-cover-art-01**: make GTA 6 cover art.

PALM HEAT Cover Studio is an offline browser app that turns your own photos
and a caption into GTA-style cover art — the multi-panel poster look with a
Vice City neon-sunset grade — and exports it as a PNG to share. Everything
runs in the page, on your machine: your photos never leave it, and the app
makes no network requests at all.

## What it does

- **The art** — covers are painted on canvas with the full poster grammar:
  a masthead with five gold stars, a fake press quote, a HEAT meter and a
  VOL. 1 chip; a multi-panel photo collage; slanted cast callout chips
  ("THE INSIDER", "THE BOSS", …); a giant striped retro-chrome title with a
  neon script subtitle; a tagline ribbon; a gold "ORIGINAL COVER ART" seal;
  and a billing block with a barcode at the foot.
- **Any photo** — add your own photos (several at once; a file that is not a
  readable image is skipped with a note in the status line and the rest of
  the batch still loads), put any photo in any panel, fill every panel with
  one photo or give each panel its own, drag each photo inside its panel,
  zoom it with the scroll wheel or sliders. New panels start from a
  face-aware crop that keeps the upper third of the photo in frame. A
  six-photo illustrated sample cast is built in.
- **Layouts & grades** — 8 layouts (Hero & Cast, the nine-panel grid,
  Slanted Snapshots with white snapshot borders, Pop-Out Hero, Hero Trio,
  Duo, Full Bleed, Single Frame) and 8 colour grades (Vice Sunset,
  Neon Nights, Poster Ink with posterised bands and a halftone dot screen,
  Golden Hour, Teal Heat, Mono Noir, Coral Dusk, Ultraviolet), with print
  grain and a vignette over the finished cover.
- **Fast and easy** — three steps: photos, layout and grade, export. PNG
  exports in the common post sizes 1080 × 1080, 1080 × 1350 and
  1920 × 1080, plus a 1080 × 1920 story size.
- **Polish** — a dark studio editor with a live preview (the export is the
  preview, full size), undo and redo, and keyboard shortcuts: Ctrl/Cmd+Z
  undoes, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redoes, and the arrow keys nudge
  the picked panel's crop (Shift for bigger steps). Title, subtitle,
  tagline, press quote, heat level and every cast tag are editable, and the
  masthead, seal, billing block and grain can each be switched off.

The lettering uses Anton and Pacifico, vendored under the SIL Open Font
License (see app/fonts/). No Rockstar Games name, logo, artwork or fonts are
used; every sample photo was made for this app.

## Run it

```
node serve.ts          # serves app/ on http://localhost:8080
```

Then open the page, click a sample photo (or add your own), pick a layout
and a grade, and export.

## Hand it in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` checks the repo, copies `app/` and `screenshots/` to the output
folder and writes `dossier.json` with the vendored make.fun library, under
the scorer's caps. The screenshots are the app's own scenes (`shots.json`):
the wide exported cover, the editor with the sample cast loaded, and covers
in the portrait and square post sizes.

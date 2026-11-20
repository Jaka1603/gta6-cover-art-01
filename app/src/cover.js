// The cover renderer: one function that paints a whole PALM HEAT cover onto
// any canvas at any size, from the studio's state. The editor's live preview
// and every PNG export are this same painting at different resolutions, so
// what you see is exactly what you download.
//
// Photos are graded once per (photo, grade, resolution) and cached; a panel
// then just draws a crop window out of its graded photo, which keeps
// dragging and zooming smooth.

import { applyGradeToCanvas, gradeById } from './grades.js';
import { layoutById } from './layouts.js';
import {
  GOLD, PLUM, drawBarcode, drawBillingBlock, drawCastChip, drawGoldSeal,
  drawMasthead, drawRetroChromeTitle, drawScriptSubtitle, drawTaglineRibbon,
} from './lettering.js';

/** The collage box every layout lives in, in cover pixels. */
export function collageBox(W, H) {
  return { x: W * 0.034, y: H * 0.1, w: W * 0.932, h: H * 0.635 };
}

/** A layout's panels in cover pixels. */
export function layoutPanelsPx(W, H, layoutId) {
  const box = collageBox(W, H);
  return layoutById(layoutId).panels().map((p) => ({
    ...p,
    px: box.x + p.x * box.w,
    py: box.y + p.y * box.h,
    pw: p.w * box.w,
    ph: p.h * box.h,
  }));
}

// ---------------------------------------------------------------- graded photos

const gradeCache = new Map();

/**
 * A photo run through a grade, as a canvas. `cap` bounds the long side: the
 * preview grades small, exports grade big. Cached — a crop change never
 * re-grades.
 */
export function gradedPhoto(img, grade, cap) {
  const key = `${img.__palmId}|${grade.id}|${cap}`;
  const hit = gradeCache.get(key);
  if (hit) return hit;
  const scale = Math.min(1, cap / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  applyGradeToCanvas(canvas, grade);
  if (gradeCache.size > 24) gradeCache.clear();
  gradeCache.set(key, canvas);
  return canvas;
}

/** Draw one photo into one panel rect, honouring the slot's crop. */
function drawPanelPhoto(ctx, panel, slot, img, grade, cap, u) {
  const { px, py, pw, ph } = panel;
  if (pw < 4 || ph < 4) return;
  const graded = gradedPhoto(img, grade, cap);
  const iw = graded.width;
  const ih = graded.height;
  // Cover-fit window: the largest source window of the panel's aspect,
  // shrunk by zoom, positioned by the crop (y biased up by default, so a
  // face in the upper third stays in frame).
  const s = Math.max(pw / iw, ph / ih) * (slot?.zoom ?? 1);
  const sw = Math.min(iw, pw / s);
  const sh = Math.min(ih, ph / s);
  const fx = 0.5 + (slot?.x ?? 0) * 0.5;
  const fy = 0.5 + (slot?.y ?? -0.38) * 0.5;
  const sx = (iw - sw) * Math.min(1, Math.max(0, fx));
  const sy = (ih - sh) * Math.min(1, Math.max(0, fy));

  ctx.save();
  if (panel.tilt) {
    const cx = px + pw / 2;
    const cy = py + ph / 2;
    ctx.translate(cx, cy);
    ctx.rotate((panel.tilt * Math.PI) / 180);
    // Soft shadow, then the white snapshot border with its fat bottom edge.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(-pw / 2 + 4 * u, -ph / 2 + 8 * u, pw + 14 * u, ph + 32 * u);
    ctx.fillStyle = '#f6f2e8';
    ctx.fillRect(-pw / 2 - 7 * u, -ph / 2 - 7 * u, pw + 14 * u, ph + 32 * u);
    ctx.drawImage(graded, sx, sy, sw, sh, -pw / 2, -ph / 2, pw, ph);
    if (panel.backdrop) {
      ctx.fillStyle = 'rgba(16, 5, 26, 0.58)';
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    }
  } else {
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.drawImage(graded, sx, sy, sw, sh, px, py, pw, ph);
    if (panel.backdrop) {
      ctx.fillStyle = 'rgba(16, 5, 26, 0.58)';
      ctx.fillRect(px, py, pw, ph);
    }
  }
  ctx.restore();

  if (!panel.tilt) {
    if (panel.framed) {
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 9 * u;
      ctx.strokeRect(px - 12 * u, py - 12 * u, pw + 24 * u, ph + 24 * u);
      ctx.strokeStyle = 'rgba(242, 182, 60, 0.45)';
      ctx.lineWidth = 2 * u;
      ctx.strokeRect(px - 22 * u, py - 22 * u, pw + 44 * u, ph + 44 * u);
    }
    ctx.strokeStyle = 'rgba(242, 182, 60, 0.9)';
    ctx.lineWidth = 3 * u;
    ctx.strokeRect(px, py, pw, ph);
  }
}

/** An empty panel: a sunset wash waiting for a photo. */
function drawEmptyPanel(ctx, panel, u) {
  const { px, py, pw, ph } = panel;
  const grad = ctx.createLinearGradient(0, py, 0, py + ph);
  grad.addColorStop(0, '#3a1154');
  grad.addColorStop(0.55, '#a12468');
  grad.addColorStop(1, '#f0763c');
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(242, 182, 60, 0.9)';
  ctx.lineWidth = 3 * u;
  ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(255, 240, 210, 0.75)';
  ctx.font = `${Math.max(13, 24 * u)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOUR PHOTO', px + pw / 2, py + ph / 2);
}

// ---------------------------------------------------------------- grain

let grainCanvas = null;
function makeGrain() {
  grainCanvas = document.createElement('canvas');
  grainCanvas.width = 240;
  grainCanvas.height = 240;
  const ctx = grainCanvas.getContext('2d');
  const img = ctx.createImageData(240, 240);
  let seed = 1234567;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 48271) % 2147483647;
    const v = seed % 256;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function drawGrain(ctx, W, H) {
  if (!grainCanvas) makeGrain();
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const grad = ctx.createRadialGradient(W / 2, H * 0.46, Math.min(W, H) * 0.42, W / 2, H * 0.52, Math.max(W, H) * 0.78);
  grad.addColorStop(0, 'rgba(10, 2, 18, 0)');
  grad.addColorStop(1, 'rgba(10, 2, 18, 0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- the cover

/**
 * Paint the whole cover. `state` is the studio state; `photos` maps a photo
 * id to its loaded image. `cap` is the grading resolution cap for this pass.
 */
export function renderCover(ctx, W, H, state, photos, cap) {
  const u = W / 1920;
  const grade = gradeById(state.grade);
  ctx.fillStyle = PLUM;
  ctx.fillRect(0, 0, W, H);
  // A breath of sunset glow behind the collage.
  const glow = ctx.createRadialGradient(W / 2, H * 0.3, 10, W / 2, H * 0.3, W * 0.62);
  glow.addColorStop(0, 'rgba(255, 112, 64, 0.13)');
  glow.addColorStop(1, 'rgba(255, 112, 64, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Panels in cast order; the pop-out hero goes last so it breaks frame.
  const panels = layoutPanelsPx(W, H, state.layout);
  const order = panels.map((p, i) => [p, i]).sort((a, b) => Number(a[0].pop) - Number(b[0].pop));
  for (const [panel, i] of order) {
    const slot = state.slots[i];
    const img = slot?.photoId ? photos.get(slot.photoId) : null;
    if (img) drawPanelPhoto(ctx, panel, slot, img, grade, cap, u);
    else drawEmptyPanel(ctx, panel, u);
  }

  drawVignette(ctx, W, H);
  if (state.show.grain) drawGrain(ctx, W, H);

  // The title's measure first: chips must stop above where it will sit.
  const title = (state.title || 'PALM HEAT').toUpperCase();
  let fontPx = H * 0.255;
  ctx.font = `${fontPx}px Anton, sans-serif`;
  const tw = ctx.measureText(title).width;
  if (tw > W * 0.68) fontPx *= (W * 0.68) / tw;
  const titleTop = H * 0.708 - fontPx * 0.62;

  // Cast callout chips: bottom-left of a panel, top-left when the panel sits
  // in the lower half and the title is about to cover its foot; a tall
  // panel's chip rides up so it stays clear of the title.
  const box = collageBox(W, H);
  for (const [panel, i] of order) {
    if (panel.backdrop) continue;
    const tag = state.slots[i]?.tag?.trim();
    if (!tag) continue;
    const lower = panel.py + panel.ph / 2 > box.y + box.h * 0.55;
    const chipY = lower
      ? panel.py + 12 * u
      : Math.min(panel.py + panel.ph - 58 * u, titleTop - 54 * u);
    drawCastChip(ctx, panel.px + 12 * u, chipY, tag.toUpperCase(), u);
  }

  if (state.show.masthead) {
    drawMasthead(ctx, W, u, { quote: state.quote, heat: state.heat, cy: H * 0.048 });
  }

  drawRetroChromeTitle(ctx, W / 2, H * 0.708, title, fontPx);
  if (state.subtitle) drawScriptSubtitle(ctx, W * 0.615, H * 0.845, state.subtitle, H * 0.08);

  if (state.tagline) drawTaglineRibbon(ctx, W / 2, H * 0.922, state.tagline.toUpperCase(), u);
  if (state.show.seal) drawGoldSeal(ctx, W * 0.905, H * 0.858, Math.min(W * 0.041, H * 0.075));

  // The foot: a gold rule, COMING SOON, the billing block, the barcode —
  // all of it kept above the inner frame line.
  const footBase = H - 34 * u; // centre of the billing block's second line
  ctx.strokeStyle = 'rgba(242, 182, 60, 0.85)';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.moveTo(14 * u, H * 0.938);
  ctx.lineTo(W - 14 * u, H * 0.938);
  ctx.stroke();
  ctx.fillStyle = '#ff5da2';
  ctx.font = `${25 * u}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', 36 * u, footBase - 24 * u);
  if (state.show.billing) {
    drawBillingBlock(
      ctx, W / 2, footBase - 24 * u,
      `A ${title} PICTURES PRODUCTION · STARRING YOU · "${title}"`,
      'SHOT ON YOUR OWN CAMERA · GRADED BY HAND · PRINTED IN THE STUDIO',
      u,
    );
  }
  drawBarcode(ctx, W - 186 * u, footBase - 30 * u, 152 * u, 34 * u, title);

  // The double gold frame around everything.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5 * u;
  ctx.strokeRect(14 * u, 14 * u, W - 28 * u, H - 28 * u);
  ctx.strokeStyle = 'rgba(242, 182, 60, 0.5)';
  ctx.lineWidth = 1 * u;
  ctx.strokeRect(23 * u, 23 * u, W - 46 * u, H - 46 * u);
}

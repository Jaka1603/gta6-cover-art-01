// The poster furniture of PALM HEAT Cover Studio: everything on the cover
// that is not a photo. Masthead with stars, press quote and a VOL. 1 chip;
// slanted cast callout chips; the striped retro-chrome title with its neon
// script subtitle; the tagline ribbon; the gold seal; the billing block and
// its barcode. All of it is drawn on canvas from the cover's own words, so
// every word stays editable in the studio.
//
// Sizes are given in `u`, one unit = cover width / 1920, so the furniture
// scales from the phone-size preview to the full export unchanged.

export const GOLD = '#f2b63c';
export const CREAM = '#f7ecd2';
export const NEON_PINK = '#ff5da2';
export const PLUM = '#150a21';

/** A five-pointed star path centred on (cx, cy). */
export function traceStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStarRow(ctx, x, cy, r, gap, filled, total = 5) {
  for (let i = 0; i < total; i++) {
    traceStar(ctx, x + i * gap, cy, r);
    ctx.fillStyle = i < filled ? GOLD : '#463654';
    ctx.fill();
  }
}

/** The top strip: five gold stars, the press quote, the HEAT meter, VOL. 1. */
export function drawMasthead(ctx, W, u, { quote, heat, cy }) {
  drawStarRow(ctx, 78 * u, cy, 15 * u, 38 * u, 5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = CREAM;
  ctx.font = `italic 600 ${31 * u}px Georgia, 'Times New Roman', serif`;
  ctx.fillText(quote, W * 0.435, cy + 1 * u);
  // HEAT meter: the word, then its stars.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = `${29 * u}px Anton, sans-serif`;
  ctx.fillText('HEAT', W * 0.735, cy + 1 * u);
  drawStarRow(ctx, W * 0.755, cy, 13 * u, 33 * u, heat);
  // VOL. 1 ticket chip.
  const chipW = 168 * u;
  const chipH = 46 * u;
  const chipX = W - 34 * u - chipW;
  ctx.fillStyle = '#ffd23e';
  ctx.fillRect(chipX, cy - chipH / 2, chipW, chipH);
  ctx.fillStyle = '#191008';
  ctx.textAlign = 'center';
  ctx.font = `${27 * u}px Anton, sans-serif`;
  ctx.fillText('VOL. 1', chipX + chipW / 2, cy + 2 * u);
}

/** A slanted black cast chip with a pink edge tab, its left edge at (x, y). */
export function drawCastChip(ctx, x, y, text, u) {
  const fontPx = 31 * u;
  ctx.font = `${fontPx}px Anton, sans-serif`;
  const w = ctx.measureText(text).width + 52 * u;
  const h = 46 * u;
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, -0.16, 1, 0, 0); // the slant
  ctx.fillStyle = 'rgba(8, 4, 14, 0.92)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = NEON_PINK;
  ctx.fillRect(0, 0, 9 * u, h);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 24 * u, h / 2 + 2 * u);
  ctx.restore();
  return w;
}

/**
 * The title: retro chrome. Dark outline and shadow first, then a fill of
 * hard horizontal sunset stripes (cream, gold, orange, hot pink, magenta),
 * the way airbrushed 80s poster lettering was painted.
 */
export function drawRetroChromeTitle(ctx, cx, cy, text, fontPx) {
  ctx.font = `${fontPx}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Shadow, then the thick dark outline the stripes sit inside.
  ctx.fillStyle = 'rgba(5, 2, 10, 0.55)';
  ctx.fillText(text, cx + fontPx * 0.03, cy + fontPx * 0.06);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14081f';
  ctx.lineWidth = fontPx * 0.17;
  ctx.strokeText(text, cx, cy);
  // Striped sunset fill, banded with hard stops.
  const top = cy - fontPx * 0.52;
  const grad = ctx.createLinearGradient(0, top, 0, top + fontPx * 1.04);
  const bands = [
    [0, '#fff6ad'], [0.3, '#fff6ad'], [0.32, '#ffd23e'], [0.48, '#ffd23e'],
    [0.5, '#ff9a3d'], [0.64, '#ff9a3d'], [0.66, '#ff5e62'], [0.8, '#ff5e62'],
    [0.82, '#e83e8c'], [1, '#c7245a'],
  ];
  for (const [pos, colour] of bands) grad.addColorStop(pos, colour);
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);
  // A last thin outline to crisp the edge.
  ctx.lineWidth = fontPx * 0.02;
  ctx.strokeStyle = 'rgba(10, 4, 18, 0.85)';
  ctx.strokeText(text, cx, cy);
}

/** The neon script subtitle, glowing pink Pacifico under the title. */
export function drawScriptSubtitle(ctx, cx, cy, text, fontPx) {
  ctx.font = `${fontPx}px Pacifico, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.shadowColor = '#ff2d95';
  ctx.shadowBlur = fontPx * 0.38;
  ctx.fillStyle = '#ff77b3';
  ctx.fillText(text, cx, cy);
  ctx.fillText(text, cx, cy);
  ctx.restore();
  ctx.fillStyle = '#ffd7ea';
  ctx.fillText(text, cx, cy);
}

/** The black tagline ribbon with pink slash ends, centred on (cx, cy). */
export function drawTaglineRibbon(ctx, cx, cy, text, u) {
  const fontPx = 30 * u;
  ctx.font = `${fontPx}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${4 * u}px`; } catch { /* older canvas: no letterspacing */ }
  const w = ctx.measureText(text).width + 64 * u;
  const h = 46 * u;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.transform(1, 0, -0.1, 1, 0, 0);
  ctx.fillStyle = 'rgba(8, 4, 14, 0.94)';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = NEON_PINK;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    const x0 = side * (w / 2 + 6 * u);
    ctx.moveTo(x0, -h / 2);
    ctx.lineTo(x0 + side * 10 * u, -h / 2);
    ctx.lineTo(x0 + side * 10 * u - 6 * u, h / 2);
    ctx.lineTo(x0 - 6 * u, h / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 2 * u);
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
}

/** The gold starburst seal: "ORIGINAL COVER ART". */
export function drawGoldSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const spikes = 28;
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.87;
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#ffe98a');
  grad.addColorStop(0.75, '#f2b63c');
  grad.addColorStop(1, '#c07f16');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#8a5a08';
  ctx.lineWidth = r * 0.03;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(138, 90, 8, 0.8)';
  ctx.lineWidth = r * 0.025;
  ctx.stroke();
  ctx.fillStyle = '#3a2403';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.235}px Anton, sans-serif`;
  ctx.fillText('ORIGINAL', 0, -r * 0.3);
  ctx.fillText('COVER ART', 0, r * 0.02);
  traceStar(ctx, 0, r * 0.42, r * 0.13);
  ctx.fillStyle = '#3a2403';
  ctx.fill();
  ctx.restore();
}

/** The tiny centred credits at the foot of the cover. */
export function drawBillingBlock(ctx, cx, cy, lineOne, lineTwo, u) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${3 * u}px`; } catch { /* ignore */ }
  ctx.fillStyle = '#efe3c2';
  ctx.font = `600 ${19.5 * u}px Arial, sans-serif`;
  ctx.fillText(lineOne, cx, cy);
  ctx.fillStyle = '#b3a37f';
  ctx.font = `600 ${16 * u}px Arial, sans-serif`;
  ctx.fillText(lineTwo, cx, cy + 24 * u);
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
}

/** A barcode with its number, seeded by the title so it never changes. */
export function drawBarcode(ctx, x, y, w, h, seedText) {
  let seed = 7;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const rand = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  ctx.fillStyle = '#f4f1e6';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#111111';
  let bx = x + w * 0.06;
  const barArea = w * 0.88;
  while (bx < x + barArea) {
    const bw = (0.4 + rand() * 1.9) * (w / 150);
    if (rand() > 0.38) ctx.fillRect(bx, y + h * 0.08, bw, h * 0.68);
    bx += bw + (0.5 + rand() * 1.4) * (w / 150);
  }
  ctx.font = `${h * 0.17}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let digits = '';
  for (let i = 0; i < 12; i++) digits += Math.floor(rand() * 10);
  ctx.fillText(digits, x + w / 2, y + h * 0.87);
}

// The eight colour grades of PALM HEAT Cover Studio.
//
// Every grade is a gradient map: a photo's luminance is run through a ramp of
// colours (shadows first, highlights last), then blended back with a little of
// the original colour so skin and signage still read as themselves. Poster Ink
// goes further — it posterises the luminance into bands and lays a halftone
// dot screen over the result, like a cheap newsprint poster.
//
// A grade is applied to one panel at a time, on an offscreen canvas the size
// of that panel, so the full-size export and the small preview grade exactly
// the same way.

/** One grade: ramp stops are [position 0..1, '#rrggbb'] pairs. */
export const GRADES = [
  {
    id: 'viceSunset', name: 'Vice Sunset',
    stops: [[0, '#150722'], [0.24, '#571b63'], [0.48, '#b92a68'], [0.68, '#f0643c'], [0.85, '#ffa14f'], [1, '#fff3c2']],
    keep: 0.16, contrast: 1.06, bright: 4,
  },
  {
    id: 'neonNights', name: 'Neon Nights',
    stops: [[0, '#04060f'], [0.28, '#0d2560'], [0.52, '#274b9f'], [0.72, '#0e9bb5'], [0.88, '#37e0c8'], [1, '#eafcff']],
    keep: 0.2, contrast: 1.08, bright: 2,
  },
  {
    id: 'posterInk', name: 'Poster Ink',
    stops: [[0, '#0e0d18'], [0.3, '#3c2a68'], [0.55, '#c93a68'], [0.78, '#ef7d3c'], [1, '#f6e7c8']],
    keep: 0.05, contrast: 1.12, bright: 0, halftone: true,
  },
  {
    id: 'goldenHour', name: 'Golden Hour',
    stops: [[0, '#200d02'], [0.3, '#71350d'], [0.55, '#c46a1d'], [0.8, '#f2a93b'], [1, '#ffedb5']],
    keep: 0.22, contrast: 1.03, bright: 5,
  },
  {
    id: 'tealHeat', name: 'Teal Heat',
    stops: [[0, '#03222b'], [0.3, '#0a4f5e'], [0.55, '#4d8f8a'], [0.78, '#e2703a'], [1, '#ffe6bd']],
    keep: 0.2, contrast: 1.05, bright: 3,
  },
  {
    id: 'monoNoir', name: 'Mono Noir',
    stops: [[0, '#000000'], [0.35, '#3d3d42'], [0.65, '#9a9aa0'], [1, '#ffffff']],
    keep: 0, contrast: 1.18, bright: 0,
  },
  {
    id: 'coralDusk', name: 'Coral Dusk',
    stops: [[0, '#1c0e28'], [0.3, '#66264f'], [0.55, '#c94f63'], [0.8, '#ff8a5f'], [1, '#ffe9d2']],
    keep: 0.18, contrast: 1.05, bright: 4,
  },
  {
    id: 'ultraviolet', name: 'Ultraviolet',
    stops: [[0, '#0b0120'], [0.3, '#38097a'], [0.55, '#7d1fc0'], [0.78, '#e04fa8'], [1, '#b8ffe9']],
    keep: 0.16, contrast: 1.07, bright: 3,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** A 256-entry lookup table (flat [r,g,b] triples) built from a grade's ramp. */
export function buildGradeLut(grade) {
  const stops = grade.stops.map(([pos, hex]) => [pos, ...hexToRgb(hex)]);
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(a[1 + c] + (b[1 + c] - a[1 + c]) * f);
  }
  return lut;
}

// Ordered 4x4 Bayer matrix, values 0..15: the dither that keeps Poster Ink's
// bands from banding, and the texture of its dot screen.
const BAYER4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

/**
 * Grade one canvas in place. `canvas` holds a drawn photo (a panel); its
 * pixels are remapped through the grade's ramp. Poster Ink also posterises
 * and dot-screens.
 */
export function applyGradeToCanvas(canvas, grade) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  if (w === 0 || h === 0) return;
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;
  const lut = buildGradeLut(grade);
  const keep = grade.keep;
  const bands = 6;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = px[i];
      let g = px[i + 1];
      let b = px[i + 2];
      // Contrast and brightness first, in the photo's own colour.
      r = (r - 128) * grade.contrast + 128 + grade.bright;
      g = (g - 128) * grade.contrast + 128 + grade.bright;
      b = (b - 128) * grade.contrast + 128 + grade.bright;
      let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (grade.halftone) {
        const dither = (BAYER4[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * (255 / bands);
        lum = Math.round((lum + dither) / 255 * (bands - 1)) / (bands - 1) * 255;
      }
      const li = Math.min(255, Math.max(0, Math.round(lum))) * 3;
      let nr = lut[li] + (r - lum) * keep;
      let ng = lut[li + 1] + (g - lum) * keep;
      let nb = lut[li + 2] + (b - lum) * keep;
      if (grade.halftone) {
        // Dot screen: darken on a fine grid so flat bands read as print.
        const dot = 0.9 + 0.1 * (BAYER4[(y & 3) * 4 + (x & 3)] / 15);
        nr *= dot; ng *= dot; nb *= dot;
      }
      px[i] = nr;
      px[i + 1] = ng;
      px[i + 2] = nb;
    }
  }
  ctx.putImageData(img, 0, 0);
}

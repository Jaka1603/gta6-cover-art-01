// PALM HEAT Cover Studio — the editor.
//
// State is one plain object: which photos sit in which panels, each panel's
// crop and cast tag, the layout, grade, preview size, the cover's words and
// which furniture is switched on. The photos themselves live in a Map beside
// it. Every change repaints the canvas through cover.js's renderCover, and
// every finished change is committed to an undo history of state snapshots.
//
// A `?shot=` query hands the page to shots.js instead: a fixed scene for the
// entry's screenshots.

import { layoutPanelsPx, renderCover } from './cover.js';
import { GRADES } from './grades.js';
import { LAYOUTS, layoutById, panelCount } from './layouts.js';
import { applyShotScene } from './shots.js';

const SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  wide: [1920, 1080],
  story: [1080, 1920],
};
const SIZE_LABELS = { square: 'Square 1:1', portrait: 'Portrait 4:5', wide: 'Wide 16:9', story: 'Story 9:16' };

const SAMPLES = [
  { id: 'sample-driver', name: 'The Driver', src: 'samples/driver.jpg' },
  { id: 'sample-insider', name: 'The Insider', src: 'samples/insider.jpg' },
  { id: 'sample-boss', name: 'The Boss', src: 'samples/boss.jpg' },
  { id: 'sample-courier', name: 'The Courier', src: 'samples/courier.jpg' },
  { id: 'sample-boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'sample-pier', name: 'The Pier', src: 'samples/pier.jpg' },
];
const OPENING_CAST = [
  'sample-insider', 'sample-boulevard', 'sample-driver', 'sample-boss',
  'sample-courier', 'sample-pier', 'sample-driver', 'sample-insider', 'sample-boss',
];
const OPENING_TAGS = [
  'THE INSIDER', 'THE GETAWAY', 'THE DRIVER', 'THE BOSS', 'THE COURIER',
  'THE RIDER', 'THE LOOKOUT', 'THE FIXER', 'THE GHOST',
];
const FACE_FIRST = -0.38; // default crop bias: keep the upper third in frame

const state = {
  layout: 'heroCast',
  grade: 'viceSunset',
  sizeName: 'wide',
  title: 'PALM HEAT',
  subtitle: 'one more night',
  tagline: 'FIVE FRIENDS · ONE COAST · NO WAY BACK',
  quote: '"PURE GOLDEN-HOUR MAYHEM" — THE HARBOR GAZETTE',
  heat: 4,
  show: { masthead: true, seal: true, billing: true, grain: true },
  slots: OPENING_TAGS.map((tag, i) => ({
    // The hero (slot 2) sits a touch lower in its tall panel: more of the
    // car and shoulders, not just the face.
    photoId: OPENING_CAST[i], zoom: 1, x: 0, y: i === 2 ? -0.2 : FACE_FIRST, tag,
  })),
  selected: 2,
};

const photos = new Map(); // photo id -> image
const photoList = []; // { id, name, img } in arrival order
let pickedPhotoId = OPENING_CAST[2];
let photoSeq = 0;

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');
const statusEl = $('status');

function setStatus(message) {
  statusEl.textContent = message;
}

/** Load an image from a URL, rejecting when it cannot be decoded. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot read ${url}`));
    img.src = url;
  });
}

function registerPhoto(id, name, img) {
  img.__palmId = id;
  photos.set(id, img);
  photoList.push({ id, name, img });
}

// ---------------------------------------------------------------- history

let history = [];
let historyIndex = -1;

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, sizeName: state.sizeName,
    title: state.title, subtitle: state.subtitle, tagline: state.tagline,
    quote: state.quote, heat: state.heat, show: state.show,
    slots: state.slots, selected: state.selected,
  });
}

function commit() {
  const snap = snapshot();
  if (history[historyIndex] === snap) return; // one edit, one step
  history = history.slice(0, historyIndex + 1);
  history.push(snap);
  if (history.length > 80) history.shift();
  historyIndex = history.length - 1;
  syncHistoryButtons();
}

function applySnapshot(snap) {
  const data = JSON.parse(snap);
  Object.assign(state, data);
  state.show = data.show;
  state.slots = data.slots;
  refreshControls();
  render();
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  applySnapshot(history[historyIndex]);
  syncHistoryButtons();
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  applySnapshot(history[historyIndex]);
  syncHistoryButtons();
}

function syncHistoryButtons() {
  $('undo').disabled = historyIndex <= 0;
  $('redo').disabled = historyIndex >= history.length - 1;
}

// ---------------------------------------------------------------- render

let renderQueued = false;
function render() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    paint();
  });
}

function paint() {
  if (document.body.classList.contains('shot-cover')) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    const [ew, eh] = SIZES[state.sizeName];
    const scale = Math.min(1, 1150 / ew);
    canvas.width = Math.round(ew * scale);
    canvas.height = Math.round(eh * scale);
  }
  renderCover(ctx, canvas.width, canvas.height, state, photos, 1100);
}

function setSize(name) {
  state.sizeName = name;
  render();
}

// ---------------------------------------------------------------- controls

function chipRow(el, items, current, onPick) {
  el.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.label;
    if (item.id === current) b.classList.add('on');
    b.addEventListener('click', () => onPick(item.id));
    el.appendChild(b);
  }
}

function buildStrip() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  for (const photo of photoList) {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = `${photo.name} — click to pick, then it fills the selected panel`;
    const img = document.createElement('img');
    img.src = photo.img.src;
    img.alt = photo.name;
    b.appendChild(img);
    if (photo.id === pickedPhotoId) b.classList.add('picked');
    if (state.slots[state.selected]?.photoId === photo.id) b.classList.add('in-slot');
    b.addEventListener('click', () => {
      pickedPhotoId = photo.id;
      assignPhoto(state.selected, photo.id);
      buildStrip();
    });
    strip.appendChild(b);
  }
}

function assignPhoto(slotIndex, photoId) {
  const slot = state.slots[slotIndex];
  if (!slot || slot.photoId === photoId) return;
  slot.photoId = photoId;
  commit();
  render();
  setStatus(`${photoList.find((p) => p.id === photoId)?.name ?? 'Photo'} is in panel ${slotIndex + 1}. Drag it to place the crop.`);
}

function buildPanelChips() {
  const layout = layoutById(state.layout);
  const count = panelCount(layout);
  const panels = layout.panels();
  chipRow($('panelChips'),
    Array.from({ length: count }, (_, i) => ({
      id: i,
      label: panels[i].backdrop ? `Backdrop` : (state.slots[i].tag?.trim() || `Panel ${i + 1}`),
    })),
    state.selected,
    (i) => { state.selected = i; refreshControls(); render(); });
}

function refreshControls() {
  chipRow($('layoutChips'), LAYOUTS.map((l) => ({ id: l.id, label: l.name })), state.layout, (id) => {
    state.layout = id;
    if (state.selected >= panelCount(layoutById(id))) state.selected = 0;
    commit(); buildPanelChips(); render();
  });
  chipRow($('gradeChips'), GRADES.map((g) => ({ id: g.id, label: g.name })), state.grade, (id) => {
    state.grade = id; commit(); render();
  });
  chipRow($('sizeChips'), Object.keys(SIZES).map((id) => ({ id, label: SIZE_LABELS[id] })), state.sizeName, (id) => {
    state.sizeName = id; commit(); render();
  });
  buildPanelChips();
  buildStrip();
  const slot = state.slots[state.selected];
  $('tagInput').value = slot?.tag ?? '';
  $('zoom').value = slot?.zoom ?? 1;
  $('cropX').value = slot?.x ?? 0;
  $('cropY').value = slot?.y ?? FACE_FIRST;
  syncSliderLabels();
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('taglineInput').value = state.tagline;
  $('quoteInput').value = state.quote;
  $('heat').value = state.heat;
  $('heatVal').textContent = `${state.heat}/5`;
  $('showMasthead').checked = state.show.masthead;
  $('showSeal').checked = state.show.seal;
  $('showBilling').checked = state.show.billing;
  $('showGrain').checked = state.show.grain;
}

function syncSliderLabels() {
  const slot = state.slots[state.selected];
  if (!slot) return;
  $('zoomVal').textContent = `${Math.round(slot.zoom * 100)}%`;
  $('cropXVal').textContent = slot.x.toFixed(2);
  $('cropYVal').textContent = slot.y.toFixed(2);
}

// ---------------------------------------------------------------- uploads

$('upload').addEventListener('change', async (event) => {
  const files = [...event.target.files];
  let added = 0;
  let skipped = 0;
  let firstAdded = null;
  for (const file of files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      const id = `upload-${++photoSeq}`;
      registerPhoto(id, file.name, img);
      added++;
      firstAdded = firstAdded ?? id;
    } catch {
      skipped++; // not a readable image: count it, keep going with the batch
    }
  }
  event.target.value = ''; // so the same file can be picked again
  if (firstAdded) {
    pickedPhotoId = firstAdded;
    assignPhoto(state.selected, firstAdded);
    buildStrip();
  }
  setStatus(
    (added ? `Added ${added} photo${added > 1 ? 's' : ''}. ` : 'No photos were added. ')
    + (skipped ? `${skipped} file${skipped > 1 ? 's were' : ' was'} skipped (not a readable image).` : ''),
  );
});

$('fillAll').addEventListener('click', () => {
  if (!pickedPhotoId) return;
  for (const slot of state.slots) slot.photoId = pickedPhotoId;
  commit(); buildStrip(); render();
  setStatus('Every panel now shows the picked photo. Give panels their own photos from the strip.');
});

// ---------------------------------------------------------------- panel editing

function bindSlider(id, key, labelSync = true) {
  $(id).addEventListener('input', () => {
    const slot = state.slots[state.selected];
    if (!slot) return;
    slot[key] = Number($(id).value);
    if (labelSync) syncSliderLabels();
    render();
  });
  $(id).addEventListener('change', commit);
}
bindSlider('zoom', 'zoom');
bindSlider('cropX', 'x');
bindSlider('cropY', 'y');

$('tagInput').addEventListener('input', () => {
  const slot = state.slots[state.selected];
  if (!slot) return;
  slot.tag = $('tagInput').value;
  render();
});
$('tagInput').addEventListener('change', () => { commit(); buildPanelChips(); });

$('resetCrop').addEventListener('click', () => {
  const slot = state.slots[state.selected];
  if (!slot) return;
  slot.zoom = 1; slot.x = 0; slot.y = FACE_FIRST;
  commit(); refreshControls(); render();
});

// Canvas pointer work: click selects a panel, drag moves its crop, the
// wheel zooms it.
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function panelAt(x, y) {
  const panels = layoutPanelsPx(canvas.width, canvas.height, state.layout);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (x >= p.px && x <= p.px + p.pw && y >= p.py && y <= p.py + p.ph) return i;
  }
  return -1;
}

/** How far a crop can slide, in source pixels, for the selected panel. */
function cropSlack(slot, panel) {
  const img = photos.get(slot.photoId);
  if (!img) return { x: 0, y: 0 };
  const s = Math.max(panel.pw / img.naturalWidth, panel.ph / img.naturalHeight) * slot.zoom;
  const sw = Math.min(img.naturalWidth, panel.pw / s);
  const sh = Math.min(img.naturalHeight, panel.ph / s);
  return { x: img.naturalWidth - sw, y: img.naturalHeight - sh, s };
}

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const hit = panelAt(point.x, point.y);
  if (hit < 0) return;
  if (hit !== state.selected) {
    state.selected = hit;
    refreshControls();
  }
  const slot = state.slots[hit];
  const panel = layoutPanelsPx(canvas.width, canvas.height, state.layout)[hit];
  drag = { slot, panel, startX: point.x, startY: point.y, origX: slot.x, origY: slot.y };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const slack = cropSlack(drag.slot, drag.panel);
  if (slack.x > 0) drag.slot.x = clamp(drag.origX - ((point.x - drag.startX) / slack.s) / slack.x * 2);
  if (slack.y > 0) drag.slot.y = clamp(drag.origY - ((point.y - drag.startY) / slack.s) / slack.y * 2);
  syncSliderLabels();
  $('cropX').value = drag.slot.x;
  $('cropY').value = drag.slot.y;
  render();
});

canvas.addEventListener('pointerup', () => {
  if (!drag) return;
  drag = null;
  commit();
});

let wheelCommitTimer = null;
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const point = canvasPoint(event);
  const hit = panelAt(point.x, point.y);
  if (hit < 0) return;
  if (hit !== state.selected) {
    state.selected = hit;
    refreshControls();
  }
  const slot = state.slots[hit];
  slot.zoom = Math.min(4, Math.max(1, slot.zoom * Math.exp(-event.deltaY * 0.0012)));
  $('zoom').value = slot.zoom;
  syncSliderLabels();
  render();
  clearTimeout(wheelCommitTimer);
  wheelCommitTimer = setTimeout(commit, 350);
}, { passive: false });

function clamp(v) {
  return Math.min(1, Math.max(-1, v));
}

// ---------------------------------------------------------------- words & furniture

function bindText(id, key) {
  $(id).addEventListener('input', () => { state[key] = $(id).value; render(); });
  $(id).addEventListener('change', commit);
}
bindText('titleInput', 'title');
bindText('subtitleInput', 'subtitle');
bindText('taglineInput', 'tagline');
bindText('quoteInput', 'quote');

$('heat').addEventListener('input', () => {
  state.heat = Number($('heat').value);
  $('heatVal').textContent = `${state.heat}/5`;
  render();
});
$('heat').addEventListener('change', commit);

for (const [id, key] of [['showMasthead', 'masthead'], ['showSeal', 'seal'], ['showBilling', 'billing'], ['showGrain', 'grain']]) {
  $(id).addEventListener('change', () => {
    state.show[key] = $(id).checked;
    commit();
    render();
  });
}

// ---------------------------------------------------------------- export & history buttons

function exportPng(w, h) {
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  renderCover(out.getContext('2d'), w, h, state, photos, 1800);
  out.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `palm-heat-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setStatus(`Saved palm-heat-${w}x${h}.png`);
  }, 'image/png');
}

for (const button of document.querySelectorAll('[data-export]')) {
  button.addEventListener('click', () => {
    const [w, h] = button.dataset.export.split('x').map(Number);
    exportPng(w, h);
  });
}
$('undo').addEventListener('click', undo);
$('redo').addEventListener('click', redo);

// ---------------------------------------------------------------- keyboard

let nudgeActive = false;
document.addEventListener('keydown', (event) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const mod = event.ctrlKey || event.metaKey;
  if (mod && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) redo(); else undo();
    return;
  }
  if (mod && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redo();
    return;
  }
  if (event.key.startsWith('Arrow')) {
    const slot = state.slots[state.selected];
    if (!slot) return;
    event.preventDefault();
    nudgeActive = true;
    const step = event.shiftKey ? 0.08 : 0.02;
    if (event.key === 'ArrowLeft') slot.x = clamp(slot.x - step);
    if (event.key === 'ArrowRight') slot.x = clamp(slot.x + step);
    if (event.key === 'ArrowUp') slot.y = clamp(slot.y - step);
    if (event.key === 'ArrowDown') slot.y = clamp(slot.y + step);
    $('cropX').value = slot.x;
    $('cropY').value = slot.y;
    syncSliderLabels();
    render();
  }
});
document.addEventListener('keyup', (event) => {
  if (nudgeActive && event.key.startsWith('Arrow')) {
    nudgeActive = false;
    commit();
  }
});

// ---------------------------------------------------------------- boot

window.__palmheat = { state, photos, render, exportPng, setSize };

async function boot() {
  refreshControls();
  syncHistoryButtons();
  const loaded = await Promise.all(SAMPLES.map((sample) => loadImage(sample.src)));
  SAMPLES.forEach((sample, i) => registerPhoto(sample.id, sample.name, loaded[i]));
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.load('60px Pacifico');
    await document.fonts.ready;
  } catch { /* fonts fall back to system faces; the cover still paints */ }
  buildStrip();
  commit();
  render();

  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    applyShotScene(shot, { state, render, setSize });
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  }
}

boot();

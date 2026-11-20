// Fixed scenes for the entry's screenshots, chosen with ?shot=<name>.
//
//   cover    the default cast on the Hero & Cast layout, wide — the
//            exported cover itself, alone in the window
//   editor   the studio at work, sample cast loaded (no cover-only mode)
//   portrait a portrait cover: nine-panel grid, Neon Nights, NEON HARBOR
//   square   a square cover: hero trio, Poster Ink, HIGH TIDE
//
// main.js calls applyShotScene once the samples and fonts are in; the scene
// patches the state, switches the page into cover-only mode when the shot is
// a bare cover, renders, and main.js then flags window.__shotReady.

const CAST_PHOTOS = [
  'sample-insider', 'sample-boulevard', 'sample-driver', 'sample-boss',
  'sample-courier', 'sample-pier', 'sample-insider', 'sample-boss', 'sample-driver',
];

function fillCast(state, photos) {
  state.slots.forEach((slot, i) => {
    slot.photoId = photos[i % photos.length];
    slot.zoom = 1;
    slot.x = 0;
    slot.y = -0.38;
  });
}

export function applyShotScene(name, studio) {
  const { state } = studio;
  if (name === 'editor') return; // the default state IS the editor scene
  document.body.classList.add('shot-cover');
  if (name === 'portrait') {
    studio.setSize('portrait');
    state.layout = 'nineGrid';
    state.grade = 'neonNights';
    state.title = 'NEON HARBOR';
    state.subtitle = 'after dark';
    state.tagline = 'NINE LIVES · ONE HARBOR · NO CURFEW';
    fillCast(state, CAST_PHOTOS);
  } else if (name === 'square') {
    studio.setSize('square');
    state.layout = 'heroTrio';
    state.grade = 'posterInk';
    state.title = 'HIGH TIDE';
    state.subtitle = 'salt & neon';
    state.tagline = 'THREE CREWS · ONE TIDE · NO BRAKES';
    fillCast(state, ['sample-driver', 'sample-courier', 'sample-boss']);
    state.slots[0].tag = 'THE DRIVER';
    state.slots[1].tag = 'THE COURIER';
    state.slots[2].tag = 'THE BOSS';
  } else {
    // 'cover' and anything unrecognised: the approved default scene.
    studio.setSize('wide');
  }
  studio.render();
}

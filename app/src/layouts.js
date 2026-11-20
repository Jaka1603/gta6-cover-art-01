// The eight panel layouts of PALM HEAT Cover Studio.
//
// A layout is a list of panels in collage-box coordinates (0..1 on both
// axes); cover.js scales the box onto the cover, so every layout works at
// every export size. A panel may tilt (the snapshot layouts), carry a white
// snapshot border instead of the gold rule, and the pop-out hero's panel is
// flagged `pop`: it is drawn last and starts above the collage box, so the
// figure breaks out of the frame.
//
// Panel order is cast order: panel 0 takes cast tag 0, and so on.

function panel(x, y, w, h, extra = {}) {
  return { x, y, w, h, tilt: 0, border: 'gold', pop: false, ...extra };
}

export const LAYOUTS = [
  {
    id: 'heroCast', name: 'Hero & Cast',
    panels: () => [
      panel(0, 0, 0.272, 0.52),
      panel(0, 0.545, 0.272, 0.455),
      panel(0.286, 0, 0.428, 1),
      panel(0.728, 0, 0.272, 0.52),
      panel(0.728, 0.545, 0.272, 0.455),
    ],
  },
  {
    id: 'nineGrid', name: 'Nine-Panel Grid',
    panels: () => {
      const g = 0.014;
      const cw = (1 - g * 2) / 3;
      const ch = (1 - g * 2) / 3;
      const out = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) out.push(panel(col * (cw + g), row * (ch + g), cw, ch));
      }
      return out;
    },
  },
  {
    id: 'slantedSnapshots', name: 'Slanted Snapshots',
    panels: () => [
      panel(0, 0, 1, 1, { backdrop: true }),
      panel(0.03, 0.05, 0.43, 0.56, { tilt: -5, border: 'white' }),
      panel(0.545, 0.02, 0.43, 0.52, { tilt: 4, border: 'white' }),
      panel(0.075, 0.52, 0.4, 0.45, { tilt: 3, border: 'white' }),
      panel(0.555, 0.5, 0.42, 0.47, { tilt: -4, border: 'white' }),
    ],
  },
  {
    id: 'popOutHero', name: 'Pop-Out Hero',
    panels: () => [
      panel(0, 0, 0.295, 1),
      panel(0.705, 0, 0.295, 1),
      panel(0.315, 0.1, 0.37, 0.9),
      panel(0.335, -0.16, 0.33, 0.98, { pop: true }),
    ],
  },
  {
    id: 'heroTrio', name: 'Hero Trio',
    panels: () => [
      panel(0, 0, 0.55, 1),
      panel(0.565, 0, 0.435, 0.49),
      panel(0.565, 0.51, 0.435, 0.49),
    ],
  },
  {
    id: 'duo', name: 'Duo',
    panels: () => [
      panel(0, 0, 0.493, 1),
      panel(0.507, 0, 0.493, 1),
    ],
  },
  {
    id: 'fullBleed', name: 'Full Bleed',
    panels: () => [panel(0, 0, 1, 1)],
  },
  {
    id: 'singleFrame', name: 'Single Frame',
    panels: () => [
      panel(0, 0, 1, 1, { backdrop: true }),
      panel(0.17, 0.05, 0.66, 0.9, { framed: true }),
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/** How many photo slots a layout uses (a backdrop panel takes a photo too). */
export function panelCount(layout) {
  return layout.panels().length;
}

// PALM HEAT Cover Studio — the hand-in program (program/v1, Node 22,
// standard library only).
//
// The entry itself is the static web app in app/: plain files a desktop
// browser loads fully offline, no build step, no network. This program's
// whole job is to hand that app in the way the scorer expects:
//
//   1. sanity-check the repo (an app with an index.html, 3–4 screenshots),
//   2. copy app/ and screenshots/ into the output directory
//      (MAKEFUN_OUTPUT_DIR when set, /output otherwise),
//   3. write dossier.json there with the vendored make.fun library, under
//      the scorer's own caps, and report what was handed in.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app itself with `node serve.ts`.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const say = (line: string): void => console.log(`[palm-heat] ${line}`);

function refuse(message: string): never {
  console.error(`[palm-heat] cannot hand in: ${message}`);
  process.exit(1);
}

// --- 1. sanity checks -------------------------------------------------------

const appDir = join(repoDir, 'app');
if (!existsSync(join(appDir, 'index.html'))) refuse('app/index.html is missing — there is no app to hand in');

const shotsDir = join(repoDir, 'screenshots');
const shotNames = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort()
  : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  refuse(`screenshots/ holds ${shotNames.length} images; the hand-in wants 3 or 4`);
}
for (const name of shotNames) {
  const bytes = statSync(join(shotsDir, name)).size;
  if (bytes > 262144) refuse(`screenshots/${name} is ${bytes} bytes, over the 262144 cap`);
}

// --- 2. copy the app and its screenshots ------------------------------------

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
say(`copied app/ and ${shotNames.length} screenshots (${shotNames.join(', ')}) to ${outDir}`);

// --- 3. the dossier -----------------------------------------------------------

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
say(`dossier.json written: ${dossier.byteLength} bytes`);
say('hand-in complete');

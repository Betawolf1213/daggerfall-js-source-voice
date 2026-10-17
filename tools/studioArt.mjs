// STUDIO1 (2026-10-17, bible/07-Rendering/Studio-Art.md): THE STUDIO'S TOOL - what the game's artists can paint, the
// pictures they start from, and whether their folder is ready to ship.
//
//   node tools/studioArt.mjs                 every slot the port paints itself, and which the studio already covers
//   node tools/studioArt.mjs templates [dir] each slot's picture as the game wears it today, as a PNG named the way the
//                                            studio names it - repaint it, drop it in your folder (default dir:
//                                            studio-templates/, which git ignores)
//   node tools/studioArt.mjs check           the folder's rules (scripts/studioArtIndex.mjs) and every picture decoded;
//                                            exits 1 on a problem - the suite runs the same check
//
// The studio page (studio.html, on the dev server and the site) shows and hands out the same templates in a browser.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { writePng } from './pngIO.mjs';
import { studioListing, STUDIO_TREE } from '../scripts/studioArtIndex.mjs';
import { studioEntries } from '../src/systems/studioArt/studioArt.js';
import { STUDIO_SETS, studioSlots } from '../src/systems/studioArt/studioSlots.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Every picture the studio holds, by the key it paints. */
const studioByKey = (listing) => new Map(studioEntries(listing.files).map((e) => [e.key, e]));

/**
 * THE CHECK: the folder's rules, then every picture decoded whole (a header can say PNG over bytes that will not
 * decode), and a picture of a painted slot whose shape is not the slot's (its face would stretch it) - `problems` fail,
 * `notes` are said. Exported for the suite (test/systems/studioArt/studio1_folder.test.js).
 */
export async function checkStudio(at = root) {
  const listing = studioListing(at);
  const problems = [...listing.problems], notes = [];
  const slots = new Map();
  for (const set of STUDIO_SETS) for (const s of studioSlots(set)) slots.set(s.key, s);
  for (const e of studioEntries(listing.files)) {
    let png;
    try { png = PNG.sync.read(readFileSync(join(at, STUDIO_TREE, e.path))); } catch (err) {
      problems.push(`${e.path}: will not decode (${err?.message ?? err}) - re-export it as PNG`);
      continue;
    }
    const slot = slots.get(e.key);
    if (slot) {
      const p = await slot.picture();
      if (p && Math.abs(png.width / png.height - p.width / p.height) > 0.01) notes.push(`${e.path}: ${png.width} x ${png.height}, and ${slot.name} is ${p.width} x ${p.height} - it is stretched to the slot's shape`);
    }
  }
  return { listing, problems, notes };
}

async function list() {
  const listing = studioListing(root);
  const own = studioByKey(listing);
  for (const set of STUDIO_SETS) {
    const slots = studioSlots(set);
    console.log(`\n${set.title} - archive ${set.archive}, ${slots.length} slots${set.door === 'painted' ? '' : ' (on the texture door)'}`);
    for (const s of slots) {
      const p = await s.picture();
      const by = own.get(s.key);
      console.log(`  ${s.key.padEnd(12)} ${`${p.width} x ${p.height}`.padEnd(10)} ${s.name}${by ? `   <- studio: ${by.path}` : ''}`);
      own.delete(s.key);
    }
  }
  if (own.size) {
    console.log("\nDaggerfall's own textures, replaced by the studio:");
    for (const e of own.values()) console.log(`  ${e.key.padEnd(12)} ${e.path}`);
  }
  console.log(`\nThe studio: ${listing.files.length} picture(s) worn, ${listing.problems.length} problem(s) - node tools/studioArt.mjs check says which.`);
}

async function templates(dir = 'studio-templates') {
  const out = resolve(root, dir);
  let n = 0;
  for (const set of STUDIO_SETS) {
    mkdirSync(join(out, set.id), { recursive: true });
    for (const s of studioSlots(set)) {
      const p = await s.picture();
      writeFileSync(join(out, set.id, s.fileName), writePng({ width: p.width, height: p.height, data: Uint8Array.from(p.data) }));
      n++;
    }
  }
  console.log(`${n} templates in ${out}`);
}

async function check() {
  const { listing, problems, notes } = await checkStudio(root);
  for (const n of notes) console.log(`note: ${n}`);
  for (const p of problems) console.log(`PROBLEM: ${p}`);
  console.log(`${listing.files.length} picture(s) worn by ${listing.roster.length} artist(s) on the roster; ${problems.length} problem(s).`);
  if (problems.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd = 'list', arg] = process.argv.slice(2);
  const run = { list, templates: () => templates(arg), check }[cmd];
  if (!run) { console.error('usage: node tools/studioArt.mjs [list | templates [dir] | check]'); process.exitCode = 2; } else await run();
}

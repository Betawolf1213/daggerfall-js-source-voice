// AUDIT BANTHA1 (RISK, bible/01-Overview/audits/Audit-Bantha.md): WHERE THE JUNGLE STANDS ON THE MAP - read off the
// owner's own ARENA2, which this repository does not hold. The jungle is the political map's region 10 (Bantha,
// world/jungle/jungleRegion.js JUNGLE_REGIONS). This says how many map pixels each jungle region holds, its box, the
// climates it wears (the jungle lays the rainforest's law over whatever they are) and its places (the names
// `SCENES=jungle LOC=<town> npm run perf` takes), beside Daggerfall's region for scale. Run on the freeware's data
// (2026-10-18): region 10, Bantha, holds NO pixel and no place - Daggerfall names it and never paints it.
//
//   sh tools/fetch-data.sh && ARENA2_PATH=/home/claude/dfdata/arena2 node tools/jungleExtent.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MapsFile } from '../src/formats/mapsFile.js';
import { JUNGLE_REGIONS } from '../src/world/jungle/jungleRegion.js';

const A = process.env.ARENA2_PATH;
if (!A) { console.log('jungleExtent: set ARENA2_PATH to the ARENA2 folder'); process.exit(0); }
const read = (f) => new Uint8Array(readFileSync(join(A, f)));
const maps = new MapsFile();
maps.load(read('MAPS.BSA'), read('CLIMATE.PAK'), read('POLITIC.PAK'));

/** A region's pixels on the 1000 x 500 map: their count, box and climates. */
function extent(region) {
  let n = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  const climates = new Map();
  for (let y = 0; y < 500; y++) {
    for (let x = 0; x < 1000; x++) {
      if (maps.getRegionIndexAt(x, y) !== region) continue;
      n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      const c = maps.getClimateIndex(x, y);
      climates.set(c, (climates.get(c) ?? 0) + 1);
    }
  }
  return { pixels: n, box: n ? [x0, y0, x1, y1] : null, climates: Object.fromEntries(climates) };
}

for (const r of [...JUNGLE_REGIONS, 17]) {
  const places = [...(maps.getRegion(r)?.mapNameLookup?.keys() ?? [])];   // its MAPNAMES - none for an empty region
  console.log(`region ${r} (${maps.getRegionName(r)}):`, JSON.stringify({ ...extent(r), places: places.slice(0, 20), placeCount: maps.baseLocationCount(r) }));
}

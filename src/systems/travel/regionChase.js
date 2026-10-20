// @ts-check
// ═══════════════════════════════════════════════════════════════════
// OW-CHASE-RANGE (2026-10-19, the owner, of the Overworld's gaps: "4. Fix it"; bible/06-Systems/Travel-View.md
// OW-CHASE-RANGE): A CHASE SEEN AS FAR AS ITS BAND IS DRAWN.
//
// TV7b said a chase on the chaser's cell foes frame, and the relay fans that frame RANGE_PIXELS (3) about its sender,
// while the Overworld draws the bands BAND_REACH_PX (6) about the viewer - so a player three to six pixels from a chaser
// saw the band at its own wander, and kept seeing it after it was spent unless their cell's ledger heard (TV7b's recorded
// limit, AUDIT OW3's, OW6's). The region already has a word that reaches past the cell: each traveller's mark (TV3, the
// region's channel). The chaser's mark now carries its chase word (`bd`, world224 - the foes frame's own shape, the bands'
// and the raiders' together), said when a chase begins or ends or a band is spent, and again every
// TRAV_CHASE_REFRESH_MS while a chase runs; a reader hears it from a traveller past the cell's reach (inside it the foes
// frame says the same every frame, and better) through the bands' and the raiders' own hearing, the word standing
// TRAV_BAND_HOLD_MS.
//
// What it is not: a mark is said only by a traveller who shows themselves to the region ("Show me to travellers", on by
// default - TV3) and only in their region's channel - a chaser who hides, or one across a region's border, is heard as
// before, within the cell's three pixels. A chase's place is the mark's, said at most once a TRAV_CHASE_REFRESH_MS.
//
// PURE: words in, words out. The host (scenes/world.js) says the mark and hears the region.
// ═══════════════════════════════════════════════════════════════════
import { BANDS_WIRE_MAX } from './travelBands.js';
import { RANGE_PIXELS } from '../../net/wire.js';
import { TRAV_CHASE_REFRESH_MS } from '../travellerMarks.js';

/** How long a chase heard from the region stands: two refreshes and a half - one missed (the room over its budget, a
 *  frame refused) and the band is still drawn where it ran. */
export const TRAV_BAND_HOLD_MS = 2.5 * TRAV_CHASE_REFRESH_MS;

/** The word a mark carries: the bands' word and the raiders' (each chaseWordOf's own), the chases of both first, then
 *  the spent - at most BANDS_WIRE_MAX in all. */
export function regionChaseWord(bandWord, raidWord) {
  const all = [...(bandWord ?? []), ...(raidWord ?? [])];
  return [...all.filter((e) => e[3] === 1), ...all.filter((e) => e[3] !== 1)].slice(0, BANDS_WIRE_MAX);
}

/** The chase word a region's mark says that is mine to hear - from a traveller past the cell's reach (within
 *  RANGE_PIXELS of me their foes frame reaches me, every frame), else null. `me` my map pixel. */
export function regionChaseHeard(f, me) {
  const bd = f?.p?.bd;
  if (!Array.isArray(bd) || !bd.length || !me) return null;
  return Math.max(Math.abs(f.p.px - me.x), Math.abs(f.p.py - me.y)) > RANGE_PIXELS ? bd : null;
}

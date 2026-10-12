// @ts-check
// EG-H3 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 7 and 31, EG10):
// THE SWAP'S BUILD - everything a circle's made level is that costs time to make, made apart from the screen: its halls'
// mesh (world/egHall.js buildEgCircleModel - a whole circle runs 30-70 ms in one task, and its hall law's solver as long
// again), its floors and walls for the collider, its lamps and its Ramparts' portcullises. The breach's client asks for
// the next circle's while the Court rests (scenes/egClient.js), the build runs on a worker (world/egCircleWorker.js) so
// it never lands in a frame, and the step into the new circle only uploads it (scenes/worldModes.js egSwapCircle).
//
// Pure modules only (no ui/, scenes/, render/): a worker has no DOM. The same builders the mode machine's own stand uses,
// so a level built here is the level built there, byte for byte (test/egswap_client.test.js). Not a DFU member. Ledger A
// (ELITE-GATES).
import { buildEgCircleModel, egCircleColliderTris, egCircleLights, egGateParts } from './egHall.js';
import { egCircleSpecs } from '../net/egLaw.js';

/** The circle a build is for: its breach's seed, its number and its ground (the span decrees' `geo`) - the mode
 *  machine's own key for the level it stands (scenes/worldModes.js standEgHall). */
export const egCircleKey = (seed, c, geo = 0) => `${seed >>> 0}:${c}:${geo || 0}`;
/** A circle's Ramparts' portcullises: `[{ h, model, tris }]`, one a hall that has one (world/egHall.js egGateParts). */
export function egCircleGates(seed, c, geo = 0) {
  const out = [];
  for (const spec of egCircleSpecs(seed, c, geo)) { const p = egGateParts(spec); if (p) out.push({ h: spec.h, model: p.model, tris: p.tris }); }
  return out;
}
/**
 * A CIRCLE'S MADE LEVEL, BUILT: `{ key, model, tris, lamps, gates }` - the halls' one mesh (renderer.createMesh's model),
 * the collider's triangles (the dungeon's frame), the lamps (the light list's shape) and the portcullises.
 * @param {number} seed @param {number} c @param {number} [geo]
 */
export function egCircleParts(seed, c, geo = 0) {
  return { key: egCircleKey(seed, c, geo), model: buildEgCircleModel(seed, c, geo), tris: egCircleColliderTris(seed, c, geo), lamps: egCircleLights(seed, c, geo), gates: egCircleGates(seed, c, geo) };
}
/** Every buffer a built circle carries - what its worker hands over rather than copies. */
export function egCirclePartsTransfers(parts) {
  const out = new Set();
  const take = (a) => { if (ArrayBuffer.isView(a) && a.buffer instanceof ArrayBuffer) out.add(a.buffer); };
  const model = (m) => { for (const v of Object.values(m ?? {})) take(v); };
  model(parts?.model); take(parts?.tris);
  for (const g of parts?.gates ?? []) { model(g.model); take(g.tris); }
  return [...out];
}

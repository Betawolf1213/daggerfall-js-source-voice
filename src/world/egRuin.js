// @ts-check
// EG-LOOK (2026-10-15, Mac: "Literally everything, and no band aids"; bible/11-Multiplayer/Elite-Gates-Look.md section 3):
// THE RUIN - everything a hall of the Battlemages' academy is that the law is not: the foundations hanging under every
// floor, the cornices under every edge, the column rings round the courts and plates (their tops carrying the lamps), the
// arches standing out of the void, the statues, the banners, the band's own things among the columns, a stone bridge's
// arches under every way. One mesh a hall (`{ h, x0, model, sphere }`), built with the circle in the swap's worker
// (world/egCircleParts.js egCircleBuild) and on the main thread for the first stand - byte for byte the same. None of it
// is a collider; all of it stands outside every floor's footprint in plan or below every floor's top (no visual larger
// than the law), and nothing of it pokes through another floor of the hall.
//
// Pure: no DOM, no GL. Not a DFU member. Ledger A (ELITE-GATES).

/**
 * A CIRCLE'S RUIN: one part a hall - `{ h, x0, model, sphere: [x, y, z, r] }` in the dungeon's frame (renderer.createMesh's
 * model, in the circle's band's archive; `x0` its hall's origin along the level, the cull's key).
 * @param {number} seed @param {number} c @param {number} [geo] @param {{ lite?: boolean }} [opts]
 * @returns {Array<{ h: number, x0: number, model: any, sphere: number[] }>}
 */
export function buildEgRuinParts(seed, c, geo = 0, { lite = false } = {}) {
  void seed; void c; void geo; void lite;
  return [];
}

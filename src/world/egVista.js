// @ts-check
// EG-LOOK (2026-10-15, Mac: "Literally everything, and no band aids"; bible/11-Multiplayer/Elite-Gates-Look.md section 4):
// THE WRECK - each band's torn wings of the academy drifting 120-450 m out from the hall the eye stands in, turning slowly
// about their own axes, and the sealed Spire's underside hanging overhead (world/egUnderside.js's model). Built once a
// band (in the swap's worker with the band's dress, or on the main thread at a stand), placed about the eye's hall a frame
// (scenes/egGroundLook.js). Drawn noShadow in the hall's fog: they melt into the haze with distance - that is the depth.
//
// Pure: no DOM, no GL. Not a DFU member. Ledger A (ELITE-GATES).

/**
 * A BAND'S WRECK: `{ band, wings: [{ model, at: [x, y, z], spin, tilt }], under: { model, at, scale } | null }` - each
 * wing's model about its own axis, `at` from its hall's centre (the dungeon frame's axes, m), `spin` its turn (rad/s),
 * `tilt` its lean (rad); the underside's model, where it hangs and its scale. In the band's archive.
 * @param {number} band @param {{ lite?: boolean }} [opts]
 * @returns {{ band: number, wings: Array<{ model: any, at: number[], spin: number, tilt: number }>, under: { model: any, at: number[], scale: number } | null }}
 */
export function buildEgVista(band, { lite = false } = {}) {
  void lite;
  return { band: Math.max(0, Math.min(3, band | 0)), wings: [], under: null };
}

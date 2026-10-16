// @ts-check
// EG-LOOK (2026-10-15, Mac: "Literally everything, and no band aids"; bible/11-Multiplayer/Elite-Gates-Look.md sections 3
// and 4): THE RUIN AND THE WRECK ON THIS SCREEN - a circle's ruin (world/egRuin.js: one mesh a hall, the academy that is
// not the law) and its band's wreck (world/egVista.js: the torn wings drifting out from the hall, the sealed Spire's
// underside overhead), made into the renderer's meshes and handed to the level as draws, every one noShadow:
//   THE RUIN is the circle's - stood with it (from the swap's worker's build, or built here at a stand), freed with it; a
//     frame draws only the ruin of the hall the eye stands in (the halls stand EG_HALL_PITCH apart, far past the fog);
//   THE WRECK is the band's - made the first time a circle of the band stands, kept while the band's circles follow one
//     another, freed when another band's stands or the breach ends; a frame places its wings about the hall the eye stands
//     in, turning on the shared clock (the same turn on every screen), and hangs the Spire's underside from the eye - its
//     meshes and their turning scenes/egWreckLook.js's (the wings batched: four draws a band).
// The circle's host (scenes/egCircleHost.js) lays the draws in the level's context and takes them out again; the Spire lab
// (src/tools/spireLab.js) draws the same. Nothing here is a collider and nothing here moves the law.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { buildEgRuinParts } from '../world/egRuin.js';
import { createEgWreckLook } from './egWreckLook.js';   // EG-LOOK (section 4): THE WRECK's meshes, batched and turned
import { egCircleSpecs, egBandOfCircle, EG_HALL_PITCH } from '../net/egLaw.js';
import { SD_REALM_ORIGIN } from '../net/sdBrain.js';
import { identity } from '../world/mat4.js';
import { isTouchDevice } from '../ui/touchDevice.js';

/**
 * @param {{ renderer?: any, lite?: boolean }} [deps] `lite` the phones' tier (ui/touchDevice.js - the Hour's own:
 *   scenes/sdHang.js)
 */
export function createEgGroundLook({ renderer = null, lite = isTouchDevice() } = {}) {
  const IDENT = identity();
  /** @type {Array<{ h: number, x0: number, gpu: any, draw: any }>} */
  let ruins = [];
  /** The circle's halls: each one's origin along the level, its course's middle (the wreck's anchor) and whether it is a
   *  Court (its lord's: the wreck stands at its Court places there). */
  let halls = /** @type {Array<{ x0: number, zc: number, court: boolean }>} */ ([]);
  /** THE WRECK: the band's wings and the Spire's underside (scenes/egWreckLook.js). */
  const wreck = createEgWreckLook({ renderer, lite });
  const make = (model) => {
    if (!model || !renderer?.createMesh) return null;
    try { return renderer.createMesh(model); } catch (e) { console.warn('[eg] the ruin would not build', e?.message ?? e); return null; }
  };
  const free = (gpu) => { if (gpu) { try { renderer?.destroyMesh?.(gpu); } catch { /* gone */ } } };
  const drawOf = (gpu, matrix) => (gpu ? { gpu, object: { matrix }, noShadow: true, hidden: false } : null);
  const api = {
    lite,
    /** Circle `c` stood: its halls' ruins (`built` the swap's worker's parts.ruins, else built here) and its band's wreck
     *  (`vistaBuilt` the worker's parts.vista, else made here when the band is new). Answers every draw to lay in the level. */
    stand(seed, c, geo = 0, built = null, vistaBuilt = null) {
      halls = egCircleSpecs(seed, c, geo).map((s) => ({ x0: s.x0, zc: (s.len ?? 80) / 2, court: !!s.lord }));
      let parts = built;
      if (!Array.isArray(parts)) { try { parts = buildEgRuinParts(seed, c, geo, { lite }); } catch (e) { console.warn('[eg] the ruin would not build', e?.message ?? e); parts = []; } }
      ruins = [];
      for (const p of parts) { const gpu = make(p.model); if (gpu) ruins.push({ h: p.h, x0: p.x0, gpu, draw: drawOf(gpu, IDENT) }); }
      wreck.stand(egBandOfCircle(c), vistaBuilt);   // the band's wreck: `vistaBuilt` the worker's, else made here when the band is new
      return api.draws();
    },
    /** Every draw it holds (the ruin's, then the wreck's). */
    draws() { return [...ruins.map((r) => r.draw), ...wreck.draws()].filter(Boolean); },
    /** A frame: the ruin of the hall `eye` (the dungeon's frame) stands in drawn, the others hidden; the wreck's wings
     *  placed about that hall's centre and turned on the shared clock `seconds`, the underside hung from the eye. */
    frame(eye, seconds = 0) {
      if (!eye || !halls.length) return;
      const ex = eye[0] - SD_REALM_ORIGIN[0];
      let at = halls[0];
      for (const hl of halls) if (Math.abs(hl.x0 - ex) < Math.abs(at.x0 - ex)) at = hl;
      for (const r of ruins) if (r.draw) r.draw.hidden = Math.abs(r.x0 - at.x0) > EG_HALL_PITCH / 2;
      wreck.frame(eye, SD_REALM_ORIGIN[0] + at.x0, SD_REALM_ORIGIN[1], SD_REALM_ORIGIN[2] + at.zc, seconds, at.court);   // the hall's centre (net/sdBrain.js realmToDungeon's, nothing made)
    },
    /** The circle let go: every draw of its taken out of `list` (the level's dynamic draws), its ruins' meshes freed (the
     *  wreck stays: the band's). Answers how many meshes it freed. */
    down(list = null) {
      const mine = new Set(api.draws());
      if (Array.isArray(list)) for (let i = list.length - 1; i >= 0; i--) if (mine.has(list[i])) list.splice(i, 1);
      const n = ruins.filter((r) => r.gpu).length;
      for (const r of ruins) free(r.gpu);
      ruins = []; halls = [];
      return n;
    },
    /** The breach's end: the wreck freed too (the circle's ruins already went with it). */
    release() { for (const r of ruins) free(r.gpu); ruins = []; halls = []; wreck.release(); },
    /** What it holds (tests, stats). */
    stats: () => { const w = wreck.stats(); return { ruins: ruins.length, drawn: ruins.filter((r) => r.draw && !r.draw.hidden).length, band: w.band, wreck: w.wings + (w.under ? 1 : 0), wreckDraws: w.draws, wreckTris: w.tris }; },
  };
  return api;
}

// @ts-check
// EG-LOOK (2026-10-15, Mac: "Literally everything, and no band aids"; bible/11-Multiplayer/Elite-Gates-Look.md sections 3
// and 4): THE RUIN AND THE WRECK ON THIS SCREEN - a circle's ruin (world/egRuin.js: one mesh a hall, the academy that is
// not the law) and its band's wreck (world/egVista.js: the torn wings drifting out from the hall, the sealed Spire's
// underside overhead), made into the renderer's meshes and handed to the level as draws, every one noShadow:
//   THE RUIN is the circle's - stood with it (from the swap's worker's build, or built here at a stand), freed with it; a
//     frame draws only the ruin of the hall the eye stands in (the halls stand EG_HALL_PITCH apart, far past the fog);
//   THE WRECK is the band's - made the first time a circle of the band stands, kept while the band's circles follow one
//     another, freed when another band's stands or the breach ends; a frame places it about the hall the eye stands in and
//     turns each wing on the shared clock (the same turn on every screen).
// The circle's host (scenes/egCircleHost.js) lays the draws in the level's context and takes them out again; the Spire lab
// (src/tools/spireLab.js) draws the same. Nothing here is a collider and nothing here moves the law.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { buildEgRuinParts } from '../world/egRuin.js';
import { buildEgVista } from '../world/egVista.js';
import { egCircleSpecs, egBandOfCircle, EG_HALL_PITCH } from '../net/egLaw.js';
import { realmToDungeon, SD_REALM_ORIGIN } from '../net/sdBrain.js';
import { identity } from '../world/mat4.js';
import { isTouchDevice } from '../ui/touchDevice.js';

/** A matrix written in place: translate (x, y, z), turn `ry` about y, lean `rx` about x, scale `s` (column-major). */
function place(M, x, y, z, ry = 0, rx = 0, s = 1) {
  const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
  // R = Ry * Rx
  M[0] = cy * s; M[1] = 0; M[2] = -sy * s; M[3] = 0;
  M[4] = sy * sx * s; M[5] = cx * s; M[6] = cy * sx * s; M[7] = 0;
  M[8] = sy * cx * s; M[9] = -sx * s; M[10] = cy * cx * s; M[11] = 0;
  M[12] = x; M[13] = y; M[14] = z; M[15] = 1;
  return M;
}

/**
 * @param {{ renderer?: any, lite?: boolean }} [deps] `lite` the phones' tier (ui/touchDevice.js - the Hour's own:
 *   scenes/sdHang.js)
 */
export function createEgGroundLook({ renderer = null, lite = isTouchDevice() } = {}) {
  const IDENT = identity();
  /** @type {Array<{ h: number, x0: number, gpu: any, draw: any }>} */
  let ruins = [];
  /** The circle's halls: each one's origin along the level and its course's middle (the wreck's anchor). */
  let halls = /** @type {Array<{ x0: number, zc: number }>} */ ([]);
  /** @type {{ band: number, parts: Array<{ gpu: any, draw: any, at: number[], spin: number, tilt: number, scale: number }> } | null} */
  let vista = null;
  const make = (model) => {
    if (!model || !renderer?.createMesh) return null;
    try { return renderer.createMesh(model); } catch (e) { console.warn('[eg] the ruin would not build', e?.message ?? e); return null; }
  };
  const free = (gpu) => { if (gpu) { try { renderer?.destroyMesh?.(gpu); } catch { /* gone */ } } };
  const drawOf = (gpu, matrix) => (gpu ? { gpu, object: { matrix }, noShadow: true, hidden: false } : null);
  function dropVista() {
    for (const p of vista?.parts ?? []) free(p.gpu);
    vista = null;
  }
  /** Band `band`'s wreck held - `built` the swap's worker's (world/egVista.js buildEgVista's), else made here. */
  function vistaFor(band, built = null) {
    if (vista?.band === band) return;
    dropVista();
    let v = built && built.band === band ? built : null;
    if (!v) { try { v = buildEgVista(band, { lite }); } catch (e) { console.warn('[eg] the wreck would not build', e?.message ?? e); v = null; } }
    const parts = [];
    for (const w of v?.wings ?? []) { const gpu = make(w.model); if (gpu) parts.push({ gpu, draw: drawOf(gpu, identity()), at: w.at, spin: w.spin ?? 0, tilt: w.tilt ?? 0, scale: 1 }); }
    if (v?.under) { const gpu = make(v.under.model); if (gpu) parts.push({ gpu, draw: drawOf(gpu, identity()), at: v.under.at, spin: 0, tilt: 0, scale: v.under.scale ?? 1 }); }
    vista = { band, parts };
  }
  const api = {
    lite,
    /** Circle `c` stood: its halls' ruins (`built` the swap's worker's parts.ruins, else built here) and its band's wreck
     *  (`vistaBuilt` the worker's parts.vista, else made here when the band is new). Answers every draw to lay in the level. */
    stand(seed, c, geo = 0, built = null, vistaBuilt = null) {
      halls = egCircleSpecs(seed, c, geo).map((s) => ({ x0: s.x0, zc: (s.len ?? 80) / 2 }));
      let parts = built;
      if (!Array.isArray(parts)) { try { parts = buildEgRuinParts(seed, c, geo, { lite }); } catch (e) { console.warn('[eg] the ruin would not build', e?.message ?? e); parts = []; } }
      ruins = [];
      for (const p of parts) { const gpu = make(p.model); if (gpu) ruins.push({ h: p.h, x0: p.x0, gpu, draw: drawOf(gpu, IDENT) }); }
      vistaFor(egBandOfCircle(c), vistaBuilt);
      return api.draws();
    },
    /** Every draw it holds (the ruin's, then the wreck's). */
    draws() { return [...ruins.map((r) => r.draw), ...(vista?.parts ?? []).map((p) => p.draw)].filter(Boolean); },
    /** A frame: the ruin of the hall `eye` (the dungeon's frame) stands in drawn, the others hidden; the wreck placed about
     *  that hall and each wing turned on the shared clock `seconds`. */
    frame(eye, seconds = 0) {
      if (!eye || !halls.length) return;
      const ex = eye[0] - SD_REALM_ORIGIN[0];
      let at = halls[0];
      for (const hl of halls) if (Math.abs(hl.x0 - ex) < Math.abs(at.x0 - ex)) at = hl;
      for (const r of ruins) if (r.draw) r.draw.hidden = Math.abs(r.x0 - at.x0) > EG_HALL_PITCH / 2;
      const [ax, ay, az] = realmToDungeon(at.x0, 0, at.zc);
      for (const p of vista?.parts ?? []) place(p.draw.object.matrix, ax + p.at[0], ay + p.at[1], az + p.at[2], p.spin * seconds, p.tilt, p.scale);
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
    release() { for (const r of ruins) free(r.gpu); ruins = []; halls = []; dropVista(); },
    /** What it holds (tests, stats). */
    stats: () => ({ ruins: ruins.length, drawn: ruins.filter((r) => r.draw && !r.draw.hidden).length, band: vista?.band ?? -1, wreck: vista?.parts.length ?? 0 }),
  };
  return api;
}

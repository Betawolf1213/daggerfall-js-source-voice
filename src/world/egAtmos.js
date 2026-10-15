// @ts-check
// EG-LOOK (2026-10-15, Mac: "Literally everything, and no band aids"; bible/11-Multiplayer/Elite-Gates-Look.md section 7):
// THE SPIRE'S AIR AND LIGHT, A BAND AT A TIME - every band breathed the Hour's one brown haze under one orange up-light
// (world/egHall.js's EG_HALL_FOG and its trilight, before). Each band is now its own realm's air: the Deadlands' ash over
// the fire-sea in the Galleries, the Ideal Masters' violet mist in the Soul Cairn, Nocturnal's near-black dusk under a
// silver moon in the Shade, the Wellhead's smoke over its magma. A row a band:
//   fog     the made level's haze (applyFog's shape: exp, its density and colour) - the far wings melt into it
//   tri     the dungeon trilight (sky, equator, ground): the ground term is the realm's light from below
//   key     the moonlight slot's key (direction toward the light, colour, scale): the Spire's lost sky, the moon's bearing
//   grade   the lane's grade (render/renderer.js setSceneGrade - world/sdLook.js SD_HOUR_GRADE's shape)
//   lamp    a lamp's tint (the band's fixtures' flame - the ruin's one emissive)
//   motes   THE AIR's colours (render/egMotes.js): `lo` the cool end, `hi` the hot end, `rise` up or down (+1 rises)
//   sky     the band's sky painter's own colours (render/egSkyMap.js): its zenith, horizon, deep and glow
// Telegraphs, edge lines and white hazards keep their fog floor under every band's fog (Elite-Gates.md section 25.6) -
// nothing here touches them.
//
// Pure: no DOM, no GL (the swap's worker reads the lamps' tint). Not a DFU member. Ledger A (ELITE-GATES).

const f3 = (a, b, c) => Object.freeze([a, b, c]);
const unit = (x, y, z) => { const n = Math.hypot(x, y, z); return f3(x / n, y / n, z / n); };

/** THE BANDS' AIR, by band index (0 the Broken Galleries, 1 the Soul Cairn, 2 the Shade Perilous, 3 the Havoc Wellhead). */
export const EG_ATMOS = Object.freeze([
  Object.freeze({   // the Broken Galleries - the academy's upper halls over the Deadlands' fire-sea
    fog: Object.freeze({ mode: 'exp', density: 0.005, color: f3(0.16, 0.05, 0.03) }),
    tri: Object.freeze({ sky: f3(0.15, 0.14, 0.17), equator: f3(0.15, 0.09, 0.07), ground: f3(0.42, 0.15, 0.05) }),
    key: Object.freeze({ scale: 0.75, dir: unit(0.2, 0.75, 0.6), color: f3(0.9, 0.9, 0.95) }),
    grade: Object.freeze({ adaptKey: 0.12, adaptMax: 1.15, bloom: 0.8, vignette: 0.34, contrast: 1.08 }),
    lamp: f3(1.0, 0.76, 0.4),
    motes: Object.freeze({ lo: f3(0.5, 0.42, 0.4), hi: f3(1.0, 0.5, 0.16), rise: 1 }),
    sky: Object.freeze({ zenith: f3(0.07, 0.015, 0.01), horizon: f3(0.32, 0.07, 0.03), deep: f3(0.55, 0.14, 0.03), glow: f3(1.0, 0.42, 0.1) }),
  }),
  Object.freeze({   // the Soul Cairn - the Ideal Masters' realm of the dead, a sea of mist
    fog: Object.freeze({ mode: 'exp', density: 0.0075, color: f3(0.1, 0.09, 0.14) }),
    tri: Object.freeze({ sky: f3(0.12, 0.12, 0.17), equator: f3(0.1, 0.09, 0.13), ground: f3(0.17, 0.15, 0.24) }),
    key: Object.freeze({ scale: 0.5, dir: unit(-0.3, 0.8, 0.4), color: f3(0.72, 0.8, 0.95) }),
    grade: Object.freeze({ adaptKey: 0.12, adaptMax: 1.15, bloom: 0.85, vignette: 0.38, contrast: 1.06 }),
    lamp: f3(0.55, 0.85, 1.0),
    motes: Object.freeze({ lo: f3(0.4, 0.55, 0.7), hi: f3(0.7, 0.95, 1.0), rise: 1 }),
    sky: Object.freeze({ zenith: f3(0.03, 0.02, 0.06), horizon: f3(0.15, 0.13, 0.22), deep: f3(0.32, 0.3, 0.42), glow: f3(0.6, 0.9, 1.0) }),
  }),
  Object.freeze({   // the Shade Perilous - Nocturnal's dusk under a great moon
    fog: Object.freeze({ mode: 'exp', density: 0.006, color: f3(0.015, 0.018, 0.03) }),
    tri: Object.freeze({ sky: f3(0.08, 0.09, 0.13), equator: f3(0.05, 0.055, 0.075), ground: f3(0.03, 0.03, 0.045) }),
    key: Object.freeze({ scale: 0.95, dir: unit(-0.55, 0.45, 0.7), color: f3(0.72, 0.78, 0.95) }),
    grade: Object.freeze({ adaptKey: 0.11, adaptMax: 1.25, bloom: 0.75, vignette: 0.42, contrast: 1.12 }),
    lamp: f3(0.78, 0.84, 1.0),
    motes: Object.freeze({ lo: f3(0.45, 0.5, 0.6), hi: f3(0.85, 0.9, 1.0), rise: -1 }),
    sky: Object.freeze({ zenith: f3(0.005, 0.006, 0.014), horizon: f3(0.03, 0.035, 0.06), deep: f3(0.01, 0.012, 0.02), glow: f3(0.85, 0.9, 1.0) }),
  }),
  Object.freeze({   // the Havoc Wellhead - the muster-ground over the magma
    fog: Object.freeze({ mode: 'exp', density: 0.009, color: f3(0.14, 0.05, 0.02) }),
    tri: Object.freeze({ sky: f3(0.12, 0.08, 0.07), equator: f3(0.16, 0.08, 0.05), ground: f3(0.5, 0.16, 0.04) }),
    key: Object.freeze({ scale: 0.45, dir: unit(0.4, 0.7, -0.5), color: f3(0.95, 0.72, 0.55) }),
    grade: Object.freeze({ adaptKey: 0.12, adaptMax: 1.1, bloom: 0.9, vignette: 0.4, contrast: 1.1 }),
    lamp: f3(1.0, 0.52, 0.18),
    motes: Object.freeze({ lo: f3(0.35, 0.3, 0.28), hi: f3(1.0, 0.55, 0.15), rise: 1 }),
    sky: Object.freeze({ zenith: f3(0.06, 0.02, 0.012), horizon: f3(0.35, 0.1, 0.03), deep: f3(0.65, 0.18, 0.03), glow: f3(1.0, 0.5, 0.12) }),
  }),
]);

/** Band `band`'s air (clamped to 0-3). */
export const egAtmosOf = (band) => EG_ATMOS[Math.max(0, Math.min(3, band | 0))];

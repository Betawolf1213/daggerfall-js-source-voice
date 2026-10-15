// @ts-check
// EG-G2 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md section 25 - EG16): THE SPIRE'S
// LOOK ON THIS SCREEN - the passes world/egLook.js's law draws by, held for the breach and fed a circle at a time:
//   THE SKY        render/egSkyPass.js - the band's void and the Spire's underside, after the halls' solid geometry and
//                  before their flats (the host's sky slot - scenes/worldModes.js, where the Hour's sky stood);
//   THE MIST       render/egMistPass.js - a Mist Stair's and the Sinking Stair's surges, UNDER the telegraphs and the
//                  lines (section 25.6: they draw after every transparent volume);
//   THE LINES      render/egLinePass.js - THE EDGE LINE, the tracks and the Gust's streamers, OVER everything the hall's
//                  fight draws, so the gold that says "it holds" is the last thing laid on the floor;
//   THE LIGHTS     render/egLightPass.js (EG-ZE, sections 7, 16.2, 16.5 and 27.5) - the door's beam and the closing's
//                  ring, the Redoubt's beacon, the recall's and the pings' blue pillars, the witness's marks
//                  (world/egLights.js egSpireLights), added over the lines: light, never paint.
// Each pass is built the first time it is wanted and kept for the breach; a circle's edges are made once a circle (its
// static buffer), its streamers and mist sheets written a frame into kept arrays (AUDIT EG V L6-4: the mist's too - it made
// a new list of new sheets a frame). `release()` frees all of it - every exit
// of the breach reaches it through the client's leave (scenes/egClient.js). No GL, no draw: every method answers false.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { egCircleSpecs, egBandOfCircle } from '../net/egLaw.js';
import { egCircleEdges, egGustSections, egStreamersAt, egMistSheets, egMistSheetsAt, EG_MIST } from '../world/egLook.js';
import { EgLinePass, EG_STREAMERS_MAX } from '../render/egLinePass.js';
import { EgMistPass } from '../render/egMistPass.js';
import { EgSkyPass } from '../render/egSkyPass.js';
import { EgLightPass } from '../render/egLightPass.js';   // EG-ZE: THE SPIRE'S LIGHTS

/**
 * @param {{ gl?: WebGL2RenderingContext | null }} deps
 */
export function createEgLookDraw({ gl = null } = {}) {
  /** @type {EgLinePass|null} */ let lines = null;
  /** @type {EgMistPass|null} */ let mist = null;
  /** @type {EgSkyPass|null} */ let sky = null;
  /** @type {EgLightPass|null} */ let lights = null;   // EG-ZE
  const tried = { lines: false, mist: false, sky: false, lights: false };
  let key = '', band = 0, sections = [], sheets = [], edgeCount = 0, trackCount = 0;
  /** AUDIT EG V (L3-7): the five halls the circle's look was made from (net/egLaw.js egCircleSpecs - each its own object) */
  let made = /** @type {any[]} */ ([]);
  const streamers = new Float32Array(EG_STREAMERS_MAX * 6), alphas = new Float32Array(EG_STREAMERS_MAX), sheetsAt = [];
  const build = (name, make) => {
    if (tried[name] || !gl) return null;
    tried[name] = true;
    try { return make(); } catch (e) { console.warn(`[eg] the ${name} would not build`, e?.message ?? e); return null; }
  };
  return {
    /** The circle the screen stands in (its seed, number and span decrees): its edges made once, its streamers' and mist's
     *  places kept. Answers whether it changed. AUDIT EG V (L3-7; section 22, THE LAW PIN): made again when its halls are no
     *  longer the ones it was made from - a breach of another law's halls, given by the room after my own law drew the circle
     *  (net/egLaw.js egSpecGive: egHallOf answers the given hall from then), so THE EDGE LINE, the Gust's streamers and the
     *  mist stand where the breach's own platforms do. */
    setCircle(seed, c, geo = 0) {
      const k = `${seed >>> 0}:${c}:${geo | 0}`, specs = egCircleSpecs(seed, c, geo);
      if (k === key && specs.every((s, j) => s === made[j])) return false;
      key = k; band = egBandOfCircle(c); made = specs;
      const edges = egCircleEdges(seed, c, geo);
      sections = egGustSections(specs); sheets = egMistSheets(specs);
      edgeCount = edges.edge.length / 6; trackCount = edges.track.length / 6;
      lines ??= build('lines', () => (gl ? new EgLinePass(gl) : null));
      lines?.setCircle(edges);
      return true;
    },
    /** THE SKY: the band's, the Spire's underside in it (`gain` the realm's light against its fog). */
    drawSky(proj, view, seconds, fog = null, gain = 1) {
      if (!key) return false;
      sky ??= build('sky', () => (gl ? new EgSkyPass(gl) : null));
      return !!sky?.draw(proj, view, band, seconds, fog, gain);
    },
    /** THE MIST, before the telegraphs and the lines: each sheet at its surge's line on the shared clock `ts` (s). */
    drawUnder(proj, view, eye, ts, fog = null) {
      if (!key || !sheets.length) return false;
      const at = egMistSheetsAt(sheets, ts, sheetsAt);   // AUDIT EG V (L6-4): written into its kept list
      if (!at.length) return false;
      mist ??= build('mist', () => (gl ? new EgMistPass(gl) : null));
      return !!mist?.draw(proj, view, eye, at, EG_MIST.color, ts, fog);
    },
    /** THE LINES, last: the circle's edges and tracks, and the Gust's streamers on the shared clock `ts` (s). AUDIT EG III
     *  (lane4 #5): `pal` the danger palette they are drawn in (render/egLinePass.js palette). AUDIT EG V (L6-3): `vp` the
     *  world image's rect in pixels (the renderer's `_worldViewportPx` - Retro Picture Mode's 320x200 or 640x400; null: the
     *  canvas's) - the line's two pixels are the image's, as the spans' ghosts drawn in the same pass are (scenes/egSpan.js
     *  drawPass). */
    drawOver(proj, view, eye, ts, fog = null, pal = null, vp = null) {
      if (!key || !lines) return false;
      lines.palette(pal);
      const n = sections.length ? egStreamersAt(sections, ts, streamers, alphas) : 0;
      return lines.draw(proj, view, eye, ts, fog, streamers, n, alphas, vp?.[2] ?? 0, vp?.[3] ?? 0);
    },
    /** EG-ZE: THE LIGHTS, after the lines: `list` world/egLights.js egSpireLights's answer for this frame, `still` reduced
     *  motion. The pass is built the first time a light stands. */
    drawLights(proj, view, eye, ts, fog = null, list = null, still = false) {
      if (!key || !list?.length) return false;
      lights ??= build('lights', () => (gl ? new EgLightPass(gl) : null));
      return !!lights?.draw(proj, view, eye, ts, fog, list, still);
    },
    /** EG-ZE: the lights' pass as it stands (tests, stats): built, and how many vertices it drew last. */
    lightState: () => ({ pass: !!lights, drawn: lights?.drawn ?? 0 }),
    /** What the look holds (tests, stats). */
    state: () => ({ key, band, edges: edgeCount, tracks: trackCount, gusts: sections.length, mists: sheets.length, passes: { lines: !!lines, mist: !!mist, sky: !!sky } }),
    /** Out of the breach: every pass freed. */
    release() {
      for (const p of [lines, mist, sky, lights]) { if (p) { try { p.destroy(); } catch { /* gone */ } } }
      lines = null; mist = null; sky = null; lights = null;
      tried.lines = false; tried.mist = false; tried.sky = false; tried.lights = false;
      key = ''; sections = []; sheets = []; made = [];
    },
  };
}

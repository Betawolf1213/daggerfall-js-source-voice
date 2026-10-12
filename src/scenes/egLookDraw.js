// @ts-check
// EG-G2 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md section 25 - EG16): THE SPIRE'S
// LOOK ON THIS SCREEN - the passes world/egLook.js's law draws by, held for the breach and fed a circle at a time:
//   THE SKY        render/egSkyPass.js - the band's void and the Spire's underside, after the halls' solid geometry and
//                  before their flats (the host's sky slot - scenes/worldModes.js, where the Hour's sky stood);
//   THE MIST       render/egMistPass.js - a Mist Stair's and the Sinking Stair's surges, UNDER the telegraphs and the
//                  lines (section 25.6: they draw after every transparent volume);
//   THE LINES      render/egLinePass.js - THE EDGE LINE, the tracks and the Gust's streamers, OVER everything the hall's
//                  fight draws, so the gold that says "it holds" is the last thing laid on the floor.
// Each pass is built the first time it is wanted and kept for the breach; a circle's edges are made once a circle (its
// static buffer), its streamers and mist sheets written a frame into kept arrays. `release()` frees all of it - every exit
// of the breach reaches it through the client's leave (scenes/egClient.js). No GL, no draw: every method answers false.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { egCircleSpecs, egBandOfCircle } from '../net/egLaw.js';
import { egCircleEdges, egGustSections, egStreamersAt, egMistSheets, egMistSheetsAt, EG_MIST } from '../world/egLook.js';
import { EgLinePass, EG_STREAMERS_MAX } from '../render/egLinePass.js';
import { EgMistPass } from '../render/egMistPass.js';
import { EgSkyPass } from '../render/egSkyPass.js';

/**
 * @param {{ gl?: WebGL2RenderingContext | null }} deps
 */
export function createEgLookDraw({ gl = null } = {}) {
  /** @type {EgLinePass|null} */ let lines = null;
  /** @type {EgMistPass|null} */ let mist = null;
  /** @type {EgSkyPass|null} */ let sky = null;
  const tried = { lines: false, mist: false, sky: false };
  let key = '', band = 0, sections = [], sheets = [], edgeCount = 0, trackCount = 0;
  const streamers = new Float32Array(EG_STREAMERS_MAX * 6), alphas = new Float32Array(EG_STREAMERS_MAX);
  const build = (name, make) => {
    if (tried[name] || !gl) return null;
    tried[name] = true;
    try { return make(); } catch (e) { console.warn(`[eg] the ${name} would not build`, e?.message ?? e); return null; }
  };
  return {
    /** The circle the screen stands in (its seed, number and span decrees): its edges made once, its streamers' and mist's
     *  places kept. Answers whether it changed. */
    setCircle(seed, c, geo = 0) {
      const k = `${seed >>> 0}:${c}:${geo | 0}`;
      if (k === key) return false;
      key = k; band = egBandOfCircle(c);
      const specs = egCircleSpecs(seed, c, geo), edges = egCircleEdges(seed, c, geo);
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
      const at = egMistSheetsAt(sheets, ts);
      if (!at.length) return false;
      mist ??= build('mist', () => (gl ? new EgMistPass(gl) : null));
      return !!mist?.draw(proj, view, eye, at, EG_MIST.color, ts, fog);
    },
    /** THE LINES, last: the circle's edges and tracks, and the Gust's streamers on the shared clock `ts` (s). */
    drawOver(proj, view, eye, ts, fog = null) {
      if (!key || !lines) return false;
      const n = sections.length ? egStreamersAt(sections, ts, streamers, alphas) : 0;
      return lines.draw(proj, view, eye, ts, fog, streamers, n, alphas);
    },
    /** What the look holds (tests, stats). */
    state: () => ({ key, band, edges: edgeCount, tracks: trackCount, gusts: sections.length, mists: sheets.length, passes: { lines: !!lines, mist: !!mist, sky: !!sky } }),
    /** Out of the breach: every pass freed. */
    release() {
      for (const p of [lines, mist, sky]) { if (p) { try { p.destroy(); } catch { /* gone */ } } }
      lines = null; mist = null; sky = null;
      tried.lines = false; tried.mist = false; tried.sky = false;
      key = ''; sections = []; sheets = [];
    },
  };
}

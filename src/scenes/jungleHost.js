// @ts-check
// ═══════════════════════════════════════════════════════════════════
// BANTHA1 (bible/03-World/Bantha-Jungle.md): THE JUNGLE'S HOST - Bantha's jungle in the streamed world, a module the
// world host wires (HOST-SPLIT, bible/01-Overview/Host-Split.md: scenes/fishHost.js is the shape) and never grows
// into bootWorld. It owns:
//   - THE FIELD: where the jungle is (world/jungle/jungleRegion.js), built from the map the first time it is asked;
//   - THE JOB: the terrain kernel's jungle for a pixel (`job` - its 3x3 of distances; world/terrain/jungleNature.js
//     lays the trees on the worker);
//   - THE TREES' DOOR (systems/jungleTreesAssets.js - Low Poly Trees' own, the owner's trees);
//   - THE HAZE: each exterior frame's (`haze`) - its share at the eye, its density by the hour, the weather and the
//     drifting banks, its floor over the ground, eased; the renderer's uniforms, the sky's, and the frame's one fog
//     colour (world/jungle/jungleHaze.js) - and what it hides (`hides`, the world host's pixel cull and the far ring's).
// The four hosts: scenes/world.js WIRED - the streamed world, the one host that stands terrain nature; and
// scenes/exterior.js (the fixed city), scenes/worldModes.js (interiors), scenes/dungeonContext.js (dungeons) - FLAGGED: none stands the wilderness the jungle grows in
// (a fixed city's flats are its location's, an interior and a dungeon stand none), and each beginFrame of theirs clears
// the haze (render/renderer.js setJungleHaze - a frame's, armed by the exterior frame alone).
// ═══════════════════════════════════════════════════════════════════
import { jungleFieldOf, jungleNine, jungleDepthAt } from '../world/jungle/jungleRegion.js';
import { TERRAIN_SIZE as PIXEL_M } from '../world/terrain/terrainSampler.js';   // a map pixel (m)
import { createJungleTrees } from '../systems/jungleTreesAssets.js';
import {
  JUNGLE_HAZE, hazeShare, hazeDayFactor, hazeWeatherFactor, hazeDrift, createHazeState, stepHaze, hazeUniforms, fogColorWith,
  hazeSkyUniform, hazeHides,
} from '../world/jungle/jungleHaze.js';
import { fogFactor } from '../world/weather.js';

/**
 * @param {{ renderer: any, maps: any, mapWidth: number, mapHeight: number, stateOf: () => any, builtOf: () => Map<string, any>,
 *   heightAt: (x: number, z: number) => number, breathe?: () => Promise<void>, haze?: boolean, trees?: any }} deps
 *   `stateOf()` the stream's state (StreamingWorldState: mapOrigin, compensation, pixelTranslation) and `builtOf()` its
 *   pixels - asked, never held: the world host builds this before its stream; `heightAt` the ground at a scene point; `haze` false - the jungle stands, its air stays clear (`?junglehaze=off`);
 *   `trees` a door to use in place of the owner's (a test's)
 */
export function createJungleHost({ renderer, maps, mapWidth, mapHeight, stateOf, builtOf, heightAt, breathe, haze = true, trees = null }) {
  const door = trees ?? createJungleTrees({ renderer, breathe });
  let field = null;
  const fieldNow = () => (field ??= jungleFieldOf(maps, mapWidth, mapHeight));
  const hs = createHazeState();
  const u = new Float32Array(8), skyU = new Float32Array(4), colour = new Float32Array(3);
  const _t = [0, 0, 0], _eye = [0, 0, 0];
  let clock = 0;
  /** the weather fog's own factor at a distance this frame (world/weather.js fogFactor) - the cull's second medium */
  let weatherAt = null;
  /** the pixel a scene point stands in and where in it (m, x east and z north - the layout's frame) */
  const where = (x, z) => {
    const state = stateOf(), c = state.compensation, S = PIXEL_M;
    const px = state.mapOrigin.x + Math.floor((x - c[0]) / S), py = state.mapOrigin.y - Math.floor((z - c[2]) / S);
    const t = state.pixelTranslation(px, py, _t);
    return { px, py, lx: x - t[0], lz: z - t[2] };
  };
  /** the haze's floor's ground under a scene point: the ground there, or the land about it (its 3x3 of pixels' middles)
   *  where that is lower - a summit stands over the haze, a valley in it */
  const groundUnder = (x, z, px, py) => {
    const here = heightAt(x, z), state = stateOf(), built = builtOf();
    let sum = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const p = built.get(`${px + dx},${py + dy}`);
        if (!p || !Number.isFinite(p.centerHeight)) continue;
        sum += p.centerHeight + state.pixelTranslation(p.px, p.py, _t)[1];
        n++;
      }
    }
    return Number.isFinite(here) ? (n ? Math.min(here, sum / n) : here) : (n ? sum / n : 0);
  };
  return {
    door,
    /** THE TERRAIN JOB'S JUNGLE for a pixel - `{ nine, hidden }` (its 3x3 of distances, and whether its location is a
     *  place the woods hide), or null where the jungle cannot reach. */
    job(px, py, hidden = false) {
      const nine = jungleNine(fieldNow(), px, py);
      return nine ? { nine, hidden: !!hidden } : null;
    },
    /** How deep in the jungle a scene point stands (m, negative outside; -Infinity far from it). */
    depthAt(x, z) {
      const w = where(x, z);
      const nine = jungleNine(fieldNow(), w.px, w.py);
      return nine ? jungleDepthAt(w.px, w.py, nine, w.lx, w.lz) : -Infinity;
    },
    /**
     * THE FRAME'S HAZE, before the fog is set: eased toward the eye's share, density and floor; handed to the renderer
     * (setJungleHaze) and the sky (`sky.setHazeSky`); answers the frame's one fog colour - the weather's (`fogColor`, its row
     * `fogRow`) weighed with the haze's. `eye` the scene eye the fog is measured from (the travel view's focus where the
     * renderer holds one); `minute` of the day; `weather` its WEATHER_TYPES name; `wind` [x, z] (unit) or null.
     * @param {{ fogColor: Float32Array, fogRow: any, eye: ArrayLike<number>, dt: number, minute: number, weather: string,
     *   wind?: ArrayLike<number>|null, sky?: any }} f
     */
    haze({ fogColor, fogRow, eye, dt, minute, weather, wind = null, sky = null }) {
      weatherAt = fogRow ? (d) => fogFactor(fogRow, d) : null;
      const focus = renderer._focus?.[3] > 0.5 ? renderer._focus : eye;
      _eye[0] = focus[0]; _eye[1] = focus[1]; _eye[2] = focus[2];
      if (!haze) { renderer.setJungleHaze(null); sky?.setHazeSky?.(null); return fogColor; }
      clock += Math.max(0, Math.min(dt, 1));
      const w = where(_eye[0], _eye[2]);
      const nine = jungleNine(fieldNow(), w.px, w.py);
      const share = nine ? hazeShare(jungleDepthAt(w.px, w.py, nine, w.lx, w.lz)) : 0;
      if (share <= 0 && hs.share < 1e-4) {   // nowhere near the jungle: nothing to ease, nothing to send
        hs.share = 0; hs.primed = false;
        renderer.setJungleHaze(null); sky?.setHazeSky?.(null);
        return fogColor;
      }
      const density = JUNGLE_HAZE.density * hazeDayFactor(minute / 60) * hazeWeatherFactor(weather)
        * hazeDrift(w.px * PIXEL_M + w.lx, -w.py * PIXEL_M + w.lz, clock, wind);
      stepHaze(hs, { dt, eye: _eye, share, density, floor: groundUnder(_eye[0], _eye[2], w.px, w.py) + JUNGLE_HAZE.layer });
      hazeUniforms(hs, u);
      renderer.setJungleHaze(u[4] ? u : null);
      fogColorWith(fogColor, fogRow, u, _eye[1], colour);
      sky?.setHazeSky?.(u[4] ? hazeSkyUniform(colour, u, _eye[1], skyU) : null);
      return u[4] ? colour : fogColor;
    },
    /** WHETHER THE HAZE HIDES a box this frame - pixel-local `box` ([x0, y0, z0, x1, y1, z1]) at its translation `t`:
     *  every point of it sends less than JUNGLE_HAZE.cull of its light through the haze and the weather's fog together. */
    hides(box, t) {
      if (!(u[4] >= 0.5) || !box) return false;
      return hazeHides(u, _eye, box, t, weatherAt);
    },
    /** The haze's uniforms as last sent (render/hazeGlsl.js uHaze) and its eye - the far ring's. */
    get uniforms() { return u; },
    get eye() { return _eye; },
    /** For the tests and the probes. */
    get _state() { return hs; },
  };
}

// OW-TOWN-WALK (2026-10-19, the owner: "When in a town, slow down overworld navigation and have it navigate properly on
// town pathways instead of bumping into buildings"; bible/06-Systems/Travel-View.md OW-TOWN-WALK): THE TOWN THE
// TRAVELLER STANDS IN, AND ITS WAY - the streaming host's half of systems/travel/townWalk.js. A town's grid is the one
// its townsfolk walk (scenes/pixelBuild.js builds a CityNavigation for every populated place - DFU's seven location
// types - and keeps it on the pixel's `population`), in the LOCATION frame: from the location's origin (`locOrigin`,
// pixel-local), carried into the scene by the pixel's live translation. Travel Options speaks the world's natives, so
// this turns a native point into a grid cell and a way's cells back into natives, and answers:
//   - townKey(native): the town's pixel key where the point stands inside its grid, else null (a farm's, a temple's,
//     a tavern's, a city's - every place with townsfolk; no dungeon's ruin, no wilderness);
//   - townWay(from, to): the way from `from` to the street nearest `to` (or the town's edge toward it), as natives -
//     the traveller's own cell left out - or null; `shut` when it ends short behind a gate shut for the night.
// THE JOURNEY'S GRID is the town's with each OPEN city gate's passage carved through it (systems/travel/townWalk.js
// gatePassage, carveNav): the pixel's own gates (`cityGates`, DaggerfallCityGate's placements the build keeps, each its
// model open or closed as the frame's tick left it - world/city/cityGate.js), at their model's middle on the grid. Kept
// a town and its gates' state (JOURNEY_GRIDS_MAX of them), so a gate swung at dusk makes its town's grid again.
// The streaming host constructs it (scenes/world.js); the other three hosts stream no pixels and walk no journey
// through a town: scenes/exterior.js (the fixed city - no Travel Options journey crosses it), scenes/worldModes.js (a
// building) and scenes/dungeonContext.js (a dungeon).
import { townWayCells, gatePassage, carveNav } from '../systems/travel/townWalk.js';
import { worldCoordToMapPixel } from '../formats/mapsFile.js';
import { CITY_GATE_OPEN_MODEL_ID } from '../world/rmbLayout.js';

/** A way's first cell this near the traveller (cells) is where they stand - left out, so the walk does not turn back to
 *  its own cell's middle. */
export const TOWN_WAY_OWN_CELLS = 2;
/** How many towns' journey grids are kept at once (a walled city's is a copy of its grid, 256 KB at the greatest). */
export const JOURNEY_GRIDS_MAX = 4;

/** @param {{ built: Map<string, any>, state: any }} host */
export function createTownWalk(host) {
  const { built, state } = host;
  const grids = new Map();   // pixel key -> { base, sig, nav, shut }
  /** The town at a native point: its pixel's key, grid, origin and translation, and the point's cell - or null. */
  function townAt(n) {
    const px = worldCoordToMapPixel(n.x, n.z);
    const key = `${px.x},${px.y}`;
    const b = built.get(key);
    const nav = b?.population?.nav, o = b?.locOrigin;
    if (!nav || !o) return null;
    const t = state.pixelTranslation(px.x, px.y);
    const [sx, sz] = state.localFromWorld(n.x, n.z);
    const cell = nav.worldToNav(sx - o[0] - t[0], sz - o[2] - t[2]);
    return { key, b, nav, o, t, cell, inside: nav.inBounds(cell[0], cell[1]) };
  }
  /** The town's journey grid: its own with each open gate's passage carved through - and whether any gate is shut. */
  function journeyGrid(town) {
    const gates = (town.b.cityGates ?? []).map((g) => ({ open: g.gate?.modelId === CITY_GATE_OPEN_MODEL_ID, local: g.local }));
    const sig = gates.map((g) => (g.open ? 1 : 0)).join('');
    const kept = grids.get(town.key);
    if (kept && kept.base === town.nav && kept.sig === sig) return kept;
    const passages = gates.filter((g) => g.open && g.local).map((g) => gatePassage(town.nav, town.nav.worldToNav(g.local[12] - town.o[0], g.local[14] - town.o[2]))).filter(Boolean);
    const made = { base: town.nav, sig, nav: carveNav(town.nav, passages), shut: gates.some((g) => !g.open) };
    grids.delete(town.key);
    grids.set(town.key, made);
    if (grids.size > JOURNEY_GRIDS_MAX) grids.delete(grids.keys().next().value);
    return made;
  }
  /** A cell of a town's grid as the world's natives (its middle). */
  function nativeOf(town, c) {
    const [lx, lz] = town.nav.navToWorld(c[0], c[1]);
    const w = state.worldCoords([lx + town.o[0] + town.t[0], 0, lz + town.o[2] + town.t[2]]);
    return { x: w.x, z: w.z };
  }
  return {
    townKey(n) {
      const town = townAt(n);
      return town?.inside ? town.key : null;
    },
    townWay(from, to) {
      const town = townAt(from);
      if (!town?.inside) return null;
      const t = state.localFromWorld(to.x, to.z);
      const toCell = town.nav.worldToNav(t[0] - town.o[0] - town.t[0], t[1] - town.o[2] - town.t[2]);
      const grid = journeyGrid(town);
      const way = townWayCells(grid.nav, town.cell, toCell);
      if (!way || !way.reached) return grid.shut ? { pts: [], inside: !!way?.inside, shut: true } : way ? { pts: [], inside: way.inside, shut: false } : null;   // short of its point: behind a shut gate, said; else the leg walks as it would
      const cells = way.cells.slice();
      if (cells.length && Math.max(Math.abs(cells[0][0] - town.cell[0]), Math.abs(cells[0][1] - town.cell[1])) <= TOWN_WAY_OWN_CELLS) cells.shift();
      return { pts: cells.map((c) => nativeOf(town, c)), inside: way.inside, shut: false };
    },
  };
}

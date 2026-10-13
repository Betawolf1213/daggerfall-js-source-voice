// @ts-check
// KG3 (2026-10-13, bible/11-Multiplayer/Kings-Gambit.md sections 5.3 and 16): THE KING'S GAMBIT'S BOARD ON THE CLOTH -
// where its cells lie on a tavern card table's felt, pure (no renderer, no page): the board's lay, a cell's centre, the
// cell under a point of the table, and the way each side's cards face.
//
// THE LAY (5.3, AUDIT KG C1): along the table's own axes, square to the felt's edges, as Hold'em's board lies
// (world/cardTables.js tableFrame's axisYaw), its foot - the host's king's row - at the edge nearest the host's chair.
// From a long side the columns run along the table and the rows across it: KG_ROWS across the felt's short side, 7.08 cm
// cells, a board 1.06 by 0.92 m. From an end the columns run across and the rows along: KG_COLS across the short side,
// 6.13 cm cells. Column 0 is on the host's left as the host faces the board (the mod drew it on the screen's left).
// NOT CHOSEN: Iliac Hand's lay, square to the line to seat 0's chair (world/iliacCloth.js), which lies askew on the felt
// from a long side's chair.
//
// Not a DFU member: Daggerfall Unity has no such game - the mod does. Ledger A row (THE KING'S GAMBIT).
import { CARD_TABLE_W, CARD_TABLE_D, CARD_TABLE_RAIL } from './cardTableProp.js';
import { KG_COLS, KG_ROWS } from '../net/kingsGambit.js';

/** The felt inside the rail: its long and its short side, in metres. */
export const GAMBIT_FELT_LONG = CARD_TABLE_W - 2 * CARD_TABLE_RAIL;
export const GAMBIT_FELT_SHORT = CARD_TABLE_D - 2 * CARD_TABLE_RAIL;
/** The mat stands this far proud of the felt (5.3: "a mat a few millimetres proud of the felt"), and a piece's card this
 *  far over the mat - each surface its own plane, so none flickers through another. */
export const GAMBIT_MAT_LIFT = 0.003;
export const GAMBIT_CARD_LIFT = 0.0015;

/**
 * THE BOARD ON THIS TABLE for the host in the chair at `hostFeet`: `{end, cell, top, right, toHost, width, depth, at(c,
 * r), cellAt(p), corners}` - `end` whether the host sits at an end, `cell` a cell's side in metres, `top` the mat's
 * height, `right` and `toHost` the columns' and the rows' unit directions on the ground (x, z), `at(c, r)` a cell's
 * centre on the mat, `cellAt(p)` the cell under a point of the table (or null off the board), `corners` the board's four
 * corners on the mat (the host's left foot first, round to the head).
 * @param {{centre: number[], axisYaw: number}} frame  world/cardTables.js tableFrame
 * @param {number[]} hostFeet  the host's feet in their chair
 */
export function gambitPlaces(frame, hostFeet) {
  const along = [Math.sin(frame.axisYaw), Math.cos(frame.axisYaw)];
  const across = [Math.cos(frame.axisYaw), -Math.sin(frame.axisYaw)];
  const dx = hostFeet[0] - frame.centre[0], dz = hostFeet[2] - frame.centre[2];
  const da = dx * along[0] + dz * along[1], dq = dx * across[0] + dz * across[1];
  const end = Math.abs(da) > Math.abs(dq);
  const sign = (/** @type {number} */ v) => (v < 0 ? -1 : 1);
  const toHost = end ? [along[0] * sign(da), along[1] * sign(da)] : [across[0] * sign(dq), across[1] * sign(dq)];
  // the host faces the board, -toHost; the host's right is (fz, -fx) - the world's own handedness (x right, z forward)
  const right = [-toHost[1], toHost[0]];
  const cell = end ? GAMBIT_FELT_SHORT / KG_COLS : GAMBIT_FELT_SHORT / KG_ROWS;
  const top = frame.centre[1] + GAMBIT_MAT_LIFT;
  const cx = frame.centre[0], cz = frame.centre[2];
  const point = (/** @type {number} */ u, /** @type {number} */ v) => [cx + right[0] * u + toHost[0] * v, top, cz + right[1] * u + toHost[1] * v];
  const at = (/** @type {number} */ c, /** @type {number} */ r) => point((c - (KG_COLS - 1) / 2) * cell, (r - (KG_ROWS - 1) / 2) * cell);
  const cellAt = (/** @type {number[]|null} */ p) => {
    if (!p) return null;
    const ux = p[0] - cx, uz = p[2] - cz;
    const c = Math.floor((ux * right[0] + uz * right[1]) / cell + KG_COLS / 2);
    const r = Math.floor((ux * toHost[0] + uz * toHost[1]) / cell + KG_ROWS / 2);
    return c >= 0 && c < KG_COLS && r >= 0 && r < KG_ROWS ? [c, r] : null;
  };
  const w = KG_COLS * cell, d = KG_ROWS * cell;
  const corners = [point(-w / 2, d / 2), point(w / 2, d / 2), point(w / 2, -d / 2), point(-w / 2, -d / 2)];
  return { end, cell, top, right, toHost, width: w, depth: d, at, cellAt, corners };
}

/** The yaw a side's cards lie at on the mat - each side reads its own the right way up, a card's top (the plate's +Z)
 *  away from its owner (Iliac Hand's cloth's way, world/iliacCloth.js): the host's toward the head, the guest's toward
 *  the foot - the side told by the card's turn as well as by the mat's mark under it (14.8: a side never by colour
 *  alone). @param {{toHost: number[]}} places @param {number} side */
export const gambitCardYaw = (places, side) => Math.atan2(places.toHost[0], places.toHost[1]) + (side === 0 ? Math.PI : 0);

// @ts-check
// ═══════════════════════════════════════════════════════════════════
// DECOR-CLEAR (FIELD BUGS 2026-10-19b) — A LATE SOLID NEVER CLOSES ON A BODY.
//
// Two players' private reports: walking into an online home, its furniture
// moved and boxed them in; inside one, talking to its hired trader, a table
// stood round them and held them. Daggerfall Unity lays an interior out
// before the body stands in it - PlayerEnterExit.TransitionInterior runs
// interior.DoLayout ("This needs to be done first", PlayerEnterExit.cs:721)
// and only then sets the player to the landing and SetStanding
// (PlayerEnterExit.cs:794-795) -
// so no solid ever arrives where a body already is. The port's online home
// does not (DECOR1c, our own departure): the room stands as Daggerfall
// furnished it, its owner's pieces are asked of the account service after
// the entry and each is solid only once its model loads, and a piece of the
// room's own put back (BASE-HIDE) is solid again at once - wherever the
// player stands. The collider holds both faces of every triangle
// (player/collider.js), so a body a solid lands round is held by its inner
// walls, and a body under a low one is thrown onto its top.
//
// A LATE SOLID - triangles asked into a collider while a body walks in it -
// goes through this gate. Where it would close on the body
// (lateSolidCloses) it is WITHHELD: its owner still draws it, the collider
// does not hold it, and the body walks out of it as out of air; a settle
// that finds the body clear stands it, solid behind them. Anywhere else it
// stands at once, as it always did. ONE GATE A COLLIDER (lateSolidsOf):
// every late solid of one collider is held and let go by the same gate,
// whichever pool asked, and settled by the per-frame call that holds the
// body (the room's decor draw, scenes/decor/decorRoom.js) - which is how the
// gate knows the body it guards, so the room's own furniture put back
// (scenes/decor/decorBase.js) and any later solid need no body of their own.
//
// The body is the local player's, the one body this client's collider
// moves. Another player in the home walks on their own client, where their
// own gate holds the same piece back from them.
// ═══════════════════════════════════════════════════════════════════

import { Collider, SKIN } from './collider.js';
import { CAPSULE_HEIGHT, CAPSULE_RADIUS } from './motor.js';
import { heldInSolid } from './enterExit.js';
import { localAabb, transformedAabb } from '../render/frustum.js';

/** The probe's one bucket - the late solid's own triangles, alone. */
const PROBE = 'late';
/** capsuleContact's answer, unread (a contact or none is all the law asks). */
const HIT = [0, 0, 0];

/** Whether a box [minX, minY, minZ, maxX, maxY, maxZ] meets the box about a body's capsule (`height` tall from `feet`). */
function boxMeetsBody(b, feet, height) {
  return b[0] <= feet[0] + CAPSULE_RADIUS && b[3] >= feet[0] - CAPSULE_RADIUS && b[1] <= feet[1] + height && b[4] >= feet[1]
    && b[2] <= feet[2] + CAPSULE_RADIUS && b[5] >= feet[2] - CAPSULE_RADIUS;
}

/**
 * DECOR-CLEAR: WHETHER A SOLID WOULD CLOSE ON A BODY - `probe` a Collider holding that solid's triangles alone, `body`
 * `{ pos, height }` (the motor's own: its feet and its capsule's height; CAPSULE_HEIGHT where it names none). Never one
 * whose box misses the capsule's (a piece hung wholly over the head, open beneath, holds nothing - though a line up
 * from the feet crosses its skin once). Else it does when one of its faces stands deeper in the capsule than the
 * resolve's skin (collider.js SKIN: a face the body rests on or leans against stands at the capsule's radius and holds
 * nothing, so a piece stood again under the feet still stands), or when the body's feet or head is inside one of its
 * closed parts (enterExit.js heldInSolid, the collider's parity law - deep in a big piece no face is near). Pure over
 * the probe's queries.
 * @param {Collider} probe @param {{ pos: number[], height?: number }} body
 */
export function lateSolidCloses(probe, body) {
  const height = body.height ?? CAPSULE_HEIGHT;
  const b = probe.bounds();
  if (!b || !boxMeetsBody([...b.min, ...b.max], body.pos, height)) return false;
  return probe.capsuleContact(body.pos, height, -SKIN, null, HIT) !== null || heldInSolid(probe, body.pos, height);
}

/** @typedef {{ pos: number[], height?: number } | null | undefined} LateBody */

/** Each collider's gate, by the collider. @type {WeakMap<object, ReturnType<typeof makeGate>>} */
const GATES = new WeakMap();

/**
 * DECOR-CLEAR: THE ONE GATE a collider's late solids go through - made on the collider's first asking, gone with it
 * (null for no collider). THE BODY IT GUARDS is the one its settle was last handed - the caller that holds the body
 * settles it every frame - so a late solid of any owner needs no body of its own to be held back from it.
 *   add(key, positions, indices, matrix, body) - stand `key`'s triangles (meshReader buffers; `matrix` into the
 *       collider's frame, as addMesh takes them) as a new bucket: at once where the body is clear of them, else
 *       WITHHELD (answers false). `body` left out is the body the gate guards; `null`, or a gate that guards none yet
 *       (a bench, a test, a collider no body has walked), stands it at once, as every solid always stood. A key
 *       withheld already stays withheld, its triangles these (a recentre's move - asked again at the next settle,
 *       with the body where the recentre put it).
 *   remove(key) - the key's bucket taken down, and its withheld triangles forgotten.
 *   settle(body) - the body guarded from now; every withheld solid it is clear of stands now. Answers how many. A
 *       settle handed no body stands none (a body unknown is not a body clear).
 *   withheld(key), size() - whether `key` is held back; how many are.
 * @param {any} collider the collider (addMesh / removeBucket)
 */
export function lateSolidsOf(collider) {
  if (!collider || typeof collider !== 'object') return null;
  let gate = GATES.get(collider);
  if (!gate) { gate = makeGate(collider); GATES.set(collider, gate); }
  return gate;
}

/** @param {any} collider */
function makeGate(collider) {
  /** @type {Map<string, { positions: ArrayLike<number>, indices: ArrayLike<number>, matrix: ArrayLike<number>, probe: Collider | null, box: number[] | null }>} */
  const held = new Map();
  /** @type {LateBody} the body the gate guards - its last settle's */
  let guarded = null;
  /** The withheld solid's own collider - made once, asked every settle until it stands. */
  const probeOf = (h) => {
    if (!h.probe) { h.probe = new Collider(); h.probe.addMesh(PROBE, h.positions, h.indices, h.matrix); }
    return h.probe;
  };
  // the law, its box first: a town's yards stand two thousand pieces, and one whose box (its triangles' own, turned
  // into the collider's frame - never smaller than theirs) misses the body's needs no probe built to say so
  const closes = (h, body) => boxMeetsBody(h.box ??= transformedAabb(localAabb(h.positions), h.matrix), body.pos, body.height ?? CAPSULE_HEIGHT)
    && lateSolidCloses(probeOf(h), body);
  return {
    /** @param {string} key @param {ArrayLike<number>} positions @param {ArrayLike<number>} indices @param {ArrayLike<number>} matrix @param {LateBody} [body] */
    add(key, positions, indices, matrix, body = guarded) {
      const h = { positions, indices, matrix, probe: null, box: null };
      if (!held.has(key) && !(body?.pos && closes(h, body))) { collider.addMesh?.(key, positions, indices, matrix); return true; }
      held.set(key, h);
      return false;
    },
    /** @param {string} key */
    remove(key) {
      held.delete(key);
      collider.removeBucket?.(key);
    },
    /** @param {LateBody} body */
    settle(body) {
      if (!body?.pos) return 0;
      guarded = body;
      if (!held.size) return 0;
      let n = 0;
      for (const [key, h] of [...held]) {
        if (closes(h, body)) continue;
        held.delete(key);
        collider.addMesh?.(key, h.positions, h.indices, h.matrix);
        n++;
      }
      return n;
    },
    /** @param {string} key */
    withheld: (key) => held.has(key),
    size: () => held.size,
  };
}

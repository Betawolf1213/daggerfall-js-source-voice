// TWO-HANDS (2026-10-16) - THE MORROWIND BODY'S SECOND HAND: an arm, or the whole body, posed as the mirror of another
// (bible/05-Combat/Two-Hands.md, the Morrowind lane). Morrowind has one weapon hand: its one-handed groups swing the right
// arm and let the left hang out of the view, its hand-to-hand groups throw each punch with the hand the clip was made
// for, and there is no clip for a left-hand blow or a second weapon at all. The sprite lane draws its left hand as the
// right in the mirror (combat/twoHands.js); this is the same idea on a skeleton - THE LEFT ARM IS THE RIGHT ARM IN THE
// MIRROR - after the clip has posed it, before any piece is placed on it (formats/mwFirstPerson.js poseAssembly, ahead
// of the climb's IK).
//
// It holds NO number about any skeleton (combat/climbRig.js's rule, CLIMB6): every bone's counterpart is found by its
// NAME (Bip01's "L"/"R", the attach family's "Left"/"Right", Morrowind's "Weapon Bone" and "Weapon Bone Left"), the
// mirror's plane is the skeleton's own middle (halfway between its two upper arms at rest), and a bone's mirror is
// taken against the REST pose of both bones - so the rule holds whatever way a skeleton's left bones' own axes run:
//
//     M'(b) = S . M(m(b)) . Rest(m(b))^-1 . S . Rest(b)
//
// where M is a bone's posed transform in the graph's space, Rest its rest transform there, m(b) its counterpart (itself
// for a bone on the middle) and S the reflection through the middle plane. At rest it is the rest; a skinned vertex of
// the left arm lands where the right arm's mirrored vertex does (the bind pose is symmetric); a part on "Weapon Bone
// Left" - which rule 13 already draws mirrored (attach.cpp's "Left" test, the bow's own law) - lands as the mirror of the
// right hand's weapon. A bone with no counterpart (the Shield Bone on the left forearm) keeps its local and rides its
// mirrored parent.
//
// THE REQUEST (all optional):
//   full  - the whole pose mirrored: the torso turns the other way and each arm takes the other's;
//   limbs - { L, R }: an arm set absolutely, after `full`, from a pose: `{ pose, side, mirror }` - `pose` a poseSkeleton
//           map (null: the clip's own, as it stood before any change here), `side` the arm of it to read, `mirror`
//           whether that arm is mirrored onto this side or copied as it stands;
//   carry - the no-pop: `{ key, dt, tau, state }` - a change of `key` (the composition) carries every bone this module
//           wrote from where it was last frame onto its new place over `tau` (ClimbPose's LIMB_TAU law); `state` is the
//           caller's object the carry lives in between frames.
// Answers the refs it wrote, or null when nothing was asked.

import { mat33Mul } from '../formats/mwNifMesh.js';
import { HELD_BONE_ALIASES } from './heldPose.js';

// ---- the algebra: affines { a: row-major 3x3 (rotation x uniform scale), t: [3] }, column vectors ------------------

const apply = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const mul = (A, B) => { const t = apply(A.a, B.t); return { a: mat33Mul(A.a, B.a), t: [t[0] + A.t[0], t[1] + A.t[1], t[2] + A.t[2]] }; };
const scaleOf = (a) => Math.hypot(a[0], a[3], a[6]) || 1;
/** The inverse of an affine whose 3x3 is a rotation times a uniform scale (every node's). */
function inv(A) {
  const s2 = scaleOf(A.a) ** 2;
  const a = A.a;
  const ia = Float32Array.from([a[0] / s2, a[3] / s2, a[6] / s2, a[1] / s2, a[4] / s2, a[7] / s2, a[2] / s2, a[5] / s2, a[8] / s2]);
  const t = apply(ia, A.t);
  return { a: ia, t: [-t[0], -t[1], -t[2]] };
}
const unscaled = (a) => { const s = scaleOf(a); return Float32Array.from(a, (v) => v / s); };
const transposed = (m) => Float32Array.from([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
/** A rotation matrix as a unit quaternion [x, y, z, w]. */
function quatOf(r) {
  const tr = r[0] + r[4] + r[8];
  let x, y, z, w;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; w = s / 4; x = (r[7] - r[5]) / s; y = (r[2] - r[6]) / s; z = (r[3] - r[1]) / s; }
  else if (r[0] > r[4] && r[0] > r[8]) { const s = Math.sqrt(1 + r[0] - r[4] - r[8]) * 2; w = (r[7] - r[5]) / s; x = s / 4; y = (r[1] + r[3]) / s; z = (r[2] + r[6]) / s; }
  else if (r[4] > r[8]) { const s = Math.sqrt(1 + r[4] - r[0] - r[8]) * 2; w = (r[2] - r[6]) / s; x = (r[1] + r[3]) / s; y = s / 4; z = (r[5] + r[7]) / s; }
  else { const s = Math.sqrt(1 + r[8] - r[0] - r[4]) * 2; w = (r[3] - r[1]) / s; x = (r[2] + r[6]) / s; y = (r[5] + r[7]) / s; z = s / 4; }
  const n = Math.hypot(x, y, z, w) || 1;
  return [x / n, y / n, z / n, w / n];
}
function matOf([x, y, z, w]) {
  return Float32Array.from([
    1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
    2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
    2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y),
  ]);
}
/** The rotation a share `k` of the way from identity to `q` (the short way). */
function quatPow(q, k) {
  let [x, y, z, w] = q;
  if (w < 0) { x = -x; y = -y; z = -z; w = -w; }
  const ang = 2 * Math.acos(Math.min(1, w));
  const s = Math.sin(ang / 2);
  if (s < 1e-9) return [0, 0, 0, 1];
  const h = (ang * k) / 2, sh = Math.sin(h) / s;
  return [x * sh, y * sh, z * sh, Math.cos(h)];
}

// ---- the skeleton's mirror, read off it once ---------------------------------------------------------------------

/** A bone name's counterpart across the middle: Bip01's " l "/" r " (and a trailing one), the attach family's
 *  left/right, Morrowind's Weapon Bone and Weapon Bone Left. The name itself for a bone on the middle. Lower case. */
export function counterpartName(name) {
  const n = String(name || '').toLowerCase();
  if (n === 'weapon bone') return 'weapon bone left';
  if (n === 'weapon bone left') return 'weapon bone';
  const swap = (s, a, b) => s.replace(new RegExp(`\\b${a}\\b`, 'g'), '\u0000').replace(new RegExp(`\\b${b}\\b`, 'g'), a).replace(/\u0000/g, b);
  return swap(swap(n, 'l', 'r'), 'left', 'right');
}

const ATTACH_OF = Object.fromEntries(Object.entries(HELD_BONE_ALIASES).map(([attach, bip]) => [bip, attach]));
const CLAVICLE = { L: ['bip01 l clavicle', ATTACH_OF['bip01 l clavicle']], R: ['bip01 r clavicle', ATTACH_OF['bip01 r clavicle']] };
const UPPER = { L: ['bip01 l upperarm', ATTACH_OF['bip01 l upperarm']], R: ['bip01 r upperarm', ATTACH_OF['bip01 r upperarm']] };
const HAND = { L: ['bip01 l hand', ATTACH_OF['bip01 l hand']], R: ['bip01 r hand', ATTACH_OF['bip01 r hand']] };

const _plans = new WeakMap();
/**
 * The mirror's plan for a skeleton in the graph space `root` (memoised per skeleton and space): every bone's counterpart
 * ref, its rest transform and its inverse, the middle plane's x, the bones in parent-first order, and each arm's bones
 * (its clavicle - else its upper arm - and everything under it). Null for a skeleton with no pair of arms.
 */
export function mirrorPlan(skeleton, root, skelMats) {
  if (!skeleton?.nodes || !skeleton.byName) return null;
  let per = _plans.get(skeleton);
  if (!per) { per = new Map(); _plans.set(skeleton, per); }
  if (per.has(root)) return per.get(root);
  const find = (names) => { for (const n of names) { if (!n) continue; const r = skeleton.byName.get(n); if (r !== undefined) return r; } return null; };
  const rest = skelMats(skeleton, new Map(), root);
  const upL = find(UPPER.L), upR = find(UPPER.R);
  if (upL == null || upR == null || !rest.get(upL) || !rest.get(upR)) { per.set(root, null); return null; }
  const x0 = (rest.get(upL).t[0] + rest.get(upR).t[0]) / 2;
  const children = new Map();
  for (const [ref, node] of skeleton.nodes) {
    if (!children.has(node.parent)) children.set(node.parent, []);
    children.get(node.parent).push(ref);
  }
  // parent first: a walk down from every node whose parent is not a bone
  const order = [];
  const walk = (ref) => { order.push(ref); for (const k of children.get(ref) ?? []) walk(k); };
  for (const [ref, node] of skeleton.nodes) if (!skeleton.nodes.has(node.parent)) walk(ref);
  const counterpart = new Map();
  for (const [ref, node] of skeleton.nodes) {
    const c = skeleton.byName.get(counterpartName(node.name));
    counterpart.set(ref, c !== undefined ? c : null);
  }
  const restOf = new Map(), restInv = new Map();
  for (const ref of order) { const m = rest.get(ref); if (m) { restOf.set(ref, m); restInv.set(ref, inv(m)); } }
  const arm = (s) => {
    const top = find(CLAVICLE[s]) ?? find(UPPER[s]);
    const set = [];
    const take = (ref) => { set.push(ref); for (const k of children.get(ref) ?? []) take(k); };
    if (top != null) take(top);
    return set;   // parent first, as `take` walks
  };
  const arms = { L: arm('L'), R: arm('R') };
  // a bone IN an arm whose name has no side (the left forearm's Shield Bone, the right hand's Weapon Bone on a rig with
  // no Weapon Bone Left) is no bone of the middle: it has no counterpart, and rides its arm
  for (const s of ['L', 'R']) for (const ref of arms[s]) if (counterpart.get(ref) === ref) counterpart.set(ref, null);
  const plan = {
    x0, order, counterpart, restOf, restInv, children,
    S: { a: Float32Array.from([-1, 0, 0, 0, 1, 0, 0, 0, 1]), t: [2 * x0, 0, 0] },
    arms,
    hands: { L: find(HAND.L), R: find(HAND.R) },
  };
  per.set(root, plan);
  return plan;
}

/** Bone `ref`'s mirror, given the source's posed transforms `src`: S . M(m) . Rest(m)^-1 . S . Rest(b). Null when the
 *  bone has no counterpart (it rides its parent). */
function mirrored(plan, src, ref) {
  const m = plan.counterpart.get(ref);
  if (m == null) return null;
  const Mm = src.get(m), Rm = plan.restInv.get(m), Rb = plan.restOf.get(ref);
  if (!Mm || !Rm || !Rb) return null;
  return mul(mul(mul(mul(plan.S, Mm), Rm), plan.S), Rb);
}

/** Write bone `ref`'s posed transform as `target` (graph space): its new local against its parent's transform `mats`
 *  holds now, and `mats` updated. */
function place(skeleton, pose, mats, ref, target) {
  const node = skeleton.nodes.get(ref);
  if (!node) return;
  const parent = mats.get(node.parent);
  const local = parent ? mul(inv(parent), target) : target;
  const s = scaleOf(local.a);
  const rotation = Float32Array.from(local.a, (v) => v / s);
  pose.set(ref, { rotation, translation: [local.t[0], local.t[1], local.t[2]], scale: s });
  mats.set(ref, target);
}
/** A bone that keeps its local: its transform recomputed under its (moved) parent. */
function ride(skeleton, pose, mats, ref) {
  const node = skeleton.nodes.get(ref);
  if (!node) return;
  const parent = mats.get(node.parent);
  const local = pose.get(ref) ?? node.rest;
  const la = Float32Array.from(local.rotation, (v) => v * local.scale);
  const m = { a: la, t: [local.translation[0], local.translation[1], local.translation[2]] };
  mats.set(ref, parent ? mul(parent, m) : m);
}

/**
 * THE MIRROR ON THE SKELETON, written into `pose` (a poseSkeleton map) after the clip's - see the header for the
 * request. `skelMats` is the assembly's (mwSkin skeletonSpaceMatrices), `root` its space (GRAPH_ROOT).
 * @returns {number[] | null} the refs written
 */
export function applyMirrorRig(skeleton, pose, root, skelMats, req) {
  // nothing composed, no composition changing and none still carrying: the clip's pose stands as it is
  const st0 = req?.carry?.state ?? null;
  const composing = !!(req && (req.full || req.limbs?.L || req.limbs?.R));
  const carrying = !!st0 && (!!st0.from || st0.key !== req.carry.key);
  if (!req || (!composing && !carrying)) return null;
  const plan = mirrorPlan(skeleton, root, skelMats);
  if (!plan) return null;
  const clip = skelMats(skeleton, pose, root);   // the clip's own pose, before anything here
  const mats = new Map(clip);
  const targets = new Map();
  const srcMats = new Map();   // a pose map's transforms, once each
  const matsFor = (p) => {
    if (!p) return clip;
    if (!srcMats.has(p)) srcMats.set(p, skelMats(skeleton, p, root));
    return srcMats.get(p);
  };
  // 1. the whole body in the mirror (a bone with no counterpart rides its parent)
  if (req.full) for (const ref of plan.order) { const t = mirrored(plan, clip, ref); if (t) targets.set(ref, t); }
  // 2. an arm set from a pose: its own side's arm copied, or the other side's mirrored onto it
  for (const side of /** @type {const} */ (['L', 'R'])) {
    const l = req.limbs?.[side];
    if (!l) continue;
    const src = matsFor(l.pose ?? null);
    const from = l.side === 'L' || l.side === 'R' ? l.side : side;
    for (const ref of plan.arms[side]) {
      if (l.mirror && from !== side) { const t = mirrored(plan, src, ref); if (t) targets.set(ref, t); else targets.delete(ref); }
      else if (src.get(ref)) targets.set(ref, src.get(ref));
    }
  }
  // 3. the carry: a new composition starts every bone from where it was drawn last frame - the last composed frame's
  // matrices, or, when nothing was composed, the clip's own (this frame's: the frame before it stood one step back)
  const c = req.carry;
  if (c?.state) {
    const st = c.state;
    if (st.key !== c.key) {
      const prevOf = st.last ?? clip;
      st.key = c.key;
      st.from = new Map();
      // each bone's offset from its new place to where it was drawn: its turn about its own joint (the rotations'
      // difference, prev . now^-1 of the 3x3s) and its joint's move - eased apart, so a far joint never swings on an arc
      for (const ref of plan.order) {
        const prev = prevOf.get(ref), now = targets.get(ref) ?? clip.get(ref);
        if (!prev || !now) continue;
        const d = [prev.t[0] - now.t[0], prev.t[1] - now.t[1], prev.t[2] - now.t[2]];
        let same = Math.hypot(d[0], d[1], d[2]) < 1e-6;
        for (let i = 0; same && i < 9; i++) same = Math.abs(prev.a[i] - now.a[i]) < 1e-6;
        if (!same) st.from.set(ref, { q: quatOf(mat33Mul(unscaled(prev.a), transposed(unscaled(now.a)))), d });
      }
      st.k = st.from.size ? 1 : 0;
    } else if (st.k > 0) st.k *= Math.exp(-Math.max(0, c.dt || 0) / Math.max(1e-4, c.tau || 0.06));
    if (st.k < 1e-3) { st.k = 0; st.from = null; }
  }
  // 4. written parent first, so each local is taken against its parent's new place
  const wrote = [];
  for (const ref of plan.order) {
    let t = targets.get(ref);
    const carry = c?.state?.from?.get(ref);
    if (carry && c.state.k > 0) {
      const base = t ?? clip.get(ref);
      const k = c.state.k;
      t = { a: mat33Mul(matOf(quatPow(carry.q, k)), base.a), t: [base.t[0] + carry.d[0] * k, base.t[1] + carry.d[1] * k, base.t[2] + carry.d[2] * k] };
    }
    if (t) { place(skeleton, pose, mats, ref, t); wrote.push(ref); }
    else ride(skeleton, pose, mats, ref);
  }
  // what was drawn, for the next change to start from - kept only while a composition or its carry stands
  if (c?.state) c.state.last = composing || c.state.from ? mats : null;
  return wrote.length ? wrote : null;
}

/**
 * Which hand a clip strikes with: the hand whose wrist travels the farther between two of its poses (the wind-up's
 * start and its hit), each a poseSkeleton map. 'R' or 'L', or null when neither hand moves or the skeleton has no pair.
 */
export function strikingSide(skeleton, root, skelMats, poseA, poseB) {
  const plan = mirrorPlan(skeleton, root, skelMats);
  if (!plan || plan.hands.L == null || plan.hands.R == null) return null;
  const a = skelMats(skeleton, poseA, root), b = skelMats(skeleton, poseB, root);
  const travel = (h) => { const p = a.get(h)?.t, q = b.get(h)?.t; return p && q ? Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) : 0; };
  const l = travel(plan.hands.L), r = travel(plan.hands.R);
  if (!(Math.max(l, r) > 1e-6)) return null;
  return r >= l ? 'R' : 'L';
}

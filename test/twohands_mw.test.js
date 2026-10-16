// TWO-HANDS, THE MORROWIND LANE (2026-10-16, bible/05-Combat/Two-Hands.md): the second hand on the 3D body - an arm, or
// the whole body, as the mirror of another (combat/mirrorRig.js) on the vendored retail biped (Weapon Sheathing's
// xbase_anim, bones along their local X) and the fixture rig; the left hand's weapon on the Weapon Bone Left
// (combat/fpArm.js resolveOffWeaponParts, setOffWeapon); the left-hand blow, the fists' mirror, and the running hands
// through the real arm's update. The sprite lane's pins are test/twohands.test.js.
//
// TWO-HANDS AUDIT (2026-10-16): the lane's eleven findings, each pinned where it was reproduced - a Weapon Bone Left made
// by the mirror for a skeleton without one (every retail one), each arm hung from this frame's body and every joint on
// its bone (the law in each bone's frame), the carry in each bone's frame, the run and the climb blended, a mirrored
// blow's way across the screen, a carry kept across a view switch, the pair's draw composed, the portrait's pair, a
// failed left-hand swap remembered forever, the mirror's cost, the run's lens - and the rig's own stride phase.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseNif } from '../src/formats/mwNifFile.js';
import { buildSkeleton, poseSkeleton, skeletonSpaceMatrices, injectSkeletonNodes, GRAPH_ROOT } from '../src/formats/mwSkin.js';
import { mat33Mul } from '../src/formats/mwNifMesh.js';
import { applyMirrorRig, mirrorPlan, counterpartName, strikingSide, limbSkeleton, offWeaponBoneAddon, WEAPON_BONE_LEFT_SOURCE } from '../src/combat/mirrorRig.js';
import { rotAxisAngle } from '../src/combat/climbRig.js';
import { createFpArm, fpSkeletonPath, FP_CLIP_PATH, resolveOffWeaponParts, resolveWeaponParts, OFF_WEAPON_BONE, fpWeaponKey, GUARD_LENS_DROP } from '../src/combat/fpArm.js';
import { GUARD } from '../src/combat/handsLaw.js';
import { MW_WEAPON_TYPE, assembleFirstPersonArm, poseAssembly } from '../src/formats/mwFirstPerson.js';
import { bodyRec } from './fixtures/mw/bodyRec.mjs';

const rd = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const f = (n) => new Uint8Array(readFileSync(new URL(`./fixtures/mw/${n}`, import.meta.url)));
const RETAIL = 'vendor/weapon-sheathing/Data Files/Animations/xbase_anim/xbase_anim_sh.nif';
const retailBytes = () => new Uint8Array(readFileSync(new URL('../' + RETAIL, import.meta.url)));
const retail = () => buildSkeleton(parseNif(retailBytes()));
const M = (sk, pose) => skeletonSpaceMatrices(sk, pose, GRAPH_ROOT);

// the affine algebra the law is stated in, restated here (an independent oracle)
const app = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const mul = (A, B) => { const t = app(A.a, B.t); return { a: mat33Mul(A.a, B.a), t: [t[0] + A.t[0], t[1] + A.t[1], t[2] + A.t[2]] }; };
const inv = (A) => { const a = A.a, s2 = Math.hypot(a[0], a[3], a[6]) ** 2; const ia = [a[0] / s2, a[3] / s2, a[6] / s2, a[1] / s2, a[4] / s2, a[7] / s2, a[2] / s2, a[5] / s2, a[8] / s2]; const t = app(ia, A.t); return { a: ia, t: [-t[0], -t[1], -t[2]] }; };
const diff = (A, B) => { let w = 0; for (let i = 0; i < 9; i++) w = Math.max(w, Math.abs(A.a[i] - B.a[i])); for (let i = 0; i < 3; i++) w = Math.max(w, Math.abs(A.t[i] - B.t[i])); return w; };
const diffRot = (A, B) => { let w = 0; for (let i = 0; i < 9; i++) w = Math.max(w, Math.abs(A.a[i] - B.a[i])); return w; };
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
/** The plane the test reads for itself: halfway between the two upper arms at rest (an independent oracle). */
const SofRest = (sk) => { const r = M(sk, new Map()); const x0 = (r.get(sk.byName.get('bip01 l upperarm')).t[0] + r.get(sk.byName.get('bip01 r upperarm')).t[0]) / 2; return { a: Float32Array.from([-1, 0, 0, 0, 1, 0, 0, 0, 1]), t: [2 * x0, 0, 0] }; };
/** Every bone's joint at its rest distance from its parent's (the bone keeps its length), worst miss. */
const worstBone = (sk, mats) => { let w = 0; for (const [ref, node] of sk.nodes) { if (!sk.nodes.has(node.parent)) continue; w = Math.max(w, Math.abs(dist(mats.get(node.parent).t, mats.get(ref).t) - Math.hypot(...node.rest.translation))); } return w; };
let seed = 11;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
/** The right arm turned at random at every bone, the rest as it stands. */
function bentRight(sk, plan) {
  const pose = new Map();
  for (const ref of plan.arms.R) {
    const n = sk.nodes.get(ref);
    const ax = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5], l = Math.hypot(...ax);
    pose.set(ref, { rotation: mat33Mul(n.rest.rotation, rotAxisAngle(ax.map((v) => v / l), (rnd() - 0.5) * 1.4)), translation: n.rest.translation, scale: n.rest.scale });
  }
  return pose;
}
/** Bone `name` turned by `deg` about its own `axis`, over what `pose` holds. */
const turnBone = (sk, pose, name, axis, deg) => { const ref = sk.byName.get(name.toLowerCase()); const base = pose.get(ref) ?? sk.nodes.get(ref).rest; pose.set(ref, { rotation: mat33Mul(base.rotation, rotAxisAngle(axis, (deg * Math.PI) / 180)), translation: base.translation, scale: base.scale }); };

test('TWO-HANDS mirror: a bone\'s counterpart by its NAME - Bip01\'s L and R, the attach family\'s Left and Right, Morrowind\'s Weapon Bone and Weapon Bone Left; a bone of the middle is its own', () => {
  assert.deepEqual(['Bip01 L Hand', 'Bip01 R Forearm', 'Bip01 L Finger01', 'Left Hand', 'Right Upper Arm', 'Weapon Bone', 'Weapon Bone Left', 'Bip01 Spine1', 'Bip01 Head', 'Shield Bone'].map(counterpartName),
    ['bip01 r hand', 'bip01 l forearm', 'bip01 r finger01', 'right hand', 'left upper arm', 'weapon bone left', 'weapon bone', 'bip01 spine1', 'bip01 head', 'shield bone']);
});

test('TWO-HANDS mirror, on the RETAIL biped: the plan read off the skeleton - its middle between the upper arms, each arm\'s eleven bones parent first, and a bone IN an arm with no side to its name (the Shield Bone, a Weapon Bone with no Left) given no counterpart', () => {
  const sk = retail();
  const plan = mirrorPlan(sk, GRAPH_ROOT, skeletonSpaceMatrices);
  const rest = M(sk, new Map());
  const up = (n) => rest.get(sk.byName.get(n)).t[0];
  assert.ok(Math.abs(plan.x0 - (up('bip01 l upperarm') + up('bip01 r upperarm')) / 2) < 1e-9, `the middle is halfway between the upper arms at rest (${plan.x0})`);
  assert.ok(Math.abs(plan.x0) > 0.01, 'and this skeleton\'s middle is not the rig\'s origin - the plane is read, not assumed');
  assert.deepEqual([plan.arms.L.length, plan.arms.R.length], [11, 11]);
  for (const s of ['L', 'R']) for (let i = 1; i < plan.arms[s].length; i++) assert.ok(plan.arms[s].indexOf(sk.nodes.get(plan.arms[s][i]).parent) < i, 'parent first');
  const unpaired = [...plan.counterpart].filter(([, c]) => c == null).map(([r]) => sk.nodes.get(r).name).sort();
  assert.deepEqual(unpaired, ['Shield Bone', 'Weapon Bone']);
  assert.equal(mirrorPlan(sk, GRAPH_ROOT, skeletonSpaceMatrices), plan, 'memoised');
  assert.equal(mirrorPlan({ nodes: new Map(), byName: new Map() }, GRAPH_ROOT, skeletonSpaceMatrices), null, 'no arms, no plan');
});

test('TWO-HANDS mirror, THE LAW on the retail biped: at rest it is the rest; an arm set as the other\'s mirror TURNS bone for bone as the other turns, in the mirror (the rotation of posed . rest^-1 is S . (posed . rest^-1) of the counterpart . S), with every joint where its parent carries it; on a rest that is its own mirror (the fixture arm) it is the graph law to the last digit, translations and all; the arm it reads untouched; the whole body mirrored twice is the body', () => {
  const sk = retail();
  const plan = mirrorPlan(sk, GRAPH_ROOT, skeletonSpaceMatrices);
  const rest = M(sk, new Map());
  const p0 = new Map();
  assert.ok(applyMirrorRig(sk, p0, GRAPH_ROOT, skeletonSpaceMatrices, { full: true }));
  for (const [ref, m] of rest) assert.ok(diff(M(sk, p0).get(ref), m) < 2e-4, `rest holds: ${sk.nodes.get(ref)?.name ?? ref}`);
  const pose = bentRight(sk, plan);
  const src = M(sk, pose);
  const p1 = new Map(pose);
  const wrote = applyMirrorRig(sk, p1, GRAPH_ROOT, skeletonSpaceMatrices, { limbs: { L: { pose: null, side: 'R', mirror: true } } });
  assert.ok(wrote.length >= 10);
  const got = M(sk, p1);
  // PIN MOVED (TWO-HANDS AUDIT): the skin delta's TRANSLATION is no longer the graph law's on retail. Its rest stands a
  // few tenths of a unit (its legs 6.7) off its own mirror, and the graph law hung each bone at the mirror of its
  // counterpart's frame - a turned counterpart slid the joint off its parent by that asymmetry (a finger joint 10% off
  // its bone here). The rotations stay the law's exactly; every joint now stays on its bone (mirrorRig.js's header).
  for (const ref of plan.arms.L) {
    const c = plan.counterpart.get(ref);
    if (c == null) continue;
    const dl = mul(got.get(ref), inv(rest.get(ref)));
    const dr = mul(mul(plan.S, mul(src.get(c), inv(rest.get(c)))), plan.S);
    assert.ok(diffRot(dl, dr) < 5e-4, `${sk.nodes.get(ref).name} turns as its counterpart does, in the mirror: ${diffRot(dl, dr)}`);
    assert.ok(dist(p1.get(ref).translation, sk.nodes.get(ref).rest.translation) < 1e-4, `${sk.nodes.get(ref).name}'s joint stays where its parent carries it`);
  }
  for (const ref of plan.arms.R) assert.ok(diff(got.get(ref), src.get(ref)) < 1e-6, 'the right arm stands as the clip has it');
  const p2 = new Map(pose);
  applyMirrorRig(sk, p2, GRAPH_ROOT, skeletonSpaceMatrices, { full: true });
  assert.ok(diffRot(M(sk, p2).get(plan.hands.L), mul(mul(plan.S, mul(src.get(plan.hands.R), inv(rest.get(plan.hands.R)))), mul(plan.S, rest.get(plan.hands.L)))) < 5e-4, 'the full mirror: the left hand turns as the right\'s');
  assert.ok(worstBone(sk, M(sk, p2)) < 1e-3, 'and no bone of the body leaves its parent');
  applyMirrorRig(sk, p2, GRAPH_ROOT, skeletonSpaceMatrices, { full: true });
  for (const [ref, m] of src) assert.ok(diff(M(sk, p2).get(ref), m) < 2e-3, `twice is the body: ${sk.nodes.get(ref)?.name ?? ref}`);
  // an arm COPIED from another pose takes that pose's locals, on the body under it (re-rooted: the next test twists it)
  const other = bentRight(sk, plan);
  const p3 = new Map();
  applyMirrorRig(sk, p3, GRAPH_ROOT, skeletonSpaceMatrices, { limbs: { R: { pose: other, side: 'R', mirror: false } } });
  const want = M(sk, other);
  for (const ref of plan.arms.R) assert.ok(diff(M(sk, p3).get(ref), want.get(ref)) < 1e-4, 'copied, on the same body');
  assert.equal(applyMirrorRig(sk, new Map(), GRAPH_ROOT, skeletonSpaceMatrices, {}), null, 'nothing asked, nothing written');
  // the fixture arm's rest IS its own mirror: there the law is the graph law, every term of it
  const fx = buildSkeleton(parseNif(f('armfp.nif')));
  const fplan = mirrorPlan(fx, GRAPH_ROOT, skeletonSpaceMatrices);
  const frest = M(fx, new Map());
  const fpose = bentRight(fx, fplan), fsrc = M(fx, fpose);
  const p4 = new Map(fpose);
  applyMirrorRig(fx, p4, GRAPH_ROOT, skeletonSpaceMatrices, { limbs: { L: { pose: null, side: 'R', mirror: true } } });
  for (const ref of fplan.arms.L) {
    const c = fplan.counterpart.get(ref);
    const graphLaw = mul(mul(mul(mul(fplan.S, fsrc.get(c)), inv(frest.get(c))), fplan.S), frest.get(ref));
    assert.ok(diff(M(fx, p4).get(ref), graphLaw) < 1e-5, `${fx.nodes.get(ref).name}: the graph law exactly`);
  }
});

test('TWO-HANDS AUDIT mirror, EACH ARM HANGS FROM THIS FRAME\'S BODY (finding 2): with the chest twisted 25 degrees by the clip, an arm set from a pose - the idle\'s right mirrored, the clip\'s own right mirrored, the idle\'s right copied under the whole body\'s mirror - keeps its shoulder on that chest; the first draft set it in the graph\'s space, 4.7 to 9.1 units off; and a bent knee mirrored leaves the other knee on its thigh', () => {
  const sk = retail();
  const plan = mirrorPlan(sk, GRAPH_ROOT, skeletonSpaceMatrices);
  const rest = M(sk, new Map());
  const ref = (n) => sk.byName.get(n);
  const clip = new Map();
  turnBone(sk, clip, 'Bip01 Spine1', [1, 0, 0], 25);
  turnBone(sk, clip, 'Bip01 R UpperArm', [0, 0, 1], 60);
  const idle = new Map();
  const clipM = M(sk, clip), S = SofRest(sk);
  for (const [label, req, side] of [
    ['dual:R (the left the idle\'s right, mirrored)', { limbs: { L: { pose: idle, side: 'R', mirror: true } } }, 'l'],
    ['dual (the left the clip\'s right, mirrored)', { limbs: { L: { pose: null, side: 'R', mirror: true } } }, 'l'],
    ['dual:L (the whole body mirrored, the right the idle\'s)', { full: true, limbs: { R: { pose: idle, side: 'R', mirror: false } } }, 'r'],
  ]) {
    const p = new Map(clip);
    applyMirrorRig(sk, p, GRAPH_ROOT, skeletonSpaceMatrices, req);
    const got = M(sk, p);
    const neck = ref('bip01 neck'), up = ref(`bip01 ${side} upperarm`), cl = ref(`bip01 ${side} clavicle`);
    const want = mul(mul(got.get(neck), inv(rest.get(neck))), rest.get(up)).t;
    assert.ok(dist(got.get(up).t, want) < 1e-3, `${label}: the shoulder on the chest that carries it (${dist(got.get(up).t, want).toFixed(4)})`);
    assert.ok(dist(p.get(cl).translation, sk.nodes.get(cl).rest.translation) < 1e-4, `${label}: the clavicle's joint on its parent`);
    assert.ok(worstBone(sk, got) < 1e-3, `${label}: no bone leaves its parent`);
  }
  // the first draft's placement, restated: the left shoulder at the mirror of the clip's right in the graph's space
  const absolute = mul(mul(mul(mul(S, clipM.get(ref('bip01 r upperarm'))), inv(rest.get(ref('bip01 r upperarm')))), S), rest.get(ref('bip01 l upperarm'))).t;
  const neck = ref('bip01 neck');
  assert.ok(dist(absolute, mul(mul(clipM.get(neck), inv(rest.get(neck))), rest.get(ref('bip01 l upperarm'))).t) > 4, 'set in the graph\'s space it stood off the twisted chest');
  // the legs: retail's rest stands its knees 6.7 units off their mirror, so the graph law slid a mirrored knee off its thigh
  const knee = new Map(); turnBone(sk, knee, 'Bip01 R Calf', [0, 0, 1], 60);
  const pk = new Map(knee);
  applyMirrorRig(sk, pk, GRAPH_ROOT, skeletonSpaceMatrices, { full: true });
  const lc = ref('bip01 l calf');
  assert.ok(dist(pk.get(lc).translation, sk.nodes.get(lc).rest.translation) < 1e-4, 'the left knee on the left thigh');
  const km = M(sk, knee), lt = ref('bip01 l thigh'), rc = ref('bip01 r calf'), rt = ref('bip01 r thigh');
  const graphKnee = mul(mul(mul(mul(S, km.get(rc)), inv(rest.get(rc))), S), rest.get(lc));
  const graphThigh = mul(mul(mul(mul(S, km.get(rt)), inv(rest.get(rt))), S), rest.get(lt));
  assert.ok(dist(mul(inv(graphThigh), graphKnee).t, sk.nodes.get(lc).rest.translation) > 3, 'the graph law slid it more than 3 units');
});

test('TWO-HANDS mirror, NO POP: a new composition starts from where the arm was drawn last frame and eases onto its own place over the carry\'s time constant (ClimbPose\'s limb law); a composition that ends eases back to the clip; TWO-HANDS AUDIT (finding 3): carried in each bone\'s own frame, no bone leaves its parent on any frame of it and the Shield Bone never leaves its hand; (finding 6) a carry that has drawn nothing takes its first composition as it stands', () => {
  const sk = retail();
  const plan = mirrorPlan(sk, GRAPH_ROOT, skeletonSpaceMatrices);
  const clip = bentRight(sk, plan);
  const state = {};
  const frame = (req, dt = 1 / 60, st = state) => { const p = new Map(clip); applyMirrorRig(sk, p, GRAPH_ROOT, skeletonSpaceMatrices, { ...req, carry: { ...req.carry, dt, tau: 0.06, state: st } }); return M(sk, p); };
  // the right hand: as the clip bends it under A (the left arm set as its mirror), the left's rest in the mirror under B
  const A = { limbs: { L: { pose: null, side: 'R', mirror: true } }, carry: { key: 'A' } };
  const B = { full: true, carry: { key: 'B' } };
  const target = (req) => { const p = new Map(clip); applyMirrorRig(sk, p, GRAPH_ROOT, skeletonSpaceMatrices, { full: req.full, limbs: req.limbs }); return M(sk, p); };
  let m = frame(A);
  for (const [r, t] of target(A)) assert.ok(diff(m.get(r), t) < 1e-6, 'a fresh carry: the first composition at once - nothing was drawn to carry from');
  assert.equal(state.key, 'A');
  assert.equal(state.from, null);
  for (let i = 0; i < 30; i++) m = frame(A);
  const lastA = m;
  const firstB = frame(B);
  for (const [r, t] of lastA) assert.ok(diff(firstB.get(r), t) < 1e-3, `the first frame of the new composition is where the last one left every bone: ${sk.nodes.get(r)?.name ?? r}`);
  const tB = target(B).get(plan.hands.R);
  const secondB = frame(B).get(plan.hands.R);
  assert.ok(diff(tB, lastA.get(plan.hands.R)) > 0.1, 'the compositions differ for this hand');
  assert.ok(diff(secondB, lastA.get(plan.hands.R)) < 0.5 * diff(tB, lastA.get(plan.hands.R)), 'and eases - it does not snap on the next');
  const sb = sk.byName.get('shield bone'), lh = sk.nodes.get(sb).parent, sbLen = Math.hypot(...sk.nodes.get(sb).rest.translation);
  let worst = 0, shield = 0;
  for (let i = 0; i < 90; i++) {
    m = frame(B);
    worst = Math.max(worst, worstBone(sk, m));
    shield = Math.max(shield, Math.abs(dist(m.get(lh).t, m.get(sb).t) - sbLen));
  }
  assert.ok(worst < 1e-3, `no bone leaves its parent through the carry (${worst})`);
  assert.ok(shield < 1e-4, `the Shield Bone rides its hand (${shield})`);
  assert.ok(diff(m.get(plan.hands.R), target(B).get(plan.hands.R)) < 1e-3, 'and it settles on its own');
  // the composition ends: back to the clip, eased
  const firstNone = frame({ carry: { key: 'none' } });
  for (const [r, t] of m) assert.ok(diff(firstNone.get(r), t) < 1e-3, 'no pop on the way out either');
  for (let i = 0; i < 90; i++) frame({ carry: { key: 'none' } });
  assert.equal(state.last, null, 'and then nothing is carried');
  const p = new Map(clip);
  assert.equal(applyMirrorRig(sk, p, GRAPH_ROOT, skeletonSpaceMatrices, { carry: { key: 'none', dt: 1 / 60, tau: 0.06, state } }), null, 'the clip stands');
});

test('TWO-HANDS AUDIT mirror, ITS COST (finding 10): the frame composes no matrix of the skeleton - the plan reads the rests once, every frame after it (an arm mirrored, the whole body, a carry) none - and an arm read from another clip is sampled for that arm\'s bones alone', () => {
  const sk = retail();
  let calls = 0;
  const counted = (s, p, r) => { calls++; return skeletonSpaceMatrices(s, p, r); };
  const plan = mirrorPlan(sk, GRAPH_ROOT, counted);
  calls = 0;
  const clip = bentRight(sk, plan);
  const state = {};
  for (let i = 0; i < 60; i++) {
    const p = new Map(clip);
    const dual = i < 30;
    applyMirrorRig(sk, p, GRAPH_ROOT, counted, { full: !dual, limbs: dual ? { L: { pose: null, side: 'R', mirror: true } } : { R: { pose: new Map(), side: 'R', mirror: false } }, carry: { key: dual ? 'dual' : 'dual:L', dt: 1 / 60, tau: 0.06, state } });
  }
  assert.equal(calls, 0, 'no matrix composed in sixty frames');
  assert.deepEqual([...limbSkeleton(sk, GRAPH_ROOT, skeletonSpaceMatrices, 'L', { side: 'R', mirror: true }).nodes.keys()], plan.arms.R, 'a mirrored arm reads the other arm');
  assert.deepEqual([...limbSkeleton(sk, GRAPH_ROOT, skeletonSpaceMatrices, 'R', { side: 'R', mirror: false }).nodes.keys()], plan.arms.R, 'a copied arm its own');
  // through the assembly: the other clip's sampler is asked for the arm it reads, and for no other bone
  const tracks = new Map([...sk.nodes.values()].map((n) => [n.name.toLowerCase(), {}]));
  let sampled = 0;
  const idleSampler = () => { sampled++; return {}; };
  const assembly = { fns: { poseSkeleton, skelMats: skeletonSpaceMatrices }, skeleton: sk, pieces: [] };
  poseAssembly(assembly, { tracks, sampleTrack: () => ({}), time: 0, mirror: { limbs: { L: { clip: { tracks, sampleTrack: idleSampler, time: 0 }, side: 'R', mirror: true } } } });
  assert.equal(sampled, plan.arms.R.length, `the idle sampled for the right arm's ${plan.arms.R.length} bones (the skeleton has ${sk.nodes.size})`);
  assert.ok(assembly.mirrored?.length >= plan.arms.L.length - 1, 'and the left arm written from it');
});

test('TWO-HANDS AUDIT mirror, THE GUARD (Mac: "the other weapon in hand should lower slightly"): an arm\'s `dip` turns its upper arm DOWN about its own joint in the upright plane through shoulder and wrist - the hand lower, its way across unchanged, the shoulder where it was, every bone its length, the other arm untouched', () => {
  const sk = retail();
  const plan = mirrorPlan(sk, GRAPH_ROOT, skeletonSpaceMatrices);
  const pose = bentRight(sk, plan);
  const before = M(sk, pose);
  const p = new Map(pose);
  const wrote = applyMirrorRig(sk, p, GRAPH_ROOT, skeletonSpaceMatrices, { limbs: { L: { pose: null, side: 'R', mirror: true } }, dip: { L: 0.1, R: 0 } });
  assert.ok(wrote.includes(plan.uppers.L), 'the left upper arm written');
  const plain = new Map(pose); applyMirrorRig(sk, plain, GRAPH_ROOT, skeletonSpaceMatrices, { limbs: { L: { pose: null, side: 'R', mirror: true } } });
  const a = M(sk, plain), b = M(sk, p);
  const sh = plan.uppers.L, wr = plan.hands.L;
  const d0 = [a.get(wr).t[0] - a.get(sh).t[0], a.get(wr).t[1] - a.get(sh).t[1], a.get(wr).t[2] - a.get(sh).t[2]];
  const d1 = [b.get(wr).t[0] - b.get(sh).t[0], b.get(wr).t[1] - b.get(sh).t[1], b.get(wr).t[2] - b.get(sh).t[2]];
  const len = Math.hypot(...d0);
  assert.ok(dist(a.get(sh).t, b.get(sh).t) < 1e-4, 'the shoulder where it was');
  assert.ok(Math.abs(Math.hypot(...d1) - len) < 1e-3 && worstBone(sk, b) < 1e-3, 'no bone changes its length');
  const elev = (d) => Math.atan2(d[2], Math.hypot(d[0], d[1]));
  assert.ok(Math.abs(elev(d0) - elev(d1) - 0.1) < 2e-3, `the shoulder-to-wrist line 0.1 rad lower (${(elev(d0) - elev(d1)).toFixed(4)})`);
  assert.ok(Math.abs(Math.atan2(d0[1], d0[0]) - Math.atan2(d1[1], d1[0])) < 1e-3, 'in its upright plane: its way across unchanged');
  for (const ref of plan.arms.R) assert.ok(diff(b.get(ref), a.get(ref)) < 1e-6, 'the other arm untouched');
  for (const ref of plan.arms.R) assert.ok(diff(b.get(ref), before.get(ref)) < 1e-6);
  // with nothing composed, the guard stands alone (it eases away after a pair is put away)
  const q = new Map(pose);
  assert.deepEqual(applyMirrorRig(sk, q, GRAPH_ROOT, skeletonSpaceMatrices, { dip: { L: 0, R: 0.05 } }), [plan.uppers.R]);
});

test('TWO-HANDS mirror: which fist a clip throws - the wrist that travels the farther between two of its poses', () => {
  const sk = retail();
  const plan = mirrorPlan(sk, GRAPH_ROOT, skeletonSpaceMatrices);
  const bent = bentRight(sk, plan);
  assert.equal(strikingSide(sk, GRAPH_ROOT, skeletonSpaceMatrices, new Map(), bent), 'R');
  const left = new Map(); applyMirrorRig(sk, left, GRAPH_ROOT, skeletonSpaceMatrices, { limbs: { L: { pose: bent, side: 'R', mirror: true } } });
  assert.equal(strikingSide(sk, GRAPH_ROOT, skeletonSpaceMatrices, new Map(), left), 'L');
  assert.equal(strikingSide(sk, GRAPH_ROOT, skeletonSpaceMatrices, new Map(), new Map()), null, 'neither moves');
});

// ---- THE LEFT HAND'S WEAPON BONE ------------------------------------------------------------------------------------

/** Rename every occurrence of a NIF string of the same length (the file stays valid) - a fixture made retail-shaped. */
function patchName(bytes, from, to) {
  assert.equal(from.length, to.length);
  const a = [...from].map((c) => c.charCodeAt(0)), b = [...to].map((c) => c.charCodeAt(0));
  const out = bytes.slice(); let n = 0;
  outer: for (let i = 0; i <= out.length - a.length; i++) { for (let j = 0; j < a.length; j++) if (out[i + j] !== a[j]) continue outer; out.set(b, i); n++; }
  assert.ok(n > 0, `${from} is in the file`);
  return out;
}
/** The fixture arm with no Weapon Bone Left, as retail's skeletons have none. */
const noLeftBone = () => patchName(f('armfp.nif'), 'Weapon Bone Left', 'Weapon Bone XLft');
/** ...and with no Weapon Bone either: nothing to make one from. */
const noWeaponBone = () => patchName(noLeftBone(), 'Weapon Bone', 'Weapon Bonx');
const injectAddon = (sk) => { const a = offWeaponBoneAddon(sk, GRAPH_ROOT, skeletonSpaceMatrices); return a ? injectSkeletonNodes(sk, a) : null; };

test('TWO-HANDS AUDIT the left hand\'s weapon bone (finding 1): a skeleton without a Weapon Bone Left - every retail one - is given one made by the mirror from its own Weapon Bone, under the left hand, at S . Rest(Weapon Bone) . X - on the fixture arm (which carries both) exactly the authored one; on the retail biped the plan then pairs the two weapon bones; a skeleton that has one, or no Weapon Bone, is given none', () => {
  assert.equal(counterpartName('Weapon Bone'), OFF_WEAPON_BONE.toLowerCase(), 'the node the left hand\'s weapon hangs on, the Weapon Bone\'s counterpart');
  const X = { a: Float32Array.from([-1, 0, 0, 0, 1, 0, 0, 0, 1]), t: [0, 0, 0] };
  // the fixture: the authored node, and the one made with it renamed away
  const authored = buildSkeleton(parseNif(f('armfp.nif')));
  assert.equal(offWeaponBoneAddon(authored, GRAPH_ROOT, skeletonSpaceMatrices), null, 'it has one');
  const made = buildSkeleton(parseNif(noLeftBone()));
  const r = injectAddon(made);
  assert.deepEqual(r.added, ['Weapon Bone Left']);
  const wbl = made.byName.get('weapon bone left');
  assert.ok(made.nodes.get(wbl).injected);
  assert.equal(made.nodes.get(made.nodes.get(wbl).parent).name, 'Left Hand', 'under the left hand');
  assert.ok(diff(M(made, new Map()).get(wbl), M(authored, new Map()).get(authored.byName.get('weapon bone left'))) < 1e-6, 'the authored node, exactly');
  // retail: the made node at the mirror of the Weapon Bone, its own x turned back - its "Left" is rule 13's
  const sk = retail();
  injectAddon(sk);
  const rest = M(sk, new Map());
  const want = mul(mul(SofRest(sk), rest.get(sk.byName.get('weapon bone'))), X);
  const node = sk.nodes.get(sk.byName.get('weapon bone left'));
  assert.equal(node.name, 'Weapon Bone Left');
  assert.equal(sk.nodes.get(node.parent).name, 'Bip01 L Hand');
  assert.ok(diff(rest.get(sk.byName.get('weapon bone left')), want) < 1e-4, 'S . Rest(Weapon Bone) . X, the plane the skeleton\'s own middle');
  const plan = mirrorPlan(sk, GRAPH_ROOT, skeletonSpaceMatrices);
  assert.equal(plan.counterpart.get(sk.byName.get('weapon bone')), sk.byName.get('weapon bone left'), 'the weapon bones pair');
  assert.deepEqual([...plan.counterpart].filter(([, c]) => c == null).map(([q]) => sk.nodes.get(q).name), ['Shield Bone'], 'the Shield Bone alone rides');
  // the pair at rest: the left weapon's frame (x turned back, as rule 13 draws it) is the right weapon's in the mirror
  const p = new Map(); applyMirrorRig(sk, p, GRAPH_ROOT, skeletonSpaceMatrices, { limbs: { L: { pose: null, side: 'R', mirror: true } } });
  assert.ok(diffRot(mul(M(sk, p).get(sk.byName.get('weapon bone left')), X), mul(SofRest(sk), rest.get(sk.byName.get('weapon bone')))) < 1e-4);
  const none = buildSkeleton(parseNif(noWeaponBone()));
  assert.equal(offWeaponBoneAddon(none, GRAPH_ROOT, skeletonSpaceMatrices), null, 'no Weapon Bone, nothing to make one from');
});

test('TWO-HANDS the left hand\'s weapon: the right hand\'s record and mesh, hung on the Weapon Bone Left in a slot of its own (rule 13 draws it mirrored, the bow\'s law) - asked of the skeleton AS ASSEMBLED (TWO-HANDS AUDIT, finding 1: the player\'s rigs take the made bone - retail binds), the bytes where nothing else is given; on a skeleton with no such node, nothing, and a note that says why; a bow still reads the actor\'s own bytes (rule 17) and stays on the Weapon Bone', async () => {
  const files = FILES();
  const find = (p) => (files.has(p) ? { get: () => files.get(p) } : null);
  const allWeapons = [{ id: 'iron longsword', model: 'w/blade.nif', type: MW_WEAPON_TYPE.LongBladeOneHand, speed: 1 }, { id: 'long bow', model: 'w/blade.nif', type: MW_WEAPON_TYPE.MarksmanBow, speed: 1 }];
  const ok = resolveOffWeaponParts({ weapon: LONGSWORD, allWeapons, find, skeletonBytes: f('armfp.nif') });
  assert.equal(OFF_WEAPON_BONE, 'Weapon Bone Left');
  assert.deepEqual(ok.parts.map((p) => [p.slot, p.bones]), [['offweapon', ['Weapon Bone Left']]]);
  assert.equal(ok.info.bone, 'Weapon Bone Left');
  const none = resolveOffWeaponParts({ weapon: LONGSWORD, allWeapons, find, skeletonBytes: f('armskel.nif') });
  assert.deepEqual(none.parts, []);
  assert.ok(none.notes.some((n) => /^offweapon: this skeleton has no "Weapon Bone Left" bone/.test(n)), none.notes.join(' | '));
  assert.deepEqual(resolveOffWeaponParts({ weapon: null, allWeapons, find, skeletonBytes: f('armfp.nif') }), { parts: [], info: null, notes: [] });
  // retail: the bytes carry no Weapon Bone Left; the assembly the player's rigs build does
  const bytes = retailBytes();
  assert.deepEqual(resolveOffWeaponParts({ weapon: LONGSWORD, allWeapons, find, skeletonBytes: bytes }).parts, [], 'the bytes alone: none');
  const plain = await assembleFirstPersonArm({ skeletonBytes: bytes, parts: [] });
  assert.equal(plain.skeleton.byName.has('weapon bone left'), false, 'an assembly that does not ask makes none');
  const asm = await assembleFirstPersonArm({ skeletonBytes: bytes, parts: [], offWeaponBone: true });
  assert.ok(asm.skeleton.byName.has('weapon bone left'), 'the player\'s assembly carries one');
  assert.deepEqual(asm.injected.map((i) => [i.name, i.added]), [[WEAPON_BONE_LEFT_SOURCE, ['Weapon Bone Left']]], 'through the addons\' own door, said so');
  const hasBone = (n) => asm.skeleton.byName.has(String(n).toLowerCase());
  const bound = resolveOffWeaponParts({ weapon: LONGSWORD, allWeapons, find, skeletonBytes: bytes, hasBone });
  assert.deepEqual(bound.parts.map((p) => [p.slot, p.bones]), [['offweapon', ['Weapon Bone Left']]], 'asked of the assembled skeleton, it binds');
  // the bow: rule 17 reads the actor's own bytes - the made node is the pair's, never the bow's
  const BOW = { templateIndex: 130 };
  assert.equal(resolveWeaponParts({ weapon: BOW, allWeapons, find, skeletonBytes: f('armfp.nif') }).weaponInfo?.bone, 'Weapon Bone Left', 'a skeleton that carries one: the bow on it');
  assert.equal(resolveWeaponParts({ weapon: BOW, allWeapons, find, skeletonBytes: bytes }).weaponInfo?.bone, 'Weapon Bone', 'retail: the Weapon Bone, as OpenMW falls back');
});

// ---- THE ARM ------------------------------------------------------------------------------------------------------

const wpdtRec = (id, model, type, speed = 1) => {
  const A = (x) => [...x].map((c) => c.charCodeAt(0)); const Z = (x) => [...A(x), 0];
  const U = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  const sub = (n, d) => [...A(n), ...U(d.length), ...d];
  const w = new Uint8Array(32); const dv = new DataView(w.buffer); dv.setInt16(8, type, true); dv.setFloat32(12, speed, true);
  const d = [...sub('NAME', Z(id)), ...sub('MODL', Z(model)), ...sub('FNAM', Z('W')), ...sub('WPDT', [...w])];
  return Uint8Array.from([...A('WEAP'), ...U(d.length), ...U(0), ...U(0), ...d]);
};
const FILES = (skel = f('armfp.nif')) => new Map([[fpSkeletonPath({}), skel], [FP_CLIP_PATH, f('armfpweapon.kf')], ['meshes/fixture/armfphand.nif', f('armfphand.nif')], ['meshes/fixture/armfparm.nif', f('armfparm.nif')], ['meshes/w/blade.nif', f('weapon.nif')], ['textures/tx_fixture.dds', f('fixture.dds')]]);
const WEAP = wpdtRec('iron longsword', 'w/blade.nif', MW_WEAPON_TYPE.LongBladeOneHand);
const deps = (files = FILES()) => ({ loadMorrowindArchives: async () => [{ has: (p) => files.has(p), get: (p) => files.get(p) }], storedMorrowindNames: async () => ['armfp.esm', 'weap.esm'], loadMorrowindFile: async (n) => (n === 'weap.esm' ? WEAP : f('armfp.esm')) });
const cat = (...a) => { const out = new Uint8Array(a.reduce((n, b) => n + b.length, 0)); let o = 0; for (const b of a) { out.set(b, o); o += b.length; } return out; };
/** A rig WITH a third-person body: the fixture arm standing as xbase_anim too (`tpSkel`), the two BODY records, the longsword. */
function bodyDeps({ skel = f('armfp.nif'), tpSkel = skel } = {}) {
  const files = new Map([...FILES(skel), ['meshes/xbase_anim.nif', tpSkel], ['meshes/xbase_anim.kf', f('armfpweapon.kf')]]);
  const all = cat(f('armfp.esm'), bodyRec('b_fprace_m_hand', 'fixture\\armfphand.nif', 'fprace', 5), bodyRec('b_fprace_m_upperarm', 'fixture\\armfparm.nif', 'fprace', 8), WEAP);
  return { loadMorrowindArchives: async () => [{ has: (p) => files.has(p), get: (p) => files.get(p) }], storedMorrowindNames: async () => ['armfp.esm'], loadMorrowindFile: async () => all };
}
const LONGSWORD = { templateIndex: 120 };
const travel = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
/** The blow's strength is the reference's random draw where a clip has no wind-up window (windUpStrength): the arm's
 *  pins run on a seeded stream, so each reads one blow and not a different one each run - or on one fixed `draw`, where
 *  blows are measured against each other (every blow the same strength, the same follow-through). */
async function seeded(fn, draw = null) {
  const real = Math.random;
  let s = 7919;
  Math.random = draw != null ? () => draw : () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  try { return await fn(); } finally { Math.random = real; }
}

async function drawnArm({ files = FILES(), camera = () => ({ pitch: 0, pos: [0, 1.6, 0], yaw: 0 }), d = deps(files) } = {}) {
  const renderer = { gl: null, createCharacterMesh: () => ({ vao: 1, buffers: [], ranges: [] }), updateCharacterMesh: () => {}, createCharacterTexture: () => 1,
    renderCharacterSprite: () => ({ tex: {} }), drawCharacterSpriteQuad: () => {}, drawScreenOverlayQuad: () => {}, renderCharacterSpriteImage: () => ({ img: 1 }), createParticleEffect: () => ({}) };
  const arm = createFpArm();
  arm.attach(renderer, camera);
  const res = await arm.build({ race: 'fprace', weapon: LONGSWORD, deps: d });
  assert.ok(res.ok, `${res.stage} ${res.error}`);
  arm.setSheathed(false);
  for (let i = 0; i < 80; i++) arm.update(0.05);
  return arm;
}
/** A blow by `hand`, played to its end: each wrist's farthest travel from where it stood. */
function blow(arm, hand, strike = 'StrikeDown') {
  arm.update(0.05);
  const s0 = arm.handsState();
  assert.ok(arm.attack(strike, { hand }), `the ${hand} blow begins`);
  let L = 0, R = 0, mirrored = 0;
  for (let i = 0; i < 60; i++) {
    arm.update(0.05);
    const h = arm.handsState();
    L = Math.max(L, travel(s0.wrists.L, h.wrists.L)); R = Math.max(R, travel(s0.wrists.R, h.wrists.R));
    if (h.mirrored) mirrored++;
  }
  return { L, R, mirrored };
}

test('TWO-HANDS the arm, the pair: the left hand\'s weapon binds on both rigs and shows while the pair is drawn (hidden sheathed); at rest both arms up, the left the right\'s mirror; a left blow swings the LEFT arm with the right held, a right blow the right with the left held; the blow carries the hand the law gave it', () => seeded(async () => {
  const arm = await drawnArm();
  let h = arm.handsState();
  assert.equal(h.offPieces, 0, 'one hand: no second weapon');
  arm.setHands({ mode: 'dual', lead: 'R' });
  await arm.setOffWeapon(LONGSWORD);
  for (let i = 0; i < 4; i++) arm.update(0.05);
  h = arm.handsState();
  assert.equal(h.mode, 'dual');
  assert.equal(h.offPieces, 1, 'bound');
  assert.equal(h.offWeapon?.bone, 'Weapon Bone Left');
  assert.deepEqual(h.offHidden, [false], 'shown while drawn');
  assert.ok(Math.abs(h.wrists.L[0] + h.wrists.R[0]) < 0.05 && Math.abs(h.wrists.L[2] - h.wrists.R[2]) < 0.05, `the left the right's mirror at rest: ${h.wrists.L} / ${h.wrists.R}`);
  assert.equal(await arm.setOffWeapon(LONGSWORD), false, 'the same weapon: the fast path');
  const left = blow(arm, 'L');
  assert.equal(arm.handsState().attackHand, null, 'the blow ends with its hand');
  for (let i = 0; i < 20; i++) arm.update(0.05);
  const right = blow(arm, 'R');
  assert.ok(left.L > 2 * left.R, `the left blow swings the left arm (${left.L.toFixed(3)} against ${left.R.toFixed(3)})`);
  assert.ok(right.R > 2 * right.L, `the right blow the right (${right.R.toFixed(3)} against ${right.L.toFixed(3)})`);
  assert.ok(left.mirrored > 10, 'the left blow is the clip in the mirror');
  arm.setSheathed(true);
  for (let i = 0; i < 60; i++) arm.update(0.05);
  assert.deepEqual(arm.handsState().offHidden, [true], 'sheathed, the left hand\'s weapon is away with the right\'s');
  await arm.setOffWeapon(null);
  assert.equal(arm.handsState().offPieces, 0, 'and a hand emptied lets it go');
}));

test('TWO-HANDS AUDIT the arm, THE PAIR\'S GUARD (Mac: "When attacking with a weapon, the other weapon in hand should lower slightly"): while one hand of a pair strikes the other arm is lowered at its shoulder - at the blow\'s hit its wrist stands the sprite guard\'s share of the arms\' picture lower (GUARD.DOWN of 200, GUARD_LENS_DROP) - eased in fast and out slower (guardStep), the striking arm never, every bone on its parent', () => seeded(async () => {
  const arm = await drawnArm();
  arm.setHands({ mode: 'dual', lead: 'R' });
  await arm.setOffWeapon(LONGSWORD);
  for (let i = 0; i < 40; i++) arm.update(1 / 60);
  const sk = arm.built().arm.skeleton;
  const elev = (hand) => { const b = arm.built(); const eye = b.arm.mats.get(b.cameraRef).t; const w = arm.handsState().wrists[hand]; return Math.atan2(w[2] - eye[2], w[1] - eye[1]); };
  const bones = () => { const m = arm.built().arm.mats; let w = 0; for (const n of ['Left Upper Arm', 'Left Forearm', 'Left Hand']) { const r = sk.byName.get(n.toLowerCase()), node = sk.nodes.get(r); w = Math.max(w, Math.abs(dist(m.get(node.parent).t, m.get(r).t) - Math.hypot(...node.rest.translation))); } return w; };
  const rest = elev('L');
  assert.deepEqual(arm.handsState().guard, { L: 0, R: 0 }, 'at rest no arm lowered');
  assert.ok(arm.attack('StrikeDown', { hand: 'R' }));
  const g = [];
  let worst = 0;
  for (let i = 0; i < 150; i++) {
    arm.update(1 / 60);
    const h = arm.handsState();
    assert.equal(h.guard.R, 0, 'the striking arm is never lowered');
    worst = Math.max(worst, bones());
    g.push({ w: h.guard.L, e: elev('L'), u: arm.status().upperName });
  }
  const rel = g.map((r, i) => (r.u === 'AttackRelease' ? i : -1)).filter((i) => i >= 0);
  const at = rel[rel.length - 1];   // the release's last frame: the blow's hit
  const drop = rest - g[at].e;
  assert.ok(Math.abs(drop - GUARD_LENS_DROP) < 0.15 * GUARD_LENS_DROP, `at the hit the held wrist is ${drop.toFixed(4)} rad lower on the picture (the sprite guard's ${GUARD.DOWN} of 200 px: ${GUARD_LENS_DROP.toFixed(4)})`);
  assert.ok(g[2].w > 0.6, `in fast (three frames: ${g[2].w.toFixed(3)}, GUARD.IN_TAU ${GUARD.IN_TAU} s)`);
  const end = g.findIndex((r) => r.u === 'WeaponEquipped');
  assert.ok(end > at && g[end + 2].w > 0.6 && g[end + 2].w < 0.95, `out slower (three frames after the blow: ${g[end + 2].w.toFixed(3)}, GUARD.OUT_TAU ${GUARD.OUT_TAU} s)`);
  assert.ok(worst < 1e-4, `the arm lowered at its shoulder, never moved off it (${worst})`);
  assert.equal(g[g.length - 1].w, 0, 'and up again');
  assert.ok(Math.abs(g[g.length - 1].e - rest) < 0.01, `back where it rested (${g[g.length - 1].e.toFixed(4)} / ${rest.toFixed(4)})`);
}, 0.5));

test('TWO-HANDS AUDIT the arm on a skeleton WITHOUT a Weapon Bone Left (finding 1 - every retail one): both rigs take the made bone, the left weapon binds on both and the pair swings both arms; the composition stands on the pair held, not on a blade bound; a body with no Weapon Bone at all binds none and its own card says why', () => seeded(async () => {
  const renderer = { gl: null, createCharacterMesh: () => ({ vao: 1, buffers: [], ranges: [] }), updateCharacterMesh: () => {}, createCharacterTexture: () => 1, renderCharacterSprite: () => ({ tex: {} }), drawCharacterSpriteQuad: () => {}, drawScreenOverlayQuad: () => {}, renderCharacterSpriteImage: () => ({ img: 1 }), createParticleEffect: () => ({}) };
  const build = async (o) => { const arm = createFpArm(); arm.attach(renderer, () => ({ pitch: 0, pos: [0, 1.6, 0], yaw: 0 })); const res = await arm.build({ race: 'fprace', weapon: LONGSWORD, deps: bodyDeps(o) }); assert.ok(res.ok && res.third?.ok, `${res.stage} ${res.error} / ${res.third?.error}`); arm.setSheathed(false); for (let i = 0; i < 80; i++) arm.update(0.05); return arm; };
  const arm = await build({ skel: noLeftBone() });
  const fp = arm.built().arm, tp = arm.built().third.arm;
  for (const a of [fp, tp]) {
    assert.ok(a.skeleton.nodes.get(a.skeleton.byName.get('weapon bone left'))?.injected, 'each rig made its own');
    assert.ok(a.injected.some((i) => i.name === WEAPON_BONE_LEFT_SOURCE));
  }
  arm.setHands({ mode: 'dual', lead: 'R' });
  for (let i = 0; i < 20; i++) arm.update(0.05);
  let h = arm.handsState();
  assert.equal(h.offPieces, 0, 'no blade yet');
  assert.equal(h.pair, true);
  assert.ok(h.mirrored && h.composed === 'dual', 'the pair held: the left arm is the right\'s mirror before any blade binds');
  assert.ok(Math.abs(h.wrists.L[0] + h.wrists.R[0]) < 0.05, `${h.wrists.L} / ${h.wrists.R}`);
  await arm.setOffWeapon(LONGSWORD);
  for (let i = 0; i < 4; i++) arm.update(0.05);
  h = arm.handsState();
  assert.equal(h.offWeapon?.bone, 'Weapon Bone Left', 'the first-person arm binds it');
  assert.equal(arm.status().third.offWeapon?.bone, 'Weapon Bone Left', 'and the body');
  const left = blow(arm, 'L');
  assert.ok(left.mirrored > 10 && left.L > 2 * left.R, `the left blow is the left arm's (${left.L.toFixed(3)} / ${left.R.toFixed(3)})`);
  arm.setViewMode('third');
  for (let i = 0; i < 10; i++) arm.update(0.05);
  assert.deepEqual(arm.thirdMesh().ranges.filter((r) => r.slot === 'offweapon').map((r) => r.hidden), [false], 'the body draws it');
  // the body on a skeleton with no Weapon Bone: nothing made, nothing bound, and the body's notes say why
  const bare = await build({ tpSkel: noWeaponBone() });
  bare.setHands({ mode: 'dual', lead: 'R' });
  await bare.setOffWeapon(LONGSWORD);
  assert.equal(bare.built().third.arm.skeleton.byName.has('weapon bone left'), false);
  assert.equal(bare.status().third.offWeapon, null);
  assert.ok(bare.built().third.notes.some((n) => /^offweapon: /.test(n)), `the body's card: ${bare.built().third.notes.join(' | ')}`);
}));

test('TWO-HANDS the arm, the fists: a blow by the hand its clip throws with plays as the clip has it; a blow by the other is the clip in the mirror - the other fist held where the idle holds it', () => seeded(async () => {
  // PIN MOVED (TWO-HANDS AUDIT): run on a seeded stream (seeded()) - the blows' strengths are the reference's random
  // draw on this fixture (no wind-up window), and unseeded the 3x ratio below failed one run in ten at the base commit
  // too (2.67x at the worst draw, measured over forty streams)
  const arm = await drawnArm();
  arm.setHands({ mode: 'fists', lead: 'R' });
  const same = blow(arm, 'R');
  for (let i = 0; i < 20; i++) arm.update(0.05);
  const other = blow(arm, 'L');
  assert.equal(same.mirrored, 0, 'the clip\'s own hand: as authored');
  assert.ok(other.mirrored > 10, 'the other hand: in the mirror');
  assert.ok(other.L > 3 * other.R, `the left fist throws it (${other.L.toFixed(3)} against ${other.R.toFixed(3)})`);
  arm.setHands({ mode: 'single' });
  for (let i = 0; i < 20; i++) arm.update(0.05);
  assert.equal(blow(arm, 'L').mirrored, 0, 'one hand in use: no mirror whatever the blow says');
}));

test('TWO-HANDS AUDIT the arm, A MIRRORED BLOW KEEPS THE WAY ASKED (finding 5): a left hand\'s slash is the right hand\'s MIRROR strike in the glass (handsLaw.js mirrorStrike, the sprite lane\'s law) - its StrikeLeft the right\'s backhand, its StrikeRight the right\'s forehand - frame for frame; the blow not in the mirror keeps its own way', () => seeded(async () => {
  const arm = await drawnArm();
  arm.setHands({ mode: 'dual', lead: 'R' });
  await arm.setOffWeapon(LONGSWORD);
  for (let i = 0; i < 10; i++) arm.update(0.05);
  const run = (hand, strike) => {
    for (let i = 0; i < 40; i++) arm.update(0.05);
    assert.ok(arm.attack(strike, { hand }));
    const reversed = arm.status().attackReversed;
    const path = [];
    for (let i = 0; i < 200 && /^Attack/.test(arm.status().upperName); i++) { arm.update(0.02); path.push(arm.handsState().wrists[hand].slice()); }
    return { reversed, path };
  };
  const b = {};
  for (const strike of ['StrikeLeft', 'StrikeRight']) for (const hand of ['R', 'L']) b[`${hand}:${strike}`] = run(hand, strike);
  assert.deepEqual(Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.reversed])), { 'R:StrikeLeft': false, 'L:StrikeLeft': true, 'R:StrikeRight': true, 'L:StrikeRight': false },
    'the backhand is the right\'s StrikeRight and the left\'s StrikeLeft');
  // the fixture is its own mirror about x = 0: the left wrist's path against the right's, x negated
  const mirrorMiss = (a, c) => { const n = Math.min(a.length, c.length); let w = 0; for (let i = 3; i < n; i++) w = Math.max(w, Math.hypot(a[i][0] + c[i][0], a[i][1] - c[i][1], a[i][2] - c[i][2])); return w; };
  for (const [l, law, bug] of [['L:StrikeLeft', 'R:StrikeRight', 'R:StrikeLeft'], ['L:StrikeRight', 'R:StrikeLeft', 'R:StrikeRight']]) {
    const asked = mirrorMiss(b[l].path, b[law].path), played = mirrorMiss(b[l].path, b[bug].path);
    assert.equal(b[l].path.length, b[law].path.length, `${l}: the mirror strike's clip, its length`);
    assert.ok(asked < 0.5 * played, `${l} is ${law} in the glass (${asked.toFixed(4)}), not ${bug} (${played.toFixed(4)})`);
  }
  // one hand in use: a blow the rig hands a hand to is not mirrored, and keeps its own way
  arm.setHands({ mode: 'single' });
  for (let i = 0; i < 40; i++) arm.update(0.05);
  assert.ok(arm.attack('StrikeLeft', { hand: 'L' }));
  assert.equal(arm.status().attackReversed, false);
}, 0.5));

test('TWO-HANDS the arm, the running hands: running with nothing in hand the pump takes the hands (up as the run starts, posed past half), the two wrists out of step with the stride; a punch takes them at once; the run\'s end lets them go; third person never; the rig\'s own stride phase (the head bob\'s clock) is taken as it stands, the speed\'s walk where it hands none', () => seeded(async () => {
  const arm = await drawnArm();
  arm.setHands({ mode: 'fists', lead: 'R' });
  arm.setSheathed(true);
  for (let i = 0; i < 60; i++) arm.update(0.05);
  assert.equal(arm.runPosed(), false);
  arm.setRunHands(true, { speed: 7 });
  const zs = { L: [], R: [] };
  for (let i = 0; i < 60; i++) { arm.update(1 / 30); const h = arm.handsState(); zs.L.push(h.wrists.L[2]); zs.R.push(h.wrists.R[2]); }
  assert.equal(arm.runPosed(), true);
  assert.ok(arm.handsState().run.w > 0.99);
  const hw = arm.handsState().wrists;
  assert.ok(hw.L[0] < 0 && hw.R[0] > 0, 'each hand pumps on its own side');
  const span = (a) => Math.max(...a.slice(20)) - Math.min(...a.slice(20));
  assert.ok(span(zs.L) > 0.1 && span(zs.R) > 0.1, `both pump (${span(zs.L).toFixed(3)}, ${span(zs.R).toFixed(3)})`);
  let opposite = 0, n = 0;
  for (let i = 21; i < 60; i++) { const a = zs.L[i] - zs.L[i - 1], b = zs.R[i] - zs.R[i - 1]; if (Math.abs(a) > 1e-3 && Math.abs(b) > 1e-3) { n++; if (Math.sign(a) !== Math.sign(b)) opposite++; } }
  assert.ok(opposite / n > 0.8, `out of step (${opposite}/${n})`);
  // the rig's phase: held exactly, the hands still on it; another phase, another stroke; none handed, the walk again
  arm.setRunHands(true, { speed: 7, phase: 2.5 });
  for (let i = 0; i < 30; i++) arm.update(1 / 30);
  assert.equal(arm.handsState().run.phase, 2.5, 'the phase the rig hands is the stroke\'s');
  const still = arm.handsState().wrists;
  arm.setRunHands(true, { speed: 7, phase: 2.5 }); arm.update(1 / 30);
  assert.ok(travel(still.R, arm.handsState().wrists.R) < 1e-3, 'a phase that stands, hands that stand');
  arm.setRunHands(true, { speed: 7, phase: 2.5 + Math.PI / 2 });
  for (let i = 0; i < 30; i++) arm.update(1 / 30);
  assert.ok(travel(still.R, arm.handsState().wrists.R) > 0.05, 'another phase, the hand elsewhere in its stroke');
  arm.setRunHands(true, { speed: 7 });
  const p0 = arm.handsState().run.phase;
  arm.update(1 / 30);
  assert.ok(arm.handsState().run.phase !== p0, 'no phase handed: the speed walks it');
  arm.setRunHands(false);
  for (let i = 0; i < 60; i++) arm.update(1 / 30);
  assert.equal(arm.runPosed(), false);
  assert.equal(arm.handsState().run.w, 0, 'let go');
  // a punch takes the hands at once
  arm.setSheathed(false);
  for (let i = 0; i < 80; i++) arm.update(0.05);
  arm.setRunHands(true, { speed: 7 });
  for (let i = 0; i < 30; i++) arm.update(1 / 30);
  assert.ok(arm.handsState().run.w > 0.9);
  arm.attack('StrikeDown', { hand: 'R' });
  for (let i = 0; i < 6; i++) arm.update(1 / 30);
  assert.ok(arm.handsState().run.w < 0.05, 'the punch is the fist\'s own');
}));

test('TWO-HANDS AUDIT the arm, THE RUN AND THE CLIMB BLEND (finding 4): onto the wall from a run the hands step as the climb\'s own ease steps (no frame drops the run whole), off it onto a run no frame jumps, and the frame a sheet comes up mid-run the hands move as they were moving', () => seeded(async () => {
  const climb = { feet: [0, 0, 0], yaw: 0, track: null, floorGap: Infinity, mode: 'hang', classic: false, normal: [0, 0, -1], lipY: 1.9, move: null, grip: 1, flight: null };
  let onWall = false;
  const arm = await drawnArm({ camera: () => ({ pitch: 0, pos: [0, 1.6, 0], yaw: 0, climb: onWall ? climb : null }) });
  arm.setHands({ mode: 'fists', lead: 'R' });
  arm.setSheathed(true);
  for (let i = 0; i < 40; i++) arm.update(1 / 60);
  arm.setRunHands(true, { speed: 7 });
  let prev = arm.handsState().wrists, steady = 0;
  const step = () => { arm.update(1 / 60); const w = arm.handsState().wrists; const d = Math.max(travel(prev.L, w.L), travel(prev.R, w.R)); prev = w; return d; };
  for (let i = 0; i < 120; i++) { const d = step(); if (i >= 60) steady = Math.max(steady, d); }
  arm.setRunHands(false); onWall = true;
  const on = []; for (let i = 0; i < 60; i++) on.push(step());
  // the climb's ease is geometric: each step a share of the last. The run dropped whole made the first step four times the next.
  assert.ok(on[0] < 2 * on[1], `onto the wall: ${on.slice(0, 4).map((v) => v.toFixed(3)).join(' ')}`);
  for (let i = 2; i < 20; i++) assert.ok(on[i] <= on[i - 1] * 1.05 + 1e-3, `and eases on (${i}: ${on[i].toFixed(3)} after ${on[i - 1].toFixed(3)})`);
  onWall = false; arm.setRunHands(true, { speed: 7 });
  const off = []; for (let i = 0; i < 90; i++) off.push(step());
  for (let i = 1; i < off.length; i++) assert.ok(off[i] < 2 * Math.max(off[i - 1], steady), `off the wall, frame ${i}: ${off[i].toFixed(3)} after ${off[i - 1].toFixed(3)} (the run came back whole as the climb let go)`);
  // the sheet: the rig's runHandsWanted drops the run as the map comes up, and the run eases out under it
  for (let i = 0; i < 60; i++) step();
  arm.setRunHands(false);
  assert.ok(arm.holdPaper());
  const sheet = step();
  assert.ok(sheet < 2 * steady, `the frame the sheet comes up: ${sheet.toFixed(3)} (a running stroke steps ${steady.toFixed(3)})`);
}));

test('TWO-HANDS AUDIT the arm, THE RUN ON THE LENS (finding 11): with the arms on the law (follow-camera off) the running hands are asked for the same places ON THE PICTURE whichever way the player looks - their lines laid in the pitched lens\'s frame - and the wrists stand there', () => seeded(async () => {
  let pitch = 0;
  const arm = await drawnArm({ camera: () => ({ pitch, pos: [0, 1.6, 0], yaw: 0 }) });
  arm.setFollowCamera(false);
  try {
    arm.setHands({ mode: 'fists', lead: 'R' });
    arm.setSheathed(true);
    for (let i = 0; i < 40; i++) arm.update(1 / 60);
    // a phase that stands, so each look reads the same stroke
    arm.setRunHands(true, { speed: 7, phase: 1 });
    const onLens = (eye, p) => { const d = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]]; const fwd = [0, Math.cos(pitch), Math.sin(pitch)], up = [0, -Math.sin(pitch), Math.cos(pitch)]; return Math.atan2(d[0] * up[0] + d[1] * up[1] + d[2] * up[2], d[0] * fwd[0] + d[1] * fwd[1] + d[2] * fwd[2]); };
    const read = {};
    for (const p of [0, -0.5, 0.5]) {
      pitch = p;
      for (let i = 0; i < 120; i++) arm.update(1 / 60);
      const t = arm.handsState().run.targets;
      const b = arm.built(), eye = b.arm.mats.get(b.cameraRef).t;
      read[p] = { asked: onLens(t.eye, t.R), wrist: onLens(eye, arm.handsState().wrists.R) };
    }
    for (const p of [-0.5, 0.5]) {
      assert.ok(Math.abs(read[p].asked - read[0].asked) < 1e-6, `look ${p}: the stroke asked for at ${read[p].asked.toFixed(4)} rad up the picture, as at 0 (${read[0].asked.toFixed(4)})`);
      assert.ok(Math.abs(read[p].wrist - read[0].wrist) < 0.06, `look ${p}: the wrist ${read[p].wrist.toFixed(3)} rad, at 0 ${read[0].wrist.toFixed(3)} (laid unpitched it moved 0.4)`);
    }
  } finally { arm.setFollowCamera(true); }
}));

test('TWO-HANDS AUDIT the arm, THE PAIR\'S DRAW (finding 7): the second arm is composed from the first frame of the right hand\'s draw to the last of its sheathe - the blades come and go at the right\'s attach and detach keys', () => seeded(async () => {
  const arm = await drawnArm();
  arm.setHands({ mode: 'dual', lead: 'R' });
  await arm.setOffWeapon(LONGSWORD);
  for (let i = 0; i < 40; i++) arm.update(1 / 60);
  for (const [sheathe, section] of [[true, 'Unequipping'], [false, 'Equipping']]) {
    arm.setSheathed(sheathe);
    let frames = 0, bladeless = 0;
    for (let i = 0; i < 90; i++) {
      arm.update(1 / 60);
      const s = arm.status(), h = arm.handsState();
      if (s.upperName !== section) continue;
      frames++;
      assert.equal(h.pair, true, `${section}, frame ${i}: the pair is in the hands`);
      assert.equal(h.composed, 'dual', `${section}, frame ${i}: the left arm the right's mirror`);
      assert.deepEqual(h.offHidden, [!s.weaponShown], `${section}, frame ${i}: the left blade with the right`);
      if (!s.weaponShown) bladeless++;
    }
    assert.ok(frames > 5 && bladeless > 2, `${section}: ${frames} frames, ${bladeless} of them before the attach or after the detach`);
    for (let i = 0; i < 60; i++) arm.update(1 / 60);
  }
  arm.setSheathed(true);
  for (let i = 0; i < 90; i++) arm.update(1 / 60);
  assert.equal(arm.handsState().pair, false, 'sheathed: no pair in the hands');
  assert.equal(arm.handsState().composed, 'none');
}));

test('TWO-HANDS AUDIT the arm, A VIEW SWITCH CARRIES NOTHING (finding 6): back in first person after a spell in third, the arms stand in their composition on the first frame - not eased in from where they stood when the player left', () => seeded(async () => {
  const renderer = { gl: null, createCharacterMesh: () => ({ vao: 1, buffers: [], ranges: [] }), updateCharacterMesh: () => {}, createCharacterTexture: () => 1, renderCharacterSprite: () => ({ tex: {} }), drawCharacterSpriteQuad: () => {}, drawScreenOverlayQuad: () => {}, renderCharacterSpriteImage: () => ({ img: 1 }), createParticleEffect: () => ({}) };
  const arm = createFpArm();
  arm.attach(renderer, () => ({ pitch: 0, pos: [0, 1.6, 0], yaw: 0 }));
  assert.ok((await arm.build({ race: 'fprace', weapon: LONGSWORD, deps: bodyDeps() })).ok);
  arm.setSheathed(false);
  for (let i = 0; i < 60; i++) arm.update(0.05);
  arm.setHands({ mode: 'dual', lead: 'R' });
  await arm.setOffWeapon(LONGSWORD);
  for (let i = 0; i < 40; i++) arm.update(0.05);
  arm.attack('StrikeDown', { hand: 'L' });
  for (let i = 0; i < 6; i++) arm.update(0.05);
  const leaving = arm.handsState().wrists.L.slice();
  assert.ok(arm.setViewMode('third'));
  arm.setSheathed(true);
  for (let i = 0; i < 120; i++) arm.update(0.05);
  assert.ok(arm.setViewMode('first'));
  arm.update(0.05);
  const first = arm.handsState().wrists.L.slice();
  for (let i = 0; i < 60; i++) arm.update(0.05);
  const settled = arm.handsState().wrists.L.slice();
  assert.ok(travel(leaving, settled) > 0.1, 'the arm left mid-blow, far from where it settles');
  assert.ok(travel(first, settled) < 1e-3, `the first frame back is its own pose (${travel(first, settled).toFixed(4)} off; the stale carry put it 0.317 off)`);
}));

test('TWO-HANDS AUDIT the arm, THE PORTRAIT\'S PAIR (finding 8): the inventory\'s figure shows the left hand\'s weapon while a pair is carried - drawn or not, from either view - with both arms up, the left the right\'s mirror; one weapon carried, none', () => seeded(async () => {
  const flags = (arm) => Object.fromEntries(arm.thirdMesh().ranges.filter((r) => r.slot === 'weapon' || r.slot === 'offweapon').map((r) => [r.slot, r.hidden ? 'hidden' : 'shown']));
  const renderer = { gl: null, createCharacterMesh: () => ({ vao: 1, buffers: [], ranges: [] }), updateCharacterMesh: () => {}, createCharacterTexture: () => 1, renderCharacterSprite: () => ({ tex: {} }), drawCharacterSpriteQuad: () => {}, drawScreenOverlayQuad: () => {}, renderCharacterSpriteImage: () => ({ img: 1 }), createParticleEffect: () => ({}) };
  for (const view of ['first', 'third']) {
    const arm = createFpArm();
    arm.attach(renderer, () => ({ pitch: 0, pos: [0, 1.6, 0], yaw: 0 }));
    assert.ok((await arm.build({ race: 'fprace', weapon: LONGSWORD, deps: bodyDeps() })).ok);
    arm.setSheathed(false);
    for (let i = 0; i < 40; i++) arm.update(0.05);
    arm.setHands({ mode: 'dual', lead: 'R' });
    await arm.setOffWeapon(LONGSWORD);
    if (view === 'third') arm.setViewMode('third');
    for (let i = 0; i < 20; i++) arm.update(0.05);
    arm.setSheathed(true);
    for (let i = 0; i < 60; i++) arm.update(0.05);
    assert.ok(arm.figure({ yaw: 0, height: 128 }));
    assert.deepEqual(flags(arm), { weapon: 'shown', offweapon: 'shown' }, `opened from ${view} person, the pair sheathed`);
    const t = arm.built().third.arm, sk = t.skeleton;
    const L = t.mats.get(sk.byName.get('left hand')).t, R = t.mats.get(sk.byName.get('right hand')).t;
    assert.ok(Math.abs(L[0] + R[0]) < 1e-3 && Math.abs(L[1] - R[1]) < 1e-3 && Math.abs(L[2] - R[2]) < 1e-3, `both arms up, mirrored: ${L} / ${R}`);
    // the fixture's drawn idle is its own mirror, so the pose above cannot tell: the body says what the mirror wrote
    const leftArm = mirrorPlan(sk, GRAPH_ROOT, skeletonSpaceMatrices).arms.L;
    assert.deepEqual([...(t.mirrored ?? [])].sort(), [...leftArm].sort(), 'posed with the pair\'s composition: the left arm the right\'s mirror');
    arm.setHands({ mode: 'single' });
    assert.ok(arm.figure({ yaw: 0, height: 128 }));
    assert.equal(flags(arm).offweapon, 'hidden', 'one weapon carried: no second');
    assert.equal(arm.built().third.arm.mirrored, null, 'and no mirror');
  }
}));

test('TWO-HANDS AUDIT the arm, A FAILED LEFT-HAND SWAP IS ASKED AGAIN (finding 9): a read that failed refuses that weapon until another is asked, as setWeapon\'s law has it - not for the life of the rig', () => seeded(async () => {
  const d = deps();
  const arm = await drawnArm({ d });
  arm.setHands({ mode: 'dual', lead: 'R' });
  const real = d.loadMorrowindArchives;
  let fail = true;
  d.loadMorrowindArchives = async () => { if (fail) { fail = false; throw new Error('a transient read error'); } return real(); };
  const DAGGER = { templateIndex: 113 };
  assert.notEqual(fpWeaponKey(DAGGER, false), fpWeaponKey(LONGSWORD, false));
  assert.equal(await arm.setOffWeapon(LONGSWORD), false, 'the read fails');
  assert.equal(arm.handsState().offPieces, 0);
  assert.equal(await arm.setOffWeapon(LONGSWORD), false, 'the same weapon is not asked again at once (the frame door)');
  assert.equal(await arm.setOffWeapon(DAGGER), true, 'another weapon asks');
  assert.equal(await arm.setOffWeapon(LONGSWORD), true, 'and the one that failed asks again after it');
  assert.equal(arm.handsState().offKey, fpWeaponKey(LONGSWORD, false));
  assert.equal(arm.handsState().offPieces, 1);
}));

test('TWO-HANDS the arm, by source: the mirror is posed over the clip ahead of the neck and the climb (the assembly\'s own hook), both rigs ask it, the run is solved under the climb\'s request in the same slot (TWO-HANDS AUDIT: blended, never chosen), and the rig hands the arm the hands\' mode, the left hand\'s weapon and the blow\'s hand every frame', () => {
  const fp = rd('src/formats/mwFirstPerson.js');
  assert.match(fp, /const pose = fns\.poseSkeleton\(skeleton, tracks, sampleTrack, time, \{ accumRoot \}\);\n(?:\s*\/\/[^\n]*\n)*\s*assembly\.mirrored = mirror \? applyMirrorRig\(skeleton, pose, GRAPH_ROOT, fns\.skelMats, mirrorWithPoses\(mirror, fns, skeleton, accumRoot\)\) : null;\n(?:\s*\/\/[^\n]*\n)*\s*applyFirstPersonNeck\(/);
  assert.match(fp, /applyFirstPersonNeck\([^\n]*\n(?:\s*\/\/[^\n]*\n)*\s*assembly\.runFit = run \? applyClimbRig\(skeleton, pose, GRAPH_ROOT, fns\.skelMats, run\) : null;\n(?:\s*\/\/[^\n]*\n)*\s*assembly\.climbFit = climb \? applyClimbRig/, 'the run under the climb, after the neck');
  const arm = rd('src/combat/fpArm.js');
  assert.equal((arm.match(/mirror: mirrorFor\('(first|third)', /g) ?? []).length, 2, 'both views');
  // PIN MOVED (TWO-HANDS AUDIT, finding 4): the slot took the climb OR the run (`climb: held ? null : (firstClimb(climbWorld,
  // cam) ?? firstRun(cam)),`) and dropped the run whole the frame a climb began; now both, the run under the climb
  assert.match(arm, /const fClimb = held \? null : firstClimb\(climbWorld, cam\);/);
  assert.match(arm, /climb: fClimb,\n(?:\s*\/\/[^\n]*\n)*\s*run: firstRun\(cam\),/);
  assert.match(arm, /else if \(r\.slot === 'offweapon'\) r\.hidden = !offShown\(built\);/);
  assert.match(arm, /else if \(r\.slot === 'offweapon'\) r\.hidden = !offShown\(t\) \|\| climbHands;/);
  assert.match(arm, /if \(\(held \|\| climbHands\) && r\.slot === 'offweapon'\) r\.hidden = true;/);
  const rig = rd('src/combat/weaponRig.js');
  assert.match(rig, /const armItem = pairUp\(\) \? playerWeapon\.handItem\('R'\) : playerWeapon\.weapon;/);
  assert.match(rig, /fpArm\.setHands\(\{ mode: pairUp\(\) \? playerWeapon\.handsMode : HANDS_MODE\.Single, lead: playerWeapon\.leadHand \}\);/);
  assert.match(rig, /fpArm\.setOffWeapon\(pairUp\(\) && playerWeapon\.handsMode === HANDS_MODE\.Dual \? playerWeapon\.handItem\('L'\) : null\);/);
  assert.match(rig, /hand: pairUp\(\) \? playerWeapon\.strike\?\.hand \?\? null : null \}\);/);
  assert.match(rig, /fpArm\.setRunHands\?\.\(wanted, \{ speed, phase: Number\.isFinite\(mv\.bobTimer\) \? runPhaseOfBob\(mv\.bobTimer\) : null \}\);/);   // PIN MOVED (TWO-HANDS AUDIT): the arms on the head bob's clock
  assert.match(rig, /const armsRun = fpArm\.active\(\) && !!fpArm\.runPosed\?\.\(\);/);
});

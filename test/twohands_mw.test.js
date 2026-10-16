// TWO-HANDS, THE MORROWIND LANE (2026-10-16, bible/05-Combat/Two-Hands.md): the second hand on the 3D body - an arm, or
// the whole body, as the mirror of another (combat/mirrorRig.js) on the vendored retail biped (Weapon Sheathing's
// xbase_anim, bones along their local X) and the fixture rig; the left hand's weapon on the Weapon Bone Left
// (combat/fpArm.js resolveOffWeaponParts, setOffWeapon); the left-hand blow, the fists' mirror, and the running hands
// through the real arm's update. The sprite lane's pins are test/twohands.test.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseNif } from '../src/formats/mwNifFile.js';
import { buildSkeleton, poseSkeleton, skeletonSpaceMatrices, GRAPH_ROOT } from '../src/formats/mwSkin.js';
import { mat33Mul } from '../src/formats/mwNifMesh.js';
import { applyMirrorRig, mirrorPlan, counterpartName, strikingSide } from '../src/combat/mirrorRig.js';
import { rotAxisAngle } from '../src/combat/climbRig.js';
import { createFpArm, fpSkeletonPath, FP_CLIP_PATH, resolveOffWeaponParts, OFF_WEAPON_BONE } from '../src/combat/fpArm.js';
import { MW_WEAPON_TYPE } from '../src/formats/mwFirstPerson.js';

const rd = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const f = (n) => new Uint8Array(readFileSync(new URL(`./fixtures/mw/${n}`, import.meta.url)));
const RETAIL = 'vendor/weapon-sheathing/Data Files/Animations/xbase_anim/xbase_anim_sh.nif';
const retail = () => buildSkeleton(parseNif(new Uint8Array(readFileSync(new URL('../' + RETAIL, import.meta.url)))));
const M = (sk, pose) => skeletonSpaceMatrices(sk, pose, GRAPH_ROOT);

// the affine algebra the law is stated in, restated here (an independent oracle)
const app = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const mul = (A, B) => { const t = app(A.a, B.t); return { a: mat33Mul(A.a, B.a), t: [t[0] + A.t[0], t[1] + A.t[1], t[2] + A.t[2]] }; };
const inv = (A) => { const a = A.a, s2 = Math.hypot(a[0], a[3], a[6]) ** 2; const ia = [a[0] / s2, a[3] / s2, a[6] / s2, a[1] / s2, a[4] / s2, a[7] / s2, a[2] / s2, a[5] / s2, a[8] / s2]; const t = app(ia, A.t); return { a: ia, t: [-t[0], -t[1], -t[2]] }; };
const diff = (A, B) => { let w = 0; for (let i = 0; i < 9; i++) w = Math.max(w, Math.abs(A.a[i] - B.a[i])); for (let i = 0; i < 3; i++) w = Math.max(w, Math.abs(A.t[i] - B.t[i])); return w; };
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

test('TWO-HANDS mirror, THE LAW on the retail biped: at rest it is the rest; an arm set as the other\'s mirror carries the other\'s SKIN DELTA in the mirror bone for bone (posed . rest^-1 = S . (posed . rest^-1) of the counterpart . S - every vertex of it lands at the mirror of the other\'s); the arm it reads untouched; the whole body mirrored twice is the body', () => {
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
  for (const ref of plan.arms.L) {
    const c = plan.counterpart.get(ref);
    if (c == null) continue;
    const dl = mul(got.get(ref), inv(rest.get(ref)));
    const dr = mul(mul(plan.S, mul(src.get(c), inv(rest.get(c)))), plan.S);
    assert.ok(diff(dl, dr) < 5e-4, `${sk.nodes.get(ref).name}: ${diff(dl, dr)}`);
  }
  for (const ref of plan.arms.R) assert.ok(diff(got.get(ref), src.get(ref)) < 1e-6, 'the right arm stands as the clip has it');
  const p2 = new Map(pose);
  applyMirrorRig(sk, p2, GRAPH_ROOT, skeletonSpaceMatrices, { full: true });
  assert.ok(diff(M(sk, p2).get(plan.hands.L), mul(mul(plan.S, mul(src.get(plan.hands.R), inv(rest.get(plan.hands.R)))), mul(plan.S, rest.get(plan.hands.L)))) < 5e-4, 'the full mirror: the left hand takes the right\'s');
  applyMirrorRig(sk, p2, GRAPH_ROOT, skeletonSpaceMatrices, { full: true });
  for (const [ref, m] of src) assert.ok(diff(M(sk, p2).get(ref), m) < 2e-3, `twice is the body: ${sk.nodes.get(ref)?.name ?? ref}`);
  // an arm COPIED from another pose stands where that pose puts it, whatever the body under it
  const other = bentRight(sk, plan);
  const p3 = new Map();
  applyMirrorRig(sk, p3, GRAPH_ROOT, skeletonSpaceMatrices, { limbs: { R: { pose: other, side: 'R', mirror: false } } });
  const want = M(sk, other);
  for (const ref of plan.arms.R) assert.ok(diff(M(sk, p3).get(ref), want.get(ref)) < 1e-4, 'copied absolutely');
  assert.equal(applyMirrorRig(sk, new Map(), GRAPH_ROOT, skeletonSpaceMatrices, {}), null, 'nothing asked, nothing written');
});

test('TWO-HANDS mirror, NO POP: a new composition starts from where the arm was drawn last frame and eases onto its own place over the carry\'s time constant (ClimbPose\'s limb law); a composition that ends eases back to the clip', () => {
  const sk = retail();
  const plan = mirrorPlan(sk, GRAPH_ROOT, skeletonSpaceMatrices);
  const clip = bentRight(sk, plan);
  const state = {};
  const frame = (req, dt = 1 / 60) => { const p = new Map(clip); applyMirrorRig(sk, p, GRAPH_ROOT, skeletonSpaceMatrices, { ...req, carry: { ...req.carry, dt, tau: 0.06, state } }); return M(sk, p); };
  // the right hand: as the clip bends it under A (the left arm set as its mirror), the left's rest in the mirror under B
  const A = { limbs: { L: { pose: null, side: 'R', mirror: true } }, carry: { key: 'A' } };
  const B = { full: true, carry: { key: 'B' } };
  let m = null;
  for (let i = 0; i < 30; i++) m = frame(A);
  const lastA = m.get(plan.hands.R);
  const firstB = frame(B).get(plan.hands.R);
  assert.ok(diff(firstB, lastA) < 1e-3, 'the first frame of the new composition is where the last one left the hand');
  const pT = new Map(clip); applyMirrorRig(sk, pT, GRAPH_ROOT, skeletonSpaceMatrices, { full: true });
  const target = M(sk, pT).get(plan.hands.R);
  const secondB = frame(B).get(plan.hands.R);
  assert.ok(diff(target, lastA) > 0.1, 'the compositions differ for this hand');
  assert.ok(diff(secondB, lastA) < 0.5 * diff(target, lastA), 'and eases - it does not snap on the next');
  for (let i = 0; i < 90; i++) m = frame(B);
  const pB = new Map(clip); applyMirrorRig(sk, pB, GRAPH_ROOT, skeletonSpaceMatrices, { full: true });
  assert.ok(diff(m.get(plan.hands.R), M(sk, pB).get(plan.hands.R)) < 1e-3, 'and it settles on its own');
  // the composition ends: back to the clip, eased
  const firstNone = frame({ carry: { key: 'none' } }).get(plan.hands.R);
  assert.ok(diff(firstNone, m.get(plan.hands.R)) < 1e-3, 'no pop on the way out either');
  for (let i = 0; i < 90; i++) frame({ carry: { key: 'none' } });
  assert.equal(state.last, null, 'and then nothing is carried');
  const p = new Map(clip);
  assert.equal(applyMirrorRig(sk, p, GRAPH_ROOT, skeletonSpaceMatrices, { carry: { key: 'none', dt: 1 / 60, tau: 0.06, state } }), null, 'the clip stands');
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

// ---- THE ARM ------------------------------------------------------------------------------------------------------

const wpdtRec = (id, model, type, speed = 1) => {
  const A = (x) => [...x].map((c) => c.charCodeAt(0)); const Z = (x) => [...A(x), 0];
  const U = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  const sub = (n, d) => [...A(n), ...U(d.length), ...d];
  const w = new Uint8Array(32); const dv = new DataView(w.buffer); dv.setInt16(8, type, true); dv.setFloat32(12, speed, true);
  const d = [...sub('NAME', Z(id)), ...sub('MODL', Z(model)), ...sub('FNAM', Z('W')), ...sub('WPDT', [...w])];
  return Uint8Array.from([...A('WEAP'), ...U(d.length), ...U(0), ...U(0), ...d]);
};
const FILES = () => new Map([[fpSkeletonPath({}), f('armfp.nif')], [FP_CLIP_PATH, f('armfpweapon.kf')], ['meshes/fixture/armfphand.nif', f('armfphand.nif')], ['meshes/fixture/armfparm.nif', f('armfparm.nif')], ['meshes/w/blade.nif', f('weapon.nif')], ['textures/tx_fixture.dds', f('fixture.dds')]]);
const WEAP = wpdtRec('iron longsword', 'w/blade.nif', MW_WEAPON_TYPE.LongBladeOneHand);
const deps = (files = FILES()) => ({ loadMorrowindArchives: async () => [{ has: (p) => files.has(p), get: (p) => files.get(p) }], storedMorrowindNames: async () => ['armfp.esm', 'weap.esm'], loadMorrowindFile: async (n) => (n === 'weap.esm' ? WEAP : f('armfp.esm')) });
const LONGSWORD = { templateIndex: 120 };
const travel = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

test('TWO-HANDS the left hand\'s weapon: the right hand\'s record and mesh, hung on the Weapon Bone Left in a slot of its own (rule 13 draws it mirrored, the bow\'s law) - and on a skeleton with no such node, nothing, and a note that says why', () => {
  const files = FILES();
  const find = (p) => (files.has(p) ? { get: () => files.get(p) } : null);
  const allWeapons = [{ id: 'iron longsword', model: 'w/blade.nif', type: MW_WEAPON_TYPE.LongBladeOneHand, speed: 1 }];
  const ok = resolveOffWeaponParts({ weapon: LONGSWORD, allWeapons, find, skeletonBytes: f('armfp.nif') });
  assert.equal(OFF_WEAPON_BONE, 'Weapon Bone Left');
  assert.deepEqual(ok.parts.map((p) => [p.slot, p.bones]), [['offweapon', ['Weapon Bone Left']]]);
  assert.equal(ok.info.bone, 'Weapon Bone Left');
  const none = resolveOffWeaponParts({ weapon: LONGSWORD, allWeapons, find, skeletonBytes: f('armskel.nif') });
  assert.deepEqual(none.parts, []);
  assert.ok(none.notes.some((n) => /^offweapon: this skeleton has no "Weapon Bone Left" bone/.test(n)), none.notes.join(' | '));
  assert.deepEqual(resolveOffWeaponParts({ weapon: null, allWeapons, find, skeletonBytes: f('armfp.nif') }), { parts: [], info: null, notes: [] });
});

async function drawnArm() {
  const renderer = { gl: null, createCharacterMesh: () => ({ vao: 1, buffers: [], ranges: [] }), updateCharacterMesh: () => {}, createCharacterTexture: () => 1 };
  const arm = createFpArm();
  arm.attach(renderer, () => ({ pitch: 0, pos: [0, 1.6, 0], yaw: 0 }));
  const res = await arm.build({ race: 'fprace', weapon: LONGSWORD, deps: deps() });
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

test('TWO-HANDS the arm, the pair: the left hand\'s weapon binds on both rigs and shows while the pair is drawn (hidden sheathed); at rest both arms up, the left the right\'s mirror; a left blow swings the LEFT arm with the right held, a right blow the right with the left held; the blow carries the hand the law gave it', async () => {
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
});

test('TWO-HANDS the arm, the fists: a blow by the hand its clip throws with plays as the clip has it; a blow by the other is the clip in the mirror - the other fist held where the idle holds it', async () => {
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
});

test('TWO-HANDS the arm, the running hands: running with nothing in hand the pump takes the hands (up as the run starts, posed past half), the two wrists out of step with the stride; a punch takes them at once; the run\'s end lets them go; third person never', async () => {
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
});

test('TWO-HANDS the arm, by source: the mirror is posed over the clip ahead of the neck and the climb (the assembly\'s own hook), both rigs ask it, the first-person climb slot carries the run off the stone, and the rig hands the arm the hands\' mode, the left hand\'s weapon and the blow\'s hand every frame', () => {
  const fp = rd('src/formats/mwFirstPerson.js');
  assert.match(fp, /const pose = fns\.poseSkeleton\(skeleton, tracks, sampleTrack, time, \{ accumRoot \}\);\n(?:\s*\/\/[^\n]*\n)*\s*assembly\.mirrored = mirror \? applyMirrorRig\(skeleton, pose, GRAPH_ROOT, fns\.skelMats, mirrorWithPoses\(mirror, fns, skeleton, accumRoot\)\) : null;\n(?:\s*\/\/[^\n]*\n)*\s*applyFirstPersonNeck\(/);
  const arm = rd('src/combat/fpArm.js');
  assert.equal((arm.match(/mirror: mirrorFor\('(first|third)', /g) ?? []).length, 2, 'both views');
  assert.match(arm, /climb: held \? null : \(firstClimb\(climbWorld, cam\) \?\? firstRun\(cam\)\),/);
  assert.match(arm, /else if \(r\.slot === 'offweapon'\) r\.hidden = !offShown\(built\);/);
  assert.match(arm, /else if \(r\.slot === 'offweapon'\) r\.hidden = !offShown\(t\) \|\| climbHands;/);
  assert.match(arm, /if \(\(held \|\| climbHands\) && r\.slot === 'offweapon'\) r\.hidden = true;/);
  const rig = rd('src/combat/weaponRig.js');
  assert.match(rig, /const armItem = pairUp\(\) \? playerWeapon\.handItem\('R'\) : playerWeapon\.weapon;/);
  assert.match(rig, /fpArm\.setHands\(\{ mode: pairUp\(\) \? playerWeapon\.handsMode : HANDS_MODE\.Single, lead: playerWeapon\.leadHand \}\);/);
  assert.match(rig, /fpArm\.setOffWeapon\(pairUp\(\) && playerWeapon\.handsMode === HANDS_MODE\.Dual \? playerWeapon\.handItem\('L'\) : null\);/);
  assert.match(rig, /hand: pairUp\(\) \? playerWeapon\.strike\?\.hand \?\? null : null \}\);/);
  assert.match(rig, /fpArm\.setRunHands\?\.\(wanted, \{ speed \}\);/);
  assert.match(rig, /const armsRun = fpArm\.active\(\) && !!fpArm\.runPosed\?\.\(\);/);
});

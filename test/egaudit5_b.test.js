// AUDIT EG V (2026-10-15, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 8.5, 8.6, 13.2, 13.3, 13.4, 14, 18 and
// 19) - FIX GROUP B, THE LORDS: lane 1's findings L1-1 to L1-18 and L1-22 to L1-30, and lane 9's L9-7, each pinned on fights the
// real producers stand (net/egLaw.js egHallOf; net/egBrain.js egBreachNew, egEnter, egStep, egBlow, egCount, egFall; net/egLords.js
// egLordsNew, egLordsWake, egLordsStep; net/egBodies.js; the wire's validEgOut and the link's foldEg):
//   L1-1  a duel is its lord's: Garoth's Clan Muster beside THE OLD MASTERS' Armsmaster is never ended by the Armsmaster's kit, and
//         his fall is won;
//   L1-2  each lord its own aspect; L1-3 the Markynaz's decree folded, never erased by a lord stood after him;
//   L1-4, L1-5, L1-6, L1-16  the signatures on their own lord's state - the Colossus's own Breakdown, Ilthys's banners, the Twins'
//         own falls, the Armsmaster's Challenge met at n = 1;
//   L1-7  the Kynreeve's facing on the wire; L1-8 Morvayn's chain dropped at a fall; L1-9 a named failure blow counted on whom it
//         names; L1-10 the lords' place in THE UNION FLOOR; L1-11 the Kynmarcher's standards at his wake; L1-12 the Night-Stalker's
//         true umbra unread until it glints; L1-15 a snap's clock a link; L1-17 the fight's end; L1-18 a chained shape's dim
//         outline; L1-23 Paired Hearts the Colossus's own; L1-25 the Twins' touch the census's; L1-26 the Haven Nova over a floor of
//         many pieces; L1-29 each lord's own mirrors; L1-30 a told bridge scorches no one; L9-7 a champion's ring on no floor.
// The screen's halves (L1-7's draw, L1-12's glint, L1-13, L1-14, L1-18's outline, L1-22) are pinned in egaudit5_b_client.
import test from 'node:test';
import assert from 'node:assert/strict';
import { egHallOf, egOnFight, EG_SEALED_MS, EG_DECREE_BY_KEY } from '../src/net/egLaw.js';
import { egBreachNew, egEnter, egStep, egBlow, egCount, egFall, egStateOf, champRing, EG_CHAMP_RING_M, EG_CHAMP_RING_MIN_M } from '../src/net/egBrain.js';
import { egLordsNew, egLordsWake, egLordsStep, egLordsOf, egLordsAwake, egLordsFell, egLordHit, egLordHitX, egLordAspect, egObjsOf, egObjBroken, egChainShared, egHavenRouteM, egHavenFloor,
  EG_HAVENS_MAX, EG_ZONE_FIGHT_MS, EG_UMBRA_MS, EG_UMBRA_GLINT_MS } from '../src/net/egLords.js';
import { egFightNew, egHas, EG_FL, EG_ROLE, egBlowsStep, egAim, egBodyWire, egYawOf, egFightState } from '../src/net/egBodies.js';
import { egErrandMs, egInShape, shDisc, shLane, egChainGapMs, egBlowOutlineFrom, EG_ESCAPE_MPS, EG_OUTLINE_MAX_MS } from '../src/net/egShape.js';
import { egUnionHolds, egZoneLandings, egFloorLess } from '../src/net/egFloor.js';
import { egFightView } from '../src/net/egWalkGraph.js';
import { egFromFront, egFromBehind } from '../src/net/egLegion.js';
import { egFeatBits } from '../src/net/egFeats.js';

import { HIT_KINDS, dpsRef } from '../src/net/gateBrain.js';
import { gateAspectOf } from '../src/net/gateMods.js';
import { validEgOut, EG_YAW_WIRE_MAX, EG_OUTLINE_WIRE_MAX } from '../src/net/wire.js';
import { foldEg, EG_STATE_EMPTY } from '../src/net/egLink.js';
import { egChainMates } from '../src/scenes/egFight.js';

const T0 = 1_800_000_000_000;
const SITE = { px: 1, py: 1, x: 0, y: 0, z: 0, yaw: 0 };
const LINE = { depth: 1, perS: 0.05 };
const MIN = 60_000;
const seeded = (seed) => { let s = seed; return () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; }; };
/** The first hall of a seed (from `from`) whose spec passes `ok` - `[seed, h, spec]`. */
function hallWhere(ok, { seeds = 400, from = 1, to = 200, step = 1 } = {}) {
  for (let seed = 1; seed <= seeds; seed++) for (let h = from; h <= to; h += step) { const s = egHallOf(seed, h, 0); if (ok(s)) return [seed, h, s]; }
  throw new Error('no hall found');
}
/** A lord's fight stood and woken as the director stands it, `n` members at level 40; `step(here)` beats it in the director's
 *  order (the lords, then the blows' words), every frame kept, the words said counted. */
function court(seed, h, key, { n = 2, rng = seeded(seed), decrees = {} } = {}) {
  const spec = egHallOf(seed, h, 0);
  const subs = Array.from({ length: n }, (_, i) => `acct-${i}`);
  const F = egFightNew(spec, T0, subs.map(() => 40), subs), frames = [], view = egFightView(spec), said = {};
  egLordsNew(F, spec, key, T0, frames, { decrees, n });
  egLordsWake(F, spec, T0, frames, { n });
  let now = T0;
  const step = (here, ctx = {}) => {
    now += 250;
    const out = [];
    egLordsStep(F, spec, now, here, rng, out, { decrees, n, ...ctx });
    egBlowsStep(F, view, now, here, out);
    for (const f of out) if (f.k === 'esay') said[f.w] = (said[f.w] ?? 0) + 1;
    frames.push(...out);
    return out;
  };
  return { spec, F, L: egLordsOf(F)[0], subs, frames, said, step, now: () => now, view, f: spec.fl?.find((q) => q.t === 'd') ?? { x: 0, z: 0, r: 18 } };
}
/**
 * A breach of `n` at hall `h` of `seed` (its Proclamation cleared), woken with the company on the arrival plate: `at` stands a
 * member (the hall's frame), `step` beats the room as the room does - THE CENSUS over each member's trail first (egCount, its
 * trail the poses this test stood it at), then the director (egStep) - its frames kept; `blow` strikes a body from where a member
 * stands.
 */
function breachAt(seed, h, { n = 1, strata = [], tide = null, dc = [], wake = true, census = true } = {}) {
  const rng = seeded(seed);
  const co = Array.from({ length: n }, (_, i) => [`acct-${i}`, `M${i}`, i + 1]);
  const B = egBreachNew({ b: '0123456789abcdef', ez: 'z'.repeat(20), s: 'acct-0', o: 'M0', ew: 0, rh: 0, seed, op: T0, co, site: SITE, wg: [] });
  B.pr = '';
  let now = T0 + EG_SEALED_MS + 100;
  for (const [sub] of co) egEnter(B, sub, `ord${sub}`.padEnd(20, 'x'), 40, now);
  B.strata = [...strata]; B.tide = tide; B.dc = dc;
  const spec = egHallOf(seed, h, 0);
  B.h = h; B.sg = 'arrive'; B.wk = now; B.cnt = { left: 30 * MIN, at: now }; B.pulledAt = now; B.su = now + 30_000;
  const pos = Object.fromEntries(co.map(([sub], i) => [sub, { sx: spec.x0 + spec.arrive.x + i * 0.5, z: spec.arrive.z }]));
  const trails = Object.fromEntries(co.map(([sub]) => [sub, []])), frames = [];
  const step = (ms = 250) => {
    now += ms;
    if (census && B.sg === 'trial') {
      for (const [sub] of co) { trails[sub].push([now, pos[sub].sx - spec.x0, 0, pos[sub].z, B.h]); if (trails[sub].length > 64) trails[sub].shift(); }
      frames.push(...egCount(B, now, co.map(([sub]) => ({ sub, tr: trails[sub] })), LINE, false));
    }
    const o = egStep(B, now, co.map(([sub]) => ({ sub, ...pos[sub], dead: false, at: now })), rng);
    frames.push(...o);
    return o;
  };
  const at = (sub, x, z) => { pos[sub] = { sx: spec.x0 + x, z }; };
  const blow = (sub, i, d, r, [x, z], q, y = 0) => { now += 50; return egBlow(B, sub, { k: 'hit', i, q, d, r }, { sx: spec.x0 + x, y, z }, now); };
  for (let k = 0; k < 120 && wake && B.sg !== 'trial'; k++) step();
  if (wake) assert.equal(B.sg, 'trial', `hall ${h} woke`);
  return { B, spec, pos, frames, step, at, blow, subs: co.map(([sub]) => sub), now: () => now, here: () => co.map(([sub]) => ({ sub, x: pos[sub].sx - spec.x0, z: pos[sub].z })) };
}
/** The Court's lords woken by the company standing in its wake ring. */
function wakeCourt(S) {
  for (const sub of S.subs) S.at(sub, S.spec.ring.x, S.spec.ring.z);
  for (let k = 0; k < 40 && !egLordsAwake(S.B.F); k++) S.step();
  assert.ok(egLordsAwake(S.B.F), 'the lords woke');
}
let q = 1;
/** A blow of `d` on body `L` by `sub` from beside it (the hall's frame), its ward lifted when `unward`. */
function strike(S, L, sub, d, { unward = false } = {}) {
  if (unward) { L.ward = 0; L.fl &= ~EG_FL.ward; }
  const pose = [L.x + 1.5, L.z];
  S.at(sub, ...pose);
  return S.blow(sub, L.i, d, HIT_KINDS.Shaft, pose, q++);
}
/** A lord felled where it stands by a member's arrow from beside it (its ward lifted). */
function fellLord(S, L, sub = 'acct-0') { L.hp = 1; return strike(S, L, sub, 500, { unward: true }); }
const words = (frames, from = 0) => frames.slice(from).filter((f) => f.k === 'esay').map((f) => f.w);
const wFt = (S) => S.B.owe.filter((o) => o.claims.q === 'w').map((o) => [o.claims.lk, o.claims.ft]);

// ── L1-1: A DUEL IS ITS LORD'S ────────────────────────────────────────────────────────────────────────────────────────
test('AUDIT EG V L1-1 THE CLAN MUSTER BESIDE THE OLD MASTERS (sections 13.2, 13.4 and 18): Garoth at an even Redoubt with the Last Armsmaster beside him - his duel is called at his turn and is his alone: the Armsmaster\'s kit never ends it the beat it rises, a challenged member\'s blows on the Armsmaster count nothing to it, the Armsmaster\'s fall leaves it standing; it ends by its own clock and frees his held line; the Armsmaster\'s ring standing when Garoth\'s duel falls due holds Garoth warded until his is called, and falls with its lord; both felled within the window, the Court is won (mutants: the duel ownerless; the tally any lord\'s; a fall ending another\'s duel; no ward while it waits; a fallen lord\'s ring left standing)', () => {
  // the duel called and ended by Garoth alone
  const S = breachAt(7, 150, { n: 2, strata: ['oldmasters'] });
  wakeCourt(S);
  const F = S.B.F, ls = egLordsOf(F), G = ls.find((x) => x.key === 'garoth'), A = ls.find((x) => x.key === 'armsmaster');
  assert.ok(G && A, 'Garoth and the Last Armsmaster');
  G.hp = Math.floor(G.max * 0.65);
  const f0 = S.frames.length, o = S.step();
  assert.deepEqual([G.ph, words(o).includes('challenge'), words(o).includes('challengewon'), words(o).includes('challengeend')], [2, true, false, false], 'his turn: a duel called, never ended in the beat it rose');
  const ch = F.mem.challenge;
  assert.ok(ch && ch.by === G.i && G.hpFloor > 0, 'his own, his next threshold held');
  const [sub] = ch.subs, out = [];
  egLordHit(F, S.spec, A, sub, 'M', G.max, { x: A.x + 1, z: A.z }, S.now(), S.here(), out);   // a tenth of Garoth's health and more, on the Armsmaster
  assert.ok(F.mem.challenge === ch && ch.dealt === 0, 'the challenged member\'s blows on another lord count nothing to his duel');
  A.hp = 0;   // the purse took the last of it (net/egBodies.js egHitBody): the lord's law sees the fall
  egLordHit(F, S.spec, A, 'acct-0', 'M', 5, { x: A.x + 1, z: A.z }, S.now(), S.here(), out);
  assert.ok(!(A.hp > 0) && F.mem.challenge === ch, 'the Armsmaster felled: Garoth\'s duel stands');
  const fell = S.now();
  while (F.mem.challenge) S.step();
  assert.equal(S.now() - (ch.until - 15_000) <= 15_250, true, 'it ends by its own 15 s');
  assert.deepEqual([words(S.frames, f0).filter((w) => /^challenge/.test(w)), G.hpFloor], [['challenge', 'challengeend'], null], 'lasted: its end said once, his line free');
  assert.ok(S.now() - fell <= 15_000, 'inside the pair\'s window');
  fellLord(S, G);
  S.step();
  assert.ok(egLordsFell(F), 'both fallen within the window: the Court is won');
  // the Armsmaster's ring standing when Garoth's duel falls due
  const T = breachAt(7, 150, { n: 2, strata: ['oldmasters'] });
  wakeCourt(T);
  const TF = T.B.F, TG = egLordsOf(TF).find((x) => x.key === 'garoth'), TA = egLordsOf(TF).find((x) => x.key === 'armsmaster');
  for (let k = 0; k < 4 * 20 && !TF.mem.challenge; k++) T.step();
  assert.equal(TF.mem.challenge?.by, TA.i, 'the Armsmaster\'s Challenge, 15 s after the wake');
  TG.hp = Math.floor(TG.max * 0.65);
  T.step();
  assert.equal(TG.ph, 2, 'Garoth turns');
  for (let k = 0; k < 16; k++) T.step();   // past his turn's 3 s shield
  assert.equal(TF.mem.challenge?.by, TA.i, 'the Armsmaster\'s ring still stands');
  assert.equal(egLordHitX(TF, TG, 'acct-0', { x: TG.x + 1, z: TG.z }, HIT_KINDS.Melee, T.now()), 0, 'Garoth warded while his duel waits to be called');
  fellLord(T, TA);
  assert.equal(TF.mem.challenge, null, 'the Armsmaster felled: his ring falls with him');
  T.step();
  assert.equal(TF.mem.challenge?.by, TG.i, 'and Garoth\'s duel is called');
});

// ── L1-2, L1-3: A LORD'S OWN ASPECT; THE MARKYNAZ'S DECREE FOLDED ──────────────────────────────────────────────────────
/** Every elemental blow each lord of a breach's Court threw over `secs` with a member just outside each lord's body: by
 *  `key:pt`, the set of `name|element`. */
function thrown(S, secs) {
  const ls = egLordsOf(S.B.F).filter((L) => !egHas(L, EG_FL.mirror)), by = {};
  for (let k = 0; k < 4 * secs; k++) {
    S.subs.forEach((sub, j) => { const L = ls[j % ls.length]; S.at(sub, L.x + L.r + 1.5, L.z); });
    for (const f of S.step()) if (f.k === 'eb' && f.el) { const L = ls.find((x) => x.i === f.o); if (L) (by[`${L.key}:${L.pt}`] ??= new Set()).add(`${f.nm}|${f.el}`); }
  }
  return Object.fromEntries(Object.entries(by).map(([k, v]) => [k, [...v].sort()]));
}
test('AUDIT EG V L1-2 EACH LORD ITS OWN ASPECT (sections 13.3 and 13.4: "the Twin Lords keep their clans\' fire and frost"): THE TWIN COURT\'s second stood beside Garoth at Redoubt 25 leaves him Rime-Wrought - every element he throws frost - while the Cairn-Keeper beside him burns, re-aspected to the Wellhead; the Twin Lords under THE OLD MASTERS keep fire and frost while the Spellmaster beside them burns (mutants: the aspect the fight\'s, the last lord\'s overwriting; the twins re-aspected)', () => {
  const S = breachAt(7, 125, { n: 2, strata: ['twincourt'] });
  wakeCourt(S);
  const [G, K] = egLordsOf(S.B.F);
  assert.deepEqual([G.key, G.asp, K.key, K.asp], ['garoth', 'rime', 'cairnkeeper', egLordAspect('cairnkeeper', S.spec.c).id], 'each its own aspect');
  assert.equal(K.asp, 'burning');
  const by = thrown(S, 60), frost = gateAspectOf('rime').el, fire = gateAspectOf('burning').el;
  assert.ok(by['garoth:0']?.length && by['garoth:0'].every((x) => x.endsWith(`|${frost}`)), `Garoth's every element frost (${by['garoth:0']})`);
  assert.ok(by['cairnkeeper:0']?.length && by['cairnkeeper:0'].every((x) => x.endsWith(`|${fire}`)), `the Cairn-Keeper's fire (${by['cairnkeeper:0']})`);
  const T = breachAt(1, 215, { n: 3, strata: ['oldmasters'] });
  wakeCourt(T);
  assert.deepEqual(egLordsOf(T.B.F).map((L) => [L.key, L.asp ?? null]), [['twins', null], ['twins', null], ['spellmaster', 'burning']]);
  const tb = thrown(T, 40);
  assert.ok(tb['twins:0']?.length && tb['twins:0'].every((x) => x.endsWith('|fire')), `Vael's fire (${tb['twins:0']})`);
  assert.ok(tb['twins:1']?.length && tb['twins:1'].every((x) => x.endsWith('|frost')), `Isk's frost (${tb['twins:1']})`);
});
test('AUDIT EG V L1-3 THE GRAND DUKE\'S DECREE FOLDED, NEVER ERASED (section 8.5: "It folds with the circle\'s lord decrees through the fight\'s profile ... never in their place"): Clan Feud\'s Markynaz beside the Wellhead Wyrm lays Unyielding on the fight; a Twin Court second stood after him keeps it in the one law - ward x2, blows on it x0.85 - as it stands alone (mutants: the law written fresh for each lord)', () => {
  const lawOf = (strata) => { const S = breachAt(1, 105, { n: 2, strata, tide: 'feud' }); return [egLordsOf(S.B.F).map((L) => L.key), egLordsOf(S.B.F).find((L) => L.key === 'markynaz')?.decree, S.B.F.mem.law]; };
  const [k0, d0, law0] = lawOf([]), [k1, d1, law1] = lawOf(['twincourt']);
  assert.deepEqual([k0, d0], [['wyrm', 'markynaz'], 'unyielding']);
  assert.deepEqual([k1, d1], [['wyrm', 'markynaz', 'hound'], 'unyielding'], 'a second lord stood after him');
  assert.deepEqual([law0.shieldX, law0.hitX, law1.shieldX, law1.hitX], [2, 0.85, 2, 0.85], 'his decree in the fight\'s one law, the second stood or not');
  assert.deepEqual(law1, law0);
});

// ── L1-4, L1-5, L1-6, L1-16: THE SIGNATURES ON THEIR OWN LORD ───────────────────────────────────────────────────────────
/** Turn lord `L` to its phase at `frac` of its health (the next beats run its turn). */
const turnTo = (S, L, frac) => { L.hp = Math.floor(L.max * frac); for (let k = 0; k < 16; k++) S.step(); };
test('AUDIT EG V L1-4 HEARTS STILLED IS THE COLOSSUS\'S OWN BREAKDOWN (section 19: "into its Breakdown with no heart relit"): under THE OLD MASTERS the master beside it turns to its third phase while the Colossus is felled from its second - no signature; felled from its own Breakdown, the signature (mutants: any lord\'s phase words counted)', () => {
  const run = (deep) => {
    const S = breachAt(1, 130, { n: 2, strata: ['oldmasters'] });
    wakeCourt(S);
    const ls = egLordsOf(S.B.F), C = ls.find((x) => x.key === 'colossus'), M = ls.find((x) => x.key !== 'colossus');
    turnTo(S, M, 0.6); turnTo(S, M, 0.3);
    turnTo(S, C, 0.6); if (deep) turnTo(S, C, 0.3);
    assert.deepEqual([M.ph, C.ph], [3, deep ? 3 : 2]);
    fellLord(S, M); fellLord(S, C); S.step();
    return wFt(S);
  };
  assert.deepEqual(run(false), [['colossus', 3]], 'felled from its second phase: Unbroken and Swift, never Hearts Stilled');
  assert.deepEqual(run(true), [['colossus', 7]], 'felled from its own Breakdown: its signature');
});
test('AUDIT EG V L1-5 NO GROUND CONCEDED COUNTS HER BANNERS (section 19: "three of her banners broken"): three Wellhead Sparks broken under their decree, every banner standing - no signature; three banners broken - the signature (mutants: every broken object counted)', () => {
  const run = (kind) => {
    const S = breachAt(7, 25, { n: 2, dc: [[EG_DECREE_BY_KEY.sparks.id, 1]] });
    assert.equal(S.spec.lord, 'ilthys');
    wakeCourt(S);
    const I = egLordsOf(S.B.F)[0];
    let broken = 0;
    for (let k = 0; k < 4 * 90 && broken < 3; k++) {
      S.step();
      for (const o of egObjsOf(S.B.F, kind)) { if (broken >= 3) break; o.hp = 1; S.at('acct-0', o.x + 1, o.z); S.blow('acct-0', o.i, 50, HIT_KINDS.Melee, [o.x + 1, o.z], q++, o.y); if (!(o.hp > 0)) broken++; }   // a banner from its balcony
    }
    assert.equal(broken, 3, `three ${kind}s broken`);
    fellLord(S, I); S.step();
    return wFt(S);
  };
  assert.deepEqual(run('spark'), [['ilthys', 3]], 'three Sparks: no ground was hers to concede');
  assert.deepEqual(run('banner'), [['ilthys', 7]], 'three of her banners: the signature');
});
test('AUDIT EG V L1-6 TOGETHER IS THE TWINS\' OWN FALLS (section 19: "the Twin Lords falling within 3 s of each other"): under Clan Feud the twins fall 0.75 s apart and the Markynaz twenty seconds later - the signature; 3.5 s apart, none (mutants: the Redoubt\'s beat measured against the first fall)', () => {
  const run = (gap) => {
    const S = breachAt(1, 215, { n: 3, tide: 'feud' });
    wakeCourt(S);
    const ls = egLordsOf(S.B.F), [a, b] = ls.filter((x) => x.key === 'twins'), ch = ls.find((x) => x.champ);
    fellLord(S, a); for (let t = 0; t < gap; t += 250) S.step(); fellLord(S, b);
    for (let k = 0; k < 80; k++) S.step();
    fellLord(S, ch); S.step();
    return wFt(S);
  };
  assert.deepEqual(run(750), [['twins', 7]], 'the twins together, the champion last: Together');
  assert.deepEqual(run(3500), [['twins', 3]], 'three and a half seconds apart: not together');
});
test('AUDIT EG V L1-16 EVERY CHALLENGE MET BY A COMPANY OF ONE (sections 13.2, "a party of one is a company", and 13.3, "n = 1: no ring; he duels in the open"): alone with the Last Armsmaster, his Challenge is the open duel - the member marked, no ring, no braziers, the lord unmoved - met by a tenth of his health dealt within its 15 s; two met and he is felled: his signature (mutants: no Challenge at n = 1; a ring or braziers at n = 1; the open duel ended by its missing braziers)', () => {
  const S = breachAt(1, 10, { n: 1 });
  assert.equal(S.spec.lord, 'armsmaster');
  wakeCourt(S);
  const F = S.B.F, A = egLordsOf(F)[0];
  let met = 0;
  for (let round = 0; round < 2; round++) {
    for (let k = 0; k < 4 * 45 && !F.mem.challenge; k++) S.step();
    const ch = F.mem.challenge, at = [A.x, A.z];
    assert.ok(ch && ch.subs[0] === 'acct-0', `Challenge ${round + 1}: the lone member marked`);
    assert.deepEqual([F.pg.ring ?? null, egObjsOf(F, 'brazier').length, [A.x, A.z]], [null, 0, at], 'no ring, no braziers, the lord where he stood');
    const f0 = S.frames.length;
    S.step();
    assert.ok(F.mem.challenge === ch, 'it stands with no braziers to break');
    const hp0 = A.hp;
    for (let k = 0; k < 4 * 14 && F.mem.challenge; k++) { S.frames.push(...(strike(S, A, 'acct-0', 3 * dpsRef(40), { unward: true }) ?? [])); S.step(); }
    assert.ok(!F.mem.challenge && words(S.frames, f0).includes('challengewon') && hp0 - A.hp >= A.max / 10, 'a tenth of his health dealt inside its 15 s: met');
    met++;
  }
  assert.equal(met, 2);
  fellLord(S, A); S.step();
  assert.deepEqual(wFt(S), [['armsmaster', 7]], 'two Challenges met: Every Challenge Met, alone');
});

// ── L1-7: THE KYNREEVE'S FACING ON THE WIRE ────────────────────────────────────────────────────────────────────────────
const wire = (f) => { const { to: _to, ...rest } = f; const v = validEgOut(JSON.parse(JSON.stringify(rest))); assert.ok(v, `the wire refuses ${f.k}`); return v; };
test('AUDIT EG V L1-7 THE SHIELD-WALL ON THE FACING EVERY SCREEN DRAWS (sections 8.5, "he turns to the top of threat, so one member holds him while the others flank", and 21): the Kynreeve turned to his target says it - a body\'s row and each walk carry its facing (`yw`) - so the screen that heard the room holds him facing the way the relay judges a flank by: from the front it draws, a blow x0.25; from behind, x1.3 (mutants: the turn unsaid; the facing off the row; the walk\'s facing unread)', () => {
  const [seed, h, spec] = hallWhere((s) => s.kind === 'proving' && s.champ === 'kynreeve');
  const S = breachAt(seed, h, { n: 2 }), F = S.B.F, K = egLordsOf(F)[0];
  assert.equal(K.key, 'kynreeve');
  const ring = champRing(spec);
  for (const sub of S.subs) S.at(sub, ring.x, ring.z);
  for (let k = 0; k < 40 && !K.up2; k++) S.step();
  assert.ok(K.up2, 'he wakes');
  // the screen that held him facing pi, then heard every word since
  let J = foldEg(EG_STATE_EMPTY, wire(egStateOf(S.B, S.now())), S.now());
  const fs0 = egFightState(F, S.now());
  J = foldEg(J, wire({ ...fs0, b: fs0.b.map((t) => [...t.slice(0, 18), Math.PI]) }), S.now());
  const f0 = S.frames.length;
  // members off his side - he turns to one as he strikes
  S.at('acct-0', K.x + K.r + 3, K.z + 1); S.at('acct-1', K.x + K.r + 3, K.z - 1);
  for (let k = 0; k < 4 * 12 && !S.frames.slice(f0).some((f) => f.k === 'eb' && f.o === K.i); k++) S.step();
  assert.ok(S.frames.slice(f0).some((f) => f.k === 'eb' && f.o === K.i), 'he struck');
  assert.ok(Math.abs(K.yaw - Math.PI) > 0.5, `he turned (${K.yaw})`);
  const seen = (E) => E.fight.bodies.find((b) => b.i === K.i);
  for (const f of S.frames.slice(f0)) if (f.k === 'emv') J = foldEg(J, wire(f), S.now());
  assert.equal(seen(J).yaw, egYawOf(K), 'the turn said as a walk: the screen holds his facing');
  let E = foldEg(EG_STATE_EMPTY, wire(egStateOf(S.B, S.now())), S.now());
  E = foldEg(E, wire(egFightState(F, S.now())), S.now());
  assert.equal(seen(E).yaw, egYawOf(K), 'and the whole fight says it (a joiner\'s)');
  // a blow from where the screen draws his front, and from where it draws his back
  const y = seen(J).yaw, front = { x: K.x + Math.sin(y) * 2, z: K.z + Math.cos(y) * 2 }, back = { x: K.x - Math.sin(y) * 2, z: K.z - Math.cos(y) * 2 };
  const plain = egLordHitX(F, K, 'acct-0', null, HIT_KINDS.Melee, S.now());
  assert.ok(plain > 0);
  assert.deepEqual([egLordHitX(F, K, 'acct-0', front, HIT_KINDS.Melee, S.now()), egLordHitX(F, K, 'acct-0', back, HIT_KINDS.Melee, S.now())], [plain * 0.25, plain * 1.3], 'his Shield-Wall on the facing drawn');
  // the wire's bounds
  const row = egBodyWire(K);
  assert.equal(row.length, 19);
  assert.ok(validEgOut({ k: 'ead', a: [row], at: S.now() }));
  for (const bad of [EG_YAW_WIRE_MAX + 0.01, -EG_YAW_WIRE_MAX - 0.01, NaN, '1']) assert.equal(validEgOut({ k: 'ead', a: [[...row.slice(0, 18), bad]], at: S.now() }), null, `a facing of ${bad}`);
  assert.equal(EG_YAW_WIRE_MAX, 7);
});

// ── L1-8, L1-15: MORVAYN'S CHAINS ──────────────────────────────────────────────────────────────────────────────────────
test('AUDIT EG V L1-8 A FALLEN MEMBER UNCHAINED (section 13.4, the Chaining: "a blow on one is shared with the other"): four members bound in two pairs, one falls - its chain and its tether drop at the fall (the seam\'s join), and the census and the struck screen count the same part of a blow on its survivor: the whole; a chain of three that loses its first member is re-linked between the two left, each half; a mate the census does not hold counted none, the struck its own part (mutants: the chain kept past the fall; the tether kept; the three left unlinked; the census\'s mates by the living alone)', () => {
  const S = breachAt(7, 50, { n: 4 });
  wakeCourt(S);
  const F = S.B.F, M = egLordsOf(F)[0];
  assert.equal(M.key, 'morvayn');
  for (let k = 0; k < 4 * 20 && !(F.mem.chains ?? []).length; k++) S.step();
  assert.equal(F.mem.chains.length, 2, 'two pairs');
  const [[a, b], [c, d]] = F.mem.chains;
  const f0 = S.frames.length;
  egFall(S.B, b, S.now(), S.frames);
  S.step();
  assert.deepEqual(F.mem.chains, [[c, d]], 'its chain gone with it');
  assert.deepEqual(F.tethers.filter((t) => t[2] === 2), [[c, d, 2, 800]], 'and its tether');
  const tx = S.frames.slice(f0).filter((f) => f.k === 'etx').at(-1);
  assert.ok(tx && !tx.t.some((t) => t.includes(b)), 'said to every screen');
  assert.ok(!F.marks.some((m) => m[1] === 4 && (m[0] === a || m[0] === b)), 'neither the fallen nor its mate marked chained');
  /** A 0.4 blow of Morvayn's landed on `sub` alone, counted by the census over the trails of `live`: each member's thousandths. */
  const census = (sub, live) => {
    F.blows.length = 0; F.pend = []; F.held = [];
    const at = S.now() + 10_000, p = S.pos[sub], x = p.sx - S.spec.x0;
    assert.ok(egAim(F, S.spec, { o: M.i, s: [shDisc(x, p.z, 2)], at, wu: 1500, p: 0.4, b: 0, el: null, nm: 'Test Blow' }, [], at - 1500, []));
    const cs0 = Object.fromEntries(S.subs.map((s) => [s, S.B.mem[s].cs?.[3] ?? 0]));
    const bodies = live.map((s) => ({ sub: s, tr: [at - 1200, at - 800, at - 400, at + 100].map((t) => [t, S.pos[s].sx - S.spec.x0, 0, S.pos[s].z, S.B.h]) }));
    egCount(S.B, at + 900, bodies, LINE, false);
    return Object.fromEntries(S.subs.map((s) => [s, (S.B.mem[s].cs?.[3] ?? 0) - cs0[s]]));
  };
  const cr = S.spec.fl.find((f) => f.t === 'd');
  S.subs.forEach((s, j) => S.at(s, cr.x - 6 + 4 * j, cr.z));   // apart, on a crypt's floor
  const screen = (sub) => 400 / (egChainMates(F.tethers.map((t) => [...t]), sub).length + 1);
  assert.deepEqual([census(a, [a, c, d])[a], screen(a)], [400, 400], 'the fallen\'s mate: the whole, by the census and by its screen');
  assert.deepEqual([census(c, [a, c, d])[c], screen(c)], [200, 200], 'a pair standing: halves');
  assert.deepEqual(census(c, [a, c]), { [a]: 0, [b]: 0, [c]: 200, [d]: 0 }, 'a mate the census does not hold: none of its part, the struck its own');
  // a chain of three (the Last Rites') that loses its first member: the two left re-linked
  F.mem.chains = [[a, c, d]]; F.tethers = [...F.tethers.filter((t) => t[2] !== 2), [a, c, 2, 800], [a, d, 2, 800]];
  egFall(S.B, a, S.now(), S.frames);
  S.step();
  assert.deepEqual([F.mem.chains, F.tethers.filter((t) => t[2] === 2)], [[[c, d]], [[c, d, 2, 800]]], 'its first fallen: the three\'s two left chained to each other');
  assert.deepEqual([census(d, [c, d])[d], screen(d)], [200, 200]);
});
test('AUDIT EG V L1-15 EACH LINK ITS OWN SNAP (section 13.4: "A pair stretched past 8 m both take 30% (a CHECK)"): two pairs held 12 m apart for 6 s - each snaps every 3 s on its own clock, neither keeping the other from its CHECK (mutants: one clock for every chain)', () => {
  const C = court(7, 50, 'morvayn', { n: 4 });
  const here = C.subs.map((sub, j) => ({ sub, x: C.f.x + (j % 2 ? 6 : -6), z: C.f.z + (j < 2 ? 4 : -4) }));
  for (let k = 0; k < 4 * 20 && !(C.F.mem.chains ?? []).length; k++) C.step(here);
  const chains = C.F.mem.chains;
  assert.equal(chains.length, 2);
  const at = Object.fromEntries(chains.map((c) => [c.join('|'), c]));
  for (const h of here) { const c = chains.find((q) => q.includes(h.sub)), j = c.indexOf(h.sub); h.x = C.f.x + (j ? 6 : -6); h.z = C.f.z + (c === chains[0] ? 4 : -4); }
  const f0 = C.frames.length;
  for (let k = 0; k < 24; k++) C.step(here);
  const snaps = C.frames.slice(f0).filter((f) => f.k === 'eb' && f.nm === 'The Chain Snaps').map((f) => f.on.join('|'));
  for (const key of Object.keys(at)) assert.equal(snaps.filter((s) => s === key).length, 2, `the pair ${key} snaps twice in 6 s`);
});

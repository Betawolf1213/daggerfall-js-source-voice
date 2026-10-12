// @ts-check
// EG-FULL (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 8.5, 8.6, 13 and 18): THE
// LORDS AND THE CHAMPIONS - every boss of the Spire on ONE engine (net/egBodies.js's bodies, blows and words): the
// thirteen Court lords and Valkynaz and the three Proving champions, each its own kit, its phases, its signature and its
// errands; and the laws every one keeps -
//   HEALTH  `egTtkRef(c)` seconds of the company's reference damage per fighter (x1.07 a circle to circle 20, x1.03
//           past it), the champion's EG_PROVE_HP_S;
//   PHASES  at the gate's PHASE_AT (0.66, 0.33), each turn warded SHIELD_MS; each phase adds a mechanic, never a faster
//           one; a signature errand holds the next threshold until it resolves (`hpFloor`);
//   TARGETS the gate's: THREAT_PICK to the top of threat, the rest at a random living member, threat forgetting
//           THREAT_DECAY a second (Grudge-Bearer: 0.85, never forgetting);
//   FURY    at EG_FURY_RATIO x ttkRef seconds into the fight: every 30 s a wave of the band's legion, shares a tenth
//           more (within EG_SHARE_X_MAX), and from the second step its aimed blows chain a second shape - never a
//           shorter wind-up (NOTHING GETS FASTER);
//   THE WIND-UP FLOOR, THE WIDTH RULE and THE UNION FLOOR on every aimed blow (net/egShape.js, net/egBodies.js egAim);
//   THE CHECK CLASS for whole-floor, haven and errand-failure blows (fixed wind-up and damage; errand floors below);
//   THE COVENANT'S PATIENCE - a count spent while a Court's lord is awake: fury at once and the Covenant's Weight every
//           30 s (30% to all, a 3.0 s wind-up - a CHECK).
// The lords' decrees (section 14's lord family) fold into each lord as X-keyed laws: Colossal (radii x1.2, health
// x1.25), Unyielding (ward x2, blows on it x0.85), Vengeful (shares x1.25), Grudge-Bearer (threat 0.85, no decay).
//
// The errands' objects (runes, gems, anchors, banners, hearts, seals, braziers, pillars, standards, havens) are bodies
// of role 2: struck ones carry health, stood-on ones a state (`pg` says each errand's progress). Marks on members and
// tethers are the fight's (net/egBodies.js egMark, F.tethers).
//
// Pure: a fight and a beat in, frames out. In the relay bundle. Not a DFU member. Ledger A (ELITE-GATES).
import { PHASE_AT, SHIELD_MS, THREAT_PICK, THREAT_DECAY, HIT_KINDS, STUN_MS, STUN_HIT_X } from './gateBrain.js';
import { EG_ROLE, EG_FL, EG_GONE, egBodyNew, egWalk, egStop, egPlace, egAim, egGone, egHas, egSetFl, egHpTeam, egBodiesOf, egBodyById, egMark, egUnmark, egMarkOf, egShareX, egCut, EG_TELL_LEAD_MS, EG_FEINT_AT } from './egBodies.js';
import { shDisc, shLane, shLaneAt, shCone, shRing, shAll, shOut, egErrandMs, egBlowFrom } from './egShape.js';
import { EG_LORDS, egKeepOnFight } from './egLaw.js';
import { EG_KIND, egLegionRaise, egWaveKinds, egWaveSize, egFromBehind, egFromFront } from './egLegion.js';

/** Every boss on the wire, by number (`k` of a lord body): the thirteen, then the three champions. */
export const EG_BOSS_KEYS = Object.freeze(['hound', 'spellmaster', 'armsmaster', 'ilthys', 'cairnkeeper', 'twins', 'morvayn', 'dusk', 'stalker', 'seyth', 'colossus', 'wyrm', 'garoth', 'kynreeve', 'kynmarcher', 'markynaz']);
export const egBossNo = (key) => EG_BOSS_KEYS.indexOf(key);
/** A boss's look (its mobile and scale - the client draws it; a champion is the Warden's look at 2.5). */
export function egBossLook(key, pt = 0) {
  if (key === 'kynreeve' || key === 'kynmarcher' || key === 'markynaz') return { mobile: 31, scale: 2.5 };
  if (key === 'twins') return { mobile: pt === 1 ? 25 : 26, scale: 2.6 };
  const L = EG_LORDS[key];
  return L ? { mobile: L.mobile, scale: L.scale } : { mobile: 31, scale: 3 };
}
/** A boss's name (a twin's own, a champion's rank). */
export function egBossName(key, pt = 0) {
  if (key === 'twins') return pt === 1 ? 'Isk of the Frost Clan' : 'Vael of the Fire Clan';
  if (key === 'kynreeve') return 'The Kynreeve';
  if (key === 'kynmarcher') return 'The Kynmarcher';
  if (key === 'markynaz') return 'The Markynaz';
  return EG_LORDS[key]?.name ?? 'The Lord';
}

/** THE LORDS' CLOCK (section 18): `ttkRef(c)` seconds of the company's reference damage per fighter. */
export const EG_TTK_S = 180;
export const EG_TTK_GROWTH = 1.07;
export const EG_TTK_GROWTH_DEEP = 1.03;
export function egTtkRef(c) {
  let t = EG_TTK_S;
  for (let k = 2; k <= c; k++) t *= k <= 20 ? EG_TTK_GROWTH : EG_TTK_GROWTH_DEEP;
  return t;
}
/** The champion's health (section 8.5), a twin's share of a lord's, a mirror's (section 13.4). */
export const EG_PROVE_HP_S = 40;
export const EG_TWIN_SHARE = 0.55;
/** FURY (section 13.2): when it comes (x ttkRef), how often it steps, what each step adds to a share. */
export const EG_FURY_RATIO = 1.5;
export const EG_FURY_EVERY_MS = 30_000;
export const EG_FURY_STEP = 0.1;
/** THE COVENANT'S WEIGHT (section 18). */
export const EG_WEIGHT_EVERY_MS = 30_000;
export const EG_WEIGHT_WU_MS = 3000;
export const EG_WEIGHT_PCT = 0.3;
/** A lord's breath after a blow's recovery, and its first after it wakes (ms). */
export const EG_LORD_BREATH_MS = 700;
export const EG_LORD_WAKE_MS = 2500;
/** The gate's blows the Valkynaz and the champions keep (net/gateBrain.js ATTACKS, at their phase-one wind-ups). */
const CLEAVE = Object.freeze({ nm: 'Cleave', wu: 1400, rec: 900, p: 0.45, b: 12 });
const SLAM = Object.freeze({ nm: 'Ground Slam', wu: 1600, rec: 1700, p: 0.52, b: 14 });
const CHARGE = Object.freeze({ nm: 'Charge', wu: 1200, rec: 1200, p: 0.40, b: 12 });
const METEOR = Object.freeze({ nm: 'Meteor of Oblivion', wu: 2800, rec: 700, p: 0.64, b: 16 });
/** A lord's body radius at its scale (the Warden's 1.8 at 3). */
const bodyR = (scale) => Math.max(0.8, (1.8 * scale) / 3);
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const r2 = (v) => Math.round(v * 100) / 100;

// ── the lords' decrees, as laws (section 14) ─────────────────────────────────────────────────────────────
/** The lord-family decrees in force: `{ colossal, unyielding, vengeful, grudge }` ranks 0-2. */
export function egLordLaw(D = {}) {
  const c = D.colossal ?? 0, u = D.unyielding ?? 0, v = D.vengeful ?? 0, g = D.grudge ?? 0;
  return {
    radiusX: c >= 2 ? 1.3 : c ? 1.2 : 1, hpX: c >= 2 ? 1.4 : c ? 1.25 : 1, sizeX: c >= 2 ? 1.4 : c ? 1.25 : 1,
    shieldX: u >= 2 ? 3 : u ? 2 : 1, hitX: u >= 2 ? 0.75 : u ? 0.85 : 1,
    dmgX: v >= 2 ? 1.4 : v ? 1.25 : 1,
    threatPick: g >= 2 ? 0.95 : g ? 0.85 : THREAT_PICK, threatDecay: g ? 0 : THREAT_DECAY,
  };
}

// ── the engine ───────────────────────────────────────────────────────────────────────────────────────────
/** A lord body stood (asleep until its hall wakes it). */
function stand(F, spec, key, x, z, hp, now, out, o = {}) {
  const look = egBossLook(key, o.pt ?? 0);
  return egBodyNew(F, EG_ROLE.lord, egBossNo(key), x, z, hp, { pt: o.pt ?? 0, r: bodyR(look.scale), fl: o.fl ?? 0, now, out, key, ph: 1, up2: false, nextAt: Infinity, threat: {}, ward: 0, stunUntil: 0, yaw: Math.PI, lastBlow: '', run: 0, cds: {}, ...o.extra });
}
/** The lord bodies of the fight (the living). */
export const egLordsOf = (F) => egBodiesOf(F, EG_ROLE.lord);
/** The fight's errand objects (role 2) of a type. */
export const egObjsOf = (F, t) => egBodiesOf(F, EG_ROLE.obj).filter((o) => o.t === t);
/** An object stood: its type, place, health (0 a stood-on one - it carries 1 and is never struck), radius. */
function obj(F, t, x, z, hp, now, out, o = {}) {
  return egBodyNew(F, EG_ROLE.obj, EG_OBJ[t] ?? 0, x, z, hp > 0 ? hp : 1, { t, r: o.r ?? 1.2, fl: hp > 0 ? 0 : EG_FL.ward, pt: o.pt ?? 0, now, out, st: 0, ...o.extra });
}
/** THE OBJECTS' TYPES on the wire (`k` of an object body). */
export const EG_OBJ = Object.freeze({ rift: 0, anchor: 1, rune: 2, gem: 3, haven: 4, brazier: 5, banner: 6, heart: 7, seal: 8, pillar: 9, standard: 10, chain: 11, relic: 12, isle: 13, spark: 14, plate: 15, cache: 16, niche: 17, shrine: 18, sutler: 19, engine: 20, image: 21, umbra: 22, memento: 23, vault: 24, stone: 25, fwall: 26 });   // LAYER THREE: `fwall` an alcove's false wall (one blow)

/** Whom a lord goes at: THREAT_PICK of the time its top of threat, else a living member at random. */
function pickTarget(L, here, rng, law) {
  if (!here.length) return null;
  let top = null, t = 0;
  for (const m of here) { const v = L.threat[m.sub] ?? 0; if (v > t) { t = v; top = m; } }
  if (top && rng() < law.threatPick) return top;
  return here[Math.floor(rng() * here.length)];
}
const nearest = (x, z, here) => { let best = null, bd = Infinity; for (const m of here) { const d = dist(x, z, m.x, m.z); if (d < bd) { bd = d; best = m; } } return best; };

/**
 * A LORD'S BLOW: its stamps (made from the lord, its target and the hall), its wind-up (floored), its share by the depth,
 * fury and Vengeful (within EG_SHARE_X_MAX), Colossal's radii. `o.ch` a CHECK (fixed); `o.feint` cut at FEINT_AT.
 */
function lordBlow(F, spec, L, stamps, B, here, now, out, o = {}) {
  const law = F.mem.law ?? egLordLaw();
  const scale = (s) => (law.radiusX === 1 || o.ch ? s : s[0] === 'd' ? shDisc(s[1], s[2], s[3] * law.radiusX) : s[0] === 'c' ? shCone(s[1], s[2], s[3], s[4] * law.radiusX, s[5]) : s[0] === 'l' ? shLane(s[1], s[2], s[3], s[4], s[5] * law.radiusX) : s);
  const p = o.ch ? B.p : B.p * egShareX(F.c, (F.mem.furyX ?? 1) * law.dmgX * (L.shareX ?? 1));
  const at = now + (o.delay ?? 0) + B.wu;
  // EG-H1 (section 15): every lord's chosen blow COMMITTED EG_TELL_LEAD_MS before its wind-up begins (net/egBodies.js egAim's
  // `lead` - told early to a Watchfire holder's company meanwhile); a CHECK keeps its fixed time
  const blow = egAim(F, spec, { o: L.i, s: stamps.map(scale), at, wu: B.wu + (o.delay ?? 0), p, b: B.b, el: B.el === undefined ? null : B.el, nm: B.nm, ch: o.ch ? 1 : 0, pu: B.pu ?? 0, sp: B.sp ?? 0 }, o.ch ? [] : here, now, out, o.ch ? 0 : EG_TELL_LEAD_MS);
  if (blow && o.feint) (F.mem.feints ??= []).push([blow.i]);   // EG-H1: cut at FEINT_AT of its OWN wind-up, however late its word went
  return blow;
}
/** A chained second shape under fury (from its second step): the same stamps, landing max(wind-up, floor + 0.3 s, 1 s)
 *  after the first. */
function furyChain(F, spec, L, blow, here, now, out) {
  if (!blow || (F.mem.furySteps ?? 0) < 2 || blow.ch) return;
  const gap = Math.max(blow.wu, 1000);
  // EG-H1: committed with the first and said with it (its landing the first's plus the gap - the lead already in it)
  egAim(F, spec, { o: L.i, s: blow.s, at: blow.at + gap - EG_TELL_LEAD_MS, wu: blow.at + gap - EG_TELL_LEAD_MS - now, p: blow.p, b: blow.b, el: blow.el, nm: `${blow.nm} (fury)`, pu: blow.pu, sp: blow.sp }, here, now, out, EG_TELL_LEAD_MS);
}
/** A lord's ward raised for `ms` (Unyielding's law - longer). */
function ward(F, L, ms, now, out) { const law = F.mem.law ?? egLordLaw(); L.ward = Math.max(L.ward, now + ms * law.shieldX); egSetFl(F, L, EG_FL.ward, true, out); }
/** A lord stunned (the crystals' law: STUN_MS on its knees, every blow STUN_HIT_X heavier). */
export function egStun(F, L, ms, now, out) { L.stunUntil = Math.max(L.stunUntil, now + ms); L.atk = null; egStop(F, L, now); egSetFl(F, L, EG_FL.stun, true, out); out.push({ k: 'esay', w: 'stunned', n: egBossName(L.key, L.pt) }); }
const say = (out, w, extra = {}) => out.push({ k: 'esay', w, ...extra });
/** A haven blow's wind-up: the errand floor over the longest route to the nearest haven (section 13.3). */
function havenWu(havens, field) {
  let worst = 0;
  for (const [x, z] of field) { let best = Infinity; for (const h of havens) best = Math.min(best, Math.max(0, dist(x, z, h[0], h[1]) - h[2])); worst = Math.max(worst, best); }
  return egErrandMs(worst);
}
/** The fight floor's main disc (its first) - or one about the lord where a lord fights on another's ground (a Twin
 *  Court's, the Old Masters'). */
const mainDisc = (spec, L) => spec.fl?.find((f) => f.t === 'd') ?? { x: L.x, z: L.z, r: 18 };
/** A ground's spots of a role, or `k` laid on a ring `rr` out from the main disc's heart (a lord on another's ground). */
function spotsOr(spec, L, role, k, rr) {
  const have = spec.spots?.[role];
  if (have?.length) return have.map((q) => [q.x, q.z]);
  const f = mainDisc(spec, L), R = Math.min(rr, Math.max(2, f.r - 1.5));
  return Array.from({ length: k }, (_, j) => egKeepOnFight(spec, f.x + Math.sin((j / k) * 2 * Math.PI + Math.PI / 4) * R, f.z + Math.cos((j / k) * 2 * Math.PI + Math.PI / 4) * R, 1));
}
/** Sample points over a floor disc (for an errand's longest route). */
const fieldOf = (cx, cz, R) => { const pts = []; for (let a = 0; a < 360; a += 30) for (const f of [0.35, 0.7, 1]) pts.push([cx + Math.sin((a * Math.PI) / 180) * R * f, cz + Math.cos((a * Math.PI) / 180) * R * f]); return pts; };

/**
 * THE LORDS STOOD for a hall: a Court's lord (or the Twins, both), a Proving Walk's champion, a Kyn's Vigil's champion on
 * an arrival plate - each asleep until the hall wakes it, with its health, its look, its errands' objects.
 * @param {any} F @param {any} spec @param {string} key @param {number} now @param {any[]} out @param {{ decrees?: any, n: number, at?: number[] }} ctx
 */
export function egLordsNew(F, spec, key, now, out, ctx) {
  const law = egLordLaw(ctx.decrees ?? {});
  F.mem.law = law;
  const champ = key === 'kynreeve' || key === 'kynmarcher' || key === 'markynaz';
  const hp = (champ ? EG_PROVE_HP_S : egTtkRef(F.c)) * F.team * (champ ? F.X : 1) * law.hpX;
  const [x, z] = ctx.at ?? [spec.foe?.x ?? 0, spec.foe?.z ?? 0];
  if (key === 'twins') {
    const courts = spec.spots.court ?? [{ x, z }, { x, z: z + 20 }], one = ctx.n <= 2;
    const a = stand(F, spec, 'twins', courts[0].x, courts[0].z, hp * EG_TWIN_SHARE, now, out, { pt: 0 });
    const b = stand(F, spec, 'twins', one ? courts[0].x + 6 : courts[1].x, one ? courts[0].z + 4 : courts[1].z, hp * EG_TWIN_SHARE, now, out, { pt: 1 });
    F.mem.twins = { a: a.i, b: b.i, crossAt: 0, one };
    return [a, b];
  }
  const L = stand(F, spec, key, x, z, hp, now, out, champ ? { extra: { champ: 1 } } : {});
  if (key === 'markynaz') { const pick = ['colossal', 'unyielding', 'vengeful', 'grudge'][F.h % 4]; F.mem.law = egLordLaw({ [pick]: 1 }); L.decree = pick; }
  if (key === 'kynmarcher') for (const [sx, sz] of spotsOr(spec, L, 'standard', 3, 9).slice(0, 3)) obj(F, 'standard', sx, sz, egHpTeam(F, 4), now, out, { r: 0.8 });
  if (EG_LORDS[key]?.fly) egSetFl(F, L, EG_FL.fly, true, out);
  return [L];
}
/** The lords woken (the Court's wake ring, a champion's hall): each chooses its first blow EG_LORD_WAKE_MS later. */
export function egLordsWake(F, spec, now, out, ctx) {
  let woke = 0;
  for (const L of egLordsOf(F)) {
    if (L.up2) continue;
    woke++;
    L.up2 = true; L.nextAt = now + EG_LORD_WAKE_MS; L.wokeAt = now;
    KITS[L.key]?.wake?.(F, spec, L, now, out, ctx);
  }
  if (!woke) return;
  F.mem.lordWokeAt ??= now;
  say(out, 'wake');
}
/** Is any lord of the fight awake and standing? */
export const egLordsAwake = (F) => egLordsOf(F).some((L) => L.up2);
/** Have all of the fight's lords fallen (the Twins' fifteen seconds kept)? */
export const egLordsFell = (F) => !!F.mem.lordsFell;

/**
 * ONE BEAT of the fight's lords: each awake one carried, its phase turned at its threshold (its ward, its errand), its
 * stun run out, its signature's timers run, its next blow chosen at its breath's end at its target by weight (or a walk
 * at it); fury and THE COVENANT'S WEIGHT; the feints cut at FEINT_AT.
 * @param {any} F @param {any} spec @param {number} now @param {{sub: string, x: number, z: number}[]} here @param {() => number} rng
 * @param {any[]} out @param {any} ctx `{ decrees, covenant (the count spent in a Court), n, all (every living sub) }`
 */
export function egLordsStep(F, spec, now, here, rng, out, ctx) {
  const law = F.mem.law ?? egLordLaw();
  // EG-H1: a feint cut at EG_FEINT_AT of its own wind-up once its word is out (`ecut` - the page's `cut`); one committed,
  // pending or held waits for its word, and one dropped is forgotten
  for (const [i] of F.mem.feints ?? []) { const b = F.blows.find((x) => x.i === i); if (b && now >= egBlowFrom(b) + Math.round(b.wu * EG_FEINT_AT)) egCut(F, i, out); }
  F.mem.feints = (F.mem.feints ?? []).filter(([i]) => F.blows.some((b) => b.i === i) || (F.pend ?? []).some((q) => q.b.i === i) || F.held.some((h) => h.b?.i === i));
  const lords = egLordsOf(F);
  if (!lords.some((L) => L.up2)) return;
  // FURY (section 13.2) and THE COVENANT'S WEIGHT (section 18)
  const ttk = egTtkRef(F.c);
  if (!F.mem.furyAt && (ctx.covenant || now - (F.mem.lordWokeAt ?? now) >= EG_FURY_RATIO * ttk * 1000) && !lords.some((L) => L.champ)) {
    F.mem.furyAt = now; F.mem.furySteps = 0;
    for (const L of lords) egSetFl(F, L, EG_FL.fury, true, out);
    say(out, 'fury', { n: egBossName(lords[0].key, 0) });
  }
  if (F.mem.furyAt && now >= (F.mem.furyNext ?? F.mem.furyAt + EG_FURY_EVERY_MS)) {
    F.mem.furyNext = now + EG_FURY_EVERY_MS;
    F.mem.furySteps = (F.mem.furySteps ?? 0) + 1;
    F.mem.furyX = Math.min(1.5, (F.mem.furyX ?? 1) + EG_FURY_STEP);
    const L0 = lords[0], spots = [];
    for (let k = 0; k < egWaveSize(ctx.n); k++) { const a = rng() * Math.PI * 2; spots.push(egKeepOnFight(spec, L0.x + Math.sin(a) * 9, L0.z + Math.cos(a) * 9, 1)); }
    egLegionRaise(F, egWaveKinds(F, rng, spots.length, { waveNo: (F.mem.waves = (F.mem.waves ?? 0) + 1) }), spots, now, out, { wave: 1000 + F.mem.waves });
  }
  if (ctx.covenant) {
    if (!F.mem.weightAt) { F.mem.weightAt = now; say(out, 'covenant'); }
    if (now >= (F.mem.weightNext ?? 0)) {
      F.mem.weightNext = now + EG_WEIGHT_EVERY_MS;
      lordBlow(F, spec, lords[0], [shAll()], { nm: "The Covenant's Weight", wu: EG_WEIGHT_WU_MS, p: EG_WEIGHT_PCT, b: 0, el: null }, here, now, out, { ch: true });
    }
  }
  for (const L of lords) {
    if (!L.up2 || !(L.hp > 0)) continue;
    if (L.mv) { const m = L.mv, len = Math.hypot(m.tx - m.x, m.tz - m.z), along = len < 1e-6 ? 0 : Math.min(len, (Math.max(0, now - m.at) / 1000) * m.v); L.x = len < 1e-6 ? m.tx : m.x + ((m.tx - m.x) / len) * along; L.z = len < 1e-6 ? m.tz : m.z + ((m.tz - m.z) / len) * along; }
    // threat forgets
    if (law.threatDecay > 0) { const k = Math.max(0, 1 - law.threatDecay * ((now - (L.thAt ?? now)) / 1000)); for (const s of Object.keys(L.threat)) L.threat[s] *= k; }
    L.thAt = now;
    if (L.ward && now >= L.ward) { L.ward = 0; egSetFl(F, L, EG_FL.ward, !!F.mem.wardHeld?.[L.i], out); }
    if (L.stunUntil && now >= L.stunUntil) { L.stunUntil = 0; egSetFl(F, L, EG_FL.stun, false, out); }
    // a phase's turn
    const frac = L.hp / L.max;
    const want = frac <= PHASE_AT[1] ? 3 : frac <= PHASE_AT[0] ? 2 : 1;
    if (want > L.ph && !L.champ) {
      L.ph = want;
      ward(F, L, SHIELD_MS, now, out);
      out.push({ k: 'eph', i: L.i, ph: L.ph });
      KITS[L.key]?.phase?.(F, spec, L, L.ph, now, here, rng, out, ctx);
    }
    KITS[L.key]?.tick?.(F, spec, L, now, here, rng, out, ctx);
    if (!(L.hp > 0)) continue;
    if (L.stunUntil > now || egHas(L, EG_FL.hidden)) continue;
    if (L.atk) { if (now < L.atk.until) continue; if (L.atk.to) egPlace(F, L, L.atk.to[0], L.atk.to[1], now); L.atk = null; L.nextAt = Math.max(L.nextAt, now + EG_LORD_BREATH_MS); }
    if (L.busyUntil > now) continue;
    const target = L.key === 'kynreeve' ? (here.reduce((b, m) => ((L.threat[m.sub] ?? 0) > (L.threat[b?.sub] ?? -1) ? m : b), null) ?? nearest(L.x, L.z, here)) : (L.tg && now - (L.tgAt ?? 0) < 4000 ? here.find((m) => m.sub === L.tg) : null) ?? pickTarget(L, here, rng, law);
    if (!target) { egStop(F, L, now); continue; }
    if (L.tg !== target.sub) { L.tg = target.sub; L.tgAt = now; }
    if (now < L.nextAt) { if (!egHas(L, EG_FL.fly) && L.key !== 'colossus' && dist(L.x, L.z, target.x, target.z) > L.r + 4) egWalk(F, L, target.x, target.z, L.r + 1, L.speed ?? 3.4, now, spec, L.r); continue; }
    const kit = KITS[L.key];
    const blows = (kit?.blows ?? []).filter((b) => (b.ph ?? 1) <= L.ph && (!b.when || b.when(F, L, target, here, ctx)) && now >= (L.cds[b.nm] ?? 0) && dist(L.x, L.z, target.x, target.z) - L.r <= (b.range ?? 40) && dist(L.x, L.z, target.x, target.z) - L.r >= (b.minGap ?? 0));
    const fresh = blows.filter((b) => b.nm !== L.lastBlow || L.run < 2);
    const can = fresh.length ? fresh : blows;
    if (!can.length) { if (!egHas(L, EG_FL.fly) && L.key !== 'colossus') egWalk(F, L, target.x, target.z, L.r + 1, L.speed ?? 3.4, now, spec, L.r); continue; }
    let x = rng() * can.reduce((s, b) => s + (b.w ?? 1), 0), B = can[can.length - 1];
    for (const c of can) { x -= c.w ?? 1; if (x < 0) { B = c; break; } }
    egStop(F, L, now);
    L.yaw = Math.atan2(target.x - L.x, target.z - L.z);
    const made = B.make(F, spec, L, target, here, rng, now, out, ctx);
    const blow = made?.stamps ? lordBlow(F, spec, L, made.stamps, { ...B, ...(made.B ?? {}) }, here, now, out, { feint: made.feint, ch: B.ch, delay: made.delay }) : null;
    if (blow) furyChain(F, spec, L, blow, here, now, out);
    if (made?.extra) for (const e of made.extra) { const b2 = lordBlow(F, spec, L, e.stamps, { ...B, ...e.B }, here, now, out, { delay: e.delay ?? 0 }); if (b2 && e.feint) (F.mem.feints ??= []).push([b2.i]); }
    L.cds[B.nm] = now + (B.cd ?? 0);
    L.run = B.nm === L.lastBlow ? L.run + 1 : 1; L.lastBlow = B.nm;
    const wu = (blow?.wu ?? B.wu) + (made?.delay ?? 0), landAt = blow ? blow.at : now + wu;   // EG-H1: the committed blow's own landing (its lead in it)
    L.atk = { at: landAt, until: landAt + (B.sp ?? 0) + (B.rec ?? 900), to: made?.to ?? null };
  }
}

/**
 * A BLOW ON A LORD's weight before the caps (the bucket still decides what lands): a stun's STUN_HIT_X, a grounding's or a
 * Scorch's x1.3, a kneel's x1.5; the Kynreeve's Shield-Wall (front 75% less, behind 30% more), the Kynmarcher's standards
 * (20% off each standing), a twin's Touched (+25% on the other), Unyielding's x0.85; a ward refuses it (0), and a flyer is
 * out of a blade's reach.
 */
export function egLordHitX(F, L, sub, pose, r, now) {
  if (L.ward > now || egHas(L, EG_FL.ward)) return 0;
  if (egHas(L, EG_FL.fly) && !egHas(L, EG_FL.grounded) && r === HIT_KINDS.Melee) return 0;
  const law = F.mem.law ?? egLordLaw();
  let x = law.hitX;
  if (L.stunUntil > now) x *= STUN_HIT_X;
  if ((L.groundedUntil ?? 0) > now) x *= 1.3;
  if ((L.kneelUntil ?? 0) > now) x *= 1.5;
  if (L.key === 'kynreeve' && pose) x *= egFromFront(L, pose.x, pose.z) ? 0.25 : egFromBehind(L, pose.x, pose.z) ? 1.3 : 1;
  if (L.key === 'kynmarcher') x *= Math.max(0.2, 1 - 0.2 * egObjsOf(F, 'standard').length);
  if (L.key === 'twins') { const fire = egMarkOf(F, sub, 2), frost = egMarkOf(F, sub, 3); if ((L.pt === 1 && fire && fire[2] > now) || (L.pt === 0 && frost && frost[2] > now)) x *= 1.25; }
  return x;
}
/**
 * A BLOW ON A LORD LANDED (`got` what the purse let through): its threat, an errand's hold on the next threshold, the
 * Armsmaster's Riposte, the Spellmaster's images, a mirror's crack, a fall (the Twins' fifteen seconds, the survivor's
 * raise). Answers the frames.
 */
export function egLordHit(F, spec, L, sub, name, got, pose, now, here, out, ctx = {}) {
  if (L.hpFloor != null && L.hp < L.hpFloor) { got -= L.hpFloor - L.hp; L.hp = L.hpFloor; }
  L.threat[sub] = (L.threat[sub] ?? 0) + got * (ctx.threatX ?? 1);
  KITS[L.key]?.hit?.(F, spec, L, sub, got, pose, now, here, out, ctx);
  if (L.hp > 1e-6) return;
  L.hp = 0;
  if (egHas(L, EG_FL.mirror)) { egGone(F, [L], EG_GONE.slain, name, now, out); KITS[L.key]?.mirrorDown?.(F, L, now, out); return; }
  L.fellAt = now;
  egSetFl(F, L, EG_FL.fell, true, out);
  const left = egLordsOf(F).filter((x) => !egHas(x, EG_FL.mirror) && x.hp > 0);
  if (L.key === 'twins' && left.length) { F.mem.twinFellAt = now; say(out, 'twinfell', { n: egBossName('twins', L.pt) }); return; }
  F.mem.lordsFell = 1;
  for (const m of egLordsOf(F).filter((x) => egHas(x, EG_FL.mirror))) egGone(F, [m], EG_GONE.crumbled, '', now, out);
  out.push({ k: 'efell', i: L.i, at: now, n: name });
}

// ── the kits ─────────────────────────────────────────────────────────────────────────────────────────────
const at = (m) => [m.x, m.z];
/** A blow toward the target: a lane from the lord. */
const laneTo = (L, t, len, w) => shLaneAt(L.x, L.z, Math.atan2(t.x - L.x, t.z - L.z), len, w);
/** The gate's three (and the Meteor) as kit rows. */
const gateKit = (el) => [
  { ...CLEAVE, range: 7, w: 3, make: (F, spec, L, t) => ({ stamps: [shCone(L.x, L.z, Math.atan2(t.x - L.x, t.z - L.z), 9, 110)] }) },
  { ...SLAM, range: 4, w: 2, make: (F, spec, L) => ({ stamps: [shDisc(L.x, L.z, 7)] }) },
  { ...METEOR, el, range: 40, w: 1, ph: 1, cd: 9000, make: (F, spec, L, t) => ({ stamps: [shDisc(t.x, t.z, 6.5)] }) },
];
const champKit = () => [
  { ...CLEAVE, range: 7, w: 3, make: (F, spec, L, t) => ({ stamps: [shCone(L.x, L.z, Math.atan2(t.x - L.x, t.z - L.z), 9, 110)] }) },
  { ...SLAM, range: 4, w: 2, make: (F, spec, L) => ({ stamps: [shDisc(L.x, L.z, 7)] }) },
  { ...CHARGE, range: 40, minGap: 8, w: 2, sp: 900, make: (F, spec, L, t) => { const yaw = Math.atan2(t.x - L.x, t.z - L.z), [ex, ez] = egKeepOnFight(spec, L.x + Math.sin(yaw) * 22, L.z + Math.cos(yaw) * 22, L.r); return { stamps: [shLane(L.x, L.z, ex, ez, 4)], to: [ex, ez] }; } },
];

/** THE KITS: each lord's blows (`make` its stamps), and its signature's hooks - `wake`, `phase`, `tick`, `hit`. */
const KITS = {
  // ── the Proving champions (section 8.5) ──
  kynreeve: { blows: champKit() },
  kynmarcher: { blows: champKit() },
  markynaz: { blows: champKit() },

  // ── GRATH, THE HOUND: a fight about ground ──
  hound: {
    blows: [
      { nm: 'Gore', wu: 1300, rec: 1000, p: 0.4, b: 12, pu: 6, range: 18, minGap: 4, w: 3, make: (F, spec, L, t) => ({ stamps: [laneTo(L, t, 18, 4)] }) },
      { nm: 'Savage', wu: 1200, rec: 900, p: 0.45, b: 12, range: 6, w: 3, make: (F, spec, L, t) => ({ stamps: [shCone(L.x, L.z, Math.atan2(t.x - L.x, t.z - L.z), 7, 110)] }) },
      { nm: 'Leap', wu: 1500, rec: 1500, p: 0.45, b: 12, range: 60, minGap: 14, w: 2, cd: 8000, when: (F, L, t) => islandOf(F, t) != null && islandOf(F, t) !== islandOf(F, L), make: (F, spec, L, t, here, rng, now, out) => {
        const from = islandOf(F, L), to = egObjsOf(F, 'isle').find((o) => o.i === islandOf(F, t));
        if (!to) return null;
        if (from) crack(F, from, now, out);
        return { stamps: [shDisc(to.x, to.z, 6)], to: [to.x, to.z] };
      } },
    ],
    wake(F, spec, L, now, out) {
      for (const s of spec.spots.isle ?? []) obj(F, 'isle', s.x, s.z, 0, now, out, { r: 11 });
      F.mem.scentAt = now + 12_000; F.mem.burnAt = 0;
    },
    phase(F, spec, L, ph, now, here, rng, out) { if (ph === 2) { F.mem.burnAt = now + 4000; say(out, 'phase', { t: 'The bridges burn.' }); } if (ph === 3) say(out, 'phase', { t: 'The pack hunts.' }); },
    tick(F, spec, L, now, here, rng, out, ctx) {
      // the islands crack and fall, and rise again
      for (const o of egObjsOf(F, 'isle')) {
        if (o.st === 1 && now >= o.stAt) { o.st = 2; o.stAt = now + 15_000; out.push({ k: 'eob', i: o.i, st: 2, at: now }); zoneOut(F, 'void', shDisc(o.x, o.z, 11), now, now + 15_000, out); }
        else if (o.st === 2 && now >= o.stAt) { o.st = 0; out.push({ k: 'eob', i: o.i, st: 0, at: now }); }
      }
      // THE SCENT: a member hunted for 8 s at 5.2 m/s; a catch is a Maul (n = 1: no Scent - it gores twice as often)
      if (ctx.n >= 2 && now >= (F.mem.scentAt ?? Infinity) && !F.mem.scent) {
        const k = L.ph >= 3 && ctx.n >= 3 ? 2 : 1, picks = [...here].sort(() => rng() - 0.5).slice(0, k);
        F.mem.scent = picks.map((m) => ({ sub: m.sub, until: now + 8000 }));
        for (const p of picks) egMark(F, p.sub, 0, now + 8000);
        F.mem.mkDirty = 1;
        say(out, 'scent', { s: picks.map((p) => p.sub) });
        L.busyUntil = now + 8000; L.speed = 5.2;
      }
      if (F.mem.scent) {
        const hunt = F.mem.scent.find((s) => s.until > now);
        const m = hunt ? here.find((x) => x.sub === hunt.sub) : null;
        if (!hunt || !m) { F.mem.scent = null; F.mem.scentAt = now + 20_000; L.busyUntil = 0; L.speed = 3.4; for (const m2 of here) egUnmark(F, m2.sub, 0); F.mem.mkDirty = 1; }
        else if (!L.atk) {
          // led onto a burning bridge or a cracking island, he is Scorched
          const burning = (F.mem.burning ?? []).some((z) => z.until > now && z.s && z.s[0] === 'l' && segHit(z.s, L.x, L.z));
          const cracking = egObjsOf(F, 'isle').some((o) => o.st === 1 && dist(o.x, o.z, L.x, L.z) <= 11);
          if (burning || cracking) { egStun(F, L, 4000, now, out); L.scorchUntil = now + 4000; L.groundedUntil = now + 4000; F.mem.scent = null; F.mem.scentAt = now + 20_000; L.busyUntil = 0; say(out, 'scorched'); }
          else if (dist(L.x, L.z, m.x, m.z) <= L.r + 1.5) {
            L.atk = { at: now + 1200, until: now + 2400 };
            lordBlow(F, spec, L, [shDisc(m.x, m.z, 3)], { nm: 'Maul', wu: 1200, p: 0.35, b: 10, el: null }, here, now, out);
            hunt.until = now;
          } else egWalk(F, L, m.x, m.z, 0.5, 5.2, now, spec, L.r);
        }
      }
      // phase 2: the bridges burn by turns - each told 3 s, burning 12 s
      if (F.mem.burnAt && now >= F.mem.burnAt) {
        const bridges = spec.spots.bridge ?? [];
        if (bridges.length) {
          const b = bridges[(F.mem.burnI = ((F.mem.burnI ?? -1) + 1) % bridges.length)];
          const s = shLane(b.x, b.z, b.bx, b.bz, 6);
          egAim(F, spec, { o: L.i, s: [s], at: now + 3000, wu: 3000, p: 0.2 * egShareX(F.c), b: 4, el: 'fire', nm: 'Burning Bridge', sp: 12_000, ch: 1 }, [], now, out);
          (F.mem.burning ??= []).push({ s, until: now + 15_000 });
        }
        F.mem.burnAt = now + 14_000;
      }
      if (ctx.n === 1) L.cds.Gore = Math.min(L.cds.Gore ?? 0, now);
    },
  },

  // ── THE LAST SPELLMASTER: a fight about reading ──
  spellmaster: {
    blows: [
      { nm: 'Haven Nova', wu: 4000, rec: 1000, p: 0.6, b: 0, el: 'shock', ch: true, range: 99, w: 1, cd: 22_000, make: (F, spec, L, t, here, rng, now) => {
        const all = spotsOr(spec, L, 'haven', 4, 13).map(([x, z]) => [x, z, 3]), k = Math.max(2, Math.min(4, Math.ceil(here.length / 2) + 1)), havens = all.slice(0, k);
        const f = mainDisc(spec, L);
        return { stamps: [shOut(havens)], B: { wu: havenWu(havens, fieldOf(f.x, f.z, f.r)) } };
      } },
      { nm: 'Arcane Lattice', wu: 1400, rec: 800, p: 0.35, b: 10, el: 'shock', range: 99, w: 2, cd: 12_000, make: (F, spec, L, t) => {
        const f = mainDisc(spec, L), yaw = Math.atan2(t.x - L.x, t.z - L.z) + Math.PI / 2, ux = Math.sin(yaw), uz = Math.cos(yaw), vx = Math.cos(yaw), vz = -Math.sin(yaw);
        const lanes = [-12, -4, 4, 12].map((o) => shLane(f.x + vx * o - ux * f.r, f.z + vz * o - uz * f.r, f.x + vx * o + ux * f.r, f.z + vz * o + uz * f.r, 4));
        return { stamps: [lanes[0]], extra: lanes.slice(1).map((s, j) => ({ stamps: [s], delay: 1400 * (j + 1), B: {} })) };
      } },
      { nm: 'Arcane Bolt', wu: 1600, rec: 700, p: 0.3, b: 8, el: 'shock', range: 30, w: 3, make: (F, spec, L, t) => ({ stamps: [shDisc(t.x, t.z, 3)] }) },
      { nm: 'Mirror Images', wu: 600, rec: 400, p: 0, b: 0, range: 99, w: 1, cd: 30_000, when: (F) => egLordsOf(F).filter((x) => egHas(x, EG_FL.mirror)).length === 0, make: (F, spec, L, t, here, rng, now, out) => {
        for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + rng(); const [x, z] = egKeepOnFight(spec, L.x + Math.sin(a) * 8, L.z + Math.cos(a) * 8, 1); const im = stand(F, spec, 'spellmaster', x, z, 1, now, out, { pt: 1 + k, fl: EG_FL.mirror }); if (im) { im.up2 = true; im.nextAt = now + 1500 + k * 700; im.image = 1; } }
        say(out, 'images');
        return null;
      } },
      { nm: 'Blink', wu: 500, rec: 300, p: 0, b: 0, range: 99, minGap: 0, w: 1, cd: 15_000, make: (F, spec, L, t, here, rng, now) => { const f = mainDisc(spec, L), a = Math.atan2(L.x - f.x, L.z - f.z) + Math.PI; return { stamps: null, to: egKeepOnFight(spec, f.x + Math.sin(a) * f.r * 0.7, f.z + Math.cos(a) * f.r * 0.7, 2) }; } },
    ],
    phase(F, spec, L, ph, now, here, rng, out, ctx) {
      if (ph === 2) examination(F, spec, L, now, here, rng, out, ctx);
      if (ph === 3) finalExam(F, spec, L, now, here, rng, out, ctx);
    },
    tick(F, spec, L, now, here, rng, out, ctx) {
      // the images' blows are feints (cut at FEINT_AT, no glint, no WIND)
      for (const im of egLordsOf(F).filter((x) => x.image)) {
        if (now < im.nextAt || im.atk) continue;
        const t = pickTarget(im, here, rng, F.mem.law ?? egLordLaw());
        if (!t) continue;
        lordBlow(F, spec, im, [shCone(im.x, im.z, Math.atan2(t.x - im.x, t.z - im.z), 8, 100)], { nm: 'Arcane Cleave', wu: 1500, p: 0.4, b: 10, el: 'shock' }, here, now, out, { feint: true });
        im.atk = { at: now + 1500, until: now + 2600 }; im.nextAt = now + 4000;
      }
      for (const im of egLordsOf(F).filter((x) => x.image && x.atk && now >= x.atk.until)) im.atk = null;
      errandTick(F, spec, L, now, here, rng, out);
    },
  },

  // ── THE LAST ARMSMASTER: a fight about the duel ──
  armsmaster: {
    blows: [
      { nm: 'Lunge', wu: 1000, rec: 900, p: 0.4, b: 12, range: 10, minGap: 3, w: 3, make: (F, spec, L, t) => { const yaw = Math.atan2(t.x - L.x, t.z - L.z); return { stamps: [shLaneAt(L.x, L.z, yaw, 10, 4)], to: egKeepOnFight(spec, L.x + Math.sin(yaw) * 8, L.z + Math.cos(yaw) * 8, L.r) }; } },
      { nm: 'Whirl', wu: 1300, rec: 1100, p: 0.45, b: 12, range: 3, w: 2, make: (F, spec, L) => ({ stamps: [shDisc(L.x, L.z, 4)] }) },
      { nm: 'Guard', wu: 600, rec: 200, p: 0, b: 0, range: 8, w: 1, cd: 9000, make: (F, spec, L, t, here, rng, now, out) => { L.guardUntil = now + 600; egSetFl(F, L, EG_FL.lit, true, out); return null; } },
    ],
    wake(F, spec, L, now) { F.mem.challengeAt = now + 15_000; },
    phase(F, spec, L, ph, now, here, rng, out) { if (ph === 2) say(out, 'phase', { t: 'The second challenge.' }); if (ph === 3) { F.mem.lessonR = mainDisc(spec, L).r; F.mem.lessonAt = now + 6000; say(out, 'phase', { t: 'The Last Lesson.' }); } },
    hit(F, spec, L, sub, got, pose, now, here, out) {
      // THE RIPOSTE: a blow landed in the 0.6 s after his guard rises is answered - a cone at the striker
      if ((L.guardUntil ?? 0) > now && pose) {
        L.guardUntil = 0; egSetFl(F, L, EG_FL.lit, false, out);
        lordBlow(F, spec, L, [shCone(L.x, L.z, Math.atan2(pose.x - L.x, pose.z - L.z), 5, 90)], { nm: 'Riposte', wu: 900, p: 0.5, b: 14, el: null }, here, now, out);
      }
      const ch = F.mem.challenge;
      if (ch && ch.subs.includes(sub)) { ch.dealt += got; if (ch.dealt >= L.max / 10) endChallenge(F, L, now, out, true); }
    },
    tick(F, spec, L, now, here, rng, out, ctx) {
      if ((L.guardUntil ?? 0) && now >= L.guardUntil) { L.guardUntil = 0; egSetFl(F, L, EG_FL.lit, false, out); }
      challengeTick(F, spec, L, now, here, rng, out, ctx, 15_000);
      if (L.ph >= 3 && F.mem.lessonR > 12 && now >= F.mem.lessonAt) {
        F.mem.lessonR -= 1; F.mem.lessonAt = now + 6000;
        const f = mainDisc(spec, L);
        zoneOut(F, 'burn', shRing(f.x, f.z, F.mem.lessonR, f.r + 4), now, now + 6000, out, { p: 0.08, b: 3, el: 'fire' });
      }
    },
  },

  // ── VALKYNAZ ILTHYS OF THE GALLERIES: the Conquest ──
  ilthys: {
    blows: [
      ...gateKit('fire'),
      { nm: 'Spear of the Conquest', wu: 1300, rec: 1000, p: 0.4, b: 12, el: 'fire', range: 22, w: 2, make: (F, spec, L, t) => ({ stamps: [laneTo(L, t, 22, 4)] }) },
      { nm: 'The Muster-Call', wu: 800, rec: 600, p: 0, b: 0, range: 99, w: 1, cd: 30_000, make: (F, spec, L, t, here, rng, now, out, ctx) => { const spots = spotsOr(spec, L, 'balcony', 3, 18); if (spots.length) egLegionRaise(F, egWaveKinds(F, rng, egWaveSize(ctx.n)), spots, now, out, { wave: 2000 + now % 1000 }); say(out, 'muster'); return null; } },
    ],
    wake(F, spec, L, now) { F.mem.conquestAt = now + 20_000; },
    phase(F, spec, L, ph, now, here, rng, out) { if (ph === 3) { F.mem.chargeAt = now + 5000; say(out, 'phase', { t: 'The Last Charge.' }); } },
    tick(F, spec, L, now, here, rng, out, ctx) {
      // THE CONQUEST: a banner on each balcony claims a third of the floor - it burns until its banner is broken; while
      // two stand they hold his ward (25 s at most)
      const f = mainDisc(spec, L);
      if (now >= (F.mem.conquestAt ?? Infinity) && !egObjsOf(F, 'banner').length) {
        F.mem.conquestAt = now + 45_000;
        spotsOr(spec, L, 'balcony', 3, f.r - 2).map(([x, z]) => ({ x, z })).forEach((b, j) => {
          const ban = obj(F, 'banner', b.x, b.z, egHpTeam(F, 4), now, out, { r: 0.8, extra: { third: j } });
          if (ban) { const yaw = Math.atan2(b.x - f.x, b.z - f.z); ban.zone = zoneOut(F, 'burn', shCone(f.x, f.z, yaw, f.r, 120), now + 3500, now + 60_000, out, { p: 0.08, b: 3, el: 'fire' }); }
        });
        F.mem.bannerWardUntil = now + 25_000;
        say(out, 'conquest');
      }
      const banners = egObjsOf(F, 'banner');
      const held = banners.length >= 2 && now < (F.mem.bannerWardUntil ?? 0);
      (F.mem.wardHeld ??= {})[L.i] = held;
      if (held !== egHas(L, EG_FL.ward) && !(L.ward > now)) egSetFl(F, L, EG_FL.ward, held, out);
      // THE LAST CHARGE: a third of the floor falls every 20 s, told 5 s ahead, and rises when the next falls
      if (L.ph >= 3 && now >= (F.mem.chargeAt ?? Infinity)) {
        F.mem.chargeAt = now + 20_000;
        const third = (F.mem.third = ((F.mem.third ?? -1) + 1) % 3), yaw = (third * 2 * Math.PI) / 3;
        egAim(F, spec, { o: L.i, s: [shCone(f.x, f.z, yaw, f.r + 1, 120)], at: now + 5000, wu: 5000, p: 0.1, b: 0, el: null, nm: 'The Floor Falls', ch: 1 }, [], now, out);
        zoneOut(F, 'void', shCone(f.x, f.z, yaw, f.r + 1, 118), now + 5000, now + 20_000, out);
      }
    },
  },

  // ── THE CAIRN-KEEPER: a fight about eight people's errands ──
  cairnkeeper: {
    blows: [
      { nm: 'Soul Bolt', wu: 1600, rec: 700, p: 0.3, b: 8, el: 'poison', range: 30, w: 3, make: (F, spec, L, t) => ({ stamps: [shDisc(t.x, t.z, 3)] }) },
      { nm: 'Tomb Slam', wu: 1500, rec: 1300, p: 0.4, b: 12, range: 5, w: 2, make: (F, spec, L) => ({ stamps: [shDisc(L.x, L.z, 6)] }) },
      { nm: 'Bone Lance', wu: 1300, rec: 900, p: 0.35, b: 10, el: 'poison', range: 14, w: 2, make: (F, spec, L, t) => ({ stamps: [laneTo(L, t, 14, 4)] }) },
    ],
    wake(F, spec, L, now, out, ctx) {
      for (const [gx, gz] of spotsOr(spec, L, 'gem', 4, 12.5)) obj(F, 'gem', gx, gz, 0, now, out, { r: 1.5, extra: { souls: 0, cap: ctx.n } });
      F.mem.titheAt = now + 15_000;
    },
    phase(F, spec, L, ph, now, here, rng, out, ctx) {
      if (ph === 2) { const gems = egObjsOf(F, 'gem'); const g = gems[Math.floor(rng() * gems.length)]; if (g) { egGone(F, [g], EG_GONE.crumbled, '', now, out); const rest = egObjsOf(F, 'gem'); const total = 4 * ctx.n; rest.forEach((o, j) => { o.cap = Math.floor(total / rest.length) + (j < total % rest.length ? 1 : 0); o.souls = 0; }); } say(out, 'phase', { t: 'The Cracked Gem.' }); }
      if (ph === 3) say(out, 'phase', { t: 'The Double Tithe.' });
    },
    tick(F, spec, L, now, here, rng, out, ctx) {
      // THE SOUL TITHE: every 25 s each member takes a soul-mark, to be laid in a gem (stand 1.5 s) within 9 s
      if (now >= (F.mem.titheAt ?? Infinity)) {
        F.mem.titheAt = now + 25_000;
        const k = L.ph >= 3 && ctx.n >= 2 ? 2 : 1;
        F.mem.tithe = here.map((m) => ({ sub: m.sub, left: k, until: now + 9000, stood: 0, gem: 0 }));
        for (const m of here) egMark(F, m.sub, 1, now + 9000, k);
        F.mem.mkDirty = 1;
        say(out, 'tithe');
      }
      const T = F.mem.tithe;
      if (T) {
        const gems = egObjsOf(F, 'gem');
        for (const t of T) {
          if (t.left <= 0) continue;
          const m = here.find((x) => x.sub === t.sub);
          const g = m ? gems.find((o) => o.souls < o.cap && dist(o.x, o.z, m.x, m.z) <= 1.5) : null;
          if (g) { if (t.gem !== g.i) { t.gem = g.i; t.stood = now; } if (now - t.stood >= 1500) { g.souls++; t.left--; t.stood = now; out.push({ k: 'eob', i: g.i, st: g.souls, at: now }); if (t.left <= 0) { egUnmark(F, t.sub, 1); F.mem.mkDirty = 1; } else egMark(F, t.sub, 1, t.until, t.left); } }
          else t.gem = 0;
          if (now >= t.until && t.left > 0) {
            t.left = 0; egUnmark(F, t.sub, 1); F.mem.mkDirty = 1;
            if (m) { egAim(F, spec, { o: L.i, s: [shDisc(m.x, m.z, 2)], at: now + 600, wu: 600, p: 0.3, b: 0, el: 'poison', nm: 'Soul Burst', ch: 1 }, [], now, out); egLegionRaise(F, L.ph >= 3 ? [EG_KIND.wraith, EG_KIND.wraith] : [EG_KIND.wraith], [[m.x + 2, m.z]], now, out); }
          }
        }
        if (T.every((t) => t.left <= 0)) F.mem.tithe = null;
        if (gems.length && gems.every((o) => o.souls >= o.cap)) { egStun(F, L, 8000, now, out); for (const o of gems) { o.souls = 0; out.push({ k: 'eob', i: o.i, st: 0, at: now }); } say(out, 'bare'); }
      }
    },
  },

  // ── THE TWIN LORDS, VAEL AND ISK: a fight about splitting the company ──
  twins: {
    blows: [
      { nm: 'Clan Cleave', wu: 1300, rec: 900, p: 0.4, b: 12, range: 7, w: 3, make: (F, spec, L, t) => ({ stamps: [shCone(L.x, L.z, Math.atan2(t.x - L.x, t.z - L.z), 8, 100)], B: { el: L.pt === 1 ? 'frost' : 'fire' } }) },
      { nm: 'Clan Bolt', wu: 1600, rec: 700, p: 0.3, b: 8, range: 30, w: 2, make: (F, spec, L, t) => ({ stamps: [shDisc(t.x, t.z, 3)], B: { el: L.pt === 1 ? 'frost' : 'fire' } }) },
    ],
    wake(F, spec, L, now) { F.mem.twins.crossAt = now + 60_000; },
    phase(F, spec, L, ph, now, here, rng, out) {
      if (ph === 2) say(out, 'phase', { t: 'Rivalry.' });
      if (ph === 3 && !F.mem.twinsBurn) {
        F.mem.twinsBurn = 1;
        const courts = spec.lord === 'twins' ? spec.spots.court ?? [] : [];
        if (courts.length === 2) for (const [k, c] of courts.entries()) { const toward = k === 0 ? 0 : Math.PI; zoneOut(F, 'burn', shCone(c.x, c.z, toward, 14.2, 120), now + 3000, now + 600_000, out, { p: 0.08, b: 3, el: k === 0 ? 'frost' : 'fire' }); }
        say(out, 'phase', { t: 'Both Courts Burn.' });
      }
    },
    tick(F, spec, L, now, here, rng, out) {
      const T = F.mem.twins, a = egBodyById(F, T.a), b = egBodyById(F, T.b);
      // Rivalry: the healthier's shares a tenth up while they stand more than a tenth apart
      if (a && b && L.ph >= 2) { const fa = a.hp / a.max, fb = b.hp / b.max; a.shareX = fa > fb + 0.1 ? 1.1 : 1; b.shareX = fb > fa + 0.1 ? 1.1 : 1; }
      // THE CROSSING: every 60 s they change courts - the walkway struck along its length
      if (L === a && !T.one && now >= T.crossAt && a && b && a.hp > 0 && b.hp > 0) {
        T.crossAt = now + 60_000;
        const w = spec.fl?.find((f) => f.t === 'l');
        if (w) egAim(F, spec, { o: a.i, s: [shLane(w.ax, w.az, w.bx, w.bz, 6)], at: now + 3000, wu: 3000, p: 0.35, b: 10, el: 'fire', nm: 'The Crossing' }, here, now, out);
        T.swapAt = now + 3000;
        say(out, 'crossing');
      }
      if (L === a && T.swapAt && now >= T.swapAt && a && b) { T.swapAt = 0; const ax = a.x, az = a.z; egPlace(F, a, b.x, b.z, now); egPlace(F, b, ax, az, now); }
      // the Echoes' law: fallen apart by more than the window, the survivor raises the other at half
      if (F.mem.twinFellAt && L.hp > 0 && now - F.mem.twinFellAt > (T.one ? 20_000 : 15_000)) {
        const dead = [a, b].find((x) => x && !(x.hp > 0));
        if (dead) { dead.hp = Math.round(dead.max / 2); egSetFl(F, dead, EG_FL.fell, false, out); F.mem.twinFellAt = 0; say(out, 'twinraised', { n: egBossName('twins', dead.pt) }); }
      }
    },
  },

  // ── VALKYNAZ MORVAYN OF THE CAIRN: the Chaining ──
  morvayn: {
    blows: [
      ...gateKit('poison'),
      { nm: 'Venom Lash', wu: 1300, rec: 900, p: 0.4, b: 12, el: 'poison', range: 8, w: 2, make: (F, spec, L, t) => ({ stamps: [shCone(L.x, L.z, Math.atan2(t.x - L.x, t.z - L.z), 8, 90)] }) },
      { nm: 'Soul Rend', wu: 1500, rec: 900, p: 0.45, b: 12, el: 'poison', range: 99, w: 2, when: (F) => (F.mem.chains ?? []).length > 0, make: (F, spec, L, t, here) => { const c = F.mem.chains[0], a = here.find((m) => m.sub === c[0]), b = here.find((m) => m.sub === c[1]); return a && b ? { stamps: [shDisc((a.x + b.x) / 2, (a.z + b.z) / 2, 4)] } : null; } },
    ],
    wake(F, spec, L, now) { F.mem.chainAt = now + 15_000; },
    phase(F, spec, L, ph, now, here, rng, out) { if (ph === 3) { F.mem.ritesAt = now + 5000; say(out, 'phase', { t: 'The Last Rites.' }); } },
    tick(F, spec, L, now, here, rng, out, ctx) {
      // THE CHAINING: pairs bound for 20 s - stretched past 8 m, both take 30% (a CHECK); an odd member to a Wraith
      if (now >= (F.mem.chainAt ?? Infinity)) {
        F.mem.chainAt = now + 35_000; F.mem.chainUntil = now + 20_000;
        const size = L.ph >= 3 ? 3 : 2, order = [...here].sort(() => rng() - 0.5), chains = [];
        while (order.length >= size) chains.push(order.splice(0, size).map((m) => m.sub));
        F.tethers = F.tethers.filter((t) => t[2] !== 2);
        for (const c of chains) for (let j = 1; j < c.length; j++) F.tethers.push([c[0], c[j], 2, 800]);
        for (const odd of order) { const [w] = egLegionRaise(F, [EG_KIND.wraith], [[odd.x + 3, odd.z]], now, out); if (w) F.tethers.push([w.i, odd.sub, 2, 800]); }
        F.mem.chains = chains;
        for (const c of chains) for (const s of c) egMark(F, s, 4, now + 20_000);
        F.mem.txDirty = 1; F.mem.mkDirty = 1;
        say(out, 'chaining');
      }
      if (F.mem.chainUntil && now >= F.mem.chainUntil) { F.tethers = F.tethers.filter((t) => t[2] !== 2); F.mem.chains = []; F.mem.chainUntil = 0; F.mem.txDirty = 1; for (const m of here) egUnmark(F, m.sub, 4); F.mem.mkDirty = 1; }
      for (const c of F.mem.chains ?? []) {
        const ms = c.map((s) => here.find((m) => m.sub === s)).filter(Boolean);
        for (let j = 1; j < ms.length; j++) if (dist(ms[0].x, ms[0].z, ms[j].x, ms[j].z) > 8 && now >= (F.mem.snapAt ?? 0)) {
          F.mem.snapAt = now + 3000;
          egAim(F, spec, { o: L.i, s: [shDisc(ms[0].x, ms[0].z, 1.5), shDisc(ms[j].x, ms[j].z, 1.5)], at: now + 400, wu: 400, p: 0.3, b: 0, el: 'poison', nm: 'The Chain Snaps', ch: 1 }, [], now, out);
        }
      }
      if (L.ph >= 3 && now >= (F.mem.ritesAt ?? Infinity)) { F.mem.ritesAt = now + 20_000; egLegionRaise(F, [EG_KIND.wraith, EG_KIND.wraith], (spec.spots.court ?? []).map((c) => [c.x, c.z]), now, out); }
    },
  },

  // ── THE MOTHER OF DUSK: a fight about the air ──
  dusk: {
    blows: [
      { nm: 'Dusk Dive', wu: 1300, rec: 1400, p: 0.4, b: 12, el: 'frost', range: 99, w: 3, when: (F, L, t, here, ctx) => true, make: (F, spec, L, t) => ({ stamps: [laneTo(L, t, 16, 4)] }) },
      { nm: 'Hellfire', wu: 2000, rec: 900, p: 0.4, b: 9, el: 'fire', range: 99, w: 2, make: (F, spec, L, t, here) => ({ stamps: here.slice(0, 5).map((m) => shDisc(m.x, m.z, 3.5)) }) },
    ],
    wake(F, spec, L, now, out) { for (const [ax, az] of spotsOr(spec, L, 'anchor', 3, 20)) obj(F, 'anchor', ax, az, egHpTeam(F, 6), now, out, { r: 0.9 }); F.mem.gutterAt = now + 30_000; },
    phase(F, spec, L, ph, now, here, rng, out) { if (ph === 2) { F.mem.gustAt = now + 4000; say(out, 'phase', { t: 'Wingbeat.' }); } if (ph === 3) say(out, 'phase', { t: 'Moonfall.' }); },
    tick(F, spec, L, now, here, rng, out) {
      const f = mainDisc(spec, L);
      // she circles over the glade, out of a blade's reach, until her anchors are broken
      if (egHas(L, EG_FL.fly) && !egHas(L, EG_FL.grounded) && !L.atk) { const t = now / 4000; egWalk(F, L, f.x + Math.sin(t) * (f.r - 4), f.z + Math.cos(t) * (f.r - 4), 0.5, 6, now, spec, 0, true); }
      if (!egObjsOf(F, 'anchor').length && !egHas(L, EG_FL.grounded) && !F.mem.groundedUntil) {
        F.mem.groundedUntil = now + 30_000; L.groundedUntil = now + 30_000;
        egSetFl(F, L, EG_FL.grounded, true, out);
        egPlace(F, L, f.x, f.z, now);
        say(out, 'grounded');
      }
      if (F.mem.groundedUntil && now >= F.mem.groundedUntil) {
        F.mem.groundedUntil = 0; egSetFl(F, L, EG_FL.grounded, false, out);
        F.mem.anchorsBackAt = now + (L.ph >= 3 ? 40_000 : 20_000);
      }
      if (F.mem.anchorsBackAt && now >= F.mem.anchorsBackAt) {
        F.mem.anchorsBackAt = 0;
        for (const [ax, az] of spotsOr(spec, L, 'anchor', 3, 20)) { obj(F, 'anchor', ax, az, egHpTeam(F, 6), now, out, { r: 0.9 }); if (L.ph >= 3) egLegionRaise(F, [EG_KIND.diver, EG_KIND.diver], [[ax, az]], now, out); }
        say(out, 'anchors');
      }
      // Wingbeat: a glade-wide gust every 8 s, told 1 s - 3 m/s for 1 s
      if (L.ph >= 2 && now >= (F.mem.gustAt ?? Infinity)) { F.mem.gustAt = now + 8000; const a = rng() * Math.PI * 2; out.push({ k: 'egust', at: now + 1000, dx: r2(Math.sin(a)), dz: r2(Math.cos(a)), v: 3, ms: 1000 }); }
      // Gutterdark: the braziers gutter in turn
      if (now >= (F.mem.gutterAt ?? Infinity)) { F.mem.gutterAt = now + 30_000; out.push({ k: 'edark', until: now + 10_000 }); }
    },
  },

  // ── THE NIGHT-STALKER: a fight about distance ──
  stalker: {
    blows: [
      { nm: 'Shadow Strike', wu: 1300, rec: 900, p: 0.4, b: 12, range: 6, w: 3, make: (F, spec, L, t) => ({ stamps: [shCone(L.x, L.z, Math.atan2(t.x - L.x, t.z - L.z), 6, 110)] }) },
      { nm: 'Night Lunge', wu: 1200, rec: 1000, p: 0.4, b: 12, range: 12, minGap: 3, w: 2, make: (F, spec, L, t) => { const yaw = Math.atan2(t.x - L.x, t.z - L.z); return { stamps: [shLaneAt(L.x, L.z, yaw, 12, 4)], to: egKeepOnFight(spec, L.x + Math.sin(yaw) * 10, L.z + Math.cos(yaw) * 10, L.r) }; } },
    ],
    wake(F, spec, L, now) { F.mem.vanishAt = now + 12_000; F.mem.tetherAt = now + 20_000; },
    phase(F, spec, L, ph, now, here, rng, out) { if (ph === 2) say(out, 'phase', { t: 'Three Shadows.' }); if (ph === 3) say(out, 'phase', { t: 'Blood Moon.' }); },
    tick(F, spec, L, now, here, rng, out, ctx) {
      const f = mainDisc(spec, L);
      // he vanishes: where he stands is an umbral disc on the floor (three in phase 2 - the true one glints)
      if (now >= (F.mem.vanishAt ?? Infinity)) {
        F.mem.vanishAt = now + 25_000; F.mem.reappearAt = now + 6000;
        egSetFl(F, L, EG_FL.hidden, true, out);
        const spots = [egKeepOnFight(spec, f.x + (rng() - 0.5) * f.r, f.z + (rng() - 0.5) * f.r, 3)];
        if (L.ph >= 2) for (let k = 0; k < 2; k++) spots.push(egKeepOnFight(spec, f.x + (rng() - 0.5) * f.r, f.z + (rng() - 0.5) * f.r, 3));
        const trueAt = Math.floor(rng() * spots.length);
        spots.forEach((p, j) => obj(F, 'umbra', p[0], p[1], 0, now, out, { r: 2, extra: { real: j === trueAt ? 1 : 0 }, pt: j === trueAt ? 1 : 0 }));
        egPlace(F, L, spots[trueAt][0], spots[trueAt][1], now);
        say(out, 'vanish');
      }
      if (F.mem.reappearAt && now >= F.mem.reappearAt) {
        F.mem.reappearAt = 0;
        egSetFl(F, L, EG_FL.hidden, false, out);
        egGone(F, egObjsOf(F, 'umbra'), EG_GONE.crumbled, '', now, out);
        lordBlow(F, spec, L, [shDisc(L.x, L.z, 5)], { nm: 'Umbral Rising', wu: 1100, p: 0.4, b: 10, el: null }, here, now, out);
      }
      // BLOOD TETHER: two members (three in the Blood Moon), broken by standing 14 m apart (16) for 2 s; it heals him
      if (now >= (F.mem.tetherAt ?? Infinity)) {
        F.mem.tetherAt = now + 30_000;
        F.tethers = F.tethers.filter((t) => t[2] !== 1);
        const brk = L.ph >= 3 ? 16 : 14;
        if (ctx.n >= 2) { const picks = [...here].sort(() => rng() - 0.5).slice(0, L.ph >= 3 ? 3 : 2); for (let j = 1; j < picks.length; j++) F.tethers.push([picks[0].sub, picks[j].sub, 1, brk * 100]); }
        else if (here[0]) { const [th] = egLegionRaise(F, [EG_KIND.thrall], [[here[0].x + 4, here[0].z]], now, out); if (th) F.tethers.push([th.i, here[0].sub, 1, brk * 100]); }
        F.mem.txDirty = 1; F.mem.apart = {}; F.mem.tetherUntil = now + 20_000;
        say(out, 'tether');
      }
      if (F.mem.tetherUntil && now >= F.mem.tetherUntil) { F.mem.tetherUntil = 0; F.tethers = F.tethers.filter((x) => x[2] !== 1); F.mem.txDirty = 1; }
      for (const t of F.tethers.filter((x) => x[2] === 1)) {
        const a = typeof t[0] === 'string' ? here.find((m) => m.sub === t[0]) : egBodyById(F, t[0]), b = here.find((m) => m.sub === t[1]);
        if (!a || !b) { F.tethers = F.tethers.filter((x) => x !== t); F.mem.txDirty = 1; continue; }
        const key = `${t[0]}|${t[1]}`;
        if (dist(a.x, a.z, b.x, b.z) >= t[3] / 100) { F.mem.apart ??= {}; F.mem.apart[key] ??= now; if (now - F.mem.apart[key] >= 2000) { F.tethers = F.tethers.filter((x) => x !== t); F.mem.txDirty = 1; say(out, 'tetherbroken'); } }
        else { if (F.mem.apart) delete F.mem.apart[key]; L.hp = Math.min(L.max, L.hp + L.max * 0.000375); }   // 0.15% of his health a second, a tether
      }
    },
  },

  // ── VALKYNAZ SEYTH OF THE SHADE: the Mirrorcourt ──
  seyth: {
    blows: [
      ...gateKit('frost'),
      { nm: 'Frost Lance', wu: 1200, rec: 900, p: 0.4, b: 12, el: 'frost', range: 18, w: 2, make: (F, spec, L, t) => ({ stamps: [laneTo(L, t, 18, 4)] }) },
      { nm: 'Moonshatter', wu: 1400, rec: 900, p: 0.35, b: 10, el: 'frost', range: 99, w: 2, make: (F, spec, L, t, here) => ({ stamps: here.slice(0, 3).map((m) => shDisc(m.x, m.z, 2.5)) }) },
    ],
    wake(F, spec, L, now, out) { F.mem.eclipseAt = now + 20_000; F.mem.mirrorsAt = now + 10_000; },
    phase(F, spec, L, ph, now, here, rng, out) { if (ph === 3) { out.push({ k: 'edark', until: now + 600_000 }); say(out, 'phase', { t: 'The Long Night.' }); } },
    mirrorDown(F, L, now) { F.mem.mirrorsAt = now + 20_000; },
    tick(F, spec, L, now, here, rng, out) {
      const f = mainDisc(spec, L), S = spec.spots.shafts?.[0] ?? { x: f.x, z: f.z, r: Math.min(12, f.r - 4) };
      if (S) F.pg.shafts = moonShafts(S, now);
      // THE ECLIPSE: every 40 s everyone outside the moon-shafts takes 30% (a CHECK; havens from 6 s out)
      if (S && now >= (F.mem.eclipseAt ?? Infinity)) {
        F.mem.eclipseAt = now + 40_000;
        const landAt = now + 6000, havens = moonShafts(S, landAt).map(([x, z]) => [x, z, 3]);
        egAim(F, spec, { o: L.i, s: [shOut(havens)], at: landAt, wu: 6000, p: 0.3, b: 0, el: 'frost', nm: 'The Eclipse', ch: 1 }, [], now, out);
        say(out, 'eclipse');
      }
      // THE MIRRORCOURT: two mirror lords beside him throw real blows at half share; each shatters after 8 s of the
      // company's reference damage and returns 20 s later
      if (now >= (F.mem.mirrorsAt ?? Infinity) && egLordsOf(F).filter((x) => egHas(x, EG_FL.mirror)).length < 2) {
        F.mem.mirrorsAt = Infinity;
        for (let k = egLordsOf(F).filter((x) => egHas(x, EG_FL.mirror)).length; k < 2; k++) {
          const a = rng() * Math.PI * 2, [x, z] = egKeepOnFight(spec, f.x + Math.sin(a) * 10, f.z + Math.cos(a) * 10, 2);
          const mi = stand(F, spec, 'seyth', x, z, egHpTeam(F, 8), now, out, { pt: 1 + k, fl: EG_FL.mirror });
          if (mi) { mi.up2 = true; mi.nextAt = now + 2000; mi.shareX = 0.5; }
        }
        say(out, 'mirrors');
      }
    },
  },

  // ── THE BOUND COLOSSUS: a fight you climb ──
  colossus: {
    blows: [
      { nm: 'Stamp', wu: 1400, rec: 900, p: 0.45, b: 12, range: 99, w: 3, make: (F, spec, L) => ({ stamps: [shLaneAt(L.x, L.z, L.dir ?? 0, 12, 4)] }) },
      { nm: 'Chain Lightning', wu: 1200, rec: 900, p: 0.35, b: 10, el: 'shock', range: 99, w: 2, make: (F, spec, L, t, here) => {
        const next = here.filter((m) => m !== t && dist(m.x, m.z, t.x, t.z) <= 6).sort((a, b) => dist(a.x, a.z, t.x, t.z) - dist(b.x, b.z, t.x, t.z))[0];
        return { stamps: [shDisc(t.x, t.z, 2.5)], extra: next ? [{ stamps: [shDisc(next.x, next.z, 2.5)], delay: 600, B: {} }] : [] };
      } },
    ],
    wake(F, spec, L, now, out, ctx) {
      const R = spec.spots.route?.[0];
      F.mem.route = R ? [R.z, R.z1] : [L.z, L.z + 30]; L.dir = 0;
      const k = 4 + 2 * Math.floor(ctx.n / 3);
      for (let j = 0; j < k; j++) obj(F, 'heart', L.x, L.z, egHpTeam(F, 3), now, out, { r: 0.7, pt: Math.floor(j / 2) + 1, extra: { off: [((j % 2) ? 1 : -1) * 2.5, (Math.floor(j / 2) - (k / 4)) * 1.5], pair: Math.floor(j / 2) } });
      F.mem.overloadAt = now + 75_000; F.mem.railAt = now + 15_000;
    },
    phase(F, spec, L, ph, now, here, rng, out) { if (ph === 2) say(out, 'phase', { t: 'Paired Hearts.' }); if (ph === 3) { L.kneelUntil = now + 20_000; egStun(F, L, 20_000, now, out); say(out, 'phase', { t: 'Breakdown.' }); } },
    tick(F, spec, L, now, here, rng, out, ctx) {
      // it walks its fixed route down the forge, its hearts riding its back
      const [z0, z1] = F.mem.route;
      if (!(L.stunUntil > now) && !L.atk) { const goal = (L.dir ?? 0) === 0 ? z1 : z0; if (Math.abs(L.z - goal) < 1) L.dir = (L.dir ?? 0) === 0 ? Math.PI : 0; egWalk(F, L, L.x, (L.dir ?? 0) === 0 ? z1 : z0, 0.5, 1.6, now, spec, L.r); }
      for (const h of egObjsOf(F, 'heart')) { h.x = r2(L.x + h.off[0]); h.z = r2(L.z + h.off[1]); }
      // the Rails rise along its flank every 15 s (8 s up) - the hearts are struck only from them
      if (now >= F.mem.railAt) { F.mem.railAt = now + 15_000; F.mem.railUntil = now + 8000; out.push({ k: 'erail', until: now + 8000 }); }
      for (const h of egObjsOf(F, 'heart')) egSetFl(F, h, EG_FL.ward, !(now < (F.mem.railUntil ?? 0)), out);
      // Paired Hearts: a pair broken more than 5 s apart relights
      if (L.ph >= 2) for (const [pair, at] of Object.entries(F.mem.pairBroke ?? {})) if (now - at > 5000) { const mate = egObjsOf(F, 'heart').find((h) => h.pair === Number(pair)); if (mate) { obj(F, 'heart', L.x, L.z, egHpTeam(F, 3), now, out, { r: 0.7, pt: mate.pt, extra: { off: [-mate.off[0], mate.off[1]], pair: mate.pair } }); say(out, 'relit'); } delete F.mem.pairBroke[pair]; }
      // THE OVERLOAD: every 75 s, 70% to all (a CHECK) - unless every heart is broken first, which stuns it
      if (now >= F.mem.overloadAt) {
        F.mem.overloadAt = now + 75_000;
        if (!egObjsOf(F, 'heart').length) { egStun(F, L, 8000, now, out); const k = 4 + 2 * Math.floor(ctx.n / 3); for (let j = 0; j < k; j++) obj(F, 'heart', L.x, L.z, egHpTeam(F, 3), now + 8000, out, { r: 0.7, pt: Math.floor(j / 2) + 1, extra: { off: [((j % 2) ? 1 : -1) * 2.5, (Math.floor(j / 2) - (k / 4)) * 1.5], pair: Math.floor(j / 2) } }); }
        else egAim(F, spec, { o: L.i, s: [shAll()], at: now + 4000, wu: 4000, p: 0.7, b: 0, el: 'shock', nm: 'Overload', ch: 1 }, [], now, out);
      }
    },
  },

  // ── THE WELLHEAD WYRM: a fight for every build ──
  wyrm: {
    blows: [
      { nm: 'Breath', wu: 1400, rec: 900, p: 0.45, b: 12, el: 'fire', range: 99, w: 3, make: (F, spec, L, t) => ({ stamps: [laneTo(L, t, 16, 4)] }) },
      { nm: 'Searing Breath', wu: 1500, rec: 1000, p: 0.45, b: 12, el: 'fire', range: 12, w: 2, make: (F, spec, L, t) => (L.ph >= 3 ? { stamps: [shCone(L.x, L.z, Math.atan2(t.x - L.x, t.z - L.z), 12, 180)], B: { wu: 1600 } } : { stamps: [shCone(L.x, L.z, Math.atan2(t.x - L.x, t.z - L.z), 10, 90)] }) },
      { nm: 'Meteor', wu: 1800, rec: 700, p: 0.5, b: 12, el: 'fire', range: 99, w: 2, when: (F, L) => egHas(L, EG_FL.fly), make: (F, spec, L, t, here) => ({ stamps: here.slice(0, 3).map((m) => shDisc(m.x, m.z, 4)) }) },
    ],
    wake(F, spec, L, now, out) { for (const [px, pz] of spotsOr(spec, L, 'pillar', 3, 18)) obj(F, 'pillar', px, pz, egHpTeam(F, 6), now, out, { r: 1.5 }); perch(F, spec, L, now, out); },
    phase(F, spec, L, ph, now, here, rng, out) { if (ph === 2) say(out, 'phase', { t: 'Burning Perches.' }); if (ph === 3) { egSetFl(F, L, EG_FL.fly, false, out); egSetFl(F, L, EG_FL.grounded, true, out); const f = mainDisc(spec, L); egPlace(F, L, f.x, f.z, now); say(out, 'phase', { t: 'Grounded.' }); } },
    tick(F, spec, L, now, here, rng, out) {
      if (L.ph >= 3) return;
      const on = egObjsOf(F, 'pillar').find((p) => p.i === L.perch);
      if (!on && !(L.groundedUntil > now)) {
        L.groundedUntil = now + 25_000; egSetFl(F, L, EG_FL.grounded, true, out); egSetFl(F, L, EG_FL.fly, false, out);
        const f = mainDisc(spec, L); egPlace(F, L, f.x, f.z, now);
        say(out, 'landed');
      }
      if (L.groundedUntil && now >= L.groundedUntil && L.ph < 3) { L.groundedUntil = 0; egSetFl(F, L, EG_FL.grounded, false, out); perch(F, spec, L, now, out, L.ph >= 2); }
    },
  },

  // ── VALKYNAZ GAROTH OF THE WELLHEAD: the Clan Muster ──
  garoth: {
    blows: [
      ...gateKit('fire'),
      { nm: 'Wellfire', wu: 1400, rec: 1000, p: 0.4, b: 12, el: 'fire', range: 99, w: 2, make: (F, spec, L) => ({ stamps: [shLaneAt(L.x - 12, L.z, Math.PI / 2, 24, 4), shLaneAt(L.x, L.z - 12, 0, 24, 4)] }) },
      { nm: "The Kyn's Due", wu: 1600, rec: 900, p: 0.5, b: 14, range: 99, w: 2, make: (F, spec, L, t, here) => { let top = t, v = -1; for (const m of here) if ((L.threat[m.sub] ?? 0) > v) { v = L.threat[m.sub] ?? 0; top = m; } return { stamps: [shDisc(top.x, top.z, 5)] }; } },
    ],
    wake(F, spec, L, now) { F.mem.challengeAt = Infinity; F.mem.garothSig = ['ilthys', 'morvayn', 'seyth'][Math.floor(F.c / 5) % 3]; },
    phase(F, spec, L, ph, now, here, rng, out, ctx) {
      // THE CLAN MUSTER: each phase turn calls an honour duel (the Armsmaster's ring law; none at n = 1)
      if (ctx.n >= 2) F.mem.challengeAt = now + 3500;
      if (ph === 3) { say(out, 'phase', { t: 'The older signature.' }); KITS[F.mem.garothSig]?.wake?.(F, spec, L, now, out, ctx); }
    },
    hit(F, spec, L, sub, got, pose, now, here, out) { const ch = F.mem.challenge; if (ch && ch.subs.includes(sub)) { ch.dealt += got; if (ch.dealt >= L.max / 10) endChallenge(F, L, now, out, true); } },
    tick(F, spec, L, now, here, rng, out, ctx) {
      challengeTick(F, spec, L, now, here, rng, out, ctx, 15_000, true);
      if (L.ph >= 3) KITS[F.mem.garothSig]?.tick?.(F, spec, L, now, here, rng, out, ctx);
    },
  },
};

// ── the signatures' helpers ──────────────────────────────────────────────────────────────────────────────
/** A zone on the floor (`ez`): 'burn' (a pool - its share a tick), 'void' (the floor gone - a cast-back), 'soul' (a
 *  Soul-Pool), 'haven' - over `s` from `from` to `until`. */
export function zoneOut(F, kind, s, from, until, out, o = {}) {
  const z = { i: ++F.bl, kind, s, from, until, p: o.p ?? 0, b: o.b ?? 0, el: o.el ?? null };
  (F.zones ??= []).push(z);
  F.zones = F.zones.filter((q) => q.until > from - 1000).slice(-24);
  out.push({ k: 'ez', ...z });
  return z;
}
const segHit = (s, x, z) => { const dx = s[3] - s[1], dz = s[4] - s[2], L = dx * dx + dz * dz, t = L > 0 ? Math.max(0, Math.min(1, ((x - s[1]) * dx + (z - s[2]) * dz) / L)) : 0; return Math.hypot(x - (s[1] + dx * t), z - (s[2] + dz * t)) <= s[5] / 2; };
/** Grath's island under a body (its object's number), or null. */
function islandOf(F, m) { const o = egObjsOf(F, 'isle').find((q) => q.st !== 2 && dist(q.x, q.z, m.x, m.z) <= 11.5); return o ? o.i : null; }
/** An island cracks: told 3.7 s (the wind-up floor's class), then falls for 15 s. */
function crack(F, isle, now, out) {
  const o = egBodyById(F, isle);
  if (!o || o.st) return;
  o.st = 1; o.stAt = now + 3700;
  out.push({ k: 'eob', i: o.i, st: 1, at: now });
}
/** The moon-shafts' places at `t` (section 11.2: r 3, walking a ring at a fixed 1.5 m/s). */
export function moonShafts(S, t) {
  const R = S.r ?? 12, w = 1.5 / R;
  return [0, 1, 2].map((k) => [r2(S.x + Math.sin((t / 1000) * w + (k * 2 * Math.PI) / 3) * R), r2(S.z + Math.cos((t / 1000) * w + (k * 2 * Math.PI) / 3) * R)]);
}
/** The Wyrm perches on a standing pillar (a Burning Perch erupts behind it in phase 2). */
function perch(F, spec, L, now, out, burn = false) {
  const pillars = egObjsOf(F, 'pillar');
  if (!pillars.length) return;
  if (burn && L.perch) { const old = egBodyById(F, L.perch); if (old) egAim(F, spec, { o: L.i, s: [shDisc(old.x, old.z, 6)], at: now + 2000, wu: 2000, p: 0.45, b: 12, el: 'fire', nm: 'Burning Perch' }, [], now, out); }
  const p = pillars[Math.floor((now / 1000) % pillars.length)];
  L.perch = p.i; egSetFl(F, L, EG_FL.fly, true, out); egPlace(F, L, p.x, p.z, now);
}
/** THE EXAMINATION (the Spellmaster's phase 2): runes lit in an order, each stood on in turn within the window. */
function examination(F, spec, L, now, here, rng, out, ctx) {
  const n = Math.max(1, ctx.n), k = Math.min(4, Math.max(2, n));
  const f = mainDisc(spec, L);
  const spots = (n < k ? [45, 135, 225, 315].map((d) => egKeepOnFight(spec, f.x + Math.sin((d * Math.PI) / 180) * 8, f.z + Math.cos((d * Math.PI) / 180) * 8, 1)) : spotsOr(spec, L, 'rune', 4, f.r - 1.5)).slice(0, k);
  const order = spots.map((_, j) => j).sort(() => rng() - 0.5);
  spots.forEach((p, j) => obj(F, 'rune', p[0], p[1], 0, now, out, { r: 1.6, pt: order.indexOf(j) + 1 }));
  F.mem.exam = { kind: 'runes', next: 1, k, until: now + (10 + 4 * Math.max(0, k - n)) * 1000 };
  L.hpFloor = Math.round(L.max * PHASE_AT[1]);
  say(out, 'examination');
}
/** THE FINAL EXAMINATION (phase 3): a member caged 8 s; the company breaks clamp(n-1, 1, 3) seals (n = 1: three within 6 m). */
function finalExam(F, spec, L, now, here, rng, out, ctx) {
  const n = Math.max(1, ctx.n);
  const bound = n >= 2 ? here[Math.floor(rng() * here.length)] : null;
  const seals = n >= 2 ? Math.max(1, Math.min(3, n - 1)) : 3;
  const c = bound ?? here[0] ?? { x: L.x, z: L.z };
  for (let j = 0; j < seals; j++) { const a = (j / seals) * Math.PI * 2; const [x, z] = egKeepOnFight(spec, c.x + Math.sin(a) * (n >= 2 ? 9 : 6), c.z + Math.cos(a) * (n >= 2 ? 9 : 6), 1); obj(F, 'seal', x, z, egHpTeam(F, 2.5, seals), now, out, { r: 0.8 }); }
  if (bound) { egMark(F, bound.sub, 5, now + 8000); F.mem.mkDirty = 1; }
  F.mem.exam = { kind: 'seals', bound: bound?.sub ?? null, until: now + 8000 };
  say(out, 'cage');
}
/** The errands' beat: the runes stood in order, the seals broken - passed (a stun) or failed (a CHECK). */
function errandTick(F, spec, L, now, here, rng, out) {
  const E = F.mem.exam;
  if (!E) return;
  if (E.kind === 'runes') {
    const runes = egObjsOf(F, 'rune'), cur = runes.find((r) => r.pt === E.next);
    if (cur && !(cur.st & 1)) { cur.st = 1; out.push({ k: 'eob', i: cur.i, st: 1, at: now }); }
    if (cur && here.some((m) => dist(m.x, m.z, cur.x, cur.z) <= 1.8)) { cur.st = 2; out.push({ k: 'eob', i: cur.i, st: 2, at: now }); E.next++; }
    if (E.next > E.k) { F.mem.exam = null; L.hpFloor = null; egGone(F, runes, EG_GONE.crumbled, '', now, out); egStun(F, L, STUN_MS, now, out); say(out, 'passed'); return; }
    if (now >= E.until) { F.mem.exam = null; L.hpFloor = null; egGone(F, runes, EG_GONE.crumbled, '', now, out); egAim(F, spec, { o: L.i, s: [shAll()], at: now + 2000, wu: 2000, p: 0.6, b: 0, el: 'shock', nm: 'The Failed Examination', ch: 1 }, [], now, out); say(out, 'failed'); }
  } else {
    const seals = egObjsOf(F, 'seal');
    if (!seals.length) { F.mem.exam = null; if (E.bound) egUnmark(F, E.bound, 5); F.mem.mkDirty = 1; say(out, 'passed'); return; }
    if (now >= E.until) {
      F.mem.exam = null; egGone(F, seals, EG_GONE.crumbled, '', now, out);
      const m = E.bound ? here.find((x) => x.sub === E.bound) : here[0];
      if (E.bound) egUnmark(F, E.bound, 5); F.mem.mkDirty = 1;
      if (m) egAim(F, spec, { o: L.i, s: [shDisc(m.x, m.z, 2)], at: now + 800, wu: 800, p: 0.7, b: 0, el: 'shock', nm: 'The Cage Closes', ch: 1 }, [], now, out);
      say(out, 'failed');
    }
  }
}
/** THE CHALLENGE (the Armsmaster's, Garoth's honour duel): a member marked, a ring of fire about the two; lasted 15 s or a
 *  tenth of his health dealt inside, or the company's braziers broken, and it ends. */
function challengeTick(F, spec, L, now, here, rng, out, ctx, ms, garoth = false) {
  if (ctx.n < 2 && !garoth) return;
  if (!F.mem.challenge && now >= (F.mem.challengeAt ?? Infinity)) {
    const two = !garoth && L.ph >= 2 && ctx.n >= 4;
    const picks = [...here].sort(() => rng() - 0.5).slice(0, two ? 2 : 1);
    if (!picks.length) return;
    const p = picks[0], cx = r2((L.x + p.x) / 2), cz = r2((L.z + p.z) / 2);
    F.mem.challenge = { subs: picks.map((m) => m.sub), until: now + ms, dealt: 0, x: cx, z: cz, r: 6 };
    for (const m of picks) egMark(F, m.sub, 6, now + ms);
    if (!garoth) { const need = Math.max(1, Math.min(3, ctx.n - picks.length)); for (let j = 0; j < need; j++) { const a = (j / need) * Math.PI * 2; const [x, z] = egKeepOnFight(spec, cx + Math.sin(a) * 9, cz + Math.cos(a) * 9, 1); obj(F, 'brazier', x, z, egHpTeam(F, 4), now, out, { r: 0.8 }); } }
    egPlace(F, L, cx + 2, cz, now);
    F.pg.ring = [cx, cz, 6];
    F.mem.mkDirty = 1;
    say(out, 'challenge', { s: picks.map((m) => m.sub) });
  }
  const ch = F.mem.challenge;
  if (!ch) return;
  if (now >= ch.until || (!garoth && !egObjsOf(F, 'brazier').length)) endChallenge(F, L, now, out, now < ch.until);
}
function endChallenge(F, L, now, out, early) {
  const ch = F.mem.challenge;
  if (!ch) return;
  for (const s of ch.subs) egUnmark(F, s, 6);
  F.mem.challenge = null; F.mem.mkDirty = 1; F.pg.ring = null;
  F.mem.challengeAt = L.key === 'garoth' ? Infinity : now + 30_000;
  egGone(F, egObjsOf(F, 'brazier'), EG_GONE.crumbled, '', now, out);
  out.push({ k: 'esay', w: early ? 'challengewon' : 'challengeend' });
}

/**
 * AN OBJECT BROKEN (a banner, an anchor, a heart, a seal, a brazier, a standard, a pillar, a chain): its errand's words
 * and its consequence (Paired Hearts' five seconds kept). Answers nothing - the frames go into `out`.
 */
export function egObjBroken(F, spec, o, name, now, out) {
  egGone(F, [o], EG_GONE.slain, name, now, out);
  if (o.t === 'banner' && o.zone) { o.zone.until = now; out.push({ k: 'ez', ...o.zone }); }
  if (o.t === 'heart' && egLordsOf(F)[0]?.ph >= 2) {
    const mate = egObjsOf(F, 'heart').find((h) => h.pair === o.pair);
    (F.mem.pairBroke ??= {});
    if (mate) F.mem.pairBroke[o.pair] = now; else delete F.mem.pairBroke[o.pair];
  }
  out.push({ k: 'esay', w: 'broken', t: o.t, n: name });
}
/** May an object be struck (a ward on it - a heart off its Rails, a stood-on errand)? */
export const egObjStruck = (o) => !egHas(o, EG_FL.ward) && o.role === EG_ROLE.obj;

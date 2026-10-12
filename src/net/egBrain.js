// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 6, 7, 8 and 16) and EG-FULL
// (2026-10-11, Mac: "I said I want everything"): THE DIRECTOR - an Elite Breach as its relay room runs it. One record
// (`B`) holds the breach: the company frozen at the open, each member's admission, life, purse and run (their Vestiges,
// Reliquaries, Cantrips, lumen, shards and tonics), the hall the company stands in and its stage, THE COUNT, the
// decrees, the company's word, the Mementos, the Redoubts taken, the end; and the hall's fight (`B.F`, net/egBodies.js -
// its lords and champions, net/egLords.js; its legion, net/egLegion.js; its errands' objects). The room
// (server/src/index.js `_egTick`) steps it every BRAIN_TICK_MS over the members' bodies and fans what it answers - a
// frame carrying `to` to that member alone; it mints the receipts the record owes (`B.owe`) with the relay's key.
//
// ONE HALL AT A TIME, THE COMPANY TOGETHER (section 7): `arrive` (each member stepping onto the hall's arrival plate is
// `here`; the hall wakes EG_GATHER_MS after the last, or EG_ARRIVE_MAX_MS after the pull), `trial` (the hall's kind and
// variant - section 8 - and its twist), `closing` (the door open; each member steps through it, `down`), the pull. A
// Court's fall takes the circle's Redoubt for every living member at once (section 16.2's sequence): its receipts, the
// count's time, the recalls, the rest with its Vestiges, the next circle's decrees and the company's word, the way home.
//
// THE COUNT (section 6.2), THE GOLD RUN, THE COVENANT'S PATIENCE (section 18), the respite and the Surplus.
// ONE LIFE, ONE RECALL (section 16.5): a fall makes a witness; the next Redoubt the living take calls them back once, or a
// Memento carried to a Battlemage's niche does sooner; a second fall is final. No living member, and the breach ends.
//
// EG-FULL, LAYER THREE (section 11): THE FRAGMENTS' RELAY HALF - the engines worked (`use`), the alcoves behind their
// false walls, THE FORK's High Road cache and Low Road niche and foes and its closing, the Clan Pit's Honour Horn, the
// fragments' Lurkers, a lord's page of the Annals (net/egAnnals.js).
//
// EG-H1 (EG8d, 2026-10-12, Mac: "I said I want everything"; section 21): WHAT THE RELAY JUDGES - each member's pose fed
// to THE FAIR TRAIL at its shared time (egPoseIn, net/egFair.js), every pose-gated credit asking it (the door, `down`, a
// cache, THE GOLD RUN, a niche, a Memento, the Vault, the High Road's cache), a second break refusing a member's hits a
// while; THE BODY COUNTED and enforced - the relay's count is the member's one life (egCount: one judge for every shape and
// the hall's hazards, net/bossRef.js; a fall told `bd`), the room's own heals restored to it (egCountHeals), the member's
// own word believed (egBodyWord); Watchfire's company told each committed blow early (watchOf).
//
// Pure: a record and a beat in, frames out. Not a DFU member. Ledger A (ELITE-GATES).
import { EG_SPEC, EG_SEALED_MS, EG_GATHER_MS, EG_ARRIVE_MAX_MS, EG_CLOSING_FIGHT_MS, EG_CLOSING_SPAN_MS, EG_CLOSING_COUNT_MS, EG_STAIR_HOLD_MS, EG_REST_MS,
  EG_WAKE_RING_MS, EG_ABSENT_TRIAL_MS, EG_LAST_WORD_MS, EG_REDOUBT_HOLD_MS, EG_COUNT_CAP_MS, egHallOf, egCircleOfHall, egFirstHallOf, egStartHall, egTimes, egAdmits, egCountNew, egCountLeft, egCountRun, egCountHold,
  egInHall, egLocalX, egOnArrive, egAtDoor, egOnFight, egSpecDigest, egGeoOf, egSeed, egProclamationOf, egKeepOnFight, EG_VOID_Y, EG_CAST_BACK_LOSS, EG_CAST_BACK_FLOOR } from './egLaw.js';
import { EG_ROLE, EG_FL, EG_GONE, EG_STATE_EVERY_MS, egFightNew, egFightState, egCarry, egMovesOut, egHpOut, egBlowsStep, egHitBody, egGone, egHas, egSetFl, egBodiesOf, egBodyById, egHpTeam, egRaise, egWalk, egAim, egTethersOut, egMarksOut, egStruck } from './egBodies.js';
import { EG_KIND, egLegionStep, egLegionRaise, egWaveKinds, egWaveSize, egAddSlain, egSquad, egFromBehind } from './egLegion.js';
import { EG_OBJ, egLordsNew, egLordsWake, egLordsStep, egLordsAwake, egLordsFell, egLordsOf, egLordHit, egLordHitX, egObjBroken, egObjsOf, zoneOut, egStun } from './egLords.js';
import { egAsk, egVote, egAskResult, egAsksDue, egDecreesAsk, egDecreesChosen, egDecreeRanks, egDecreesInForce, egBargainDecree, egTideOf, egStratumAt, egOffers, egPick, egPicksClose, egSurplus,
  egLoseNewest, egCacheDraw, egGive, egBuy, egVestigeX, egThreatX, egFadeOn, egMarkFoe, egRunOf, EG_CANTRIPS, EG_LUMEN_ADD, EG_LUMEN_RIFT } from './egRun.js';
import { egVOf, egAccordsOf } from './egVestige.js';
import { shDisc, shLane, egInShape } from './egShape.js';
import { EG_ENGINES, EG_ENGINE_REACH_M, EG_ENGINE_CD_MS, EG_ENGINE_PCT, EG_ENGINE_TELL_MS, EG_ALCOVE_REACH_M, EG_NICHE_HEAL } from './egFragLaw.js';   // EG-FULL LAYER THREE: the fragments' relay half
import { egAnnalsNext, egAnnalsLordPage } from './egAnnals.js';
import { egFeatBits } from './egFeats.js';   // EG-E: the lords' feats, judged at a lord's fall
import { arenaWeekOf } from './arenaLaw.js';   // EG-E: the Proclamation's week, the arena's (Monday to Monday from the season epoch)
import { EG_HERALD_TELL_MAX } from './egHerald.js';   // EG-E3: the herald's news, kept on the breach for the hub
import { orreryOf, orreryFresh, orreryJudge, orreryShortest } from './sdBrain.js';
import { BUCKET_DEPTH_X, GATE_HIT_HZ_MAX, HIT_KINDS,  dpsRef, clampLv } from './gateBrain.js';
// EG-H1 (EG8d): WHAT THE RELAY JUDGES - THE FAIR TRAIL and its time law (net/egFair.js), one judge for every shape and the
// hall's own hazards (net/bossRef.js), and the body counted (net/bossBody.js) - the member's one life
import { egFairNew, egFairPose, egFairOk, egFairRefuses, egFairCross, egRideHolds, egRideAt } from './egFair.js';
import { judgeShapes, judgePlace } from './bossRef.js';
import { bodyStruck, bodySaid, bodyHealed, bodyLife } from './bossBody.js';

/** The rifts together hold this many seconds of the company's reference damage (section 8.1); a Wellspring's great
 *  rift and each anchor; a Rampart's gate's Ward-Bearers; a Muster's standard; a captive's chains; a Holdfast's hold. */
export const EG_RIFT_TEAM_S = 36;
export const EG_SPRING_S = 30;
export const EG_ANCHOR_S = 4;
export const EG_GATE_TEAM_S = 12;
export const EG_STANDARD_S = 20;
export const EG_CHAIN_S = 4;
export const EG_HOLD_MS = 75_000;
export const EG_RELIC_MAX = 100;
export const EG_WINCH_MS = 60_000;
export const EG_SILENCE_MS = 3000;
export const EG_ENGINE_HOLD_MS = 45_000;
/** EG-FULL LAYER THREE - THE CLAN PIT's Honour Horn (section 11.2): first blown this long after the wake, then once the
 *  last call ends and this long more; the Kynval's ring (m); Ashfall's pulse (ms) and its pools. */
export const EG_HORN_FIRST_MS = 20_000;
export const EG_HORN_AGAIN_MS = 40_000;
export const EG_HORN_RING_M = 6;
export const EG_ASHFALL_EVERY_MS = 6000;
/** The High Road's cache and the Low Road's niche reach (m). */
export const EG_HCACHE_REACH_M = 2.5;
export const EG_SCRIPTORIUM_MS = 30_000;
/** How often each rift pours a wave at circle c (section 8.1 - never under nine seconds), a Rampart's march, a Court's
 *  escort, an Athenaeum's pressure, Hunting Pack's (ms). */
export const egWaveEveryMs = (c) => Math.max(9000, 20_000 - 500 * (c - 1));
export const EG_MARCH_EVERY_MS = 12_000;
export const EG_ESCORT_EVERY_MS = 25_000;
export const EG_LOCK_EVERY_MS = 15_000;
/** The rifts a company of n living members faces, and the legion's cap (section 8.1). */
export const egRiftsFor = (n) => Math.max(3, Math.min(5, 2 + Math.ceil(n / 3)));
export const egLegionCap = (n, c) => Math.min(14, 2 + Math.ceil(1.5 * n) + Math.floor((c - 1) / 5));
/** THE RESPITE BUDGET (section 6.2): fifteen minutes a breach, ten more each Valkynaz Redoubt; spent in two-minute pieces. */
export const EG_RESPITE_BUDGET_MS = 900_000;
export const EG_RESPITE_VALK_MS = 600_000;
export const EG_RESPITE_STEP_MS = 120_000;
/** THE SURPLUS (section 6.2): five minutes the count's cap turns away, three at most. */
export const EG_SURPLUS_MS = 300_000;
export const EG_SURPLUS_MAX = 3;
/** THE GOLD RUN (section 8.2): every living member across before the closing's fifteenth second - a minute more. */
export const EG_GOLD_RUN_MS = 60_000;
/** A Memento is carried within this of it, and set at a niche within this (m); the recall it gives (a share of health). */
export const EG_MEMENTO_REACH = 2;
export const EG_MEMENTO_PCT = 0.5;
/** The Redoubt's sequence (section 16.2): the beacon, the count's gain, the spoils, the recalls, the rest window (ms
 *  after the fall). */
export const EG_RD_RECALL_MS = 4500;
export const EG_RD_WINDOW_MS = 6000;
/** A cache is taken within this of it (m), a stood-on errand (a plate, a winch) within this. */
export const EG_TOUCH_M = 2.5;
/** The most of the legion standing at once on the wire. */
export const EG_STANDING_MAX = 16;
/** The names the gate's old frames gave (kept for the tracker's words). */
export const EG_FOE_NAMES = Object.freeze({ champion: 'The Kynreeve', lord: 'The Lord of the Court' });

const secs = (ms) => Math.max(0, Math.floor(ms / 1000));
const purseOf = (lv, now) => ({ lv, rate: GATE_HIT_HZ_MAX, rateAt: now, bucket: BUCKET_DEPTH_X * dpsRef(lv), bucketAt: now, clipped: 0, dealt: 0, bq: null, bqAt: 0, bqWho: [] });
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

/**
 * A breach opened: the hub's verified open (net/wire.js validEgOpenTell) at `now`, the room's own record from here.
 * @param {ReturnType<typeof import('./wire.js').validEgOpenTell>} t
 */
export function egBreachNew(t) {
  return {
    v: 2, b: t.b, ez: t.ez, s: t.s, o: t.o, ew: t.ew, rh: t.rh, seed: t.seed >>> 0, egv: EG_SPEC, op: t.op, site: t.site,
    wg: Array.isArray(t.wg) ? t.wg.slice(0, 3) : [], pr: t.pr ?? egProclamationOf(arenaWeekOf(t.op / 1000)),
    co: t.co.map(([sub, name, n]) => ({ sub, name, n })),
    /** @type {Record<string, any>} each member admitted: its name, numeral, level, life, purse and run */
    mem: {},
    h: 0, sg: 'wait', sa: t.op, su: t.op + EG_SEALED_MS, hw: 0, dn: 0, pulledAt: 0, gatherAt: 0, cleared: 0, rdAt: 0,
    wk: 0, cnt: egCountNew(), rd: 0, end: null, endAt: 0,
    dc: [], bargainDc: [], next: null, asks: [], tide: null, strata: [],
    resp: EG_RESPITE_BUDGET_MS, sur: 0, surAcc: 0, gold: 0, covenant: 0, warned: 0,
    cache: null, mementos: [], log: [],
    /** @type {any} the hall's fight */
    F: null,
    /** @type {any[]} the receipts owed: `{ sub, claims }` - the room fills each one's seed and signs it */
    owe: [],
    /** @type {string[]} the admission orders spent (their `ez`) */
    zs: [],
    lastStateAt: 0,
  };
}
/** The breach as the clock's law reads one (net/egLaw.js egTimes, egPhase). */
const clockRec = (B) => ({ openedAt: B.op, wokeAt: B.wk, endAt: B.endAt, why: B.end });
/** The living, entered company (`[sub, m]`). */
const living = (B) => Object.entries(B.mem).filter(([, m]) => m.in && m.alive && !m.home);
const memberName = (B, sub) => B.mem[sub]?.name ?? B.co.find((c) => c.sub === sub)?.name ?? '';
/** The circle's span decrees, folded into the specs (net/egLaw.js egGeoOf). */
export const egGeo = (B) => egGeoOf(egDecreesInForce(B));
/** The hall the company stands in. */
const specOf = (B) => egHallOf(B.seed, B.h, egGeo(B));
// ── EG-H1 (EG8d): THE FAIR TRAIL'S DOOR - bible/11-Multiplayer/Elite-Gates.md section 21 ───────────────────────────────
/** A member's fair trail is its hall's and its life's: a new hall, or a fall, begins it again. */
const fairKey = (B, m) => `${B.h}:${m.falls ?? 0}`;
/** A member's fair trail in this hall and this life, or null (none judged yet - the law judges poses, never their absence). */
const fairOfMember = (B, sub) => { const m = B.mem[sub], A = m?.fair; return A && A.k === fairKey(B, m) ? A : null; };
/** EVERY POSE-GATED CREDIT NEEDS A FAIR TRAIL from the last island (section 21): the door, `down`, a cache, THE GOLD RUN, a
 *  niche, a Memento carried, the Reliquary Vault, the High Road's cache (net/egFair.js egFairOk). */
const fairOf = (B, sub) => egFairOk(fairOfMember(B, sub));
/**
 * Who opens an arrival's door (a span, a Brink, a Deepway's way down): a member at the end plate whose trail is fair. After
 * the room was woken mid-hall (`fwake` - its trails the saved ones, egFairWoke), failing that, the first arrival - its
 * measure says so (`wake`): a hall woken after every member passed the last island never deadlocks. Null: no door yet.
 */
function doorOpener(B, spec, inHall) {
  const at = inHall.filter((b) => egAtDoor(spec, b.x, b.z));
  const fair = at.find((b) => fairOf(B, b.sub));
  if (fair || !at.length) return fair ?? null;
  if (!(B.fwake > 0 && B.hw > 0 && B.hw < B.fwake)) return null;
  const A = fairOfMember(B, at[0].sub);
  if (A) A.wake = 1;
  return at[0];
}
/** EG-H1: the room was woken (a new instance read the breach from storage) - after it, a hall woken before it opens its
 *  door on the first arrival when no saved trail is fair (doorOpener). */
export function egFairWoke(B, now) { if (B && !B.end) B.fwake = now; }

/** May `sub` enter breach `B` at `now` - null, or the refusal's words (net/wire.js EG_NO_WORDS). */
export function egAdmitWord(B, sub, now) {
  if (!B.co.some((c) => c.sub === sub)) return 'the breach answers only to its company';
  if (B.end) return 'the breach is closed';
  const m = B.mem[sub];
  if (m?.forsaken) return 'you have fallen';
  if (m?.home) return 'you went home';
  if (m?.in) return null;   // a reload, a witness: back into the hall it stands in
  return egAdmits(clockRec(B), now) ? null : 'the breach is closed';
}
/** A member's admission, its order verified by the room (`ez` its id): spent once; its level frozen at the first. Answers
 *  null, or the refusal's words. */
export function egEnter(B, sub, ez, lv, now) {
  const no = egAdmitWord(B, sub, now);
  if (no) return no;
  if (B.mem[sub]?.in) { B.mem[sub].seenAt = now; return null; }   // counted already (a reload, a new circle's room): nothing to spend
  if (B.zs.includes(ez)) return 'the order is spent';
  B.zs = [...B.zs, ez].slice(-64);
  const c = B.co.find((x) => x.sub === sub);
  if (!B.mem[sub]) B.mem[sub] = { name: c.name, n: c.n, in: 1, lv: clampLv(lv), alive: 1, home: 0, fellAt: 0, falls: 0, recall: 1, wit: 0, forsaken: 0, hereH: 0, downH: 0, dh: 0, dc: 0, act: 0, seenAt: now,
    vs: [], mast: -1, shards: 0, tonics: 0, cant: [], lumen: 0, rel: [], kinds: [0, 0, 0], offer: null, picks: 0, newestV: null, bequest: null, x: 0, ...purseOf(clampLv(lv), now) };
  else B.mem[sub].seenAt = now;
  return null;
}

/** The count's word: what was left when it last began to run (`cl`, whole ms) and that instant (`ca`; 0 while it holds -
 *  `cl` is then what is left) - every screen counts it down from there (net/egLink.js egCountAt). */
const countWord = (B, now) => ({ cl: Math.round(B.cnt.at > 0 ? B.cnt.left : egCountLeft(B.cnt, now)), ca: B.cnt.at });
/** The stage's word (`sg`). */
export const egStageWord = (B, now) => ({ k: 'sg', h: B.h, sg: B.sg, sa: B.sa, su: B.su, ...countWord(B, now), hw: B.hw, dn: B.dn });
/** The company as the room says it: `[sub, name, numeral, alive, home, in, witness, forsaken, falls, recall]`. */
export const egCompanyOf = (B) => B.co.map((c) => { const m = B.mem[c.sub]; return [c.sub, c.name, c.n, m ? m.alive : 1, m?.home ? 1 : 0, m?.in ? 1 : 0, m?.wit ? 1 : 0, m?.forsaken ? 1 : 0, m?.falls ?? 0, m ? m.recall : 1]; });
/** The breach's whole state (`st`): the stage, the company, the decrees in force (and the Proclamation, the Wager, the
 *  tide, the strata), each member's run, the cache's kind, the Mementos lying, the respite and the Surplus. */
export function egStateOf(B, now) {
  const spec = B.h > 0 ? specOf(B) : null;
  return { ...egStageWord(B, now), k: 'st', b: B.b, seed: B.seed, egv: B.egv, op: B.op, wk: B.wk, co: egCompanyOf(B), rd: B.rd, rh: B.rh,
    dg: spec ? egSpecDigest(spec) : 0, end: B.end,
    dc: egDecreesInForce(B), pr: B.pr ?? '', wg: [...(B.wg ?? [])], td: B.tide ?? '', sr: [...(B.strata ?? [])], geo: egGeo(B),
    ms: Object.entries(B.mem).filter(([, m]) => m.in).map(([sub, m]) => egRunOf(sub, m)),
    ca2: B.cache ? B.cache.k : '', mm: B.mementos.map((q) => [q.s, q.h, Math.round(q.x * 100) / 100, Math.round(q.z * 100) / 100, q.by ?? '']),
    rp: Math.round(B.resp), sp: B.sur, as: (B.asks ?? []).map((a) => [a.q, [...a.o], a.until]),
    ...(B.site ? { site: B.site } : {}) };   // EG-F (section 6.3): the arch's site, the room's to keep - the cast-out's landing with the arch gone
}
/** The hall's fight's whole word (`efs`), or null when it holds none. */
export function egFightStateOf(B, now = Date.now()) { return B.F ? egFightState(B.F, now) : null; }

/** A member's body in the hall's own frame, or null when it stands in no part of hall `spec`. */
const local = (spec, b) => (b && egInHall(spec, b.sx, b.z) ? { sub: b.sub, x: egLocalX(spec, b.sx), z: b.z } : null);

/** A receipt owed - its seed the room's own draw. */
function owe(B, sub, claims) { B.owe.push({ sub, claims: { b: B.b, s: sub, z: B.ez, ...claims } }); }
/** A member's end receipt (`x`), once: why it ended, the deepest hall cleared, the Reliquaries it opens (a good end), its
 *  falls. */
function oweEnd(B, sub, why, now) {
  const m = B.mem[sub];
  if (m?.x) return;
  if (m) m.x = 1;
  const good = why === 'home' || why === 'last' || why === 'void' || why === 'seal';
  owe(B, sub, { q: 'x', h: B.cleared, t: B.wk ? secs(now - B.wk) : 0, n: Object.values(B.mem).filter((x) => x.in).length, ew: B.ew, l: m?.lv ?? 1, why,
    ...(good && m?.rel?.length ? { rl: m.rel.slice(0, 64) } : {}), fl: m?.falls ?? 0, ...(B.rh ? { rh: 1 } : {}),
    // EG-E3: the Wager (the boards rank a wagered breach on the Depths alone) and the Annals' pages the breach gave
    ...(B.wg?.length ? { wg: [...B.wg] } : {}), ...(m?.pages ? { an: m.pages } : {}) });
}
/** EG-E3: a hall cleared (the door, or a Court's fall) - the deepest the breach holds, and its seconds from Hall 1's wake
 *  (`td`, the Descent's second key - section 20). */
function clearHall(B, now) {
  if (B.h <= B.cleared) return;
  B.cleared = B.h;
  B.td = B.wk ? secs(now - B.wk) : 0;
}
/** EG-E3: THE HERALD'S NEWS (net/egHerald.js) - kept on the breach, numbered, for the room to tell the hub, which decides
 *  what the channel hears; the oldest let go past EG_HERALD_TELL_MAX. */
function heraldOwe(B, now, ev) {
  B.hn = (B.hn ?? 0) + 1;
  B.hq = [...(B.hq ?? []), { i: B.hn, at: now, ...ev }].slice(-EG_HERALD_TELL_MAX);
}
/** The company's entrants, in its order: `[sub, m]`. */
const entrants = (B) => B.co.map((c) => [c.sub, B.mem[c.sub]]).filter(([, m]) => m?.in);

/**
 * A MEMBER FALLS (section 16.5): a death, or EG_ABSENT_TRIAL_MS gone in a trial. Their Reliquaries are lost; they become a
 * witness; with their recall still in hand a Memento lies where they fell; with none (or a second fall), the fall is
 * final and their end receipt is owed. Said to all.
 */
export function egFall(B, sub, now, out, at = null) {
  const m = B.mem[sub];
  if (!m || !m.alive || m.home || B.end) return;
  m.alive = 0; m.fellAt = now; m.falls = (m.falls ?? 0) + 1; m.wit = 1; m.rel = [];
  const final = !(m.recall > 0) || m.falls >= 2;
  if (final) oweEnd(B, sub, 'fall', now);
  else if (at) B.mementos.push({ s: sub, h: B.h, x: at.x, z: at.z, by: null });
  // a carrier's fall drops the Memento where they fall
  for (const q of B.mementos) if (q.by === sub) { q.by = null; if (at) { q.x = at.x; q.z = at.z; q.h = B.h; } }
  if (B.F) B.F.fellThisHall = (B.F.fellThisHall ?? 0) + 1;
  B.log.push({ h: B.h, fall: m.name });
  out.push({ k: 'fall', s: sub, n: m.name, at: now, fin: final ? 1 : 0 }, { k: 'co', co: egCompanyOf(B) });
}
/** A witness forsakes the breach (section 16.5): their recall forfeit, their end receipt owed. */
export function egForsake(B, sub, now, out) {
  const m = B.mem[sub];
  if (!m || m.alive || m.forsaken || B.end) return false;
  m.forsaken = 1; m.recall = 0;
  B.mementos = B.mementos.filter((q) => q.s !== sub);
  oweEnd(B, sub, 'forsake', now);
  out.push({ k: 'co', co: egCompanyOf(B) });
  return true;
}
/** A fallen member called back (THE RECALL): alive at `pct` of their health, their newest Vestige lost, their recall
 *  spent. Said to all, and to them (`rise`, where to stand). */
function recall(B, sub, pct, at, now, out) {
  const m = B.mem[sub];
  if (!m || m.alive || m.forsaken || !(m.recall > 0)) return false;
  m.alive = 1; m.wit = 0; m.recall = 0; m.seenAt = now; m.roseH = B.h;   // EG-H1: its fair trail begins where it is called back
  egLoseNewest(m);
  B.mementos = B.mementos.filter((q) => q.s !== sub);
  out.push({ k: 'rise', to: sub, s: sub, p: pct, x: at[0], z: at[1], h: B.h }, { k: 'co', co: egCompanyOf(B) }, { k: 'esay', w: 'recalled', n: m.name });
  return true;
}
/** A member takes the way home at a Redoubt's rest: their Reliquaries opened, their end receipt owed. Answers whether
 *  it went. */
export function egHome(B, sub, now, out) {
  const m = B.mem[sub];
  if (!m || !m.alive || m.home || B.end || B.sg !== 'rest' || now < B.rdAt + EG_RD_WINDOW_MS) return false;
  m.home = now;
  oweEnd(B, sub, 'home', now);
  out.push({ k: 'co', co: egCompanyOf(B) }, { k: 'esay', w: 'home', n: m.name });
  return true;
}
/** THE END (section 22): every member still in it owed its end, said to all. */
export function egEnd(B, why, now, out) {
  if (B.end) return;
  B.end = why; B.endAt = now; B.sg = 'end'; B.sa = now; B.su = 0;
  B.cnt = egCountHold(B.cnt, now);
  if (B.F) egGone(B.F, egBodiesOf(B.F, EG_ROLE.add), EG_GONE.crumbled, '', now, out);
  B.F = null;
  B.asks = [];
  for (const [sub, m] of Object.entries(B.mem)) if (m.in && !m.home && !m.x && (m.alive || !m.forsaken)) oweEnd(B, sub, m.alive ? why : (why === 'home' ? 'fall' : why), now);
  if (why === 'empty' && !B.mem[B.s]) oweEnd(B, B.s, 'empty', now);   // the opener's stake settles even when nobody came
  // EG-E3: THE DESCENT'S CANDIDATE (section 20) - a breach begun at Hall 1, unwagered and no Rehearsal, told the herald:
  // the hub keeps the season's best a bracket, and says a new top
  if (!B.rh && !B.ew && !(B.wg ?? []).length && B.cleared > 0) {
    const E = entrants(B);
    heraldOwe(B, now, { k: 'dc', h: B.cleared, td: B.td ?? 0, n: E.length, o: B.o ?? '', by: E.map(([, m]) => m.name ?? '') });
  }
  out.push({ k: 'end', why, at: now }, egStageWord(B, now));
}

// ── a hall's wake: its fight stood ──────────────────────────────────────────────────────────────────────────
/** The hall woken: the trial begins, the count runs (from thirty minutes at the breach's first wake), its fight stood. */
function wake(B, now, rng, out) {
  const spec = specOf(B);
  B.sg = 'trial'; B.sa = now; B.su = 0; B.hw = now; B.dn = 0; B.gatherAt = 0; B.gold = 0;
  if (!B.wk) { B.wk = now; B.cnt = { left: egCountNew().left, at: now }; } else B.cnt = egCountRun(B.cnt, now);
  for (const [, m] of living(B)) { m.downH = 0; m.dh = 0; }
  B.cache = spec.end && spec.kind !== 'brink' ? egCacheDraw(rng, spec.twist === 'mimic') : null;
  B.F = standFight(B, spec, now, rng, out);
  out.push(egStageWord(B, now), egStateOf(B, now));
  if (B.F) out.push(egFightState(B.F, now));
}
/** A wave's spots about (x, z), `r` out, kept to the fight floor. */
function ringSpots(spec, x, z, r, k, rng) {
  const out = [];
  for (let i = 0; i < k; i++) { const a = (i / Math.max(1, k)) * Math.PI * 2 + rng(); out.push(egKeepOnFight(spec, x + Math.sin(a) * r, z + Math.cos(a) * r, 1)); }
  return out;
}
/**
 * A HALL'S FIGHT stood at its wake, sized by its living company and its depth, by its kind, its variant and its twist
 * (section 8): the rifts, the anchors and the great rift, the standard and its rally points, the relic, the wandering
 * rifts; the Rampart's gate and march, its casters' pillars, its winch, its Gauntlet; the Athenaeum's Orrery; the
 * champion; the Deepway's chamber; the Scriptorium's quiet; the Court's lord asleep in its ring - and the twist's own.
 */
function standFight(B, spec, now, rng, out) {
  const L = living(B), lvs = L.map(([, m]) => m.lv);
  if (spec.kind === 'span' || spec.kind === 'brink') { const F = egFightNew(spec, now, lvs); F.D = egDecreeRanks(B); spanTwist(B, F, spec, now, out); fragStand(B, F, spec, now, out); return F; }
  const F = egFightNew(spec, now, lvs);
  F.D = egDecreeRanks(B);
  const n = F.n, P = F.pg;
  F.waveAt = now + (B.still ? 14_000 : 4000);
  B.still = 0;
  const v = spec.variant;
  if (spec.kind === 'yard') {
    if (v === 'wellspring') {
      const g = spec.rifts[0];
      const spring = egRaiseObj(F, 'rift', g.x, g.z, egHpTeam(F, EG_SPRING_S), now, out, { r: 2.2, great: 1 });
      egSetFl(F, spring, EG_FL.ward, true, out);
      for (const a of spec.spots.anchor ?? []) egRaiseObj(F, 'anchor', a.x, a.z, egHpTeam(F, EG_ANCHOR_S), now, out, { r: 0.9 });
      P.obj = 'wellspring';
    } else if (v === 'muster') {
      const pts = (spec.spots.rally ?? []).map((q) => [q.x, q.z]);
      F.rally = pts;
      const [s] = egLegionRaise(F, [EG_KIND.standard], [pts[0] ?? [spec.fight.x, spec.fight.z]], now, out, { hpX: 1 });
      if (s) { s.hp = s.max = egHpTeam(F, EG_STANDARD_S); }
      P.obj = 'muster';
    } else if (v === 'holdfast') {
      const r = spec.spots.relic?.[0];
      if (r) egRaiseObj(F, 'relic', r.x, r.z, 0, now, out, { r: r.r ?? 6 });
      F.relic = EG_RELIC_MAX; F.holdMs = 0; F.holdNeed = EG_HOLD_MS;
      F.riftSpots = spec.rifts.slice(0, 3);
      for (const q of F.riftSpots) { const o = egRaiseObj(F, 'rift', q.x, q.z, 1, now, out, { r: 1.3 }); egSetFl(F, o, EG_FL.ward, true, out); }
      P.obj = 'holdfast'; P.hold = 0; P.relic = EG_RELIC_MAX;
    } else {
      const k = Math.min(egRiftsFor(n), spec.rifts.length);
      for (const q of spec.rifts.slice(0, k)) egRaiseObj(F, 'rift', q.x, q.z, egHpTeam(F, EG_RIFT_TEAM_S, k), now, out, { r: 1.3 });
      if (v === 'wellmouth') { F.wander = 1; F.wanderAt = now + 20_000; }
      P.obj = 'rifts';
    }
    if (spec.twist === 'deserter') { egLegionRaise(F, [EG_KIND.deserter], [[spec.fight.x, spec.fight.z - spec.fight.r + 3]], now, out); F.desClosed = 0; F.coClosed = 0; }
  } else if (spec.kind === 'rampart') {
    const pillars = spec.spots.pillar ?? [];
    if (v === 'gauntlet') {
      const k = Math.min(pillars.length, 2 + Math.ceil(n / 2));
      F.gauntlet = pillars.slice(0, k).map((p) => ({ p, stood: 0, at: 0, done: 0 }));
      for (const g of F.gauntlet) { const [c] = egLegionRaise(F, [EG_KIND.caster], [[g.p.x, g.p.z]], now, out); if (c) { c.pinned = 1; g.i = c.i; } }
      P.obj = 'gauntlet'; P.left = F.gauntlet.length;
    } else {
      if (v !== 'winch') egLegionRaise(F, [EG_KIND.bearer, EG_KIND.bearer], spec.gate.bearers.map((q) => [q.x, q.z]), now, out);
      const k = Math.min(pillars.length, 1 + Math.ceil(n / 3));
      for (const p of pillars.slice(0, k)) { const [c] = egLegionRaise(F, [EG_KIND.caster], [[p.x, p.z]], now, out); if (c) c.pinned = 1; }
      F.waveAt = now + 6000;
      if (v === 'winch') { F.winch = 0; P.obj = 'winch'; P.winch = 0; } else P.obj = 'wards';
    }
    if (spec.twist === 'squad') { egSquad(F, [[spec.walk.x, spec.walk.z0 + 30], [spec.walk.x + 1.5, spec.walk.z0 + 32], [spec.walk.x - 1.5, spec.walk.z0 + 34], [spec.walk.x, spec.walk.z0 + 36]], now, out); F.waveAt = now + 30_000; }
  } else if (spec.kind === 'athenaeum') {
    const k = Math.floor((spec.c - 1) / 5), s = (egSeed(B.seed, 0x0a7e + spec.h) % 2147483646) + 1;
    F.orrery = orreryOf(s, { turnsMin: 16 + 2 * k, turnsMax: 28 + 2 * k });
    F.lock = orreryFresh(F.orrery); F.lockLast = [0, 0, 0, 0, 0, 0]; F.turns = 0; F.best = orreryShortest(F.orrery, F.lock.st);
    for (const [j, st] of (spec.spots.stone ?? []).entries()) egRaiseObj(F, 'stone', st.x, st.z, 0, now, out, { r: 1, pt: j });
    F.waveAt = now + EG_LOCK_EVERY_MS;
    P.obj = 'orrery'; P.st = [...F.lock.st]; P.lit = 0; P.f = 0;
  } else if (spec.kind === 'proving') {
    const key = spec.champ ?? 'kynreeve';
    egLordsNew(F, spec, key, now, out, { decrees: F.D, n });
    egLordsWake(F, spec, now, out, { n });
    const k = 1 + Math.ceil(n / 3);
    egLegionRaise(F, egWaveKinds(F, rng, k), ringSpots(spec, spec.foe.x, spec.foe.z, 5, k, rng), now, out, { wave: 1 });
    P.obj = 'champion';
  } else if (spec.kind === 'deepway') {
    const ch = spec.spots.chamber?.[0];
    F.chamber = ch?.obj ?? 0;
    if (F.chamber === 0) { const k = Math.min(egRiftsFor(n), spec.rifts.length); for (const q of spec.rifts.slice(0, k)) egRaiseObj(F, 'rift', q.x, q.z, egHpTeam(F, EG_RIFT_TEAM_S, k), now, out, { r: 1.3 }); F.halfCap = 1; P.obj = 'rifts'; }
    else if (F.chamber === 1) { egLordsNew(F, spec, spec.champ ?? 'kynreeve', now, out, { decrees: F.D, n }); egLordsWake(F, spec, now, out, { n }); P.obj = 'champion'; }
    else { const e = spec.spots.engine?.[0]; if (e) egRaiseObj(F, 'engine', e.x, e.z, 0, now, out, { r: 3 }); F.engineHeld = 0; P.obj = 'engine'; P.hold = 0; }
  } else if (spec.kind === 'scriptorium') {
    out.push({ k: 'eheal', p: 0.3 });
    F.quietUntil = now + EG_SCRIPTORIUM_MS;
    P.obj = 'quiet';
  } else if (spec.kind === 'court') {
    const key = spec.lord;
    const sev = B.sever ? 1 : 0;
    B.sever = 0;
    egLordsNew(F, spec, key, now, out, { decrees: F.D, n });
    if (F.D.feud && spec.foe) { const champ = ['kynreeve', 'kynmarcher', 'markynaz', 'markynaz'][spec.band]; egLordsNew(F, spec, champ, now, out, { decrees: F.D, n, at: [spec.foe.x + 6, spec.foe.z] }); }
    if ((B.strata ?? []).includes('twincourt') || (B.strata ?? []).includes('oldmasters')) {
      const second = (B.strata ?? []).includes('oldmasters') ? (key === 'spellmaster' ? 'armsmaster' : 'spellmaster') : ['hound', 'cairnkeeper', 'dusk', 'colossus'][(spec.c + 1) % 4];
      if (second !== key) { const [b] = egLordsNew(F, spec, second, now, out, { decrees: F.D, n, at: [spec.foe.x - 6, spec.foe.z] }); if (b) { b.hp = b.max = Math.round(b.max * 0.6); for (const a of egLordsOf(F)) if (a !== b) { a.hp = a.max = Math.round(a.max * 0.6); } } }
    }
    F.sever = sev;
    F.ringAt = 0;
    if ((B.strata ?? []).includes('moltenrim')) for (const f of spec.fl ?? []) if (f.t === 'd' && f.r > 8) zoneOut(F, 'void', ['r', f.x, f.z, f.r - 3, f.r + 2], now, now + 3_600_000, out);
    P.obj = 'lord';
  }
  // THE TWISTS (section 8.7) at the wake
  if (spec.twist === 'ghost' && spec.fight) egLegionRaise(F, [EG_KIND.ghost], [[spec.arrive.x + 2, spec.arrive.z + 2]], now, out);
  if (spec.twist === 'captive') { for (const c of spec.spots.chain ?? []) egRaiseObj(F, 'chain', c.x, c.z, egHpTeam(F, EG_CHAIN_S), now, out, { r: 0.8 }); F.captive = 1; }
  if (spec.twist === 'bargain' && egBargainOpen(B)) egAsk(B, 'bargain', [1], now, out);
  if (F.D.vigil && spec.kind !== 'proving' && spec.kind !== 'court' && spec.arrive) { const champ = ['kynreeve', 'kynmarcher', 'markynaz', 'markynaz'][spec.band]; egLordsNew(F, spec, champ, now, out, { decrees: F.D, n, at: [spec.arrive.x, spec.arrive.z + 3] }); egLordsWake(F, spec, now, out, { n }); }
  if ((F.D.warband || B.tide === 'warband') && spec.fight && spec.kind !== 'court') egSquad(F, ringSpots(spec, spec.fight.x, spec.fight.z, 6, 4, rng), now, out);
  F.sparkAt = now + 20_000; F.ashAt = now + 12_000; F.packAt = now + 30_000;
  fragStand(B, F, spec, now, out);
  return F;
}

// ── EG-FULL LAYER THREE: THE FRAGMENTS' RELAY HALF (net/egFragLaw.js; section 11) ─────────────────────────────────
/**
 * At a hall's wake: each seam alcove's false wall (one blow - a struck object, `fwall`), the fragments' Lurkers dormant
 * in their walls' shadow (the Low Road's every one; a passage's one from circle 3; a chamber's one from circle 4), the
 * engines' cooldowns, the Clan Pit's horn.
 */
function fragStand(B, F, spec, now, out) {
  F.alc = {}; F.engCd = {}; F.engUsed = {}; F.engHits = []; F.engStun = {}; F.lowUp = 0; F.took = {};
  F.horn = spec.spots.horn?.length ? { at: now + EG_HORN_FIRST_MS, kv: 0, sub: '', foul: 0, ashAt: 0, ash: 0 } : null;
  for (const a of spec.alcoves ?? []) {
    if (a.seal !== 'seam') { F.alc[a.i] = 1; continue; }
    const o = egRaiseObj(F, 'fwall', a.x, a.z, 1, now, out, { r: 1.0, pt: a.i });
    if (o) o.alc = a.i;
  }
  const lurks = [], firstOf = new Set();
  for (const q of spec.spots.lurker ?? []) {
    const f = spec.frags?.[q.f], low = q.road === 1;
    if (!f) continue;
    if (low || (!firstOf.has(q.f) && ((f.cls === 'passage' && spec.c >= 3) || (f.cls === 'chamber' && spec.c >= 4)))) { lurks.push([q.x, q.z]); firstOf.add(q.f); }
  }
  if (lurks.length) egLegionRaise(F, lurks.map(() => EG_KIND.lurker), lurks, now, out, { wave: 0 });
}
/** The Low Road's member (section 11.4): past the fork, on its side of the hall. */
const onLowRoad = (spec, b) => !!spec.fork && b.z >= spec.fork.z && b.x >= (spec.fork.lowX + spec.fork.x) / 2;
/**
 * The fragments' beat, in a trial and its closing: the alcoves (a member within reach of an open one takes what it
 * holds, once), the High Road's cache (a Reliquary to each who touches it) and the Low Road's niche (15% once, a shard
 * each), the Low Road's foes risen as the first member takes it, the engines' blows landing on the legion, the Clan Pit's
 * horn.
 */
function fragStep(B, F, spec, now, inHall, here, rng, out) {
  if (!F.alc) return;
  for (const b of inHall) {
    const mm = B.mem[b.sub];
    if (!mm) continue;
    const took = (F.took[b.sub] ??= {});
    for (const a of spec.alcoves ?? []) {
      if (!F.alc[a.i] || took[`a${a.i}`] || dist(b.x, b.z, a.x, a.z) > EG_ALCOVE_REACH_M) continue;
      took[`a${a.i}`] = 1;
      if (a.holds === 'page') {
        const p = egAnnalsNext(mm.pages ?? 0, (B.seed + spec.h * 7 + a.i) % 17);
        if (p >= 0) { mm.pages = (mm.pages ?? 0) | (1 << p); out.push({ k: 'egot', to: b.sub, w: 'page', p }); }
        else { egGive(mm, 'lumen'); out.push({ k: 'egot', to: b.sub, w: 'lumen' }); }
      } else { egGive(mm, a.holds); out.push({ k: 'egot', to: b.sub, w: a.holds }); }
      out.push({ k: 'run', r: egRunOf(b.sub, mm) });
    }
    for (const q of spec.spots.hcache ?? []) if (!took.hc && dist(b.x, b.z, q.x, q.z) <= EG_HCACHE_REACH_M && fairOf(B, b.sub)) { took.hc = 1; egGive(mm, 'rel', egCircleOfHall(B.h)); out.push({ k: 'egot', to: b.sub, w: 'rel' }, { k: 'esay', w: 'hcache', n: mm.name }, { k: 'run', r: egRunOf(b.sub, mm) }); }
    for (const q of spec.spots.lniche ?? []) if (!took.ln && dist(b.x, b.z, q.x, q.z) <= EG_ALCOVE_REACH_M && fairOf(B, b.sub)) { took.ln = 1; egGive(mm, 'shard'); out.push({ k: 'eheal', p: EG_NICHE_HEAL, why: 'niche', to: b.sub }, { k: 'egot', to: b.sub, w: 'shard' }, { k: 'esay', w: 'niche', n: mm.name }, { k: 'run', r: egRunOf(b.sub, mm) }); }
    if (!F.lowUp && B.sg === 'trial' && onLowRoad(spec, b)) {
      F.lowUp = 1;
      const foes = spec.spots.lowfoe ?? [];
      if (foes.length) egLegionRaise(F, foes.map(() => EG_KIND.harrier), foes.map((q) => [q.x, q.z]), now, out, { wave: 0 });
      out.push({ k: 'esay', w: 'lowroad', n: mm.name });
    }
  }
  // the engines' blows land on the legion (each member's own share is the blow's - every screen judges its own feet)
  if (F.engHits.length) {
    const due = F.engHits.filter((h) => now >= h.at);
    F.engHits = F.engHits.filter((h) => now < h.at);
    for (const h of due) engineLands(B, F, spec, h, now, out);
  }
  if (F.horn && B.sg === 'trial') hornStep(B, F, spec, now, inHall, rng, out);
}
/**
 * AN ENGINE WORKED (section 11.10 - `use`): the Sluice floods a channel through the legion, the Shelf topples onto it
 * (once), the Drop-Hammer falls on it, each a blow of the place told EG_ENGINE_TELL_MS (a member caught takes the place's
 * 20%); the Soul-Bell and the Moon-Mirror ring out about the engine. Aimed where the legion stands thickest.
 */
function engineWork(B, F, spec, e, mm, now, out) {
  const E = EG_ENGINES[e.kind];
  if (!E) return false;
  const adds = egBodiesOf(F, EG_ROLE.add).filter((a) => !egHas(a, EG_FL.friend) && a.hp > 0);
  let tx = spec.fight?.x ?? e.x, tz = spec.fight?.z ?? e.z, best = -1;
  for (const a of adds) { const n = adds.filter((q) => dist(q.x, q.z, a.x, a.z) <= 3).length; if (n > best) { best = n; tx = a.x; tz = a.z; } }
  const yaw = Math.atan2(tx - e.x, tz - e.z), far = Math.max(8, dist(e.x, e.z, tx, tz) + 6);
  const stamp = e.kind === 'sluice' ? shLane(e.x, e.z, e.x + Math.sin(yaw) * Math.max(far, 2 * (spec.fight?.r ?? 12)), e.z + Math.cos(yaw) * Math.max(far, 2 * (spec.fight?.r ?? 12)), 4)
    : e.kind === 'shelf' ? shLane(e.x, e.z, e.x + Math.sin(yaw) * 12, e.z + Math.cos(yaw) * 12, 4)
      : e.kind === 'hammer' ? shDisc(tx, tz, 3) : shDisc(e.x, e.z, 8);
  const at = now + EG_ENGINE_TELL_MS;
  if (E.pct > 0) {
    const here = living(B).map(([s2, m2]) => (m2.pose ? { sub: s2, x: m2.pose.x, z: m2.pose.z } : null)).filter(Boolean);
    egAim(F, spec, { o: 0, s: [stamp], at, wu: EG_ENGINE_TELL_MS, p: EG_ENGINE_PCT, b: 0, el: null, nm: E.name }, here, now, out);
  }
  F.engHits.push({ at, kind: e.kind, s: stamp, i: e.i });
  if (E.once) F.engUsed[e.i] = 1;
  out.push({ k: 'esay', w: 'engine', n: mm.name, t: E.name.replace(/^the /, '') });
  return true;
}
/** An engine's blow landed: the adds caught lose their share; the bell stuns Wraiths and Binders, the mirror the Divers;
 *  the hammer stuns a lord caught, once a phase. */
function engineLands(B, F, spec, h, now, out) {
  const E = EG_ENGINES[h.kind];
  for (const a of egBodiesOf(F, EG_ROLE.add)) {
    if (egHas(a, EG_FL.friend) || !(a.hp > 0) || !egInShape(h.s, a.x, a.z)) continue;
    if (E.stun) {
      const k = /** @type {number[]} */ (h.kind === 'soulbell' ? [EG_KIND.wraith, EG_KIND.binder] : [EG_KIND.diver]);
      if (k.includes(a.k)) { egSetFl(F, a, EG_FL.stun, true, out); a.stunUntil = now + E.stun; }
      continue;
    }
    a.hp -= a.max * E.pct;
    if (a.hp <= 0) { a.hp = 0; egGone(F, [a], EG_GONE.slain, E.name, now, out); }
  }
  if (E.lordStun) for (const L of egLordsOf(F)) if (egInShape(h.s, L.x, L.z) && F.engStun[L.i] !== L.ph) { F.engStun[L.i] = L.ph; egStun(F, L, E.lordStun, now, out); }
}
/**
 * THE HONOUR HORN (the Clan Pit, section 11.2): a Kynval steps into a ring (r 6) and calls one member. If that member
 * alone fights him, the tiers throw a Reliquary to every member; if another member enters the ring, the crowd throws
 * fire - Ashfall in the Pit for the rest of the hall. With one member it is always honourable.
 */
function hornStep(B, F, spec, now, inHall, rng, out) {
  const H = F.horn, at = spec.spots.horn[0];
  if (H.ash && now >= H.ashAt) { H.ashAt = now + EG_ASHFALL_EVERY_MS; const c = spec.fight ?? at; for (let k = 0; k < 3; k++) { const a = rng() * Math.PI * 2, r = rng() * Math.max(2, (c.r ?? 12) - 3); zoneOut(F, 'burn', shDisc(c.x + Math.sin(a) * r, c.z + Math.cos(a) * r, 3), now + 1500, now + 7500, out, { p: 0.06, b: 2, el: 'fire' }); } }
  if (!H.kv) {
    if (now < H.at || !inHall.length) return;
    const callee = inHall[Math.floor(rng() * inHall.length)];
    const [k] = egLegionRaise(F, [EG_KIND.kynval], [[at.x, at.z]], now, out, { wave: 0 });
    if (!k) { H.at = now + EG_HORN_AGAIN_MS; return; }
    H.kv = k.i; H.sub = callee.sub; H.foul = inHall.length <= 1 ? 0 : H.foul;
    out.push({ k: 'esay', w: 'horn', n: memberName(B, callee.sub) });
    return;
  }
  const k = egBodyById(F, H.kv);
  if (!k || !(k.hp > 0)) {
    if (!H.foul) { for (const [s2, m2] of living(B)) { egGive(m2, 'rel', egCircleOfHall(B.h)); out.push({ k: 'egot', to: s2, w: 'rel' }); } out.push({ k: 'esay', w: 'hornwon', n: memberName(B, H.sub) }); }
    H.kv = 0; H.sub = ''; H.foul = 0; H.at = now + EG_HORN_AGAIN_MS;
    return;
  }
  if (!H.foul && inHall.length > 1 && inHall.some((b) => b.sub !== H.sub && dist(b.x, b.z, k.x, k.z) <= EG_HORN_RING_M)) {
    H.foul = 1;
    if (!H.ash) { H.ash = 1; H.ashAt = now; }
    out.push({ k: 'esay', w: 'hornfoul' });
  }
}
/** A Span's twist: the Reliquary Vault's cache. */
function spanTwist(B, F, spec, now, out) {
  if (spec.twist === 'vault') for (const q of spec.spots.vault ?? []) egRaiseObj(F, 'vault', q.x, q.z, 0, now, out, { r: 3 });
  if (spec.twist === 'bargain' && egBargainOpen(B)) egAsk(B, 'bargain', [1], now, out);
  F.pg.obj = 'cross';
}
/** Is a Bargain open this circle (once a circle, and only with a family free)? */
const egBargainOpen = (B) => !(B.bargainDc ?? []).length;
/** An errand's object stood (net/egLords.js's law for its types). */
function egRaiseObj(F, t, x, z, hp, now, out, o = {}) {
  const b = egRaise(F, EG_ROLE.obj, EG_OBJ[t] ?? 0, [[x, z]], hp > 0 ? hp : 1, now, out, { r: o.r ?? 1.2, pt: o.pt ?? 0 })[0];
  if (!b) return null;
  b.t = t; b.st = 0; b.great = o.great ?? 0;
  if (!(hp > 0)) egSetFl(F, b, EG_FL.ward, true, out);
  return b;
}

/** The door opens (section 7): the closing begins - a Rally's heal said, the cache's plaque, the legion crumbles. */
function door(B, spec, now, out, inHall = []) {
  clearHall(B, now);
  if (B.F) { egGone(B.F, egBodiesOf(B.F, EG_ROLE.add), EG_GONE.crumbled, '', now, out); egGone(B.F, egObjsOf(B.F, 'spark'), EG_GONE.crumbled, '', now, out); }
  B.sg = 'closing'; B.sa = now; B.dn = now;
  const span = spec.kind === 'span' || spec.kind === 'deepway' || spec.kind === 'brink' || spec.kind === 'proving';
  B.su = now + (span ? EG_CLOSING_SPAN_MS : EG_CLOSING_FIGHT_MS);
  // THE FORK (section 11.4): opened by a High Road arrival with members still on the Low Road, the closing waits the
  // difference between the two roads' fastest crossings - the safe road is never a forfeit
  const opener = inHall.find((b) => egAtDoor(spec, b.x, b.z));
  if (spec.fork && opener && !onLowRoad(spec, opener) && inHall.some((b) => b !== opener && onLowRoad(spec, b) && !egAtDoor(spec, b.x, b.z))) B.su += Math.max(0, Math.round((spec.fork.lo - spec.fork.hi) * 1000));
  // Rally (and the Rallying Cry): the company heals when a hall's door opens - the strongest holder's
  const rally = Math.max(0, ...living(B).map(([, m]) => egVOf(m.vs, 'rally')));
  if (rally > 0) out.push({ k: 'eheal', p: B.tide === 'hungering' ? rally / 3 : rally, why: 'rally' });
  out.push(egStageWord(B, now), { k: 'esay', w: 'door' });
}
/** A hall's part in the circle counted for each living member: blows landed in it, or a step through its door. */
function countPart(B) {
  for (const [, m] of living(B)) { if (m.dh > 0 || m.downH === B.h) m.act++; m.dh = 0; }
}
/** THE PULL: every living member to the next hall, its arrival begun, the count held (at most the stair's hold). */
function pull(B, now, out) {
  countPart(B);
  B.h += 1; B.F = null; B.cache = null;
  B.sg = 'arrive'; B.sa = now; B.su = now + EG_ARRIVE_MAX_MS; B.pulledAt = now; B.hw = 0; B.dn = 0; B.gatherAt = 0;
  B.cnt = egCountHold(B.cnt, now);
  out.push(egStageWord(B, now), egStateOf(B, now));
}
/** The count's gain at a Redoubt: fifteen minutes (ten under The Covenant's Press, five at its rank II), never past the cap
 *  nor the last word; what the cap turned away banked toward a Surplus. Answers the gain (ms). */
function redoubtGain(B, now) {
  const press = egDecreeRanks(B).press ?? 0;
  const add = press >= 2 ? EG_REDOUBT_HOLD_MS / 3 : press ? (EG_REDOUBT_HOLD_MS * 2) / 3 : EG_REDOUBT_HOLD_MS;
  const before = egCountLeft(B.cnt, now), lastWord = Math.max(0, B.op + EG_LAST_WORD_MS - now);
  const want = before + add, left = Math.max(0, Math.min(want, EG_COUNT_CAP_MS, lastWord));
  if (want > EG_COUNT_CAP_MS) { B.surAcc += want - EG_COUNT_CAP_MS; while (B.surAcc >= EG_SURPLUS_MS && B.sur < EG_SURPLUS_MAX) { B.surAcc -= EG_SURPLUS_MS; B.sur++; } }
  B.cnt = { left, at: 0 };
  return left - before;
}
/**
 * THE REDOUBT (section 16): the Court fell - its receipts for every earner (a share of the circle's damage, or a part in
 * three of its halls), a Reliquary sealed into each earner's satchel, the count's time (none under THE COVENANT'S
 * PATIENCE), the rest held; the recalls at 4.5 s; at 6 s the rest window: the Vestiges offered, the next circle's decrees
 * put to the company, the Ready and the respite. A Rehearsal ends here instead.
 */
function redoubt(B, now, rng, out) {
  clearHall(B, now);
  countPart(B);
  if (B.F) egGone(B.F, egBodiesOf(B.F, EG_ROLE.add), EG_GONE.crumbled, '', now, out);
  if (B.rh) { egEnd(B, 'rehearsal', now, out); return; }
  const w = egCircleOfHall(B.h), L = living(B), total = L.reduce((s, [, m]) => s + m.dc, 0), n = Math.max(1, L.length);
  const earners = L.filter(([, m]) => m.dc >= total / (2 * n) || m.act >= 3);
  const valk = w % 5 === 0;
  B.rd = w; B.rdAt = now;
  const lone = L.length === 1 && Object.values(B.mem).filter((m) => m.in).length >= 4;
  const gain = B.covenant ? 0 : redoubtGain(B, now);
  if (B.covenant) B.cnt = egCountHold(B.cnt, now);
  // EG-E: the lord's feats, judged at its fall (net/egFeats.js) - said on each earner's receipt with the lord's key
  const lk = specOf(B).lord ?? '', ft = B.F ? egFeatBits(lk, B.F, { covenant: B.covenant, now }) : 0;
  for (const [sub, m] of earners) {
    owe(B, sub, { q: 'w', w, h: B.h, t: secs(now - B.wk), n: earners.length, ew: B.ew, l: m.lv, vs: (m.vs ?? []).slice(0, 32), fl: m.falls ?? 0, ...(lone ? { lb: 1 } : {}), ...(B.wg?.length ? { wg: B.wg } : {}), ...(lk ? { lk, ft } : {}) });
    m.rel = [...(m.rel ?? []), w];
  }
  // EG-E3: THE HERALD'S NEWS - a Valkynaz's Redoubt (the hub says every tenth, the first tenth ever as First of the Spire,
  // and a band passed whose seal a deploy lifted), and a Court felled alone, once a member a breach
  if (valk) heraldOwe(B, now, { k: 'rd', w, h: B.h, t: secs(now - B.wk), o: B.o ?? '', by: earners.map(([, m]) => m.name ?? '') });
  if (lone && !L[0][1].lbSaid) { L[0][1].lbSaid = 1; heraldOwe(B, now, { k: 'lb', n: L[0][1].name ?? '', lk, c: entrants(B).length }); }
  if (valk) B.resp += EG_RESPITE_VALK_MS;
  for (const [, m] of L) { m.dc = 0; m.act = 0; }
  B.log.push({ h: B.h, rd: w, lord: specOf(B).lord });
  // THE ANNALS (section 11.10): a lord's first fall adds its page to every living member's
  const page = egAnnalsLordPage(specOf(B).lord ?? '');
  if (page >= 0) for (const [sub, m] of L) if (!((m.pages ?? 0) & (2 ** page))) { m.pages = (m.pages ?? 0) + 2 ** page; out.push({ k: 'egot', to: sub, w: 'page', p: page }); }
  egStratumAt(B, w, rng);
  B.F = null;
  B.sg = 'rest'; B.sa = now; B.su = now + EG_RD_WINDOW_MS + EG_REST_MS; B.hw = 0; B.dn = 0;
  B.rdSeq = { recalled: 0, window: 0, valk };
  out.push({ k: 'rd', w, h: B.h, at: now, cl: Math.round(egCountLeft(B.cnt, now)), g: Math.round(gain), v: valk ? 1 : 0, cov: B.covenant ? 1 : 0 }, egStageWord(B, now));
}
/** The Redoubt's sequence run on (section 16.2): the recalls, the rest window, the respite and the Ready. */
function restStep(B, now, rng, out) {
  const S = B.rdSeq ?? {};
  if (!S.recalled && now >= B.rdAt + EG_RD_RECALL_MS) {
    S.recalled = 1;
    const spec = specOf(B), c = spec.fight ?? spec.arrive;
    for (const [sub, m] of Object.entries(B.mem)) if (m.in && !m.alive && !m.forsaken && m.recall > 0) recall(B, sub, 1, [c.x, c.z], now, out);
  }
  if (!S.window && now >= B.rdAt + EG_RD_WINDOW_MS) {
    S.window = 1;
    // the rest's heal: whole (half under Ashen Vigil or Hungering Dark, a quarter at Ashen Vigil's rank II)
    const ash = egDecreeRanks(B).ashen ?? 0;
    out.push({ k: 'eheal', p: ash >= 2 ? 0.25 : ash || B.tide === 'hungering' ? 0.5 : 1, why: 'rest' });
    out.push(...egOffers(B, B.rd, S.valk, rng, now));
    if (B.covenant) out.push({ k: 'esay', w: 'covenantrest' });
    else {
      egDecreesAsk(B, egCircleOfHall(B.h) + 1, rng, now, out);
      egAsk(B, 'ready', [1], now, out);
      if (B.resp >= 30_000) egAsk(B, 'respite', [1], now, out);
    }
    out.push(egStateOf(B, now));
  }
}
/** The rest over: the next circle's decrees chosen (its tide drawn), its first hall - or the end (nobody stays, or THE
 *  COVENANT'S PATIENCE ends it as the way home). */
function nextCircle(B, now, rng, out) {
  egPicksClose(B);
  const due = egAsksDue(B, now, true);
  if (B.covenant) { egEnd(B, 'home', now, out); return; }
  if (!living(B).length) { egEnd(B, 'gone', now, out); return; }
  const c = egCircleOfHall(B.h) + 1;
  B.dc = egDecreesChosen(B, due);
  B.bargainDc = [];
  B.tide = egTideOf(c, rng);
  B.h = egFirstHallOf(c);
  B.sg = 'arrive'; B.sa = now; B.su = now + EG_ARRIVE_MAX_MS; B.pulledAt = now; B.hw = 0; B.dn = 0; B.gatherAt = 0;
  for (const [, m] of living(B)) m.hereH = 0;
  out.push(egStageWord(B, now), egStateOf(B, now));
}
/** The company's word answered: the asks whose window closed, each acted on (a Bargain, a respite, the Ready). */
function asksStep(B, now, rng, out) {
  if (!(B.asks ?? []).length) return;
  const due = egAsksDue(B, now).filter((a) => !a.q.startsWith('dec:'));
  for (const a of due) {
    const yes = egAskResult(a) === 1;
    if (a.q === 'bargain' && yes) {
      const D = egBargainDecree(B, rng);
      if (D) { for (const [sub, y] of Object.entries(a.v)) if (y === 1 && B.mem[sub]?.alive) egGive(B.mem[sub], 'rel', egCircleOfHall(B.h)); out.push({ k: 'esay', w: 'bargain', t: D.name }, egStateOf(B, now)); }
    } else if (a.q === 'respite' && yes && B.sg === 'rest') {
      const add = Math.min(EG_RESPITE_STEP_MS, B.resp);
      B.resp -= add; B.su += add;
      out.push(egStageWord(B, now), { k: 'esay', w: 'respite', t: String(Math.round(add / 1000)) });
    } else if (a.q === 'ready' && yes && B.sg === 'rest') {
      B.su = Math.min(B.su, now + 3000);
      out.push(egStageWord(B, now), { k: 'esay', w: 'ready' });
    }
    out.push({ k: 'asked', q: a.q, r: egAskResult(a, a.q.startsWith('dec:')) });
  }
  // the decrees' asks stay open to the rest's end - kept, their tallies said as they move
}

/**
 * ONE BEAT of the breach: `bodies` the members' newest fresh poses (`{sub, sx, z, dead, at}` - the Spire's frame:
 * net/sdBrain.js dungeonToRealm's), `rng` a [0,1) source. Moves the record in place; answers the frames to fan, in order.
 * @param {any} B @param {number} now @param {{sub: string, sx: number, z: number, dead: boolean, at?: number}[]} bodies
 * @param {() => number} rng
 */
export function egStep(B, now, bodies, rng) {
  const out = [];
  if (B.end) return out;
  if (now >= B.op + EG_LAST_WORD_MS) { egEnd(B, 'last', now, out); return out; }
  const spec0 = B.h > 0 ? specOf(B) : null;
  for (const b of bodies) {
    const m = B.mem[b.sub];
    if (!m || !m.in || !m.alive || m.home) continue;
    m.seenAt = Math.max(m.seenAt, b.at ?? now);
    if (b.dead) egFall(B, b.sub, now, out, spec0 ? local(spec0, b) : null);
  }
  if (B.sg === 'trial') for (const [sub, m] of living(B)) if (now - m.seenAt > EG_ABSENT_TRIAL_MS) egFall(B, sub, now, out, null);
  if (B.wk && !living(B).length) { egEnd(B, 'wipe', now, out); return out; }
  asksStep(B, now, rng, out);
  const T = egTimes(clockRec(B)), alive = bodies.filter((b) => { const m = B.mem[b.sub]; return m && m.in && m.alive && !m.home && !b.dead; });
  if (B.sg === 'wait') {
    if (now >= B.su) { B.h = egStartHall(B.ew); B.sg = 'arrive'; B.sa = now; B.su = T.admitUntil; B.pulledAt = now; out.push(egStageWord(B, now)); }   // EG-F: a deeper start's first hall (section 16.6)
    return out;
  }
  const spec = specOf(B);
  const inHall = alive.map((b) => local(spec, b)).filter(Boolean);
  for (const b of inHall) B.mem[b.sub].pose = { x: b.x, z: b.z };
  mementoStep(B, spec, inHall, now, out);
  if (B.sg === 'arrive') {
    for (const b of inHall) if (egOnArrive(spec, b.x, b.z, 1.5)) B.mem[b.sub].hereH = B.h;
    const L = living(B);
    const all = B.wk ? L.length > 0 && L.every(([, m]) => m.hereH === B.h) : B.co.every((c) => B.mem[c.sub]?.in && B.mem[c.sub].alive && B.mem[c.sub].hereH === B.h);
    if (all && !B.gatherAt) { B.gatherAt = now; B.su = now + EG_GATHER_MS; out.push(egStageWord(B, now)); }
    if (B.gatherAt && now >= B.gatherAt + EG_GATHER_MS) { wake(B, now, rng, out); return out; }
    if (!B.wk && now >= T.admitUntil) { if (L.length) wake(B, now, rng, out); else egEnd(B, 'empty', now, out); return out; }
    if (B.wk && now >= B.pulledAt + EG_ARRIVE_MAX_MS) { wake(B, now, rng, out); return out; }
    if (B.wk && B.cnt.at === 0 && now >= B.pulledAt + EG_STAIR_HOLD_MS) { B.cnt = egCountRun(B.cnt, now); out.push(egStageWord(B, now)); }
    return out;
  }
  if (B.sg === 'rest') { restStep(B, now, rng, out); if (now >= B.su) nextCircle(B, now, rng, out); return out; }
  if (B.sg === 'closing') {
    if (B.cnt.at > 0 && now >= B.dn + EG_CLOSING_COUNT_MS) { B.cnt = egCountHold(B.cnt, now); out.push(egStageWord(B, now)); }
    if (B.cnt.at > 0 && egCountLeft(B.cnt, now) <= 0) { egEnd(B, 'tear', now, out); return out; }
    cacheStep(B, spec, inHall, now, rng, out);
    if (B.F) fragStep(B, B.F, spec, now, inHall, inHall, rng, out);   // LAYER THREE: an alcove, a cache, a niche taken in the closing too
    goldRun(B, spec, now, out);
    const L = living(B);
    if (now >= B.su || (L.length && L.every(([, m]) => m.downH === B.h))) pull(B, now, out);
    return out;
  }
  // THE TRIAL - and THE COVENANT'S PATIENCE: a count spent while a Court's lord is awake does not tear
  if (egCountLeft(B.cnt, now) <= 0) {
    if (spec.kind === 'court' && B.F && egLordsAwake(B.F) && !egLordsFell(B.F)) { if (!B.covenant) { B.covenant = 1; out.push({ k: 'esay', w: 'covenant' }); } }
    else { egEnd(B, 'tear', now, out); return out; }
  }
  trial(B, spec, now, inHall, rng, out);
  return out;
}

/** THE GOLD RUN (section 8.2): every living member across a span before the closing's fifteenth second - a minute more on
 *  the count, past the cap toward a Surplus. A company of one is exempt. */
function goldRun(B, spec, now, out) {
  if (B.gold || !(spec.kind === 'span' || spec.kind === 'deepway' || spec.kind === 'brink')) return;
  const L = living(B);
  if (L.length < 2 || now > B.dn + EG_CLOSING_COUNT_MS) return;
  if (!L.every(([, m]) => m.downH === B.h || m.atEndH === B.h)) return;
  B.gold = 1;
  const before = egCountLeft(B.cnt, now), want = before + EG_GOLD_RUN_MS;
  if (want > EG_COUNT_CAP_MS) { B.surAcc += want - EG_COUNT_CAP_MS; while (B.surAcc >= EG_SURPLUS_MS && B.sur < EG_SURPLUS_MAX) { B.surAcc -= EG_SURPLUS_MS; B.sur++; } }
  B.cnt = { left: Math.min(want, EG_COUNT_CAP_MS), at: B.cnt.at > 0 ? now : 0 };
  out.push(egStageWord(B, now), { k: 'esay', w: 'goldrun' });
}
/** THE CACHE on the end plate (section 17.1): each member who touches it during the closing takes one - a Kyn Mimic's
 *  one in eight a Lurker instead. */
function cacheStep(B, spec, inHall, now, rng, out) {
  const C = B.cache, at = spec.spots.cache?.[0];
  if (!C || !at || C.lost) return;
  for (const b of inHall) {
    const m = B.mem[b.sub];
    if (!m || C.took[b.sub] || dist(b.x, b.z, at.x, at.z) > EG_TOUCH_M || !fairOf(B, b.sub)) continue;   // EG-H1: a fair trail's
    if (b.x != null) m.atEndH = B.h;
    if (C.mimic) { C.mimic = 0; C.lost = 1; if (!B.F) B.F = egFightNew(spec, now, living(B).map(([, x]) => x.lv)); const [lk] = egLegionRaise(B.F, [EG_KIND.lurker], [[at.x, at.z]], now, out); if (lk) egSetFl(B.F, lk, EG_FL.dormant, false, out); out.push({ k: 'esay', w: 'mimic' }); return; }
    C.took[b.sub] = 1;
    egGive(m, C.k, 1, rng);
    out.push({ k: 'egot', to: b.sub, w: C.k }, { k: 'run', r: egRunOf(b.sub, m) });
  }
}
/** THE MEMENTOS (section 16.5): carried by a living member who passes within 2 m; set at a Battlemage's niche, the
 *  fallen is called back at half their health. */
function mementoStep(B, spec, inHall, now, out) {
  if (!B.mementos.length) return;
  const niches = (spec.spots.niche ?? []).map((q) => [q.x, q.z]);
  for (const q of B.mementos) {
    if (!q.by) {
      if (q.h !== B.h) continue;
      const c = inHall.find((b) => dist(b.x, b.z, q.x, q.z) <= EG_MEMENTO_REACH && fairOf(B, b.sub));   // EG-H1: carried on a fair trail
      if (c) { q.by = c.sub; out.push({ k: 'esay', w: 'memento', n: memberName(B, c.sub), t: memberName(B, q.s) }, egStateOf(B, now)); }
      continue;
    }
    const c = inHall.find((b) => b.sub === q.by);
    if (!c) continue;
    q.x = c.x; q.z = c.z; q.h = B.h;
    const niche = niches.find(([x, z]) => dist(c.x, c.z, x, z) <= EG_MEMENTO_REACH + 0.5);
    if (niche && fairOf(B, q.by)) recall(B, q.s, EG_MEMENTO_PCT, [niche[0], niche[1] + 1.5], now, out);
  }
}

/** The trial's beat, by the hall's kind. `inHall` the living members standing in the hall (its own frame). */
function trial(B, spec, now, inHall, rng, out) {
  const F = B.F;
  if (!F) return;
  egCarry(F, now);
  const here = inHall.filter((b) => egOnFight(spec, b.x, b.z, 4));
  const D = F.D ?? {};
  const cap = Math.max(0, Math.min(EG_STANDING_MAX, Math.floor(egLegionCap(F.n, F.c) / (F.halfCap ? 2 : 1))) - egBodiesOf(F, EG_ROLE.add).filter((a) => !egHas(a, EG_FL.friend)).length);
  const wave = (spots, k = egWaveSize(F.n), o = {}) => {
    const n = Math.min(k, cap);
    if (n <= 0 || !spots.length) return [];
    F.waveNo = (F.waveNo ?? 0) + 1;
    const kinds = egWaveKinds(F, rng, n, { swarm: D.swarm ?? 0, waveNo: F.waveNo, sky: !spec.chamber });
    return egLegionRaise(F, kinds, spots, now, out, { wave: F.waveNo, ...o });
  };
  fragStep(B, F, spec, now, inHall, here, rng, out);
  const lordCtx = { decrees: D, n: F.n, covenant: B.covenant };
  const legionCtx = {
    decrees: D,
    anchor: spec.kind === 'court' ? (() => { const L0 = egLordsOf(F)[0]; return L0 ? [L0.x, L0.z] : null; })() : null,
    fadeOf: (sub, t) => (B.mem[sub]?.fadeUntil ?? 0) > t,
    pool: (x, z, r, from, ms, p, b, el, kind = 'burn') => zoneOut(F, kind, shDisc(x, z, r), from, from + ms, out, { p, b, el }),
    rally: F.rally,
    sapGoal: (a) => sapperGoal(F, spec, a),
    sapAt: (a) => sapperReach(F, spec, a, now, out),
    ghostHit: (g, t) => { t.hp -= Math.max(1, F.mean * 1.5); if (t.hp <= 0) { egGone(F, [t], EG_GONE.slain, "A Battlemage's Ghost", now, out); egAddSlain(F, spec, t, null, now, here, out, legionCtx); } },
    deserterGoal: () => { const r = egObjsOf(F, 'rift').filter((o) => o.hp > 0 && !egHas(o, EG_FL.ward)); return r[0] ? [r[0].x, r[0].z] : null; },
    deserterHit: () => { const r = egObjsOf(F, 'rift').filter((o) => o.hp > 0 && !egHas(o, EG_FL.ward))[0]; if (r) { r.hp -= F.mean * 2; if (r.hp <= 0) { r.hp = 0; F.desClosed = (F.desClosed ?? 0) + 1; riftClosed(B, F, spec, r, 'The Deserter', now, out); } } },
  };
  F.legionCtx = legionCtx;
  // the Span, the Brink: the door opens on the first living member at the far plate; a fragment's Lurkers and the Low
  // Road's foes at their work meanwhile
  if (spec.kind === 'span' || spec.kind === 'brink') {
    for (const b of inHall) for (const o of egObjsOf(F, 'vault')) if (dist(b.x, b.z, o.x, o.z) <= 3 && fairOf(B, b.sub) && !(o.took ??= {})[b.sub]) { o.took[b.sub] = 1; egGive(B.mem[b.sub], 'rel', egCircleOfHall(B.h)); out.push({ k: 'egot', to: b.sub, w: 'rel' }); }
    if (egBodiesOf(F, EG_ROLE.add).length) egLegionStep(F, spec, now, here, rng, out, legionCtx);
    if (doorOpener(B, spec, inHall)) door(B, spec, now, out, inHall);   // EG-H1: a fair arrival opens it (section 21)
    egMovesOut(F, out);
    return;
  }
  const kind = spec.kind, v = spec.variant;
  if (kind === 'yard' || (kind === 'deepway' && F.chamber === 0)) {
    const rifts = egObjsOf(F, 'rift');
    if (v === 'wellspring') {
      const spring = rifts.find((o) => o.great);
      const anchors = egObjsOf(F, 'anchor');
      if (spring) egSetFl(F, spring, EG_FL.ward, anchors.length > 0, out);
      F.pg.anchors = anchors.length;
      if (!spring) { door(B, spec, now, out); return; }
      if (now >= F.waveAt) { F.waveAt = now + egWaveEveryMs(F.c); wave(ringSpots(spec, spring.x, spring.z, 3, egWaveSize(F.n), rng)); }
    } else if (v === 'muster') {
      const std = egBodiesOf(F, EG_ROLE.add, EG_KIND.standard)[0];
      if (!std) { door(B, spec, now, out); return; }
      if (now >= F.waveAt) { F.waveAt = now + egWaveEveryMs(F.c); for (const p of F.rally ?? []) wave([p], Math.ceil(egWaveSize(F.n) / 2)); }
    } else if (v === 'holdfast') {
      const relic = egObjsOf(F, 'relic')[0];
      const onIt = relic && here.some((b) => dist(b.x, b.z, relic.x, relic.z) <= (relic.r ?? 6));
      if (onIt) F.holdMs += 250;
      for (const a of egBodiesOf(F, EG_ROLE.add)) if (relic && !egHas(a, EG_FL.friend) && dist(a.x, a.z, relic.x, relic.z) <= 2.5) { egGone(F, [a], EG_GONE.fed, '', now, out); F.relic -= 4; }
      if (F.relic <= 0 && relic) {
        F.relic = EG_RELIC_MAX; F.holdMs = Math.floor(F.holdMs / 2);
        for (const q of spec.rifts.slice(3, 5)) { if (F.riftSpots.length >= 5) break; F.riftSpots.push(q); const o = egRaiseObj(F, 'rift', q.x, q.z, 1, now, out, { r: 1.3 }); egSetFl(F, o, EG_FL.ward, true, out); }
        out.push({ k: 'esay', w: 'relicbroken' });
      }
      F.pg.hold = Math.min(F.holdNeed, F.holdMs); F.pg.relic = F.relic;
      if (F.holdMs >= F.holdNeed) { door(B, spec, now, out); return; }
      if (now >= F.waveAt) { F.waveAt = now + egWaveEveryMs(F.c); for (const q of F.riftSpots) wave([[q.x, q.z]], Math.ceil(egWaveSize(F.n) / 2)); }
    } else {
      const standing = rifts.filter((o) => o.hp > 0);
      F.pg.rifts = [standing.length, rifts.length + (F.closed ?? 0)];
      if (!standing.length) {
        if (spec.twist === 'deserter' && (F.desClosed ?? 0) >= (F.coClosed ?? 0) && B.cache) { B.cache.lost = 1; out.push({ k: 'esay', w: 'desertertook' }); }
        else if (spec.twist === 'deserter') for (const [sub, m] of living(B)) { egGive(m, 'shard', 1, rng); out.push({ k: 'egot', to: sub, w: 'shard' }); }
        if (kind === 'deepway') F.chamberDone = 1; else { door(B, spec, now, out); return; }
      }
      if (F.wander && now >= F.wanderAt) {
        F.wanderAt = now + 20_000;
        for (const [j, o] of standing.entries()) { const socks = (spec.spots.socket ?? []).filter((s) => s.k === j); const to = socks[Math.floor(rng() * socks.length)]; if (to) egWalk(F, o, to.x, to.z, 0, 2.0, now, spec, 0, true); }
      }
      if (now >= F.waveAt && standing.length) {
        F.waveAt = now + egWaveEveryMs(F.c);
        for (const q of standing) { const toward = Math.atan2(spec.fight.x - q.x, spec.fight.z - q.z), k = Math.max(1, Math.ceil(egWaveSize(F.n) / 2)), spots = []; for (let i = 0; i < k; i++) { const a = toward + (i - (k - 1) / 2) * 0.6; spots.push([q.x + Math.sin(a) * 2.2, q.z + Math.cos(a) * 2.2]); } wave(spots, k); }
        // a Sapper walks to a closed rift to open it again
        if (F.closedSpots?.length && cap > 0) { const [s] = egLegionRaise(F, [EG_KIND.sapper], [[standing[0].x, standing[0].z]], now, out, { wave: F.waveNo }); if (s) s.goal = F.closedSpots[0]; }
      }
    }
  } else if (kind === 'rampart') {
    if (v === 'gauntlet') {
      for (const g of F.gauntlet) {
        if (g.done) continue;
        const pl = g.p.plate, on = pl && here.concat(inHall).some((b) => dist(b.x, b.z, pl[0], pl[1]) <= EG_TOUCH_M);
        if (on) { g.stood = g.stood ? g.stood : now; if (now - g.stood >= EG_SILENCE_MS) { g.done = 1; const c = egBodyById(F, g.i); if (c) egGone(F, [c], EG_GONE.crumbled, '', now, out); out.push({ k: 'esay', w: 'silenced' }); } } else g.stood = 0;
      }
      F.pg.left = F.gauntlet.filter((g) => !g.done).length;
      if (!F.pg.left) { door(B, spec, now, out); return; }
    } else if (v === 'winch') {
      const plates = spec.spots.winch ?? [], need = Math.min(2, F.n);
      const on = inHall.filter((b) => plates.some((p) => dist(b.x, b.z, p.x, p.z) <= EG_TOUCH_M)).length;
      if (on >= need) F.winch += 250;
      F.pg.winch = Math.min(EG_WINCH_MS, F.winch);
      if (F.winch >= EG_WINCH_MS) { door(B, spec, now, out); return; }
    } else if (!egBodiesOf(F, EG_ROLE.add, EG_KIND.bearer).length) { door(B, spec, now, out); return; }
    if (v !== 'gauntlet' && now >= F.waveAt) {
      F.waveAt = now + EG_MARCH_EVERY_MS;
      const k = egWaveSize(F.n), spots = [];
      for (let i = 0; i < k; i++) spots.push([(i - (k - 1) / 2) * 1.4, spec.gate.z - 8 - (i % 2) * 1.5]);
      wave(spots, k);
      // a Breaker across from a bastion's side
      const bast = spec.discs.filter((d) => d.role === 'bastion');
      if (bast.length && cap > 1) { const d = bast[Math.floor(rng() * bast.length)]; egLegionRaise(F, [EG_KIND.breaker], [[d.x, d.z]], now, out, { wave: F.waveNo }); }
    }
  } else if (kind === 'athenaeum') {
    F.pg.st = [...F.lock.st]; F.pg.f = F.lock.f; F.pg.lit = F.lock.lit ?? 0;
    if (F.lock.ok) {
      if (F.turns <= F.best) { for (const [, m] of living(B)) m.athFree = 1; out.push({ k: 'esay', w: 'orrerytrue' }); }
      door(B, spec, now, out); return;
    }
    if (now >= F.waveAt) { F.waveAt = now + EG_LOCK_EVERY_MS; const k = Math.ceil(F.n / 4); wave(ringSpots(spec, spec.fight.x, spec.fight.z, spec.fight.r - 3, k, rng), k); }
  } else if (kind === 'proving' || (kind === 'deepway' && F.chamber === 1)) {
    if (egLordsFell(F)) { if (kind === 'deepway') F.chamberDone = 1; else { door(B, spec, now, out); return; } }
  } else if (kind === 'deepway' && F.chamber === 2) {
    const e = egObjsOf(F, 'engine')[0];
    if (e && here.some((b) => dist(b.x, b.z, e.x, e.z) <= 3)) F.engineHeld += 250;
    F.pg.hold = Math.min(EG_ENGINE_HOLD_MS, F.engineHeld);
    if (F.engineHeld >= EG_ENGINE_HOLD_MS) F.chamberDone = 1;
    if (!F.chamberDone && now >= F.waveAt && e) { F.waveAt = now + egWaveEveryMs(F.c); wave(ringSpots(spec, e.x, e.z, 10, egWaveSize(F.n), rng)); }
  } else if (kind === 'scriptorium') {
    F.pg.quiet = Math.max(0, F.quietUntil - now);
    if (now >= F.quietUntil) { door(B, spec, now, out); return; }
  } else if (kind === 'court') {
    const lords = egLordsOf(F);
    if (egLordsFell(F)) { redoubt(B, now, rng, out); return; }
    if (!egLordsAwake(F)) {
      const inRing = inHall.filter((b) => dist(b.x, b.z, spec.ring.x, spec.ring.z) <= spec.ring.r);
      if (inRing.length && !F.ringAt) F.ringAt = now;
      if ((inRing.length && inRing.length === inHall.length) || (F.ringAt && now >= F.ringAt + EG_WAKE_RING_MS)) { egLordsWake(F, spec, now, out, lordCtx); F.waveAt = now + EG_ESCORT_EVERY_MS; F.lordAt = now; }
    } else {
      if (now >= F.waveAt) {
        F.waveAt = now + EG_ESCORT_EVERY_MS;
        const L0 = lords[0];
        if (L0) {
          wave(ringSpots(spec, L0.x, L0.z, 12, egWaveSize(F.n), rng));
          // a Sapper for the lord - none in its first phase under Severance
          if (!(F.sever && L0.ph === 1) && cap > 0) { const [s] = egLegionRaise(F, [EG_KIND.sapper], ringSpots(spec, L0.x, L0.z, 16, 1, rng), now, out, { wave: F.waveNo }); if (s) s.lordGoal = L0.i; }
        }
      }
    }
    const said0 = out.length;
    egLordsStep(F, spec, now, here, rng, out, lordCtx);
    tallySays(F, out, said0);
  }
  if (kind !== 'court' && egLordsOf(F).length) egLordsStep(F, spec, now, here, rng, out, lordCtx);
  if (kind === 'deepway' && F.chamberDone && !F.saidDone) { F.saidDone = 1; out.push({ k: 'esay', w: 'chamberdone' }); }
  if (kind === 'deepway' && F.chamberDone && doorOpener(B, spec, inHall)) { door(B, spec, now, out); return; }   // EG-H1: a fair arrival
  if (F.captive && !egObjsOf(F, 'chain').length) { F.captive = 0; for (const [sub, m] of living(B)) { egGive(m, 'cant', 1, rng); out.push({ k: 'egot', to: sub, w: 'cant' }); } out.push({ k: 'esay', w: 'freed' }); }
  hazards(B, F, spec, now, here, rng, out);
  egLegionStep(F, spec, now, here, rng, out, legionCtx);
  egBlowsStep(F, spec, now, here, out, watchOf(B));   // EG-H1: Watchfire's company told each committed blow early
  // the census: where a landing found a member's pose (section 21's measure - the struck member's own machine resolves it)
  for (const bl of F.blows) if (!bl.counted && now >= bl.at) { bl.counted = 1; for (const m of egStruck(bl, here)) { const mm = B.mem[m.sub]; if (mm) mm.struck = (mm.struck ?? 0) + 1; if (bl.o && egLordsOf(F).some((L) => L.i === bl.o) && mm) mm.lordLandedAt = now; } }
  egMovesOut(F, out);
  egHpOut(F, now, out);
  if (F.mem.txDirty) { F.mem.txDirty = 0; egTethersOut(F, out); }
  if (F.mem.mkDirty) { F.mem.mkDirty = 0; egMarksOut(F, out); }
  if (now - F.stateAt >= EG_STATE_EVERY_MS) { F.stateAt = now; out.push(egFightState(F, now)); }
}
/** The hall's own hazards under the decrees: Ashfall's meteors, Wellhead Sparks, Hunting Pack's waves, Soul-Pools' heal,
 *  the Wellhead Erupts' vents. */
function hazards(B, F, spec, now, here, rng, out) {
  const D = F.D ?? {};
  if (D.ashfall && now >= F.ashAt && here.length) {
    F.ashAt = now + (D.ashfall >= 2 ? 8000 : 12_000);
    const m = here[Math.floor(rng() * here.length)];
    egAim(F, spec, { o: 0, s: [shDisc(m.x, m.z, 4)], at: now + 1800, wu: 1800, p: 0.15, b: 4, el: 'fire', nm: 'Ashfall' }, here, now, out);
  }
  if (D.sparks && now >= F.sparkAt) {
    F.sparkAt = now + 20_000;
    const k = D.sparks >= 2 ? F.n : Math.ceil(F.n / 2);
    for (const [x, z] of ringSpots(spec, spec.fight.x, spec.fight.z, spec.fight.r * 0.6, k, rng)) { const o = egRaiseObj(F, 'spark', x, z, 1, now, out, { r: 0.6 }); if (o) o.burst = now + 8000; }
  }
  for (const o of egObjsOf(F, 'spark')) if (now >= o.burst) { egGone(F, [o], EG_GONE.crumbled, '', now, out); egAim(F, spec, { o: 0, s: [shDisc(o.x, o.z, 2.5)], at: now + 1200, wu: 1200, p: 0.15, b: 4, el: 'shock', nm: 'Spark' }, here, now, out); }
  if (D.pack && now >= F.packAt && spec.fight) {
    F.packAt = now + (D.pack >= 2 ? 20_000 : 30_000);
    const spots = ringSpots(spec, spec.fight.x, spec.fight.z, spec.fight.r - 2, egWaveSize(F.n), rng);
    egLegionRaise(F, spots.map(() => EG_KIND.harrier), spots, now, out, { wave: 900 + (F.waveNo ?? 0) });
  }
  if (D.soulpools) for (const z of (F.zones ?? []).filter((q) => q.kind === 'soul' && q.until > now)) {
    const s = z.s, holds = (x, zz) => Math.hypot(x - s[1], zz - s[2]) <= s[3];
    if (here.some((m) => holds(m.x, m.z))) continue;
    for (const a of egBodiesOf(F, EG_ROLE.add)) if (holds(a.x, a.z)) a.hp = Math.min(a.max, a.hp + a.max * 0.0075);
  }
  if (B.tide === 'erupts' && spec.kind === 'court' && now >= (F.ventAt ?? 0) && here.length) {
    F.ventAt = now + 9000;
    const m = here[Math.floor(rng() * here.length)];
    egAim(F, spec, { o: 0, s: [shDisc(m.x + (rng() - 0.5) * 6, m.z + (rng() - 0.5) * 6, 3)], at: now + 1500, wu: 1500, p: 0.2, b: 4, el: 'fire', nm: 'Wellhead Vent' }, here, now, out);
  }
}
/** A Sapper's objective: its lord (to heal it), a closed rift (to open it at a third), a Wellspring's broken anchor. */
function sapperGoal(F, spec, a) {
  if (a.lordGoal) { const L = egBodyById(F, a.lordGoal); return L ? [L.x, L.z, L.r + 0.6] : null; }
  if (a.goal) return [a.goal[0], a.goal[1], 1.6];
  const broken = F.brokenAnchors?.[0];
  return broken ? [broken[0], broken[1], 1.6] : null;
}
function sapperReach(F, spec, a, now, out) {
  egGone(F, [a], EG_GONE.fed, '', now, out);
  if (a.lordGoal) { const L = egBodyById(F, a.lordGoal); if (L) { L.hp = Math.min(L.max, L.hp + L.max * 0.02); out.push({ k: 'esay', w: 'sapperfed' }); } return; }
  if (a.goal) { F.closedSpots = (F.closedSpots ?? []).filter((q) => q !== a.goal); egRaiseObj(F, 'rift', a.goal[0], a.goal[1], egHpTeam(F, EG_RIFT_TEAM_S, 5) / 3, now, out, { r: 1.3 }); out.push({ k: 'esay', w: 'reopened' }); return; }
  const b = F.brokenAnchors?.shift();
  if (b) { egRaiseObj(F, 'anchor', b[0], b[1], Math.round(egHpTeam(F, EG_ANCHOR_S) / 3), now, out, { r: 0.9 }); out.push({ k: 'esay', w: 'relit' }); }
}
/** A rift closed (by the company or the Deserter): its lumen, its place remembered for a Sapper. */
function riftClosed(B, F, spec, o, name, now, out) {
  egObjBroken(F, spec, o, name, now, out);
  F.closed = (F.closed ?? 0) + 1;
  (F.closedSpots ??= []).push([o.x, o.z]);
  for (const [, m] of living(B)) m.lumen = (m.lumen ?? 0) + EG_LUMEN_RIFT;
}

/**
 * A MEMBER'S BLOW (`m` the wire's `hit` - `{i, q, d, r}` on body `i`), from where its own pose stands (`pose` - the
 * Spire's frame `{sx, z}`): only in a trial, from a living member, in the hall; the gate's hand and purse (the bucket
 * grown by the member's declared Vestiges), times the lord's own weight (a stun, a flank, a ward) and the relay's
 * Vestiges (Long Sight, Culling Edge, the Standard, Fallen's Due, a marked foe, Counterstroke), capped. Answers the
 * frames.
 */
export function egBlow(B, sub, m, pose, now) {
  const out = [];
  const mm = B.mem[sub], F = B.F;
  if (!mm || !mm.in || !mm.alive || mm.home || B.sg !== 'trial' || !F || !pose || m.k !== 'hit') return out;
  const spec = specOf(B), p = local(spec, { sub, sx: pose.sx, z: pose.z, dead: false });
  if (!p || egFairRefuses(fairOfMember(B, sub), now)) return out;   // EG-H1: a second break of the fair trail in a hall refuses its hits a while
  const body = egBodyById(F, m.i);
  if (!body) return out;
  const here = Object.entries(B.mem).filter(([, x]) => x.alive && x.in && x.pose).map(([s, x]) => ({ sub: s, x: x.pose.x, z: x.pose.z }));
  mm.pose = p;
  const vx = egVestigeX(B, sub, p, body, m.r, now, here);
  let mult = vx.x;
  if (body.role === EG_ROLE.lord) mult *= egLordHitX(F, body, sub, p, m.r, now);
  if (body.role === EG_ROLE.add && egHas(body, EG_FL.shielded) && (body.shield ?? 0) > 0 && !egFromBehind(body, p.x, p.z)) mult = 0;
  if (body.role === EG_ROLE.obj && body.t === 'heart' && egHas(body, EG_FL.ward)) mult = 0;
  if (body.role === EG_ROLE.add && body.k === EG_KIND.binder && body.cast) body.cast.dmg += m.d;
  const r = egHitBody(F, spec, mm, m.i, m.d, m.r, p, now, m.q, mult, vx.bx);
  const got = r.got;
  // a Shielded elite (section 8.7): its shield - a quarter of its health - takes the blows from behind first
  if (got && body.role === EG_ROLE.add && (body.shield ?? 0) > 0) { const soak = Math.min(body.shield, got); body.shield -= soak; body.hp += soak; if (body.shield <= 0) egSetFl(F, body, EG_FL.shielded, false, out); }
  if (!got || !r.b) return out;
  mm.dh += got; mm.dc += got;
  if (m.r >= 0 && m.r <= 2) mm.kinds[m.r] = (mm.kinds[m.r] ?? 0) + 1;
  egMarkFoe(mm, body, m.r, now);
  egFadeOn(mm, now);
  const b = r.b, said0 = out.length;
  if (b.role === EG_ROLE.lord) {
    egLordHit(F, spec, b, sub, mm.name, got, p, now, here, out, { threatX: egThreatX(mm) });
    if (b.hp <= 0 && Object.values(B.mem).filter((x) => x.in).length >= 4 && living(B).length === 1) B.loneBeacon = sub;
  } else if (b.role === EG_ROLE.add) {
    if (b.k === EG_KIND.binder && b.cast && b.cast.dmg >= b.cast.max) { b.cast = null; F.pg.raise = null; out.push({ k: 'esay', w: 'raisebroken' }); }
    // Sweeping Arc (relay): a melee blow splashes to adds within 3 m of its target
    const sweep = egVOf(mm.vs, 'sweeping');
    if (sweep && m.r === HIT_KINDS.Melee) for (const a of egBodiesOf(F, EG_ROLE.add)) if (a !== b && !egHas(a, EG_FL.friend) && !egHas(a, EG_FL.ward) && dist(a.x, a.z, b.x, b.z) <= 3) { a.hp -= got * sweep; if (a.hp <= 0) addDied(B, F, spec, a, sub, mm, now, here, out); }
    if (b.hp <= 0) addDied(B, F, spec, b, sub, mm, now, here, out);
  } else if (b.role === EG_ROLE.obj && b.hp <= 0) {
    if (b.t === 'fwall') { egGone(F, [b], EG_GONE.slain, mm.name, now, out); if (F.alc) F.alc[b.alc] = 1; out.push({ k: 'esay', w: 'seam', n: mm.name }); }   // LAYER THREE: a false wall falls - its alcove open
    else if (b.t === 'rift') { riftClosed(B, F, spec, b, mm.name, now, out); F.coClosed = (F.coClosed ?? 0) + 1; }
    else if (b.t === 'anchor') { egObjBroken(F, spec, b, mm.name, now, out); (F.brokenAnchors ??= []).push([b.x, b.z]); }
    else egObjBroken(F, spec, b, mm.name, now, out);
  }
  if (spec.kind === 'court') tallySays(F, out, said0);   // EG-E: a banner broken, a lord stunned - the feats count them
  return out;
}
/** EG-E: a Court's beats counted as they are spoken (its lord's feats read them at its fall - net/egFeats.js). */
function tallySays(F, out, from) {
  if (!F) return;
  for (let k = from; k < out.length; k++) if (out[k]?.k === 'esay') { F.said ??= {}; F.said[out[k].w] = (F.said[out[k].w] ?? 0) + 1; }
}
/** An add slain: its lumen to the slayer, its decrees (net/egLegion.js egAddSlain), its words. */
function addDied(B, F, spec, a, sub, mm, now, here, out) {
  if (!F.bodies.includes(a)) return;
  egGone(F, [a], EG_GONE.slain, mm.name, now, out);
  mm.lumen = (mm.lumen ?? 0) + EG_LUMEN_ADD;
  egAddSlain(F, spec, a, sub, now, here, out, F.legionCtx ?? { decrees: F.D });
}
/** A member's step through the door (`down`): in the closing of hall `h`, from a living member standing at it. Answers
 *  whether it was believed. */
export function egDown(B, sub, h, pose, now) {
  const mm = B.mem[sub];
  if (!mm || !mm.in || !mm.alive || mm.home || B.sg !== 'closing' || h !== B.h || !pose) return false;
  const spec = specOf(B), p = local(spec, { sub, sx: pose.sx, z: pose.z, dead: false });
  if (!p || !egAtDoor(spec, p.x, p.z, 2) || !fairOf(B, sub)) return false;   // EG-H1: a step through the door on a fair trail
  mm.downH = h;
  return true;
}
/**
 * A MEMBER'S OTHER WORDS in the breach: `pick` (a Vestige card), `surplus` (a fourth card or a reroll), `vote` (the
 * company's word), `cant` (a Cantrip used), `buy` (from the Sutler), `lping`/`ping` (a living member's, a witness's),
 * `bequest` (a fallen's Vestige offered to the living), `forsake`, `pz` (an Athenaeum's turn), `use` (an engine). Answers
 * the frames.
 * @param {any} B @param {string} sub @param {any} m @param {{sx: number, z: number}|null} pose @param {number} now @param {() => number} rng
 */
export function egWord(B, sub, m, pose, now, rng) {
  const out = [];
  const mm = B.mem[sub];
  if (!mm || !mm.in || B.end) return out;
  const spec = B.h > 0 ? specOf(B) : null;
  const p = spec && pose ? local(spec, { sub, sx: pose.sx, z: pose.z, dead: false }) : null;
  switch (m.k) {
    case 'pick': if (mm.alive && egPick(B, sub, m.v)) out.push({ k: 'run', r: egRunOf(sub, mm) }, { k: 'offer', to: sub, v: mm.offer ?? [], n: mm.picks ?? 0 }); break;
    case 'surplus': { const o = egSurplus(B, sub, m.use === 1 ? 'reroll' : 'card', rng, B.rd, B.rd % 5 === 0); if (o) out.push(o, egStateOf(B, now)); break; }
    case 'vote': if (egVote(B, sub, m.q, m.y)) { const a = B.asks.find((x) => x.q === m.q); out.push({ k: 'tally', q: m.q, v: Object.values(a.v) }); } break;
    case 'cant': {
      const i = m.i, id = mm.cant?.[i];
      if (!mm.alive || id == null || B.sg === 'rest') break;
      const L0 = B.F ? egLordsOf(B.F)[0] : null;
      if (L0 && (L0.ward > now || egHas(L0, EG_FL.ward))) break;
      mm.cant = mm.cant.filter((_, j) => j !== i);
      const C = EG_CANTRIPS[id];
      if (C.key === 'mending') out.push({ k: 'eheal', p: 0.15, why: 'mending' });
      else if (C.key === 'stillness') B.still = 1;
      else if (C.key === 'severance') B.sever = 1;
      else if (C.key === 'sight' && B.F) B.F.pg.sight = 1;
      out.push({ k: 'esay', w: 'cantrip', n: mm.name, t: C.name }, { k: 'run', r: egRunOf(sub, mm) });
      if (C.key === 'longstep') out.push({ k: 'egot', to: sub, w: 'longstep' });
      break;
    }
    case 'buy': {
      if (!mm.alive || !spec || spec.twist !== 'sutler' || !p) break;
      const at = spec.spots.sutler?.[0];
      if (!at || dist(p.x, p.z, at.x, at.z) > 4) break;
      const got = egBuy(mm, m.i, rng);
      if (got) out.push({ k: 'egot', to: sub, w: got }, { k: 'run', r: egRunOf(sub, mm) });
      break;
    }
    case 'lping': if (mm.alive && now - (mm.pingAt ?? 0) >= 3000) { mm.pingAt = now; out.push({ k: 'eping', s: sub, x: m.x, z: m.z, w: m.w, wit: 0 }); } break;
    case 'ping': if (!mm.alive && now - (mm.pingAt ?? 0) >= 3000) { mm.pingAt = now; out.push({ k: 'eping', s: sub, x: m.x, z: m.z, w: m.w, wit: 1 }); } break;
    case 'bequest': if (!mm.alive && (mm.vs ?? []).some((q) => q[0] === m.v)) mm.bequest = m.v; break;
    case 'forsake': egForsake(B, sub, now, out); break;
    case 'fell': if (mm.alive && B.h > 0) egFall(B, sub, now, out, p); break;
    case 'use': {
      // EG-FULL LAYER THREE: an engine worked (section 11.10) - within 2 m, once in 30 s (the Shelf once)
      const F = B.F, e = (spec?.engines ?? [])[m.i];
      if (!mm.alive || !F?.engCd || B.sg !== 'trial' || !p || !e || dist(p.x, p.z, e.x, e.z) > EG_ENGINE_REACH_M + 0.5) break;
      if (now < (F.engCd[e.i] ?? 0) || F.engUsed[e.i]) break;
      if (engineWork(B, F, spec, e, mm, now, out)) F.engCd[e.i] = now + EG_ENGINE_CD_MS;
      break;
    }   // a death in the Spire, said by the member's own machine (the pose's `dd`'s twin - the death save turned it into a fall there)
    case 'pz': {
      const F = B.F;
      if (!mm.alive || !F?.orrery || B.sg !== 'trial' || !p) break;
      const stone = egObjsOf(F, 'stone').find((o) => o.pt === m.i);
      if (!stone || dist(p.x, p.z, stone.x, stone.z) > 3.5) break;
      const res = orreryJudge(F.orrery, F.lock, F.lockLast, m.i, m.a === -1 ? -1 : 1, now);   // EG-H3 (EG4): the Hour's one judge - the settle and the turn (no rights: a company is one thread)
      if (!res) break;
      F.lock = { st: res.st, f: res.f, ok: res.ok, lit: res.lit }; F.lockLast[m.i] = now; F.turns++;
      if (res.x) { for (const [s2] of living(B)) out.push({ k: 'eheal', p: -0.25, why: 'fray', to: s2 }); F.turns = 0; }
      out.push({ k: 'pz', st: res.st, f: res.f, lit: res.lit, ok: res.ok ? 1 : 0, x: res.x ? 1 : 0, by: mm.name });
      break;
    }
    default: break;
  }
  return out;
}
/** EG-H1: the Watchfire holders among the living (section 15) - each one's lead at its rank and the Long Sight holders it
 *  keeps Far Watch with (net/egBodies.js egTellTo). */
function watchOf(B) {
  const L = living(B).filter(([, m]) => m.pose), out = [];
  for (const [sub, m] of L) {
    const v = egVOf(m.vs, 'watchfire');
    if (!(v > 0)) continue;
    const ls = L.filter(([, m2]) => egVOf(m2.vs, 'longsight') > 0 && egAccordsOf(m.vs, m2.vs).some((A) => A.key === 'farwatch')).map(([, m2]) => [m2.pose.x, m2.pose.z]);
    out.push({ sub, x: m.pose.x, z: m.pose.z, lead: Math.round(v * 1000), ls });
  }
  return out;
}
/**
 * EG-H1 - A MEMBER'S POSE in its breach's room, at its SHARED time `t` (net/egFair.js egPoseShared - the room's every pose):
 * where it stands in the hall's own frame - a ridden pose (`pl`) at its piece's clock position, its offset held to the
 * piece's top (RIDDEN POSES, section 10.8) - fed to THE FAIR TRAIL while the member is in a trial or its closing, from its
 * arrival on this hall (`here`) to its step through the door (`down`): a pose between them belongs to no crossing, and one
 * sent mid-stair to no hall. A fall past EG_VOID_Y under its last support owes the count a cast-back (egCount). Answers the
 * point for the room's shared-time trail (`{x, y, z, h}`), or null (no hall's, a witness's, a member out).
 * @param {any} B @param {string} sub @param {{sx: number, y: number, z: number, pl?: number[]|null, cl?: number}} p @param {number} t
 */
export function egPoseIn(B, sub, p, t) {
  const m = B.mem[sub];
  if (!m || !m.in || !m.alive || m.home || B.end || !(B.h > 0) || B.sg === 'wait' || B.sg === 'rest') return null;
  const spec = specOf(B);
  if (!egInHall(spec, p.sx, p.z, 4)) return null;
  let x = egLocalX(spec, p.sx), y = p.y, z = p.z, ride = false;
  if (Array.isArray(p.pl) && egRideHolds(spec, p.pl)) { const q = egRideAt(spec, p.pl, t / 1000); if (q) { [x, y, z] = q; ride = true; } }
  if ((B.sg === 'trial' || B.sg === 'closing') && m.hereH === B.h && m.downH !== B.h) {
    const k = fairKey(B, m);
    // a trail begins on the arrival plate (or where a recall stood it): a first pose anywhere else is a step the law never
    // saw - a break, so a member who left the plate in the gather's last seconds holds nothing until it stands on an island
    if (m.fair?.k !== k) { m.fair = { ...egFairNew(B.h), k, cbHeld: 0 }; if (!egOnArrive(spec, x, z, 2) && m.roseH !== B.h) { m.fair.brk = 1; m.fair.brks = 1; m.fair.why = 'start'; } }
    const A = m.fair;
    egFairPose(A, spec, { x, y, z, ride, cl: !!p.cl }, t);
    if (spec.fork && z >= spec.fork.z && x >= (spec.fork.lowX + spec.fork.x) / 2) A.road = 1;
    if (egAtDoor(spec, x, z)) egFairCross(A, t, A.road);
    if (A.sup && y < A.sup[2] + EG_VOID_Y) { if (!A.cbHeld) { A.cbHeld = 1; m.cbOwe = (m.cbOwe ?? 0) + 1; } }
    else if (A.sup && A.sup[0] === t) A.cbHeld = 0;
  }
  return { x, y, z, h: B.h };
}
/** EG14, after EG8d (EG-H1 lands it - section 21): THE BODY COUNT IS ENFORCED in `eg:` rooms whatever the gate's BOSS_BODY
 *  line says - the relay's count is the member's one life. The line's depth and pace stay the hub's. */
export const EG_BODY_ENFORCE = true;
/**
 * EG-H1 - THE BODY COUNTED in the Spire (net/bossBody.js; section 21): the hall's blows judged on the living members'
 * shared-time trails (net/bossRef.js judgeShapes), its own hazards at their landing (judgePlace), and each cast-back a
 * pose owed (egPoseIn - a tenth of the whole, never below a quarter), each kept in the member's census (`cs`: blows struck,
 * hazards struck, cast-backs, the thousandths counted) and taken off its count (bodyStruck - a plain blow's share; an
 * element's is seen and never counted). A count at nothing under enforcement is the member's FALL - one life (egFall: the
 * witness, the Memento, the final fall's receipt) - and is told to it (`bd`, `to` it). Answers the frames.
 * @param {any} B @param {number} now @param {Array<{sub: string, tr?: number[][]}>} bodies each living member's trail
 * (`[t, x, y, z, h]` - the hall's frame, shared ms) @param {{depth: number, perS: number}} line @param {boolean} [enforce]
 */
export function egCount(B, now, bodies, line, enforce = EG_BODY_ENFORCE) {
  const out = [];
  if (B.end || !(B.h > 0) || (B.sg !== 'trial' && B.sg !== 'closing')) return out;
  const spec = specOf(B), F = B.F;
  const live = bodies.filter((b) => { const m = B.mem[b.sub]; return m && m.in && m.alive && !m.home; });
  const hits = [...judgeShapes(F, live, now, spec), ...judgePlace(F, spec, B.hw, live, now)];
  for (const b of live) {
    const m = B.mem[b.sub];
    for (; (m.cbOwe ?? 0) > 0; m.cbOwe--) hits.push({ sub: b.sub, share: Math.min(EG_CAST_BACK_LOSS, Math.max(0, (m.bd?.v ?? 1) - EG_CAST_BACK_FLOOR)), i: 0, k: 2 });
  }
  for (const h of hits) {
    const m = B.mem[h.sub];
    if (!m?.alive) continue;
    const cs = (m.cs ??= [0, 0, 0, 0]);
    cs[h.k]++; cs[3] += Math.round(h.share * 1000);
    if (!(h.share > 0) || !bodyStruck(m, h.share, now, line) || !enforce) continue;
    const tr = live.find((b) => b.sub === h.sub)?.tr, at = tr?.length ? tr[tr.length - 1] : null;
    egFall(B, h.sub, now, out, at && at[4] === B.h ? { x: at[1], z: at[3] } : null);
    out.push({ k: 'bd', to: h.sub });
  }
  return out;
}
/**
 * EG-H1 - THE ROOM'S OWN HEALS ON THE COUNT (section 21's census: what the relay heals it restores, so no holder drains its
 * budget or skews the measure): a rest's whole heal stands each living member's count whole (bodyLife), a share heals it
 * (bodyHealed - a Rally, a Mending, a niche), the fray's lash takes its share and never the last of it, and a recall's word
 * (`rise`) stands its member at its share - a new life. The frames the room fans, read; the counts moved in place.
 * @param {any} B @param {any[]} frames @param {number} now @param {{depth: number, perS: number}} line @param {boolean} [enforce]
 */
export function egCountHeals(B, frames, now, line, enforce = EG_BODY_ENFORCE) {
  for (const f of frames) {
    if (f.k === 'rise' && B.mem[f.s]) { const m = B.mem[f.s]; bodyLife(m, now, line); m.bd.v = Math.max(0.01, Math.min(1, f.p)); continue; }
    if (f.k !== 'eheal' || !Number.isFinite(f.p)) continue;
    for (const [sub, m] of living(B)) {
      if (f.to && f.to !== sub) continue;
      if (f.why === 'rest' && f.p >= 1) bodyLife(m, now, line);
      else if (f.p > 0) bodyHealed(m, f.p, now, line, { enforce });
      else if (f.p < 0 && m.bd) m.bd.v = Math.max(0.01, m.bd.v + f.p);   // the lash: a setback, never a death
    }
  }
}
/** EG-H1 - A MEMBER'S OWN WORD OF ITS BODY (`vt`, thousandths - net/bossBody.js bodySaid, INT15's pace): a mend it claims
 *  believed out of its budget; from a member the breach does not count alive, not heard. */
export function egBodyWord(B, sub, v, now, line, enforce = EG_BODY_ENFORCE) {
  const m = B.mem[sub];
  if (!m || !m.in || !m.alive || m.home || B.end) return false;
  return bodySaid(m, v / 1000, now, line, { enforce });
}
/** Is the breach still running at `now` (its room's beat wanted)? */
export const egLive = (B, now) => !!B && !B.end && now < B.op + EG_LAST_WORD_MS;

// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md section 23) and EG-FULL (2026-10-11,
// Mac: "I said I want everything"): WHAT THE CLIENT HOLDS OF AN ELITE BREACH - the hub's call and the breach room's words
// (net/wire.js validEgOut) folded into one state:
//   the call (who opened it, its seed, its company, when it opens);
//   the breach (its hall and stage, THE COUNT, the company's lives and witnesses, the Redoubts, the decrees in force -
//     the Proclamation, the Wager, the tide, the strata -, each member's run, the cache's kind, the Mementos lying, the
//     respite and the Surplus, the company's word open, the end);
//   the hall's fight in the Spire's own words (net/egBodies.js): its bodies (the lords and champions, the legion, the
//     errands' objects) each with its walk, its blows (FULL shape stamps), its zones, tethers and marks, its progress, the
//     place's gusts and darkness, the beats said;
//   what is the member's alone: their Vestige offer, what they were given, a recall's word.
//
// PURE in its fold (`foldEg`); the link around it keeps the state, hands each receipt on and says a refusal once.
//
// Not a DFU member. Ledger A (ELITE-GATES).

/** A fight before anything is heard. */
export const EG_FIGHT_EMPTY = Object.freeze({ h: 0, wk: 0, bodies: Object.freeze([]), blows: Object.freeze([]), zones: Object.freeze([]), tx: Object.freeze([]), mk: Object.freeze([]), pg: Object.freeze({}), gust: null, dark: 0, rail: 0, says: Object.freeze([]), fells: Object.freeze([]), gone: Object.freeze([]), phases: Object.freeze([]) });
/** The state before anything is heard. */
export const EG_STATE_EMPTY = Object.freeze({
  call: null, b: null, seed: 0, egv: 0, op: 0, wk: 0, h: 0, sg: 'wait', sa: 0, su: 0, cl: 0, ca: 0, hw: 0, dn: 0,
  co: Object.freeze([]), rd: 0, rh: 0, dg: 0, end: null,
  dc: Object.freeze([]), pr: '', wg: Object.freeze([]), td: '', sr: Object.freeze([]), geo: 0, ms: Object.freeze([]), ca2: '', mm: Object.freeze([]), rp: 0, sp: 0, as: Object.freeze([]),
  fight: EG_FIGHT_EMPTY, offer: null, tally: Object.freeze({}), asked: Object.freeze({}), got: Object.freeze([]), rises: Object.freeze([]), pings: Object.freeze([]), heals: Object.freeze([]), pz: null,
  falls: Object.freeze([]), redoubt: null, no: null, heardAt: 0,
});
/** How many falls, beats, gifts and pings the state keeps for the screen to say. */
export const EG_FALLS_KEPT = 8;
export const EG_SAYS_KEPT = 12;
export const EG_GONE_KEPT = 48;
const stageOf = (w) => ({ h: w.h, sg: w.sg, sa: w.sa, su: w.su, cl: w.cl, ca: w.ca, hw: w.hw, dn: w.dn });
/** A body as the state keeps it, from its wire array `[i, role, k, pt, x, z, hp, max, fl, tx, tz, v, at]`. */
export const egBodyOf = (t, now) => ({ i: t[0], role: t[1], k: t[2], pt: t[3], x: t[4], z: t[5], hp: t[6], max: t[7], fl: t[8], mv: t[11] > 0 ? { x: t[4], z: t[5], tx: t[9], tz: t[10], v: t[11], at: t[12] } : null, born: now });
/** Where a body stands at `now` - its walk carried from its word (net/egBodies.js egBodyAt's law). */
export function egBodyPlace(b, now) {
  const m = b?.mv;
  if (!m || !(m.v > 0)) return [b.x, b.z];
  const len = Math.hypot(m.tx - m.x, m.tz - m.z);
  if (len < 1e-6) return [m.tx, m.tz];
  const along = Math.min(len, (Math.max(0, now - m.at) / 1000) * m.v);
  return [m.x + ((m.tx - m.x) / len) * along, m.z + ((m.tz - m.z) / len) * along];
}
const keepLast = (list, item, n) => [...list, item].slice(-n);

/** One fight word folded (pure). */
function foldFight(f, w, now) {
  switch (w.k) {
    case 'efs': return { ...EG_FIGHT_EMPTY, h: w.h, wk: w.wk, bodies: w.b.map((t) => egBodyOf(t, now)), blows: w.bl, tx: w.tx, mk: w.mk, pg: w.pg, zones: f.h === w.h ? f.zones : [], says: f.h === w.h ? f.says : [], gone: f.h === w.h ? f.gone : [], fells: f.h === w.h ? f.fells : [], phases: f.h === w.h ? f.phases : [], gust: f.gust, dark: f.dark, rail: f.rail };
    case 'ead': { const had = new Set(f.bodies.map((b) => b.i)); return { ...f, bodies: [...f.bodies, ...w.a.filter((t) => !had.has(t[0])).map((t) => egBodyOf(t, now))] }; }
    case 'emv': {
      const by = new Map(w.m.map((t) => [t[0], t]));
      return { ...f, bodies: f.bodies.map((b) => { const t = by.get(b.i); return t ? { ...b, x: t[1], z: t[2], mv: t[5] > 0 ? { x: t[1], z: t[2], tx: t[3], tz: t[4], v: t[5], at: t[6] } : null } : b; }) };
    }
    case 'ehp': { const by = new Map(w.h.map((t) => [t[0], t[1]])); return { ...f, bodies: f.bodies.map((b) => (by.has(b.i) ? { ...b, hp: by.get(b.i), hurtAt: by.get(b.i) < b.hp ? now : b.hurtAt } : b)) }; }
    case 'edie': {
      const gone = f.bodies.filter((b) => w.is.includes(b.i)).map((b) => ({ ...b, goneAt: w.at, w: w.w, n: w.n }));
      return { ...f, bodies: f.bodies.filter((b) => !w.is.includes(b.i)), gone: [...f.gone, ...gone].slice(-EG_GONE_KEPT), tx: f.tx.filter((t) => !w.is.includes(t[0]) && !w.is.includes(t[1])) };
    }
    case 'efl': return { ...f, bodies: f.bodies.map((b) => (b.i === w.i ? { ...b, fl: w.fl } : b)) };
    case 'eb': return { ...f, blows: [...f.blows.filter((b) => b.i !== w.i && now <= b.at + Math.max(1, b.sp) + 1500), { ...w, heard: now }].slice(-40) };
    case 'ecut': return { ...f, blows: f.blows.map((b) => (b.i === w.i ? { ...b, cut: now } : b)) };
    case 'etx': return { ...f, tx: w.t };
    case 'emk': return { ...f, mk: w.m };
    case 'eph': return { ...f, bodies: f.bodies.map((b) => (b.i === w.i ? { ...b, ph: w.ph } : b)), phases: keepLast(f.phases, { i: w.i, ph: w.ph, at: now }, 6) };
    case 'efell': return { ...f, bodies: f.bodies.map((b) => (b.i === w.i ? { ...b, fellAt: w.at, hp: 0 } : b)), fells: keepLast(f.fells, { i: w.i, at: w.at, n: w.n }, 6) };
    case 'eob': return { ...f, bodies: f.bodies.map((b) => (b.i === w.i ? { ...b, st: w.st, stAt: w.at } : b)) };
    case 'ez': return { ...f, zones: [...f.zones.filter((z) => z.i !== w.i && z.until > now - 2000), w].slice(-32) };
    case 'esay': return { ...f, says: keepLast(f.says, { ...w, at: now }, EG_SAYS_KEPT) };
    case 'egust': return { ...f, gust: w };
    case 'edark': return { ...f, dark: w.until };
    case 'erail': return { ...f, rail: w.until };
    default: return f;
  }
}
const FIGHT_WORDS = new Set(['efs', 'ead', 'emv', 'ehp', 'edie', 'efl', 'eb', 'ecut', 'etx', 'emk', 'eph', 'efell', 'eob', 'ez', 'esay', 'egust', 'edark', 'erail']);

/**
 * One word folded into the breach's state (pure). A word of another breach than the one held is not this one's - a call
 * starts a breach's state over, a room's `st` replaces it.
 * @param {any} s @param {any} w a validEgOut projection @param {number} now
 */
export function foldEg(s, w, now) {
  if (!w) return s;
  if (FIGHT_WORDS.has(w.k)) {
    if (w.k !== 'efs' && w.k !== 'esay' && s.fight.h && s.fight.h !== s.h) return { ...s, fight: foldFight(EG_FIGHT_EMPTY, w, now), heardAt: now };
    return { ...s, fight: foldFight(s.fight, w, now), heardAt: now };
  }
  switch (w.k) {
    case 'call': return s.b === w.b ? { ...s, call: w, heardAt: now } : { ...EG_STATE_EMPTY, call: w, b: w.b, seed: w.seed, op: w.op, rh: w.rh, heardAt: now };
    case 'st': {
      const same = s.b === w.b;
      return { ...(same ? s : EG_STATE_EMPTY), call: same ? s.call : null, b: w.b, seed: w.seed, egv: w.egv, op: w.op, wk: w.wk, ...stageOf(w), co: w.co, rd: w.rd, rh: w.rh, dg: w.dg, end: w.end,
        dc: w.dc, pr: w.pr, wg: w.wg, td: w.td, sr: w.sr, geo: w.geo, ms: w.ms, ca2: w.ca2, mm: w.mm, rp: w.rp, sp: w.sp, as: w.as,
        fight: same && s.fight.h === w.h ? s.fight : EG_FIGHT_EMPTY, heardAt: now };
    }
    case 'sg': return { ...s, ...stageOf(w), fight: w.h === s.fight.h ? s.fight : EG_FIGHT_EMPTY, offer: w.sg === 'rest' ? s.offer : null, heardAt: now };
    case 'co': return { ...s, co: w.co, heardAt: now };
    case 'fall': return { ...s, falls: keepLast(s.falls, { s: w.s, n: w.n, at: w.at, fin: w.fin }, EG_FALLS_KEPT), heardAt: now };
    case 'rd': return { ...s, rd: w.w, redoubt: { w: w.w, h: w.h, at: w.at, cl: w.cl, g: w.g, v: w.v, cov: w.cov }, heardAt: now };
    case 'end': return { ...s, end: w.why, sg: 'end', offer: null, as: [], heardAt: now };
    case 'no': return { ...s, no: w.m, heardAt: now };
    case 'offer': return { ...s, offer: w.v.length && w.n > 0 ? { v: w.v, n: w.n, at: now } : null, heardAt: now };
    case 'ask': return { ...s, as: [...s.as.filter((a) => a[0] !== w.q), [w.q, w.o, w.until]], heardAt: now };
    case 'asked': return { ...s, as: s.as.filter((a) => a[0] !== w.q), asked: { ...s.asked, [w.q]: w.r }, heardAt: now };
    case 'tally': return { ...s, tally: { ...s.tally, [w.q]: w.v }, heardAt: now };
    case 'egot': return { ...s, got: keepLast(s.got, { w: w.w, at: now }, 8), heardAt: now };
    case 'run': return { ...s, ms: [...s.ms.filter((r) => r[0] !== w.r[0]), w.r], heardAt: now };
    case 'rise': return { ...s, rises: keepLast(s.rises, { ...w, at: now }, 4), heardAt: now };
    case 'eping': return { ...s, pings: keepLast(s.pings.filter((p) => now - p.at < 6000), { ...w, at: now }, 16), heardAt: now };
    case 'eheal': return { ...s, heals: keepLast(s.heals, { p: w.p, why: w.why, at: now }, 6), heardAt: now };
    case 'pz': return { ...s, pz: { ...w, at: now }, fight: { ...s.fight, pg: { ...s.fight.pg, st: w.st, f: w.f, lit: w.lit } }, heardAt: now };
    case 'rcpt': return s;
    default: return s;
  }
}
/** THE COUNT at `now` (the relay's clock): what was left when it last began to run, less the time since - or, held,
 *  what is left. */
export const egCountAt = (s, now) => (s.ca > 0 ? Math.max(0, s.cl - Math.max(0, now - s.ca)) : s.cl);
/** The company's row for an account, or null: `{ sub, name, n, alive, home, in, wit, forsaken, falls, recall }`. */
export function egMemberOf(s, sub) {
  const t = s.co.find((c) => c[0] === sub);
  return t ? { sub: t[0], name: t[1], n: t[2], alive: t[3] === 1, home: t[4] === 1, in: t[5] === 1, wit: t[6] === 1, forsaken: t[7] === 1, falls: t[8] ?? 0, recall: t[9] === 1 } : null;
}
/** A member's run (`{ rel, lumen, shards, tonics, cant, vs, mast }`), or an empty one. */
export function egRunOfMember(s, sub) {
  const r = s.ms.find((x) => x[0] === sub);
  return r ? { rel: r[1], lumen: r[2], shards: r[3], tonics: r[4], cant: r[5], vs: r[6], mast: r[7] } : { rel: 0, lumen: 0, shards: 0, tonics: 0, cant: [], vs: [], mast: -1 };
}
/** How many of the company live and have entered, and how many have entered at all. */
export const egLivingCount = (s) => s.co.filter((c) => c[3] === 1 && c[4] === 0 && c[5] === 1).length;

/**
 * THE LINK: `word(w)` folds a word (a receipt handed on to `onReceipt`, a refusal said once), `state()`, `now()` (the
 * relay's clock), `clear()` (out of the breach: the state forgotten, the call kept while it stands).
 * @param {{ now: () => number, say?: (text: string) => void, onReceipt?: (r: string) => void, onRefused?: (word: string) => void }} deps
 */
export function createEgLink({ now, say = () => {}, onReceipt = () => {}, onRefused = () => {} }) {
  let s = EG_STATE_EMPTY;
  return {
    word(w) {
      if (!w) return;
      if (w.k === 'rcpt') { onReceipt(w.r); return; }
      s = foldEg(s, w, now());
      if (w.k === 'no') { onRefused(w.m); say(w.m.charAt(0).toUpperCase() + w.m.slice(1) + '.'); }
    },
    state: () => /** @type {any} */ (s),
    now,
    /** Out of the breach: everything but a call still standing forgotten. */
    clear() { s = s.call ? { ...EG_STATE_EMPTY, call: s.call, b: s.call.b, seed: s.call.seed, op: s.call.op, rh: s.call.rh } : EG_STATE_EMPTY; },
    /** The call forgotten too (its window over, or the breach ended). */
    forget() { s = EG_STATE_EMPTY; },
  };
}

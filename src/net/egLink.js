// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md section 23): WHAT THE CLIENT HOLDS OF AN
// ELITE BREACH - the hub's call and the breach room's words (net/wire.js validEgOut) folded into one state: the call
// (who opened it, its seed, its company, when it opens), the breach (its hall and stage, THE COUNT, the company's lives,
// the Redoubts, the end) and the hall's fight as the gate's own state (net/gateLink.js foldGate - the champion or the
// lord, the legion, the rifts as the Reckoning's crystals), so the gate's own client pieces draw and judge it.
//
// PURE in its fold (`foldEg`); the link around it keeps the state, hands each receipt on and says a refusal once.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { foldGate, GATE_STATE_EMPTY } from './gateLink.js';
import { bossPlace } from '../world/gateBoss.js';

/** The state before anything is heard. */
export const EG_STATE_EMPTY = Object.freeze({
  call: null, b: null, seed: 0, egv: 0, op: 0, wk: 0, h: 0, sg: 'wait', sa: 0, su: 0, cl: 0, ca: 0, hw: 0, dn: 0,
  co: Object.freeze([]), rd: 0, rh: 0, dg: 0, end: null, fight: GATE_STATE_EMPTY, falls: Object.freeze([]), redoubt: null, no: null, heardAt: 0,
});
/** How many falls the state keeps for the screen to say. */
export const EG_FALLS_KEPT = 8;
const stageOf = (w) => ({ h: w.h, sg: w.sg, sa: w.sa, su: w.su, cl: w.cl, ca: w.ca, hw: w.hw, dn: w.dn });

/**
 * One word folded into the breach's state (pure). A word of another breach than the one held is not this one's - a call
 * starts a breach's state over, a room's `st` replaces it.
 * @param {any} s @param {any} w a validEgOut projection @param {number} now
 */
export function foldEg(s, w, now) {
  if (!w) return s;
  switch (w.k) {
    case 'call': return s.b === w.b ? { ...s, call: w, heardAt: now } : { ...EG_STATE_EMPTY, call: w, b: w.b, seed: w.seed, op: w.op, rh: w.rh, heardAt: now };
    case 'st': {
      const same = s.b === w.b;
      return { ...(same ? s : EG_STATE_EMPTY), call: same ? s.call : null, b: w.b, seed: w.seed, egv: w.egv, op: w.op, wk: w.wk, ...stageOf(w), co: w.co, rd: w.rd, rh: w.rh, dg: w.dg, end: w.end,
        fight: same && s.fight.day === w.h ? s.fight : GATE_STATE_EMPTY, heardAt: now };
    }
    case 'sg': return { ...s, ...stageOf(w), fight: w.h === s.fight.day ? s.fight : GATE_STATE_EMPTY, heardAt: now };
    case 'co': return { ...s, co: w.co, heardAt: now };
    case 'fall': return { ...s, falls: [...s.falls, { s: w.s, n: w.n, at: w.at }].slice(-EG_FALLS_KEPT), heardAt: now };
    case 'rd': return { ...s, rd: w.w, redoubt: { w: w.w, h: w.h, at: w.at, cl: w.cl }, heardAt: now };
    case 'end': return { ...s, end: w.why, sg: 'end', heardAt: now };
    case 'no': return { ...s, no: w.m, heardAt: now };
    case 'fst': return { ...s, fight: foldGate(s.fight, { ...w.f, k: 'st' }, now, bossPlace), heardAt: now };
    case 'rcpt': return s;
    default: return { ...s, fight: foldGate(s.fight, w, now, bossPlace), heardAt: now };
  }
}
/** THE COUNT at `now` (the relay's clock): what was left when it last began to run, less the time since - or, held,
 *  what is left. */
export const egCountAt = (s, now) => (s.ca > 0 ? Math.max(0, s.cl - Math.max(0, now - s.ca)) : s.cl);
/** The company's row for an account, or null: `{ sub, name, n, alive, home, in }`. */
export function egMemberOf(s, sub) {
  const t = s.co.find((c) => c[0] === sub);
  return t ? { sub: t[0], name: t[1], n: t[2], alive: t[3] === 1, home: t[4] === 1, in: t[5] === 1 } : null;
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

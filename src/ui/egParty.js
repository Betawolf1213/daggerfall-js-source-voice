// @ts-check
// EG-G1 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md section 27.4): THE PARTY ROWS
// LEARN THE SPIRE - the party panel (ui/partyPanel.js, PARTY8-B's quiet rows) is where the company's state lives, never
// a second row of pips. Each member's row, while I stand in their breach:
//   - their numeral, I to VIII, in Battlemage blue (section 25.2: blue is yours - a numeral over heads and on the rows);
//   - a cracked gold sigil on the portrait once their recall is spent: the company must see who is on their last life;
//   - a grey row with an eye for a witness; an arch for home; a struck-through name for the forsaken;
//   - an amber ring draining the 180 s for an absent body (net/egLaw.js EG_ABSENT_TRIAL_MS) - the room counts a member
//     fallen after three minutes unseen in a trial, and this screen reads the same silence: no pose of theirs in my room
//     (`egAbsentStep`);
//   - their Memento: a gold mote where theirs lies, and on whoever carries one;
//   - the place line reads *High Road* or *Low Road* while the company is split at a fork (`egRoadOf`);
//   - Fire-touched or Frost-touched as its sigil (the marks on members, net/egBodies.js egMarksOut).
// Their health stays the panel's own bar, read off their pose as ever.
//
// The rows are pure (`egPartyRows`); the panel is told them in its own terms - a numeral, the classes, a mark, a title, a
// ring's share, a place line - through its `setSpire` seam (`egPartyDeco`), and repaints only what moved.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { EG_ABSENT_TRIAL_MS } from '../net/egLaw.js';
import { EG_PRES_TEXT } from './egBeats.js';

/** The numerals (section 6.1 - the company's own, I to VIII). */
export const EG_NUMERALS = Object.freeze(['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']);
/** The marks drawn as a member's sigil (net/egBodies.js: 2 Fire-touched, 3 Frost-touched). */
export const EG_ROW_SIGILS = Object.freeze({ 2: 'Fire-touched', 3: 'Frost-touched' });
/** The row's marks: a witness's eye, home's arch, a Memento's mote, the sigils' flame and flake. */
export const EG_ROW_MARKS = Object.freeze({ witness: '◉', home: '∩', memento: '•', 2: '♨', 3: '❄' });
/** How near a step a member stands to be on its road (m). */
export const EG_ROAD_NEAR_M = 6;

/**
 * Who of the company is unseen now (pure): `prev` the instants each went silent, `present` the accounts whose poses
 * this screen holds. A living, entered member who is not me, not home and not forsaken, and has no pose here, keeps the
 * instant they went silent; a pose seen clears it.
 * @param {Map<string, number>} prev @param {any} E @param {string|null} me @param {Set<string>} present @param {number} now
 */
export function egAbsentStep(prev, E, me, present, now) {
  const out = new Map();
  for (const c of E?.co ?? []) {
    const [sub, , , alive, home, inn, wit, forsaken] = c;
    if (sub === me || alive !== 1 || home === 1 || inn !== 1 || wit === 1 || forsaken === 1 || present.has(sub)) continue;
    out.set(sub, prev.get(sub) ?? now);
  }
  return out;
}

/** Which road a place in a hall stands on at its fork: 0 the High Road, 1 the Low Road, null neither (pure). */
export function egRoadOf(spec, x, y, z) {
  if (!spec?.fork) return null;
  let best = null, bd = EG_ROAD_NEAR_M;
  for (const s of [...(spec.steps ?? []), ...(spec.islands ?? [])]) {
    if (s.road !== 0 && s.road !== 1) continue;
    const d = Math.hypot(x - s.x, z - s.z) + Math.abs(y - (s.y ?? 0)) * 0.5;
    if (d < bd) { bd = d; best = s.road; }
  }
  return best;
}

/**
 * THE ROWS (pure): each member's Spire state, by account - `{ n, numeral, state ('alive' | 'fallen' | 'witness' | 'home'
 * | 'forsaken'), recall, cracked, memento, carries, absent ({ left, frac } | null), road, sigils, label }`. `absent` the
 * instants members went silent (egAbsentStep), `roads` each account's road where the company stands split.
 * @param {any} E @param {number} now @param {{ absent?: Map<string, number>, roads?: Map<string, number|null> }} [o]
 */
export function egPartyRows(E, now, { absent = new Map(), roads = new Map() } = {}) {
  const rows = new Map();
  if (!E?.b) return rows;
  const split = new Set([...roads.values()].filter((r) => r === 0 || r === 1)).size > 1;
  const trial = E.sg === 'trial';
  for (const c of E.co ?? []) {
    const [sub, name, n, alive, home, , wit, forsaken, , recall] = c;
    const state = forsaken === 1 ? 'forsaken' : home === 1 ? 'home' : wit === 1 ? 'witness' : alive !== 1 ? 'fallen' : 'alive';
    const since = trial && state === 'alive' ? absent.get(sub) : undefined;
    const left = since != null ? Math.max(0, EG_ABSENT_TRIAL_MS - Math.max(0, now - since)) : 0;
    const road = split ? roads.get(sub) ?? null : null;
    const sigils = [...new Set((E.fight?.mk ?? []).filter((m) => m[0] === sub && m[2] > now && EG_ROW_SIGILS[m[1]]).map((m) => m[1]))];
    const memento = (E.mm ?? []).some((q) => q[0] === sub), carries = (E.mm ?? []).some((q) => q[4] === sub);
    const row = {
      n, numeral: EG_NUMERALS[n] ?? String(n), state, recall: recall === 1, cracked: recall !== 1 && state === 'alive', memento, carries,
      absent: since != null ? { left, frac: Math.round((left / EG_ABSENT_TRIAL_MS) * 1000) / 1000 } : null,
      road: road === 0 ? EG_PRES_TEXT.highRoad : road === 1 ? EG_PRES_TEXT.lowRoad : '',
      sigils: sigils.map((k) => EG_ROW_SIGILS[k]), sigilKeys: sigils, label: '',
    };
    row.label = [`${row.numeral} ${name}`, state === 'alive' ? '' : state, row.cracked ? EG_PRES_TEXT.recallSpent : '', row.absent ? EG_PRES_TEXT.absent(Math.ceil(left / 1000)) : '', row.road, ...row.sigils].filter(Boolean).join(', ');
    rows.set(sub, row);
  }
  return rows;
}

/**
 * The rows in the panel's own terms (pure): by account, `{ num, cls, mark, title, ring, where }` - the numeral, the
 * card's Spire classes, its mark, its title (the screen reader's words), the absent ring's share (null none), and the
 * place line (null: the panel's own).
 * @param {Map<string, any>} rows
 */
export function egPartyDeco(rows) {
  const out = new Map();
  for (const [sub, r] of rows) {
    const cls = [r.state === 'witness' || r.state === 'fallen' ? 'eg-wit' : '', r.state === 'home' ? 'eg-home' : '', r.state === 'forsaken' ? 'eg-forsaken' : '', r.cracked ? 'eg-spent' : '', r.absent ? 'eg-absent' : ''].filter(Boolean).join(' ');
    const marks = [r.state === 'witness' ? EG_ROW_MARKS.witness : '', r.state === 'home' ? EG_ROW_MARKS.home : '', r.memento || r.carries ? EG_ROW_MARKS.memento : '', ...r.sigilKeys.map((k) => EG_ROW_MARKS[k])].join('');
    out.set(sub, { num: r.numeral, cls, mark: marks, title: r.label, ring: r.absent ? r.absent.frac : null, where: r.road || null });
  }
  return out;
}

/** The decorations' sheet - the numeral's blue, the witness's grey, home's arch, the struck name, the cracked sigil on
 *  the portrait and the amber ring about it (conic, drained by `--eg-ring`). Injected with the Spire's HUD. */
export const EG_PARTY_CSS = `
.dfparty-egn { flex: none; font-size: 11px; line-height: 1.2; color: #6f9dff; text-shadow: 2px 2px 0 rgba(0,0,0,0.85); font-variant-numeric: tabular-nums; }
.dfparty-egn:empty, .dfparty-egm:empty { display: none; }
.dfparty-egm { flex: none; font-size: 11px; line-height: 1.2; color: #e8c473; }
.dfparty-card.eg-wit { opacity: .6; filter: grayscale(1); }
.dfparty-card.eg-home .dfparty-name { color: #e8c473; }
.dfparty-card.eg-forsaken { opacity: .5; }
.dfparty-card.eg-forsaken .dfparty-name { text-decoration: line-through; }
.dfparty-face { position: relative; }
.dfparty-egring { position: absolute; inset: -3px; border-radius: 50%; pointer-events: none; display: none;
  background: conic-gradient(#f0a030 calc(var(--eg-ring, 0) * 360deg), transparent 0); -webkit-mask: radial-gradient(closest-side, transparent 78%, #000 80%); mask: radial-gradient(closest-side, transparent 78%, #000 80%); }
.dfparty-card.eg-absent .dfparty-egring { display: block; }
.dfparty-card.eg-spent .dfparty-face::after { content: '\\2726'; position: absolute; right: -3px; bottom: -4px; font-size: 12px; color: #c9a043; text-shadow: 1px 1px 0 #000;
  -webkit-mask: linear-gradient(115deg, #000 46%, transparent 47%, transparent 53%, #000 54%); mask: linear-gradient(115deg, #000 46%, transparent 47%, transparent 53%, #000 54%); }
`;

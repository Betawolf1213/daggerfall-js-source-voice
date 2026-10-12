// @ts-check
// EG-F (2026-10-12, the Elite Gates arc, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections
// 5, 16.6, 18 and 27.7): THE START WINDOW - where in the Spire a Weir Key's breach begins, asked once its refusals are
// past and before any key is staked.
//
//   THE STAKE: "Weir Keys: 3 - one will be staked." (no key: no start to stake, the Rehearsal alone).
//   THE QUEST WARNING: "A quest falls due before the breach can close." - when one of the opener's quests falls due
//     inside the breach's last word (36 game hours).
//   THE CHOICES: Hall 1, and every Redoubt the opener may start at (net/egStartLaw.js egStartsFrom - deepest first), each
//     named with its band ("Redoubt 12 - the Shade Perilous"), each with a tick or a cross for every member of the party
//     (the service's preflight, `/v1/eg/starts`). A start some member cannot make asks once: "Go without Mara?" -
//     no carries: the room refuses their admission there.
//   THE WAGER: up to three decrees of the company's choosing, from three different families (egWagerOf), for the whole
//     breach - a list of its own, each decree with its family, toggled, then Done.
//   THE REHEARSAL: "Rehearse - Halls 1-5, no key", once a real day.
//
// THE NATIVE-WINDOW RULE: on the classic skin every list here is DFU's DaggerfallListPickerWindow (ui/listPicker.js,
// PICK00I0.IMG - the boat's variant picker's precedent, scenes/world.js csaOpenListPicker), and the one question is DFU's
// YesNo box (ui/yesNoBox.js); on the enhanced skin the same picker draws itself in the skin (ui/enhancedPicker.js) and
// the box is the skin's decision card. No free-styled geometry: the rows are text in DFU's own list.
//
// THE HOST'S THREE DOORS (`openList`, `closeList`, `ask`) are the windows; the flow here is pure over them, so the tests
// drive it whole. THE SLOT IS EMPTIED BEFORE THE OCCUPANT IS TOLD: a choice closes the list before it is acted on, and the
// choice is made ONCE however many doors call it.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { EG_TEXT, EG_BANDS, EG_DECREES, egBandOfHall, egStartHall } from '../net/egLaw.js';
import { egMayStart, egWagerOf, egWagerTakes, EG_WAGER_MAX } from '../net/egStartLaw.js';

/** The tick and the cross a member's mark is drawn with (DFU's small font has both). */
export const EG_START_TICK = '+';
export const EG_START_CROSS = 'x';
/** A decree family's words in the Wager's list. */
export const EG_WAGER_FAMILY_WORDS = Object.freeze({ blows: 'the blows', legion: 'the legion', ground: 'the ground', covenant: 'the Covenant', lord: 'the lord' });

/** A start's name: *Hall 1*, or *Redoubt 12 - the Shade Perilous* - the band its first hall stands in (net/egLaw.js
 *  egStartHall's hall). Pure. */
export function egStartName(ew) {
  if (!(Number.isSafeInteger(ew) && ew > 0)) return EG_TEXT.startHall;
  const band = EG_BANDS[egBandOfHall(egStartHall(ew))].name;
  return EG_TEXT.startRedoubt(ew, band.replace(/^The /, 'the '));
}
/** Several names as a line says them: "Mara", "Mara and Ann", "Mara, Ann and Tor". */
export const egNamesText = (names) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/**
 * THE WINDOW'S ROWS: `[{ kind, label, ew?, missing? }]` - the stake ('info'), the quest warning ('info'), each start the
 * opener may make ('start', deepest first, Hall 1 last, its marks a member each in the party's order and the names of
 * those who cannot make it), the Wager ('wager') and the Rehearsal ('rehearse'). Pure.
 * @param {{ keys: number, me: string, members: { sub: string, name: string }[], starts: Record<string, number[]|null>, rehearsal?: boolean,
 *   questDue?: boolean, wager?: number[] }} o
 */
export function egStartRows({ keys, me, members, starts, rehearsal = false, questDue = false, wager = [] }) {
  const rows = [];
  const party = members?.length ? members : [{ sub: me, name: '' }];
  rows.push({ kind: 'info', label: keys > 0 ? EG_TEXT.stake(keys) : EG_TEXT.noKeys });
  if (questDue) rows.push({ kind: 'info', label: EG_TEXT.questDue });
  if (keys > 0) {
    const mine = Array.isArray(starts?.[me]) ? /** @type {number[]} */ (starts[me]) : [0];
    for (const ew of mine.includes(0) ? mine : [...mine, 0]) {
      const can = party.map((m) => Array.isArray(starts?.[m.sub]) && egMayStart(starts[m.sub], ew));
      const marks = party.length > 1 ? ` [${can.map((c) => (c ? EG_START_TICK : EG_START_CROSS)).join('')}]` : '';
      rows.push({ kind: 'start', label: `${egStartName(ew)}${marks}`, ew, missing: party.filter((_, i) => !can[i]).map((m) => m.name || 'a companion') });
    }
    rows.push({ kind: 'wager', label: EG_TEXT.wager(wager.map((id) => EG_DECREES[id]?.name).filter(Boolean).join(', ')) });
  }
  if (rehearsal) rows.push({ kind: 'rehearse', label: EG_TEXT.rehearsal });
  return rows;
}

/** THE WAGER'S ROWS: every decree, a mark on the held, its family's words; then Done. Pure. */
export function egWagerRows(wager = []) {
  const held = new Set(wager);
  return [...EG_DECREES.map((d) => ({ kind: 'decree', id: d.id, label: `${held.has(d.id) ? '* ' : ''}${d.name} - ${EG_WAGER_FAMILY_WORDS[d.fam] ?? d.fam}` })), { kind: 'done', label: EG_TEXT.wagerDone }];
}

/**
 * THE WAGER'S TOGGLE: decree `id` dropped if held, else taken if it may be (egWagerTakes) - answered `{ wager, why }`,
 * `why` the refusal's line (one of a family held; three held). Pure.
 * @param {number[]} wager @param {number} id
 */
export function egWagerToggle(wager, id) {
  if (wager.includes(id)) return { wager: wager.filter((x) => x !== id), why: null };
  if (egWagerTakes(wager, id)) return { wager: /** @type {number[]} */ (egWagerOf([...wager, id])), why: null };
  return { wager, why: wager.length >= EG_WAGER_MAX ? EG_TEXT.wagerFull : EG_TEXT.wagerFamily };
}

/**
 * THE WINDOW, OPENED: the main list (egStartRows) over the host's `openList(labels, onPick, onCancel) -> handle`, the
 * Wager's list in its place when asked, the one question through `ask(lines, onYes, onNo)`, and the choice handed to
 * `onChoose({ ew, wg, rh })` ONCE. Answers `{ close(), state() }`.
 * @param {{ keys: number, me: string, members: { sub: string, name: string }[], starts: Record<string, number[]|null>, rehearsal?: boolean, questDue?: boolean,
 *   openList: (labels: string[], onPick: (i: number) => void, onCancel: () => void) => any, closeList: (handle: any) => void,
 *   ask: (lines: string[], onYes: () => void, onNo: () => void) => void, say?: (text: string) => void,
 *   onChoose: (c: { ew: number, wg: number[], rh: boolean }) => void, onCancel?: () => void }} o
 */
export function openEgStartWindow(o) {
  let wager = [], handle = null, view = 'main', done = false, rows = [];
  const say = o.say ?? (() => {});
  const shut = () => { const h = handle; handle = null; if (h) o.closeList(h); };   // the slot emptied first
  function choose(c) {
    if (done) return;
    done = true;
    shut();
    o.onChoose(c);
  }
  function showMain() {
    view = 'main';
    rows = egStartRows({ ...o, wager });
    handle = o.openList(rows.map((r) => r.label), pickMain, cancel);
  }
  function showWager() {
    view = 'wager';
    rows = egWagerRows(wager);
    handle = o.openList(rows.map((r) => r.label), pickWager, () => { shut(); if (!done) showMain(); });
  }
  function cancel() { if (done) return; done = true; shut(); o.onCancel?.(); }
  function pickMain(i) {
    const r = rows[i];
    if (done || !r) return;
    if (r.kind === 'rehearse') { choose({ ew: 0, wg: [], rh: true }); return; }
    if (r.kind === 'wager') { shut(); showWager(); return; }
    if (r.kind !== 'start') return;   // the stake and the warning are words, not choices
    if (!r.missing.length) { choose({ ew: r.ew, wg: [...wager], rh: false }); return; }
    // asked once: going on without the members who cannot make this start
    shut();
    o.ask([EG_TEXT.without(egNamesText(r.missing))], () => choose({ ew: r.ew, wg: [...wager], rh: false }), () => { if (!done) showMain(); });
  }
  function pickWager(i) {
    const r = rows[i];
    if (done || !r) return;
    shut();
    if (r.kind === 'done') { showMain(); return; }
    const t = egWagerToggle(wager, r.id);
    wager = t.wager;
    if (t.why) say(t.why);
    showWager();
  }
  showMain();
  return {
    close() { if (!done) { done = true; shut(); } },
    state: () => ({ view, wager: [...wager], done, rows: rows.map((r) => r.label) }),
  };
}

// @ts-check
// QL12 (2026-10-19, the owner: "New questlines tying into and introduced the oblivion gates, abyss dungeons, elite
// dungeons and elite breaches"; bible/06-Systems/Questlines-Arc.md section 5.3): THE QUESTLINES' CLAIMS - what the
// account service pays a questline, and what it must hold first. Shared by both ends: the client's line registry
// (systems/questlines/qlLines.js) names its witnessed steps here, and the service's claim (server-account/src/
// questlines.js) pays by it. PURE: no clock, no store.
//
// THE LAW (decision 8): the service pays only what it witnessed. A step done in an endgame place is witnessed by that
// place's receipt, already on the service's own rows - a Dagon's Breach's (`gate_kills`, r1), an Elite Breach's Redoubt
// (`eg_redoubts`, e1), an Hour's (`sd_kills`, h1), the Sea Serpent's (`serpent_kills`, l1) - and only one written AFTER
// the step was opened on the service (`ql_steps.opened_at`): a receipt from before the line asked for it opens nothing.
// The client's own quest moves on the client's own act (qlActs.js) as any quest does; the service's pay waits for its
// row. Nothing a classic quest does reaches this file.
//
// WHAT IT PAYS. A title a questline (decision: one each), on its `titleAt` step; and the Covens' Hoard's Weir Key, once
// an account, to a player who keeps it (`key`). The key is the one pay no receipt witnesses - its lieutenant dies in a
// dungeon no relay sees - so it is held behind the Cycle's first line witnessed whole (`after`), once an account: the
// same bound the Spire's launch gift kept (migration 0124: one key to every account that had closed a breach).
//
// Not a DFU member. Ledger A (QUESTLINES).

/** What a step's witness reads - one receipt table and its test each (server-account/src/questlines.js QL_WITNESS_SQL).
 *  `rite` Dagon's faithful's rite broken (a rite's own receipt, or a fighter's that broke it: two embers);
 *  `breach` a Dagon's Breach closed (a kill, never the rite alone); `redoubt` an Elite Breach's Redoubt taken;
 *  `redoubts3` three of them; `valkynaz` a Valkynaz's Redoubt (every fifth Court - Elite-Gates.md section 13);
 *  `hour` the Brass Remnant broken; `serpent` the Sea Serpent slain. */
export const QL_WITNESS_KINDS = Object.freeze(['rite', 'breach', 'redoubt', 'redoubts3', 'valkynaz', 'hour', 'serpent']);

/** The questlines the service pays, by id: how many steps; which are witnessed and by what; the title and the step that
 *  pays it; the key's step, the choice that keeps it and what must be witnessed first. */
export const QL_SERVICE_LINES = Object.freeze({
  burningDoors: Object.freeze({ steps: 5, witness: Object.freeze({ 2: 'rite', 3: 'breach' }), title: 'doorwarden', titleAt: 3 }),
  covensHoard: Object.freeze({ steps: 3, witness: Object.freeze({}), title: 'covenbane', titleAt: 2, after: Object.freeze(['burningDoors', 3]), key: Object.freeze({ at: 2, choice: 'keep' }) }),
  weirRoad: Object.freeze({ steps: 4, witness: Object.freeze({ 0: 'redoubt', 1: 'redoubts3', 2: 'valkynaz' }), title: 'weirwalker', titleAt: 2 }),
  hourThatWasNot: Object.freeze({ steps: 2, witness: Object.freeze({ 1: 'hour' }), title: 'hourwitness', titleAt: 1 }),
  oldCoil: Object.freeze({ steps: 3, witness: Object.freeze({ 2: 'serpent' }), title: 'satakalwitness', titleAt: 2 }),
});

/** The titles the questlines pay, in the lines' order (the vocabulary's spelling - net/identityToken.js TITLES). */
export const QL_TITLES = Object.freeze(Object.values(QL_SERVICE_LINES).map((l) => l.title));

/** A line's title's bit on the row (`players.ql_titles`), by its place in QL_TITLES. */
export const qlTitleBit = (title) => { const i = QL_TITLES.indexOf(title); return i < 0 ? 0 : 1 << i; };

/** The choices a claim may carry - a word of the line's own (`keep` | `seal`). */
const CHOICE_RE = /^[a-z]{1,16}$/;

/**
 * A claim's body as the wire may carry it, or null: `{ line, step, choice? }` - a line this file names, a step inside
 * it, a choice in plain lower-case. Refuse, never repair.
 * @param {any} body
 * @returns {{ line: string, step: number, choice: string|null } | null}
 */
export function qlClaimOf(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { line, step, choice } = body;
  if (typeof line !== 'string' || !Object.hasOwn(QL_SERVICE_LINES, line)) return null;
  if (!Number.isSafeInteger(step) || step < 0 || step >= QL_SERVICE_LINES[line].steps) return null;
  if (choice !== undefined && choice !== null && (typeof choice !== 'string' || !CHOICE_RE.test(choice))) return null;
  return { line, step, choice: choice ?? null };
}

/** Does the service pay anything at this step (a witness, the title, the key)? A step it pays nothing is never claimed. */
export function qlStepClaimed(line, step) {
  const l = QL_SERVICE_LINES[line];
  if (!l) return false;
  return Object.hasOwn(l.witness, step) || l.titleAt === step || l.key?.at === step;
}

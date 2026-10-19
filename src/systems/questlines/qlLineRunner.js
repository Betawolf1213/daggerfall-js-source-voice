// @ts-check
// QL12-QL16 (bible/06-Systems/Questlines-Arc.md section 4): THE LINES, RUN - made by the layer (qlLayer.js) over the
// machine. A line (qlLines.js) opens when its gate holds; its first step's quest starts; a step that ends well starts
// the next, a step that ends badly is offered again a day later; the last step's outcome is the line's. It never
// decides a quest: each step is a script on the machine like any other, its objectives a sheet like any other's.
//
// WHAT IT KEEPS (the layer's save, beside the rewards waiting): each line begun - the step it stands at, the outcome
// each step ended on, whether it is done, and when its next step may start. A step's quest is found by NAME on the
// machine, never by uid, so a restart (QUEST-RESET - a new copy) or a quest set aside (QUEST-SHELF) is still the step.
//
// THE SERVICE'S PART (decision 8; net/questlineClaims.js). A step the service pays - a witnessed one, a title's, the
// key's - is CLAIMED twice, each claim saying its phase: `open` when it starts (the service writes the opening - the
// line's first is its witness's window), `end` when it ends well (the service looks for its receipt, and pays the title
// or the key). A claim the service could not answer - the network down, the switch shut - or an end it could not witness
// yet - a receipt not claimed - is asked again: a minute apart CLAIM_TRIES times, then every CLAIM_SLOW_MS for as long
// as the page lives, and again at the next start of the page - never given up (AUDIT QUESTLINES SERVICE-2: an open
// dropped after five minutes left a step no deed could witness). An end the service has not witnessed is the step's
// `unseen` in the window: a later deed's receipt witnesses it. The line moves on the client's own quest either way: the
// service pays, it does not gate.
import { QL_LINES, lineById, lineStepOf, lineOpens, opensWords, witnessOf, lineServiceOf } from './qlLines.js';
import { QL_SERVICE_LINES, qlStepClaimed } from '../../net/questlineClaims.js';
import { questlinesOn } from './qlLaw.js';

/** The game seconds a line waits between one step's end and the next step's start - an hour of the character's time,
 *  so the next letter does not arrive in the same breath as the last reward. */
export const STEP_GAP_S = 3600;
/** A step that ended badly is offered again a day of the character's time later. */
export const RETRY_GAP_S = 24 * 3600;
/** A claim the service could not answer is asked again this many real milliseconds later, CLAIM_TRIES times, and then
 *  every CLAIM_SLOW_MS while the page lives. */
export const CLAIM_RETRY_MS = 60_000;
export const CLAIM_TRIES = 5;
export const CLAIM_SLOW_MS = 600_000;

/** A line's record, fresh. */
const freshLine = () => ({ step: 0, outcomes: {}, done: false, wait: 0, claims: {} });

/**
 * @param {{ machine: any, ctx?: any, service?: any, nowMs?: () => number }} deps
 *   `ctx` - level(), online(), nowSeconds() (the character's clock), onHonour({ line, title, key, keys }) (a title or key
 *   the service paid - `keys` the account's Weir Keys after it), outcomeText(quest) (the step's outcome in the player's
 *   words, filed with the step);
 *   `service` - the account service's door (scenes/quest/questlineHost.js): `claim({ line, step, phase, choice })`
 *   answering `{ ok, data: { opened?, witnessed?, title?, key?, keys?, why? } }`, never a throw; null offline
 */
export function createLineRunner({ machine, ctx = {}, service = null, nowMs = () => Date.now() }) {
  /** id -> the line's record */
  let lines = {};
  /** The claims still to ask: `[{ line, step, choice, phase: 'open'|'end', next, tries }]`. Not saved: the records'
   *  `claims` say what was answered, and a page's start asks again what was not. */
  let pending = [];

  const level = () => ctx.level?.() ?? 1;
  const online = () => !!service && !!ctx.online?.();
  const now = () => ctx.nowSeconds?.() ?? 0;
  const probe = { level, online, lineDone: (id) => !!lines[id]?.done };

  /** The step's quest on the machine (by name) - running, or scheduled for the next tick - or null. */
  const runningStep = (questName) => {
    for (const q of machine.quests.values()) {
      if (q.questName === questName && !q.questComplete && !q.questTombstoned) return q;
    }
    return machine.questsToInvoke?.find?.((q) => q.questName === questName) ?? null;
  };

  /** A claim to ask: the `open` of every step of a line the service pays (its first is the witness's window - AUDIT
   *  QUESTLINES SERVICE-2), the `end` of a step it pays. */
  function queueClaim(lineId, step, phase, choice = null) {
    if (!service || !(phase === 'open' ? Object.hasOwn(QL_SERVICE_LINES, lineId) : qlStepClaimed(lineId, step))) return;
    if (pending.some((c) => c.line === lineId && c.step === step && c.phase === phase)) return;
    pending.push({ line: lineId, step, choice, phase, next: 0, tries: 0 });
  }

  async function ask(c) {
    let a;
    try { a = await service.claim({ line: c.line, step: c.step, phase: c.phase, ...(c.choice ? { choice: c.choice } : {}) }); } catch { a = { ok: false, error: 'offline' }; }
    const rec = lines[c.line];
    if (!rec) return;
    const d = a?.ok ? a.data ?? {} : null;
    // answered for good: an open written, an end witnessed, or a step the service pays nothing - and the pay told once.
    // A guest's end, and an end not witnessed yet, are kept and asked again (a guest may register; a later deed's receipt
    // witnesses the step)
    const answered = !!d && (d.why === 'unpaid' || (c.phase === 'open' ? !!d.opened : d.witnessed === true));
    if (answered) {
      pending = pending.filter((x) => x !== c);
      rec.claims[c.step] = d.why === 'unpaid' ? 'refused:unpaid' : c.phase === 'open' ? (rec.claims[c.step] ?? 'opened') : 'witnessed';
      if (d.title || d.key) ctx.onHonour?.({ line: c.line, title: d.title ?? null, key: !!d.key, keys: Number.isSafeInteger(d.keys) ? d.keys : null });
      return;
    }
    if (d && c.phase === 'end') rec.claims[c.step] = d.why === 'guest' ? 'refused:guest' : 'unseen';
    c.tries++;
    c.next = nowMs() + (c.tries < CLAIM_TRIES ? CLAIM_RETRY_MS : CLAIM_SLOW_MS);
  }

  function startStep(l, rec) {
    const step = l.steps[rec.step];
    if (!step || runningStep(step.quest)) return;
    const q = machine.scheduleQuestByName(step.quest);
    // a script that will not parse (the machine has said why) is tried again a day later, never every tick
    if (!q) { rec.wait = now() + RETRY_GAP_S; return; }
    queueClaim(l.id, rec.step, 'open');
  }

  const runner = {
    /** Each tick after the machine's: open what may open, start each line's step that is due, ask the service what is
     *  owed. The switch off, no line moves (its quests would not be stamped). */
    look() {
      if (!questlinesOn()) return;
      const t = now();
      for (const l of QL_LINES) {
        let rec = lines[l.id];
        if (!rec) {
          if (!lineOpens(l, probe)) continue;
          rec = lines[l.id] = freshLine();
        }
        if (rec.done || rec.wait > t) continue;
        if (l.opens.online && !online()) continue;   // an endgame line waits, offline, where it stood
        startStep(l, rec);
      }
      const ms = nowMs();
      for (const c of pending) if (c.next <= ms && !c.busy) { c.busy = true; ask(c).finally(() => { c.busy = false; }); }
    },

    /**
     * The layer's ending (a quest's `end quest`): if the quest is a line's step, the line moves - on to the next step
     * for an outcome that is no failure, the same step again a day later for one that is. `outcome` is the settled one
     * (the sheet's), or null.
     */
    ended(quest, outcome) {
      const at = lineStepOf(quest?.questName);
      if (!at) return null;
      const rec = lines[at.line.id];
      if (!rec || rec.done || rec.step !== at.index) return null;
      const good = outcome ? !outcome.failure : !!quest.questSuccess;
      if (!good) { rec.wait = now() + RETRY_GAP_S; return { line: at.line.id, step: at.index, moved: false }; }
      rec.outcomes[at.index] = { id: outcome?.id ?? 'done', text: ctx.outcomeText?.(quest) ?? null };
      queueClaim(at.line.id, at.index, 'end', outcome?.id ?? null);
      rec.step++;
      rec.wait = now() + STEP_GAP_S;
      if (rec.step >= at.line.steps.length) rec.done = true;
      return { line: at.line.id, step: at.index, moved: true, done: rec.done };
    },

    /**
     * The window's rows: every line, begun or not - `{ id, group, title, lead, giver, state, steps, opens, outcome, honour }`
     * (`honour` the title the line pays, or null).
     * `state` 'done' | 'running' | 'waiting' (between steps, or offline for an endgame line) | 'locked'; each step
     * `{ title, state: 'done'|'current'|'next', witnessed: bool, unseen: bool, outcome }` - the steps after the current one are named
     * (a line is a story the player can see the shape of), their quests not yet given.
     */
    rows() {
      return QL_LINES.map((l) => {
        const rec = lines[l.id];
        const steps = l.steps.map((s, i) => {
          const state = !rec ? 'next' : rec.done || i < rec.step ? 'done' : i === rec.step ? 'current' : 'next';
          // `unseen`: done, and its end not witnessed by the service yet (a later deed's receipt witnesses it)
          const said = rec?.claims?.[i];
          return { quest: s.quest, title: s.title(), state, witnessed: !!witnessOf(l, i), unseen: state === 'done' && (said === 'unseen' || said === 'refused:guest'), outcome: rec?.outcomes?.[i]?.text ?? null };
        });
        const running = !!rec && !rec.done && !!runningStep(l.steps[rec.step]?.quest);
        const state = !rec ? 'locked' : rec.done ? 'done' : running ? 'running' : 'waiting';
        const last = rec?.outcomes?.[l.steps.length - 1] ?? null;
        return {
          id: l.id, group: l.group, title: l.title(), lead: l.lead(), giver: l.giver(), state, steps,
          opens: !rec ? opensWords(l, probe) : state === 'waiting' && l.opens.online && !online() ? opensWords({ ...l, opens: { online: true } }, probe) : null,
          outcome: rec?.done ? last?.text ?? null : null,
          honour: lineServiceOf(l)?.title ?? null,
        };
      });
    },

    /** The record of a line, for the pins. */
    lineState: (id) => (lines[id] ? structuredClone(lines[id]) : null),

    snapshot: () => structuredClone(lines),
    /** A load: the records back, and every claim the service has not answered asked again (an open never written, an
     *  end never witnessed). */
    restore(data) {
      lines = {};
      pending = [];
      if (!data || typeof data !== 'object') return;
      for (const [id, r] of Object.entries(data)) {
        const l = lineById(id);
        if (!l || !r || typeof r !== 'object') continue;
        const step = Math.max(0, Math.min(l.steps.length, Number.isSafeInteger(r.step) ? r.step : 0));
        lines[id] = {
          step, done: !!r.done || step >= l.steps.length, wait: Number.isFinite(r.wait) ? r.wait : 0,
          outcomes: r.outcomes && typeof r.outcomes === 'object' ? structuredClone(r.outcomes) : {},
          claims: r.claims && typeof r.claims === 'object' ? { ...r.claims } : {},
        };
        const rec = lines[id];
        for (let i = 0; i <= Math.min(rec.step, l.steps.length - 1); i++) {
          const ended = i < rec.step;
          const said = rec.claims[i];
          if (ended && said !== 'witnessed' && said !== 'refused:unpaid') queueClaim(id, i, 'end', rec.outcomes[i]?.id ?? null);
          else if (!ended && !rec.done && !said) queueClaim(id, i, 'open');
        }
      }
    },
  };
  return runner;
}

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
// key's - is CLAIMED twice: when it starts (the service writes when it opened, so only a receipt after it counts) and
// when it ends well (the service looks for its receipt, and pays the title or the key). A claim the service could not
// witness yet - a receipt not claimed, the network down - is asked again, a minute apart, a few times, and again at the
// next start of the page. The line moves on the client's own quest either way: the service pays, it does not gate.
import { QL_LINES, lineById, lineStepOf, lineOpens, opensWords, witnessOf, lineServiceOf } from './qlLines.js';
import { qlStepClaimed } from '../../net/questlineClaims.js';
import { questlinesOn } from './qlLaw.js';

/** The game seconds a line waits between one step's end and the next step's start - an hour of the character's time,
 *  so the next letter does not arrive in the same breath as the last reward. */
export const STEP_GAP_S = 3600;
/** A step that ended badly is offered again a day of the character's time later. */
export const RETRY_GAP_S = 24 * 3600;
/** A claim the service could not answer is asked again this many real milliseconds later, at most CLAIM_TRIES times a
 *  page. */
export const CLAIM_RETRY_MS = 60_000;
export const CLAIM_TRIES = 5;

/** A line's record, fresh. */
const freshLine = () => ({ step: 0, outcomes: {}, done: false, wait: 0, claims: {} });

/**
 * @param {{ machine: any, ctx?: any, service?: any, nowMs?: () => number }} deps
 *   `ctx` - level(), online(), nowSeconds() (the character's clock), onHonour({ line, title, key }) (a title or key the
 *   service paid), outcomeText(quest) (the step's outcome in the player's words, filed with the step);
 *   `service` - the account service's door (scenes/quest/questlineHost.js): `claim({ line, step, choice })` answering
 *   `{ ok, data: { opened?, witnessed?, title?, key?, why? } }`, never a throw; null offline
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

  function queueClaim(lineId, step, phase, choice = null) {
    if (!service || !qlStepClaimed(lineId, step)) return;
    if (pending.some((c) => c.line === lineId && c.step === step && c.phase === phase)) return;
    pending.push({ line: lineId, step, choice, phase, next: 0, tries: 0 });
  }

  async function ask(c) {
    let a;
    try { a = await service.claim({ line: c.line, step: c.step, ...(c.choice ? { choice: c.choice } : {}) }); } catch { a = { ok: false, error: 'offline' }; }
    const rec = lines[c.line];
    if (!rec) return;
    const d = a?.ok ? a.data ?? {} : null;
    // answered: an open written (or found written - a retried open whose first answer was lost reads `witnessed`, true or
    // false), an end witnessed (or one the service says it will never witness - a guest, a line it does not pay), and
    // the pay told once
    const answered = !!d && (c.phase === 'open' ? (d.opened || typeof d.witnessed === 'boolean' || d.why) : (d.witnessed || d.why));
    if (answered) {
      pending = pending.filter((x) => x !== c);
      rec.claims[c.step] = c.phase === 'open' ? (rec.claims[c.step] ?? 'opened') : (d.witnessed ? 'witnessed' : `refused:${d.why}`);
      if (d.title || d.key) ctx.onHonour?.({ line: c.line, title: d.title ?? null, key: !!d.key });
      return;
    }
    c.tries++;
    c.next = nowMs() + CLAIM_RETRY_MS;
    if (c.tries >= CLAIM_TRIES) pending = pending.filter((x) => x !== c);
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
     * `{ title, state: 'done'|'current'|'next', witnessed: bool, outcome }` - the steps after the current one are named
     * (a line is a story the player can see the shape of), their quests not yet given.
     */
    rows() {
      return QL_LINES.map((l) => {
        const rec = lines[l.id];
        const steps = l.steps.map((s, i) => {
          const state = !rec ? 'next' : rec.done || i < rec.step ? 'done' : i === rec.step ? 'current' : 'next';
          return { quest: s.quest, title: s.title(), state, witnessed: !!witnessOf(l, i), outcome: rec?.outcomes?.[i]?.text ?? null };
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
          if (!qlStepClaimed(id, i)) continue;
          const ended = i < rec.step;
          const said = rec.claims[i];
          if (ended && said !== 'witnessed' && !String(said ?? '').startsWith('refused:')) queueClaim(id, i, 'end', rec.outcomes[i]?.id ?? null);
          else if (!ended && !said) queueClaim(id, i, 'open');
        }
      }
    },
  };
  return runner;
}

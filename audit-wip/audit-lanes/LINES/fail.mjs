// LINES lane: every step's FAILURE path, through the real bridge and runner (harness.mjs). For each step: the line set
// at that step, the step started, its clocks run out without the player doing what it asks (and, where a step has a
// second clock for the meeting after the act, that one too); then: ended unpaid, the sheet's failure outcome, the
// step's QuestFail message said, and the runner offering the same step again RETRY_GAP_S later.
import { makeBridge, actsOf, noteAct, QL_LINES, RUNNER, DAY } from './harness.mjs';
const LOG = console.log;

async function failStep(l, i, { actFirst = false } = {}) {
  const h = makeBridge({ level: 30, online: true });
  const recs = {};
  for (const o of QL_LINES) recs[o.id] = o.id === l.id ? { step: i, done: false, wait: 0, outcomes: {}, claims: {} } : { step: o.steps.length, done: true };
  if (l.opens.after) recs[l.opens.after] = { step: 99, done: true };
  h.runner.restore(recs);
  const name = l.steps[i].quest;
  h.tick(3); await h.settle();
  let q = h.running(name);
  if (!q) return `${name}: NOT STARTED`;
  const uid = q.uid;
  // the letter (in town, by day)
  h.advance(4 * 3600); h.tick(3);
  if (actFirst) { for (const [k, n] of actsOf(q)) noteAct(k, n); h.kill(q); h.tick(3); h.advance(4 * 3600); h.tick(3); }
  const goldBefore = h.st.rewards.length;
  const before = h.st.popups.length;
  // run the clocks out: 61 days in day steps (offline: the raw gap)
  for (let d = 0; d < 62 && !q.questComplete && !q.ql?.outcome; d++) { h.advance(DAY); h.tick(3); }
  h.tick(6);
  h.tick(4); await h.settle();
  const said = h.st.popups.slice(before).map((p) => p.text.replace(/\s+/g, ' ').trim().slice(0, 50));
  const rec = h.runner.lineState(l.id);
  const paid = h.st.rewards.length - goldBefore;
  const offers = h.st.offers.filter((o) => o.questName === name).length;
  const res = `${name}${actFirst ? ' (act done, meeting missed)' : ''}: complete=${q.questComplete} success=${q.questSuccess} outcome=${q.ql?.outcome} paid=${paid} offers=${offers} step=${rec.step} waitIn=${rec.wait - h.st.s}s said=${JSON.stringify(said)}`;
  // the runner offers it again after RETRY_GAP_S
  h.advance(RUNNER.RETRY_GAP_S - 3600 * 2); h.tick(3);
  const early = h.any(name).filter((x) => x.uid !== uid).length;
  h.advance(3600 * 3); h.tick(3);
  const again = h.any(name).filter((x) => x.uid !== uid && !x.questComplete).length;
  return `${res} | again before gap=${early} after=${again}`;
}

for (const l of QL_LINES) {
  for (let i = 0; i < l.steps.length; i++) {
    LOG(await failStep(l, i));
    // a step with a second clock (the meeting after the act)
    const h = makeBridge({ level: 30, online: true });
    const src = h.bridge.machine.deps?.getQuestSourceLines?.(l.steps[i].quest) ?? [];
    if (src.some((x) => /^\s*Clock _meet_/.test(x))) LOG(await failStep(l, i, { actFirst: true }));
  }
}

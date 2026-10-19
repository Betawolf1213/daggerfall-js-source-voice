// LINES lane: every line driven end to end through the real bridge and its runner (harness.mjs) - each final-step
// choice in turn. Prints, per step, how it ended, what it paid, and that the runner moved on.
// usage: node drive.mjs [lineId]
import { makeBridge, actsOf, noteAct, QL_LINES, lineById, RUNNER, DAY } from './harness.mjs';

const CHOICES = { QLBD02: [0, 1], QLBD05: [0, 1, 2], QLCH03: [0, 1], QLWR04: [0, 1], QLHR02: [[0], [1], [2], [3, 0], [3, 1], [3, 2]], QLOC03: [0, 1] };
const LOG = console.log;

async function driveLine(lineId, pick) {
  const l = lineById(lineId);
  const h = makeBridge({ level: 30, online: true });
  const others = {};
  for (const o of QL_LINES) if (o.id !== lineId) others[o.id] = { step: o.steps.length, done: true };
  h.runner.restore(others);
  const out = [];
  let acted = new Set(); const seen = new Map();
  for (let round = 0; round < 80; round++) {
    const rec = h.runner.lineState(lineId);
    if (rec?.done) break;
    h.advance(2 * 3600); h.tick(3); await h.settle();
    const r = h.runner.lineState(lineId);
    if (!r || r.done) continue;
    if (process.env.DBG) console.log('round', round, JSON.stringify({ step: r.step, wait: r.wait }), h.st.s, [...h.bridge.machine.quests.values()].map((q) => `${q.questName}:${q.questComplete ? 'C' : ''}${q.questTombstoned ? 'T' : ''}`).join(' '));
    const step = l.steps[r.step];
    const q = h.running(step.quest);
    if (!q) { h.advance(RUNNER.STEP_GAP_S); h.tick(2); continue; }
    // the early visit
    h.click(q); h.tick(3);
    // the asks (a step's choice, else the first)
    const respond = () => {
      while (h.st.asked.length) {
        const a = h.st.asked[0];
        const p = CHOICES[a.quest] ? pick[a.quest] : undefined;
        let idx = 0;
        if (Array.isArray(p)) idx = p[(h.st[`n_${a.quest}`] = (h.st[`n_${a.quest}`] ?? 0) + 1) - 1] ?? 0;
        else if (p != null) idx = p;
        h.answer(idx); h.tick(2);
      }
    };
    respond();
    seen.set(q.uid, (seen.get(q.uid) ?? 0) + 1);
    if (!acted.has(q.uid) && seen.get(q.uid) >= 2 && q.getLogMessages()?.length > 0) {
      acted.add(q.uid);
      for (const [k, n] of actsOf(q)) noteAct(k, n);
      h.kill(q);
      h.tick(3);
      respond();
    }
    h.click(q); h.tick(3); respond(); h.click(q); h.tick(3); respond(); h.tick(4);
    if (q.questComplete || q.questTombstoned) {
      const gold = h.st.rewards.filter((x) => x.quest === q.questName).map((x) => x.item?.stackCount ?? x.item?.value ?? '?');
      const offer = h.st.offers.filter((o) => o.questName === q.questName).map((o) => `${o.outcome}:t${o.tier}${o.pieces.some((p) => p.named) ? `:named=${o.pieces.find((p) => p.named).item.name}` : ''}`);
      out.push(`${q.questName} ${q.questSuccess ? 'OK' : 'FAIL'} outcome=${q.ql?.outcome} gold=${gold.join('+') || '-'} offers=${offer.join(',') || '-'}`);
    }
  }
  const rec = h.runner.lineState(lineId);
  return { out, rec, h };
}

const only = process.argv[2];
for (const l of QL_LINES) {
  if (only && l.id !== only) continue;
  const last = l.steps.at(-1).quest;
  const picks = l.steps.map((s) => s.quest).filter((n) => CHOICES[n]);
  // every choice of the line's last step (and QLBD02's two)
  const variants = [];
  const lastChoices = CHOICES[last] ?? [null];
  for (const c of lastChoices) variants.push({ [last]: c, QLBD02: 0 });
  if (l.id === 'burningDoors') variants.push({ QLBD02: 1, QLBD05: 0 });
  for (const v of variants) {
    const { out, rec } = await driveLine(l.id, v);
    LOG(`== ${l.id} ${JSON.stringify(v)} done=${rec?.done} step=${rec?.step} outcomes=${JSON.stringify(Object.fromEntries(Object.entries(rec?.outcomes ?? {}).map(([k, o]) => [k, o.id])))} claims=${JSON.stringify(rec?.claims)}`);
    for (const s of out) LOG('   ' + s);
  }
}

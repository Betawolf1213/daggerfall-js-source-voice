// BRANCH: every patched quest, every choice, run in the real bridge with the switch on: does the quest END, and what was paid?
import { makeBridge, askTasks, forceTask, stubWorld, tickN, runOutNewClocks, runningClocks, goldOf, FACTION } from './harness.mjs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { QL_PATCHES } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
const { sheetFor } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);

const only = process.argv[2] ? process.argv[2].split(',') : null;
const warn = console.warn; const warns = [];
console.warn = (...a) => warns.push(a.join(' '));

for (const name of QL_PATCHES.keys()) {
  if (only && !only.includes(name)) continue;
  // how many choices? read off the first run
  let probe = makeBridge({ on: true });
  const q0 = probe.bridge.machine.startQuestByName(name, FACTION);
  if (!q0) { console.log(name, 'DID NOT START'); continue; }
  const asks = askTasks(q0);
  if (!asks.length) { console.log(`${name}: no ask (patch is a mend or a prompt)`); continue; }
  const nChoices = asks[0].actions.find((a) => a.choiceIds)?.choiceIds.length ?? 0;
  for (let c = 0; c < nChoices; c++) {
    warns.length = 0;
    const { bridge, rec } = makeBridge({ on: true });
    const quest = bridge.machine.startQuestByName(name, FACTION);
    stubWorld(quest);
    tickN(bridge, 3);
    const before = runningClocks(quest);
    for (const t of askTasks(quest)) forceTask(t);
    tickN(bridge, 1);
    const asked = rec.asked.length;
    if (asked) rec.asked[0].respond(c);
    tickN(bridge, 6);
    for (let r = 0; r < 3; r++) { runOutNewClocks(quest, before); tickN(bridge, 6); }
    const ended = quest.questComplete || quest.questTombstoned || quest.ticksToEnd > 0;
    const sheet = sheetFor(name);
    const choiceId = sheet?.branches?.flatMap((b) => b.choices).find((x) => x.sets === rec.asked[0]?.choices?.[c] && false);
    console.log(`${name} choice ${c}: asked=${asked} ended=${ended} success=${!!quest.questSuccess} paid=${quest.ql?.paid} outcome=${quest.ql?.outcome} choices=${JSON.stringify(quest.ql?.choices)} gold/items=${JSON.stringify(goldOf(rec.rewards))} given=${JSON.stringify(goldOf(rec.given))} rep=${JSON.stringify(rec.rep)} legal=${JSON.stringify(rec.legal)} offers=${rec.offers.length} popups=${rec.popups.length}${rec.popups.length ? ' [' + rec.popups.map((p) => p.slice(0, 60)).join(' | ') + ']' : ''}`);
    if (!ended) {
      const live = [...quest.tasks.values()].filter((t) => t.triggered).map((t) => t.symbol?.name);
      console.log(`   NOT ENDED: triggered tasks: ${live.join(' ')}; running clocks: ${[...runningClocks(quest)].join(' ')}`);
    }
    const w = warns.filter((s) => !/travel-time arm pends|no world|headless/i.test(s));
    if (w.length) console.log('   warns:', w.slice(0, 5).map((s) => s.slice(0, 160)).join(' || '));
  }
}
console.warn = warn;

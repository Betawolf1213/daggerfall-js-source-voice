// BRANCH: the three patched quests with no `ask` - B0B71Y03 (put the child down now pays), K0C01Y00 (the victim's path
// now sets _victory_), B0B81Y02 (the bare task `yes` renamed _qlyes_) - each run on the path its patch touches.
import { makeBridge, stubWorld, goldOf } from './harness.mjs';
console.warn = () => {};
const fire = (q, n) => { const t = q.getTask({ name: n }); t.actions.forEach((a) => { if (a.isTriggerCondition) a.isComplete = true; }); t.start(); };
for (const on of [false, true]) {
  // B0B71Y03: the prompt's yes - put the child down
  { const { bridge, rec } = makeBridge({ on }); const q = bridge.machine.startQuestByName('B0B71Y03', 0); stubWorld(q); bridge.machine.tick();
    fire(q, 'S.13'); for (let i = 0; i < 5; i++) bridge.machine.tick();
    console.log(`B0B71Y03 on=${on} put down: ended=${q.questComplete} success=${q.questSuccess} outcome=${q.ql?.outcome} legal=${JSON.stringify(rec.legal)} offers=${rec.offers.length} popups=${rec.popups.length}`); }
  // K0C01Y00: the victim found, then the questor clicked
  { const { bridge, rec } = makeBridge({ on }); const q = bridge.machine.startQuestByName('K0C01Y00', 0); stubWorld(q); bridge.machine.tick();
    fire(q, 'S.08'); for (let i = 0; i < 3; i++) bridge.machine.tick(); fire(q, 'qgclicked'); for (let i = 0; i < 5; i++) bridge.machine.tick();
    console.log(`K0C01Y00 on=${on} victim path: victory=${q.getTask({ name: 'victory' }).getTriggerValue()} ended=${q.questComplete} success=${q.questSuccess} outcome=${q.ql?.outcome} gold=${JSON.stringify(goldOf(rec.rewards))} offers=${rec.offers.length}`); }
  // B0B81Y02: the wizard's prompt answered yes
  { const { bridge, rec } = makeBridge({ on }); const q = bridge.machine.startQuestByName('B0B81Y02', 0); stubWorld(q); bridge.machine.tick();
    const yes = q.getTask({ name: on ? 'qlyes' : 'yes' }); yes.start(); for (let i = 0; i < 3; i++) bridge.machine.tick();
    const prompts = [...q.tasks.values()].flatMap((t) => t.actions).filter((a) => a.typeName === 'Prompt').map((a) => `${a.yesTaskSymbol?.name ?? a.yesSymbol?.name ?? JSON.stringify(a.actionSpecific ?? Object.keys(a))}`);
    console.log(`B0B81Y02 on=${on} yes task "${yes.symbol.name}" ran ${yes.actions.filter((a) => a.isComplete).length}/${yes.actions.length} actions; prompts' yes: ${prompts.join(',')}`); }
}

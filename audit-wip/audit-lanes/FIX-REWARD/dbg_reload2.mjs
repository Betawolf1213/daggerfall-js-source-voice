import { makeBridge, tick } from './_bridge.mjs';
const { bridge, rec } = makeBridge({ level: 12 });
const q = bridge.machine.startQuestByName('M0B00Y16', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (!a.isTriggerCondition) { const up = a.update.bind(a); a.update = (c) => { try { up(c); } catch { a.setComplete(); } }; }
let at = null;
for (const r of q.resources.values()) if (r.isPlace) r.isPlayerHere = () => at === r.symbol.name;
const fire = (task, type) => { for (const a of q.getTask({ name: task }).actions) if (a.typeName === type) { const c = a.checkTrigger.bind(a); let once = true; a.checkTrigger = (x) => (once ? ((once = false), true) : c(x)); } };
tick(bridge, 2); q.getTask({ name: 'victim' }).start(); q.getTask({ name: 'S.09' }).clear(); tick(bridge, 1);
fire('S.10', 'ClickedNpc'); tick(bridge, 2); fire('S.03', 'KilledFoe'); tick(bridge, 2);
fire('clickqgiver', 'ClickedNpc'); tick(bridge, 2);
const snap = bridge.snapshot();
console.log('paid', q.ql.paid, 'gold', JSON.stringify(snap.questlines.gold), 'uid', q.uid);
const n = makeBridge({ level: 12 });
n.bridge.restore(snap);
const q2 = n.bridge.machine.quests.get(q.uid);
console.log('restored', !!q2, JSON.stringify(n.bridge.questlines.snapshot().gold), 'ql', JSON.stringify(q2?.ql));
for (const r of q2.resources.values()) if (r.isPlace) r.isPlayerHere = () => at === r.symbol.name;
at = 'store'; tick(n.bridge, 2); at = null; tick(n.bridge, 6);
console.log('after escort', q2.ql.outcome, 'gold added', JSON.stringify(n.rec.gold), 'hud', JSON.stringify(n.rec.hud));

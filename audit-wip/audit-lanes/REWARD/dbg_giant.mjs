import { makeBridge, tick } from './_bridge.mjs';
const { bridge, rec } = makeBridge();
const quest = bridge.machine.startQuestByName('M0B00Y16', 41);
for (const task of quest.tasks.values()) for (const a of task.actions) if (['PlaceFoe', 'PlaceNpc', 'HideNpc', 'RevealLocation'].includes(a.typeName)) a.isComplete = true;
tick(bridge, 2);
quest.getTask({ name: 'victim' }).start(); quest.getTask({ name: 'S.09' }).clear();
quest.getTask({ name: 'S.03' }).start(); quest.getTask({ name: 'S.10' }).start(); quest.getTask({ name: 'yes' }).start();
tick(bridge, 2);
quest.getTask({ name: 'S.13' }).start(); tick(bridge, 3);
for (const n of ['yes', 'S.13', 'escortComplete', 'S.17']) { const t = quest.getTask({ name: n }); console.log(n, t?.triggered, t?.actions.map((a) => `${a.typeName}:${a.isComplete}`).join(' ')); }

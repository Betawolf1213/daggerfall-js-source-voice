import { packMachine, parsedQuest } from '/home/user/daggerfall-js-source/test/qlSources.mjs';
console.warn = () => {};
const m = packMachine();
const q = parsedQuest(process.argv[2], m).quest;
for (const t of q.tasks.values()) console.log(t.symbol?.name, t.type, t.hasTriggerConditions, t.globalVarLink, t.actions.map((a) => a.typeName).join(','));

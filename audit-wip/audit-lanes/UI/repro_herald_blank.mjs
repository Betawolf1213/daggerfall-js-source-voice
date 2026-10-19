// UI REPRO: THE HERALD'S "Objective done" NOTICE LOSES ITS WORDS. An objective is done (look 1: the notice reads
// "Objective done - Wild Animal - Kill the beast"); a look later, while that notice still shows, the script writes its
// next journal entry (an 'updated' event, which ranks below 'objective'): the herald KEEPS the objective's type but takes
// the line from the new event (questHerald.js lineOf: 'objective' reads event.text only from an 'objective' event) - and
// the notice is left saying "Objective done" over an empty line. Real lens, real herald.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { QuestLens } = await import(`${SNAP}/src/ui/quest/questLens.js`);
const { QuestHerald } = await import(`${SNAP}/src/ui/quest/questHerald.js`);
const m = (id, text) => ({ id, getTextTokens: () => [{ text, formatting: 'text' }], parentQuest: null });
let messages = [m(1010, 'A beast is loose in the house.')], steps = [{ stepID: 0, messageID: 1010, time: 1 }];
let objectives = [{ id: 'slay', text: 'Kill the beast', state: 'open' }, { id: 'tell', text: 'Return for your pay', state: 'hidden' }];
const lens = new QuestLens({ questLog: () => ({ active: [{ id: '7', name: 'Wild Animal', questName: 'M0B00Y06', messages, steps, clocks: [], ql: { tier: 1, objectives, choices: [], outcome: null } }], ended: [] }) });
const herald = new QuestHerald();
lens.look();   // the baseline
objectives = [{ id: 'slay', text: 'Kill the beast', state: 'done' }, { id: 'tell', text: 'Return for your pay', state: 'open' }];
let seen = lens.look(); herald.hear(seen);
console.log('look 1 events', JSON.stringify(seen.events.map((e) => e.type)), '-> notice:', JSON.stringify(herald.frame().rows[0].map((c) => c.text)));
messages = [...messages, m(1011, 'The beast is dead. I should return to Lord Kain.')]; steps = [...steps, { stepID: 1, messageID: 1011, time: 2 }];
seen = lens.look(); herald.hear(seen);
console.log('look 2 events', JSON.stringify(seen.events.map((e) => e.type)), '-> notice:', JSON.stringify(herald.frame().rows[0].map((c) => c.text)));

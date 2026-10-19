// REPRO: QLIW02 (The Kneeling Dead). Its sheet tells the player to "Wait in a town for word from _captain_", and its
// `_heard_` task hands the watch's letter (`give pc _thanks_ notify 1012` - GivePc's notify form waits for a town, by
// day) and then, in the same tick, the purse (`give pc _gold_`) and `end quest`. A revenant kneels where it rises - out
// in the wild: the purse and the end come at once, and the letter (1011, the captain's thanks; 1012, the watchman) is
// never handed over: the quest ends with it still waiting for a town.
import { makeBridge, noteAct, QL_LINES } from './harness.mjs';
const h = makeBridge({ level: 30, online: true });
const recs = {};
for (const o of QL_LINES) recs[o.id] = o.id === 'introBay' ? { step: 1, done: false, wait: 0 } : { step: o.steps.length, done: true };
h.runner.restore(recs);
h.tick(3);
const q = h.running('QLIW02');
h.st.inTown = false;   // out in the wild, where the revenant knelt
noteAct('revenant-knelt', 1);
h.tick(2);
h.advance(2 * 3600); h.tick(8);   // the _heard_ clock (30-90 minutes) runs out
const said = h.st.popups.filter((p) => p.quest === 'QLIW02').map((p) => p.text.replace(/\s+/g, ' ').trim().slice(0, 60));
console.log('QLIW02 complete:', q.questComplete, 'success:', q.questSuccess, '| letter in the pack:', [...h.st.pack].some((i) => /letter/i.test(i?.name ?? i?.shortName ?? '')));
console.log('boxes the player saw:', JSON.stringify(said));
console.log('gold paid:', h.st.rewards.filter((r) => r.quest === 'QLIW02').length);
h.st.inTown = true; h.tick(10);
console.log('back in town, more boxes:', h.st.popups.filter((p) => p.quest === 'QLIW02').length - said.length);
// (FIX-SCRIPTS) and long enough in town, by day, for the courier's 40-500 ticks
h.tick(600);
console.log('in town 600 ticks: complete', q.questComplete, 'success', q.questSuccess, 'outcome', q.ql?.outcome, '| letter in the pack:', [...h.st.pack].some((i) => i?.questSymbol?.name === 'thanks'), '| gold paid:', h.st.rewards.filter((r) => r.quest === 'QLIW02').length);
console.log('boxes in town:', JSON.stringify(h.st.popups.filter((p) => p.quest === 'QLIW02').map((p) => p.text.replace(/\s+/g, ' ').trim().slice(0, 60))));

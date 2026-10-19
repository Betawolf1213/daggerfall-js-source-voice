// LINES-4 (script side), against the LIVE tree: QLCH03 kept - what the client's own script pays, and what it says.
import { makeBridge } from './harness.mjs';
const h = makeBridge({ level: 30, online: true });
const q = h.bridge.machine.startQuestByName('QLCH03');
h.tick(3);
q.getTask({ name: 'courier' })?.start?.();
h.tick(2);
h.clickOne(q, 'ysolde');
h.tick(2);
const asked = h.st.asked.find((a) => a.quest === 'QLCH03');
console.log('asked:', asked ? asked.message.id : null);
h.answer(0);   // keep
h.tick(6);
const words = (id) => (q.getMessage(id)?.getTextTokens?.(-1, Math.random, false) ?? []).map((t) => t.text).join(' ').replace(/\s+/g, ' ').trim();
console.log('complete:', q.questComplete, 'success:', q.questSuccess, 'outcome:', q.ql?.outcome);
console.log('gold paid by the script:', h.st.rewards.filter((r) => r.quest === 'QLCH03').length, '| gear offered:', h.st.offers.length);
console.log('1030:', words(1030));
console.log('1040:', words(1040));
console.log('1004:', words(1004));

// REWARD: the rewards waiting are capped at OFFERS_MAX (12); the thirteenth ended quest drops the oldest choice -
// silently (no HUD line, no notice) - and the one door that tells the player a reward waits names "your journal's
// Quests tab", which the classic skin's journal (DFU's logbook) does not have.
import { SNAP } from './_env.mjs';
const { createQuestlines, OFFERS_MAX } = await import(`${SNAP}/src/systems/questlines/qlLayer.js`);
const { freshState } = await import(`${SNAP}/src/systems/questlines/qlState.js`);
const said = [];
const layer = createQuestlines({ machine: { quests: new Map() }, ctx: { playerEntity: { level: 10, skills: new Array(35).fill(30), career: { weaponArmorShieldsBitfield: 0 } }, onQuestlineOffer: (o) => said.push(`offer ${o.id} ${o.title}`), addHUDText: (t) => said.push(t) } });
for (let i = 1; i <= OFFERS_MAX + 1; i++) {
  const quest = { questName: 'M0B00Y06', displayName: `Wild beast #${i}`, uid: i, questStartTime: i * 100, questSuccess: true, questComplete: true, ticksToEnd: 0, tasks: new Map(), resources: new Map(), ql: { ...freshState(), tier: 2, paid: true } };
  layer.ending(quest);
}
const waiting = layer.offers();
console.log(`ended ${OFFERS_MAX + 1} paying quests; waiting: ${waiting.length}; oldest waiting: "${waiting[0].title}"`);
console.log('what the layer said as it dropped "Wild beast #1":', said.filter((s) => !s.startsWith('offer')).length ? said : '(nothing but the 13 offer notices)');

// UI REPRO: a questline's NAMED piece takes its name whatever the producer rolled - "Oathkeeper's Dragon Helm" on a pair
// of boots or a shield, "Corvane's Spire-Blade" on a bow, "The Carter's Gauntlets" on a helm. Drives the REAL layer
// (qlLayer.js createQuestlines -> ending) over a fake stamped quest whose sheet outcome names the piece, and prints the
// reward card's name beside what the item actually is (its template, as the pack names it).
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { createQuestlines } = await import(`${SNAP}/src/systems/questlines/qlLayer.js`);
const { freshState } = await import(`${SNAP}/src/systems/questlines/qlState.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
import { readFileSync } from 'node:fs';
const TEMPLATES = JSON.parse(readFileSync(`${SNAP}/src/characters/itemTemplates.json`, 'utf8'));
const { SKILLS } = await import(`${SNAP}/src/systems/skills.js`);
setPref('questlines', true);
const fakeQuest = (questName, uid, setTask) => {
  const ql = freshState(); ql.tier = 4; ql.paid = true;
  return {
    questName, uid, questStartTime: uid * 7, displayName: questName, questSuccess: true, questComplete: false, ticksToEnd: 2, ql,
    tasks: { get: (n) => ({ getTriggerValue: () => n === setTask }) }, resources: new Map(), activeLogMessages: new Map(),
  };
};
const baseName = (item) => TEMPLATES.find((x) => x.index === item.templateIndex)?.name ?? `template ${item.templateIndex}`;
const cases = [['QLWR04', 'truthway', 'armor'], ['QLWR04', 'mercyway', 'weapon'], ['QLIR02', 'paid', 'armor']];
// an archer (Archery and Axe its two best weapon skills) - the 'blade' a Battlemage hands over
for (const [quest, task, kind] of cases) {
  for (let uid = 1; uid <= 6; uid++) {
    const archer = task === 'mercyway' ? { level: 15, skillOverrides: { [SKILLS.Archery]: 90, [SKILLS.BluntWeapon]: 80, [SKILLS.ShortBlade]: 5, [SKILLS.LongBlade]: 5, [SKILLS.Axe]: 5 } } : { level: 15 };
    const layer = createQuestlines({ machine: { quests: new Map() }, ctx: { playerEntity: archer } });
    const offer = layer.ending(fakeQuest(quest, uid, `${task}`));
    const p = offer?.pieces?.find((x) => x.named);
    if (!p) { console.log(quest, uid, 'no named piece', offer ? offer.pieces.map((x) => x.kind) : offer); continue; }
    console.log(`${quest} uid ${uid}: card reads "${p.item.name}" - the item is a ${p.kind} of template ${p.item.templateIndex} (${baseName(p.item)}), group ${p.item.group}`);
  }
}

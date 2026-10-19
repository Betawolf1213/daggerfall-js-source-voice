// A real quest bridge over the pack as the game reads it (the snapshot's test/qlSources.mjs), as ql4_branches.test.js
// drives one: the switch, a player, and every host door the reward path reads recorded.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SNAP } from './_env.mjs';
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { QUESTLINES_PREF, questlinesOn } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { questSource, loadTables, ROOT } = await import(`${SNAP}/test/qlSources.mjs`);
loadTables();
export { setPref, QUESTLINES_PREF };
export function makeBridge({ on = true, level = 12, skills = null, career = null, over = {} } = {}) {
  setPref(QUESTLINES_PREF, on);
  const rec = { asked: [], rep: [], legal: [], rewards: [], offers: [], popups: [], hud: [], gold: [] };
  const sk = skills ?? new Array(35).fill(30);
  const bridge = createQuestBridge({
    data: {
      readListTable: (name) => { try { return readFileSync(join(ROOT, 'vendor/dfu-quests/Tables', `QuestList-${name}.txt`), 'utf8'); } catch { return null; } },
      getQuestSourceLines: (n) => questSource(n, questlinesOn()),
    },
    classicSeconds: () => 0,
    playerEntity: { name: 'Hero', level, gender: 'female', career: career ?? { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: sk },
    showChoice: (q, message, choices, respond) => rec.asked.push({ message, choices, respond }),
    changeReputation: (fid, amount) => rec.rep.push([fid, amount]),
    changeLegalRep: (amount) => rec.legal.push(amount),
    offerReward: (_q, item) => rec.rewards.push(item),
    onQuestlineOffer: (o) => rec.offers.push(o),
    addHUDText: (t) => rec.hud.push(t),
    addGold: (n) => rec.gold.push(n),
    showPopup: (_q, tokens) => rec.popups.push(tokens.map((t) => t.text).join(' ')),
    ...over,
  });
  return { bridge, rec };
}
export const tick = (bridge, n = 1) => { for (let i = 0; i < n; i++) bridge.machine.tick(); };
export const placeAll = (quest) => { for (const task of quest.tasks.values()) for (const a of task.actions) if (a.typeName === 'PlaceFoe' || a.typeName === 'PlaceNpc' || a.typeName === 'PlaceItem') a.isComplete = true; };
export const summary = (rec, quest) => ({
  outcome: quest.ql?.outcome, success: quest.questSuccess, paid: quest.ql?.paid,
  rewards: rec.rewards.map((i) => `${i.name ?? i.group}${i.stackCount > 1 ? ' x' + i.stackCount : ''}`),
  rep: rec.rep, legal: rec.legal,
  offers: rec.offers.map((o) => ({ outcome: o.outcome, tier: o.tier, pieces: o.pieces.map((p) => `${p.kind}:${p.tier}:${p.item.name}`) })),
});

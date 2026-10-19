// BRANCH lane harness: start a patched quest in the real bridge (switch on), force its ask task(s), answer, drive to the end.
const SNAP = '/home/user/daggerfall-js-source';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { QUESTLINES_PREF, questlinesOn } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { questSource, loadTables, ROOT } = await import(`${SNAP}/test/qlSources.mjs`);
const { QlAsk } = await import(`${SNAP}/src/systems/questlines/qlActions.js`);
loadTables();

export const FACTION = 41;

/** Make a bridge whose host records everything. */
export function makeBridge({ on = true } = {}) {
  setPref(QUESTLINES_PREF, on);
  const rec = { asked: [], rep: [], legal: [], rewards: [], offers: [], popups: [], hud: [], given: [], warns: [] };
  let now = 1000;
  const skills = new Array(35).fill(30);
  const bridge = createQuestBridge({
    data: {
      readListTable: (name) => { try { return readFileSync(join(ROOT, 'vendor/dfu-quests/Tables', `QuestList-${name}.txt`), 'utf8'); } catch { return null; } },
      getQuestSourceLines: (n) => questSource(n, questlinesOn()),
    },
    classicSeconds: () => now,
    playerEntity: { name: 'Hero', level: 12, gender: 'female', career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills },
    showChoice: (q, message, choices, respond) => rec.asked.push({ q, message, choices, respond }),
    changeReputation: (fid, amount) => rec.rep.push([fid, amount]),
    changeLegalRep: (amount) => rec.legal.push(amount),
    offerReward: (_q, item) => rec.rewards.push(item),
    onQuestlineOffer: (o) => rec.offers.push(o),
    showPopup: (_q, tokens) => rec.popups.push(tokens.map((t) => t.text).join(' ')),
    addHUDText: (t) => rec.hud.push(t),
    giveItemToPlayer: (item) => rec.given.push(item),
  });
  return { bridge, rec, advance: (s) => { now += s; } };
}

/** Every task holding an ask, by name. */
export const askTasks = (quest) => [...quest.tasks.values()].filter((t) => t.actions.some((a) => a instanceof QlAsk));

/** Force a task to run: its trigger conditions set aside, and it set. */
export function forceTask(task) {
  for (const a of task.actions) if (a.isTriggerCondition || a.isAlwaysOnTriggerCondition) a.isComplete = true;
  task.start();
}

/** Mark world actions done (no world in node). */
export function stubWorld(quest) {
  for (const task of quest.tasks.values()) for (const a of task.actions) {
    if (['PlaceFoe', 'PlaceNpc', 'CreateNpcAt', 'CreateFoe', 'PlaceItem', 'CreateNpc'].includes(a.typeName)) a.isComplete = true;
  }
}

export function tickN(bridge, n) { for (let i = 0; i < n; i++) bridge.machine.tick(); }

/** Run out the clocks that were not running in `before` (the path's own). */
export function runOutNewClocks(quest, before) {
  let n = 0;
  for (const r of quest.resources.values()) {
    if (!r.isClock) continue;
    if (r.clockEnabled && !r.clockFinished && !before.has(r.symbol.name)) {
      r.remainingTimeInSeconds = 0;
      r._triggerTask(quest);
      r.clockEnabled = false; r.clockFinished = true;
      n++;
    }
  }
  return n;
}

export const runningClocks = (quest) => new Set([...quest.resources.values()].filter((r) => r.isClock && r.clockEnabled && !r.clockFinished).map((r) => r.symbol.name));

export const goldOf = (items) => items.map((i) => `${i?.shortName ?? i?.name ?? '?'}x${i?.stackCount ?? 1}`);

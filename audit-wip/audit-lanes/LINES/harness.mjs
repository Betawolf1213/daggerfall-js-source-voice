// LINES lane harness: the snapshot's REAL quest bridge (machine + questlines layer + line runner), no world. The world's
// own part of a script (an NPC or foe placed on a site's markers, a dungeon revealed) is marked done by hand as the
// shipped pins do (test/systems/questlines/ql4_branches.test.js); every other line runs as written: real clicks on the
// quest's Person resources, real items carried (the carriesQuestItem hook over a pack), real acts through the acts
// feed (qlActs.js noteAct -> the bridge's sink -> the layer), real clocks (the character's seconds advanced).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
export const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { createQuestBridge } = await import(SNAP + '/src/scenes/quest/questBridge.js');
const { setPref } = await import(SNAP + '/src/systems/uiPrefs.js');
const { QUESTLINES_PREF, questlinesOn } = await import(SNAP + '/src/systems/questlines/qlLaw.js');
const { questSource, loadTables, ROOT } = await import(SNAP + '/test/qlSources.mjs');
export const { noteAct } = await import(SNAP + '/src/systems/questlines/qlActs.js');
export const { QL_LINES, lineById } = await import(SNAP + '/src/systems/questlines/qlLines.js');
export const RUNNER = await import(SNAP + '/src/systems/questlines/qlLineRunner.js');
loadTables();

const WORLD_ACTIONS = new Set(['PlaceNpc', 'PlaceFoe', 'RevealLocation', 'CreateNpcAt', 'PlaceItem']);
export const DAY = 86400;

/** A bridge over the real machine. `online`: a fake account service (answers opened, then witnessed) so the endgame
 *  lines run; `service` to hand one of your own. */
export function makeBridge({ level = 30, online = true, service = undefined, inTown = true, quietConsole = true } = {}) {
  if (quietConsole) { console.warn = () => {}; }
  setPref(QUESTLINES_PREF, true);
  const st = {
    s: 1000 * DAY + 12 * 3600,   // noon
    inTown,
    pack: new Set(),
    asked: [], popups: [], offers: [], rewards: [], rep: [], hud: [], started: [], ended: [], claims: [],
  };
  const svc = service !== undefined ? service : online ? {
    account: () => 'acct',
    opened: new Set(),
    claim: async (b) => {
      st.claims.push(b);
      const k = `${b.line}:${b.step}`;
      if (!svc.opened.has(k)) { svc.opened.add(k); return { ok: true, data: { opened: true } }; }
      return { ok: true, data: { witnessed: true } };
    },
  } : null;
  const bridge = createQuestBridge({
    data: {
      readListTable: (n) => { try { return readFileSync(join(ROOT, 'vendor/dfu-quests/Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } },
      getQuestSourceLines: (n) => questSource(n, questlinesOn()),
    },
    classicSeconds: () => st.s,
    skySeconds: () => st.skyNoon === false ? st.s : Math.floor(st.s / DAY) * DAY + 12 * 3600,
    worldSeconds: () => st.s,
    isPlayerInTown: () => st.inTown,
    questlineService: svc,
    playerEntity: { name: 'Hero', level, gender: 'female', career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: new Array(35).fill(30) },
    showChoice: (q, message, choices, respond) => st.asked.push({ quest: q.questName, message, choices, respond }),
    showPopup: (q, tokens) => st.popups.push({ quest: q?.questName, text: (tokens ?? []).map((t) => t.text ?? '').join('\n') }),
    giveItemToPlayer: (item) => st.pack.add(item),
    carriesQuestItem: (res) => !!res && st.pack.has(res.daggerfallUnityItem),
    releaseQuestItem: (_uid, res) => { if (res) st.pack.delete(res.daggerfallUnityItem); },
    offerReward: (q, item) => st.rewards.push({ quest: q?.questName ?? null, item }),
    onQuestlineOffer: (o) => st.offers.push(o),
    changeReputation: (fid, amount) => st.rep.push([fid, amount]),
    addHUDText: (t) => st.hud.push(t),
    onQuestStarted: (q) => {
      st.started.push(q.questName);
      for (const task of q.tasks.values()) for (const a of task.actions) if (WORLD_ACTIONS.has(a.constructor?.typeName)) a.isComplete = true;
    },
    onQuestEnded: (q) => st.ended.push({ name: q.questName, success: !!q.questSuccess, outcome: q.ql?.outcome ?? null }),
  });
  const tick = (n = 1) => { for (let i = 0; i < n; i++) bridge.tick(1); };
  const settle = () => new Promise((r) => setImmediate(r));
  const running = (name) => [...bridge.machine.quests.values()].find((q) => q.questName === name && !q.questComplete && !q.questTombstoned) ?? null;
  const any = (name) => [...bridge.machine.quests.values()].filter((q) => q.questName === name);
  const click = (q) => { for (const r of q.resources.values()) if (r.isPerson) r.setPlayerClicked(); };
  const clickOne = (q, sym) => { for (const r of q.resources.values()) if (r.isPerson && r.symbol?.name === sym) r.setPlayerClicked(); };
  const kill = (q) => {
    for (const r of q.resources.values()) if (r.isFoe) {
      r.incrementKills(r.spawnCount ?? 5);
      for (const item of r.itemQueue ?? r.items ?? []) st.pack.add(item);
    }
  };
  const answer = (i) => { const a = st.asked.shift(); if (!a) return null; a.respond(i); return a; };
  const advance = (sec) => { st.s += sec; };
  return { bridge, st, svc, tick, settle, running, any, click, clickOne, kill, answer, advance, runner: bridge.questlines.runner };
}

/** The acts a quest's script waits on: [[kind, n], ...]. */
export function actsOf(q) {
  const out = [];
  for (const task of q.tasks.values()) for (const a of task.actions) if (a.constructor?.typeName === 'QlAct') out.push([a.kind, a.count]);
  return out;
}

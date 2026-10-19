// LANE LAW: every sheeted quest DRIVEN on the real bridge (the real machine, the real layer, the patched scripts as the
// game reads them with the switch on): random walks over the script's own events - a trigger task forced (a click, a
// kill, a pickup), a running clock run out, a prompt / ask / promptmulti answered at random, `pick one of` rolled - until
// the quest ends. Each walk records what DFU said (questSuccess, whether GivePc paid) and what the layer settled.
//   node drive.mjs [WALKS=60] [QUEST...]
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { SHEET_FAMILIES, sheetFor } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { holds, isStamped } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { questActionsExtensionTemplates } = await import(`${SNAP}/src/systems/quest/questActionsExtension.js`);
const { isGoldPieces } = await import(`${SNAP}/src/systems/inventory.js`);
const { goldFactor } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);

const origWarn = console.warn; const origLog = console.log;
const quiet = (fn) => { console.warn = () => {}; console.log = () => {}; try { return fn(); } finally { console.warn = origWarn; console.log = origLog; } };

loadTables();
setPref('questlines', true);
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
let seed = 12345;
const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return (seed >>> 8) / 16777216; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

function makeBridge(log) {
  const skills = new Array(35).fill(10); skills[29] = 60; skills[31] = 40;
  const carried = log.carried;
  const b = createQuestBridge({
    data: {
      readListTable: (name) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${name}.txt`), 'utf8'); } catch { return null; } },
      getQuestSourceLines: (name) => questSource(name, true),
    },
    classicSeconds: () => log.now, worldSeconds: () => log.now, nowSeconds: () => log.now,
    playerEntity: { name: 'Hero', level: 8, gender: 'male', career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills },
    getReputation: () => 0,
    carriesQuestItem: (r) => carried.has(r),
    giveItemToPlayer: (item) => { log.given.push(item); },
    showPrompt: (q, m, respond) => { const y = rnd() < 0.5; log.events.push(`prompt ${m?.id}:${y ? 'yes' : 'no'}`); respond(y); },
    showChoice: (q, m, choices, respond) => { const i = Math.floor(rnd() * choices.length); log.events.push(`ask ${m?.id}:${i}`); respond(i); },
    showPromptMulti: (q, m, buttons, respond) => { const bt = pick(buttons); log.events.push(`multi ${m?.id}:${bt}`); respond(bt); },
    changeReputation: (fid, amount, propagate) => log.rep.push({ fid, amount, propagate }),
    changeLegalRep: (amount) => log.legal.push(amount),
    offerReward: (q, item) => log.rewards.push(item),
    onQuestlineOffer: (o) => log.offers.push(o),
    addHUDText: () => {},
  });
  for (const t of questActionsExtensionTemplates()) b.machine.registerAction(t);
  return b;
}

const NATURAL = new Set(['WhenTask', 'QlAct', 'KilledFoe']);
const TRIGGER_FORCEABLE = (a) => a.isTriggerCondition && !NATURAL.has(a.typeName);
function instrument(quest, log) {
  for (const r of quest.resources.values()) {
    if (r.isPlace && !r._wrapped) { r._wrapped = true; r.isPlayerHere = () => log.at === r.symbol.name; }
    if (r.isClock && !r._wrapped) { r._wrapped = true; const st = r.startTimer.bind(r); r.startTimer = () => { r._started = true; return st(); }; const sp = r.stopTimer.bind(r); r.stopTimer = () => { if (!r.clockFinished) r._started = false; return sp(); }; }
  }
  for (const task of quest.tasks.values()) {
    for (const a of task.actions) {
      if (a._wrapped) continue;
      a._wrapped = true;
      if (!a.isTriggerCondition) {
        const up = a.update.bind(a);
        a.update = (c) => { try { return up(c); } catch (e) { (quest._actErr ??= []).push(`${a.typeName}: ${e?.message}`); a.setComplete?.(); } };
        continue;
      }
      if (NATURAL.has(a.typeName)) continue;
      a.checkTrigger = () => { if (a._force) { a._force = false; return true; } return false; };
    }
  }
}

function walk(name) {
  const log = { now: 1000, events: [], rep: [], legal: [], rewards: [], offers: [], given: [], carried: new Set(), rewardMoments: [], endingMoments: [] };
  const bridge = quiet(() => makeBridge(log));
  const L = bridge.questlines;
  const sheet = sheetFor(name);
  // wrap the layer's two moments to see what held then
  const origReward = L.reward.bind(L), origEnding = L.ending.bind(L);
  L.reward = () => {};
  const machine = bridge.machine;
  // the bridge's deps closures call questlines?.reward - patch through the object it holds
  const probe = { carries: (r) => log.carried.has(r) };
  L.reward = (q, item, res) => {
    const before = item ? item.stackCount : null;
    const heldNow = (sheet.outcomes ?? []).filter((o) => holds(q, o.on, probe)).map((o) => o.id);
    const wasPaid = q.ql?.paid;
    const r = origReward(q, item, res);
    log.rewardMoments.push({ heldNow, gold: item && isGoldPieces(item) ? [before, item.stackCount] : null, wasPaid, letter: res?.itemName === 'letter', success: q.questSuccess });
    return r;
  };
  L.ending = (q) => {
    const heldNow = (sheet.outcomes ?? []).filter((o) => holds(q, o.on, { ...probe, ending: true })).map((o) => o.id);
    const r = origEnding(q);
    log.endingMoments.push({ heldNow, success: q.questSuccess, outcome: q.ql?.outcome ?? null, paid: q.ql?.paid });
    return r;
  };
  let quest;
  try { quest = quiet(() => machine.startQuestByName(name, 0)); } catch (e) { return { error: `start: ${e.message}` }; }
  if (!quest) return { error: 'start: null' };
  if (!isStamped(quest)) return { error: 'not stamped' };
  instrument(quest, log);
  const tick = (n = 1) => { for (let i = 0; i < n; i++) { log.now += 60; quiet(() => { machine.tick(); L.look(); }); } };
  tick(2);
  for (let step = 0; step < 160 && !quest.questComplete; step++) {
    if (quest.questTombstoned) break;
    instrument(quest, log);
    const cands = [];
    for (const task of quest.tasks.values()) {
      if (task.dropped || task.getTriggerValue()) continue;
      const forceable = task.actions.filter((a) => !a.isComplete && TRIGGER_FORCEABLE(a));
      if (forceable.length) cands.push(['task', task, forceable]);
    }
    for (const r of quest.resources.values()) {
      if (r.isClock && (r.clockEnabled || r._started) && !r.clockFinished) cands.push(['clock', r]);
      if (r.isFoe && (r.killCount | 0) < 12) cands.push(['kill', r]);
      if (r.isItem && !log.carried.has(r)) cands.push(['item', r]);
      if (r.isItem && r.actionWatching && !r.useClicked) cands.push(['use', r]);
      if (r.isPlace && log.at !== r.symbol.name) cands.push(['go', r]);
    }
    if (!cands.length) { tick(3); if (!quest.questComplete) { log.events.push('stuck'); break; } continue; }
    const c = pick(cands);
    if (c[0] === 'task') { const a = pick(c[2]); a._force = true; log.events.push(`force ${c[1].symbol.name}:${a.typeName}`); }
    else if (c[0] === 'clock') { const r = c[1]; if (r.clockEnabled) r.remainingTimeInSeconds = 0; else { r.clockEnabled = false; r.clockFinished = true; r.remainingTimeInSeconds = 0; quest.getTask(r.symbol)?.start(); } log.events.push(`clock ${r.symbol.name}`); }
    else if (c[0] === 'kill') { c[1].killCount = (c[1].killCount | 0) + 1; log.events.push(`kill ${c[1].symbol.name}`); }
    else if (c[0] === 'use') { c[1].useClicked = true; log.events.push(`use ${c[1].symbol.name}`); }
    else if (c[0] === 'go') { log.at = c[1].symbol.name; log.events.push(`go ${c[1].symbol.name}`); }
    else { log.carried.add(c[1]); log.events.push(`carry ${c[1].symbol.name}`); }
    tick(4);
  }
  tick(6);
  const outcome = quest.ql?.outcome ?? null;
  const o = (sheet.outcomes ?? []).find((x) => x.id === outcome) ?? null;
  return {
    complete: quest.questComplete, success: quest.questSuccess, tombstoned: quest.questTombstoned, outcome, failure: o ? !!o.failure : null,
    paid: quest.ql?.paid, moved: quest.ql?.moved, offers: log.offers.length, layerRep: log.rep.filter((r) => r.propagate === false).length,
    opened: [...(quest.ql?.opened ?? [])], doneObj: [...(quest.ql?.done ?? [])], failedObj: [...(quest.ql?.failed ?? [])],
    actErr: quest._actErr ?? [], rewardMoments: log.rewardMoments, endingMoments: log.endingMoments, events: log.events, choices: { ...(quest.ql?.choices ?? {}) },
  };
}

const args = process.argv.slice(2);
const WALKS = Number(args[0]) || 60;
const only = args.slice(1).map((s) => s.toUpperCase());
const SHARD = Number(process.env.SHARD ?? 0), SHARDS = Number(process.env.SHARDS ?? 1);
const names = SHEET_FAMILIES.flatMap((f) => f.sheets.map((s) => s.quest)).filter((n) => !only.length || only.includes(n.toUpperCase())).filter((_, i) => i % SHARDS === SHARD);
const fs = await import('node:fs');
const outFile = new URL(`./drive2_out_${SHARD}.jsonl`, import.meta.url);
if (!only.length) fs.writeFileSync(outFile, '');
for (const name of names) {
  const res = [];
  const t0 = Date.now();
  for (let i = 0; i < WALKS; i++) { res.push(walk(name)); if (Date.now() - t0 > 90_000) break; }
  res.ms = Date.now() - t0;
  if (!only.length) fs.appendFileSync(outFile, JSON.stringify({ name, res }) + '\n');
  else fs.writeFileSync(new URL('./drive_out.json', import.meta.url), JSON.stringify({ [name]: res }));
  summarize(name, res);
}
function summarize(name, res) {
  const sheet = sheetFor(name);
  const errs = res.filter((r) => r.error);
  const done = res.filter((r) => r.complete);
  const reached = new Map();
  for (const r of done) reached.set(r.outcome, (reached.get(r.outcome) ?? 0) + 1);
  const succFail = done.filter((r) => r.success && r.failure === true);
  const failOk = done.filter((r) => !r.success && r.failure === false);
  const unsettled = done.filter((r) => r.outcome == null);
  const never = (sheet.outcomes ?? []).filter((o) => !reached.has(o.id)).map((o) => o.id);
  const twice = done.filter((r) => r.offers > 1 || r.rewardMoments.filter((m) => m.gold && m.gold[0] !== m.gold[1]).length > 1);
  const catchAll = new Set((sheet.outcomes ?? []).filter((o) => o.on && Object.keys(o.on).length === 1 && o.on.ended === true).map((o) => o.id));
  const overlap = new Set(done.flatMap((r) => r.endingMoments.slice(0, 1).map((m) => m.heldNow.filter((x) => !catchAll.has(x))).filter((h) => h.length > 1).map((h) => h.join('+'))));
  const of = (id) => (sheet.outcomes ?? []).find((o) => o.id === id);
  const payDiff = done.filter((r) => r.outcome && r.rewardMoments.some((m) => m.gold && Math.abs(m.gold[1] - Math.max(1, Math.round(m.gold[0] * goldFactor(of(r.outcome))))) > 1));
  const objNeverOpen = (sheet.objectives ?? []).filter((o) => !done.some((r) => r.opened.includes(o.id) || r.doneObj.includes(o.id))).map((o) => o.id);
  const objNeverDone = (sheet.objectives ?? []).filter((o) => !done.some((r) => r.doneObj.includes(o.id))).map((o) => o.id);
  const succUndone = done.filter((r) => r.success && r.failure === false && (sheet.objectives ?? []).some((o) => !o.optional && r.opened.includes(o.id) && !r.doneObj.includes(o.id))).length;
  const goldOdd = done.filter((r) => r.rewardMoments.some((m) => m.gold && m.gold[0] !== m.gold[1]) && r.outcome && (sheet.outcomes.find((o) => o.id === r.outcome)?.pay === 'standard'));
  origLog(`${name}: [${res.ms}ms] walks ${res.length} err ${errs.length}${errs.length ? ` (${errs[0].error})` : ''} done ${done.length} reached ${[...reached].map(([k, v]) => `${k}:${v}`).join(' ')}`
    + `${never.length ? ` | NEVER ${never.join(',')}` : ''}${succFail.length ? ` | SUCCESS->FAILURE ${succFail.length}` : ''}${failOk.length ? ` | FAIL->OK ${failOk.length}` : ''}`
    + `${unsettled.length ? ` | UNSETTLED ${unsettled.length}` : ''}${twice.length ? ` | TWICE ${twice.length}` : ''}${overlap.size ? ` | OVERLAP ${[...overlap].join(' ')}` : ''}${goldOdd.length ? ` | GOLD-SCALED-ON-STANDARD ${goldOdd.length}` : ''}${payDiff.length ? ` | GOLD-NOT-BY-OUTCOME ${payDiff.length}` : ''}${objNeverOpen.length ? ` | OBJ-NEVER-OPEN ${objNeverOpen}` : ''}${objNeverDone.length ? ` | OBJ-NEVER-DONE ${objNeverDone}` : ''}${succUndone ? ` | SUCCESS-WITH-OPEN-OBJ ${succUndone}` : ''}`);
}

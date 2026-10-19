// BRANCH: a patched quest begun on DFU's script (before the deploy, or with the switch off offline and carried online)
// is refused by every receiver whose read is the patched script - online the switch is forced on, so the receiver's own
// parse (machine.parseQuestShape -> getQuestSourceLines -> questlineLines) always carries the branch: 'mismatch'.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { prepareQuestShare, receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { QUESTLINES_PREF } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { makeBridge } = await import('./harness.mjs');
console.warn = () => {};
for (const name of ['R0C11Y26', 'M0B50Y09', 'A0C01Y03']) {
  const s = makeBridge({ on: false });                     // the sharer's quest began on DFU's script
  const quest = s.bridge.machine.startQuestByName(name, 0);
  s.bridge.machine.tick();
  const env = prepareQuestShare(s.bridge.machine, quest.uid);
  const r = makeBridge({ on: true });                      // the receiver online: the switch forced on
  const got = receiveSharedQuest(r.bridge.machine, r.bridge.questLists, name, env.data, {});
  setPref(QUESTLINES_PREF, false);
  const r2 = makeBridge({ on: false });
  const got2 = receiveSharedQuest(r2.bridge.machine, r2.bridge.questLists, name, env.data, {});
  console.log(`${name}: sharer's copy DFU's (ql=${JSON.stringify(quest.ql)}) -> receiver with the switch on: ${JSON.stringify({ ok: got.ok, reason: got.reason ?? null })}; with it off: ${JSON.stringify({ ok: got2.ok, reason: got2.reason ?? null })}`);
}

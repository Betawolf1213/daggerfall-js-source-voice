// Q4: the switch through the real features/prefs/settings code, offline and online.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
globalThis.location = { search: '' };
const { getPref, setPref, _resetForTests, PREF_DEFAULTS } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { FEATURES, FEATURE_PREF_DEFAULTS, FEATURE_PREF_ONLINE } = await import(`${SNAP}/src/systems/features.js`);
const { onlineForcedPref, ONLINE_FORCED_PREFS } = await import(`${SNAP}/src/systems/online/onlineLane.js`);
const { questlinesOn, startStamp } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { questlineLines } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
const { questSource } = await import(`${SNAP}/test/qlSources.mjs`);
const row = FEATURES.find((f) => f.id === 'questlines');
console.log('row control', JSON.stringify(row.control), 'default', FEATURE_PREF_DEFAULTS.questlines, 'online', FEATURE_PREF_ONLINE.questlines, 'PREF_DEFAULTS', PREF_DEFAULTS.questlines);
_resetForTests();
console.log('OFFLINE fresh shelf: getPref', getPref('questlines'), 'questlinesOn', questlinesOn(), 'forced?', onlineForcedPref('questlines'));
setPref('questlines', false);
console.log('OFFLINE after the player turns it off: questlinesOn', questlinesOn(), 'stamp', startStamp(), 'shelf', mem.get([...mem.keys()][0]));
const base = questSource('M0B50Y09', false).join('\n');
console.log('OFFLINE off: M0B50Y09 read as shipped?', questlineLines('M0B50Y09', base.split('\n')).join('\n') === base);
setPref('questlines', true);
console.log('OFFLINE back on: questlinesOn', questlinesOn(), 'patched?', questlineLines('M0B50Y09', base.split('\n')).join('\n') !== base);
setPref('questlines', false);
globalThis.location = { search: '?online' };
console.log('ONLINE with the shelf saying off: forced', onlineForcedPref('questlines'), 'getPref', getPref('questlines'), 'questlinesOn', questlinesOn(), 'stamp', !!startStamp(), 'patched?', questlineLines('M0B50Y09', base.split('\n')).join('\n') !== base);
setPref('questlines', false);
console.log('ONLINE a write of false: getPref', getPref('questlines'));
try {
  const { tileStates } = await import(`${SNAP}/src/ui/enhanced/enhancedMenu.js`);
  const st = tileStates(row);
  console.log('ONLINE settings tile:', JSON.stringify({ labels: st.labels, at: st.at, locked: st.locked }));
  globalThis.location = { search: '' };
  const st2 = tileStates(row);
  console.log('OFFLINE settings tile:', JSON.stringify({ labels: st2.labels, at: st2.at, locked: st2.locked }));
} catch (e) { console.log('tileStates not importable in node:', e.message.split('\n')[0]); }

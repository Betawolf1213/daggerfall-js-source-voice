// LANE UI: the Quests tab, driven for real - the snapshot's own pause door (ui/pauseDoor.js openPauseFlow) over a
// questLog carrying every state the branch draws: stamped quests (done / open / failed / optional / "or" / hidden
// objectives, a choice, an outcome), an unlogged stamped quest, an archived one, rewards waiting (one with a named
// piece, rolled by the real producer), the questlines as the REAL line runner rows them (running, waiting, locked,
// done, a failed step), and guilds' ladders as the REAL qlLadders reads them (a ladder of many rungs).
const { openPauseFlow } = await import('/src/ui/pauseDoor.js');
const { createLineRunner } = await import('/src/systems/questlines/qlLineRunner.js');
const { ladders } = await import('/src/systems/questlines/qlLadders.js');
const { GUILDS } = await import('/src/systems/guild/guilds.js');
const { rollRewardChoice } = await import('/src/systems/questlines/qlRewards.js');
const tm = await import('/src/systems/textManager.js');
const { setPref } = await import('/src/systems/uiPrefs.js');

export async function setLanguage(lang) {
  if (lang && lang !== 'en') {
    const csv = await (await fetch(`/locales/${lang}/Port_Strings.csv`)).text();
    tm.registerLocale({ code: lang, name: lang });
    tm.patchLocaleTable(lang, 'Port_Strings', tm.parseStringTableCsv(csv));
  }
  tm.setLocale(lang || 'en');
}

const msg = (id, ...lines) => ({ id, parentQuest: null, getTextTokens: () => lines.flatMap((l, i) => (i ? [{ text: '', formatting: 'newline' }, { text: l, formatting: 'text' }] : [{ text: l, formatting: 'text' }])) });

/** The lines, as the runner rows them: a fake machine holding QLIS02 (running), records restored in every state. */
function lineRows({ online = false, level = 9 } = {}) {
  const machine = { quests: new Map([[1, { questName: 'QLIS02', questComplete: false, questTombstoned: false }]]), questsToInvoke: [] };
  const runner = createLineRunner({ machine, ctx: { level: () => level, online: () => online, nowSeconds: () => 1000 } });
  runner.restore({
    // a line under way: its second step running
    introSea: { step: 1, done: false, wait: 0, outcomes: { 0: { id: 'done', text: 'You berthed at Sentinel after a league under sail.' } } },
    // a line between steps
    introGear: { step: 1, done: false, wait: 5000, outcomes: { 0: { id: 'done', text: 'The armourer set a stone in your blade.' } } },
    // a line finished
    introTables: { step: 2, done: true, wait: 0, outcomes: { 0: { id: 'done', text: 'You won a hand of cards.' }, 1: { id: 'done', text: 'You beat the regular at The King’s Gambit, and he bought the next round.' } } },
    // a line whose current step FAILED (the runner offers it again a day later: wait set, no outcome recorded)
    introRoad: { step: 0, done: false, wait: 87400, outcomes: {} },
    // an endgame line begun online, now offline
    burningDoors: { step: 2, done: false, wait: 0, outcomes: { 0: { id: 'done', text: 'Ysolde told you who writes the breaches.' }, 1: { id: 'sealed', text: 'You brought the rite-book sealed.' } } },
  });
  return runner.rows();
}

/** A guild's ladder as the bridge hands it (questBridge.js ladderRows): ten rungs, quests by rank. */
function ladderRows({ rank = 3 } = {}) {
  const fg = GUILDS.FightersGuild;
  const names = ['M0B00Y06', 'M0B00Y07', 'M0B00Y16', 'M0B11Y18', 'M0B1XY01', 'M0B20Y02', 'M0B21Y19', 'M0B30Y03', 'M0B40Y05', 'M0B50Y09', 'M0B60Y10', 'M0B70Y11', 'M0B80Y12', 'M0B90Y13'];
  const rows = names.map((name, i) => ({ name, membership: 'M', minReq: Math.min(9, Math.floor(i * 0.7)) }));
  const pools = new Map([[fg.guildGroup, rows]]);
  const history = { M0B00Y06: 'done', M0B00Y16: 'rescued' };
  return ladders({ memberships: { [fg.guildGroup]: { guild: fg.name, rank } }, pools, history })
    .map((l) => ({ ...l, name: 'The Fighters Guild', rungs: l.rungs.map((r) => ({ ...r, quests: r.quests.map((q) => ({ ...q, title: `Quest ${q.name}` })) })) }));
}

function offers() {
  const a = rollRewardChoice({ seed: 991, level: 12, tier: 3, entity: null });
  const b = rollRewardChoice({ seed: 4242, level: 20, tier: 4, entity: null });
  b[1].item.name = 'Ysolde’s Ember-Rod'; b[1].named = true;
  return [
    { id: 1, questName: 'M0B00Y06', title: 'Wild Animal', outcome: 'done', tier: 3, pieces: a },
    { id: 2, questName: 'QLBD05', title: 'The Caged Broker', outcome: 'guild', tier: 4, pieces: b },
  ];
}

export function buildLog({ off = false, online = false, level = 9, longText = false, rank = 3 } = {}) {
  const long = longText ? ' - and on the way, mind the warding stones the Underking’s servants left in the third gallery of the crypt beneath Castle Sentinel, the ones the scholar warned you of' : '';
  const ql = (o) => (off ? null : o);
  return {
    active: [
      { id: '11', name: 'Wild Animal', questName: 'M0B00Y06', messages: [msg(1010, 'Lord Kain has a beast loose in his house.', 'He wants it dead.')], steps: [{ stepID: 0, messageID: 1010, time: 1 }], clocks: [], clockSeconds: 200000,
        ql: ql({ tier: 1, family: 'FightersGuild', objectives: [{ id: 'slay', text: 'Kill the wild beast loose in Lord Kain’s house', state: 'done' }, { id: 'report', text: `Return to Lord Kain in Daggerfall for your pay${long}`, state: 'open' }], choices: [], outcome: null }) },
      { id: '12', name: 'The Lich’s Relic', questName: 'C0B10Y15', messages: [msg(1011, 'The temple’s relic was stolen.')], steps: [{ stepID: 0, messageID: 1011, time: 2 }], clocks: [],
        ql: ql({ tier: 2, family: 'HolyOrders', objectives: [
          { id: 'retrieve', text: 'Take the sacred relic from Fang Lair, where the lich Vanus guards it', state: 'done' },
          { id: 'lich', text: 'Destroy Vanus, the relic’s maker', state: 'open', optional: true },
          { id: 'report', text: 'Return the relic to the Prior in Daggerfall', state: 'open' },
          { id: 'tovamp', text: 'Bring the notes to the clan', state: 'open', any: 'deliver' },
          { id: 'toguild', text: 'Bring the notes to the Guild', state: 'open', any: 'deliver' },
          { id: 'guard', text: 'Keep the acolyte alive', state: 'failed' },
          { id: 'never', text: 'HIDDEN OBJECTIVE TEXT', state: 'hidden' }],
        choices: [{ branch: 'fate', text: 'The lich’s apprentice begs for his life.', choice: 'Let him go' }], outcome: null }) },
      { id: '13', name: 'The Emperor’s Letter', questName: 'S0000001', messages: [msg(1012, 'A letter, sealed.')], steps: [{ stepID: 0, messageID: 1012, time: 3 }], clocks: [],
        ql: ql({ tier: 2, family: 'MainQuest', objectives: [{ id: 'proof', text: 'Find proof of what really became of Prince Greklith', state: 'open' }], choices: [], outcome: { id: 'failed', text: 'The trail went cold.', failure: true } }) },
    ],
    unlogged: off ? [] : [{ id: '20', name: 'A Silent Summons', questName: 'S0000988', ql: { tier: 2, objectives: [{ id: 'read', text: 'Read the letter the courier brought', state: 'open' }], choices: [], outcome: null } }],
    finished: [[{ formatting: 'highlight', text: 'Rat Problem completed at 9 Morning Star:' }, { text: 'You killed the rats.', formatting: 'text' }, { text: '', formatting: 'newline' }, { text: 'Outcome: The cellar is clean.', formatting: 'text' }]],
    ended: [], hidden: [], shelved: [],
    lines: off ? [] : lineRows({ online, level }),
    ladders: off ? [] : ladderRows({ rank }),
  };
}

export function open({ off = false, online = false, level = 9, longText = false, offersOn = true, rank = 3 } = {}) {
  setPref('questlines', !off);
  globalThis.__taken = [];
  let waiting = offersOn && !off ? offers() : [];
  const log = buildLog({ off, online, level, longText, rank });
  globalThis.__lastLog = log;
  const clean = {
    offers: () => waiting.map((o) => ({ ...o })),
    takeOffer: (id, i) => { globalThis.__taken.push([id, i]); waiting = waiting.filter((o) => o.id !== id); },
    clearFinished() {}, removeFinished() {}, hide(id) { log.hidden.push(String(id)); }, unhide(id) { log.hidden = log.hidden.filter((x) => x !== String(id)); }, canAbandon: () => true, abandon: () => ({ ok: true }), canRestart: () => true, restart: () => ({ ok: true }),
  };
  globalThis.__slot = null;
  return openPauseFlow((w) => { globalThis.__slot = w; }, { at: 'quests', questLog: () => log, journalClean: () => clean, exitToMenu() {}, textLines: () => null, quickSave() {}, quickLoad() {} });
}

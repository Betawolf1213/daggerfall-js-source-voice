// STAR8 (bible/11-Multiplayer/Starfall.md section 7): THE THIRTEENTH OF FROSTFALL - the Starfall's questline. Its shape
// and its law on both ends (the first star and three more witnessed, the Starwarden on the three); its season - the line
// begins only while the Witches' Festival is staged (the hub's live event, net/liveEventNow.js, inside the Starfall's
// window) and the window draws none not begun outside it (UI-Calm's law), while a begun line's star steps wait for the
// next Festival and the rest go on; the hub's word kept by the socket that said it; a quest's foe named and stood as a
// woman (`ql name _foe_ <Name> female`); the three stars' step run through the real bridge to its outcome.
// tools/mutants/star8.json.
import '../../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QL_LINES, lineById, lineOpens, opensWords } from '../../../src/systems/questlines/qlLines.js';
import { createLineRunner, NEED_CHECKS, STEP_GAP_S } from '../../../src/systems/questlines/qlLineRunner.js';
import { QL_SERVICE_LINES, QL_WITNESS_KINDS, qlStepClaimed, QL_TITLES, qlTitleBit } from '../../../src/net/questlineClaims.js';
import { ACT_KINDS } from '../../../src/systems/questlines/qlActs.js';
import { liveEventNow, setLiveEventNow } from '../../../src/net/liveEventNow.js';
import { STARFALL_FROM_MS, STARFALL_TO_MS, STARFALL_EVENT_KINDS } from '../../../src/net/starfall/starfallLaw.js';
import { TITLES } from '../../../src/net/identityToken.js';
import { TITLE_TEXT } from '../../../src/ui/playerBadge.js';
import { sheetFor } from '../../../src/systems/questlines/qlSheets.js';
import { setPref } from '../../../src/systems/uiPrefs.js';
import { QUESTLINES_PREF } from '../../../src/systems/questlines/qlLaw.js';
import { freshState } from '../../../src/systems/questlines/qlState.js';
import { GENDERS } from '../../../src/characters/nameHelper.js';
import { packMachine, QUEST_FILES } from '../../qlSources.mjs';
import { HAS_ARENA2, loadMaps } from '../../arena1Data.mjs';

const IN = STARFALL_FROM_MS + 86_400_000;   // a day into the Festival's window
const FESTIVAL = Object.freeze({ kind: STARFALL_EVENT_KINDS[0], at: STARFALL_FROM_MS });
const LINE = lineById('thirteenthFrostfall');
const read = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');

/** A machine the runner drives (ql12_lines.test.js's), and the runner on a clock both of its own. */
function runnerAt({ level = 10, online = true, ms = IN } = {}) {
  setPref(QUESTLINES_PREF, true);
  let uid = 1;
  const machine = {
    quests: new Map(), questsToInvoke: [], scheduled: [],
    scheduleQuestByName(name) { const q = { uid: uid++, questName: name, questComplete: false, questTombstoned: false }; machine.questsToInvoke.push(q); machine.scheduled.push(name); return q; },
    tick() { for (const q of machine.questsToInvoke.splice(0)) machine.quests.set(q.uid, q); },
    end(name) { for (const q of machine.quests.values()) if (q.questName === name && !q.questComplete) { q.questComplete = true; q.questSuccess = true; return q; } return null; },
  };
  const clock = { s: 1000, ms };
  const service = { claim: async () => ({ ok: true, data: { why: 'unpaid' } }), guest: () => false };
  const runner = createLineRunner({ machine, service, nowMs: () => clock.ms, ctx: { level: () => level, online: () => online, nowSeconds: () => clock.s } });
  // a dozen lines may open at once, an hour apart (LINES-17): step until this one has, or a day has gone
  const step = () => { runner.look(); machine.tick(); };
  const settle = () => { for (let i = 0; i < 24 && !runner.lineState(LINE.id); i++) { step(); clock.s += STEP_GAP_S; } };
  return { runner, machine, clock, step, settle };
}
const row = (runner) => runner.rows().find((r) => r.id === LINE.id) ?? null;

test('STAR8 THE LINE: the Festival\'s, tier 3 - from level 6, online, a registered account, while the Starfall runs; its four steps, the star steps needing the Starfall; the service witnesses the first star and three more and pays the Starwarden on the three, its last witnessed step - nothing on the client\'s word (mutants: a need, the opener, a witness, the title\'s step)', () => {
  assert.ok(LINE);
  assert.deepEqual([LINE.group, LINE.tier], ['festival', 3]);
  assert.deepEqual({ ...LINE.opens }, { level: 6, online: true, account: true, event: 'starfall' });
  assert.deepEqual(LINE.steps.map((s) => [s.quest, s.title(), [...(s.needs ?? [])]]), [
    ['QLTF01', 'Music in the Woods', ['starfall']], ['QLTF02', 'The Coven on the Bluff', []],
    ['QLTF03', 'Three Stars', ['starfall']], ['QLTF04', 'What the Thread Is Worth', []],
  ]);
  assert.deepEqual([LINE.title(), LINE.giver()], ['The Thirteenth of Frostfall', 'Morwen of Glenmoril, a witch of Hircine’s coven']);
  assert.equal(QL_LINES.indexOf(LINE), QL_LINES.findIndex((l) => l.id === 'oldCoil') + 1, 'after the Coil, before the introductions');
  const law = QL_SERVICE_LINES.thirteenthFrostfall;
  assert.deepEqual({ ...law, witness: { ...law.witness } }, { steps: 4, witness: { 0: 'star', 2: 'stars3' }, title: 'starwarden', titleAt: 2 });
  assert.ok(QL_WITNESS_KINDS.includes('star') && QL_WITNESS_KINDS.includes('stars3'));
  assert.deepEqual([0, 1, 2, 3].map((s) => qlStepClaimed('thirteenthFrostfall', s)), [true, false, true, false], 'the spindle and its fate are the client\'s');
  assert.equal(ACT_KINDS['star-held'], 'endgame', 'a receipt the service holds');
  assert.deepEqual([QL_TITLES.at(-1), TITLES.at(-3) /* PIN MOVED (WITCH1): the festival's two after it */, qlTitleBit('starwarden'), TITLE_TEXT.starwarden], ['starwarden', 'starwarden', 32, 'Starwarden']);
});

test('STAR8 THE WITNESSES on the service: a star held - a row of stars_held inside the line\'s window - and the third such row for the three (mutants: the table, the offset)', () => {
  const sql = read('server-account/src/questlines.js');
  assert.match(sql, /star: `\(SELECT MIN\(s\.at\) FROM stars_held s WHERE s\.account = \?1 AND \$\{WINDOW\('s'\)\}\)`,/);
  assert.match(sql, /stars3: `\(SELECT s\.at FROM stars_held s WHERE s\.account = \?1 AND \$\{WINDOW\('s'\)\} ORDER BY s\.at, s\.star LIMIT 1 OFFSET 2\)`,/);
});

test('STAR8 THE SEASON: the line begins only while the Festival is staged inside the Starfall\'s window - the hub\'s word and the clock both; out of season the window draws it not at all, in season locked with what it waits on, and it begins (mutants: the opener unread; the window\'s law; the event\'s word)', () => {
  setLiveEventNow(null);
  const probe = (o = {}) => ({ level: () => 10, online: () => true, registered: () => true, lineDone: () => false, need: (n) => !!NEED_CHECKS[n]?.(IN), ...o });
  assert.equal(lineOpens(LINE, probe()), false, 'no Festival staged');
  assert.equal(lineOpens({ ...LINE, steps: [{ quest: 'QLTF02', title: () => 'x' }] }, probe()), false, 'the opener its own, whatever the first step needs');
  assert.equal(opensWords(LINE, probe()), 'Opens during the Witches’ Festival.', 'said once, though the first step needs it too');
  const out = runnerAt();
  out.settle();
  assert.equal(out.runner.lineState(LINE.id), null, 'not begun');
  assert.equal(row(out.runner), null, 'UI-Calm: nothing drawn that cannot be taken');
  setLiveEventNow(FESTIVAL, 'hub');
  try {
    assert.equal(lineOpens(LINE, probe()), true);
    assert.equal(lineOpens(LINE, probe({ level: () => 5 })), false, 'level 6');
    assert.equal(opensWords(LINE, probe({ level: () => 5 })), 'Opens at level 6.');
    assert.equal(NEED_CHECKS.starfall(STARFALL_FROM_MS - 1), false, 'before its window');
    assert.equal(NEED_CHECKS.starfall(STARFALL_TO_MS), false, 'after it');
    assert.equal(NEED_CHECKS.starfall(IN), true);
    const low = runnerAt({ level: 5 });
    low.step();
    assert.deepEqual([row(low.runner).state, row(low.runner).opens], ['locked', 'Opens at level 6.'], 'in season: drawn, and what it waits on said');
    const r = runnerAt();
    r.settle();
    assert.ok(r.machine.scheduled.includes('QLTF01'), 'it begins');
    // out of the window with the word still standing: nothing begins
    const late = runnerAt({ ms: STARFALL_TO_MS + 1 });
    late.settle();
    assert.equal(late.runner.lineState(LINE.id), null);
    assert.equal(row(late.runner), null);
  } finally { setLiveEventNow(null, 'hub'); }
});

test('STAR8 A BEGUN LINE OUT OF SEASON: drawn, its star step waiting for the next Festival and saying so; the spindle\'s steps go on without it (mutants: a star step begun out of season; the words)', () => {
  setLiveEventNow(FESTIVAL, 'hub');
  const r = runnerAt();
  try {
    r.settle();
    r.runner.ended(r.machine.end('QLTF01'), { id: 'met', failure: false });
  } finally { setLiveEventNow(null, 'hub'); }
  r.clock.s += STEP_GAP_S;
  r.step();
  assert.ok(r.machine.scheduled.includes('QLTF02'), 'the Bluff is no star: it begins out of season');
  r.runner.ended(r.machine.end('QLTF02'), { id: 'wound', failure: false });
  r.clock.s += STEP_GAP_S;
  r.step();
  assert.ok(!r.machine.scheduled.includes('QLTF03'), 'three stars wait for stars');
  const w = row(r.runner);
  assert.deepEqual([w.state, w.opens], ['waiting', 'Opens during the Witches’ Festival.']);
  setLiveEventNow(FESTIVAL, 'hub');
  try { r.step(); } finally { setLiveEventNow(null, 'hub'); }
  assert.ok(r.machine.scheduled.includes('QLTF03'), 'the next Festival: it begins');
});

test('STAR8 THE HUB\'S WORD: kept as said, frozen; cleared by the socket that said it and by no other - a hub socket made anew says the event before the old one\'s leave is heard (mutants: any socket clears it)', () => {
  setLiveEventNow({ kind: 'witchfest', at: 5, extra: 1 }, 'a');
  assert.deepEqual(liveEventNow(), { kind: 'witchfest', at: 5 });
  assert.ok(Object.isFrozen(liveEventNow()));
  setLiveEventNow({ kind: 'witchfest', at: 6 }, 'b');
  setLiveEventNow(null, 'a');
  assert.deepEqual(liveEventNow(), { kind: 'witchfest', at: 6 }, 'the old socket\'s leave is no word');
  setLiveEventNow(null, 'b');
  assert.equal(liveEventNow(), null);
  setLiveEventNow({ kind: 7 }, 'c');
  assert.equal(liveEventNow(), null, 'no kind, no event');
  assert.match(read('src/net/online.js'), /this\.liveEvent = ev;\n\s+setLiveEventNow\(ev, this\);/, 'the hub socket\'s one door writes it');
});

test('STAR8 `ql name` NAMES A FOE: every one of it wears the name and a class foe stands as the gender named - the Coven on the Bluff\'s Spinner and her sisters are women; the name and the gender ride a save; a monster takes a name and no gender, with a warning (mutants: the gender unread; the foe unnamed; the class guard)', () => {
  const lines = ['Quest: __QLFOE', 'DisplayName: A Foe', 'QRC:', 'QuestorOffer:  [1000]', '<ce> Will you?', '', 'RefuseQuest:  [1001]', '<ce> No.', '', 'AcceptQuest:  [1002]', '<ce> Yes.', '',
    'QBN:', 'Foe _spinner_ is Sorcerer', 'Foe _sisters_ is 3 Nightblade', 'Foe _rat_ is Giant_rat', '',
    '\tql name _spinner_ The_Spinner female', '\tql name _sisters_ Sister_of_the_Bluff female', '\tql name _rat_ Old_Whiskers female'];
  const m = packMachine({ getQuestSourceLines: () => lines, questlinesStamp: () => freshState() });
  const quest = m.startQuestByName('__QLFOE');
  const warn = console.warn; const warned = [];
  console.warn = (s) => warned.push(String(s));
  try { m.tick(); } finally { console.warn = warn; }
  const foe = (name) => quest.getFoe({ name });
  assert.deepEqual([foe('spinner').displayName, foe('spinner').gender], ['The Spinner', GENDERS.Female]);
  assert.deepEqual([foe('sisters').displayName, foe('sisters').gender, foe('sisters').spawnCount], ['Sister of the Bluff', GENDERS.Female, 3]);
  assert.equal(foe('rat').displayName, 'Old Whiskers');
  assert.equal(foe('rat').gender, GENDERS.Male, 'a monster stands as DFU stands every monster');
  assert.ok(warned.some((s) => s.includes('ql name: _rat_ takes no gender here')), warned.join('\n'));
  const m2 = packMachine({ getQuestSourceLines: () => lines, questlinesStamp: () => freshState() });
  m2.restoreSaveData(m.getSaveData());
  const back = m2.quests.get(quest.uid).getFoe({ name: 'spinner' });
  assert.deepEqual([back.displayName, back.gender], ['The Spinner', GENDERS.Female], 'they ride the save');
});

test('STAR8 THE SCRIPTS: the Glenmoril Coven met on arrival each time, and nobody stood at an open-air coven; at the Bluff the Spinner and her three sisters come out of the dark once - created on the first arrival by a task never cleared, so a return brings no second coven - stood as women, the spindle on the Spinner; Morwen\'s meetings latched once; the spindle\'s fate handed over by `get item`, never `give pc` (a give is the quest\'s pay - qlLayer.js reward); each way its own outcome and its sheet\'s pay, standing and named piece (mutants: a way\'s outcome; the spindle given as pay; the ambush unlatched)', () => {
  const text = (q) => readFileSync(QUEST_FILES.get(q).path, 'utf8');
  for (const q of ['QLTF01', 'QLTF02', 'QLTF04']) {
    assert.match(text(q), /^Place _glenmoril_ permanent GlenmorilCoven$/m, q);
    assert.match(text(q), /^\tpc at _glenmoril_ set _atcoven_( saying \d{4})?$/m, q);
    assert.doesNotMatch(text(q), /place (?:npc|foe|item) \S+ at _(?:glenmoril|bluff)_/, `${q}: a coven has no quest marker`);
  }
  assert.match(text('QLTF01'), /^\tql act star-held 1$/m);
  assert.match(text('QLTF01'), /^_met_ task:\n\twhen _held_ and _atcoven_$/m);
  assert.match(text('QLTF03'), /^\tql act star-held 3$/m);
  const bluff = text('QLTF02');
  for (const re of [/^Place _bluff_ permanent BluffCoven$/m, /^Foe _spinner_ is Sorcerer$/m, /^Foe _sisters_ is 3 Nightblade$/m, /^\tql name _spinner_ The_Spinner female$/m,
    /^\tql name _sisters_ Sister_of_the_Bluff female$/m, /^\tgive item _spindle_ to _spinner_$/m,
    /^_arrived_ task:\n\twhen _courier_ and _atbluff_\n\tstart task _ambush_$/m,
    /^_ambush_ task:\n\tcreate foe _spinner_ every 0 minutes 1 times with 100% success msg 1019\n\tcreate foe _sisters_ every 0 minutes 1 times with 100% success$/m,
    /^_back_ task:\n\twhen _hasspindle_ and _atcoven_\n\tstart task _home_$/m]) assert.match(bluff, re);
  assert.doesNotMatch(bluff, /clear _ambush_|clear _home_/, 'never cleared: never again');
  assert.match(text('QLTF04'), /^_arrived_ task:\n\twhen _courier_ and _atcoven_\n\tstart task _met_$/m);
  const worth = text('QLTF04');
  assert.doesNotMatch(worth, /give pc _spindle_/, 'the spindle is no pay');
  assert.equal([...worth.matchAll(/^\tget item _spindle_ saying 10\d\d$/gm)].length, 2, 'handed over for the Guild and for Arkay');
  const outcomes = (q) => Object.fromEntries(sheetFor(q).outcomes.map((o) => [o.id, [o.pay, { ...(o.standing ?? {}) }, o.named?.name ?? null]]));
  assert.deepEqual(outcomes('QLTF02'), { unwound: ['greater', {}, null], wound: ['lesser', { The_Glenmoril_Witches: 3 }, null], failed: ['none', {}, null] });
  assert.deepEqual(outcomes('QLTF04'), {
    burned: ['lesser', { The_Glenmoril_Witches: 10 }, 'Morwen\'s Hunt-Charm'], guild: ['greater', {}, 'Starglass Rod'],
    temple: ['standard', { The_Order_of_Arkay: 5 }, 'Thread-Cutter'], failed: ['none', {}, null],
  });
  for (const [q, ways] of [['QLTF02', ['_unwound_', '_wound_']], ['QLTF04', ['_burned_', '_guild_', '_temple_']]]) {
    for (const w of ways) assert.match(text(q), new RegExp(`^\\toutcome ${w}$`, 'm'), `${q} ${w}`);
  }
});

test('STAR8 THREE STARS, through the real bridge: the step waits on three stars held and settles `held`, paying a choice of three; a star short ends nothing (mutants: the count)', async () => {
  const { createQuestBridge } = await import('../../../src/scenes/quest/questBridge.js');
  const { questSource } = await import('../../qlSources.mjs');
  const { questlinesOn } = await import('../../../src/systems/questlines/qlLaw.js');
  setPref(QUESTLINES_PREF, true);
  const offers = [];
  const bridge = createQuestBridge({
    data: { readListTable: () => null, getQuestSourceLines: (n) => questSource(n, questlinesOn()) },
    classicSeconds: () => 0, questlineService: null,
    playerEntity: { name: 'Hero', level: 8, gender: 'male', career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: new Array(35).fill(30) },
    onQuestlineOffer: (o) => offers.push(o), offerReward: () => {},
  });
  const q = bridge.machine.startQuestByName('QLTF03');
  for (let i = 0; i < 3; i++) bridge.machine.tick();
  bridge.questlines.act('star-held', 2);
  for (let i = 0; i < 6; i++) bridge.machine.tick();
  assert.equal(q.questComplete, false, 'two stars are not three');
  bridge.questlines.act('star-held', 1);
  for (let i = 0; i < 6; i++) bridge.machine.tick();
  assert.ok(q.questComplete);
  assert.equal(q.ql.outcome, 'held');
  assert.equal(offers.length, 1, 'the choice of three');
});

test('STAR8 THE COVENS ARE OPEN AIR, gated on ARENA2_PATH: the Glenmoril Coven (Ilessan Hills) and the Coven on the Bluff (Daggerfall) stand in the player\'s MAPS.BSA as covens - one block of the wilds each, no building and no dungeon, so no quest marker - under the location ids the quest table names them by (GlenmorilCoven 0xc358, BluffCoven 0xc360); the scripts meet them by arrival for that reason', { skip: HAS_ARENA2 ? false : 'no ARENA2 (sh tools/fetch-data.sh, then ARENA2_PATH)' }, () => {
  const maps = loadMaps();
  const places = read('vendor/dfu-quests/Tables/Quests-Places.txt');
  for (const [region, name, place, block] of [['Ilessan Hills', 'Glenmoril Coven', 'GlenmorilCoven', 'WITCAA00.RMB'], ['Daggerfall', 'Coven on the Bluff', 'BluffCoven', 'WITCAA04.RMB']]) {
    const loc = maps.getLocationByName(region, name);
    assert.ok(loc, `${name} in ${region}`);
    const id = Number.parseInt(new RegExp(`^${place},\\s*(0x[0-9a-f]+),`, 'm').exec(places)?.[1] ?? 'NaN', 16);
    assert.equal(loc.exterior.exteriorData.locationId, id, `${place} is ${name}`);
    assert.equal(loc.mapTableData.locationType, 13, 'a coven');
    assert.equal(loc.hasDungeon, false, 'no dungeon');
    assert.deepEqual(loc.exterior.buildings ?? [], [], 'no building');
    assert.deepEqual([...loc.exterior.exteriorData.blockNames], [block]);
  }
});

/** A world of three places (questplaces.test.js's crafted shape): a town the player starts in, and the two covens by
 *  the location ids the quest table names them by - open air, one block each, no building, no dungeon. */
function covenWorld() {
  const loc = (index, name, mapId, locationId, locationType) => ({
    loaded: true, regionIndex: 0, regionName: 'Testshire', name, locationIndex: index, hasDungeon: false,
    mapTableData: { mapId, locationType, dungeonType: 255 },
    exterior: { buildings: [], recordElement: { header: { x: 0, y: 0 } }, exteriorData: { locationId, width: 1, height: 1, blockNames: ['WITCAA00.RMB'] } },
    dungeon: null,
  });
  // and a town of the region's with a Mages Guild hall, a temple and a house, a quest marker in each (QLTF04's other two
  // ways, and the house a person of a faction is homed in before the script stands it - Person.cs AssignHomeTown)
  const flat = (record) => ({ textureArchive: 199, textureRecord: record, xPos: 40, yPos: 8, zPos: 60 });
  const hall = { buildingType: 11, factionId: 40, nameSeed: 778, locationId: 0, sector: 0, quality: 9 };
  const temple = { buildingType: 14, factionId: 82, nameSeed: 779, locationId: 0, sector: 0, quality: 9 };
  const house = { buildingType: 17, factionId: 0, nameSeed: 780, locationId: 0, sector: 0, quality: 9 }, house2 = { ...house, buildingType: 18, nameSeed: 781 };
  const marked = { interior: { blockFlatObjectRecords: [flat(11)] } };
  const blocks = { 'TOWNAA00.RMB': { position: 5000, rmbBlock: { fldHeader: { buildingDataList: [hall, temple, house, house2], otherNames: null }, subRecords: [marked, marked, marked, marked] } } };
  const town = { ...loc(3, 'Bigtown', 103, 0x401, 0) };
  town.exterior = { ...town.exterior, buildings: [hall, temple], exteriorData: { ...town.exterior.exteriorData, blockNames: ['TOWNAA00.RMB'] } };
  const locations = [loc(0, 'Hometown', 100, 0x400, 0), loc(1, 'Glenmoril Coven', 101, 0xc358, 13), loc(2, 'Coven on the Bluff', 102, 0xc360, 13), town];
  const region = { name: 'Testshire', locationCount: 4, mapTable: locations.map((l) => ({ mapId: l.mapTableData.mapId, locationType: l.mapTableData.locationType, dungeonType: 255 })) };
  const waves = [];
  const world = {
    maps: { regionCount: 1, getRegion: () => region, getLocation: (r, l) => locations[l] ?? null, getRmbBlockName: (l, x, y) => l.exterior.exteriorData.blockNames[y * l.exterior.exteriorData.width + x], readLocationIdFast: (r, l) => locations[l].exterior.exteriorData.locationId, getClimateIndex: () => 231 },
    getRmbBlockName: (l, x, y) => l.exterior.exteriorData.blockNames[y * l.exterior.exteriorData.width + x],
    // FACTION.TXT's two records the Guild's buyer and Arkay's priest are made of (#40, #82), as the reader hands them
    getFactionData: (id) => ({ 40: { id: 40, name: 'The Mages Guild', type: 2, parent: 0, face: -1, race: -1, flat1: 0, flat2: 0 }, 82: { id: 82, name: 'The Order of Arkay', type: 9, parent: 21, face: -1, race: -1, flat1: 0, flat2: 0 } })[id] ?? null,
    getBlock: (name) => blocks[name] ?? null, currentLocation: () => world._current, currentRegionIndex: () => 0, currentLocationIndex: () => world._current.locationIndex,
    currentRegionName: () => 'Testshire', isPlayerInLocationRect: () => true, playerInside: () => null, playerPixel: () => ({ x: 100, y: 100 }),
    buildingNameOpts: () => ({}), discoverLocation: () => {}, addNote: () => {},
    createFoeGameObjects: (foe, count) => { waves.push([foe.symbol.name, count, foe.gender, foe.displayName]); return Array.from({ length: count }, () => ({ foe })); },
    tryPlaceFoe: () => true,
    _current: locations[0], waves,
    at: (i) => { world._current = locations[i]; },
  };
  return world;
}

test('STAR8 THE BLUFF AND THE COVEN, run on the machine: the letter, then at the Bluff the Spinner and her three sisters come once - women by name - and a return brings no second coven; the Spinner slain and the spindle taken, Morwen meets the player at the Glenmoril Coven\'s fire once and asks; the way taken settles its outcome (mutants: the ambush unlatched; the meeting unlatched; the gender)', async () => {
  const { questSource } = await import('../../qlSources.mjs');
  const world = covenWorld();
  const clock = { s: 10_000 };
  const asked = [];
  let carrying = false;
  const m = packMachine({
    world, nowSeconds: () => clock.s, getQuestSourceLines: (n) => questSource(n, true), questlinesStamp: () => freshState(),
    showPopup: () => {}, showChoice: (q, msg, choices, respond) => asked.push({ choices, respond }),
    carriesQuestItem: (r) => r.symbol?.name === 'spindle' && carrying,
  });
  const quest = m.startQuestByName('QLTF02');
  assert.ok(quest, 'it parses and starts on a world');
  const tick = (n = 3) => { for (let i = 0; i < n; i++) m.tick(); };
  tick();
  world.at(2);
  tick();
  assert.deepEqual(world.waves, [], 'before the letter, the Bluff is only a place');
  clock.s += 4 * 3600;
  world.at(0); tick();
  world.at(2); tick(6);
  assert.deepEqual(world.waves, [['spinner', 1, GENDERS.Female, 'The Spinner'], ['sisters', 3, GENDERS.Female, 'Sister of the Bluff']], 'the coven comes once, women all');
  world.at(0); tick();
  world.at(2); tick(6);
  assert.equal(world.waves.length, 2, 'a return brings no second coven');
  quest.getFoe({ name: 'spinner' }).incrementKills(1);
  carrying = true;
  tick();
  world.at(1); tick();
  assert.equal(asked.length, 1, 'Morwen asks at the fire');
  assert.equal(asked[0].choices.length, 2);
  world.at(0); tick();
  world.at(1); tick();
  assert.equal(asked.length, 1, 'once: her question stands until it is answered');
  asked[0].respond(1);
  tick(4);
  assert.ok(quest.questComplete, 'ended');
  assert.equal(quest.ql.outcome, 'wound', 'given whole');
});

test('STAR8 WHAT THE THREAD IS WORTH, run on the machine: Morwen asks at the coven\'s fire once her letter has come; the Guild\'s way hands the spindle over (no pay - the quest has not settled), stands the buyer in the Guild\'s hall, and settles `guild` when the spindle is carried to the buyer (mutants: the spindle given as pay; the buyer never stood)', async () => {
  const { questSource } = await import('../../qlSources.mjs');
  const world = covenWorld();
  const clock = { s: 10_000 };
  const asked = [], given = [];
  let carrying = false;
  const m = packMachine({
    world, nowSeconds: () => clock.s, getQuestSourceLines: (n) => questSource(n, true), questlinesStamp: () => freshState(),
    showPopup: () => {}, showChoice: (q, msg, choices, respond) => asked.push({ choices, respond }),
    carriesQuestItem: (r) => r.symbol?.name === 'spindle' && carrying,
    giveItemToPlayer: (item) => given.push(item),
  });
  const quest = m.startQuestByName('QLTF04');
  assert.ok(quest, 'it parses and starts on a world');
  const tick = (n = 3) => { for (let i = 0; i < n; i++) m.tick(); };
  world.at(1); tick();
  assert.equal(asked.length, 0, 'before her letter, the fire is only a fire');
  clock.s += 4 * 3600;
  world.at(0); tick();
  world.at(1); tick();
  assert.equal(asked.length, 1);
  assert.equal(asked[0].choices.length, 3, 'burn, the Guild, Arkay');
  const hallSd = quest.getResource({ name: 'hall' }).siteDetails;
  const buyerStands = () => [hallSd.selectedMarker, ...(hallSd.questSpawnMarkers ?? [])].some((mk) => (mk?.targetResources ?? []).some((sym) => sym?.name === 'mage'));
  assert.equal(buyerStands(), false, 'nobody waits at the hall before the Guild is chosen');
  asked[0].respond(1);
  tick();
  assert.equal(given.length, 1, 'the spindle in the pack');
  assert.equal(quest.ql.paid ?? false, false, 'no pay: nothing is settled yet');
  assert.equal(quest.questComplete, false);
  const mage = quest.getPerson({ name: 'mage' });
  assert.equal(hallSd.locationName, 'Bigtown');
  assert.equal(buyerStands(), true, 'the buyer stands in the Guild\'s hall');
  carrying = true;
  mage.hasPlayerClicked = true;
  tick(4);
  assert.ok(quest.questComplete);
  assert.equal(quest.ql.outcome, 'guild', 'sold to the Mages Guild');
});

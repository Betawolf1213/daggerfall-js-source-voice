// FIELD BUGS 2026-10-14 QUEST-HOME (Discord: "Currently on the final part of the quest to 'Travel to the second town
// named by the poisonmaker'. However coming to the location it has NPCs, but NO Houses, except for a player house which
// is marked as the residence I need for the quest, but it's just.. a player house..?" - Buckinghouse Farmstead, its one
// house "The Mesmerized Residence" on the map, its door "To <owner>'s home", Vote up, Vote down; the quest the Dark
// Brotherhood's The Acceptance Test, L0A01L00 - the poisonmaker its Chemist, the second town `_mansion_`'s). HOME1's rule - no quest
// picks a player's online home as its residence (systems/quest/place.js, the collector's isPlayerHome) - read the homes
// of the towns this page had ASKED, one at a time at a town's gate or door, and a quest's `remote` residence is picked in
// a town its player has never walked into: the rule held in the player's own town alone, and the farmstead's only house,
// a player's home, was the quest's. The layouts read every online boot already makes (WD3) now names every town's homes
// by building (server-account/src/homes.js homeLayouts' `homes`), the registry keeps it (systems/onlineHomes.js
// hearEveryTown / homeStands), and the quest machine's isPlayerHome asks it (scenes/world.js). Every fixture is the
// producer's: the real Worker over node:sqlite with every migration applied, the client's own door to it, the real
// registry, and the real quest machine choosing its residence in a region of synthetic blocks (test/fb1004dTowns.mjs).
// bible/01-Overview/Field-Bugs-2026-10-14.md QUEST-HOME; 06-Systems/Online-Arc.md HOME1.
import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { standService, sessionStorageOf, T0 } from './accountDb.mjs';
import { realmJoinAt } from './realmSeat.mjs';
import { accountHomes, SESSION_KEY } from '../src/net/accountClient.js';
import { createOnlineHomes } from '../src/systems/onlineHomes.js';
import { HOME_KEYS_MAX, HOME_LAYOUTS_MAX } from '../src/net/homeLaw.js';
import { QuestMachine } from '../src/systems/quest/machine.js';
import { SITE_TYPES } from '../src/systems/quest/place.js';
import { makeBuildingKey } from '../src/systems/talkTopics.js';
import { BUILDING_TYPES } from '../src/world/buildingNames.js';
import { loadTables, rmbBlock, town, worldOf, questScript } from './fb1004dTowns.mjs';
import { seeded } from './fb1004dArena.mjs';

loadTables();
const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const { House1, House3, Alchemist } = BUILDING_TYPES;
const FARM = 7101, VILLAGE = 7102, CITY = 7103;
const HOUSE = makeBuildingKey(0, 0, 0);   // each town's one house: block (0,0), record 0 - BuildingDirectory's 1<<24

/** The service with Aldric's home at the farmstead's only house and Mara's in a city, and a guest's client door to it. */
async function served(t) {
  let now = T0;
  t.mock.method(Date, 'now', () => now * 1000);
  const S = await standService();
  const aldric = await S.registered('Aldric'), mara = await S.registered('Mara');
  const farm = await S.seatHome(aldric, { mapId: FARM, buildingKey: HOUSE, region: 17, price: 42000 });
  assert.equal(farm.status, 200, JSON.stringify(farm.body));
  now += 60;
  for (const buildingKey of [0x10203, 0x101]) assert.equal((await S.seatHome(mara, { mapId: CITY, buildingKey, region: 17, price: 42000 })).status, 200);
  const api = accountHomes({ fetch: S.fetch, storage: sessionStorageOf(SESSION_KEY, await S.guest()) });
  return { S, api, aldric, farm, tick: () => { now += 60; } };
}

/** The registry as scenes/world.js builds it, its town asks counted - a farmstead never walked into is never asked. */
function registry(api) {
  const asked = [];
  const homes = createOnlineHomes({ api: { ...api, town: (mapId, c) => { asked.push(mapId); return api.town(mapId, c); } }, character: () => null });
  return { homes, asked };
}

test('QUEST-HOME the service and the registry: the layouts read every boot makes names each town\'s homes by building, ascending, to any session - a guest\'s too - beside the towns\' layouts; the registry keeps it, and a building is a home in a town this page never asked (homeAt, the old knowledge, knows nothing there); a town asked adds its own fresher word; a read from a service before it changes nothing; the next read replaces the last (mutants: the read names no homes; the boot\'s word not kept; homeStands asks the asked towns alone)', async (t) => {
  const { S, api, aldric, farm, tick } = await served(t);
  const read = await api.layouts();
  assert.equal(read.ok, true, JSON.stringify(read));
  assert.deepEqual(read.data.homes, [[FARM, [HOUSE]], [CITY, [0x101, 0x10203]]], 'every town holding a home, each home by building, ascending');
  assert.deepEqual(read.data.towns.map(([mapId]) => mapId), [FARM, CITY], 'the towns\' layouts as before (WD3)');
  assert.equal(HOME_KEYS_MAX, 3 * HOME_LAYOUTS_MAX);

  const { homes, asked } = registry(api);
  assert.equal(homes.homeStands(FARM, HOUSE), false, 'before the boot\'s read: nothing known');
  assert.equal(homes.hearEveryTown(read.data.homes), true);
  assert.equal(homes.homeStands(FARM, HOUSE), true, 'the farmstead\'s house is a player\'s home - in a town this page never asked');
  assert.equal(homes.homeAt(FARM, HOUSE), null, 'which homeAt, the towns asked one at a time, never knew');
  assert.deepEqual(asked, [], 'no town was asked');
  assert.equal(homes.homeStands(FARM, makeBuildingKey(0, 0, 1)), false, 'a building nobody owns is none');
  assert.equal(homes.homeStands(VILLAGE, HOUSE), false, 'nor the same key in a town holding no home');
  assert.equal(homes.homeStands(CITY, 0x101) && homes.homeStands(CITY, 0x10203), true);

  // a home bought after the boot's read, in a town asked at its gate: the town's own answer says it
  tick();
  assert.equal((await S.seatHome(aldric, { mapId: VILLAGE, buildingKey: HOUSE, region: 17, price: 42000 })).status, 200);
  assert.equal(homes.homeStands(VILLAGE, HOUSE), false, 'unknown until a read says it');
  assert.equal(await homes.ensure(VILLAGE), true);
  assert.equal(homes.homeStands(VILLAGE, HOUSE), true, 'the town asked adds its own word');

  // an answer from a service before it (no `homes`) is not taken - what was known stands
  assert.equal(homes.hearEveryTown(undefined), false);
  assert.equal(homes.homeStands(FARM, HOUSE), true);
  // the farmstead's home sold: the next read replaces the last
  tick();
  assert.equal((await S.call('/v1/homes/release', { mapId: FARM, buildingKey: HOUSE, realm: await realmJoinAt(S.env, aldric.secret, farm.character) }, aldric.secret)).status, 200);
  const again = await api.layouts();
  assert.deepEqual(again.data.homes, [[VILLAGE, [HOUSE]], [CITY, [0x101, 0x10203]]]);
  assert.equal(homes.hearEveryTown(again.data.homes), true);
  assert.equal(homes.homeStands(FARM, HOUSE), false, 'sold, and read again: a house again');
});

/** The village's buildings: room for every Place of the quest without the farmstead's house. */
const VILLAGE_TYPES = [House1, House1, House1, House1, House3, Alchemist, Alchemist];
/** The reporter's quest - the Dark Brotherhood's The Acceptance Test (L0A01L00): a letter sends the player to the
 *  poisonmaker (`_apothecary_`, a Chemist, at `Place _apo_ remote apothecary`), who sends them on to `_mansion_`
 *  (`Place _mansion_ remote house1`) "in __mansion_", the second town, to poison `_npc_`'s wine; its three people's
 *  homes are generated residences too (Person.cs AssignHomeTown, `Place _x_home_ remote house`). Taken under `seed`
 *  with the player out in the wilds of a region of two towns - Buckinghouse Farmstead, whose one house is `HOUSE`, and a
 *  village (VILLAGE_TYPES) - by the real machine handed `isPlayerHome`.
 *  Answers each Place's site. */
function acceptanceTest(isPlayerHome, seed) {
  const blocks = new Map([
    ['FARM.RMB', rmbBlock('FARM.RMB', [{ type: House1 }])],
    ['VILLAGE.RMB', rmbBlock('VILLAGE.RMB', VILLAGE_TYPES.map((type) => ({ type })))],
  ]);
  const farm = town({ name: 'Buckinghouse Farmstead', locationIndex: 0, mapId: FARM, type: 3, grid: ['FARM.RMB'] });   // DFRegion.LocationTypes.HomeFarms
  const village = town({ name: 'Aldleigh', locationIndex: 1, mapId: VILLAGE, grid: ['VILLAGE.RMB'] });
  // the MAPS directory each names (SelectRemoteTownSite's pre-check for a house1 and an apothecary)
  farm.exterior.buildings = [{ buildingType: House1, nameSeed: 11, factionId: 0 }];
  village.exterior.buildings = VILLAGE_TYPES.map((buildingType, i) => ({ buildingType, nameSeed: 20 + i, factionId: 0 }));
  const world = { ...worldOf({ locations: [farm, village], blocks }), isPlayerHome };
  const machine = new QuestMachine({ nowSeconds: () => 0, world, getReputation: () => 0, changeReputation: () => {} });
  const say = console.log, warn = console.warn; console.log = () => {}; console.warn = () => {};
  let quest;
  try { quest = machine.parseQuestForLists(questScript('L0A01L00'), 0, { rolls: seeded(seed) }); } finally { console.log = say; console.warn = warn; }
  assert.ok(quest, `seed ${seed}: The Acceptance Test is made`);
  machine.startQuestImmediate(quest);
  const sites = [...quest.resources.values()].filter((r) => r.isPlace).map((p) => ({ name: p.symbol.name, ...p.siteDetails }));
  return { sites, machine };
}
const inTheHome = (s) => s.siteType === SITE_TYPES.Building && s.mapId === FARM && s.buildingKey === HOUSE;

test('QUEST-HOME the quest: the reporter\'s own, the Dark Brotherhood\'s The Acceptance Test (L0A01L00) - its poisonmaker\'s second town\'s residence and its people\'s homes - is never set in a player\'s home in a town its player never walked into: the farmstead\'s only house a player\'s, every draw sets them in the village, and the quest\'s rung opens no stranger\'s home to its player; with the towns asked alone (the old knowledge) the same draws set the quest in the home (mutants: the boot\'s word unread by the quest; the service names no homes)', async (t) => {
  const { api } = await served(t);
  const { homes } = registry(api);
  homes.hearEveryTown((await api.layouts()).data.homes);
  const asked = createOnlineHomes({ api, character: () => null });   // the towns asked alone - none
  let inHome = 0, mansionInHome = 0;
  for (let seed = 1; seed <= 24; seed++) {
    // the quest machine's seam, as scenes/world.js hands it
    const { sites, machine } = acceptanceTest((mapId, buildingKey) => homes.homeStands(mapId, buildingKey) ?? false, seed);
    assert.deepEqual(sites.map((s) => s.name).sort(), ['apo', 'apothecary_home', 'darkbmember_home', 'mansion', 'npc_home']);
    assert.deepEqual(sites.filter(inTheHome).map((s) => s.name), [], `seed ${seed}: nothing of the quest in the farmstead's home`);
    const mansion = sites.find((s) => s.name === 'mansion');
    assert.deepEqual([mansion.locationName, mansion.siteType], ['Aldleigh', SITE_TYPES.Building], 'the second town\'s residence is the village\'s');
    assert.match(mansion.buildingName, /^The \S+ Residence$/);
    assert.equal(machine.isActiveQuestBuilding(FARM, HOUSE, House1), false, 'no quest is set in the home, so its door opens to nobody by the quest\'s rung');
    const old = acceptanceTest((mapId, buildingKey) => !!asked.homeAt(mapId, buildingKey), seed).sites.filter(inTheHome);
    if (old.length) inHome++;
    if (old.some((s) => s.name === 'mansion')) mansionInHome++;
  }
  assert.ok(inHome > 0, 'with the towns asked alone, the farmstead\'s home was the quest\'s');
  assert.ok(mansionInHome > 0, '...and the poisonmaker\'s second town\'s residence among them - the report');
});

test('QUEST-HOME the wiring: the boot\'s read hands every town\'s homes to the registry before the layouts\' pins are read from it, and the quest machine\'s isPlayerHome asks homeStands - its every town - while the collector keeps HOME1\'s exclusion (mutants: the read not handed on; isPlayerHome back on homeAt)', () => {
  const w = src('src/scenes/world.js');
  const take = w.slice(w.indexOf('function takeHomeLayouts(heard) {'));
  assert.ok(take.indexOf('onlineHomes?.hearEveryTown(heard.data?.homes);') > 0
    && take.indexOf('onlineHomes?.hearEveryTown(heard.data?.homes);') < take.indexOf('_serverLayoutRecords = towns'), 'the boot\'s read is handed on as it lands');
  assert.match(w, /isPlayerHome: \(mapId, buildingKey\) => onlineHomes\?\.homeStands\(mapId, buildingKey\) \?\? false,/);
  assert.match(src('src/systems/quest/place.js'), /if \(world\.isPlayerHome\?\.\(location\.mapTableData\?\.mapId, buildingKey\)\) continue;/);
});

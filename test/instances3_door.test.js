// INSTANCES (2026-10-15, Mac: "The player approaches, should be met with an enhanced UI popup that lets them select
// public or instanced (if applicable)" - where: "Dungeons with your quest", "Privateer's Hold", "Building interiors";
// bible/11-Multiplayer/Instances.md): THE DOOR. Its law (systems/instancePlaces.js) over the real QuestMachine and Place,
// its page half (scenes/instanceDoor.js) with the real ChoiceWindow and the real digests, the modes host's funnel
// executed from its source, and the sizes a quest's markers and an instance build at (world/smallerDungeons.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
import { QuestMachine } from '../src/systems/quest/machine.js';
import { Place, SITE_TYPES } from '../src/systems/quest/place.js';
import { loadQuestTables } from '../src/systems/quest/tables.js';
import { relayQuestOnline } from '../src/systems/quest/questRepair.js';
import { questsAtSite, openerQuestOf, questMountsHere, questDungeonWhole, partnerInstances, instanceOffer } from '../src/systems/instancePlaces.js';
import { createInstanceDoor, INSTANCE_TEXT } from '../src/scenes/instanceDoor.js';
import { dungeonSizeFor, smallerDungeonsStateNow, SMALLER_DUNGEONS_STATE, ONLINE_DUNGEONS_STATE, onlineDungeonSize } from '../src/world/smallerDungeons.js';
import { isPrivateersHold, HOLD_ONCE_TEXT } from '../src/systems/startDungeon.js';
import { PRIVATEERS_HOLD_MAP_ID } from '../src/world/dungeonTextures.js';
import { RDB_RESOURCE_TYPES } from '../src/formats/blocksFile.js';
{
  const dir = new URL('../vendor/dfu-quests/Tables/', import.meta.url);
  const sources = {};
  for (const f of readdirSync(dir)) if (f.endsWith('.txt')) sources[f.replace('.txt', '')] = readFileSync(new URL(f, dir), 'utf8').replace(/^﻿/, '');
  loadQuestTables(sources);
}
const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const hex = (s, bytes) => createHash('sha256').update(s).digest('hex').slice(0, bytes * 2);
const sym = (name) => ({ name, original: `_${name}_`, clone() { return sym(name); } });
const BARE_SRC = ['Quest: __INS', 'QRC:', 'Message:  1011', ' x', '', 'QBN:', 'variable _done_'];

/** A running quest of the real machine whose Place `crypt` names `site` (siteDetails as Place's own selects set them). */
function questAt(m, site) {
  const q = m.parseQuestForLists(BARE_SRC, 0, { rolls: () => 0 });
  m.startQuestImmediate(q);
  const p = new Place(q);
  p.symbol = sym('crypt');
  p.siteDetails = { siteType: site.siteType, mapId: site.mapId, buildingKey: site.buildingKey ?? 0, regionIndex: 3, locationName: 'Ruins', magicNumberIndex: 0, selectedMarker: { targetResources: null }, questSpawnMarkers: null, questItemMarkers: null };
  q.resources.set('crypt', p);
  return q;
}
const CRYPT = { siteType: SITE_TYPES.Dungeon, mapId: 52646490 };   // Ruins of The Hold of Coppering (Isle of Balfiera)
const SHOP = { siteType: SITE_TYPES.Building, mapId: 206728581, buildingKey: 131590 };

test('INSTANCES the door\'s law: a running quest whose Place names the site - a dungeon by its map id, a building by its key; the oldest opens the room; an ended, set-aside or moved one names none', () => {
  const m = new QuestMachine();
  assert.deepEqual(questsAtSite(m, CRYPT), []);
  const a = questAt(m, CRYPT), b = questAt(m, CRYPT), c = questAt(m, SHOP);
  assert.deepEqual(questsAtSite(m, CRYPT).map((q) => q.uid).sort(), [a.uid, b.uid].sort());
  assert.equal(openerQuestOf(m, CRYPT), a.uid < b.uid ? a : b, 'the oldest - two quests at one dungeon share one room');
  assert.deepEqual(questsAtSite(m, SHOP), [c]);
  assert.deepEqual(questsAtSite(m, { ...SHOP, buildingKey: 5 }), [], 'another building of the town');
  assert.deepEqual(questsAtSite(m, { siteType: SITE_TYPES.Building, mapId: CRYPT.mapId, buildingKey: 1 }), [], 'a dungeon Place names no building');
  assert.deepEqual(questsAtSite(m, { ...CRYPT, mapId: -CRYPT.mapId }), [], 'the map id read unsigned');
  c.resources.get('crypt').siteDetails.unseated = { buildingKey: SHOP.buildingKey };
  assert.deepEqual(questsAtSite(m, SHOP), [], 'RESEAT-GAPS: a site unseated from its key names none');
  a.questComplete = true;
  b.shelvedAt = 1;
  assert.deepEqual(questsAtSite(m, CRYPT), [], 'ended, set aside');
  assert.equal(openerQuestOf(m, CRYPT), null);
});

test('INSTANCES where a quest\'s things stand: online only in a dungeon whole; offline as DFU\'s frozen size builds. The whole public room is the fallback where no instance can be had', () => {
  assert.equal(questMountsHere({ online: true, builtSize: 'full' }), true);
  assert.equal(questMountsHere({ online: true, builtSize: 'medium' }), false);
  assert.equal(questMountsHere({ online: true, builtSize: 'small' }), false);
  assert.equal(questMountsHere({ online: false, builtSize: 'small' }), true);
  assert.equal(questDungeonWhole({ online: true, instanceOk: false, questHere: true }), true, 'Mac\'s first answer, the fallback');
  assert.equal(questDungeonWhole({ online: true, instanceOk: true, questHere: true }), false, 'the door chooses');
  assert.equal(questDungeonWhole({ online: true, instanceOk: false, questHere: false }), false);
  assert.equal(questDungeonWhole({ online: false, instanceOk: false, questHere: true }), false);
});

test('INSTANCES the sizes: online the quest\'s world and an instance ask for the dungeon whole; the public room keeps the world\'s size; a quest started online is stamped DFU\'s Disabled', () => {
  const loc = { name: 'Ruins of The Hold of Coppering', hasDungeon: true, mapTableData: { mapId: 52646490 }, dungeon: { blocks: Array.from({ length: 13 }, (_, i) => ({ blockName: `N${i}.RDB` })) } };
  assert.equal(onlineDungeonSize(loc), 'medium', 'the world builds it medium (the probe: its entrance walks into a cap)');
  assert.equal(dungeonSizeFor(loc, { online: true }), 'medium');
  assert.equal(dungeonSizeFor(loc, { online: true, whole: true }), 'full');
  assert.equal(dungeonSizeFor(loc, { online: false, whole: true, setting: true }), 'small', 'offline `whole` asks nothing - the settings and DFU\'s frozen size rule');
  assert.equal(smallerDungeonsStateNow(false, false, true, false), SMALLER_DUNGEONS_STATE.Disabled);
  assert.equal(smallerDungeonsStateNow(false, false, false, true), ONLINE_DUNGEONS_STATE, 'offline, the world\'s sizes asked for, as before');
});

test('INSTANCES the load\'s re-lay: a quest stamped at any size but the whole has its dungeon\'s markers enumerated again on the dungeon whole (its world asks so) and is stamped Disabled', () => {
  const m = new QuestMachine();
  const q = questAt(m, { siteType: SITE_TYPES.Dungeon, mapId: 4242 });
  const flat = (x) => ({ type: RDB_RESOURCE_TYPES.Flat, position: x, xPos: x, yPos: 0, zPos: 0, resources: { flatResource: { textureArchive: 199, textureRecord: 11 } } });
  const blockData = { 'N1.RDB': { position: 1000, rdbBlock: { objectRootList: [{ rdbObjects: [flat(1)] }] } }, 'N2.RDB': { position: 2000, rdbBlock: { objectRootList: [{ rdbObjects: [flat(2)] }] } } };
  const whole = { name: 'Ruins', regionIndex: 3, hasDungeon: true, mapTableData: { mapId: 4242 }, dungeon: { blocks: [{ blockName: 'N1.RDB', x: 0, z: 0 }, { blockName: 'N2.RDB', x: 1, z: 0 }] } };
  q.hooks = { ...(q.hooks ?? {}), world: { getBlock: (n) => blockData[n] ?? null, maps: { getRegion: () => ({ mapNameLookup: new Map([['Ruins', 0]]) }), getLocation: () => whole } } };
  q.smallerDungeonsState = ONLINE_DUNGEONS_STATE;
  assert.equal(relayQuestOnline(q), true);
  assert.equal(q.smallerDungeonsState, SMALLER_DUNGEONS_STATE.Disabled);
  assert.deepEqual(q.resources.get('crypt').siteDetails.questSpawnMarkers.map((k) => [k.dungeonX, k.markerID]), [[0, 1001], [1, 2002]], 'the whole dungeon\'s markers');
  assert.equal(relayQuestOnline(q), false, 'again: nothing');
});

test('INSTANCES a partner\'s instance at this door: a member inside this place (its pixel, a dungeon or this building) with an instance - one row an instance; a member away, elsewhere or in the public room is none', () => {
  const ins = '0123456789abcdef.89abcdef';
  const at = { px: 210, py: 99, in: 1, bk: null };
  const members = [
    { acct: 'a1', name: 'Ann', online: true, p: { px: 210, py: 99, in: 1, ins } },
    { acct: 'a2', name: 'Bo', online: true, p: { px: 210, py: 99, in: 1, ins } },
    { acct: 'a3', name: 'Cy', online: true, p: { px: 210, py: 99, in: 1 } },
    { acct: 'a4', name: 'Di', online: true, p: { px: 211, py: 99, in: 1, ins: 'fedcba9876543210.01234567' } },
    { acct: 'a5', name: 'Ed', online: false, p: { px: 210, py: 99, in: 1, ins: 'fedcba9876543210.01234567' } },
    { acct: 'a6', name: 'Fi', online: true, p: { px: 210, py: 99, in: 2, bk: 7, ins: 'fedcba9876543210.01234567' } },
  ];
  assert.deepEqual(partnerInstances(members, at), [{ acct: 'a1', name: 'Ann', owner: '0123456789abcdef', epoch: '89abcdef' }]);
  assert.deepEqual(partnerInstances(members, { px: 210, py: 99, in: 2, bk: 7 }).map((p) => p.name), ['Fi'], 'a building by its key');
  assert.deepEqual(partnerInstances(members, { px: 210, py: 99, in: 2, bk: 8 }), []);
  assert.deepEqual(partnerInstances(members, { px: 210, py: 99, in: 0 }), [], 'outdoors there is no instance');
});

test('INSTANCES what the door offers: offline or at an older relay nothing; a quest\'s place public or mine; the Hold mine alone; a partner\'s join; a place with nothing but its public room no popup', () => {
  const partners = [{ name: 'Ann', acct: 'a1', owner: '0123456789abcdef', epoch: '89abcdef' }];
  assert.equal(instanceOffer({ online: false, instanceOk: true, questHere: true }), null);
  assert.equal(instanceOffer({ online: true, instanceOk: false, questHere: true, isHold: true }), null);
  assert.deepEqual(instanceOffer({ online: true, instanceOk: true, questHere: true }), [{ kind: 'public' }, { kind: 'mine' }]);
  assert.deepEqual(instanceOffer({ online: true, instanceOk: true, isHold: true }), [{ kind: 'mine' }], 'HOLD-ONCE: never its public room');
  assert.deepEqual(instanceOffer({ online: true, instanceOk: true, partners }), [{ kind: 'public' }, { kind: 'join', name: 'Ann', acct: 'a1', owner: '0123456789abcdef', epoch: '89abcdef' }]);
  assert.equal(instanceOffer({ online: true, instanceOk: true }), null, 'no popup: the door opens as it always did');
});

/** The door over fake deps: a quest at the crypt, the overlay and the lines kept. */
function door({ instanceOk = true, online = true, quest = true, members = [] } = {}) {
  const m = new QuestMachine();
  const q = quest ? questAt(m, CRYPT) : null;
  const shown = [], said = [];
  const d = createInstanceDoor({
    online: () => online, instanceOk: () => instanceOk, account: () => 'acct-alice', character: () => 'char_alice', members: () => members,
    pixel: () => ({ x: 210, y: 99 }), questMachine: () => m, showOverlay: (w) => shown.push(w), say: (l) => said.push(l),
  });
  return { d, q, m, shown, said };
}
const COPPERING = { name: 'Ruins of The Hold of Coppering', mapTableData: { mapId: CRYPT.mapId } };
const HOLD = { name: "Privateer's Hold", mapTableData: { mapId: PRIVATEERS_HOLD_MAP_ID } };

test('INSTANCES the door: a quest\'s dungeon asks - the popup\'s rows numbered, Public, Your instance, Leave; my instance is my account\'s digest and my character\'s and the quest\'s; the room then reads it', async () => {
  const { d, q, shown } = door();
  let back = null;
  const first = await d.askDungeon(COPPERING, { enter: (row) => { back = row; } });
  assert.deepEqual(first, { go: false });
  assert.equal(shown.length, 1);
  assert.equal(shown[0].isChoiceWindow, true);
  assert.deepEqual(shown[0].options.map((o) => [o.code, o.label]), [['Digit1', `1 - ${INSTANCE_TEXT.public()}`], ['Digit2', `2 - ${INSTANCE_TEXT.mine()}`], ['Digit3', `3 - ${INSTANCE_TEXT.leave()}`]]);
  assert.deepEqual(shown[0].lines, ['Ruins of The Hold of Coppering', INSTANCE_TEXT.line()]);
  shown[0].input('Digit2');
  assert.deepEqual(back, { kind: 'mine' });
  const second = await d.askDungeon(COPPERING, { chosen: back });
  const inst = { owner: hex('instance:account:acct-alice', 8), epoch: hex(`instance:epoch:char_alice:quest:${q.uid}`, 4) };
  assert.deepEqual(second, { go: true, instance: inst, whole: true });
  assert.deepEqual(d.dungeonInstance(CRYPT.mapId), inst);
  assert.equal(d.dungeonInstance(4242), null, 'another dungeon');
  assert.deepEqual(await d.askDungeon(COPPERING, { chosen: { kind: 'public' } }), { go: true, instance: null, whole: false });
  assert.equal(d.dungeonInstance(CRYPT.mapId), null, 'entered public: its public room');
});

test('INSTANCES the door: no popup where there is nothing to choose - a dungeon no quest names, a load; at an older relay a quest\'s dungeon is entered whole (the fallback) and the Hold\'s public room is still refused', async () => {
  const none = door({ quest: false });
  assert.deepEqual(await none.d.askDungeon(COPPERING, {}), { go: true, instance: null, whole: false });
  assert.equal(none.shown.length, 0);
  const load = door();
  assert.deepEqual(await load.d.askDungeon(COPPERING, { skip: true }), { go: true, instance: null, whole: false }, 'a load: public, never asked');
  const old = door({ instanceOk: false });
  assert.deepEqual(await old.d.askDungeon(COPPERING, {}), { go: true, instance: null, whole: true });
  assert.equal(old.shown.length, 0);
  assert.deepEqual(await old.d.askDungeon(HOLD, {}), { go: true, instance: null, whole: false }, 'the Hold: public - HOLD-ONCE refuses it at the funnel');
  const off = door({ online: false });
  assert.deepEqual(await off.d.askDungeon(COPPERING, {}), { go: true, instance: null, whole: false }, 'offline DFU\'s');
});

test('INSTANCES the door: the Hold offers my instance alone (its line says why); a partner\'s instance here is a join row, mine never a stranger\'s', async () => {
  const hold = door({ quest: false });
  assert.deepEqual(await hold.d.askDungeon(HOLD, {}), { go: false });
  assert.deepEqual(hold.shown[0].options.map((o) => o.label), [`1 - ${INSTANCE_TEXT.mine()}`, `2 - ${INSTANCE_TEXT.leave()}`]);
  assert.deepEqual(hold.shown[0].lines, ["Privateer's Hold", INSTANCE_TEXT.holdLine()]);
  const holdInst = await hold.d.askDungeon(HOLD, { chosen: { kind: 'mine' } });
  assert.deepEqual(holdInst.instance, { owner: hex('instance:account:acct-alice', 8), epoch: hex('instance:epoch:char_alice:hold', 4) });
  const mine = hex('instance:account:acct-alice', 8);
  const members = [
    { acct: 'a1', name: 'Ann', online: true, p: { px: 210, py: 99, in: 1, ins: '0123456789abcdef.89abcdef' } },
    { acct: 'a2', name: 'Bo', online: true, p: { px: 210, py: 99, in: 1, ins: `${mine}.01234567` } },
  ];
  const party = door({ quest: false, members });
  await party.d.askDungeon(COPPERING, { enter: () => {} });
  assert.deepEqual(party.shown[0].options.map((o) => o.label), [`1 - ${INSTANCE_TEXT.public()}`, `2 - ${INSTANCE_TEXT.join('Ann')}`, `3 - ${INSTANCE_TEXT.leave()}`]);
  assert.deepEqual(await party.d.askDungeon(COPPERING, { chosen: { kind: 'join', owner: '0123456789abcdef', epoch: '89abcdef' } }), { go: true, instance: { owner: '0123456789abcdef', epoch: '89abcdef' }, whole: true });
});

test('INSTANCES the door: a building a quest names asks as a dungeon does; a re-laid public room says once an entry where the quest\'s things are', async () => {
  const { d, m, shown, said } = door({ quest: false });
  questAt(m, SHOP);
  assert.deepEqual(await d.askBuilding(SHOP.mapId, { buildingKey: SHOP.buildingKey }, { enter: () => {} }), { go: false });
  assert.equal(shown.length, 1);
  const got = await d.askBuilding(SHOP.mapId, { buildingKey: SHOP.buildingKey }, { chosen: { kind: 'mine' } });
  assert.deepEqual(d.buildingInstance(SHOP.mapId, SHOP.buildingKey), got.instance);
  const c = door();
  await c.d.askDungeon(COPPERING, { chosen: { kind: 'public' } });
  assert.equal(c.d.questElsewhere(CRYPT.mapId), true);
  assert.equal(c.d.questElsewhere(CRYPT.mapId), false, 'once an entry');
  assert.deepEqual(c.said, [INSTANCE_TEXT.questHere()]);
  await c.d.askDungeon(COPPERING, { chosen: { kind: 'public' } });
  assert.equal(c.d.questElsewhere(CRYPT.mapId), true, 'the next entry says it again');
  void said;
});

// worldModes.js's funnel, executed from its source (holdonce.test.js's harness, with the door)
const WM = read('src/scenes/worldModes.js');
const fns = new Map();
(function walk(n) {
  if (!n || typeof n !== 'object') return;
  if (n.type === 'FunctionDeclaration' && n.id?.name) fns.set(n.id.name, WM.slice(n.start, n.end));
  for (const v of Object.values(n)) if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') walk(v);
})(parse(WM, { ecmaVersion: 'latest', sourceType: 'module' }));
function funnel(doorAnswer) {
  const said = [], built = [], asked = [];
  const host = { dungeonOnline: () => true, wildDungeonGate: null, instanceDoor: { askDungeon: async (loc, opts) => { asked.push({ name: loc.name, opts }); return doorAnswer; } } };
  const tryEnterDungeon = new Function('host', 'say', 'isPrivateersHold', 'HOLD_ONCE_TEXT', 'gatedTransition', 'dungeonTransition',
    `${fns.get('tryEnterDungeon')} return tryEnterDungeon;`)(host, (l) => said.push(l), isPrivateersHold, HOLD_ONCE_TEXT,
    (step) => step(() => true), async (hit, entries, preferEnterMarker, live, fromLoad, door) => { built.push({ name: hit.dfLocation.name, door }); return true; });
  return { tryEnterDungeon, said, built, asked };
}

test('INSTANCES the funnel (worldModes.js tryEnterDungeon, from its source): the door asks before anything is built - a popup up builds nothing; an instance of the Hold passes HOLD-ONCE; the door\'s answer rides to the build', async () => {
  const up = funnel({ go: false });
  assert.equal(await up.tryEnterDungeon({ dfLocation: COPPERING }, []), false);
  assert.deepEqual(up.built, []);
  assert.equal(up.asked[0].opts.skip, false);
  const inst = { owner: '0123456789abcdef', epoch: '89abcdef' };
  const hold = funnel({ go: true, instance: inst, whole: true });
  assert.equal(await hold.tryEnterDungeon({ dfLocation: HOLD }, []), true, 'an instance of the Hold is entered any time');
  assert.deepEqual(hold.said, []);
  assert.deepEqual(hold.built, [{ name: "Privateer's Hold", door: { go: true, instance: inst, whole: true } }]);
  const pub = funnel({ go: true, instance: null, whole: false });
  assert.equal(await pub.tryEnterDungeon({ dfLocation: HOLD }, []), false, 'its public room: HOLD-ONCE');
  assert.deepEqual(pub.said, [HOLD_ONCE_TEXT]);
  const load = funnel({ go: true, instance: null, whole: false });
  await load.tryEnterDungeon({ dfLocation: COPPERING }, [], { fromLoad: true });
  await load.tryEnterDungeon({ dfLocation: COPPERING }, [], { holdOpen: true });
  assert.deepEqual(load.asked.map((a) => a.opts.skip), [true, true], 'a load and a `holdOpen` way in are never asked');
  // the popup's row comes back through the funnel
  const back = funnel({ go: false });
  await back.tryEnterDungeon({ dfLocation: COPPERING }, [], { preferEnterMarker: true });
  assert.equal(typeof back.asked[0].opts.enter, 'function');
  back.asked[0].opts.enter({ kind: 'mine' });
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(back.asked[1].opts.chosen, { kind: 'mine' }, 'the row chosen, on the second ask');
});

test('INSTANCES the hosts, by source: the build sizes by the door\'s `whole`; the room\'s identity carries the instance; the building\'s door asks; a re-laid public room mounts no quest\'s things; world.js keys the room and the party pose by it', () => {
  assert.match(fns.get('dungeonTransition'), /dungeonLocationFor\(hit\.dfLocation, \{ questMachine: questBridge\?\.machine, online: host\.dungeonOnline\?\.\(\) \?\? false, whole: !!door\?\.whole \}\)/);
  assert.match(WM, /size: builtDungeonSize\(dungeonLoc\), instance: host\.instanceDoor\?\.dungeonInstance\?\.\(dungeonLoc\?\.mapTableData\?\.mapId\) \?\? null \}/);
  assert.match(WM, /instance: host\.instanceDoor\?\.buildingInstance\?\.\(questSceneCtx\?\.\(\)\?\.mapId \?\? 0, interiorBuilding\?\.buildingKey \?\? 0\) \?\? null/);
  assert.match(fns.get('enterInteriorCore'), /if \(!restore && !hit\.sailingCabin\) \{\n\s+const door = await host\.instanceDoor\?\.askBuilding\?\.\(/);
  assert.match(fns.get('mountQuestResources'), /if \(!questMountsHere\(\{ online: !!host\.dungeonOnline\?\.\(\), builtSize: builtDungeonSize\(dungeonLoc\) \}\)\) \{ host\.instanceDoor\?\.questElsewhere\?\.\(dungeonLoc\?\.mapTableData\?\.mapId\); return; \}\n\s+\/\/ QUEST-VOID/, 'before QUEST-VOID\'s re-lay, which would carry the markers into the re-laid blocks');
  const W = read('src/scenes/world.js');
  assert.match(W, /instance: ident\?\.instance \?\? null,/);
  assert.match(W, /\.\.\.partyInstanceWord\(mode\),/);
  assert.match(W, /var modes = createWorldModes\(\{\n {4}climbFeel,[^\n]*\n {4}outsideView,[^\n]*\n {4}instanceDoor,/);
  assert.match(W, /getLocation: \{ value: \(r, l\) => dungeonLocationFor\(maps\.getLocation\(r, l\), \{ questMachine: questBridge\?\.machine, online: params\.has\('online'\), whole: params\.has\('online'\) \}\) \}/, 'the quest\'s world: the dungeon whole online');
});

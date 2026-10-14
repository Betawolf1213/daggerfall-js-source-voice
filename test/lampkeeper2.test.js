// LAMP-KEEPER II (2026-10-14, Mac: "Reimplement an old bug that was previously removed. A chance of finding a vendor NPC
// as a lamp model. Anybody that interacts with the lamp model should earn the 'I Love Lamp' title. Implement exclusive
// dialogue and ensure there is a loot popup for obtaining the title"). Pinned here: the pick (a shop's keeper, one day
// in LAMP_KEEPER_ODDS, the room's own answer), the lamp's words, the title's carrier (granted once, said and raised as a
// banner; held, guest, offline, a failed call asked again), the account service's grant and its title, the vocabulary,
// and the wiring - the interior's stand, the press, the hover's name, the host's door.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LAMP_KEEPER_ODDS, LAMP_KEEPER_ARCHIVE, LAMP_KEEPER_RECORDS, LAMP_CLASSIC, LAMP_ARCHIVE, LAMP_TITLE, isLampCandidate, isLampKeeper,
  LAMP_LINES, lampLines, LAMP_TEXT, createLampTitle,
} from '../src/systems/lampKeeper.js';
import { BUILDING_TYPES } from '../src/world/buildingNames.js';
import { claimLamp, LAMP_TITLE as SERVICE_LAMP_TITLE } from '../server-account/src/lamp.js';
import { titlesHeld } from '../server-account/src/titles.js';
import { TITLES } from '../src/net/identityToken.js';
import { TITLE_TEXT, TITLE_RGBA } from '../src/ui/playerBadge.js';
import { honourEntry } from '../src/ui/lootBanner.js';
import { RR_NPC_ARCHIVE, RR_NPC_XML_SCALE } from '../src/systems/rrVariants.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const keeper = (record = 2, position = 77) => ({ textureArchive: 182, textureRecord: record, position });
const shop = BUILDING_TYPES.GeneralStore;

test('LAMP-KEEPER II THE PICK: a shop\'s keeper (182_0-2) stands as the lamp one day in 25 - the town, the building, the person and the day, one answer for every client; never in a tavern or a house, never another person', () => {
  assert.equal(LAMP_KEEPER_ODDS, 25);
  assert.equal(LAMP_KEEPER_ARCHIVE, 182);
  assert.deepEqual([...LAMP_KEEPER_RECORDS], [0, 1, 2]);
  assert.deepEqual({ ...LAMP_CLASSIC }, { archive: RR_NPC_ARCHIVE, record: 6 }, 'Kludge Town\'s street lamp - the record the bug drew');
  assert.deepEqual(RR_NPC_XML_SCALE[6], [3, 0.8], 'and the stretch Roleplay & Realism gives it');
  assert.equal(LAMP_ARCHIVE, 38241);
  for (const r of [0, 1, 2]) assert.equal(isLampCandidate(keeper(r), shop), true);
  assert.equal(isLampCandidate(keeper(3), shop), false, 'not every 182 person');
  assert.equal(isLampCandidate({ textureArchive: 184, textureRecord: 2 }, shop), false);
  for (const bt of [BUILDING_TYPES.Tavern, BUILDING_TYPES.House1, BUILDING_TYPES.Temple, -1]) assert.equal(isLampCandidate(keeper(), bt), false, `not in building type ${bt}`);
  // the room's own answer, pinned: these days, and no others in the first two hundred
  const where = { buildingType: shop, buildingKey: 1234, mapId: 99 };
  const days = []; for (let d = 0; d < 200; d++) if (isLampKeeper(keeper(), { ...where, day: d })) days.push(d);
  assert.deepEqual(days, [20, 24, 65, 86, 88, 120, 156, 160, 183, 192]);
  assert.equal(isLampKeeper(keeper(), { ...where, day: 20 }), isLampKeeper(keeper(), { ...where, day: 20 }), 'the same answer asked twice');
  assert.equal(isLampKeeper(keeper(), { ...where, buildingType: BUILDING_TYPES.Tavern, day: 20 }), false, 'a tavern\'s keeper never');
  // about one day in twenty-five over a long run, and a different room a different day
  let n = 0; for (let d = 0; d < 20000; d++) if (isLampKeeper(keeper(), { ...where, day: d })) n++;
  assert.ok(n / 20000 > 0.03 && n / 20000 < 0.05, `about 1 in 25 (${n / 20000})`);
  const other = []; for (let d = 0; d < 200; d++) if (isLampKeeper(keeper(), { ...where, buildingKey: 1235, day: d })) other.push(d);
  assert.notDeepEqual(other, days, 'the next building\'s lamp days are its own');
});

test('LAMP-KEEPER II THE WORDS: its own, one set a day, read when spoken; its name, its rows and its title lines', () => {
  assert.equal(LAMP_LINES.length, 4);
  assert.deepEqual(lampLines(0), ['The lamp regards you.', '"Yes, I am a lamp. No, I do not wish to discuss it. Are you buying or not?"']);
  assert.deepEqual(lampLines(5), lampLines(1), 'the sets turn with the days');
  assert.deepEqual(lampLines(-1), lampLines(3));
  assert.match(lampLines(3)[1], /I love lamp\."$/);
  assert.deepEqual([LAMP_TEXT.name(), LAMP_TEXT.trade(), LAMP_TEXT.leave()], ['Lamp', 'Trade', 'Leave']);
  assert.match(LAMP_TEXT.granted(), /You have earned the title I Love Lamp\.$/);
  assert.match(LAMP_TEXT.guest(), /username/);
  assert.match(LAMP_TEXT.offline(), /online/);
});

test('LAMP-KEEPER II THE TITLE\'S CARRIER: granted once - said and raised as a banner; held, then nothing more; a guest and no account told once; a failed call asked again at the next press; one call at a time', async () => {
  const said = [], raised = [];
  let answer = { ok: false, error: 'network' }, calls = 0;
  const title = createLampTitle({ claim: async () => { calls++; return answer; }, say: (l) => said.push(l), announce: (k, key) => raised.push([k, key]) });
  assert.equal(await title.speak(), 'failed');
  answer = { ok: true, data: { granted: true } };
  const [a, b] = [title.speak(), title.speak()];
  assert.deepEqual([await a, await b], ['granted', 'busy'], 'one call at a time');
  assert.deepEqual(said, [LAMP_TEXT.granted()]);
  assert.deepEqual(raised, [['title', 'ilovelamp']], 'the loot popup');
  assert.equal(await title.speak(), 'done', 'granted: nothing more this session');
  assert.equal(calls, 2);
  const held = createLampTitle({ claim: async () => ({ ok: true, data: { granted: false, why: 'held' } }), say: (l) => said.push(l), announce: (k, key) => raised.push([k, key]) });
  said.length = 0; raised.length = 0;
  assert.deepEqual([await held.speak(), await held.speak()], ['held', 'done']);
  assert.deepEqual([said, raised], [[], []], 'held before: no line, no banner');
  const guest = createLampTitle({ claim: async () => ({ ok: true, data: { granted: false, why: 'guest' } }), say: (l) => said.push(l) });
  assert.deepEqual([await guest.speak(), await guest.speak()], ['guest', 'guest']);
  assert.deepEqual(said, [LAMP_TEXT.guest()], 'a guest told once');
  said.length = 0;
  const none = createLampTitle({ claim: async () => ({ ok: false, error: 'no-session' }), say: (l) => said.push(l) });
  await none.speak(); await none.speak();
  assert.deepEqual(said, [LAMP_TEXT.offline()], 'no account: told once');
  said.length = 0;
  const bench = createLampTitle({ say: (l) => said.push(l) });
  assert.equal(await bench.speak(), 'offline', 'a host with no account service');
  assert.deepEqual(said, [LAMP_TEXT.offline()]);
  const throws = createLampTitle({ claim: async () => { throw new Error('x'); } });
  assert.equal(await throws.speak(), 'failed', 'a throw is a failed call');
});

test('LAMP-KEEPER II THE ACCOUNT SERVICE: the first word lays I Love Lamp on the row once (held after), a guest\'s writes nothing; the row grants the title to a registered account; the vocabulary, its word and its colour; its banner', async () => {
  assert.equal(SERVICE_LAMP_TITLE, LAMP_TITLE);
  const sql = [];
  let changes = 1;
  const db = { prepare: (q) => ({ bind: (...b) => ({ run: async () => { sql.push([q, b]); return { meta: { changes } }; } }) }) };
  assert.deepEqual(await claimLamp({ db }, { id: 'a1', handle: null }), { granted: false, why: 'guest' });
  assert.deepEqual(sql, [], 'a guest writes nothing');
  assert.deepEqual(await claimLamp({ db }, { id: 'a1', handle: 'Mac' }), { granted: true });
  assert.deepEqual(sql, [['UPDATE players SET lamp_title = 1 WHERE id = ?1 AND lamp_title = 0', ['a1']]]);
  changes = 0;
  assert.deepEqual(await claimLamp({ db }, { id: 'a1', handle: 'Mac' }), { granted: false, why: 'held' });
  assert.equal(titlesHeld({ handle: 'Mac', lamp_title: 1 }, {}).includes('ilovelamp'), true);
  assert.equal(titlesHeld({ handle: 'Mac', lamp_title: 0 }, {}).includes('ilovelamp'), false);
  assert.equal(titlesHeld({ handle: null, lamp_title: 1 }, {}).includes('ilovelamp'), false, 'a guest row holds none');
  assert.equal(TITLES.at(-1), 'ilovelamp', 'the vocabulary, last');
  assert.equal(TITLE_TEXT.ilovelamp, 'I Love Lamp');
  assert.deepEqual([...TITLE_RGBA.ilovelamp], [1, 0.698, 0.376, 1], 'lamplight');
  const e = honourEntry({ kind: 'title', key: 'ilovelamp' });
  assert.deepEqual([e.name, e.kicker, e.honour.rgba], ['I Love Lamp', 'New Title', TITLE_RGBA.ilovelamp], 'its loot banner');
  assert.match(read('server-account/migrations/0113_lamp_title.sql'), /^ALTER TABLE players ADD COLUMN lamp_title INTEGER NOT NULL DEFAULT 0;$/m);
  assert.match(read('server-account/src/index.js'), /if \(path === '\/v1\/lamp\/claim' && request\.method === 'POST'\) \{\n[^\n]*\n\s*return json\(await claimLamp\(ctx, who\.player\), 200, origin\);/);
});

test('LAMP-KEEPER II THE WIRING: the interior stands the classic lamp under its own key at the record\'s size, no Morrowind body; the host picks per room and day; the press says its words with Trade and Leave and asks the title; the plaque names the Lamp; world.js hands its account door online', () => {
  const ctx = read('src/scenes/interiorContext.js'), modes = read('src/scenes/worldModes.js'), world = read('src/scenes/world.js');
  assert.match(ctx, /const lamp = !!opts\.lampPerson\?\.\(pn\);/);
  assert.match(ctx, /\.\.\.\(lamp \? \{ lamp: true, _mwLook: null \} : \{\}\)/, 'no Morrowind body is read for it');
  assert.match(ctx, /if \(pn\.lamp\) return standLamp\(pn\);/, 'before the voxel body and the billboard');
  assert.match(ctx, /const size = billboardSize\(t, LAMP_CLASSIC\.record\);/, 'the record\'s size, the mod\'s stretch with it');
  assert.match(ctx, /renderer\.uploadTexture\(LAMP_ARCHIVE, 0, t\.getColor32\(t\.getDFBitmap\(LAMP_CLASSIC\.record, 0\), 0\)\);/, 'the classic pixels, never a replacement\'s');
  assert.match(ctx, /pn\.standBatch = renderer\.createBillboardBatch\(LAMP_ARCHIVE, 0, size, \[\[pn\.x, pn\.y, pn\.z\]\]\);/);
  assert.match(modes, /lampPerson: \(pn\) => isLampKeeper\(pn, \{\n\s*buildingType: building\?\.buildingType \?\? -1, buildingKey: building\?\.buildingKey \?\? 0,\n\s*mapId: hit\.dfLocation\?\.mapTableData\?\.mapId \?\? 0, day: Math\.floor\(worldMinutes\(\) \/ MINUTES_PER_DAY\),/);
  assert.match(modes, /if \(!info && pn\?\.lamp\) \{ lampChoice\(pn\); return; \}/);
  assert.match(modes, /const officeName = \(pn\) => \(pn\?\.lamp \? LAMP_TEXT\.name\(\) : null\) \?\?/);
  assert.match(modes, /\{ code: 'KeyT', label: `T - \$\{LAMP_TEXT\.trade\(\)\}`, action: \(\) => \{ Promise\.resolve\(townTalk\?\.ensureFactions\?\.\(\)\)\.then\(\(\) => openStaticNpc\(pn\)\)/, 'Trade opens the keeper\'s own shop');
  assert.match(modes, /void lampTitle\.speak\(\);/);
  assert.match(modes, /announce: \(kind, key\) => announceHonour\(kind, key\),/);
  assert.match(world, /lampClaim: _accountLamp \? \(\) => _accountLamp\.claim\(\) : undefined,/);
  assert.match(world, /const _accountLamp = params\.has\('online'\) \? accountLamp\(/);
  assert.equal(/lampPerson|lampChoice|lampKeeper|LAMP_/.test(read('src/scenes/dungeonContext.js')), false, 'the dungeon host stands no shop');
});

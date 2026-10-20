// WITCH1 (2026-10-20, bible/06-Systems/Witches-Festival.md): THE WITCHES' FESTIVAL ON THIS PAGE (src/systems/festival/
// festivalClient.js) - the finds a kill and an act ask for, the cakes thrown onto a body and the pack restacked to the
// service's count less them, a sale kept on the save until its answer lands and minted once, the offering's item set out
// and brought back, and nothing asked at all while the festival is not live here.
import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  bindFestival, askFind, festivalLive, festivalState, buyWare, pendingSale, refreshFestival, offeringMove, saleRid, wareItem,
  festivalQuestEnded, festivalBountyPaid, FESTIVAL_FIND, _resetFestivalClientForTests,
} from '../../../src/systems/festival/festivalClient.js';
import { isSoulCake, isHearthOffering, soulCakesHeld, hearthOffering, restackSoulCakes, soulCakes } from '../../../src/systems/festival/soulCake.js';
import { raiseEnemyDeath } from '../../../src/scenes/corpseMarker.js';
import { noteAct } from '../../../src/systems/questlines/qlActs.js';
import { SESSION_KEY } from '../../../src/net/accountClient.js';
import { FESTIVALS, wareById } from '../../../src/net/festivalLaw.js';
import { isIliacCard } from '../../../src/systems/iliac/iliacItems.js';
import { MOBILE_TYPES } from '../../../src/characters/mobile/mobileTypes.js';

const store = new Map();
const mem = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } };
const seat = (kind = 'linked') => store.set(SESSION_KEY, JSON.stringify({ secret: 'sekrit', id: 'acct-alice', name: 'Alice', kind }));

/** A service door that answers as the test says, and keeps every ask. */
function fakeApi(answers = {}) {
  const asked = [];
  const door = (name) => async (...a) => { asked.push([name, ...a]); const r = answers[name]; return typeof r === 'function' ? r(...a) : r ?? { ok: false, error: 'offline' }; };
  return { asked, api: Object.fromEntries(['mine', 'find', 'buy', 'town', 'set', 'fill', 'takeIn', 'take'].map((n) => [n, door(n)])) };
}
let entity, saved, said;
const bind = (api, online = true) => bindFestival({ online: () => online, entity: () => entity, say: (l) => said.push(l), selfId: () => 'me', saved: () => { saved++; }, api });

beforeEach(() => {
  globalThis.localStorage = mem;
  store.clear();
  seat();
  mock.timers.enable({ apis: ['Date'], now: FESTIVALS[0].fromMs + 3600_000 });
  _resetFestivalClientForTests();
  entity = { isPlayer: true, items: [] };
  saved = 0;
  said = [];
});
afterEach(() => { mock.timers.reset(); _resetFestivalClientForTests(); delete globalThis.localStorage; });

test('WITCH1 NOT LIVE, NOTHING ASKED: unbound, offline, a guest\'s session or outside the festival\'s days', async () => {
  assert.equal(festivalLive(), false, 'unbound');
  const { api, asked } = fakeApi({ find: { ok: true, data: { found: 1, cakes: 1 } } });
  bind(api, false);
  assert.equal(await askFind('foe'), 0);
  bind(api, true);
  assert.equal(festivalLive(), true);
  seat('guest');
  assert.equal(festivalLive(), false, 'a guest\'s cakes would be a cleared browser\'s');
  seat();
  mock.timers.setTime(FESTIVALS[0].toMs);
  assert.equal(festivalLive(), false, 'the days are over');
  assert.equal(await askFind('foe'), 0);
  assert.deepEqual(asked.filter(([n]) => n === 'find'), []);
});

test('WITCH1 A KILL\'S FIND: asked by the foe\'s kind, thrown onto the body, the pack restacked to the count less it - once a body, a joiner\'s kill never mine', async () => {
  const { api, asked } = fakeApi({ mine: { ok: true, data: { cakes: 3 } }, find: (s) => (s === 'world' ? { ok: false, error: 'offline' } : { ok: true, data: { found: 2, cakes: 5 } }) });
  bind(api);
  await refreshFestival();
  assert.equal(soulCakesHeld(entity.items), 3, 'the pack is the count\'s face');
  const skeleton = { mobileType: MOBILE_TYPES.SkeletalWarrior, items: [] };
  raiseEnemyDeath(skeleton, {});
  raiseEnemyDeath(skeleton, {});   // a body asks once
  raiseEnemyDeath({ mobileType: 1001, items: [] }, { by: 'someone-else' });   // a joiner's kill is the joiner's to ask
  raiseEnemyDeath({ mobileType: 1001, items: [] }, { room: true });   // a room's body is its base
  await askFind('world');   // the queue drains in order (its answer lost: nothing moves)
  const finds = asked.filter(([n]) => n === 'find').map(([, s]) => s);
  assert.deepEqual(finds, ['undead', 'world'], 'the dead walk: the skeleton\'s find is the undead\'s');
  assert.equal(soulCakesHeld(skeleton.items), 2, 'thrown onto the body');
  assert.ok(skeleton.items.every(isSoulCake));
  assert.equal(soulCakesHeld(entity.items), 3, 'the count less the body\'s two: the account\'s five, two of them on the body');
  assert.ok(said.some((l) => /\+2 Soul Cakes/.test(l)));
  assert.equal(festivalState().cakes, 5);
});

test('WITCH1 AN ACT, A QUEST AND A BOUNTY ask by their group: a fish caught is `gather`, a quest done and a bounty paid `world`', async () => {
  const { api, asked } = fakeApi({ find: { ok: true, data: { found: 0, cakes: 0 } } });
  bind(api);
  noteAct('fish-caught');
  festivalQuestEnded({ questSuccess: false });   // a failed quest finds nothing
  festivalQuestEnded({ questSuccess: true });
  await festivalBountyPaid();
  assert.deepEqual(asked.filter(([n]) => n === 'find').map(([, s]) => s), ['gather', 'world', 'world']);
  assert.equal(FESTIVAL_FIND, 'festival-find');
});

test('WITCH1 A SALE: asked by its own id, the piece minted on the answer; a lost answer kept on the save and asked again by the same id, landing once', async () => {
  const sold = new Map();
  const buy = (ware, rid) => {
    if (sold.has(rid)) return { ok: true, data: { repeat: true, ware, cakes: 0, wares: [] } };
    sold.set(rid, ware);
    return { ok: true, data: { ware, cakes: 0, wares: [] } };
  };
  let lose = true;
  const { api, asked } = fakeApi({ buy: (ware, rid) => { const r = buy(ware, rid); if (lose) { lose = false; return { ok: false, error: 'offline' }; } return r; }, mine: { ok: true, data: { cakes: 0 } } });
  bind(api);
  const r = await buyWare('card:warlock');
  assert.equal(r.ok, false, 'the answer was lost');
  const rid = pendingSale()?.rid;
  assert.match(rid, /^[0-9a-f]{12}$/);
  assert.equal(entity.items.filter(isIliacCard).length, 0, 'nothing minted on no answer');
  await refreshFestival();
  assert.equal(pendingSale(), null, 'answered');
  assert.equal(entity.items.filter(isIliacCard).length, 1, 'minted once');
  assert.deepEqual(asked.filter(([n]) => n === 'buy').map(([, , id]) => id), [rid, rid], 'the same id asked again');
  // a refusal drops the pending sale and says why
  const { api: api2 } = fakeApi({ buy: { ok: false, error: 'cakes', data: { cakes: 3 } } });
  bind(api2);
  const no = await buyWare('piece:wyrd-athame');
  assert.deepEqual([no.ok, no.text], [false, 'You need more Soul Cakes.']);
  assert.equal(pendingSale(), null);
  assert.equal((await buyWare('nothing')).text, 'The Wyrd Sister has no such thing.');
});

test('WITCH1 THE WARES\' PIECES: a set piece, a card, the offering - an account ware mints nothing, the service holds it', () => {
  assert.equal(wareItem(wareById('title:witchwarden')), null);
  assert.equal(wareItem(wareById('icon:twinmoons')), null);
  assert.equal(wareItem(wareById('piece:wyrd-athame'))?.aetheric, 'wyrd-athame');
  assert.equal(isIliacCard(wareItem(wareById('card:spectre-of-lysandus'))), true);
  assert.equal(isHearthOffering(wareItem(wareById('item:offering'))), true);
  let i = 0;
  assert.equal(saleRid(() => [0.0, 0.99, 0.5][i++ % 3]), '0f80f80f80f8');
});

test('WITCH1 THE OFFERING\'S ITEM: set out only from the pack (one taken), taken in back into it', async () => {
  const { api } = fakeApi({ set: { ok: true, data: { ok: true, stock: 0 } }, takeIn: { ok: true, data: { ok: true, returned: 4, cakes: 4 } }, mine: { ok: true, data: { cakes: 4 } } });
  bind(api);
  const at = { mapId: 1, buildingKey: 2, character: 'char-a' };
  assert.equal((await offeringMove('set', at)).text, 'You have no Hearth Offering.');
  entity.items.push(Object.assign(hearthOffering(), { stackCount: 2 }));
  assert.equal((await offeringMove('set', at)).ok, true);
  assert.equal(entity.items.find(isHearthOffering).stackCount, 1);
  assert.equal((await offeringMove('takeIn', at)).ok, true);
  assert.equal(entity.items.filter(isHearthOffering).reduce((s, it) => s + (it.stackCount ?? 1), 0), 2);
  assert.equal(soulCakesHeld(entity.items), 4);
  // a take of an offering taken in since says so
  const { api: api2 } = fakeApi({ take: { ok: false, error: 'none' } });
  bind(api2);
  assert.equal((await offeringMove('take', at)).text, 'This offering has been taken in.');
});

test('WITCH1 THE RESTACK: the pack\'s Soul Cakes one stack of the count, or none', () => {
  const items = [soulCakes(2), soulCakes(1), { templateIndex: 1, group: 'Weapons' }];
  assert.equal(restackSoulCakes(items, 7), true);
  assert.equal(items.filter(isSoulCake).length, 1);
  assert.equal(soulCakesHeld(items), 7);
  assert.equal(restackSoulCakes(items, 7), false, 'already the count');
  assert.equal(restackSoulCakes(items, 0), true);
  assert.equal(soulCakesHeld(items), 0);
  assert.equal(items.length, 1);
  assert.equal(restackSoulCakes(items, -1), false);
});

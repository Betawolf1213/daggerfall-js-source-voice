// INSTANCES (2026-10-15, Mac: "You and your party"; bible/11-Multiplayer/Instances.md): THE RELAY'S DOOR, through the
// door a player runs through - a real signed token at the real Room's hello (test/fakeRoom.mjs), the hub a real Room over
// its own fake storage (fakeRooms). An instance room admits its owner, the owner's party (the hub's word, asked by the
// owner's digest) and nobody else; the hub silent is busy; the party pose carries the member's instance; an instance
// room is a world room whose memory is forgotten on its own clock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeRoom, fakeRooms } from './fakeRoom.mjs';
import { instanceOwnerOf, instanceRoomOf } from '../src/net/instanceRoom.js';
import { SOCIAL_ROOM, CLOSE_POLICY, CLOSE_BUSY, INSTANCE_TTL_MS, WORLD_TTL_MS, validPartyPose } from '../src/net/wire.js';

const refusal = (ws) => ws.sent.find((m) => m.t === 'error')?.m ?? null;
const welcomed = (ws) => ws.sent.some((m) => m.t === 'welcome');

async function instanceOf(owner, base = 'dungeon:m187853213') {
  return instanceRoomOf(base, { owner: await instanceOwnerOf(owner), epoch: '89abcdef' });
}

test('INSTANCES at the relay: the owner and the owner\'s party come in; a stranger is refused, before anything is written', async () => {
  const world = fakeRooms();
  const hub = world.room(SOCIAL_ROOM);
  hub.store.set('acct:acct-bobby', { name: 'bobby', party: 'p1' });
  hub.store.set('party:p1', { id: 'p1', leader: 'acct-alice', members: ['acct-alice', 'acct-bobby'], invites: [], away: {} });
  hub.store.set('acct:acct-carol', { name: 'carol', party: null });
  const key = await instanceOf('acct-alice');
  const r = world.room(key);
  const alice = r.connect(); await r.hello(alice, 'alice');
  assert.ok(welcomed(alice), 'its owner');
  const bob = r.connect(); await r.hello(bob, 'bobby');
  assert.ok(welcomed(bob), 'a member of the owner\'s party, by the hub\'s word');
  const carol = r.connect(); await r.hello(carol, 'carol');
  assert.equal(refusal(carol), 'private instance');
  assert.equal(carol.closed?.code, CLOSE_POLICY);
  assert.ok(!welcomed(carol));
  assert.ok(!r.sockets.includes(carol), 'gone from the room');
  assert.equal([...r.store.keys()].filter((k) => k.startsWith('secret')).some((k) => k.includes('carol')), false, 'her id\'s secret never planted');
});

test('INSTANCES at the relay: the hub not answering is busy - the page tries again - never a stranger\'s refusal and never a way in', async () => {
  const ROOMS = { idFromName: (n) => n, get: () => ({ fetch: async () => { throw new Error('hub away'); } }) };
  const r = fakeRoom(await instanceOf('acct-alice'), { ROOMS });
  const bob = r.connect(); await r.hello(bob, 'bobby');
  assert.equal(refusal(bob), 'busy');
  assert.equal(bob.closed?.code, CLOSE_BUSY);
  const alice = r.connect(); await r.hello(alice, 'alice');
  assert.ok(welcomed(alice), 'its owner never waits on the hub');
});

test('INSTANCES at the relay: a relay of one room (no hub) admits the owner alone', async () => {
  const r = fakeRoom(await instanceOf('acct-alice', 'interior:m206728581.131590'));
  const bob = r.connect(); await r.hello(bob, 'bobby');
  assert.equal(refusal(bob), 'private instance');
  const alice = r.connect(); await r.hello(alice, 'alice');
  assert.ok(welcomed(alice));
});

test('INSTANCES at the relay: the public room beside it is untouched - anyone comes in', async () => {
  const r = fakeRoom('dungeon:m187853213');
  const carol = r.connect(); await r.hello(carol, 'carol');
  assert.ok(welcomed(carol));
});

test('INSTANCES at the relay: an instance\'s memory is forgotten INSTANCE_TTL_MS after its room drains, a public room\'s WORLD_TTL_MS', async () => {
  let t = 1_000_000;
  const now = () => t;
  for (const [key, ttl] of [[await instanceOf('acct-alice'), INSTANCE_TTL_MS], ['dungeon:m187853213', WORLD_TTL_MS]]) {
    const realNow = Date.now;
    Date.now = now;
    try {
      const r = fakeRoom(key, { now });
      const alice = r.connect(); await r.hello(alice, 'alice');
      await r.drop(alice);
      assert.equal(r.alarm.at, t + ttl, key);
    } finally { Date.now = realNow; }
  }
});

test('INSTANCES on the party pose: inside, the instance a member stands in rides as `ins` (its owner and epoch); outside, or malformed, none', () => {
  const base = { px: 100, py: 120, in: 1, loc: 'x', h: 10, hm: 10, f: 10, fm: 10, m: 10, mm: 10 };
  assert.equal(validPartyPose({ ...base, ins: '0123456789abcdef.89abcdef' })?.ins, '0123456789abcdef.89abcdef');
  assert.equal(validPartyPose({ ...base, in: 2, bk: 5, ins: '0123456789abcdef.89abcdef' })?.ins, '0123456789abcdef.89abcdef');
  assert.equal('ins' in validPartyPose({ ...base, in: 0, ins: '0123456789abcdef.89abcdef' }), false, 'outside there is no instance');
  assert.equal('ins' in validPartyPose({ ...base, ins: 'dungeon:m1.i0123456789abcdef.89abcdef' }), false, 'a word, never a room key');
  assert.equal('ins' in validPartyPose(base), false, 'none said, none kept - every other pose reads as it always did');
});

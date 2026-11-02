// rw_quest_roles.test.js - raven-wright quest roles (Q3): roles.json parsing, NPC/spawner matching, the giver/person/foe
// runtime and the spawner hook through the real tickSpawners; the hosts' wiring is pinned by source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseRolesFile, buildRolesIndex, npcRolesFor, liveQuest, giverQuestFor, personBehaviourFor, foeRolesForSite, foesOwed,
  behaviourBoundTo, countBoundFoes, installQuestRoles, setQuestRolesMachine, setQuestRolesFoePool, questSpawnerHook,
  roleGiverQuest, ROLE_MATCH_UNITS,
} from '../src/scenes/questRoles.js';
import { tickSpawners } from '../src/scenes/poiSidecar.js';

const ROLES = {
  format: 'rw-quest-roles', version: 1, quest: 'RWRAT01',
  roles: [
    { id: 'g', kind: 'giver', block: 'rwga000.rmb', sub: 3, pos: [100, 0, 200] },
    { id: 'p', kind: 'person', sym: 'contact', block: 'RWGA001.RMB', sub: 1, pos: [50, 0, 60] },
    { id: 'f', kind: 'foe', sym: 'rat', block: 'RWGA000.RMB', spawner: 's1' },
  ],
};

// a stub machine/quest holding Person `contact` and Foe `rat` (2 of them)
function world({ running = true } = {}) {
  const quest = { uid: 7, questName: 'RWRAT01', questComplete: false };
  const person = { symbol: { name: 'contact' }, parentQuest: quest, isPerson: true };
  const foe = { symbol: { name: 'rat' }, parentQuest: quest, isFoe: true, foeType: 255, spawnCount: 2, killCount: 0 };
  quest.getPerson = (s) => (s.name === 'contact' ? person : null);
  quest.getFoe = (s) => (s.name === 'rat' ? foe : null);
  const machine = { quests: new Map(running ? [[7, quest]] : []) };
  return { quest, person, foe, machine };
}

test('parseRolesFile keeps good roles, uppercases blocks, warns and drops bad ones', () => {
  const r = parseRolesFile({ ...ROLES, roles: [...ROLES.roles, { kind: 'boss', block: 'X' }, { kind: 'person', block: 'A.RMB', sub: 0, pos: [0, 0, 0] }, { kind: 'foe', sym: 'x', block: 'A.RMB' }] }, 'pack/RWRAT01.roles.json');
  assert.equal(r.quest, 'RWRAT01');
  assert.equal(r.roles.length, 3);
  assert.equal(r.roles[0].block, 'RWGA000.RMB');
  assert.equal(r.warnings.length, 3);
  assert.match(r.warnings[0], /unknown kind 'boss'/);
  assert.match(r.warnings[1], /sym missing/);
  assert.match(r.warnings[2], /spawner id missing/);
  assert.equal(parseRolesFile({ format: 'other' }).roles.length, 0);
});

test('npcRolesFor matches block + building record + position within 16 units, nothing else', () => {
  const idx = buildRolesIndex([parseRolesFile(ROLES)]);
  const at = { block: 'RWGA000.RMB', sub: 3 };
  assert.equal(npcRolesFor(idx, at, { rawX: 100 + ROLE_MATCH_UNITS - 1, rawY: 0, rawZ: 200 }).length, 1);
  assert.equal(npcRolesFor(idx, at, { rawX: 100 + ROLE_MATCH_UNITS + 1, rawY: 0, rawZ: 200 }).length, 0);
  assert.equal(npcRolesFor(idx, { block: 'RWGA000.RMB', sub: 2 }, { rawX: 100, rawY: 0, rawZ: 200 }).length, 0);
  assert.equal(npcRolesFor(idx, null, { rawX: 100, rawY: 0, rawZ: 200 }).length, 0);
});

test('a giver offers its quest only while that quest is not running', () => {
  const idx = buildRolesIndex([parseRolesFile(ROLES)]);
  const pn = { rawX: 100, rawY: 0, rawZ: 200 };
  const at = { block: 'RWGA000.RMB', sub: 3 };
  assert.equal(giverQuestFor(idx, world({ running: false }).machine, at, pn), 'RWRAT01');
  assert.equal(giverQuestFor(idx, world().machine, at, pn), null);
  const done = world(); done.quest.questComplete = true;
  assert.equal(liveQuest(done.machine, 'rwrat01'), null);
  assert.equal(giverQuestFor(idx, done.machine, at, pn), 'RWRAT01');
});

test('a person role binds a behaviour to the running quest\'s Person, else nothing', () => {
  const idx = buildRolesIndex([parseRolesFile(ROLES)]);
  const calls = [];
  class B { constructor(m, h) { this.m = m; this.h = h; } assignResource(r) { calls.push(['assign', r.symbol.name]); } start() { calls.push(['start']); } }
  const w = world();
  const host = {};
  const b = personBehaviourFor(idx, w.machine, { block: 'RWGA001.RMB', sub: 1 }, { rawX: 52, rawY: 0, rawZ: 61 }, host, B);
  assert.ok(b instanceof B);
  assert.equal(b.h, host);
  assert.equal(w.person.questResourceBehaviour, b);
  assert.deepEqual(calls, [['assign', 'contact'], ['start']]);
  assert.equal(personBehaviourFor(idx, world({ running: false }).machine, { block: 'RWGA001.RMB', sub: 1 }, { rawX: 52, rawY: 0, rawZ: 61 }, host, B), null);
});

test('spawner keys, owed counts and save-proof binding by quest uid + symbol', () => {
  const idx = buildRolesIndex([parseRolesFile(ROLES)]);
  assert.equal(foeRolesForSite(idx, '12,34|rwga000.rmb|s1').length, 1);
  assert.equal(foeRolesForSite(idx, '12,34|RWGA000.RMB|s2').length, 0);
  const { foe } = world();
  assert.equal(foesOwed(foe, 0), 2);
  assert.equal(foesOwed({ ...foe, killCount: 1 }, 1), 0);
  const revived = { questUID: 7, targetSymbol: { name: 'rat' } };   // a fresh behaviour from a save: same uid + symbol
  assert.ok(behaviourBoundTo(revived, foe));
  assert.ok(!behaviourBoundTo({ ...revived, isComponentDestroyed: true }, foe));
  assert.ok(!behaviourBoundTo({ questUID: 8, targetSymbol: { name: 'rat' } }, foe));
  assert.equal(countBoundFoes([{ dead: false, questBehaviour: revived }, { dead: true, questBehaviour: revived }, { dead: false }], foe), 1);
});

test('the spawner hook stands the quest foe once with behaviours, holds while they live and is quiet without the quest', () => {
  installQuestRoles([parseRolesFile(ROLES)]);
  const w = world();
  setQuestRolesMachine(w.machine);
  const pool = [];
  setQuestRolesFoePool(() => pool);
  const site = { key: '0,0|RWGA000.RMB|s1', spawner: { id: 's1', trigger_m: 20, respawn_h: 0, groups: [] }, pos: [10, 0, 10] };
  const plain = { key: '0,0|RWGA000.RMB|s2', spawner: { id: 's2', trigger_m: 20, respawn_h: 0, count: [1, 1], mobiles: [3], radius_m: 2, tier: 'easy' }, pos: [0, 0, 0] };
  const spawned = [];
  const spawn = (type, at, o) => { spawned.push({ type, at, o }); if (o.questBehaviour) pool.push({ dead: false, questBehaviour: o.questBehaviour }); };
  const tick = () => tickSpawners([site, plain], { player: [0, 0, 0], hours: 0, spawn, cooldowns: new Map(), roleHook: questSpawnerHook });
  tick();
  const quest = spawned.filter((s) => s.o.questBehaviour);
  assert.equal(quest.length, 2);
  assert.ok(quest.every((s) => s.type === 255 && s.o.questBehaviour.questUID === 7 && s.o.questBehaviour.targetSymbol.name === 'rat'));
  assert.ok(spawned.some((s) => !s.o.questBehaviour), 'a site without a role still rolls its own monsters');
  spawned.length = 0; tick();
  assert.equal(spawned.filter((s) => s.o.questBehaviour).length, 0, 'both stand: nothing owed');
  pool[0].dead = true; w.foe.killCount = 1;
  spawned.length = 0; tick();
  assert.equal(spawned.filter((s) => s.o.questBehaviour).length, 0, 'one killed, one alive: nothing owed');
  pool.length = 0;   // the living one left with its block
  spawned.length = 0; tick();
  assert.equal(spawned.filter((s) => s.o.questBehaviour).length, 1, 'the unkilled one stands again');
  w.machine.quests.clear();
  spawned.length = 0;
  assert.equal(questSpawnerHook(site, spawn), true, 'a role site is held even with no live quest');
  assert.equal(spawned.length, 0);
  assert.equal(roleGiverQuest({ block: 'RWGA000.RMB', sub: 3 }, { rawX: 100, rawY: 0, rawZ: 200 }), 'RWRAT01');
  setQuestRolesFoePool(null);
});

test('hosts wire the roles: pack glob, machine, spawner hook, giver arm, person setup, questBehaviour through both spawn paths', () => {
  const src = (f) => readFileSync(new URL(`../src/scenes/${f}`, import.meta.url), 'utf8');
  const qd = src('questData.js');
  assert.match(qd, /vendor\/\*\/rwquests\/\*\.txt/);
  assert.match(qd, /vendor\/\*\/rwquests\/\*\.roles\.json/);
  assert.match(qd, /setSpawnerRoleHook\(questSpawnerHook\)/);
  assert.match(src('questBridge.js'), /setQuestRolesMachine\(machine\)/);
  const wm = src('worldModes.js');
  assert.match(wm, /const setupStaticNpcFull = \(pn, host\) =>\s*\n\s*rolePersonBehaviour\(interiorRoleAt, pn, host\) \?\? setupStaticNpc\(pn, host\);/);
  assert.match(wm, /setupStaticNpc, houseOwned, peopleVisible, baseEditable, setupStaticNpcFull,/);
  assert.match(wm, /roleStep\.kind !== 'close' && openQuestOfferFor\(\{ step: roleStep \}/);
  assert.match(wm, /const step = offer\.step \?\? questBridge\.offerSocialQuest/);
  for (const f of ['world.js', 'exterior.js']) assert.match(src(f), /placed: true, questBehaviour: o\.questBehaviour/);
  assert.match(src('exteriorFoes.js'), /setQuestRolesFoePool\(\(\) => foes\)/);
});

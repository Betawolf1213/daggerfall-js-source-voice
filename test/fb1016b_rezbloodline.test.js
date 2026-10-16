// REZ-BLOODLINE (FIELD BUGS 2026-10-16, bible/01-Overview/Field-Bugs-2026-10-16b.md; bible/06-Systems/Legacy-Arc.md
// section 6): "I was testing with a friend, he dies and I cast resurrection. It works for a moment then he disappears and
// remains dead" - "You died without a descendant. ... The line ends here". A Bloodline death was written at the death
// door (AUDIT LEGACY A1/B3), so the party's Resurrect raised a body whose house had already buried it, and the slow step
// opened the Succession over the living. Online the death is now HELD while a Resurrect can still raise it, and written
// at the first of the player going on, the hold's window ending, the page going and a load.
//
// Real code throughout: the death door (characters/playerEntity.js hurtPlayer and its listener), Project Legacy's host
// (scenes/legacyHost.js), the realm session over the REAL account Worker on node:sqlite (systems/realmSaves.js, test/
// accountDb.mjs, test/realmSeat.mjs), the party wire (net/wire.js validPartyPose, validPartyFrame), the bodies the
// caster sees (net/remotePlayers.js), the caster's cast (scenes/hostMagic.js createPlayerMagic), the death screen
// (ui/deathScreen.js) - and world.js's own statements sliced out of bootWorld and mounted over them: the death screen's
// frame (the Resurrect heard, the rise asked of Project Legacy), resurrectInPlace and closeDeathScreen, the party
// pose's `dd`, `fg` and `rz`, the caster's pick and call, the host's tombstone, and the page's going.
import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as acorn from 'acorn';
import worker from '../server-account/src/index.js';
import { standService } from './accountDb.mjs';
import { seatRealm } from './realmSeat.mjs';
import { SESSION_KEY } from '../src/net/accountClient.js';
import { realmIo, createRealmSession, whenPageGoes } from '../src/systems/realmSaves.js';
import { createLegacyHost, LEGACY_TEXT, REZ_HOLD_MS } from '../src/scenes/legacyHost.js';
import { personOf, familyRng, MODELS, LEGACY_MOD, isAlive } from '../src/systems/legacy/family.js';
import { loadFamily } from '../src/systems/legacy/store.js';
import { tollYears, tollLine } from '../src/systems/legacy/age.js';
import { legacySettings } from '../src/systems/legacy/settings.js';
import { modSaveRecords, restoreModSaveRecords, newGameModSaveRecords, _resetModSaveData } from '../src/systems/modSaveData.js';
import { setModSetting, _resetModSettings } from '../src/systems/modSettings.js';
import { hurtPlayer, setDeathListener } from '../src/characters/playerEntity.js';
import { reviveForPlay } from '../src/systems/deathRespawn.js';
import { stateDeathLoss, statedDeathLoss } from '../src/systems/deathPenalty.js';
import { DeathScreen, ONLINE_RESPAWN_SECONDS } from '../src/ui/deathScreen.js';
import { WILD_DEATH_HOLD_S } from '../src/systems/wildZone.js';
import { rezSnapshot, rezFor, resurrectionSpell, RESURRECT_TEXT, RESURRECT_HEALTH_PCT, RESURRECT_HOLD_MS, RESURRECT_TYPE, RESURRECT_SUBTYPE } from '../src/systems/resurrect.js';
import { buildCustomSpell } from '../src/systems/spellMaker.js';
import { validPartyPose, validPartyFrame } from '../src/net/wire.js';
import { RemotePlayers } from '../src/net/remotePlayers.js';
import { createPlayerMagic } from '../src/scenes/hostMagic.js';
import { LOCATION_TYPES } from '../src/formats/mapsFile.js';

const rd = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 40; i++) await new Promise((r) => { setTimeout(r, 0); }); };
const mem = () => { const m = new Map(); return { get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };

// ── world.js's own statements (test/auditrealm2_client.test.js's harness) ─────────────────────────────────────────────
const S = rd('src/scenes/world.js');
const AST = acorn.parse(S, { ecmaVersion: 'latest', sourceType: 'module' });
const text = (n) => S.slice(n.start, n.end);
const all = (pred, from = AST) => {
  const hits = [];
  (function walk(n) {
    if (!n || typeof n.type !== 'string') return;
    if (pred(n)) hits.push(n);
    for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
  })(from);
  return hits;
};
const one = (hits, what) => { assert.equal(hits.length, 1, `world.js: ${what} (${hits.length} found)`); return hits[0]; };
const fnOf = (name) => text(one(all((n) => n.type === 'FunctionDeclaration' && n.id?.name === name), `function ${name}`));
const declOf = (name) => text(one(all((n) => n.type === 'VariableDeclaration' && n.declarations.some((d) => d.id?.name === name)), `the declaration of ${name}`));
const BOOT = one(all((n) => n.type === 'FunctionDeclaration' && n.id?.name === 'bootWorld'), 'bootWorld');
const topOf = (has) => text(one(BOOT.body.body.filter((st) => text(st).includes(has)), `bootWorld's statement holding ${has}`));
/** The death screen's frame (onlineFrame): the Resurrect heard while the dead lie - `if (!_respawning) { ... }`. */
const REZ_FRAME = text(one(all((n) => n.type === 'IfStatement' && text(n.test) === '!_respawning' && text(n).includes('rezFor(')), 'the frame\'s Resurrect'));
/** composePartyPose's spreads: my body (`dd`), fallen for good (`fg`), my Resurrect's call (`rz`). */
const POSE = one(all((n) => n.type === 'VariableDeclarator' && n.id?.name === 'composePartyPose'), 'composePartyPose');
const spreadOf = (has) => text(one(all((n) => n.type === 'SpreadElement' && text(n).includes(has), POSE), `composePartyPose's ${has}`));
const POSE_DEAD = `({ ${spreadOf('dd: _deadMark')}, ${spreadOf('fg: 1')} })`;
const POSE_CALL = `({ ${spreadOf('rz: {')} })`;
/** The host's tombstone, as world.js hands it to Project Legacy's host. */
const TOMBSTONE = text(one(all((n) => n.type === 'Property' && n.key?.name === 'tombstone' && text(n.value).includes('realmSession')), 'the tombstone dep').value);

const scoped = (state) => new Proxy(state, {
  has: (t, k) => k !== '__s',
  get: (t, k) => (k === Symbol.unscopables ? undefined : (k in t ? t[k] : globalThis[k])),
  set: (t, k, v) => { t[k] = v; return true; },
});
// eslint-disable-next-line no-new-func
const mount = (body, state) => new Function('__s', `with (__s) { ${body} }`)(scoped(state));

const BASE_POSE = { px: 10, py: 20, in: 0, loc: 'Gothway Garden', hm: 40, f: 0, fm: 10, m: 0, mm: 10, race: 'DarkElf', gender: 'female', face: 3 };
/** A party pose over the wire: projected as it leaves (OnlineSession.sendParty), at the relay's door (parseClient) and
 *  as the hub's frame lands (validPartyFrame) - the member the receiver's social keeps. */
const overTheWire = (acct, name, pose) => {
  const f = validPartyFrame(JSON.parse(JSON.stringify({ t: 'party', acct, p: validPartyPose(validPartyPose(pose)) })));
  assert.ok(f, 'the pose crosses the wire');
  return { acct: f.acct, name, p: f.p, online: true };
};

const ent = () => ({
  name: 'Ysolde Gothway', gender: 'female', race: 'DarkElf', faceIndex: 3, careerIndex: 5, career: { name: 'Nightblade', primarySkills: [28], majorSkills: [], minorSkills: [] },
  level: 9, characterId: 'r-ysolde', chargenDone: true, health: 40, maxHealth: 40, fatigue: 2000, items: [], wagonItems: [], activeEffects: [],
  stats: { strength: 60, intelligence: 50, willpower: 50, agility: 50, endurance: 50, personality: 50, speed: 50, luck: 50 },
  skills: Array.from({ length: 35 }, (_, i) => (i === 28 ? 80 : 20)),
});

/** The account service, stood once for the file. */
let _svc = null;
const service = async () => (_svc ??= await standService());

/**
 * ONE PARTY OF TWO: Ysolde (the fallen - Project Legacy's host, her realm session, her death screen's frame) and Bran
 * (the caster - his pick, his call, his cast). `online: false` - Ysolde alone, offline.
 */
async function party({ model = MODELS.bloodline, online = true, ear = true } = {}) {
  _resetModSaveData();
  _resetModSettings();
  const r = { door: [], said: [], heard: [], clock: 1_000_000_000 };
  if (online) {
    const svc = await service();
    const g = await svc.guest();   // an account of her own, each party
    const R = await seatRealm(svc.env, g.secret, 'Ysolde');
    const store = mem();
    store.setItem(SESSION_KEY, JSON.stringify({ id: g.id, secret: g.secret }));
    const fetch = async (url, init) => { r.door.push(`${init?.method ?? 'GET'} ${new URL(url).pathname}${init?.keepalive ? ' keepalive' : ''}`); return worker.fetch(new Request(url, init), svc.env); };
    r.session = createRealmSession({ io: realmIo({ fetch, storage: store }), id: R.id, lease: R.lease, seq: 1, later: () => () => {}, watchHidden: () => {} });
    r.deadAt = () => svc.env.DB._raw.prepare('SELECT dead_at FROM realm_characters WHERE id = ?').get(R.id).dead_at;
  }
  r.tombs = () => r.door.filter((l) => l.includes('/v1/realm/die'));
  r.storage = mem();
  r.e = ent();
  const worldTombstone = mount(`return ${TOMBSTONE};`, { realmSession: r.session ?? null });
  r.host = createLegacyHost({
    get entity() { return r.e; },
    storage: () => r.storage, tab: () => mem(), on: () => true, online: () => online, now: () => 100, own: () => 0,
    here: () => ({ pixel: { x: 10, y: 20 }, region: 'Daggerfall', mode: 'exterior', loc: 'Gothway Garden', locationType: LOCATION_TYPES.TownCity, mapId: 5001 }),
    town: (h) => ({ region: h.region, loc: h.loc, mapId: h.mapId }), nearestTown: () => ({ region: 'Daggerfall', loc: 'Gothway Garden' }),
    gold: () => 200, say: (l) => r.heard.push(l), boot: () => {}, search: () => '?online&realm=r-ysolde&load',
    loadCharacter: () => false, saveNow: () => true, hasSave: () => true, inFight: () => false, rng: familyRng(7),
    wall: () => r.clock, ...(ear ? { whenGone: (fn) => { r.pageGoes = fn; } } : {}),
    tombstone: worldTombstone,
  });
  setModSetting(LEGACY_MOD, 'Family.Siblings Probability', 0);   // a house of one - the reporter's "There is no one left"
  r.host.found(model);
  setDeathListener('projectLegacy', () => r.host.onDeath());   // world.js's own registration (AUDIT LEGACY A1/B3)
  r.me = () => personOf(r.host.family, r.host.current().id);
  r.stored = () => personOf(loadFamily(r.storage, r.host.family.id), r.me().id);

  // ── Ysolde's world: her death screen, her frame, her pose ──
  r.townTalk = { overlay: null, closeOverlay(ov) { if (this.overlay === ov) this.overlay = null; }, say: (l) => r.said.push(l) };
  const v = {
    _respawning: false, _rezSeen: null, _deadMark: null, _partyComposedAt: 0, _deathWasOnline: true,
    social: { acct: 'acct-ysolde', others: () => r.ysoldeHears ?? [] }, modes: { sdRealmSlot: () => null, clearDeath() {} },
    legacyHost: r.host, rezSnapshot, rezFor, reviveForPlay, playerEntity: r.e, RESURRECT_HEALTH_PCT, RESURRECT_TEXT, DeathScreen,
    statedDeathLoss, stateDeathLoss, townTalk: r.townTalk, wildGhostEnd: () => {}, forgetLastSlew: () => {}, player: { stopAutorun() {} },
  };
  r.ysolde = v;
  const frame = mount(`${fnOf('resurrectInPlace')}\n${fnOf('closeDeathScreen')}\nreturn () => { ${REZ_FRAME} };`, v);
  /** One frame of the death screen's (onlineFrame's death arm): answers whether she rose. */
  r.frame = () => { frame(); return r.e.health > 0; };
  r.die = () => {
    assert.equal(hurtPlayer(r.e, 999, { bypassShield: true }), true, 'the blow kills at the door');
    r.townTalk.overlay = new DeathScreen({ eyeHeight: 1.6, capsuleHeight: 1.8, online: true, entity: r.e });   // the presenter's screen
    v._deadMark = { k: 'world:10,20', x: 0, y: 0, z: 2, at: 5 };   // PCORPSE1: where the body lies
    r.frame();   // the death screen's first frame: what the party's poses said at the death
  };
  r.ysoldePose = () => ({ ...BASE_POSE, h: r.e.health, ...mount(`return ${POSE_DEAD};`, v) });

  // ── Bran's world: the bodies he sees, his pick, his call, his cast ──
  const rp = new RemotePlayers({ renderer: { createBillboardBatch: () => ({}), destroyBillboardBatch() {} }, now: () => 0, deps: { audio: { playOneShot() {} } } });
  const c = {
    social: { acct: 'acct-bran', party: { members: [{ acct: 'acct-ysolde', name: 'Ysolde' }, { acct: 'acct-bran', name: 'Bran' }] }, others: () => r.branHears ?? [], accountOfPeer: () => 'acct-ysolde' },
    remotePlayers: rp, onlineToScene: (p) => [p.x, p.y, p.z], cam: { pos: [0, 0.9, 0] }, peerName: () => 'Ysolde',
    _rezOut: null, _partyComposedAt: 0, RESURRECT_HOLD_MS,
  };
  r.bran = c;
  const { fallenTargetPick, raiseFallenDoor } = mount(`${declOf('fallenTargetPick')}\n${declOf('raiseFallenDoor')}\nreturn { fallenTargetPick, raiseFallenDoor };`, c);
  r.branPose = () => ({ ...BASE_POSE, h: 40, race: 'Nord', gender: 'male', face: 1, ...mount(`return ${POSE_CALL};`, c) });
  r.caster = { health: 40, maxHealth: 40, maxMagicka: 500, magicka: 500, level: 9, isPlayer: true, skills: new Array(40).fill(50), skillUses: new Array(40).fill(0), stats: { intelligence: 50, willpower: 50, endurance: 50 }, career: {}, activeEffects: [] };
  r.branSaid = [];
  r.anim = null;
  r.magic = createPlayerMagic({
    renderer: { createBillboardBatch: () => ({}), destroyBillboardBatch() {} },
    audio: { playOneShot() {}, playOneShotId() {}, play3d() {}, play3dId() {} },
    getTexture: async () => ({ getSize: () => [16, 16], getScale: () => [0, 0] }),
    uploadRecord() {}, uploadRecordFrame() {}, collider: { raycast: () => Infinity }, playerEntity: r.caster,
    playerSinks: { hurt() {}, heal() {}, drainMagicka() {}, restoreMagicka() {}, drainFatigue() {}, restoreFatigue() {}, say: (l) => r.branSaid.push(l) },
    say: (l) => r.branSaid.push(l), surfacePlayer() {}, foes: () => [],
    foeSinks: () => ({ hurt() {}, heal() {}, drainMagicka() {}, restoreMagicka() {}, drainFatigue() {}, restoreFatigue() {} }),
    absorbCtx: () => ({ inside: true, day: false }), rolls: () => 0.99,
    startCastAnim: (sp, release) => { if (!r.slowHands) return false; r.anim = release; return true; },
    fallenTarget: fallenTargetPick, raiseFallen: raiseFallenDoor,
  });
  r.magic.firePending([0, 0.9, 0], [0, 0, 1]);   // where Bran stands and looks: at her body, two paces off
  /** The party's poses cross: Bran hears Ysolde's (and her body stands for him - PCORPSE3), Ysolde hears Bran's. */
  r.toBran = () => {
    const her = overTheWire('acct-ysolde', 'Ysolde', r.ysoldePose());
    r.branHears = [her];
    if (her.p.dd) rp.partyBody('acct-ysolde', 'peer-ysolde', null, her.p.dd, true);
    return her;
  };
  r.toYsolde = () => { r.ysoldeHears = [overTheWire('acct-bran', 'Bran', r.branPose())]; };
  /** Bran casts Resurrection at her body: answers the click's answer. */
  r.cast = (sp = resurrectionSpell()) => { r.magic.readySpell(sp); return r.magic.castInput([0, 0.9, 0], [0, 0, 1]); };
  return r;
}

test('REZ-BLOODLINE a Resurrect inside the hold saves a Bloodline character: died at the real door online, held - nothing written, no tombstone; Bran\'s Resurrect over the real wire reaches her frame and she rises - alive on the record, no remains, no Succession at the slow step, no tombstone at the realm (the reporter\'s "works for a moment then he disappears")', async () => {
  const r = await party();
  r.die();
  assert.equal(r.e.health, 0);
  assert.equal(r.host.family.pending, null, 'held: no Succession waits on the record');
  assert.equal(isAlive(r.me()), true, 'nor is she recorded dead');
  assert.equal(isAlive(r.stored()), true, 'on the device either');
  assert.deepEqual(r.tombs(), [], 'and the realm is asked nothing');
  assert.equal(r.host.raisable(), true);
  assert.equal(r.host.tick(), null, 'the slow step waits on the hold - no Succession under the death screen');
  r.me().estate = 50;   // a letter of credit the house owes her
  r.host.tick();
  assert.ok(!r.heard.includes(LEGACY_TEXT.estate(50)), 'nothing of the living\'s runs over the dead: no letter paid into a body on the ground');
  // late in the longest stand an online death screen makes (the open zone's two minutes) - the hold outlasts it
  r.clock += WILD_DEATH_HOLD_S * 1000 - 1000;
  assert.equal(r.toBran().p.fg, undefined, 'her pose says nothing of a death for good');
  assert.equal(r.cast(), true, 'Bran\'s click casts');
  assert.ok(r.branSaid.includes(RESURRECT_TEXT.cast('Ysolde')), 'and calls her back');
  assert.ok(r.caster.magicka < 500, 'paid for');
  r.toYsolde();
  assert.equal(r.frame(), true, 'the call reaches her death screen\'s frame: she rises');
  assert.equal(r.e.health, Math.round(40 * RESURRECT_HEALTH_PCT / 100));
  assert.equal(r.townTalk.overlay, null, 'the death screen closed in place');
  assert.ok(r.said.includes(RESURRECT_TEXT.raised('Bran')));
  for (let s = 0; s < 3; s++) { r.clock += REZ_HOLD_MS; assert.equal(r.host.tick(), null, 'no Succession, at any slow step after'); }
  assert.ok(r.heard.includes(LEGACY_TEXT.estate(50)), 'risen, her days go on: the letter paid');
  assert.equal(r.host.family.pending, null);
  assert.equal(isAlive(r.me()), true, 'she lives on the record');
  assert.equal(r.host.family.ended ?? null, null, 'and the line goes on');
  assert.deepEqual(r.host.family.remains ?? [], [], 'no remains laid');
  await settle();
  assert.deepEqual(r.tombs(), [], 'no tombstone asked');
  assert.equal(r.deadAt(), null, 'none stamped');
  assert.equal(r.session.lost, null, 'her session plays on');
  assert.equal(r.toBran().p.fg, undefined);
  // the next death is a death of its own, held as the first
  r.die();
  assert.equal(r.host.family.pending, null);
  assert.equal(r.host.raisable(), true);
});

test('REZ-BLOODLINE the hold\'s window over: decided as the door read it - a Resurrect then is refused on both sides: her client keeps the body down (the death written at that moment, the tombstone stamped), and her pose tells Bran, whose cast spends nothing; the slow step decides a hold its window passed', async () => {
  const r = await party();
  r.die();
  r.toBran();
  assert.equal(r.cast(), true, 'Bran casts inside the window');
  r.clock += REZ_HOLD_MS;   // ...and the call reaches her after it
  r.toYsolde();
  assert.equal(r.frame(), false, 'refused: she stays down - no living body, then the line\'s end');
  assert.equal(r.e.health, 0);
  assert.ok(r.townTalk.overlay instanceof DeathScreen, 'her death screen stands, for the Succession after it');
  assert.ok(r.host.family.pending, 'decided at once - the Succession waits on the record');
  assert.equal(r.me().died?.cause, 'fell');
  assert.equal(r.host.raisable(), false);
  const row = r.host.family.remains?.find((x) => x.of === r.me().id);
  assert.ok(row && row.state === 'lying' && row.place?.loc === 'Gothway Garden', 'her remains lie where she fell');
  assert.ok(row.items.some((it) => it.legacyRemains), 'her bones with them');
  await settle();
  assert.deepEqual(r.tombs(), ['POST /v1/realm/die'], 'the tombstone asked under her lease');
  assert.ok(r.deadAt() != null, 'and stamped at the realm');
  // Bran hears her pose say so: refused before a point is spent, said in her name
  assert.equal(r.toBran().p.fg, 1, 'fallen for good, over the wire');
  const before = r.caster.magicka;
  r.branSaid.length = 0;
  assert.equal(r.cast(), false, 'the click refused');
  assert.equal(r.caster.magicka, before, 'nothing spent');
  assert.equal(r.branSaid.at(-1), RESURRECT_TEXT.forGood('Ysolde'), 'said in her name');
  assert.match(RESURRECT_TEXT.forGood('Ysolde'), /^Ysolde has fallen for good\./);
  assert.ok(!r.branSaid.includes(RESURRECT_TEXT.cast('Ysolde')) && !r.branSaid.includes(RESURRECT_TEXT.noBody));
  // a caster-only Resurrect readied at her says so too
  r.branSaid.length = 0;
  r.magic.readySpell(buildCustomSpell({ slots: [{ type: RESURRECT_TYPE, subType: RESURRECT_SUBTYPE, settings: {} }], rangeType: 0, element: 4, name: 'Raise', icon: 10, index: -45002 }));
  assert.deepEqual(r.branSaid, [RESURRECT_TEXT.forGood('Ysolde')], 'readied: her name, never "Press button to fire spell."');
  // the reset presents it: the reporter's own screen, now with no living body before it
  const out = r.host.deathOutcome();
  assert.equal(out.kind, 'fall');
  assert.equal(out.fallen.id, r.me().id);
  assert.deepEqual([out.choices.length, out.newborn], [0, false], LEGACY_TEXT.noHeir);
  // a hold its window passed while no Resurrect came: the slow step decides it
  const q = await party();
  q.die();
  q.clock += REZ_HOLD_MS - 1;
  assert.equal(q.host.tick(), null);
  assert.equal(q.host.family.pending, null, 'inside the window: held');
  q.clock += 1;
  assert.ok(q.host.tick()?.fall, 'over: decided - the Succession, which the world host opens once her death screen goes (legacyStep)');
  assert.ok(q.host.family.pending);
  assert.equal(q.me().died?.cause, 'fell');
  // a body brought up by no Resurrect (a respawn that never asked the reset) is the death as it was
  const p = await party();
  p.die();
  p.e.health = 20;
  assert.ok(p.host.tick()?.fall, 'decided: the Succession, as the door had it before');
  // and a call cast before her death screen's reset, landing on a body gone for good while the hands moved, goes nowhere
  const h = await party();
  h.die();
  h.toBran();
  h.slowHands = true;
  assert.equal(h.cast(), true, 'the click casts; the hands move');
  h.clock += REZ_HOLD_MS;
  h.host.tick();
  h.toBran();
  h.branSaid.length = 0;
  h.anim();
  assert.equal(h.bran._rezOut, null, 'no call sent at her');
  assert.deepEqual(h.branSaid, [RESURRECT_TEXT.forGood('Ysolde')]);
});

test('REZ-BLOODLINE no reload and no closed tab undoes the death (AUDIT LEGACY A1/B3): the page going decides it - world.js\'s own pagehide statement asks Project Legacy first, the tombstone goes by keepalive under the lease, the realm\'s leave sends nothing; the host hears the page go itself; a load (the mod\'s restore, every load door\'s) and a new game decide it first', async () => {
  const r = await party();
  r.die();
  const win = new EventTarget();
  mount(topOf('whenPageGoes('), { realmSession: r.session, legacyHost: r.host, whenPageGoes, globalThis: win });
  win.dispatchEvent(new Event('pagehide'));
  assert.equal(r.session.lost, 'dead', 'the session the dead\'s at once - the leave behind it finds it so');
  await settle();
  assert.deepEqual(r.door.filter((l) => /realm\/(die|leave)/.test(l)), ['POST /v1/realm/die keepalive'], 'the tombstone, by keepalive - no leave');
  assert.ok(r.deadAt() != null, 'stamped at the realm');
  assert.equal(r.stored().died?.cause, 'fell', 'and on the device: the reload reads her dead');
  assert.ok(loadFamily(r.storage, r.host.family.id).pending, 'with the Succession waiting');
  // the host's own ear for the page going (a page with no realm session: the device's record keeps it) - the page's
  // pagehide, by default
  const ears = [];
  globalThis.addEventListener = (type, fn) => { ears.push([type, fn]); };
  try { await party({ online: false, ear: false }); } finally { delete globalThis.addEventListener; }
  assert.deepEqual(ears.map(([type]) => type), ['pagehide'], 'the host hears the page go');
  const o = await party({ online: false });
  assert.equal(typeof o.pageGoes, 'function', 'the host listens for the page going');
  const d = await party();
  d.die();
  d.pageGoes();
  await settle();
  assert.deepEqual(d.tombs(), ['POST /v1/realm/die keepalive']);
  assert.equal(d.stored().died?.cause, 'fell');
  // a load over a held death: the save written before she fell, restored as every load door restores it
  const l = await party();
  const before = modSaveRecords();
  l.die();
  assert.equal(isAlive(l.stored()), true, 'held');
  restoreModSaveRecords(before);
  assert.equal(l.stored().died?.cause, 'fell', 'decided before the save was read');
  assert.ok(l.host.past, 'the loaded save of her is the past now');
  assert.ok(l.host.tick()?.fall, 'and the Succession offered over it');
  await settle();
  assert.deepEqual(l.tombs(), ['POST /v1/realm/die']);
  // a new game over a held death
  const n = await party();
  n.die();
  newGameModSaveRecords();
  assert.equal(n.stored().died?.cause, 'fell', 'decided before the new game plays anyone');
});

test('REZ-BLOODLINE the player goes on - the death screen\'s reset decides it; an Enduring member\'s toll is held with the death (a Resurrect takes no years, the reset the door\'s); offline the death is decided at the door, as ever; the hold outlasts every online death screen', async () => {
  // Bloodline: the reset (world.js legacyDeathReset's ask)
  const b = await party();
  b.die();
  const out = b.host.deathOutcome();
  assert.equal(out.kind, 'fall');
  assert.equal(b.stored().died?.cause, 'fell');
  await settle();
  assert.deepEqual(b.tombs(), ['POST /v1/realm/die']);
  // Enduring: raised, no years taken
  const e = await party({ model: MODELS.enduring });
  e.die();
  assert.equal(e.me().toll | 0, 0, 'held: no years taken at the door');
  assert.equal(e.host.willRise(), true, 'the rise the reset would make is known');
  e.toBran();
  e.cast();
  e.toYsolde();
  assert.equal(e.frame(), true, 'raised by Bran');
  assert.equal(e.host.tick(), null);
  assert.equal(e.me().toll | 0, 0, 'and Arkay takes nothing');
  assert.equal(e.stored().toll | 0, 0);
  // ...the next death's reset takes the door's years, and says them
  e.die();
  const years = tollYears(e.me().race, legacySettings().tollShare);
  const rise = e.host.deathOutcome();
  assert.equal(rise.kind, 'rise');
  assert.equal(e.me().toll, years, 'the toll taken at the reset');
  assert.equal(rise.line, tollLine(e.me().given, { years, age: rise.line.match(/is (\d+)/)[1] | 0, spent: false }));
  await settle();
  assert.deepEqual(e.tombs(), [], 'an Enduring rise is no tombstone');
  // offline: no party can raise her - decided at the door (AUDIT LEGACY A1/B3)
  const o = await party({ online: false });
  o.die();
  assert.equal(o.stored().died?.cause, 'fell', 'written at the door');
  assert.ok(o.host.family.pending);
  assert.equal(o.host.raisable(), false);
  // the window outlasts the longest an online death screen stands (the body's minute; the open zone's two)
  assert.ok(REZ_HOLD_MS > Math.max(ONLINE_RESPAWN_SECONDS, WILD_DEATH_HOLD_S) * 1000);
});

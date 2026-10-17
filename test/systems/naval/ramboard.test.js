// RAM-BOARD (2026-10-17, the owner: "Let us board a ship without weakening it.. like just ram and board";
// bible/03-World/Naval-Refit.md RAM-BOARD) - A RAM FOULS HER, on the real naval host over the real pool
// (test/navalSea.mjs): the law's own numbers; a sound ship never boarded unrammed; rammed, fouled by me for FOUL_S - her
// card "Fouled - E: board her", the grapples thrown on her as she stands and her whole crew mustered against me; her way
// held by the captain's own step while she is fouled, her guns not; on foot over her rail; a heave-to beside her; another
// player's foul never mine; the foul run out; the abandon's words; and her word 'boarded' to the room.
// tools/mutants/ramboard.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FOUL_S, FOUL_WAY, FOUL_DECEL, foul, isFouled, fouledBy, boardableState, holdFouled } from '../../../src/systems/naval/navalFoul.js';
import { HULL, hullBuild, classById } from '../../../src/systems/naval/navalShips.js';
import { SHIP_STATES } from '../../../src/systems/naval/navalDamage.js';
import { MUSTER_MIN, MUSTER_MAX, BOARD_SPEED, GRAPPLE_S } from '../../../src/systems/naval/navalBoarding.js';
import { hullBoxOf, RAM_REACH } from '../../../src/scenes/naval/navalHost.js';
import { stepCaptain } from '../../../src/systems/naval/navalAI.js';
import { navalHudText } from '../../../src/ui/naval/navalHud.js';
import { validNavalRecord } from '../../../src/systems/naval/navalWire.js';
import { sea, knowAll } from '../../navalSea.mjs';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

async function helm(o = {}) {
  const h = await sea({ hull: HULL.SmallShip, ...o, settings: { ShipsAtSea: 'off', Boarders: false, ...(o.settings ?? {}) } });
  const e = h.host._sea.get(h.host.spawnShip('merchantGalleon', { range: 900 }));
  return { ...h, e };
}
/** Frames with each ship held where the test put her (navaudit_helm.test.js's). */
function frames(h, held, n = 1, opts = {}) {
  for (let i = 0; i < n; i++) {
    for (const [e, p] of held) { e.ship.pos = [...p.pos]; e.ship.yaw = p.yaw ?? 0; e.ship.speed = p.speed ?? 0; e.ship.yawRate = 0; }
    h.host.frame(0.1, opts);
  }
}
/** Her side `gap` past my stem as I lie at the origin facing +z (navaudit_helm.test.js's `across`). */
function across(h, gap, hull = HULL.SmallShip) {
  frames(h, [[h.e, { pos: [0, 0, 90], yaw: Math.PI / 2 }]]);
  const b = hullBoxOf(h.e.boat, h.pool.models);
  const ext = Math.abs(b.ax[2]) * b.h[0] + Math.abs(b.ay[2]) * b.h[1] + Math.abs(b.az[2]) * b.h[2];
  return { pos: [0, 0, 90 + hullBuild(hull).bowZ + gap - (b.c[2] - ext)], yaw: Math.PI / 2 };
}
/** Rammed at `v` m/s: the way remembered, then the stem in her side. */
function ram(h, v = 6) {
  const touching = across(h, RAM_REACH / 2);
  h.runtime.state.velocityCurrent = [0, 0, v];
  frames(h, [[h.e, across(h, 30)]]);
  h.runtime.state.velocityCurrent = [0, 0, 0.1];
  frames(h, [[h.e, touching]]);
  return touching;
}

test('RAM-BOARD the law: a ram fouls her for FOUL_S (20 s) - fouled by whoever rammed, renewed by a fresh ram; boardable struck by anyone, afloat only fouled by me, never boarded, a prize or going down; her way held under FOUL_WAY (1.2 m/s), coming off at FOUL_DECEL (4 m/s^2), her canvas in (mutants: each number, the foul\'s owner, the afloat arm)', () => {
  assert.deepEqual([FOUL_S, FOUL_WAY, FOUL_DECEL], [20, 1.2, 4]);
  assert.ok(FOUL_WAY < BOARD_SPEED, 'a boarding from her lee is never left behind');
  const ship = { damage: { state: 'afloat' }, speed: 6, sails: 1 };
  assert.equal(boardableState(ship, 'me', 0), false, 'a sound ship, unrammed: no');
  foul(ship, 'me', 10);
  assert.deepEqual(ship.fouled, { by: 'me', until: 30 });
  assert.equal(isFouled(ship, 29.9), true);
  assert.equal(isFouled(ship, 30), false);
  assert.equal(fouledBy(ship, 'me', 15), true);
  assert.equal(fouledBy(ship, 'ann', 15), false);
  assert.equal(boardableState(ship, 'me', 15), true);
  assert.equal(boardableState(ship, 'ann', 15), false, 'another\'s foul is theirs');
  assert.equal(boardableState(ship, 'me', 31), false, 'run out');
  foul(ship, 'me', 25);
  assert.equal(boardableState(ship, 'me', 31), true, 'a fresh ram renews it');
  assert.equal(boardableState({ ...ship, boarded: true }, 'me', 26), false);
  for (const st of ['prize', 'sinking', 'sunk', 'wrecked']) assert.equal(boardableState({ ...ship, damage: { state: st } }, 'me', 26), false, st);
  assert.equal(boardableState({ damage: { state: 'struck' } }, 'ann', 0), true, 'struck: anyone\'s, as ever');
  // her way
  const s2 = { speed: 6, sails: 1, fouled: { by: 'me', until: 10 } };
  assert.equal(holdFouled(s2, 0.25, 1), true);
  assert.equal(s2.speed, 5);
  assert.equal(s2.sails, 0.875);
  for (let i = 0; i < 20; i++) holdFouled(s2, 0.25, 1);
  assert.equal(s2.speed, FOUL_WAY, 'held at FOUL_WAY');
  const slow = { speed: 0.5, sails: 0, fouled: { by: 'me', until: 10 } };
  holdFouled(slow, 0.25, 1);
  assert.equal(slow.speed, 0.5, 'never pushed up to it');
  const free = { speed: 6, sails: 1, fouled: { by: 'me', until: 10 } };
  assert.equal(holdFouled(free, 0.25, 11), false);
  assert.equal(free.speed, 6, 'run out: her own way');
});

test('RAM-BOARD unrammed, a sound ship is no boarding - at my helm beside her, still, E grapples nothing and her card says nothing of it (the struck law stands for every other ship)', async () => {
  const h = await helm();
  const beside = across(h, 6);
  h.runtime.state.velocityCurrent = [0, 0, 0];
  frames(h, [[h.e, beside]], 2);
  assert.equal(h.e.ship.damage.state, SHIP_STATES.afloat);
  assert.equal(h.host.activate(), false);
  assert.equal(h.host.boarding, null);
  assert.equal(h.host.hudModel().board, null);
});

test('RAM-BOARD rammed, she is fouled by me: her card "Fouled - E: board her", the grapples thrown on her AS SHE STANDS - her colours flying, her hull all but whole - and after the haul her WHOLE crew mustered against me, her captain at their head (mutants: the foul never set, the helm\'s reach still struck-only, the card unsaid)', async () => {
  const h = await helm();
  const touching = ram(h);
  assert.equal(h.e.ship.damage.state, SHIP_STATES.afloat, 'she has not struck');
  assert.ok(h.e.ship.damage.hullShare() > 0.75, 'nor been battered');
  assert.equal(h.e.ship.fouled?.by, 'local', 'fouled by me (offline, the host\'s own id)');
  assert.ok(h.e.ship.fouled.until > FOUL_S - 1, 'for FOUL_S from the ram');
  assert.ok(h.log.say.some((l) => /fouled in yours/.test(l)), 'said');
  knowAll(h.host);   // her colours made out, and the look on her - the card's own two conditions
  h.view.look = { origin: [0, 5, 0], dir: [0, -0.05, 1] };
  frames(h, [[h.e, touching]]);
  const m = h.host.hudModel();
  assert.equal(m.board?.kind, 'board', 'the helm offers the boarding');
  assert.equal(m.target?.fouled, true, 'her card knows it');
  const card = navalHudText(m).card;
  assert.deepEqual([card.state, card.stateKind], ['Fouled - Activate: board her', 'board'], 'her colours flying: fouled, not struck');
  assert.equal(h.host.activate(), true);
  assert.equal(h.host.boarding?.kind, 'board');
  assert.equal(h.host.boarding.shipId, h.e.id);
  h.run(GRAPPLE_S + 0.5);
  const cls = classById('merchantGalleon');
  const n = clamp(Math.round(cls.boarders * h.e.ship.damage.crewShare()), MUSTER_MIN, MUSTER_MAX);
  const theirs = h.log.foes.filter((f) => f.side !== 'hand');
  assert.ok(theirs.length >= n, `her muster: ${theirs.length} of ${n}`);
  assert.ok(theirs.some((f) => f.name), 'her captain, named');
});

test('RAM-BOARD while fouled her captain\'s own step holds her way under FOUL_WAY - her sails in - and lets it go once the foul runs out (mutants: the hold unread)', async () => {
  const h = await helm();
  ram(h);
  const s = h.e.ship;
  s.speed = 6; s.sails = 1;
  const world = { now: s.fouled.until - FOUL_S + 1, dt: 1, seaY: 0, wind: [1, 0, 0], isWater: () => true, contacts: [], notoriety: () => 0, random: () => 0.5, boarders: false };
  stepCaptain(s, world);
  assert.ok(s.speed <= 6 - FOUL_DECEL * 1 + 1e-9, `her way coming off (${s.speed})`);
  for (let i = 0; i < 4; i++) stepCaptain(s, { ...world, now: world.now + 1 + i });
  assert.ok(s.speed <= FOUL_WAY + 1e-9, `held (${s.speed})`);
  s.speed = 6;
  stepCaptain(s, { ...world, now: s.fouled.until + 1 });
  assert.ok(s.speed > FOUL_WAY, 'run out: her own way again');
});

test('RAM-BOARD on foot over her rail while she is fouled by me; another player\'s foul never mine; a heave-to beside her when I come up too fast; the foul run out, the struck law again (mutants: the rail struck-only, the heave-to struck-only)', async () => {
  const h = await helm();
  const touching = ram(h);
  // too fast beside her: heave to
  h.runtime.state.velocityCurrent = [0, 0, BOARD_SPEED + 3];
  frames(h, [[h.e, touching]]);
  assert.equal(h.host.hudModel().board?.kind, 'heave');
  assert.equal(h.host.activate(), true);
  assert.equal(h.host.boarding, null, 'heaving to, not grappling');
  frames(h, [[h.e, touching]]);
  assert.ok(h.host.brake() > 0, 'and the heave-to holds beside her fouled ship, frame on frame');
  // another's foul
  const h2 = await helm();
  h2.e.ship.fouled = { by: 'ann', until: Infinity };
  frames(h2, [[h2.e, across(h2, 6)]], 2);
  assert.equal(h2.host.hudModel().board, null, 'Ann\'s to board');
  // on foot: over a sound ship's rail only while she is fouled by me
  const f = await sea({ hull: null, settings: { ShipsAtSea: 'off', Boarders: false } });
  const e = f.host._sea.get(f.host.spawnShip('merchantGalleon', { range: 900 }));
  e.ship.pos = [0, 0, 20]; e.ship.speed = 0;
  f.host.frame(0.1);
  f.view.feet = [0, 0, 20 - hullBuild(e.ship.hull).beam - 5];
  f.view.look = { origin: [f.view.feet[0], 1.6, f.view.feet[2]], dir: [0, 0, 1] };
  assert.equal(f.host.activate(), false, 'a sound ship alongside the swimmer: no');
  e.ship.fouled = { by: 'ann', until: Infinity };
  assert.equal(f.host.activate(), false, 'Ann\'s foul: no');
  e.ship.fouled = { by: 'local', until: Infinity };
  assert.equal(f.host.activate(), true, 'mine: over her rail');
  assert.equal(f.host.boarding?.kind, 'board');
  // the foul run out on the helm's ship: no boarding
  const h3 = await helm();
  const t3 = ram(h3);
  h3.e.ship.fouled.until = -1;
  frames(h3, [[h3.e, t3]]);
  assert.equal(h3.host.hudModel().board, null, 'run out');
});

test('RAM-BOARD a sound ship being boarded is said "boarded" on the room\'s word as a struck one is - no peer grapples her under the fight; and left, her crew runs back to her guns (mutants: the word afloat, the abandon\'s words)', async () => {
  const h = await helm();
  const touching = ram(h);
  frames(h, [[h.e, touching]]);
  assert.equal(h.host.activate(), true);
  const said = validNavalRecord(h.host.word((p) => p)).ships.find((x) => x.n === h.e.n);
  assert.equal(said?.state, 'boarded', 'said boarded');
  assert.equal(h.e.ship.damage.state, SHIP_STATES.afloat, 'though her colours fly');
  h.run(GRAPPLE_S + 0.5);
  h.view.feet = [5000, 0, 5000];
  h.run(0.2);
  assert.ok(h.log.say.some((l) => /runs back to her guns/.test(l)), 'a sound ship fights on');
  assert.equal(h.e.ship.boarded, false);
});

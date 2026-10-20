// STAR5/STAR6 (bible/11-Multiplayer/Starfall.md sections 3, 4, 5 and 8): THE STARFALL'S HOST, END TO END on the world's
// bindings by name - a night's stars found over a scan, their moments said where they should be heard, the defense
// stood by the ledger the cell says (each wave, the master, its circle at its calls, the ward), the star a body its own
// coven's monsters strike and each blow kept across a reload, the word to the cell, the hold and the loss, the camp's
// race; and the Timers', the map's and the compass's readings. tools/mutants/star5.json.
import '../../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStarfallHost, STAR_BLOWS_STORE } from '../../../src/scenes/starfall/starfallHost.js';
import {
  starNightAt, starTimes, starCircleSize, STAR_ORPHAN_MS, STAR_CIRCLE_AT, STAR_LOST_DARK,
  P_WAVE, P_MASTER, P_HELD, P_LOST,
} from '../../../src/net/starfall/starfallLaw.js';
import { starCovenOf, covenWitches, STAR_COVENS } from '../../../src/systems/starfall/starfallCovens.js';
import { findStarSites } from '../../../src/systems/starfall/starfallSites.js';
import { findGateSite } from '../../../src/systems/gate/gateSite.js';
import { starWaveFoes, starMasterOf, starCircleFoes, STAR_ROSTERS } from '../../../src/systems/starfall/starCoven.js';
import { starHeldKey, STAR_SPRING_M } from '../../../src/systems/starfall/starfallClient.js';
import { STAR_REGION_TEXT, STAR_AT_TEXT } from '../../../src/systems/starfall/starWords.js';
import { STAR_SOUNDS } from '../../../src/systems/starfall/starSounds.js';
import { starSiteId } from '../../../src/world/worldOfDaggerfall/wodShared.js';
import { midScreenText } from '../../../src/ui/midScreenText.js';
import { renownFoeStruck } from '../../../src/net/renownTracker.js';
import { FESTIVALS } from '../../../src/net/festivalLaw.js';
const FESTIVAL_FROM_MS = FESTIVALS[0].fromMs;   // the Witches' Festival's first day, the Starfall's own (net/festivalLaw.js)

const N = starNightAt(FESTIVAL_FROM_MS) + 30;
const COVEN = starCovenOf(N);
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise((r) => setImmediate(r)); };

/** Each coven's region 400 pixels in a block of its own, each pixel its own town's (STAR2's scan). */
function scanOf(regions) {
  const byRegion = new Map(), townAt = new Int32Array(1000 * 500).fill(-1), towns = [];
  regions.forEach((region, i) => {
    const pixels = [];
    for (let y = 20 + i * 30; y < 40 + i * 30; y++) for (let x = 300; x < 320; x++) { const id = y * 1000 + x; pixels.push(id); townAt[id] = towns.length; towns.push({ name: `Town ${towns.length}`, px: x, py: y, region }); }
    byRegion.set(region, Int32Array.from(pixels));
  });
  return { byRegion, towns, townAt };
}
const SCAN = scanOf([...new Set(STAR_COVENS.map((c) => c.region))]);
const sitesOf = (n) => findStarSites(n, SCAN, { gateSiteOf: (day) => { try { return findGateSite(day, SCAN); } catch { return null; } } });

/** The foe pool's doors the host uses, recording. */
function pool() {
  const p = { foes: [], stood: [], dropped: [], reclaimed: [], removed: [], camp: 0 };
  p.newCampId = () => ++p.camp;
  p.spawnFoe = (career, pos, o) => {
    const f = { mobileType: career, site: o.site, opts: o, entity: { health: 100, maxHealth: 100 }, ai: { feet: [...pos] }, dead: false };
    p.foes.push(f); p.stood.push(f);
    return Promise.resolve(f);
  };
  p.dropSiteFoes = (s) => { p.dropped.push(s); p.foes = p.foes.filter((f) => f.site !== s); };
  p.reclaimSite = (s) => p.reclaimed.push(s);
  p.removeFoe = (f) => { p.removed.push(f); p.foes = p.foes.filter((x) => x !== f); };
  return p;
}
const memStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), m }; };

/** A world with one player, the host on its bindings. */
function world({ storage = memStorage(), t = starTimes(N, 0).omenAt - 1000 } = {}) {
  const w = { t, feet: null, region: COVEN.region, said: [], mids: [], sounds: [], words: [], sprung: new Set(), peer: new Set(), peerAgo: 0, forgot: [], bare: [], storage };
  w.foes = pool();
  w.session = { starReady: () => true, sendStar: (word, cell) => { w.words.push({ ...word, cell }); return true; } };
  const bindings = {
    renderer: null,
    state: { pixelTranslation: (px, py, out) => { out[0] = px * 100; out[1] = 0; out[2] = py * 100; return out; } },
    exteriorFoes: w.foes, gateScanOf: () => SCAN, warmGateScan: () => {},
    surfaceAt: () => 0, player: { feetAt: () => w.feet }, walkMode: true, playerSpawned: true,
    get online() { return w.session; },
    _wodPeerSprung: w.peer, wodPeerHeldAgo: () => w.peerAgo, wodForgetPeer: (s) => { w.forgot.push(s); w.peer.delete(s); },
    wodSprang: (s) => w.sprung.add(s), wodUnsprang: (s) => w.sprung.delete(s),
    chatNotice: (s) => w.said.push(s), labGrassField: { invalidate: (...a) => w.bare.push(a) },
    _questRegionIndex: () => w.region, gamePaused: () => false, townTalk: { hudHidden: false },
    collider: null, _sharedOffsetMs: 0,
    audio: { playOneShot: (clip) => w.sounds.push(clip), play3d: (clip) => w.sounds.push(clip) },
    storage,
  };
  w.host = createStarfallHost(bindings);
  w.frame = () => w.host.frame();
  w.beat = async () => { w.host.frame(); await settle(); w.host.frame(); };
  w.star = (k) => w.host.state().find((s) => s.key.startsWith(`${N}.${k}@`));
  w.siteOf = (k) => sitesOf(N).find((s) => s.k === k);
  w.at = (k, m = 0) => { const s = w.siteOf(k); const sp = s.spot; w.feet = [s.px * 100 + sp[0] + m, 0, s.py * 100 + sp[1]]; };
  w.sites = (k) => { const s = w.siteOf(k); return { base: starSiteId(s.px, s.py, N, k), m: starSiteId(s.px, s.py, N, k, 'm'), c: starSiteId(s.px, s.py, N, k, 'c') }; };
  w.st = (k, over) => { const s = w.siteOf(k); w.host.onStar({ k: 'st', n: N, s: k, px: s.px, py: s.py, p: P_WAVE, w: 1, wz: 3, kn: 0, wl: -1, lt: 100, nd: 2, b: 1, ow: 1, hc: 0, hd: 0, lo: 0, why: 0, ...over }); };
  return w;
}

let realNow;
const clockOf = (w) => { Date.now = () => w.t; };
test.before(() => { realNow = Date.now; midScreenText.onMessage = null; });
test.after(() => { Date.now = realNow; });
const mids = [];
const watchMids = () => { mids.length = 0; midScreenText.onMessage = (m) => mids.push(m); };

test('STAR5 THE NIGHT\'S STARS: three in the coven\'s region, each from its omen; none outside the Witches\' Festival\'s days; a star whose landing is before they open is no star (mutants: the festival\'s days, the window filter)', () => {
  const w = world();
  clockOf(w);
  assert.equal(sitesOf(N).length, 3);
  w.t = FESTIVALS[0].toMs;
  assert.equal(w.frame(), null);
  assert.deepEqual(w.host.state(), [], 'the festival over, no stars');
  w.t = starTimes(N, 0).omenAt;
  w.frame();
  assert.deepEqual(w.host.state().map((s) => s.phase), ['omen']);
  w.t = starTimes(N, 2).fallAt + 1000;
  w.frame();
  assert.deepEqual(w.host.state().map((s) => s.phase), ['after', 'fallen', 'fallen'], 'the first\'s deadline the last\'s landing');
  // the window's first night: its first two stars land before it opens - none on this screen; its last at the opening
  const first = starNightAt(FESTIVAL_FROM_MS);
  const w2 = world({ t: FESTIVAL_FROM_MS + 1000 });
  clockOf(w2);
  w2.region = -9;
  w2.frame();
  assert.deepEqual(w2.host.state().map((s) => s.key.split('@')[0]), [`${first}.2`]);
  w2.t = FESTIVAL_FROM_MS - 1;
  assert.equal(w2.frame(), null);
  assert.deepEqual(w2.host.state(), [], 'before the window, nothing');
  Date.now = realNow;
});

test('STAR5 THE REGION HEARS IT: the omen to everyone in the coven\'s region, once, with its whine; the landing as it happens; a player elsewhere hears neither (mutants: the region guard, the once)', () => {
  const w = world();
  clockOf(w);
  const s0 = w.siteOf(0), T = starTimes(N, 0);
  w.t = T.omenAt + 10;
  w.frame(); w.frame();
  assert.deepEqual(w.said, [STAR_REGION_TEXT.omen(s0.near, covenWitches(COVEN))]);
  assert.deepEqual(w.sounds, [STAR_SOUNDS.omen.clip]);
  w.t = T.streakAt + 10; w.frame();
  assert.ok(w.sounds.includes(STAR_SOUNDS.fall.clip), 'its roar');
  w.t = T.fallAt + 10; w.frame(); w.frame();
  assert.deepEqual(w.said.slice(1), [STAR_REGION_TEXT.fell(s0.near)]);
  const away = world();
  clockOf(away);
  away.region = COVEN.region + 1;
  away.t = T.omenAt + 10; away.frame();
  away.t = T.fallAt + 10; away.frame();
  assert.deepEqual(away.said, []);
  assert.deepEqual(away.sounds, []);
  Date.now = realNow;
});

test('STAR5 THE DEFENSE: at the fallen star this player springs its coven - its three sites said to be mine; each wave stood off the ledger, its own roster at its own places, in no save; the waves\' calls said at the star; kills counted, a wave seen cleared; the word says it all to the star\'s cell (mutants: the stand, the count, the word)', async () => {
  const w = world();
  clockOf(w);
  watchMids();
  const T = starTimes(N, 1), sites = w.sites(1), s1 = w.siteOf(1);
  w.t = T.fallAt + 500;
  w.at(1, 10);
  w.frame();
  assert.deepEqual([...w.sprung].sort(), Object.values(sites).sort(), 'the star\'s three sites, mine');
  assert.deepEqual(w.foes.reclaimed.sort(), Object.values(sites).sort());
  assert.equal(w.foes.stood.length, 0, 'nothing stood before the cell speaks');
  assert.equal(w.words.at(-1).o, 1);
  assert.deepEqual([w.words.at(-1).n, w.words.at(-1).k, w.words.at(-1).px, w.words.at(-1).py], [N, 1, s1.px, s1.py]);
  w.st(1, { p: P_WAVE, w: 1, wz: 3, kn: 0, b: 1 });
  await w.beat();
  assert.deepEqual(w.foes.stood.map((f) => f.mobileType), starWaveFoes(N, 1, 1, 3, 1));
  for (const f of w.foes.stood) {
    assert.equal(f.site, sites.base);
    assert.equal(f.starSite, sites.base, 'its hunters\' star');
    assert.equal(f.opts.transient, true, 'in no save');
    assert.equal(f.opts.eliteFoe, false);
    assert.equal(f.campId, 1);
  }
  assert.ok(mids.includes(STAR_AT_TEXT.wave(1)), 'the first wave\'s call at the star');
  // the wave falls: each with a body counted once; the wave seen cleared once the last is down, never before
  const [a, b, c] = w.foes.stood;
  for (const f of [a, b]) { f.dead = true; f.corpse = true; }
  w.frame(); w.t += 2100; w.frame();
  assert.deepEqual([w.words.at(-1).kn, w.words.at(-1).wc], [2, 0], 'two down, the wave stands');
  c.dead = true;
  w.frame(); w.t += 2100; w.frame();
  assert.equal(w.words.at(-1).kn, 2, 'gone without a body: walked off, no fall');
  c.corpse = true;
  w.frame(); w.t += 2100; w.frame();
  assert.equal(w.host.state().find((s) => s.key.startsWith(`${N}.1@`)).kn, 3);
  assert.equal(w.words.at(-1).kn, 3);
  assert.equal(w.words.at(-1).wc, 1, 'the wave seen cleared');
  // wave 2, taken over mid-wave: only what is left of it stands
  w.st(1, { p: P_WAVE, w: 2, wz: 5, kn: 2, b: 1 });
  await w.beat();
  assert.deepEqual(w.foes.stood.slice(3).map((f) => f.mobileType), starWaveFoes(N, 1, 2, 3, 1));
  assert.ok(starWaveFoes(N, 1, 2, 3, 1).every((c) => STAR_ROSTERS[1][1].includes(c)));
  Date.now = realNow;
});

test('STAR5 THE STAR AS A BODY: its owner\'s machine hands it to the senses while it stands fallen; each blow its coven lands is one, kept per character across a reload and said in the word (mutants: the ward\'s owner guard, the store)', async () => {
  const storage = memStorage();
  const w = world({ storage });
  clockOf(w);
  const T = starTimes(N, 0);
  w.t = T.fallAt + 500; w.at(0, 5);
  w.frame();
  const wards = w.host.wards();
  assert.equal(wards.length, 1);
  assert.equal(wards[0].starWard, true);
  assert.equal(wards[0].site, w.sites(0).base);
  assert.equal(wards[0].hurtFromFoe(), 1);
  wards[0].hurtFromFoe();
  w.t += 2100; w.frame();
  assert.equal(w.words.at(-1).hb, 2);
  assert.ok(w.sounds.includes(STAR_SOUNDS.blow.clip));
  const kept = JSON.parse(storage.getItem(STAR_BLOWS_STORE));
  assert.equal(kept[starHeldKey(N, 0, w.siteOf(0).px, w.siteOf(0).py)], 2);
  // a reload: the same count goes on
  const again = world({ storage });
  clockOf(again);
  again.t = w.t; again.at(0, 5); again.frame();
  assert.equal(again.words.at(-1).hb, 2, 'counted on from its own');
  // a player not at it stands no body
  const far = world();
  clockOf(far);
  far.t = T.fallAt + 500; far.at(0, STAR_SPRING_M + 50); far.frame();
  assert.deepEqual(far.host.wards(), []);
  Date.now = realNow;
});

test('STAR5 THE MASTER AND ITS CIRCLE: the ledger\'s master stood an elite by its own name under its own site; at two-thirds and a third its circle about it, sized by the defenders; the ward holds while one of the circle stands; the calls and the breaking said on every screen; its fall said in the word (mutants: a call\'s edge, the circle\'s size, the ward, the fall)', async () => {
  const w = world();
  clockOf(w);
  watchMids();
  const T = starTimes(N, 2), sites = w.sites(2), M = starMasterOf(2, 2);
  w.t = T.fallAt + 500; w.at(2, 5);
  w.frame();
  w.st(2, { p: P_MASTER, w: 4, wz: 0, kn: 0, b: 2, nd: 4 });
  await w.beat();
  const master = w.foes.stood.find((f) => f.site === sites.m);
  assert.ok(master, 'the master stood');
  assert.equal(master.mobileType, M.career);
  assert.equal(master.opts.eliteFoe, true);
  assert.equal(master.entity.name, M.name());
  assert.ok(mids.includes(M.call()), 'its call');
  assert.ok(w.sounds.includes(STAR_SOUNDS.master.clip));
  assert.equal(master.circleWard(), false, 'no circle yet');
  master.entity.maxHealth = 300;
  master.entity.health = 201;
  await w.beat();
  assert.equal(w.foes.stood.filter((f) => f.site === sites.c).length, 0, 'not before two-thirds');
  master.entity.health = 300 * STAR_CIRCLE_AT[0];
  await w.beat();
  const circle = w.foes.stood.filter((f) => f.site === sites.c);
  assert.deepEqual(circle.map((f) => f.mobileType), starCircleFoes(N, 2, 0, starCircleSize(4, false), 2));
  w.frame();
  assert.equal(master.circleWard(), true, 'warded');
  assert.ok(mids.includes(STAR_AT_TEXT.circle(M.name(), M.female)));
  for (const f of circle) { f.dead = true; f.corpse = true; }
  w.frame();
  assert.equal(master.circleWard(), false, 'broken');
  assert.equal(w.star(2).kn, 0, 'the circle\'s dead are no wave\'s kills');
  assert.ok(mids.includes(STAR_AT_TEXT.circleBroken(M.female)));
  assert.ok(w.sounds.includes(STAR_SOUNDS.circle.clip));
  master.entity.health = 300 * STAR_CIRCLE_AT[1];
  await w.beat();
  assert.equal(w.foes.stood.filter((f) => f.site === sites.c).length, circle.length * 2, 'the second call');
  master.dead = true; master.corpse = true;
  w.frame(); w.t += 2100; w.frame();
  assert.equal(w.words.at(-1).mf, 1, 'its fall in the word');
  Date.now = realNow;
});

test('STAR5 HELD AND LOST: a hold said at the star with its sound, the region told by the hub once with who held it, the defense taken down; a loss said by its cause (mutants: the over test, the once)', async () => {
  const w = world();
  clockOf(w);
  watchMids();
  const T = starTimes(N, 0), sites = w.sites(0), s0 = w.siteOf(0);
  w.t = T.fallAt + 500; w.at(0, 5);
  w.frame();
  w.st(0, { p: P_WAVE, w: 1, wz: 3 });
  await w.beat();
  w.st(0, { p: P_HELD, w: 4, hd: w.t });
  w.frame();
  assert.ok(mids.includes(STAR_AT_TEXT.held()));
  assert.ok(w.sounds.includes(STAR_SOUNDS.held.clip));
  assert.deepEqual(w.foes.dropped.sort(), Object.values(sites).sort(), 'the defense taken down');
  assert.deepEqual(w.host.wards(), []);
  const said = w.said.length;
  const hd = { k: 'hd', n: N, s: 0, px: s0.px, py: s0.py, at: w.t, top: ['Ann', 'Bran'], c: 3 };
  w.host.onStar(hd); w.host.onStar(hd);
  assert.deepEqual(w.said.slice(said), [STAR_REGION_TEXT.held(s0.near, ['Ann', 'Bran'], 3)], 'once');
  // a hold heard after its star is gone from this screen: said once all the same
  const s2 = w.siteOf(2), late = { k: 'hd', n: N, s: 2, px: s2.px, py: s2.py, at: w.t, top: ['Cy'], c: 1 };
  w.t = starTimes(N, 2).goneAt + 10; w.frame();
  assert.equal(w.star(2), undefined, 'gone');
  w.host.onStar(late); w.host.onStar(late);
  assert.deepEqual(w.said.slice(said + 1), [STAR_REGION_TEXT.held(s2.near, ['Cy'], 1)]);
  const l = world();
  clockOf(l);
  watchMids();
  l.t = starTimes(N, 1).fallAt + 500; l.at(1, 5); l.frame();
  l.st(1, { p: P_LOST, lt: 0, why: STAR_LOST_DARK, lo: l.t });
  l.frame();
  assert.ok(mids.includes(STAR_AT_TEXT.lost()));
  assert.ok(l.sounds.includes(STAR_SOUNDS.dark.clip));
  const d = world();
  clockOf(d);
  watchMids();
  d.t = starTimes(N, 1).fallAt + 500; d.at(1, 5); d.frame();
  d.st(1, { p: P_LOST, lt: 40, why: 2, lo: d.t });
  d.frame();
  assert.ok(mids.includes(STAR_AT_TEXT.dawn()), 'dawn\'s own words');
  Date.now = realNow;
});

test('STAR5 THE CAMP\'S RACE: a peer who sprang the coven first holds it - this screen stands nothing and drops what it stood; a peer silent past the orphan\'s wait holds nothing, and the star is taken over (mutants: the race, the orphan)', async () => {
  const w = world();
  clockOf(w);
  const T = starTimes(N, 0), sites = w.sites(0);
  w.t = T.fallAt + 500; w.at(0, 5);
  w.frame();
  w.st(0, { p: P_WAVE, w: 1, wz: 3 });
  await w.beat();
  assert.equal(w.foes.stood.length, 3);
  w.peer.add(sites.base); w.peerAgo = 0;
  w.frame();
  assert.deepEqual(w.foes.dropped.sort(), Object.values(sites).sort(), 'the race lost: mine dropped');
  assert.equal(w.words.at(-1).o, 0, 'no longer the owner, said at once');
  assert.equal(w.host.wards().length, 0);
  w.peerAgo = STAR_ORPHAN_MS;
  await w.beat();
  assert.deepEqual(w.forgot, [sites.base], 'the silent peer forgotten');
  assert.equal(w.foes.stood.length, 6, 'the wave stood again');
  Date.now = realNow;
});

test('STAR4 THE SKY: the omen burns over its site, the streak comes down, the landing flashes and its ring runs out; the beacon rises over the star and dims with its light as the cell says it, goes gold when it is held and out when it is lost (mutants: the dimming, the held gold, the lost dark)', () => {
  const w = world();
  clockOf(w);
  const T = starTimes(N, 0), eye = [0, 2, 0];
  w.at(0, 5);
  w.t = T.omenAt + 1000; w.frame();
  let sky = w.host.skyLists(eye);
  assert.deepEqual([sky.glows.length, sky.trails.length, sky.beacons.length], [1, 0, 0], 'the omen: a glow');
  w.t = T.streakAt + 1000; w.frame();
  sky = w.host.skyLists(eye);
  assert.deepEqual([sky.glows.length, sky.trails.length], [1, 1], 'the streak: its head and its trail');
  w.t = T.fallAt + 500; w.frame();
  sky = w.host.skyLists(eye);
  assert.ok(sky.rings.length === 1 && sky.glows.length === 1, 'the landing\'s flash and its ring');
  w.t = T.fallAt + 5000; w.frame();
  const full = w.host.skyLists(eye).beacons[0];
  assert.deepEqual([full.fade, full.held], [1, false], 'the beacon at full strength');
  w.st(0, { p: P_WAVE, lt: 50 });
  const half = w.host.skyLists(eye).beacons[0].fade;
  w.st(0, { p: P_WAVE, lt: 0 });
  const none = w.host.skyLists(eye).beacons[0].fade;
  assert.ok(half < 1 && none < half && none > 0, `it dims with the light (${half}, ${none})`);
  w.st(0, { p: P_HELD, lt: 40, hd: w.t });
  const held = w.host.skyLists(eye).beacons[0];
  assert.deepEqual([held.held, held.fade > 0.9], [true, true], 'held: gold, full');
  w.t += 30_000;
  assert.ok(w.host.skyLists(eye).beacons[0].fade < 0.6, 'and thinning');
  const l = world();
  clockOf(l);
  l.at(1, 5); l.t = starTimes(N, 1).fallAt + 5000; l.frame();
  const standing = l.host.skyLists(eye).beacons.length;   // the night's first star stands beside it
  l.st(1, { p: P_LOST, lt: 0, why: STAR_LOST_DARK, lo: l.t });
  assert.equal(l.host.skyLists(eye).beacons.length, standing - 1, 'lost: its beacon out');
  Date.now = realNow;
});

test('STAR6 THE READINGS: the Timers\' rows (the standing star and the next fall), the map\'s cards, the compass\'s nearest star in the region, the grass\'s clearing, the star\'s sites; all let go on destroyAll (mutants: the region guard, the clearing)', () => {
  const w = world();
  clockOf(w);
  const T0 = starTimes(N, 0), T1 = starTimes(N, 1);
  w.t = T0.fallAt + 500; w.at(0, 5);
  w.frame();
  assert.deepEqual(w.host.timerRows().map((r) => [r.kind, r.live, r.at]), [['star', true, T0.endAt], ['star', false, T1.fallAt]]);
  const marks = w.host.mapMarks();
  assert.equal(marks.length, 1);
  assert.deepEqual([marks[0].px, marks[0].py], [w.siteOf(0).px, w.siteOf(0).py]);
  const c = w.host.compassMark();
  assert.ok(Array.isArray(c) && c.length === 2);
  w.region = -1;
  assert.equal(w.host.compassMark(), null, 'another region\'s star is not on the compass');
  const clear = w.host.clearing();
  assert.ok(clear && clear.r > 0 && clear.key.startsWith(`${N}.0@`));
  assert.equal(w.host.isStarSite(w.sites(0).m), true);
  assert.equal(w.host.isStarSite(w.sites(0).c), true);
  assert.equal(w.host.isStarSite('300,200:7'), false);
  assert.equal(w.host.active(), true);
  w.host.destroyAll();
  assert.equal(w.host.active(), false);
  assert.deepEqual(w.host.state(), []);
  w.t = FESTIVALS[0].toMs;   // the festival over: no rows, no marks
  assert.deepEqual(w.host.timerRows(), []);
  assert.deepEqual(w.host.mapMarks(), []);
  Date.now = realNow;
});

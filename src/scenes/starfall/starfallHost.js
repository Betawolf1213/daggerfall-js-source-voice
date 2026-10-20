// @ts-check
// STAR4-STAR6 (2026-10-20, the owner: "something coming from the sky and crashing into the ground, where people need to
// defend the objective in a wave based format with a boss topping off the encounter at the end", and "multiple encounters
// spread throughout the region, not just one"): THE STARFALL IN THE WORLD. Design: bible/11-Multiplayer/Starfall.md.
//
// WHILE THE WITCHES' FESTIVAL RUNS (net/starfall/starfallLaw.js starfallRuns - the festival's own calendar, net/festivalLaw.js)
// a coven's rite pulls three stars a night down into its region's wilds (systems/starfall/starfallSites.js -
// found over this client's own map files, every client the same). Each star lives on the clock alone: its omen burns over
// the region, it tears loose and falls (render/starfall/starfallPass.js), lands with a flash, a ring of shock and the
// storms' own thunder at its distance, and stands in its crater (world/starfall/starModel.js) with its beacon over it
// until its deadline - held gold, or lost dark - and then it is gone.
//
// ITS DEFENSE is the camp law of the World of Daggerfall (world/worldOfDaggerfall/wodShared.js starSiteId): the first
// player within STAR_SPRING_M springs its coven and owns their foes - every other screen sees the owner's - and the star's
// CELL keeps its ledger (server/src/index.js `_star*`): this screen's word to it every STAR_WORD_MS (net/online.js
// sendStar), its ledger back (`st`), the waves the owner stands when the ledger says (systems/starfall/starCoven.js), the
// star a body in the owner's machine its own coven's monsters hunt (characters/enemy/enemyTargets.js huntsStar - each
// landed blow one of its light), the master and its circle - which wards it while any of it stands (scenes/
// exteriorFoes.js damageFoe, `circleWard`) - and the hold, its receipt the relay's.
//
// WHAT A PLAYER READS: the region's lines (the omen, the fall), the words at the star as its ledger moves, the hub's word
// of a hold, the tracker (ui/starfall/starTracker.js), the master's bar (ui/starfall/starBar.js), the map's cards, the
// compass and the timers row (systems/starfall/starfallClient.js). Every word through t() (systems/starfall/starWords.js).
//
// The host (scenes/world.js bootWorld) constructs it once and calls it; it owns its state and its frame (HOST-SPLIT,
// bible/01-Overview/Host-Split.md - the shape of scenes/fishHost.js). Not a DFU member. Ledger A (STARFALL).
import {
  starfallRuns, starInWindow, starNightAt, starTimes, starStreakBearing, starCircleSize, STAR_WORD_MS, STAR_ORPHAN_MS,
  STAR_CIRCLE_AT, STAR_LOW_LIGHT, STAR_LIGHT, STAR_GRACE_MS, P_WAVE, P_BREATH, P_MASTER, P_HELD, P_LOST, STAR_LOST_DARK,
} from '../../net/starfall/starfallLaw.js';
import { worldRoom } from '../../net/wire.js';
import { appStorage } from '../../systems/appStorage.js';
import { findStarSites } from '../../systems/starfall/starfallSites.js';
import { heartStar } from '../../systems/starfall/starfallNight.js';
import { covenWitches } from '../../systems/starfall/starfallCovens.js';
import { starWaveFoes, starMasterOf, starCircleFoes, covenFemale, STAR_MEMBERS } from '../../systems/starfall/starCoven.js';
import {
  starClockPhase, starStandPlaces, starCirclePlaces, starWordOf, starWordKey, starTrackerModel, starHeldKey, starMapMarks,
  starTimerRows, starHeldLine, STAR_SPRING_M, STAR_SAY_M, STAR_HUD_M, STAR_SHAKE_M, STAR_RESAY_MS,
} from '../../systems/starfall/starfallClient.js';
import { STAR_REGION_TEXT, STAR_AT_TEXT } from '../../systems/starfall/starWords.js';
import { playStarSound } from '../../systems/starfall/starSounds.js';
import { starSiteId } from '../../world/worldOfDaggerfall/wodShared.js';
import { buildStarModel, STAR_BARE_R, STAR_STONE_H } from '../../world/starfall/starModel.js';
import { starArt, STAR_ARCHIVE, STAR_GLASS_RECORD, STAR_GOLD_RECORD, STAR_DARK_RECORD } from '../../world/starfall/starArt.js';
import { StarfallPassRenderer, streakAt, omenAt, skyClamp, shockRingAt, STAR_TRAIL_M, STAR_HEAD_W, STAR_FLASH_W, STAR_FLASH_MS, STAR_FALL_COLOR } from '../../render/starfall/starfallPass.js';
import { findGateSite } from '../../systems/gate/gateSite.js';
import { thunderOf, thunderSourceAt, THUNDER_SOURCE_M } from '../../systems/distantStorms.js';
import { renownStruckAt } from '../../net/renownTracker.js';
import { setMidScreenText } from '../../ui/midScreenText.js';
import { drawGateBossBar } from '../../ui/gate/gateBossBar.js';
import { drawStarTracker, destroyStarTracker } from '../../ui/starfall/starTracker.js';
import { createStarRewards } from './starRewards.js';
import { starBarModel } from '../../ui/starfall/starBar.js';
import { playerEntity } from '../../characters/playerEntity.js';
import { audio as defaultAudio } from '../../systems/audio.js';
import { betterAmbience } from '../../systems/betterAmbience.js';
import { trs } from '../../world/mat4.js';

/** The crater and its stone are built for a player this near (beyond it the beacon and the sky alone). */
export const STAR_BUILD_M = 1500;
/** The landing's flash lights the land this far. */
export const STAR_FLASH_LIGHT_M = 400;
/** The stone's own glow, for a player near it. */
export const STAR_GLOW_RANGE = 14;
export const STAR_GLOW_REACH_M = 90;
/** The held beacon thins over this long after the hold. */
export const STAR_HELD_FADE_MS = 60_000;
/** A standing star's beacon at no light left: this share of its full strength (it never quite goes out before it is lost). */
export const STAR_BEACON_DIM = 0.3;
/** A stand that stood nothing is tried again this long after. */
export const STAR_RESTAND_MS = 4000;
/** The star's hum is played this often for a player near it. */
export const STAR_HUM_MS = 7000;
/** The ground under the crater is read again every this many frames, the stone made again when it moved this far. */
export const STAR_GROUND_EVERY = 20;
export const STAR_GROUND_TOL = 0.01;
/** The collider's bucket a star's stone stands under. */
export const starBucket = (key) => `star:${key}`;
/** Where a character's own blows on a star are kept across a page's reload (the owner's count - the relay credits a
 *  count past its last, so a reloaded owner counts on from its own). */
export const STAR_BLOWS_STORE = 'dagger:starBlows';

const NONE = Object.freeze([]);
const DOWN = [0, -1, 0];
const hitDistance = (hit) => (hit && Number.isFinite(hit.dist) ? hit.dist : null);
const dist2 = (a, x, z) => Math.hypot(a[0] - x, a[2] - z);

/** The blows this character's foes landed on each star, kept across a reload. */
function blowStore(storage) {
  let map = {};
  try { const v = JSON.parse(storage?.getItem?.(STAR_BLOWS_STORE) ?? '{}'); if (v && typeof v === 'object') map = v; } catch { map = {}; }
  return {
    get: (key) => (Number.isSafeInteger(map[key]) ? map[key] : 0),
    set(key, n, night) {
      map[key] = n;
      for (const k of Object.keys(map)) if (!(Number(k.split('.')[0]) >= night - 1)) delete map[k];   // a night gone lets its counts go
      try { storage?.setItem?.(STAR_BLOWS_STORE, JSON.stringify(map)); } catch { /* a private window keeps none */ }
    },
  };
}

/**
 * THE HOST'S BINDINGS, BY NAME (the shape of the moved modules' - scenes/travelViewMarks.js): the world's own things,
 * read here as this module needs them - its settled ones by value, every live one (a `let` the world writes) through a
 * getter on `host`. `renderer`, `state` (pixelTranslation), `exteriorFoes`, `gateScanOf` and `warmGateScan` (the gate's
 * scan, which the night's stars are found over), `surfaceAt` and `gateGroundAt` (the drawn ground, and the coarse one
 * past it), `player`, `walkMode` and `playerSpawned` (the feet), `online` (the session), the camp law's five
 * (`_wodPeerSprung`, `wodPeerHeldAgo`, `wodForgetPeer`, `wodSprang`, `wodUnsprang`), `chatNotice`, `labGrassField`,
 * `_questRegionIndex`, `gamePaused` and `townTalk` (the HUD's hide), `collider`, `_sharedOffsetMs`; STAR7's rewards'
 * (scenes/starfall/starRewards.js): `takeSpoil`, `relayNowS`, `marksBook`, `renownXpAdopt`, `renownAdopt`, `renownRose`,
 * `renownSaid` - and, for the tests, `audio`, `storage`, `starAccount` and `rewardsStorage`.
 * @param {any} host
 */
export function createStarfallHost(host) {
  const renderer = host.renderer ?? null;
  const collider = () => host.collider ?? null;
  const now = () => Date.now() + (host._sharedOffsetMs ?? 0);
  const scan = () => host.gateScanOf?.(() => false) ?? null;   // a row an ask - the rest the idle warm's (the Hollow's way)
  const warmScan = () => host.warmGateScan?.();
  const pixelTranslation = (px, py, out) => host.state.pixelTranslation(px, py, out);
  const groundAt = (x, z) => host.surfaceAt?.(x, z) ?? NaN;
  const coarseGround = host.gateGroundAt ? (px, py, x, z) => host.gateGroundAt(px, py, x, z) : null;
  const feet = () => (host.walkMode && host.playerSpawned ? host.player?.feetAt?.() ?? null : null);
  const session = () => host.online ?? null;
  const foes = host.exteriorFoes ?? null;
  const camp = {
    peerSprang: (site) => !!host._wodPeerSprung?.has(site), peerHeldAgo: (site) => host.wodPeerHeldAgo?.(site) ?? 0,
    forgetPeer: (site) => host.wodForgetPeer?.(site), sprang: (site) => host.wodSprang?.(site), unsprang: (site) => host.wodUnsprang?.(site),
  };
  const say = (text) => host.chatNotice?.(text);
  const onBare = (x0, z0, x1, z1) => host.labGrassField?.invalidate?.(x0, z0, x1, z1);
  const shake = (k) => betterAmbience.weaponKick?.(k);
  const regionAt = () => host._questRegionIndex?.() ?? -1;
  const hudHidden = () => !!host.gamePaused?.() || !!host.townTalk?.hudHidden;
  const two = (v) => String(v).padStart(2, '0');
  const localTime = (ms) => { const d = new Date(ms); return Number.isFinite(ms) ? `${two(d.getHours())}:${two(d.getMinutes())}` : ''; };
  const rewards = createStarRewards(host);   // STAR7: the receipts carried, the spoils given, the Renown adopted
  const storage = host.storage !== undefined ? host.storage : appStorage();   // the desktop app's file store, or the browser's
  const audio = host.audio ?? defaultAudio;
  /** The frame's fog, as the gate's pass is handed it. */
  const fogOf = () => (renderer ? { mode: renderer._fogMode, density: renderer._fogDensity, range: renderer._fogRange, color: renderer._fogColor, camPos: renderer._camPos, focus: renderer._focus, haze: renderer._haze } : null);
  /** night -> its stars (findStarSites), or null where the scan had none */
  const nights = new Map();
  /** starHeldKey -> the star's own record on this screen (made as it comes into its omen, let go when it is gone) */
  const stars = new Map();
  /** starHeldKey -> the cell's last word of it (`st`), and when it came */
  const ledgers = new Map();
  /** starHeldKey -> the hub's word of a hold: `{ top, c, at }` */
  const held = new Map();
  const blows = blowStore(storage);
  let pass = null, passTried = false, artUp = false, frameN = 0, barUp = false, trackerUp = false;
  const thunders = [];   // [{ due, clip, volume, x, z }]
  const glow = { x: 0, y: 0, z: 0, range: STAR_GLOW_RANGE }, glowList = Object.freeze([glow]);
  const flashLight = { x: 0, y: 0, z: 0, range: STAR_FLASH_LIGHT_M, color: STAR_FALL_COLOR };
  const sky = { beacons: [], glows: [], trails: [], rings: [] };
  const T3 = [0, 0, 0];

  // ── the night's stars ──
  function sitesOf(n) {
    if (nights.has(n)) return nights.get(n);
    let sc = null;
    try { sc = scan(); } catch { sc = null; }
    if (!sc) { warmScan(); return NONE; }   // the gate's scan is still being made in the browser's idle moments
    let list = NONE;
    // a star whose landing is outside the festival's window is none (the relay hears no word of it - starWordHeard)
    try { list = Object.freeze(findStarSites(n, sc, { gateSiteOf: (day) => { try { return findGateSite(day, sc); } catch { return null; } } }).filter((s) => starInWindow(s.n, s.k))); } catch (e) { console.warn('[star] no sites', e?.message ?? e); }
    nights.set(n, list);
    for (const k of [...nights.keys()]) if (k < n - 2) nights.delete(k);
    return list;
  }
  /** The night's stars and the night before's (its last star stands into this hour), each with its key. */
  function nightSites(t) {
    const n = starNightAt(t);
    return [...sitesOf(n - 1), ...sitesOf(n)];
  }

  // ── a star's place in the scene ──
  function placeOf(S) {
    const t = pixelTranslation(S.site.px, S.site.py, T3);
    const x = t[0] + S.site.spot[0], z = t[2] + S.site.spot[1];
    let y = groundAt(x, z);
    S.known = Number.isFinite(y);
    if (!S.known) y = coarseGround ? coarseGround(S.site.px, S.site.py, x, z) : NaN;
    S.heart[0] = x; S.heart[1] = Number.isFinite(y) ? y : t[1]; S.heart[2] = z;
  }
  const heightAt = (S) => (lx, lz) => { const y = groundAt(S.heart[0] + lx, S.heart[2] + lz); return Number.isFinite(y) ? y - S.heart[1] : 0; };
  /** The ground about the heart read again every so often - a pixel built finer moves it - and the model made again. */
  function ground(S) {
    if (!S.known) return;
    const moved = !S.madeAt || S.madeAt[0] !== S.heart[0] || S.madeAt[1] !== S.heart[1] || S.madeAt[2] !== S.heart[2];
    let changed = false;
    if (moved || frameN - S.sampledAt >= STAR_GROUND_EVERY) {
      S.sampledAt = frameN;
      const h = heightAt(S);
      for (let i = 0; i < S.sig.length; i++) {
        const a = (i / S.sig.length) * 2 * Math.PI, r = i % 2 ? 3 : 8;
        const v = h(Math.sin(a) * r, Math.cos(a) * r);
        if (!(Math.abs(v - S.sig[i]) <= STAR_GROUND_TOL)) { changed = true; S.sig[i] = v; }
      }
    }
    if (moved) { S.madeAt = [...S.heart]; S.mat = trs(S.heart[0], S.heart[1], S.heart[2], 0, 0, 0); }
    if (changed) S.groundGen++;
  }
  /** The record the stone wears now, and whether its thread still stands. */
  const looks = (S) => {
    const L = ledgers.get(S.key), h = held.has(S.key) || L?.p === P_HELD, lost = !h && (L?.p === P_LOST || S.phase === 'after');
    return { glass: h ? STAR_GOLD_RECORD : lost ? STAR_DARK_RECORD : STAR_GLASS_RECORD, thread: !h, held: h, lost };
  };
  function ensureMesh(S) {
    if (!renderer?.createMesh || !S.known) return;
    const L = looks(S), want = `${S.groundGen}:${L.glass}:${L.thread ? 1 : 0}`;
    if (S.meshKey === want) return;
    try {
      if (!artUp) {
        for (const [rec, art] of starArt()) { renderer.uploadTexture?.(STAR_ARCHIVE, rec, art.albedo); renderer.uploadEmissionTexture?.(STAR_ARCHIVE, rec, art.emission, { white: true }); }
        artUp = true;
      }
      const h = heightAt(S);
      const next = renderer.createMesh(buildStarModel(S.site.n, S.site.k, h, { glass: L.glass, thread: L.thread }));
      if (S.mesh) renderer.destroyMesh?.(S.mesh);
      S.mesh = next; S.meshKey = want;
      const col = collider?.();
      if (col?.addMesh && S.colliderGen !== S.groundGen) {
        const stone = buildStarModel(S.site.n, S.site.k, h, { ground: false, thread: false });
        col.removeBucket?.(starBucket(S.key));
        col.addMesh(starBucket(S.key), stone.positions, stone.indices, S.mat);
        S.colliderGen = S.groundGen;
      }
    } catch (e) { console.warn('[star] the crater would not build', e?.message ?? e); S.meshKey = want; }
  }
  function dropMesh(S) {
    if (S.mesh) { renderer?.destroyMesh?.(S.mesh); S.mesh = null; S.meshKey = ''; }
    if (S.colliderGen !== -1) { collider?.()?.removeBucket?.(starBucket(S.key)); S.colliderGen = -1; }
    if (S.bared) { S.bared = false; bareSaid(S); }
  }
  const bareSaid = (S) => onBare(S.heart[0] - STAR_BARE_R, S.heart[2] - STAR_BARE_R, S.heart[0] + STAR_BARE_R, S.heart[2] + STAR_BARE_R);

  // ── a star on this screen ──
  function enter(site) {
    const key = starHeldKey(site.n, site.k, site.px, site.py);
    const S = {
      key, site, heart: [0, 0, 0], known: false, phase: 'none', heartStar: heartStar(site.n, site.k),
      sites: { base: starSiteId(site.px, site.py, site.n, site.k), m: starSiteId(site.px, site.py, site.n, site.k, 'm'), c: starSiteId(site.px, site.py, site.n, site.k, 'c') },
      cell: worldRoom(site.px, site.py), madeAt: null, mat: null, sampledAt: -Infinity, sig: new Float64Array(12).fill(NaN), groundGen: 0,
      mesh: null, meshKey: '', colliderGen: -1, bared: false,
      said: new Set(), impactAt: NaN, humAt: -Infinity,
      // the defense, this screen's own
      own: false, camp: null, stoodWave: 0, pending: 0, standAt: -Infinity, waveFoes: new Set(), counted: new Set(), kn: 0, wc: 0,
      master: null, masterStood: false, calls: 0, mf: false, struck: false, hb: blows.get(key), wordAt: -Infinity, saidKey: '', resayAt: Infinity,
      ward: null, fellAt: NaN, circle: 0, circleSeen: 0, broken: 0, masterFoe: null,
    };
    S.ward = makeWard(S);
    stars.set(key, S);
    return S;
  }
  function leave(S) {
    dropDefense(S);
    dropMesh(S);
    stars.delete(S.key);
  }
  /** My own foes of the star taken down and its sites said to be nobody's - the star's over, or I walked off. */
  function dropDefense(S) {
    if (S.own || S.pending || S.waveFoes.size || S.master) for (const s of Object.values(S.sites)) { foes?.dropSiteFoes?.(s); camp.unsprang?.(s); }
    S.own = false; S.stoodWave = 0; S.waveFoes.clear(); S.master = null; S.masterStood = false; S.calls = 0;
  }

  /** THE STAR AS A BODY in the owner's machine (the townsperson's shape, systems/livingWorld/quarry.js): quarry for its own
   *  coven's monsters alone (huntsStar), each landed blow one of its light - counted, kept, said in the word. */
  function makeWard(S) {
    const ward = {
      starWard: true, site: S.sites.base, living: true,
      ai: { feet: [0, 0, 0], height: STAR_STONE_H, centreOffset: STAR_STONE_H / 2, target: null, isHostile: false, wouldBeSpawned: true, yaw: 0 },
      entity: { team: 'Civilian', mobileTeam: 'Civilian', health: 1000, maxHealth: 1000 },
      hurtFromFoe() {
        S.hb++;
        blows.set(S.key, S.hb, S.site.n);
        playStarSound(audio, 'blow', S.heart);
        return 1;
      },
    };
    return ward;
  }

  // ── the defense ──
  const ownSite = (f, S) => !!f && (f.site === S.sites.base || f.site === S.sites.m || f.site === S.sites.c);
  /** Stand `careers` at `places` ([dx, dz, yaw] from the heart, or from `about`) under `site`: placed, in no save, never an
   *  elite of its own (the master alone is). Each foe landed is made the star's (`made`). */
  function stand(S, careers, places, site, made, { elite = false, about = null } = {}) {
    if (!foes?.spawnFoe) return;
    S.standAt = now();
    const camp0 = S.camp ?? (S.camp = foes.newCampId?.() ?? null);
    careers.forEach((career, i) => {
      const [dx, dz, yaw] = places[i % places.length];
      const x = (about ?? S.heart)[0] + dx, z = (about ?? S.heart)[2] + dz;
      const y = groundAt(x, z);
      if (!Number.isFinite(y)) return;
      const hit = collider?.()?.surfaceHit?.([x, y + 0.2, z], DOWN, 3);
      S.pending++;
      const landed = (f) => {
        S.pending--;
        if (!f) return;
        if (stars.get(S.key) !== S || !S.own) { foes.removeFoe?.(f); return; }   // the star went, or the foes were given up, while they stood
        f.starSite = S.sites.base;   // its hunters' (huntsStar)
        f.campId = camp0;
        if (f.entity) f.entity.campId = camp0;
        made(f);
      };
      Promise.resolve(foes.spawnFoe(career, [x, y, z], { yaw: yaw ?? 0, gender: covenFemale(career) ? 'female' : null, placed: true, groundAlign: { hitDist: hitDistance(hit) }, site, transient: true, eliteFoe: elite }))
        .then(landed, () => landed(null));
    });
  }
  /** Every screen's foes of the star named (its witches by their coven, the master by its own name) and counted; mine
   *  read - who struck, what fell - and my hunters turned once a defender's blow lands. */
  function tend(S) {
    let master = null, circle = 0;
    const member = S.site.coven.member(), M = starMasterOf(ledgers.get(S.key)?.b ?? 1, S.site.k);
    for (const f of foes?.foes ?? NONE) {
      if (!ownSite(f, S)) continue;
      const e = f.entity, career = f.mobileType;
      if (e) {
        const name = f.site === S.sites.m ? M.name() : STAR_MEMBERS.includes(career) ? member : null;
        if (name && e.name !== name) { e.name = name; e.properName = name; }
      }
      if (!S.struck && renownStruckAt(f) != null) S.struck = true;
      if (f.site === S.sites.m) master = f;
      if (f.dead) {
        if (!f.corpse) continue;   // gone without a body: walked off, no fall
        const k = f.puppet ? `${f.puppet}:${f.seq}` : f;
        if (S.counted.has(k)) continue;
        S.counted.add(k);
        if (!f.puppet && S.waveFoes.has(f)) S.kn++;
        if (f.site === S.sites.m && !f.puppet) S.mf = true;
        continue;
      }
      if (f.site === S.sites.c) circle++;
      if (!f.puppet && f.starSite && !f.starTurned && e && e.health < e.maxHealth) f.starTurned = true;   // a defender's blow turns it
    }
    // THE CIRCLE, SAID ON EVERY SCREEN: its calls by the master's health (the owner's, or its copy's), its breaking when the
    // last of a call falls
    const me = master?.entity;
    if (me && !master.dead && me.maxHealth > 0) STAR_CIRCLE_AT.forEach((at, i) => { if (me.health / me.maxHealth <= at) sayAt(S, `circle${i}`, M.circle()); });
    if (circle > 0) S.circleSeen = circle;
    else if (S.circleSeen > 0) { S.circleSeen = 0; S.broken++; sayAt(S, `broken${S.broken}`, STAR_AT_TEXT.circleBroken(M.female)); playStarSound(audio, 'circle', S.heart); }
    S.circle = circle;
    S.masterFoe = master;
    if (master?.dead && !Number.isFinite(S.fellAt)) S.fellAt = now();
  }
  /** Whether I hold the star's foes: I sprang them and no peer holds them - a peer silent STAR_ORPHAN_MS holds nothing. */
  function holds(S) {
    if (camp.peerSprang?.(S.sites.base)) {
      if (!(camp.peerHeldAgo?.(S.sites.base) >= STAR_ORPHAN_MS)) return false;
      camp.forgetPeer?.(S.sites.base);
    }
    return true;
  }
  /** THE OWNER'S STAND, as the ledger says: each wave its size (the rest of it, taken over mid-wave), the master, and its
   *  circle at each of its calls. */
  function owner(S, L) {
    if (!S.own) {
      S.own = true;
      for (const s of Object.values(S.sites)) { foes?.reclaimSite?.(s); camp.sprang?.(s); }
    }
    if (!L || S.pending) return;
    // a wave none of whose foes stood (no ground under its places, a full pool) is stood again a moment on
    if (L.p === P_WAVE && S.stoodWave === L.w && !S.waveFoes.size && now() - S.standAt >= STAR_RESTAND_MS) S.stoodWave = 0;
    if (L.p === P_WAVE && S.stoodWave !== L.w) {
      S.stoodWave = L.w; S.kn = L.kn; S.wc = 0; S.waveFoes.clear();
      const careers = starWaveFoes(S.site.n, S.site.k, L.w, Math.max(0, L.wz - L.kn), L.b);
      stand(S, careers, starStandPlaces(S.site.n, S.site.k, L.w, careers.length), S.sites.base, (f) => S.waveFoes.add(f));
      return;
    }
    if (L.p === P_WAVE && S.stoodWave === L.w && !S.pending && S.waveFoes.size && [...S.waveFoes].every((f) => f.dead)) S.wc = L.w;
    if (L.p === P_MASTER && !S.masterStood) {
      S.masterStood = true;
      const M = starMasterOf(L.b, S.site.k);
      stand(S, [M.career], starStandPlaces(S.site.n, S.site.k, 9, 1), S.sites.m, (f) => {
        S.master = f;
        if (f.entity) { f.entity.name = M.name(); f.entity.properName = M.name(); }
        f.circleWard = () => (S.circle | 0) > 0;
      }, { elite: true });
      return;
    }
    // THE CIRCLE: at two-thirds and a third of the master's health, its call - the fourth wave's roster about it
    const m = S.master, e = m?.entity;
    if (m && !m.dead && e && S.calls < STAR_CIRCLE_AT.length && e.health / e.maxHealth <= STAR_CIRCLE_AT[S.calls]) {
      const call = S.calls++;
      const size = starCircleSize(L.nd, S.heartStar);
      stand(S, starCircleFoes(S.site.n, S.site.k, call, size, L.b), starCirclePlaces(size).map(([dx, dz]) => [dx, dz, 0]), S.sites.c, () => {}, { about: m.ai?.feet ?? S.heart });
    }
  }
  /** THE WORD to the star's cell - every STAR_WORD_MS while I stand at it, at once when it changes and once more a moment
   *  after (the relay's bucket may drop it). */
  function word(S, t) {
    const s = session();
    if (!s?.starReady?.(S.cell)) return;
    const w = starWordOf(S.site, { struck: S.struck, own: S.own, kn: S.kn, wc: S.wc, hb: S.hb, mf: S.mf }, playerEntity.level ?? 1);
    const key = starWordKey(w), changed = key !== S.saidKey;
    if (!changed && t - S.wordAt < STAR_WORD_MS && t < S.resayAt) return;
    if (!s.sendStar(w, S.cell)) return;
    S.resayAt = changed ? t + STAR_RESAY_MS : Infinity;
    S.wordAt = t; S.saidKey = key;
  }
  function defend(S, t, d) {
    const L = ledgers.get(S.key) ?? null;
    if (foes && d <= STAR_HUD_M) tend(S);
    const over = held.has(S.key) || L?.p === P_HELD || L?.p === P_LOST || S.phase !== 'fallen';
    if (over) { if (S.own) dropDefense(S); return; }
    const s = session();
    const online = !!s?.starReady?.(S.cell);
    if (online && foes && S.known && d <= STAR_SPRING_M && holds(S)) owner(S, L);
    else if (S.own && (d > STAR_HUD_M || camp.peerSprang?.(S.sites.base))) dropDefense(S);   // walked off, or a peer won the race
    if (online && d <= STAR_SAY_M && t < starTimes(S.site.n, S.site.k).endAt + STAR_GRACE_MS) word(S, t);
  }

  // ── the words ──
  /** Said once a star: to the coven's region (`region`), at the star (`at`), or to everyone. */
  function sayOnce(S, id, text, how = 'chat') {
    if (!text || S.said.has(id)) return;
    S.said.add(id);
    if (how === 'mid') setMidScreenText(text, 4); else say(text);
  }
  function sayAt(S, id, text) {
    const f = feet();
    if (f && dist2(S.heart, f[0], f[2]) <= STAR_HUD_M) sayOnce(S, id, text, 'mid');
  }
  const inRegion = (S) => regionAt() === S.site.region;
  /** The ledger's moves, said at the star as they come (each once). */
  function ledgerSaid(S, L, was) {
    if (!L) return;
    const M = starMasterOf(L.b, S.site.k);
    if (L.p === P_WAVE && (!was || was.w !== L.w)) sayAt(S, `wave${L.w}`, STAR_AT_TEXT.wave(L.w));
    if (L.p === P_BREATH && was?.p === P_WAVE) sayAt(S, `breath${L.w}`, STAR_AT_TEXT.breath());
    if (L.lt <= STAR_LOW_LIGHT && !(was?.lt <= STAR_LOW_LIGHT) && L.p !== P_LOST) sayAt(S, 'low', STAR_AT_TEXT.low());
    if (L.p === P_MASTER && was?.p !== P_MASTER) { sayAt(S, 'master', M.call()); playStarSound(audio, 'master', S.heart); }
    if (L.p === P_HELD && was?.p !== P_HELD) { sayAt(S, 'held', S.heartStar ? STAR_AT_TEXT.heldHeart() : STAR_AT_TEXT.held()); playStarSound(audio, 'held', S.heart); }
    if (L.p === P_LOST && was?.p !== P_LOST) { sayAt(S, 'lost', L.why === STAR_LOST_DARK ? STAR_AT_TEXT.lost() : STAR_AT_TEXT.dawn()); playStarSound(audio, 'dark', S.heart); }
    if (was && L.lt < was.lt && !S.own) playStarSound(audio, 'blow', S.heart, 0.6);   // a blow on the star, heard where its foes are a peer's
  }

  // ── the clock's moments ──
  function moments(S, t, f) {
    const T = starTimes(S.site.n, S.site.k);
    const d = f ? dist2(S.heart, f[0], f[2]) : Infinity;
    if (S.phase === 'omen' && inRegion(S)) {
      sayOnce(S, 'omen', S.heartStar ? STAR_REGION_TEXT.omenHeart(S.site.near, covenWitches(S.site.coven)) : STAR_REGION_TEXT.omen(S.site.near, covenWitches(S.site.coven)));
      if (!S.said.has('omenSound')) { S.said.add('omenSound'); playStarSound(audio, 'omen'); }
    }
    if (S.phase === 'streak' && inRegion(S) && !S.said.has('fallSound')) { S.said.add('fallSound'); playStarSound(audio, 'fall', null, 0.5 + 0.5 * Math.max(0, 1 - d / 8000)); }
    if ((S.phase === 'fallen' || S.phase === 'after') && !Number.isFinite(S.impactAt)) {
      S.impactAt = T.fallAt;
      if (t - T.fallAt < 4000) {   // the landing seen as it happens (a page opened later finds it standing)
        if (inRegion(S)) sayOnce(S, 'fell', STAR_REGION_TEXT.fell(S.site.near));
        if (d <= 2000) playStarSound(audio, 'impact', S.heart);
        const th = thunderOf(d);
        if (th) thunders.push({ due: T.fallAt + th.delay * 1000, clip: th.clip, volume: th.volume, x: S.heart[0], z: S.heart[2] });
        if (d <= STAR_SHAKE_M) shake(4 * (1 - d / STAR_SHAKE_M));
      }
    }
    if (S.phase === 'fallen' && d <= 40 && t - S.humAt >= STAR_HUM_MS) { S.humAt = t; playStarSound(audio, 'hum', S.heart); }
  }

  // ── what is drawn in the sky ──
  function skyOf(S, t, eye) {
    const T = starTimes(S.site.n, S.site.k), L = looks(S);
    if (S.phase === 'omen') {
      const o = omenAt(S.heart, (t - T.omenAt) / (T.streakAt - T.omenAt)), c = skyClamp(eye, o.at);
      sky.glows.push({ at: c.at, w: o.w * c.s, color: STAR_FALL_COLOR, light: 0.9 });
    } else if (S.phase === 'streak') {
      const k = (t - T.streakAt) / (T.fallAt - T.streakAt), st = streakAt(S.heart, starStreakBearing(S.site.n, S.site.k), k), c = skyClamp(eye, st.head);
      sky.trails.push({ head: c.at, dir: st.dir, len: STAR_TRAIL_M * c.s, w: STAR_HEAD_W * 0.5 * c.s, color: STAR_FALL_COLOR, light: 1 });
      sky.glows.push({ at: c.at, w: STAR_HEAD_W * c.s, color: STAR_FALL_COLOR, light: 1.2 });
    }
    if (S.phase === 'fallen' || S.phase === 'after') {
      const since = t - T.fallAt;
      if (since < STAR_FLASH_MS) {
        const c = skyClamp(eye, [S.heart[0], S.heart[1] + 6, S.heart[2]]);
        sky.glows.push({ at: c.at, w: STAR_FLASH_W * c.s * (1 - since / STAR_FLASH_MS * 0.5), color: STAR_FALL_COLOR, light: 2 * (1 - since / STAR_FLASH_MS) });
      }
      const ring = shockRingAt(since);
      if (ring.fade > 0 && S.known) sky.rings.push({ at: S.heart, r: ring.r, fade: ring.fade, color: STAR_FALL_COLOR });
      // the beacon dims with the star's light as the cell says it - a star failing is seen from across the region
      const lt = ledgers.get(S.key)?.lt, dim = Number.isFinite(lt) ? STAR_BEACON_DIM + (1 - STAR_BEACON_DIM) * Math.max(0, Math.min(1, lt / STAR_LIGHT)) : 1;
      const fade = L.held ? Math.max(0, 1 - (t - (held.get(S.key)?.at ?? ledgers.get(S.key)?.hd ?? t)) / STAR_HELD_FADE_MS) : L.lost ? 0 : Math.min(1, since / 3000) * dim;
      if (fade > 0) sky.beacons.push({ origin: [S.heart[0], S.heart[1] + STAR_STONE_H, S.heart[2]], fade, held: L.held });
    }
  }

  return {
    /** THE FRAME: the night's stars entered, stepped and let go; each one's moments said, its crater built, its defense
     *  run; the tracker and the master's bar drawn. Answers the star this player stands nearest, or null. */
    frame() {
      try { rewards.tick(); } catch (e) { console.warn('[star] claims', e?.message ?? e); }   // STAR7: what is kept, offered in its time - festival or not
      try { return this.step(); } catch (e) { console.warn('[star] host', e?.message ?? e); return null; }
    },
    /** The frame's work (frame's, inside its catch). */
    step() {
      frameN++;
      const t = now();
      if (!starfallRuns(t)) { this.destroyAll(); return null; }
      const f = feet();
      const seen = new Set();
      for (const site of nightSites(t)) {
        const phase = starClockPhase(site.n, site.k, t);
        const key = starHeldKey(site.n, site.k, site.px, site.py);
        if (phase === 'none' || phase === 'gone') continue;
        seen.add(key);
        const S = stars.get(key) ?? enter(site);
        S.phase = phase;
        placeOf(S);
        S.ward.ai.feet[0] = S.heart[0]; S.ward.ai.feet[1] = S.heart[1]; S.ward.ai.feet[2] = S.heart[2];
        moments(S, t, f);
        const d = f ? dist2(S.heart, f[0], f[2]) : Infinity;
        if ((phase === 'fallen' || phase === 'after') && d <= STAR_BUILD_M && S.known) {
          ground(S);
          if (!S.bared) { S.bared = true; bareSaid(S); }
          ensureMesh(S);
        } else if (S.mesh && d > STAR_BUILD_M * 1.2) dropMesh(S);
        if (phase === 'fallen' || S.own) defend(S, t, d);
      }
      for (const S of [...stars.values()]) if (!seen.has(S.key)) leave(S);
      while (thunders.length && thunders[0].due <= t) {
        const th = thunders.shift();
        if (t - th.due < 1000 && f) { try { audio.play3d?.(th.clip, thunderSourceAt(f, th.x, th.z), th.volume, { refDistance: THUNDER_SOURCE_M, maxDistance: THUNDER_SOURCE_M * 8, far: true }); } catch { /* no audio */ } }
      }
      if (!pass && !passTried && renderer?.gl && stars.size) { passTried = true; try { pass = new StarfallPassRenderer(renderer.gl); } catch (e) { console.warn('[star] the sky pass would not build', e?.message ?? e); } }
      // the tracker and the bar: the star this player stands nearest, within STAR_HUD_M
      const near = this.nearest();
      const hidden = hudHidden();
      if (near) {
        const L = ledgers.get(near.key) ?? null, M = starMasterOf(L?.b ?? 1, near.site.k);
        drawStarTracker(starTrackerModel(near.site, L, t, M.name(), held.has(near.key)), { hidden }); trackerUp = true;
        const m = near.masterFoe;
        const bar = m && (!m.dead || t - near.fellAt < 4000) ? starBarModel({ name: M.name(), heart: near.heartStar, hp: m.entity?.health ?? 0, max: m.entity?.maxHealth ?? 1, circle: near.circle, her: M.female, defenders: L?.nd ?? 0, fellAt: m.dead ? near.fellAt : null }, t) : null;
        if (bar || barUp) { drawGateBossBar(bar, { hidden }); barUp = !!bar; }
      } else {
        if (trackerUp) { drawStarTracker(null); trackerUp = false; }
        if (barUp) { drawGateBossBar(null); barUp = false; }
      }
      return near;
    },
    /** The star this player stands nearest, within STAR_HUD_M and fallen or standing after, or null. */
    nearest() {
      const f = feet();
      if (!f) return null;
      let best = null, bd = STAR_HUD_M;
      for (const S of stars.values()) {
        if (!S.known || (S.phase !== 'fallen' && S.phase !== 'after')) continue;
        const d = dist2(S.heart, f[0], f[2]);
        if (d <= bd) { bd = d; best = S; }
      }
      return best;
    },
    /**
     * A STAR WORD (net/wire.js validStarOut): a cell's ledger (`st`), a hold (`hd`, the cell's or the hub's), the night's
     * held stars at a hello (`hds`), my receipt (`rc`).
     */
    onStar(w) {
      if (!w) return;
      if (w.k === 'rc') { rewards.receipt(w.r); return; }
      if (w.k === 'hds') { for (const [n, s, px, py, at] of w.l) if (!held.has(starHeldKey(n, s, px, py))) held.set(starHeldKey(n, s, px, py), { top: [], c: 0, at }); return; }
      const key = starHeldKey(w.n, w.s, w.px, w.py);
      if (w.k === 'hd') {
        const first = !held.get(key)?.c;
        held.set(key, { top: w.top, c: w.c, at: w.at });
        if (first) {
          const site = nightSites(now()).find((s) => starHeldKey(s.n, s.k, s.px, s.py) === key) ?? null;
          const S = stars.get(key);
          const line = starHeldLine(site, w.top, w.c);
          if (line && !(S?.said.has('heldRegion'))) { S?.said.add('heldRegion'); say(line); }
        }
        return;
      }
      const was = ledgers.get(key) ?? null;
      ledgers.set(key, w);
      const S = stars.get(key);
      if (S) ledgerSaid(S, w, was);
    },
    /** The fallen stars this machine stands as bodies - its own coven's hunters' quarry (the senses' candidates). */
    wards() {
      const out = [];
      for (const S of stars.values()) if (S.own && S.phase === 'fallen' && S.known) out.push(S.ward);
      return out;
    },
    /** The craters and their stones, in the host's world pass. */
    draw(r = renderer, texRemap = null) {
      if (!r?.drawMesh) return 0;
      let n = 0;
      for (const S of stars.values()) if (S.mesh && S.mat) { r.drawMesh(S.mesh, S.mat, texRemap); n++; }
      return n;
    },
    /** The stone's glow, for a player near a standing star - one light, moved in place. */
    lights() {
      const near = this.nearest();
      const f = feet();
      if (!near || !f || dist2(near.heart, f[0], f[2]) > STAR_GLOW_REACH_M || looks(near).lost) return NONE;
      glow.x = near.heart[0]; glow.y = near.heart[1] + STAR_STONE_H * 0.6; glow.z = near.heart[2];
      return glowList;
    },
    /** The landing's flash, while it burns near (the frame's one flash light - renderer.setFlashLight), or null. */
    flash() {
      const t = now(), f = feet();
      for (const S of stars.values()) {
        const since = t - starTimes(S.site.n, S.site.k).fallAt;
        if (since >= 0 && since < STAR_FLASH_MS && f && dist2(S.heart, f[0], f[2]) <= STAR_FLASH_LIGHT_M * 4) {
          flashLight.x = S.heart[0]; flashLight.y = S.heart[1] + 20; flashLight.z = S.heart[2];
          flashLight.range = STAR_FLASH_LIGHT_M * (1 - since / STAR_FLASH_MS);
          return flashLight;
        }
      }
      return null;
    },
    /** Whether anything of the Starfall is in the sky - the host builds the pass's arguments only then. */
    showing: () => !!pass && stars.size > 0,
    /** The sky's pass, after the world's: the omens, the falls, the flashes, the rings, the beacons. */
    drawSky(proj, view, eye, seconds, fog = fogOf()) {
      if (!pass || !eye) return 0;
      return pass.draw(this.skyLists(eye), proj, view, eye, seconds, fog);
    },
    /** What the sky's pass is handed for an eye this frame - `{ beacons, glows, trails, rings }`, its lists filled in place
     *  (drawSky's, and the tests'). */
    skyLists(eye) {
      const t = now();
      sky.beacons.length = 0; sky.glows.length = 0; sky.trails.length = 0; sky.rings.length = 0;
      for (const S of stars.values()) skyOf(S, t, eye);
      return sky;
    },
    /** The map's cards for the night's stars (ui/eventMapMarks.js's shape). */
    mapMarks() { return starfallRuns(now()) ? starMapMarks(nightSites(now()), now(), { held, led: ledgers, localTime }) : NONE; },
    /** The compass's mark: the nearest star of the night in this player's region, from its omen until it is gone - the
     *  scene's [x, z] - or null. */
    compassMark() {
      const f = feet();
      if (!f) return null;
      let best = null, bd = Infinity;
      for (const S of stars.values()) {
        if (!inRegion(S) || S.phase === 'none' || S.phase === 'gone') continue;
        const d = dist2(S.heart, f[0], f[2]);
        if (d < bd) { bd = d; best = S; }
      }
      return best ? [best.heart[0], best.heart[2]] : null;
    },
    /** The Timers window's rows: each star standing undecided to its deadline, and the next fall with its coven - the
     *  next night's first once this night's last is down. */
    timerRows() {
      const t = now();
      if (!starfallRuns(t)) return NONE;
      const decided = (key) => held.has(key) || ledgers.get(key)?.p === P_HELD || ledgers.get(key)?.p === P_LOST;
      return starTimerRows([...nightSites(t), ...sitesOf(starNightAt(t) + 1)], t, decided);
    },
    /** The crater's burned earth the grass keeps off, for the nearest standing star - `{ x, z, r, key }` - or null. */
    clearing() {
      const S = this.nearest();
      return S ? { x: S.heart[0], z: S.heart[2], r: STAR_BARE_R, key: S.key } : null;
    },
    /** The sites a star's foes stand under (the Overworld's marks name them the coven's). */
    isStarSite: (site) => typeof site === 'string' && /:star\.\d+\.[0-2](?:\.[mc])?$/.test(site),
    /** The host's state, for the tests and the probes. */
    state: () => [...stars.values()].map((S) => ({ key: S.key, phase: S.phase, known: S.known, own: S.own, stoodWave: S.stoodWave, master: !!S.master, calls: S.calls, kn: S.kn, wc: S.wc, hb: S.hb, mf: S.mf, struck: S.struck, mesh: !!S.mesh, said: [...S.said] })),
    /** Everything let go (a load, a mode change, the event's end). */
    destroyAll() {
      for (const S of [...stars.values()]) leave(S);
      if (trackerUp) { destroyStarTracker(); trackerUp = false; }
      if (barUp) { drawGateBossBar(null); barUp = false; }
      thunders.length = 0;
    },
    /** STAR7: the spoils' crash door at a character's stand-up, and the realm save's two hooks (scenes/starfall/starRewards.js). */
    recoverSpoils: (who, inSave = null) => rewards.recover(who, inSave),
    spoilsHeld: (who) => rewards.held(who),
    spoilsSaved: (who, ids) => rewards.saved(who, ids),
    /** STAR7: the rewards, for the tests and the probes. */
    rewards,
    /** Whether a star of the night is in the sky or standing - the host's cheap test before it asks for more. */
    active: () => stars.size > 0,
  };
}

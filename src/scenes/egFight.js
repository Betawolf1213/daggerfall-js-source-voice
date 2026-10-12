// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 8, 12, 13 and 25) and EG-FULL
// (2026-10-11, Mac: "I said I want everything"): AN ELITE BREACH'S FIGHTS ON THIS SCREEN - the hall's fight as the relay
// says it in the Spire's own words (net/egLink.js's fold of net/egBodies.js's frames), its frame the hall's own:
//   THE BODIES - every lord and champion (its own look: world/egLaw.js EG_LORDS, net/egLords.js egBossLook - a Daggerfall
//     mobile at its scale), every add of the legion (net/egLegion.js egKindLook, by the band), each acting what it does
//     (rising, walking, winding up, striking, flinching, falling); the errands' objects - the struck ones (rifts, anchors,
//     banners, hearts, seals, braziers, standards, chains, pillars, sparks) as the Reckoning's crystals in their colours
//     (render/courtCrystals.js), the stood-on ones (runes with their numerals, soul-gems, havens, the relic, the engine,
//     the Orrery's stones, umbral discs) on the floor;
//   THE BLOWS - each FULL shape stamp drawn by the telegraph pass (render/gateTelegraph.js) in THE SPIRE DANGER EDGE,
//     the TELEGRAPH BUDGET's order (net/egShape.js egShapeOrder), a CHECK's havens gold; each judged against MY OWN FEET at
//     its landing (co-op's law - net/egShape.js egBlowVerdict), its share of my health through my saving throw, its push;
//   THE ZONES - burning ground ticking, the floor gone (a cast-back), a Soul-Pool, a haven;
//   THE TETHERS - a Wraith's drain on me ticking, a Blood Tether, a chain (the stay-close grammar), a challenge's ring;
//   THE PLACE - a gust's push, the Gutterdark, the Colossus's Rails; EG-FULL LAYER THREE: every fragment's hazard on the
//     shared clock (net/egFragLaw.js) drawn and judged on my own feet - a fire fall, a surge, the basalt, the cascade, the
//     hammers, the tide, the Eclipse, a soul-wisp's drain.
// Nothing is sent but my blows (`hit` on a body by its number - the relay's caps decide what lands).
// EG-G2 (2026-10-12, sections 25 and 26): the Spire's own telegraph stage (render/gateTelegraph.js TELEGRAPH_FS_SPIRE - the
// fog floor, the fill, the style bit), each shape in the shelf's danger palette and fill (ui/egAccess.js egAccessNow), a
// shape aimed at another member filled at THE QUIET COMPANY's 0.55 and mine drawn last with a brighter rim; THE SPIRE MIX
// (systems/egMix.js): a personal sting for a lord's blow or a CHECK on my feet (an add's at most one each 1.5 s), the score
// ducked under the critical bus, the legion's wind-up barks capped four a kind, nearest first.
// EG-ZH (2026-10-12, sections 11.6, 25.8 and 26): THE SPIRE MIX's last two - every peer's sound 4 dB down while a hall's
// fight runs (systems/egMix.js `peers`), WATCHFIRE'S TELL at pitch 1.4 where each told blow will land, once a blow (`tell`);
// and THE CAVERNS' FIRE FALLS in Daggerfall's own TEXTURE.356 (world/egHall.js egFireFallFlames) while each burns, its
// frames at the billboards' rate (render/flatAnimation.js GENERAL_FPS).
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { HIT_KINDS, CRYSTAL_R, CRYSTAL_H } from '../net/gateBrain.js';
import { strikeDamage, savedShare } from '../net/gateStrike.js';
import { bossFrame, crystalStandIn, gateHitFlash, hostStandIn, hostCue, BOSS_CUES } from '../world/gateBoss.js';
import { GateTelegraphRenderer, TELEGRAPH_KIND, TELEGRAPH_STYLE, TELEGRAPH_EDGE_DAGON, TELEGRAPH_EDGE_SAFE, TELEGRAPH_POOL, TELEGRAPH_POOL_HAVEN } from '../render/gateTelegraph.js';
import { CourtCrystalRenderer } from '../render/courtCrystals.js';
import { titleCardModel, drawGateTitleCard, TITLE_HOLD_MS } from '../ui/gateTitleCard.js';
import { setBatchHitFlash } from '../systems/hitFlash.js';
import { ENEMY_BASICS } from '../characters/enemyBasics.js';
import { stateAnims, FLY_ANIM_SPEED, PRIMARY_ATTACK_ANIM_SPEED, HURT_ANIM_SPEED } from '../characters/mobileUnit.js';
import { mobileBillboardSize } from '../world/rmbFlats.js';
import { egHallOf, egCountText, egVentAt, egInVent, EG_LORDS, EG_BANDS, EG_VENT_PCT, EG_VENT_WARN_MS, EG_VENT_FIRE_MS } from '../net/egLaw.js';
import { egVentState, egInVentDisc, egPendAt, EG_VENT_R, EG_VENT_TELL_S, EG_PEND_REACH, EG_PEND_HALF, EG_PEND_CLEAR_MIN } from '../net/egSpanLaw.js';
import { egBodyPlace } from '../net/egLink.js';
import { egBlowVerdict, egInShape, egShapeOrder, coneInscribed } from '../net/egShape.js';
import { EG_ROLE, EG_FL, EG_FEINT_AT } from '../net/egBodies.js';
import { egKindLook, EG_LEGION_KINDS } from '../net/egLegion.js';
import { EG_BOSS_KEYS, EG_OBJ, egBossLook, egBossName } from '../net/egLords.js';
import { egHallCentre, egFireFallFlames, EG_FIRE_FALL } from '../world/egHall.js';   // EG-ZH: the fire falls' flames
import { GENERAL_FPS } from '../render/flatAnimation.js';   // EG-ZH: DaggerfallBillboard's framesPerSecond - the fire falls' frames
import { egHazardParts, egHazardBites, egWispAt, EG_HAZARDS } from '../net/egFragLaw.js';   // EG-FULL LAYER THREE: the fragments' hazards
import { egAccessNow, egPaletteOf } from '../ui/egAccess.js';   // EG-G1 (section 25.7): the shelf's danger palette and fill - their one home
import { egPaletteBits, egQuietCompany, EG_FOG_FLOOR } from '../world/egLook.js';   // EG-G2: the palette's style bit, the quiet company, the fog floor
import { createSpireMix } from '../systems/egMix.js';   // EG-G2: THE SPIRE MIX - personal stings, the critical bus, the barks' cap

/** The objects' types by number (net/egLords.js EG_OBJ), and which are struck (drawn as crystals) - the rest are stood on. */
const OBJ_KEY = Object.freeze(Object.fromEntries(Object.entries(EG_OBJ).map(([k, v]) => [v, k])));
const STRUCK = new Set(['rift', 'anchor', 'banner', 'heart', 'seal', 'brazier', 'standard', 'chain', 'pillar', 'spark', 'fwall']);   // LAYER THREE: `fwall` an alcove's false wall - one blow
/** The struck objects' colours (display-encoded): the rifts Dagon's, the wards' red-bronze, a heart's storm, a pillar's
 *  basalt glow. */
export const EG_OBJ_COLORS = Object.freeze({
  rift: [1.0, 0.18, 0.34], anchor: [0.95, 0.3, 0.2], banner: [0.9, 0.22, 0.18], heart: [0.4, 0.75, 1.0], seal: [0.75, 0.5, 1.0], brazier: [1.0, 0.5, 0.12],
  standard: [0.85, 0.3, 0.2], chain: [0.75, 0.7, 0.6], pillar: [1.0, 0.45, 0.1], spark: [1.0, 0.9, 0.4], fwall: [1.0, 0.82, 0.38],
});
/** The stood-on objects' colours: gold for the way and the havens (THE FIVE LIGHTS), violet for a soul-gem. */
const GOLD = Object.freeze([1.0, 0.82, 0.38]);
const GROUND_COLORS = Object.freeze({ rune: GOLD, gem: [0.65, 0.5, 1.0], haven: GOLD, relic: GOLD, engine: [0.7, 0.8, 1.0], stone: GOLD, umbra: [0.25, 0.15, 0.35], isle: [1.0, 0.3, 0.1], vault: GOLD, plate: GOLD });
/** A zone's colour: burning ground the band's, a fallen floor black-red, a Soul-Pool violet, a haven gold. */
const ZONE_COLORS = Object.freeze({ burn: [1.0, 0.42, 0.12], void: [0.35, 0.02, 0.04], soul: [0.6, 0.35, 0.9], haven: GOLD });
/** A tether's colour (THE FIVE LIGHTS: Dagon red on what binds you). */
const TETHER_COLOR = Object.freeze([1.0, 0.24, 0.28]);
/** THE PLACE's colours: a vent's fire, a Pendulum's lane white (SD-LOOK: what moves next is told in white). */
const VENT_COLOR = Object.freeze([1.0, 0.45, 0.12]);
const PEND_COLOR = Object.freeze([0.95, 0.95, 1.0]);
/** EG-FULL LAYER THREE: a fragment hazard's colour - told in white where it moves (a fire fall's shimmer), burning in
 *  its element; a soul-wisp's violet, the moon-shafts' gold (a CHECK's havens). */
const HAZ_FIRE = Object.freeze([1.0, 0.45, 0.12]);
const HAZ_STONE = Object.freeze([1.0, 0.3, 0.2]);
const HAZ_SOUL = Object.freeze([0.6, 0.35, 0.9]);
/** A soul-wisp's tether (section 11.2): its drain's tick (ms), how soon one wisp binds again after it lets go (ms). */
const WISP_TICK_MS = 1000;
const WISP_AGAIN_MS = 6000;
/** EG-H1 (section 13.2): a blow's WIND sounds once it is past EG_FEINT_AT of its wind-up and still uncut, this long more
 *  for the cut's way here (ms) - a feint, cut at FEINT_AT on the relay, never glints in the ear (no frame flags it early). */
export const EG_WIND_GRACE_MS = 150;
/** EG-H1 (section 15): Watchfire's early outline - a PULSING solid red line (a dashed line is a feint's), its pulse (ms). */
const TOLD_PULSE_MS = 180;
/** EG-ZH (section 26): where WATCHFIRE'S TELL is heard - the told blow's first stamp that has an origin (a disc's, a lane's,
 *  a cone's, a ring's), else `feet` (a blow over the whole floor lands where I stand); `[x, z]` in the hall's frame, or
 *  null. Pure. */
export function egToldAt(bl, feet = null) {
  for (const s of bl?.s ?? []) if (s && (s[0] === 'd' || s[0] === 'l' || s[0] === 'c' || s[0] === 'r') && Number.isFinite(s[1]) && Number.isFinite(s[2])) return [s[1], s[2]];
  return feet ? [feet[0], feet[1]] : null;
}
/** A zone's and a drain's tick (ms); a body's fall's length; how long after its landing a blow's shape lingers. */
export const EG_TICK_MS = 1000;
const FALL_MS = 1200;
const LINGER_MS = 350;
/** The beats' words (net/wire.js EG_SAY_KEYS), by key - `n` a name, `t` a word the room adds. */
export const EG_SAY = Object.freeze({
  wake: () => '', fury: (n) => `${n || 'The lord'} rages!`, covenant: () => 'The Covenant presses.', covenantrest: () => 'The Covenant has spoken. This Redoubt is the last.',
  stunned: (n) => `${n || 'The lord'} is laid bare!`, scent: () => 'Hunted - run!', scorched: () => 'Grath is scorched!', phase: (n, t) => t, images: () => 'Mirror images! Only one is true.',
  examination: () => 'The Examination: stand on the runes in order!', cage: () => 'The Final Examination: break the seals!', passed: () => 'The Examination is passed.', failed: () => 'The Examination is failed.',
  challenge: () => 'A challenge! The ring of fire rises.', challengewon: () => 'The challenge is met.', challengeend: () => 'The ring falls.', conquest: () => 'Banners claim the floor. Break them!',
  muster: () => 'The Muster-Call! The balconies fill.', tithe: () => 'The Soul Tithe: lay your soul in a gem!', bare: () => 'The gems are full - the Cairn-Keeper is laid bare!',
  twinfell: (n) => `${n} falls - fell the other within fifteen seconds!`, twinraised: (n) => `${n} rises again.`, crossing: () => 'The Twins cross the walkway!',
  chaining: () => 'Soul-chains bind you. Stay close!', grounded: () => 'The Mother of Dusk is dragged down!', anchors: () => 'The anchors rise again.', vanish: () => 'The Night-Stalker vanishes.',
  tether: () => 'Blood Tether! Stand apart.', tetherbroken: () => 'The tether snaps.', eclipse: () => 'The Eclipse comes - stand in the light!', mirrors: () => 'Mirror lords rise. Only the true lord casts a mark.',
  relit: () => 'A heart relights!', landed: () => 'The Wyrm lands!', broken: (n, t) => `${n || 'Someone'} breaks a ${t || 'ward'}.`, stirs: () => 'Something stirs.', raised: () => 'A Binder raises the fallen.',
  raisebroken: () => 'The raising is broken.', door: () => 'The way down opens.', recalled: (n) => `${n} is called back.`, home: (n) => `${n} walks home.`, goldrun: () => 'Gold run. +1:00',
  mimic: () => 'The cache breathes - a Kyn Mimic!', memento: (n, t) => `${n} carries ${t}'s Memento.`, relicbroken: () => 'The relic breaks! The hold falls back.', silenced: () => 'A caster is silenced.',
  orrerytrue: () => 'The Orrery turns true. A Vestige waits.', chamberdone: () => 'The chamber is cleared. Find the way down.', freed: () => 'The Battlemage is freed - a Cantrip for each of you.',
  desertertook: () => 'The Deserter takes the cache.', sapperfed: () => 'A Sapper reaches its lord and heals it.', reopened: () => 'A Sapper tears a rift open again!', cantrip: (n, t) => `${n} uses ${t}.`,
  bargain: (n, t) => `Dagon's Bargain is struck: ${t}.`, respite: (n, t) => `A respite: ${t} seconds.`, ready: () => 'The company is ready.',
  // EG-FULL LAYER THREE: the fragments' beats
  seam: (n) => `${n || 'Someone'} breaks a false wall - an alcove opens.`, engine: (n, t) => `${n || 'Someone'} works the ${t || 'engine'}!`,
  horn: (n) => `The Honour Horn sounds - ${n || 'one of you'} is called into the ring. Answer alone!`, hornwon: (n) => `${n || 'The challenger'} fought with honour - the tiers throw Reliquaries!`,
  hornfoul: () => 'Another steps into the ring - the crowd throws fire! Ashfall in the Pit.', niche: (n) => `${n || 'Someone'} rests at the Battlemage's niche.`,
  hcache: (n) => `${n || 'Someone'} takes the High Road's cache - a Reliquary.`, lowroad: () => 'Something stirs on the Low Road.',
});

/**
 * EG-G2 (sections 25.2, 25.4 and 25.7): THE LOOK LAID ON a frame's shapes - every danger line in the shelf's palette's
 * edge (THE SPIRE DANGER EDGE in the Standard), its fill at the shelf's light and the palette's style bit; a shape
 * aimed at another member filled at THE QUIET COMPANY's share during a trial, mine with a brighter rim; a haven in the
 * palette's safety and THE HAVEN GRAMMAR (render/gateTelegraph.js TELEGRAPH_POOL_HAVEN); the place's white in its hazard
 * colour; every one keeping THE FOG FLOOR. `acc` the shelf as ui/egAccess.js egAccessNow reads it (`palette`, `fill`),
 * `stage` the hall's. In place. Pure.
 */
export function egLookShapes(shapes, acc, stage) {
  const pal = acc?.palette ?? egPaletteOf('standard'), fill = acc?.fill ?? 1, bits = egPaletteBits(pal), quiet = egQuietCompany(stage);
  for (const sh of shapes) {
    sh.fogFloor = EG_FOG_FLOOR_ARR;
    if (sh.edge === TELEGRAPH_EDGE_DAGON) {
      sh.edge = sh.mine ? brighter(pal.danger) : pal.danger; sh.look = bits;
      sh.fillK = fill * (sh.pool === TELEGRAPH_POOL.blow && !sh.mine ? quiet.aimedOther : 1);
    } else if (sh.edge === TELEGRAPH_EDGE_SAFE) {
      sh.edge = pal.safety; sh.look = 0; sh.fillK = 1; sh.pool = TELEGRAPH_POOL_HAVEN;   // THE HAVEN GRAMMAR (section 25.5)
      if (sameRgb(sh.color, GOLD)) sh.color = pal.safety;
    }
    if (sameRgb(sh.color, PEND_COLOR)) sh.color = pal.hazard;
  }
  return shapes;
}
/** A shape slot of the telegraph pass's own shape (render/gateTelegraph.js), refilled. */
const slot = () => ({ kind: 0, origin: [0, 0], yaw: 0, r: 0, halfArc: 0, body: 0, end: [0, 0], halfW: 0, r0: 0, r1: 0, points: [], n: 0,
  t: 0, flash: 0, alpha: 0, color: GOLD, edge: TELEGRAPH_EDGE_DAGON, court: 0, style: TELEGRAPH_STYLE.weight, since: 0, span: 1, after: -1, runS: 0, pool: TELEGRAPH_POOL.blow,
  mine: false, fillK: 1, look: 0, fogFloor: EG_FOG_FLOOR_ARR });   // EG-G2: aimed at me, the fill, the style bit, the fog floor
/** EG-G2: THE FOG FLOOR as the Spire's stage takes it (world/egLook.js EG_FOG_FLOOR). */
const EG_FOG_FLOOR_ARR = Object.freeze([EG_FOG_FLOOR.floor, EG_FOG_FLOOR.within, EG_FOG_FLOOR.ease]);
/** EG-G2: two colours the same (a shape's colour is a table's - read by value, so a copy reads as its table's). */
const sameRgb = (a, b) => !!a && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
/** EG-G2: a rim brightened for the shape aimed at me (section 25.4). */
const brighter = (c) => [c[0] + (1 - c[0]) * 0.3, c[1] + (1 - c[1]) * 0.3, c[2] + (1 - c[2]) * 0.3];
const STYLE_OF = Object.freeze({ fire: TELEGRAPH_STYLE.fire, frost: TELEGRAPH_STYLE.frost, shock: TELEGRAPH_STYLE.shock, poison: TELEGRAPH_STYLE.poison });
const COLOR_OF = Object.freeze({ fire: [1.0, 0.45, 0.1], frost: [0.62, 0.78, 0.82], shock: [0.6, 0.7, 1.0], poison: [0.55, 0.85, 0.3], null: [1.0, 0.3, 0.2] });

/**
 * Fill a slot from a stamp (net/egShape.js) - its kind, its numbers; `none` for a stamp the pass does not draw alone
 * (an outside-the-havens CHECK draws as the whole floor, its havens drawn gold beside it).
 */
export function fillStamp(sh, s) {
  sh.points.length = 0; sh.n = 0;
  switch (s[0]) {
    case 'd': sh.kind = TELEGRAPH_KIND.disc; sh.origin[0] = s[1]; sh.origin[1] = s[2]; sh.r = s[3]; return true;
    case 'l': sh.kind = TELEGRAPH_KIND.lane; sh.origin[0] = s[1]; sh.origin[1] = s[2]; sh.end[0] = s[3]; sh.end[1] = s[4]; sh.halfW = s[5] / 2; return true;
    case 'c': sh.kind = TELEGRAPH_KIND.cone; sh.origin[0] = s[1]; sh.origin[1] = s[2]; sh.yaw = s[3]; sh.r = s[4]; sh.halfArc = ((s[5] / 2) * Math.PI) / 180; sh.body = Math.min(1, coneInscribed(s[4], s[5])); return true;
    case 'r': sh.kind = TELEGRAPH_KIND.ring; sh.origin[0] = s[1]; sh.origin[1] = s[2]; sh.r0 = s[3]; sh.r1 = s[4]; return true;
    case 'a': case 'h': sh.kind = TELEGRAPH_KIND.all; return true;
    default: return false;
  }
}

/** What a body is doing at `now`, as a mobile's animation (the port's own tables - characters/mobileUnit.js stateAnims):
 *  rising, winding up, striking, flinching, walking, idling, falling. Pure. */
export function egBodyAct(b, now, mobile, blow, hover = 0) {
  const winged = mobile === 29 && hover > 0;
  const tab = (state) => stateAnims(state, mobile, !!ENEMY_BASICS[mobile]?.hasIdle, false, false, true, false, winged);
  if (b.goneAt) { const since = now - b.goneAt; return since >= FALL_MS ? { act: 'gone', anims: tab('hurt'), frame: 0, loop: false, sink: 0 } : { act: 'fall', anims: tab('hurt'), frame: Math.floor((since / FALL_MS) * 4), loop: false, sink: b.w === 2 ? (since / FALL_MS) * 2 : 0 }; }
  if (b.fellAt && now >= b.fellAt) return { act: 'fall', anims: tab('hurt'), frame: Math.min(3, Math.floor(((now - b.fellAt) / FALL_MS) * 4)), loop: false, sink: 0 };
  const since = now - (b.born ?? 0);
  if (since >= 0 && since < 900 && b.role === EG_ROLE.add) return { act: 'rise', anims: tab('idle'), frame: 0, loop: true, sink: 2 * (1 - since / 900) };
  if (blow && now < blow.at) { const t = (now - (blow.at - blow.wu)) / Math.max(1, blow.wu); return { act: 'windup', anims: tab('attack'), frame: t >= 0.5 ? 1 : 0, loop: false, sink: 0 }; }
  if (blow && now - blow.at < 600) return { act: 'strike', anims: tab('attack'), frame: 2 + Math.floor(((now - blow.at) / 1000) * PRIMARY_ATTACK_ANIM_SPEED), loop: winged, sink: 0 };
  if (b.hurtAt && now - b.hurtAt < 350) return { act: 'flinch', anims: tab('hurt'), frame: Math.floor(((now - b.hurtAt) / 1000) * HURT_ANIM_SPEED), loop: false, sink: 0 };
  const m = b.mv;
  if (m && m.v > 0) { const [x, z] = egBodyPlace(b, now); if (Math.hypot(m.tx - x, m.tz - z) > 0.05) { const T = tab('move'); return { act: 'walk', anims: T, frame: Math.floor((now / 1000) * (hover > 0 ? FLY_ANIM_SPEED : T[0].fps ?? 6)), loop: true, sink: 0 }; } }
  const T = tab('idle');
  return { act: 'idle', anims: T, frame: Math.floor((now / 1000) * (hover > 0 ? FLY_ANIM_SPEED : T[0].fps ?? 4)), loop: true, sink: 0 };
}
/** A body's look: a lord's its own (scaled, flying high), an add's its kind's by the band, an object's none (drawn
 *  otherwise). */
export function egLookOf(b, band) {
  if (b.role === EG_ROLE.lord) {
    const key = EG_BOSS_KEYS[b.k] ?? 'kynreeve', L = egBossLook(key, b.pt), lord = EG_LORDS[key];
    const fly = (b.fl & EG_FL.fly) !== 0 && (b.fl & EG_FL.grounded) === 0;
    return { mobile: L.mobile, scale: L.scale * ((b.fl & EG_FL.mirror) !== 0 ? 0.95 : 1), hover: fly ? 6 : 0, name: egBossName(key, b.pt), lord: true, epithet: lord?.epithet ?? '' };
  }
  if (b.role === EG_ROLE.add) { const L = egKindLook(b.k, band); return { ...L, hover: (b.fl & EG_FL.fly) !== 0 ? L.hover : Math.min(L.hover, 0.9) }; }
  return null;
}

/**
 * @param {{ renderer?: any, gl?: any, getTexture?: any, uploadRecordFrame?: any, audio?: any, link: any, now: () => number,
 *   cam?: () => number[]|null, feet?: () => number[]|null, player?: () => any, me?: () => string|null, save?: (e: any, el: string) => number,
 *   strike?: (dmg: number, o: { fire?: boolean, el?: string|null, name?: string }) => void, say?: (t: string) => void,
 *   hudHidden?: () => boolean, sendHit?: (f: any) => boolean, push?: (dx: number, dz: number, m: number) => void, castBack?: () => void,
 *   peerAt?: (sub: string) => number[]|null, ring?: (x: number, z: number, r: number, inside: boolean) => void, hold?: (ms: number) => void, music?: any }} deps
 */
export function createEgFight({ renderer = null, gl = null, getTexture = null, uploadRecordFrame = null, audio = null, music = null, link, now, cam = () => null, feet = () => null, player = () => null, me = () => null,
  save = () => 100, strike = () => {}, say = () => {}, hudHidden = () => false, sendHit = () => false, push = () => {}, castBack = () => {}, peerAt = () => null, ring = () => {}, hold = () => {} }) {
  // EG-H1: the fight runs on the breach's link's clock where it keeps one (scenes/egClient.js - the shared clock, corrected)
  if (typeof link?.now === 'function') now = link.now;
  let hall = 0, spec = null, centre = null, floor = null, band = 0;
  let beat = null, saysSeen = 0, wokeSeen = 0, fellSeen = new Set(), phaseSeen = new Set(), gustSeen = 0;
  let blowSeq = 0;
  const blowMet = new Set();
  /** AUDIT WB11 W3's law: a blow is one sequence over every body it meets in a frame. */
  function blowQ(who) {
    if (!blowMet.size || blowMet.has(who)) { blowSeq++; blowMet.clear(); }
    blowMet.add(who);
    return blowSeq;
  }
  let pass = null, passTried = false, crystalPass = null, crystalTried = false;
  /** EG-G2: THE SPIRE MIX over this screen's engine and the music; the blows I was stung for; the frame's barks */
  const mix = createSpireMix({ audio, music, now });
  const stung = new Set(), _barks = [];
  /** EG-ZH: the told blows Watchfire's tell has sounded for (this hall's); the fire falls' flames - TEXTURE.356 loaded once
   *  (`fire` its state), each fall's batch by its hazard's number */
  const toldHeard = new Set();
  let fire = null;
  const fireBatches = new Map();
  let stageNow = 'wait';
  const textures = new Map(), drawn = new Map();
  const judged = new Set(), cued = new Set(), landedSet = new Set();
  const zoneTick = new Map();
  let drainAt = 0, voidAt = 0;
  const _batches = [], _lights = [], _targets = [], _crystals = [], _shapes = [], _slots = [];
  /** THE PLACE's eruptions already judged (a Rampart vent's by its instant, a span Vent's by its cycle) */
  const ventJudged = new Map();
  /** LAYER THREE: the fragment hazards' bites taken on my own feet (each part's key once), the soul-wisps' holds on me */
  const hazHit = new Map(), wispHold = new Map();
  const crystalSlots = new Map();

  const play3 = (cue, at) => { if (!cue || !audio || !at) return; try { if (cue.id != null) audio.play3dId?.(cue.id, at, cue.volume, { maxDistance: cue.reach, distanceModel: 'linear', pitch: cue.pitch }); else audio.play3d?.(cue.clip, at, cue.volume, { maxDistance: cue.reach, distanceModel: 'linear', pitch: cue.pitch }); } catch { /* a sound is never the fight */ } };
  const toDungeon = (x, y, z) => [centre[0] + x, centre[1] + y, centre[2] + z];
  const myFeet = () => { const f = feet(); return f && centre ? [f[0] - centre[0], f[2] - centre[2]] : null; };

  function texture(mobile) {
    const archive = ENEMY_BASICS[mobile]?.maleTexture;
    if (!archive || !getTexture) return null;
    const had = textures.get(archive);
    if (had && !(had instanceof Promise)) return had.failed ? null : had;
    if (!had) {
      const p = Promise.resolve().then(() => getTexture(archive)).then((tex) => { textures.set(archive, tex ? { tex, archive } : { failed: true }); }, () => { textures.set(archive, { failed: true }); });
      textures.set(archive, p);
    }
    return null;
  }
  function destroy(d) { if (d?.batch) { renderer?.destroyBillboardBatch?.(d.batch); d.batch = null; } }
  /** EG-ZH: TEXTURE.356 asked once (the player's own - none in a build without ARENA2: then no flames, the telegraph still
   *  tells the fall), answered `{ tex }` once it lands, or null while it is on its way or failed. */
  function fireTexture() {
    if (fire && !(fire instanceof Promise)) return fire.failed ? null : fire;
    if (!fire && getTexture) fire = Promise.resolve().then(() => getTexture(EG_FIRE_FALL.archive)).then((tex) => { fire = tex && tex.recordCount > EG_FIRE_FALL.record ? { tex } : { failed: true }; }, () => { fire = { failed: true }; });
    return null;
  }
  function dropFire() { for (const b of fireBatches.values()) renderer?.destroyBillboardBatch?.(b); fireBatches.clear(); }
  /** EG-ZH: a fire fall burning - its flames in Daggerfall's own fire, the frame the clock says, among the frame's batches. */
  function drawFireFall(hz, t) {
    const T = fireTexture();
    if (!T || !renderer?.createBillboardBatch || !centre) return;
    const F = egFireFallFlames(spec, hz);
    if (!F) return;
    const n = Math.max(1, T.tex.getFrameCount?.(EG_FIRE_FALL.record) ?? 1), frame = Math.floor((t / 1000) * GENERAL_FPS) % n;
    const rkey = `${EG_FIRE_FALL.record}#${frame}`;
    if (!renderer.textures?.has?.(`${EG_FIRE_FALL.archive}_${rkey}`)) uploadRecordFrame?.(EG_FIRE_FALL.archive, EG_FIRE_FALL.record, frame);
    let b = fireBatches.get(hz.i);
    if (!b) { b = renderer.createBillboardBatch(EG_FIRE_FALL.archive, rkey, { w: F.w, h: F.h }, F.at); if (!b) return; b.origin = [centre[0], centre[1], centre[2]]; fireBatches.set(hz.i, b); }
    b.record = rkey;
    _batches.push(b);
  }
  /** A new hall: its frame, its floor for the telegraph pass. */
  function reset(E) {
    for (const d of drawn.values()) destroy(d);
    drawn.clear(); judged.clear(); cued.clear(); landedSet.clear(); zoneTick.clear(); fellSeen = new Set(); phaseSeen = new Set(); crystalSlots.clear(); ventJudged.clear(); hazHit.clear(); wispHold.clear(); stung.clear();
    toldHeard.clear(); dropFire();   // EG-ZH
    hall = E.h; spec = egHallOf(E.seed, E.h, E.geo ?? 0); centre = egHallCentre(spec); band = spec.band ?? 0;
    floor = spec.fight ? { r: spec.fight.r + 6, courts: [[spec.fight.x, spec.fight.z]] } : { r: 40, courts: [[0, spec.len / 2]] };
    beat = null; saysSeen = E.fight.says.length; wokeSeen = 0; gustSeen = 0;
  }
  /** A blow on me landed - its share of my health and its base, through my saving throw against its element. */
  function landShare(pct, base, el, name) {
    const e = player();
    if (!e || !(e.health > 0) || !(pct > 0)) return;
    const raw = strikeDamage(pct, e.maxHealth, base), dmg = el ? savedShare(raw, save(e, el)) : raw;
    if (dmg > 0) strike(dmg, { fire: el === 'fire', el, name });
  }
  /** One body drawn: its look's sprite at its act's frame, at its place. */
  function drawBody(b, t, blow) {
    const look = egLookOf(b, band);
    if (!look) return;
    const d = drawn.get(b.i) ?? { batch: null, look, at: [0, 0, 0] };
    drawn.set(b.i, d);
    d.look = look;
    const T = texture(look.mobile);
    if (!T || !renderer?.createBillboardBatch) return;
    const act = egBodyAct(b, t, look.mobile, blow, look.hover);
    if (act.act === 'gone' || ((b.fl & EG_FL.hidden) !== 0 && b.role === EG_ROLE.lord)) return;
    const [x, z] = egBodyPlace(b, t);
    const y = (act.sink > 0 ? -act.sink : 0) + (look.hover > 0 ? look.hover + 0.15 * Math.sin(t / 260 + b.i) : 0);
    d.at[0] = centre[0] + x; d.at[1] = centre[1] + y; d.at[2] = centre[2] + z;
    const eye = cam() ?? d.at;
    const fr = bossFrame(/** @type {any} */ (act), b.yaw ?? (b.mv ? Math.atan2(b.mv.tx - b.mv.x, b.mv.tz - b.mv.z) : Math.PI), d.at, eye, (rec) => T.tex.getFrameCount?.(rec) ?? 1);
    const rkey = `${fr.record}#${fr.frame}`;
    if (!renderer.textures?.has?.(`${T.archive}_${rkey}`)) uploadRecordFrame?.(T.archive, fr.record, fr.frame);
    const sz = mobileBillboardSize(T.tex, fr.record), w = sz.w * look.scale, h = sz.h * look.scale;
    if (!d.batch) { d.batch = renderer.createBillboardBatch(T.archive, rkey, { w, h }, [[0, 0, 0]]); d.batch.origin = [0, 0, 0]; }
    setBatchHitFlash(d.batch, b.fellAt ? 0 : gateHitFlash(b.hurtAt ?? -Infinity, -Infinity, t));
    d.batch.record = rkey; d.batch.size = { w: fr.flip ? -w : w, h };
    if (d.batch.bounds) d.batch.bounds[3] = Math.hypot(w, h) * 0.5;
    d.batch.origin[0] = d.at[0]; d.batch.origin[1] = d.at[1]; d.batch.origin[2] = d.at[2];
    _batches.push(d.batch);
    // the body my blows meet (never a friend, a ward's, a vanished lord)
    if (!b.fellAt && b.hp > 0 && (b.fl & (EG_FL.friend | EG_FL.hidden)) === 0) {
      d.target ??= { i: b.i, feet: [0, 0, 0], height: 2, radius: 0.6, entity: hostStandIn({ mobile: look.mobile, name: look.name }, b.i), mobile: look.mobile, name: look.name, m: b.max };
      d.target.feet[0] = d.at[0]; d.target.feet[1] = centre[1] + y; d.target.feet[2] = d.at[2];
      d.target.height = (look.lord ? 2.2 : EG_LEGION_KINDS[b.k]?.h ?? 2) * (look.lord ? look.scale / 1.2 : 1); d.target.radius = look.lord ? Math.max(0.8, (1.8 * look.scale) / 3) : EG_LEGION_KINDS[b.k]?.r ?? 0.6; d.target.m = b.max;
      _targets.push(d.target);
    }
    // EG-H1: the WIND once the wind-up is past FEINT_AT and the blow still stands - a feint's cut comes first, so it never glints
    if (blow && !cued.has(blow.i) && !blow.cut && t < blow.at && t >= blow.at - blow.wu + blow.wu * EG_FEINT_AT + EG_WIND_GRACE_MS) { cued.add(blow.i); _barks.push({ kind: look.mobile, at: [d.at[0], d.at[1], d.at[2]], cue: hostCue('windup', look.mobile), critical: !!look.lord }); }   // EG-G2: capped by THE SPIRE MIX after the bodies
  }
  /** A struck object: a crystal in its colour, cracking as it falls, and a body my blows meet. */
  function drawStruck(b, t, key) {
    const color = EG_OBJ_COLORS[key] ?? EG_OBJ_COLORS.rift;
    const c = crystalSlots.get(b.i) ?? { at: [0, 0, 0], yaw: 0, seed: ((b.i * 7919) % 997) / 997, grow: 1, broke: -1, hp: 1, flash: 0, color, beam: null };
    crystalSlots.set(b.i, c);
    const [x, z] = egBodyPlace(b, t);
    c.at[0] = centre[0] + x; c.at[1] = centre[1] + (key === 'pillar' ? 3 : 0); c.at[2] = centre[2] + z;
    c.yaw = c.seed * Math.PI * 2; c.hp = b.max > 0 ? Math.max(0, b.hp / b.max) : 0; c.color = color; c.broke = b.goneAt ? Math.max(0, (t - b.goneAt) / 1000) : -1;
    c.flash = Math.max(0, 1 - (t - (b.hurtAt ?? -Infinity)) / 180);
    c.grow = (b.fl & EG_FL.ward) !== 0 ? 0.6 : 1;
    _crystals.push(c);
    if (!b.goneAt && (b.fl & EG_FL.ward) === 0) {
      c.target ??= { i: b.i, feet: [0, 0, 0], height: CRYSTAL_H, radius: CRYSTAL_R, entity: crystalStandIn({ mobile: 31, scale: 1 }, b.i), mobile: 31, name: key, m: b.max };
      c.target.feet[0] = c.at[0]; c.target.feet[1] = c.at[1]; c.target.feet[2] = c.at[2]; c.target.m = b.max;
      _targets.push(c.target);
    }
    const L = (c.light ??= { x: 0, y: 0, z: 0, range: 6, color: [0, 0, 0] }), k = 0.8 + 0.25 * Math.sin(t / 240 + c.seed * 6);
    L.x = c.at[0]; L.y = c.at[1] + 2; L.z = c.at[2]; L.color[0] = color[0] * k; L.color[1] = color[1] * k; L.color[2] = color[2] * k;
    _lights.push(L);
  }
  /** A stood-on object on the floor: its disc in its colour (a rune lit, a gem's souls). */
  function drawGround(b, t, key) {
    const sh = (_slots[_shapes.length] ??= slot());
    sh.kind = TELEGRAPH_KIND.disc; sh.origin[0] = b.x; sh.origin[1] = b.z; sh.r = key === 'isle' ? 0 : Math.max(1, b.r ?? 1.5);
    if (key === 'isle') { if (!b.st) return; sh.r = 11; }
    sh.color = GROUND_COLORS[key] ?? GOLD; sh.edge = key === 'umbra' || key === 'isle' ? TELEGRAPH_EDGE_DAGON : TELEGRAPH_EDGE_SAFE;
    sh.pool = TELEGRAPH_POOL.ground; sh.t = 1; sh.flash = 0; sh.alpha = key === 'rune' && !(b.st & 1) ? 0.35 : key === 'isle' ? (b.st === 1 ? 0.9 : 0.6) : 0.85;
    sh.style = key === 'isle' ? TELEGRAPH_STYLE.fire : TELEGRAPH_STYLE.weight; sh.since = (t % 60_000) / 1000; sh.span = 1; sh.after = -1; sh.court = 0;
    _shapes.push(sh);
  }
  /** A blow's shape, refilled into a slot: its line in THE SPIRE DANGER EDGE, its fill climbing through its wind-up. */
  function drawBlow(bl, t, aimedAtMe) {
    const from = bl.at - bl.wu, span = Math.max(1, bl.sp ?? 0);
    if (t < from || t > bl.at + span + LINGER_MS) return;
    for (const s of bl.s) {
      const sh = (_slots[_shapes.length] ??= slot());
      if (!fillStamp(sh, s)) continue;
      sh.t = Math.max(0, Math.min(1, (t - from) / Math.max(1, bl.wu))); sh.flash = t >= bl.at ? 1 : 0;
      sh.alpha = bl.cut ? Math.max(0, 1 - (t - bl.cut) / 150) : t > bl.at + span ? 1 - (t - bl.at - span) / LINGER_MS : aimedAtMe ? 1 : 0.85;
      sh.color = COLOR_OF[bl.el] ?? COLOR_OF.null; sh.edge = TELEGRAPH_EDGE_DAGON; sh.pool = TELEGRAPH_POOL.blow; sh.court = 0; sh.mine = aimedAtMe;
      sh.style = bl.ch ? TELEGRAPH_STYLE.dagon : STYLE_OF[bl.el] ?? TELEGRAPH_STYLE.weight;
      sh.since = Math.max(0, (t - from) / 1000); sh.span = Math.max(0.001, bl.wu / 1000); sh.after = t >= bl.at ? (t - bl.at) / 1000 : -1; sh.runS = (bl.sp ?? 0) / 1000;
      _shapes.push(sh);
      // a CHECK's havens, gold and safe
      if (s[0] === 'h') for (let i = 1; i + 2 < s.length; i += 3) { const hv = (_slots[_shapes.length] ??= slot()); hv.mine = false; hv.kind = TELEGRAPH_KIND.disc; hv.origin[0] = s[i]; hv.origin[1] = s[i + 1]; hv.r = s[i + 2]; hv.color = GOLD; hv.edge = TELEGRAPH_EDGE_SAFE; hv.pool = TELEGRAPH_POOL.ground; hv.t = 1; hv.flash = 0; hv.alpha = 1; hv.style = TELEGRAPH_STYLE.weight; hv.since = 0; hv.span = 1; hv.after = -1; hv.court = 0; _shapes.push(hv); }
    }
  }
  /** EG-H1 - WATCHFIRE'S EARLY OUTLINE (section 15): a told blow's stamps as a PULSING solid red line - no fill, never blue -
   *  from its lead (`sh`) before its wind-up (or its hearing) until its word (`eb`) takes it over or its `untell` takes it off. */
  function drawTold(bl, t) {
    const from = Math.max(bl.heard ?? -Infinity, bl.at - bl.wu - (bl.sh ?? 0));
    if (t < from || t >= bl.at) return;
    for (const s of bl.s) {
      const sh = (_slots[_shapes.length] ??= slot());
      if (!fillStamp(sh, s)) continue;
      sh.t = 0; sh.flash = 0; sh.alpha = 0.65 + 0.35 * Math.sin((t / TOLD_PULSE_MS) * Math.PI);
      sh.color = COLOR_OF.null; sh.edge = TELEGRAPH_EDGE_DAGON; sh.pool = TELEGRAPH_POOL.blow; sh.court = 0; sh.style = TELEGRAPH_STYLE.weight;
      sh.since = 0; sh.span = Math.max(0.001, bl.wu / 1000); sh.after = -1; sh.runS = 0;
      _shapes.push(sh);
    }
  }
  /** THE PLACE (sections 8.3 and 10.3), on every screen alike: a Rampart's vents (told EG_VENT_WARN_MS and erupting
   *  EG_VENT_FIRE_MS on the relay's clock from the hall's wake - net/egLaw.js egVentAt) and a span's Vents and Pendulums
   *  (the shared clock - net/egSpanLaw.js): each drawn in the telegraph pass, a vent's eruption judged on my feet once. A
   *  Pendulum's touch is the span's own cast-back (scenes/egSpan.js); its lane here brightens over its last EG_PEND_CLEAR_MIN. */
  function place(E, t) {
    if (!spec || (E.sg !== 'trial' && E.sg !== 'closing')) return;
    const f = myFeet(), d = feet(), e = player(), standing = !!f && !!e && e.health > 0, fy = d && centre ? d[1] - centre[1] : 0;
    if (spec.vents?.length && E.sg === 'trial' && E.hw > 0) {
      for (let i = 0; i < spec.vents.length; i++) {
        const v = spec.vents[i], st = egVentAt(v, E.hw, t);
        if (st.st === 'quiet') continue;
        const sh = (_slots[_shapes.length] ??= slot());
        sh.kind = TELEGRAPH_KIND.lane; sh.origin[0] = v.x - v.halfW; sh.origin[1] = v.z; sh.end[0] = v.x + v.halfW; sh.end[1] = v.z; sh.halfW = v.d / 2; sh.r = 0;
        sh.t = st.st === 'warn' ? st.k : 1; sh.flash = st.st === 'fire' ? 1 : 0; sh.alpha = 1; sh.color = VENT_COLOR; sh.edge = TELEGRAPH_EDGE_DAGON; sh.pool = TELEGRAPH_POOL.blow; sh.style = TELEGRAPH_STYLE.fire;
        sh.since = st.st === 'warn' ? (st.k * EG_VENT_WARN_MS) / 1000 : EG_VENT_WARN_MS / 1000; sh.span = EG_VENT_WARN_MS / 1000; sh.after = st.st === 'fire' ? (st.k * EG_VENT_FIRE_MS) / 1000 : -1; sh.court = 0;
        _shapes.push(sh);
        if (st.st === 'fire' && ventJudged.get(`r${i}`) !== st.at) {
          ventJudged.set(`r${i}`, st.at);
          play3(BOSS_CUES.quake, toDungeon(v.x, 1, v.z));
          if (standing && egInVent(v, f[0], f[1])) landShare(EG_VENT_PCT, 0, 'fire', 'Fire Vent');
        }
      }
    }
    const ts = t / 1000;
    for (const s of spec.steps ?? []) {
      if (s.kind === 'vent') {
        const st = egVentState(s, ts);
        if (!(st.tell > 0) && !st.fire) continue;
        const sh = (_slots[_shapes.length] ??= slot());
        sh.kind = TELEGRAPH_KIND.disc; sh.origin[0] = s.x; sh.origin[1] = s.z; sh.r = EG_VENT_R;
        sh.t = st.fire ? 1 : st.tell; sh.flash = st.fire ? 1 : 0; sh.alpha = 1; sh.color = VENT_COLOR; sh.edge = TELEGRAPH_EDGE_DAGON; sh.pool = TELEGRAPH_POOL.blow; sh.style = TELEGRAPH_STYLE.fire;
        sh.since = st.tell * EG_VENT_TELL_S; sh.span = EG_VENT_TELL_S; sh.after = st.fire ? 0 : -1; sh.court = 0;
        _shapes.push(sh);
        const cycle = `v${s.i}:${Math.floor((ts + s.phase) / s.period)}`;
        if (st.fire && !ventJudged.has(cycle)) {
          ventJudged.set(cycle, 1);
          if (ventJudged.size > 256) ventJudged.delete(ventJudged.keys().next().value);
          if (standing && Math.abs(fy - s.y) < 1.5 && egInVentDisc(s, f[0], f[1])) landShare(EG_VENT_PCT, 0, 'fire', 'Vent');
        }
      } else if (s.kind === 'pend' && s.period > 0) {
        const w = egPendAt(s, ts), theta = (2 * Math.PI * ts) / s.period + s.phase;
        const toCentre = ((Math.PI - (((theta % Math.PI) + Math.PI) % Math.PI)) / (2 * Math.PI)) * s.period;   // until the weight next crosses the course
        const sh = (_slots[_shapes.length] ??= slot());
        sh.kind = TELEGRAPH_KIND.lane; sh.origin[0] = s.x - EG_PEND_REACH - EG_PEND_HALF; sh.origin[1] = w.z; sh.end[0] = s.x + EG_PEND_REACH + EG_PEND_HALF; sh.end[1] = w.z; sh.halfW = EG_PEND_HALF; sh.r = 0;
        sh.t = toCentre < EG_PEND_CLEAR_MIN ? 1 - toCentre / EG_PEND_CLEAR_MIN : 0; sh.flash = 0; sh.alpha = toCentre < EG_PEND_CLEAR_MIN ? 1 : 0.4;
        sh.color = PEND_COLOR; sh.edge = TELEGRAPH_EDGE_DAGON; sh.pool = TELEGRAPH_POOL.ground; sh.style = TELEGRAPH_STYLE.weight; sh.since = 0; sh.span = EG_PEND_CLEAR_MIN; sh.after = -1; sh.court = 0;
        _shapes.push(sh);
      }
    }
    fragHazards(E, ts, f, fy, standing);
  }
  /**
   * EG-FULL LAYER THREE - THE FRAGMENTS' HAZARDS (section 11.2; net/egFragLaw.js egHazardParts): each told and live part
   * drawn in the telegraph pass - a fire fall's white shimmer then its burning, a surge's and a cascade's lanes, the basalt's
   * and the hammers' discs, a slag spill, the tide over a chamber's low floor, the Eclipse's moon-shafts gold - and each
   * live part judged on my own feet once (its key), within its height. A soul-wisp binds a member within 3 m and drains them
   * until 6 m apart or 4 s, then lets go a while. The mist is sight alone, never harm (not drawn here).
   */
  function fragHazards(E, ts, f, fy, standing) {
    if (!spec.hazards?.length) return;
    const t = ts * 1000;
    for (const hz of spec.hazards) {
      if (hz.kind === 'mist') continue;
      if (hz.kind === 'wisp') { wispStep(hz, ts, t, f, fy, standing); continue; }
      for (const p of egHazardParts(hz, ts)) {
        if (p.sh[0] === 'h') {
          // a CHECK (the Eclipse): its moon-shafts drawn gold - the havens; everything outside them is struck at its landing
          for (let k = 1; k + 2 < p.sh.length; k += 3) {
            const sh = (_slots[_shapes.length] ??= slot());
            sh.kind = TELEGRAPH_KIND.disc; sh.origin[0] = p.sh[k]; sh.origin[1] = p.sh[k + 1]; sh.r = p.sh[k + 2];
            sh.t = p.k; sh.flash = 0; sh.alpha = 1; sh.color = GOLD; sh.edge = TELEGRAPH_EDGE_SAFE; sh.pool = TELEGRAPH_POOL.ground; sh.style = TELEGRAPH_STYLE.weight; sh.since = p.k * 6; sh.span = 6; sh.after = -1; sh.court = 0;
            _shapes.push(sh);
          }
        } else {
          const sh = (_slots[_shapes.length] ??= slot());
          if (!fillStamp(sh, p.sh)) continue;
          const told = EG_HAZARDS[hz.kind].tell / 1000;
          sh.t = p.st === 'tell' ? p.k : 1; sh.flash = p.st === 'live' ? 1 : 0; sh.alpha = 1;
          sh.color = p.st === 'tell' && hz.kind === 'fall' ? PEND_COLOR : p.el === 'fire' ? HAZ_FIRE : HAZ_STONE;
          sh.edge = TELEGRAPH_EDGE_DAGON; sh.pool = TELEGRAPH_POOL.blow; sh.style = p.el === 'fire' ? TELEGRAPH_STYLE.fire : TELEGRAPH_STYLE.weight;
          sh.since = p.st === 'tell' ? p.k * told : told; sh.span = told; sh.after = p.st === 'live' ? 0 : -1; sh.court = 0;
          _shapes.push(sh);
        }
        if (p.st === 'live' && hz.kind === 'fall') drawFireFall(hz, t);   // EG-ZH: the fall burning in Daggerfall's own fire
        if (p.st === 'live' && standing && !hazHit.has(p.key) && egHazardBites(hz, p, f[0], fy, f[1])) {
          hazHit.set(p.key, 1);
          if (hazHit.size > 512) hazHit.delete(hazHit.keys().next().value);
          landShare(p.pct, 0, p.el, EG_HAZARDS[hz.kind].name);
        }
      }
    }
  }
  /** A soul-wisp: drawn where it drifts; it binds me within its reach on its floor, drains me a tick a second, and lets
   *  go at 6 m or after 4 s - then not again for WISP_AGAIN_MS. */
  function wispStep(hz, ts, t, f, fy, standing) {
    const L = EG_HAZARDS.wisp, [wx, wz] = egWispAt(hz, ts);
    const sh = (_slots[_shapes.length] ??= slot());
    sh.kind = TELEGRAPH_KIND.disc; sh.origin[0] = wx; sh.origin[1] = wz; sh.r = 0.6;
    sh.t = 1; sh.flash = 0; sh.alpha = 0.7; sh.color = HAZ_SOUL; sh.edge = TELEGRAPH_EDGE_DAGON; sh.pool = TELEGRAPH_POOL.ground; sh.style = TELEGRAPH_STYLE.weight; sh.since = 0; sh.span = 1; sh.after = -1; sh.court = 0;
    _shapes.push(sh);
    const hold = wispHold.get(hz.i) ?? { from: 0, tick: 0, free: 0 };
    wispHold.set(hz.i, hold);
    const d = standing && Math.abs(fy - hz.y) < 3 ? Math.hypot(f[0] - wx, f[1] - wz) : Infinity;
    if (!hold.from) { if (d <= L.r && t >= hold.free) { hold.from = t; hold.tick = t + WISP_TICK_MS; } return; }
    if (d > L.brk || t - hold.from >= L.live) { hold.from = 0; hold.free = t + WISP_AGAIN_MS; return; }
    if (t >= hold.tick) { hold.tick += WISP_TICK_MS; landShare(L.pct, 0, null, L.name); }
  }
  /** The beats' words and cards: a lord's wake (its card), its phases, its fall, the room's beats. */
  function beats(E, t, F) {
    const lords = F.bodies.filter((b) => b.role === EG_ROLE.lord && (b.fl & EG_FL.mirror) === 0);
    const L0 = lords[0];
    if (L0 && wokeSeen !== E.h && (F.says.some((s) => s.w === 'wake') || spec.kind === 'proving')) {
      wokeSeen = E.h;
      const look = egLookOf(L0, band);
      beat = { kind: 'wake', at: t, until: t + TITLE_HOLD_MS, kicker: look.lord ? look.epithet || EG_BANDS[band].name : '', main: look.name, sub: '' };
      play3(BOSS_CUES.roar, toDungeon(L0.x, 3, L0.z));
    }
    for (const f of F.fells) if (!fellSeen.has(f.i)) { fellSeen.add(f.i); const b = F.bodies.find((x) => x.i === f.i) ?? F.gone.find((x) => x.i === f.i); beat = { kind: 'fall', at: t, until: t + TITLE_HOLD_MS, kicker: b ? egLookOf(b, band)?.name ?? '' : '', main: 'FELLED', sub: '' }; }
    for (const p of F.phases) { const key = `${p.i}:${p.ph}`; if (!phaseSeen.has(key)) { phaseSeen.add(key); play3(BOSS_CUES.growl, L0 ? toDungeon(L0.x, 3, L0.z) : null); } }
    for (let k = saysSeen; k < F.says.length; k++) { const s = F.says[k], fn = EG_SAY[s.w]; const text = fn ? fn(s.n, s.t) : ''; if (s.w === 'scent' && !s.s?.includes(me())) continue; if (text) say(text); }
    saysSeen = F.says.length;
  }

  return {
    /** One frame of the hall's fight. */
    frame() {
      blowMet.clear();
      const E = link.state(), t = now();
      if (!E.b || !(E.h > 0) || E.end) { if (hall) this.leave(); return; }
      if (E.h !== hall) reset(E);
      mix.peers(true);   // EG-ZH (section 26): every peer's sound 4 dB down while a hall's fight runs
      const F = E.fight.h === E.h ? E.fight : null;
      _batches.length = 0; _lights.length = 0; _targets.length = 0; _crystals.length = 0; _shapes.length = 0; _barks.length = 0;
      for (const sl of _slots) sl.mine = false;   // EG-G2: a slot is mine only when this frame's blow says so
      stageNow = E.sg;
      place(E, t);
      if (!F) { drawGateTitleCard(titleCardModel(beat, t), { hidden: hudHidden() }); return; }
      const f = myFeet(), e = player(), standing = !!f && !!e && e.health > 0;
      const blowBy = new Map();
      for (const bl of F.blows) if (bl.o && (!blowBy.has(bl.o) || blowBy.get(bl.o).at < bl.at) && t < bl.at + 700) blowBy.set(bl.o, bl);
      // THE BODIES
      const live = new Set();
      for (const b of [...F.bodies, ...F.gone.filter((g) => t - g.goneAt < FALL_MS)]) {
        live.add(b.i);
        if (b.role === EG_ROLE.obj) { const key = OBJ_KEY[b.k] ?? 'rift'; if (STRUCK.has(key)) drawStruck(b, t, key); else drawGround(b, t, key); continue; }
        drawBody(b, t, blowBy.get(b.i));
      }
      for (const [i, d] of drawn) if (!live.has(i)) { destroy(d); drawn.delete(i); }
      for (const i of crystalSlots.keys()) if (!live.has(i)) crystalSlots.delete(i);
      mix.barks(_barks, cam(), (b) => play3(b.cue, b.at));   // EG-G2: the legion's barks, four a kind, nearest first
      // THE BLOWS - drawn in the budget's order, each judged on my feet at its landing
      const lordIds = new Set(F.bodies.filter((b) => b.role === EG_ROLE.lord).map((b) => b.i));
      const order = egShapeOrder(F.blows.filter((bl) => !bl.cut || t - bl.cut < 150), f ?? [0, 0], t, { lords: lordIds });
      for (const bl of order) {
        const mine = !!f && bl.s.some((s) => egInShape(s, f[0], f[1]));
        drawBlow(bl, t, mine);
        // EG-G2 - THE SPIRE MIX: a personal sting at its word for a lord's blow or a CHECK on my feet; an add's at most one each 1.5 s
        if (mine && standing && !stung.has(bl.i) && t < bl.at) { stung.add(bl.i); const d0 = feet(); mix.sting(bl.ch ? 'check' : lordIds.has(bl.o) ? 'lord' : 'add', d0 ? [d0[0], d0[1], d0[2]] : null); }
      }
      for (const bl of F.told ?? []) {
        drawTold(bl, t);   // EG-H1: Watchfire's early outlines
        // EG-ZH (section 26): WATCHFIRE'S TELL - heard once a blow, as its outline first shows, where it will land
        if (!toldHeard.has(bl.i) && t >= Math.max(bl.heard ?? -Infinity, bl.at - bl.wu - (bl.sh ?? 0)) && t < bl.at) { toldHeard.add(bl.i); const at = egToldAt(bl, f); if (at) mix.tell(toDungeon(at[0], 1, at[1])); }
      }
      for (const bl of F.blows) {
        if (!judged.has(bl.i) && !bl.cut && standing) {
          const v = egBlowVerdict(bl, f[0], f[1], t);
          if (v !== 'wait') { judged.add(bl.i); if (v === 'hit') { landShare(bl.p, bl.b, bl.el, bl.nm); if (bl.pu > 0) { const s = bl.s[0]; const ox = s[0] === 'l' ? s[3] - s[1] : f[0] - s[1], oz = s[0] === 'l' ? s[4] - s[2] : f[1] - s[2], d = Math.hypot(ox, oz) || 1; push(ox / d, oz / d, bl.pu); } } }
        }
        if (!landedSet.has(bl.i) && t >= bl.at && t - bl.at < 1500) { landedSet.add(bl.i); const s = bl.s[0]; if (s && s.length >= 3) play3(BOSS_CUES.quake, toDungeon(s[1], 1, s[2])); }
      }
      // THE ZONES - burning ground's tick, the floor gone
      for (const z of F.zones) {
        if (!(t >= z.from && t < z.until)) continue;
        const sh = (_slots[_shapes.length] ??= slot());
        if (fillStamp(sh, z.s)) { sh.t = 1; sh.flash = 0; sh.alpha = Math.min(1, (t - z.from) / 200, (z.until - t) / 1000); sh.color = ZONE_COLORS[z.kind] ?? ZONE_COLORS.burn; sh.edge = z.kind === 'haven' ? TELEGRAPH_EDGE_SAFE : TELEGRAPH_EDGE_DAGON; sh.pool = TELEGRAPH_POOL.ground; sh.style = z.kind === 'burn' ? STYLE_OF[z.el] ?? TELEGRAPH_STYLE.fire : TELEGRAPH_STYLE.weight; sh.since = (t - z.from) / 1000; sh.span = 1; sh.after = -1; sh.court = 0; _shapes.push(sh); }
        if (!standing || !egInShape(z.s, f[0], f[1])) continue;
        if (z.kind === 'burn' && t - (zoneTick.get(z.i) ?? 0) >= EG_TICK_MS) { zoneTick.set(z.i, t); landShare(z.p, z.b, z.el, 'Burning ground'); }
        if (z.kind === 'void' && t - voidAt >= 1500) { voidAt = t; castBack(); }
      }
      // THE TETHERS - lanes between their ends; a Wraith's drain on me ticks
      const meSub = me();
      for (const tx of F.tx) {
        const endOf = (x) => { if (typeof x === 'string') { if (x === meSub && f) return f; const p = peerAt(x); return p ? [p[0] - centre[0], p[2] - centre[2]] : null; } const b = F.bodies.find((q) => q.i === x); return b ? egBodyPlace(b, t) : null; };
        const a = endOf(tx[0]), b = endOf(tx[1]);
        if (!a || !b) continue;
        const sh = (_slots[_shapes.length] ??= slot());
        sh.kind = TELEGRAPH_KIND.lane; sh.origin[0] = a[0]; sh.origin[1] = a[1]; sh.end[0] = b[0]; sh.end[1] = b[1]; sh.halfW = tx[2] === 2 ? 0.25 : 0.35;
        sh.color = TETHER_COLOR; sh.edge = TELEGRAPH_EDGE_DAGON; sh.pool = TELEGRAPH_POOL.path; sh.t = 1; sh.flash = 0; sh.alpha = 0.55; sh.style = TELEGRAPH_STYLE.dagon; sh.since = (t % 60_000) / 1000; sh.span = 1; sh.after = -1; sh.court = 0;
        _shapes.push(sh);
        if (tx[2] === 0 && tx[1] === meSub && standing && t - drainAt >= EG_TICK_MS && Math.hypot(a[0] - b[0], a[1] - b[1]) <= 8) { drainAt = t; landShare(0.03, 0, null, 'Drain'); }
      }
      // MY MARKS - a challenge's ring kept, a cage held
      const mine = F.mk.filter((m) => m[0] === meSub && m[2] > t);
      const R = F.pg.ring;
      if (R && f) { const inside = mine.some((m) => m[1] === 6); ring(R[0], R[1], R[2], inside); }
      if (mine.some((m) => m[1] === 5)) hold(250);
      // THE PLACE - a gust's push
      if (F.gust && F.gust.at !== gustSeen && t >= F.gust.at) { gustSeen = F.gust.at; if (standing) push(F.gust.dx, F.gust.dz, F.gust.v * (F.gust.ms / 1000)); }
      beats(E, t, F);
      drawGateTitleCard(titleCardModel(beat, t), { hidden: hudHidden() });
    },
    /** No one body stands for the gate's boss seam: every body is the legion's seam's (`hostTargets`). */
    target: () => null,
    hit: () => false,
    /** Every body my blows meet - lords, the legion, the struck objects - and a blow of mine on one (`hit` by number). */
    hostTargets: () => _targets,
    hostHit({ i, d, r } = /** @type {any} */ ({})) {
      const dmg = Math.round(d);
      if (!Number.isInteger(i) || !(dmg >= 1) || !Object.values(HIT_KINDS).includes(r)) return false;
      const E = link.state(), b = E.fight.bodies.find((q) => q.i === i);
      if (!b) return false;
      b.hurtAt = now();
      return !!sendHit({ i, q: blowQ(`e${i}`), d: dmg, r });
    },
    riftTargets: () => [],
    riftHit: () => false,
    batches: () => _batches,
    lights: () => _lights,
    /** The telegraphs, the zones, the tethers and the objects, in the host's world pass. Answers whether anything drew. */
    drawPass(proj, view, eye, seconds, fog = null) {
      if (!centre) return false;
      let drew = false;
      if (_crystals.length) {
        if (!crystalTried && gl) { crystalTried = true; try { crystalPass = new CourtCrystalRenderer(gl); } catch (e) { console.warn('[eg] the crystals would not build', e?.message ?? e); crystalPass = null; } }
        if (crystalPass) { crystalPass.draw(_crystals, proj, view, eye, seconds, fog); drew = drew || crystalPass.drawn > 0; }
      }
      if (!passTried && gl) { passTried = true; try { pass = new GateTelegraphRenderer(gl, { spire: true }); } catch (e) { console.warn('[eg] the telegraphs would not build', e?.message ?? e); pass = null; } }
      if (!pass) return drew;
      egLookShapes(_shapes, egAccessNow(), stageNow);   // EG-G1/EG-G2: each shape in the shelf's palette, fill and style bit
      for (const sh of _shapes) if (!sh.mine) { pass.draw(sh, proj, view, eye, seconds, fog, centre, null, floor); drew = true; }
      for (const sh of _shapes) if (sh.mine) { pass.draw(sh, proj, view, eye, seconds, fog, centre, null, floor); drew = true; }   // section 25.4: mine on top
      return drew;
    },
    /** What the driver holds (tests, stats). */
    state: () => ({ hall, bodies: drawn.size, crystals: _crystals.length, shapes: _shapes.length, targets: _targets.length, judged: judged.size, mix: mix.stats(), stung: stung.size, heard: mix.heard(), fires: fireBatches.size }),
    /** EG-G2: the frame's shapes as the pass will draw them (tests): each one's look laid on. */
    shapes: () => _shapes,
    /** The count's words for a tracker that asks. */
    countText: (ms) => egCountText(ms),
    /** Out of the breach: everything put away. */
    leave() {
      for (const d of drawn.values()) destroy(d);
      drawn.clear(); crystalSlots.clear();
      dropFire(); toldHeard.clear(); mix.peers(false);   // EG-ZH: the flames freed, the peers as they were
      drawGateTitleCard(null);
      hall = 0; spec = null; centre = null; beat = null;
      _batches.length = 0; _lights.length = 0; _targets.length = 0; _crystals.length = 0; _shapes.length = 0;
    },
  };
}

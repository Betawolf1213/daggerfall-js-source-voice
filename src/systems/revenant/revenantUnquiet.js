// @ts-check
// UNQUIET (bible/06-Systems/Revenants.md section 46; the owner, 2026-10-17: "With revenants becoming a full fledge game
// loop. They need to become harder, rarer, revenants need more of a chance to flee instead of relying on player death, we
// need to go deeper on the experience and make it something insanely deep."): THE UNQUIET - revenants that live by
// getting away. systems/revenant/revenant.js keeps the record and its deeds; this sibling keeps what UNQUIET adds to them,
// every number in one place and every law pure but the flight's (it moves a live foe):
//
//  - RARER: only a special foe carrying THE MARK may rise (systems/revenant/unquietMark.js), and none rises while
//    REVENANT_MAX hunt the player (revenant.js).
//  - BORN OF FLIGHT, RANKED BY SURVIVING: a marked foe breaks and runs far oftener than a plain special foe ever did
//    (revenant.js's flee numbers), and a revenant climbs by getting away from the player - an escape, the will's
//    tear-away, a slip from the choice, the player's own flight - every time; a kill (or a companion felled) ranks it
//    only every BLOOD_RANK times (`deedRanks`).
//  - FLIGHT CRAFT: from CRAFT.RANK it breaks away in its own way (`fleeCraftOf`): a person throws down SMOKE (DFU's
//    Chameleon on it), a caster, a spirit or a daedra BLINKS out (a rift, gone - unless silenced, held or struck as it
//    fades), the dead SINK into the ground (a blow in the sinking breaks it, and it rises to fight to the end), and
//    anything else BOLTS (a faster run). Each has its answer, and the page says which it is.
//  - WOUNDS: what the player left on it. Every escape keeps a wound by the blow that broke it (`woundOf` - the ledger's
//    last class): a blade's bleeds, a hammer's cracks, an axe's maims, an arrow lames, an element sears. A wound
//    stays (WOUND.MAX, the oldest healing) and weakens it - its health, its blows, its poise, its Speed, its saving throw.
//  - AMBITION: what it does while it is away, by who it is (`ambitionOf`): VENGEANCE comes sooner and oftener, MASTERY
//    trains (it festers - grows - twice as fast), PLUNDER raids the roads (its gold grows each day it is left alone).
//  - THE DREAD: a rank-5 revenant that gets away once more ASCENDS - it goes to ground in its lair for good, every town
//    knows where, and it waits there: stronger, two last stands, never fleeing, a Legendary and a hoard when it falls.
//
// HOST-SPLIT: nothing here is a host's - the flight runs inside revenant.js revenantFleeStep (both pools' one law), its
// look through the pools' own dissolve (`f.portalFx`, revenantFate.js fateDissolve) and the scene's door (systems/
// playerDoor.js `fx`, the magic engine's techniques).
import { MOBILE_TYPES as M } from '../../characters/mobile/mobileTypes.js';
import { assignModBundle, isSilencedEffect, entityIsParalyzed } from '../effects.js';
import { DISSOLVE_ARCANE } from '../dissolve.js';
import { playerDoor } from '../playerDoor.js';
import { t } from '../textManager.js';   // L10N4: UNQUIET's words through the text core

// ── born of flight, ranked by surviving ─────────────────────────────
/** A revenant's kill of the player (or a companion it fells) ranks it up only every this many times - an escape ranks
 *  it every time (the owner: "more of a chance to flee instead of relying on player death"). */
export const BLOOD_RANK = 2;
/** The deeds that rank a revenant up each time: it got away (an escape, the will's tear-away, a slip from the choice -
 *  the `fled` deed), or the player got away from it (`routed`). */
export const SURVIVING_DEEDS = Object.freeze(['fled', 'routed']);
/** The deeds that rank it up every BLOOD_RANK times: its kill of the player, a companion felled. */
export const BLOOD_DEEDS = Object.freeze(['slew', 'felled']);
/** Does `deed` rank an existing revenant up, with `blood` its blood-deeds since its last rank (this one counted)? */
export const deedRanks = (deed, blood) => SURVIVING_DEEDS.includes(deed) || (BLOOD_DEEDS.includes(deed) && (blood | 0) >= BLOOD_RANK);
/** A record's blood count read back: a whole number under BLOOD_RANK. */
export const sanitizeBlood = (v) => (Number.isInteger(v) && v >= 0 ? Math.min(BLOOD_RANK - 1, v) : 0);

// ── the flight craft ────────────────────────────────────────────────
/** CRAFT: from RANK a revenant breaks away in its own way. BOLT_PACE its run (a share of its walk; every other run is
 *  revenant.js REVENANT_FLEE_PACE's 2) and SINK_PACE a sinking one's shuffle (the motor's flee takes no pace of none);
 *  SMOKE_ROUNDS its smoke's Chameleon (DFU's magic rounds); BLINK_DELAY (s) after it breaks it blinks, fading over
 *  BLINK_MS (ms); a SINK goes into the ground over SINK_MS after SINK_DELAY (ms). */
export const CRAFT = Object.freeze({
  RANK: 2,
  BOLT_PACE: 2.5,
  SINK_PACE: 0.05,
  SMOKE_ROUNDS: 2,
  BLINK_DELAY: 0.8,
  BLINK_MS: 600,
  SINK_DELAY: 200,
  SINK_MS: 1400,
});
export const CRAFTS = Object.freeze(['smoke', 'blink', 'sink', 'bolt']);
/** The edge each craft burns its body away in (systems/dissolve.js): a blink's arcane violet, a sink's grave earth. */
export const CRAFT_TINT = Object.freeze({ blink: DISSOLVE_ARCANE, sink: Object.freeze([0.5, 0.36, 0.2]) });
/** Who blinks: a caster's class, a spirit, a lich, an imp, a nymph, a shaman, every daedra and atronach. */
const BLINKERS = new Set([M.Mage, M.Sorcerer, M.Healer, M.Battlemage, M.Ghost, M.Wraith, M.Lich, M.AncientLich, M.Imp, M.Nymph, M.OrcShaman,
  M.FireDaedra, M.FrostDaedra, M.Daedroth, M.DaedraSeducer, M.DaedraLord, M.FireAtronach, M.IceAtronach, M.IronAtronach, M.FleshAtronach]);
/** Who sinks: the walking dead, and the spriggan into its roots. */
const SINKERS = new Set([M.SkeletalWarrior, M.Zombie, M.Mummy, M.Vampire, M.VampireAncient, M.Spriggan]);
/** ITS CRAFT, by its kind: a blinker blinks, a sinker sinks, any other person throws down smoke, anything else bolts. */
export function fleeCraftOf(mobileType) {
  if (!Number.isInteger(mobileType)) return 'bolt';
  if (BLINKERS.has(mobileType)) return 'blink';
  if (SINKERS.has(mobileType)) return 'sink';
  if (mobileType >= 128 && mobileType !== M.None) return 'smoke';
  return 'bolt';
}
/** A live revenant's craft as it breaks - its kind's, from CRAFT.RANK (`rank` its record's); null under it (it runs). */
export const revenantCraft = (mobileType, rank) => ((rank | 0) >= CRAFT.RANK ? fleeCraftOf(mobileType) : null);
/** The pace its run is at: a bolt's, a sink's shuffle (it stands and goes into the ground), else `pace`. */
export const craftPace = (craft, pace) => (craft === 'bolt' ? CRAFT.BOLT_PACE : craft === 'sink' ? CRAFT.SINK_PACE : pace);

/**
 * THE CRAFT BEGUN, as it breaks (revenant.js revenantFleeStep's 'start'): its body's `_craft` (what its flee card says),
 * and on the foe record `f` what its run must follow (`f._craft`): SMOKE - the Chameleon on it now (DFU's Normal kind:
 * its own blow would end it - systems/concealment.js - and a runner strikes none; a blow on it shows it for a moment,
 * systems/combatVisuals.js) and the door's puff; BLINK - its moment; SINK - its sinking begun (its dissolve, and the health
 * a blow would take from it). `now` ms.
 */
export function beginCraft(f, craft, { now = Date.now() } = {}) {
  const e = f?.entity;
  if (!e || !craft) return;
  e._craft = craft;
  f._craft = { kind: craft, at: now, hp: e.health, fired: 0 };
  const at = f.ai?.feet ?? null;
  if (craft === 'smoke') {
    try { assignModBundle(e, { name: 'Unquiet smoke', kind: 'chameleonNormal', rounds: CRAFT.SMOKE_ROUNDS }); } catch { /* no effects: it runs plain */ }
    puff(at);
  } else if (craft === 'sink') {
    f.portalFx = { dir: 'out', at: now, delay: CRAFT.SINK_DELAY, ms: CRAFT.SINK_MS, tint: CRAFT_TINT.sink };
    puff(at);
  }
}
/** The door's leaving puff where it stands (the magic engine's 'vanish' technique), if the scene has one. */
function puff(at) {
  if (!at) return;
  try { playerDoor()?.fx?.('vanish', [at[0], at[1], at[2]]); } catch { /* a scene with no effects */ }
}
/**
 * ONE FRAME OF ITS CRAFT while it runs (revenant.js revenantFleeStep): 'gone' - through (a blink faded, a sink under):
 * the pool's escape; 'broken' - a sink struck: it rises, cornered, and fights to the end; null - run on. A BLINK fires
 * CRAFT.BLINK_DELAY after it broke unless it is silenced or held (then it only runs, and never blinks this flight), and a
 * blow as it fades breaks it (it runs on). `now` ms.
 */
export function craftStep(f, now = Date.now()) {
  const c = f?._craft, e = f?.entity;
  if (!c || !e) return null;
  if (c.kind === 'sink') {
    if (e.health < c.hp) { f.portalFx = null; c.kind = 'broken'; return 'broken'; }
    return now - c.at >= CRAFT.SINK_DELAY + CRAFT.SINK_MS ? 'gone' : null;
  }
  if (c.kind !== 'blink') return null;
  if (!c.fired) {
    if (now - c.at < CRAFT.BLINK_DELAY * 1000) return null;
    let held = false;
    try { held = isSilencedEffect(e) || entityIsParalyzed(e); } catch { held = false; }
    if (held) { c.kind = 'run'; return null; }
    c.fired = now; c.hp = e.health;
    f.portalFx = { dir: 'out', at: now, delay: 0, ms: CRAFT.BLINK_MS, tint: CRAFT_TINT.blink };
    puff(f.ai?.feet ?? null);
    return null;
  }
  if (e.health < c.hp) { f.portalFx = null; c.kind = 'run'; return null; }
  return now - c.fired >= CRAFT.BLINK_MS ? 'gone' : null;
}

/** THE CRAFT PUT DOWN - a last stand, a kneel or a tear-away takes the foe mid-flight (revenantFate.js): its craft
 *  forgotten and its dissolve gone (a sink rising to its last stand stood half under the ground, going on fading). */
export function endCraft(f) {
  if (!f?._craft) return;
  f._craft = null;
  if (f.portalFx?.dir === 'out') f.portalFx = null;
}

// ── wounds ──────────────────────────────────────────────────────────
/** WOUND: at most MAX kept (the oldest heals); an element's wound RESIST on its saving throw against that element. */
export const WOUND = Object.freeze({ MAX: 3, RESIST: -15 });
/** What each wound does (a share of its health or its blows, a share of its poise, its Speed, an element's saving
 *  throw) and the blow that leaves it (the ledger's class - systems/feudLedger.js FEUD_CLASSES). */
export const WOUNDS = Object.freeze({
  bled: Object.freeze({ from: Object.freeze(['blade']), health: 0.9 }),
  cracked: Object.freeze({ from: Object.freeze(['blunt', 'h2h']), poise: 0.7 }),
  maimed: Object.freeze({ from: Object.freeze(['axe']), blows: 0.9 }),
  lamed: Object.freeze({ from: Object.freeze(['arrow']), speed: -15 }),
  burned: Object.freeze({ from: Object.freeze(['fire']), resist: 'fire' }),
  frostbitten: Object.freeze({ from: Object.freeze(['frost']), resist: 'frost' }),
  stormstruck: Object.freeze({ from: Object.freeze(['shock']), resist: 'shock' }),
  blighted: Object.freeze({ from: Object.freeze(['poison']), resist: 'poison' }),
  hexed: Object.freeze({ from: Object.freeze(['magic']), resist: 'magic' }),
});
const WOUND_KEYS = Object.freeze(Object.keys(WOUNDS));
export const isWound = (v) => typeof v === 'string' && WOUND_KEYS.includes(v);
/** The wound the blow that broke it leaves - by its class (`cls`, the ledger's `last`); none for another. */
export const woundOf = (cls) => WOUND_KEYS.find((k) => WOUNDS[k].from.includes(cls)) ?? null;
/** `wounds` with `w` taken now - a wound it already bears opens again (the newest), WOUND.MAX kept. */
export const withWound = (wounds, w) => (isWound(w) ? [...(Array.isArray(wounds) ? wounds : []).filter((x) => x !== w), w].slice(-WOUND.MAX) : [...(Array.isArray(wounds) ? wounds : [])]);
/** A record's wounds read back: known ones, once each, WOUND.MAX at most. */
export const sanitizeWounds = (v) => (Array.isArray(v) ? [...new Set(v.filter(isWound))].slice(-WOUND.MAX) : []);
/** WHAT ITS WOUNDS DO, at its stand: `health` and `blows` multiples, `poise` a multiple, `speed` points, `resist` by
 *  element (WOUND.RESIST each). Frozen. */
export function woundEffects(wounds) {
  let health = 1, blows = 1, poise = 1, speed = 0;
  /** @type {Record<string, number>} */
  const resist = {};
  for (const w of sanitizeWounds(wounds)) {
    const d = WOUNDS[w];
    if (d.health) health *= d.health;
    if (d.blows) blows *= d.blows;
    if (d.poise) poise *= d.poise;
    if (d.speed) speed += d.speed;
    if (d.resist) resist[d.resist] = (resist[d.resist] ?? 0) + WOUND.RESIST;
  }
  return Object.freeze({ health, blows, poise, speed, resist: Object.freeze(resist) });
}
/** Its stand's edge (revenantFeud.js adaptEdge's) with its wounds folded in: its poise lighter, an element's saving
 *  throw lower (a learned resistance less by it - never below none - or a wound's own). Frozen. */
export function woundedEdge(edge, wounds) {
  const w = woundEffects(wounds);
  if (w.poise === 1 && !Object.keys(w.resist).length) return edge;
  /** @type {Record<string, number>} */
  const resist = { ...(edge?.resist ?? {}) };
  for (const [el, n] of Object.entries(w.resist)) resist[el] = (resist[el] ?? 0) + n;
  return Object.freeze({ ...(edge ?? {}), poise: (edge?.poise ?? 1) * w.poise, resist: Object.freeze(resist) });
}

// ── ambition ────────────────────────────────────────────────────────
export const AMBITIONS = Object.freeze(['vengeance', 'mastery', 'plunder']);
/** Who wants what (systems/revenant/revenantPersonality.js's ten): the savage, the zealous and the mad want you; the
 *  proud, the cold and the honourable want to be better than you; the rest want what is on the road. */
const AMBITION_OF = Object.freeze({
  brutal: 'vengeance', zealous: 'vengeance', unhinged: 'vengeance',
  honourable: 'mastery', arrogant: 'mastery', cold: 'mastery',
  witty: 'plunder', humorous: 'plunder', craven: 'plunder', weary: 'plunder',
});
/** Its ambition, by its personality - derived, never stored. */
export const ambitionOf = (personality) => AMBITION_OF[personality] ?? 'vengeance';
/** AMBITION: VENGEANCE's return - due DUE (character minutes, its least and most) and its share of the encounter rolls;
 *  MASTERY's festering - a wrath FESTER_DAYS past its due day and every FESTER_EVERY days more (revenantFeud.js FESTER's
 *  3 and 3); PLUNDER's gold - x(1 + PER_DAY a whole day past its due day), at most MOST. */
export const AMBITION = Object.freeze({
  VENGEANCE_DUE: Object.freeze([1440, 2880]),
  VENGEANCE_RETURN: 0.55,
  FESTER_DAYS: 2,
  FESTER_EVERY: 2,
  PLUNDER_PER_DAY: 0.25,
  PLUNDER_MOST: 3,
});
/** MASTERY's festering: does `day` give a record due on `dueDay` a wrath? */
export const masteryFestersOn = (dueDay, day) => { const past = day - dueDay - AMBITION.FESTER_DAYS; return past >= 0 && past % AMBITION.FESTER_EVERY === 0; };
/** PLUNDER's hoard at a stand: its gold's multiple for `daysPast` whole days past its due day. */
export const plunderGold = (daysPast) => Math.min(AMBITION.PLUNDER_MOST, 1 + AMBITION.PLUNDER_PER_DAY * Math.max(0, Math.floor(Number(daysPast) || 0)));

// ── the Dread ───────────────────────────────────────────────────────
/** THE DREAD: its health over its rank's (HEALTH), its second last stand's share (SECOND_STAND - the first is its rank's),
 *  its gold (GOLD) and a Legendary always when it falls. */
export const DREAD = Object.freeze({ HEALTH: 1.5, STANDS: 2, SECOND_STAND: 0.25, GOLD: 3 });
/** May a record ASCEND - a living revenant of rank `max`, not the Dread already, with a lair to go to ground in? */
export const mayAscend = (r, max) => !!r && !r.dread && (r.rank | 0) >= max && !!r.lair;
/** Its last stand's share at its `n`th stand (1-based) - its rank's first (`first`), the Dread's second SECOND_STAND. */
export const dreadStandHealth = (n, first) => (n >= 2 ? DREAD.SECOND_STAND : first);

// ── its words (L10N4: every one through the text core) ───────────────
/** A craft's name and what it does, as the page says them. */
export function craftWords(craft) {
  switch (craft) {
    case 'smoke': return { name: t('rvn.unq.craft.smoke', 'Smoke'), effect: t('rvn.unq.craft.smokeDo', 'it throws down smoke and all but vanishes as it runs - each blow that lands shows it for a moment') };
    case 'blink': return { name: t('rvn.unq.craft.blink', 'Blink'), effect: t('rvn.unq.craft.blinkDo', 'it tears open a rift and is gone - silence it, hold it, or strike it as it fades') };
    case 'sink': return { name: t('rvn.unq.craft.sink', 'Sink'), effect: t('rvn.unq.craft.sinkDo', 'it sinks into the earth - strike it before it is under, and it rises to fight to the end') };
    case 'bolt': return { name: t('rvn.unq.craft.bolt', 'Bolt'), effect: t('rvn.unq.craft.boltDo', 'it runs faster than anything you have chased - bring it down from range') };
    default: return null;
  }
}
/** The narrator's line as it breaks away in its craft (its flee card). */
export function craftFleeWords(craft, given) {
  switch (craft) {
    case 'smoke': return t('rvn.unq.flee.smoke', '{given} throws down smoke and all but vanishes!', { given });
    case 'blink': return t('rvn.unq.flee.blink', '{given} tears open a rift - strike it before it is through!', { given });
    case 'sink': return t('rvn.unq.flee.sink', '{given} sinks into the earth - strike it before it is under!', { given });
    case 'bolt': return t('rvn.unq.flee.bolt', '{given} bolts!', { given });
    default: return null;
  }
}
/** A wound's name and what it does to it. */
export function woundWords(w) {
  switch (w) {
    case 'bled': return { name: t('rvn.unq.wound.bled', 'Bled'), effect: t('rvn.unq.wound.bledDo', 'a wound that never closed - less health') };
    case 'cracked': return { name: t('rvn.unq.wound.cracked', 'Cracked'), effect: t('rvn.unq.wound.crackedDo', 'cracked bones - it staggers easier') };
    case 'maimed': return { name: t('rvn.unq.wound.maimed', 'Maimed'), effect: t('rvn.unq.wound.maimedDo', 'a maimed hand - its blows are lighter') };
    case 'lamed': return { name: t('rvn.unq.wound.lamed', 'Lamed'), effect: t('rvn.unq.wound.lamedDo', 'a lamed leg - it runs slower') };
    case 'burned': return { name: t('rvn.unq.wound.burned', 'Burned'), effect: t('rvn.unq.wound.burnedDo', 'fire bites it deeper') };
    case 'frostbitten': return { name: t('rvn.unq.wound.frostbitten', 'Frostbitten'), effect: t('rvn.unq.wound.frostbittenDo', 'frost bites it deeper') };
    case 'stormstruck': return { name: t('rvn.unq.wound.stormstruck', 'Stormstruck'), effect: t('rvn.unq.wound.stormstruckDo', 'shock bites it deeper') };
    case 'blighted': return { name: t('rvn.unq.wound.blighted', 'Blighted'), effect: t('rvn.unq.wound.blightedDo', 'poison bites it deeper') };
    case 'hexed': return { name: t('rvn.unq.wound.hexed', 'Hexed'), effect: t('rvn.unq.wound.hexedDo', 'magic bites it deeper') };
    default: return null;
  }
}
/** An ambition's name and what it does while it waits. */
export function ambitionWords(a) {
  switch (a) {
    case 'vengeance': return { name: t('rvn.unq.amb.vengeance', 'Vengeance'), effect: t('rvn.unq.amb.vengeanceDo', 'it comes for you sooner, and more often') };
    case 'mastery': return { name: t('rvn.unq.amb.mastery', 'Mastery'), effect: t('rvn.unq.amb.masteryDo', 'it trains while it waits, and grows bolder twice as fast') };
    case 'plunder': return { name: t('rvn.unq.amb.plunder', 'Plunder'), effect: t('rvn.unq.amb.plunderDo', 'it raids the roads while it waits - the longer you leave it, the richer it is') };
    default: return null;
  }
}
/** What the towns say of what it does while it waits - a rumour's last sentence. */
export function ambitionRumor(a) {
  switch (a) {
    case 'vengeance': return t('rvn.unq.rumor.vengeance', 'Word is it asks after you by name.');
    case 'mastery': return t('rvn.unq.rumor.mastery', 'Word is it trains day and night for the day it meets you again.');
    case 'plunder': return t('rvn.unq.rumor.plunder', 'Word is it has been raiding the roads.');
    default: return '';
  }
}

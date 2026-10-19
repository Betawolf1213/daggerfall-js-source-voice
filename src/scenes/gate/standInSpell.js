// @ts-check
// FIELD BUGS 2026-10-19b STAND-IN-WHOLE (a player's private report: a Disintegrate on an online breach's boss popped a
// huge number, and his bar never moved): A HARMFUL SPELL OF MINE ON A BODY THE RELAY RUNS - the court's Warden, his
// crystals and his host (WB4b, WB9c, WB11c); in the Shattered Hour the Brass Remnant, its Echoes and its Hearts (SD8c);
// every lord, add and struck object of an Elite Breach's hall (EG-PLAY, through the host seam); my opponent on a relay's
// sand (ARENA4b). HOST-SPLIT (bible/01-Overview/Host-Split.md): out of buildDungeonContext, which kept this one door four
// times over (spellOnBoss, spellOnCrystal, spellOnHost, spellOnRival) - and the host wires it where they stood.
//
// THE DOOR. The spell's harmful families (combat/duelCombat.js duelSpellOf) land on the body's stand-in
// (world/gate/gateBoss.js) by the one door every spell lands through (systems/effects.js applySpell - the magnitude, its
// save), its hurts COUNTED - nothing here takes from a stand-in, the relay holds the health - and every lasting family
// forgotten at once. The sum is the claim, out through the host's door for that body; the relay's caps decide what lands.
//
// THE NUMBER IT SAYS is what can land (standInShown): the claim, never past the most one blow of mine lands there - the
// relay's one-blow cap at my level (world/gate/gateBoss.js standInBlowCap; an Elite Breach's grown by my Vestiges' declared
// factor), a bout referee's spell cap (net/arena/arenaLaw.js arenaBlowCap). The paths' riders are told the same (`took`:
// what the foe could lose - AUDIT SCHOOLS L1 M6). It said the claim whole, and a Disintegrate's claim is its target's whole
// (STAND_IN_WHOLE; 1e9 until this fix, which no wire carried): a number rose that nothing landed.
//
// Not a DFU member (every DFU foe is its own); the whole a Disintegrate counts here is gateBoss.js's (STAND_IN_WHOLE).
import { applySpell, spellSways, isSoulTrapEffect } from '../../systems/effects.js';
import { duelSpellOf } from '../../combat/duelCombat.js';
import { reportPlayerAttack } from '../../combat/formulas.js';
import { tellSpellLanded } from '../../systems/spell/spellPower.js';
import { SOUL_TRAP_TEXT } from '../../systems/mysticism.js';
import { HIT_KINDS } from '../../net/gate/gateBrain.js';
import { ARENA_HIT, arenaBlowCap } from '../../net/arena/arenaLaw.js';
import { BOSS_SWAY_TEXT, BOSS_SWAY_TELL_MS, standInBlowCap } from '../../world/gate/gateBoss.js';

/**
 * A HARMFUL SPELL'S FAMILIES ON A STAND-IN, COUNTED: `harm` (duelSpellOf's) landed on `entity` by the one door every spell
 * lands through - at my `level`, `caster` its caster, `rolls` the dice - its hurts summed, every other family nothing,
 * and the stand-in forgetting every lasting family at once. Nothing is taken from it. `{ dealt, r }`: the sum, the door's
 * answer.
 * @param {any} harm @param {any} entity @param {number} level @param {any} caster @param {() => number} [rolls]
 */
export function countOnStandIn(harm, entity, level, caster, rolls = Math.random) {
  let dealt = 0, r = null;
  const sinks = { hurt: (n) => { dealt += Math.max(0, n); }, heal() {}, drainFatigue() {}, restoreFatigue() {}, drainMagicka() {}, restoreMagicka() {} };
  try { r = applySpell(harm, level, entity, sinks, rolls, { entity: caster }); } finally { entity.activeEffects = []; }
  return { dealt, r };
}

/** STAND-IN-WHOLE: WHAT A CLAIM OF `dealt` CAN LAND where one blow lands at most `cap` - the number it says. Pure.
 *  @param {number} dealt @param {number} cap */
export const standInShown = (dealt, cap) => Math.min(Math.max(0, dealt), cap);

/**
 * THE DOORS, made once a context (scenes/dungeonContext.js, where its own stood). `host`:
 *   player        my entity - the level and the caster a cast lands with
 *   say(line)     the mid-screen line (his refusal of a sway, a trap's word)
 *   boss()        his body as a foe-shaped record, or null (the Remnant in the Hour); crystals() the crystals' (the
 *                 Hearts), host() his host's (the Echoes; an Elite Breach's bodies), rival() my opponent's
 *   landOnBoss, landOnCrystal, landOnHost (body, d, r) and landOnRival (body, d, kind) - the doors a claim leaves through
 *   nextArenaQ()  a bout's next blow (ARENA4b: each spell its own)
 *   trapNow(), onTrap(trap) - the court's keeping of my trap on him (WBX7, AUDIT WBX F6)
 *   rolls, now    the dice and the clock (Math.random, Date.now)
 * Answers the four doors and the one a Cast When Strikes spell takes (spellOnStandIn).
 * @param {any} host
 */
export function createStandInSpell(host) {
  const { player, say, rolls = Math.random, now = Date.now } = host;
  let swayToldAt = -Infinity;   // WB8a: when his refusal was last said
  /** AUDIT SCHOOLS L2 F4: MY SPELL LANDED ON A STAND-IN OF THE COURT - told to the paths' riders as any landing of mine is
   *  (hostMagic.js applySpellToFoe), with no foe record: the relay holds the body, so no arc or second burn reaches it.
   *  What it took is what can land (STAND-IN-WHOLE). `caster` the cast's wrapper (its token and cost), when the cast
   *  engine's. */
  function tellStandIn(sp, entity, r, took, caster) {
    tellSpellLanded({ caster: player, target: entity, foe: null, spell: sp, r, self: false, took, cast: caster?.cast ?? null });
  }
  /** A body of the court met (him, a crystal, one of his host): the spell counted on its stand-in, told, its number risen
   *  as a blow's does (HN1) - what can land, by the body it met (AUDIT FB1018f L3-2: a turned one says its word) - and the
   *  claim out through `land`. Answers whether it went. */
  function onBody(sp, body, harm, caster, land) {
    const { dealt, r } = countOnStandIn(harm, body.entity, player.level, player, rolls);
    if (!(dealt >= 1)) return false;
    const shown = standInShown(dealt, standInBlowCap(body.entity, player.level));
    tellStandIn(sp, body.entity, r, shown, caster);
    reportPlayerAttack({ hit: true, damage: Math.round(shown), target: body.entity });
    return land(body, dealt, HIT_KINDS.Spell);
  }
  /** WB9c: a harmful spell of mine that met a crystal (hostMagic's crystal seam). */
  function spellOnCrystal(sp, c, caster = null) {
    const cr = host.crystals().find((q) => q.crystal === c), harm = duelSpellOf(sp);
    if (!cr || !harm) return false;
    return onBody(sp, cr, harm, caster, host.landOnCrystal);
  }
  /** WB11c: a harmful spell of mine that met one of his host (hostMagic's host seam). */
  function spellOnHost(sp, i, caster = null) {
    const hb = host.host().find((q) => q.host === i), harm = duelSpellOf(sp);
    if (!hb || !harm) return false;
    return onBody(sp, hb, harm, caster, host.landOnHost);
  }
  /** ARENA4b: A HARMFUL SPELL OF MINE THAT MET MY OPPONENT (hostMagic's duel seam): out to the referee as a spell - its own
   *  sequence, PVP-REF's three casts in five seconds and its spell cap deciding what lands (swingOnRival's road); its
   *  number what that cap lets land. No rider is told: the powers sleep in a bout. */
  function spellOnRival(sp) {
    const rb = host.rival(), harm = duelSpellOf(sp);
    if (!rb || !harm) return false;
    const { dealt } = countOnStandIn(harm, rb.entity, player.level, player, rolls);
    if (!(dealt >= 1)) return false;
    reportPlayerAttack({ hit: true, damage: Math.round(standInShown(dealt, arenaBlowCap({ r: ARENA_HIT.Spell }))) });   // HN1: the number pops as a blow's does
    host.nextArenaQ();
    return host.landOnRival(rb, dealt, 'spell');
  }
  /** WB4b: a harmful spell of mine that met him (hostMagic's boss seam). Continuous families are not his to carry - the
   *  stand-in forgets them. */
  function spellOnBoss(sp, caster = null) {
    const boss = host.boss(), harm = duelSpellOf(sp);
    if (!boss) return false;
    // WB8a: A SWAY ON HIM. A Pacify or a Charm in the spell is refused by his own word (world/gate/gateBoss.js bossStandIn's
    // pacifyImmune) and said so - the rest of the spell lands as it would; alone, the refusal is what met him
    const sways = spellSways(sp) && !!boss.entity.pacifyImmune;
    if (sways && now() - swayToldAt >= BOSS_SWAY_TELL_MS) { swayToldAt = now(); say(BOSS_SWAY_TEXT(boss.entity.name)); }
    // WBX7 (2026-09-26, Swololo on Discord: "soul trap didnt seem to work"): A SOUL TRAP ON HIM. The trap is laid on his
    // stand-in by the one door every spell lands through (applySpell - its rounds, its chance frozen at the cast by my
    // level, his save against a new trap, "Trap active."), and handed to the court, which keeps it on the fight's clock:
    // he is the relay's to kill, so the kill's roll is the court's, at his fall (scenes/gate/gateCourt.js). The stand-in
    // forgets it at once, as it forgets every lasting family.
    const trapFx = (sp.effects ?? []).filter((e) => e && isSoulTrapEffect(e));
    let laid = false;
    if (trapFx.length) {
      const noSink = () => {};
      // AUDIT WBX F6: a trap of mine already running on him (the court keeps it) is his incumbent for this cast - a recast
      // renews its rounds with no new save (effects.js renewRounds, STACK-CAP), where the stand-in's forgotten trap made every
      // recast a new one against his save
      const running = host.trapNow();
      if (running) boss.entity.activeEffects = [{ kind: 'soulTrap', chance: running.chance, roundsRemaining: 0 }];
      try {
        const res = applySpell({ ...sp, effects: trapFx }, player.level, boss.entity, { hurt: noSink, heal: noSink, drainFatigue: noSink, restoreFatigue: noSink, drainMagicka: noSink, restoreMagicka: noSink }, rolls, { entity: player });
        const trap = (boss.entity.activeEffects ?? []).find((a) => a.kind === 'soulTrap' && !a.ended);
        if (trap) laid = !!host.onTrap({ chance: trap.chance, rounds: (trap.roundsRemaining ?? 0) + 1 });
        if (res?.trapAlert && SOUL_TRAP_TEXT[res.trapAlert]) say(SOUL_TRAP_TEXT[res.trapAlert]);
      } catch (e) { console.warn('[gate] the trap on him', e?.message ?? e); } finally { boss.entity.activeEffects = []; }
    }
    if (!harm) return laid || sways;
    return onBody(sp, boss, harm, caster, host.landOnBoss);
  }
  /** AUDIT WB11 W1: A CAST WHEN STRIKES SPELL ON A STAND-IN OF THE COURT - the one it names: one of his host (`hostI`),
   *  a crystal (`crystalC`), else him. Every one went to his door, wherever he stood: a blade that cut an Imp cast on him. */
  function spellOnStandIn(record, target = null) {
    if (target?.hostI != null) return spellOnHost(record, target.hostI);
    if (target?.crystalC != null) return spellOnCrystal(record, target.crystalC);
    return spellOnBoss(record);
  }
  return { spellOnBoss, spellOnCrystal, spellOnHost, spellOnRival, spellOnStandIn };
}

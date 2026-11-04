// ═══════════════════════════════════════════════════════════════════
// FORAGE1 (2026-09-28): QUEST ACTIONS EXTENSION'S FOUR ACTIONS - the ones
// Harbinger451's Foraging quests say (bible/06-Systems/Foraging.md 9.2).
// Quest Actions Extension is Jagget's (2.0.0, github.com/Jagget/
// QuestActionsExtension at 56a407e, Actions/*.cs); nothing of it is
// carried - each class here restates one of its actions' behaviour, cited
// to its file, and Jagget is credited on the About screen beside the mod
// that needs it (Mac: "Your lead").
//
//   raise time by H:MM          RaiseTime.cs           WorldTime.Now.RaiseTime(seconds) - a bare clock advance
//                                                      (online, FORAGE4: the host's wait - the clock is shared)
//   reduce player fatigue by N  ReducePlayerFatigue.cs  N percent of the maximum, the floor 1 (raw x64 values)
//   player possesses N items class C subclass S   PlayerPossesses.cs   an always-on trigger, pack and wagon
//   player handsover N items class C subclass S   PlayerHandsover.cs   removes N, pack first then wagon
//
// `update-quest-item _x_ Leveled` matches no action of QAE's in any
// version (its form is `... set-material <material>`), so DFU drops the
// line; the port's parser already keeps an unmatched line inert
// (task.js pendingActionLines). Nothing here answers it.
//
// FORAGE-FIX Q11: QAE's handsover searches the PACK for the wagon's share
// (`WagonItems = player.Items.SearchItems(...)`), so pack items count
// twice and the wagon's are never taken. The port searches the wagon -
// the one departure here, recorded in FORAGE0 12 and the Port-Ledger.
// ═══════════════════════════════════════════════════════════════════

import { ActionTemplate } from './actions.js';
import { ITEM_GROUPS } from '../../characters/equipRules.js';
import { isSummoned } from '../inventory.js';
import { maxFatigue, FATIGUE_MULTIPLIER } from '../statMods.js';
import { raiseTimeSeconds, reduceFatigueBy } from '../foragingLaw.js';

/** ItemGroups' number -> the port's group name. */
const GROUP_NAME_OF = Object.freeze(Object.fromEntries(Object.entries(ITEM_GROUPS).map(([name, n]) => [n, name])));

/**
 * .NET's unanchored Regex.Match over an alternation: at the leftmost position where any alternative matches, the
 * first alternative that matches there. The patterns here are kept as their alternatives, since a JS pattern may
 * not repeat a group name.
 */
function matchAlternatives(alternatives, source) {
  let best = null;
  alternatives.forEach((re, i) => {
    const m = re.exec(source);
    if (m && (!best || m.index < best.m.index)) best = { m, i };
  });
  return best;
}

/** ItemCollection.SearchItems(group, templateIndex), quest items excluded (the actions' FindAll). */
function searchNonQuest(list, itemClass, itemSubClass) {
  const group = GROUP_NAME_OF[itemClass];
  return (list ?? []).filter((it) => it && it.group === group && it.templateIndex === itemSubClass && !it.questItem);
}
/** Helpers.CalculateLengthOrStackCount: a stack counts its size, anything else 1; a summoned item counts nothing. */
export function lengthOrStackCount(items) {
  let count = 0;
  for (const it of items ?? []) if (!isSummoned(it)) count += (it.stackCount ?? 1) > 1 ? it.stackCount : 1;
  return count;
}
/** Helpers.RemoveNFromList: whole items or stacks, then part of a stack, until `amount` are gone. */
function removeNFromList(storage, items, amount) {
  let removed = 0;
  for (const it of items) {
    if (removed >= amount) break;
    const stack = it.stackCount ?? 1;
    if (stack > 1) {
      if (stack <= amount - removed) {
        const at = storage.indexOf(it);
        if (at >= 0) storage.splice(at, 1);
        removed += stack;
      } else {
        it.stackCount = stack - (amount - removed);
        removed = amount;
      }
    } else {
      const at = storage.indexOf(it);
      if (at >= 0) storage.splice(at, 1);
      removed += 1;
    }
  }
}

/** The player's pack and wagon counts of a class and subclass. */
function heldCounts(entity, itemClass, itemSubClass) {
  const pack = searchNonQuest(entity?.items, itemClass, itemSubClass);
  const wagon = searchNonQuest(entity?.wagonItems, itemClass, itemSubClass);
  return { pack, wagon, inPack: lengthOrStackCount(pack), inWagon: lengthOrStackCount(wagon) };
}

const RAISE_TIME = Object.freeze([
  // RaiseTime.cs's Pattern, alternative by alternative: THREE, not four - the file forgot the `|` between its second
  // and third lines, so its second alternative is `raise time to H:MMraise time by H:MM saying N` and neither a bare
  // `raise time to H:MM` nor `raise time by H:MM saying N` exists on its own (the latter matches as the bare `by`, its
  // saying unread).
  /raise time to (?<hoursTo>\d+):(?<minutesTo>\d+) saying (?<sayingID>\d+)/,
  /raise time to (?<hoursTo>\d+):(?<minutesTo>\d+)raise time by (?<hours>\d+):(?<minutes>\d+) saying (?<sayingID>\d+)/,
  /raise time by (?<hours>\d+):(?<minutes>\d+)/,
]);

/** RaiseTime.cs: `raise time by H:MM` (a bare advance) or `raise time to H:MM` (to that hour, today or tomorrow). */
export class RaiseTime extends ActionTemplate {
  static typeName = 'RaiseTime';
  get saveShape() { return [['hours'], ['minutes'], ['hoursTo'], ['minutesTo'], ['sayingID']]; }
  constructor(parentQuest) {
    super(parentQuest);
    this.hours = 0; this.minutes = 0; this.hoursTo = 0; this.minutesTo = 0; this.sayingID = 0;
  }
  get pattern() { return RAISE_TIME[2]; }
  test(source) { return matchAlternatives(RAISE_TIME, source)?.m ?? null; }
  createNew(source, parentQuest) {
    const m = this.test(source);
    if (!m) return null;
    const g = m.groups ?? {};
    const a = new RaiseTime(parentQuest);
    a.hours = g.hours != null ? Math.max(Number(g.hours), 0) : 0;
    a.minutes = g.minutes != null ? Math.max(Number(g.minutes), 0) : 0;
    a.hoursTo = g.hoursTo != null ? Math.min(Math.max(Number(g.hoursTo), 0), 23) : 0;
    a.minutesTo = g.minutesTo != null ? Math.min(Math.max(Number(g.minutesTo), 0), 59) : 0;
    a.sayingID = g.sayingID != null ? Number(g.sayingID) : 0;
    if (a.hours + a.minutes + a.hoursTo + a.minutesTo === 0) return null;   // CreateNew's own refusal: DFU drops the line
    return a;
  }
  update(_caller) {
    const hooks = this.parentQuest?.hooks;
    let seconds = 0;
    if (this.minutes + this.hours > 0) {
      seconds = raiseTimeSeconds(this.hours, this.minutes);
    } else if (this.minutesTo + this.hoursTo > 0) {
      const now = Math.floor(((hooks?.skySeconds ?? hooks?.nowSeconds)?.() ?? 0) / 60);   // classic minutes: midnight on a whole day - TIME3: the time of day is the sky's
      const current = 60 * (now % 60) + 3600 * (Math.floor(now / 60) % 24);
      const desired = 60 * this.minutesTo + 3600 * this.hoursTo;
      seconds = desired >= current ? desired - current : desired - current + 86400;
    }
    // FORAGE4 (the Ledger A FORAGING row's departure 5): online the shared clock is nobody's to move (WORLD5), so the
    // seconds are the host's WAIT (scenes/foragingWait.js, FORAGE0 13.1); offline the clock moves, as QAE's. MERGE 2
    // (main's LIVED1, "your own time"): online they pass on the character's OWN clock too, after the wait page - the
    // host's raiseTime is the character's time in both lanes (the one clock offline)
    if (seconds > 0) {
      if (hooks?.sharedClock?.()) hooks?.waitOnline?.(seconds, this.parentQuest);
      hooks?.raiseTime?.(seconds);
    }
    if (this.sayingID > 0) this.parentQuest.showMessagePopup(this.sayingID);
    this.setComplete();
  }
}

const REDUCE_FATIGUE = Object.freeze([/reduce player fatigue by (?<percent>\d+)/, /reduce player fatigue on (?<amount>\d+)/]);

/** ReducePlayerFatigue.cs: `by N` is N percent of the maximum, `on N` is N raw; never below 1. */
export class ReducePlayerFatigue extends ActionTemplate {
  static typeName = 'ReducePlayerFatigue';
  get saveShape() { return [['percent'], ['amount']]; }
  constructor(parentQuest) { super(parentQuest); this.percent = 0; this.amount = 0; }
  get pattern() { return REDUCE_FATIGUE[0]; }
  test(source) { return matchAlternatives(REDUCE_FATIGUE, source)?.m ?? null; }
  createNew(source, parentQuest) {
    const m = this.test(source);
    if (!m) return null;
    const a = new ReducePlayerFatigue(parentQuest);
    a.percent = m.groups?.percent != null ? Number(m.groups.percent) : 0;
    a.amount = m.groups?.amount != null ? Number(m.groups.amount) : 0;
    return a;
  }
  update(_caller) {
    const e = this.parentQuest?.hooks?.playerEntity?.();
    if (e) {
      const current = e.fatigue ?? 0;
      let fatigue = 0;
      if (this.percent > 0) fatigue = reduceFatigueBy(current, maxFatigue(e), this.percent);
      if (this.amount > 0) fatigue = current - this.amount;
      e.fatigue = Math.min(maxFatigue(e), Math.max(1, fatigue));   // then CurrentFatigue's setter clamps to the maximum
    }
    this.setComplete();
  }
}

const POSSESSES = /player possesses (?<numberOfItems>\d+) items class (?<itemClass>\d+) subclass (?<itemSubClass>\d+)/;
const HANDSOVER = /player handsover (?<numberOfItems>\d+) items class (?<itemClass>\d+) subclass (?<itemSubClass>\d+)/;
const itemFields = (a, m) => {
  a.numberOfItems = Number(m.groups.numberOfItems);
  a.itemClass = Number(m.groups.itemClass);
  a.itemSubClass = Number(m.groups.itemSubClass);
  return a;
};

/** PlayerPossesses.cs: true while the pack and the wagon together hold N (quest items not counted). */
export class PlayerPossesses extends ActionTemplate {
  static typeName = 'PlayerPossesses';
  get saveShape() { return [['numberOfItems'], ['itemClass'], ['itemSubClass']]; }
  constructor(parentQuest) {
    super(parentQuest);
    this.isTriggerCondition = true;
    this.isAlwaysOnTriggerCondition = true;
    this.numberOfItems = 0; this.itemClass = 0; this.itemSubClass = 0;
  }
  get pattern() { return POSSESSES; }
  createNew(source, parentQuest) {
    const m = this.test(source);
    return m ? itemFields(new PlayerPossesses(parentQuest), m) : null;
  }
  checkTrigger(_caller) {
    const e = this.parentQuest?.hooks?.playerEntity?.();
    if (!e) return false;
    const { inPack, inWagon } = heldCounts(e, this.itemClass, this.itemSubClass);
    return inPack + inWagon >= this.numberOfItems;
  }
}

/** PlayerHandsover.cs: takes N from the pack first and the rest from the wagon; nothing unless all N are held. */
export class PlayerHandsover extends ActionTemplate {
  static typeName = 'PlayerHandsover';
  get saveShape() { return [['numberOfItems'], ['itemClass'], ['itemSubClass']]; }
  constructor(parentQuest) { super(parentQuest); this.numberOfItems = 0; this.itemClass = 0; this.itemSubClass = 0; }
  get pattern() { return HANDSOVER; }
  createNew(source, parentQuest) {
    const m = this.test(source);
    return m ? itemFields(new PlayerHandsover(parentQuest), m) : null;
  }
  update(_caller) {
    const e = this.parentQuest?.hooks?.playerEntity?.();
    if (!e) return;
    const { pack, wagon, inPack, inWagon } = heldCounts(e, this.itemClass, this.itemSubClass);   // Q11: the wagon's own
    if (inPack + inWagon < this.numberOfItems) return;
    const fromPack = Math.min(this.numberOfItems, inPack);
    const fromWagon = this.numberOfItems - fromPack;
    if (fromPack > 0) removeNFromList(e.items, pack, fromPack);
    if (fromWagon > 0) removeNFromList(e.wagonItems, wagon, fromWagon);
    this.setComplete();
  }
}

// ═══════════════════════════════════════════════════════════════════
// QAE2 (2026-11-02): THE VITALS FAMILY - the eight actions and triggers a
// quest reaches for most (Quest Actions Extension 2.0.0, Jagget,
// github.com/Jagget/QuestActionsExtension, Actions/*.cs). As with the four
// above: nothing of the mod is carried, each class restates one action's
// behaviour cited to its file, and the editor's catalog
// (raven-wright vendor/qae/QuestActionsExtension.dfmodule.json) names the
// same verbs so an authored quest lints here and runs here.
//
//   reduce player health ...       ReducePlayerHealth.cs    percent is of the MAXIMUM, amount absolute, floor 1
//                                                           (0 with `can kill`); an interval repeats on the WALL
//                                                           clock, `times` absent meaning 1000000 (forever)
//   reduce player magicka by/on    ReducePlayerMagicka.cs
//   increase player health/fatigue/magicka by/on   IncreasePlayerX.cs   capped at the maximum
//   player health|magicka is less than N pt|N%     WhenXLevel.cs        ALWAYS-ON triggers, `<=`, the percent arm
//   player fatigue is less than N pt|N%            WhenFatigueLevel.cs  taking precedence; fatigue points are
//                                                           multiplied by FatigueMultiplier (64), so an author
//                                                           writes the character sheet's 30, not 1920
// ═══════════════════════════════════════════════════════════════════

/** Wall-clock seconds, as Time.realtimeSinceStartup is for the interval forms; swappable for tests. */
let nowRealSeconds = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
/** Test seam: hand the interval forms a clock. */
export function setQaeRealClock(fn) { nowRealSeconds = typeof fn === 'function' ? fn : nowRealSeconds; }

/** The vital's maximum, by name. */
const maxVital = (e, vital) => {
  if (vital === 'health') return e?.maxHealth ?? 0;
  if (vital === 'magicka') return e?.maxMagicka ?? 0;
  return maxFatigue(e);
};

/** ReducePlayerX's arithmetic: percent of the maximum or an absolute amount, floored (0 only when it may kill). */
function reducedVital(e, vital, percent, amount, canKill) {
  const current = e?.[vital] ?? 0;
  let next = 0;
  if (percent > 0) next = Math.trunc(current - (maxVital(e, vital) * percent) / 100);
  if (amount > 0) next = current - amount;
  if (next < 1) next = canKill ? 0 : 1;
  return Math.min(maxVital(e, vital), next);
}

/** IncreasePlayerX's arithmetic: percent of the maximum or an absolute amount, never past the maximum. */
function increasedVital(e, vital, percent, amount) {
  const current = e?.[vital] ?? 0;
  const max = maxVital(e, vital);
  let next = current;
  if (percent > 0) next = Math.trunc(current + (max * percent) / 100);
  if (amount > 0) next = current + amount;
  return Math.max(0, Math.min(max, next));
}

const REDUCE_HEALTH = Object.freeze([
  /reduce player health by (?<percent>\d+) every (?<interval>\d+) seconds (?<numberOfTimes>\d+) times(?<cankill> can kill)/,
  /reduce player health by (?<percent>\d+) every (?<interval>\d+) seconds (?<numberOfTimes>\d+) times/,
  /reduce player health by (?<percent>\d+) every (?<interval>\d+) seconds(?<cankill> can kill)/,
  /reduce player health by (?<percent>\d+) every (?<interval>\d+) seconds/,
  /reduce player health by (?<percent>\d+)/,
  /reduce player health on (?<amount>\d+)/,
]);

/** ReducePlayerHealth.cs: the one-shot forms and the ticking ones ("times" absent = 1000000, its forever). */
export class ReducePlayerHealth extends ActionTemplate {
  static typeName = 'ReducePlayerHealth';
  get saveShape() { return [['percent'], ['amount'], ['interval'], ['numberOfTimes'], ['canKill'], ['nextTick']]; }
  constructor(parentQuest) {
    super(parentQuest);
    this.percent = 0; this.amount = 0; this.interval = 0; this.numberOfTimes = 1; this.canKill = false; this.nextTick = 0;
  }
  get pattern() { return REDUCE_HEALTH[4]; }
  test(source) { return matchAlternatives(REDUCE_HEALTH, source)?.m ?? null; }
  createNew(source, parentQuest) {
    const m = this.test(source);
    if (!m) return null;
    const a = new ReducePlayerHealth(parentQuest);
    const g = m.groups ?? {};
    a.percent = g.percent != null ? Number(g.percent) : 0;
    a.amount = g.amount != null ? Number(g.amount) : 0;
    a.interval = g.interval != null ? Number(g.interval) : 0;
    a.numberOfTimes = g.numberOfTimes != null ? Number(g.numberOfTimes) : (g.interval != null ? 1000000 : 1);
    a.canKill = g.cankill != null;
    return a;
  }
  update(_caller) {
    if (nowRealSeconds() < this.nextTick) return;
    if (this.numberOfTimes > 0) {
      this.numberOfTimes -= 1;
      const e = this.parentQuest?.hooks?.playerEntity?.();
      if (e) e.health = reducedVital(e, 'health', this.percent, this.amount, this.canKill);
    } else {
      this.setComplete();
    }
    this.nextTick = nowRealSeconds() + this.interval;
  }
}

/** One by/on pair - the shape every other vitals action takes. */
const byOn = (verb, vital) => Object.freeze([
  new RegExp(`${verb} player ${vital} by (?<percent>\\d+)`),
  new RegExp(`${verb} player ${vital} on (?<amount>\\d+)`),
]);

/** ReducePlayerMagicka.cs / IncreasePlayerX.cs: percent of the maximum or an absolute amount, clamped. */
class VitalChange extends ActionTemplate {
  constructor(parentQuest, alternatives, vital, grow) {
    super(parentQuest);
    this.alternatives = alternatives; this.vital = vital; this.grow = grow;
    this.percent = 0; this.amount = 0;
  }
  get saveShape() { return [['percent'], ['amount']]; }
  get pattern() { return this.alternatives[0]; }
  test(source) { return matchAlternatives(this.alternatives, source)?.m ?? null; }
  createNew(source, parentQuest) {
    const m = this.test(source);
    if (!m) return null;
    const a = new this.constructor(parentQuest);
    a.percent = m.groups?.percent != null ? Number(m.groups.percent) : 0;
    a.amount = m.groups?.amount != null ? Number(m.groups.amount) : 0;
    return a;
  }
  update(_caller) {
    const e = this.parentQuest?.hooks?.playerEntity?.();
    if (e) {
      const next = this.grow
        ? increasedVital(e, this.vital, this.percent, this.amount)
        : reducedVital(e, this.vital, this.percent, this.amount, false);
      e[this.vital] = next;
    }
    this.setComplete();
  }
}

/** ReducePlayerMagicka.cs. */
export class ReducePlayerMagicka extends VitalChange {
  static typeName = 'ReducePlayerMagicka';
  constructor(parentQuest) { super(parentQuest, byOn('reduce', 'magicka'), 'magicka', false); }
}
/** IncreasePlayerHealth.cs. */
export class IncreasePlayerHealth extends VitalChange {
  static typeName = 'IncreasePlayerHealth';
  constructor(parentQuest) { super(parentQuest, byOn('increase', 'health'), 'health', true); }
}
/** IncreasePlayerFatigue.cs. */
export class IncreasePlayerFatigue extends VitalChange {
  static typeName = 'IncreasePlayerFatigue';
  constructor(parentQuest) { super(parentQuest, byOn('increase', 'fatigue'), 'fatigue', true); }
}
/** IncreasePlayerMagicka.cs. */
export class IncreasePlayerMagicka extends VitalChange {
  static typeName = 'IncreasePlayerMagicka';
  constructor(parentQuest) { super(parentQuest, byOn('increase', 'magicka'), 'magicka', true); }
}

/** WhenXLevel.cs: an ALWAYS-ON trigger, true while the vital is at or under the bar (percent arm first). */
class VitalBelow extends ActionTemplate {
  constructor(parentQuest, alternatives, vital, pointScale = 1) {
    super(parentQuest);
    this.isTriggerCondition = true;
    this.isAlwaysOnTriggerCondition = true;
    this.alternatives = alternatives; this.vital = vital; this.pointScale = pointScale;
    this.minPoints = 0; this.minPercent = 0;
  }
  get saveShape() { return [['minPoints'], ['minPercent']]; }
  get pattern() { return this.alternatives[0]; }
  test(source) { return matchAlternatives(this.alternatives, source)?.m ?? null; }
  createNew(source, parentQuest) {
    const m = this.test(source);
    if (!m) return null;
    const a = new this.constructor(parentQuest);
    a.minPoints = m.groups?.minPoints != null ? Number(m.groups.minPoints) : 0;
    a.minPercent = m.groups?.minPercent != null ? Number(m.groups.minPercent) : 0;
    return a;
  }
  checkTrigger(_caller) {
    const e = this.parentQuest?.hooks?.playerEntity?.();
    if (!e) return false;
    const current = e[this.vital] ?? 0;
    if (this.minPercent > 0) {
      const max = maxVital(e, this.vital);
      return max > 0 && (current * 100) / max <= this.minPercent;
    }
    if (this.minPoints > 0) return current <= this.minPoints * this.pointScale;
    return false;
  }
}

/** WhenHealthLevel.cs - also Health Quest Actions' `pchealth`/`pchealthp` forms. */
export class WhenHealthLevel extends VitalBelow {
  static typeName = 'WhenHealthLevel';
  constructor(parentQuest) {
    super(parentQuest, Object.freeze([
      /pchealth lower than (?<minPoints>\d+)/,
      /player health is less than (?<minPoints>\d+) pt/,
      /pchealthp lower than (?<minPercent>\d+)/,
      /player health is less than (?<minPercent>\d+)%/,
    ]), 'health');
  }
}
/** WhenMagickaLevel.cs. */
export class WhenMagickaLevel extends VitalBelow {
  static typeName = 'WhenMagickaLevel';
  constructor(parentQuest) {
    super(parentQuest, Object.freeze([
      /player magicka is less than (?<minPoints>\d+) pt/,
      /player magicka is less than (?<minPercent>\d+)%/,
    ]), 'magicka');
  }
}
/** WhenFatigueLevel.cs: points are character-sheet points, the entity's are x64 (FatigueMultiplier). */
export class WhenFatigueLevel extends VitalBelow {
  static typeName = 'WhenFatigueLevel';
  constructor(parentQuest) {
    super(parentQuest, Object.freeze([
      /player fatigue is less than (?<minPoints>\d+) pt/,
      /player fatigue is less than (?<minPercent>\d+)%/,
    ]), 'fatigue', FATIGUE_MULTIPLIER);
  }
}

/** Every QAE action the port answers, for a quest machine to register (the host does, before any save's quests
 *  are restored). The editor's catalog marks the rest as authored-but-unanswered here (vendor/qae/port-support.json). */
export const questActionsExtensionTemplates = () => [
  new RaiseTime(null), new ReducePlayerFatigue(null), new PlayerPossesses(null), new PlayerHandsover(null),
  new ReducePlayerHealth(null), new ReducePlayerMagicka(null),
  new IncreasePlayerHealth(null), new IncreasePlayerFatigue(null), new IncreasePlayerMagicka(null),
  new WhenHealthLevel(null), new WhenMagickaLevel(null), new WhenFatigueLevel(null),
];

// @ts-check
// QL3 (2026-10-19, the owner: "Overhauling quest rewards to be more meaningful with gear, currencies, etc"): WHAT AN
// OUTCOME PAYS - the client's half (bible/06-Systems/Questlines-Arc.md section 5.2). The service's half - silver, embers,
// Weir Keys, titles - is paid only against what the service witnessed (section 5.3, server-account/src/questlines.js);
// nothing here mints an account currency (decision 8).
//
// THE GOLD stays DFU's formula (quest/item.js _createGold), times the outcome's factor - never below OUTCOME_GOLD_MIN
// nor above OUTCOME_GOLD_MAX of what the script minted, and never touching a reward that is not gold.
//
// A PIECE OF GEAR, CHOSEN. An outcome that pays gear offers REWARD_CHOICES pieces - a weapon, a piece of armour and a
// jewel where the player can wear each - at the quest's tier's floor (TIER_FLOORS), and the player keeps one. They are
// made by the game's own makers and laddered by the game's own ladder, as a Dagon's Breach's spoils are (systems/gate/
// gateSpoils.js spoilsBase, systems/loot/lootRarity.js applyRarity - TEST THE SHAPE THE PRODUCER MINTS), so the item law
// and the copy ledger read a quest's piece as any piece. FITTED: never a piece the player's class may not equip
// (equip.js isForbiddenEquip, DFU's own restriction), and a weapon of one of the player's two best weapon skills.
// SEEDED by the quest (rewardSeed), and the three are written into the quest's state the moment they are rolled - a
// reload shows the same three, and a quest pays its choice once (the state's `paid`).
//
// Not a DFU member: DFU's quests pay what their scripts say and nothing more. Port-Ledger A (QL3).
import { seededRng } from '../wind/wind.js';
import { spoilsBase } from '../gate/gateSpoils.js';
import { applyRarity } from '../loot/lootRarity.js';
import { isForbiddenEquip } from '../equip.js';
import { weaponSkillUsed } from '../../characters/weapons.js';
import { SKILLS, skillValue } from '../skills.js';
import { factionsTable } from '../quest/tables.js';
import { PAY_NAMES } from './qlSheets.js';

/** What each pay an outcome names gives: its gold factor, whether it offers a piece, and a step up the tier's ladder. */
export const PAY_PROFILES = Object.freeze({
  standard: Object.freeze({ gold: 1, gear: true, step: 0 }),
  lesser: Object.freeze({ gold: 0.75, gear: true, step: 0 }),     // the merciful way: less coin, more standing (the sheet's)
  greater: Object.freeze({ gold: 1.25, gear: true, step: 1 }),    // the harder way taken
  double: Object.freeze({ gold: 1, gear: true, step: 0 }),        // both sides paid by the script itself - the piece once
  betrayal: Object.freeze({ gold: 1, gear: false, step: 0 }),     // the other side's coin, never the betrayed guild's piece
  own: Object.freeze({ gold: 1, gear: false, step: 0 }),          // the script's own reward is the reward - a Prince's artifact
  none: Object.freeze({ gold: 1, gear: false, step: 0 }),         // a quest that ended unpaid: nothing added
});
/** The bounds of an outcome's gold factor (section 5.2). */
export const OUTCOME_GOLD_MIN = 0.75;
export const OUTCOME_GOLD_MAX = 1.5;
/** How many pieces an outcome that pays gear offers. */
export const REWARD_CHOICES = 3;
/** The tier's ladder (section 5.2): the floor every piece is laddered to, and the share of pieces one rung higher. */
export const TIER_FLOORS = Object.freeze({
  1: Object.freeze({ floor: 'magic', up: 0 }),
  2: Object.freeze({ floor: 'magic', up: 0.25 }),
  3: Object.freeze({ floor: 'rare', up: 0 }),
  4: Object.freeze({ floor: 'rare', up: 0.15 }),
});
const RUNGS = Object.freeze(['magic', 'rare', 'legendary']);
/** The weapon skills a fitted weapon is chosen by (DFU's Skills for the five weapon kinds). */
export const WEAPON_SKILLS = Object.freeze([SKILLS.ShortBlade, SKILLS.LongBlade, SKILLS.Axe, SKILLS.BluntWeapon, SKILLS.Archery]);

if (PAY_NAMES.some((p) => !PAY_PROFILES[p]) || Object.keys(PAY_PROFILES).some((p) => !PAY_NAMES.includes(p))) {
  throw new Error('qlRewards: PAY_PROFILES and qlSheets.PAY_NAMES name different pays');
}

/** The pay an outcome names, read (an unknown name pays nothing extra). */
export const payOf = (outcome) => PAY_PROFILES[outcome?.pay] ?? PAY_PROFILES.none;

/** The gold factor, bounded. */
export const goldFactor = (outcome) => Math.min(OUTCOME_GOLD_MAX, Math.max(OUTCOME_GOLD_MIN, payOf(outcome).gold));

/** Scales a gold reward by the outcome's factor, in place, at least one coin. Answers the count before and after, or
 *  null when the item is not gold (a script's own item reward is never touched). */
export function scaleGold(dfItem, outcome, isGold) {
  if (!dfItem || !isGold) return null;
  const before = Math.max(0, Math.floor(dfItem.stackCount ?? 0));
  const after = Math.max(1, Math.round(before * goldFactor(outcome)));
  dfItem.stackCount = after;
  return { before, after };
}

/** The tier a quest's pieces are laddered at: its own, stepped by the pay, 1 to 4. */
export const rewardTier = (tier, outcome) => Math.min(4, Math.max(1, (tier | 0) + payOf(outcome).step));

/** One piece's rarity at `tier`: the floor, or one rung higher `up` of the time. */
export function pieceRarity(tier, rolls) {
  const t = TIER_FLOORS[Math.min(4, Math.max(1, tier | 0))];
  const i = RUNGS.indexOf(t.floor) + (rolls() < t.up ? 1 : 0);
  return RUNGS[Math.min(RUNGS.length - 1, i)];
}

/** A quest's reward seed: its name, uid and start, hashed (FNV-1a, 32 bits) - the same quest rolls the same three. */
export function rewardSeed(quest) {
  const s = `${quest?.questName ?? ''}|${quest?.uid ?? 0}|${Math.floor(quest?.questStartTime ?? 0)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** The player's two best weapon skills (their live values; ties in DFU's order). */
export function bestWeaponSkills(entity, n = 2) {
  if (!entity) return [...WEAPON_SKILLS];
  return [...WEAPON_SKILLS].map((id, i) => ({ id, i, v: safeSkill(entity, id) }))
    .sort((a, b) => b.v - a.v || a.i - b.i).slice(0, n).map((x) => x.id);
}
const safeSkill = (entity, id) => { try { return Number(skillValue(entity, id)) || 0; } catch { return 0; } };

const KIND_GROUP = Object.freeze({ weapon: 'Weapons', armor: 'Armor', jewel: 'Jewellery' });
const TRIES = 96;

/** Whether `item` fits the player as a piece of `kind`: its group, a class that may equip it, and - a weapon - one of
 *  the player's best weapon skills. */
export function fits(item, kind, entity, skills = bestWeaponSkills(entity)) {
  if (!item || item.group !== KIND_GROUP[kind]) return false;
  if (isForbiddenEquip(entity?.career ?? null, item)) return false;
  if (kind === 'weapon') return skills.includes(weaponSkillUsed(item.templateIndex));
  return true;
}

/**
 * THE CHOICE: REWARD_CHOICES pieces for one quest's outcome - `[{ item, tier, kind }]`, a weapon, a piece of armour and
 * a jewel where each fits the player (a kind that cannot - a class barred from every weapon it rolls - gives its place to
 * another piece of armour or jewel), each laddered at the quest's tier and known. The same seed, level and player answer
 * the same three.
 * @param {{ seed: number, level: number, tier: number, entity?: any }} args
 */
export function rollRewardChoice({ seed, level, tier, entity = null }) {
  const rolls = seededRng(seed >>> 0);
  const lv = Math.max(1, Math.floor(Number(level) || 1));
  const skills = bestWeaponSkills(entity);
  const out = [];
  const draw = (kind) => {
    for (let n = 0; n < TRIES; n++) {
      const item = spoilsBase(lv, rolls);
      if (fits(item, kind, entity, skills)) return item;
    }
    return null;
  };
  for (const kind of ['weapon', 'armor', 'jewel']) {
    let item = draw(kind), k = kind;
    if (!item) { k = out.some((p) => p.kind === 'armor') ? 'jewel' : 'armor'; item = draw(k); }
    if (!item) continue;
    const rarity = pieceRarity(tier, rolls);
    applyRarity(item, rarity, rolls);
    item.isIdentified = true;
    out.push({ item, tier: item.rarity ?? rarity, kind: k });
  }
  return out.slice(0, REWARD_CHOICES);
}

/** A Quests-Factions name's faction id (p2, else p3 - person.js _getCareerFactionID's read), or null. */
export function factionIdOf(name) {
  try {
    const table = factionsTable();
    if (!table.hasValue(name)) return null;
    const p2 = Number.parseInt(table.getValue('p2', name), 10);
    const id = p2 >= 0 ? p2 : Number.parseInt(table.getValue('p3', name), 10);
    return Number.isSafeInteger(id) && id > 0 && id !== 10000 ? id : null;
  } catch { return null; }
}

/** The standing an outcome moves: `[{ factionId, name, amount }]` for each faction it names that the table knows. */
export const standingOf = (outcome) => Object.entries(outcome?.standing ?? {})
  .map(([name, amount]) => ({ factionId: factionIdOf(name), name, amount }))
  .filter((s) => s.factionId != null && Number.isSafeInteger(s.amount) && s.amount !== 0);

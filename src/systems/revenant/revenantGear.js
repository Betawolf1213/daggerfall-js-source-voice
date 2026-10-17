// @ts-check
// RVN-GEAR (2026-10-17, the owner: "Add gear slots to revnants and the ability to customize with gear (Must be balanced)")
// - A SWORN ONE'S KIT. The player gives a sworn revenant pieces from their own pack, slot by slot, and it wears them
// at every stand; taken back, a piece goes to the player's pack again. The law is here, a leaf of the record's shape
// (`companion.gear`: a slot's key -> the item); the acts are the companions' own (systems/revenant/revenantCompanions.js
// giveSwornGear, takeSwornGear) and the page is ui/companionRoster.js.
//
//  - WHO WEARS WHAT. DFU's own law of who carries equipment (combat/enemyEquipment.js equipmentVariantFor - the classes,
//    the orcs and the centaur; ItemHelper.AssignEnemyStartingEquipment) decides who may take a weapon and armour. Every
//    kind may wear a CHARM (a piece of jewellery): a bear wears it on a cord.
//  - A MELEE WEAPON. A foe's archery is its kind's flags (enemyMotor.js hasBowAttack), never its weapon, so a bow in a
//    sworn one's hand would only be swung: the weapon slot takes Dagger to War Axe.
//  - BALANCED BY RANK. A sworn one bears what its rank has earned: the metal (GEAR.METAL_CAP - Silver at rank I up to
//    Daedric at rank V) and the tier (GEAR.RARITY_CAP - Magic at rank I, Rare from rank II, Legendary from rank IV).
//    An artifact, an Aetheric or a Gilded piece answers to the player alone. A broken piece is worn by nobody.
//  - WORN OVER ITS OWN. DEPARTURE from ItemHelper.AssignEnemyStartingEquipment for a sworn one: its stand still rolls its
//    kit as DFU does (scenes/exteriorFoes.js spawnEnemyLoot), and a slot the player filled takes the player's piece in
//    place of the rolled one; its armour is then read again by DFU's own pass over what it wears
//    (EnemyEntity.SetEnemyEquipment - enemyArmorValues: the class clamp at 60, a monster's own hide where it is better),
//    and its rarity's lines fold as a wearer's do (systems/entityMods.js computeEntityMods).
//  - A SHIELD WANTS A ONE-HANDED WEAPON given with it - a rolled two-hander would hold it off - and a two-hander is
//    refused while a shield is worn.
//  - ITS KIT IS INVENTORY: the save's copy says what it wears (revenant.js ensureMirror, as its pack), customs and the
//    realm's walks count it (net/realm/realmGoldLaw.js, systems/item/possessedItems.js), a release hands it back, and a
//    deserter's split weighs it with its pack (revenant.js splitPack).
//  - ITS STRENGTH ON AN ERRAND (systems/revenant/revenantErrands.js): its kit is part of how well it fares - gearPower.

import { EQUIP_SLOTS, getItemHands, ITEM_HANDS, equipTableOf, getEquipSlot } from '../equip.js';
import { WEAPONS } from '../../characters/weapons.js';
import { equipmentVariantFor, enemyArmorValues } from '../../combat/enemyEquipment.js';
import { plateMetal, SHIELD_VALUES } from '../armorMaterials.js';
import { rarityOf } from '../loot/lootRarity.js';
import { computeEntityMods } from '../entityMods.js';
import { t } from '../textManager.js';   // L10N4: the page's words through the text core

/** The slots, in the page's order: `key` the record's, `label` the page's, `slot` the equip table's (a charm's is
 *  whichever jewellery slot the piece takes - null here). */
export const GEAR_SLOTS = Object.freeze([
  Object.freeze({ key: 'weapon', get label() { return t('rvn.gear.slot.weapon', 'Weapon'); }, slot: EQUIP_SLOTS.RightHand }),
  Object.freeze({ key: 'shield', get label() { return t('rvn.gear.slot.shield', 'Shield'); }, slot: EQUIP_SLOTS.LeftHand }),
  Object.freeze({ key: 'head', get label() { return t('rvn.gear.slot.head', 'Helm'); }, slot: EQUIP_SLOTS.Head }),
  Object.freeze({ key: 'rightArm', get label() { return t('rvn.gear.slot.rightArm', 'Right pauldron'); }, slot: EQUIP_SLOTS.RightArm }),
  Object.freeze({ key: 'leftArm', get label() { return t('rvn.gear.slot.leftArm', 'Left pauldron'); }, slot: EQUIP_SLOTS.LeftArm }),
  Object.freeze({ key: 'body', get label() { return t('rvn.gear.slot.body', 'Cuirass'); }, slot: EQUIP_SLOTS.ChestArmor }),
  Object.freeze({ key: 'hands', get label() { return t('rvn.gear.slot.hands', 'Gauntlets'); }, slot: EQUIP_SLOTS.Gloves }),
  Object.freeze({ key: 'legs', get label() { return t('rvn.gear.slot.legs', 'Greaves'); }, slot: EQUIP_SLOTS.LegsArmor }),
  Object.freeze({ key: 'feet', get label() { return t('rvn.gear.slot.feet', 'Boots'); }, slot: EQUIP_SLOTS.Feet }),
  Object.freeze({ key: 'charm', get label() { return t('rvn.gear.slot.charm', 'Charm'); }, slot: null }),
]);
export const GEAR_KEYS = Object.freeze(GEAR_SLOTS.map((s) => s.key));
const KEY_SET = new Set(/** @type {readonly string[]} */ (GEAR_KEYS));
/** An armour piece's equip slot -> its key. */
const KEY_OF_SLOT = new Map(GEAR_SLOTS.filter((s) => s.slot != null).map((s) => [s.slot, s.key]));
/** @type {Map<string, number|null>} */
const SLOT_OF_KEY = new Map(GEAR_SLOTS.map((s) => [s.key, s.slot]));
export const gearLabel = (key) => GEAR_SLOTS.find((s) => s.key === key)?.label ?? key;

/** The balance, every number. METAL_CAP by rank (1-5): the best metal it bears (WeaponMaterialTypes, Iron 0 .. Daedric
 *  9 - a plate piece's metal its low byte, leather and chain none). RARITY_CAP by rank: the best tier (common 0, magic
 *  1, rare 2, legendary 3). POWER: what its kit adds to its strength on an errand - each piece worn, and each by its
 *  tier, at most POWER_MAX (a rank's two). */
export const GEAR = Object.freeze({
  METAL_CAP: Object.freeze([0, 2, 4, 6, 8, 9]),
  RARITY_CAP: Object.freeze([0, 1, 2, 2, 3, 3]),
  POWER_PIECE: 0.2,
  POWER_TIER: Object.freeze([0, 0.15, 0.3, 0.5]),
  POWER_MAX: 2,
});
export const METAL_NAMES = Object.freeze(['Iron', 'Steel', 'Silver', 'Elven', 'Dwarven', 'Mithril', 'Adamantium', 'Ebony', 'Orcish', 'Daedric']);
/** A metal's name (0-9), in the player's language. */
export function metalName(i) {
  switch (i) {
    case 0: return t('rvn.gear.metal.iron', 'Iron');
    case 1: return t('rvn.gear.metal.steel', 'Steel');
    case 2: return t('rvn.gear.metal.silver', 'Silver');
    case 3: return t('rvn.gear.metal.elven', 'Elven');
    case 4: return t('rvn.gear.metal.dwarven', 'Dwarven');
    case 5: return t('rvn.gear.metal.mithril', 'Mithril');
    case 6: return t('rvn.gear.metal.adamantium', 'Adamantium');
    case 7: return t('rvn.gear.metal.ebony', 'Ebony');
    case 8: return t('rvn.gear.metal.orcish', 'Orcish');
    default: return t('rvn.gear.metal.daedric', 'Daedric');
  }
}
const TIERS = Object.freeze(['common', 'magic', 'rare', 'legendary']);
/** A tier's word (0-3), in the player's language. */
export function tierWord(i) {
  if (i <= 0) return t('rvn.gear.tier.common', 'Common');
  if (i === 1) return t('rvn.gear.tier.magic', 'Magic');
  return i === 2 ? t('rvn.gear.tier.rare', 'Rare') : t('rvn.gear.tier.legendary', 'Legendary');
}
const ROMAN = Object.freeze(['', 'I', 'II', 'III', 'IV', 'V']);

/** May its kind take a weapon and armour - DFU's own law of who carries equipment (the classes, the orcs, the centaur)? */
export function armedKind(mobileType) {
  if (!Number.isInteger(mobileType)) return false;
  const isClass = mobileType >= 128;
  return equipmentVariantFor(isClass ? mobileType - 128 : mobileType, isClass, () => 0) !== null;
}
/** A melee weapon (Dagger .. War Axe): what the weapon slot takes. */
export const meleeWeapon = (item) => item?.group === 'Weapons' && Number.isInteger(item.templateIndex) && item.templateIndex >= WEAPONS.Dagger && item.templateIndex <= WEAPONS.War_Axe;
export const needsBothHands = (item) => !!item && item.group === 'Weapons' && getItemHands(item) === ITEM_HANDS.Both;
/** The slot a piece goes to - 'weapon', an armour place, 'charm' - or null for one no sworn one wears. */
export function gearKeyOf(item) {
  if (!item || typeof item !== 'object') return null;
  if (item.group === 'Weapons') return meleeWeapon(item) ? 'weapon' : null;
  if (item.group === 'Jewellery') return 'charm';
  if (item.group !== 'Armor') return null;
  let slot = EQUIP_SLOTS.None;
  try { slot = getEquipSlot({}, item); } catch { slot = EQUIP_SLOTS.None; }
  return KEY_OF_SLOT.get(slot) ?? null;
}
/** A piece's metal (0-9), for the rank's cap: a weapon's material, a plate piece's low byte; leather, chain and jewellery
 *  none (0). */
export function gearMetal(item) {
  if (item?.group === 'Weapons') return Number.isInteger(item.material) ? Math.max(0, Math.min(9, item.material)) : 0;
  if (item?.group === 'Armor') return plateMetal(item.material) ?? 0;
  return 0;
}
/** A piece's tier as the cap reads it (0-3), or 4 for one past Legendary (an artifact, an Aetheric, a Gilded). */
export function gearTier(item) {
  const i = TIERS.indexOf(rarityOf(item));
  return i < 0 ? 4 : i;
}
/** The lowest rank that may bear `item` (1-5), or null for none. */
export function gearRankNeeded(item) {
  const m = gearMetal(item), t = gearTier(item);
  for (let rank = 1; rank <= 5; rank++) if (m <= GEAR.METAL_CAP[rank] && t <= GEAR.RARITY_CAP[rank]) return rank;
  return null;
}

/** WHY `r` (a sworn record) cannot wear `item` now - the page's words - or null: it may. `gear` its kit as it will stand
 *  (the record's, by default). */
export function gearRefusal(r, item, { gear = r?.companion?.gear ?? {}, kindName = null } = {}) {
  if (!r?.sworn) return t('rvn.sworn.gone', 'It is no longer sworn to you.');
  const key = gearKeyOf(item);
  if (!key) return t('rvn.gear.no.use', 'It cannot use that - a melee weapon, armour or a charm.');
  if (item.questItem) return t('rvn.gear.no.quest', 'A quest item stays with you.');
  if ((item.timeForItemToDisappear ?? 0) !== 0) return t('rvn.gear.no.summoned', 'A summoned piece fades in any hand but yours.');
  if (gearTier(item) > 3) return t('rvn.gear.no.yours', 'It answers to you alone.');
  if (key !== 'charm' && !armedKind(r.mobileType)) return t('rvn.gear.no.kind', '{kind} wields no weapon and wears no armour - only a charm.', { kind: kindName ?? t('rvn.gear.itsKind', 'Its kind') });
  if (Number.isFinite(item.currentCondition) && item.currentCondition <= 0) return t('rvn.gear.no.broken', 'It is broken.');
  const rank = Math.max(1, Math.min(5, r.rank | 0));
  const m = gearMetal(item);
  if (m > GEAR.METAL_CAP[rank]) return t('rvn.gear.no.metal', 'It must rise to Rank {rank} to bear {metal}.', { rank: ROMAN[GEAR.METAL_CAP.findIndex((cap, i) => i > 0 && cap >= m)], metal: metalName(m) });
  const tier = gearTier(item);
  if (tier > GEAR.RARITY_CAP[rank]) return t('rvn.gear.no.tier', 'It must rise to Rank {rank} to bear a {tier} piece.', { rank: ROMAN[GEAR.RARITY_CAP.findIndex((cap, i) => i > 0 && cap >= tier)], tier: tierWord(tier) });
  if (key === 'shield' && !gear.weapon) return t('rvn.gear.no.shieldAlone', 'Give it a one-handed weapon first.');
  if (key === 'shield' && needsBothHands(gear.weapon)) return t('rvn.gear.no.shieldTwoHanded', 'Its weapon needs both hands.');
  if (key === 'weapon' && needsBothHands(item) && gear.shield) return t('rvn.gear.no.twoHandedShield', 'Take back its shield first.');
  return null;
}

/** A kit read back (a save, the mirror): the known slots alone, each an item (an object with its template), else gone. */
export function sanitizeGear(g) {
  /** @type {Record<string, any>} */
  const out = {};
  if (!g || typeof g !== 'object') return out;
  for (const key of GEAR_KEYS) {
    const it = g[key];
    if (it && typeof it === 'object' && Number.isInteger(it.templateIndex)) out[key] = it;
  }
  return out;
}
/** Every piece of a kit, in the slots' order - the walks that count what the character owns. */
export const gearItems = (gear) => (gear && typeof gear === 'object' ? GEAR_KEYS.map((k) => gear[k]).filter((it) => it && typeof it === 'object') : []);
export const isGearKey = (k) => typeof k === 'string' && KEY_SET.has(k);

/** What it wears now: each slot's piece that its kind, its rank and its condition allow ([key, item] in the slots'
 *  order) - a piece given at a higher rank stays worn (ranks only rise), a broken one is not. */
export function wornGear(r) {
  const gear = r?.companion?.gear;
  if (!gear || !r?.sworn) return [];
  const armed = armedKind(r.mobileType);
  const out = [];
  for (const key of GEAR_KEYS) {
    const it = gear[key];
    if (!it || typeof it !== 'object') continue;
    if (key !== 'charm' && !armed) continue;
    if (Number.isFinite(it.currentCondition) && it.currentCondition <= 0) continue;
    if (key === 'shield' && (!gear.weapon || needsBothHands(gear.weapon))) continue;
    out.push([key, it]);
  }
  return out;
}
/** Its kit's weight on an errand (systems/revenant/revenantErrands.js): POWER_PIECE a piece and its tier's share, at most
 *  POWER_MAX. */
export function gearPower(r) {
  let p = 0;
  for (const [, it] of wornGear(r)) p += GEAR.POWER_PIECE + GEAR.POWER_TIER[Math.min(3, gearTier(it))];
  return Math.min(GEAR.POWER_MAX, Math.round(p * 1000) / 1000);
}

/** The armour pieces a table wears, as DFU's armour pass reads them (combat/enemyEquipment.js enemyArmorValues). */
function armourPieces(slots) {
  const out = [];
  for (const s of [EQUIP_SLOTS.Head, EQUIP_SLOTS.RightArm, EQUIP_SLOTS.LeftArm, EQUIP_SLOTS.ChestArmor, EQUIP_SLOTS.Gloves, EQUIP_SLOTS.LegsArmor, EQUIP_SLOTS.Feet]) {
    const it = slots[s];
    if (it && Number.isInteger(it.templateIndex)) out.push({ piece: it.templateIndex, item: it });
  }
  const left = slots[EQUIP_SLOTS.LeftHand];
  if (left && SHIELD_VALUES.has(left.templateIndex)) out.push({ piece: left.templateIndex, shield: true });
  return out;
}
/**
 * ITS KIT ON A BODY a place stands for it (`entity` - revenantCompanions.js applySwornStrength, at every stand; and a
 * live body when the page changes its kit): each piece it wears in its slot over the rolled one, a two-hander's left
 * hand freed, its weapon the one it swings; then its armour read again by DFU's pass over what it wears and its pieces'
 * lines folded. `cleared` - slots the player just took back: emptied on the live body (it fights on with what is left
 * until its next stand rolls its own again). Answers how many pieces it wears.
 * @param {any} entity @param {any} r @param {{ cleared?: string[] }} [o]
 */
export function applySwornGear(entity, r, { cleared = [] } = {}) {
  if (!entity || !r) return 0;
  const kit = wornGear(r);
  if (!kit.length && !cleared.length) return 0;   // nothing given: its stand is DFU's, untouched
  const slots = equipTableOf(entity);
  for (const key of cleared) {
    if (key === 'charm') { if (entity._gearCharmSlot != null) slots[entity._gearCharmSlot] = null; entity._gearCharmSlot = null; continue; }
    const s = SLOT_OF_KEY.get(key);
    if (s == null) continue;
    if (key === 'weapon' && entity.weapon === slots[s]) entity.weapon = null;
    slots[s] = null;
  }
  for (const [key, it] of kit) {
    let s = SLOT_OF_KEY.get(key);
    if (key === 'charm') {
      s = entity._gearCharmSlot ?? EQUIP_SLOTS.None;
      if (s === EQUIP_SLOTS.None) { try { s = getEquipSlot(entity, it); } catch { s = EQUIP_SLOTS.None; } }
      if (s == null || s === EQUIP_SLOTS.None) continue;
      entity._gearCharmSlot = s;
    }
    if (s == null) continue;
    if (key === 'weapon') {
      if (needsBothHands(it)) slots[EQUIP_SLOTS.LeftHand] = null;
      entity.weapon = it;
    }
    slots[s] = it;
  }
  entity.armorValues = enemyArmorValues(entity, armourPieces(slots));
  try { computeEntityMods(entity); } catch { /* a fold's fault is not its kit's */ }
  return kit.length;
}

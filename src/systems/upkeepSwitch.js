// STEED1 / WAGONS4 (2026-10-11): THE TWO SWITCHES - horse care (bible/06-Systems/Horse-Care.md) and wagon upkeep
// (bible/06-Systems/Wagon-Upkeep.md), each the port's own departure: the enhanced lane's, a Features row each (World -
// systems/features.js). Wagon upkeep is on by default and forced on online.
//
// HORSE-TIERS (2026-10-15, Mac: "Allow turn off. Rework this system to be more in line with how we handle climates and
// calories boons."): HORSE CARE IS A TIER, as Climates & Calories' is (survival/switch.js) - Off, Boons (the default) or
// Hard, on the same `horseCare` key (systems/horseCareTiers.js is the table and says why), and like every Climates &
// Calories tier it is each player's own online (MODS-ONLINE-3's reading: a tier decides only what THIS player's horse
// pays). `horseCareRules` is THE ONE ACCESSOR: every reader of the tier - the upkeep's keep and breath, the gallop gate,
// the walk, the ride's pace, the HUD's breath bar, the Stable page, the saddle panel, the oats' Use (all through
// systems/upkeepRuntime.js, handed this by the two hosts that ride) and a Stable's prices (scenes/worldModes.js) - asks
// it, and nothing reads the shelf's key beside it.
import { isEnhanced } from './uiSkin.js';
import { getPref } from './uiPrefs.js';
import { horseCareTierOfStored, horseCareRulesForTier } from './horseCareTiers.js';

export const HORSE_CARE_PREF = 'horseCare';
export const WAGON_UPKEEP_PREF = 'wagonUpkeep';
/** HORSE-TIERS: the live tier's rules (horseCareTiers.js HORSE_CARE_RULES) - null for Off, and on any skin but the
 *  enhanced one (the classic skin's horse is DFU's). Read live at every call: the tile's press takes effect at once. */
export const horseCareRules = () => (isEnhanced() ? horseCareRulesForTier(horseCareTierOfStored(getPref(HORSE_CARE_PREF))) : null);
/** Whether wagons wear, break down and are mended. */
export const wagonUpkeepOn = () => isEnhanced() && getPref(WAGON_UPKEEP_PREF) === true;

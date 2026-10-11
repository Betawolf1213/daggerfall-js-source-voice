// STEED1 / WAGONS4 (2026-10-11): THE TWO SWITCHES - horse care (bible/06-Systems/Horse-Care.md) and wagon upkeep
// (bible/06-Systems/Wagon-Upkeep.md), each the port's own departure: the enhanced lane's, a Features row each (World -
// systems/features.js), on by default, and forced on online (every horse and wagon in a room under the one law).
import { isEnhanced } from './uiSkin.js';
import { getPref } from './uiPrefs.js';

export const HORSE_CARE_PREF = 'horseCare';
export const WAGON_UPKEEP_PREF = 'wagonUpkeep';
/** Whether horses are cared for: their stats, breath, hunger and bond. */
export const horseCareOn = () => isEnhanced() && getPref(HORSE_CARE_PREF) === true;
/** Whether wagons wear, break down and are mended. */
export const wagonUpkeepOn = () => isEnhanced() && getPref(WAGON_UPKEEP_PREF) === true;

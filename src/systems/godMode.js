// godMode.js - the ONE gate for "the player takes no damage": POI mode, or a classic save's GodMode cheat flag. Never online.
import { poiOn } from './poiMode.js';
import { isOnlinePage } from './onlineLane.js';

let _save = false;   // the loaded classic save's GodMode cheat flag (saveVarsFile CHEAT_FLAGS.GodMode)

/** A classic import's cheat flag; each import states it afresh (a save without it clears the last one's). */
export const setSaveGodMode = (on) => { _save = !!on; };

/** Is the player invulnerable now? Online never. */
export const isGodMode = ({ online = isOnlinePage() } = {}) => !online && (poiOn() || _save);

/** A drain's amount through the gate: nothing is lost under god mode. */
export const godSpare = (n) => (isGodMode() ? 0 : n);

// systems/quest/qaeStateFlags.js — QAE3 CurrentStateIs: map the twelve named
// flags to a single boolean read. Kept pure and separate so the mapping is
// unit-testable without a live scene; world.js supplies the live facts.
//
// Flag keys match questActionsExtension.js's STATE_FLAG_MAP values.

/** Resolve one CurrentStateIs flag from the player's live state.
 * @param {string} flag — one of the STATE_FLAG_MAP values
 * @param {object} s — live facts, all optional:
 *   { godMode, noClip, noTarget, resting, loitering, readyToLevelUp,
 *     arrested, inPrison, beastForm, vampire, wereboar, werewolf }
 * @returns {boolean}
 */
export function playerStateFlag(flag, s = {}) {
  switch (flag) {
    case 'godMode': return !!s.godMode;
    case 'noClip': return !!s.noClip;
    case 'noTarget': return !!s.noTarget;
    case 'resting': return !!s.resting;
    case 'loitering': return !!s.loitering;
    case 'readyToLevelUp': return !!s.readyToLevelUp;
    case 'arrested': return !!s.arrested;
    case 'inPrison': return !!s.inPrison;
    case 'beastForm': return !!s.beastForm;
    case 'vampire': return !!s.vampire;
    case 'wereboar': return !!s.wereboar;
    case 'werewolf': return !!s.werewolf;
    default: return false;
  }
}

/** Strip a quest symbol's outer underscores: '_aFoe_' -> 'aFoe'.
 *  The port's Symbol.getInnerSymbolName does the same; this is the string
 *  form the QAE regexes capture. */
export function innerSymbolName(sym) {
  return String(sym ?? '').replace(/^_+|_+$/g, '');
}

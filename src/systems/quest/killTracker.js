// systems/quest/killTracker.js — QAE3 KilledEnemiesOfClass: count player kills
// of a foe CLASS (not just a quest-spawned foe), optionally at a place.
//
// Foe.killCount (systems/quest/foe.js) tracks kills of ONE quest spawn. QAE's
// KilledEnemiesOfClass is broader: every enemy of a class the player slays,
// anywhere or at a named place. This tracker is the class-level tally. The
// host calls recordKill when a foe dies at the player's hand; the QAE hook
// reads it. Pure and serializable so the tally survives a save.

let _global = null;
let _placeProvider = null;

/** The host sets this to answer the current location key (for per-place kills). */
export function setKillPlaceProvider(fn) { _placeProvider = typeof fn === 'function' ? fn : null; }

export class KillTracker {
  constructor() {
    this.byClass = new Map();        // foeClass -> count (anywhere)
    this.byClassPlace = new Map();   // `${foeClass}|${place}` -> count
  }

  /** Record one player kill. place defaults to the host's place provider. */
  recordKill(foeClass, place = undefined) {
    if (!foeClass) return;
    if (place === undefined) place = _placeProvider ? _placeProvider() : null;
    this.byClass.set(foeClass, (this.byClass.get(foeClass) ?? 0) + 1);
    if (place) {
      const k = `${foeClass}|${place}`;
      this.byClassPlace.set(k, (this.byClassPlace.get(k) ?? 0) + 1);
    }
  }

  /** Kills of a class; with a place, only kills recorded at that place. */
  killCount(foeClass, place = undefined) {
    if (!foeClass) return 0;
    if (place == null || place === '') return this.byClass.get(foeClass) ?? 0;
    return this.byClassPlace.get(`${foeClass}|${place}`) ?? 0;
  }

  getSaveData() {
    return {
      byClass: [...this.byClass],
      byClassPlace: [...this.byClassPlace],
    };
  }

  restoreSaveData(data) {
    this.byClass = new Map(data?.byClass ?? []);
    this.byClassPlace = new Map(data?.byClassPlace ?? []);
  }

  clear() { this.byClass.clear(); this.byClassPlace.clear(); }
}

/** The one tracker the game uses. */
export function globalKillTracker() {
  return (_global ??= new KillTracker());
}

export function setGlobalKillTracker(t) { _global = t; }

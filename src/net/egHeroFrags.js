// @ts-check
// EG6c (2026-10-12, Mac authors them; bible/11-Multiplayer/Elite-Gates.md section 11.6 - "Authored hero fragments"): THE
// HERO FRAGMENTS' LAW HALVES - the one place a baked fragment's law is registered, read the way the relay reads it. Each is
// the JSON tools/fragBake.mjs writes from a fragment's Blender scene (section 11.5's record, net/egFragLaw.js), imported
// here and held at import to its reader (egFragRecordFault): a record with a fault never reaches a hall. Its mesh half is
// the client's, registered beside it in world/egHeroFragModel.js - the relay has no mesh and never reads one.
//
// THE REFERENCE (`egRefFrag`, variant 'reference') is the port's own stand-in, written by tools/egRefFragScene.mjs and baked
// by tools/bakeEgRefFrag.mjs: it proves the path every hero takes, and NO HALL LAYS IT (egHeroFragLaws leaves it out). Every
// other registered hero is LAID (EG-HERO-LAY, spec law 7 - net/egLaw.js heroHall): in a slot of its kit and class, on the hall's
// own hero die, where it fits. So this module and every law JSON it imports are in the relay's bundle (test/relayversion.test.js
// RELAY_GRAPH): a hero's law half is a relay version; its mesh half is not.
//
// To register one of Mac's: bake it (its own tools/bake<Name>.mjs, the reference's shape), import its law JSON here and add
// it to EG_HERO_FRAGS under its id. Not a DFU member. Ledger A (ELITE-GATES).
import { egFragRecordFault } from './egFragLaw.js';
import EG_REF_FRAG_LAW from '../assets/egfrags/egRefFrag.law.json' with { type: 'json' };

/** The variant of the reference fragment - the stand-in no hall lays. */
export const EG_HERO_REFERENCE = 'reference';

/** A registry of law halves, by id: each held to the reader, frozen - or refused, naming the fragment and its faults. */
export function egHeroFragRegistry(laws) {
  return Object.freeze(Object.fromEntries(laws.map((law) => {
    const faults = egFragRecordFault(law);
    if (faults.length) throw new Error(`net/egHeroFrags.js: ${law?.id}'s law half is refused - ${faults.join('; ')}`);
    return [law.id, Object.freeze(law)];
  })));
}
/** EVERY BAKED FRAGMENT'S LAW HALF, by its id. */
export const EG_HERO_FRAGS = egHeroFragRegistry([EG_REF_FRAG_LAW]);

/** The hero fragments of kit `kit` a hall may lay - every one of that kit registered (in `frags`, the registry by
 *  default) but the reference. */
export const egHeroFragLaws = (kit, frags = EG_HERO_FRAGS) => Object.values(frags).filter((law) => law.kit === kit && law.variant !== EG_HERO_REFERENCE);

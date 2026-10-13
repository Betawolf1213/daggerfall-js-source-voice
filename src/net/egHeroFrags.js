// @ts-check
// EG6c (2026-10-12, Mac authors them; bible/11-Multiplayer/Elite-Gates.md section 11.6 - "Authored hero fragments"): THE
// HERO FRAGMENTS' LAW HALVES - the one place a baked fragment's law is registered, read the way the relay reads it. Each is
// the JSON tools/fragBake.mjs writes from a fragment's Blender scene (section 11.5's record, net/egFragLaw.js), imported
// here and held at import to its reader (egFragRecordFault): a record with a fault never reaches a hall. Its mesh half is
// the client's, registered beside it in world/egHeroFragModel.js - the relay has no mesh and never reads one.
//
// THE REFERENCE (`egRefFrag`, variant 'reference') is the port's own stand-in for Mac's fragments, written by
// tools/egRefFragScene.mjs and baked by tools/bakeEgRefFrag.mjs: it proves the path his take, and NO HALL LAYS IT
// (egHeroFragLaws leaves it out). Laying his fragments into the halls is net/egLaw.js's, when they arrive - its polygon
// fight floors, its sockets joined to the course and its volumes kept EG_FRAG_APART_CM apart; nothing here is in the
// relay's import graph until then.
//
// To register one of Mac's: bake it (its own tools/bake<Name>.mjs, the reference's shape), import its law JSON here and add
// it to EG_HERO_FRAGS under its id. Not a DFU member. Ledger A (ELITE-GATES).
import { egFragRecordFault } from './egFragLaw.js';
import EG_REF_FRAG_LAW from '../assets/egfrags/egRefFrag.law.json' with { type: 'json' };
// EG-HERO (2026-10-13, the owner: "You have to author the fragments"): the Havoc Wellhead's three - the Forge Gut (a
// passage), the Clan Pit and the Oblivion Caverns, deep (chambers) - written by tools/egHero*Scene.mjs, baked by their own
// tools/bakeEgHero*.mjs.
import EG_HERO_FORGE_GUT_LAW from '../assets/egfrags/egheroForgeGut.law.json' with { type: 'json' };
import EG_HERO_CLAN_PIT_LAW from '../assets/egfrags/egheroClanPit.law.json' with { type: 'json' };
import EG_HERO_DEEP_CAVERNS_LAW from '../assets/egfrags/egheroDeepCaverns.law.json' with { type: 'json' };

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
export const EG_HERO_FRAGS = egHeroFragRegistry([EG_REF_FRAG_LAW, EG_HERO_FORGE_GUT_LAW, EG_HERO_CLAN_PIT_LAW, EG_HERO_DEEP_CAVERNS_LAW]);

/** The hero fragments of kit `kit` a hall may lay - every one of that kit registered (in `frags`, the registry by
 *  default) but the reference. */
export const egHeroFragLaws = (kit, frags = EG_HERO_FRAGS) => Object.values(frags).filter((law) => law.kit === kit && law.variant !== EG_HERO_REFERENCE);

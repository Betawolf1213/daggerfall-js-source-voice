// @ts-check
// GRANT2 (2026-10-18, Mac: "Lets build the plan"; bible/11-Multiplayer/Spawn-Grants.md section 12): THE OPEN WORLD'S
// GRANT ASKS - a module the host wires (HOST-SPLIT; scenes/fishHost.js is the shape). While my cell's law is not off (its
// welcome's `gm`, net/online.js), each wanderer group and each camp I stand asks my cell for its grant, so the relay
// measures what honest play asks (GRANT5 sets the buckets and the ceiling from it). GRANT2 builds nothing from the answer:
// the foe stands as it always did - its seed builds the foe and its record carries the grant from GRANT3. Never awaited:
// a stand never waits on the relay. A cell's `off` the session keeps itself (net/online.js), so the host hears nothing.
//
// THE FOUR HOSTS: scenes/world.js wires it (the streamed exterior's encounters and camps). scenes/worldModes.js (the
// interior lane) and scenes/dungeonContext.js (its own lane and its surplus) take their sources' grants with GRANT4;
// scenes/exterior.js (the fixed city) streams nothing and reads no peer.
import { GRANT_ASK_ID_MAX } from '../net/grantLaw.js';

let askId = 0;
/**
 * ASK MY CELL for a grant of `n` members of `kind` (net/grantLaw.js GRANT_KINDS), down `session` - nothing offline, nothing
 * while its law is off (net/online.js sendGrant). Answers `n`, so a stand's own count is the one asked:
 * `for (let k = 0, n = askGrant(online, 'enc', count); k < n; k++)`.
 * @param {any} session @param {string} kind @param {number} n @returns {number}
 */
export function askGrant(session, kind, n) {
  if (session?.sendGrant) {
    askId = askId >= GRANT_ASK_ID_MAX ? 1 : askId + 1;
    session.sendGrant({ k: 'mint', id: askId, kind, n });
  }
  return n;
}

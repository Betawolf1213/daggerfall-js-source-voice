// @ts-check
// GRANT2 (2026-10-18, Mac: "Lets build the plan"; bible/11-Multiplayer/Spawn-Grants.md section 12): THE OPEN WORLD'S
// GRANT ASKS - a module the host wires (HOST-SPLIT; scenes/fishHost.js is the shape). While my cell's law is not off (its
// welcome's `gm`, net/online.js), each random encounter and each camp I stand asks my cell for its grant, so the relay
// measures what honest play asks (GRANT5 sets the buckets and the ceiling from it). GRANT2 builds nothing from the answer:
// the foe stands as it always did - its seed builds the foe and its record carries the grant from GRANT3. Never awaited:
// a stand never waits on the relay.
//
// THE FOUR HOSTS: scenes/world.js wires it (the streamed exterior's encounters and camps). scenes/worldModes.js (the
// interior lane) and scenes/dungeonContext.js (its own lane and its surplus) take their sources' grants with GRANT4;
// scenes/exterior.js (the fixed city) streams nothing and reads no peer.
import { GRANT_ASK_ID_MAX } from '../net/grantLaw.js';

/**
 * @param {{ online: () => any }} deps  `online` the session now (bootWorld's, null offline)
 */
export function createGrantHost({ online }) {
  let id = 0;
  const said = { asked: 0, ok: 0, no: 0, off: 0 };
  return {
    /** Ask my cell for a grant of `n` members of `kind` (net/grantLaw.js GRANT_KINDS) - answers whether the ask went:
     *  online, my cell's law not off, the socket's own bucket (net/online.js sendGrant). */
    ask(kind, n) {
      const s = online();
      if (!s?.sendGrant) return false;
      id = id >= GRANT_ASK_ID_MAX ? 1 : id + 1;
      const went = s.sendGrant({ k: 'mint', id, kind, n });
      if (went) said.asked++;
      return went;
    },
    /** My cell's answer (net/online.js onGrant: ok, no or off), counted. */
    answer(g) {
      if (g?.k === 'ok' || g?.k === 'no' || g?.k === 'off') said[g.k]++;
    },
    /** What was asked and said this session. */
    stats: () => ({ ...said }),
  };
}

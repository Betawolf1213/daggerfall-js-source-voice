// @ts-check
// ═══════════════════════════════════════════════════════════════════
// DOOR-TOKEN (FIELD BUGS 2026-10-16, the Discord: "Friend invisible and
// randomly popping up"; "Partied players popping in and out randomly
// after leaving tombs at graveyard ... also partied players inside tombs
// are invisible for a time") - THE NEXT ROOM'S TOKEN, MINTED AT THE DOOR.
//
// Every place change is a new relay room, and a room's socket asks the
// page's minter for its identity token as it opens (net/online.js
// `_bind`): a token held opens it at once (accountClient.js
// TOKEN_REUSE_MS), anything else is a mint on the wire - seconds for a
// player (FIELD BUGS 29h TOKEN-WAIT), the hello waiting on it, the
// player invisible to the party on both sides of the door. A crypt
// visited longer than the reuse minute paid it on the way in and again
// on the way out (the cell outside is a room the old token already
// opened). So the host says the place change is coming, and the mint
// goes THEN (minter.ahead, which mints only when the token held could
// not open the next room - the next room's own mint, gone early):
//
//   entering()  a door is taking me in (worldModes' onPreTransition) -
//               the mint runs while the building or the dungeon builds;
//               the cell I stand in is remembered as the way back out
//   leaving()   a door is taking me out (onDungeonLeave/onInteriorLeave)
//   jumping()   a fast travel, a teleport, a recall, a respawn - every
//               jump's one primitive (world.js _teleportToPixel), the
//               mint running while the destination streams
//   frame()     the way out approached: inside, back within EXIT_NEAR_M
//               of an exit door after standing EXIT_ARM_M from every one
//               - an exit is a click away, with nothing to build behind
//               it, so the walk to the door is the mint's time
//
// Only online (a session in a room, not terminal, not superseded): an
// offline page mints nothing.
// ═══════════════════════════════════════════════════════════════════
import { isCellRoom } from '../net/wire.js';
import { closestDoorTo } from '../player/enterExit.js';

/** The way out approached: within this of an exit door (m) - two to four seconds of a walk, a run's two, which is most of a
 *  mint on the wire. */
export const EXIT_NEAR_M = 16;
/** And armed again only once the player has stood this far from every exit door (m) - the spawn at a door is no walk to
 *  it, and a player who never leaves the door's side (a shop's counter) is never minted for. */
export const EXIT_ARM_M = 32;

/**
 * @param {object} io
 * @param {() => any} io.minter   the page's identity minter (net/accountClient.js accountTokenMinter)
 * @param {() => any} io.session  the presence session (net/online.js OnlineSession), null offline
 * @param {() => any} [io.modes]  the mode machine (scenes/worldModes.js) - its mode and the live place's exit doors
 * @param {() => any} [io.player] the motor - its `pos`, in the live place's frame
 */
export function createDoorToken({ minter, session, modes = () => null, player = () => null }) {
  /** The open-country cell the way out leads back to: the room a door took me in from. */
  let back = /** @type {string|null} */ (null);
  let armed = false;
  // a seam read before the host has stood it up (a jump during the boot's own load) is none, never a throw
  const read = (/** @type {() => any} */ f) => { try { return f() ?? null; } catch { return null; } };
  const live = () => {
    const s = read(session);
    return s && s.url && s.room && !s.terminal && !s.superseded ? s : null;
  };
  const ahead = (/** @type {string|null} */ room) => {
    if (!live()) return false;
    const m = read(minter);
    return typeof m?.ahead === 'function' ? !!m.ahead(room) : false;
  };
  /** The nearest exit door of the live place, m - Infinity outside, or with none. */
  const exitDistance = () => {
    const md = read(modes), pos = read(player)?.pos;
    if (!md || !pos) return Infinity;
    const doors = md.mode === 'dungeon' ? md.dungeonCtx?.exitDoors : md.mode === 'interior' ? md.interiorCtx?.doors : null;
    if (!doors?.length) return Infinity;
    const near = closestDoorTo(pos, doors);
    return near ? Math.hypot(near.pos[0] - pos[0], near.pos[1] - pos[1], near.pos[2] - pos[2]) : Infinity;
  };
  return {
    /** A door is taking me in. True when a mint went. */
    entering() {
      const s = live();
      if (!s) return false;
      if (isCellRoom(s.room)) back = s.room;
      armed = false;
      return ahead(null);
    },
    /** A door is taking me out, to the cell I came in from. True when a mint went. */
    leaving() {
      armed = false;
      return ahead(back);
    },
    /** A jump to another place. True when a mint went. */
    jumping() {
      back = null;
      armed = false;
      return ahead(null);
    },
    /** Each online frame: the way out approached. True when a mint went. */
    frame() {
      const d = exitDistance();
      if (!(d < Infinity)) { armed = false; return false; }
      if (d > EXIT_ARM_M) { armed = true; return false; }
      if (!armed || d > EXIT_NEAR_M) return false;
      armed = false;
      return ahead(back);
    },
    /** The way back out (null when no door took me in). */
    get back() { return back; },
  };
}

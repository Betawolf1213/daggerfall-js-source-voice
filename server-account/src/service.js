// @ts-check
// ═══════════════════════════════════════════════════════════════════
// AUDIT-ACC F2: WHAT THIS SERVICE IS, SEPARATE FROM ITS ENTRYPOINT.
//
// These four constants lived in `src/index.js` until the audit stood
// the Worker up in a real workerd and it refused to boot:
//
//   Uncaught TypeError: Incorrect type for map entry 'ACCOUNT_VERSION':
//   the provided value is not of type 'function or ExportedHandler'.
//
// IN A MODULE WORKER, EVERY NAMED EXPORT OF THE ENTRYPOINT IS AN
// ENTRYPOINT. workerd reads them as additional handlers - a
// WorkerEntrypoint, a Durable Object, a Workflow - and a plain string
// or Set is not one of those, so it is a hard startup failure rather
// than something ignored. The relay's own `server/src/index.js` is the
// control: it exports `default` and the `Room` Durable Object class,
// both legal, and it has deployed for months.
//
// No node test could see this. The tests IMPORTED those very names, so
// they proved the exports existed while the runtime rejected them for
// existing. The fix is not to hide them - it is to stop the entrypoint
// doubling as a library. The entrypoint answers requests; this file
// says what the service is; both the entrypoint and the tests read it
// from here.
// ═══════════════════════════════════════════════════════════════════

import { busyRead, BUSY_SHED_MS } from '../../src/net/busyLaw.js';   // BUSY-GATE: the reads an overloaded isolate sheds, one law with the client's gate

/** Bumped with every change to this Worker's law, and answered by
 *  /v1/health - the same discipline RELAY_VERSION keeps, for the same
 *  reason: a deploy that did not happen looks exactly like one that
 *  did. Kept in step with ACCOUNT_VERSION in wrangler.toml, which
 *  test/accountworker.test.js holds. */
export const ACCOUNT_VERSION = 'acct139';   // acct139: AUTO-HOLD (2026-10-16; Mac: "I dont want to have to manually review"; bible/06-Systems/Integrity-Arc.md AUTO-HOLD) - a copy locks its piece, never the character, and a contested claim is no strike; the law's third hold is timed (a week, then a month) and lifts on its own; a checkpoint answers the locked pieces' keys; migration 0120

/** A body bigger than this is not a request this service has. Read
 *  BEFORE the JSON is parsed, so a megabyte of nothing costs nothing. */
export const MAX_BODY_BYTES = 4 * 1024;

/** STORM-SHED: THE DATABASE A WRAPPER WRAPS. metrics.js counts a
 *  request's statements through a Proxy made for that request, so what
 *  an isolate keeps beside its database (townSeats.js seatRowsKept) is
 *  keyed by the binding this names - asked of the Proxy, it answers the
 *  binding; the binding has no such member and is its own. */
export const DB_ROOT = Symbol('db-root');

/** GATHER-SPEED / MARKET-SPEED (2026-10-11, Mac: "look at gathering minigame performance and how the server affects it/
 *  slows down, same with the market", then "Do everything. A comprehensive improvement"): READS IN ONE ROUND TRIP. Each
 *  `first()` and `all()` is its own trip from the Worker to the database's primary, and a harvest's answer and a market
 *  read were fifteen to twenty of them in a row - each one the whole distance again, wherever the Worker ran. A batch is
 *  ONE trip, its statements run in order in one transaction (D1's `batch`), so a statement reads what the ones before
 *  it wrote. Answers each statement's rows, in order; nothing asked, nothing sent. */
export async function readAll(/** @type {any} */ db, /** @type {any[]} */ statements) {
  if (!statements.length) return [];
  const out = await db.batch(statements);
  return statements.map((_, i) => out?.[i]?.results ?? []);
}

/** SCALE4f (2026-10-10): WHETHER AN ERROR IS D1 OVERLOADED - the primary's queue full ("D1 DB is overloaded. Requests
 *  queued for too long.", D1's code 7429), which #755's deploy met and the service answered as any other fault: `server`,
 *  500. It is still `server` (every book asks that again, and a new word would be a refusal to eight of them), but 503,
 *  so the metrics count an overload apart from a bug. */
export const d1Overloaded = (/** @type {unknown} */ e) => /overloaded|queued for too long|\b7429\b/i.test(String((/** @type {any} */ (e))?.message ?? e ?? ''));

/** BUSY-GATE (2026-10-13, net/busyLaw.js): THE READS THIS ISOLATE SHEDS, HAVING MET AN OVERLOADED DATABASE. An overload
 *  is the primary's queue full; every read sent into it only lengthens it. So for BUSY_SHED_MS after this isolate meets
 *  one, the reads busyLaw.js names are answered as the overload itself is - `server`, 503, with its Retry-After - and
 *  never asked of the database: the clients from before the gate ask them again on their own schedules, each answer now
 *  costing the database nothing, and the primary drains. Each overload met keeps it open; a moment without one closes
 *  it. The moment the shedding ends (ms) - one an isolate, as the database is one. */
let busyShedUntil = 0;
/** BUSY-GATE: an overload met at `nowMs` - the reads shed for BUSY_SHED_MS from it. */
export function noteOverload(/** @type {number} */ nowMs) { busyShedUntil = Math.max(busyShedUntil, nowMs + BUSY_SHED_MS); }
/** BUSY-GATE: whether this request is a read the isolate sheds at `nowMs`. */
export const shedding = (/** @type {string} */ path, /** @type {string} */ method, /** @type {number} */ nowMs) => busyRead(path, method) && nowMs < busyShedUntil;
/** BUSY-GATE: a stood service is a fresh isolate - nothing shed. */
export function _resetBusyShed() { busyShedUntil = 0; }

/** SCALE4d (2026-10-10, Mac: "we just hit 500 online people. I think its time to scale up our server and improve
 *  performance for more people"): THE ROUTES WHOSE READS A D1 READ REPLICA MAY SERVE. The token's mint is a dozen
 *  reads, and a relay deploy asks it of every player in the same minute: the wave that overloaded the one primary on
 *  2026-10-06 (STORM-SHED). Its writes are the primary's - a stale session's touch, and a region's chapters, written
 *  only over the version they read (npcHalls.js) - and its one read-then-write, the arena's and Iliac Hand's #1 counted
 *  again and stored, runs on the binding (index.js, AUDIT SCALE4d A1). Every other route stays on the binding. */
export const REPLICA_ROUTES = new Map([
  ['/v1/auth/token', 'POST'],
  // SCALE4g (2026-10-10, Mac: "really future proof our archetecture"; bible/11-Multiplayer/Scale-Arc.md SCALE4g): AND THE
  // READS A PLAYER'S TAB KEEPS ASKING, each on the session of the bookmark it carries (d1BookmarkOf) - the heartbeat (the
  // board, the box, the post; its beat a single UPDATE, which a session sends to the primary), the account view, the
  // realm's list, the professions' state and the day's motherlodes (their pick an INSERT OR IGNORE of a pure roll). Their
  // one read-then-store - the arena's and Iliac Hand's #1, counted again where it is stale - runs on the binding wherever
  // it is asked (index.js `honoursCtx`, board.js through `ctx.primary`), as AUDIT SCALE4d A1 put the mint's there.
  ['/v1/heartbeat', 'POST'],
  ['/v1/account', 'GET'],
  ['/v1/realm', 'GET'],
  ['/v1/prof/state', 'POST'],
  ['/v1/prof/motherlodes', 'POST'],
  // DISPLAY-REPLICA (2026-10-13, the account database's primary capped near 150 requests a second from 14:11 UTC and
  // every route waiting on it; bible/11-Multiplayer/Scale-Arc.md DISPLAY-REPLICA): AND THE DISPLAY READS - each of them
  // writes nothing (BUSY-GATE checked them statement by statement; the board's #1 is stored on the doors
  // ARENA_HONOUR_PATHS names, never here) and keeps nothing an isolate shares, so a replica's answer is never an
  // isolate's for another caller (the yards, the layouts and the seats' list keep one, and stay on the binding). With
  // the bookmark a tab carries, every statement a replica's; with none - a page from before this, or the read after a
  // write, which the client forgets its bookmark for (net/accountClient.js `call`, AUDIT SCALE II A-2) - the first, the
  // session's lookup, the primary's, and every one after it a replica's at least as new: the caller's own writes read.
  ['/v1/homes/town', 'POST'],
  ['/v1/homes/mine', 'POST'],
  ['/v1/homes/rooms', 'POST'],
  ['/v1/homes/decor', 'POST'],
  ['/v1/prof/pixels', 'POST'],
  ['/v1/market/vendors', 'POST'],
  ['/v1/marks/balance', 'POST'],
  ['/v1/guilds/invites', 'POST'],
  ['/v1/realm/lineages', 'POST'],
  ['/v1/realm/unions', 'POST'],
  ['/v1/saves', 'GET'],
  ['/v1/arena/board', 'POST'],
]);
/** SCALE4d: where a replica session's FIRST statement goes - the primary. A mint's first statement is the session
 *  lookup, and every statement after it is served by a replica at least as new as that answer (D1's Sessions API: one
 *  session is sequentially consistent), so a mint reads exactly what the primary held when it began. Not
 *  'first-unconstrained': a guest made a moment ago would be refused `auth` by a replica that has not yet seen its
 *  session - which the client takes as final - and a realm character created a moment ago would mint `rc` 0, which the
 *  relay refuses at its door. */
export const REPLICA_CONSTRAINT = 'first-primary';
/** SCALE4g: A D1 BOOKMARK, as D1 writes one (`0000007f-0018eec1-00005100-e64ff3f3...`: a position in the database's log)
 *  or as a client carries one back - anything else is no bookmark, and its request's session starts at the primary. */
export const D1_BOOKMARK_RE = /^[0-9A-Za-z][0-9A-Za-z-]{0,159}$/;
/** SCALE4g: THE BOOKMARK A REQUEST CARRIES (`x-d1-bookmark`, the client's newest under its session secret), or null. */
export function d1BookmarkOf(/** @type {Request} */ request) {
  const b = request?.headers?.get?.('x-d1-bookmark') ?? null;
  return typeof b === 'string' && D1_BOOKMARK_RE.test(b) ? b : null;
}

/** AUDIT SCALE II A-1 (2026-10-11, the audit of SCALE4d-SCALE5d; Mac: "Lets do an audit on everything. Ensure
 *  perfection"): THE MINT STARTS AT THE PRIMARY, WHATEVER BOOKMARK IT CARRIES - SCALE4d's guarantee (REPLICA_CONSTRAINT),
 *  which SCALE4g's bookmark had undone. A bookmark is a position the tab has SEEN, and no write route answers one: a
 *  realm join, a create, a leave, another tab's join that took the lease (INT9) - none of them moves it. So a mint
 *  started from it could read a replica from before the tab's own join and sign `rc` 0 (the relay's door word, which
 *  the client takes as final), or a lease since moved still `rc` 1 for the character another tab now plays. The mint's
 *  first statement, the session lookup, is the primary's, and every read after it at least that new. */
export const PRIMARY_FIRST_ROUTES = new Set(['/v1/auth/token']);

/** SCALE4g: THE DATABASE A REQUEST RUNS ON - a D1 session for a route and method REPLICA_ROUTES names, started from the
 *  bookmark the request carries (every read at least as new as that position: the caller's own last writes, read back)
 *  or at the primary for a request that carries none; the binding itself for every other route. A bookmark D1 will not
 *  take starts at the primary instead, and the mint's always does (PRIMARY_FIRST_ROUTES, AUDIT SCALE II A-1). */
export function routeDb(/** @type {any} */ db, /** @type {string} */ path, /** @type {string} */ method, /** @type {string|null} */ bookmark = null) {
  if (REPLICA_ROUTES.get(path) !== method) return db;
  if (bookmark && !PRIMARY_FIRST_ROUTES.has(path)) { try { return replicaDb(db, bookmark); } catch { /* a bookmark D1 refuses: the primary, below */ } }
  return replicaDb(db);
}

/** SCALE4d: the binding as one D1 session (`withSession`) - every statement counted where the binding's are
 *  (metrics.js countedDb opens the session through itself), and DB_ROOT the binding the session came from, so what an
 *  isolate keeps beside its database stays one store for every request. A binding with no sessions (an older runtime, a
 *  harness's fake) is answered as it stands: the primary, as before. A write in a session goes to the primary - a
 *  replica takes none - and the session's later reads see it. Until the database's read replication is turned on
 *  (account-deploy.yml) every statement of a session is the primary's anyway. */
export function replicaDb(/** @type {any} */ db, constraint = REPLICA_CONSTRAINT) {
  const open = db?.withSession;
  if (typeof open !== 'function') return db;
  const root = db[DB_ROOT] ?? db;
  const session = open.call(db, constraint);
  return new Proxy(session, {
    get(target, key) {
      if (key === DB_ROOT) return root;
      const v = Reflect.get(target, key);
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
}

/** ═══ ACC2: THE SAVE ROUTES, AND WHY THEY ARE NOT IN `ROUTES` ══════
 *
 * Every route above is a fixed string, so a Set answers "does this
 * exist?". A save route carries the character and the slot in the path,
 * so it needs a match rather than a lookup - and the match lives here,
 * pure, beside the Set, because `index.js` asks BOTH before it decides
 * a path is a 404.
 *
 * `/v1/saves/<characterId>/<saveName>[/data|/shot]`, with both segments
 * percent-encoded by the caller: a save name is the player's own words
 * ("before the lich"), so it may hold a space, a slash or a hash, and
 * pasting it into a path unencoded is how one slot comes to address
 * another.
 *
 * It returns null for anything it is not sure of. A name that decodes
 * to nothing, one past SAVE_NAME_MAX, an id that is not id-shaped and a
 * tail that is not one of the two known parts are all "no such route"
 * rather than a request this service half-understands.
 */
export const SAVE_NAME_MAX = 64;
/** Both shapes `systems/characterId.js` mints - a `crypto.randomUUID()`
 *  where the runtime has one, and `<base36 stamp>-<10 random>` on an old
 *  WebView where it does not. A pin drives that minter and asserts every
 *  id it produces passes this. DELIBERATELY NOT `net/wire.js` ID_RE:
 *  that is the shape of a PEER id, which is a different thing that
 *  happens to look similar, and reusing it would tie a save's filing to
 *  a bound the online arc is free to move. */
export const CHAR_ID_RE = /^[A-Za-z0-9_-]{4,64}$/;
export const SAVE_PARTS = Object.freeze(['data', 'shot']);

export function savePathOf(path) {
  if (typeof path !== 'string' || !path.startsWith('/v1/saves/')) return null;
  const rest = path.slice('/v1/saves/'.length);
  if (!rest) return null;
  const seg = rest.split('/');
  if (seg.length < 2 || seg.length > 3) return null;
  const part = seg.length === 3 ? seg[2] : null;
  if (part !== null && !SAVE_PARTS.includes(part)) return null;
  let characterId, saveName;
  try { characterId = decodeURIComponent(seg[0]); saveName = decodeURIComponent(seg[1]); }
  catch { return null; }   // a malformed escape is not a slot
  if (!CHAR_ID_RE.test(characterId)) return null;
  // A NAME IS BOUNDED AND PRINTABLE. The store's own cards carry
  // whatever the player typed, and this is the one door where that
  // string becomes part of a key somebody else's row also lives under.
  if (!saveName || saveName.length > SAVE_NAME_MAX || /[\u0000-\u001f\u007f]/.test(saveName)) return null;
  return { characterId, saveName, part };
}

/** The R2 key. PLAYER FIRST, so "everything this account holds" is a
 *  prefix walk rather than a join against D1 - which is what makes a
 *  deleted account cleanable at all. Every segment is encoded, for the
 *  reason `savePathOf` decodes: a save name is player-typed. */
export const savePrefix = (playerId) => `saves/${encodeURIComponent(playerId)}/`;
export const saveKey = (playerId, characterId, saveName, part) =>
  `${savePrefix(playerId)}${encodeURIComponent(characterId)}/${encodeURIComponent(saveName)}/${part}`;

/** THE BOUNDS. `MAX_BODY_BYTES` above is 4 KiB and is right for every
 *  JSON route this service has; a save is hundreds of kilobytes, so the
 *  blob routes read a RAW body against these instead. Named here rather
 *  than written into the ladder, because a bound nobody can find is a
 *  bound somebody raises by accident. */
export const SAVE_MAX_BYTES = 4 * 1024 * 1024;

/** RESTORE (2026-09-29): the switch the history restore throws for its minute - MAINTENANCE = "1", a var only its own
 *  deploy sets (.github/workflows/realm-restore.yml); every call but /v1/health and /v1/pubkey is then refused 503. */
export const maintaining = (/** @type {any} */ env) => env?.MAINTENANCE === '1';
export const SHOT_MAX_BYTES = 256 * 1024;
/** Slots per ACCOUNT. An account at this bound is refused; its oldest
 *  slot is never taken to make room, because this is a BACKUP and a
 *  backup that deletes things to make room is not one. */
export const SAVES_MAX = 60;

/** Every path this service serves. Named once, so the 404 and the
 *  ladder cannot come to disagree about what exists. */
export const ROUTES = new Set([
  '/v1/health', '/v1/pubkey', '/v1/auth/guest', '/v1/auth/token', '/v1/auth/session',
  '/v1/account', '/v1/auth/logout',
  // ACC1c: username and password. `register` needs a session (it
  // upgrades the guest row that session belongs to); `login` and
  // `recover` are the two that do NOT, because a player standing at
  // them has no session yet - which is exactly why they are the two
  // that are throttled.
  '/v1/auth/register', '/v1/auth/login', '/v1/auth/recover',
  '/v1/account/password', '/v1/account/email',
  // RECOVERY-SET: a new set of recovery codes, behind the password (accounts.js newRecoveryCodes)
  '/v1/account/recovery-codes',
  // ACC3: the one WRITE in the wardrobe. Holding a title is derived
  // and nothing can equip a glyph, so this is the only thing about
  // either that a player chooses - and so the only route.
  '/v1/account/title',
  // WB9g: the Broker's insignia - a title and an aura BOUGHT (a sale recorded, the account's closed gates paying),
  // and the one other thing about the wardrobe a player chooses: the aura worn.
  '/v1/account/insignia', '/v1/account/aura',
  // GLYPH-WEAR: a glyph shown or hidden - paint alone, the rights that ride one untouched.
  '/v1/account/glyph',
  // NAME-AS: which name the room reads - the account's, or the character's the mint is for (accounts.js chooseNameAs).
  '/v1/account/name',
  // ACC4: the beat that counts time played. It writes, and it is the
  // service's clock that decides how much - the body is never read.
  '/v1/account/played',
  // SCALE4c: ONE HEARTBEAT - the beat, a look at the letterbox and a
  // town's board in one request, each part answered as its own route
  // answers it (heartbeat.js). Behind a session like the three.
  '/v1/heartbeat',
  // MOD1: the one moderation route. Behind a session like every other,
  // and it refuses anybody the service's own lists do not name.
  '/v1/mod/mute',
  // CUSTOMS-PASS: a developer grants one account one character through
  // customs - the same wall, the developers' list alone.
  '/v1/mod/customs-pass',
  // INT6: the review of the judge's verdicts - the same wall, the developers' list alone (review.js)
  '/v1/mod/realm-holds',
  '/v1/mod/realm-findings',
  '/v1/mod/realm-clear',
  '/v1/mod/realm-hold',
  '/v1/mod/realm-rollback',
  '/v1/mod/realm-budget',
  '/v1/mod/realm-bodies',   // INT14: the boss fights' count, measured (review.js bodiesMeasure)
  '/v1/mod/realm-gains',    // HACKED-GOLD: who gained past the bucket (review.js gainsMeasure)
  '/v1/mod/realm-trades',   // HACKED-GOLD: a character's realm trades, whom it traded with (review.js tradesOf)
  '/v1/mod/realm-characters',   // SUMMON-REPAIR: an account's realm characters by handle (review.js)
  '/v1/mod/realm-repair',       // SUMMON-REPAIR: one character mended by staff, once a ticket (review.js repairAct)
  // ACC2: the LISTING is a fixed path; every other save route carries
  // the slot in it and is matched by `savePathOf`.
  '/v1/saves',
  // MAIL1: letters to a registered player, kept until their reader
  // throws them away. The box is a GET; the three that change something
  // are POSTs, each naming the letter in its body - never in the path,
  // so an id is never a URL a log keeps.
  '/v1/mail/inbox', '/v1/mail/send', '/v1/mail/read', '/v1/mail/delete',
  // SERVER-POST: the developers' pieces to one registered account - the box a GET, the three that change something POSTs,
  // each naming the piece in its body; a claim names the realm character it goes into and where its record stands.
  '/v1/post/box', '/v1/post/read', '/v1/post/claim', '/v1/post/delete',
  // DUEL1: the duelling record - the loser's own report (INT8: retired,
  // answered `retired`), and any account's two counts for the Inspect
  // card; INT8: a duel's result, the relay's receipt claimed. All behind
  // a session.
  '/v1/duel/loss', '/v1/duel/record', '/v1/duel/claim',
  // INT9: a death in the open zone's drop, taken off the fallen's record against the relay's fall (or none, a foe's);
  // MAC (2026-10-14): its killer's piece in escrow - collected by the killer, taken back by the fallen, listed for it
  '/v1/wild/fall', '/v1/wild/collect', '/v1/wild/reclaim', '/v1/wild/escrows',
  // RENOWN1: Renown - what one of the caller's characters earned
  // online (the account's for a day under RENOWN-ACCOUNT; the
  // character's again since RENOWN-CHAR). Behind a session; the level
  // itself rides the token.
  '/v1/renown/xp',
  // FIRM1: the Firmament - a character's passive tree, read and changed whole (firmament.js)
  '/v1/firmament/state', '/v1/firmament/set', '/v1/firmament/respec',
  // CHAP1: the Roll - a realm character's standing with Daggerfall's guilds, read (seeded once) and claimed under the
  // playing tab's lease (npcRoll.js). Behind a session and CHAPTERS_OPEN.
  '/v1/chapters/roll', '/v1/chapters/claim',
  // CHAP2a: a town's guild halls witnessed - a registered account a week old (npcHalls.js); AUDIT CHAP2 E1: a region's
  // audit list and a false town struck, a developer's
  '/v1/chapters/witness', '/v1/chapters/halls', '/v1/chapters/strike', '/v1/chapters/list', '/v1/chapters/focus', '/v1/chapters/history',
  '/v1/chapters/back',   // CHAP6b: a member's backing in its chapter's Season
  '/v1/chapters/patron',   // CHAP7a: a guild's bid for a chapter's patronage
  // HOME1: the online homes - one owner a building (homes.js). A town's
  // homes are read by every session, a guest's too (the doors say whose
  // a home is to everyone); the three that change one are an account's.
  '/v1/homes/town', '/v1/homes/mine', '/v1/homes/claim', '/v1/homes/release', '/v1/homes/entry',
  // DECOR1: an online home's decor (decor.js). Its pieces are read by every session (the room is the same room to
  // every visitor); the three that change one are its owner's.
  '/v1/homes/decor', '/v1/homes/decor/place', '/v1/homes/decor/move', '/v1/homes/decor/remove',
  // BASE-HIDE: what the owner took out of the room's own furniture - read with the pieces, written by the owner
  '/v1/homes/decor/hidden',
  // HOME-RENT: a home's rooms (rent.js) - read by every session at its door; offered and withdrawn by its owner, rented by
  // another player's realm character, the rent collected by the owner
  '/v1/homes/rooms', '/v1/homes/rooms/offer', '/v1/homes/rooms/withdraw', '/v1/homes/rooms/rent', '/v1/homes/rooms/collect',
  // HOME-LOOK: how a home looks outside (homes.js setHomeLook) - read with the town's homes, written by its owner
  '/v1/homes/look',
  // HOME-VOTE: a registered account's word on another's home (homeVotes.js) - read with the town's homes
  '/v1/homes/vote',
  // HOME-YARD: every yard of a town (decor.js yardsOf) - read by anyone, before a session (YARD-SHED, decor.js yardsKept);
  // its pieces written through the decor routes (`yard`), by the home's owner
  '/v1/homes/yards',
  // WD3: every town that holds a home and the layout it keeps (homes.js homeLayouts) - read by every session at its
  // online boot, so the room stands each such town as its homes were bought in it
  '/v1/homes/layouts',
  // ARENA4b: a home the arena displaced (homes.js arenaMoveHome) - moved by its owner's client to the house it picked, the
  // moves its character has not read, and one read
  '/v1/homes/arena-move', '/v1/homes/arena-moves', '/v1/homes/arena-seen',
  // FIELD BUGS 2026-10-04d KNIGHT-HOUSE: a deed the realm gave held off its character's record (homes.js holdDeed) - an
  // account's alone
  '/v1/homes/deed',
  // PERMADEATH-HOUSES: a fallen realm character's home taken up by the living realm character of its line who carries it
  // on (homes.js inheritHome) - an account's alone
  '/v1/homes/inherit',
  // GUILD1: the guilds (guilds.js) - a character's own guild and the account's invitations read by any session (a
  // guest's reads nothing); the rest change one, an account's alone.
  '/v1/guilds/mine', '/v1/guilds/invites', '/v1/guilds/found', '/v1/guilds/invite', '/v1/guilds/answer', '/v1/guilds/leave',
  '/v1/guilds/remove', '/v1/guilds/rank', '/v1/guilds/ranks', '/v1/guilds/deposit', '/v1/guilds/withdraw', '/v1/guilds/handover',
  '/v1/guilds/disband',
  // GUILD1d: the guild hall (halls.js) - bought and sold from the treasury by the guildmaster, who may walk in set by an
  // Officer; and the heraldry, the guildmaster's
  '/v1/guilds/hall/buy', '/v1/guilds/hall/sell', '/v1/guilds/hall/entry', '/v1/guilds/heraldry',
  // GUILD1e: a guild's own board (guildBoard.js) - read, pinned to and taken down by its members
  '/v1/guilds/board', '/v1/guilds/board/pin', '/v1/guilds/board/take-down',
  // GUILD2 (bible/11-Multiplayer/Guild-Overhaul.md): a new name for a price (guilds.js), and the vault - read, a piece put
  // in and taken out on the realm record, the guildmaster's grants (guildVault.js)
  '/v1/guilds/rename', '/v1/guilds/vault', '/v1/guilds/vault/put', '/v1/guilds/vault/take', '/v1/guilds/vault/grant',
  // SEAT1a: the seats' witnessed registry (townSeats.js) - the confirmed seats, a seat witnessed, a developer's strike
  '/v1/seats/list', '/v1/seats/witness', '/v1/seats/strike',
  // SEAT1b: influence (seatInfluence.js) - a guild's pledge, a seat's standings, the Watch's receipts, Tribute
  '/v1/seats/pledge', '/v1/seats/standings', '/v1/seats/records', '/v1/seats/watch', '/v1/seats/tribute',
  // SEAT1c: the Turning settles on any seat read (seatTurning.js); a Charter relinquished by its guildmaster
  '/v1/seats/relinquish',
  // SEAT1d: the holder's levers (seatHolding.js) - the Tithe, the coming week's Edict; a Bounty's camp claimed
  '/v1/seats/tithe', '/v1/seats/edict', '/v1/seats/bounty',
  // SEAT2a: the battles' week (seatBattles.js) - the holder's window, a side signed and unsigned, a Sellsword hired and withdrawn
  '/v1/seats/window', '/v1/seats/siege/sign', '/v1/seats/siege/unsign', '/v1/seats/siege/hire', '/v1/seats/siege/withdraw',
  // SEAT2a part three (seatSiege.js): a battle's pass, a fighter's receipt claimed; the deploy blackout's public question
  '/v1/seats/siege/pass', '/v1/seats/siege/claim', '/v1/seats/sieges/live',
  // VOID (Seats-Arc 18; seatSiege.js voidSiege): a moderator's `/siege void <key>` - the seat's battle this week void
  '/v1/seats/siege/void',
  // CROWN1 part two (seatRoyal.js): a Royal Tourney's pass, a bout's receipt claimed
  '/v1/seats/royal/pass', '/v1/seats/royal/claim',
  // CROWN2 (seatPolitics.js): fealty and Pacts
  '/v1/seats/fealty', '/v1/seats/fealty/accept', '/v1/seats/fealty/break', '/v1/seats/pact', '/v1/seats/pact/break',
  // SEASON1 part two (seatInfluence.js): an Orc Raid's camp cleared
  '/v1/seats/orc-camp',
  // SEAT2b (seatForts.js): a seat's fortifications read, a project begun
  '/v1/seats/forts', '/v1/seats/fort/fund',
  // WB5b: the gates closed - the kill receipt the relay signed, carried
  // here by the account it names. Behind a session.
  '/v1/gate/claim',
  // RAID4: the towns defended - a raid's receipt the relay signed, carried
  // here by the account it names with the character that fought it.
  '/v1/raid/claim',
  '/v1/serpent/claim',   // SERPENT1: a sea serpent's receipt
  '/v1/sd/claim',   // SD9b: a Brass Remnant's receipt - an Hour broken, and its grants on the first write
  '/v1/lamp/claim',   // LAMP-KEEPER II: a lamp keeper spoken to - I Love Lamp laid on the row once (AUDIT FIVE-ASKS A1: it was never listed, so every claim was a 404)
  // MARKS1: Marks (marks.js) - an account's balance, the Bank's exchange (Marks for gold, never the other way), a
  // guild's Marks treasury, and the developers' weekly report. Every one behind a session, an account's alone.
  // SILVER-FINDS: and a loot find (the service's dice, the day's count).
  '/v1/marks/balance', '/v1/marks/exchange', '/v1/marks/find', '/v1/marks/guild/deposit', '/v1/marks/guild/withdraw', '/v1/marks/report',
  '/v1/board/read', '/v1/board/pin', '/v1/board/take-down', '/v1/board/report', '/v1/board/mod/remove', '/v1/board/mod/restore',
  '/v1/board/notice', '/v1/board/notice/remove',
  // PROF1: the professions (professions.js) - a character's tracks, Stores and day, the witnessed pixels, a harvest,
  // a specialisation, a withdrawal to the pack, a region's Court writs and a delivery. Every one behind a session, a
  // registered account's alone, and PROFESSIONS_OPEN's.
  '/v1/prof/state', '/v1/prof/pixels', '/v1/prof/harvest', '/v1/prof/spec', '/v1/prof/smelt', '/v1/prof/craft', '/v1/prof/stock', '/v1/stores/withdraw', '/v1/writs/list', '/v1/writs/deliver',
  // PROF12: the alchemy station's brew and an enchanting station's disenchant (alchemy.js) - the same doors
  '/v1/prof/brew', '/v1/prof/disenchant',
  // CRAFT4: a temper (professions.js) and an Enchanter's Reforge with Essence (alchemy.js) - the same doors
  '/v1/prof/temper', '/v1/prof/reforge',
  // BAG1: a deposit - carried units into the Stores (professions.js depositStores), the same door
  '/v1/stores/deposit',
  // PROF2b: today's Motherlodes (a strike rides /v1/prof/harvest, its node naming it)
  '/v1/prof/motherlodes',
  // PROF6: guild writs (posted, supplied, withdrawn, the Officers' budget), commissions (posted, fulfilled, cancelled,
  // declined) and the guild Stores (read, deposit, withdraw) - writs.js; behind a session, a registered account's alone.
  '/v1/writs/post', '/v1/writs/supply', '/v1/writs/withdraw', '/v1/writs/budget', '/v1/writs/commission', '/v1/writs/fulfil',
  '/v1/writs/cancel', '/v1/writs/decline', '/v1/stores/guild', '/v1/stores/guild-deposit', '/v1/stores/guild-withdraw',
  // SILVER-WAYS: a guild contract posted and withdrawn (contracts.js); its pay rides a raid's claim
  '/v1/writs/contract', '/v1/writs/contract-withdraw',
  // PROF5: the market (market.js) - the Market tab's views, a listing, a purchase, a cancel, a buy order, a fill, an
  // order withdrawn, a piece collected, a report and a moderator's removal. Every one behind a session, a registered
  // account's alone, and the board's, the professions' and the Marks' switches together. PROF5b: an auction posted, a bid.
  // GOLD-MARKET: a realm character's gold its sales hold, collected into its record.
  '/v1/market/read', '/v1/market/list', '/v1/market/buy', '/v1/market/cancel', '/v1/market/order', '/v1/market/fill',
  '/v1/market/unorder', '/v1/market/collect', '/v1/market/report', '/v1/market/remove', '/v1/market/auction', '/v1/market/bid',
  '/v1/market/gold',
  '/v1/cards/stake',   // CARDS6: a card table's stake held against the realm record
  '/v1/cards/cashout',   // CARDS6: the relay's cash-out receipt paid back into it
  '/v1/cards/deck',   // CARDS10: a ranked seat's deck vouched for (iliac.js deckOrderOf)
  '/v1/iliac/claim', '/v1/iliac/board',   // CARDS10: Iliac Hand's season board
  '/v1/gambit/claim', '/v1/gambit/board',   // KG6: The King's Gambit's season board
  // HOME-VENDOR: a home's trader's stock, and the region's traders
  '/v1/market/vendor', '/v1/market/vendors', '/v1/market/myvendors',
  // REALM P1: the realm's characters (realm.js). The listing and the five that change one; the save itself rides a
  // path that names the character, matched by `realmPathOf`.
  '/v1/realm', '/v1/realm/create', '/v1/realm/customs', '/v1/realm/join', '/v1/realm/leave', '/v1/realm/delete',
  // REALM P2.1: a trade's half (realmTrade.js) - settled here, both records at once or neither.
  '/v1/realm/trade',
  // HOUSE-LOSS: the door's undo of a customs whose first save never landed (realm.js undoRealm) - its own path, so a
  // door newer than this service is told `not-found`, never handed a delete.
  '/v1/realm/undo',
  // LEGACY7: Project Legacy's lines (legacy.js) - listed, written past their rev - and a fallen character's tombstone
  '/v1/realm/lineages', '/v1/realm/lineage', '/v1/realm/die',
  // LEGACY7 part three: a half of one wedding between two players' characters, and the account's unions
  '/v1/realm/wed', '/v1/realm/unions',
  // PATREON-LINK: a patron's own Patreon, linked (patreon.js) - Patreon sends the player back to the callback, the
  // confirm is their yes, the webhook is Patreon's word on a member; the unlink is the account's, behind a session.
  '/v1/patreon/callback', '/v1/patreon/confirm', '/v1/patreon/webhook', '/v1/patreon/unlink',
  // ARENA4: the arena (arena.js) - a bout's receipt the relay signed, carried here by an account it names; the boards,
  // counted from the rows; a banner joined or quit. Every one behind a session; a guest reads the boards and keeps nothing.
  '/v1/arena/claim', '/v1/arena/board', '/v1/arena/team',
  // AUDIT ARENA-LADDER: a ladder attempt's ticket (arena.js arenaAttempt), behind a session
  '/v1/arena/attempt',
]);

/** REALM P1: `/v1/realm/<id>/data` - a realm character's save, PUT as a checkpoint and GET for a join's load or a copy
 *  to offline. The id is the service's own shape (realm.js REALM_ID_RE); anything else is no route. */
export function realmPathOf(path) {
  const m = typeof path === 'string' ? /^\/v1\/realm\/(r[0-9a-f]{20})\/data$/.exec(path) : null;
  return m ? { id: m[1] } : null;
}

/**
 * POI-1 (2026-10-14; server-account/src/poi.js): THE POI STORE'S PATHS - `{ route, sha?, id? }`, or null for a path that
 * is not one. Matched as a save slot is, so the 404 knows them: `live` and an asset's GET are read without a session (a
 * live asset; a draft's needs a builder's), the rest behind one.
 *   GET /v1/poi/live | GET /v1/poi/asset/<sha> | PUT /v1/poi/asset/<sha>?kind=mesh|texture
 *   GET /v1/poi/me | /v1/poi/list | /v1/poi/queue | /v1/poi/doc/<id>
 *   PUT /v1/poi/draft { doc, base } | POST /v1/poi/{submit,withdraw,retire,review,rollback}
 * @param {string} path
 */
export function poiPathOf(path) {
  if (typeof path !== 'string' || !path.startsWith('/v1/poi/')) return null;
  const rest = path.slice('/v1/poi/'.length);
  if (['live', 'me', 'list', 'queue', 'draft', 'submit', 'withdraw', 'retire', 'review', 'rollback', 'shelf', 'unshelve'].includes(rest)) return { route: rest };
  let m = /^asset\/([0-9a-f]{64})$/.exec(rest);
  if (m) return { route: 'asset', sha: m[1] };
  m = /^doc\/(poi-[0-9a-f]{12})$/.exec(rest);
  if (m) return { route: 'doc', id: m[1] };
  m = /^shelf\/(lib-[0-9a-f]{12})$/.exec(rest);   // POI-4b: one library entry
  if (m) return { route: 'shelf', id: m[1] };
  return null;
}

/** The routes a caller reaches WITHOUT a credential. Everything else
 *  resolves a session first. Named rather than special-cased inside the
 *  ladder, so "what can a stranger reach?" has one answer. */
export const OPEN_ROUTES = new Set(['/v1/health', '/v1/auth/guest', '/v1/auth/login', '/v1/auth/recover']);

/** PATREON-LINK: the three a stranger reaches that are NOT the JSON ladder's - a browser carrying Patreon's code back
 *  (a GET, answered with a page), the page's yes (a form), and Patreon's own webhook. Each proves itself with what it
 *  carries - a state or a ticket this service signed, a signature under the webhook's secret - never a session. */
export const PATREON_OPEN_ROUTES = new Set(['/v1/patreon/callback', '/v1/patreon/confirm', '/v1/patreon/webhook']);

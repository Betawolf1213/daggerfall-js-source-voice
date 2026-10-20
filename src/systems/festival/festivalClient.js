// @ts-check
// WITCH1 (2026-10-20, bible/06-Systems/Witches-Festival.md): THE WITCHES' FESTIVAL, AS THIS PAGE PLAYS IT - the one home
// of the client's half of the economy: the Soul Cakes this account holds (the service's count, the pack's stack its face),
// the finds a kill and an act ask for, the Wyrd Sister's sales, and the moves on a Hearth Offering.
//
// THE SERVICE DECIDES, THIS PAGE ASKS (net/festivalLaw.js; server-account/src/festival.js). A kill of mine, an act of
// mine (systems/questlines/qlActs.js, every act a feature says), a quest of mine done and a bounty paid each ask for a
// find by its source; the service's die decides it and caps the day. A find on a body is thrown onto it (as a Weir Key's
// is - systems/eliteGates/egFind.js) and the pack restacked to the count less it, so the body's cakes taken up make the
// pack the count; any other find lands in the pack. Asks run one after another (a fight's kills, in order), never dropped.
//
// A SALE IS ASKED BY ITS OWN ID and kept on the character's save until its answer lands (`pending`, systems/
// modSaveData.js), so an answer lost to a closed tab is asked again by the same id at the next refresh - the service
// answers `repeat` with the ware it sold, and the ware is minted then, once.
//
// HOSTS: the world host binds its doors (bindFestival - online, the player, a line, the save, the room - scenes/
// witchesHost.js). Unbound - the ?exterior bench, a pin - nothing is asked and nothing is found: the festival is the
// online realm's (the decorations are the calendar's, world/witchesDecor.js).
//
// Not a DFU member. Ledger A (THE WITCHES' FESTIVAL).
import { accountFestival, equipTitle, equipAura, equipIcon, adoptIdentity, storedSession, serviceBase, readAccount } from '../../net/accountClient.js';
import { appStorage } from '../appStorage.js';
import { registerEnemyDeathHandler } from '../../scenes/corpseMarker.js';
import { registerLootSupply } from '../foeLootCap.js';
import { hearActs, ACT_KINDS } from '../questlines/qlActs.js';
import { registerModSaveData } from '../modSaveData.js';
import { KNIGHT_CITY_WATCH } from '../../characters/mobile/mobileTypes.js';
import { festivalOpen, isFindSource, wareById, accountWare, festivalWaresHeld, SALE_RID_RE } from '../../net/festivalLaw.js';
import { soulCakes, restackSoulCakes, isSoulCake, isHearthOffering, hearthOffering } from './soulCake.js';
import { foeFindSource } from './festivalFoes.js';
import { cakesFoundText, festivalRefusalText } from './festivalWords.js';
import { wyrdPieceById } from '../aetheric.js';
import { mintIliacCard } from '../iliac/iliacItems.js';
import { addItem } from '../inventory.js';

/** The death handler's and the act hearer's name. */
export const FESTIVAL_FIND = 'festival-find';

const NO_DOORS = Object.freeze({ online: () => false, entity: () => null, say: (/** @type {string} */ _l) => {}, selfId: () => null, saved: () => {}, room: () => null });
/** @type {any} */
let _doors = NO_DOORS;
/** @type {any} */
let _api = null;
/** The account's festival as the service last said it: its cakes (null unknown), its wares, given and taken, its own
 *  offerings standing, and whether the festival is open for it. */
let _state = { cakes: /** @type {number|null} */ (null), wares: /** @type {string[]} */ ([]), given: 0, taken: 0, offerings: /** @type {any[]} */ ([]), open: false };
const _hear = new Set();
let _version = 0;
const changed = () => { _version++; for (const fn of _hear) { try { fn(); } catch { /* a listener's throw is not ours */ } } };

/** THE HOST'S DOORS: `online()` the world plays online, `entity()` the player, `say(line)` a line on the screen,
 *  `selfId()` this client's peer id, `saved()` the save asked for, `room()` the relay's client (my own badge worn at once -
 *  net/online.js adoptIdentity). Null unbinds. Answers the door to the service (or null). */
export function bindFestival(doors = null) {
  _doors = doors ? { ...NO_DOORS, ...doors } : NO_DOORS;
  _api = doors ? (doors.api ?? accountFestival({ fetch: (/** @type {any} */ u, /** @type {any} */ i) => globalThis.fetch(u, i), storage: appStorage() })) : null;
  if (doors) refreshFestival().catch(() => {});
  return _api;
}
/** The doors bound now (the host module and the window read them). */
export const festivalDoors = () => _doors;
/** A listener told whenever the account's festival changes; answers its unregistering. */
export function hearFestival(/** @type {() => void} */ fn) { _hear.add(fn); return () => { _hear.delete(fn); }; }
export const festivalVersion = () => _version;
/** The account's festival as last heard. */
export const festivalState = () => _state;
/** The clock the festival's days are read by on this page. The decorations are the calendar's, so the device's own; what
 *  a find, a sale and an offering may do is the service's days, read off its clock. */
export const festivalNowMs = () => Date.now();
/** Whether this page plays the festival now: bound, online, a registered account, inside its days. */
export function festivalLive() {
  if (!_api || !_doors.online() || !festivalOpen(festivalNowMs())) return false;
  const s = storedSession(appStorage());
  return !!s && s.kind !== 'guest';
}

/** Lay an answer's count on the state and the pack: `cakes` the count, `onBody` the cakes a find left on a body (the pack
 *  holds the rest). */
function learn(/** @type {any} */ d, onBody = 0) {
  if (!d || typeof d !== 'object') return;
  let moved = false;
  if (Number.isSafeInteger(d.cakes) && d.cakes >= 0) {
    _state = { ..._state, cakes: d.cakes };
    const items = _doors.entity()?.items;
    if (Array.isArray(items) && restackSoulCakes(items, Math.max(0, d.cakes - onBody))) _doors.saved();
    moved = true;
  }
  if (Array.isArray(d.wares)) { _state = { ..._state, wares: festivalWaresHeld(d.wares.join(' ')) }; moved = true; }
  for (const k of ['given', 'taken']) if (Number.isSafeInteger(d[k])) { _state = { ..._state, [k]: d[k] }; moved = true; }
  if (Array.isArray(d.offerings)) { _state = { ..._state, offerings: d.offerings }; moved = true; }
  if (typeof d.open === 'boolean') { _state = { ..._state, open: d.open }; moved = true; }
  if (moved) changed();
}

/** Ask the service for the account's festival, and a pending sale's answer after it. Answers whether it was heard. */
export async function refreshFestival() {
  if (!_api || !_doors.online()) return false;
  const r = await _api.mine().catch(() => null);
  if (!r?.ok) return false;
  learn(r.data);
  await resumeSale();
  return true;
}

// ═══ THE FINDS ═══════════════════════════════════════════════════════════════════════════════════════════════════════
let _chain = Promise.resolve();
/** @type {WeakSet<object>} */
const _asked = new WeakSet();
/** A kill that never pays (Renown's own rule, net/renownTracker.js neverPays): the city watch, and my own ally. */
const neverPays = (/** @type {any} */ e) => e?.mobileType === KNIGHT_CITY_WATCH || e?.team === 'PlayerAlly' || e?.mobileTeam === 'PlayerAlly';
/**
 * ASK FOR A FIND: `source` (festivalLaw FIND_SOURCES), `body` the fallen whose items a find is thrown onto (null: the
 * pack). Queued behind the asks before it. Answers a promise of the cakes found.
 * @param {string} source @param {any} [body]
 */
export function askFind(source, body = null) {
  if (!isFindSource(source) || !festivalLive()) return Promise.resolve(0);
  if (body && typeof body === 'object') { if (_asked.has(body)) return Promise.resolve(0); _asked.add(body); }
  const run = async () => {
    const r = await _api.find(source).catch(() => null);
    const d = r?.ok ? r.data : null;
    const found = Number.isSafeInteger(d?.found) ? d.found : 0;
    const onBody = found > 0 && Array.isArray(body?.items) ? found : 0;
    if (onBody) body.items.push(soulCakes(onBody));
    learn(d, onBody);
    if (found > 0) _doors.say(cakesFoundText(found));
    return found;
  };
  const p = _chain.then(run, run);
  _chain = p.catch(() => 0);
  return p;
}
/** A DFU quest of mine done (scenes/quest/questBridge.js onQuestEnded): a find, as the world's events give. */
export function festivalQuestEnded(/** @type {any} */ q) { if (q?.questSuccess) askFind('world'); }
/** A bounty of mine paid (scenes/bountyHost.js): the same. */
export const festivalBountyPaid = () => askFind('world');

registerEnemyDeathHandler(FESTIVAL_FIND, (/** @type {any} */ entity, /** @type {any} */ opts = {}) => {
  if (opts.room || neverPays(entity)) return;   // a room's body is its base, never a kill (PARTY-LOOT, egFind.js)
  const by = opts.by ?? null;
  if (by != null && by !== _doors.selfId()) return;   // a joiner's kill is the joiner's to ask
  askFind(foeFindSource(entity), entity);
});
hearActs(FESTIVAL_FIND, (/** @type {string} */ kind) => { const g = ACT_KINDS[/** @type {keyof typeof ACT_KINDS} */ (kind)]; if (g) askFind(g); });
registerLootSupply(FESTIVAL_FIND, isSoulCake);   // a body's cakes outrank a Common piece under its cap (systems/foeLootCap.js)

// ═══ THE SALES ═══════════════════════════════════════════════════════════════════════════════════════════════════════
/** The sale asked and not yet answered, on the character's save: `{ rid, ware }` or null. */
let _pending = /** @type {{ rid: string, ware: string } | null} */ (null);
export const FESTIVAL_SAVE_VENDOR = 'WitchesFestival';
const validPending = (/** @type {any} */ r) => (r && typeof r.rid === 'string' && SALE_RID_RE.test(r.rid) && wareById(r.ware) ? { rid: r.rid, ware: r.ware } : null);
registerModSaveData(FESTIVAL_SAVE_VENDOR, {
  newSaveData: () => ({ pending: null }),
  getSaveData: () => ({ pending: _pending ? { ..._pending } : null }),
  restoreSaveData: (/** @type {any} */ r) => { _pending = validPending(r?.pending); },
});
export const pendingSale = () => _pending;
/** Twelve hex digits for a sale's id. */
export function saleRid(rand = Math.random) {
  let s = '';
  for (let i = 0; i < 12; i++) s += Math.floor(rand() * 16).toString(16);
  return s;
}
/** The pack's piece a ware mints, or null for an account ware (a title, an aura, an icon - the service's to hold). */
export function wareItem(/** @type {any} */ w) {
  if (!w || accountWare(w)) return null;
  if (w.kind === 'piece') return wyrdPieceById(w.key);
  if (w.kind === 'card') return mintIliacCard(w.key);
  if (w.kind === 'item' && w.key === 'offering') return hearthOffering();
  return null;
}
/** A sale answered: its ware minted into the pack (an account ware is the service's), the count and the wares learned. */
function landSale(/** @type {any} */ d) {
  const w = wareById(d?.ware);
  const items = _doors.entity()?.items;
  const item = wareItem(w);
  if (item && Array.isArray(items)) addItem(items, item);
  _pending = null;
  learn(d);
  _doors.saved();
  return w;
}
/**
 * BUY a ware by its id: the sale asked by a fresh id (kept on the save until answered), its piece minted on the answer.
 * Answers `{ ok, text }` - `text` the line to show.
 * @param {string} wareId
 */
export async function buyWare(wareId) {
  const w = wareById(wareId);
  if (!w) return { ok: false, text: festivalRefusalText('ware') };
  if (!festivalLive()) return { ok: false, text: festivalRefusalText(_doors.online() ? 'closed' : 'offline') };
  if (_pending) await resumeSale();
  if (_pending) return { ok: false, text: festivalRefusalText('offline') };
  _pending = { rid: saleRid(), ware: w.id };
  _doors.saved();
  const r = await _api.buy(w.id, _pending.rid).catch(() => null);
  if (r?.ok) { landSale(r.data); return { ok: true, text: '' }; }
  if (!r || r.error === 'offline' || r.error === 'no-session') return { ok: false, text: festivalRefusalText('offline') };   // kept: asked again by its id
  _pending = null;
  _doors.saved();
  learn(r.data ?? null);
  return { ok: false, text: festivalRefusalText(r.error) };
}
/** A pending sale asked again by its own id: answered `repeat` (it landed), or as a sale now, or refused (dropped). */
async function resumeSale() {
  if (!_pending || !_api) return;
  const r = await _api.buy(_pending.ware, _pending.rid).catch(() => null);
  if (r?.ok) { landSale(r.data); return; }
  if (!r || r.error === 'offline' || r.error === 'no-session') return;
  _pending = null;
  _doors.saved();
}

// ═══ THE WARDROBE ════════════════════════════════════════════════════════════════════════════════════════════════════
/** What the account holds and wears, as the service last said it (its wardrobe - server-account/src/titles.js
 *  wardrobeOf): the titles, auras and icons held, and the one of each worn. Null until read. */
let _wardrobe = /** @type {{ title: string|null, aura: string|null, icon: string|null, titles: string[], auras: string[], icons: string[] } | null} */ (null);
export const festivalWardrobe = () => _wardrobe;
const list = (/** @type {unknown} */ v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
function adoptWardrobe(/** @type {any} */ w) {
  if (!w || typeof w !== 'object') return;
  _wardrobe = { title: w.title ?? null, aura: w.aura ?? null, icon: w.icon ?? null, titles: list(w.titles), auras: list(w.auras), icons: list(w.icons) };
  changed();
}
/** The account service's door as the stored session opens it, or null signed out. */
function accountIo() {
  const storage = appStorage(), s = storedSession(storage);
  return s ? { fetch: (/** @type {any} */ u, /** @type {any} */ i) => globalThis.fetch(u, i), base: serviceBase(storage), secret: s.secret, storage } : null;
}
/** Ask for the account's wardrobe (the window asks it as it opens). Answers whether it was heard. */
export async function loadWardrobe() {
  const io = accountIo();
  const r = io ? await readAccount(io).catch(() => null) : null;
  if (!r?.ok) return false;
  adoptWardrobe(r.data?.wardrobe);
  return true;
}
/**
 * WEAR a title, an aura or an icon the account holds - or take it off (`on` false). The service decides what is held
 * (`not-held`); its answer is the wardrobe, worn at once on my own name, feet and portrait (the stored session, the
 * room's client) and by the room from the next hello. Answers `{ ok, text }`.
 * @param {'title'|'aura'|'icon'} kind @param {string} key
 */
export async function wearAccount(kind, key, on = true) {
  const io = accountIo();
  if (!io) return { ok: false, text: festivalRefusalText('offline') };
  const want = on ? key : null;
  const r = await (kind === 'title' ? equipTitle(io, want) : kind === 'aura' ? equipAura(io, want) : equipIcon(io, want)).catch(() => null);
  if (!r?.ok) return { ok: false, text: festivalRefusalText(r?.error === 'not-held' ? 'held' : 'offline') };
  adoptWardrobe(r.data);
  const w = _wardrobe;
  adoptIdentity(io.storage, { glyphs: r.data?.glyphs, glyphsOff: r.data?.glyphsOff, aura: w?.aura ?? null, icon: w?.icon ?? null, secret: io.secret });
  const room = _doors.room();
  room?.adoptIdentity?.({ title: w?.title ?? null, glyphs: room.glyphs, level: room.lv, aura: w?.aura ?? null, icon: w?.icon ?? null });
  return { ok: true, text: '' };
}
/** WEAR a ware the account bought (festivalLaw FESTIVAL_WARES: a title, an aura, an icon). */
export async function wearWare(/** @type {string} */ wareId, on = true) {
  const w = wareById(wareId);
  if (!w || !accountWare(w)) return { ok: false, text: festivalRefusalText('ware') };
  return wearAccount(/** @type {'title'|'aura'|'icon'} */ (w.kind), w.key, on);
}

// ═══ THE HEARTH OFFERINGS ════════════════════════════════════════════════════════════════════════════════════════════
/** One move on an offering through the service: `set`, `fill`, `takeIn` or `take` - its answer learned (the cakes, the
 *  pack's offering item set out or brought back). Answers `{ ok, data, text }`. */
export async function offeringMove(/** @type {'set'|'fill'|'takeIn'|'take'} */ move, /** @type {any} */ at) {
  if (!_api) return { ok: false, data: null, text: festivalRefusalText('offline') };
  if (move !== 'takeIn' && !festivalLive()) return { ok: false, data: null, text: festivalRefusalText(_doors.online() ? 'closed' : 'offline') };
  const items = _doors.entity()?.items;
  if (move === 'set' && !(Array.isArray(items) && items.some(isHearthOffering))) return { ok: false, data: null, text: festivalRefusalText('item') };
  const r = await _api[move](at).catch(() => null);
  if (!r?.ok) {
    learn(r?.data ?? null);
    const code = move === 'take' && r?.error === 'none' ? 'gone' : r?.error ?? 'offline';   // a take's `none`: taken in since
    return { ok: false, data: r?.data ?? null, text: festivalRefusalText(code), error: code };
  }
  if (move === 'set' && Array.isArray(items)) takeOneOffering(items);
  if (move === 'takeIn' && Array.isArray(items)) addItem(items, hearthOffering());
  learn(r.data);
  if (move !== 'take') refreshFestival().catch(() => {});   // the account's own offerings, as they stand now
  _doors.saved();
  return { ok: true, data: r.data, text: '' };
}
function takeOneOffering(/** @type {any[]} */ items) {
  const it = items.find(isHearthOffering);
  if (!it) return;
  const n = Math.max(1, it.stackCount ?? 1);
  if (n > 1) it.stackCount = n - 1; else items.splice(items.indexOf(it), 1);
}
/** A town's offerings, as the service says them (`{ mapId, offerings }`), or null. */
export async function townOfferings(/** @type {number} */ mapId) {
  if (!_api || !_doors.online()) return null;
  const r = await _api.town(mapId).catch(() => null);
  return r?.ok ? r.data : null;
}

/** Tests only. */
export function _resetFestivalClientForTests() {
  _doors = NO_DOORS; _api = null; _pending = null; _wardrobe = null; _chain = Promise.resolve();
  _state = { cakes: null, wares: [], given: 0, taken: 0, offerings: [], open: false };
  _hear.clear(); _version = 0;
}

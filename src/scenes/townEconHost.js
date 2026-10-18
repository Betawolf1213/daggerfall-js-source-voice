// @ts-check
// ═══════════════════════════════════════════════════════════════════
// TOWN-ECON (bible/06-Systems/Town-Economy-Arc.md) - THE TOWN ECONOMY AS THE WORLD HOST WIRES IT (HOST-SPLIT: the
// module the host wires, src/scenes/fishHost.js's shape - constructed once, the host's own scope does not grow).
//
// TE1's reading (systems/town/townEcon.js: a town's Prosperity, its counters' factor, its card) and TE2's book
// (net/townEconBook.js: the towns' players' shares read, the Watch's ticks kept at a town's pixel and claimed, the town
// walked into witnessed) - the share the reading's `players`. Online only: offline no book is built and the reading
// answers DFU's counters and no card.
// ═══════════════════════════════════════════════════════════════════
import { createTownEcon } from '../systems/town/townEcon.js';
import { createTownEconBook } from '../net/townEconBook.js';
import { isEconTown } from '../net/townEconLaw.js';
import { accountTowns } from '../net/accountClient.js';
import { appStorage } from '../systems/appStorage.js';

/**
 * @param {{ online: () => boolean, townOf: (mapId: number) => any, seatAt: (mapId: number) => any, seats: () => (any[]|null),
 *   raidedAt: (px: number, py: number) => boolean, nowMs: () => number, typeAt?: (x: number, y: number) => (number|undefined),
 *   door?: any, storage?: any }} host
 *   `townOf` a town's row by its map id (`{ name, px, py, region, location, type }`); `nowMs` the relay's clock (a
 *   shared day's, and a tick's life); `typeAt` the MAPS location type at a map pixel; `door` the towns' door
 *   (net/accountClient.js accountTowns - the page's own online, none offline)
 */
export function createTownEconHost({ typeAt = () => undefined, storage = appStorage(), door = undefined, ...reading }) {
  const towns = door !== undefined ? door : reading.online() ? accountTowns({ fetch: (u, i) => globalThis.fetch(u, i), storage }) : null;
  const book = towns ? createTownEconBook({ door: towns, storage, me: towns.me, isTownPixel: (x, y) => isEconTown(typeAt(x, y)), relayNowS: () => Math.floor(reading.nowMs() / 1000) }) : null;
  const econ = createTownEcon({ ...reading, players: (mapId) => book?.shareOf(mapId) ?? 0 });
  return Object.assign(econ, {
    book,
    /** The Watch's tick (net/online.js onWatch), kept where it stands in a town. @param {unknown} r */
    keepWatch: (r) => book?.keepWatch(r) ?? false,
    /** The town walked into (its map id), reported to the registry once a day - a town with an economy alone.
     *  @param {unknown} mapId */
    witness(mapId) {
      if (!book || !reading.online() || mapId == null || !Number.isFinite(Number(mapId))) return false;
      const id = Number(mapId) >>> 0;
      const t = reading.townOf(id);
      if (!t || !isEconTown(t.type)) return false;
      book.witness({ map: id, px: t.px, py: t.py, region: t.region, location: t.location });
      return true;
    },
  });
}

// @ts-check
// INSTANCES (2026-10-15, Mac: "For quests and other uses, including future work, lets implement an instanced system ...
// The player approaches, should be met with an enhanced UI popup that lets them select public or instanced (if
// applicable)"; asked where: "Dungeons with your quest", "Privateer's Hold", "Building interiors"; who: "You and your
// party"; bible/11-Multiplayer/Instances.md): THE DOOR'S LAW - pure, no page. Which quests point at a place, what its
// door offers, and where a quest's things stand online.
//
// The room is net/instanceRoom.js's; the popup and the digests are scenes/instanceDoor.js's; the hosts only ask.
import { SITE_TYPES } from './quest/place.js';
import { isShelved } from './quest/quest.js';
import { instanceOfWord } from '../net/instanceRoom.js';

/** A quest that still runs and stands in the world: not ended, not thrown away, not set aside (QUEST-SHELF). */
const live = (q) => !!q && !q.questComplete && !q.questTombstoned && !isShelved(q);

/**
 * The running quests one of whose Places names this site - a dungeon by its map id, a building by its map id and key
 * (`site`: { siteType: SITE_TYPES.Dungeon | SITE_TYPES.Building, mapId, buildingKey }). A Place names it before anything
 * stands there (S0000018 reveals its crypt thirty days before its mummy is placed), so the door is the quest's from the
 * Place, not from a site link. A building site moved away from its key (RESEAT-GAPS' `unseated`) names none.
 */
export function questsAtSite(machine, site) {
  const out = [];
  const id = Number.isFinite(site?.mapId) ? site.mapId >>> 0 : null;
  if (id == null || !id) return out;
  const building = site.siteType === SITE_TYPES.Building;
  const key = Number.isFinite(site?.buildingKey) ? site.buildingKey >>> 0 : 0;
  if (building && !key) return out;
  for (const q of machine?.quests?.values?.() ?? []) {
    if (!live(q)) continue;
    for (const r of q.resources?.values?.() ?? []) {
      const sd = r?.isPlace ? r.siteDetails : null;
      if (!sd || sd.siteType !== site.siteType || (Number(sd.mapId) >>> 0) !== id) continue;
      if (building && (sd.unseated || (Number(sd.buildingKey) >>> 0) !== key)) continue;
      out.push(q);
      break;
    }
  }
  return out;
}

/** The quest that opens this site's instance: the oldest running quest that names it (the lowest uid) - so two quests
 *  pointing at one dungeon share one room, and the room goes when the first of them ends. Null for none. */
export function openerQuestOf(machine, site) {
  let best = null;
  for (const q of questsAtSite(machine, site)) if (Number.isSafeInteger(q.uid) && (best == null || q.uid < best.uid)) best = q;
  return best;
}

/** Where a quest's things stand online: a dungeon whole (an instance, a main story's keep, a dungeon the world gives
 *  its whole size, or a quest's dungeon entered whole where no instance can be had) - never a re-laid public room, whose
 *  blocks are not the ones the quest's markers name. Offline, wherever the quest's own frozen size builds (DFU's law). */
export const questMountsHere = ({ online, builtSize }) => !online || builtSize === 'full';

/** Should a quest's dungeon be entered whole in its public room - online, where no instance can be had (an older
 *  relay) and a running quest names it: Mac's first answer ("1"), folded into the instances as their fallback. */
export const questDungeonWhole = ({ online, instanceOk, questHere }) => !!(online && !instanceOk && questHere);

/**
 * The party's instances at this door: each member whose party pose stands inside this place (`place`: { px, py, in,
 * bk } - in 1 a dungeon, 2 a building, whose key must match) with an instance (`ins`). Answers [{ acct, name, owner,
 * epoch }] in the party's order, one an instance (two members in one instance are one row - its owner's, else the first).
 */
export function partnerInstances(members, place) {
  const out = [];
  if (!place || (place.in !== 1 && place.in !== 2)) return out;
  for (const m of members ?? []) {
    const p = m?.p;
    if (!p || m.online === false || p.px !== place.px || p.py !== place.py || p.in !== place.in) continue;
    if (place.in === 2 && p.bk !== place.bk) continue;
    const inst = instanceOfWord(p.ins);
    if (!inst) continue;
    if (out.some((o) => o.owner === inst.owner && o.epoch === inst.epoch)) continue;
    out.push({ acct: m.acct ?? null, name: typeof m.name === 'string' ? m.name : '', ...inst });
  }
  return out;
}

/**
 * WHAT THE DOOR OFFERS - null for no popup (the door opens on the public room, as it always did), else the rows:
 *   { kind: 'public' }                              the place's shared room - never Privateer's Hold online (HOLD-ONCE)
 *   { kind: 'mine' }                                my instance - a quest of mine names the place, or the Hold
 *   { kind: 'join', name, acct, owner, epoch }      a party member's instance standing here now
 * Offline, or at a relay that keeps no instance, there is nothing to choose. A place with no instance to offer has no
 * popup; the Hold with none still answers (its public room refused, the door says so).
 */
export function instanceOffer({ online, instanceOk, isHold = false, questHere = false, partners = [] }) {
  if (!online || !instanceOk) return null;
  const rows = [];
  if (!isHold) rows.push({ kind: 'public' });
  if (questHere || isHold) rows.push({ kind: 'mine' });
  for (const p of partners ?? []) rows.push({ kind: 'join', name: p.name, acct: p.acct, owner: p.owner, epoch: p.epoch });
  return rows.length > (isHold ? 0 : 1) ? rows : null;
}

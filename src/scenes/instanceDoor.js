// INSTANCES (2026-10-15, Mac: "The player approaches, should be met with an enhanced UI popup that lets them select
// public or instanced (if applicable)"; bible/11-Multiplayer/Instances.md): THE DOOR - the page's half of an instance.
// The law is systems/instancePlaces.js's (what the door offers, where a quest's things stand) and net/instanceRoom.js's
// (the room); this module holds what a page must: the account's and the character's digests (async, worked out once),
// the popup (ui/talkWindow.js ChoiceWindow - the enhanced dialog on the Plus skin, the panel on the classic one, as the
// arena gate's Herald), and the instance the place the player stands in was entered as - which the room's key reads
// (worldModes.js roomIdentity). HOST-SPLIT: the hosts construct it once and ask it; it grows here, not in them.
//
// deps: online() - the page is online; instanceOk() - its relay admits instances (net/instanceRoom.js
// relaySupportsInstances, the welcome's word); account(), character() - the verified account and the character's id
// (the private rooms' own: social.acct, realmSession.id); members() - the party's other members, each with its party
// pose `p` (net/social.js); pixel() - the map pixel the player stands in (the party pose's own reading, so a partner's
// place and this door's agree by construction); questMachine(); showOverlay(window); say(line).
import { ChoiceWindow } from '../ui/talkWindow.js';
import { t } from '../systems/textManager.js';
import { SITE_TYPES } from '../systems/quest/place.js';
import { instanceOwnerOf, holdEpochOf } from '../net/instanceRoom.js';
import { openerQuestOf, partnerInstances, instanceOffer, questDungeonWhole, questsAtSite, questInstanceEpoch } from '../systems/instancePlaces.js';
import { isPrivateersHold } from '../systems/startDungeon.js';   // HOLD-ONCE: online the Hold's public room is entered once - its instance any time

/** The words, one home - drafted in the thirteen whole languages (locales/), keys under `instance.door`. */
export const INSTANCE_TEXT = Object.freeze({
  line: () => t('instance.door.line', 'Enter the shared world, or an instance of your own for you and your party?'),
  holdLine: () => t('instance.door.holdLine', "Privateer's Hold is closed to the public. You may enter an instance of your own, for you and your party."),
  public: () => t('instance.door.public', 'Public'),
  mine: () => t('instance.door.mine', 'Your instance'),
  join: (name) => t('instance.door.join', "{name}'s instance", { name }),
  leave: () => t('instance.door.leave', 'Leave'),
  questHere: () => t('instance.door.questHere', "Your quest's business here waits in your instance."),
  unavailable: () => t('instance.door.unavailable', 'Your instance could not be opened. Try again in a moment.'),
});

/** A site's one spelling - what the room's key and the door agree on. */
const siteKey = (site) => `${site.siteType}:${Number(site.mapId) >>> 0}:${Number(site.buildingKey ?? 0) >>> 0}`;

export function createInstanceDoor(deps) {
  let ownerFor = null, owner = null;   // the account the owner digest is of, and the digest
  let here = null;                     // { key, instance } - the place the player last went through a door into, as entered
  let said = null;                     // the site whose quest-elsewhere line was said this entry (questElsewhere)
  /** My owner digest - worked out once an account. */
  async function myOwner() {
    const a = deps.account?.() ?? null;
    if (!a) return null;
    if (ownerFor !== a) { ownerFor = a; owner = await instanceOwnerOf(a); }
    return owner;
  }
  /** The instance I open at `site`: my owner, and the epoch of the quest that names it (the oldest - its own, kept in its
   *  save: questInstanceEpoch), or the Hold's (my character's). */
  async function mine(site) {
    const o = await myOwner();
    const epoch = site.isHold ? await holdEpochOf(deps.character?.() ?? null) : questInstanceEpoch(openerQuestOf(deps.questMachine?.(), site));
    return o && epoch ? { owner: o, epoch } : null;
  }

  /** The party's instances standing at `place` whose owners are in the party (systems/instancePlaces.js partnerInstances) -
   *  each member's owner digest worked out here, the page's half. */
  async function partnersAt(place) {
    const members = deps.members?.() ?? [];
    const owners = new Map(await Promise.all(members.map(async (m) => [m?.acct, await instanceOwnerOf(m?.acct)])));
    return partnerInstances(members, place, (acct) => owners.get(acct) ?? null);
  }
  /**
   * THE DOOR'S QUESTION, asked by a host before it builds a place the player walks into (never a load's: `skip`).
   * `site`: { siteType (SITE_TYPES.Dungeon | SITE_TYPES.Building), mapId, buildingKey, px, py (its map pixel), isHold }.
   * `chosen`: the popup's row on its second call (`enter(row)` is how the popup calls the host back). Answers
   *   { go: true, instance, whole } - build it: `instance` { owner, epoch } or null for the public room, `whole` the
   *                                     dungeon as Daggerfall lays it (an instance, or a quest's where none can be had)
   *   { go: false }                   - not now: the popup is up, or the instance could not be keyed (said)
   */
  async function ask(site, { chosen = null, enter = null, skip = false } = {}) {
    const key = siteKey(site);
    said = null;
    const settle = (instance, whole) => { here = { key, instance }; return { go: true, instance, whole: !!whole }; };
    const online = !!deps.online?.();
    const instanceOk = online && !!deps.instanceOk?.();
    const questHere = !site.isHold && openerQuestOf(deps.questMachine?.(), site) != null;
    if (skip) return settle(null, questDungeonWhole({ online, instanceOk, questHere }));
    if (chosen) {
      if (chosen.kind === 'public') return settle(null, false);
      const inst = chosen.kind === 'mine' ? await mine(site) : chosen.kind === 'join' ? { owner: chosen.owner, epoch: chosen.epoch } : null;
      if (!inst) { deps.say?.(INSTANCE_TEXT.unavailable()); return { go: false }; }
      return settle(inst, true);
    }
    const px = deps.pixel?.() ?? { x: null, y: null };
    const place = { px: px.x, py: px.y, in: site.siteType === SITE_TYPES.Building ? 2 : 1, bk: site.siteType === SITE_TYPES.Building ? (Number(site.buildingKey) >>> 0) : null };
    const partners = instanceOk ? await partnersAt(place) : [];
    const rows = instanceOffer({ online, instanceOk, isHold: !!site.isHold, questHere, partners });
    if (!rows) return settle(null, questDungeonWhole({ online, instanceOk, questHere }));
    const options = rows.map((row, i) => ({
      code: `Digit${i + 1}`,
      label: `${i + 1} - ${row.kind === 'public' ? INSTANCE_TEXT.public() : row.kind === 'mine' ? INSTANCE_TEXT.mine() : INSTANCE_TEXT.join(row.name)}`,
      action: () => { enter?.(row); },
    }));
    options.push({ code: `Digit${rows.length + 1}`, label: `${rows.length + 1} - ${INSTANCE_TEXT.leave()}`, action: () => {} });
    deps.showOverlay?.(new ChoiceWindow({ lines: [site.name ?? '', site.isHold ? INSTANCE_TEXT.holdLine() : INSTANCE_TEXT.line()].filter(Boolean), options }));
    return { go: false };
  }

  /** A dungeon's site, from the location its door names. */
  const dungeonSite = (dfLocation) => ({ siteType: SITE_TYPES.Dungeon, mapId: dfLocation?.mapTableData?.mapId ?? 0, buildingKey: 0, isHold: isPrivateersHold(dfLocation), name: dfLocation?.name ?? '' });
  /** A building's site in the town `mapId`, from its building record (buildingDataForDoor's). */
  const buildingSite = (mapId, building) => ({ siteType: SITE_TYPES.Building, mapId, buildingKey: building?.buildingKey ?? 0, isHold: false, name: '' });
  return {
    ask,
    /** The door of a dungeon (worldModes.js tryEnterDungeon). */
    askDungeon: (dfLocation, opts) => ask(dungeonSite(dfLocation), opts),
    /** The door of a building (worldModes.js enterInteriorCore) - a building no quest names and no partner stands an
     *  instance in opens as it always did. */
    askBuilding: (mapId, building, opts) => ask(buildingSite(mapId, building), opts),
    /** The instance the dungeon `mapId` was entered as (worldModes.js roomIdentity), else null. */
    dungeonInstance: (mapId) => (here && here.key === siteKey({ siteType: SITE_TYPES.Dungeon, mapId, buildingKey: 0 }) ? here.instance : null),
    /** The instance the building was entered as, else null. */
    buildingInstance: (mapId, buildingKey) => (here && here.key === siteKey({ siteType: SITE_TYPES.Building, mapId, buildingKey }) ? here.instance : null),
    /** A re-laid public room stands none of a quest's things (systems/instancePlaces.js questMountsHere): where a quest of
     *  mine names this dungeon and an instance could be had, it says so once an entry. */
    questElsewhere(mapId) {
      const site = { siteType: SITE_TYPES.Dungeon, mapId, buildingKey: 0 };
      const key = siteKey(site);
      if (said === key || !deps.online?.() || !deps.instanceOk?.() || !questsAtSite(deps.questMachine?.(), site).length) return false;
      said = key;
      deps.say?.(INSTANCE_TEXT.questHere());
      return true;
    },
    /** The instance `site` was entered as - null for its public room, or for a place no door was asked of. */
    instanceAt(site) { return here && site && here.key === siteKey(site) ? here.instance : null; },
    /** The instance I stand in, for my party pose (`ins`) - only where the room is one (the host says which site). */
    myOwner,
  };
}

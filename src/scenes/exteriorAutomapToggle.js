// HOST-SPLIT: moved verbatim out of src/scenes/world.js's bootWorld (bible/01-Overview/Host-Split.md) by tools/hostMove.mjs.
// The host constructs it where the code stood. What it reads of the host's scope comes through `host`: the
// settled names by value at construction, every live one (a `let` someone writes, a `const` made below) read at its
// use as `host.<name>` - as the code read them where it was.
import { arenaTownLandmark } from '../world/arena/arenaCity.js';
import { buildingSummaries } from '../world/buildingSummaries.js';
import { createTownMapWindow, townMapDoorReady } from '../ui/town/townMapDoor.js';
import { discoveredBuildings, restampQuestNames } from '../systems/discovery.js';
import { getLocalizedLocationName, getLocalizedRegionName } from '../systems/textManager.js';
import { hasCustomLocationPosition } from '../world/locationLayout.js';
import { isVendorWaypoint, vendorWaypointLabel, vendorWaypointVersion } from '../systems/vendorWaypoint.js';
import { mwViewFirstPerson } from '../player/mwView.js';
import { playerEntity } from '../characters/playerEntity.js';
import { questTracker } from '../ui/quest/questTracker.js';
import { sheetHolderOf } from '../combat/weapon/weaponRig.js';
import { stampResidenceQuestNames } from '../ui/exteriorAutomapWindow.js';
import { townHomeRows } from '../ui/town/townMapMarks.js';
import { townQuestBuildings, townTierOn } from '../systems/quest/questGuidance.js';
import { WORLD_PER_PX } from '../ui/ink/inkTown.js';

/** @param {any} host */
export function createExteriorAutomapToggle(host) {
  const {
    built, cam, cpuModels, getGpuMesh, locationIndex, maps, onlineHomes, player, playerTravelPixel,
    questBuildingSource, state, townTalk, walkMode, weaponRig
  } = host;
  // A2: the exterior automap's own dispatch half (DaggerfallUI.cs
  // :633-650): M outside opens the TOWN map only when the current
  // map pixel carries a location - empty wilderness opens nothing.
  // (Inside, routeKey's 'automap' arm opens the dungeon map instead.)
  const toggleExteriorAutomap = () => {
    if (townTalk.overlayActive) return;
    const px = playerTravelPixel();
    const key = `${px.x},${px.y}`;
    const dfLoc = locationIndex.get(key);
    const b = built.get(key);
    if (!dfLoc || !b?.locBlocks || !b.locOrigin) return;
    const feet = walkMode ? player.pos : cam.pos;
    const t = state.pixelTranslation(px.x, px.y);
    // location-local player frame - the Where-is directory's own
    // conversion (setTopics' playerPos closure); the overlay holds
    // the motor, so the open-time capture stays truthful
    const local = [feet[0] - t[0] - b.locOrigin[0], feet[1] - t[1] - b.locOrigin[1], feet[2] - t[2] - b.locOrigin[2]];
    const locId = `${dfLoc.regionIndex}:${dfLoc.name}`;
    // ROAD-C c2/S10: the arrow/stamp is the REAL mesh 99900, rasterised
    // once from its CPU data (ui/meshStamp.js). Kicked off here and
    // read lazily - the window draws its two other layers meanwhile.
    getGpuMesh(99900).catch(() => {});
    // HALF B: the plates now come off the Position-bearing subrecord
    // walk over ALL buildings, not off the discovered doors.
    // L10N3e: the plates' names carry the shown pair beside the canonical one - GetLocalizedLocationName by the MapId
    // and GetLocalizedRegionName by the index (ExteriorAutomap.cs:717-718); the canonical pair still chooses the palace
    const shownLocation = getLocalizedLocationName(dfLoc.mapTableData?.mapId, dfLoc.name);
    const summaries = buildingSummaries(dfLoc.exterior?.buildings ?? [], b.locBlocks,
      { locationName: dfLoc.name, regionName: maps.getRegionName(dfLoc.regionIndex), locationIndex: dfLoc.locationIndex ?? 0,
        shownLocationName: shownLocation, shownRegionName: getLocalizedRegionName(dfLoc.regionIndex, (i) => maps.getRegionName(i)) });
    // ROAD-D D5: CreateBuildingNameplates' residence arm (:682-709).
    // DFU resolves the quest name for every discovered residence AS IT
    // BUILDS THE NAMEPLATES - once per open (:273), never per frame -
    // and this is that build. The quest source is the pair DFU reads:
    // QuestMachine.GetAllActiveQuests/GetQuest and TalkManager
    // .IsBuildingQuestResource, which the topic tree already carries.
    // PlayerGPS.CurrentMapID is the map ID of the location the player
    // is standing in, which is exactly the pixel this door resolved.
    // AUDIT DISC28 QS-K2: DISC28-K's re-stamp, at the map's own open - it ran only at a door, so the plan opened on
    // arrival still named a house for the job before the live one (an override-named residence draws its stored name)
    restampQuestNames(locId, { ...questBuildingSource, currentMapID: () => dfLoc.mapTableData?.mapId ?? 0 });   // the plan's own town
    stampResidenceQuestNames(summaries, discoveredBuildings(locId), {
      getAllActiveQuestIds: host.activeQuestIds,
      getQuest: (questID) => host.questBridge?.machine.getQuest(questID) ?? null,
      isBuildingQuestResource: (mapID, key) => host.topicTree.isBuildingQuestResource(mapID, key),
    }, dfLoc.mapTableData?.mapId ?? 0);
    if (!townMapDoorReady()) return;   // EM4: the skin fork's gate
    mwViewFirstPerson();   // MW-MAP1: MAP-POV's law for this sheet too - the town plan is read in the head, and the arm must be first-person before the window's first tick asks
    townTalk.showOverlay(createTownMapWindow({
      holder: sheetHolderOf(() => weaponRig),   // MW-MAP1: the Morrowind hands lane on the M key, as on V
      locationName: shownLocation,   // L10N3e: the title, as shown - the key is locationId
      locationId: locId,
      gridW: dfLoc.exterior.exteriorData.width, gridH: dfLoc.exterior.exteriorData.height,
      blocks: b.locBlocks.map((bl) => ({ x: bl.x, y: bl.y, autoMap: bl.dfBlock?.rmbBlock?.fldHeader?.autoMapData, landmark: arenaTownLandmark(bl.dfBlock) })),   // ARENA-MAP: the Arena's name (world/arena/arenaCity.js)
      yards: b.merchantYards ?? null,   // YARDS-FOUND: the town's Stable and Wagon Yard on the map - their ground and their names (ui/town/townMapDoor.js)
      ports: b.portSites ?? null,   // SHIPYARDS-FOUND: a port town's shipyard and lighthouse on it the same way
      playerPos: () => local,
      // the marker law is DFU's modulo of the MAP PIXEL frame, so the
      // window needs the location's origin inside that pixel back
      locOrigin: [b.locOrigin[0], b.locOrigin[1], b.locOrigin[2]],
      isCustomLocation: hasCustomLocationPosition(dfLoc),
      playerYaw: () => cam.yaw,
      arrowMesh: () => cpuModels.get(99900) ?? null,
      compassArt: host.hudArt,
      buildings: () => summaries,
      directory: () => townTalk.directory,
      discovered: () => discoveredBuildings(locId),
      rename: (buildingKey, name) => host.renameMapBuilding(locId, buildingKey, name),
      // EM4: what the enhanced sheet needs beyond the classic bag. The
      // context is DERIVED off the flags every host already keeps.
      //
      // THE BAY TAB IS NOT HANDED OVER FROM HERE, and that is a
      // decision rather than an omission. `systems/map/mapTabs.js` says a
      // town offers the streets AND the bay, and the slot's narrowing
      // (ui/map/mapStrip.js) therefore leaves the world tab off this
      // window's strip because this window holds no world sheet. The
      // reason is DFU's travel guards: `toggleTravelMap` refuses to
      // OPEN the bay with enemies nearby, with a merchant's offer
      // pending, in sunlight for a sun-damaged career, or under a
      // racial fast-travel block - four checks that happen at open
      // time. Handing the bay over on the town key would walk straight
      // past all four, and moving them to commit time is a behaviour
      // change to a ported, audited system. Mac's call, recorded in
      // 10-UI/Enhanced-Maps-Arc.md; until he takes it, the travel key
      // is the way to the bay and it keeps its ladder.
      where: () => ({ inLocation: true }),
      townPlayer: () => ({ x: local[0] / WORLD_PER_PX, y: local[2] / WORLD_PER_PX, yaw: cam.yaw }),
      // DISC23-A: the party in these streets, their feet taken into the location's frame by the SAME subtraction the
      // player's `local` is (the translation and the origin read at open, which the held motor keeps true)
      townParty: () => host.partyOnMaps().map((m) => ({ ...m, feet: [m.feet[0] - t[0] - b.locOrigin[0], m.feet[1] - t[1] - b.locOrigin[1], m.feet[2] - t[2] - b.locOrigin[2]] })),
      // TOWN-MARKS (ui/town/townMapMarks.js): the town's Notice Boards, while the board is open (the boards noticeCountPoints
      // counts over), with its unread count; and its player housing - the online homes and the bank's house
      townBoards: () => host.townBoardMarks(b),
      // GUIDE8's Town tier (AUDIT DELVE, systems/quest/questGuidance.js): the buildings a quest's journal names in this town
      townQuestBuildings: () => (townTierOn() ? townQuestBuildings(questTracker.views, dfLoc.mapTableData?.mapId, questTracker.tracked()?.id ?? null) : []),
      townHomes: () => townHomeRows({
        buildings: summaries, mapId: dfLoc.mapTableData?.mapId, regionIndex: dfLoc.regionIndex, houses: playerEntity.houses ?? null,
        homeAt: onlineHomes ? (mapId, buildingKey) => {
          const h = onlineHomes.homeAt(mapId, buildingKey);
          // HOME-VENDOR: the trader's waypoint names its house on the town map
          return h && isVendorWaypoint(mapId, buildingKey) ? { ...h, own: false, owner: vendorWaypointLabel(h.owner) } : h;
        } : null,
      }),
      townHomesVersion: () => (onlineHomes?.version() ?? 0) + vendorWaypointVersion() * 100_000,   // HOME-VENDOR: a waypoint moved repaints
    }));
    onlineHomes?.ensure(dfLoc.mapTableData?.mapId);   // TOWN-MARKS: a town heard from long ago is asked again, and its homes mark when it answers
  };
  return { toggleExteriorAutomap };
}

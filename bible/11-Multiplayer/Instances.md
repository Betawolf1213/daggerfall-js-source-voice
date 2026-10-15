# INSTANCES - a place of your own, for you and your party

Opened 2026-10-15. Mac, after the main-quest audit below: *"Instead of one room for houses, dungeons, etc - for quests
and other uses, including future work, lets implement an instanced system. For example, take privateers hold. Currently,
players cant revisit it even if theres a quest there. The player approaches, should be met with an enhanced UI popup
that lets them select public or instanced (if applicable)."* Asked, Mac chose:

- **Who:** "You and your party". The relay admits an instance's owner, staff, and anyone in the owner's party.
- **Where:** "Dungeons with your quest", "Privateer's Hold", "Building interiors". A building's door asks as a dungeon's
  does, where a quest of yours names the building.
- **What it remembers:** "Kept per owner, 30-min respawn" and "Kept until quest ends". The room keeps its memory as a
  public room does, under RESPAWN-30's half-hour, and a quest that ends never keys its room again.
- **The size hotfix:** "Fold into instancing". There is no interim fix. A quest's dungeon is the dungeon whole inside its
  instance, and whole in its public room only where no instance can be had (an older relay).

Not a DFU member: DFU has one player and no rooms. Ledger A, INSTANCES.

## 1. Why - the main quest's mummy, and the sizes

A streamer was stuck on the main quest, unable to find an enemy, after QREPAIR, QUEST-VOID, QUEST-CAPS and QUEST-RESET
had all shipped for S0000018's mummy (`06-Systems/Quest-Arc.md`). The audit (2026-10-15) read the quest's path end to
end and walked the real dungeons with the game's own collider (`player/collider.js` move, from the start marker, every
door and moving wall left open, so "unreachable" is a lower bound):

- S0000018 is started at Direnni Tower (S0000003's `start quest 18 18`), so its `remote dungeon0` is drawn from the Isle
  of Balfiera's seven crypts. Online the world builds each at the size its map id draws (SD-ONLINE: a quarter small, half
  medium, a quarter whole).
- **Ruins of The Hold of Coppering**, built medium online, starts the player in a pocket of 293 standing spots that leads
  only into a border cap. In the whole dungeon the same start marker (block N0000040) walks on through its south neighbour
  N0000059 into the rest. None of the medium build's four quest markers is reachable from its entrance, yet each one
  exists in the build, so QUEST-VOID never fires and QUEST-CAPS (interior blocks only) does not help.
- Ruins of Old Barbara's Place (the 2026-10-12 report) and The Masoleum of Darkivaron, both small online, reach their
  markers.

So a re-laid dungeon - the interior block a random one, its four sides caps - can seal a quest's marker away from its
entrance, and every safeguard asks "is the marker in the build", never "can the player walk to it". Mac's first answer
was "1" - a quest's dungeon built whole - and then the instances, which carry it.

## 2. The room (net/instanceRoom.js)

An instance is its place's public world room with an owner and an epoch after it:

    <public room>.i<owner>.<epoch>        dungeon:m187853213.i0f1e2d3c4b5a6978.89abcdef

- **The public room** is a dungeon whole (`dungeon:m<id>` - never `.m` or `.s`) or a building
  (`interior:m<id>.<key>`, its key in its town's layout, WD3). `instanceRoomOf` refuses anything else.
- **owner**, 16 hex: eight bytes of SHA-256 over `instance:account:<account>` (instanceOwnerOf). The relay checks it
  against the subject its token verified.
- **epoch**, 8 hex: four bytes over `instance:epoch:<character>:<opener>` (instanceEpochOf). The opener is the quest that
  names the place - its uid (questOpener); the oldest running quest when several do, so they share one room - or the
  Hold's word (HOLD_OPENER). Two characters of one account never share a quest's room.
- **A world room** (net/wire.js WORLD_ROOM composes INSTANCE_TAG_SOURCE, the tag's one home): its host's simulation, its
  acts, its loot, its memory and RESPAWN-30 exactly as its public twin's. Its memory is forgotten INSTANCE_TTL_MS (seven
  days) after it last drained (worldTtlMsFor), where a public room's is WORLD_TTL_MS: the public world is a bounded set
  of places; a character's quests are not.
- **roomKeyFor** (net/online.js) keys an identity's `instance` in place of its public room. One that cannot be keyed is
  no room - never the public one.

## 3. The relay's door (server/src/index.js, world207)

- **The hello** of an instance room: `_instanceAdmit`, asked before anything is written (the owned room's law). Its owner
  and staff come in. Anyone else is asked of the hub - `_instanceKinOf`, a POST to INSTANCE_INTERNAL_KIN with the
  subject and the owner's digest, kept INSTANCE_KIN_KEEP_MS a pair. The hub (`_instanceKinInternal`) reads the subject's
  party and answers whether another member's digest is the owner's (partyHoldsOwner). A stranger is refused
  `private instance`; the hub silent is `busy` (CLOSE_BUSY - the page tries again), never a way in.
- **The party pose** carries `ins` - the member's instance as `<owner>.<epoch>` (instanceWord), inside only - so a
  partner at the same door is offered to join it.
- **RELAY_VERSION world207** (NOT YET DEPLOYED; world206 on its branch, renumbered past main's SERPENT5 at the merge). net/instanceRoom.js joins the bundle. A page offers an instance only to
  a relay whose welcome says INSTANCE_RELAY_MIN (207) or later (`online.instanceOk`): an older one keeps no memory for
  the key, gates nobody out of it, and drops `ins`.

## 4. The door (systems/instancePlaces.js, scenes/instanceDoor.js)

THE LAW is pure (instancePlaces.js):

- **questsAtSite**: the running quests (not ended, not tombstoned, not set aside) one of whose Places names the site - a
  dungeon by its map id, a building by its map id and key. A Place names its site before anything stands there:
  S0000018 reveals its crypt thirty days before its mummy is placed. A site unseated from its key (RESEAT-GAPS) names
  none.
- **instanceOffer**: offline or at an older relay, nothing. Otherwise the rows:
  - Public - never Privateer's Hold online (HOLD-ONCE).
  - Your instance - where a quest of mine names the place, and at the Hold.
  - `<name>`'s instance - for each party member standing in an instance of this place now (partnerInstances: the
    member's pose at the same pixel, inside this dungeon or this building, with an `ins`; one row an instance).
  
  A place with nothing but its public room has no popup: the door opens as it always did.
- **questMountsHere**: online, a quest's things stand only in a dungeon whole - an instance, a main-story keep, a dungeon
  the world gives its whole size. Offline, as DFU's frozen size builds.
- **questDungeonWhole**: online, at a relay with no instances, a dungeon a quest of mine names is entered whole - in its
  existing whole room `dungeon:m<id>`. That is Mac's first answer, kept as the fallback.

THE PAGE (instanceDoor.js, HOST-SPLIT's shape - built once in world.js, asked by worldModes.js):

- **The popup** is `ui/talkWindow.js` ChoiceWindow - the enhanced dialog on the Plus skin and the panel on the classic,
  as the arena gate's Herald. It is a redesigned window, not a DFU one (Port-Doctrine, Scope). Its rows are numbered
  (`1 - Public`, `2 - Your instance`, ...), then Leave, so every language keys them alike.
- **Its two lines**: the place's name, then the question. At the Hold: "Privateer's Hold is closed to the public. You
  may enter an instance of your own, for you and your party."
- **Answers.** `ask` answers `{ go, instance, whole }`, or `{ go: false }` while the popup is up. The popup's row calls
  the host's funnel back with the choice. Mine is worked out from the digests: the account's, worked out once, and the
  character's and the opener's.
- **The room reads it.** The door remembers what the place the player last walked into was entered as.
  `dungeonInstance` and `buildingInstance` answer the room's key (roomIdentity).
- **A re-laid public room** stands none of a quest's things. `questElsewhere` says once an entry: "Your quest's business
  here waits in your instance."
- **Never asked:** a load (`skip`), the ways in marked `holdOpen` (the new game's start, a staff landing), a restore, a
  ship's cabin, a caravan.

## 5. The sizes (world/smallerDungeons.js, systems/quest/questRepair.js)

- **dungeonSizeFor** takes `whole`: online, the dungeon as Daggerfall lays it, whatever size the world gives it. An
  instance's build asks it, and so does a quest's dungeon where no instance can be had (dungeonTransition, the door's
  `whole`).
- **The quest's world** (world.js questWorld `getLocation`/`getLocationByName`) asks it too online: a quest's markers
  are chosen on the dungeon whole, the layout its instance builds.
- **smallerDungeonsStateNow** stamps a quest started online with DFU's `Disabled` - the whole dungeon's, as its markers
  know it. A copy taken offline builds that layout.
- **relayQuestOnline** (the load's re-lay) re-lays any quest stamped otherwise - the world's sizes'
  ONLINE_DUNGEONS_STATE among them - on the whole dungeon, and stamps it `Disabled`.
- **The dungeon's mount** (worldModes.js mountQuestResources) asks questMountsHere before QUEST-VOID. QUEST-VOID's
  re-lay would otherwise carry the markers into the re-laid public room's blocks, back where the audit found them sealed.

## 6. Privateer's Hold

HOLD-ONCE stands for its PUBLIC room: online a character walks out of the Hold for good and its door, a Recall and a
quest's transfer to it are refused - unless the door answers with an instance. At a relay that admits instances the
Hold's door offers "Your instance" (and any partner's), never Public; its instance opens on the Hold's own word, so a
character's Hold is one room for good (seven days of memory after it drains). The new game's start and a staff landing
are `holdOpen` and never asked: the public Hold, as before.

## 7. THE FOUR HOSTS

- **scenes/worldModes.js** - WIRED. Its two funnels ask the door: tryEnterDungeon, every dungeon entry, before
  HOLD-ONCE; enterInteriorCore, a building's door. dungeonTransition builds by the door's `whole`. roomIdentity carries
  the instance. mountQuestResources asks questMountsHere.
- **scenes/world.js** - WIRED. It constructs the door, keys the room by the identity's instance, sends the party pose's
  `ins`, and its quest world asks for the dungeon whole online.
- **scenes/exterior.js** - NAMED, not wired: the offline fixed city keeps no relay room and offers no instance.
- **scenes/dungeonContext.js** - NAMED, not wired: it enters no place; its streams and memory are its room's, whichever
  room that is.

## 8. Pinned

- `test/instances1.test.js` (8): the law - the digests, the key both ways, a world room on its own clock, roomKeyFor,
  the relay's door with the hub's word, the party word, the relay version.
- `test/instances2_relay.test.js` (6): the real Room's hello with signed tokens - the owner, a party member by the hub
  (a real Room over its own storage), a stranger refused before anything is written, the hub silent is busy, a relay of
  one room, the public room untouched, the alarm's clock, the party pose's `ins`.
- `test/instances3_door.test.js` (12): the door's law over the real QuestMachine and Place, the sizes and the load's
  re-lay, partners, the offer, the door with the real ChoiceWindow and digests (a quest's dungeon, the fallback, the
  Hold, a partner, a building, the quest-elsewhere line), the funnel executed from its source, and the hosts by source.
- `tools/mutants/instances.json` (24), all dead; the lists re-aimed by content where this arc moved their lines -
  holdonce, dsize1, sdonline, holdshared, soc1 and hostsplit - 119 dead in all, none surviving.
- PIN MOVED: RELAY_VERSION world207 in every file that names it, and `test/relayversion.test.js`'s row and graph;
  the quest stamp and the re-lay (dsize1_mediumdungeons, sdonline, sd20g_delve), the funnels' and the identity's
  shapes (audit68_worldmodes, holdonce, holdshared, privateInterior, interiorsave, dungeonentry, mapkeep, world6,
  auditworld34, audit28_smallerdungeons, uxb1e_onlinesync), the relay's calls between rooms (scale2b), the account
  Worker's deploy filter (`.github/workflows/account-deploy.yml`: net/instanceRoom.js is in its bundle).
- HOST-SPLIT: bootWorld's ceiling raised to 21,760 with its reason - main stood 55 over at e665d02e, and this arc wires
  10 lines; the overflow is the next HOST-SPLIT slice's to move out.

## 9. Open

- **The relay deploy.** world207 is NOT YET DEPLOYED. Until it is, no page offers an instance, and a quest's dungeon is
  entered whole in its public room (the fallback).
- **Every dungeon.** Mac chose quests', the Hold's and buildings'. A door at any dungeon is one row of instanceOffer
  away.
- **A re-laid public room's own quests.** A player who chooses Public at a quest's dungeon finds its things in the
  instance only. The line says so; the choice is theirs.
- **Reachability.** The public world's re-laid dungeons can still seal an area from their entrance - the Hold of
  Coppering's medium build does - for anyone exploring them. A reachability pass over every dungeon's small and medium
  builds (the audit's walker, `player/collider.js`) is the measure, and is not this arc.

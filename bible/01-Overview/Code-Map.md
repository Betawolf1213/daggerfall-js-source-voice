# CODE MAP - where things live, and where a new file goes

Opened 2026-10-16 (TIDY1). A teammate's read of the tree: the directories are not documented and do not make sense,
things are placed where they lie, and nobody knows where anything is. Mac: *"Well I wanna take this on"*, then
*"Do everything"*.

This page is the map. `test/tidy1_codemap.test.js` holds it to the tree both ways: every directory under `src/` that
holds code is in the table below, and the table names no directory that is gone. A change that adds a directory
adds its row here.

## Why

Measured 2026-10-16 on main (f87572c5):

| Where | Files | Loose (not in a subfolder) |
|---|---|---|
| `src/systems/` | 651 | 530 |
| `src/ui/` | 371 | 369 |
| `src/world/` | 214 | 214 |
| `src/net/` | 174 | 174 |
| `src/scenes/` | 141 | 141 |
| `test/` | 3,349 | 3,282 |
| `tools/` | 2,500 | 414 |

Before this page there was no map. `Home.md`'s "Repo layout" named four of the fourteen `src/` directories, no
folder under `src/` had a README, and `01-Overview/` holds 274 pages, 258 of them dated records (field bugs, audits, handoffs),
so "Overview" is a log rather than an overview. `src/systems/` holds features that obviously belong together and
were never put together: 18 `travel*` modules, 16 `arena*`, 13 `item*`, 9 `loot*`. It also holds app plumbing
(`appStorage.js`, `appRoot.js`, `audio.js`) beside the game's law.

Host splitting (`Host-Split.md`) does not fix this, and it can make it worse. It takes code out of the four hosts,
and what it takes out lands loose in `src/scenes/` or `src/systems/`.

## The map

### The repository

| Directory | What lives there |
|---|---|
| `src/` | The game client. Everything the browser and the desktop app run. |
| `server/` | The relay (a Cloudflare Worker, one Durable Object `Room` per room): the wire's authority. `server/src/index.js` is its host. |
| `server-account/` | The account service (a Cloudflare Worker): accounts, and what the realm keeps between sessions - guilds, boards, ladders. `migrations/` are D1 migrations - applied, never edited. |
| `app/` | The desktop app's Electron shell (`main.cjs`, preloads, packaging). |
| `bible/` | The design record. `Home.md` is the index and its Process rules bind every change. |
| `test/` | Every test, flat. `bible/09-Testing/Testing.md` has one row per file. |
| `tools/` | Developer tools run by hand or by the suite: probes, bakes, gates, the mutation lists (`tools/mutants/`). |
| `scripts/` | Build, release and bake scripts run by npm and CI (`buildTag`, `desktopRelease`, `updateNumber`, the `bake*` scripts). |
| `public/` | Vite's static root, copied into the build as-is: art, sound, fonts, the mods' assets. No game data (`Port-Doctrine.md`). |
| `vendor/` | Daggerfall Unity mods' published files, kept as handed over, for reference and for the bakes. |
| `locales/` | Translations: one folder per language, string tables in DFU's format (`locales/README.md`). |
| `play/`, `privacy/`, `terms/` | Static pages served beside the game. |
| `*.html` at the root | The game's entry (`index.html`) and the labs: one page per prototype or viewer, each registered in `vite.config.js`. |

### The game client, `src/`

| Directory | What lives there |
|---|---|
| `src/` | `main.js`, the entry point and scene router; `buildTag.js`, written by the build. |
| `src/ai/` | Enemy behaviour: tactics, blows, the navmesh. |
| `src/characters/` | People and creatures: bodies and rigs, outfits and dyes, enemies, NPC builders. |
| `src/combat/` | Combat law: FormulaHelper's port, weapons, hits, spells in the hand. |
| `src/formats/` | The readers for Daggerfall's (and Morrowind's) file formats. Exact to DFU's (`Port-Doctrine.md`, Scope). |
| `src/net/` | Online: the client's link to the relay, the wire, and the law both ends run. The relay imports from here. |
| `src/player/` | The player's body in the world: motor, camera, first-person views, seats. |
| `src/poi/` | Points of interest: the editor's document, its import and export, and the feed the game stands. |
| `src/render/` | The WebGL2 renderer: programs, passes, meshes, textures, sky. |
| `src/scenes/` | The four hosts (`world.js`, `worldModes.js`, `dungeonContext.js`, `exterior.js`), loose, and the modules they wire (`*Host.js` - `Host-Split.md`). |
| `src/systems/` | Game law that is not combat or online: items, quests, guilds, travel, time, saving, sound. |
| `src/tools/` | The labs' code: the modules the root `*.html` lab pages load, and two they share. |
| `src/ui/` | Every window, menu and HUD element, classic and Enhanced. |
| `src/world/` | The world's assembly: terrain, blocks, locations, dungeons, buildings, water, the world's set pieces. |
| `src/assets/` | Source art the code imports (meshes, textures and their `source/` originals). Not mapped further. |

### Where is a feature?

A feature lives in a folder of its own name in each layer it has three or more modules in - its law in
`src/systems/`, what both ends run online in `src/net/`, its models in `src/world/`, its windows in `src/ui/`, its
wiring in `src/scenes/`. A feature with one or two modules in a layer keeps them loose there; grep the name.

| Feature | Its folders under `src/` |
|---|---|
| Abyss Dungeon (super dungeons) | `systems/superDungeon/`, `net/superDungeon/`, `world/superDungeon/`, `render/superDungeon/`, `scenes/superDungeon/`, `ui/superDungeon/` |
| Arena | `systems/arena/`, `net/arena/`, `world/arena/`, `scenes/arena/`, `ui/arena/` |
| Automap | `systems/automap/`, `ui/automap/` |
| Blood | `combat/blood/` |
| Bounty board | `systems/bounty/`, `ui/bounty/` |
| Card table (Hold'em) | `systems/card/`, `net/card/`, `world/card/`, `ui/card/` |
| Cities | `world/city/` |
| Climbing | `player/climb/` |
| Combat techniques | `combat/technique/` |
| Come Sail Away (boats) | `systems/comeSailAway/`, `scenes/comeSailAway/` |
| Deep Waters | `systems/deepWater/`, `world/deepWater/`, `scenes/deepWater/` |
| Diverse Weapons | `combat/diverseWeapons/` |
| Duels | `net/duel/` |
| Dungeons | `systems/dungeon/`, `world/dungeon/` |
| Dynamic Skies | `systems/dynamicSkies/` |
| Enemies | `characters/enemy/` |
| Enhanced Plus | `ui/plus/` |
| Enhanced skin | `ui/enhanced/` |
| Eye Of The Beholder | `player/eyeOfTheBeholder/` |
| Factions | `systems/faction/` |
| Firmament | `net/firmament/` |
| First-person weapon | `combat/weapon/` |
| Foraging | `systems/foraging/` |
| Grammar (translations) | `systems/grammar/` |
| Guilds | `systems/guild/`, `net/guild/` |
| Guns | `combat/gun/` |
| Home decorating | `systems/decor/`, `scenes/decor/` |
| Horses | `systems/horse/` |
| HUD (classic) | `ui/hud/` |
| Iliac Hand | `systems/iliac/`, `net/iliac/` |
| Ink maps | `ui/ink/` |
| Interiors | `world/interior/` |
| Intro | `ui/intro/` |
| Items | `systems/item/`, `ui/item/` |
| King's Gambit | `systems/gambit/`, `net/gambit/` |
| Level up | `ui/levelUp/` |
| Living world | `systems/livingWorld/`, `scenes/livingWorld/` |
| Loot | `systems/loot/` |
| Map | `systems/map/`, `ui/map/` |
| Menu | `ui/menu/` |
| Merchant yards | `world/merchantYards/` |
| Merchants | `ui/merchant/` |
| Mobile units | `characters/mobile/` |
| Morrowind formats | `formats/morrowind/` |
| Music | `systems/song/` |
| Native windows (classic) | `ui/native/` |
| Naval (ships and the sea) | `systems/naval/`, `scenes/naval/`, `ui/naval/` |
| Navmesh | `ai/nav/` |
| Oblivion Gate (world boss) | `systems/gate/`, `net/gate/`, `world/gate/`, `render/gate/`, `scenes/gate/`, `ui/gate/` |
| Online save | `systems/online/` |
| Other players | `net/peer/` |
| Own 3D models | `characters/ownModels/` |
| Paperdoll | `characters/paperdoll/`, `tools/paperdoll/` |
| Party | `systems/party/` |
| Points of interest | `ui/poi/` |
| Professions | `systems/professions/`, `ui/professions/` |
| Project Legacy | `systems/legacy/`, `ui/legacy/` |
| Quests | `systems/quest/`, `scenes/quest/`, `ui/quest/` |
| Raids | `net/raid/` |
| Realm | `net/realm/` |
| Regions | `systems/region/` |
| Resting | `systems/rest/` |
| Revenant | `systems/revenant/`, `ui/revenant/` |
| Rewrite Engine rig | `characters/rewrite/` |
| Roads | `world/road/` |
| Roleplay Realism | `systems/roleplayRealism/` |
| Roleplay Realism: Items | `systems/roleplayRealismItems/` |
| Saves | `systems/save/`, `formats/save/` |
| Sea serpent (world boss) | `systems/serpent/`, `net/serpent/` |
| Settings | `systems/settings/`, `ui/settings/` |
| Ships (models) | `world/ships/` |
| Sieges | `net/siege/` |
| Sigil Sets | `systems/sigil/` |
| Spells | `systems/spell/`, `ui/spell/` |
| Survival | `systems/survival/` |
| Talk | `systems/talk/` |
| Tamriel (the continent) | `world/tamriel/` |
| Terrain | `world/terrain/` |
| Touch controls | `ui/touch/` |
| Towns | `systems/town/`, `ui/town/` |
| Travel | `systems/travel/`, `ui/travel/` |
| Underwater | `world/underwater/` |
| Unity bundles | `formats/unity/` |
| Upkeep (horse care, wagon wear) | `systems/upkeep/` |
| UV editing | `poi/uv/` |
| Vanilla Enhanced | `systems/vanillaEnhanced/` |
| Vendors | `ui/vendor/` |
| Voxel pieces | `characters/pieces/` |
| Wagons | `systems/wagon/`, `scenes/wagon/` |
| Water | `world/water/` |
| Weather | `systems/weather/` |
| Wind | `systems/wind/` |
| World of Daggerfall | `world/worldOfDaggerfall/` |
| WorldData | `formats/worldData/` |
| Wrothgarian zone (open PvP) | `systems/wild/`, `net/wild/`, `ui/wild/` |

### The feature folders, layer by layer

#### `src/ai/`

| Folder | What lives there |
|---|---|
| `src/ai/nav/` | The navmesh: its bake, worker and client. |

#### `src/characters/`

| Folder | What lives there |
|---|---|
| `src/characters/enemy/` | Enemies: entity, motor, attacks, casting, sounds. |
| `src/characters/mobile/` | DFU's mobile units: types, persons, factions. |
| `src/characters/ownModels/` | The port's own 3D models: heads, armour, clothing, weapons. |
| `src/characters/paperdoll/` | The paperdoll. |
| `src/characters/pieces/` | The voxel pieces a character is built from (heads, bodies, armour, weapons). |
| `src/characters/rewrite/` | project-final's Rewrite Engine rig, vendored byte for byte (`test/rig.test.js`). |

#### `src/combat/`

| Folder | What lives there |
|---|---|
| `src/combat/blood/` | Blood: bleeding, decals, gibs, marks. |
| `src/combat/diverseWeapons/` | The Diverse Weapons mod. |
| `src/combat/gun/` | Guns. |
| `src/combat/technique/` | Combat techniques. |
| `src/combat/weapon/` | The first-person weapon: rig, alignment, the widget. |

#### `src/formats/`

| Folder | What lives there |
|---|---|
| `src/formats/morrowind/` | Morrowind's formats: NIF, ESM, BSA, DDS, the body. |
| `src/formats/save/` | Saving and loading. |
| `src/formats/unity/` | Unity asset bundles, for the mods that ship them. |
| `src/formats/worldData/` | DFU's WorldData JSON and its patches. |

#### `src/net/`

| Folder | What lives there |
|---|---|
| `src/net/arena/` | The Arena: bouts, the ladder, the league (`11-Multiplayer/Arena.md`) - online - the law both ends run. |
| `src/net/card/` | The tavern's card table: Hold'em and the regulars (`11-Multiplayer/Tavern-Cards.md`) - online - the law both ends run. |
| `src/net/duel/` | Duels between players - online - the law both ends run. |
| `src/net/firmament/` | The Firmament (`06-Systems/Firmament.md`) - online - the law both ends run. |
| `src/net/gambit/` | The King's Gambit (`11-Multiplayer/Kings-Gambit.md`) - online - the law both ends run. |
| `src/net/gate/` | The Oblivion Gate, the world boss on the shared clock (`11-Multiplayer/World-Bosses.md`) - online - the law both ends run. |
| `src/net/guild/` | The guilds: services, halls, the guild book and vault - online - the law both ends run. |
| `src/net/iliac/` | Iliac Hand, the tavern's other card game - online - the law both ends run. |
| `src/net/peer/` | Other players: their bodies, riders, effects and pace - online - the law both ends run. |
| `src/net/raid/` | Town raids - online - the law both ends run. |
| `src/net/realm/` | The realm's gold, trade and save codec - online - the law both ends run. |
| `src/net/serpent/` | The sea serpent, the sea's world boss (`11-Multiplayer/Sea-Serpent.md`) - online - the law both ends run. |
| `src/net/siege/` | Sieges of a seat - online - the law both ends run. |
| `src/net/superDungeon/` | The Abyss Dungeon, the super dungeons (`11-Multiplayer/Super-Dungeons-Look.md`) - online - the law both ends run. |
| `src/net/wild/` | The Wrothgarian open zone (`11-Multiplayer/Wild-Zone.md`) - online - the law both ends run. |

#### `src/player/`

| Folder | What lives there |
|---|---|
| `src/player/climb/` | Climbing: its feel, pose and sounds. |
| `src/player/eyeOfTheBeholder/` | The Eye Of The Beholder mod: the billboard body. |

#### `src/poi/`

| Folder | What lives there |
|---|---|
| `src/poi/uv/` | The POI editor's UV editing. |

#### `src/render/`

| Folder | What lives there |
|---|---|
| `src/render/gate/` | The Oblivion Gate, the world boss on the shared clock (`11-Multiplayer/World-Bosses.md`) - its passes. |
| `src/render/superDungeon/` | The Abyss Dungeon, the super dungeons (`11-Multiplayer/Super-Dungeons-Look.md`) - its passes. |

#### `src/scenes/`

| Folder | What lives there |
|---|---|
| `src/scenes/arena/` | The Arena: bouts, the ladder, the league (`11-Multiplayer/Arena.md`) - the hosts' wiring. |
| `src/scenes/comeSailAway/` | Come Sail Away's boats (`03-World/Come-Sail-Away.md`) - the hosts' wiring. |
| `src/scenes/decor/` | Decorating a home: the catalogue, placing, the rooms - the hosts' wiring. |
| `src/scenes/deepWater/` | Deep Waters: swimming, the sea floor, its fish, encounters and loot - the hosts' wiring. |
| `src/scenes/gate/` | The Oblivion Gate, the world boss on the shared clock (`11-Multiplayer/World-Bosses.md`) - the hosts' wiring. |
| `src/scenes/livingWorld/` | The living world: its people, towns, caravans, outlaws and trips (`06-Systems/Living-World-II.md`) - the hosts' wiring. |
| `src/scenes/naval/` | Ships and the sea: naval combat, crews, ship life, harbours - the hosts' wiring. |
| `src/scenes/quest/` | Quests - the hosts' wiring. |
| `src/scenes/superDungeon/` | The Abyss Dungeon, the super dungeons (`11-Multiplayer/Super-Dungeons-Look.md`) - the hosts' wiring. |
| `src/scenes/wagon/` | Wagons: kinds, looks, seats, ropes, the town watch (`06-Systems/Wagons.md`) - the hosts' wiring. |

#### `src/systems/`

| Folder | What lives there |
|---|---|
| `src/systems/arena/` | The Arena: bouts, the ladder, the league (`11-Multiplayer/Arena.md`) - the law. |
| `src/systems/automap/` | The automap, the dungeon and town map in the corner and in its window - the law. |
| `src/systems/bounty/` | The bounty board, its journal and its rewards - the law. |
| `src/systems/card/` | The tavern's card table: Hold'em and the regulars (`11-Multiplayer/Tavern-Cards.md`) - the law. |
| `src/systems/comeSailAway/` | Come Sail Away's boats: the boat itself, its hulls, models, items and waves, the helm's actions, the map, the wire's words and the boat's menu (`03-World/Come-Sail-Away.md`). |
| `src/systems/decor/` | Decorating a home: the catalogue, placing, the rooms - the law. |
| `src/systems/deepWater/` | Deep Waters: swimming, the sea floor, its fish, encounters and loot - the law. |
| `src/systems/dungeon/` | A dungeon's state: its respawn, tier, echo and sense - the law. |
| `src/systems/dynamicSkies/` | The Dynamic Skies mod - the law. |
| `src/systems/faction/` | The factions' relations, reputation and standing - the law. |
| `src/systems/foraging/` | The Foraging mod - the law. |
| `src/systems/gambit/` | The King's Gambit (`11-Multiplayer/Kings-Gambit.md`) - the law. |
| `src/systems/gate/` | The Oblivion Gate, the world boss on the shared clock (`11-Multiplayer/World-Bosses.md`) - the law. |
| `src/systems/grammar/` | Language grammar for the translations (`06-Systems/Localization-Arc.md`). |
| `src/systems/guild/` | The guilds: services, halls, the guild book and vault - the law. |
| `src/systems/horse/` | The horse and cart, the horses' coats, a horse that follows - the law. |
| `src/systems/iliac/` | Iliac Hand, the tavern's other card game - the law. |
| `src/systems/item/` | Items: templates, the item law, ids, powers, binding, dye - the law. |
| `src/systems/legacy/` | Project Legacy: age, family, heirs, the realm line (`06-Systems/Legacy-Arc.md`). |
| `src/systems/livingWorld/` | The living world: its people, towns, caravans, outlaws and trips (`06-Systems/Living-World-II.md`). |
| `src/systems/loot/` | Loot: its tables, powers, rarity, curses, the codex - the law. |
| `src/systems/map/` | The map's tabs, directory and waypoints - the law. |
| `src/systems/naval/` | Ships and the sea: naval combat, crews, ship life, harbours, trade goods. |
| `src/systems/online/` | The online save: checkpoints, homes, the lane, the sync - the law. |
| `src/systems/party/` | A party: travelling, resting and walking together - the law. |
| `src/systems/professions/` | The professions: their items, sounds and pages (`06-Systems/Professions-Arc.md`) - the law. |
| `src/systems/quest/` | The quest machine: the parser, its tables, actions and conditions. |
| `src/systems/region/` | A region's conditions, hubs and power - the law. |
| `src/systems/rest/` | Resting: the rest window, its supplies and its warning - the law. |
| `src/systems/revenant/` | The Revenant: the feud, its companions, its fate - the law. |
| `src/systems/roleplayRealism/` | The Roleplay Realism mod - the law. |
| `src/systems/roleplayRealismItems/` | The Roleplay Realism: Items mod - the law. |
| `src/systems/save/` | Saving and loading - the law. |
| `src/systems/serpent/` | The sea serpent, the sea's world boss (`11-Multiplayer/Sea-Serpent.md`) - the law. |
| `src/systems/settings/` | The settings: defaults, words, the law and the map of them - the law. |
| `src/systems/sigil/` | Sigil Sets (`11-Multiplayer/Sigil-Sets.md`) - the law. |
| `src/systems/song/` | Music: the songs, their player and manager - the law. |
| `src/systems/spell/` | Spells: effects, the spell maker, power, icons - the law. |
| `src/systems/superDungeon/` | The Abyss Dungeon, the super dungeons (`11-Multiplayer/Super-Dungeons-Look.md`) - the law. |
| `src/systems/survival/` | Survival: needs, camping, food, rest, exposure. |
| `src/systems/talk/` | Talking to people: topics, sessions, macros - the law. |
| `src/systems/town/` | A town's population, seats, watch and quarters - the law. |
| `src/systems/travel/` | Travel: the map, routes, pace, autopilot, ports - the law. |
| `src/systems/upkeep/` | Upkeep: a horse's care and a wagon's wear (`06-Systems/Horse-Care.md`, `06-Systems/Wagon-Upkeep.md`) - the law. |
| `src/systems/vanillaEnhanced/` | The Vanilla Enhanced texture pack (`Port-Doctrine.md`, its exception) - the law. |
| `src/systems/wagon/` | Wagons: kinds, looks, seats, ropes, the town watch (`06-Systems/Wagons.md`) - the law. |
| `src/systems/weather/` | Weather: fronts, the field, the sim, the map - the law. |
| `src/systems/wild/` | The Wrothgarian open zone (`11-Multiplayer/Wild-Zone.md`) - the law. |
| `src/systems/wind/` | Wind, its drive and its sound - the law. |

#### `src/tools/`

| Folder | What lives there |
|---|---|
| `src/tools/paperdoll/` | The paperdoll lab's skin. |

#### `src/ui/`

| Folder | What lives there |
|---|---|
| `src/ui/arena/` | The Arena: bouts, the ladder, the league (`11-Multiplayer/Arena.md`) - its windows. |
| `src/ui/automap/` | The automap, the dungeon and town map in the corner and in its window - its windows. |
| `src/ui/bounty/` | The bounty board, its journal and its rewards - its windows. |
| `src/ui/card/` | The tavern's card table: Hold'em and the regulars (`11-Multiplayer/Tavern-Cards.md`) - its windows. |
| `src/ui/enhanced/` | The Enhanced skin's windows and HUD - its windows. |
| `src/ui/gate/` | The Oblivion Gate, the world boss on the shared clock (`11-Multiplayer/World-Bosses.md`) - its windows. |
| `src/ui/hud/` | The classic HUD: vitals, compass, crosshair, active spells - its windows. |
| `src/ui/ink/` | The ink maps: town, dungeon, automap - its windows. |
| `src/ui/intro/` | The intro: its screen, map, landscape and cue - its windows. |
| `src/ui/item/` | Items: templates, the item law, ids, powers, binding, dye - its windows. |
| `src/ui/legacy/` | Project Legacy: heirs and the realm line (`06-Systems/Legacy-Arc.md`) - its windows. |
| `src/ui/levelUp/` | Levelling up: the notice, the view - its windows. |
| `src/ui/map/` | The map's tabs, directory and waypoints - its windows. |
| `src/ui/menu/` | The menu's glyphs, pad and pictures - its windows. |
| `src/ui/merchant/` | A merchant's repair and service windows - its windows. |
| `src/ui/native/` | The classic native windows: inventory, talk, trade, panel - its windows. |
| `src/ui/naval/` | Ships and the sea: naval combat, crews, ship life, harbours - its windows. |
| `src/ui/plus/` | Enhanced Plus: the pad, its binds, the cursor - its windows. |
| `src/ui/poi/` | Points of interest: the editor's panels - its windows. |
| `src/ui/professions/` | The professions: their items, sounds and pages (`06-Systems/Professions-Arc.md`) - its windows. |
| `src/ui/quest/` | Quests - its windows. |
| `src/ui/revenant/` | The Revenant: the feud, its companions, its fate - its windows. |
| `src/ui/settings/` | The settings: defaults, words, the law and the map of them - its windows. |
| `src/ui/spell/` | Spells: effects, the spell maker, power, icons - its windows. |
| `src/ui/superDungeon/` | The Abyss Dungeon, the super dungeons (`11-Multiplayer/Super-Dungeons-Look.md`) - its windows. |
| `src/ui/touch/` | The touch layer: buttons, gestures, look - its windows. |
| `src/ui/town/` | A town's population, seats, watch and quarters - its windows. |
| `src/ui/travel/` | Travel: the map, routes, pace, autopilot, ports - its windows. |
| `src/ui/vendor/` | A vendor's page, tab and map mark - its windows. |
| `src/ui/wild/` | The Wrothgarian open zone (`11-Multiplayer/Wild-Zone.md`) - its windows. |

#### `src/world/`

| Folder | What lives there |
|---|---|
| `src/world/arena/` | The Arena: bouts, the ladder, the league (`11-Multiplayer/Arena.md`) - its models and assembly. |
| `src/world/card/` | The tavern's card table: Hold'em and the regulars (`11-Multiplayer/Tavern-Cards.md`) - its models and assembly. |
| `src/world/city/` | A city's gates, lights and navigation - its models and assembly. |
| `src/world/deepWater/` | Deep Waters: swimming, the sea floor, its fish, encounters and loot - its models and assembly. |
| `src/world/dungeon/` | A dungeon's state: its respawn, tier, echo and sense - its models and assembly. |
| `src/world/gate/` | The Oblivion Gate, the world boss on the shared clock (`11-Multiplayer/World-Bosses.md`) - its models and assembly. |
| `src/world/interior/` | Interiors: layout, lights, glass - its models and assembly. |
| `src/world/merchantYards/` | A town's Stable and Wagon Yard (`03-World/Merchant-Yards.md`) - its models and assembly. |
| `src/world/road/` | Roads: the network, its painter, verges and clearance - its models and assembly. |
| `src/world/ships/` | The port's own ships: the galleon, the carrack, the large boat - its models and assembly. |
| `src/world/superDungeon/` | The Abyss Dungeon, the super dungeons (`11-Multiplayer/Super-Dungeons-Look.md`) - its models and assembly. |
| `src/world/tamriel/` | The continent's ground: geography, frame, raster - its models and assembly. |
| `src/world/terrain/` | Terrain generation, its worker and sampler - its models and assembly. |
| `src/world/underwater/` | Under the water: its look, decorations, enemies and loot - its models and assembly. |
| `src/world/water/` | The water's bed, corners and ripples - its models and assembly. |
| `src/world/worldOfDaggerfall/` | The World of Daggerfall mod's locations - its models and assembly. |

## Where a new file goes

1. **By layer first.** Law that both ends run goes in `src/net/`; drawing goes in `src/render/`; a window goes in
   `src/ui/`; game law goes in `src/systems/` (or `src/combat/`, `src/ai/`). The layer is what the relay's and the
   account Worker's bundles depend on: they import law and never UI, so a feature's law and its window live apart
   on purpose.
2. **Then by feature.** A feature with three or more modules in one layer gets a folder in that layer, named for
   the feature in camelCase (`src/systems/comeSailAway/`, `src/systems/livingWorld/`). Its fourth module goes in the
   folder, not beside it.
3. **Loose is for shared things.** A file left loose in a layer is either used across features or one of a
   feature's first two modules.
4. **A new folder takes its row in the table above** in the same change. The test fails until it does.

## How a file moves

`node tools/moveModule.mjs <destination> <file>...` moves files with `git mv` and rewrites every address of them:
the relative imports to and from them, the paths the tests read (`rd('src/systems/x.js')`), an import a pin quotes
from another file (`'../systems/x.js'`), the bible's paths and cites, the mutation lists' `file` and the source their
records quote, the workflows' `paths:`. `--dry-run` says what it would change. The rules:

- **A move changes the directory, never the name.** The bible's cites by file name alone (CITE-ANCHOR's basename form) keep
  resolving, and `git log --follow` keeps the history.
- **One feature a change.** A move is reviewable when it is one cluster; the diff is mechanical and should read as
  such.
- **Read the BLIND lines.** The tool names what it cannot rewrite. A test that sweeps a directory without recursing
  (`readdirSync('src/systems')`) stops seeing a file that leaves and passes on what is left: make the sweep recurse,
  or confirm it only counts, before the move lands. An import or a URL built from a template into the old folder
  (`import(`../systems/${name}.js`)`) cannot be rewritten. A quoted `./x.js` outside the folder `x.js` moved to could be
  relative to any file, and a path escaped for a pattern (`systems\/x\.js`) is no path to rewrite: read each one and
  fix it by hand. The tool cannot see a sweep whose directory is a variable (`test/audit18_bible_docs.test.js`'s U42
  is one), so grep for `readdirSync` over the old directory too.
- **A move does not touch the relay on its own.** The relay's version is the bytes of its bundle
  (`test/relayversion.test.js`): a moved file in it, a re-based import, even a path in one of its comments is a new
  `RELAY_VERSION`, forty-odd pins moved, and a deploy on merge that drops every connected player. The tool prints a
  RELAY line for each such file and refuses to write unless told `--relay`. A cluster that touches the relay waits
  for a slice that bumps the version anyway, and rides it. (`src/net/wire.js` names most of `src/systems/` in its
  comments, so most clusters do.) The account Worker is not like this: it holds no sockets, its deploy restarts
  nothing a player is on, and the tool rewrites its deploy filter's `paths:` with everything else.
- **The gates run as for any change** (CLAUDE.md, "Before a push").

## The plan

Proposed, to be settled with the team before each step. Each step is one pull request, made by the tool.

| Step | What | Status |
|---|---|---|
| TIDY1 | This map, its test, the move tool, and the pilot: Come Sail Away's ten modules (`comeSailAway*` and `csaBoatMenu.js`) into `src/systems/comeSailAway/` - a cluster the relay's bundle does not touch. | Shipped |
| TIDY2 | `src/systems/`'s clusters that leave the relay alone, one per change: `guild*` (7), `rr*` (5), `rri*` (5). | Proposed |
| TIDY2b | The clusters whose move changes the relay's bytes - each rides a slice that bumps `RELAY_VERSION` anyway: `travel*` (18), `arena*` (16), `item*` (13), `loot*` (9), `wild*` (8), `decor*` (8), `revenant*` (7), `party*` (7), `wagon*` (6), `rest*` (6), `horse*` (5), `iliac*` (5), `weather*` (5), `sd*` (5). | Proposed |
| TIDY3 | The same in `src/world/` (`sd*` 21, `deep*` 15, `terrain*` 8, `wod*` 8), `src/net/` (`gate*` 10, `sd*` 9, `serpent*` 8) and `src/ui/` (`enhanced*` 42, `hud*` 14, `travel*` 9, `gate*` 8). Seven tests sweep `src/ui/` without recursing, and U42 counts it - they recurse first. | Proposed |
| TIDY4 | `src/scenes/`: the 32 `*Host.js` modules. Ten tests sweep `src/scenes/` without recursing (`boot1`, `inputmap`, `renowngate` and others) - they recurse first. | Proposed |
| TIDY5 | `test/`: 3,282 files in one folder, named by the slice that wrote them (`audit24_`, `fb1001_`) rather than by what they test. `manifest.test.js`, the shards and Testing.md all key on the bare file name, so this step needs its own design. | Open question |
| TIDY6 | The root's lab pages into one folder, and `01-Overview/`'s dated records apart from its overview pages. | Open question |

One question stays open across all of them: **layer first, or feature first?** The arena's code spans five layers
(16 modules in `src/systems/`, 6 in `src/net/`, 5 in `src/world/`, 3 in `src/scenes/`, 2 in `src/ui/`). A
feature-first tree (`src/features/arena/` holding all of them) puts a feature in one place, but the bundles that
must never pull UI in (the relay, the account Worker) would then need a rule inside every feature folder instead of
one at the layer. This page proposes layer first because it is what the tree already does (`src/systems/naval/`,
`src/systems/quest/`) and because the tool makes a later change of mind cheap.

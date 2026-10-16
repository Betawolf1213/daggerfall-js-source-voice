# CODE MAP - where things live, and where a new file goes

Opened 2026-10-16 (TIDY1). A teammate's read of the tree: the directories are not documented and do not make sense,
things are placed where they lie, and nobody knows where anything is. Mac: *"Well I wanna take this on"*.

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
| `src/ai/` | Enemy behaviour: tactics, blows, navmesh and its worker. |
| `src/characters/` | People and creatures: bodies and rigs, outfits and dyes, the enemies' entities, motors and tables, NPC builders. |
| `src/characters/pieces/` | The voxel pieces a character is built from (heads, bodies, armour, weapons). |
| `src/characters/rewrite/` | project-final's Rewrite Engine rig, vendored byte for byte (`test/rig.test.js`). |
| `src/combat/` | Combat law: FormulaHelper's port, weapons, hits, spells in the hand. |
| `src/formats/` | The readers for Daggerfall's (and Morrowind's) file formats. Exact to DFU's (`Port-Doctrine.md`, Scope). |
| `src/net/` | Online: the client's link to the relay, the wire, and the law both ends run. The relay imports from here. |
| `src/player/` | The player's body in the world: motor, camera, first-person views, seats. |
| `src/poi/` | Points of interest: the editor's document, its import and export, and the feed the game stands. |
| `src/render/` | The WebGL2 renderer: programs, passes, meshes, textures, sky. |
| `src/scenes/` | The four hosts (`world.js`, `worldModes.js`, `dungeonContext.js`, `exterior.js`) and the modules they wire (`*Host.js` - `Host-Split.md`). |
| `src/systems/` | Game law that is not combat or online: items, quests, guilds, travel, time, saving, sound. Most of the tree's loose files are here. |
| `src/systems/comeSailAway/` | Come Sail Away's boats: the boat itself, its hulls, models, items and waves, the helm's actions, the map, the wire's words and the boat's menu (`03-World/Come-Sail-Away.md`). |
| `src/systems/grammar/` | Language grammar for the translations (`06-Systems/Localization-Arc.md`). |
| `src/systems/legacy/` | Project Legacy: age, family, heirs, the realm line (`06-Systems/Legacy-Arc.md`). |
| `src/systems/livingWorld/` | The living world: its people, towns, caravans, outlaws and trips (`06-Systems/Living-World-II.md`). |
| `src/systems/naval/` | Ships and the sea: naval combat, crews, ship life, harbours, trade goods. |
| `src/systems/quest/` | The quest machine: the parser, its tables, actions and conditions. |
| `src/systems/survival/` | Survival: needs, camping, food, rest, exposure. |
| `src/tools/` | The labs' code: the modules the root `*.html` lab pages load, and two they share. |
| `src/tools/paperdoll/` | The paperdoll lab's skin. |
| `src/ui/` | Every window, menu and HUD element, classic and Enhanced. |
| `src/world/` | The world's assembly: terrain, blocks, locations, dungeons, buildings, water, the world's set pieces. |
| `src/assets/` | Source art the code imports (meshes, textures and their `source/` originals). Not mapped further. |

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

# Daggerfall Enemy Expansion (DEX)

Mac, 2026-10-19, handing over `Daggerfall Enemy Expansion-372-1-3-4-1708711071 (1).7z`: "I want to implement this as
our next mod 1:1. We also need to ensure these get proper morrowind model replacements if applicable".

Kamer & Kab's **Daggerfall Enemy Expansion 1.3.4** (Nexus mod 372; the Unity project is `DaggerfallBestiaryProject`,
its log tag `[DEX]`, which is this arc's code). Fifty new enemies, sixteen classic ones restatted, new encounter tables
for every dungeon and climate, four spells, the on-hit effects, a Troll that gets back up. The vendored record -
provenance, what each file is, where the art went and why - is `vendor/daggerfall-enemy-expansion/README.md`; this
page is the port's.

## 1. What the mod is, read off its own source

The bundle carries the compiled `Daggerfall Enemy Expansion.dll` and no C#; the authors publish their source
(`github.com/SquidKamer/DaggerfallBestiaryProject`), and the commit "Updated to 1.3.4" (`c187c97`, 2024-02-23) is the
shipped assembly - every string literal of its eight scripts is in the DLL's user-string heap, every member they
declare in its metadata, and no script changed after it (`test/systems/enemyExpansion/dex0_record.test.js`). The
TABLES are another matter: the bundle's `DefaultTableReplacement.tdb.csv` is no commit's (`d28793f`'s with two rows
changed - a working copy was built), so the port reads the bundle's, verbatim.

The mod in DFU's terms (`BestiaryMod.cs`, cited below by line):

- **Start** (:172-197): a text provider for the custom names, then the five tables parsed - the careers
  (`.cdb.csv`, :326-589: a DFCareer per row, its eight stats, HP per level, six tolerances and four attack
  modifiers, a row naming a classic career replacing its fields), the enemies (`.mdb.csv`, :663-1345: a MobileEnemy
  per row appended to `EnemyBasics.Enemies`, or a classic one's fields replaced; a quest foe name for each new one),
  the encounter tables (`.tdb.csv`, :1633-1726) and the spellbook tables (:1884-1954) - and five hooks:
  `EnemyEntity.OnLootSpawned` (spells, forced gender, the ghost shader), FormulaHelper's `OnMonsterHit`,
  `CalculateWeaponAttackDamage`, `GetEnemyEntityEnemyGroup` and `GetEnemyEntityLanguageSkill`, the dungeon and
  climate events that pick a table, `EnemyDeath.OnEnemyDeath` (the Troll's corpse) and
  `EnemyEntity.AssignEnemyStartingEquipment` (DEX_RRICompat's).
- **The first Update** (:210-269): a `Default<type>` table for each of the 19 dungeon types, the water (19) and the 18
  climate tables (20-37), built from DFU's own `RandomEncounters.EncounterTables` unless the mod's tables named one.
- **A dungeon's table** (:1728-1753, :1768-1782): on the transition into a dungeon, one of the tables for its type,
  chosen by `DFRandom.srand(Unknown2 ^ (region << 8))` - the same table every visit - and one of the water's.
- **A climate's** (:1784-1871): on a climate change or a location rect's exit, the climate's day and night tables; on
  entering a location rect, its city-night table - each `UnityEngine.Random.Range` over the type's tables.

## 2. The decisions (Mac, 2026-10-19)

- **Permission**: "Yes, record my word" - recorded in the README and the registry; the authors' own words are the
  open record.
- **The art** (`vendor/daggerfall-enemy-expansion/README.md`, Where the art is): every one of the 6,358 pictures the
  tables draw was measured against every TEXTURE record (`tools/dexExtract.mjs`). 858 ARE Daggerfall's records - the
  five unused rider sets, TEXTURE.491-495, and the Will-o'-wisp, TEXTURE.379 - and are rebuilt from the player's own
  files, never carried. 714 are Daggerfall's sprites under the authors' paint, and Mac approved them on
  **Port-Doctrine's fourth exception** ("Approve 3rd exception" - asked as the third, numbered the fourth past LAYERED-GEAR's at the merge, then "Yes, cover all of them" once the measure found
  four more than the first count). The 1995 demo's four (Bat, Gargoyle, Nymph, Skeleton) are the mod's own art: the
  doctrine names the retail ARENA2 ("Mod art, ship it").
- **The class skins** (SKIN2): the same measure, run on `vendor/class-skins/`, found most of its sheets to be
  Daggerfall's class sprites at their own size, not drawings at twice it - "Bring under 3rd exception": the
  exception names its directory too, and its doctrine row and README say what it is.
- **Morrowind**: "ensure these get proper morrowind model replacements if applicable" - section 4.

## 3. The slices

| Slice | What | State |
|---|---|---|
| DEX0 | the record: the vendored files, the art in its three places, the doctrine's fourth exception, the registry row, the credit, the switch (on), the online decision (the room's, whole: Meaner Monsters' reading) | SHIPPED |
| DEX1 | the enemy registry: rows past the classic 0-42 and 128-146, the careers, the classic replacements, the names, the quest foes | SHIPPED (section 5) |
| DEX2 | the sprites on the texture door: a non-classic archive's real frame counts, the xml scales, the emission maps, NoShadow and the ghost shader by behaviour (DFU's own rows too) - section 6 | SHIPPED (the glow's light routed, Ledger C) |
| DEX3 | the encounter tables in all four hosts: the dungeon's seeded choice, the water's, the climates' - on a door every reader asks, the climates' on PlayerGPS's events | SHIPPED (section 7) |
| DEX4 | combat: the on-hit effects, spells 500-503 and the spellbook tables, the skeletal rule, groups and languages, forced gender, ranged | SHIPPED - DEX4a (section 8: the spells, the spellbooks), DEX4b (section 9: the hit's effects, the skeletal rule, groups and languages, forced gender); ranged rode DEX1's rows |
| DEX5 | the Troll's corpse: up again after ten seconds unless a spell's missile burns it, saved with the game, the cheat | SHIPPED - DEX5a (section 11: the prefab door, the rise, the burn, the save, the cheat), DEX5b (section 11, Online: a body gone on the record, a copy's missile to the runner; relay world230 grown in place) |
| DEX6 | DEX_RRICompat: the new classes equipped by their tables under Roleplay & Realism: Items | open |
| DEX7 | the Morrowind bodies (section 4) | SHIPPED (section 10) |

## 4. Morrowind

Planned under DEX7 against the rules the port already keeps (`bible/04-Characters/Morrowind-NPCs.md` section 14b,
`src/characters/creatureBodies.js` CREATURE_MATCH): a new creature takes a Morrowind creature's body only where
Morrowind has that creature and it moves the same way (a flyer a flyer, a swimmer a swimmer), its CREA id read off
UESP, never recalled; a person-shaped class (the necromancers, the witches) is drawn as a person; and where Morrowind
has no such creature the row says so, and the mod's own sprite stands. SHIPPED as section 10, which AMENDS this plan
on the riders: the same law (it moves the same way) keeps their sprites - a rider's horse is its sprite's, and no
person's body rides.

## 5. DEX1 - the enemy registry

What DFU gives a mod to add an enemy, and what `BestiaryMod.Start` does with it, ported as two halves: the doors in the
port's enemy code that any mod could use, and the mod's reading through them.

**The doors** (DFU's, each at one home - ONE DFU MEMBER, ONE EXPORT):

- `characters/enemy/customEnemies.js` - `DaggerfallEntity.RegisterCustomCareerTemplate` / `GetCustomCareerTemplate`
  (an id's career, read lazily from the player's files when its base is Daggerfall's) and the text provider's
  `GetCustomEnemyName` chain. A leaf: the relay's bundle reads it through `enemyBasics.js`.
- `characters/enemy/enemyBasics.js` - `ENEMY_BASICS` is no longer frozen: DFU's `EnemyBasics.Enemies` is an array a
  mod replaces (`registerEnemyRows`, BestiaryMod.cs:1343), and a mod's edit of a classic row is written over the row
  every reader then sees. `isClassicEnemyId` (a MobileTypes member), `enemyEntityType` (SetupDemoEnemy's rule: 0-42
  a monster, 128-146 a class, any other id a monster or a class by the 128 bit when a career is registered for it,
  else no enemy) and `enemyCareerIndex` (SetEnemyCareer's: a custom enemy's index is its id). `enemyDisplayName` names
  a custom id as `GetLocalizedEnemyName` does (TextManager.cs:443-460): the custom name, else the career's own.
- `characters/enemy/enemyEntity.js` - `loadEnemyCareer`, SetEnemyCareer's one door (a registered custom career first,
  then MONSTER.BSA's, then CLASS??.CFG's): the dungeon's and the exterior's two arms read it, so a mod's monster and a
  mod's class are built on DFU's arms. `registerMintRowEditor`: a mod that edits classic rows at Start edits them over
  the rows Meaner Monsters and the overhaul compose at a foe's mint, since DFU runs every mod's Init (theirs) before a
  MonoBehaviour's Start (this one's) - the order the dungeon reads.
- **The class test is DFU's.** The sites across the hosts, the revenants, the elites, the wild, the loot, the quest
  foe and the effects that wrote `mobileType >= 128` (or `< 128`, or `<= 146`) for "a class". DFU's test is
  `EnemyBasics.IsClassEnemyId`, the 128 bit, which is why the mod numbers its monsters 256-290 and its classes 384-398;
  read as `>= 128`, every one of its monsters would have been a person. Each site now asks `isClassEnemyId`,
  `enemyEntityType` or `enemyCareerIndex`; the two leaves that import nothing (`ai/blowShapes.js`,
  `systems/revenant/revenantPersonality.js`) write the bit and say so.
- **The vanilla rows by name** (`enemyBasics.js` VANILLA_ENEMY_BASICS): the table as DFU ships it, copied before any
  mod writes a row and frozen. King's Gambit's roster reads it (`net/kingsGambit.js`): the port DECIDED its roster is
  the vanilla rows, one for every client and the relay (`11-Multiplayer/Kings-Gambit.md`), and the mod writes sixteen
  classic rows' levels and health into the live table - a client reading the gambit's module after the mod's Start would
  have built a roster the relay refuses.
- **The relay's bounds** (`net/foeBounds.js` FOE_BOUND_ROWS): the most health and level a classic monster's row can
  stand at, over six profiles now - vanilla, Meaner Monsters, Meaner Monsters with the overhaul's edit, and the mod's
  classic lines over each (`dexInstall.js` dexClassicRow, the test's fold). Without it a room with the mod on would have
  had its Dragonling (146 health, the bound 60) and its Werewolf (level 9, the bound 8) refused as impossible. A row's
  third number is the level the progression share reads (`foeShare(basics.level)`, the table's row - vanilla or the
  mod's), so the relay reads no table at all and its bound is the same on every machine.
- **The wire** (`net/wire.js` FOE_TYPE_MAX, relay world229 - world225 on its branch): a streamed foe's kind was bounded at 255, which refused
  every record of a mod's foe whole; it is MobileTypes' own u16. A peer has the rows whatever its switch (below).

**The reading** (`systems/enemyExpansion/dexTables.js`, line for line as the C# reads, every column, default, `continue`
and `[DEX]` message): 43 careers of the mod's own beside DFU's 62, the fifty enemies, the classic edits, the spellbook
tables kept raw for DEX4, and a quest foe name for each new enemy. `systems/enemyExpansion/dexInstall.js` is Start,
run once from `scenes/shared.js` right after Roleplay & Realism's install (its enemy appearance is an Init):

- ALWAYS, whatever the switch: the fifty rows join the table, each with its career and its name.
- WHILE LOADED (the switch latched at the game's load, `modSettings.js` latchModLoaded - DFU loads a mod with the game):
  the sixteen classic monsters' rows and two classic classes' (the Monk, 140, and the Barbarian, 143) edited, and the new names added to the Foes table
  (`QuestMachine.FoesTable.AddIntoTable`, only where the table lacks the name - the Nymph is Daggerfall's).

**Departures, named** (Port-Ledger section A, DEX1):

- *The rows are registered whatever the switch.* In DFU a disabled mod registers nothing, so a game saved with a
  Goblin in it and loaded with the mod off finds no row for it. Here the row stays and nothing of the mod's reaches it
  (no table rolls it, no quest names it, no hook runs), so the save loads and the world is DFU's. A peer in a room
  whose switch differs from its own draws the room's foes the same way.

**Flags for the slices after** (not departures from DFU, which has neither system):

- The relay's health bound (`net/foeBounds.js`) does not know a mod's careers, so a mod's own kind (256 and up) is
  *unverified* there, as every kind it holds no row for is; a class bound by the classic classes' hit points would be
  wrong for a mod's class with its own. (The mod edits no classic career, so the classic classes' bound stands.)
- The Enhanced AI's telegraphed blows (TACT4's families, `ai/blowShapes.js`) name no mod's kind: a mod's monster throws
  none, as an unnamed kind throws none, until a slice gives them families.
- King's Gambit's roster takes a monster below 128 or one of its ranged classes, by its own rule - with both mods
  loaded in DFU its roster has none of the mod's either.

Tests: `test/systems/enemyExpansion/dex1_registry.test.js` (the reading column by column, the C#'s slips kept - a new
class's attack sound written to its bark - the careers' tolerances and attack modifiers read back, Enum.Parse's rules,
the install's two halves, DFU's mod order over Meaner Monsters, both build arms, the quest foes; with ARENA2, a career
borrowed from Daggerfall's files is a copy; the vanilla rows untouched by the install), the bounds' six profiles
(`test/net/foebounds_law.test.js`), the wire's pins (`auditworld6b.test.js`, `oncrash1.test.js`), and the moved source
pins and mutant records.

## 6. DEX2 - the sprites on the texture door

DFU draws a custom enemy from its archive's imported textures (`TextureReplacement.GetMobileBillboardMaterial`): each
record from frame 0 to the first frame missing, a frame's `_Emission` map beside it, and the archive xml's scale on its
size. `systems/enemyExpansion/dexSprites.js` registers every picture DFU would import, from its one place - the authors'
own, the fourth exception's repaints, or rebuilt from the player's files (`derived.json`) - as the stand-in archive it is
(no TEXTURE file carries 1500-1617), whatever the switch, as the rows are.

- **The import, in the index.** `tools/dexExtract.mjs` now writes `frames` as DFU imports them: the bundle has gaps -
  1500's record 14 holds frames 0 and 7, its record 4 lacks frame 2 - and a picture past a gap ships and is never drawn,
  as in DFU. `emissive` is by frame (record -> frames): 1614's record 20 has no map for its frame 2.
- **A stand-in's frames** (`textureReplacement.js` vendorFrameCount): the stand-in answered one frame for every record,
  which no vendored art had needed until a mod's enemies walked - every mobile drawn from a stand-in stood on its first
  frame. It answers the registry's frames now, frame 0 to the first missing, cached until a registration moves the tiers.
- **The xml's scale** (`world/rmbFlats.js` mobileBillboardSize): DFU's mobile unit lays it on every record under
  AssetInjection, and DFU draws a mod's enemy only under AssetInjection. The port's vendored art draws ungated, so a
  stand-in's xml applies whatever the switch (the riders at 1.3, the Barbarian at 0.385 x 0.365); a classic sprite's
  still waits for the switch (Meaner Monsters' werewolf).
- **The emission** (`scenes/dataPipeline.js` uploadRecordFrame): an imported frame's `_Emission` map is uploaded under
  the frame's own key and lit white, as DFU's material is; an archive whose xml asks for emission lights a frame with no
  map of its own by its albedo (1614_20-2) - the registration hands the albedo in as the map.

**SetupDemoEnemy's renderer** (`SetupDemoEnemy.cs` :129-151), for DFU's own rows as much as the mod's - the port had
never drawn either for a classic enemy:

- **The ghost shader by behaviour** (`characters/enemy/foeLook.js` setupFoeLook, `render/renderer.js` ghostShaded): DFU
  lays it on a Spectral row's mobile (cutoff 0.1, alpha blended); the port keyed it to the classic ghosts' archives, which
  a mod's spectral enemy - the Gloom Wraith, the Faded Ghost, King Lysandus, the Will-o'-wisp, each on an archive of its
  own - never matched. The classic Ghost and Wraith are the only Spectral rows, on exactly those archives, so nothing
  classic moves. The mod's `Transparent` property lays it on a non-spectral enemy (BestiaryMod.cs:1394-1402, while the
  mod is loaded - `registerFoeGhost`); no row of 1.3.4 sets it. The shadow pass casts no ghost, as it cast no classic one.
- **NoShadow**: the mobile's batch casts none (the shadow pass's own `noShadow`).
- The hosts wear both where they make the batch (`setupFoeLook(renderer.createBillboardBatch(...))`, the dungeon's two
  arms and the street's pool) - an expression, so no host grows.
- **GlowColor's light is routed** (Port-Ledger C, AN ENEMY'S GLOW): a `LightAura` light at (0, 0.3, 0.2) in the row's
  colour, whose range and intensity are the prefab's - the editor asset, which no copy of DFU this work could reach
  carries. It is read before it is built, never guessed.

Tests: `test/systems/enemyExpansion/dex2_sprites.test.js` (every imported picture from its one place, none past a gap;
the stand-in's frames; the xml ungated on a stand-in only; the emission's two sources), `dex0_record.test.js` (the
index held to DFU's import).

## 7. DEX3 - the encounter tables

The mod ships one table database (`DefaultTableReplacement.tdb.csv`): a line for each of the 38 tables it has a default
for - the 19 dungeon types, the water, the six climate families' city night, day and night - with its own monsters in
them, and a second Laboratory table, `DwarvenLab`. `dexTables.js` reads it as `ParseEncounterTables` does
(BestiaryMod.cs:1633-1726, line for line: a replacement moves only to other, named indices; a new table joins its
indices before its ids parse; a short line, a short header, a new table with no indices refused) and adds the first
Update's defaults (:210-269), DFU's own tables copied for an index the mod names no default for - none, for 1.3.4.

**The door** (`characters/encounterTableDoor.js`). DFU's tables are an array a mod writes in place (`ref
RandomEncounters.EncounterTables[index]`), and every reader rolls from what it wrote; the port's array is DFU's,
generated and untouched, and a mod registers a selector that every reader asks through `encounterTable(index, place,
rolls)`:

- **The player's own rolls** - the encounter decision, the dungeon's rest, the camps' (`systems/encounters.js`
  playerReading marks them `local`) - read the table as the mod's events wrote it, DFU's own where they wrote none.
  DFU has no other kind of roll.
- **A dungeon's population** (`characters/dungeonEnemies.js` collectDungeonEnemies, handed `dungeonPlace(dfLocation)` -
  its LocationId and its seed) reads its type's table and the water's.
- **Any other roll is one every machine must agree on** - a granted member's species (`scenes/grantHost.js`), a
  roaming band's make, a road's trouble (`systems/livingWorld/trouble.js`). A machine's events are its own (the mod
  picks a climate's table by `UnityEngine.Random` as its player walks), so such a roll reads none of them: it reads one
  of the mod's tables for the index by its own die, and spends no draw where there is one (DFU's alone, or a mod's
  single table) - the roll it always was. A reader bounding a granted species takes every table the mod may pick.
  None of these readers is DFU's, so none is a departure from it; the shipped tables give every index but the
  Laboratory's one table, so only a trouble on the road to a laboratory draws for it.

**The picks** (`systems/enemyExpansion/dexEncounters.js`):

- **A dungeon's** (SelectDungeonTable, :1728-1753): on `PlayerEnterExit.OnPreTransition` into it - a door and a load
  alike (PlayerEnterExit.cs:914, :975) - one of its type's tables and one of the water's, each by
  `DFRandom.srand((ushort)Unknown2 ^ ((byte)region << 8))` and one `rand() % count`: the same pick every visit, on every
  machine. The transition always comes before the layout, and the population reads the two tables first, so the pick
  is made at that read; the rest roll then reads what it wrote. Of MAPS.BSA's 190 laboratories, both tables are picked.
  PreTransition's `Enum.IsDefined(DungeonTypes, ...)` guard has no arm: all 4,232 dungeons have a defined type.
- **A climate's** (SelectClimateTables and the rect's handlers, :1784-1871): a climate change or leaving a location's
  rect picks the climate's day and night tables, entering one its city night, on PlayerGPS's events.

**PlayerGPS's events** (`world/playerGps.js`). DFU raises `OnClimateIndexChanged`, then `OnEnterLocationRect` or
`OnExitLocationRect`, on the edges of the player's reading each frame (PlayerGPS.cs:561-576, :669-716), its trackers
starting at climate 0 and out of a rect - so the first frame raises the climate, and its entry if the player stands in
a town. The port's reading of the player's place is the encounter law's own: the decision and the camps' rolls raise
the events from their place, every minute they run out of doors (the hosts already hand them the climate and the widened
rect), so no host polls a second copy - bootWorld stands at its ceiling, and nothing about DFU's events needs a frame
the rolls do not have.

Departures (Port-Ledger A, the DEX row - SCOPE1's rule, each named):

- **The generator is put back.** DFU leaves DFRandom where the dungeon's pick left it; the port's pick stands inside
  the population, ahead of the fill's own srand, so it restores the shared stream.
- **The events ride the rolls' minutes**, not every frame: events between two readings are seen as one edge. A load or
  a fast travel resets PlayerGPS's rect flag (ResetState, :398-401), so DFU raises a second entry into a town it never
  left and re-draws its city night; the port sees no edge there and keeps the draw it had. With 1.3.4's tables - one an
  index outside the Laboratory - every such draw writes the same table.
- **A table whose ids will not parse** stays in its index's list and a pick that lands on it writes nothing (the C#'s
  `Select` throws before the write). Thrown in a PlayerGPS handler, DFU's throw also ends that frame's GPS update and
  raises the event again next frame; the port does not copy that stall. No table of 1.3.4 fails to parse.
- **The defaults are added at the read**, where DFU adds them at the mod's first Update, whose order against
  PlayerGPS's first Update is Unity's. 1.3.4 names all 38, so none is added.

Tests: `test/systems/enemyExpansion/dex3_encounters.test.js` (the reading line for line, the defaults, the dungeon's pick
against the C#'s LCG and with ARENA2 over every dungeon, PlayerGPS's edges, the climates' picks, the door's two reads,
every reader through it - the decision, the rest, the camps, a group's one table, a granted species, the population -
and the install), mutants `tools/mutants/dex3.json`.

## 8. DEX4a - the spells and the spellbooks

**The standard spells** (`systems/spell/standardSpells.js`). DFU builds them once - `EntityEffectBroker
.RebuildClassicSpellsDict` reads SPELLS.STD, merges every enabled mod's `SpellRecords.json` into the list
(`TextAssetReader.Merge`, matched by index), and folds it first-wins - and every list reads that one. The port read
SPELLS.STD and folded it in two places (the hosts' magic registries, chargen's); both build it in the one place now.
The merge, item by item in the mod's order: the first record of the item's index takes the item's fields over its
own; an index the list lacks is a new record off SpellRecordData's defaults (a name of `""`, every number -1, three
blank effects) with the item's fields on it, appended; `effects`, where named, is the item's array whole, each effect
EffectRecordData's zeros under its fields. The mod's four are new indices - 500 `!Blood Leech`, 501 `!Daemon Touch`,
502 `!Wrack`, 503 `!Bolt of Vengeance` - hidden from every shop by their `!`, as DFU hides them. Their cost is the
default -1, which nothing reads: a cast is priced off its effects (`spellcost.js` calculateCastCost), as DFU's is.

**The spellbooks** (`systems/enemyExpansion/dexSpells.js`). `ParseSpellbookTables` (BestiaryMod.cs:1884-1954) names
thirteen one-book tables - DFU's own thirteen career lists, which the C# restates - and `Class`, a ladder of seven
books by level that is DFU's `EnemyClassSpells[min(6, level / 3)]`; a row's raw `Spellbook` cell is a table named
after its id. At a foe's spawn (`SetEnemySpells`, :1404-1447, on EnemyEntity.OnLootSpawned) a row naming a table
casts the table's book for its level - the last whose `minLevel` the level reaches - in place of DFU's list; a level
no book reaches, or a table no one made, leaves DFU's. The port's door is `systems/enemySpells.js`
registerEnemySpellbook, asked first by `enemySpellIndices` - the one source every reader of what a foe casts reads:
its spawn, a peer's puppet cast resolved, a grant's copy at its owner's level. Of 1.3.4: the Homunculus, the Medusa,
the Snow Wolf, the Hell Hound, King Lysandus (503, the Bolt of Vengeance), the Dremora Churl and the Scamp cast raw
books; the Fire Daemon the FireDaedra table; the six spellcasting classes the ladder, which casts what DFU's would.

**The wire** (`net/wire.js` SPELL_INDEX_MAX): a cast's spell index rode as a u8, SPELLS.STD's; a foe casting one of
the mod's spells was refused whole. It is a u16 now - relay world230, grown in place (not yet deployed).

Departures (Port-Ledger A, the DEX row):

- **An unknown table is said once**, at the install, for each row naming one; the C# says it at each spawn. The door
  is asked by every reader of a foe's spells, not the spawn alone. No row of 1.3.4 names one.
- **A class that does not cast magic and names a table** would have its magicka set by the port's `setEnemySpells`
  (10 x level + 100, its magic skills at 80), where DFU leaves a class's that never went through `SetEnemySpells`. No
  row of 1.3.4 is one: every class naming a table casts magic.

Tests: `test/systems/enemyExpansion/dex4a_spells.test.js` (the merge field for field, the list with ARENA2, the tables
against the C#'s own arrays, the door, the install, the wire), mutants `tools/mutants/dex4a.json`.

## 9. DEX4b - the hit's effects, the skeletal rule, groups and languages, the forced gender

The mod's Start registers four FormulaHelper overrides (BestiaryMod.cs:183-186), and its OnLootSpawned handler forces
a row's gender. `systems/enemyExpansion/dexCombat.js` holds them; each rides a door of DFU's own shape.

- **OnMonsterHit** (`systems/diseases.js`). DFU's own asks `TryGetOverride("OnMonsterHit")` first and runs a mod's in
  its place (FormulaHelper.cs:1265-1270); the port's does now. DFU's switch is nine arms - numbered as the mod's `OnHit`
  column numbers them, the order its chain tests them in - and the mod's override is that switch become a chain
  (:1477-1561): each arm taken where the attacker is its classic monster OR its row names the arm's number, in order.
  So a classic GiantBat whose row named 1 would bite as the Rat, a Rat whose row named 3 stays the Rat. Arms 10-13 are
  the mod's own, each readying a spell on the attacker: the Blood Spider's Blood Leech (500), the Gloom Wraith's
  Silence (23), the Fire Daemon's Daemon Touch (501), the Will-o'-wisp's Wrack (502). The Lizard Man and Lizard
  Warrior take the spider's touch (3), the Bat the giant bat's disease (2), the Nymph the fatigue (5), the Ghouls the
  zombie's disease (7). The hosts' spider closure `castParalyze` is `readySpell(index)` - SetReadySpell for any
  standard spell, as DFU's is.
- **The Skeletal Warrior's rule** (`combat/formulas.js` isSkeletalTarget). The mod's CalculateWeaponAttackDamage is
  DFU's body with one test widened: a row whose Affinity reads `Skeletal` (the Skeletal Soldier) takes the Skeletal
  Warrior's blunt halving and silver doubling. The port takes the test as a door in the stock formula, so its own
  terms (a weapon's modifiers, the blow modifiers) stand under the mod. PCAAO's core - on by default - runs its own
  copy and never asks it, as DFU's PCAAO, replacing CalculateAttackDamage whole, never calls the overridden one.
- **Groups and languages** (`combat/formulas.js` registerEnemyGroup, registerEnemyLanguage). The fifty's from their
  rows - None included, over DFU's Etiquette for a class - and DFU's switch, which the C# restates, for every other.
  A mod enemy's career index is its id, so the door keys on it.
- **The forced gender** (`characters/mobile/mobileUnit.js` registerForcedGender). Over whatever the unit resolved,
  after its DFRandom roll - never instead of it, so the stream moves as it did. Of 1.3.4 ten rows force one; each
  draws one picture for both genders, so the voice is all it moves.

Departures (Port-Ledger A, the DEX row):

- **The forced gender picks the picture too.** DFU's unit chose its archive by the rolled gender before the handler
  ran (a reload takes the forced one's); the port forces it where the unit resolves it. Every forced row of 1.3.4 has
  one archive for both.

Tests: `test/systems/enemyExpansion/dex4b_combat.test.js` (every arm told apart by its transcript, DFU's switch and the
C#'s chain read off the vendored source, the mod's arms against BestiaryEnemySpells.cs, the override replacing the
whole, the skeletal rule, the groups and languages, the gender over the roll, the install), mutants
`tools/mutants/dex4b.json`.

## 10. DEX7 - the Morrowind bodies

Mac, 2026-10-19: "We also need to ensure these get proper morrowind model replacements if applicable". The mod has no
Morrowind half - DFU draws its sprites - so this is the port's own, on the law the classic table keeps
(`Morrowind-NPCs.md` section 14b, AUDIT MW-NPC D4/D5): a monster takes a Morrowind creature's body where Morrowind has
that creature and it moves as it does; a person stands as a person; anything else is a declared miss, and its sprite
stands. `systems/enemyExpansion/dexBodies.js` holds the table, registered whatever the switch (the fifty's rows and
pictures are there either way, and a body is how a row is drawn).

- **The doors.** `characters/creatureBodies.js` registerCreatureMatches: a mod's rows past the classic ids, read by
  creatureLook after CREATURE_MATCH, which stays the census of DFU's own. A row is refused where the classic audits
  would refuse it - a match and a miss, ids not as the reader keeps them, a flyer without `flies`, any swimmer, a
  class's mobile, a mobile named twice. `characters/foeBodies.js` registerPersonFoes: a monster that is a person
  (`{ race }`, drawn in that race's body as an orc is in the Orc's - isPersonFoe, foeLook, rosterLook) or a class that
  keeps its sprite (`{ sprite }`).
- **Matched** (the ids read off the Elder Scrolls wiki's creature pages, 2026-10-20 - UESP refuses the container):
  Goblin (`goblin_grunt`, Tribunal's), Wolf (`bm_wolf_grey`), Snow Wolf (`bm_wolf_snow_unique`, else the grey),
  Troll (`bm_ice_troll`, the grahl - Morrowind's only troll), Boar (`bm_frost_boar`, the tusked bristleback), Mudcrab
  (`mudcrab`), Ogre (`ogrim`), Dremora Churl (`dremora`), Stone Golem (`atronach_storm`), Dire Ghoul
  (`bonewalker_greater`, else `bonewalker`), Scamp, Centurion Sphere and Steam Centurion (their own). Where a classic
  monster is the same creature the row is the classic row: the Skeletal Soldier the Skeletal Warrior's, the Iron and
  Ice Golems the Iron and Ice Atronachs', the Ghoul the zombie's bonewalker, the Gloom Wraith and the Faded Ghost the
  veiled ancestor ghost (MWNPC13 - a wraith in another archive is a named spectral and keeps it).
- **Declared misses**: the Homunculus and the Bat (flyers; no Morrowind one), the Will-o'-wisp, the Land Dreugh
  (Morrowind's swims; this one walks), King Lysandus (a named spectral, MWNPC13), and every beast Morrowind has none
  of - the Medusa, the Hell Hound, the Grotesque, the Dog, the Nymph, the Minotaur, the Blood Spider, the Fire Daemon,
  the Mountain Lion (the classic nymph's, spider's and sabretooth's misses, word for word).
- **The people.** The Lizard Man and the Lizard Warrior are Argonians - Morrowind's lizard folk are people - dressed
  from their own equip table under the Bay's clothes, as an orc is; SetEnemyCareer's table arms no monster of the
  mod's (`combat/enemyEquipment.js` equipmentVariantFor), so they stand bare-handed where the sprite shows a shield
  and blade. The fifteen classes are people by the class law; the five RIDERS (Knight, Rogue, Thief, Spellsword and
  Archer) keep their sprites.

Departures (Port-Ledger A, the DEX row):

- **The bodies are the port's.** DFU draws the mod's sprites; the port stands a Morrowind body where the rules above
  find one - the arc's own ask.
- **A lizard man stands unarmed.** Its sprite carries a shield and a blade that DFU's entity never holds; the body
  wears what the foe wears (MWNPC5b), as every person's does.

Tests: `test/systems/enemyExpansion/dex7_bodies.test.js` (the census by the mod's own names, the motion law, the people
and the riders, the looks at the door with the switch either way, the doors' refusals, once a page), mutants
`tools/mutants/dex7.json`.

## 11. DEX5 - the Troll that gets back up

The mod ships a PREFAB for the Troll's corpse picture (`1618_20`), and DFU stands it in the corpse's place
(MeshReplacement.ImportCustomFlatGameobject, through CreateLootContainer). What it is, read off the bundle and the mod's
three scripts (BestiaryTrollCorpseBillboard, BestiaryTrollCorpseEntity, BestiaryTrollCorpseSerializer, and
BestiarySaveInterface):

- **Its components.** The imported json carries the mod's two; the prefab's own GameObject carries DFU's - a
  DaggerfallEntityBehaviour of type **None**, an **EntityEffectManager** and a **trigger** sphere of radius 1
  (`vendor/daggerfall-enemy-expansion/Prefabs/1618_20.components.json`, written by `tools/dexExtract.mjs` out of the
  bundle). So a blade or an arrow does nothing to it (WeaponManager.WeaponDamage harms only an enemy-typed entity), a
  touch spell and an explosion's overlap never find it (both ignore triggers), and a spell's MISSILE that meets the
  sphere assigns its bundle to the body's entity: health 1 of 1, the troll's career, every stat 50, level 0.
- **No loot.** PostParentedSetup destroys the loot container's DaggerfallLoot: the body is never searched, and what the
  troll carried goes with it.
- **The rise.** Ten seconds (the prefab's RespawnTime) of game time, frozen while `Cheat.DisableTrollRespawn` is on; then
  a NEW troll of the dead one's kind stands where the body lay (CreateEnemy - hostile, no quest's, no save's), the body
  is destroyed and the HUD says "The Troll has recovered from its injuries."
- **The burn.** A bundle that brings the body to 0 says the death ("Troll just died.", DisableEnemyDeathAlert its gate -
  the kind's name, never a champion's: the body knows its MobileID alone), stands the ash (1618/21) by its CENTRE 0.1
  over the body's foot and destroys the body: gone for good. Fire is the troll's critical weakness (no save), magic,
  frost and shock its resistances (CareerBase).
- **The save.** Every body still down, with its time left; a load sets each again (one with none left is skipped).

The port's half:

- **The door** (`scenes/corpseMarker.js` registerCorpsePrefab, createCorpsePrefabs): a mod registers a prefab for a
  corpse's archive and record while it is loaded (AssetInjection reads a loaded mod's bundle alone); each foe host builds
  one runner over its reach (`runs`, `body`, `rise`, `vanish`, `toAsh`, `send`, `say`, `key`), mints the prefab at its corpse mint on every
  machine (a copy's body is its owner's), drives it on its foes' clock and its magic rounds (OnNewMagicRound - every
  EntityEffectManager), and drops it with itself. The player's missile meets a prefab's trigger after the living foes
  (`scenes/hostMagic.js`, `corpsePrefabStruck`); a peer's drawn missile stops where its caster's does. An executed
  revenant's body is the port's own fate and takes no prefab.
- **The troll** (`systems/enemyExpansion/dexTroll.js`): the prefab's values read off the vendored json; the body's entity
  through the port's own AssignBundle (`systems/effects.js` applySpell - its saves against the troll's career, a lasting
  effect's first round now and its later ones in the magic rounds); the record on DFU's mod save slot
  (`systems/modSaveData.js`), a time handed back for a body not stood yet kept until it is (a quickload restores the mod's
  record before the foes).
- **The dungeon** (`scenes/dungeonContext.js`): its runner the foe's (the seat, a loose foe's owner); a rise a new LOOSE
  foe (spawnLooseFoe) where the body lay, the dead one staying dead with no body (`corpseDestroyed` - its save writes no
  body, as REVENANT-FATE's); the ash a flat the level keeps; a layout body's time saved by its slot. Its loot gate
  (`lootableBody`) honours a disabled body.
- **The street, the interiors, exterior.js** (`scenes/exteriorFoes.js`): its owner counts; a rise a new foe by the
  slot-neutral replacement (`spawnFoe`, `replacing`), the body gone as removeCorpse takes one; the ash takes the body's
  place as its marker (moved with the origin and the ground, collected with its pixel; it stands no Morrowind body).

**Online (DEX5b).** The room is the mod's whole (DEX0's decision), and the body is its foe's runner's - the seat or a
loose foe's owner underground, the foe's owner in the street:

- **The runner alone counts, rises and burns.** A copy of the body is no loot either (it is the same prefab, minted at
  every machine's corpse mint; the street's owner says no pile on it, `o` 0) and never counts.
- **A copy's missile goes to the runner** (`send`): the bundle as STRIKE-SHARED carries a spell (`sp`, `lv`), marked
  `cs`, by the lane its foe rides - the seat's number or a shared encounter's (applyHit), a loose foe's owner's
  (applyOwnHit), the street owner's (applyHit) - and the runner lands it on its body's entity.
- **The record says a body gone** (`bg` - 1 risen, 2 burnt; `net/wire.js` validFoeRecord, a dead record's alone), so
  every copy loses the body as the runner did (`told`) and a late one too. Underground a destroyed body's record rides
  on in every lane (a layout foe's always does; a shared encounter's and a loose foe's now do too), the ash a flat each
  machine stands; in the street a risen body's record ends with it (removeCorpse - every copy pruned) and a burnt one's
  rides on with the ash as its body. A body told gone while its art warmed never lands.

Departures (Port-Ledger A, the DEX row):

- **Only my spell's missile reaches the body.** DFU's trigger stops EVERY missile and arrow that meets it - an enemy's
  spell aimed past it burns it, an arrow vanishes into it harming nothing, and DFU's bounding-box melee may spend a swing
  on its entity and land nothing. The port's enemy missiles, arrows and blows read the living alone.
- **The street saves no body** (snapshotWorld: "Dead foes stay out" - every body outdoors), so a troll down outdoors at a
  save is gone on its load, where DFU stands it again with its time.
- **A troll that rose outdoors is saved standing**, as every street foe is; DFU's (CreateEnemy, LoadID 0) is in no save.
  Underground the port matches DFU: a loose foe is no foe a boot load stands again.
- **A loose troll's body underground keeps no time in a save** (its slot is no layout's) - a load lays none for it
  anyway.
- **Online, the room's (no DFU half):** a copy's bundle lands at the runner with no caster of its own there (the striker
  is in another world), so a Transfer's heal-back and a reflection reach nobody; and when the seat changes hands, the
  new runner counts a body's ten seconds from its own start (its copy never counted).

Tests: `test/systems/enemyExpansion/dex5_troll.test.js` (the prefab read off the bundle and the scripts, the body's
entity against the troll's career, the street's rise and burn through a real pool, my real missile on the trigger, the
door, the save, the hosts' wiring; DEX5b: the wire's bound, two real pools - a peer's missile burning the owner's body
and its copy turning to ash, the rise taking the copy away - and the dungeon's lanes), mutants `tools/mutants/dex5.json`.


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
| DEX2 | the sprites on the texture door: a non-classic archive's real frame counts, the xml scales, the emission maps, glow, no-shadow, the ghost's transparency, the guard's spell records | open |
| DEX3 | the encounter tables in all four hosts: the dungeon's seeded choice, the water's, the climates' | open |
| DEX4 | combat: the on-hit effects, spells 500-503 and the spellbook tables, the skeletal rule, groups and languages, forced gender, ranged | open |
| DEX5 | the Troll's corpse: up again after ten seconds unless struck, saved with the game, the cheat | open |
| DEX6 | DEX_RRICompat: the new classes equipped by their tables under Roleplay & Realism: Items | open |
| DEX7 | the Morrowind bodies (section 4) | open |

## 4. Morrowind

Planned under DEX7 against the rules the port already keeps (`bible/04-Characters/Morrowind-NPCs.md` section 14b,
`src/characters/creatureBodies.js` CREATURE_MATCH): a new creature takes a Morrowind creature's body only where
Morrowind has that creature and it moves the same way (a flyer a flyer, a swimmer a swimmer), its CREA id read off
UESP, never recalled; a person-shaped class (the riders, the necromancers, the witches) is drawn as a person; and
where Morrowind has no such creature the row says so, and the mod's own sprite stands.

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
- **The wire** (`net/wire.js` FOE_TYPE_MAX, relay world225): a streamed foe's kind was bounded at 255, which refused
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

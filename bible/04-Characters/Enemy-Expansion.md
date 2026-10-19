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
  **Port-Doctrine's third exception** ("Approve 3rd exception", then "Yes, cover all of them" once the measure found
  four more than the first count). The 1995 demo's four (Bat, Gargoyle, Nymph, Skeleton) are the mod's own art: the
  doctrine names the retail ARENA2 ("Mod art, ship it").
- **The class skins** (SKIN2): the same measure, run on `vendor/class-skins/`, found most of its sheets to be
  Daggerfall's class sprites at their own size, not drawings at twice it - "Bring under 3rd exception": the
  exception names its directory too, and its doctrine row and README say what it is.
- **Morrowind**: "ensure these get proper morrowind model replacements if applicable" - section 4.

## 3. The slices

| Slice | What | State |
|---|---|---|
| DEX0 | the record: the vendored files, the art in its three places, the doctrine's third exception, the registry row, the credit, the switch (on), the online decision (the room's, whole: Meaner Monsters' reading) | SHIPPED |
| DEX1 | the enemy registry: rows past the classic 0-42 and 128-146, the careers, the classic replacements, the names, the quest foes | open |
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

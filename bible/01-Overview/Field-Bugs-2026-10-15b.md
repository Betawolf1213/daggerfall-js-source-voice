# FIELD BUGS 2026-10-15b - threads from the bug-reports channel

Five Discord threads from 2026-10-14, handed over as screenshots, read on the code as it stands at main's `bd385fc6`.
Each is traced on the real modules first; the fixes are pinned one to a tag, and the decisions are Mac's (2026-10-15).

| | Report | What it was | Done |
|---|---|---|---|
| 1 | "Wagon appears outside of buildings/dungeons when stabled" - "I keep sending my wagon away, but every time I enter a building or dungeon it appears outside again ... it wasn't happening a few days ago" (Fay) | HOLDINGS' Send away left the pair in the mod's WithPlayer state - the state of a wagon beside a player on foot - and the door parks every such wagon at the entrance (the mod's IL_98f0) | fixed (WAGON-STABLED) |
| 2 | "Repair Regression" - "worn items should always repair before backpack items. If you wear a Cast When Held ring or Item Deteriorates armor and pick up 20 damaged axes, bows, and shoes off dungeon mobs to sell in town, the game decides those 20 pieces of vendor trash are more important than the ring on your finger" (Unconquerable) | MEND-STARVE (`Field-Bugs-2026-10-14.md`, the day before) put a worn piece that wears itself behind every other damaged piece, the pack's included | changed (MEND-TIERS), Mac's call: worn first, the self-wearing piece next, the pack last |
| 3 | "Flying kick doesn't work" - "tried doing it mid-air, off ledges, flat ground aiming up aiming down etc nothing works, also when in werewolf form it simply says 'the beast knows no technique'"; the HUD: "You cannot leap from here." (very stinky) | TECH1 as designed: every leap and dash is refused off the ground, and the one line says it for eleven causes; on flat ground the kick launched on the real motor. The werewolf's line is TECH1's own | changed (KICK-AIR), Mac's call: the kick goes from the air |
| 4 | "Right Arm armor disappearing" - "The armor for my right arm has disappeared between logging in and logging out, but the rest of my gear is saved fine" (Thatweirdphoenix) | not reproduced: slot 13 (RightArm) came back from every save and load tried, offline and online; DFU's own law (every shield covers the left arm, none the right) breaks a shield-bearer's right pauldron first, and a broken piece comes off | asked of the player |
| 5 | "I think the issue can be tied to the fact I reforged lines and honed them in the mages guild ... I sold one blade, which was unmodded" (Boar; the thread's title not handed over) | not decided: the thread's own complaint is not in the screenshot | asked of the player |

<!-- WAGON-STABLED -->

## MEND-TIERS: worn first, the piece that wears itself next, the pack last (2)

`src/systems/enchantments.js` repairsObjectsTarget, mendTier.

THE REPORT. "Repair Regression": a worn Cast When Held ring or Item Deteriorates armour, and twenty damaged axes, bows
and shoes picked up to sell - the loot was mended and the ring was not.

FOUND. MEND-STARVE (`Field-Bugs-2026-10-14.md`, 705af64180, the day before) ranked a worn piece that wears itself on the
tick's own round (Cast When Held, CastWhenHeld.cs:27; Item Deteriorates, ItemDeteriorates.cs:29) after every damaged
piece, the pack's included. Such a piece wears a point a tick, so the loot took every tick and the ring lost a point a
tick: a 40% ring beside twenty pieces of loot, 400 rounds through the payloads, lost 100 while the loot mended.
MEND-STARVE's own fault stands - first in the order, the piece took +1 and -1 forever and no other worn piece was
mended.

FIXED. Mac's three tiers (`mendTier`): what is worn, then a worn piece that wears itself, then the pack, with MEND-WORN's
mendOrder inside each. Arbeck's other worn gear is still mended first. The accepted trade-off: while such a piece is
below its condition the tick holds it and the pack waits - Cast When Held wears on every tick's round out of rest, so
while one is worn and damaged nothing carried is mended, and two such pieces share the tick (the more worn is held).
The repair kit (`smithItems.js` repairKitTargets) was already worn-first and is unchanged. Pinned by
`test/fb1015_mendtiers.test.js` (`tools/mutants/fb1015_mendtiers.json`, 5: 4 dead, 1 equivalent as recorded); PIN MOVED
in `test/fb1014_mendstarve.test.js` (the boots wait); re-aimed by content: MEND-STARVE-the-self-wearing-piece-first-again
and MEND-WORN-pack-order (dead).

## KICK-AIR: the Flying Kick goes from the air (3)

`src/combat/techniqueRoster.js` kick (`airborne`); `src/combat/techniques.js` refusal; `src/player/motor.js`
techniqueLaunch.

THE REPORT. "Flying kick doesn't work": "tried doing it mid-air, off ledges, flat ground aiming up aiming down etc nothing
works", the HUD saying "You cannot leap from here."; as a werewolf, "the beast knows no technique".

FOUND. TECH1's design (`05-Combat/Weapon-Techniques.md`): one gate refused every leap and dash off the ground, on the
press and again on the release - a jump, a fall, a ledge, or a press let go after takeoff - and the one line said it for
eleven causes. On flat ground the kick launched on the real motor through the whole press, hold and release. The
werewolf's line is TECH1's own and stays.

CHANGED (Mac's call). The roster marks the kick `airborne` and the gate reads the mark; every other leap and dash stays
grounded, and every other refusal - a climb, a wall, a vault, the water, a levitation, a slow fall, the saddle, a
knockdown - is the kick's too. From the air it is the same kick, aimed from the airborne feet. A flight launched
mid-fall keeps that fall's start: the launch had re-anchored it, so a kick near the ground would have cancelled a
12 m fall's damage. THE FOUR HOSTS: none changed - exterior.js, world.js and worldModes.js each hand the one
PlayerMotor to the runner, and dungeonContext.js reads worldModes' (or `dungeon.js`'s) through its technique door.
Pinned by `test/fb1015_kickair.test.js` (`tools/mutants/fb1015_kickair.json`, 9, dead).

## The right arm: asked of the player (4)

THE REPORT. Twice, the right arm's armour gone between a login and a logout, the rest of the gear kept.

FOUND. Nothing on the save's path drops it. Slot 13 is DFU's RightArm in every table that names it (`paperdoll.js`
EQUIP_SLOTS, `equipRules.js` SLOT_RULES' 106, Roleplay & Realism Items' 518 and 526), and a save and load through
`save.js` snapshotPlayer, restorePlayer and `equip.js` fillEquipTable brought it back every time - classic steel and the
mod's sets, cloaks in the slots either side, offline and as an online page. The realm stores the save as it is sent;
the judge freezes trade and never edits a save. What does take it off is DFU's own wear: a blow lands on each arm three
times in twenty (`formulas.js` STRUCK_BODY_PARTS), every shield covers the left arm and none the right
(`armorMaterials.js`), and a pauldron holds 2,048 points against a cuirass's 4,096 - so for a player with a shield the
right pauldron is the first piece to break (200 runs of 200 through the real damageEquipment), and a broken piece
comes off (`equip.js` lowerCondition) and stays in the pack at 0%.

ASKED. Whether the player carries a shield, and whether a broken right pauldron sits in the pack.

## The reforged blades: asked of the player (5)

THE REPORT. Two posts from Boar's thread, its title not handed over: the three Masterworks reforged and honed at the
Mages Guild, and one blade, unmodded, sold.

FOUND. On the market, a Masterwork its maker reforged or honed has no route: the crafted-piece and auction lists keep
only a piece as its making minted it (`smithItems.js` asMinted), and the pack's route refuses the maker's own piece
(`server-account/src/market.js` market-piece-route) - so an unmodded blade lists and the modded ones show nowhere. The
shop's sale, the item law, the loot check and the ids were ruled out: a reforge and a hone change the piece in place,
and every sale removes the one item handed to it. Whether that dead end is the thread's complaint is not in the
screenshot.

ASKED. What went wrong - the thread's title and what was tried - before anything changes.

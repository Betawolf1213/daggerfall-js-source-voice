# FIELD BUGS 2026-10-19 - the patreon chat, read to its root

Four threads from the Discord's #patreon-chat (2026-10-18 evening), handed over as screenshots. TWO ARE RECORDED HERE;
the other two are not yet looked at. Read on the code as it stands at main's `391473073`.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | Flylighter: "Are these supposed to be weighing us down even in the wallet? ... If this isn't a bug, it might be prudent to list the total weight of the wallet up top as the wallet's weight" (309 Welkynd Shards, the wallet's card saying Weight 0.00 kg) | Not a bug - WALLET1's call: the pieces the wallet holds weigh what they always did; the wallet itself weighs nothing, and its card said its own weight alone | WALLET-WEIGHT (`06-Systems/Wallet.md`): the owner kept the weights; the enhanced pack's wallet row and card say what it holds weighs |
| 2 | Cl3arSky: "You guys ever found The Revenant that would show on red on the map in the cave it's supposed to be in? I swear i explored fully 2 caves already for this one rev and i can't find him." Shines: "he never showed up in the lair. I had to bait them out to me on the road" | The lair's stand stood its revenant at the layout's farthest enemy marker - all but always in a border cap, a pocket no walk reaches | LAIR-REACH, below |
| 3 | [IMB]Monday: a ship bug - "If you get boarded.. repel the attackers.. board them.. etc. You can use overview as your crew class as enemies" | not yet looked at | - |
| 4 | Eterna: "how would eye go abt getting a nice little turtle symbol beside my ingame name" | a request, not a defect - not yet looked at | - |

## LAIR-REACH: a revenant at home stands where a walk reaches

`src/scenes/dungeonContext.js` (`dungeonEnd`, the lair's stand and the Rift).

FOUND, on the code. RVN7d (`12-Enhanced-AI/Feud-Arc.md` 18.4) stands a revenant at home "at the layout marker farthest
from the entrance" - `standLairRevenant` handed `dungeonEndOf` the layout's raw enemy markers. A Daggerfall dungeon's
layout is closed by caps, its border blocks (named B...), and the caps RING the layout - so the marker farthest from the
way in all but always stands in one, in a pocket no walk reaches. SD-REACH (`11-Multiplayer/Super-Dungeons.md`,
2026-10-08) found exactly this of an Abyss Dungeon's Rift ("In a place with absolutely no connection to the other
blocks") and fixed the Rift's candidates (`sdEndMarks`: an interior block's enemy markers, never a cap's nor a block's
start markers; out of the water where any is, AUDIT SD IV F38) - but the lair's stand, which SD4b had made "one law"
with the Rift, kept reading the raw markers. So a known lair stood its revenant, resting and unaware, where nobody could
reach it: the red circle on the map was right, the dungeon was right, and the revenant was in the rock. The record
claimed by the stand stayed out until the visit ended, and the next visit stood it there again. Shines' road is the
same law from the other side: a lair never answered, so the only meeting left was the open world's return roll.

THE FIX. One host function, `dungeonEnd()` - `dungeonEndOf(the way in, sdEndMarks(_layoutEnemies, dungeon.blocks, the
floor under each))` - and both stands ask it: the lair's (`const far = dungeonEnd()`) and the Rift's (`const end =
dungeonEnd()`). `dungeonEndOf` is asked in one place in the host, so no third stand can take the raw markers again. With
every marker in a cap, the farthest of them; with none, the start markers - a lair somewhere, never none; a lair with no
end at all frees its claim, as before. The host's code lines: +1 (`test/scenes/hostceiling.test.js` holds).

NOT CHANGED (SD-REACH's own note, standing for the lair too): an interior marker can still stand somewhere only a
teleporter or a lever's door reaches - a reachability walk over the collider would answer that, and the navmesh's bake is
no price for every lair. Nor the open world's arm: a due revenant the road's roll has stood (`revenantToReturn` - it is
`out`) is not at home while it is out, so a lair entered just after one came for the player on the road is empty that
visit - as RVN7d has it.

- **Pinned**: `test/systems/revenant/lair_reach.test.js` (2: the law the lair now reads - the raw markers' end in the
  cap, SD-REACH's in the interior block, every marker in a cap the farthest of them, a flooded block's marker only with
  none dry; the host - one `dungeonEnd`, its body, both stands asking it, `dungeonEndOf` asked once, the lair never the
  raw markers, no end the claim freed). PIN MOVED: `test/systems/rvn7d_stand.test.js` (the stand's `const far =
  dungeonEnd()`), `test/world/superDungeon/sd4b_rift.test.js` and `test/world/sd22_reach.test.js` (the two stands' calls
  and the helper's body). `tools/mutants/lair_reach.json` (5, all dead). Re-aimed by content: `sd4b.json`'s
  SD4B-the-lair-off-the-law onto `const far = dungeonEnd();`.

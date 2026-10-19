# FIELD BUGS 2026-10-19 - the patreon chat, read to its root

Four threads from the Discord's #patreon-chat (2026-10-18 evening), handed over as screenshots, then "fix anything not
fixed and audit. No band aids". Three are fixed here (the wallet's in `06-Systems/Wallet.md`); the fourth is a request
that waits on the owner's choices. Read on the code as it stands at main's `391473073`. AUDIT FB1019 (below) read all of
it cold.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | Flylighter: "Are these supposed to be weighing us down even in the wallet? ... If this isn't a bug, it might be prudent to list the total weight of the wallet up top as the wallet's weight" (309 Welkynd Shards, the wallet's card saying Weight 0.00 kg) | Not a bug - WALLET1's call: the pieces the wallet holds weigh what they always did; the wallet itself weighs nothing, and its card said its own weight alone | WALLET-WEIGHT (`06-Systems/Wallet.md`): the owner kept the weights; the enhanced pack's wallet row and card say what it holds weighs |
| 2 | Cl3arSky: "You guys ever found The Revenant that would show on red on the map in the cave it's supposed to be in? I swear i explored fully 2 caves already for this one rev and i can't find him." Shines: "he never showed up in the lair. I had to bait them out to me on the road" | The lair's stand stood its revenant at the layout's farthest enemy marker - all but always in a border cap, a pocket no walk reaches | LAIR-REACH, below; and two more ways a known lair stood empty - its revenant out on the road (LAIR-HOME) and an interior marker no walk reaches (LAIR-WALK) |
| 3 | [IMB]Monday: a ship bug - "If you get boarded.. repel the attackers.. board them.. etc. You can use overview as your crew class as enemies" | Read as "you can't use the Overworld view - your crew counts as enemies": a raid WON at sea never ended, and its five `_ally_` Warriors stood on the deck, hostile on their mobile team - "You cannot survey the land with enemies nearby", and no rest, no journey, for as long as the player sailed | RAID-WON, below |
| 4 | Eterna: "how would eye go abt getting a nice little turtle symbol beside my ingame name" | A request, not a defect. A symbol beside a name is a GLYPH (`net/identityToken.js` GLYPHS, drawn by `ui/playerBadge.js`), a closed list the account service grants (`server-account/src/titles.js` glyphsOf) - by age or role, by a named list in `server-account/wrangler.toml` (WikiMaid's rabbit, 2026-10-17, is the shape), or by a Patreon tier (candle, trumpet, crown); never chosen, never by a Discord role, never an emoji in a name (`sanitizeName` keeps ASCII). There is no turtle | put to the owner: who it is for (her alone by her in-game handle, or a tier), glyph alone or with a title, its look, and the relay's version step that comes with a new glyph |

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

What LAIR-REACH left - an interior marker in a pocket no walk reaches, and a revenant the road had stood a moment before -
is LAIR-WALK and LAIR-HOME, below.

- **Pinned**: `test/systems/revenant/lair_reach.test.js` (2: the law the lair now reads - the raw markers' end in the
  cap, SD-REACH's in the interior block, every marker in a cap the farthest of them, a flooded block's marker only with
  none dry; the host - one `dungeonEnd`, its body, both stands asking it, `dungeonEndOf` asked once, the lair never the
  raw markers, no end the claim freed). PIN MOVED: `test/systems/rvn7d_stand.test.js` (the stand's `const far =
  dungeonEnd()`), `test/world/superDungeon/sd4b_rift.test.js` and `test/world/sd22_reach.test.js` (the two stands' calls
  and the helper's body). `tools/mutants/lair_reach.json` (5, all dead). Re-aimed by content: `sd4b.json`'s
  SD4B-the-lair-off-the-law onto `const far = dungeonEnd();`.

## LAIR-HOME: a known lair answers when the road has stood its revenant

`src/systems/revenant/revenant.js` (the body registry, `goesHome`, the claims, `revenantStale`), `src/scenes/exteriorFoes.js`
(`withdrawStale`), `src/scenes/dungeonContext.js` (its pool's withdrawal, `revenantForLair`'s `foes`).

FOUND, on the code. RVN7d stood a revenant at home only when it was not OUT, and `out` was one flag for every stand: the
road's return roll (`revenantToReturn`) claims a due revenant the moment it stands it for the player, and a killer over
the player's body keeps it. A lair entered after the road had stood its revenant - out of sight, or by the door the player
went in at - was empty for the whole visit; the open world's pool is frozen while the player is underground, so the body
by the door kept the record out until they came back up. Shines' "I had to bait them out to me on the road" is that arm.

THE FIX - ONE REVENANT, ONE BODY. The record knows its body: the entity its latest stand put it in (`applyRevenant`), or
the foe still standing after its deed (a killer over my body, a felling foe - `revenantDeed`); one that got away, one run
from and one fallen leave none. Entering its lair, one that is out goes home (`goesHome`) unless its body is in the lair's
own pool already (a stand here this visit), is in a fight with the player (its harm reached them within the fight's
window, `harmMark.js harmFightSince` - it is at the door behind them, and no running into its lair resets a fight), kneels
for the player's judgement (its last deed `yielded`), or has not stood up yet (a claim pending, within
`REVENANT_STAND_GRACE_MS` - past it, a stand that never came). Its old body is STALE (`revenantStale` - never a sworn
one's, never a body this session does not know): the open world's pool withdraws it and its band as the cull takes a foe
(no corpse, no kill, no deed - `withdrawStale`), and so does the dungeon's (its own door, `questPoolOps.removeFoe`), so
whichever stand came last is the one body. A stale body is no presence (`revenantPresence`). A claim keeps what was
before it: a lair's claim that stood nobody gives the road's back as it was (`releaseRevenantStand`), and a claim over one
that never stood keeps the state before that one. The dungeon asks with its own pool (`revenantForLair(..., { foes })`),
never the door, which the first frame may still hold for the open world.

- **Pinned**: `test/systems/revenant/lair_home.test.js` (5: home from the road, the road body stale and no presence; never
  home in a fight, kneeling, or here already; the grace and the releases; the bodies of each deed and of a sworn one; the
  two pools' withdrawals and the dungeon's asks). PIN MOVED: `test/systems/rvn7d_stand.test.js` (the two asks carry the
  pool). `tools/mutants/lair_home.json` (18, all dead). Re-aimed by content: `rvn7d.json`'s four home records,
  `revenant.json`'s REVENANT-AAA-no-claim and REVENANT-AAA-the-claim-never-freed.

## LAIR-WALK: a revenant at home stands where a walk from the way in reaches

`src/world/dungeon/dungeonEnd.js` (`reachableEndOf`, `LAIR_WALK_WAIT_MS`, `LAIR_WALK_TRIES`), `src/scenes/dungeonContext.js`
(the lair's wait, its walk and its end).

LAIR-REACH's candidates are an interior block's enemy markers; one can still stand in a pocket no walk reaches, which only
a walk over the floor can tell (SD-REACH's own note, of the Rift). The dungeon bakes that floor already - ENHANCED AI 3b's
navmesh, on by default and always online, anchored on the player's feet as they come in. So the lair WAITS for it when it
is coming (at most `LAIR_WALK_WAIT_MS`, 20 s; a bake that fails says so at once), asks a path on it from where the player
came in to each candidate, the farthest first (`findPath`, the navmesh's one entry point - its header's own rule; a door
stands open in the bake, a teleporter's jump or a lever's lift joins nothing), and stands its revenant at the first a path
reaches (`reachableEndOf`, a tie keeping the list's order). `LAIR_WALK_TRIES` (6) are asked at most: a failed search walks
the whole of the way in's floor - measured on synthetic floors with pillars (`bakeNavFromCollider`, one sealed room beside
them): 17 ms on 9,705 polys and 81 ms on 44,360, a found path 31 and 104 ms - so the worst a large layout pays is half a
second, once a visit. With no navmesh (the Enhanced AI switched off offline, a bake that failed or never landed), or none
of those six reached, SD-REACH's end, as LAIR-REACH stood it. `navmesh.js` itself is untouched: its body is project-final's,
pinned by digest. THE RIFT KEEPS SD-REACH ALONE: it stands the same on every client, and a client's bake is anchored on its
own feet.

- **Pinned**: `test/systems/revenant/lair_walk.test.js` (3: the walk on a real bake - a path to the hall's far end, never
  to the sealed room beside it, and the lair's end on it; the end a walk reaches and its tries; the host's wait, its bound,
  its anchor, its walk, its end, and the Rift's own). PIN MOVED: `test/systems/rvn7d_stand.test.js` (the ask once the navmesh has landed; the lair's end),
  `test/world/superDungeon/sd4b_rift.test.js` and `test/world/sd22_reach.test.js` (the end's body through
  `reachableEndOf`; the Super dungeon's frame line), `test/systems/revenant/lair_reach.test.js` (the lair's end, the law
  asked in one place). `tools/mutants/lair_walk.json` (11, all dead). Re-aimed by content: `lair_reach.json`'s three host
  records, `sd4b.json`'s SD4B-the-lair-off-the-law, `rvn7d.json`'s RVN7d-never-asked and RVN7d-asked-every-frame.

## RAID-WON: a raid won at sea ends

`src/scenes/naval/navalHost.js` (`wonRaid`, both of `winBoarding`'s throw-back branches), `src/scenes/world.js` (endRaid's
`won`), `src/scenes/raidAshore.js` (`won`).

FOUND, reproduced on the real quest machine (Warm Ashes' own WAQ_SHIP_SMALLRAID, the sea's gate) and the real
enemies-near law. The sea fight starts Warm Ashes' raid on a crewed boat (`navalHost.js beginFight`); while it runs the
player's crew is held off the deck and the raid's five `_ally_` Warriors stand in its place. Won - the pirate attack's
leader down (`_winner_`), or the small raid's wave killed and its Leave Ship answered 'naval' - the boarding ended
(`winBoarding` -> `endBoarding`) and the RAID DID NOT: nothing called `endRaid` on a win (only `castOff`, a raid given up,
did), the small raid ran on to its hour and the pirate attack to its `_reset_`, and neither script ever removes `_ally_`.
`change foe _ally_ team 1` sets their team (`entity.team`) but not their mobile team, which is the law the enemies-near
question reads (`systems/encounters.js areEnemiesNearby`, DFU's GameManager :709 - left as it is): five Warriors on the
deck with green bars, sailing with the ship, counted as enemies near - the Overworld refused ("You cannot survey the land
with enemies nearby", `travelView.js`), and every rest and journey with it, for as long as the player stayed aboard. Not
the reading that enemies take the crew's class: her defenders keep her own classes, the player's hands are allies and go
home at the end (traced on the real naval and crew hosts).

THE FIX. A raid the throw-back won ends as RAID-ASHORE ends one ashore: `winBoarding` calls `wonRaid` after the boarding's
end on both of its throw-back branches (a legend's first wave too, before the second comes over), which asks the world
host's `endRaid(quest, { won: true })` -> `raidAshore.won`: every living foe of the quest withdrawn now and again as it ends
(its `_ally_` among them; its dead left to be looted), and the quest ended as its own `end quest` ends one (`questBreak`,
`endQuest` - the machine tombstones it after its two ticks, never the tombstone in the middle of its own Leave Ship); one
already ending is never begun again, one already ended has its foes withdrawn alone. The quest's uid stays the naval
host's until it really ends (`raidEnded`): a Leave Ship or a wave its grace ticks still run is the sea fight's, never a
voyage's prize window nor the open ground's ring. Raid quests carry no faction, so the end costs no standing.

- **Pinned**: `test/systems/naval/raidwon.test.js` (3: the small raid won at sea ends, each of its three outcomes, and the
  record of the bug - five Warriors left, counted as enemies near; `won`'s own law; the hosts). PIN MOVED:
  `test/systems/naval/navaudit_boarding.test.js` ("a won raid ends with its win"; the world host's endRaid run with its
  `won` arm). `tools/mutants/raidwon.json` (8, all dead).

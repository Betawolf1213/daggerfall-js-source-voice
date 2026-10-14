# FIELD BUGS 2026-10-14 - threads from the bug-reports channel

Discord threads from 2026-10-13 and 2026-10-14, handed over as screenshots, read on the code as it stands at main's
`e150f6ce`. Each is traced on the real modules first; the fixes are pinned one to a tag.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | "Crash at Carpentry" - "Daggerfall: Newtower, cant interact. If try to access through Esc- Store get crash" (BioGud); "Same here, crashed trying to load the crafting bench" (a second player) | MENU-ORDER's station tiles asked each away station whether it held the pressed station's head with `children.some`; a browser's `children` is an HTMLCollection, with no `.some` - the press threw before it was spent, and every later Stores page threw with it | fixed (STORES-CRASH) |
| 2 | "Inns with this room layout can't be used to sleep" - "No prompt to rest or loiter when clicking the beds" (Mona Polca) | the interior builder listed a bed only when its placement was a prop (ObjectType 3), furniture's gate; a bed written as scenery - a dormitory's, a ship's bunks - was never a click target | fixed (INN-BEDS) |
| 3 | "Crew morale LIES sometimes between fleet window/shipwright and the helm!" - "Let me give them MORE grog!" (Cruor) | the yard's grog row wants no round once the day's is drunk, and the window read that as a crew at the top: "as high as they go", "No need", over a crew the helm called low | fixed (GROG-WORD) |
| 4 | "Bugs envolving configuration and enchantments" - "my 'Repair items' enchantment is not repairing anything" (Arbeck; the same thread's lifesteal and Look Around are below) | MEND-WORN's order mends the worn piece with the lowest share first, and a worn piece that wears itself on the same round (Cast When Held, Item Deteriorates) took +1 and -1 every tick: it stayed first and nothing else was mended | fixed (MEND-STARVE) |

## STORES-CRASH: the Stores page walks a station's nodes as the browser mints them (1)

`src/ui/profPages.js` holdsHead (drawStationTiles).

THE REPORT. Two players at Newtower's Joinery (CARP-YARD): the bench's press crashed the game, and so did Esc, Stores,
after it. The crash box's stack: `TypeError: ((intermediate value) ?? []).some is not a function`, at the Stores page
(`stores`, under the pause's `holdings`).

FOUND. The Joinery's bench lands the Stores page on its Workbench (`focusStoresStation('workbench')`, STATION-DOOR's
landing). MENU-ORDER (#872, merged 2026-10-13) tiled the stations, and for each station the player is away from it asks
whether that station's box holds the pressed head, so an away station pressed is the one shown: `holdsHead` walked the
box with `(node?.children ?? []).some(...)`. In a browser `Element.children` is an HTMLCollection - indexed, iterable,
a length, and none of Array's methods - so the first away station (the Forge, at a joinery) threw. The Workbench, fourth
in the list, never drew, so its head never spent the press: `_storesFocus` stayed `'workbench'`, and every Stores page
drawn after it threw the same way until the game was reloaded. A home's alchemy and enchanting stations (STATION-DOOR's
own presses) threw the same way. The suite was green because the fake document's `children` are arrays; the walk beside
it, `stationWorkable`, already walked by iteration for exactly this reason.

FIXED. `holdsHead` walks by iteration, as `stationWorkable` does. Pinned by `test/fb1014_storescrash.test.js`, which draws
the page through its own draw on nodes whose `children` are shaped as the browser mints them; the old walk fails it with
the player's own message (`tools/mutants/fb1014_storescrash.json`, 1, dead).

## INN-BEDS: a bed is a bed whatever its ObjectType (2)

`src/scenes/interiorContext.js` buildInteriorContext (the placements loop).

THE REPORT. A tavern whose room is a dormitory - beds between wooden partitions - offered no Rest or Loiter on any bed.

FOUND. The builder lists the room's beds (RR1, Roleplay Realism's BedActivation on models 41000-41002) inside the
furniture chain, and AUDIT 64 F17 put that chain behind DFU's prop gate (`DaggerfallInterior.cs:500`,
`ObjectType == propModelType`) - so a bed written with another ObjectType never entered `beds`, and no `bed:` target was
built for it (`worldModes.js` interiorTargets). DFU's gate is furniture's actions (containers, shelves); a bed is a mod's
custom activation, keyed on the model id alone (`RoleplayRealism.cs:126-128`), and DFU stands a custom-activation model
on its own whatever its ObjectType (the CombineRMB note in the builder). Of the 39 bed placements in the vendored world
data, 34 are ObjectType 0 and 4 are ObjectType 4 (Roleplay Realism's RRFORT01, Detailed Ships' two cabins); the
reporter's building could not be read here (no ARENA2), and the dungeon builder already lists its beds with no ObjectType
test (`dungeonContext.js`).

FIXED. A bed model is listed before the prop gate, whatever its ObjectType; the furniture chain stays the prop's.
Pinned by `test/fb1014_innbeds.test.js` (`tools/mutants/fb1014_innbeds.json`, 1, dead).

## GROG-WORD: the yard says a crew's spirits as the helm does (3)

`src/systems/naval/navalYard.js` provisionOffer; `src/ui/navalYardWindow.js` yardText.

THE REPORT. The shipwright's window (opened at a port or from the Fleet page) and the helm disagreed on the crew's
spirits; the guns reloaded slow while the yard would sell no grog.

FOUND. Both read the same `crew.morale`. The yard sells one round a port day (AUDIT CC-D5), so its grog row wants none
(`missing` 0) once the day's is drunk - the same 0 as a crew at 100 - and the window read only that: "Her crew's spirits
are as high as they go", its press "No need", over a crew of 40 the helm called low (`shipCrew.js` spiritsOf), whose
reload is slower under 50 (reloadScaleOf). A round lifts 15 and the sea takes a point every 150 seconds, so for the rest
of that day the two said different things.

FIXED. The row says why it wants none (`drunk`: below the top with the day's round drunk), and the window says the
crew's own spirits and that they have had today's round, its press Tomorrow. One round a port day stands. Pinned by
`test/fb1014_grogword.test.js` (`tools/mutants/fb1014_grogword.json`, 2, dead).

## MEND-STARVE: a piece that wears itself is mended last (4)

`src/systems/enchantments.js` repairsObjectsTarget, wearsItself.

THE REPORT. "My 'Repair items' enchantment is not repairing anything" - in the same thread as an off-hand lifesteal and
Look Around's secrets, all said to have stopped two days before.

FOUND. Repairs Objects mends one piece every fourth magic round, MEND-WORN's order (`itemTemplates.js` mendOrder: worn
first, the lowest share of its condition first). A worn Cast When Held piece loses a point on the same fourth round
(CastWhenHeld.cs:27, HELD_DEGRADE_RATE) and a worn Item Deteriorates piece the same (ItemDeteriorates.cs:29). AllowMagicRepairs
is the port's default and forced on online (DISC22-A), so such a piece, once it was the most worn, was mended +1 and worn
-1 on every tick: its share never rose, it stayed first, and nothing else - worn or carried - was mended again.
Reproduced through the round's payloads: a 20% Item Deteriorates helm beside a 99% cuirass, 400 rounds, nothing moved.
It dates from MEND-WORN (2026-10-07). The one change to the target inside the reported two days, AUDIT WAGONS4's
(the small cart and the horse are never mended by it), is intended.

FIXED. A worn piece carrying either row is mended after every other damaged piece; once nothing else wants the tick, the
tick holds it against its own wear, as before. Port-Ledger's MEND-WORN row records it. Pinned by
`test/fb1014_mendstarve.test.js` (`tools/mutants/fb1014_mendstarve.json`, 3, dead).

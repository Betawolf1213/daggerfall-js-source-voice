# FIELD BUGS 2026-10-14 - threads from the bug-reports channel

Discord threads from 2026-10-13 and 2026-10-14, handed over as screenshots, read on the code as it stands at main's
`e150f6ce`. Each is traced on the real modules first; the fixes are pinned one to a tag.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | "Crash at Carpentry" - "Daggerfall: Newtower, cant interact. If try to access through Esc- Store get crash" (BioGud); "Same here, crashed trying to load the crafting bench" (a second player) | MENU-ORDER's station tiles asked each away station whether it held the pressed station's head with `children.some`; a browser's `children` is an HTMLCollection, with no `.some` - the press threw before it was spent, and every later Stores page threw with it | fixed (STORES-CRASH) |
| 2 | "Inns with this room layout can't be used to sleep" - "No prompt to rest or loiter when clicking the beds" (Mona Polca) | the interior builder listed a bed only when its placement was a prop (ObjectType 3), furniture's gate; a bed written as scenery - a dormitory's, a ship's bunks - was never a click target | fixed (INN-BEDS) |
| 3 | "Crew morale LIES sometimes between fleet window/shipwright and the helm!" - "Let me give them MORE grog!" (Cruor) | the yard's grog row wants no round once the day's is drunk, and the window read that as a crew at the top: "as high as they go", "No need", over a crew the helm called low | fixed (GROG-WORD) |
| 4 | "Bugs envolving configuration and enchantments" - "my 'Repair items' enchantment is not repairing anything" (Arbeck; the same thread's lifesteal and Look Around are below) | MEND-WORN's order mends the worn piece with the lowest share first, and a worn piece that wears itself on the same round (Cast When Held, Item Deteriorates) took +1 and -1 every tick: it stayed first and nothing else was mended | fixed (MEND-STARVE) |
| 5 | "Possible bug: Repeated ..." - "I was stopped by the guards and paid a fine of 560 gold. After that, I was stopped again and had to pay the same 560 gold, even though I hadn't committed any new crimes. Now it's happening for the third time" (Dweme...) | REP1 as designed: the fine bought a day's grace (about two real hours online) and nothing else, so the standing that stopped the player stopped them again for the same sum; the box's other two answers net nothing either | changed (FINE-MENDS), Mac's call |
| 6 | "my off-hand weapon is not having its lifesteal, unless i switch hands (but it was working fine 2 days ago)" (Arbeck) | the port has no dual wield: a weapon's leech heals on its own blows (`lootPowers.js` lootStrike), and the off hand strikes only once H switches to it; nothing on that path changed in the two days (BAL7's 10% cap, 2026-10-12, lowers a leech summed past it) | the card says so (LEECH-HAND), Mac's call: per hand |
| 7 | "the 'Look Around > With secrets' config is not even showing anything" (Arbeck) | not reproduced: nothing on its path changed since 2026-10-10 and its suite passes; it lights only in a dungeon, on an Info ask (F3 or the wheel's Info), within 8 m and in sight - and a thick secret wall can hide its own glow card | asked of the player |
| 8 | "Gold appears when I'm trading but not in my inventory" - "After I went to sleep my character lost 5000 of gold" (Soda_do_macaco...) | not reproduced: the trade window's figure, its refusal and its payment read one count (coins and letters of credit); the inventory's footer counts coins alone, and a payment spends letters first, so a 5000 letter spent leaves the coin figure where it was | asked of the player |
| 9 | "Mountain clipping and invisible" - "Mountain is invisible and you can go through it and get stuck" (BigOOF) | a video, no place named | asked of the player |
| 10 | "Equipped items Disappear after looting in PvP zone" - "When you kill a player in a PvP zone and loot an item they have equipped, the item disappears from the player's inventory but does not appear in yours" | the room judged the killer's take of the piece by the drop's friend law (PVPDUNGEONS): a killer the fallen's guild counted a friend (or one sharing a party with them by the take) was refused the piece the account service had already taken off the fallen's record for them | fixed (PVP-LOOT); whether guildmates may fight in the zone at all is Mac's call |

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

## FINE-MENDS: a fine paid on the spot mends the name (5)

`src/systems/standing.js` settleChallenge; `src/scenes/standingHost.js` (the stop's P).

THE REPORT. A player in Daggerfall, "a scoundrel - known to the watch", stopped three times for the same 560 gold with
no new crime between, asking whether to stop playing until a fix.

FOUND. No fault in the code: REP1's design (`06-Systems/Standing-Arc.md`). The stop's trigger is the standing alone
(under -10, DFU's line); paying took the gold and granted a day's grace (CHALLENGE_GRACE_MINUTES, on the character's
own clock - about two real hours online at TimeScale 12, a third of it in one inn's night), and changed no standing. The
fine is the court's Conspiracy table at that standing, so the same standing asked the same 560 (-12 to -19). Coming
quietly charges a Conspiracy and the sentence gives it back whole; a standing mends a point a week. A player who read
"pay the fine" as settling the matter was stopped every couple of hours for days.

CHANGED (Mac, asked: "Fine raises standing"). A fine paid on the spot mends the name by a temple penance's step,
PENANCE_POINTS (5), never past the -10 line - the reporter is clear in one or two fines; a name far under the line pays
more fines, each its own standing's price, and the temple stays the way to mend it faster. The HUD's legal notice says
the rise. The grace is unchanged. Recorded in Port-Ledger's REP1 row. Pinned by `test/fb1014_finemends.test.js`
(`tools/mutants/fb1014_finemends.json`, 2, dead).

## LEECH-HAND: the leech line says whose blows it heals on (6)

`src/systems/lootRarity.js` AFFIX_KINDS.leech's label.

FOUND. A weapon's power rides the blows of the weapon that struck (`lootPowers.js` lootStrike, the strike listener's
`weapon`), and the port has DFU's hands, not dual wield: H chooses the hand that swings. An off-hand weapon's leech heals
on nothing until the player switches to it - the rule since LOOT4, unchanged in the reported two days (BAL7's cap,
2026-10-12, lowers a leech summed past 10%).

CHANGED (Mac, asked: "Keep per-hand"). The rule stands; the line says it - "5% life leech on this weapon's own blows",
on the item card, a gem's line and the Reforge. PIN MOVED: `test/loot4_procs.test.js`
(`tools/mutants/fb1014_leechhand.json`, 1, dead).

## PVP-LOOT: the killer's worn piece is the order's, never the friend law's (10)

`src/net/wildLaw.js` remainsNamedFor, takeFrom; `server/src/index.js` `_wildWord` (relay world201). Read on main's
`7c291d36`.

THE REPORT. A player killed another in the open zone (`11-Multiplayer/Wild-Zone.md`), searched the body and chose one of
its worn pieces: it left the fallen and never came to the killer.

FOUND. An equipped piece followed through the whole chain on the real modules, with the game's own pieces (the starting
kit's worn clothes, a Magic longsword as the ladder rolls one, worn through `equip.js` equipItem, the record as the save
writes it): the body's offer and the pick (`world.js` wildBodyArrived, wildBodyChosen), the relay's signed fall (`f1`, the
pick's place and what it showed), the account service's take (`wildDropLaw.js` takeWildDeath - the piece off the record
first, `wildRecord` stripping the receiver's marks, `equipSlot` among them), the fallen's game taking out exactly that
(wildTakeTook, unequipped first), the remains laid on the service's order (`wk`, `wi`: the killer's), the killer's own
book asking for it (`wildRemains.js:"const askMine = "`) and the room's `got` minted into the pack (`loot.js`
validLootList, the receiver's marks stripped again). For a killer who is a stranger every step holds: the piece lands,
unequipped. The break was the room's take. `_wildWord` asked the PVPDUNGEONS friend law ("Party/guildmembers cant pick it
up" - a fallen's remains are theirs and their foes', never their party's or their guild's) before takeFrom, of EVERY
record - the killer's piece too. INT9 had moved that piece from the fallen's own hand (WILD1's `gave`) into the remains,
under a law written for the drop. The referee counts a guildmate a fair foe - only a party, its truce and a duel are kin
(`world.js:"const wildFair = (peerId) => {"`, and the relay's `_wildBlow`) - so a guildmate's kill was signed, the service
took the piece off the fallen's record and named it the killer's, the fallen's game took it out of the pack, and the room
answered the killer "Someone took that first." The piece lay in the remains for nobody (its fallen is not its named taker
either) until they went, and the killer's book asked again every frame. The same for a killer and a fallen who come to
share a party before the take, and for a take asked while the hub is silent (kin until it answers).

FIXED. The friend law is the drop's. `remainsNamedFor` (`wildLaw.js:"export const remainsNamedFor"`) names the account a
record is for - the killer's worn piece its order's killer, every other record nobody in particular - and the room asks
the friend law only of a record named for nobody (`server/src/index.js:"if (rec && !remainsNamedFor(rec, d.i) && rec.os"`);
takeFrom keeps the named piece its killer's alone, by the same member. The drop stays the fallen's and her foes': a
guildmate or a party member of hers is refused every record of it. Relay world201 (no frame changes shape; the deploy
drops every player once). Pinned by `test/fb1014_pvploot.test.js`, end to end through the real account service, the real
relay room and the killer's own book, over the game's own pieces: a stranger, a guildmate and a party member each get the
longsword unequipped, as it was minted, under the service's fresh id; the drop is refused to her friends and taken by a
stranger; a stranger asking first for the named piece is refused (`tools/mutants/fb1014_pvploot.json`, 5, dead - the
first is the take as it shipped). PIN MOVED: `tools/mutants/int_lane2.json` INT9-THE-KILLERS-PIECE-ANYONES, re-aimed by
content at takeFrom's gate.

THE FOUR HOSTS. The take is the relay's, so every host reads it unchanged: `scenes/world.js` (the open country, the one
place a body offers a worn piece and an order names one) WIRED as it stood - its book asks, the room now answers;
`scenes/dungeonContext.js` and `scenes/worldModes.js` hold remains in their pools but no record in them is ever named (a
hall's fall offers no worn piece, a building has no player fight); `scenes/exterior.js`, offline, NOT WIRED on purpose.

LEFT OPEN, for Mac:
- GUILDMATES FIGHT IN THE ZONE. The referee and `wildFair` make kin of a party, its truce and a duel alone, while
  everything else the zone does counts a guildmate a friend - each other's marks on the maps, nameplates, never a
  "stranger", the drop barred. Whether a guildmate should be a fair foe at all is a design call; this fix keeps the fight
  as it stands and gives the killer what the service named theirs.
- THE PIECE IS THE ROOM'S UNTIL ITS KILLER ASKS. The fallen's record loses it when the service takes it (INT9's order),
  and the remains hold it for the killer `WILD_REMAINS_MS`; the killer's game asks the moment the room says the remains,
  and again at any hello of that cell or its halo inside them. A killer gone from both before the remains are laid, who
  does not come back inside twelve minutes, never asks, and the piece goes with the remains. Making the fallen lose it
  only when the killer's take lands is a change across the account service and the relay, not this fix.

## Asked of the players (7, 8, 9)

LOOK AROUND, WITH SECRETS (7). `systems/dungeonSense.js`, `scenes/dungeonContext.js`, `render/nodeGlow.js` - none changed
since 2026-10-10, `test/sense1_dungeonsense.test.js` green. The tier lights nothing by itself: an Info ask in a dungeon
(F3 - unbound for a brand-new key file since MODE-WHEEL - or the wheel flicked to Info) lights what is within 8 m and in
sight for six seconds, a chain-moved secret among them, purple and the faintest form (its shimmer nothing under Reduced
Motion). Read on the code and not proven: a secret slab thicker than about 1.2 m hides its own glow card, planted at the
box's floor centre and pulled 0.6 m toward the eye. Asked: where, how the ask was made, and Reduced Motion.

GOLD IN TRADE (8). The trade window's "Your gold", its refusal and its payment are one hook (`worldModes.js`
openTradeWindow's `gold`, totalGoldAmount: coins and letters of credit). The inventory's footer counts coins alone, and
deductGold spends letters first - a payment past the coins (an Empire call at joining, a fine) spends a letter and the
coin figure does not move; the bank, the wagon's coin and a quest's gold stack in the pack are counted by no shop. Nothing
on the rest path takes gold but a death (a tenth) or an overdue loan's draw. Asked: the footer's two numbers, the line
seen on waking, and the Wallet's letters.

THE MOUNTAIN (9). A video, no place named. Asked: the place (the map's name or pixel).

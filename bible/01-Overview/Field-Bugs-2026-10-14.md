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
| 10 | "Currently on the final part of the quest to 'Travel to the second town named by the poisonmaker'. However coming to the location it has NPCs, but NO Houses, except for a player house which is marked as the residence I need for the quest, but it's just.. a player house..?" (Buckinghouse Farmstead) | HOME1's "no quest picks a player's home" asked only the towns this page had asked; the Dark Brotherhood's The Acceptance Test picks its second town's residence in a town never walked into, so the farmstead's only house - another player's home - was the quest's | fixed (QUEST-HOME) |

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

## QUEST-HOME: no quest picks a player's home, in any town (10)

`server-account/src/homes.js` homeLayouts; `src/systems/onlineHomes.js` hearEveryTown, homeStands; `src/scenes/world.js`
takeHomeLayouts and the quest machine's `isPlayerHome`. Read on main's `7c291d36`.

THE REPORT. The last step of a quest, "Travel to the second town named by the poisonmaker": Buckinghouse Farmstead,
whose map named one building, "The Mesmerized Residence", the quest's residence - and its door read "To <owner>'s
home", Vote up, Vote down: another player's online home. The player tried the quest repair, then restarted the quest.

FOUND. The quest is the Dark Brotherhood's The Acceptance Test (`L0A01L00`): its letter sends the player to the
poisonmaker (`_apothecary_`, a Chemist, at `Place _apo_ remote apothecary`), who sends them to poison `_npc_`'s wine at
`_mansion_` - `Place _mansion_ remote house1`, "in __mansion_", the second town - and its three people's homes are
generated residences too (Person.cs AssignHomeTown, `remote house`). Every one is chosen when the quest starts, in a town
of the region the player has not been to (SelectRemoteTownSite's darts). HOME1 kept a player's online home out of the
choice - the collector's `isPlayerHome` (`systems/quest/place.js` _collectQuestSitesOfBuildingType; a departure, DFU
has one player) - but the seam asked `onlineHomes.homeAt`, which knows a town only once this page has asked it, at its
gate or a door; HOME1's own record carried it as a known limit. So the rule held in the player's own town alone: a
remote town's houses were all fair game, and a farmstead has one. The door then did what HOME1 built it to do for a
quest's holder (the quest rung, PlayerActivate.IsActiveQuestBuilding): it let them into a stranger's furnished home,
which is what the player found.

FIXED. The layouts read every online boot already makes before its first town stands (WD3, `/v1/homes/layouts`) names
every town's homes by building as well: `homes`, `[mapId, [buildingKey, ...]]` a town, keys ascending - every home, a
guild's hall and a deed held - read beside the towns and kept with them under the generation read before both
(STORM-SHED 2's `homes_gen`); a town's homes were any session's to read already (homesInTown). The registry keeps it beside the towns
it asks (`hearEveryTown`), and the quest machine's `isPlayerHome` asks `homeStands`: a player's home in any town. The
service is acct133 (no migration); a client on an older service hears no `homes` and keeps what it knew. A quest made
before the fix whose site is a home is chosen again (below) - restarting it chooses afresh.

CLOSED BOTH (Mac, 2026-10-15: "Close both", of the two limits the boot's read left - a house bought after a page's read,
and a quest whose residence was chosen before its house was bought). THE LIVE LIST: every act that moves a home - a
claim, a deed held or sold, a hall bought or sold, an arena move, a sale, a character deleted - answers `homeOrders`
(`server-account/src/index.js` homeOrdersOf over each act's `moved`, `src/net/homeLaw.js` homeMoved): a home order
signed with the identity key (`src/net/identityToken.js` kind `home` - `bm` the town, `bu` its buildings homes now, `bd`
homes no more). The client's one door hands every one to the page's ear (`src/net/accountClient.js` onHomeOrders), the
page's hub link carries it (`src/net/online.js` sendHomeOrder, once the hub's welcome names world201), and the hub -
the one room every online player holds a socket to - checks it with the key it holds and fans `{t:'home', l:[...]}` to
every hub socket, a shard's by the bus, holding the words of the last ten minutes for a page whose boot read went out
before them and whose link opened after (`server/src/index.js` the `home` arm, _hubHelloWords; HOME_WORDS_KEY). Every
page's registry takes the word (`src/systems/onlineHomes.js` hearHome) beside the boot's read, and the quest machine's
`isPlayerHome` reads both. No poll: a home's move is said once, by the act. THE RE-PICK: whenever a page learns of
homes (the boot's read, a hub word, a town's answer, a load whose layouts stand), every building site the player has not
reached whose building is a player's home now is chosen again in its own town by the place's own law (`src/systems/
quest/place.js` repickHomedSite - SetupLocalSite's search, Place.cs:717-736: the declared P2/P3, a house kind's
any-house fallback, a person's home its house; the collector keeping out every home and every building a quest holds),
what was assigned to it carried onto the new building's markers, its site links following, its name drawn anew so the
journal names the residence the quest stands in, and its map mark moved - the old house's quest stamp undiscovered, the
new one discovered under the quest's name where the player had it on the map (`src/systems/quest/machine.js`
reseatHomedSites; `src/scenes/world.js` questSiteMovedHere). A site the player has stood in is REACHED for good
(`siteDetails.reached`, marked by the interior mount, `src/scenes/questBridge.js` mountScene ->
QuestMachine.noteSiteReached, and saved with the site) and never moved; the quest rung opens the home to them, as before.
A save from before the mark says nothing of where its player stood: its sites read as not reached.
A Ledger A departure (`01-Overview/Port-Ledger.md`, the HOME1 row's A QUEST'S SITE IS NEVER ANOTHER PLAYER'S HOME): Daggerfall Unity
never moves a quest site. What stays: a site whose town holds no other building of its kind stays in the home (its
rung); a deleted account's homes go by the database's cascade, which no client carries, so the pages online keep them as
homes until their next boot (a quest passes over them meanwhile).

Pinned by `test/fb1014_questhome.test.js` (6) - the real Worker, the client's own door, the real registry, the real relay
over a real hub room and the real client session on its hub link, and the reporter's own quest taken by the real machine:
the boot's read; the reporter's region; the wiring; the home order and word; the live list (a house bought after a
page's boot read never holds a quest picked after it, a page that joins later hears the held word, a sale says the
house a house again); the re-pick (a site not reached chosen again in its own town, its link and name following; a
reached one kept) - `tools/mutants/fb1014_questhome.json`, 23, all dead. PIN MOVED in `test/wd3_online.test.js` (the
read's `homes`), `test/home1.test.js` (the seam; the claim's order), `test/arena4b_homes.test.js` (the move's order),
`test/guild1c.test.js` and `test/renown1.test.js` (ORDER_KINDS), the account service's version pins (acct133) and the
relay's (world201, `test/relayversion.test.js` its law row - `src/net/homeLaw.js` joins the relay's bundle).

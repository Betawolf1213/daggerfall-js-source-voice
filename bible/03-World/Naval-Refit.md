# Naval Refit - the sea's second refit (NAVAL-REFIT, 2026-10-17)

The owner, 2026-10-17: *"This will be a naval improvement session."* - nine items, each taken as a slice of its own:

1. "Cargo should be able to be accessed at any time. Currently it cannot be."
2. "In that when pirates attack but your first boat (the one that is assigned to be your cabin if you press T > ship)
   You spawn and fight in land which is cool and way better than being teleported to a ship a mile away. Anyway the
   actual bug is that after you defeat the pirates they keep spawning but passive"
3. "Different cannon shot types, for example a grape shot to thin out crew, Chain to try to take down their sail, etc"
4. "Improve and polish combat and visuals"
5. "Let us board a ship without weakening it.. like just ram and board"
6. "When out of combat, the ship should traverse 15% faster"
7. "Can you make it so each island does sell atleast one normal exchange product so you could feasibly live and trade
   out in the veil"
8. "Letting players customize the exterior and interior textures of the ship. Allowing prop placement on the ship itself
   and inside if not already enabled."
9. "Finally, a fully customizable flag with the option to use your guild insignia."

And: *"No band aids, I want you to be as detailed as possible."*

**THE PORT'S OWN**, as the sea fight is (`03-World/Naval-Combat.md`): Daggerfall has no sea and Daggerfall Unity none
either. Where a slice leaves a vendored mod's own law (Come Sail Away's, `03-World/Come-Sail-Away.md`) it says so here
and in `01-Overview/Port-Ledger.md` section A.

## The slices

| slice | item | what | modules |
|---|---|---|---|
| ISLE-TRADE | 7 | every Eltheric isle's freeport makes a good of the Bay of its own and sells it as made; the chart's card names it | `systems/naval/tradeGoods.js` (`isleGood`, `portTrade`, `exchangeOf`), `ui/etherChartWindow.js` |
| PEACE-WAY | 6 | out of a fight her way, and its coming on, PEACE_WAY (1.15) of what it is in one | `systems/comeSailAway/peaceWay.js`, `systems/comeSailAway/comeSailAway.js` (`peace`, the speed arms, `moveAccelOwn`), `scenes/world.js` (the runtime's `peaceWay`) |
| CARGO-ANYWHERE | 1 | a ship's hold opened from anywhere - the hold's key (F4), the helm's Hold, the Fleet page's Hold - at hand, last helmed or the fleet's first, wherever she lies; the hold two-way on the Enhanced skins | `scenes/holdDoor.js`, `systems/comeSailAway/comeSailAwayItems.js` (`cargoLootTarget`), `ui/enhanced/enhancedInventory.js` (`remoteModel`), `scenes/fleetHost.js` (`hold`), `ui/fleetPage.js`, `ui/enhanced/enhancedHelm.js` (`helmButtons`), `systems/inputActions.js` (`ShipHold`), `scenes/world.js` |
| RAID-ASHORE | 2 | a voyage's raid fought where the player stands ends there: its crew and last raiders withdrawn, the quest ended; one raid at a time on the fast travel | `scenes/raidAshore.js`, `systems/warmAshesShips.js` (`LeaveShip`, `onPreFastTravel`), `scenes/world.js` (`raidAshore`, Warm Ashes' host, the quest's end) |

## ISLE-TRADE - a living past the Veil (item 7)

FOUND. Every port isle of the Eltheric Ocean dealt the same board: the three Eltheric goods made (`tradeGoods.js
portTrade`'s ether arm), every good of the Bay WANTED at EXOTIC_K - and `exchangeOf` listed the other sea's goods only
where wanted, and sold none of them (`sells: exotic ? 0 : ...`). So no isle sold wine, grain, wool, iron, spices, silk,
silver or ivory, and since every isle made the same three, no Eltheric good paid from one isle to the next: the only
trade that paid crossed the Veil (CAPT-TRADE's "a reason to cross", `03-World/Captains-Sea.md`), and a captain who
wanted to live out there had nothing to buy.

CHANGED:
- **Each isle's own good** (`isleGood`): one of the Bay's eight, drawn off the port's key - `etherPortOf`'s `"px,py"`
  (`scenes/world.js`), the same on every client - on its own scrambled draw (`mulberry32` of the key's hash). A plain
  `hash % 8` gave neighbours the same few goods (Veilhaven and its five nearest: silver, iron, iron, wine, silver, iron);
  the draw spreads them evenly - the 234 port isles within 400 px of Veilhaven hold 19 to 34 of each good. Veilhaven's is
  spices.
- **Made there** (`portTrade`): an isle makes the three Eltheric goods and its own good of the Bay, and wants every
  other good of the Bay - so its own is priced MADE_K and dealt at DAY_STOCK's `makes` (30 sold a day, 4 bought), exactly
  as a port of the Bay deals what it makes.
- **Sold, and listed** (`exchangeOf`): the other sea's goods are listed where they are wanted or made (`neither` alone
  is left off), and a row is EXOTIC - "not sold here", hidden on the classic skin unless carried (B16's `etherGoods`) -
  only where it is the other sea's good and NOT made there. The Bay's boards are unchanged: an Eltheric good is always
  'wants' in the Bay.
- **On the chart** (`ui/etherChartWindow.js`): a port isle's card reads "A port - makes spices - 12 leagues west", its
  good drawn off the same key the world host gives its port, so a captain plans the Veil's trade on the chart.

What it makes possible, measured (`test/systems/naval/isletrade.test.js`): from every port isle within 120 px of
Veilhaven its own good is bought at its made price and sold in another isle's exchange within 64 px (eleven leagues -
the farthest buyer of those 23 isles is 60 px off) for more than half again what it cost - the Veil's own trade, no
crossing. The Eltheric goods stay made on every isle and wanted in the Bay, so the crossing keeps its reason.

`tradeGoods.js` rides the account service Worker's bundle (`itemLaw.js`), so the change redeploys it; it imports
nothing new (`test/server/accountdeploy.test.js`'s graph is unchanged).

## PEACE-WAY - her way out of a fight (item 6)

`systems/comeSailAway/peaceWay.js` holds the law; Come Sail Away's runtime reads it through one seam.

- **Out of a fight** is what the sea already reads as one: no enemy near her - the runtime's own `enemiesNearby`
  (AreEnemiesNearby over the street's foes and the city's guards, and the sea fight's hostile ship in reach: the word
  that already holds the helm's time scale) - no boarding under way (`navalHost.js boarding`, either side's) and no
  broadside laid (`aiming`). The world host answers the seam over exactly those three (`peaceWay()` beside `brake` in
  the runtime's deps, reading `this.enemiesNearby` - one word, never a second copy of it).
- **What it scales** (`comeSailAway.js`): both of `moveSpeed`'s arms - `oarSpeed` and `sailSpeed` - so her way under
  oars and under sail is PEACE_WAY (1.15) of what it is in a fight, and the journey's estimates (`sailWayOf`,
  `oarWayOf`, AUDIT SHIPS A4) say the way she makes; and the rates her way COMES ON at under oars and under sail
  (`moveAccelOwn`), so she reaches her new way in the time she reached her old (a galleon and a Carrack to 95% in the
  same quarter second as in a fight). A coast - her way lost with no sail set and no oar pulling - is left as it was, so
  when a fight begins she sheds the bonus at her own coast and no quicker. A heave-to's brake is the sea fight's own
  number and is not scaled.
- **Bounded** (`peaceShare`): the seam's answer is held to [1, PEACE_WAY]; none handed (a test scene, the Overworld's
  own runtime calls) or anything not a number is her own way - the mod to the letter.
- **Hers alone.** The captains sail their own law (`navalAI.js helm`; SAIL-FREE's record: scaling them broke the
  duels' tuning), so a fight's odds are unchanged and a ship that runs from her runs from the way she makes in a fight.
  Online her way is said by her measured velocity (`comeSailAwayWire.js`), so the bonus needs no word.

A departure from the mod's `moveSpeed` and `moveAccel` (ComeSailAway.cs 525-551), recorded in Port-Ledger section A.

## CARGO-ANYWHERE - the hold, at any time (item 1)

FOUND. Come Sail Away opens a hold one way - a press on the boat's cargo box (trigger 112402) within the mod's 3.2 m
(`comeSailAway.js` OpenBoatCargo -> OpenCargo -> the host's `csaOpenCargo`); BOAT-MENU's "Open storage" presses that
same box from anywhere on her hull, and nowhere else. So the hold was out of reach: at her helm (AUDIT BOAT-MENU C1 keeps
the list off a helm - the pad's d-pad steers there - and every hull's box stands 5.9 m (the Large Boat) to 28 m (the
Carrack) from its wheel); below deck in her cabin (CABIN-HULL: no boat answers a press in the room); from her quay a
step past 3.2 m; and for a ship laid up, packed or lying anywhere else, by any door at all. And on the Enhanced skins a
hold that did open was TAKE-ONLY: `cargoLootTarget` never said it was the player's own storage, so the window was the
pile's frame alone (MAC-M2 B's law for a body), with no pack beside it and no Store verb - SHIP-STORE
(`01-Overview/bugs/Field-Bugs-2026-09-26.md`) had given `storage: true` to the cabin's cupboards and the companions'
packs a day before Come Sail Away's cargo landed without it.

CHANGED:
- **Two-way** (`comeSailAwayItems.js cargoLootTarget`): `storage: true` - the Enhanced inventory opens the hold beside
  the pack with its Store verb, as the classic skin and the mod's own window always did; the box's own press is two-way
  too. A hold the door opens names itself on the window (`remoteModel`'s storage title): "Sea Wolf's hold", or "Ship's
  hold" for a ship with no name.
- **The hold's door** (`scenes/holdDoor.js createHoldDoor`, built once by the world host): THE SHIP AT HAND (`atHand`) -
  the one at whose helm I stand, the one whose deck I stand on (the sea fight's `boatInPlay`, else the deck's own
  bucket), the one whose cabin I am in (`modes.sailingCabin`); any ship of mine BY HER NUMBER (`openShip`) - afloat
  here or anywhere (her boat's hold), laid up (Come Sail Away's PackedCargoes under her number - `laidUpHold`, the very
  list her placing takes back aboard), or packed in the pack (the same list - and her parts carry her hold's weight, as
  PackBoat sums it, so they are weighed again as the window shuts: `packedHullWeight` and the hold's own kg). A Rowboat
  carries no hold - the mod gives her no cargo box (`HULL_HOLDS`) - and is said so.
- **Three ways in, every skin, every mode, in a fight too**: THE HOLD'S KEY (`ShipHold`, Come Sail Away's group,
  "Cargo", on F4 - the letters are spent and F1 and F3 are the browser's: `ui/input.js BROWSER_STEALS`) opens the ship at
  hand's hold, else the last whose helm I took (`frame` remembers it), else the first of my fleet with a hold, wherever
  she lies; THE HELM'S HOLD (`enhancedHelm.js helmButtons`, a hook button beside Orders on Enhanced Plus - the world
  host hands `cargo` for a hull with a hold); and THE FLEET PAGE'S HOLD (`fleetPage.js`, `fleetHost.js act('hold')`,
  every card of a ship with one), which hands the menu its door - the pause steps aside and the hold opens.
- Nothing about the cargo's law moves: its weight is still on her way whenever she sails (UpdateBoatCargoMod), the
  exchange still deals only from the hold of the boat at the quay, and the hold is the player's own save - online no
  one else's to see, so opening it from afar shares and spends nothing.

## RAID-ASHORE - the raid ends where it was fought (item 2)

THE REPORT, read: "your first boat (the one that is assigned to be your cabin if you press T > ship)" is the sailing ship
a bank ship's cabin is LINKED to (`systems/boatCabinOwnership.js`, `03-World/Come-Sail-Away.md` SAILING-CABINS): once
linked, Transport > Ship opens HER where she lies - and so does Warm Ashes' voyage ambush, whose boarding is that very
transport (`warmAshesShips.js transportToShip` -> world.js `shipTransportMode` -> `boardOrDisembark` ->
`enterLinkedBankCabin`). The raid is fought at her quay, by the land - "way better than being teleported to a ship a
mile away", as the owner says - its waves stood about the player on the open ground (world.js tryPlaceFoe; the naval
host places only the raids it started itself) or on the cabin's floor.

FOUND, by running the author's WAQ_SHIP_SMALLRAID through the port's real quest machine: once the boarders are down no
pirate spawns again. What keeps spawning is the raid's CREW. Every wave stands five `_ally_` Warriors with the
boarders, and `_callfriends_`, `_callfriends2_` and `_callfriends3_` call five more as five, ten and fifteen of them fall;
the `_setFoeInfight_` loop (`daily from 00:00 to 24:00`, re-armed by its own `clear`) sets their team back to the
player's on EVERY tick, so a crewman struck is an ally again a tick later and never fights back. Nothing in the script
removes `_ally_`; the quest ends only on its hour's clock (`_cooldown_`). On "Your Ship" - the sea's own region,
WA_SEA_REGION 31 - the IL's Leave Ship sails the player off the ship and its scene stays behind with the crew in it.
Ashore its other arm only completed the action: the player stayed beside five Warriors drawn and named as any foe, and
counted as enemies near, who never turned on them and came back five at a time as they were cut down - "they keep
spawning but passive" - for the rest of the hour.

CHANGED (DECLARED, Port-Ledger section A):
- **Leave Ship ashore** (`warmAshesShips.js LeaveShip.update`, the arm off region 31): the ship blocks back to `_base`
  (the IL resets them only at sea), the host's `raidAshore(quest)` withdraws the raid, and the quest ends as its own
  `end quest` ends one (`questBreak`, `endQuest` - the machine tombstones it after its two ticks of grace). Message 1014
  ("The attackers have been fought off") is the quest's own, said before. At sea nothing changes.
- **The withdraw** (`scenes/raidAshore.js createRaidAshore`, built once by the world host before the quest bridge):
  every LIVING foe the quest stood (`questFoesOf`, the quest resource behaviour's UID - world.js endRaid's law) out of
  every pool it can stand in now - the street's (`exteriorFoes`) and, below deck, the room's (`modes.interiorPool()`) -
  the dead left lying to be looted. Its grace ticks can still place a wave a CreateFoe had in flight, so the quest's end
  (world.js `onQuestEnded`) sweeps again, for a raid ended ashore only, once.
- **One raid at a time on the fast travel too** (`onPreFastTravel`): the IL arms its ambush whatever runs, so a voyage by
  ship while a raid's quest ran started a second over the first. It answers 'busy' now, as `raidAtSea` and the sea
  fight's boarders already did (`raidRefusal`), the blocks left as the running raid set them.

Measured on the real machine (`test/systems/quest/raidashore.test.js`): each of the three outcomes - eight Rogues, eight
Barbarians, six Orcs and two sergeants - stands its five crew; won ashore, nothing of the raid stands, its dead lie
where they fell, the quest is tombstoned, and no crew is called in the hour it would have run. With the IL's arm alone
the same win leaves the five standing and the quest running, and five struck call five more.

Left as found: a transition while a wave is in flight (into the cabin and out) re-arms that wave - DFU's own CreateFoe
law (`onTransitionExterior`), the same for every quest; it is not this report.

## THE FOUR HOSTS RULE

- `scenes/world.js` - the one host that streams the sea and stands Come Sail Away's runtime: PEACE-WAY's seam is wired
  there; ISLE-TRADE's isles are its streamed world's, and its harbour office the one exchange.
- `scenes/worldModes.js` (interiors), `scenes/dungeonContext.js` - no runtime of their own: a dungeon's water is sailed
  by the world host's one runtime (KEEP-BOATS), and its `enemiesNearby` already reads the mode's own foes there
  (`modes.insideFoes`), so PEACE-WAY holds below ground by the same word; no isle's exchange stands indoors - FLAGGED.
- `scenes/exterior.js` (the fixed-city bench) - FLAGGED: no Come Sail Away runtime and no Eltheric Ocean; no linked
  ship and no voyage, so no raid ashore.
- RAID-ASHORE's withdraw reads the world host's two pools - the street's and, through `worldModes.js`'s `interiorPool`,
  the sailing cabin's room; `dungeonContext.js` - FLAGGED: no voyage's raid is fought below ground.

## Tests

- `test/systems/naval/isletrade.test.js` (5) and `tools/mutants/isletrade.json` (8, all dead); `capttrade.test.js`'s
  two isle pins and `etherchart2.test.js`'s card pin moved (PIN MOVED), and `tools/mutants/capttrade.json`'s two isle
  records re-aimed at the lines they name now (42, all dead).
- `test/systems/comeSailAway/peaceway.test.js` (5) on Come Sail Away's real runtime, and `tools/mutants/peaceway.json`
  (12, all dead).
- `test/scenes/holddoor.test.js` (6) over Come Sail Away's real runtime and the Fleet's ledger and host, and
  `tools/mutants/holddoor.json` (16, all dead); the action list's pins moved for `ShipHold` (`inputactions`, `qs2_inputs`,
  `classicpages`, `viewtoggle`, `uicalm`) and the helm panel's (`shipcrew`, `auditnav2_helm`, `fb1011c_seatown`).
- `test/systems/quest/raidashore.test.js` (6) over the author's own quest and the real machine, and
  `tools/mutants/raidashore.json` (13, all dead); `wa1_warmAshesShips.test.js`'s Leave Ship pin moved (PIN MOVED: off
  the sea it now ends the raid).

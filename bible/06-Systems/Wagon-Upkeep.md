# Wagon upkeep (WAGONS4, 2026-10-11)

The owner: "Wagons have durability and require upkeep to keep from breaking down and becoming unusable." Horses are
`06-Systems/Horse-Care.md` (STEED1); this page is the wagon - every kind (`06-Systems/Wagons.md`: the Small Cart, the
Open Wagon and the Caravan).

A departure of the port's own, the enhanced lane's alone: Features, World tab, Travel - **Wagon upkeep**
(`systems/upkeepSwitch.js` wagonUpkeepOn, the `wagonUpkeep` pref), on by default and forced on online. Off, a wagon
never wears.

WAGON-MEND (2026-10-12, the owner: "wagons shouldnt entirely break down to become unusable"): no wagon is ever broken.
WAGONS4 shipped a fifth state, Broken at nought, which no team pulled - refused at every door a short team is, the
classic cart's driver put afoot beside it. It is retired: wear stops at a wagon's last point (`wagonUpkeep.js`
WEAR_FLOOR), Failing is the floor, and a wagon a save holds at nought from before is Failing too. The hosts' `teamShort`
is WAGONS3's short team alone again, and the classic Transport window's Cart row and a journey's fare read the cart as
DFU does.

## The durability is the condition it always carried (`systems/wagonUpkeep.js`)

Every wagon is DFU's Small Cart item (template 93) and has carried a condition since its mint - 1400 of 1400
(`itemTemplates.js` mintCondition) - which nothing lowered. WAGONS4 lowers it. A wagon minted before its condition
was is whole. The item card's Condition and a sale's condition price (Roleplay & Realism: Items' conditionCostBase)
were already reading it. Its VALUE never falls: the item law holds a marked wagon to its kind's floor, and wear is its
condition alone.

| State | From | Its team's pace |
|---|---|---|
| Sound | 60% | 1 |
| Worn | 30% | 1 |
| Rickety | 10% | 0.85 |
| Failing | under 10%, to its last point (and a save's nought) | 0.7 |

A step down to Rickety or Failing is said once.

## What wears it

- **The road** (`rollWear`, through the runtime's wear account): by the kilometre it rolls with its owner - driven, or
  its team following them (the motor's odometer's metres: a placement, a carry or an origin shift is never counted) -
  1% of whole a kilometre on a road, 2.5 times off one, up to 1.75 times under a full load, and the bigger wagons are
  built heavier (the Open Wagon 0.85, the Caravan 0.7). A point comes off whole (1400 points: some seven metres of
  road), the metres owed kept for the next. A half-loaded Caravan is worn to its last point some hundred kilometres of
  road from new, and rolls on at the failing pace.
- **A journey on the travel map** it goes on (driven, or its team following along - `horseCart.js`
  wagonGoesOnJourney; with Horse Cart and Cargo off, the cart goes where its owner goes): 1% a day, 20% a journey at
  most.
- **The town watch** carrying it off (`scenes/wagonWardenHost.js` throwMine, WARDEN1): 10%.

A wagon left parked does not wear.

## Failing, it still goes

Worn as far as wear takes it, a wagon is Failing: its team pulls it at 0.7 of its pace (`upkeepRuntime.js` rideScale,
times its team's Strength under its load), and it is driven, hitched, followed and taken on a journey like any other.
The Stable page, the saddle panel and its line (`ui/enhancedSaddle.js` saddleHint) say to mend it to get its pace back.

## Mending

- **A Wagon Yard** (`03-World/Merchant-Yards.md`): its keeper's third row, **Mend** (`merchantYards.js`
  YARD_MEND_ROW). The wright makes the wagon driven whole for 12% of its kind's value at most (40 gold at the least),
  by what it lacks - a Caravan at nought 3000, a worn one half that - asked in a Yes/No box, then paid
  (`scenes/world.js` mendAtYard). A wagon not drawn up at the yard (Horse Cart and Cargo's wagon out of the counter's
  reach - the reach its load is taken at) costs half again: a wright goes out to it.
- **A Wagon Repair Kit** (1711, WAGONS4's own - `systems/upkeepItemRows.js`): a quarter of whole back, to 60% at most,
  an hour's work. Used from the pack or the wagon's own load, or from the
  Stable page's button, where the wagon's load can be reached. A Wagon Yard sells them in a stack of YARD_KITS_STACK.
- **Never a smith**: a wagon left at a smith's counter left the pack for days, and Horse Cart and Cargo's wagon in the
  world with it - so a smith refuses a horse and a wagon first, in their own words, at both counters
  (`systems/repairService.js` repairRefusal 'transport', TRANSPORT_CANNOT_BE_REPAIRED_TEXT). Before WAGONS4 no wagon
  was ever damaged, so the counter's "does not need repair" had stood in the way.
- **Never a held Repairs Objects** (AUDIT WAGONS4): the enchantment's pick passes a wagon and a horse by
  (`systems/enchantments.js` repairsObjectsTarget) - DFU's wagon never wore, so its mend never reached one; here it
  would have mended a failing Caravan free and whole, past the yard's price and the kit's ceiling.

## The Stable page

The wagon's card shows its Repair meter in its state's tone (sound and worn the kit's verdigris, rickety plain, failing
blood - STEED-UI), its state's word and advice, what a Wagon Yard asks to make it whole - at the yard, and
with its wright going out to it (`upkeepRuntime.js` wagonCard's mend and mendAway, `ui/holdingsPages.js` mendLine) -
and **Use a repair kit** while a kit would mend it (`ui/holdingsPages.js` wagonLines).

## The saddle panel (STEED-UI - `10-UI/Controls.md`, THE SADDLE PANEL)

On Enhanced Plus, on the bench, the wagon is on screen under the compass (`ui/enhancedSaddle.js`): its state and share
of whole, its load against its limit, and its doors - **Repair kit** (where a kit would mend it, dark without a kit or
the wagon's reach), **Cargo** (its load opened with the wagon chosen, where Horse Cart and Cargo's own reach allows -
`systems/horseCart.js` openWagonCargo), **Climb down**. A failing wagon's line says to mend it to get its pace back.

## Online

The wagon's condition rides the wire as it always did. The kit followed REST6's law, SHIP BEFORE ANYONE CAN SEE ONE:
UPKEEP_ITEMS_ONLINE was false for the release that shipped it (#791). UPKEEP-ONLINE (2026-10-12, the owner: "We never
added oats or repair kits to the new horse/wagon system") turned it on - every release since has carried the template -
so online a Wagon Yard sells its kits as it did offline from the first (`systems/upkeepItemRows.js`).

## The four hosts

`scenes/world.js` and `scenes/exterior.js` wear the wagon in the frame's upkeep and register the kit's Use (WAGON-MEND
took out the broken word they handed the runtime, the classic window's Cart row's gate and the classic bench's
dismount); world.js wears it by a journey's days, by the watch's throw, and stands the Wagon Yard's wright. `scenes/worldModes.js` and `scenes/dungeonContext.js` stand no transport
(a building or a dungeon puts the driver on foot) and are named, not wired; worldModes.js refuses a wagon at a smith's
counter (its own repair list).

Pinned: `test/wagons4_upkeep.test.js`; mutants `tools/mutants/wagons4.json`, and WAGON-MEND's and UPKEEP-ONLINE's
`tools/mutants/wagonmend.json`. The saddle panel and the page's polish:
`test/steedui_saddle.test.js`; mutants `tools/mutants/steedui.json`.

# Horse care (STEED1, 2026-10-11)

The owner: "On top of this system, I want to build the new horse and wagon maintence systems. Horse should have
stamina, feeding them grows your bond and improves their stats. Every horse should have different stats." Wagons are
`06-Systems/Wagon-Upkeep.md` (WAGONS4); this page is the horse.

A departure of the port's own, the enhanced lane's alone: Features, World tab, Travel - **Horse care**
(`systems/upkeepSwitch.js` horseCareOn, the `horseCare` pref), on by default and forced on online (every horse in a
room under the one law). Off, a horse is DFU's: no stats, no gallop of its own, nothing to feed.

## The law (`systems/steedCare.js`)

### Four stats, each horse its own

A horse's seed is the horse (COATS1 - `06-Systems/Horse-Coats.md`: rolled at its birth, never changed), and its stats
are its seed's: each the mean of two draws off the seed, 20 to 80, most near 50 (`bornStats`). No field holds them,
so every horse born before STEED1 has had its stats all along, and every client reads the same horse the same.

| Stat | What it does |
|---|---|
| Speed | the ride's pace - the motor's ride base (and its gallop) times 0.85 + 0.003 a point: 1 at 50, held to [0.85, 1.15] (`steedSpeedScale`) |
| Stamina | its breath: STAMINA_BASE 40 + 1.2 a point (`breathMax` - 100 at 50) |
| Endurance | how slowly a gallop spends the breath (x 1.25 - Endurance / 200) and how fast it comes back (x 0.75 + Endurance / 200) |
| Strength | a wagon's pace under its load: 1 - load x (0.3 - 0.002 x Strength), never under 0.75 - the team's mean (`teamDraftScale`) |

A stat as it stands is its born value, plus a point for every five of its bond (BOND_STEP), less its hunger's penalty,
held to [1, 100] (`steedStats`).

### The bond (`horseBond`, in tenths)

Grown by feeding: a day's food is three points (DAY_BOND_TENTHS 30), times the food's love. Its word: Wary (0),
Accepting (15), Familiar (35), Trusting (55), Devoted (75), Kindred (95). A Kindred horse is twenty points better on
every stat than the one bought. The bond is its OWNER's: `net/realmTradeLaw.js` RECEIVER_MARKS strips it from a
traded horse, so it comes to its next owner a stranger. So is its food's clock (`horseFed` is a minute of its owner's
character's clock, AUDIT STEED1 - a buyer a year behind would have had it fed a year ahead): it comes fed as a horse
first seen, and a minute's grazing never makes an offered horse's record mismatch its checkpoint.

### Hunger (`horseFed`, the minute of the character's clock its food runs out)

| | From | Stats | Breath back |
|---|---|---|---|
| Fed | food in it | - | x 1 |
| Hungry | its food run out | -10 | x 0.7 |
| Starving | two days on (STARVING_AFTER) | -25, and no gallop | x 0.4 |

It never dies of it - nor of anything else: HORSE-LIVES (2026-10-12, the owner: "Horses shouldnt die") pins it -
a year with its owner and no food leaves it in the pack, starving, its stats held to 1, its bond to nought, ridden at
Speed's floor; a sack of oats and it is fed again. A starving horse's bond fades two points a day - kept as the time it has starved, and taken off
ONCE, when its food clock next moves (a meal, the stable, grazing), so it is never counted twice. A horse first seen (a
purchase, a horse owned before STEED1) comes fed twelve hours ahead.

### What it eats

| Food | Hours | Love | Where |
|---|---|---|---|
| Sack of Oats (1710, STEED1's own - `systems/upkeepItemRows.js`) | 24 | 1 | a Stable sells them; Use one, or the Stable page |
| Apple (Climates & Calories' 532, Foraging's 1608) | 4 | 1.5 | by hand, from the Stable page - a treat |

A horse fed more than FULL_AHEAD (30 hours) ahead is full and refuses; it holds FED_AHEAD_MAX (48) at most. A quest's
piece is never fed.

### The keep (`tendHorses`, once a game minute)

Where a horse is decides who feeds it (`systems/upkeepRuntime.js` horseWhereOf, off Horse Cart and Cargo's Stable view):

- **With its owner** (ridden, pulling, following, in the harness of a wagon that follows - or the mod off, or without
  its physical persistence: the classic transport goes where its owner goes): fed by hand; and across any span of the
  clock skipped (SKIP_MINUTES, an hour - a rest, a wait, a journey), it eats a sack of oats each time its food runs
  out, while they last, its bond grown as by hand - the pack's first, then the wagon's load where the wagon is in reach
  (the hosts' `stores`: Horse Cart and Cargo's storage reach, upkeepReach's wagonNear). The Stable page's Feed and its
  counts read the wagon's load the same way.
- **Waiting** in the world (left loose, or in the harness of a parked wagon): it grazes - hungry, never starving.
- **Stabled** (out of the world, where the Stable page says it is): the stable feeds it.

Grazing or stabled, a span the keep did not run across (an inn's rest, a dungeon: no frame ticks indoors) costs it no
bond - only a fade owed before the span is taken (AUDIT STEED1). The keep's clock is the character's: a load and a new
character start it afresh (`upkeepRuntime.js` reset, at every door the world host loads through), and so does the
switch turned off - a horse is never fed back a span from a minute another character or session last kept it.

### Breath (`stepBreath`, kept in memory by the horse's seed - a gallop's breath is not a thing to save)

A gallop spends it; at nought the horse is WINDED and will not gallop until WINDED_UNTIL (30%) is back. It comes back at
a walk or standing (BREATH_BACK 2.2 a second at Endurance 50), half as fast under a rider at the ride's own pace,
slower hungry, and whole across any span skipped. An average horse gallops some thirty seconds and is back to 30% in
about fifteen.

## The gallop (`systems/transport.js` setGallopGate)

The run key on a horse is the gallop. DFU forbids a run in the saddle (CanRunUnlessRiding); Roleplay & Realism's
Enhanced Riding allows it outside towns (`rrCanRunRiding`). Horse care's word comes after the mod's: where the mod
says no (a town), no; where it says yes or says nothing, the horse gallops on its breath - never winded, never
starving. The gallop is the horse's breath, not the rider's fatigue: the hosts' activity bag (`running`) leaves a
gallop under horse care out of DFU's running band (`upkeepRuntime.js` riderPaysGallop).

## The motor (`player/motor.js` rideSpeedScale)

The hosts hand the motor its ride's pace each frame, before its step (`upkeep.rideScale`): a horse's Speed; a wagon's
soundness (WAGONS4) times its team's Strength under its load. It scales the ride base, the gallop and the half-speed
base IsMovingLessThanHalfSpeed reads; it never touches a walk. The fastest horse's gallop at Speed 100 is under the
hitch's jump (HITCH_JUMP_SPEED 30).

## The Stable page (`ui/holdingsPages.js`)

Each horse its card: the ridden one's (its name, its look, its coat rows) and every other horse owned. On each, its bond
and hunger in words - a fed horse with the hours its food lasts (STEED-UI) - its **Bond** a bar from its word to the
next with the points still to go (whole at Kindred), the ridden one's breath (Winded said in words), its four stats
with the bond's share beside and each stat's making on its tooltip (born, the bond's points, hunger's), **Feed oats**
and **Give an apple** (dark with none, full, or away), and **Ride this one** on every other - the chosen horse made the
pack's first (`chooseRiddenHorse`), so its look, its breath and its stats are the ridden ones. A horse is fed by hand
only within Horse Cart and Cargo's own mount reach (a horse waiting across the map is not), and never at the stable
(`upkeepRuntime.js` upkeepReach).

The HUD: the ridden horse's breath in the climb's grip bar's place (a rider holds no wall) - the classic HUD's bar
(`ui/hud.js` drawGripBar), the enhanced HUD's under the word Horse (`ui/enhancedHud.js`); short when winded, under a
quarter, or starving.

## The saddle panel (STEED-UI - `10-UI/Controls.md`, THE SADDLE PANEL)

On Enhanced Plus, astride or on a wagon's bench, the horse is on screen under the compass (`ui/enhancedSaddle.js`, off
`upkeepRuntime.js` saddle): its breath, its hunger with its food's hours, its bond to the next word, the gait and the
pace; and its doors - Feed oats, an Apple, the Stable page, Dismount. On a bench the hunger is the TEAM's (the
hungriest horse in harness, `saddle`'s `feed` - the one its Feed goes to) and the bond the lead's.

The item: a horse's card says its four born stats and its bond (`systems/itemInfo.js` itemStatRows), so a Stable's
horses say theirs before they are bought.

## The Stable's horses (`systems/merchantYards.js` stableHorses)

A Stable stands STABLE_HORSES_OFFERED (3) horses a day, each born at the yard on a stream of the town's map id, the
world's day and its stall - every client in the town that day sees the same three, another day another three - and a
horse the buyer already owns is not stood again. Priced by what it is while horses are cared for (`steedValue`: DFU's
1000 at a mean of 50, a fiftieth of it a point either way, never under 400). It sells oats beside them, in a stack of
YARD_OATS_STACK.

## Online

The fields ride the wire as every item field does (`systems/itemFields.js` horseBond 1..1000, horseFed 1 up; the item
law holds them to DFU's Horse alone). The new templates followed REST6's law, SHIP BEFORE ANYONE CAN SEE ONE:
UPKEEP_ITEMS_ONLINE was false for the release that shipped them (#791). UPKEEP-ONLINE (2026-10-12, the owner: "We
never added oats or repair kits to the new horse/wagon system") turned it on - every release since has carried the
templates - so online a Stable sells oats as it did offline from the first (`systems/upkeepItemRows.js`).

## The four hosts

`scenes/world.js` and `scenes/exterior.js` build the upkeep (`createUpkeep`) before Horse Cart and Cargo's runtime,
set the gallop gate, register the oats' Use, hand the motor its pace and the frame's upkeep its odometer's metres, the
HUD its bar and the Stable page its acts. `scenes/worldModes.js` (interiors) and `scenes/dungeonContext.js` (dungeons)
stand no transport - a building or a dungeon puts the rider on foot (`transport.js` dismountOnTransition) - and are
named, not wired.

Pinned: `test/steed1_horsecare.test.js`; mutants `tools/mutants/steed1.json`, and HORSE-LIVES's and UPKEEP-ONLINE's
`tools/mutants/wagonmend.json`. The saddle panel and the page's polish:
`test/steedui_saddle.test.js`; mutants `tools/mutants/steedui.json`.

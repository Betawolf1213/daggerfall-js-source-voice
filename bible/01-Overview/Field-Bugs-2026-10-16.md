# FIELD BUGS 2026-10-16 - the Discord's bug reports of 2026-10-15, each fixed at its root

The bug-report threads of 2026-10-15 from the Discord, handed over as screenshots. Read on the code as it stands at
main's `7e0424e0`.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | "I respeced yesterday and have a timer on my 50 lvl smithing, however, when I reached level 100, I can not choose level 100 perk" | the Professions page greyed every card of a track while a paid change waited at either rank; the service already took a first pick (and the merge's free change) before its one-change-at-a-time refusal | fixed (FIRST-PICK) |
| 2 | "I reloaded my game near the arena ... I've done all 40 fights already for this season, so I hit fight, and it reset my rank, and when I look at the season it doesn't have a number" | on the online lane before the relay's first welcome every arena door ran the offline law: the Herald offered Fight off the save's ladder, the bout and its purse were this screen's, the window drew the save's season ("Season of 3E 406") and roster - the account's forty wins untouched | fixed (ARENA-WAIT) |
| 3 | "I paid 2 x 600 gold today, and even though it said +5 reputation, my reputation didn't go up at all ... why I still have a penalty" (the "Possible bug: Repeated ..." thread, after FINE-MENDS); "It didn't work for me either" | the +5 was the law's and it held; a charge costs two names - the law's and half of it off the region's People, spread to the kingdom (the Standing page's Kingdoms row) and read by every commoner - and a sentence gives back both, but the watch's fine and a temple's penance mended the law's alone | fixed (FINE-PEOPLE) |
| 4 | "Shipyard formatting is cooked" - "The text here may need a bit of work, as you can see!" | a shipyard row's acts track was `auto`: grid grew it to every press and the name box on one line before the words' track had a pixel, so a ship's words stood a word a line | fixed (YARD-ROWS) |
| 5 | "items not repairing at all with 'repairs objects'" ... "my weapon WILL repair but no other worn items are repairing with repair objects" | a tick mended a pool weapon the classic Dagger's share (32) and every other piece DFU's point - a steel cuirass's 6,144 a point a tick, its % still for an hour while the blade's climbed | fixed (MEND-ARMOUR) |
| 6 | "turning horse care off completely hides my other horses" | the upkeep's model listed horses only under a care tier, and the page drew the other horses and "Ride this one" only under one: Off (and the classic skin) the ridden horse alone | fixed (HORSE-CARE-OFF) |

## FIRST-PICK: a change on its way gates a change, never a rank's first choice (1)

`src/ui/profPages.js` drawProfessionsPage, the specialisation cards.

THE REPORT. A paid change at Smithing 50 waiting out its week ("In effect from Wed, 21 Oct 2026"); Smithing reached
100, and none of the four cards at 100 could be chosen. A second player confirmed it.

FOUND. The page disabled a card on `!!tr.respec` - the track's one pending change, whatever its rank - so every card of
the track, at both ranks, greyed while any change waited. The service's rule is narrower: `chooseSpec`
(`server-account/src/professions.js`) answers a rank's FREE FIRST CHOICE ("only while the rank has none") and the merge's
free change (CRAFT3, `free_respec`) before it refuses a second paid change with `prof-respec-pending` ("one change at a
time", `06-Systems/Professions-Arc.md`). Driven on the real Worker: Goldsmith at 50, a paid change to Weaponsmith, XP to
100 - the page greyed all eight cards; the Worker, asked for Masterwright at 100 from nothing, answered ok. The free
change's "Change: free, once" was hidden by the same test.

CHANGED: a card waits only when its rank already holds a choice, a change is on its way, and the change it would make
is not the merge's free one - the service's own order. The price line follows the same test. Nothing the service does
changes.

THE FOUR HOSTS: none - the Professions page is a window every host opens alike. Pinned by `test/fb1016_firstpick.test.js`
(2, the first end to end over the real Worker, client door, profBook and page); `tools/mutants/fb1016_firstpick.json` (5,
all dead).

What the reporter is owed: with a change on its way at 50, the perks at 100 can be chosen the day you reach it.

## ARENA-WAIT: on the online lane, before the relay's word, the arena waits (2)

`src/net/online.js` the session's `arenaHeard`; `src/scenes/arenaOnline.js` waiting, model, act, fightLadder,
watchExhibition, team; `src/scenes/arenaGate.js` online, settle; `src/systems/arenaBoard.js` arenaBoard's no-board arm,
pendingBoard; `src/scenes/world.js` the arena online's `lane` and `nowS`, arenaHeraldAct's Fight and Watch, arenaFrame.

THE REPORT. A character who had fought all forty of the season's bouts reloaded beside the gate. The Herald offered
Fight; the bout reset the rank, and the window's season "doesn't have a number" (the screenshot: "Season of 3E 406",
"4 won, 0 lost", Tier 2 Bloodied, Pit Fighter).

FOUND. The forty wins were the account's and nothing touched them. `live()` - the arena online - is a session whose
last welcome said the relay opens the arena's rooms (`arenaOk`; AUDIT PRE-MERGE 1003 O4 made it sticky so a door's
reconnect never reads as offline). After a load there is no session until the player stands in the world, then a
token and a socket round trip before the first welcome - and every arena door read that `live()` false as OFFLINE,
ARENA3's law: the Herald's Fight off the save's ladder (`arenaGate.js` heraldChoice - the online climb never writes
`arenaLadder`, by design), `world.js` arenaHeraldAct's local bout and its purse, and the window's no-board arm drew the
save's header - the season the offline one, the game year ("Season of 3E 406, day N of 360"), where the realm's is
numbered ("Season 1, day 19 of 56") - its title, its record and the seeded roster. Driven on the real modules: no
session, or a session unwelcomed, and the Herald offered "Your next bout: The Pit - bout 1 of 3"; four local wins made
the save's ladder the window's Pit Fighter 4-0, 350 gold paid here. The welcome then showed the Grand Champion again,
but the save kept its offline climb.

CHANGED:

- **The relay's word, kept.** `OnlineSession.arenaHeard` - a primary welcome has said `arenaOk`, sticky as it is.
- **Waiting.** `createArenaOnline`'s `waiting()`: on the online lane (`lane`, world.js's `onlineOn` - a realm character)
  with no session, or one no welcome has answered. While it waits the arena is neither the account's nor the save's:
  Fight says the climb is on its way (`climbWait`), a challenge and the hour's Watch say the hall is a moment away
  (`hallWait`), a banner says so too; the window's model is the online one with no board and the hall shut.
  `arenaGate.js` takes its online arm while waiting, so the Herald offers no Fight (the arm that already waited for the
  board), the window's Fight is refused, the plaques stand bare, and the book settles nothing by the house's record
  until the relay's verdicts can be asked (O4's law, now for the first word too). world.js's Fight, the city's sand and
  the Herald's Watch take the online arm; the sand stands nothing of this screen's own.
- **The window before the board.** The no-board arm (online, waiting or the board still asked) draws the realm's season
  by the clock (`arenaSeasonOf` over the host's relay clock), no title, record, banner or purse of the save's; the
  banners' and every board's names "not in yet" (`rollWait`); the ladder page's next bout withheld and its line the
  climb's wait.
- **Not waiting:** a relay that said no (an older one - offline, as ever) and a seat given up (O9). An offline
  character's arena is unchanged.

THE FOUR HOSTS: world.js - WIRED (the arena online is its alone: the lane, the clock, Fight, Watch and the city's
sand, on lines it already had - bootWorld stands at its ceiling); exterior.js's gate has no arena online (the fixed
city plays offline) - unchanged; worldModes.js and dungeonContext.js read the gate's `hall` and `plaques`, which wait
with it. Pinned by `test/fb1016_arenawait.test.js` (2, over the real OnlineSession's welcome, the arena online and the
gate); `tools/mutants/fb1016_arenawait.json` (18, all dead). PINS MOVED: `arena4b_mirror.test.js` and
`audit1003_online.test.js` read world.js's arenaFrame and Watch branches with the wait's arm; mutants
ARENA4b-MIR-GATE-HOUSE-ONLINE, -WORLD-CITY, -WORLD-WATCH and ARENA4B-PURSES-BEFORE-BOARD re-aimed by content, all dead.

FLAGGED, not taken: the save's own ladder is not healed - it still holds whatever an offline climb last left, which the
character sheet's arena line reads (`enhancedCharSheet.js` arenaSheetLine). Whether the save should mirror the account's
climb is a design call; no arena door reads it online any more.

What the reporter is owed: your Grand Champion title and your forty wins were never lost - the rank and the season you
saw were the offline arena's, shown for the seconds before the server answered. The arena now waits for the server
instead.

## FINE-PEOPLE: a fine and a penance give the People's half back too (3)

`src/systems/court.js` raisePeopleForAnswer; `src/systems/standing.js` settleChallenge, doPenance.

THE REPORT. The FINE-MENDS thread again, a day after it shipped: two fines of 600 paid, the HUD said +5 each time,
"my reputation didn't go up at all", and "I still have a penalty". A second player: "It didn't work for me either".

FOUND. The +5 held: the law's number (`legalRep`, client-held, saved whole - no service touches it) rose five a fine,
to the -10 line, as FINE-MENDS shipped. But a crime costs two names (`court.js` lowerRepForCrime,
`PlayerEntity.cs:2294-2298`): the law's loss, and half of it off the region's People faction, spread up to the kingdom it
hangs from - which the Standing page lists apart, under Kingdoms ("Daggerfall"), and which every commoner's reaction reads
(`talk.js` getReactionToPlayer). A sentence served gives back both (raiseRepForSentence, REP2: "the legal loss, and half
of it off the region's People"); the watch's fine and a temple's penance - the port's own answers short of the court -
mended the law's alone. Driven on the real watch: a murder and an assault (the law -28, the People and the kingdom -14),
two fines - the law -18, the People and the kingdom still -14. And the fine's price moves in 40-gold steps (eight points
of standing), so -27 and -22 are both asked 600: two fines of the same sum read as nothing moved.

CHANGED: an answer short of the court gives the People half the points it gave the law (`raisePeopleForAnswer`:
sentenceRefund's own half, truncated as the charge's was), spread as the charge spread, never past 0 - it mends a
charge and buys no favour. The fine (`settleChallenge`) and the penance (`doPenance`) both call it; the HUD's law line is
unchanged. No store (a host that never ran chargen), nothing - the charge's own silence. `06-Systems/Standing-Arc.md` and
Port-Ledger's REP row say it.

THE FOUR HOSTS: none - the watch is `standingHost.js`'s (both open-world hosts wire it) and the penance the temple's
window; the law is one module. Pinned by `test/fb1016_finepeople.test.js` (3, the first through the real watch's stop);
`tools/mutants/fb1016_finepeople.json` (7, all dead).

NOT TAKEN (Mac's to decide): the fine's 40-gold steps and the -10 line together make a deep standing a run of same-price
fines; the stop reads the law's number alone, never the People's.

What the reporter is owed: the +5 you paid for was real - your standing with the law rose each time. What did not move
was your name with the people of the kingdom, which the same crimes cost and only a prison sentence gave back. A fine or
a penance now mends that too.

## YARD-ROWS: a ship's words stand beside her name, her presses under them (4)

`src/ui/shipyardWindow.js` SHIPYARD_CSS's `.dfyard-row` and `.dfyard-fleetrow`, fleetPage.

THE REPORT. The shipyard's Your fleet page: a ship's words ("Laid up at Aldwall Rock - she is brought round to any port
you call her at. Worth 3,546 gold - the shipmaster offers 431 gold") a word a line down a sliver of the window.

FOUND. A shipyard row is a grid of three tracks - her name, her words, her presses - and the presses' track was `auto`.
Grid layout grows an auto track to its content's max-content before the fr tracks are given anything, and a fleet
row's presses are four buttons and a name box (an input's default 20 characters): in the 760 px window they took every
free pixel, the name track stood at its 110 px floor and the words' at `minmax(0, ...)`'s zero. Measured in Chromium
(the window mounted on the reporter's fleet): the words 0-38 px wide, a row 400-700 px tall. The other pages' rows have
one press and never met it; a Crew Hall recruit's swap picker did, at 600 px. No design record redesigns this window;
the Holdings card (`ui/fleetPage.js` shipCard) draws the same ship with her presses on a line under her words.

CHANGED: the presses' track is `fit-content(40%)` - never wider than its share - and a fleet row is two tracks with
her presses a line of their own under her name and words, the Holdings card's shape. The phone's one column stands as
it was. Measured again on the real window: the words 439 px at 1440 and 800, 321 at 600, the rows 104-172 px; the
Refits and Crew pages' words 146-385 px; nothing sideways.

THE FOUR HOSTS: none - the shipyard is a window every host opens alike. Pinned by `test/fb1016_yardrows.test.js` (2: the
CSS's law and the mounted fleet page); `tools/mutants/fb1016_yardrows.json` (4, all dead). PROBE (no suite row - it needs
a browser): `node tools/shipyardWindowProbe.mjs` measures every row's words on the Fleet, Refits and Crew pages at four
widths.

What the reporter is owed: the shipyard's fleet page reads as a page again.

## MEND-ARMOUR: every worn piece mends its own share a tick, not the weapon alone (5)

`src/systems/enchantments.js` repairsObjectsMend, MEND_SHARE_OF, the RepairsObjects row's magicRound.

THE REPORT. "items not repairing at all with 'repairs objects'" ... "my weapon WILL repair but no other worn items are
repairing with repair objects."

FOUND. The tick ran and picked the right piece; it mended too little to see. MEND-WORN (2026-10-07) gave a weapon on
WEAPON-POOL's pool the classic Dagger's share - 32 a tick, its point of its 50 on the 1,600 (`POOL_WEAPON_MEND`,
`mendsOnPool`) - and every other piece kept DFU's point (`CONDITION_AMOUNT`, `RepairsObjects.cs:26`) against conditions
in the thousands (`itemTemplates.js` mintCondition: an iron cuirass 4,096, steel 6,144, Daedric 32,768); Port-Ledger's
MEND-WORN row recorded "armour keeps the point" on purpose, as DFU's. Driven on the real pump (runMagicRoundsFor) over
the real producers: a steel longsword at 50%, seven pieces of steel plate at 70%, a ring of Repairs Objects worn - after
720 rounds (about an hour of play) the blade stood at 71% and every piece of plate at 70% (the cuirass 4,301 to 4,337);
with a shirt and breeches under the plate the kit wanted 8,408 ticks to be whole, about 47 real hours.

CHANGED (the owner: "Stop trying to match DFU"): one law, `repairsObjectsMend` - a tick mends a fiftieth of the piece's
own condition, rounded, never under DFU's point. That is MEND-WORN's yardstick (the classic Dagger's point of its 50,
Mac's "Weapons as a classic dagger"), now every piece's: a weapon of any material, armour, clothing, a magic item's or an
artifact's uses - every share climbs 2% a tick (an iron weapon 32, a Daedric one 256, an iron cuirass 82, steel 123,
Daedric 655, a shirt 2, Armbands the floor's 1). Unchanged: which piece the tick takes (worn first, least share first,
MEND-TIERS' tiers), the cadence, the player alone, one piece a tick. The same kit is whole in 164 ticks, about 55 real
minutes. `05-Combat/Physical-Combat-Overhaul.md` MEND-WORN and Port-Ledger A's MEND-WORN row say so.

THE FOUR HOSTS: none changed - the law runs in the one round pump (`systems/worldTick.js` runMagicRoundsFor, then
enchantmentMagicRound) that every host's ticker feeds: exterior.js, world.js and worldModes.js through `scenes/shared.js`
createPlayerTicker, dungeonContext.js through tickPlayerMinutes. Pinned by `test/fb1016_mendarmour.test.js` (2, the
first the report's kit through the pump, tick by tick); `tools/mutants/fb1016_mendarmour.json` (6, all dead). PINS
MOVED: `mend_worn.test.js` (the rate; a magic blade's 1,000 uses +20 and an artifact's 400 +8; the Wall of Daggerfall
+41 and the helm +51; the pump's cuirass +820), `fb1014_mendstarve.test.js` and `fb1015_mendtiers.test.js` (a worn piece
mended whole in a tick or two where it was held), `enchantments.test.js` E1 (a 100-point sword +2); `tools/mutants/
mend_worn.json`'s six records on the old law re-aimed by content, 15 of 15 dead.

FLAGGED: uses mend by the same law. Under AllowMagicRepairs (the port's default, forced online) a 1,000-use item gets 20
uses a tick - two Cast When Used casts' worth every twenty seconds - where it got 1. If uses should keep the point, it
is one guard in repairsObjectsMend.

What the reporter is owed: your armour was being repaired - one point of its thousands every twenty seconds, so its %
never moved. Every worn piece now mends 2% of itself a tick, as your weapon did: a battered steel kit is whole in under
an hour.

## HORSE-CARE-OFF: Off, every horse owned keeps its Stable card and "Ride this one" (6)

`src/systems/upkeepRuntime.js` createUpkeep's model; `src/ui/holdingsPages.js` drawStablePage, rideButton, steedLines.

THE REPORT. "turning horse care off completely hides my other horses".

FOUND. The Stable page draws the ridden horse's card from the pack and every other horse's card from the upkeep's model.
The model built its list of horses only `if (care)`, the page's loop read `care?.horseCare` too, and "Ride this one"
lived inside the care lines (steedLines). So Off (`horseCareRules` null) - and on the classic skin, where the accessor
answers null whatever the pref - the page drew the ridden horse alone. The ride itself was never the tier's
(stableProviderFor routes 'ride' to the upkeep "the mod on or off", chooseRiddenHorse ungated): the other horses were
owned and rideable, with no door to them. Driven on the real upkeep and page with three horses: on Boons and Hard, three
cards and two "Ride this one"; Off, one card and none.

CHANGED: the model lists every horse on every tier (its place, whether ridden, its name, its look), the care's fields
beside them only where horse care rules; the page draws every other horse's card on every tier ("Another horse of
yours") with "Ride this one" (`rideButton`, one home for both paths); Off and on the classic skin the card shows the
choice alone - no hunger, bond, breath, stats, oats or apple. `06-Systems/Horse-Care.md` (The Stable page) says so.

THE FOUR HOSTS: world.js and exterior.js build the upkeep over the one accessor and hand the page its provider
(stableProviderFor) - WIRED as they stood, no host line moved; worldModes.js and dungeonContext.js stand no transport (a
building or a dungeon puts the rider on foot) and set no provider. Pinned by `test/fb1016_horsecareoff.test.js` (2, over
the real accessor and pref, the real upkeep, the hosts' provider seam and the page); `tools/mutants/
fb1016_horsecareoff.json` (7, all dead).

What the reporter is owed: your other horses were never gone, only their cards. With horse care Off the Stable page
shows every horse you own and lets you ride any of them; only the feeding and the stats wait for horse care.

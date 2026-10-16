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
| 7 | "I've been using a 3x disintegrate as my main spell lately ... I believe it bypasses the kill/spare on revenants. And it seems it does this to other players' revenants, too" | a Disintegrate is a whole blow, and both damage doors passed every whole blow over a revenant's last stand, will and kneel; a party member's blow reaches the owner as a kill (`z`), so anyone's Disintegrate closed anyone's revenant, record and all, its owner never asked | fixed (RVN-OWNERS-CHOICE) |
| 8 | "market stalls all shifted into the ground/walls"; "at least the lawn decoration owns" | TEMPLE-STEPS set the stall's box and scale right but kept a guessed shape inside it: a counter 0.75 m high under goods laid for 1.04 m, the awning's edge at 1.84 m, a bench where 20 of 30 stall-keepers stood, the second mesh given a counter over its goods; and its new origins moved every yard's saved stall 2 m back into its wall and grew saved boulders 2-8x | fixed (STALL-SHAPE) |
| 9 | "you steal something from the shelf and can sell it back to an NPC, and he'll put the item back on the shelf again, and it just goes in a circle"; "when you're sent to prison, all the stolen items stay with you" | nothing marked a piece stolen: a sale landed the very record back on the shelf (T2), where a shut shop's shelf - no roll - gave it up again that night; and no court exit touched an item | fixed (STOLEN-GOODS) |
| 10 | "Friend invivible and randomly popping up"; "Partied players popping in and out randomly after leaving tombs at graveyard ... also partied players inside tombs are invisible for a time" | every place change is a new relay room whose socket asked for its identity token only as it opened - a mint on the wire (seconds) between the door and the hello, paid going in past the reuse minute and always coming out (the cell outside spent by the token that left it); a hello sent tokenless because its token came late waited out its backoff after the token arrived | fixed (DOOR-TOKEN) |
| 11 | "If you just sit near the wall between the shelves, when you fail to steal something, the guard will come running, but they simply can't reach you because they run into the wall instead of going through the door" | the watch called into a building walked the classic motor - straight at the player, along the first wall - and only the dungeon baked a navmesh; a partition held them for the whole crime | fixed (INDOOR-WATCH) |
| 12 | "I was testing with a friend, he dies and I cast resurrection. It works for a moment then he disappears and remains dead" | online the death door wrote a Bloodline fall at once - the death, the remains, the Succession waiting and the realm's tombstone - so the Resurrect raised a body the house had already buried, and the slow step opened "The line ends" over it a second later | fixed (REZ-BLOODLINE) |

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

## RVN-OWNERS-CHOICE: a revenant's fate is its owner's - only the owner's own Disintegrate closes it (7)

`src/systems/revenantFate.js` ownersWholeKill; `src/scenes/exteriorFoes.js` damageFoe; `src/scenes/dungeonContext.js`
damageFoe.

THE REPORT. "I erased a Revenant fro[m]...": "I've been using a 3x disintegrate as my main spell lately ... I believe it
bypasses the kill/spare on revenants. And it seems it does this to other players' revenants, too. As cool as the tech is
being able to disintegrate a rev to never have to deal with them sort of like a delete button. It probably shouldn't be
doable to other peoples revs." The screenshot: "Sekrath the Undying (dead)", and "Isn't he supposed to give you a
choice?".

FOUND. A Disintegrate is a whole blow (`effects.js:"sinks.hurt(left, { whole: true });"`), and both damage doors passed
every whole blow over the revenant gates - the last stand and the yield read `!_whole` - to the death arm and
`revenantSlain`, which closes the record. The rule was recorded on purpose ("a Disintegrate kills it outright",
Revenants.md 11, 19, 20; Feud-Arc.md 14.2, 15.1), written for the owner. A revenant is never handed over (REVENANT-HEIR),
so a party member's blow on it goes to the owner as a kill (`z: 1`, AUDIT PSCALE1 DOORS-1) and the owner's door applied
it whole - the street's, the dungeon's landPeerBlow, a peer's strike spell alike: anyone's Disintegrate closed anyone's
revenant, record and all. Measured on the old doors over two real street pools: Bob's real Disintegrate (5,255) on his
copy of Ann's revenant sent `z: 1`; applied at Ann's door the revenant died and its record closed - at rank 3 with no last
stand; underground the same. A stat drained to zero killed it outright too (that tick names no striker).

CHANGED (the owner: "Stop trying to match DFU"; the reporter: "It probably shouldn't be doable to other peoples revs"):
- A whole blow closes a revenant outright only as the owner's own - the player's blow (`fromPlayer`, never `peer`) at
  the door that holds the record (`revenantFate.js:"export function ownersWholeKill("`); a revenant is never handed over,
  so that door is always its owner's. Both doors' last-stand and yield gates ask it.
- Anyone else's whole blow - a party member's forwarded `z`, their strike spell, a foe's spell, a companion's, a drained
  stat's tick - is a killing blow like any other: at rank 3 and up the last stand; once stood with its will unbroken it
  tears away; else it kneels. No `slain` goes back, the record stays open, the kill-or-spare is the owner's. The owner's
  own Disintegrate and Razor still kill outright. `_whole` still keeps a kill undivided by the party's toughness.
- Named in Revenants.md (15, notes in 11, 19, 20) and Feud-Arc.md (1.2, 14.2, 15.1). Offline, a stat drained to zero now
  kneels the player's own revenant too (its tick names nobody); Kill closes it.

THE FOUR HOSTS: world.js and worldModes.js - WIRED through exteriorFoes' one door (no host line); dungeonContext.js -
WIRED, its own door's two gates edited in place (no code line added); exterior.js - the same door, still FLAGGED as in
Feud-Arc 32 (no `fates`, so its revenants die to any killing blow; no net, so no peer's blow reaches it). Pinned by
`test/fb1016_rvnownerschoice.test.js` (5, the second the report over two real street pools); `tools/mutants/
fb1016_rvnownerschoice.json` (13, all dead). PINS MOVED: `revenant_fate.test.js` (the dungeon yield seam) and
`rvn4_stand.test.js` (the dungeon stand seam); mutants REVENANT-FATE-dies-as-before, RVN4-the-street-stand-unasked,
-the-street-whole-stood, -the-dungeon-stand-unasked and -the-dungeon-room-stood re-aimed by content (both lists: 85
dead, 1 recorded equivalent).

FLAGGED: `audit24_lifetimes.test.js`'s proximity bound (`health <= 0` within 4,200 characters of `releaseFoeBatch(f)`)
now stands at 4,160 in exteriorFoes' death arm - the next line there moves it.

What the reporter is owed: you were right - a Disintegrate deleted any revenant, yours or another player's, and nobody
was asked. Another player's Disintegrate now beats a revenant the way any killing blow does - it makes its last stand,
tears away or kneels - and only its owner chooses. Your own Disintegrate still finishes your own.

## STALL-SHAPE: the market stall is the pack's own, and a yard's saved stalls and boulders stand where they were put (8)

`src/world/townStandIns.js` RMBRP_STALL_FRAME, RMBRP_STALL_OPEN_FIRST, RMBRP_STALL_OPEN_SHIFT, stall;
`server-account/migrations/0120_yard_reseat.sql`; `tools/yardReseat.mjs`; `src/systems/decorPlacer.js` (the header's rule).

THE REPORT. 2026-10-15 9:59 PM: "market stalls all shifted into the ground/walls", "at least the lawn decoration owns".
Two town screenshots: a stall's awning low over the street with its keeper standing inside it; a red-awning stall against
a wall, its counter half buried.

FOUND. TEMPLE-STEPS (c2b52fdff1, merged that evening) set the stall's box and scale right (the prefab's 0.75, x mirrored),
but the shape inside the box was still the port's guess, and the pack's FBX (`ext_city_stall001-026`, read with a scratch
FBX reader) says otherwise: the pack's counter is 1.04 m high at x -0.80..0.32, the stand-in's 0.75 m at x -0.19..0.26 -
the author lays its goods at 1.05 m and none rested on a counter; the pack's lintel underside is 2.26 m (its fringe
2.17), the stand-in's awning edge 1.84; the stand-in had a bench 0.53 m high the pack does not have, and 20 of the 30
stall-keepers stood inside it (21 of the 28 keepers in the footprint were inside a solid or under a face below their
heads); prefabs 53113-53124 use a second mesh (`ext_city_stall014-025` - the frame 0.2 m back, 0.206 m up, 0.066 m across,
no counter) and still got the counter, burying the goods laid on the ground. None of the author's 32 town stalls stands in
a building under any footprint (checked against the game data), so "into walls" is the yards'. Yard decor is the account
service's (D1 `home_decor`, `yard` = 1; `placed_at` set at placing, never by a move), and a saved piece records where its
model's origin stands, worked out against the stand-in of its day (`decorPlacer.js`) - so TEMPLE-STEPS' new origins moved
every saved stall 2.06 m x its scale toward its back, into the wall its owner had stood it against, a quarter smaller,
and grew every saved boulder 2-8 times about a different centre.

CHANGED:
- **The stand-in is the pack's stall**, built from the FBX's measurements (within 2.3 cm of `ext_city_stall001`, 1 cm of
  `014` for the second mesh): posts 0.375 m square, a beam and a lintel, the awning from the beam's top to the lintel's,
  the prefab's own valance cloth (`49_9`), headroom 2.17 m at the front, a counter top at 1.041 m, no bench; the second
  mesh its own frame and no counter. Named in `03-World/Beautiful-Towns.md`: the outer faces stay on TEMPLE-STEPS' box (at
  most 2.25 cm off the pack's - the box saved yard stalls stand by); every post stands on the origin (the pack's run
  0.112 m below it, the second mesh's start 0.094 m above); the wood `67_1` for the prefab's climate-swapped `366_x`.
- **Migration 0120 re-seats every saved yard stall and boulder**: its origin moved so the model's box, turned and scaled
  as the piece is, keeps its centre and its foot; its scale divided by the model's growth (0.75 a stall, each rock's
  prefab scale), within the scale limits (0.25-4) and the yard's bounds. Which old box applies is `placed_at` against
  TEMPLE-STEPS' web deploy (1792111405, 2026-10-16T00:43:25Z): before it WD3's, after it TEMPLE-STEPS' (only the second
  stall has moved since). Once: the D1 ledger applies it once and each re-seated place carries `"reseat": "STALL-SHAPE"`,
  which the statement never moves again; a place not JSON is skipped, rooms never touched; cosine and sine as Taylor
  series in plain arithmetic (no SQLite math extension). The Worker's code is unchanged (ACCOUNT_VERSION stands);
  `06-Systems/Online-Arc.md` records the re-seat.

THE FOUR HOSTS: none wired - the stand-in is the pipeline's (`customModelFor`) for every host that draws a town block:
world.js and exterior.js, and worldModes.js's view out of a window; dungeonContext.js draws no town; yards stand in
world.js alone, and only their data moved. Pinned by `test/fb1016_stallshape.test.js` (4); `tools/mutants/
fb1016_stallshape.json` (24, all dead). PINS MOVED: `fb1015f_templesteps.test.js`'s stall test and `wd3_standins.test.js`'s
"every built piece is sound" (the second mesh its own frame); mutant TEMPLESTEPS-9-stall-off-origin re-aimed by content.

FLAGGED: a piece placed before the deploy and moved during TEMPLE-STEPS' day was moved against the new box - no record
says so, so it is put back as if unmoved and its owner moves it once more; stalls placed in the first hour by clients
still on the old build stay as TEMPLE-STEPS drew them; a boulder whose old scale over its growth falls under 0.25 (a
scale-8 rock placed at 1) stands at 0.25, up to twice its old size; every other town-mod piece the decorator offers (beds,
paintings, DET pieces) stands by its stand-in's box the same way, with no guard if a stand-in's box moves again.

What the reporter is owed: the market stalls stand as the pack draws them - the keeper behind the counter under the
awning, the goods on the counter, the open stalls' goods on the ground. A stall or boulder you put in your own yard is
back where you put it, at the size you placed it.

## STOLEN-GOODS: a stolen piece carries its theft - a merchant is rid of it, a guilty verdict takes it (9)

`src/systems/stolenGoods.js` (new); `src/systems/itemFields.js` `stolen`; `src/systems/inventory.js` stacksWith,
splitStack; `src/systems/itemTransfer.js` applyTransfer; `src/systems/inventorySession.js` theftTarget;
`src/ui/nativeTrade.js` _doSteal; `src/ui/enhancedTrade.js` runSteal; `src/ui/nativeInventory.js` and
`src/ui/enhancedInventory.js` the take, the put-back, the enhanced card; `src/scenes/worldModes.js` openShelf's shut arm,
the `container:` arm, commitTrade's Sell arm, doSell; `src/systems/court.js` confiscateStolen; `src/scenes/arrestFlow.js`
finish, release.

THE REPORT. "A bug related to infinite...": "you steal something from the shelf and can sell it back to an NPC, and he'll
put the item back on the shelf again, and it just goes in a circle ... completely disrupts the economy ... Also, when
you're sent to prison, all the stolen items stay with you and aren't taken away." (The guard who cannot reach the thief
is INDOOR-WATCH, below.)

FOUND. Nothing in the tree knew a piece was stolen: no item field, no flag at any theft arm. Both sale arms
(`worldModes.js` commitTrade's Sell arm and the keyed doSell) pushed the sold record onto the open shelf (Port-Ledger T2),
where it stood until the next day's restock (`shopStock.js` needsRestock). Driven on the real modules over a quality-10
smith's shelf: the real Steal took its Dai-Katana into the pack unmarked; the real Sell window paid 300 gold for it and the
same record stood on the shelf again; the open shop's Steal is caught 65% of the time at Pickpocket 50, and a SHUT shop's
shelf rolls nothing at all (`theft.js` shopShelfTheft) - so a piece sold back by day could be taken again that night for
nothing, without end. The court touched no item: no exit of `arrestFlow.js`, nothing in `court.js`. And a second hole,
found building the mark: a take from the shut shelf or a stranger's cupboard goes through the inventory window, and a
stackable piece merges into the pack's stack as it lands (`inventory.js` addItem) - a diff at the window's close could
never have marked 85 arrows taken into a pack holding 11.

CHANGED (the owner: "Stop trying to match DFU"):
- **The mark.** A piece taken from someone else's keeping carries `stolen: true` (`systems/stolenGoods.js`), declared in
  itemFields.js so the save, the wire and a realm trade carry it - a hand-off launders nothing. Written at every theft arm
  as the piece moves: the open shop's Steal on both skins (the lot marked before TransferAll merges it); every take
  through either inventory window from a loot target the host marks `stolen` - the shut shop's shelf and a stranger's
  cupboard (worldModes.js, on lines it already had), marked before the piece lands (`itemTransfer.js` applyTransfer's
  `stolen`; `inventorySession.js` theftTarget counts the loot target alone, never the wagon, the bag or a reward tray). A
  piece put back is its owner's again; a stolen piece stacks only with stolen kin and a split keeps the mark; a pickpocket's
  coin carries none; the enhanced item card says what the mark means.
- **The fence.** `landSold`: an honest sale lands on the open shelf as T2 has it, so a mistaken sale can be bought back; a
  stolen piece is paid for and gone. Both sale arms call it, one line each.
- **The court.** `court.js` confiscateStolen takes every stolen piece the prisoner carries - the pack's (a worn piece off
  its slot first, a lit torch put out) and the Materials Bag's - called by `arrestFlow.js` finish, which every guilty exit
  runs: a sentence served, a fine paid with no days, banishment, the failed defence's verdict, and so the watch's "come
  quietly". Taken at the verdict; the release says once "The guards take the stolen goods you carried (N items)." An
  acquittal and a guild's rescue take nothing. Both lines through the text core, in every language the tree carries.
- Named in `06-Systems/Standing-Arc.md` (STOLEN-GOODS) and Port-Ledger T2 (narrowed) and the REP row.

THE FOUR HOSTS: worldModes.js - WIRED (the two theft targets and both sale arms, on lines it already had; createWorldModes
7,072 code lines before and after); world.js and exterior.js - the arrest flow is theirs and the court's change is inside
it, their wiring unchanged; dungeonContext.js - its one trade window is the Identify spell's (no steal, sale or shelf).
Pinned by `test/fb1016_stolengoods.test.js` (7, every one failing on the old code); `tools/mutants/
fb1016_stolengoods.json` (32, all dead). PINS MOVED: `audit26_economy` (the shut shelf's loot target), `audit26_modal`
(where the Sell arm lands a piece), `auditloot2` (the junk mark beside it), `enhancedInventory` (PX28's take, INV2's stow
twice), `housecontainers` and `shipstore` (the cupboard's loot target; shipstore the shut shelf's too); mutants
AC5-C-M26, C8-cards-stack-any, SHIPSTORE-owned-cupboard-not-storage and -stranger-cupboard-is-storage re-aimed by content.

FLAGGED, not taken: a shut shop's shelf still rolls nothing, so a night's haul is free (bounded now by the day's stock,
each stolen piece sold once) - a fence's lower price for stolen goods is Mac's call; the court searches what the prisoner
carries, not the wagon, a home or the bank; the watch's fine paid on the spot ("P" at the stop) is no arrest and takes
nothing; the enhanced pack's put-back is wired the classic window's way and pinned by source (no enhanced view stands a
shelf beside the pack today).

What the reporter is owed: a piece you steal is marked stolen. A merchant still pays for it but gets rid of it - it never
goes back on the shelf, so the circle is broken. Found guilty - jail, a fine or banishment - the guards take every stolen
thing you carry and say how many. Win your case, or have the Thieves Guild get you out, and you keep them.

## DOOR-TOKEN: the next room's token is minted at the door (10)

`src/net/accountClient.js` TOKEN_AHEAD_MS, the minter's `ahead` and `holds`; `src/scenes/doorTokenHost.js` (new);
`src/net/online.js` `tick`'s token retry, the close paths' `_tokenRetry`; `src/scenes/world.js` the door module's
construction and its five calls.

THE REPORT. "Friend invivible and randomly popping up" (title only). "Partied players popping in and out randomly after
leaving tombs at graveyard ... also partied players inside tombs are invisible for a time."

FOUND. The relay and session layer is clean - measured with real OnlineSessions over the real relay Room
(test/fakeRoom.mjs), one clock for all, world.js's online block a frame: a party at a graveyard with 5 and then 30 others
moving in the cell, one member pacing a cell edge 60 s - no frame lost (the halo promotes in place); a standing peer heard
every HEARTBEAT_MS (20 s) and hidden only at PEER_TIMEOUT_MS (80 s), never fired; a relay restart keeps peers frozen, not
hidden. Layers are not the cause at today's counts (an overflow forced with a 12-socket cap walked the party into one
layer together; a real cell overflows past 256 sockets). What hides a peer is any socket opening into a room the held
token cannot open: a room's socket mints its token in `ws.onopen`, before any hello, and the minter hands over a held
token only under TOKEN_REUSE_MS (60 s) old and unspent in that room. A crypt visit over a minute minted going in, and
always minted coming out (the cell outside was spent by the token that left it). With a 3 s mint (TOKEN-WAIT measured
over 2.5 s for a player) each side was invisible to the other 3.1 s, into and out of the crypt; a player's own blip hid
them a mint plus the backoff (4.4-5.2 s at a 2.5 s mint); a relay restart with a queueing account service froze them
23-36 s. And a token later than TOKEN_WAIT_MS sent the hello tokenless, refused, and its retry waited out the backoff
after the token had arrived (3.1 s past it).

CHANGED:
- **The token goes at the door.** The minter's `ahead(room)` mints now, only when the held token could not open the next
  room by the time its socket asks (none held, spent in that room, or under TOKEN_AHEAD_MS (20 s) of its minute left);
  never with a mint in flight, through STORM-SHED's hold, or signed out. The next room's own mint simply goes early; a
  token minted ahead and never used is at most one a page per 40 s.
- **The host module** `scenes/doorTokenHost.js` calls it at a door in (`onPreTransition`, while the place builds - the
  cell left remembered as the way back), a door out (`onDungeonLeave`, `onInteriorLeave`), every jump
  (`_teleportToPixel`: fast travel, teleport, recall), and the walk back to an exit door (within EXIT_NEAR_M 16 m after
  standing EXIT_ARM_M 32 m from every exit; the spawn beside the door does not count). Online only.
- **The retry.** A hello refused for want of a token (the primary's and each halo's) retries the frame the minter `holds`
  a token for its room; the hard backoff stands for every other wait.
- Measured again (two real sessions, the real Room, a 3 s mint): into the crypt 3.1 s -> 0.7 s (the build covers the
  rest), back out 3.1 s -> 0.1 s; five mints on the same walk either way. `11-Multiplayer/Scale-Arc.md` DOOR-TOKEN.

THE FOUR HOSTS: world.js - WIRED on existing lines (bootWorld 21,679 code lines, its ceiling); worldModes.js and
dungeonContext.js - reached through world.js's host hooks (onPreTransition, onInteriorLeave, onDungeonLeave), the module
reading their exit doors through `modes.dungeonCtx.exitDoors` and `modes.interiorCtx.doors`, neither file changed;
exterior.js - no online session. Pinned by `test/fb1016_doortoken.test.js` (5, the first the crypt both ways over the real
session, Room and minter); `tools/mutants/fb1016_doortoken.json` (25, all dead). PINS MOVED: `stormshed.json`'s
STORM-SHED-primary-unheld re-aimed by content.

FLAGGED, not taken: in an overflowing place a party can split across layers (a member asks its party's layer only at its
join; a reconnect reuses that hint; a halo opens at layer 0) - unreachable at today's counts; a lone player's blip that
drops two of a page's sockets is read as a deploy wave (SCALE2c) and waits its share of the spread (up to 10 s at 500
online); a reconnect after a relay restart still costs a mint (the relay forgets spent tokens on restart, the client
cannot know it, and replaying a spent token would trade away replay protection); a player who never stands 32 m from an
exit (a shop counter) still pays the mint at the door out.

What the reporter is owed: your party mates were never gone. Every door into a tomb, and back out, opened a new
connection that waited a few seconds for the account server to vouch for you, and for those seconds neither side could
see the other. The game now asks for that pass while the tomb loads and while you walk back to its door, so you appear to
each other as you step through.

## INDOOR-WATCH: the watch called into a building walks round to the player, and a wall never keeps it out (11)

`src/scenes/interiorNav.js` (new): createInteriorNav, doorsOutOfSoup, feetAnchors, polyUnder, noRouteSpot,
huntsThePlayer; `src/ai/enhancedMotor.js` EnhancedEnemyAI.standAt; `src/scenes/cityGuards.js` createCityGuards' `nav`,
spawnGuardAt's motor; `src/scenes/exteriorFoes.js` createExteriorFoes' `nav`, spawnFoe's motor; `src/scenes/worldModes.js`
the module's wiring (makeInteriorFoes, makeInteriorGuards, the building's mount, the interior frame, exitInteriorNow,
forceExitToExterior).

THE REPORT. "If you just sit near the wall between the shelves, when you fail to steal something, the guard will come
running, but they simply can't reach you because they run into the wall instead of going through the door. And you can
sit like that for as long as you like" (the loop it fed is STOLEN-GOODS, above).

FOUND. The watch called into a building (cityGuards.js's indoor arm, PlayerEntity.SpawnCityGuards) stands 2-5 men at the
lowest outer door and built the classic `EnemyAI` over the room's collider, as did the building's own foes
(makeInteriorFoes): it steers straight at the player and slides along the first wall it meets. A navmesh existed, but only
the dungeon baked one (ENHANCED AI 3b-4); "ENHANCED AI 5 - exteriors and interiors ... RMB interiors" was still ahead
(`12-Enhanced-AI/Enhanced-AI-Arc.md`), and `enhancedAI4.test.js` pinned that "the classic one is stopped by [the
divider]". Measured on the reporter's shop built as a real Collider (a 12 x 12 m room, a partition with a 1.2 m doorway,
shelves against its far face, the player between two), the real watch pool spawned through its real indoor arm: in 30 s
the five watchmen pressed against the partition, none went through the doorway, none saw the player, none swung - the
nearest 1.41 m away, through the wall.

CHANGED (the owner: "Stop trying to match DFU"):
- **The room's mesh.** `interiorNav.js` is the mode machine's module: one instance, mounted with each building at the
  player's arrival and released at both teardowns; its frame runs before either pool steps, and both pools receive it as
  `nav` (the bake as a thunk, and the routes' world - the two things the dungeon hands its foes). With the Enhanced AI
  switch on (forced on online), `createCityGuards` and `createExteriorFoes` build `EnhancedEnemyAI` when a host hands
  them a mesh, as the dungeon's construction sites do; the street's pools hand none.
- **The bake** is the dungeon's `NavClient` with the dungeon's door rule (unlocked action doors left out of the soup),
  anchored on the arrival, the room's ways in, each door's watch spot (`indoorWatchSpot`), and the player's feet and the
  rings round them a straight knee-height line reaches. Asked only on need (a building nobody fights in bakes nothing),
  never cached (a 30 x 20 m two-storey room of 9,652 triangles bakes in 0.37 s on the main thread; thousands of
  buildings would each leave an IndexedDB entry nothing evicts); asked again when a door's lock changes the soup, and when
  the hunted player stands off every island the mesh kept (at most four times a room); one bake at a time, a request made
  meanwhile held and baked as it lands (ASYNC NEVER DROPS).
- **NO ROUTE.** A locked inner door or a ladder can leave the player's room an island the routes cannot reach: a
  watchman of the crime's pursuit whose feet have stood on another island for 2 s is moved onto the player's island at
  the spot nearest where he stood (the far side of what stopped him, a body's width into the floor; never within 1 m of
  the player or 0.8 m of another watchman; never in or on anything set down since the bake), and walks the rest
  (`EnhancedEnemyAI.standAt` keeps the pursuit, drops the old route, fall anchor and detour). Only the watch is moved - a
  monster a locked door holds is a door that held; the law's answer is not.
- Measured on the same shop: the room baked 0.53 s after the crime, the first watchman in melee reach with the player in
  sight at 4.2 s, the five swinging 37 times in 30 s, nobody moved; with a locked door in the doorway, all five moved past
  the partition at 2.7 s and swung 26 times.

THE FOUR HOSTS: worldModes.js - WIRED (five code lines, createWorldModes 7,072 -> 7,077 under its 7,159; the `nav:` dep
rides lines the pools already had); world.js and exterior.js - their buildings are the mode machine's, covered; their
street pools hand no mesh and still walk the classic motor (FLAGGED); dungeonContext.js - its own bake since 3b,
unchanged. Pinned by `test/fb1016_indoorwatch.test.js` (8, over the real watch pool, foe pool, module, NavClient and a
real Collider, and the host's wiring by source); `tools/mutants/fb1016_indoorwatch.json` (70, all dead). PINS MOVED:
`enhancedAI4.test.js` (AUDIT 55's reach pin - interiorNav.js, cityGuards.js and exteriorFoes.js join the switch's
readers, each behind `nav &&`; AI 4's host pin - each pool's one construction site chooses by the switch),
`audit63_world_actions.test.js` (the construction site's new spelling), `incident_ceiling_bats.test.js` (the exterior
pool's regex; the watch's epoch-guard order pin now requires the guard be found at all), `sailingcabins.test.js` (the exit
harness's scope carries `interiorNav`); their own mutants (6, INDOOR-WATCH-MOVED-*) dead.

FLAGGED, not taken: the streamed world's half of ENHANCED AI 5 (the street watch and street foes still walk the classic
motor); offline with the switch off, the classic motor's wall stands; decor placed or removed during a visit (DECOR1c,
BASE-HIDE) does not re-bake the mesh (a moved watchman never lands in or on it, but a route may run through one); a
watchman can be moved within the player's view; `doorsOutOfSoup` spells the rule the dungeon writes inline on its bake
line (one home is a later slice's); nothing was seen in a real RMB interior (no ARENA2 in the container).

What the reporter is owed: the watch now walks round through the doorway to reach you between the shelves, and if a
locked door or a ladder keeps them out they come in anyway after two seconds. Hiding behind a wall no longer works.

## REZ-BLOODLINE: a friend's Resurrect saves a Bloodline character (12)

`src/scenes/legacyHost.js` onDeath, decideDeath, raise, raisable, pageGone, adopt, newGame, tick, deathOutcome,
REZ_HOLD_MS; `src/scenes/world.js` the death screen's frame (the rise), composePartyPose (`fg`), fallenTargetPick, the
tombstone dep, the page's going; `src/systems/realmSaves.js` die's `keepalive`, realmDie; `src/net/wire.js`
validPartyPose `fg`, RELAY_VERSION; `src/scenes/hostMagic.js` the Resurrect's gate, release and readying;
`src/systems/resurrect.js` RESURRECT_TEXT.forGood.

THE REPORT ("Bloodline Resurrection."): "I was testing with a friend, he dies and I cast resurrection. It works for a
moment then he disappears and remains dead." The screenshot: "...of Gothway Garden has Fallen - You died without a
descendant. There is no one left of the house of Gothway Garden. The line ends here, and its tree is kept in the Hall of
Ancestors."

FOUND. AUDIT LEGACY A1/B3 made the death door decide every death, so F11 or a closed tab could not undo one; online since
LEGACY7 that meant the door wrote the whole Bloodline fall - recordDeath, the remains, `family.pending` (the Succession
waiting) and the realm's tombstone (`POST /v1/realm/die`: `dead_at` stamped, the lease dropped). RESURRECT1's rise
(`world.js` resurrectInPlace) touched none of it: the heal, the death screen closed in place - "works for a moment".
Within a second the slow step (`legacyHost.tick`) let go of its `deathSeen` latch, but `family.pending` still stood, so it
answered `{ fall }` and the world host opened the Succession over the living body: no member, no heir, "The line ends",
endLine. Only the operator's REVIVE could take it back. Driven on the real host: at the door
`pending={"fallenId":1,...}`, tombstones sent `['fell']`; the slow step after the Resurrect gave `fall`, choices 0,
newborn false - the reporter's screen.

CHANGED (the decision: a resurrection from an ally SAVES a Bloodline character):
- **Held, not written.** Online the door READS the death - where they fell, their purse, their killer, the heirloom off
  their back, an Enduring member's years - and HOLDS it; nothing is written and the realm is asked nothing.
- **When it is written** (decideDeath, exactly as the door used to), at the first of: the player going on (the death
  screen's reset, Enter or its count, through `deathOutcome`); the hold's window ending (`REZ_HOLD_MS` 150 s on the wall
  clock - the longest online death screen, ONLINE_RESPAWN_SECONDS 60 or the open zone's WILD_DEATH_HOLD_S 120, plus 30 s;
  the slow step decides it); the page going (pagehide calls `pageGone`, the tombstone by keepalive, AHEAD of the realm's
  leave, which gives up the lease the tombstone needs); a load or a new game (the mod's restore, `adopt`, and `newGame`,
  which every load door goes through - F11, the pause's Load, a same-dungeon load); a body that got up without a
  Resurrect.
- **A Resurrect inside the window.** The fallen's own frame asks `raise()` before it rises, and the held death goes: no
  death, no toll, no remains, no Succession, no tombstone; an Enduring member's toll is held the same way.
- **Once decided, the body stays down.** `raise()` answers no, so the fallen's client never rises to show the line's end;
  their party pose carries `fg` (validPartyPose, a relay version), the caster's pick reads it, and the cast is refused
  BEFORE a point is spent, in the fallen's name: "Ysolde has fallen for good. No spell will raise them now." (the
  release and a caster-only Resurrect's readying say the same; through t(), drafted in the thirteen whole languages).
- **Unchanged:** offline the door decides, as A1/B3 has it; SD-ONELIFE stands (no Resurrect in the Hour). The departure
  is named in `01-Overview/Audit-Legacy.md` at A1/B3's law, and `06-Systems/Legacy-Arc.md` REZ-BLOODLINE; the stale
  onDeath comment ("ONLINE Project Legacy has no say until ... LEGACY7") is replaced.

THE FOUR HOSTS: world.js - WIRED, on lines it already had (the frame's rise, the pose's `fg`, the caster's pick, the
tombstone's `keepalive`, the page's going); worldModes.js and dungeonContext.js keep their death screens in the mode's slot,
and the same world.js frame hears the Resurrect under them (`modes?.deathUp?.()`), their resets reaching
`legacyDeathReset` through `onlineRespawn` - wired through world.js; exterior.js (the fixed city) has no Project Legacy
(Legacy-Arc 3's FLAG). Pinned by `test/fb1016_rezbloodline.test.js` (4, over the real death door, the host, a realm
session on the real account Worker - `dead_at` read off the row - the party wire, RemotePlayers, the caster's
createPlayerMagic, the real DeathScreen and world.js's own statements sliced out and mounted); `tools/mutants/
fb1016_rezbloodline.json` (35, all dead). PINS MOVED: sd12_onelife (the rise line), legacy7_online and legacy7_wed (the
tombstone's options), auditlegacy2 (adopt decides first), auditlegacy3 P8 (online the reset writes the fall),
audit23_magic (the caster-only readying line), realm3 (the pagehide statement); the relay version in its pin files;
mutants AGELESS-CURSE-the-host-asks-no-curse, AUDIT-LEGACY-B4-online-bloodline-falls, LP-host-news-world-clock,
AUDIT-REALM2-C2-host-never-leaves-or-rejoins, LEGACY6-death-untold, LEGACY7-fall-untombed,
PERMADEATH-HOUSES-death-saved-deeds-only and soc1's S38-version-not-bumped re-aimed by content (every legacyHost.js and
resurrect.js record: 178 dead, 2 equivalent as recorded).

FLAGGED: the relay carries `fg` from this version on - deploy it with the clients (an older relay drops `fg`, so the
caster spends the spell and the fallen's client still refuses the call); the fix lives on the FALLEN's client (a victim
on an old build still rises and sees the line end); the keepalive tombstone at pagehide is best effort (if it never
lands, the device's store holds the death and the line's next write to the realm entombs the character, W2); a tab
hidden past 150 s comes back with the death decided; an online Bloodline death screen still says "RISING IN n  ENTER
now", and nothing tells the player that waiting lets a friend raise them (a UI follow-up).

What the reporter is owed: your friend's Resurrection now saves him. While his death screen stands (up to two and a half
minutes), a party member's Resurrection brings him back with his house untouched - no death on the tree, no Succession,
no tombstone. If the death has already been settled (he chose to go on, the time ran out, the page was closed or
reloaded), the caster is told "<name> has fallen for good" and keeps the spell's magicka.

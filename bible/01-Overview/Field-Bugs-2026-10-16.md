# FIELD BUGS 2026-10-16 - the Discord's bug reports of 2026-10-15, each fixed at its root

The bug-report threads of 2026-10-15 from the Discord, handed over as screenshots. Read on the code as it stands at
main's `7e0424e0`.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | "I respeced yesterday and have a timer on my 50 lvl smithing, however, when I reached level 100, I can not choose level 100 perk" | the Professions page greyed every card of a track while a paid change waited at either rank; the service already took a first pick (and the merge's free change) before its one-change-at-a-time refusal | fixed (FIRST-PICK) |
| 2 | "I reloaded my game near the arena ... I've done all 40 fights already for this season, so I hit fight, and it reset my rank, and when I look at the season it doesn't have a number" | on the online lane before the relay's first welcome every arena door ran the offline law: the Herald offered Fight off the save's ladder, the bout and its purse were this screen's, the window drew the save's season ("Season of 3E 406") and roster - the account's forty wins untouched | fixed (ARENA-WAIT) |
| 3 | "I paid 2 x 600 gold today, and even though it said +5 reputation, my reputation didn't go up at all ... why I still have a penalty" (the "Possible bug: Repeated ..." thread, after FINE-MENDS); "It didn't work for me either" | the +5 was the law's and it held; a charge costs two names - the law's and half of it off the region's People, spread to the kingdom (the Standing page's Kingdoms row) and read by every commoner - and a sentence gives back both, but the watch's fine and a temple's penance mended the law's alone | fixed (FINE-PEOPLE) |

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

# FIELD BUGS 2026-10-11h - "Time to take a castle and nothing happens"

Mac, in a session, an hour after the Turning of seat week 2 (Sunday 2026-10-11, 18:00 UTC): "charter seats are broken.
Time to take a castle and nothing happens", and a player's screenshot of the board's Seat tab: "The standings did not
load." and its Try again. Read on the code as it stands at main's `314ff136`.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | "Time to take a castle and nothing happens"; "The standings did not load." | the Turning's read of every guild pledged anywhere bound them all in one statement; D1 refuses a statement of more than 100 parameters, and every seat route settles the Turning first - so past 100 guilds every seat read answered `server`, and no Charter was claimed | fixed (SEAT-CAP) |

## SEAT-CAP: every guild list the seats bind is read IN_CHUNK at a time (1)

`server-account/src/seatInfluence.js` allIn, IN_CHUNK, gatherStandings, readStandings; `server-account/src/seatTurning.js`
namesOf, settleWeek, guildmastersOf; `test/accountDb.mjs` D1_MAX_BOUND.

FOUND. Every seat route asks `settleDue` first (Seats-Arc 5.2: "the account service settles week N the first time
anything asks about any seat after N's boundary"), and the settle reads before it writes. Two of its reads bound a list
with no end: the treasuries of every guild pledged at any confirmed seat this week and every holder (`purseIds`), and
those guilds' names (`namesOf`). D1 refuses a statement of more than 100 bound parameters (Cloudflare's D1 limits), so
once 101 guilds were pledged across the realm the read threw. The batch's own failure is caught (AUDIT-SEATS S1); a read
before it is not. The throw left `/v1/seats/*` as `server`, every route: the Seat tab's standings ("The standings did
not load."), the map's seat list, a pledge. And the week stayed unsettled, so the next read asked again and threw again:
the Charter never claimed, for as long as the pledges stood. Reproduced through the real Worker over a fake that
refuses what D1 refuses: 120 guilds pledged, the standings `500 server` after the boundary and the Charter unheld. The
live service's own count of pledged guilds is not readable from here; week 2 was Season 0's first counted week
(SEASON_ZERO_WEEK `2`), the open beta's, and the report came an hour after its Turning.

The same shape stood in the standings' own read, a seat at a time: the binds, the homes and the crowns of every guild
pledged at the seat, and the standings' names (`gatherStandings`, `readStandings`) - past some 98 guilds at one seat,
that seat's board and the Turning with it. And in the Season's end, the guildmasters of every guild a title goes to
(`guildmastersOf`). The service already knew the bound: `renamedSince` read its lists IN_CHUNK (90) at a time, and so do
`judge.js` and `ledger.js`.

The tests never saw it. `test/accountDb.mjs` stands the Worker over node:sqlite, whose bound is 32,766.

THE LAW. `allIn(db, ids, sql, before, after)` (seatInfluence.js) asks a statement whose IN list is every one of `ids`,
IN_CHUNK at a time, and returns the rows together - each row stands alone, never a sum across the list. Every unbounded
guild list the seats bind goes through it: the Turning's treasuries, names and guildmasters; the standings' binds,
homes, crowns and names; and `renamedSince`'s two loops, folded onto it. The fake refuses what D1 refuses:
`D1_MAX_BOUND` (100), a bind past it throws as D1 does. Every test file over the fake now holds every route to the bound
(the 208 test files that stand the Worker, green with it).

NOT CHANGED. The settle still runs before every seat route, and a throw in it still fails the route: the law (5.2)
answers every ask on the settled week. The live service settles week 2 at the first seat read after this deploys:
whatever claims, Rights and Standing its pledges earned land then, at that read's clock, as a late Turning always has.
The client is untouched.

THE FOUR HOSTS. None - the account service alone. The account deploy ships it.

Pinned by `test/seat1c_service.test.js` SEAT-CAP (1): 120 guilds pledged at Alcaire Keep, read on its board before and
after the Turning, and a guild's 6,000 at Anticlere claiming its Charter at that Turning; and the fake's own bound.
`guildmastersOf` runs at a Season's end alone and no pin crowds one - its list goes through the same `allIn`.
`tools/mutants/seat_cap.json` (6, all dead: each list bound whole again). Three records re-aimed by content
(`crown1.json` CROWN1-inf-palace, `season1.json` SEASON1-tu-masters-rank, `seat1b.json` SEAT1b-homes-new-members).

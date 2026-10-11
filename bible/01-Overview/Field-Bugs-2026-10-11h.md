# FIELD BUGS 2026-10-11h - "Time to take a castle and nothing happens"

Mac, in a session, an hour after the Turning of seat week 2 (Sunday 2026-10-11, 18:00 UTC): "charter seats are broken.
Time to take a castle and nothing happens", and a player's screenshot of the board's Seat tab: "The standings did not
load." and its Try again. Read on the code as it stands at main's `314ff136`.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | "Time to take a castle and nothing happens"; "The standings did not load." | the Turning's read of every guild pledged anywhere bound them all in one statement; D1 refuses a statement of more than 100 parameters, and every seat route settles the Turning first - so past 100 guilds every seat read answered `server`, and no Charter was claimed | fixed (SEAT-CAP) |
| 2 | "The server is expericing a bad load right now" - after SEAT-CAP deployed | every seat request ran the whole settle while the week was due, all at once; under load each outlasted its client's wait and was cancelled before its batch committed, so the week never settled and every client's minute retry began another | fixed (SEAT-LEASE) |

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

## SEAT-LEASE: one settler at a time (2)

`server-account/src/seatTurning.js` settleDueOnce, SETTLE_LEASE_S; `server-account/src/index.js` SEAT_READS;
`server-account/src/cron.js`; migration `0110_seat_settling.sql`; `src/net/accountClient.js` (`seats-settling`'s words).

FOUND. SEAT-CAP deployed and the service stayed swamped: a one-row seat read took 7 to 25 seconds, then sign-ins timed
out (the deploy's own Renown and guest checks, 15 seconds each). Every seat route awaited `settleDue`, and while a week
was due each of them ran the whole settle - several hundred reads - at once. The clients ask again a minute after a
failed list read (`SEAT_LIST_RETRY_MS`), and the clock's minute settles too. Under that load a settle outlasted its
client's 15-second wait; the request was cancelled before its batch committed, the week stayed due, and the next request
began another. Turning `SEATS_OPEN` off in the dashboard (the routes answer `seats-closed` before any settle, a refusal no
client retries on the minute) drained it.

THE LAW. `settleDueOnce` - the one door every seat route and the clock's minute settle through. Nothing due costs the one
read it always did, and writes nothing. A week due: the caller takes the one lease (`town_seat_settling`, one row, for
SETTLE_LEASE_S, 60 seconds) and settles, freeing it after - and on a throw; a caller that finds the lease held settles
nothing and answers `pending`. A pending seat READ (the list, the standings, the Hall of Records, the works -
`SEAT_READS`) answers the state as it stands; a pending ACT is refused `seats-settling` (503), never made on a week half
turned. A settler cut off (its client gone, its isolate lost) frees the Turning when its lease runs out. `settleDue`
itself is unchanged - the loop the lease holder runs.

Pinned by `test/seat1c_service.test.js` SEAT-LEASE (1): a lease held by another - the standings and the list answer
unsettled, a pledge `seats-settling` 503, the clock pending; run out, the next read settles and frees it; nothing due asks
one read and no lease; a settle that throws frees it. `tools/mutants/seat_lease.json` (5, all dead). acct118 (the
version pins moved); `seat1c.json` and `season1.json`'s records on the route's settle line re-aimed by content, and
`seat1c_client.test.js`'s host pin.

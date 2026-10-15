# HOST-SPLIT - taking the hosts apart

Opened 2026-10-15, off AUDIT DEPS1 (`Audit-Log.md`). Mac: *"Refactor time?"*, then
*"I wanna take all of this head on and do this right"*, then *"Continue"* on the plan
below.

## Why

Each host keeps its whole state in ONE function's scope. Measured 2026-10-14
(`node tools/hostScope.mjs <file>`):

| Host | Function | Lines | Members | Host-scope `let`s |
|---|---|---|---|---|
| `src/scenes/world.js` | `bootWorld` | 35,251 | 2,787 | 571 |
| `src/scenes/worldModes.js` | `createWorldModes` | 13,505 | 515 | 84 |
| `src/scenes/dungeonContext.js` | `buildDungeonContext` | 10,223 | 560 | 89 |
| `src/scenes/exterior.js` | `bootExterior` | 6,083 | 472 | 62 |
| `server/src/index.js` | `Room` `_message` | 1,428 | 58 | 2 |

A member of one of these can read and write every other member's state, so
nothing in them can be imported, tested or reviewed alone; every change lands in
the same file (the conflicts CITE-ANCHOR was built against); and THE FOUR HOSTS
RULE exists because a seam wired into one host is so easily missed in another.
The relay's `Room` is already 473 methods - its knot is the one dispatcher.

And they grow. Line counts of the files on main:

| File | 2026-09-14 | 2026-09-28 | 2026-10-07 | 2026-10-14 |
|---|---|---|---|---|
| `world.js` | 8,897 | 21,245 | 30,410 | 36,374 |
| `worldModes.js` | 8,299 | 10,953 | 12,421 | 13,984 |
| `dungeonContext.js` | 6,151 | 8,501 | 9,931 | 10,662 |
| `exterior.js` | 4,525 | 5,644 | 6,021 | 6,426 |
| `server/src/index.js` | 594 | 3,184 | 5,600 | 8,879 |

`world.js` grew ~850 lines a day. Moving code out of a scope that grows faster
than it can be taken apart is a race that cannot be won, so the first rule is
the one that stops the growth.

## THE HOSTS DO NOT GROW

New behaviour goes into a module the host wires - the 31 `*Host.js` modules
already in `src/scenes/` are the shape (`fishHost.js`, `navalHost.js`,
`merchantYardsHost.js`): the module owns its state and its frame, the host
constructs it once and calls it. The host's own function gains the wiring, not
the feature.

`test/hostceiling.test.js` holds it: each host function has a ceiling, its
length when this arc opened plus 250 lines - a fix's room, not a feature's. A
change that pushes a host over fails with where to put the code instead. A fix
that truly cannot live elsewhere raises the ceiling with its reason written
beside it, in the same change, where review sees it. And a ceiling comes down
with its host: a slice that moves code out lowers it in the same change (the
suite fails a ceiling left more than 500 lines over its host), so the room a
slice frees never becomes room to grow back into.

## The map

`tools/hostScope.mjs` reads a host's scope instead of guessing it. Each
statement of the host function's body is a member; for a member or a group it
counts what the group READS from the host's scope, the host `let`s it WRITES
(shared mutable state - the hard part of a cut), and the members that USE what
it declares. Few writes and a small used-by make a cheap cut. It matches names by
spelling, so shadowing over-counts: a cut it calls cheap is cheap.

The first reading of `bootWorld` (2026-10-14):

| Group | Lines | Reads | Writes | Used by | Tests naming it |
|---|---|---|---|---|---|
| `travelViewMarks` | 227 | 63 (13 `let`s) | 0 | 1 | 3 |
| `questWorld` | 370 | 46 (9 `let`s) | 1 | 4 | 12 |
| `buildPixelNow` | 1,232 | 111 (18 `let`s) | 3 | 1 | 11 |
| `worldQuickLoad` | 307 | 75 (18 `let`s) | 6 | 5 | 34 |
| `onlineStart` + `chatStart` + `socialStart` + `onlineFrame` | 1,214 | 291 | **68** | 1 | 24 |
| `frame` | 3,204 | 553 | 60 | 18 | 11 |

The online group is NOT a move: it writes 68 of the host's `let`s, so cutting it
out is a redesign of who owns that state, and it waits until the cheaper cuts
have taught the method. `frame` is already partly split inside itself
(`frameMotor`, `framePixelWalk`, `frameGrass`, `frameHud`); it comes apart by
stage - input, simulation, network, render - once its callees have left.

## The method - MOVE, DON'T REWRITE

One group per slice, one pull request each, behaviour unchanged:

1. **Read the map** for the group: its reads, writes and users.
2. **Move the code verbatim** into a module (`src/scenes/<name>.js`) exporting a
   constructor that takes the host's handles - `createX(host)`, as
   `createWorldModes(host)` already does. A `const` or function the group reads
   is handed over as itself. A `let` it reads or writes is handed over LIVE - a
   getter (and a setter, for a write) on the handles object - never a copy:
   the code moved from a scope where it saw every assignment, and an async
   member sees them across its awaits. The handles object is built where the
   host builds it today, and a getter reads at the call, never at construction,
   so no name is touched inside its temporal dead zone.
3. **The pins move with the code.** A test that quotes the moved lines from
   `world.js` reads the new module instead, in the same change - the pin keeps
   its claim and names where the code now lives. A cite into the moved lines
   names the new file (`npm run cites -- --check`, then `citeanchor`).
4. **Lower the ceiling** to the host's new length plus 250.
5. **Prove it**: lint, types, the bible's gates, every test that reads the host
   or the module, `tools/mutate.mjs` over the mutant lists that name the moved
   code - and, since CI has no ARENA2, Mac plays the slice and runs
   `npm run perf` before it merges.

Where two or more hosts build the same thing, the moved module becomes its ONE
CONSTRUCTION SEAM (`Home.md`) for all of them - the slice names all four hosts
(THE FOUR HOSTS RULE), each wired or flagged.

## Order

1. HOST-SPLIT 0 - this page, the ceiling, the map. SHIPPED with this page.
2. HOST-SPLIT 1 (the pilot) - `travelViewMarks`: no writes, one user, three
   tests. It proves the method end to end before anything large moves.
3. `buildPixelNow` (the world's pixel build, 1,232 lines, 3 writes), then
   `questWorld`, `worldQuickLoad`, and down the map by cost.
4. `frame` by stage, then the online group's state, owned.
5. The same for `createWorldModes`, `buildDungeonContext`, `bootExterior` and the
   relay's `_message`.

Each slice records itself here: the group, its numbers before and after, the
ceiling it lowered to.

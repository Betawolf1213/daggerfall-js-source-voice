# HOST-SPLIT - taking the hosts apart

Opened 2026-10-15, off the codebase audit of 2026-10-14 (AUDIT DEPS1). Mac: *"Refactor time?"*, then
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

New behaviour goes into a module the host wires - `fishHost.js` and
`merchantYardsHost.js` are the shape: the module owns its state and its frame,
the host constructs it once and calls it. The host's own function gains the
wiring, not the feature. (Not every one of the 28 `*Host.js` modules is that
shape: `navalHost.js`'s `createNavalHost` is itself a single scope of 4,865
lines - the same knot, one size down, with no ceiling of its own yet.) On the
relay the new code goes into a Room method of its own, as the SCALE5 arms did.

`test/hostceiling.test.js` holds it: each host function - the four hosts and
the relay's `_message` - has a ceiling in CODE lines, its length when measured
plus 250 - a fix's room, not a feature's. Comments and blank lines do not count
(AUDIT HOST-SPLIT 0: a third of bootWorld is the bible's own explanation, and a
ceiling on raw lines made deleting it the cheapest room). A change that pushes
a host over fails with where to put the code instead. A fix
that truly cannot live elsewhere raises the ceiling with its reason written
beside it, in the same change, where review sees it. And a ceiling comes down
with its host: a slice that moves code out lowers it in the same change (the
suite fails a ceiling left more than 500 lines over its host), so the room a
slice frees never becomes room to grow back into.

THE CEILING GATES A CHANGE, NEVER A DEPLOY. Every open pull request is measured
against the base it last saw, so two that each fit can land together and
overflow - and the deploys run the suite. So the ceiling holds on a pull request
and on a contributor's machine, and stands aside on the push that deploys: an
overflow on main is the next pull request's to fix, by moving code out or by a
raise with its reason, never a held deploy.

## The map

`tools/hostScope.mjs` reads a host's scope instead of guessing it. Each
statement of the host function's body is a member; for a member or a group it
counts what the group READS from the host's scope, the host `let`s it WRITES
(shared mutable state - the hard part of a cut), and the members that USE what
it declares. Few writes and a small used-by make a cheap cut. It matches names by
spelling, so shadowing over-counts reads; its writes are the assignments,
updates and for-in/of heads it sees, and a parameter or a hoisted `var` counts
as host state (AUDIT HOST-SPLIT 0 added those three). It is a map for choosing a
cut - what is live and what is a copy is decided by the move itself, by scope
(the method, below). Read the group before moving it.

The first reading of `bootWorld` (2026-10-14, main at 911429f13b; lines raw;
tests are the test files that hold the name as a word, `git grep -lw`):

| Group | Lines | Reads | Writes | Used by | Tests naming it |
|---|---|---|---|---|---|
| `travelViewMarks` | 227 | 63 | 0 | 1 | 3 |
| `questWorld` | 370 | 46 | 1 | 4 | 15 |
| `buildPixelNow` (HOST-SPLIT 2, moved) | 1,232 | 111 | 3 | 1 | 11 |
| `worldQuickLoad` | 307 | 75 | 6 | 5 | 34 |
| `onlineStart` + `chatStart` + `socialStart` + `onlineFrame` | 1,214 | 291 | **68** | 1 | 29 |
| `frame` | 3,204 | 553 | 60 | 18 | (too common a word to count) |

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
   `createWorldModes(host)` already does. A `const` the group reads, a function
   declaration nothing reassigns, and a `let` nothing ever reassigns (a constant
   in all but name) are handed over as themselves. A binding anyone writes is
   handed over LIVE - a getter (and a setter, for a write) on the handles
   object - never a copy:
   the code moved from a scope where it saw every assignment, and an async
   member sees them across its awaits. The handles object is built where the
   host builds it today, and a getter reads at the call, never at construction,
   so no name is touched inside its temporal dead zone.
3. **The pins move with the code.** A test that quotes the moved lines from
   `world.js` reads the new module instead, in the same change - the pin keeps
   its claim and names where the code now lives. A cite into the moved lines
   names the new file (`npm run cites -- --check`, then `citeanchor`).
4. **Lower the ceiling** to the host's new length in code lines plus 250.
`tools/hostMove.mjs` does 2 and the mechanical half of 3 (HOST-SPLIT 1): it
decides every name by those rules (by value, live, import, refused), writes the
module and the host's construction, drops the imports the host no longer reads,
and points every mutant record and doc anchor that named the moved text at the
module - in place, the records' own layout kept. The test pins are the half it
leaves: their assertions are read and moved by hand (`PIN MOVED`).

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
   SHIPPED - below.
3. HOST-SPLIT 2 - `buildPixelNow` (the world's pixel build, 1,237 lines, 3
   writes). SHIPPED - below. Then `questWorld`, `worldQuickLoad`, and down the
   map by cost.
4. `frame` by stage, then the online group's state, owned.
5. The same for `createWorldModes`, `buildDungeonContext`, `bootExterior` and the
   relay's `_message`.

Each slice records itself here: the group, its numbers before and after, the
ceiling it lowered to.

## HOST-SPLIT 1 - travelViewMarks (SHIPPED, 2026-10-15)

The pilot. `tvBadgeOf`, `TV_PEER_HEAD_M` and `travelViewMarks` - the Overworld's
marks, 229 lines, three contiguous members nothing else used - left `bootWorld`
for `src/scenes/travelViewMarks.js` (`createTravelViewMarks(host)`), moved by
`tools/hostMove.mjs`:

- 46 names by value - `const`s above the group, never-written `let`s, function
  declarations; 15 live, read as `host.<name>` - `let`s written elsewhere
  (`_sharedOffsetMs`, `bountyHost`, `livingRoads`, `online`, `social`...) and one
  `const` made 230 lines below the group, `navalRaidersOn`, which a copy at
  construction would have read in its temporal dead zone and thrown at boot.
- 28 imports came along; the host dropped the 9 it no longer read.
- 35 mutant records over 20 lists and one doc anchor (`Wild-Zone.md`, PVPGIANT)
  followed the code, by the tool; after it, `tools/mutate.mjs` over the 35:
  35 dead.
- The pins, by hand: 21 test files and the TIME1 census fixture. Most were text
  pins that now read the module (a live name as `host.<name>`, and where the
  host hands one over, a second pin that it does). Three were HOST RUNS - the
  boat markers, the raiders, the party - that lift the marks' code out of the
  file and run it against stubs; they lift it from the module now, with `host`
  standing for the stubs, and they pass - the moved code still does what it
  did. What they cannot see is the seam itself: a stub hands every name over
  the same way, so a live name handed over as a copy passes them (AUDIT
  HOST-SPLIT 1, below). Two pinned the host's own imports
  (`NAME_RANGE`, `TV_DUNGEON_TYPES`) and follow their one reader.
- `bootWorld` 21,589 -> 21,445 code lines (35,251 -> 35,042 raw); its ceiling
  21,839 -> 21,695.
- The full suite on the slice: 27,336 pass, 0 fail.

WHAT THE PILOT MEASURED: the code moved itself, by rule; the pins did not. 229
lines cost 22 files of pin moves, because the suite reads `world.js` as text
(1,444 files read it, 523 slice it between anchors). That is the price of every
slice, in proportion, and the order above stands on it: a group the map calls
cheap is cheap to move; whether it is cheap to land is how many pins quote it.
The next slice counts its pins first (the pins-to-lines ratio beside the map's
numbers), and a group with many pins and few lines waits.

AUDIT HOST-SPLIT 1 (2026-10-15) read the move against the original - the module
equal to the moved lines but for the 19 rewrites of the 15 live names, every
by-value name written nowhere in bootWorld, the construction reading exactly the
46 it destructures - and found the move sound and two things around it not:

- THE SEAM WAS UNPINNED. `host` is `any` to lint and types, so a live name
  handed over as a copy (`get social()` -> `social,` - null at construction,
  the party's marks gone for good) or a name dropped passed the whole suite.
  `test/hostseam.test.js` now holds every module the tool moved, found by the
  header it writes, to its construction: each settled name handed over, each
  live read a getter, each write a setter, nothing handed over unread.
- THE TOOL had holes the pilot did not fall into and a bigger move would: a
  for-in/of head's write and a reassigned function or class declaration missed
  (a stale copy), an inner binding named `host` capturing the rewrites, a
  parameter default resolved in the body's scope, a host `var` in a block, a
  shorthand with a default and `new.target` rewritten into syntax errors, an
  import dropped with its neighbour on one line, a mutant record found by
  position and an anchor matched inside a longer file name. Each is fixed and
  is a fixture of `test/hostmove.test.js`: the fixture moved for real and both
  versions run, the same answer. After the fixes the tool reproduces the
  pilot's module and world.js byte for byte from the pre-move tree.

## HOST-SPLIT 2 - buildPixelNow (2026-10-15)

Mac: *"2, 3 and 5"* - 2 being this slice. `buildPixelNow`, the world's pixel
build - one member, 1,237 lines - left `bootWorld` for
`src/scenes/pixelBuild.js` (`createPixelBuild(host)`), constructed where it
stood, by the tool:

- 84 names by value; 22 live, read as `host.<name>` (`state`, `season`,
  `woods`, `weather`, `travelOptions`, `legacyHost`...), three of them written
  through setters (`_homeLookV`, `doorGeneration`, `millParts`). 166 imports
  came along in 86 lines; the host dropped the 107 it no longer reads.
- `buildPixel` above the group calls it, so the tool flagged it: a function
  declaration was hoisted, and a destructured `const` is not. Read: nothing
  calls a build before the construction runs - the boot's first build
  (`world.js:"const playerPixel = await awaitedBuild(first.px, first.py);"`)
  stands below it, and `bootWorld`'s last await above the construction is
  `loadModWorldData` (`world.js:"await loadModWorldData();"`): from there
  the boot runs to the construction without yielding, so no callback reaches a
  build early either. (A build before it would have died before the move too, on
  the breather's dead zone.)
- 136 mutant records over their lists and 4 doc anchors followed the code, by
  the tool. By hand: an anchor in a code comment (`exterior.js`, which the tool
  does not read), a `citedrift` pin on a ledger citation the tool had moved, and
  a TIME1 census row.
- `bootWorld` 21,445 -> 20,706 code lines (35,114 -> 33,912 raw); its ceiling
  21,695 -> 20,956.

THE PINS READ THE HOST WHOLE. The move broke 143 tests in 130 files - the
pilot's ratio (9.6 pins a hundred lines against 9.5), at five times the
size, and every slice after it costs the same if each pin is moved by hand. So
`test/hostText.mjs` gives a host's text WHOLE: its file, then each module moved
out of it, found by the header the tool writes. A pin that quotes the world
host reads it through `hostText('src/scenes/world.js')` and keeps quoting the
code wherever a slice puts it; the next slice's module joins without anyone
listing it. That carried most of the 130. What it cannot carry, each by its
own law:

- a quoted line with a live name quotes it as the module spells it,
  `host.<name>` (one pattern read against both exterior hosts accepts either);
- the HOST RUNS that lift moved code and run it over stubs stand `host` for
  their stubs - under `with`, every name resolves to the scope, `scope` too, so
  `host` goes into the scope itself;
- a pin that PARSES the host parses each file as the module it is (two modules
  joined declare their imports twice), and one about `bootWorld`'s own
  statements reads world.js alone;
- the censuses that walk `src/` name `pixelBuild.js`, and check its wiring
  against its host whole; the import pins read the module's import lines
  (the tool sorts them, and keeps only the names each file reads);
- BOOT-TDZ2 (`test/bootorder.test.js`), the gate that walks the boot to its
  first build and follows every call, now follows a call into a moved
  module's functions too, reading `host.<name>` there as `<name>` - a read at
  the use, as the getter makes it. Without that it stopped at
  `buildPixelNow`; with it, it reaches every name it reached before, and its
  allow-list - which fails on a name it can no longer reach - says so.
- The citation gates read the real files: an anchor names a line of the file
  it names.

Proved, not supposed: `tools/mutate.mjs` over the 136 moved records and the
523 world.js records whose tests changed - 659 dead, 0 survived. A rewritten
pin that had gone blind would have let one live.

AUDIT HOST-SPLIT 2 (2026-10-15) read the move by an independent scope analysis -
every one of the moved code's 2,812 references resolving to the same binding of
the same kind before and after, the 84 copies each a binding `bootWorld` never
writes and made before the construction, the 22 live names each a getter with
a setter exactly where the module writes - and found the move sound, and the
seam's pin short of its own law:

- A COPY THE HOST LATER WRITES WENT UNSEEN. `test/hostseam.test.js` checked that
  each name the module copies at construction is handed over, never that the
  host's binding is one that cannot change: a `const` turned `let` and
  reassigned after the construction leaves the module reading the value it
  copied, and passed everything. It holds each copy to a binding the host never
  writes now, refuses a copy handed over as a getter (the module destructures it
  once all the same), and counts a write through a destructuring target or a
  for-of head as a write (it read as a read - a missing setter would have thrown
  only when the line ran). Three mutants.
- The cost of a live name: a handle with accessors is a dictionary object to V8,
  about 18 ns a read against 1. The reads that run outside a build are the
  collider's bucket translations, `host.state.pixelTranslation` - about 5 us a
  full sweep over 300 buckets; inside a build, a few thousand a pixel, under
  0.1 ms against a 6 ms slice. Recorded, not fixed: the next slice that moves a
  per-frame reader should copy the handle's live names into locals per call, or
  hand over a plain object whose fields the host updates.

AUDIT HOST-SPLIT 2, THE SECOND READ (2026-10-15, Mac: *"Pick it up and audit
it"*) read what the first left: `test/hostText.mjs`, the boot walk's reach into
moved modules, and the rewritten pins. The move is verbatim against main's build
(the 1,237 lines equal but for the `host.` rewrites), and main has not touched
the build since. Found:

- A DESTRUCTURED BINDING HAS A DEAD ZONE TOO. BOOT-TDZ2 (`test/bootorder.test.js`)
  indexed only the declarators that are a bare name, and the slice made the
  build one that is not: `const { buildPixelNow } = createPixelBuild(...)`. A
  build reached above its construction read a binding the gate did not know was
  declared there. Today the build's own reads of `state` and `restridePending`,
  declared lower still, fail such a call by luck; with the construction moved
  below `state`, an early build passed the gate. Every slice turns a hoisted
  function into such a binding, so the walk now indexes every name a
  declaration binds. It finds nothing new on the tree. One mutant, dead.
- A PIN THAT READ ONE SPELLING. PERF-COL2's census of a pixel's bucket
  providers (`test/perfcol2.test.js`) was rewritten to the module's spelling,
  `host.state.pixelTranslation`, alone - so it counted only the build's seven, and
  a provider the host lays itself, reading `state`, went uncounted, marked or not.
  It counts both spellings now. One mutant, dead (it lived on the rewritten pin).
- FOUR MORE THE JOIN OR THE SPELLING HID, each proved by a mutant that passed the
  rewritten pin and failed main's:
  - LANDFORM4 (`test/landform45.test.js`) ordered the landform tables before
    `await terrainGen.generate({`, which now stands only in the module the join
    appends after all of world.js - so any place in world.js passed, below the
    first build too. It orders them before the build's construction now.
  - BLOOD1's per-call negative (`test/blood1_decals.test.js`) still spelled the
    bare `state`, which the build no longer does; it reads both spellings.
  - TERRAIN-WORKER's "publish follows the collider" (`test/terrainworker.test.js`)
    appended the module after the door's slice, so both of its `lastIndexOf`
    landed in the module and a mesh laid after the publish in world.js
    (`standPixelNpcs`) went unread. The module is spliced in where the host
    constructs it, as the build stood.
  - WATER-NEXT m8 (`test/audit_waternext.test.js`) was never rewritten: a NEGATIVE
    pin cannot fail when code leaves the text it reads, so it kept reading
    world.js alone and stopped covering the build that lays the pixel's ground.
    It reads the host whole.
  Three mutants in `tools/mutants/hostseam.json`, dead; LANDFORM4's is a move of
  two sites, which a record cannot hold, and was run by hand.
- AND FOUR MORE OF THE SAME TWO KINDS. LANDFORMS II H1's census of raw height
  writers (`test/auditlandforms.test.js`) read `- state.compensation[1]` alone,
  blind to the build's `host.state`; GRASS-LIT2's slice (`test/grasslit2.test.js`)
  ended at a line now in the module, so it ran to the end of world.js; GATE-CLEAR
  (`test/gateclear.test.js`) and AUDIT 46 A10 (`test/roads.test.js`) ordered a
  declaration before text the join appends, which held nothing. Each reads both
  spellings, ends inside world.js, or orders against the build's construction.
  The first three proved by a mutant that passed the rewritten pin and failed
  the fixed one (H1's recorded in `hostseam.json`; the other two are moves);
  A10's move is failed by its own no-await check as well.

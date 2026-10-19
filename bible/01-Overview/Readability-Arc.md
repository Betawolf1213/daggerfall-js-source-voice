# LEGIBLE - code a person can read

Opened 2026-10-19. The owner: *"So how can we alter variables and codebase stuff to make it less assembly and more
human readable?"*, then *"I wanna take this all on. No band aids. A true and accurate overhaul"*.

HOST-SPLIT (`Host-Split.md`) takes the hosts apart: it is the structure half of this work. LEGIBLE is the other
half - the names, the lines, the comments and the shapes inside every file - and the tooling that has to change
first so that work can happen at all.

## Why

Measured on main at a75fcd062e (2026-10-19):

| What | Measure |
|---|---|
| JavaScript under `src/` | 830,313 lines in 2,156 files, 54 MB (about 13.5M tokens) |
| Lines longer than 200 characters | 9,979 |
| Lines whose comment is led by a slice or audit tag (`// AUDIT WATER-NEXT P1`, `// DW-C`) | about 36,000 |
| Logical lines per code line in the hosts | 1.2 to 1.9 - two statements on most lines |
| Mutant records that quote source text exactly | 65,940, in 2,206 lists, covering 2,140 files |
| Cites in the bible that quote a line of our code | about 1,640 |
| Commits to main, the fourteen days before | about 3,400 |

A line of `bootWorld`, as it stood:

```js
if (p.dwTerrain) { renderer.destroyWaterSurface(p.dwTerrain); p.dwTerrain._dead = true; p.dwTerrain = null; }   // DW-C
```

Four statements, a one-letter name for the object everything hangs off, a two-letter abbreviation for the system
(`dw`, Deep Waters), a field invented on a plain object (`_dead`), and a comment that names a ticket instead of
saying why. Every one of those is a choice the tooling rewarded:

- **The ceiling counted physical lines**, so splitting that line for a reader cost four lines of room and cramming
  it saved them (fixed by LEGIBLE 1, below).
- **Mutant records and cites quote text exactly.** Reformatting a line, or renaming a variable in it, stales every
  record and cite that quotes it, so the cheapest change was always the one that left old text alone - and a
  comment explaining the code was sometimes kept on the same line on purpose, "so no cite below it moves".
- **Nothing owns layout.** There is no formatter, and lint has no rule on line length or statements per line.

## The standard

What LEGIBLE leaves behind, in every file it has been through:

1. **One statement per line**, laid out by the formatter, never by hand.
2. **Names say what a thing is.** No abbreviation a newcomer would have to look up, unless it is in the glossary
   (`DFU`, `HUD`, `UV` - words the field uses). `pixel`, not `p`; `deepWaters`, not `dw`.
3. **Comments say why, in plain words.** The slice or audit that made a line is history: it lives in git and in
   this bible, and the code's comment says what a reader needs - the reason, the trap, the DFU member it follows
   or departs from.
4. **Shapes are declared.** An object that travels between functions has a typedef or a class; no field is
   invented on a plain object where it is used.
5. **A file and a function fit in a head.** That is HOST-SPLIT's work, and LEGIBLE does not duplicate it.

## Accuracy - how each change proves it changed nothing

"Accurate" means the game behaves the same after every slice. How a slice proves that depends on the kind of
change:

- **A mechanical change** (the formatter, a rename) is proved, not tested: the program before and after is
  compared as a syntax tree - identical apart from layout and comments for the formatter, identical apart from the
  renamed names for a rename. A slice that cannot pass that comparison is not mechanical, and is judged as a
  rewrite.
- **A rewrite by hand** (a function made readable) is held by the suite and by the mutation lists: every mutant
  the file's records name must still apply and still die. A record the rewrite moves is re-aimed by content, in the
  same change, as `mutantdrift.test.js` demands.
- **The pins move with the text.** A mechanical change carries every mutant record and cite with it by running
  the same change over both sides: the record's file with and without its mutant, both transformed, then compared
  again to find the record's new text. Nothing is re-aimed by hand that a tool can carry.

## The order

Each slice is one pull request. A slice that touches every file needs a quiet window on main, and that window is
the owner's to call.

| Slice | What | Needs |
|---|---|---|
| LEGIBLE 1 | The ceiling counts logical lines, so it is blind to layout | - (below) |
| LEGIBLE 2 | The syntax-tree comparison that proves a mechanical change, and the carrier that moves mutant records and cites through one | - |
| LEGIBLE 3 | The formatter: one pinned version and configuration, the whole tree formatted folder by folder with its pins carried, a `--check` in CI and `.git-blame-ignore-revs` | a new dev dependency; a quiet window per folder |
| LEGIBLE 4 | Lint that holds the line: one statement per line, no comma sequences, a ratchet on new short names | - |
| LEGIBLE 5 | The glossary (`Glossary.md`) and the renames, one abbreviation per slice (`dw`, `csa`, `wod`, `lpt`, ...), by the language service and carried like the formatter | a quiet window per rename |
| LEGIBLE 6 | Comments: a register of every tag and the page that records it, then tag-led comments rewritten as reasons, file by file | - |
| LEGIBLE 7 | Shapes: typedefs for the objects that travel (a terrain pixel, a face, a foe, an item), `// @ts-check` as each file is done | - |
| LEGIBLE 8 | Rewrites by hand, function by function, most-read files first (by commits touching them), held by the suite and the mutants | - |

LEGIBLE 3 depends on LEGIBLE 2: formatting 830,000 lines without a carrier stales most of the 65,940 records at
once. LEGIBLE 5 and later depend on 3, so their diffs are names and words, not layout.

## Cost

Measured against the per-token prices of 2026-10-19, before any fix rounds:

- LEGIBLE 1 to 5 are tools and scripts - the work of writing them, not of reading 13.5M tokens. Well under $300 in
  all, at API prices.
- LEGIBLE 6 and 8 read and write by hand: about 400 sessions of 2,000 lines each, $3,000 to $10,000 at API
  prices, or that share of a subscription's capacity.
- CI costs nothing: the repository is public, and every runner it uses is GitHub's standard one.

## Decisions the owner holds

- **The quiet windows.** LEGIBLE 3 and each rename in LEGIBLE 5 touch most files; a pull request open across one
  will conflict on nearly every file it touches. When, and for how long, is the owner's call.
- **The formatter as a dependency** (LEGIBLE 3).
- **The three new ceilings** LEGIBLE 1 added (below) - a tightening, made because the old count let crowded
  modules pass under the line.

## LEGIBLE 1 - the ceiling counts logical lines (2026-10-19)

THE CEILING IS BLIND TO LAYOUT. `test/scenes/hostceiling.test.js` measured each host in code lines - physical
lines holding anything but comments - so the same code crowded onto one line cost a quarter of the room it took
spread out, and splitting a crowded line for its reader cost room. It now measures LOGICAL lines
(`tools/hostScope.mjs` `logicalLines`): a statement, an entry of an object literal or a class, a switch case, or an
expression arrow's implicit return. Braces, blank lines, comments and the declaration in a loop's head are no
weight. A fixture of every kind of logical line, crowded onto one line and spread over twenty-six with a comment,
measures 20 both ways.

A plain statement count was the first candidate and was not enough: a host grows by entries in the objects it
returns (`onSomething: () => ...`), which hold no statement at all.

The conversion gave no host room it did not have. Each ceiling is the host's logical length plus the room it
already had, converted at its own ratio; `ROOM` went from 250 to 400 and the slack line from 500 to 800, at the
1.6 logical lines per code line the hosts measured:

| Host | Code lines | Old ceiling | Room | Logical lines | New ceiling |
|---|---|---|---|---|---|
| `bootWorld` | 21,153 | 21,186 | 33 | 36,177 | 36,233 |
| `createWorldModes` | 7,137 | 7,138 | 1 | 10,996 | 10,998 |
| `buildDungeonContext` | 5,322 | 5,446 | 124 | 8,405 | 8,601 |
| `bootExterior` | 3,198 | 3,446 | 248 | 5,049 | 5,441 |
| `createNavalHost` | 3,710 | 3,942 | 232 | 6,089 | 6,470 |
| `createComeSailAwayRuntime` | 2,066 | 2,315 | 249 | 2,484 | 2,783 |
| `_message` | 904 | 1,093 | 189 | 1,693 | 2,046 |
| `createExteriorFoes` | 1,769 | - | - | 2,943 | 3,343 |
| `createFpArm` | 1,999 | - | - | 2,852 | 3,252 |
| `createEgClient` | 1,432 | - | - | 2,775 | 3,175 |

KNOT, the length past which any function is a knot that must hold a ceiling, went from 2,000 code lines to 2,400
logical lines - not 3,200, the plain conversion, because at 3,200 Come Sail Away's runtime (2,484, the least
crowded knot) would have stopped being one and dropping its ceiling would have failed nothing. At 2,400 every knot
the old line held is still held, and three modules the old count passed because their lines are crowded
(`createFpArm` stood at 1,999 code lines against 2,000) are held now too, at their length plus `ROOM`.

The walk for knots used to skip any file shorter than KNOT physical lines. A crowded file can hold more logical
lines than it has physical ones, so that bound no longer held: it skips a file shorter than two characters per
logical line instead (`a;` is the shortest), and a fixture of a knot crowded onto one line is found. The test
takes about five seconds longer, from parsing every file large enough to hold a knot.

Mutants: `tools/mutants/legible1.json`, eight, all dead - a loop head counted; a destructuring entry counted;
object entries not counted; class members not counted; switch cases not counted; expression arrows not counted;
braces counted; a crowded file skipped by its line count. Six records of `tools/mutants/hostsplit.json` were re-aimed
by content at the converted rows and the new walk, all dead. One was retired: `HOST-SPLIT-the-ceiling-counts-comments`
mutated `codeLines`, which is gone - a syntax tree holds no comments, so there is nothing left for that mutant to
break.

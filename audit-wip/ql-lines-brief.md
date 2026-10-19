# Questlines scripts - the brief (QL12-QL16)

Repo: /home/user/daggerfall-js-source (DFO Online - a JS game on Daggerfall Unity's quest machine). Read CLAUDE.md
first. Then read, in this order:

1. bible/06-Systems/Questlines-Arc.md section 4 (the lines' story and lore; section 1's decisions). Where this brief
   and section 4 disagree, THIS BRIEF wins (the record is being updated to the built shape).
2. src/systems/questlines/qlLines.js - THE REGISTRY: every line, its steps' quest names and titles, its gate.
3. src/net/questlineClaims.js - which steps the account service witnesses (and by what) and which pay a title/key.
4. src/systems/questlines/qlActs.js - the act kinds a script may wait on (`ql act <kind> <n>`).
5. src/systems/questlines/qlActions.js - the questlines' own script lines: `ask`, `outcome`, `ql act`, `ql paid`,
   `ql name`.
6. THE REFERENCE: src/systems/questlines/quests/QLBD01.txt and its sheet (the QLBD01 entry in
   src/systems/questlines/sheets/questlines.json). Copy its shape: header comment, `Quest:`, `DisplayName:`, QRC
   messages, `QBN:` resources, start-up, tasks.
7. DFU's own scripts in vendor/dfu-quests/Quests/*.txt are the grammar's examples - grep them for any line you want to
   use (e.g. `grep -l "place foe" vendor/dfu-quests/Quests/*.txt`). Only lines a registered template claims are
   allowed: the pins fail any line no template claims.

## What you write

For each quest name assigned to you:

- `src/systems/questlines/quests/<QUEST>.txt` - the script.
- its SHEET (objectives and outcomes) - written into a JSON array file of your own in the scratchpad and merged into
  the shared family file with the locked helper (several writers share the file - NEVER edit questlines.json by hand):
      node /tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-sheet-put.mjs <your-sheets.json>
  Re-running it with the same quests replaces their sheets.

Check as you go:
- `node /tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/parse.mjs <QUEST>...`
  prints each quest's tasks and resources and any `pending` line (a line no template claims - must be empty).
- `node tools/qlSheetDraft.mjs <QUEST>` - the brief of a script: its tasks (S = settable), journal steps, rewards.
- `node tools/qlCheck.mjs Questlines` - every sheet against its script. Lines for OTHER writers' quests saying
  "no sheet yet" are not yours; every line naming one of YOUR quests must be gone.
- `node --test test/systems/questlines/ql12_lines.test.js` - the pins (scripts parse, all lines claimed, DisplayName
  == the step's title in qlLines.js EXACTLY (same apostrophes - qlLines uses ’ in t() fallbacks: write the
  same character ’ in DisplayName), every message a script names (`say`, `log`, `notify`, `used`, `anyInfo`,
  `rumors`, `ask`/`choices`) is written, every `ql act` kind exists, a witnessed step waits on its act).

## The rules of a line's step

- STARTED BY THE LINE'S RUNNER, never by a questor: no QuestorOffer/AcceptQuest/RefuseQuest needed. The first step of
  a line arrives as a LETTER or a COURIER (QLBD01's shape: a clock, then `give pc _letter_ notify <popup>` and the
  journal's `log ... step 0`). A later step may begin the same way (a new letter) or with the giver's words in the
  journal at once (`log 1010 step 0` in the start-up).
- EVERY step must end: a success path that pays (`give pc _gold_`, or `give pc _reward_` with an Item, or `ql paid`
  where the script pays nothing itself) and then `end quest`; and a FAILURE path - a generous clock (30 days or more
  for a letter's meeting; 60+ for an endgame act - the player may need weeks to reach a breach) whose task says a
  failure message and `end quest` without paying. A failed step is offered again by the runner a day later, so a
  failure is never a dead end.
- A GIVER is a Person (`Person _giver_ faction <Faction> female|male anyInfo <msg>`, or `group <Career>`), placed at
  a Place (`Place _p_ remote magery|temple|tavern|...` - see vendor/dfu-quests/Tables/Quests-Places.txt; or `local`
  for the player's own town), `place npc _giver_ at _p_`, met by `clicked npc _giver_`. Named givers (the registry's
  `giver` names one) say `ql name _giver_ Given_Name` FIRST in the start-up. The registry's giver for each line:
  Ysolde Marnhel (Burning Doors, Covens' Hoard) - female, faction The_Mages_Guild, place `remote magery`;
  Corvane Tull (Weir Road) - male, faction The_Mages_Guild (a Battlemage), place `remote tavern`;
  Prior Anselm Vey (the Hour) - male, faction The_Order_of_the_Hour, place `remote temple`;
  Hamid al-Rasheen (the Old Coil) - male, `group Resident1`-style or faction as fits, place `remote tavern`
  (Sentinel's sailors - the script cannot pick Sentinel; say "a Sentinel packet captain" in words);
  the introductions' givers are UNNAMED ("a harbourmaster") - a Person by `group`/`factiontype` at a `local` place.
- AN ACT is a trigger task: `_caught_ task:` then `ql act fish-caught 3` as its first line, then what follows. Name
  the act the player must do in the journal and the sheet, plainly ("Catch three fish"). A witnessed step (see
  questlineClaims.js) MUST wait on its receipt's act: rite -> `ql act rite-broken 1`, breach -> `ql act breach-closed 1`,
  redoubt -> `ql act redoubt-taken 1`, redoubts3 -> `ql act redoubt-taken 3`, valkynaz -> `ql act valkynaz-felled 1`,
  hour -> `ql act hour-broken 1`, serpent -> `ql act serpent-slain 1`. After the act, the player returns to the
  giver (or the giver's letter arrives) and is paid.
- A BRANCH is `ask <q> choices <a> _taskA_ <b> _taskB_ [<c> _taskC_ ...]` (2-4 choices, each its own message; each
  `_taskX_` declared `variable _taskX_`), and each choice's ending task writes `outcome _name_` (the sheet's outcome
  id, no underscores in the sheet). A line's LAST step carries the line's branch (section 4's outcomes). Six choices
  (the Hour's six powers) are two asks: the first's fourth choice opens the second ask.
- REWARDS: gold from an Item (`Item _gold_ gold range 150 to 250`, scaled by the line's tier: tier 1 ~100-200,
  tier 2 ~200-400, tier 3 ~300-600, tier 4 ~500-900). The questlines layer adds the choice of three gear pieces
  itself at the step's end (the sheet's `pay`). A choice that turns the reward down ends with `ql paid` (never
  `give pc nothing` - its box would say "here is your reward").
- STANDING: a sheet outcome's `standing` names factions by Quests-Factions.txt name with an amount (e.g.
  `{"The_Mages_Guild": 5}`); a script may also `change repute with _giver_ by +5`.
- WORDS: Daggerfall's voice - `<ce>`-centred lines for spoken boxes, `%pcn`/`%pcf` for the player, `_res_` and
  `__res_` for a resource's name and its town (see QLBD01). Lore: canon from Daggerfall/UESP named as such in the
  record; the port's own (the faithful's rite, the breach, Valkynaz Ruhn, the Sigil Broker, the Order's six stones...)
  as section 4 says. Keep each message to Daggerfall's box widths (lines ~45-55 chars, as QLBD01's).
- NO line of English prose in a .js file: everything a player reads is in the script or the sheet (quest text).
- Every quest's `DisplayName:` equals its step's title in qlLines.js exactly.

## The sheet (one per quest - see the QLBD01 sheet and docs in src/systems/questlines/qlSheets.js)

`{"quest":"QLxx01","tier":<line's tier>,"objectives":[...],"branches":[...],"outcomes":[...]}`
- objectives: `{"id":"meet","text":"Meet Ysolde Marnhel at _hall_ in __hall_","open":{"task":"_courier_"},"done":{"task":"_met_"},"mark":"_hall_"}`
  - bindings: `task`, `item`, `clock`, `clockDone`, `step` (journal step), `foeDead`, `act` ({"act":"fish-caught","n":3}),
    `choice`, `all`/`any`/`not`, `started`, `ended`, `success`. An act objective: `"done":{"act":"fish-caught","n":3}`
    or bind the act task itself (`{"task":"_caught_"}`).
- branches: `{"id":"fate","text":"<the question, short>","choices":[{"id":"guild","text":"<choice words>","sets":"_toGuild_"},...]}`
- outcomes: `{"id":"guild","text":"<how it ended, one line>","on":{"task":"_toGuild_"},"pay":"standard","standing":{...}}`
  plus a last `{"id":"failed","text":"...","on":{"ended":true},"pay":"none","failure":true}`. pay names:
  standard, lesser, greater, double, betrayal, own, none. A line's LAST step's outcomes are the line's outcomes; for
  the Covens' Hoard step 3 (QLCH03) the outcome ids MUST be `keep` (the player keeps the Weir Key - the service pays
  it) and `seal` (handed to the Order of the Hour to be sealed: standing with The_Order_of_the_Hour, `greater` pay).
- Texts <= 160 chars, plain words.

## Don'ts

- Do not edit any file but your quests' .txt files and your scratch sheets file (merged via the helper). Not qlLines,
  not the tests, not the bible. If the registry or a test seems wrong, say so in your report.
- No git (no commit, stash, reset, checkout).
- Do not run the whole suite; the commands above are enough.

## Report

For each quest: its path, its tasks in a line, its outcomes, and how a player completes it. Anything you could not do,
and any line of the machine's grammar that surprised you.

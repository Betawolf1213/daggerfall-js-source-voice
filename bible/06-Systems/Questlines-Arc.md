# QUESTLINES (QL0, designed 2026-10-19)

The owner, 2026-10-19: "So I want to talk about overhauling the questing system and departing from DFU. I was talking
with my developers, and we would love to modernize the questing system to be more in line with the mainline games.
1. Quest enhancements introducing multiple objectives that branch to a conclusion. A proper overhaul to every quest in
the game. 2. New questlines tying into and introduced the oblivion gates, abyss dungeons, elite dungeons and elite
breaches. Staying true to Daggerfall's lore 3. Overhauling quest rewards to be more meaningful with gear, currencies,
etc 4. Tying all our newly integrated features into quests ... This would be toggled for online and not be able to be
changed. 5. One unified place to view questlines".

Asked four things, the owner answered:

| Asked | The owner's answer |
|---|---|
| Online the overhaul is forced on and locked. Offline? | "Player's choice, on" - the house pattern: a Features row the lane forces online, the player's own switch offline, on by default |
| How deep on DFU's quests? | "Systemic + curated" - objectives and new rewards for every quest; hand-written branches for the flagship set (section 3) |
| A new currency, or the existing ones? | "Reuse existing" - no sixth Wallet currency |
| The online world is about 3E 406; the Abyss Dungeon's Hour reads the Warp in the West (3E 417) as past. How does a questline settle it? | "An echo of a Break to come" (decision 5) |

Then, the same day: "Dude. Develop this all. I dont want a design doc. I want everything built to perfection." The five
calls section 10 left open were taken at the record's own defaults (section 10 says each).

**Status: QL1-QL16 BUILT 2026-10-19** (pull request #1047). Section 0 is the game as the design read it; sections 1-10
are what was built, and where the build departs from the design it says so in place ("AS BUILT").

## 0. What stands, read against the code (2026-10-19)

- **One machine, DFU's, whole.** `systems/quest/machine.js` (`QuestMachine`), `parser.js`, `quest.js`, `task.js`,
  `actions.js` are DFU's QuestMachine ported: `defaultActionTemplates()` registers DFU's 82 templates in C# order,
  pinned slot for slot by `test/systems/quest/auditquests_linkage.test.js` (AUDIT QUESTS 1), and no DFU action is left
  unported (QG1, RR3). Jagget's four Quest Actions Extension actions ride beside them
  (`questActionsExtension.js`, FORAGE1) - the precedent for a quest action that is not DFU's.
- **The scripts are vendored verbatim.** 265 DFU scripts (`vendor/dfu-quests/Quests`, DFU's MIT text at a pinned commit,
  route (a), 2026-08-20) and 29 mod quests (Roleplay & Realism 3, Warm Ashes 4, Foraging 22), all read by one loader
  (`scenes/quest/questData.js` `loadQuestPack`). A change to a script is a PATCH applied as the pack is read, never an
  edit of the file: `questPatches.js` `applyTextPatches` takes an exact old text and how many times it must occur, and
  throws on any other count (SHAM-TRAIL, FORAGE-FIX). The corpus gate parses all 265 (`quest.test.js`).
- **A quest speaks in journal entries, not objectives** (PX4; `Quest-Guide-Arc.md`: "do not invent checkbox objectives
  for DFU quests"). There is no objective model and no branch model. A script branches two ways today: `pick one of`
  (a random draw - `sharedPickRoll` keeps a party's copies alike) and `prompt` (a yes or no the player answers). 37 of
  the 187 listed quests ask a `prompt`; 90 do one or the other.
- **Who offers what.** Guild questors and social NPCs draw from `questLists.js` `QuestListsManager` over
  `QuestList-Classic.txt` (187 live rows: Nobility 28, Holy Orders 24, Fighters Guild 20, Commoners 20, Mages Guild 18,
  Knightly Orders 17, Thieves Guild 15, Dark Brotherhood 13, Merchants 12, Witches 10, Vampires 10) and the mods'
  lists. The main quest (34 `S0000*` scripts and `_BRISIEN`) is in no list. The sixteen Princes' summonings are
  `daedraSummoning.js` (Mehrunes Dagon's is `Y0C00Y00`, day 320, 20 Sun's Dusk). The two cures (`$CUREVAM`,
  `$CUREWER`) and `CUSTOM01` complete the playable set; the 21 `__DEMO*` scripts and `_TUTOR__` (retired by TUT1) are
  not offered, and the list itself disables `K0C00Y06` and drops `R0C11Y27` as a duplicate.
- **Rewards.** Gold is DFU's formula (`quest/item.js` `_createGold`: level or rank, the region's price, the faction's
  power), paid by `GivePc` into the reward pile (RW1). A quest's end moves reputation +5 / -2 (`questRepute.js`).
  Online: a failure costs nothing (QFAIL-FREE), a guild's reputation is the service's Roll and a quest's gain a
  bounded claim of 15 a guild faction a character a UTC day (`Chapters-Arc.md` 3.3), Renown XP is
  `renownQuestXp` (`net/renown.js`), and a shared quest's gold is split (`shareQuestGold`). Quest gold is written by
  the client and bounded by the wealth budget (`Integrity-Arc.md`); the judge counts a quest item as worthless
  (`server-account/src/judge.js` `worthless`).
- **Online quest law already in force.** QFAIL-FREE, REPUTE-GATE (`onlineRepute.js`), GUARD-ONLINE (`onlineGuard.js`),
  TIME3 and TIMEFREE (online a deadline never lapses and a delay lands in about two real minutes), KVAR-HOLD,
  NEARBY-QUESTS, and the main quest refused for sharing (`canReceiveSharedQuest`, reason `mainQuest`).
- **Party.** QUEST1 gives each member a copy (`questShare.js`, the relay's `quest` frame, opaque to the relay), kept in
  step by resync; QUEST-PARTY makes a shared quest's foes the party's, KEPT-KILL carries a kill to every copy, and
  INSTANCES gives the party its own quest dungeon.
- **Where quests are read.** One walk (GUIDE1): `questBridge.questLog()` -> `ui/quest/questRail.js` -> `questLens.js`.
  The streaming host widens the log with bounties, revenant hunts and Legacy's death quests
  (`scenes/world.js:"questBridge.questLog = () => {"`). Three windows show it: DFU's logbook on the classic skin
  (`ui/quest/questJournal.js`, verbatim), the pause window's Quests tab (`enhancedMenu.js` `pauseQuests`), and the
  Chronicle on L (`enhancedChronicle.js`). The Quest Guide's herald, tracker, map marks and guidance tiers read the
  same walk.
- **The endgame, and its witnesses.** Dagon's Breach (`11-Multiplayer/World-Bosses.md`), the Sigil Broker
  (`Sigil-Sets.md`), Elite Dungeons (`world/spawnedDungeons.js` ELITE_CHANCE, `systems/eliteFoes.js`), the Elite
  Breach (`Elite-Gates.md`), the Abyss Dungeon (`Super-Dungeons.md`) and the Sea Serpent (`Sea-Serpent.md`) are
  online only. The relay referees each and the account service holds signed receipts of what was done there: `r1`
  (a breach closed, the rite broken), `h1` (an Hour broken), `e1` (a Redoubt taken), `l1` (a serpent slain). What
  story they carry: Ysolde Marnhel's *On the Burning Doors* (`portBooks.js`, delivered with a player's first ember),
  the thirty Annals of 3E 398 (kept out of the journal by design), the Abyss's tavern rumours (`sdOmen.js`), and
  the breach's chat and Discord lines. No quest leads to any of them.
- **The online lane.** `systems/online/onlineLane.js` forces a Features row's value online
  (`features.js` rows' `online: true`, read by `declareOnlinePrefs`), and `enhancedMenu.js` `lockOnline` shows the row
  shut - "On (online)", with the note that the player's own choice comes back offline. A new switch fails
  `test/systems/onlinelane.test.js` (OL1) until it answers the online question. A service feature is opened by a
  switch in `server-account/wrangler.toml` (`off` | `dev` | `on`, as `CHAPTERS_OPEN`).
- **The calendar.** The online clock began at 3E 405 (`net/wire.js` ONLINE_EPOCH) and runs about a game year a real
  month. `Super-Dungeons.md` section 7 tells the Hour from after the Warp of 3E 417; no string a player reads says
  3E 417 (the phase is named "The Dragon Break", `sdRemnant.js` SD_PHASE_NAMES).

## 1. The decisions (QL0)

Taken at the design. Each is the owner's to overrule; 1, 3, 4 and 5 are the owner's answers.

1. **ONE SWITCH, LOCKED ON ONLINE** (the owner). A Features row, `questlines` ("Questlines"), on the prefs shelf,
   `initial: true, online: true`: online the lane forces it on and the Settings row shows it shut; offline it is the
   player's, on by default. The switch is read when a quest STARTS, and the quest is stamped with it for life
   (`ql: 1` in its save), as `oblivionLeveling.js` decides a law at birth and never on load. So a quest under way at the
   deploy finishes as it began, a player who turns the switch off offline strands nothing, and a quest shared to a mate
   keeps its sharer's stamp. Endgame questlines are online only because their places are: offline they are never drawn
   (a page with nothing to show is never drawn - `10-UI/UI-Calm.md`).
2. **ONE MACHINE, A LAYER OVER IT.** No second quest engine. The machine stays DFU's and never learns of the layer
   (GUIDE1's law, "the quest machine never knows about the UI", kept). Objectives, branches and outcomes are a layer
   that READS the machine (section 2). New quests - every questline of section 4 - are written in the machine's own
   script, with QL's few actions registered as the extension's four are. So sharing, instances, the save, KEPT-KILL,
   guidance, map marks and the translated `-LOC` text work for them unchanged; a second engine would have to grow
   every one of those again (THE ONE CONSTRUCTION SEAM).
3. **EVERY QUEST GETS OBJECTIVES AND THE NEW REWARDS; 66 GET BRANCHES** (the owner: "Systemic + curated").
   - **Every quest a player can be given** gets an objective sheet and the outcome rewards: the 187 listed quests, the
     main quest's 34 scripts and `_BRISIEN`, the sixteen summonings, the two cures, `CUSTOM01` and the 29 mod quests -
     270. A test holds the sheet set to exactly the set the offer paths, the main quest and the summonings can reach.
     AS BUILT: **248**. Counting what a player can actually be GIVEN took 22 of the 29 mod quests out: Foraging's 18
     tool bonuses are rolls with no journal entry that no one gives, and Warm Ashes' four are the sea's own events, run
     by the world. 187 listed + `CUSTOM01` + 16 summonings + 2 cures + 35 main quest + Roleplay & Realism's 3 +
     Foraging's four FetchWood quests = 248, and `test/systems/questlines/ql1_sheets.test.js` names every quest the pack
     holds as given or as left out with its reason. The questlines' own 35 quests (section 4) have sheets of their own
     beside them.
   - **The flagship set gets hand-written branches.** Its rule, read off the list and the scripts so it cannot drift by
     taste: every listed quest that asks the player a `prompt` (37), every quest offered at rank 4 or above (20), and
     every one-time quest (22) - 66 once the overlaps are counted (section 3). The owner adds any quest by name.
   - **Daggerfall's words stay.** A sheet's lines and a branch's text are the port's own words (`t()` keys, drafted in
     the thirteen languages); the script's own messages are not rewritten. A branch adds messages through a patch;
     it never replaces one.
4. **NO NEW CURRENCY** (the owner). Rewards are drawn from what the game already has: gold, silver (the service's),
   Deadlands Embers, Weir Keys, Welkynd Shards, Renown XP, standing, set pieces, named gear, titles and auras, tavern
   cards. The Wallet keeps its five. AS BUILT: gold, a choice of gear, standing and legal standing (the client's), a
   named piece at a questline's end, and the service's titles (one a line) and one Weir Key (section 5).
5. **THE HOUR IS AN ECHO OF A BREAK TO COME** (the owner). The world is about 3E 406; the Warp in the West is 3E 417. A
   Dragon Break has no before and after - that is what makes it one - and the Hour is "the moment itself, kept outside
   time" (`Super-Dungeons.md` section 7). The Abyss questline reads it so: the Bay WILL break, the Hour is that moment
   reached early, and the Orrery's six stones are six futures. Nothing shipped changes, and no line says which ending
   comes - the main quest the player is still running stays theirs to end.
6. **AN OBJECTIVE TELLS THE TRUTH** (a departure from PX4, named). The Quest Guide's law is that a DFU quest speaks in
   journal entries and that a checkbox the script does not know is "a lying UI". QL keeps the reason and changes the
   letter. An objective is a line the port writes, BOUND to state the machine holds - a task set or cleared, a
   resource's placement, an item in the pack, a running clock, a global variable - and it shows only once that state
   opens it. A sheet that names state its script never reaches fails its test (section 2.5). The classic skin keeps
   DFU's logbook verbatim (THE NATIVE-WINDOW RULE); objectives are drawn on Enhanced Plus and DFO Grimoire. QL1 adds
   the Port-Ledger section A row.
7. **A BRANCH IS A TASK THE MACHINE KEEPS.** A branch is a choice the player makes - a choice in talk, a `prompt`, or
   an act (the quarry spared or slain, the item returned or kept, a rival's offer taken) - and it sets one task of two
   or more; each leads to an outcome. Nothing branches on a deadline, offline either: online a deadline never lapses
   (TIMEFREE), and a quest must read the same in both lanes. In a shared quest a choice in talk is the sharer's, and the
   copies take it on the resync (as `sharedPickRoll` keeps a draw alike); an act is whoever does it, carried as
   KEPT-KILL carries a kill.
8. **THE OUTCOME PAYS; THE SERVICE PAYS ONLY WHAT IT WITNESSED.** Section 5. Gold and gear stay the client's, as every
   quest's are today, bounded by the wealth budget and the item law. Silver, embers, Weir Keys, titles and auras are
   the service's, paid only against a receipt the service already holds or a capped claim - never on a client's word
   that a quest was done ("nothing another player can see, take or be ranked against stands on a client's word",
   `Integrity-Arc.md`).
9. **QUESTLINES INTRODUCE; THEY NEVER GATE.** Every endgame place stays open as it is today. A questline leads a player
   to it and pays for going; a player who never takes the line loses nothing they have now.
10. **ONE PLACE TO READ THEM** (the owner's fifth). The pause window's Quests tab becomes the one place - not an eighth
    tab (`PAUSE_TABS` stays seven) - and L lands there on Enhanced Plus. Section 6.
11. **THE HOSTS DO NOT GROW.** The layer is `systems/questlines/`, its host seam one module the hosts wire, its window
    `ui/questlines/`, its service one module of `server-account/src/` (section 7).

## 2. The model

### 2.1 The words

One word, one thing (`11-Multiplayer/Guilds-Made-Plain.md`). Checked against the words the game already uses:

| Word | Means | Not |
|---|---|---|
| **Questline** | an ordered run of quests that tells one story, each opening the next | a "chapter" - the Chapters are Daggerfall's guilds online (`Chapters-Arc.md`) |
| **Quest** | one script on the machine, as today | |
| **Objective** | one thing a quest asks now, bound to the machine's state | a "task" - a task is the script's own and the player never sees one |
| **Branch** | a point where the player's choice sets which way a quest goes | a `pick one of`, which is a draw the player never sees |
| **Outcome** | how a quest ended, and what it paid | an "ending" - the Endings are the Abyss's six (`Super-Dungeons.md`) |

### 2.2 The objective sheet (AS BUILT)

One sheet a quest, data the port writes, filed by family as JSON (`src/systems/questlines/sheets/<family>.json`, the
fourteen families of `src/systems/questlines/qlFamilies.js` and the Questlines' own), read by
`src/systems/questlines/qlSheets.js`. JSON and not code: a sheet's lines are quest text - Daggerfall's kind of words,
read in a translation's words where a pack carries them (TextQuests `QL.<QUEST>.<id>`, the `-LOC` route a DFU quest's
own messages take), never a string of the port's interface. M0B00Y06 as filed:

```json
{"quest":"M0B00Y06","objectives":[
  {"id":"slay","text":"Kill the wild beast loose in _house_","done":{"task":"_mondead_"},"mark":"_house_"},
  {"id":"report","text":"Return to _qgiver_ for your pay","open":{"task":"_mondead_"},"done":{"task":"_S.02_"}}],
 "outcomes":[
  {"id":"done","text":"The beast is dead and the citizen's house is safe.","on":{"task":"_S.02_"},"pay":"standard"},
  {"id":"failed","text":"The Guild gave the job to someone else.","on":{"ended":true},"pay":"none","failure":true}]}
```

- **What a binding reads** (`open`, `done`, `fail`, an outcome's `on`; `src/systems/questlines/qlLaw.js` BINDING_KINDS):
  `started`, `ended`, `success`, a `task` set, an `item` carried, a `clock` running or `clockDone`, a journal `step`,
  a `global`, a `foeDead`, an `act` heard (QL11), a `choice` taken, and `all` / `any` / `not` over them. Each reads the
  machine's own state; nothing the layer keeps decides what a player sees but its LATCHES (below).
- **The latches** (`qlLaw.js` observe). What the machine showed once stays shown: an objective opened stays open, one
  done stays done though its script clears its task, a branch's first choice stands, the outcome settles once. A
  script that clears a task to re-arm it never takes back a line the player has read.
- **The text** names resources with the script's own symbols (`_house_`, `__house_`, `=monster_`), read through the
  machine's macros quietly (`src/ui/quest/questLens.js` quietText), in the player's language where a pack has it.
- **Shape.** `optional`; `group`; `any` (alternatives, joined by "or"); `mark` (the place the objective is about - the
  window's; the HUD's marks keep the newest entry's target, section 6). A sheet's `tier` is the questlines' own.
- **The tools.** `tools/qlSheetDraft.mjs` (a script's resources, settable tasks, journal steps, rewards),
  `tools/qlCheck.mjs <Family>` (every sheet against its script; the family's set; its flagship branches),
  `tools/qlFormat.mjs` (one sheet a line), `tools/qlPatchKit.mjs` (the hand-in branch, below).

### 2.3 Branches (AS BUILT)

A branch is a choice in the player's own words that sets a task; its outcomes are the sheet's. Four patterns, each
quest's named in its sheet's family file:

- **A - the script already decides.** A `prompt` whose two sides end differently: the sheet names the tasks that tell
  the ends apart (N0B00Y09: `_S.12_` loyal, `_S.13_` double, `_S.11_` sold).
- **B - a prompt whose sides end alike.** The sheet's outcomes differ by what the choice cost (L0B50Y11: the
  information bought, or the mark found anyway).
- **C - the hand-in** (`tools/qlPatchKit.mjs`). Where the story holds no decision, the questor asks how the player
  takes their pay: the reward task waits for `_qlkeep_`; `_qlask_` asks when the reward task's own condition holds;
  `_qlaltpath_` is the other answer's ending - `ql paid` and the reward task's lines that end the quest, without its
  gold.
- **D - by hand**, where the reward task's trigger is not one `when` line (`toting`, `clicked npc`): three patches
  written as C's are (M0B21Y19, B0B50Y11, K0C01Y10, R0C11Y16, A0C01Y03, A0C01Y06, A0C01Y13, A0C41Y18, C0B00Y02,
  Q0C4XY04, P0B01L02).

A branch's patches are `src/systems/questlines/patches/<family>.json`, applied as the pack is read and ONLY while the
switch is on (`src/systems/questlines/qlPatches.js` questlineLines - the read the start's stamp follows, so a quest
begun with the switch off is DFU's script whole). Each patch is SHAM-TRAIL's law: exact text, exact count, a warning
and DFU's text on a mismatch. New messages are numbered from 1900 (QL_MESSAGE_BASE), new tasks are `_ql..._`.

THE QUESTLINES' ACTIONS (`src/systems/questlines/qlActions.js`), registered by the quest bridge after DFU's 82 and
Jagget's four, claiming no line of the shipped corpus (`test/systems/questlines/ql4_actions.test.js`):

- `ask <message> choices <message> _task_ <message> _task_ [...]` - two to four choices, each its own message; the one
  taken starts its task. Complete only on the answer: a box closed unanswered asks again, and a load under the
  question asks afresh.
- `outcome _name_` - the outcome a path reached, written where the script decides it (first one stands).
- `ql act <kind> <n>` - a trigger: true once the player has done `n` acts of `kind` since the task first asked (QL11).
- `ql paid` - the quest a success and its outcome's reward, without the QuestComplete box `give pc nothing` raises
  (that box is the script's words for the reward the player just turned down).
- `ql name _person_ <Given_Name>` - a questline giver by their own name (Ysolde Marnhel wrote the breach's book).

AS BUILT: the design's `ql reward` was not needed. GivePc's own moment reaches the layer for every reward a script pays
(`questReward`: the gold scaled by the outcome the quest's state holds then), and the outcome settles at the quest's
own `end quest` (`questEnding`, `src/systems/quest/quest.js` endQuest) - so a quest that pays before it ends (M0B00Y16
pays at the giant's death and ends at the merchant's rescue) pays by the outcome it ends on, and no script is patched to
move its reward. A letter handed over with `give pc` is not pay (the main quest's invitations). A quest a system ends in
its own place settles there too: the werewolf's cure closes `$CUREWER` (`machine.js` tombstoneQuest's `ended`).

### 2.4 What a quest keeps

Its save gains one port-only field, `ql` (`src/systems/questlines/qlState.js`): `{ stamp, tier, opened, done, failed,
choices, outcome, paid, moved, acts, offer }`. A quest started with the switch off carries `ql: null` for life. A
shared copy carries the party's progress (opened, done, failed, choices, outcome - merged monotonically on each resync)
and never the holder's reward (`paid`, `moved`, `acts` and `offer` are reset on receipt). The notebook files the
outcome's line under the quest's finished entry.

### 2.5 The pins

- `test/systems/questlines/ql1_layer.test.js` - the switch, the state, the bindings, the latches, the tier, the stamp,
  the bridge's layer through M0B00Y06.
- `test/systems/questlines/ql1_sheets.test.js` - the sets exact (248, and every questline step), each family's sheets
  naming only what their scripts have, the flagship 66 each with a branch whose outcomes pay differently.
- `test/systems/questlines/ql4_actions.test.js`, `test/systems/questlines/ql4_branches.test.js` - the actions, and a
  branch run through the real bridge: switch off DFU's script, the fee, the fee waived (quietly).
- `test/systems/questlines/ql11_acts.test.js` - the acts, swept both ways.
- `test/systems/questlines/ql12_lines.test.js`, `test/systems/questlines/ql12_ladders.test.js` - the questlines'
  scripts, their witnesses and the runner; the guilds' ladders.
- `test/ui/questlines/ql2_journal.test.js` - the window's parts, and the Quest Guide's objective news.
- `test/server/ql12_claim.test.js` - the service's claim.

## 3. The flagship 66

The rule (decision 3), computed from `QuestList-Classic.txt` and the scripts on 2026-10-19: a `prompt` (37), rank 4 or
above (20), one-time (22).

| Group | n | Quests |
|---|---|---|
| Nobility | 12 | R0C10Y00 R0C10Y01 R0C10Y02 R0C10Y18 R0C11Y03 R0C11Y16 R0C11Y19 R0C11Y26 R0C11Y28 R0C20Y22 R0C4XY23 R0C60Y24 |
| Commoners | 11 | A0C00Y10 A0C00Y14 A0C00Y15 A0C00Y17 A0C01Y01 A0C01Y03 A0C01Y06 A0C01Y09 A0C01Y13 A0C0XY04 A0C41Y18 |
| Knightly Orders | 9 | B0B40Y08 B0B40Y09 B0B50Y11 B0B60Y12 B0B70Y14 B0B70Y16 B0B71Y03 B0B80Y17 B0B81Y02 |
| Merchants | 7 | K0C00Y00 K0C00Y03 K0C00Y05 K0C00Y07 K0C01Y00 K0C01Y10 K0C30Y03 |
| Fighters Guild | 6 | M0B00Y16 M0B11Y18 M0B21Y19 M0B40Y05 M0B50Y09 M0B60Y10 |
| Mages Guild | 5 | N0B00Y09 N0B00Y17 N0B11Y18 N0B21Y14 N0B40Y07 |
| Dark Brotherhood | 4 | L0A01L00 L0B40Y04 L0B50Y11 L0B60Y10 |
| Thieves Guild | 4 | O0B00Y00 O0B00Y01 O0B00Y11 O0B10Y00 |
| Vampires | 4 | P0A01L00 P0B00L06 P0B01L02 P0B10L08 |
| Holy Orders | 3 | C0B00Y02 C0B3XY09 C0C00Y10 |
| Witches | 1 | Q0C4XY04 |

The Holy Orders and the Witches are thin by the rule; the Order of the Hour's questline (section 4.2) and the
summonings' sheets carry the temples and the covens further. Each wave (section 9) reads its family's flagship quests
and writes, for each, the branch its story holds: a `prompt` that already decides an end (N0B00Y09's, section 2.3)
becomes two named outcomes; a yes or no that does not, and a quest with neither, gets a branch written for it.

AS BUILT (QL4-QL10, every family's waves the same day): all 66 carry a branch whose outcomes pay differently - pinned
by `ql1_sheets.test.js`. Patterns (section 2.3) by count: A, the script's own choice, in most (every Thieves Guild and
Nobility smuggler's `prompt`, the Merchants' and Commoners' ambushes); C, the hand-in, in 17; D, by hand, in 11. Where
a branch's patch also MENDS a DFU script it is said in its family's file and in the Port-Ledger's QUESTLINES row:
B0B50Y11 (clicking the questgiver ended the quest a success without the ghost killed), K0C01Y00 (the victim's path
never set `_victory_`, so it never paid), B0B71Y03 (putting the child down now pays its honourable ending). The waves
also wrote down every DFU script they found odd and left as shipped (a dead end, a clock with no task, a bare-named
task); they are the QUESTLINES row's Ledger B list.

## 4. The questlines (AS BUILT - `src/systems/questlines/qlLines.js`, `qlLineRunner.js`, `quests/`)

Each line names its lore as `Elite-Gates.md` section 3 does: **canon** (UESP and Daggerfall's own data), and **the
port's own**, said so wherever it is said. A line is DATA (`qlLines.js` QL_LINES): its steps' quests and titles, its lead
and giver, its tier, and when it OPENS - a level, another line finished, online. Its steps are scripts on DFU's machine
(`src/systems/questlines/quests/<QUEST>.txt`, read by the one loader - `scenes/quest/questData.js`'s glob) with a sheet
each (`sheets/questlines.json`), stamped as every quest is. A step's title is its quest's DisplayName in English, the
pins holding the two to one word.

THE RUNNER (`qlLineRunner.js`, made by the layer): each tick after the machine's, a line whose gate holds begins and
its step's quest is scheduled; a step that ends well starts the next an hour of the character's time later
(STEP_GAP_S); one that ends badly is offered again a day later (RETRY_GAP_S) - a failure is never a dead end. The step's
quest is found by NAME, so a restart or a quest set aside is still the step. A line the service pays waits, offline,
where it stood. What the runner keeps rides the layer's save (the step, each step's outcome, when the next may start,
what the service answered).

GIVERS. A named giver is a Person of the script's own, named by `ql name` (DFU names a Person only from its name banks
or FACTION.TXT's individuals). A Person is made fresh in each step's quest, so the scripts say "the Master Conjurer"
and her name in the giver's own words rather than claim one body walks from quest to quest; the introductions' givers
are unnamed townsfolk where the feature lives.

### 4.1 THE DAGON CYCLE - three lines, one story (online)

The breach, the covens and the Spire are already one story in the shipped lore: Dagon's mortal faithful open the
breaches; "Dagon's covens hoard [the Weir Keys] in the deep places" (`Elite-Gates.md` section 3); the keys open the road
to the Spire's torn halls.

**I. THE BURNING DOORS** (`burningDoors`, tier 3, level 10). Ysolde Marnhel, Master Conjurer of the Mages Guild of Wayrest
- the author of *On the Burning Doors*, at a Mages Guild hall (`remote magery`).

| Step | What the player does | Witness |
|---|---|---|
| QLBD01 A Letter from Wayrest | a courier's letter; meet Ysolde | |
| QLBD02 The Faithful | find the coven in a dungeon, slay its Summoner, take the rite-book; read it (`read`, greater pay, the Guild -3) or bring it sealed (`sealed`, the Guild +5) | |
| QLBD03 Breaking the Rite | break the faithful's rite before a breach opens (`ql act rite-broken 1`) | rite |
| QLBD04 Through the Burning Door | close a breach (`ql act breach-closed 1`) - the line's title, Doorwarden | breach |
| QLBD05 The Caged Broker | why the faithful cage the Sigil Broker; the embers to the Guild (`guild`, named "Ysolde's Ember-Rod"), to the Order of the Hour (`order`, "Covenant Seal of the Hour") or to the Broker (`broker`, greater pay, "Broker's Dusk-Wing Mantle") | |

**II. THE COVENS' HOARD** (`covensHoard`, tier 3, after I). Ysolde again (AS BUILT: the design let the Order give it after
I's `order` ending; one giver keeps one voice, and the Order speaks in the Hour's line).

| Step | What the player does | Witness |
|---|---|---|
| QLCH01 Gold-Lit | slay three elite foes in Elite Dungeons (`ql act elite-foe-slain 3`) | |
| QLCH02 The Lieutenant | a coven lieutenant holds a Weir Key in a dungeon: slay them, take it (a quest item - a quest cannot mint the Spire's real key) | |
| QLCH03 What the Key Opens | keep it (`keep` - the service pays a real Weir Key, once an account) or hand it to the Order to be sealed (`seal`, greater pay, the Order +5, "Hourkeeper's Linen Signet") - the line's title, Covenbane | (key) |

**III. THE WEIR ROAD** (`weirRoad`, tier 4, after II). Corvane Tull, a Battlemage of the Spire's last class (the port's
own), in a tavern. Canon: Jagar Tharn gave the Spire to Dagon; the Imperial Secretary surrendered its portal keys.

| Step | What the player does | Witness |
|---|---|---|
| QLWR01 The Weir Gate | raise an Elite Breach and take a Redoubt (`ql act redoubt-taken 1`) | redoubt |
| QLWR02 The Torn Halls | take three Redoubts (`ql act redoubt-taken 3`) | redoubts3 |
| QLWR03 A Warrior Duke | take a Valkynaz's Redoubt (`ql act valkynaz-felled 1`) - the line's title, Weirwalker | valkynaz |
| QLWR04 The Battlemage's Account | what Corvane tells the Empire of the Secretary: the truth (`truth`, the Knights of the Dragon +5, "Oathkeeper's Dragon Helm") or the mercy he asks (`mercy`, greater pay, "Corvane's Spire-Blade") | |

AS BUILT against the design: the Annals step is gone (the Annals stay out of the journal by design, and the account's
`eg_annals` is no receipt with a time); the Last Spellmaster's Court is "three Redoubts" (a Redoubt's receipt does not
name its lord on every receipt - its `w` does say a Valkynaz's, every fifth Court: `net/eliteGates/egPay.js`
egValkRedoubt); QLBD02's "the next omen a quarter hour early" is gone (a script cannot move the gate's clock).

### 4.2 THE HOUR THAT WAS NOT (`hourThatWasNot`, tier 4, level 12, online)

Prior Anselm Vey of the Order of the Hour (`The_Order_of_the_Hour`, faction 93, at a `remote temple`). The design's
question - the temples' halls carry 92, The_Akatosh_Chantry, and Quests-Factions.txt pairs each temple with its order -
stands: the Prior is a guest of whatever temple the draw places him in, and his standing moves 93's.

| Step | What the player does | Witness |
|---|---|---|
| QLHR01 Brass at Dusk | the Order's letter: a wound in time under the Bay, brass where there should be stone; meet the Prior | |
| QLHR02 The Orrery of Endings | the Orrery's six stones are the powers that will claim the Bay: choose which the player will tell (two asks - Daggerfall, Sentinel, Wayrest, or another: Orsinium, the Underking, the Blades); break an Hour (`ql act hour-broken 1`); the told power's words, its standing, its named piece - the line's title, Witness of the Hour | hour |

AS BUILT: two steps, not four - the Orrery's turning and the envoy are this step's words, because a quest cannot read
which power the step before chose. It says nothing of which main-quest ending comes, and no line names 3E 417 (decision
5: the Hour is the echo of a Break still to come). Canon: the Numidium, the Mantella, Kagrenac, a Dragon Break, the Order
of the Hour is Akatosh's. The port's own: the Hour, its Orrery, its stones, its Remnant.

### 4.3 THE OLD COIL (`oldCoil`, tier 3, level 8, online)

Hamid al-Rasheen, a packet captain of Sentinel. Canon: Satakal, the Redguard World-Skin that sheds and devours itself;
Tall Papa and the Walkabout. The port's own: Sethrakul, the skin it shed, still swimming.

| Step | What the player does | Witness |
|---|---|---|
| QLOC01 The Sailors' Tale | meet Hamid; hear the tale | |
| QLOC02 The Packet Lanes | sail the lanes (`ql act port-reached 2`) | |
| QLOC03 The Shed Skin | slay the Sea Serpent (`ql act serpent-slain 1`); pour its blood to Satakal (`offering`, People of Sentinel +5, "Walkabout Charm") or keep its scale (`scale`, greater pay, "Sethrakul's Scale") - the line's title, Satakal's Witness | serpent |

### 4.4 THE GUILDS' LADDERS (`src/systems/questlines/qlLadders.js`)

Each guild the player is a member of shows under Questlines as its ladder: the classic list's member quests by the rank
that opens them, each rank a rung (reached, or still ahead), each quest struck once finished well (the layer's record
of what it saw finish, `history`, kept with its save) and marked where it holds a choice (a sheet with a branch). Read,
never kept: the membership book, the list's rows, the sheets.

### 4.5 THE FEATURES

**The acts** (`src/systems/questlines/qlActs.js`, QL11): a feature says what the player did in one line where it
happens - `noteAct('fish-caught')` - on the player's own client, once, when the act is finished and certain; every
running stamped quest hears it (an objective's `act` binding, a script's `ql act`). `test/systems/questlines/ql11_acts.test.js`
sweeps `src/` both ways and pins where each is said:

| Kind | Said where |
|---|---|
| fish-caught | Professions' net (`scenes/fishHost.js`), Foraging's net, Deep Waters' fish taken |
| herb-gathered, ore-mined, wood-chopped | the gathering hosts' answered harvest (`herbHost.js`, `mineHost.js`, `treeHost.js`); Foraging's Basket and Wood-Axe |
| piece-crafted | a station's craft minted (`net/profBook.js`) |
| gem-socketed, piece-reforged | the Reforge (`systems/reforge.js`) |
| gambit-won | The King's Gambit settled, the player's side won (`scenes/gambitTableGame.js`) |
| cards-won | a Hold'em pot or an Iliac hand won, offline and at the relay's tables |
| port-reached, cargo-delivered | the harbour office: a berth at another port after a quarter league under sail (PORT_VOYAGE_M); a delivery contract done (`scenes/harbourOffice.js`) |
| ship-struck | an enemy ship strikes to the player (`naval/navalHost.js`, one line) |
| raid-repelled | a raid the player fought, cleansed (`systems/raidingParties.js`) |
| arena-won | a ladder bout won (`scenes/arena/arenaBouts.js`) |
| revenant-knelt | a revenant yields (`systems/revenant/revenantFate.js`) |
| star-taken | the Firmament's stars the service now holds (`net/firmament/firmamentBook.js`) |
| rite-broken, breach-closed | a gate receipt counted (`net/gate/gateClaims.js`) - `rite`, or `r: 1`; `dealt` or `stood` |
| elite-foe-slain | an elite foe killed in an Elite-tier dungeon (`dungeonContext.js`, one line) |
| redoubt-taken, valkynaz-felled | a Redoubt receipt counted, Rehearsals excluded (`scenes/eliteGates/egClient.js`) |
| hour-broken, serpent-slain | their receipts counted (`sdClaims.js`, `serpentClaims.js`) |

AS BUILT: the design's "a wagon's load hauled (Merchant Yards)" is no act - nothing in the game finishes one (the
yards trade horses and wagons; the trade window's wagon button does nothing), so an objective bound to it could never
close. The road's introduction is DFU's own delivery instead. "A set's second bonus woken" waits for a producer too.

**The introductions** (online where their feature is): THE COURT CRAFTER (`introCrafts` - fish and plants, ore and
timber, a piece made; online: the Professions' harvests are the service's to answer), THE SMITH'S SECRETS (`introGear` -
a gem socketed, a piece reforged), THE HARBOURMASTER'S WORD (`introSea` - a port reached, a cargo delivered, a ship
struck), THE MERCHANT'S ROAD (`introRoad` - a load carried to a merchant and back), A SEAT AT THE TABLE (`introTables` -
a hand of cards, the King's Gambit), THE HERALD'S CALL (`introArena`), THE BAY'S TROUBLES (`introBay` - a raid driven
off, a revenant made to kneel), WRITTEN IN THE STARS (`introFirmament`). Two or three short steps each, an unnamed giver
in the player's town, a named piece at the end. The Tutorials explain; an introduction gives a reason to go, and pays.
No introduction for the groups that are the game itself (Getting Started, Combat, Your Character, Quests, Family).

**The work that is already work** - bounties, writs, harbour contracts, revenant errands, caravans - stays its own
system; the window's rail already holds its rows.

## 5. The rewards (AS BUILT - `src/systems/questlines/qlRewards.js`)

### 5.1 The tier

A quest's tier is read off what it already asks (`qlLaw.js` tierOf): rank 0-1 is tier 1, 2-3 tier 2, 4-5 tier 3, 6 and
above tier 4; a reputation-gated row by its band (20, 40, 60); a social quest and the main quest by the player's level
band (7, 14, 21); a questline's step by its line's own tier (its sheet's `tier`). Stamped at the start, for life.

### 5.2 What an outcome pays (the client's, as today)

- **Gold.** DFU's formula stays the base, times the outcome's pay (PAY_PROFILES): `standard` 1, `lesser` 0.75 (the
  merciful way: less coin, more standing - the sheet's), `greater` 1.25 and a rung up the gear's ladder (the harder
  way), `double` 1 (the script itself pays both sides), and three that add no gear - `betrayal` (the other side's coin,
  never the betrayed guild's piece), `own` (the script's own reward is the reward: a Prince's artifact, a cure) and
  `none` (a quest that ended unpaid). Scaled at GivePc's moment by the outcome the quest's state holds then.
- **A piece of gear, chosen.** An outcome that pays gear, on a quest that paid (its script's `give pc`, `ql paid`, or a
  success), offers REWARD_CHOICES (three) pieces - a weapon, an armour piece, a jewel - at the tier's floor
  (TIER_FLOORS: tier 1 Magic; tier 2 Magic, a quarter a rung up; tier 3 Rare; tier 4 Rare, 15% a rung up), fitted to the
  player (their armour's weight - `isForbiddenEquip` - and their two best weapon skills). Rolled through the dungeons'
  own producer (`gateSpoils.js` spoilsBase, `lootRarity.js` applyRarity), so the item law and the copy ledger read it
  as any piece; seeded by the quest's name, uid and start time (`rewardSeed`), so a reload never rolls again. The three wait in
  the Quests tab ("Rewards waiting", at most OFFERS_MAX - twelve) until one is taken; the one taken goes the reward's
  way (RW1's pile, the pack opened over it), the others are gone.
- **A named piece** (AS BUILT: the questlines' endings alone). A line's last step's outcome may name one of its three
  cards (`named: { name, kind }` - the card of that kind takes the name, once a character). The design offered a named
  piece to each flagship quest of DFU's as well; those keep the ladder's own names, because a DFU quest already names
  what it pays in its own words, and a hundred names of the port's over Daggerfall's quests is the "Daggerfall's words
  stay" decision broken. A named piece is rolled, not fixed: a fixed roll is Gilded's, held to its record by the wire
  (`gilded.js` validGildedMarks), and a quest's piece is held by the item law as every rolled piece is.
- **Standing, both ways.** An outcome moves every faction its sheet names (`standing`, -10 to 10 each - by
  Quests-Factions.txt name, read to its id) and the legal standing (`legal`), once, at the quest's end. Online the Roll
  bounds it as every quest's gain (`Chapters-Arc.md` 3.3).
- **Renown XP** stays `renownQuestXp`'s, unchanged.
- **The measure** (QL3's, owed). A quest pays ONE piece (one of three taken), at Magic or Rare - fewer than a dungeon
  of its tier drops in the time a quest takes, and the online wealth budget judges a character's gear as it judges
  every piece. The numbers of a played hour are owed to the first week of play (the Integrity arc's own measure,
  `realm_wealth_hours`), and TIER_FLOORS is the one constant to move.

### 5.3 What the service pays (only what it witnessed)

Silver, embers, Weir Keys, titles, auras and tavern cards are the account service's (`Wallet.md`, `Sigil-Sets.md`).
QL pays them through one module (`server-account/src/questlines.js`) and one route, `POST /v1/ql/claim {line, step}`:

- A step done in an endgame place pays only if the service holds that place's receipt for the character after the
  step was offered (`r1`, `h1`, `e1`, `l1`).
- A questline pays its title once a character, on its last witnessed step; its Weir Key (II.2) once an account.
- Nothing a classic quest does mints an account currency. A quest's silver, where an outcome pays any, is a capped claim
  of the Chapters' shape (3.3).
- Opened by `QUESTLINES_OPEN` (`off` | `dev` | `on`) in `server-account/wrangler.toml`, as every service feature is.

## 6. The window: one place (AS BUILT)

The pause window's Quests tab (`src/ui/enhanced/enhancedMenu.js` pauseQuests) is the one place, its questline parts one
module both faces draw from (`src/ui/questlines/qlJournal.js` - the Chronicle on L draws the same objectives block).
A window redesigned on purpose: it cites this page, not DFU (SCOPE1). The rail, in order:

- **Rewards waiting** - while any wait: each ended quest's three pieces, one press from its Take.
- **Main Quests**, **Side Quests** - as before; a stamped quest's page draws under its entry WHAT TO DO (its objectives
  as the machine opened them: done struck, failed crossed, optional marked, alternatives joined by "or"), YOUR
  CHOICES, HOW IT ENDED, and what finishing it pays (the tier's floor in words, read off TIER_FLOORS). A stamped quest
  whose objectives stand before its first journal entry is a row too (`unloggedRail`).
- **Questlines** - every line, the ones under way first, then those still to begin, the finished last; a line's page
  says what a questline is, its story and giver, its steps as the path walked (done, now, to come - "witnessed" on a
  step the service checks, with a press saying what that means), what it waits on ("Opens at level 10, online."), how
  it ended and the title it earns. Then each guild the player is a member of, as its LADDER (section 4.4).
- **Hidden**, **Abandoned**, **Archived** - as before; an archived entry carries its outcome's line.

The Quest Guide reads objectives (`src/ui/quest/questLens.js`): a view carries the objective asked now (the tracker's
card says it in place of the entry's opening) and the ones done (the herald's new news, "Objective done", ranked over a
routine entry). AS BUILT, two of the design's lines stand otherwise: the HUD's map marks keep the newest entry's target
(the Guide's honesty rules, W1 and W2, decide what a mark may reveal, and an objective's `mark` names a place the entry
already has); and L keeps landing on the Chronicle, whose Quests page draws the same objectives block - the tab is a
press away, and two doors to one module disagree about nothing. The design's "Work" page is the rail as it stands:
bounties, revenant hunts and Legacy's quests are already its rows (`questLog`'s widened walk).

The Tutorials' **Questlines** page (`src/systems/tutorialCatalogue.js`) pops the first time a quest with objectives
starts. Every string through `t()`, drafted in the thirteen languages the catalog requires.

## 7. The hosts, and where the code goes (AS BUILT)

- `src/systems/questlines/` - the law, pure: `qlState.js` (the save field), `qlLaw.js` (the switch, the stamp, the
  bindings, the latches, the tier), `qlSheets.js` + `sheets/`, `qlFamilies.js`, `qlPatches.js` + `patches/`,
  `qlActions.js`, `qlRewards.js`, `qlActs.js` (the acts feed), `qlLines.js` (the questlines), `qlLineRunner.js`,
  `qlLadders.js`, `qlLayer.js` (the layer the bridge makes), and `quests/` (the questlines' scripts).
- `src/scenes/quest/questBridge.js` - THE ONE CONSTRUCTION SEAM: it makes the layer over its machine, registers the
  actions and the acts' sink, and hands the window `questLog`'s `lines` and `ladders` and `journalClean`'s offers.
  `src/scenes/quest/questlineHost.js` is the account service's door it builds (an online page alone). The hosts
  carry one line each where nothing else knows the moment - the `ask` box's door (`world.js`, `exterior.js`), the
  cure's settle (`world.js`), and the acts no feature module hears (section 4.5) - `hostceiling.test.js` holding them.
- `src/ui/questlines/` - the window's parts; `enhancedMenu.js`, `enhancedChronicle.js`, `enhancedStyle.js` and
  `enhancedFrame.js` draw and dress them.
- `src/net/questlineClaims.js` - the claim's shared law; `server-account/src/questlines.js` - the claim
  (`POST /v1/ql/claim`); `server-account/migrations/0133_questlines.sql`.

## 8. Not changed

- DFU's machine and its 82 templates; the vendored scripts (patched as read, never edited).
- The classic skin's logbook, verbatim.
- Offline with the switch off: DFU's quests as DFU runs them - no stamp, no patch, no objective, no reward added.
- The main quest's story and its endings. It gains objectives and rewards, no branch, and stays refused for sharing.
- Every endgame place's rules, rates and drops.
- The Chapters, the bounty boards and the writs, each its own system.
- The Wallet's five currencies.

## 9. The slices (AS BUILT, 2026-10-19)

| Slice | What was built | Pins |
|---|---|---|
| **QL1 THE LAYER** | the switch (a Features row, forced on online), the stamp and its save field, the sheet and its law, the latches; the Fighters Guild's sheets as the proof; the tools | `ql1_layer`, `ql1_sheets` |
| **QL2 THE WINDOW** | the Quests tab's questline parts, the Questlines and ladders sections, the Guide's objective news, the Tutorials page, thirteen languages | `ql2_journal`, `ql12_ladders`, the Guide's suites |
| **QL3 THE REWARDS** | tiers, pay profiles, the choice of three, named pieces, standing both ways | `ql1_layer` |
| **QL4 THE BRANCHES** | `ask`, `outcome`, `ql act`, `ql paid`, `ql name`; the patches; the hand-in kit | `ql4_actions`, `ql4_branches` |
| **QL5-QL10 THE WAVES** | 248 sheets in fourteen families; the 66 flagship branches | `ql1_sheets` (the sets exact) |
| **QL11 THE ACTS** | the acts feed, its kinds and their producers | `ql11_acts` |
| **QL12-QL16 THE QUESTLINES** | the registry and runner; thirty-five scripts in thirteen lines; the service's claim and its titles and key; `QUESTLINES_OPEN` | `ql12_lines`, `ql12_claim` |

## 10. The owner's calls (taken at the record's defaults - "Develop this all")

1. **The questline's Weir Key** (II.3): once an account, to a player who keeps it, behind the Burning Doors witnessed
   whole (section 5.3).
2. **Who chooses in a shared quest**: the sharer - a choice is a task, and the copies take it on the resync
   (`qlState.js` mergeSharedState: the local choice first).
3. **A title a questline**: one each of the five lines the service pays (Doorwarden, Covenbane, Weirwalker, Witness of
   the Hour, Satakal's Witness). The introductions pay no title: nothing witnesses them.
4. **THE OLD COIL**: in (section 4.3).
5. **The givers' names**: proposed here - Ysolde Marnhel (already the breach book's author), Corvane Tull (the
   Battlemage), Prior Anselm Vey (the Order of the Hour), Hamid al-Rasheen (Sentinel's packet captain). The owner may
   rename any; each is one `ql name` line and one registry string.

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

**Status: QL0 DESIGNED 2026-10-19.** Nothing is built. Section 9 is the build order; section 10 holds the calls still
the owner's.

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
   - **The flagship set gets hand-written branches.** Its rule, read off the list and the scripts so it cannot drift by
     taste: every listed quest that asks the player a `prompt` (37), every quest offered at rank 4 or above (20), and
     every one-time quest (22) - 66 once the overlaps are counted (section 3). The owner adds any quest by name.
   - **Daggerfall's words stay.** A sheet's lines and a branch's text are the port's own words (`t()` keys, drafted in
     the thirteen languages); the script's own messages are not rewritten. A branch adds messages through a patch;
     it never replaces one.
4. **NO NEW CURRENCY** (the owner). Rewards are drawn from what the game already has: gold, silver (the service's),
   Deadlands Embers, Weir Keys, Welkynd Shards, Renown XP, standing, set pieces, named gear, titles and auras, tavern
   cards. The Wallet keeps its five.
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

### 2.2 The objective sheet

One sheet a quest, data the port writes (`systems/questlines/sheets/<family>.js`, one file a guild or group). M0B00Y06,
the Fighters Guild's wild beast in a citizen's house, as its sheet would read - the symbols are the script's own:

```js
{
  quest: 'M0B00Y06',
  tier: 1,                                    // section 5.1
  objectives: [
    { id: 'slay', text: ['ql.M0B00Y06.slay', 'Kill the beast loose in %house'], open: { started: true }, done: { task: '_mondead_' }, mark: '_house_' },
    { id: 'tell', text: ['ql.M0B00Y06.tell', 'Return to %qgiver for your pay'], open: { task: '_mondead_' }, done: { task: '_S.02_' } },
  ],
  branches: [],                               // section 2.3; the flagship set's
  outcomes: [
    { id: 'done', on: { task: '_S.02_' }, pay: 'standard' },   // section 5; `_S.02_` is the task that says `give pc _gold_`
  ],
}
```

- **What an objective may bind to** (`open`, `done`, `fail`): a task set or clear, a resource placed or found, an item
  held, a clock running or expired, a global variable, the quest ended. Each reads the machine's own state through
  `QuestLens` - no state of the layer's own decides what the player sees.
- **Shape.** Objectives are required unless `optional`; a `group` names objectives done in any order; `any` names
  alternatives, any one of which is enough ("Return the ring - or sell it to the fence").
- **The text** names resources with the machine's own macros, so `%dungeon` reads the place the script placed, in the
  player's language.
- **Drafted by a tool.** QL1's `qlSheetDraft.mjs` (under `tools/`) reads a script - its places, persons, items, foes, and the tasks
  that file a journal entry - and writes a first sheet to be read and corrected. 270 sheets are written by hand only
  where the draft is wrong.

### 2.3 Branches

Some flagship quests already branch, and their sheet only names the branch. N0B00Y09, the Mages Guild's scholar's
research: a Dark Brotherhood agent's letter asks for the paper instead, and `prompt 1014 yes _S.08_ no _nononono_`
decides who gets it. The script already has three ends: the paper brought to the Guild (`_S.12_`); the paper sold, and
the Brotherhood's forged copy handed to the Guild as well, paid twice (`_S.10_`, then `_S.13_`); or the paper sold
and the quest over (`_S.11_` - which of the last two is DFU's `pick one of`, a draw). All three end through `_reward_`
or beside it, so an outcome bound to `_reward_` would read the double-dealer as loyal: a sheet binds the task that
tells the ends apart. Under QL each is an outcome of its own, with its own standing - for example:

```js
branches: [{ id: 'research', choices: [
  { id: 'brotherhood', text: ['ql.N0B00Y09.db',    'Give the research to the Dark Brotherhood'], sets: '_S.08_' },
  { id: 'guild',       text: ['ql.N0B00Y09.guild', 'Bring the research to the Guild'],          sets: '_nononono_' },
]}],
outcomes: [
  { id: 'loyal',  on: { task: '_S.12_' }, pay: 'standard',    standing: { The_Mages_Guild: +5 } },
  { id: 'double', on: { task: '_S.13_' }, pay: 'double',      standing: { The_Dark_Brotherhood: +5 } },
  { id: 'sold',   on: { task: '_S.11_' }, pay: 'brotherhood', standing: { The_Dark_Brotherhood: +5, The_Mages_Guild: -5 } },
],
```

Where a flagship quest has no branch, the wave writes one as a patch (`questPatches.js`'s law: exact text, exact count, a
throw on a mismatch) that adds what the choice needs, and the sheet names it.

QL adds three actions to the machine, registered beside the extension's (`systems/questlines/qlActions.js`):

- `ask <message> choices <message> _task_ <message> _task_ ...` - two to four choices in talk; the one taken sets its
  task. DFU's `prompt` is its two-choice case and stays as it is.
- `outcome _name_` - marks the outcome a path reached, for the reward layer and the window.
- `ql reward` - stands where a script says `give pc _gold_`, and pays the outcome (section 5). A script that pays
  before its end (DFU's list calls it the "reward bug") is patched to pay here.

A branch's new tasks are named `_ql_..._`, so no script's own symbol is ever shadowed, and a quest saved before the
patch keeps the actions it was saved with (`task.js` restores them whole), as SHAM-TRAIL's reveal does.

### 2.4 What a quest keeps

Its save gains one port-only field beside `shareId` and `instanceEpoch`: `ql: { stamp: 1, choices: { fate: 'spare' },
outcome: 'mercy', paid: true }`. The machine saves and restores it as data; the layer reads it. The notebook's
finished entry (`finishedQuestEntries`) gains the outcome's line.

### 2.5 The pins

- **Every objective is reachable.** A scripted run of each quest (the corpus harness `auditquests_linkage.test.js`
  already drives) opens and closes every objective its sheet names, and every outcome is reached by some path.
- **A sheet names only what its script has.** Every task, resource and message a sheet binds to exists in its script
  after the patches; a sheet for a quest no path offers fails.
- **The sets are exact.** The sheet set is the reachable set (270); the flagship set is the rule's (66).
- **The stamp is kept.** A quest started under one value of the switch reads the same after the switch changes.
- Each pin mutation-checked (A PIN MUST FAIL); the records in `tools/mutants/`.

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

## 4. The questlines

Each line names its lore as `Elite-Gates.md` section 3 does: **canon** (UESP and Daggerfall's own data), and **the
port's own**, said so wherever it is said. A line's quests are scripts on the machine (decision 2), their text in
`systems/questlines/quests/` and read by the one loader. A questline's step done in an endgame place is witnessed by
that place's receipt (section 5.3).

### 4.1 THE DAGON CYCLE - three lines, one story (Dagon's Breach, Elite Dungeons, the Elite Breach)

The breach, the covens and the Spire are already one story in the shipped lore: Dagon's mortal faithful open the
breaches; "Dagon's covens hoard [the Weir Keys] in the deep places, which is why the hardest dungeons give them up
likeliest" (`Elite-Gates.md` section 3); the keys open the road to the Spire's torn halls. The Cycle walks it in order.

**I. THE BURNING DOORS** (Dagon's Breach). Giver: Ysolde Marnhel, Master Conjurer of the Mages Guild of Wayrest -
already the author of the game's one breach book, already the one who sends it.

1. *A Letter from Wayrest* - the courier who brings *On the Burning Doors* now brings a letter too: with the first
   ember, the first omen seen, or at level 10, whichever is first. Objective: speak with Ysolde in Wayrest.
2. *The Faithful* - a coven of Dagon's Faithful in a dungeon near the player (a remote dungeon, as any guild quest's).
   Objectives: find the coven; slay its Summoner; take the rite-book. Branch: read the rite-book (the next breach's
   omen rings on the map a quarter hour early, this once) or bring it sealed (Mages Guild standing).
3. *Breaking the Rite* - at a breach's omen, slay the Summoner before the opening. Witnessed: the gate's receipt
   already records the rite broken.
4. *Through the Burning Door* - close a breach. Witnessed: `r1`.
5. *The Caged Broker* - free the Sigil Broker (every one of the faithful slain before the opening - the condition that
   frees her today) and hear why they cage her. Branch, the line's outcome: the embers the player has carried go to
   the Mages Guild for study (Ysolde; Mages Guild standing, a named staff), to the Order of the Hour, keepers of the
   Covenant (the temple's standing, a blessing), or to the Broker (her standing, a Dagon's Brand piece).
   - A player who has done Dagon's own summoning (`Y0C00Y00`, his day, his Razor) hears a line of Ysolde's for it;
     the summoning stays the summoning.
   - Canon: Dagon's summoning day; the Covenant of Akatosh and Alessia; the Dragonfires; Dagon gave the Dark Seducers
     their wings (`Elite-Gates.md` section 3). The port's own: the faithful's rite, the breach, Valkynaz Ruhn, and why
     the Broker - a Seducer whose wings are Dagon's gift - sells his sigils to his enemies, which is why his faithful
     cage her.

**II. THE COVENS' HOARD** (Elite Dungeons). Giver: Ysolde again, or the Order of the Hour, by I's outcome.

1. *Gold-Lit* - the covens' champions glow gold (`eliteFoes.js`). Objective: slay three elite foes in Elite Dungeons.
2. *The Lieutenant* - a named coven lieutenant holds a key in an Elite Dungeon of the player's own (an instance,
   `Instances.md`, at the Elite tier). Objectives: find him; slay him; take the key. The key is a Weir Key paid by the
   service once an account (section 5.3, and section 10).
3. *What the Key Opens* - bring it to the giver. Objective: speak with them. Branch: keep the key (it is the player's,
   as any Weir Key) or hand it to the Order to be sealed (no key - the Order's standing, and a named piece in its
   place).
   - Canon: the Spire's portal keys, surrendered by the Imperial Secretary in 3E 398. The port's own: the covens'
     hoard, the lieutenant.

**III. THE WEIR ROAD** (the Elite Breach). Giver: a Battlemage of the Spire's last class, living out 3E 398 in the Bay
(the port's own, named in QL13).

1. *The Weir Gate* - raise an Elite Breach and take its first Court. Witnessed: `e1` (the first Redoubt).
2. *The Annals* - find three of the thirty Annals in the torn halls (the account's own `eg_annals`; the Annals stay out
   of the journal, the objective only counts them).
3. *The Last Spellmaster* - take the Court of a raised master of the Spire's council. Witnessed: `e1`.
4. *A Warrior Duke* - take a Valkynaz Redoubt. Witnessed: `e1`. Branch, the line's outcome: what the Battlemage tells
   the Empire of the Secretary who surrendered the keys - the truth (a Knightly Order's standing) or the mercy he
   asks for (his last gift, a named piece).
   - Canon: Jagar Tharn gave the Spire to Dagon; Imago Storm's legions; the Secretary's surrender; the apprentice; the
     Kyn's ranks. The port's own: the torn halls, the Kyn's proving ground, the Battlemage.

### 4.2 THE HOUR THAT WAS NOT (the Abyss Dungeon)

Giver: **the Order of the Hour** - Akatosh's own temple in the Bay (`Quests-Factions.txt` names it
`The_Order_of_the_Hour`; `quest/person.js` `_ofQuestGuild` reads Akatosh's temples as it), the god of time, whose
Covenant the breaches already break. The two give it different faction ids (93 and 92); QL14 reads which one the
temples' halls carry before a line of it is written. Its priests feel the Hour as a wound in
time. Offered once the main quest's letter has reached the player (`_BRISIEN`), so the Blades are a name they know.

1. *Brass at Dusk* - a priest asks after the tavern talk (`sdOmen.js`'s rumours). Objective: find an Abyss Dungeon's
   door (the hub's record of the Hollows open).
2. *The Orrery of Endings* - reach the Orrery and turn it. Objective: the Hour's first stage done.
3. *Six Futures* - the Orrery's six stones are the powers that will claim the Bay (Daggerfall, Sentinel, Wayrest,
   Orsinium, the Underking, the Blades). Branch, the line's outcome: which power the player tells. Each tells it
   differently, pays its own named piece and moves its own standing. It ends no main quest and says nothing of
   which ending comes.
4. *The Brass Remnant* - break an Hour. Witnessed: `h1`. The Remnant's Mantella-heart is the Hour's; the told power's
   envoy names what the player saw.
   - Canon: the Numidium and the Mantella; Kagrenac; the Warp in the West of 3E 417, a Dragon Break; the Order of the
     Hour, Akatosh's. The port's own: the Hour, its Orrery and Remnant, and (decision 5) its reading as the Break's echo.

### 4.3 THE OLD COIL (the Sea Serpent) - proposed

A short line from Sentinel's sailors: Satakal, the Redguard World-Skin, and Sethrakul, the skin it shed. Three
quests: the sailors' tale, a voyage to the packet lanes, a serpent slain (witnessed: `l1`). Section 10.

### 4.4 THE GUILDS' LADDERS

A guild's own quests are already a story told by rank. Each guild and order a player has joined shows in the window as
a questline whose quests are its own, by rank, with its promotions as milestones and its flagship quests marked. No new
content: it is how the window reads what the machine and the Roll already hold.

### 4.5 THE FEATURES

The owner's fourth: "Tying all our newly integrated features into quests". Three ways in.

- **Acts an objective can bind to.** A feature says what a player did in one line (`questlineActs.note(kind, detail)`,
  as a system says `noteFirstUse(id)` for the Tutorials), and an objective can ask for it: a fish caught and a herb
  gathered (Professions, Foraging), a piece crafted at a station, a socket filled, a piece reforged, a King's Gambit
  or an Iliac hand won, a port reached and a cargo delivered (Come Sail Away, harbour contracts), a ship made to strike
  her colours, a wagon's load hauled (Merchant Yards), a town's raid driven off, a star taken on the Firmament, a set's
  second bonus woken, an Arena tier won, a revenant made to kneel. A test sweeps the kinds as the Tutorials' sweep does:
  every kind has its producer, and every producer's kind is read.
- **Introductions.** A short line - two to four quests - for each of the Tutorials' groups (`tutorialCatalogue.js`),
  from a giver where the feature lives: the harbourmaster for the sea, the stable master for the horse and the wagon,
  a tavern regular for the cards and the King's Gambit, the Arena's Herald, a Court crafter for the professions. The
  Tutorials stay what they are - they explain; an introduction gives a reason to go, and pays for it.
- **Inside the flagship quests.** Where a flagship quest's story allows, a branch may be a feature: a Merchants'
  delivery carried by sea or by wagon for a better outcome, a Thieves Guild fence who pays by the town's Prosperity.
- **The work that is already work** - bounties, Notice Board writs, harbour contracts, revenant errands, caravans,
  hall writs - stays its own system, and the window shows it (section 6).

## 5. The rewards

### 5.1 The tier

A quest's tier is read off what it already asks: rank 0-1 is tier 1, 2-3 tier 2, 4-5 tier 3, 6 and above tier 4; a
reputation-gated row by its band; a social quest by the player's level band; a questline quest by its line's place.

### 5.2 What an outcome pays (the client's, as today)

- **Gold.** DFU's formula stays the base, times the outcome's factor (from 0.75 to 1.5; the merciful way may pay less
  and win more standing).
- **A piece of gear, chosen.** Each outcome offers three pieces from the Loot ladder at the tier's floor (tier 1 Magic,
  tier 2 Magic with a Rare chance, tier 3 Rare, tier 4 Rare with a Legendary chance), fitted to the player - their
  armour's weight, their weapons' skills - and the player keeps one. Rolled through the same producer as a dungeon's
  loot (TEST THE SHAPE THE PRODUCER MINTS), so the item law and the copy ledger read it as any piece; seeded by the
  quest's uid and the outcome, so a reload never rolls again. It lands in the reward pile (RW1) and the Loot Banner
  shows it.
- **Named pieces.** Each flagship quest and each questline outcome may name one piece of its own (a fixed roll, as
  Gilded's are), once a character.
- **Standing, both ways.** An outcome moves the standing of every side its branch touched - the house betrayed loses
  what the house served gains. Online through the Roll, inside the claim's cap.
- **Renown XP**, as `renownQuestXp` pays now, by tier.
- **Measured before it ships.** QL3 measures gear a played hour from quests against a dungeon of the same tier and holds
  the quests under it; the outcome factor and the floors are its constants, and the page records the measure.

### 5.3 What the service pays (only what it witnessed)

Silver, embers, Weir Keys, titles, auras and tavern cards are the account service's (`Wallet.md`, `Sigil-Sets.md`).
QL pays them through one module (`server-account/src/questlines.js`) and one route, `POST /v1/ql/claim {line, step}`:

- A step done in an endgame place pays only if the service holds that place's receipt for the character after the
  step was offered (`r1`, `h1`, `e1`, `l1`).
- A questline pays its title once a character, on its last witnessed step; its Weir Key (II.2) once an account.
- Nothing a classic quest does mints an account currency. A quest's silver, where an outcome pays any, is a capped claim
  of the Chapters' shape (3.3).
- Opened by `QUESTLINES_OPEN` (`off` | `dev` | `on`) in `server-account/wrangler.toml`, as every service feature is.

## 6. The window: one place

The pause window's Quests tab, rebuilt on the journal bones (a rail of pages, the chosen page beside it, as Growth,
Holdings, Family and Tutorials are). A window redesigned on purpose: it cites this page, not DFU (SCOPE1).

- **Questlines** - each line the player has begun or can begin: its quests as steps, the one under way, the next and
  what opens it, the branches taken drawn as the path walked. The guilds' ladders (4.4) sit here.
- **Active** - each quest under way: its giver, its objectives (done struck, optional marked, alternatives joined by
  "or"), the outcome's reward shown before it is chosen - its tier, "choose one of three", any named piece.
- **Work** - bounties, writs, contracts, errands, caravans: what is under way, from the log seam the streaming host
  already widens.
- **Done** - each finished quest with its outcome and what it paid.

The Quest Guide reads objectives: the tracker shows the current one, the herald announces one opened or done, the map
marks bind to the objective's `mark`. L lands on the tab on Enhanced Plus and DFO Grimoire (`mountEnhancedMenu`'s
pause landing); the Chronicle keeps Notes, Messages, History and People, and its Quests page hands over to the tab
(one word, one thing). On the classic skin, L is DFU's logbook as ever, and the pause door opens the tab
(`ui/pauseDoor.js`, as Growth and the mail do).

Plain words (`10-UI/Plain-Words.md`): the tab says what a questline, an objective and an outcome are, on the tab; every
number from the constant that enforces it; a press explains what a hover does. Every string through `t()`. A Tutorials
page ("Questlines"), met the first time a quest is stamped.

## 7. The hosts, and where the code goes

- `src/systems/questlines/` - the law: sheets, the evaluator over `QuestLens`, branches, outcomes, tiers, rewards;
  `qlActions.js`; `quests/` (the questlines' scripts); `questlineActs.js` (the acts feed). Pure and tested alone.
- `scenes/quest/questlineHost.js` - the one seam the hosts wire, the `fishHost.js` shape: it owns its state and
  frame, the host constructs it once. THE FOUR HOSTS: `world.js` and `worldModes.js` and `dungeonContext.js` wire it
  (each runs quests); `exterior.js`, the fixed city, wires the objectives and is named FLAGGED for the endgame lines
  (no streamer, no endgame place).
- `src/ui/questlines/` - the tab, mounted lazily through `mountEnhancedChunk`, dressed by `enhancedFrame.js`'s roles.
- `server-account/src/questlines.js` - the claim. No relay arm: every witness QL needs is a receipt the service holds.

## 8. Not changed

- DFU's machine and its 82 templates; the vendored scripts (patched as read, never edited).
- The classic skin's logbook, verbatim.
- Offline with the switch off: DFU's quests as DFU runs them.
- The main quest's story and its endings. It gains objectives and rewards, no branch, and stays refused for sharing.
- Every endgame place's rules, rates and drops. No questline makes a rare drop certain (section 10 asks about the one
  Weir Key).
- The Chapters, the bounty boards and the writs, each its own system.
- The Wallet's five currencies.

## 9. The slices

| Slice | What | Pins |
|---|---|---|
| **QL1 THE LAYER** | the sheet, the evaluator over `QuestLens`, the stamp and its save field, the Features row and its lock online; the Fighters Guild's 20 sheets as the proof; the sheet's draft tool; Port-Ledger A row (decision 6) | reachable, names-only-what-it-has, the stamp kept, OL1 answered |
| **QL2 THE WINDOW** | the Quests tab's four pages; L's landing; the Guide reading objectives; the Tutorials page; thirteen languages | the walk's one source; plain words; the l10n ratchet |
| **QL3 THE REWARDS** | tiers, outcome factors, the choice of three, named pieces, standing both ways; the measure | the producer's shape; the seeded roll; the measure's bound |
| **QL4 THE BRANCHES** | `ask`, `outcome`, `ql reward`; the party's rule; the Fighters Guild's 6 flagship quests | every outcome reached; a shared choice taken by every copy |
| **QL5-QL10 THE WAVES** | sheets and rewards for every quest, and branches for the flagship set, by family: Knightly Orders; Mages Guild, Witches and the summonings; Thieves Guild, Dark Brotherhood, Vampires and the cures; Holy Orders; Nobility, Merchants and Commoners; the main quest and the mods | the sets exact (270, 66) when QL10 lands |
| **QL11 THE ACTS** | the acts feed and its kinds | every kind produced and read |
| **QL12 THE BURNING DOORS** | the line; `/v1/ql/claim`; `QUESTLINES_OPEN` | the claim pays only against a receipt |
| **QL13 THE COVENS' HOARD and THE WEIR ROAD** | the Cycle's second and third lines | the key once an account |
| **QL14 THE HOUR THAT WAS NOT** | the Abyss line | |
| **QL15 THE INTRODUCTIONS** | a line for each Tutorials group | |
| **QL16 THE OLD COIL** | if the owner takes it | |

Each slice ships its own pins and its record here; an audit follows the slices it reads, as the house does.

**Scale, honestly.** 270 sheets of three to six lines, 66 branches, eight questlines and their givers' words, all in
thirteen languages. The waves are the bulk of it, and each is a slice of its own.

## 10. The owner's calls - open

1. **The questline's Weir Key** (II.2): once an account, as designed - or none, the line pointing the player at the
   lieutenant's ordinary drop chance instead?
2. **Who chooses in a shared quest**: the sharer, as designed - or each copy its own (the copies then end differently
   for different mates)?
3. **A title a questline**, paid by the service on the last witnessed step - or the existing titles only?
4. **THE OLD COIL** (4.3) - in, or not now?
5. **The givers' names** that are the port's own (the Battlemage of III, the Order's priest, the coven lieutenant) -
   the owner's to name, or QL's slices to propose.

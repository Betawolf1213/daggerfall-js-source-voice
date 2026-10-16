# AUDIT GUILD-WORDS (2026-10-16) - the guild system's words, audited: SEAT-LINE, SEAT-WORDS and STANDING-WORDS

Mac, of the two slices that made the online guild system say what it does (`01-Overview/Field-Bugs-2026-10-15c.md`:
SEAT-LINE at b0979d15, SEAT-WORDS and STANDING-WORDS at e66827ac): **"Lets audit everything"**. This page is the audit
of both - the law they read, the online pipeline that says the standing, every word in English and in the thirteen
whole languages, the tests and the mutants, the records - and of the one report the first record left open (report 3,
a Mages Guild quest's -25). Each finding has its verdict here; what it changed is written into the pages it touched,
marked `AUDIT GUILD-WORDS` with the finding's id, and in the code each fix carries the same mark.

## How it was run

Six lanes, each a cold adversarial reader of a FROZEN head (e66827ac, a detached worktree - Home.md's DO NOT FIX WHILE
THE VERIFIER IS READING), told to reproduce a finding before reporting it and to end on what it checked and found sound:

| Lane | Over | How |
|---|---|---|
| L1 | the law: `guilds.js` rankNeeds/reviewDaysLeft/updateRank, `guildServiceFlow.js` serviceAccess/rankNeedsLines/probationWords, `knightlyGifts.js`, `affiliations.js`, the hosts' lines | 7 findings, each through the real modules in node |
| L2 | the online pipeline: `npcRollTracker.js`, `standingOwed.js`, `rollNoticeHost.js`, world.js's wiring, the service's answers (`server-account/src/npcRoll.js`) | 7 findings, simulated over the real tracker with an io applying the real `rollCredit`/`rollDrain` |
| L3 | is every word true: the 20 English strings against the law, and the records | 13 findings |
| L4 | the translations: 20 keys x 13 languages - placeholders, CLDR plurals, meaning, each file's own terms and register, the tutorial pages' fit | 23 findings; 260 rows checked by script, every plural rendered |
| L5 | the tests and mutants: 35 new one-site mutants beyond the 37 recorded, fixtures against their producers, loose pins | 17 survivors, 8 findings |
| L6 | report 3, fresh: any path that drops the Mages Guild 25 or holds it at -20 | the cause found; one service defect |

Besides the lanes, the touched modules' own campaigns were run again on the changed tree (594 dead, 8 equivalent as
recorded, none survived). 65 findings came back - L1 7, L2 7, L3 13, L4 23, L5 8, and L6's cause, its service defect
and five false claims in the first record; each was verified against the code before anything was fixed. All are fixed
but two RECORDED (L1-3's law, L2-6).

## What it found, and what was done

**Report 3 - found (L6).** The Mages Guild offers its quests by the player's LEVEL, not the guild rank (`offerFlow.js`:
`if (guild.isSatisfyQuestReqByLevel?.() && level > rank) rank = level;` - DFU's `MagesGuild.cs` override), so a new
apprentice of level 1 is offered "Guard the Guild" (N0B10Y03, minReq 1) and at level 2 "Protect an Honored Mage"
(N0B20Y02). Guard the Guild places a magic item in the hall and costs `change repute with _qgiver_ by -30` when it is
taken outside the guard's window (GUARD-ONLINE: closed the first fifty real seconds, open five minutes, closed again);
the questor `_qgiver_` is MG_Quests (63), and a propagating change reaches the guild whole (the tree's root and a
questor take the full amount - `factionRep.js` propagateReputationChange). -30 against a +5 earned before reads -25;
two later successes leave -20, under rank 1's 10 - the report, to the point. The first record's "not found" read only
the rank-0 quests and the questor's share as half; it is corrected there. FIXED, Mac's call (asked of three shapes -
waive own-guild losses, gate the two quests on reputation, keep the scripts): **"Waive own-guild losses"** - QSCRIPT-FREE
below. L6's service defect (a join recorded only on the standing after the claim) - FIXED.

**QSCRIPT-FREE - online, a quest's script costs nothing with the guild that gave it** (`quest/actions.js`
ChangeReputeWith, `ownGuildLoss`). QFAIL-FREE spared the quest END's -2; a script's own loss to the quest's guild is
spared now too: a negative `change repute with` whose target is the quest's guild questor, or a faction whose root is the
same guild as the quest's (`factionRep.js` factionRootOf - ChangeReputation's own walk, extracted as one law and read by
both). A loss to any other faction, every gain, and the whole of it offline stay DFU's. Port-Ledger A;
`06-Systems/Standing-Arc.md`.

| Id | Finding | Verdict |
|---|---|---|
| L1-1 | The seat's refusal fired only at exactly rank 7; a member at 0-6 asking for Teleport still got 3100's promise of a review that never reaches 8 online | FIXED: serviceAccess says the seat whenever no rank up to the ceiling opens the service and a seat's does |
| L1-2 | The review's demotion went unsaid - the record's own "Reputation 62 of 80" at rank 7 is a demotion to 6 at the next review; a mended probation that also demotes said only "it ends" | FIXED: `guilds.js` reviewedRank (updateRank's own computation, one law) and `guildServiceFlow.js` reviewWarnings - "Your next review lowers you to Warlock: Wizard needs reputation 70." first in the hall's line and under the guild on the Standing page |
| L1-3 | A probation whose guild skills fail rank 0's bars (Roleplay & Realism's underworld join) never ends at 0; a guild that never expels ends one at any standing - both said "at 0 or more it ends" | FIXED in the words (probationWords' kinds: 'skills', 'ends'). RECORDED for Mac: REP6 puts a member on probation for any failed review, the skills' included |
| L1-4 | The probation's words vanished where no next rank is (a seat's own hall, a stopped Roll's rank 9) | FIXED: the warnings come before the next rank and stand alone |
| L1-5 | A seat's services are its own chapter's halls', for a member at 7 (seatedBook); nothing said so | FIXED: the refusal and the guide say it |
| L1-6 | "rises at most 15 a day" - writs and receipts credit beyond the claims' pace | FIXED: "Quests raise it at most 15 a real day", "Beyond that pace, a hall writ adds 2..."; the owed's note "at most 15 a real day" |
| L1-7 | "at your review in N days" - the review is the first hall visit from N days on; "here" on the Standing page; the renewal unsaid | FIXED: "your review is at the guild's hall in 8 days or later. Below -10 you are expelled there, below 0 it runs 28 days more, and at 0 or more it ends." |
| L2-1 | The owed a login's first read paid was never said - the first word compared with nothing | FIXED: the kept adoption keeps the owed (`rollKeptOf` reads it), and the first word is compared with the kept adoption the Roll still stands at - "The Mages Guild: 10 of what was owed arrived (now 50)" |
| L2-2 | A loss the owed absorbed was never said, and a larger one was said short (-25 as -20) | FIXED: `npcChapterLaw.js` rollMovesOf - a move is the standing and the owed together; where only the owed turned to standing, `paid` |
| L2-3 | DFU's drift and REP4's recovery made a line of up to twenty-two names | FIXED: the guilds the character belongs to are named, the rest counted ("and 2 other guilds") |
| L2-4 | "now" included a gain not yet claimed | FIXED: the Roll's word |
| L2-5 | A reseed made a second first word | FIXED: once a page |
| L2-6 | A capped gain is said twice - the chat's line and the strip's "rises no further today" (English, `rollCeilingLine`) | RECORDED: kept - the strip says why, the chat how much; the strip line is AUDIT CHAP D2's, not these slices' |
| L2-7 | A line of several guilds hard to read | FIXED: "The Mages Guild +5 (now 35), Fighters Guild -25 (now -20)" |
| L3-1 | "a failed quest costs nothing" - a quest's script still cost standing online (N0B10Y03's -30, N0B20Y02's -60) | FIXED by QSCRIPT-FREE (Mac's call) and the words: "no quest costs you standing with the guild that gave it" |
| L3-2 | = L1-6 | FIXED |
| L3-3 | = L1-5, and a seat's rank lifts only a book at 7 | FIXED |
| L3-4 | "days" and "weeks" meant two clocks - the seats' and the pace's are real (UTC), the probation's the character's | FIXED: "real days", "a real day", "each Sunday's Turning" |
| L3-5 | A receipt's 1 understated - 2 more for the day's first where the chapter asks it | FIXED |
| L3-6 | = L1-7 | FIXED |
| L3-7 | "Every number is the law's own constant" - 8 and 9 were literals in three strings | FIXED: `SEAT_RANK` handed in |
| L3-8 | "Offline nothing changes" - the probation's words and the tutorial show offline | FIXED in the record |
| L3-9 | Report 3's movers left out REP4's recovery | FIXED in the record |
| L3-10 | "every standing a quest or a crime moves is said" overclaimed | FIXED in the record: the twenty-two, online, as the Roll takes them |
| L3-11 | PINS MOVED incomplete; plainui's Testing.md row stale | FIXED |
| L3-12 | A stale sentence amended, not deleted (`Field-Bugs-2026-10-15.md`) | FIXED: rewritten |
| L3-13 | "(E2 above)" | FIXED: below |
| L4-1-L4-23 | fr and bg in the informal you where their files are formal; da's and ro's chapter word not the file's (kapitel, filială); garbled seat lines in cs, de, fr; the realm, hall writ, standing, Master, quest and online words not each file's own; agreement with an arbitrary {owed}; a Korean particle; a French pronoun on the wrong noun; Russian idiom; da/nb articles | FIXED: all 28 keys redrafted in the thirteen languages against each glossary and file - placeholders and plurals checked by the pipeline's `checkDraft`, the tutorial pages measured in every language (at most 12 rows of 16) |
| L5-1 | The standing's door was never tested saying anything (4 survivors) | FIXED: the door said, a quiet answer silent, the entity's name, the first-word gate |
| L5-2 | The membership fixture was a flat book the game never mints | FIXED: built through `activeMemberships` and `joinGuild` (TEST THE SHAPE THE PRODUCER MINTS) |
| L5-3 | The tracker's fixture answered one faction, no first owed, no fall (4 survivors) | FIXED: all twenty-two, the first word's owed, a reward with its owed, a loss the owed absorbed |
| L5-4 | The seat line's owed, probation and the 80's boundary untested (3 survivors) | FIXED |
| L5-5 | The Standing page's notes pinned by a source prefix (2 survivors) | FIXED: the page rendered |
| L5-6 | The streets' wiring pins passed with a door of the host's own after the module's | FIXED: the call sliced, no `onCapped:`/`onStanding:` after the spread |
| L5-7 | The house test built a Mages Guild row and a hand-set flag | FIXED: an order's row (`orderOf('Dragon')`), `claimHouse` |
| L5-8 | The record's examples pointed at untested arms | FIXED with L5-1, L5-4 |
| L6 | Report 3's cause; the join recorded on the standing after the claim alone (a join at 0 and a quest's loss in the same minute left a member off the Roll, and off its own writ); five false claims in the first record's report 3 (the rank-0 quest set, the rank gate, the questor's half, "none is 25", the drift's interval, a donation's and a raid's reach) | FIXED: QSCRIPT-FREE; `server-account/src/npcRoll.js` judges the join on the standing before the claim's lines or after them; the record's section rewritten |

## Pins

`test/fb1015c_guildwords.test.js` (15, rewritten) and `tools/mutants/fb1015c_guildwords.json` (72); the join's
`test/chap2_halls.test.js` (17 - one added, and its "a member stays" pin taken below the floor both sides of a claim,
which the join's new reading would otherwise let CHAP2-MEMBER-STAYS live through). PINS MOVED: `fb1015c_seatline`
(the seat line at 72, the real days), `fb1015_promonow` and `fb1015c_seatline`'s host pins (the review's book),
`guildrep`'s book (`warnings`), `audit_chap1`'s kept record (its owed). Mutants re-aimed: ACHAP-C1-KEPT, -SEQ, -KEEP,
AUDIT-CHAP2-S7-OWED-JOIN, CHAP2-JOIN, CHAP2-MEMBER-STAYS, CHAP4B-CEILING, CHAP4B-CEILING-DEMOTES and
SEAT-LINE-the-merit-line-dropped.

## THE FOUR HOSTS

The guild popup (gate, house, line) is worldModes.js's - WIRED; the Roll's tracker is world.js's alone - WIRED through
`rollNoticeHost.js`; exterior.js keeps no Roll and constructs no GuildServiceWindow; dungeonContext.js stands no hall.
QSCRIPT-FREE lives in the quest machine every host runs (online only, by the quest hooks' shared clock).

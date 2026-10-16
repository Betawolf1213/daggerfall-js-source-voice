# FIELD BUGS 2026-10-15c - a Wizard at a hundred

One Discord thread in #bug-reports, "why did my rank on mages guild fall if i got max reputation", handed over by Mac as
a screenshot. Read on the code as it stands at main's `458340b1`.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | Dracula/Valentin: "why did my rank on mages guild fall if i got max reputation" (the flair: The Mages Guild, Wizard, +100) | CHAP4b as built (`11-Multiplayer/Chapters-Arc.md` 3.5): online, while the Roll holds, ranks 8 and 9 are the chapters' seats, won by Merit. Every adoption of the Roll's word sets a book above 7 to 7 (`rollBookCap`), and DFU's review stops at 7 (`updateRank`'s `rankCeiling`). Wizard is the Mages Guild's 7 | by design; the hall now says so (SEAT-LINE) |
| 2 | Temegast: "I was Archmage and now I cant seem to ever get back past the Wizard rank, locking me out of using Mages Guild teleport. All the other guilds tell me what the next rank is and what I need but the Mages Guild does not" | The same hold: Archmage is the Mages Guild's 9, and its Teleport asks rank 8 (`MagesGuild.cs` CanAccessService, `guildServices.js` magesCanAccessService) - a seat's service while the seat is held (3.5). And the hall's line (PROMO-NOW, `Field-Bugs-2026-10-15.md`) answered nothing at the Roll's 7: `rankNeeds` returned null past the ceiling, so a member at 7 was told nothing while a member below it was told the next rank | changed (SEAT-LINE), Mac's call: "Explain the seat" |
| 3 | Reign Droid: "Im forever trapped as apprentice and cant grow past -20 reputation with the mages guild. The very first quest i did for them dropped my rep by 25 points" (the message runs on past the screenshot) | Not found on the code - below | open: the quest's name or the save is needed |

## SEAT-LINE: at the Roll's 7, the hall says the next rank is a seat (2)

`src/systems/guilds.js` rankNeeds; `src/systems/guildServiceFlow.js` rankNeedsLines; `src/scenes/worldModes.js`
openGuildService (the wiring).

ASKED (Mac, of three shapes - explain the seat; explain it and open the Mages Guild's Teleport at 7; retire the cap and
let DFU's review give 8 and 9 again): "Explain the seat". The seats stand as CHAP4 built them.

CHANGED. A member AT the host's ceiling (online, 7 while the Roll holds) is answered by `rankNeeds` as a seat -
`{ rank: 8, seat: true, reputation, reputationNeed: 80 }`, rank 8's reputation being the seat's line (`ROLL_SEAT_LINE`)
- and the hall's line says it, on the enhanced skin, above the popup's buttons:

- "Next rank: Master Wizard" (the guild's own title, as below 7);
- "Ranks 8 and 9 are each chapter's council and Master, won by Merit - no review gives them";
- "Reputation 62 of 80", while the reputation is short of the seat's line;
- "Each Turning seats the most Merit over 4 weeks, among members 14 days in the guild on accounts 7 days old" - the
  numbers the law's own (`SEAT_MERIT_WEEKS`, `SEAT_TENURE_S`, `SEAT_ACCOUNT_AGE_S`, `npcChapterLaw.js`
  seatEligibleAt), so a retune moves the words.

The host reads the line off the book SEATED (`seatedBook`, as the hall's services and title already read it), so a
seat's holder at its own chapter's halls reads 8 or 9 and is told nothing more. A member below 7, a stranger and
everyone offline see what PROMO-NOW gave them. The skills DFU's rank 8 asks are not listed: a seat asks none (AUDIT CHAP
R2, AUDIT CHAP5 D1 - it lifts only a book DFU's own review holds at 7). The classic window is DFU's own and draws
nothing new (THE NATIVE-WINDOW RULE). Two port strings (`guild.rankNeeds.seat`, `guild.rankNeeds.seatMerit`), drafted
in-session in the thirteen whole languages, "the Turning" in each as the seats' refusal already words it.

THE FOUR HOSTS: the guild popup is worldModes.js's alone (openGuildService) - WIRED; world.js opens no popup of its own;
exterior.js constructs no GuildServiceWindow; dungeonContext.js stands no guild hall. Pinned by
`test/fb1015c_seatline.test.js` (4); `tools/mutants/fb1015c_seatline.json` (8, all dead). PINS MOVED:
`test/fb1015_promonow.test.js`'s ceiling pin reads the seat where it read null, and its host pin reads the seated book
(`tools/mutants/fb1015_promonow.json`, 10, all dead, unchanged).

What the reporters are owed: online, Master Wizard and Archmage are the chapters' seats - one Master and three
councillors a chapter, placed at each Sunday's Turning by Merit (a member's own hall writ, and a gate's or a raid's
receipt in the chapter's region - never a quest; Chapters-Arc 5.1).
Rank 7 is the highest the guild's own review gives; the hall now says what a seat asks. A seat's holder has its
rank's services at its chapter's halls, the Teleport among them.

## Report 3, not found

Read, and nothing in it holds a standing at -20 or takes 25 from the Mages Guild for a quest done for it:

- A guild quest's own end online is +5 to the guild (propagated), and a failure costs nothing (QFAIL-FREE,
  `06-Systems/Standing-Arc.md`). The Mages Guild's rank-0 member quests (`QuestList-Classic`: N0B00Y04, 06, 08, 09, 16,
  17) move a standing in their scripts only by -5 to a witches' coven (N0B00Y08), +10 to the Dark Brotherhood
  (N0B00Y09) and +5 to the questor (N0B00Y17); propagated, the Mages Guild could take at most an ally's or an enemy's
  half of one of them (FACTION.TXT's, which the repository does not carry).
- A member at -20 is put on probation at its review (REP6), keeps rank 0 and is offered the guild's quests (their minReq gates on rank
  below 10 - `questLists.js` GetGuildQuest), and a success's +5 is claimed and credited at up to 15 a day
  (`npcChapterLaw.js` rollCredit). Nothing caps a gain at -20.
- The other movers of a guild's standing are a crime (half its loss to the region's People, propagated -
  `court.js`), a donation, DFU's drift (a point every 112 days, toward zero), a raid, and the Roll's own
  credits. None is 25 for a guild quest.

What is needed: the quest's name (the journal, or the questor's town), or the save, and the rest of the message. RECORDED
for the reporter: a member on probation below -10 is expelled at the review 28 days after the probation began (REP6),
and the hall's line says the standing ("Reputation -20 of 10"). Since STANDING-WORDS (below) the probation says its
stakes and its days, and every standing a quest or a crime moves is said as the Roll takes it - the next such drop
names its size and its guild in the chat.

## SEAT-WORDS and STANDING-WORDS: what the guild system left unsaid (2026-10-16)

ASKED (Mac, "With the new guild system, are there any other descriptions or UI elements we need to further make this
palatable for players", then of four gaps found on the code - "Seat-locked services", "Standing changes shown",
"Probation warning", "Tutorial + guide words" - all four).

FOUND. Online the Roll and the seats changed how a guild plays (Chapters-Arc 3.3-3.5), and four places still spoke as
DFU does:

- A service a seat's rank opens (the Mages Guild's Teleport at 8, Zenithar's summoning at 8) refused a member at the
  Roll's 7 with record 3100, which promises a review that online never comes; and a knight asking for the order's house
  was told DFU's rank-9 record, though online the house reads the book's rank, which stops at 7 (AUDIT CHAP4 E2).
- The book held at 7 was one chat line, once a hold. Nothing said a guild's standing moved - a quest's +5, a crime's
  loss through the faction tree, a hall writ's +2 - and after the pace's one line ("rises no further today") nothing said
  how much was still owed.
- A probation said "on probation" on the Standing page, and nothing of the review that expels below -10 or ends it.
- The tutorial's Guilds page said "to rank up, raise the skills it cares about and keep working for it"; no page said the
  standing's pace or the seats, and the notice board's "How chapters work" named the chairs but never that a guild's own
  review stops below them.

CHANGED:

- **SEAT-WORDS - the gate.** `guildServiceFlow.js` serviceAccess takes the host's ceiling: a member AT it refused a
  service the lowest seat rank would open is told "Rank 8 offers this, and online ranks 8 and 9 are chapter seats won
  by Merit. A notice board explains how chapters work." Below 7, offline, for a seat's holder (the book read seated) and
  for a service no rank opens, DFU's answers stand.
- **SEAT-WORDS - the house.** `knightlyGifts.js` receiveHouseDecision, online: "Online, ranks 8 and 9 are the order's
  chapter seats, held while won by Merit - and a seat brings no house." A house already given says so, as before.
- **SEAT-WORDS - the hold.** `scenes/rollNoticeHost.js` (the streaming host's module, HOST-SPLIT): the hold's line
  stands and pops the new Chapters tutorial page with it; a member of any of the twenty-two coming online is shown the
  page the first time too (once on the device, always again from Menu > Tutorials).
- **STANDING-WORDS - the moves.** `net/npcRollTracker.js` hands each adoption's moves to `onStanding` - each of the
  twenty-two the Roll's word moved since its last (a claim's credit, a hall writ's, the owed paid), none at the page's
  first word - and the host's module says them in one line: "Standing: The Mages Guild +15, now 40 (10 more to come)".
  The names are FACTION.TXT's in the player's language, else the hall's.
- **STANDING-WORDS - the owed.** The tracker keeps the Roll's owed in a leaf (`systems/standingOwed.js`; cleared when it
  stops), and the hall's reputation row says it ("Reputation 62 of 80 (10 more to come)"), as does a note under the
  guild on the enhanced Standing page ("10 more standing on the way - it rises at most 15 a day.").
- **STANDING-WORDS - the probation.** `guilds.js` reviewDaysLeft - the days to the next review on the character's own
  date - and `probationWords`: "On probation: at your review in 8 days, below -10 you are expelled - at 0 or more it
  ends." First in the hall's line (said even when nothing else is short) and under the guild on the Standing page.
- **The words.** The tutorial's Guilds page gains a point ("Online, a review stops at rank 7: ranks 8 and 9 are chapter
  seats. See Guild Chapters."), and a new online page, Guild Chapters, says the day's pace, that a failed quest costs
  nothing, and the seats. The notice board's guide gains "Your rank" (a review promotes to 7; a service that asks for a
  chair comes with it) and "Standing" (the pace and the owed, a failed quest free, a hall writ's 2, a receipt's 1). Every
  number is the law's own constant.

Eighteen port strings, drafted in-session in the thirteen whole languages. The classic guild window draws nothing new
(THE NATIVE-WINDOW RULE): its refusals are boxes the classic window already draws, and its hall line stays the enhanced
skin's. Offline nothing changes - the Roll, the seats and the pace are online's.

THE FOUR HOSTS: the guild popup's gate, house and line are worldModes.js's (openGuildService, openServiceFlow) - WIRED;
the Roll's tracker is world.js's alone - WIRED through `rollNoticeHost.js`; exterior.js, the offline fixed city, keeps
no Roll and constructs no GuildServiceWindow; dungeonContext.js stands no guild hall. The Standing page and the notice
board are windows every host opens. Pinned by `test/fb1015c_guildwords.test.js` (9);
`tools/mutants/fb1015c_guildwords.json` (29, all dead). PINS MOVED: `test/chap4b_seats.test.js`'s gate pin reads the
ceiling handed on, its hold pin reads the module, and its review-ceiling pin is held to the review's own line (the gate,
the house and the hall's line now carry the ceiling too, and the loose pin let CHAP4B-WM-CEILING live);
`test/fb1015_promonow.test.js` and `test/fb1015c_seatline.test.js`'s host pins read the date handed on. Mutants
re-aimed: CHAP4B-WM-SEATED, SEAT-LINE-the-reputation-always-said and L10N3d2's serviceMembersOnly (chap4b 34,
fb1015c_seatline 8, l10n3dservices 41 - all dead).

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
and the hall's line says the standing ("Reputation -20 of 10").

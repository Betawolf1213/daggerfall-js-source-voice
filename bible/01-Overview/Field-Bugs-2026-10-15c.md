# FIELD BUGS 2026-10-15c - five Discord threads, each fixed at its root

Five threads from the Discord's bug reports, handed over by Mac with: "No band aids". Read on the code as it stands at
main's `bd385fc6` (main's `3ffd1492` merged in before the first push), and the temples measured on the real ARENA2
(the freeware DaggerfallGameFiles, `tools/fetch-data.sh`, outside the tree).

| | Report | What it was | Done |
|---|---|---|---|
| 1 | "exploit where you do easy quests for a guild and then ask to join it to farm 100 rep in 1 minute" | nothing mints reputation: a stranger's quests bank DFU's +5 a quest with the guild, and since PROMO-NOW the first review online turned it into every rank it covered at once | fixed (ROLL-PACE), Mac's call: "Pace ranks from joining" |
| 2 | "True Invisibility not working inside dungeons" - "monsters still spot and attack me immediately while the spell is active" | the senses were right; a foe's melee START faced the target's live feet, where DFU's faces the last position it detected - so a foe that never saw the invisible player swung at the one in front of it | fixed (INVIS-SWING) |
| 3 | "The entrance to The School of Julianos in Makehda is blocked" - "The Akatosh Chantry in Merdale also has some small issues" | TEMPLE-STEPS, below | fixed (TEMPLE-STEPS) |
| 4 | "The first time craft bonus is not applying to the outfitting. I got somehow it once from...Fishing net?" | not a fault: AUDIT 32 S1 withholds the first-craft bonus from a pattern made only of the counter's cloth - 152 outfitting patterns, the Fishing Net among them - and nothing in the game said so | shown (CRAFT-FIRST-SHOWN), Mac's call: "Keep rule, show it" |
| 5 | "Player is getting wet despite it not raining. Possibly an oversight in reducing the rain?" | the soak read the sim's word at the downpour's rate - RAIN-HEART made most rain a sprinkle, and the front holds a rain word dry before its first drop | fixed (WET-FALL) |

## ROLL-PACE: online, a review promotes no further than the Roll's pace since the membership began (1)

`src/net/npcChapterLaw.js` rollPaceDays, rollPromoteCeiling, rollPaceWait; `src/net/npcRollTracker.js` the tracker's
`standing`, rollPaceOf; `src/systems/guildServiceFlow.js` rankNeedsLines; `src/scenes/worldModes.js` openGuildService;
`src/scenes/world.js` the host's `rollPace`.

THE REPORT. Do a guild's easy quests as a stranger, then join it, and the reputation is ranks at once.

FOUND. Nothing mints reputation. A guild offers a stranger its non-member quests (`questLists.js` getGuildQuestPool,
the 'N' rows) and a success pays DFU's +5 to the guild's own faction whatever the membership (`Quest.cs` EndQuest
:382-386 over `GuildManager.GetGuildFactionId` - "used for non-member quests"). Online the Roll paces that at
ROLL_GAIN_DAY_MAX, 15 a guild a day, a stranger's as a member's. DFU then lets the standing count whole: Join is rank 0
(`Guild.cs` :309), and the next UpdateRank (:74-96) jumps to every rank the reputation covers - after its 28 days.
PROMO-NOW took the 28 days off an online promotion on the word that "the Roll's paced reputation already paces the
ranks". It paces the reputation; the stranger banked it before the membership began, and the hall's first review
turned it into ranks at once. Driven on the real modules: four quests a day for five days (the Roll's 75, 25 owed), then
a join, and the same day's review made the stranger rank 7. A second door stood beside it: the review read the page's
own number, which holds what moved since the Roll's last word unclaimed for up to a minute (longer while claims fail).
Before PROMO-NOW the 28 days ran on the character's own clock (LIVED1), which a fast travel crosses in a minute.

CHANGED (Mac, asked of four shapes - pace ranks from joining, one promotion a day, stranger quests paying no
reputation, the 28 days back - "Pace ranks from joining"):

- **The pace.** Online a review promotes no further than `rollPromoteCeiling`: the rank the Roll's OWN reputation
  allows (never the page's unclaimed number), no more than its pace could have paid since the Roll saw the membership
  begin - 15 a UTC day, that first day counted (`rollPaceDays`; the Roll's view carries the beginning as
  `members[].since`, kept by the tracker and read as `standing(f)`) - and never a seat's (ROLL_BOOK_RANK_MAX). A
  stranger with 75 is rank 1 the day they join, 3 the next, then 4, 6 and 7 - an honest member's own pace from
  nothing. The standing still counts, whole; it is the RANK that waits. A rank already held is never taken
  (updateRank's ceiling never demotes, CHAP4b's law), so a member the Roll was seeded with keeps its rank and is paced
  from the seed for the next.
- **No pace, no skipped wait.** PROMO-NOW's no-wait now stands only while the Roll paces (`rollPaceOf`: null offline,
  or when a refusal ended the Roll); otherwise the review is DFU's whole, 28 days and all. Before the Roll's first word
  on a page the ceiling is 0 - no promotion - where AUDIT CHAP4 C3's was the book's 7.
- **The hall says it.** When the pace is what holds the next rank, the guild popup's line (PROMO-NOW's) ends "Earliest
  promotion: tomorrow" / "in N days" (`rollPaceWait`; `guild.rankNeeds.paced`, drafted in-session in the thirteen whole
  languages).
- **The account service is unchanged.** Its Roll already bounds the rank it records by its own reputation (AUDIT CHAP
  S5), and a rank moves only at the client's review - the door this pace now holds. No relay or account version moves.

THE FOUR HOSTS: the guild popup is worldModes.js's alone (openGuildService) - WIRED; world.js hands it `rollPace`
(its Roll tracker); exterior.js, the offline fixed city, has no Roll and constructs no GuildServiceWindow;
dungeonContext.js stands no guild hall. Recorded in Port-Ledger section A (ROLL-PACE, beside PROMO-NOW's row). Pinned
by `test/fb1015c_rollpace.test.js` (6, the end-to-end one over the real service's Roll and the real tracker);
`tools/mutants/fb1015c_rollpace.json` (13, all dead). PINS MOVED: `test/audit_chap4.test.js` C3 and
`test/chap4b_seats.test.js`'s host wiring read `rollPace`; `test/fb1015_promonow.test.js`'s host pin reads the paced
no-wait; `tools/mutants/chap4b.json` CHAP4B-WM-CEILING and CHAP4B-W-CEILING, `audit_chap4.json` AUDIT-CHAP4-C3-CEILING
and `fb1015_promonow.json` PROMO-NOW-the-host-offline re-aimed at the new lines.

What the reporter is owed: the exploit is closed. Reputation earned before joining still counts, but online a new
member rises no faster than the Roll pays - about a rank and a half a day - and the guild hall says when the next rank
can come.

## INVIS-SWING: a foe swings only where it last knew its target stood (2)

`src/characters/enemyAttack.js` update's melee start; `src/systems/wildAlert.js` noticeRoll, the step;
`src/scenes/world.js` the wild gate's two checks.

THE REPORT. True Invisibility works outdoors; in dungeons monsters "spot and attack me immediately", with no attack,
theft or offensive spell of the player's.

FOUND. The senses were right, in every host: Invisibility (normal or true - they differ only in what breaks them) blocks
every detection - sight, hearing and the stealth roll - of all but DFU's thirteen seers (`EnemySenses.cs`
BlockedByIllusionEffect :659-683, :451-470; the port's `enemyMotor.js` blockedByIllusionEffect and `_classicPostTarget`,
fed `playerInvisible` by `shared.js` sensesContext in all four hosts). A foe that never detected the player never wrote
`lastKnownTargetPos`. But the melee START (`EnemyAttack.update`) tested the 22.5-degree yaw toward the target's LIVE
feet, where DFU's MeleeAnimation tests it toward `senses.LastKnownTargetPos` (`EnemyAttack.cs` :155) - which holds
ResetPlayerPos (float.MaxValue, :28) until a detection, and passes no yaw test. Target selection is not detection (an
invisible player is still the target), so every foe a corridor put in front of the invisible player, inside its
reach, swung - and the blow's own test (MeleeDamage, the live position) landed it. Driven on the real motor and attack:
a foe a step and a half from an invisible player swung nine times in twenty seconds; DFU's swings none. Dungeons are
where foes stand in reach without approaching (corridors, doorways) - and where DFU's seers live (26% of the dungeon
encounter tables against 7% elsewhere: skeletons, ghosts, wraiths, mummies, liches, vampires, Daedra), which see
through it by DFU's own law. The overworld's fast-travel gate (WILD-ALERT) had the same hole by another road: its
notice roll was the stealth formula alone, with no illusion gate.

CHANGED:

- **The swing's bearing.** `EnemyAttack.update` faces `ai.lastKnownTargetPos` - the senses' own record, written on
  detection - and with none, starts no swing. The blow's test is unchanged (DFU's MeleeDamage reads the live position).
  One export every foe pool shares, so no host changes.
- **The wild gate's notice.** `noticeRoll` passes BlockedByIllusionEffect before the stealth roll - an Invisibility
  blocks without a die, a Chameleon or a Shadow rolls its own, a seer rolls as before - and both of world.js's checks
  (the gate's frame and a placed wanderer's first) hand it the traveller's `concealmentFlags` and the enemy's
  `seesThroughInvisibility`.

FLAGGED, not taken: an online joiner's copy of a host's foe observes the joiner through the motor's no-senses path
(`dungeonContext.js` the puppet's `_senses(_pf, null)`), which reads no concealment, so a host's foe that targets an
invisible joiner can still raise the joiner's enemy alert (a refused rest). It strikes nobody: the host's foe decides
on the host, under the host's concealment law.

THE FOUR HOSTS: every foe pool runs the one `EnemyAttack.update` - dungeonContext.js's, exteriorFoes.js's (world.js's and
exterior.js's streets and wilds, and worldModes.js's interiors, IF's one pool factory) and cityGuards.js's - all WIRED by
the one change. The wild
gate is world.js's alone (exterior.js has no fast travel). Pinned by `test/fb1015c_invisswing.test.js` (4, the first
over the real motor, senses and a True Invisibility cast through the one spell door); `tools/mutants/
fb1015c_invisswing.json` (8, all dead). PINS MOVED: the hand-built foes of `enemyattack.test.js`, `arrows.test.js`,
`audit18_enemies.test.js`, `audit24_characters.test.js` and `audit68_enemies.test.js` that stand DETECTED now carry the
position their senses would have written (TEST THE SHAPE THE PRODUCER MINTS); `encounterplace.test.js`,
`wildalert.test.js` and `wildalertfix.test.js` hand the real `concealmentFlags`.

What the reporter is owed: a monster that cannot see through Invisibility no longer swings at you because you walked in
front of it. The undead, the vampires and the Daedra still can - they see through it in Daggerfall too.

## WET-FALL: the skin reads what falls, and how hard (5)

`src/systems/weatherSim.js` fallingWeather; `src/systems/survival/temperature.js` weatherWetGain, feltTemperature;
`src/systems/survival/env.js` ENV_DEFAULTS; `src/systems/survival/needs.js` the road's fair sky; `src/scenes/world.js`
and `src/scenes/exterior.js` survivalEnvNow.

THE REPORT. Wet with no rain falling, and the reporter's guess - the rain's reduction - was right.

FOUND. The soak (Climates & Calories' every-minute row, `WEATHER_WET`: rain 3 bare, 1 under a cloak, 0 under its hood)
read the sim's WORD. RAIN-HOURS and RAIN-HEART (`07-Rendering/Weather-Arc.md`, 2026-10-13) made rain rarer and most of
it a sprinkle - 63-71% of rain time under 0.15 of the profile - by the front's INTENSITY, which only the drawn drops,
the look (RAIN-SPRINKLE's fallTerms) and the ear (DISC9/DISC11's heard word and level) read. A sprinkle the eye barely
sees soaked at the downpour's three a minute - Wet in ten minutes, Soaked in thirty-four - and the front holds a new
rain word dry until 55% of its arrival (three game minutes on a crossing, up to ninety-nine with the map off), soaking
all the while. AUDIT C&C T2 (2026-10-12) had just made the row three times what SURV1 read, so the gap showed.

CHANGED:

- **One truth.** `fallingWeather(shown)` answers what falls on the player - the street's word and level as the
  outdoor frame wrote them for the ear (`setHeardWeather`, the front's `soundWeather` and intensity; the classic sky's
  word at 1) - and after a jump, or before the first frame, the host's own shown sky whole (world.js's: the Sun Baby's
  clear day, AUDIT TEMP-UI E11).
- **The soak.** `weatherWetGain` scales a rain, storm or snow row by the level (`fall`); fog is not falling and stays
  whole. `feltTemperature` soaks on `env.falling` and keeps the sky's word for the air and the sun. Both open-world
  hosts hand `falling`; a road the clock jumped over clears it with the weather (AUDIT C&C H3's fair sky).
- **A departure from the mod**, recorded in `06-Systems/Climates-Calories.md`: Climates.cs Weather() soaks by the
  word, as DFU's weather has no level. The classic sky keeps the mod's whole row.

THE FOUR HOSTS: world.js and exterior.js - WIRED; worldModes.js (interiors) and dungeonContext.js soak nothing (a roof,
a dungeon: `weatherWetGain` answers 0 before the row). Pinned by `test/fb1015c_wetfall.test.js` (7, one over the
real front's frames into the minute law); `tools/mutants/fb1015c_wetfall.json` (10, all dead).

What the reporter is owed: you get wet only when rain is actually falling on you, and a light shower soaks you slowly.

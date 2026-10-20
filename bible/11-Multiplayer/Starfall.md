# The Starfall - the Witches' Festival's fallen stars (STAR0-STAR8)

> Design page and record. Written 2026-10-20 as the design (STAR0), then marked AS BUILT slice by slice. The code's
> comments cite this page by section number; where the page and a pin disagree, the pin is what runs.

## What the owner asked for

The owner, 2026-10-20, of the Halloween live event another session is finishing: *"What were going to do is build the
add ons to the event here and ill have you eventually take over their PR when they are finished."* Two additions:

1. *"A lore accurate world encounter defense mission that can pertain to the lore. I envision something coming from the
   sky and crashing into the ground, where people need to defend the objective in a wave based format with a boss
   topping off the encounter at the end."*
2. *"A new seasonal quest line that ties into the event, its functions and the new world event."*

And: *"The world event itself should have multiple encounters spread throughout the region, not just one."*, *"No band
aids, no half assed work and ensure any text implemented/ui elements are enhanced plus + not AI-like and
overexplanatory."* Every decision below was handed over (*"take autonomy"*); each is made here and named.

So, as decided here:

- **Online only.** Like the gate, the serpent and the raids, the Starfall is a fact about the shared world: the relay
  keeps each star's ledger, signs each defender's receipt, and the account service pays it. Offline there is no
  Starfall.
- **The event's own.** It runs while the Halloween live event is staged (section 12 - the merge seam), inside a dated
  window the relay can check (`STARFALL_FROM_MS`, `STARFALL_TO_MS`).
- **Three stars a night, in one coven's land.** Every real hour is a night on the sky (TimeScale 24, `Online-Time-Arc.md`),
  and each night one of the Bay's covens works the rite: three stars fall in the wilds of its region, one after another,
  near three different towns.
- **The foes are Daggerfall's own**, owned by a player's machine as every foe in the open world is (the rite's camp
  law), with Daggerfall's own AI, spells and pathing. The relay holds the ledger: the wave, the star's light, the
  master's fall, who defended. This is a departure from the world bosses' Option B, named in section 10.

Daggerfall has no other players and no fallen stars, so none of this is a DFU member. Its Ledger A row is STARFALL.

## The lore - canon, and the port's own

Each piece says which it is, as `Elite-Gates.md` section 3 does.

**Canon (the player's own data, read 2026-10-20):**

- The Witches' Festival is the 13th of Frostfall. Daggerfall's own words for the day (TEXT.RSC record 8392, 8349 plus
  the holiday's id 43): the day "when the forces of sorcery and religion clash", when "Demonologists, conjurors, lamias,
  warlocks, and thaumaturgists meet in the wilderness outside %cn, and the creatures created or summoned there may plague
  Tamriel for eons. Most wise men choose not to wander this night." (`systems/holidays.js` HOLIDAYS.Witches_Festival,
  day 0x11B = 283, every region.)
- **Day 283 is also Mephala's summoning day** (`systems/daedraSummoning.js` DAEDRA, Mephala's `dayOfYear`, DFU's
  DaedraSummoningService table). The two tables were never written to agree; they do. The Witches' Festival is
  Mephala's day.
- Daggerfall's Mephala is "the Daedra Regent of Murder and Patroness of the Dark Brotherhood" (Z0C00Y00.QRC), "Mephala,
  Queen of Oblivion" (N0B00Y09.QRC). Her incantation is in the game - "Hapisho, Malicnao, Mephala." - and reading it
  wakes a guardian: "An ancient lich! He must have been summoned to protect the scroll!" (G0B91Y01.QRC, N0B41Y24.QRC).
- The Daedra have stars. The game's rumours: "The stars of Mehrunes Dagon are blazing tonight." (Y0C00Y00.QRC), "The
  stars of Namira burned bright last night." (30C00Y00.QRC), "When the stars darken like last night, it is to mark the
  death of a daedra." and "Did you hear music in the woods last night? The witches must be celebrating." (Q0C4XY04.QRC).
- The covens are the Bay's own: fourteen coven locations in MAPS.BSA, each the home of a FACTION.TXT witches' coven
  (type 8). Glenmoril's (Ilessan Hills) serves Hircine alone - DFU: "THE GLENMORIL WITCHES always summon HIRCINE"
  (`daedraSummoning.js`) - and stands apart from Mephala's rite. Every other coven summons a prince a day. The quest
  table names each coven as a permanent place (`vendor/dfu-quests/Tables/Quests-Places.txt`, `BluffCoven`,
  `GlenmorilCoven` and the rest) and covens as a dungeon type (`dungeon7`).
- The holiday text names lamias among those who meet. Daggerfall's lamia is `Aquatic` (ENEMY_BASICS 42): it never leaves
  the water, so it stands at no star. The text's words are kept in the questline's, and nowhere does a lamia walk on
  land.

**The port's own:** that on Mephala's day the covens spin a rite to snare a star; that the stars come down bound in black
thread; that the coven's summoned drink a star's light, and a star drunk dark leaves what drank it in Tamriel; that a
star held until its thread burns sends them home; the masters' titles; Morwen of Glenmoril; the Starspun Weave;
Starglass.

## The shape, end to end

```
 the live event staged ─► the NIGHT (each real hour) ─► the night's COVEN (a bag over twelve) ─► its REGION's wilds
   (section 12)             sky 18:00 to 06:00             STAR_COVENS, never twice running        three pixels, apart
                                                                                                       │
            the OMEN (90 s before each fall) ─► the FALL (a streak, the impact) ─► the FALLEN STAR ─┘
              a new star in the sky, the map mark       the crater, the stone, its thread, the beacon
                                                                 │
   a player within 80 m springs the coven's foes (the camp law) ─┤ every player within 60 m says the star's word
                                                                 ▼
          the CELL ROOM the star stands in keeps its LEDGER (net/starfall/starfallLaw.js): the wave, the light, the master
          WAVE 1 ─ breath ─ WAVE 2 ─ breath ─ WAVE 3 ─ breath ─ WAVE 4 ─ breath ─ THE MASTER ─► HELD (or LOST: light 0, or dawn)
                                                                                              │
   the account ◄── claim ◄── RECEIPT `j1` ◄── the cell mints, to each who struck and stood ◄──┘──► the hub ──► everyone
   service           │                                                                                 online hears it
                     └──► Renown, silver, "Stars held"; on the device: gold, Starglass, a piece, the Starspun Weave
```

## 1. When - the festival's window, the night, the stars

**The window.** The Starfall runs while the live event is staged (section 12) and inside `STARFALL_FROM_MS` to
`STARFALL_TO_MS` (2026-10-20 to 2026-11-08, UTC). The relay checks the window, never the staging (a cell cannot read
the hub's stored event - section 10).

**The night.** The sky turns once a real hour, its midnight on the hour (`net/skyLaw.js` SKY_SEGMENTS: TimeScale 24
since 2026-10-03, aligned). Night N is the sky's night whose midnight falls at `N * STAR_HOUR_MS`: from the sky's 18:00
(HH:45 the hour before) to its 06:00 (HH:15). The law reads wall time alone, so the relay needs no sky
(`skyLaw.js` is never the relay's); `test/net/starfall/star1_law.test.js` holds every star of a year of nights inside
the sky's dark, read off `skyLaw.js` itself.

| sky | real (UTC, every hour) | what |
|---|---|---|
| 17:24 | HH:43:30 (the hour before) | **the first omen**: a new star over the coven's region |
| 18:00 | HH:45:00 | **the first star falls** |
| 21:00 | HH:52:30 | **the second falls** (its omen at HH:51:00) |
| 00:00 | HH:00:00 | **the third falls** (its omen at HH:58:30) |
| each fall + 15 min | | that star's **deadline**: unheld, the coven takes it |
| 06:00 | HH:15:00 | dawn: the third star's deadline |

`STAR_FALLS_MS` [-900 000, -450 000, 0], `STAR_OMEN_MS` 90 000, `STAR_LIFE_MS` 900 000. A night's three stars overlap,
so a company can hold one and ride to the next.

**The Witches' Night.** On the night of the sky's own 13th of Frostfall (the sky's day 283 at its 18:00 - once a sky
year, every fifteen real days: its dusk at 11:45 UTC on 2026-10-20 and 2026-11-04 inside this window), the third star is **the Heart-Star**: its
master's circle is twice the size, and what it gives is twice as much (section 6). The client's law alone
(`systems/starfall/starfallNight.js`, which reads the sky); the relay neither knows nor needs it.

## 2. Where - the coven's region, three stars in its wilds

**The covens** (`systems/starfall/starfallCovens.js` STAR_COVENS - the coven's MAPS.BSA location, its region, its
FACTION.TXT name and what a member is called): twelve of the fourteen.

| region | coven (MAPS.BSA) | witches (FACTION.TXT) | a member |
|---|---|---|---|
| Alik'r Desert | Coven in the Marsh | The Witches of the Marsh | Witch of the Marsh |
| Dragontail Mountains | Devilrock Coven | The Witches of Devilrock | Witch of Devilrock |
| Dragontail Mountains | Coven of the Peaks | The Mountain Witches | Mountain Witch |
| Dak'fron | Kykos Coven | The Sisters of Kykos | Sister of Kykos |
| Daggerfall | Coven on the Bluff | The Sisters of the Bluff | Sister of the Bluff |
| Menevia | Tamarilyn Coven | The Tamarilyn Witches | Tamarilyn Witch |
| Alcaire | Alcaire Coven | The Witches of Alcaire | Witch of Alcaire |
| Phrygias | Skeffington Coven | The Skeffington Witches | Skeffington Witch |
| Daenia | Beldama Coven | The Beldama | Beldam |
| Shalgora | Daggerfall Coven | The Daggerfall Witches | Daggerfall Witch |
| Myrkwasa | Coven of the Tide | The Tide Witches | Tide Witch |
| Antiphyllos | Coven of Dust | The Dust Witches | Dust Witch |

Left out, and why: **Glenmoril** (Ilessan Hills) is Hircine's, and in the questline it is the side that stands against
the rite; **Wroth Coven** (the Daughters of Wroth) stands in the Wrothgarian Mountains, the open zone, where no world
event runs (`systems/wild/wildZone.js` WILD_REGION, the gate's own law). FACTION.TXT's `region:` field for the covens
does not name the MAPS.BSA region the coven stands in, so the pairs are written by name and held by
`test/systems/starfall/star2_covens.test.js` against the player's data (ARENA2-gated: every location exists in its
region as a Coven, every faction exists as type 8).

**The night's coven** is a shuffle bag over the twelve (`starfallCovenOf(N)`): every coven takes a night, in an order
each round of twelve shuffles, before any takes a second, and a round never opens on the coven the last one closed on.
So a region sees its stars about twice a real day, at a different hour each round.

**The stars' pixels** are the Oblivion Gate's own suitable pixels in the coven's region (`systems/gate/gateSite.js`
gateScanner - land, no location on the pixel or its eight neighbours, 2 to 4 pixels from a town a traveller can fast
travel to, the game's own MAPS.BSA rows alone), which is the holiday text exactly: the wilderness outside a town. Three
are drawn by hash (`STAR_SALT`, the night, the star): each at least `STAR_APART_PX` (5 pixels, about 4 km) from the
others and from the gate's site of that game day, each named by its nearest town, a different town for each where the
region has them. The spot inside the pixel is the law's (`starSpotLocal(N, k)`, up to 200 m off the pixel's heart -
the gate's), so the relay can place the star from the pixel a word names.

## 3. A fallen star - what stands, and what is seen

All of it the port's own art, made in code (`world/starfall/starArt.js` through `world/superDungeon/sdPixelKit.js`, under
pseudo-archives registered in `world/eliteGates/pseudoArchives.js`): no ARENA2 pixel is in it.

- **The omen** (90 s before the fall): a new star burns over the region - a point of pale violet light, high in the
  sky toward the site, swelling as the fall nears. The map marks the site, the compass points to it, and the chat
  says where.
- **The fall** (8 s): the star tears loose and comes down at a slant, a white head and a violet trail kilometres long,
  lighting the land under it. It lands with a flash seen across the region, a ring of shock running out over the
  ground and a thunderclap that reaches each player its distance late (`systems/distantStorms.js` thunderOf). The ground
  shakes under a player within 300 m.
- **The crater** (`world/starfall/starModel.js`): a scorched bowl 14 m across, conformed to the land, its cracks
  glowing faintly; a rim of thrown earth and stone; no grass grows in it.
- **The Fallen Star**: a jagged stone of pale glass, half buried, two and a half metres of it standing out of the
  crater's heart, lit from inside. Black thread is wound about it and runs up into the dark.
- **The beacon**: a column of the star's light, rising hundreds of metres, seen across the region (the gate beacon's
  column). It rises over three seconds after the landing and dims with the star's light as the cell says it, to three
  tenths of its strength at none (`STAR_BEACON_DIM`): a star failing is seen from across the region.
- **Held**: the thread burns away, the stone turns gold-white, the beacon goes gold and thins over a minute.
- **Lost**: the stone goes dark, the beacon goes out, and the thread stays.

**As built (STAR4).** The art is six records under `STAR_ARCHIVE` (38301): the burned floor (its cracks lit violet), the
thrown rim, the glass, the thread, the glass held gold and the glass lost dark (`world/starfall/starArt.js`). The crater
never cuts the land's triangles (every client's pixel is the same mesh): its floor is laid ON the land, each point on
the highest ground within half a metre of it (the rite's sigil's drape) and a hand over it, with the rim's earth raised
round it to a crest at 7 m and falling away to 9.6 m, nine stones thrown onto the rim, six glass shards (the heart's
upright, two and a half metres out of the earth and sunk most of a metre into it, the rest leaning out from it) and three
strands of thread that wind up the stone and run 90 m straight up (`world/starfall/starModel.js`). Every shape is the star's
own roll, so every screen builds the same crater. The host builds it for a player within `STAR_BUILD_M` (1500 m), puts
the stone in the collider, keeps the grass off the crater and its rim (`STAR_BARE_R`) and builds it again when the
ground under it is built finer (`scenes/starfall/starfallHost.js`). The sky is one foreign pass after the Hollow's omen
(`render/starfall/starfallPass.js`): the omen's glow, the streak's head and trail, the landing's flash and ring, and the
beacon, each drawn scaled about the eye to `STAR_SKY_R` (4200 m) so the far plane (6000 m) never cuts a star that burns
9 km up. The sounds are DAGGER.SND's own records, pitched (`systems/starfall/starSounds.js`).

## 4. The defense - waves, the light, the master

**Springing it.** The first player within `STAR_SPRING_M` (80 m) of a fallen star springs its coven and owns their foes
(the camp law of the World of Daggerfall, `world/worldOfDaggerfall/wodShared.js`: site `px,py:star.<N>.<k>`); every
other player sees the owner's foes and fights them through the owner. An owner who leaves hands them to the next
player at the star after `STAR_ORPHAN_MS` (10 s). The relay starts the first wave `STAR_GATHER_MS` (10 s) after the
first word from the star.

**The waves** (`STAR_WAVES` 4). The relay says each wave's start and its size (`starWaveSize(k, n)` -
`clamp(2 + n + (k >= 3 ? 1 : 0), 3, 9)`, `n` the defenders standing at the star when it starts), so every screen
agrees. The owner stands them, out of sight at the crater's edge (25 to 35 m), from the coven's roster for the
defenders' level - the band (`starBandOf`, the median level of the defenders the relay heard: band 1 to level 8,
band 2 to 15, band 3 from 16), because Daggerfall's monsters have fixed levels and some want silver, dwarven or mithril
to hurt (`ENEMY_BASICS` minMetalToHit), so a band never stands a foe its players cannot fight:

| wave | band 1 (to 8) | band 2 (9 to 15) | band 3 (16 and up) |
|---|---|---|---|
| 1 - the coven's hands | the coven's members: Mage, Sorcerer, Battlemage, Nightblade | the same | the same |
| 2 - what they called | Giant Spiders, Spriggans, Giant Bats | Giant Spiders, Skeletal Warriors, Zombies, Spriggans | Skeletal Warriors, Wraiths, Iron and Flesh Atronachs |
| 3 - what they made | Giant Spiders, Spriggans and members | Fire and Ice Atronachs, Skeletal Warriors and members | Fire and Ice Atronachs, Daedroths and members |
| 4 - Mephala's own | Nightblades and Giant Spiders | Nightblades, Assassins and Giant Spiders | Daedra Seducers, Assassins, Fire and Frost Daedra |

The coven's members are women (DFU: a witches' coven's people are always female - `systems/quest/person.js`), named by
their coven - *Sister of the Bluff*, *Dust Witch*. Mephala is the Patroness of the Dark Brotherhood, so her own are
murderers as well as Daedra.

A wave ends when its foes are all dead (the owner's word, never sooner than `STAR_KILL_MIN_MS` (2.5 s) a foe), or
`STAR_WAVE_MAX_MS` (100 s) after it began - then the next comes whether the last is dead or not. Between waves the
coven draws breath for `STAR_BREATH_MS` (12 s) and the star's light steadies (`STAR_BREATH_LIGHT`, 15).

**The light.** A star has `STAR_LIGHT` (100). The coven's summoned that fight hand to hand go for the STAR, not the
defenders: the star stands in the target machine as a body of its own (the townsperson's law,
`systems/livingWorld/quarry.js` - the Starfall host's own body for it, `scenes/starfall/starfallHost.js`), hunted by its own coven's melee foes alone
(`characters/enemy/enemyTargets.js` huntsStar), and each of their blows that lands on it drinks `STAR_BLOW_LIGHT` (1).
A foe struck by a defender turns on them, as any foe does. The witches themselves - casters and archers - fight the
defenders. So the defense reads: cut down what walks to the star, and stand off the witches' spells. At 0 the star goes
dark and is LOST.

**The master** comes after the fourth wave's breath. Elite (`systems/eliteFoes.js` - five times the health, three times
the blows, larger and glowing), by band and by star:

| band | the first star | the second | the third |
|---|---|---|---|
| 1 | the Coven Mother (a Sorcerer) | the Coven Mother | the Coven Mother |
| 2 | the Coven Mother | a Flesh Atronach - *what the coven made* | the Coven Mother |
| 3 | a Daedra Lord - *what the demonologists bound* | a Daedra Seducer - *Mephala's own* | an Ancient Lich - *woken by the chant* |

At two-thirds and one-third of its health it calls its circle (`starCircleSize(n)`, `clamp(1 + ceil(n / 2), 2, 5)`,
the wave-4 roster), and **while any of its circle stands it takes a quarter of every blow** (`STAR_CIRCLE_SHARE`, 0.25 -
the gate's Ward-Bearers' lesson: break the circle to break the ward). The Heart-Star's circle is twice the size.
`exteriorFoes.js` damageFoe reads the ward off the foe (`f.circleWard`), so every blow - the owner's own and a
peer's through the owner - meets it.

The master's fall HOLDS the star. The relay believes it no sooner than `STAR_MASTER_MIN_MS` (45 s) after the master
stood. A star whose deadline passes unheld is LOST: "Dawn. The coven pulls the last light home."

**As built (STAR5).** No Imp stands in the first band's second wave: it wants steel (`minMetalToHit` 1), and the first
band stands nothing past iron. A star's foes stand under THREE sites of one owner - the waves' `px,py:star.<N>.<k>`, the
master's `.m` and the circle's `.c` (`wodShared.js` starSiteId) - so every screen tells the master and its circle apart
among the foes it sees, names them, says the circle's calls and its breaking, and draws the master's bar, the owner's
or not. The owner stands what the ledger says: each wave its size less the kills the cell already heard (a star taken
over mid-wave stands only what is left of it), stood again after `STAR_RESTAND_MS` (4 s) if none of it could stand; the
master an elite under `.m` with its circle's ward on it (`f.circleWard`); its circle at its calls. The blows the coven's
monsters land on the star are counted on the owner's device per character (`STAR_BLOWS_STORE`), so a reloaded owner
counts on from its own and the relay credits only past its last. A hunter turns on a defender once a defender's blow
lands on it (`starTurned`); until then it weighs the star `STAR_HUNT_PRIORITY` (40) over anyone beside it.

## 5. The relay holds the star

Pure law, both ends: `net/starfall/starfallLaw.js` (no imports but the wire's, so the relay's graph stays flat). The
relay's half is `server/src/index.js` - one line in `_message` (`if (m.t === 'star') return this._starFrame(ws, a, m);`)
and Room methods of its own, the raid's and the rite's shape:

- **Where.** A star's ledger lives in the CELL its pixel stands in (`worldRoom(px, py)`), in storage
  `star:<N>.<k>@<px>,<py>` (its whole tuple, `starLedgerId`), from the first word at it to its deadline and
  `STAR_KEEP_MS` (10 min) past it. A cell keeps `STAR_LEDGERS_MAX` (4), and one account makes `STAR_LEDGERS_BY_MAX` (2)
  of them. Full, a new star takes the place of the one stood at least lately, nobody at it for `STAR_IDLE_MS` (60 s);
  a star held or lost keeps its place to its end, so its receipts are never minted twice nor its fight run again. A
  layer keeps none (SCALE5d's law).
- **The word** (client to cell, every `STAR_WORD_MS` (2 s) within `STAR_SAY_M` (55 m), at once on a change):
  `{t:'star', n, k, px, py, lv, s, o, kn, wc, hb, mf}` - the night and the star, its pixel, my level, whether I struck
  one of its foes, whether I own them, the deaths I saw of this wave, the wave I saw cleared, the blows I saw land on
  the star (the owner's count), whether I saw the master fall.
- **What the relay checks.** A word for another cell is junk. One outside the window, the night's stars (`starTimes`)
  or its star's life is nothing. One from a pose further than `STAR_REACH_M` (60 m) from the star the law places in that
  pixel is heard as present but counts nothing. The ledger is made by a word from the star (its tuple: the night, the
  star, the pixel - a forged pixel makes a ledger of its own and stands in no other's way).
- **The owner.** The relay keeps who says they own the foes: the first `o: 1`, until that account has said nothing for
  `STAR_ORPHAN_MS`. A wave cleared, a blow count and the master's fall are believed from the owner alone.
- **The machine.** `stepStar(led, now)` moves the ledger on every word: the gathering, each wave and its breath, the
  master. The light falls by the owner's blow count, credited no faster than `STAR_BLOWS_BURST` (6) and
  `STAR_BLOWS_HZ` (9) a second; the breath's light is added once a breath. The wave's size is fixed when it starts.
- **The fan.** A ledger that moved says `{t:'star', k:'st', ...}` to the cell (`starLedgerState`): the phase, the wave,
  its size and the deaths said of it, the time left in the phase on the encounter clock, the light, the defenders and
  their band, whether an owner holds the foes and the blows credited to it (an owner whose page reloads counts on from
  them), held or lost and why. A word that moved nothing is answered with the same, to its speaker alone.
- **Dawn.** The cell's alarm is armed for the deadline: a star unheld by then is lost with nobody there to step it, and
  said to the cell. A cell keeping a star forgets nothing else until the star is forgotten.
- **Held, said once.** The master's fall mints a receipt for each account that EARNED it - struck one of the star's
  foes and said so from the star within `STAR_PRESENT_MS` (15 s) of the fall - writes the ledger with them (kept before
  it is said, AUDIT WB A10), fans `hd` to the cell, hands each earner's receipt to its account's newest socket there,
  and tells the hub (`STAR_INTERNAL_HELD`) until it answers. The alarm's sweep that meets a star mid-mint leaves it to
  the word minting it. The hub keeps the receipts (checked for their account and star, signed; the newest
  `STAR_RC_KEEP` an account, each a day) and hands each to its account wherever it stands, then says the hold to
  everyone online once and keeps the night's held stars (`STAR_HELD_KEY`) until its last star is gone
  (`starNightGoneAt`). A hello is handed both.

## 6. The receipts and the rewards

**The receipt** (`net/starfall/starReceipt.js`): `j1.<base64url({ sf, s, c, l, i, e })>.<signature>` - `sf` the night
and the star, the account, a seed from the relay's CSPRNG, the level its last word at the star said, issued and expiry
(a week). Signed by the relay's one key (`GATE_SIGNING_KEY`), the version inside the signed bytes; its six fields and no
other, so no other signed shape reads as one. The Heart-Star is not in it: it is the sky's (section 1), and every
device reads it off the receipt's night and star alike.

**The account service** (`server-account/src/stars.js`, `/v1/star/claim`, migration `stars_held`): verified with the
relay's public half, counted once a (night, star, account), at most `STAR_CLAIMS_DAY_MAX` (9) a UTC day; pays the
character three quests' Renown (the raid's `renownRaidXp` measure, for a fight about as long) and strikes
`STAR_SILVER` (30) silver under the day's combat cap; the cards say *Stars held: N*. A guest is counted once it
registers. On `recorded` the client notes the act `star-held` (the questline's witness, section 7).

**On the device**, rolled from the receipt's seed (`systems/starfall/starSpoils.js`, the spoils pool under keys of its
own): gold (60 a level, a fifth either way); one to three pieces of **Starglass** (a trade good of the port's own, item
template 576 - pale glass that still holds some of the star's light; it sells well); one piece Magic or better, known;
and a quarter of the time a piece of **the Starspun Weave** - the Starfall's own Aetheric set (Mephala's, `sigilSets.js`
`starspun`, its powers through SET2's seams, `11-Multiplayer/Sigil-Sets.md` 6f). The Heart-Star doubles the gold and
the Starglass, and always gives a Starspun piece.

**As built (STAR7).** The service (`server-account/src/stars.js`, migration 0140, acct165) counts a (night, star,
account) once in `stars_held`, at most 9 on the UTC day the star FELL (a receipt claimed a day late counts on its own
day), pays the Renown on the raid's measure charged to its hour, and strikes 30 silver (`net/marksLaw.js` MARKS `star`,
`MARKS_COMBAT`'s kinds) under the day's combat cap; a guest's claim writes the spoils row alone (`star_spoils`, keyed by
the device's claim id). The device carries the receipts (`net/starfall/starClaims.js` - the serpent's carrier, its own
keys) and the Starfall host's rewards (`scenes/starfall/starRewards.js`) roll the spoils when the service says the claim
is theirs (`systems/starfall/starSpoils.js` - the raid's thanks' measure: the source a treasure pile's, halfway up the
ladder; the set piece LAST, the ladder's last pass and the technique pass after it), give them into the pack through the
world's one door under the star's own pool keys (`star7.spoils`), keep the crash's record until a save holds them (its
stand-up door and the realm save's hooks), adopt the Renown for the character that held the star alone, and say the
silver's lines and cards (`Star held`). **Starglass** is template 576 (`systems/starfall/starglassRow.js`, the leaf the
item law reads headless as it reads the Weir Key's - the account service loads none of the game; `starglass.js` its name
and picture): miscellany, 0.1 kg, 400 gold, stacked, traded freely, its own painted sliver under pseudo-archive 38302
(`world/starfall/starglassArt.js`). **The Starspun Weave** is nine Elven pieces at the Legendary band's floor (the raiding
parties' measure - a star is held three times an hour): a cowl, both pauldrons, a cuirass, the hands, greaves, boots, a
buckler and the Spindle-Blade, a one-handed shortsword - no poison resistance on a piece (Spinner's Thread carries it).
Its tiers: **Spinner's Thread** (2), poison resistance and Agility; **Bound in Silk** (4), every 4th weapon hit that lands
on the same foe deals 60 to 140% more, the count each foe's own and falling away 8 s after the last hit; **Mephala's
Veil** (6), a foe's blow that takes the wearer under 30% health hides them - Chameleon for two to four rounds - recovering
in 240 to 120 s (never one of the Spire's death saves: it saves no life). The cards say *Stars held* (`enhancedAccount.js`,
`profileWindow.js`).

## 7. The questline - The Thirteenth of Frostfall

`thirteenthFrostfall`, tier 3, a group of its own (`festival`), from level 6, online, a registered account, and only
while the live event is staged (`opens.event`). A step whose deed is a star waits while the Starfall is not running
(`needs: ['starfall']` - "Opens during the Witches' Festival."), and the window draws no line that has not begun outside
its event (UI-Calm's law). The giver is **Morwen of Glenmoril**, a witch of Hircine's coven (the port's own), met at the
Glenmoril Coven in Ilessan Hills (`permanent GlenmorilCoven`). The villains are the Sisters of the Bluff, whose coven
stands nearest the capital (`permanent BluffCoven`).

| Step | What the player does | Witness |
|---|---|---|
| QLTF01 Music in the Woods | a letter left by a raven; hold a fallen star (`ql act star-held 1`); find Morwen at the Glenmoril Coven | star |
| QLTF02 The Coven on the Bluff | go into the Coven on the Bluff, slay the Spinner and her sisters, take the spindle of black thread; unwind a length of it (`unwound`, greater pay) or bring it wound (`wound`, Glenmoril +3) | |
| QLTF03 Three Stars | hold three more stars (`ql act star-held 3`) - every star held is a strand the web loses | stars3 |
| QLTF04 What the Thread Is Worth | the holiday's own clash: burn the spindle in Hircine's fire (`burned`, the Glenmoril Witches +10, "Morwen's Hunt-Charm"), sell it to the Mages Guild (`guild`, greater pay, "Starglass Rod"), or carry it to a temple of Arkay (`temple`, the temple +5, "Thread-Cutter") - the line's title, Starwarden | |

The act `star-held` is noted by the receipt's claim on `recorded` (`net/starfall/starClaims.js`), once a receipt; the
service witnesses it (`QL_SERVICE_LINES`, `QL_WITNESS_SQL` over `stars_held`).

## 8. What a player sees and hears

The words keep WB13b's rules (`World-Bosses.md` section 20, WB13b): the event, then what to do, and stop; no "X, not Y";
no dash asides; numbers as numerals; at most one exclamation; times in the player's own local time.
STAR6's words test holds every line.

| moment | who | line |
|---|---|---|
| the omen | everyone online in the region | *A star is falling toward Gothway Garden. The Daggerfall Witches are at their rite.* |
| the fall | everyone online in the region | *A star has fallen near Gothway Garden.* |
| the first wave | at the star | *The coven comes for the star!* |
| waves 2, 3, 4 | at the star | *What the coven called comes out of the dark.* / *What the coven made comes for the star.* / *Mephala's own come for the star.* |
| a breath | at the star | *The star's light steadies.* |
| a quarter of its light left | at the star | *The star is going dark!* |
| the master | at the star | *The Coven Mother comes for the star!* (each master its own) |
| its circle | at the star | *The Coven Mother calls her circle. Break it!* |
| the circle broken | at the star | *Her circle is broken.* |
| held | at the star | *The star is held. Its thread burns away.* |
| held | everyone online | *The star near Gothway Garden is held by Ann, Bran and 2 others.* |
| lost | at the star | *The coven has taken the star.* |
| dawn | at the star | *Dawn. The coven pulls the last light home.* |
| spoils | the claimant | *Starglass from the fallen star is in your pack.* |

**The tracker** (`ui/starfall/starTracker.js`, a readout made once and updated, never rebuilt; Enhanced Plus's kit by
role, and in every skin, as the gate's bar is - a fight is read whatever skin is worn): within `STAR_HUD_M` (400 m) of a
star - *Fallen Star*, its town, its coven, *Wave 2 of 4* or *The master* or *Held* or *Lost*, the light as a bar, and
the time to its deadline. **The master's bar** is the gate's (`ui/gate/gateBossBar.js`, theme `star`): the master's
name, *Master of the Fallen Star* (the Heart-Star's: *Heart of the Web*), its health, and *2 of her circle stand* while
the ward holds. **The map** marks each star of the night with a card; **the compass** points to the nearest within the
region; **the timers** row says the night's coven and the next fall.

**As built (STAR6).** Every line goes through the text core (`systems/starfall/starWords.js`, `t('starfall.*')`, its
names as arguments), held to WB13b's style by a law over all of them (`test/systems/starfall/star6_words.test.js`). The
Timers window shows each fallen star still undecided counting down to its deadline (*Fallen Star*, *Near Gothway
Garden*, *The coven takes it when this runs out*) and the next to fall counting down to its landing (*A star falls* - the
Heart-Star's own words - its town from its omen on, as the region hears it, and *The Daggerfall Witches are at their
rite*), the next night's first once this night's last is down (`systems/starfall/starfallClient.js` starTimerRows). The
held map's cards ride the raids' reader and a violet four-pointed star of its own (`ui/ink/inkMap.js` paintStarMark).
**The compass's door, fixed at its root**: the world host had handed `drawHud` the sea serpent's and a found Hollow's
compass marks since SERPENT1 and SD2c, and `drawHud` dropped both - neither ever showed on the enhanced strip. It
forwards them now, and the star's beside them (`ui/hud/hud.js`). The star's colours are one leaf
(`ui/starfall/starMapMark.js`), so the Timers sheet imports nothing that imports it.

**The sound** (`systems/starfall/starSounds.js`, DAGGER.SND's own records, pitched - no new clip): the omen's rising
whine, the fall's roar, the impact's thunder at its distance, the star's hum near it, a blow on the star, the thread
burning, the dark.

## 9. The wire

| frame | way | what |
|---|---|---|
| `{t:'star', n, k, px, py, lv, s, o, kn, wc, hb, mf}` | client -> cell | the star's word (section 5) |
| `{t:'star', k:'st', n, s, px, py, p, w, wz, kn, wl, lt, nd, b, ow, hc, hd, lo, why}` | cell -> cell, cell -> a speaker | the ledger: phase, wave, its size and deaths, the time left in the phase, light, defenders, band, an owner and its credited blows, held, lost and why |
| `{t:'star', k:'hd', n, s, px, py, at, top, c}` | cell -> cell, hub -> everyone | held, by whom (the first `STAR_TOP_MAX` named, `c` how many) |
| `{t:'star', k:'rc', r}` | cell or hub -> one | an earner's receipt |
| `{t:'star', k:'hds', l: [...]}` | hub -> a hello | the night's held stars |

`STAR_RELAY_MIN` names the first relay that speaks it (`relaySupportsStar`), and an older relay is never sent a word.
`STAR_HZ_MAX` bounds a socket's words (the rite's bucket, deeper than the client's burst). `LIVE_EVENTS` gains
`witchfest` (section 12) with its own `LIVE_EVENT_RELAY_MIN`.

## 10. Trust and its bounds

**The departure from Option B, and why.** The gate, the serpent and the Remnant are fought on ground the relay can see
whole: a flat disc, a sea. A star falls in the open country, among trees and slopes, with a coven of Daggerfall's own
foes - spells, bows, flight, pathing - and three stars a night across a region. A relay-run body has no path, no spell
and no melee in the open world (`World-Bosses.md` section 26: melee on a relay's body is the dungeon's alone). So the
foes are the players' machines' own, as every foe in the open world is (co-op's law, `Multiplayer.md`), and the relay
holds what it can check: the window, the cell, the pose, the order of the waves, the pace, the owner, the receipts.

**What the relay cannot check, said.** A word is its player's own. The owner's machine runs the foes, so the owner's
word moves the waves, the light and the master's fall. A modified owner could clear a wave early (never sooner than
2.5 s a foe), drain the star (never faster than 9 blows a second) or call the master fallen (never sooner than 45 s
after it stood). The last pays the defenders who struck and stood there; the service bounds what a receipt is worth
(once a star, nine a day). A word for a forged pixel is a ledger of its own and stands in no other's way. The relay does
not know whether the live event is staged; the dated window bounds what it pays.

## 11. The hosts, and the room made in bootWorld

**THE FOUR HOSTS.** `scenes/world.js`, the streamed world, wires the Starfall (`scenes/starfall/starfallHost.js`).
`scenes/exterior.js` (the bench: no relay, no streamer), `scenes/worldModes.js` (a building's inside: no sky, no star)
and `scenes/dungeonContext.js` (underground) are named and carry none of it, by design (pinned by source, the
serpent's law).

**THE HOSTS DO NOT GROW.** `bootWorld` stood at its ceiling with no room (`test/scenes/hostceiling.test.js`). STAR0 moved
the exterior town map's door out first (`scenes/exteriorAutomapToggle.js`, by `tools/hostMove.mjs` - `01-Overview/Host-Split.md`,
STAR0's move): 67 logical lines freed (36,183 -> 36,116), the ceiling kept; the Starfall's wiring spends less than that.

**As built (STAR4-STAR7).** The Starfall's host reads the world's bindings by name (`createStarfallHost({ renderer,
state, exteriorFoes, ... })` - its settled ones by value, every live one through a getter), so its wiring in `bootWorld`
is the adapter and one hook at each door: the frame, the lights, the draw, the sky, the flash, the senses' candidates,
the compass, the held map, the Timers, the grass, the hub's event and the cell's words. The rewards (`starRewards.js`)
are made by the host on the same adapter; `bootWorld` keeps three hooks for them (the crash's door at a stand-up and the
realm save's two), and the spoils' one lock moved out of it to `scenes/spoilsPool.js` (`spoilsLock`). `bootWorld` stands at
36,170 of its 36,183.

## 12. The merge seam with the Halloween event

The Halloween live event is another session's, not yet pushed when this was written. These add-ons hang off it at ONE
place: `STARFALL_EVENT_KINDS` (`net/starfall/starfallLaw.js`) - the live-event words under which stars fall and the
questline opens. It holds `witchfest`, a live event of its own (`/event witchfest`) so the Starfall can be staged and
tested before the merge. When the Halloween pull request is taken over, its word joins the list (or replaces
`witchfest`, which no build has shipped), and the window's two dates are set to its own.

## 13. Versions and deploy order

Relay first (it signs), then the account service (its migration first), then the client. The relay's version moves for
the frame, the live-event word, the receipt and the hub's door; the account service's for the claim and the questline's
witness. The item law's version does not move: Starglass and the Starspun Weave are new records, never minted before
this, so no finding a law made could be a finding to ask again (its leaf is read beside the registry from the first).

## 14. The slices

| slice | what |
|---|---|
| STAR0 | this page; room in `bootWorld` (the serpent's block moved out) |
| STAR1 | the law: the window, the night, the stars, the waves, the light, the ledger, the receipt (`net/starfall/`) |
| STAR2 | the sites: the covens, the bag, the pixels, the Witches' Night (`systems/starfall/`) |
| STAR3 | the relay: the word, the ledger, the fan, the receipts, the hub (`server/src/index.js`, `net/wire.js`) |
| STAR4 | the world: the star's art, model and pass; the fall; the crater; the beacon; the sounds |
| STAR5 | the defense on the client: the camp, the waves, the ward, the master, the circle, the words to the cell |
| STAR6 | what a player sees: the tracker, the bar, the map, the compass, the timers, the words |
| STAR7 | the rewards: the claim, the service, the spoils, Starglass, the Starspun Weave |
| STAR8 | the questline: The Thirteenth of Frostfall |

## 15. Not done, and why

- **No Discord herald yet.** The gate's and the serpent's posts are the hub's alarm beat; a star an hour would post
  three times an hour. Left for the owner's word on how much of it the channel wants.
- **No lamia.** Daggerfall's lamia never leaves the water (section "The lore").

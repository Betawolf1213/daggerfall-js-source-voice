# Elite Gates - the Elite Breach and the Battlespire's torn halls (EG)

> Design page, written 2026-10-11 before the arc's first slice. The same day it was revised by AUDIT EG0 (five cold
> lanes on the first draft, 177a3acd6, 105 findings, then a sixth lane on the revision, 28 more:
> `01-Overview/Audit-EG0.md`), widened by EG0b (the fragments), and polished by AUDIT EG II (six cold lanes on
> 14b3b172f, 282 findings: `01-Overview/Audit-EG-II.md`). EG-PLAY (section 31) then built the first playable Elite
> Breach - a vertical slice through the slices below, its departures from this page listed in its record. The code's comments cite this page by section number;
> where the page and a pin disagree, the pin is what runs. Each slice adds its record under section 31. A path that
> exists today is written from the repository root (`src/net/gateBrain.js`); a path this arc will create is written
> without `src/` (`net/egLaw.js`).

## What Mac asked for

Mac, 2026-10-11: *"I want to talk about expanding the oblivion gates idea into a procedural endless experience, where
you fight bosses, relentless adds, traverse platforming sections and see how far you can delve with one life on the
line. This would be of elite tier, but like how dungeons recieve 3 tiers. Normal, Elite, and Abyss"*. Then, asked five
questions (the tier reading, the party size, what a death costs, run-only powers, how a run is entered):

1. *"Its basically timed like oblivion gates, but its considered a step above as an elite gate, more challenging and a
   different experience"*
2. *"Party of 8"*
3. *"Checkpoints"*
4. *"Your decision"*
5. *"Yes, a key item you can obtain from regular oblivion gates, a super rare drop from dungeons based on dungeon tier"*

And: *"I want you to make any and all decisions and make this the best content that it can be. Utilize all available
resources, be extremely detailed and dont half ass the work"*. Of the first draft: *"Do a comprehensive audit and
ensure this is the best and most detailed it can be"*. Of the spans: *"I really want to enhance the experience where
sometimes platforms can lead to oblivion caverns, or different types of modeled areas instead of simple platforms"*. Of
the whole: *"Im really looking for AAA grace quality when it comes to everything implemented. Do a detailed polish pass
and audit"*.

So, as decided here (each decision is argued in its section):

- **The gate gets the dungeons' three tiers.** Dagon's Breach (`World-Bosses.md`) is the gate's Regular tier. This arc
  builds the **Elite Breach**, the tier above it. The Abyss tier is named and reserved (section 2).
- **Where it leads.** Canon: the Battlespire was taken by Dagon's legions in 3E 398, then partly destroyed, and the
  Empire sealed its gates with every link to Oblivion broken. **The port's invention**, marked as such: the halls that
  tore away when those links broke fell back along the road the legions came, and the Kyn still hold them as a proving
  ground (section 3).
- **The key: the Weir Key.** In canon, the Imperial Secretary surrendered the Spire's portal keys to the invaders. The
  Kyn carry them still; Dagon's covens hoard them.
  - It is ACCOUNT-HELD: the account service keeps the balance, and the item is its face.
  - The service rolls every drop: from Dagon's Breach (with a pity count), from the Abyss Dungeon's Remnant, from a
    fallen Valkynaz, and very rarely from elite foes in dungeons, by tier (section 5).
- **Timed like a gate.** The arch rises at the opener's feet, sealed for one game hour, then opens for one game hour
  at most. The company answers THE CALL from anywhere outdoors.
  - **The count** starts when the first hall wakes: 30 minutes, +15 for each Redoubt taken, never more than 30 in
    hand. It runs while the company plays and holds while it travels between halls.
  - **The last word** ends every breach three hours after the opening (section 6).
- **A company of eight.** The opener's party when the open reaches the hub, frozen, up to `PARTY_MAX` (8). Only the
  opener spends a key (section 6).
- **Endless, procedural, one hall at a time.**
  - A run is halls, five to a circle. Each circle ends in a **Court**, whose fall takes a **Redoubt**.
  - Each hall is generated from the breach's seed: a made level like the Burning Court and the Shattered Hour.
  - Halls follow a fixed rhythm: fight, traverse, mixed, fight, Court (sections 7-9).
- **Six kinds of hall and a Court** (section 8), the Rift-Yard and the Rampart each in five variants: the Rift-Yard
  (relentless waves), the Span (generated platforming), the Rampart (a walkway under fire), the Athenaeum (a seeded
  Orrery under pressure), the Proving Walk (span, champion, span) and the Deepway (a hall of fragments). Twists turn
  about one hall in four from circle 2, and three Brink halls carry the company from band to band.
- **Fragments** (section 11): modelled areas a course passes through. Oblivion Caverns and nine kin stand across the
  bands as passages, chambers and shafts, each with a hazard of its own; a set-piece passage a band; every platform a
  modelled object; a fork at every span from circle 2 (the High Road over the void, the Low Road through the caverns
  beneath); engines to turn on the legion; and secrets behind false walls.
- **Four bands deep**, retracing the legions' march of 3E 398 in reverse: the Broken Galleries, the Soul Cairn, the
  Shade Perilous, and the Havoc Wellhead, which never ends and deepens by strata (sections 7, 18).
- **Relentless adds the relay runs.** Nine kinds, three of them the gate's own (the Harriers, Sappers and
  Ward-Bearers of its Legion-Lord trial, `World-Bosses.md` section 17), in one wave runner widened from the gate's,
  each kind read by its silhouette (section 12).
- **Thirteen lords and the champions.**
  - Nine Court lords: three in the Galleries, two in each band below, each with three phases and a signature.
  - Four Valkynaz, warrior dukes of Dagon's council, each on its band's own ground with its own kit, holding every
    fifth Court.
  - Three Proving champions, one per Kyn rank, each with its own signature.
  - Every one is its own brain on ONE relay boss seam, and every errand scales from one member to eight (section 13).
- **Five laws keep every blow fair** (sections 11.7, 13.2): the wind-up floor (a shape you can always run out of); the
  union floor (never a trap of several shapes at once, judged in time); the errand floor (every errand works for one to
  eight); the CHECK class (whole-court blows with fixed wind-ups and damage); and THE WIDTH RULE (every aimed blow is
  wide enough for the relay to see).
- **NOTHING GETS FASTER** (Mac, WBX: *"I dont think making mechanics faster is the play"*). Depth adds decrees, kinds,
  pieces, waves and strata. It never shortens a wind-up, a piece's timing or a crumble (sections 13, 18).
- **Decrees** lay Dagon's rules on the next circle, chosen by the company's word from the ones the beacon offers
  (section 14).
- **Vestiges** are run-only powers: three offered at every Redoubt, one taken, Mastery Vestiges that change what a
  member does, and Accords between two members' choices. This page's decision on question 4 (Mac: *"Your decision"*):
  yes. They are capped, never stack eightfold, and death saves recover only at a Redoubt (section 15).
- **Redoubts and the one life**, read through Mac's answer to *what a death costs*: *"Checkpoints"* (section 16).
  - One life a member. A fall is recalled ONCE a breach: at the next Redoubt the living take, or sooner, when a living
    member carries the fallen's Memento to a Battlemage's niche. A second fall is final.
  - The fallen watch as witnesses, with their own camera, pings and a vote.
- **Reliquaries**, sealed at every Redoubt that pays this week and opened only by walking home, are what a company risks
  by going on (section 16).
- **Every hall pays something.** A cache on every trial's end plate, Cantrips to hold, lumen to spend at the Sutler, and
  a limit of two potions a hall that makes the one life matter (section 17).
- **The wall is the count and the last word, not a multiplier.** A model of the pace says where companies stop, and THE
  COVENANT'S PATIENCE lets a Court in progress finish (section 18).
- **The chance, not the promise** (section 19):
  - Spoils and Marks at every Redoubt, paid once a week for each Redoubt; Deadlands Embers at the Valkynaz Redoubts
    and for new depth.
  - THE BATTLEMAGE'S PANOPLY (nine Aetheric pieces, with a pity count and a weekly sale).
  - Each lord's named Legendary, its tavern card, and three feats.
  - Titles and auras by depth. No Gilded piece: the Hourlock stays the one.
- **Two season boards and an all-time one** (section 20), with a weekly Proclamation that changes no seed.
- **Readable by everyone** (sections 25-27): one danger colour that no hall's light shares; shapes that never rely on
  hue; a danger palette for colour-blind players; a telegraph budget that drops nothing aimed at you; sight, sound
  and words for every event; a recap at every run's end.

Daggerfall has no Elite Breach, no torn halls and no other players, so none of this is a DFU member. Its Ledger A row,
ELITE-GATES, is opened by the first file that cites it, and every later file that cites it is added to the row by name
in the same change: `test/doctrine.test.js` fails a file citing Ledger A that no row names (SD2a's record). The row
lists the Spire's departures from DFU: Resurrect refused, Levitate and Slowfall banned, a technique's flight refused on
traversal ground, Stendarr's AvoidDeath refused, a limit of two potions a hall, a jump buffer and a late press, and no
DEATH-PENALTY inside.

## 1. The shape, end to end

```
 a WEIR KEY (account-held) ─► used outdoors, online ─► /v1/eg/open: one staked, an OPEN ORDER signed
   │
   ▼
 the HUB: verifies the order ─► freezes the COMPANY from its party record (≤ 8) ─► EG_INTERNAL_OPEN to eg:<b>
   │ the ARCH rises at the opener's feet: sealed 1 game hour (5 real min)
   │ OPEN ≤ 1 game hour: the opener steps through the arch; the company answers THE CALL from anywhere outdoors
   │ each member: /v1/eg/admit ─► an ADMIT ORDER ─► the room spends it ─► the first hall is built behind the veil
   ▼
 the first hall WAKES (the count starts) ─► the arch sinks behind the company
   │
   │  each hall: ARRIVAL ─► GATHER 8 s ─► the TRIAL ─► the DOOR ─► the CLOSING (20-45 s) ─► the PULL ─► the SWAP
   │  the rhythm:  fight · traverse (a Span through fragments, or the Deepway) · mixed · fight · the COURT
   │
 the COURT's lord falls ─► a REDOUBT taken
   │  ├─ an e1 RECEIPT to every living EARNER: the depth, the week's spoils, Marks, embers for new depth
   │  ├─ a sealed RELIQUARY to each earner whose Redoubt pays this week
   │  ├─ the COUNT +15 min (30 in hand at most); the REST holds the count
   │  ├─ three VESTIGES offered, one taken; the next circle's DECREES chosen
   │  ├─ the FALLEN recalled (once each)
   │  └─ the WAY HOME (pressed, never walked into): leave, keeping all, the Reliquaries opened
   ▼
 ... Hall 25: a VALKYNAZ ─► Hall 26: a BRINK ─► ... the Havoc Wellhead and its strata, without end
   │
   ▼
 the END: every member out (fallen twice, forsaken, gone home), a WIPE, the COUNT spent (the tear),
          THE SEAL, the LAST WORD or a VOID ─► each entrant's end receipt and the RECAP ─► the room keeps its tombstone
```

## 2. The tiers of the gate - Regular, Elite, Abyss

The dungeons have three tiers and one law that names them: `dungeonTier` in `src/systems/dungeonTier.js`, with the
words *Regular Dungeon*, *Elite Dungeon* and *Abyss Dungeon* (ABYSS-NAME). Mac said *"Normal"*; the player reads
*Regular*, the word the game already shows (`DUNGEON_TIER_TEXT`). The gate gets the same shape: one leaf law,
`systems/gateTier.js` (EG1), with `gateTier(x)`:

| tier | code | the event | what it is | built |
|---|---|---|---|---|
| Regular | `'regular'` | **Dagon's Breach** | the world boss on the shared clock: one a game day, everyone, the Warden | shipped (WB) |
| Elite | `'elite'` | **Elite Breach** | a key's breach for one company: the torn halls, endless, one life and its one recall | this arc |
| Abyss | `'super'` | **Abyss Breach** | reserved; the code keeps `super` for the Abyss tier, as the dungeons do | NOT this arc |

`GATE_TIER_TEXT` holds the words. The Regular tier's word is its own name, because the event already has one. Shown:

- **the arch's plaque** (World Tooltips): *Elite Breach*, sub *The Battlespire*; to anyone outside the company, a
  second sub *<opener>'s company*;
- **the sight line**: *You see an Elite Breach 140 metres to the North!* (the Elite Dungeon's line, its law);
- **the Timers row** (`eventTimerRows` in `src/systems/eventTimers.js`, a new kind `'elite'` beside `'gate'` and
  `'super'`, the company's alone): *Elite Breach opens 4:12*, then *Hall 17 - 24:10 left*;
- **the held map**: the arch's mark for the company while it stands (it is not a place in MAPS.BSA);
- **on entering a hall**: the arrival card (section 27.3).

**Why the Abyss tier is not built here.** The Abyss Dungeon's Rift is already the otherworldly door at the top of the
content: one Hollow at a time, for the whole world. An Abyss Breach would be the pinnacle of the gate's own ladder, a
world-scale event and not a company's. It is named so it is not mistaken for missing. The tier law answers `'super'`
for nothing until it is built.

## 3. The lore - canon, and what the port adds

The gate's own lore law (`World-Bosses.md` section 19) is binding. The Covenant of Akatosh bars every Prince from
forcing a door into Tamriel; it never barred a door opened from within, and it fights every breach. The port's shipped
book on the breaches (`src/systems/portBooks.js`) is canon for this game. Three of its lines bind this page:

- *"No Prince walks through such a wound himself. He sends a lord of his house... a Dremora of the rank they call
  valkynaz."*
- *"Should the Warden fall... the breach fails at once. It is his will that holds the door."*
- Of the Battlespire: *"his legions took the Battlespire itself... and held it until a single apprentice drove them
  out."*

**Canon** (UESP: Lore:Battlespire, Lore:Weir Gate, Lore:Kyn, Lore:Soul Cairn, Lore:Shade Perilous, Lore:Havoc Wellhead,
Lore:Imago Storm):

- The Battlespire was the war academy of the Imperial Battlemages and a testing ground for the Imperial Guard: a
  void-castle in a slipstream realm, with a council whose masters bore titles such as Armsmaster and Spellmaster.
- The Impostor, Jagar Tharn, gave it to Mehrunes Dagon. In 3E 398 Dagon's legions, led by Imago Storm of Clan Dremora,
  mustered in the **Havoc Wellhead** (whose arena hosted honourable fights between clans), rampaged through the
  **Shade Perilous** (a pocket realm of Nocturnal's Evergloam) and the **Soul Cairn** (the Ideal Masters' realm of
  the dead), and took the Spire, killing nearly every Battlemage.
- The Imperial Secretary surrendered the Spire's **portal keys**, and the invaders sealed its **Weir Gate** against
  the Legion with Dagon's own sigil.
- An apprentice drove them out. The Spire was partly destroyed; the Empire reclaimed the ruins and sealed its gates,
  every link to Oblivion broken. Imago Storm later turned on his Prince.
- The Dremora, the Kyn, keep eight major ranks: Varlet, Churl, Caitiff, Kynval, Kynreeve (a clan's officer or
  sheriff), Kynmarcher (the officer of a citadel or outpost, the lowest called lord), Markynaz (a grand duke) and
  Valkynaz (a warrior duke of his Prince's council). Valkynaz Ruhn, the Warden, is one.
- Dagon gave the Dark Seducers (Daggerfall's Daedra Seducer) their bat wings. The Fire and Frost Daedra are clans of
  their own, and rivals.

**The port's invention** (said so, everywhere it is said):

- **The torn halls.** When the Spire's links to Oblivion broke, the halls that hung on them tore away. They fell back
  along the road the legions came: the Soul Cairn, then the Shade Perilous, then the Havoc Wellhead itself. The
  Imperial ruin stays sealed. The Elite Breach goes to what tore away, and to descend it is to walk the invasion of
  3E 398 backwards (the bands, section 7). They did not fall as stepping stones: whole caverns of the Deadlands,
  collapsed wings of the academy and the vaults of the dead came with them, and a course passes through them (the
  fragments, section 11).
- **The Kyn hold them as a proving ground**, as the Wellhead's own arena was one. The Spire was a proving ground for
  the Battlemages too. A Dremora rises in rank by holding a Court there, so the deeper halls are held by higher ranks:
  Kynreeves, then Kynmarchers, then Markynaz, and a Valkynaz at every fifth Court. These are the Kyn who stayed
  Dagon's when Imago Storm did not.
- **The Weir Keys.** The portal keys the Secretary surrendered still open the Weir Gate's road from this side. That
  road no longer reaches the sealed Spire; it reaches its torn halls. The Kyn carry the keys as trophies: Ruhn wears
  one, which is why his fall can drop one, and so does every Valkynaz of the halls. Dagon's covens hoard others in the
  deep places, which is why the hardest dungeons give them up likeliest.
- **The door is the key's, not a lord's.** Dagon's Breach is held by the Warden's will, and fails when he falls. The
  Elite door is held by the key and by the Battlemages' old Redoubts, so felling a lord does not close it. Each Redoubt
  taken makes the door more the Battlemages' own, and the Covenant presses on it less: the count gains time. In the
  first circle no Redoubt is taken yet, and the count's thirty minutes are the key's own strength. When the count is
  spent, the Covenant tears the door shut, though a lit Court's fight holds it a while (THE COVENANT'S PATIENCE,
  section 18). The last word is the most any key can hold against it.
- **The Vestiges** are what the Battlemages left in their Redoubts: a lesson that clings to whoever takes one, until
  the breach closes.
- **The raised masters.** Two of the Spire's council, killed in 3E 398, were raised as undead by the Kyn and bound to
  their Courts: the Last Spellmaster and the Last Armsmaster.
- **The Annals of 3E 398** (section 11.10): thirty pages the Battlemages left in the torn halls, found behind their
  false walls. Each is the port's own, two sentences long, and never contradicts the canon above.

## 4. The words

The words most likely to be misread: what each means on this page and in the game, and what it is NOT. AUDIT EG0's
word lane and AUDIT EG II's checked every new word against `src/` and the player's existing vocabulary.

| word | means | is not | why this word |
|---|---|---|---|
| **Elite Breach** | the event: a key's breach | "Oblivion Gate" (retired by WB12) | the gate tier's word |
| **Elite Gates** | this arc's name only; never player text | the event | - |
| **the gate** | Dagon's Breach and its systems (`World-Bosses.md`): its model, court, trials and brain | the Elite Breach's arch | WB12 |
| **the arch** | the Elite Breach's door at the opener's feet: the gate's model at 0.62 scale, white marble and gold | the gate | - |
| **the Battlespire**, **the Spire** | where the torn halls came from | the sealed Imperial ruin | canon place, invented fate |
| **the Burning Court** | Dagon's Breach's made level and its rules (`src/systems/courtRules.js`) | an Elite Court | - |
| **Weir Key** | the key item, template 575, account-held | a sigil stone (retired by WB12) | canon's portal keys and the Weir Gate |
| **the balance** | how many Weir Keys an account holds | - | - |
| **a stake** | a key held against a breach until it settles | - | CARDS6's stake orders |
| **the company** | the opener's party, frozen at the hub when the open is accepted (section 6.1) | the party later | - |
| **the opener** | the member who used the key | - | - |
| **the open**, **the opening**, **the open window** | the open request; the moment the room accepts it (the arch begins to rise); the hour after the rise in which members may enter | the phase name `'open'` | - |
| **hall**; **Hall 12** | one level of the run; numbered when named | a guild hall | lowercase in prose |
| **circle** | five halls, the fifth a Court | - | - |
| **slot** | a circle's place 1-5 in the rhythm | a hall's stage | - |
| **stage** | a hall's part: arrival, gather, trial, door, closing, pull | a slot; a lord's phase | - |
| **trial** | a hall's challenge, from its wake to its door | the gate's trials (its boss modifiers) | - |
| **the wake** | the moment a hall's trial begins | a relay re-woken | - |
| **the closing** | the window after a hall's door opens, before the pull | a lord's fall | replaces "the descent" (AUDIT EG II L5-7) |
| **the pull** | the closing's end: everyone left is pulled down, at the toll's cost | - | - |
| **the swap** | the hall-to-hall transition behind the veil | a dungeon transition | section 7 |
| **Court** | a circle's fifth hall, where its lord stands; capitalised | a court disc (lowercase); the Burning Court | the gate's own word |
| **court disc** | a round fight floor | a Court | - |
| **lord** | a Court's boss | "Kyn" (only Dremora are Kyn) | AUDIT EG0 L5 |
| **champion** | the Proving Walk's foe, one per Kyn rank | the title *Spire Champion* | - |
| **Kynval elite** | one of a Kynval Squad's four | a champion | - |
| **Redoubt**; **Redoubt 5** | the checkpoint a Court's fall takes; its beacon is lit | a Ward-Bearer's ward | "redoubt" is unused |
| **R** | in a formula, a Redoubt's number | the blow kind `r`; a radius (`r 14`) | - |
| **the count** | the breach's timer | the key balance; the relay's census | - |
| **the census** | `BOSS_BODY`'s body count (`src/net/bossBody.js`) | the count | - |
| **the last word** | the three-hour bound on any breach | - | - |
| **the tear** | the count spent: the Covenant shuts the breach | a fall | - |
| **a fall**; **a final fall** | a member's death or 180 s absence in a trial; the second, or any with no recall left | a cast-back | - |
| **a wipe** | no living member: the breach ends | - | - |
| **a cast-back** | the void returning a member to their last island or plate, at a cost | a fall | - |
| **an island** | a span's rest point between sections; a cast-back returns there | a Redoubt | "checkpoint" is the Redoubt's |
| **the recall** | a fallen member's one return a breach | Recall the spell | - |
| **Memento** | the gold mote a fall leaves, carried to a niche (section 16) | - | - |
| **witness** | a fallen member who watches the run | - | - |
| **forsake** | a witness leaving for good | the way home | - |
| **bequest** | a fallen member's Vestige offered to the living | - | - |
| **the way home** | the Redoubt's pressed arch: leave, keeping all, the Reliquaries opened | the tear | - |
| **earner** | a member whose part in a circle earns its receipt (section 16.1) | an entrant | - |
| **entrant** | anyone admitted to the breach | - | - |
| **landing** | where a member answered the call; a fall or the end lands them there | the arrival plate; by context also a blow's landing (when it lands) and the Drop's landing (its floor) | - |
| **the rest**; **a respite** | a Redoubt's 90 s pause; a longer pause, spent from the respite budget | the others | - |
| **Surplus** | five minutes the count's cap turned away, spent at a Redoubt | - | - |
| **decree** | a rule laid on the next circle (the code's *marks*) | a Sigil Set (Dagon's Brand); Marks the currency | "brand" collided three ways |
| **tide**; **stratum** | the Wellhead's per-circle rule past circle 20; a rule that joins for good at Redoubt 20 and every fifth after | a decree | - |
| **Proclamation** | the week's one rule, from circle 1 | a seed | - |
| **Vestige** | a run-only power | a Vestige aura; a cosmetic aura | - |
| **Mastery Vestige**; **Accord** | a Vestige that changes what its holder does; a bonus two members' Vestiges grant together | - | - |
| **Stone, Blade, Hunt, Arcana, Fellowship** | the Vestige families | the Sigil Sets' Bulwark, Brand, Shroud, Mantle | - |
| **Reliquary** | a sealed spoils roll, opened only by the way home | - | - |
| **cache** | a trial's end-plate reward | a Reliquary | - |
| **Cantrip**; **lumen**; **the Sutler** | a run-only consumable; the run's currency; the Kyn quartermaster who sells for it | - | - |
| **the Span**; **a span** | the traverse hall kind; any platform course (a Span's, a Proving Walk's, a side span) | - | - |
| **piece** | one kind of span platform or hazard (section 10.3) | a Panoply piece | - |
| **the Drop** | the piece that drops to a walled landing | the closing | renamed from "Descent" (AUDIT EG II L5-7) |
| **fragment** | a modelled area a course passes through: a **passage**, a **chamber** or a **shaft** (section 11) | a shader's fragment (the code says `egFrag`) | the halls fell in fragments |
| **fight floor** | a flat floor where blows may land | traversal ground | - |
| **traversal ground** | platforms, stairs, ledges and passages' walkways: never aimed at | - | - |
| **the High Road**, **the Low Road** | a span's fork: over the void, or through the caverns beneath | - | - |
| **the Deepway** | a hall built of fragments end to end | - | - |
| **engine** | a hall's interactable that turns on the legion | the Bound Colossus | - |
| **errand** | a lord's coordination mechanic (runes, gems, seals) | - | - |
| **CHECK** | a blow with fixed wind-up and damage (section 13.2) | - | - |
| **the escape build**; **the span build**; **the fast build** | Speed 40/Running 20; Speed 10/Running 0; the fastest legal (section 10.2) | - | - |
| **fury** | a slow fight's growing pressure (section 13.2) | speed | - |
| **aspect** | a lord's element (`GATE_ASPECTS`) | a decree | - |
| **the legion** | the adds | the Imperial Legion | lowercase |
| **the Legion-Lord** | the gate's ninth trial, whose host the relay runs (`World-Bosses.md` section 17) | a lord | - |
| **ward** | the shield a Ward-Bearer holds on what it guards | a Redoubt | - |
| **Marks** | the guilds' combat currency (`src/net/marksLaw.js`) | decrees (the code's marks) | - |
| **Deadlands Embers** | the Broker's currency | lumen | - |
| **arrow** | a bow's blow kind | a shaft (a fragment class); the HUD's peril arrow | - |

**Imported words**, defined on other pages: the Hour (the Shattered Hour), the Remnant (the Brass Remnant), a Hollow,
the Steps (the Unmoored Steps), all in `Super-Dungeons.md`; the Warden (Valkynaz Ruhn) in `World-Bosses.md`; the
serpent in `Sea-Serpent.md`.

**Capitalisation.** Court, Redoubt, the band names, hall kinds (the Span, the Rampart), fragment names (the Oblivion
Caverns, the Fallen Stacks), piece names (a Drift, a Pendulum), twist names, the Kynval Squad and the Proving champion
are capitalised. Hall, circle, decree, the count, the legion and a proving court are not, except when numbered or named
(*Hall 12*, *Redoubt 5*).

**The shouted rules.** A rule's name is shouted wherever it names the rule: THE WIND-UP FLOOR, THE UNION FLOOR, THE
ERRAND FLOOR, THE CHECK CLASS, THE WIDTH RULE, NOTHING GETS FASTER, THE ENVELOPE, THE TIMED SOLVER, THE FORK, THE GOLD
RUN, THE CALL, THE SWAP, THE TELEGRAPH BUDGET, THE SPIRE DANGER EDGE, THE EDGE LINE, THE SEAL, THE POTION LAW, THE
COVENANT'S PATIENCE, THE QUIET COMPANY, THE FALL, THE RECALL, THE WITNESS VIEW, THE FAIR TRAIL, THE HOLD, THE DRAIN,
THE COUNT CHIP, THE RECAP, THE REHEARSAL, RIDDEN POSES, THE SPIRE MIX, ROLE READS.

## 5. The Weir Key

**The item.** Template **575**, free today (the gate's 570-572 and the Ayleid stones' 573-574 come before it). It is a
row beside `PORTAL_STONE_TEMPLATES` in `src/systems/gateSpoils.js`:

- `{index:575, baseWeight:0.25, hitPoints:1000, basePrice, rarity:20, bound:true, stackable:true}`, in the miscellany
  group (`UselessItems2`), never a gem (PORTAL1's lesson: every Gems piece is a crystal a slot takes);
- its art: a key of black iron and gold, painted in code into the Spire's first pseudo-archive (section 25), which
  EG1's registry holds. EG2 ships it with that art, never a borrowed record, because Port-Doctrine allows no
  placeholder shipped silently;
- named in `BOUND_TEMPLATES` (`src/net/realmTradeLaw.js`), so the realm's trade refuses it as the client does;
- its line: *One of the Spire's portal keys, surrendered to the Kyn in 3E 398. It opens the Weir Gate's road from
  this side.*

**The balance is the account's.** Every dungeon drop is the client's own `Math.random`: the Integrity arc's ledger
(`06-Systems/Integrity-Arc.md`) measures it after the fact and does not enforce. A key from a forged drop would open a
real relay instance, so the key is a service-side balance and the item is its face.

- `players.eg_keys` (migration, EG2) is the balance. The service-side precedent is the Broker's purse: `insigniaPurse`
  over `EMBERS_EARNED_SQL`, which is gate and serpent embers less `insignia_spent` (`server-account/src/accounts.js`).
- **No code today restacks a pack to a service count.** `restackStones` is SS1's load-time fold in the save, and on
  an insignia sale the client simply takes the stones from the pack. EG2 builds the restack: every service answer
  that carries the balance (`/v1/eg/keys`, a claim, an open) sets the Weir Key stack on the account's character to
  the balance, single-flight and coalesced (ASYNC NEVER DROPS).
- A key the service does not count does nothing (*The key turns to rust.*) and the stack is restacked.
- It is bound to the account, never traded, and never lost to a death.

**Where they come from.** The service rolls every one with its own `rand`, at a claim it already verifies. This is
the `sdHonoursRoll` way: AUDIT SD III R4 moved the Hour's honours off the receipt seed because the page can read the
seed. `claimGate`'s context gains `rand`, which it lacks today (`claimSd`'s has it).

| source | when the service rolls | odds | what that means |
|---|---|---|---|
| **Dagon's Breach** | `claimGate`, a recorded kill (`earned != 'rite'`) | **1 in 6** | at one or two gates a real day, a key every three to six days |
| **...having broken the rite** | the same, with `r=1` | **1 in 4** (instead) | the rite is the gate's harder half (WB12d) |
| **...the first ever** | the account's first `gate_kills` row with `earned != 'rite'` | **certain** | every gatebreaker sees the Spire once |
| **...the pity** | after `EG_KEY_PITY` (5) recorded kills in a row without a key, the sixth gives one (`players.eg_key_miss`) | **certain** | nobody goes a week of gates with nothing: (5/6)^12 left 11% with no key in twelve kills |
| **a Valkynaz's Redoubt** | `claimEg`, a `w` receipt for a Valkynaz's Redoubt | **1 in 4**, at most one a week (`EG_VALK_KEYS_PER_WEEK`) | the Kyn wear the keys (section 3): a company deep enough keeps itself in keys |
| **the Abyss Dungeon's Remnant** | `claimSd`, a recorded Hour | **1 in 3** | the hardest fight the port has, witnessed by the relay |
| **an Abyss Dungeon's elite foe** | `/v1/eg/find`, below | **1 in 60** | six elites a Hollow: about one Hollow in ten |
| **an Elite Dungeon's elite foe** | `/v1/eg/find` | **1 in 150** | three or four a dungeon: about one in forty |
| **a Regular Dungeon's elite foe** | `/v1/eg/find` | **1 in 400** | one dungeon in five has one: about one in two thousand |

**The first breach's mercy.** An account's first opened breach that ends before its first Redoubt is taken returns its
stake, once ever (`players.eg_mercy`). A solo player who falls in Hall 2 has learned the Spire, not lost a week. It is
the BREACH's end, not the opener's: the relay says so on the end receipts of a breach over with no Redoubt taken (`nr`,
section 23), and the opener's own end before that word - a fall, a forsaking while the company plays on - holds the stake
for it, so the company's Redoubt 1 spends it. The first is the first key the account staked that the Spire kept: a
breach a void gave back whole is not counted (AUDIT EG III).

**The dungeon's find.** No relay witnesses an ordinary dungeon, so the killer's client asks for the find. When an
elite foe (`eliteFoe`) dies in a dungeon online:

1. **who asks**: the death handler (`registerEnemyDeathHandler`, the seam `dropFoeCard` uses for a foe's card) runs
   on the foe's owner, which names the striking joiner's peer id on the foes stream (`_killedBy`, the record's `v`,
   for `KILLED_BY_MS`). The client whose `selfId` it names asks `/v1/eg/find` with the dungeon's tier, not the
   owner's. When `v` is null the owner struck, and asks itself;
2. **the roll**: the service rolls at that tier's odds;
3. **a yes** adds one to the balance and throws the item from the body, as a card is thrown.

A forged client can lie about a kill and a tier, so:

- asks are capped at **6 a tier, per account, per real day** (`EG_FIND_PER_DAY`). At the cap a forger's ceiling is
  6/400 + 6/150 + 6/60 ≈ **0.155 keys a day**, under an honest gatebreaker's 0.17-0.5;
- finds pay at most **2 keys a week** (`EG_FIND_KEYS_PER_WEEK`);
- `/v1/eg/find` and `/v1/eg/open` both need a handle and either a non-rite `gate_kills` row or a Redoubt taken, so a
  fresh account cannot farm or open.

The Integrity arc's budget measures the asks.

**The launch gift.** When EG2 ships, every account with a non-rite `gate_kills` row gets one key. The migration adds
it to `eg_keys` itself, and a server-post letter (`server_post`) only words it, *From the Battlespire*. The send is
HOURS-FIRST's precedent (migration 0094). PORTAL-GIFT is not: it is a client-side gift given at save load.

**Using it.** Use is a registered arm (`registerItemUseHandler` -> `{kind:'openBreach'}`), routed on every reader as
the Portal Stone's is. Its refusals, in order, each a line of `EG_TEXT`:

1. offline, or on the `?exterior` bench: *The key is cold here.*
2. not in the open world (an interior, a dungeon, a made level): *The key wants open sky.*
3. the Portal Stone's holds (`portalHold` in `src/systems/portalStone.js`: busy, duel, siege, enemies, journey),
   water, or a boat;
4. inside a location's own footprint (a town's walls, a farm's yard): *Not within <place>.*
5. within 300 m of a standing Dagon's Breach, or 150 m of another Elite arch: *Another breach stands near.*
6. the opener already in a breach, or with a stake unsettled: *You hold a breach already.*
7. the hub at `EG_LIVE_MAX` live breaches, or a deploy's drain (section 22): *The Spire's road is shut. Try again
   soon.*
8. no room for the arch: the Portal Stone's `portalPlace` law (ground probe, wall gap) at the arch's clearance,
   `EG_ARCH_CLEAR_M` 8 m: *There is no room for it here.*

Then the **start window** asks where in the Spire:

- **the choices**: *Hall 1*, and every Redoubt the opener may start at (section 16.6), deepest first, each named with
  its band (*Redoubt 12 - the Soul Cairn*);
- **the company's ticks**: a preflight (`/v1/eg/starts`) answers, for each member of the opener's party, which starts
  they may make. Each choice shows a tick or a cross per member. A start some member cannot make asks once: *Go
  without Mara?*;
- **the stake**: *Weir Keys: 3 - one will be staked.*;
- **the Wager** (section 18): up to three decrees of the company's choosing, from three families, for the whole breach;
  a wagered breach ranks on the Depths alone, and the order carries it (`wg`);
- **the Rehearsal** (section 27.7): *Rehearse - Halls 1-5, no key* (once a real day);
- **the classic skin** asks with DFU's DaggerfallListPickerWindow (`src/ui/listPicker.js`, PICK00I0.IMG; the boat
  variant picker is the precedent), so the native-window rule holds: a list of DFU's own, no free-styled geometry;
- **the enhanced skin** asks with `src/ui/enhancedPicker.js`;
- **a warning line**, when one of the opener's quests falls due before the last word (36 game hours, three real
  hours): *A quest falls due before the breach can close.*

The answer goes to `/v1/eg/open` (section 23), which stakes one key.

## 6. The breach - the company, the count, the arch, the call

### 6.1 The company

- **Who.** The opener's party at the moment the HUB accepts the open, from the hub's own `party:` record.
  - The hub is the one room every client always holds, and it already keeps the rosters, so no other room needs to
    ask it anything and its silence cannot freeze the wrong company.
  - The company is FROZEN there, up to `PARTY_MAX` (8). One who joins the party later is not in it; one who leaves the
    party is still in it.
  - A party of one is a company.
- **Numerals.** Each member takes a numeral I-VIII at the open, in the party's order. It is drawn over their head in
  Battlemage blue, on their party row and on every errand they are given (section 13.2).
- **Admission** (section 23):
  - Each member asks `/v1/eg/admit` and gets an **admit order**. The service checks:
    - a handle (no guests: the Spire's feats are recorded);
    - that the member may start at the breach's start Redoubt (section 16.6);
    - no other live breach (`eg_live`);
    - that the breach is one an open staked, its stake unsettled and its open window not past (refused `breach`,
      `spent` - AUDIT EG III: an id no open staked read as a Hall 1 start, and a late ask locked its asker out).
  - The member's hello to `eg:<b>` carries the order. The room spends it once, then checks the member is in the
    company, not fallen twice, not forsaken, not gone home, the open window, and that the order's start is the breach's.
  - The level claim (`lv`, 1-60) is frozen at the first admission.
- **Outside the company.** Touching the arch: *The breach answers only to <opener>'s company.*
- **One breach at a time** for every account, opener or member, enforced by the service's `eg_live` (section 23).
- **The absent.** A member whose socket is gone keeps their body at its last pose (the socket flap rule, section 22).
  - They are counted fallen only after **180 s gone in a trial** (`EG_ABSENT_TRIAL_S`), counted from the trial's wake.
    Absence on the stair or at a rest never counts. A reload, or a slow machine on the stair, is not a fall.
  - An absent body is never chosen as a target. A shape aimed at another member still lands on it, so a tab closed
    before a blow is not a life saved.
  - Their party row shows an amber ring draining the 180 s (section 27.4).
- **Return.** A member whose page reloaded is offered *Return to the Spire* (section 22), into the current hall.

### 6.2 The clock - the count

On the shared clock (`sharedClassicMinutes`: a game minute is 5 real seconds, a game day 2 real hours). The breach
counts from **the opening**, the moment the room accepts the open order, as the gate counts from its day:

| phase (`egPhase`) | game | real | what |
|---|---|---|---|
| **rising** | - | 20 s | the arch climbs out of the ground (`GATE_RISE_MS`) |
| **sealed** | to 60 min from the opening | to 5 min | the arch stands sealed: *The breach opens in 4:12.* The company gathers. (The gate's own rise-to-open is the same hour.) |
| **open** | until the first hall wakes, at most 60 min more | at most 5 min | the opener steps through; the company answers the call |
| **deep** | from the first hall's wake | - | the count starts at 360 game min (30 real min): *The count: 30:00.* The arch sinks |
| **torn** | when the count is spent | - | *The Covenant tears the breach shut.* Everyone inside is cast out to their landing |
| **ended** | - | - | the room mints the end receipts and keeps its tombstone |

What moves the count:

| event | the count | rule |
|---|---|---|
| a Redoubt taken | +180 game min (+15 real min) | `remaining = min(remaining + EG_REDOUBT_HOLD_MIN, EG_COUNT_CAP_MIN, lastWord - elapsed)` |
| THE GOLD RUN (section 8.2) | +12 game min (+1 real min) | past the cap, it counts toward a Surplus |
| the closing | runs its first `EG_CLOSING_COUNT_S` 15 s, then HOLDS | a straggler costs the company 15 s, not 45 |
| the pull to the wake (the swap and the gather together) | HOLDS, at most `EG_STAIR_HOLD_S` 40 s | a slow machine's loading is never the company's time |
| the rest (90 real s) | HOLDS | *The Redoubt holds the count* is shown by the count's chip, never said |
| a respite | HOLDS | from the breach's respite budget (below); the last word does not hold |
| a deploy's hold (section 22) | HOLDS | the gap is given back |
| a Court's fight when the count is spent | THE COVENANT'S PATIENCE (section 18) | the Court finishes under the Covenant's Weight |

Constants (`net/egLaw.js`): `EG_RISE_MIN` 60, `EG_ADMIT_MAX_MIN` 60, `EG_COUNT_START_MIN` 360, `EG_REDOUBT_HOLD_MIN`
180, `EG_COUNT_CAP_MIN` 360, `EG_REST_S` 90, `EG_CLOSING_COUNT_S` 15, `EG_STAIR_HOLD_S` 40, `EG_RESPITE_BUDGET_S` 900,
`EG_RESPITE_VALK_S` 600, `EG_LAST_WORD_MIN` 2160. `egTimes(rec)` answers every phase's relay time and `egPhase(rec,
ms)` the phase: `'rising' | 'sealed' | 'open' | 'deep' | 'torn' | 'ended'`. These are `gateTimes` and `gatePhase`
again, for a record instead of a day.

**The respite budget.** Every breach has `EG_RESPITE_BUDGET_S` (900 s, 15 minutes) of respite, and each Valkynaz
Redoubt adds `EG_RESPITE_VALK_S` (600 s). It is spent at any Redoubt, in pieces, by the company's word (section 16.4):
the count holds while it runs, the last word does not. A three-hour run with one life must leave room for ordinary
life; FFXIV's deep dungeons save between sets of floors for the same reason.

**The surplus.** Time the cap turns away is not wasted. Every 5 real minutes the cap refuses becomes a **Surplus** (at
most `EG_SURPLUS_MAX` 3). At any Redoubt, a Surplus buys a fourth Vestige card or a reroll of the three. A fast company
is paid for its speed in choices, not in hours.

**Why the count is shaped so.** "Timed like oblivion gates" is a window with an end the company can see coming, and an
endless run needs that end to come from the run:

- a fixed window would cap every company at the same clock;
- a count that only grows would let a perfect company stand in the Spire for ever, and the relay pays for every awake
  second (RELAY-H1);
- with thirty minutes to start, fifteen for each Redoubt and thirty in hand at most, early circles bank time (and
  Surplus) for a company faster than reference, and deep circles drain it;
- the count runs while the company plays and holds while it travels, so a phone's loading or a straggler on the stair
  is never the company's time.

How deep a company gets is where its pace meets the Spire's (section 18). The tear is not a death: nobody is killed,
no DEATH-PENALTY runs, and what was banked stays banked. The Reliquaries are lost (section 16.3).

### 6.3 The arch

The gate's own model, `buildGateModel` in `src/world/gateModel.js` (Mac's Blender bake), drawn at **0.62 scale**:
10.04 m tall and 4.79 m to each side.

- **The skin**: Imperial white marble inlaid with gold, cracked through with the Warden's basalt.
- **The pass** (`src/render/gatePass.js`) compiles the membrane's colours and the arch's heights into its shader, and
  the beacon's column with them: it runs `BEACON_HEIGHT_M` (1200) from `BEACON_BELOW_M` (400) under the foot, so it
  stands 800 m over the ground, its light starting at `BEACON_START_M` (15). Its colour is the uniform `uColor`, set
  once a frame from `BEACON_COLOR` before the loop over the gates, and its `draw()` takes at most `GATE_PASS_MAX` (2)
  gates. EG9 widens it: the membrane's tint and scale, and the beacon's height, foot (scaled with the arch, so its
  light starts at the lintel) and colour, become per-draw values set inside the loop; the gate's own draw passes the
  gate's. `GATE_PASS_MAX` rises to 4, since the day's gate and several arches can stand in one view.
- **The beacon**: gold, standing 400 m over its foot, half the gate's 800, seen from kilometres away. A company's door
  should not outshine Dagon's.
- **Rising and sinking**: it climbs out of the ground over `GATE_RISE_MS` (20 s) and sinks over `GATE_COLLAPSE_MS`
  (10 s).
- **Its clearing**: `createGateClearSweep` (`src/world/gateClearance.js`) tracks one key today. EG9 widens it to a set
  of keys, the clock's gate and every standing arch, each keyed by its breach id.
- **Where it stands**: at the opener's feet, ahead (the Portal Stone's `portalPlace`, `PORTAL_AHEAD` 2 m), facing the
  opener.
- **How peers see it**: the hub's signed call travels on the opener's world cell (section 23) while the opener stands
  there. Peers stand only an arch whose call verifies, at most two a cell, so no client can stand a false arch under
  another's name.
- **How long it stands**: through the rising, the sealed hour and the open window only. When the first hall wakes, the
  arch sinks behind the company. A breach is a door, not a monument, and nothing outside needs to stand for three hours.
- **What the room keeps**: the arch's site in its state, so a cast-out member is landed at it with the arch gone.

### 6.4 The call

Eight players across the Bay cannot all walk to one arch in ten minutes. So the company **answers the call** (THE
CALL):

- **The opener** steps through the arch.
- **Every other member**, standing outdoors in the open world during the open window (the Portal Stone's holds
  apply), may answer. The Portal Stone's portal (`src/scenes/portalGates.js`, drawn with `src/scenes/portalFx.js`'s
  vortex) opens at their feet for `PORTAL_OPEN_MS` (30 s, `src/systems/portalStone.js`), and stepping into it is their
  admission.
- **The word.** The hub tells the company `{t:'eg', k:'call', b, ew, site, riseAt, openAt, sg}` on the party channel,
  `sg` being the hub's signature over the rest. Each member's client then:
  - sounds a horn and writes one chat line, *<opener> opens an Elite Breach.*;
  - shows a prompt that stays until answered or the window ends, *Answer the call - 4:12* (Enter, the pad's A, or a
    tap), and comes back after any window closes over it;
  - marks the arch on the compass;
  - indoors, reads *Answer from open ground.*
- **Answering** asks `/v1/eg/admit` for the order the portal is stepped through with.
- **Admission never depends on place**: the room checks orders and the company, never where a member stood.
- **Landing**: where each member answered is stored as their LANDING. A fall, the way home, the tear or the end lands
  them there. The opener lands at the arch's site: `gateLandingFor` (`src/world/gateArena.js`) is widened to take an
  arch record (a site and a yaw), since today it takes only a gate's day.
- **Late.** A member who answers after the open window reads: *The breach has closed behind <opener>'s company.*

## 7. A run - halls, circles, bands, the stages

**Halls and circles.** Hall *h* (1, 2, 3...) belongs to circle *c* = ceil(*h*/5). Halls 5*c*-4 to 5*c*-1 are the
circle's four trials. Hall 5*c* is the **Court**, whose fall takes **Redoubt c**. A breach that starts at Redoubt *R*
begins at Hall 5*R*+1, *the first hall* of that breach.

**The rhythm.** Every circle fills the same five slots, so a company can feel its place:

| slot | kind of hall | drawn from |
|---|---|---|
| 1 | **fight** | the Rift-Yard or the Rampart, in one of its variants; in circles 6, 11 and 16, a Brink hall (section 8.9) |
| 2 | **traverse** | the Span; from circle 3, the Deepway one time in three |
| 3 | **mixed** | the Proving Walk, or the Athenaeum (at most one a circle, never in circle 1) |
| 4 | **fight** | the Rift-Yard or the Rampart, drawn apart from slot 1: never the same kind and variant twice running |
| 5 | **the Court** | the circle's lord (section 13) |

**The first circle** is fixed while any admitted member has never taken Redoubt 1: a Rift-Yard, a Span through an
Oblivion Caverns passage (a fire-fall curtain, a chasm on ledges, an opening onto the burning sky), a Proving Walk, a
Rampart, and Grath's Court in the magma chamber. In circles 1 and 2 every span carries a passage. A first breach shows
the place Mac asked for in its first five minutes.

**One hall at a time, the company together.** The room holds one live hall, and the company moves through its stages
as one:

| stage | what | how long |
|---|---|---|
| **arrival** | each member steps off the swap onto the hall's ARRIVAL PLATE (gold) and says `here` | as they come |
| **gather** | a ring fills over the plate, *3 of 6 here*. The hall wakes once every living member has said `here`, or `EG_ARRIVE_MAX_S` (30 s) after the pull: *The hall wakes.* After two halls in a row that a member woke late, the wait for them drops to 10 s | `EG_GATHER_S` 8 s after the last `here` |
| **the trial** | the hall's kind (section 8), its objective on the arrival card and the objective chip (section 27.3) | the trial's |
| **the door** | the relay judges the trial done, and a gold door opens at the hall's END PLATE: a beam seen hall-wide, a compass and screen-edge marker, *The way down opens.*, and a door's sound | - |
| **the closing** | each member steps through the door when ready (`down`, accepted only within `EG_DOOR_REACH_M` 3 m of it, from a fair trail, section 21) | `EG_CLOSING_FIGHT_S` 20 s; `EG_CLOSING_SPAN_S` 45 s after a span or the Deepway |
| **the pull** | at the closing's end, every living member still in the hall is pulled down | after a span, the toll (section 10.6) |

**The breach's first hall** wakes when every company member has said `here`, or when the open window ends
(`EG_ADMIT_MAX_MIN`); a member not admitted by then is out.

No member is targeted or judged before their `here`. A span's door opens when the FIRST living member stands on its end
plate with a fair trail (section 21). The closing then gives the others 45 s to cross, and the pull carries whoever did
not, at the toll's cost. Skill is paid and nobody is stranded. Nothing waits on the slowest player for ever, and
nothing is skipped for free.

**THE SWAP.** Between halls, the made level is replaced in place. Every made level today is entered only from the
exterior: `enterSdRealm` (`src/scenes/worldModes.js`) refuses unless the mode is `'exterior'`, and the world host's
`sdEnterRealm` forces the player out to the exterior and teleports to a pixel first. Reused as it is, every stair would
stream an exterior pixel, switch the presence socket to a world cell, fire every exterior-transition hook and leak the
old dungeon context (`dungeonTransition` never destroys the context it replaces). So EG10 builds `swapEgHall(spec)`:

- the old hall's context is torn down (the teardown of `exitDungeonNow`, without `setMode('exterior')`, a landing or
  streaming) and the next is stood;
- no exterior pixel is streamed, and no exterior-transition, HCC, quest or unlevelled-loot hook runs;
- every hall of a breach keeps one presence room, `{kind:'eg', b}`, so the swap never switches the presence socket;
- **the next hall is built during the closing** (`egHallOf(seed, h+1)` is known), time-sliced at no more than 4 ms a
  frame, with the mesh kit writing straight into typed arrays (section 11.6); the swap only uploads it. A
  40,000-triangle build costs 41-53 ms and 21-30 MB of garbage on a desktop in one task (AUDIT EG II L4-27), so it must
  never land in one frame;
- at most two halls are resident;
- pinned: after 20 swaps the live mesh, texture and collider counts are back at their baseline, and no world-cell hello
  was sent.

**The stair** is what the swap shows. The full fall through the void, past the Spire's broken underside, plays at the
first hall of each band. Every other swap closes the veil (`stepThroughFire`) in a 0.8 s dither with the band's chime,
holds on *Hall 13* centred while the upload lands, and opens in 0.8 s. Under `prefers-reduced-motion`, or a new
`port:reducedMotion` in the Accessibility tab's Motion section (EG16), every swap is a plain dither cut. A company sees
the stair 30 to 75 times a run; it must never be the thing that makes them sick.

**The bands.** Every 25 halls (five Redoubts) the halls have fallen further down the legions' road. Each band adds
kinds; earlier kinds stay.

| band | halls | what it is | look | its legion adds | its lords | its champion |
|---|---|---|---|---|---|---|
| **the Broken Galleries** | 1-25 | the academy's upper halls, still over the Deadlands | white marble and gold, burnt Battlemage blue, the fire-sea below | Harriers, Sappers, Ward-Bearers, Breakers, Casters, Lurkers | Grath, the Hound; the Last Spellmaster; the Last Armsmaster; Valkynaz Ilthys at Redoubt 5 | a Kynreeve |
| **the Soul Cairn** | 26-50 | halls fallen into the Ideal Masters' realm of the dead | violet-grey stone, soul-gem light, a sea of mist | Binders, Wraiths | the Cairn-Keeper; the Twin Lords; Valkynaz Morvayn at Redoubt 10 | a Kynmarcher |
| **the Shade Perilous** | 51-75 | halls fallen into Nocturnal's dusk | near-black, moon-silver, light only where braziers burn | Divers | the Mother of Dusk; the Night-Stalker; Valkynaz Seyth at Redoubt 15 | a Markynaz |
| **the Havoc Wellhead** | 76 onward | the muster-ground of 3E 398, the Spire's last fragments in it | basalt and molten iron, eruptions | a Daedra Lord as an elite add, one wave in six | the Bound Colossus; the Wellhead Wyrm; Valkynaz Garoth at Redoubt 20 and every fifth after | a Markynaz |

The bands are the arc's progression: each changes the look, the score, the legion, the lords, the champion, the
pieces, the fragments and the hall variants. The Wellhead is the Spire's endless depth. From Hall 76 its band does not
change again, and depth grows by decrees, the Wellhead's tides and its strata (section 18). A decree never draws a
kind, a piece, a variant or a lord its band has not unlocked.

## 8. The halls

Every hall is laid along +Z, from its arrival plate (z = 0) to its end plate, over the void. Falling below a hall's
floor (y < `SD_VOID_Y`, -30), into magma or into the mist is never a death. It casts back to the last island or plate
stood on, at the Spire's own cost: 10% of max health, never below 25% health (`EG_CAST_BACK_LOSS`,
`EG_CAST_BACK_FLOOR`). That is gentler than the Steps' 15%, because in the Spire it is a long run's attrition, not one
course's. The void punishes in time and health. It does not take the one life.

**Health between halls.** The Spire keeps the Burning Court's rule: no natural regeneration
(`src/systems/courtRules.js`, WBX6), as the Hour does. Health comes back from:

- a Redoubt's rest;
- the member's own potions, at most two a hall (THE POTION LAW, section 17.4), and spells;
- Vestiges (Rally, Second Wind, Mender's Grace);
- the Low Road's Battlemage's niche (section 11.4), a cache's Spire Tonic and the Mending Cantrip (section 17);
- the Scriptorium twist.

### 8.1 The Rift-Yard (`yard`) - relentless waves

A court disc of radius 22-28 m (the gate's `COURT_R` is 24), with **Wellhead rifts** on its rim: tears into the Havoc
Wellhead the legions came through, each a standing body.

- **Rifts**: `clamp(2 + ceil(n/3), 3, 5)` for *n* living members.
- **The rifts' health**: together they hold 36 s of the company's reference damage, split evenly (each `36 / rifts`
  s), through `hostTeamHpFor` (the gate's, with its `HOST_HP_MIN` floor), times the depth `(1 + 0.04(c-1))`. A larger
  company has more rifts to split over, never more to break.
- **Each rift pours a wave** every `max(9, 20 - 0.5(c-1))` s while it stands: the band's kinds, sized by *n* (section
  12). The waves never wait for the last body to die. That is the relentlessness. A wave's cadence is "more at once",
  not a faster blow: NOTHING GETS FASTER binds every wind-up and every piece, and the waves' cadence is depth's own
  knob (section 18).
- **The legion's cap**: no more than `min(14, 2 + ceil(1.5n) + floor((c-1)/5))` standing. A rift whose wave would pass
  the cap holds it, and the next wave is one body larger (once, however long it held). Every other wave pours what the
  room under the cap holds of it (section 12). A company of eight stands at 14 from circle 1; depth reaches
  it through decrees and kinds, never more bodies (the telegraph budget, section 25.4, is why).
- **The end**: the last rift closed. Every add still standing crumbles (the host's `adie`), and the door opens.

**Variants**, drawn by `egCircleOf` (section 9); one more unlocks with each band:

| variant | band | what |
|---|---|---|
| **the Rift-Yard** | the Galleries | as above |
| **the Wellspring** | the Galleries | one great rift worth 30 s of the company's reference damage, shielded while any of its three anchors stand (each 4 s); Sappers walk to broken anchors and relight them at a third |
| **the Muster** | the Cairn | no rifts: a Kynreeve standard-bearer walks between three rally points (3.0 m/s, a new point every 20 s), and every rally point pours waves while the standard stands. It holds 20 s of the company's reference damage, times the depth. Fell it and the waves stop |
| **the Holdfast** | the Shade | hold a Battlemage relic (a gold disc, r 6) for 75 s against waves from three rifts. Each add that reaches it takes 4 of its 100. A broken relic opens two more rifts and the hold restarts at half; it never fails the hall |
| **the Wellmouth** | the Wellhead | the rifts wander: each moves between three sockets on the rim every 20 s, at a fixed 2.0 m/s, so the groups that close them must follow |

From circle 2, one Yard in three stands in a chamber (section 11.4), its rifts set in the walls.

Split up and close rifts in parallel, or stand together and be buried. An eight-member company closes five rifts in
three groups; a pair closes three, back to back, against a legion sized for two.

### 8.2 The Span (`span`) - platforming

A generated course (section 10) of 12-28 platforms in two to four sections, with islands between them, from the
arrival plate to the end plate.

- **Harriers** (Imps, hovering at `HOST_HOVER_M` 0.9 m) shadow the company along the course. Over platforms they
  body-block and never bite; they bite only on islands and plates (traversal ground is never aimed at, section 11.7).
- **Divers** dive at it from the air, from the Shade: only at its islands and plates, under the Diver's rule (ground at
  least the shape's width plus 2 m: 6 m).
- **The door** opens on the first living member at the end with a fair trail (section 21).
- **Fragments**: a span may pass through fragments, and from circle 2 every span forks into a High Road and a Low Road
  (THE FORK, section 11.4).
- **THE GOLD RUN**: if every living member is across, by either road, before the closing's 15th second, the count
  gains one real minute; past the cap, that minute counts toward a Surplus. A company of one is exempt: its own arrival
  opens the door. A pose-gated credit needs a fair trail from the last island (section 21).
- **The trail**: once the door opens, the first across's route (from the relay's poses) draws as a faint gold ribbon
  for the others.
- **Members never block each other**: peers are not in the collider (`src/net/remotePlayers.js`). Allies draw at 60%
  opacity on traversal ground, so an ally never hides an edge line.

### 8.3 The Rampart (`rampart`) - a walkway under fire

A walkway 90-160 m long over the void: 3-4.5 m wide for a company of up to four, 5-6 m for five to eight.

- **Fire vents** cross it on a cycle: each a lane 4 m deep, laid across the walkway and at least 4 m long, past a
  narrow walkway's edges (THE WIDTH RULE, section 11.7),
  telegraphed 1.0 s before it erupts (20% of max health, fire).
- **The legion marches along it** toward the company. The relay runs them on a line, the walkway's own axis, so it
  needs no navmesh.
- **Bastions** every 35-45 m: fight floors (r 6) off the walkway's side, where the march halts and Breakers enter. The
  back of an eight-member line always has somewhere to fight.
- **Casters** stand on `1 + ceil(n/3)` pillars beside it, 10-18 m out, throwing discs. Reach them by short side spans,
  or answer them with arrows and spells. A Caster keeps to its pillar, whatever the pillar's plan meets: one whose plan
  meets a bastion's has a lip onto it, and no Caster steps off (EG-ZQ).
- **Breakers** charge ACROSS the walkway from the side spans, never along it. A lane along a walkway would leave no
  floor to escape to (AUDIT EG0 G4). Their push is 6 m, and a push off the edge is a cast-back, not a death.
- **Waystones** every 30 m, lit gold when they are a member's cast-back point: a push off the edge returns them to the
  nearest one behind, never to the arrival plate 160 m back.
- **At its end, a portcullis** held by two Ward-Bearers (the gate's Legion-Lord kind, pulsing). When both fall, the
  door opens.

**Variants**:

| variant | band | what |
|---|---|---|
| **the Siege-Walk** | the Galleries | as above |
| **the Falling Wall** | the Galleries | 20 s after the wake, the walkway falls behind the company, segment by segment, at a fixed 1.5 m/s. A member caught is cast to the nearest standing segment ahead, at the cast-back's cost |
| **the Winch** | the Cairn | the portcullis rises only while `min(2, n)` members stand on its winch plates, over 60 s, under the march |
| **the Gauntlet** | the Shade | no march: `2 + ceil(n/2)` caster pillars, each silenced by standing 3 s on its side span's plate |
| **the Forge Bridge** | the Wellhead | the walkway is a conveyor running toward the arrival plate at a fixed 1.0 m/s, under the march and the vents |

### 8.4 The Athenaeum (`athenaeum`) - the lock

The Battlemages' library, its heart an **Orrery** drawn by `orreryOf` (`src/net/sdBrain.js`).

- **Today**, `orreryOf(s)` takes a Hollow's slot. It reads its fray from that slot's own Hour marks
  (`sdMarksLaw(sdMarksOf(s)).fray`) and its turns range from the module constants `SD_TRUTH_TURNS_MIN`/`_MAX`, with a
  64-entry cache.
- **EG4 widens it** to `orreryOf(s, {turnsMin, turnsMax, fray})`. The Hour's call and its golden draw are unchanged;
  the cache is keyed on the seed and the band.
- **The Spire's knobs**: the turns range starts at 16-28 and rises by 2 every five Redoubts. The fray is the Hour's
  default unless the circle carries the Hour's decree The Fraying (section 14).
- **The judge**: EG4 extracts the pure judge, `orreryJudge`, out of `_sdTurn` in `server/src/index.js` (reach,
  settle, rights, `orreryStep`). The Hour's room and the Spire's both call it.
- **Pressure**: `ceil(n/4)` Harriers rise every 15 s while the lock stands, so the members off the stones guard the
  members on them.
- **Everyone works**: any member in reach may turn any stone. The rights (`orreryMayTurn`) only hold back a turner who
  keeps lengthening the road while another turns.
- **The reward**: solving it in no more turns than the band's minimum grants every member one free Vestige rank at the
  next Redoubt.

### 8.5 The Proving Walk (`proving`) - span, champion, span

The Battlespire was a proving ground. A short span (6-10 platforms) leads to a **proving court** (r 14), where the
band's **champion** stands: a Kynreeve in the Galleries, a Kynmarcher in the Cairn, a Markynaz below.

- It is one foe the relay runs: `PROVE_HP_S` 40 s of the company's reference damage, times the depth.
- Its body is the Warden's look at 2.5 scale (Ruhn's 3 is his own), with the boss mark ring. Its shapes are the Warden's
  own Cleave, Slam and Charge from `ATTACKS`, each lengthened to its wind-up floor and the Charge widened to 4 m (THE
  WIDTH RULE).
- It wakes at the wake ring (section 8.6).
- It brings an escort of `1 + ceil(n/3)` adds from its band (2 to 4).
- Each rank has a signature:
  - **the Kynreeve, Shield-Wall**: blows on his front 120° deal 75% less, blows from behind 30% more (the relay knows
    both poses), and he turns to the top of threat, so one member holds him while the others flank;
  - **the Kynmarcher, the Citadel**: he plants three standards, each 4 s of the company's reference damage; each
    standing standard takes 20% off every blow on him;
  - **the Markynaz, the Grand Duke's Decree**: he lays one lord-family decree (section 14) on his own fight, named on
    his card. It folds with the circle's lord decrees through the fight's profile (section 14), never in their place: the
    one his hall's number draws from the four, or the next his fight does not already bear.
- Its fall opens a second span, whose end is the door.
- From circle 2, one proving court in three is a chamber: the Fallen Stacks' broken dome, with two balconies (section
  11.4).

### 8.6 The Court (`court`) - every fifth hall

A short approach (3-5 platforms of the band's first two pieces) leads to the **Court**: a court disc of radius 26, or
the lord's own ground (section 13).

- **The wake ring**: a gold ring at the court's edge. The lord wakes when every living member stands inside it, or
  `EG_WAKE_RING_S` (20 s) after the first does, with the gate's wake beats: the roar, and the lord's card (its name and
  epithet). The fastest member never meets the lord alone.
- Its fall raises the **Redoubt's beacon** at the court's heart, and the Redoubt is taken for every living member at
  once (the Redoubt's sequence, section 16.2). Touching the beacon is not needed.

### 8.7 The twists

From circle 2, about one hall in four (seeded, never the Court, never two running) carries a **twist**:

| twist | what | on |
|---|---|---|
| **Reliquary Vault** | a side span to a cache: an extra Reliquary for each member who reaches it with a fair trail, at the count's cost | a Span or a Proving Walk |
| **Dagon's Bargain** | a shrine on the arrival plate: the company's word (section 16.4) accepts one more decree for the rest of the circle, and each member who voted yes gains one Reliquary if it passes. At most one a circle, and none when no family is free (section 14) | any trial hall |
| **Kynval Squad** | four Kynval elites in place of a wave, each with one affix: **Searing** (its strike leaves a pool, r 2.5, for 6 s), **Shielded** (a shield of a quarter of its health that only blows from behind break), **Wrathful** (shares +10%, inside the 1.5 cap), **Unshaken** (immune to push and to Fade) | a Rift-Yard or a Rampart |
| **The Scriptorium** | a quiet hall: heals 30%, no trial, and the door opens after 30 s (the count runs) | slot 3, in place of its kind |
| **A Battlemage's Ghost** | a friendly ghost (the relay's host runner, a friendly flag) fights beside the company for the hall | any trial hall |
| **The Deserter** | a Dremora deserter races the company to close rifts. If the company closes more, each member gains a Vestige shard (section 17.1); otherwise he takes the hall's cache | a Rift-Yard |
| **The Kyn Mimic** | one cache in eight is a Lurker; its tell is a lid that breathes red | any trial hall |
| **The Captive Battlemage** | three chains, each 4 s of the company's reference damage; break them all and each member gains a Cantrip (section 17.2) | any trial hall |
| **The Sutler** | the Kyn quartermaster on the arrival plate, selling for lumen (section 17.3) | any trial hall |

### 8.8 The Deepway (`deepway`) - a hall of fragments

From circle 3, the traverse slot draws the Deepway one time in three instead of the Span. It is a hall built of four
fragments end to end (section 11), a crawl through the band's deep places:

1. a passage;
2. a chamber, whose objective is one of: rifts at the Rift-Yard's law with the legion's cap halved; a champion; or an
   engine held for 45 s against waves;
3. a shaft down, or a set-piece passage (section 11.3);
4. a passage, to the end plate.

The chamber's objective is the trial's: the door cannot open until it is done, so one runner cannot skip the fight.
Then the door opens on the first fair arrival, and the closing is 45 s, as after a span. The toll is by distance
(section 10.6). Each band has its own: the Oblivion Caverns in the Galleries; the Ossuary and the Mist Stair in the
Cairn; the Gloam Thicket and its Hollow Trunk in the Shade; the Forge Gut and its Slag Chute in the Wellhead.

### 8.9 The Brink halls - from band to band

Halls 26, 51 and 76, the first of each new band, are a **Brink**: a fixed traversal of about 60 s at the span build,
with no fight (the count runs). The hall tears loose from one realm into the next as the company crosses it: Galleries
marble giving way to Cairn mist, the Cairn's slate to the Shade's dark, the Shade's glass to the Wellhead's fire. Its
course is a set-piece passage (section 11.3) solved like any other, and its end plate shows the new band's card. Every
hall's sky holds the Spire's broken underside, drawn smaller with each band, so depth is something the company can see.

## 9. The generator - the hall spec

**One pure law, read by both sides.** `egHallOf(seed, hall)` (`net/egLaw.js`) answers the **hall spec**:

- the kind, its variant, the band, the circle, the slot and the twist;
- the hall's geometry: its plates, court discs, rifts, walkway, bastions, pillars, side spans and span course;
- its fragments: each one's kind, class, socket and seed, and so its law half (section 11.5);
- its cache's kind, its engines and its alcoves (sections 11.10, 17);
- its decrees, as numbers.

**Its units.** The spec says its positions in metres, from the law's centimetres, all but one field: a spot's `y` (where a
spot carries one: a fragment's anchors, a balcony's spot, the Low Road's niche) is said in centimetres, as the law lays it.
Seed 1's Hall 22 has Lurker spots at `y` -760 over floors at -7.6 m. Nothing reads it, since every body's feet are the fight
ground's (section 11.7). Saying it in metres is a spec law of its own (`EG_SPEC`, section 22), made by the first slice that
reads a spot's height; until then a reader divides by 100 (EG-ZQ's record says why).

The relay reads it to run the hall's brains: where a court's clamp is, where a rift stands, the walkway's line, where
a platform is at time *t*. Every client reads it to build the hall (`buildEgHallModel(spec)`,
`egHallColliderTris(spec)`, the Steps' records for a span). Those builders are ONE construction seam,
`egHallParts(spec)`, which builds the model, the collider buckets and the riders together (THE ONE CONSTRUCTION SEAM).

**The relay and the clients must compute the same spec, so the law is exact.** `Math.sin`, `cos`, `tan`, `atan2`,
`hypot`, `pow`, `exp`, `log` and `cbrt` are implementation-approximated: V8's results and an iPhone's JavaScriptCore's
can differ in the last bit, and one flipped threshold in the solver (the 0.5 s window, the eight retries, the budget's
sum) would give the relay and a phone different halls. So:

- the law files decide only in integers: positions quantized to centimetres, times to milliseconds, costs as
  integers;
- their trigonometry runs through a polynomial `lawSin`/`lawCos` of their own, exact in integer arithmetic;
- a source sweep refuses any of the functions above in `net/egLaw.js`, `net/egSpanLaw.js` and `net/egFragLaw.js`;
- the state frame carries `sd`, an FNV-1a digest of the quantized spec. A client whose own spec disagrees asks
  `{k:'spec'}` and builds from the relay's bytes, and the mismatch rides the next receipt's measures.

**Seeds.** The breach's `seed` is drawn by the relay's CSPRNG when the room accepts the open order, and said in its
state. A hall's own seed is `egSeed(seed, hall)`, the `sdSeed` mix. EG5 exports `sdSeed` from `src/net/sdBrain.js`
(today it is private), and the Spire imports it rather than copying it (ONE DFU MEMBER, ONE EXPORT). The receipts'
seeds are not the breach's (section 22).

**The law's version.** `EG_SPEC` is the spec law's number, recorded per breach as `egv` at the open (section 22).

**The circle law** (`egCircleOf(seed, c)`) fills the rhythm's slots (section 7) from their kinds, weighted by band.
Slot 2 is always the traverse; the weights below draw slots 1, 3 and 4:

| | yard | rampart | proving | athenaeum |
|---|---|---|---|---|
| the Broken Galleries | 3 | 2 | 3 | 1 |
| the Soul Cairn | 3 | 3 | 2 | 1 |
| the Shade Perilous | 2 | 3 | 3 | 1 |
| the Havoc Wellhead | 3 | 3 | 3 | 1 |

A kind's variant is drawn from those its band has unlocked, never one of the kind's last `min(2, unlocked - 1)`
draws, so the Galleries' two alternate and the Wellhead's five never repeat within three.

**A hall's budget.** Every piece the generator places carries an integer cost: a platform kind, a rift, a vent lane, a
caster pillar, a fragment and each of its hazards, an engine. A hall's pieces sum to `egBudget(h)`, which grows with
the circle and the decrees. The Spire therefore has no lucky seeds: two companies at Hall 40 face halls of the same
weight, drawn differently. The budget is the measured knob of EG's tuning pass (EG21).

**Where the law lives.** The relay draws halls too, so the span law must not pull client code into the relay bundle.
Today `src/world/sdSteps.js`, which holds the platform clock (`stepAt`, `beatStands`), imports `src/world/sdHall.js`,
and through it the Hour's art; the union floor's bearing search lives in `src/scenes/gateCourt.js`, which imports
`render/`, `ui/` and `world/` modules. Neither is in `RELAY_GRAPH` (`test/relayversion.test.js`). So:

- EG4 moves the platform clock (`stepAt`, `beatStands`, `beatBlinks`, `crumbleAfter`, `gustAt`) into
  `net/egSpanLaw.js`, a leaf, and `src/world/sdSteps.js` re-exports it;
- the fragments' law is another leaf beside it, `net/egFragLaw.js` (section 11.5);
- EG8 moves the bearing search into `net/egFloor.js` and widens it there (THE UNION FLOOR, section 13.2);
  `src/scenes/gateCourt.js` imports it back for the arrow;
- the span law's motor numbers are copied as `EG_*` constants and held equal to the motor's by a test;
- the solver is part of that law, so the relay and the client draw the same course;
- the CLI `egSpanSolve.mjs` (under tools/, as `tools/sdScoreProbe.mjs` is) only drives it;
- pinned: `RELAY_GRAPH` gains no `world/*Art*`, `scenes/*` or `render/*` file.

**Pins.**

- The spec law is pinned against golden specs for fixed seeds.
- Every spec field the relay reads is pinned against the brain that reads it.
- A change to the draw changes the relay version, as the Orrery's golden draw does (`test/relayversion.test.js`).

## 10. The spans - generated platforming

### 10.1 The course is the Steps' own record

`src/world/sdSteps.js` lays the Unmoored Steps as a uniform array, `{i, kind, span, x, y, z, w, d, amp, period,
phase, beat}`, plus checkpoints `{x, y, z, r}` (the Spire's islands): exactly what a generator emits.

- **It is data (EG4, shipped in EG-H3)**:
  - `courseOf(courseSpec)` (`src/net/egSpanLaw.js`) lays a course;
  - the Hour's course is `courseOf(SD_COURSE_SPEC)` (`SD_COURSE`), byte for byte the course it froze at import, pinned;
  - every reader takes a course, the Hour's by default - the ghosts (`sdGhostStepsOf`, the pass's count a maximum,
    `SD_GHOSTS_MAX`), the waystones and the vane, the rewind's edges and eye, the hang's islands, `abyssLab`, the
    riders (`createSdSteps`) and the check and breath builders. The motes still read `SD_COURSE_END`, the Hour's own
    sky. The Spire's islands carry the Steps' waystones, read off the Spire's own courses (EG6a, `scenes/egSpan.js`
    over `egCourseOf`); its timed pieces carry the Steps' ghosts, the circle's (EG-ZL).
- **The generator (EG6a)**: `egSpanOf(seed, hall, band, o)` (`src/net/egSpanLaw.js`) draws a hall's every course from the
  pieces below off the hall's own die, one per road when the span forks, and `courseOf` lays them: the hall law stands
  the hall about the generator's edge. `egCourseOf(spec, road)` reads a road back as the readers take it.

### 10.2 Three builds, each for its reason

- **THE SPAN BUILD** is SD7b's: Speed 10, Running 0, Jumping 0, the worst build the game makes. Every gap, the solver's
  windows and the CI sweep use it. A gap is binary, so every build must cross every gap.
- **THE ESCAPE BUILD** is Speed 40, Running 20, `runSpeed` 6.975 m/s. The wind-up floor uses it (section 13.2),
  because escaping is continuous and a slow build has Speed and the Fleetfoot Vestige to answer it.
- **THE FAST BUILD** is the fastest legal one: Speed 100, Running 100, Jumping 100, Fleetfoot III, athleticism with
  Improved Athleticism (an ImprovesTalents enchantment), and the Jump spell's flat +0.6 (`jumpSpeedMultiplier` 2.3 in
  `src/systems/skills.js`: a 2.68 m apex), steering in the
  air. It bounds what a player can do: the Drop's walls, a fragment's headroom, and the crossing's lower bound (section
  10.5).

### 10.3 The pieces, and what each shows

NOTHING GETS FASTER: every piece keeps the Steps' timing at every depth. Depth adds pieces, combines them in one
section, spaces the islands further apart, and puts the legion overhead. **Every piece shows what it will do next**
(SD-LOOK section 8's law), in its band's dress:

| piece | from | what | its numbers, at every depth | its tell |
|---|---|---|---|---|
| **Drift** | the Steps | a platform swinging side to side, `stepAt` | `amp` (half the swing) 1.0-2.0 m, period 4-7 s | hangs on two chains from an anchor 18 m up (an arch rib, a ribcage, a moon-shard, a crane hook), leaning as it swings |
| **Beat** | the Steps | there on the beat only, `beatStands` | cycle `SD_BEAT_CYCLE` 3.6 s, solid `SD_BEAT_SOLID` 2.4 s, blink `SD_BEAT_BLINK` 0.4 s, alternate steps `SD_BEAT_HALF` apart | the band's glyph on its face, a sector sweeping through the solid time; the last 0.4 s white, faltering at most 2.5 Hz; a gold ghost (`sdStepsPass`) while it is gone |
| **Riser** | the Steps | a wall `SD_RISER_H` 2.3 m, run up (CLIMB3) or climbed | the engine's range | a gold lip along its top |
| **Crumble** | the Steps | shakes and falls after a foot | delay `SD_CRUMBLE_DELAY` 0.7 s, back `SD_CRUMBLE_BACK` 5 s, platforms 2.6 m deep | three crack stages, and the rewind as it returns |
| **Gust** | the Steps (the breath) | a span-wide push, warned 1 s | every `SD_GUST_EVERY` 6 s, `SD_GUST_SPEED` 3 m/s for 1 s | a streamer banner on every island pointing the push 1 s ahead; the wind rising (`AmbientWindMoanDeep`); streaks at the screen's edge |
| **Rail** | new | a platform that travels along the course between two plates, ridden (`carryBy`) | period 6-9 s | a dashed gold track between its plates, ticked at each end |
| **Pendulum** | new (`egPendulum`, a hazard; not the Drift's `SD_PENDULUM` dressing) | a chained weight swinging across a GAP | period 3-5 s; a touch is a cast-back unless Iron Footing III | a white hatched lane over the gap, brightening over its last 0.8 s |
| **Vent** | new | a vent under a platform at least 4 m across, erupting on a cycle | 20% fire; cycle 4-6 s | a white ring closing over 1.0 s |
| **Drop** | new | a drop to a walled landing | at most 4.5 m, onto a landing at least 6 m deep, walled on its far side and flanks to at least 7.5 m over it | the landing's edge line, gold; the wall's face lit |

**Islands** carry the Steps' waystone, lit gold while it is a member's cast-back point. A lab view, `span-far` (30 m),
proves that solid, white and gone are told apart under `?grey`.

Pieces unlock by band:

- the Broken Galleries: Drift, Beat, Riser, Crumble, Drop;
- the Soul Cairn adds the Gust and the Rail;
- the Shade Perilous adds the Pendulum;
- the Havoc Wellhead adds the Vent, all nine.

### 10.4 THE ENVELOPE

SD7a's law, made the generator's. Every number is a bound, never a target:

- **a gap** is 2.4-3.2 m. SD7b crosses 3.2 m at the span build; the plain running jump at the escape build reaches
  more, so training buys margin, not entry;
- **a riser** is taller than the Jumping-100 apex plus 0.5 m, and no taller than `wallRunHeight(0,0) +
  PARKOUR_REACH_MIN` (2.5 m);
- **a step down** within a run is under 1 m;
- **a Drop** is at most 4.5 m. The motor bills fall damage on distance from the takeoff (`fallStart`), over
  `FALL_DAMAGE_THRESHOLD` (5 m), so 4.5 m bills nothing. A run carries the body on: stepping off at the escape build
  lands 4.7 m out, jumping off at Speed 100 lands 11.1 m out, and the fast build's steered Jump-spell flight 17.9 m
  out, its apex 7.2 m over the landing. So the landing is at least 6 m deep and walled on its far side and flanks to at
  least 7.5 m: a body that carries too far meets the wall and drops onto the landing;
- **depth never widens a gap or shortens a time.**

### 10.5 THE TIMED SOLVER

In `net/egSpanLaw.js`. SD7a checks distance and SD7b runs the real motor; neither checks time. The generator emits only
what the solver proves, road by road:

- **jumps**: for every consecutive pair, a launch window of at least `EG_WINDOW_MIN` 0.5 s in every 12 s of the clock,
  in which the span build's running jump lands (the motor's closed form, over the platforms' positions at *t*);
- **no queues**: from any moment on a platform, the next launch window opens within `EG_WAIT_MAX` 4 s. Eight members
  waiting at different gaps must still be running, not queueing;
- **the median**: a road's median crossing time, swept over start phases, is at most 1.6 times its fastest;
- **Beats**: a Beat pair's window is the solid time less `SD_BEAT_HALF` plus the flight, 1.05 s at the Steps' 2.4 s.
  That is why the Beat never shortens;
- **Crumbles**: the delay covers the crossing. A 2.6 m platform at the span build's run (5.47 m/s) takes 0.48 s, plus
  0.15 s of slack is 0.63 s, inside the 0.7 s delay;
- **Pendulums**: a gap's lane leaves a window of at least 0.8 s to pass;
- **Vents**: only under platforms at least 4 m across, and a ring leaves the platform's farthest point 1.5 m from its
  edge;
- **Rails**: a Rail's ride ends on a plate it reaches, at the speed the carry gives;
- **ceilings**: inside a fragment, every flight is clamped by its `ceil` (section 11.5);
- **shafts**: a shaft takes at most 15 s at the span build;
- **failure**: a course that fails is drawn again from the next sub-seed, at most 8 times, then laid from the band's
  first two pieces alone.

**The crossing's lower bound** (`EG_CROSS_MIN(spec, road)`) is the solver's fastest crossing at THE FAST BUILD, less
15%, per road. It is a measure in the receipt's `m`, never a door's gate, until EG21 has field data. A bound taken at
the span build would refuse every honest faster player (AUDIT EG II L2-5).

**The sweep.** CI runs SD7b's harness (the real `PlayerMotor` on the real `Collider` over `stepTris` slabs). A course
costs about 182 ms of motor (a falling one 2.5 s), so a pull request runs 25 seeds a band plus the law pin's golden
seeds, and the 500-seed sweep per band runs nightly and before every relay deploy. EG6a sweeps every band's pieces: the
generator lays them all (`tools/egSpanSolve.mjs --sweep`, `.github/workflows/eg-sweep.yml`).

### 10.6 The toll and the fall

- **The pull's toll**: a member pulled before reaching the end pays 5% of max health for each quarter of their road
  still ahead of their furthest fair point, at most 20%. It is waived for a member who reached a new island, or a
  fragment's node, in their last 15 s: only the idle pay, and trying and falling short costs less than standing
  still.
- **A cast-back**: 10%, never below 25% health (section 8). Featherstep lowers it.

### 10.7 Flight and the air

- **Levitate is banned.** `applyMotorEffectFlags` (`src/scenes/shared.js`) holds Levitate under `levitateWarded()`.
  `registerLevitateWard` keeps ONE function, and registering again replaces it, so the Spire's predicate is OR'd into
  `src/scenes/world.js`'s one registration, beside the siege and the Hour.
- **Slowfall is banned too.** It is not banned in the Hour today: it drifts down at a flat `SLOWFALL_VELOCITY` and
  keeps a run's momentum off an edge, so a Drop would be a glide. EG10 adds the Spire's ban to the same flags write
  (`player.slowFalling`).
- **The Jump spell is allowed**, and it steers. The motor has no air control (`airControl = false`, AcrobatMotor's
  default) except under the Jump spell: `enhancedJumping` restores steering in the air (AUDIT 64 F2,
  `CheckAirControl`). It is a build, and the Steps accept it (*"a Jump spell is a way up too"*), so THE FAST BUILD
  carries it: the Drop's walls, the headroom and the crossing's bound are all taken with it.
- **Technique flights are refused on traversal ground.** A weapon technique's leap or dash (the motor's
  `techniqueLaunch`, called by `src/combat/techniques.js`) flies its own arc at up to `TECHNIQUE_MAX_SPEED` (12 m/s,
  `src/combat/techniqueRoster.js`) toward a target. On a fight
  floor it is a technique; on a span it would be a bridge. The Spire refuses its launch while the member stands on
  traversal ground.
- The staff command `/fly` is exempt.

### 10.8 The shared clock, the ridden poses, the forgiveness

- **The shared clock.** Platforms move on the anchored clock (`anchoredClock`, `deadlandsSeconds`), so every member
  sees every platform in the same place at the same time. A crumble is each member's own, as on the Steps.
- **The shared clock is corrected.** Today a client sets `clockOffsetMs = m.now - Date.now()` from the welcome
  (`src/net/online.js`), so its clock runs late by the welcome's one-way latency. In an `eg:` room the client keeps
  shared time as NTP does: a ping and its answer, half the round trip, the median of five, refreshed every 30 s.
- **RIDDEN POSES.** Peers are drawn 160-550 ms behind their real time, in world space, while platforms move on the
  local clock: a peer on a Drift swinging at 3.1 m/s would float 0.5-1.7 m beside it. So a pose on a moving piece
  carries `pl`, the piece's index, and its offset from that piece's top at the sender's time. A receiver draws
  `stepAt(piece, tDraw) + offset`. The field joins `validPose` (a relay version, EG8). A peer on a crumble the viewer
  has seen fall is drawn on a ghost slab.
- **The forgiveness.** DFU's grounded gate (`GROUNDED_JUMP_GATE_S` 0.1, `src/player/motor.js`) swallows a jump
  pressed just before landing, and the parkour's late press (`PARKOUR_COYOTE_S` 0.15) covers only the running leap.
  Chained Beats and Crumbles would eat presses. In `eg:` halls:
  - a jump pressed up to `EG_JUMP_BUFFER_S` 0.12 s before landing fires on landing;
  - the late press covers a plain jump off any edge, for 0.12 s;
  - both are departures from DFU, listed in the Ledger A row;
  - the solver proves every course without them, so they are margin, never entry.

**The relay judges the end, not the jumps** (section 21).

## 11. The fragments - modelled areas

Mac, 2026-10-11: *"I really want to enhance the experience where sometimes platforms can lead to oblivion caverns, or
different types of modeled areas instead of simple platforms"*.

### 11.1 What a fragment is

A course of platforms alone is a path over the void. The torn halls did not fall as stepping stones: they fell in
**fragments** - whole caverns, collapsed rooms, broken stairs - and a course passes through them. A fragment is a
modelled area with a mouth and an exit, its own floors, walls and ceilings, its own hazard, and room for the legion.
There are three classes:

| class | what | where it stands | blows land |
|---|---|---|---|
| **passage** | a tunnel, a collapsed corridor, a toppled colonnade: entered at its mouth and left at its exit, with ledges, gaps and hazards inside | in place of a span section | on its landings only (its fight floors) |
| **chamber** | a room with one or more flat fight floors inside walls: a magma chamber, a crypt, a pit | in place of a court disc (a Rift-Yard's, a proving court, a lord's ground), or inside a Deepway | yes |
| **shaft** | a vertical fragment: down through ledges and drops | the Low Road's way down, and the Deepway's | no |

**Every platform is dressed too.** The law decides each platform's footprint, and the model fills it exactly: a
toppled column drum in the Galleries, a bone raft in the Cairn, a black-glass shard in the Shade, a slag raft or a
chained anvil in the Wellhead. **The top you see is the top you stand on**: the model's walkable face is the
collider's face, and its rim carries THE EDGE LINE (section 25.3), so a handsome platform never lies about where it
ends.

### 11.2 The library, band by band

Ten fragments. Each has a signature: one thing it asks that no other place asks.

| band | fragment | classes | what it is | its signature (the place's white light) |
|---|---|---|---|---|
| the Broken Galleries | **the Oblivion Caverns** | passage, chamber, shaft | the Deadlands' lava tubes under the torn halls: basalt walls, magma channels cut in the floor, chained bridges over magma, openings onto the burning sky | **magma surges** along a channel (a lane 4 m wide, ringed 1.0 s, 20% fire); **fire falls**, curtains across a passage on a cycle (2 s burning, 3 s out; a white shimmer 1 s before each burns; a touch is 15% fire): a timed traversal hazard, like the Pendulum, never a blow the relay counts; **falling basalt** (a disc r 2.5, 1.2 s) |
| | **the Fallen Stacks** | passage, chamber | an Athenaeum wing fallen on its side: floors become walls, bookcases become platforms, a broken dome becomes a chamber with two balconies | **the cascade**: shelves topple along the passage one after another (lanes 4 m deep, each told 1.2 s, 1.5 s apart); run the gap between the falls |
| | **the Broken Colonnade** | passage | a colonnade toppled across the void: drums as steps, arches to run along | **the rolling drums**: column drums roll along the course on the shared clock at a fixed 2.0 m/s, ridden as Rails, the arches climbed as Risers |
| the Soul Cairn | **the Ossuary** | passage, chamber | the vaults of the dead: ribcage bridges, skull pillars, soul-gem niches where Binders stand | **bone bridges** that crumble (the Crumble's law); **soul-wisps** drifting a fixed path, which tether a member on a fight floor (the Wraith's drain), never on traversal ground, and break at 6 m or after 4 s |
| | **the Mist Stair** | shaft, passage | stairs wound down a pit of mist | **mist surges**: a rising band that hides the depth below a line for 3 s. It never hides footing: edge lines and inner platforms draw over it, and it stops 0.3 m below any landing within one jump |
| the Shade Perilous | **the Gloam Thicket** | passage, chamber, shaft (**the Hollow Trunk**) | a wood of black glass, its branches the platforms, moonbeams the only light | **moon-bound branches**, solid only while a moving moonbeam lies on them (the Beat's law, driven by the beam); the beam's lit branch wears the gold rim (gold on what you stand on means it holds) |
| | **the Eclipse Vault** | chamber | a dark hall crossed by moving shafts of moonlight | **the Eclipse**, a CHECK: every 40 s, everyone outside the moon-shafts takes 30%. The shafts (r 3, walking at a fixed 1.5 m/s) are havens in the haven grammar from 6 s out; the nearest is never more than 20 m away (20/6.975 + 1.5 = 4.4 s, inside the 6 s lead) |
| the Havoc Wellhead | **the Forge Gut** | passage, chamber, shaft (**the Slag Chute**) | Dagon's war-forges: conveyors, molten channels, anvils as platforms | **hammer drops** (a disc r 3, 1.4 s); **conveyors** (Rails); **slag that cools**: a spill is a lane of magma 4 m wide, told 1.2 s (floor 0.79 s), for 6 s, then a platform for 10 s, so the way across exists only after a spill |
| | **the Clan Pit** | chamber | the Wellhead's arena of honourable fights between clans (canon), sunk in basalt, its tiers full of Kyn | **the Honour Horn**: a Kynval steps into a ring (r 6) and calls one member. If that member alone fights him, the tiers throw a Reliquary to every member; if another member enters, the crowd throws fire (Ashfall in the Pit for the hall). At *n* = 1 it is always honourable |
| | **the Oblivion Caverns, deep** | passage, chamber, shaft | the Wellhead's own magma caverns: wider, brighter, the magma higher | **the magma tide**: the low floor floods for 15 s on a 60 s cycle, told 5 s ahead (no point of it more than 24 m from a stair: 24/6.975 + 1.5 = 4.95 s); two fight floors 2.5 m up, on stairs, stay dry, so the fight moves up and down |

Every hazard keeps the wind-up floor, the union floor and THE WIDTH RULE (sections 11.7, 13.2): the surges' and the
shelves' lanes are 4 m (floor 0.79 s), the basalt's disc r 2.5 (floor 0.86 s), the hammer's r 3 (floor 0.94 s).
NOTHING GETS FASTER: depth adds hazards and fragments, never shorter cycles.

### 11.3 The set-piece passages

One a band, at most one a circle, each a normal law record on the shared clock, proven by the solver at the span build
with at least 25% margin. A member it catches is cast forward to its last standing node at the cast-back's cost, never
killed. Each opens with a sting and carries its own short music cue (section 26).

| band | passage | what |
|---|---|---|
| the Galleries | **the Collapsing Tube** | the vault falls behind the company at a fixed 4.0 m/s (the span build runs 5.47) for 60-80 m, ending at an opening onto the burning sky |
| the Cairn | **the Sinking Stair** | each flight sinks into the mist at 0.5 m/s after a foot, each member's own, as a Crumble is |
| the Shade | **the Moon Path** | a beam walks the Thicket at 2.5 m/s, and the branches stand only under it: follow the light |
| the Wellhead | **the Forge Line** | three conveyors through hammer drops into the forge's mouth |

The Brink halls (section 8.9) are built from them.

### 11.4 Where fragments stand

- **In a span** (section 8.2). A span's platforms run up to a fragment's mouth (a cavern opening in a floating rock
  mass, a fallen doorway) and on from its exit, to more platforms or the end plate. How many: in circles 1-2 every
  span carries one passage; in circles 3-10, one or two; deeper, up to three, under the hall's cap of four fragments.
- **THE FORK: the High Road and the Low Road.** From circle 2, every span forks at an island. A plaque there shows each
  road's two icons:
  - **the High Road** stays over the void: harder (more pieces in one section, each at the Steps' own timing) and
    shorter. At its hardest point a cache gives one Reliquary to each member who touches it with a fair trail;
  - **the Low Road** drops into the deep, by a Drop or a shaft, into an Oblivion Caverns passage (or the band's own)
    beneath the course. It is half as long again, with fewer falls and more foes (Lurkers in alcoves, Harriers along
    its graph). Its **Battlemage's niche**, the one niche that heals, heals 15% once a member, holds a Vestige shard for
    each member who reaches it, and is a Memento niche (section 16.5);
  - **each road is its own course**: its own islands, toll and crossing bound. Their graphs join at the sockets'
    nodes. The end plate stands at the Low Road's height, and the High Road reaches it by a Drop;
  - **the door** opens on the first fair arrival by either road. A Low Road member's closing starts at the first Low
    Road arrival, or at the door's opening plus the difference between the two roads' fastest crossings, whichever
    comes first. THE GOLD RUN counts arrivals by either road;
  - the count's 15 counted seconds and THE GOLD RUN run on the door's own closing; the pull comes per road, at each
    road's closing's end (the door frame's `until` and `ul`, section 23);
  - the company may split: the fast and the safe are its choice. The hall's cap of four fragments counts the Low
    Road's.
- **The Deepway** (`deepway`, section 8.8): four fragments end to end.
- **Chambers in other halls**: from circle 2, one Rift-Yard in three stands in a chamber, its rifts set in the walls,
  and one proving court in three is a chamber (the Fallen Stacks' broken dome). The lords fight on modelled ground
  (section 13.3).
- **A chamber is never a disc with walls.** Its record names its `play`, at least one of:
  - a second fight floor 3-4 m up, on two stairs, where Casters stand;
  - a chokepoint: an arch 6 m wide splitting the floor;
  - a moving hazard: the Caverns' channels surging across the floor in thirds every 20 s;
  - an engine (section 11.10).
- **Never**: a fragment in the Athenaeum (the lock is the hall), or two chambers running.

### 11.5 The fragment record - the law half

Every fragment, built in code or authored in Blender, has a **law half** the relay reads and a **mesh half** only the
client draws. The relay has no ARENA2 and never reads a BSA: none of the relay bundle's files does. So it cannot know a
real Daggerfall block's shape, and every fragment is the port's own geometry. Its law is a small, pure, integer record
(section 9):

```
{ id, band, class, variant, play,
  sockets: { in: {x, y, z, yaw, w, h}, out: [{x, y, z, yaw, w, h}, ...] },   // where it joins the course
  floors:  [{ y, poly: [[x, z], ...], fight: bool }],                          // walkable regions; edges are walls
  ramps:   [{ poly, y0, y1 }],                                                 // stairs and slopes: support, not fight
  open:    [[a, b], ...],                                                      // floor edges open to the void
  ceil:    [{ y, poly }],                                                      // headroom; null where open to the sky
  graph:   { nodes: [[x, y, z, r], ...], edges: [[a, b], ...] },               // where the legion walks
  anchors: { rift: [...], caster: [...], lurker: [...], niche: [...], engine: [...], hazard: [...] },
  hazards: [{ kind, shape, size, at, period, windup, pct }],                   // on the shared clock
  course:  [ ... ],                                                            // inner platforms, the Steps' records
  alcoves: [{ at, seal, holds }],                                              // section 11.10
  proof:   { crossFast, crossSlow, moves },                                    // the timed solver's answer
  cost, reverb, lights: [[x, y, z, kind], ...] }
```

- **Sockets** join it to the course. The exit socket faces +Z and the entry -Z, so a hall stays laid along +Z
  (section 8) whatever a fragment does inside; a joined piece's `w` and `h` match the socket's within 0.1 m. A socket
  may change height: that is how a Low Road goes down.
- **Volumes stand apart.** Each fragment's bounding box plus 2 m is disjoint from every other fragment's and from every
  piece's swept box (a Drift's amplitude, a Rail's path, a hanging underside's depth, `SD_ROOT_DEPTH` 22 m). A Low
  Road's vault stands at least 3 m below the lowest underside above it. The generator rejects anything else.
- **Floors** are polygons, each at one height. Those marked `fight` are where blows may land (section 11.7). **Ramps**
  are support for the fair trail (section 21), never fight floors.
- **The graph** is where the legion walks (section 11.7).
- **The course** is the fragment's own platforms (a chasm crossed on ledges), in the Steps' record shape, proven by
  the timed solver like any span (section 10.5).
- **The proof** gives the crossing's bounds (section 10.5).
- It lives in `net/egFragLaw.js`, beside the span law in the relay bundle. A change to a fragment's law is a relay
  version; a change to its mesh is not.

### 11.6 How a fragment is built

Two sources, one record:

1. **Code-built kits** (EG6b first, then each band's). A kit is a generator. `egFragOf(seed, kind, class, budget)`
   emits the law half (pure, and the relay's too), and `buildEgFragModel(law, seed)` the mesh half (the client's).
   An Oblivion Caverns passage, for example:
   - a profile (a flat floor 4-8 m wide, walls and a vault at least 3.5 m clear above it) swept along a seeded path
     that leaves facing +Z;
   - the walls and the vault displaced by noise OUTWARD only, never the floor: blows land on flat ground, and the
     collider's proxy is the inner envelope, so neither the camera nor the body ever sits inside visible rock;
   - features placed by the budget: a magma channel cut in the floor, basalt pillars (collider cylinders), fire
     falls, a chasm crossed on ledges, an opening onto the burning sky;
   - its collider a low-poly PROXY of the floors, the wall planes and the vault (at most 3,000 triangles, a fine cell
     averaging at most 64, the vault at most two quads across), never the visual mesh. This is the
     `realmColliderTris` pattern: the Hour collides on 386 proxy triangles and draws 7,700. A 3,360-triangle passage
     measured 47 triangles a 2 m cell and 133 µs a motor step against the Hour's 84 µs (AUDIT EG II L4-22);
   - pinned: no drawn vertex lies inside the proxy, and headroom is measured on the drawn mesh.
2. **Authored hero fragments** (EG6c, as Mac authors them), modelled in Blender:
   - **the bake**: `tools/fbxMesh.mjs` keeps UVs and normals, but its `bakeMesh` takes exactly one Mesh Geometry, writes
     the Morrowind basis and feeds only the Morrowind lane's NIF bakes (`bakeThunderlock.mjs`, `bakeBrigandine.mjs`,
     `bakeEbonyPlate.mjs`, `bakeSteelPlate.mjs`, `bakeCloak.mjs`); its polygon helpers serve `tools/shipBake.mjs`, which
     reads a scene of many objects in the world frame but drops UVs and normals. The gate, the ships and the wagons bake
     through it, and their model modules lay the art in code. So EG6c builds `fragBake.mjs` (under tools/): shipBake's
     `sceneObjects`, fbxMesh's UV and normal weld, a submesh per material, and the named markers;
   - **the law half**: authored in the same scene as named markers (`floor.*` planes, `floor.fight.*` for fight
     floors, `ramp.*`, `socket.in`, `socket.out.*`, `node.*`, `anchor.*`, `hazard.*`, `light.*`) and baked to a small
     JSON beside the mesh;
   - **each fragment its own bake script and byte-for-byte test**, as every bake in the port has;
   - **each fragment its own `.fbx`**. The gate's 8.6 MB whole-scene source (1,905 meshes) is the warning.
   - built by EG6c: `tools/fragBake.mjs`, the record's reader in `net/egFragLaw.js`, the registries
     (`net/egHeroFrags.js`, `world/egHeroFragModel.js`) and a reference fragment of the port's own. How Mac names a
     fragment's art and markers so the bake accepts it is the EG6c record's (below); laying his into the halls waits for
     them.

**One kit of mesh tools.** Today every made level carries its own box, extrude and pack helpers (`packFaces` in
`src/world/gateArena.js`, `packRealmFaces` and `quadFacing` in `src/world/sdRealm.js`, `away` in
`src/world/sdIslandModel.js`, `facing` in `src/world/sdHall.js`). The fragments use one shared kit, `world/meshKit.js`:
box, prism, extrude, lathe, sweep, and the pack into `createMesh`'s shape with Uint32 indices, writing straight into
typed arrays so a hall can be built a slice at a time (THE SWAP, section 7). The court and the Hour may move onto it
later; that is not required.

**One registry of pseudo-archives.** The pseudo-archive numbers are scattered constants today: the port's art
archives, 38001-38221, the abyss lab's 38990 (`LAB_ARCHIVE`), and the mods' 112358, 112359 and 112395. They have already
collided once (AUDIT SD IV R6: the large boat moved from 38151 to 38171). EG1 adds `world/pseudoArchives.js`, the one
place every archive is registered, with a test that refuses a collision. The Spire's 38231-38279 (section 25) are
registered there.

**Daggerfall's own fire.** The Oblivion Caverns' fire falls wear Daggerfall's own TEXTURE.356, the Mantellan Crux's
fire walls, read from the player's own ARENA2 at runtime through the data pipeline (`getTexture`), never shipped.
Vanilla Enhanced does not repaint 356. DFU's table (`src/world/emissiveTextures.js`) marks its records 0, 2 and 3
emissive, but DFU lights them through `TextureReader.GetFireWallColors32`, which the port has not ported: so
`src/scenes/dataPipeline.js` skips `FIRE_WALLS_ARCHIVE` at both upload arms, `test/audit39_render.test.js` pins the
skip, and 356 draws unlit today. EG6b ports `GetFireWallColors32` (the fire falls are its first consumer) and re-pins
audit39. Everything else is painted in code into the band's archives (section 25).

### 11.7 Fighting in a fragment

- **Fight floors.** Blows land only on flat **fight floors** (`floors[].fight`), each a polygon at one height.
  - The telegraph pass (`src/render/gateTelegraph.js`) draws a Spire shape on each fight floor it covers, never on one
    plane at the court frame's origin (where a shape on a higher ledge hid and on a lower one floated): each fight floor
    is triangulated once, for each shape and each floor it touches the floor's triangles are clipped on the CPU to the
    shape's bounds into one dynamic buffer a frame, and the vertex shader reads them at the floor's height plus
    `TELEGRAPH_LIFT`. At most 32 shape-floor draws a frame, in THE TELEGRAPH BUDGET's order (section 25.4). Built by
    EG-ZG (its record, below).
  - Stairs, slopes, ledges and inner platforms are traversal ground. No lord or add aims a blow at a member standing
    there; only the place's own hazards reach them, each drawn by its own pass on its own surface.
- **Walls bound the escape.** `perilAt` and `wayOut` (`src/scenes/gateCourt.js`) search 24 bearings
  (`PERIL_BEARINGS`) bounded only by a court's circle, straight through walls. In a fragment, the union floor
  (`net/egFloor.js`, section 13.2) and the client's arrow search the fight floor's polygon, whose edges are walls,
  and open edges bound the search like walls: an escape never runs into rock or off the edge.
- **The relay's judge is 2D, per floor.** Today the relay keeps trails as `[t, x, y, z]`, but `_trailOf`
  (`server/src/index.js`) and `posAt`/`posAfter` (`src/net/bossRef.js`) hand the judges `[t, x, z]`. EG3 keeps y. A
  member is on a floor while its polygon holds them and their height lies in [the floor - 0.5 m, the floor + 3.0 m]; the
  floor taken is the highest at or below their height plus 0.5 m. A jumper (Jumping 100 peaks at 1.14 m, the fast
  build at 2.68 m) is still on their floor.
- **THE WIDTH RULE.** `deepIn` (`src/net/bossBody.js`) counts a body only when its point and eight probes at
  `BODY_MARGIN` (1.5 m), on world-fixed bearings, all lie inside the shape.
  - A 3 m lane is counted only on a strip 0-0.23 m wide, and never when it lies along a probe bearing (any multiple of
    45°: every hall-axis lane). A 4 m lane is counted on a strip 1.0-1.2 m wide at every bearing.
  - So every aimed blow is at least **4 m across at its narrowest**: a disc of r 2 or more, a lane 4 m wide, a cone
    whose inscribed circle is 4 m across. A lane's wind-up floor is then 2/6.975 + 0.5 = 0.79 s, and every listed
    wind-up (1.0 s or more) clears it.
  - Widened to 4 m: the Breakers' Charge, the Divers' Dive, the Armsmaster's Lunge, Grath's Gore, the Arcane Lattice,
    the Rampart's vents, and the Warden's Charge (3.5 m) where the Spire throws it. The Armsmaster's Riposte becomes a
    cone of 5 m.
  - Pinned: every shape kind's counted share, swept over bearings, is at least 25%.
- **The legion walks the graph, and the lords with it.**
  - Ground kinds walk a fragment's graph from node to node (a search over a dozen nodes), as the Rampart's legion
    walks its line.
  - Every lord and champion walks it too: straight within the piece of the fight ground it stands on, over the graph
    to a goal past it (an arch's gap, a stair, a bridge). A lord's run (a Charge, a Lunge) ends at an arch's wall and
    never climbs a ledge's face, and no run is aimed at a member on a floor of another height.
  - A walker set down off its walk (a charge cut at an arch's wall, a push, a pull, a lord's leap or blink) keeps no way
    on: its next walk is chosen from where it stands, so it never walks straight to a node past a wall. One rule for the
    legion and the lords (`net/egWalkGraph.js` `egWayOn`, EG-ZQ).
  - Harriers hover along the graph, never through rock.
  - Lurkers wait at `anchors.lurker`, Casters stand at `anchors.caster` (raised where the chamber has a second floor),
    and rifts open at `anchors.rift`.
  - Divers dive only in fragments open to the sky.
  - Every body's feet ride the wire: the fight ground under it (a graph walker's region, a stair climbed as it goes, a lip
    stepped off at once), a flier at its mark's height (the floor under the mark, or past that floor's band the mark's own
    feet). A lord's and a champion's ride it as a legion walker's do. Every screen draws, strikes at and hears each body
    there, never at the hall's own height. Built by EG-ZJ (its record, below).
- **The fragment keeps its own clamp.** Climbing and wall-runs would carry a player up a chamber's walls, and a safe
  perch over the fight would make traversal's immunity a ranged build's fortress. So each floor polygon is extruded to
  its `ceil` (to the motor's arena ring `ceilAbove` where it is open to the sky) as the motor's clamp
  (`player.arena.clamp`), with open edges released. `hit` and `ahit` are accepted only from a pose on a fight floor of
  the current fight, and a member off the fight floors for more than 6 s in a fight is hunted by the Harriers.

### 11.8 Moving through a fragment

- **Headroom.** Every passage keeps at least **3.5 m** clear over its floors, **4.5 m** where it carries an inner
  course (the fast build's 2.68 m apex plus the capsule's 1.8 m), and every chamber **6 m**. The solver clamps flights
  by `ceil` (section 10.5). The third-person cameras collide:
  - the Morrowind body's camera pivot rides 1.77 m up (`FOCAL_HEIGHT` 124 units) and drops at most 0.14 m under a
    ceiling (`FOCAL_OBSTACLE_LIMIT` 10 units, `src/player/mwCamera.js`);
  - the Eye Of The Beholder camera rides 0.5 m over the eye and 2 m behind it, and casts twice its offset upward
    (`checkBounds`, `src/player/eotbCamera.js`), so it wants about 2.7 m for its whole offset.
  - 3.5 m gives both their whole offset with room for a ledge's step. No fragment asks for a crouch.
- **The camera in rock.** In the Spire both cameras pull in at once against a wall and ease back out over 0.25 s,
  never snapping. Occluders between the camera and the body dither out (`setDissolve`). On a shaft's ledge facing a
  drop, the pitch biases 20° down and the camera rises to look over the edge, so the landing is seen, not the back;
  under reduced motion it never biases at all.
- **The collider** takes the proxy (section 11.6) in one bucket per fragment: `addMesh`, then `removeBucket` at the
  hall's end.
- **The clamp** is the fragment's own (section 11.7), never the made levels' analytic clamps (the Hour's
  `realmClamp`, the Burning Court's `courtArena`).
- **Magma is the void.** Falling into magma, a chasm or the mist is a cast-back (section 8), with the place's fire on
  the magma's.
- **The fair trail** (section 21) knows fragments: a pose near a floor's height must lie inside that floor's polygon,
  on a ramp, or on an inner platform's footprint at that time.
- **A reconnect** in traversal resumes at the member's last island or plate, with no cast-back's cost (section 22).

### 11.9 Light, sound and budgets

- **Light.** A fragment's light markers join the hall's list, sorted past the cap by the eye's distance outside each
  light's reach (the Hour's `realmLightsWith`, AUDIT SD III V9), under the renderer's cap (16 in
  `src/render/renderer.js`, `EL_MAX_LIGHTS` 48 in `src/render/enhancedLighting.js`).
  - At most 12 lights stand within 40 m of any point. Fragment lights cast no shadow except two a hall, and the
    point-light caches warm over the 8 s gather instead of in a burst at the wake.
  - Magma glows by emission, never by a light, so the cap is spent on gold (the way) and on the band's own colour.
  - Wherever magma borders a fight floor, its luminance stays at or under 0.45, and a non-emissive basalt kerb 0.6 m
    wide carries the edge line between them. Magma is the band's molten orange; the danger edge is Dagon's red, a hue
    no hall's light shares (THE SPIRE DANGER EDGE, section 25.2).
- **Sound.** The reverb is the hall's, set behind the veil at the swap from its fragments' presets
  (`src/systems/reverbPresets.js`: Cave, 2.91 s, in caverns; Stoneroom in the Stacks and the Ossuary; Quarry in open
  fragments).
  - `audio.setReverb` builds a new ConvolverNode and synthesises its impulse on every call (Cave: 25-41 ms on a
    desktop, AUDIT EG II L4-21), so within a hall the reverb changes only by crossfading two convolvers made at the
    swap, each preset's buffer cached for the breach, over 0.4 s at a mouth with 1 m of hysteresis.
  - `audio.holdReverb(owner)`: while the Spire holds the reverb, Better Ambience (which re-asserts its own preset
    whenever its own wish changes, against its `reverbOn` cache) yields, and its cache is cleared on release. Every exit
    path releases.
- **Budgets.** None are documented for the port today. The Spire's are measured, not guessed: EG6b measures the
  Caverns kit and the Hour on SwiftShader and a reference phone (frame time, GL draws, shadow replays) and fixes the
  budgets before EG13. Its starting bounds:
  - a fragment: at most 12,000 drawn triangles, 3,000 collider triangles, 4 lights and 12 draws;
  - a hall: at most four fragments (a fork's Low Road counted), 50,000 drawn triangles, and no more GL draws than the
    Hour's own frame on the reference phone (its 25 steps stand 79 dynamic draws, 82 GL draws).
- **The moving pieces are instanced.** Every dressed moving platform is its own draw today, so a 28-platform span alone
  would pass the Hour's whole frame. EG6b adds an instanced moving-piece pass: one draw per piece kind, per-instance
  matrices from `stepAt`, no shadow. Crumble chunks and Pendulums count against the budget.
- **The cull.** The dungeon arm reads `d.culled` (`src/scenes/worldModes.js`), and nothing sets it today. EG6b sets
  it from each fragment's and each section's bounds against the frustum. Today the arm skips a culled draw entirely,
  and `renderer.drawMesh` is the shadow record's only path (it takes only `{noShadow}`), so a culled draw would leave
  the record too. EG6b adds a shadow-only draw and changes that line, so a culled draw skips the main pass only and
  is still recorded as a shadow caster, because the point-light caches sign themselves over their records'
  identities, and a draw that left the record would make every lantern redraw on every camera turn. Every moving
  piece and dressed platform is `noShadow`.
- **Freed on every exit**: the swap, the tear, the way home, a fall, forsaking, a void and a reload each free the hall's
  meshes, telegraph buffers and reverb buffers; the band's textures are freed at the breach's end. Pinned: after ten
  halls and every exit kind, the live mesh and texture counts return to baseline.

### 11.10 Engines, alcoves and the Annals

- **Engines.** One relay-run interactable per band kit, worked as an Orrery turn is (`{k:'use', i}`, within 2 m, a
  30 s cooldown). An engine aims at the legion; a member caught takes the place's 20%, ringed white 1.5 s, at least
  4 m across:

  | band | engine | what |
  |---|---|---|
  | the Galleries | **the sluice** (the Caverns) | floods a channel for 6 s; adds in it lose 40% of their health |
  | the Galleries | **the shelf** (the Stacks) | topples once: a lane 4 m wide onto adds, 50% |
  | the Cairn | **the soul-bell** (the Ossuary) | stuns Wraiths and Binders for 4 s |
  | the Shade | **the moon-mirror** (the Gloam) | makes a branch solid for 6 s, or blinds Divers for 4 s |
  | the Wellhead | **the drop-hammer** (the Forge) | a disc of r 3, 50% to adds; once a phase it stuns a lord 2 s |

- **Alcoves.** Zero to two in each passage or chamber, behind a false wall (one blow; a faint gold seam shows within
  4 m) or past an optional hard jump. Each holds lumen, a Vestige shard or a page of the Annals. Witnesses see them
  (section 16.5).
- **The Annals of 3E 398.** Thirty pages, each two sentences, kept in the account's service bits
  (`players.eg_annals`), readable at a Redoubt and in the journal: a Battlemage's last note, the Secretary's
  surrender, the apprentice's passage. A lord's first fall adds a page.
- **Vignettes.** Each kit places one to three: a Battlemage dead at a barricade, a Kyn shrine, a rack of broken staves.
  The lore of section 3 is told by the halls, not only by this page.

## 12. The legion - relentless adds

**One wave runner, widened from the gate's.** In `src/net/gateBrain.js`, the private `stepHost` runs the
Legion-Lord's three kinds, tied to the gate's phase, court and trial.

- **EG8 lifts their law** into `net/egHost.js`: a runner driven by a hall's geometry (a court's rim, a rift's place, a
  walkway's line, a fragment's graph, a span's islands).
- **EG8 exports the shared pieces** it needs (`rimSpots`, the spacing law) from the gate's brain, beside the already
  exported `hostTeamHpFor`, and imports them. The gate's `stepHost` stays, its frames and pins unchanged. This is
  SERPENT1's rule again: widen a seam whose default is the gate's own bytes.

**The kinds.** Bodies are Daggerfall's own mobiles (`MOBILE_TYPES` in `src/characters/mobileTypes.js`), so every player
can draw them. A Morrowind body (`CREATURE_MATCH` in `src/characters/creatureBodies.js`) re-skins one where the
player's data and the budget allow. Every blow is a shape the telegraph pass draws, every wind-up keeps its floor
(section 13.2), and every shape is at least 4 m across (THE WIDTH RULE, section 11.7). Floors are ceiled to 10 ms.

| id | kind | does | bodies (band) | body | move | its blow (wind-up / floor) |
|---|---|---|---|---|---|---|
| 0 | **Harrier** | runs at the living member farthest from its anchor (in a Court, from the lord, as the gate's runs from the Warden; elsewhere, from itself), hovering; on a span it bites only on islands and plates | Imp (1); Giant Bat (3) in the Shade | r 0.5, h 1.5 | 5.0 m/s | Bite: disc r 2, 12% + 4 (0.9 s / 0.79 s) |
| 1 | **Sapper** | walks to its OBJECTIVE: a Court's lord (heals it, the gate's law), a Yard's nearest closed rift (opens it again at a third), or a Wellspring's broken anchor | the Atronachs (35, 37, 38) | r 0.7, h 2.3 | 1.6 m/s | none: it is the objective |
| 2 | **Ward-Bearer** | stands and pulses, holding a ward on what it guards (a lord, a portcullis) | Frost Daedra (25); Daedra Seducer (29) in the Shade | r 0.6, h 2.2 | stands | Pulse: disc r 3.5, 18% + 6 of the band's element (1.4 s / 1.01 s) |
| 3 | **Breaker** | winds a charge at a member, runs it, pushes | Daedroth (27) | r 0.8, h 2.4 | 3.0 m/s; the charge 12 m/s | Charge: lane w 4 x 14, 25% + 8, push 6 m (1.1 s / 0.79 s) |
| 4 | **Caster** | stands off 10-18 m, on a raised anchor where the hall has one, and throws at a member every 6-9 s | Fire Daedra (26); Lich (32) in the Cairn | r 0.6, h 2.2 | 2.0 m/s | Bolt: disc r 3 at the member's feet, 20% + 6, the element, leaving a pool (`POOLS` hellfire's) (1.6 s / 0.94 s) |
| 5 | **Diver** | flies at 6-10 m, circles, dives a lane at a member; never onto ground narrower than the lane plus 2 m (6 m) | Harpy (13), Dragonling (34) | r 0.6 | 6.0 m/s | Dive: lane w 4 x 10, 18% + 5 (1.0 s / 0.79 s) |
| 6 | **Lurker** | dormant until a member passes within 6 m (an ambush) or a blow lands on it, then slow and heavy | Gargoyle (22); Iron Atronach (36) in the Wellhead | r 0.9, h 2.6 | 2.2 m/s | Smash: disc r 3, 30% + 10 (1.3 s / 0.94 s) |
| 7 | **Binder** | stands back and raises the last fallen add of its wave once, a 6 s cast broken by blows that land a tenth of its health in it (the hand's and the purse's, never the claim) | Ancient Lich (33) | r 0.6, h 2.2 | 1.2 m/s | none: the raise |
| 8 | **Wraith** | drifts in and tethers the nearest member on a fight floor: 3% of max health a second while within 8 m, broken by putting 10 m between | Wraith (23), Ghost (18) | r 0.5 | 2.5 m/s | Drain: a tether (the pull-apart grammar, section 25.5) |

**ROLE READS.** Kill priority in every horde mode is read from silhouette, so among the legion's kinds one sprite never
plays two roles in a band, and every role also carries a mark that is not a colour (a lord that shares an add's
sprite is told apart by its scale of 2.5 or more and the boss ring):

- the Ward-Bearer stands at 1.15 scale with a ward ring at its feet;
- the Caster flares its hand 0.4 s before each Bolt;
- the Binder draws a violet beam to the body it raises, with a bar for its 6 s cast;
- the Sapper walks at 1.1 scale over dashes that show its path;
- the Lurker, dormant, keeps no rim light: a statue's pose, dust, and a low grind within 10 m. Waking, it rises over
  0.6 s and its rim light comes up before its wind-up begins. *Something stirs.*, once a hall;
- a lord stands at 2.5 times or more, always with the boss mark ring.

**The push** is a new blow effect, applied by the struck client as the Steps' gust is (`collider.move`, capped per
frame), and resisted by the Iron Footing Vestige. Near an edge it is a cast-back.

**Health and the waves.**

- **Health**: a kind's health is seconds of reference damage, as the gate's are (the Harrier's `HARRIER_S`, 3 s of the
  hall's mean reference damage). It is shared over a wave where the kind is a team's, through `hostTeamHpFor`, and
  scaled by the depth `x (1 + 0.04(c-1))`.
- **Size**: a wave counts the living company, as the gate's do, clamped by kind.
- **Cadence and cap**: the hall's (section 8.1), the cadence quickening with depth (section 18). Every wave is held to
  the room under the cap (`egLegionRoom`, `net/egLegion.js`): the hall's, a lord's fury's and its summons', Hunting
  Pack's, and a Kynval squad (its first affixes kept). A friend (the Ghost, the Deserter) is no foe under it.
- **Fade** (section 15): every kind picks among the members it sees, never one in its Fade, but an Unshaken elite
  (section 8.7). A shape aimed at another still lands on a Faded member, and a dormant Lurker wakes at anyone's
  nearness.
- **Targets**: an absent body is never chosen (section 6.1).

**Unlocks by band**:

- Galleries: kinds 0, 1, 2, 3, 4, 6;
- Cairn: + 7, 8;
- Shade: + 5;
- Wellhead: all of them, with a Daedra Lord (31) as an elite add (x5 health, the Warden's Cleave, never under its
  floor) one wave in six.

**Pure, and the relay's.** The runner's dice are the tick's rng (the relay's CSPRNG), as every brain's are.

- **Frames out**: the Legion-Lord's: `ad` (a wave risen), `amv` (the walks), `aatk` (a blow), `ah` (a health), `adie`
  (gone).
- **Frames in**: blows on adds arrive as `ahit` through `applyHostHit`'s hand and purse.

A hall with no legion draws no dice.

## 13. The lords - the bosses

### 13.1 One seam for every boss

The relay hosts three bosses, each in its own host (`_gateTick`, `_gateFrame`, `_gateFall`; `_sdFightTick`,
`_sdFightFrame`, `_sdFightFall`; the serpent's), and since EG3 (EG-H3) every one of them through **one boss seam**
(`net/bossSeam.js`). A realm holds ONE fight (`this._sdFight`). It is the shape every brain already kept by convention,
made a contract:

```
new(profile, rng)            join(f, sub, name, lv, now, present)      hit(f, sub, d, r, pose, now, seq)
step(f, now, bodies, rng) -> frames[]      stateOf(f)      judge(f, blow, trails) -> [{sub, share}]      earned(f, sub)
```

The gate, the Remnant and the serpent are re-plugged into it with their pins unchanged and their frames byte for
byte. The Spire's lords are written to it. The gate's brain already exports the hand and the purse (`spendBlow`,
`spendPurse`), the share's retirement for absence (`retireShare`/`restoreShare`), the seat (`freeSeat`), the chart
(`damageChart`) and the choice of blow (`chooseAttack`), and the Remnant imports them.

### 13.2 The law every lord keeps

- **Health**: `ttkRef(c)` seconds of reference damage per fighter (`dpsRef(lv)`, the gate's level claim), added as the
  gate adds its fighters. `ttkRef(c) = 180 x 1.07^(c-1)` to circle 20, then `x 1.03` a circle (`EG_TTK_S`,
  `EG_TTK_GROWTH`, `EG_TTK_GROWTH_DEEP`).
- **A fall retires a share, which is new.** Both the gate and the Remnant call `retireShare` only for absence
  (`ABSENT_RETIRE_MS`), and the Remnant restores the share of every body in its arena, alive or fallen. The Spire
  retires a fallen member's share at the fall and restores it at the recall; its seen-and-restore step skips the
  fallen, or the next tick would restore the share. Seven members never face a lord sized for eight.
  - Built by EG-ZQ (its record, below), through the boss seam's `join`. The members a hall can gain mid-fight are those a
    Memento calls back into it (a member is admitted only in the open window, before the first wake: section 6.1). Each
    brings its share at the fraction the lord stands at, as the gate adds a fighter. The last share in a lord is never
    retired.
- **The bucket**: the gate's (`BUCKET_RATE_X` 3, `BUCKET_DEPTH_X` 15, `HIT_CAP_X` 12), each member's times their
  Vestiges' factors (section 15): the client-declared at most 1.25, the relay-established at most 1.6, and **together
  at most `EG_BUCKET_ALL_MAX` 1.6**.
- **Blows**: shares of the struck member's own maximum health, resolved on the struck member's machine (co-op's law).
  Depth adds 2% a circle; depth and fury together multiply a share by at most **1.5** (`EG_SHARE_X_MAX`), reached at
  circle 26.
- **Phases**: at the gate's `PHASE_AT` (0.66, 0.33) unless the lord says otherwise, each turn shielded `SHIELD_MS`
  (3 s). Each phase adds a mechanic and never a faster one. A signature errand starts at its phase's turn: the shield
  holds until the errand is called, and blows past the next threshold are refused until it resolves, so a strong
  company cannot burn past what makes a lord itself.
- **Targeting**: the gate's. 60% to the top of threat (`THREAT_PICK`) and 40% to a random living member, threat
  forgetting `THREAT_DECAY` a second. An absent body is never chosen.
- **FURY**, the endless lord's answer to a slow company. At `EG_FURY_RATIO` (1.5) x `ttkRef(c)` seconds into the
  fight (so a company at reference damage, at 80% uptime, finishes before it), a lord turns to fury: *Grath rages.*
  Every 30 s after:
  - it raises one wave of its band's legion;
  - its shares grow by a tenth, within the 1.5 cap;
  - from the second step, its aimed blows chain a second shape. The second shape's dim outline appears with the first
    shape's (the gate's "dim outline at once" grammar); its fill starts when the first lands and lasts `max(the blow's
    own wind-up, its wind-up floor + 0.3 s, 1.0 s)`, so a chained shape never counts down faster than the same blow
    alone.
  - Fury NEVER shortens a wind-up (NOTHING GETS FASTER; Mac, WBX: *"I dont think making mechanics faster is the
    play"*). It makes a slow fight crowded and costly, not unreadable.
- **THE WIND-UP FLOOR** holds for every blow of every lord and add, under every phase, decree and fury:
  - `windup >= escapeS(shape) + EG_REACT_S (0.5)`, where `escapeS` is the farthest interior point's distance to the
    shape's edge over the escape build's run (6.975 m/s), ceiled to 10 ms;
  - a disc's farthest point is its radius away; a lane's is half its width; a ring's, half its band; a cone's, its
    inscribed radius;
  - the floor CLAMPS: it lengthens a wind-up and never refuses a blow;
  - what the gate ships does not all keep it. The Warden's third-phase Slam (disc r 7, 1.6 s x `PHASE3_WINDUP` 0.8 =
    1.28 s) has a floor of 1.51 s at the escape build, and Colossal's (r 8.5) one of 1.72 s; the third-phase Crushing
    Leap (disc r 6, 1.2 s) has one of 1.37 s. In the Spire the gate's `PHASE3_WINDUP` is not applied: every blow
    keeps its own wind-up in every phase (each phase adds a mechanic, never a faster one), so the Valkynaz's Cleave,
    Slam and Meteor stand at the gate's phase-1 wind-ups, at or above their floors;
  - the 0.5 s slack is a human's reaction plus a one-way latency. A smaller slack, like the gate's 0.35, is fine where
    a death is cheap, but not in a long one-life run.
- **THE UNION FLOOR**, judged in time. Each shape being escapable alone is not enough: a Breaker's lane, a Bolt and a
  Slam together can trap a member, and a sequenced blow (the Lattice, Chained Blows, a fury chain, Twin Charge) is a
  trap only in time.
  - Every tick, the relay sorts the shapes pending on each member by when they land. A set of 1 m cells over the
    member's fight floor starts at the cells they can reach before the first landing; between landings it dilates by
    the escape build's speed times the gap less `EG_REACT_S`, and at each landing it loses that shape's cells. Walls
    and open edges bound it. A new blow is held only if it would empty the set.
  - A held blow waits a tick (250 ms), at most four ticks, then is dropped. A blow held after its `tell` went out sends
    `{k:'untell', i}`, so no ghost outline stays on the floor.
  - Pendulums, vents and the place's hazards are tested in the same set.
  - The search lives in `net/egFloor.js` (section 9), the client's arrow beside it, both over the fight floor's polygon.
  - Pinned: the Arcane Lattice and Chained Blows are passable at *n* = 1.
- **THE WIDTH RULE** (section 11.7): every aimed blow is at least 4 m across at its narrowest, or the relay's census
  could never see it.
- **THE CHECK CLASS.** A whole-court blow (no edge to run to), a haven blow, or an errand's failure blow is a CHECK
  (the Covenant's Weight, section 18, is the one CHECK without a feasibility pin: it is a fight's end, not an errand):
  - its wind-up and its damage are fixed: no phase, fury, decree or depth shortens or raises them;
  - it carries its own feasibility pin for *n* = 1 to 8 (THE ERRAND FLOOR, below), which a haven's route obeys too;
  - the gate exempts its own the same way (`isDagons`, `windupOf`).
- **THE ERRAND FLOOR** (pinned beside the wind-up floor):
  - an errand that needs *k* bodies needs `min(k, n)`;
  - its window is at least a lone runner's route at the escape build plus 1.5 s;
  - CI solves every lord's errands for *n* = 1 to 8, as the span solver solves spans;
  - a party of one is a company, and the Alone board is real (section 20).
- **Errands by numeral.** The relay gives every errand to the nearest unassigned living member and draws it with their
  numeral (*III - Mira* on rune III). An errand for two groups splits the numerals at `ceil(n/2)` (the Twins' courts
  from *n* = 3, the Cairn-Keeper's gems). Eight strangers with text chat need to know who stands where without a word.
- **Tells only the engine can give.** What lands is what the ground shows, and EVERY real blow glints with its WIND
  cue (the gate's wind-up sound, `World-Bosses.md` WB13d). A feint follows Feud-Arc section 7.3 exactly: its mark
  fills to `FEINT_AT` (0.55), is cut, and fades out dashed over 0.15 s, with no glint and no WIND. The lord's `atk`
  frame carries no feint flag: the relay sends `{k:'cut', i}` at `FEINT_AT`, so a modified client cannot read the
  feint early. No tell depends on a shadow, which a billboard and a phone cannot promise.
- **The beats.** Every lord wakes with its card (its name and epithet), turns each phase with the gate's phase card
  (the numeral, the phase's name, one order: *The bridges burn.*), and falls with the gate's fall beats (WB13e), then
  the damage chart (section 27.6).
- **Marks on members.** A lord's mark on a member (the Scent, a soul-mark, Fire-touched, a chain, the cage) shows as a
  chip with a radial timer beside their vitals and a sigil over their head that the company sees, always in Dagon's
  red with its own shape (section 25.5). The marked member hears the personal sting and reads one order: *Hunted -
  run!*, *Lay your soul in a gem!*, *Strike Isk!*

### 13.3 The roster

`egBossOf(seed, c)` draws a Court's lord:

- **the pool**: the band's own lords at weight 2, plus every earlier band's at weight 1, re-aspected: every element
  of its kit is the band's aspect's, as the gate's fire is its aspect's (the Twin Lords keep their clans' fire and frost);
- **no repeat**: never one of the last `min(2, pool - 1)` Courts';
- **the Valkynaz**: every fifth Court (Halls 25, 50, 75, 100...) is a Valkynaz's, outside the draw, and its fall takes
  a Valkynaz Redoubt;
- **THE SEAL**: until a band ships, its predecessor's Valkynaz Redoubt ends the breach as a victory: *The way down is
  sealed. The Galleries are yours.* Everyone living is sent home holding their Reliquaries, and the Descent ranks
  those runs by the fewest seconds to that last Redoubt. The seal lifts with each band's slice, and the herald says so.
  An endless mode never launches as a loop of one band.

Bodies are Daggerfall's, drawn large, as Ruhn is (`BOSS_LOOKS` in `src/world/gateBoss.js`: a mobile and a scale). Each
lord's errand rules are given for *n* = 1, and its numbers keep the floors.

#### The Broken Galleries

1. **Grath, the Hound** (`hound`; Daedroth 27, x3), loosed from the Wellhead's arena to hold the Galleries. The Court
   is an Oblivion Caverns magma chamber (section 11): three basalt islands (r 11) joined by bridges 6 m wide over the
   magma, all fight floors. No lane is ever laid along a bridge.
   - It bounds from island to island (the Warden's Leap). The island it leaves cracks, told 3.7 s (the wind-up floor's
     class: the escape to a bridge is at most 22 m, 3.66 s), and falls for 15 s. A cast-back from a fallen island
     lands on a standing one.
   - Gore: a lane 4 m wide and 18 m long, 1.3 s (floor 0.79 s), push 6 m.
   - Savage: a cone, 7 m, 110°, 1.2 s (floor 0.96 s).
   - **The Scent**: a mark on one member, who is hunted for 8 s at 5.2 m/s, under every build's run (the span build's
     is 5.47). A catch is a **Maul** (a disc of r 3, 1.2 s, 35%). Leading Grath onto a burning bridge or a cracking
     island leaves him **Scorched**: stunned 4 s, taking x1.3. *n* = 1: no Scent; it gores twice as often instead.
   - Phase 2, *the bridges burn*: the bridges burn by turns, the place's own fire and not an aimed lane: a bridge (at
     most 24 m long) is told 3.0 s and burns for 12 s; the escape runs along it to an island (12/6.975 + 0.5 = 2.23 s).
     Phase 3, *the pack*: two Scents at once (when *n* ≥ 3).
   - *A fight about ground.*
2. **The Last Spellmaster** (`spellmaster`; Ancient Lich 33, x2.5): the Spire's master of spells, raised by the Kyn.
   - **Havens**: two to four gold discs (r 3) at radius 13 of the court; everywhere else takes the Haven Nova, 60%. The
     gate's dodge, turned inside out. A CHECK, so its wind-up is THE ERRAND FLOOR's: the longest route to the nearest
     haven plus 1.5 s, which is 5.3 s for two havens (26.1 m), 4.3 s for three (19.5 m) and 3.9 s for four (16.2 m).
   - **Arcane Lattice**: parallel lanes 4 m wide, swept across the court in sequence (the LANES shape; 1.4 s each,
     floor 0.79 s).
   - **Mirror Images**: three images whose blows are feints under Feud's grammar. A blow shatters an image.
   - **Blink**: across the court.
   - Phase 2, **the Examination**: runes light on the rim in an order shown above him, with numerals I-IV and a chime
     each.
     - Each lit rune must be stood on, in the shown order, by a member. With fewer members than runes, one member
       stands several in turn.
     - Runes: `min(4, max(2, n))`. When *n* is under the rune count, the runes stand on a ring of r 8.
     - The window: `10 + 4 x max(0, runes - n)` s, pinned by the errand solver. On the rim the longest route is 52 m:
       7.5 s at the escape build, 9.0 s with THE ERRAND FLOOR's 1.5 s.
     - Failed: 60% to all (a CHECK). Passed: he is stunned 8 s and takes x1.5 (the crystals' law, `STUN_MS`,
       `STUN_HIT_X`).
   - Phase 3, **the Final Examination**: he binds a member in a cage for 8 s. The company breaks `clamp(n-1, 1, 3)`
     seals, and the bound member may shoot seals from inside. *n* = 1: no bind; three seals rise within 6 m, 8 s to
     break them. Failed: 70% to the bound (a CHECK; never Dagon's Wrath's 999%, `World-Bosses.md`).
   - *A fight about reading.*
3. **The Last Armsmaster** (`armsmaster`; Skeletal Warrior 15, x2.6): the Spire's master of arms, raised.
   - **The Challenge**: he marks a member, and a ring of fire (r 6) rises around the two. This is the duel's own ring
     law (DUEL1's `_keepInArena`, `clampToRing`).
     - The challenged must last 15 s or deal a tenth of his health inside it.
     - Outside, the company breaks the ring's `clamp(n - challenged, 1, 3)` braziers (each 4 s of the company's
       reference damage) to open it early, while the legion presses.
     - *n* = 1: no ring; he duels in the open with his whole kit.
   - **Riposte**: a cone (5 m, 90°) that answers a blow landed in the 0.6 s after his guard rises, 0.9 s (floor
     0.80 s). The tell: his blade raised, glinting.
   - **Lunge**: a lane 4 m wide and 10 m long, 1.0 s (floor 0.79 s). **Whirl**: a disc of r 4, 1.3 s (floor 1.08 s).
   - Phase 2, *the second challenge*: two Challenges at once (when *n* ≥ 4).
   - Phase 3, **the Last Lesson**: the court's edge closes 1 m every 6 s, to r 12.
   - *A fight about the duel.*
4. **Valkynaz Ilthys of the Galleries**: Redoubt 5 (section 13.4).

#### The Soul Cairn

5. **The Cairn-Keeper** (`cairnkeeper`; Lich 32, x3), in an Ossuary crypt (r 14).
   - **The Soul Tithe**: every 25 s each member takes a soul-mark. It must be laid in one of four soul-gems on the rim
     (stand 1.5 s) within 9 s. An unfilled gem is never farther than the crypt is wide (28 m: 28/6.975 + 1.5 + 1.5 =
     7.02 s). Otherwise it bursts: 30%, and a Wraith rises.
   - Each gem holds *n* souls, so there are four tithes at any *n*. When all four gems are full he is laid bare:
     stunned 8 s, x1.5.
   - Phase 2, **the Cracked Gem**: one gem shatters, and the other three share its souls: `4n` between them, as
     even as whole souls allow, so there are still four tithes.
   - Phase 3, **the Double Tithe**: two marks a member at each tithe when *n* ≥ 2, and a burst raises two Wraiths.
   - Wraiths drain.
   - *A fight about eight people's errands.*
6. **The Twin Lords, Vael of the Fire Clan and Isk of the Frost Clan** (`twins`; Fire Daedra 26 and Frost Daedra 25,
   x2.6 each), rival clans. Two courts (r 14) joined by a walkway 6 m wide.
   - They must fall within 15 s of each other, or the survivor raises the other at half (the Echoes' law,
     `SD_ECHO_PAIR_MS`).
   - **Fire-touched and Frost-touched**: a member struck by Vael is Fire-touched for 12 s. They deal +25% to Isk and
     take +25% from Vael. The reverse holds for Isk. A blow struck them when the relay's reckoning of the poses finds
     them in it as it lands (the census's), and the mark is said (`emk` 2 and 3) for every screen's sigil. The +25% taken
     is the struck screen's alone: every blow of the Twins carries its clan's element, which the census sees and never
     counts (section 21).
   - **The Crossing**: every 60 s they cross the walkway (at most 24 m long) and change courts. The walkway is struck
     along its length, 3.0 s; the escape runs along it to either court (floor 12/6.975 + 0.5 = 2.23 s).
   - Phase 2, **Rivalry**: the healthier twin's shares rise by a tenth until the two stand within a tenth of each
     other's health.
   - Phase 3, **Both Courts Burn**: the third of each court nearest the walkway becomes the other twin's pool for the
     rest of the fight, told 3.0 s (its deepest point is 10.3 m from safe ground: floor 1.98 s).
   - *n* ≤ 2: they share one court, with a 20 s window.
   - *A fight about splitting the company.*
7. **Valkynaz Morvayn of the Cairn**: Redoubt 10.

#### The Shade Perilous

8. **The Mother of Dusk** (`dusk`; Daedra Seducer 29, x3, winged; Morrowind's Winged Twilight, which flies). Dagon
   gave her kind its wings. She circles over a Gloam glade open to the sky, beyond the court and out of a blade's reach.
   - Dives (lanes 4 m wide; never onto ground narrower than 6 m) and Hellfire.
   - **Three anchors** hold her to the rim. They are bodies a blade strikes, each 6 s of the company's reference
     damage. With all three broken she is dragged down and grounded for 30 s, x1.3; they rise again 20 s after she takes
     the air, and only anchors broken drag her down.
   - **Gutterdark**: the braziers gutter in turn. The floor goes dark; telegraphs keep their light (section 25.6), and
     every foe keeps a rim light.
   - Phase 2, **Wingbeat**: a glade-wide gust every 8 s, told 1 s, 3 m/s for 1 s (the Steps' gust).
   - Phase 3, **Moonfall**: the anchors rise again 40 s after a grounding ends, two Divers with each.
   - *A fight about the air.*
9. **The Night-Stalker** (`stalker`; Vampire Ancient 30, x2.5).
   - He vanishes. Where he stands is drawn as an umbral disc on the floor, the telegraph pass's mark kind.
   - **Blood Tether** on two members, broken by standing 14 m apart for 2 s; it heals him (the pull-apart grammar).
     *n* = 1: it binds a Blood Thrall (a Harrier body) 4 m away; kill it or put 14 m between.
   - Bat swarms: Harriers as Giant Bats.
   - Phase 2, **Three Shadows**: three umbral discs; the true one glints with his WIND.
   - Phase 3, **Blood Moon**: tethers on three members, broken at 16 m.
   - *A fight about distance.*
10. **Valkynaz Seyth of the Shade**: Redoubt 15.

#### The Havoc Wellhead

11. **The Bound Colossus** (`colossus`; Iron Atronach 36, x4): the Battlemages' war-engine, Dagon's now.
    - It walks a fixed route down the Forge Gut's long forge chamber (55 m), stamping lanes 4 m wide and 12 m long ahead
      of it (1.4 s; floor 0.79 s).
    - Its vent-hearts, `4 + 2·floor(n/3)` (4 to 8, always even), are on its back, in pairs within 6 m of each other.
      **Rails rise along its flank every 15 s** (`carryBy`) and carry members up to them: the Spire's own platforming,
      inside the fight.
    - Break every heart before its Overload (every 75 s; 70% to all, a CHECK) and it is stunned 8 s, x1.5.
    - Chain lightning: a disc of r 2.5 on a member (1.2 s; floor 0.86 s) that leaps to the nearest member within 6 m.
      Spread.
    - Phase 2, **Paired Hearts**: the two hearts of a pair must break within 5 s of each other, or both relight. One
      member breaks a pair alone in time (6/6.975 + 1.5 = 2.37 s).
    - Phase 3, **Breakdown**: it kneels for 20 s at x1.5 (a stun's stillness, and its weight never a stun's times the
      kneel's), then walks half its route: the half it knelt in.
    - *A fight you climb.*
12. **The Wellhead Wyrm** (`wyrm`; Dragonling 34, x5, flying).
    - In an open-sky cavern, it perches on three pillars, breathing lanes (4 m x 16 m, 1.4 s; floor 0.79 s) and cones
      (10 m, 90°, 1.5 s; floor 1.10 s); it takes flight and drops meteors (discs of r 4, 1.8 s; floor 1.08 s).
    - Each pillar is reached by a side span and broken from on top. With its perch broken it lands, x1.3, for 25 s,
      until it finds another; with none left standing it stays down.
    - Phase 2, **Burning Perches**: the pillar it leaves erupts as its perch breaks under it (a disc of r 6, 2.0 s;
      floor 1.37 s).
    - Phase 3, **Grounded**: no perch; a breath of 180° and 12 m (inscribed r 6; floor 1.37 s; wind-up 1.6 s).
    - *A fight for every build.*
13. **Valkynaz Garoth of the Wellhead**: Redoubt 20, and every fifth after.

### 13.4 The Valkynaz

ONE brain (`net/egLord.js`) with a signature for each Valkynaz. Each fights on its band's own ground, with three of
the gate's blows (Cleave, Slam and the Meteor from `ATTACKS`, at the depth's shares, each lengthened to its floor, the
Meteor named by the aspect and leaving the gate's burning ground, `POOLS`'), two
of its own, its signature, and a third-phase set-piece. Each wears its own look (`BOSS_LOOKS`: Daedra Lord 31 at 3.0,
3.3, 3.6 and 4.0, tinted by band) and its own WIND set. The deepest boss of the endless mode is never the commonest
fight of the game again.

| Valkynaz | Redoubt | aspect (`GATE_ASPECTS`) | ground | its own blows | signature | phase 3 |
|---|---|---|---|---|---|---|
| **Ilthys of the Galleries** | 5 | Burning | **the Council Rotunda**: a floor of r 24 and three balconies 4 m up, two stairs each | **Spear of the Conquest** (a lane 4 m x 22 m, 1.3 s); **the Muster-Call** (a wave from the balconies) | **the Conquest**: he plants a banner (a Ward-Bearer body) on each balcony that claims a third of the floor. Claimed ground burns (a pool, told 3.5 s: the longest way off a third of the floor is 20.8 m) until its banner is broken, and while two banners stand they hold his ward (25 s at most) | **the Last Charge**: a third of the floor falls every 20 s, told 5 s ahead, and rises again when the next falls |
| **Morvayn of the Cairn** | 10 | Venom-Blooded | **the Soul-Bridge**: two Ossuary crypts (r 14) joined by a rib bridge 30 m long | **Venom Lash** (a cone 8 m, 90°, 1.3 s); **Soul Rend** (a disc of r 4 on a chained pair's midpoint, 1.5 s) | **the Chaining**: pairs of members are bound by soul-chains for 20 s (the stay-close grammar). A pair stretched past 8 m both take 30% (a CHECK), and a blow on one is shared with the other: divided between the chain, a pair's halves (a three's thirds). An odd member, or a member alone, is chained to a Wraith; kill it to break the chain | **the Last Rites**: Wraiths rise at both crypts every 20 s, and chains bind threes |
| **Seyth of the Shade** | 15 | Rime-Wrought | **the Eclipse Vault** (section 11.2), the Eclipse running | **Frost Lance** (a lane 4 m x 18 m, 1.2 s); **Moonshatter** (three discs of r 2.5 at members' feet, 1.4 s) | **the Mirrorcourt**: two mirror lords fight beside him and throw real blows at half share. Only the true lord casts his ground mark and his bar's pip; the mirrors shimmer (a 2 Hz dither line) and crack audibly when struck. A mirror shatters after 8 s of the company's reference damage and returns 20 s later | **the Long Night**: Gutterdark over the whole vault, while the moon-shafts walk at a fixed 1.5 m/s |
| **Garoth of the Wellhead** | 20, 25, 30... | each of the four in turn, in `GATE_ASPECTS`' order: Burning at Redoubt 20, Rime-Wrought at 25, Storm-Crowned at 30, Venom-Blooded at 35 | **the Clan Pit** (section 11.2) | **Wellfire** (two lanes 4 m wide crossing at his feet, 1.4 s); **the Kyn's Due** (a disc of r 5 on the top of threat, 1.6 s) | **the Clan Muster**: each phase turn calls an honour duel (one member, the Armsmaster's ring law, r 6, 15 s; none at *n* = 1) | one of the three older signatures, by turns from one Garoth Redoubt to the next, under the next aspect, with every decree the circle bears |

A Valkynaz's Redoubt rolls its spoils twice and may give a key (sections 5, 19). The first Valkynaz a company fells is
its first true feat in the Spire.

## 14. Decrees - what deepens a circle

At each Redoubt the next circle's **decrees** are chosen and shown on the beacon: *The next circle bears: Gale-Swept,
Hunting Pack.* With them the beacon names the next lord: *The next Court: Grath, the Hound.* The company knows what is
coming before it chooses to go on.

- **How many**: circle 1, none. From circle 2, `min(4, 1 + floor((c-2)/2))`.
- **One per family**: never two from one of the five families, so a company can track every one. Dagon's Bargain
  (section 8.7) may add one more for its circle, from a free family.
- **Standing decrees.** The week's Proclamation (section 20) and a Wager's decrees (section 18) stand for the whole
  breach and hold their families: a circle's drawn decrees, and a Bargain's, come only from the families they leave
  free, and a Wager's three come from three different families. So a circle bears at most nine (four drawn, a
  Bargain's, the Proclamation and three wagered), and the frames carry nine under their own validator.
- **The company chooses.** For each family the circle draws, the beacon offers two of its decrees, and the company's
  word (section 16.4) takes one; a tie takes the first shown. Dagon chooses which families; the company chooses how
  it suffers them.
- **Ranks**: from circle 10, one decree a circle ranks up to II instead (the table's last column).
- **Tides and strata**: past circle 20, the Wellhead's tide joins them, and from Redoubt 20 its strata (section 18).

Every decree but the lord family's changes what a member does or sees; the lord family's are named on the lord's
card.

| family | decree | what | at rank II |
|---|---|---|---|
| **blows** | **Chained Blows** | the legion's blows chain a second shape, its outline shown with the first's, filling as the first lands and landing `max(the blow's own wind-up, its floor + 0.3 s, 1.0 s)` later | a third shape after the second |
| | **Twin Charge** | a Breaker's charge is followed by a second lane, its outline shown with the first's, landing 1.2 s after the first | a third lane, 1.2 s after the second |
| | **Pyre-Bound** | a slain add bursts: a disc of r 2.5, 1.0 s (floor 0.86 s), 10% | a disc of r 3.5, 1.2 s (floor 1.01 s), 15% |
| | **Vengeful Shades** | a slain add's shade follows its slayer at 3 m/s for 6 s, then bursts: a disc of r 2, 1.0 s (floor 0.79 s), 10% | 15% |
| **legion** | **Hunting Pack** | Harriers on every hall, a wave every 30 s | a wave every 20 s |
| | **Swarm-Mother** | every wave carries a Binder (from the Cairn) | two Binders |
| | **Kyn's Vigil** | every hall's trial begins with the band's champion on the arrival plate, with its escort (`1 + ceil(n/3)`, section 8.5); never in a Proving Walk or a Court (their own stand there), the Scriptorium (no trial), a span or a Brink (a crossing: its plate is the crossing's start, and a champion keeps to the fight ground, so it could follow no one) | with its escort doubled |
| | **Kyn's Rally** | a slain add gives its wave's living +10% health, up to three stacks, shown as pips over them | +15% a stack |
| | **Soul-Pools** | a slain add leaves a pool (r 2.5) for 8 s that heals adds 3% a second unless a member stands in it | r 3.5 |
| **ground** | **Ashfall** | fire falls on court discs: a meteor's disc every 12 s | every 8 s |
| | **Gale-Swept** | every span (a Span's, a Proving Walk's) carries a Gust section (from the Cairn) | two Gust sections |
| | **Crumbling Halls** | every span carries a Crumble section, and has one island fewer | two Crumble sections, two islands fewer |
| | **Wellhead Sparks** | every 20 s, `ceil(n/2)` sparks rise, each felled by one blow; any left after 8 s bursts (a disc of r 2.5, 1.2 s, 15%) | `n` sparks |
| **the Covenant** | **The Covenant's Press** | the next Redoubt adds 10 minutes, not 15; the count's chip says so (*+10:00 - the Covenant's Press*) | 5 minutes |
| | **Ashen Vigil** | the next rest heals half; the rest card says so | a quarter |
| **lord** | **Colossal**, **Unyielding**, **Vengeful**, **Grudge-Bearer** | the gate's boss-general trials, recast as laws (below), on the Court's lord alone | the laws' rank II values (below) |

A wave's cadence and a decree's own cadence (Hunting Pack, Ashfall) are "more at once", which depth may add. NOTHING
GETS FASTER binds every wind-up, every piece's timing and every crumble, never the number of things at once (section
18).

**The merge.** The gate's trials carry no `.law`, and their keys (`hp`, `dmg`, `hit`, `size`, `slamR`, `groundMs`,
`shieldMs`, `threatPick`, `threatDecay`, `heal`, `feeds`, `legion`) do not end in `X`. So `sdMarksLaw`'s rule (a key
ending in `X` multiplies; any other is overridden by the last mark that names it) cannot fold them as they stand. EG5
recasts the four boss-general trials as X-keyed laws:

- Colossal: `sizeX` 1.25, `hpX` 1.25, `radiusX` 1.2 (II: 1.4, 1.4, 1.3). The Slam becomes 8.4 m (floor 1.71 s); the
  floor lengthens every wind-up it widens. The lord stands at its size: its body's radius, and a body's row on the wire
  (`sz`), which every screen draws it at (EG-ZQ);
- Unyielding: `shieldX` 2, `hitX` 0.85 (II: 3, 0.75), in place of the trial's `shieldMs`;
- Vengeful: `dmgX` 1.25 (II: 1.4). Every share multiplier, depth's, fury's and Vengeful's, together is at most 1.5;
- Grudge-Bearer: `threatPick` 0.85, `threatDecay` 0 (II: `threatPick` 0.95).

The gate's trials written against the Warden's own attacks (Scarring, Dagon's Favoured, Echoing, Soul-Hungry) are not
drawn, nor is the ninth, Legion-Lord: the Spire's legion is its own (section 12). The Hour's decree **The Fraying**
(`SD_OMENS`, fray 36) is drawn only for a circle with an Athenaeum, through `orreryOf`'s fray parameter. The Spire's
new decrees (every family but lord) never reuse the name of one of the gate's trials or one of the Hour's omens.

**The profile.** `egFightProfile(decrees)` folds them as `sdFightProfile` does. Its cache is keyed by the sorted decree
string and bounded (LRU 256): the gate's and the Hour's caches assume a bounded set of 185 or 216, and the Spire's is
not. The Spire's frames carry up to nine decrees, the tide and the strata under their own validator. The gate's
`validGateMods` (three words) is not touched.

Every decree is relay-side, the shared clock's law, or a word the relay says (a rest's heal). None asks the client to
handicap itself.

## 15. Vestiges - what the Battlemages left

**This page's decision on question 4: yes.** An endless run without a build that changes inside it plays the same at
Hall 60 as at Hall 6, and eight members choosing what to become is what makes a company more than eight builds.

- At each Redoubt, every living member is offered **three Vestiges**, drawn by the relay's rng from three different
  families, and takes **one** within the rest. Unpicked, the first is taken.
- Taking one already held ranks it, **I -> II -> III**. An offer never shows one held at III.
- **The lean**: at the first Redoubt, one of the three is always drawn from the family of the member's most-used blow
  kind in the circle (the hit's `r`): melee leans to Blade, an arrow to Hunt, a spell to Arcana. It nudges and never
  decides; the room knows nothing of classes and should not.
- **More cards**: Surplus (section 6.2) buys a fourth card or a reroll. A **bequest** (section 16.5) adds the fallen's
  card. A Mastery (below) adds one more. They stack: an offer holds at most six cards. Three Vestige shards (section
  17.1) make a rank of a held Vestige, or a pick of two new ones.
- They last until the breach closes. The room holds each member's, says them to the company (auras need it), and the
  Redoubt's receipt carries them.

**The trust law.** A player owns their body (co-op's law). A Vestige that changes only the holder's body is as honest
as their save. Every Vestige that raises damage on a relay foe does so through the relay:

- a **conditional** one (a condition the relay cannot see) declares its EXPECTED gain as a bucket factor;
- one whose condition the relay itself establishes (a distance between poses, an add's health, an ally's place, an
  ally fallen) is applied by the relay to that blow;
- the product of the client-declared factors on a member is capped at **`EG_BUCKET_X_MAX` 1.25**. A modified client's
  ceiling rises by a quarter at most;
- the relay-established factors cannot be forged, and are capped on their own: their product at **`EG_RELAY_X_MAX`
  1.6** (Culling Edge III alone reaches it);
- **both together are capped at `EG_BUCKET_ALL_MAX` 1.6**, the column section 18's model carries.

| family | Vestige | I / II / III | applied by |
|---|---|---|---|
| **Stone** | **Stoneskin** | +10 / 18 / 25% max health | client; the relay's census counts its holder's whole body |
| | **Iron Footing** | push taken -35 / 65 / 100% (Breakers, Pendulums, Gusts) | client |
| | **Second Wind** | once a hall, falling under 30% heals 15 / 25 / 35% | client |
| | **Bastion** | allies within 6 m take 4 / 8 / 12% less from blows | allies' clients, from the room's word; the relay's census applies it too |
| | **Challenger's Oath** | your threat x1.5 / 2 / 2.5; lords' blows on you -5 / 10 / 15% | relay (threat), client (blows) |
| **Blade** | **Searing Edge** | melee blows +3 / 6 / 9 fire | client; expected factor 1.04 / 1.07 / 1.10 |
| | **Momentum** | blows on one target +4% each, to 3 / 4 / 5 stacks | client; expected 1.05 / 1.07 / 1.09 |
| | **Sweeping Arc** | melee blows splash 20 / 35 / 50% to adds within 3 m of the target | relay (host hits) |
| | **Bloodied Fury** | under half health +10 / 18 / 25% damage | client; expected 1.03 / 1.05 / 1.07 |
| | **Culling Edge** | +30 / 45 / 60% on adds under a quarter health | relay (it knows the add's health) |
| **Hunt** | **Long Sight** | arrows and spells from beyond 12 m +8 / 14 / 20% | relay (it knows both poses) |
| | **Featherstep** | your crumbles wait +0.2 / 0.35 / 0.5 s; cast-backs cost 8 / 6 / 4% | client (crumbles are private) |
| | **Fade** | after you strike, adds lose you for 1.5 / 2.5 / 3.5 s, once every `EG_FADE_CD_S` 8 s | relay (targeting) |
| | **Hunter's Mark** | your first arrow on a foe marks it 8 s: the company deals +5 / 8 / 12% to it | relay |
| | **Fleetfoot** | run speed +4 / 7 / 10% | client (spans are laid for the span build) |
| **Arcana** | **Battlemage's Focus** | spell cost -10 / 18 / 25% | client |
| | **Overcharge** | spell blows +8 / 14 / 20% | client; expected 1.08 / 1.14 / 1.20 |
| | **Spellbane** | every resistance +10 / 18 / 25 | client (the saving throw) |
| | **Shieldweaver** | your Shield spell soaks +20 / 35 / 50% | client (`hurtPlayer`'s pool) |
| | **Arcane Echo** | a damage spell repeats at half, 10 / 16 / 22% of casts | client; expected 1.05 / 1.08 / 1.11 |
| **Fellowship** | **Rally** | when a hall's door opens, the company heals 8 / 14 / 20% | each client, from the room's word |
| | **Spire's Standard** | allies within 10 m +4 / 7 / 10% damage | relay (a factor while near) |
| | **Watchfire** | blows aimed within 12 m of you are told early to the company (below) | relay |
| | **Fallen's Due** | when an ally falls, the living deal +10 / 15 / 20% for the rest of the hall | relay |
| | **Steadfast Line** | with three allies within 8 m, you take 5 / 10 / 15% less | client, from poses; the relay's census applies it too |
| | **Mender's Grace** | heals you cast on allies +15 / 25 / 35% | the receiver's client, from the room's word (ALLY-CAST's law) |
| | **Lifeline** | a heal you cast on an ally under 30% gives them 3 s of 20 / 30 / 40% less from blows - a heal believed at a twentieth of a reference body or more (`EG_LIFELINE_MIN`), so no point's heal holds it open | the receiver's client; the relay's census applies it too |

The Redoubt's card shows the circle's damage chart with the gate's Healed column (`src/ui/gateDamageChart.js`,
GATE-HEAL), so a company of eight sees what its healer did.

**Mastery Vestiges** change what their holder does, not a number. One is offered as a fourth card at Redoubt 3 and at
every Valkynaz Redoubt; a member holds one at a time, and taking another replaces it.

| family | Mastery | what | applied by |
|---|---|---|---|
| **Stone** | **Immovable** | stand still for 1 s on a fight floor, and blows on you deal 25% less and pushes do nothing until you move | client; the relay's census applies it too |
| **Blade** | **Counterstroke** | a melee blow on a lord within 0.6 s after one of its blows lands within 6 m of you deals x1.4 | relay (it knows both), inside the 1.6 cap |
| **Hunt** | **Spotter** | your arrows wake Lurkers at any range, and a woken or struck foe is marked +10% for 8 s | relay |
| **Arcana** | **Spillover** | a spell's overkill on an add carries to the nearest add within 6 m | relay (host hits); the carry out of the member's purse, within its blow's cap |
| **Fellowship** | **Spirebridge** | once a span, a gold bridge over the next gap for the company, for 6 s | the room's word; known to the fair trail, and the crossing's bounds are solved with it |

**Accords.** Two members within 10 m, holding a named pair from two different families, gain an Accord while they
stand together. The offer card names it and says what it does: *Takes an Accord with Mira's Hunter's Mark. Hammer and
Anvil: A foe the mark's holder marked takes +8% from the oath's holder.* Every Accord is applied by the
relay, inside the caps:

| Accord | the pair | what |
|---|---|---|
| **Hammer and Anvil** | Challenger's Oath + Hunter's Mark | a foe the mark's holder marked takes +8% from the oath's holder |
| **Shield-Hymn** | Bastion + Rally | Rally's heal also gives the company 4 s of Bastion's protection |
| **Ambush** | Fade + Spire's Standard | the first blow after a Fade, within 10 m of the Standard's holder, deals +15% |
| **Kindled Steel** | Searing Edge + Overcharge | the Edge holder's melee fire splashes 2 m (relay host hits) |
| **Far Watch** | Long Sight + Watchfire | Watchfire's lead grows by 0.05 s for blows aimed at the Long Sight holder, never past the 0.4 s the brain commits |
| **Living Wall** | Stoneskin + Mender's Grace | heals on the Stoneskin holder +10% |
| **No Quarter** | Culling Edge + Fallen's Due | while Fallen's Due burns, Culling Edge reaches adds under a third of their health |
| **War-Chorus** | Arcane Echo + Spire's Standard | within 10 m of the Standard, an Echo repeats at full |

**Watchfire.** Every lord's brain commits each blow `EG_TELL_LEAD_MS` (400 ms) before its wind-up begins, whether or
not anyone holds Watchfire, so the blow's timing never depends on who does. The holder's company sees the early
outline as a PULSING solid red line (a dashed line is a feint's), and a blue pip marks the holder (blue is yours,
section 25.2). The warning itself is never blue, since blue on a danger shape reads as safe (WB13a T8). Rank sets how
much of the lead is shown: 0.15 / 0.25 / 0.35 s. A member sees another's Watchfire lines only for blows within 12 m of
themselves.

**Stacking.** Eight holders of one aura are not eight auras:

- the same Vestige aura from several holders applies the strongest, plus 2% for each other holder, at most +6% over
  it;
- every Vestige's damage reduction together is at most 30%;
- the client-declared damage factors together are at most 1.25, the relay-established ones at most 1.6, and both
  together at most 1.6;
- a Vestige aura draws as one thin blue ring (0.6 m) at its holder's feet, never a cloud over the floor the telegraphs
  live on.

**Resonance.** Three different Vestiges of one family (ranks and Masteries do not count) grant that family's capstone,
for the breach:

- **Stone, Rooted**: immune to push, and your threat doubles;
- **Blade, Bladestorm**: every fifth melee blow strikes every foe within 3 m (relay host hits);
- **Hunt, Deadeye**: an arrow from beyond 12 m pierces the add behind its target;
- **Arcana, Spellweave**: every fourth damage spell costs nothing;
- **Fellowship, Rallying Cry**: Rally's heal and every Second Wind in the company refresh when a hall's door opens.

A card that would be a member's third different Vestige of a family says so in the Vestiges' blue: *Completes Stone:
Rooted. Immune to push, and your threat doubles.* A capstone is said as it is first reached (*Stone resonates: Rooted.*,
section 27.5), and the recap lists the capstones held (section 27.6).

**Death saves.** Divine Grace (`src/systems/lootPowers.js`, `lootDeathSave`, registered with
`registerPlayerDeathSave`), The Hour Turns (the Brass of Numidium's) and Unbroken (Malacath's)
(`src/systems/sigilSetPowers.js`) are not timers in the Spire. In an `eg:` room each recovers at the next Redoubt
taken, and its chip reads *Redoubt*; so do the Ghost-King's Vigil, a low-health heal that never answers a killing
blow (`lootHurt`), Shed Skin (Sethrakul's Coilscale, `src/systems/sigilSets.js`) and the Panoply's Battlemage's
Reprieve. As timers they would hand out a fresh life every few minutes, and make the Brass of Numidium
mandatory. **Stendarr's AvoidDeath** (`avoidDeath` in `src/systems/guildServices.js`, a rank-in-fifty roll the hosts
consult through `setAvoidDeathHook`) is refused in an `eg:` room: every host's hook answers false there, or a temple
rank would cancel a fall.

## 16. Redoubts, one life, the fallen, the Reliquaries

### 16.1 A Redoubt is a checkpoint

When a Court's lord falls, the Redoubt is taken for every living member at once. Each **earner** gets an `e1`
**receipt** (section 23). An earner, in that circle:

- dealt at least `1/(2n)` of the damage the company dealt in the circle (the relay's chart, lords and legion), *n*
  being the living company at its Court; or
- was ACTIVE in at least three of its five halls: dealt at least `1/(8n)` of the hall's damage, healed others for at
  least `1/(8n)` of what the company took, stood 1.5 s in an errand's mark, or crossed a span with a fair trail.

The rule is the seam's `earned(f, sub)`, over the circle. An idle account pulled from hall to hall earns nothing (AUDIT
EG0 A6), and a scripted wiggle is not activity (AUDIT EG II L4-18). A receipt banks:

- **the depth**: the Redoubt joins the member's taken Redoubts, this season and all time;
- **the week's spoils** of that Redoubt, rolled from the receipt's secret seed (section 22) and thrown at the beacon
  like the gate's spew (section 19);
- **Marks**, and the embers section 19 pays;
- **a sealed Reliquary**, when that Redoubt pays this week (section 16.3);
- **the board's standing** (section 20).

### 16.2 The Redoubt's sequence

The mode's heartbeat fires in an order, timed from the lord's `fell`:

| at | what |
|---|---|
| 0 s | the gate's fall beats (WB13e): *FELLED*, the body down |
| 1.5 s | the beacon climbs at the court's heart with SPIRREDT's first chord, under the card *Redoubt 5* / *The Broken Galleries* |
| 3 s | the count's chip takes its time: *+15:00* (or *+10:00 - the Covenant's Press*, or *+3:00 - the last word* when the last word clamps it) |
| 3.5 s | the spoils thrown at the beacon, at least 12 m from the way home |
| 4.5 s | the recalls: each fallen member rises in the beacon's light, one by one |
| 6 s | the rest window opens: the Vestige offer, then the decrees' vote, then the way home and the respite |

The rest's 90 s run from the window's opening. A Ready vote (the company's word, section 16.4) ends it early and saves
last-word time.

### 16.3 The rest, the Reliquaries and the way home

**The rest** (`EG_REST_S` 90 s, the count held):

- health, magicka and fatigue restored (the room's word, each client its own body; half under Ashen Vigil). The
  relay's census is restored with it, outside the mend budget;
- the Vestige offer (section 15);
- the next circle's decrees, chosen by the company's word, and the next lord, both shown on the beacon;
- **the recall** of the fallen (section 16.5);
- **the way home**: a gold arch at least 12 m from where the spoils land, pressed, never walked through. This is
  SS3's lesson (`World-Bosses.md`: the gate's way home became a pressed door after a player walking in for loot
  walked out); here it would end a run for good. Its plaque reads *The way home*. A press opens a confirm in both
  skins, *Walk home? Your Reliquaries open: 4.*, with *Walk home* and *Stay*, the focus on *Stay*. It ends the member's
  run, keeps everything, and OPENS their Reliquaries;
- **a respite**, from the breach's budget (section 6.2);
- then the stair down opens, and the closing's law takes everyone left.

The way home, a fall and forsaking are the only ways out before the tear or the last word.

**The Reliquaries** are what a company risks. Each Redoubt that pays this week (section 19) seals one Reliquary into
each earner's satchel: one more spoils roll at that Redoubt's depth, at twice the Panoply chance. A Redoubt already
paid this week seals none, or a company with keys would farm Reliquaries (AUDIT EG II L2-15).

- It opens only at a good end: the end receipt with `why` `'home'`, `'seal'`, `'last'` or `'void'` carries how many it
  opens, rolled from that
  receipt's secret seed.
- A fall, the tear or a wipe loses every one. The way home, THE SEAL, the last word and a void open them, and THE
  COVENANT'S PATIENCE ends a breach as the way home (section 18).
- **Every Reliquary**, whatever gives it (a Redoubt, the Reliquary Vault, Dagon's Bargain, the Honour Horn, the High
  Road's cache), is sealed only in a circle whose Redoubt pays this week, and rolls at that Redoubt's depth. In a
  circle already paid, each gives 20 lumen instead.
- The HUD shows them: *Reliquaries: 4*. The rest card shows the stake: *4 Reliquaries - 1 Valkynaz - a Panoply piece
  about 1 in 2.*
- Every Redoubt is now the question the Spire was built to ask: walk home with four, or push for a fifth. One member
  walking home weakens the company, and that is the social tension a company of eight should feel.

### 16.4 The company's word

**The living ping.** Every living member may ping every 3 s (`lping`): *here*, *danger* or *mine* (an errand claimed),
a blue pillar 6 m tall whose glyph names the kind, with a chime (blue is the company's, section 25.2).

A company choice (the decrees, Dagon's Bargain, a respite, the Ready vote) is a prompt at the beacon or the shrine,
open for 10 s to every member, the witnesses included. It passes on a majority of those who answer; silence abstains,
and a tie refuses (for the decrees, a tie takes the first shown). One silent player never blocks the company, and
nobody decides for eight alone.

### 16.5 One life, one recall, the witness

**A fall.** A death in the Spire (the pose's `dd`), or 180 s gone in a trial, is a FALL:

- the fallen's Reliquaries are lost, and their lord's share is retired (section 13.2);
- they become a **witness** (below);
- **THE FALL**, their own screen. Today the world host's online death runs the death screen
  (`src/ui/deathScreen.js`, counting `ONLINE_RESPAWN_SECONDS`, 60 s, to a respawn; the enhanced skin's *YOU DIED*
  veil is `src/ui/enhancedDeath.js`); in the Spire that respawn never comes. So in
  an `eg:` room there is no death screen. The camera sinks for 1.2 s as the screen drains to a fifth of its colour;
  then the gate's title card (`src/ui/gateTitleCard.js`) reads *FALLEN*, with *The next Redoubt can call you back.* (a
  first fall) or *The Spire will not take you back.* (a final one), and *Reliquaries lost: 4* in red. 2.5 s later the
  witness view dithers in. The company hears a low toll (clip 107, pitch 0.42) and reads *<name> falls.* once.

**THE RECALL**: each fallen member returns ONCE a breach.

- **At the next Redoubt** the living take: they rise at the rest with full health. They earn nothing for the circle
  they were out, and their newest Vestige is lost.
- **Or sooner, by the Memento.** A fall leaves a gold mote where the member fell. A living member passing within 2 m
  carries it (the relay judges by pose; the carrier's fall drops it where they fall). Carried to a **Battlemage's
  niche**, it spends the fallen's recall there: they return at 50% health, their newest Vestige lost, earning from the
  next hall. Niches stand on the Low Road, in the Scriptorium, in the Deepway's chamber, and on every slot-3 arrival
  plate. If nobody carries it, the Redoubt's recall stands as it was.
- A second fall is final: *The Spire will not take you back.*

**The rest of the law.**

- **A wipe** (no living member) ends the breach: there is no one to take the Redoubt.
- **Solo stays literally one life**: no one living can recall you, or carry your Memento.
- **No Resurrect** in the Spire (SD-ONELIFE's reason: a body raised in place stands in a fight its death has left).
- **No DEATH-PENALTY** either: that is the port's own (Ledger A, AN ONLINE DEATH COSTS A TENTH OF THE PURSE), and the
  world host's respawn runs it before it reads the realm. EG10 exempts a Spire fall there.

This reads Mac's *"Checkpoints"* as what a death costs, and *"one life on the line"* as the company's: a fall costs the
fallen their spoils at risk and the company a member until the next Redoubt, or until someone carries them home.
Losing the whole company still costs the run.

- **The Unfallen**: a company that takes Redoubt 10 with no fall, in a breach begun at Hall 1, holds the title *the
  Unfallen* and a flame on its board row (section 20).
- **The Lone Beacon**: a Court felled by one living member, in a company of four or more, gives that member the title
  *the Lone Beacon* and a herald line (section 20).

**THE WITNESS VIEW.** The fallen stay in `eg:<b>` as witnesses, with no body and no blows (the room already refuses
them). A fallen member may watch for an hour, so the seat is built, not improvised:

- **the camera**: a third-person orbit 4 m behind and 1.5 m above the watched member's relayed pose, critically damped
  (0.35 s), colliding as the Morrowind body's camera does, over the hall built from the spec. Never a first-person ride
  of a pose that bobs at 10 Hz;
- **whom**: cycle with Q and E, the pad's shoulders, or a tap on a party row; look input frees the orbit;
- **the swap**: the stair cross-dissolves with the watched member;
- **the HUD**: the count, the watched member's name and vitals, and *You will be called back at Redoubt 6* (or *Your
  Memento lies in Hall 22*);
- **the witness's sight**: witnesses see Lurkers' anchors, alcoves and the next hall's twist that the living cannot;
- **the ping**: every 3 s, one of three kinds (*here*, *danger*, *cache*), a blue pillar 6 m tall with a chime, its
  cooldown shown;
- **the vote**: witnesses answer the company's word (section 16.4);
- **a bequest**: at the fall, the fallen names one of their Vestiges. It joins the living's offers at the next
  Redoubt as a fourth card;
- **forsaking**: a witness may forsake the breach, behind the same confirm as the way home. Their end receipt is
  minted, `eg_live` is cleared, and the recall is forfeited. Nobody is held in a run they no longer want.

### 16.6 Starting deeper

A breach may start at any Redoubt its opener may start at:

- any Redoubt they have taken this season;
- or, until they take one this season, `floor(best / 2)` of their all-time best.

Every member must be able to start there too, or the admit is refused: *You have not taken Redoubt 12 this season.*
The start window's ticks (section 5) show it before the key is staked. No carries: a member who has not reached the
start cannot be brought past it. The ratchet is per season, so a new season's first breaches start at half depth and
the season's boards start level.

## 17. Every hall pays - caches, Cantrips, lumen, potions

Rewards that come once every five halls leave four halls in five ending in a door and nothing to take. Every hall pays
something the company can see coming; none of it outlives the breach.

### 17.1 Caches and Vestige shards

- **A cache** stands on every trial hall's end plate. Its kind is shown on the door's plaque during the trial: a
  **Vestige shard**, a **Spire Tonic** (restores 25% of health and of magicka, outside THE POTION LAW, held two at
  most), a **Cantrip**, or **lumen**.
- It gives one to each member who touches it during the closing, from a fair trail (section 21). The hall's budget
  (section 9) weighs it, and the relay records what each member took.
- **Vestige shards**: three, spent at a Redoubt, make a rank of a held Vestige or a pick of two new ones.
- A cache may be the Kyn Mimic's (section 8.7).

### 17.2 Cantrips

Run-only consumables. A member holds up to three and may use one anywhere outside a lord's shield (`{k:'cant', i}`,
the relay's word) - every lord's (the second Twin's too), and the stair and the rest are anywhere. Sight alone is kept
where no hall's fight stands, since there is nothing to show:

| Cantrip | what |
|---|---|
| **Sight** | caches, alcoves and Lurkers' anchors are shown to the company for the hall |
| **Stillness** | the next hall's first wave and rift pour 10 s late |
| **Mending** | the company heals 15% |
| **Severance** | the next lord's Sappers do not rise in its first phase |
| **Long Step** | your crumbles wait +0.5 s for one span (private, as crumbles are) |

### 17.3 Lumen and the Sutler

- **Lumen** is each member's run currency, from adds and rifts, counted by the relay and shown on the HUD. It is lost
  when the breach ends.
- **The Sutler**, a chained Kyn quartermaster (a twist, section 8.7), stands on an arrival plate and sells for lumen:
  a Cantrip (20), a Spire Tonic (15), a Vestige shard (30).

### 17.4 THE POTION LAW

"No natural regeneration" is what makes one life matter, and the port has no potion cooldown anywhere: with fifty
potions there is no attrition, and without them there is nothing else. So the Spire keeps a `MADE_LEVEL_RULES` row
(section 24), client-enforced like the Burning Court's no-regeneration rule:

- at most `EG_POTIONS_PER_HALL` (2) restoring potions a hall, refilled at each wake and at the rest;
- a *Potions 2/2* pip on the HUD;
- spells are untouched, and magicka comes back at the rest, from a Spire Tonic and from the member's own potions.

It is a departure from DFU, in the Ledger A row.

## 18. Depth - what grows, and the wall

**Mechanics first, and nothing faster.** Balance-Arc: *"a band-aid is a multiplier on every foe's health"*. Mac, WBX:
*"I dont think making mechanics faster is the play"*. What grows with the circle *c*, in the order a company feels it:

1. **decrees**: none, then one to four, then ranks (section 14);
2. **new kinds, pieces, variants, fragments and lords**, by band (sections 7, 8, 10, 11, 12, 13);
3. **more at once**: a rift's wave every `max(9, 20 - 0.5(c-1))` s; the legion's cap `min(14, 2 + ceil(1.5n) +
   floor((c-1)/5))`; spans combining pieces with fewer islands;
4. **the Wellhead's tides**: past circle 20, one tide a circle, from four:
   - **The Wellhead Erupts**: vents in every court;
   - **Clan Feud**: a Court's lord comes with its band's champion beside it (a host body with the Proving champion's
     kit, on the lord's own ground: one seam, one fight);
   - **The Warband**: every hall begins with a Kynval Squad;
   - **Hungering Dark**: the rest heals half and Rally a third;
5. **the Wellhead's strata**: at Redoubt 20 and every fifth after, one stratum joins for the rest of the breach, drawn
   without repeat each season from six:
   - **The Twin Court**: two lords from two bands at 0.6 health each, the union floor over both;
   - **The Mingled Legion**: waves draw every band's kinds;
   - **The Old Masters**: the Last Spellmaster and the Last Armsmaster rise together as one Court, under the Twins'
     15 s law. The Last Lesson stops at r 17, the havens keep their r 13 ring, the Examination's runes stand on a
     ring of r 16, and the errand solver pins that court;
   - **The Molten Rim**: the outer 3 m of every court disc is magma;
   - **Kyn Champions**: Clan Feud at every Court;
   - **The Hollow Offer**: two Vestige cards instead of three, one of them always a Mastery;
6. **numbers, gently**: lord health `ttkRef(c)` (x1.07 a circle, x1.03 past 20); add health `x (1 + 0.04(c-1))`;
   shares `x (1 + 0.02(c-1))` within the 1.5 cap;
7. **fury**, for a company slow against its lord: waves and chained blows, never speed (section 13.2).

**The Wager.** At the start window (section 5), a company may take up to three decrees of its choosing for the whole
breach. A wagered breach ranks on the Depths board alone, with its Wager shown on the row (section 20). The best
companies choose their own pain, as Hades' Heat does; the Descent stays the same test for everyone.

All of it is bounded by THE WIND-UP FLOOR, THE UNION FLOOR, THE CHECK CLASS and THE ERRAND FLOOR (section 13.2), and by
THE ENVELOPE and THE TIMED SOLVER (section 10). Nothing shortens a wind-up, a piece's timing or a crumble below its
value in circle 1.

**The lords' clock** (`ttkRef`, at the company's reference damage and at the trust law's cap, the gate's
`(BOSS_TTK_S - BUCKET_DEPTH_X) / BUCKET_RATE_X` widened per circle, with the Vestiges' factors):

| circle | ttkRef (at reference) | at the cap | at the cap, x1.25 | at the cap, x1.6 (`EG_BUCKET_ALL_MAX`) |
|---|---|---|---|---|
| 1 | 3:00 (180 s) | 55 s | 43 s | 33 s |
| 5 | 3:56 (236 s) | 1:14 | 58 s | 44 s |
| 10 | 5:31 (331 s) | 1:45 | 1:23 | 1:04 |
| 15 | 7:44 (464 s) | 2:30 | 1:59 | 1:32 |
| 20 | 10:51 (651 s) | 3:32 | 2:49 | 2:11 |
| 25 | 12:35 (755 s) | 4:07 | 3:16 | 2:32 |
| 30 | 14:35 (875 s) | 4:47 | 3:48 | 2:57 |

**THE COVENANT'S PATIENCE.** A count spent while a Court's lord is awake does not tear. It arms *The Covenant
presses.*: the lord turns to fury at once, and the **Covenant's Weight** lands every 30 s, 30% to all (fixed, a 3.0 s
wind-up, a CHECK that promises no escape: it is the fight's end coming, not an errand). When the lord falls, the
Redoubt is taken and paid but adds no time; the rest runs; then the breach ends as the way home for everyone living
(`why:'home'`, their Reliquaries opened). A wipe under the Weight still loses everything. Outside a Court the tear works
as written, and the count warns five minutes ahead when it will not hold through the next Court: *The count will not
hold through the next Court.* The median run no longer ends by cutting off its own climax (Mythic+ finishes a dungeon
past its timer; no AAA mode cuts a boss with a clock).

**The wall is the count and the last word.** AUDIT EG II re-ran AUDIT EG0's model under the polished rules:

- the count runs only the closing's first 15 s, and holds from the pull to the wake;
- THE COVENANT'S PATIENCE, bounded by the Weight: a Court that would outlast the count by more than 120 s is a wipe;
- the combined bucket at most 1.6;
- lord health x1.03 a circle past 20; the rifts 36 s together; at most four decrees.

Its assumptions:

- a trial is a fixed part (traversal and errands: 55 s, growing with pieces and decrees) plus a damage part (70 s at
  reference, growing with add health, cadence and decrees, over the company's damage);
- 15 s of the closing counted a hall, 14 s of stair and gather not;
- 26 s of shields and approach a Court;
- a 90 s rest;
- 80% uptime.

Company size drops out of the lords, whose health is counted per fighter, and out of the Yard, whose rifts hold a
fixed 36 s; a large company's straggler costs it 15 s of each closing. EG21 measures it in the field.

| company | last Redoubt in one breach from Hall 1 | stopped by | with the count alone | the season's ceiling, starting deeper each breach |
|---|---|---|---|---|
| at reference damage | about 6 (Hall 30) | the count: its seventh Court outlasts THE COVENANT'S PATIENCE | 6 | about 16, after 10 breaches |
| at twice reference | about 11 (Hall 55) | the last word | 16 | about 39, after 22 breaches |
| at the cap (3x) | about 12 (Hall 60) | the last word | 23 | about 57, after 27 breaches |
| at the cap, x1.6 | about 15 (Hall 75) | the last word | 50 | about 88, after 30 breaches |

The model leaves out the Covenant's Press, THE GOLD RUN, the Low Road's longer road and the open window's minutes;
each moves a stop by about one Redoubt, so read the column as 5-7, 10-11, 12 and 14-15.

So from Hall 1, one breach reaches the Galleries' Valkynaz at reference and the Shade's first halls at the cap. **The
last word, not the count, stops a strong company.** **Starting deeper is how the Wellhead is reached**: each breach
begins with a fresh thirty minutes at the company's deepest Redoubt, and a season of breaches carries it to where one
circle's counted time outlasts a fresh count and THE COVENANT'S PATIENCE. That is about Redoubt 16 at reference, 39 at
twice reference, 57 at the cap and 88 with the Vestiges, and it is where the Depths board's rows will stand. No law
sets a ceiling: the trust law sets the cap, the count sets the pace, and the floors keep every blow readable. How far a
company gets is how well it plays.

## 19. Rewards and the economy

**What a Redoubt pays**, to each earner, at the claim of their `e1` receipt. **A Redoubt's number pays once per
account per arena week**: `arenaWeekOf(nowS) = floor((nowS - ARENA_SEASON_EPOCH_S) / 604800)`, a new helper beside
`arenaSeasonOf` (`src/net/arenaLaw.js`, whose seasons are eight weeks). Taken again in the same week it pays gold alone
and seals no Reliquary. This is also the weekly reason to come back. Without it, a company with keys could farm one
Redoubt daily (AUDIT EG0 G6).

| what | how much | its law |
|---|---|---|
| **spoils** | rolled on the receipt's secret seed and thrown at the beacon: `rollEgSpoils(seed, level, R)` | below |
| **a Reliquary** | sealed; opens at the way home | section 16.3 |
| **Marks** | 20 | a new faucet, `MARKS_FAUCETS.eg` (`eg` joins `MARKS_COMBAT.kinds`), inside `MARKS_COMBAT.perDay` (150), shared with the gate, the raids and the serpent (`src/net/marksLaw.js`) |
| **a guild's deed** | 25 to the treasury, when three members of one guild, each 7 days in it (`tenureS`), take the same Redoubt | the gate's deed law, at most 4 a guild a day |
| **Deadlands Embers** | at a Valkynaz's Redoubt, `1 + floor(R/10)`; and 1 for each Redoubt taken for the first time this season | the Broker's currency (`BROKER_PRICES`, `src/systems/sigilBroker.js`). The Spire's embers join `EMBERS_EARNED_SQL` (today gate and serpent embers alone), so the insignia and the sink spend them |
| **a Weir Key** | at a Valkynaz's Redoubt, 1 in 4, at most one a week | section 5 |

Embers are paid where they are earned, not by the hour. A gate pays one or two. The insignia (30 and 50 embers, Mac's
*"expensive and sought after"*) stay a season's work, not a week's.

**The spoils** (`systems/egSpoils.js`, in `rollSdSpoils`' order; every new draw after the last, as SET6's law requires):

- gold;
- one Rare or Legendary piece; the Legendary's chance is 20% at Redoubt 1, +3% a Redoubt, to 65% (Redoubt 16);
- one to three `magicOrBetter`;
- **a Panoply piece**: 1 in `max(4, 12 - floor(R/2))`, so 1 in 12 at Redoubt 1 and 1 in 4 from Redoubt 16; **1 in 3**
  at a Valkynaz's Redoubt;
- **the lord's named Legendary**: 1 in 8 at its Redoubt (below);
- **the lord's card**: `bossCardRoll(bossKey, rolls)`, each lord its own key in `BOSS_CARDS`
  (`src/systems/bossCards.js`, which holds one card per kind today: gate, serpent, abyss), and in `BOSS_CARD_PER_MILLE`
  at 200, the gate's rate (a key missing there never drops);
- sockets, gems and the technique pass, as the gate's.

A Valkynaz's Redoubt rolls its spoils **twice**, two seeds from the receipt's. At 1 in 3 each, a Panoply piece comes
5 times in 9.

**The lords' named Legendaries** (`EG_LORD_ARMS`): each lord drops one named piece, a fixed base and name. Its
technique line is rolled by the loot ladder at the Redoubt's door like every Legendary's (TECH1 law 4: a technique is
found, never chosen), so a lord's piece is a chase, not a recipe.

| lord | piece | base |
|---|---|---|
| Grath, the Hound | *The Houndfang* | Saber |
| the Last Spellmaster | *The Examiner's Staff* | Staff |
| the Last Armsmaster | *The Last Lesson* | Longsword |
| Valkynaz Ilthys | *Conquest* | War Axe |
| the Cairn-Keeper | *Tithe* | Mace |
| the Twin Lords | *Rivalry* | Dai-Katana |
| Valkynaz Morvayn | *Soulchain* | Flail |
| the Mother of Dusk | *Duskwing* | Long Bow |
| the Night-Stalker | *Bloodmoon* | Tanto |
| Valkynaz Seyth | *Mirrorshard* | Shortsword |
| the Bound Colossus | *The Engine's Heart* | Warhammer |
| the Wellhead Wyrm | *Wyrmbreath* | Claymore |
| Valkynaz Garoth | *The Clan-Breaker* | Battle Axe |

**The pity count.** The service counts each account's Panoply misses (`eg_pity`). After 10 rolls without a piece, the
next roll gives one.

**The sink.** The Sigil Broker sells one Panoply piece of the buyer's choice, once an account a week, for 20 Deadlands
Embers. It is a new law and the service's (`eg_sink`), not her day's stock: SET7's stock is the day's, shared, and
kept by the client.

**THE BATTLEMAGE'S PANOPLY**: the war-gear the Imperial Battlemages wore in the Spire, taken by the Kyn. Nine Aetheric
pieces of Mithril make, light enough for a spellsword. It is a Sigil Set: each piece's sigil names the set, and the
set's stage is its lowest worn piece's (`Sigil-Sets.md` section 2), levelled as a whole (`Sigil-Sets.md` section 5).

| piece | template |
|---|---|
| The Battlemage's Warhelm | Helm |
| The Battlemage's Right Pauldron, The Battlemage's Left Pauldron | Pauldrons |
| The Battlemage's Cuirass | Cuirass |
| The Battlemage's Gauntlets | Gauntlets |
| The Battlemage's Greaves | Greaves |
| The Battlemage's Boots | Boots |
| The Spire-Shield | Kite Shield |
| The Spire-Saber | Saber |

| pieces | ability | Faint -> Ascendant |
|---|---|---|
| 2 | **Battlemage's Bearing**: every resistance, and your magicka | +5 -> +15; +10 -> +30 magicka |
| 4 | **Battlemage's Discipline**: a spell cast arms your next weapon blow with its element; a weapon blow returns some of your last spell's cost | +20% -> +50% of the blow; 5% -> 15% of the cost |
| 6 | **Battlemage's Reprieve**: a blow that takes you under 20% (never a killing blow) raises a shield that soaks part of your max health for 6 s, half of it shared with allies within 8 m; then it must recover | 15% -> 40%; recovers 240 -> 120 s |

**EG15 record (2026-10-12):** the set is `panoply` (`systems/sigilSets.js`), its nine records `PANOPLY_SET_PIECES`
(`systems/aetheric.js`, under `EG_PANOPLY_IDS`; `mintPanoplyPiece` picks the spoils' piece, `panoplyPieceById` the sink's),
its powers and the Spire's recovery `systems/sigilSetPowers.js`'s; the whole record is `Sigil-Sets.md` section 6e.

**No Gilded piece.** Mac, of the Hourlock: *"The most rare and gilded item in the entire game"*. GILDED1 made it the
one, and the Spire's top drop is the Panoply.

**Feats of the Spire.** Each lord has three feats, each an honours bit, written with its slice: a thing to master, not
only survive. Examples: Grath felled with no member caught by a burning bridge; the Examination passed with no rune
missed at *n* = 8; the Twin Lords falling within 3 s of each other. A band's feats, all held, grant *Master of the
Galleries*, *of the Cairn*, *of the Shade*, *of the Wellhead*.

**The honours** (service-recorded: `players.eg_honours` bits, beside the deepest Redoubts). They are added as
`server-account/src/titles.js` adds every honour:

- the id in `TITLES`/`AURAS` (in `src/net/identityToken.js`, which is in the relay bundle, so this takes a relay
  version);
- the branch in `titlesHeld`/`aurasHeld`;
- the words in `src/ui/playerBadge.js`.

| at | title | aura |
|---|---|---|
| Redoubt 2 (Hall 10) | **Spirewalker** | - |
| Redoubt 5 (Hall 25, the first Valkynaz) | **Beacon-Lighter** | - |
| Redoubt 10 (Hall 50) | **Kynbane** | **Beaconlight** (gold-white motes) |
| Redoubt 10 with no fall, in a breach begun at Hall 1 | **the Unfallen** | - |
| a Court felled alone, in a company of four or more | **the Lone Beacon** | - |
| Redoubt 15 (Hall 75) | **Battlemage of the Spire** | - |
| Redoubt 20 (Hall 100) | **Wellhead-Walker** | **The Burning Stair** (falling embers) |
| a band's feats, all held | **Master of the Galleries** (and its kin) | - |
| a season's top ten on the Descent, any bracket (section 20) | **Spire Champion**, held through the next season | - |
| the first company ever to take Redoubt 10 | **First of the Spire** | **Firstlight** |

*First of the Spire* is granted as *Hour's First* was: a list in the service's config, and the mailbox. Titles are
earned, never bought. The Broker's insignia stay the gate's. Cosmetic auras draw at nothing during a trial (THE QUIET
COMPANY, section 25.4).

**EG-E1 record (2026-10-12): what a Redoubt pays.** The account service pays a Redoubt's `w` receipt at its claim, by
the pay law `net/egPay.js`, and the Broker sells the Panoply's sink. File by file:

- **`server-account/src/egEconomy.js`** (new) holds the pay. `egRedoubtPay` gives claimEg the Redoubt's row, its pay's
  statements for the claim's own batch, and its answer. The service decides everything in SQL, in that one batch:
  - **the week's pay**: the row is paid only when the account has no paid row of that Redoubt in that arena week, and a
    Rehearsal is never paid. Every payment is written only while the row this claim stamped with its own nonce stands
    paid (the service's draw, as a raid's and a serpent's claims stamp theirs), so a refused re-claim of the same
    receipt carries none. Two claims racing take one week's pay between them;
  - **embers**: `egEmbersOf` is written to the row's `stones`. A first this season is a Redoubt with no paid row since
    the season's first week (`egSeasonWeek0`);
  - **the pity**: the row's forced passes and the account's new count are both read off `players.eg_pity` as the batch
    finds it. The passes are counted in order, so at nine a Valkynaz's first pass misses to ten and its second is
    forced;
  - **a Valkynaz's key**: 1 in 4 by the service's own die (eg.js `drawUnder`). The row is marked (`wkey`) only while the
    week has given the account no key (`players.eg_valk_wk`), and the key is counted only by a row so marked.

  `egReliquariesOf` answers an end's Reliquaries. `egSinkOf` and `egSink` are the sink.
- **`server-account/src/eg.js`**: claimEg passes `{ env, character }` through and splices the pay into the `w` arm's
  batch. A Redoubt's answer is `{ recorded, q: 'w', b, w, keys, paid, again?, marks, deed, embers, purse, weir, pity }`.
  A receipt carried again is `claimed` and `again`, with the pay its row keeps. `egKeysOf` answers the week's sale too
  (`sink: { week, piece }`).
- **`server-account/src/marks.js`** and **`src/net/marksLaw.js`**: `MARKS_FAUCETS.eg` strikes 20
  (`EG_PAY_MARKS`). `eg` joins `MARKS_COMBAT.kinds`, inside the day's 150 with the gates', the raids' and the
  serpents'. `eg` is a mint in `MARKS_KINDS`. `CLAIM_GUARDS.eg` reads the row's nonce and its pay. The line id is
  `egStrikeRid` (`eg:<week>:<Redoubt>`), so the ledger's UNIQUE (actor, rid) holds a Redoubt's silver to once a week.
  A guild's deed is the gate's law on the event `eg:<breach>:<Redoubt>`.
- **`server-account/src/accounts.js`**: `EMBERS_EARNED_SQL` (exported now) adds the Redoubts' `stones`, so the
  insignia and the sink spend the Spire's embers.
- **The end's Reliquaries (section 16.3).** A Reliquary's roll is the client's, off the end receipt's seed, but only the
  service knows which circles pay this week. The `x` claim answers `rl`: those of the relay's circles, one entry a
  Reliquary, whose Redoubt this breach recorded paid. A circle whose Redoubt this breach never recorded opens when no
  breach of the account was paid for it this week. A Rehearsal's end opens none.
- **The sink.** `POST /v1/eg/sink { piece }` (one of `EG_PANOPLY_IDS`) is one conditional UPDATE in the insignia's way:
  `insignia_spent + 20`, where the purse covers it and no `eg_sink` row stands this week. The week's row is written by
  that write alone. It answers `{ ok, piece, week, purse }`, or refuses `guest` 403, `piece` 400, `bought` 409 (which
  piece) or `short` 409 (the purse and the price). It is in `ROUTES`, the eg act map, `EG_STATUS` and the route comment.
- **`server-account/src/index.js`**: the claim takes `{ receipt, character }`. INT5's `grantSpoils` fires only for a
  recorded, paid Redoubt.
- **Migration 0112** (EG-PLAY's, unshipped; 0111 on its branch, renumbered past NAME-AS's 0111 at the merge) gains a block of its own:
  - `eg_redoubts`: `wk`, `paid`, `stones`, `nonce`, `forced`, `wkey`;
  - `players`: `eg_pity`, `eg_valk_wk`;
  - the table `eg_sink (account, wk, piece, at)`.
- **The client**:
  - `net/accountClient.js`: `accountEg(...).claim(receipt, character)`, `.sink(piece)`, and the words `bought` and
    `piece`;
  - `systems/sigilBroker.js` `panoplySale`, the insignia's two halves. The host's `mint` comes first (a piece it cannot
    make is never paid for). Then the embers leave the pack before the service is asked. A refusal gives them back. A
    lost answer is asked after (`held`). A held sale adds the piece, with no Broker price on it, and is saved;
  - `ui/brokerWindow.js`: "The Battlemage's Panoply" under the insignia (`panoplyRows`, the nine pieces by section 19's
    names). It shows the price and "One a week", and its Buy says why not ("Need 15 more", "Bought", "Next week"). A
    sale in flight holds every other;
  - the combat cap's words name the Redoubts (`MARKS_TEXT.cappedEg`, `CLAIM_SOURCE.eg`, `HAUL_CAPPED_TEXT`, the Bank's
    card).
- **Departures.** The `nonce` is the service's own draw, never the receipt's `c`: a nonce read off the receipt would
  pass a refused re-claim of that receipt, which is AUDIT SILVER-WAYS A1's hole. The pity counts the Redoubt's own
  passes. A Reliquary's roll is the client's, unwitnessed, and moves no count. The world host's wiring is the lead's
  (FLAGGED): the claim's `character`, `weirHeard` on the `w` answer, the Panoply's `mint` and the Broker's `panoply`
  deps. `scenes/world.js` was not touched, and the other three hosts carry no Broker or claim.

**Pins.** `test/egeco_service.test.js` (12) and `test/egeco_broker.test.js` (3). `tools/mutants/egeco_pay.json`
(58, every one dead). `ACCOUNT_VERSION` stays `acct121`: the migration is EG-PLAY's, unshipped.

## 20. The boards and the herald

**The boards** (`/v1/eg/board`, `egBoardOf`). The season is the arena's (`arenaSeasonOf`, eight weeks). Rows come from
`topWithMe`, which EG14 exports from `server-account/src/arena.js` (it is private today), and names from
`boardNamesOf`; `iliacBoardOf` is the precedent.

| board | who | ranked by | the row |
|---|---|---|---|
| **The Descent** | three brackets: Alone (1), the Few (2-4), the Company (5-8) | the deepest hall cleared in one unwagered breach BEGUN AT HALL 1, this season; then the fewest seconds from Hall 1's wake to that hall's door | the company's names (up to 8), the band, the Unfallen's flame, the week's Proclamation |
| **The Depths** | every account | the deepest hall cleared this season, from any start | the name, the hall, the start Redoubt, the Wager |
| **The Deepest Redoubts** | every account, all time | the deepest Redoubt ever taken | the name, the Redoubt, when |

- **The Descent is "how far with one life"**: the same thirty minutes and the same Hall 1 for every company. The
  start-Redoubt ratchet and the Wager cannot buy a row there (AUDIT EG0 A12). The Depths is theirs.
- **Clearing**: a hall counts when the relay clears it (sections 7 and 21), whether or not the next Redoubt was taken.
- **Who counts**: a company's size counts its earning entrants. The receipt carries `co` (the company's subs), and a
  company's row takes the deepest `h` of its members.
- **Champions**: each bracket's top ten at a season's end hold *Spire Champion* through the next season
  (`iliacHonoursOf`'s pattern).
- **The reads** (AUDIT EG III): a Worker keeps the boards' rankings `EG_BOARD_CACHE_S` (a minute), and a claim it records
  forgets them, so a crowd at the window reads the season once a minute. An end's claim still reads its season's ends to
  place its company, keyed as the board keys it (the recap's standing must count the claim itself), and the Deepest
  Redoubts read every Redoubt ever taken whenever the rankings are read: a board places the caller and says its total out
  of every company and account, so a narrower read would be a rank query over the same rows - a departure, said so.
- **The sealed band**: until a band ships, a run that reaches THE SEAL (section 13.3) ranks on the Descent by its
  seconds to the sealed Redoubt.

**The week's Proclamation.** One rule a week, active from circle 1 for every breach, drawn from eight (Kyn's Rally,
Wellhead Sparks, Soul-Pools, Vengeful Shades, Pyre-Bound, Crumbling Halls, Ashfall, Hunting Pack, each at rank I, none
of them drawing a kind or a piece the Galleries lack), shown on
the start window and on each Descent row. It is a rule, never a seed: the halls stay every breach's own, so there is
nothing to scout (section 30).

**The board window**, reached from the Timers row and from the start window: the three boards as tabs, the member's own
row pinned at the foot (`topWithMe`), the company's names, the flame, and *Your best: Hall 47 - 1:44:12*. The classic
skin builds it from DFU windows, as the start window uses DaggerfallListPickerWindow (`src/ui/listPicker.js`);
`src/ui/iliacTableHud.js`, one DOM panel outside the window stack, is the precedent for the enhanced skin only. That
panel is still an enhanced door (`enhanced-egboard`, on the enhanced doors' stack), so a pad's cursor drives it, Tab puts it
away and Back closes it.

**The herald** (`net/egHerald.js`: pure builders, as `src/net/gateHerald.js` is). Like the Hour's and the serpent's
heralds, it posts to the gate's webhook and falls back to the gate's role, pinging no one:

- a company taking Redoubt 10, 20, 30...: *<opener>'s company took Redoubt 10 of the Battlespire (Hall 50) in
  1:51:20.*
- a new top of the Descent in any bracket;
- *First of the Spire*, and *the Lone Beacon*;
- a band's seal lifted: *The way below the Galleries is open.*

An opening is never heralded: a company's breach is its own.

**EG-E2 record (2026-10-12): the feats, the Annals, the honours and the boards.** The account's half of section 19's
honours and this section's boards, in `server-account/src/egHonours.js` (claim-time logic apart from `claimEg`, one seam
an arm: its statements appended to the arm's batch, and a `w`'s new honours merged into the answer).
- **The feats.** A `w` receipt's `lk` and `ft` kept a lord at a time (`eg_feats`, the bits OR'ed), never a Rehearsal's.
  A band's lords' feats all held (`egBandMastered`) are its Master, written on the row by the claim that completes it.
- **The Annals.** An end's `an` (a bit a page, `EG_ANNALS_BITS_MAX`; `net/egReceipt.js` takes it on an `x` alone, so
  `world197` is rehashed) OR'ed into `players.eg_annals` - a Rehearsal's too: a page is lore, not pay. `/v1/eg/keys`
  answers `annals` and `feats`.
- **The honours** on `players.eg_honours` (`EG_HONOUR`), written at a recorded `w` and guarded by its own row: a Redoubt
  at or past 2, 5, 10, 15 and 20 holds Spirewalker, Beacon-Lighter, Kynbane (and Beaconlight), Battlemage of the Spire
  (`battlemage`) and Wellhead-Walker (and The Burning Stair); the Unfallen asks Redoubt 10 with `fl` 0 and `ew` 0; the
  Lone Beacon `lb` 1; the four Masters (`mastergallery`, `mastercairn`, `mastershade`, `masterwellhead`). Spire Champion
  (`spirechampion`) is read onto the row as the Iliac Champion is (`withEgHonours`, `withEgHonoursAll`: the token's and
  the wardrobe's doors, a letter's, a notice's, a board's names); First of the Spire (`spirefirst`, with Firstlight) is a
  list in config, `EG_FIRST_HANDLES`, empty until the first company takes Redoubt 10. The thirteen titles and three
  auras join `TITLES` and `AURAS` last, each its words and colour (`ui/playerBadge.js` `SPIRE_*`), each aura a look of its
  own kind (`render/auraRing.js`: 8 Beaconlight's beacons lit in turn and gold-white motes rising, 9 The Burning Stair's
  burning steps turning down and its embers falling, 10 Firstlight's dawn-white ring). No glyph.
- **The boards**, `/v1/eg/board` (`egBoardOf`): the ends' rows carry `n`, `ew`, `wg`, `fl`, `td`, `rh` and the season of
  the receipt's issue. The Descent's brackets, its company rows (the accounts that ended one breach, the same company's
  best breach alone, the flame when none fell), the Depths and the Deepest Redoubts, each `topWithMe` (now exported from
  `arena.js`, and taking a row's test where a row is a company); the week's Proclamation in words, each Descent row its
  breach's; the caller's best. Each bracket's top ten at a season's end are kept in `eg_champions` the first time a read
  in the new season finds the last one unkept - no cron. `accountEg(...).board()` asks it.
- **The board window** (`ui/egBoardWindow.js`): `egBoardLines`, the enhanced panel and the classic skin's two DFU
  pickers; `openEgBoard` opens either. The host wires it.
- **Departures, said plainly:**
  - the Descent's seconds are the receipt's `td` where it says one, else its `t` (seconds to the member's end) - the
    relay mints no `td` yet; a company is the accounts that claimed an end of one breach, not the receipt's `co`;
  - a Descent row's Proclamation is its company's first claim's week, not the open's;
  - THE SEAL's ranking (a run ranked by its seconds to the sealed Redoubt) is not special-cased;
  - First of the Spire's mailbox send is not written (the list is empty) (EG-ZF wrote it: `egFirstPost`, the list as
    the send);
  - THE QUIET COMPANY: `render/auraRing.js` has no quiet seam - the hosts draw every aura they gather - so a cosmetic
    aura still draws during a trial; the host owes it;
  - the herald's lines for a new top of the Descent and for First of the Spire are not here.
- **Pins.** `test/egeco_honours.test.js` (8) and `test/egeco_board.test.js` (5); `tools/mutants/egeco_honours.json`
  (63, every one dead); every pinned list of the titles and auras moved (PIN MOVED); `RELAY_VERSION` `world197`
  rehashed (unshipped); `ACCOUNT_VERSION` stays `acct121` (0111 extended, unshipped).
**EG-E3 record (2026-10-12): the herald, the receipts' bound and the dungeon's find.** (Mac: *"I said I want
everything"*.)

- **The herald** is `net/egHerald.js`: pure builders on `gateHerald.js`'s `heraldName` and `heraldList`, every post
  `allowed_mentions: { parse: [] }`.
  - **The posts**: *Mac's company took Redoubt 10 of the Battlespire (Hall 50) in 1:51:20.* for every tenth Redoubt;
    *First of the Spire*; *the Lone Beacon*; *A new top of the Descent (the Few)*; *The way below the Galleries is open.*
  - **The news.** The director keeps its news on the breach (`B.hq`, numbered): every Valkynaz Redoubt, a Court felled
    by the one member standing of four or more (once a member a breach), and the end of a breach begun at Hall 1,
    unwagered and not a Rehearsal, as a Descent candidate. A candidate carries the deepest hall and `td`, the seconds
    from Hall 1's wake to that hall's door (`clearHall`, at the door and at a Court's fall).
  - **The tell.** The breach's room tells the hub on a new internal door, `EG_INTERNAL_HERALD`, the way the gate's kill
    is told. An ended breach beats on until the hub has its news. A hub that does not answer is told again
    `EG_HERALD_TELL_MS` (5 s) later, never on every beat, because each tell can wait `ROOM_CALL_MS`.
  - **The hub.** It folds each tell once, by breach and number (`egHeraldFold`), into its own record (`egherald`):
    - the posts owed, at most 16;
    - First of the Spire's flag, held for good;
    - the bands open when the hub first heard of the Spire, and the last band said;
    - each bracket's best this season (the arena's `arenaSeasonOf`);
    - the news already folded.

    The hub posts off its alarm, after the gate's herald, in order. A post Discord refuses goes again `HERALD_RETRY_MS`
    later, and one an hour old (`EG_HERALD_KEEP_MS`) is let go. A hub with no webhook keeps the reckoning and owes
    nothing, so a webhook added later never calls the second company first.
  - **THE SEAL** is coded as `EG_OPEN` in `net/egLaw.js`, the number of bands a deploy opens. EG-FULL laid all four
    bands, so `EG_OPEN` is 4, no band is sealed, and no seal post can be owed today. A deploy that seals a band and a
    later one that opens it are both needed for the post.
- **This slice's own choices**:
  - First of the Spire is posted *instead of* that breach's Redoubt 10 post, never beside it.
  - A Descent top shallower than Hall 10 (`EG_HERALD_TOP_HALL`) is recorded but not posted. Every early-season breach
    is a new top, and the channel would get one post per hall.
  - There is no `egRole` setting. Nothing in the Spire pings anyone, so a role setting would do nothing.
- **The receipts** (`net/egReceipt.js`):
  - `EG_END_WHYS` gains `'forsake'` and `'seal'`. The relay already minted a forsaking (`egForsake`), and the mint
    threw on it, so a forsaken member's end receipt and stake were never sent.
  - **THE BOUND IS THE MINT'S.** `mintEgReceipt` measures every receipt at its signed length. If a receipt is over
    `EG_RECEIPT_MAX` (640, the wire's `EG_RECEIPT_WIRE_MAX` too), it trims the optional lists, oldest first, in the
    order `EG_RECEIPT_TRIMS` gives: the Vestiges (`vs`), then the Reliquaries (`rl`). It never trims a claim the
    service pays by. A claim set that no trim can fit is refused, never signed long.
  - In the worst case (a 40-character account, a 32-character order, a 16-letter lord, the Wager, the feats), a `w`
    keeps 19 of its 32 Vestiges and an `x` keeps 22 of its 64 Reliquaries. Without the lists, about 170 characters are
    left under the bound: a `co` of eight 40-character subs (section 20) will not fit until the bound rises.
  - The end receipt (`q: 'x'`) now carries `wg`, the breach's Wager (as its `w` does), and `an`, the Annals pages the
    breach gave the member. `an` is the director's own per-member bitmask (`m.pages`: bit p is `net/egAnnals.js` page
    p, set at an alcove's page and at a lord's first fall). It is only minted when non-zero.
  - Today `egReceiptValid` ignores any field it does not name, except the shapes it refuses (`n0`, `k`, `o`, `d`, `x`,
    `r`, `y`). `an` is validated by another slice.
- **The dungeon's find** is `POST /v1/eg/find` `{ tier }` (`server-account/src/eg.js` `findEg`). It answers
  `{ found, keys, asks }` or one of the eg routes' refusals: `guest`, `tier`, `unproven`, or `capped` (409, with the
  balance). The two new words each have a sentence in `REFUSALS` (`net/accountClient.js`).
  - **The tiers** are the port's own (`systems/dungeonTier.js`): `super` (the player's Abyss Dungeon) 1 in 60, `elite`
    1 in 150, `regular` 1 in 400, rolled on the service's own die.
  - **The caps**: the ask is counted before the die, 6 a tier per account per real UTC day (`EG_FIND_PER_DAY`). Finds
    pay at most 2 keys an arena week (`EG_FIND_KEYS_PER_WEEK`), and the key and the find's mark are written in one
    transaction.
  - **Storage**: the table `eg_finds`, added to migration 0111 (`ACCOUNT_VERSION` stays `acct121`).
  - **The client** door is `accountEg(...).find(tier)`, and the client logic is `systems/egFind.js`:
    - `registerEgFind({ ask, tierNow, selfId, online, say, throwKey })` registers a death handler (`eg-find`) for the
      owner's kills;
    - it answers `{ death, struck, dispose }`;
    - the owner asks for its own kill (the striker `null`, or its own id) and leaves a joiner's kill to the joiner,
      whose record door calls `struck`;
    - each body is asked about once;
    - `egFindThrow` throws one key onto the body, as `dropFoeCard` throws a card, and restacks the pack to the balance
      minus that key.
- **THE FOUR HOSTS.** `scenes/dungeonContext.js` is the one host with a dungeon's foes online. WIRING OWED (the lead's):
  - the owner's `raiseEnemyDeath` passes `by: foe._killedBy`;
  - the joiner's record door, where `r.v` names `selfId` and `reportPlayerKill(f.entity, REMOTE_KILL)` runs, calls
    `struck(f.entity)`;
  - `world.js` registers the find with `ask: (t) => _accountEg.find(t)`, `tierNow` the current dungeon's
    `dungeonTier` online, and `throwKey: (e, n) => { egFindThrow(e, playerEntity.items, n); saved(); }`.

  `scenes/exterior.js`, `scenes/world.js`'s streaming exterior and `scenes/worldModes.js`'s interiors stand no dungeon
  foe (`tierNow()` is null there), so nothing is owed in them.
- **Pins**: `test/egeco_herald.test.js` (9), `test/egeco_receipts.test.js` (3), `test/egeco_find.test.js` (4), and
  `tools/mutants/egeco_relay.json` (72, every one dead). `RELAY_VERSION` `world197` is re-hashed with
  `net/egHerald.js` in its graph.

## 21. Integrity - what the relay judges

The gate's trust law, kept whole, and where it was not enough for one life, widened:

- **Blows on lords and the legion**: `applyHit`'s hand and purse, the bucket by the level claim times the Vestiges'
  capped factor, a melee pose within reach, from a pose on a fight floor of the current fight (section 11.7). The
  blow's kind `r` is the client's word (`HIT_KINDS`), so a Vestige that reads it must not gain from a lie. Sweeping
  Arc, Bladestorm and Counterstroke read melee, and the relay already checks a melee blow's reach. Long Sight, Hunter's
  Mark, Spotter and Deadeye read arrows and spells, and also need more than 12 m between the poses (Spotter's wake
  aside), where a forged kind gains nothing a real one would not. The lean reads it too, and changes no damage.
- **The lords' blows on members**: ONE judge for every shape. `src/net/bossRef.js` holds a judge for each boss
  (`judgeGate`, `judgeRemnant`, `judgeSerpent`).
  - Every Spire blow travels with a FULL shape stamp, its kind and every number, which is new. The Remnant's
    `shapeStamp` carries only what its marks changed.
  - So one `judgeShapes` tests any blow, per fight floor (section 11.7), against the pose trails the relay holds
    (`posAt`/`posAfter`, `deepIn`, `BODY_AFTER_MS`) and feeds `src/net/bossBody.js` (`bodyStruck`, `bodyCensus`).
  - It also judges the hall's own hazards at their landing on a fight floor, and a cast-back (a trail below
    `SD_VOID_Y`), into the census. A modified client that ignores vents and magma is seen.
- **Time, before enforcement.** The relay keeps trails timed by arrival, and a client draws and resolves a landing on
  a clock that runs late by the welcome's one-way latency, so today both poses the judge reads can predate the
  client's landing: a dodge in its last round trip would be counted as a hit. `BOSS_BODY`'s enforcement is off
  today (`BODY_DEFAULT.enforce`), so this error has never been paid. Before EG14 turns it on for `eg:` rooms:
  - trail entries become `[tShared, x, y, z]`, `tShared` being the pose's own `ts` plus the socket's offset (below);
  - `posAfter` is the first pose SENT after the blow's `at`, waited for up to 800 ms; a body with no pose within
    ±300 ms of `at` is not counted;
  - the client's clock is corrected (section 10.8);
  - pinned: a dodge at the client's `at` less 50 ms, at a 300 ms round trip, is never counted.
- **THE FAIR TRAIL** (`spanFair`, new, on every `eg:` pose). The relay's body trails (`BODY_TRAIL_MS` 2000,
  `BODY_TRAIL_MAX` 24) are seconds long, and a crossing takes tens of seconds, so the room keeps an ONLINE accumulator
  per member: the fastest step, the air time since the last support, the last island. Its law:
  - **its clock**: every measure is taken in the sender's `ts` (differences mod 2^24, `POSE_TS_MOD`, which wraps every
    4.66 h). A socket's offset to relay time is the least `arrival - ts` over its last 32 poses;
  - **support**: a pose must lie on a floor, a ramp or a platform's top (its footprint at that time by `stepAt` and
    `beatStands`, inflated by 0.35 m, the capsule, and by the platform's speed times 0.15 s), or on a ballistic arc
    from the last support. Stairs and slopes are support (`ramps`, section 11.5);
  - **speed**: no step faster than the fast build's run times 1.1, plus a push;
  - **air**: no airborne stretch past `EG_AIR_MAX_S` (2.5 s);
  - **blindness**: a `ts` gap over 0.4 s is BLIND and judges nothing either way. A crossing more than 30% blind opens
    no door, and records `m.blind`;
  - **the crossing**: its time against `EG_CROSS_MIN(spec, road)` (section 10.5) rides the receipt's `m`, and gates
    nothing until EG21;
  - **after a restart**: the accumulator is saved to storage. After the room is re-woken, a member at the end plate
    whose last saved accumulator was fair counts as a fair arrival; failing that, the door opens on the first arrival,
    recorded as `m.wake`. A hall woken after every member passed the last island never deadlocks;
  - **repeats**: a member whose trail breaks the law again within a hall has their hits refused for 5 s;
  - poses between a member's `down` and their next `here` are never judged; a pose sent mid-stair belongs to no hall;
  - an unfair trail opens no door, and its measures ride the receipt (`m`).
- **Every pose-gated credit needs a fair trail** from the last island: the door, `down`, a cache, THE GOLD RUN, a
  niche, a Memento carried, the Reliquary Vault, the High Road's cache.
- **A hall cleared**: only the relay says so (the legion broken, the lock solved, the champion or the lord fallen, a
  fair end).
- **The board and the Redoubts**: from receipts alone. The service never takes a client's word for a depth.
- **The key**: the service's balance and stake (sections 5 and 23).
- **The census**: the relay's census applies Bastion, Challenger's Oath, Steadfast Line, Immovable and Lifeline itself,
  counts a Stoneskin holder's whole body (the cushion with it, so the holder falls where its screen falls), and the rest
  restores it, so holders do not drain their budgets or skew the measures staff read.

A modified client can still refuse to take damage (a player owns their body). Under `BOSS_BODY` enforcement, the
relay's census fells it as it fells a gate's fighter. The Spire's boards are measured with enforcement on: EG14 turns
it on for `eg:` rooms when the boards open, whatever the gate's setting, and only once the time law above is in.

## 22. Failure and recovery

A breach is a three-hour instance on infrastructure that restarts. Every failure has a rule (AUDIT EG0 A5, A10, A17;
AUDIT EG II L4-31, L4-42).

**A deploy.** `.github/workflows/relay-deploy.yml` drops every socket and restarts every Durable Object. The client
deploys on every merge. A drain of up to 3 h 10 min for every relay deploy would close the Spire for much of each day,
so:

- **THE HOLD** (the usual deploy): the deploy waits until every live breach is between trials (a closing, a swap or a
  rest), asks each room to hold, then goes. A held room freezes the count and gives the gap back, and waits until
  every living member has returned or 180 s have passed. A member who returns finds the hall where they left it. The gap
  goes back to what the hold found as it began (its deadlines however far into the hold they fell); a word its company
  stamped while it held is relay time already, and stays (AUDIT EG III).
- **THE DRAIN** (an `EG_SPEC` change beyond `EG_LAWS` only): the deploy waits on `/v1/eg/live`, as it waits on
  `/v1/seats/sieges/live`. Opens are refused meanwhile (*The Spire's road is shut. Try again soon.*), and the deploy
  waits until no breach is live, or the last word of the longest has passed.
- **A `force` deploy** voids every live breach. Their stakes are returned, and their Redoubts taken stay taken.
- **A LAW PIN PER BREACH**: the breach records `egv`, the spec law it was opened under.
  - Both sides keep `EG_LAWS`, every `EG_SPEC` younger than seven days (pinned), for `egHallOf`, `egFragOf` and
    `courseOf`. A client deployed ahead of the relay, or behind it, still draws the breach's own halls.
  - A client that cannot draw its breach's `egv` asks `{k:'spec'}` and builds from the relay's bytes (section 9).
  - CI also sweeps the previous law's courses with the current motor, since the motor reaches clients at once.
  - Frames are self-describing (a full shape stamp), so a brain's tuning needs no pin.
  - A woken relay that does not know a breach's `egv` ends it with `why:'void'`: the stake is returned, and the
    Redoubts taken stay.

**A restart or an eviction.** A Durable Object can be evicted or restarted at any time.

- **Saves to storage**: every `CHECKPOINT_MS` (2 s, the gate's), and also at the open, every admission, every stage
  change, a fall, a pick and the end, and at a Redoubt BEFORE its receipts go out.
- **Deterministic, secret receipts**: a receipt's seed is `HMAC(rs, sub, R, kind)`. `rs` is a 32-byte secret the room
  draws at the open, keeps in storage and never sends. The breach's `seed` is public in `st`, and a seed derived from
  it would let every client compute every future spoils, Reliquary and Panoply roll: the exact leak AUDIT SD III R4
  moved the Hour's honours off (section 5). A re-woken room sends the same receipt and never a second roll. Pinned: no
  frame or receipt carries `rs`.
- **Storage, not memory**: offers, picks, spent order ids, the fallen, the witnesses, the Mementos, the Reliquaries,
  the caches taken, the Cantrips, the lumen, the fair-trail accumulators and the Athenaeum's hall all live in storage
  (hibernation keeps nothing else).
- **Time survives the restart**: a member's absence is counted from `max(lastSeen, wakeAt)`, and any tick gap over
  `EG_GAP_MS` (2 s) is given back: the count and the hall's timers do not run across it. In a room that never slept, an
  instant stamped inside the gap (a word heard while the alarm was late) is the gap's own and stays.

**A dropped socket.** A closed socket would drop its body from the census, and returning at the arrival plate would
dodge a lord's blow. So the body stays at its last pose for the absence window and takes what lands there, though no
blow is aimed at it (section 6.1): the room keeps each member's trail by its account, and a member with no socket in the
room has its trail held at its last pose for `EG_ABSENT_TRIAL_MS` (AUDIT EG III). On a fight floor it resumes there. In
traversal it resumes at its last island or plate, with no cast-back's cost: a platform has moved on, and a reconnect is
not a fall.

**A reload.** Saves are refused inside (the Burning Court's law, WBX W6), so a reloaded page boots outside.
`/v1/eg/keys` answers the account's live breach, and the world host offers *Return to the Spire*: a hello as an entrant
(no new order), resumed by the dropped socket's rule; between trials, at the current hall's arrival plate.

**A joiner's fight.** The hello of a member who joins or reloads mid-fight hands it the breach (`st`) and the fight whole
(`efs`): every body where the room holds it at that instant and on its feet, each object's state and each lord's phase and
fall as the room said them, the zones still to burn. Its screen holds the company's fight at once, and the fight said again
every two seconds never stands a body anew. Built by EG-ZJ (its record, below).

**A key's loss.** A key is never lost to an infrastructure fault:

- the hub retries `EG_INTERNAL_OPEN` idempotently on `ez`, and members may ask for the call again;
- an end with no hall ever woken is a void, never the opener's `'empty'`, unless the room had its call out and nobody
  answered;
- a client that boots with a stake the room never accepted asks the room to void it (`{k:'void', z}`).

**Unknown rooms.** An `eg:<16hex>` the hub never opened writes nothing and arms no alarm, except a void (section 23),
which writes its one tombstone.

**The cost.** One Durable Object per breach, awake for up to three hours. So:

- the tick is 250 ms only while a trial runs, 1 s otherwise, and none while the arch rises;
- the hub enforces `EG_LIVE_MAX` (64) live breaches at once, the Rehearsals among them. At the cap it asks each listed
  room where it stands and lets the ended go first, so an ended breach no longer holds its slot until its last word; and
  it keeps its answer to `/v1/eg/live` `EG_LIVE_SAID_MS` (2 s), so the public door asks the rooms at most once in that
  time, every ask meanwhile answered by it (AUDIT EG III);
- every breach ends at the last word.

## 23. The wire

**The room family.** `eg:<16hex>`, the breach id the service mints with the open order.

- **The room-key law**: `isEgRoom` (`/^eg:[0-9a-f]{16}$/`) in `net/egLaw.js`.
- **The Worker's prefix gate**: a `startsWith('eg:')` line beside `gate:` and `sd:`, so an unknown key mints no
  object.
- **The tick**: `_egTick`, in the `alarm()` chain before `_alarmRest`.
- **Presence**: the room is each entrant's presence room for the whole breach (`roomIdentity` `{kind:'eg', b}`).

**Opening runs through the hub** (AUDIT EG0 A4). The hub holds every client's socket and every party's roster.

1. The client sends `{t:'eg', k:'open', z, site}` to the hub.
2. The hub verifies the order, freezes the company from its own `party:` record, and checks `EG_LIVE_MAX` and the
   drain.
3. It forwards the order, the company and the arch's site to `eg:<b>` by internal fetch (`EG_INTERNAL_OPEN`), the
   DO-to-DO pattern `_wdunKinOf` uses, retried idempotently on `ez` until the room answers.
4. It keeps `eglive:<sub>` for each member, and tells the company the call (`k:'call'`, signed) on the party channel.
5. Receipts for a member with no socket in the room are held by the hub as `egrc:<sub>` for their next hello, under
   the gate's receipt law (the `gaterc` sweep, widened by one prefix).

**Orders**, signed by the service with `IDENTITY_PRIVATE_KEY` and checked by the relay with `verifyOrder` against
`IDENTITY_PUBLIC_KEY` (`src/net/identityToken.js`). Every order already carries `i` and `e` (issued and expires, at
most `ORDER_TTL_S` 60 s apart). `egopen` and `egadmit` join the frozen `ORDER_KINDS`, which is a relay-bundle edit and
a version. Their fields are `EG_ORDER_FIELDS`, exclusive as `STAKE_FIELDS` are, so no other kind carries them and they
carry no other kind's. The first draft's `st` is a siege pass field (`SIEGE_PASS_FIELDS`) and would have been refused.

| order | fields | life |
|---|---|---|
| `o:'egopen'` | `s` (the opener's sub), `eb` (the breach id), `ez` (the order id, `[a-z0-9]{16,32}`), `ew` (the start Redoubt), `wg` (the Wager's decrees, at most three), `rh` (a Rehearsal), `i`, `e` | 60 s |
| `o:'egadmit'` | `s` (the member's sub), `eb`, `ez`, `ew`, `i`, `e` | 60 s |

The room checks `eb` against its own key, `s` against the hello's subject, `ew` against the breach's, and spends `ez`
once. `ew` names the start Redoubt everywhere: orders, frames and receipts.

**The stake** (AUDIT EG0 A1; CARDS6's void law). The key is never returned by a clock:

- **Open** (`/v1/eg/open`) is idempotent on the client's request id `rq`. A crashed client asking again gets the same
  order back. One conditional `UPDATE ... RETURNING` (the insignia-spend pattern) takes one key, writes the stake
  `eg_stakes(ez, account, b, until, state)` and sets `eg_live`.
- **SPENT**: on the first `w` naming its `ez`, or the opener's own `x` whose `why` is not `'void'`; except an account's
  first opened breach that ends with no Redoubt taken (the first breach's mercy, section 5), whose stake is RETURNED, once
  ever, by the first end receipt that says the breach is over with no Redoubt (`nr`), whoever's it is. The opener's own
  end before that word holds the stake while the mercy may still be paid (AUDIT EG III).
- **RETURNED**: on a relay-signed **void** (`e1`, kind `'v'`), or an `x` with `why:'void'`, even after `w` receipts
  (a force deploy, an unknown `egv`: the company keeps its Redoubts and the opener gets the key back). `eg:<b>` mints a
  void for an order it never accepted. It writes the order spent first, as `_holdemVoid` does, so it can never accept
  it after.
- **The clock** spends a stake only after `EG_VOID_MAX_S` (7 days) with no receipt naming it.
- **The opening** is the moment the room accepts the open order, when the arch begins to rise. The service never sees
  it, so a stake's `until` counts from the open's ask: `EG_LAST_WORD_MIN`, the open window's ten minutes
  (`EG_OPEN_WINDOW_S`) and `EG_LIVE_SLACK` (10 min) - 3 h 20 min, room for an order's minute on its way to the room. An
  admission's `eg_live` ends at its stake's `until` (AUDIT EG III: it had been the admission's own ask plus 3 h 20 min).
- **The tombstone**: after the end the room keeps `egdone` for `EG_VOID_MAX_S` (7 days) and refuses older voids (the
  `HOLDEM_STAKE_VOID_S` precedent).

**`eg_live`** (AUDIT EG0 A2) is `{b, until}`, `until` being the stake's. `/v1/eg/open` and `/v1/eg/admit` each write
it in one conditional `UPDATE` (`WHERE eg_live IS NULL OR b = ? OR until < now`). An end receipt or a void clears it,
and a lapsed one counts as clear. No lost receipt can lock an account out. An admission is asked within
`EG_ADMIT_WINDOW_S` (20 min) of its breach's open; a member who takes an order then and never steps in holds that breach
as its live one until its stake's `until` - the service cannot see the room, and the room owes no receipt to a member it
never admitted (a departure, AUDIT EG III).

**The arch on the cell.** The opener's client says the hub's signed call on its world cell (`{t:'eg', k:'arch', b,
site, riseAt, openAt, o, sg}`) on full frames while it stands there, as `portalWire` rides a peer's frame. Peers check
`sg` and stand only a verified arch, at most two a cell, until the open window ends. The relay reads none of it, and
admission never depends on seeing it.

**Poses.** A pose on a moving piece carries `pl` and its offset (RIDDEN POSES, section 10.8); the field joins
`validPose`, a relay version (EG8).

**The fight's bodies.** A body's row is `[i, role, k, pt, x, z, hp, max, fl, tx, tz, v, at, y, ty, st, sa, sz]`: its feet and
its walk's end's height in whole centimetres (the law's, section 9), and its state as the room last said it with since when.
A walk (`emv`) is `[i, x, z, tx, tz, v, at, y, ty]`. The whole fight (`efs`) carries the zones still to burn (`zs`). Every
height rides a word the fight already says, so the frames stay as many as they were. EG-ZJ. A lord's size rides its row too
(`sz`, thousandths of its look's: Colossal's 1250, at rank II 1400; 0 its look's own; bounded 500-2000 on the wire). EG-ZQ.

**Frames** (`{t:'eg', k, ...}`; `EG_KINDS` and `EG_OUT_KINDS` in `src/net/wire.js`, each with its validator):

| frame | way | what |
|---|---|---|
| `{k:'open', z, site}` | opener -> hub | the open order (its Wager and Rehearsal inside) and the arch's site |
| `{k:'call', b, ew, site, riseAt, openAt, sg}` | hub -> the company | the call (section 6.4), signed |
| `{k:'in', z, lv}` | member -> room | the admit order and the level claim (frozen at the first admission) |
| `{k:'here', h}` / `{k:'down'}` | member -> room | arrived in hall `h` / stepped through the door |
| `{k:'st', ...}` | room -> all | the breach: seed, `sd` (the spec's digest), `egv`, hall, kind, variant, slot, twist, stage, the count's end, the respite left, the company (each `m1..`: numeral, alive, witness, home, forsaken, road), each member's Reliquaries, Cantrips and lumen, the Mementos lying, the decrees, the Proclamation, the Wager, the arch's site |
| `{k:'spec'}` / `{k:'specb', b}` | member -> room / room -> one | a spec asked for, and its bytes |
| `{k:'wake', at}` / `{k:'door', at, until, ul}` | room -> all | the trial begins / the door opens (`at`), the closing ends (`until`), and on a forked span the Low Road's closing ends (`ul`) |
| `{k:'hit', q, d, r}` / `{k:'ahit', i, q, d, r}` | member -> room | a blow on the lord / on add `i` |
| `ad`, `amv`, `aatk`, `ah`, `adie` | room -> all | the legion (the Legion-Lord's frames) |
| `{k:'atk', i, a, sh, at}` | room -> all | a lord's blow: the body, the attack, its full shape, when it lands |
| `{k:'cut', i}` | room -> all | a feint cut at `FEINT_AT` (section 13.2) |
| `{k:'tell', i, a, sh, at}` / `{k:'untell', i}` | room -> a Watchfire holder's company | the blow told early (section 15) / a told blow the union floor dropped |
| `hp`, `ph`, `fury`, `fell` | room -> all | the lord's bar, phase, fury and fall |
| `{k:'pz', ...}` | member -> room | an Athenaeum turn (the Orrery's `SD_PZ_*` bounds) |
| `{k:'use', i}` | member -> room | an engine worked (section 11.10) |
| `{k:'cant', i}` | member -> room | a Cantrip used (section 17.2) |
| `{k:'redoubt', w}` | room -> all | the Redoubt taken |
| `{k:'rcpt', r}` | room -> one | that member's `e1` |
| `{k:'offer', v:[...]}` / `{k:'pick', v}` | room -> one / one -> room | the Vestiges, Masteries and shards |
| `{k:'surplus', use}` | member -> room | a Surplus spent (a fourth card, or a reroll) |
| `{k:'ask', q, opts}` / `{k:'vote', q, y}` | room -> all / member -> room | the company's word: decrees, a Bargain, a respite, Ready |
| `{k:'lping', x, z, kind}` | member -> room | a living member's ping, every 3 s (*here*, *danger*, *mine*; section 16.4) |
| `{k:'buy', i}` | member -> room | a purchase from the Sutler (section 17.3) |
| `{k:'mast'}` | member -> room | a Mastery used (Spirebridge, section 15) |
| `{k:'ping', x, z, kind}` / `{k:'bequest', v}` / `{k:'forsake'}` | witness -> room | the witness's acts |
| `{k:'home'}` | member -> room | the way home, confirmed |
| `{k:'void', z}` | client -> room | an order never accepted, asked to be voided |
| `{k:'end', why}` | room -> all | why: `'tear'` (the count spent), `'gone'` (every member out: fallen twice, forsaken or home), `'wipe'` (no living member), `'home'` (THE COVENANT'S PATIENCE), `'seal'` (THE SEAL), `'rehearsal'` (a Rehearsal's end), `'last'` (the last word) or `'void'` (a force deploy, an unknown `egv`, no hall ever woken) |

**The receipt** `e1` (`net/egReceipt.js`: `mintEgReceipt`/`verifyEgReceipt`, signed by `GATE_SIGNING_KEY` as every
relay receipt is):

| kind | claims |
|---|---|
| `k:'w'`, a Redoubt taken | `b`, `w` (the Redoubt), `h` (the hall), `s` (the sub), `c` (this receipt's seed), `sh` (the share dealt), `t` (seconds since the first hall woke), `n` (earning entrants), `ew` (the start Redoubt), `vs` (the Vestiges), `m` (the measures), `z` (the order id), `co` (the company's subs), `fl`, `lb`, `ft`, `wg` |
| `k:'x'`, the member's end | `b`, `h` (the deepest hall cleared), `s`, `t`, `n`, `ew`, `co`, `rl` (Reliquaries opened, with `why` `'home'`, `'seal'`, `'last'` or `'void'`), `fl` (the falls in the breach), `lb` (a Court felled alone), `ft` (feat bits), `td` (seconds from Hall 1's wake to `h`'s door), `wg` (the Wager), `c`, `why` (`'fall'` (a final fall), `'home'`, `'tear'`, `'wipe'`, `'last'`, `'seal'`, `'forsake'`, `'empty'` (the opener's, when the call went out and nobody was admitted before the open window ended) or `'void'`), `z`, `nr` (1 when the breach is over with no Redoubt taken - an end its end owes, or the last living member's; AUDIT EG III). A first fall, which a recall can undo, mints no `x` |
| `k:'v'`, a void | `b`, `z`, `s` (the opener) |

**The account service** (EG2, EG8, EG14):

| route | does |
|---|---|
| `/v1/eg/keys` | the balance and the live breach, for restacking and *Return to the Spire* |
| `/v1/eg/find` | a dungeon's find: the tier, the roll, the caps |
| `/v1/eg/starts` | the start window's preflight: which starts each member of the opener's party may make |
| `/v1/eg/open` | idempotent on `rq`: stakes one, signs `egopen`, sets `eg_live` |
| `/v1/eg/admit` | checks the handle, the breach's stake (none: `breach`; settled, or its open window past: `spent`), the start Redoubt and `eg_live`; signs `egadmit`; sets `eg_live` to the stake's `until` |
| `/v1/eg/claim` | `claimEg`: verifies `e1`, refuses another's, answers guests `guest`. For `w`: one row in `eg_redoubts (b, account, w)` with its embers, the week's pay, Marks, the deed, the depth, the honours, the pity, the Valkynaz's key roll. For `x`: `eg_runs (b, account)`, the board's row, the Reliquaries, settles the stake (the mercy on the breach's own end, `nr`), clears `eg_live`. For `v`, and an `x` whose `why` is `'void'`: returns the stake, held or spent |
| `/v1/eg/board` | `egBoardOf` |
| `/v1/eg/live` | the drain's question: any breach live, and until when |

**Migrations**: the next free numbers when each slice lands, today 0109 (EG2: `players.eg_keys`, `eg_finds`,
`players.eg_key_miss`, the launch gift) and 0110-0112 (EG8 and EG14: `eg_stakes`, `players.eg_live`,
`players.eg_mercy`, `eg_redoubts`, `eg_runs`, `eg_pity`, the depths, `eg_honours`, `players.eg_annals`).

**Versions.** Each slice that moves the relay bundle bumps `RELAY_VERSION` (`world194` when this page was last revised; EG-PLAY's `world199` - `world195` on its branch, renumbered past COATS1, CHAT-LANG, BAL8 and SPAWN-REBIRTH at the merges -,
in `src/net/wire.js`) with its `LAW` row, and a game that does not know it is told to reload. Each that moves the
service bumps `ACCOUNT_VERSION` (`acct114` then, in `server-account/src/service.js`). The new titles and auras join
`TITLES` and `AURAS` in `src/net/identityToken.js`.

## 24. The made level's rules

The world host gates the Burning Court and the Hour at many separate sites today: 19 for `gateArenaDay` and 38 for
`sdRealmSlot` in `src/scenes/world.js`. A third made level would add a third copy of each, and one would be forgotten
(THE FOUR HOSTS RULE's own failure). EG7 makes them one law:

- `madeLevelOf(loc)` answers `'court'`, `'hour'`, `'spire'` or null;
- a table, `MADE_LEVEL_RULES`, says what each turns off;
- a source-sweep test refuses any new per-level check outside it (THE ONE CONSTRUCTION SEAM).

The Burning Court and the Hour are re-plugged with their behaviour unchanged.

| rule | the Burning Court | the Hour | the Spire |
|---|---|---|---|
| saves (the exit autosave included) | refused | refused | refused |
| rest, the travel map's journeys | refused | refused | refused |
| the automap | off | off | off |
| Mark and Recall | refused | refused | refused |
| the Portal Stone | refused | refused | refused |
| companions (GATE-ALONE, SD-ALONE) | kept out | kept out | kept out |
| natural regeneration (`courtRules`) | off | off | off |
| restoring potions | as today | as today | two a hall (THE POTION LAW) |
| Levitate | as today | banned | banned |
| Slowfall | as today | as today | banned |
| a technique's flight on traversal ground | as today | as today | refused |
| the jump buffer and the late press | none | none | 0.12 s each |
| Resurrect | as today | refused | refused |
| Stendarr's AvoidDeath | as today | as today | refused |
| a death | cast out | final for the Hollow | a fall (section 16.5) |
| DEATH-PENALTY | as today | as today | none |

**The world's clock does not stop.** The shared clock turns during a three-hour breach (36 game hours, a game day and
a half). A quest's deadline can lapse inside, which is why the start window warns of it (section 5).

## 25. The look

### 25.1 The rules and the archives

SD-LOOK's four rules are kept (`Super-Dungeons-Look.md`): the void is dark, structure does not glow, light appears only
where it means something, and every surface reads as Daggerfall pixel art. Textures are painted in code into the
Spire's pseudo-archives, registered in `world/pseudoArchives.js` (EG1, section 11.6), free today from **38231** (after
the merchant yard's 38221):

- 38231-38239: the arch, the key and the beacon;
- 38241-38249: the Galleries;
- 38251-38259: the Cairn;
- 38261-38269: the Shade;
- 38271-38279: the Wellhead.

**The bands' ramps** (sRGB, at least five steps each, as SD-LOOK's are):

- the Galleries: marble `[150,146,138]`-`[214,210,200]`, gold leaf `[140,98,40]`-`[246,206,120]` (the Hour's brass,
  reused), Battlemage blue `[36,52,96]`-`[92,124,196]`, the Deadlands' red sky;
- the Cairn: slate violet `[34,28,44]`-`[120,108,140]`, soul-light `[120,200,230]`;
- the Shade: `[6,6,10]`-`[60,64,80]`, moon-silver `[160,166,176]`-`[214,220,228]`;
- the Wellhead: basalt (SD-LOOK's) and iron, molten `[255,120,30]`.

### 25.2 Five lights, five meanings, and no others

| light | means | where | never |
|---|---|---|---|
| **gold** | the way, safety, and "it holds" | arrival and end plates, doors, the Redoubt's beacon, islands and waystones, havens, the way home, THE EDGE LINE, a moonlit branch's rim | an enemy's ward |
| **Dagon red** | his blows, his wards, his marks | every telegraph line (THE SPIRE DANGER EDGE, below), wards and their tethers, lords' marks on members | magma |
| **Battlemage blue** | yours | a pip, a ring or a pillar over heads and at feet: Vestige auras, numerals, a witness's ping, the Watchfire holder's pip | anything on the floor that hurts |
| **white** | the place's own timed hazard | vents ringing, Pendulums' lanes, a Beat's last 0.4 s, a fragment's hazards: hatched, and throbbing at most 3 Hz | a haven |
| **the band's own** | where you are | soul-gem violet in the Cairn, moon-silver in the Shade, molten orange in the Wellhead; the Galleries keep marble and gold | a warning |

**THE SPIRE DANGER EDGE.** Every Spire telegraph line is `TELEGRAPH_EDGE_DAGON` ([1.0, 0.24, 0.28], crimson), never
`TELEGRAPH_EDGE` ([1.0, 0.36, 0.05], orange), which most lords' and every legion outline uses today (Dagon's Wrath and
Reckoning, and the Remnant's Reset and End, already draw the crimson) and which the burning
ground's `POOL_COLOR` shares (`src/world/gateBoss.js`). The pass blends additively, and orange over the Caverns' and the
Wellhead's emissive orange would vanish. Spire pools take the band's ramp, darkened, with a dashed rim, never
`POOL_COLOR`.

**The contradictions the first look had, resolved:**

- **wards are red, not gold.** A Ward-Bearer's tether and glow are the gate's `WARD_COLOR` gold today, and the lord's
  ward cage is gold: an enemy shield would read as safe. In the Spire both are Dagon-red dashes flowing to what they
  guard, and the cage on the lord's bar is red-bronze and hatched;
- **blue is never danger.** Rime-Wrought's ice-blue fills and pools (`ASPECT_COLORS.rime`, its pool [0.28, 0.6, 1.0])
  become a pale cyan-grey with the frost's grain and the dashed danger rim, the misread WB13a T8 fixed for edges only;
- **moonlight that holds is gold-rimmed.** The Shade's moon-silver is near-white, and there moonlight means solid.
  The beam's own light stays the band's; the branch it makes solid wears the gold rim. White stays the timed hazard,
  hatched and throbbing;
- **the Wellhead's orange is never the danger edge** (THE SPIRE DANGER EDGE).

**The lab check** (SD-LOOK's lab law): the danger edge against magma against a pool, a haven against a danger fill,
and solid against white against gone, each told apart at 10 m and 30 m under `?grey` and under deuteranopia and
protanopia filters.

### 25.3 THE EDGE LINE

Every edge a member could fall from (a platform's rim, a floor's `open` edge, a magma channel's lip, a walkway's side)
carries a gold line 2 px wide (3 px on phones), its luminance 0.3-0.45, emissive, kept by the fog as telegraphs are
(section 25.6), never pulsing. Walls and parapets carry none. The Steps carry a gold line under each rim in their mesh
(`SD_STEP_LINE`, `src/world/sdStepsArt.js`); the Spire's 2 px line reuses `sdStepsPass`'s line-quad technique (which
today draws only the ghosts of gone steps) on every edge of every hall. In the Shade's near-black and under the
mist, it is the only read.

### 25.4 The telegraph pass, THE TELEGRAPH BUDGET, THE QUIET COMPANY

**The pass** (`src/render/gateTelegraph.js`) draws one shape a call. The Burning Court already draws several a frame:
its pools, his mark, his blow, and up to `HOST_SHAPES_MAX` (8) host shapes (`src/scenes/gateHost.js`), cut in array
order. A Ward-Bearer's tether is drawn today as a lane in the path pool (`TELEGRAPH_KIND.lane`, `HOST_PATH_HALF_W`
0.35, `TELEGRAPH_POOL.path`). The Spire adds three kinds to `TELEGRAPH_KIND`, each a seam whose default draws the
gate's own:

- **haven**: a gold disc with a dark keyline and inward chevrons, safe while everything else fills red;
- **lanes**: parallel lanes, a Lattice;
- **tether**: a line between two bodies, in two grammars (section 25.5).

The callers' caps rise to 24 shapes, and at most 32 shape-floor draws a frame (section 11.7). `TELEGRAPH_POINTS_MAX`
(10) and `TELEGRAPH_SPOKES_MAX` (8) stay per-shape limits.

**THE TELEGRAPH BUDGET.** A Court at the legion's cap of 14 adds under Chained Blows, with Pyre-Bound, the Casters'
pools, the lord and a fury chain, passes 24 shapes, and a shape dropped unseen still bites (WB13a T1's class). So
`egShapeOrder(shapes, me, now)` decides what each member's screen draws:

1. every shape whose field holds my feet, or that is aimed at me, always;
2. CHECKs and lords' blows;
3. the soonest to land;
4. the nearest to my feet; ties by id.

Before anything is dropped, same-kind discs merge into one `discs` shape (`TELEGRAPH_POINTS_MAX` 10). The union floor
holds a blow that would be the 25th pending on one member. Pinned: the set drawn for a member always includes every
shape the union floor counted for that member.

**THE QUIET COMPANY.** Eight players' effects must not drown the five lights. During a trial:

- cosmetic auras (Beaconlight's motes, the Burning Stair's embers, Firstlight, the insignia's) draw at nothing, and
  return on plates, at rests and in the recap;
- allies' spell effects draw at 60% alpha with no emission, and allies' hit numbers are off unless
  `port:allyEffects` is *Full*;
- a Vestige aura is one thin blue ring (0.6 m) at its holder's feet;
- a shape aimed at another member fills at 0.55 with its full line, and the shape aimed at you draws on top with a
  brighter rim;
- another member's Watchfire lines show only for blows within 12 m of you.

### 25.5 The grammars

- **Havens**: gold, a dark keyline, inward chevrons; never relying on gold against red, a deuteranopia pair.
- **Tethers, pull-apart** (the Wraith's Drain, the Blood Tether, the soul-wisps): a red line with chevrons pointing
  outward from its midpoint and a tick at the break distance. It thins as the pair nears the break, and snaps with a
  glass's sound.
- **Tethers, stay-close** (Morvayn's Chaining): chain links, slack and dim under 6 m, taut and throbbing (at most 3 Hz)
  from 6 to 8 m, a chip *6.8/8 m*, and *Chained to <name>* under the crosshair. Pinned: the two never share a pattern.
- **Marks on members** (section 13.2): Dagon-red sigils over the head, each its own shape: a hound's tooth (the Scent),
  a gem with its seconds (a soul-mark), a flame or a snowflake with its rim's tint (Fire-touched, Frost-touched), a
  chain, a cage.
- **The peril arrow** (*Cleave - move!*): it searches the union floor's polygon, never crosses a wall or an open edge,
  and prefers a bearing that also clears every other pending shape. Under a CHECK with no exit it shows the CHECK's
  order instead (*Stand in the light!*).
- **The Eclipse** (section 11.2): each moon-shaft's footprint is a haven from 6 s out; the bar shows a chip, *The
  Eclipse - 5*; a wind rises from 3 s out and a toll sounds at the strike; the screen darkens over the last 2 s,
  except the havens.

### 25.6 Readable in the dark and the fog

- Today the pass multiplies every shape by `fogFactorAt`, so the Shade's fog and the Cairn's haze fade it, and it is
  depth-tested, so mist drawn after it covers it. In the Spire, telegraphs, edge lines and white hazards keep a fog
  visibility of at least 0.85 within 30 m, and draw after every transparent volume (mist, smoke, fire falls). A render
  probe pins it.
- In the Shade's dark every foe keeps a rim light, the dormant Lurker aside (section 12). Darkness takes the floor,
  never the warning or the foe.
- Danger shapes keep their grain.

### 25.7 Accessibility

The port's Accessibility tab (`src/ui/settingsMap.js`) holds Motion, Readability (swapping the health and fatigue
colours among it) and the large HUD today, and no danger-colour option. The Spire adds:

- **`port:dangerPalette`**: *Standard*, *High contrast*, *Deutan-Protan*, *Tritan*. High contrast draws the danger
  edge magenta ([1.0, 0.15, 0.75]) with a double keyline and a 45° hatch in the fill, safety solid white-gold with
  chevrons, and the place's hazard dashed cyan. The colour-blind presets are pinned to separate under simulation. Its
  colours ride the pass's existing `uEdgeCol` and `uColor` uniforms; the double keyline and the hatch are a new style
  bit in its fragment shader (EG16);
- **`port:telegraphFill`**: a danger fill's opacity, 50-100%;
- **`port:allyEffects`**: *Full* or *Quiet* (THE QUIET COMPANY);
- **`port:reducedMotion`**, new: today only the system's `prefers-reduced-motion` is read (`src/ui/windowMotion.js`),
  and the Motion section holds head bobbing, recoil, technique motion, motion blur and the vignette. It, or the
  system's setting, governs the stair (section 7) and the shakes;
- the Examination's order is told by numerals and a chime per rune as well as light;
- every blow aimed at you gives you a personal sound (THE SPIRE MIX, section 26).

### 25.8 The rest of the look

- **Fragments** (section 11): painted in each band's kit. The Caverns' fire falls are Daggerfall's own TEXTURE.356,
  lit once EG6b ports `GetFireWallColors32` (section 11.6); magma is the band's molten orange, kept under 0.45 where it
  meets a fight floor.
- **The arch** (section 6.3) and **the stair** (section 7).
- **Weight.** The heavy blows (Savage, Smash, Whirl, Gore, the Maul) shake the screen within 8-10 m by the gate's
  `LAND_SHAKE` law, capped by the player's shake setting. The Spire keeps WB13d's decision of no hit-stop: your own
  hits flash a foe fully, allies' at 0.4. A Drop's landing plays a designed thud and dust, not DFU's hard-landing grunt
  (`applyFallLanding`'s FallHard, past 2.5 m), on a drop the course asked for.

## 26. The score and the sound

Written as notes for the game's own player and FM bank, in `systems/egScore.js`. Each score module writes its own
`makeSong`, as `src/systems/sdScore.js` and `src/systems/gateScore.js` do. The mode is E Phrygian, the Kyn's colour
against the Imperial brass: the Battlemages' fanfare, broken, answered by the legion's drums. A pure law,
`spireScoreFor(place)`, chooses the song. The names are 8-character stems, as every made song's are (GATEWAR1,
HOURWAR1):

| song | where | tempo / length |
|---|---|---|
| SPIREGAL | the Galleries' halls | 100 BPM, 96 bars: three 32-bar variants, seeded |
| SPIRECRN | the Cairn's halls | 88 BPM, 96 bars, the same |
| SPIRESHD | the Shade's halls | 92 BPM, 96 bars, the same |
| SPIREWEL | the Wellhead's halls | 110 BPM, 96 bars, the same |
| SPIREYRD | a Rift-Yard's or a Rampart's trial (the band's motif in the brass) | 132 BPM, 32 bars |
| SPIRESET | a set-piece passage, one 8-bar cue a band | 140 BPM, 8 bars each |
| SPIRLRD1 / 2 / 3 | a Court, by phase, with each lord's own 4-bar motif written into the bed | 138 / 144 / 152 BPM, 32 bars each |
| SPIRVALK | a Valkynaz, all phases, rising, each Valkynaz's own motif | 148 BPM, 48 bars |
| SPIRREDT | a Redoubt taken, and its rest: the Battlemages' hymn | 72 BPM, 16 bars |
| SPIRECNT | the count's last 2 minutes | 160 BPM, 16 bars |
| SPIREEND | the tear, a fall, the end | 70 BPM, 12 bars |

- **One song at a time.** The player plays one song and fades between them, so SPIRECNT REPLACES the song at 2:00,
  except under SPIRVALK and SPIRREDT. The priority table is pinned.
- **Silence is scored too**: the gather and the closing play the band's ambience alone, and a lord's wake is a 2-bar
  drum swell before SPIRLRD1.
- The songs are measured as the Hour's were, by `egScoreProbe.mjs` (under tools/, `tools/sdScoreProbe.mjs`'s law):
  every song sounding, peaks under the ceiling, the war louder by phase, and the end decaying in its time.

**THE SPIRE MIX.** The audio engine (`src/systems/audio.js`) has no voice cap, ducking or priority today, and the gate
stings only for a Meteor or a Leap on your ground (`BOSS_CUES.sting`). Fourteen adds, eight players and the score would
mask the cues that matter. So:

- a personal sting, always, for a lord's blow or a CHECK on your feet; for an add's, at most one each 1.5 s;
- Watchfire's tell at pitch 1.4;
- a critical bus (stings, WIND and release cues, CHECKs) ducks the score by 6 dB for 300 ms and is never culled;
- barks capped at four a kind, nearest first; peers' sounds 4 dB down;
- the reverb is the hall's (section 11.9).

## 27. The HUD, the beats and the first breach

### 27.1 The HUD, by form factor

Today the gate's row (`src/ui/gateBossBar.js`, `BOSS_BAR_WIDTH` 460) sits at 44 px on a landscape phone and drops
its marks row there (`max-height: 480px`), and no gate UI reads the HUD's scale. The Spire's is laid out per form
factor, every part reading `--hud-scale`:

- **desktop**: the count's chip and the Reliquaries' beside the compass, the decrees under them, the potion pip, the
  objective chip; the lord's bar only in a Court;
- **a phone held upright**: one 18 px tabular chip (the count and the Reliquaries), the decrees collapsed to a
  tappable *4 decrees*;
- **a phone held sideways**: the count's chip and a 44 px lord's bar; the decrees in the pause sheet and on each
  arrival card;
- the company's state lives on the party rows (section 27.4), never in a second row of pips; the hall and its band
  only on the arrival card.

Pinned at 1280x720, 390x844 and 844x390.

### 27.2 THE COUNT CHIP

- mm:ss in tabular figures at 18 px: gold above 10:00, white to 2:00, red below, pulsing at 1 Hz in the last 30 s;
- *Held*, with a pause glyph, while the count holds;
- gains fly in: *+15:00*, *+10:00 - the Covenant's Press*, *+3:00 - the last word*, *+1:00* for THE GOLD RUN, and
  *Surplus +1* in blue at the cap;
- warnings, each once a count and never again after a Redoubt raises it: *The Covenant presses. Five minutes.* at
  5:00, a toll at 1:00 and at 0:10, and *The count will not hold through the next Court.*;
- when the last word is nearer than the count, the chip shows the last word's figure with a seal glyph.

### 27.3 The arrival card, the objective, the door

- **The arrival card** (`src/ui/gateTitleCard.js`): *Hall 12 - the Broken Galleries*, the objective beneath, the
  twist as a second line, and at a band's first hall its card; *Hall 15 - the Court* and the lord's card at a Court.
- **The objective**, from `EG_TEXT.objective`, stays as a chip with its progress: *Close the rifts.* (*Rifts 3 of 5*),
  *Fell the standard.*, *Hold the relic.* (*1:12*), *Cross.*, *Break the wards at the portcullis.*, *Turn the Orrery
  true.*, *Fell the champion.*, *Find the way down.*
- **The door** (section 7): a gold beam seen hall-wide, a compass and screen-edge marker, *The way down opens.*, a
  door's sound, and the closing's ring in every hall kind, not only spans.

### 27.4 The party rows

The party panel (`src/ui/partyPanel.js`, PARTY8-B's quiet rows) learns the Spire's states:

- each member's numeral;
- a cracked gold sigil on the portrait once their recall is spent: the company must see who is on their last life;
- a grey row with an eye for a witness; an arch for home; a struck-through name for the forsaken;
- an amber ring draining the 180 s for an absent body;
- the place line reads *High Road* or *Low Road* while the company is split;
- Fire-touched or Frost-touched as its sigil.

### 27.5 Every event is seen, heard and said

Sight, sound and words, for each (`EG_BEATS`, pinned):

| event | sight | sound | words |
|---|---|---|---|
| a cast-back | a 0.4 s dither cut to the waystone, the Steps' rewind burst | the Steps' rewind | *-10%* |
| the pull | the veil's flash | the veil's close | *The Spire pulls you down.* and the toll |
| the door | the beam, the markers | a door's sound | *The way down opens.* |
| a cache | its icon on the door's plaque; taken: the loot banner | a chime | the item's name |
| the fork | two banners on the island: a Reliquary's glint high, a brazier and a stair low | - | *The way divides.* |
| a niche | a blue alcove, dimmed once used | a soft chime | - |
| a Memento | a gold mote; carried, it trails the carrier; set, the niche flares | a bell | *<name> carries Mara's Memento.* |
| THE GOLD RUN | the count's chip | a fanfare | *Gold run. +1:00* |
| a phase turn | the lord's phase card | the drum's turn | its one order |
| a fall | THE FALL (section 16.5) | a low toll | *<name> falls.* |
| a recall | a flare at the beacon, a blue pillar | a chime | *<name> is called back.* |
| a Redoubt | its sequence (section 16.2) | SPIRREDT | *Redoubt 5* |
| a key found | the *Weir Key* banner | the Rare chime (`playRareDrop`) | - |
| the Athenaeum's reward | the Orrery's light | a chord | *The Orrery turns true. A Vestige waits.* |
| a twist | the arrival card's second line | - | its line |
| another walks home | their row's arch | - | *<name> walks home.* |
| the last word | the chip's seal | a toll | *The last word. The breach closes.* |
| a Second Wind | the health bar's rise | a chime | *Second Wind! 350 health returns.* |
| Rally's heal | the health bar's rise | a chime | *Rally! The company heals 14%.* |
| a Lifeline window on me | its blue chip and its seconds | a soft chime | *Lifeline! 30% less from blows for 3 seconds.* |
| a Shield-Hymn window on me | its blue chip and its seconds | a soft chime | *Shield-Hymn! Bastion's guard for 4 seconds.* |
| Spellweave's free spell | its blue chip while the next is free, the book's 0 | a soft chime | *Spellweave! The spell costs nothing.* |
| Rallying Cry's refresh | the door's beam | a chime | *Rallying Cry! Your Second Wind is ready again.* |
| a Bladestorm | the struck foes' flash | the low swing, lower | *Bladestorm!* |
| a Deadeye | the pierced add's flash | the bow's loose, higher | *Deadeye! The arrow runs through.* |
| an Accord forms | its blue chip while the pair stands | a soft chime | *Kindled Steel, with Mira.* |
| an Accord lapses | its chip gone | - | *Kindled Steel lapses.* |
| resonance reached | the card's blue line before it, the recap's capstones | a chord | *Stone resonates: Rooted.* |

A cast-back and the toll say what they took of the health bar: the quarter's floor, the last point the toll never takes
and Stoneskin's cushion all make it less than the law's share, and a toll that takes nothing says nothing. The Vestiges'
rows are the holder's alone, on the screen and never in the chat, each on THE SPIRE MIX's critical bus:

- the relay tells a Bladestorm's or a Deadeye's striker alone (`esay` `storm` and `deadeye`, `s` the striker), and only
  when it struck another foe; Kindled Steel's splash, which comes with every melee blow its pair lands, is said by its
  Accord's chip and its forming, never blow by blow;
- an Accord stands by the pair law where the screen draws the company (`accordMates`); its forming and its lapsing are each
  said once a hall, and the first look in a hall only learns what stands, so a company gathering at a plate says nothing;
- a window's chip reads its whole seconds left, and Shield-Hymn's shows only while another's Bastion guards me.

### 27.6 THE RECAP

A run of up to three hours never ends on a receipt alone. On `end`, and for a member who walks home, both skins show:

- the depth (the hall, the Redoubt, the band), the time from Hall 1's wake, and why it ended;
- a strip per circle: the hall kinds' glyphs, the lord, the falls marked;
- the company: each member's share, healing, falls, recall and how they left;
- the Vestiges held, the capstones, and the Accords;
- the Reliquaries opening one each 400 ms with the Rare chime;
- the board's line: *The Descent, the Few: 14th*.

The last five runs are kept. At every lord's fall the damage chart shows as the gate's does (FELLED, then the chart,
`src/ui/gateDamageChart.js`, with its Healed column).

### 27.7 The first breach

- **The fixed first circle** (section 7): the Caverns, Grath, every system in its first five halls.
- **First-time lines**, once an account (service bits, `EG_TEXT_FIRST`), each at its first occurrence, never in a card
  before it applies:
  - *The count runs. Take a Redoubt to hold it back.*
  - *The first across opens the door. The others have 45 seconds.*
  - *The void casts you back.*
  - *High and fast, or low and safe.*
  - *A slow lord turns to fury.*
  - *Choose the circle's decrees.*
  - *A Redoubt can call the fallen back once.*
  - *Carry a fallen friend's Memento to a niche.*
  - *Walk home to open your Reliquaries.*
- **THE REHEARSAL**: once a real day, a keyless breach of Halls 1-5 (`/v1/eg/open` with `rh` in its order: no stake),
  with the count and one life but no spoils, receipts or boards. It ends at Redoubt 1 (`why:'rehearsal'`), a wipe or
  the tear, and counts against `EG_LIVE_MAX`. It sets `eg_live` for its life, like any breach, and is never the first
  breach's mercy, having no stake. A scarce key is never the price of learning.

### 27.8 Touch and the pad

Today the right half of the screen is look and Jump is a held button in its corner (`src/ui/touch.js`), so a jump
with a camera correction needs two right thumbs, and the stick sprints only past `RUN_THROW` (0.8). No gamepad rumbles
anywhere in the port. In the Spire:

- a Jump press that keeps sliding becomes look;
- an upward flick on the look half (40 px or more in 150 ms or less) jumps too;
- on spans the stick runs at full throw;
- haptics, behind the existing `touchHaptics` setting: 15 ms when the Beat you stand on enters its last 0.4 s, 30 ms
  on a peril; a pad's dual rumble for the same two, behind the same toggle.

### 27.9 Words

Lines are short (Mac, WB12: *"less explanatory and less AI"*), in the Elder Scrolls' own voice, and follow WB13b's
rules. Every player-facing line is a constant in `EG_TEXT`, worded once and pinned.

## 28. The four hosts

- `src/scenes/world.js` - WIRED:
  - the key's arm and its refusals; the start window and its preflight; the arch pool (`egArchPool`, the gate pool's
    law, standing only verified arches); the call's prompt, horn and portal;
  - the Timers row, the sight line, the company's map mark;
  - the hub's open and the room link; the swap's caller;
  - the HUD and its layouts, the count's chip, the arrival card, the rest window, the recap; the claim queue
    (`createEgClaims`, as `createGateClaims` in `src/net/gateClaims.js` is); *Return to the Spire*;
  - the score, THE SPIRE MIX and the reverb's hold; the flight bans (OR'd into the one ward registration) and the
    technique refusal; the jump buffer; THE POTION LAW's counter; no Resurrect; the AvoidDeath hook answering false;
    a death as a fall;
  - DEATH-PENALTY exempted; THE FALL; the witness view.
- `src/scenes/worldModes.js` - WIRED: `swapEgHall(spec)` beside `enterSdRealm`; `standEgHall(ctx)` beside
  `standSdRealm` (meshes, collider buckets, lights and the hall's fragments, through `egHallParts`); the next hall's
  build during the closing; every swap under `stepThroughFire`; each fragment's clamp; the cull; `madeLevelOf`; the
  AvoidDeath hook.
- `src/scenes/dungeonContext.js` - WIRED: the span's riders (`sdStepsRide`, generalised in EG4) and RIDDEN POSES; no
  foes stream in a made level (every foe is the relay's); the AvoidDeath hook.
- `src/scenes/exterior.js` - FLAGGED: the `?exterior` bench is offline. There is no Elite Breach there, and the key says
  so (*The key is cold here.*).

`scenes/egHall.js` (EG10) is a helper the hosts call, not a fifth host. Every slice record below names all four, each
wired or flagged.

## 29. How the arc keeps the Process rules

`bible/Home.md`'s Process rules bind every change. Where this arc meets each:

- **THE FOUR HOSTS RULE**: section 28, and every slice record names all four.
- **THE MODAL CONTRACT**: `worldModes.frame()`'s Spire branch returns the same type from every exit, and EG10 pins it in
  a test.
- **THE NATIVE-WINDOW RULE**: on the classic skin, the start window is DFU's list picker (section 5). The rest window,
  the Vestige offer, the company's word, the confirm, the board window and the recap are each built from DFU windows
  named per element in their slice's record, or do not draw on the classic skin until they are looked up.
- **THE ONE CONSTRUCTION SEAM**: `egHallParts(spec)` builds every hall's model, collider buckets and riders together
  (section 9), and `madeLevelOf` is the one law of the made levels' rules (section 24).
- **ONE DFU MEMBER, ONE EXPORT**:
  - the gate's constants (`BUCKET_*`, `PHASE_AT`, `SHIELD_MS`, `THREAT_*`, `ATTACKS`, `POOLS`) are imported, never
    copied;
  - `sdSeed`, `rimSpots` and `topWithMe` are exported once and imported (`hostTeamHpFor` already is);
  - the platform clock moves to `net/egSpanLaw.js` once, and `src/world/sdSteps.js` re-exports it;
  - `EG_ESCAPE_MPS` is computed from `runSpeed` at the escape build, never a literal;
  - the span law's copied motor numbers are held equal by a test;
  - one mesh kit (`world/meshKit.js`) and one registry of pseudo-archives (`world/pseudoArchives.js`).
- **A PIN MUST FAIL**: every slice ships `eg<N>_*.test.js` under test/ and its mutant records, `eg<N>.json` under
  tools/mutants/, every mutant dead; laws are pinned with deepEqual against their tables, never inequalities.
- **TEST THE SHAPE THE PRODUCER MINTS**: receipts, orders, specs, fragments and courses are tested as
  `mintEgReceipt`, `identityToken`, `egHallOf`, `egFragOf` and `courseOf` mint them, never as hand-built literals.
- **THE SLOT IS EMPTIED BEFORE THE OCCUPANT IS TOLD**: the start window, the rest window, the Vestige offer, the
  company's word and the confirm are overlays. Each is closed by the room's `st` or `end`, with the slot nulled first
  and one callback.
- **ASYNC NEVER DROPS**:
  - the open is single-flight on `rq`, and the hub's forward is retried on `ez`;
  - claims are coalesced per (breach, Redoubt, kind);
  - the restack coalesces;
  - every refusal is checked again when its async answer lands.
- **EVERY ALLOCATION HAS AN OWNER**:
  - every exit path (the swap, the tear, the way home, a fall, forsaking, a void, a reload) frees the hall's meshes,
    colliders, riders, telegraph buffers and reverb buffers, its fragments' with them (the court's and the Hour's
    meshes are built once and never freed today; the Spire's are not);
  - band textures are cached per band and freed at the breach's end;
  - the arch pool owns its arches; the reverb's hold is released on every exit.
- **SWEEPS THE SOURCE**: the made levels' rules (section 24), the law files' banned functions (section 9) and
  `RELAY_GRAPH`'s contents are each held by a source sweep, not a reviewer's memory.
- **RETIRING A FLAG DELETES THE SENTENCE**: any INTERIM this arc opens (EG8c's interim Court lord among them) is
  retired by deleting its sentence.
- **A SLICE CLOSES ITS LEDGER ROW**: ELITE-GATES (Ledger A) is narrowed slice by slice, every citing file named in it.
- **A CITE NAMES WHAT IT POINTS AT**: the slices' docs cite by anchor.
- **PATCH NOTES LIVE ON THE PULL REQUEST**: each player-facing slice writes its notes in its pull request's
  description, under `## Patch notes: <title>`, never as a file.
- **UPDATES ARE NUMBERED, AND NOBODY BUMPS THEM**: no slice writes an update number.
- **DO NOT FIX WHILE THE VERIFIER IS READING** (17l): every audit of this page, EG21's included, freezes the page
  before its lanes read and edits nothing until every lane has returned.
- **Frame-synced probes**: EG10's and EG16's Playwright probes of the halls frame-sync on the shot-mode `__frame`
  counter, never sleep.
- **Scripted bible edits ASSERT their needle**: every scripted edit of this page or its record checks that its needle
  matches exactly once.

## 30. What it does not do, said so

- **No Abyss Breach.** The gate's third tier is named (section 2) and not built.
- **No revive past the recall.** One recall a breach, at a Redoubt or by a Memento; no Vestige, spell, Cantrip or power
  raises the fallen again.
- **No company changes.** One who joins the party after the open is not in the breach.
- **No trading or selling keys.** They are the account's.
- **No Elite Breach offline**, the Rehearsal included. Offline there is no relay to run it.
- **No ordinary dungeon foes inside.** Every foe in the Spire is the relay's, or the one life would be a client's word.
- **No Gilded piece.** The Hourlock stays the one.
- **No Morrowind architecture.** The Morrowind layer has no statics, cell or collision path (it reads `STAT` records
  only for spell effects), so every fragment is the port's own geometry.
- **No real Daggerfall blocks inside.** The relay reads no BSA and could not know their floors.
- **No weekly seed.** The budget (section 9) makes halls of a depth weigh the same, and a shared seed would make the
  boards a race to scout it. The week's Proclamation (section 20) is a rule, not a seed.
- **No pause.** The count holds by its own rules and the respite budget, never on a member's word.
- **Nothing gets faster.** No depth, decree, tide, stratum or fury shortens a wind-up, a piece's timing or a crumble.

## 31. Slices and their records

The order the arc ships in. Each slice can ship and be checked without the next, and the content arrives band by band.
Every slice ships its tests (`eg<N>_*.test.js` under test/) and mutant records (`eg<N>.json` under tools/mutants/),
every mutant dead, and its record names the four hosts and the Ledger rows it opened or moved. Each band's kit ships
its band's art: no slice ships a placeholder. EG8 to EG12 ship behind `EG_OPEN=false`, opened by EG13.

| slice | what | moves |
|---|---|---|
| **EG0** | this page | the bible |
| **EG0a** | AUDIT EG0 | the bible |
| **EG0b** | the fragments (sections 11 and 8.8 as first written) | the bible |
| **EG0c** | AUDIT EG II, the polish pass | the bible |
| **EG-PLAY** | THE ELITE BREACH, PLAYABLE: the slice the user asked for before the rest - the smallest Elite Breach that plays online end to end, cut through EG2, EG5, EG8, EG9-EG12 and EG14's `w` arm (its record, below, says what each piece took and left) | client, relay (world196), service (acct124) |
| **EG1** | THE GATE'S TIERS: `systems/gateTier.js`, `GATE_TIER_TEXT`, the Regular tier's words unchanged; THE REGISTRY: `world/pseudoArchives.js`, every port archive in it, and its collision test | client |
| **EG2** | THE WEIR KEY: template 575 and its art; the balance (migration); the rolls in `claimGate` (which gains `rand`) and `claimSd`; the pity; `/v1/eg/find`, the killer's ask and the caps; `/v1/eg/keys`; the restack, new; the launch gift (a send migration) | client, service |
| **EG3** | THE BOSS SEAM: `net/bossSeam.js`; the gate, the Remnant and the serpent re-plugged, frames and pins unchanged; the trails keep y | relay (a version) |
| **EG4** | THE COURSE AS DATA: `courseOf`, with the Hour's course byte for byte, and every reader fed; the platform clock moved into `net/egSpanLaw.js`; `orreryOf` widened and `orreryJudge` extracted, with the Hour's draw and judge unchanged | client, relay (a version) |
| **EG5** | THE HALL LAW: `net/egLaw.js` (the record, the clock and its holds, the rhythm, the circle, the variants, the bands, the spec, the decrees, the recast trials and their effects, `egFightProfile` and its validator, the waves); the law's integers, `lawSin`/`lawCos`, the source sweep and the spec's digest; `sdSeed` exported; `arenaWeekOf`; the standing decrees and the frames' nine | client, relay bundle |
| **EG6a** | THE SPAN GENERATOR AND THE TIMED SOLVER: `egSpanOf`, the solver in the law (windows, no queues, the median, ceilings, shafts, the crossing's bound at the fast build), `egSpanSolve.mjs`, the Drop and the other Galleries pieces, the toll, the Galleries' sweep (25 seeds a pull request, 500 nightly) | client |
| **EG6b** | THE FRAGMENTS: `net/egFragLaw.js`, the sockets and the volumes; the Oblivion Caverns kit (passage, chamber, shaft) with its art; the dressed platforms and their tells; THE EDGE LINE; THE FORK (its foes from EG11); the Collapsing Tube; `world/meshKit.js`; the instanced moving-piece pass; the cull; telegraphs per fight floor; THE WIDTH RULE; the fragment's clamp; the camera in rock; the reverb's hold and crossfade; `GetFireWallColors32`, with audit39 re-pinned; the budgets measured on SwiftShader and a reference phone | client, relay bundle |
| **EG6c** | HERO FRAGMENTS: `fragBake.mjs` (under tools/), and each fragment Mac authors with its law markers and its byte-for-byte test | client |
| **EG7** | THE MADE LEVEL'S RULES: `madeLevelOf`, `MADE_LEVEL_RULES` (THE POTION LAW, AvoidDeath, technique flights and the jump buffer among them) and the sweep test; the Burning Court and the Hour re-plugged unchanged | client |
| **EG8a** | THE ROOM AND ITS ORDERS: the `eg:` family, the orders (`ORDER_KINDS`, `EG_ORDER_FIELDS`), the hub's open (`EG_INTERNAL_OPEN` retried, `eglive`, `egrc`, the signed call), presence, the tick, the Rehearsal's `rh` | relay (a version), service |
| **EG8b** | STAKES AND `eg_live`: stakes, voids, the first breach's mercy, `eg_live`, `claimEg`'s `x` and `v` arms (a void returns a key from this slice on), the key-loss paths | service, relay (a version) |
| **EG8c** | THE DIRECTOR AND THE WAVES: `net/egBrain.js` (the stages, the count and its holds, the closing, the pull, the company's word), `net/egHost.js` with the gate's three kinds lifted, THE GOLD RUN, the numerals, the secret receipt seeds, and an INTERIM Court lord (the Proving champion's kit) so a Redoubt can be reached before EG13 | relay (a version) |
| **EG8d** | INTEGRITY: THE FAIR TRAIL and its time law, `judgeShapes` and the full shape stamp, the hazards judged, `net/egFloor.js` (THE UNION FLOOR in time), RIDDEN POSES (`pl` in `validPose`), the clock's correction, the feint's `cut`, `untell` | relay (a version), client |
| **EG8e** | DURABILITY: saves to storage, THE HOLD, THE DRAIN, the law pin (seven days of `EG_SPEC`, `{k:'spec'}`), time across a restart | relay (a version), deploy |
| **EG9** | THE ARCH AND THE CALL: the arm, the refusals, the start window (`/v1/eg/starts`, the ticks, the Wager, the Rehearsal's choice), the arch pool, the pass's per-draw membrane and beacon and `GATE_PASS_MAX`, the clear sweep's keys, the signed cell word, the call's prompt and horn, the portal, the landings, the Timers row, the sight line, the map mark | client, service |
| **EG10** | THE HALLS ON THE PAGE: `world/egHall.js`, `scenes/egHall.js`, `egHallParts`, THE SWAP (the build during the closing, the free pins), the stair and reduced motion, arrival, gather, closing and pull, the HUD's layouts and THE COUNT CHIP, the arrival card and the objective, the flight bans and the technique refusal, the jump buffer, the cast-back, THE FALL, DEATH-PENALTY exempted, *Return to the Spire*, the fixed first circle and the first-time lines, the Rehearsal, touch and the pad, `EG_BEATS`, the modal contract's pin, frame-synced probes | client |
| **EG11** | THE HALL KINDS, THE TWISTS AND THE LEGION: the Rift-Yard and the Wellspring, the Span, the Rampart and the Falling Wall (bastions, waystones), the Athenaeum, the Proving Walk and its champions, the Deepway, the chambers and their play; kinds 3, 4 and 6 and ROLE READS; the push; haven, lanes and tether; the callers' 24 shapes, THE TELEGRAPH BUDGET, THE QUIET COMPANY, THE SPIRE DANGER EDGE; caches, Cantrips, lumen and the Sutler; the Caverns' sluice and the alcoves; the potion pip | client, relay (a version) |
| **EG12** | THE REDOUBT: receipts, the spoils (`systems/egSpoils.js`), Reliquaries, the sequence, the rest, the pressed way home, the Vestiges (law, offers, Masteries, Accords, shards, effects, the relay's half, the caps, resonance, the death saves), the fallen (the recall, the Memento and the niches, THE WITNESS VIEW, the bequest, forsaking), the company's word and the living ping, the surplus and the respite budget, the party rows, the receipts' fields (`fl`, `lb`, `ft`, `td`, `wg`), THE RECAP | client, relay (a version) |
| **EG13** | THE GALLERIES' LORDS: Grath, the Last Spellmaster, the Last Armsmaster, Valkynaz Ilthys (`net/egLord.js`), each with its phases, beats, marks and errand pins for *n* = 1 to 8; fury; errands by numeral; the wake ring; THE COVENANT'S PATIENCE; THE SEAL; the Galleries' other fragments (the Fallen Stacks and its shelf, the Broken Colonnade); the INTERIM Court lord retired; `EG_OPEN` opened | relay (a version), client |
| **EG14** | THE CLAIM, THE ECONOMY, THE HONOURS, THE BOARDS: `claimEg`'s `w` arm, the migrations, the week's pay, the embers, the pity, the Valkynaz's key, the Broker's sink, the named Legendaries, the feats, titles and auras, the three boards and the board window, the Proclamation, the Wager, the season's champions, the Annals, `BOSS_BODY` on in `eg:` rooms (after EG8d), the herald | service, relay (a version), client |
| **EG15** | THE PANOPLY AND THE CARDS | client |
| **EG16** | THE LOOK: the arch's skin, the stair, the skies (the Spire's underside in every sky, smaller each band), `port:dangerPalette`, `port:telegraphFill`, `port:allyEffects`, the lab checks, frame-synced probes | client |
| **EG17** | THE SCORE AND THE SPIRE MIX | client |
| **EG18** | THE SOUL CAIRN: the Cairn-Keeper, the Twin Lords, Valkynaz Morvayn, Binders and Wraiths (kinds 7 and 8), the Gust and the Rail with their sweep, the Ossuary, the Mist Stair and the Sinking Stair, the Muster and the Winch, the soul-bell, Hall 26's Brink, the Cairn's art | relay (a version), client |
| **EG19** | THE SHADE PERILOUS: the Mother of Dusk, the Night-Stalker, Valkynaz Seyth, the Divers (kind 5), the Pendulum with its sweep, the Gloam Thicket and its Hollow Trunk, the Eclipse Vault, the Moon Path, the Holdfast and the Gauntlet, the moon-mirror, Hall 51's Brink, the Shade's art | relay (a version), client |
| **EG20** | THE HAVOC WELLHEAD: the Bound Colossus, the Wellhead Wyrm, Valkynaz Garoth, the Vent with its sweep, the Daedra Lord elite add, the tides, the strata, the Forge Gut and its Slag Chute, the Clan Pit, the deep Caverns, the Forge Line, the drop-hammer, Hall 76's Brink, the Wellmouth and the Forge Bridge, the Wellhead's art | relay (a version), client |
| **EG21** | THE TUNING PASS AND AUDIT EG III: the budget, the count and the pace measured in the field; whether the crossing's bound becomes a gate | all |

Each slice's record goes below as it lands: what shipped, its pins and mutant records, the four hosts, the Ledger rows
it opened or moved, and where it departs from this page.

### EG0 - written 2026-10-11 (the page)

The design, whole, before any code. Grounded in the shipped tree at `d9a3ced2`:

- the gate's clock (`src/net/gateLaw.js`);
- the made levels (`src/world/gateArena.js`, `src/world/sdRealm.js`);
- the brains and their shared hand (`src/net/gateBrain.js`, `src/net/sdRemnant.js`);
- the marks (`src/net/gateMods.js`, `src/net/sdMarks.js`);
- the Steps (`src/world/sdSteps.js`) and the engine's envelope (`src/player/motor.js`, `src/player/parkour.js`);
- the party (`PARTY_MAX` 8) and the hub's rosters;
- the receipts and their claims, the boards (`server-account/src/arena.js`) and the Portal Stone.

THE FOUR HOSTS: `src/scenes/world.js`, `src/scenes/worldModes.js`, `src/scenes/dungeonContext.js` and
`src/scenes/exterior.js` are all untouched. A page moves no host.

### EG0a - AUDIT EG0 - 2026-10-11 (Mac: "Do a comprehensive audit and ensure this is the best and most detailed it can be")

Five cold lanes on the frozen first draft (177a3acd6), no edit made until every lane had returned (17l):

- code truth, about 210 claims checked;
- numbers and consistency, with simulations of the pace, the motor and the drifts;
- architecture, trust and failure;
- game design and the player's experience;
- lore, words and the bible's rules.

There were **105 findings**: 31, 23, 17, 16 and 18. A sixth cold lane then re-read the revision against every
row and found **28** more (3 HIGH), each fixed in place. Each was verified against the tree, the maths or UESP, and each
has its verdict and its place in the revision in `01-Overview/Audit-EG0.md`. The revision moved the page whole:

- **the lore** set right: the Spire's fate, a Valkynaz a warrior duke, the door held by the key and not a lord's will,
  and the torn halls marked as the port's invention;
- **the words** renamed: Weir Key, Redoubt, decree, the Vestige families, lord;
- **the protocol** rebuilt: the hub's open, stakes and voids, `eg_live`'s expiry, orders fit to `identityToken`, the
  drain, the law pin, durability;
- **the floors**: the escape build, the union floor, the CHECK class, the errand floor, and nothing faster;
- **the fallen** given a recall, a witness's seat and a bequest;
- **the risk**: Reliquaries;
- **the economy** rebalanced: weekly pay, embers where earned, a pity count, a sink;
- **the boards** made honest: the Descent from the first hall, by bracket;
- **the pace** re-modelled: the walls now stand where the rules put them.

THE FOUR HOSTS: untouched, as at EG0.

### EG0b - 2026-10-11 (the fragments; Mac: "sometimes platforms can lead to oblivion caverns, or different types of modeled areas instead of simple platforms")

The fragments were written as sections 10.1-10.8 and 8.8 (section 11 and section 8.8 since EG0c):

- **fragments** (passages, chambers and shafts), with a library of ten across the four bands;
- every platform dressed, the top you see being the top you stand on;
- THE FORK (the High Road and the Low Road);
- the Deepway;
- chambers for Yards, proving courts and the lords' grounds;
- the fragment record, a law half the relay reads and a mesh half it never sees;
- code-built kits and authored hero fragments, with one mesh kit and one registry of pseudo-archives;
- fight floors, telegraphs per floor, walls that bound the escape, and THE WIDTH RULE (the Charge, the Dive, the Lunge
  and the Rampart's vents widened to 3 m; EG0c widened every aimed blow to 4 m);
- headroom for both third-person cameras;
- light, sound, budgets and the cull.

They are grounded in:

- the gate's and the ships' bakes (`tools/bakeGate.mjs`, `tools/shipBake.mjs`, `tools/fbxMesh.mjs`);
- the collider (`src/player/collider.js`);
- the telegraph pass, and how flat it is (`src/render/gateTelegraph.js`);
- `deepIn`'s margin (`src/net/bossBody.js`);
- the cameras (`src/player/mwCamera.js`, `src/player/eotbCamera.js`);
- the light caps;
- the reverb presets;
- TEXTURE.356, the Mantellan Crux's fire walls.

THE FOUR HOSTS: untouched.

### EG0c - AUDIT EG II - 2026-10-11 (Mac: "Im really looking for AAA grace quality when it comes to everything implemented. Do a detailed polish pass and audit")

Six cold lanes on the frozen page (14b3b172f), no edit made until every lane had returned (17l):

- code truth, about 240 claims checked;
- numbers and consistency, with the pace model, the motor's carries and `deepIn` swept;
- AAA game design, against Hades, FFXIV's deep dungeons, Mythic+, Destiny, Elden Ring and their kin;
- architecture, performance, netcode and failure, with the collider, the mesh build and the reverb measured;
- prose, structure and the bible's rules;
- presentation, feel and accessibility.

There were **282 findings**: 25, 37, 44, 46, 90 and 40. Each has its verdict and its place in this revision in
`01-Overview/Audit-EG-II.md`. The polish moved the page whole:

- **the structure**: section 6 numbered, the fragments their own section (11), and every section after it renumbered
  once, before any code cites the page; the words table rebuilt, with five overloaded words split ("the descent"
  became the closing, the Descent piece the Drop);
- **the truth**: TEXTURE.356 draws unlit today, the fall's share retirement is new, `fbxMesh.mjs` cannot bake a scene,
  the Jump spell steers in the air, AvoidDeath must be refused, a 3 m lane is invisible to the relay (4 m now);
- **the netcode**: THE SWAP in place of an exterior round-trip, RIDDEN POSES, the corrected clock, the fair trail's
  time law, secret receipt seeds, an exact law with a spec digest, THE UNION FLOOR in time, THE HOLD;
- **the halls**: variants for the Yard and the Rampart, bastions and waystones, champions with signatures, the wake
  ring, the Brink halls, twists from circle 2;
- **the fragments**: a signature each, set-piece passages, a fork at every span, chambers that play, engines, alcoves
  and the Annals, measured budgets, instanced pieces, a fragment's own clamp;
- **the lords**: phases for every lord, the Valkynaz on their own ground with their own kits, the Scent and the havens
  made fair, errands by numeral;
- **the run**: the count held between halls, THE COVENANT'S PATIENCE, the respite budget, the Memento, the witness
  view, the company's word, Mastery Vestiges and Accords, healer Vestiges, caches, Cantrips, lumen, the Sutler, THE
  POTION LAW, key pity and the first breach's mercy, the Valkynaz's key, strata, the Wager, the Proclamation, THE SEAL,
  named Legendaries and feats;
- **the presentation**: THE SPIRE DANGER EDGE, the five lights' contradictions resolved, THE EDGE LINE, THE TELEGRAPH
  BUDGET, THE QUIET COMPANY, two tether grammars, the danger palette, THE COUNT CHIP, layouts per form factor, a beat
  for every event, THE FALL, THE RECAP, the first-time lines, the Rehearsal, touch and the pad, THE SPIRE MIX, and a
  score that does not loop to death;
- **the pace** re-modelled again (`pace3`): about 6 / 11 / 12 / 15 from Hall 1, and a season's ceiling of about 16 /
  39 / 57 / 88;
- **the slices**: EG8 split five ways, every system given a slice, each kit with its band's art, the registry in EG1,
  and an INTERIM Court lord so the Redoubt can be reached before EG13.

THE FOUR HOSTS: untouched. A page moves no host.

### EG-PLAY - 2026-10-11 (Mac: "Do not come back until this is done") - THE ELITE BREACH, PLAYABLE

**What this is, said plainly.** EG0 to EG0c wrote the design and built nothing. EG-PLAY is CODE: the smallest Elite
Breach that plays online end to end, from the key to the claim, cut through the slices above. Where a slice was to
build a piece whole, EG-PLAY builds the part the loop needs and lists what it leaves; the slices above stay the plan
for the rest. A player can now turn a Weir Key (or open the day's Rehearsal), call their party, step into the Spire,
fight down a circle of five halls - a Rift-Yard, a Span through an Oblivion Caverns passage, a Proving Walk, a Rampart
and a Court - under THE COUNT and one life, take the circle's Redoubt, rest, and walk home with its receipt or descend
to the next circle.

**What shipped, by piece.**

- **The key** (EG2's core): template 575 (`systems/weirKey.js`), bound and stacked; its picture DFU's Talisman's
  (TEXTURE.211 record 50). The count is the account's (`players.eg_keys`, migration 0111 - 0112 since the merge past NAME-AS) and the pack's stack its face,
  restacked by every answer that carries it. Rolled at a recorded gate claim (the first certain, then one in six, one in
  four with the rite broken, the pity after five misses) and an Hour claim (one in three) - `server-account/src/eg.js`
  `rollWeirKey`, answered as `weir` on both claims. `/v1/eg/keys`. The launch gift: one key to every account with a
  gate kill that was not a rite's.
- **The open, the stake, the admission, the claim** (EG8a, EG8b, EG14's `w` arm): `/v1/eg/open` stakes a key
  (idempotent on its request id; one live breach an account; the Rehearsal once a real day with no key);
  `/v1/eg/admit` signs a member's admission; `/v1/eg/claim` takes the `e1` receipts - a Redoubt (`w`, which fills the
  INT5 spoils budget), an end (`x`; the opener's own end settles the stake, the first breach's mercy returns it once
  when no Redoubt was taken), a void (`v`, the stake back). The orders `egopen` and `egadmit` (`net/identityToken.js`);
  the receipt (`net/egReceipt.js`).
- **The law** (EG5's core): `net/egLaw.js` - the room key `eg:<16hex>`; the clock (rising 20 s, sealed to five minutes,
  open five more, the last word); THE COUNT (thirty minutes from the first wake, fifteen more a Redoubt, thirty in hand
  at most, held through a rest and a pull); the circle's rhythm (the first circle fixed); the hall spec in whole
  centimetres off the port's seeded die and an integer sine table (`lawSin`), with its digest; the floors' queries; the
  Rampart's vents.
- **The room and the director** (EG8a, EG8c): the hub opens a breach on the service's order, freezes the company from
  the opener's party and says the call; the breach's room admits its company alone, each with its own admission, and
  runs the halls (`net/egBrain.js`): the gather on the arrival plate, the trial by kind, the door, the closing and the
  pull, the Redoubt and the rest, the next circle, the end (`tear`, `wipe`, `last`, `empty`, `gone`, `rehearsal`);
  one life (a death, or three minutes absent in a trial, is a member's fall). The legion (`net/egHost.js` - the gate's
  Harriers and Ward-Bearers about a hall's own spots); the champion's kit (`net/egLord.js` - the Warden's cleave, slam
  and charge) for the Proving Walk's champion, *The Kynreeve*, and the INTERIM Court lord, *The Kynreeve Castellan*.
  The receipts minted with the relay's key and re-handed at a hello. `RELAY_VERSION` `world195` (`world196` since the merge past COATS1, `world197` since the merge past CHAT-LANG, `world198` since the merge past BAL8, `world199` since the merge past SPAWN-REBIRTH).
- **The call and the step in** (EG9's core): the call said in chat and on the tracker; `/breach` answers it once the
  breach opens (and a Weir Key used while one stands does the same), `/breach rehearse` opens the day's Rehearsal,
  `/breach home` takes a Redoubt's way home.
- **The halls** (EG10's core): `world/egHall.js` - a circle is one made level, its five halls side by side 500 m apart,
  dressed in the Hour's art; its plates, discs, bands, the Oblivion Caverns passage (a basalt tunnel over a chasm
  crossed on ledges, fire channels, a fire-fall at the lip) and a Rampart's portcullis. `scenes/egSpan.js` - the spans'
  steps (the Unmoored Steps' Drift, Beat, Riser and Crumble, and still slabs and ledges) as moving collider buckets;
  the void casts a body back to the floor it last stood on for a tenth of its health, never below a quarter. The pull
  is a teleport to the next hall's plate under the veil's flash; a new circle steps out and in under the veil.
  `ui/egHud.js` - the tracker: the call, THE COUNT (gold while it holds, red under five minutes), the circle and hall,
  what the stage asks, the company standing.
- **The fights** (EG11's core): `scenes/egFight.js` - the gate's own client pieces about the hall's centre: the foe's
  body (the Warden's sprite at 2.5), its telegraph and the verdict on my feet, its bar and title card; the legion
  through `scenes/gateHost.js` (which gains a `centre`, the court's by default); a Rift-Yard's rifts as the Reckoning's
  crystals; a Rampart's vents, told a second before they erupt.
- **The Redoubt and the ways out** (EG12's core): the Court's fall takes the circle's Redoubt for every earner (a share
  of its damage, or a part in three of its halls); the company is healed; the way home stands at the Court's heart (the
  level's exit door, with the Portal Stone's portal) - pressed once it asks, again it walks. The end, a fall, a closed
  socket and the way home each walk the member out to where it answered from; a death wakes there.
- **The receipts carried** (`scenes/egClient.js`): kept on the device until the service has counted them.

**Where EG-PLAY departs from this page** (each to be closed by the slice named):

1. No arch: the call and `/breach` are the door (EG9's arch pool, beacon, start window and Wager).
2. THE SWAP is a circle a level: the five halls stand in one made level and the pull is a teleport under the veil's
   flash; a new circle is a new level, built as the Hour's is entered (EG10's build during the closing).
3. The Hour's art dresses the Spire (EG16's white marble and gold).
4. The key wears DFU's Talisman picture (EG1's registry, EG2's art).
5. The Court's lord is INTERIM - *The Kynreeve Castellan* on the champion's kit (EG13's lords).
6. Not built: the recall and the witness view, Vestiges, decrees, twists, caches, Cantrips, lumen and the Sutler, the
   Gold Run, THE FAIR TRAIL and the body count in `eg:` rooms, THE COVENANT'S PATIENCE, the company's word, THE POTION
   LAW, the technique refusal and the jump buffer, the score, the recap, the boards and the honours, span Harriers.
7. The hub keeps no receipts: the breach's room re-hands them at a hello and the client keeps them until counted.
8. The `e1` receipt's kind rides `q`, not `k`; the order's `wg` is omitted.
9. A death in the Spire costs the gold any death does (DEATH-PENALTY is not exempted: the respawn's penalty line is
   another arc's quoted text, and the exemption is EG10's).
10. A member answers from open ground; indoors the answer is refused (*Answer from open ground.*).
11. A Redoubt's gold is the INT5 spoils budget's fill, not the week's pay (EG14).
12. A member the room already counts (a reload, a new circle's room) is never asked to spend its admission again.

**The four hosts.**

- `src/scenes/world.js` - WIRED: the client built online (`createEgClient`), the breach's words on the presence
  socket and the hub's, the room key, `egFrame` every online frame, the key's opener, `/breach`, the respawn's branch
  for a death in the Spire, the Levitate ward (a second one beside the one - `characters/playerEntity.js`
  `registerSpireLevitateWard`), the court's law (no regeneration), the companions kept out, Mark, Recall and `/unstuck`
  refused, the hosts' `eg*` seams, and a gate or Hour claim's Weir Key restacked.
- `src/scenes/worldModes.js` - WIRED: `enterEgHall`, `standEgHall`, `egPlace`, `egLeave`, `egHallReturn`,
  `egHallBreach`, `egHallCircle`; the spans before the motor and the void's cast-back; the Spire's light, haze, lamps and
  sky; the portcullises; the gate's six combat seams routed to the hall's fight inside a hall; the room identity; the
  way home's press; arrival facing down the course.
- `src/scenes/dungeonContext.js` - WIRED: the circle's flag; no veteran placed; no map, rest or save; a detached
  automap; the spans' set and its ride.
- `src/scenes/exterior.js` - FLAGGED as section 28 has it: the `?exterior` bench is offline and the key says *The key
  is cold here.*

**Pins.** `test/egplay_law.test.js` (5), `test/egplay_service.test.js` (7), `test/egplay_relay.test.js` (5) and
`test/egplay_client.test.js` (11 - the client played against the relay's real Room, from the key to the Redoubt, the
way home and the next circle). Mutants: `tools/mutants/egplay.json` (20), every one dead. Records of other arcs whose
quoted lines moved, re-aimed by content: the bound list's (`auditrealm`, `cards8`, `loot9`, `portal1`, `wallet1` - 575
joins it), the account version's (`br5`, `crafthold`, `fb1004d_knight_house`, `tech1`, `gatekeys` - acct124, acct116, acct118, acct119, acct121 then acct122 on the branch, renumbered past main's acct116 to acct123 at the merges), the order kinds'
(`guild1c`, `seat2a2`) and the relay version's (`soc1` - world195, then world196 past COATS1, then world197 past CHAT-LANG, then world198 past BAL8, then world199 past SPAWN-REBIRTH). The Ledger: section A's ELITE-GATES row
(`01-Overview/Port-Ledger.md`), naming every file.

### EG-FULL, LAYER ONE - 2026-10-11 (Mac: "I said I want everything") - THE SPIRE'S OWN FIGHT, THE RUN, THE WITNESS

**What this is, said plainly.** EG-PLAY was the smallest breach that plays. EG-FULL builds the rest of the page, in
layers. Layer one is CODE for EG4's widened Orrery, EG5 and EG7's depth law, EG11 and EG13's fights (the hall kinds,
variants and twists, the legion's sixteen kinds, all thirteen lords and the champions), EG12's Redoubt systems and the
run (Vestiges, Masteries, Accords, decrees, the company's word, the recall, the Memento and the witness, caches,
Cantrips, lumen and the Sutler, Reliquaries, the respite, the Surplus, pings) and THE POTION LAW. It retires the gate's
borrowed host and attacks for the Spire's own words. What layer one leaves is listed below, and the later layers build it.

**What shipped, by piece.**

- **The law** (`net/egLaw.js`, EG_SPEC 2). The four bands by circle (the Galleries, the Soul Cairn, the Shade
  Perilous, the Havoc Wellhead) and their Brinks at circles 6, 11 and 16. The full rhythm: a fight, the traverse (the
  Span, or from circle 3 the Deepway one time in three), the mixed (the Proving Walk or the Athenaeum), a second fight,
  the Court. The five Yard and five Rampart variants are unlocked by band, and a variant is never one of its kind's last
  min(2, unlocked - 1) draws. The nine twists fall about one hall in four, never on a Court or a Brink, never two
  running, and at most one Bargain a circle. The lords are drawn by band (the band's own at weight 2, earlier bands' at
  1), with Grath first, a Valkynaz every fifth Court, and never one of the last drawn. The nineteen decrees come in five
  families, with the week's Proclamation. The span decrees fold into the ground as `geo` (Gale-Swept's rank plus three
  times Crumbling Halls'), and their sections are never dropped for room: the runs before them shorten. Each band's span
  pieces include the Gust, Rail, Pendulum, Vent and Drop. Every lord's ground is laid: Grath's isles, the discs, the
  rotunda, the crypt, the twin courts, the soul bridge, the glade, the vault, the forge, the perches and the pit. The
  generator calls integers alone: `lawIsqrt` replaced the two `Math.hypot` calls it had grown, so the spec stays the same
  bytes on every machine.
- **THE SHAPES** (`net/egShape.js`, which imports nothing). The six FULL stamps (disc, lane, cone, ring, the whole floor,
  outside the havens), bounded on the wire. THE WIND-UP FLOOR at THE ESCAPE BUILD's run (pinned to the motor's
  `runSpeed(40, 20)`) lengthens a wind-up and never shortens it; a CHECK keeps its own. Also here: THE WIDTH RULE, the
  verdict on the struck member's screen, THE UNION FLOOR in time (a blow that would leave a member no floor is held)
  and THE TELEGRAPH BUDGET.
- **The fight** (`net/egBodies.js`, `net/egLegion.js`, `net/egLords.js`). Generic bodies: role 0 a lord, 1 an add, 2 an
  object. Blows carry their stamps, tethers and marks; zones are burn, void, soul and haven. The legion has sixteen
  kinds with their behaviours, affixes and decrees. Every lord and champion has a kit: phases, errands, fury, the
  Covenant's Patience, and a lord on a borrowed ground keeps its main disc and spots. Health is seconds of reference
  damage, shared over a team, times the depth.
- **The run** (`net/egVestige.js`, `net/egRun.js`). Twenty-seven Vestiges in families, five Masteries, the Accords and the
  capstones, with the declared factor capped. The rest's offer goes to each member alone (`to`), and the Surplus's card
  or reroll likewise. Also in the run: the company's word (asks, votes and tallies), the next circle's decrees asked by
  family, the Ready and the respite, the Bargain, caches and gifts, Cantrips, lumen and the Sutler, and the relay's
  Vestiges on a blow.
- **The director** (`net/egBrain.js`, brain law 2). Every kind, variant and twist stood and closed, and the doors.
  A fall is a witness's: final with no recall in hand or at the second fall, a Memento laid otherwise, and the member's
  own `fell` word counts like the pose's `dd`. The Redoubt sequence: the recalls at 4.5 s, then at 6 s the window with
  the heal, the offers, the decree asks and the Ready. Forsaking, the way home after the window, and the Gold Run.
- **The wire and the room** (`net/wire.js`, `server/src/index.js`). A member's words: `hit` (by body number), `pick`,
  `surplus`, `vote`, `cant`, `buy`, `lping`, `ping`, `bequest`, `forsake`, `pz` and `fell`. The fight's words run from
  `efs` to `erail`, and the run's from `offer` to `eheal`. A frame with `to` goes to that member's sockets alone. A
  reloaded member is told any open offer and the company's asks.
- **The client** (`scenes/egClient.js`, `scenes/egFight.js`, `net/egLink.js`, `ui/egHud.js`, `world/egHall.js`,
  `systems/spireKit.js`). The fight draws bodies as billboards, struck objects as crystals, and blows, zones and tethers
  in the telegraph pass. It judges each blow on its own screen and applies the push, the drain, burn ticks and void
  cast-backs.
  - THE WITNESS (section 16.5): the death save (`registerPlayerDeathSave`) turns a killing blow into a fall. The room is
    told once, the damage door's mod answers 0, and the body is put away and held under the hall. The eye rides behind a
    living companion (Q and E change whom), and the recall's word stands the member back at its share of their health.
  - THE PANEL: the Vestige cards and the company's word, by key (1-6, Y and N) or by `/breach pick`, `vote`, `cant`,
    `buy`, `surplus`, `ping`, `watch`, `forsake` and `bequest`.
  - THE POTION LAW: two restoring potions a hall, through `useItem.js`'s potion arm. The bottle is kept on a refusal, and
    the count refills at each wake and at the rest.
  - The push follows the Steps' breath: the collider's own move, no edge stop, Iron Footing taking its share. The cage
    holds the motor, and a challenge's ring keeps the challenged inside and everyone else out.
  - The room's heals (a lash never past 1), THE RECAP, the HUD's run line, the decrees, the marks and the potion pip.

**Where layer one departs from this page** (each to be closed by the layer named):

1. The new span pieces (the Gust, the Rail, the Pendulum, the Vent, the Drop) are laid by the law and stand as still
   slabs on the client. Their motion, and the timed solver that proves a span's timing, are layer two's (EG-D). The
   fragment kits beyond the Oblivion Caverns passage are named by band but drawn as the passage (EG-D, with the meshKit
   and the pseudo-archives).
2. Grath's isles are a fight floor; they do not yet fall (EG-D).
3. The economy is EG-PLAY's: Redoubt receipts and the INT5 spoils budget. Spoils, the Panoply, the lords' arms and cards,
   honours and boards, the herald, the week's pay and the Wager are layer three's (EG-E).
4. There is still no arch: the call and `/breach` are the door (layer four, EG-F).
5. The score, the mix, the band art (38231-38279), the arrival card, first-time lines, accessibility settings and
   touch and pad are layer five's (EG-G). The HUD, the panel and the recap are DOM text.
6. `madeLevelOf` and `MADE_LEVEL_RULES` as one law, the jump buffer, the technique refusal, the slowfall ban,
   AvoidDeath refused, THE FAIR TRAIL, HOLD and DRAIN, the clock correction and the ridden poses are layer six's (EG-H).
   THE POTION LAW, the Levitate ward and the witness's saves are wired at their own doors for now.
7. Nothing here has run in a browser. There is no Daggerfall data in the build container, so every client piece is
   tested headless against the relay's real Room and the director's own frames. The relay side is tested by an
   auto-player that walks and fights whole breaches, and none of it is played by hand.

**The four hosts.** `src/scenes/world.js` WIRED: the fight's new deps (the push, the cage, the ring, a void zone's
cost, companions' poses by account), the witness's eye at the camera override, the panel's keys under KEY-BOOT's latch,
the death save, the damage mod and THE POTION LAW's registration. `src/scenes/worldModes.js` WIRED: a circle built at
its `geo`, and the span ride skipped for a witness. `src/scenes/dungeonContext.js` WIRED: the spans built at the
circle's `geo`. `src/scenes/exterior.js`: unchanged (offline, as section 28 has it).

**Pins.** `test/egfull_law.test.js` (9), `test/egfull_relay.test.js` (5 - six circles played, every lord fought to its
fall, the fall and the recall, the Redoubt's choices, forsaking) and `test/egfull_client.test.js` (5). The EG-PLAY pins
were rewritten to the Spire's own words: `test/egplay_law.test.js`, `test/egplay_relay.test.js` and
`test/egplay_client.test.js`. Mutants: `tools/mutants/egfull.json` (31). Records whose quoted lines moved were re-aimed
by content: `egplay`, `sd6a` and `sd18a` (the Orrery widened with defaults equal to the Hour's bytes). `RELAY_VERSION`
stays `world195` (`world196` since the merge past COATS1, `world197` past CHAT-LANG, `world198` past BAL8, `world199` past SPAWN-REBIRTH), unshipped, with its hash and graph recomputed. The account Worker bundles `net/egShape.js` through the
wire, so `account-deploy.yml` lists it. A real defect was found and fixed on the way: the rest's offers were fanned to the
whole company, so every screen showed the last member's cards.

### EG-FULL, LAYER TWO (first part) - 2026-10-11 - THE PIECES MOVE, THE TIMED SOLVER

Closes layer one's first departure for the pieces.

- **The one law** (`net/egSpanLaw.js`, in the relay bundle, importing nothing). Every piece on the shared clock (the
  anchored clock's seconds, which the relay's milliseconds equal): `egPieceAt` (a Drift across, a Rail along, a Beat on
  the Steps' cycle), `egPendAt` and `egPendHits` (a Pendulum's weight over the middle of the gap before its step,
  `EG_PEND_REACH` 2.6 m either side), and `egVentState` and `egInVentDisc` (a Vent's disc, `EG_VENT_R` 1.5 m, told over
  its last `EG_VENT_TELL_S` 1.0 s and erupting `EG_VENT_FIRE_S` 0.5 s at the Rampart's `EG_VENT_PCT`). Every step now
  carries the `gap` before it (`EG_SPEC` 3).
- **THE TIMED SOLVER** (section 10.5). THE SPAN BUILD's running jump from each piece's far edge to the next, over both
  pieces' positions at the launch and the landing. A pair must have a window of `EG_WINDOW_MIN` 0.5 s in every 12 s and
  never wait more than `EG_WAIT_MAX` 4 s. Also checked: a Pendulum's gap clear for `EG_PEND_CLEAR_MIN` 0.8 s, a Crumble
  left inside its delay, a Rail's travel never closing on its neighbours (`EG_RAIL_CLEAR`), a Vent's platform at least
  4 m, a Drop's landing at least 6 m. `egHallOf` re-lays a refused course from the next sub-seed, at most
  `EG_RELAY_MAX` 8 times, then lays it from the band's first two pieces alone; the spec's `laid` says how often. Over 40
  seeds, 20 circles and three grounds, 271 of 7,560 courses were re-laid and none fell to the last resort.
- **The reach is measured, never guessed.** The page's span build crosses 3.2 m in SD7b's real-motor run. The motor's
  closed form at 95%, as SD7a takes it, gave 2.43 m, which would have refused every honest course. So the reach is the
  closed form plus the capsule over both edges, a drop's gain held to `EG_DROP_GAIN` 0.45 m a metre. That is 3.26 m on
  the flat, where the real motor clears 3.44 m. `test/egfull_span.test.js` crosses every reach the solver allows (level,
  a metre down, a Drop's 4.5 m, 0.4 m up) with the real `PlayerMotor`, so the solver can never be generous.
- **On the screen** (`scenes/egSpan.js`):
  - a Rail travels along the course and carries its rider;
  - a Pendulum's brass weight swings on its chain, and a touch is a cast-back unless the member has Iron Footing III
    (`systems/spireKit.js` `spireFooting`, registered from the breach's client);
  - a Gust section pushes as the Steps' breath does (`world/sdSteps.js` `gustAt`), Iron Footing taking its share;
  - a Drop's landing stands walled on its far side and flanks to `EG_DROP_WALL_H` 7.5 m, so a body that carries too
    far drops onto it.
- **The place pass** (`scenes/egFight.js`), on every screen alike: a span Vent's ring closing in fire and its eruption
  judged on the member's feet once a cycle; a Pendulum's lane over its gap, white and brightening over its last
  0.8 s.
- **A regression closed.** Layer one's rewrite of the fight had dropped EG-PLAY's Rampart vents, which are told 1.0 s and
  judged on the member's feet. The place pass draws and judges them again.

- **The Rampart's ground, closed.** Layer one had laid the Falling Wall and the Forge Bridge in the law
  (`egWallFallenZ`, the `belt` band) but nothing acted on them. Now a Falling Wall's walkway stands as `EG_WALL_SEG_M`
  2 m segments (`world/egHall.js` `egWallBand` leaves it out of the circle's mesh and collider). They fall behind the
  company from 20 s after the hall's wake at 1.5 m/s (`systems/spireKit.js` `spireWake`, registered from the breach's
  client), and a member caught is cast to the nearest segment wholly ahead of the edge. A Forge Bridge's walkway carries
  whoever stands on it toward the arrival plate at `EG_BELT_MPS` 1.0 m/s.

**What EG-D still owes**: the fragment kits beyond the Oblivion Caverns passage (the Ossuary, the Gloam Thicket, the
Forge Gut and the rest of section 11.2) with their signature hazards; the set-piece passages; THE FORK (the High Road and
the Low Road); the fragment law record (`net/egFragLaw.js`); engines, alcoves and the Annals; Grath's falling isles. Also
the solver's median check.

**Pins.** `test/egfull_span.test.js` (6) and `tools/mutants/egspan.json` (19, every one dead). `RELAY_VERSION` stays
`world196` (renumbered past main's COATS1 `world195` at the merge; `world197` past CHAT-LANG's `world196` at the next, `world198` past BAL8's `world197` at a later one, `world199` past SPAWN-REBIRTH's `world198` at the next), unshipped, rehashed with `net/egSpanLaw.js` in its graph.

### EG-FULL, LAYER THREE - 2026-10-11 - THE FRAGMENTS, THE FORK, THE SET PIECES

Closes the fragments EG-D owed: section 11's library, THE FORK, the set pieces, the engines, the alcoves, the Annals,
Grath's falling isles, and the solver's median check.

- **The fragments' law** (`net/egFragLaw.js`, in the relay bundle; it imports `egShape.js` and `egSpanLaw.js`). The ten
  of section 11.2 in `EG_FRAGS`, each with its band, classes, reverb, light, engine and signature. `egFragPassage`,
  `egFragChamber` and `egSetPiece` plan a fragment in whole centimetres and milliseconds off the hall's own die, with no
  transcendental in the generator (pinned by a source sweep). `net/egLaw.js` lays the plan into the spec: `caves` (each
  with its kit, its far floor's height `yB`, `open` for a fragment with no walls), `frags`, `hazards`, `ramps`,
  `engines`, `alcoves`, `vignettes`, `lights`, `tube` and `fork` (`EG_SPEC` 4).
- **The passages, kit by kit**:
  - the Oblivion Caverns (a fire fall at the chasm's lip, a magma surge along the far floor, falling basalt on the near
    one, three ledges across the chasm);
  - the Fallen Stacks (bookcase ledges; THE CASCADE across both floors);
  - the Broken Colonnade (open over the void; two Drums rolling along the course);
  - the Ossuary (three Bone bridges; soul-wisps over its floors);
  - the Mist Stair (four flights down, each under a metre; mist surges);
  - the Gloam Thicket (four Moon branches under a walking train of moonbeams);
  - the Forge Gut (two conveyors; hammer drops on both floors);
  - the Oblivion Caverns, deep (wider, two fire falls, two surges).
  A passage's floors are its fight floors (section 11.1), so its Lurkers and a Low Road's foes fight there.
- **The hazards on the shared clock** (`egHazardParts`, `egHazardBites`):
  - a fire fall burns 2 s of every 5, a white shimmer the 1 s before, 15% fire, judged wherever a body stands in it;
  - a surge's 4 m lane, told 1.0 s, 20% fire;
  - the basalt's disc r 2.5, told 1.2 s;
  - the cascade's 4 m lanes told 1.2 s, 1.5 s apart;
  - the hammers' disc r 3, told 1.4 s;
  - the Eclipse every 40 s, told 6 s, 30% outside its three moon-shafts (r 3, walking 1.5 m/s);
  - the tide over a chamber's low floor, 15 s of every 60, told 5 s, ticking 10% a second;
  - a soul-wisp drains a member within 3 m by 3% a second, letting go at 6 m or after 4 s, then not again for 6 s.
  `egHazardLawful` holds every laid hazard to THE WIDTH RULE and THE WIND-UP FLOOR, and the hazards' clocks are the
  same at every depth.
- **The fragments' own pieces** (`net/egSpanLaw.js`):
  - Moon: solid while a beam lies on it, the beams walking at `EG_MOON_MPS` 2.5 m/s, one every 4 s, each lit 3.5 m
    either side;
  - Drum: rolling out and back at a fixed `EG_DRUM_MPS` 2.0 m/s, ridden as a Rail;
  - Bone: the Crumble's law (`EG_CRUMBLE_KINDS`);
  - Sink: sinks 0.5 m/s under a foot and is gone 3 m down. The jump off it is taken 0.5 m low, and a wait on it is
    never longer than 2 s.
- **The solver, deeper**:
  - THE MEDIAN (`egRoadCross`): a road's median crossing over start phases is at most 1.6 times its fastest.
  - THE GROUND AFTER EACH RUN: each step that ends a run carries `after`, the gap to the next still ground, and the
    solver jumps that real gap. Before this, it had assumed the ground began at the step's edge.
  - Proofs run road by road; an alcove's side way (road 2) is never asked of anyone.
  - Over 5 seeds, 20 circles and three grounds, 47 of 1,500 courses were re-laid and none fell back.
- **THE FORK** (section 11.4). From circle 2 every span that carries no set piece forks at an island:
  - **The High Road** (road 0) runs two sections, the span decrees' among them. Its Reliquary cache stands on an island
    at its hardest point, and it meets the end plate's height by one Drop.
  - **The Low Road** (road 1) bridges `EG_LOW_X_CM` 15 m across, drops 4.5 m and runs through a passage of the band's
    kit. It passes its Battlemage's niche (15% once, a shard each, and a Memento niche) and runs still ground to its
    bridge onto the plate.
  - The spec's `fork` carries each road's fastest crossing (`hi`, `lo`). A door opened from the High Road while a
    member is still on the Low Road waits their difference.
- **The set pieces** (section 11.3; `egSetPieceOf`, `egTubeCircle`):
  - the Collapsing Tube, in the Galleries' first span from circle 3. It is 60-80 m long and its floor and vault fall at
    `EG_TUBE_MPS` 4.0 m/s from 18 s after the wake. THE SPAN BUILD outruns it with 37% to spare, and a member caught
    is cast forward to the nearest standing segment ahead;
  - the Sinking Stair, the Moon Path and the Forge Line (three conveyors under hammers), in the Brinks into the Cairn,
    the Shade and the Wellhead.
- **The chambers** (section 11.4). A yard or proving court in a chamber from circle 2 takes its band's chamber kit and
  names its play:
  - a second floor 3-4 m up, its stair a ramp;
  - a chokepoint arch 6 m wide;
  - the channels surging in thirds every 20 s;
  - an engine.
  It then carries its kit's signature: the basalt, the wisp, the hammers, the Eclipse, the tide (three dry floors, no
  point of the low floor more than 24 m from a stair), or the Clan Pit's horn. The Athenaeum and the Scriptorium stay
  plain walls.
- **The relay's half** (`net/egBrain.js`):
  - **Engines** (`use`, within 2 m, once in 30 s; the Shelf once): the Sluice, the Shelf and the Drop-Hammer tell a
    blow of the place 1.5 s (20% to a member caught) and take 40-50% from the adds caught. The Drop-Hammer stuns a lord
    once a phase. The Soul-Bell stuns Wraiths and Binders 4 s, the Moon-Mirror the Divers.
  - **The alcoves.** A seam alcove's false wall is a struck object, `fwall`, that falls to one blow. Behind it, each
    member takes its lumen, its shard or a page of the Annals, once.
  - **THE FORK's half**: the High Road's cache, the Low Road's niche, and the Low Road's two Harriers rising as the
    first member takes it.
  - **The Clan Pit's Honour Horn**, 20 s after the wake and again 40 s after each call. Answered alone, every member
    gets a Reliquary. Fouled, Ashfall falls in the Pit for the rest of the hall: fire pools every 6 s.
  - **The fragments' Lurkers**, dormant in the walls: the Low Road's every one, one a passage from circle 3, one a
    chamber from circle 4.
  - **A lord's page.** Its first fall adds its page of the Annals to every living member at the Redoubt.
- **The Annals of 3E 398** (`net/egAnnals.js`): thirty pages of two sentences each, seventeen found behind the false
  walls and thirteen the lords'.
- **On the screen**:
  - `world/egHall.js`: the passages' walls and vaults in their kit's dress, each wall broken at its alcove with the
    niche floored behind it; the Colonnade open; the Gloam Thicket under the sky; the chambers' arches, stairs and
    vignettes; each fragment's lights.
  - `scenes/egSpan.js`:
    - the new pieces;
    - the Collapsing Tube's floor and vault as segments;
    - Grath's islands as buckets, shaking while cracked and sinking when fallen as the relay's `eob` says
      (`systems/spireKit.js` `spireObjs`), a cast-back from a fallen one landing on a standing one;
    - the false walls standing until they fall;
    - the activation ray's Orrery handles and engines (`spireAct`).
  - `scenes/egFight.js`: every hazard drawn and judged on the member's own feet once a part.
  - `scenes/egClient.js`: `/breach use` and `/breach annals`.
- **Fixed on the way**:
  - **the Athenaeum could not be solved.** No client ever sent the Orrery's `pz`; the stones now stand in the
    activation ray and a press sends the turn;
  - **a Drop's far wall closed the road** (layer two): it was walled whole across, and now keeps a doorway 2.4 m wide
    and 3.0 m high on the course's line;
  - **the Colossus's forge chamber stood 3 m past the approach's gap.** The solver's real gap after each run found it;
  - **a decree's crumbles climbed back up** after a course that had gone below the plates;
  - **the Forge's hammers were laid with no reach**, caught by the hazard law's own test.

**Departures, said plainly** (each still owed to its slice):
- **The relay half's own departures:**
  - a code-built fragment's law lives in the spec's own fields, not a separate record with `sockets`, polygon `floors` and a
    legion `graph` (an authored fragment's law is that record since EG6c - `net/egFragLaw.js` `egFragRecordFault` - but no
    hall lays one yet). A passage's mouth and exit are its `z0` and `z1`; its floors are rectangles;
  - the Sluice takes its share at once rather than flooding a channel for 6 s;
  - the Moon-Mirror blinds the Divers but does not yet light a branch;
  - a Low Road member's closing waits the roads' difference only when the High Road opened the door;
  - the Annals are kept for the breach. The account's `players.eg_annals` comes with EG-E.
- **The look:**
  - the dress is the Hour's records in each kit's shapes; the band art is EG-G's;
  - the mist is not drawn;
  - the slag's crust (law kind `slag`) is laid by no kit yet.
- **Still owed by EG-D:**
  - the moving pieces' instanced pass, the cull and the measured budgets;
  - `world/meshKit.js` and `world/pseudoArchives.js`;
  - the authored hero fragments laid into the halls (EG6c built their bake, its reader, their registries and a reference
    fragment - its record, below);

**Pins.**
- `test/egfrag_law.test.js` (9), `test/egfrag_relay.test.js` (5), `test/egfrag_client.test.js` (6).
- `tools/mutants/egfrag.json` (51, every one dead). Re-aimed and judged again: `egfull.json` (31), `egspan.json` (19)
  and `egplay.json` (20), every one dead.
- `RELAY_VERSION` `world197` (renumbered past main's CHAT-LANG `world196` at this layer's merge), unshipped, rehashed with
  `net/egFragLaw.js` and `net/egAnnals.js` in its graph.

### EG-E (first part) - 2026-10-12 - THE LORDS' FEATS

The economy layer's first piece, the one the relay must judge: **FEATS OF THE SPIRE** (section 19), in `net/egFeats.js`
(relay bundle, importing nothing).
- **Three feats a lord**:
  - **Unbroken**: no member fell in the Court;
  - **Swift**: felled within `EG_FEAT_SWIFT_MS` (3 minutes) of its wake;
  - **its own signature**, read off the Court's beats as the relay counts them (`tallySays` in `net/egBrain.js`, over
    the lords' step and the members' blows). Grath must be Scorched twice; the Spellmaster's Examinations passed with
    none failed; two of the Armsmaster's Challenges met; three of Ilthys' banners broken; the Cairn-Keeper laid bare
    twice; the Twin Lords falling within 3 s of each other; two of Morvayn's soul-chainings endured; the Mother of
    Dusk dragged down twice; two Blood Tethers broken; two of Seyth's Eclipses endured; the Colossus into its
    Breakdown with no heart relit; the Wyrm landed twice; Garoth felled before the Covenant pressed.
- **On the receipt.** At a Redoubt each earner's `w` receipt names the lord (`lk`) and its feats (`ft`, three bits).
  `net/egReceipt.js` refuses either out of shape. A band's lords' feats, all held, are its Master
  (`egBandMastered`): the title is the service's, with the rest of the economy.
- **Departure.** The page's examples (Grath with no member caught by a burning bridge; the Examination with no rune
  missed at *n* = 8) need the relay to know who a place's blow caught, which it does not yet keep. Each signature is a
  beat the relay already counts.

**Pins.** `test/egeco_feats.test.js` (2) and `tools/mutants/egeco.json` (6, every one dead). `RELAY_VERSION` `world197`,
rehashed with `net/egFeats.js` in its graph.

### EG-H1 - 2026-10-12 - INTEGRITY: WHAT THE RELAY JUDGES

EG8d, built (Mac: "I said I want everything"), and EG14's `BOSS_BODY` on in `eg:` rooms after it. It closes EG-PLAY's
departure 6 for THE FAIR TRAIL and the body count in `eg:` rooms, and layer one's departure 6 for THE FAIR TRAIL, the
clock's correction and the ridden poses (HOLD and DRAIN are the durability slice's).

**What shipped, by piece.**

- **THE TIME LAW** (`net/egFair.js` `egPoseShared`, new, in the relay bundle). Every `eg:` pose is placed at its shared
  time on its socket's trail (`[t, x, y, z, h]`, the hall's own frame): its `ts` unwrapped mod `POSE_TS_MOD`, plus the
  least `arrival - ts` over its last 32 poses, less the one-way delay the member's corrected clock says with its `clk`
  ping. A pose is never later than it arrived, never before its socket's last, and never more than `EG_TS_LAG_MAX_MS`
  (300 ms) before it arrived. A stamp that runs backwards judges nothing. The judge's readers (`egTrailAt`,
  `egTrailAfter`, `egTrailNear`, `egTrailReady`) take where a body stood at a landing from the last pose sent at or
  before it, and after it from the first pose sent after it, waited for up to `EG_POSE_WAIT_MS` (800 ms). A body with no
  pose within `EG_POSE_NEAR_MS` (300 ms) of the landing is not counted. Pinned in the room: a dodge sent 50 ms before
  the landing at a 300 ms round trip is never counted; the same dodge from a clock that said no delay is.
- **THE CLOCK CORRECTED** (`net/egClock.js`, new, the client's). In the Spire the client pings the room (`clk`) five
  times 250 ms apart, again every 30 s. Each answer is a sample: the relay's `now` less the midpoint of the ping's send
  and the answer's arrival. The offset is their median; the delay is half the median round trip, said with each later
  ping. `scenes/egClient.js` reads the shared clock through it (`sharedNow`); the breach's link and its fight run on it
  (`scenes/egFight.js` takes the link's clock where it keeps one). The room answers a ping at once, to its socket alone.
- **THE FAIR TRAIL** (`spanFair` - `egFairPose`, fed by `net/egBrain.js` `egPoseIn` on every `eg:` pose). It is an
  online accumulator per member, a hall, a life:
  - support: a disc, a band, a lane or a ramp of the spec at its height, a piece's top at its clock (`egPieceAt`) with
    the capsule and 0.15 s of its travel, an alcove, a ride its piece holds, or a climb's hold (`cl`) beside a floor;
  - speed: over stretches of 0.5 s, THE FAST BUILD's run (`runSpeed(100, 100)` with Fleetfoot III, pinned to the motor)
    times 1.1, plus 4 m/s for a push or a carry, plus 2.5 m for the game's own snaps. A stretch that outruns its whole
    window is judged at once. A cast-back onto still ground behind, or back where the member last stood, is no step;
  - air: an airborne stretch past `EG_AIR_MAX_S` (2.5 s) that is no fall;
  - blindness: a `ts` gap over 0.4 s judges nothing. A crossing more than 30% blind opens no door;
  - the last island: a fair pose on still ground (a plate, an island, a passage's floor, a bridge, a ramp - never the end
    plate) ends the window. The trail begins on the arrival plate, or where a recall stood the member;
  - repeats: a second break in a hall refuses the member's hits for 5 s;
  - the crossing: its time at the end plate, its blind share and its road, against `egCrossMinMs`
    (`egFairMeasure`, kept on the member's record).
  The door of a span, a Brink or the Deepway's way down opens to a fair arrival (`doorOpener`). The same holds for
  `down`, a cache (and so THE GOLD RUN's arrival), the Low Road's niche, a Memento carried and set, the Reliquary Vault and
  the High Road's cache. After the room is woken mid-hall (`egFairWoke`), the first arrival opens the door when no saved
  trail is fair, its measure saying `wake`.
- **ONE JUDGE FOR EVERY SHAPE** (`net/bossRef.js` `judgeShapes`, beside the gate's, the Remnant's and the serpent's). Every
  blow the Spire says carries its FULL stamp, so one judge tests a lane, a cone, a ring, a disc, the whole floor or
  outside the havens. It judges each blow per fight floor (`egFightFloorAt`, section 11.7's band), deep in it (THE WIDTH
  RULE's margin) both before and after the landing on the shared-time trail, each blow once a body. A plain blow's
  share is counted; an element's is seen (the member's save is its own). The hall's own hazards are judged at their
  landing on a fight floor (`judgePlace`): a Rampart's vents, the fragments' live parts aimed at a fight floor, the
  Eclipse. The basalt, the cascade and the hammers count; fire is seen.
- **THE BODY COUNTED, ENFORCED** (`net/egBrain.js` `egCount`, `EG_BODY_ENFORCE`). The Spire enforces whatever the gate's
  `BOSS_BODY` line says, with the hub's depth and pace. The judge's hits, the hazards' and each cast-back (a tenth, never
  below a quarter) are taken off the member's count (`net/bossBody.js` `bodyStruck`) and kept in its census (`cs`).
  A count at nothing is the member's fall: one life, the witness, the Memento, said `bd` to it alone. Its own word
  (`vt`, `egBodyWord`) is believed out of its budget, and the room's heals restore it (`egCountHeals`: a rest whole, a
  Rally, a Mending or a niche healed, the fray's lash never the last, a recall a new life). The client says its body at
  INT15's pace. It hears `bd` as a fall, never a death (`countFell`, the Hour's `bossCountFell`'s twin, through
  `egClient.word`).
- **THE UNION FLOOR, IN TIME** (`net/egFloor.js`, new). `egUnionHolds` moved whole from `net/egShape.js`, where layer one
  had built it, under the page's name. It is widened by the place: a Rampart vent's every eruption and a fragment's live
  parts on a fight floor land in the set beside the blows (`egPlaceLandings`). Pinned: a vent erupting first holds the
  ring that alone would leave a way out.
- **RIDDEN POSES** (`pl` in `net/wire.js` `validPose`; `egRideOf`, `egRideAt`, `egRideHolds`). A pose on a Drift, a Rail
  or a Drum carries `[i, dx, dy, dz]`: the piece and its offset from the piece's top. The relay judges it at the piece's
  clock position at the pose's shared time, its offset held to the piece's top. A screen draws a peer's ride on its piece
  at its own clock (`net/online.js` `rideAt`, set by `egClient`), and lays its own on each pose (`poseRide`).
- **THE FEINT'S CUT, WATCHFIRE'S TELL, THE UNTELL** (`net/egBodies.js`, `net/egLords.js`). Every lord's chosen blow is
  committed `EG_TELL_LEAD_MS` (400 ms) before its wind-up begins. Meanwhile it is told (`tell`) to a Watchfire holder
  and each member within 12 m of it, at the rank's lead (Far Watch's 50 ms more, never past the 400). It is said to all
  with no feint flag. A feint is cut at `EG_FEINT_AT` of its own wind-up (`ecut`, pinned to `ai/tells.js` `TELL.FEINT_AT`).
  A told blow that THE UNION FLOOR holds is untold (`untell`) to each it was told. A screen sounds a blow's WIND only
  past FEINT_AT and uncut, and draws a told blow as a pulsing red outline until its word.

**Fixed on the way.** A wind-up floored by THE WIND-UP FLOOR kept its old landing, so a screen saw only the unfloored
wait. A blow's word now never shows less than its whole wind-up, however late it is said.

**Departures, said plainly.**

1. The time law subtracts the delay the member's own clock says (`h`, at most 300 ms). The page's "`ts` plus the
   socket's offset" alone places a pose at its send time plus the quickest way here, which counts the very dodge the
   page pins. The delay is the member's word, held to the judge's own 300 ms window.
2. A backdated stamp is dropped as out of order, not clamped.
3. Support is the spec's law geometry, never the collider. A belt carries under the push's allowance, and is
   not ridden.
4. The lead is every lord's chosen blow, its fury chain and its extras. The errands' place-tied blows (the Twins'
   Crossing, a Burning Perch) and every CHECK keep their own time; the legion's and the place's blows are never told.
   A tell goes at the beat its lead comes due, and its `sh` lets a screen draw it from the lead.
5. The fight's words keep layer one's `e` prefix: the page's `{k:'cut', i}` is `ecut`. `tell` and `untell` keep the
   page's names.
6. The span's own Pendulums and Vents stand on traversal ground no aimed blow reaches, so they share no union set.
7. A plain blow's whole `p` is counted, its points never.
8. `bd` is said once, never told again (AUDIT INT11's `bodyTellOwed` is the three game-held fights'). A breach's fall
   is the director's own (`egFall`): the company (`co`) it sends carries it, and a screen that missed `bd` enters its
   witness from its own record there. `int_lane3_audit`'s pin of the body's word bucket counts four rooms now.

**The four hosts.**

- `src/scenes/world.js` - FLAGGED, not wired by this slice. `bd` needs no host: it reaches `egClient.word` through
  `online.onEg`.
- `src/scenes/worldModes.js`, `src/scenes/dungeonContext.js` - unchanged.
- `src/scenes/exterior.js` - unchanged (offline, section 28).

**Pins.**

- `test/egint_relay.test.js` (11) and `test/egint_client.test.js` (5).
- `tools/mutants/egint.json` (64, every one dead).
- Moved: `egplay_relay`'s `EG_KINDS` (`vt`, `clk`), and its door and `egplay_client`'s now walked to (THE FAIR TRAIL
  refuses a teleport); `egfull_law` imports the union floor from `net/egFloor.js`; `egfull.json`'s union mutant
  re-aimed there, and `egfrag.json`'s High Road cache re-aimed by content (the fair trail's ask on its line) - both
  judged again, both dead. `int_lane3_audit`'s count of the rooms that keep a body's word on its own bucket: four.
- `RELAY_VERSION` `world197`, rehashed with `net/egFair.js` and `net/egFloor.js` in its graph.
### EG-H3 - 2026-10-12 - THE BOSS SEAM, THE COURSE AS DATA, THE SWAP'S BUILD

EG3, EG4 and EG10's THE SWAP, built (Mac: "I said I want everything"). The relay's three bosses now run through one
contract, the Unmoored Steps' course is data that every reader takes, the Hour and the Spire keep one platform clock and
one Orrery judge, and a new circle is stood in place from a level built while the Court rests.

**What shipped, by piece.**

- **THE BOSS SEAM** (`net/bossSeam.js`, in the relay bundle). The contract is section 13.1's seven members: `new`,
  `join`, `hit`, `step`, `stateOf`, `judge` and `earned`. `bossSeam(name, members)` refuses a boss that lacks one and
  carries nothing else. `GATE_SEAM`, `SD_SEAM` and `SERPENT_SEAM` re-plug the Warden, the Brass Remnant and the Sea
  Serpent.
  - Where a brain's shape already was the contract's, the member IS the brain's own function (the same reference).
  - Where it was not, a thin map hands the brain exactly the arguments the host handed it before: the births (`new`
    takes the brain's own birth record), the gate's and the serpent's refusals (`o.admits`, the serpent's `o.hl` and
    `o.near`), and the serpent's zone (`o.z`) and a hand's own weapons (the blow's kind 1).
  - `server/src/index.js` calls every boss's birth, join, blow, beat, state, judge and earning through its seam.
- **THE GOLDEN FRAMES** (`test/egseam_law.test.js`). A gate's court, an Abyss Dungeon's realm, its Orrery and a
  serpent's cell are played through the real Room, on a seeded clock and a seeded die, with the count enforced. Every
  word each says is hashed whole. The four hashes were taken on the tree before the seam (4f0e71965) and stand
  unchanged after it.
- **THE TRAILS KEEP Y.** The relay's `_trailOf` hands its judges `[t, x, z, y]`: the height follows the frame's two, so
  `posAt` and `posAfter` read what they read before. `posYAt` (`net/bossRef.js`) reads the height where a body stood,
  for section 11.7's per-floor judge.
- **THE COURSE AS DATA** (EG4).
  - `courseOf(spec)` (`net/egSpanLaw.js`) lays a course record, `{ steps, checkpoints, end }`, the Steps' one step
    shape, from sections of pieces: a gap, a size, a riser's rise, a checkpoint after its section, a descent to nought.
  - The Hour's course is `SD_COURSE = courseOf(SD_COURSE_SPEC)` (`world/sdSteps.js`), byte for byte the course
    `layCourse` froze at import. `SD_STEPS_COURSE`, `SD_CHECKPOINTS` and `SD_COURSE_END` are its fields.
  - Every reader takes a course, the Hour's by default:
    - the ghosts (`sdGhostStepsOf`, `sdGhostVertices`, `SdStepsPass`). The pass's uniform count is now a maximum,
      `SD_GHOSTS_MAX` (the Hour's fifteen), and a course with more draws its first fifteen;
    - the waystones (`sdWaystonesOf`) and the vane (`sdVaneAt`);
    - the checkpoints' islands and floors and the breath (`buildChecksModel`, `checkFloorTris`, `buildBreathModel`);
    - the rewind's edges and eye (`sdRewindEdgesOf`, `sdCastBackSeen`, `createSdFx`'s `course`);
    - the hang (`sdHangIslandsOf`, `buildHangModel`'s `islands`, `createSdHang`'s `course`);
    - `spanAt`, `inBreath`, `castBackTo`, the riders (`createSdSteps`'s `course`) and `abyssLab`.
  - The record's byte-for-byte pin hashes the course and every reader's output, taken before.
- **THE PLATFORM CLOCK, ONE HOME** (section 29). `stepAt`, `beatStands`, `beatBlinks` and `beatWarned` moved whole into
  `net/egSpanLaw.js`, on the two laws the Spire's pieces already moved by: `egDriftDx` (a Drift's swing) and `egBeatAt`
  (a Beat's place in its cycle). `egPieceAt` reads the same two. The Beat's blink joined the Beat's and the Crumble's
  numbers there (`EG_BEAT_BLINK_S`), and `world/sdSteps.js` re-exports all of them as it always named them.
- **THE ORRERY'S ONE JUDGE.** `orreryJudge` (`net/sdBrain.js`) is the realm's judge, extracted whole: the settle, the
  Concord, THE STONES' RIGHTS (a turner held is told to wait), and the turn and its turner counted by the road. The
  Hour's realm (`_sdTurn`) and the Spire's Athenaeum (`net/egBrain.js`'s `pz`, with no rights) both judge by it. The
  Hour's every hall word is pinned by the golden Orrery. `orreryOf`'s widening was layer one's.
- **THE SWAP'S BUILD** (EG10).
  - `world/egCircleParts.js` builds a circle's made level apart from the screen: its halls' mesh, the collider's
    triangles, its lamps and its portcullises, under the mode machine's own key (`egCircleKey`). The builders are the
    stand's own, so the build is byte for byte the level the stand makes.
  - `world/egCircleWorker.js` runs that build off the main thread (a circle's mesh is 30-70 ms in one task, and its hall
    law's solver as long again) and transfers its buffers.
  - `scenes/egSwap.js` schedules it, one build at a time keyed by the circle: asked, building, ready, handed over once.
    Asking for another drops the one held. A worker that errors, or answers another circle, offers no build again until
    the breach's end.
- **THE SWAP IN PLACE.**
  - While the Court rests, the client asks for the next circle's level (`egPrebuild`).
  - When the step is due, the mode machine stands the built circle in the same level (`egSwapCircle`): the old mesh,
    portcullises, floors and draws go first (the slot emptied before what was in it is freed); then the new circle is
    uploaded, laid and lit, and the level takes its circle's number.
  - The dungeon host stands the new circle's spans (`egRecircle`). The spans' draws and buckets are tracked at their
    stand, so they leave whole.
  - The client puts my feet on the new circle's first plate under the veil it closed.
  - No exterior pixel, no landing, no world-cell hello and no new context: the presence socket stays the breach's.
  - THE FREE PINS: after twenty swaps and back, the live meshes, the collider's buckets, the hall's triangles and the
    draws are at their baseline, and no texture was uploaded again.
- **THE FALLBACK.** A build still in flight holds the step `EG_SWAP_WAIT_MS` (1.5 s). A build not ready by then, no
  module Worker, or a failed worker each step the old way: out under the veil and in again. The build is never made on
  the main thread, because a hitch in the rest is worse than the step it would save. Walking out of the breach forgets
  the build and ends the worker (`egSwapDrop`).

**Where EG-H3 departs from this page, said plainly.**

1. The seam's `judge` is `(f, bodies, now)`: each body carries its trail (`tr`), so the page's `judge(f, blow,
   trails)` is that call. `new` takes the brain's own birth record, not a `profile`. `hit` answers each brain's own
   answer (the damage taken, or the serpent's words).
2. The gate's crystals, host and heals and the Remnant's Echoes and Hearts stay each brain's own blows beside the seam.
4. The trails keep y for section 11.7's per-floor judge, which is not built. `posAt` and `posAfter` still hand the
   judges two coordinates.
5. The motes (`render/sdMotes.js`) still read the Hour's `SD_COURSE_END`, baked into their shader. Their sky is the
   Hour's own, over its own void.
6. The Spire's spans ride `scenes/egSpan.js`, not the Hour's riders (`createSdSteps`).
7. **THE SWAP is still a circle a level** (EG-PLAY's second departure, narrowed). The five halls of a circle stand in one
   level, and the pull between them is still a teleport under the veil's flash.
   - What is new is the step into a NEW circle: a swap in place of a level built during the Court's rest. That is the
     window before a new circle; a hall's closing builds nothing, because a circle is the unit.
   - At most two circles are resident: the stood one and the built one.
   - The 4 ms slicing is not needed, because the build runs off the main thread.
   - The new circle's hall specs are still drawn on the main thread by the client's law reads as it arrives
     (`egHallOf`), as before.
8. Nothing of the swap has run in a browser: there is no Daggerfall data in the build container. The swap in place is
   run from `scenes/worldModes.js`'s and `scenes/dungeonContext.js`'s own source over a counting renderer and the real
   collider. The client is played against the relay's real Room, with the worker run in-process.

**The four hosts.**

- `src/scenes/worldModes.js` - WIRED: the swap's build (`createEgSwap`), `egPrebuild`, `egSwapCircle`, `egSwapDrop`,
  and one portcullis stand for the stand and the swap (`egGateStand`).
- `src/scenes/dungeonContext.js` - WIRED: `egRecircle`, the spans' draws and buckets tracked at their stand.
- `src/scenes/world.js` - FLAGGED: untouched and needs nothing; the client reaches the swap through the mode machine's
  doors.
- `src/scenes/exterior.js` - FLAGGED: untouched (offline, as section 28 has it).

`scenes/egClient.js` asks the build at the rest, swaps in place and falls back. It is a helper the hosts call, not a
fifth host.

**Pins.**

- `test/egseam_law.test.js` (8) and `test/egswap_client.test.js` (8).
- `tools/mutants/egseam.json` (66, every one dead).
- Records of other arcs whose quoted lines moved, re-aimed by content and judged again, every one dead (39): `egspan`,
  `int_lane3`, `int_lane3_audit`, `sd6b`, `sd7a`, `sd7b`, `sd8b`, `sd8c`, `sd9a`, `sd10b`, `sd11a`, `sd11b`, `sd18a`,
  `sd25_steps`, `serpent1`, `serpent1_audit`, `serpent4`, `wb3` and `wb8b`.
- Source pins moved to the seam's calls, each `PIN MOVED`: `auditwbx`, `sd8b_fight` (and the relay graph's order),
  `sd8c_remnant_page`, `sd9a_receipt`, `sd18a_marks`, `sd20a_fight`, `serpent4` and `wb8c_gate_detail`.
- `RELAY_VERSION` `world197`, unshipped, rehashed: `net/bossSeam.js` joins its graph where `net/bossRef.js` walked, and
  `net/egSpanLaw.js`, `net/sdBrain.js`, `net/bossRef.js` and `net/egBrain.js` changed.
### EG-G1 - 2026-10-12 - THE HUD, THE BEATS AND THE FIRST BREACH

Closes the HUD's half of layer one's fifth departure: the arrival card, the first-time lines, the accessibility settings
and touch and the pad, with the HUD, the panel and the recap no longer plain DOM text. The score, the mix and the band
art stay the look's (EG16, EG17).

**What shipped, by piece.**

- **The HUD by form factor** (`ui/egSpireHud.js`, section 27.1). `egFormFactor` reads the screen: a short side of 560 px
  or less is a phone, upright or sideways. It is pinned at 1280x720, 390x844 and 844x390. `EG_LAYOUTS` gives each
  layout its parts:
  - a desk: the count's chip and the Reliquaries' beside the compass, the decrees under them, the potion pip, how many
    stand, and the objective chip;
  - a phone held upright: one 18 px tabular chip (the count and the Reliquaries), and the decrees folded to a tappable
    *2 decrees*;
  - a phone held sideways: the count's chip and a 44 px lord's bar, with the decrees on the arrival card.

  The hall and its band are on the arrival card alone, and the company's state on the party rows. Every part reads
  `--hud-scale`, copied off `.hud` as the arena's bar does. The HUD is DOM in both skins, like the gate's bar, the
  arena's and the sea's: it is a readout, not one of DFU's windows. The classic skin dresses it in DFU's own text colour
  and shadow (`ui/nativePanel.js` DEFAULT_TEXT_COLOR and DEFAULT_SHADOW_COLOR) over the gate's classic face. The
  enhanced skin uses its pixel face on the kit's plates. Inside a breach the old tracker (`ui/egHud.js`) gives way to it,
  and stays the call's outside.
- **THE COUNT CHIP** (`egCountChip`, section 27.2).
  - mm:ss in tabular figures: gold above 10:00, white to 2:00, red below, and a 1 Hz pulse in a running count's last
    30 s.
  - *Held* with a pause glyph while the count holds. The reason is shown on the chip and never said: the Redoubt, a
    respite (the room's `respite` line still running), the door or the stair (`egHoldWhy`). The Redoubt's rest no longer
    says *The Redoubt holds the count* on the screen.
  - The last word's figure with a seal glyph when it is nearer than the count.
  - Gains fly in for 2.6 s (`egGainText`): *+15:00*, *+10:00 - the Covenant's Press* while the Press stands, *+3:00 -
    the last word* when the last word cut it, *+1:00* for THE GOLD RUN, and *Surplus +1* in blue.
  - The warnings come once a count, and a Redoubt that raises the count never arms one again (`egChipWarnings`): *The
    Covenant presses. Five minutes.* at 5:00, a toll at 1:00 and at 0:10, and *The count will not hold through the next
    Court.* `egCourtNeedMs` takes section 18's model for the last one: 140 s for each trial left (this one counted
    whole), 26 s for the Court's approach, and the lord's `ttkRef`.
- **The arrival card, the objective, the door, the lord's bar** (section 27.3).
  - The card (`egArrivalCard`): the hall's name over *Hall 12 - the Broken Galleries*, the objective beneath, the
    twist's line, and the decrees in force. A band's first hall (or the breach's own first) shows its band's name and
    line. A Court shows *Hall 15 - the Court* and the lord's card. It stands 4.8 s on the gate title card's own sheet,
    on a node of its own: the gate's card belongs to the fight (a lord's wake and fall).
  - The objective chip carries its progress (`egProgressText`).
  - The door's marker (`egDoorMarker`): the way down's bearing off my facing, on the screen's edge while it is not ahead,
    with its metres (*The way down - 42 m*), shown through the closing.
  - The lord's bar (`egLordBar`): the first true lord awake (never a mirror or a friend), its health and its phase.
- **The party rows** (`ui/egParty.js`; `ui/partyPanel.js` gains `setSpire`, section 27.4). Each member's row shows:
  - their numeral, I to VIII, in Battlemage blue;
  - a cracked gold sigil on the portrait once their recall is spent;
  - a grey row with an eye for a witness, an arch for home, and a struck-through name for the forsaken;
  - an amber ring draining the 180 s for a body this screen holds no pose of in a trial (`egAbsentStep`);
  - a mote where their Memento lies, and on whoever carries one;
  - *High Road* or *Low Road* in the place line while the company stands split at a fork (`egRoadOf`, by the steps'
    own `road`);
  - Fire-touched and Frost-touched as sigils.

  The panel is told the rows in its own terms (`egPartyDeco`: a numeral, the classes, a mark, a title, the ring's share
  and a place line). It paints only what moved, and gives its own place line back when the split ends.
- **Every event seen, heard and said** (`ui/egBeats.js` `EG_BEATS`, section 27.5).
  - The table is pinned: its seventeen events in order, each with its sight, its sound and its words, and who already
    says them (the fight's beat line, the client's chat line, the veil's own close, the score's SPIRREDT), so no line is
    said twice.
  - The sounds are Daggerfall's own records, played as the Hour plays them: the bell 107 (pitched for a toll, a low toll
    and a bell), the chime 364 (the Rare chime, `playRareDrop`'s MakeItem), the drums 374, the fanfare 32, the door 25,
    the cauldron's chord 365, and the void's moan 66 for the Steps' rewind.
  - THE WATCH (`egBeatWatch`) hears what the room newly said and replays nothing it saw at its first look: the beat
    lines, the falls, a gift, a Redoubt, a wake's twist and fork, and the last word.
  - A cast-back shows *-10%* where it cost anything. A Weir Key found rings the Rare chime.
- **THE RECAP, whole** (`ui/egHud.js` `egRecapModel`, section 27.6).
  - The depth (the hall, the Redoubt, the band) and the time from Hall 1's wake.
  - Why it ended, in the client's end words.
  - A strip per circle: its halls' glyphs, its lord and its falls.
  - Each member: numeral, falls, the recall kept or spent, and how they left.
  - The Vestiges, and the Accords held with any companion.
  - The Reliquaries open only by walking home or the last word, one each 400 ms with the Rare chime.
  - A member who walks home reads it too, not only the end's company.
  - The last five runs are kept on the device (`eg.recaps`).
- **The first breach** (section 27.7). `EG_TEXT_FIRST` holds the nine lines verbatim. Each is said at its first occurrence
  and never before it applies:
  - the count's at the first running trial;
  - the door's at a span's closing;
  - the void's at the first cast-back;
  - the fork's at a forked span's wake;
  - fury's at a lord's;
  - the decrees' at the first decree ask;
  - the recall's at the first fall that is not final;
  - the Memento's when one first lies;
  - home's at the first Redoubt's rest.

  Each is said once a device, in the chat and under the objective (`egFirstDue`, the bits kept as `eg.first`). The
  Rehearsal's own teaching line is said once: *A Rehearsal: Halls 1 to 5, the count and one life. Nothing is won here,
  and nothing is lost.*
- **Touch and the pad** (section 27.8).
  - While the panel, a witness's eye or the recap stands, the pad's d-pad is theirs (`egPadAct`): left and right choose
    a card or an option (the panel marks it), up takes, and down says no. A witness's left and right change whom they
    watch, and a held down forsakes (asked twice). Any press closes the recap.
  - The classic skin's pad sends its own codes. On Enhanced Plus the world host composes the gamepad's helm door, so the
    prompt bar says the Spire's rows (`egPadPrompts`).
  - Touch buttons for the witness's eye and forsaking, and for the way home at a rest (`egTouchButtons`). The panel's
    cards and choices were buttons already.
  - Haptics behind the touch layer's own `touchHaptics`: 15 ms as the Beat underfoot enters its last 0.4 s, 30 ms on a
    blow newly aimed at my feet, and a pad's dual rumble for the same two (`egBeatUnder`, `egPerilsNew`, `egBuzz`).
- **Accessibility** (`ui/egAccess.js`, section 25.7). Three of the port's own rows sit on the prefs shelf, under Settings >
  Accessibility:
  - `port:reducedMotion` in Motion: the row or the system's setting stills the chip's pulse, the gains' flight and the
    card's rise;
  - `port:dangerPalette` in a new Danger shapes section: Standard; High contrast (the danger edge magenta [1.0, 0.15,
    0.75], safety white-gold, the hazard cyan); Deutan-Protan; and Tritan. Each colour-blind preset is pinned to separate
    every pair by 40 delta E under its simulation (Machado 2009 at full severity, `egCvd`), where Standard does not;
  - `port:telegraphFill` in the same section: the fill's light 50-100%, with the line kept whole.

  All three are each player's own online (`systems/onlineLane.js` ONLINE_PLAYERS_OWN_PREFS names the one switch).

  The fight lays the palette and the fill on every shape before its telegraph pass (EG-G2's `egLookShapes` in
  `scenes/egFight.js`, reading `egAccessNow` - this module is the palettes' one home), and the chip's red is the
  palette's danger. The
  Examination's runes chime as each lights, pitched up its numeral (`egRuneChime`), and the numeral goes to the HUD's
  polite live region, where every beat's words go for a screen reader.
- **Words** (section 27.9). Every new line is worded once in `EG_PRES_TEXT`, `EG_TEXT_FIRST` and `EG_BAND_LINES`. The
  last word's end line is now the table's *The last word. The breach closes.*

**Where EG-G1 departs from this page, said plainly.**

1. The first-time lines are once a device (`eg.first`), not an account's service bits. The bits are the account
   service's to add, and a new device says each line once more. (EG-ZF added them: `players.eg_first`, `/v1/eg/first`,
   read over the device's - `ui/egBeats.js` egFirstOver.)
2. The new words are not in `EG_TEXT`. `net/egLaw.js` is in the relay's bundle, so a client's word there would move the
   relay's law hash for nothing the relay reads. They are in `ui/egBeats.js` instead.
3. The arrival card wears `ui/gateTitleCard.js`'s sheet on a node of its own, because that module's one card is the
   fight's.
4. The recap shows no share and no healing per member, because the room's words carry neither (the share rides EG-E's
   receipts). The board's line shows when the herald hands one (`board`), and today nothing does. The damage chart at a
   lord's fall (`ui/gateDamageChart.js`) is not shown, because the room puts no Spire damage table on the wire. (EG-ZF
   built all three: the room's `dm` and `ds` - `net/egTally.js` - and the board's line from the end's claim.)
5. The door has its screen-edge marker, its metres, its sound and the fight's words. Its compass mark on the enhanced
   HUD's strip, the beam and the closing's ring are the look's (EG16).
6. The absent ring reads this screen's silence: no pose of theirs in my room, the same silence the relay counts. The
   wire carries no absence word, and `net/egBrain.js` is unchanged.
7. Touch's three motor changes are not built: the Jump press that slides into look, the upward flick, and the stick at
   full throw on spans. They are the touch layer's own motor (`ui/touch.js`) and stay EG10's. The pad reaches the
   panel's cards and choices, not the Surplus's two buttons.
8. The palette's colours ride `uEdgeCol` and `uColor`. High contrast's double keyline, hatch and chevrons, and the
   hazard's dashes, need a new style bit in the telegraph shader (EG16; EG-G2 built it - `TELEGRAPH_FS_SPIRE`'s `uLook`,
   the bits `egPaletteBits` reads off this palette). `port:allyEffects` (THE QUIET COMPANY) is not
   built, because the Spire's passes draw no allies' spell effects or hit numbers to quiet. The HUD and the card read
   reduced motion. The stair (EG10's swap) and the heavy blows' shakes (none in the Spire yet) are to read
   `egReducedMotion` when they are built.
9. The beats play through `audio.playOneShot`, not THE SPIRE MIX's critical bus (EG17). SPIRREDT is the score's.
10. The party rows decorate the party panel's cards, so a company member who has left the party is not on them. My own
    recall shows on my chip.
11. A Weir Key found rings the Rare chime. The *Weir Key* banner is the loot banner's, and a restacked key does not pass
    through it.
12. Nothing here has run in a browser, because the build container holds no Daggerfall data. The drawing is pinned
    against a fake document, and the client against the director's own words.

**The four hosts.**
- `src/scenes/world.js` - WIRED. The party panel's `setSpire` seam, the pad's d-pad composed into the gamepad's helm door
  (`inputHooks.helm`), and a Weir Key found's chime. Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED. It has nothing to wire: the HUD is the breach client's, drawn from the online
  frame in every mode.
- `src/scenes/dungeonContext.js` - FLAGGED, for the same reason.
- `src/scenes/exterior.js` - FLAGGED as section 28 has it: offline, no breach.

**Pins.** `test/egpres_hud.test.js` (10) and `tools/mutants/egpres_hud.json` (64, every one dead). The EG-PLAY, EG-FULL
and fragment pins pass unchanged. The tracker's inside reading (`egHudModel` with `inSpire`) is kept as their words, and
the Spire's HUD draws the same facts in their own places. No other record's quoted line moved. `RELAY_VERSION` is
unchanged, because nothing in the relay's graph moved. The Ledger's ELITE-GATES row (section A) gains `ui/egSpireHud.js`,
`ui/egBeats.js`, `ui/egParty.js` and `ui/egAccess.js` at the lead's merge.
### EG-F - 2026-10-12 - THE ARCH AND THE CALL

**What this is, said plainly.** EG9's slice, built whole: the key's eight refusals, THE START WINDOW, THE ARCH and THE
CALL. It closes EG-PLAY's departure 1 (no arch: the call and `/breach` were the door) and EG-FULL layer one's departure 4,
and the Wager half of EG-PLAY's departure 8 (the order's `wg` omitted). A Weir Key now asks where in the Spire before
any key is staked, an arch of the gate's own stone rises at the opener's feet, everyone on the opener's cell sees it, and
the company scattered across the Bay is called by a horn and a prompt and answers through a portal at its own feet.

**What shipped, by piece.**

- **The key's refusals** (section 5, in the page's order - `scenes/egArch.js` `egKeyRefusal`, each a line of `EG_TEXT`):
  cold; open sky; the Portal Stone's holds (`portalHold`'s five words, each worded for the key), the water and a boat;
  inside a location's footprint (*Not within Daggerfall.*); another breach near (a Dagon's Breach within
  `EG_ARCH_GATE_NEAR_M` 300 m, an arch within `EG_ARCH_NEAR_M` 150 m); a breach held (or an open in flight); the road
  shut; no room for the arch. EG-PLAY's arm had cold, sky, held and shut; the rest are the host's facts
  (`egClient`'s `keyFacts`). A guest's refusal stands second, after cold - the service's own refusal said before it asks.
- **Where the arch stands** (`egArchPlace`): the Portal Stone's `portalPlace` ahead of the opener (`PORTAL_AHEAD`), turned
  to face them, then `EG_ARCH_CLEAR_M` 8 m clear across it either way and before and behind it a metre up, with ground
  under both its feet; anything else is *There is no room for it here.* Its site on the wire (`egArchSite`) is its pixel
  and its foot in that pixel's own frame (the gate's spot's frame, the height the world frame's) and its turn, so every
  client stands it the same in its own scene.
- **The start window** (`ui/egStartWindow.js`): the stake (*Weir Keys: 3 - one will be staked.*; no key, the Rehearsal
  alone), the quest warning (a tracked quest's clock inside the 36 game hours of the last word), the choices - *Hall 1*
  and every Redoubt the opener may start at, deepest first, each named with the band its first hall stands in
  (*Redoubt 12 - the Shade Perilous*) and a `+` or an `x` for each member of the party in its order - the Wager's own
  list (each decree with its family; a second of a family or a fourth refused and said; *Done*), and *Rehearse - Halls
  1-5, no key*. A start some member cannot make asks once, *Go without Mara?* (DFU's YesNo box, `ui/yesNoBox.js`); a
  choice closes the list before it is acted on, and is made once. On both skins the lists are DFU's
  DaggerfallListPickerWindow (`ui/listPicker.js` - the boat variant picker's way, on the mode machine's window slot),
  which draws itself in the enhanced skin (`ui/enhancedPicker.js`).
- **The preflight** (`/v1/eg/starts`, `server-account/src/egStarts.js`): for the opener and each member it names (at most
  8), the starts they may make - `src/net/egStartLaw.js` `egStartsFrom`, the one law both ends read: Hall 1, this
  season's Redoubts (the arena's season, `arenaSeasonOf`), else half the all-time best; null for a guest. With it the
  opener's keys, the day's Rehearsal and the relay's public half (`rk`).
- **The open carries the choice**: `/v1/eg/open` takes `ew` and `wg`, refuses `start` (a start the opener may not make:
  no carries, its own included) and `wager` (not up to three decrees of three families - `egWagerOf`, its families
  copied by number and held equal to `EG_DECREES`), and writes both into the stake (migration 0111's EG-F block:
  `eg_stakes.ew`, `eg_stakes.wg`) and the order (`ew`, `ewg`). Every admission is held to the breach's start (`start`,
  403), and its order names it; the three new refusal words (`start`, `wager`, `subs`) each have a sentence in
  `net/accountClient.js` `REFUSALS`. The hub hands the order's Wager to the room (`wg` on the open's tell), and a breach that
  starts at Redoubt `w` begins at the next circle's first hall (`src/net/egLaw.js` `egStartHall`).
- **The arch** (`scenes/egArch.js` `createEgArchPool`, drawn through the gate's pool - `scenes/gatePool.js` `arches`):
  the gate's model at `EG_ARCH_SCALE` 0.62 (10.04 m tall, 4.79 m a side) on the gate's records' twins
  (`EG_ARCH_RECORD_OF`: 5, 6, 7 in `GATE_ARCHIVE`), its skin painted in code (`world/gateArt.js` `archArt` - white marble,
  a gold inlay lattice gleaming faintly by night, the gate's own basalt veins laid through it as cracks with an ember
  banked in them; the rim's gold twice as close; the spines gold to basalt). It climbs out of the ground over
  `GATE_RISE_MS` from the opening, stands sealed, burns open, and sinks over `GATE_COLLAPSE_MS` when the first hall wakes
  (or at its end, or the open window's end - `egArchLife`); sunk whole before it rises, a beacon alone off the built
  ground. Its collider stands while it stands risen; a body it stands up around is set down before it.
- **The pass, per draw** (`render/gatePass.js`): the membrane's tint and scale and the beacon's height, foot under the
  ground, light's start and colour are set inside the loop (`gatePassValues`); `GATE_PASS_MAX` is 4. The arch's beacon
  is gold, 400 m over its foot, its light from its own lintel. THE GATE'S OWN DRAW IS WHAT IT WAS: its record names none
  of them and takes the gate's (scale exactly 1, tint exactly white, 400 under, 1200 tall, the literal's own foot,
  `BEACON_COLOR`), and the per-draw sources are the gate's own templated - written back with the gate's values they are
  `MEMBRANE_VS` ... `BEACON_FS` byte for byte, which the Hollow's omen still builds from.
- **The clear sweep's keys** (`world/gateClearance.js`): a clearing is the gate's or a set (`gateClearSet` - the gate's
  and every standing arch's, `EG_ARCH_ROCK_M` 14 m about each foot, keyed by breach id); a built pixel is built again only
  for what changed - an arch come that its pieces reach, a clearing gone that cost it something - and the gate alone
  keeps its one key, sweeping as it did.
- **The call** (section 6.4): the hub signs the call's arch fields with the receipts' key (`src/net/egCallSig.js` -
  `ec1` leading the signed bytes) and says `ew`, `wg` and `sg` with it. Each member's client sounds a horn (`scenes/egCall.js`
  `buildEgHorn`, a war horn's rising call made in code), writes the one line *<opener> opens an Elite Breach.*, and shows
  the prompt (`createEgCallPrompt`, the duel challenge's strip's shape): *The breach opens in 4:12.* while sealed,
  *Answer the call - 4:12* while open (Enter, the pad's A, or the strip's button), *Answer from open ground.* indoors,
  gone under any window and back when it closes, gone once answered or the window over. Answering asks `/v1/eg/admit`;
  the order in hand, the Portal Stone's portal opens at the member's feet for `PORTAL_OPEN_MS`
  (`createEgCallPortal`, the Portal Stone's own pool, its holds keeping it shut), and stepping into it is the admission.
  A portal that closes unused leaves the prompt to stand again. The opener steps through the arch itself (or presses it);
  anyone outside the company is told *The breach answers only to <opener>'s company.* Late: *The breach has closed
  behind <opener>'s company.* - after the window, and when the room refuses an answer after the first hall woke.
- **Strangers see it** (section 23): the opener's foes frame carries the signed arch fields (`ea`) while the opener
  stands within `EG_ARCH_SAY_M` of it; a stranger believes one only near the opener's own feet, one an opener, at most
  `EG_ARCH_PER_CELL` two, and only once the hub's signature verifies against the relay's public half. A forged one stands
  nothing.
- **The landing**: the opener lands before the arch (`world/gateArena.js` `gateLandingFor`, widened to take an arch
  record - its site and its turn), `EG_ARCH_LANDING_M` out; everyone else where they answered (the portal's step is the
  mode machine's own `from`). The room keeps the arch's site, and its whole state (`st`) carries it.
- **The Timers row, the sight line, the map mark** (section 2): `systems/eventTimers.js` gains the kind `'elite'`, the
  company's alone - *Elite Breach opens* while sealed, the window to answer, then *Hall 17* and what is left on the count;
  *You see an Elite Breach 140 metres to the North!* once an arch, by the Elite Dungeon's own law (`world/spawnedDungeons.js`
  `sightLineOf`); the company's arch on the held map (`ui/egArchMapMark.js`, the gate's ring's painter in the arch's gold)
  and on the enhanced compass (the gate's diamond in gold).

**Where EG-F departs from this page** (said plainly):

1. **The order's Wager rides `ewg`, not `wg`.** `wg` is INT9's remains order's guild (`REMAINS_FIELDS`), and the order
   fields are exclusive by kind; the room's tell, the `st` frame and the receipts keep `wg`.
2. **The relay's public half reaches the clients through the account service** (`rk` on `/v1/eg/keys` and
   `/v1/eg/starts`, its `GATE_PUBLIC_KEY`): the page says peers check `sg` and not with what, and the relay holds its key
   non-extractable. A guest asks neither and so stands no stranger's arch.
3. **The cell word rides the opener's foes frame** (`ea`, as the Portal Stone's `pg` does), not a frame of its own; the
   call and the word carry the opening `op`, from which `riseAt` and `openAt` are the clock's (`egTimes`).
4. **A stranger's arch sinks at the open window's end**: only the company hears the first hall's wake, so only its arch
   sinks then.
5. **The band a start is named with is its first hall's.** The page's example names *Redoubt 12 - the Soul Cairn*; a
   breach started there begins Hall 61, in the Shade Perilous, and the window says so.
6. **A deeper start's first circle stands under the Proclamation and the Wager alone**: no circle's decrees were chosen
   for it (the rest that chooses them is a Redoubt this breach never stood).
7. **The prompt is a strip, not a native window**: the duel challenge's precedent, on both skins.
8. **Refusal 7 is the hub's `egOk`** on the client; the hub's live cap and drain are its own refusal of the open.
9. **Found, not fixed (another arc's)**: `ui/hud.js` hands the enhanced compass neither the sea serpent's mark nor the
   Abyss Dungeon's - world.js passes `serpent` and `sd` and the classic HUD's options drop them. The arch's `arch` is
   passed through.
10. Nothing here has run in a browser: there is no Daggerfall data in the build container. The pieces are tested headless,
    the client against the relay's real Room.

**The four hosts.**

- `src/scenes/world.js` - WIRED: the arch pool made beside the client and handed to the gate's pool (its frame, world pass,
  foreign pass, lights, eye boxes, plaques and presses); the key's facts (`portalHoldNow`, the water, a boat, the location
  rect, the gate's place, `egArchPlace` over the collider's probes); the start window's three doors; the call's portal
  (drawn with the Portal Stone's, `scenes/portalGates.js` `drawAlso`, PORTAL1's flats line unmoved) and its prompt; my arch on my foes frame (`portalWord`) and a peer's
  through the street's pool (`exteriorFoes.setOnEgArch`); the Timers row, the held map, the compass (`frameHud`'s own
  object); the clearing's set (`_gateClearNow`). No statement joins `function frame(now)`.
- `src/scenes/worldModes.js` - WIRED: `enterEgHall` takes the opener's `landing` as the way out's (`dungeonReturn.from`).
- `src/scenes/dungeonContext.js` - FLAGGED: the arch stands in the open world alone; a dungeon has none and asks nothing.
- `src/scenes/exterior.js` - FLAGGED: the `?exterior` bench is offline; the key says *The key is cold here.*

**Pins.** `test/egarch_law.test.js` (8), `test/egarch_client.test.js` (7) and `test/egarch_service.test.js` (3).
`tools/mutants/egarch.json` (75, every one dead). Records of other slices whose quoted lines moved, re-aimed by content
and judged again: `gateclear.json` (the sweep's turn), `auditwb_world.json`, `gateseen.json` and `wb2.json` (the gate
pool's doors). Pins moved, each said so: `test/egplay_service.test.js` (the keys' answer carries `rk`; `EG_ORDER_FIELDS`
gains `ewg`) and `test/wb2_gate.test.js` (the cap, now 4, met by six gates). `RELAY_VERSION` stays `world197`,
unshipped, rehashed with `net/egCallSig.js` in its graph. `ACCOUNT_VERSION` stays `acct121`; migration 0111 gains the
EG-F block; `.github/workflows/account-deploy.yml` lists `src/net/egStartLaw.js`, which the account Worker bundles.
### EG-H2 - 2026-10-12 - THE MADE LEVEL'S RULES AND DURABILITY

Layer six's first part (EG-H): EG7 (section 24) and EG8e (section 22), with EG10's DEATH-PENALTY exemption, the flight
bans and the technique refusal, and the jump buffer. Closes layer one's departure 6 for `madeLevelOf`, `MADE_LEVEL_RULES`,
the jump buffer, the technique refusal, the slowfall ban, AvoidDeath refused, THE HOLD and THE DRAIN (THE FAIR TRAIL, the
clock correction and the ridden poses stay owed).

**THE MADE LEVEL'S RULES** (`systems/madeLevel.js`). One law in place of the per-level checks at every rule's door:
- `madeLevelOf(loc)` answers `'court'`, `'hour'`, `'spire'` or null off each made location's own predicate (`isGateArena`,
  `isSdRealm`, `isEgHall`), and the mode machine says it (`madeLevel` in scenes/worldModes.js, the dungeon mode's alone).
- `MADE_LEVEL_RULES` is section 24's table as data, twenty rules a row (null where a level leaves the game as it is):
  saves, rest, the map, the Mark, the Recall, the Portal Stone, companions, regeneration, THE POTION LAW (`'counted'`),
  Levitate, Slowfall, a technique's flight, the jump buffer and the late press (0.12 s each in the Spire, 0 elsewhere),
  Resurrect, AvoidDeath, what a death is, DEATH-PENALTY, /unstuck, and the voice a refusal is said in. `MADE_LEVEL_TEXT` is
  each level's refusals in its own home's words (COURT_TEXT, SD_REALM_TEXT, EG_TEXT), unchanged.
- `registerMadeLevelHere` is the world host's word on where the player stands, and whether its feet are on the Spire's
  traversal ground (scenes/egClient.js `onTraverse`: in a hall of the circle and off its fight floor, or over the void
  between the halls). Doors with no host in reach read it: the potion law, a technique, the motor's forgiveness.

**The doors, re-plugged.**
- `scenes/dungeonContext.js` reads `madeLevelRule(_made, ...)` once per rule: the save door and the pause's Save, the M
  key and the map's record, the rest, the slow fall (written false in the Spire - the effect runs on), the avoid-death
  consult, and the death screen's `penalty`.
- `scenes/world.js` reads `madeRuleHere(...)`: both companion doors, the Mark and the Recall (said through `madeSay`, the
  Hour's voice or the mid-screen line), the respawn's DEATH-PENALTY and its death branches, /unstuck, the ONE Levitate
  ward (section 10.7 - EG-PLAY's second seam, `registerSpireLevitateWard`, is retired), the frame's one
  `setCourtRules`, Resurrect, and the Portal Stone's door. It registers the law's word and THE FORGIVENESS.
- `systems/spireKit.js` (THE POTION LAW) and `combat/techniques.js` (the flight's refusal) ask it too.

**The Burning Court and the Hour, unchanged.** Every value in their two columns is what their doors did at 4f0e71965,
pinned rule by rule (test/egmade_law.test.js) and by their own suites, whose pins moved to the law with `PIN MOVED` notes:
sd5a, wb3b, sd21, gatecrowd, gatefbx, sd11c, sd12, sd20f, sd26, sd27, sd7b, audit_seats_client, auditwatchkit_net,
arena2_hosts, mapkeep, wbx_gate_fixes, deathpenalty and donline1_respawn. Twenty-nine of their mutant records were
re-aimed by content, every one dead.

**The Spire's rules, built.**
- **THE FORGIVENESS** (section 10.8; `player/motor.js` `registerJumpForgiveness`). A jump pressed in the air up to the
  buffer before landing fires on the landing, past DFU's 0.1 s gate. A plain jump pressed up to the late press after
  walking off an edge still leaps. With nothing registered, or 0, the gate is DFU's verbatim. Measured on the real motor:
  a tap 0.08 s before landing fires on it, and a press 0.05 s off an edge rises. Both are swallowed in the court and the
  Hour.
- **The technique's flight refused** (section 10.7). A leap or a dash on the Spire's traversal ground is refused in the
  Spire's words (*The Spire's spans are walked, not flown.*), with nothing paid. On a fight floor it is a technique.
- **The slow fall banned**, and **AvoidDeath refused**: Stendarr does not reach into the Spire.
- **DEATH-PENALTY exempted** (EG10). EG-FULL's death save makes a killing blow a fall, so only a death no save is asked
  of reaches the death screen in the Spire (the exhaustion collapse, a drowning's SetHealth(0)). Its screen states no
  loss, and its respawn takes none. EG-PLAY's departure 9 is closed.
- The pause's Save now refuses in the Spire, as the save door always did (it had never asked the Spire). A Resurrect is
  refused there, and the frame's court law covers the Spire's whole frame.

**DURABILITY** (`net/egDurable.js`, in the relay bundle; `server/src/index.js` `_egOf`, `_egResume`, `_egTick`).
- **Saves to storage** were already at the open, every admission, stage, fall, pick and end, and every CHECKPOINT_MS. But
  **every trial's checkpoint threw**: the director kept its beat's closures on the fight (`F.legionCtx`), so the record
  could not be structured-cloned, and storage held the hall as it woke. The context is now unenumerated, and a trial's
  save lands (pinned). At a Redoubt the receipts are kept in storage before they go out.
- **Time across a restart.** The room stamps each beat (`tk`). A room woken from storage, or a beat that comes late, gives
  the gap back (`egGiveBack`): every instant the record holds after its first wake moves forward. That covers the count,
  the stage and hall clocks, the lords' and the legion's timers, and each member's absence. The open never moves (the
  last word is the wall clock's, as the service's live window is), and nothing moves before the first wake.
- **THE HOLD.** A room woken between trials (a closing, the swap, a rest) holds from its last beat: the count frozen, the
  director still. It waits until every living member's body stands in the room again or EG_REJOIN_MS (180 s) has passed,
  then gives the whole gap back and runs on.
- **THE DRAIN and THE COST.** The hub keeps its live list (`eglive`: each breach's law and last word) and answers the
  public `/v1/eg/live` (counts, `between`, `laws`, `until`, `drain`, no breach named). With the relay setting `egDrain`
  'on' (a developer's `/relay egDrain on`, or the `EG_DRAIN` var), or EG_LIVE_MAX (64) live, the hub refuses an open with
  *the road is shut*. It mints the opener a `v` receipt at once, so the stake the service took comes straight back. The
  relay deploy (.github/workflows/relay-deploy.yml) reads `/v1/eg/live` after the siege blackout: a live breach under a
  law the build does not draw is THE DRAIN (it waits five minutes at a time for none live or the longest's last word);
  otherwise THE HOLD (it waits up to twenty minutes for every breach to stand between trials).
- **THE LAW PIN.** `EG_LAWS` (`{ 4: '2026-10-11' }`, a law kept EG_LAW_KEEP_DAYS) names the laws this build draws. A
  woken room whose `egv` is not among them ends its breach with `why: 'void'`: the entered members' end receipts return
  the stake, the opener who never entered is handed a `v`, and the Redoubts taken stay. A member's `spec` is answered
  with that hall in the breach's own law's bytes (this circle or the next). A client whose law is not its breach's asks
  each hall of its circle once and is told once. The halls given are read before any draw (net/egLaw.js `egSpecGive`),
  and the circle standing is built again once all five have come.
- **Secret, deterministic receipts.** The room draws `rs` (32 bytes) at the open and never sends it. A receipt's seed is
  HMAC-SHA-256(rs, sub|R|kind)'s first 32 bits, so a room woken before its save mints the same roll again. A breach opened
  before this keeps the CSPRNG's seed.

**Departures, said plainly.**
1. **Section 24's table had the court refusing a Recall.** It never has: the court refuses the Mark alone (World-Bosses.md:
   "Recall's mark"). Re-plugged unchanged, the law says so.
2. **The deploy does not ask a room to hold.** An unauthenticated ask would let anyone freeze a breach. The room holds
   itself on the restart it wakes from, so the deploy only waits for every breach to stand between trials. That keeps the
   page's rules of the count held and the gap given back.
3. **THE DRAIN's road is shut by a developer** (`/relay egDrain on`, and `off` after the deploy - the hub keeps it across
   one). The deploy cannot sign a hub frame, so it waits on `/v1/eg/live` and says the setting in its log. The hub refuses
   the open after the service has staked the key, so each refusal hands the stake back as a void at once.
4. **One generator.** The relay and the client keep the current law's generator alone, so "seven days of EG_SPEC" is the
   table and the void. A future spec change keeps its predecessor in EG_LAWS (with its generator) for seven days, or goes
   through THE DRAIN. A client rebuilds a circle drawn before its given halls came, under the veil. Its next circle draws
   from them at once.
5. **Not built here:** THE FAIR TRAIL, the clock correction, the ridden poses (EG-H's rest); a `force` deploy voiding live
   breaches by name; the hub retrying `EG_INTERNAL_OPEN`; `{k:'void', z}` from a client holding a stake the room never
   took; the unknown room's tombstone (EG8a/EG8b's key-loss paths).
6. **The Ledger A ELITE-GATES row** owes THE FORGIVENESS and AvoidDeath refused as departures from DFU
   (`01-Overview/Port-Ledger.md`, the lead's to write).

**The four hosts.** `src/scenes/world.js` WIRED: the doors above, the law's word and THE FORGIVENESS registered, the
one ward. `src/scenes/worldModes.js` WIRED: `madeLevel`. `src/scenes/dungeonContext.js` WIRED: the doors above.
`src/scenes/exterior.js`: unchanged - the fixed city stands no made level and registers no word, so every door there is
the game's own.

**Pins.** `test/egmade_law.test.js` (5) and `test/egdur_relay.test.js` (5). `tools/mutants/egmade.json` (58, every one
dead), with twenty-nine records of other arcs re-aimed (`audit27h`, `audit_seats_client`, `auditclimb1`, `auditcrew`,
`bounty1`, `egplay`, `fb1011b`, `gatecrowd`, `gatefbx`, `macd`, `sd11c`, `sd12_onelife`, `sd20f`, `sd21_alone`,
`sd27_audit`, `sd5a`, `sd7b`, `wb3b`), every one dead. `RELAY_VERSION` `world197`, unshipped, rehashed with
`net/egDurable.js` in its graph.
### EG-G2 - 2026-10-12 - THE LOOK AND THE SOUND

Closes EG1's two rows, EG16 (all but the arch's skin, which is the arch's slice's), EG17, and what EG-D still owed the
screen: the band art, `world/meshKit.js`, `world/pseudoArchives.js`, the moving pieces' pass with its cull and measured
budgets, the Rail's dashed track, the Gust's streamers, the waystones lit, the mist drawn, and the band's dress where
the Hour's records stood. Section 25.7's settings rows are the HUD slice's (EG-G1): this slice reads their shelf keys
and draws what they choose.

- **THE GATE'S TIERS** (`systems/gateTier.js`, a leaf importing nothing). `GATE_TIERS`, `GATE_TIER_TEXT` (Regular
  *Dagon's Breach*, the words it always had; Elite *Elite Breach*; Super *Abyss Breach*, reserved), `GATE_TIER_SUB`
  (*The Battlespire*), `gateTier(x)` (an `eg:` room key, a record of kind `eg` or one with a band is Elite; a record of
  kind `gate` or one with a day is Regular; nothing reads as Super), `gateTierText`, `eliteBreachPlaque({ opener, mine
  })` (another's company named, never your own), `gateSightLine(metres, direction)` (to the nearest 10 m, never under
  10), `eliteTimerText`. No reader of the Regular gate's words moved to it: the HUD's and the arch's slices are its
  readers.
- **THE REGISTRY** (`world/pseudoArchives.js`). Every archive the port numbers past TEXTURE.511 - 34 numbered blocks and
  8 string keys - with its owner, its kind (port, mod, data or synthetic) and what it holds; `pseudoArchiveCollisions`,
  `pseudoArchiveOwner`, `pseudoArchiveFree`. Its test sweeps `src/` both ways: every `*ARCHIVE*` number past 511 is
  registered at its own value under its own owner, every registered block is found in its owner, and no two collide. The
  Spire's own: `EG_BAND_ARCHIVES` (38241, 38251, 38261, 38271, a block of 9 a band) and `EG_ARCH_ARCHIVES` (38281 to
  38289, held for the arch's skin).
- **THE BAND ART** (`world/egBandArt.js`). Each band's ramps (stone, vein, metal, accent, liquid; five steps each)
  painted in code with SD-LOOK's kit (ordered dither, bevels, quantised ramps) into eight records under the band's
  archive: floor (0), brass (1), root (2), arena (4), cobble (31), edge (32), molten (33), pillar (56). The Galleries
  are marble and gold leaf with Battlemage blue over the fire-sea; the Cairn slate violet and bone in soul-light; the
  Shade black glass and moon-silver over quicksilver; the Wellhead SD-LOOK's basalt and iron over the molten. The gold
  edge glows at `SD_EDGE_GLOW` and the brass at `SD_BRASS_EDGE_GLOW`. The liquid's light is held at or under luma 0.45
  in every band (`egMoltenGlow`, section 11.9: magma never outshines a telegraph). `egBandDress(model, band)` moves only
  those eight records' sub-meshes from the Hour's archive to the band's. It dresses the circle's model, the gate's parts
  and every span piece, batched or drawn alone. The magma floor (Grath's Court) and the Caverns' fire channels moved
  from the edge gold (32) to the band's liquid (33). The dungeon arm uploads a band's art the first time a session
  stands one of its halls, its light white.
- **THE MESH KIT** (`world/meshKit.js`). `createMeshKit()`: `tri`, `quad`, `box`, `prism`, `extrude`, `lathe` and
  `sweep`, every face wound to face out, one sub-mesh a record, 32-bit indices, `pack(archive)`;
  `meshKitBounds(positions)` (box, centre, radius). Its first reader is the waystones' model.
- **THE PIECES' PASS** (`scenes/egPieceBatch.js`, read by `scenes/egSpan.js`). Each kind of moving piece (a slab, a
  pendulum, a tube, a lid, a wall) is one mesh holding every copy, drawn through the renderer's own mesh program
  (`createMesh`, `updateMeshVertices`). Each slot reads the pose the law already writes (`object.matrix`, `hidden`; a
  matrix of zeros is a gone piece), so not one line of the law's posing changed. Each frame `cull(planes)` re-lays only
  the copies whose place or sight changed, uploads a kind only when one did, parks a copy out of sight 4000 m below and
  hides a kind with nothing in view. Every piece is `noShadow`, so a cull never moves the shadow record. Grath's islands
  and the seals keep their own draws, now culled by their bounding spheres. The dungeon arm calls the cull
  (`dungeonContext.egSpanCull`) on the frame's own view and projection, before it draws the level and its movers.
  **Measured** (node, 60 circles: seeds 7, 99 and 12345, circles 1 to 20):
  - the circle's dynamic draws fell from a mean of 53.4 (worst 152) to 8.4 (worst 13);
  - its GL draw calls (a sub-mesh each, the islands and seals counted) from 115.5 (worst 343) to 17.6 (worst 32), every
    copy in view;
  - the ride and the cull together cost 0.19 ms a frame on average and 0.32 ms at worst (seven circles, hall 2's eye).
- **THE EDGE LINE** (`world/egLook.js` `egCircleEdges`, `render/egLinePass.js`). Screen-width quads, 2 px wide (3 px on
  a screen 720 px tall or less), gold at luma 0.38, lifted 0.02 m. They run along every disc's rim, every band's long
  edges (not a cave's, a wall's or a tube's) and the lanes; a falling island's disc has none. The Rail's dashed track
  (0.5 m dashes, under its run) and the Drum's are drawn in the same pass. Every line keeps section 25.6's fog floor.
- **THE LAST TELLS.**
  - The Gust's streamers (`egGustSections`, `egStreamersAt`): from the breath law, only while the wind blows, flowing
    its way, at most 64.
  - The waystones lit (`buildEgLookModel`): a post beside each walkway, its cap in the edge's gold, in the band's dress.
  - The mist drawn (`egMistSheets`, `egMistSheetsAt`, `render/egMistPass.js`): a pale sheet from 0.3 m under the walk,
    rising to its law's line, feathered at its rim, dithered, in the fog.
- **THE SKIES** (`render/egSkyPass.js`, `EG_SKIES`). Each band's zenith, horizon and deep, the Galleries' and the
  Wellhead's embers, the Shade's moon and its stars, and the Spire's underside overhead: a black mass leaning toward the
  course, its ragged rim lit from below by the deep, smaller each band (0.34, 0.22, 0.13 and 0.07 radians). It is drawn
  in the dungeon arm's sky slot, where the Hour's sky stood, in the Spire's haze (`drawEgSky`, world.js).
- **THE STAIR.** The law alone: `egStairOf(h, reduced)` - the band's first hall and each Brink fall, every other hall
  veils, and reduced motion cuts.
- **THE TELEGRAPH PASS** (`render/gateTelegraph.js`). `GateTelegraphRenderer(gl, { spire: true })` builds the Spire's
  shader from the gate's text by asserted swaps; the gate's own shader is unchanged byte for byte. The swaps add:
  - section 25.6's fog floor: 0.85 within 30 m, eased out over 4 m;
  - the fill's scale (`port:telegraphFill`, 50 to 100%);
  - the double keyline and the hatch, as a palette asks;
  - THE HAVEN GRAMMAR (`TELEGRAPH_POOL_HAVEN`, pool 3): gold and lit, its line bright, a dark keyline outside, chevrons
    flowing in to its heart.
  The fight (`egLookShapes` in `scenes/egFight.js`) draws the danger edge in the palette's colour, brighter on a shape
  aimed at you, and draws your shapes last. In a trial it fills a shape aimed at another member at 0.55. It draws a
  haven in the palette's safety and the place's own hazard in the palette's hazard colour.
- **THE DANGER PALETTES** (EG-G1's `EG_DANGER_PALETTES` in `ui/egAccess.js`, their one home - the merge folded this
  slice's own table into it, and its style bits are `egPaletteBits`): Standard, High contrast (magenta, a double keyline
  and a hatch), Deutan-Protan and Tritan. The lab check (`egLab`, `egSeen`, `egThroughFog`) tells apart the danger edge from the magma
  and from a burning pool, a haven from a danger fill, and the place's white from gold and from the void: at least ΔE 12
  apart at 10 m and 30 m of each band's fog, in colour and under the colour-blind simulation (Machado 2009) each palette
  is meant for. In grey the place's white stands at least 8 apart in L* from the danger edge; the shelf's colour-blind
  pins (40 delta E under each preset's own simulation) hold on the same colours. The look reads the shelf's
  `dangerPalette` and `telegraphFill` (`egAccessNow`, the fill 0.5-1 as the row stores it). `port:allyEffects` is not
  on the shelf: the port draws no allies' hit numbers to hide (`ui/hitNumbers.js` draws only the player's own), so the
  row would govern nothing.
- **THE QUIET COMPANY** (`egQuietCompany(stage, full)`). In a trial no cosmetic aura is gathered, drawn or lit (the
  client's `quiet`, which world.js's `auraFrame` asks - one seam with EG-E2's), and a shape aimed at another member is
  filled at 0.55.
- **THE SCORE** (`systems/egScore.js`). Fourteen made songs at section 26's tempos and lengths, made as the Hour's and
  the Warden's are (`makeSong`, 60 ticks a beat, looping on the bar line). They are in E Phrygian, the Redoubt's hymn in
  E major. The fanfare is broken and mended; each band's motif is in its yard's brass, and each lord's four bars run in
  its Court's three songs and its Valkynaz's. The halls play their three variants in the seed's order.
  `spireScoreFor(place)` is the law, and THE PRIORITY TABLE (`EG_SCORE_PRIORITY`) is pinned: the end, a Valkynaz, a
  Redoubt, the count's last two minutes, a lord's wake, a Court, a set piece, a yard, a hall, then the ambience alone.
  `createSpireScoreHost` is the world host's seam: `hourScoreFrame` asks it first. It registers a breach's songs when
  the breach's context changes, plays the law's song or fades to the band's ambience, and times the end from its first
  note. Measured by `tools/egScoreProbe.mjs` through the real SongPlayer (25 checks, every one passed): every song
  sounding, and pressed through one player with a duck under a Court; peaks under the -1 dBFS ceiling at the highest
  MusicVolume; the war louder by phase (the Courts -16.0, -14.9 and -14.3 dBFS, the Valkynaz -15.1, the count -14.4);
  the Galleries' halls -19.1 and the Redoubt -17.9, under the fights; the end -17.7, decaying to -43 in its last
  seconds. The first run found the end song looping before the law let it go, so `SPIRE_END_MS` came down to 36 s and
  `SPIRE_WAKE_MS` to 3.4 s, each inside its song (pinned).
- **THE SPIRE MIX** (`systems/egMix.js`, `SongPlayer.duck`, `music.duck`).
  - A personal sting for a lord's blow or a CHECK on your feet always, for an add's at most once each 1.5 s, judged once
    a blow.
  - The critical bus ducks the score 6 dB for 300 ms. The duck rides the song's own level, back over 0.12 s, so it never
    fights a fade.
  - The barks are capped at four a kind, nearest first; a critical one is never culled.
- **THE LAB** (`spire.html`, `src/tools/spireLab.js`, registered with Vite). It draws a circle as the dungeon arm does
  (the cull before the draws, the sky, the mist, the telegraphs, the lines), each band from the plate, the course, the
  Court, over the pieces, at the rim, at the sky and down a misted shaft, in any palette and fill, with the line pass
  off (`?lines=off`) or the shapes off (`?shape=off`) for a probe's comparison. `tools/spireLabProbe.mjs` (Chromium on
  SwiftShader, waiting on the lab's frame counter, 33 checks) holds:
  - every view of every band lit, with no GL error. The Shade's views are held to a third of the others' lit share: its
    floors are the page's black glass under a dark sky, and from afar only its lines and its silver read;
  - the pieces in a handful of draws, the other halls culled from the plate;
  - from over the circle, THE EDGE LINE's gold where the frame without the line pass has none (957 to 2,186 pixels a
    band);
  - the underside darkening the zenith (90 to 99%);
  - the mist covering its shaft;
  - the danger disc in each palette's own hue, where the frame with no shapes has none.
  Every check passed here, each part in its last run: the views, the skies and the mist in the first run; the Shade's
  views, the lines and the palettes after the changes their first runs asked for. The first runs failed the Shade's far
  views on the lit share and the Tritan disc on a colour test too narrow for a blended edge; the line check, made at the
  rim, found the line gold on the gilt and was moved to the view from above.

**The four hosts.**
- `src/scenes/world.js` - WIRED:
  - the Spire's score first in `hourScoreFrame`;
  - `drawEgSky` beside the fight's pass;
  - the auras quiet in a trial;
  - the music handed to the fight for THE SPIRE MIX.
  Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - WIRED:
  - a band's art uploaded once a session;
  - the waystones' mesh among the circle's draws;
  - the cull before the dynamic draws;
  - the Spire's sky in the sky slot (the Hour's no more over the Spire).
- `src/scenes/dungeonContext.js` - WIRED: `egSpanCull(proj, view)`.
- `src/scenes/exterior.js` - FLAGGED: the bench is offline and holds no Elite Breach.

**Departures, said plainly.**
- **Not built:**
  - the slag's crust (law kind `slag`) is still laid by no kit: laying it moves the relay bundle's law, which this slice
    left alone;
  - the stair's fall and veil are law only (`egStairOf`); drawing them is the swap's screen (EG10);
  - THE QUIET COMPANY is wired for the auras and the fills alone. Allies' effects at 60% with no light, allies' numbers,
    the Vestige ring and the 12 m Watchfire lines are law with no reader;
  - the mix's peers at -4 dB and Watchfire's tell at pitch 1.4 are numbers in `EG_MIX` with no reader. The reverb's
    crossfade is not built;
  - the Shade's foe rim lights and the fire falls' texture (TEXTURE.356) are not ported;
  - the arch's skin is the arch's slice's.
- **Done another way:**
  - the moving pieces are batched on the CPU (only moved copies re-laid), not drawn with per-instance matrices on the
    GPU: the renderer has no instanced path, and the batch measured inside the budget;
  - the cull covers the pieces, islands and seals (all `noShadow`), not the circle's one static mesh;
  - a haven is a pool (`TELEGRAPH_POOL_HAVEN`), not a new telegraph kind;
  - a lord's wake is its own 2-bar song (SPIRWAKE), a fourteenth name beside the page's table;
  - the Steps' own pieces (the Crumble, the Beat with its twelve dial frames, the Drift and the riser) keep the Hour's
    art: their faces are tells, swapped frame by frame through the Hour's archive.
- **Not verified without a browser and the game's data:**
  - nothing was played in the live game with ARENA2. The look was seen only in the lab on SwiftShader: plates, courses,
    Courts, skies, rims, mist and palettes;
  - the draw budget was measured on node's counts and the lab's batch stats, not as frame time on a phone;
  - the songs were measured through the real player in Chromium, not heard on a sound card.

**Pins.**
- `test/eglook_registry.test.js` (4), `test/eglook_art.test.js` (4), `test/eglook_pieces.test.js` (5),
  `test/eglook_lines.test.js` (8), `test/eglook_score.test.js` (6), `test/eglook_hosts.test.js` (4).
- `tools/mutants/eglook.json` (82, every one dead; six survived the first run and were killed by new assertions: the
  fight's pass built as the Spire's, the barks through the cap, every critical bark kept past it, a Valkynaz's song only
  in its Court, the lords' brass harder each phase, a band's art uploaded once a session).
- Judged again over the files this slice touched: `egspan.json`, `egfull.json`, `egplay.json`, `egfrag.json` and
  `wb13a.json` (143, every one dead). `wb13a.json`'s WB13a-the-last-moment-flooding-the-shape was re-aimed by content,
  since the Spire's swap quotes its line; `SongPlayer.duck` stands above `fadeTo`, so DISC20-B's record applies as
  written.
- `test/tv4_weather_above.test.js`'s AUDIT DEEP R-1 names the three new fogged passes as drawn in an Elite Breach alone,
  never under the travel view.
- PIN MOVED for the Spire's sky, one more foreign pass and one more seam in the world host:
  `test/audit18_bible_docs.test.js` (36 passes), `test/farring.test.js`, `test/glstate.test.js` and `test/perf2.test.js`
  (29 seams). PIN MOVED for the lab: `test/moduleload_smoke.test.js` lists `src/tools/spireLab.js` among the browser
  tools that read `location` at load (14). PIN MOVED for the score: `test/sd13_score.test.js` and
  `test/sd20d_audio.test.js` run `hourScoreFrame` from world.js's text with the Spire's host beside it, holding nothing
  out of an Elite Breach. Systems.md counts 512 modules.
- The whole suite, run here (26,732 tests): every failure this slice caused is fixed - the pins above, a reversed
  smoothstep in the sky's shader (SD20c's sweep) and a registry line that named the Oblivion Gate (WB12a's guard). One
  failure stands at the base commit, not this slice's: doctrine's Ledger-row check names `src/net/egPay.js` and
  `src/systems/egLordArms.js`, left to the Ledger's owner.
- `RELAY_VERSION` untouched: nothing in the relay's import graph moved. `ACCOUNT_VERSION` stays `acct121`.
- The Port-Ledger's rows are left to the merge.

**The merge (EG-G2 into the arc beside EG-G1, EG-H1, EG-H2 and EG-H3).**

- One home for the shelf. EG-G1 and this slice each built the danger palettes. The palettes, the fill and reduced
  motion are EG-G1's (`ui/egAccess.js`, the rows under Settings > Accessibility); this slice's own table and
  `egLookPrefs` are gone. The fight lays them on through `egLookShapes(shapes, egAccessNow(), stage)`. The fill goes
  to the Spire stage's `uFillK` (the row stores 0.5-1, never 50-100), and EG-G1's `egAccessShape` is gone with it.
  Both labs (EG-G1's 40 delta E under each preset's own simulation, this slice's fog-and-magma check) hold on the
  shelf's colours, and the colour-vision matrices are `ui/egAccess.js`'s `EG_CVD`, read by both.
- One seam for the quiet company. EG-E2's `quiet()` and this slice's `quietAuras()` were the same rule twice. The
  client's `quiet` now reads `egQuietCompany`, and `auraFrame` asks it, so a trial's auras are not gathered, drawn or lit.
- THE SWAP (EG-H3) stands a new circle in place, without `standEgHall`. It now uploads the new circle's band dress
  (`egBandUp`) and builds its waystones (`egLookBuild`). The old circle's look mesh is freed with its circle mesh.
- The fight's wind-up barks keep EG-H1's feint gate (the wind once the wind-up is past `EG_FEINT_AT`, never on a
  feint), and Watchfire's early outlines draw after the ordered blows. The fight's clock is the breach's corrected one.
### EG-ZE - 2026-10-12 - THE STAIR, THE DOOR AND THE LIGHTS

The last wave's slice for what EG-G1 and EG-G2 left the screen (Mac: "I said I want everything"). It closes EG-G2's "the
stair's fall and veil are law only; drawing them is the swap's screen" and EG-G1's fifth departure (the door's compass
mark, its beam and the closing's ring). It also draws what no record had named: the witness's and the living's pings
(the `eping` words were folded into the link's `pings` and read by nothing), the Redoubt's beacon, the recall's blue
pillar and the witness's sight.

**What shipped, by piece.**

- **THE STAIR DRAWN** (section 7; `world/egLights.js` `egStairStep`, `ui/gateVeil.js`, `render/egStairPass.js`).
  - `world/egLook.js` `egStairOf` is the law, read now by the screen. `egStairStep(h, reduced, again)` gives the step its
    look as a veil theme: `egFall` at a band's first hall and each Brink, `egVeil` elsewhere, `egCut` under reduced
    motion (the port's row or the system's - `ui/egAccess.js` `egReducedMotion`).
  - It hands the veil the band the step falls into, the hall held centred (*Hall 13*), and the band's chime. The chime
    is the Concord's chime (clip 364) on the first note of the band's motif (`systems/egScore.js`), pitched as the
    Hour's quarters are.
  - A circle built again under the breach's own law (EG-H2's THE LAW PIN) never falls: the company has not moved.
  - THE VEIL'S THREE THEMES: the veil keeps the fire's law (`render/gateVeil.js` `veilAt`) and runs it at the stair's
    pace, 0.8 s each way (`EG_STAIR_VEIL`). A veil half open and asked to close again closes from where it stands, at
    that pace.
  - The stair's own pass draws at a third of the pixels, pixelated. Every pixel goes and comes back in the ordered
    dither, posterized in the band's own sky (`world/egLook.js` `EG_SKIES`):
    - THE FALL: the band's void opening under the faller. The Spire's underside climbs away overhead, black with its rim
      lit from below. Embers streak up past the eye and the deep rises to meet it.
    - THE VEIL: the band's void, dim, its motes drifting up.
    - THE CUT: the same void, standing still.
  - The band's chime sounds as the veil closes and at a pull's flash, with the deep wind under the fall.
  - The hall is a label of the veil's own, centred over its canvas. It comes and goes with the dither and goes with the
    veil.
  - The fall stands shut at least `EG_STAIR_VEIL.fallHold` (1.2 s), so the underside is seen to fall away.
  - WHERE IT IS DRAWN (`scenes/egClient.js`):
    - the step into the breach: the stair of its own first hall (`egStartHall`), so Hall 1 and a Brink start fall;
    - THE SWAP, in place (`scenes/worldModes.js` `egSwapCircle`) and its fallback alike, through `stepThroughFire`'s own
      look;
    - every pull's flash.
  - NEVER SLOWER: the swap closes in 0.8 s where the Hour's veil it used took 1.2, and opens in 0.8 where it took 1.7.
    The fall's close, hold and open (2.8 s) stay inside the Hour's veil's 2.9 (pinned). The swap's own work runs inside
    the hold, never after it.
- **THE DOOR** (sections 7 and 27.3).
  - Through the closing, a gold beam stands over the END PLATE in the palette's safety. It is 48 m tall, climbs in
    0.6 s (whole at once under reduced motion), and keeps 0.6 of itself through any haze, so it is seen hall-wide.
  - The closing's ring lies at the door's reach (`EG_DOOR_REACH_M` 3 m, where `down` is heard), in every hall kind. Its
    arc is the closing's seconds left, from the relay's own stage word (`sa`, `su`); the spent arc stays at a quarter.
  - The door's mark on the enhanced compass is `egDoorCompass`, through the client's `archCompass` (departure 5).
- **THE REDOUBT'S LIGHTS** (sections 16.2 and 27.5).
  - THE BEACON climbs at the court's heart 1.5 s after the Redoubt's word (`rd`'s `at` - the relay says it on the step
    the lords fell). It stands at the place the spoils are thrown from (`beaconAt`'s own), 90 m tall, climbing over
    1.2 s, and stands through the rest. It burns wider and brighter for 0.8 s as each recall lands.
  - THE RECALL'S PILLAR is blue, 6 m, where the called-back rise (the room's `rise`). It rises in 0.4 s, stands 3 s and
    fades over its last 0.6.
- **THE COMPANY'S WORD** (sections 16.4 and 16.5).
  - Every ping is a Battlemage-blue pillar 6 m tall with its kind's glyph: *here* a ring, *danger* a triangle with its
    bar, *mine* or a witness's *cache* a diamond. It rises in 0.25 s, stands 5 s and fades over its last second.
  - Each newly heard ping chimes once (the beats' chime).
  - The wire carries a ping's x and z alone. The floor it stands on is the one under it nearest its pinger's own height
    (`egFloorUnder` - mine, or the company's poses), else the highest.
  - A witness's ping now stands where the member it watches stands. Before, it stood on the arrival plate, because a
    witness's own body is held under the hall.
- **THE WITNESS'S SIGHT** (section 16.5): for a witness alone, a blue ring and an eye at each dormant Lurker's anchor,
  and a ring and a diamond at each alcove on its own floor. The next hall's twist is said once a hall: *Beyond the
  door: A Battlemage hangs in chains.*
- **THE LIGHTS' PASS** (`render/egLightPass.js`, through `scenes/egLookDraw.js` `drawLights`).
  - It draws beams and pillars facing the eye about their upright axis, rings flat on the floor and glyph squares facing
    the screen. They are written on the CPU each frame into one kept buffer and blended additively.
  - THE FOG FLOOR keeps them within 30 m, and a beam has its own floor past that.
  - The pass is depth-tested and never writes depth. It draws after THE EDGE LINE in the fight's pass, and gives back
    its state.
  - Every light is the way's gold (the shelf palette's `safety`) or Battlemage blue, never a warning.
  - A trial with nothing said stands no light, and the law makes nothing for it: the draw asks every frame.

**Where EG-ZE departs from this page, said plainly.**

1. **The pull keeps the veil's flash** (section 27.5's table). It goes shut at once in the stair's own look, with the
   hall held and the band's chime, and opens in the 0.8 s dither. It never closes first, because the pull is the
   room's, taken at once.
2. **The fall's least hold can keep a fast swap waiting** by the difference between its work and 1.2 s. It is never
   longer than the Hour's veil every step used before (pinned).
3. **The hall held is a DOM label over the veil**, in the classic face (Cormorant, the arrival card's gold) on both
   skins, and hidden from screen readers (the arrival card's words reach the live region).
4. **A witness's stair does not cross-dissolve with the member it watches.** A witness sees the company's stair.
5. **The door's compass mark rides the arch's gold slot.** The world host's frame already hands the enhanced compass
   `arch: egClient?.archCompass()`, the gate's diamond in the Spire's gold. The arch stands only in the open world, so
   in the Spire the slot is the door's, and no host line moved. The classic compass carries neither, because EG-F's
   ninth departure stands: the classic HUD's options drop the arch.
6. **The beacon's 1.5 s is timed from the Redoubt's word, not from SPIRREDT's chord.** The score's own clock is
   EG-G2's.
7. **The witness's sight speaks the twist in the chat**, with no HUD line. A ping's cooldown is not shown: the relay
   refuses a ping inside 3 s, and the screen says nothing.
8. **Blue is the same in every palette.** The palettes move the danger, the safety and the hazard only.
9. **Nothing here has run in a browser**, because the build container holds no Daggerfall data. The two shaders were
    evaluated through `test/glsl.mjs`, the passes run over a recording GL, and the client played against the relay's
    own words through the wire.

**The four hosts.**
- `src/scenes/world.js` - FLAGGED: untouched. The compass's slot (`arch: egClient?.archCompass()`) and the client's
  `drawPass` already reach it. Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED: untouched. `stepThroughFire(go, look, opts)` already hands the veil the step's
  look, and the swap in place runs inside it unchanged.
- `src/scenes/dungeonContext.js` - FLAGGED: it has nothing to wire.
- `src/scenes/exterior.js` - FLAGGED, as section 28 has it: offline, no breach.

**Pins.**
- `test/egz_stair.test.js` (9).
- `tools/mutants/egz_stair.json` (85, every one dead). Two survived the first run:
  - a witness's compass during a closing - a pin was added;
  - the client's own guard on the lights outside the halls - redundant with the draw's own and the law's, so it was
    removed.
- Records of other slices whose quoted line moved: `sd25_look.json`'s SD25-the-hold-dropped, re-aimed by content (the
  veil's hold now reads the stair's too).
- Judged again over the three shared files this slice touched (`ui/gateVeil.js`, `scenes/egClient.js`,
  `scenes/egLookDraw.js`): 84 records in fourteen lists (`auditwb_sound`, `egarch`, `egeco`, `egfrag`, `egfull`,
  `egint`, `eglook`, `egmade`, `egplay`, `egpres_hud`, `egseam`, `sd11d`, `sd25_look`, `wb6c`), every one dead.
- PIN MOVED: `test/tv4_weather_above.test.js` names `render/egLightPass.js` as drawn in an Elite Breach alone, never
  under the travel view. `bible/07-Rendering/Rendering.md` lists the two new passes.
- `RELAY_VERSION` untouched: nothing in the relay's graph moved. `ACCOUNT_VERSION` stays `acct121`.
- The Ledger's ELITE-GATES row gains `world/egLights.js`, `render/egStairPass.js` and `render/egLightPass.js` at the
  lead's merge.
### EG-ZD - 2026-10-12 - BACK INTO THE SPIRE, AND THE FALL

The last wave's (EG-Z) slice for section 22's way back (EG10's return), section 16.5's FALL screen, section 10.8's clock
on the host, section 13.2's dashed feint, section 27.8's Surplus on the pad and section 26's critical bus for the beats
(Mac: "I said I want everything"). It closes EG-H1's world.js host flag (`egNow` and the spans' anchored clock on the
welcome's offset), its departure 8 (the feint's fade), and EG-G1's departures 7 (the Surplus's two buttons) and 9 (the
beats on `audio.playOneShot`).

**What shipped, by piece.**

- **THE WAY BACK** (`scenes/egClient.js`, section 22).
  - The breach I stood in is kept on the device (`EG_BACK_KEY` `eg.back`, read by `egBackOf`): its id, its seed, its
    opening, its geometry, its start, the hall the company last stood in, whether the room counted me (`in`), my last
    island (`li`, `[h, x, y, z]` in the hall's frame) and the falls whose screen this device has shown (`wf`). It is
    written at the first step in, again whenever the room's word moves any of it, and the island at most each
    `EG_BACK_WRITE_MS` (1 s, the last one kept for the next write).
  - The client now reads the account's `live` breach from the account service's keys answer (`/v1/eg/keys`, which has
    always answered it). A record of another breach, or of none, is let go on that word. A live breach the device holds no record of is kept as one, with
    its seed the room's to say.
  - Once the service says the breach lives, a member outside it is offered *Your breach still stands. Type /breach to
    return to the Spire.* once, in the chat. The call's strip (`scenes/egCall.js`) says *Your breach still stands -
    return to the Spire* with a *Return* button. Enter, the pad's A, the strip's button, `/breach` and the Weir Key's
    use all answer it.
  - Answering is never refused as late (`returnIn`). It asks no admission of the service and sends no order: it is a
    hello as an entrant, which the room answers by re-admitting a member it counts (`net/egBrain.js` egAdmitWord,
    unchanged). The step goes under the veil into the circle of the hall the record last stood in.
  - A call still open, to a member the room never counted, stays the call's own door, never the way back.
  - In the circle, the room's word puts me where the company stands. A circle or a seed the record had wrong is rebuilt
    in place at once, by EG-H3's swap, whatever the stage. I resume on my last island in a trial (still ground under
    my feet in the company's hall, by `net/egFair.js` egSupportAt: a plate, an island, a passage's floor, a bridge, a
    ramp or a fight floor). Between trials I resume on the hall's arrival plate. A witness's body is held as it was.
  - The record is let go at the breach's end, at my way home, at forsaking, and when the room refuses me back (its
    refusal's words). The breach is then marked over on the device (`{ b, x: 1 }`), so the service's `live`, which
    stands until my end receipt is claimed or lapses, never offers it again. A socket merely lost keeps the record, and
    the service is asked again at once, so the way back is offered on the walk out.
  - The keys are asked once the account is signed in. A reloaded page signs in after its first frame, and the ask
    used to wait ten minutes from that frame.
- **THE FALL** (`ui/egSpireHud.js` `egFallModel`, `drawEgFall`, `egDitherCss`; section 16.5). A fall in the Spire is now
  its own screen, not mid-screen text:
  - the camera sinks 1.2 m (`EG_FALL_SINK_M`) over 1.2 s from my eye where I fell, eased, as the screen drains to a
    fifth of its colour (`EG_FALL_SAT`, a backdrop's saturation over the world - the HUD above it keeps its colour);
  - the gate's title card's sheet, on a node of its own, reads *FALLEN* over *The next Redoubt can call you back.* or
    *The Spire will not take you back.* (no recall left, or the room's `fall` saying `fin`), and *Reliquaries lost: N*
    in the palette's red (the Reliquaries held while I stood) only when any were held;
  - 2.5 s later the witness view dithers in: an ordered 2x2 dither through black in quarters over 0.6 s, the eye handed
    to the witness's orbit at its darkest;
  - reduced motion (`egReducedMotion`): no sink, the colour cut at once, the card still, the witness view cut in;
  - the card's words go to the HUD's live line (the card is aria-hidden), and a fall this device has shown is not shown
    again after a reload;
  - the company's low toll is clip 107 at the page's pitch 0.42 (EG-G1's table had 0.55).
- **THE SPANS' CLOCK** (section 10.8). The breach's client hands the host the corrected shared clock while I stand in
  the breach and the room has answered a ping: `breachNow()` in ms and `spanSeconds()` as anchored seconds
  (render/deadlands.js anchoredClock's law, taken again when the corrected offset moves past `EG_SPAN_REANCHOR_MS`,
  5 ms). The world host reads them first, `deadlandsSeconds` (the dungeon arm's `sdClock` - the spans and the Spire's
  sky) and `egNow`, with the welcome's offset elsewhere and before an answer. Both are host functions beside the old
  ones, outside `function frame(now)`.
- **THE FEINT'S DASHED FADE** (`scenes/egFight.js`, `render/gateTelegraph.js`, section 13.2). A cut blow's fill stays
  where the cut found it, and its mark fades over `EG_FEINT_FADE_MS` (ai/blowShapes.js TELL_FEINT_FADE, Feud-Arc section
  7.3's one number, in place of a literal 150). It is drawn dashed: the Spire stage's `uLook` 4 (`world/egLook.js`
  `EG_LOOK_BIT.dash`), TELL5's stripes across the court's axes. An honest blow, or a zone in a slot a feint held, is
  never dashed.
- **THE PAD AND THE SURPLUS** (section 27.8). With a Surplus to spend, the pad's left and right run past the offer's
  cards to the Surplus's two buttons: up on the first spends a fourth card, on the second a reroll. The panel
  (`ui/egHud.js`) marks the one chosen.
- **THE BEATS ON THE CRITICAL BUS** (`systems/egMix.js` `beat`, section 26). Every HUD beat's sound (a door, a fall's
  toll, the count's tolls, a rune's chime, the recap's Rare chime, a Weir Key found) is played through THE SPIRE MIX:
  the one-shot, and the score ducked 6 dB for 300 ms, never culled. In the breach it is the fight's mix, over the host's
  music (the fight hands it on, `mix()`). Elsewhere it is the client's own, with no music to duck.

**Where EG-ZD departs from this page, said plainly.**

1. The world host's offer is the call's strip, its chat line and `/breach`, not a button of its own: the strip already
   stands for the call, and the way back is answered the call's way.
2. "A counted member" is the device's record of the room's count. A device with no record (another browser, cleared
   storage) is offered the way back on the service's word alone, and the room decides: a member it never counted is
   refused at the hello past the window, and that refusal lets the record go.
3. The last island is the client's own record of still ground, written at most each second, not the relay's last
   pose. A page whose socket only dropped never left the circle, and stays where its own motor holds it.
4. The drain is a backdrop's saturation (the HUD keeps its colour), and the dither goes through black. Neither is a
   cross-dissolve of two frames. The sink starts from the first-person eye where I fell (`cam.pos`), in either view.
5. THE FALL's words are the client's (`EG_FALL_TEXT` in ui/egSpireHud.js). `net/egLaw.js` is in the relay's bundle, so
   only the final line is `EG_TEXT.fallen`.
6. The spans' clock is taken again past 5 ms. anchoredClock's own slack (1 s) would never take the correction, which is
   a one-way latency of tens of milliseconds.

**The four hosts.**
- `src/scenes/world.js` - WIRED: `deadlandsSeconds` (now `deadlandsShared` with the breach's seconds first) and
  `egNow` read the breach's corrected clock. Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED: it has nothing to wire. The spans read the host's seconds through its `sdClock`,
  and the way back stands the circle through its own `enterEgHall`, `egSwapCircle`, `egPrebuild` and `egPlace`.
- `src/scenes/dungeonContext.js` - FLAGGED, for the same reason (`egSpanRide` reads `opts.sdClock`).
- `src/scenes/exterior.js` - FLAGGED as section 28 has it: offline, no breach.

**Pins.**
- `test/egz_return.test.js` (7).
- `tools/mutants/egz_return.json` (71, every one dead). Four survived earlier runs. The island's write kept for the
  next survived until a pin wrote two islands within one spacing. The breach's end, my way home and forsaking each
  guarded the record a second time, after the over mark already guarded it; those three guards were redundant code,
  and they were removed with their records.
- Moved, each with a PIN MOVED note: `egfull_client` (the witness's eye read after THE FALL has run), `wb6b_deadlands_life`
  and `sd5b_sky` (the Deadlands' anchored clock is `deadlandsShared`, with an Elite Breach's corrected clock read first).
- Re-aimed by content and judged again: `egplay.json`'s EGPLAY-the-next-circle-never-built (the swap's line now also
  takes a return) and `egpres_hud.json`'s EGPRES-a-yes-or-no-one-option (the choices now say their cards).
- Judged again over the files this slice touched (`scenes/egClient.js`, `scenes/egFight.js`, `ui/egSpireHud.js`,
  `systems/egMix.js`, `render/gateTelegraph.js`, `world/egLook.js`, `ui/egHud.js`, `ui/egBeats.js`, `scenes/egCall.js`):
  180 records of `egpres_hud`, `eglook`, `egarch`, `wb13a`, `egfull`, `egint`, `egplay`, `audit_wb9`, `wb4`, `egseam`,
  `egfrag`, `egmade`, `wb8c`, `egspan`, `sd8d`, `wb9e`, `auditwbx`, `egeco`, `sd11d`, `wb9b` and `wbx`. Every one is dead.
- `RELAY_VERSION` untouched: nothing in the relay's import graph moved. `ACCOUNT_VERSION` stays `acct121`, with no
  migration.
- The Port-Ledger's ELITE-GATES row is the lead's. No new src file.
### EG-ZA - 2026-10-12 - A KEY IS NEVER LOST, AND THE RECEIPTS SAY EVERYTHING

The last wave (Mac: *"I said I want everything"*). Sections 21, 22 and 23, with section 20's boards. It closes EG-PLAY's
departure 7 (the hub keeps no receipts) and EG-H2's departure 5 (the hub retrying `EG_INTERNAL_OPEN`, `{k:'void', z}`,
the unknown room's tombstone, a `force` deploy voiding live breaches). It also closes three of EG-E2's departures: the
relay minting no `td`, a company being the claimers rather than the receipt's `co`, and THE SEAL's ranking. And it builds
section 22's tick.

**What shipped, by piece.**

- **The open, retried** (`server/src/index.js` `_egOpen`). The hub tells the breach's room its open `EG_OPEN_HUB_TRIES`
  (3) times while the room does not answer. The room answers the same order with the record it kept, so a retry is
  harmless. Once the hub has kept the call for the company's hellos, it tells the room the call went out (a new internal
  door, `EG_INTERNAL_CALLED`; the room keeps `B.called`).
- **An end with no hall woken is a void** (`net/egBrain.js` `egEnd`). It is never the opener's `'empty'` unless the
  room was told its call went out. A voided breach's opener who never entered is owed the `v` by the end itself. The
  law pin's void (EG-H2) now gets its `v` the same way.
- **A void is the room's** (`EG_INTERNAL_VOID`, `_egVoidInternal`). The hub asks for it in three cases:
  - an open the room refused (another order holds the room, or the room voided this one);
  - an open the room never answered after its tries;
  - THE DRAIN's refusal. Before, the hub minted that void itself, and the order could still open a breach once the road
    reopened.
  An order the room never took is written into the room's tombstone first (`egdone`, `net/egDurable.js` `egDoneWith`).
  Only then is its `v` minted, once: asked again, the room answers the same receipt, and the order is never opened
  after. If the signing fails, the order is still spent, and its void is minted when asked again.
  The breach the room took is voided only while nothing has begun (`egVoidable`: no call out, no hall woken, no member
  in). Otherwise the hub says *the breach took the key*, because its own receipts settle the stake.
- **A client's void** (`{k:'void', z}`, to the hub - `_egVoid`). The hub checks the open order whatever its age
  (`net/identityToken.js` `verifyEgOpenAnyAge`, `verifyStakeOrderAnyAge`'s way) and that it is this socket's account's.
  A void more than `EG_VOID_MAX_S` (7 days) after the order's issue is refused (*the void is too old*), by the hub and
  by the room's own door. Then the hub asks the room.
- **The tombstone** is kept `EG_VOID_MAX_S` (EG_DONE_MAX orders at most). An ended breach's own order is written into
  it at the end. The room's one alarm is then the tombstone's end, after which the room forgets the breach and the
  tombstone (`_egDoneTick`). A room the hub never opened writes nothing but a void's tombstone, and arms only its end.
- **The receipts, held at the hub** (`egrc:<sub>`; `EG_INTERNAL_RCPT`, `_egRcInternal`). Every receipt a room mints is
  told to the hub, with the accounts whose socket stands in the room:
  - a member online at the hub but out of the room is handed theirs at once; one in the room only by the room;
  - every hello is handed the held ones (`_egReceiptTo`) until the account says the service counted it
    (`{k:'claimed', b, q, w}`). The copy is then remembered as spent for the receipt's own life (`egRcSpent` - the gate's
    AUDIT WBX2 M3 law), so a tell that comes after revives nothing;
  - one entry per receipt (`egRcId`: breach, kind, Redoubt), the newest kept, at most `EG_RC_KEEP` (16), each for its
    own life (`egRcFold`); the hub's sweep is the gate's, widened by one prefix.
  The room keeps each owed receipt (`B.rq`) until the hub has it, tells again `EG_RC_TELL_MS` (5 s) later when the hub
  did not answer, and an ended breach beats on for it.
- **THE FORCE VOID** (`.github/workflows/relay-deploy.yml`). A `force` dispatch deploys with
  `--var EG_VOID_BEFORE:<epoch ms>`. A breach's room woken under that stamp whose breach opened before it ends the
  breach as a void, the law pin's way (`egForceVoided` in `egResume`): the entered members' ends say `void`, the opener
  who never entered is handed the `v`, and the Redoubts taken stay. The next deploy carries no stamp.
- **THE TICK** (`egTickAt`, `egTrialRuns`). The room's beat is `EG_BEAT_TRIAL_MS` (BRAIN_TICK_MS, pinned equal) only while
  a trial runs with its company in the room. Otherwise it is `EG_BEAT_SLOW_MS` (1 s), or sooner at the stage's own end
  (`su`), so no stage ends late. There is no beat while the arch rises: the room's first beat is the open. Every gap
  stays under `EG_GAP_MS`, so THE TIME law gives nothing back for it (pinned: no `gv` over a slow stretch).
- **The receipts' table, whole** (`net/egReceipt.js`, `net/egBrain.js`).
  - An end (`x`) carries `td` once a hall is cleared, and `co`.
  - A Redoubt (`w`) carries `sh`, the member's share of the circle's damage in thousandths of the living members'
    whole.
  - It carries `m`, THE FAIR TRAIL's measures over the circle (`measureFold`). Each hall's trail is folded as it closes,
    and the Court's own at the fall; a crossing keeps its bound (`cmin`) as it reaches the end plate. The six numbers:
    crossings, the quickest crossing as a share of its bound (%), the most blind share (%), breaks, the fastest
    stretch (cm/s), and crossings whose door was the room's wake's.
  - It carries `co`.
  - `egReceiptValid` reads each field on its own kind and refuses any other shape.
  - The worst case of every field (a 40-character account, every list full) stays inside `EG_RECEIPT_MAX`. Only the
    Vestiges and the Reliquaries are trimmed.
- **THE COMPANY'S PACKING, said plainly.** Eight 40-character accounts would be about 460 characters on the wire, and a
  worst-case Redoubt has about 170 to spare. So `co` is `[n, tag]`: the entrants' count and the first twelve hex
  (48 bits) of a 64-bit FNV-1a over their accounts, sorted and comma-joined (`egCompanyTag`). Every member's receipt
  of one breach says the same tag.
- **The service** (`server-account/src/eg.js` `egReceiptRest`; migration 0111 extended - `eg_runs.co_n`, `co_h`,
  `eg_redoubts.sh`, `m`; `ACCOUNT_VERSION` stays `acct121`).
  - A recorded `w` keeps its share and its measures on its row. The measures are for staff and gate nothing until EG21.
  - A recorded `x` keeps its company.
  - The boards read `td` where the receipt says it (EG-E2 already did; the relay now mints it).
  - The Descent keys a company by `co` (`egHonours.js` `egDescentCompanies`). The same company is one row whoever of it
    claimed; two companies that share their claimers are two rows; the company's size is the company's own. An end
    from before this is keyed by its claimers, as before.
- **This screen's half** (`scenes/egClient.js`, `net/online.js`).
  - The stake an open takes is kept on the device (`EG_STAKES_KEY`) until a call or a receipt answers it.
  - If neither comes within `EG_VOID_WAIT_MS` (60 s - the hub's own tries are done by then), its void is asked of the
    hub, again every `EG_VOID_ASK_MS`, across reloads. A void refused is let go.
  - Its `v`, claimed, restacks the key: *The Spire did not open. Your key is returned.*
  - Each receipt the service has counted is said to the hub (`claimed`).
  - The presence link now hears a receipt from the hub, and says `void` and `claimed` to the hub alone.

**Where it departs from the page, said plainly.**

1. The page's frame table has `{k:'void', z}` going client -> room. It goes to the hub, which asks the room by an
   internal door. A room the hub never opened admits no hello, and the hub holds the void for the opener's hellos.
2. The room trusts the claims the hub verified (`{ s, eb, ez, i }`), as it trusts the hub's verified open. The room
   checks the age again itself.
3. `co` is a count and a tag, not the subs (above). The Descent row names the members who claimed. It cannot name one
   who never did.
4. `m` is the circle's six measures, not one hall's. `sh` is thousandths of the living members' damage that circle.
5. The hub holds every receipt, not only those for members with no socket in the room. It hands a member in the room
   nothing (the room did), but holds the receipt for their hellos.
6. A member's word still arms a beat at once (a vote, a step through the door); only the room's own tick keeps the
   law. A closing with a foe standing in it (a Kyn Mimic's Lurker) beats as a trial.
7. THE FORCE VOID is a Worker variable the deploy sets, not an asked door. EG-H2's departure 2 gives the reason: an
   unauthenticated ask would let anyone void a breach.
8. THE SEAL's ranking needs no case of its own. A sealed run ends at the sealed Redoubt's Court, its `td` the seconds to
   that Court's fall, so the Descent's order (the deepest hall, then the fewest seconds) ranks sealed runs by their
   seconds. The relay mints no `'seal'` end while `EG_OPEN` is 4.

**The four hosts.**

- `src/scenes/world.js` - unchanged, nothing owed. The client's hub and presence links are wired already (`online.onEg`,
  the hub link's `onEg`), and everything here runs inside `egClient.frame` and `word`.
- `src/scenes/worldModes.js`, `src/scenes/dungeonContext.js` - unchanged; they stand no stake and no receipt.
- `src/scenes/exterior.js` - unchanged; the bench is offline (section 28).

**Pins.**

- `test/egz_keys.test.js` (9). `tools/mutants/egz_keys.json` (64, every one dead).
- PIN MOVED:
  - `egplay_relay`'s `EG_KINDS` (`void`, `claimed`), and its ended breach's alarm (its tombstone's end, a week on);
  - `egdur_relay`'s drain and cap (the room holds the order's tombstone and no breach);
  - `egeco_herald`'s ended room (its tombstone's alarm);
  - `auditwbx2`'s sweep cursors (seven, `sweep:egrc`).
- Eleven records of other slices re-aimed by content, every one judged again and dead: `egeco`, `egeco_honours` (two),
  `egeco_relay` (four), `egmade` (three) and `egplay`.
- `RELAY_VERSION` `world197`, unshipped, rehashed: `net/egBrain.js` imports `net/egReceipt.js`, so the graph's walk
  swaps it ahead of `net/egDurable.js`. No `EG_SPEC` change, so no new `EG_LAWS` entry. No new src module.

### EG-ZC - 2026-10-12 - THE LAST FRAGMENTS

Closes what layer three and EG-G2 left of sections 11.1, 11.2 and 11.10: the Cooling Slag laid, the shafts (the Slag Chute
and the Hollow Trunk among them), and the engines as the page wrote them. Spec law 5.

- **THE COOLING SLAG** (`net/egSpanLaw.js`, the crust's one home - `EG_HAZARDS.slag` reads its numbers):
  - a spill is told `EG_SLAG_TELL_S` 1.2 s, molten `EG_SLAG_MOLTEN_S` 6 s, then a crust `EG_SLAG_CRUST_S` 10 s, every
    `EG_SLAG_CYCLE_S` 20 s (`egSlagState`);
  - a `slag` step is a crossing poured by `EG_SLAG_SPOUTS` two spouts side by side, `amp` (2.05 m) either side of its
    line, each lane 4 m wide (`EG_SLAG_STEP`), the second half a cycle behind the first. One crust always stands
    (`egSlagLane`), and the piece stands on that crust's lane (`egPieceAt`), so THE FAIR TRAIL's support
    (`net/egFair.js egSupportAt`) and the floor test know it unchanged;
  - THE TIMED SOLVER believes a landing on a crust only while that lane holds through its crossing (its depth at THE
    SPAN BUILD's run, and the Crumble's slack). The window shuts about 0.7 s at each change of lane, never a queue. A crust
    is left onto still ground (`EG_SLAG_AFTER` - the ground, a still step, a ledge or a Drop), never onto a timed piece;
  - the spill's lanes are the place's hazard (kind `slag`, 4 m wide, told over the wind-up floor, 20% fire). They pour
    over the crust and `EG_SLAG_LIP_CM` onto the floor beyond, so a member waiting at the lip stands aside. The
    director judges them as it judges every fragment hazard (`net/bossRef.js judgePlace`). A body that stays on a crust
    as it breaks falls, and owes the count its cast-back (`egPoseIn`'s void rule).
- **THE FORGE KIT LAYS IT** (`net/egFragLaw.js`, from `EG_SLAG_LAW` 5). The Forge Gut's chasm runs two conveyors, then a
  slag crossing that is left onto the far floor. The passage is 3 m longer for its crust, so its floors and hammers stand
  where they stood, and its walls 0.7 m wider for the two lanes. It is laid in the Wellhead's spans, on its Low Roads
  (whose passage is the band's first kit) and in its Deepways.
- **THE SHAFTS** (`egFragShaft`, `EG_SHAFT_KITS`). The Deepway goes down by a shaft of its band's kit in place of its three
  bare ledges:
  - every shaft: a 3 m rim, three or four flights each `EG_SHAFT_FLIGHT_CM` 0.9 m down (THE ENVELOPE's step under a
    metre), one Drop of 3-4.5 m onto the Drop's walled landing, and a 3 m foot;
  - by band: the Caverns' throat under a fire fall across its rim; the Mist Stair's pit with the mist under its foot;
    **the Hollow Trunk**'s black-glass branches on the Moon's law, the beam walking down the trunk, open to the moon;
    **the Slag Chute**'s iron ledges, its Drop, then a slag crossing onto the foot (three flights, so a Deepway stays
    inside `EG_HALL_LEN_MAX`); the deep Caverns' throat;
  - its floors are traversal ground (blows land on none). The law marks its walls `shaft` in `caves` and names it a
    fragment of class `shaft`;
  - THE TIMED SOLVER holds each shaft's own crossing to `EG_SHAFT_MAX_S` 15 s at its median (section 10.5). Measured over
    12,200 halls (61 seeds, twenty circles, two grounds): every course proven, none on the plain fallback, the longest
    shaft 7.7 s, the longest hall 153.5 m.
- **THE ENGINES AS WRITTEN** (`net/egBrain.js`):
  - **the Sluice floods its lane for 6 s** (`EG_ENGINES.sluice.flood`). Its ring tells the flood 1.5 s and bites
    nothing itself (`p` 0, the place's fire). From the landing the channel is burning ground on every screen for 6 s: the
    place's 20% fire a tick on a member in it, and every add in it, whenever it walks in, losing its 40% once a flood;
  - **the Moon-Mirror lights a branch** (`EG_ENGINES.mirror.lit`) as well as blinding the Divers. It lights the Moon
    branch nearest it within `EG_MIRROR_REACH_M` (30 m) for 6 s, with a haven over its top (`EG_MIRROR_LIT_R`, THE HAVEN
    GRAMMAR: gold on what you stand on means it holds). The branch stands on every screen while lit
    (`scenes/egClient.js` `objs().lit`, `systems/spireKit.js` `spireObjs`), and THE FAIR TRAIL holds a body on it
    (`egPoseIn`). In the Shade's Deepways that is the Hollow Trunk's first branch, 17-21 m from the chamber's mirror;
  - **the Low Road's closing waits on either road** (`forkClosing`). It begins at the first Low Road arrival at the door
    (`B.lw` - a member whose trail took the Low Road) or at the door's opening plus the roads' difference, whichever comes
    first. A member who takes the Low Road after the door opened is waited for, and a door opened by the Low Road closes
    as the High Road's. The stage word carries the moved end.
- **THE LAW PIN** (section 22, EG-H2's departure 4). `EG_SPEC` is 5 and `EG_LAWS` keeps law 4 (`{ 4: '2026-10-11', 5:
  '2026-10-12' }`) WITH its generator: `egHallOf(seed, h, geo, law)` and `egCircleSpecs(..., law)` draw either law, and
  law 4's halls stand byte for byte as they were (800 halls hashed whole, pinned). Each hall says its law (`v`). The
  director draws every hall in its breach's own law (`specOf` reads `egv`), and the relay answers a `spec` in that law.
  Law 4 may leave the table from 2026-10-19.
- **On the screen:**
  - `scenes/egSpan.js`: each slag lane is its crust (`egSlagCrustModel` - the cooled crust on sides of the band's
    liquid, THE EDGE LINE round it; a bucket up only while it holds, shaking its last `EG_SLAG_WARN_S`) and its molten
    sheet (`egSlagMoltenModel`, `EG_DRESS.molten`, drawn only while it pours, no collider - magma is the void), batched
    with the other pieces; a lit Moon branch stands while lit;
  - `world/egHall.js`: a shaft's walls run 6 m under its foot (`egWallFoot`) in the drawn mesh and the collider, the
    Hollow Trunk unvaulted; each slag lane's spout on its wall over the crust's near edge, its lip the band's liquid
    (`egSlagSpouts`, draw-only);
  - `scenes/egFight.js`: a crust's last second told in white over its lane ("every piece shows what it will do next");
    the spill's bite judged on my own feet by the fragments' hazard pass, as every hazard is.

**Departures, said plainly.**
- **Two spouts, not one.** Section 11.2 says a spill and its crust. A lone crust holds the company 10 s at its lip, past
  section 10.5's no-queue bound (`EG_WAIT_MAX` 4 s). So every crossing pours from two spouts in turn, each keeping the
  page's numbers, one crust always standing.
- **The Sluice's share moved to its flood.** Layer three's told blow took a plain 20% (counted). The flood now takes the
  place's 20% fire each tick a member stands in it (an element's share - seen in the census, never counted), and the ring
  bites nothing.
- **The Moon-Mirror's branch is the nearest within 30 m**, the port's number. Only a Shade Deepway's chamber stands a
  branch in reach today. A mirror elsewhere blinds the Divers alone.
- **One pull.** The page pulls each road at its own closing's end (the door frame's `ul`). The company is pulled once, at
  the later road's end, and the stage word's `su` says it - no `ul` on the wire.
- **The shafts are the Deepway's.** The Low Road still goes down by its Drop (section 11.4 allows "a Drop or a shaft").
  A shaft keeps no alcoves or vignettes.
- **Not verified without a browser and the game's data:** the crusts, sheets, spouts and shafts were checked by their
  meshes, colliders and draws in node, never seen in the live game.

**The four hosts.** `src/scenes/world.js` - WIRED through its existing `registerSpireObjs` (the lit branches ride the
breach client's `objs()`); no line changed, nothing added to `function frame(now)`. `src/scenes/worldModes.js` - WIRED:
the circle's mesh and collider it already stands carry the shafts' walls and the spouts, and the spans it already stands
carry the slag's lanes; no line changed. `src/scenes/dungeonContext.js` - WIRED: `egSpanRide` and `egSpanCull` move and
cull the lanes; no line changed. `src/scenes/exterior.js` - FLAGGED: the bench holds no Elite Breach.

**Pins.**
- `test/egz_frag.test.js` (9). `tools/mutants/egz_frag.json` (48, every one dead).
- PIN MOVED: `test/egdur_relay.test.js` (EG_LAWS: law 5 the law since 2026-10-12, law 4 kept); `test/egseam_law.test.js`
  (EG4's record reads the Spire's pieces off law 4's courses, kept byte for byte); `test/egfrag_law.test.js` (a shaft's
  floors are no fight floors); `test/egfrag_client.test.js` (the client's `objs()` names its lit branches). Re-aimed by
  content: `egfrag.json`'s EGFRAG-a-closing-that-leaves-the-low-road, onto `forkClosing`'s end. Judged again over the
  files this slice touched: the records of `egfrag.json`, `egfull.json`, `egspan.json`, `egplay.json`, `eglook.json`,
  `egint.json`, `egseam.json` and `egmade.json` on them (178, every one dead).
- `RELAY_VERSION` `world197`, unshipped, rehashed (net/egLaw.js, egFragLaw.js, egSpanLaw.js, egBrain.js, egDurable.js
  and server/src/index.js moved). `ACCOUNT_VERSION` stays `acct121`.

### EG-ZB - 2026-10-12 - THE LEGION HUNTS

Mac: "I said I want everything". The last wave's legion slice: sections 8.2, 11.7, 19 and 21, all relay law. It closes
EG-PLAY's departure 6 for the span Harriers, layer three's "the legion walks straight to its mark ... an arch's walls do
not yet turn it", EG-H1's departures 3, 10 and 11, and EG-E's departure for the feats.

**What shipped, by piece.**

- **THE FIGHT GROUND** (`net/egWalkGraph.js` `egFightView`, `egGroundAt`, new, in the relay bundle). The spec gains no
  field: `EG_SPEC` stays 4 and `net/egDurable.js` `EG_LAWS` is untouched. Every reading is derived at runtime from the
  spec's own geometry and cached on the frozen spec.
  - The fight ground is `spec.fl` and, beside it, the ground the page fights on that the spec lays as plain discs: a
    span's islands and its two plates (section 8.2), and in any hall a Rampart's caster pillars (section 8.3, "reach them
    by short side spans") and its winch plates.
  - `egGroundAt` is section 11.7's band: with a height, the highest floor at or below the feet plus 0.5 m whose top is
    at most 3 m under them; with none, the lowest that holds the plan.
- **THE WALK GRAPH** (`egWalkGraph`, `egWalkNext`):
  - its REGIONS are the fight ground's pieces (a disc, a lane's capsule, each convex). A chamber's chokepoint arch
    (`deco` `arch`) splits its disc into two halves;
  - its NODES are where two pieces at one height overlap or touch (a portal, both ways), where a higher piece borders a
    lower one within 4.6 m (a lip stepped off, one way), a stair's foot and top (`spec.ramps`, both ways), and the arch's
    gap. Within a region every node sees every other;
  - a walker keeps its region (`b.fr`) and the node it walks to (`b.wn`), and goes by the shortest way over a dozen
    nodes (Dijkstra). With no way (a chasm between a passage's floors, the void between a span's islands, a perch with
    no stair up) it walks to the point of its own region nearest its goal;
  - `egArchCut`: a straight run that meets an arch's wall ends there.
- **THE AIR** (`egAirOf`, `egAirNext`, `egAirKeep`). The rock a flier cannot pass is a covered passage's rock mass
  (`EG_ROCK_M` either side of its tunnel), an arch's wall, and a chamber's wall ring (open only where the course comes in
  and goes on). A flier goes straight when the air is clear, else by the fewest metres over the mouths, the rock's corners
  and the gaps.
- **THE LEGION WALKS THE GRAPH** (`net/egLegion.js`):
  - every ground walker goes over the graph (`walkGraph`): the Harrier, which hovers along it, the Sapper, Breaker, Daedra
    Lord, Kynval, Caster, Lurker, Binder, the Ghost, the Deserter and the Standard;
  - the fliers (a Diver circling, a Wraith, a Shade, a span's and a hunt's Harriers) go about the rock (`walkAir`);
  - a Breaker's charge run into an arch's wall ends at it;
  - a pinned Caster's pillar is a region with no way off, so it now stays on its pillar.
- **THE SPAN'S LEGION** (`net/egBrain.js` `spanLegion`; section 8.2, with section 12's numbers):
  - the first wave rises 4 s after the wake (14 s after a Stillness), then one every `egWaveEveryMs(c)`, each of
    `egWaveSize(n)`, within the legion's cap. Hunting Pack adds its own wave on its own clock;
  - the Harriers rise in the air beside the members in turn (`EG_SHADOW_SIDE_M` out, `EG_SHADOW_AHEAD_M` ahead, kept out of
    a passage's rock). Each shadows the member nearest it (every member in the hall) and flies about the rock. Over a
    platform it hovers at its member and never bites; it bites only a member on an island or a plate;
  - from the Shade every other wave is led at half by Divers. They rise over the island or plate the leading member
    stands on or comes to next (`egIsleAhead`), circle it `EG_DIVER_WAIT_R` out, and dive their member once that member
    stands on it: ground at least `EG_DIVE_GROUND_M` (6 m) across, within the Dive's 10 m;
  - no die is drawn, so the breach's rolls after a span stay where they were;
  - on a span a member is aimed at only standing on the fight ground (`EG_SPAN_GROUND_PAD_M`). The span stage now ends as
    every trial does: its blows stepped and its words said (`ehp`, `etx`, `emk`, the whole fight every 2 s).
- **A BLOW FROM THE FIGHT GROUND** (`egBlow`; sections 11.7 and 21). A pose off it (`EG_STRIKE_PAD_M` about its plan, by
  the feet's height) strikes nothing: a step, a ledge, a side span, the top of an arch's wall. An object standing off the
  floor (a false wall in its alcove) is struck from beside it, as before. The relay now reads a pose's height:
  `server/src/index.js` `_egPose` and `_egBodies` carry `y`.
- **THE HUNT** (`huntStep`; section 11.7):
  - in a hall whose trial is one fight on its floor (`EG_HUNT_KINDS`: a Rift-Yard, a Rampart, a Proving Walk, an
    Athenaeum, a Court), a member who has stood on the fight ground this hall and is off it for more than
    `EG_HUNT_AFTER_MS` (6 s) is HUNTED;
  - the member is marked (mark 7, *Hunted* - the HUD's `EG_MARK_NAMES` held its word unread) for `EG_HUNT_MARK_MS` at a
    time, and unmarked back on the floor or at the door;
  - every Harrier goes to the hunted first: along the graph to the floor's edge nearest them, then through the air. Where
    no Harrier stands, a pair (`EG_HUNT_RAISE`) rises there, once a hunt;
  - a hunting Harrier's Bite carries `hn`, and the census judges it off the floors for that member alone.
- **THE CENSUS** (section 21; EG-H1's departures 3, 10 and 11 closed):
  - a Falling Wall's and the Collapsing Tube's fallen segments hold nobody (`net/egFair.js` `egSupportAt`'s `hw`; a fair
    trail keeps its hall's wake). Feet on one (`egFallenAt`) owe the count a cast-back, the screen's cast forward;
  - a traversal hazard is judged while its part burns, at the feet, wherever a body stands (`net/bossRef.js`
    `judgePlace`). A fire fall is seen (fire, nought counted); the Forge Line's hammers are counted at the screens' 20%;
  - THE DRAINS (`censusDrains`): a soul-wisp binds a member on a fight floor within 3 m and drains 3% a tick from a second
    in. It lets go at 6 m or after 4 s and binds again only `EG_WISP_AGAIN_MS` (6 s) later - the screens' `wispStep`. A
    Wraith's tether drains its member each tick within its 8 m;
  - THE CENSUS'S VESTIGES (`egCensusDr`): Challenger's Oath on a lord's blow (`EG_OATH_DR`); Bastion within 6 m (the
    strongest, 2% more for each other holder, 6% over it at most); Steadfast Line with three allies within 8 m; Immovable
    still a second on a fight floor (25%). Together they are capped at 30% (`EG_DR_MAX`), on blows. Featherstep's lighter
    cast-back (`egCastBackCost`, `EG_FEATHER_CAST`);
  - a lingering blow (a charge's run, a burning bridge - its `sp`) catches a body that steps in while it lasts, the
    screens' own verdict (`judgeShapes`). Before, it was judged at its landing alone;
  - every hit says its landing, thrower and name (`at`, `o`, `nm`), and the census keeps who each blow caught by its name
    on the fight (`F.cg`).
- **THE FEATS** (`net/egFeats.js`; section 19's examples). Grath's signature is the page's own: *Unsinged*, felled with
  no member caught by a burning bridge (`EG_FEAT_BRIDGE`, `egCaughtBy`) once the bridges have burned.

**Departures, said plainly.**

1. The walk graph is derived from the spec, not carried as the fragment record's `graph` (section 11.5). The spec gains
   no field, so `EG_SPEC` and `EG_LAWS` stand. EG-ZC's bump for the fragments is its own, and nothing here asks for one.
   Its nodes are only those the geometry implies. A passage's two floors are two regions; a chamber's ring has no node
   inside its floor.
2. The Harriers' body-block is a Harrier hovering at its member, not a collider: the motor collides with no add.
3. The fight ground beyond `spec.fl` is a span's islands and plates and a Rampart's pillars and winch plates. Bridges
   and side spans stay traversal ground. On a span a member is aimed at within 0.5 m of it; elsewhere the fight's old
   4 m stands.
4. The hunt is for the halls whose trial is one fight on its floor, and only after the member has stood on the fight
   ground this hall:
   - an approach crossed is never hunted;
   - a Deepway (its passages crossed between floors) and a Brink are not hunted;
   - a span has its shadows instead.
   The mark's 30 s is renewed while the hunt lasts.
5. An object standing off the fight floor (a false wall) is still struck from beside it: a seal in a wall is no fight.
6. The census's Vestiges:
   - the reductions are summed and capped at 30%, on blows alone (not hazards, drains or cast-backs);
   - Featherstep is applied though section 21 leaves it to "the rest restores it": its cost is a number the relay holds;
   - Iron Footing needs no term: a push it resists makes no cast-back, and the poses say so.
7. The Forge Line's hammers count their 20% (the screens' share), not a cast-back's cost.
8. Only Grath's signature reads a catch: the page gives no other place's example. The Spellmaster's "no rune missed"
   is its none-failed. The others keep their beats.
9. A span's Divers dive ground 6 m across within their lane. A Diver in any other hall keeps its old rule (its member
   3 m inside the floor).

**The four hosts.**

- `src/scenes/world.js` - FLAGGED: not touched. This is relay law, and the screens draw what the relay says (the span's
  bodies, the `Hunted` mark on the HUD's marks line). Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED: unchanged.
- `src/scenes/dungeonContext.js` - FLAGGED: unchanged.
- `src/scenes/exterior.js` - FLAGGED: offline (section 28).

**Pins.**

- `test/egz_legion.test.js` (7): the span's legion, the Divers, the walk graph, the fight ground and the hunt, the census,
  the feats, and the real Room.
- `tools/mutants/egz_legion.json` (56, every one dead). Two survived the first run and were killed by new assertions:
  - a lip climbed: both drop branches folded into one line, and a walker from under a balcony's lip;
  - the view without its islands: the span test's island moved to one no passage floor reaches.
- Re-aimed by content and judged again, every one dead:
  - `egint.json`'s six (the census's cast-back, the judge's stamp, an element's share, the wait, the floor, a hazard's
    element);
  - `egeco.json`'s Grath record (EGECO-a-bridges-catch-forgiven);
  - `int_lane3.json`'s INT11-CHARGE-TWICE (its own line made the only copy).
- Judged again over the files this slice touched: `egint.json`, `egfull.json`, `egfrag.json`, `egeco.json`,
  `egplay.json` and `egspan.json` (210, every one dead).
- PIN MOVED: `test/egeco_feats.test.js` (Grath's signature).
- `RELAY_VERSION` `world197` was rehashed with `net/egWalkGraph.js` in its graph. `ACCOUNT_VERSION` stays `acct121`.
- New in `src/`: `src/net/egWalkGraph.js`. The Port-Ledger's row is the lead's.

### EG-ZF - 2026-10-12 - THE RECAP WHOLE AND THE ACCOUNT'S MEMORY

(Mac: *"I said I want everything"*.) Closes EG-G1's first and fourth departures, EG-E2's mailbox send, and the gap
audit's rows 12, 13, 15 and 21: the damage chart at a lord's fall, each member's share and healing on the recap, the
recap's board line, the first-time lines once an account, and First of the Spire's letter.

**What shipped, by piece.**

- **The director's count** (`net/egTally.js`, new, in the relay's bundle; section 27.6). Every number is the relay's
  own count, never a screen's:
  - A Court's wake lays a chart on its fight (`F.tl`, `egTallyWake`). Each member's row holds what they dealt in the
    Court, the lord's part of it, the blows that landed, the heaviest, their falls there and what they healed in
    others. A blow is counted as egBlow believed it (`got`, after the gate's hand and purse and the lord's weight).
  - Each member's damage and healing over the whole breach sit on the member's record (`m.dt`, `m.ht`).
  - A companion's heal is said by its receiver. The healer is named by its peer id, which the room turns into the
    healer's account. It is credited to the healer, never to the receiver itself, a stranger, or one who never
    entered. It is believed within the receiver's heal bucket, which is the gate's (GATE-HEAL: a whole reference health
    refilled over `HEAL_REFILL_S`, `HEAL_DEPTH_X` deep). A fallen member's word is still heard; a forsaken one's, and
    any after the end, are not.
  - What was believed also mends the receiver's count, as an ally's mend and never out of its own budget
    (`net/egBrain.js` `egHeal` - `bodyHealed`, the gate's AUDIT INT11 law).
  - None of it buys anything: no receipt, no share of a Redoubt's earners (the director keeps its own `dc`), no threat.
- **On the wire** (`net/wire.js`).
  - The Redoubt carries the chart (`rd`'s `dm`): `[sub, level, dealt, on the lord, blows, heaviest, falls, healed]`,
    at most a company's rows, most dealt first, ties in the company's order. Every member with a part, and every member
    standing in the Court at the fall, has a row.
  - An end that came at the lord's fall (a Rehearsal's, at Redoubt 1) carries its chart on the `end`. An end anywhere
    else (a tear, say) carries none.
  - Every `st` and the `end` carry each member's part (`ds`, `[sub, dealt, healed]`).
  - A bad chart is no chart, never no Redoubt. A state with bad tallies is no state, as its runs are.
  - The member's `heal` is the gate's own word, validated by `validGateIn`'s law. The breach's room hears it
    (`server/src/index.js` `_egFrame`).
  - `net/egLink.js` keeps `ds` and the last fall's `chart`.
- **The chart at a lord's fall** (`scenes/egClient.js`, `ui/egHud.js` `egChartFell`).
  - It is the gate's own chart (`ui/gateDamageChart.js`), shown a beat after the Redoubt for its minute, to the side,
    in its one slot.
  - The crystals' column is the lord's part (*Lord*). The Healed column shows where anyone healed. My row is marked.
    The sub line names the lord: *Grath has fallen - a company of 3*, or *The Twin Lords have fallen*.
  - It is drawn from the online frame in every mode, so an end's chart outlives the walk out. Once its minute is up it
    is drawn no more, so it never takes the slot from a gate court's chart.
- **The recap's share and healing** (`ui/egHud.js` `egRecapModel`, `egRecapMemberLine`). Each member's row shows their
  share of the company's damage, in the gate chart's words, and what they healed where any:
  *II Ann - stood to the end, 1 fall, recall spent - 25% of the damage, 1,250 healed*.
- **The heal word out** (`scenes/egClient.js` `healedBy`). What my companions' spells healed in me is owed to each
  caster by peer id. It goes to the room once a second (`EG_HEAL_SEND_MS`) in whole points, the fractions kept for the
  next, inside the Spire alone.
- **The recap's board line** (`server-account/src/egHonours.js` `egStandingOf`; `ui/egHud.js` `egBoardLine`).
  - An end's claim answers the member's standing (`board`). Where the breach ranks on the Descent, that is its
    company's bracket and rank this season: `{ k: 'descent', br, rank }`. The company is the accounts that have
    claimed an end of the breach so far; if the same company has a better breach, that breach's place is given.
  - Otherwise it is the account's own rank on the Depths this season: `{ k: 'depths', rank }`.
  - A Rehearsal, or an end with no hall cleared, answers none. A re-claim answers the same.
  - The client puts the line on that breach's recap, the one standing or the one kept (`egRecapBoardKeep`), and on
    one still to be made: *The Descent, the Few: 14th*, *The Depths: 31st*.
- **The first-time lines once an account** (section 27.7).
  - The account keeps the lines it has been shown (`players.eg_first`, a bit a line in `EG_FIRST_KEYS`' order, the
    Rehearsal's after them). `POST /v1/eg/first { bits }` ORs them (`egFirstSay`) and answers `{ first }`; a guest is
    refused `guest` (403), and anything outside sixteen bits `bits` (400). `/v1/eg/keys` answers `first`.
  - The client reads the account's bits over the device's own (`ui/egBeats.js` `egFirstOver`), together with the lines
    this screen showed since. A line newly shown is kept on the device and told to the account; the next balance's
    answer carries a word that was lost.
  - Where no account answers, the device's `eg.first` holds.
- **First of the Spire's letter** (`server-account/src/egHonours.js` `EG_FIRST_POST`, `egFirstPost`; section 19).
  Hour's First's letter was the operator's send to names frozen the day they were known (`tools/sendServerPost.mjs`
  HOURS_FIRST, migration 0094). First of the Spire's names are not known until its company comes, so the list is the
  send:
  - an account `EG_FIRST_HANDLES` names is written its letter at its next balance's read, once (0093's one-a-send
    index);
  - the words are fixed, the developers', with no item: *Your company was the first ever to take Redoubt 10 of the
    Battlespire. The Spire remembers.* The title and Firstlight are the account's by the list;
  - `post.js`, `net/postLaw.js` and the Accounts arc's SERVER-POST record now say so.

**Where it departs from this page, said plainly.**

1. The chart shows at a Court's fall (the Redoubt, or a Rehearsal's end) and nowhere else. A Proving Walk's champion
   and a Deepway chamber's are not lords, and no chart is laid for them.
2. The chart's sub line is the Spire's own words over the gate's model. The gate's *n challengers* has no Spire
   meaning.
3. The heal word only reaches the room once the host feeds it. FLAGGED below: `scenes/world.js` must hand the client
   the ally cast's healing. Until then the Healed column and each member's healing read 0.
4. The board line is the end's claim's answer, not the herald's: the herald posts to Discord and hands the client
   nothing. A recap made before its claim answers shows the line when the answer lands.
5. First of the Spire's letter is written by a route a player reaches (`/v1/eg/keys`), not by the operator's
   workflow. Only the operator's list chooses who gets it, and its words are fixed here.
6. A first-time line shown on a device signed in as a guest stays the device's. A guest holds no Weir Key and enters
   no breach, so none is ever said.

**The four hosts.**
- `src/scenes/world.js` - FLAGGED (the lead's). `online.onCast` owes the Spire the ally cast's healing, beside the gate
  court's: `egClient?.healedBy?.(id, healed)` next to `gateCourt?.healedBy?.(id, healed)`. Nothing else is owed: the
  chart and the recap draw from the client's own online frame, and the account door (`accountEg(...).first`) is the
  client's. Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED. It has nothing to wire: the chart is drawn from the online frame in every mode.
- `src/scenes/dungeonContext.js` - FLAGGED, for the same reason.
- `src/scenes/exterior.js` - FLAGGED as section 28 has it: offline, no breach.

**Pins.** `test/egz_recap.test.js` (10). `tools/mutants/egz_recap.json` (99, every one dead). PIN MOVED:
`test/egplay_relay.test.js` (`EG_KINDS` gains `heal`), `test/egplay_service.test.js` (the keys' answer carries
`first`) and `test/accountworker.test.js` (`players.eg_first`). Two records re-aimed by content, both still dead:
`egarch.json`'s EGF-the-relay-key-withheld (the keys' route hands `env` on) and `eglook.json`'s EGLOOK-client-look-kept
(`away()` puts the chart away after the look). `RELAY_VERSION` `world197` is re-hashed with
`net/egTally.js` in its graph (unshipped). `ACCOUNT_VERSION` stays `acct121`: 0111 is extended, unshipped. The
Ledger's ELITE-GATES row gains `net/egTally.js` at the lead's merge.

### EG-ZG - 2026-10-12 - THE TELEGRAPHS AS WRITTEN

Closes the gap audit's rows 22, 23, 24, 27 and 30 (Mac: "I said I want everything"): EG6b's telegraphs per fight
floor (section 11.7), section 25.5's grammars and section 25.2's Spire pools, what THE QUIET COMPANY still owed
(section 25.4), the Shade's rim lights (section 25.6) and WEIGHT (section 25.8) - EG-G2's "not built" for the allies,
the Vestige ring and the rim lights, EG-G1's eighth departure for the shakes, and EG-H1's ninth for the client's
arrow. The law is one new module, `world/egTelegraph.js`; the gate's own telegraph draw is unchanged byte for byte.

**What shipped, by piece.**

- **THE TELEGRAPHS PER FIGHT FLOOR** (`world/egTelegraph.js` `egFightFloors`, `egClipTris`, `egShapeYs`,
  `egFloorPlan`; `render/gateTelegraph.js` `drawFloors`).
  - Each fight floor (`spec.fl`) is triangulated once a hall: a disc into its drawn rim's 48 sides, a lane into its
    rectangle and two round ends, the floor test's own capsule (`net/egLaw.js` `egOnFight`).
  - Each frame, each shape goes on every floor it covers. The floor's triangles are clipped on the CPU to the shape's
    bounds (`telegraphBounds`, Sutherland-Hodgman, fanned back to triangles) into one buffer, uploaded once.
  - A shape lands only at the heights the relay judges it at: the floors whose plan holds its anchor within 1 m (its
    centre, a lane's two ends, each of a discs' points - `net/bossRef.js` `floorsUnder`'s rule). A blow on the court
    never draws on the balcony 3.6 m over it, whatever its bounds cover. The whole floor's and the spokes' draw on every
    floor.
  - At most 32 shape-floor draws a frame (`EG_FLOOR_DRAWS_MAX`), taken in THE TELEGRAPH BUDGET's order: mine and every
    shape whose field holds my feet first, then the blows by `egShapeOrder`'s rank (`sh.order` - a CHECK's havens keep
    their CHECK's), then the nearest my feet. Mine draw last, on top.
  - The Spire's vertex stage (`TELEGRAPH_VS_SPIRE`) is made from the gate's text by asserted swaps, as EG-G2's fragment
    stage is: a floor's triangle is read in the court's frame at `uFloorY` plus the lift. With nothing set it lays the
    gate's quad where the gate lays it.
  - `drawFloors` lends each floor's triangles to the gate's own `draw` for the call (its vertex array, its count, and
    the floor's circle as its court), so the line, the fill, the fog floor and every grammar are the gate's code. The
    quad and the uniforms are put back after.
  - A shape with its own surface draws its quad at that height (`sh.y`): a span's Vent and Pendulum, a traversal hazard
    (a fire fall, the hammer line), a Vestige's ring, a Drop's dust. In a hall with no fight floor every shape is the
    quad over the hall's court, as before.
- **THE GRAMMARS** (`TELEGRAPH_POOL_SPIRE`, pools laid into the Spire's fragment stage by one more asserted swap).
  - *A Spire pool* (pool 4): burning ground takes the band's ramp darkened (`egPoolRgb` - the fire-sea's, the Cairn's
    slate violet, the Shade's quicksilver, the Wellhead's molten, at half), its element's grain, the floor darkened
    under it, and a dashed rim in the palette's danger. Never `POOL_COLOR`, never blue.
  - *The pull-apart tether* (pool 5): the Wraith's Drain, the Blood Tether and a soul-wisp's hold on me. A red line the
    pair's length, chevrons pointing out from its middle and flowing outward, and a tick across it at the break. It
    thins toward the break (`egPullLook`). One of mine gone at 85% of its break or more snaps with the crystals'
    shatter, pitched high.
  - *The stay-close tether* (pool 6): Morvayn's Chaining. Chain links, every other turned; slack and dim under 6 m, taut
    and throbbing from 6 to 8 m (at most 3 Hz - `egChainLook`). Pinned: the two patterns never share a lit place.
  - *Chained*: *Chained to Mira - 6.8/8 m* stands under the crosshair (`egChainWords`).
  - *The peril arrow* (`egPerilOf`). It finds the soonest blow still to land on my feet - the relay's blows, a Rampart's
    told vents and the fragments' told hazards - never a whole floor's. Its way out is searched along the gate's 24
    bearings over MY fight floor only; a bearing stops at a wall, an open edge or another floor's height. A bearing that
    also clears every other pending shape is preferred over a nearer one that does not. It draws through the gate's own
    readout (`ui/gateGroundView.js`): *Smash - move!*, the rim rising in the palette's danger, the arrow turned as the
    screen is. Under a CHECK with no light in reach the words are its order, *Stand in the light!*, with no arrow.
    Nothing shows on traversal ground, where no blow lands.
  - *The marks over heads*: each mark is its own sigil in Dagon red (`EG_SIGILS`, `ui/egSpireHud.js`
    `EG_SIGIL_PATHS`): a hound's tooth, a gem with its seconds, a flame and a snowflake with their rims tinted, a chain,
    a cage, the challenge's ring, an eye, a knot.
    - A companion's sigils hang over their head where the camera sees it (`drawEgSigils`, placed by the fight).
    - Mine stand on my HUD as sigils, their names given to a screen reader. The HUD's line of text is gone.
  - *The Eclipse*: each moon-shaft is a haven from 6 s out (as before). The HUD's chips show *The Eclipse - 5*
    (`egEclipseChip`). A wind rises once from 3 s out (Daggerfall's AmbientWindBlow1), and the toll sounds once at the
    strike. Over the last 2 s every fight floor darkens, to 62% at the strike, the moon-shafts kept (pool 8,
    `egEclipseDark`).
- **THE QUIET COMPANY'S REST**. During a trial the Spire's client says so through one seam (`ui/egAccess.js`
  `egAllyLookSet` / `egAllyLook`, from `egQuietCompany`'s 60% and no light). The spell engine every host shares reads it
  for another player's spell (`scenes/hostMagic.js` `spellVisual`):
  - the Morrowind casting effects and bolt draw at 60% (`scenes/mwMagicFx.js`; `render/vfxGpu.js` `vfxFade` - the
    quads' alpha where the blend reads it, all four where it adds the source as it is);
  - the classic missile flat draws translucent (the billboards' blended phase, `CONCEAL_MODE.reveal`);
  - its impact is the classic flash alone, translucent (`scenes/hitEffects.js` `showImpactFlash`'s `conceal`) - no
    bloom, no chunks, no burst in light, no camera kick;
  - a touch throws no spray of light, and a peer's Light spell is put out (`peerCandles`).
  - A Vestige aura (Bastion, the Spire's Standard - `egAuraHolders`) is one thin Battlemage-blue ring of 0.6 m at each
    living holder's feet, on the ground they stand on (pool 7).
- **THE SHADE'S RIM LIGHT** (`egRimOf`): in the Shade every foe's outline glows moon-silver. The glint is the wind-up
  glint's own (`systems/hitFlash.js` `setBatchGlint`): the sprite's outline, and the body lifted a little toward it. The
  dormant Lurker and any friend are left dark.
- **WEIGHT**.
  - The heavy blows shake the screen at their landing (`EG_HEAVY_SHAKE`, `egHeavyShake`): Savage, Gore and Whirl within
    10 m, Smash and the Maul within 8, by the gate's `LAND_SHAKE` law, never for a feint.
  - The shake goes through the port's one shaker (`betterAmbience.weaponKick`, under the player's maxShake). Reduced
    motion (the row or the system's) stills it, and Technique camera motion scales it (`egShakeMotion`).
  - My own hits flash a foe fully, anyone else's at 0.4 (`egBodyFlash`, the gate's `GATE_FLASH_COURT`). The relay's word
    of a drop within 400 ms of my own blow is my blow's echo, never a second flash.
  - A Drop the course asked for lands on a designed thud and dust, never on a hop on its landing (`egDropUnder`). The
    thud is Daggerfall's BodyFall and DungeonDoorClose, pitched down; the dust is a broken ring thrown out across the
    landing. While I fall onto one, the span says so (`scenes/egSpan.js` `overDrop`) and the dungeon arm plays no
    FallHard grunt for that landing.

**The four hosts.**
- `src/scenes/dungeonContext.js` - WIRED: its hard-landing branch asks the span's `overDrop` first. Nothing else moved:
  the fight's floor plan, the grammars and the HUD are the breach client's, drawn in the pass the arm already calls
  (`egClient.drawPass`).
- `src/scenes/world.js` - FLAGGED, nothing to wire: the fight's two new seams default to what world.js would hand it.
  `shake` is the port's one shaker (`betterAmbience.weaponKick`, imported by the fight as `scenes/hostMagic.js` imports
  it). `yaw` is read off the view the world pass already hands `drawPass` (`egViewYaw`, world/mat4.js lookAt's -z).
  Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED, nothing to wire: the span rides before the motor there already, so `overDrop`
  is set before the landing it speaks for.
- `src/scenes/exterior.js` - FLAGGED: offline, no breach (section 28).

**Departures, said plainly.**
- **Done another way:**
  - fight floors are discs and lanes in the law (`spec.fl`), not polygons, so a floor is triangulated as the floor test
    reads it: a disc's 48 sides and a lane's capsule;
  - a lane floor's circle (the court the pass clips by and the whole floor's line follows) is the one through its ends,
    so on a lane floor the whole floor's line stands only at its two ends;
  - "the screen darkens" is the fight floors darkening, every moon-shaft kept. Walls and sky stay as they are: that is
    the telegraph pass's own floor, and no new pass was added;
  - the chain's chip, *6.8/8 m*, stands in the words under the crosshair beside *Chained to Mira*, not as a chip of its
    own;
  - an ally's impact is its classic flash alone, translucent. The bloom, the chunks and the burst in light are not drawn
    at 60% but left out, since they are the impact's own light;
  - an ally's Morrowind particles that blend nothing (opaque streams) stay whole: their alpha is never read.
- **Not built:**
  - `port:allyEffects` stays off the shelf. It governs allies' hit numbers alone, and the port draws none
    (`ui/hitNumbers.js`).
  - The Eclipse's toll is the bell's, not a band's own made sound.
- **Not verified without a browser and the game's data:** nothing was played in the live game. The shaders were run
  through `test/glsl.mjs`, the pass through a recording GL, and the fight against the director's own words.

**Pins.**
- `test/egz_telegraph.test.js` (13).
- `tools/mutants/egz_telegraph.json` (74, every one dead). One survived the first run - the sigils hung at a
  companion's eye rather than over the head - and was killed by pinning their height (EG_SIGIL_UP_M over the eye).
- Judged again over the files this slice touched: every record of `eglook.json` (12), `egpres_hud.json` (34),
  `egfrag.json` (11), `egspan.json` (9), `egint.json` (3), `mwspellfx1.json` (4), `fieldgun20.json` (2) and
  `egplay.json` (1) aimed at the fight, the HUD, the shelf, the span, the Morrowind effects or the flashes (76, every
  one dead).
- PIN MOVED: `test/audit26_render.test.js` F033 reads the impact flash's spawn, its entry and `showImpactFlash` with
  `conceal` in their tails (null by default - an ally's flash translucent in a trial); the blood defaults and the
  unscaled, unnudged flash are pinned as they were.
- No other pin moved. EG-G2's lab (`src/tools/spireLab.js`) still draws through the pass's plain `draw`, which is
  unchanged. `RELAY_VERSION` is untouched (nothing in the relay's graph moved), and `ACCOUNT_VERSION` stays `acct121`.
- New src module for the Ledger's ELITE-GATES row: `src/world/egTelegraph.js`.

### EG-ZH - 2026-10-12 - THE HALL'S SOUND, THE CAMERA, THE ART AND TOUCH

Closes the last of sections 11.6-11.9, 15, 25.1, 25.8, 26 and 27.8 that no layer built: the hall's reverb, the mix's peers
and Watchfire's tell, the camera in rock and the fragment's own clamp, Daggerfall's own fire in the Caverns, the death saves
that are no timers in the Spire, the Weir Key's own picture, and touch on the spans. EG-G2's "not built" lines for the
peers, the tell, the reverb's crossfade and TEXTURE.356 are closed here.

- **THE HALL'S REVERB** (`systems/egReverb.js`, new; `systems/audio.js`; `systems/betterAmbience.js`; read by
  `scenes/egClient.js`).
  - The law: each fragment's `reverb` (`net/egFragLaw.js` EG_FRAGS, carried on the hall spec's `frags`) as the engine's
    preset (`EG_REVERB_PRESETS` - Cave, Stoneroom, Quarry); a hall's own open ground Quarry (`EG_REVERB_OPEN`); a
    fragment's footprint its z-span and its reach across (a passage its cave's half width, a chamber half its span);
    `egReverbZoneAt` enters a zone at its edge and leaves it only `EG_REVERB_HYST_M` (1 m) past it.
  - The engine: `holdReverb(owner)` takes the zone (Better Ambience's zone off the send, and `setReverb` refused while it
    is held); `reverbZone(live, idle)` makes two convolvers behind the veil, each preset's impulse made once for the hold
    and a slot already holding its preset kept; `reverbFade(preset, seconds)` crossfades them over `EG_REVERB_FADE_S`
    (0.4 s), a third preset taking the idle slot on its cached impulse; `releaseReverb(owner)` (the holder's word alone)
    frees both convolvers and every impulse.
  - Better Ambience yields while the zone is held and forgets its cache, so its first frame after the release asserts its
    wish again.
  - The client holds it while I stand in the breach, and through a swap or an answer's step under way; the hall my feet
    stand in is made as it changes (a swap, a pull) and turned at a fragment's mouth; it is let go on the walk out and the
    first frame out of the breach.
- **THE SPIRE MIX'S PEERS AND WATCHFIRE** (`systems/egMix.js`, `net/peerFx.js`, `scenes/egFight.js`; the scope in
  `systems/audio.js`).
  - The engine's `scaled(gain, fn)`: every one-shot (`playOneShot`, `play3d`) made inside it at `gain` times its own
    volume, nested scopes multiplying.
  - `net/peerFx.js` `peerHeard(run)` and `setPeerSoundScope(fn)`: every peer sound plays inside it - the peers' blows and
    hurts (the fx player), the walkers' steps, swings and cries (`net/remotePlayers.js` `peerSound` and the cry), their
    climbs (`net/peerClimb.js`).
  - The mix's `peers(on)` hands the scope in at `peerVolume` (4 dB down); the fight turns it on while a hall's fight runs
    and off on `leave`.
  - WATCHFIRE'S TELL (`EG_TELL_CUE`): the gate's sting (the parry's ring) at `EG_MIX.watchfirePitch` 1.4, played once a
    told blow as its outline first shows, where it will land (`egToldAt` - its first stamp with an origin, else my feet).
- **THE CAMERA IN ROCK** (`player/mwView.js`): `spireCameraEase` and `spireCameraFrame` laid on both lanes' eyes - in at
  once against a wall, back out at most the free distance each `SPIRE_CAMERA_EASE_S` (0.25 s), never past where the lane's
  own casts allow, along the line from the focal; a first-person frame a cut. The lanes' casts still decide the distance
  over the fragments' collider proxy (the drawn rock's inner envelope), so the camera never stands in visible rock. The
  client says when (`setSpireCamera` - alive in the Spire).
- **THE FRAGMENT'S OWN CLAMP** (`world/egHall.js` `egFragZones`, `egFragZoneAt`, `egFragKeep`, `egFragArena`; set by
  `scenes/egClient.js`). Each passage's cave and each fragment chamber's ring (a trial's own walled floor is never a
  fragment) extruded to its ceiling: the walls hold the feet a capsule inside, the head under the vault (the motor's
  `ceilAbove`); the mouths, an alcove's doorway, an open passage's sides and a ring's gaps are open edges; a body is a
  zone's within 1.5 m of its footprint (`EG_CLAMP_SLACK_M`). The client sets it as `player.arena` while I stand in a
  fragment and no other arena holds me (the world host sets those first each frame), and takes back only its own.
- **DAGGERFALL'S OWN FIRE** (`formats/baseImageFile.js`, `world/emissiveTextures.js`, `scenes/dataPipeline.js`).
  - `getFireWallColors32` ported verbatim from DFU's BaseImageFile.cs, on Unity's Color32 law in single precision
    (`unityColor32` - the Color to Color32 conversion, `Mathf.Round` half to even; `unityColor32Lerp` - Color32.Lerp, t
    clamped, the byte cast truncating), read from UnityCsReference 2019.4 (DFU builds on 2019.4.41).
  - `FIRE_WALL_COLOR` (0.706, 0.271, 0.086 - "Average of dim frame (0)") and `FIRE_WALL_SCALE` (0.3), TextureReader.cs:312
    and :315.
  - Both upload arms take it for TEXTURE.356 over the classic albedo (TextureReader.cs:303 and :309 - a pack's picture
    over the record still lights from the reference texture), and never on a stand-in. `test/audit39_render.test.js`
    re-pinned (PIN MOVED).
  - Tested on synthetic bytes - through a TextureFile's own palette and getColor32, and through the real pipeline with a made
    TEXTURE.356 in its archive table: Daggerfall's data is not here.
- **THE CAVERNS' FIRE FALLS** (`world/egHall.js` `egFireFallFlames`, `EG_FIRE_FALL`; drawn by `scenes/egFight.js`).
  TEXTURE.356 record 0 stands on each fire fall's line across its passage, 2 m wide a flame and as tall as the passage,
  while the fall burns; its frames turn at the billboards' rate (`render/flatAnimation.js` GENERAL_FPS), each uploaded once
  through the pipeline's frame door. The archive is asked once; with no data there are no flames and the telegraph still
  tells the fall.
- **THE DEATH SAVES AT A REDOUBT** (`systems/lootPowers.js`; the door in `systems/sigilSetPowers.js`). Divine Grace and
  the Ghost-King's Vigil spent in an `eg:` room are held past their timers to the next Redoubt taken, as EG15 held the sets'
  (`lootSpireHeld`, `LOOT_SPIRE_SAVES`). Their chips read *Redoubt* and the round says nothing. The Redoubt recovers both,
  held or still on a timer, through `registerSpireRedoubt` (called by `spireRedoubtTaken`); the breach is the same host
  word (`spireRoomNow`). Out of the breach, or in another, their own timers govern.
- **THE WEIR KEY'S OWN PICTURE** (`world/egKeyArt.js`, new; `world/pseudoArchives.js` `EG_ARCH_BLOCK`;
  `systems/weirKey.js`). A Battlemage's key in the Galleries' gold leaf, its bow ringing a Battlemage-blue stone lit from
  within, a collar, a shaft and a two-step bit, 32 x 22, painted in code with the Hour's paint box. It is kept at the
  arch's block's second number (38282 - the page's "the arch, the key and the beacon": 38281, 38282, 38283), registered in
  the block's entry. The key's row names it in place of TEXTURE.211 record 50, and `systems/weirKey.js` puts it on the
  texture door at its import as its archive's stand-in, so every item door draws it.
- **TOUCH ON THE SPANS** (`ui/touch.js`; the client's word, `setTouchSpire`). Inside an Elite Breach alone:
  - a Jump press that keeps sliding past the tap radius looks, with the drag's own gain;
  - an upward flick on the look half (`EG_FLICK_PX` 40 px within `EG_FLICK_MS` 150 ms) jumps, once a finger (the Jump key
    held two frames so the host's frame reads it);
  - on the spans (the Spire's traversal ground, `onTraverse`) the stick runs at full throw: Run at any push past the dead
    zone, and the analog reading at length 1.
  Out of the Spire the layer is TI2's.

**The four hosts.**
- `src/scenes/world.js` - FLAGGED: untouched. Every seam is the breach client's (`scenes/egClient.js`, built there) or a
  registry its modules set (`setSpireCamera`, `setTouchSpire`, the sets' door). The clamp rides the online frame's order:
  the duel's frame sets `player.arena` before `egFrame` runs. Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED: untouched. The fire falls are the fight's billboards, and the camera's ease rides
  `mwViewFrame`, which the dungeon arm already calls.
- `src/scenes/dungeonContext.js` - FLAGGED: untouched.
- `src/scenes/exterior.js` - FLAGGED: the bench is offline and holds no Elite Breach. Its `mwViewFrame` and touch layer
  meet neither Spire branch.

**Departures, said plainly.**
- **Done another way:**
  - a hall with no fragment of its own is heard as open ground (Quarry), where the page names only the fragments'
    presets;
  - the reverb's two slots take a third preset by rebuilding the idle convolver on the hold's cached impulse - nothing is
    synthesised within a hall, but a convolver node is made at that mouth;
  - the reverb is let go on the first frame out of the breach or on the walk out, never during a swap's own step;
  - the fire falls are billboards (camera-facing, the fight's own batches) standing on the fall's line, not a mesh curtain
    in the circle's model, so they burn only while the fall does;
  - the Weir Key's picture is a stand-in of its archive on the texture door (its build answers the painted picture), the
    port's other painted art's way.
- **Not built:**
  - `hit` and `ahit` refused off the fight floors, and the Harriers' hunt of a member off them for more than 6 s - the
    relay's half of section 11.7, gap row 7;
  - the haptics and the pad's rumble of section 27.8 stand as EG-G1 built them.
- **Not verified without a browser and the game's data:** the reverb was heard by no ear (driven against a recording Web
  Audio graph); the fire falls were never seen with a real TEXTURE.356 (its frames' count and look are the player's data's);
  the key's picture was checked as texels, not in the inventory; the touch branch was driven on the stub DOM, not a phone.
- The Port-Ledger's rows are left to the merge: the ELITE-GATES row's new files (`systems/egReverb.js`, `world/egKeyArt.js`),
  and section C's BaseImageFile row, whose GetFireWallColors32 now ships.

**Pins.**
- `test/egz_sound.test.js` (7), `test/egz_art.test.js` (8), `test/egz_body.test.js` (9).
- `tools/mutants/egz_sound.json` (115, every one dead). Five survived the first run and were killed by new assertions: an
  impulse synthesised again, TEXTURE.356 asked twice in flight, the ground's colour, a trial's wall as a fragment's, and the
  flick's Jump never lifted. One record was re-aimed to a mutant the tests can see: the key's ground alpha, which `image()`
  already leaves clear, became the ground's colour.
- Re-aimed by content (mutantdrift): `audit0928_input.json`'s two U3 records (the stick's Run line), `egint.json`'s
  EGINT-the-told-never-drawn, `loot5.json`'s grace and vigil gates; `cardstouch.json`'s CT-gyro kept one site by this
  slice's own line's order. All six re-run, dead.
- PIN MOVED: `test/audit39_render.test.js` (the fire walls take GetFireWallColors32). `bible/06-Systems/Systems.md` counts
  517 modules. `bible/07-Rendering/Rendering.md` and `Rendering-Arc.md` say GetFireWallColors32 shipped.
- `RELAY_VERSION` untouched: nothing in the relay's import graph moved. `ACCOUNT_VERSION` stays `acct121`; no migration.

### EG-ZI - 2026-10-12 - THE DIRECTOR'S LAST RULES: THE TOLL, THE LATE WAKE, LIFELINE

Mac: "I said I want everything". The director's three rules no slice had built: section 10.6's toll (the pull moved
everyone at no cost), section 7's late wake (the gather waited `EG_ARRIVE_MAX_MS` for everyone, always) and section 21's
Lifeline in the census. It closes EG-ZB's departure 8 for Lifeline and the last of EG-H1's departure 10 (the census now
applies every Vestige section 21 names); both sentences are deleted above.

**What shipped, by piece.**

- **THE PULL'S TOLL** (`net/egBrain.js` `egTollOf`, `tollStep`; `net/egLaw.js` `EG_TOLL_STEP`, `EG_TOLL_QUARTERS`,
  `EG_TOLL_WAIVE_MS`, `EG_TOLL_KINDS`; section 10.6).
  - At a crossed hall's pull (`EG_TOLL_KINDS`: the Span, the Deepway, a Brink, the Proving Walk - the halls whose closing
    is the span's 45 s), each living member is told its toll before the pull's stage: `{k:'toll', q, h}`, to it alone.
  - `q` is the quarters of its road still ahead of its furthest fair point, every quarter begun counted whole, 5% of its
    health each, at most four. The road is the hall's +z from the arrival plate to the end plate, in whole centimetres.
  - Nothing is owed by a member who stepped through the door (`downH`), who stood at it on a fair trail (`A.atEnd`, set
    by `egPoseIn` where the crossing is measured), or who reached new ground in its last 15 s (`A.fnew`). Only the idle
    pay, and trying and falling short costs less than standing still.
  - A member the relay judged no fair pose of in the hall stands at the arrival plate: the whole road.
- **THE FURTHEST FAIR POINT** (`net/egFair.js` `farther`, `groundAt`; the trail's `far`, `fnew`, `seen`, `atEnd`).
  - After every pose of a fair trail, a held pose (still ground, a piece, the end plate) with no break since the last
    island moves `far`. A pose in the air, or one a broken stretch reached, moves nothing.
  - Still ground first stood on so this hall is new ground, `fnew` its instant: an island, a court, a balcony, a
    passage's floor, a walkway, a bridge, a stair. The arrival plate, a piece and the end plate are never new ground.
  - `groundAt` is `egSupportAt`'s own first reads, keyed (`a` the arrival plate, `e` the end plate, `d<i>`, `b<i>`,
    `l<i>`, `r<i>`), and `egSupportAt` now asks it. Its answers are unchanged, and the client's last island
    (`islandFrame`) reads them as before.
- **THE TOLL COUNTED** (`egCountHeals`). The room's census reads `toll` as it fans it, as it reads the fray's lash. The
  share is taken off the member's count as a blow is (`bodyStruck`, into the census's thousandths `cs[3]`), never the
  last of it. A witness's count is untouched.
- **THE TOLL PAID AND SAID** (`scenes/egClient.js` `payToll`, beside the void's `castBack`; `ui/egBeats.js`
  `EG_PRES_TEXT.toll`, `tollLine`; section 27.5's row: *The Spire pulls you down.* and the toll).
  - The screen pays it as it pays the void's cost: its share of my health through the host's hurt door, never the last
    of it, once a hall, and only inside the Spire.
  - It says it: *-15%* on the screen, as the cast-back's *-10%*, and *The Spire takes its toll: 15% of your health.* in
    the chat beside the pull's own line.
- **THE WIRE** (`net/wire.js`): `toll` joins `EG_RUN_KINDS`, its quarters held to 1..`EG_TOLL_WIRE_MAX` (4, pinned equal
  to the law's `EG_TOLL_QUARTERS` - wire.js imports no law of the Spire's) and its hall to the hall bound. It is never a
  member's word.
- **THE LATE WAKE** (`net/egBrain.js` `wake`, `arriveWait`; `net/egLaw.js` `EG_LATE_HALLS`, `EG_LATE_ARRIVE_MS`;
  section 7).
  - Each wake counts a living member late (`m.late`) when the hall woke before its `here`; a hall it said `here` in
    begins the count again.
  - The gather waits `EG_LATE_ARRIVE_MS` (10 s) after the pull, not 30 s, once every living member still owed has woken
    late in the two halls before. A member owed who is not late keeps the whole wait for the company.
  - The stage's end (`su`) is said as it moves: at the pull, at the next circle's first hall, and in the arrive stage as
    members arrive and only the late are left.
  - **A late `here`, heard.** A member the hall woke without says `here` when it reaches the arrival plate in the trial
    or the closing, and its trail is judged from there. Before, the director heard `here` only in the arrive stage, so
    a member who woke late was never judged in that hall: its door, its caches and its toll read no trail of it.
- **LIFELINE IN THE CENSUS** (`net/egBrain.js` `egHeal`, `egCensusDr`, `EG_LIFELINE_UNDER`, `EG_LIFELINE_MS`,
  `EG_HEAL_WORD_MS`, `EG_LIFELINE_LOOK_MS`; sections 15 and 21).
  - The room hears `heal` since EG-ZF (`egHeal`). A believed heal of a Lifeline holder's on a member under 30% opens a
    window on that member's blows (`m.ll`: `[from, until, share]`), at the healer's rank: 20, 30 or 40%.
  - "Under 30%" is read three ways: its count now, the count seen so at a beat (`egCount` notes `m.lowAt`), or its own
    word of its body saying so (`egBodyWord` notes it too). The look back is the heal word's second and a beat
    (`EG_LIFELINE_LOOK_MS`). The word comes up to `EG_HEAL_SEND_MS` (pinned equal to `EG_HEAL_WORD_MS`) after the heal,
    by when the member's own word may have stood its count up.
  - A healer counts only where its own credit rose: a heal not believed, the member's own heal, or a healer of no
    breach opens nothing.
  - `egCensusDr` spares a blow landing inside a window by the strongest window's share, inside the census's 30%. Windows
    a blow can no longer be judged in (`EG_TRAIL_MS`) are let go, and four are kept at most.
  - The stale comment ("the ALLY-CAST frame, which the relay forwards unread") is gone.

**Departures, said plainly.**

1. **The road** is measured along the hall's +z, on either road of a fork. The Low Road's bridges across and back (which
   `egCrossMinMs` adds to its bound) are no length of the toll's.
2. **Every quarter begun is counted whole.** "Each quarter of their road still ahead" is read as the page's first clause
   asks: a member pulled a step short of the end pays one quarter.
3. **The toll never takes the last of a member's health**: the screen keeps a point and the census a hundredth, as the
   fray's lash does. The page names no floor, and a toll that killed would be a fall mid-stair, which belongs to no hall.
4. **"A new island, or a fragment's node"** is new still ground of the support law, first stood on fairly this hall. The
   fragment record's `graph` is not carried (EG-ZB's departure 1), so a fragment's floors and stairs stand for its
   nodes.
5. **The halls tolled** are those whose closing is the span's (`door`'s own group): the Span (section 7), the Deepway
   (section 8.8), a Brink and the Proving Walk, whose roads are crossed in the same 45 s. A fight's and a Court's pull
   costs nothing.
6. **A member never judged in the hall** (a socket that sent no pose there since its `here`) pays from the arrival
   plate. The fair trail believes such a member for a credit; the toll, which is a cost, does not.
7. **"Woke late"** is the hall woken before the member's `here`. "The wait for them" is 10 s once every member still owed
   is such a one. The count runs on across a Redoubt: a Court is a hall.
8. **The late `here`** is a change to integrity, done here because the toll reads the trail. A member who woke late is
   now judged from the plate, where before nothing it did in that hall was.
9. **Lifeline's window** runs from the heal word's second back (`now - EG_HEAL_WORD_MS`) to 3 s past the word: every blow
   that could land inside the 3 s of a heal the word says, 4 s at most, in the struck member's favour as every judge of
   the relay's is (`BODY_MARGIN`). The word carries no heal's instant.
10. **Two Lifelines at once** take the strongest, never a sum. Section 15's stacking is for auras, and Lifeline is none.
11. **The toll's words** are `EG_PRES_TEXT`'s (the client's), not `EG_TEXT`'s, as EG-G1's beats are. A word in `EG_TEXT`
    would move the relay's law hash for a line the relay never says. The toll plays no sound of its own: the pull's row's
    sound is the veil's close.

**The four hosts.**

- `src/scenes/world.js` - FLAGGED, nothing to wire. The toll is paid through the `hurt` seam world.js already hands the
  client (*the void is a setback, never a death*), and said through its `say` and `mid`. Nothing was added to
  `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED: unchanged. The toll is paid where the client hears the room's word, in every
  mode, and the pull's step to the next plate is the client's own, as before.
- `src/scenes/dungeonContext.js` - FLAGGED: unchanged.
- `src/scenes/exterior.js` - FLAGGED: offline, no breach (section 28).

**Not verified without a browser and the game's data:** nothing was played in the live game. The toll was paid on the
stub screen of `test/egz_recap.test.js`'s harness. The pull, its frames and the census's share ran in the relay's real
Room (`test/fakeRoom.mjs`), and the late wake and Lifeline against the director.

**Pins.**

- `test/egz_rules.test.js` (7): the furthest fair point, the toll's law, the pull's toll, the wire and the screen, the
  late wake, Lifeline in the census, and the real Room.
- `tools/mutants/egz_rules.json` (78, every one dead).
- Re-aimed by content, both dead: `egint.json`'s EGINT-the-end-plate-an-island and `egz_legion.json`'s
  EGZ-a-fallen-segment-holding. `egSupportAt`'s still ground is now `groundAt`'s, read by key.
- Judged again over the files this slice touched: every record of `egint.json` (33), `egz_legion.json` (30),
  `egz_recap.json` (31), `egplay.json` (9), `egpres_hud.json` (23), `egfull.json` (15), `egeco.json` (3) and
  `egz_return.json` (43) aimed at `net/egFair.js`, `net/egBrain.js`, `scenes/egClient.js` or `ui/egBeats.js` (187, every
  one dead). No record of any list aims at a changed line of `net/egLaw.js` or `net/wire.js`.
- No pin moved. `RELAY_VERSION` `world198` is rehashed in place (unshipped): `net/egLaw.js`, `net/egFair.js`,
  `net/egBrain.js` and `net/wire.js` moved, and nothing joined the bundle. `ACCOUNT_VERSION` stays `acct121`; no
  migration. No new file in `src/`, so the Ledger's ELITE-GATES row is unchanged.

### EG-ZO - 2026-10-12 - THE FALL PAST THE SPIRE'S UNDERSIDE

Mac: "I said I want everything". Section 7's stair, the full fall a company sees at a band's first hall (Hall 1, each Brink
and a Brink start), is now a camera falling past a modelled underside of the Spire. EG-ZE painted it as a picture on the
veil's canvas. This closes EG-ZE's departure 2: its sentence is deleted, the departures after it are renumbered, and the
record's own pointer to its old sixth moves with them. The 0.8 s veil at every other step, the plain cut under reduced
motion, the hall held centred and the band's chime are unchanged.

**What shipped, by piece.**

- **THE UNDERSIDE MODELLED** (`world/egUnderside.js`, new).
  - It is built with the arc's one mesh kit (`world/meshKit.js`: its quads, triangles, prisms, lathes and extrusions).
    It has 2,660 triangles and a sub-mesh for each of its four records (`EG_UNDERSIDE_RECORDS`): the floor's flags, the
    band's metal, the undersides' strata and the walls' ashlar. Each sits under the band's own archive
    (`world/egBandArt.js`), the band the step falls into.
  - THE PLAN (`egUndersidePlan`) is seeded and the same for every band, because the Spire is one:
    - the torn floor, 44 m across its ragged rim (32 corners, 10% either way) and 4.5 m thick, its broken edge the walls'
      ashlar;
    - the rock torn up with it, hanging 40 m under it in eight rings. The rings narrow by the rock's taper
      (`egUndersideRockR`), are jittered, and are cake-stepped, each ledge facing down into the deep's light. The top
      ring follows the rim inward, so the floor's underside never folds;
    - ten spires of rock, 14 to 30 m long, bent away and broken at the tip by the islands' own law
      (`egUndersideSpireRing`, after `world/sdIslandModel.js` spireRing);
    - six galleries' broken floors jutting from the flank;
    - the colonnade of the hall above, seven columns hanging upside down under the rim;
    - six girders of the band's metal welded through the rock.
  - Nothing stands over the floor, and nothing is wider than its rim. The strata run by depth (the undersides' record
    top to tip: the torn lip, the courses, the works, the haze), and every broken tip is in the haze.
  - `egBandArtOf(band, rec)` (`world/egBandArt.js`) paints one of a band's pictures alone, the same pixels as its whole
    dress (`egBandArt` now reads it record by record). The fall paints four. It never paints the walkways' tesserae, which
    took 92 ms of a band's ~100 ms dress, measured in node.
- **THE FALL'S CAMERA** (`EG_FALL`, `egFallDepth`, `egFallPitch`, `egFallEye`, `egFallCamera`).
  - The eye steps off the torn floor's rim (58 m from the axis, an eye's height over the floor) and faces the axis.
  - It falls from rest toward 44 m/s against the void's drag, v (t - tau (1 - e^(-t/tau))) with tau 0.7 s, and drifts
    0.8 m outward for each metre fallen.
  - Its eyes rise from 11.5 degrees down (the void opening under it) to 24 degrees up (the underside climbing away
    overhead). The raise is eased over the stair's own 2.8 s: 0.8 s in, the 1.2 s least hold, 0.8 s out
    (`world/egLights.js` EG_STAIR_VEIL, `EG_FALL_SPAN`). It is still at both ends, and nothing else turns.
  - As timed, the eye is among the spires as the veil shuts (0.8 s, 14 m fallen) and below the last stone as the least
    hold ends (2.0 s, 57 m down against the main tip's 46). It never comes within 10 m of the rock, and the underside
    stays on the screen, climbing it, through the longest hold the veil allows (20 s).
- **THE STAIR'S PASS** (`render/egStairPass.js`).
  - In the fall, the triangle paints the band's void along the falling camera's rays (`fallRay`; the ray basis is
    `render/sdSky.js` sdSkyBasisInto's): the deep below rising to meet the faller, and embers streaking up past the eye.
  - The painted underside (`undersideEdge` and its black) is gone. With it went the picture's own reversed edge,
    `smoothstep(edge + 0.03, edge, e)`, which SD20c's sweep could not read because its edges were not literals.
  - EG-ZE's fix stands as written: `c += DEEP[b] * 0.35 * k * smoothstep(0.0, 1.0, -e);`.
  - THE UNDERSIDE'S PROGRAM (`EG_UNDERSIDE_VS`, `EG_UNDERSIDE_FS`) draws the model through the camera, depth-tested and
    written, with back faces culled.
  - It is lit by the place alone (`EG_UNDERSIDE_LOOK`): the deep from below, the horizon all round, the zenith from above,
    and the Shade's moon where `render/egSkyPass.js` stands it.
  - It melts into the band's void with distance (0.004 a metre). Both programs paint the same void (`EG_VOID_GLSL`). It is
    dithered in and out with the veil and posterized as the stair is.
  - `upload(parts)` builds the program the first time and keeps it with the pass. A program that will not build is never
    tried again, and the void is drawn alone.
  - The upload makes a vertex array, three vertex buffers, the pack's Uint32 index buffer and a picture a record (nearest
    up close, mipmapped, the strata clamped top to tip). An `EgUnderside` owns them, and its `destroy` frees every one,
    once. An upload that fails part way frees what it made.
- **THE VEIL** (`ui/gateVeil.js`).
  - Its canvas asks for a depth buffer. The fire's and the Hour's looks never test against it.
  - A fall taken starts its own underside (`fallTake`). The underside is made a slice a tick (`fallSlice`: the rock, the
    spires, the wreck, the pack, then four pictures), from the stair's first frame. That is eight ticks, about 0.13 s of
    the 0.8 s closing, and the upload is one more slice.
  - No slice runs in the tick the veil shuts in, because that tick's end runs the step's own work: THE SWAP.
  - The fall is drawn every frame through the falling camera on the stair's own clock, with the hall held centred over it.
  - EVERY ALLOCATION HAS AN OWNER. `fallFree` empties the slot first, then frees the underside, on every exit:
    - the veil opened;
    - a look that is not this fall taken (a flash);
    - another band's fall;
    - the veil destroyed, before the pass that drew it.
- **THE SWAP UNDER IT** (`scenes/egClient.js`, unchanged). The step into Hall 26 is EG-H3's circle swap in place (the next
  circle built during the rest, `egSwapCircle`) under the full fall. Played with a real veil, the swap stands while the
  veil is shut, after the underside stood, in a tick that made none of it, and the underside is drawn on through the hold.

**The four hosts.**
- `src/scenes/world.js` - FLAGGED: untouched. The veil is the world host's (`host.gateVeil`), and the fall needs nothing of
  its frame.
- `src/scenes/worldModes.js` - FLAGGED: untouched. `stepThroughFire(go, look, opts)` hands the veil the step's look, and
  the swap in place runs inside it as before.
- `src/scenes/dungeonContext.js` - FLAGGED: it has nothing to wire.
- `src/scenes/exterior.js` - FLAGGED, as section 28 has it: offline, no breach.

**Departures, said plainly.**
- **The fall's camera is the stair's own, on the veil's canvas** (its own GL context, a third of the pixels), not the
  world's camera. Under the veil the world's place is being torn down and stood again (THE SWAP), and the veil keeps
  drawing while the place beyond is built. A fall in the world's renderer would draw the hall being swapped, and would
  need the hosts' frames.
- **The fall is faster than a body falls**: from rest at v/tau (63 m/s per second) toward 44 m/s, so the underside is
  passed inside the 1.2 s least hold.
- **The underside has no light of its own.** Its metal's rubbed glint (the band's emission picture) is not uploaded, so
  the deep alone lights it, as SD-LOOK's structure is lit.
- **One underside for every band**, dressed in each band's stone. The hall's sky (`render/egSkyPass.js`) still paints the
  underside as a shape, smaller each band, once the step lands.
- **The fall's first frames show the void alone**: about eight frames, while the dither has taken a sliver of the screen.
  Nothing of the fall is made during the rest. Its parts are made in the closing's first frames, which no swap's work
  shares, and freed as it ends.
- **Not verified without a browser and the game's data.** Nothing here has run in a browser. The shaders were evaluated
  through `test/glsl.mjs`, the pass and the veil ran over a recording GL, and the client was played with a real veil
  against the relay's own words. The fall's look (the stone in the deep's light, the haze, the motion's comfort) has not
  been seen.

**Pins.**
- `test/egz_fall.test.js` (7).
- `tools/mutants/egz_fall.json` (79, every one dead). Two survived the first run, a freed underside drawn and one freed
  twice. Both were hidden by `destroy` clearing its lists, which also left `live` meaning nothing. `destroy` now rests on
  `live` alone, and the draw's pin reads that nothing of a freed underside is drawn.
- PIN MOVED: `test/egz_stair.test.js`. The stair's build is refused by the stair's own text (`stairScene`), and its shader
  test no longer holds the picture's underside. `tools/mutants/egz_stair.json` loses the two records aimed at that
  picture (EGZ-the-underside-never-falls, EGZ-the-underside-never-black).
- Judged again over the three files this slice touched that other lists aim at (`render/egStairPass.js`,
  `ui/gateVeil.js`, `world/egBandArt.js`): 51 records in six lists (`auditwb_sound` 3, `eglook` 5, `egz_stair` 21, `sd11d` 4, `sd25_look` 10, `wb6c` 8), every
  one dead.
- `bible/07-Rendering/Rendering.md`'s row for the stair's pass says the fall is modelled.
- `RELAY_VERSION` untouched: nothing in the relay's graph moved. `ACCOUNT_VERSION` stays `acct121`; no migration.
- New in `src/`: `src/world/egUnderside.js`. The Ledger's ELITE-GATES row gains it at the lead's merge.

### EG6c - 2026-10-12 - HERO FRAGMENTS: THE BAKE AND ONE REFERENCE FRAGMENT

Mac authors the hero fragments in Blender (section 11.6, "Authored hero fragments (EG6c, as Mac authors them)"). This slice
builds what turns his scene into a fragment: the bake, the law half's reader, where a baked fragment is registered, and
one reference fragment of the port's own standing in for his until they arrive. It keeps section 10.5's ceiling clamp and
section 11.5's volumes-apart rejection as far as one fragment's bake can keep them. Two of layer three's sentences are
narrowed. "Still owed by EG-D: the authored hero fragments" now owes only their laying, which waits for his. Its departure
that "a fragment's law lives in the spec's own fields, not a separate record" now holds for the code-built kits alone.

**What shipped, by piece.**

- **THE BAKE** (`tools/fragBake.mjs`, new). `bakeFrag(fbxBytes, spec)` turns one fragment's scene into its two halves:
  - it walks the scene with `tools/shipBake.mjs` `sceneObjects`, which refuses by name an export in other axes, any
    transform past T*R*S and a mirroring one;
  - it cuts each polygon with `fillFace` (Blender 5.1's cut, or refused) and welds each art object's normals and UVs on the
    authored triple with `tools/fbxMesh.mjs` `layerReader` and `cornerWelder`, so a UV seam or a hard edge keeps its split;
  - it writes one sub-mesh for each band dress record, lowest first, and bakes the named markers to section 11.5's record.
  The record must pass `net/egFragLaw.js` `egFragRecordFault`, and THE TIMED SOLVER must prove its inner course. Its spec
  (`{ id, kit, class, variant, play, source }`) names the fragment, its library kit, its class, which hero of the kit it is
  and a chamber's play; its band, reverb, light and engine follow from the kit (`EG_FRAGS`). Each half is written one key
  a line (`fragJson`), and a re-bake gives the same bytes. `node tools/fragBake.mjs --list <in.fbx>` prints every object
  as the bake reads it.
- **ONE DFU MEMBER, ONE EXPORT** (the page's "export from them what you need"):
  - `tools/fbxMesh.mjs` exports `layerReader` and the weld it used inline, `cornerWelder`. `bakeMesh` welds through it,
    and every Morrowind bake keeps its bytes;
  - `tools/shipBake.mjs` `sceneObjects` gives each object it reads its Geometry (`geo`) and `normal`, which places a normal
    as the object's vertices are placed (the inverse transpose of its T*R*S and the file's frame). The ships and the gate
    never ask for either;
  - the binary FBX writer moved whole out of `test/fbxmesh.test.js` into `tools/fbxWrite.mjs`, so the fixture and the
    reference are written by one writer.
- **THE FRAME.** A scene point (X, Y, Z) is the fragment's (X, Z, Y), measured from the middle of the mouth's bottom edge.
  The swap is a mirror in the numbers, the same one `tools/bakeGate.mjs` uses to keep Mac's model his own in the
  left-handed world: each triangle is wound back through it, so (b - a) x (c - a) faces out along its normals, and each
  normal goes through it as a vector. The law half is in whole centimetres, rounded half away from zero, so a mouth stands
  exactly at its own middle. The mesh is in metres to 0.1 mm.
- **THE LAW HALF, READ** (the EG6c section of `net/egFragLaw.js`, at its end). Section 11.5's record (the header lists its
  fields), with this reader:
  - `egFragRecordFault` checks the version, whole numbers, the kit's band, class and reverb, a chamber's play and fight
    floor, the sockets, floors, ramps, open edges, ceilings, the walk graph, the anchors, every hazard's shape
    (`EG_HAZARD_SHAPES`) and law (`egHazardLawful`: THE WIDTH RULE, THE WIND-UP FLOOR), the course, alcoves, lights, the
    budget (`EG_FRAG_BUDGET`, section 11.9's starting bounds) and the proof;
  - `egFragCeilAt`, `egFragApart`, `egFragBoxAt` and `egFragSwept` answer what a laying asks;
  - `egFragSteps` and `egFragHazards` give the record as a hall spec's steps and hazards, in metres and seconds and placed
    at an origin.
  The section decides in integers and calls none of section 9's banned functions (a source sweep). Nothing the relay runs
  calls it yet.
- **THE CEILING CLAMP AT BAKE TIME** (sections 10.5, 11.7 and 11.8). Every floor stands either wholly under a ceiling or
  wholly open to the sky, because the motor's clamp extrudes a floor to one ceiling.
  - The ceiling over a floor keeps its class's headroom (`EG_FRAG_HEADROOM_CM`): 3.5 m in a passage or a shaft, 6 m in a
    chamber. A ramp keeps 3.5 m at every corner.
  - The ceiling over every inner piece's whole travel keeps THE FAST BUILD's flight clear: its 2.68 m apex and the
    capsule's 1.8 m, 4.5 m together. So the clamp never cuts short a flight the solver proved. Pinned at 4.4 m (refused)
    and 4.5 m (stands).
- **VOLUMES STAND APART AT BAKE TIME** (section 11.5).
  - The record's `box` covers every drawn vertex, every marker, every opening's snapped width, every hazard's plan (an
    Eclipse's havens' reach among them) and every inner piece's travel. The reader refuses a record whose law stands
    outside it, so a laying that keeps boxes `EG_FRAG_APART_CM` (2 m) apart (`egFragApart`) keeps the whole fragment
    apart.
  - The mouth is the box's -Z face and every exit its +Z face, to `EG_FRAG_SOCKET_TOL_CM` (10 cm), so the course meets
    the fragment at its sockets.
  - An inner course with no ground before or after it is refused.
- **THE REFERENCE FRAGMENT**:
  - `tools/egRefFragScene.mjs` writes it from numbers alone: no game data, no third-party art, no trigonometry. It is
    written as Blender's FBX exporter writes a scene: object origins at their middles, -90 degrees about X, a scale of
    100, normals and UVs by polygon vertex, and materials by polygon. Its SceneInfo names its writer (`FRAG_REF_WRITER`),
    never a Blender;
  - it is a 30 m Oblivion Caverns passage whose vault is open to the burning sky over its chasm. It has a threshold and a
    fight floor of two faces before the chasm, two ledges and a Drift across it, and a fight floor after it with a stair
    up to a Caster's balcony. Its two exits are one from the floor and one from the balcony, 1.5 m up. It also has a fire
    fall, a surge, falling basalt, an alcove behind the west wall, three lights, a seven-node walk graph that does not
    cross the chasm, and an 18-triangle collider proxy;
  - every marker kind and every anchor kind stand in it. Its art is 128 triangles in seven dress records (including smooth
    posts with a UV seam);
  - `tools/bakeEgRefFrag.mjs` is its own bake script, which every fragment of Mac's will copy. The .fbx and both halves are
    committed under `src/assets/egfrags/`.
- **WHERE A BAKED FRAGMENT IS REGISTERED** (decided with section 11.6):
  - its **pictures** take no number of their own. Each art face wears a record of its band's dress (`world/egBandArt.js`
    `EG_DRESS`), and the bake refuses any other material. It draws under its band's archive, which the one registry already
    holds (`world/pseudoArchives.js` `EG_BAND_ARCHIVES` - its header says so), so an authored fragment cannot collide
    with anything;
  - its **mesh** goes through the one mesh kit: `world/meshKit.js` gains `mesh`, which writes a baked mesh's triangles
    into a record's bucket, moved to where the fragment is laid, with its own normals and UVs. A hero fragment packs with
    the hall's code-built shapes into one model. `world/egHeroFragModel.js` (new) registers the mesh halves beside their
    own bake's law (`egHeroFragMeshes`), and `egHeroFragInto`, `egHeroFragModel` and `egHeroFragCollider` lay them;
  - its **law** is registered in `net/egHeroFrags.js` (new). `egHeroFragRegistry` holds every record to the reader at
    import, and `egHeroFragLaws(kit)` gives the fragments a hall may lay: none today, because the reference (variant
    `reference`) is laid by no hall.

**How Mac authors a fragment** (the bake accepts exactly this - `tools/fragBake.mjs`'s header says it too):

- **The file.** One fragment per `.fbx`, exported from Blender 5.1 with the FBX exporter's defaults (binary, Forward -Z,
  Up Y). Export the markers too: do not limit the export to visible or selected objects if they are hidden. Objects are
  root objects (no parent), their rotation mode XYZ Euler, with no negative scale (apply it with Ctrl+A).
- **The frame.** 1 Blender unit is 1 m and Z is up. The course runs along +Y: the mouth at the -Y end, the exits at the +Y
  end, X across. Nothing of the fragment may stand more than 10 cm behind its mouth or past its exits.
- **The art.** Any object whose name is not a marker word is art. Every face wears a material named for one of its band's
  dress records: `floor`, `brass`, `root`, `arena`, `cobble`, `edge`, `molten` or `pillar` (a Blender copy suffix such as
  `pillar.001` is fine). Every art object has normals and a UV map; it is smooth where he smooths it and mapped as he maps
  it. At most 12,000 triangles and 12 draws.
- **The markers.** Each is a mesh object; its name says what it is and its geometry says where. A label is letters,
  digits, `_` and `-`, and any name may end in Blender's `.001`.

  | name | geometry | what it says |
  |---|---|---|
  | `floor.<label>`, `floor.fight.<label>` | a flat plane, any faces (its outline is the floor), one outline, no hole | a traversal floor; a fight floor |
  | `ramp.<label>` | a sloped plane | a stair or slope, each corner at its own height |
  | `ceil.<label>` | a flat plane over the floors it roofs | a ceiling (a floor under none is open to the sky; never half under one) |
  | `open.<label>` | a box over floor edges (to 10 cm) | those edges open (to the void, a ramp, a lower floor); every other edge is a wall, except where one floor runs on into another at its height |
  | `socket.in` | an upright plane across the course | the mouth (one) - its width and height the opening's, at least 3.5 m high |
  | `socket.out.<label>` | the same | an exit (one or more; one may stand higher - a Low Road goes down) |
  | `node.<label>` | a disc on the ground | a walk-graph node (its middle; half its width its reach) |
  | `edge.<label>` | a strip from one node's disc to another's (its ends within a metre of their heights) | a walk-graph edge |
  | `anchor.<kind>.<label>` | a small box | `rift`, `caster`, `lurker`, `niche`, `engine` or `hazard` - the middle of its foot |
  | `hazard.<kind>.<label>[.per<ms>][.ph<ms>]` | its kind's shape: one rectangle along its length (`fall`, `surge`, `slag`); one disc each, one size (`basalt`, `hammer`, `hammerline`); one rectangle each, falling along +Y (`cascade`); the swing's rectangle (`wisp`, `per` required); a plane at its line (`mist`); a disc (`tide`); the moon-shafts' ring as a disc (`eclipse`) | a hazard on the shared clock; a lane's bite the capsule inside its rectangle |
  | `course.<kind>.<label>[.amp<cm>][.per<ms>][.ph<ms>][.beat<n>]` | a box, its top the piece's top | an inner piece: a Drift and a Rail say `amp` and `per`; a Pendulum, a Vent and a Gust `per`; a Drum `amp` (it rolls at the law's 2.0 m/s); a Moon branch `ph` and `beat` (cm); a Beat `beat` (ms); a slag crossing's clock is the law's; a ledge or still piece says none |
  | `alcove.<seam\|jump>.<lumen\|shard\|page>.<label>` | a box to one side of the course | an alcove (its floor's middle) |
  | `light.<band\|lava\|moon>.<label>` | a small box | a light (its middle) - at most four |
  | `collider.<label>` | low-poly faces | the collider's proxy (at most 3,000 triangles), never the drawn mesh |
- **Its bake.** Copy `tools/bakeEgRefFrag.mjs` and give it its spec (`id`, its kit in `EG_FRAGS`, a class the kit has, a
  `variant` of its own, a chamber's `play`, its `source`). Commit the .fbx under `src/assets/egfrags/source/` with its two
  halves beside it, and add a byte-for-byte test (the reference's is `test/eg6c_bake.test.js`'s first). Register the law
  in `net/egHeroFrags.js` and the mesh in `world/egHeroFragModel.js`, and name the three files in `test/doctrine.test.js`'s
  allow-list.
- **What the bake refuses, by name.** It refuses:
  - an export no Blender 5.1 wrote;
  - a marker name it cannot read;
  - a floor or ceiling that is not flat, is not one outline, or has a hole;
  - a socket that is not upright, or a second mouth;
  - an edge that misses its nodes;
  - an open marker that opens no edge, or an alcove on the course's line;
  - a hazard not in its kind's shape, or of two sizes;
  - art without the band's dress, normals or a UV map;
  - a record its reader faults: THE CEILING CLAMP, the volume and its faces, THE WIDTH RULE, the budget;
  - an inner course the solver does not prove.
  A refused scene is fixed in Blender, never patched by the bake.

**Departures, said plainly.**

1. A hazard's record is in the hall spec's own fields (`sh`, `spots`, `lanes`, `path`, `ring`, `r`, with `period` and
   `phase`), not section 11.5's `{ kind, shape, size, at, period, windup, pct }`. Its wind-up, share and element are its
   kind's law (`EG_HAZARDS`) and are never copied into a record that could disagree.
2. A ramp's `poly` carries each corner's height (`[x, y, z]`): `{ poly, y0, y1 }` cannot say which way a slope rises.
   Anchors are `[x, y, z]` (a code-built plan's are `[x, z]`).
3. The record adds `kit` (its band, reverb, light and engine follow), `box` (its volume) and `bake` (its source and the
   source's sha256). `play` is a list (a chamber's "at least one of").
4. `proof.crossSlow` is the median crossing over start phases at THE SPAN BUILD (THE MEDIAN's measure), not a slowest
   crossing. The crossing's bound at THE FAST BUILD (section 10.5's `EG_CROSS_MIN`) is not in the record.
5. The ceiling clamp at bake time is a refusal, not a clamp. THE TIMED SOLVER models no ceiling, so a ceiling lower than
   the fast build's 4.5 m over any inner piece's travel is refused instead, and no flight the solver proved is cut short.
   The page names no headroom for a shaft; a shaft keeps a passage's 3.5 m.
6. A lane's rectangle is the capsule inside it. The law's lanes are capsules (`net/egShape.js` `egInShape`), so the line
   is drawn in by half the width at each end and the bite never passes what Mac drew.
7. Section 11.5 names `open` edges without saying how they are authored. An edge is opened by an `open.*` box over it, or
   by one floor running on into another at its height. A ramp meeting a floor needs an `open` marker.
8. Volumes stand apart as far as one fragment can be held to it: the box holds everything, and the sockets stand on its
   faces. Laying it is left to the laying (below): the 2 m test against the hall's other boxes (`egFragApart`), a Low
   Road's vault 3 m under the lowest underside above it, and a piece's hanging underside (`SD_ROOT_DEPTH`).
9. The collider proxy is authored (`collider.*`), not derived. Section 11.6's "no drawn vertex inside the proxy" is not
   checked at bake time.
10. The reference's file names the port's own writer, which the bake accepts by name without asking a Blender's cut.
    Every other file must be Blender 5.1's.
11. `EG_FRAG_BUDGET` is section 11.9's starting bounds; EG6b's measurement on SwiftShader and a reference phone has not
    fixed them.
12. An inner piece's size is as authored (not `EG_STEP`'s), and its clock is the name's wherever the law leaves it free.

**Not built - the owner item, for when Mac's fragments arrive.** Laying an authored fragment into a hall, which needs:
- `net/egLaw.js` to choose one (`egHeroFragLaws`) in place of a kit's passage or chamber;
- its polygon fight floors in the spec (`spec.fl` is discs and lanes today, and `net/egFair.js`, `net/egFloor.js` and
  `net/egWalkGraph.js` read no polygon);
- its sockets joined to the course (a joined piece's w and h within 0.1 m), its box kept 2 m from every other volume and a
  Low Road's vault 3 m under the lowest underside;
- its steps and hazards laid (`egFragSteps`, `egFragHazards`) and its walk graph walked by the legion;
- its own clamp from its floors and ceilings (`world/egHall.js` `egFragZones`), its mesh laid through `egHeroFragInto`, and
  its proxy in the hall's collider buckets.
That is a spec law (`EG_SPEC` 6) and a relay version. Law 4 and law 5 lay what they laid: the 800-hall hashes in
`test/egz_frag.test.js` and `test/egseam_law.test.js` stand. The reference is laid by none.

**Not verified without a browser and the game's data:**
- the reference's mesh was never drawn. It was checked in node only: its triangles' winding against its normals, its
  sub-meshes, and the kit's pack;
- whether Blender's UVs (v up) lie on the band's painted records as a modeller expects was never checked; the port's own
  meshes run v up too;
- no export of Mac's was baked, because none exists yet. The reference is written the way his exports are (the ships',
  the gate's), and the bake reads them through the same `sceneObjects`.

**The four hosts.**
- `src/scenes/world.js` - FLAGGED: untouched. No authored fragment is laid yet, so no host draws one; nothing was added to
  `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED: untouched.
- `src/scenes/dungeonContext.js` - FLAGGED: untouched.
- `src/scenes/exterior.js` - FLAGGED: the bench is offline and holds no Elite Breach.

**Pins.**
- `test/eg6c_bake.test.js` (12), `test/eg6c_law.test.js` (6).
- `tools/mutants/eg6c.json` (203, every one dead). Eleven survived the first run. New assertions killed ten of them:
  - a flat ramp;
  - a floor's edge midpoints left unasked (now a ceiling notched over one);
  - a node standing on a ramp;
  - a piece past the box's far end;
  - a corner meeting four edges (a bow-tie floor);
  - a four-cornered marker that is not a rectangle (a trapezoid);
  - a spec naming no kit;
  - an edge end meeting two nodes;
  - a material Blender copied (`molten.001`);
  - a baked mesh's normals (now every corner is compared, not only the first).
  The eleventh was an equivalent mutant (the crossing test turned: a point's crossings to its left and to its right have
  the same parity), re-aimed at the crossings' count, which a point whose line crosses the outline twice now pins.
- Judged again over the files this slice touched: every record aimed at `tools/fbxMesh.mjs`, `tools/shipBake.mjs`,
  `src/net/egFragLaw.js`, `src/world/meshKit.js` and `src/world/pseudoArchives.js` in `egfrag.json`, `egz_frag.json`,
  `eglook.json`, `egz_sound.json`, `galleon.json`, `auditgalleon_bake.json`, `auditgalleon2_bake.json`, `gatefbx.json`,
  `ships2_bake.json` and `mwebony1.json` (106, every one dead).
- PIN MOVED: `test/fbxmesh.test.js` imports its writer from `tools/fbxWrite.mjs` (its 12 tests and every bake's bytes
  unchanged); `test/doctrine.test.js`'s allow-list names the reference's three files.
- `RELAY_VERSION` `world198`, unshipped, rehashed in place (`net/egFragLaw.js` moved). `ACCOUNT_VERSION` stays `acct121`;
  no migration.
- The Port-Ledger's ELITE-GATES row names `net/egHeroFrags.js` and `world/egHeroFragModel.js`: the doctrine gate (every
  Ledger A cite in `src/` has a Ledger row naming its file) failed without them.

### EG5 + EG-ZK - 2026-10-12 - THE FIGHT PROFILE, AND THE LORDS ON THE SEAM AND THE GRAPH

Mac: "I said I want everything". EG5's last piece of the hall law, the fight's profile (section 14, "The merge" and "The
profile"), and the Spire's lords as sections 11.7 and 13.1 write them: on the boss seam, and walking the hall's graph. All
relay law. It closes EG-H3's departure 3 and EG-ZB's departure 2; both sentences are deleted.

**What shipped, by piece.**

- **THE MERGE** (`net/egLaw.js`, `EG_DECREES`). The lord family's four decrees carry a `law`: rank I's and rank II's,
  each number in thousandths (`EG_LAW_UNIT`, 1000), so the law file still decides in integers.
  - Rank I is read off the gate's own trials (`net/gateMods.js` `gateTrialOf`, imported and never copied):
    - Colossal's `sizeX` and `hpX`;
    - Unyielding's `hitX`;
    - Vengeful's `dmgX`;
    - Grudge-Bearer's `threatPick` and `threatDecay`.
  - Unyielding's `shieldX` 2 is the trial's 6 s over the gate's `SHIELD_MS`, in place of its `shieldMs`.
  - Colossal's `radiusX` 1.2 is the page's own: the Slam becomes 8.4 m, not the gate's 8.5.
  - Rank II's numbers are the page's.
  - No other family carries a law. The other families are read by rank where they act (the legion, the director, the
    spans).
- **THE FOLD** (`egLawFold`). `net/sdMarks.js` `sdMarksLaw`'s rule, over laws in thousandths: a key ending in X
  multiplies (rounded to the thousandth), and any other key is the last law's that names it. Every X-keyed number is x1
  where no law names it (`EG_LAW_X_KEYS`, from the table).
- **THE PROFILE** (`egFightProfile`, `validEgDecrees`).
  - `egFightProfile(decrees)` folds a circle's decrees (`[[id, rank], ...]`, the state's word) in the order of their
    numbers. It answers `{ dc, key, law }`: the decrees sorted, the cache's key (the sorted decree string, `id:rank,...`)
    and the law as numbers. It is frozen.
  - The validator takes at most `EG_DECREES_MAX` (9) pairs, each a known decree at rank 1 or 2, none twice, and answers
    a fresh copy. Anything else is the fight with no decree.
  - The cache is bounded at `EG_PROFILE_CACHE_MAX` (256) and drops the least recently asked.
  - The gate's `validGateMods` is not touched. The wire's own nine (`net/wire.js` `egDecreesW`) stand as EG-PLAY laid
    them.
- **THE LORDS' LAW READS IT** (`net/egLords.js` `egLordLaw`). The ranks in force (`F.D`) become the profile's list, and
  the gate's `THREAT_PICK` and `THREAT_DECAY` stand where no decree names a threat.
  - Before the change, every one of the 81 rank sets of the four was checked against the hand fold it replaces: each
    number is the same double.
  - Nothing else in the lords moved. Colossal's radii and health, Unyielding's ward and its blows, Vengeful's share
    inside the one `EG_SHARE_X_MAX` with depth and fury, and Grudge-Bearer's threat were all already applied, and are
    now pinned in a fight the director stands.
- **THE LORDS ON THE SEAM** (`net/egLords.js` `EG_SEAM`, `egLordsFight`; section 13.1). There is ONE plug of
  `net/bossSeam.js` for every lord and champion, never a seam per lord. Its fight is the lords' view of the hall's one
  fight: `{ F, spec, ctx, now }`, made by the director for each call.
  - `new`: a Court's lord (the Twins, both) or a champion, stood asleep (`egLordsNew`), with the bodies stood as
    `stood`.
  - `join`: the director's admission (`o.admits`) while a lord stands. The company is the hall's, sized at its wake
    (`egFightNew`).
  - `hit`: the gate's hand and purse (`egHitBody`) times the lord's own weight (`egLordHitX`), and what lands is told to
    the lord (`egLordHit`).
  - `step`: the lords' beat (`egLordsStep`).
  - `stateOf`: the whole fight at the view's clock (`egFightState`).
  - `judge`: the fight's blows on the shared-time trails (`net/bossRef.js` `judgeShapes`). These are the lords' and
    their legion's blows on one floor, as the gate's judge takes its host's.
  - `earned`: a Redoubt's receipt at the lords' fall, for half an even share of the circle's damage (`EG_EARN_SHARE`)
    or a part in three of its halls (`EG_EARN_HALLS`) among the living company.
  - The director (`net/egBrain.js`) calls each member inside its one beat with the legion and the hazards. It never
    calls a lord's own function past the seam:
    - six births;
    - the join and the hit of a member's blow on a lord (`egBlow`);
    - the Court's beat and the other halls' beats (`trial`);
    - the state at a hello, at the wake and every `EG_STATE_EVERY_MS`;
    - the census's judge (`egCount`);
    - the Redoubt's earners (`redoubt`).
  - The seam is a contract the director calls, not a second host. `net/egLords.js` imports the board, so
    `RELAY_GRAPH`'s walk is unchanged.
- **THE FRAMES, BYTE FOR BYTE.** Every frame the director says was hashed on the tree before (b4af2365) and again after
  the seam, with test/egfull_relay.test.js's own auto-player:
  - the thirteen lords, each met at its own Court and fought to its fall;
  - the six-circle breach.
  All fourteen hashes were unchanged.
- **THE LORDS WALK THE GRAPH** (`lordWalk`, `runTo`, `oneLevel`; section 11.7). The legion's `walkGraph` and `walkAir`
  are exported from `net/egLegion.js`.
  - Within the region of the fight ground it stands in (a disc, a lane, an arch's half), a lord walks straight, as it
    always walked: `egWalk`, stopped short and kept on the floor.
  - To a goal past that region (an island across a bridge, a floor up its stair, the far side of an arch's wall) it
    walks over the hall's walk graph as the legion does: through the gap, up the stair, along the bridge.
  - This holds for the approach, Grath's Scent and the Colossus's route. The Mother of Dusk flies about the rock.
  - The node a graph walk headed to is a way on only while the lord still walks to it. A blow's stop, a run's end, a
    leap or a straight walk since leaves no way on, so a lord set down beside an arch's wall never walks straight to the
    far gap node. A node it stands at is reached.
  - A lord's RUN (a row's `run`: the champions' Charge, the Armsmaster's Lunge, the Night-Stalker's Night Lunge) ends at
    an arch's wall with its body clear, as the Breaker's does. A run that would end on a floor of another height ends on
    the region it began in. No run is chosen at a member on another floor's height (`oneLevel`); the lord walks the
    graph to them instead.
  - After the graph, eight lords say the same frames as before: the Spellmaster, the Armsmaster, the Cairn-Keeper, the
    Mother of Dusk, the Night-Stalker, Seyth, the Colossus and Garoth. Their grounds are one region each.
  - The other five walk the graph now, and every one still falls: Grath's islands, Ilthys's balconies, the Twins'
    courts and walkway, Morvayn's soul-bridge and the Wyrm's perches.
  - test/egfull_relay.test.js is green, unchanged.

**Departures, said plainly.**

1. `egFightProfile` keys and folds the lord family alone. The other families' decrees are in its key, but carry no law.
2. A lord walks straight within its region, kept on the fight floor as before, not to the region's own inset as a
   legion walker is. This is why eight lords' frames are byte for byte.
3. A run's stamp (its lane) still spans an arch's wall as the Breaker's does: the run ends at the wall, but the shape
   is the blow's.

**The four hosts.**

- `src/scenes/world.js` - FLAGGED: not touched. This is relay law, and the screens draw what the relay says.
- `src/scenes/worldModes.js` - FLAGGED: unchanged.
- `src/scenes/dungeonContext.js` - FLAGGED: unchanged.
- `src/scenes/exterior.js` - FLAGGED: offline (section 28).

**Not verified without a browser and the game's data:** the lords' new walks were checked as the relay's frames on real
specs, not watched on a screen; the screens carry each walk as they always have.

**Pins.**

- `test/eg5_profile.test.js` (5): the merge, the fold, the validator and the cache, the lords' law, and the laws on a
  lord in a real fight.
- `test/egz_lords.test.js` (5): the seam and the director's calls, every member frame for frame on real fights, a
  champion through an arch, Grath along his bridges, and a champion up a stair with no run up a ledge.
- `tools/mutants/eg5.json` (40, every one dead). Two survived the first run and were killed by new assertions:
  - the cache first-in-first-out: the oldest asked again must stay;
  - Grudge-Bearer forgetting: its record was re-aimed at the whole decay (the guard alone is equivalent under a law of
    no decay).
- `tools/mutants/egz_lords.json` (35: 33 dead, 2 equivalent - the Colossus's route over a one-lane forge and the Mother's
  flight over a glade with no rock). Survivors of the first run were killed by new assertions:
  - a blow through the seam on a body that is no lord (a fresh purse, so the seam and not the hand refuses it);
  - a node kept after the lord was set down.
  Two records on a level-only keep were dropped with the keep: the straight walk keeps the old floor.
- Judged again over the files this slice touched: `egz_legion.json`, `egz_recap.json`, `egint.json` and `egseam.json`
  (285, every one dead).
- `RELAY_VERSION` `world198` was rehashed in place; no file joined its graph. `ACCOUNT_VERSION` stays `acct121`.

### EG-ZM - 2026-10-12 - THE LOOSE ENDS: THE RETURN'S SEED, THE BOARD'S DOORS, THE STAKE'S CLOCK, THE LEDGER ROW

Four loose ends of the last wave (Mac: *"I said I want everything"*). It closes EG-ZD's departure for a device with no
record (its way back stood circle 1 of seed 0 under the veil until the room's word), section 20's board window *"reached
from the Timers row and from the start window"* (EG14's window had one door, `/breach board`), EG-ZA's departure for the
service's clock (a stake no receipt settles stayed `held`), and the ELITE-GATES row of the Port-Ledger, which still
named a retired ward and the Hour's art.

**What shipped, by piece.**

- **THE RETURN'S SEED** (`scenes/egClient.js`, section 22).
  - A way back the device knows only from the account service's `live` is a record with no opening (`op` 0), so no seed
    and no hall. Its step goes under the veil and is held there until the room's first word.
  - The word is heard by a listener on my own identity (`egSeedListen`). It is an `OnlineSession` made of my primary
    session's url, id, secret, name, look and token minter, with `presence: false`: no pose, so it stands no body in the
    breach and sends nothing but its hello and its heartbeat (`net/caravanVisitLink.js`'s way). The room answers its
    hello as it answers any member's, with the breach's `st`, or refuses it in words (`net/egBrain.js` egAdmitWord).
  - The `st` is folded as the link folds it (`net/egLink.js` foldEg) and kept on the record (`backFrame`): the seed, the
    opening, the geometry, the hall. The circle stood is the record's, so it is the room's: for a breach begun at
    Redoubt 1 under a Crumbling Wager, Hall 6's circle 2 in the Wager's geometry, never circle 1 of seed 0, and nothing is
    rebuilt once my own socket says hello.
  - The step waits under the plain veil held over *The Spire* (AUDIT EG III: it fell as Hall 1, the Galleries' fall and
    its name, whatever hall the company held). The veil keeps the first band's tint, since the record knows no band.
  - The listener is left at its answer, before the circle stands. The relay keeps one socket an account in a breach's
    room (`server/src/index.js:"if (egRoom && who.subject) for"`), so my own socket's hello is never refused as a
    replacement of it.
  - A refusal in the room's own words (the order, the company, the fallen, home, a breach closed - `roomRefused`, now the
    one law spireFrame's terminal close reads too) is said, and the way back is let go and marked over. A refusal that
    is not the room's (the relay's, for want of a sign-in) says the road is shut and keeps the way back.
  - No word within `EG_BACK_SEED_WAIT_MS` (12 s: the listener's own wait for its token, `TOKEN_WAIT_MS`, and four seconds
    for the socket, the hello and the answer) opens the veil where I stood: *The Spire does not answer. Try the return
    again.* (AUDIT EG III: it told a touch or pad player to type `/breach`.) The way back is kept, and asked again it
    waits again. The online frame gone (`away`) ends the wait the same way, and a session with no relay address is silent
    at once.
  - The frame settles the wait (`seedFrame`), the wait's slot emptied before the step is told.
- **THE BOARD'S DOORS** (section 20).
  - **One door.** `ui/egBoardWindow.js` `createEgBoardDoor`, the world host's `egBoardDoor`, opens the boards in the skin
    worn (the enhanced panel; the classic skin's DFU pickers on the mode's slot), one at a time: asked again, the boards
    standing are closed and out of the slot before the next go in. A window on its way out of the mode's slot - a pause
    face handed off, done but not yet drained - gives the slot up to the classic picker; a live window keeps it.
    `/breach board` goes through it.
  - **The Timers row** (`systems/eventTimers.js`, `ui/enhancedTimers.js`, `ui/enhancedMenu.js`). The timers source carries
    the door (`doors.board`). Where it does, every Elite row carries `door: 'board'`: my breach's, and the boards' own
    season, an Elite row of its own (*The Spire's season 2 ends*, at the arena season's end - `net/arenaLaw.js` - when
    each Descent bracket's top ten are kept as Spire Champions), so the door stands with no breach of mine. The window
    draws it as a *Boards* button beside the row's clock, a button as the window's Close is, so a tap and the pad's walk
    of the pause face reach it alike. A press reads the source's door at the press, and the pause face hands its place on
    first, as the sheet's doors do (`handoff`; a door that opened nothing resumes).
  - **The start window** (`ui/egStartWindow.js`). Its last row is *The Boards of the Spire* (`EG_BOARD_TEXT.title`), with
    keys or with the Rehearsal alone. Picked, the list leaves the slot before the boards open, and comes back once they
    close (once, however often their close is told; at once where none opened; never after the window ended). It is a row
    of DFU's list picker on the classic skin and of the skin's own picker on the enhanced, with their own touch and pad.
- **THE STAKE'S CLOCK** (`server-account/src/eg.js` spendLapsedStakes, `server-account/src/cron.js` `eg-stakes`; section
  23).
  - **When.** A stake still `held` `EG_STAKE_CLOCK_S` past its `until` is spent by the service's hourly clock. That is
    the void's window (`EG_VOID_WINDOW_S`, the relay's `EG_VOID_MAX_S` pinned equal) and a receipt's life
    (`EG_RECEIPT_TTL_S`): an order is signed at the latest at its stake's `until` (an open asked again re-signs it only
    while the stake holds), its void may be minted a week after, and that void is carried a week more. Past the bound
    nothing can name the stake.
  - **What the key becomes.** Spent: it stays taken, as any spent stake's does. A clock never returns a key.
  - **What the player is told.** A letter in the mailbox (`server_post`, the post the pause face's envelope reads), from
    the developers, one a stake (`spire-stake-<order id>`, INSERT OR IGNORE over 0093's index, so a letter already there
    never holds the clock): *The Weir Key you staked on 2027-01-15 opened a breach that never sent word back: no Redoubt,
    no end and no void reached the Spire's ledger in the time a key waits for one. That key is spent. It does not
    return.* A Rehearsal's stake held no key: it is spent and says nothing.
  - **How.** The stakes due are asked in one statement, a page of `SWEEP_ROWS`, the oldest first (a quiet hour asks no
    more), then spent with their letters in one transaction, each only while it is still held: a receipt claimed between
    the ask and the spending settles its stake its own way. The job asks again while a page is full. The held stakes are
    asked by their own index (migration 0111 extended: `idx_eg_stakes_held` on `(state, until)`), never a walk of every
    stake ever staked.
- **THE LEDGER ROW** (`bible/01-Overview/Port-Ledger.md`, ELITE-GATES). `characters/playerEntity.js` holds one Levitate
  ward (EG-H2 retired `registerSpireLevitateWard`); `world/egHall.js` wears its band's dress (EG-G2's
  `world/egBandArt.js`), not the Hour's art; `server-account/src/egEconomy.js` and `server-account/src/egStarts.js` are
  named, and the stake's clock on `server-account/src/cron.js`.

**Departures, said plainly.**

1. The clock waits fourteen days past the stake's end (`EG_STAKE_CLOCK_S`), not the page's seven days
   (`EG_VOID_MAX_S`). A void can be minted up to seven days past its order's issue and carried seven days more, so a
   stake spent at seven would lose the key such a void returns, and a key is never lost to an infrastructure fault.
2. The service keeps its own void window (`EG_VOID_WINDOW_S`), pinned equal to the relay's: `net/egDurable.js` is the
   relay's and outside the account Worker's bundle (`EG_LAST_WORD_S`'s precedent in the same file).
3. The player is told by a letter in the mailbox, not a line in the game: the clock runs on the service, days after the
   player last played, and the post is the one place the service speaks to an account between sessions. The words are
   fixed here, as First of the Spire's are.
4. The way back's veil is chosen before the room has spoken, so a device with no record steps under the stair of the
   record's start (Hall 1's full fall) whatever hall the room says. A record that knows its seed waits for nothing, as
   before, and a circle it had wrong is still rebuilt in place.
5. For the length of the wait a second socket stands on my identity in the breach's room. It holds no pose, so the room
   counts no body of it; it is gone before my own socket says hello.
6. The Timers row's door hangs on the boards' own season as well as on my breach's row: a Timers window with no breach of
   mine had no Elite row to carry it. The season row stands only where the door does.
7. The Timers window is the enhanced pause face's (TIMERS1). On the classic skin it is reached where the enhanced pause
   opens on either skin (the mailbox's door, the family's pages); its door opens the boards in the skin worn.

**The four hosts.**
- `src/scenes/world.js` - WIRED: `egBoardDoor` (`createEgBoardDoor` over `openEgBoard` and the mode's slot -
  `topWindow`, `mountWindow`, `closeWindow`), and through it `/breach board`'s `board`, the timers source's `doors` and
  the start window's `board`. The return's listener is the breach client's own (it builds from the `online` it is
  already handed). Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED: untouched. Its interiors' pause face reads the world host's timers source, which
  carries the door; the classic boards mount through its own `mountWindow`, `closeWindow` and `topWindow`.
- `src/scenes/dungeonContext.js` - FLAGGED: untouched; its pause face reads the same source through worldModes, and its
  slot takes the boards' pickers as it takes any window.
- `src/scenes/exterior.js` - FLAGGED: offline - no timers source, no breach, no boards (section 28).

**Not verified without a browser and the game's data:** the listener's hello ran against the relay's real Room through
a bridged socket, not a deployed relay; the Timers button and the start window's row were driven on a stub DOM and fake
pickers, not seen on either skin; the letter was read through the real Worker's mailbox routes, not the pause face's
envelope.

**Pins.**
- `test/egz_ends_return.test.js` (3), `test/egz_ends_board.test.js` (3), `test/egz_ends_stake.test.js` (2).
- `tools/mutants/egz_ends.json` (73: 71 dead, 2 equivalent as recorded - the wait's slot emptied before its step is
  told, and the Timers shape naming a row's door, which the season row's coming and going moves anyway). Six survived the
  first run and were answered: three were the return's target read twice (the room's word written into the record and
  then into the step), so the step now stands the record's circle, as it always did, and the record is pinned; a
  settled stake long due and a page of one were pinned; the shape's became the second equivalent.
- PIN MOVED: `test/egz_return.test.js` (EG-ZD's device with no record is now a record whose seed is not the room's -
  still rebuilt in place); `test/egeco_hosts.test.js` (`/breach board` through the one door); `test/auditscale.test.js`
  D7 (a quiet world's hour is twenty-three statements, the stake clock's one ask the twenty-third).
- Re-aimed by content: `egz_stair.json`'s EGZ-the-way-back-under-the-hour (the way back's step now waits under its veil
  before it stands the circle).
- Judged again over the files this slice touched (`scenes/egClient.js`, `systems/eventTimers.js`, `ui/egStartWindow.js`,
  `ui/egBoardWindow.js`, `ui/enhancedTimers.js`, `server-account/src/eg.js`, `cron.js` and `post.js`): 232 records of
  `auditlwii2_service`, `auditscale`, `cap_off`, `egarch`, `egeco`, `egeco_honours`, `egeco_pay`, `egeco_relay`,
  `egfrag`, `egfull`, `egint`, `eglook`, `egmade`, `egplay`, `egpres_hud`, `egseam`, `egz_frag`, `egz_keys`,
  `egz_recap`, `egz_return`, `egz_sound`, `egz_stair`, `lw15`, `scale4b`, `sd19`, `sd2c`, `serpent2` and `serverpost`.
  Every one is dead.
- `RELAY_VERSION` untouched: nothing in the relay's import graph moved. `ACCOUNT_VERSION` stays `acct121`; migration 0111
  extended (unshipped).
- No new src module. The ELITE-GATES ledger row corrected (above).

### EG-ZN - 2026-10-12 - THE CAMERA IN THE SPIRE, AND THE BAND TEXTURES' OWNER

(Mac: *"I said I want everything"*.) Closes the last two lines of section 11.8 that no layer built - the occluders between
the camera and the body dithered out, and the shaft ledge's pitch bias with the camera's rise over the drop - and section
29's owner of the band textures. EG-ZH's two "Not built" lines for the camera, EG-ZC's "the camera's 20-degree bias over a
shaft's drop is not built" and EG-G2's "a band's textures stay up for the session once stood" are retired here.

**What shipped, by piece.**

- **THE OCCLUDERS MARKED** (`world/egHall.js` `buildEgCircleModel`, `egOccluderRuns`; section 11.6's mesh half). The
  circle stays one mesh, one upload and one draw of a sub-mesh a record. As it is laid, every piece of rock the camera may
  stand behind is marked (`occluderMarker`):
  - a passage's or a shaft's every wall run and its vault;
  - each box of its kit's dress (the Stacks' bookcases, the Colonnade's drums, the Ossuary's ribs and arches, the Gloam's
    trunks, the Forge's pipes and anvils);
  - a niche's walls and lid (never its floor), each vignette, a ring wall (a chamber's, a court's, a pit's tiers) a segment
    at a time, the Forge's long walls a side at a time, an arch's walls, the end plate's posts and lintel, and each slag
    spout with its lip.
  Each piece is `{ b, r }` - its box, and its runs of the mesh's own indices (`model.occluders`) - read off the packed
  mesh. The floors, bands, lanes, plates, islands, ramps and the magma stay the circle's ground. A circle holds 18 to 141
  pieces, about a thousand of its 21,000 to 28,600 triangles. The swap's worker build carries them with the model
  (`world/egCircleParts.js`, which builds through `buildEgCircleModel`, unchanged).
- **THE DITHER PASS** (`scenes/egOcclude.js`, new - a helper the mode machine calls, not a fifth host; `render/renderer.js`
  `meshView`; `scenes/worldModes.js` `egOccludeFrame`, `egCircleDraw`):
  - THE RAY: each frame in third person, a segment from the eye to the body's pivot (the lane's own focal) and one to its
    chest (`EG_OCCLUDE_CHEST_M`, 0.9 m over the render feet), each stopped `EG_OCCLUDE_BODY_M` (0.3 m) short of the body,
    is tried against every piece's box and then against its own triangles, from either face (`egSegBox`, `egSegTri`,
    `egOccludersHit`). Only the occluders' own triangles are kept for it.
  - THE EASE (`egOccludeEase`): a piece the ray crosses dithers out to `EG_OCCLUDE_KEEP` (a quarter - 4 of bayer4's 16)
    over `EG_OCCLUDE_FADE_S` (0.2 s), and back the same way once the ray is clear.
  - THE DRAW: while nothing dithers, the circle's draw is the dungeon loop's own, untouched. While pieces dither, the pass
    runs after the frame's beginFrame and the cull, before the dynamic draws:
    - it takes the circle's draw for the frame (`hidden`);
    - it records the whole mesh's shadow as the loop would (`recordShadowMesh` - the lanterns' caches see the record they
      always saw);
    - it draws the rest of the mesh as a view of its own buffers with the pieces' runs cut out;
    - it draws each share's pieces as one view under `setDissolve` (SHIP-FADE's ordered dither), adjacent runs as one
      range, and sets the dissolve back to whole after.
  - Nothing is uploaded. A view (`meshView`) is its mesh's VAO with no buffer of its own, never handed to destroyMesh, and
    none is made of a dead mesh or of a view. The pass keeps its views per set (at most `EG_OCCLUDE_VIEWS_MAX`, 64) and
    lets them go with the circle.
  - First person, a witness's eye (`host.egWitness`) and the decorator's free camera try nothing; whatever dithered comes
    back whole.
  - THE SWAP keeps its shape. The stand and the swap hand the pass the circle's mesh and its model (`egOcc.set`) and push
    the circle's one draw (`egCircleDraw`). The slot is emptied first: the pass lets the old circle go (`egOcc.clear`)
    before its mesh is freed, and a circle that will not build leaves the pass holding nothing.
- **THE BUDGET, MEASURED** (node, 60 circles: seeds 7, 99 and 12345, circles 1 to 20, as EG-G2 measured the pieces):
  - while nothing stands between, the circle is one draw of a sub-mesh a record, as before: a mean of 7.15 GL draws, at
    worst 8;
  - with any one piece dithering, it costs at most two draws more for each record the piece touches: a mean of 9.15, at
    worst 12;
  - the frame's circle and batched pieces together (`scenes/egPieceBatch.js` through `scenes/egSpan.js`, every copy in
    view) run a mean of 20.7 GL draws, at worst 30, whole, and at most 34 with the worst single piece dithering - under
    the Hour's 82 (23.8, 35 and 39 since the merge with EG-ZL, whose tells are kinds of the batch).
- **THE SHAFT'S LEDGE** (`world/egHall.js` `egShaftLedgeAt`, `EG_SHAFT_LEDGE_M`, `EG_SHAFT_WAY`; `egFragZones` now carries
  a zone's `shaft`, `zB` and `yB`). A body stands on a shaft's ledge facing a drop while its feet are in a zone the law
  marks `shaft`, short of the foot and at least 0.5 m over the foot's height: the rim, every flight down to the Drop, and
  the air between them. The Drop's landing, the Slag Chute's crust, the foot and every other zone are none. Every shaft
  leaves facing +Z (`net/egFragLaw.js` egFragShaft), so its way down is +z in the hall's frame and the dungeon's.
- **THE SHAFT'S CAMERA** (`player/mwView.js` `setSpireShaft`, `spireShaftFacing`, `spireShaftEase`, `spireShaftPitch`,
  `spireShaftPivot`, `spireShaftLook`; told by `scenes/egClient.js` `shaftWay`):
  - facing the way down (the look's bearing within 60 degrees, `SPIRE_SHAFT_FACE_IN`, and held to 75,
    `SPIRE_SHAFT_FACE_OUT`), the camera's pitch biases `SPIRE_SHAFT_PITCH` (20 degrees) under the look's, and its pivot
    rises `SPIRE_SHAFT_RISE_M` (1 m) by the bias's share, eased over `SPIRE_SHAFT_EASE_S` (0.5 s) as the facing comes and
    goes. The orbit carries the eye up its arc too: the real Morrowind camera's eye stands the metre and its distance times
    sin 20 degrees higher, looking down the shaft;
  - both lanes lay it on their own eye before their casts (the Morrowind camera's focal, Eye Of The Beholder's head), so
    the casts guard the leaned eye;
  - reduced motion (the shelf's row or the system's - `ui/egAccess.js` egReducedMotion, the client's `stillNow`) lays none
    (AUDIT EG III: it laid it whole at once, a snap section 11.8 refuses); first person and out of the Spire take none, at
    once; the pitch never passes the camera's own limit (`PITCH_LIMIT`);
  - the frame's eye answers the camera's own forward (`look`), and the dungeon arm's view looks along it after the aim is
    taken (`aimView`, AUDIT CLIMB-ARC F10's order), so the player's aim, the listener and the casts keep the player's look.
- **THE BAND TEXTURES' OWNER** (`scenes/worldModes.js` `egBandsDown`; section 29: "band textures are cached per band and
  freed at the breach's end"):
  - each band's dress goes up once a breach - at a circle's stand, or a prebuild while the Court rests (EG-G2's `egBandUp`,
    unchanged) - and the swap in place uploads nothing;
  - at the breach's end every band it put up is freed: each record's albedo (`releaseTexture`, every variant) and its
    emission (`evictEmissionTexture`), from GL. It is refused while a circle stands, since its draws still wear them. The
    Hour's own art (`SD_REALM_ARCHIVE` - the Steps' faces, and the Hour's) is kept for the session;
  - the breach client says when (`scenes/egClient.js`): on the first frame out of the Spire that is no swap's or answer's
    step under way (`!swapping && !answering`, the reverb's own rule). So the way home, the tear, the last fall's walk out,
    forsaking, a void, a refused or lost socket and leaving the Spire any other way all free it, and the old step under
    the veil (out and in again) keeps it. A reload ends the page's GL context with every texture in it; a reload's return
    uploads again at its stand and frees again at its end.

**The four hosts.**

- `src/scenes/worldModes.js` - WIRED:
  - the dither pass after the cull (`egOccludeFrame`), before the dynamic draws;
  - the circle's draw through `egCircleDraw` at its stand and its swap;
  - the pass handed each circle and cleared first;
  - the view along the camera's own forward after the aim;
  - `egBandsDown`, and the doors `egBandsDown` and `egOccluders`.
- `src/scenes/world.js` - FLAGGED: untouched. The breach client it builds carries both words. Its exterior frame's
  `mwViewFrame` answers no `look`, since the client's word is null outside the Spire. Nothing was added to
  `function frame(now)`.
- `src/scenes/dungeonContext.js` - FLAGGED: untouched. The circle's draw rides its `dynamicDraws` as it did; the pass runs
  in the mode machine's dungeon arm.
- `src/scenes/exterior.js` - FLAGGED: the bench holds no Elite Breach, and its `mwViewFrame` never meets a Spire word.

**Departures, said plainly.**

- **Done another way:**
  - the occluders are runs of the circle's one mesh drawn through views, not meshes of their own. A draw of their own
    would cost each piece's records in every frame; the views cost them only while something dithers;
  - a piece is one solid the builder lays (a wall run, a vault, a bookcase, a ring wall's segment), not a whole fragment,
    so the ray dithers what it crosses and the rest of the rock stands;
  - a dithering piece keeps a quarter of its fragments, not none, so the rock still reads as rock with the body through it;
  - a dithering piece's shadow stays whole (it is recorded with the whole mesh), so no lantern redraws as the camera turns;
  - the facing's cone, the ease and the rise are the port's numbers: the page gives the 20 degrees alone;
  - "a shaft's ledge" is the rim, every flight down to the Drop and the air between them: each has a drop before it;
  - reduced motion leaves the bias off (AUDIT EG III), so a still screen never sees the landing over a shaft's edge
    unless the player looks;
  - the band textures are freed on the client's first frame out of the Spire, not by the room's end word, so a member who
    leaves early frees them early; the Hour's art the Spire also wears is the session's.
- **Not verified without a browser and the game's data:** the dither was drawn on a recording GL (its draws and
  `uDissolveCut` read), never seen; the shaft's camera was never flown (the Morrowind camera's eye computed in node, the
  sprite lane's by its source); the frees were read off the renderer's own maps and GL's `deleteTexture`.

**Pins.**

- `test/egz_camera.test.js` (3), `test/egz_camera_host.test.js` (2), `test/egz_camera_budget.test.js` (1),
  `test/egz_camera_shaft.test.js` (4).
- `tools/mutants/egz_camera.json` (103: 98 dead, 5 kept as equivalent, each with its why - two prefilters of the ray,
  Moller-Trumbore's early out, the marker's empty-piece guard and a share forgotten at whole). Four survived the first run;
  two were killed by new assertions (a niche's floor marked; a ray past a triangle's far edge) and two are the equivalents
  above.
- Re-aimed by content (mutantdrift): `eglook.json`'s EGLOOK-hall-circle-undressed, onto the circle's `const model`. Judged
  again over the text this slice changed: `benchcam1.json` (2), `eglook.json` (2), `egseam.json` (4), `egz_frag.json` (1)
  and `egz_sound.json` (2) - 11, every one dead; and every record of every list on `world/egHall.js` and
  `player/mwView.js` (82), every one dead.
- PIN KEPT by order: the shaft's two lines stand above the Morrowind lane's saddle line, and the view's lean below the
  climb's feel, so COATS3D's and CLIMB4's source pins read their lines as they were.
- PIN MOVED: `test/egswap_client.test.js` (the swap's rig hands the stand's own source `createEgOccluders` and
  `EG_DRESS_RECORDS`); `test/egz_body.test.js` (a zone carries `shaft`, `zB` and `yB`).
- `RELAY_VERSION` untouched: nothing in the relay's import graph moved. `ACCOUNT_VERSION` stays `acct121`; no migration.
- New in `src/`: `src/scenes/egOcclude.js`. The Port-Ledger's ELITE-GATES row is left to the merge.

### EG-ZL - 2026-10-12 - THE PIECES' TELLS ON THE SPANS

(Mac: *"I said I want everything"*.) Section 10.3's tells for the pieces the Spire lays, section 10.8's ghost slab, and
section 25's look on them (the five lights, THE EDGE LINE's gold, the fog floor, reduced motion and the danger palettes).
It closes what `scenes/egSpan.js`'s header said EG-PLAY left - "the Steps' look parts (the pendulums, the dissolve, the
chunks, the ghosts' pass, the waystones); a Beat shows its glyph frames, a Crumble falls whole" - and the stale "still
owed" lines for the pieces' tells in layer two's and layer three's records, which EG-G2's tracks, streamers and Rampart
waystones had already answered. All of it is client-only: nothing in the relay's graph moved.

**What shipped, by piece.**

- **A KIND THAT TURNS** (`scenes/egPieceBatch.js` `add(..., { turns })`, `remap`, `copyVertex`). A Drift's hang, a
  Crumble's chunks and a Gust island's banner turn as well as move. A kind added `turns` writes each copy through its
  slot's whole matrix: every vertex turned and moved, every normal turned. Its cull sphere's centre is turned with it,
  and a copy is re-laid when any of its twelve numbers moves. A kind that only moves keeps EG-G2's law, line for line.
  A kind's draw takes one picture map (`remap`, before the build or after), so the copies one frame of law shows alike
  share one draw.
- **THE GHOSTS, A CIRCLE'S** (`render/sdStepsPass.js` `sdStepsPassVs`, `sdStepsPassFs`, `SdStepsPass(gl, ghosts, { max,
  slab, fogFloor })`; `scenes/egSpan.js` `drawPass`). The Hour's own pass draws the circle's gone Beats and my fallen
  Crumbles (a bone bridge's too), outlined where they return, each with its hand running back to the return. Its count is
  the circle's (`EG_GHOSTS_MAX` 48; the most any of 640 circles measured lays is 31). It keeps the Spire's fog floor
  (`world/egLook.js` `EG_FOG_FLOOR`, section 25.6). Built without the three, its text and its buffer are the Hour's byte
  for byte. The pass is built the first time it draws and freed at the span's clear. The breach client draws it in its
  own pass under the lines (`scenes/egClient.js` `drawPass`, through `dungeonContext.egSpanDraw`).
- **A BEAT** (section 10.3: "a sector sweeping through the solid time; the last 0.4 s white, faltering at most 2.5 Hz; a
  gold ghost while it is gone").
  - A kind a beat (`beatKind`). The pieces of one beat show one frame, so their one draw wears one picture map.
  - Across its solid time the Steps' dial runs frame by frame (`scenes/sdSteps.js` `SD_BEAT_FRAMES`): its hand goes back
    to XII and the ticks still ahead stay lit.
  - Over its last 0.4 s it burns the place's own white and dissolves out a stage each `SD_BEAT_OUT_STAGE_S`. Over its
    first `SD_BEAT_IN_S` it dithers back in.
  - THE DISSOLVE IS MADE IN THE PICTURE (`world/egBandArt.js` `egBeatWarnArt`, `egBeatBackArt`, `egDissolveArt`,
    `egBeatTellMaps`). Each stage is the Steps' dial with exactly the cells its stage keeps (`SD_BEAT_DISSOLVE.keep` of
    16, by the ordered dither, cells of the Steps' own three texels). The rest is a hole and dark. They are uploaded as
    cutouts (the renderer's RW1 holes) under the band block's second archive (`egTellArchive`, 38242 for the Galleries -
    the block's "own later records").
  - The warning's light is the danger palette's hazard (`ui/egAccess.js`): white, or High contrast's cyan with its rim
    line dashed four texels on and four off (`world/sdStepsArt.js` `beatArt`'s `warn` and `dash`; the Hour's own art is
    unchanged byte for byte). Its falter is the Steps' blink law's - shown 0.2 s, then out.
  - Gone, its gold ghost.
- **MY CRUMBLE** (and a bone bridge, the Crumble's law; section 10.3: "three crack stages, and the rewind as it
  returns"). The Steps' own look (`scenes/sdSteps.js` `crumbleLook`) on the Spire's Crumbles:
  - my foot on it grinds where it stands (`AmbientGrind`);
  - its three crack stages flare across the shake (a kind a stage, `SD_CRUMBLE_STAGES`), and its grit pours;
  - fallen, its plate is gone and its chunks (two on a phone) fall, drift and tumble by the Steps' own law
    (`sdChunkWays`, `sdChunkMatrix` - exported, the Hour reads them too), out of sight past `SD_CRUMBLE_SEEN`;
  - its ghost counts the return; in the last `SD_CHUNK.rewind` the chunks fly back up, eased out;
  - whole again, they click home (the clunk pitched 2.6) and it shudders.
- **A DRIFT'S HANG** (`egHangModel(band)`; section 10.3: "hangs on two chains from an anchor 18 m up (an arch rib, a
  ribcage, a moon-shard, a crane hook), leaning as it swings").
  - Two chains of links, every other turned a quarter, hang on the Steps' pendulum's own line (`SD_PENDULUM.foot` either
    side of the deck's middle, clear of a body at its edge) from brackets on the deck's sides up to the pivot
    `SD_PENDULUM.len` over it, in the band's metal.
  - The band's anchor: the Galleries' broken marble arch rib with gold leaf on its crown, the Cairn's bone ribcage, the
    Shade's moon-shard, the Wellhead's iron crane hook on its cable.
  - The whole turns about the pivot by `pendulumAngle` of the law's own swing, as the Hour's pendulums do. A kind a
    hall, so only the halls in view re-lay their swinging copies.
- **THE ISLANDS' WAYSTONES** (section 10.3: "Islands carry the Steps' waystone, lit gold while it is a member's cast-back
  point"). The Steps' waystone stands on every island at the Steps' own place beside its landing
  (`world/sdStepsModel.js` `sdWaystonesOf`). Its rune is lit while my cast-back point (`safe`, a pull's landing too)
  stands on its island, edge to edge, and dark otherwise (`SD_WAYSTONE_DARK`) - one at a time, none on a plate.
- **THE GUST'S BANNERS AND ITS WIND** (section 10.3: "a streamer banner on every island pointing the push 1 s ahead; the
  wind rising (`AmbientWindMoanDeep`)"). The Steps' vane stands on each island of a Gust section (`sdVaneAt`'s place on
  it), swung by the breath's own clock (`vaneYawInto`) to point the coming push a second ahead. The wind and the vane's
  clack sound once a gust while I stand over the section or its islands, and nowhere else.
- **A GHOST SLAB** (section 10.8: "A peer on a crumble the viewer has seen fall is drawn on a ghost slab").
  - `net/online.js` tells `rideAt` of every drawn peer in the Spire. A peer on no ride is told and never moved; a
    ridden one is still moved on its copy.
  - The breach client hands a peer on no ride to the spans (`scenes/egClient.js` `rideDraw`,
    `dungeonContext.egSpanPeer`, `scenes/egSpan.js` `peerOn`).
  - A peer whose drawn feet stand on a Crumble fallen under my own foot - on its top within the capsule, within the
    ride's height band (`net/egFair.js` `EG_RIDE_DOWN_M`, `EG_RIDE_UP_M`) - lights that ghost's top (`EG_GHOST_SLAB`:
    0.35 of the ghost's light, held 0.3 s past the peer's last word). The peer is drawn standing on it, not on air.
- **THE RAIL'S TRACK TICKED AT EACH END** (`world/egLook.js` `egCircleEdges`; section 10.3: "a dashed gold track between
  its plates, ticked at each end"). Across each side's track, at each end of its travel, a tick one dash long at the
  track's own depth, in the same gold. A Drum's track is ticked the same.
- **A DROP'S WALL LIT** (`world/egHall.js` `EG_DROP_LAMP`; section 10.3: "the landing's edge line, gold; the wall's face
  lit"). A lamp of the circle's own light stands over each Drop's landing, 1.5 m before its far wall's face and 4.5 m up
  it, so the wall a body carried too far meets is seen from the takeoff.
- **REDUCED MOTION** (section 25.7: "It, or the system's setting, governs ... the shakes"). The row or the system's
  setting stills every piece's shake the spans draw: a Crumble's shake and its shudder home, a slag crust's last second,
  Grath's cracked isles. The cracks, the falter, the dissolve and the light still tell.
- **Measured** (EG-G2's measure: node, 60 circles - seeds 7, 99 and 12345, circles 1 to 20; before at b4af2365):
  - a circle's GL draws with every copy in view: 13.5 on average (worst 23) before, 16.6 (worst 28) after. With the tells
    at their worst - every Crumble of a circle fallen under my foot, its chunks in the air - 18.8 (worst 31). EG-G2's own
    bound, at most 48 a circle, holds;
  - from Hall 2's plate down its course (seven circles, 300 frames each): 11.0 GL draws on average (worst 15) before, 12.8
    (worst 19) after - the new kinds are a beat's second draw, a hall's hang, the waystones lit and dark, and a Crumble's
    stages, chunks and grit only while they show;
  - the dynamic draws a circle stands (each kind one, drawn or not): 9.1 (worst 14) before, 19.5 (worst 29) after. A
    Falling Wall's circle stands 21 where a draw a piece would stand 208 (EG-G2's tenth, held);
  - the ride and the cull together (seven circles, Hall 2's eye, the two trees run in turn five times): a median frame of
    0.006 ms before and 0.011 ms after, a mean of 0.015 ms and 0.036 ms (node, on a machine shared with other work).

**The four hosts.**
- `src/scenes/dungeonContext.js` - WIRED: `egSpanDraw(proj, view, fog)` (the spans' ghosts and slabs) and
  `egSpanPeer(x, y, z)` (a peer's drawn feet), beside EG-G2's `egSpanCull`. The ghosts' pass is freed by the span's
  clear on every path that clears it (its teardown, `egRecircle`'s swap).
- `src/scenes/world.js` - FLAGGED: untouched. The ghosts draw in the breach client's pass, which `drawEgFight` already
  calls. The peer's word rides net/online.js's `rideAt`, which the client sets.
- `src/scenes/worldModes.js` - FLAGGED: untouched. Its cull before the dynamic draws (`egSpanCull`) already culls the
  new kinds.
- `src/scenes/exterior.js` - FLAGGED: the bench is offline and holds no Elite Breach.

**Departures, said plainly.**
- **Done another way:**
  - the Beat's dissolve is made in its picture (cutouts), not by swapping in the Hour's cut meshes. A kind of Beats stays
    one batched draw; the four stage meshes would have cost about 13,000 vertices a copy;
  - a Beat's frames run a kind a beat. Every circle measured lays its Beats on two beats, half a cycle apart, so a
    circle's Beats are two draws where they were one;
  - a Beat's warning frames (its frame 10 and its falter) are painted for the Spire with the palette's hazard; frames 0
    to 9 stay the Hour's own, their dim ember inlay with them (EG-G2's "the Steps' own pieces keep the Hour's art");
  - the anchor rocks with its chains, as the Hour's gear rocks with its rods, so a Drift's hang is one turning copy;
    its tilt is at most asin(2 / 18), 6.4 degrees;
  - the Gust's "streamer banner" is the Steps' own vane on each Gust island (the Hour's tell for the same breath), beside
    EG-G2's streamers across the section;
  - "the wall's face lit" is a lamp of the circle's own light before it, not a lit face: gold on a wall would say "it
    holds" (section 25.2);
  - the Beat's pictures are the session's: uploaded once a renderer for each band and palette, never freed at a clear -
    the band dress's own law (EG-G2), so a swap uploads nothing again. The ghosts' pass, the batch's meshes and every
    tell's slot are the span's and are freed at its clear;
  - the ghost slab is the ghost's own top, filled in its gold at 0.35 of its light, while the peer's word holds (0.3 s);
  - the Gust's wind is the page's AmbientWindMoanDeep (66), where the Hour's breath blows AmbientWindBlow1 (70).
- **Not built:**
  - the band's glyph on a Beat's face: the page names no glyph a band, so the Steps' dial stands for "a sector
    sweeping through the solid time";
  - the Gust's "streaks at the screen's edge": a screen-space overlay; the streamers and the banners carry its tell;
  - a peer on a Sinking Stair flight I have sunk: the page names the Crumble alone.
- **Not verified without a browser and the game's data:** nothing was seen on a screen. The shaders were run through
  `test/glsl.mjs`, the passes through a recording GL, and the pieces through a counting renderer. The cutout dissolve,
  the chains and the anchors were never looked at, and the frame times are node's, not a phone's.

**Pins.**
- `test/egz_tells.test.js` (9).
- `tools/mutants/egz_tells.json` (65, every one dead on the first run).
- Re-aimed by content (mutantdrift): `egseam.json`'s EGSEAM-the-ghosts-past-the-most (`ghosts.slice(0, max)`) and
  `sd25_steps.json`'s SD25-S9-every-ghost-a-beat-plate (the ghost's `edges`).
- Judged again over the files this slice touched: `egfrag.json`, `eglook.json`, `egplay.json`, `egseam.json`,
  `egz_frag.json`, `egz_stair.json`, `sd25_steps.json`, `egspan.json`, `egz_telegraph.json` and `sd25_look.json` (592: 591
  dead, and `sd25_look.json`'s SD25-the-street-off-its-palette equivalent as recorded).
- PIN MOVED: `test/egswap_client.test.js` - a band's Beats' pictures go up once a session with its dress, never by a swap.
- `RELAY_VERSION` is untouched (nothing in the relay's graph moved), and `ACCOUNT_VERSION` stays `acct121`; no migration.
- No new src module. The Port-Ledger's ELITE-GATES row is left to the merge (it names every file touched).

### EG6a - 2026-10-12 - THE SPAN GENERATOR, THE SWEEP AND THE CROSSING'S BOUND

Mac: "I said I want everything". Section 31's EG6a row, as this slice was cut: the span generator (sections 9 and 10.1),
the real-motor course sweep (section 10.5, "The sweep") and the crossing's bound at THE FAST BUILD (section 10.5). It
retires EG-H1's departure 4 and narrows EG-H3's departure 6 to the riders.

**What shipped, by piece.**

- **THE SPAN GENERATOR** (`net/egSpanLaw.js` `egSpanOf`, new, in the relay bundle). The envelope moved there with it
  (`EG_GAP_MIN_CM`, `EG_GAP_MAX_CM`, `EG_RISER_CM`, `EG_BEAT_HALF_MS`, `EG_STEP_DOWN_CM`, `EG_DROP_CM`, and the die's
  `egDieBetween`); `net/egLaw.js` says them as it always did.
  - `egSpanOf(seed, hall, band, { r, sizes, start, checkR })` draws a hall's every course off the hall's own die (the hall
    law makes it from the seed and the hall, a sub-seed a try - section 10.5's redraw), in the law's integers. It draws each
    piece's numbers at the Steps' own timing (`run`: one riser a hall, Crumbles stepping down, a Drop or still ground under
    2 m), a gap of the envelope (`gap`), an island (`check`, a checkpoint and the next span), a piece placed (`step`), and
    THE FORK's two roads, each its own course spec (`road`). The hall tells it where the hall stands before each piece it
    asks for (`at`: still ground run over, a climb or a fall, said into the road's spec).
  - `courseOf` lays the Spire's specs too. A spec that says its `road` carries the hall law's fields (`gap`, `road`, `kit`,
    `after`); a piece carries its own `x` and its number in the hall's one count (`i`); a `ground` entry is still ground run
    over; a section says its `span`. The Hour's spec still lays the Hour's course byte for byte (EG4's pin).
  - `layHall` calls it. Its `step`, `gap`, `island` and `run` are the generator's, and its passages, set pieces, shafts and
    THE FORK lay their courses through it. The hall's steps ARE its courses laid (`P.steps = S.lay()`, every road's steps in
    the hall's one count).
  - Spec laws 4 and 5 lay byte for byte the halls they laid before: each law's 800-hall hash, and 25,200 halls (24 seeds,
    five grounds, 105 halls, both laws) hashed whole before and after.
  - `egCourseOf(spec, road)` reads a road back off the spec as the Steps' readers take it (`{ road, steps, checkpoints,
    end }`, in metres).
- **THE STEPS' READERS ON THE SPIRE'S COURSES** (`scenes/egSpan.js`). The islands' waystones are read off the courses
  the generator laid: `sdWaystonesOf` over each road's course (`egCourseOf`), the arrival plate none, the Low Road's
  island its own. Over 9,000 halls that is every island of the hall, so each island has exactly one stone. The stones'
  look and the ghosts are EG-ZL's (see "At the merge" below).
- **THE SWEEP** (`tools/egSpanSolve.mjs`, new; `.github/workflows/eg-sweep.yml`, new).
  - The CLI reads a hall's courses through the solver: each pair's windows, the proof, the road's crossing at THE SPAN
    BUILD and at THE FAST BUILD, and `EG_CROSS_MIN`.
  - `--sweep` crosses every course of a seed's circle in each band (each hall's every road, THE FORK's two) STEP BY STEP BY
    THE REAL MOTOR. That is `PlayerMotor` at THE SPAN BUILD (Speed 10, Running 0, Jumping 0; the online page's parkour at
    skill 0 only to run up a riser) on the real `Collider`, over the circle's floors (`egCircleColliderTris`, the one bucket
    the dungeon stands) and its pieces as `createEgSpan` rides them (the Steps' `stepTris` slabs on the shared clock,
    carrying, crumbling, a Pendulum's touch casting back, a Gust pushing). SD7b's harness is the model.
  - A pilot plays each pair as a player would:
    - it stands where it will run from, held there against a push;
    - it takes a launch the solver says lands (`egJumpLands`, now exported), held 0.06 s either side: its own piece standing
      under it to the last, no gust in the flight, a Pendulum's weight clear of the flight's whole line, the two tops lined
      up best within the window;
    - while what it lands on keeps time, it looks ahead: the launch from there must come in time too, the landing allowed
      0.2 s late;
    - it runs at the landing and jumps at the edge itself (pressed 0.1 m short, as SD7b presses it, the motor falls
      short of a Drum's widest roll and of 3.19 m to a round island);
    - what slides under it on the way to the edge it stands on (two Rails' travels meeting), and the hall's own ground at
      the step's height it lands on (a vault's side lane laid across the gap before a step);
    - it runs off a still step a short way down (a running jump flies past a stair), runs up a riser, and leaps the gaps
      the hall leaves in its still ground.
  - A course not crossed fails the run, naming it (`FAIL seed <s> hall <h> road <r> step <i>`), and the exit code is 1.
  - CI: `verify.yml`'s new `sweep` input (25) and its `sweep` job call `eg-sweep.yml` on the commit it verifies: four band
    jobs beside the test shards, the law pin's golden seeds with them. `eg-sweep.yml` runs 500 nightly (06:41 UTC) and on a
    dispatch. `relay-deploy.yml`'s verify asks 500 before a deploy drops a player.
  - Measured on a four-core machine, the four bands side by side: the pull request's 25 seeds and the golden four in
    16-19 s a band (95-111 courses), beside test shards that run minutes; the nightly's 500 and the golden four in
    166-197 s a band. Every one of those 7,582 courses (seeds 1 to 500 of every band, THE FORK's Low Roads among them) is
    crossed.
  - The first 500-seed sweep failed 9 of 5,669 courses past seed 125, every one the pilot's: the jump pressed short of
    the edge, a Rail it jumped past, a side lane it refused. Each is fixed and pinned (the pins below).
- **THE CROSSING'S BOUND** (`net/egSpanLaw.js` `egFastReach`, `egFastCrossAt`, `egFastCross` and `egCrossMin`, new;
  `EG_FAST_RUN_MPS` moved here from `net/egFair.js`, which says it; `EG_FAST_JUMP_X`, `EG_CROSS_SLACK`, `EG_FAST_LEAP_M`).
  - THE FAST BUILD's jump is the motor's 4.5 m/s times 2.3 (Jumping 100, the Jump spell, athleticism improved - pinned to
    `systems/skills.js` `jumpSpeedMultiplier`), a 2.68 m apex; its run is `runSpeed(100, 100)` times Fleetfoot III's 1.1.
  - A road's crossing at it is the earliest arrival over the road's chain (the Low Road's: the trunk, the bridges across and
    back, its own). Every launch is the first that lands; any piece within the build's jump may be leapt past
    (`EG_FAST_LEAP_M`). The crossing is the least over 72 start phases.
  - `EG_CROSS_MIN` is that less 15% (`egCrossMin`, ms). `net/egFair.js` `egCrossMinMs` reads it, and it stays a measure on
    the member's record that gates nothing until EG21.
  - Measured over the 366 roads of seeds 1, 2, 3 and 77: the fast build never waits, leaping past whatever it cannot land
    on. So on every one the bound equals the road's length at the fast run less 15%, the number it measured before - now
    as the solver's answer. It differs where a timed piece holds even the fast build.

**Fixed on the way.** A Gust's breath (`scenes/egSpan.js`, `EG_GUST_REACH_M`) blew over the whole hall's width and from a
hall's first Gust piece to its last. The sweep found a Low Road walker, 15 m across and 4.5 m under, blown off its bridge by
the High Road's breath, and the Crumbles between two runs of Gusts blown as though the runs were one. Each run of Gust
pieces is now its own section, on its own road's line, 6 m either side: `world/egLook.js` `egGustSections`, the streamers'
sections, is the breath's one home, and the screen blows over it. At the merge EG-ZL's banners and wind came to read the
same sections. A banner stands on a run's own islands, never on THE FORK's other road's island beside the run (seed 1's
circle 9, hall 42). The wind is heard over the run's stretch.

**Departures, said plainly.**

1. `egSpanOf` takes no `budget`. Section 9's `egBudget` is EG21's knob and unbuilt, and any budget draw would move every
   hall of laws 4 and 5, which this slice keeps byte for byte. The die is the hall's, handed in, so `net/egSpanLaw.js` stays
   a leaf that imports nothing.
2. The hall law still picks each run's piece and count (the two pieces, the counts by circle and decree). The generator
   draws each piece's own numbers, places it and lays it. The spec gains no field (`egCourseOf` reads a road back off it),
   so `EG_SPEC` stays 5.
3. THE TIMED SOLVER is unchanged, since changing it would move the halls. The sweep found six places where it is looser
   than the motor, and the pilot covers each as a player does:
   - the solver treats still ground as one ground, but the hall law leaves gaps of 2.0-3.2 m in it (a passage's floor and
     the island after it, a Collapsing Tube's end). No piece keeps their time, and the sweep leaps every one;
   - it judges a Pendulum's weight at the flight's middle alone;
   - it never asks what a Beat or a Crumble does under a member standing on it before the next launch;
   - it reads a round island's edge as straight across;
   - its sideways reach counts the capsule over both edges, so at the widest gap the pilot waits for the tops to line up;
   - THE FORK's High Road tail is chained through a ground of no length (the roads' steps are laid apart in the one count);
   - the proof measures a Rail's travel against its neighbours at rest, so two Rails side by side may roll into one
     another (seed 470's band 2, hall 52), their slabs overlapping, and the next is walked onto.
   None has failed a course in the sweep. Each is a solver change for a later spec law.
4. The pilot plays with the solver's windows in hand, so a course that fails can name a wrong guess of the pilot's as
   surely as an uncrossable course. Every failure found while building it was the pilot's or the screen's (the gust),
   none the generator's. One of its readings is unpinned: which spout's crust it stands on (a slag crossing's lane, read
   off the key it landed on). Forgetting it crosses all 7,582 courses still, so no mutant of it can die.
5. The ghosts are EG-ZL's circle-wide ones (its `EG_GHOSTS_MAX`, a Bone bridge among them), not the Hour's reader
   `sdGhostStepsOf` over the course I am on. That reader still takes only the Hour's course; the Spire's courses feed it
   nothing yet.
6. The fast build's crossing reads the pieces' tops as the solver does: a leap over a riser or through a Pendulum's lane is
   not refused. A lower bound may only err fast.
7. The page's "every changed golden spec" is the law pin's four golden seeds, swept on every pull request.
8. Section 10.6's pull's toll and the Drop's own tells were not among this slice's items.

**The four hosts.**

- `src/scenes/world.js` - FLAGGED: untouched at the merge. The breach client's pass (`scenes/egClient.js`, EG-ZL) draws
  the spans' ghosts. This slice's second draw in `drawEgFight` was deleted, or every ghost was drawn twice a frame.
  Nothing was added to `function frame(now)`.
- `src/scenes/dungeonContext.js` - WIRED by EG-ZL's door: `egSpanDraw(proj, view, fog)` (and `egSpanPeer`), the one
  kept of the two this slice and EG-ZL each wrote.
- `src/scenes/worldModes.js` - FLAGGED: untouched; it already calls `host.drawEgFight` for every Elite hall.
- `src/scenes/exterior.js` - FLAGGED: offline, no Elite Breach (section 28).

**Not verified without a browser and the game's data:** the waystones and the banners read off the courses were never
drawn. They were checked as slots and matrices, not pixels. The sweep crossed with the real motor and collider in node, never with a person at the keys. The workflows have
not run yet: the nightly runs only from main.

**Pins.**

- `test/eg6a_span.test.js` (5), `test/eg6a_sweep.test.js` (4), `test/eg6a_screen.test.js` (3 since the merge). The sweep's file crosses
  the hard courses by name: seed 295's Drum and seed 147's round island (band 0), seed 362's vault lane (band 0), seed
  470's meeting Rails (band 2).
- `tools/mutants/eg6a.json` (71 at the slice, 62 since the merge, every one dead; judged on the merged tree beside `egz_tells.json`'s 65 and `eg5.json`'s 40 - 167 dead). Six were judged again after the gust
  sections moved to `world/egLook.js` and the die's draw was renamed - dead.
- Re-aimed by content and judged again: `egseam.json`'s EGSEAM-the-line-lost (courseOf's line now names the Spire's
  road). Judged again over the five files whose text moved (`net/egSpanLaw.js`, `net/egLaw.js`, `net/egFair.js`,
  `scenes/egSpan.js`, `world/egLook.js`): the 113 records the other lists aim at them (egarch, egfrag, egfull, egint,
  eglook, egmade, egplay, egseam, egspan, egz_frag, egz_legion, egz_telegraph, sd10b, sd7a) - every one dead.
- `RELAY_VERSION` `world198`, unshipped, rehashed in place: `net/egSpanLaw.js`, `net/egLaw.js` and `net/egFair.js`
  changed. Rehashed again on the merged tree, its note after every other slice's. `ACCOUNT_VERSION` stays `acct121`;
  no migration.
- New: `tools/egSpanSolve.mjs` and `.github/workflows/eg-sweep.yml`; `src/` gains no module. The Port-Ledger's
  ELITE-GATES row names them (at the merge).

**At the merge** (the pull request's head 17491139: EG-ZI, EG-ZO, EG6c, main, EG5 with EG-ZK, EG-ZM, EG-ZN and EG-ZL).

- EG-ZL built the same two things this slice built in `scenes/egSpan.js` and `render/sdStepsPass.js`: the Steps' waystone
  on every island, lit at the cast-back point, and the gold ghosts for gone Beats and fallen Crumbles. EG-ZL's is the
  more complete, so it is the one kept:
  - its ghosts are the circle's (up to 48, a Bone bridge among them), each with a slab for a peer standing on a Crumble I
    have seen fall, under the Spire's fog floor;
  - its stones are batched slots, lit and dark;
  - its seams are `egSpanDraw` and `egSpanPeer`.
- DELETED from this slice:
  - the course window of ghosts (`poseGhosts`, `SD_GHOSTS_MAX` nearest ahead);
  - `SdStepsPass.setGhosts`;
  - the stones' own mesh and `poseStones`;
  - the `stones` and `ghosts` getters;
  - `scenes/sdSteps.js`'s `WAYSTONE_DARK` export (EG-ZL's `SD_WAYSTONE_DARK` is the one);
  - the second ghost draw in `world.js`'s `drawEgFight`.
- FOLDED INTO EG-ZL's:
  - its stones are read off `egCourseOf`;
  - its gust (push, banners, wind) reads `egGustSections`' runs on their road's line.
- PIN MOVED: `test/eg6a_screen.test.js`.
  - Its waystones test reads EG-ZL's `marks.stones`, standing two frames because the marks are posed at the frame's start.
  - Its ghosts test is deleted: `test/egz_tells.test.js` pins the kept ghosts.
  - Its hosts test now pins one ghost draw a frame.
  - Its gust test adds the banner on the run's own line.
- Mutants:
  - eleven `eg6a.json` records went with the code they mutated;
  - two are new: the banner on the other road; the world host drawing the ghosts again;
  - `egz_tells.json`'s EGZL-banner-none was re-aimed by content (the banner's test now names the run's line).
- EG5's change to `net/egLaw.js` (the fight profile) merged clean. The merged tree's 25,200 halls (laws 4 and 5) hash as
  the pull request's head's do, and each law's 800-hall hash holds.
- The sweep on the merged tree: the 25 seeds a band and the golden four, all crossed. Seeds 1 to 500 of every band,
  7,582 courses, all crossed.

### EG-ZJ - 2026-10-12 - THE FIGHT WHOLE ON THE WIRE

Mac: "I said I want everything". Closes what sections 11.7, 22 and 23 left of the fight's own words: every body's height on
the wire and on every screen, the whole fight handed to a member who joins or reloads mid-fight, and the shaft's
telegraphs on the slag's own surface. It closes EG-ZB's departure 3 (the wire carried no body's height), layer three's look
departure (a joiner saw Grath's islands standing until the next `eob`) and EG-ZC's departure for the telegraphs of a
shaft. Each sentence is deleted where it stood.

**What shipped, by piece.**

- **A BODY'S FEET** (`net/egWalkGraph.js` `egFeetAt`, `egWalkFeet`; `net/egLegion.js` `egAirY`, `walkGraph`, `walkAir`).
  - `egFeetAt` gives the fight ground under a body (`egGroundAt`, 0.3 m about its plan). It looks first in section 11.7's
    band about where the body stood. With nothing in that band it takes the lowest floor that holds the plan: a leap up past
    a floor's rim, a fall off a lip. With no fight ground under it at all (the void, a wall's alcove) the body keeps its own
    height. Heights are whole centimetres, the law's.
  - A graph walker's feet are its region's floor (`egWalkFeet`: the region it stands in, and the one its next walk ends
    in). `walkGraph` sets its feet on a region it has just entered, so a lip stepped off is a drop at the lip and never a
    glide. Its walk ends on its next node's floor, so a stair is climbed as it goes. `egWalkNext` now reads the walker's own
    region by its feet (`b.y`), where it read the plan alone. A Caster on a pillar whose plan shares a bastion's now stands
    on the pillar.
  - A flier's height is its mark's (`egAirY`). It keeps the floor under the mark while the mark's feet stand in that
    floor's band, so a jump never lifts it. Past the band it keeps the mark's own feet: a member on a span's platform, a
    hunted member held high. Every flier is given its mark: a span's shadow its member, a span's Diver the island ahead, a
    Diver elsewhere its member, a hunting Harrier the hunted, a Wraith coming or tethered, a Shade its slayer.
- **THE BODY'S WORD** (`net/egBodies.js`; `net/wire.js`).
  - A body carries its feet (`y`). `egBodyNew` takes a height it is given, else `egFeetAt`. A raise's spot may carry a
    height (`egRaise`, `egLegionRaise`: `[x, z, y]`). The director raises a span's shadows at their member's height and its
    Divers at the island's (`spanLegion`), a false wall on its alcove's own floor (`fragStand`), and a Rampart's pinned
    Casters on their pillars' tops (`standFight`'s `onPillar`).
  - A walk carries its height and its end's (`mv.y`, `mv.ty`). `egWalkY` carries the height along its place and `egCarry`
    carries it with the place. `egWalk` says a walk again when its end's height moves past `EG_Y_RESAY_M` (0.6 m, a level's
    own band), or when the body's feet have left the walk's line (a lip stepped off). A standing body whose ground moves
    under it is said again too. `egStop` keeps its feet. `egPlace` sets a body down on the ground at its landing, by the
    band about where it stood.
  - On the wire a body's row is seventeen, `[i, role, k, pt, x, z, hp, max, fl, tx, tz, v, at, y, ty, st, sa]`, and a walk
    (`emv`) is nine, `[i, x, z, tx, tz, v, at, y, ty]`. `validEgOut` bounds both heights at the hall's coordinate bound
    (`EG_XZ_MAX`, 400 m) and the state at 0-99.
  - THE FIGHT'S GROUND. `egFightBind` keeps the hall's fight view (`egFightView`) on the fight unenumerated, because storage
    keeps the fight and never its hall. `egFightNew` binds it. The director's `specOf` binds it again on every word it takes,
    a beat's or a blow's. So a woken room's restored fight stands what it raises, places and walks on its ground from its
    first word.
- **THE JOINER'S STATE** (section 22; `net/egBodies.js`, `net/egLords.js`, `net/egLink.js`).
  - Every object's state word goes through `egObSay`, which keeps the state on the object as said (`egSaid`: `ws`, and
    since when, `wsAt`). That covers Grath's islands cracked, fallen and risen, the soul-gems' souls laid and emptied, and the
    runes lit and stood on. A lord keeps its phase from its wake and its fall's instant. On the wire that is the row's `st`
    and `sa`: a lord's `st` is its phase once awake (0 asleep), and a fallen lord's `sa` is its fall.
  - THE WHOLE FIGHT (`egFightState`) carries every body at its instant, with its walk carried to that instant (its place,
    its height and its `at` then), its feet and its state. It also carries the zones still to burn (`zs`): burning ground,
    a fallen island's void, a Soul-Pool, a haven (which stands the Moon-Mirror's lit branch). `server/src/index.js`
    `_egHello` already handed `st` and the whole fight. It now hands all of this, and needed no change.
  - THE SCREEN'S FOLD (`egBodyOf`, `foldEg`). The whole fight folds over what the screen already holds:
    - a body it knows keeps when it rose, its hurt and my blow on it (`born`, `hurtAt`, `mineAt`);
    - a body first heard whole has stood all along (`born` 0) and never rises;
    - its state is the room's: an object's `st`/`stAt`, a lord's `ph`, its `fellAt` from its fall's word;
    - the zones are the room's.
    A lord's flags fallen lay it down at once (`efl` - a Twin's first fall says no `efell`), and raised again it stands.
  - Engines' cooldowns are not carried: no screen draws one (the engine's subtitle says "once in 30 seconds" whatever its
    cooldown, and the Shelf's says only "Work it" - AUDIT EG III: it topples once). The Gutterdark, the Rails and a gust
    are not carried either: no screen draws the first two, and a gust is a moment's push.
- **THE SHAFT'S TELEGRAPHS** (`world/egTelegraph.js` `egHazardSurface`; `scenes/egFight.js`).
  - A fragment hazard's own surface is its height when it is of the traversal ground (`aim` 'trav') or the Cooling Slag's
    spill. The spill's lanes pour over a crossing's crust, which is a step of the course and never a fight floor, and over
    its lip. The fight draws the spill told and pouring at that height as one quad of its own (`egFloorPlan`'s own-surface
    draw), as EG-ZG drew the `'trav'` shapes. A crust's last second, told in white, is drawn on the crust's own surface
    (`sh.y` the step's).
  - Checked against the law, before and after. The test finds the first Wellhead Deepway that goes down by the Slag Chute
    (Seed 1's Hall 82: its crust at -5.9 m, no fight floor under it). Before, the floors' plan drew the spill, and the
    crust's tell, only where it clipped them onto the passage floor past the lip (an anchor within 1 m of it), and nothing
    over the crust. After, each is one quad on the crust's surface. A Forge Gut's spill over its chasm is one quad too,
    where before only its lip drew on the far floor.
- **Fixed on the way** (found while building it, each pinned):
  - the whole fight, said every two seconds, stood every body anew on every screen. Every add rose out of the floor again,
    Grath's islands stood again, a fallen lord stood up, a lord's phase was forgotten, and each walk ran ahead by its head
    start (its `at` was the walk's start, its place the room's carried one). The folds above end all of it;
  - the lord's bar never showed in a lord's first phase. `egLordBar` reads a lord awake by its phase, and no word said
    phase 1. The whole fight now says it within 2 s of the wake;
  - bodies stood off the hall's own height were drawn at it, and struck at by the screen's own targets there: the Last
    Armsmaster's Court laid at 2.3 m (Seed 1's Hall 30), the Lurkers past a Deepway's shaft (its floors 5.7-8.1 m down), a
    false wall in an alcove under the course.

**At the merge** (the PR's head at 17491139: EG-ZI, EG-ZO, EG6c, main's #840-#851, EG5 + EG-ZK, EG-ZM, EG-ZN and EG-ZL):
- **THE LORDS ON THE SEAM WALK ON THEIR FEET.** EG5 + EG-ZK put every lord and champion on the boss seam (`EG_SEAM`) and
  walking the hall's graph by the legion's own `walkGraph` and `walkAir`, now exported from `net/egLegion.js` with this
  slice's heights in them. So a lord's feet ride the wire as a legion walker's do:
  - a straight walk within its region ends on the ground there (`egWalk`'s `egFeetAt`): a lord on a raised Court walks
    at the Court's height;
  - a walk over the graph climbs its stair and drops at its lip (`walkGraph`'s `egWalkFeet`): Grath along his bridges on
    islands laid at 2.3 m (Seed 1's Hall 60), a champion up a chamber's stair (Seed 31337's Hall 43);
  - a leap, a run's end or a blink lands on the ground there (`egPlace`), and the Mother of Dusk circles at the ground
    under her goal (`walkAir` with no mark: the flier's own rule).
  One line was changed for it (`lordWalk`). EG-ZK takes a node as reached within `EG_NODE_REACH_M` (0.7 m) even when a
  blow stopped the lord short of it. That lord's region became the floor above while its feet stayed on the stair. Its
  feet are now set on that region's floor (`egWalkFeet`), as `walkGraph` sets a legion walker's. Without it, the
  Kynmarcher stopped 0.4 m short of its stair's top at 3.71 m and then walked the floor above at 3.84 m and 3.96 m,
  never at 4.
- **THE OBJECTS' WORDS THROUGH THE SEAM.** The seven `egObSay` words and a lord's wake, phase and fall (`egSaid`) sit in
  the lords' own law, which the seam plugs. The seam's `stateOf` is `egFightState`, so the whole fight the director says
  (`egFightStateOf`) carries every row at its instant, its feet, its state and the zones still to burn. The joiner's
  test runs Grath's Court through the seam unchanged.
- **EG-ZK'S FRAMES, BYTE FOR BYTE, DO NOT HOLD.** EG-ZK hashed every frame the director says, with
  test/egfull_relay.test.js's auto-player (the thirteen lords each to its fall, and the six-circle breach), and found
  all fourteen unchanged against b4af2365. Eight lords whose grounds are one region each said the same frames as before.
  Over this slice that cannot hold: every body's row is seventeen and every walk nine, and the whole fight's walks are
  carried to its instant. What holds was measured at the merge with the same auto-player, on EG-ZK's head and on the
  merged tree. With the heights taken off (a row's `y`, `ty`, `st` and `sa`, a walk's `y` and `ty`, the whole fight's
  `zs` and its walks' `at`), all fourteen runs say the same frames, as many, word for word. Every lord's walk, blow,
  place and fall is EG-ZK's own. test/egz_lords.test.js (each seam member the lords' own law, frame for frame) is
  unchanged and green.
- **EG-ZB'S DEPARTURES.** EG-ZK closed its departure 2 (the lords walking as before), this slice its 3 and EG-ZI its 8's
  Lifeline. All three sentences are deleted, and the departures left are renumbered 1 to 9. The records name each by its
  number when it closed.
- EG-ZC's shaft sentence lost its camera clause to EG-ZN (the camera's bias over a shaft's drop, built) and its
  telegraphs to this slice. "A shaft keeps no alcoves or vignettes." stands.
- EG-ZI's `toll` word rides beside the fight's words in `net/wire.js`, and its toll, late wake and Lifeline sit in
  `net/egBrain.js` beside this slice's `specOf` and spots. Nothing of either moved the other.
- `ACCOUNT_VERSION` is `acct122`, renumbered by the lead's merge of main's #840-#851. This slice touches no account law.

**Departures, said plainly.**
1. The heights ride the words the fight already says, the body's row and the walk, with no frame of their own. A row grows
   by its four fields: 8 bytes at a floor's 0, at most 33 at the wire's bounds. A walk grows by its two. Over 60 s of a
   Rift-Yard fought by four with its legion up, the room's frames weighed 75,068 bytes before and 83,043 after (+10.6%), in
   the same number of frames. Section 23 names no per-frame number. The relay's 16 KiB frame holds a 64-body fight's rows
   at their bounds (8.3 KB).
2. A walk's height runs in a straight line from its start to its end: a stair's own line, a flier's climb to its mark. A lip
   stepped off is a drop at the lip. A leap, a blink and a charge's end land on the ground at the landing, by the band about
   where the body stood, or on the lowest floor there when the band holds none.
3. A body raised at a spot with no height of its own stands on the lowest floor that holds it, so a spot inside two floors'
   plans (a balcony's rim over its chamber) raises it on the lower one. The Rampart's pinned Casters are raised at their
   pillar's own height.
4. A flier keeps its mark's floor while the mark stands in that floor's band, so a jump never lifts it. A Diver over a span
   circles at its island's height. One with no island or plate ahead circles at nought, but such a member stands off the
   hall.
5. The lord's phase rides the whole fight, not a word of its own at the wake, so the bar shows within the next whole fight
   (2 s) of the wake. An `eph` at the wake would have been heard as a phase's growl.
6. Engines' cooldowns, the Gutterdark, the Rails and a gust are not handed to a joiner: no screen draws them.
7. A blow Watchfire told a member before its word (`tell`, at most 400 ms ahead) is not told again to one who joins in that
   instant.
8. `server/src/index.js` is unchanged: its hello already sent `st` and the whole fight.

**The four hosts.**
- `src/scenes/world.js` - FLAGGED, nothing to wire: the fight draws its bodies in the pass the host already calls, and
  `feet`, `peerAt` and the link are as they were. Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED: untouched.
- `src/scenes/dungeonContext.js` - FLAGGED: untouched (the breach client's `drawPass` it already calls draws the bodies).
- `src/scenes/exterior.js` - FLAGGED: offline, no breach (section 28).

**Not verified without a browser and the game's data:** the bodies' heights, the joiner's screen and the slag's quads were
checked against the director's own words, the screen's batches, targets and sounds, and the floor plan in node. None was
seen in the live game.

**Pins.**
- `test/egz_state.test.js` (7): the feet's law, the director, the lords on the seam (added at the merge), the screen, the
  joiner, a reload in the real Room, the shaft's telegraphs.
- `tools/mutants/egz_state.json` (96, every one dead; two added at the merge: a lord's straight walk at the hall's 0, and
  its feet left on the stair at its top). One survived the first run - the pinned Casters raised at a spot's height
  again - and was killed by finding a Rampart whose pillars given to a company of two share a bastion's plan.
- Re-aimed by content (mutantdrift): `egz_frag.json`'s EGZ-the-breach-s-law-forgotten (onto `specOf`'s own line) and
  `egz_legion.json`'s EGZ-ground-walkers-straight (onto `walkGraph`'s). Judged again, every record of the lists aimed at
  the fight's modules this slice touched (`net/egBodies.js`, `egLegion.js`, `egLords.js`, `egWalkGraph.js`, `egLink.js`,
  `scenes/egFight.js`, `world/egTelegraph.js`) and those within ten lines of its changes in `net/egBrain.js` and `net/wire.js`:
  `egz_telegraph.json` (52), `egz_legion.json` (21), `egint.json` (15), `egz_sound.json` (12), `eglook.json` (6),
  `egz_recap.json` (6), `egz_return.json` (6), `egfrag.json` (5), `egpres_hud.json` (4), `egz_frag.json` (3) and
  `egspan.json` (2) - 132, every one dead.
- PIN MOVED: `test/egplay_relay.test.js` (a body's row of seventeen, cut short at sixteen); `test/egz_stair.test.js` (its
  two hand-built rows of seventeen).
- At the merge: `egz_lords.json`'s EGZK-a-reached-node-forgotten re-aimed by content onto `lordWalk`'s line, which now
  sets the feet too. Judged again on the merged tree: `egz_state.json` (96), `eg5.json` (40), `egz_lords.json` (35: 33
  dead, its 2 equivalent as recorded) and `egz_rules.json` (78) - every one as recorded.
- `RELAY_VERSION` `world198`, unshipped, rehashed in place: `net/egWalkGraph.js` now walks before `net/egLegion.js` in the
  relay's graph, since `net/egBodies.js` imports it. Rehashed in place again at the merge, over EG-ZI's `toll` and EG5 +
  EG-ZK's seam. `ACCOUNT_VERSION` is untouched (`acct121` when this slice was cut, `acct122` since the lead's merge of
  main), and there is no migration.
- No new src module. The Port-Ledger's ELITE-GATES row is the lead's.

### EG-ZP - 2026-10-12 - THE CLIENT'S LAST DEBTS

Mac: "I said I want everything". Three debts the screen still owed. The member's own client applied no team Vestige to a
blow it took, while the relay's census did (EG-ZI's "Not built"). The Spire's circle kept its meshes after the player left
(section 29, found by EG-ZN). And the page kept sentences the code had closed: EG-H1's departures 3, 10 and 11 and layer
three's straight-walking legion, which EG-ZB said it retired. This slice closes EG-ZI's departure 12; that sentence, and
each stale one below, is deleted above.

**What shipped, by piece.**

- **THE RECEIVER'S VESTIGES** (`scenes/egFight.js` `egShieldDr`, `egShieldBreach`, `spared`; sections 15 and 21).
  - A blow of the fight that lands on me (`F.blows`, the census's `k` 0) is now spared on my screen by the share the
    relay's census spares the same blow: Bastion within 6 m (the strongest, and 2% for each other holder, 6% over it at
    most), my Steadfast Line with three allies within 8 m, my Challenger's Oath on a lord's blow, my Immovable still a
    second on a fight floor, and my Lifeline windows. Together they never pass 30%.
  - The law is not copied. The screen calls the census itself (`net/egBrain.js` `egCensusDr`) on what it holds:
    - the breach as the census reads it, built from the room's own words (`egShieldBreach`): each company row's `in`,
      `alive` and `home`, each run's Vestiges and Mastery (`ms`), and my windows on mine;
    - the fight's lords (`F.bodies`) and the hall's fight floors (`net/egWalkGraph.js` `egFightView`);
    - my trail, kept each frame in the census's own shape (`[t, x, y, z, h]` in the hall's frame, its last `EG_TRAIL_MS`
      and the one before);
    - each companion where the screen draws it at the blow's landing, at its feet (the pose stands at the eye,
      `PEER_EYE_M`). A companion the screen does not draw is unseen, as the census counts no member it holds no pose of.
  - `landShare` takes the share (`dr`). The blow's share of my health and its points are both spared by it before the
    saving throw, so its share is the census's to the thousandth: a 0.4 blow beside a Bastion III holder takes 352 of
    1,000 health on the screen and 352 thousandths off the count.
- **LIFELINE, THE RECEIVER'S HALF** (`scenes/egClient.js` `lifelineSaid`, `egLifelineOf`; `scenes/egFight.js`
  `egLifelineOpen`, the fight's `lifeline(v, at)`).
  - Each heal word the screen says (`heal`, EG-ZF's) is read as the census reads it (`egHeal`). If I stood under 30%
    within `EG_LIFELINE_LOOK_MS`, the strongest Lifeline among its healers opens a window on my blows. Healers are named
    by account (`accountOf`, the host's `net/social.js` `accountOfPeer`, as `egPeers` names the company), read by the
    runs the room says, and never mine.
  - "Under 30%" (`lowAt`) is my body seen so at a frame in the Spire, or before the heal that lifted me (my body less
    the heal, as the census reads the count before it).
  - The window is the census's own: `[from, until, share]`, from `EG_HEAL_WORD_MS` before the word's arrival to
    `EG_LIFELINE_MS` after it. The arrival is the word's send on the shared clock plus the half round trip
    (`net/egClock.js` `egClockHalfRtt`). Windows no blow can still be judged in are let go, four are kept, and the
    strongest window's share applies. The numbers are imported from `net/egBrain.js` and `net/egFair.js`, never declared
    again.
- **THE CIRCLE'S MESHES FREED** (`scenes/worldModes.js` `egCircleDown`; `scenes/dungeonContext.js` `addTeardown`; section
  29: "every exit path ... frees the hall's meshes, colliders, riders").
  - `egCircleDown(ctx)` lets the whole circle go from the context it stands in:
    - the slots are emptied first: the mesh, its key, the portcullises, the waystones' mesh and the lamps;
    - the dither pass is told next (`egOcc.clear`, its views of the mesh let go);
    - the circle's draws leave the context's list, and its floors' bucket and each portcullis's moving bucket leave the
      collider;
    - the meshes are freed last, the circle's, the waystones' (`world/egLook.js`) and every portcullis's, so a second
      call frees nothing twice.
  - THE SWAP now lets the old circle go through it: the same lines, moved into the one teardown.
  - The stand hands the context the circle's teardown (`ctx.addTeardown`). The dungeon host keeps its teardowns and runs
    each once in its own `destroy()`, beside the spans' clear. Every road out of the Spire destroys the context: the
    exit (the way home, the tear, a fall's walk out, forsaking, a void, a refused or lost socket), the forced exit (a
    load, a teleport, a respawn) and the two builds abandoned after the stand. So each frees the circle once, and the
    old step under the veil frees it before the next circle stands.
  - The circle goes at the context's end, before the mode turns. The band dress it wore goes on the client's first frame
    out of the Spire (EG-ZN's `egBandsDown`, still refused while a circle stands), so the dress always goes after the
    circle.
  - A way back into the same circle builds it anew, where it once found the old mesh still standing.
- **THE PAGE'S STALE SENTENCES**, each checked against the code (RETIRING A FLAG DELETES THE SENTENCE):
  - EG-ZI's departure 12 (*Not built*: the receiver's client) is deleted.
  - EG-H1's departures:
    - its 3 loses the fallen segments, which EG-ZB made hold nobody (`net/egFair.js` `bandFallen`). The belt's sentence
      stands: belts are still carried under the push's allowance and never ridden (`EG_RIDE_KINDS`);
    - its 11 (the fire fall, the hammer line, the soul-wisp's drain) is deleted. EG-ZB judges the traversal hazards
      (`net/bossRef.js` `judgePlace`) and counts the drains (`censusDrains`);
    - its 10, whose Vestige half EG-ZB and EG-ZI had already closed, stands as it was: the census counts a plain blow's
      share and never its points, since the relay holds no member's maximum health (`judgeShapes`).

    Found on the way, closed by later slices and deleted with them:
    - its 5: EG-ZA's Redoubt receipt carries THE FAIR TRAIL's measures (`m`);
    - its 8: EG-ZD built the feint's dashed fade;
    - its 9's second sentence: EG-ZG built the peril arrow (`world/egTelegraph.js` `egPerilOf`);
    - its 12: EG-H2 put the fight's closures off the saved record, so a trial checkpoints;
    - its world.js host flag's clock sentence: EG-ZD put `egNow` and the spans' anchored clock on the corrected clock.

    The rest are renumbered: old 4, 6, 7, 9, 10 and 13 are now 4, 5, 6, 7, 8 and 9.
  - Layer three's "The legion walks straight to its mark ... an arch's walls do not yet turn it" is deleted, with its
    pointer in the chambers' bullet ("the relay's walkers do not yet route through it - see the departures"). EG-ZB's walk
    graph routes every ground walker through an arch's gap (`net/egLegion.js` `walkGraph`, `net/egWalkGraph.js`
    `egArchCut`).

**The four hosts.**

- `src/scenes/world.js` - WIRED: the breach client's `accountOf`, a heal word's healer by account (`social.accountOfPeer`,
  the way `egPeers` names the company). Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - WIRED: `egCircleDown`, the stand's teardown handed to its context, and THE SWAP through it.
- `src/scenes/dungeonContext.js` - WIRED: `addTeardown`, and the teardowns run once in `destroy()`.
- `src/scenes/exterior.js` - FLAGGED: the bench is offline and holds no Elite Breach (section 28).

**Departures, said plainly.**

1. **The screen applies the census's whole reduction**, Challenger's Oath and Immovable with the three team Vestiges: one
   sum under one cap. With three of the five the screen would disagree with the census whenever the cap binds. Section
   15's table gives both to the client as well.
2. **"Under 30%"** is read off my own body, where the census reads its count and my body's word. They agree when the word
   and the count do.
3. **Lifeline's window opens when the word goes.** A blow already taken inside its back second is not given back. The
   census also judges each blow once, so a blow it judged before the word arrived is not spared there either. The two
   can differ only within the one-way delay.
4. **The heal bucket is not mirrored.** The screen believes a companion's heal that reached it. A heal the room's bucket
   refuses (more healing than an honest company casts) opens a window on the screen alone.
5. **The places are each side's own.** A companion stands where the screen draws it, and the census reads where its
   trail stood. My trail is kept each frame, so Immovable's stillness is judged on more samples than the poses the
   census reads.
6. **A blow's points are spared by the same share.** The census counts none (EG-H1's departure 7, as renumbered once EG6a's merge retired its 4). Zones,
   hazards, drains, the toll and cast-backs are spared nothing, which is the census's own rule (EG-ZB's departure 8).
7. **The circle goes with its context**, not with the client's word as the band dress does. A way back into the same
   circle builds it again. The fight's telegraph and crystal passes are a screen's, built once a session and kept. The
   spans' riders and meshes are the dungeon host's own and go at its clear, as before.
8. **The page's numbers.** Code comments that name a retired EG-H1 departure by number name it as its closing slice found
   it ("EG-H1's departure 3 closed" in `net/egFair.js`, its 11 in `net/bossRef.js`, its 10 and 11 in `net/egBrain.js`).
   The two tags renumbering would have pointed at another sentence (`scenes/egFight.js` and `render/gateTelegraph.js`, "EG-H1's departure 8") now
   read "an EG-H1 departure retired". EG-ZB's departures keep their gap at 2 (EG5 + EG-ZK deleted it without
   renumbering), since EG-ZI's pointer to their 8 would move.

**Not verified without a browser and the game's data:** nothing was played. Each blow was counted on the director's own
breach and fight (`egCount`, `egHeal`) and on `createEgFight` with no renderer, and the heal word on `createEgClient`
against a stub host. The circle's frees were counted on a counting renderer over the real collider, not on GL.

**Pins.**

- `test/egz_debts.test.js` (6) and `test/egz_debts_circle.test.js` (3).
- `tools/mutants/egz_debts.json` (49, every one dead on the first run).
- Re-aimed by content (mutantdrift), all dead: `egseam.json`'s EGSWAP-the-old-circle-kept, -the-old-floors-kept,
  -the-old-gates-kept and -a-freed-mesh-drawn, `eglook.json`'s EGLOOK-swap-old-waystones-kept and `egz_camera.json`'s
  EGZN-swap-keeps-the-old. They now aim at `egCircleDown`'s lines, which the swap goes through.
- Judged again: the eleven records of other lists aimed at or beside a line this slice changed (`egint.json`,
  `eglook.json`, `egseam.json`, `egz_camera.json`, `egz_ends.json`, `egz_recap.json`), every one dead; and every record
  of the arc's lists aimed at `scenes/egFight.js`, `scenes/egClient.js`, `scenes/worldModes.js` or
  `scenes/dungeonContext.js` (276: 275 dead, and `egz_ends.json`'s EGZM-slot-emptied-after equivalent as recorded).
- No pin moved. `RELAY_VERSION` and `ACCOUNT_VERSION` are untouched (nothing in the relay's graph moved); no migration.
  No new src module, so the Port-Ledger's ELITE-GATES row is unchanged.

### EG-ZQ - 2026-10-12 - THE RELAY'S LAST DEBTS

Mac: "I said I want everything". Six debts the relay's slices found and recorded, each built to the page: the legion's stale
node (EG5 + EG-ZK's departure 7), the Rampart's pinned Casters (EG-ZJ's finding), the lords' shares (section 13.2; EG5 +
EG-ZK's departure 1), Colossal's size (EG5 + EG-ZK's departure 3), the Markynaz's decree (EG5 + EG-ZK's departure 6) and the
spots' heights (EG-ZJ's finding). All relay law but the size, which every screen draws. Each sentence is deleted where it
stood: EG5 + EG-ZK's departures 1, 3, 6 and 7, its "so a join brings no share", and EG-ZJ's "Found, not changed" with both
its bullets. EG5 + EG-ZK's departures left are renumbered 1 to 3.

**What shipped, by piece.**

- **THE WAY ON, KEPT ONLY WHILE IT IS WALKED** (`net/egWalkGraph.js` `egWayOn`; section 11.7).
  - EG-ZK's rule for the lords is the graph's own now, in one function. The node a walker headed to (`b.wn`) is a way on
    only while its walk (`b.mv`) still goes to it. A walker set down since keeps none: a Breaker's charge cut at an arch's
    wall (`net/egBodies.js` `egPlace`), a push, a pull, a lord's blow, leap or blink, or a straight walk elsewhere. A node
    it stands at (within `EG_NODE_REACH_M`) is reached: its region and its floor are the walker's.
  - Both walkers ask it. The legion asks before each step over the graph (`net/egLegion.js` `walkGraph`). The lords ask
    before they choose a straight walk or the graph (`net/egLords.js` `lordWalk`), and the function replaces their inline
    copy, line for line, feet included.
  - `egWalkNext` itself is unchanged. A walker handed a node with no walk keeps it, as EG-ZB's graph test walks one by hand.
  - Checked on seed 77's Hall 14, a Rift-Yard's chamber whose arch splits its floor. A Lurker walks to a member past the
    arch, through the gap, and heads for the gap's far node. Set down back beside the wall on its own half, its next walk
    went before straight to that node, across the wall. It now goes back to the gap's near node and on through the gap.
- **A PINNED CASTER KEEPS TO ITS PILLAR** (`egWalkNext`'s `b.pinned`; sections 8.3 and 12).
  - A pinned walker's goal is kept inside the region it stands in, and no way off is walked, whatever the region's edge
    overlaps or overlies. The pin is the director's own (`net/egBrain.js` `standFight`, every Rampart Caster stood on a
    pillar). The lip stays the graph's: an unpinned walker on such a pillar still steps off it.
  - Measured with the director over every Rampart of seeds 1-6, the company marching the walkway end to end for 50 s.
    Before, with a company of two, all 22 pinned Casters on a pillar whose plan meets a bastion's walked off it (237 pinned
    in all; none of the rest left). With a company of eight, all 51 of 474 did. After, none of either. EG-ZJ's count (19
    of 69 over 23 Ramparts) was taken with another company and walk.
- **THE LORDS' SHARES** (`net/egLords.js` `egLordsShare`, through `EG_SEAM.join`; section 13.2).
  - A lord's health is its fighters' shares. Each lord's share for a member is `per` x the member's reference damage
    (`dpsRef`, the gate's level claim). `per` is the lord's health per unit of the company's reference damage as it was
    stood: `ttkRef(c)`, a champion's `EG_PROVE_HP_S` x the depth, Colossal's health, a twin's part, a stratum's 0.6.
  - The fight keeps the company it woke with by account (`F.subs`, `net/egBodies.js` `egFightNew`). Each lord seeds its
    shares from it when it first moves one, so its shares sum to its health.
  - The seam's `join` moves a member's share. Admitted, a member the hall did not wake with brings its share at the
    fraction the lord stands at: a share brought as a retired one and restored, the gate's `joinFight` law through its own
    `restoreShare`. A retired share comes back the same way. Refused, a member's share is retired (`retireShare`), at the
    fraction. The last share in a lord is never retired.
  - The director joins members three times (`net/egBrain.js`): at a blow on a lord (EG-ZK's join); in the seen-and-restore
    step, every living member in the hall each beat of a trial while a lord stands (the fallen are never in it); and at a
    fall (`egFall`), unadmitted.
  - A member who can join a hall's lords mid-fight is one a Memento calls back into it after it fell before the wake. The
    breach admits nobody after its open window (section 6.1).
  - A mirror or an image carries no share. An errand's held threshold (the Spellmaster's Examination) keeps its fraction of
    its lord's health. A share moved says the whole fight at the beat's end, so every bar's health and its max move
    together.
  - Pinned on a Proving Walk of the first circle, with members of levels 40, 20 and 30 (reference damage 45, 25 and 35).
    The champion stood for the first two is 2800 (shares 1800 and 1000). Bled to 60%, the third is called back by a
    Memento and brings its 1400 at 60%: 4200, and the whole fight is said again at once. The second falls: 3200, still 60%.
    Seen as a witness for two seconds, nothing comes back. Recalled, it is 4200 again.
- **THE COLOSSAL'S SIZE ON THE WIRE** (section 14).
  - A lord is stood at the fight's law's `sizeX` (`net/egLords.js` `stand`), and so are its mirrors and images. Its body's
    radius is `bodyR` of its look's scale times the size, and its size rides its body (`sz`, thousandths of its look's; 0 at
    its look's own).
  - On the wire a body's row is eighteen, `[..., st, sa, sz]` (`net/egBodies.js` `egBodyWire`). `validEgOut` takes 0, or
    `EG_SIZE_WIRE_MIN` to `EG_SIZE_WIRE_MAX` (500 to 2000). Colossal's rank II, 1400, is the most the law folds, pinned under
    the bound.
  - The screen keeps a lord's size (`net/egLink.js` `egBodyOf`, 1 at its look's own) and draws it at its look's scale times
    it (`scenes/egFight.js` `egLookOf`, the one read in that file). Its reach to the lord (the target's radius from the
    look's scale) is the radius the relay judges by.
  - The first Court's Grath stands at 3.0 with no decree, 3.75 under Colossal (1250, radius 2.25) and 4.2 under Colossal II
    (1400, radius 2.52). The Slam's radius already followed `radiusX`.
- **THE GRAND DUKE'S DECREE FOLDS** (`net/egLords.js` `egMarkynazDecree`; sections 8.5 and 14).
  - The Markynaz lays the lord-family decree his hall draws: the four in their order (`EG_DECREES`, never a second list)
    from his hall's number, or the next his fight does not already bear, round the four, or none when it bears all four.
    One decree is never borne twice, and his card names one the company does not already face.
  - It folds with the circle's lord decrees through the fight's profile (`egFightProfile`), and he is stood under the fold,
    its health and its size with it. Before, his decree replaced the circle's, and his health was the circle's law's alone
    (he was born before his decree).
  - Seed 1's Hall 68, the Shade's Proving Walk, under Vengeful II: he lays Colossal, his hall's own, and his fight runs by
    both (shares x1.4, health x1.25, size x1.25). Under Colossal he lays Unyielding.
- **A SPOT'S HEIGHT, SAID** (section 9; `net/egLaw.js`'s `spot`). Decided: documented at the producer and in section 9, not
  mended under a new spec law. A spot's `y` stays the law's centimetres while its `x` and `z` are said in metres. The reasons:
  - Nothing reads the field. Every body's feet are the fight ground's (EG-ZJ), so no hall a player stands in changes.
  - A law of its own would be a third kept seven days beside laws 4 and 5 (section 22), every pin of the law's number would
    move, and parallel slices would contend for the next number. It would buy nothing.
  - It would not spare the first reader the centimetres either. Breaches opened under laws 4 and 5 are kept for their
    seven days, and their spots stay centimetres, so that reader handles both units whatever this slice did.
  - So the slice that first reads a spot's height mends it under its own law, in the same change. Until then a reader
    divides by 100, as `spot`'s comment and section 9 now say.

**Departures, said plainly.**
1. The shares move the lords' health alone. The legion's waves, the errands' objects and a Valkynaz's mirrors stay sized by
   the company the hall woke with (`F.team`, `F.n`).
2. In a Clan Feud the Markynaz stands after the Court's lord. His decree folds into the one fight's law from his birth, so
   every lord's blows, ward and threat bear it, while the Court's lord keeps the health and size it was stood with.
3. A share brought or restored moves the beat after its member is first seen in the hall: within 250 ms of its rising at
   the niche, not at the recall's own word. A fall's moves at once.
4. The last share in a lord is never retired. The gate keeps the fraction in `idle` for that case, but the Spire's lord
   would stand at nought and read as fallen; the company's wipe ends the breach first.
5. A spot's `y` stays in centimetres, said so at the producer and in section 9 (decided above).
6. The way-on rule is asked by the walkers, not inside `egWalkNext`, which a hand-walked test body calls with no walk.

**The four hosts.**
- `src/scenes/world.js` - FLAGGED, nothing to wire: the fight draws its bodies in the pass the host already calls.
  Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED: untouched.
- `src/scenes/dungeonContext.js` - FLAGGED: untouched.
- `src/scenes/exterior.js` - FLAGGED: offline, no breach (section 28).
`scenes/egFight.js` is no host; its one line is the size's read.

**Not verified without a browser and the game's data:** a Colossal lord drawn larger, and a lord's bar as a share moves,
were checked through the wire, the screen's fold and `egLookOf` in node, not seen in the live game.

**Pins.**
- `test/egz_relay.test.js` (6): the way on, the pillar, the shares, the size on the wire, the Grand Duke's decree, a spot's
  height.
- `tools/mutants/egz_relay.json` (45, every one dead).
- Re-aimed by content (mutantdrift), and judged again:
  - `egz_lords.json`: EGZK-a-witness-joined and EGZK-joined-to-the-fallen onto the seam's join's answer;
    EGZK-the-graphs-walk-kept and EGZK-a-reached-node-forgotten onto `egWayOn`.
  - `egz_state.json`: EGZJ-row-height-unrounded, EGZJ-row-walk-end-height-dropped and EGZJ-row-state-unsaid onto the row
    of eighteen; EGZJ-wire-row-of-thirteen onto the validator's eighteen; EGZJ-link-lord-phase-dropped onto the lord's
    branch, which now reads its size; EGZJ-lord-top-reached-feet-left-on-the-stair onto `egWayOn`.
- Judged again: `eg5.json` (40), `egz_lords.json` (35: 33 dead, its 2 equivalent as recorded), `egz_state.json` (96),
  `egz_legion.json` (56) and `egz_rules.json` (78) - every one as recorded. And every record of the lists aimed at the fight's
  modules this slice touched (`net/egBodies.js`, `egLords.js`, `egLegion.js`, `egWalkGraph.js`, `egLink.js`,
  `scenes/egFight.js`) or within ten lines of its changes in `net/egBrain.js`, `net/egLaw.js` and `net/wire.js`:
  `egint.json` (14), `egz_recap.json` (5), `egz_frag.json` (3), `egfull.json` (2), `eg6a.json` (1) and `egplay.json` (1) - 26,
  every one dead.
- PIN MOVED:
  - `test/egz_lords.test.js`: the director's joins, three;
  - `test/egz_state.test.js`: a body's row of eighteen, in eight assertions, two titles and a comment;
  - `test/egplay_relay.test.js`: a body's eighteen, cut short at seventeen;
  - `test/egz_stair.test.js`: its two hand-built rows.
- `RELAY_VERSION` `world198`, unshipped, rehashed in place; no file joined its graph. `ACCOUNT_VERSION` is untouched
  (`acct122`), and there is no migration. `EG_SPEC` is 5 and `EG_LAWS` are as they were.
- The 25-seed sweep (`tools/egSpanSolve.mjs --sweep --golden`, bands 0-3): every course crossed (95, 111, 108 and 109).
- No new src module. The Port-Ledger's ELITE-GATES row is the lead's.

### EG-ZR - 2026-10-12 - THE VESTIGES ON THEIR HOLDER

Mac: "I said I want everything". EG-ZP found two debts of section 15 and left them, said in its departures 1 and 9: Shield-Hymn
was applied by neither the census nor any screen, and of the Vestiges section 15 gives the holder's own client, Iron Footing
alone was applied on a screen, Immovable's push half not at all. Checked against section 15 and `net/egVestige.js` (every
`by: 'client'` row, and the `word` rows a receiver applies), the list is EG-ZP's twelve and one more: Featherstep, whose
crumbles waited Daggerfall's delay on every screen and whose cast-back the screen charged a tenth while the census charged
8, 6 or 4%. This slice applies all thirteen on their holder, Shield-Hymn on both halves and Immovable's push half. Both of
EG-ZP's sentences are deleted above.

**What shipped, by piece.**

- **THE HOLDER** (`systems/spireVestiges.js` `spireHolderStep`, new; `scenes/egClient.js` `holderNow`).
  - Every frame, the breach client hands its holder to the Vestiges' doors: my run's Vestiges and Mastery as the room says
    them (`egRunOfMember`), the breach and its hall. It does so only while I stand alive in the breach the room counts me
    in (in, alive, not gone home, the breach not ended, not a witness); otherwise the holder is null.
  - With no holder every door answers as if nothing were held. The client's `away` (online gone) and the first frame out
    of the Spire let go. So does a fall (a witness holds nothing) and the way home.
  - Each door is the one the port already has for its kind, registered once at the module's import (as
    `systems/lootPowers.js` and `systems/sigilSetPowers.js` register theirs). Every number is `net/egVestige.js`'s.
- **STONESKIN** (+10 / 18 / 25% maximum health; `systems/renownLayer.js` `setSpireHp`, `spireHpOf`, `spireBodyMax`;
  `systems/chargen.js` `defineLiveMaxHealth`).
  - A third online term on the live maximum, beside Renown's: its rank's share of the body without it, in whole points
    (rounded). It goes on and comes off as Renown's layer does, the fraction kept: 500 of 1000 is 625 of 1250 at rank III,
    and 500 of 1000 again once let go. Only a live maximum carries it (every player's: chargen's and the load arm's).
  - THE CUSHION: every share the room takes of a body is a share of the body without Stoneskin, which is the census's whole.
    That covers a blow, a zone, a hazard and a drain (`scenes/egFight.js` `landShare`), and the void, the toll and the lash
    (`scenes/egClient.js`). A 0.4 blow takes 400 of a Stoneskin III holder's 1250, and the census counts 400 thousandths.
- **SECOND WIND** (once a hall, falling under 30% heals 15 / 25 / 35%; a hurt listener on the one damage door,
  `characters/playerEntity.js` `registerPlayerHurtListener`, the Ghost-King's Vigil's way).
  - A hurt that takes me from 30% of my maximum or over to under it heals its rank's share of the maximum
    (`systems/playerHeal.js` `healMine`), once in each hall of each breach.
  - Never on a hurt that leaves me at 30%, nor on one already under. Never on a killing blow a death save turned aside
    (the hurt's `saved`).
- **SPELLBANE** (every resistance +10 / 18 / 25; the resist channel's fold, `systems/entityMods.js`
  `registerEntityFold`). Every element the saving throw names (`systems/lootRarity.js` `RESIST_ELEMENTS`) gets its rank,
  as the Battlemage's Bearing rides the same channel. The entity is folded again the frame the value moves, so the throw
  reads it at once and stops at once. A fire save of 55 is 80 at rank III.
- **BATTLEMAGE'S FOCUS** (spell cost -10 / 18 / 25%; `systems/spellcost.js` `registerSpellCostMod`). My cast's spell
  points less its share. The cost door rounds and never goes under 1, and another caster's price is untouched.
- **SHIELDWEAVER** (my Shield spell soaks +20 / 35 / 50%; `characters/playerEntity.js` `registerShieldSoakMod`,
  `damageShieldPool`).
  - A new named registry on the Shield pool: a point of a live Shield entry's pool soaks `k` of a blow. The pool spends
    dmg / k, and the excess that gets through is whole points. With no modifier, or every one answering 1, the pool is
    X1's exactly.
  - Shieldweaver answers 1 + its share for a Shield I cast on myself (`bundleSelfCast`). A party mate's gift (ALLY-CAST
    lands with no caster) soaks as Daggerfall's. At rank III a 120 blow on a 100 pool is soaked whole, 20 left, and the
    next 60 passes 30.
- **FLEETFOOT** (run speed +4 / 7 / 10%; `player/motor.js` `registerRunSpeedMod`, `runSpeedMult`). A new named registry of
  run modifiers beside the walk's swim scale, read every step. With none, the run is Daggerfall's exactly. Fleetfoot
  multiplies the run on foot; the walk and a horse's gallop are as they were. THE FAST BUILD's run (`net/egSpanLaw.js`
  `EG_FAST_RUN_MPS`) is now pinned to Fleetfoot III's own number.
- **FEATHERSTEP** (crumbles wait +0.2 / 0.35 / 0.5 s; cast-backs cost 8 / 6 / 4%).
  - A Crumble (or a Bone bridge) my foot sets waits Daggerfall's delay and the holder's seconds (`scenes/egSpan.js`, the
    step's `wait`, set from `spireCrumbleWait` as the foot lands). Its three crack stages spread across the wait, its
    chunks fall after it, and the fall, the return and the click home keep their own lengths after it.
  - The void's cost on my screen is the census's own law (`net/egBrain.js` `egCastBackCost`, imported), so a cast-back
    costs 8, 6 or 4% on the screen as in the count. It is said as it is (`ui/egBeats.js` `EG_PRES_TEXT.castBackCost`,
    `EG_BEATS.castBack` taking the cost): *-8%* at rank I, *-4%* at III, *-10%* unheld.
- **THE BLOW** (`systems/spireVestiges.js` `egHolderBlow`; `scenes/egFight.js` `hostHit`, `EG_ECHO_Q`). Every blow of mine
  on a Spire body leaves through `hostHit`: a swing, an arrow, a spell, as the dungeon host's `landOnHost` sends it. The
  Vestiges I hold are laid on the claim there, where the relay's bucket, grown by their declared factor
  (`egDeclaredX`), takes it.
  - SEARING EDGE: a melee blow +3 / 6 / 9.
  - MOMENTUM: +4% a stack on one body, to 3 / 4 / 5 stacks. A blow builds one stack, on the first body it meets, and a blow
    on another body starts again. A blow the wire refused builds none. A new hall starts again.
  - BLOODIED FURY: under half my health +10 / 18 / 25%.
  - OVERCHARGE: a spell +8 / 14 / 20%.
  - The fire is added first and the factors multiply it: (d + fire) x Momentum x Bloodied Fury x Overcharge.
  - ARCANE ECHO: a damage spell repeats at half on each body it met, 10 / 16 / 22% of casts. There is one roll a cast (the
    blow's sequence), and the repeat is a blow of its own on the relay, numbered `EG_ECHO_Q` past the cast's. A melee
    blow or an arrow never rolls.
- **MENDER'S GRACE, THE RECEIVER'S HALF** (heals you cast on allies +15 / 25 / 35%; `scenes/egClient.js` `menderGrace`,
  `egMenderOf`; `scenes/world.js` `onCast`).
  - Another's heal on me (ALLY-CAST) heals its caster's rank's share of the health it moved more. The caster's run is read
    by account (`accountOf`), as the room says it.
  - Never my own heal, a stranger's or an unnamed peer's, as a witness, or out of the Spire. The host hands every ally
    cast's heal to it before the heal is told, so the line, the chart's Healed column and the heal word carry the whole.
- **SHIELD-HYMN** (Bastion with Rally: "Rally's heal also gives the company 4 s of Bastion's protection"; `net/egVestige.js`
  `egHymnOf`; `net/egBrain.js` `egHymnStep`, `egCensusDr`; `scenes/egFight.js` `rally`, `egShieldBreach`'s and
  `egShieldDr`'s `hy`; `scenes/egClient.js` the word).
  - ONE LAW FOR THE PAIR (`egHymnOf`): the Bastion holders among the living company within `EG_ACCORD_M` (10 m) of another
    member who holds Rally. An Accord is two members', so one member holding both is no pair.
  - THE CENSUS'S HALF: as the door says Rally's heal (`door`), `egHymnStep` reads the pair off each living member's pose in
    this hall. Each pose now carries its hall, so a pose of the last hall pairs nobody. It mints `B.hy`:
    `[the door, the door + EG_HYMN_MS, the Bastion holders]`.
  - `egCensusDr` reads the window. Inside it, from the door to 4 s past it with both ends in, the hymn's Bastion holders
    stand by every other living member wherever it stands. They are one aura with any Bastion holder near, each holder
    counted once and stacked as Bastion is (the strongest, +2% each other), inside the census's 30%.
  - THE SCREEN'S HALF: Rally's word (`eheal`, `why: 'rally'`) opens the same window on my fight at the door's opening (the
    word's arrival less the half round trip), over the company where my screen draws it (`rally`). `egShieldDr` hands it
    to the census's own law. A 0.4 blow far from the hymn's Bastion III holder takes 352 on the screen and 352 off the
    count.
- **IMMOVABLE'S PUSH HALF** ("pushes do nothing until you move"; `scenes/egFight.js` `immovable`; `scenes/egClient.js`
  `footing`; `systems/spireKit.js` `spireFooting`).
  - The fight asks the census's own law of my trail with my Mastery alone (`egCensusDr`, whose Immovable is then its only
    answer): am I still a second on a fight floor?
  - While it holds, the share off a push is the whole of it, so a blow's push moves me not at all and the spans' Gust and
    Pendulum read the whole off. Moved, short of the second, off a fight floor, or without the Mastery, Iron Footing's
    share stands as before.
- **THE LAW'S NUMBERS** (`net/egVestige.js`, declared once): `EG_MOMENTUM_STEP` (0.04), `EG_SECOND_WIND_UNDER` (0.3),
  `EG_BLOODIED_UNDER` (0.5), `EG_ECHO_SHARE` (0.5), `EG_HYMN_MS` (4000), `EG_ACCORD_M` (10). Momentum's and Second Wind's
  lines read them.

**The four hosts.**

- `src/scenes/world.js` - WIRED: one statement in `onCast`, on the cast's own line (ALLY-CAST's source pin holds the
  cast and the healed points' line together): an ally cast's heal handed to Mender's Grace before it is told.
  Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED, nothing to wire: every door the Vestiges ride is one every host already shares:
  - the motor's run (`player/motor.js`);
  - the one damage door's hurt and Shield pool (`characters/playerEntity.js`);
  - the cast's price, the resist fold and the live maximum;
  - a blow on a Spire body, which reaches `hostHit` through the mode machine's gate-to-hall seams unchanged.
- `src/scenes/dungeonContext.js` - FLAGGED, unchanged: its `landOnHost` sends the game's own blow as before, and the spans
  it stands (`scenes/egSpan.js`) read Featherstep.
- `src/scenes/exterior.js` - FLAGGED: offline, no breach (section 28).

**Departures, said plainly.**

1. **Stoneskin is a cushion.** The room's shares are of the body without it; the room's heals (a rest, Rally, a Mending)
   and a recall's share are of the whole maximum, the cushion with it. With shares of the whole, Stoneskin would buy
   nothing against a blow of the Spire's, every one of which is a share.
2. **The blow's Vestiges are laid at `hostHit`**, not on the formulas' blow and spell-power modifiers:
   - a fist is no weapon blow (`handToHandAttackDamage` reads no blow modifier);
   - a spell's power modifier runs a damage effect at a time and knows no blow, so it can count no stack and roll no
     echo;
   - every foe in the Spire is the relay's, and every blow on one leaves by `hostHit`.

   The number a blow pops on the screen (HN1) is the game's own blow, the Vestiges not in it; the relay counts the claim
   with them.
3. **Searing Edge's fire is whole on every body.** The relay keeps no element, and its stand-ins take fire whole. The page
   gives the Vestiges no order, so the fire is added first and the three factors multiply it.
4. **Momentum's stacks never lapse** inside a hall: the page names no window. An Echo's repeat builds none: it is the
   cast's own, not a blow I struck.
5. **An Echo is sent at once, as a blow of its own**, so it spends a hand of the relay's rate (`spendBlow`).
6. **Second Wind** reads and heals the screen's body (its live maximum, Stoneskin's points in it). The census hears the
   heal only as the member's own word of its body.
7. **Spellbane** rides the resist channel's five names. A throw that reads two of them reads it twice, as a worn affix's
   line would.
8. **Shieldweaver** makes a point soak more rather than the pool larger: the same soak. A Shield carried out of the breach
   soaks as Daggerfall's at once.
9. **Featherstep's wait** is read as the foot lands; a rank taken mid-shake changes the next crumble. The Sinking Stair is
   no crumble.
10. **Mender's Grace** is on the health that moved, so a heal stopped at the maximum gives nothing more. The room's heal
    bucket may refuse the excess the heal word carries; the screen believes it (EG-ZP's departure 4).
11. **Shield-Hymn's places are each side's own** (EG-ZP's departure 5): the census's pair is read on its poses at the door,
    the screen's where it draws the company as the word lands. A Bastion holder's own blows are never spared by its own
    Bastion, which shields allies. A door with no pair leaves the last window to lapse.
12. **Immovable's push half** is judged on the screen's trail, a sample a frame (EG-ZP's departure 5). The spans read it a
    frame late at most.

**Not verified without a browser and the game's data:** nothing was played. Each Vestige was driven through its own door
headless: `hurtPlayer`, `savingChance`, `calculateCastCost`, a `PlayerMotor` on a real collider, `createEgSpan` with a
counting renderer, `createEgFight` and `createEgClient` against a stub host. Every blow was counted by the director's own
census on the same inputs. Shield-Hymn's door was opened by the director's own beat (a fair crossing of a span).

**Pins.**

- `test/egz_vestiges.test.js` (12) and `test/egz_vestiges_hymn.test.js` (4).
- `tools/mutants/egz_vestiges.json` (100, every one dead; four survived the first run, and each now dies on a pin added for
  it: a refused blow's stack, the chunks' fall a wait later, a saved killing blow at 40%, and a Shield whose excess is
  fractional).
- Re-aimed by content (mutantdrift):
  - `renown1.json`'s RENOWN1-layer-in-the-stored-health and `auditrenown1.json`'s
    AUDIT-RENOWN1-limiter-caps-the-layer, on the live maximum's line;
  - `egz_debts.json`'s EGZP-share-unspared and -points-unspared, `egfull.json`'s EGFULL-the-lash-kills, `egz_rules.json`'s
    EGZI-client-toll-the-step and -the-last-taken, on the shares of the body without the cushion;
  - `egpres_hud.json`'s EGPRES-the-cost-shown-without-a-cost and -the-rewind-silent-without-a-cost, on the cast-back's
    cost;
  - `egz_ends.json`'s EGZM-wait-outlives-the-frame, on `away`;
  - `egz_tells.json`'s EGZL-crumble-stage-frozen, on the wait.
- Judged again: the 51 records of other lists aimed at or within two lines of a line this slice changed, every one dead
  (`allycast.json`, `audit27d.json`, `auditrenown1.json`, `disc10.json`, `egfrag.json`, `egfull.json`, `eglook.json`,
  `egplay.json`, `egpres_hud.json`, `egz_debts.json`, `egz_ends.json`, `egz_legion.json`, `egz_rules.json`, `egz_sound.json`,
  `egz_telegraph.json`, `egz_tells.json`, `giftquiet.json`, `renown1.json`, `steed1.json`). `steed1.json`'s
  STEED1-the-gallop-unscaled no longer parsed: it took out the line the run's modifiers now hang an `else` on. It is
  re-aimed by content to unapply the gallop's scale in place, and dies.
- No test pin moved. `RELAY_VERSION` `world198` is rehashed in place (unshipped): `net/egBrain.js` and `net/egVestige.js` moved,
  and nothing joined the bundle. `ACCOUNT_VERSION` stays `acct122`; no migration.
- `src/systems/spireVestiges.js` is a new module, so `06-Systems/Systems.md` counts 519. Its header cites Ledger A
  (ELITE-GATES), as the arc's files do. The Port-Ledger's ELITE-GATES row names the arc's files, and this one is to join
  them there; the row is left to the merge, as this arc's slices leave it.

### EG-ZS - 2026-10-12 - THE MASTERIES AND THE ACCORDS

Mac: "I said I want everything". EG-ZR left three lists of section 15 unbuilt, in its departure 14: the capstones' client halves
(Rooted's immunity to push, Spellweave's free fourth damage spell, Rallying Cry's Second Wind refreshed at a door), the relay's
Bladestorm and Deadeye, and five Accords (Hammer and Anvil, Ambush, Kindled Steel, Living Wall, War-Chorus). It left one open
issue for EG14 in its departure 2: the census counted a Stoneskin holder fallen at the plain body's worth. EG-ZQ left one
debt of section 8.5: the Markynaz's decree named on no card. This slice builds all of them, and the one line of section 15
nobody had built or flagged, the offer card naming its Accord. EG-ZR's departures 2 and 14 are deleted and the rest
renumbered 1 to 12; EG-ZQ's "Found, not changed" is deleted. Section 15's Stoneskin row and section 21's census say what the
census now counts.

**What shipped, by piece.**

- **THE LAW'S NUMBERS AND THE PAIR LAW** (`net/egVestige.js`, declared once beside EG-ZR's `egHymnOf`).
  - `EG_STORM_N` (5) and `EG_STORM_M` (3 m), Bladestorm's; `EG_WEAVE_N` (4), Spellweave's; `EG_FAR_M` (12 m), "beyond 12 m",
    which Long Sight now reads in place of its literal (`net/egRun.js` `egVestigeX`) and Deadeye reads with it;
    `EG_HAMMER_X` (0.08), `EG_AMBUSH_X` (0.15), `EG_WALL_X` (0.1), `EG_KINDLED_M` (2 m).
  - `EG_ECHO_Q` moved here from `scenes/egFight.js` (which says it as before): the relay knows an Echo by it now.
  - THE PAIR LAW, `egAccordMates(ms, me, key, as)`: the members within `EG_ACCORD_M` of `me`, never `me` itself, holding the
    other half of Accord `key` while `me` holds the side `as` names. The relay and the screen read every new Accord by it,
    each on the places it holds.
  - `egCardAccords(card, vs, co)`: the Accords a card would take - a Vestige not yet held, with each companion holding the
    other half.
- **ROOTED, THE CLIENT'S HALF** (Stone's capstone: "immune to push"; `scenes/egClient.js` `footing`). Resonating in Stone,
  the share off a push is the whole, as Immovable's is. A blow's push moves me not at all, and the spans' Gust and Pendulum
  read the whole off through `systems/spireKit.js` `spireFooting`. The doubled threat was already the relay's
  (`net/egRun.js` `egThreatX`).
- **SPELLWEAVE, THE CLIENT'S HALF** (Arcana's: "every fourth damage spell costs nothing"; `systems/spireVestiges.js`
  `weaveFree`, `weaveCast`; `systems/spellcost.js` `registerSpellFreeCast`).
  - A new named door on the cast's one price: asked after the cost modifiers, under their law (a player's own cast, never a
    foe's), one that answers true prices the cast at nothing. It is the one cost under the modifiers' floor of 1.
  - While I resonate in Arcana, each damage spell of mine (a Damage Health effect or its continuous twin -
    `systems/spellcast.js` `isDamageHealthEffect`) that leaves the hands is counted, as the one cast engine tells it
    (`systems/playerCasts.js` `tellPlayerCast`). The count runs over the breach and starts again in another.
  - The fourth, the eighth, the twelfth are priced at nothing. The ready captures that price (`scenes/hostMagic.js`
    `readySpell`), so the spend is nothing and the book shows 0. A spell that is no damage spell is neither counted nor free.
- **RALLYING CRY, THE CLIENT'S HALF** (Fellowship's: "Rally's heal and every Second Wind in the company refresh when a
  hall's door opens"; `scenes/egClient.js` `holderNow`; `systems/spireVestiges.js` `spireHolderStep`).
  - The holder now comes with the hall's door's instant (the room's `dn`, said by its stage word) and `cry`: whether a living
    member of the company resonates in Fellowship.
  - With both, a Second Wind spent in this hall is mine again from the door, once a door. It applies to every Second Wind
    holder in the company, the Cry's holder's own among them.
  - Rally's heal already comes at every door (`net/egBrain.js` `door`), so the capstone's Rally half needs nothing more.
- **BLADESTORM AND DEADEYE, THE RELAY'S HALVES** (`net/egBrain.js` `hostHits`, `hostStrike`, `egBehind`; called by `egBlow`
  after every landed blow).
  - BLADESTORM ("every fifth melee blow strikes every foe within 3 m (relay host hits)"): every `EG_STORM_N`-th landed melee
    blow of a member resonating in Blade (`mm.storm`, counted over the breach) strikes every other foe within `EG_STORM_M`
    of where the member struck from. Each takes the points the blow landed on its target.
  - DEADEYE ("an arrow from beyond 12 m pierces the add behind its target"): a landed arrow of a member resonating in Hunt,
    from beyond `EG_FAR_M` of its target, strikes the first add the line from the striker through the target meets past it,
    one whose centre lies within its own radius of the line (`egBehind`). It takes the points the arrow landed.
  - A HOST HIT is the room's own stroke. An add takes it as Sweeping Arc's splash does, its fall the striker's.
  - A lord takes it through THE BOSS SEAM's one `hit` (`net/egLords.js` `EG_SEAM`), as every blow on a lord goes
    (section 13.1). It rides the blow's own token (its number) and comes out of the member's purse. The lord's own weight
    applies (a ward, a flyer out of a blade's reach, Unyielding's x0.85), and what lands is told to it: its threat by
    `egThreatX`, its kit, its fall.
  - A friend, a ward, a hidden body and an errand's object take none.
- **THE ACCORDS ON THE RELAY** (every one the relay's, inside the caps).
  - HAMMER AND ANVIL (Challenger's Oath + Hunter's Mark; `net/egRun.js` `egVestigeX`). A mark now keeps who laid it
    (`egMarkFoe`'s `by`, named by `egBlow`). A foe marked by a mate holding Hunter's Mark, the pair standing together, takes
    `EG_HAMMER_X` more from the oath's holder, on top of the mark's own share. The mark's holder's own blows take the mark
    alone.
  - AMBUSH (Fade + Spire's Standard; `egFadeOn`, `egVestigeX`, `egBlow`). A Fade begun arms it (`m.amb`), and the holder's
    next landed blow spends it. That blow, within `EG_ACCORD_M` of a mate holding the Standard, takes `EG_AMBUSH_X` more over
    the Standard's own aura.
  - KINDLED STEEL (Searing Edge + Overcharge; `hostHits`). A landed melee blow of a Searing Edge holder standing with a mate
    holding Overcharge splashes the Edge's fire - its points, 3 / 6 / 9 - on every other foe within `EG_KINDLED_M` of the
    target, as host hits.
  - WAR-CHORUS (Arcane Echo + Spire's Standard; `net/egRun.js` `egEchoShare`, `egCompanyAt`).
    - The screen now claims an Echo at its cast's whole (`scenes/egFight.js` `hostHit`).
    - The room takes the Echo's share: `EG_ECHO_SHARE`, or the whole while its holder stands within `EG_ACCORD_M` of a mate
      holding the Standard. It is never a factor above 1, so it stays inside the caps, and a client that claims an Echo
      whole gains nothing the room does not see.
    - The room knows an Echo by its number: from `EG_ECHO_Q` to twice it, where no cast is numbered, as the wire's `q` holds.
    - The share is the claim's, the Binder's raise included (`egBlow`'s `dm`).
- **LIVING WALL, BOTH HALVES** (Stoneskin + Mender's Grace: "heals on the Stoneskin holder +10%").
  - THE CENSUS'S HALF (`net/egBrain.js` `egWallOf`, `egCountHeals`): a room's heal (Rally, a Mending, a niche, the
    Scriptorium, a rest's part) on a Stoneskin holder standing within `EG_ACCORD_M` of a mate holding Mender's Grace is
    counted at `EG_WALL_X` more, read on the places the director holds of this hall.
  - THE SCREEN'S HALF (`scenes/egClient.js` `applyHeal`, `menderGrace`, `wall`; `scenes/egFight.js` `accordMates`): the same
    heal on the holder's screen, read on the places it draws the company. A companion's heal spell on the holder heals the
    Accord's share of the whole more, Mender's Grace in it ((1 + grace) x 1.1). The heal word carries it to the census as it
    carries Mender's Grace. Shield-Hymn's `rally` and the new `accordMates` read the company through one helper
    (`companyHere`).
- **STONESKIN IN THE CENSUS'S COUNT** (EG-ZR's open issue for EG14; `net/egBrain.js` `egCountWhole`).
  - A holder's count is a share of its WHOLE body, the cushion in it: 1 and its rank's share, 1.25 at III. That is what its
    screen's maximum, its own word (`vt`), the room's heals and a recall already were.
  - Every share the room takes is of the body without the cushion, and now comes off the count over the whole. That covers
    a blow, a hazard, a drain, the void (its floor a quarter of the plain body, as the screen's), the toll and the lash. An
    ally's believed heal is counted over the whole too (`egHeal`).
  - So under enforcement - on in `eg:` rooms (`EG_BODY_ENFORCE`) - a Stoneskin III holder stands three 0.4 blows and falls at
    the fourth, as its 1250 do. A plain body and Stoneskin I fall at the third. Its own word of its body, as its screen says
    it, claims no mend.
  - Enforcement is unchanged. The census's thousandths (`cs`) stay the plain body's.
- **THE MARKYNAZ'S DECREE ON HIS CARD** (section 8.5; `ui/egSpireHud.js` `egMarkynazLine`, `egArrivalLive`;
  `ui/egBeats.js` `EG_PRES_TEXT.champDecree`).
  - In a hall the law stands him in (a Proving Walk, a Deepway's champion's chamber - the spec's `champ`), the arrival card
    names the decree he lays: *The Grand Duke's Decree: Colossal*.
  - The screen reckons it with the relay's own pure `egMarkynazDecree`, from the decrees the room says in force (`st`'s `dc`,
    the ranks the fight takes at its wake) and the hall. No new word.
  - The card draws it on a line of its own, hidden when empty. The screen reader's line says it with the card's words
    (`scenes/egClient.js`).
- **THE OFFER'S CARD NAMES ITS ACCORD** (section 15: "*Takes an Accord with Mira's Hunter's Mark.*"; `ui/egHud.js`
  `egPanelModel`, `drawEgPanel`; `EG_PRES_TEXT.takesAccord`). A card whose Vestige I do not hold, with a living companion
  holding the other half, says so under its line in the Vestiges' blue: each companion, each Accord.

**The four hosts.**

- `src/scenes/world.js` - FLAGGED, nothing to wire. Every door the new halves ride is one the hosts already share:
  - the breach client's footing, holder and heals (`scenes/egClient.js`);
  - the cast's one price (`systems/spellcost.js` - every host's `castCost` reads `calculateCastCost`);
  - the one cast engine's word (`scenes/hostMagic.js` `tellPlayerCast`).

  Nothing was added to `function frame(now)`.
- `src/scenes/worldModes.js` - FLAGGED, untouched: its interiors take world.js's cast engine and price.
- `src/scenes/dungeonContext.js` - FLAGGED, untouched: its `landOnHost` sends the game's own blow, and the relay strikes the
  host hits.
- `src/scenes/exterior.js` - FLAGGED: offline, no breach (section 28).

**Departures, said plainly.**

1. **Bladestorm's 3 m is measured from where its holder struck.** Section 15 says "within 3 m", where Sweeping Arc says "of
   the target". Its count is of landed melee blows over the breach, and it never lapses. Each foe takes what the blow landed
   on its target, the target's own weight in it.
2. **Deadeye reads an arrow alone**, as section 15 says (section 21 groups it with spells). Past the target, the line has no
   end.
3. **Kindled Steel's fire is the Edge's points whole**, never scaled by the blow's factors. The relay keeps no element.
4. **A host hit on an add spends no hand and no purse**, as Sweeping Arc's splash does. One on a lord goes through the
   seam, the one plug every blow on a lord takes (EG-ZK), so it rides the blow's token and draws on the member's purse. No
   member's tally counts either.
5. **An Echo's share is the relay's now.** The screen claims the cast's whole. The bucket grows by Arcane Echo's own declared
   factor, not by War-Chorus's doubled expectation.
6. **Hammer and Anvil reads any mark its mate laid**, its Hunter's Mark or its Spotter's: "a foe the mark's holder marked".
7. **Ambush has no window**: the first blow after a Fade is the next one that lands, whenever it lands.
8. **Living Wall's heals are the ones another gives the holder**: the room's and a companion's spell. The holder's own potion,
   spell or Second Wind is not one. It multiplies Mender's Grace. Each side reads its own places, as Shield-Hymn does
   (EG-ZR's departure 11).
9. **Spellweave counts every damage spell that leaves my hands while I resonate**, an item's free cast among them. A spell
   readied at nothing stays priced so until it leaves the hands.
10. **The Markynaz's card is reckoned at its minting.** A Dagon's Bargain passed in his own hall, after he laid his decree,
    is in the `dc` a reload mid-trial reckons from. The Markynaz that Kyn's Vigil or a Clan Feud brings is named on no card:
    the page names the Proving Walk's.
11. **An ally's heal is counted over the gate's reference body** (INT11's law), not the holder's own, and now over the
    whole.

**Not verified without a browser and the game's data:** nothing was played.
- Every relay half was driven through `egBlow` and `egCount` in the director's own Court, the company stood by its beat.
- Every screen half went through `createEgClient` and `createEgFight` against a stub host: footing, the holder, `applyHeal`,
  `menderGrace` and the arrival card's DOM.
- Spellweave went through `calculateCastCost` and `tellPlayerCast`, not a live cast.

**Pins.**

- `test/egz_mastery.test.js` (9) and `test/egz_mastery_accords.test.js` (6).
- `tools/mutants/egz_mastery.json` (105: 104 dead, and 1 equivalent as recorded - an errand's object let in among
  Bladestorm's foes, which the boss seam's `hit` refuses as no lord). Two survived the first run, and each now dies on a pin
  added for it: a member holding neither half of an Accord, and a Cry rising mid-hall with no door.
- Re-aimed by content (mutantdrift), each dying on its own tests again:
  - `egint.json`'s EGINT-a-heal-ignored and EGINT-the-cast-back-uncapped, `egz_recap.json`'s EGZ-brain-the-count-unmended
    and `egz_rules.json`'s EGZI-brain-census-toll-unread and -the-last, onto the count's whole;
  - `egz_vestiges.json`'s EGZR-footing-immovable-unread and -share onto Rooted's footing;
  - EGZR-mender-share onto Living Wall's share;
  - EGZR-echo-full onto the screen's whole claim (the screen halving it);
  - EGZR-echo-q onto `net/egVestige.js`.
- Judged again, every one as recorded:
  - `egz_vestiges.json` (100), `egz_debts.json` (49), `egz_rules.json` (78) and `egz_relay.json` (45), every one dead;
  - `egz_lords.json` (35: 33 dead, its 2 equivalent as recorded);
  - the 29 records of other lists aimed within ten lines of a line this slice changed, every one dead (`egeco.json`,
    `egfull.json`, `egint.json`, `egplay.json`, `egpres_hud.json`, `egz_legion.json`, `egz_recap.json`, `egz_return.json`,
    `egz_sound.json`, `egz_telegraph.json`, `fieldbugs1012c.json`, `loot15.json`, `set2.json`).
- PIN MOVED:
  - `test/egz_vestiges.test.js`: the Echo's claim - 117 and 108 where 59 and 54 were - and its title;
  - `test/egz_lords.test.js`: the director calls the seam's `hit` twice - a member's blow, and a host hit on a lord.
- `RELAY_VERSION` `world198`, unshipped, is rehashed in place: `net/egBrain.js`, `net/egRun.js` and `net/egVestige.js`
  moved, and no file joined the bundle. `ACCOUNT_VERSION` stays `acct122`, with no migration. `EG_SPEC` and `EG_LAWS` are as
  they were.
- The 25-seed sweep is not run: no course, span law or hall spec moved.
- No new src module; the Port-Ledger's ELITE-GATES row is unchanged.

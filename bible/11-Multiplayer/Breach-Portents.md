# Breach Portents - the Vanguard, the Sundering and the Warden's new arsenal (WB14)

> Design page, written 2026-10-19 before the arc's first slice. The gate it builds on is `World-Bosses.md` (Dagon's
> Breach - the Burning Court, Valkynaz Ruhn, his marks, his host, his Reckoning); this page names only what it adds and
> what it moves. Where the page and a shipped slice disagree, the slice's own record (section 12) is what runs. A path
> that exists today is written from the repository root (`src/net/gate/gateBrain.js`); a path this arc will create is
> written without `src/` (`net/gate/gatePortents.js`).

## What Mac asked for

Mac, 2026-10-19:

> *"I want to talk about enhancing the oblivion gate structure, adding the chance of a gate to spawn with platforms of
> wave based adds that need to be defeated before encountering the boss. More diabolical boss movesets. More unique,
> but not super hard mechanics. Like the boss splitting and players having to split and navigate to beat both sides and
> then merging at the end for its final stand (chance based encounter modifer). And whatever else you can cook up"*

Offered a sketch - portents beside the marks, the Vanguard, the Sundering, seven new moves, three extras - and six
questions (the odds; announced or a surprise; the Wrath's clock; the Sundering's failure; one blow answered by turning;
which extras and what they pay), Mac answered: *"This is all yours to take on. Be as detailed as possible and treat
this like your baby. Take your time and be thorough"*. Every decision below is this page's, argued where it is made.

## The six answers

1. **The odds - a shuffle bag, over the nights that can carry one.** Every other such night carries a portent, drawn
   from a round of six: the Vanguard twice, the Sundering twice, the Captive once, the Dire Breach (the Vanguard and the
   Sundering together) once. A bag, not dice: dice leave a portent dry for a day and stack three in a row, and the
   province bag (`gateLaw.js pickGateRegion`) already taught the gate that a player who waits should see each one come
   round. The bag is drawn over the gates that are NOT a Legion-Lord night (section 3), so no portent is lost to the
   trial that excludes it: about two gates in five carry one (the Vanguard alone and the Sundering alone each about one
   in eight, the Captive and the Dire Breach each about one in fifteen - measured over 20,000 days), a round spans about fifteen gates - a real day and a quarter -
   and no two gates running both carry one, so a company that just fought one fights a plain night next.
2. **Announced, always.** The omen says the night's portent beside its marks (the chat, the map's card, the marks'
   card, Discord). Mac's own WB9a ask - *"Allow people to see the modifers/trial as a popup before it starts"* - is the
   gate's rule: a fight is read before it is fought. A Sundering said in advance is one a company can plan to split
   for; said nowhere, it would only be a wipe nobody saw coming. The one surprise is the Tithe-Imp (section 9), which
   costs nobody anything when it comes.
3. **The Wrath keeps its clock.** The Covenant seals the breach ten minutes after it opens and tears it shut twenty
   minutes after (`World-Bosses.md` section 19) on every screen, the herald and the omen alike. The Vanguard is sized to
   about two and a half minutes of a court fighting at half its reference damage, the Warden's own fight is unchanged
   in length, and no night is made later - a later Wrath for one kind of night would be one more thing a player has to
   remember, and the slack is there.
4. **The Sundering forgives.** A half brought down KNEELS, and the other has twenty seconds to follow it (the Elite
   Breach's Twin Lords' law, `Elite-Gates.md` 13.3, at its own court-of-one window `EG_TWIN_ONE_MS` - the Twins' fifteen
   is for a company of eight that chose this). A half left kneeling past it rises with three tenths of its share, not
   half. *"Not super hard"*: the fight asks a court to split; it does not punish one that splits badly once.
5. **One blow is answered by turning: the Burning Gaze.** Every blow the gate has is escaped by moving (`World-Bosses.md`
   section 5, "Its attacks - every one telegraphed"). The Gaze is the arc's one departure, named here: it lands on whoever
   is LOOKING at him as it lands, so it is answered by turning the camera away - a different skill, readable at once
   (his eyes blaze white, the screen's rim pulses, "Look away!"), and nothing a step can do. It is never counted by the
   relay (section 10: the relay does not hold a camera).
6. **All three extras, and every portent pays.** The Captive (a knight of the Covenant to free, section 7), the Tithe-Imp
   (section 9) and the Dire Breach (the Vanguard and the Sundering on one night, section 8). A portent night's receipt
   says its portents (`p`), and the spoils roll one more piece of Magic or better for each - two on a Dire Breach - and
   the account service rolls the Weir Key at the rite's odds, a quarter, where a plain kill rolls a sixth (section 11).

## The laws kept

What the gate promises every player, and this arc keeps:

- **The ground shows what lands.** Every new shape is drawn where it lands (`render/gate/gateTelegraph.js`), its fill
  reaching its far edge at the landing, its line in the danger edge (`TELEGRAPH_EDGE`); the pins hold the shader's own
  reading (`telegraphField`) to the strike's law (`net/gate/gateStrike.js`) point for point.
- **Every wind-up outruns its shape from its middle at a run (7.6 m/s), in phase three too** - but the Gaze (answer 5).
  NOTHING GETS FASTER (Mac, WBX: *"I dont think making mechanics faster is the play"*): no existing wind-up, pace or
  cadence moves.
- **The relay runs the fight, the struck screen judges its own feet** (co-op's law, `World-Bosses.md` section 5). What the
  relay can test from the poses it holds it counts (INT11, `net/bossRef.js judgeGate`); what it cannot - a facing, a
  shared blow's count, a pull - is the client's, never counted, in the struck player's favour.
- **The caps stand.** Every blow on any body of the fight - the halves, the Vanguard, the gaolers, the Tithe-Imp - goes
  through the one hand and purse (`spendBlow`, `spendPurse`): the fastest kill is still 75 s of the whole room at the cap.
- **One law, both ends.** The floor, the shapes, the waves' rules and the halves' are pure law in the relay's bundle, read
  by every screen.
- **The hosts do not grow** (HOST-SPLIT). New behaviour is in modules the hosts wire; a host line that changes is edited
  in place.

## 1. Portents - the draw (WB14b)

`net/gate/gateMods.js` gains the third kind of mark beside the aspect and the trials - GATE_PORTENTS, names and numbers:

| id | name | line (the omen's, the card's) | tip (the card's) |
|---|---|---|---|
| `vanguard` | The Vanguard | His vanguard holds the approach. | Break the waves on both platforms; the way to him opens behind them. |
| `sunder` | The Sundering | He tears in two at the second phase. | Split up; bring both halves down within 20 seconds of each other. |
| `captive` | The Captive | A knight of the Covenant lies chained in his pen. | Cut down the gaolers to free the knight; his ward takes a Reckoning. |

The Dire Breach is no table row: it is the Vanguard and the Sundering together, said as *"Dagon's Breach runs deep
tonight."* before the two lines.

**The bag** (`net/gate/gateLaw.js gatePortentsOf(day)`): the gates that are not a Legion-Lord night are counted from the
epoch (`gateIndex`, the cycle of marks known for every gate - `gateModsOf`; `carriersBefore` the count before each place
of the cycle, made once). The n-th of them carries none when n is odd; when n is even it takes slot `k mod 6` of round
`floor(k / 6)` of PORTENT_BAG (`k = n / 2`) - `vanguard, vanguard, sunder, sunder, captive, dire` - shuffled on the
round's own rolls (stream PORTENT_BAG_KEY 16, the marks' streams being 12-15). The alternation is the spacing law: two
portent nights always have a plain carrier between them, so no seam check is needed (a round may close on the Vanguard
and the next open on it - two portent nights apart, never two gates). A Legion-Lord night carries none. Pure, the relay's
and every screen's.

**Why never on a Legion-Lord night.** His host (`World-Bosses.md` section 17) is tied to his courts and phases: Harriers
in the first, Sappers walking at him in the second, Ward-Bearers rising wherever he lands. The Vanguard would put two
hosts in one fight and the Sundering two of him for the Sappers to walk at. Either can be argued; neither reads well.

**The fight keeps its portents.** The relay's draw at the fight's birth is kept on it (`f.pt`, an array of ids) and said in
every state (`pt`), as the marks are (`md`) - every screen fights the fight's own, whatever the day's draw would say.

**Said.** The omen's chat line gains the portent's line after the marks' (`systems/gate/gateOmen.js`); the map's card
(`gateTip`) names it in a line of its own under the marks (*The Vanguard, The Sundering*); the marks' card stands a row for it with its sign, name, line and tip; the
herald's omen post says it (`net/gate/gateHerald.js omenPost`). One sentence each, WB13b's rule.

## 2. The floor plan - every floor the night may stand (WB14b)

The court's floors are one table (`net/gate/gateBrain.js COURTS`, metres in the court frame, all of COURT_R) and the
walkways between them another (`WALKS`, each `{k, a, b}` - its index, the floor it leaves and the floor it reaches):

| floor | where | what | night |
|---|---|---|---|
| 0 | (0, 0) | the first court - the Warden's | every |
| 1 | (-68, -22) | the second court - the Burning Court | every |
| 2 | (-74, -94) | the third court - Dagon's Champion's | every |
| 3 | (-40, 60) | **the Muster** - the Vanguard's second platform | the Vanguard |
| 4 | (-20, 128) | **the Bridgehead** - the Vanguard's first, where its fighters arrive | the Vanguard |
| 5 | (70, -10) | **the Pen** - where the Captive is chained | the Captive |

| walkway | from | to | laid by | night |
|---|---|---|---|---|
| 0 | 0 | 1 | his bound to the second court (WB9b) | every |
| 1 | 1 | 2 | his bound to the third (WB9b) | every but the Sundering |
| 2 | 0 | 2 | the Flame's bound (section 5) - the Rift Way, 76 m | the Sundering |
| 3 | 4 | 3 | the Bridgehead cleared (section 4) | the Vanguard |
| 4 | 3 | 0 | the Markynaz's fall (section 4) | the Vanguard |
| 5 | 0 | 5 | the Warden's wake (section 7) | the Captive |

A night's PLAN is the floors and walkways its portents stand (`floorPlan(pt)`): the first two rows of each table always,
walkway 1 unless the night sunders, and each portent's own. The plan's ROOT is where its fighters arrive - the
Bridgehead on a Vanguard night, the first court on every other.

**One law of the floor, both ends, generalised** (`onFloor`, `clampToFloor`, WB9b's): the root always; each walkway of
the plan as far as it is laid, from a floor that is floor; each floor a walkway laid whole reaches. The walkways' laid
moments are one array (`xa`, by walkway index - WB9b's two and four more; a hole is a walkway not laid), said whole in
every state. A plain night's floor is WB9b's exactly; the pins hold the old answers under the new law.

**Where they stand.** The Muster and the Bridgehead lie south of the first court, off its bridge's line, so the stones
of walkway 4 meet the first court's rim beside the broken bridge and never over it; the Pen lies east; the Rift Way runs
from the first court's north-west to the third's south-east and passes the second court 16 m clear of its rim and 7 m
of its spires' feet. Every one is out of the great tower's window (`world/deadlandsLand.js TOWER_WINDOW` about
`render/deadlands.js SIGIL_TOWER`'s bearing). All inside the wire's GATE_COURT_BOUND (160 m: the Bridgehead's arrival
stands 152 m out).

**What is built.** The court's model, its collider and its braziers are the night's plan's (`buildCourtModel(pt)`,
`courtFloorTris(pt)`, `courtLights(pt)` - a plain night's are WB9b's byte for byte); the Vanguard's platforms keep no rune
ring (that ring is the Warden's, and he never stands there) and fewer spires. The Deadlands' islands keep clear of
every floor of every plan (`floorGap`), so the land is one land whatever the night; its hanging shards stay about the
three courts.

## 3. The Warden's new arsenal (WB14a) - every night

Seven new attacks in ATTACKS (ids 11-18), five of them his to choose in the fight and two his turns' own. Each chosen
one waits a cooldown of its own from its last use (`cd` - none of the old ones has one), needs a court of at least `nMin`
living challengers where it says so, and is weighed in his choice with the old (`w`).

| id | attack | phase | the ground | wind-up | lands for | what to do |
|---|---|---|---|---|---|---|
| 11 | **Chains of the Warden** | 1+ | a burning chain from him to one fighter within 14 m of him, following them | 3.0 s | the chained, 15% + 4, and dragged to his feet - then a Ground Slam | run: past CHAIN_HOLD_M (16 m) from him as it lands and the chain breaks |
| 12 | **Brand of Dagon** | 2+ | a 5 m ring under 1-3 fighters, following each | 5.0 s | everyone else within 5 m of a branded one, 40% + 10 of his element; the branded, 15% + 4 | the branded run clear of everyone; everyone keeps clear of them |
| 13 | **Shared Torment** | 2+ | a gold 4 m ring under one fighter, following them | 5.0 s | 90% + 24 of his element, SHARED among everyone inside: one takes it all, five take a fifth each | stand together on the marked one |
| 14 | **Scything Wheel** | 3 | two blades from his feet, 16 m long and 3.5 m wide, turning about him 0.36 rad a second for 6 s | 2.2 s | 40% + 12 of his weight, once, to whoever a blade passes over | keep ahead of the blades, or past their reach |
| 15 | **The Burning Gaze** | 3 | none - his eyes blaze white, the screen's rim pulses | 3.0 s | whoever's view holds him (within 50 degrees of the camera's heading, 60 m): 35% + 10, blinded 2 s | look away from him |
| 16 | **The Unmaking** | 3 | half the court's eight wedges about its heart; then the other half | 3.0 s each | 45% + 12 of his weight | step into a dark wedge; then back |
| 17 | **The Sundering** | his turn (section 5) | an 8 m disc about him | 2.6 s | 30% + 8 | step out of it |
| 18 | **The Rejoining** | his turn (section 5) | a 9 m disc at the first court's heart, where the halves fall back together | 3.2 s | 45% + 12 | keep off the heart |

| attack | cooldown | needs | weight |
|---|---|---|---|
| Chains | 22 s | a fighter within 14 m | 1 |
| Brand | 28 s | 2 in his court | 1 |
| Torment | 28 s | 2 in his court | 1 |
| Wheel | 30 s | - | 1 |
| Gaze | 35 s | - | 1 |
| Unmaking | 45 s | - | 1 |

**The phases now.** The Warden - blade and weight: the Cleave, the Slam, the Charge and the Chains. The Burning Court -
fire and reach: the Leap, Hellfire, the Meteor, the Nova, and the Brand and the Torment, which are the fire's own
questions of a court (spread out; gather in). Dagon's Champion: the Spokes, the Wheel, the Gaze and the Unmaking beside
the Reckoning. Dagon's Favoured (WB8b) brings the Brand and the Torment a phase early as it brings Hellfire.

**Chains.** The tether is the Spire's pull-apart grammar (`Elite-Gates.md` 25.5): a line from him to the chained, the
danger edge while they stand inside CHAIN_HOLD_M, the safe edge once they are past it. At the landing the RELAY reads the
chained fighter's pose: inside CHAIN_HOLD_M and its slack, it begins a Ground Slam at his feet one recovery later (1.0 s
- the pull ends first); past it the chain breaks and nothing follows. The chained player's own screen pulls its body to
4 m short of his (the motor's blow push, `player/motor.js blowPush` - the TELL6e law) and lands the 15%. A pull of at most
12 m lasts 1.4 s; the Slam is said at 1.15 s and lands at 2.75 s (phase three: 2.43 s), so the reeled fighter has a second
and more to run 4 m out of its 7.

**Brand and Torment follow their fighter.** Their rings stand where the marked fighter stands NOW on each screen (the
online frame's own places of the others - `scenes/gate/gateCourt.js stepsIn`, the crowd's cut or not), and at the landing
each screen judges its own feet against them: the Brand's burst within 5 m of any OTHER branded fighter, the Torment's
share by the count inside its ring as that screen sees it (itself included). The relay names the marked by their peer id
(the atk word's `pk`) beside where they stood at the word (`tg` - the ring a screen draws for one it cannot see). Both are
his element's, so the saving throw answers them, and neither is the relay's to count.

**The Wheel** is the Spokes' grammar with two lanes, turning: the ground draws the blades where they are at every frame;
a blade's verdict is the charge's (it strikes as it passes, between the frame before and this one; a slow frame still
sweeps what it missed) and the relay counts it the same way. The blades sweep 124 degrees each; at their tips (16 m) they
move 5.8 m/s, under a run.

**The Unmaking** is new ground: EIGHT wedges about his court's heart (not about him), alternate wedges lit, then - one
recovery and a breath later - the other four (its turn: a second cast turned a wedge on, the Spokes' own trick). From the
middle of a wedge at the rim the dark wedge beside it is 9.2 m: 1.2 s at a run, under its wind-up's 2.4 s in phase three.

## 4. The Vanguard (WB14c)

The fighters arrive on **the Bridgehead**. Across the fire to the north the Warden stands in the first court under his
ward - seen, never reached: *"His vanguard holds the approach. Break it."*

**The waves.** Six seconds after the first fighter stands on the Bridgehead (VG_OPEN_MS) the first wave rises from the
fire at its rim; each next wave rises when a quarter of the one before still stands, or VG_WAVE_MAX_MS (30 s) after it
rose. A wave's health is its TEAM SECONDS of the platform's living challengers' whole reference damage (the crystals'
law: a crowd breaks it in the same time as a few), shared over its bodies by kind; its bodies number
`clamp(2 + ceil(n / 2), 3, 10)` for `n` living challengers on the platform, at most VG_STANDING_MAX (12) of the Vanguard
standing. A wave due with nobody on its platform waits for somebody.

| platform | wave | its bodies | team seconds |
|---|---|---|---|
| the Bridgehead | 1 | Imps | 7 |
| | 2 | Imps and Brutes | 9 |
| | 3 | Brutes and Casters | 10 |
| the Muster | 1 | Casters and Imps | 10 |
| | 2 | Brutes, Casters and Imps | 11 |
| | 3 | **the Markynaz**, and Imps | 14 |

Sixty-one team seconds in all: about two minutes of a court striking at half its reference, and two crossings.

**The platform cleared.** The last body of the Bridgehead's last wave down, walkway 3 rises to the Muster (WB9b's slabs,
its law of the laid floor) - *"The Bridgehead is clear."* - and the Muster's waves begin when a fighter stands on it.
The Markynaz down, his Imps crumble and walkway 4 rises to the Warden - *"The Markynaz falls. The way to the Warden
opens."* The Warden's opening (OPENING_MS) begins as the first fighter stands in his court: his wake, his marks' card,
his fight, all as on any night.

**The kinds** (`net/gate/gateBrain.js HOST_KINDS`, new ids beside WB11's three - Daggerfall's own bodies):

| id | kind | body | moves | its blow |
|---|---|---|---|---|
| 0 | **Imp** (WB11's Harrier) | r 0.5, h 1.5, hovers | 5.0 m/s at the fighter standing farthest from the rest | Bite: disc r 2 about itself, 0.9 s, 12% + 4 |
| 3 | **Brute** - a Daedroth | r 0.8, h 2.4 | 2.8 m/s at the nearest fighter | Smash: disc r 3 about itself, 1.3 s, 28% + 9 |
| 4 | **Caster** - a Fire Daedra (Burning), Frost Daedra (Rime), Daedra Seducer (Storm), Lich (Venom) | r 0.6, h 2.2 | 2.0 m/s, keeping 10-16 m from the nearest fighter | Bolt: disc r 3 at a fighter's feet within 22 m, 1.6 s, 22% + 7 of his element, leaving his ground (Hellfire's pool) |
| 5 | **the Markynaz** - the Warden's lieutenant, a Daedra Lord at 1.6 times its size | r 0.9, h 3.0 | 3.0 m/s at the nearest fighter | Rend: disc r 4.5 about itself, 1.3 s, 38% + 11; and every 15 s he calls two Imps out of the fire |

A Dremora rank: a markynaz serves a valkynaz (*Oblivion*'s Kyn ranks, the Warden's own title among them).

**His patience** (VG_PATIENCE_MS, 4 minutes after the first wave): a Vanguard still standing then, he throws a Meteor of
Oblivion from his court onto a living fighter on the platforms every 15 s - his own Meteor, its wind-up, its ground: a
clock that keeps a stalled court moving, never a wipe. *"Valkynaz Ruhn tires of waiting."*

**Late, and cast out.** A fighter who steps in later arrives on the Bridgehead too, the walkways laid behind the court
standing: a run of about 17 s to the Warden. A death is cast out as on any night.

**Never in a Legion-Lord night** (section 1). The Vanguard's host and his run on the same bodies' law
(`stepHost`'s - each a point, a health, a walk said once, a disc wound up), in a beat of their own (`stepVanguard`).

## 5. The Sundering (WB14d)

At the second phase's turn (66%) he does not bound: he calls **the Sundering** at his court's heart (2.6 s, a disc of
8 m) and tears in two - **Ruhn's Blade**, his body, and **Ruhn's Flame**, his aspect's fire made flesh (Ruhn's Rime,
Ruhn's Storm, Ruhn's Venom under the others - `aspect.stuff`).

**The split.** With SUNDER_SPLIT_MIN (4) or more living challengers in the room, the Blade bounds to the second court
(walkway 0) and the Flame to the third over **the Rift Way** (walkway 2, 76 m of stone rising out of the fire from the
first court's north-west) - each under its own ward, each waiting for a challenger in its court (WB9b's wait), each
casting a signature as its ward breaks: the Blade a Ground Slam, the Flame a Flame Nova. With fewer, both bound to the
second court and fight there together - nothing asks two people to split.

**Their health.** At the split, what he has left above SUNDER_LAST (26% of his whole) is shared between them: each half's
pool is half of it, and his bar is the two pools and the last stand's share. A blow names the half it lands on (the
`hit` word's `b`: 0 the Blade, 1 the Flame), and the hand and the purse are the fight's one each - no claim buys a faster
kill by striking two bodies.

**The kits.** The Blade: the Cleave, the Slam, the Charge, the Leap and the Chains. The Flame: Hellfire, the Meteor, the
Nova and the Brand. Each chooses, aims at and waits for the challengers in its own court alone; each keeps its own threat.
The Blade stands 0.85 of his size, the Flame 0.75 and burns in his aspect's ember.

**The pair law.** A half whose pool is spent KNEELS: no step, no blow, no blow taken, its bar *Kneels - 20s*. The other
brought down within SUNDER_PAIR_MS (20 s) and they rejoin; past it, the kneeling half rises with SUNDER_RISE (30%) of its
pool - *"Ruhn's Blade rises."* - and the court tries again. Either half's kneel is said to the whole court, and the bar
says the other's seconds.

**A half alone mends.** A half with no living challenger in its court for SUNDER_LONE_MS (10 s) - a court that went all
to one side - mends SUNDER_MEND (1% of its pool a second, never past its pool), its bar tagged *Alone*. Never in the
together layout.

**The Rejoining.** Both knelt, both bound back to the first court's heart (the Rejoining - a disc of 9 m where they meet,
3.2 s), and he stands there WHOLE at SUNDER_LAST: Dagon's Champion, the last phase, fought in the first court - its
signature (the Spokes, then the four between), its arsenal, and Dagon's Reckoning armed there. The court runs back over
the walkways it came by.

**Under his marks.** Colossal's size and health, Unyielding's ward and Vengeful's weight are each half's as they were
his. Soul-Hungry's feeding heals both standing halves by half its share each (never past their pools). Grudge-Bearer's
threat is each half's own. Echoing's second meteor is the Flame's.

## 6. The words and the bar (WB14a-d)

- **The bar** keeps one track while he is whole. Sundered it is two, side by side - each half's name, its pool, its ward
  and its state (*Warded*, *Kneels - 14s*, *Alone*). On a Vanguard night it says the Vanguard's progress under his
  health (*The Vanguard - Bridgehead, wave 2 of 3*).
- **The title cards** (WB13e): the Sundering's turn - *II · The Sundering · Bring both halves down together.*; the
  Rejoining - *III · Dagon's Champion · Back to the first court.*
- **On me**: *Chained! Run from him!*; *Dagon's Brand is on you. Keep clear of the others!*; *Shared Torment on you.
  Gather the others!*; *Shared Torment! Stand with Ann!*; *Look away!* - each said as its word comes, the ground view's
  warning (`ui/gate/gateGroundView.js`) carrying the order while it stands, its arrow the way out (or, for the Gaze, the
  way to turn).

## 7. The Captive (WB14f)

On a Captive night the Pen stands east of the first court, and in it, on his knees, **a knight of the Covenant** (the day's
own name - Sir Evrard, Dame Lysandre, ... - `net/gate/gateMods.js CAPTIVE_NAMES`), chained to his gaolers. As the Warden
wakes, walkway 5 rises to the Pen - *"Sir Evrard of the Covenant lies chained in the Pen. Free him!"*

**The gaolers** are WB11's Ward-Bearers' body and Pulse under another name (kind 7 - a Ward-Bearer is the Legion-Lord's,
and never on this night): `bearerCountFor` of the fight's challengers on a ring about the Pen's heart, BEARER_TEAM_S of
their reference damage shared, each a chain to the knight (WB11c's tether, drawn in Dagon's crimson). The last one down,
the knight is free - *"Sir Evrard is free! The Covenant's ward stands over the court."*

**The Covenant's ward.** The next Dagon's Reckoning to land lands on the ward and on no fighter (its crystals still to
break for the stun - the ward spares the court, it does not break the Reckoning). Spent once. The knight stands in the
Pen in gold until it is spent, then is gone - back through the breach the Covenant holds.

Lore: section 19 of `World-Bosses.md` - *the Covenant fights every one*. Its knights are taken. The caged prisoners of
*Oblivion*'s gates are the precedent.

## 8. The Dire Breach (WB14b)

The Vanguard and the Sundering on one night, said *"Dagon's Breach runs deep tonight."* Nothing else changes: each is
fought as its own section says, the Vanguard first. Its receipt says both (section 11).

## 9. The Tithe-Imp (WB14e) - any night, unannounced

One night in five (`gateRoll(day, 21)`), somewhere between 50 s and 150 s after his wake, while he is in his first or
second phase, **a Tithe-Imp** - an Imp at 1.3 times its size, burning gold, carrying the coven's tithe to its master -
rises at his court's rim farthest from him and runs. It flees the nearest challenger at TITHE_SPEED (6.2 m/s, under a
run), strikes nobody, and dives into the fire TITHE_LIFE_MS (22 s) after it rose. Its health is four seconds of the
court's mean reference damage: a few blows.

Caught, every challenger who landed a blow on it is handed **the tithe** - gold and a gem off a seed of the relay's own
(`{k: 'tithe', c}`), spilling where it fell, theirs alone: *"Ann catches the Tithe-Imp! Its tithe spills."*; escaped,
*"The Tithe-Imp escapes into the fire."* It is not in the omen: the one surprise of the arc, and it costs nobody
anything.

## 10. The wire, and what the relay judges (WB14a-f)

GATE_BRAIN_V and GATE_BRAIN_MIN go to 6: a game that knows none of this would stand in a Brand it cannot see, strike a
half it cannot name and walk onto a platform the floor law refuses - it is refused at its `in` and told to reload
(GATE-RELOAD's words). The bump redeploys the relay and drops every connected player once, so the arc ships as one relay
version.

| word | way | what |
|---|---|---|
| the state's `pt` | room -> one, all | the fight's portents |
| the state's `xa` | room -> one, all | WB9b's crossings, by walkway (six, `null` for one not laid) |
| `atk`'s `pk` | room -> all | the peer ids of the fighters a Chain, a Brand or a Torment marks (beside `tg`, where they stood) |
| `atk`'s, `mv`'s, `ph`'s `b` | room -> all | the Flame's (1) - none, the Blade's or his whole |
| `hit`'s `b` | client -> room | the half a blow lands on |
| the state's `sd` | room -> one, all | the Sundering: each half's pool and whole, its kneel, and the Flame's body (place, walk, attack, ward, court) |
| `sdh` | room -> all | the halves' pools, at most every HP_SEND_MS |
| `kn` / `kr` / `rj` | room -> all | a half knelt; a half rose; the halves rejoined |
| the state's `vg` | room -> one, all | the Vanguard's stage: the platform, the wave, done |
| `vgw` | room -> all | a Vanguard stage begun: a wave risen, a platform cleared, the Markynaz risen, the Vanguard broken |
| the state's `cp` | room -> one, all | the Captive: freed, and the ward spent |
| `cpf` / `cpw` | room -> all | the knight freed; his ward taking a Reckoning |
| `tithe` | room -> one account's sockets | its tithe's seed |
| `ad` ... `adie` | room -> all | WB11b's host words, carrying the new kinds; `adie`'s `w` gains 3, FLED (the Tithe-Imp) |

**What the relay counts** (INT11, `net/bossRef.js judgeGate`): the Wheel down its sweep, the Unmaking's wedges, the
Sundering's and the Rejoining's discs, every new kind's plain blow - his weight's. Never: the Chain (a pull the relay does
not hold), the Brand and the Torment (his element's, and a count the relay does not hold), the Gaze (a camera), and the
Covenant's ward spares the Reckoning it takes.

## 11. What it pays (WB14g)

The receipt (`net/gate/gateReceipt.js`) gains `p`, the night's portents a bit each - 1 the Vanguard, 2 the Sundering, 4 the
Captive freed (a Captive night whose knight stayed chained says none) - optional, so a receipt minted before it reads as
plain. The spoils (`systems/gate/gateSpoils.js`) roll one more piece of Magic or better for each bit, after every draw
they made before (the Dragonfire Oath's law: every spoils rolled before is what it was for its seed). The account service
rolls the Weir Key at EG_KEY_ODDS_PORTENT (a quarter, the rite's) for a receipt with `p` (`server-account/src/eg.js`).

The tithe (section 9) is the Tithe-Imp's alone, on its own seed, beside the receipt and never on it.

## 12. The slices and their records

| slice | what |
|---|---|
| WB14a | the Warden's new arsenal: the seven attacks, their ground, their verdicts, their words and sounds |
| WB14b | the portents' table and bag, the floor plan, the words; the Dire Breach |
| WB14c | the Vanguard |
| WB14d | the Sundering |
| WB14e | the Tithe-Imp |
| WB14f | the Captive |
| WB14g | what it pays |

Each slice's record is written below as it ships.

## 13. What it does not do, said so

- No portent offline - there is no gate offline.
- The Vanguard's host does not path: its platforms are open discs, as his courts are.
- The halves never merge early, and a Wrath overtakes them as it overtakes him whole.
- The Gaze is the one blow a step does not answer; nothing else departs from the escape law.
- No new art from outside the tree: every body is Daggerfall's own, every floor the court's own stone.

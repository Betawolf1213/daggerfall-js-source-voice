# THE KING'S GAMBIT - armies and kings at the tavern's card table (KG0, the design record)

**Status: DESIGN RECORD, DECIDED (the owner, 2026-10-13: "Make the best and most detailed decisions. We also have
permission") - section 10 answers section 9 and decides every point the record had left open. KG1 SHIPPED (the law,
section 11).** The owner handed over a
Daggerfall Unity mod, `thekingsgambit.dfmod`, and asked how to build it as a new minigame on the Iliac Bay card system -
the tavern card table `Tavern-Cards.md` built: the table and its seat, the deck of the Iliac Bay, Iliac Hand's painted
cards, the regulars, the panel, the relay's tables. Sections 1-2 read the mod off its assembly; sections 3-7 lay it on
the card table; section 8 slices it; section 9 asked and section 10 decides. Every DECIDED below binds the slices; a
slice that ships one records any change here first.

## The words

- The owner, 2026-10-13, handing over `thekingsgambit.dfmod`: **"How can we implement this using the illiac bay card
  system. A new minigame"**.

## How to read this page

| Mark | Meaning |
|---|---|
| **THE MOD'S** | What the mod does, read off its assembly - the law a slice ports verbatim (Port-Doctrine's translation rule, held to a mod as the registry holds every mod it carries). |
| **DECIDED** | The record's proposal. Binding on the slices once the owner answers section 9; the owner may overrule any of it. |
| **FACT** | What the tree does today, read off the file named. |
| **MEASURE** | A number this page cannot know yet; the named slice measures it before it builds on it. |

Not a DFU member: Daggerfall Unity ships no such game - the mod does. Its port is a mod's (`01-Overview/Mod-Registry.md`,
the way Meaner Monsters and Windfall came in from their compiled assemblies), and each slice that ships opens or narrows
its Ledger section A row.

## 1. The bundle (FACT - read off the file the owner handed over)

- `thekingsgambit.dfmod`, 52,512 bytes, sha256 `60b9400b1a8ea93cfdf140ff11d44af713188244f4a262d58a122983171539cd`:
  UnityFS 7 from Unity 2019.4.41f2, one LZ4HC block, one serialized file holding TWO assets:
  - the manifest `TheKingsGambit.dfmod.json` - ModTitle `TheKingsGambit`, ModVersion `1`, DFUnity_Version `1.1.1`, GUID
    `e3406109-b550-43e4-ae70-51e32850e225`. Its Files list names `Scripts/TheKingsGambit.cs`, which the bundle does not
    carry;
  - the compiled `TheKingsGambit.dll`, 89,600 bytes, sha256
    `e1eb5e05747e31bb51e09486f380bded2961d8b04a23b18104a91955fe723036`: `TheKingsGambit` (a MonoBehaviour - the whole game,
    its IMGUI and its network link `NetLink`) and `TheKingsGambitWindow` (an empty 320 x 200 DaggerfallPopupWindow the game
    pushes so DFU pauses under it, then draws over).
- No author, no licence, no readme (section 9, Q6).
- Read with ilspycmd 9.1 (the C#) and its IL: the static constructor fills five arrays from RVA data the C# view cannot
  show - the stake multipliers `{1, 2, 5}`, the online stakes `{0, 10, 50, 200, 1000, 5000}` and the three sound tables
  (section 2.10).
- Its particle art is NOT in the bundle. `LoadModTexture` asks the mod for `circle_05`, `flame_05`, `star_06`, `smoke_07`
  and `circle_03`, finds none, warns, and uses its own procedural soft circle (`MakeSoftCircle`, 32 px): the shipped
  game's fire and poison are particle systems of that one blob, and with no particle shader at all it draws
  `DrawHazard`'s rectangles.

## 2. The game, as the mod plays it (THE MOD'S)

"A game of armies and kings. Protect yours." Two sides, each a free king and up to twelve units bought with points from
Daggerfall's own bestiary, on a board fifteen columns by thirteen rows; a turn is two actions; a side whose king falls,
or that has no piece left, loses. Played against the innkeeper (four tiers) for a gold stake, or against a friend online.

### 2.1 The board

- 15 columns by 13 rows (`Cols`, `Rows`). A cell is Floor, Wall, Pillar or Water (`MapTile`). Only Floor is walked
  (`IsPassable`); a Wall or a Pillar blocks a sight line (`BlocksSight`), Water does not ("Water: cannot be crossed on
  foot, but ranged attacks pass over it.").
- The host's side is the board's foot (rows 10-12, the king on column 7 of row 12); the guest's is its head, every cell
  mirrored through the centre, (c, r) to (14 - c, 12 - r). Each client draws its own side at the foot.
- THE MAP IS POINT-SYMMETRIC: `SetTile` writes a cell and its mirror, and only in rows 3-9 (`ZoneTop`, `ZoneBottom`) -
  the deployment rows 0-2 and 10-12 are always floor.
- `BuildMap`: up to 30 tries. Each clears the board, picks a layout (`Rand(0, 4)`), lays three ACTIVE hazard pairs (2.6),
  and keeps the board if it is playable (`MapIsPlayable`: the head's king cell (7, 0) reachable from the foot's (7, 12)
  over floor alone - pieces block nothing there - and at least 97% of the floor reachable). Thirty failures lay the Open
  field.

  | layout | floor tones A / B (RGB) | what it lays |
  |---|---|---|
  | Pillared hall | 0.27 0.27 0.30 / 0.36 0.36 0.40 | a pillar on columns 1, 4, 7, 10 and 13 of rows 3, 5, 7 and 9; RandomChunks(2) |
  | Guard rooms | 0.30 0.23 0.17 / 0.40 0.31 0.22 | row 5 a wall but at k, 7 and 14 - k, k = Rand(1, 4) - mirrored, so row 7 as well; a wall at (5, 6), so at (9, 6); RandomChunks(2) |
  | Ruined keep | 0.24 0.29 0.20 / 0.32 0.38 0.26 | RandomChunks(8) |
  | Moat and bridges | 0.40 0.35 0.24 / 0.49 0.43 0.30 | row 6 water but at k, 7 and 14 - k, k = Rand(2, 6); RandomChunks(3) |
  | Open field (the thirtieth failure) | 0.24 0.29 0.20 / 0.32 0.38 0.26 | no wall; three active hazard pairs |

- `RandomChunks(n)`, n times: c = Rand(1, 14), r = Rand(3, 7), shape = Rand(0, 5); a wall at (c, r), with (c + 1, r) for
  shape 1, (c, r + 1) for 2, both for 3, (c - 1, r) and (c + 1, r) for 4. A wall cell is laid only on floor in columns
  1-13 of rows 3-9 (`PlaceWallCell`), mirrored.
- `Rand(a, b)` is `System.Random.Next(a, b)`, a draw in [a, b), off the game's seeded source.

### 2.2 The units and the roster

- A unit (`MakeUnit`) is a row of DFU's EnemyBasics: level the row's Level (a calling 6, a king 8); hp (MinHealth +
  MaxHealth) / 2 truncated, at least 1 (a calling 30, a king 70); attack RoundToInt(level x 2 x (ranged ? 0.75 : 1)), at
  least 1; cost RoundToInt(sqrt(hp x attack) x (ranged ? 1.35 : 1)), at least 6 (`MinCost`; a king 0). Computed at
  float32, and Unity's RoundToInt rounds a half to even. The declared DamagePerLevel 2, RangedDamageFactor 0.75, CostScale
  1 and RangedCostFactor 1.35 are those literals. Its name is TextManager's (`GetLocalizedEnemyName`).
- THE ROSTER (`BuildRoster`): every row with a MaleTexture - the 42 monsters, all melee (no monster row has
  HasRangedAttack1), and of the callings only the four of `RangedClasses` (Mage 128, Sorcerer 131, Archer 141, Ranger 142),
  ranged. 46 units, sorted by cost, then by name (ordinal).
- THE KINGS: the host's the Knight (145), the guest's the Barbarian (143) - two sprites over one set of numbers: level 8,
  70 hp, attack 16, free.
- THE TABLE, computed off the port's own `characters/enemyBasics.js` (ENEMY_BASICS, DFU's rows) at float32 and at
  float64, with half to even and with half up: every unit the same - the vanilla rows meet no half. The last column is
  FACT: the card each creature already is (`cardSources.js:"export const FOE_CARDS = Object.freeze({"`).

  | id | unit | level | hp | attack | cost | reach | its Iliac card |
  |---|---|---|---|---|---|---|---|
  | 0 | Rat | 1 | 12 | 2 | 6 | melee | Rat |
  | 1 | Imp | 2 | 14 | 4 | 7 | melee | Imp |
  | 3 | Giant Bat | 3 | 19 | 6 | 11 | melee | Giant Bat |
  | 2 | Spriggan | 3 | 19 | 6 | 11 | melee | Spriggan |
  | 4 | Grizzly Bear | 4 | 23 | 8 | 14 | melee | none |
  | 5 | Sabretooth Tiger | 4 | 23 | 8 | 14 | melee | none |
  | 6 | Spider | 4 | 23 | 8 | 14 | melee | none |
  | 7 | Orc | 5 | 23 | 10 | 15 | melee | Orc |
  | 8 | Centaur | 5 | 30 | 10 | 17 | melee | Centaur |
  | 10 | Nymph | 6 | 32 | 12 | 20 | melee | Nymph |
  | 12 | Orc Sergeant | 7 | 32 | 14 | 21 | melee | Orc Sergeant |
  | 11 | Slaughterfish | 7 | 32 | 14 | 21 | melee | none |
  | 141 | Archer | 6 | 30 | 9 | 22 | ranged | none |
  | 128 | Mage | 6 | 30 | 9 | 22 | ranged | Mages Guild Apprentice |
  | 142 | Ranger | 6 | 30 | 9 | 22 | ranged | none |
  | 131 | Sorcerer | 6 | 30 | 9 | 22 | ranged | Mages Guild Battlemage |
  | 9 | Werewolf | 6 | 41 | 12 | 22 | melee | Werewolf |
  | 14 | Wereboar | 8 | 41 | 16 | 26 | melee | Wereboar |
  | 41 | Dreugh | 16 | 23 | 32 | 27 | melee | Dreugh |
  | 15 | Skeletal Warrior | 9 | 41 | 18 | 27 | melee | Skeletal Warrior |
  | 13 | Harpy | 8 | 50 | 16 | 28 | melee | Harpy |
  | 34 | Dragonling | 16 | 28 | 32 | 30 | melee | Dragonling |
  | 40 | Dragonling | 16 | 28 | 32 | 30 | melee | Dragonling |
  | 18 | Ghost | 11 | 41 | 22 | 30 | melee | Ghost |
  | 16 | Giant | 10 | 46 | 20 | 30 | melee | Giant |
  | 19 | Mummy | 11 | 41 | 22 | 30 | melee | none |
  | 20 | Giant Scorpion | 12 | 46 | 24 | 33 | melee | Giant Scorpion |
  | 42 | Lamia | 16 | 37 | 32 | 34 | melee | Lamia |
  | 17 | Zombie | 10 | 59 | 20 | 34 | melee | Zombie |
  | 21 | Orc Shaman | 13 | 46 | 26 | 35 | melee | Orc Shaman |
  | 22 | Gargoyle | 14 | 50 | 28 | 37 | melee | Gargoyle |
  | 24 | Orc Warlord | 16 | 55 | 32 | 42 | melee | Orc Warlord |
  | 23 | Wraith | 15 | 60 | 30 | 42 | melee | Wraith |
  | 35 | Fire Atronach | 16 | 77 | 32 | 50 | melee | Fire Atronach |
  | 37 | Flesh Atronach | 16 | 77 | 32 | 50 | melee | Flesh Atronach |
  | 38 | Ice Atronach | 16 | 77 | 32 | 50 | melee | Ice Atronach |
  | 36 | Iron Atronach | 16 | 77 | 32 | 50 | melee | Iron Atronach |
  | 25 | Frost Daedra | 17 | 77 | 34 | 51 | melee | none |
  | 26 | Fire Daedra | 17 | 82 | 34 | 53 | melee | none |
  | 27 | Daedroth | 18 | 86 | 36 | 56 | melee | Daedroth |
  | 29 | Daedra Seducer | 19 | 86 | 38 | 57 | melee | Daedra Seducer |
  | 28 | Vampire | 19 | 91 | 38 | 59 | melee | Vampire |
  | 30 | Ancient Vampire | 20 | 100 | 40 | 63 | melee | Ancient Vampire |
  | 32 | Lich | 20 | 100 | 40 | 63 | melee | Lich |
  | 33 | Ancient Lich | 21 | 100 | 42 | 65 | melee | Ancient Lich |
  | 31 | Daedra Lord | 20 | 122 | 40 | 70 | melee | Daedra Lord |

### 2.3 Recruiting

- 300 points (`PointBudget`), at most 12 units (`MaxUnits`), a unit as often as the points allow; the king is free. A
  card clicked recruits (`TryAdd`: refused at 12 units or past the points); an army row clicked is removed; Clear empties
  the army; Auto-fill fills it.
- `AutoFill(army, budget)`, at most 200 rounds while the army is under 12: the units the points left still buy (none:
  stop); while the army holds fewer than two ranged units, one time in two only the ranged among them (if any); two of
  those drawn at random, the dearer kept; added, its cost spent.
- The screen's words: "Click a card to recruit it, or press Auto-fill. Click an army row to remove it. Cost = sqrt(HP x
  Attack), ranged units x1.35."

### 2.4 The deployment (`PlaceArmy`)

- The king on (7, 12). Then the units dearest first (a tie by id): a melee unit takes the next free cell of row 11, else
  of row 10, else of row 12; a ranged unit row 12, else 10, else 11. Each row is taken centre-out (`CenterOut`: 7, 6, 8,
  5, 9 ... 0, 14), row 12 without the king's column. The guest's army is placed the same way and mirrored. Pieces are
  numbered in that order, the host's first.

### 2.5 A turn

- The host moves first. A turn is two actions (`ActionsPerTurn`), each a move, an attack or a potion, by any piece, in
  any order; End turn spends what is left. A command is legal (`IsLegal`) only in its side's turn, with an action left, no
  turn ending and no game over:
  - MOVE: one's own piece to a cell of `GetReachable` - breadth-first over floor, at most 3 steps (`MoveRange`), through
    no piece, never its own cell;
  - ATTACK: one's own piece on a foe in range (`InRange`) - Manhattan distance 1 (melee), or 1 to 4 (ranged,
    `RangedRange`); past 1 a ranged blow needs a sight line (`HasLineOfSight`: four samples a cell along the longer axis,
    each rounded half away from zero (`RoundDiv`); a Wall or a Pillar on any sampled cell but the two ends blocks it);
  - POTION: one's own hurt piece, a potion left (3 a side, `PotionsPerSide`; the innkeeper's side the tier's count). It
    heals the least of 30 (`PotionHeal`) and what the piece lacks.
- A BLOW (`Attack`): attack x (0.8 + 0.4u), u one draw off the game's seeded source (`NextDouble`), at float32, rounded
  half to even, at least 1. A piece at 0 hp or below is destroyed.
- THE TURN'S END, 0.9 s after its last action (`TurnEndDelay`): the side that moved takes its hazards (2.6); after the
  guest's turn the round counts on (from 1) and every even round the hazards tick; the other side's turn begins, two
  actions.
- THE END (`CheckGameOver`, after every blow and every hazard's bite): a side with no king or no piece loses - "The
  innkeeper's king has fallen." / "Your king has fallen." (the opponent's fall read first).

### 2.6 Hazards

- Fire 8, Spikes 6, Poison 5 (`FireDamage`, `SpikeDamage`, `PoisonDamage`). A pair is point-symmetric and of one kind
  (`SpawnHazardPair`: up to 40 tries of c = Rand(0, 15), r = Rand(3, 10); not the centre; both cells floor, no hazard, no
  piece; then the kind, Rand(0, 3)).
- Three ACTIVE pairs at the start (`HazardPairsAtStart`). At a turn's end every piece of the side that moved standing on an
  active hazard takes its damage (`ApplyHazards` - "damage to a piece that ends its turn here").
- Every second round (`HazardSpawnEvery`, after the guest's turn) every warning turns active, and a new WARNING pair is
  laid while the board would hold at most 14 (`MaxHazards`) - "New hazards are appearing. Watch the warning markers." A
  warning hurts nobody until it turns.

### 2.7 The innkeeper

- THE TIERS (`Tiers`), the mod's own words:

  | tier | least stake | points | potions | blunders | blurb |
  |---|---|---|---|---|---|
  | Amateur | 10 | 220 | 2 | 35% | He has had a few drinks and barely knows the rules. |
  | Seasoned | 50 | 300 | 3 | 15% | He plays most nights and knows what he is doing. |
  | Veteran | 200 | 360 | 3 | 5% | A shrewd tactician who rarely makes a mistake. |
  | Grandmaster | 1000 | 450 | 4 | 0% | Legendary across the Iliac Bay. Bring your best army. |

- The tier (`TierFor`) is the innkeeper's faction's: ((factionID x 73856093) ^ 0x127409F) mod 100 as a C# int (the
  product wraps; the remainder is made positive) - under 40 Amateur, under 75 Seasoned, under 93 Veteran, else
  Grandmaster. The innkeeper's army is Auto-filled to the tier's points.
- THE INNKEEPER'S TURN (`AiTurnRoutine`): 1.2 s (`EnemyPause`), then up to two actions 1.2 s apart; an action it cannot
  find ends the turn.
- AN ACTION (`AiAction`) - the first rule that answers:
  1. with the tier's chance, a BLUNDER (`AiBlunder`): a random piece attacks a random foe in its range one time in two,
     else moves to a random cell it reaches;
  2. a potion, while one is held, on the piece with the least health in hand at or below its line (a king a half, any
     other piece three tenths);
  3. a piece on an active hazard that would die of it - or any, on the turn's last action - steps off (`TryEscape`: to the
     reachable cell with no hazard, warning or active, farthest from the player's pieces for a king and nearest for
     anything else, by the player's pieces' walking distances over floor (`PathMap`, `NearestPath`), ties broken by a draw
     in [0, 0.1));
  4. the best blow: attack + a draw in [0, 1), +40 on the player's king, +30 on a foe whose hp is at most the attack;
  5. the best move, scored for each piece and each cell it reaches: a king moves only to get farther when a foe is within
     4 steps (the gain x 5, else -100); any other piece, from a cell that puts a foe in range, 50, +20 with the player's
     king among them, and for a ranged piece + 0.5 x min(its distance from the nearest foe, 20); from any other cell its
     gain in nearness x 3; less 8 for a warning under the cell and 40 for an active hazard; + a draw in [0, 0.1). Only a
     score above 0 moves.
- Its choices draw from Unity's shared `Random` (unseeded); the game's dice - the map, the hazards, a blow - from the
  game's own `System.Random(seed)`.

### 2.8 The stake

- Against the innkeeper: "He will not sit down for less than" the tier's least stake; the player bets it x 1, x 2 or x 5
  (`StakeMultipliers`) from the purse, taken at "Start battle". A win pays twice the stake ("You collect the pot: your N
  gold back, plus N gold from the innkeeper."); a loss keeps it; LEAVING FORFEITS IT ("Leaving a match early forfeits your
  stake."). A cancelled match (online) gives it back.
- Online: the host offers 0 (friendly), 10, 50, 200, 1000 or 5000 gold each (`OnlineStakes`); the guest accepts or
  declines; each client takes its own stake and pays itself the pot.

### 2.9 Online, the mod's way

- A peer-to-peer lockstep through three PUBLIC MQTT brokers (`BrokerHosts`: broker.emqx.io, broker.hivemq.com,
  test.mosquitto.org) - port 8883 with TLS that accepts any certificate, then 1883 plain - on topics named by the host's
  six-letter room code (`kingsgambit-dfu-v1/<code>/toHost` and `/toGuest`; the code's first letter picks the broker).
  HELLO carries the version (`KG2`) and the roster's signature (`RosterSig`); OFFER, ACCEPT and DECLINE the stake; ARMY
  each side's unit ids at Ready; START the seed; CMD each command with a hash of the state after it (`StateHash`) - a hash
  that differs, a gap in the numbering or an illegal command cancels the match and returns both stakes; FORFEIT; ABORT.
  Both clients run the whole game, and each settles its own purse: a peer whose link drops in a staked battle loses it,
  the survivor paying itself the pot (`OnConnectionLost`).

### 2.10 What a player sees and hears

- The army screen's cards (`DrawCard`, 108 x 120): the unit's attack animation looping, its name, level and hp, attack,
  "Ranged", its cost - gold, or red and dimmed past the points.
- The battle (`DrawBattle`): the board in the layout's checker; a piece's DFU sprite by facing (record 0 move, 5 attack,
  10 hurt, 15 idle, 20 a ranged calling's shot; +2 a side, mirrored, +4 north; `InvertedSideFlip` the Ghost and the
  Wraith) on its side's tint (blue 0.2 0.45 0.95, red 0.9 0.2 0.2, at 0.45), a health bar red to green, the king's gold
  outline and "K"; the selected piece yellow; its reach green, its range white, its targets red; the result's banner 1.3 s
  after the end (`ResultDelay`).
- Motion: a walk at 3.5 cells a second (`MoveSpeed`), the lunge 0.28 s (`LungeTime`), the hit's shake and flash 0.45 s
  (`HitTime`), a shot's flight 0.3 s (`ProjectileTime`), a floating number 1 s (`FloatTime`), the heal's glow 0.6 s
  (`HealTime`), the death's fade 0.6 s (`DeathFade`) from 0.27 s after the blow lands; the sprites at 6, 10 and 4 frames a
  second (`MoveFps`, `AttackFps`, `IdleFps` - DFU's own MOVE, PRIMARY_ATTACK and IDLE speeds, `characters/mobileUnit.js`).
- Sounds - DFU's SoundClips by DAGGER.SND index (FACT: the names `systems/soundClips.js` carries; the rest are unnamed in
  the port and are named from SoundClips.cs by the slice that plays them): win 32 (ArenaFanfareLevelUp), lose 458
  (`systems/arenaSound.js`'s groan), coin 361 (GoldPieces), challenge 300 (DiceRoll), start 78 (DrawWeapon), click 360
  (ButtonClick), potion 365 (MakePotion), death 15 (BodyFall), a hazard's warning 1; a blow's hit 108-112 (Hit1, Hit2 and
  three unnamed), a calling's swing 105, 347, 106 (SwingLowPitch, SwingMediumPitch, SwingHighPitch); an archer's shot 3
  (ArrowShoot) and its hit 4; a mage's spell one of 81-85 and its hit 86; a calling hurt 299; fire 89, spikes 110,
  poison 87; and a monster's own move, bark and attack (ENEMY_BASICS `moveSound`, `barkSound`, `attackSound`).

## 3. The shape - a third game at the card table (DECIDED)

- `Tavern-Cards.md` section 7's refusal - "No card game from a menu. The table is the game" (Mac: "needing to be in a
  tavern"): The King's Gambit is played seated at a tavern's card table - either of its two (section 30 there) - as
  Hold'em and Iliac Hand are, one game a cloth. The Hold'em panel offers **Play The King's Gambit** beside Play Iliac Hand
  (`cardTableHud.js:"if (iliac) actions.push("`'s way), Iliac Hand's panel offers it too, and its own panel offers the
  other two back.
- The mod's two doors are not carried: the HUD's K key (a game anywhere, from a menu) and the tavern window's "Challenge
  the innkeeper" offer (its G key) - the table is the door.
- The opponent offline is a REGULAR in a free chair - the room's own, named, seeded, seated and voiced as at the other two
  games (`Tavern-Cards.md` sections 14 and 18) - not the innkeeper, who keeps the counter. The innkeeper's law moves to
  the regular whole: a tier by the mod's own hash and bands over the regular's seed (2.7), so each regular plays one
  tier every evening, its name and blurb said at the setup; "Care for a game of The King's Gambit?" is the regular's line.
- FACT: the interior host keeps one slot a game (`worldModes.js:"let iliacGame = null;"`, beside Hold'em's `cardGame`),
  each game opening by closing the other, and every road off the seat closing both
  (`worldModes.js:"function standFromCardTable({ cashOut = true } = {}) {"`). The King's Gambit takes a third slot, its
  half in its own module with Iliac Hand's handle (`iliacTableGame.js:"export function openIliacTableGame(d) {"`: press,
  frame, relay, draw, playing, staked, close).

## 4. What ports 1:1 - the law

THE MOD'S is ported the way the doctrine ports DFU: its logic verbatim, its constants and tables byte for byte, the
structure ours.

- THE LAW, `net/kingsGambit.js` (KG1) - pure, DOM-free, ONE HOME for the device and the relay, as `net/iliacHand.js` is:
  the board and its build, the hazards, the units and the roster, the deployment, the legal commands and their effect, a
  turn's end, the game's end, and each seat's view. A refused command answers a refusal word and changes nothing (a relay
  keeps the last good state - `net/cardLaw.js`'s way).
- THE ROSTER IS DFU's TABLE: the units read `enemyBasics.js:"export const ENEMY_BASICS = Object.freeze({"` (ONE DFU
  MEMBER, ONE EXPORT - never a second literal of the levels and the health), at float32 with RoundToInt's half to even,
  pinned deepEqual against section 2.2's table. DECIDED: the vanilla rows, never a mod's overlay. Meaner Monsters is
  applied at a foe's mint (`applyMeanerMonsters`, `characters/enemyEntity.js`), not to the table, and one roster for every
  client and the relay is what the mod's own `RosterSig` asked for - two clients whose rosters differed refused to play.
- THE DICE: the mod's `System.Random(seed)` is .NET's own stream; the port draws from the `rand32` it is handed
  (`net/dice.js` drawBelow: Rand(a, b) is a + drawBelow(b - a), NextDouble is rand32 / 2^32) - the same uniform law over
  another stream. No client must agree with the relay's stream (the relay rolls, 5.8). The ORDER of the draws is the mod's
  (BuildMap's, SpawnHazardPair's, a blow's one).
- THE INNKEEPER'S PLAY (KG2), `systems/gambitPatrons.js`: AiAction, TryEscape, AiBlunder, AutoFill, the tiers and
  TierFor's bands, verbatim. Unity's `Random.value` and `Random.Range` are the table's own source (the card table's
  crypto draw - never DFU's one stream).
- KEPT BUG FOR BUG, each pinned: the Dragonling twice in the roster (rows 34 and 40, one card, one set of numbers); the two
  kings one set of numbers; the 97% that MapIsPlayable compares at float32; AutoFill's 200 rounds; a king's potion line a
  half and every other piece's three tenths; hazards biting only the side that just moved.
- PINS: deepEqual against the mod's literals (section 2's tables), whole games played through on a fixed `rand32`, every
  number mutation-checked (A PIN MUST FAIL).

## 5. What is rebuilt on our stack - the Iliac Bay card system

### 5.1 The army is a hand of Iliac cards

- THE MOD'S recruit screen is already a grid of unit CARDS (2.10). DECIDED: those cards are the Iliac set's own painted
  faces (`render/iliacCardFaces.js`, the deck builder's tile) - each unit by the card its creature already is (FOE_CARDS:
  a Rat the Rat, the Lich the Lich, the Mage the Mages Guild Apprentice, the Sorcerer the Mages Guild Battlemage) - with
  The King's Gambit's numbers on the panel beside it (level, hp, attack, cost, reach) in place of Iliac Hand's power and
  text, which are that game's.
- FACT: nine of the roster's 46 wear no card (2.2's table): seven monsters with no FOE_CARDS row and no card in
  `net/iliacCards.js` - the Grizzly Bear, the Sabretooth Tiger, the Spider, the Slaughterfish, the Mummy, the Frost
  Daedra, the Fire Daedra - and the Archer and the Ranger, for whom FOE_CARDS names none. Q3.
- THE ARMY (Q2). DECIDED (section 10.2): the mod's roster whole - any unit, as often as 300 points buy - so every player
  sits down at once and the cards are the units' faces. NOT CHOSEN: an army only of the creature cards the binder holds,
  a card a unit (the collection the barracks). It would bend the mod's balance: the starter deck
  (`iliacCards.js:"export const STARTER_DECK = Object.freeze(["`) fields nine units worth 167 points - two Rats, two Giant
  Bats, two Mages Guild Apprentices, the Spriggan, the Centaur, the Dreugh and the Lamia.

### 5.2 The kings are the Bay's

- THE MOD'S kings are two sprites over one set of numbers (2.2). DECIDED: each side's king is one of the four crowns'
  kings in the deck of the Iliac Bay (`cardFaces.js:"export const SUIT_CROWNS = Object.freeze(["` - Gothryd of
  Daggerfall, Eadwyre of Wayrest, Camaron of Sentinel, Gortwog of Orsinium; the painted royal, the K of the crown's suit),
  with the mod's king's numbers. The player's crown is the player's choice at the setup; a regular's is the regular's
  seed's, never the player's. Q4.

### 5.3 The board is the cloth

- DECIDED: the board is laid on the table's felt. FACT: the felt is 1.42 by 0.92 m inside its rail
  (`cardTableProp.js:"export const CARD_TABLE_RAIL = 0.04;"`, with CARD_TABLE_W 1.5 and CARD_TABLE_D 1), so fifteen
  columns along the long side and thirteen rows across it fit 7.08 cm cells (a board 1.06 by 0.92 m) when the two players
  face across the table, and 6.13 cm cells when the player sits at an end. MEASURE (KG4): the cell from the chair.
- Laid square to the line between the two chairs, the player's king's row at the player's edge
  (`iliacCloth.js:"export function iliacPlaces(frame, seat0, seat1, viewer = 0) {"`'s rule - AUDIT CARDS-6 B3: a chair at
  an angle lays nothing over another's), so every client sees its own side at the foot, as the mod's mirror does.
- Its ground painted in code, in the mod's own colours: each layout's two tones in a checker (2.1); a wall a stone block a
  cell square and a few centimetres high, the mod's courses and lit top edge painted on it; a pillar a column; water a
  recessed blue with the mod's two drifting ripples; the whole a mat a few millimetres proud of the felt. THE ART IS OURS:
  no ARENA2 pixel in the board.
- Hazards: the mod's drawn effects (`DrawHazard` - what the shipped mod shows when its particles fail, and near enough
  what its blobs show when they do not): fire's base and three flickering flames, spikes' six spikes, poison's rising
  bubbles, a warning's pulsing outline and "!".
- THE PRESS IS A CELL: a press on the cloth reads the table point under it (`world/cardHand.js` tablePoint, CARDS3b) as a
  cell - the mod's OnCellClicked: select one's own piece, move to a green cell, attack a red one; the panel holds the rest.
  CARDS-TOUCH holds: a seated finger is the table's (`Tavern-Cards.md` section 31).

### 5.4 The pieces (Q1)

- DECIDED (the proposal): a piece is its unit's card standing in a stand - the Iliac plate (`render/iliacTableDraw.js`'s
  atlas and `render/cardTableDraw.js` plateModel) at a cell's size, about 4.5 by 6.3 cm on a 7 cm cell, upright on a small
  turned base in its side's colour (the mod's blue and red), its face to both players alike (a standee's two faces); the
  king's base gold and its card the crown's painted King. The mod's motion is the stand's: the walk slides it cell to cell
  at 3.5 cells a second, a blow lunges it at its foe, a hurt one shakes and flashes red, a healed one glows, a destroyed
  one topples flat onto the cloth and fades - laid down as a card is; its hp a bar on its base, red to green. Every timing
  is 2.10's. It is the card system's own picture, painted in code, and the cards lab can show and probe it without ARENA2.
- NOT CHOSEN (section 10.1): the creature's own DFU sprite as an animated miniature - the mod's look. FACT: the
  port can draw it with what it has - a billboard batch per figure (`renderer.createBillboardBatch`, `drawBillboards` in
  the interior's pass, lit by the room as every foe is), its frames uploaded off the player's own ARENA2 at runtime
  (`scenes/dataPipeline.js` uploadRecordFrame), DFU's records by facing (`characters/mobileUnit.js`), sized by
  `world/rmbFlats.js` mobileBillboardSize scaled to the cell. `Tavern-Cards.md` 6.2 bars ARENA2 art as a CARD's picture,
  not as a piece's; A RENDER OF GAME DATA IS GAME DATA bars committing it, which a runtime read never does. It is the
  mod's picture, not the card system's, and nothing here can see it without the player's ARENA2. Its module would be its
  own: the card painters' imports are pinned (`render/iliacCardFaces.js` reads only the loot's rarities and the Bay's
  faces).
- The kings follow the pieces: the cards standing, so the Bay's Kings (5.2, section 10.4).

### 5.5 The panel

- Iliac Hand's two halves (`ui/iliacTableHud.js`): a pure model, pinned, and a painter. THE SETUP: the regular (the tier's
  name and blurb), the stake's three picks (the tier's least x 1, x 2, x 5, as the purse allows), the crown; THE ARMY: the
  grid of the cards (cost; the points left of 300; the units of 12; Auto-fill, Clear; an army row to remove), the king's
  line ("Your king: ... (free) ... Protect him!"); THE TURN: two action pips, the round, three flasks, End turn, Forfeit;
  the hover's line (the mod's piece line and TileDescription); the log; the result's banner (its headline and sub, after
  1.3 s). The mod's words where they fit, verbatim.
- Not the native-window rule's: no DFU window stands behind it (`Tavern-Cards.md` section 14).

### 5.6 Sound

- The mod's clips (2.10), each by its number - and THE TRAP: `scenes/world.js` installs PEERFX1's one-shot observer, and
  `net/peerFx.js` isHurtClip reads clips 108-112 at volume exactly 1 as the player struck, told to the room. The mod plays
  its hits at volume 1 through PlayOneShot, so a verbatim port would tell every peer the player was hit at each blow on
  the cloth. DECIDED: the table's sounds are played at the table (`audio.play3d` at the cloth, as the room's other sounds
  are), never through the observed flat one-shot.

### 5.7 The stake

- Offline: real gold, the purse's (Mac's "Real gold", `Tavern-Cards.md` section 9 Q3): the tier's least x 1, x 2 or x 5,
  taken at the deal and held by the table; a win pays twice it; a loss and a forfeit - every road off the seat while a game
  is under way - leave it. The save waits while a stake is down, at both of `scenes/world.js`'s doors that already hold
  Hold'em's chips and Iliac Hand's card (`world.js:"if (modes?.iliacStaked?.()) { if (!quiet) townTalk.say("` in
  worldQuickSave, and the pause's savingPrevented); a load's road settles nothing (the save predates the deal).
- DECIDED, a departure: a regular's purse is a night's, as Hold'em's regulars' are (`Tavern-Cards.md` section 16, AUDIT
  CARDS-2 H2's book): a regular who has paid a night's purse plays for fun until tomorrow. The mod's innkeeper pays
  without end - and the Amateur, who blunders 35% of its actions, takes a bet of five times its least stake every game, so
  one table would mint gold for as long as a player sat at it. MEASURE (KG3): the purse.
- A realm character or an online page plays the regulars for fun (`Tavern-Cards.md` section 14's law: a regular's gold
  paid on the client is a faucet the realm service never sees).

### 5.8 Online - the relay runs the game

- REFUSED: the mod's link. It publishes every move through public brokers, over TLS that accepts any certificate, on
  topics any holder of a six-letter code can read; both clients run the game and each settles its own purse on its own
  word. `Tavern-Cards.md` section 7 holds: no client-dealt card online, ever - the relay deals, or nobody plays.
- DECIDED (KG5): a King's Gambit table in the relay beside Hold'em's and Iliac Hand's, its law `net/kingsGambit.js` in the
  relay's bundle (with `characters/enemyBasics.js`, 46 KB of data). A room keeps its tables at the cloth's index - one
  game a cloth, each game's sit refusing while either other game holds that index ('other game'). Two seats; each army
  told to the relay at Ready and to the other seat only when both are (the mod's ARMY at Ready); the relay builds the board
  and rolls every die from its own CSPRNG; a command is the law's (refused in words when not); the room told every event,
  so the tavern watches the board. A turn clock - the mod has none (its peer timeout 40 s) - MEASURE (KG5), Iliac Hand's 45
  s the first guess; a stand or a socket gone forfeits (the mod's FORFEIT). Friendly - no gold.
- FACT, the seams it takes (Iliac Hand's, one by one): a storage key and a `Map` a room; a `parseClient` arm named in its
  doc; a frame cap and a gate bucket of its own; the relay's version bumped - its law row, the bundle's module list, and
  the pins that name the version (`wire.js:"export const ILIAC_RELAY_MIN = 182;"` is the minimum's pattern); the client's
  send, its welcome gate and its frames in `net/online.js` and `scenes/world.js`; the alarm, the socket's close and the
  room's sweep.
- LATER (KG6, section 10.7): gold tables through the realm's escrow (CARDS6's stake orders and receipts) and a season
  board (CARDS10's, the Arena's way).

### 5.9 THE FOUR HOSTS

- `scenes/worldModes.js` (interiors): the slot, the cloth, the panel - wired at KG3. `scenes/world.js` and
  `scenes/exterior.js` mount it through `createWorldModes`; `world.js` hands it the online and save hooks (the save's
  refusal while a stake is down, the relay's frames), `exterior.js` none (its taverns' tables play offline,
  `Tavern-Cards.md` section 22). `scenes/dungeonContext.js` stands no tavern: FLAGGED by name in each slice's record.

## 6. What the record refuses

- A game from a menu or a key (the mod's K and G).
- A client-run game online, a public broker, a purse settled on a client's word.
- ARENA2 art committed or derived (A RENDER OF GAME DATA IS GAME DATA): the board and the cards are painted in code; the
  alternative's sprites, if chosen, are the player's own, read at runtime and never written down.
- Anything bought with money.

## 7. The house's rules, met in advance

- THE SLOT IS EMPTIED BEFORE THE OCCUPANT IS TOLD: the game's slot nulled before its close runs (`closeIliacGame`'s way).
- EVERY ALLOCATION HAS AN OWNER: the board's mat, its blocks, the standees' plates and the atlas made when the game opens
  and freed when it closes.
- A PIN MUST FAIL and TEST THE SHAPE THE PRODUCER MINTS: pins over the law's own states and the session's own view, never
  hand-built literals; every pin mutation-checked.
- ONE DFU MEMBER, ONE EXPORT: ENEMY_BASICS, FOE_CARDS, SUIT_CROWNS and the card painters imported, never copied.
- ASYNC NEVER DROPS: the relay's frames folded into one view, a word on its way said again (Hold'em's and Iliac Hand's
  client mirrors).
- A SLICE CLOSES ITS LEDGER ROW: each slice opens or narrows its section A row.

## 8. The slices

Each ships alone and is verifiable without the next.

| Slice | What it builds |
|---|---|
| **KG1** SHIPPED (section 11) | THE LAW: `net/kingsGambit.js` - the board and its build, hazards, units and roster, the deployment, the turn, a blow, potions, the end, a seat's view; pins deepEqual against section 2's tables, whole games on a fixed source, mutants. |
| **KG2** | THE INNKEEPER'S PLAY: `systems/gambitPatrons.js` - AiAction, TryEscape, AiBlunder, AutoFill, the tiers over a regular's seed. MEASURE: each tier against an Auto-filled 300 over seeded games. |
| **KG-SET** | The nine creatures painted into the set (section 10.3) - cards, emblems, Iliac Hand's numbers and text, FOE_CARDS rows (so their foes drop them, CARDS9), Iliac Hand's balance measured again; a relay version (the catalog is relay law). Before KG3, whose grid shows every unit's card. |
| **KG3** | THE EVENING OFFLINE: the session (the mod's clock - the 0.9 s turn's end, the 1.2 s pauses, the 1.3 s result), the host's slot, the panel (setup, army, turn, result), the stake and the regulars' night's purse; the board a flat mat with the pieces as their cards - the first playable game. The mod vendored as it ships (its manifest, its IL, a README with its provenance and the owner's word - Q6) with its registry row, its credit and its Features row: the credits' test holds a credited mod to a Features row, which only the playable game has. |
| **KG4** | THE BOARD ON THE CLOTH: walls, pillars and water built; the hazards' drawn effects; the pieces' motion; the press as a cell; the lab (`cards.html` with a King's Gambit table) and its probe; the frame cost on the phone probe, as CARDS3c measured it. |
| **KG5** | ONLINE: the relay's table (a relay version), the wire, the client's mirror, spectators, the clock; friendly. |
| **KG6** | Gold tables online (the realm's escrow) and a season board with its title (section 10.7). |

## 9. Questions for the owner (ANSWERED 2026-10-13 - section 10)

1. **The pieces.** The units' cards standing on the board (the proposal, 5.4) - or DFU's animated monster sprites as
   miniatures (the mod's look)?
2. **The army.** The mod's free roster, the cards its faces (the proposal) - or only the creature cards the binder holds?
3. **The nine with no card.** Paint them into the set (KG-SET, the proposal) - or leave them out of the roster?
4. **The kings.** The Bay's four crowned kings (the proposal) - or the mod's Knight and Barbarian?
5. **The opponent.** A regular in a free chair, the innkeeper's tiers moved to the regulars (the proposal) - or the
   innkeeper at the table?
6. **The mod's author and permission.** The bundle names no author and carries no licence; the registry records the
   owner's word for a mod handed over, as it did for the environment mods, and the author's own when it comes.

## 10. THE DECISIONS (2026-10-13)

The owner, answering section 9: **"Make the best and most detailed decisions. We also have permission"**. Every DECIDED
of sections 3-8 binds the slices as written. Section 9's six are answered here, each with its reasons, and so is every
point the record had left open. A number marked MEASURE is the first guess its slice measures before it ships.

### 10.1 The pieces - THE CARDS STANDING (Q1)

- WHY: the ask was the card system, and a standing card is that system's own piece. THE ART IS OURS holds without an
  exception: no ARENA2 pixel reaches the board, and the cards lab can show and probe every piece in CI, which no piece
  read off the player's ARENA2 allows. It uses the plate, the atlas and drawMesh, whose frame cost on a phone CARDS3c
  already measured. The mod's motion carries over to a stand whole (below). The sprites stay what 5.4 records - feasible,
  and not chosen.
- THE PLATE: the Iliac card's own (`render/cardTableDraw.js` plateModel over the Iliac atlas), scaled to its cell - 0.64
  of a cell wide (4.5 cm on a 7.08 cm cell) at the card's own 63:88 shape (6.3 cm high) - with the face painted on BOTH
  sides, as a standee is: every face is read from both chairs.
- THE STAND: a turned disc 0.84 of a cell across and 6 mm high, in its side's colour - the host's (the player's,
  offline) the mod's blue (0.20, 0.45, 0.95), the guest's the mod's red (0.90, 0.20, 0.20); a king's disc gold (1.00,
  0.84, 0.20), ringed in its side's colour. The card stands upright in a slot across the disc's middle, square to the
  board's rows.
- ITS HEALTH: a bar over the card's top edge, the mod's (a 0.7 black underlay, the fill red to green by hp over max),
  turned to the viewer.
- SELECTED: the disc's rim lit yellow (the mod's 3 px outline); the selected card lifts 1 cm.
- ITS MOTION, at 2.10's timings: the walk slides the stand cell to cell along the path the move took (each step's cell in
  turn - never a straight line through a wall) at 3.5 cells a second; a blow tips it toward its foe and back (the 0.28 s
  lunge, 0.3 of a cell for a melee blow and 0.12 for a shot); a hurt card shakes 0.45 s (the mod's jitter, scaled to the
  cell) and its face flashes red; a potion's 0.6 s glow is green; a destroyed card topples flat away from its attacker
  0.27 s after the blow lands, then slides to its owner's FALLEN PILE beside the board (the Hold'em muck's way) - the
  mod's 0.6 s fade becomes the fall and the slide, and the piles count the losses at a glance.
- THE MUSTER: the armies come onto the board as cards are dealt - the king first, then every unit in the deployment's own
  order (2.4) - each thrown from its owner's edge onto its cell (Iliac Hand's throw, `ILIAC_THROW_S`) and stood up in its
  stand. MEASURE (KG4): the beat between throws, first guess 0.12 s.

### 10.2 The army - THE MOD'S ROSTER WHOLE (Q2)

- WHY: the mod's balance is its roster's - its tiers field 220, 300, 360 and 450 points against the player's 300 from the
  same 46 units. A new character sits down at once (the starter deck's own principle, `Tavern-Cards.md` 6.3). Two seats
  online meet on equal armies; a binder army would make a collection a strength at a table that plays for gold. The
  collection already has its game in Iliac Hand; here its cards are the units' faces.
- THE GRID: all 46 units as their cards, in the mod's order (cost, then name; the two Dragonlings by id - the mod left
  their order to .NET's unstable sort), each tile the card's face with the unit's numbers under it - level, hp, attack,
  "Ranged" - and its cost in gold, or red and dimmed past the points or at 12 units (the mod's DrawCard).

### 10.3 The nine - PAINTED INTO THE SET (Q3; KG-SET, before KG3)

- WHY: the mod's roster stays whole, no unit dropped. Every textured monster of DFU then wears a card (the Horse has no
  texture and no unit). Seven foes that dropped no card drop their own (CARDS9's "a rat drops a rat", completed), and the
  Archer and the Ranger drop theirs.
- THE NINE, as cards of the set. Each effect below is a valid record of Iliac Hand's language (`fxRefusal` answers null for
  every one), and its words are exactly what `fxText` says of it. Iliac Hand's numbers are MEASURE at KG-SET: its 3,000
  random games and the regulars' win rates are run again, and the curve (`net/iliacCards.js`'s header) is held.

  | id | card | tier | cost | power | tags | emblem | text | flavor |
  |---|---|---|---|---|---|---|---|---|
  | `grizzly-bear` | Grizzly Bear | common | 3 | 4 | beast | bear (new) | Reveal: the weakest enemy unit here loses 1 power. | The Wrothgarian passes charge one toll, and the bear collects it. |
  | `sabretooth-tiger` | Sabretooth Tiger | common | 3 | 4 | beast | cat (new) | Reveal: the strongest enemy unit here loses 1 power. | It goes for the biggest throat in the hall. |
  | `spider` | Spider | common | 2 | 2 | beast | spider (new) | Ongoing: enemy units here that cost 1 or 2 have -1 power. | The small walk into its web; the large walk through it. |
  | `slaughterfish` | Slaughterfish | common | 1 | 3 | beast, sea | fish (new) | End of turn: this loses 1 power. | Out of the water, it has one good bite in it. |
  | `mummy` | Mummy | magic | 4 | 4 | undead | mummy (new) | End of turn: your weakest undead unit here gains +1 power. | Wrapped for the long dark, and patient in it. |
  | `frost-daedra` | Frost Daedra | rare | 5 | 6 | daedra | frost | Reveal: enemy units here lose 1 power. | Where it walks, the ale freezes in the cup. |
  | `fire-daedra` | Fire Daedra | rare | 5 | 6 | daedra | fire | Reveal: the strongest enemy unit here loses 2 power. | Its blade was forged in the Deadlands, and it is burning still. |
  | `archer` | Archer | common | 2 | 2 | human, warrior | bow (new) | Reveal: the weakest enemy unit here loses 1 power. | One arrow, for the one who cannot dodge it. |
  | `ranger` | Ranger | magic | 3 | 3 | human, warrior | bow | Reveal: the strongest enemy beast unit here loses 2 power. | The wilds have one law, and the ranger keeps it. |

- THE REST OF KG-SET: six emblems painted in code (bear, cat, spider, fish, mummy, bow - `render/iliacCardFaces.js`, the
  painter's keys pinned equal to `CARD_EMBLEMS`); FOE_CARDS rows for mobile types 4, 5, 6, 11, 19, 25, 26, 141 and 142;
  the cards in the house's packs and the regulars' decks by their tags; their worth by tier (`net/cardWorthLaw.js`); and a
  relay version, because the catalog is relay law.

### 10.4 The kings - THE BAY'S FOUR (Q4)

- WHY: the pieces are cards, and the Bay deck's royals are the card system's own kings (CARDS-BAY's painted busts). The
  mod's Knight and Barbarian were two sprites over one set of numbers, so nothing of the rules moves.
- THE FOUR: Gothryd (Daggerfall), Eadwyre (Wayrest), Camaron (Sentinel), Gortwog (Orsinium) - the K of each crown's suit
  (`render/cardFaces.js` paintFace, its title `cardTitle`'s: "Gothryd, King of Daggerfall"), stood like the units on
  the gold disc. The numbers are the mod's king's: level 8, 70 hp, attack 16, melee, free.
- THE PLAYER'S CROWN: chosen at the setup from the four, and kept on the character (`gambitCrown` on the save, restored
  as one of the four or Daggerfall); Daggerfall the first time, the game's own crown.
- A REGULAR'S CROWN: their seed's (the four in the deck's suit order - Orsinium, Sentinel, Wayrest, Daggerfall - by the
  seed mod 4); when it is the player's, the next round that order.
- ONLINE: each seat brings its crown; the guest's, when it is the host's, becomes the next round the deck's order.
- THE WORDS: the mod's "Your king: <name> (free) ... Protect him!" names the king card ("Your king: Gothryd, King of
  Daggerfall (free)"); its end, "<opponent>'s king has fallen." and "Your king has fallen.", names the regular; the log
  says the fall ("Eadwyre, King of Wayrest, falls.").

### 10.5 The opponent - A REGULAR (Q5)

- WHY: the table already has its people - named, seeded, seated in their chairs and voiced (`Tavern-Cards.md` sections
  14 and 18) - and the innkeeper keeps the counter and the rooms.
- THE CHOICE IS THE DIFFICULTY: the setup lists the regulars in the table's free chairs, each with their tier's name and
  blurb, and the player picks whom to challenge. A tavern's regulars decide which tiers it offers, the same every evening:
  one regular in about fourteen is a Grandmaster (the mod's band, 93-99), so about three tables in ten with five free
  chairs seat one - "Legendary across the Iliac Bay".
- THE TIER: the mod's own hash and bands over the regular's seed (2.7; `TierFor`'s arithmetic on an int32).
- THE REGULAR'S ARMY: Auto-filled to the tier's points at each deal, from the table's own source - a fresh army every
  game, as the mod's.
- THE REGULAR'S VOICE: "Care for a game of The King's Gambit?" over their head as the setup opens (CARDS4b's bark
  layer), and a word at a win and at a loss. MEASURE (KG3): the lines.

### 10.6 Permission (Q6)

- ANSWERED (the owner, 2026-10-13): "We also have permission". Written where the registry keeps it when the mod is
  vendored (KG3): the permission cell reads "granted (the owner, 2026-10-13: "We also have permission")". The manifest
  names no author, so the README keeps the registry's placeholder for the author's own words (RECORD OPEN) until the
  owner records them, as the environment mods' do.

### 10.7 What the record had left open, decided

- THE LEAN: a battle is played from the seat leaning over the board. The seated eye moves forward over the player's own
  edge of the board and up, and pitches down until the whole board is in view; the setup, the army and the result keep the
  seat's own view. MEASURE (KG4), by the lab's probe at a desktop's and a phone's aspect - first guess: 0.30 m in from the
  table's near edge, 0.62 m over the felt, pitched 52 degrees down.
- THE STAKE: the tier's least stake x 1, x 2 and x 5 (the mod's three buttons), each disabled past the purse; a purse
  short of the least hears the mod's "He will not sit down for less than N gold. Come back with more."
- A REGULAR'S NIGHT: a regular pays out at most 15 times the tier's least stake a game day, net of what they won back -
  three wins at the highest bet: Amateur 150, Seasoned 750, Veteran 3,000, Grandmaster 15,000 - and past it plays for
  fun until tomorrow. It is a book on the character's save (`gambitPurses`), bounded as the Hold'em regulars' book is (24
  taverns, the oldest day first out). MEASURE (KG2, KG3): the bound, against the tiers' measured win rates.
- THE SAVE: refused while a stake is down, at both of `world.js`'s doors (worldQuickSave and the pause's savingPrevented).
- THE BEATS: the mod's own - 0.9 s to a turn's end, 1.2 s for the regular's pause before and between actions, 0.55 s
  between an online opponent's two actions, 1.3 s before the result's banner.
- THE CLOCK: none offline (the mod's). Online (KG5), 60 s a turn: an expired turn ends as End turn does, and three running
  stand the seat up and forfeit it (Iliac Hand's idle law). MEASURE (KG5).
- THE HIGHLIGHTS, in the mod's colours on the mat 1 mm above it: a selected piece's reach green (0.2, 0.9, 0.3, 0.45),
  its range white (1, 1, 1, 0.35) over the cells a blow or a shot reaches, its targets red (1, 0.1, 0.1, 0.35) ringed
  (1, 0.25, 0.2). Hovering any piece shows its range, as the mod's does.
- THE NUMBERS: a blow's or a bite's number rises 0.8 of a cell over 1 s above its cell (the mod's float) - a loss on the
  player's side (1, 0.35, 0.3), on the regular's (1, 0.92, 0.4), a hazard's in the hazard's colour, a potion's "+N"
  (0.4, 1, 0.5) - painted from a glyph strip in code.
- THE SHOT: four bright squares on the line from the shooter to its target over 0.3 s (the mod's trail), at a card's
  mid-height.
- THE LOG: the mod's sentences, the last 12 lines.
- THE TUTORIAL: The King's Gambit's own page in the tutorial catalogue (TUT1), shown at the first game.
- THE FEATURES ROW: "The King's Gambit" on the Gameplay tab, on by default (MO1, "All mods should be enabled by
  default"); switched off, no table offers it.
- THE CREDIT: `ui/credits.js`'s mods - The King's Gambit, its author as the owner names them, "permission granted".
- THE TABLES: offline, both of a tavern's tables play it. Online (KG5), the green table: the red one is the realm's gold
  table, which plays The King's Gambit only once KG6 brings gold.
- KG6: gold online through CARDS6's escrow at the red table, at the mod's online stakes (10, 50, 200, 1,000 and 5,000
  each), the winner's receipt carrying both stakes; and a season board the Arena's way, its Elo and its caps, whose #1
  over 10 games against 5 foes (Iliac Hand's champion's floor) wears GRANDMASTER - the mod's highest tier's name.
- THE ORDER OF THE SLICES: KG1, KG2, KG-SET, KG3, KG4, KG5, KG6 (section 8).

## 11. KG1 (2026-10-13): the law

The owner: **"Make the best and most detailed decisions. We also have permission"** - and the first slice after them.

- **THE LAW** (`net/kingsGambit.js`): pure, DOM-free and plain data, importing only `characters/enemyBasics.js`,
  `net/dice.js` and `systems/mathf.js` (Unity's RoundToInt), so the relay can carry it at KG5. Every member of section
  2's game is one of its exports:
  - the board: `buildMap` (BuildMap - its layouts `KG_LAYOUTS` and `KG_OPEN_FIELD`, RandomChunks, PlaceWallCell, SetTile,
    SpawnHazardPair), `mapIsPlayable`, `pathMap`, `tileAt`, `isPassable`, `blocksSight`;
  - the units: `makeUnit`, `KG_ROSTER`, `rosterUnit`, `KG_KINGS`;
  - the armies: `armyCost`, `armyRefusal` (ParseArmy's law), `canRecruit` (TryAdd's), `autoFill`;
  - the deployment: PlaceArmy, inside `newGambit` (BeginMatch), with `KG_CENTER_OUT`;
  - the turn: `gambitRefusal` (IsLegal), `gambitAct` (Apply and SpendAction), `reachable` (GetReachable),
    `targetInRange` (InRange), `foesInRange`, `hasLineOfSight`, `roundDiv`, `blowRoll` (Attack's roll);
  - its end: `finishTurn` (FinishTurn, ApplyHazards, HazardTick, CheckGameOver).
- **ONE HOME, AND NAMES OF ITS OWN** (AUDIT 24's gate, `test/audit24_onehome.test.js`, which the first full run of the
  tests that walk `src/` failed on five names the tree already declared): Mathf.RoundToInt is `systems/mathf.js`'s
  `roundToInt`, imported, not ported a second time. A cell's index, a blow's roll and InRange take names of their own
  (`cellIndex`, `blowRoll`, `targetInRange`) beside `render/volumetricClouds.js`'s `cellOf`, `net/gateStrike.js`'s
  `blowOf` and `net/wire.js`'s `inRange`, three different things; the [0, 1) draw (NextDouble, Random.value) is the
  module's own, unexported, as `net/gateLaw.js`'s `unit` is. The ratchet stays at 42.
- **ITS FRAME IS THE HOST'S** (section 4): side 0 the host, who moves first, at the foot; side 1 the guest, mirrored. A
  client turns the picture, never the law.
- **THE DICE**: a `rand32` handed in - Rand is drawBelow's, NextDouble rand32 / 2^32 - drawn in the mod's order. The
  source is checked: a 32-bit draw, and at most `KG_RAND_DRAWS_MAX` of them a step. A broken one deals no game and takes
  no blow ('rand').
- **EVERY STEP A NEW STATE**: `gambitAct` and `finishTurn` answer `{state, events}` or `{refused}`, and never touch the
  state they were handed (a structuredClone, cardLaw's way), so a refused or broken step changes nothing and the relay
  can keep its last good state.
- **WHAT THE PORT FOUND, KEPT AS THE MOD HAS IT**:
  - CheckGameOver's "no piece left" never decides: a side's king is one of its pieces, so its first clause, the king's
    fall, always decides first. Both clauses are kept verbatim.
  - PlaceArmy's fallback rows never fill. Twelve units fit one row (row 11 takes fifteen, row 12 fourteen beside the
    king), so a melee unit never reaches row 10 or 12, nor a ranged one row 10 or 11. Kept; the twelve-of-a-kind
    deployment pins the rows they fill.
  - MapIsPlayable's 97% at float32: no floor count a board can hold (147 to 195) brings 0.97 x floor within float32's
    reach of an integer, so float32 and float64 agree on every board. The C#'s float32 is kept anyway.
  - MakeUnit meets no half on DFU's rows (computed both ways). A blow does meet one: attack 5 at u = 0.25 is exactly 4.5
    at float32 and rounds to 4, and that is pinned.
- **Pins:** `test/kg1_law.test.js`, 18 tests: the mod's numbers; the roster's 46 rows and the kings against section 2.2's
  table, with RoundToInt's half to even; the army's law; Auto-fill on a scripted source; the Pillared hall, a sealed
  Guard rooms thrown away for a Moat and bridges, a kept Guard rooms, a Ruined keep's every chunk shape, and the Open field
  after thirty failures - each from scripted draws, its picture and its pairs; MapIsPlayable's 97% either side and the
  head's cell alone; the deployment's order; a new game's refusals and a broken source; GetReachable's order; InRange
  and HasLineOfSight's samples; a blow, its kill and its shot; potions; the turn; the turn's end (the hazards, the tick,
  the warning pair, a mirror cell under a piece, the fourteen); the end; and 250 seeded whole games between two greedy
  players, each ending lawfully. Each scripted draw is its value plus 1009 times its modulus, so a range is pinned and
  not only its value.
- **Mutants:** `tools/mutants/kg1.json`, 80, all dead. Three survived the first pass - a chunk's rows, a Guard rooms'
  doorway and a moat's bridge, each a range mutated by one. The scripted draws' offset was then a thousand times the
  modulus, and 4 and 5 divide a thousand; it is 1009 now, a prime. Four more pins were written before the run, where the
  plan found nothing to fail a mutant: the head's king cell walled off on a board otherwise 99% reached, a hazard's try
  refused only by a piece on its mirror, the game-ending blow as a turn's second action, and the source's top draw
  (0xFFFFFFFF) taken.
- **Not yet:** the innkeeper's play (KG2), the nine cards (KG-SET), the table (KG3) and everything after.
- **Ledger:** section A row THE KING'S GAMBIT.

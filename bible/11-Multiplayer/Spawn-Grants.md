# SPAWN GRANTS - the relay decides which foes may exist (GRANT0, the design record)

**Status: DESIGN RECORD, PROPOSED (2026-10-17). Nothing is built.** Section 10 holds the questions that wait on the owner.
Nothing here binds a slice until the owner answers them. Section 7 orders the slices. Each one measures before it
enforces, as the Integrity arc does.

## The words

- KPbICA, on the Discord, 2026-10-17, read against FOE-FORGE (`06-Systems/Integrity-Arc.md` section 8): **"For now I'd
  suggest to just ban people for this until we find some anti-cheat solution"**. Then, having read the code: **"Looking
  into logic it looks like there is no good solution with current state of project. You can close this exact symptom by
  reducing the amount of elites and etc, but the problem is that modified client has an ability to have an impact to the
  server ... This is bad because it's electron and it's open-source"**.
- Mac handed that on. Asked to choose between a relay referee for foe frames, making strangers' foes harmless, a plan for
  spawns the server rolls, and a written reply, Mac chose **"Plan server-rolled spawns"**. This page is that plan.

## How to read this page

| Mark | Meaning |
|---|---|
| **FACT** | Read off the code at this record's commit. Each one cites the file and the member. |
| **PROPOSED** | This record's design. It binds nothing until the owner decides (section 10). |
| **OPEN** | A question the measure or the owner answers. |

## 1. Why FOE-FORGE is not the end (FACT)

KPbICA is right about the shape of the problem. In the open world every player's client owns the foes it spawns and
streams them to the cell (`scenes/exteriorFoes.js` foesFrame). The relay fans those records out and reads none of them
(`server/src/index.js`, the `foes` and `own` arms: "the relay reads none of it"). Each reader then decides what to
believe (applyFoes). FOE-FORGE tightened what a reader believes. It cannot make a reader know the truth, because nothing
in the system knows it: the foe exists only on the machine that made it up.

What a reader does with each field of a stranger's foe record today:

| Field | The reader | Where |
|---|---|---|
| `t` species | trusts any species with art | applyFoes: `!ENEMY_BASICS[r.t]` is the only refusal |
| `l` level | takes a class foe's level exactly, up to 100 (`FOE_LEVEL_MAX`); recomputes a monster's | makeEnemyEntity `exactLevel: !!puppet` |
| `w` weapon | trusts any template up to 1023 and any material | applyPuppetRecord, createWeapon |
| `h`, `k` health | trusts them, up to 1e5 (`FOE_HEALTH_MAX`); the reader's blows go to the owner | applyPuppetRecord |
| `z` elite (x3 blows) | believes it for at most 8 of an owner's foes (`PEER_ELITE_PUPPETS_MAX`) | FOE-FORGE |
| `cp` champion (up to x1.875) | believes it, uncapped | FOE-FORGE's own open list |
| `gg` Greater Giant (x4) | believes it only on a giant, one per index | FOE-FORGE |
| `nm` and the feud fields (`rb` up to x4, `p2` x1.2) | believes them for at most 11 of an owner's foes | FOE-FORGE |
| `n` fighters (up to x1.7 on me) | trusts it, 2 to 8 | partyHit |
| the wind-up's signature bit (x2) | **believes it on any foe** | below |
| `e` heir | **takes over any foe whose record names me**, with no check that its owner is dying or leaving | applyFoes, adopt |

Found while planning, outside FOE-FORGE's record:

- **The signature bit is believed on every foe.** `applyBlowRecord` (`ai/puppetBlows.js`) gives a blow `sig.MULT` (x2)
  whenever the record's `wk` carries `WIRE_SIG` and a signature table is handed in. Both callers always hand one in
  (`exteriorFoes.js` and `dungeonContext.js`: `sig: SIG`), so the bit is never limited to revenants.
- **The dungeon's own lane trusts more than the street.** A room member's loose stands and quest foes go through
  `dungeonContext.js` applyFoeRecord. There a cast is looked up in the whole spell table
  (`spellsByIndex?.get(p.cast)`), with no check of the foe's own list, its range or a paralysis. Its `rb` and `p2` have no
  revenant cap, and each owner is allowed `LOOSE_PUPPETS_MAX` (24) loose stands (DESYNC-ZERO). Integrity-Arc section 8's
  "`dungeonContext.js` needs nothing here" misses this.

What one modified client stands at every honest reader today: 64 foes of any species, 8 of them elites, any champion
trait, class foes at level 100 holding any weapon, and blows doubled by the signature bit. That is per session. A guest
session costs nothing (`server/src/index.js` `_named`: "A GUEST IS NOT SHUT OUT"), and nothing ever happens to the
sender.

## 2. What a spawn depends on (FACT)

Every roll that decides what a foe IS, and where each input comes from:

| Roll | Where | Inputs | From the map files? |
|---|---|---|---|
| An encounter's species | `systems/encounters.js` chooseRandomEnemy | `ENCOUNTER_TABLES` (`characters/encounterTables.js`, baked from DFU's RandomEncounters.cs); the climate index; whether the spot is inside a location's rect; day or night; the player's level | **only the climate index** (`formats/mapsFile.js` getClimateIndex, CLIMATE.PAK) **and the location rect** (MAPS) |
| A camp's or a pack's members | `systems/campEncounters.js` rollGroupComposition | a seed species from the same table, then its faction-mates; `CAMP_SIZE` 3-5, `PACK_SIZE` 2-4 | the same two |
| Elite | `systems/eliteFoes.js` rollOverworldElite | `ELITE_FOE_OVERWORLD_CHANCE` (0.05), Renown 5 online, level 3, not on a location's ground | the location rect |
| Champion | `systems/champions.js` rollStreetChampion | a hash of the feet, the species and `_streetN`, **a counter local to the client** | no |
| A class foe's level | `scenes/exteriorFoes.js` spawnFoe | `effectiveLevel(playerEntity)`, the player's level or a mentor's group level | no |
| Its weapon and health | `equipEnemy`, makeEnemyEntity | the level, the career's CFG, `Math.random` | the careers' CFG |

Everything except the climate index, the location rect and the careers' numbers is code or a fact the relay already
holds under a signature. The identity token's `cl` (the judged level) and `lv` (Renown) are signed by the account service
(`net/identityToken.js`; Integrity-Arc INT7). The world minute is a pure function of wall time that both ends share
(`net/wire.js` sharedClassicMinutes). The owner's map pixel is the relay's own reading of its pose (`net/wire.js`
mapPixelOfWire).

## 3. Precedents in this tree (FACT)

- **A relay signature carried on a foes frame and checked by strangers.** Elite Gates: the hub signs an arch's call
  (`net/eliteGates/egCallSig.js` signEgCall), the opener carries it on its foes frame (`ea`), and every stranger checks it
  on their own machine (`scenes/eliteGates/egArch.js`, verifyEgCall, with a verdict cache and a cap per cell). The public
  half comes from the account service as `rk` (`/v1/eg/keys`). A grant travels the same way.
- **A table built from the map files that the relay may hold.** RAID-ROLL: the client hands over the towns table, and the
  relay keeps it only when its SHA-256 equals the operator's pin (`RAID_TOWNS_SHA256`, `net/raid/raidLaw.js`). The relay
  never holds a map file (Port-Doctrine, Non-negotiables).
- **The same roll again after an eviction.** `net/eliteGates/egDurable.js` egReceiptSeed takes an HMAC over a secret the
  room keeps and never sends, so a mint repeated after an eviction or a retry gives the same answer.
- **Every client agreeing by construction.** A dungeon's layout foes are the same on every machine: its elites are chosen
  by `pickDungeonElites` seeded with the location id, and the host's stream may only address foes in that layout
  (`dungeonContext.js` `_layoutFoes`). Bands, sea raiders, the rite's faithful, the zone's giants and the Living World's
  stands already draw from a cell, a day or the shared clock.
- **Measure first, then enforce, with the switch on the relay.** INT14's `BOSS_BODY` line enforced nothing until staff set
  it. `net/relayCfg.js` is the developers' runtime switch (`bossBody`, `egDrain`), which needs no deploy.

## 4. The design (PROPOSED)

### 4.1 One sentence

**Online, a foe that rides to another player exists only on a grant from the relay. The relay rolls everything about
the grant that needs no map file and signs it. The owner's client builds the foe from the grant's seed, and every reader
rebuilds it from the same seed and refuses a record that disagrees.** The simulation stays on the owner's machine
(Multiplayer.md, decision 2). What changes is who decides that a foe exists, and what it is.

### 4.2 A grant

The cell room holding the owner's socket mints it on the owner's ask. It is signed with the relay's receipt key
(`GATE_SIGNING_KEY`) under a prefix of its own (`spawn-grant1\n`, kept apart from receipts, calls and chat stamps). Its
fields:

| Field | What |
|---|---|
| `g` | the grant's number, the room's own counter |
| `a` | the owner's account (the token's `s`), so the grant is bound to an account and not to a socket |
| `k` | its kind (section 4.9) |
| `p` | the map pixel the relay read off the owner's pose at the mint |
| `m` | the world minute at the mint (sharedClassicMinutes): day or night is everyone's |
| `l`, `r` | the owner's signed level (`cl`) and Renown (`lv`) |
| `n` | how many foes it stands: an encounter's party, a camp's group |
| `s` | the seed, `rand32` |
| `e`, `c` | which members are elite, and each member's champion trait. The relay rolls both from `s`, with pinned copies of `ELITE_FOE_OVERWORLD_CHANCE` and the champions' rate, held equal to `systems/eliteFoes.js` and `systems/champions.js` by a test (the relay cannot import those modules: they reach the loot tables) |
| `x` | when it expires |

### 4.3 Asking

Online only, so solo play does not change. The client's own clock still decides that a spawn is due: the encounter
tick's catch-up loop, a camp's roll when a chunk loads. At that moment the client asks (`{t:'grant', k, ...}`) and stands
the group when the answer comes. That costs one round trip, and spawns stand out of view (`SPAWNER_ARMS` 10-20 m, past
the line of sight; camps at 100-150 m), so the wait is not seen. The relay answers with the grant, or with `no` and a
reason (over budget, the cell full, a pose it does not hold).

### 4.4 The dice

A granted foe's identity is drawn from `eliteRng(s)` (mulberry32, already in `systems/eliteFoes.js`) in a fixed, pinned
order, for each member in turn: the species (chooseRandomEnemy at the grant's pixel, minute and level, or the kind's own
table), the level within its band, the weapon (equipEnemy), and the health dice. Elite and champion are the grant's `e`
and `c`. Movement, targets, blow timing and every other roll stay `Math.random` and stay the owner's.

### 4.5 Carrying

Each record carries `gr`: the grant's number and the member's index. The signed grant rides in the frame's list `gs`,
once on the record's first frame and again on every full frame (the cadence the look's `ls` already rides at). A reader
checks a grant once per owner and keeps the verdict, as egArch does. A grant is about 150 bytes. A full frame of 64 foes
drawn from 8 to 16 grants carries 1.2 to 2.4 KB more, against `FOES_ROOM_BYTES_PER_S` (4 MiB a second). That figure is
for the measure to confirm.

### 4.6 What the relay holds

For each socket in the room the relay keeps the grants it minted (the budget), which member stands as which record
(`i`), and which members died. Once enforcing, it strips these records before the fan: a record with no grant; a grant
that is not this account's; a member index past `n`; a member already standing as another live record; a `z` or `cp`
that disagrees with `e` or `c`. The fan already serialises the frame again (`fanOut`), so stripping costs no extra
stringify. The law lives in a Room method of its own, never in `_message` (HOST-SPLIT; `_message` is past V8's
optimising ceiling).

**Crossing a cell.** The owner's live grants go with it: it hands them to the new cell's room
(`{t:'grant', k:'carry', gs}`), which checks the signatures (every room holds the key) and binds each one once. A grant
past its `x` is refused unless the room that holds it live has renewed it. So a spent grant replayed in another room is
bounded to the honest live count.

**The budget is measured first.** Each kind has a bucket per account per room, sized to the honest envelope that the
measure reads (section 7). There is also a ceiling on live granted hostile foes for the whole cell. FOE-FORGE refused a
room-wide count because readers would disagree (DESYNC-ZERO). That reason is gone here: the relay decides for every
reader at once, so every reader is handed the same set.

### 4.7 What readers check

Readers hold the map files, so they check what the relay cannot:

- the grant's signature (the key egArch already fetches);
- the species: chooseRandomEnemy at the grant's pixel, minute and level, drawn from the seed, must equal `t`;
- the record's first feet, within the kind's reach of the grant's pixel;
- `l`, `w` and `k` against the seed's draw; `z` and `cp` against `e` and `c`.

A reader cannot see a stranger's account (FACT: no account rides a foes frame). The account binding is therefore the
relay's job, and the reader trusts the relay for it, as it trusts the relay's stamped id for every other frame.
FOE-FORGE's caps stay underneath all of it.

### 4.8 The heir

A handover (`e`) passes the grant with the foe. The relay sees the dying owner's handover frame and binds the member to
the heir's account, and strips a record that names an heir without carrying a grant. A forged takeover then costs the
forger a grant of its own. Today, any record naming a player takes a foe over.

### 4.9 Each source's grant

| Source | Kind | Who mints | Species law | Count law |
|---|---|---|---|---|
| Random encounters (`systems/encounters.js`) | `enc` | the cell | chooseRandomEnemy from the seed | `ROAD_PARTY_MAX` (4) |
| Camps and packs (`systems/campEncounters.js`) | `camp` | the cell | rollGroupComposition from the seed | `CAMP_SIZE`, `PACK_SIZE`, plus the party's extra |
| Bounty packs (BOUNTY1) | `bounty` | the cell | the bounty's own beast | 4-8 |
| Roaming bands (TV7b), sea raiders (OW6) | none new | already a function of the cell and the shared clock (bandOf, raiderOf); the stand's elite, champion and level move onto that seed | the band's own | the band's own; OW6L's cell ledger already keeps them |
| Naval boardings | `muster` | the cell | `musterOf(shipClass)` from the seed | `MUSTER_MAX` |
| Raiding parties (RAID1-3) | `raid` | the cell, against the raid ledger it already keeps | chooseRaider from the seed | `MAX_RAID_ENEMIES` 25 and `MAX_RAID_DEFENDERS` 8 |
| The City Watch | `watch` | the cell | Knight_CityWatch (146) only; readers check a location's ground | `CELL_WATCH_PUPPETS_MAX` (10) |
| World of Daggerfall sites | `site` | the cell, one per marker spring | the marker's arms from the seed | the marker's own |
| The rite's faithful (WB12d) | none new | already gateHash of the day, which the relay checks | | |
| Deep water | `deep` | the cell | `DEPTH_AQUATIC_TABLE` from the seed | the deep's own cap |
| The Living World's stands | none new | already lwSeed; their elite moves onto it | | |
| Greater Giants | `giant` | the hub, which already holds the giants that are down (ZONE-GIANTS) | a giant | one per index, zone-wide; a call of ten as one grant of `n` 10 |
| Revenants | `rev` | the cell, keyed by the revenant's id | the revenant's own record | a character's five plus six sworn (OPEN: does the account service hold them?) |
| Loose stands, Wabbajack | `loose` | the cell | the item's own (WABBAJACK_CAREER_IDS from the seed) | a small bucket |
| Quest foes (QUEST-PARTY) | `quest` | the cell | the quest's script: party members holding the same quest check it | `QUEST_PUPPETS_MAX` (24) |
| Companions, shipmates | `ally` | the cell | the owner's word: allies fight foes, never the reader | counted |

Indoors, the interior lane's sources (quest foes, loose stands, Wabbajack, companions, the watch) take the same kinds.
A dungeon's layout stream needs no grant, because it is already right by construction. Its surplus and its own lane take
grants.

### 4.10 Later, if wanted: the relay rolls the species too

The relay could also hold the climate and location-rect slice of its own cell, handed over by a client and kept under
an operator-pinned Merkle root (RAID-ROLL's law, one root over every cell's slice). It would then roll the species
itself, and readers would only confirm. The first enforce does not need this. It is worth building if two honest
readers ever disagree on a species.

## 5. What it does not fix (the honest limit)

- **Behaviour stays the owner's.** A granted foe's movement, its target, its blows' timing and its health going down are
  its owner's word. A modified client can still make its granted foes unkillable or move them anywhere. The next laws,
  OPEN: a puppet's speed bounded by its species; a foe whose owner ignores every blow stands down at the reader.
- **At the granted rate, a cheater stands what an honest player stands.** It can still lead those foes to someone, as an
  honest player can.
- **Each account has its own budget.** The cell's ceiling bounds the total, and guests are the owner's call
  (section 10).
- **Fishing.** A client can ask for a grant, dislike the roll and never stand it. Every ask spends the budget, so its
  elites in an hour are no more than an honest player's. A grant that is never bound is counted in the measure.

## 6. What it costs (FACT, then estimates)

- **The relay:** one Ed25519 signature per grant (WebCrypto, which the relay already uses for receipts); one lookup per
  record per frame, at `FOES_MS` (200 ms) a socket; memory for a socket's live grants. Nothing in storage: the room
  secret's HMAC re-mints after an eviction.
- **The wire:** a new frame type, `grant`. A client asks only of a relay at `GRANT_RELAY_MIN` or later, the
  relayCfgSupported pattern.
- **Deploys:** every relay slice bumps `RELAY_VERSION`, and `relay-deploy.yml` then drops every connected player once.
  The switch from measuring to enforcing goes through relayCfg and needs no deploy.
- **DFU:** online, an encounter's dice come from the relay's seed instead of `Math.random`. That is a departure from
  RandomEncounters.ChooseRandomEnemy's draw, and the slice that ships it adds its bracket to Port-Ledger section A,
  row ONLINE. The tables and the law are unchanged.

## 7. The slices (PROPOSED)

| Slice | What | Ends with |
|---|---|---|
| GRANT1 | The law, pure, in a new module (`net/grantLaw.js`, proposed): the grant's shape and check, the dice order, the budget's gate, the pinned rates. Nothing calls it yet. | tests and mutants |
| GRANT2 | The relay mints grants and **measures**: for each kind, the records with a grant, without one, disagreeing with one, and the grants never bound. It strips nothing. Clients ask for encounters (the largest stream). | a relay deploy |
| GRANT3 | Readers check grants and count disagreements. They still stand everything FOE-FORGE allows. | |
| GRANT4 | Every other source takes its grant, one slice per family in section 4.9. | |
| GRANT5 | The measure is read (`tools/realmReview.mjs grants`), for seven days ("Measure 7 days, then enforce", Integrity-Arc section 3, call 2). The buckets are set from it. | the numbers |
| GRANT6 | **Enforce**: staff turn it on through relayCfg. The relay strips ungranted records, readers refuse disagreements, and FOE-FORGE's caps stay. | no deploy |
| GRANT7 | Consequence: once every source is granted, an honest client never sends an ungranted record. A sender the enforcing relay keeps stripping is struck out, and its account is opened as a case in the moderators' queue (Chat-Safety-Arc SAFE8) with the relay's counts as evidence. Never a ban by itself: SAFE5's law. | an account deploy |
| GRANT8 | Optional, section 4.10: the relay rolls the species. | |

THE FOUR HOSTS: `scenes/world.js` (the streamed exterior) asks for grants and carries them. `scenes/worldModes.js` does
the same for the interior lane. `scenes/dungeonContext.js` does the same for its own lane and its surplus; its layout
stream needs none. `scenes/exterior.js` (the fixed city) streams nothing and reads no peer, so it needs nothing. The
asks go into a module the hosts wire, never into the hosts' own functions (HOST-SPLIT).

## 8. Reader fixes that need no grants (PROPOSED, a slice of their own)

These are section 1's finds. Each is a reader's law alone, so no relay deploy is needed and nobody is dropped:

1. Believe the signature bit only on a foe stood as a revenant, at the street's readers and the dungeon's.
2. In the dungeon's own lane, check a cast against the foe's own list, its range and a paralysis, as the street does
   (puppetCastInBand); hold `rb` and `p2` to the revenants' count.
3. Hold champions (`cp`) to a count per owner, the way `PEER_ELITE_PUPPETS_MAX` holds `z`. Honest play rolls one
   champion in fourteen capped spawns.

A forged takeover (`e`) is not on this list. A reader cannot tell it from an honest one: OW6 hands a foe over from an
owner that is still playing (world.js handOverWalkedAway), so only a grant (section 4.8) can close it.

## 9. Where this page sits

- `06-Systems/Integrity-Arc.md` section 8 lists FOE-FORGE's open items. This page is the plan that closes them at the
  root. The integrity arc's principle (section 2) holds: the world is simulated on the player's machine, and what the
  client's word can BUY is decided where the client cannot reach.
- `11-Multiplayer/Multiplayer.md` decision 2 holds. The relay rolls a foe's identity, not its life.

## 10. Questions for the owner (OPEN)

1. **Guests.** A guest's grants: the same budget, a smaller one, or no hostile kinds at all? Ban evasion is a new guest
   (Chat-Safety-Arc section 11).
2. **The consequence (GRANT7).** Open a moderators' case automatically on a stream the enforcing relay keeps stripping?
   The recommendation is yes: a case, never a ban.
3. **The measure's window.** Seven days, as the integrity arc's budgets had?
4. **Section 8's reader fixes.** Build them now, in a pull request of their own, ahead of the grants? The recommendation
   is yes: they are small and drop nobody.
5. **The cell's ceiling** on live granted hostile foes, all senders together: on, at the number the measure gives?

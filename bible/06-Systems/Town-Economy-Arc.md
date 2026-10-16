# THE TOWN ECONOMY (TOWN-ECON, designed 2026-10-16)

Mac, 2026-10-16: "One thing I want to do is enhance the living world module and give every city and village a dynamic
economy system, where even players can affect the influence. Allowing players to hover over towns and see an economy
tooltip along with guild control".

Asked four things, Mac answered:

| Asked | Mac's answer |
|---|---|
| Should a town's economy move NPC shop prices? (Economy arc law 5: "NPC prices are fixed") | "Wider swings, ±25%+" |
| How do players influence a town's economy? | "Witnessed acts only" - acts the account service sees, never gold |
| What is "guild control" for a town that is not a seat? | "Show who holds the area" - the holder of the seat whose bailiwick the town is in |
| Which maps get the card? | "Held Map + Overworld" - the classic travel map keeps DFU's layout |

**Status: TE1 BUILT 2026-10-16** (the baseline, the card, the price). TE2 (the players' share, the account service) and
TE3 (the living world reads it) are designed below and not built. Every constant marked "proposed" is a starting
number and Mac's to set (section 7).

## 0. What stands, read against the code (2026-10-16)

- **Prices are per region, not per town.** DFU keeps one `PriceAdjustment` a region (`RegionData`), walked each day
  (`shopStock.js updateRegionalPrices`). Online it is ECON1's world walk (`worldTick.js worldRegionPricesOn`): a pure
  function of the world day, the same for everyone, moved by nothing a player does. Every counter in a region asks
  the same index; a counter's own quality (the block record's byte) is the only thing that differs inside one.
- **The living world is pure.** Every resident, trip, caravan and market day is computed alike on every client and
  nothing crosses the relay (`06-Systems/Living-World.md` LW0 decision 2; `06-Systems/Living-World-II.md` LW-II0
  decision 1). Its one service-decided slice is LW15, the patrons (`net/patronLaw.js`, read by both ends). Its price
  and tax talk (`livingWorld/lines.js`) is flavour; no town has economic state.
- **Guild control exists for seats alone.** A town with a Palace, and the three crowns, is a seat
  (`11-Multiplayer/Seats-Arc.md`): one player guild holds its Charter, rules with a Tithe and Edicts, and its Standing
  with the town is kept by the account service. A seat already answers a hover with its card on the Held Map and the
  Overworld (SEAT-TIP, `net/townSeatLaw.js seatTipOf`). Every other town is in some seat's bailiwick when its region
  has a seat (`bailiwickOf`, the Tithe's own rule) and says nothing of it.
- **A seat already moves its own counters.** `seatShopFactor` takes the holder's members' discount (10%, crown 15%,
  +5% while Standing is loved) and Market Day's 10% off what a counter asks, on the buyer's own client and never through
  `regionPriceAdjustment` (Seats-Arc 7.2: that index also sets quest gold). The deepest a seat goes is 0.70.
- **Online, a counter pays at most half what it asks** for the same piece (REALM P0.4, `shopStock.js
  ONLINE_SALE_SHARE`). Across regions the walk already spreads prices: measured over 4,000 world days, one day's
  dearest region asked up to 2.4 times its cheapest (521 against 1,505).

## 1. The decisions (TE0)

Taken at the design. Each is Mac's to overrule.

1. **EVERY TOWN, ONE PROSPERITY.** A town is a MAPS location of type TownCity, TownHamlet or TownVillage (`mapsFile.js
   LOCATION_TYPES` 0, 1 and 2, the set `travelFarPlaces.js TV_FAR_TYPES` and `gateSite.js GATE_TOWN_TYPES` already
   use). Each has one Prosperity, a whole number 0 to 100, 50 the middle, read as one of five bands: Destitute,
   Struggling, Steady, Thriving, Booming.
2. **THE BASELINE IS PURE; THE PLAYERS' SHARE IS THE SERVICE'S.** What the world does to a town - its size, its market
   cycle, its seat's rule, a raid at its gates - is a pure function every client computes alike (LW0 decision 2). What
   players do to it is counted by the account service and read by every client (TE2), as LW15's patrons are. TE1 and
   TE2 move no resident; when TE3 lets the living world read the band, that narrows LW0 decision 2 by one input, as
   CHAP5b's chapter sheet did, and TE3 writes it there.
3. **WITNESSED ACTS ONLY** (Mac). A player raises a town by what the service saw happen there - their footsteps in it
   (the relay's signed Watch ticks) and trade at its players' traders (the market's sales and LW15's patron sales).
   Never by gold: "Assume infinite wealth" (`06-Systems/Economy-Arc.md`) would let one fortune hold every town at the
   top. Each act is capped per account, per town, per day, and the players' share saturates (section 2).
4. **THE PRICE MOVES - AN EXCEPTION TO ECONOMY LAW 5, BOUNDED** (Mac: "Wider swings, ±25%+"). Online, a town's
   Prosperity moves what its counters ask, by up to TOWN_PRICE_SWING (0.25) each way: a Booming town asks a quarter
   less, a Destitute one a quarter more. Three bounds keep "the system will fail" contained:
   - **A counter never pays more.** What a counter pays for a sale moves only DOWN with the town (a Struggling town has
     less coin), never up, so the town economy adds no gold to any sale.
   - **The deepest price stays the seats'.** A town's discount and a seat's (members, Market Day) multiply, and the
     product never goes below 0.70, the deepest a seat already gives (TOWN_FACTOR_FLOOR).
   - **Never through `regionPriceAdjustment`.** The factor multiplies the counter's own adjustment
     (`worldModes.js shopAdjustment`), as the seat's does, so quest gold and every other reader of the region's index
     are untouched (Seats-Arc 7.2).

   Offline the town economy does not run: the one player's world prices as DFU's does.
5. **GUILD CONTROL IS SHOWN, NOT NEW** (Mac: "Show who holds the area"). A seat town's card says its Charter and holder
   as SEAT-TIP does. Every other town's card names the seat whose bailiwick it is in and the guild that holds it, or
   that the area is unheld. No town gains a Charter, an influence count or any power it lacks today.
6. **THE CARD: HELD MAP AND OVERWORLD** (Mac). One card per town: its economy, then its guild control, then (a seat)
   its Charter's own lines. The classic travel map (TRAV0I00) keeps DFU's label and no card (the native-window rule;
   EVENT-TIP's own reason).
7. **THE LIVING WORLD READS THE BAND** (TE3): the townsfolk's talk of trade and the market days follow the town's band.
   Designed, not built.

## 2. The model

**Prosperity** = clamp(0, 100, round(BASE + SIZE + CYCLE + SEAT + RAID + PLAYERS)).

| Term | What | Proposed |
|---|---|---|
| BASE | the middle | 50 |
| SIZE | the town's type | city +6, town +2, village -2 |
| CYCLE | the town's own market cycle: two waves over real (UTC) days, phased by the town's pixel, so every town rises and falls on its own and each player sees the same day | 12 x sin(day / 11 days) + 6 x sin(day / 29 days) |
| SEAT | a seat town only, online: its holder's Standing, and the Edict in force | (Standing - 50) / 5; Market Day +6, Festival +8, Open Gates +3, Levy -6, Curfew -4 |
| RAID | a raid running at the town now (`raidingParties.js raidActive`) | -15 |
| PLAYERS | TE2: the players' share, from the service | 0 to +30 (below) |

The cycle is a closed form - the day's value needs no history - so a player away a month reads what one who stayed
reads, as ECON1 does. The day is the real UTC day, not the sky's (TIME1 turns an online day each real hour, which would
move a town's prices within a sitting).

**The players' share (TE2).** Each day's witnessed acts at a town are summed by source, and the last 14 days are
weighed by DECAY (0.8) a day. The activity A = FOOT_W x footsteps + TRADE_W x sales. The share is
PLAYERS_MAX x A / (A + A_HALF): half the most at A_HALF, and a town crowded by one zerg comes no nearer the top than
PLAYERS_MAX. Proposed: FOOT_W 1, TRADE_W 4, PLAYERS_MAX 30, A_HALF 150; caps an account a town a day: 30 Watch ticks
(an hour's walking), 10 sales.

**The bands.** Destitute 0-14, Struggling 15-34, Steady 35-64, Thriving 65-84, Booming 85-100.

**The price.** For a Prosperity P:
- what a counter ASKS (Buy, Repair): x (1 - TOWN_PRICE_SWING x (P - 50) / 50), 0.75 to 1.25;
- what a counter PAYS (Sell): x (1 - TOWN_PRICE_SWING x (50 - P) / 50) below 50, else x 1 - never above 1;
- with a seat's factor: their product, never below TOWN_FACTOR_FLOOR (0.70).

## 3. TE1 - the baseline, the card and the price (BUILT 2026-10-16)

- **The law** (`net/townEconLaw.js`): pure, imported by the client today and by the service in TE2. The terms of
  section 2, the band, the two factors and the floor, and the card's lines (`townTipOf`). The players' share is an
  argument (0 until TE2 reads it).
- **The town's word** (`systems/townEcon.js`, wired by the world host): the Prosperity of a town by its map id, the
  factor a counter applies, and the card. It reads the town's location from the world's own index, the seat from the
  seat book the world already polls, and the raids from the raid state. Online only: offline it answers 1 and no card.
- **The price.** `worldModes.js shopAdjustment` asks the host's `townShopFactor` first: a Buy's or a Repair's factor
  is the town's asking factor times the seat's (`townShopFactor`, never below the floor), a Sell's the town's paying
  factor alone. Without it (a host that wires none) the seat's factor stands as SEAT1d left it.
- **The card.** The Held Map's place marks (`heldMap.js _hoverLabel`, the world sheet's `townTipAt`) and the
  Overworld's plates (`travelViewMarks.js`, `tip`) show `townTipOf`'s card for every town; a seat's lines follow the
  town's. A town card holds up to TOWN_TIP_LINES_MAX (8) lines; every other card keeps EVENT-TIP's five.

- **Pinned** in `test/townecon.test.js` (9 tests), and `node tools/mutate.mjs tools/mutants/townecon.json`: 35
  mutants, 35 dead. SEAT-TIP's seat-only card maker left `world.js` (the town's card carries a seat's lines), and its
  pins moved with it (`fb1004e_overworld`, `tv5_far_places`, `seat1d_client`; the two SEATTIP mutants re-aimed and
  dead).

The four hosts (THE FOUR HOSTS RULE): the counter's price is `worldModes.js`'s (interiors), where every shop stands -
wired. `world.js` wires the town's word and the Overworld's card. `exterior.js` and `dungeonContext.js` sell nothing at
a counter of a town - FLAGGED, not changed: a counter that opens outside an interior (LW11's caravan door, the merchant
yards) prices as it did, the yards at their own neutral index on purpose (`merchantYards.js YARD_PRICE_INDEX`).

## 4. TE2 - the players' share (designed)

- **The tally** (migration `town_econ`): `town_econ_days (px, day, src, n)` - a town's acts a day by source, `px` its
  map pixel (`py * 1000 + px`, the key the relay's receipts and the market's boards already carry: the service bundles
  no ARENA2 and cannot name a town otherwise) - and `town_econ_marks (account, px, day, src, n)`, each account's count,
  so the cap is asked in the write. Rows older than 14 days go in the hourly sweep.
- **The sources.** The Watch claim (`seatInfluence.js`) counts each verified tick at its pixel, whatever the seat; a
  trader's sale (`market.js`) counts at its board's pixel; a patron's sale (`reckonPatrons`) counts at its town.
- **The read.** `GET /v1/towns/econ` answers `{ towns: [[px, share], ...] }`, each town with a share of 1 or more,
  computed by the law and kept TOWN_ECON_KEPT_S (proposed 300 s). The client holds it as the chapter sheet is held
  (`net/chapterSheet.js`: read once a while, synchronous to its readers, stopped by an account's refusal).

## 5. TE3 - the living world reads it (designed)

The townsfolk's talk of prices and trade follows the town's band (`livingWorld/lines.js`); a Booming town holds its
market day more often and a Destitute one less (`trips.js marketDay`); the chapters' patrons of the town's halls join
the card's guild lines (`net/chapterSheet.js chapterOf`).

## 6. Not changed

- The classic travel map, and the classic skin's counters offline.
- What a counter pays never rises, and nothing a player pays in gold moves a town.
- Raid defence as a source (a raid's receipt names its region and location, not a pixel; TE2 would need the client's
  word for the pixel) - left for after TE2.

## 7. Mac's calls (open)

1. The numbers in section 2: the swing (0.25; at 0.30 a Booming town alone reaches the floor, so that is its most),
   the sizes, the cycle's waves, the seat and raid terms, and TE2's weights, caps and saturation.
2. Whether a Booming town's counters should also widen their shelves (stock), not only ask less.
3. TE2 and TE3: build them, in that order.

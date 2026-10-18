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

**Status: TE1 BUILT 2026-10-16** (the baseline, the card, the price), **AUDITED 2026-10-16** (Mac: "Lets audit
everything we have so far" - `01-Overview/audits/Audit-Town-Econ.md`: every finding, and below each fix marked AUDIT TOWN-ECON
and its id). **SEAT-LOOP and LAW-3 BUILT 2026-10-18** - Mac's five calls decided (section 7): the seat's essentials
round trip and the carry between regions closed. TE2 (the players' share, the account service) and TE3 (the living
world reads it) are designed below and not built. The constants are kept as section 2 has them (section 7.1).

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
  ONLINE_SALE_SHARE`); an essential costs half (ESSENTIALS-HALF), so buying one to sell it back breaks even, no better.
  Across regions the walk already spreads prices: over 4,000 world days from day 3,000 (the walk untilted - FACTION.TXT
  is the player's), one day's dearest region asked up to 2.4 times its cheapest; the span's extremes, on different
  days, were 521 and 1,505 (AUDIT TOWN-ECON LAW-7).

## 1. The decisions (TE0)

Taken at the design. Each is Mac's to overrule.

1. **EVERY TOWN, ONE PROSPERITY.** A town is a MAPS location of type TownCity, TownHamlet or TownVillage (`mapsFile.js
   LOCATION_TYPES` 0, 1 and 2, the set `travelFarPlaces.js TV_FAR_TYPES` and `gateSite.js GATE_TOWN_TYPES` already
   use). Each has one Prosperity, a whole number 0 to 100, 50 the middle, read as one of five bands: Destitute,
   Struggling, Steady, Thriving, Booming. Its cycle is phased by its map pixel (`townKeyOf`, `py * 1000 + px`). An
   Ether isle's place is no row of the Bay's dictionary (`world/etherPlaces.js`), so it has no economy and no card.
2. **THE BASELINE IS THE WORLD'S; THE PLAYERS' SHARE IS THE SERVICE'S.** What the world does to a town - its size, its
   market cycle, a raid at its gates - is a pure function every client computes alike (LW0 decision 2), on the relay's
   clock (AUDIT TOWN-ECON LAW-2). Its seat's rule is the seat list each client last read from the service - one list
   for everyone, read every five to fifteen minutes (`townSeatBook.js` SEAT_LIST_CACHE_MS, SEAT_RED_READ_MS) and only
   where the seats are open to the account - so two players can read a Standing or an Edict a few minutes apart, as
   SEAT1d's own Market Day already is (AUDIT TOWN-ECON CLI-4, DOC-12). What players do to a town is counted by the
   account service and read by every client (TE2), as LW15's patrons are. TE1 and TE2 move no resident; when TE3 lets
   the living world read the band, that narrows LW0 decision 2 by one input, as CHAP5b's chapter sheet did, and TE3
   writes it there.
3. **WITNESSED ACTS ONLY** (Mac). A player raises a town by what the service saw happen there - their footsteps in it
   (the relay's signed Watch ticks), trade at its players' traders (the market's sales and LW15's patron sales), and a
   raid driven from its gates. Never by gold: "Assume infinite wealth" (`06-Systems/Economy-Arc.md`) would let one
   fortune hold every town at the top. Each act is capped per account, per town, per day, and the players' share
   saturates (section 2).
4. **THE PRICE MOVES - AN EXCEPTION TO ECONOMY LAW 5, BOUNDED** (Mac: "Wider swings, ±25%+"). Online, a town's
   Prosperity moves what its counters ask, by up to TOWN_PRICE_SWING (0.25) each way: a Booming town asks a quarter
   less, a Destitute one a quarter more. Four bounds keep "the system will fail" contained:
   - **A counter never pays more, nor more than it asks.** What a counter pays for a sale (and the Mages Guild for a
     magic piece - AUDIT TOWN-ECON LAW-5) falls by the same share either side of the middle: a Struggling town has less
     coin, a Booming one is stocked. Its factor never rises above 1, and never above the town's asking factor - AUDIT
     TOWN-ECON LAW-1: as built, a Booming counter's ask fell while its pay stood, and the essentials' half turned a
     round trip of firewood into gold at 134 of 140 counters at Prosperity 51. (The factor, not every sale: MERC-SLOPE's
     own rounding can pay a gold more on a smaller cost - LAW-4 - never a loop.) SEAT-LOOP (2026-10-18, section 7.5):
     and never above what it asks THIS player - a seat's discount (its members', Market Day's) lowers both.
   - **A counter's piece never fetches more than it cost** (LAW-3, 2026-10-18, section 7.4). Online, a piece an NPC
     counter sold carries what was paid for it, and no counter pays more for it - so neither a town's discount nor the
     regions' walk pays a carrier.
   - **The deepest price stays the seats'.** A town's discount and a seat's (members, Market Day) multiply, and the
     product never goes below 0.70, the deepest a seat already gives (TOWN_FACTOR_FLOOR).
   - **Never through `regionPriceAdjustment`.** The factor multiplies the counter's own adjustment
     (`worldModes.js shopAdjustment`), as the seat's does, so quest gold and every other reader of the region's index
     are untouched (Seats-Arc 7.2).

   Offline the town economy does not run: the one player's world prices as DFU's does.
5. **GUILD CONTROL IS SHOWN, NOT NEW** (Mac: "Show who holds the area"). A seat town's card carries its own SEAT-TIP
   lines. Every other town's card names the seat whose bailiwick it is in and the guild that holds it, or that the
   area is unheld. No town gains a Charter, an influence count or any power it lacks today.
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
| CYCLE | the town's own market cycle: two waves over real (UTC) days on the relay's clock, each phased by the town's key, so every town rises and falls on its own and each player sees the same day | 12 x sin(2π(day / 11 + φ1)) + 6 x sin(2π(day / 29 + φ2)) |
| SEAT | a seat town only, online: its holder's Standing, and the Edict in force (one of the table's own names - AUDIT TOWN-ECON LAW-6) | (Standing - 50) / 5; Market Day +6, Festival +8, Open Gates +3, Levy -6, Curfew -4 |
| RAID | a raid running at the town now (`raidingParties.js raidActive`) | -15 |
| PLAYERS | TE2: the players' share, from the service | 0 to +30 (below) |

The cycle is a closed form - the day's value needs no history - so a player away a month reads what one who stayed
reads, as ECON1 does. The day is the real UTC day, not the sky's (TIME1 turns an online day each real hour, which would
move a town's prices within a sitting).

**The players' share (TE2).** Each day's witnessed acts at a town are summed by source, and the last 14 days are
weighed by DECAY (0.8) a day. The activity A = FOOT_W x footsteps + TRADE_W x sales + RAID_W x raids driven off. The
share is PLAYERS_MAX x A / (A + A_HALF): half the most at A_HALF, and a town crowded by one zerg comes no nearer the top
than PLAYERS_MAX. Proposed: FOOT_W 1, TRADE_W 4, RAID_W 20, PLAYERS_MAX 30, A_HALF 150; caps an account a town a day:
30 Watch ticks (an hour's walking), 10 sales, 1 raid.

**The bands.** Destitute 0-14, Struggling 15-34, Steady 35-64, Thriving 65-84, Booming 85-100.

**The price.** For a Prosperity P:
- what a counter ASKS (Buy, Repair): x (1 - TOWN_PRICE_SWING x (P - 50) / 50), 0.75 to 1.25;
- what a counter PAYS (Sell, SellMagic): x (1 - TOWN_PRICE_SWING x |P - 50| / 50), 0.75 to 1 - never above 1, never
  above what it asks this player (AUDIT TOWN-ECON LAW-1; SEAT-LOOP: the seat's factor in that ask);
- with a seat's factor on what it asks: their product, never below TOWN_FACTOR_FLOOR (0.70);
- and for a piece a counter sold online, never more than was paid for it (LAW-3).

## 3. TE1 - the baseline, the card and the price (BUILT 2026-10-16)

- **The law** (`net/townEconLaw.js`): pure, imported by the client today and by the service in TE2. The terms of
  section 2, the band, the two factors and the floor, and the card's lines (`townTipOf`), every word through the text
  core (`t()`, the `town.econ.*` keys, drafted in-session for every machine language - L10N4). The players' share is
  an argument (0 until TE2 reads it).
- **The town's word** (`systems/town/townEcon.js`, wired by the world host): the Prosperity of a town by its map id, the
  factor a counter applies, and the card. It reads the town's location from the world's own index, the seat from the
  seat book the world already polls, the raids from the raid state, and the day from the relay's clock (`battleNowMs`,
  AUDIT TOWN-ECON LAW-2: it read this machine's own, so a clock set by hand chose the town's day and its prices).
  Online only: offline it answers the seat's factor (1) and no card. A seat whose place has no economy keeps
  SEAT-TIP's own card on both maps, and its factor only on what a counter asks (AUDIT TOWN-ECON CLI-3).
- **The price.** `worldModes.js shopAdjustment` asks the host's `townShopFactor` first; the host hands in the seat's
  factor and the law applies it to what the counter asks alone: a Buy's or a Repair's factor is the town's asking
  factor times the seat's (never below the floor), a Sell's or a SellMagic's the town's paying factor alone. Without
  it (a host that wires none) the seat's factor stands as SEAT1d left it.
- **The card.** The Held Map's place marks (`heldMap.js _hoverLabel`, the world sheet's `townTipAt`) and the
  Overworld's plates (`travelViewMarks.js`, `tip`) show `townTipOf`'s card for every town: the economy out of 100 and
  the market's trend (AUDIT TOWN-ECON UI-3: yesterday is read on today's seat and raid, so the trend is the market
  cycle's, and the card says "Market rising."), the prices as shares of the region's usual prices - what everyone is
  asked, Market Day in it (UI-4), one rounding for both numbers (UI-7) - the strongest reason, then the guild's lines.
  A held seat's card leaves out its Charter line, its holder line naming the guild again (UI-1), so a town card holds
  up to TOWN_TIP_LINES_MAX (7) lines, and `.hmtip` is bounded in height as CARD-FIT bounded it in width (UI-1: the
  eight-line card ran 36 px past a 640x360 landscape phone). The area's line is worded in the player's language round
  the town's (or the crown's kingdom's) name and the guild's own (UI-2); a seat's own SEAT-TIP lines stay the seats'
  English. The Held Map asks a showing card again at its poll, so a still pointer follows a new Standing or Edict
  (UI-6). Every other card keeps EVENT-TIP's five lines. On the Held Map a raided town answers with the raid's card
  (EVENT-TIP stands first under the pointer); its own card, naming the raid, is the Overworld's (UI-5, decided).

- **Pinned** in `test/systems/townecon.test.js` (10 tests), and `node tools/mutate.mjs tools/mutants/townecon.json`: 54
  mutants, 54 dead (each audit fix's `TOWNECON-AUDIT-<id>`). SEAT-TIP's seat-only card maker left `world.js` (the
  town's card carries a seat's lines), and its pins moved with it (`fb1004e_overworld`, `tv5_far_places`; the two
  SEATTIP mutants re-aimed and dead); SEAT1d's own pin on `shopAdjustment`'s factor line moved with that line
  (`seat1d_client`).

The four hosts (THE FOUR HOSTS RULE): the counter's price is `worldModes.js`'s (interiors), where every shop stands -
wired. `world.js` wires the town's word and the Overworld's card. `dungeonContext.js` opens no counter of a town (the
Identify spell's window alone) - FLAGGED, not changed. `exterior.js` builds the interiors' modes too, as the
`?exterior` development host the online door never opens, and wires neither the seat's factor nor the town's - FLAGGED,
not changed (AUDIT TOWN-ECON DOC-7). A counter that opens outside an interior (LW11's caravan door, the merchant yards,
the shipyards) prices as it did, the yards at their own neutral index on purpose (`merchantYards.js
YARD_PRICE_INDEX`).

## 4. TE2 - the players' share (designed)

AUDIT TOWN-ECON DOC-1 and DOC-2: as first written, the tally was keyed by pixel and counted every Watch tick and every
trader's sale "at its board's pixel" - but the client keeps a Watch receipt only at a seat's pixel (`townSeatBook.js`
`keepWatch`, `isSeatPixel`), a trader's stall row names its town by map id (`market_listings.vendor_map`) and no pixel,
and a patron's sale names its map id. Rewritten:

- **The key is the town's unsigned map id** - the seats', the homes', the stalls' and the patrons' own.
- **The town registry.** The service learns which town stands at a pixel, and which map id a raid's
  `region:location` names, from the clients' word, agreed: three accounts' agreeing reports confirm a row, as the seats
  are confirmed (`world_witness`, a kind of its own beside `seat`, Seats-Arc 3.2). An act at a pixel or a raid key the registry has not confirmed counts
  nothing.
- **The tally** (migration `town_econ`): `town_econ_days (map, day, src, n)` - a town's acts a day by source - and
  `town_econ_marks (account, map, day, src, n)`, each account's count, so the cap is asked in the write. Rows older
  than 14 days go in the hourly sweep.
- **The sources.**
  - Footsteps: the client keeps the Watch's receipts at EVERY town's pixel, not a seat's alone (the `keepWatch` change,
    named here), and claims them as it does; the service counts each verified tick at the registry's town for its
    pixel, whatever the seat, beside the seat's own count.
  - Trade: a trader's sale counts at its stall's `vendor_map`; a patron's sale at its `map`.
  - A raid driven off: the relay's cleanse receipt (`raidReceipt.js`, `w1`) counts at the registry's town for its
    `region:location`.
- **The read.** `GET /v1/towns/econ` answers `{ towns: [[map, share], ...] }`, each town with a share of 1 or more,
  computed by the law and kept TOWN_ECON_KEPT_S (proposed 300 s). The client holds it as the chapter sheet is held
  (`net/chapterSheet.js`: read once a while, synchronous to its readers, stopped by an account's refusal).

## 5. TE3 - the living world reads it (designed)

The townsfolk's talk of prices and trade follows the town's band (`livingWorld/lines.js`); a Booming town holds its
market day more often and a Destitute one less (`trips.js marketDay`); the chapters' patrons of the town's halls join
the card's guild lines (`net/chapterSheet.js chapterOf`).

## 6. Not changed

- The classic travel map, and the classic skin's counters offline.
- What a counter pays never rises, and nothing a player pays in gold moves a town.
- SEAT-TIP's own lines (`townSeatLaw.js seatTipOf`), worded in English for every language, as they were.
- The Overworld shows no card on a tap without movement (`travelViewHud.js` reads the pointer on a move alone) - as
  before TE1, for every card on it; the Held Map's tap shows the town's (AUDIT TOWN-ECON UI-10, not this slice's).
- A counter's shelf: Prosperity moves prices, never stock (section 7.2).

## 7. Mac's calls (decided 2026-10-18)

Mac, 2026-10-18, asked the five: build "Everything"; the carry, "Whatever is the best option"; the seat's round trip,
"Close it"; the numbers and the shelves, "Whatever is the best decision".

1. **THE NUMBERS** - kept as section 2 has them: the swing 0.25 (Mac's "±25%+"; at 0.30 a Booming town alone reaches
   the floor), the sizes, the cycle's waves, the seat and raid terms, and TE2's weights, caps and saturation. Each is
   one constant in `net/townEconLaw.js`, pinned there.
2. **THE SHELVES** - not widened. A counter's stock is DFU's, rolled by its building's quality (`shopStock.js`); a
   Booming town's shelf grown by Prosperity would let TE2's players' share, which players move, farm a town's rare
   stock. Prosperity moves prices alone.
3. **TE2 and TE3** - built, in that order (sections 4 and 5).
4. **THE CARRY BETWEEN REGIONS** (AUDIT TOWN-ECON LAW-3) - CLOSED: a counter's piece never fetches more than it cost
   (LAW-3). Of the three answers it is the one that holds whatever the numbers become: TE2's share lifts towns toward
   Booming, and a Booming town's ask is what the carry bought at, so a narrower swing would have been narrowed again
   by the players. Measured before (the best haggler, a value-1,000 blade, quality 10): a carry from the cheapest
   region's town to the dearest's paid on 136 of 4,000 world days before TE1 and on 1,752 after, its average gain from
   16 gold to 28 - and an essential (half its price online, ESSENTIALS-HALF) paid wherever the dearest region asked
   more at all. Online, a counter's Buy marks each piece with its share of the lot's price (`systems/tradeModes.js`
   markCounterBought: each piece's own ask at one counter, floored a piece - `counterPaid`, `net/patronLaw.js`
   COUNTER_PAID_MARK, beside AUDIT LW-II-2's `counterBought`), kept through the save, the item law, the wire and a
   stack's merge (the lower of two) and split; a sale's walk tallies those pieces (`tradeCost`'s `resale`) and
   `getTradePrice` pays them at most what was paid, the rest of the lot haggled on its own and the whole lot's price
   never passed. Every sale price hands the tally on: the classic window's offer, the enhanced window's quote, offer
   and quick sale, the keyed shelf (`worldModes.js` sellPrice). A piece found, crafted, rewarded or bought before this
   carries no price and sells as it did. Pinned through the real trade walk: a blade, a Daedric dai-katana, five
   firewood and a potion bought at index 500 in a Booming town and sold at 2,500 in a Steady one, every shop quality
   both ends, never pay (they did without the cap).
5. **THE ESSENTIALS' ROUND TRIP AT A SEAT TOWN** (found by the audit; SEAT1d's, live before TE1) - CLOSED (SEAT-LOOP):
   what a counter pays falls with what it asks this player (`townEconLaw.js` townShopFactor: the sale's factor never
   above the ask's, the seat's folded in; `systems/town/townEcon.js` shopFactor: where the seat's place has no economy,
   or offline, the seat's factor bounds the sale too). Before, a seat's discount lowered what its counters asked its
   holder's members, and Market Day what they asked everyone, while what they paid stood: five firewood at a
   quality-10 counter at the region's index cost 13 and sold for 15 on Market Day. Pinned through the real trade walk at
   every seat factor (Market Day's 0.90 for anyone, a member's 0.90 and 0.80 on Market Day, a crown's member 0.85, a
   loved member on Market Day 0.75, the deepest 0.70), Prosperity,
   quality and region index.

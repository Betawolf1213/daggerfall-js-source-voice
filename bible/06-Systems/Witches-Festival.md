# The Witches' Festival (WITCH1)

THE PORT'S OWN (2026-10-20), the first live event. Asked: *"With Halloween on the horizon. I think its fair to develop our
first live event. Daggerfall lore style"* - a thing a home's owner sets outside to give treats from, a new treat that foes
and activities drop, a vendor outside every tavern with seasonal wares (an armor set, a weapon, a title, an aura, a
profile icon, cards), every town decorated in its own way, running until a week after Halloween.

Daggerfall keeps the day itself: the 13th of Frostfall, "known throughout Tamriel as the Witches' Festival when the forces
of sorcery and religion clash" (TEXT.RSC 8392, holiday 43), and Tales and Tallows on the 3rd of Hearth Fire, when "the
dead do walk tonight" (8387, holiday 38). DFU has holidays and no live events: everything here is Ledger A (THE WITCHES'
FESTIVAL).

## The days

- **20 October to 7 November 2026**, on the real calendar (UTC) - `src/net/festivalLaw.js` `FESTIVALS`, a row a year.
  Outside them nothing is found or sold; a bowl's cakes can still be taken in, and every count is kept.
- **The nights the dead walk** - the sky's 13 Frostfall and 3 Hearth Fire (`FESTIVAL_NIGHTS`): every find gives twice.
  The chat says so once a night.
- The economy is online and a registered account's (a guest's cakes would be a cleared browser's to lose). The towns'
  dressing and the Wyrd Sisters stand by the device's calendar, online or not.
- `FESTIVAL_OPEN` in `server-account/wrangler.toml` (`off`, `dev`, `on`) shuts the service's half whole.

## Soul Cakes

The festival's treat and its coin. THE ACCOUNT SERVICE HOLDS THE COUNT (`players.fest_cakes`), as it holds a Weir Key's
(`systems/eliteGates/weirKey.js`'s model): the pack's Soul Cakes are its face, restacked on every answer
(`systems/festival/soulCake.js` `restackSoulCakes`). Bound, stacked, worth nothing to a shop (template 2000;
ITEM_LAW_VERSION 8).

A FIND is asked by its source and decided by the service's own die (`server-account/src/festival.js` `findFestival`):

| Source | Chance | Cakes |
|---|---|---|
| a foe (`foe`) | 25% | 1 |
| the dead, the summoned (`undead`, `daedra`) | 50% | 1 |
| an elite foe or a champion (`elite`) | 100% | 2 |
| gathering, making, the loot's laws (`gather`, `make`, `loot`) | 20-30% | 1 |
| a tavern game won (`tavern`), a world event, a quest done, a bounty paid (`world`) | 100% | 2 |
| the sea (`sea`) | 50% | 2 |
| the endgame (`endgame`: a breach closed, a Redoubt, the Serpent...) | 100% | 4 |

A kill's find is thrown onto the body (taken up with its loot); an act's lands in the pack. A day takes at most
`FIND_ASKS_PER_DAY` (1,500) asks and `FIND_CAKES_PER_DAY` (120) cakes - a forged client finds no more than an honest one
who played all day. Acts are `systems/questlines/qlActs.js`'s, heard through `hearActs`; a kill is
`scenes/corpseMarker.js`'s death handler (my own kill alone, never the watch or an ally).

## The Wyrd Sister

A witch of the Glenmoril Wyrd stands at every tavern's door (FLATS.CFG's "mysterious woman", 179.2 - the covens' own,
dressed), named by her office. A press opens her window (`ui/wyrdWindow.js`, the Broker's house): the cakes held, the
festival's last day, and four parts.

| Part | Ware | Cakes |
|---|---|---|
| Insignia | the **Witchwarden** title | 60 |
| | the **Witchfire** aura (green fire, seven tallow candles) | 150 |
| | profile icons: **Tallow Skull**, **Twin Moons**, **Wyrd Cauldron** | 40 each |
| | the **Hearthkeeper** title - earned, 25 cakes given from your offerings | - |
| | the **Soul Cake** icon - earned, 10 cakes taken from others' offerings | - |
| The Wyrd's Raiment | eight armour pieces | 40 (the cuirass 50) |
| | **The Witchmoon Athame**, its weapon | 60 |
| The Iliac Hand | Warlock, Thaumaturge, Glenmoril Witch, Demonologist, Tales and Tallows | 20 each |
| | **King Lysandus' Spectre** (Legendary) | 45 |
| Hearth Offering | the bowl to set out at a home's door | 5 |

Insignia are the account's, bought once and kept, worn from the window or the account card. A sale is one guarded
UPDATE under the client's request id (`fest_sales`): asked twice it is one sale, and a lost answer is asked again at the
next refresh (`WitchesFestival` on the save) and minted once.

### A profile icon

A new kind of wardrobe piece: a picture worn in the portrait in place of the character's face - the menu's corner mark,
the account card and another player's Inspect card (`ui/profileIcons.js`, drawn in code). Signed into the token as `pi`
(`net/identityToken.js` `ICONS`), so no client can claim one it does not hold; the relay carries it to the room.

### The Wyrd's Raiment

An Aetheric set of nine (`systems/aetheric.js` `WYRD_SET_PIECES`, Elven, Legendary at least) - hood, mantles, cuirass,
gloves, greaves, boots, the Hearth-Ward shield and the Athame. Never a drop.

- **2 - Wyrd-Sight:** +2-6 Willpower, +5-15% magic resistance.
- **4 - Tallow-Ward:** +10-30% weapon damage to the undead, the Daedra and the atronachs.
- **6 - Soul Harvest:** a kill heals 8-20% of health and magicka, then rests 40-20 seconds.

### The cards

Six festival cards (`net/iliac/iliacCards.js`), never in a pack or a drop: the Warlock (reveal: +1 magicka next turn),
the Thaumaturge (ongoing: your mages here +1 power), the Glenmoril Witch (rare; reveal: the weakest enemy here becomes a
Rat), the Demonologist (rare; reveal: two Imps), Tales and Tallows (a spell: a Ghost here) and King Lysandus' Spectre
(legendary; reveal: enemy units lose 1 power). Two new emblems, the witch and the candle.

## Hearth Offerings

The owner's treat bowl. **Set out:** use a Hearth Offering standing at the door of a home the playing character owns (never
a guild's hall). **Fill:** up to 10 cakes from your count a press, at most 60 in the bowl. **Take:** anyone else takes one
cake an offering a day - never from their own account's. **Take in:** any time, even after the festival; the bowl's cakes
come back.

The town underfoot is asked for its offerings every 30 seconds and after every move (`scenes/witchesHost.js`); each stands
at its door where the build kept its spot clear (`world/witchesDecor.js` `homes`), its tallow lantern lit at dusk with the
town's. One whose home its character no longer owns stands nowhere, and its cakes go back to its account.

Every move is one `db.batch` whose first statement decides it against the rows as they stand
(`server-account/src/festival.js`).

## The towns dressed

Each town in its own people's way (`world/witchesDecor.js` `WITCH_KITS`, by the town's climate, else its region's people):

| Kit | Where | At the tavern's door | Beside it | Temples | Houses |
|---|---|---|---|---|---|
| Breton | High Rock | turnip lanterns | a straw effigy between turnips | standing candles | turnips, skull candles |
| Redguard | Hammerfell, the deserts | standing candles | a bowl of fire, skull candles | pole torches | standing candles |
| Highland | the mountains | pole torches | a bonfire, an effigy, a horned skull | pole torches | skulls on stakes, turnips |
| Fen | swamps, rainforest, subtropics | ward-staves | a bowl of fire between ward-staves | standing candles | ward-staves, skull candles |
| Haunted | the Haunted Woodlands | skull candles | an effigy, a pile of skulls, a skull on a stake | standing candles | turnips, skulls, ribcages |

Daggerfall's own flats (TEXTURE.210's lights, 100's bones) beside three painted for the festival
(`world/festivalArt.js`: the turnip lantern, the straw effigy, the ward-staff). A house's step piece is chosen by its town
and its key - the same houses on every machine. A spot is taken only where no wall stands between it and the door and a
pace from every flat and person the town already stands. The pieces are logged with the block's own flats
(`scenes/pixelBuild.js`): they batch, stand solid, light the street at night (a fire is a hearth) and keep through a
season's re-skin.

## The four hosts

`scenes/world.js` WIRED (`createWitchesHost`: its frame, the offerings' targets and names; the Soul Harvest's sound);
`scenes/worldModes.js` WIRED (the street's ray: a Wyrd Sister's press, an offering's); `scenes/exterior.js` stands none (the
?exterior bench builds its own street and runs no account service: no festival there); `scenes/dungeonContext.js` stands
no street (a dungeon's kills and acts find as anywhere).

## Files

- Law, both ends: `src/net/festivalLaw.js`; holidays `src/systems/holidayTables.js` (a leaf, out of `holidays.js`).
- Service: `server-account/src/festival.js`, `server-account/migrations/0134_festival.sql`; the wardrobe in
  `server-account/src/titles.js`; routes `/v1/festival/*`, `/v1/account/icon`.
- Client: `src/systems/festival/` (`festivalClient.js` the finds, the sales, the wearing, the moves; `soulCake.js` the two
  items; `festivalWords.js` every word; `festivalFoes.js`; `festivalRows.js`).
- Streets: `src/scenes/witchesHost.js`, `src/world/witchesDecor.js`, `src/world/festivalArt.js`.
- Window: `src/ui/wyrdDoor.js`, `src/ui/wyrdWindow.js`; icons `src/ui/profileIcons.js`; the aura in
  `src/render/auraRing.js` (`witchfire`).
- Versions: RELAY_VERSION world231, ACCOUNT_VERSION acct162.

Tests: `test/systems/festival/` and `test/server/witch1_festival.test.js`.

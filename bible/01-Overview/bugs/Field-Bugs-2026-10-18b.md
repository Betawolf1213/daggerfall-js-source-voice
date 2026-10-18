# FIELD BUGS 2026-10-18b - seven threads from the bug-reports channel, the day's second batch

Seven more threads from the Discord's #bug-reports, handed over as screenshots after FIELD BUGS 2026-10-18 merged (pull
request #1012), under the same order: "No band aid fixes". Read on main at `138604baa` (#1012's merge). Each thread was
traced by a lane of its own on the real modules; a fix lands only where the cause is proven, and where it is not, the
record says so and what would prove it. The pins are `fb1018b_*`, the mutants `tools/mutants/fb1018b_*.json`.

| | Report | What it was | Done |
|---|---|---|---|
| T1 | SuperDaddy, "Leaping effect on store bought magic items": "Says it enhances dragonish, but appears on things you can't equip like wands ... Same case with magic items for sale that have the suffix "Venom spitting" but cast levitation" | The two names are crossed: Leaping casts Levitate and Venom Spitting enhances Dragonish (the language skill), both classic's own MAGIC.DEF. The defect is the base: a power that works only worn was drawn onto a base no slot takes | fixed (HELD-BASE); Leaping's and Venom Spitting's powers are the owner's call |
| T2 | cmagoun, "Minor: Spellbook -- Clicking a spell returns you to the top of a spell list" (BioGud: "same with magic items salvaging") | The enhanced book drew every press from nothing, past the house's one repaint, and its list and page shared one scroll; the Chronicle the same. Every salvage window checked keeps its place | fixed (SPELL-SCROLL); the salvage case not reproduced |
| T3 | Jigglehimmer, "Night Mothers Embrace Legendary does not function": "Imprint: Sweet Mother's Kiss (of The Night Mother's Embrace) - +50% to foes under 25%" | It works on an ordinary foe and always did. On every body the relay runs (the Warden, an Elite Breach's foes, the Remnant, the serpent) the stand-in's placeholder health read as whole | fixed (RELAY-SHARE); where the player tried it is not known |
| T4 | Aspidichelon, "Usable items hotkeys do not function in dungeons": "1-9 works outside, but not in dungeons" | The hotbar takes the digits ahead of every window unless the HUD's last frame said paused; underground no frame says so while a window stands | fixed (DUNGEON-DIGITS) |
| T5 | Low_Poly_Gaming, "Weir Key Generated Elite Breach bugs": imps that won't die, a vampiric heal off them; a gate's keeper unseen while its AOE showed | The imps are a span's Harriers, which the relay refuses to be struck from a platform (by design); the screen showed the blow and healed off a stand-in nothing empties | fixed (TURNED-BLOW, VAMPIRIC-WARD); the unseen keeper not proven (UNSEEN-KEEPER) |
| T6 | æther, "Collection: Broken world objects": the sea north-east of Tlactrn Manor, Tunmont docks, a bush in a house wall at Penwall Derry, a rock in Ipsmoth | Two found in our own code, two not | fixed (HOUSE-BUSH, ROCK-SMEAR); the sea and the docks open |
| T7 | CC/Astro, "Smithing stuck at 50": "literally 1xp off of levelling up but everything I craft gives me 0xp" | | |

## HELD-BASE: a held power is minted on a piece a slot takes (T1)

`src/systems/loot/loot.js` (createRegularMagicItem's redraw, magicItemBase, powersNeedWearing, MAGIC_BASE_DRAWS,
repairMagicBases), `src/systems/enchantments.js` (worksUnworn), `src/systems/save/save.js` (repairItemLists).

FOUND, on the real producer over DFU's table (`test/dfuMagicItems.mjs` through readMagicDef) and the real guild shelf.
- **The report's two names are crossed.** A store's magic item takes its name, group byte, rows and uses from ONE
  MAGIC.DEF record (`shopStock.js` stockGuildMagicItems -> `loot.js` createRegularMagicItem; the pawn shelves, loot and
  quests mint through the same call). Every regular row mints its own. "Leaping %it" is Cast When Used, spell 4,
  Levitate. "%it of Venom Spitting" is Enhances Skill, param 7, Dragonish (the language skill - not an autocorrect). Both
  are classic's: DFU's first dump of MAGIC.DEF (c4fa0b1, 2017: raw words with each record's stream position) decodes to
  today's table in every kind, param, group, uses and value; DFU's fixes were names. Venom Spitting's one word, 0x070A,
  is 1802, its record's own position (the only row of 59): a slot that reads as never authored - strong evidence, not
  proof.
- **The base.** ItemBuilder.CreateRegularMagicItem (ItemBuilder.cs:555-582) draws it off the group byte alone. Group 0
  holds the religious items and the Jewellery, group 1 the Jewellery, and no slot takes a religious item or the Wand
  (`equip.js` wearableItem). Enhances Skill, Cast When Held and Absorbs Spells are read on worn pieces alone, so Venom
  Spitting landed where it could never apply 9 draws in 56, and the ten group-1 held rows 1 in 40. Over 600 days of a
  quality-10 shelf, 52 of 4,200 pieces.

FIXED. A piece whose powers need wearing (`powersNeedWearing`: live rows, none answering the Used payload,
`enchantments.js` worksUnworn) has its base drawn again in DFU's order, as DFU draws again over an Arrow, up to
MAGIC_BASE_DRAWS (64), then armour. A wearable first draw is the draw it was, and a Used cast keeps any base (a Leaping
Wand, a Silent Holy Tome). A save's such piece loads as the Amulet (`repairMagicBases` in `save.js` repairItemLists,
RARITY-WEAR's home); its name, rows, uses and price stay its own. An artifact, a quest's piece, a made Wand and a frozen
record stay as they are. A departure (`01-Overview/Port-Ledger.md` section A, HELD-BASE), the owner's to review. THE
FOUR HOSTS: none touched; every host mints through createRegularMagicItem.

OPEN, for the owner. Leaping's Levitate (4 -> 38 would be Jumping) and Venom Spitting's Dragonish are classic's data, and
changing either is a design call; no spell in SPELLS.STD spits venom. The item maker still lets a player put a held power
on a Wand, as DFU's does. The "Holy Tome of Venom Spitting" in a usable list (T4's screenshot) did not reproduce: the U
window lists only a Cast When Used piece. What would prove it: that window and the piece's "Item powers:" line or saved
`enchantments`.

Why no test saw it: `magicitems.test.js` pinned the group routing verbatim, and RARITY-WEAR's pins took "DFU's own
wands, Use a cast" on trust.

Pins: `test/systems/loot/fb1018b_heldbase.test.js` (6). Mutants: `tools/mutants/fb1018b_heldbase.json` (20, all dead).

## SPELL-SCROLL: a pick keeps the book's list where it was, and the list scrolls in its own column (T2)

`src/ui/enhanced/enhancedSpellbook.js` (drawn through the repaint; the page names its spell), `src/ui/enhanced/enhancedStyle.js`
(the book's two columns), `src/ui/domRepaint.js` (`data-scroll-key`), `src/ui/enhanced/enhancedChronicle.js` (the same).

FOUND. Reproduced in Chromium on the real modules and sheets (`tools/spellScrollProbe.mjs`): forty Spell Maker spells, the
list at 600 px, a mouse click on Spell 15 - the list at 0, Spell 01 lit under the pointer. Two defects together:
- **The book wrote its repaint straight.** Every press drew the window from nothing (`host.innerHTML = ''`), past
  `ui/domRepaint.js`, the house's one repaint ("A REPAINT MUST NOT MOVE THE PAGE UNDER THE PLAYER"), so every pane stood
  at its top.
- **The list and the spell's page were one scroll.** The journal grows with its rows (`.px-journal`'s min-height: 100%),
  so the window's body scrolled; kept by the repaint alone (measured) the list stays at 600 and the picked spell's page
  and Ready stand out of view, desktop and phone (on a phone the page stood 1,991 px down, under every row).
DFU's book never moves on a pick: ListBox.MouseClick (ListBox.cs:465-504) only selects, and UpdateSelection
(DaggerfallSpellBookWindow.cs:507-512) reads the list's own ScrollIndex. The classic book keeps that
(`spellbookWindow.js:"this.selectedIndex = index;          // MouseClick"`); the fault was the enhanced skin's.

FIXED. The book draws through the repaint (`enhancedSpellbook.js:"if (host) repaintKeepingScroll(host, paint);"`); the
list and the page scroll each in their own column (`.sb-shell .px-body` holds them and scrolls neither - the grimoire
dress's book, worn plain); and a pane names what it shows (`domRepaint.js:"const key = n.getAttribute?.('data-scroll-key');"`),
so another spell's page starts at its top while the list keeps its place.

THE SIBLINGS. The Chronicle (the same bones) lost its page on every fold, remove, share, abandon and run-out deadline
(measured 900 -> 0); drawn the same way, its page named by its section
(`enhancedChronicle.js:"body.setAttribute('data-scroll-key', section);"`). BioGud's "same with magic items salvaging" is NOT
REPRODUCED: the Reforge's Salvage page keeps one scroller and replaces only its rows (measured 900 -> 900 through Salvage
and Break it), the pack's Salvage repaints through domRepaint with PX22's memo (measured holding), the Stores page's
Disenchant draws in the pause window (domRepaint). What would find it: which window (its title, a screenshot), the skin
and dress, phone or desktop.

THE FOUR HOSTS: none touched - both windows are one door's (`spellbookDoor.js`, `chronicleDoor.js`) for all four.

Found and left: the arrow keys move the pick past the list's visible rows without bringing it into view (DFU's
SelectNext nudges a row, ListBox.cs:709-741); before this the same keys threw the list to the top. The pause window's
journal pages share one scroll for rail and page, the book's old shape, for a long rail.

Why no test saw it: nothing mounted the book, scrolled its list and pressed a row, and domRepaint's behaviour was held
"not pinnable here" - but the suite's DOM keeps a node's scrollTop and starts a new node at 0, which is all it needs (the
mutation of domRepaint that records nothing, a survivor only `tools/enhancedScrollProbe.mjs` killed, now dies in the suite).

Pins: `test/ui/enhanced/fb1018b_spellscroll.test.js` (5). Mutants: `tools/mutants/fb1018b_spellscroll.json` (12, all dead).
Four tests that build their own node stand-ins gained `querySelectorAll: () => []` (journal1, questreset1, questshelfmain,
discord5), no assertion changed.

## RELAY-SHARE: Sweet Mother's Kiss reads the relay's word of a boss's health (T3)

`src/combat/healthShare.js` (new: healthShare, wordShare - the one share law), `src/world/gate/gateBoss.js` (the three
stand-ins take their owner's reader), `src/scenes/gate/gateCourt.js`, `src/scenes/gate/gateHost.js`,
`src/scenes/eliteGates/egFight.js`, `src/scenes/superDungeon/sdRemnant.js`, `src/scenes/serpentHost.js`,
`src/scenes/world.js` (the serpent's stand-in: one line changed, none added). The five readers: `lootPowers.js`,
`weaponMastery.js`, `martialPowers.js`, `arcanePowers.js`, `sigil/sigilSetPowers.js`.

FOUND, on a body the relay runs. On every other foe the power works and always did.
- **What the power is.** The Night Mother's Embrace (a Cuirass) carries Sweet Mother's Kiss: `kind: 'execute', below:
  25, pct: 50`, "Your weapon blows deal +50% damage to a foe under a quarter of its health"; a Rare takes it at the
  Reforge (`lootCodex.js` imprintPiece). It rides every weapon blow of mine, worn in any slot, never a spell, never a
  player (it sleeps in a duel and a refereed bout).
- **The law** (`lootPowers.js:"      case 'execute': if (share(target) < p.below / 100) pct += p.pct; break;"`): the share
  is the struck entity's health of its whole. An orc from makeEnemyEntity takes 8 whole and 12 under a fifth, before and
  after. But every body the relay runs is struck against a stand-in whose health is a placeholder nothing empties
  (`gateBoss.js:"e.maxHealth = e.health = 1e9;"`), and the share read it as whole: the Warden at 200 of 1000 took 8.
  Every screen holds the relay's word of the real health - the boss bar draws it - and nothing handed it to the
  stand-in. So the power never fired on the Warden, his crystals or host, the Remnant, its Echoes or Hearts, the
  serpent, or any foe of an Elite Breach.
- **The family.** Serpent's Kiss's double under half had the same defect, and so did four readers outside the loot: the
  masteries' halves, Gutting Lunge, Blood Boil and Run Them Down (AUDIT MARTIAL had KEPT Gutting Lunge's as "its share
  unread" - it was never unreadable, only never handed over). The Firmament keystone of the same name reads no health.

FIXED. `healthShare` answers an entity's own share, and for a stand-in its owner's reader of the relay's word, clamped,
or null where none is heard (a body unheard reads whole, as before). The five readers read it and keep no copy (swept).
Every owner hands its stand-ins the word: the court (his `hp` of `max`, at the blow; each crystal its Reckoning's
share), his host, an Elite Breach (each body's `hp` of `max`, refilled each frame; a struck object the share it is drawn
at), the Remnant, its Echoes and Hearts, and the serpent. RECORDED: Blood Boil's second burn has no record to land on at
a stand-in, and the arena's PvP rival has no reader (the powers sleep in a bout). Online, the relay takes the client's
number under the fight's own caps; the account service rolls no blow. Where Jigglehimmer tried it is not known: on an
ordinary foe this was not the cause, and they would settle it.

THE FOUR HOSTS: `world.js` (the serpent's line, none added). `dungeonContext.js`, where the other relay bodies are
struck, hands the formula the owner's target, which now carries its reader. `worldModes.js` and `exterior.js` stand no
relay body.

Pins: `test/systems/loot/fb1018b_relayshare.test.js` (5). Mutants: `tools/mutants/fb1018b_relayshare.json` (30, all
dead); three older records whose anchors moved were re-aimed by content (`audit_martial.json` L3F2, `audit_wb11.json`
W1, `set3.json`'s half line).

## DUNGEON-DIGITS: a dungeon window gets its digits (T4)

`src/ui/enhanced/enhancedHud.js` (hideEnhancedHud), `src/ui/hud/hud.js` (hideHudTextSurfaces).

FOUND. Reproduced in Node on the real modules (the real drawHud and enhanced HUD over a page, the hotbar's own listener,
the use-magic-item window in the dungeon's slot, `routeKey`, `useQuickslot`): under the window underground, Digit1 was
stopped by the hotbar, the list never heard it, and the bar's slot 1 (a Potion of Healing) was drunk behind the paused
game.
- **The list was never it.** `listPicker.js:"if (d) this._pick(this.scrollIndex + Number(d[1]) - 1);"` in every host, and
  a native window is handed the raw code (`input.js:"if (ctx.overlayIsNative) { ctx.overlayInput(e.code, e); return true; }"`).
- **The bar takes the digits first.** The hotbar (the default quickbar since HB-LYCFREE) listens on the window's
  capture phase, ahead of every host's ladder, takes a key whose action is one of its ten slots and stops it
  (`enhancedHotbar.js:"function onKey(e) {"`). It stands down only while the HUD's last frame said the game is paused
  (`hud.js:"paused: !!cursorActive,"`).
- **Underground no frame said so.** Both dungeon hosts return above `drawFoes` while a window pauses the game
  (`worldModes.js:"if (dungeonCtx.uiOverlayActive) { dungeonCtx.hideHudText?.();"`, `dungeon.js:"ctx.hideHudText?.(); hideWorldPlaque(); ctx.tickOverlay(dt); ctx.drawOverlay(canvas);"`),
  and `drawFoes` is their only drawHud. For the life of a window the bar kept the last frame of play's word; the
  enhanced HUD also stayed painted under every dungeon window.

FIXED. The hide door both branches already call (`dungeonContext.js:"hideHudText: () => hideHudTextSurfaces(hudText),"`)
now tells the enhanced HUD what drawHud tells it under a window (`enhancedHud.js:"export function hideEnhancedHud() {"`),
so the HUD and its bar hide and the keys - the pad's crossbar's too - belong to the window; the next frame of play gives
them back. THE FOUR HOSTS: `world.js`, `exterior.js` and worldModes' building arm draw the HUD every frame with the
game's pause; the dungeon arm's window branch already calls the door (no line added); `dungeon.js` mounts the same
context. Our own feature: DFU does not Update its HUD under a window (DaggerfallUI.cs:429-433).

Found and left: between a key that opens a window and the next frame the bar holds the last frame's word, in every
host; and a street-slot window over ?world's dungeon arm (Recall's prompt) leaves the bar its keys - not proven to meet
a window that reads digits.

Why no test saw it: the bar's pins drove `drawEnhancedHotbar` with a `paused` they chose, and the hide door's asked
about the text surfaces alone.

Pins: `test/ui/hud/fb1018b_dungeondigits.test.js` (3). Mutants: `tools/mutants/fb1018b_dungeondigits.json` (11, all dead).

## TURNED-BLOW: a blow the relay refuses is refused on the screen too (T5)

`src/net/eliteGates/egBodies.js` (egStruckOff, EG_TURNS_FL, egLordAsleep, egStrikeTurned), `src/net/eliteGates/egBrain.js`,
`src/scenes/eliteGates/egFight.js` (turnStandIn, hostHit), `src/scenes/dungeonContext.js`, `src/ui/hitNumbers.js`.

FOUND. The imps are the legion's Harriers (`egLegion.js:"Object.freeze({ id: 0, key: 'harrier'"`), which on a span follow
the company along its platforms. They are meant to die (3 s of the company's mean reference damage, 135 health at level
30 in circle 1), and did not because the relay refuses every blow struck from traversal ground (EG-ZB, section 11.7) -
and a span's platforms are traversal ground. Reproduced on the real relay: ten 40-point blows from a platform landed
nothing; from an island four killed one. The refusal is the design; the screen was the defect. It offered the Harrier,
bled it, flashed it, popped a number and sent the blow, which resolves against a stand-in nothing can empty
(`gateBoss.js:"e.maxHealth = e.health = 1e9;"`), so every heal of a landed blow answered the claim: 20 blows of a
Vampiric Effect blade with a 10% leech line healed 264 for 240 claimed, the relay landing 0. The same hole stood
wherever the relay lands nothing: a Vengeful Shade (warded from its rise), a held Ward-Bearer, a lord's ward, and a
Court lord asleep in its ring.

FIXED. One law: the relay's strike rule is `egBodies.js:"export function egStruckOff(view, b, x, y, z) {"`, called by
`egBrain.js:"if (egStruckOff(view, body, p.x, p.y, p.z)) return out;"`, and the screen asks the same rule plus the
flags the relay takes nothing through and a lord asleep (`egBodies.js:"export const egStrikeTurned = (view, b, x, y, z) =>"`).
Each frame `egFight.js:"function turnStandIn(t, b) {"` marks a target's stand-in `warded` when the relay would refuse a
blow from my feet; every heal and power already refuses a warded target, and Vampiric Effect now does too
(VAMPIRIC-WARD). Nothing is sent, nothing bleeds, the swing and the shaft ring off as off the Warden's ward, and the hit
number says "No footing" or "Warded". THE FOUR HOSTS: `dungeonContext.js` (the one door a blow on a Spire body leaves
through); `world.js`, `exterior.js` and `worldModes.js` unchanged.

RECORDED, not fixed: the heal is still the claim's wherever the relay lands only part of a blow (the purse clips it, a
Shield-Wall or Shielded front turns it, a flier is out of reach) - closing that needs the relay to tell each striker
what landed, per blow.

Pins: `test/net/eliteGates/fb1018b_turnedblow.test.js` (4). Mutants: `tools/mutants/fb1018b_turnedblow.json` (18, all
dead). Moved with the strike rule: two records in `tools/mutants/egz_legion.json`, one in `tools/mutants/wb13d.json`,
and one call site in `test/net/eliteGates/law9_height.test.js`.

## VAMPIRIC-WARD: Vampiric Effect heals what a blow deals (T5)

`src/systems/enchantments.js`. FOUND: Vampiric Effect was the only heal of a landed blow that ignored the ward - it
healed the whole claim of blows into the Warden's ward and into the Brass Remnant while shut; Gortwog's Cleaver, as the
loot maker mints it, healed every point of 20 blows into the Warden's ward. FIXED
(`enchantments.js:"if (param !== 1 || target?.warded) return null;"`): VampiricEffect.cs's own law told what the blow
dealt, not a departure. Pins: `test/systems/fb1018b_vampiricward.test.js` (2). Mutants:
`tools/mutants/fb1018b_vampiricward.json` (2, all dead).

## UNSEEN-KEEPER: the gate keeper drawn nowhere - not proven (T5)

NOT PROVEN. The real relay's fights, run through the real link into the real fight driver over a stub renderer, draw
every keeper a door waits on once its art lands - a Proving Walk's champion and escort, a Court lord, a Rampart's
Ward-Bearers - at its place, on its floor, at a size, in its own art, offered as a target (pinned). Ruled out: a stuck
vanish (a hidden lord throws no blow, and the full state every 2 s resets the flags), culling, a Morrowind body, missing
art (all 96 looks have it). What can hide one body while its attack markers (their own pass) still draw: its art never
loaded - the driver keeps a failed texture for the session, every body of that mobile stands undrawn and untargetable,
and nothing said so; it now logs once (`egFight.js:"const failed = (why) =>"`), behaviour unchanged - or an animation
frame never uploaded (a texture pack missing a record). What would prove it, from the player: could they hit it; did a
companion see it; the console then; their texture or sprite mods; the hall, the foe's card, a screenshot with the AOE.
Pins: `test/scenes/eliteGates/fb1018b_unseenkeeper.test.js` (2). Mutants: `tools/mutants/fb1018b_unseenkeeper.json` (2,
all dead).

## HOUSE-BUSH: a bush its author left under a house is not stood (T6)

`src/world/rmbFlats.js` (sceneryUnderRoof, collectBlockFlats' scenery walk).

FOUND. All four of æther's places are rebuilt by the town mods online forces on: Penwall Derry is Beautiful Cities'
`location-23-591`, Tunmont `location-23-850`, Ipsmoth Beautiful Villages' `location-36-183`, Tlactrn Manor
`location-44-27`. Penwall Derry's east gate is the composite WALLAA09.TVRNAS01 (the city wall on its west side, a tavern
block outside the gate). Its ground scenery is written whole, and cell (row 4, column 15), record 4, stands where all
four automap cells round its foot are a House2's footprint. DFU's `RMBLayout.AddNatureFlats` reads no building, so DFU
stands the bush there too, and the port did, verbatim. Across the blocks the two packs carry whole there are 26 such
cells (10 in Cities, 16 in Villages). The author removed the same class by hand elsewhere: TVRNAL01's edit sets cells
165 and 214 to -1, both on a House2.

FIXED, a departure (`01-Overview/Port-Ledger.md` section A, HOUSE-BUSH): a scenery cell whose four automap cells are all
buildings by the town map's own ladder (`townQuarters.js` quarterOf) is not stood; a cell on a footprint's edge or
corner, or on the block's rim, stands as authored. Classic blocks fall under the same law; how many of BLOCKS.BSA's
cells it takes was not measured (no ARENA2 here). THE FOUR HOSTS: `world.js` and `exterior.js` get it through
collectBlockFlats; `worldModes.js` and `dungeonContext.js` lay out no town block.

Pins: `test/world/fb1018b_housebush.test.js` (4). Mutants: `tools/mutants/fb1018b_housebush.json` (8, all dead).

## ROCK-SMEAR: the pack's rocks drawn outside in, their texture box-mapped (T6)

`src/world/townStandIns.js` (boulderMesh, boulderUv, prismZ).

FOUND. Ipsmoth's four blocks stand 16 RMB Resource Pack rocks, nine of them on water tiles (the stream along its west
side and RESIAS06's pond), each our own stand-in boulder. Its `face` took whatever normal the corners' order gave, and
40 of its 48 faces looked into the rock; MeshBuilder winds a face to look along its normal and the world pass culls back
faces, so each rock drew as the inside of its far half - a hollow grey "arch" with whatever stood behind it (the pole)
seen through it. TEMPLE-STEPS had just scaled the rocks to their prefab's 2-8x, so these were shells up to 9 m across.
Their texture used one side-view plan for every face: 25 to 75 per cent of each rock's surface stretched past four to
one, "the flat grey smear".

FIXED. Every face looks out of the boulder and is box-mapped (no face stretches past 1 : 1/√3, the rows level on the
sides). Found beside it: prismZ took its corners as counter-clockwise on trust, and both its callers hand it clockwise
lists, so the dock ramp (53143) and the steps' stringers (53144) were drawn inside out too; prismZ now winds by the
corners' own area. The collider reads no winding. THE FOUR HOSTS: as HOUSE-BUSH's. `03-World/Beautiful-Towns.md`'s two
stand-in rows corrected.

Pins: `test/world/fb1018b_rocksmear.test.js` (4). Mutants: `tools/mutants/fb1018b_rocksmear.json` (8, all dead).

## T6's other two: the sea off Tlactrn Manor - not proven; Tunmont's docks - not found

**The sea north-east of Tlactrn Manor.** Beautiful Villages lays the manor out as 3x3 farm blocks; the blocks to its
north and east are FARMBA06 (two pack rocks and a hill - ROCK-SMEAR's inside-out stand-ins) and FARMBA13 (crop fields).
Found beside it and NOT changed (WOD-SEA-TEST): World of Daggerfall's sea refusal (`LocationLoader.cs` 117-121) reads
`mapRegionIndex`, which DFU's `GetMapPixelData` fills only on a pixel that holds a location - and such a pixel has left
at step 1 - so the refusal never fires, in DFU or here, and a WoD site stands on any sea pixel its lists name (Mac's
"world of daggerfall ocean rocks", 2026-10-02). Fixing it moves rock fields the online room shares: the owner's call.
What would prove which: the reporter's map pixel; there, `wod.picksFor` and its WOODS height (2 or less is sea), and
whether Deep Waters' surface cells cover the manor's rect.

**Tunmont's docks.** Tunmont's grid has no dock blocks, so the railed pier is our own QUAYS jetty (`quayModel.js` railX).
The real planQuay and buildQuayModel on made shores of 12, 60 and 195 m face every closed part out, and the jetty and
ramp land as planned. What would find it: the reporter's position on it, the berth plans the quay pool's `standing()`
returns for Tunmont with `surfaceAt` read along the jetty, and a shot from the land end.

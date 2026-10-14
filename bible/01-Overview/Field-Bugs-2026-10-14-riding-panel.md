# FIELD BUGS 2026-10-14 - the riding panel and the horse care switch

One Discord thread from the bug-reports channel, 2026-10-14, handed over with its screenshot and read on the code as
it stands at main's `7c291d36`: "Riding Window is not able to be edited in the HUD Editor (Alt+U)" - "(also the horse
care toggle in the settings menu doesn't seem to work)". The screenshot is the HUD editor open: dashed frames, names,
corner squares and X presses on the compass, the boss bar, the target bar and the temperature plate - and the riding
panel under the compass ("Riding", Breath 100%, Hunger Fed 8h, Bond, Feed oats (16), Stable, View MOUSE4, Dismount)
with no frame at all.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | "Riding Window is not able to be edited in the HUD Editor (Alt+U)" | the saddle panel (STEED-UI, 2026-10-11) never joined HUD-MOVE's list of pieces (2026-10-01): the editor frames only what the list names | fixed (HUD-SADDLE) |
| 2 | "the horse care toggle in the settings menu doesn't seem to work" | not reproduced: off the line the switch takes effect at once at every door it governs; online the row is the room's, forced on and locked - the design | traced and pinned (HORSE-CARE-SWITCH); asked of the player |

## HUD-SADDLE: the riding panel is a HUD piece (1)

`src/ui/hudLayout.js` HUD_PIECES, ghostOf, buildGhost; `src/ui/enhancedSaddle.js` drawEnhancedSaddle,
buildSaddlePreview.

FOUND. HUD-MOVE finds every piece it moves by a selector in one list
(`hudLayout.js:"export const HUD_PIECES = Object.freeze(["`) - "ONE SEAM, NO HOST EDITS": the modules that build the
pieces tell it nothing, so a piece the list does not name is never marked, framed, moved, sized or turned off. The
saddle panel (`ui/enhancedSaddle.js`, `10-UI/Controls.md` THE SADDLE PANEL) shipped ten days after the list and was never
given a row in it. It stands in a layer of its own over the whole screen (`.saddlepanel`, pointer-blind), its bar
(`.saddlepanel-bar`) under the compass inside it. So Alt+U framed every listed piece around the panel and left the
panel as its sheet stands it: nothing could move it off the compass's foot, size it, or turn it off. The panel's own law
was never wrong; it was simply not one of the pieces.

FIXED.

- **The bar is a piece**: `hudLayout.js:"{ id: 'saddle', sel: '.saddlepanel .saddlepanel-bar'"` - "Riding panel" over
  its corner, moved by a drag, sized by its corner square, turned off and on by its X, put back by a double-click,
  saved with the rest of the layout and put back by Reset, as every piece is. The piece is the bar, not its layer - the
  layer is the whole screen. No `dummy`: the panel is built only when there is a ride to show, and a window over the HUD
  covers it as it covers the HUD.
- **Placed from its first frame**: the panel is built anew each time its rider mounts (`hideEnhancedSaddle` takes it
  down at the dismount, a door, the skin), and the editor's sweep runs on a 250 ms clock (PERF-HUD1). So the builder asks
  for a sweep the moment it puts the panel on the page, through the leaf MOVED-NOTICE built for the notice stack
  (`enhancedSaddle.js:"placeHudPieces(doc);   // HUD-SADDLE"`): a moved panel never stands a frame at the sheet's place,
  and one turned off never shows. The leaf, not `ui/hudLayout.js` itself - the editor's previews reach the gate's, the
  party's and the codex's hosts.
- **A preview while nobody rides** (HUD-PREVIEW's law, Mac: "show in unlocked mode all notification popups and everything
  else that can pop up"): `buildSaddlePreview` builds and paints the panel's own nodes - the live panel's one builder and
  one painting, split into `build` and `paintSaddle` for it - on a sample read named "Riding panel (preview)", and never
  touches the live panel's slot. On a touch device it stands at a finger's place, where the hosts' own panel does
  (`isTouchDevice`, the very question `ui/touch.js` attachTouch asks). Its stand-in is the layer and its piece the bar
  inside it, so HUD-MOVE's test for a stand-in reads a node's layer as well as the node
  (`hudLayout.js:"const ghostOf = (n) =>"`): the whole stand-in leaves when a rider mounts or the HUD is locked, and the
  next sweep never mistakes the preview's bar for a real panel.
- **A fake that lied, told the truth** (`test/invdrag.mjs`, the pack's suites' document): its selector reader took an id
  and an attribute (`#fps-counter`, `[data-hm-ghost]`) for nothing at all, so either matched every node - and the
  notice stack's builder runs HUD-MOVE's sweep, so under ghostOf the locked sweep took the whole fake page for its
  stand-ins and took it down (five of the pack's pins red; a browser was never touched by it). It reads both as a
  browser does now, and every suite on it (74 files) passes.
- **Its two words go through t()** (L10N4's ratchet - no file holds more hard-coded English than it did):
  `menu.hud.piece.saddle` and `menu.hud.preview.saddle`, drafted in-session for the 25 languages
  (`tools/l10nInSession.mjs`).

THE FOUR HOSTS. `scenes/world.js` and `scenes/exterior.js`, the hosts that ride, draw the panel only through
`scenes/saddleHost.js` createSaddleHost into `ui/enhancedSaddle.js` drawEnhancedSaddle - the one builder, and it places
itself; the sweep that frames it is started by the enhanced HUD every host draws (`ui/enhancedHud.js` tickHudLayout).
`scenes/worldModes.js` (interiors) and `scenes/dungeonContext.js` (dungeons) stand no transport - a building or a dungeon
puts the rider on foot (`systems/transport.js` dismountOnTransition) - and draw no panel: named, not wired. No host was
edited.

NOT CHANGED: the helm panel (`ui/enhancedHelm.js`, CSA-L) is the saddle panel's twin - the same whole-screen layer, its
bar at the same place under the compass - and is not in HUD_PIECES either, so a boat's helm cannot be moved or turned off
in the editor. Nobody reported it, and the sea's target card stands under its bar's foot (`scenes/world.js`, `under:
enhancedHelmBar()`), so moving it is its own slice, for Mac's word.

Pinned by `test/fb1014_ridingpanel.test.js` over a page that answers the selectors HUD-MOVE asks, descendants among them,
with the real sweep, the real panel and the real editor's key and X: a panel built at a mount stands at its saved
place and size, or off, with no sweep between; Alt+U frames it with its name and its X saves it off and on; the preview
stands while nobody rides, leaves whole for the real one and at the lock, and stands at a finger's place on a phone;
one builder, the two riding hosts through the one glue, the other two drawing none. Mutants
`tools/mutants/fb1014_ridingpanel.json` (7 of its 10: no piece, the build's placing dropped, no preview, the stand-in
read as a real panel, the preview mounted as the live one, the preview never a finger's, the X saving nothing - all dead).

## HORSE-CARE-SWITCH: the toggle traced, and found sound (2)

`src/systems/features.js` 'horse-care'; `src/systems/upkeepSwitch.js` horseCareOn; `src/systems/upkeepRuntime.js`
createUpkeep.

THE REPORT. "(also the horse care toggle in the settings menu doesn't seem to work)" - no more is said, and the
screenshot shows horse care on (Breath, Hunger, Bond and Feed oats are its).

TRACED, on every arm the toggle could fail on:

- **The key written is the key read.** The row's control
  (`features.js:"control: Object.freeze({ store: 'prefs', key: 'horseCare', initial: true, online: true }),"`) is the
  switch's own (`upkeepSwitch.js:"export const HORSE_CARE_PREF = 'horseCare';"`); the tile's press writes it
  (`ui/enhancedMenu.js` tileStates, `setPref(c.key, i === 1)`).
- **Read live, never once.** `upkeepSwitch.js:"export const horseCareOn = () =>"` reads the shelf on every call, and both
  riding hosts hand the upkeep that function itself (`world.js:"const upkeep = createUpkeep({"` and exterior.js's twin:
  `horseCare: horseCareOn`).
- **Every door asks it.** The upkeep's keep and breath (`tick`), the gallop's gate, the walk, the ride's pace, the HUD's
  breath bar, the Stable card, the saddle panel's read, and Feed and the oats' Use (`registerUpkeepUses`, `usable`).

So off the line its Off makes the horse DFU's at once, as the row's words say - one pace (the panel says Trotting), no
gallop in the saddle, no breath on the HUD, no Breath, Hunger, Bond or Feed on the panel, oats that feed nothing - and
its On gives every one of them back. The panel itself stays: it is the ride's (its title, gait and pace, Stable, View,
Dismount), not horse care's (`10-UI/Controls.md`, THE SADDLE PANEL; `06-Systems/Horse-Care.md`).

Online the row is the room's: forced on (`online: true` - every horse in a room under the one law), and the tile says
so - locked, wearing "online", its press refused, its tooltip "Always on online", its note ending "online it is always
on". A player online who presses it sees nothing change. That is the design (`06-Systems/Horse-Care.md`), not a fault
with a root to fix, and turning it into a player's choice online is Mac's call: a horse's Speed sets its pace against
every other rider's.

Two readings stand, then: the report came from online (the design), or the panel itself was what the player wanted
gone - which its X now does (HUD-SADDLE). Asked of the player. The trace is pinned by execution, so it is the suite's
claim and not this page's: the same file's fifth test drives the real tile, the real switch and the upkeep and glue as
the hosts build them, off the line (On, Off, On) and online (locked on). Mutants: the row's key, the switch read once,
the switch left to the player online (3 of the file's 10, dead).

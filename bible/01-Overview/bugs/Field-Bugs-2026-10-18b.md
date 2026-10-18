# FIELD BUGS 2026-10-18b - the Weir Key's top option

One report from Mac, read on the code as it stands at main's `138604baa`. The start window is the port's own (Elite
Gates, `11-Multiplayer/Elite-Gates.md` section 5); the list it is drawn in is DFU's DaggerfallListPickerWindow
(`ui/listPicker.js`), unchanged.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | Mac: "The top option doesnt work when using the weird key", then "Weir key"; asked, "It can be tapped" | The start window's top row is the stake (*Weir Keys: 3 - one will be staked.*), words and not a choice. Picked, DFU's picker had already closed itself, and the window did nothing: no list on the screen, and the flow still asking, so every use of the key after it answered *The Spire already asks where you begin.* until the screen let go | fixed (STAKE-ROW) |

## STAKE-ROW: a word row picked asks the list again

`src/ui/eliteGates/egStartWindow.js` openEgStartWindow's pickMain.

THE REPORT. The key used, the start window opens on its list: the stake first, the quest warning under it when a quest
falls due, then the starts, the Wager, the Rehearsal and the boards. The top row is the one DFU's picker opens
highlighted, so Enter or `1` on the first press picks it; and it can be tapped - the enhanced skin's row press replays
DFU's double click on the classic row (`ui/enhanced/enhancedPicker.js` pickRow), which picks it the same way.

FOUND. `pickMain` returned on any row that is not a start, the Wager, the Rehearsal or the boards - the stake and the
quest warning are words. But the picker it answered had already raised `done` on the pick
(`listPicker.js:"_pick(index) {"`, before `onPick`), and the host's slot drains a done window after its input
(`scenes/townTalk.js`, the exterior's, after the occupant's input; the interior's and the dungeon's slots drain the same way). The start
window still held that dead picker as its handle and was not done, so `egClient.js` kept its `startWin`: the key's next
use answered `EG_START_ASKING_TEXT` with nothing on the screen, and only the screen letting go (`away`) cleared it.
The EG-F pin passed over it because its fake list stayed open when picked - a shape the real picker never has.
Reproduced on `138604baa`: the new pins (below) drive the real ListPickerWindow in a slot shaped as townTalk's and are
red there - the slot empty, the window still asking.

CHANGED: a word row picked closes what is left of the list and asks the main list again
(`egStartWindow.js:"if (r.kind !== 'start') { shut(); showMain(); return; }"`) - the same close-then-ask the Wager's
toggles already make. Nothing is chosen or cancelled; Escape is still the cancel. The rows, their order and the
picker are unchanged: DFU's picker has no row that cannot be picked, and the stake stays where the player reads it
first.

THE FOUR HOSTS: world.js - WIRED, its `egStartWindow` doors unchanged (the start window is the module's, no host line);
worldModes.js, dungeonContext.js, exterior.js - no start window (the key's opener is registered by the world host's
breach client alone, `weirKey.js` setWeirKeyOpener; a host with none answers *The key is cold here.*).

Pinned by `test/ui/eliteGates/fb1018b_stakerow.test.js` (3): the stake picked by a tap (the double click a row press
replays, at pickRow's point), by Enter on the first highlight, by `1` and by Up then Enter leaves a new list in the slot, the window asking, nothing chosen, and Hall 1 picked after it is
the choice; the quest warning picked the same, Escape after it the cancel; and world.js's two doors and the picker's
self-close, the shapes the pin stands in for. `tools/mutants/fb1018b_stakerow.json` (3, all dead).

PIN MOVED: `test/net/eliteGates/egarch_client.test.js` EG-F THE START WINDOW - the stake picked closes the old list and
opens a new one, so its log reads two closes before the cancel.

What the reporter is owed: the top row of the Weir Key's window is the count of your keys, not a choice. Picking it now
keeps the window up with its list, instead of closing it and leaving the key saying the Spire already asks.

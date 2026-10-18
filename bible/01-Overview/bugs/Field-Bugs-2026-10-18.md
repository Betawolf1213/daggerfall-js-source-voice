# FIELD BUGS 2026-10-18 - twelve threads from the bug-reports channel, each read to its root

Twelve threads from the Discord's #bug-reports, handed over as screenshots with "No band aid fixes". Read on the code as
it stands at main's `d5732cf97` (merged forward to `cd2705d92`). Each was traced on the real modules first, and a fix
lands only where the cause is proven; where it is not, the record says so and what would prove it. The pins are
`fb1018_*`, the mutants `tools/mutants/fb1018_*.json`.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | Nauya, "Companions and Open Wagon": "when they dismount from the wagon, they just drop down inside of it, and they get stuck in your wagon unable to help you or move out of it ... the temporary fix is to just respawn your wagon every single time you run into an encounter" | The companions' seat was read by the motor alone, so a seat that went (the wagon parked) left the body where it sat, and it fell through the bed. The parked box, kept from closing round the player's capsule only, then stood round it. Its two-sided faces push no body out | fixed (WAGON-ALIGHT) |
| 2 | MADMAN0037, "Performance tank in specific area": "The Mouse and Fawn tavern in Sentinel, graphics settings preset ultra, Gpu fans turn into jet turbines" - the counter: 198 fps, 5.1 ms, "draws 67 binds 77", an RTX 5070 at 2560x1391 | The counter counted the room's own pass alone. The view out through the windows (the street, drawn before the room's frame) and the shadow maps' replays were nowhere on it, and nothing said what held 198 fps. VSync is on by default on the desktop, and the frame is GPU-bound. Which pass costs it is not proven | counted (PASS-COUNT); the cost itself open, below |

## WAGON-ALIGHT: the companions get down as a rider does

`src/systems/wagon/wagonSeats.js` (getDownPoint, GET_DOWN_STEP and GET_DOWN_REACH, moved into the law),
`src/scenes/wagon/wagonRiders.js` (the player's getting down calls it), `src/scenes/crewAshore.js` (getDown, capsules),
`src/scenes/horseCartPool.js` (capsuleInBox over `bodyCapsules`), `src/scenes/world.js` (one dep line).

FOUND. Reproduced end to end in Node on Mac's Open Wagon bake, the real collider, the cart runtime, the seats
(wagonRiders.js companionSeat), the companion layer and the foe motor. Two companions seated while the wagon trailed,
then parked with the player six metres off: both stood inside the box thirty seconds later, the player's own
get-down point clear of it for every seat. Two defects together:

- **The step down never happened.** The streaming host's `wagonCarriesCompanions` (now the pool's own question,
  `horseCartPool.js:"function carriesCompanions() {"`, moved there to keep `bootWorld` under its ceiling) is true only
  while the wagon trails or follows. Parked, `companionSeats` answers -1, so the seat handle answers null. The only reader of the
  seat is the motor (`enemyMotor.js:"const seat = this.seat?.();"`). With a seat it pins the feet, without one it goes
  on from where the feet are: the seat in the bed. Wagons.md promised "they step down and walk at heel", and nothing
  took the step. A player rider is stepped out (`wagonRiders.js` getDown, GET_DOWN_STEP over the side).
- **The box law was the player's alone.** `horseCartPool.js:"standWagonCollider(parked && !capsuleInBox(parked, myParts)"`
  read `playerCapsule` only (WAGONS3's spawn trap, written for one body - THE ONE CONSTRUCTION SEAM). The catch-up
  fires past CATCH_UP_M (40 m), so a boxed companion was held exactly while the player stayed near: during the fight.
  Respawning the wagon freed it because `standBox` takes the box down and stands it at the new pose.

Every path that empties a seat reaches the same frame: the player getting down (Trailing to Deployed), a following
team told to wait, a horse lost (both through `commitDeployment`), a player given a companion's seat on the road, the
wagon dismissed. A door, a fast travel or a load changes the place's key and lifts the bodies, so none of those
leave one in a bed.

FIXED.
- **One get-down point.** `getDownPoint(seat)` in the law: GET_DOWN_STEP behind the seat's yaw. The player's getting
  down and the companion layer's both call it, and nothing else in `src/` works the step out
  (`test/scenes/fb1018_wagonalight.test.js` sweeps for a second copy).
- **The companion layer takes the step.** Each frame `crewAshore.js` keeps the seat a body sits in (`s.sat`). The
  frame its seat goes, the body is stood at that seat's get-down point. The step is swept from the seat by the
  place's `spot`, so it never lands in a wall, and the motor is stood afresh there (resumeLive). A body further than
  GET_DOWN_REACH from its seat was moved by something else and stays where it is, the player's own guard.
- **The box law covers every body of mine.** capsuleInBox reads `bodyCapsules` beside `playerCapsule`, and the
  streaming host hands it both companion layers' capsules, the crew's hands and the sworn
  (`world.js:"bodyCapsules: () => [...crewAshore.capsules(), ...revenantAshore.capsules()],"`). That covers a
  companion getting down and one at heel where a summoned wagon is laid.

THE FOUR HOSTS: `world.js` wired. `exterior.js` stands no companion layer, so it has nothing to wire (its box reads my
capsule, as before). `worldModes.js` and `dungeonContext.js` draw no wagon. Our own feature, so no DFU member moves.

Why no test saw it: `test/scenes/wagons1_seats.test.js` asserted `companionSeat(0, false)` is null ("parked: they
walk") - the seat's answer, never where the body then stood, nor the box round it.

Pins: `test/scenes/fb1018_wagonalight.test.js` (4). Mutants: `tools/mutants/fb1018_wagonalight.json` (7, all dead).

## PASS-COUNT: the counter counts the passes it missed

`src/render/renderer.js` (stats.viewDraws, stats.shadowDraws), `src/ui/fpsCounter.js` (drawsLine, paceLine).

FOUND.
- **VSync is on by default on the desktop.** `settingsDefaults.js` ships `"VSync": "True"`, and the shell adds
  `disable-gpu-vsync` and `disable-frame-rate-limit` only for a player who saved it off (`app/lib/frameRate.cjs`). The
  Frame Rate Cap is off by default, DFU's own. 198 is a GPU-bound frame (2.5 ms of script in 5.1), not the client
  running uncapped by default.
- **"draws 67" was the room's pass alone.** In a building, `worldModes.js` asks `viewOutFrame(...)` before the room's
  `renderer.beginFrame(...)`. Real Windows "Full" is the Features default and is in the High and Ultra presets. The
  view out's `renderer.outsideViewFrame` runs its own beginFrame and draws the street, and the room's beginFrame then
  zeroed `renderer.stats`. Its count, `_rwViewDraws`, was read by nothing. The shadow maps keep their own stats
  (`shadowPass.js`), and a tavern's lamps all cast (`renderer.everyLightCasts`).

FIXED. The room's beginFrame takes the view out's draws into `stats.viewDraws` (the view out's own nested begin takes
none), and the lane's shadow render writes `stats.shadowDraws`. The counter prints `view N  shadow M` on its draws
line when a second held any, and a pace line when the pace is not the default: `vsync off` where the shell lifted the
display's wait, and the Frame Rate Cap's fps where one is set. At the defaults the counter reads as before.

OPEN, for the owner. The street is redrawn whenever any view-matrix entry moves past VIEW_MOVE_EPS (1e-4), which is
every frame of mouse-look. From inside a city it draws every pixel's whole static batch the crop meets
(`world.js:"const drawOutsideStreet = (r, planes) => {"`), which in Sentinel is most of the city again behind each pane.
That this is the tavern's cost is suspected, not measured. The player's counter now says it: Real windows at Rooms
only, then Enhanced lighting off, each read against the `view` and `shadow` figures. If the view out is the cost, the
levers move the picture (a redraw budget, or one wider picture per position sampled by direction) and are the
owner's to choose (`07-Rendering/Real-Windows.md`, PASS-COUNT).

Why no test saw it: `test/systems/perf3.test.js` drove the counter with the room's stats alone, and no test asked what
a frame with a view out counts.

Pins: `test/systems/fb1018_passcount.test.js` (3). Mutants: `tools/mutants/fb1018_passcount.json` (8, all dead).

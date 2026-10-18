# Body Motion - the Morrowind body's own walk, carry and blows in third person (BODY-MOTION, 2026-10-18)

Mac: *"I want to build improved animations for the morrowind rig (3rd person)
1. Improved running/walking for all races
2. Weapon specific walking/running animations
For example (running with a 2 hander by the hip)
(1 hand idle animation, holding down away from side. Running with it using the same format)
(Duelhand idle away from sides, running with them behind you)
Improved melee 3rd person attack animations
I want to be as detailed as possible. No band aids"*

The port's own (SCOPE1, `01-Overview/Port-Doctrine.md`): the body is OpenMW's character controller playing Morrowind's
own clips (`02-Formats/Morrowind-Rules.md`, MW-D24/MW-D26); this page is the layer laid over them in third person, and
every place it leaves them is named below. The ledger row is Port-Ledger A (BODY-MOTION).

## What the clips did - the reference, and why it was not enough

- **One clip per frame, every bone.** The rig's winner ladder (`src/combat/fpArm.js` update: death, the weapon action,
  the recoil, movement, the jump, the idle) poses the WHOLE skeleton from one group, the torch's left arm aside. Rule
  26's per-bone-group priority is the recorded gap (Morrowind-Rules.md, MW-D26 "Gaps" and MW-D52): so a blow while
  walking played the attack clip on the legs, which stopped mid-stride and slid under a body that kept moving.
- **A walk played at twice its cadence.** Morrowind's walk clip travels 154 units a second (2.2 m/s); Daggerfall walks
  at 3.7 to 6.3 m/s (`src/player/motor.js` walkSpeed, PlayerSpeedChanger.GetWalkSpeed) and runs at 6 to 12. MW-D26
  plays the clip at the actor's speed over the clip's (capped at 10), so the walk ran two to three times its own cadence
  and every foot slid; the run likewise at a sprint.
- **One pose per weapon group.** `idle1h`, `walkforward2c` and the rest are one authored pose a group, bobbed by the
  walk; nothing carries a two-hander differently at a run, or a pair, or holds a one-hander down and away.
- **No cross-fade** (Morrowind-Rules.md [C] "DO NOT IMPLEMENT smooth animation transitions"): a group's first frame
  replaces the last outright.

## The layer - `src/characters/bodyMotion/`

One instance per rig (`createBodyMotion`, `src/characters/bodyMotion/bodyMotion.js`): the player's, each peer's, each
person's in a Morrowind body - they are all `createFpArm` rigs (`src/net/peer/peerBodies.js`). Each frame:

1. **The clocks** (`step`), after the clip machine has stepped, on the rig's own word (`motionWord`): the camera's bag
   (`cam.move` - speed, input axes, running, grounded; `cam.yaw`, `cam.sneaking`, the climb, the seat, the saddle), the
   view, the skeleton's family, the race's scale, the weapon type and whether it is in the hand, the hands' mode
   (TWO-HANDS), the torch, a spell, a draw or a sheathe, the long gun's hold, and a blow's section and progress. A frame
   that does not pose still walks (PEER-CADENCE).
2. **The pose** (`apply`), on the frames that pose, through `poseAssembly`'s new `motion` slot
   (`src/formats/morrowind/mwFirstPerson.js`): after the clip's sample, the TWO-HANDS mirror and the neck, and UNDER the
   run, the climb, the seat, the saddle and the long gun's hold - which still win the bones they ask for.

**What the clip still owns.** The clip machine runs every group as before and decides everything a group decides; the
layer steps aside for each, easing out and back in (`MOTION_EASE`): the whole body for a death, a recoil, a climb, a
seat or a saddle, the air (the jump), the water and levitation; the arms for a draw or a sheathe, a readied spell or a
cast, a bow, a crossbow, a thrown weapon and the long gun's hold; the left arm for a lit torch. **The fingers are always
the clip's**: the stance's own group already shapes the hand (closed on its grip in `walkforward1h` and the two-handers'
groups, fists in hand-to-hand's, the pair's left the TWO-HANDS mirror of the right), and a curl laid on top would be
added to it (`climbRig.js` poseArm's curl is relative).

**The switch** is `systems/features.js` 'mw-body-motion' (Morrowind Body Motion, on by default): the viewer's, as the
Steel Helm is - how this machine draws a body, never the wire. Off, the body is Morrowind's clips exactly as before.

## The body, measured - `src/characters/bodyMotion/bodyKit.js`

`bodyOf` reads each skeleton ONCE off its rest pose, never a bone axis (the climb's law, CLIMB6): each leg's and arm's
bone lengths, the hips' and shoulders' widths, the ankle's height over the sole, the bone that carries the thighs
(retail's thighs hang from `Bip01 Spine`, not the pelvis - so the pelvis and the spine turn together as the hips), the
trunk's bones above it, the rest's own rotations of the trunk and head, and the turn that squares the rest's hips and
shoulders to the body's right (keeping their forward tilt, the build's own). The sole has no toe bone to read, so its
two contact points are shares of the leg (`FOOT`: the ball 0.14 ahead of the ankle, the heel 0.055 behind). Every length
the laws ask for is a share of this body's own leg or arm, so the male skeleton, the female, the beast and every race's
scale take the same request to the same place. `bodyKindOf` names the family from the skeleton's path (`base_anim`,
`base_anim_female`, `base_animkna`); anything else - a werewolf's body, a creature's own model - is none, and the layer
leaves it to its clips.

## The gait - `src/characters/bodyMotion/gait.js`

| Term | The law | Why |
|---|---|---|
| Stride | `strideLength`: Alexander's relation, lambda = 2.3 h (v^2/gh)^0.3 (R. McN. Alexander, Nature 261, 1976), capped at the style's `strideMax` | the stride a legged body takes at a pace, scaled by its own leg in metres (the race's height on it) |
| Cadence | the phase advances by the distance over the stride | a planted foot moves back under the body at exactly the ground's speed: it never slides |
| Duty factor | `dutyFactor`: the share of a stride a foot stands, falling with the Froude number | a walk keeps both feet down between steps; a run flies |
| A foot down | `footPlace` + `stancePitch`: the heel rocker, the flat foot, the forefoot rocker - the ankle placed by turning the foot about whichever point touches | the heel or the ball stays where it touched |
| A foot up | a Hermite swing leaving and landing at a share of the ground's speed (`retract`), the lift early (`liftProfile` - the heel kicks up behind at a run), the toes up for the swing (`swingPitch`) | the foot follows through and reaches, never a straight slide forward |
| The hips | `gaitPose`: never higher than a standing leg reaches (a soft minimum over the standing feet - the inverted pendulum), the walk's rise over the standing foot, the run's sink at mid-stance; the sway over the standing foot; the turn with the stride (the swinging leg's hip forward); the drop on the swinging side; the forward tilt | the body rides its legs |
| The chest | the counter-turn against the hips, the counter-drop, the lean with the pace and a quickening, the bank into a turn; at rest the breath | the trunk carries the arms' swing |
| The steer | `STEER`: the body always faces the camera, so a strafe turns the HIPS toward the travel (0.68 of its angle, at most 60 degrees) and the chest back; past 105 degrees off the facing (12 of hysteresis) a backpedal, the hips turned the other way (at most 40) | a strafe runs, it does not shuffle sideways; each foot kept on its own side (a lateral step, never a crossing) |
| Standing | `standingTargets`: each foot anchored where it stands while the body turns over it; past `TURN.step` (26 degrees) the foot on the turn's side steps back under the body, then the other; a turn of more than `TURN.snap` in a frame re-plants both | the feet never spin under a body turning on the spot |
| The head | level, looking ahead, however the trunk sways | the camera's eye, and a fighter's |

`GAIT_STYLES` holds one row per style (walk, run, sneak), blended by the frame's shares; `BODY_STYLES` scales them per
skeleton family: the female track 0.72 as wide, her pelvis turning 1.3 and dropping 1.35 as much, her arms held nearer;
the beast springier (the bob 1.25, the lift 1.15), lower, a little over the ball of its foot (`footBias` -6 degrees).
Daggerfall's walk pace is past a walk's longest stride (`strideMax` 2.15 legs): the walk is a long, brisk stride at a
quicker cadence - a power walk - which is what 4.4 m/s is on a human leg; the run is Alexander's to a sprint.

## The carry - `src/characters/bodyMotion/carry.js`

`carryClassOf` maps the hand's state to a class, and `CARRY[class][gait]` holds each arm's row for idle, walk, run and
sneak, blended by the gait's shares (`gaitShares`). A row is anatomical: the shoulder's flexion, abduction and inward
twist and the elbow's bend (`armByAngles` builds the arm by forward kinematics off the shoulder on the chest's own frame,
with the arm's own bone lengths), how much of the gait's own swing it takes, and - for a weapon hand - the blade's way
and its true edge's in the chest's frame. Every row is the right arm's; the left is its mirror.

| Class | When | At rest | At a run |
|---|---|---|---|
| free | nothing in the hand, or sheathed | arms hanging, palms in | the gait's pump: elbows near 90, the swing |
| one | a one-hander (short or long blade, blunt, axe) | Mac's: held down and away from the side, the blade forward, down and out | "the same format": the arm low and out, the blade trailing behind and down; the free arm pumps |
| two | a two-hander (long blade, warhammer, war axe) | a low guard in both hands, the blade forward and down across the body; the stance's feet split, the hips turned | Mac's: at the hip in the right hand, the blade trailing behind and down; the left lets go and pumps |
| wide | a staff | both hands, the staff across the body, its head up and left | at the hip, trailing; the left pumps |
| spear | a spear | both hands, the point forward and up | at the hip, the point forward and down; the left pumps |
| dual | a pair (TWO-HANDS) | Mac's: both held down and away from the sides, mirror images | Mac's: both swept behind the body, the blades trailing; the trunk leans in (`runLean`) |
| fists | bare hands drawn, or both fists up (TWO-HANDS) | a guard, the left fist leading; the feet split | the gait's pump |
| clip | a bow, a crossbow, a thrown weapon, a readied spell | the clip's own arms | the clip's own arms |

**A weapon is turned by its own bone.** Morrowind's Weapon Bone runs its +Y out of the fist's thumb side (the blade) and
its +X down the hand toward the fingers (the true edge - `characters/ownModels/ownWeaponModels.js`, RIFLE-STANCE's
reading). `gripRequest` (`src/characters/bodyMotion/bodySolve.js`) stands the bone where a row or a blow asks - its
grip, its blade, its edge - by reading the bone's relation to the hand off the skeleton each frame and asking the hand
for the frame that carries it there: no number about any hand or any weapon is held. A pair's left blade rides the
pair's Weapon Bone Left, the mirror of the right's (`combat/twoHands/mirrorRig.js` offWeaponBoneAddon), so the left
hand is solved as the right's request mirrored across the chest's middle (`mirrorRequest`). A two-hander's left hand
closes on the haft (`hafHand`): the right hand's own request reflected across the blade's plane (the left closes from
the other side of it) and moved along the blade by `TWO_HAND_GRIP` (a two-hander a fifth of an arm toward the pommel; a
staff half an arm and a spear 0.55 up the haft).

## The blows - `src/characters/bodyMotion/melee.js`

**Timed by the machine.** The clip machine already runs a blow through three sections - the wind-up to "max attack",
the release ending ON "<type> hit" (fitted to Daggerfall's own hit by MW-PACE1), the follow-through - and `blowU` reads
each section's own progress onto the choreography's clock: the wind-up spans u 0 to `U.windup` (0.3, eased), the release
u 0.3 to `U.hit` (0.5, accelerating into the target), the follow u 0.5 to 1 (decelerating). So the blade meets the
target on the frame Daggerfall deals the damage, a held wind-up holds its key, and a release the strength skips part of
starts part-way.

**A choreography** (`MELEE`) is keys over u: the grip in arm lengths off the middle of the shoulders in the BODY's frame
(the facing - so the trunk's wind is the body's and the path is the blade's), the blade's way and its true edge's (a cut
leads with its edge), the chest's turn, the hips' lead, the weight's shift forward and drop, the lead foot's step (laid
only standing) and the free arm's counterweight - joined by Catmull-Rom splines and eased in from the carry and out to it
(`blowWeight`). Families: 'one' (a one-hander, and each blade of a pair), 'two' (a two-hander, the staff and the spear -
the left hand on the haft throughout), 'fists' (the straight, the hook, the overhand and - for Daggerfall's backhand -
the uppercut). Blows: chop (wound up over the head, down through the front), slash (the forehand: wound up right and
behind, through the front, out to the left), back (Daggerfall's StrikeRight, MS1's reversed slash: wound up across to
the left, out to the right) and thrust (drawn back to the hip, driven straight out with a lunge). A left-hand blow (a
pair's left blade, a left fist) is the right's mirror. The strength the wind-up reached scales the body's wind
(`windFor`, between 0.65 and 1).

**The legs keep walking.** The blow drives the arms, the chest, the hips' turn and shift; the legs stay the gait's. The
recorded gap of rule 26 - a swing on the legs - is closed in third person for every body the layer walks.

## The solve - `src/characters/bodyMotion/bodySolve.js`

`solveBody` lays the whole request on the skeleton in the order a body is built from the ground up, each turn TOWARD the
request by the layer's weight from wherever the clip put the bone: the hips (the pelvis and the thigh-carrying bone
turned together to their body-frame turn) and the body moved so the hips' middle stands where asked; the chest turned to
its own, spread up the spine (`TRUNK_SHARE` - it bends, it does not kink); the neck and the collarbones put back on the
chest as they stand at rest (an attack clip's own swing of them would carry the shoulders off the arms' requests); the
head level; the legs and the arms by the climb's two-bone solve (`combat/climbRig.js` solveReach), the knee toward the
foot's way, the foot to its toe and its sole's up, the hand to its fingers' and palm's ways.

**Built for every body on the street.** The trunk's rotations are decided top down from the pose's own locals and
written as locals, the skeleton composed once; each limb is solved off that composition and its three bones' turns
carried down to each other by hand, written as locals, nothing re-composed (`poseAssembly` composes once after every
slot). Measured on the retail biped: the solve 0.15 ms, the whole layer with its laws 0.22 to 0.28 ms a posed body - on
the people's lanes it runs only on the bodies their skin budget poses in a frame (`SKIN_BUDGET` - four, or four to eight
by the people's tier), its clocks (a few microseconds) on every body.

**A rotation kept a rotation** (`combat/climbRig.js` `orthonormal`, now in `turn`) - found by this slice, a fault of
the climb's own. A turn's new local is a product of float32 matrices through a parent frame that already carries every
turn above it; unsquared, the skew compounds about fourfold a level down a chain of turns. The long gun's pin found it
first - its hands 0.05 units off their holds over the layer's first, turn-by-turn solve - and the climb alone carried
it too: a deep request (the body moved and swung, the spine bent, the shoulders drawn, both arms, both legs, the look)
left its rotations 2.65e-3 from orthonormal and its hands up to 3e-3 units off their holds, inside its pins' own
tolerances. Each local is now squared by Gram-Schmidt with its handedness kept (the pair's mirrored Weapon Bone Left
stays mirrored): the skew stays at float32's own rounding however deep the chain, and the climb's, the seat's and the
long gun's hands land within 3e-6 of their holds, over the moving body or the clip.

## The rig's wiring - `src/combat/fpArm.js`

`createFpArm` stood at 1,999 code lines under HOST-SPLIT's 2,000-line knot (`test/scenes/hostceiling.test.js`). The
wiring is three lines - the motion made once per rig, stepped after the clips on `motionWord`, handed to the
third-person `poseAssembly` as its `motion` slot - and the hip lantern's rider moved out to pay for them: the swing and
last frame's heading are `createHipLantern` (`src/systems/lanternSwing.js`, beside the swing's law), so `createFpArm`
now stands at 1,984. The lantern at the waist swings on the gait's stride while the layer walks the legs (the walk
clip's otherwise, as before - HT-WAIST).

THE FOUR HOSTS RULE: no host is touched. The world (`scenes/world.js`), the fixed city (`scenes/exterior.js`), the
interiors (`scenes/worldModes.js`) and the dungeon (`scenes/dungeonContext.js`) all draw the body through the one rig
(`player/mwView.js` -> `fpArm.drawThird`) and its one update (`combat/weapon/weaponRig.js`), so the layer reaches all four
from the rig; peers and people reach it through `net/peer/peerBodies.js`'s own rigs. A peer's camera carries only a
forward move, a measured pace and an eased yaw (no strafe, no jump): another player's body walks forward on its legs,
as their clips did.

## Departures (Port-Ledger A, BODY-MOTION)

1. In third person the body's legs, trunk, carry and a blow's body are the layer's, not Morrowind's clips' (on a
   base_anim skeleton, with the switch on); the clips still own every group's decisions, the hands' shapes, and the
   bones above.
2. The layer eases (`MOTION_EASE`, `GAIT_EASE`, the class's carry): the departure from Morrowind-Rules.md [C] "DO NOT
   IMPLEMENT smooth animation transitions" - the clips beneath it still switch as the reference does.
3. Rule 26's gap is closed for third person: the legs keep the gait under a blow.
4. A third-person blow's body is the port's choreography, timed by the clip machine's sections.
5. The hip lantern swings on the gait's stride while the layer walks the legs.

## Not verified here, said plainly

This container has no Morrowind data. Every pose was tuned and pinned on the vendored retail biped
(`test/fixtures/mw/retailRig.mjs` - retail `base_anim`'s own NiNodes, the male skeleton), drawn as skeletons from five
sides through `tools/bodyMotionSheet.mjs`'s contact sheets (`node tools/bodyMotionSheet.mjs list` names the scenes) -
never on the female's or the beast's own rest, never under a skinned body, and never against the retail clips the layer
leans on for the hands' shapes. The layer measures each skeleton it is handed, so the families take the same requests;
but how a request reads on Morrowind's own bodies is for Mac's eye on his own data, and every table (`GAIT_STYLES`,
`BODY_STYLES`, `STAND`, `STEER`, `TURN`, `CARRY`, `TWO_HAND_GRIP`, `MELEE`) is one frozen row to move there.

## Pins

- `test/characters/bodyMotion/bodymotion_gait.test.js` (10): the body measured; Alexander's stride and its cap, the duty
  factor; a planted foot standing still in the world through the flat of its stance, walking and running; the hips
  riding the legs and never asking a standing foot past its reach; the steer and the backpedal; the feet anchored while
  the body turns and the turn's side stepping first; the families and a race's height; the rockers; the solve on
  retail's bones and every rotation it writes kept a rotation; the solve's ease.
- `test/characters/bodyMotion/bodymotion_carry.test.js` (14): every weapon type and hands mode to its class and the haft's
  grip; the arm by its angles; the one-hander held down and away and its run; the two-hander's guard with both hands and
  its hip carry at a run; the pair mirrored at rest and swept behind at a run; the clip keeping the bow, the draw and
  the torch's arm; the blow's clock; the slash with the whole body and its edge leading; the chop, the thrust and the
  backhand; the left hand's blow the right's mirror and a two-hander's left hand on the haft through a blow; the legs
  walking under a blow; switched back on with the heading moved (re-planted, no step, no bank); the rig's word; the
  wiring by source.
- `tools/mutants/bodymotion.json`: 55 mutants, all dead (the first run's two survivors - the walk's own height over
  the standing foot, which the legs' reach had hidden; and `turn`'s squaring, which the layer's own solve no longer
  reached - each killed by a pin added for it: the walk's height at mid-stance, and the deep climb).
- PIN MOVED, each with its note: `test/combat/twohands_mw.test.js` and `test/player/climb/climb6.test.js` (the
  `poseAssembly` order: the `motion` slot between the neck and the run). Mutant records whose anchors this slice moved,
  re-aimed by content: `tools/mutants/htwaist.json` HT-WAIST-the-body-never-swings-it and HT-WAIST-the-portrait-swings.

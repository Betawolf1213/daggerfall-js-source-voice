# Two Hands - both fists, a pair of weapons, the running hands (TWO-HANDS, 2026-10-16)

Mac: *"Duel wielding and bare hand improvements.
1. When bare handed, the fist should be mirrored on the other side of the screen (like 2 hands). Attacking should
utilize both hands in a detailed way
2. When bare handed, or with nothing equipped, sprinting should show the hands in a running motion.
3. Weapons should now be able to be duel wielded instead of using a hand swap. With 2 weapons equipped, both weapons can
be seen and animated in view.
4. With duel wielding, we need to balance this to not be overpowered and make sense.
We need to tackle this and be as detailed as possible, use the climbing hands/animations as reference and do not band
aid fix anything."* - then: *"the morrowind model should have its own set of animations also following this, only
tackle this slice after completing the 2d work. Take your time and put this all within one PR"*.

The port's own (SCOPE1, `01-Overview/Port-Doctrine.md`): DFU has none of it, and this page names every place it
departs from DFU's one hand. The ledger row is Port-Ledger A (TWO-HANDS).

## What DFU does - the reference

- **One hand fights.** `WeaponManager` holds `usingRightHand`; ToggleHand (WeaponManager.cs:702-729, the H key) flips
  it, refuses while a shield is in the left hand, and says "Using weapon in right/left hand." UpdateHands caches the
  two hand items and ApplyWeapon puts the used hand's weapon on the one `FPSWeapon`.
- **One sprite.** `FPSWeapon` draws one picture; FlipHorizontal (FPSWeapon.cs:378) mirrors three of its states for a
  left-handed player, reading the source rect right to left (FPSWeapon.cs:381-390).
- **No running hands.** An empty hand is the bare-hand sprite while the weapon is drawn, nothing while it is sheathed;
  the run moves the camera (HeadBobber, its timer walked by PlayerFootsteps.WalkStepInterval) and nothing in the hands.
- **One clock and one formula.** FormulaHelper.GetMeleeWeaponAnimTime times a swing (the port's SWING-LAW,
  `characters/weaponStates.js`), CalculateSwingModifiers gives a StrikeDown -10 to hit, CalculateAttackDamage rolls the
  blow off the used hand's weapon and skill, and CalculateHandToHandAttackDamage reads the skill, never a hand.

## The law - `src/combat/handsLaw.js` (pure, @ts-check)

One law, read by both lanes and by the swing: which way the hands are held, which hand strikes, the mirror, the
balance, the guard and the run. It reads no setting, no clock and no equip table; the callers hand it each hand's item
described (`playerWeapon.js` `handDesc`: the item, its WeaponTypes, its ItemHands, a shield).

**The modes** (`HANDS_MODE`):

| Mode | When | Drawn |
|---|---|---|
| `fists` | both hand slots empty | both fists up |
| `dual` | two one-handed melee weapons (`DUAL_TYPES`: blades, daggers, maces, flails, hammers, axes, plain and magic - one-handed by ItemHands) | both weapons up |
| `single` | everything else - a shield (a fist and a shield is DFU's), a two-hander, a bow, a staff, a gun, the beast's claws, one weapon and an empty hand, **a light carried in a hand** | DFU's one used hand |

The light: a lit torch or lantern held (not hung at the waist, HT-WAIST) takes the left hand, as Handheld Torches and
the Morrowind arm's Shield Bone draw it - so it is one fist beside the light, DFU's and the mod's (`leftBusy`, set by
`weaponRig.js` `syncWorn` before ApplyWeapon). A pair never meets one: the mod stows a light when no hand is free.

**Which hand strikes** (`strikeHandOf`): the LEAD hand opens an exchange; a strike begun within `FLURRY_WINDOW` (0.75 s)
of the last one ending is the OTHER hand's - a flurry; past it the hands have settled and the lead opens again. The
window is half again SWING_FRAME_MAX, so a slow fighter's held button still alternates. In `single` the hand is always
the lead. The lead is DFU's `usingRightHand`.

**H with both hands up** picks the lead and says so - "Leading with the right hand." / "Leading with the left hand."
(`combat.leadRightHand` / `combat.leadLeftHand`, the port's own lines, in every locale). One hand in use keeps DFU's two
lines. Under the Morrowind arm H moved only between two held weapons (MW-HAND); it now moves between the fists too.

**The mirror**: a left hand is a right hand in the glass - CLIMB-HANDS' rule (`combat/climbHands.js`: Mac's painting a
left hand, mirrored for the right). `mirrorStrike` keeps a strike's way across the screen (the left hand's sweep to the
right is the right hand's sweep to the left, mirrored); `mirrorRect` mirrors a screen rect about the middle; a hand of a
pair is mirrored WHOLE, every state - DFU flips three because a side strike's art crosses the screen, and a second hand
would cross the first. `handOnLeft`: a left-handed player's picture is mirrored whole - the right hand on the left.

## The balance - two weapons are tempo, not twice the damage

`DUAL` in `handsLaw.js`. Every number is a multiplier or a term on DFU's own, and the LEAD's blow is DFU's exactly
(CalculateAttackDamage, the swing modifiers, the skill tallied by the weapon in the striking hand). The fists keep DFU's
numbers whole: hand-to-hand was always both fists.

| Term | Value | Why |
|---|---|---|
| `FLURRY_TEMPO` | 0.75 of the frames' time | the other hand is cocked while one strikes, so the exchange's blows come quicker |
| `OFF_DAMAGE` | 0.75 of the rolled damage (a landed blow at least 1, a miss a miss) | the weaker hand |
| `OFF_TO_HIT` | -10 at Agility 50, a point back each 10 past it, a point worse each 10 under, held in [-15, -5] | a StrikeDown's own -10 (CalculateSwingModifiers); the off hand's sureness is Agility's |
| `OFF_WEIGHT` | the off arm feels its weapon 1.5x heavier (SWING-LAW's heft at 1.5x the weight over the heft at the weight) | a dagger (0.5 kg) costs nothing, a longsword (4.5 kg) a tenth of the swing at Strength 50: the dagger is the off hand's blade |

The tempo rides SWING-LAW's answer (`weaponStates.js` `strikeTempoed`, on whichever answer the time came from - the
law's or a mod's) and is held to its bounds: no pair swings quicker than SWING_FRAME_MIN allows one weapon. A ctx with no
tempo - every single weapon, every fist, every foe - is the time untouched.

Measured against one weapon (the same weapon and skill, a 65% chance to hit): the pair's exchange lands 0.53 of a blow a
swing where one weapon lands 0.65, and swings 1.33 times as often - about 9% more damage a second, for 33% more fatigue a
second (DFU's per-swing cost, unchanged) and the shield's armour given up. A heavy off-hand weapon gives the quickness
back. The off hand's to-hit term rides the swing's own channel (`playerAttackOptions`' `toHitMod`), so an
AdjustWeaponHitChanceMod override sees it as it sees the StrikeDown's.

**What the strike carries** (`playerWeapon.js`): `_attack` asks the law for the hand (`_nextStrike`), and while a strike
of both hands is in flight the weapon in use is the STRIKING hand's (`activeHand`, `handItem`) - its art, its skill
tally, its swing time, its poison, its recoil - and the lead's again after it. `swingCtx` hands the tempo (the striking
weapon's weight, the live Strength, `readSwing`); `resolveHit` adds the off hand's to-hit by the live Agility
(`liveStat`) and its damage share. A technique (TECH1) is always the lead hand's (`lead: true`), never a flurry's.

## The sprite lane - `src/combat/twoHands.js`

Wired by `combat/weaponRig.js`, the one surface all four hosts mount (no host carries a line of it, HOST-SPLIT).

- **The machine is one.** The rig's PlayerWeapon runs DFU's one machine; each hand sees a VIEW of it (`view(hand)`):
  the strike while it is that hand's, the idle otherwise - mapped to its mirror when the hand is on the left.
- **Each hand drawn as DFU draws a right hand**: the classic body by `fpsWeaponQuad` (`fpsWeapon.js`, drawFpsWeapon's
  placement without the draw), or a Weapon Widget clone - the rig's own for the right hand, `offWidget` for the left.
  A pair's clone is never flipped by Handedness or Ambidexterity (`pairHand`); the one on the left is drawn mirrored
  (`draw`'s `mirror`, its UVs swapped). Each clone plays its own hand's blows and holds its idle - bob, slide and all -
  through the other's; the left clone's coroutines are resumed at the frame's end like the right's (`endOfFrame`).
  The striking hand is drawn over the other. A pair's left hand's blow recoils the left clone (WW1's recoil).
- **The guard** (`GUARD`): while one hand strikes the other draws in toward the middle (10 px) and down (9 px) on the
  320x200 surface, eased in fast (0.05 s) and out slower (0.14 s) - ClimbPose's limb law, no pop. The fists' guard is
  alive at rest: a 1.6 px bounce at 1.15 Hz, the two hands out of step, gone in a strike or a walk.
- **The running hands** (`RUN_PUMP`): running on the feet (DFU's run - not standing, crouched, mounted, swimming, in the air
  or on a wall) at 1 m/s or more with NOTHING in either hand (`weaponRig.js` `handsEmpty`: no weapon or shield, no
  light, not the beast, no spell, no act's tool, no held sheet, no swap under way) - drawn or sheathed - the two fists
  pump. One stroke a step on the head bob's own clock (`RUN_STEP_M` 2.5 m, WalkStepInterval), the right forward as the
  left foot falls; the stroke snaps (|sin|^0.7) - up 0.42 of the fist's height and toward the middle at the top, down
  1.05 (out of the view, the hand passing the hip) and outward at the bottom, 9% nearer the eye at the top. Up from the
  guard when the fists were up, or up from below the view (as CLIMB-HANDS' hands rise, no sleeve shown) when the hands
  were down; in over
  0.12 s, away over 0.16 s, at once (0.04 s) for a punch thrown on the run.
- **The draw seam** (`weaponRig.js`): the two-hands branch stands after the climb's return and before the Morrowind
  arm's seam, never under the Beholder's sprite, the Morrowind arm or the held map's window (MAP-WEAPON); it draws whole
  and returns. A pair holds no shield and no light, so the one-hand ladder below it (the shield, the torch hand, the
  gun, the clone, the sprite) is the single hand's, untouched. The gate gains `runHands` and `armsRun`: an empty-handed
  run is often a sheathed one, and the running hands are not a weapon either (as CLIMB-HANDS' `armsClimb`).

## The Morrowind lane - `src/combat/mirrorRig.js`, `src/combat/fpArm.js`

Tackled after the sprite lane, as asked. Morrowind has one weapon hand: its one-handed groups swing the right arm, its
hand-to-hand groups throw each punch with the hand the clip was made for, and there is no clip for a left-hand blow or a
second weapon. So the second hand is the sprite lane's idea on a skeleton: THE LEFT ARM IS THE RIGHT ARM IN THE MIRROR.

- **The mirror rig** (`mirrorRig.js`) holds no number about any skeleton (CLIMB6's rule). Every bone's counterpart is
  found by its NAME (`counterpartName`: Bip01's L/R, the attach family's Left/Right, Weapon Bone and Weapon Bone Left);
  the plane is the skeleton's own middle (halfway between its upper arms at rest); a bone's mirror is taken against the
  REST pose of both bones, so it holds whichever way a skeleton's left axes run:
  `M'(b) = S . M(m(b)) . Rest(m(b))^-1 . S . Rest(b)`. At rest it is the rest; a skinned vertex of the left arm lands
  where the right arm's mirrored vertex does (pinned on the retail biped `xbase_anim_sh.nif` to 1.2e-4). A bone with no
  counterpart keeps its local and rides its mirrored parent; a bone INSIDE an arm with no counterpart (the Shield Bone)
  is unpaired, so it never crosses the body.
- **Posed in the assembly** (`mwFirstPerson.js` `poseAssembly`'s `mirror`): right after the clip poses the skeleton,
  ahead of the neck and the climb's IK, on both rigs (the first-person arms and the third-person body).
- **The compositions** (`fpArm.js` `mirrorFor`):
  - a pair at rest - the left arm the right's mirror: both weapons up, as the stance holds the one;
  - the right's blow - the clip swings the right; the left holds the idle's right arm, mirrored;
  - the left's blow - the whole body in the mirror (the left swings the clip's blow, the torso turns with it) and the
    right arm the idle's own;
  - the fists - as the clip has them, but a blow thrown by the hand its clip does not throw with is the whole body in
    the mirror, the other fist held where the idle holds it. Which fist a clip throws is MEASURED, not assumed: the
    wrist that travels the farther from the attack's "start" to its "hit" (`strikingSide`), once per clip.
  Nothing for a sheet held, the stone, a spell, the dead, a beast.
- **No pop** (the carry): every change of composition carries every bone from where it was drawn last frame onto its
  new place over `POSE.LIMB_TAU` (ClimbPose's limb law) - its rotation by a decaying share of the difference, its
  translation the same.
- **The left hand's weapon**: the right hand's record, mesh and door, hung on `Weapon Bone Left` in a slot of its own
  (`offweapon`) - rule 13 already draws a "Left" bone's part mirrored (the bow's law). Shown while a pair is drawn,
  hidden sheathed, under a sheet, on the stone or in a spell; a skeleton without Weapon Bone Left binds none.
  `setOffWeapon` queues behind a build like `setWeapon`.
- **The running hands** (`RUN_3D`): the same stride, snap and weight as the sprite lane's, each hand at its stroke's
  place on the arms' own picture - a line from the rig's eye through a share of the frame, a point `d` metres out -
  reached by the climb's solver (`climbRig.js`) with the fist clenched, the palm in, the elbow out and back; first
  person alone (the body's own run group swings its arms in third). The first-person climb slot carries it
  (`firstClimb(...) ?? firstRun(cam)`).

## Departures from DFU (Port-Ledger A, TWO-HANDS)

1. ToggleHand/ApplyWeapon: with both hands up both are in use; H picks the lead, and the weapon in use is the striking
   hand's while a strike is in flight.
2. FPSWeapon: a second sprite; a hand of a pair mirrored whole (every state), not three states for Handedness.
3. GetMeleeWeaponAnimTime: a strike's tempo on its answer, inside SWING-LAW's bounds.
4. CalculateAttackDamage's caller: the off hand's to-hit term and damage share.
5. The running hands: DFU draws nothing in the hands on a run.

## Not carried

- **Peers on the wire**: another player's body still holds the one hand the wire names (`shown.lh`,
  `net/peerBodies.js`), not the pair.
- **The off weapon's holster**: sheathed, the left hand's weapon is hidden, not hung on the body as Weapon Sheathing
  hangs the one weapon.
- **The Beholder's sprite body** (EOTB): third person on the sprite body shows one weapon.
- **Werecreature claws**: the beast stays single (DFU's racial override, one claw sprite).
- **Skeletons without Weapon Bone Left**: no left weapon is drawn on them; the pair still swings.
- **No browser or ARENA2 probe run**: the sprite lane is pinned through a real rig on a synthetic WEAPON CIF, the
  Morrowind lane on the retail biped and the fixture arm; neither was seen on a GPU in this slice.

## Pins

- `test/twohands.test.js` (16): the law, the swing, PlayerWeapon through the real formula and the override seam, the
  rig on a synthetic CIF - the fists, the guard, the widget's two clones, the pair, the running hands, the branch by
  source, a left-handed player.
- `test/twohands_mw.test.js` (10): the mirror rig on the retail biped (counterparts, the plan, the law, no pop, which
  fist a clip throws) and the arm over the fixture arm (the left weapon, the pair, the fists, the running hands, by
  source).
- `tools/mutants/twohands.json`: 55 mutants, all dead.
- PIN MOVED, each with its note: `a12_lefthand` (H's lines with both hands up), `ww1_weaponwidget` (the recoil's hand,
  the frame's end), `ht1_handheldtorches`, `climbhands2`, `mwcast1`, `map3_heldpose` (the draw gate's two new legs),
  `mwtorch`, `werewolf1`, `mwattach` MW-D19 (the arm's item is the right hand's in a pair), `climb6` C16 (the climb
  slot's run), `fparm` MAC-S1 (five busy takers), `thunderlock` FIELD-GUN13 (the gate), `auditrr` F1 and `rri2_realism`
  (the swing's ctx is `swingCtx`, the clone's the rig's when handed one), `tech1_hosts` (a technique through `_attack`,
  the lead's), `fb1003_widgetlook` (the clone's frame built by `cloneFrame`), `mwload_fparm` MW-LOAD
  (`resolveOffWeaponParts` a door its callers open), `arrowPick` MW-D50 (the left weapon's three archive reads).
- Mutant records whose anchors this slice moved, re-aimed by content and re-run (all dead): `arrow2`,
  `auditdisc28_arrest`, `climb4`, `climbhands2`, `disc10`, `l10n3dcrossings` (two), `mwcast1`, `mwhand`, `sw1`, `tech1`,
  `torchvis`.
- The one-hand draws keep their own lines: `drawFpsWeapon`'s quad call and the widget's `getWeaponRect()` draw are
  untouched (MAC-I's tint pins); only a hand of a pair takes the guard and the mirror.

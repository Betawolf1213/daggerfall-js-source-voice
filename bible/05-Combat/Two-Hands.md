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

The light: a lit torch or lantern held (not hung at the waist, HT-WAIST) takes the left hand where a lane paints it there -
Handheld Torches' sprite on the classic lane, the Morrowind arm's torch on its Shield Bone (a torch alone: the arm holds no
lantern) - so it is one fist beside the light, DFU's and the mod's (`leftBusy`, set by `weaponRig.js` `syncWorn` before
ApplyWeapon). A light NO lane draws in a hand (Handheld Torches off on the classic lane) holds no hand: both fists stand
(AUDIT, lanes 1/2/4). The mod stows a light when no hand is free, so a pair seldom meets one - except under its
RelaxedLanterns (with LanternsAtWaist off, both non-default), where a lit lantern stays in the hand and the pair is one
hand until it is put out.

**Which hand strikes** (`strikeHandOf`): the LEAD hand opens an exchange; a strike begun within `FLURRY_WINDOW` (0.75 s)
of the last one ending is the OTHER hand's - a flurry; past it the hands have settled and the lead opens again. The
window is nearly twice SWING_FRAME_MAX (0.4 s), so a slow fighter's held button still alternates. In `single` the hand
is always the lead. The lead is DFU's `usingRightHand`.

**H with both hands up** picks the lead and says so - "Leading with the right hand." / "Leading with the left hand."
(`combat.leadRightHand` / `combat.leadLeftHand`, the port's own lines, in every locale) - and ENDS the exchange in
progress: the next blow opens a new one with the new lead (AUDIT: left running, a blow after H was the old exchange's
quick answer thrown by the new lead with none of the off hand's costs - x1.2 damage for a key press between swings).
Nothing changes hands, so BowLeftHandWithSwitching bills nothing. One hand in use keeps DFU's two lines and DFU's bill.
Under the Morrowind arm H moved only between two held weapons (MW-HAND); it now moves between the fists too. The
Fighting tutorial says so ("Two weapons or two fists both fight; H picks the lead").

**The mirror**: a left hand is a right hand in the glass - CLIMB-HANDS' rule (`combat/climbHands.js`: Mac's painting a
left hand, mirrored for the right). `mirrorStrike` keeps a strike's way across the screen (the left hand's sweep to the
right is the right hand's sweep to the left, mirrored); `mirrorRect` mirrors a screen rect about the middle;
`handOnLeft`: a left-handed player's picture is mirrored whole - the right hand on the left.

### The painted arm

Probed with Daggerfall's own `WEAPON10.CIF` (DFU's freeware DaggerfallGameFiles, `tools/fetch-data.sh`): **the bare
hand's art paints BOTH arms.** Its idle (record 0) and its StrikeDownLeft, StrikeRight and StrikeDownRight records are
the right arm (the light glove, the grey sleeve); its StrikeDown, StrikeLeft and StrikeUp records are the LEFT arm (the
dark glove, the brown sleeve with the stitched cuff) - classic Daggerfall threw its hand-to-hand with both fists, by
direction. WeaponBasics carries nothing of it (every melee strike aligns Center); it is a fact of the shipped frames,
`MELEE_PAINTED_ARM` (by record). Every weapon file paints the right arm alone.

So a hand's picture is CHOSEN, never assumed (`strikePicture`), and the arm on the screen is always the hand that throws
the blow, on its own side:

1. the state's own record as painted, when it paints this hand's side - DFU's own picture;
2. else the mirror state's record in the mirror, when that paints the other side - this hand, this way across;
3. else the art has this hand only the other way across: the mirror state's record as painted.

A weapon is always 1 for the right hand and 2 for the left - the mirror of the mirrored strike, as before. The fists take
all three; e.g. the right fist's StrikeDown is the left-arm painting mirrored, the left fist's StrikeDown the painting
as it is. Every draw uses ONE rule - a record is mirrored exactly when its painted arm is not the hand's side - so the
classic sprite, each Weapon Widget clone (by the record the clone actually draws, a frame behind the machine), the rest
and the run all agree. Before this the left StrikeDown mirrored a left-arm painting into a second right fist.

## The balance - two weapons are tempo, not twice the damage

`DUAL` in `handsLaw.js`. Every number is a term on DFU's own, and the LEAD's blow is DFU's exactly (CalculateAttackDamage,
the swing modifiers, the skill tallied by the weapon in the striking hand) - its flurry blows too. The fists keep DFU's
numbers whole: hand-to-hand was always both fists.

| Term | Value | Why |
|---|---|---|
| `FLURRY_FROM_FRAME` | a flurry's blow starts 1 frame into its swing: 4 ticks of 5, the hit a tick sooner | the other hand is already raised; in FRAMES, so it is the same at every frame rate (below) |
| `OFF_DAMAGE` | 0.8 of the rolled damage (a landed blow at least 1, a miss a miss) | the weaker hand |
| `OFF_TO_HIT` | -5 at Agility 50, plus the rounded tenth of (Agility - 50), held in [-10, 0] | half a StrikeDown's own -10 (CalculateSwingModifiers); the off hand's sureness is Agility's |
| `OFF_WEIGHT` | the off arm feels its weapon 1.5x heavier (SWING-LAW's heft at 1.5x the weight over the heft at the weight) - the only factor on a tick's time | a dagger (0.5 kg) costs nothing, a longsword (4.5 kg) a tenth of the swing at Strength 50 |

**Why frames, not seconds (AUDIT, lane 1).** The machine steps a swing's frames one tick at a time and drops each tick's
remainder at the frame it lands on (DFU's coroutine, `weaponStates.js` `machineStep`), so the first cut's 0.75 factor on
a tick's time rounded to a different answer at every frame rate: measured through the machine the pair was x0.97 at
30 fps and x1.09 at 1000 fps - a 144 Hz player's pair out-dealt a 60 Hz player's. Starting the flurry a frame in is 0.8
of one weapon's time at any frame rate. The Morrowind arm's pacing (`blowSchedule`) times a strike from the frame it
stands on.

**Measured, not on paper** (the audit's own scripts, through the real machine and the real formula):

| | swings a second | damage a second |
|---|---|---|
| a dagger pair vs one dagger, 65% to hit, Speed 50 and 100, 30/60/144/1000 fps | x1.24-1.25 | x1.08-1.09 at every frame rate |
| a longsword pair vs one longsword (the off arm feels 4.5 kg) | x1.11-1.20 | x0.96-1.05 |
| a longsword pair, the real formula, 200k seeded rolls, 60 fps, Speed 50 / 100 | | x1.058 / x1.031 |
| longsword + dagger vs the longsword alone, same | | x0.881 / x0.839 |

A matched pair lands about 9% more damage a second than one of its weapons, for a quarter more fatigue a second (DFU's
per-swing cost, unchanged) and the shield's armour given up. A heavy off weapon gives part of that back. A light off
weapon trades damage for quickness: half the blows are the dagger's (a quarter of the longsword's), so a longsword with a
dagger lands LESS than the longsword alone - the pair is as good as its weaker hand. (The first cut's record called the
dagger "the off hand's natural blade"; measured, it is not.)

**One home for the off hand's blow** (AUDIT): its share is laid INSIDE the formula (`formulas.js` `calculateAttackDamage`'s
`blowShare`) - in the stock core ahead of the equipment's wear, after a mod's core - so the HUD's number, the strike
listeners (a leech, an echo, Ruhn's Cleave, the feud ledger), the Strikes payloads and the wear all see the blow that
landed. Its to-hit rides the swing's own channel (`playerAttackOptions`' `toHitMod`), so an AdjustWeaponHitChanceMod
override sees it as it sees the StrikeDown's. And **a blow between players carries the same terms**
(`duelCombat.js` `resolveDuelStrike`'s `off`, on the striker's own sheet): every duel, siege, siege-work, Royal Tourney
and wild-zone arm hands the STRIKING rig's `offStrike` on (world.js's and the dungeon's own rig alike) - measured equal
to the blow against a foe (the off hand's mean blow 13.657 both ways, where it had landed whole between players).

**What the strike carries** (`playerWeapon.js`): `_attack` asks the law for the hand (`_nextStrike`), and while a strike
of both hands is in flight the weapon in use is the STRIKING hand's (`activeHand`, `handItem`) - its art, its skill
tally, its swing time, its poison, its recoil - and the lead's again after it; if the hands stop being two mid-strike
(a quickslot swap) the weapon in use is the one hand's at once. `restingWeapon` is the lead's - what the HUD's diamond
(all four hosts) and a technique read, so neither flickers to the off hand's item for its blows. `swingCtx` hands the off
hand's burden (`readSwing`); `resolveHit` the off hand's to-hit by the live Agility (`liveStat`) and its share. A
technique (TECH1) is always the lead hand's (`lead: true`), never a flurry's.

## The sprite lane - `src/combat/twoHands.js`

Wired by `combat/weaponRig.js`, the one surface all four hosts mount (no host carries a line of it, HOST-SPLIT).

- **The machine is one.** The rig's PlayerWeapon runs DFU's one machine; each hand sees a VIEW of it (`view(hand)`):
  its picture's state (above) while the strike is that hand's, the idle otherwise.
- **Each hand drawn by DFU's own placement**: the classic body by `fpsWeaponQuad` (`fpsWeapon.js`, drawFpsWeapon's
  placement without the draw), or a Weapon Widget clone - the rig's own for the right hand, `offWidget` for the left -
  mirrored by the one rule. A pair's clone is never flipped by Handedness or Ambidexterity (`pairHand`). Each clone plays
  its own hand's blows and holds its idle through the other's; the left clone's coroutines resume at the frame's end
  like the right's (`endOfFrame`). The striking hand is drawn over the other. A pair's left hand's blow recoils the left
  clone (WW1's recoil).
- **Both hands sway as one body** (AUDIT): the Weapon Widget's Bob and Inertia sway (its `position`) is turned about
  before the mirror (`weaponWidget.js` `pairRect`), so the mirror hands it back in the screen's own direction - the mod
  keeps Inertia's screen direction for its own mirrored sprite the same way. The Offset slide is the hand's own and is
  mirrored with it.
- **A clone lets go of a blow that stopped being its own** (AUDIT): the Swings module's wind-up ends when the strike it
  shadows ends (a pair dissolved mid-blow - a light lit, a weapon swapped, the beast); before, the left clone wound up
  forever and its fist sat off the screen until its next blow. DFU's one machine always reaches the hit frame first, so
  the one hand never comes there. The left clone is stepped only while a pair is up, or until its swing has ended and
  its slide settled out of sight (`settledHidden`): single-hand play never pays for it.
- **The guard** (`GUARD`): while one hand strikes the other draws in - a fist toward the middle (10 px on the 320x200
  surface) and down 9 px; **a pair's resting weapon straight down by `LOWER`, 0.12 of its own drawn height** (Mac, after
  the first pictures: "When attacking with a weapon, the other weapon in hand should lower slightly"). A weapon's picture
  is several fists tall (WEAPON02's dagger 143 design px, WEAPON04's katana 86), so the fists' 9 px, which the pair had,
  did not read on it; a share of its own height lowers every weapon alike - the dagger 17 px, the katana 10, its hand
  still in the view. Straight down, never in: **THE CUT STAYS OFF THE SCREEN** (Mac: "The sprite on the right moves ...
  and exposes where it clips off"). Every weapon a pair holds is painted with its hand leaving the frame through its
  outer side (measured on the shipped idles: the katana 32 rows cut down its right column, a warhammer 53, a battleaxe
  37 - every one but the plain mace) and WeaponBasics draws it flush to the view's side (AlignRight, Offset 0; the
  dagger DFU's 0.04), so the fists' tuck toward the middle drew the katana's cut 30 px into the view. Eased in fast (0.05 s time constant) and out slower (0.14 s) - ClimbPose's limb law, no pop; laid in SCREEN
  space, from the hand's own side, whatever its picture, on the classic sprite and on a Weapon Widget clone alike (the
  clone's own rect height). The fists' guard is alive standing: a 1.6 px bounce at 1.15 Hz, the two hands out of step,
  gone in a strike or a walk.
- **The running hands** (`RUN_PUMP`): running on the feet (DFU's run - not standing, crouched, mounted, swimming, in the
  air or on a wall) at 1 m/s or more with NOTHING in either hand (`weaponRig.js` `handsEmpty`: no weapon or shield, no
  light a lane draws, not the beast, no spell, no act's tool, no held sheet, no swap under way) - drawn or sheathed - the
  two arms pump, ON THE HEAD BOB'S OWN CLOCK (AUDIT): `HeadBobber` hands its timer out every frame
  (`player/headBobber.js`'s `out`, `player/motor.js` `motionBagOf`'s `bobTimer`) and the pump's phase is that timer a
  quarter turn behind (`runPhaseOfBob`) - the right arm most forward as the left foot is planted, every step, with no
  drift; with head bobbing off the pump keeps its own stride (`RUN_STEP_M` 2.5 m a step).
  - **THE RUNNING ARM IS THE ART'S OWN** (Mac, of the first cut: "theres no arm portion of the sprite, so it looks like
    floating hands"). The first cut lifted the bare hand's idle - `WEAPON10.CIF` record 0, a 63x53 fist cut at the
    wrist, painted to stand on the view's bottom edge - up to 0.42 of its height, and the cut floated. The one record of
    the bare hand's art that lifts a fist on its own forearm from the frame's foot is the right arm's rising punch
    (record 5, StrikeDownRight: the fist coming up on its grey sleeve, then the follow-through across). So a
    running hand is drawn in those frames (`ARM_STATE`, `ARM_FRAMES`), the frame by how far up its stroke is (the
    stroke snaps, |sin|^0.7) - **frames 1, 2 and 3, the ones whose arm leaves the frame through its foot alone**: frame
    0's sleeve also leaves through its right side (15 rows cut down its right column) and the stroke's outward swing
    drew that cut into the view (Mac: "The sprite on the right moves to the right and exposes where it clips off");
    frame 4's leaves through its left (8). Measured on the shipped file and pinned there (the ARENA2 test); frame 2's
    knuckles touch its top row (3 px), Daggerfall's own punch frame as it draws it. Each is placed as FPSWeapon places a
    frame - **its foot on the view's bottom edge, never
    lifted** (OnGUI's `height - h`): the pump only LOWERS a sprite (1.05 of its height at the back of the stroke, out
    of the view - the hand passing the hip), so the forearm always runs off the screen. Across the view it stands where
    its fist rests (the idle's own place), 0.06 of the width toward the middle at the top and 0.03 out at the bottom;
    the left hand is record 5's right arm in the mirror (the one rule). Measured on the real art: the fist at the top of
    the stroke stands about half way up the view on its forearm, and only one arm is up at a time.
  - **The art changes under the view, never in sight**: as the run starts, the fists' own rest (the idle, where the pair
    draws it) goes DOWN out of the view over the first half of the run's weight (`SWAP` 0.5) and the arms come up from
    under it over the second; as it ends, the reverse (a sheathed body's fists were down - the arms simply rise). The
    weight follows time constants of 0.12 s in and 0.16 s out. A punch thrown on the run is drawn from its FIRST frame
    over the other arm (0.04 s away); a hand TAKEN mid-run (a weapon, a shield, a light, a spell, a tool, the beast, a
    swap) ends the run at once - the fade is for a run that ends with the hands still empty. The ground speed is read
    off the eye every frame, whatever mods are on (AUDIT: kept inside the mods' gate, the running hands never ran with
    the Weapon Widget, Handheld Torches and Shield Widget off).
- **The draw seam** (`weaponRig.js`): the two-hands branch stands after the climb's return and before the Morrowind
  arm's seam, never under the Beholder's sprite, the Morrowind arm or the held map's window (MAP-WEAPON); it draws whole
  and returns - the running arms first, then the pair (a punch on the run over them). A pair holds no shield and no
  light, so the one-hand ladder below it (the shield, the torch hand, the gun, the clone, the sprite) is the single
  hand's, untouched. The gate gains `runHands` and `armsRun`: an empty-handed run is often a sheathed one, and the
  running hands are not a weapon either (as CLIMB-HANDS' `armsClimb`).

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

1. ToggleHand/ApplyWeapon: with both hands up both are in use; H picks the lead, ends the exchange and bills no switch
   (BowLeftHandWithSwitching's delay is a swap's, and nothing changes hands); the weapon in use is the striking hand's
   while a strike is in flight, the lead's at rest (`restingWeapon`: the HUD's plaque, a technique's weapon).
2. FPSWeapon: a second sprite; a hand of a pair mirrored whole (every state) by the one painted-arm rule, not three
   states for Handedness.
3. The weapon state machine: a flurry's blow starts at frame 1 - a tick sooner, in ticks, so the same at any frame rate;
   the off weapon's burden slows only its own blows (GetMeleeWeaponAnimTime's weight term, SWING-LAW's bounds).
4. CalculateAttackDamage: the off hand's to-hit term at its caller, its damage share INSIDE the formula (`blowShare`),
   so the share, the report and the wear agree; the player-vs-player blow (`resolveDuelStrike`'s `off`) carries both.
5. The running hands: DFU draws nothing in the hands on a run.

## Not carried

- **Peers on the wire**: another player's body still holds the one hand the wire names (`shown.lh`,
  `net/peerBodies.js`), not the pair.
- **The off weapon's holster**: sheathed, the left hand's weapon is hidden, not hung on the body as Weapon Sheathing
  hangs the one weapon.
- **The Beholder's sprite body** (EOTB): third person on the sprite body shows one weapon.
- **Werecreature claws**: the beast stays single (DFU's racial override, one claw sprite).
- **Skeletons without Weapon Bone Left**: no left weapon is drawn on them; the pair still swings.
- **The test suite holds no ARENA2**: the sprite lane is pinned through a real rig on a synthetic WEAPON CIF (its
  painted arms set as WEAPON10's are), the Morrowind lane on the retail biped and the fixture arm. The real art was
  probed outside the suite (Audit-Two-Hands.md, "Evidence").

## Pins

- `test/twohands.test.js` (20): the law and the painted arm, the balance MEASURED through the machine at two frame
  rates, PlayerWeapon through the real formula and the override seam (the flurry's frame, the schedule's ticks, H's
  exchange, the resting weapon, the off strike), the off hand's blow in the formula and between players, the rig on a
  synthetic CIF - the fists, the guard, the widget's two clones, the pair, the running hands (the stroke, the bob's
  clock, what takes a hand, the mods), the branch by source, a left-handed player.
- `test/twohands_mw.test.js` (10): the mirror rig on the retail biped (counterparts, the plan, the law, no pop, which
  fist a clip throws) and the arm over the fixture arm (the left weapon, the pair, the fists, the running hands, by
  source).
- `tools/mutants/twohands.json`: 112 mutants, all dead (39 of them the audit's, `TWOHANDS-AUDIT-*`: each fix reverted, and
  each claim the record made that no pin could fail; 14 the running arm's and the lowered weapon's, `TWOHANDS-ARM-*`,
  `TWOHANDS-LOWER-*`).
- PIN MOVED, each with its note: `a12_lefthand` (H's lines with both hands up; the bow-switch arm on its own case, a
  bow in the left hand), `audit_seats_client` G5, `auditcc_pvp` H5 and `duel_combat` DUEL1 (the off hand's blow between
  players), `enhancedHud` AUDIT 39 (the plaque reads the resting weapon), `ww2_idlebob` WW2 (the motion bag's
  `bobTimer`), `ww1_weaponwidget` (the recoil's hand, the frame's end), `ht1_handheldtorches`, `climbhands2`,
  `mwcast1`, `map3_heldpose` (the draw gate's two new legs), `mwtorch`, `werewolf1`, `mwattach` MW-D19 (the arm's item
  is the right hand's in a pair), `climb6` C16 (the climb slot's run), `fparm` MAC-S1 (five busy takers), `thunderlock`
  FIELD-GUN13 (the gate), `auditrr` F1 and `rri2_realism` (the swing's ctx is `swingCtx`, the clone's the rig's when
  handed one), `tech1_hosts` (a technique through `_attack`, the lead's), `fb1003_widgetlook` (the clone's frame built
  by `cloneFrame`), `mwload_fparm` MW-LOAD (`resolveOffWeaponParts` a door its callers open), `arrowPick` MW-D50 (the
  left weapon's three archive reads).
- Mutant records whose anchors this slice moved, re-aimed by content and re-run (all dead): `arrow2`,
  `auditdisc28_arrest`, `climb4`, `climbhands2`, `disc10`, `l10n3dcrossings` (two), `mwcast1`, `mwhand`, `sw1`, `tech1`,
  `torchvis`.
- The one-hand draws keep their own lines: `drawFpsWeapon`'s quad call and the widget's `getWeaponRect()` draw are
  untouched (MAC-I's tint pins); only a hand of a pair takes the guard and the mirror.

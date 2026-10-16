# AUDIT TWO-HANDS (2026-10-16) - both fists, a pair of weapons and the running hands, audited

Mac, of the branch that brought TWO-HANDS (`05-Combat/Two-Hands.md`): **"I also want to do a comprehensive audit on
this"**, then, of the first pictures, **"why are the running hands at the top of the screen. Why arent you probing
this"**. This page is the findings, each with its verdict. What the audit changed is written into Two-Hands.md's
sections as they now stand, each change marked AUDIT.

## How it was run

Five cold lanes, each an adversarial reader of the slice (e4ded083, under the merge 89912af3), each told to prove a
finding by running it before reporting it; then every finding reproduced again by the author before it was acted on:

| Lane | Over | How |
|---|---|---|
| L1 - the law and the balance | `handsLaw.js`, `playerWeapon.js`, the swing, the formula, every blow between players | the real machine at 30/60/144/1000 fps, the real formula over 200k seeded rolls, the real rig, a seeded base-against-head comparison of every one-hand way of fighting |
| L2 - the sprite lane | `twoHands.js`, the Weapon Widget's clones, the running hands, `weaponRig.js`'s seam | the real rig with every mod switch in hand, the retail `WEAPON10.CIF` |
| L3 - the Morrowind lane | `mirrorRig.js`, `fpArm.js`, `mwFirstPerson.js` | the retail biped (`xbase_anim_sh.nif`) and the fixture arm, measured bone by bone |
| L4 - the integration | the hosts, the HUD, techniques, the tutorial, the lights, the wire, save and load | a base-against-head differential of 13 single-hand scenarios, with and without the Weapon Widget |
| L5 - the record, the pins and the process | Two-Hands.md, the Ledger row, the Testing rows, the mutants, the gates | scratch mutants of the slice's claims against its suites; the committed list re-run seven times |

And the owner's own (O1): the first pictures were drawn on the test suite's synthetic fist art, which stood the
running hands high; drawn again on the shipped `WEAPON10.CIF` (DFU's freeware game files, `tools/fetch-data.sh`) their
top edge is at least 60% down the view - and the probe found the painted arm below, which the stand-in art could not
show.

No lane found a one-hand way of fighting changed: a weapon, a weapon and a shield, a two-hander, a bow, the left hand
alone and the bare hand under H match the base exactly (L1's six hashes, L4's 13 scenarios). The findings are a balance
that held on paper and not in the machine, an off hand whose costs a key press or a blow between players skipped, a
share cut after the blow was reported, a sprite that drew the wrong arm, a run that held the screen after it ended, a
Morrowind pair that never drew its second weapon on the game's own skeletons, and pins that held less than they said.

Severity: **Blocker** breaks the feature or its balance for everyone; **Major** a wrong outcome many will meet;
**Minor** a cost, a corner or a word.

## Findings

| # | Sev | Finding | Verdict |
|---|---|---|---|
| O1 | BLOCKER | `WEAPON10.CIF` paints the bare hand's StrikeDown, StrikeLeft and StrikeUp on the LEFT arm; the slice mirrored every left-hand picture, so a left StrikeDown drew a second right fist and a right StrikeDown a left arm | FIXED: the painted arm (`MELEE_PAINTED_ARM`, `strikePicture`): a hand's picture chosen so the arm drawn is the hand that throws, on its side, by one mirror rule every draw shares |
| L1 1 / L4 1 | BLOCKER | Every blow between players (duel, siege, siege work, Royal Tourney, the open zone, the dungeon's) skipped the off hand's to-hit and share: a pair was plain extra blows, +17-33% a second | FIXED: `resolveDuelStrike`'s `off`, handed by every arm from the striking rig's `offStrike`; measured equal to the blow against a foe |
| L1 2 | BLOCKER | H between blows kept the exchange running: every blow a flurry's quickness thrown by the new lead, with no off-hand cost - x1.2 damage for a key press | FIXED: H ends the exchange (`toggleHand`) |
| L1 4 / L5 2, 3 | MAJOR | The balance's numbers held in closed form and not in the machine, which steps whole ticks: the pair x0.97 at 30 fps, x1.09 at 1000; at high Speed a loss; "the dagger is the off hand's natural blade" false | FIXED: a flurry starts at frame 1 (`FLURRY_FROM_FRAME`), the same at every frame rate; the share 0.8, the to-hit -5 by Agility in [-10, 0]; MEASURED through the machine in the pins; the record restated from the measurements |
| L1 3 | MAJOR | The off hand's share was cut after the formula had reported the whole roll: the HUD's number, a leech, an echo, Ruhn's Cleave, the feud ledger and the wear saw a blow a third larger than landed | FIXED: the share inside the formula (`calculateAttackDamage`'s `blowShare`), ahead of the wear and the report. OPEN: TECH1's `scaleBlowDamage` scales after the report the same way - older than this branch, its own fix |
| L1 5 / L2 8 / L4 5 | MAJOR | A lit torch took the left hand with Handheld Torches off, where no lane draws it: no second fist, no running hands, the pair back to one hand in every dungeon | FIXED: a light takes a hand only where a lane draws it there (`lightInHand`) |
| L2 1 | MAJOR | The left Weapon Widget clone stuck in its wind-up when the pair dissolved mid-blow (a torch lit, a quickslot): the left fist pushed off the screen until its next strike, which played the stale one | FIXED: the wind-up ends with the strike it shadows (`weaponWidget.js`) |
| L2 2 / L4 3 / L5 1 | MAJOR | The running fists held the draw seam about 1.1 s after something took the hands (a torch, a spell, a weapon): the torch and the weapon not drawn, the fists under the spell's hands | FIXED: a taken hand ends the run at once (`taken`); the ease plays only when the run ends with the hands still empty |
| L2 3 / L4 2 | MAJOR | The running hands never appeared with the Weapon Widget, Handheld Torches and Shield Widget off: the eye the ground speed is read from was tracked only under those mods | FIXED: the eye tracked every frame, above the mods' gate |
| L2 4 | MAJOR | With the Weapon Widget on, the left hand took the widget's Bob and Inertia sway in the mirror: the hands breathed apart walking and spread on a turn | FIXED: the mirrored hand's rect carries the sway in its own screen direction (`pairRect`) - the mod's own rule for a mirrored sprite |
| L2 5 | MAJOR | A punch thrown on the run was hidden for about 0.27 s | FIXED: the striking hand drawn by the pair over the running fists, from the punch's first frame |
| L3 1 | BLOCKER | On the game's own skeletons (no Weapon Bone Left) the Morrowind pair showed one weapon and the left hand never swung | FIXED: a Weapon Bone Left made by the mirror from the skeleton's own Weapon Bone (`offWeaponBoneAddon`) on every body; the composition stands on the pair being held, not on the blade being bound |
| L3 2 | MAJOR | An arm placed from another pose left the torso | FIXED: the mirror law in each bone's own frame, every arm's locals hung from this frame's parent - a twisted chest's shoulder 9.07 units off, now 0.00; and the first law's own slide (a mirrored knee, a shoulder 0.52 units, a finger 10% off its bone) gone with it |
| L3 3 | MAJOR | The carry that prevents pops eased every bone apart in absolute space: joints left their bones mid-carry | FIXED: carried per bone in its own frame - worst bone mid-carry 71% off its length, now 0.0%; the Shield Bone stays on its hand |
| L3 4 | MAJOR | The running hands jumped at the edges of a climb and when the map was raised | FIXED: the run solved under the climb in a slot of its own - onto the wall 1.19 -> 0.52 (the climb's own ease), a sheet up 1.05 -> 0.005 |
| L3 5 | MAJOR | A left-hand slash swept the opposite way to the one asked for | FIXED: a mirrored blow plays the mirror strike's backhand - the left hand's StrikeLeft the right's StrikeRight in the glass, frame for frame |
| L2 6 | MINOR | After the hands stopped being two mid-strike (a quickslot), the hand in use stayed the striking hand's: a bare fist drawn and struck while a katana was held | FIXED: `activeHand` the striking hand's only while the hands are two |
| L2 7 | MINOR | The pump kept its own clock, out of step with the head bob | FIXED: the stride on the HeadBobber's own timer (`runPhaseOfBob`, the motion bag's `bobTimer`) |
| L2 9 | MINOR | H with a pair up billed BowLeftHandWithSwitching's switch delay, a swap's, where nothing changes hands | FIXED: no bill with both hands up |
| L2 10 | MINOR | The left clone was stepped every frame of single-hand play, never drawn | FIXED: stepped while a pair is up or until it has settled hidden |
| L3 6-11 | MINOR | A view's arms starting stale; the pair's draw unmirrored where its sheathe is; the portrait's left blade by the view it was opened from; a failed left swap refused forever; a full mirror pass a frame; the running hands sliding with the look with follow-camera off | FIXED, each: a fresh carry takes its composition at once and a view switch resets it; the pair composed from the draw's first frame; the portrait shows the pair from either view; the failed swap tried again; no whole-skeleton matrices a frame (0.101 -> 0.011 ms, 302 -> 109 collections over 20k frames); the run laid on the pitched lens (0.40 -> 0.033 rad, the rest a fixture's unreachable targets) |
| L4 4 | MINOR | The enhanced HUD's hand plaque and a technique's weapon flipped to the off hand's item on its every blow (an aim cancelled) | FIXED: `restingWeapon` - the lead's - in all four hosts and the technique |
| L4 6 | MINOR | "A pair never meets a light" was false under Handheld Torches' RelaxedLanterns | FIXED: the record says when it does |
| L4 7 | MINOR | The Fighting tutorial still taught H as a swap | FIXED: "Two weapons or two fists both fight; H picks the lead" |
| L5 4 | MAJOR | A committed mutant was dead in 5 runs of 7: the classic test's strikes were random, and two of six click directions are their own mirror | FIXED: the suite's strikes seeded |
| L5 5 | MAJOR | The Weapon Widget lane, on by default, was pinned on which quads were mirrored, never on where they were drawn | FIXED: the arm each clone draws, its side and its sway pinned |
| L5 6-8 | MINOR | "1.2e-4" given as the pin (it is the measurement); the flurry window "half again" SWING_FRAME_MAX (it is nearly twice); the to-hit's wording against its rounding | FIXED in the record and the comments |
| L5 9 | MINOR | The slice rewrote numbers in two dated records no gate asked it to | FIXED: their numbers restored |
| L5 10, 11 | MINOR | Titles that claimed pins their assertions did not make; 13 documented behaviours no pin could fail (the stroke toward the middle, the grow, below the view, a spell, a swap, the beast, a waist lantern, a walk's bounce, the pair under the run, a fist and a shield, ...) | FIXED: each asserted, its scratch mutant re-run dead; the MW titles with L3 |

### Suspected, not reproduced

- A blow carried past its strike's end (a guard spawned on a cold load) resolves with the lead's terms: the same as
  any blow resolved at rest; not reproduced.
- A levitating player whose feet rest on a floor may read grounded and run the hands; not reproduced.
- Custom or Diverse Weapons fist textures: the run draws the classic frame; no custom texture was at hand.
- Two-Hands has no Features switch: it changes no one-hand way of fighting, and a pair is a choice the player makes by
  equipping two weapons. Left to the owner.

## Pinned

`test/twohands.test.js` (20) - every FIXED finding of L1, L2, L4 and L5 above, by execution through the real machine,
formula, rig and Weapon Widget; `test/twohands_mw.test.js` (23) - L3's, on the retail biped and the fixture arm, with
`tools/mutants/twohands_mw.json` (40, dead) and the twelve `twohands.json` records aimed into the Morrowind lane
re-run on its fixed code. Mutants: `tools/mutants/twohands.json` (110, 39 of them the audit's `TWOHANDS-AUDIT-*`: each
fix reverted, and L5's 16 scratch mutants of the record's claims, three of which still lived after the first fixes -
the sheathed run from below, the pair on the climb, one hand's H line - until pinned), every one dead. PIN MOVED
(AUDIT): `a12_lefthand` (the bow-switch arm on a bow in the left hand), `audit_seats_client` G5, `auditcc_pvp` H5 and
`duel_combat` DUEL1 (the off hand's terms between players), `enhancedHud` AUDIT 39 (the plaque reads the resting
weapon), `ww2_idlebob` WW2 (the motion bag's `bobTimer`); for L3, `climb6`, `fparm`, `reversedSwing`,
`fb1012b_headheld` and `ws1_sheathing`. Records re-aimed where the fixes moved their lines, each re-run:
`auditcc_pvp.json` (four), `climb4.json`, `duel.json`, and six of `twohands.json`'s own. Two `twohands.json` records
whose source L3 rewrote (`TWOHANDS-mirror-one-reflection`, `TWOHANDS-arm-off-weapon-any-node`) moved to
`twohands_mw.json`, re-aimed.

# Weapon Glow - a weapon's element, drawn in the hand (WEAPON-GLOW1)

`src/systems/weaponGlow.js` (the law) + `src/render/weaponGlowGlsl.js` (the drawing, a leaf) + `src/render/renderer.js`
(`drawScreenQuadGlow`, `_drawWeaponGlow`) + the hands: `src/combat/weaponRig.js`, `src/combat/fpsWeapon.js`,
`src/combat/weaponWidget.js`, `src/combat/fpArm.js` + the wire: `src/net/wire.js` (`LOOK_GLOW_RE`),
`src/net/remotePlayers.js`, `src/net/peerBodies.js` + the switch: `src/systems/features.js` (`weapon-glow`)
(the owner, 2026-10-16)

> "So you know how theres the weapons that have that magic outline with the sprites? What if we designed our own sort
> of animated outline for each element? And even introduced the same, more detailed design for the morrowind
> weapons?"

> "No, this is your baby. I want you to make the decisions and take this on. Im not worried about DFU parity. Keep
> everything in one PR."

## What it is

A weapon whose blow carries fire, frost or shock - the loot ladder's `elemental` line (LOOT4,
`06-Systems/Loot-Arc.md` section 6) or a Ruby's or a Sapphire's gem (`06-Systems/Gem-Sockets.md`) - wears an animated
outline of its element in the hand: fire's tongues climb off it, frost's rime breathes and glints, shock's edge
crackles and throws arcs. The classic sprite draws it in the sprite's own pixels; a Morrowind weapon draws it round its
model, and lights its own surface with the element besides. A Morrowind weapon that is enchanted and shows no element
takes the arcane glow - the enchanted look the classic hand takes off its WEAPO1xx sheet. Other players see a glowing
weapon on a Morrowind body as its owner sees it.

## Before

Daggerfall says one thing about a weapon in the hand: enchanted or not. ItemHelper.ConvertItemToAPIWeaponType promotes
an enchanted item to its `*_Magic` type, and the rig swings the WEAPO1xx sheet - the same frames, painted with a glow
(`combat/fpsWeapon.js` `weaponTypeForItem`). The port's ladder weapons carry more than that, and the hand said none of
it: a Magic blade with "+3 Fire damage" carries no DFU enchantment, so it swung the plain sheet; a Rare swung the blue
glow whatever its element; and every Morrowind weapon swung bare - `02-Formats/Morrowind-Rules.md` recorded the
reference's enchantment glow as not ported.

## The laws (`systems/weaponGlow.js`)

1. **The element is the blow's.** A weapon's element is what its blow carries: its `elemental` lines, rolled or
   socketed, read as the blow reads them (`lootRarity.js` `readLines` - a gem's line within its piece's cap; the same
   reader `lootPowers.js` `linesOf` hands `lootBlow`). Nothing else names one: a Legendary's power (Venom, Dragonfire,
   Chain Lightning) is its record's own, and a cast-when-strikes enchantment is a spell.
2. **One element shows** - the most of it; a tie goes in `PROC_ELEMENTS`' order (fire, frost, shock).
3. **Its strength is the band it reads in**: level 1 for a Magic line's 1-3, 2 to the top of a Rare's (6), 3 past it -
   the Legendary band, or a line and its gems together (`GLOW_LEVEL_EDGES`, the bands' own edges).
4. **The outline says no more than the card.** An unidentified piece's lines are hidden (`rarityKnown`), and the hand
   hides its element with them: the classic hand swings what DFU swings (the WEAPO1xx sheet - the piece is enchanted),
   the Morrowind hand the arcane glow.
5. **Arcane is the Morrowind hand's own**: an enchanted weapon (`inventory.js` `isEnchanted`) with no element showing.
   The classic hand's enchanted look is its sheet; a Morrowind model has no second sheet, so it is drawn.
6. **The switch**: the Features row Weapon glow (`weaponGlow`, on by default; `?weaponglow=off` the kill door), read
   every frame. The loot ladder's own switch answers first: off, no line is read, so no element shows.

## The looks (`render/weaponGlowGlsl.js`)

An element's glow is an outline that lives: a band round the weapon's silhouette, hottest at the edge and cooling
outward in four steps of the element's ramp (`weaponGlow.js` `GLOW_RAMPS` - Daggerfall's way with light, a few palette
shades, never a smooth blend), its REACH - how far the band stands off the edge - moving:

| Look | Metric | Reach | Its life |
|---|---|---|---|
| fire | stretched up 1.8x, cut to 0.6x below | (1.2 + level) x two octaves of value noise, scrolled up the screen | tongues climb; an ember drifts up off the top now and then |
| frost | square (Chebyshev - ice is angular) | 0.8 + 0.8 x level, still spikes where a cell's hash says, a 3 s breath | a crystal glints white for a fifth of a second |
| shock | diamond (Manhattan - jagged) | 1.6 + 0.3 x level, arcs out where a stepped noise peaks, a surge a few times a second | the band crackles in 2x2 blocks twelve times a second |
| arcane | round | 1.6 + 0.6 x level, a slow wave | an even halo that turns |

Inside the silhouette the weapon's own edge takes the element's light (the rim), so the outline reads as the weapon's
and not a sticker behind it.

**The clock** wraps at `GLOW_CLOCK_PERIOD` (240 s), and every rate is whole over it: a scroll's noise is periodic in y
over exactly the cells a period scrolls (`gwNoise`'s `py`), every pulse turns a whole number of times, every stepped
hash counts whole steps - so the wrap is a frame like any other. A wall clock (`renderer.js` `glowSeconds`), as the
elite foes' glow is: a look, the same in every pass.

## The two drawers

**The classic sprite** (`Renderer.drawScreenQuadGlow` - THE FOURTH 2D PRIMITIVE, beside `drawScreenQuad`,
`drawScreenQuadRun` and `drawScreenOverlayQuad`; `test/glstate.test.js`'s source law lists it). Drawn over the frame
`drawScreenQuad` just drew, on the same rect and mirror: the quad grows by the look's search window
(`GLOW_SPRITE_WINDOW` - fire looks thirteen rows DOWN for a solid texel, a flame stands over its weapon), and the
fragment reads the frame's own texels (`texelFetch`, the frame's size off `textureSize`) and measures each one's
distance to the nearest opaque texel in the look's metric. Evaluated per texel, so the outline is in the sprite's own
pixels; premultiplied, blended ONE, ONE_MINUS_SRC_ALPHA; emissive - the room's light (MAC-I's tint) never dims it. All
three classic drawers take it: the sprite (`drawFpsWeapon`), Weapon Widget's clone (`weaponWidget.js` `draw`) and the
Thunderlock (`weaponRig.js` `drawThunderlock`).

**While an element shows, the classic hand swings the PLAIN sheet** (`fpsWeapon.js` `plainWeaponType`, the `*_Magic`
promotion undone, and Diverse Weapons asked its plain set - `diverseWeapons.js` `moddedWeaponFilename`'s `enchanted`):
a fire outline round the blue-painted WEAPO1xx frames said two things at once. The rig asks once a frame
(`weaponRig.js` `heldGlow`, beside `syncWorn`) and the art's choice, its cache key, its loader and the clone's type all
read that one answer.

**The Morrowind mesh** (`Renderer._drawWeaponGlow`, inside `drawCharacter`, in a sprite pass alone - the arm's
picture and a third-person body's tile; the world pass and the inventory figure draw none). `fpArm.js`
`setWeaponGlow` hands the spec to the arm, which lays it on the mesh it draws (`mesh.weaponGlow`, first person and
third), and the renderer lights the weapon's own shown ranges (`slot` 'weapon' - never the nocked arrow, never a
sheathed blade):

- **The outline** - BEFORE the body. The weapon's ranges again per draw of `glowRingDraws`: shifted in screen space
  round twelve directions at each of four distances (`GLOW_RINGS`, in glow units - a Daggerfall pixel at the pass's
  height, `GLOW_UNIT_ROWS`), so the union of a ring's copies is the silhouette dilated to its band and the ring's
  fragment knows its band without searching; fire's shifts stretched up, and its embers three more shifts straight up.
  At the BACK of the pass, depth-written, an outer ring farther than an inner: a shifted copy of a tilted blade can
  stand nearer than the blade's own surface at a pixel, and drawn after the body the rings painted over the weapon
  they outline (the probe saw it, below). Opaque, because the arm's composite cuts at half alpha
  (`drawScreenOverlayQuad`).
- **The charge** - after the body. The ranges once more, additive with alpha masked (the composite's cut stays the
  body's), at the body's own depth (LEQUAL, a hair toward the eye - its vertex shader is another program's arithmetic):
  lit at its rim off the face's own normal, and patterned by its element - fire boils up the screen, frost is facets
  that glint in turn, shock is veins that jump twelve times a second, arcane a slow swirl. The detail a model can
  carry that a 2D frame cannot.

The program is the character program's skinned vertex shader with the shift after its own position (`glowMeshVs`,
which refuses a source without exactly one of each needle, as `skinFaceFs` does), so a GPU-skinned body's weapon glows
where it is drawn. A third-person body's window grows by `GLOW_BOX_GROW` while its weapon glows (`fpArm.js`
`drawThird`): the drawn weapon is often the box's edge, and the outline stands off it. Every state is handed back as
`drawCharacter` keeps it.

## Online

The affixes that decide a glow never travel, so the look says it: a held weapon's item carries `glow`, a word -
`fire2`, `arcane2` (`weaponGlow.js` `glowWord`; `wire.js` `LOOK_GLOW_RE`, `validLookItem`) - written by
`remotePlayers.js` `composeLook` from the owner's card (law 4 holds: the owner's knowledge), whatever the owner's own
switch says. A weapon's alone, a PLAYER's look's alone (a foe's kit is said on its record - `foeBodies.js`
`encodeWorn` - which carries no glow, so a foe's weapon glowing on the host's screen alone would be one fight seen two
ways), and OMITTED when none, `class`'s law: a plain weapon's item keeps the bytes it always had. A glow changing (a piece identified, a gem set) is a new look, sent by `setLook`'s compare. A peer's Morrowind
body reads the word off the look NOW (`peerBodies.js` `_arm` - the same template in the same hand is a new look) and
glows by the VIEWER's switch. The relay bundles `wire.js`, so a relay deployed before this keeps stripping the word
until it is deployed again: until then a peer's weapon draws bare, and nothing else changes.

## Departures, named

- **ConvertItemToAPIWeaponType's promotion is undone while an element shows** (`plainWeaponType`): DFU has no element
  to show. With the switch off, or an element hidden by the card, the hand swings exactly what DFU swings.
- **The Morrowind enchantment glow is the port's own.** The reference (`02-Formats/Morrowind-Rules.md`:
  npcanimation.cpp's weapon part, `addOrReplaceIndividualPart(..., enchantedGlow, &glowColor)` with `glowColor` the
  enchantment's effect colour) lays an animated texture from the player's archives over an enchanted part, coloured by
  its first effect. The port draws its own, from no archive: an element's look where the blow carries one, the arcane
  glow where it does not.
- Ledger A, WEAPON-GLOW1.

## Not done

- **The holstered weapon** (Weapon Sheathing, `06-Systems/Weapon-Sheathing.md`) does not glow: it is a part of its
  own, not the `weapon` slot, and the reference's glow on it is not ported either.
- **A classic-lane peer** (a billboard, Eye Of The Beholder's sprite) draws no glow; nor does a foe's weapon, nor the
  inventory's figure.
- **A Legendary's elemental power** (Venom's poison, Dragonfire) shows nothing of its own (law 1).

## THE FOUR HOSTS RULE

Nothing in a host changed. Every host builds its rig through the one construction seam, `createWeaponRig` - the
exterior bench (`scenes/exterior.js`), the streaming world (`scenes/world.js`), the interiors
(`scenes/worldModes.js`) and the dungeons (`scenes/dungeonContext.js`) - and the rig asks the glow, draws the sprite
and hands the arm its spec in every one. A peer's body glows wherever `peerBodies.js` draws it.

## Verification

- `test/weaponglow1.test.js` - the law off producer-minted weapons (`applyRarity`, `addProcLine`, `setGem`), the plain
  sheet, the sprite drawer's order and rect, the fourth primitive and the Morrowind pass against a recording GL stub,
  the rings, the vertex shader's edit, the clock's rates, the wire both ways. Its mutants:
  `tools/mutants/weaponglow1.json`, twenty, all dead.
- `tools/weaponGlowProbe.mjs` - the looks through the REAL renderer in headless Chromium (SwiftShader), on art that is
  not game data: a pixel sword drawn by the probe and a sword mesh built by it. Top row the sprite's outline (fire,
  frost, shock, bare), bottom row the Morrowind pass (fire, frost, shock, arcane), at levels 1 and 3. It is how the
  rings were found painting over the blade (drawn after the body) and moved to the back of the pass, and how fire's
  reach and shock's arcs were tuned. Not run on ARENA2's frames or the Morrowind archives here: neither is in this
  repository.

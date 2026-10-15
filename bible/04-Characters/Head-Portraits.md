# Head Portraits - the face as a picture of the Morrowind head

`src/combat/fpArm.js` (headPortrait, headFrame, faceMatchOf - the picture and the one face door) +
`src/characters/headPortraits.js` (who is asked, by which gate) + `src/render/portraitRenderer.js` (the renderer the
menu's wells borrow) + the doors: `src/ui/facePortrait.js`, `src/ui/nativeTalk.js` (setNpcPortrait),
`src/scenes/townTalk.js` and `src/scenes/worldModes.js` (the talk doors), `src/ui/hudLarge.js`, `src/ui/chargenArt.js`
(PORTRAIT3D, the owner, 2026-10-15)

> "Btw I know I dont have the rest of the races faces, but can we do the other races with 3d portraits also?"

Asked which of two things that meant - hand-picked heads per portrait for the other races, or the portraits themselves
drawn as the 3D head - the owner: "#2 is exactly I wanted. Which also affects the talk window for npcs".

## What it is

With Morrowind's data attached, a face Daggerfall paints is drawn as the head and hair the body wears, every race:

- **The player's face** - the save tiles and the realm's, the profile mark at the door and at pause, the account card,
  the enhanced chargen's grid and review (all through `ui/facePortrait.js`, the faces' one home, TILE1), the large
  HUD's head, and the classic chargen's face picker and summary. Gate: Morrowind's data attached, the switch the
  player's own body stands on (MWA4, either skin).
- **An NPC's face in the talk window** - the classic window's 64 x 64 PORTRAIT_RECT and the enhanced panel's face. Gate:
  the people standing in Morrowind bodies (`npcBodiesOn` - the enhanced skin, the data, Morrowind People not Off), so
  the face is the head on the body that stood there.

Every door keeps its classic record until the picture lands, and for good where none is drawn: no data, no renderer
yet, a race with no head in hand, a mesh or a texture that did not come. Nothing about a face is stored.

## The one face

The head and hair are the body's own, chosen by the same code: `faceMatchOf` is the build's face door moved out of
`buildFpArm` whole (the curated table, the measured match kept per data set, the walk), and `playerBodyRows` picks the
rows. A player's portrait `faceIndex` is the portrait's head (a Breton man's portrait 6 the eyepatch); an NPC's head and
hair are walked off its seed (`npcFaceOf`, MWNPC17), read from the look its body is built from through `peerBuildOpts` -
a walker's (`person._mwFolk` / `person._mwRes`, folkBodies.js and rosterBodies.js), a static NPC's (`personLook`, the
click's NPCData mapped to its person), a kin's own. A vampire's look wears the race's vampire head. A creature's look
and a wolf's have no face here, and a child, a daedra or an editor flat - who stand in no body - keep their record.

## The picture

`headPortrait` reads its own catalogue - the archives and every `.esm`'s BODY records by the derived door the build
takes, one per data generation - so it stands before any body is built: at character creation and on the title
screen's saves. Head and hair are RIGID parts in the head bone's own frame, +Y the face and +Z the crown (mwFaceMatch
headFeatures), so the two meshes render together with no skeleton, each its shapes as the binder keeps them (the
hair's filtered on "hair", npcanimation.cpp:801; nameless shapes kept). `headFrame` stands the eye before the face
(NIF_TO_PASS turns it to -Z), the orthographic window the projected box with 8% air and as wide as the picture asked -
each door asks for its record's own shape: the HUD's 33 x 30 at four times, a face well's record at twice, the talk
window's square. It is lit as the inventory's figure is (`renderCharacterSpriteImage`, the studio light), on a
transparent ground, and read back once: one picture per head and hair, size and data generation, the promise shared
(NPCs who wear one head share one picture, and the talk window one texture). A miss is not kept (AUDIT 32 F3's law).

The menu's wells hold no renderer, so the entry hands its one Renderer to `render/portraitRenderer.js` at boot, behind a
door (BOOT2's ceiling).

## The doors

- `ui/facePortrait.js`: `loadFace` and `loadFaceCanvases` draw each face as its head on a canvas the record's own size;
  a face is drawn alone (a save tile renders one, not ten). The classic set still addresses every index (AUDIT-312 F5).
- `ui/nativeTalk.js` `setNpcPortrait(archive, record, { picture })`: the record first, then the head under a key of its
  own (`<file>#<record>#mwhead<n>`) once it lands - the enhanced panel repaints on the key - and only for the session it
  was asked for. The classic window draws it in PORTRAIT_RECT at its own resolution, as a mod's portrait (DFMOD1).
- `scenes/townTalk.js` `portraitOf` carries the walker's look; `scenes/worldModes.js` `staticNpcPortrait` the static
  NPC's (`talkedTo`, the click's NPCData to its person).
- `ui/hudLarge.js` `loadHudLargeHead`: the curse's override heads first, as DFU's order has them, then the Morrowind
  head; its key reloads as the data comes and goes.
- `ui/chargenArt.js` `loadFaceSet`: the ten records first, each upgraded in place as its head lands, drawn at the
  record's size.

## What it does not do

- The party panel, the family and succession pages, the escorts' faces and the tab dial's door keep their records.
- A worn helm is not drawn: the portrait is the bare head and hair.
- A cursed player (a vampire, a werewolf) keeps the classic curse heads on the HUD; the other doors show the face.
- The head stands alone, no neck or shoulders, on a transparent ground; the classic window shows its own art round it.
- Where the curated table or the walk gives two portraits one head and hair, the chargen grid shows the same head twice.
- Not seen on retail Morrowind data here: the container holds none. The port's own Breton heads were rendered through
  the real renderer in a real browser (`tools/headPortraitProbe.mjs`): face-on, upright, the head 43-49% of the frame.

## How it was proven

`test/portrait3d.test.js` (8), on the port's own Breton heads read off the disk under a counting renderer: the frame
face-on (the eye on -Z, the crown up), every corner in the window with air, as wide as asked; the portrait the head and
hair the curated table names for portrait 6, every range textured, in metres in the pass frame, the mesh and every
texture let go; a hair part's shapes filtered as the binder filters them (a synthetic hair with a stray shape); one
picture per head and hair, another size another picture, another generation drawn anew, a miss asked again; an NPC's
head walked off its seed, each step its own; no renderer, race, data or head - no picture; the gates; the talk window's
key, its one texture a picture, a late head landing on no one; and the doors by source. `tools/mutants/portrait3d.json`
(12, all dead).

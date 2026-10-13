# Own Heads - the port's own heads and hairs for the Morrowind body

`tools/bakeHeads.mjs` (the bake) + `tools/fbxMesh.mjs` (one material of an object, `material`) +
`src/characters/ownHeadModels.js` (the pools) + `src/formats/mwFirstPerson.js` (facePools) +
`src/formats/mwFaceTable.json` (the curated portraits) + `src/tools/mwViewer.js` (the face sheet) (MW-HEADS1, the owner,
2026-10-13)

> "Everything we are doing is for the morrowwind model. This batch is for breton"

with `daggerwind.fbx` (committed as it came, as `src/assets/mw/source/Breton_Heads.fbx`) and six paintings sent as
attachments with no names. Asked who wears them, the owner took the recommendation: **every Breton man** - the three
heads and three hairs replace Morrowind's own Breton men's heads for townspeople, NPCs and a Breton player, and the
player's ten chargen portraits are mapped by likeness onto the nine pairs, portrait 6 the eyepatch.

## The export: three heads, three hairs

Three objects - `b_n_breton_m_hair_widow`, `b_n_breton_m_head_05.002` and `.003` - each a face in a head painting and a
hair in a hair painting, two materials of one object. To the game they are what Morrowind's own are: a head part and a
hair part, each its own file, worn in two slots (PRT_Head and PRT_Hair) and chosen each on its own. So each material is
baked on its own (`fbxMesh.mjs` bakeMesh's `material`: the polygons of that material and no other - every existing
bake byte for byte as it was), into six rigid NIFs `breton_m_head_h04`, `_h0411`, `_h0423` and `breton_m_hair_widow`,
`_01`, `_0111`, each naming its own DDS.

**The head's own frame.** A retail head or hair is a rigid part hung under the skeleton's "Head" node
(`02-Formats/Morrowind-Rules.md` rules 5, 12 and 13), its geometry in that node's frame. The three faces share one such
frame - the same crown (z 7.66), sides (x +-4.78) and back (y -6.95), though h04 is a different mesh with a sculpted
beard - so the frame is the source head's (`b_n_breton_m_head_05`, the names say), and each part is baked in it: the
object's scene placement taken back off (`partFrame`), never re-centred or scaled. The owner's scene stood the three at
z 125 over its floor, 3.45 over the T-posed scene's own head (MW-STEEL1's SCENE_BODY) - inside the 3.24 to 4.25 that
MW-STEEL5 read the game drawing a retail head over that same head (`tools/helmLiftProbe.mjs`): the same height, read
two ways.

**Every hair over every head.** All three faces share the crown, so every hair sits on every head: from the frame's
origin, a ray through each scalp vertex (above the brow and behind the face) meets each hair no nearer than the scalp,
to 0.05 - three heads times three hairs, nine faces.

## The paintings

The export names each material's picture (`tx_b_n_breton_m_h04.png` and so on); the attachments carried no name and no
metadata. Each part is read by its material AND held to that name (`objectMaterials`), and each painting was matched to
its name by what it is drawn for:

- **The hairs - certain.** The red band paints the headband's own island (0111); the widow's peak runs along its own
  hair's island (widow); the third is the 01.
- **The eyepatch - h0423, by the export's pairing.** The eyepatch is the one face painting that is not mirror-even, so it
  wears a full-face layout; h0411 and h0423 share theirs texel for texel (h04's mesh takes half of it, the face's two
  sides on the same texels), so the layouts cannot tell them apart. The export pairs h0423 with the red headband (object `.003`), and an eyepatch and
  a headband are one look: h0423.
- **h04 and h0411 - judged.** The two plain faces - a black-and-grey beard and a brown one - fit either mesh alike: both
  paintings are near mirror-even, both paint beard over h04's sculpted chin (all 32 of its vertices that stand off the
  other faces' surface), and the detail of each falls in the same share of each layout. The black-and-grey painting is
  h04, its full beard over h04's own fuller sculpt, by eye on the renders; **the owner's to confirm** - a swap is two
  lines of `bakeHeads.mjs` PAINTINGS and a re-bake.

Whether the geometry is wholly the owner's own work is also the owner's to confirm: its objects are named for the
Morrowind head they were modelled from (`test/doctrine.test.js` says so on every row).

## Worn

`ownHeadModels.js` OWN_HEADS holds the Breton men's pools, in id order, as BODY-shaped records (a skin part of a race and
a sex, playable, its slot, its model the shipped file's name). `facePools` answers them for a Breton man **in place of
the data's**, so every door that chooses a face chooses among them, on the doors it always used:

- **an NPC's face walked off its seed** (`characters/wardrobe.js` npcFaceOf, MWNPC17): all nine pairs reached;
- **the player's curated face** (`mwFaceTable.json`, which wins first): portrait 0 h0411 + 0111, 1 h0411 + widow,
  2 h04 + 01, 3 h04 + widow, 4 h0411 + 0111, 5 h04 + 0111, 6 h0423 + 0111 (the eyepatch, with the export's own
  headband), 7 h0411 + 01, 8 h0411 + widow, 9 h04 + widow - each by likeness to Daggerfall's Breton portraits;
- **the measured match** (MW-D35) and the face index's walk below it choose among the same pools - though for a Breton
  man the curated ten answer every portrait;
- **a Breton vampire** wears the race's vampire head (`b_v_breton_m_head_01`, the data's) over them, his hair his own.

A Breton woman, and every other race and sex, keeps the data's. The viewer's face sheet (`mwViewer.js`) - the page the
table is authored against - sheets no race and sex the port's own stand for, and names them in its status.

THE FOUR HOSTS (rule 17e). Every body - the player's, a peer's, an NPC's, a foe's - takes its head and hair from
`playerBodyRows` through `facePools`, so scenes/world.js, scenes/exterior.js, scenes/worldModes.js and
scenes/dungeonContext.js are all WIRED through the shared build, and no host's code changed.

## What it does not do

Nine faces where Morrowind's data gives a Breton man forty-eight: his faces repeat more often until more batches come.
Breton women's heads are not in this batch. The first person draws no head or hair (rule 7), so nothing changes there.

## How it was proven

`test/mwheads1.test.js` (5): every head and hair re-made from the committed export and its six paintings byte for byte,
each DDS its painting, the export and each painting by hash, each painting under the name the export gives its
material (a material read as another's picture, and a part off its box, refused); each part one rigid shape of its own
material in the head's own frame, its polygons its material's alone, the three faces' shared crown, sides and back,
the owner's scene height against MW-STEEL5's reading; every hair over every head's scalp; the pools, the data's
ignored for a Breton man and kept for a Breton woman and a Nord, the curated ten, the walk's nine pairs, the vampire's
head, and the viewer's sheet by source; and through the binder a retail head takes, six rigid pieces under the Head
node, unmirrored, their own geometry, no note. PIN MOVED: `test/mwnpc17_wardrobe.test.js` MWNPC17d's walk and
MWNPC17e's street re-aimed from the Breton men (whose pools are the port's own now) to the Nord men, and its memo pin
read with MW-FOLK1's outfit key. `tools/mutants/mwheads1.json` (9, all dead).

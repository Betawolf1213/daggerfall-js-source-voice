# The Jungle of Bantha (BANTHA1, 2026-10-18)

**The owner's call (2026-10-18), with `jungle_trees.zip`: "Bantha, north of daggerfall is going to be the first region in
the continent to recieve a biome expansion. Using the attached file, populate the area in a dense jungle like format.
When traveling inside the area there should be a fog-like haze that reduces visability. This needs to be insanely
detailed and not hurt performance. No band aids."**

Bantha (MapsFile region 10, POLITIC 138) stands as a jungle in four storeys - the owner's five trees closing a canopy
overhead, emergents above it, young trees and palms in its light gaps, ferns and flowers on its floor - under a humid
haze that is thickest at dawn and in the rain, thins as the player climbs out of it, and drifts. Its edge is no line:
the trees come in as stands and the air closes over a kilometre. Inside it, the haze hides the streamed world past a
kilometre or so - and what it hides is not drawn, so the jungle pays for itself. Its own Features row (`bantha-jungle`,
the World tab's Land section), on by default; forced on online.

## The owner's trees

`src/assets/jungle/source/` holds the zip as they handed it over, byte for byte (`test/tooling/doctrine.test.js`'s
SUPPLIED rows): five Blender 5.2 OBJs, their MTLs and one 252x164 RGBA picture each, cut by its alpha (every texel 0 or
255, a stray 1 in one). Nothing is baked: the game fetches the fifteen files the first time a pixel stands a jungle tree
(~0.24 MB) and reads them (`world/jungle/jungleModels.js`, `systems/jungleTreesAssets.js`).

| Species | File | Tree record (archive 500) | Triangles | Height | Crown reach | Foot | Crown from | Trunk |
|---|---|---|---|---|---|---|---|---|
| banyan - aerial roots hung from a wide dome | `jungle_tree` | 12 | 132 | 22.54 m | 8.73 m | 8.30 m | 3.00 m | 0.50 m |
| kapok - a buttressed column under layered parasols | `jungle_tree2` | 13 | 103 | 21.41 m | 9.63 m | 8.53 m | 9.00 m | 0.99 m |
| fig - a strangler's braided trunk, a round crown, vines | `jungle_tree3` | 14 | 156 | 22.53 m | 9.42 m | 7.58 m | 8.00 m | 1.10 m |
| flame - palmate leaves, red blooms, moss curtains | `jungle_tree4` | 15 | 156 | 16.23 m | 7.80 m | 5.60 m | 3.00 m | 0.50 m |
| mahogany - a twisted trunk under a tall, dense crown | `jungle_tree5` | 16 | 261 | 22.54 m | 9.48 m | 6.37 m | 8.00 m | 1.33 m |

**Read.** Each polygon fanned into triangles, each distinct corner one vertex (f32 x 8: position, normal, uv - Low Poly
Trees' own layout). An OBJ is right-handed and the port's meshes are Unity's, so each tree is **mirrored in x** as Unity's
OBJ importer mirrors it - the tree stands as they drew it, never backwards - and **moved so its root** (the middle of its
lowest 2.5 m) **is the origin**: one tree stood 34 m off the origin in their scene. Their ground (y 0) is kept, so the roots they
sank stay sunk. Each face is **wound as its normals say** (the mirror reverses a fan; the kapok's export had turned its
faces and its normals apart, 99 of its 103 triangles - read so, its light and its faces agree again). Every material is
drawn on both faces and cut at a half.

**Measured.** A tree's foot, crown, crown's start and trunk are read off what it DRAWS - its picture's opaque texels
carried onto its faces in 3D (`measureTree`, every 0.1 m of every triangle), never its cards' corners, which reach far
past the leaves cut into them. The table above is `JUNGLE_MEASURES`, the stream's own (no picture is decoded to stand a
tree); the test measures the files again and holds the table to them to the centimetre. The foot is what a road keeps
clear of; the trunk and the crown are the tree's cover.

## Where the jungle is

`world/jungle/jungleRegion.js`. DFU's political map names a region per map pixel (819.2 m), so a region's edge is a
staircase of pixel edges. Here each pixel near the region carries its **signed distance** from the edge - from its centre
to the nearest square of the other side, positive inside, held at six pixels (`jungleField`) - read the first time a
pixel is asked, ring by ring out from it until no nearer ring can beat what it found, and kept: no boot or frame sweeps
the map (a whole-map sweep cost 30 ms cold on the main thread; the stream's pixels cost about 0.1 ms each, once). Read **bilinearly between pixel centres** the field crosses zero on the shared edges and
rounds the staircase's corners; two octaves of the ecotone's own integer-hashed value noise (`ecoNoise`, cells of 64 and
8 tiles, 150 m and 40 m) **wander** the line, so it bends through the land. The same `jungleDepthAt` runs on the terrain
worker (a job carries its pixel's 3x3 of distances, nine numbers) and on the main thread, and agrees across every pixel
edge exactly. Two shares read it: the layout's (`JUNGLE_EDGE`: none 60 m outside the line, whole 480 m inside) and the
haze's (`JUNGLE_HAZE.edge`: none 320 m outside, whole 760 m inside - the air drifts out past the last trees).

## The layout - four storeys

`world/terrain/jungleNature.js` `withJungle`, run by the terrain kernel (`world/terrain/terrainGen.js`) over the pixel's
own layout (DFU's scatter or Real forests, and the ecotone's border). A tile is the jungle's where the share beats the
tile's own draw - so the jungle comes in at its edge as stands that grow and join - and the pixel's own flats on it give
way. Every draw is a hash of a WORLD tile or cell (FOREST1's `tileDraw`): a tree stands where it stands whatever was laid
before it, on every client and on the worker, so Logging's trees stand where the room sees them.

| Storey | Law | Numbers (`JUNGLE`) |
|---|---|---|
| Canopy | a cell of 2 x 2 tiles (12.8 m) stands one tree somewhere in its middle 60%, unless a glade or a place's clearing opens it | 90% of whole cells; scale 0.80-1.18 |
| Emergents | of the canopy, the kapok's parasols and the mahogany's dome alone stand above the rest | 8%; scale 1.28-1.55 |
| Understorey | young trees on a tile's own dice, thicker in a light gap (a cell with no canopy tree) than under a crown; never within 4.5 m (at the trunk's scale) of a canopy trunk in its cell or a neighbour's | 10% a tile, 38% in a gap; scale 0.36-0.62; flame 50%, fig 25%, banyan 15%, mahogany 10% |
| Mid storey | one of the rainforest's own Trees - World of Daggerfall's Tree records of archive 500, its palms (Low Poly Trees' 3D palms where that mod is on) | 2.5% a tile |
| Floor | the rainforest's own cover - archive 500's other records, its ferns, shrubs and flowers - denser in a glade's light; never within 2.2 m of a canopy trunk | 50% a tile, 68% in a glade |

**Species.** A canopy tree's species is drawn from weights (`canopySpecies`): a base (`JUNGLE.base`), a **grove** - each
species' own value noise over 24-tile cells, so a slope of figs gives way to a stand of mahoganies - its **ground's
height above the beach** (banyans and figs crowd the wet lowland under 25 m, kapoks and mahoganies the uplands over
120 m), and **light** (the flame tree takes a glade's edge, its weight times 1 + 3 x light).

**Glades and clearings.** The forests' own field read 4096 tiles away (`gladeField` - its lattice the world's, every
fourth tile, 1,089 samples a pixel) opens about a tenth of the land; FOREST1's places pull the canopy back into fields
round a town, a farm or a tavern and close it round a dungeon, a ruin or a shrine; the location's rect and every place's
footprint, widened by DFU's clearance, stand nothing.

**What it never stands on.** A track or a river the road painter laid (its `paths`), a slope over 34 degrees (DFU's 50
for everything else - a 20 m tree on a cliff reads wrong), any ground but dirt, grass or stone (their shares 0.7, 1 and
0.2), under the beach line. Beside a road (VERGE1's clear roadsides) a jungle tree keeps its **foot** off it - its roots,
buttresses and the curtains it hangs to the ground, at its own scale - never its crown: a road is cut through the
jungle, and the canopy may close over it.

**Cost.** A pixel wholly jungle stands about 3,100 canopy trees, 1,500 young trees, 140 palms and 6,500 plants - about
11,300 flats against Real forests' wooded ~10,000 - laid on the terrain worker in 13-35 ms warm (the kernel's own nature
is ~25 ms), never on the frame's thread.

## The trees in the game

**One door, two sets** (`systems/lowPolyTreesAssets.js` `createLowPolyTrees`'s `treeSet`). The jungle's door is Low Poly
Trees' own over the owner's files - its pictures decoded, never painted from the player's records - so a jungle tree is
held, drawn near as its 3D tree and far as its own far picture, handed over across the band on the port's one Bayer
screen-door, swayed by the wind (WIND3 and Windfall's law by its Tree record), lit by the far picture's law at night and
the sun's by day, cast in shadow by its far picture, felled and given back exactly as a low-poly tree is. THE ONE
CONSTRUCTION SEAM asks the door for it (`world/naturePicture.js` `junglePicture` - beside `naturePicture`, the only file
that asks a door for a far picture). Its far picture is drawn once a species from the side at 8 texels a metre and uploaded as a flat of
archive 500 (`jungle-<species>#lpt`), its batch sized for the tallest emergent (`JUNGLE_SCALE_MAX`, 1.55) with each tree's
own scale on its corner; its near set takes the layout's own scale (`buildTreeSet`'s `own`) and lptVariety's turn.

**The renderer's second tree slot** (`render/renderer.js` `setLowPolyTrees(frame, slot)`): slot 0 is Low Poly Trees',
slot 1 the jungle's; each slot's trees are drawn with its own buffers, and a far picture gives way to its OWN slot's trees
at that slot's radius and band; both are spent in the call.

**What the flat is** (`scenes/pixelBuild.js`). A jungle tree is a flat of the rainforest's archive with one of its Tree
records, in a group of its own (`J<species>`): it is **Logging's** (the pixel's forest - `scenes/treeHost.js standTrees`
stands the day's trees at it; felled, it sinks and falls as its far picture), **cover** at its own trunk and crown
(`jungleCover`, TACT1's trunk-and-crown shape), **flora** that sways, and the far rings (MAC1) stand it by its own
height. A pixel HOLDS its far pictures' handles (`jungleTrees`'s, and BUILD-FAIL1's ledger `jungleHandles`) and lets them
go with it (`scenes/treesHost.js` `released`, `releasedBuild`). Should the owner's files not load, every jungle tree
stands as the Tree record it carries - never an empty jungle, never a Logging node at an invisible tree.

## The haze

`render/hazeGlsl.js` (the shader's law), `world/jungle/jungleHaze.js` (its numbers and its CPU twin, term for term),
`scenes/jungleHost.js` (each exterior frame's).

**The law.** A layer of humid air on the land: its extinction is whole (`JUNGLE_HAZE.density`, 0.0055 a metre - half the light
at 126 m) up to a **floor** - the canopy's height (`JUNGLE_HAZE.layer`, 28 m) over the ground under the eye, or over the land
about it (the eye's 3x3 of pixels' middles) where that is lower - and falls off by e every `JUNGLE_HAZE.falloff` (90 m) above
it. A ray crosses it for its length less a clear 8 m about the eye; its optical depth is that run times the layer's
**mean density along the ray, exact** for a straight ray through an exponential layer clamped at its floor (`hazeMean`),
and what reaches the eye is exp(-depth). So a valley is the layer's thickest, a ridge above it clears, and from a summit
the haze lies below as a sea.

**How thick, when.** At full share, by the hour (`JUNGLE_HAZE.day`: dawn's mist 1.65, the afternoon 0.82, night 1.25 - read
linearly round the clock), by the weather (`JUNGLE_HAZE.weather`: rain 1.3, thunder 1.42, fog 1.4), and by **drifting banks**
(`hazeDrift`: a value noise 540 m across, the density times 1 +/- 0.24, blown along the wind's way at 1.6 m/s) - the air
thins and thickens as the player walks and waits.

**Eased.** Share, density and floor each follow their target by their own lag (1.4 s, 2.5 s, 3.5 s); a step across the
line, up a cliff or into a bank is a fade. A jump (an eye 250 m from the last frame's: a teleport, a load) snaps.

**Everywhere it should be.** Every world program fogs by `fogFactorAt`, and `fogFactorAt` is now the weather's fog
(`weatherFogAt`) times the haze - the ground, the flats and both doors' trees, the meshes, the characters, the decals,
the water (whose sea floor - FAR-SEA1's hold - is the weather's half alone: no sea shows through the haze), the grass,
the rain curtains, the banners and flags, the duel wall, the spell sparks, the ships, the serpents, the sea's own fog
passes - each uploads `uHaze` beside its fog (the renderer's `_uploadFog` and every pass's own; the renderer's programs
only while it is on, and once as it goes off - a frame outside the jungle pays no call). The far ring of both lanes takes
it beside its horizon (`RING_HAZE_GLSL`'s `ringHaze` - `render/horizonHaze.js` stays a leaf). The sky - all four of its passes: the classic panorama, the port's dome, Dynamic Skies'
skybox and the volumetric clouds' composite - takes its sky half (`HAZE_SKY_GLSL`): a ray that never meets the ground
crosses the column above the eye over its rise, so the horizon is the haze's whole colour and the zenith keeps its blue.
The renderer's haze is a FRAME's: `setJungleHaze` arms it, and a beginFrame no exterior frame armed clears it, so an
interior, a dungeon or a panel never inherits the jungle's air; a sprite drawn off the world borrows it off with the fogs.

**Its colour.** The weather's own fog colour (the sky's horizon by the hour) made humid - leaned 42% to its own grey and
tinted toward green, its brightness kept (`hazeColorOf`). The frame's ONE fog colour is the weather's and the haze's
weighed by their optical depths at 300 m (`fogColorWith`): each medium scatters in its own colour in proportion to what
it takes out. The ground, the sky's horizon and the far ring close into that one colour, so no skyline steps.

**What it hides - the performance it buys.** A pixel whose every point sends less than 1/512 of its light through the
haze and the weather's fog together is not drawn (`hazeHides`, asked at the world host's pixel gate - terrain, models and
flats with it). A **bound**, never a guess: the run to the box's nearest point, at the box's top (where the layer is
thinnest - the mean density falls as a ray's far end rises), is the least any ray into it can cross; the test samples
hidden boxes and holds every point of them past the cull. At noon the haze hides the low ground past ~1.4 km, at dawn
past ~0.7 km - the 3x3 or the 5x5 of the 121 pixels the default land view streams - while a peak standing out of the haze
still stands. The shadow pass never culls by it.

## The four hosts

`scenes/world.js` WIRED (the streamed world - the jungle's host and the trees' host built once, the job, the haze before
the fog, the pixel gate, the far ring). `scenes/exterior.js` (the fixed city), `scenes/worldModes.js` (interiors) and
`scenes/dungeonContext.js` (dungeons) FLAGGED (`scenes/jungleHost.js`'s header, Home.md's open flags): none stands the
wilderness the jungle grows in, and each beginFrame of theirs clears the haze.

**HOST-SPLIT.** bootWorld stood at its ceiling. The trees' door and frame came out of it into `scenes/treesHost.js`
(Low Poly Trees' door with its season, the near sets of both doors, the handles' owners) - 26 code lines out, the
jungle's wiring in, the host 21,160 code lines (its ceiling lowered to that).

## Online, switches

**Forced on online** (`onlineLane.js` via the row's `online: true`): the jungle's trees are where Logging's trees stand in
Bantha, so a room has one jungle. Offline, the Features row `bantha-jungle` (prefs `banthaJungle`, on by default) on the
enhanced skin; the classic skin keeps DFU's rainforest. `?jungle=off` the kill door (offline); `?junglehaze=off` stands
the jungle under clear air. Read once, as the world loads.

## Departures from DFU (Port-Ledger A, THE JUNGLE OF BANTHA)

- `DefaultTerrainNature.LayoutNature` scatters archive 500's 31 records over Bantha as it does anywhere; here Bantha's
  tiles are laid by the jungle's own law with the owner's trees.
- DFU's fog is one `RenderSettings.fog` for the world; here a regional height haze multiplies it (and the sky takes it).
- DFU draws every streamed terrain the camera sees; here the haze culls what it hides whole.

## Verification

`test/world/bantha1_jungle.test.js` (18): the owner's files read (the fan, the mirror, the root, the winding, the bin), the
measures held to the files, every far picture standing on its root, the field and its continuity, the layout's four
storeys and where nothing stands, its own dice and its border, the species' ecology, the haze's law against a fine sum and
its shader twin run in `test/glsl.mjs`, every template in `src/` that calls the haze carrying its block, the cull's bound sampled, the easing, the colour and the sky, the host, the
renderer's two slots and the haze's arming, the door end to end over the real files, the hosts' wiring, the switch.
`tools/mutants/bantha1.json` (42, all killed). LPT1's and the moved pins re-aimed by content (`tools/mutants/lpt1_trees.json` and ten more).

**Recorded.** The five pictures are the owner's own (2026-10-18, at AUDIT BANTHA1's opening: "These textures are ours") -
no pixel of them is ARENA2's; the doctrine's SUPPLIED rows say so (`test/tooling/doctrine.test.js`). **Open.** Not eyeballed in the running game:
this slice was built in a container with no ARENA2 (the trees' far pictures, the layout over synthetic ground and the
haze over a synthetic scene were rendered and looked at; Bantha's own land, its real extent on the map and the frame time
on a GPU are the owner's to see - `HEADED=1 SCENES=city npm run perf` near Bantha, and `?jungle=off` against it).

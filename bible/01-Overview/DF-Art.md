# DF-ART - the port's own models wear Daggerfall's textures

2026-10-14. Mac: *"For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to instead use
daggerfall textures instead of AI generated. Download Daggerfall if needed"*. Asked which, Mac chose **the real-world
things**: the ships (the galleon, the carrack and the large boat), the wagons and the caravan with its room, the Stable,
the Wagon Yard and the Joinery, the shipyard and the lighthouse, the LeFay monument and the town's hangings. Asked how
far, Mac chose **all Daggerfall**: every surface wears a Daggerfall texture, and the painted liveries, name boards and
signs that Daggerfall has no picture for go.

Then, seeing it (DF-ART II, the same day): *"Bring back the sign text. Bring back the old plaque texture. Also, windows
should always be see through. Ensure texture swapping still works for wagons"*. The signs' words are lettered back
on, the LeFay plaque is its own painted bronze again, every window that has something behind it is seen through, and
the wagons' paints are driven through the real pool, every kind and every choice.

## The law

Each of those models still names its pictures under its own pseudo-archive and records (`src/world/galleonArt.js`
TEX and the rest), so **no mesh, uv, band or tile changed**. The difference is what fills a record. Before, it was
painted in code from noise and drawn shapes. Now it is **read from the player's own ARENA2**: the classic record a
table names (`src/world/classicArt.js` DF), at load, the same way every other model's texture is read.

Port-Doctrine holds here. Nothing of Daggerfall's enters the repo: the tables name records, and the pixels are the
player's (A RENDER OF GAME DATA IS GAME DATA). The tests read no game data either. `test/classicArtFake.mjs` answers
every record with a picture that names it.

The ships' records are Come Sail Away's own picks for its hulls (`vendor/come-sail-away/Models/prefabs.json`): 050_6
planking, 050_0 decks, 050_7 sails, 067_8 masts, the 067 woods, 085_5 rope, 074_0 doors and the 000 irons. So the
port's galleon sails beside the mod's in one hand. Everything else uses the nearest record Daggerfall has.

A record is read whole and made **opaque**: these are a model's faces, and the few index-0 texels a classic wall
carries would read as holes in a hull (`opaque`). Other forms exist:

- **A composed wall.** A record laid whole, with another record laid in where the model's window or door stands
  (`composedPicture`). Its layout is the 64-texel one the painted art used, so a window still meets the caravan
  room's window. The picture is 256 texels square, so the inset keeps its leading.
- **A cut record.** A record cropped and mirrored whole (`cutPicture`), with its clear texels kept as a cut-out (the
  beacon's flames over Daggerfall's brazier) or its window's glass cut (`SEE_THROUGH_WINDOW`).
- **A lettered board.** A record repeated at its own texel size over a board's picture (`tile`), with its word painted
  on last (`paint` - `merchantYardArt.js` signSource).

**A WINDOW IS ALWAYS SEEN THROUGH** (Mac: *"windows should always be see through"*). `SEE_THROUGH_WINDOW` is
Daggerfall's leaded window (054_43) framed whole: its frame and its left half to the mullion, the plaster under it left
off, made whole by its mirror, the glass between its leads cut out (`cutGlass`: a pane texel darker than LEAD_LIGHT).
Every model's window wears it, and its host uploads it a cut-out (`hasGlass` says which): the caravan's, laid into its
walls inside and out; the galleon's stern gallery and the carrack's transom, through the pipeline's own door
(`uploadRecord`'s `cutout`, `comeSailAwayPool.js` cutOf). Behind the galleon's stern windows is her great cabin, its
forward wall about 9 m in; behind the carrack's transom her hull, 13-23 m. The stern windows' night glow went with their
glass: a cut-out's hole draws nothing, emission included.

## The models

| Model | Archive | What it wears now | Where |
|---|---|---|---|
| Galleon, carrack, large boat | 38131, 38141, 38171 | Come Sail Away's records for every part. The galleon's stern gallery and the carrack's transom are Daggerfall's leaded window, seen through (`SEE_THROUGH_WINDOW`). The throats wear the darkest 067 wood. | `galleonArt.js`, `carrackArt.js`, `largeBoatArt.js` (stand-ins on the texture door, `classicStandIns`) |
| Wagons and caravan | 38181 | Plank boards (050), its woods, the spoked wheel (087_7), iron, sailcloth for the tilt and leather for the harness. The caravan's walls are a flat swatch with Daggerfall's leaded window laid in, seen through. The rear has its door (074_0), inside and out. A look is a swatch (000/001), a woven fabric (049), a wood, a rug, chequered tiles (152_1), plaster or the night sky (355). | `wagonArt.js` WAGON_SOURCES, LOOK_PICTURES, `caravanWall`; uploaded by `scenes/horseCartPool.js` and `scenes/caravanRoom.js` |
| Stable, Wagon Yard, Joinery | 38221 | Weathered wood, a building's planking, wooden shingles, straw, earth, stones, water and iron. Each signboard is Daggerfall's planks (050_6) repeated at their own texel size with the yard's word lettered on in the old sign-painter's capitals: STABLES, WAGONS, JOINERY; the Joinery's carries Daggerfall's own shop sign of an axe and a sword (333_18) at its left. | `merchantYardArt.js` YARD_SOURCES; `scenes/merchantYardsHost.js` |
| Shipyard, lighthouse | 38231 | The yards' records at the yards' records, plus coursed stone (324), lime (041), slates, a warm pane, the leaded window made whole, the hull, rope, canvas and door from Come Sail Away, cobbles, a parchment notice and gold; its two boards lettered SHIPS and CREW as the yards' are. The beacon's flame is Daggerfall's brazier fire (210_0) cut from over its bowl, and the embers are banked fire (356). | `portArt.js` PORT_SOURCES; `scenes/portHost.js` |
| LeFay monument | 38211 | Granite and marble (341) and plain gold. The plaque is its own painted bronze as it was (Mac: *"Bring back the old plaque texture"*): its bevelled border and the inscription cut into it - JULIAN LEFAY, 1965 - 2025, FATHER OF THE ELDER SCROLLS - and its edges the plate's own bronze (`lefayPlaqueArt`, `lefayBronzeArt`). | `lefayArt.js` LEFAY_SOURCES, `lefayPictures`; `scenes/lefayMonumentHost.js` |
| Town hangings and rugs | 38202 | Each region's and each god's hanging is one of Daggerfall's eight heraldic tapestries (057): the dragon for Akatosh and Santaki, the raven for Kynareth, the lamps for Julianos, the moon for Lainlyn's crescent. A banner wears the middle half of its tapestry, so its charge stays whole on the tall cloth. The patterns and small hangings are its woven cloth (049), a rug is its rug (371_0), and the leaves are green growth (302_2). | `townPictures.js` TOWN_PICTURES |

## What went

Mac chose all Daggerfall, so these painted things are gone:

- the caravan's oxblood skirt and gilt lines, its shutters, curtains and sunburst;
- the galleon's and the carrack's painted liveries;
- the signboards' painted boards and emblems (the horseshoe, the wheel, the saw, the anchor, the coil) - their words are
  back, on Daggerfall's planks;
- the regions' and the gods' drawn charges, now replaced by Daggerfall's tapestries;
- the ships' stern windows' night glow, with their glass.

GALLEON-2's *"textures should be 64x64"* was about the painted canvas. Each record now keeps its own Daggerfall size,
as Come Sail Away's own hulls do.

## What stayed, and why

- **The LeFay plaque** is its own (Mac: *"Bring back the old plaque texture"*) - the one picture of the port's own on
  these models; its stone is Daggerfall's.
- **The signs' words** (Mac: *"Bring back the sign text"*) are the old sign-painter's capitals (`SIGN_GLYPHS`, cream with
  its shadow), lettered on Daggerfall's planks.
- **The port's own windows stay whole.** The shipyard office's, the keeper's cottage's and the lighthouse tower's
  windows are 2 cm proud of solid walls with no room behind them (`world/shipyardModel.js`, `world/lighthouseModel.js`):
  cut, they would show the stone behind the glass, not a room. They wear Daggerfall's window whole until those walls
  have something to see into.
- **The town beds** (archive 38201, WD3) are Daggerfall's own bedclothes, recoloured, not a painting. They are
  untouched.
- **The Overworld map's yard glyphs** (the horseshoe, the wheel, the saw) are map marks drawn on the map canvas, not
  textures. They are untouched.

## How it loads

- **The ships** go through the texture door as stand-ins, built at the pool's preload (`scenes/comeSailAwayPool.js`,
  AUDIT GN2-PF3) and uploaded through the pipeline's own door - a window a cut-out.
- **Every other host** reads its records from the player's ARENA2 off the frame (`classicPictures` through
  `classicRgbaOf`, the pipeline's own reader) and uploads them as they land.
- **The port** waits for its art before it makes its meshes (L5-5's law, now read once rather than painted a few a
  frame).
- **A caravan room** repainted while its pictures are still being read takes the latest paint asked; an older paint
  lands nowhere.
- **A wagon's paint** (WAGONS2) still swaps: each choice past the first is drawn through its remap onto its own
  records, read and uploaded the first time a wagon wears it (`test/dfart_wagonlooks.test.js`, every kind and every
  choice, and every inside choice on the caravan's room).
- **A record the player's data lacks** is left out, and its faces draw untextured, as a classic model's would. It never
  throws.

The yards, the port and the monument hand their pictures over in their own rows (`asPortRows`: row 0 is the top,
which is how their models' uvs lay them). The ships and the wagons go in color32 order, as before.

## Pinned

- `test/dfart_classicart.test.js` (9): a record whole and opaque; a missing record left out; the window's glass and its
  leads; a window seen through and `hasGlass`; a lettered board (tiled, a clear inset, the word last); the composed
  wall's place, its mirror and its glass; the cut record; the stand-ins and their cut-outs; the port's rows.
- `test/dfart_wagonlooks.test.js` (2): every outside paint of every kind through the real pool, and every inside paint
  of the caravan's room.
- **The models' own suites**, moved onto the sources: `galleon_model`, `auditgalleon2_prefab` (PF3, PF5, TS7 - her
  windows a hole exactly at their glass), `auditgalleon_prefab` (R8/R11), `auditgalleon_sea` (T4(b) - her windows
  uploaded cut-outs), `ships2_carrack`, `ships2_largeboat`, `wagons1`, `wagons2`, `wagons3`, `wagonuv1`,
  `merchantyards1` and `carpyard1` (the words lettered), `beacontower`, `shipyards1_place`, `shipyards1_audit_port`
  (L5-5), `lefay1_monument` (the old plaque's own tests back) and `wd3_standins`; the pipeline door's pins
  (`incident_dungeon_seams`, `texturereplacement`) moved for its `cutout`.
- **Retired with the painted code they tested:** AUDIT GALLEON R12, whose figures the painted art's comment gave.
- **Mutants.** `tools/mutants/dfart.json` (14, all dead). In the arcs' own lists, records were re-aimed by content
  onto the new code (all dead) and retired with what they broke: R11's seams, R12's texel, the joinery's saw, GALLEON-2's
  slices and 64, the ships' clock seeds and sizes, and the stern windows' glow's two replacement flags. The plaque's three
  (its cut, its lip, its bevel) and the joinery's J are back with what they pin.

## Verification

- Every picture was composed from a real ARENA2, downloaded into the session's scratch directory only, and looked at
  as contact sheets. That covers the caravan's walls with the window's glass open, the lettered boards, the ships' window
  framed and open, the yards, the port with the flame cut, and the forty-eight hangings. What is behind the ships'
  windows was measured on their models (a ray in from each window face to the first face it can see).
- Not checked: nothing was drawn in the game on a GPU, so the models in the world are unseen.

# DF-ART - the port's own models wear Daggerfall's textures

2026-10-14. Mac: *"For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to instead use
daggerfall textures instead of AI generated. Download Daggerfall if needed"*. Asked which, Mac chose **the real-world
things**: the ships (the galleon, the carrack and the large boat), the wagons and the caravan with its room, the Stable,
the Wagon Yard and the Joinery, the shipyard and the lighthouse, the LeFay monument and the town's hangings. Asked how
far, Mac chose **all Daggerfall**: every surface wears a Daggerfall texture, and the painted liveries, name boards and
signs that Daggerfall has no picture for go.

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
carries would read as holes in a hull (`opaque`). Two other forms exist:

- **A composed wall.** A record laid whole, with another record laid in where the model's window or door stands
  (`composedPicture`). Its layout is the 64-texel one the painted art used, so a window still meets the caravan
  room's window. The picture is 256 texels square, so the inset keeps its leading.
- **A cut record.** A record cropped and mirrored whole, with its clear texels kept as a cut-out (`cutPicture`): the
  beacon's flames over Daggerfall's brazier.

## The models

| Model | Archive | What it wears now | Where |
|---|---|---|---|
| Galleon, carrack, large boat | 38131, 38141, 38171 | Come Sail Away's records for every part. The stern windows are Daggerfall's leaded window (054_43), and their night glow is its panes and leads (`paneGlow`: a texel no redder than it is blue and not black). The throats wear the darkest 067 wood. | `galleonArt.js`, `carrackArt.js`, `largeBoatArt.js` (stand-ins on the texture door, `classicStandIns`) |
| Wagons and caravan | 38181 | Plank boards (050), its woods, the spoked wheel (087_7), iron, sailcloth for the tilt and leather for the harness. The caravan's walls are a flat swatch with Daggerfall's leaded window laid in, its glass cut out between the leads. The rear has its door (074_0), inside and out. A look is a swatch (000/001), a woven fabric (049), a wood, a rug, chequered tiles (152_1), plaster or the night sky (355). | `wagonArt.js` WAGON_SOURCES, LOOK_PICTURES, `caravanWall`; uploaded by `scenes/horseCartPool.js` and `scenes/caravanRoom.js` |
| Stable, Wagon Yard, Joinery | 38221 | Weathered wood, a building's planking, wooden shingles, straw, earth, stones, water and iron. The Joinery's board is Daggerfall's own shop sign of an axe and a sword (333_18). | `merchantYardArt.js` YARD_SOURCES; `scenes/merchantYardsHost.js` |
| Shipyard, lighthouse | 38231 | The yards' records at the yards' records, plus coursed stone (324), lime (041), slates, a warm pane, the leaded window made whole, the hull, rope, canvas and door from Come Sail Away, cobbles, a parchment notice and gold. The beacon's flame is Daggerfall's brazier fire (210_0) cut from over its bowl, and the embers are banked fire (356). | `portArt.js` PORT_SOURCES; `scenes/portHost.js` |
| LeFay monument | 38211 | Granite and marble (341), plain gold, dull bronze, and a riveted plate (371_11) for the plaque. | `lefayArt.js` LEFAY_SOURCES, `lefayPictures`; `scenes/lefayMonumentHost.js` |
| Town hangings and rugs | 38202 | Each region's and each god's hanging is one of Daggerfall's eight heraldic tapestries (057): the dragon for Akatosh and Santaki, the raven for Kynareth, the lamps for Julianos, the moon for Lainlyn's crescent. A banner wears the middle half of its tapestry, so its charge stays whole on the tall cloth. The patterns and small hangings are its woven cloth (049), a rug is its rug (371_0), and the leaves are green growth (302_2). | `townPictures.js` TOWN_PICTURES |

## What went

Mac chose all Daggerfall, so these painted things are gone:

- the caravan's oxblood skirt and gilt lines, its shutters, curtains and sunburst;
- the galleon's and the carrack's painted liveries;
- the yards' and the port's signboards (SHIPS, CREW, STABLE, WAGONS): Daggerfall has no sign for them, so they are
  plain boards (067_5);
- the regions' and the gods' drawn charges, now replaced by Daggerfall's tapestries.

GALLEON-2's *"textures should be 64x64"* was about the painted canvas. Each record now keeps its own Daggerfall size,
as Come Sail Away's own hulls do.

## What stayed, and why

- **The caravan's windows are still see-through.** This is WAGONS2's ask (Mac: *"allowing players to see
  inside/outside of house windows + the new wagon"*). Daggerfall's windows are not cut-outs, so its own leaded window is
  laid into the wall with only the glass between the leads cut (`cutGlass`: a pane texel darker than LEAD_LIGHT). Every
  texel the eye sees is still Daggerfall's.
- **The LeFay plaque keeps its inscription.** The words are the memorial's: JULIAN LEFAY, 1965 - 2025, FATHER OF THE
  ELDER SCROLLS. They are cut into Daggerfall's plate, so each cut texel is the plate's own, darkened, with its lip
  lightened. Nothing is painted. Read still says them (LEFAY_TEXT.read). **This is for Mac to confirm**: dropping it is
  one line (`lefayPictures`).
- **The town beds** (archive 38201, WD3) are Daggerfall's own bedclothes, recoloured, not a painting. They are
  untouched.
- **The Overworld map's yard glyphs** (the horseshoe, the wheel, the saw) are map marks drawn on the map canvas, not
  textures. They are untouched.

## How it loads

- **The ships** go through the texture door as stand-ins. The pool's preload builds them, asking the door's own preload
  too (`scenes/comeSailAwayPool.js`), so a window's glow is cut as it is built and is never a first-draw stall
  (AUDIT GN2-PF3).
- **Every other host** reads its records from the player's ARENA2 off the frame (`classicPictures` through
  `classicRgbaOf`, the pipeline's own reader) and uploads them as they land.
- **The port** waits for its art before it makes its meshes (L5-5's law, now read once rather than painted a few a
  frame).
- **A caravan room** repainted while its pictures are still being read takes the latest paint asked; an older paint
  lands nowhere.
- **A record the player's data lacks** is left out, and its faces draw untextured, as a classic model's would. It never
  throws.

The yards, the port and the monument hand their pictures over in their own rows (`asPortRows`: row 0 is the top,
which is how their models' uvs lay them). The ships and the wagons go in color32 order, as before.

## Pinned

- `test/dfart_classicart.test.js` (8): a record whole and opaque; a missing record left out; the window's glass and its
  leads; the night glow; the composed wall's place, its mirror and its glass; the cut record; the stand-ins and their
  glow; the port's rows.
- **The models' own suites**, moved onto the sources: `galleon_model`, `auditgalleon2_prefab` (PF3, PF5, TS7),
  `auditgalleon_prefab` (R8/R11), `auditgalleon_sea` (T4(b)), `ships2_carrack`, `ships2_largeboat`, `wagons1`,
  `wagons2`, `wagons3`, `wagonuv1`, `merchantyards1`, `carpyard1`, `beacontower`, `shipyards1_place`,
  `shipyards1_audit_port` (L5-5), `lefay1_monument` and `wd3_standins`.
- **Retired with the painted code they tested:** AUDIT GALLEON R12, whose figures the painted art's comment gave.
- **Mutants.** `tools/mutants/dfart.json` (11, all dead). In the arcs' own lists, 17 records were re-aimed by content
  onto the new code (all dead) and 10 retired with their painters: R11's seams, R12's texel, the joinery's saw and its J,
  GALLEON-2's slices and 64, the plaque's bevel, and the ships' clock seeds and sizes.

## Verification

- Every picture was composed from a real ARENA2, downloaded into the session's scratch directory only, and looked at
  as contact sheets. That covers the caravan's walls with the window's glass open, the yards, the port with the flame
  cut, the plaque with its inscription, and the forty-eight hangings.
- Not checked: nothing was drawn in the game on a GPU, so the models in the world are unseen.

# Biome Precipitation (PRECIP1-4, 2026-10-19)

**The owner's call (2026-10-19): "I also want to begin giving each biome their own precipitation. It shouldnt snow
everywhere or rain everywhere when the season is winter, etc. It should truly be dynamic just like how we have a dynamic
cloud and weather system. If its snowing in one area and raining in the next, the transition should be seamless both in
ground texture and everything else. This needs to be accurate and as detailed as possible."**

On the enhanced lane what falls and what lies are read off one physical quantity, the AIR's temperature at a place, a
height and a minute. Every system on the weather map (`Weather-Arc.md` WEATHER3) falls at a SNOW SHARE: all snow at
0 C and under, all rain at 2.5 C and over, sleet between. The ground keeps what fell and has not melted, at every height:
its SNOWPACK. Each fragment of terrain wears its own climate's winter tile in the share of the snow at its own height and
slope. A white peak stands over a green valley in a thaw, a cold front brings the snow down to the sea, the jungle's rain
stops at its edge in a band of sleet, and the Alik'r never sees a flake. Pure in place and minute: every client sees the
same snow, offline and online.

DFU has no temperature. Its weather table rolls Snow for a climate in Winter and never otherwise, and its ground wears the
winter archive for the whole of Winter on the calendar (`TerrainMaterialProvider.GetClimateInfo`'s +1;
`world/climateSwaps.js` `getTerrainGroundArchive`). The port's WEATHER2a then turned rain over that ground into snow. So
a winter rain in the Rainforest fell as snow, a summer storm on a 1,900 m peak fell as rain, and the line between the two
was a map pixel's straight edge. The classic lane is DFU's, 1:1, and untouched.

## PRECIP1 - the air (`src/systems/weather/airTemperature.js`)

`airTemperature(x, z, altitude, t, skyMinutes, fall)` is the sum of five terms:

- **the climate's season** (`seasonAir`): its mean less its seasonal half-range on a cosine through the 360-day year,
  coldest on `COLDEST_DAY` (the 21st of Morning Star).
- **its day** (`dayAir`): warmest at `WARMEST_HOUR` (15:00), coldest twelve hours round, damped to `FALL.dayUnderCloud`
  under a falling system's cloud.
- **the synoptic spell** (`spellAt`): two octaves of value noise over space and time (240 km by four days, and 60 km by
  one), drifting east-north-east with the Bay's air (`SPELL.drift`), widened to [-1, 1] and multiplied by the climate's
  own swing. These are the cold snaps and thaws, never rolled.
- **the lapse**: `LAPSE_C_PER_M` (6.5 C a kilometre) times the height above the sea. Heights are DFU's own: the
  terrain's metres less the sea's 34 m (`SEA_LEVEL_M`). With no height given, the macro ground there is used (the WOODS
  byte times the kernel's base, `macroHeightM`).
- **the fall's chill**: a falling system cools the air it falls through by `FALL.chill` at full intensity, and a snow
  front brings `FALL.snowCold` more with it.

Each climate's numbers (`CLIMATE_AIR`) stand at its map pixel's CENTRE and are read bilinearly between the four centres
about a point (`airParamsAt`), so the air warms across a Mountain-to-Desert border over the pixel either side of it, never
at the edge. A climate's numbers are its own at its median row; the latitude (`LATITUDE_C_PER_ROW`, 0.008 C a row south)
moves its far ends, so the Wrothgarian's winter and the Dragontail's (both "Mountain", 420 rows apart) are not one winter.
A BIOME OVERLAY leans the air toward its own numbers by its share (`setAirBiome`). The jungle registers its haze's share
of its field with the Rainforest's air (`scenes/jungleHost.js`), so Glenpoint's jungle rains in a Mountain Woods winter
and its wandering edge is a band of sleet.

| Climate | mean | season half-range | day half-range | spell | median row |
|---|---|---|---|---|---|
| Ocean | 11 | 6 | 2 | 3.5 | 202 |
| Desert | 22 | 9 | 8 | 3.5 | 402 |
| Desert2 | 21 | 10 | 9 | 3.5 | 460 |
| Mountain | 9 | 11 | 5 | 5 | 11 |
| Rainforest | 26 | 2 | 4 | 1.5 | 290 |
| Swamp | 16 | 7 | 3 | 3 | 325 |
| Subtropical | 20 | 6 | 5 | 2.5 | 353 |
| MountainWoods | 9.5 | 11 | 5 | 5 | 95 |
| Woodlands | 10 | 11 | 4.5 | 5 | 29 |
| HauntedWoodlands | 9 | 11 | 4.5 | 5 | 11 |

**Calibrated on the freeware's map** (`sh tools/fetch-data.sh`; every pixel of each region at its own macro height,
random minutes of eight years, a fall of 0.7). Each cell is the share of wet hours that fall as snow / sleet / rain:

| Region | winter | spring | autumn |
|---|---|---|---|
| Northmoor | 71 / 21 / 9 | 10 / 11 / 79 | 5 / 8 / 86 |
| Daggerfall | 68 / 22 / 10 | 8 / 10 / 81 | 5 / 8 / 86 |
| Wayrest | 69 / 18 / 13 | 9 / 9 / 82 | 4 / 7 / 89 |
| Glenpoint (before the jungle's lean) | 85 / 13 / 2 | 18 / 9 / 73 | 11 / 12 / 77 |
| Wrothgarian Mountains | 96 / 3 / 0 | 28 / 12 / 59 | 21 / 12 / 68 |
| Dragontail Mountains | 82 / 12 / 6 | 11 / 13 / 77 | 5 / 9 / 86 |
| Ilessan Hills | 79 / 17 / 4 | 13 / 10 / 77 | 9 / 11 / 80 |
| Dwynnen | 72 / 19 / 8 | 10 / 12 / 78 | 6 / 9 / 84 |
| Alik'r Desert, Sentinel | 0 / 0 / 100 | 0 / 0 / 100 | 0 / 0 / 100 |

Summer is all rain everywhere, and so are the Rainforest, the Swamp and the Subtropical climate. The suite holds the
shape: `precip1_air.test.js` THE CALIBRATION (ARENA2-gated).

## PRECIP1/2 - what falls (`weatherSim.js`, `weatherFront.js`, `render/precipitation.js`, the sky)

- **The law's lane** (`precipLawOn`): the enhanced lane's ground law (`snowGroundLawOn`), a host that handed the air its
  map (`setAirGround`: the streaming world does; the fixed city of `?exterior` hands it none, and its ground wears DFU's
  season), and no `?biomeprecip=off`.
- **A place's share** (`snowShareAt`) is `snowShareOf` of the air there under the fall's own intensity (the band's -
  weatherMap.js `wornAmong` hands it to the ground law). Through `mapGround` a wet word falls as `phaseWord`: snow from a
  half's share up, else its own word, and a snow front in warm air falls as rain. A system's own word keeps its violence
  (`raw`), so a storm in freezing air is a blizzard.
- **The player's word** rounds their share with `PHASE_HYSTERESIS` either side of the half (`phaseRound`). A walk along
  the snow line, or an afternoon at the freezing point, never flips the word frame to frame (each flip is a front). The
  player's height is the host's own (`fieldXZ`'s third term).
- **The front** (`weatherFront.js`) carries the share (`snow`). Rain, a storm and snow are one fall under the law
  (`fallOf`), so a phase change keeps the fall up instead of tapering it to nothing and back.
- **The drops and the flakes** (`PrecipitationRenderer.drawFall`, both hosts): a wet mode at a share draws the rain's
  look (a storm's, under a storm) at the rest of the intensity and the lab's flakes at the share. The flakes' volume is
  carried aside on the wind's own offset (`MIX_SHIFT`), so a flake never falls in a drop's column. The lab's shaders and
  `draw` are untouched (WX1).
- **The sky**: each wet map cell takes the share at its own place (`c.snow`). Its curtain's weight and tint walk from
  the rain's (a storm's) to the snow's (`volumetricClouds.js` `cellOfField`, `rainCurtains.js` `mixColor`), so a front
  over the snow line greys into white across it.

## PRECIP3 - the snow the ground keeps (`src/systems/weather/snowpack.js`)

Every `SNOWPACK.stepMinutes` (three hours) of the event clock, at each of 20 altitude levels (-600 to 3,200 m; those
below the sea are read on down the lapse, so a pack white to the shore still has a snowline to blend across), a place's
SWE (millimetres of water) moves on (`stepPack`):

- **the fall**: the worn wet system's rate there (`wornAmong`'s raw word and its band's intensity), at most `rate.rain`
  4, `rate.thunder` 10, `rate.snow` 2.5 mm an hour. Its SNOW share lies.
- **the melt**: 4 mm a degree-day over freezing (`melt`, the textbook's open ground), plus the rain's own heat through
  it (`rainMelt`, 4.19 / 334 per mm per degree).

The air for a step is `airTemperature`'s own terms at the sea (`seaAirAt`). The year begins at MIDSUMMER (`yearOriginOf`:
the first step of the event clock's grid at or after the sky's last midsummer, `MIDSUMMER_MINUTE`), with every pack at
nought. No snow in the Iliac Bay outlives midsummer: the highest ground's air there is over freezing.

**Monotone in height.** At one place and minute the air only cools with height and the fall is the same, so a step keeps
SWE non-decreasing up the levels (`precip3_snowpack.test.js` THE STEP holds it over 2,000 random steps). A place's whole
pack is therefore its SNOWLINE (`snowlineOf`): the heights its cover (`coverOf`: whole at `fullMm`, 10 mm of water,
about ten centimetres of new snow) crosses 10, 50 and 90 %. `coverAtHeight` reads it back, and the shader reads it the
same way.

**The lattice** (`SnowpackLattice`): map pixel centres every second pixel, each point integrated from its year's origin
on the step grid. A point is kept by its index, so it is never integrated twice however the window about the player
moves. A step's wet systems are found once for every point that needs it (`systemsNear` with the wet types alone - a
storm cell comes with its rain front) and kept for the points after.

- **Skipped steps.** A step that cannot lay snow on any due point is skipped: every point empty, and its air colder
  nowhere than `RAIN_ALL_C`, even a level over its ground's ceiling (`top`) and under the fall's full chill. The skip is
  exact, because the crossings are clamped to the ground's ceiling (`ceil`): the macro ground's highest over the pixels
  its blend covers, plus 600 m of relief. The test runs the same window with no skip and finds the same lines.
- **The pack now** (`packNow`): the last step's pack carried the rest of the way under the air and the fall now. It is
  continuous in time and meets the next step at it.

**Cost, measured on the freeware's map** (this machine, Node): a full winter's history (1,400 steps from midsummer to
Morning Star) for the host's 121 points takes 270-340 ms with the systems memo warm, 650 ms for 441 points, and a
window's new edge of 11 points 8-14 ms. The skip takes a third of the steps in High Rock and more in the south.

## PRECIP4 - the ground (`render/snowCoverGlsl.js`, `scenes/snowCoverHost.js`, `scenes/pixelBuild.js`)

**The host** (`createSnowCoverHost`, wired by the world host; HOST-SPLIT) keeps an 11 x 11 lattice window about the
player. A pixel's build waits for it (`settle`): the window about the player is integrated in slices with the build's
own breath between, and its lines are read, so every pixel stands in the snow that lies, from the boot's first. Each
frame then integrates the window within its budget (`SNOW_COVER.budgetMs`, `arriveMs` while the world stands up), reads
the pack now every five game minutes and eases each point's shown line toward it (`ease`), so the snowline walks with the
weather and never jumps. The lane is asked of the law itself until the first frame reads it; a turn in play (a skin or a
door changed) re-skins every standing pixel. A clock run backwards (a save loaded) starts the packs again from their
origin.

**The terrain.** Each draw hands its pixel's snowline at its four corners (`drawOf`: `uSnowH10/H50/H90`) and the world's
height offset (`uSnowSet.x`). It binds its set's TWIN (`arrayOf`; `renderer.js` `makeTwinArray`): one tile array holding
the summer set's 56 records and then the winter set's. The two are copied on the GPU, the smaller scaled up where a pack
dresses one larger, mipmapped, and cached under `twin:<archive>` in the PLACE-LRU. No new texture unit is used. Each
fragment then:

1. reads the line between its corners and its cover off its own height (`snowAtHeight`, `coverAtHeight` term for term);
2. sheds it on a steep face (`SNOW_GROUND.slope`, the normal's y 0.62 to 0.8);
3. breaks a thin cover into patches on the world tile's own lattice (three octaves of 1, 4 and 16 tiles), continuous
   across pixel edges; a bare cover stays bare and a whole one whole;
4. wears its OWN climate's winter record of the same tile in that share (every ground set is the same 56 records,
   R9). Across a climate border each neighbour's winter comes from its own twin by ECOTONE1's own weights
   (`ecoWeights`, now one function both read), so the snow crosses the border as the ground does.

A desert's ground has no winter set (`TerrainMaterialProvider`'s guard), so its twin offset is nought and the cover
leaves it as it is. Next to a snowy neighbour, the neighbour's winter still blends in across the band.

**The builds.** A pixel's buildings, its town's climate swaps, its windmills and its homes wear the season of the snow at
its middle's ground (a town's planed height, else the ground's middle; `seasonOfPixel`). It turns Winter from 0.6 cover
and back to Summer under 0.4. Each tree, plant and rock flat wears the season of the snow at its own foot against a draw
of its own (`flatSeason`, `flatDraw` - a hash of its place, 0.15 to 0.85), so the woods across a snowline whiten tree by
tree, the same on every client. The ground's archive is the summer one (the twin dresses its winter). A pixel keeps the
snow it was built under (`p._snow`: its middle's cover at its low, middle and high ground). Every six game minutes THE
SWEEP rebuilds, through the season's own re-skin (`_reskin.mark`), the nearest four pixels whose buildings' season
turned or whose flats' cover moved a quarter. The calendar's flip no longer re-skins the world on the lane (`tickSeason`).

**Everything else at the player's feet.** The grass grows on every pixel on the lane, and a blade whose root the snow
covers past its own draw is not placed (`buries`). The footsteps (all three) and the Snowfall mod's surfaces ask whether
snow lies under the player (`winterAt`: the cover past a half), not the calendar.

## The hosts, online, the doors

- `scenes/world.js` wires the air, the snow host, both ground draws, the border's twins, the re-skin guard, the grass,
  the feet and the Snowfall mod. `scenes/exterior.js` (the `?exterior` city) hands the air no map, so its fall and ground
  are DFU's season (WEATHER2a). The interiors and the dungeons draw no terrain and have no weather.
- **Online**: the air, the weather map and the pack are pure in the place and the event minute, with the sky's season
  and hour where the shared clock installs a sky (TIME1). The step grid and the year's origin are the event clock's, so
  every client stands in the same snow. Nothing is sent.
- **Doors**: `?biomeprecip=off` turns the law off (WEATHER2a's word and DFU's season on the ground). `?snowground=off`
  turns off the ground law the lane needs. The classic lane is DFU's, 1:1.

## Departures from DFU (Port-Ledger A, BIOME PRECIPITATION)

DFU rolls Snow by its climate table in Winter and dresses the whole world's ground, nature and buildings in its winter
archives on the calendar. On the enhanced lane we read the phase of what falls off a modelled air temperature at the
place and height, keep a snowpack from the weather map's own history, and dress each fragment, tree and building by the
snow there. Named here and in the Ledger row.

## Open

- **The far ring** (`render/farRing.js`, EV8) beyond the streamed grid wears its overworld tint, as it did under DFU's
  season. It has no snow.
- **The Snowfall mod's own depth** stays its SnowpackState's (settlement and wilderness depths stepped while it snows).
  The lane hands it only whether snow lies at the player. Driving its depth from the pack is the next step.
- **A town's buildings** turn together, by the snow at the town's middle. Its ground and its trees do not.
- **A sweep's rebuild** of a pixel near the player while the snowline moves through it is a rebuild (DFU's own re-skin
  at the season's flip is too), at most four every six game minutes.
- A texture pack's snowless winter set (SNOWLESS1) is drawn as the pack dresses it under any cover.

## Verification

- `test/systems/weather/precip1_air.test.js`: the air, its blend, the phase law, the front, the mixed fall, the
  curtains, the hosts, and the ARENA2 calibration.
- `test/systems/weather/precip3_snowpack.test.js`: the step, the cover and snowline, the year, and the lattice (shared
  points, slices, exact skips, the pack now, online's origin).
- `test/render/precip4_snowground.test.js`: the chunk run through `test/glsl.mjs` against the law; the draw and the twin
  on a recording GL; the host's lines, draws, seasons, settle, sweep and feet; the wiring.
- `tools/mutants/precip1.json` (79, one recorded equivalent).

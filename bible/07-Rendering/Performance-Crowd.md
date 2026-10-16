# PERF-CROWD — the crowd, the frame's ceiling and the garbage (2026-10-10)

*Dudey: "the game has huge performance issues in almost all departments, it needs huge optimizations without quality
decrease" - "big problems are caused by many players causing severe stutter" (about 500 online at the time) - "also
check for memory leaks" - "keep weather in mind ... snowfall and snow in general is pretty demanding" - "make sure to
not touch enhanced lighting we finally fixed the flickering based on shadowcache".*

The pass after the perf pass v5 (PERF-SKY1, PERF-COMPILE1, PERF-DECOR1, PERF-PEERS1, PERF-GPU1, FP-SHADOW1). Every
slice below leaves the picture as it was - pixel for pixel where a picture is involved, value for value where it is not
- and none touches the Enhanced Lighting lane, its shadow pass, the static shadow cache or the air pass.

**PORTED ONTO MAIN (2026-10-10, the owner, of the pass's files: "My friend did this, not sure if we already tackled some
of it" - "I also want to go deeper without affecting visuals").** Both passes (v5 and v6) were made on a tree of their
own from main at 54ec6013, the same morning PERF-PRIORITY (`Performance-Priority.md`) was made on main; the files came as
a zip. They were taken as a commit on that base and merged onto main after #752, slice by slice:
- TAKEN as made: PERF-SAILS1 + PERF-SAILS2, PERF-NAMES1 + PERF-LEAK1 (in place of PERF-PRIORITY's PERF-NAMES, which it
  holds whole and adds to - the two layers' screenshots compared on main's tree and this one, eight frames on two GL
  backends: byte for byte), PERF-INPUT1, PERF-PEERS1/2/4/5, PERF-COMPILE1, PERF-SNOW1, PERF-SIM1/2/3 (each mark placed by
  the line it stands before, round PERF-PRIORITY's closures), PERF-GC1, PERF-GPU1, FP-SHADOW1 (a fix the owner asked
  for: it changes what first person shows, as asked - not a performance slice).
- TAKEN IN PART: PERF-SKY1 - the stars skipped by day, which is exact (below); the frame's constants worked out once a
  draw are NOT taken - the pass's own measure found "single texel flips inside a moon's point-sampled face", and the
  picture is kept.
- NOT TAKEN: this pass's PERF-V8 (main's frame is PERF-PRIORITY's PERF-V8 - twenty-one closures named `frame...`, made
  in place, measured by `test/perfv8.test.js`; the two cannot both stand) and v5's PERF-DECOR1 (PERF-PRIORITY's PERF-YARD
  culls the yards' pieces by their world boxes, with the shadow's reach, and the merchant yards with them).
- The port's own fixes to the pass: three of its instruments (`tools/peerLab.mjs`, `tools/nameLayerBench.mjs`,
  `tools/perfRig.mjs`) could not fail - a browser probe must judge its subject (`test/probehygiene.test.js` T3) - so each
  fails its run on a page error, a GL error or no frame measured; and its pin of its own PERF-V8 is not taken.
- The sections below are this pass's record as made; where the port differs, it says so.

## How the pass was run

The real game on the freeware ARENA2 (the player's own, attached for the pass), headless Chromium on SwiftShader, two
cores. A real-game frame probe boots in a quarter of an hour at the default land view, so the pass built short
instruments over the REAL modules instead, each a minute or less, and kept the real game for one before/after:

- `tools/peerLab.mjs` - THE PEER LAB. The layers that draw other players - RemotePlayers (class sprites, dolls, the
  steps', swings' and hooves' sounds), the walkers in Eye Of The Beholder's sets and the class skins (net/peer/peerRiders.js),
  the name layer - over the real renderer, the real data pipeline over the ARENA2, the real audio engine. N peers
  arrive together (a welcome's roster) while the camera turns, then walk. Per frame: each layer's JavaScript, the time
  between frames that is not idling (the asks' async tails), the long tasks; `PROFILE=`/`HEAP=`/`TRACE=` for a CPU
  profile, a heap sampling and a devtools trace; `CHURN=n` for n waves of NEW peers arriving and leaving, with what each
  wave leaves behind (DOM nodes, textures, live GL objects, every per-peer map).
- `tools/nameLayerBench.mjs` - the name layer alone under N labels, Chromium's own style, layout and task counters.
- `tools/snowBench.mjs` - systems/snowfallRuntime.js walking a synthetic world with Basic Roads, its frames' snow time
  and a hash of everything the GL layer uploads (budget `inf` makes it deterministic: two trees, one hash).
- `tools/perfRig.mjs` - the renderer's passes over a synthetic town without ARENA2 (built before the data arrived).
- `tools/quickProbe.mjs` - tools/frameProbe.mjs's own windows at land view 2 (5 x 5 pixels): the real-game A/B.

## PERF-V8 — not taken in the port

This pass wrapped the world host's frame's fifteen largest blocks as arrow functions called in place (`(() => { ...
})();`), the modal arm's body among them. Main had PERF-PRIORITY's PERF-V8 by the time the files came: twenty-one
statements as closures named `frame...`, lines inserted only, the frame 40,033 bytes of bytecode (`Performance-Priority.md`
PERF-V8, `test/perfv8.test.js` - every frame and closure under the ceiling and under three quarters of it, the closures'
rules over the parse). The two wrap overlapping blocks and cannot both stand; main's is kept, and this pass's pin of its
own wrappers (perfcrowd1's V8) with it is not taken.

## PERF-NAMES1 — a name moved by its transform

The name layer wrote each label's `left` and `top` every frame a crowd moved, which laid the layer out again every
frame. `tools/nameLayerBench.mjs`, 60 labels, this machine: 3.0 ms of style and 4.8 ms of layout a frame. Each label
now stands at the origin and the render writes `translate(x, y) translate(-50%, -100%)` - the same whole pixels and
the sheet's own lift - and `.dfname` carries `contain: layout style`. Every value the layer writes is compared with what
it last wrote (a `style.x` or `textContent` read asks the browser to serialise it back); the Renown, guild and house
lines are worked out when their stamp changes. 60 labels turning (the crowd at a fixed distance): layout 0.22 -> 0 ms,
the frame's task 3.2 -> 2.5 ms, the layer's JavaScript 0.86 -> 0.72 ms. Screenshots of the same points before and after:
0 of 400,000 pixels differ.

Measured and NOT taken: `will-change: transform` (a layer per label) moves a label with no repaint at all, but rasters
its text and shadow apart from the page - 324 of 400,000 pixels differ, by up to 26 - so it is not worn. And the label's
font size, written at 0.1 px as its distance changes, is what a MOVING crowd still pays (a size change lays its label
out and shapes its text again: ~12 ms a frame for 60 labels all changing size on this machine); rounding it to 0.5 px
would end most of that, and Dudey kept the smooth size.

Pins: `test/name1_bubbles.test.js` (the anchor in the transform), `test/perfcrowd1.test.js` (NAMES1). In the port it
stands in place of PERF-PRIORITY's PERF-NAMES (the transform alone): the same anchor, and the rest added.

## PERF-LEAK1 — nobody to label, no labels kept

The layer swept the tags of peers gone only on a frame that drew names, so a crowd's last frame left every one of its
tags in the page, hidden - PERF-ON4's "240 DOM nodes more after sixty peers left". A frame with no point lets them go; a
COVERED frame (a window over the HUD) keeps them, so a closed window moves the names again, never rebuilds them. The
peer lab's churn: 86-156 nodes left after each wave before, 6 (the lab's own page) after.

## PERF-INPUT1 — the binding maps walked without pairs

**SUPERSEDED at the merge onto main (2026-10-10) by main's AUDIT TECH-FX** (`src/ui/input.js` actionCodes): an action's codes are kept in an index rebuilt on a binding change, so a poll walks no map at all - better than the forEach walk below, which was dropped for it. `test/perfcrowd1.test.js` keeps this slice's behaviour half (the secondary dict answers, the primary first, nothing unbound); TECH-FX's own pins hold the mechanism.

PERF-NEXT item 2. `actionDown` walked the four binding dicts with `for (const [code, a] of map)`, a pair a binding for
every action polled every frame - 75 KB a frame by the real game's heap profile. It walks them with `forEach` and two
module callbacks over module state: the same `codeDown` calls in the same order (codeDown's modifier latch sees the
very sequence), none once one answered. A node bench of 40 polls a frame over the real bindings: 2,771 scavenges in
20,000 frames before, 4 after, the time the same.

## PERF-PEERS2 — a peer's feet once a sync, the names' matrix once a frame

Six layers of RemotePlayers' sync (the steps, the climb, the swing, the hooves, the doll, the class sprite) each asked
the host's `toScene` for the same pose - a triple and a frame conversion each, every peer every frame. The first asks,
the rest read its answer (`_feet`, cleared at each peer and at the sync's end). And `namePoints` handed every head to
`projectToScreen`, which multiplied proj x view again for each: the product is made once a frame and handed in (the
same float32 product). Pins: `test/perfcrowd1.test.js` (PEERS2).

## PERF-PEERS4 — a class sprite's archive warmed once it stands as the peer

PERF-PEERS1 (v5) put every picture of a class's archive up at idle when its bundle LANDED - and a bundle lands for every
peer, those the viewer draws in an Eye Of The Beholder set or a Morrowind body included, for whom the class sprite is a
stand-in for a few frames at most. Now the archive is warmed once its sprite has stood WARM_AFTER_FRAMES (30) frames as
the peer; until then the draw path uploads the frame it shows, as it always could. The peer lab, forty arrivals in
sets: 1,191 uploads -> 306, the run's script 1,210 -> 777 ms, the steady frame's peer layers 2.18 -> 1.74 ms.

## PERF-PEERS5 — a decoded sprite turned in its own bytes

The sprite door (net/peer/peerRiders.js decodeUrl, the walkers' and riders'; player/eotbBody.js decodeSprite, the local
body's) decoded a PNG and handed it to the row converter, which copied it into a second raster to turn it bottom-up.
The decode is that door's alone, so it is turned in place (`toColor32OrderInPlace`, formats/color32Order.js;
`worldOrderColors(image, { owned: true })`): toColor32Order's answer byte for byte, without a raster a sprite. The peer
lab's arrival stalls were the collector's (50-80 ms mark-compacts among the sprite decodes); this is one raster fewer
of the garbage behind them. Pins: `test/eotb_audit2.test.js` (owned, odd and even heights, no copy).

## PERF-SNOW1 — the snow, measured

`tools/snowBench.mjs` walking at a run: the snow's CPU after the JIT warms is ~0.9 ms a frame mean on this machine
(p95 2.2), with a 6-10 ms frame each time the middle ring commits (every 20 m) and each first context of a blanket tile -
the mod's own rebuilds, already paced (SNOW_FRAME_BUDGET_MS) and already reusing the last build's samples (AUDIT
ENVIRONS P3). The snow before the ground (AUDIT ENVIRONS G7) is already the GPU's early-depth win. Taken: the road
classifier's paint is a module function, not a closure minted on each of the up to six predictions a painted tile's
classification asks (`roadPaint`) - the golden model test (`test/snowfall1_model.test.js`) holds every prediction, and
the bench's deterministic hash is the same before and after.

## PERF-GC1 — the young generation's room (the desktop app)

A crowd's frame leaves about a megabyte of short-lived garbage, and V8's default 16 MB semi-space is swept several times
a second under it. A sweep's cost is what SURVIVES it, not the room, so a larger semi-space is fewer sweeps for the same
work. The peer lab, forty peers, two runs each, the steady frames' layer time: default 2.20 / 2.61 ms mean (p95 3.9 /
5.6), 32 MB 1.99 / 1.98 (p95 4.1 / 4.2), 64 MB 1.76 / 1.83 (p95 3.4 / 3.6); the arrivals' long tasks the same in all
three (those are mark-compacts - the old generation's - which this does not touch). The desktop shell (app/main.cjs)
now starts V8 with `--max-semi-space-size=32`: the smaller of the two, for the low-memory machines - the young
generation grows to it only under a high allocation rate. The browser build keeps the browser's own. Pin:
`test/perfcrowd1.test.js` (GC1).

## PERF-SIM1 — the simulation's span in parts

Dudey's `?perf=cpu` readout on the live server, in a busy town at night in snow (RX 9070 XT, 45 fps): `sim 8.7-16.0 ms`
of a 19-28 ms CPU frame, where the same session outside the town read `sim 0.5-1.0`; then `bodies` 2.3-3.3 and
`batches` 2.0-2.7. `sim` was one span from the modal gate to the renderer's frame open - some 1,500 lines of the host.
It is nine spans now, each a `markCpu` and nothing else (the meter's own `?perf=cpu` door; without it a mark is a
lookup): `sim` (the modal gate, the quests, the street's resources), `motor` (the player's movement and activation),
`stream`, `hosts` (bounties, legacy, patches, notices, farms, the pump), `view` (the projection and the cameras),
`weather`, `snow`, `storms` (the lightning, the dread, the sky and light settings), `scene` (spawners, gates, fog,
pools, the lights chosen), `begin` (the renderer's frame open). The next readout from the same street names the
part. Pin: `test/perfrig1.test.js` (the zones' order).

The second readout, the same street: `scene 5.9-9.8 ms` the largest, then `bodies` 1.9-2.7, `batches` 1.3-3.9, `motor`
1.1-2.1; `snow` 0.1-0.9 and every other part under 1.5. PERF-SIM2 splits `scene` again: `scene` (the World of
Daggerfall spawners), `gates` (the city gates, the interior lane's sync), `skyset` (the sky handed its frame, the fog),
`pools` (the gates, the Broker, the rite, the harbours, the camps, the quays, the monument), `lamps` (the lanterns pooled,
the nearest picked, the set handed to the renderer, the sails' frame) and `boats` (the rest, to the frame's open).

The third readout split `scene` (`lamps` 6.7-12.3 ms) and the fourth split `lamps`: `sails` 5.1-7.6 ms, the lanterns'
own selection and the hand lights a few hundredths. Come Sail Away's boats - a port's moored ships - were the frame.

## PERF-SAILS1 + PERF-SAILS2 — a ship's objects made again only where one moved, and only when read

`csaPoolFrame` runs the pool's `frame` (scenes/comeSailAway/comeSailAwayPool.js): one walk a frame of every drawn boat's active
objects (AUDIT PRE-MERGE 0928 R5), the sails' bakes, the lanterns, the flats. A ship is hundreds of objects - the five
hulls' prefabs, twelve ships 7,384 - and the walk made every one's world matrix again every frame (a quaternion's
matrix and a product a node) though all but her sails, booms, flags and oars stand as they stood. `tools/csaBench.mjs`
(twelve ships standing, the vendored hulls, no GL) reproduced the readout: 6.2 ms a frame, the walk and
`quatToMat4Into` its top. Each object's record now keeps the local values its matrix was made from and the making of
the parent's matrix it was made under (every making takes the next of one count, so no two share a name); a matrix is
made again only when either changed - else it is the one already made from those values, the same floats.

PERF-SAILS2 (Dudey: "iam not near water btw" - "lets say water is there like 2 pixel away"): the ships were a harbour's,
moored - they stand within HARBOUR_STAND (1,200 m) of its mouth, ashore too - and navalHost's poseShip rocks each in
the wind every frame (her MeshObject turned), so everything under it moved and PERF-SAILS1 alone made it all again.
Most of it no reader asks for: her still parts draw as her one batch at the MeshObject's matrix (AUDIT NAV1 #13). The
walk now marks a node due and `made` makes it - its parent first, from the local values the walk read - when the draw
draws it on its own, a flat stands on it, or a probe's `walkOf` asks; the eager walk's floats. And the record rides the
node (`_walkRec`, as PrefabNode keeps its own world matrix) - the WeakMap's ask was a sixth of the walk.
`tools/csaBench.mjs`, twelve ships (7,384 objects), the frame and its draw: standing 9.6 -> 4.6 ms, rocking (`BOB=1`)
9.5 -> 5.4; the frame alone (the `sails` span) rocking 7.0 -> 3.2.

Pins: `test/perfcrowd1.test.js` (SAILS1 - every matrix activeObjects' to the bit through a turned spar, a moved hull, a
part off while its hull moved and on again, a part hung under the hull and under its parent's sibling),
`tools/mutants/perfsails1.json` (8, 8 dead), and AUDIT PRE-MERGE 0928 R5's own (`test/audit0928_online.test.js`: the walk
activeObjects' to the bit, nothing allocated by a second frame - its mutant re-aimed).

## PERF-SKY1 — the stars are a night's (the port takes this part alone)

The v5 slice's stars half: the Dynamic Skies dome weighs its stars by `night * horizonValue`, and by day night is 0 -
yet every sky pixel paid three taps and the twinkle to be multiplied by nothing. They run under `if (night > 0.0)` now.
`mix(col, stars, 0)` is col exactly for any finite stars (the taps are saturated), and `night` is the sun's light
position's alone - the same in every fragment of the draw, so the taps' implicit derivatives stay defined. Checked in
the port: the real pass in Chromium (the sky lab, `sky.html?sky=dynamic`), main against the change, eight hours from
dawn round to the small hours, three views each - all 24 byte for byte the same. The slice's other half (the frame's
constants out of the pixel) is not taken: its own measure found texels flipped inside a moon's face. Pin:
`test/perfsky1.test.js` (1); mutants `tools/mutants/perfsky1.json` (2, both dead).

## PERF-COMPILE1, PERF-PEERS1, PERF-GPU1, FP-SHADOW1 — v5's, carried in these files

- PERF-COMPILE1 (stutter): a program's build waits once, on its link status (`render/glProgram.js` - each compile's own
  status query had made the vertex stage finish before the fragment stage was handed over), and the programs built on
  first use are built at idle (`warmPrograms`): the foes' telegraph pass, the real windows' background, the spell impact
  pass, Deep Waters' seven, the ocean holes' two and the sea's four.
- PERF-PEERS1: a class sprite's archive uploaded at idle a few pictures at a time (PERF-PEERS4, above, now starts it
  once the sprite has stood as its peer).
- PERF-GPU1: the page's WebGL context asks for the high-performance GPU (`powerPreference`), and the desktop app starts
  Chromium with `force_high_performance_gpu` - on a machine with two GPUs the game had drawn on whichever the system
  handed a browser; one GPU, no change.
- FP-SHADOW1 (Mac: "when i look up i see my eye of the beholder skin"): Eye Of The Beholder's first-person body honours
  its visibility - 2 drawn, 1 (the default, "Shadows Only") recorded for the shadow maps alone, 0 neither. A fix the
  owner asked for, and the one slice here that changes what is seen.

## The real game, before and after

`tools/quickProbe.mjs knight` over the tree before this pass (v5) and after, 320 x 180, land view 2, the frame probe's
60-frame windows (the sampling profiler slows the page several times over, so a timer's work - the music's pump, the
HUD's 250 ms sweep - reads many times its real share a frame; the frame's own numbers are the comparable ones):

| | before | after |
|---|---|---|
| the world host's `frame`, its own code (the PERF-V8 blocks included) | 2.18 ms | 2.06 ms |
| `frame`'s self time alone | 2.17 ms | 1.48 ms |
| allocated a frame (heap sampling) | 1,191,147 B | 1,068,042 B |
| draws / GL calls a frame | 567.7 / 3,946 | 567.9 / 3,959 |

The same draws (nothing in the picture moved), a tenth less garbage a frame, the host's frame code a little faster with
nobody else in the world - the crowd's slices are the peer lab's numbers above, which this scene has no peers to show.
(This table is the pass's own tree, its PERF-V8 included; the port's frame is PERF-PRIORITY's, and the port was not
measured in the real game - the data's host is refused where it was made.)

## Measured, and left

- **The Morrowind bodies.** Most players online wear them (Dudey). A body's build parses its meshes and its animation
  on the main thread (its textures decode in the worker pool since MW-TEXTHREAD), and up to eight bodies are skinned on
  the CPU a frame (SKIN_BUDGET 4). This container has no Morrowind data, so nothing here is measured; the build's own
  stage line (`[mw] arm built in N ms - archives, esm, meshes, textures, sweep`) or a profile from a player with the
  assets is the next measurement. The build is shared with the local player's own arm, so it is not changed blind.
- **The sprite fetches.** Every Eye Of The Beholder and class-skin frame is its own PNG, fetched, decoded and uploaded
  the first time it is drawn; the trace puts ~0.8 s of `ResourceFetcher::requestResource` on the main thread over the
  lab's forty arrivals. An atlas a set (one fetch, one decode) is a build step of its own.
- **The peers' sounds.** Every step, swing and hoof in earshot makes an HRTF panner (3D-AUDIO); their cost is the audio
  thread's, which a main-thread profile does not see.
- **The flats' draw count** (PERF-NEXT 10), ~1,000 draws a frame in a town - the billboard pass records for the shadow
  maps, so it waits on the lighting's own work.
- **Four mutants that survive on main as it stood before the port** (57818ecb, and on this pass's own tree alike): two of
  UXB1's in `ui/enhanced/enhancedTrade.js` (F4's lot back beside its stack, the clear's pushes), NAVF's grid stopping early
  (`world/prefabColliders.js`) and AUDIT PRE-MERGE 0928 R5's flat scale walked again (`comeSailAwayPool.js`). Found by
  running the lists the port touched; none is the port's - each its own slice.

## For Dudey / Mac

- The moving crowd's labels: the font size at 0.5 px steps (kept smooth, as asked).
- PERF-GC1's semi-space: 32 MB shipped, 64 MB measured a little better - a machine with room to spare could take it.
- The Morrowind bodies: a stage line or a profile from a player with the assets.

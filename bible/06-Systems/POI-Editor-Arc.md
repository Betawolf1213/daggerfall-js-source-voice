# POI Editor Arc (POI-1 - POI-6, 2026-10-14)

Mac, 2026-10-14: *"First task of the day is developing a tool - POI Tool (General Map Editor) - Realtime editor - Visual
and Export - Allowing not just the creation of POI's using models, but also the ability to import models, texture, UV
map, and even placement onto our actual map. I want this to be a tool my developers can use without having to access the
codebase, and I want it to be the best it can be. No short cuts or band aids."*

Asked four things, Mac answered:

| Asked | Answer |
|---|---|
| How a published POI reaches players | *"I need to be able to approve changes"* - nothing reaches a player unapproved |
| Who uses the editor | *"Developers + Builders"* - developers, and a Builder role for map makers who are not |
| Which model formats import | *"glTF / GLB"* |
| What "UV map" covers | *"Full UV editor"* - select vertices, edges, faces and islands; move, rotate, scale; seams; unwrap; pack |

An original system, not a DFU member (DFU's World Data Editor edits the classic blocks; it imports no model and places
nothing on the map by hand). It stands on the port's own renderer (Port-Doctrine: hand-rolled WebGL2, no engine), so
the glTF reader is the port's own and every model draws through `Renderer.createMesh` like any other.

## The shape

- **THE EDITOR RUNS IN THE GAME** (`/play/?editor`, POI-3), signed in with a game account. Not a second world viewer: a
  POI is placed in the real streamed world - the real terrain, the towns, the collision, the travel map - so what the
  builder sees is what a player will. A viewer rebuilt beside the game would be the band-aid Mac ruled out.
- **A POI IS A DOCUMENT** (`src/poi/poiLaw.js`) naming its assets by sha256: meshes (`src/poi/poiMesh.js`, the
  renderer's own shape in the game's frame, one binary layout) and textures (PNG, JPEG or WebP as imported,
  `src/poi/poiImage.js` reading their headers). One law, three readers: the editor before a save, the account service at
  every write, the game before it stands one.
- **EVERY CHANGE IS A REVISION AND AN APPROVER DECIDES** (`server-account/src/poi.js`, migration 0113). Builders draft
  and submit; an approver (`APPROVER_HANDLES`, Lattymoy) approves, rejects with a word, approves a retirement, or rolls a
  POI back to an earlier approved revision. Only approved revisions are in the feed the game reads.
- **LIVE, NOT DEPLOYED.** The game reads the feed (`GET /v1/poi/live`) and streams the assets it names
  (`GET /v1/poi/asset/<sha>`, cached for good: a hash never changes) - an approval reaches every player within a
  minute, no build and no relay restart (POI-2).

## The slices

| Slice | What | State |
|---|---|---|
| POI-1 | The format (document, mesh, texture header) and the store: roles, content-addressed uploads, drafts, submissions, the approver's word, retirement, rollback, the live feed | built |
| POI-2 | The game: the feed read and kept, POIs streamed with the pixels they stand on in the exterior hosts, drawn, collided, lit, marked on the map; a new approval picked up without a reload | built |
| POI-3 | The editor mode: the role gate, a free camera, the map to fly to, place / move / rotate / scale with gizmos and ground snap, an outliner and inspector, undo and redo, drafts saved and submitted | planned |
| POI-4 | The glTF 2.0 / GLB importer: accessors (sparse too), the node tree baked, materials, embedded and side-by-side images, samplers, KHR_texture_transform; the frame turned to the game's; the asset library | the reader built; the library with POI-3 |
| POI-5 | The material editor and the full UV editor: selection by vertex, edge, face and island; move, rotate, scale; seams; LSCM unwrap; island packing; projections; texel density | planned |
| POI-6 | The approver's queue in the editor (before and after, at the place, with the law's report), history and rollback; export and import of a POI pack; a GLB back out for a round trip | planned |

## POI-1 - the format and the store (2026-10-14, acct133)

**THE MESH** (`src/poi/poiMesh.js`). `POIM` v1, little-endian: a header (vertex and index counts, a u32-index flag, the
submesh count, the bounds), the submesh runs (`{ start, count }`, contiguous, in order, whole triangles - one per
material), then positions, normals and UVs as f32 and the indices. Metres, the game's model frame (`dfMeshToModel`'s:
Unity's left-handed, +Y up), UVs as glTF writes them (origin top-left). `encodePoiMesh` refuses what `decodePoiMesh`
would, by the one check `poiMeshError`: lengths that agree, finite numbers, every index a vertex, the runs whole and in
order, and the limits (`POI_MESH_LIMITS`: 262,144 vertices, a million triangles, 64 submeshes, 2048 m from the origin,
24 MiB). A decode re-derives the bounds and refuses a header that lies about them.

**THE TEXTURE** (`src/poi/poiImage.js`). The image as imported, known by its header: PNG (IHDR), JPEG (the first true
start-of-frame past the tables) or WebP (VP8, VP8L or VP8X), at most 4096 a side and 16 MiB. The service never decodes
pixels; the browser that draws it does.

**THE DOCUMENT** (`src/poi/poiLaw.js`). `{ v: 1, id, name, about?, tags?, place, parts, lights?, marker? }`. `place` is a
map pixel (`px` 0-999, `py` 0-499), metres east and north inside it from its south-west corner (`x`, `z`, 0 to 819.2 -
`streamingWorld.js pixelTranslation`'s frame), a height `y` above the ground (`ground: 'snap'`) or absolute, a unit
quaternion and a size. Each part names a mesh, a transform from the place, `collide` ('mesh' or 'none'), `shadow`, and
one material per submesh: base texture and colour, emissive texture and colour, alpha (opaque, cutout with its cutoff,
blend), two-sided, wrap per axis, filter (linear or nearest), and a UV offset, scale and rotation. Up to 128 parts, 32
lights, a marker for the map, 96 KiB as JSON. `poiDocProblems` names every way a document falls short as `{ path, code, ...args }` - WHERE, as the document
spells it, and WHAT, a stable word (`quat`, `alpha`, `unknown`), never a sentence: the editor says it in the builder's
language and the service returns the same objects verbatim (the port's own text law, L10N4: no new hard-coded English).
A field the law does not know is a problem, not a passenger.
`poiAssetProblems` checks a document against the stored assets: every mesh uploaded and a mesh, every texture a texture,
a part's materials exactly its mesh's submeshes.

**THE ROLES** (`poi.js poiRolesOf`, `wrangler.toml`). Derived at every call, as every grant here is (titles.js): an
approver is in `APPROVER_HANDLES` (Lattymoy); a builder is an approver, a developer (`DEVELOPER_HANDLES`) or in
`BUILDER_HANDLES` (empty at the start). A guest is neither. A handle taken off a list loses the door at its next request.

**THE STORE** (migration 0113: `poi_docs`, `poi_revs`, `poi_assets`, `poi_feed`; R2 `poi/a/<sha>`).
- An upload (`PUT /v1/poi/asset/<sha>?kind=mesh|texture`, a raw body to its kind's bound) is named by its own sha256 -
  checked against the bytes - and read whole as the kind it claims (a mesh decoded, a texture by its header). Stored
  once; its facts (a mesh's submeshes, vertices, triangles and bounds; a texture's format and size) kept beside it for
  the document checks. A builder may upload 1 GiB a day.
- A draft (`PUT /v1/poi/draft { doc, base }`) is checked whole - the law and the assets - and saved over its author's
  open draft of that POI, else a new revision (its number taken in the write itself, so two builders never collide). A
  new id founds the POI. Any builder may draft a revision of any POI; `base` says which revision it was made from.
- `POST /v1/poi/submit` (the author's draft, checked again), `/withdraw` (back to a draft), `/retire` (a submitted
  'retire' revision, one at a time, of a live POI).
- `POST /v1/poi/review { verdict: 'approve' | 'reject', note }` (an approver; the note up to 500 characters). Approved,
  the revision is the POI's live one (a retirement: none), its assets made public, the feed's version moved - one batch,
  every write after the decision conditional on the decision having been this one, so a decision raced is made once.
  A document is checked once more as it goes live.
- `POST /v1/poi/rollback { id, rev }` (an approver): an earlier approved revision live again - a retired POI too.
- Reads: `GET /v1/poi/me` (the caller's roles), `/list` (every POI and its revisions' states), `/doc/<id>` (its history,
  documents and all), `/queue` (an approver's: every submission, oldest first, with the live document it would replace
  and whether it is STALE - made from a revision that is no longer the live one).
- The open reads, no session: `GET /v1/poi/live` (`{ v, pois: [{ id, rev, doc }] }`, an ETag of its version, 304 to a
  game that holds it - the preflight lets `if-none-match` through) and `GET /v1/poi/asset/<sha>` for an asset a live POI
  names (`public, max-age=31536000, immutable`). A draft's asset is a builder's alone (`private, no-store`). Bounded
  per address (600 a minute, the isolate's memory). The feed is kept in the isolate: inside `POI_FEED_KEEP_MS` (15 s) no
  statement; past it, the version's one row, and the documents only when it moved.

Pinned by `test/poi1_store.test.js` (10) on the real Worker over the real migrations; `tools/mutants/poi1.json` 16, all
dead. The account deploy's path filter carries the three shared law files. acct133.

## POI-2 - the game stands them (2026-10-14)

- **THE FEED** (`src/poi/poiFeed.js` createPoiFeed): `GET /v1/poi/live` at start and every `POI_FEED_POLL_MS` (a minute)
  with the version held (`If-None-Match`; a 304 reads nothing), so an approval reaches a playing game within a minute
  with no deploy and no reload; a failed ask backs off from `POI_FEED_RETRY_MS` (5 s), doubling to the minute. Every
  document is held to the law again (`poiDocProblems`) - one the law refuses is not stood, whatever the wire says. The
  last feed is KEPT (the Cache API, `browserPoiCache`) and read back at the next start: a game without the network
  stands the POIs it last saw. `setOverlay` stands a builder's open drafts over the live set on that screen alone
  (POI-3).
- **THE ASSETS**: by their sha256 - memory (64 MiB, the oldest asked let go), the kept copy, then
  `GET /v1/poi/asset/<sha>` - and HASHED wherever they came from: bytes that are not the ones their name says are
  refused (the content address is the integrity check). One ask per asset at a time.
- **THE HOST** (`src/scenes/poiHost.js` createPoiHost; the pools' shape - `lefayMonumentHost.js`,
  `merchantYardsHost.js`): every POI on a pixel the streamer has BUILT is loaded, stood, collided, lit, drawn and
  marked; taken down when its pixel goes, its revision moves or it is retired. Nothing is baked into a pixel's batch -
  a POI comes and goes while its pixel stands. Its matrices are its pixel's frame (metres east and north of the
  south-west corner), its collider rides the pixel's translation (`collider.js` onFloatingFrame), so a floating-origin
  recentre restands nothing. A `snap` POI stands its `y` above the drawn ground (`world.js` surfaceAt), read again when
  the pixel moves and every `POI_GROUND_EVERY` (30) frames; until the ground answers, it waits unseen and uncollided.
  A part's collider is HELD while the player's feet are inside its box (never walled in - an approval may land on a
  player) and stood once they leave. A revision that only MOVES the POI (`sameBuild`: the same parts' meshes,
  materials, colliders and shadows) is placed again, not reloaded; any other is reloaded. A POI whose assets would not
  load is tried again after `POI_RETRY_MS` (a minute). Its lights join the scene's selection (`flicker` stepped at
  12 Hz); its marks go to both world maps (`src/ui/poiMapMark.js`, a violet circle on the bounty's reader and
  painter). Wired in `world.js` only; the bench (`exterior.js`) has no feed - FLAGGED.
- **THE MATERIALS** (`src/poi/poiRuntime.js`, pure): a material's LOOK (picture, tint, alpha, sampler, emission) is
  one texture record under `POI_TEXTURE_ARCHIVE` (600000, owned alone - `test/sd26_render.test.js` ONE ARCHIVE, ONE
  OWNER); two materials alike share it. The tint is baked into the picture (the mesh shader has none), a cutout's
  alpha thresholded at ITS cutoff to all or nothing (the shader cuts at a half), a blend's alpha kept times the
  tint's; the emission is its picture times its colour, clamped (low dynamic range). Rows turned to color32 order; UVs
  through the material's transform and to the renderer's `v' = 1 - v`. A two-sided material's faces doubled back on
  their own vertices, normals turned; a mirroring part (negative determinant) wound back. Blended submeshes are a
  model of their own.
- **THE RENDERER** (`src/render/meshAlpha.js`): `MESH_ALPHA_GLSL` in both mesh programs (classic and Enhanced
  Lighting) - `uMeshAlpha` 0 for every opaque draw (alpha 1 written, as ever), the texel's alpha times it in a
  translucent one. `drawMesh(..., { translucent })` blends straight alpha over (`SRC_ALPHA, ONE_MINUS_SRC_ALPHA`; the
  destination's alpha kept), tests depth and writes none, casts no shadow and puts every bit of state back; the host
  draws them after the water, far first. A texture's own SAMPLER (`samplerParams`: wrap per axis - repeat, clamp,
  mirror - and the filter) is keyed apart (`samplerKey`), the emission map with it.

Pinned by `test/poi2_runtime.test.js` (11) - the renderer on a recording GL, the shaders' text, the pictures, models
and matrices, the feed and assets on a fake service, the host on a fake streamer, collider and renderer;
`tools/mutants/poi2.json` 26, all dead.

## POI-4 - the glTF 2.0 reader (2026-10-14)

`src/poi/gltfImport.js`, pure (no DOM, no fetch), written to the Khronos specification.

- **`readGltf(bytes, { files })`** - a .glb (its JSON and BIN chunks) or a .gltf with the files its URIs name (by path,
  decoded path or bare name) and data URIs in place. Buffers and views (strided too), every component type, normalized
  or not, SPARSE accessors (over a view or over none). The default scene's node tree from its roots (TRS or a matrix;
  a cycle refused). Primitives in TRIANGLES, STRIP and FAN; morph targets at the node's or mesh's default weights.
  Materials: base colour factor and texture, emissive with KHR_materials_emissive_strength, alpha mode and cutoff,
  double-sidedness; textures and samplers (wrap per axis, magnification filter); images embedded, in a view or beside
  the file - PNG, JPEG, and WebP through EXT_texture_webp; KHR_texture_transform on a texture reference.
- **`bakeGltf(model, { split })`** - into POI parts in the game's frame: `whole` bakes every instance's world matrix into
  ONE mesh (a submesh per material, in first use); `nodes` a part per instance, its turn, scale and any shear baked,
  its translation the part's position (exact for any tree). X is mirrored (glTF is right-handed and faces +Z; the game is
  Unity's left-handed frame, +Z forward - glTFast's conversion, the model keeps facing forward) and every triangle wound
  back to stay front-facing under the renderer's `gl.frontFace(CW)`; a mirroring node (negative determinant) is already
  wound back by the specification's rule, so it keeps its order. Normals by the inverse-transpose; a primitive with none
  gets FLAT normals, the specification's requirement, from the emitted order (`(E1 - E0) x (E2 - E0)`). The base
  texture's KHR_texture_transform is baked into the one UV set the renderer draws (`T * R * S`, the extension's order);
  the UV set a material's base texture names is the one read.
- **REFUSED, BY CODE** (`GltfError { code, args }`): not glTF 2.0, not glTF at all, a GLB short of its chunks,
  `compressed` (Draco or meshopt - export with compression off), an `extension` required and not implemented, a missing
  file, buffer, view, accessor, image, texture or node, a read `past-end`, a `node-cycle`, an accessor type no mesh
  attribute is. **SET ASIDE, BY CODE** (`warnings`): `points-lines`, `no-positions`, `vertex-colours` (the game's
  renderer has none - bake them into a texture), `maps` (normal, occlusion, metal/roughness are not drawn), `skin`
  (imported in its saved pose), `animation`, `camera-light`, `no-uvs` (a textured material whose mesh has none - the UV
  editor unwraps it), `emission-uv-set`, `image-format`. The editor says each in the builder's language.

Pinned by `test/poi4_gltf.test.js` (6); `tools/mutants/poi4.json` 11, all dead. The asset library, the upload and the
editor's import dialog come with POI-3.

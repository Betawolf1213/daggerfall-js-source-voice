# THE STUDIO - the game's own artists' pictures (STUDIO1)

Opened 2026-10-17. trashBattery, on the dev chat: *"what Latty is working to build right now, and what I'm waiting for,
is a centralized location for you and I to put 2d art assets ... currently the game only uses art from mods they told
klod to integrate or re-uses textures from ARENA2. the reason the cart textures look strange is cause they're being
hue-shifted. they're not unique textures yet"*. Mac, sharing it: *"We need to build what trash is talking about"*.

## Why

Before STUDIO1, every picture the game drew came from one of three places:

- **A mod it was handed** (Vanilla Enhanced, Roleplay Realism, Diverse Weapons and the rest, under `public/art/` and
  `vendor/`).
- **A record of the player's own ARENA2.**
- **A picture the port painted from numbers.** These are the ships, the wagons, carts and caravan, the yards, the
  shipyard and lighthouse, the LeFay monument and the towns' hangings (`01-Overview/DF-Art.md`). They are recoloured for
  each paint a wagon can wear (`world/wagonArt.js` PAINTS and DYES: one picture, re-tinted) and laid in Daggerfall's
  palette as they load (DF-LOOK).

There was nowhere an artist could put a picture of their own and have the game wear it.

## The folder

```
public/art/studio/
  README.md          the artists' guide - naming, the rules, what wins
  artists.json       the roster: { artists: [{ folder, name, approved }] }
  <artist>/...       an artist's own drawings, any folders deep
```

- **Naming.** A picture is named for the texture it replaces, the way every Daggerfall texture pack names one:
  `<archive>_<record>-<frame>[_<dye>][_<map>].png`. This is `systems/textureReplacement.js` textureName, which is
  TextureReplacement.GetName (TextureReplacement.cs:725-736).
- **Labels.** A label for people may follow `--` (`38181_1-0--cart-side-boards-weathered-oak.png`). A DFU name never
  holds `--`: its record and frame are digits on either side of one dash.
- **Parsing.** `systems/studioArt/studioArt.js` studioFile reads a path. Its artist is the first folder, and the
  name before the label is read by textureEntry.
- **The rules** (`scripts/studioArtIndex.mjs` studioListing):
  - A file is worn only if it is in the folder of an artist the roster names.
  - It must be a PNG.
  - It must be named for what it replaces.
  - It may be at most 2048 texels a side (STUDIO_MAX_SIDE) and 4 MB (STUDIO_MAX_BYTES). The vendor tier decodes
    whole, with no Texture detail cap.
  - One picture a slot: the first path in order keeps a key.
  - The studio's own folder holds only the guide and the roster.
- **Refused files.** A file the rules refuse is left out of what the game is served, and named in the problems.
  `node tools/studioArt.mjs check` says them to the artist, and `test/systems/studioArt/studio1_folder.test.js` F1 fails
  the suite on any problem, so none ships.
- **The roster.** Each row is the doctrine decision: who may paint here, and the word that approved them. Two artists
  are on it: trashBattery and Redclaw. trashBattery's "you and I" was said to Redclaw, and Mac's word covers both.

## How the game finds the pictures: the folder, listed where it is served

- **Dev server.** It answers `art/studio/index.json` by reading the folder at every ask (`studioArtIndex`, the Vite
  plugin). A picture dropped in is worn on the next load.
- **Build.** The build writes the same listing beside the pictures it copies, so the site and the desktop app (whose
  seed lists `dist/`) carry it.

**A departure from the house's convention, named.** Every other pack the port carries ships a committed index made by
a tool (`vendor/*/*.index.json`, `rriIndex.js`, `diverseWeaponsIndex.js`). Those are third-party archives, and they
change only when a tool re-extracts them. The studio is a folder people paint into, from a checkout or through GitHub's
own upload page. A committed index would be a list for them to keep, or a tool for them to run, and trashBattery asked
for neither. No index file is ever in the tree, and studioListing reserves the name.

**The install** (`studioArt.js` installStudioArt):

- It runs once, from `scenes/shared.js` ensureAudio, the bootstrap every host runs.
- It reads the listing and registers every picture on the texture door's vendor tier.
- It decodes the pictures of the port's own archives (past TEXTURE.511, CLASSIC_TEXTURE_LAST) at once, because no
  archive load will.
- Daggerfall's records are decoded with their archive's load, as every replacement is (`preloadTextureArchive`).
- No listing (a page off a plain static server) is nothing. It never throws.

## Where it stands

**THE STUDIO'S PICTURE HOLDS ITS KEY** (`textureReplacement.js` addVendorTextures, STUDIO1). On the vendor tier, the
port's own art, the studio's entry wins whichever registers first:

- **Art registered after it** (a ship's painted stand-in registers when her pool loads, long after the boot's install)
  adds only what the archive is: the stand-in mark and a place on the doll. It never adds its picture.
- **A studio picture registered over art** takes those two from the art it displaces. A ship whose every record the
  studio repaints is still a stand-in archive (`isVendorArchive`), not a `TEXTURE.38131` to fetch.

So a studio picture is drawn:

- over the painted ship and hanging stand-ins;
- over every shipped pack (Vanilla Enhanced and its add-ons, Sands of the Alik'r, Snowfall), which sit on the bundle
  tier below the vendor tier;
- over the mods' own vendored art;
- with Replace Game Artwork off and on Classic. The vendor tier answers with the gate shut: it is the game's own art,
  not a pack.

**A player's own loose texture pack still answers first** (liveEntry's order), as it does over every picture of the
port's. A studio entry never `yields`, so a shipped .dfmod (which counts as "the player's own" to a yielding entry)
never outranks it.

**Worn as drawn.** DF-LOOK's grain and palette snap are for pictures painted from numbers. An artist's picture is
already the look they meant, so no door lays the look on it.

## The doors

| Model | Archive | How its pictures reach the game |
|---|---|---|
| Galleon, carrack, large boat | 38131, 38141, 38171 | Vendor tier stand-ins (`world/ships/galleonArt.js` shipStandIns): the studio outranks them there |
| Towns' tapestries, banners and rugs | 38202 | Vendor tier (`world/detStandIns.js`, townPictureEntries), the same |
| Wagons, carts, the caravan and its room | 38181 | `scenes/horseCartPool.js` uploadWagonPicture; `scenes/caravanRoom.js` paintCaravanRoom; the item icon `world/wagonModels.js` wagonIconSource |
| Stable, wagon yard, joinery | 38221 | `scenes/merchantYardsHost.js` meshOf |
| Shipyard, lighthouse | 38231 | `scenes/portHost.js` paintArt (the beacon's glow is the studio's picture where it is the studio's) |
| LeFay monument | 38211 | `scenes/lefayMonumentHost.js` ensureMesh |

**The painted doors** (the last four rows) upload their own pictures. Each goes through `wearPainted`, which asks
`paintedReplacement` before it paints:

- **Row order.** The wagons' pictures go up in the port's color32 order: row 0 is the bottom (`formats/color32Order.js`).
  The yards', the port's and the monument's go up top-down, because their faces are laid that way ("Row 0 is its top",
  `world/portArt.js`). Each door asks in its own order (`{ topDown: true }`).
- **A late studio picture.** The world host streams before the boot's install has landed. A picture painted while the
  install is still on its way is handed again, `late`, when the studio's lands. The host lets the painted one go first,
  because the renderer keeps the first picture a key is given.
- **The caravan's room.** Its live records (`CARAVAN_LIVE_CHOICE`) wear the studio's picture of the record each one
  shows: the built record or its paint's (caravanRoomPictures' third field).
- **The wagon's icon** is drawn once, after the install lands.

**Paints are records.** Each paint a wagon can wear is its own record, `LOOK_RECORD_STRIDE` (100) past the built one,
so an artist paints each one. A paint with no studio picture keeps its painted one.

## What the artists start from: the slots

`systems/studioArt/studioSlots.js` is the catalogue: STUDIO_SETS lists every model the port paints itself, with each
slot's key, its name, the template's file name and its picture.

- **248 slots today:**
  - the wagons: 86, every built picture and every paint's;
  - the galleon: 25;
  - the carrack: 27;
  - the large boat: 17;
  - the hangings: 48;
  - the yards: 14;
  - the port: 26;
  - the monument: 5.
- **The pictures** are painted as the game paints them before DF-LOOK lays the player's palette on. They are the port's
  own numbers, so a template of them is ours to hand out.
- **A ship's window** is cut as her day picture is cut, with a night twin of its own.

There are two ways to see them:

- **`studio.html`** (`src/tools/studioLab.js`), on the dev server and the site, draws every slot as worn today. Beside
  each, it shows the studio's own picture where an artist has drawn one, and a button saves the slot's template under
  the name the studio reads.
- **`node tools/studioArt.mjs`** lists the same slots. `templates [dir]` writes them to `studio-templates/` (ignored by
  git), and `check` runs the folder's rules, decodes every picture whole, and notes a picture whose shape is not its
  slot's (its face would stretch it).

**Daggerfall's own textures are slots too**: any name a texture pack can use. They are the player's data, so nothing
here draws them. `archive-sheet.html` numbers them from the player's own ARENA2.

## The doctrine

- **The studio's pictures are claimed as the port's own**, not as a render of game data. Port-Doctrine's
  non-negotiables stand unchanged, and no exception is asked for.
- **Membership.** `test/tooling/doctrine.test.js` reads the folder by the studio's own rule (studioArt): a picture the
  listing serves is ours, and anything else in the folder is unexplained.
- **The artist's word.** By committing a picture to their folder, an artist says it is their own drawing with no pixel of
  ARENA2's: no trace, repaint, upscale or screenshot. The roster's preamble and the guide say so.
- **The guide and the roster** are allow-list rows.

## Not yet

- **UI pictures** (IMG, CIF and RCI): the HUD, the windows, the first-person weapons. They have no general door yet
  (`combat/fpsSpellCasting.js`'s FLAGGED note; the UI pack and .dfmod tiers carry them piecemeal). The studio wears
  TEXTURE-archive pictures: the world's surfaces, its flats and billboards, and the item icons.
- **The port's other painted archives.**
  - Each upload door: the gate (38101) and its court (38111), the Abyss realm (38151) and remnant (38155), the lamp
    (38241), the blood atlas (38001), the torches (112358-9), the waves (112395). These are listed in no set and wired
    to no door yet.
  - Pictures on the texture door's vendor tier are already outranked by a studio picture of their key. These are the
    vendor-tier icons (survival, foraging, the Thunderlock) and the town's beds and clutter.
- **The horses' coats** (`systems/horse/horseCoats.js` recolorHorse) are dyed per look from one picture. That is the
  same "hue-shifted" kind trashBattery named, and it needs its own slots.
- **Maps beyond albedo** (normal, emission) are registered under their DFU names but are drawn only where the pipeline
  asks for them.

## Verified, and not

**Verified:**

- The dev server's listing.
- A real build (`art/studio/index.json` written beside the copied picture) and `vite preview` of it.
- Chromium driving `studio.html` on both: 248 slots, the studio's picture shown beside the painted one it replaces.
- In a real browser, `installStudioArt` through its real fetch and decode, with `paintedReplacement` answering in both
  row orders (a test picture's arrow tip where each order puts it).

**Not seen:** a studio picture on a wagon in the world. This container has no ARENA2 to boot the game with.

## Pinned

- **`test/systems/studioArt/studio1_door.test.js`** (6):
  - D1: names;
  - D2: the vendor tier's law, through the galleon's real registration;
  - D3: the install;
  - D4: the rows;
  - D5: wearPainted and the late picture;
  - D6: the caravan's room through its real producer, and every door's line.
- **`test/systems/studioArt/studio1_folder.test.js`** (6):
  - F1: the folder as it stands;
  - F2: the rules on trees of the test's own;
  - F3: the PNG header;
  - F4: the plugin, build and dev;
  - F5: the check;
  - F6: the slots and each model's door.
- **Updated pins:**
  - `test/world/dflook.test.js` L8: each door's look is laid inside wearPainted's paint;
  - `test/systems/texturereplacement.test.js`: the bootstrap's Promise.all carries the studio's install.
- **Mutants:**
  - `tools/mutants/studio1.json`: 33, all dead.
  - DF-LOOK's and BEACON-TOWER's door mutants were re-aimed at the moved lines, and all 54 are dead.

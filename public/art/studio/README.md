# The studio: DFO Online's own art

This folder is where the game's artists put their pictures. Drop a PNG in your folder, named for the picture it
replaces, and the game wears it: on the next load of the dev server, and on the site and the desktop app after the
next deploy. There is no list to edit and no tool you have to run.

The design record is `bible/07-Rendering/Studio-Art.md`.

## Your folder

```
public/art/studio/
  README.md          this page
  artists.json       the roster: whose folders the game wears
  trashBattery/      trashBattery's pictures
  Redclaw/           Redclaw's pictures
```

Make folders inside yours however you like (`trashBattery/wagons/...`). A folder whose name is not on the roster is
not worn. A new artist is added to `artists.json` first.

## Naming a picture

A picture is named for the texture it replaces, the way every Daggerfall texture pack names one:

```
<archive>_<record>-<frame>.png
```

You can add a label after two dashes, so the name says what it is:

```
38181_1-0--cart-side-boards-weathered-oak.png
```

Everything after `--` is for people; the game reads the part before it.

**Finding the numbers.** There are two places:

- **The studio page** (`studio.html` on the site or the dev server, or `node tools/studioArt.mjs`) lists every
  picture the game paints itself: the wagons, carts and caravan, the ships, the towns' hangings, the yards, the
  shipyard and lighthouse, and the LeFay monument. Each one has a download button, and its template is already named
  correctly: repaint it and drop it in your folder. These are the pictures that are painted from numbers and
  recoloured for each paint today, which is why they look the way they do.
- **Daggerfall's own textures** use the same names, `<archive>_<record>-<frame>.png`. The archive sheet
  (`archive-sheet.html`) shows every record of a `TEXTURE.nnn` from your own copy of the game, numbered.

**Paints are separate pictures.** Each paint a wagon can wear is its own record: the cart's side boards are
`38181_1-0` as built (weathered oak), `38181_101-0` red, `38181_201-0` blue, and so on. A paint with no picture of
yours keeps its painted one.

## The rules

- **Only your own drawing.** No pixel may come from Daggerfall's ARENA2: no tracing, repainting, upscaling or
  screenshotting a classic texture. Everything in `public/` is published with the game, and the game's data may not
  be. Committing a picture to your folder is your word that it is yours.
- **PNG only.** Keep working files (.psd, .aseprite, .kra) outside `public/`.
- **At most 2048 pixels a side and 4 MB a file.**
- **One picture a slot.** Two pictures for one name (yours and another artist's) fail the check. Agree on whose
  picture it is first.
- **Any size, the slot's shape.** A face stretches the picture to its slot, so keep the template's proportions. A
  64 x 64 slot takes 64 x 64, 128 x 128 or 256 x 256 equally well.
- **Transparent is a hole.** Where a template is clear, the game sees through: a caravan's window glass, a ship's
  stern windows by day, the beacon's flame. A ship's window also has a night picture (`.. - at night`), drawn
  whole and lit.
- **Worn as drawn.** The painted pictures are grained and snapped to Daggerfall's palette when they load. Yours are
  not: your picture is the look.

## What wins

A studio picture is the game's own art, so it is always worn. It is drawn over the painted one, over Vanilla
Enhanced and every pack the game ships, with "Replace Game Artwork" off and on Classic alike. A player's own attached
texture pack is still drawn over it, as it is over everything.

## Before you push

```
node tools/studioArt.mjs check
```

This names anything the game would refuse: a misspelled name, a file that isn't a PNG, an oversized picture, or a
slot painted twice. The suite runs the same check on every pull request, so a problem never ships.

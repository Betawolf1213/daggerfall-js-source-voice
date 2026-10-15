// @ts-check
// PORTRAIT3D (2026-10-15, the owner: "can we do the other races with 3d portraits also?", then "#2 is exactly I wanted.
// Which also affects the talk window for npcs"): WHO WEARS A MORROWIND HEAD AS THEIR FACE, AND THE PICTURE OF IT.
//
// combat/fpArm.js headPortrait takes the picture; this is the doors' side of it - who is asked, by which gate:
//   THE PLAYER (and anyone shaped like one: a save's identity, the chargen grid's ten portraits) - whenever Morrowind's
//     data is attached, the same switch the player's own body stands on (MWA4: the data, in either skin).
//   AN NPC - by its look (characters/peopleBodies.js personLook, folkBodies.js folkLook, rosterBodies.js
//     residentLook): wherever the people around you stand in Morrowind bodies (npcBodies.js npcBodiesOn - the
//     enhanced skin, the data, Morrowind People not Off), so the face in the talk window is the head on the body that
//     stood there. The look is read through peerBuildOpts, the door every body's build takes - the same race, sex,
//     face, walk and vampire's head. A creature's look and a wolf's have no face here.
// Every caller keeps its classic portrait until a picture lands, or for good when none does (no data, a race with no
// head, a mesh not in hand).
import { portraitRenderer } from '../render/portraitRenderer.js';

/** The data gate the player's face reads - the same count the player's body stands on. */
async function dataAttached() {
  const { morrowindDataCount } = await import('../scenes/dataSource.js');
  return morrowindDataCount() > 0;
}

/** The player's face (or a save's, a portrait's) as a Morrowind head: `{ width, height, data }` or null, `px` x `ph`.
 *  @param {{ race?: string, gender?: string, faceIndex?: number }} who  Daggerfall's race key ('DarkElf'), 'female'/'male'
 *  @param {{ px?: number, ph?: number, renderer?: any }} [opts] */
export async function playerHeadImage(who, { px = 128, ph = px, renderer = portraitRenderer() } = {}) {
  if (!who || !renderer || !(await dataAttached())) return null;
  const [{ headPortrait }, { mwRaceId }] = await Promise.all([import('../combat/fpArm.js'), import('../formats/mwNpc.js')]);
  return headPortrait({
    renderer, race: mwRaceId(who.race ?? 'Breton'), female: who.gender === 'female',
    faceIndex: Number.isInteger(who.faceIndex) ? who.faceIndex : 0, px, ph,
  });
}

/** An NPC's face as the Morrowind head its body wears: `{ width, height, data }` or null, `px` x `ph`.
 *  @param {any} look  the look its body is built from
 *  @param {{ px?: number, ph?: number, renderer?: any }} [opts] */
export async function npcHeadImage(look, { px = 128, ph = px, renderer = portraitRenderer() } = {}) {
  if (!look || look.creature || !renderer) return null;
  const { npcBodiesOn } = await import('./npcBodies.js');
  if (!npcBodiesOn()) return null;
  const [{ headPortrait }, { peerBuildOpts }] = await Promise.all([import('../combat/fpArm.js'), import('../net/peerBodies.js')]);
  const o = /** @type {any} */ (peerBuildOpts(look));
  if (!o || o.creature || o.werewolf || !o.race) return null;
  return headPortrait({ renderer, race: o.race, female: !!o.female, faceIndex: o.faceIndex | 0, npcFace: o.npcFace ?? null, vampire: !!o.vampire, px, ph });
}

/** A picture as a canvas `w` x `h` (the classic portrait's own size, so no well stretches it), the head fitted and
 *  centred in it; a square of the picture's own size when no size is given. Null without a document.
 *  @param {{ width: number, height: number, data: Uint8Array|Uint8ClampedArray }} img
 *  @param {{ w?: number, h?: number, doc?: Document }} [opts] */
export function headCanvas(img, { w = 0, h = 0, doc = globalThis.document } = {}) {
  if (!img || !doc) return null;
  const src = doc.createElement('canvas');
  src.width = img.width; src.height = img.height;
  const sctx = src.getContext('2d');
  if (!sctx) return null;
  const rgba = new Uint8ClampedArray(img.width * img.height * 4);
  rgba.set(img.data);
  sctx.putImageData(new ImageData(rgba, img.width, img.height), 0, 0);
  if (!(w > 0 && h > 0)) return src;
  const out = doc.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) return src;
  const s = Math.min(w / img.width, h / img.height);
  const dw = Math.round(img.width * s), dh = Math.round(img.height * s);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(src, Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh);
  return out;
}

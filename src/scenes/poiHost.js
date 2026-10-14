// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-2 (2026-10-14) - THE APPROVED POIS, STANDING IN THE STREAMED WORLD.
//
// Mac: "POI Tool (General Map Editor) - Realtime editor ... even placement onto our actual map"; "I need to be able to
// approve changes" (bible/06-Systems/POI-Editor-Arc.md). The exterior host's pool on the runtime pools' shape
// (scenes/lefayMonumentHost.js, scenes/merchantYardsHost.js): every POI the feed (poi/poiFeed.js) stands on a pixel the
// streamer has BUILT is loaded (its meshes and pictures by their hashes), stood on its ground, collided, lit, drawn - the
// opaque with the world, the translucent after it, back to front - and taken down when its pixel goes, its revision
// moves, or an approver retires it. Nothing is baked into a pixel's batch: a POI comes and goes while its pixel stands
// (an approval reaches a playing game within a minute), so it is its own draw, as a yard's piece is.
//
// THE FRAME: a POI's matrices are its PIXEL's (poi/poiRuntime.js) - metres east and north of the pixel's south-west
// corner - and the collider rides the pixel's own translation (`riding`, collider.js onFloatingFrame), so a
// floating-origin recentre restands nothing; the drawn matrix adds the pixel's translation when it moves.
//
// THE GROUND: a 'snap' POI stands its `y` above the drawn ground under its spot (`groundAt` - world.js surfaceAt), read
// when the pixel's translation moves and every POI_GROUND_EVERY frames (a pixel built finer moves it), never every
// frame; until the ground answers (a pixel not yet built at that ring), the POI waits unseen and uncollided.
//
// A BODY IS NEVER WALLED IN: a part's collider is held back while the player's feet are inside its box (a POI approved
// round a player standing there - lefayMonumentHost.js bodyTrapped's law) and stood once they are out.
//
// THE FOUR HOSTS (bible/Home.md): scenes/world.js - WIRED (made beside the LeFay monument; framed, drawn in the world
// pass, the translucent after the water, its lights in the scene's selection, its marks on the travel map, taken down
// at a re-anchor, a load and a change of mode). scenes/worldModes.js - its interiors stand no street; a POI is
// outdoors, and nothing here reaches them.
// scenes/exterior.js - FLAGGED: the fixed-city bench (`?exterior`, `?region&loc`) has no feed; a POI stands in the streamed world.
// scenes/dungeonContext.js - stands no street: nothing here reaches it.
//
// Not a DFU member. Ledger A (POI).
// ═══════════════════════════════════════════════════════════════════

import { decodePoiMesh } from '../poi/poiMesh.js';
import {
  POI_TEXTURE_ARCHIVE, materialLook, samplerOf, emits, createTextureBook, bakeAlbedo, bakeEmission, poiPartModels,
  placeMatrix, partMatrix, boxThrough, lightsOf, det3,
} from '../poi/poiRuntime.js';
import { trsQuat } from '../world/mat4.js';
import { samplerKey } from '../render/meshAlpha.js';
import { drawSeen } from './decorRoom.js';

/** The ground under a standing POI is read again every this many frames. */
export const POI_GROUND_EVERY = 30;
/** A POI whose assets would not load is tried again after this long. */
export const POI_RETRY_MS = 60_000;
/** Decoded pictures kept between the looks that share them. */
const DECODED_KEEP = 8;
/** A light's flicker: steps a second, and how far it dips. */
const FLICKER_HZ = 12, FLICKER_DEPTH = 0.25;

const ID = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/** Do two documents stand the same build - the same parts' meshes, materials, colliders and shadows, in the same order -
 *  so that one is the other moved (its place, its parts' transforms, its lights, its name and marker)? Pure. */
export function sameBuild(a, b) {
  const build = (d) => JSON.stringify(d.parts.map((p) => [p.key, p.mesh, p.materials, p.collide, p.shadow]));
  return a.parts.length === b.parts.length && build(a) === build(b);
}

/**
 * @param {{
 *   renderer: any, feed: any,
 *   decodeImage: (bytes: Uint8Array) => Promise<{ width: number, height: number, data: Uint8Array | Uint8ClampedArray }>,
 *   pixels: () => Iterable<{ px: number, py: number }>,
 *   translation: (px: number, py: number, out?: number[]) => number[],
 *   groundAt: (x: number, z: number) => number,
 *   collider?: () => any, riding?: (px: number, py: number) => any,
 *   feet?: () => (number[] | null), auth?: () => (string | null),
 *   now?: () => number, log?: any,
 * }} deps `pixels` the streamer's built pixels; `translation` its pixelTranslation; `riding` a pixel's floating
 *   translation provider for the collider; `auth` a builder's bearer (the editor's drafts' assets)
 */
export function createPoiHost({
  renderer, feed, decodeImage, pixels, translation, groundAt, collider = () => null, riding = () => null,
  feet = () => null, auth = () => null, now = () => Date.now(), log = console,
}) {
  /** id -> the POI standing (or loading) */
  const standing = new Map();
  const book = createTextureBook();
  /** look -> { record, refs, ready } */
  const looks = new Map();
  /** sha -> Promise<decoded> (the last few) */
  const decoded = new Map();
  let frameN = 0;

  const decode = (sha) => {
    if (decoded.has(sha)) return decoded.get(sha);
    const p = feed.asset(sha, { auth: auth() }).then((bytes) => decodeImage(bytes));
    decoded.set(sha, p);
    if (decoded.size > DECODED_KEEP) decoded.delete(decoded.keys().next().value);
    p.catch(() => decoded.delete(sha));
    return p;
  };

  /** A look's textures uploaded once, kept while any standing part wears it. */
  function holdLook(m) {
    const look = materialLook(m);
    let l = looks.get(look);
    if (l) { l.refs++; return l; }
    const record = book.recordOf(look);
    const sampler = samplerOf(m);
    l = { look, record, sampler, refs: 1, emits: emits(m), ready: null };
    l.ready = (async () => {
      const image = m.texture ? await decode(m.texture) : null;
      const albedo = bakeAlbedo(image, m);
      const glow = l.emits ? bakeEmission(m.emissive ? await decode(m.emissive) : null, m, albedo) : null;
      if (l.refs <= 0) return;   // let go while it loaded
      renderer.uploadTexture?.(POI_TEXTURE_ARCHIVE, record, albedo, { sampler, cutout: m.alpha === 'cutout' });
      if (glow) renderer.uploadEmissionTexture?.(POI_TEXTURE_ARCHIVE, record, glow, { white: true, sampler });
    })();
    looks.set(look, l);
    return l;
  }
  function dropLook(l) {
    if (--l.refs > 0) return;
    looks.delete(l.look);
    renderer.releaseTexture?.(POI_TEXTURE_ARCHIVE, l.record);
    if (l.emits) renderer.evictEmissionTexture?.(`${POI_TEXTURE_ARCHIVE}_${l.record}${samplerKey(l.sampler)}`);
  }

  /** Load a POI: every part's mesh, its looks, its GPU models. Answers when it stands ready (or failed). */
  async function load(s) {
    try {
      const parts = [];
      for (let i = 0; i < s.doc.parts.length; i++) {
        const part = s.doc.parts[i];
        const d = decodePoiMesh(await feed.asset(part.mesh, { auth: auth() }));
        if ('error' in d) throw new Error(`part ${part.key}: ${d.error}`);
        if (s.gone) return;
        const held = part.materials.map((m) => holdLook(m));
        s.held.push(...held);
        await Promise.all(held.map((l) => l.ready));
        if (s.gone) return;
        const recordOf = (m) => book.recordOf(materialLook(m));
        const mirrored = det3(trsQuat([0, 0, 0], part.r, part.s)) < 0;
        const models = poiPartModels(d.mesh, part.materials, recordOf, { mirrored });
        const remap = new Map();
        for (const m of part.materials) {
          const rec = recordOf(m);
          remap.set(`${POI_TEXTURE_ARCHIVE}_${rec}`, `${POI_TEXTURE_ARCHIVE}_${rec}${samplerKey(samplerOf(m))}`);
        }
        parts.push({
          index: i, key: part.key, part, remap,
          opaque: models.opaque ? renderer.createMesh(models.opaque) : null,
          translucent: models.translucent ? renderer.createMesh(models.translucent) : null,
          positions: d.mesh.positions, indices: d.mesh.indices, min: d.mesh.boundsMin, max: d.mesh.boundsMax,
          collide: part.collide === 'mesh', shadow: part.shadow, local: null, scene: new Float32Array(16), box: null, bucket: `poi:${s.id}:${i}`, stood: false,
        });
      }
      if (s.gone) { for (const p of parts) freePart(p); return; }
      s.parts = parts;
      s.status = 'ready';
    } catch (e) {
      if (s.gone) return;
      s.status = 'failed';
      s.failedAt = now();
      if (log) console.warn(`[poi] ${s.id} r${s.rev} would not stand`, e?.message ?? e);
    }
  }

  function freePart(p) {
    if (p.opaque) renderer.destroyMesh?.(p.opaque);
    if (p.translucent) renderer.destroyMesh?.(p.translucent);
    p.opaque = p.translucent = null;
  }
  /** Every part's collider taken down (stood again by the next placing). */
  function unstand(s) {
    const col = collider();
    for (const p of s.parts) if (p.stood) { col?.removeBucket?.(p.bucket); p.stood = false; }
  }
  function takeDown(s) {
    s.gone = true;
    const col = collider();
    for (const p of s.parts) { if (p.stood) col?.removeBucket?.(p.bucket); freePart(p); }
    for (const l of s.held) dropLook(l);
    s.parts = []; s.held = [];
    standing.delete(s.id);
  }

  function stand(e) {
    const s = { id: e.id, rev: e.rev, doc: e.doc, draft: !!e.draft, px: e.doc.place.px, py: e.doc.place.py, status: 'loading', failedAt: 0, gone: false,
      parts: [], held: [], y: NaN, groundRead: [NaN, NaN, -Infinity, NaN], t: [0, 0, 0], place: null, lights: [] };
    standing.set(e.id, s);
    load(s);
    return s;
  }

  /** The place's height in its pixel's frame this frame - or NaN while the ground under a 'snap' POI is unknown. */
  function heightOf(s, t) {
    const pl = s.doc.place;
    if (pl.ground === 'absolute') return pl.y;
    const x = t[0] + pl.x, z = t[2] + pl.z;
    const g = s.groundRead;
    if (x !== g[0] || z !== g[1] || t[1] !== g[3] || !Number.isFinite(s.ground) || frameN - g[2] >= POI_GROUND_EVERY) {
      s.ground = groundAt(x, z);
      g[0] = x; g[1] = z; g[2] = frameN; g[3] = t[1];
    }
    return Number.isFinite(s.ground) ? s.ground - t[1] + pl.y : NaN;
  }

  /** Inside a part's box, the capsule's half a pace about it? */
  const inside = (box, f) => !!f && f[0] > box[0] - 0.5 && f[0] < box[3] + 0.5 && f[2] > box[2] - 0.5 && f[2] < box[5] + 0.5 && f[1] + 1.8 > box[1] && f[1] < box[4];

  /** One standing, ready POI this frame: its height, matrices, boxes, collider and lights. */
  function place(s) {
    const t = translation(s.px, s.py, s.t);
    const y = heightOf(s, t);
    if (!Number.isFinite(y)) { s.visible = false; return; }
    const col = collider();
    if (y !== s.y || !s.place) {
      s.y = y;
      s.place = placeMatrix(s.doc.place, y);
      s.lights = lightsOf(s.doc, s.place);
      for (const p of s.parts) {
        p.local = partMatrix(s.place, p.part);
        const b = boxThrough(p.local, p.min, p.max);
        p.localBox = [b.min[0], b.min[1], b.min[2], b.max[0], b.max[1], b.max[2]];
        if (p.stood) { col?.removeBucket?.(p.bucket); p.stood = false; }   // the ground moved under it: stood again below
      }
    }
    s.visible = true;
    const f = feet();
    for (const p of s.parts) {
      p.scene.set(p.local);
      p.scene[12] += t[0]; p.scene[13] += t[1]; p.scene[14] += t[2];
      const lb = p.localBox;
      p.box = [lb[0] + t[0], lb[1] + t[1], lb[2] + t[2], lb[3] + t[0], lb[4] + t[1], lb[5] + t[2]];
      if (p.collide && !p.stood && col?.addMesh && !inside(p.box, f)) {
        col.addMesh(p.bucket, p.positions, p.indices, p.local, riding(s.px, s.py));
        p.stood = true;
      }
    }
  }

  return {
    /** The feed asked when its time has come; every POI on a built pixel stood (loading), placed, and the rest taken down. */
    frame() {
      frameN++;
      feed.tick?.();
      const want = new Map();
      for (const p of pixels()) for (const e of feed.atPixel(p.px, p.py)) want.set(e.id, e);
      for (const s of [...standing.values()]) {
        const e = want.get(s.id);
        if (!e || !!e.draft !== s.draft) { takeDown(s); continue; }   // a draft and its live revision are two stands
        if (e.doc === s.doc) continue;
        // ANOTHER REVISION, OR A DRAFT MOVED: the same meshes and materials (`sameBuild`) only move - its matrices made
        // again, nothing loaded (the editor's realtime drag, an approval that only moved it); anything else is stood afresh
        if (s.status === 'ready' && sameBuild(s.doc, e.doc)) {
          s.doc = e.doc; s.rev = e.rev; s.place = null;
          s.doc.parts.forEach((part, i) => { s.parts[i].part = part; });
          if (e.doc.place.px !== s.px || e.doc.place.py !== s.py) { unstand(s); s.px = e.doc.place.px; s.py = e.doc.place.py; s.ground = NaN; }
        } else takeDown(s);
      }
      for (const [id, e] of want) {
        let s = standing.get(id);
        if (!s) s = stand(e);
        if (s.status === 'failed' && now() - s.failedAt >= POI_RETRY_MS) { takeDown(s); s = stand(e); }
        if (s.status === 'ready') place(s);
      }
    },
    /** The opaque parts, with the world - each by the host's view test (drawn, cast into the shadow maps alone, or neither). */
    draw(r, cull = null) {
      for (const s of standing.values()) {
        if (s.status !== 'ready' || !s.visible) continue;
        for (const p of s.parts) if (p.opaque) drawSeen(r, cull, p.box, p.opaque, p.scene, p.remap, p.shadow ? undefined : { noShadow: true });
      }
    },
    /** The translucent parts, after the opaque world and the water - the farthest first, each blended over what is behind. */
    drawTranslucent(r, eye = null, cull = null) {
      const list = [];
      for (const s of standing.values()) {
        if (s.status !== 'ready' || !s.visible) continue;
        for (const p of s.parts) {
          if (!p.translucent || (cull && cull(p.box) === 2)) continue;
          const c = [(p.box[0] + p.box[3]) / 2, (p.box[1] + p.box[4]) / 2, (p.box[2] + p.box[5]) / 2];
          list.push({ p, d: eye ? (c[0] - eye[0]) ** 2 + (c[1] - eye[1]) ** 2 + (c[2] - eye[2]) ** 2 : 0 });
        }
      }
      list.sort((a, b) => b.d - a.d);
      for (const { p } of list) r.drawMesh(p.translucent, p.scene, p.remap, { translucent: 1 });
    },
    /** The standing POIs' lights as scene-light rows (`{ x, y, z, range, color }`) - a flickering one's range stepped. */
    lights(out = []) {
      const tick = Math.floor(now() / (1000 / FLICKER_HZ));
      for (const s of standing.values()) {
        if (s.status !== 'ready' || !s.visible) continue;
        s.lights.forEach((l, i) => {
          // a step a twelfth of a second, the same for every game: a hash of the light and the step, not a random draw
          const k = l.flicker ? 1 - FLICKER_DEPTH * (((Math.imul(tick + i * 7919, 2654435761) >>> 0) % 1000) / 1000) : 1;
          out.push({ x: l.at[0] + s.t[0], y: l.at[1] + s.t[1], z: l.at[2] + s.t[2], range: l.range * k, color: new Float32Array(l.color) });
        });
      }
      return out;
    },
    /** Every standing POI's mark for the maps (`{ px, py, label, id }`) - built pixel or not: the map shows the realm. */
    marks() {
      const out = [];
      for (const e of feed.all?.() ?? []) {
        const m = e.doc.marker;
        if (m?.show) out.push({ px: e.doc.place.px, py: e.doc.place.py, label: m.label || e.doc.name, id: e.id, draft: !!e.draft });
      }
      return out;
    },
    /** What stands, for the editor's outliner and a test: `[{ id, rev, status, visible, parts }]`. */
    standing() { return [...standing.values()].map((s) => ({ id: s.id, rev: s.rev, status: s.status, visible: !!s.visible, draft: s.draft, parts: s.parts.length })); },
    /** A part's drawn matrix and box (the editor's gizmo and pick). */
    partOf(id, key) { const s = standing.get(id); const p = s?.parts.find((x) => x.key === key); return p ? { scene: p.scene, box: p.box, local: p.local } : null; },
    /** Everything down - a re-anchor, a load, a change of mode; the next frame stands what is still wanted. */
    destroyAll() { for (const s of [...standing.values()]) takeDown(s); },
    _identity: ID,
  };
}

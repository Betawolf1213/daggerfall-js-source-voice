// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-1 (2026-10-14) - THE POI STORE: WHO MAY BUILD, WHO APPROVES, AND WHAT THE WORLD STANDS.
//
// Mac: "POI Tool (General Map Editor) - Realtime editor ... a tool my developers can use without having to access the
// codebase"; asked how a POI reaches players, "I need to be able to approve changes"; asked who uses it, "Developers +
// Builders" (bible/06-Systems/POI-Editor-Arc.md).
//
// THE ROLES, DERIVED AS EVERY GRANT HERE IS (titles.js): an APPROVER is a handle in APPROVER_HANDLES; a BUILDER is an
// approver, a developer (DEVELOPER_HANDLES) or a handle in BUILDER_HANDLES. A guest is neither. Read fresh at every call,
// so a handle taken off a list loses the door at its next request.
//
// THE FLOW (migration 0114): a builder uploads assets (content-addressed: the bytes' sha256 is the name, checked here) and
// saves a DRAFT revision of a POI - one open draft per author per POI, saved over until it is SUBMITTED. An approver
// APPROVES a submitted revision (it becomes the POI's live one, its assets readable by anyone) or REJECTS it with a word.
// Taking a POI out of the world is a submitted 'retire' revision, approved the same way. A ROLLBACK points the POI at an
// earlier approved revision. Every approval, rollback and retirement moves the feed's version - the game's one cheap
// question, "anything new?" (`poiLiveFeed`).
//
// NOTHING A BUILDER WRITES REACHES A PLAYER BEFORE AN APPROVER SAYS SO: the feed is live revisions only, and an asset no
// live revision names is readable only by a builder.
//
// THE LIBRARY'S SHELF (POI-4b): the models builders keep to stand again, shared by them all - an entry is checked by the
// same law a POI is (poiLaw.js poiShelfProblems, its assets stored), changed only by its author or an approver, taken off
// the shelf and never deleted. A shelf is the builders' business: it reaches no player, and its assets stay a builder's
// until a live POI names them.
// ═══════════════════════════════════════════════════════════════════

import { poiDocProblems, poiShelfProblems, poiAssetProblems, poiAssetsOf, POI_ID_RE, POI_SHELF_ID_RE, POI_SHA_RE, POI_LIMITS } from '../../src/poi/poiLaw.js';
import { decodePoiMesh, POI_MESH_LIMITS } from '../../src/poi/poiMesh.js';
import { poiImageMetaOf, POI_IMAGE_LIMITS, POI_IMAGE_TYPES } from '../../src/poi/poiImage.js';
import { developerHandles } from './titles.js';

/** A handle list from the config, as titles.js reads its own - trimmed, case-folded, empty ones dropped. */
function handleList(raw) {
  if (typeof raw !== 'string' || !raw) return new Set();
  return new Set(raw.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean));
}

/** What this player may do with POIs - `{ builder, approver }`. @param {any} player @param {any} env */
export function poiRolesOf(player, env) {
  const h = typeof player?.handle === 'string' && player.handle ? player.handle.toLowerCase() : null;
  if (!h) return { builder: false, approver: false };
  const approver = handleList(env?.APPROVER_HANDLES).has(h);
  const builder = approver || developerHandles(env).has(h) || handleList(env?.BUILDER_HANDLES).has(h);
  return { builder, approver };
}

/** Where an asset's bytes live in the bucket. */
export const poiAssetKey = (/** @type {string} */ sha) => `poi/a/${sha}`;
/** The bytes one account may upload in a day - a builder is trusted, and a day's bound keeps a slip from filling R2. */
export const POI_UPLOAD_DAY_BYTES = 1024 * 1024 * 1024;
/** The bounds a request's raw body is read to: a mesh, a texture, a draft. */
export const POI_ASSET_MAX = Object.freeze({ mesh: POI_MESH_LIMITS.bytes, texture: POI_IMAGE_LIMITS.bytes });
export const POI_DRAFT_BODY_MAX = POI_LIMITS.docBytes + 1024;
/** D1's bound on one statement's parameters (test/accountDb.mjs D1_MAX_BOUND, Cloudflare's limit) - lists go in chunks under it. */
const BOUND_CHUNK = 90;

const hex = (/** @type {ArrayBuffer} */ buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const chunks = (/** @type {any[]} */ list, n = BOUND_CHUNK) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));
const parsed = (/** @type {any} */ text) => { try { return typeof text === 'string' ? JSON.parse(text) : null; } catch { return null; } };

/** Every stored fact of these assets - a Map of sha to `{ kind, live, ...meta }`. @param {any} db @param {string[]} shas */
async function assetFactsOf(db, shas) {
  const out = new Map();
  for (const part of chunks([...new Set(shas)])) {
    if (!part.length) continue;
    const rows = (await db.prepare(`SELECT sha, kind, meta, live FROM poi_assets WHERE sha IN (${part.map(() => '?').join(', ')})`).bind(...part).all()).results ?? [];
    for (const r of rows) out.set(r.sha, { kind: r.kind, live: r.live === 1, ...(parsed(r.meta) ?? {}) });
  }
  return out;
}

// ─── ASSETS ─────────────────────────────────────────────────────────

/**
 * A builder's upload: the bytes named by their own sha256 (checked), read as the kind they claim (a mesh decoded whole,
 * a texture by its header), stored once. A second upload of the same bytes is the first's answer.
 * @param {any} ctx `{ db, bucket, subtle, nowS }` @param {any} player @param {any} env
 * @param {{ sha: string, kind: string, bytes: ArrayBuffer }} a
 */
export async function putPoiAsset(ctx, player, env, { sha, kind, bytes }) {
  if (!poiRolesOf(player, env).builder) return { error: 'poi-not-builder' };
  if (typeof sha !== 'string' || !POI_SHA_RE.test(sha)) return { error: 'poi-sha' };
  if (kind !== 'mesh' && kind !== 'texture') return { error: 'poi-kind' };
  if (!ctx.bucket) return { error: 'no-storage' };
  const got = hex(await ctx.subtle.digest('SHA-256', bytes));
  if (got !== sha) return { error: 'poi-sha-mismatch' };
  let meta, type = 'application/octet-stream';
  if (kind === 'mesh') {
    const d = decodePoiMesh(bytes);
    if ('error' in d) return { error: 'poi-bad-mesh', why: d.error };
    meta = { submeshes: d.mesh.submeshes.length, vertices: d.mesh.positions.length / 3, triangles: d.mesh.indices.length / 3, min: d.mesh.boundsMin, max: d.mesh.boundsMax };
  } else {
    const m = poiImageMetaOf(bytes);
    if ('error' in m) return { error: 'poi-bad-texture', why: m.error };
    meta = { format: m.format, w: m.w, h: m.h };
    type = m.type;
  }
  const had = await ctx.db.prepare('SELECT kind, meta FROM poi_assets WHERE sha = ?').bind(sha).first();
  if (had) return had.kind === kind ? { sha, kind, meta: parsed(had.meta), existed: true } : { error: 'poi-kind' };
  const day = await ctx.db.prepare('SELECT COALESCE(SUM(bytes), 0) AS n FROM poi_assets WHERE by = ? AND at > ?').bind(player.id, ctx.nowS - 86400).first();
  if (Number(day?.n ?? 0) + bytes.byteLength > POI_UPLOAD_DAY_BYTES) return { error: 'poi-quota' };
  await ctx.bucket.put(poiAssetKey(sha), bytes, { httpMetadata: { contentType: type } });
  await ctx.db.prepare('INSERT OR IGNORE INTO poi_assets (sha, kind, bytes, meta, by, at, live) VALUES (?, ?, ?, ?, ?, ?, 0)')
    .bind(sha, kind, bytes.byteLength, JSON.stringify(meta), player.id, ctx.nowS).run();
  return { sha, kind, meta, existed: false };
}

/**
 * An asset's bytes for a reader - anyone's when a live revision names it, else only a builder's (a draft's model is
 * the builders' business until it is approved). `{ object, kind }` or `{ error }`.
 * @param {any} ctx @param {string} sha @param {{ builder: boolean }} roles
 */
export async function getPoiAsset(ctx, sha, roles) {
  if (typeof sha !== 'string' || !POI_SHA_RE.test(sha)) return { error: 'not-found' };
  const row = await ctx.db.prepare('SELECT kind, meta, live FROM poi_assets WHERE sha = ?').bind(sha).first();
  if (!row || (row.live !== 1 && !roles.builder)) return { error: 'not-found' };
  if (!ctx.bucket) return { error: 'no-storage' };
  const object = await ctx.bucket.get(poiAssetKey(sha));
  if (!object) return { error: 'not-found' };
  // its type from the facts stored at its upload - read off its header then - never from the bucket's say
  const type = row.kind === 'texture' ? (POI_IMAGE_TYPES[parsed(row.meta)?.format] ?? 'application/octet-stream') : 'application/octet-stream';
  return { object, kind: row.kind, type, live: row.live === 1 };
}

// ─── DRAFTS AND SUBMISSIONS ─────────────────────────────────────────

/** A document's problems, its own shape's and its assets' - empty for one the realm takes. @param {any} db @param {any} doc */
async function docProblems(db, doc) {
  const own = poiDocProblems(doc);
  if (own.length) return own;
  const { meshes, textures } = poiAssetsOf(doc);
  const facts = await assetFactsOf(db, [...meshes, ...textures]);
  return poiAssetProblems(doc, (sha) => facts.get(sha) ?? null);
}

/**
 * A builder saves a draft of `doc` (its id the POI's - a new id founds the POI). Saved over the author's own open draft
 * of this POI, else a new revision (`base` the revision the editor started from). `{ id, rev, state }` or `{ error, problems? }`.
 * @param {any} ctx @param {any} player @param {any} env @param {{ doc: any, base?: any }} body
 */
export async function savePoiDraft(ctx, player, env, { doc, base = null }) {
  if (!poiRolesOf(player, env).builder) return { error: 'poi-not-builder' };
  const problems = await docProblems(ctx.db, doc);
  if (problems.length) return { error: 'poi-doc', problems };
  const id = doc.id;
  if (base !== null && !(Number.isSafeInteger(base) && base > 0)) return { error: 'body' };
  const poi = await ctx.db.prepare('SELECT id FROM poi_docs WHERE id = ?').bind(id).first();
  if (!poi) {
    if (base !== null) return { error: 'not-found' };
    await ctx.db.prepare('INSERT OR IGNORE INTO poi_docs (id, created_by, created_at) VALUES (?, ?, ?)').bind(id, player.id, ctx.nowS).run();
  } else if (base !== null && !(await ctx.db.prepare('SELECT 1 FROM poi_revs WHERE poi_id = ? AND rev = ?').bind(id, base).first())) return { error: 'not-found' };
  const text = JSON.stringify(doc);
  const mine = await ctx.db.prepare("SELECT rev FROM poi_revs WHERE poi_id = ? AND author = ? AND state = 'draft' AND kind = 'doc' ORDER BY rev DESC LIMIT 1").bind(id, player.id).first();
  if (mine) {
    await ctx.db.prepare("UPDATE poi_revs SET doc = ?, at = ?, base_rev = COALESCE(?, base_rev) WHERE poi_id = ? AND rev = ? AND state = 'draft'")
      .bind(text, ctx.nowS, base, id, mine.rev).run();
    return { id, rev: mine.rev, state: 'draft' };
  }
  // the next revision number taken in the write itself, so two builders saving at once never collide
  await ctx.db.prepare(`INSERT INTO poi_revs (poi_id, rev, kind, doc, base_rev, author, author_name, at, state)
    SELECT ?1, COALESCE(MAX(rev), 0) + 1, 'doc', ?2, ?3, ?4, ?5, ?6, 'draft' FROM poi_revs WHERE poi_id = ?1`)
    .bind(id, text, base, player.id, player.handle, ctx.nowS).run();
  const made = await ctx.db.prepare("SELECT rev FROM poi_revs WHERE poi_id = ? AND author = ? AND state = 'draft' ORDER BY rev DESC LIMIT 1").bind(id, player.id).first();
  return { id, rev: made.rev, state: 'draft' };
}

/** The author's draft, submitted for approval - checked again, so a submission is always a document the realm takes. */
export async function submitPoi(ctx, player, env, { id, rev }) {
  if (!poiRolesOf(player, env).builder) return { error: 'poi-not-builder' };
  if (!POI_ID_RE.test(String(id)) || !Number.isSafeInteger(rev)) return { error: 'body' };
  const row = await ctx.db.prepare('SELECT doc, author, state, kind FROM poi_revs WHERE poi_id = ? AND rev = ?').bind(id, rev).first();
  if (!row) return { error: 'not-found' };
  if (row.author !== player.id) return { error: 'poi-not-author' };
  if (row.state !== 'draft') return { error: 'poi-state', state: row.state };
  const problems = await docProblems(ctx.db, parsed(row.doc));
  if (problems.length) return { error: 'poi-doc', problems };
  const r = await ctx.db.prepare("UPDATE poi_revs SET state = 'submitted', submitted_at = ? WHERE poi_id = ? AND rev = ? AND state = 'draft'").bind(ctx.nowS, id, rev).run();
  if (!r.meta?.changes) return { error: 'poi-state' };
  return { id, rev, state: 'submitted' };
}

/** The author takes a submission back to a draft, before it is decided. */
export async function withdrawPoi(ctx, player, env, { id, rev }) {
  if (!poiRolesOf(player, env).builder) return { error: 'poi-not-builder' };
  if (!POI_ID_RE.test(String(id)) || !Number.isSafeInteger(rev)) return { error: 'body' };
  const row = await ctx.db.prepare('SELECT author, state, kind FROM poi_revs WHERE poi_id = ? AND rev = ?').bind(id, rev).first();
  if (!row) return { error: 'not-found' };
  if (row.author !== player.id) return { error: 'poi-not-author' };
  if (row.state !== 'submitted') return { error: 'poi-state', state: row.state };
  // a retirement has no draft to go back to - withdrawn, it is gone from the queue as a rejection is, by its author's word
  const to = row.kind === 'retire' ? 'rejected' : 'draft';
  await ctx.db.prepare('UPDATE poi_revs SET state = ?, submitted_at = NULL, note = ? WHERE poi_id = ? AND rev = ? AND state = \'submitted\'')
    .bind(to, row.kind === 'retire' ? 'withdrawn by its author' : null, id, rev).run();
  return { id, rev, state: to };
}

/** A builder asks for a live POI to be taken out of the world - a 'retire' revision, submitted, for an approver. */
export async function requestRetire(ctx, player, env, { id }) {
  if (!poiRolesOf(player, env).builder) return { error: 'poi-not-builder' };
  if (!POI_ID_RE.test(String(id))) return { error: 'body' };
  const poi = await ctx.db.prepare('SELECT live_rev FROM poi_docs WHERE id = ?').bind(id).first();
  if (!poi) return { error: 'not-found' };
  if (poi.live_rev == null) return { error: 'poi-not-live' };
  if (await ctx.db.prepare("SELECT 1 FROM poi_revs WHERE poi_id = ? AND kind = 'retire' AND state = 'submitted'").bind(id).first()) return { error: 'poi-pending' };
  await ctx.db.prepare(`INSERT INTO poi_revs (poi_id, rev, kind, doc, base_rev, author, author_name, at, state, submitted_at)
    SELECT ?1, COALESCE(MAX(rev), 0) + 1, 'retire', NULL, ?2, ?3, ?4, ?5, 'submitted', ?5 FROM poi_revs WHERE poi_id = ?1`)
    .bind(id, poi.live_rev, player.id, player.handle, ctx.nowS).run();
  const made = await ctx.db.prepare("SELECT rev FROM poi_revs WHERE poi_id = ? AND kind = 'retire' AND state = 'submitted'").bind(id).first();
  return { id, rev: made.rev, state: 'submitted' };
}

// ─── THE APPROVER'S WORD ────────────────────────────────────────────

/**
 * An approver decides a submitted revision: `approve` stands it in the world (a retirement takes the POI out), `reject`
 * sends it back with a word. One batch - the decision, the live pointer, the assets made public and the feed's version -
 * every write after the first conditional on the first having been this decision, so a decision raced is made once.
 */
export async function reviewPoi(ctx, player, env, { id, rev, verdict, note = null }) {
  if (!poiRolesOf(player, env).approver) return { error: 'poi-not-approver' };
  if (!POI_ID_RE.test(String(id)) || !Number.isSafeInteger(rev) || (verdict !== 'approve' && verdict !== 'reject')) return { error: 'body' };
  if (note !== null && !(typeof note === 'string' && note.length <= POI_LIMITS.note)) return { error: 'body' };
  const row = await ctx.db.prepare('SELECT kind, doc, state FROM poi_revs WHERE poi_id = ? AND rev = ?').bind(id, rev).first();
  if (!row) return { error: 'not-found' };
  if (row.state !== 'submitted') return { error: 'poi-state', state: row.state };
  const now = ctx.nowS;
  const state = verdict === 'approve' ? 'approved' : 'rejected';
  if (verdict === 'approve' && row.kind === 'doc') {
    // checked once more at the moment it goes live: an asset the document names must be stored, and of its kind
    const problems = await docProblems(ctx.db, parsed(row.doc));
    if (problems.length) return { error: 'poi-doc', problems };
  }
  const decided = `EXISTS (SELECT 1 FROM poi_revs WHERE poi_id = ?1 AND rev = ?2 AND state = '${state}' AND reviewer = ?3 AND reviewed_at = ?4)`;
  const steps = [
    ctx.db.prepare("UPDATE poi_revs SET state = ?5, reviewer = ?3, reviewer_name = ?6, reviewed_at = ?4, note = ?7 WHERE poi_id = ?1 AND rev = ?2 AND state = 'submitted'")
      .bind(id, rev, player.id, now, state, player.handle, note),
  ];
  if (verdict === 'approve') {
    steps.push(ctx.db.prepare(`UPDATE poi_docs SET live_rev = ${row.kind === 'retire' ? 'NULL' : '?2'}, live_at = ?4, live_by = ?3 WHERE id = ?1 AND ${decided}`).bind(id, rev, player.id, now));
    if (row.kind === 'doc') {
      const { meshes, textures } = poiAssetsOf(parsed(row.doc));
      for (const part of chunks([...meshes, ...textures], 80)) {
        steps.push(ctx.db.prepare(`UPDATE poi_assets SET live = 1 WHERE sha IN (${part.map((_, i) => `?${i + 5}`).join(', ')}) AND ${decided}`).bind(id, rev, player.id, now, ...part));
      }
    }
    steps.push(ctx.db.prepare(`UPDATE poi_feed SET v = v + 1, at = ?4 WHERE k = 'feed' AND ${decided}`).bind(id, rev, player.id, now));
  }
  const res = await ctx.db.batch(steps);
  if (!res[0]?.meta?.changes) return { error: 'poi-state' };
  if (verdict === 'approve') forgetPoiFeed();
  return { id, rev, state };
}

/** An approver points a POI at an earlier approved revision (a rollback - or a retired POI stood again). */
export async function rollbackPoi(ctx, player, env, { id, rev }) {
  if (!poiRolesOf(player, env).approver) return { error: 'poi-not-approver' };
  if (!POI_ID_RE.test(String(id)) || !Number.isSafeInteger(rev)) return { error: 'body' };
  const row = await ctx.db.prepare('SELECT kind, state, doc FROM poi_revs WHERE poi_id = ? AND rev = ?').bind(id, rev).first();
  if (!row) return { error: 'not-found' };
  if (row.state !== 'approved' || row.kind !== 'doc') return { error: 'poi-state', state: row.state };
  const problems = await docProblems(ctx.db, parsed(row.doc));
  if (problems.length) return { error: 'poi-doc', problems };
  const { meshes, textures } = poiAssetsOf(parsed(row.doc));
  const steps = [ctx.db.prepare('UPDATE poi_docs SET live_rev = ?, live_at = ?, live_by = ? WHERE id = ?').bind(rev, ctx.nowS, player.id, id)];
  for (const part of chunks([...meshes, ...textures], 80)) steps.push(ctx.db.prepare(`UPDATE poi_assets SET live = 1 WHERE sha IN (${part.map(() => '?').join(', ')})`).bind(...part));
  steps.push(ctx.db.prepare("UPDATE poi_feed SET v = v + 1, at = ? WHERE k = 'feed'").bind(ctx.nowS));
  await ctx.db.batch(steps);
  forgetPoiFeed();
  return { id, rev, live: true };
}

// ─── READS ──────────────────────────────────────────────────────────

/** Every POI, for a builder's list: its live revision, where it stands, and its revisions' states (no documents). */
export async function listPoi(ctx, player, env) {
  if (!poiRolesOf(player, env).builder) return { error: 'poi-not-builder' };
  const docs = (await ctx.db.prepare('SELECT id, created_by, created_at, live_rev, live_at, live_by FROM poi_docs ORDER BY created_at DESC LIMIT 2000').all()).results ?? [];
  const revs = (await ctx.db.prepare(`SELECT poi_id, rev, kind, author, author_name, at, state, submitted_at, reviewer_name, reviewed_at, base_rev,
    json_extract(doc, '$.name') AS name, json_extract(doc, '$.place.px') AS px, json_extract(doc, '$.place.py') AS py
    FROM poi_revs ORDER BY poi_id, rev`).all()).results ?? [];
  const byPoi = new Map();
  for (const r of revs) {
    if (!byPoi.has(r.poi_id)) byPoi.set(r.poi_id, []);
    byPoi.get(r.poi_id).push(r);
  }
  return {
    pois: docs.map((d) => {
      const rs = byPoi.get(d.id) ?? [];
      const live = rs.find((r) => r.rev === d.live_rev) ?? null;
      const newest = rs[rs.length - 1] ?? null;
      const named = live ?? [...rs].reverse().find((r) => r.kind === 'doc') ?? null;
      return {
        id: d.id, name: named?.name ?? d.id, px: named?.px ?? null, py: named?.py ?? null, createdBy: d.created_by, createdAt: d.created_at,
        liveRev: d.live_rev, liveAt: d.live_at, newestRev: newest?.rev ?? null,
        revs: rs.map((r) => ({ rev: r.rev, kind: r.kind, author: r.author_name, authorId: r.author, at: r.at, state: r.state, submittedAt: r.submitted_at, reviewer: r.reviewer_name, reviewedAt: r.reviewed_at, base: r.base_rev })),
      };
    }),
  };
}

/** One POI's every revision, documents and all - the history, and the drafts to open. */
export async function poiHistory(ctx, player, env, id) {
  if (!poiRolesOf(player, env).builder) return { error: 'poi-not-builder' };
  if (!POI_ID_RE.test(String(id))) return { error: 'body' };
  const poi = await ctx.db.prepare('SELECT id, created_by, created_at, live_rev, live_at, live_by FROM poi_docs WHERE id = ?').bind(id).first();
  if (!poi) return { error: 'not-found' };
  const revs = (await ctx.db.prepare('SELECT * FROM poi_revs WHERE poi_id = ? ORDER BY rev').bind(id).all()).results ?? [];
  return {
    id, liveRev: poi.live_rev, liveAt: poi.live_at, createdAt: poi.created_at,
    revs: revs.map((r) => ({ rev: r.rev, kind: r.kind, doc: parsed(r.doc), base: r.base_rev, author: r.author_name, authorId: r.author, at: r.at, state: r.state, submittedAt: r.submitted_at, reviewer: r.reviewer_name, reviewedAt: r.reviewed_at, note: r.note })),
  };
}

// ─── THE LIBRARY'S SHELF (POI-4b) ───────────────────────────────────

/** The entries one builder may keep on the shelf at once - a bound on a slip, not on a builder's work. */
export const POI_SHELF_MAX = 2000;
/** The entries a list answers, newest first. */
export const POI_SHELF_LIST = 5000;

/** Every entry on the shelf, newest change first, without its parts - what a builder browses. `{ items }`. */
export async function listShelf(ctx, player, env) {
  if (!poiRolesOf(player, env).builder) return { error: 'poi-not-builder' };
  const rows = (await ctx.db.prepare(`SELECT id, name, tags, thumb, parts, triangles, by, by_name, at, updated_at, updated_by FROM poi_shelf
    WHERE gone_at IS NULL ORDER BY updated_at DESC, id LIMIT ${POI_SHELF_LIST}`).all()).results ?? [];
  return {
    items: rows.map((r) => ({ id: r.id, name: r.name, tags: parsed(r.tags) ?? [], thumb: r.thumb, parts: r.parts, triangles: r.triangles, by: r.by_name, byId: r.by, at: r.at, updatedAt: r.updated_at, updatedBy: r.updated_by })),
  };
}

/** One entry, its parts and lights - what is stood when it is placed. */
export async function shelfEntry(ctx, player, env, id) {
  if (!poiRolesOf(player, env).builder) return { error: 'poi-not-builder' };
  if (!POI_SHELF_ID_RE.test(String(id))) return { error: 'body' };
  const r = await ctx.db.prepare('SELECT item, by, by_name, at, updated_at, gone_at FROM poi_shelf WHERE id = ?').bind(id).first();
  if (!r || r.gone_at != null) return { error: 'not-found' };
  return { id, item: parsed(r.item), by: r.by_name, byId: r.by, at: r.at, updatedAt: r.updated_at };
}

/**
 * A builder puts an entry on the shelf, or changes one: checked whole (its shape and its assets, stored and of their
 * kinds), new under its own id, or over an entry of the builder's own (an approver's, any entry). `{ id, at }`.
 * @param {any} ctx @param {any} player @param {any} env @param {{ item: any }} body
 */
export async function shelve(ctx, player, env, { item }) {
  const roles = poiRolesOf(player, env);
  if (!roles.builder) return { error: 'poi-not-builder' };
  const own = poiShelfProblems(item);
  if (own.length) return { error: 'poi-doc', problems: own };
  const { meshes, textures } = poiAssetsOf(item);
  const facts = await assetFactsOf(ctx.db, [...meshes, ...textures]);
  const problems = poiAssetProblems(item, (sha) => facts.get(sha) ?? null);
  if (problems.length) return { error: 'poi-doc', problems };
  const triangles = item.parts.reduce((n, part) => n + (Number(facts.get(part.mesh)?.triangles) || 0), 0);
  const text = JSON.stringify(item), tags = JSON.stringify(item.tags ?? []);
  const had = await ctx.db.prepare('SELECT by, gone_at FROM poi_shelf WHERE id = ?').bind(item.id).first();
  if (had) {
    if (had.gone_at != null) return { error: 'not-found' };
    if (had.by !== player.id && !roles.approver) return { error: 'poi-not-author' };
    await ctx.db.prepare('UPDATE poi_shelf SET item = ?, name = ?, tags = ?, thumb = ?, parts = ?, triangles = ?, updated_at = ?, updated_by = ? WHERE id = ? AND gone_at IS NULL')
      .bind(text, item.name, tags, item.thumb, item.parts.length, triangles, ctx.nowS, player.handle, item.id).run();
    return { id: item.id, at: ctx.nowS };
  }
  const kept = await ctx.db.prepare('SELECT COUNT(*) AS n FROM poi_shelf WHERE by = ? AND gone_at IS NULL').bind(player.id).first();
  if (Number(kept?.n ?? 0) >= POI_SHELF_MAX) return { error: 'poi-quota' };
  await ctx.db.prepare(`INSERT OR IGNORE INTO poi_shelf (id, item, name, tags, thumb, parts, triangles, by, by_name, at, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(item.id, text, item.name, tags, item.thumb, item.parts.length, triangles, player.id, player.handle, ctx.nowS, ctx.nowS, player.handle).run();
  return { id: item.id, at: ctx.nowS };
}

/** An entry taken off the shelf by its author or an approver - kept, as every record here is, but listed no more. */
export async function unshelve(ctx, player, env, { id }) {
  const roles = poiRolesOf(player, env);
  if (!roles.builder) return { error: 'poi-not-builder' };
  if (!POI_SHELF_ID_RE.test(String(id))) return { error: 'body' };
  const r = await ctx.db.prepare('SELECT by, gone_at FROM poi_shelf WHERE id = ?').bind(id).first();
  if (!r || r.gone_at != null) return { error: 'not-found' };
  if (r.by !== player.id && !roles.approver) return { error: 'poi-not-author' };
  await ctx.db.prepare('UPDATE poi_shelf SET gone_at = ?, gone_by = ? WHERE id = ? AND gone_at IS NULL').bind(ctx.nowS, player.handle, id).run();
  return { id, gone: true };
}

/** The approver's queue: every submitted revision, oldest first, with the live document it would replace. */
export async function poiQueue(ctx, player, env) {
  if (!poiRolesOf(player, env).approver) return { error: 'poi-not-approver' };
  const rows = (await ctx.db.prepare(`SELECT r.poi_id, r.rev, r.kind, r.doc, r.base_rev, r.author_name, r.at, r.submitted_at, d.live_rev, l.doc AS live_doc
    FROM poi_revs r JOIN poi_docs d ON d.id = r.poi_id LEFT JOIN poi_revs l ON l.poi_id = r.poi_id AND l.rev = d.live_rev
    WHERE r.state = 'submitted' ORDER BY r.submitted_at, r.poi_id, r.rev LIMIT 500`).all()).results ?? [];
  return {
    queue: rows.map((r) => ({
      id: r.poi_id, rev: r.rev, kind: r.kind, doc: parsed(r.doc), base: r.base_rev, author: r.author_name, at: r.at, submittedAt: r.submitted_at,
      liveRev: r.live_rev, liveDoc: parsed(r.live_doc),
      // made from a revision that is no longer the live one: approving it puts back over whatever went live since
      stale: r.kind === 'doc' && r.live_rev != null && r.base_rev !== r.live_rev,
    })),
  };
}

// ─── THE FEED THE GAME READS ────────────────────────────────────────

/** The isolate's kept feed - `{ v, body, live, checkedMs }` - so a game's minute-by-minute ask costs no read most times. */
let kept = null;
/** How long a kept feed answers before its version is asked again. */
export const POI_FEED_KEEP_MS = 15_000;
/** Forget the kept feed (an approval in this isolate; a test's fresh service). */
export function forgetPoiFeed() { kept = null; }

/**
 * THE LIVE FEED: every POI's live document - `{ v, pois: [{ id, rev, doc }] }` - and the set of assets they name. Kept
 * in the isolate; past POI_FEED_KEEP_MS the version row is asked (one small read), and the documents read again only when
 * it moved. `nowMs` the clock. @param {any} db @param {number} nowMs
 */
export async function poiLiveFeed(db, nowMs) {
  if (kept && nowMs - kept.checkedMs < POI_FEED_KEEP_MS) return kept;
  const feed = await db.prepare("SELECT v FROM poi_feed WHERE k = 'feed'").first();
  const v = Number(feed?.v ?? 0);
  if (kept && kept.v === v) { kept.checkedMs = nowMs; return kept; }
  const rows = (await db.prepare(`SELECT d.id, d.live_rev AS rev, r.doc FROM poi_docs d JOIN poi_revs r ON r.poi_id = d.id AND r.rev = d.live_rev
    WHERE d.live_rev IS NOT NULL AND r.kind = 'doc' AND r.state = 'approved' ORDER BY d.id`).all()).results ?? [];
  const pois = [];
  const live = new Set();
  for (const r of rows) {
    const doc = parsed(r.doc);
    if (!doc) continue;
    pois.push({ id: r.id, rev: r.rev, doc });
    const { meshes, textures } = poiAssetsOf(doc);
    for (const s of [...meshes, ...textures]) live.add(s);
  }
  kept = { v, body: JSON.stringify({ v, pois }), live, checkedMs: nowMs };
  return kept;
}

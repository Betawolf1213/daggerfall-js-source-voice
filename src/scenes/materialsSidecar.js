// rw-materials sidecars (raven-wright's contract, docs/rw-materials-sidecar.md v1): vendor/<v>/materials/blocks/
// <BLOCK>.mat.json paint one placed model of a block with another texture - Roblox-style "click a model, pick a
// material". RMB data cannot say this, so the editor writes a sidecar and the port applies it as a draw-time remap
// exactly like HOME-LOOK (world/homeLook.js): pixels from the overridden record (put through the host's own climate
// swap, rule 2), UVs the original's, a NEW Map per table so the renderer's EV2 identity cache refreshes. Parsing,
// matching and the remap building are pure; only the glob needs the browser (node tests feed objects directly).
// Door law: a sub-mesh whose texture IS a door - subMeshDoorType over the climate-reduced archive (74, 56, 95, 331
// with record > 0) - is NEVER repainted in any mode, or doors stop working. UV transforms other than the identity
// are ignored with a one-time warning: the renderer has no UV re-upload path (contract, Port implementation).
import { DOOR_TYPE, subMeshDoorType } from '../world/meshReader.js';
import { modSettingIfDeclared } from '../systems/modSettings.js';
import { blockRecords, matchEntrance, recordKey } from './poiSidecar.js';

export const MATERIALS_FORMAT = 'rw-materials';
export const MATERIALS_VERSION = 1;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isPos = (p) => Array.isArray(p) && p.length === 3 && p.every(isNum);
const isTexRef = (t) => !!t && Number.isSafeInteger(t.archive) && t.archive >= 0 && Number.isSafeInteger(t.record) && t.record >= 0;
const vendorOf = (p) => /vendor[\\/]([^\\/]+)[\\/]/.exec(p)?.[1] ?? '';
/** True when a texture makes a door (the contract's door law, climate reduction included): never paint one. */
export const isDoorTexture = (archive, record) => subMeshDoorType(archive, record) !== DOOR_TYPE.NONE;

/** @param {any} json @param {string} file @returns {{block: string, overrides: any[], warnings: string[]}} */
export function parseMaterialsFile(json, file = '') {
  const warnings = [];
  const out = { block: '', overrides: [], warnings };
  if (!json || json.format !== MATERIALS_FORMAT || json.version !== MATERIALS_VERSION || typeof json.block !== 'string' || !json.block) {
    warnings.push(`${file}: not an ${MATERIALS_FORMAT} v${MATERIALS_VERSION} file - ignored`);
    return out;
  }
  out.block = json.block.toUpperCase();
  (Array.isArray(json.overrides) ? json.overrides : []).forEach((o, i) => {
    const where = `${file} overrides[${i}]`;
    const kind = o?.kind;
    if (!o || (kind !== 'misc3d' && kind !== 'subModel')) { warnings.push(`${where}: kind must be misc3d or subModel - skipped`); return; }
    if (kind === 'subModel' && !Number.isInteger(o.sub)) { warnings.push(`${where}: subModel needs an integer sub - skipped`); return; }
    if (!isNum(o.modelId) || !isPos(o.pos)) { warnings.push(`${where}: needs modelId and pos[3] - skipped`); return; }
    const mode = o.mode;
    if (mode !== 'all' && mode !== 'replace') { warnings.push(`${where}: mode must be all or replace - skipped`); return; }
    if (!isTexRef(o.to)) { warnings.push(`${where}: to needs {archive, record} - skipped`); return; }
    if (isDoorTexture(o.to.archive, o.to.record)) { warnings.push(`${where}: to ${o.to.archive}.${o.to.record} is a door texture - skipped`); return; }
    let from = null;
    if (o.from != null) {
      if (!isTexRef(o.from)) { warnings.push(`${where}: from must be {archive, record} or null - skipped`); return; }
      if (isDoorTexture(o.from.archive, o.from.record)) { warnings.push(`${where}: from ${o.from.archive}.${o.from.record} is a door texture - skipped`); return; }
      from = { archive: o.from.archive, record: o.from.record };
    }
    if (mode === 'replace' && !from) { warnings.push(`${where}: replace needs a from texture - skipped`); return; }
    let uv = null;
    if (o.uv != null) {
      const okScale = Array.isArray(o.uv.scale) && o.uv.scale.length === 2 && o.uv.scale.every((s) => isNum(s) && s > 0);
      const okOffset = Array.isArray(o.uv.offset) && o.uv.offset.length === 2 && o.uv.offset.every(isNum);
      const okRot = o.uv.rot === undefined || [0, 90, 180, 270].includes(o.uv.rot);
      if (!okScale || !okOffset || !okRot) { warnings.push(`${where}: unusable uv - skipped`); return; }
      uv = { scale: o.uv.scale.slice(), offset: o.uv.offset.slice(), rot: o.uv.rot ?? 0 };
    }
    if (o.material != null && typeof o.material !== 'string') warnings.push(`${where}: material is not a string (informational - kept)`);
    out.overrides.push({
      id: String(o.id ?? `m${i}`), kind, sub: kind === 'subModel' ? o.sub : null, modelId: o.modelId, pos: o.pos.slice(),
      mode, from, to: { archive: o.to.archive, record: o.to.record }, material: typeof o.material === 'string' ? o.material : null, uv,
      climate: o.climate === true,   // opt-in: run `to` through the town's climate law; default = the authored texture, literally
    });
  });
  const seen = new Set();
  out.overrides = out.overrides.filter((o) => {
    if (seen.has(o.id)) { warnings.push(`${file}: override id '${o.id}' is not unique - the later one dropped`); return false; }
    seen.add(o.id);
    return true;
  });
  return out;
}

/** The per-block index, path order; a throwing file is a warning, never a crash. Mirrors buildPoiIndex's shape. */
export function buildMaterialsIndex(files, { isOn = () => true } = {}) {
  /** @type {string[]} */ const warnings = [];
  /** @type {Map<string, any[]>} */ const blocks = new Map();
  const guarded = (path, fn) => { try { return fn(); } catch (e) { warnings.push(`${path}: ${e?.message ?? e}`); return null; } };
  for (const path of Object.keys(files?.blocks ?? {}).sort()) {
    const vendor = vendorOf(path);
    if (!guarded(path, () => isOn(vendor))) continue;
    const r = guarded(path, () => parseMaterialsFile(files.blocks?.[path], path));
    if (!r) continue;
    warnings.push(...r.warnings);
    if (!r.block || !r.overrides.length) continue;
    const slot = blocks.get(r.block) ?? [];
    for (const o of r.overrides) slot.push({ ...o, vendor, file: path });
    blocks.set(r.block, slot);
  }
  return { blocks, warnings };
}

/** The contract's matching rule, the rw-poi one verbatim (kind/sub/model equal, each axis within 16 units, nearest wins). */
export const matchOverride = (override, records) => matchEntrance(override, records);

/** Does this sub-mesh take the override? Doors never do, in any mode (contract rule 1). */
export function materialTakes(override, sm) {
  if (!override || !sm) return false;
  if (isDoorTexture(sm.textureArchive, sm.textureRecord)) return false;
  if (override.mode === 'all') return true;
  const f = override.from;
  return !!f && f.archive === sm.textureArchive && f.record === sm.textureRecord;
}

/** The pure remap table: 'a_r' -> 'toA_toR' over every sub-mesh the override takes (no climate, no uploads). */
export function buildMaterialRemap(override, subMeshes) {
  const out = new Map();
  if (!override?.to) return out;
  const to = `${override.to.archive}_${override.to.record}`;
  for (const sm of subMeshes ?? []) if (materialTakes(override, sm)) out.set(`${sm.textureArchive}_${sm.textureRecord}`, to);
  return out;
}

/**
 * The model's OWN draw table: the override's record put through the host's climate law exactly as the original would
 * be (contract rule 2 - a temperate wall turns desert where the town is desert), uploaded like homeLookRemap and
 * texRemap.js do, pruned when the target archive lacks the record, and every other sub-mesh carries the pixel's own
 * swap from `base` (doors included - they keep working). Always a NEW Map (EV2 caches by remap identity).
 * @param {Array<{textureArchive:number,textureRecord:number}>|undefined} subMeshes
 * @param {Map<string,string>|null} base - the pixel's climate table for this host
 * @param {any} override - a parsed override (to {archive, record})
 * @param {(archive:number, record:number) => number} climateArchive - the host's bound applyClimate
 * @param {{getTexture:(a:number)=>Promise<any>, uploadRecord:(a:number,r:number,o?:any)=>void}} deps
 */
export async function materialsRemap(subMeshes, base, override, climateArchive, { getTexture, uploadRecord }) {
  const out = new Map();
  for (const sm of subMeshes ?? []) {
    const key = `${sm.textureArchive}_${sm.textureRecord}`;
    if (out.has(key)) continue;
    if (override && materialTakes(override, sm)) {
      const a = override.climate ? climateArchive(override.to.archive, override.to.record) : override.to.archive;   // literal unless the override opts into the climate law
      let tex = null;
      try { tex = await getTexture(a); } catch { tex = null; }
      if (tex && override.to.record < tex.recordCount) {
        uploadRecord(a, override.to.record, { opaque: true });   // a mesh material, as the climate swap uploads it (texRemap.js)
        out.set(key, `${a}_${override.to.record}`);
        continue;
      }
      // the archive lacks the record: pruned, the sub-mesh keeps the town's texture (the texRemap.js prune, same reason)
    }
    const swapped = base?.get?.(key);
    if (swapped) out.set(key, swapped);
  }
  return out;
}

/**
 * A block's overrides resolved against its parsed records: Map of recordKey -> override (one per record, the first in
 * file order wins). Unresolved ones are dangling: warned through `warn`, never thrown.
 */
/** Paint one placed model when its block's sidecar has an override for its record: sets entry._rwMat + a NEW entry.texRemap; returns the hit or null. */
export async function paintEntry(entry, matBlock, source, subMeshes, base, climateArchive, pipeline) {
  const hit = matBlock?.size && source ? matBlock.get(recordKey(source)) : null;
  if (!hit) return null;
  entry._rwMat = hit;
  entry.texRemap = await materialsRemap(subMeshes, base, hit, climateArchive, pipeline);
  return hit;
}

export function resolveBlockOverrides(blockName, overrides, dfBlock, warn = console.warn) {
  const records = blockRecords(dfBlock);
  const out = new Map();
  for (const o of overrides) {
    const rec = matchOverride(o, records);
    if (!rec) { warn(`[materials] ${o.file ?? blockName}: override ${o.id} matches no placed ${o.kind} (model ${o.modelId}) in ${blockName} - ignored`); continue; }
    const k = recordKey(rec);
    if (out.has(k)) { warn(`[materials] ${o.file ?? blockName}: override ${o.id} and ${out.get(k).id} match the same record in ${blockName} - the first wins`); continue; }
    out.set(k, o);
  }
  return out;
}

/**
 * The module's runtime, built once per host: `forBlock(blockName, dfBlock)` answers a Map recordKey -> override.
 * Online is harmless (contract rule 4) - the runtime stays active there. UV transforms are ignored with a one-time
 * warning here: the renderer has no UV re-upload path.
 */
export function createMaterialsRuntime(index, { warn = console.warn } = {}) {
  const warned = new Set();
  const once = (msg) => { if (!warned.has(msg)) { warned.add(msg); warn(msg); } };
  return {
    index,
    active: index.blocks.size > 0,
    hasBlock: (name) => index.blocks.has(String(name).toUpperCase()),
    forBlock(blockName, dfBlock) {
      const slot = index.blocks.get(String(blockName).toUpperCase());
      if (!slot?.length) return new Map();
      const resolved = resolveBlockOverrides(blockName, slot, dfBlock, once);
      for (const o of resolved.values()) {
        const uv = o.uv;
        if (uv && !(uv.scale[0] === 1 && uv.scale[1] === 1 && uv.offset[0] === 0 && uv.offset[1] === 0 && uv.rot === 0)) {
          once(`[materials] ${o.file ?? blockName}: override ${o.id} asks a uv transform - the renderer has no uv path, the texture swap applies without it`);
        }
      }
      return resolved;
    },
  };
}

const IN_BROWSER = typeof window !== 'undefined';
const MAT_FILES = IN_BROWSER ? import.meta.glob('../../vendor/*/materials/blocks/*.mat.json', { eager: true, import: 'default' }) : {};

/** The index of every vendored materials sidecar the build saw; a vendor reads its Enabled switch, an undeclared one is on. */
export function loadMaterialsIndex({ warn = console.warn } = {}) {
  const isOn = (vendor) => { try { const v = modSettingIfDeclared(vendor, 'Enabled'); return v === undefined ? true : v === true; } catch { return true; } };
  const index = buildMaterialsIndex({ blocks: MAT_FILES }, { isOn });
  for (const w of index.warnings) warn(`[materials] ${w}`);
  return index;
}

/** A host's runtime: sidecars indexed, warnings through console.warn once. */
export function createHostMaterials() {
  let index;
  try { index = loadMaterialsIndex(); } catch (e) { console.warn(`[materials] sidecars did not load (${e?.message ?? e})`); index = { blocks: new Map(), warnings: [] }; }
  return createMaterialsRuntime(index);
}

// rw-poi sidecars (raven-wright's contract, docs/rw-poi-sidecar.md v1): vendor/<v>/poi/dungeons.json and
// vendor/<v>/poi/blocks/<BLOCK>.poi.json add what DFU world data cannot say - any model a dungeon entrance, linked
// doors, enemy spawners. Parsing, matching, pools and spawner timing are pure; only the glob needs the browser.
import { MOBILE_TYPES } from '../characters/mobileTypes.js';
import { DUNGEON_TYPES } from '../formats/mapsFile.js';
import { modSettingIfDeclared } from '../systems/modSettings.js';
import { isOnlinePage } from '../systems/onlineLane.js';
import { registerModSaveData } from '../systems/modSaveData.js';
import { GLOBAL_SCALE } from '../world/meshReader.js';
import { worldMinutes, setWorldMinutes } from '../systems/worldTick.js';

/** The spawners' clock, in game hours: the world's own minutes (the respawn is a game-time cooldown). */
export const poiHours = () => worldMinutes() / 60;
/** Probe seam: set the game clock to `h` hours (respawn timing in a test run). */
export const setPoiHours = (h) => { setWorldMinutes(h * 60); return poiHours(); };

export const POI_DUNGEONS_FORMAT = 'rw-poi-dungeons';
export const POI_BLOCK_FORMAT = 'rw-poi-block';
export const POI_VERSION = 1;
/** The contract's matching tolerance: each of XPos, YPos, ZPos within this many RMB units. */
export const POI_MATCH_UNITS = 16;
export const POI_SAVE_VENDOR = 'rw-poi';

const KEY_RE = /^[a-z0-9-]+$/;
const TIERS = ['easy', 'hard', 'miniboss'];
const THEMES = ['orc', 'undead', 'daedra', 'animal', 'humanoid', 'any'];
const vendorOf = (p) => /vendor[\\/]([^\\/]+)[\\/]/.exec(p)?.[1] ?? '';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isPos = (p) => Array.isArray(p) && p.length === 3 && p.every(isNum);

/** @param {any} json @param {string} file @returns {{dungeons: any[], warnings: string[]}} */
export function parseDungeonsFile(json, file = '') {
  const warnings = [];
  const dungeons = [];
  if (!json || json.format !== POI_DUNGEONS_FORMAT || json.version !== POI_VERSION || !Array.isArray(json.dungeons)) {
    warnings.push(`${file}: not an ${POI_DUNGEONS_FORMAT} v${POI_VERSION} file - ignored`);
    return { dungeons, warnings };
  }
  json.dungeons.forEach((d, i) => {
    const where = `${file} dungeons[${i}]`;
    if (!d || typeof d.key !== 'string' || !KEY_RE.test(d.key)) { warnings.push(`${where}: key must match [a-z0-9-] - skipped`); return; }
    if (typeof d.name !== 'string' || !d.name) { warnings.push(`${where} (${d.key}): no name - skipped`); return; }
    const s = d.source;
    let source = null;
    if (s?.kind === 'location' && (isNum(s.mapId) || (typeof s.name === 'string' && (isNum(s.region) || typeof s.region === 'string')))) {
      source = { kind: 'location', region: s.region ?? null, name: s.name ?? null, mapId: isNum(s.mapId) ? s.mapId : null };
    } else if (s?.kind === 'rdb' && Array.isArray(s.blocks) && s.blocks.length && s.blocks.every((b) => typeof b === 'string')) {
      source = { kind: 'rdb', blocks: s.blocks.slice(), start: isNum(s.start) ? s.start : 0 };
    }
    if (!source) { warnings.push(`${where} (${d.key}): unusable source - skipped`); return; }
    if (d.type != null && !Object.hasOwn(DUNGEON_TYPES, d.type)) warnings.push(`${where} (${d.key}): unknown DungeonTypes name '${d.type}'`);
    dungeons.push({ key: d.key, name: d.name, type: d.type ?? null, theme: typeof d.theme === 'string' ? d.theme : 'any', source });
  });
  return { dungeons, warnings };
}

/** @param {any} json @param {string} file @returns {{block: string, entrances: any[], spawners: any[], warnings: string[]}} */
export function parseBlockFile(json, file = '') {
  const warnings = [];
  const out = { block: '', entrances: /** @type {any[]} */ ([]), spawners: /** @type {any[]} */ ([]), warnings };
  if (!json || json.format !== POI_BLOCK_FORMAT || json.version !== POI_VERSION || typeof json.block !== 'string' || !json.block) {
    warnings.push(`${file}: not an ${POI_BLOCK_FORMAT} v${POI_VERSION} file - ignored`);
    return out;
  }
  out.block = json.block.toUpperCase();
  (Array.isArray(json.entrances) ? json.entrances : []).forEach((e, i) => {
    const where = `${file} entrances[${i}]`;
    const kind = e?.kind;
    if (!e || (kind !== 'misc3d' && kind !== 'subModel')) { warnings.push(`${where}: kind must be misc3d or subModel - skipped`); return; }
    if (!isNum(e.modelId) || !isPos(e.pos) || typeof e.dungeon !== 'string' || !KEY_RE.test(e.dungeon)) { warnings.push(`${where}: needs modelId, pos[3] and a dungeon key - skipped`); return; }
    if (kind === 'subModel' && !Number.isInteger(e.sub)) { warnings.push(`${where}: subModel needs an integer sub - skipped`); return; }
    out.entrances.push({ id: String(e.id ?? `e${i}`), kind, sub: kind === 'subModel' ? e.sub : null, modelId: e.modelId, pos: e.pos.slice(), dungeon: e.dungeon });
  });
  (Array.isArray(json.spawners) ? json.spawners : []).forEach((s, i) => {
    const where = `${file} spawners[${i}]`;
    const mobiles = Array.isArray(s?.mobiles) ? s.mobiles : [];
    const count = Array.isArray(s?.count) && s.count.length === 2 && s.count.every((n) => Number.isInteger(n) && n >= 0) && s.count[0] <= s.count[1] ? s.count : null;
    if (!s || !isPos(s.pos) || !count) { warnings.push(`${where}: needs pos[3] and count [min,max] - skipped`); return; }
    if (!TIERS.includes(s.tier)) { warnings.push(`${where}: tier must be easy|hard|miniboss - skipped`); return; }
    if (!THEMES.includes(s.theme) && mobiles.length === 0) { warnings.push(`${where}: unknown theme '${s.theme}' - skipped`); return; }
    if (!isNum(s.radius_m) || !isNum(s.trigger_m) || !(s.respawn_h === null || isNum(s.respawn_h))) { warnings.push(`${where}: radius_m, trigger_m and respawn_h (number or null) are required - skipped`); return; }
    out.spawners.push({
      id: String(s.id ?? `s${i}`), pos: s.pos.slice(), tier: s.tier, theme: s.theme, mobiles: mobiles.filter(Number.isInteger),
      count: count.slice(), radius_m: s.radius_m, trigger_m: s.trigger_m, respawn_h: s.respawn_h,
    });
  });
  return out;
}

/**
 * The dungeon-key registry and the per-block index. Clashing keys warn and the first (path order) wins; an entrance naming
 * an unknown dungeon warns and is dropped. Never throws.
 * @param {{dungeons?: Record<string, any>, blocks?: Record<string, any>}} files path -> parsed JSON
 * @param {{isOn?: (vendor: string) => boolean}} [opts]
 */
export function buildPoiIndex(files, { isOn = () => true } = {}) {
  /** @type {string[]} */ const warnings = [];
  /** @type {Map<string, any>} */ const dungeons = new Map();
  /** @type {Map<string, {entrances: any[], spawners: any[]}>} */ const blocks = new Map();
  const guarded = (path, fn) => { try { return fn(); } catch (e) { warnings.push(`${path}: ${e?.message ?? e}`); return null; } };
  for (const path of Object.keys(files?.dungeons ?? {}).sort()) {
    const vendor = vendorOf(path);
    if (!guarded(path, () => isOn(vendor))) continue;
    const r = guarded(path, () => parseDungeonsFile(files.dungeons?.[path], path));
    if (!r) continue;
    warnings.push(...r.warnings);
    for (const d of r.dungeons) {
      if (dungeons.has(d.key)) { warnings.push(`${path}: dungeon key '${d.key}' is already taken by ${dungeons.get(d.key).vendor} - the first wins`); continue; }
      dungeons.set(d.key, { ...d, vendor });
    }
  }
  for (const path of Object.keys(files?.blocks ?? {}).sort()) {
    const vendor = vendorOf(path);
    if (!guarded(path, () => isOn(vendor))) continue;
    const r = guarded(path, () => parseBlockFile(files.blocks?.[path], path));
    if (!r) continue;
    warnings.push(...r.warnings);
    if (!r.block) continue;
    const slot = blocks.get(r.block) ?? { entrances: [], spawners: [] };
    for (const e of r.entrances) {
      if (!dungeons.has(e.dungeon)) { warnings.push(`${path}: entrance ${e.id} names unknown dungeon '${e.dungeon}' - dropped`); continue; }
      slot.entrances.push({ ...e, vendor, file: path });
    }
    for (const s of r.spawners) slot.spawners.push({ ...s, vendor, file: path });
    blocks.set(r.block, slot);
  }
  return { dungeons, blocks, warnings };
}

/** Placed records of a parsed RMB block, in the contract's terms (XPos/YPos/ZPos are the record's own). */
export function blockRecords(dfBlock) {
  const rmb = dfBlock?.rmbBlock;
  const out = [];
  (rmb?.subRecords ?? []).forEach((sr, sub) => {
    for (const o of sr?.exterior?.block3dObjectRecords ?? []) out.push({ kind: 'subModel', sub, modelId: o.modelIdNum, pos: [o.xPos, o.yPos, o.zPos] });
  });
  for (const o of rmb?.misc3dObjectRecords ?? []) out.push({ kind: 'misc3d', sub: null, modelId: o.modelIdNum, pos: [o.xPos, o.yPos, o.zPos] });
  return out;
}

/** The contract's matching rule: kind/sub equal, ModelIdNum equal, each position axis within 16 units; nearest wins. */
export function matchEntrance(entrance, records) {
  let best = null, bestD = Infinity;
  for (const r of records) {
    if (r.kind !== entrance.kind || r.modelId !== entrance.modelId) continue;
    if (entrance.kind === 'subModel' && r.sub !== entrance.sub) continue;
    let d = 0, ok = true;
    for (let i = 0; i < 3; i++) { const a = Math.abs(r.pos[i] - entrance.pos[i]); if (a > POI_MATCH_UNITS) { ok = false; break; } d += a; }
    if (ok && d < bestD) { bestD = d; best = r; }
  }
  return best;
}

/** A record's identity, the key a layout's placed model is looked up by. */
export const recordKey = (r) => `${r.kind}|${r.sub ?? ''}|${r.modelId}|${r.pos.join(',')}`;

/**
 * A block's entrances resolved against its parsed records: Map of recordKey -> entrance. Unresolved ones are warned
 * through `warn`, never thrown.
 */
export function resolveBlockEntrances(blockName, entrances, dfBlock, warn = console.warn) {
  const records = blockRecords(dfBlock);
  const out = new Map();
  for (const e of entrances) {
    const rec = matchEntrance(e, records);
    if (!rec) { warn(`[poi] ${e.file ?? blockName}: entrance ${e.id} matches no placed ${e.kind} (model ${e.modelId}) in ${blockName} - not an entrance`); continue; }
    out.set(recordKey(rec), e);
  }
  return out;
}

/** DFU DungeonTypes-keyed or free-text themes the spawners default to are read through this. */
export const themeOf = (dungeon) => (THEMES.includes(dungeon?.theme) ? dungeon.theme : 'any');

const M = MOBILE_TYPES;
/**
 * Tier/theme -> mobile ids, all DFU's own MobileTypes (DaggerfallUnityEnums.cs:142-208); levels are EnemyBasics.cs's
 * (Orc 5, OrcSergeant 7, OrcShaman 13, OrcWarlord 16, SkeletalWarrior 9, Zombie 10, Ghost 11, Mummy 11, Wraith 15, ...).
 */
export const SPAWN_POOLS = Object.freeze({
  orc: { easy: [M.Orc], hard: [M.OrcSergeant, M.OrcShaman], miniboss: [M.OrcWarlord] },
  undead: { easy: [M.SkeletalWarrior, M.Zombie], hard: [M.Ghost, M.Mummy, M.Wraith, M.Vampire], miniboss: [M.VampireAncient, M.Lich, M.AncientLich] },
  daedra: { easy: [M.FireAtronach, M.IronAtronach, M.FleshAtronach, M.IceAtronach], hard: [M.FrostDaedra, M.FireDaedra, M.Daedroth, M.DaedraSeducer], miniboss: [M.DaedraLord] },
  animal: { easy: [M.Rat, M.GiantBat, M.Spider], hard: [M.GrizzlyBear, M.SabertoothTiger, M.GiantScorpion], miniboss: [M.SabertoothTiger, M.GiantScorpion] },
  humanoid: { easy: [M.Thief, M.Rogue, M.Burglar, M.Barbarian, M.Acrobat], hard: [M.Warrior, M.Archer, M.Ranger, M.Assassin, M.Monk], miniboss: [M.Knight, M.Battlemage, M.Sorcerer, M.Nightblade] },
});
/** Class-enemy level bands per tier (class enemies take the level handed in; monsters' levels are their rows'). */
export const TIER_LEVELS = Object.freeze({ easy: [1, 6], hard: [7, 14], miniboss: [15, 20] });

/** The mobile ids a spawner draws from: its exact list when it has one, else its theme's pool at its tier ('any' = every theme's). */
export function mobilePool(spawner) {
  const exact = (spawner.mobiles ?? []).filter((id) => Object.values(M).includes(id) && id !== M.Horse_Invalid && id !== M.None);
  if (exact.length) return exact;
  const tier = TIERS.includes(spawner.tier) ? spawner.tier : 'easy';
  if (spawner.theme === 'any' || !SPAWN_POOLS[spawner.theme]) return [...new Set(Object.values(SPAWN_POOLS).flatMap((p) => p[tier]))];
  return [...SPAWN_POOLS[spawner.theme][tier]];
}

/** One activation's roll: how many (inclusive count range) and which, scattered within radius_m of the spawner's point. */
export function rollSpawn(spawner, rng = Math.random) {
  const [lo, hi] = spawner.count;
  const n = lo + Math.floor(rng() * (hi - lo + 1));
  const pool = mobilePool(spawner);
  const [l0, l1] = TIER_LEVELS[spawner.tier] ?? TIER_LEVELS.easy;
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * spawner.radius_m;
    out.push({ mobileType: pool[Math.floor(rng() * pool.length)], dx: Math.cos(a) * r, dz: Math.sin(a) * r, level: l0 + Math.floor(rng() * (l1 - l0 + 1)), yaw: rng() * Math.PI * 2 });
  }
  return out;
}

/** Spawner timing: never spawned -> go; respawn_h null -> once per save; else after respawn_h in-game hours. */
export function spawnerReady(lastHours, nowHours, respawnH) {
  if (lastHours == null) return true;
  if (respawnH == null) return false;
  return nowHours - lastHours >= respawnH;
}

/** Cooldowns: site key -> in-game hour of the last activation. Saved in the mod's save slot (installPoiSave). */
const _cooldowns = new Map();
export const poiCooldowns = () => _cooldowns;
export const _resetPoiCooldowns = () => _cooldowns.clear();
export const poiSaveData = () => ({ cooldowns: Object.fromEntries(_cooldowns) });
export function restorePoiSaveData(rec) {
  _cooldowns.clear();
  for (const [k, v] of Object.entries(rec?.cooldowns ?? {})) if (isNum(v)) _cooldowns.set(k, v);
}

/**
 * One frame of spawner checks. `sites` carry a stable `key`, the `spawner` and its world `pos`; a site within trigger_m
 * of the player and ready fires once through `spawn(mobileType, pos, {level, yaw})`. Answers what fired.
 */
export function tickSpawners(sites, { player, hours, spawn, rng = Math.random, cooldowns = _cooldowns }) {
  const fired = [];
  for (const site of sites) {
    const s = site.spawner;
    const d = Math.hypot(site.pos[0] - player[0], site.pos[1] - player[1], site.pos[2] - player[2]);
    if (d > s.trigger_m || !spawnerReady(cooldowns.get(site.key), hours, s.respawn_h)) continue;
    cooldowns.set(site.key, hours);
    const rolls = rollSpawn(s, rng);
    for (const r of rolls) spawn(r.mobileType, [site.pos[0] + r.dx, site.pos[1], site.pos[2] + r.dz], { level: r.level, yaw: r.yaw });
    fired.push({ key: site.key, id: s.id, mobiles: rolls.map((r) => r.mobileType) });
  }
  return fired;
}

/**
 * A dungeon's source as the port's own DFLocation. 'location' reads that existing location (region index or name + name,
 * or a map id); 'rdb' needs the port's block-name resolver to take WorldData RDB files and is not served: null + warning.
 * @returns {any|null}
 */
export function resolveDungeonLocation(dungeon, maps, warn = console.warn) {
  const src = dungeon.source;
  try {
    if (src.kind !== 'location') { warn(`[poi] dungeon '${dungeon.key}': source kind '${src.kind}' is not supported by this port - its entrances are plain models`); return null; }
    let regionIdx = -1, locIdx;
    if (src.mapId != null) {
      for (let r = 0; r < maps.regionCount && locIdx === undefined; r++) {
        const i = maps.getRegion(r)?.mapIdLookup?.get(src.mapId);
        if (i !== undefined) { regionIdx = r; locIdx = i; }
      }
    } else {
      regionIdx = typeof src.region === 'number' ? src.region : maps.getRegionIndex(src.region);
      const reg = regionIdx >= 0 ? maps.getRegion(regionIdx) : null;
      locIdx = reg?.mapNameLookup?.get(src.name);
      if (locIdx === undefined && reg) {
        const want = String(src.name).toLowerCase();
        const at = (reg.mapNames ?? []).findIndex((n) => String(n).toLowerCase() === want);
        if (at >= 0) locIdx = at;
      }
    }
    const loc = locIdx === undefined ? null : maps.getLocation(regionIdx, locIdx);
    if (!loc?.hasDungeon) { warn(`[poi] dungeon '${dungeon.key}': its source location has no dungeon - its entrances are plain models`); return null; }
    return loc;
  } catch (e) {
    warn(`[poi] dungeon '${dungeon.key}': source did not resolve (${e?.message ?? e})`);
    return null;
  }
}

/**
 * The activation door a tagged model becomes (the shape getStaticDoors hands, doorType DUNGEON_ENTRANCE = 2): at the +z
 * face of the model's box, low, with a trigger box wide enough to cover the whole model. `box` is the model-space AABB.
 */
export function poiDoorFor(box, matrix, blockIndex, recordIndex) {
  const w = box[3] - box[0], h = box[4] - box[1], d = box[5] - box[2];
  const span = Math.max(w, d, 2);   // a thin post is still a target the crosshair can find
  const low = Math.min(h / 2, 0.9);   // the door's centre stays within reach of the ground, whatever the model's height
  return {
    matrix, doorType: 2, blockIndex, recordIndex, doorIndex: 0,
    centre: { x: (box[0] + box[3]) / 2, y: box[1] + low, z: box[5] },   // on the +z face: the way out lands before it
    normal: { x: 0, y: 0, z: 1 },
    size: { x: span, y: Math.max(Math.min(h, 4), 2.4), z: 1 },
  };
}

/**
 * The module's runtime, built once per host: `forBlock(blockName, dfBlock)` answers a Map recordKey -> { entrance, dungeon,
 * dfLocation } for the entrances that resolve (each warned once), `spawnersOf(blockName)` the block's spawners.
 */
export function createPoiRuntime(index, maps, { warn = console.warn, online = false } = {}) {
  const locCache = new Map();
  const warned = new Set();
  const once = (msg) => { if (!warned.has(msg)) { warned.add(msg); warn(msg); } };
  const locationOf = (dungeon) => {
    if (!locCache.has(dungeon.key)) locCache.set(dungeon.key, resolveDungeonLocation(dungeon, maps, once));
    return locCache.get(dungeon.key);
  };
  return {
    index,
    active: !online && (index.dungeons.size > 0 || index.blocks.size > 0),
    hasBlock: (name) => !online && index.blocks.has(String(name).toUpperCase()),
    forBlock(blockName, dfBlock) {
      const slot = online ? null : index.blocks.get(String(blockName).toUpperCase());
      if (!slot?.entrances.length) return new Map();
      const resolved = resolveBlockEntrances(blockName, slot.entrances, dfBlock, once);
      const out = new Map();
      for (const [k, e] of resolved) {
        const dungeon = index.dungeons.get(e.dungeon);
        const dfLocation = dungeon ? locationOf(dungeon) : null;
        if (dfLocation) out.set(k, { entrance: e, dungeon, dfLocation });
      }
      return out;
    },
    spawnersOf: (blockName) => (online ? [] : index.blocks.get(String(blockName).toUpperCase())?.spawners ?? []),
  };
}

const IN_BROWSER = typeof window !== 'undefined';
const DUNGEON_FILES = IN_BROWSER ? import.meta.glob('../../vendor/*/poi/dungeons.json', { eager: true, import: 'default' }) : {};
const BLOCK_FILES = IN_BROWSER ? import.meta.glob('../../vendor/*/poi/blocks/*.poi.json', { eager: true, import: 'default' }) : {};

/** The index of every vendored sidecar the build saw; a vendor reads its Enabled switch, an undeclared one is on. */
export function loadPoiIndex({ warn = console.warn } = {}) {
  const isOn = (vendor) => { try { const v = modSettingIfDeclared(vendor, 'Enabled'); return v === undefined ? true : v === true; } catch { return true; } };
  const index = buildPoiIndex({ dungeons: DUNGEON_FILES, blocks: BLOCK_FILES }, { isOn });
  for (const w of index.warnings) warn(`[poi] ${w}`);
  return index;
}

/** The runtime for a host: sidecars indexed, none online (the sidecars are an offline authoring layer). */
export function createHostPoi(maps) {
  let online = false;
  try { online = isOnlinePage(); } catch { online = false; }
  let index;
  try { index = loadPoiIndex(); } catch (e) { console.warn(`[poi] sidecars did not load (${e?.message ?? e})`); index = { dungeons: new Map(), blocks: new Map(), warnings: [] }; }
  return createPoiRuntime(index, maps, { online });
}

/** A tagged model's entry for a host's door list: the door, and the dungeon + group that make it enter and leave by itself. */
export function poiDoorEntry(hit, modelBox, matrix, blockIndex, recordIndex, base) {
  const group = `poi:${hit.dungeon.key}:${base.pixelKey ?? 'loc'}:${matrix[12].toFixed(2)},${matrix[14].toFixed(2)}`;
  return { ...base, door: poiDoorFor(modelBox, matrix, blockIndex, recordIndex), recordIndex, dfLocation: hit.dfLocation, group, poi: { dungeon: hit.dungeon, entrance: hit.entrance, group } };
}

/** A spawner's block-local RMB position as scene units in the block's frame (the same law as a misc3d record: y = -YPos - 4, z + 4096). */
export const spawnerLocal = (pos) => [pos[0] * GLOBAL_SCALE, (-pos[1] - 4) * GLOBAL_SCALE, (pos[2] + 4096) * GLOBAL_SCALE];

/** The sites a placed block's spawners stand at; `origin` is the block's origin in the host's frame. Key: stable across sessions. */
export function spawnerSites(spawners, blockName, origin, cellKey) {
  return spawners.map((spawner) => {
    const l = spawnerLocal(spawner.pos);
    return { key: `${cellKey}|${blockName}|${spawner.id}`, spawner, local: [origin[0] + l[0], origin[1] + l[1], origin[2] + l[2]] };
  });
}

/** The mod's save slot: cooldowns ride the save so a once-per-save spawner stays spent. */
export function installPoiSave() {
  registerModSaveData(POI_SAVE_VENDOR, { newSaveData: () => ({ cooldowns: {} }), getSaveData: poiSaveData, restoreSaveData: restorePoiSaveData, newGame: () => _resetPoiCooldowns() });
}

/**
 * A host's spawner driver. `addBlock` registers a laid-out block's spawners (idempotent per cell), `tick` fires the ones the
 * player has come within trigger_m of, through the host's own foe pool (`spawn`), standing each on the ground `groundY` finds.
 * @param {{poi: any, spawn: Function, groundY: (x:number, y:number, z:number) => number, player: () => number[]|null, hours: () => number, rng?: () => number}} deps
 */
export function createPoiSpawners({ poi, spawn, groundY, player, hours, rng = Math.random }) {
  /** @type {Map<string, any>} */ const sites = new Map();
  return {
    addBlock(blockName, origin, cellKey) {
      for (const site of spawnerSites(poi.spawnersOf(blockName), blockName, origin, cellKey)) if (!sites.has(site.key)) sites.set(site.key, { ...site, pos: site.local });
    },
    dropCell(cellKey) { for (const k of [...sites.keys()]) if (k.startsWith(`${cellKey}|`)) sites.delete(k); },
    count: () => sites.size,
    tick() {
      if (!sites.size) return [];
      const p = player();
      if (!p) return [];
      const near = [...sites.values()].filter((s) => Math.hypot(s.pos[0] - p[0], s.pos[2] - p[2]) <= s.spawner.trigger_m + 1);
      if (!near.length) return [];
      const withGround = near.map((s) => ({ ...s, pos: [s.pos[0], groundY(s.pos[0], p[1], s.pos[2]), s.pos[2]] }));
      return tickSpawners(withGround, { player: p, hours: hours(), rng, spawn: (type, at, o) => spawn(type, [at[0], groundY(at[0], p[1], at[2]), at[2]], o) });
    },
  };
}

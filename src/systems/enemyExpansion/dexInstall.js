// DEX1 (2026-10-19, Mac: "I want to implement this as our next mod 1:1") - DAGGERFALL ENEMY EXPANSION 1.3.4 (Kamer &
// Kab), THE INSTALL: what BestiaryMod.Start does at the game's load (BestiaryMod.cs:172-197), once, after Roleplay &
// Realism's own install - DFU runs every mod's Init (RR's Awake writes its enemy appearance) before this MonoBehaviour's
// Start, so the rows this edits are the rows those left.
//
// LOADED FOR THE GAME, AS DFU LOADS A MOD (modSettings.js latchModLoaded): the switch is read here, once, and the
// mod's doors read the latch - a switch flipped mid-game waits for the next load, as the tile says.
//   ALWAYS (whatever the switch): the fifty enemies join the table, their careers the custom career registry, their
//     names the text provider and their pictures the texture door (DEX2, dexSprites.js). In DFU a disabled mod registers nothing - and a game saved with a Goblin in it and loaded
//     with the mod off finds no row for it; here the row is still there and nothing that is the mod's reaches it (no
//     table rolls it, no quest names it, no hook of the mod's runs), so the save loads and the world is DFU's.
//   WHILE LOADED: the sixteen classic rows and the two classic classes edited (written into the table, and again at a
//     foe's mint over Meaner Monsters' and the overhaul's - DFU's order: their Init, then this Start), and the quest
//     foes added. (DEX3: the encounter tables; DEX4: the hooks; DEX5: the troll; DEX6: the equipment - each its own.)

import { DEX_TABLE_TEXT } from './dexTableText.js';
import { classicCareers, readCareerTable, readEnemyTables, careerFromSpec, writeEnemyLine } from './dexTables.js';
import { ENEMY_BASICS, registerEnemyRows, isClassicEnemyId, enemyDisplayName } from '../../characters/enemy/enemyBasics.js';
import { registerCustomCareerTemplate, registerCustomEnemyName } from '../../characters/enemy/customEnemies.js';
import { loadMonsterCareer, loadClassCareer, registerMintRowEditor } from '../../characters/enemy/enemyEntity.js';
import { addIntoQuestTables } from '../quest/tables.js';
import { modSetting, latchModLoaded, modLatchedOn } from '../modSettings.js';
import { installDexSprites } from './dexSprites.js';   // DEX2: the fifty's pictures, whatever the switch

export const DEX_VENDOR = 'daggerfall-enemy-expansion';
/** The mod as loaded for this game: the latch its install set, else (before the install, or in a test) its switch. */
export const dexLoaded = () => modLatchedOn(DEX_VENDOR) ?? modSetting(DEX_VENDOR, 'Enabled') === true;

/** The files of one kind, in GetDBAssets' order (the manifest's, which DEX_TABLE_TEXT keeps). */
const dbAssets = (extension) => Object.entries(DEX_TABLE_TEXT).filter(([n]) => n.endsWith(extension)).map(([n, text]) => [n.replace(/\.csv$/, ''), text]);

/** `[DEX]` lines to the console, Debug.LogError / LogWarning's way. */
const consoleLog = (level, message) => (level === 'error' ? console.error(message) : console.warn(message));

let _read = null;
const _classicOriginals = new Map();

/** The mod's read, made once: the careers (classic and its own), its enemies, the classic edits, the raw spellbooks and
 *  the quest foe lines. `liveRow` is read now - after the installs before this one. */
export function dexRead({ log = consoleLog } = {}) {
  if (_read) return _read;
  const careers = classicCareers();
  for (const [name, text] of dbAssets('.cdb.csv')) readCareerTable(text, careers, name, log);
  const enemies = readEnemyTables(dbAssets('.mdb.csv'), careers, {
    liveRow: (id) => ENEMY_BASICS[id],
    isClassic: isClassicEnemyId,
    classicName: (id) => enemyDisplayName(id),
    log,
  });
  _read = { careers, ...enemies };
  return _read;
}

/** BestiaryMod.GetCustomProperties (:68-78): a classic id's properties (only while the mod is loaded - its edits are
 *  the mod's), a mod's id's; null where the mod has none. */
export function dexProperties(mobileId) {
  const read = _read;
  if (!read) return null;
  if (isClassicEnemyId(mobileId)) return dexLoaded() ? read.classic.get(mobileId)?.props ?? null : null;
  return read.enemies.get(mobileId)?.props ?? null;
}

/** BestiaryMod.CustomEnemies' ids (the fifty), ascending. */
export const dexEnemyIds = () => (_read ? [..._read.enemies.keys()].sort((a, b) => a - b) : []);

/** A career spec resolved: its base career read from the player's files (a copy - careerFromSpec), the mod's edits on
 *  it; one career per spec, as DFU registers one DFCareer object for every enemy that names it. */
const _careers = new Map();
function careerLoader(spec) {
  return (fetchBytes) => {
    if (!_careers.has(spec)) {
      const base = !spec.base ? Promise.resolve(null)
        : spec.base.kind === 'monster' ? loadMonsterCareer(spec.base.index, fetchBytes) : loadClassCareer(spec.base.index, fetchBytes);
      _careers.set(spec, base.then((b) => careerFromSpec(spec, b)));
    }
    return _careers.get(spec);
  };
}

/** A classic row as the mod's line leaves it, over `row` as it stands (a fresh copy; the line's cells re-read, so the
 *  writes that read the row - CastsMagic, RangedAttackAnimFrames - read THIS one). */
function editedClassicRow(id, row, read) {
  const c = read.classic.get(id);
  if (!c?.row) return row;
  let out = row;
  for (const line of c.lines) {   // each of the id's lines, in the order they were read
    const copy = { ...structuredClone(out), id };
    const r = writeEnemyLine(copy, structuredClone(c.props), line.tokens, line.col, { mobileID: id, enemyReplacement: true, classicReplacement: true, careers: read.careers, lineNumber: line.lineNumber });
    if (!r.ok) continue;
    delete copy.id;
    out = copy;
  }
  return out;
}

/** A classic row as the mod's lines leave it, whatever the switch - the read alone (the relay's bounds are held to it:
 *  `net/foeBounds.js` FOE_BOUND_ROWS, the most a row stands at with the mod loaded too). `row` unchanged where the mod
 *  names no line for `id`. */
export const dexClassicRow = (id, row) => editedClassicRow(id, row, dexRead());

let _installed = false;
/** BestiaryMod.Start, once per page. `on` is the switch as this load reads it (the test seam). Answers what loaded. */
export function installEnemyExpansion({ on = modSetting(DEX_VENDOR, 'Enabled') === true, log = consoleLog } = {}) {
  if (_installed) return { loaded: dexLoaded(), enemies: _read?.enemies.size ?? 0 };
  _installed = true;
  const read = dexRead({ log });
  // ALWAYS: the fifty, their careers, their names (BestiaryTextProvider.GetCustomEnemyName answers the mod's own only)
  const rows = [];
  for (const [id, e] of read.enemies) {
    const row = { ...e.row };
    delete row.id;
    rows.push([id, row]);
    const spec = read.careers.get(e.careerName) ?? [...read.careers.values()].find((s) => s.name.toLowerCase() === e.careerName.toLowerCase());
    registerCustomCareerTemplate(id, { name: spec.name, load: careerLoader(spec) });
  }
  registerEnemyRows(rows);
  registerCustomEnemyName((id) => read.enemies.get(id)?.props.name || null);
  installDexSprites();   // DEX2: their pictures on the texture door, and the xml's scales
  const loaded = latchModLoaded(DEX_VENDOR, on);
  if (loaded) {
    // the classic rows edited, written into the table as EnemyBasics.Enemies is written (the originals kept, the revert's)
    for (const [id, c] of read.classic) {
      if (!c.row) continue;
      const target = ENEMY_BASICS[id];
      _classicOriginals.set(id, structuredClone(target));
      for (const k of Object.keys(target)) delete target[k];
      const row = { ...c.row };
      delete row.id;
      Object.assign(target, row);
    }
    // and at a foe's mint, over Meaner Monsters' and the overhaul's rows (their Init, then this Start)
    registerMintRowEditor((mobileType, row) => (read.classic.get(mobileType)?.row ? editedClassicRow(mobileType, row, read) : row));
    // QuestMachine.FoesTable.AddIntoTable (:1344): the new names the Foes table lacks, when it loads
    addIntoQuestTables({ foes: read.questFoes.map(([id, name]) => ({ line: `${id}, ${name}`, unlessKey: name })) });   // `if (!FoesTable.HasValue(questName))` - asked of the table as it stands when the rows land
  }
  return { loaded, enemies: read.enemies.size };
}

/** The test seam: the classic rows put back, every registration of the read let go. */
export function _resetEnemyExpansion() {
  for (const [id, saved] of _classicOriginals) {
    const target = ENEMY_BASICS[id];
    for (const k of Object.keys(target)) delete target[k];
    Object.assign(target, saved);
  }
  _classicOriginals.clear();
  for (const id of _read ? _read.enemies.keys() : []) delete ENEMY_BASICS[String(id)];
  _careers.clear();
  _read = null;
  _installed = false;
}

// THE QUEST PACK LOADER (Q4-v) - the vendored DFU quest pack
// (vendor/dfu-quests: 265 quest sources + the tables, MIT,
// provenance-pinned README) into the browser. Vite's raw glob turns
// each .txt into a lazy chunk; loadQuestPack() preloads them ALL once
// so the machine's data seams stay synchronous (the C# shape - DFU
// reads files off disk on demand; the port fronts one await).
//
// BROWSER-ONLY: import.meta.glob is a Vite compile-time macro - node
// tests never import this module (they feed the bridge fs-backed
// seams). The tables ALSO land in the quest system's module registry
// (loadQuestTables) - the parser's static tables and the pack's list
// tables load from one place.

import { loadQuestTables } from '../systems/quest/tables.js';
import { installQuestRoles, parseRolesFile, questSpawnerHook } from './questRoles.js';   // RW-QUEST-ROLES
import { setSpawnerRoleHook } from './poiSidecar.js';
import { applyForageFix } from '../systems/foragingLaw.js';   // FORAGE-FIX: Foraging's quest and list patches, applied as they are read

const tableFiles = import.meta.glob('../../vendor/dfu-quests/Tables/*.txt', { query: '?raw', import: 'default' });
const questFiles = import.meta.glob('../../vendor/dfu-quests/Quests/*.txt', { query: '?raw', import: 'default' });
// RR3: a vendored mod's Quests/ folder - its QuestList-<name>.txt lands
// with the tables (the registered list's seam) and its quest sources
// with the pack's (GetQuest checks the mod's folder the same way).
// WA1: Warm Ashes - Ships' too - its list and its four loose quests
// (the manifest's LooseQuestsList: DFU's GetQuest finds a loaded mod's
// quest by name, AnyModContainsQuest; the source seam here is that).
const modQuestFiles = {
  ...import.meta.glob('../../vendor/roleplay-realism/Quests/*.txt', { query: '?raw', import: 'default' }),
  ...import.meta.glob('../../vendor/warm-ashes-ships/Quests/*.txt', { query: '?raw', import: 'default' }),
  // FORAGE1: Foraging's list and its 22 quests, verbatim - FORAGE-FIX's patches applied as they are read (below)
  ...import.meta.glob('../../vendor/foraging/Quests/*.txt', { query: '?raw', import: 'default' }),
};

// RW-QUESTS (raven-wright Q3): authored quest packs, any vendor's rwquests/ - <QUEST>.txt sources, QuestList-*.txt lists,
// <QUEST>.places.txt rows merged into Quests-Places (the permanent places its world links name), <QUEST>.roles.json roles.
const rwQuestFiles = import.meta.glob('../../vendor/*/rwquests/*.txt', { query: '?raw', import: 'default' });
const rwRoleFiles = import.meta.glob('../../vendor/*/rwquests/*.roles.json', { query: '?raw', import: 'default' });

const stripBom = (s) => s.replace(/^﻿/, '');
const baseName = (path) => path.split('/').pop().replace(/\.txt$/, '');

let _pack = null;

/** Load every table + quest source once; answers the bridge's data
 *  seams. Safe to call repeatedly - one shared load. */
export async function loadQuestPack() {
  if (_pack) return _pack;
  _pack = (async () => {
    const tables = new Map();
    await Promise.all(Object.entries(tableFiles).map(async ([path, load]) => {
      tables.set(baseName(path), stripBom(await load()));
    }));
    const quests = new Map();
    await Promise.all(Object.entries(questFiles).map(async ([path, load]) => {
      quests.set(baseName(path), stripBom(await load()).split(/\r?\n/));
    }));
    await Promise.all(Object.entries(modQuestFiles).map(async ([path, load]) => {
      const name = baseName(path);
      const text = stripBom(await load());
      // FORAGE-FIX (bible/06-Systems/Foraging.md 12): Foraging's quest and list patches (Q7-Q9, Q13) over the author's
      // own text - never an edit of it. A patch that no longer finds its line is a changed file: it warns and the
      // author's text loads as shipped, so one mod's patch can never take the whole pack (and the scene) down with it.
      let patched = text;
      if (path.includes('/vendor/foraging/')) {
        try { patched = applyForageFix(name, text); } catch (e) { console.warn(`[questData] ${e.message} - loaded as shipped`); }
      }
      if (name.startsWith('QuestList-')) tables.set(name, patched);
      else quests.set(name, patched.split(/\r?\n/));
    }));
    const extraPlaces = [];
    await Promise.all(Object.entries(rwQuestFiles).map(async ([path, load]) => {
      const name = baseName(path), text = stripBom(await load());
      if (name.endsWith('.places')) extraPlaces.push(...text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('--')));
      else if (name.startsWith('QuestList-')) tables.set(name, text);
      else quests.set(name, text.split(/\r?\n/));
    }));
    if (extraPlaces.length && tables.has('Quests-Places')) tables.set('Quests-Places', `${tables.get('Quests-Places').replace(/\s*$/, '')}\r\n${extraPlaces.join('\r\n')}\r\n`);
    const roles = await Promise.all(Object.entries(rwRoleFiles).map(async ([path, load]) => {
      try { return parseRolesFile(JSON.parse(stripBom(await load())), path.split('/vendor/').pop()); }
      catch (e) { return { quest: null, roles: [], warnings: [`${path}: ${e.message}`] }; }
    }));
    installQuestRoles(roles);
    setSpawnerRoleHook(questSpawnerHook);
    loadQuestTables(Object.fromEntries(tables));
    return {
      /** QuestList-<name>.txt (the QuestListsManager's dep). */
      readListTable: (name) => tables.get(`QuestList-${name}`) ?? null,
      /** Quest source lines by name (the machine + lists dep). */
      getQuestSourceLines: (name) => quests.get(name) ?? null,
      questCount: quests.size,
    };
  })();
  return _pack;
}

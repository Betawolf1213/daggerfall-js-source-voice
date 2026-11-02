// questRoles.js - raven-wright quest roles (rw-quest-roles v1): vendor/*/rwquests/roles.json binds one quest's giver,
// Persons and Foes to authored world objects. An interior NPC can offer the quest (giver) or stand for a Person while it
// runs (person); a POI spawner stands the quest's Foe once per run instead of its usual roll (foe). Contract: raven-wright
// docs/rw-quest-v1.md "World links (Q3)".
import { QuestResourceBehaviour } from '../systems/quest/resourceBehaviour.js';
import { mintQuestFoeWave } from './questFoeHost.js';

export const ROLES_FORMAT = 'rw-quest-roles';
export const ROLES_VERSION = 1;
export const ROLE_KINDS = ['giver', 'person', 'foe'];
export const ROLE_MATCH_UNITS = 16;   // the POI/materials record law: the nearest within 16 RMB units

const SYM_RE = /^[A-Za-z0-9_.-]+$/;   // the rw-quest symbol charset (bare: the compiler adds the underscores)
const isPos = (p) => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite);
const blockKey = (b) => String(b).toUpperCase();

/** One roles.json validated: `{quest, roles, warnings}`; bad roles are dropped with a warning, a bad file yields no roles. */
export function parseRolesFile(json, file = 'roles.json') {
  const warnings = [];
  if (!json || json.format !== ROLES_FORMAT || json.version !== ROLES_VERSION || typeof json.quest !== 'string' || !json.quest) {
    return { quest: null, roles: [], warnings: [`${file}: not an ${ROLES_FORMAT} v${ROLES_VERSION} file with a quest name`] };
  }
  const roles = [];
  for (const [i, r] of (Array.isArray(json.roles) ? json.roles : []).entries()) {
    const at = `${file} roles[${i}]`;
    if (!r || !ROLE_KINDS.includes(r.kind)) { warnings.push(`${at}: unknown kind '${r?.kind}'`); continue; }
    if (typeof r.block !== 'string' || !r.block) { warnings.push(`${at}: block missing`); continue; }
    if (r.kind !== 'giver' && !(typeof r.sym === 'string' && SYM_RE.test(r.sym))) { warnings.push(`${at}: sym missing`); continue; }
    if (r.kind === 'foe') {
      if (typeof r.spawner !== 'string' || !r.spawner) { warnings.push(`${at}: spawner id missing`); continue; }
    } else if (!Number.isInteger(r.sub) || r.sub < 0 || !isPos(r.pos)) { warnings.push(`${at}: sub/pos missing`); continue; }
    roles.push({ ...r, quest: json.quest, block: blockKey(r.block) });
  }
  return { quest: json.quest, roles, warnings };
}

/** All parsed files indexed: npc roles by `BLOCK|sub`, foe roles by `BLOCK|spawnerId`. */
export function buildRolesIndex(parsed) {
  const npc = new Map(), spawner = new Map();
  for (const f of parsed) {
    for (const r of f.roles) {
      const [map, key] = r.kind === 'foe' ? [spawner, `${r.block}|${r.spawner}`] : [npc, `${r.block}|${r.sub}`];
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
  }
  return { npc, spawner };
}

/** The npc roles standing on this interior person: same block + building record, nearest-record position within 16 units. */
export function npcRolesFor(index, at, pn) {
  if (!at?.block || !pn) return [];
  const list = index.npc.get(`${blockKey(at.block)}|${at.sub}`);
  if (!list) return [];
  return list.filter((r) => Math.hypot(r.pos[0] - pn.rawX, r.pos[1] - pn.rawY, r.pos[2] - pn.rawZ) <= ROLE_MATCH_UNITS);
}

/** The running (not complete) quest of this name, or null. */
export function liveQuest(machine, name) {
  const want = String(name).toUpperCase();
  for (const q of machine?.quests?.values?.() ?? []) {
    if (!q.questComplete && String(q.questName).toUpperCase() === want) return q;
  }
  return null;
}

/** The quest a giver role on this person would offer now (none while that quest already runs), or null. */
export function giverQuestFor(index, machine, at, pn) {
  const r = npcRolesFor(index, at, pn).find((x) => x.kind === 'giver' && !liveQuest(machine, x.quest));
  return r ? r.quest : null;
}

/** A person role's behaviour for this static NPC while its quest runs: assigned to the Person, started - else null. */
export function personBehaviourFor(index, machine, at, pn, host, Behaviour = QuestResourceBehaviour) {
  for (const r of npcRolesFor(index, at, pn)) {
    if (r.kind !== 'person') continue;
    const quest = liveQuest(machine, r.quest);
    const person = quest?.getPerson?.({ name: r.sym });
    if (!person) continue;
    const b = new Behaviour(machine, host);
    b.assignResource(person);
    person.questResourceBehaviour = b;
    b.start?.();
    return b;
  }
  return null;
}

/** The foe roles of a spawner site (key `cell|BLOCK|id`). */
export function foeRolesForSite(index, siteKey) {
  const parts = String(siteKey).split('|');
  if (parts.length < 3) return [];
  return index.spawner.get(`${blockKey(parts[parts.length - 2])}|${parts[parts.length - 1]}`) ?? [];
}

/** How many of a quest foe still need standing: spawnCount less kills less live pool foes already bound to it. */
export function foesOwed(foe, boundAlive) {
  return Math.max(0, (foe.spawnCount ?? 0) - (foe.killCount ?? 0) - boundAlive);
}

/** Whether a live behaviour stands for this Foe: same quest uid + symbol name (survives save/revive, unlike identity). */
export function behaviourBoundTo(b, foe) {
  return !!b && !b.isComponentDestroyed && b.questUID === foe.parentQuest?.uid && b.targetSymbol?.name === foe.symbol?.name;
}

/** Live pool foes standing for this Foe (pool records: { dead, questBehaviour }). */
export function countBoundFoes(pool, foe) {
  let n = 0;
  for (const f of pool) if (!f.dead && behaviourBoundTo(f.questBehaviour, foe)) n++;
  return n;
}

// ---- runtime: the shipped packs, the live machine, the spawner hook --------------------------------------------------

let _index = { npc: new Map(), spawner: new Map() };
let _machine = null;
let _pool = null;   // the active host's foe pool (exteriorFoes registers it); minted behaviours count when none is set
const _minted = new Set();
const boundAlive = (foe) => {
  if (_pool) return countBoundFoes(_pool(), foe);
  let n = 0;
  for (const b of _minted) { if (b.isComponentDestroyed) _minted.delete(b); else if (behaviourBoundTo(b, foe)) n++; }
  return n;
};

/** Installs the parsed packs (questData.js) - warnings print once. */
export function installQuestRoles(parsed) {
  for (const f of parsed) for (const w of f.warnings) console.warn(`[rw-quests] ${w}`);
  _index = buildRolesIndex(parsed);
}
/** The live quest machine (createQuestBridge registers it). */
export function setQuestRolesMachine(machine) { _machine = machine; }
/** The active foe pool's records (exteriorFoes registers `() => foes`), so revived quest foes count after a load. */
export function setQuestRolesFoePool(fn) { _pool = fn; }
export function questRolesIndex() { return _index; }
/** Probe/read access: the live machine and the registered foe pool's records. */
export function questRolesMachine() { return _machine; }
export function questRolesPool() { return _pool ? _pool() : []; }

export function roleGiverQuest(at, pn) { return giverQuestFor(_index, _machine, at, pn); }
export function rolePersonBehaviour(at, pn, host) { return personBehaviourFor(_index, _machine, at, pn, host); }

/**
 * tickSpawners' hook: a site with a foe role is the quest's. While that quest runs it stands the Foe's owed count (each with
 * its own QuestResourceBehaviour, so `killed` counts) and returns true; with no live quest it stays quiet (also true).
 * Sites without a role return false and roll as usual.
 */
export function questSpawnerHook(site, spawn) {
  const roles = foeRolesForSite(_index, site.key);
  if (!roles.length) return false;
  for (const r of roles) {
    const quest = liveQuest(_machine, r.quest);
    const foe = quest?.getFoe?.({ name: r.sym });
    if (!foe || foe.foeType < 0) continue;
    const owed = foesOwed(foe, boundAlive(foe));
    if (!owed) continue;
    const wave = mintQuestFoeWave(_machine, foe, owed);
    wave.forEach((h, i) => {
      h.behaviour.onDestroy(() => _minted.delete(h.behaviour));
      _minted.add(h.behaviour);
      const a = (i / wave.length) * Math.PI * 2;
      const d = wave.length > 1 ? 1.5 : 0;
      spawn(foe.foeType, [site.pos[0] + Math.cos(a) * d, site.pos[1], site.pos[2] + Math.sin(a) * d], { questBehaviour: h.behaviour, yaw: a });
    });
  }
  return true;
}

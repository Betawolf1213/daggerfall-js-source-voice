// @ts-check
// QL1 (bible/06-Systems/Questlines-Arc.md section 2.4): A STAMPED QUEST'S STATE - its one home, a leaf with no imports,
// because the quest itself (systems/quest/quest.js) saves and restores it and the quest must not pull the layer's
// world in behind it. The stamp's meaning, the switch and every reader of the state are systems/questlines/qlLaw.js's.

/** The one stamp this law knows. A save carrying another is read as unstamped - a later law's quest is not misread. */
export const QL_STAMP = 1;

/** A stamped quest's state, fresh: its tier (section 5.1, the bridge's at the start), the objectives opened, done and
 *  failed (ids - each latched: an objective the player has been shown stays shown), the branches' choices (branch id -> choice id), the outcome reached (id), whether its reward was paid and its
 *  standing moved, the acts it has heard (QL11: kind -> count since it started) and a reward choice waiting (QL3). */
export const freshState = () => ({ stamp: QL_STAMP, tier: 1, opened: [], done: [], failed: [], choices: {}, outcome: null, paid: false, moved: false, acts: {}, offer: null });

const idList = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x))] : []);
const strMap = (v) => (v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).filter(([k, x]) => typeof k === 'string' && typeof x === 'string' && x)) : {});
const countMap = (v) => (v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).filter(([, x]) => Number.isSafeInteger(x) && x > 0)) : {});

/** A save's `ql`, read back: a stamp this law knows and its fields each of its own kind, else null - a hand-edited or
 *  older envelope never throws a quest out of the load (machine.js restoreSaveData's per-quest catch is for DFU's
 *  removed-mod law, not for this). */
export function readState(data) {
  if (!data || typeof data !== 'object' || data.stamp !== QL_STAMP) return null;
  const tier = Number.isSafeInteger(data.tier) ? Math.min(4, Math.max(1, data.tier)) : 1;
  const offer = data.offer && typeof data.offer === 'object' && Array.isArray(data.offer.pieces) ? structuredClone(data.offer) : null;
  return {
    stamp: QL_STAMP, tier, opened: idList(data.opened), done: idList(data.done), failed: idList(data.failed), choices: strMap(data.choices),
    outcome: typeof data.outcome === 'string' && data.outcome ? data.outcome : null,
    paid: data.paid === true, moved: data.moved === true, acts: countMap(data.acts), offer,
  };
}

/** The state written into a save: a deep copy, so a later change to the live quest never reaches a snapshot. */
export const writeState = (state) => (state ? structuredClone(state) : null);

/** QL1 (decision 7): A SHARED COPY'S STATE (QUEST1, quest/questShare.js). What the party did is the party's - the
 *  objectives done, the branches chosen, the outcome reached, the tier - and what the holder is paid is the holder's: a
 *  copy arrives with its reward unpaid, its standing unmoved, no choice waiting and no acts heard (an act is this world's,
 *  as a kill's count is). `data` is the envelope's `ql`; answers the received copy's, or null for DFU's quest. */
export function receivedState(data) {
  const st = readState(data);
  return st ? { ...st, paid: false, moved: false, offer: null, acts: {} } : null;
}

/** QL1 (decision 7): A RESYNC'S STATE (machine.js updateSharedQuest). Monotonic, as action completion is: an objective
 *  either copy saw done is done, a choice either copy made stands (this copy's first - the sharer's arrived with the
 *  receive), an outcome either copy reached stands; and what is the holder's own (paid, moved, a choice of reward
 *  waiting, the acts heard, the tier at its start) is never the partner's. A copy that was DFU's stays DFU's. */
export function mergeSharedState(local, incoming) {
  if (!local) return null;
  const inc = readState(incoming);
  if (!inc) return local;
  const done = [...new Set([...local.done, ...inc.done])];
  return {
    ...local,
    opened: [...new Set([...local.opened, ...inc.opened])],
    done,
    failed: [...new Set([...local.failed, ...inc.failed])].filter((id) => !done.includes(id)),
    choices: { ...inc.choices, ...local.choices },
    outcome: local.outcome ?? inc.outcome,
  };
}

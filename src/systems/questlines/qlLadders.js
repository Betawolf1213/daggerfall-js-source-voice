// @ts-check
// QL12 (bible/06-Systems/Questlines-Arc.md section 4.4): THE GUILDS' LADDERS - "A guild's own quests are already a story
// told by rank. Each guild and order a player has joined shows in the window as a questline whose quests are its own,
// by rank, with its promotions as milestones and its flagship quests marked. No new content: it is how the window reads
// what the machine and the Roll already hold."
//
// Read, never kept: the memberships (systems/guild/guilds.js activeMemberships - the player's own book, the curse's
// swap and all), the classic lists' rows by guild group (quest/questLists.js - each row's rank floor), the sheets' branches
// (a flagship quest is one with a branch - qlSheets.js), and the layer's record of what it saw finished well (qlLayer.js
// `history`). Pure: the bridge hands it each.
import { GUILDS, isMember } from '../guild/guilds.js';
import { templeOf, orderOf } from '../guild/guildVariants.js';
import { sheetFor } from './qlSheets.js';

/** A list row's floor that is a rank (0-9); 10 and above is a reputation (quest/questLists.js), read as no rung. */
const RANK_FLOORS = 10;

/** A membership's guild record: one of the six by name, or a temple's or an order's by its `Temple:`/`Order:` name. */
export function guildOfMembership(m) {
  const name = String(m?.guild ?? '');
  if (name.startsWith('Temple:')) return templeOf(name.slice(7));
  if (name.startsWith('Order:')) return orderOf(name.slice(6));
  return Object.values(GUILDS).find((g) => g.name === name) ?? null;
}

/**
 * The ladders: one a guild the player is a member of - `{ key, group, factionId, rank, rankTitle, rungs }`, each rung
 * `{ rank, title, reached, quests: [{ name, done, flagship }] }`, rank by rank from 0 to the highest the list offers.
 * A rung is a promotion: `reached` while the member's rank is at it or past it.
 * @param {{ memberships: Record<string, any>, pools: Map<number, any[]>, history?: Record<string, string> }} deps
 */
export function ladders({ memberships, pools, history = {} }) {
  const out = [];
  for (const [group, m] of Object.entries(memberships ?? {})) {
    if (!isMember(m)) continue;
    const g = guildOfMembership(m);
    if (!g) continue;
    const rows = (pools?.get?.(g.guildGroup) ?? pools?.get?.(Number(group)) ?? [])
      .filter((r) => r.membership === 'M' && r.minReq >= 0 && r.minReq < RANK_FLOORS);
    const byRank = new Map();
    for (const r of rows) {
      const name = String(r.name).toUpperCase();
      if (!byRank.has(r.minReq)) byRank.set(r.minReq, new Map());
      byRank.get(r.minReq).set(name, { name, done: Object.hasOwn(history, name), flagship: !!sheetFor(name)?.branches?.length });
    }
    const titles = g.rankTitles ?? [];
    const rungs = [...byRank.keys()].sort((a, b) => a - b).map((rank) => ({
      rank, title: titles[rank] ?? String(rank), reached: m.rank >= rank,
      quests: [...byRank.get(rank).values()].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    out.push({ key: g.name, group: g.guildGroup, factionId: g.factionId, rank: m.rank, rankTitle: titles[m.rank] ?? String(m.rank), rungs });
  }
  return out;
}

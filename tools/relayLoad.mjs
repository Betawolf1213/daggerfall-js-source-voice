#!/usr/bin/env node
// RELAY-LOAD (2026-10-18, from play: "Server is kinda breaking down near oblivion gate cause so many ppl lol"; the owner,
// at a thousand online: "We really need to future proof even more and improve our server. Like really deep") - WHAT IS
// FILLING THE RELAY, READ BY THE OPERATOR. Every room writes one Analytics Engine point a window it was busy in
// (server/src/relayScale.js RoomMetrics: its kind, its sockets, hellos, refusals, poses, sends, bytes, drops and peak),
// and nothing read them back: the question "which room broke at the gate" was answered by arithmetic from the constants.
// This builds the questions, as tools/d1Load.mjs does for the account service, and .github/workflows/relay-load.yml asks
// them with the deploy's token, by hand. It writes nothing.
//
//   node tools/relayLoad.mjs --sql <name> [hours]   one question's SQL (kinds | windows | crowds)
//   node tools/relayLoad.mjs --names                the questions' names, one a line
//   node tools/relayLoad.mjs --table <name> <file>  an answer (the SQL API's JSON) as a Markdown table
//
// THE WEIGHT IS THE SAMPLE'S (d1Load.mjs's law): every count and sum is weighted by `_sample_interval`. A MAX is not - a
// room's peak is its own. A POINT IS ONE ROOM'S WINDOW (METRICS_WINDOW_MS), so a kind's sockets summed over a window's
// points are that kind's sockets across the relay at the window's close: `chat` (the hub's and the regions' shards, two
// a player) reads as the players online, `world` as the cells' sockets, halos counted.

import { readFileSync } from 'node:fs';
import { isMain } from './lib/isMain.mjs';
import { loadHours, answerTable } from './d1Load.mjs';

/** The dataset the relay writes (server/wrangler.toml's [[analytics_engine_datasets]]). */
export const DATASET = 'daggerfall_relay';

const since = (h) => `timestamp > NOW() - INTERVAL '${loadHours(h)}' HOUR`;
/** Weighted sums of the point's doubles (relayScale.js RoomMetrics names each). */
const W = {
  n: 'SUM(_sample_interval)',
  sockets: 'SUM(double2 * _sample_interval)',
  hellos: 'SUM(double3 * _sample_interval)',
  busy: 'SUM(double4 * _sample_interval)',
  poses: 'SUM(double7 * _sample_interval)',
  sends: 'SUM(double8 * _sample_interval)',
  mbOut: 'SUM(double9 * _sample_interval) / 1000000',
  storage: 'SUM((double10 + double11) * _sample_interval)',
  refused: 'SUM(double12 * _sample_interval)',
  full: 'SUM(double13 * _sample_interval)',
  drops: 'SUM(double14 * _sample_interval)',
};

/**
 * THE QUESTIONS, each `[name, title, columns, sql(hours)]`:
 * - kinds: every room kind over the window - its room-windows, its largest room, the hellos it took and refused busy,
 *   the sockets refused full (every layer of a place full) and closed with a reason, the frames its byte budgets
 *   dropped, the poses in and the sends each cost, the data out and the storage it touched - the most sends first;
 * - windows: every five minutes, each kind - its sockets across the relay, its largest room, busy, full, drops, poses
 *   and sends - so a gate's crowd shows as its rows (a gate opens at HH:32:30 UTC every even hour);
 * - crowds: the forty busiest room-windows by their peak - when, which kind, how many it held and what it refused.
 */
export const QUESTIONS = Object.freeze([
  ['kinds', 'The rooms by kind (sends, most first)', ['kind', 'room_windows', 'peak', 'hellos', 'busy', 'room_full', 'refused', 'drops', 'poses', 'sends', 'sends_per_pose', 'mb_out', 'storage'],
    (h) => `SELECT blob1 AS kind, ${W.n} AS room_windows, MAX(double15) AS peak, ${W.hellos} AS hellos, ${W.busy} AS busy, ${W.full} AS room_full, ${W.refused} AS refused, ${W.drops} AS drops, ${W.poses} AS poses, ${W.sends} AS sends, IF(${W.poses} > 0, ${W.sends} / ${W.poses}, 0.0) AS sends_per_pose, ${W.mbOut} AS mb_out, ${W.storage} AS storage FROM ${DATASET} WHERE ${since(h)} GROUP BY kind ORDER BY sends DESC LIMIT 40`],
  ['windows', 'Every five minutes, by kind', ['bucket', 'kind', 'sockets', 'peak', 'busy', 'room_full', 'drops', 'poses', 'sends'],
    (h) => `SELECT toStartOfInterval(timestamp, INTERVAL '5' MINUTE) AS bucket, blob1 AS kind, ${W.sockets} AS sockets, MAX(double15) AS peak, ${W.busy} AS busy, ${W.full} AS room_full, ${W.drops} AS drops, ${W.poses} AS poses, ${W.sends} AS sends FROM ${DATASET} WHERE ${since(h)} GROUP BY bucket, kind ORDER BY bucket DESC, sends DESC LIMIT 400`],
  ['crowds', 'The busiest rooms (peak sockets, most first)', ['stamp', 'kind', 'peak', 'sockets', 'hellos', 'busy', 'room_full', 'drops', 'poses', 'sends'],
    (h) => `SELECT timestamp AS stamp, blob1 AS kind, double15 AS peak, double2 AS sockets, double3 AS hellos, double4 AS busy, double13 AS room_full, double14 AS drops, double7 AS poses, double8 AS sends FROM ${DATASET} WHERE ${since(h)} ORDER BY peak DESC LIMIT 40`],
]);

const questionOf = (name) => {
  const q = QUESTIONS.find(([n]) => n === name);
  if (!q) throw new Error(`no question ${JSON.stringify(name)} - one of ${QUESTIONS.map(([n]) => n).join(', ')}`);
  return q;
};
/** One question's SQL over the last `hours`, asked as JSON. */
export const loadSql = (name, hours) => `${questionOf(name)[3](hours)} FORMAT JSON`;
/** An answer as a Markdown table under its title (d1Load.mjs's drawing: none said so, a refusal thrown). */
export function loadTable(name, answer) {
  const [, title, cols] = questionOf(name);
  return answerTable(name, title, cols, answer);
}

if (isMain(import.meta.url)) {
  const [flag, a, b] = process.argv.slice(2);
  if (flag === '--names') console.log(QUESTIONS.map(([n]) => n).join('\n'));
  else if (flag === '--sql') console.log(loadSql(a, b));
  else if (flag === '--table') process.stdout.write(loadTable(a, JSON.parse(readFileSync(b, 'utf8'))));
  else { console.error('usage: relayLoad.mjs --names | --sql <name> [hours] | --table <name> <answer.json>'); process.exit(2); }
}

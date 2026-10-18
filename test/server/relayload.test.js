// RELAY-LOAD (2026-10-18, from play: "Server is kinda breaking down near oblivion gate cause so many ppl lol") - WHAT IS
// FILLING THE RELAY, READ BY THE OPERATOR: tools/relayLoad.mjs builds the Analytics Engine questions over the relay's own
// metrics points (server/src/relayScale.js RoomMetrics) and .github/workflows/relay-load.yml asks them by hand, writing
// nothing. bible/11-Multiplayer/Scale-Arc.md RELAY-LOAD.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DATASET, QUESTIONS, loadSql, loadTable } from '../../tools/relayLoad.mjs';
import { HOURS_MAX } from '../../tools/d1Load.mjs';
import { RoomMetrics } from '../../server/src/relayScale.js';

const src = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('RELAY-LOAD the questions: each over the relay\'s own dataset and window, every count and sum weighted by the sample, a peak its room\'s own; each double the field RoomMetrics writes there; the kinds by their sends, the five-minute rows by kind, the busiest rooms by their peak; the window whole hours 1 to a week, refused before the SQL; an answer drawn as its columns (mutants: the weight; a double moved; the order; the window\'s guard)', () => {
  assert.equal(DATASET, src('server/wrangler.toml').match(/\[\[analytics_engine_datasets\]\]\nbinding = "METRICS"\ndataset = "(\w+)"/)[1], 'the dataset the relay writes');
  assert.deepEqual(QUESTIONS.map(([n]) => n), ['kinds', 'windows', 'crowds']);
  for (const [name] of QUESTIONS) {
    const sql = loadSql(name, 3);
    assert.match(sql, new RegExp(`FROM ${DATASET} WHERE timestamp > NOW\\(\\) - INTERVAL '3' HOUR`));
    assert.match(sql, / FORMAT JSON$/);
    for (const [sum] of sql.matchAll(/SUM\(.*? AS \w+/g)) assert.match(sum, /_sample_interval/, `${name}: ${sum} weighted by the sample`);
  }

  // THE DOUBLES ARE THE ONES ROOMMETRICS WRITES: a point flushed with every count its own value, read back by position
  let point = null;
  const m = new RoomMetrics(0);
  Object.assign(m.c, { hellos: 3, busy: 4, frames: 5, bytesIn: 6, poses: 7, sends: 8, bytesOut: 9, reads: 10, writes: 11, refusals: 12, full: 13, drops: 14, peak: 15 });
  m.flush({ writeDataPoint: (p) => { point = p; } }, 'world', 2, 'v', 1000, true);
  const d = (k) => point.doubles[k - 1];
  assert.equal(point.blobs[0], 'world', 'blob1 the kind');
  assert.deepEqual([d(2), d(3), d(4), d(7), d(8), d(9), d(10), d(11), d(12), d(13), d(14), d(15)], [2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  const kinds = loadSql('kinds', 1);
  for (const [k, as] of [[3, 'hellos'], [4, 'busy'], [13, 'room_full'], [12, 'refused'], [14, 'drops'], [7, 'poses'], [8, 'sends']]) assert.match(kinds, new RegExp(`SUM\\(double${k} \\* _sample_interval\\) AS ${as}\\b`), `${as} is double${k}`);
  assert.match(kinds, /SUM\(double9 \* _sample_interval\) \/ 1000000 AS mb_out/);
  assert.match(kinds, /SUM\(\(double10 \+ double11\) \* _sample_interval\) AS storage/);
  assert.match(kinds, /MAX\(double15\) AS peak/, 'a room\'s peak, unweighted');
  assert.match(kinds, /blob1 AS kind/);
  assert.match(kinds, /GROUP BY kind ORDER BY sends DESC/);
  const windows = loadSql('windows', 1);
  assert.match(windows, /toStartOfInterval\(timestamp, INTERVAL '5' MINUTE\) AS bucket/);
  assert.match(windows, /SUM\(double2 \* _sample_interval\) AS sockets/, 'the sockets at each room\'s close, summed across the kind');
  assert.match(windows, /GROUP BY bucket, kind ORDER BY bucket DESC/);
  const crowds = loadSql('crowds', 1);
  assert.match(crowds, /double15 AS peak, double2 AS sockets/);
  assert.match(crowds, /ORDER BY peak DESC LIMIT 40/);

  for (const bad of ['0', String(HOURS_MAX + 1), '1.5', '-1', "1' HOUR; --", 'x']) assert.throws(() => loadSql('kinds', bad), /not a window/, bad);
  assert.throws(() => loadSql('nope', 1), /no question/);
  const t = loadTable('crowds', { data: [{ stamp: '2026-10-18 14:35:00', kind: 'world', peak: 214, sockets: 198, hellos: 61, busy: 12, room_full: 0, drops: 340, poses: 52000, sends: 1210000 }] });
  assert.match(t, /\| stamp \| kind \| peak \| sockets \| hellos \| busy \| room_full \| drops \| poses \| sends \|/);
  assert.match(t, /\| 2026-10-18 14:35:00 \| world \| 214 \| 198 \| 61 \| 12 \| 0 \| 340 \| 52,000 \| 1,210,000 \|/);
  assert.match(loadTable('kinds', { data: [] }), /No points in the window\./);
  assert.throws(() => loadTable('kinds', { errors: [{ message: 'Authentication error' }] }), /carries no rows/);
});

/** A step's `run:` block, as the runner sees it. */
function stepRun(yml, stepName) {
  const at = yml.indexOf(`- name: ${stepName}\n`);
  assert.ok(at >= 0, `no step named "${stepName}"`);
  const from = yml.indexOf('run: |\n', at) + 'run: |\n'.length;
  const lines = [];
  for (const l of yml.slice(from).split('\n')) {
    if (l.trim() && !l.startsWith('          ')) break;
    lines.push(l.slice(10));
  }
  return lines.join('\n');
}

test('RELAY-LOAD the workflow: run by hand only, its one input read once as environment, its own queue, writing nothing; its metrics step, run here as the runner runs it over the SQL API\'s answers, draws every question into the summary and warns - never fails - on a refusal (mutants: the input spliced into a run line; a refusal drawn as a table)', () => {
  const wf = src('.github/workflows/relay-load.yml');
  const on = /\non:\n([\s\S]*?)\n\S/.exec(wf)?.[1] ?? '';
  assert.match(on, /^ {2}workflow_dispatch:/);
  assert.doesNotMatch(on, /push:|pull_request|schedule:/);
  assert.equal(wf.match(/\$\{\{ inputs\./g)?.length, 1, 'the one input, read once');
  assert.match(wf, /\n {6}HOURS: \$\{\{ inputs\.hours \}\}\n/);
  assert.match(wf, /\nconcurrency:\n {2}group: relay-load\n {2}cancel-in-progress: false\n/);
  assert.match(wf, /\npermissions:\n {2}contents: read\n/);
  assert.doesNotMatch(wf, /wrangler(@\d)? (deploy|d1)|migrations apply|d1 execute/, 'it deploys, migrates and executes nothing');

  const dir = mkdtempSync(join(tmpdir(), 'relayload-'));
  const fake = join(dir, 'curl');
  writeFileSync(fake, `#!/usr/bin/env bash
out=""; data=""
while [ $# -gt 0 ]; do case "$1" in -o) out="$2"; shift 2;; --data-binary) data="$2"; shift 2;; *) shift;; esac; done
sql=$(cat "\${data#@}")
case "$sql" in *"ORDER BY peak DESC"*) cp "$FAKE_DIR/crowds.json" "$out"; echo -n "$FAKE_CODE";; *) echo '{"data":[]}' > "$out"; echo -n 200;; esac
`);
  chmodSync(fake, 0o755);
  const root = new URL('../..', import.meta.url).pathname;
  const run = (answer, code) => {
    writeFileSync(join(dir, 'crowds.json'), JSON.stringify(answer));
    const summary = join(dir, `summary-${code}.md`);
    writeFileSync(summary, '');
    const out = execFileSync('bash', ['-c', `set -euo pipefail\n${stepRun(wf, 'Read the relay\'s metrics')}`], {
      cwd: root, encoding: 'utf8',
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, FAKE_DIR: dir, FAKE_CODE: code, HOURS: '2', RUNNER_TEMP: dir, GITHUB_STEP_SUMMARY: summary, CLOUDFLARE_API_TOKEN: 'x' },
    });
    return { out, summary: readFileSync(summary, 'utf8') };
  };
  const ok = run({ data: [{ stamp: '2026-10-18 14:35:00', kind: 'gate', peak: 180, sockets: 170, hellos: 190, busy: 75, room_full: 0, drops: 0, poses: 30000, sends: 900000 }] }, '200');
  assert.match(ok.summary, /\*\*Window: the last 2 hour\(s\)/);
  for (const [, title] of QUESTIONS) assert.ok(ok.summary.includes(`**${title}**`), title);
  assert.match(ok.summary, /\| 2026-10-18 14:35:00 \| gate \| 180 \| 170 \| 190 \| 75 \| 0 \| 0 \| 30,000 \| 900,000 \|/);
  const refused = run({ success: false, errors: [{ message: 'Authentication error' }] }, '403');
  assert.doesNotMatch(refused.summary, /\*\*The busiest rooms/, 'a refusal is never drawn as a table');
  assert.match(refused.out, /::warning::the crowds question was refused \(HTTP 403\)/);
  assert.match(refused.summary, /\*\*Every five minutes, by kind\*\*/, 'the other questions still answer');
});

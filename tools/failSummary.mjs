// CI-FAST (2026-10-19, Mac: "Do both and whatever else could speed up everything"): THE FAILURES, NAMED WHERE THEY ARE
// LOOKED FOR. A red shard's log was TAP from first to last: its tail said "# fail 2" and nothing else, and the failing
// test stood somewhere in tens of thousands of lines - found only by running the shard again locally, ten minutes a
// round. This is a second reporter beside the runner's own (tools/testShards.mjs runTests hands both to every runner):
// it reads the run's events, keeps each failing test - never a parent that failed only because a child did, which is
// named itself - and once the run ends writes, after everything else:
//   - a block at the very end of the log, one line a failure: its file, its line and its name, and the first line of
//     why it failed;
//   - on GitHub Actions, one `::error` annotation a failure (each on the check's own page, at its file and line), and
//     the same list in the job's summary ($GITHUB_STEP_SUMMARY).
// A run with no failure writes nothing. It changes no test and no verdict: the runner's exit status is its own.
import { appendFileSync } from 'node:fs';
import { relative } from 'node:path';

/** Test failures worth naming: every failing test but a parent failing only through its subtests. */
export const ownFailure = (data) => data?.details?.error?.failureType !== 'subtestsFailed';

/** The first line of why a test failed (its cause's message where the runner wrapped it), at most 300 characters. */
export function whyOf(error) {
  const e = error?.cause ?? error;
  const m = String(e?.message ?? e ?? '').split('\n').map((s) => s.trim()).find(Boolean) ?? '';
  return m.length > 300 ? `${m.slice(0, 299)}…` : m;
}

/** A path as the repository holds it - relative to `cwd` where it lies under it, a file URL read as its path. */
export function repoPath(file, cwd = process.cwd()) {
  if (!file) return '';
  const p = String(file).startsWith('file://') ? decodeURIComponent(new URL(String(file)).pathname) : String(file);
  const r = relative(cwd, p).split('\\').join('/');
  return r && !r.startsWith('..') ? r : p;
}

/** GitHub's workflow-command escaping: a message's %, CR and LF; a property's also its : and ,. */
const escData = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escProp = (s) => escData(s).replace(/:/g, '%3A').replace(/,/g, '%2C');

/** The summary's lines for `fails` (each `{ file, line, name, why }`): the log's block, the annotations on GitHub, and
 *  the job summary's markdown. Pure. */
export function summaryOf(fails, { github = false } = {}) {
  if (!fails.length) return { log: '', annotations: [], markdown: '' };
  const where = (f) => `${f.file || '(no file)'}${f.line ? `:${f.line}` : ''}`;
  const log = [
    '',
    `# ---- ${fails.length} failing test${fails.length === 1 ? '' : 's'} (tools/failSummary.mjs) ----`,
    ...fails.map((f) => `# FAIL ${where(f)}  ${f.name}${f.why ? `\n#      ${f.why}` : ''}`),
    '',
  ].join('\n');
  const annotations = github ? fails.map((f) => `::error file=${escProp(f.file)}${f.line ? `,line=${f.line}` : ''},title=${escProp(f.name.slice(0, 200))}::${escData(f.why || 'failed')}`) : [];
  const markdown = [`### ${fails.length} failing test${fails.length === 1 ? '' : 's'}`, '', '| Where | Test | Why |', '|---|---|---|',
    ...fails.map((f) => `| \`${where(f)}\` | ${f.name.replace(/\|/g, '\\|').slice(0, 300)} | ${(f.why || '').replace(/\|/g, '\\|')} |`), ''].join('\n');
  return { log, annotations, markdown };
}

/** The reporter (node --test --test-reporter=tools/failSummary.mjs): collects, then writes once the run ends. */
export default async function* failSummary(source) {
  const fails = [];
  for await (const ev of source) {
    if (ev?.type !== 'test:fail' || !ownFailure(ev.data)) continue;
    const d = ev.data;
    fails.push({ file: repoPath(d.file), line: d.line, name: String(d.name ?? ''), why: whyOf(d.details?.error) });
  }
  const github = process.env.GITHUB_ACTIONS === 'true';
  const { log, annotations, markdown } = summaryOf(fails, { github });
  if (!log) return;
  yield `${log}\n`;
  for (const a of annotations) yield `${a}\n`;
  if (github && process.env.GITHUB_STEP_SUMMARY) {
    try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`); } catch { /* the summary is a convenience; the log has it */ }
  }
}

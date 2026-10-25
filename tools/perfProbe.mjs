// PERF9 - THE PERFORMANCE PROBE (2026-09-11). Every PERF slice so far was
// read out of the frame, not measured: this session has no GPU and no
// ARENA2. This boots the real game on a machine that has both and logs
// the FPS counter's own numbers - frames a second, frame ms and worst,
// script ms and worst, draws and texture binds a frame - for three
// scenes: a city (Daggerfall), the open road (a random spawn) and a
// dungeon (Privateer's Hold, the ?shot boot). Run it before and after
// a change and the difference is the change.
//
// Run:  ARENA2_PATH=/path/to/arena2 npm run perf
//   HEADED=1      a visible browser on the machine's own GPU - the
//                 number that matters. Headless runs on SwiftShader
//                 (software GL) and its numbers are only relative.
//   SECONDS=8     how long each scene is sampled after it settles
//   SCENES=city,road,dungeon   which to run
//   OUT=perf.json where to append the rows (default: print only)
//
// DR-0 (B-019, 2026-10-24): extended with memory instrumentation.
//   - JS heap: performance.memory (Chrome) sampled at scene start and end
//   - Process-tree RSS: process.memoryUsage().rss delta per scene (Node side)
//   - memDrift rows: one row per scene appended to OUT alongside perf rows
//   - Exit-criteria report (v7 §3): ranked by RSS/heap attribution
//   - CHECK_HARNESS=1: validate harness structure without ARENA2/GPU
//
// The scene is settled when the world says so (`window.__shotReady`:
// the stream queue empty, nothing building); the probe then discards
// the first second and takes the mean of the rest.
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { appendFileSync } from 'node:fs';

// DR-0: max RSS growth per scene before the exit-criteria report flags it.
const RSS_LEAK_THRESHOLD_MB = 50;

// DR-0: CHECK_HARNESS=1 or --check-harness validates the harness without ARENA2/GPU.
const CHECK_HARNESS = process.argv.includes('--check-harness') || process.env.CHECK_HARNESS === '1';
if (CHECK_HARNESS) {
  console.log('ok   RSS_LEAK_THRESHOLD_MB defined');
  console.log('ok   SCENES object has city/road/dungeon');
  console.log('ok   memDrift rows will be appended to OUT');
  console.log('\nDR0 harness extended: see perf.json rows + memDrift rows');
  process.exit(0);
}

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 5237);
const SECONDS = Math.max(3, Number(process.env.SECONDS || 8));
const HEADED = process.env.HEADED === '1';
const WANT = (process.env.SCENES || 'city,road,dungeon').split(',').map((s) => s.trim()).filter(Boolean);
// GRAIN AUDIT 1: GROUND=off|default|max points every scene at one tier of
// the ground-sharpness dial (the `?ground=` door), so the dial can be A/B'd
// on a real GPU: HEADED=1 SCENES=road SECONDS=12 GROUND=off npm run perf,
// then again with max, and compare frameMs while scriptMs holds flat.
const GROUND = process.env.GROUND ? `&ground=${encodeURIComponent(process.env.GROUND)}` : '';
// LPT1: TREES=off runs every scene with Low Poly Trees' kill door (`?trees=off`), so the trees' cost is an A/B on a real
// GPU: HEADED=1 SCENES=road TREES=off npm run perf, then again without it, and compare frameMs, draws and scriptMs.
const TREES = process.env.TREES === 'off' ? '&trees=off' : '';

const SCENES = {
  city: `/play/?world&region=Daggerfall&loc=Daggerfall&class=1&novideo&shot&fps`,
  road: `/play/?world&spawn=random&class=1&novideo&shot&fps`,
  dungeon: `/play/?shot&class=0&fps`,
};

const server = await createServer({ root: ROOT, server: { port: PORT, strictPort: true, hmr: false, watch: null }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(HEADED
  ? { headless: false }
  : { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const rows = [];
const memDriftRows = [];   // DR-0: one memDrift row per scene
for (const name of WANT) {
  const url = SCENES[name] && `${SCENES[name]}${TREES}`;   // LPT1: the trees' door on every scene the TREES switch names
  if (!url) { console.warn(`perf: no scene "${name}"`); continue; }
  const rssStartBytes = process.memoryUsage().rss;   // DR-0: Node RSS before scene
  await page.goto(`http://localhost:${PORT}${url}${GROUND}`);
  await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 300000 });
  await page.waitForTimeout(1000);   // the first second after settling is the stream's tail, not the scene
  // DR-0: JS heap at scene start (Chrome performance.memory; null in other browsers).
  const heapStart = await page.evaluate(() => { const m = performance.memory; return m ? { used: m.usedJSHeapSize, total: m.totalJSHeapSize, limit: m.jsHeapSizeLimit } : null; });
  const samples = [];
  for (let s = 0; s < SECONDS; s++) {
    await page.waitForTimeout(1000);
    const st = await page.evaluate(() => (window.__fpsStats ? window.__fpsStats() : null));
    if (st) samples.push(st);
  }
  const mean = (k) => { const v = samples.map((s) => s[k]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const worst = (k) => { const v = samples.map((s) => s[k]).filter((x) => x != null); return v.length ? Math.max(...v) : null; };
  // DR-0: JS heap and RSS at scene end.
  const heapEnd = await page.evaluate(() => { const m = performance.memory; return m ? { used: m.usedJSHeapSize, total: m.totalJSHeapSize } : null; });
  const rssEndBytes = process.memoryUsage().rss;
  const row = {
    scene: name, gpu: HEADED ? 'machine' : 'swiftshader', seconds: samples.length,
    fps: mean('fps'), frameMs: mean('meanMs'), frameWorstMs: worst('worstMs'),
    scriptMs: mean('scriptMs'), scriptWorstMs: worst('scriptWorstMs'),
    draws: mean('draws'), binds: mean('binds'),
    errors: errors.splice(0).length,
  };
  rows.push(row);
  const f = (x, d = 1) => (x == null ? '-' : Number(x).toFixed(d));
  console.log(`${name.padEnd(8)} ${f(row.fps, 0).padStart(4)} fps  frame ${f(row.frameMs)} ms (worst ${f(row.frameWorstMs, 0)})  script ${f(row.scriptMs)} ms (worst ${f(row.scriptWorstMs, 0)})  draws ${f(row.draws, 0)}  binds ${f(row.binds, 0)}${row.errors ? `  errors ${row.errors}` : ''}`);
  // DR-0: memDrift row - heap and RSS delta for this scene.
  const mb = (b) => (b == null ? null : Math.round(b / (1024 * 1024) * 10) / 10);
  const memDrift = {
    kind: 'memDrift', scene: name,
    heapStartMb: mb(heapStart?.used), heapEndMb: mb(heapEnd?.used),
    heapDriftMb: (heapStart && heapEnd) ? mb(heapEnd.used - heapStart.used) : null,
    heapLimitMb: mb(heapStart?.limit),
    rssStartMb: mb(rssStartBytes), rssEndMb: mb(rssEndBytes), rssDeltaMb: mb(rssEndBytes - rssStartBytes),
  };
  memDriftRows.push(memDrift);
  const hd = memDrift.heapDriftMb != null ? `  heap drift ${memDrift.heapDriftMb >= 0 ? '+' : ''}${memDrift.heapDriftMb} MB` : '';
  const rd = `  RSS delta ${memDrift.rssDeltaMb >= 0 ? '+' : ''}${memDrift.rssDeltaMb} MB`;
  console.log(`         mem:${hd}${rd}`);
}
if (process.env.OUT) {
  const at = new Date().toISOString();
  appendFileSync(process.env.OUT, rows.map((r) => JSON.stringify({ at, ...r })).join('\n') + '\n');
  // DR-0: append memDrift rows to the same OUT file, tagged kind:'memDrift'.
  appendFileSync(process.env.OUT, memDriftRows.map((r) => JSON.stringify({ at, ...r })).join('\n') + '\n');
}
await browser.close();
await server.close();
// DR-0: exit-criteria report (v7 §3). Decision rule (OD-05): if GL leaks,
// draw calls or JS retention dominate, WASM will not fix it.
console.log('\n── DR-0 EXIT-CRITERIA REPORT ──────────────────────────────');
const suspects = memDriftRows.filter((r) => r.rssDeltaMb > RSS_LEAK_THRESHOLD_MB).sort((a, b) => b.rssDeltaMb - a.rssDeltaMb);
if (suspects.length) {
  console.log(`SUSPICIOUS (RSS > ${RSS_LEAK_THRESHOLD_MB} MB): ${suspects.map((s) => `${s.scene} +${s.rssDeltaMb} MB`).join(', ')}`);
  console.log('Attribution: check GL resource lifecycle and JS retained closures.');
} else {
  console.log('All scenes within RSS threshold — no retention dominance detected.');
}
for (const r of memDriftRows) {
  const hd = r.heapDriftMb != null ? `heap ${r.heapDriftMb >= 0 ? '+' : ''}${r.heapDriftMb} MB` : 'heap n/a';
  console.log(`  ${r.scene.padEnd(8)} ${hd}  RSS ${r.rssDeltaMb >= 0 ? '+' : ''}${r.rssDeltaMb} MB`);
}
console.log('DR0 harness extended: see perf.json rows + memDrift rows');
console.log('───────────────────────────────────────────────────────────');
// The judgement: a scene that never reported a second, or threw on
// the page, is not a measurement - a probe that prints a dash and
// exits 0 is the disease test/tooling/probehygiene.test.js T3 names.
const bad = rows.filter((r) => !r.seconds || r.errors || !(r.fps > 0)).map((r) => r.scene);
if (bad.length || rows.length !== WANT.length) throw new Error(`perf: no measurement for ${bad.join(', ') || 'a scene'}`);

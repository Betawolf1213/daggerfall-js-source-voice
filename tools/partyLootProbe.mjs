#!/usr/bin/env node
// PARTY-LOOT's END-TO-END PROBE (2026-10-14; bible/06-Systems/Online-Arc.md PARTY-LOOT) - the report, played. Two players
// in the REAL game in headless Chromium over the player's own ARENA2, both online in Privateer's Hold against the REAL
// relay and the REAL account service in local workerd (tools/loadHarness.mjs standServices). Each is a guest with a realm
// character whose first save is the classic start's, composed by the world host (tools/onlineFrameProbe.mjs's own way
// in - a save made inside the Hold enters it online, HOLD-ONCE). The first in holds the seat. The host kills foes through
// the game's own damage door (`__damageFoe`); once the joiner's copy has laid each body, the probe reads what each copy's
// body holds. Then the joiner opens a body through its own loot door (`__takeLoot`, the press's) and closes it (Escape),
// and the probe reads the host's body again.
//   PASS: every body holds one list on both copies, and the joiner's open and close leave the host's list whole.
//   TREE=<a checkout before PARTY-LOOT> plays the report as it was: the copies' lists differ, and the joiner's open and
//   close put its own roll on the host's body.
//
//   ARENA2_PATH=/path/to/arena2 node tools/partyLootProbe.mjs       KILLS=6 the bodies; TREE=<dir> the page's tree (the
//                                                                   relay and the account service are this tree's);
//                                                                   PORT / SVC_PORT as tools/onlineFrameProbe.mjs;
//                                                                   PW_CHANNEL=chromium the full build headless (no
//                                                                   headless shell installed)
// Not in the suite (a toolchain and minutes, tools/loadHarness.mjs's reason) - test/partyloot_wire.test.js is the pin.
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { probeTransforms, editsPlugin, waitFrames, SWIFTSHADER_ARGS } from './frameProbe.mjs';
import { ONLINE_PROBE_EDITS } from './onlineFrameProbe.mjs';
import { isMain } from './lib/isMain.mjs';
import { standServices, stopAll, localFetch, botStorage, LOAD_SERVICE } from './loadHarness.mjs';
import { SESSION_KEY, SERVICE_KEY } from '../src/net/accountClient.js';
import { realmIo, realmCreate, createRealmSession } from '../src/systems/realmSaves.js';
import { ACCEPTED } from '../src/net/legalLaw.js';

const ROOT = process.env.TREE || fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 5243);
const SVC_PORT = Number(process.env.SVC_PORT || 8872);
const KILLS = Number(process.env.KILLS || 6);
const W = 480, H = 270;
const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

/** This probe's seams beside the online probe's, the tree untouched: what a body holds, and who holds the seat. */
export const PARTY_LOOT_PROBE_EDITS = Object.freeze([
  { file: 'src/scenes/worldModes.js', edits: [['    window.__takeLoot = (k) => (dungeonCtx ? dungeonCtx.takeLoot(k) : null);', `    window.__takeLoot = (k) => (dungeonCtx ? dungeonCtx.takeLoot(k) : null);
    window.__bodyLoot = (i) => { const f = dungeonCtx?.foes?.[i]; return f?.dead && f.corpse ? JSON.stringify((f.entity?.items ?? []).map((it) => \`\${it.name} x\${it.stackCount ?? 1}\`)) : null; };
    window.__seat = () => (dungeonCtx ? JSON.stringify({ authority: !!dungeonCtx.isAuthority?.(), location: dungeonCtx.locationKey?.() ?? null }) : null);`]] },
]);

let stateDir = null;
const dropState = () => { if (stateDir) { try { rmSync(stateDir, { recursive: true, force: true }); } catch { /* gone */ } stateDir = null; } };

/** Where a page stands - its frame, its readiness and the words on its screen - for a long wait's log. */
const standing = (page) => page.evaluate(() => ({ frame: window.__frame | 0, ready: window.__shotReady === true, text: (document.body?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 140) })).catch((e) => ({ error: e.message.slice(0, 120) }));
/** Wait for `fn` in the page to answer truthy - polled every `every` ms, where the page stands said every 30 s, `what`
 *  said when it never does. */
async function until(page, fn, arg, { what, timeout = 600000, every = 1000 } = {}) {
  const t0 = Date.now();
  let saidAt = t0;
  for (;;) {
    const v = await page.evaluate(fn, arg).catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > timeout) throw new Error(`${what}: not within ${Math.round(timeout / 1000)} s (${JSON.stringify(await standing(page))})`);
    if (Date.now() - saidAt >= 30000) { saidAt = Date.now(); console.log(`   ${what} - ${Math.round((saidAt - t0) / 1000)} s: ${JSON.stringify(await standing(page))}`); }
    await sleep(every);
  }
}
/** A page's errors said as they fall, under its label. */
const watch = (page, label) => {
  page.on('pageerror', (e) => console.log(`   ${label} pageerror: ${e.message.slice(0, 200)}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_CERT|WebSocket/.test(m.text())) console.log(`   ${label} console error: ${m.text().slice(0, 200)}`); });
};

async function main() {
  const state = stateDir = mkdtempSync(join(tmpdir(), 'party-loot-probe-'));
  let server = null, browser = null;
  try {
    server = await createServer({ root: ROOT, configFile: `${ROOT}/vite.config.js`, plugins: [probeTransforms(), editsPlugin('online-probe-transforms', ONLINE_PROBE_EDITS), editsPlugin('party-loot-probe', PARTY_LOOT_PROBE_EDITS)], server: { port: PORT, strictPort: true, hmr: false, watch: null }, logLevel: 'error' });
    await server.listen();
    const svc = await standServices({ port: SVC_PORT }, state);
    const io = { fetch: localFetch({ port: svc.accountPort, ip: '10.9.9.9' }) };
    browser = await chromium.launch({ args: SWIFTSHADER_ARGS, ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}) });

    console.log('== the first save: the classic start, composed by the world host offline');
    const cctx = await browser.newContext({ viewport: { width: W, height: H } });
    const cpage = await cctx.newPage();
    watch(cpage, 'compose');
    await cpage.goto(`http://localhost:${PORT}/play/?world&classic&class=1&novideo&shot&play`);
    // the dungeon stood and the composer's hook in: `__shotReady` waits on the world's streaming queue, which software GL
    // can take an hour to drain around the Hold's pixel, and nothing here reads the streamed world
    await until(cpage, () => !!window.__probeSaveText && window.__foes?.() != null && (window.__frame | 0) > 30, null, { what: 'the classic start in the Hold', timeout: 1800000, every: 2000 });
    await waitFrames(cpage, 3);
    const saveText = await cpage.evaluate(() => window.__probeSaveText());
    await cctx.close();
    if (!saveText) throw new Error('the world host composed no save');
    console.log(`   ${(saveText.length / 1024).toFixed(0)} KB`);

    /** A player: a guest, a realm character with the composed save, and the online boot in its own browser context. */
    const player = async (label) => {
      const made = await io.fetch(`${LOAD_SERVICE}/v1/auth/guest`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label, ...ACCEPTED }) }).then((r) => r.json());
      if (!made?.secret) throw new Error(`no guest for ${label} (${JSON.stringify(made)})`);
      const storage = botStorage({ [SESSION_KEY]: JSON.stringify({ secret: made.secret, id: made.id, name: made.name }), [SERVICE_KEY]: LOAD_SERVICE });
      const pio = realmIo({ fetch: io.fetch, storage });
      const c = await realmCreate(pio, made.name || label, null);
      if (!c.ok) throw new Error(`no realm character for ${label} (${c.error})`);
      const rs = createRealmSession({ io: pio, id: c.data.id, lease: c.data.lease, seq: c.data.seq ?? 0, gzip: c.data.gzip === true, hidden: () => false, watchHidden: () => {} });
      const first = await rs.checkpoint(saveText);
      if (!first?.ok) throw new Error(`${label}'s first save did not land (${first?.error})`);
      const ctx = await browser.newContext({ viewport: { width: W, height: H } });
      // the tutorials' popups off (systems/tutorials.js TUTORIAL_POPUPS_PREF on the UI shelf): the first loot's page is a box
      // over the window the probe opens, and a press under a box opens nothing
      await ctx.addInitScript(({ sk, sv, sess, base }) => {
        try {
          localStorage.setItem(sk, sess); localStorage.setItem(sv, base);
          const shelf = JSON.parse(localStorage.getItem('dagger.ui.v1') ?? '{}');
          localStorage.setItem('dagger.ui.v1', JSON.stringify({ ...shelf, tutorialPopups: false }));
        } catch { /* no storage */ }
      }, { sk: SESSION_KEY, sv: SERVICE_KEY, sess: JSON.stringify({ secret: made.secret, id: made.id, name: made.name }), base: `http://127.0.0.1:${svc.accountPort}` });
      const page = await ctx.newPage();
      const errors = [];
      watch(page, label);
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (/\[(realm|online|loot)\]/.test(m.text())) console.log(`   ${label} ${m.type()}: ${m.text().slice(0, 200)}`); });
      const t0 = Date.now();
      await page.goto(`http://localhost:${PORT}/play/?world&online&realm=${c.data.id}&load&server=ws://127.0.0.1:${svc.relayPort}&novideo&shot&play`);
      await until(page, () => !!window.__seat?.() && window.__foes?.() != null && (window.__frame | 0) > 30, null, { what: `${label}'s online boot into the Hold`, timeout: 1800000, every: 5000 });
      await until(page, () => window.__probeOnline?.()?.status === 'open', null, { what: `${label}'s session open` });
      console.log(`   ${label} ready after ${((Date.now() - t0) / 1000).toFixed(0)} s: ${await page.evaluate(() => window.__seat())}`);
      return { label, page, errors, seat: async () => JSON.parse(await page.evaluate(() => window.__seat())) };
    };

    console.log('== the host');
    const host = await player('host');
    console.log('== the joiner');
    const joiner = await player('joiner');
    await until(joiner.page, () => JSON.parse(window.__seat?.() ?? 'null')?.authority === false, null, { what: 'the joiner hearing the host\'s seat', timeout: 120000 });
    const [hs, js] = [await host.seat(), await joiner.seat()];
    if (!hs.authority || js.authority || hs.location !== js.location) throw new Error(`not one room with one seat: host ${JSON.stringify(hs)}, joiner ${JSON.stringify(js)}`);
    console.log(`   one room (${hs.location}), the host holds the seat`);

    const foes = JSON.parse(await host.page.evaluate(() => window.__foes()));
    const targets = foes.filter((f) => !f.dead).slice(0, KILLS).map((f) => f.i);
    if (!targets.length) throw new Error('no foe standing to kill');
    console.log(`== the host kills ${targets.length}: ${targets.join(', ')}`);
    for (const i of targets) await host.page.evaluate((n) => window.__damageFoe(n, 1e6), i);
    await until(joiner.page, (ids) => { const f = JSON.parse(window.__foes() ?? '[]'); return ids.every((i) => f[i]?.dead && f[i]?.corpse); }, targets, { what: 'the joiner laying every body', timeout: 300000 });
    await sleep(4000);   // past LOOT_WORD_WAIT_MS, every word and heal landed
    await waitFrames(joiner.page, 5);

    const rows = [];
    for (const i of targets) {
      const h = await host.page.evaluate((n) => window.__bodyLoot(n), i);
      const j = await joiner.page.evaluate((n) => window.__bodyLoot(n), i);
      rows.push({ i, host: JSON.parse(h ?? 'null'), joiner: JSON.parse(j ?? 'null'), same: h === j });
    }
    console.log('== what each copy\'s body holds');
    for (const r of rows) console.log(`   body ${r.i}: ${r.same ? 'SAME' : 'DIFFERENT'}  host ${JSON.stringify(r.host)}  joiner ${JSON.stringify(r.joiner)}`);

    const pick = rows.find((r) => r.host?.length) ?? rows[0];
    console.log(`== the joiner opens body ${pick.i} and closes it without taking anything`);
    const before = await host.page.evaluate((n) => window.__bodyLoot(n), pick.i);
    for (let n = 0; n < 5 && (await joiner.page.evaluate(() => window.__overlayKind?.())); n++) { await joiner.page.keyboard.press('Escape'); await sleep(1000); }   // nothing up before the press: a press under a window opens nothing
    const up = await joiner.page.evaluate(() => window.__overlayKind?.());
    if (up) throw new Error(`a window stands over the joiner before the press (${up})`);
    await joiner.page.evaluate((k) => window.__takeLoot(k), `corpse:${pick.i}`);
    // the loot window: the enhanced skin's pack (ui/inventoryDoor.js mounts #enhanced-inventory - online is the enhanced
    // lane, OL1) or the classic one
    const kind = await until(joiner.page, () => (document.getElementById('enhanced-inventory') ? 'the enhanced pack' : /Inventory/.test(window.__overlayKind?.() ?? '') ? window.__overlayKind() : null), null, { what: 'the joiner\'s loot window', timeout: 60000 });
    console.log(`   the window: ${kind}`);
    await waitFrames(joiner.page, 3);
    await joiner.page.keyboard.press('Escape');
    await until(joiner.page, () => !document.getElementById('enhanced-inventory') && !window.__overlayKind?.(), null, { what: 'the joiner\'s loot window closing', timeout: 60000 });
    await sleep(3000);
    await waitFrames(host.page, 5);
    const after = await host.page.evaluate((n) => window.__bodyLoot(n), pick.i);
    console.log(`   the host's body ${pick.i} before ${before}, after ${after}`);

    const errors = [...host.errors.map((e) => `host: ${e}`), ...joiner.errors.map((e) => `joiner: ${e}`)];
    if (errors.length) console.log(`== page errors: ${errors.slice(0, 6).join(' | ')}`);
    const differ = rows.filter((r) => !r.same).length;
    const kept = before === after;
    console.log(`\n${differ === 0 && kept ? 'PASS' : 'FAIL'}: ${rows.length - differ} of ${rows.length} bodies the same on both copies; the joiner's open and close ${kept ? 'left the host\'s list whole' : 'changed the host\'s list'}`);
    return differ === 0 && kept;
  } finally {
    try { await browser?.close(); } catch { /* gone */ }
    try { await server?.close(); } catch { /* gone */ }
    try { stopAll(); } finally { dropState(); }
  }
}

if (isMain(import.meta.url)) {
  for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143]]) process.on(sig, () => { try { stopAll(); } finally { dropState(); process.exit(code); } });
  main().then((ok) => process.exit(ok ? 0 : 1), (e) => { console.error(`\nthe party loot probe failed: ${e?.stack ?? e}`); try { stopAll(); } finally { dropState(); process.exit(2); } });
}

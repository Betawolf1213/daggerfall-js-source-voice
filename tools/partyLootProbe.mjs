#!/usr/bin/env node
// PARTY-LOOT's END-TO-END PROBE (2026-10-14; bible/06-Systems/Online-Arc.md PARTY-LOOT) - the report, played. Two players
// in the REAL game in headless Chromium over the player's own ARENA2, both online in Privateer's Hold against the REAL
// relay and the REAL account service in local workerd (tools/loadHarness.mjs standServices). Each is a guest with a realm
// character whose first save is the classic start's, composed by the world host (tools/onlineFrameProbe.mjs's own way
// in - a save made inside the Hold enters it online, HOLD-ONCE). The first in holds the seat. The host kills foes through
// the game's own damage door (`__damageFoe`) and the joiner the rest through its own - its blows ride to the host as
// hits, as a party member's do; once the joiner's copy has laid each body, the probe reads what each copy's body holds,
// every item by its template, material, count, condition and enchantments. Then two windows, each through the game's
// own loot door (`__takeLoot`, the press's) and the enhanced pack's own row click (online is the enhanced lane):
//   the joiner opens a body and closes it (Escape) taking nothing - the host's list must stand;
//   the joiner opens a body, the host opens it too and takes a piece, and the joiner closes taking nothing - the piece
//   the host took must stay taken (the old close put the joiner's stale list back over the room's word).
//   PASS: every body holds one list on both copies, both windows leave the host's list as the host left it, and no page
//   threw. A body neither copy can read fails the run; so does a run whose bodies hold nothing to take.
//   TREE=<a checkout before PARTY-LOOT> plays the report as it was.
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
    window.__bodyLoot = (i) => { const f = dungeonCtx?.foes?.[i]; return f?.dead && f.corpse ? JSON.stringify((f.entity?.items ?? []).map((it) => \`\${it.name} x\${it.stackCount ?? 1} [\${it.templateIndex}/\${it.material ?? '-'}/\${it.currentCondition ?? '-'}/\${(it.enchantments ?? []).length}]\`)) : null; };
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
    if (targets.length < 2) throw new Error(`${targets.length} foes standing - the probe kills two at least, one by each player`);
    const byHost = targets.filter((_, n) => n % 2 === 0), byJoiner = targets.filter((_, n) => n % 2 === 1);
    console.log(`== the host kills ${byHost.join(', ')}; the joiner kills ${byJoiner.join(', ')} (its blows ride to the host as hits)`);
    for (const i of byHost) await host.page.evaluate((n) => window.__damageFoe(n, 1e6), i);
    for (const i of byJoiner) {
      // a joiner's blow is the host's to apply (WORLD2): blows of the health the joiner's copy streams, until it falls
      for (let n = 0; n < 20 && !JSON.parse(await joiner.page.evaluate(() => window.__foes()))[i]?.dead; n++) {
        await joiner.page.evaluate((k) => window.__damageFoe(k), i);
        await sleep(1500);
      }
    }
    await until(joiner.page, (ids) => { const f = JSON.parse(window.__foes() ?? '[]'); return ids.every((i) => f[i]?.dead && f[i]?.corpse); }, targets, { what: 'the joiner laying every body', timeout: 300000 });
    await until(host.page, (ids) => { const f = JSON.parse(window.__foes() ?? '[]'); return ids.every((i) => f[i]?.dead && f[i]?.corpse); }, targets, { what: 'the host laying every body', timeout: 120000 });
    await sleep(4000);   // past LOOT_WORD_WAIT_MS, every word and heal landed
    await waitFrames(joiner.page, 5);

    const read = (who, i) => who.page.evaluate((n) => window.__bodyLoot(n), i);
    const rows = [];
    for (const i of targets) {
      const h = await read(host, i), j = await read(joiner, i);
      // a body each copy has laid reads as a list - an empty one included: an unread one is the seam's failure, never a match
      if (h == null || j == null) throw new Error(`body ${i} unread (host ${h}, joiner ${j})`);
      rows.push({ i, by: byHost.includes(i) ? 'host' : 'joiner', host: JSON.parse(h), joiner: JSON.parse(j), same: h === j });
    }
    console.log('== what each copy\'s body holds');
    for (const r of rows) console.log(`   body ${r.i} (the ${r.by}'s kill): ${r.same ? 'SAME' : 'DIFFERENT'}  host ${JSON.stringify(r.host)}  joiner ${JSON.stringify(r.joiner)}`);
    const full = rows.filter((r) => r.host.length);
    if (!full.length) throw new Error('every body is empty - nothing for the windows to test (KILLS= more)');

    const windowUp = (who) => who.page.evaluate(() => !!(window.__overlayKind?.() || document.getElementById('enhanced-inventory')));
    const noWindow = async (who) => {
      for (let n = 0; n < 5 && (await windowUp(who)); n++) { await who.page.keyboard.press('Escape'); await sleep(1000); }   // a press under a window opens nothing
      if (await windowUp(who)) throw new Error(`a window stands over the ${who.label}`);
    };
    /** The press's own loot door, and the pack it opens - mounted (its rows in), so its keys are its own. */
    const openBody = async (who, i) => {
      await noWindow(who);
      await who.page.evaluate((k) => window.__takeLoot(k), `corpse:${i}`);
      return until(who.page, () => (document.getElementById('enhanced-inventory')?.querySelector('*') ? 'the enhanced pack' : /Inventory/.test(window.__overlayKind?.() ?? '') ? window.__overlayKind() : null), null, { what: `the ${who.label}'s loot window`, timeout: 60000 });
    };
    const closeWindow = async (who) => {
      await who.page.keyboard.press('Escape');
      await until(who.page, () => !document.getElementById('enhanced-inventory') && !window.__overlayKind?.(), null, { what: `the ${who.label}'s loot window closing`, timeout: 60000 });
    };
    /** The enhanced pack's own click on its first loot row - a loot-side click takes (IG7). */
    const takeFirst = (who) => until(who.page, () => {
      const row = [...document.querySelectorAll('#enhanced-inventory *')].find((e) => e._padFrom === 'remote');
      if (!row) return null;
      row.click();
      return row._padItem?.name ?? '?';
    }, null, { what: `a loot row in the ${who.label}'s pack`, timeout: 60000 });

    const a = full[0];
    console.log(`== the joiner opens body ${a.i} and closes it, taking nothing`);
    const aBefore = await read(host, a.i);
    console.log(`   the window: ${await openBody(joiner, a.i)}`);
    await waitFrames(joiner.page, 3);
    await closeWindow(joiner);
    await sleep(3000);
    const aAfter = await read(host, a.i);
    const keptA = aBefore === aAfter;
    console.log(`   the host's body ${a.i}: before ${aBefore}, after ${aAfter}`);

    const b = full[full.length > 1 ? 1 : 0];
    console.log(`== the joiner opens body ${b.i}; the host opens it too, takes a piece and closes; the joiner closes, taking nothing`);
    await openBody(joiner, b.i);
    await openBody(host, b.i);
    const took = await takeFirst(host);
    await sleep(1000);
    await closeWindow(host);
    const left = await read(host, b.i);
    console.log(`   the host took ${took}; its body ${b.i} holds ${left}`);
    await sleep(3000);   // the host's word reaches the joiner, under its open window
    await closeWindow(joiner);
    await sleep(3000);
    const bHost = await read(host, b.i), bJoiner = await read(joiner, b.i);
    const keptB = bHost === left && bJoiner === left;
    console.log(`   after the joiner's close: the host's body ${bHost}, the joiner's ${bJoiner}`);

    const errors = [...host.errors.map((e) => `host: ${e}`), ...joiner.errors.map((e) => `joiner: ${e}`)];
    if (errors.length) console.log(`== page errors: ${errors.slice(0, 6).join(' | ')}`);
    const differ = rows.filter((r) => !r.same).length;
    const ok = differ === 0 && keptA && keptB && !errors.length;
    console.log(`\n${ok ? 'PASS' : 'FAIL'}: ${rows.length - differ} of ${rows.length} bodies one list on both copies (${byHost.length} the host's kills, ${byJoiner.length} the joiner's); the untouched window ${keptA ? 'left the host\'s list whole' : 'changed the host\'s list'}; the window the host took from under ${keptB ? 'left the piece taken' : 'put the piece back or left the copies apart'}${errors.length ? `; ${errors.length} page errors` : ''}`);
    return ok;
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

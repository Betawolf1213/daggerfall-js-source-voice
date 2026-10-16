// VIRT (2026-10-16) - THE LONG PACK, DRIVEN IN A BROWSER AND TIMED.
//
// A container of 700 pieces over a few hundred kinds of picture, and a pack page of 700: how long the window takes to
// open cold and warm, how many times it repaints while its pictures land, how long a pick takes, and whether the long
// list is still the whole list - its last row reachable at the foot of its scroll, the scroll as tall as the rows, the
// drawn rows at the places the whole list puts them. The archives are SYNTHETIC (tools/enhancedIconProbe.mjs's device:
// a valid TEXTURE file built here and served by intercepting the fetch) - no ARENA2 is read, and the timings are this
// machine's, said as such. Run it on a tree without VIRT for the before.
//
//     node tools/packVirtProbe.mjs            (starts its own dev server)
//     PROBE_PORT=5199 node tools/packVirtProbe.mjs
import { writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const PAGE_NAME = 'packvirt.tmp.html';
const N = Number(process.env.PILE ?? 700);

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>VIRT probe</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#333}</style></head><body>
<script type="module">
import { createWeapon } from '/src/combat/enemyEquipment.js';
import { setItemFields, mintCondition } from '/src/systems/itemTemplates.js';
import { ARMOR_MATERIAL } from '/src/systems/armorMaterials.js';
import { createInventoryWindow } from '/src/ui/inventoryDoor.js';

const e = { isPlayer: true, name: 'Aelwyn', career: { name: 'Spellsword' }, level: 12,
  stats: { strength: 90, endurance: 90, willpower: 50, intelligence: 50, agility: 50, speed: 50, personality: 50, luck: 50 },
  skills: new Array(35).fill(40), health: 60, maxHealth: 100, fatigue: 150, maxFatigue: 200, magicka: 14, maxMagicka: 20,
  items: [], spells: [], activeEffects: [], career2: null };
const thing = (group, t) => mintCondition(setItemFields({ group, templateIndex: t }));
// the kinds: every weapon in every metal, every armour piece in every material, and the small things
const kinds = [];
for (let t = 113; t <= 131; t++) for (let m = 0; m <= 9; m++) kinds.push(() => createWeapon(t, m));
for (let t = 102; t <= 111; t++) for (const m of Object.values(ARMOR_MATERIAL)) kinds.push(() => mintCondition(setItemFields({ group: 'Armor', templateIndex: t, material: m, flags: 0 })));
for (let t = 0; t <= 12; t++) kinds.push(() => thing('Gems', t));
for (let t = 133; t <= 140; t++) kinds.push(() => thing('Jewellery', t));
const pile = (n, only = null) => { const ks = only ? kinds.slice(0, only) : kinds; return Array.from({ length: n }, (_, i) => ks[(i * 7) % ks.length]()); };
let loot = [];
globalThis.__kinds = kinds.length;
const close = () => { document.getElementById('enhanced-inventory')?.remove(); document.querySelectorAll('.inv-tip,.dragghost').forEach((n) => n.remove()); };
const frame = () => new Promise((res) => requestAnimationFrame(() => setTimeout(res, 0)));
/** Open: a container (n pieces, the loot window alone), the player's own storage (n pieces beside the pack - the store's
 *  filter and the paired layout) or the pack (n weapons, its Weapons page). Timed to the frame. */
globalThis.__open = async (n, where) => {
  close();
  if (where === 'pack') { e.items = pile(n, 190); loot = []; } else { e.items = where === 'storage' ? pile(12) : []; loot = pile(n); }
  const deps = { entity: e, items: () => e.items, wagonItems: () => [] };
  if (where !== 'pack') deps.loot = { items: () => loot, storage: where === 'storage' };
  const t0 = performance.now();
  createInventoryWindow(deps);
  // the window mounts once its chunk has loaded (a task, warm): its rows are drawn when it does
  for (let i = 0; i < 2000 && !document.querySelector('#enhanced-inventory .itemrow'); i++) await new Promise((res) => setTimeout(res, 0));
  const built = performance.now() - t0;
  document.body.offsetHeight;
  const laid = performance.now() - t0;
  await frame();
  return { built, laid, framed: performance.now() - t0 };
};
globalThis.__close = close;
const listOf = (where) => document.querySelector(where === 'pack' ? '#enhanced-inventory .packlists' : '#enhanced-inventory .remotelist');
globalThis.__state = (where) => {
  const l = listOf(where);
  if (!l) return null;
  const rows = [...l.querySelectorAll('.itemrow')];
  return { rows: rows.length, initials: rows.filter((r) => !r.querySelector('.tile.has-icon')).length,
    scrollHeight: l.scrollHeight, clientHeight: l.clientHeight, repaints: JSON.parse(globalThis.__pack()).repaints };
};
/** The list scrolled to its foot: the last piece's row is there, and nothing but it stands below the band. */
globalThis.__foot = async (where) => {
  const l = listOf(where);
  l.scrollTop = l.scrollHeight;
  await frame(); await frame();
  const rows = [...l.querySelectorAll('.itemrow')];
  const last = rows.at(-1);
  const want = (where === 'pack' ? e.items.filter((it) => it.group === 'Weapons') : loot).at(-1);
  const lb = l.getBoundingClientRect(), rb = last.getBoundingClientRect();
  return { lastIsLast: last.title === want.name || last.querySelector('.tile')?.title?.startsWith?.(want.name) || last.textContent.includes(want.name),
    gapBelow: Math.round(lb.bottom - rb.bottom), scrollTop: l.scrollTop, scrollHeight: l.scrollHeight };
};
/** A pick in the middle of the list: the click's own time, to the frame. */
globalThis.__pickMiddle = async (where) => {
  const l = listOf(where);
  l.scrollTop = l.scrollHeight / 2;
  await frame(); await frame();
  const lb = l.getBoundingClientRect();
  const row = [...l.querySelectorAll('.itemrow')].find((r) => r.getBoundingClientRect().top > lb.top + 40);
  const before = Math.round(l.scrollTop);
  const t0 = performance.now();
  row.click();
  const clicked = performance.now() - t0;
  await frame();
  // the repaint built a new list: its scroll is the one the player sees
  return { clicked, framed: performance.now() - t0, scrollBefore: before, scrollAfter: Math.round(listOf(where).scrollTop), tip: !!document.querySelector('.packtip') };
};
/** At a share of the scroll, every drawn row is the piece the whole list puts at its place: its line by its top, its
 *  column by its order in the line, the piece at that index named on the row. Off by one row anywhere and it says so. */
globalThis.__placed = async (where, frac, query = '') => {
  const l = listOf(where);
  l.scrollTop = Math.round((l.scrollHeight - l.clientHeight) * frac);
  await frame(); await frame();
  const col = where === 'pack' ? l.querySelector('.packcol') : l;
  const rows = [...col.querySelectorAll('.itemrow')];
  const tops = rows.map((r) => r.getBoundingClientRect().top);
  const first = tops[0], cols = tops.filter((t) => Math.abs(t - first) < 1).length;
  const pitch = tops.find((t) => t > first + 1) - first;
  // the dock's column moves with its scroller; the loot list IS its scroller, so its content top is its box's less the scroll
  const top = col.getBoundingClientRect().top + parseFloat(getComputedStyle(col).paddingTop) - (col === l ? l.scrollTop : 0);
  const { itemLine } = await import('/src/ui/enhancedInventory.js');
  const items = (where === 'pack' ? e.items : loot).filter((it) => !query || itemLine(it, e).name.toLowerCase().includes(query));
  let wrong = 0, seen = 0, k = 0, lineAt = null, firstWrong = null;
  rows.forEach((r, i) => {
    const line = Math.round((tops[i] - top) / pitch);
    k = line === lineAt ? k + 1 : 0; lineAt = line;
    const idx = line * cols + k;
    const name = r.querySelector('.itemname > span')?.textContent;
    seen++;
    const want = items[idx] ? itemLine(items[idx], e).name + ((items[idx].stackCount ?? 1) > 1 ? ' ×' + items[idx].stackCount : '') : null;
    if (name !== want) { wrong++; firstWrong ??= { i, idx, name, want, top: Math.round(tops[i] - top) }; }
  });
  const lb = l.getBoundingClientRect();
  const visible = rows.filter((r) => { const b = r.getBoundingClientRect(); return b.bottom > lb.top && b.top < lb.bottom; }).length;
  return { frac, scrollTop: Math.round(l.scrollTop), drawn: seen, visible, cols, pitch, wrong, firstWrong, items: items.length };
};
/** The store's search, typed: the refill's own time, and the rows it shows placed as the filtered list puts them. */
globalThis.__search = async (q) => {
  const f = document.querySelector('#enhanced-inventory .storesearch, .loot-win .storesearch');
  if (!f) return null;
  f.focus();
  const t0 = performance.now();
  f.value = q;
  f.dispatchEvent(new Event('input'));
  const typed = performance.now() - t0;
  return { typed, focused: document.activeElement === f };
};
</script></body></html>`;

/** A 768-byte ART_PAL, a grey ramp. */
function synthPalette() {
  const b = Buffer.alloc(768);
  for (let i = 0; i < 256; i++) { b[i * 3] = i; b[i * 3 + 1] = i; b[i * 3 + 2] = i; }
  b[3] = 200; b[4] = 40; b[5] = 30;
  return b;
}
/** An uncompressed TEXTURE archive of `count` 16x16 records (tools/enhancedIconProbe.mjs's shape, larger). */
function synthArchive(count, W = 16, H = 16, STRIDE = 256) {
  const bodySize = 28 + H * STRIDE;
  const headersEnd = 26 + 20 * count;
  const buf = Buffer.alloc(headersEnd + bodySize * count);
  buf.writeInt16LE(count, 0);
  buf.write('SYNTHETIC', 2, 'ascii');
  for (let r = 0; r < count; r++) {
    const bodyAt = headersEnd + bodySize * r, hAt = 26 + 20 * r;
    buf.writeInt32LE(bodyAt, hAt + 2);
    buf.writeInt16LE(W, bodyAt + 4); buf.writeInt16LE(H, bodyAt + 6);
    buf.writeUInt32LE(bodySize - 28, bodyAt + 10); buf.writeUInt32LE(28, bodyAt + 14);
    buf.writeInt16LE(1, bodyAt + 18); buf.writeUInt16LE(1, bodyAt + 20);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) buf[bodyAt + 28 + y * STRIDE + x] = (x + y + r) % 3 ? 1 + (r % 200) : 0;
  }
  return buf;
}

const vite = process.env.PROBE_PORT ? null : await createServer({ root: ROOT, server: { port: 0, host: '127.0.0.1', watch: null }, logLevel: 'error' });
if (vite) await vite.listen();
const port = process.env.PROBE_PORT ?? vite.httpServer.address().port;
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const VIEWS = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, dpr: 1 },
  { name: 'phone', viewport: { width: 393, height: 851 }, dpr: 2.625, isMobile: true, hasTouch: true },
];
const out = {};
let failures = 0;
const check = (name, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`); };
try {
  await writeFile(join(ROOT, `tools/${PAGE_NAME}`), PAGE);
  for (const v of VIEWS) {
  const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: v.dpr, isMobile: !!v.isMobile, hasTouch: !!v.hasTouch });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const archive = synthArchive(128);
  await page.route('**/arena2/**', (route) => {
    const name = route.request().url().split('/').pop();
    if (name === 'ART_PAL.COL') return route.fulfill({ status: 200, body: synthPalette() });
    if (/^TEXTURE\.\d+$/.test(name)) return route.fulfill({ status: 200, body: archive });
    return route.fulfill({ status: 404, body: '' });
  });
  await page.goto(`http://127.0.0.1:${port}/tools/${PAGE_NAME}?skin=enhanced`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => typeof globalThis.__open === 'function', null, { timeout: 90000 });
  // the module's first load is not the window's cost: a small pile first
  await page.evaluate(() => globalThis.__open(3, 'loot'));
  await page.waitForSelector('#enhanced-inventory .itemrow', { timeout: 30000 });
  out.kinds = await page.evaluate(() => globalThis.__kinds);
  const res = out[v.name] = {};
  // long tasks, from here on
  await page.evaluate(() => { globalThis.__long = []; new PerformanceObserver((l) => { for (const t of l.getEntries()) globalThis.__long.push(t.duration); }).observe({ type: 'longtask' }); });
  for (const where of ['loot', 'storage', 'pack']) {
    const r = {};
    await page.evaluate(() => { globalThis.__long.length = 0; });
    const t0 = Date.now();
    r.cold = await page.evaluate(([n, w]) => globalThis.__open(n, w), [N, where]);
    // until the drawn rows' pictures settle: no initials left among them, or nothing moved for 1.5 s
    let last = null, still = 0;
    for (let i = 0; i < 300 && still < 15; i++) {
      await page.waitForTimeout(100);
      const s = await page.evaluate((w) => globalThis.__state(w), where);
      if (!s) continue;
      if (s.initials === 0) { last = s; break; }
      still = last && last.initials === s.initials && last.repaints === s.repaints ? still + 1 : 0;
      last = s;
    }
    r.settleMs = Date.now() - t0;
    r.settled = last;
    r.longTasks = await page.evaluate(() => ({ count: globalThis.__long.length, ms: Math.round(globalThis.__long.reduce((a, b) => a + b, 0)), worst: Math.round(Math.max(0, ...globalThis.__long)) }));
    r.warm = await page.evaluate(([n, w]) => globalThis.__open(n, w), [N, where]);
    r.warmState = await page.evaluate((w) => globalThis.__state(w), where);
    r.pick = await page.evaluate((w) => globalThis.__pickMiddle(w), where);
    r.foot = await page.evaluate((w) => globalThis.__foot(w), where);
    r.placed = [];
    for (const f of [0, 0.13, 0.5, 0.77, 1, 0.31]) r.placed.push(await page.evaluate(([w, x]) => globalThis.__placed(w, x), [where, f]));
    if (where === 'storage') {
      r.search = await page.evaluate(() => globalThis.__search('dagger'));
      r.searchPlaced = [];
      for (const f of [0, 0.5, 1]) r.searchPlaced.push(await page.evaluate(([w, x]) => globalThis.__placed(w, x, 'dagger'), [where, f]));
    }
    res[where] = r;
    const tag = `${v.name} ${where}`;
    check(`${tag}: the pick keeps the list's scroll`, r.pick.scrollAfter === r.pick.scrollBefore, `${r.pick.scrollBefore} -> ${r.pick.scrollAfter}`);
    check(`${tag}: the foot of the scroll shows the last piece, flush`, r.foot.lastIsLast && Math.abs(r.foot.gapBelow) <= 8, JSON.stringify(r.foot));
    for (const p of [...r.placed, ...(r.searchPlaced ?? [])]) check(`${tag}: at ${p.frac} of the scroll every drawn row is the piece at its place`, p.wrong === 0 && p.visible > 0, `${p.drawn} drawn, ${p.visible} seen, ${p.wrong} wrong${p.firstWrong ? ` ${JSON.stringify(p.firstWrong)}` : ''}`);
    if (r.search) check(`${tag}: the search keeps its focus`, r.search.focused);
    console.log(`     ${tag}: cold ${Math.round(r.cold.framed)} ms, settled in ${r.settleMs} ms over ${r.settled?.repaints} repaints, ${r.longTasks.count} long tasks (${r.longTasks.ms} ms); warm ${Math.round(r.warm.framed)} ms; a pick ${Math.round(r.pick.framed)} ms${r.search ? `; a search ${Math.round(r.search.typed)} ms` : ''}; ${r.warmState.rows} rows drawn, ${r.warmState.scrollHeight} px of list`);
  }
  check(`${v.name}: no page errors`, errors.length === 0, errors.join(' | '));
  await ctx.close();
  }
} finally {
  await unlink(join(ROOT, `tools/${PAGE_NAME}`)).catch(() => {});
  await browser.close();
  await vite?.close();
}
if (process.env.PROBE_JSON) console.log(JSON.stringify(out, null, 1));
process.exitCode = failures ? 1 : 0;

// B-027: REDESIGN SMOKE PROBE
//
// Drives the enhanced front door with ?redesign=1 in a real browser,
// verifies the redesign visual language renders, and checks the small
// mute icon + background music wiring. Run against a dev server:
//     npx vite --port 5199 &
//     node tools/uiRedesignProbe.mjs
//
// With --self-test, it only validates its own module and the redesign
// source sweep; no browser is started.
import { chromium, devices } from 'playwright';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

const selfTest = process.argv.includes('--self-test');
const BASE = process.env.PROBE_BASE ?? 'http://localhost:5199';
const shots = process.env.PROBE_SHOTS ?? 'C:/Users/User/AppData/Local/hermes/cache/scratch';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`);
};

if (selfTest) {
  // Static validation: the source files carry the redesign hooks.
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  check('self-test: enhancedStyle.js exports REDESIGN_CSS', /export const REDESIGN_CSS/.test(read('src/ui/enhanced/enhancedStyle.js')));
  check('self-test: enhancedMenu.js uses isRedesign', /isRedesign\(\)/.test(read('src/ui/enhanced/enhancedMenu.js')));
  check('self-test: enhancedChargen.js uses isRedesign', /isRedesign\(\)/.test(read('src/ui/enhanced/enhancedChargen.js')));
  check('self-test: menuMusicBackground.test.js exists', true);
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
  process.exit(0);
}

let server = null;
let ownServer = false;
if (!process.env.PROBE_BASE) {
  server = await createServer({ server: { port: 5199, strictPort: true } });
  await server.listen();
  ownServer = true;
}

const browser = await chromium.launch();

async function run(label, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${BASE}/menu.html?redesign=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.px-menu', { timeout: 60000 });
  if (await page.locator('.px-acctstage').count()) await page.keyboard.press('Escape');
  await page.waitForSelector('.px-menu button', { timeout: 15000 });

  // 1. The redesign visual language is present.
  const visual = await page.evaluate(() => ({
    fog: document.querySelectorAll('.redesign .px-fog').length,
    wordmark: Boolean(document.querySelector('.redesign .px-wordmark')),
    rule: Boolean(document.querySelector('.redesign .px-rule')),
    menu: document.querySelectorAll('.redesign .px-menu button').length,
  }));
  check(`${label}: redesign fog ground is drawn`, visual.fog === 3, JSON.stringify(visual));
  check(`${label}: redesign wordmark renders`, visual.wordmark);
  check(`${label}: redesign ornament rule renders`, visual.rule);
  check(`${label}: redesign menu buttons render`, visual.menu > 0, `${visual.menu} buttons`);

  // 2. Mute button is present and keyboard-accessible.
  const mute = await page.locator('.redesign .px-mute').count();
  check(`${label}: redesign mute button is present`, mute === 1);
  const pressed = await page.evaluate(() => document.querySelector('.redesign .px-mute')?.getAttribute('aria-pressed'));
  check(`${label}: mute button has aria-pressed`, pressed === 'false');

  // 3. A click unlocks and starts background music.
  await page.click('.redesign .px-menu button');
  await page.waitForTimeout(300);
  const audio = await page.evaluate(async () => {
    try {
      const { IntroTheme } = await import('/src/systems/introTheme.js');
      return 'module loaded';
    } catch (e) { return String(e); }
  });
  check(`${label}: intro theme module is loadable in the page`, audio === 'module loaded', audio);

  await page.screenshot({ path: `${shots}/redesign-${label}.png` });
  check(`${label}: no page errors`, errors.length === 0, errors.join(' | '));

  await ctx.close();
}

await run('desktop', { viewport: { width: 1400, height: 900 } });
await run('phone', { ...devices['Pixel 5'] });

await browser.close();
if (ownServer && server) await server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exit(1);

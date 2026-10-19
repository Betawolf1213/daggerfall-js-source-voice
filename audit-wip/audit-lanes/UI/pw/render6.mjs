// THE DFO GRIMOIRE DRESS (decision 6: objectives are drawn on Enhanced Plus and DFO Grimoire): the same pages with the
// dress mounted (ui/grimoireDress.js mountGrimoireDress) - the new parts' ink on the parchment, and their contrast.
import { chromium } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/node_modules/playwright/index.mjs';
import { serve, LANE } from './serve.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/pw-browsers';
const { server, harness } = await serve(5396);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(harness);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(async () => { const g = await import('/src/ui/grimoireDress.js'); g.mountGrimoireDress(document); window.__scn.open({}); });
  await page.waitForSelector('#enhanced-pause .px-qrail');
  await page.waitForTimeout(600);
  for (const [tag, match] of [['offer', null], ['quest', 'Lich'], ['line', 'Burning Doors'], ['ladder', 'Fighters']]) {
    await page.evaluate(({ tag, match }) => {
      const rows = [...document.querySelectorAll('#enhanced-pause .px-qrail .px-qrow')];
      (tag === 'offer' ? document.querySelector('#enhanced-pause .px-qreward') : rows.find((b) => b.textContent.includes(match)))?.click();
    }, { tag, match });
    await page.waitForTimeout(300);
    const ink = await page.evaluate(() => {
      const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
      const out = [];
      for (const sel of ['.px-qobj-text', '.px-qobj-row.done .px-qobj-text', '.px-qobj-row.failed .px-qobj-text', '.px-qobj-state', '.px-qobj-tag', '.px-qobj-q', '.px-qobj-a', '.px-qobj-reward', '.px-qpiece-name', '.px-qpiece-tier', '.px-qpiece-lines li', '.px-qline-what', '.px-qline-lead', '.px-qline-state', '.px-qline-said', '.px-qline-who', '.px-qobj-mark']) {
        const n = document.querySelector(`#enhanced-pause ${sel}`);
        if (!n) continue;
        const s = getComputedStyle(n);
        out.push(`${sel}: color ${s.color} shadow ${s.textShadow === 'none' ? 'none' : s.textShadow.slice(0, 30)} (lum ${lum(s.color).toFixed(2)})`);
      }
      return { dress: document.documentElement.dataset.plusDress, out };
    });
    console.log(`== ${tag} (dress ${ink.dress})\n  ${ink.out.join('\n  ')}`);
    await page.screenshot({ path: `${LANE}/pw/shots/grimoire_${tag}.png` });
  }
  if (errs.length) console.log('errors', errs);
} finally { await browser.close(); await server.close(); }

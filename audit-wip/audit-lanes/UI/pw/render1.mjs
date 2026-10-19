// Drive the real Quests tab in Chromium: the rail's rows and sections, each new row's page, and what is on it.
import { chromium } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { serve, LANE } from './serve.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/pw-browsers';
const shots = `${LANE}/pw/shots`;
mkdirSync(shots, { recursive: true });
const { server, harness } = await serve(5391);
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 300)}`); });
  await page.goto(harness);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => window.__scn.open({}));
  await page.waitForSelector('#enhanced-pause .px-qrail', { timeout: 20000 });
  const rail = () => page.$$eval('#enhanced-pause .px-qrail > *', (ns) => ns.map((n) => `${n.tagName.toLowerCase()}.${n.className}: ${n.textContent.trim()}${n.title ? `  [title: ${n.title}]` : ''}`));
  console.log('RAIL (in order):\n  ' + (await rail()).join('\n  '));
  const detailText = () => page.$eval('#enhanced-pause .px-qdetail', (n) => n.innerText);
  console.log('\nOPENED ON:\n' + (await detailText()));
  await page.screenshot({ path: `${shots}/01_open.png` });
  // every row: press it, read its page
  const n = await page.$$eval('#enhanced-pause .px-qrail .px-qrow', (ns) => ns.length);
  for (let i = 0; i < n; i++) {
    const label = await page.$$eval('#enhanced-pause .px-qrail .px-qrow', (ns, i) => ns[i].textContent.trim(), i);
    await page.$$eval('#enhanced-pause .px-qrail .px-qrow', (ns, i) => ns[i].click(), i);
    await page.waitForTimeout(50);
    const on = await page.$$eval('#enhanced-pause .px-qrail .px-qrow.on', (ns) => ns.map((x) => x.textContent.trim()));
    const text = await detailText();
    console.log(`\n=== ROW ${i}: ${label}   (lit: ${JSON.stringify(on)})\n${text}`);
    await page.screenshot({ path: `${shots}/row${String(i).padStart(2, '0')}.png` });
  }
} finally {
  console.log('\nERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
  await server.close();
}

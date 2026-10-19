// The keyboard through the Quests tab (Tab walks, Enter presses): do the new rows - rewards, questlines, ladders - take
// the focus, and after a press does the focus stay on the row pressed? Then the Take, the switch off, and the unlogged
// quest's Hide.
import { chromium } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/node_modules/playwright/index.mjs';
import { serve } from './serve.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/pw-browsers';
const { server, harness } = await serve(5392);
const browser = await chromium.launch({ headless: true });
const errors = [];
const focused = (page) => page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}.${a.className}: ${a.textContent.trim().slice(0, 40)}` : 'none'; });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(harness);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => window.__scn.open({}));
  await page.waitForSelector('#enhanced-pause .px-qrail');
  console.log('focus at open:', await focused(page));
  // walk with Tab from the opened window: list every stop until we are past the rail
  const stops = [];
  for (let i = 0; i < 60; i++) { await page.keyboard.press('Tab'); stops.push(await focused(page)); }
  console.log('TAB STOPS:\n  ' + stops.join('\n  '));
  // press Enter on the first questline row reached by Tab and see where the focus is after the re-render
  await page.evaluate(() => document.querySelector('#enhanced-pause .px-qlinerow').focus());
  console.log('\nfocused a line row:', await focused(page));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(80);
  console.log('after Enter on it  :', await focused(page));
  console.log('lit row            :', await page.$eval('#enhanced-pause .px-qrow.on', (n) => n.textContent.trim()));
  await page.keyboard.press('Tab');
  console.log('next Tab lands on  :', await focused(page));

  // THE TAKE, by keyboard: focus the second card's Take and press Enter
  await page.evaluate(() => document.querySelectorAll('#enhanced-pause .px-qrail .px-qreward')[0].click());
  await page.waitForTimeout(50);
  const takes = await page.$$eval('#enhanced-pause .px-qoffer .act', (ns) => ns.map((n) => `${n.textContent} [title: ${n.title}]`));
  console.log('\nTAKE buttons:', takes);
  await page.evaluate(() => document.querySelectorAll('#enhanced-pause .px-qoffer .act')[1].focus());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(80);
  console.log('taken:', JSON.stringify(await page.evaluate(() => globalThis.__taken)), '| focus now:', await focused(page));
  console.log('rail now:', await page.$$eval('#enhanced-pause .px-qrail > *', (ns) => ns.slice(0, 5).map((n) => n.textContent.trim())));
  await page.evaluate(() => globalThis.__slot?.close?.());
} finally {
  console.log('\nERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
  await server.close();
}

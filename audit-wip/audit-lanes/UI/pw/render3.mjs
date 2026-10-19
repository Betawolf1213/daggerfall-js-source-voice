// UI REPRO: THE TAKE CARRIES THE FOCUS INTO THE NEXT REWARD. A keyboard (or a pad's confirm) presses "Take this" on the
// first reward's second piece; the tab re-renders on the next reward waiting with the focus already on one of ITS Take
// buttons - a second press (a double tap) takes a piece of a reward the player never looked at, and the other two are gone.
import { chromium } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/node_modules/playwright/index.mjs';
import { serve } from './serve.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/pw-browsers';
const { server, harness } = await serve(5393);
const browser = await chromium.launch({ headless: true });
const focused = (page) => page.evaluate(() => { const a = document.activeElement; const all = [...document.querySelectorAll('#enhanced-pause .px-qoffer .act')]; return `${a.tagName.toLowerCase()}.${a.className} "${a.textContent.trim()}" (Take #${all.indexOf(a)} of the reward shown: ${document.querySelector('#enhanced-pause .px-qname h3')?.textContent})`; });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(harness);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => window.__scn.open({}));
  await page.waitForSelector('#enhanced-pause .px-qoffer');
  console.log('shown first:', await page.$eval('#enhanced-pause .px-qname h3', (n) => n.textContent));
  await page.evaluate(() => document.querySelectorAll('#enhanced-pause .px-qoffer .act')[1].focus());
  console.log('focus:', await focused(page));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(60);
  console.log('after 1st Enter - taken', JSON.stringify(await page.evaluate(() => globalThis.__taken)), '- focus:', await focused(page));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(60);
  console.log('after 2nd Enter - taken', JSON.stringify(await page.evaluate(() => globalThis.__taken)), '- rewards left:', await page.$$eval('#enhanced-pause .px-qreward', (ns) => ns.length));
} finally { await browser.close(); await server.close(); }

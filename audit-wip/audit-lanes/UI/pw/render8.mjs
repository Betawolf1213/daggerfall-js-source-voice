// UI REPRO: A DOUBLE-CLICK ON "Take this" CHOOSES FOR TWO REWARDS. The first click takes the piece; the tab redraws on the
// next reward waiting with its three cards in the same places, so the second click of the double-click (or a pad's
// cursor pressed twice where it stands) lands on the next reward's Take - a piece the player never looked at.
import { chromium } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/node_modules/playwright/index.mjs';
import { serve } from './serve.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/pw-browsers';
const { server, harness } = await serve(5398);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(harness);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => window.__scn.open({}));
  await page.waitForSelector('#enhanced-pause .px-qoffer');
  const box = await page.locator('#enhanced-pause .px-qoffer .act').nth(1).boundingBox();
  console.log('reward shown:', await page.$eval('#enhanced-pause .px-qname h3', (n) => n.textContent), '- double-clicking its second "Take this"');
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(80);
  console.log('taken [offer id, piece]:', JSON.stringify(await page.evaluate(() => globalThis.__taken)), '- rewards left:', await page.$$eval('#enhanced-pause .px-qreward', (ns) => ns.length));
} finally { await browser.close(); await server.close(); }

// UI REPRO: an UNLOGGED stamped quest's row (questRail.js unloggedRail, the pause tab's alone) - its "Hide from journal"
// hides nothing the tab can see (the row stays, the button keeps saying Hide), and its "Track" pins a quest the tracker
// can never show (the lens reads `active` alone), so the HUD card goes blank. Then the switch OFF: what the tab draws.
import { chromium } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/node_modules/playwright/index.mjs';
import { serve } from './serve.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/pw-browsers';
const { server, harness } = await serve(5397);
const browser = await chromium.launch({ headless: true });
const rail = (page) => page.$$eval('#enhanced-pause .px-qrail > *', (ns) => ns.map((n) => n.textContent.trim()));
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(harness);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => window.__scn.open({}));
  await page.waitForSelector('#enhanced-pause .px-qrail');
  await page.evaluate(() => [...document.querySelectorAll('#enhanced-pause .px-qrow')].find((b) => b.textContent.includes('Silent Summons')).click());
  const acts = () => page.$$eval('#enhanced-pause .px-qdetail button', (ns) => ns.map((n) => n.textContent.trim()));
  console.log('unlogged quest page buttons:', await acts());
  await page.evaluate(() => [...document.querySelectorAll('#enhanced-pause .px-qdetail button')].find((b) => b.textContent.includes('Hide')).click());
  await page.waitForTimeout(60);
  console.log('after "Hide from journal": hidden list =', JSON.stringify(await page.evaluate(() => window.__lastLog?.hidden ?? null)));
  const r = await rail(page);
  console.log('  rail still lists it:', r.includes('◆A Silent Summons'), '| a Show hidden toggle:', r.find((x) => /hidden/i.test(x)) ?? 'none');
  await page.evaluate(() => [...document.querySelectorAll('#enhanced-pause .px-qrow')].find((b) => b.textContent.includes('Silent Summons')).click());
  console.log('  its page buttons now:', await acts());
  // the tracker: Track it, then ask the tracker what the HUD card shows
  const card = await page.evaluate(async () => {
    const { questTracker } = await import('/src/ui/quest/questTracker.js');
    const { QuestLens } = await import('/src/ui/quest/questLens.js');
    [...document.querySelectorAll('#enhanced-pause .px-qdetail button')].find((b) => /Track/.test(b.textContent))?.click();
    const log = window.__scn.buildLog({});
    questTracker.hear(new QuestLens({ questLog: () => log }).look());
    return { pinned: questTracker.pinned, frame: questTracker.frame() };
  });
  console.log('after "Track": pinned', card.pinned, '- the HUD card:', JSON.stringify(card.frame));
  // THE SWITCH OFF
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await p2.goto(harness);
  await p2.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await p2.evaluate(() => window.__scn.open({ off: true }));
  await p2.waitForSelector('#enhanced-pause .px-qrail');
  console.log('\nSWITCH OFF rail:', await rail(p2));
  console.log('  any new part in the window:', await p2.$$eval('#enhanced-pause .px-qobj, #enhanced-pause .px-qline, #enhanced-pause .px-qoffer, #enhanced-pause .px-qlinerow', (ns) => ns.length));
} finally { await browser.close(); await server.close(); }

// A PHONE (360x640, touch): where the page of a pressed row lands. The rail stacks above the detail; with the questlines
// on, the rail grows by every line (13) and every ladder - how far down is the reward's Take, and does a press bring it
// into view?
import { chromium } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/node_modules/playwright/index.mjs';
import { serve, LANE } from './serve.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/pw-browsers';
const { server, harness } = await serve(5395);
const browser = await chromium.launch({ headless: true });
try {
  for (const off of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto(harness);
    await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
    await page.evaluate((off) => window.__scn.open({ off }), off);
    await page.waitForSelector('#enhanced-pause .px-qrail');
    const where = () => page.evaluate(() => {
      const d = document.querySelector('#enhanced-pause .px-qdetail');
      let s = d.parentElement; while (s && !(s.scrollHeight > s.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
      const rail = document.querySelector('#enhanced-pause .px-qrail');
      const take = document.querySelector('#enhanced-pause .px-qoffer .act');
      return { railRows: rail.querySelectorAll('.px-qrow').length, railHeight: Math.round(rail.getBoundingClientRect().height),
        detailTopOnScreen: Math.round(d.getBoundingClientRect().top), scroller: s ? `${s.className} scrollTop=${s.scrollTop} of ${s.scrollHeight}` : 'none',
        firstTakeTopOnScreen: take ? Math.round(take.getBoundingClientRect().top) : null, screen: innerHeight };
    });
    console.log(`switch ${off ? 'OFF' : 'ON'} - opened:`, JSON.stringify(await where()));
    if (!off) {
      // tap the last questline row (the guild's ladder) and see where its page is
      await page.locator('#enhanced-pause .px-qlinerow').last().tap();
      await page.waitForTimeout(60);
      console.log('  tapped the ladder row:', JSON.stringify(await where()));
      await page.screenshot({ path: `${LANE}/pw/shots/phone_after_tap.png` });
    }
    await ctx.close();
  }
} finally { await browser.close(); await server.close(); }

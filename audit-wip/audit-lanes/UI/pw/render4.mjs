// SMALL SIZES AND LONG WORDS: the Quests tab at a phone's portrait and landscape, a small laptop, in English, German and
// Russian, on each kind of new page (a reward waiting, a stamped quest with a long objective, a questline, a ladder).
// Reports every element of the new parts that spills past the window or its own box, and takes a shot of each.
import { chromium } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { serve, LANE } from './serve.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/pw-browsers';
const shots = `${LANE}/pw/shots`;
mkdirSync(shots, { recursive: true });
const { server, harness } = await serve(5394);
const browser = await chromium.launch({ headless: true });
const SIZES = [[360, 640], [640, 360], [800, 600], [1280, 720]];
const LANGS = (process.argv[2] ?? 'en,de,ru').split(',');
const PAGES = [['offer', 'Reward'], ['quest', 'Lich'], ['line', 'Burning Doors'], ['ladder', 'Fighters'], ['line2', 'Covens']];
try {
  for (const lang of LANGS) {
    for (const [w, h] of SIZES) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 700 });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', (e) => errs.push(e.message));
      await page.goto(harness);
      await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
      await page.evaluate(async (lang) => { await window.__scn.setLanguage(lang); window.__scn.open({ longText: true }); }, lang);
      await page.waitForSelector('#enhanced-pause .px-qrail');
      for (const [tag, match] of PAGES) {
        // the rail's row whose words hold `match` (the reward row by position: its words are translated)
        await page.evaluate(({ tag, match }) => {
          const rows = [...document.querySelectorAll('#enhanced-pause .px-qrail .px-qrow')];
          const r = tag === 'offer' ? document.querySelector('#enhanced-pause .px-qreward') : rows.find((b) => b.textContent.includes(match));
          r?.click();
        }, { tag, match });
        await page.waitForTimeout(40);
        const spill = await page.evaluate(() => {
          const W = window.innerWidth;
          const out = [];
          const scope = document.querySelector('#enhanced-pause');
          for (const n of scope.querySelectorAll('.px-qrail .px-qrow, .px-qdetail *')) {
            const r = n.getBoundingClientRect();
            if (!r.width) continue;
            const cls = n.className && typeof n.className === 'string' ? n.className : n.tagName;
            const isNew = /px-q(obj|line|offer|piece|reward)|px-qlinerow/.test(cls) || n.closest('.px-qobj, .px-qline, .px-qoffer');
            if (!isNew) continue;
            if (r.right > W + 1) out.push(`past the window: ${cls} right=${Math.round(r.right)} > ${W} "${n.textContent.trim().slice(0, 50)}"`);
            if (n.scrollWidth > n.clientWidth + 1 && getComputedStyle(n).overflowX !== 'visible') out.push(`clipped: ${cls} ${n.scrollWidth}>${n.clientWidth} "${n.textContent.trim().slice(0, 50)}"`);
          }
          const d = document.querySelector('#enhanced-pause .px-qdetail');
          const dr = d.getBoundingClientRect();
          return { out, docOverflow: document.documentElement.scrollWidth > W, detail: [Math.round(dr.width), Math.round(dr.height)], detailScrolls: d.scrollHeight > d.clientHeight };
        });
        const name = `${lang}_${w}x${h}_${tag}.png`;
        await page.screenshot({ path: `${shots}/${name}` });
        console.log(`${lang} ${w}x${h} ${tag}: detail ${spill.detail.join('x')}${spill.detailScrolls ? ' (scrolls)' : ''}${spill.docOverflow ? ' DOC OVERFLOWS' : ''}${spill.out.length ? `\n    ${spill.out.slice(0, 8).join('\n    ')}` : ' - nothing spills'}`);
      }
      if (errs.length) console.log('  page errors:', errs);
      await ctx.close();
    }
  }
} finally { await browser.close(); await server.close(); }

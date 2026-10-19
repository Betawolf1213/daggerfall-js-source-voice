// BRANCH Q2 (box widths, the classic skin): ui/messageBox.js layoutMessageBox sizes the box to its widest row (no wrap,
// no cap): w = textW + 2*MARGIN(10), x = (320 - w) / 2 - a row wider than 300 px puts the parchment and its text off
// both sides of the 320-px native screen. ui/listPicker.js draws each label from x = 60+26 = 86 with no clip - a label
// wider than 234 px runs off the right edge (and any label past the 138-px list runs over the picker's art).
// FONT0003 (pinned by test/ui/audit18_ui_native.test.js): FixedWidth 5, the space glyph FixedWidth-1 = 4. A LOWER BOUND
// is used for every other glyph - 3 px (a 2-px glyph and the 1-px GlyphSpacing) - so a row flagged here is over at ANY
// real FONT0003 metric, before its macros (%pcf, ___dungeon_) are expanded to longer names.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { QL_PATCHES } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
const lower = (s) => [...s].reduce((w, c) => w + (c === ' ' ? 4 : 3), 0);
const BOX_MAX = 300, LABEL_MAX = 320 - 86, LIST_W = 138;
const box = [], label = [], overList = [];
for (const [name, ps] of QL_PATCHES) {
  const text = ps.map((p) => p.new).join('\n');
  const asks = [...text.matchAll(/\bask (\d+) choices ((?:\d+ _[^\s]+_\s*)+)/g)];
  const choiceIds = new Set(asks.flatMap((m) => [...m[2].matchAll(/(\d+) _/g)].map((x) => +x[1])));
  let id = null, rows = [];
  const flush = () => {
    if (id == null) return;
    if (choiceIds.has(id)) { const l = rows.join(' ').trim(); const w = lower(l); if (w > LABEL_MAX) label.push([name, id, w, l.length]); else if (w > LIST_W) overList.push([name, id, w]); }
    else for (const r of rows) { const w = lower(r.replace(/<ce>\s*/, '').trim()); if (w > BOX_MAX) box.push([name, id, w, r.trim().length]); }
  };
  for (const l of text.split('\n')) {
    const m = /^Message:\s+(\d+)/.exec(l);
    if (m) { flush(); id = +m[1]; rows = []; continue; }
    if (!l.trim()) { flush(); id = null; rows = []; continue; }
    if (id != null) rows.push(l);
  }
  flush();
}
console.log(`question/answer rows over ${BOX_MAX} px even at the lower bound (box off-screen): ${box.length}`);
box.forEach(([n, id, w, c]) => console.log(`   ${n} ${id}: >= ${w} px (${c} chars)`));
console.log(`choice labels over ${LABEL_MAX} px even at the lower bound (run off the screen): ${label.length}`);
label.forEach(([n, id, w, c]) => console.log(`   ${n} ${id}: >= ${w} px (${c} chars)`));
console.log(`choice labels over the ${LIST_W}-px list (over the picker art): ${overList.length} more`);

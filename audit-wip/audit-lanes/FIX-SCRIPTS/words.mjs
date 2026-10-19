// The words findings (LINES-9, -10, -23, -24, -26, -27, ACTS-7) against the LIVE tree: each prints what is still wrong.
import { readFileSync } from 'node:fs';
const ROOT = '/home/user/daggerfall-js-source';
const { QL_LINES } = await import(ROOT + '/src/systems/questlines/qlLines.js');
const { sheetFor } = await import(ROOT + '/src/systems/questlines/qlSheets.js');
const { makeBridge } = await import('./harness.mjs');
const { questLetterName } = await import(ROOT + '/src/systems/item/itemInfo.js');
const BAND = { 1: [100, 200], 2: [200, 400], 3: [300, 600], 4: [500, 900] };
const text = (q) => readFileSync(`${ROOT}/src/systems/questlines/quests/${q}.txt`, 'utf8');
const qrc = (q) => text(q).split(/^QBN:/m)[0].split('\n').filter((l) => !/^--/.test(l)).join('\n');
const sheetWords = (q) => { const s = sheetFor(q); return JSON.stringify({ o: s?.objectives?.map((o) => o.text), b: s?.branches?.map((b) => [b.text, b.choices.map((c) => c.text)]), r: s?.outcomes?.map((o) => o.text) }); };
const out = [];
for (const l of QL_LINES) l.steps.forEach((s, i) => {
  const w = qrc(s.quest) + '\n' + sheetWords(s.quest);
  for (const m of w.matchAll(/3E (\d+)/g)) if (m[1] !== '398') out.push(`LINES-9 ${s.quest}: names 3E ${m[1]}`);
  for (const m of w.matchAll(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+) years\b/gi)) if (l.id === 'weirRoad') out.push(`LINES-9 ${s.quest}: counts "${m[0]}"`);
  if (/always (here|there)/i.test(w) && l.id === 'weirRoad') out.push(`LINES-10 ${s.quest}: Corvane "always here/there"`);
  if (/\b(?:ask|see|find|come to) me\b[^."]*tomorrow/i.test(w)) out.push(`LINES-27 ${s.quest}: "tomorrow"`);
  if (/keepers? of the Covenant|kept the Covenant/i.test(w)) out.push(`LINES-23 ${s.quest}: the Order kept/keeps the Covenant`);
  if (/Beat a revenant/i.test(w)) out.push(`ACTS-7 ${s.quest}: "Beat a revenant"`);
  const g = /Item _gold_ gold range (\d+) to (\d+)/.exec(text(s.quest));
  if (g && (+g[1] !== BAND[l.tier][0] || +g[2] !== BAND[l.tier][1])) out.push(`LINES-24 ${s.quest}: gold ${g[1]}-${g[2]}, the tier-${l.tier} band ${BAND[l.tier].join('-')}`);
  if (l.group === 'intro' && i > 0) {
    const first = (/QuestLogEntry:\s*\[1010\]\n([\s\S]*?)\n\s*\n/.exec(qrc(s.quest)) ?? [])[1] ?? '';
    const m = /(_[a-z]+_), (the|a) (court crafter|armourer|stable master|astrologer|harbourmaster|regular|captain)/.exec(first);
    if (m && m[2] === 'the') out.push(`LINES-10 ${s.quest}: a new ${m[3]} spoken of as the last step's ("${m[0]}")`);
  }
});
// LINES-26: what each letter is called in the pack (DFU's quest-letter arm, ResolveItemLongName)
const h = makeBridge({ level: 30, online: true });
for (const l of QL_LINES) for (const s of l.steps) {
  const q = h.bridge.machine.startQuestByName(s.quest);
  if (!q) continue;
  for (const r of q.resources.values()) if (r.isItem && !r.isGold) {
    const it = r.daggerfallUnityItem;
    const name = questLetterName(it, () => q) ?? it?.name;
    out.push(`LINES-26 ${s.quest} ${r.symbol.name}: "${name}"`);
  }
}
console.log(out.join('\n'));

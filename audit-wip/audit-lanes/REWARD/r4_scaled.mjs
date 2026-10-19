// The quests whose sheet scales gold (a lesser or greater outcome) - what their scripts actually pay, so a scale with
// no gold to touch (a diamond, `give pc nothing`) is seen, with the outcome's words.
import { SNAP, questLines } from './_env.mjs';
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { PAY_PROFILES } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
for (const [name, sheet] of SHEETS) {
  const scaled = (sheet.outcomes ?? []).filter((o) => PAY_PROFILES[o.pay]?.gold !== 1);
  if (!scaled.length) continue;
  const lines = questLines(name) ?? [];
  const kinds = new Map();
  for (const l of lines) { const m = /^\s*Item\s+(\S+)\s+(\S+)/.exec(l); if (m) kinds.set(m[1], m[2]); }
  const gives = lines.map((l) => /^\s*give pc\s+(\S+)/.exec(l)?.[1]).filter(Boolean).map((s) => (s === 'nothing' ? 'nothing' : kinds.get(s) ?? '?'));
  const paysGold = gives.includes('gold');
  console.log(`${paysGold ? '   ' : '!! '}${name.padEnd(9)} gives [${gives.join(', ')}]`);
  if (!paysGold) for (const o of scaled) console.log(`        ${o.id} (${o.pay}): ${o.text}`);
}

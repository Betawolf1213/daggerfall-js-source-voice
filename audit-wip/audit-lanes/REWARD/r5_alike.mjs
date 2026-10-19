// The flagship pin (ql1_sheets.test.js) holds each flagship quest's non-failure outcomes to "pay differently" by their
// pay NAME. The pay's EFFECT is what a player gets: a `lesser` outcome on a script that pays no gold is `standard`'s
// effect (scaleGold touches gold alone). Read with the patched source (the switch on), as the game reads it.
import { SNAP } from './_env.mjs';
const { classicRows, baseText, questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { PAY_PROFILES } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
loadTables();
const set = new Set();
for (const r of classicRows()) {
  const text = baseText(r.name) ?? '';
  const qbn = text.slice(Math.max(0, text.search(/^\s*QBN:/im)));
  if (/^\s*prompt /im.test(qbn) || (r.minReq >= 4 && r.minReq < 10) || r.flag === '1') set.add(r.name.toUpperCase());
}
let alikeByEffect = [];
for (const name of [...set].sort()) {
  const sheet = SHEETS.get(name);
  const lines = questSource(name, true) ?? [];
  const kinds = new Map();
  for (const l of lines) { const m = /^\s*Item\s+(\S+)\s+(\S+)/.exec(l); if (m) kinds.set(m[1], m[2]); }
  const paysGold = lines.some((l) => { const m = /^\s*give pc\s+(\S+)/.exec(l); return m && kinds.get(m[1]) === 'gold'; });
  const outs = (sheet.outcomes ?? []).filter((o) => !o.failure);
  const byName = new Set(outs.map((o) => JSON.stringify([o.pay, o.standing ?? {}, o.legal ?? 0])));
  const eff = (o) => { const p = PAY_PROFILES[o.pay]; return JSON.stringify([paysGold ? p.gold : 1, p.gear, p.step, o.standing ?? {}, o.legal ?? 0]); };
  const byEffect = new Set(outs.map(eff));
  if (byName.size >= 2 && byEffect.size < 2) alikeByEffect.push(`${name} (script pays gold: ${paysGold}) ${outs.map((o) => `${o.id}:${o.pay}`).join(' ')}`);
}
console.log('flagship quests:', set.size);
console.log('pass the pin by name, but every non-failure outcome pays the SAME in effect:', alikeByEffect.length);
for (const r of alikeByEffect) console.log('  ', r);

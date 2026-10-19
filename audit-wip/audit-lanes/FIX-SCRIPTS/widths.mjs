// The centred lines of every questline script, measured: raw, and with each macro at a typical expanded length
// (a building 22, a town 14, a person 18, a foe's name 16, %pcn 16, %pcf 8, gold 3) - DFU's own centred lines are p95 48,
// p99 62 raw (12,925 lines of vendor/dfu-quests).
import { readFileSync, readdirSync } from 'node:fs';
const SNAP = '/home/user/daggerfall-js-source';
const dir = SNAP + '/src/systems/questlines/quests/';
const rows = [];
for (const f of readdirSync(dir).sort()) {
  const text = readFileSync(dir + f, 'utf8');
  const qbn = text.slice(text.search(/^QBN:/m));
  const kinds = {};
  for (const m of qbn.matchAll(/^\s*(Item|Person|Place|Foe|Clock)\s+_([a-zA-Z0-9]+)_/gm)) kinds[m[2]] = m[1];
  const qrc = text.slice(0, text.search(/^QBN:/m));
  let id = null;
  for (const line of qrc.split(/\r?\n/)) {
    const h = /^(?:Message:\s*(\d+)|[A-Za-z]+:\s*\[(\d+)\])/.exec(line); if (h) id = h[1] ?? h[2];
    if (!line.startsWith('<ce>')) continue;
    const raw = line.replace(/^<ce>\s*/, '');
    const est = raw
      .replace(/___([a-zA-Z0-9]+)_/g, 'R'.repeat(14))
      .replace(/__([a-zA-Z0-9]+)_/g, (_, s) => (kinds[s] === 'Person' ? 'B'.repeat(22) : 'T'.repeat(14)))
      .replace(/=([a-zA-Z0-9]+)_/g, 'N'.repeat(16))
      .replace(/_([a-zA-Z0-9]+)_/g, (_, s) => (s === 'gold' ? '999' : kinds[s] === 'Place' ? 'B'.repeat(22) : kinds[s] === 'Person' ? 'P'.repeat(18) : kinds[s] === 'Foe' ? 'F'.repeat(12) : 'I'.repeat(12)))
      .replace(/%pcn/g, 'N'.repeat(16)).replace(/%pcf/g, 'N'.repeat(8));
    rows.push({ f, id, raw: raw.length, est: est.length, line: raw });
  }
}
const over = rows.filter((r) => r.est > 55).sort((a, b) => b.est - a.est);
console.log(`centred lines: ${rows.length}; raw max ${Math.max(...rows.map((r) => r.raw))}; est > 55: ${over.length}`);
for (const r of over) console.log(`${r.f} ${r.id} raw=${r.raw} est=${r.est} | ${r.line}`);

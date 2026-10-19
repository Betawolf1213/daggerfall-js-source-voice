// FIX-PATCH: every SHIPPED patch whose keep answer gates a DFU task (the reward task) - which other DFU tasks read that
// task in a `when` (lost on the alt path unless the patch gives the alt path its own copy)?
import { QL_PATCHES } from '/home/user/daggerfall-js-source/src/systems/questlines/qlPatches.js';
import { baseText, questSource } from '/home/user/daggerfall-js-source/test/qlSources.mjs';
console.warn = () => {};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const name of QL_PATCHES.keys()) {
  const base = baseText(name).replace(/\r\n?/g, '\n');
  const on = questSource(name, true).join('\n');
  // the reward tasks: `X task:\n\twhen _qlkeep_` in the patched text, or `start task X` under a _qlkeep..._ path
  const gated = new Set();
  for (const m of on.matchAll(/^(_[A-Za-z0-9.]+_) task:\n\s*when _qlkeep_\s*$/gm)) gated.add(m[1]);
  for (const m of on.matchAll(/^_qlkeeppath_ task:\n\s*when _qlkeep_\n\s*start task (_[A-Za-z0-9.]+_)/gm)) gated.add(m[1]);
  for (const m of on.matchAll(/set (_[A-Za-z0-9.]+_)\s*$/gm)) if (/_ql/.test(m[1])) {}
  const out = [];
  for (const r of gated) {
    const re = new RegExp(`(^|[^A-Za-z0-9_.])${esc(r)}($|[^A-Za-z0-9_.])`);
    const tasks = base.split(/\n(?=_[A-Za-z0-9.]+_ task:|variable |[A-Za-z]+ _S\.\d+_)/);
    for (const t of tasks) {
      const head = /^(_[A-Za-z0-9.]+_) task:/.exec(t)?.[1];
      if (!head || head === r) continue;
      const lines = t.split('\n').slice(1).map((l) => l.trim()).filter(Boolean);
      const readers = lines.filter((l) => /^when\b/.test(l) && re.test(l));
      if (readers.length) out.push(`${head} [${readers.join(' | ')}] -> ${lines.filter((l) => !/^when\b/.test(l)).join(' / ')}`);
    }
  }
  console.log(`${name}: gated ${[...gated].join(',') || '-'}${out.length ? '\n   READERS: ' + out.join('\n   READERS: ') : ''}`);
}

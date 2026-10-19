// FIX-PATCH BRANCH-8: every patch message's rows (centred) and every choice label, with their lengths.
import { QL_PATCHES } from '/home/user/daggerfall-js-source/src/systems/questlines/qlPatches.js';
const lower = (s) => [...s].reduce((w, c) => w + (c === ' ' ? 4 : 3), 0);
let overRow = 0, overLabel = 0;
for (const [name, ps] of QL_PATCHES) {
  const text = ps.map((p) => p.new).join('\n');
  const choiceIds = new Set([...text.matchAll(/\bask \d+ choices ((?:\d+ _[^\s]+_\s*)+)/g)].flatMap((m) => [...m[1].matchAll(/(\d+) _/g)].map((x) => +x[1])));
  let id = null, rows = [];
  const flush = () => {
    if (id == null) return;
    if (choiceIds.has(id)) { const l = rows.join(' ').trim(); const bad = l.length > 30 || lower(l) > 138; if (bad) overLabel++; console.log(`${bad ? 'LABEL!' : 'label '} ${name} ${id} [${l.length}] ${l}`); }
    else for (const r of rows) { const t = r.replace(/<ce>\s*/, '').trim(); const bad = t.length > 50 || lower(t) > 300; if (bad) overRow++; console.log(`${bad ? 'ROW!  ' : 'row   '} ${name} ${id} [${t.length}] ${t}`); }
  };
  for (const l of text.split('\n')) {
    const m = /^Message:\s+(\d+)/.exec(l);
    if (m) { flush(); id = +m[1]; rows = []; continue; }
    if (!l.trim()) { flush(); id = null; rows = []; continue; }
    if (id != null) rows.push(l);
  }
  flush();
}
console.log(`rows over: ${overRow}, labels over: ${overLabel}`);

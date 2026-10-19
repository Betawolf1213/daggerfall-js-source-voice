// ACTS lane check 7: a guest account and the Professions - the only producers of `ore-mined` (mineHost) and
// `piece-crafted` (profBook) answer a guest nothing, so The Court Crafter's QLIP02/QLIP03 (online lines, which a guest's
// session runs: questlineHost.js serviceReady reads any stored session) can never move for one.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { standService } = await import(`${SNAP}/test/accountDb.mjs`);
const S = await standService({ PROFESSIONS_OPEN: 'on' });
const g = await S.guest();
for (const [path, body] of [['/v1/prof/state', { character: 'char-g' }], ['/v1/prof/craft', { character: 'char-g', recipe: 'stew:north', clean: false, rid: 'p000000000000000000000001' }]]) {
  const r = await S.call(path, body, g.secret);
  console.log('guest', path, '->', r.status, JSON.stringify(r.body));
}

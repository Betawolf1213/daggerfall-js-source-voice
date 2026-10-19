// ACTS lane repro 4: `star-taken` counts a star the service holds now that it did not - so one star taken, given back
// (a refund is free below Renown 10: firmamentLaw.js refundSilver) and taken again counts again. QLIF02 "Take three more
// stars on the Firmament" (`ql act star-taken 3`) is met with ONE star point, toggled. The door is the ql11 test's own.
const SNAP = '/home/user/daggerfall-js-source';
const { createFirmamentBook } = await import(`${SNAP}/src/net/firmament/firmamentBook.js`);
const { setActSink } = await import(`${SNAP}/src/systems/questlines/qlActs.js`);
const { refundSilver } = await import(`${SNAP}/src/net/firmament/firmamentLaw.js`);

const heard = [];
setActSink((kind, n) => { heard.push([kind, n]); return 1; });
let tree = '';
const answer = (t) => ({ ok: true, data: { tree: t, renown: 5, stars: 4, craft: 0, ranks: {}, refund: { freeBelow: 10, perStar: 10 } } });
const door = { account: () => 'acct-1', state: async () => answer(tree), set: async (_c, t) => { tree = t; return answer(t); } };
let n = 0;
const b = createFirmamentBook({ door, character: () => 'char-1', rid: () => `fql11probe${String(++n).padStart(4, '0')}` });
await b.read();
console.log('refund of one star at Renown 5 costs', refundSilver(1, 5), 'silver');
for (let i = 0; i < 3; i++) {
  await b.commit({ start: 'wr.start', keys: ['wr.s1'] });   // the star taken
  await b.commit({ start: 'wr.start', keys: [] });          // and given back
}
console.log('stars held now:', JSON.stringify(b.state.tree?.keys), ' acts heard:', JSON.stringify(heard), ' total star-taken =', heard.reduce((s, [, k]) => s + k, 0));

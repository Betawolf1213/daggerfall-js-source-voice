// FIX-ACTS repro 4b (ACTS-5's second half): a change whose answer was lost (the service landed it, the answer never came)
// is kept and re-sent by read() through door.set - the stars it took are counted by no one.
const SNAP = '/home/user/daggerfall-js-source';
const { createFirmamentBook } = await import(`${SNAP}/src/net/firmament/firmamentBook.js`);
const { setActSink } = await import(`${SNAP}/src/systems/questlines/qlActs.js`);
const heard = [];
setActSink((kind, n) => { heard.push([kind, n]); return 1; });
let tree = '', lose = false;
const answer = (t) => ({ ok: true, data: { tree: t, renown: 20, stars: 19, craft: 4, ranks: {}, refund: { freeBelow: 10, perStar: 10 } } });
const door = { account: () => 'acct-1', state: async () => answer(tree), set: async (_c, t) => { tree = t; return lose ? { ok: false, error: 'offline' } : answer(t); } };
const mem = new Map();
const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
let n = 0;
const b = createFirmamentBook({ door, storage, character: () => 'char-1', rid: () => `fql11probe${String(++n).padStart(4, '0')}` });
await b.read();
await b.commit({ start: 'wr.start', keys: ['wr.s1'] });
console.log('the first star, answered:', JSON.stringify(heard));
heard.length = 0; lose = true;
await b.commit({ start: 'wr.start', keys: ['wr.s1', 'wr.s2'] });
console.log('a second, its answer lost (landed on the service):', JSON.stringify(heard), 'kept:', mem.get('firm1.kept'));
lose = false;
await b.read();
console.log('read() re-sends the kept change - held now:', JSON.stringify(b.state.tree.keys), ' acts heard:', JSON.stringify(heard));
// a fresh page (the same device): the kept change re-sent at its first read
heard.length = 0; lose = true;
await b.commit({ start: 'wr.start', keys: ['wr.s1', 'wr.s2', 'wr.g'] });
lose = false;
const b2 = createFirmamentBook({ door, storage, character: () => 'char-1', rid: () => `fql11probe${String(++n).padStart(4, '0')}` });
await b2.read();
console.log('a reload re-sends a third - held now:', JSON.stringify(b2.state.tree.keys), ' acts heard:', JSON.stringify(heard));

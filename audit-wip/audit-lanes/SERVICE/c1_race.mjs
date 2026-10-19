// C1 (clean check): claims racing - twenty at once at every stage - pay the key and the title once.
import { stood, T0 } from './harness.mjs';
const H = await stood();
const { S, at, ql, row } = H;
const me = await S.registered('Racer');
at(T0 + 10);
const first = await Promise.all(Array.from({ length: 20 }, () => ql(me, 'burningDoors', 3)));
console.log('20 racing opens:', JSON.stringify(first.map((r) => r.body).reduce((m, b) => (m[JSON.stringify(b)] = (m[JSON.stringify(b)] ?? 0) + 1, m), {})));
await H.gate(me);
const k0 = row(me).eg_keys;
const both = await Promise.all([...Array.from({ length: 20 }, () => ql(me, 'covensHoard', 2, 'keep')), ...Array.from({ length: 10 }, () => ql(me, 'burningDoors', 3))]);
const tally = both.map((r) => JSON.stringify(r.body)).reduce((m, b) => (m[b] = (m[b] ?? 0) + 1, m), {});
console.log('30 racing claims:', JSON.stringify(tally));
const after = await Promise.all(Array.from({ length: 20 }, () => ql(me, 'covensHoard', 2, 'keep')));
console.log('20 more:', JSON.stringify(after.map((r) => r.body).reduce((m, b) => (m[JSON.stringify(b)] = (m[JSON.stringify(b)] ?? 0) + 1, m), {})));
console.log('keys before', k0, 'after', row(me).eg_keys, 'row', JSON.stringify(row(me)));
H.restore();

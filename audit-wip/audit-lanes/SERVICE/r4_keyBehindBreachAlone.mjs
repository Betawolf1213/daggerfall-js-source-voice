// R4: THE KEY'S GATE IS THE BREACH ALONE, NOT "THE BURNING DOORS WITNESSED WHOLE". A client speaking the route directly
// (its session secret is the page's own) opens burningDoors 3 and covensHoard 2 at once - no line order is held by the
// service - closes ONE plain breach (no rite broken: the Doorwarden is NOT earned), and is paid Covenbane and the Weir
// Key. questlineClaims.js's header, Questlines-Arc.md 10.1 and ql12_lines.test.js's QL13 name say "witnessed whole".
import { stood, T0 } from './harness.mjs';
const H = await stood();
const { S, at, ql, row, steps } = H;
const me = await S.registered('Shortcut');
console.log('a fresh account, nothing done:', JSON.stringify(row(me)));
at(T0 + 10);
console.log('open bD3:', JSON.stringify((await ql(me, 'burningDoors', 3)).body), ' open cH2:', JSON.stringify((await ql(me, 'covensHoard', 2)).body));
at(T0 + 20);
const g = await H.gate(me, 'dealt');   // one breach closed, no rite
console.log('one plain breach closed - recorded:', g.recorded, 'stones', g.stones, ' (keys now', row(me).eg_keys, '- the Spire\'s certain first key)');
console.log('bD3:', JSON.stringify((await ql(me, 'burningDoors', 3)).body));
console.log('cH2 keep:', JSON.stringify((await ql(me, 'covensHoard', 2, 'keep')).body));
console.log('row:', JSON.stringify(row(me)), '- titles bit 2 = covenbane; doorwarden (bit 1) NOT held: the rite step was never opened');
console.log('steps:', JSON.stringify(steps(me).map((s) => [s.line, s.step, !!s.done_at, s.choice])));
H.restore();

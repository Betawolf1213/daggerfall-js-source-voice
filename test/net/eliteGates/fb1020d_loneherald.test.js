// FIELD BUGS 2026-10-20d LONE-HERALD (bible/01-Overview/bugs/Field-Bugs-2026-10-20d.md; bible/11-Multiplayer/Elite-Gates.md
// section 20, "The herald"): A COMPANY OF ONE IS POSTED AS ONE. A player took Redoubt 20 alone and the channel said
// "<name>'s company took Redoubt 20" - the words it gives a company of eight, because a Redoubt's news carried no size. The
// news now carries the company's entrants (`n`, the Descent's count) and the name its post leads with (the opener's; a company
// of one's member, who need not be the opener), the hub's read keeps the size, its reckoning hands it to the post, and the tenth
// Redoubt's post, First of the Spire and a seal's post say a company of one alone. Driven from a breach played to its Court
// (net/eliteGates/egBrain.js), through the hub's read and reckoning (net/eliteGates/egHerald.js), to the words.
import test from 'node:test';
import assert from 'node:assert/strict';
import { egBreachNew, egEnter, egStep, egFall } from '../../../src/net/eliteGates/egBrain.js';
import { egHallOf, egCircleOfHall, EG_SEALED_MS, EG_ARRIVE_MAX_MS } from '../../../src/net/eliteGates/egLaw.js';
import { egRedoubtPost, egFirstPost, egSealPost, egHeraldPost, egHeraldFold, readEgHeraldState, validEgHeraldTell } from '../../../src/net/eliteGates/egHerald.js';
import { egGive8 } from '../../egGive8.mjs';

const T0 = 1_800_000_000_000;
const MIN = 60_000;
const SITE = { px: 1, py: 1, x: 0, y: 0, z: 0, yaw: 0 };

/** A breach of `n` on seed 12345 opened by `acct-0` ("M0"), the members `enter` admitted, standing on Redoubt 10's Court's
 *  arrival plate (Hall 50) a beat after its pull; `fall` the members fallen before the lord does. Its Court's lord felled
 *  20 minutes on (the fight's own flag, as AUDIT EG V's pins fell it): the breach's Redoubt news (`rd`). */
function redoubtTen({ n, enter = Array.from({ length: n }, (_, i) => `acct-${i}`), fall = [] }) {
  const seed = 12345, h = 50;
  let s = seed;
  const rng = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  const co = Array.from({ length: n }, (_, i) => [`acct-${i}`, `M${i}`, i + 1]);
  const B = egBreachNew({ b: '0123456789abcdef', ez: 'z'.repeat(20), s: 'acct-0', o: 'M0', ew: 0, rh: 0, seed, op: T0, co, site: SITE, wg: [] });
  egGive8(seed, [egCircleOfHall(h)]);
  B.pr = '';
  let now = T0 + EG_SEALED_MS + 100;
  for (const sub of enter) assert.equal(egEnter(B, sub, `ord${sub}`.padEnd(20, 'x'), 40, now), null);
  B.h = h; B.sg = 'arrive'; B.wk = now; B.cnt = { left: 30 * MIN, at: 0 }; B.pulledAt = now; B.su = now + EG_ARRIVE_MAX_MS;
  const spec = egHallOf(seed, h, 0);
  const pos = Object.fromEntries(enter.map((sub) => [sub, { x: spec.arrive.x + Number(sub.slice(5)) * 0.5, z: spec.arrive.z }]));
  const step = () => { now += 250; egStep(B, now, enter.filter((sub) => B.mem[sub].alive && pos[sub]).map((sub) => ({ sub, sx: spec.x0 + pos[sub].x, z: pos[sub].z, dead: false, at: now })), rng); };
  for (let k = 0; k < 400 && B.sg !== 'trial'; k++) step();
  assert.equal(B.sg, 'trial', 'Hall 50 woke');
  for (const sub of fall) { egFall(B, sub, now, [], { x: spec.arrive.x, z: spec.arrive.z }); delete pos[sub]; }
  now += 20 * MIN;
  B.F.mem.lordsFell = 1;
  step();
  assert.equal(B.rd, 10, 'Redoubt 10 taken');
  return { B, now: () => now, news: B.hq.find((e) => e.k === 'rd') };
}
/** The posts a breach's news makes: the first company ever's, and another breach's after it (the plain Redoubt post). */
function postsOf({ B, now }) {
  const tell = validEgHeraldTell({ b: B.b, ev: B.hq });
  const st = egHeraldFold(readEgHeraldState(null), tell, { nowMs: now() });
  const again = egHeraldFold({ ...st, q: [] }, { b: 'fedcba9876543210', ev: tell.ev }, { nowMs: now() });
  return [...st.q, ...again.q].filter((p) => p.kind === 'first' || p.kind === 'rd').map((p) => egHeraldPost(p).content);
}

test('LONE-HERALD the director\'s news: a Valkynaz Redoubt\'s news says the company\'s entrants (`n`) - one alone, three, and a pair with one fallen still two (the Descent\'s count, section 20: every member admitted, earning or not) - and leads a company of one with its member\'s name, the opener\'s only when the opener is that member (mutants: the size left off the news; the opener named for a company of one; the living counted, not the entrants)', () => {
  const one = redoubtTen({ n: 1 });
  assert.deepEqual([one.news.n, one.news.o, one.news.by], [1, 'M0', ['M0']]);
  const three = redoubtTen({ n: 3 });
  assert.deepEqual([three.news.n, three.news.o], [3, 'M0']);
  const pair = redoubtTen({ n: 2, fall: ['acct-1'] });
  assert.deepEqual([pair.news.n, pair.news.o, pair.news.by], [2, 'M0', ['M0']], 'a fallen member is still of the company');
  // the opener never stepped in: the one who went is the one the post names
  const theirs = redoubtTen({ n: 2, enter: ['acct-1'] });
  assert.deepEqual([theirs.news.n, theirs.news.o, theirs.news.by], [1, 'M1', ['M1']]);
});

test('LONE-HERALD the posts from a played breach: a company of one\'s First of the Spire and its tenth Redoubt say its member alone; a company of three and a pair with one fallen keep "<opener>\'s company" and every earner\'s name (mutants: the read dropping the size; the fold dropping it from either post; "alone" unsaid)', () => {
  const [first, rd] = postsOf(redoubtTen({ n: 1 }));
  assert.match(first, /^\*\*First of the Spire:\*\* M0 is the first ever to take Redoubt 10 of the Battlespire \(Hall 50\), alone, in 20:0\d\.$/);
  assert.match(rd, /^\*\*M0 took Redoubt 10 of the Battlespire \(Hall 50\) alone\*\* in 20:0\d\.$/);
  assert.match(postsOf(redoubtTen({ n: 2, enter: ['acct-1'] }))[1], /^\*\*M1 took Redoubt 10 of the Battlespire \(Hall 50\) alone\*\* in 20:0\d\.$/, 'the one who went, not the opener');
  const [first3, rd3] = postsOf(redoubtTen({ n: 3 }));
  assert.match(first3, /^\*\*First of the Spire:\*\* M0's company is the first ever to take Redoubt 10 of the Battlespire \(Hall 50\), in 20:0\d - M0, M1 and M2\.$/);
  assert.match(rd3, /^\*\*M0's company took Redoubt 10 of the Battlespire \(Hall 50\)\*\* in 20:0\d\.$/);
  assert.match(postsOf(redoubtTen({ n: 2, fall: ['acct-1'] }))[1], /^\*\*M0's company took Redoubt 10/, 'one left standing of two is still a company');
});

test('LONE-HERALD the words: a company of one by its name, alone - the tenth Redoubt (its start said, as the report\'s Redoubt 20 from a deeper start would be), First of the Spire with no list of one name, a seal lifted; a company of two or more, and news that did not say its size (a room before this relay), as "<opener>\'s company"; a name held to letters, and none said as "Someone" (mutants: an unsaid size read as one; the name taken raw; no name for nobody; "alone" unsaid on First of the Spire or a seal; the list of one name kept)', () => {
  assert.equal(egRedoubtPost({ o: 'Mara', n: 1, w: 20, h: 100, t: 2400, ew: 10 }).content, '**Mara took Redoubt 20 of the Battlespire (Hall 100) alone** in 40:00, from Redoubt 10.');
  assert.equal(egRedoubtPost({ o: 'Mara', n: 1, w: 20, h: 100, t: 7810 }).content, '**Mara took Redoubt 20 of the Battlespire (Hall 100) alone** in 2:10:10.');
  for (const n of [0, 2, 8, undefined]) assert.equal(egRedoubtPost({ o: 'Mac', n, w: 10, h: 50, t: 6680 }).content, '**Mac\'s company took Redoubt 10 of the Battlespire (Hall 50)** in 1:51:20.', `n ${n}`);
  assert.equal(egFirstPost({ o: 'Mara', n: 1, by: ['Mara'], w: 10, h: 50, t: 4660 }).content, '**First of the Spire:** Mara is the first ever to take Redoubt 10 of the Battlespire (Hall 50), alone, in 1:17:40.');
  assert.equal(egFirstPost({ o: 'Mac', n: 2, by: ['Mac', 'Ann'], w: 10, h: 50, t: 6680 }).content, '**First of the Spire:** Mac\'s company is the first ever to take Redoubt 10 of the Battlespire (Hall 50), in 1:51:20 - Mac and Ann.');
  assert.equal(egSealPost({ band: 0, o: 'Mara', n: 1 }).content, '**The way below the Galleries is open.** Mara is the first through, alone.');
  assert.equal(egSealPost({ band: 0, o: 'Mac', n: 3 }).content, '**The way below the Galleries is open.** Mac\'s company is the first through.');
  assert.equal(egRedoubtPost({ o: '**@everyone** <@&1>', n: 1, w: 20, h: 100, t: 59 }).content, '**everyone 1 took Redoubt 20 of the Battlespire (Hall 100) alone** in 0:59.');
  assert.equal(egRedoubtPost({ o: '', n: 1, w: 20, h: 100, t: 59 }).content, '**Someone took Redoubt 20 of the Battlespire (Hall 100) alone** in 0:59.');
  assert.ok(egFirstPost({ o: '@@', n: 1, w: 10, h: 50, t: 1 }).content.startsWith('**First of the Spire:** Someone is the first ever'));
});

test('LONE-HERALD the hub\'s read and reckoning: a Redoubt\'s size is kept from 1 to 8, and read as unsaid (0) when absent or out of shape; the reckoning hands it to the tenth Redoubt, First of the Spire and a seal lifted (mutants: the read dropping the size; any number taken; the fold dropping it from the Redoubt, First of the Spire or the seal)', () => {
  const ev = (i, extra) => ({ i, at: T0, k: 'rd', w: 10, h: 50, t: 6680, o: 'Mara', by: ['Mara'], ...extra });
  const read = validEgHeraldTell({ b: '0123456789abcdef', ev: [ev(1, { n: 1 }), ev(2, { n: 8 }), ev(3, {}), ev(4, { n: 9 }), ev(5, { n: 0 }), ev(6, { n: '1' }), ev(7, { n: 1.5 })] });
  assert.deepEqual(read.ev.map((e) => e.n), [1, 8, 0, 0, 0, 0, 0]);
  // a deploy that opens the Soul Cairn (the hub first heard of the Spire with the Galleries alone open): the first breach
  // through says the seal, then Redoubt 10 is First of the Spire, then another breach's is the plain post - each a company of one
  let st = egHeraldFold(readEgHeraldState(null), { b: '0123456789abcdef', ev: [] }, { nowMs: T0, open: 1 });
  st = egHeraldFold(st, { b: 'aaaaaaaaaaaaaaaa', ev: validEgHeraldTell({ b: 'aaaaaaaaaaaaaaaa', ev: [ev(1, { n: 1, w: 5, h: 25 })] }).ev }, { nowMs: T0, open: 2 });
  st = egHeraldFold(st, validEgHeraldTell({ b: 'bbbbbbbbbbbbbbbb', ev: [ev(1, { n: 1 })] }), { nowMs: T0, open: 2 });
  st = egHeraldFold(st, validEgHeraldTell({ b: 'cccccccccccccccc', ev: [ev(1, { n: 1 })] }), { nowMs: T0, open: 2 });
  assert.deepEqual(st.q.map((p) => [p.kind, p.n]), [['seal', 1], ['first', 1], ['rd', 1]]);
  assert.deepEqual(st.q.map((p) => egHeraldPost(p).content), [
    '**The way below the Galleries is open.** Mara is the first through, alone.',
    '**First of the Spire:** Mara is the first ever to take Redoubt 10 of the Battlespire (Hall 50), alone, in 1:51:20.',
    '**Mara took Redoubt 10 of the Battlespire (Hall 50) alone** in 1:51:20.',
  ]);
  // news from a room before this relay (no size): the company's words, as it was posted
  const old = egHeraldFold(readEgHeraldState(null), validEgHeraldTell({ b: '0123456789abcdef', ev: [ev(1, { w: 20, h: 100 })] }), { nowMs: T0 });
  assert.equal(egHeraldPost(old.q[0]).content, '**Mara\'s company took Redoubt 20 of the Battlespire (Hall 100)** in 1:51:20.');
});

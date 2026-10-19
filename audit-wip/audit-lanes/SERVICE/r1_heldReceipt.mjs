// R1: A RECEIPT FROM BEFORE THE OPENING COUNTS - the witness reads the receipt row's `at`, which every producer writes as
// the CLAIM's second, not the kill's. A kill done days before the step was opened, its receipt held unclaimed and claimed
// after the opening, witnesses the step and pays the title. How far: the receipt's own life (RECEIPT_TTL_S, 7 days).
import { stood, T0 } from './harness.mjs';
const H = await stood();
const { S, at, ql, row, steps } = H;
const DAY = 86_400;
const me = await S.registered('Holder', { character: 'char-0001' });
// the deeds, at T0: the Sea Serpent slain, an Hour broken, a breach closed by a fighter who broke the rite - receipts
// minted now (what the relay hands the client) and NOT claimed yet
const serp = await H.serpentReceipt(me, T0);
const hr = await H.hourReceipt(me, T0);
const gt = await H.gateReceipt(me, 'dealt', 1, T0);
// six days and 23 hours later the lines' steps are opened (the quests begun)
at(T0 + 7 * DAY - 3600);
for (const [l, s] of [['oldCoil', 2], ['hourThatWasNot', 1], ['burningDoors', 2], ['burningDoors', 3]]) console.log('open', l, s, JSON.stringify((await ql(me, l, s)).body));
// then the week-old receipts are claimed
at(T0 + 7 * DAY - 3500);
console.log('serpent claim', JSON.stringify((await H.claimSerpent(me, serp)).recorded));
console.log('hour claim', JSON.stringify((await H.claimHour(me, hr)).recorded));
console.log('gate claim', JSON.stringify((await H.claimGate(me, gt)).recorded));
for (const [l, s] of [['oldCoil', 2], ['hourThatWasNot', 1], ['burningDoors', 2], ['burningDoors', 3]]) console.log('end ', l, s, JSON.stringify((await ql(me, l, s)).body));
console.log('row', JSON.stringify(row(me)));
console.log('kill minted at T0; steps opened at T0+', 7 * DAY - 3600, 's; witnessed:', JSON.stringify(steps(me).map((x) => [x.line, x.step, x.opened_at - T0, x.done_at - T0])));
// the bound: a receipt minted 7 days + 1 s before its claim is refused by its producer
const late = await H.serpentReceipt(me, T0 + 7 * DAY - 3500 - 7 * DAY - 1);
console.log('a receipt older than its TTL:', JSON.stringify((await H.claimSerpent(me, late))));
H.restore();

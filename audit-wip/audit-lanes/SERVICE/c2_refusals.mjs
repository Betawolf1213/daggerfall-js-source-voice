// C2 (clean checks): another account's receipt, a banned account, a guest, forged bodies, the switch's spellings, replay.
import { stood, T0, SNAP } from './harness.mjs';
const { claimQl } = await import(`${SNAP}/server-account/src/questlines.js`);
const H = await stood();
const { S, at, ql, row, steps, raw } = H;
const a = await S.registered('Alice'), b = await S.registered('Bob');
at(T0 + 10);
await ql(b, 'burningDoors', 3);
// Alice's receipt carried by Bob
console.log("another account's receipt:", JSON.stringify(await H.claimGate(b, await H.gateReceipt(a))));
console.log('Bob witnessed by it?', JSON.stringify((await ql(b, 'burningDoors', 3)).body));
// Alice's receipt claimed by Alice does not witness Bob
await H.gate(a);
console.log('Bob after Alice\'s own claim:', JSON.stringify((await ql(b, 'burningDoors', 3)).body));
// a banned account
raw.prepare('UPDATE players SET banned_until = ? WHERE id = ?').run(T0 + 99999, b.id);
console.log('banned:', JSON.stringify(await ql(b, 'burningDoors', 3)));
raw.prepare('UPDATE players SET banned_until = 0 WHERE id = ?').run(b.id);
// forged bodies
for (const body of [{ line: 'burningDoors', step: 3, choice: 'keep'.repeat(5) }, { line: 'constructor', step: 0 }, { line: 'covensHoard', step: 2.0000001 }, { line: 'covensHoard', step: 2, choice: ['keep'] }, { line: 'covensHoard', step: 2, extra: 1, choice: 'keep' }, [1, 2]])
  console.log('body', JSON.stringify(body), '->', JSON.stringify(await S.call('/v1/ql/claim', body, a.secret)));
// the switch's spellings fail closed
for (const v of ['ON', ' on', 'true', '1', 'Dev']) console.log(`QUESTLINES_OPEN=${JSON.stringify(v)} ->`, JSON.stringify(await claimQl({ db: S.env.DB, env: { QUESTLINES_OPEN: v, DEVELOPER_HANDLES: 'Alice' } }, { id: a.id, handle: 'Alice' }, { line: 'burningDoors', step: 3 }, T0)));
// replay: a receipt claimed twice writes one row
const rc = await H.gateReceipt(a);
console.log('replay:', (await H.claimGate(a, rc)).recorded, (await H.claimGate(a, rc)).recorded);
console.log('rows', raw.prepare('SELECT COUNT(*) n FROM ql_steps').get().n, JSON.stringify(row(a)), JSON.stringify(row(b)));
H.restore();

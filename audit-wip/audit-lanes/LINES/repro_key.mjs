// REPRO (the real Worker over node:sqlite, test/accountDb.mjs): QLCH03's `keep` - "Ysolde slides the key across the
// table to you" - pays nothing of the script's own (`ql paid`, no gold); its reward is the service's Weir Key, and the
// service keeps ONE `ql_steps` row an ACCOUNT (not a character) whose first `choice` stands. So on an account whose first
// character SEALED the key, every later character who keeps it is paid no key, no gold - and is told the key is theirs.
import { readFileSync } from 'node:fs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { standService, T0 } = await import(SNAP + '/test/accountDb.mjs');
const { mintReceipt } = await import(SNAP + '/src/net/gate/gateReceipt.js');
const { subtle } = globalThis.crypto;
let clockMs = T0 * 1000;
Date.now = () => clockMs;
const S = await standService({ QUESTLINES_OPEN: 'on' });
const nowS = () => Math.floor(clockMs / 1000);
const me = await S.registered('Keyless');
const ql = async (line, step, choice) => (await S.call('/v1/ql/claim', { line, step, ...(choice ? { choice } : {}) }, me.secret)).body;
const gate = async (x, r) => (await S.call('/v1/gate/claim', { receipt: await mintReceipt({ d: 800 + Math.floor(clockMs / 1e6), b: 'ruhn', s: me.id, c: 4242, x, ...(r ? { r } : {}) }, S.gatePriv, { subtle, nowS: nowS() }) }, me.secret)).body;
// CHARACTER ONE walks the Burning Doors (the rite's and the breach's steps opened, then witnessed)
clockMs += 1000; await ql('burningDoors', 2); clockMs += 1000; await gate('dealt', 1); clockMs += 1000;
console.log('char 1 burningDoors 2:', JSON.stringify(await ql('burningDoors', 2, 'broken')));
clockMs += 90_000_000; await ql('burningDoors', 3); clockMs += 1000; await gate('dealt'); clockMs += 1000;
console.log('char 1 burningDoors 3:', JSON.stringify(await ql('burningDoors', 3, 'closed')));
// ...and the Covens' Hoard, SEALING the key
clockMs += 1000; await ql('covensHoard', 2); clockMs += 1000;
console.log('char 1 covensHoard 2 (seal):', JSON.stringify(await ql('covensHoard', 2, 'seal')));
// CHARACTER TWO, the same account, walks both lines and KEEPS the key ("Ysolde slides the key across the table to you")
clockMs += 1000; await ql('covensHoard', 2); clockMs += 1000;
console.log('char 2 covensHoard 2 (keep):', JSON.stringify(await ql('covensHoard', 2, 'keep')));
const row = S.env.DB._raw.prepare('SELECT eg_keys, ql_key FROM players WHERE id = ?').get(me.id);
const step = S.env.DB._raw.prepare("SELECT choice FROM ql_steps WHERE account = ? AND line = 'covensHoard' AND step = 2").get(me.id);
console.log('account row:', JSON.stringify({ ...row }), ' the step\'s choice:', step.choice);
const script = readFileSync(SNAP + '/src/systems/questlines/quests/QLCH03.txt', 'utf8');
console.log('QLCH03 keep path:', script.match(/_keepway_ task:[\s\S]*?end quest/)[0].replace(/\s+/g, ' '));

// The ql12_claim.test.js harness, lifted: the snapshot's real Worker over node:sqlite (test/accountDb.mjs) with every
// migration, the clock under our hand, and each receipt minted by its own producer and claimed through its own route.
import { standService, T0 } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/test/accountDb.mjs';
import { mintReceipt } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/src/net/gate/gateReceipt.js';
import { mintEgReceipt } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/src/net/eliteGates/egReceipt.js';
import { mintSdReceipt } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/src/net/superDungeon/sdReceipt.js';
import { mintSerpentReceipt } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/src/net/serpent/serpentReceipt.js';
export { T0 };
export const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { subtle } = globalThis.crypto;
const realNow = Date.now;
export async function stood(extra = {}) {
  let clock = T0 * 1000;
  Date.now = () => clock;
  const S = await standService({ QUESTLINES_OPEN: 'on', ...extra });
  const raw = S.env.DB._raw;
  const now = () => Math.floor(clock / 1000);
  const at = (s) => { clock = s * 1000; };
  const ql = async (who, line, step, choice) => (await S.call('/v1/ql/claim', { line, step, ...(choice !== undefined ? { choice } : {}) }, who.secret));
  let day = 600, slot = 7, rq = 0, sday = 363;
  /** a gate receipt MINTED at `mintedAt` (the kill) - claimed when this is called (the row's `at`) */
  const gateReceipt = (who, x = 'dealt', r, mintedAt = now()) => mintReceipt({ d: day++, b: 'ruhn', s: who.id, c: 4242, x, ...(r ? { r } : {}) }, S.gatePriv, { subtle, nowS: mintedAt });
  const claimGate = async (who, receipt) => (await S.call('/v1/gate/claim', { receipt }, who.secret)).body;
  const gate = async (who, x = 'dealt', r) => claimGate(who, await gateReceipt(who, x, r));
  const breach = async (who, rh = 0) => {
    const o = (await S.call('/v1/eg/open', { rq: `rq${String(++rq).padStart(16, '0')}`, ...(rh ? { rh: 1 } : {}) }, who.secret)).body;
    raw.prepare('UPDATE players SET eg_live_b = NULL, eg_live_until = 0 WHERE id = ?').run(who.id);
    return { b: o.b, ez: o.ez, rh, o };
  };
  const redoubt = async (who, br, w) => {
    const receipt = await mintEgReceipt({ q: 'w', b: br.b, s: who.id, z: br.ez, c: 77 + w, w, h: w * 5, t: 900, n: 1, ew: 0, l: 12, ...(br.rh ? { rh: 1 } : {}) }, S.gatePriv, { subtle, nowS: now() });
    return (await S.call('/v1/eg/claim', { receipt }, who.secret)).body;
  };
  const hourReceipt = (who, mintedAt = now()) => mintSdReceipt({ d: slot++, s: who.id, c: 1, x: 'dealt', l: 30 }, S.gatePriv, { subtle, nowS: mintedAt });
  const claimHour = async (who, receipt) => (await S.call('/v1/sd/claim', { receipt }, who.secret)).body;
  const serpentReceipt = (who, mintedAt = now(), d = sday++) => mintSerpentReceipt({ d, b: 'sethrakul', s: who.id, c: 99, x: 'dealt', h: 4, l: 20 }, S.gatePriv, { subtle, nowS: mintedAt });
  const claimSerpent = async (who, receipt) => (await S.call('/v1/serpent/claim', { receipt, character: 'char-0001', name: who.handle }, who.secret)).body;
  const row = (who) => ({ ...raw.prepare('SELECT eg_keys, ql_titles, ql_key FROM players WHERE id = ?').get(who.id) });
  const steps = (who) => raw.prepare('SELECT line, step, opened_at, done_at, choice FROM ql_steps WHERE account = ? ORDER BY line, step').all(who.id).map((r) => ({ ...r }));
  const restore = () => { Date.now = realNow; };
  return { S, raw, at, now, ql, gateReceipt, claimGate, gate, breach, redoubt, hourReceipt, claimHour, serpentReceipt, claimSerpent, row, steps, restore };
}

// WALLET-WEIGHT (2026-10-19, from play: "Are these supposed to be weighing us down even in the wallet? ... If this isn't a
// bug, it might be prudent to list the total weight of the wallet up top as the wallet's weight"): THE WALLET SAYS WHAT
// IT HOLDS WEIGHS. The pieces it holds weigh what they always did (WALLET1: an organizer, never a second list - 309
// Welkynd Shards are 30.9 kg of the carry weight), but the enhanced pack had moved them off its pages into the wallet's
// sheet, and the wallet's own row and card said its own weight - none. Now the wallet's row and card say its own and what
// it holds (enhancedInventory.js shownKg), and each holding's ledger row says its own (walletItem.js walletLedger's
// `weight`); the carry weight is untouched, each piece counted once, and the classic box's words stand. The record:
// bible/06-Systems/Wallet.md WALLET-WEIGHT.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mintWallet, walletContents, walletLedger, walletLines, walletKg, setWalletSilver, _resetWalletForTests } from '../../src/systems/walletItem.js';
import { letterOfCredit, carriedWeight } from '../../src/systems/inventory.js';
import { sigilStone, welkyndShards } from '../../src/systems/gate/gateSpoils.js';
import { mountEnhancedInventory } from '../../src/ui/enhanced/enhancedInventory.js';
import { ENHANCED_CSS } from '../../src/ui/enhanced/enhancedStyle.js';
import { withDom } from '../invdrag.mjs';

// the report's own pack: 309 shards, 39 embers, and letters - every piece from its producer
const pack = () => {
  const shards = welkyndShards(309);
  const embers = Object.assign(sigilStone(), { stackCount: 39 });
  const letters = [letterOfCredit(5000), letterOfCredit(7000)];
  const e = { name: 'Aelwyn', stats: { strength: 50 }, goldPieces: 100, items: [] };
  e.items = [letters[0], embers, mintWallet(), shards, letters[1]];
  return { e, shards, embers, letters };
};

test('WALLET-WEIGHT what it holds weighs: each holding\'s weight, the encumbrance\'s own (a stack its count of its row\'s weight), and all of them - exactly what the carry weight counts for them; the ledger says a holding\'s weight on its row, none for an empty one or the coin; the classic box\'s words stand (mutants: no total; every holding weighing all of them; no row\'s weight; the figure\'s places)', () => {
  const { e } = pack();
  const worn = Object.assign(sigilStone(), { equipSlot: 6 });   // a worn crystal is the doll's, not the wallet's
  e.items.push(worn);
  const c = walletContents(e.items, e, { silver: 2958 });
  assert.deepEqual(Object.entries(c.weights).map(([k, kg]) => [k, walletKg(kg)]), [['letters', '0.50 kg'], ['embers', '9.75 kg'], ['shards', '30.90 kg']]);
  assert.ok(Math.abs(c.weight - 41.15) < 1e-9, `all of it: ${c.weight}`);
  const bare = { ...e, items: e.items.filter((it) => !c.held.includes(it)) };
  assert.ok(Math.abs(carriedWeight(e) - carriedWeight(bare) - c.weight) < 1e-9, 'what the carry weight counts for the pieces it holds, once');
  assert.deepEqual(walletLedger(c).flatMap((p) => p.rows).map((r) => [r.key, r.weight]),
    [['gold', null], ['silver', null], ['letters', '0.50 kg'], ['embers', '9.75 kg'], ['shards', '30.90 kg']]);
  const empty = walletContents([mintWallet()], { goldPieces: 0 }, { silver: null, here: false });
  assert.deepEqual([empty.weight, ...walletLedger(empty).flatMap((p) => p.rows).map((r) => r.weight)], [0, null, null, null, null, null], 'none held: none weighed, no row says a weight');
  assert.deepEqual(walletLines(c), ['Your wallet holds:', 'Gold: 100', 'Silver: 2,958', 'Letters of credit: 2, worth 12,000 gold', 'Deadlands Embers: 39', 'Welkynd Shards: 309'], 'the classic box: its words as they were');
  assert.deepEqual([walletKg(0), walletKg(0.1 * 309), walletKg(400)], ['0.00 kg', '30.90 kg', '400.00 kg']);
});

test('WALLET-WEIGHT the pack: the wallet\'s row and its card say what it holds weighs, its sheet a holding\'s weight beside its name, a piece it holds its own weight on its own card - and the carry weight counts each piece once (mutants: the card\'s own weight; the row\'s own weight; the sheet\'s weights undrawn)', () => {
  setWalletSilver(null);
  withDom((dom) => {
    const host = dom.mk('div'); dom.body.append(host);
    const { e } = pack();
    const view = mountEnhancedInventory(host, { entity: e, items: () => e.items, onExit: () => {} });
    const text = (n) => [n.textContent, ...n.children.map(text)].join(' ');
    const press = (re, within = host) => { const b = within.querySelectorAll('button').find((x) => re.test(text(x))); assert.ok(b, `a button ${re}`); b.onclick({}); };
    const cardWeight = () => host.querySelector('.packdetail').querySelectorAll('.pair').find((g) => g.children[0].textContent === 'Weight')?.children[1].textContent;
    press(/^\s*Valuables/);
    const row = host.querySelectorAll('.itemrow').find((r) => /Wallet/.test(text(r)));
    assert.equal(row.querySelector('.itemwt').textContent, '41.15 kg', 'the wallet\'s row: what it holds');
    press(/Wallet/);
    assert.equal(cardWeight(), '41.15 kg', 'the wallet\'s card, up top: what it holds');
    const sheet = host.querySelector('.walletsheet');
    const rows = sheet.querySelectorAll('.wallet-row');
    assert.deepEqual(rows.map((r) => [r.dataset.key, r.children.map((c) => c.className), r.children[0].textContent]), [
      ['gold', ['wallet-k', 'wallet-v'], 'Gold'], ['silver', ['wallet-k', 'wallet-v why'], 'Silver'], ['letters', ['wallet-k', 'wallet-v'], 'Letters of credit'],
      ['embers', ['wallet-k', 'wallet-v'], 'Deadlands Embers'], ['shards', ['wallet-k', 'wallet-v'], 'Welkynd Shards'],
    ], 'the ledger\'s rows as they were, a label and a figure');
    assert.deepEqual(rows.map((r) => r.children[0].querySelectorAll('.wallet-kg').map((k) => [k.tagName, k.textContent])),
      [[], [], [['SMALL', '0.50 kg']], [['SMALL', '9.75 kg']], [['SMALL', '30.90 kg']]], 'a holding\'s weight beside its name, the coin none');
    const carry = host.querySelectorAll('.k').find((k) => k.textContent === 'Carry Weight');
    assert.match(carry.parent.children[1].textContent, /^41 \//, 'the carry weight: 41.15 kg and the purse\'s 0.25, each piece once');
    press(/Welkynd Shard/, sheet);
    assert.equal(cardWeight(), '30.90 kg', 'a piece it holds: its own weight');
    view.unmount();
  });
  _resetWalletForTests();
  withDom((dom) => {
    const host = dom.mk('div'); dom.body.append(host);
    const e = { name: 'Aelwyn', stats: { strength: 50 }, goldPieces: 0, items: [mintWallet()] };
    const view = mountEnhancedInventory(host, { entity: e, items: () => e.items, onExit: () => {} });
    const text = (n) => [n.textContent, ...n.children.map(text)].join(' ');
    host.querySelectorAll('button').find((x) => /^\s*Valuables/.test(text(x))).onclick({});
    const row = host.querySelectorAll('.itemrow').find((r) => /Wallet/.test(text(r)));
    assert.equal(row.querySelector('.itemwt').textContent, '0.00 kg', 'an empty wallet weighs nothing');
    view.unmount();
  });
  _resetWalletForTests();
  assert.match(ENHANCED_CSS, /\.pack-shell \.walletsheet \.wallet-kg \{ margin-left: 8px; font-size: 12px; opacity: 0\.75;/);
});

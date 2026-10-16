// CONTAINER-PEEK - the plaque lists a cupboard's contents when the list
// already exists, and stays a name until it does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { containerPreviewItems, decorPreviewItems, interiorHeldPreview } from '../src/systems/containerPreview.js';

const ruby = { name: 'Ruby' };
const chest = (items, stockedDate = 5) => ({ items, stockedDate });

test('CONTAINER-PEEK: the player\'s own cupboard lists what it holds, a stranger\'s only once it is stocked today', () => {
  const boxes = [chest([ruby], 1)];
  assert.deepEqual(containerPreviewItems('container:0', boxes, { owned: true, today: 9 }), [ruby]);
  assert.equal(containerPreviewItems('container:0', boxes, { owned: false, today: 9 }), null, 'stockedDate 1 is stale for a stranger');
  const stocked = [chest([ruby], 9)];
  assert.deepEqual(containerPreviewItems('container:0', stocked, { owned: false, today: 9 }), [ruby]);
  assert.equal(containerPreviewItems('container:0', stocked, { owned: false, today: 10 }), null, 'a new day replaces the list on the press, so the plaque does not show yesterday\'s');
  assert.equal(containerPreviewItems('container:0', [{ items: null, stockedDate: 9 }], { owned: false, today: 9 }), null);
  assert.equal(containerPreviewItems('container:0', stocked, { shut: true, today: 9 }), null, 'somebody else\'s home');
  assert.equal(containerPreviewItems('container:0', stocked, { hall: true, owned: false, today: 9 }), null, 'a hall\'s cupboard opens the Stores chest');
  assert.equal(containerPreviewItems('door:1', stocked, { owned: true }), null);
  assert.equal(containerPreviewItems('container:3', stocked, { owned: true }), null, 'no such container');
});

test('CONTAINER-PEEK: a placed chest lists what it holds, and a chair is never asked', () => {
  let asked = 0;
  const bag = {
    pieceOf: (id) => (id === 'bin' ? { storage: true } : { storage: false }),
    itemsOf: (id) => { asked += 1; return id === 'bin' ? [ruby] : []; },
  };
  assert.equal(decorPreviewItems('decor:chair', bag), null);
  assert.equal(asked, 0, 'a chair is not a container');
  assert.deepEqual(decorPreviewItems('decor:bin', bag), [ruby]);
  assert.equal(asked, 1);
  assert.equal(decorPreviewItems('decor:bin', { ...bag, shut: true }), null);
  assert.equal(asked, 1, 'somebody else\'s chest is not read');
});

test('CONTAINER-PEEK: the interior reader answers one family and leaves the piles alone', () => {
  const bag = { containers: [chest([ruby], 9)], owned: false, today: 9, pieceOf: () => null, itemsOf: () => [] };
  assert.deepEqual(interiorHeldPreview('container:0', bag), [ruby]);
  assert.equal(interiorHeldPreview('loot:0', bag), null);
  assert.equal(interiorHeldPreview('droppedLoot:1', bag), null);
});

test('CONTAINER-PEEK: the interior host hands the reader to the plaque', () => {
  const wm = readFileSync(new URL('../src/scenes/worldModes.js', import.meta.url), 'utf8');
  assert.match(wm, /interiorHeldPreview\(key,/);
});

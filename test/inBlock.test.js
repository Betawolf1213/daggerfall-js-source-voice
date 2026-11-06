// test/inBlock.test.js — QAE3 in-block pixel math.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RMB_DIMENSION, GLOBAL_SCALE, NATIVE_PER_PIXEL, blockOriginNative, inBlockPixelNative, inBlockPixel } from '../src/systems/quest/inBlock.js';

test('blockOriginNative floors to the block grid', () => {
  assert.deepEqual(blockOriginNative(0, 0), { x: 0, z: 0 });
  assert.deepEqual(blockOriginNative(4095, 4095), { x: 0, z: 0 });
  assert.deepEqual(blockOriginNative(4096, 4096), { x: 4096, z: 4096 });
  assert.deepEqual(blockOriginNative(5000, -100), { x: 4096, z: -4096 });
});

test('inBlockPixelNative maps to 0..128', () => {
  assert.deepEqual(inBlockPixelNative(0, 0), { x: 0, y: 0 });
  assert.deepEqual(inBlockPixelNative(32, 32), { x: 1, y: 1 });
  assert.deepEqual(inBlockPixelNative(4095, 4095), { x: 127, y: 127 });
});

test('inBlockPixelNative is position-independent across blocks', () => {
  // same offset within two different blocks gives the same pixel
  assert.deepEqual(inBlockPixelNative(64, 64), inBlockPixelNative(4096 + 64, 4096 + 64));
});

test('inBlockPixelNative clamps at 128', () => {
  const p = inBlockPixelNative(4096, 4096); // exactly on boundary
  assert.ok(p.x <= 128 && p.y <= 128);
});

test('inBlockPixel converts scene metres to native', () => {
  // 32 native units = 0.8 m -> pixel 1
  const p = inBlockPixel([32 * GLOBAL_SCALE, 0, 32 * GLOBAL_SCALE]);
  assert.deepEqual(p, { x: 1, y: 1 });
});

test('inBlockPixel returns null for missing position', () => {
  assert.equal(inBlockPixel(null), null);
  assert.equal(inBlockPixel([null, 0, 0]), null);
});

test('NATIVE_PER_PIXEL is 32', () => {
  assert.equal(NATIVE_PER_PIXEL, 32);
  assert.equal(RMB_DIMENSION, 4096);
});

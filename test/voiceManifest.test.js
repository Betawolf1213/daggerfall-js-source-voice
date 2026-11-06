// test/voiceManifest.test.js — Q4 voice manifest parsing and lookup.
import test from 'node:test';
import assert from 'node:assert/strict';
import { voiceKey, parseManifest, hasVoice, getVoiceLine, defaultManifest } from '../src/systems/quest/voiceManifest.js';

test('voiceKey joins quest and msgId', () => {
  assert.equal(voiceKey('_TUTOR___', 1000), '_TUTOR___:1000');
});

test('parseManifest builds a lookup map', () => {
  const m = parseManifest(defaultManifest());
  assert.equal(m.name, 'default');
  assert.equal(m.version, 1);
  assert.equal(m.speakers.length, 1);
  assert.ok(hasVoice(m, '_TUTOR___', 1000));
  assert.equal(getVoiceLine(m, '_TUTOR___', 1000)?.file, 'tut_1000.wav');
});

test('hasVoice returns false for missing entries', () => {
  const m = parseManifest(defaultManifest());
  assert.equal(hasVoice(m, '_MISSING_', 999), false);
});

test('getVoiceLine returns null for missing entries', () => {
  const m = parseManifest(defaultManifest());
  assert.equal(getVoiceLine(m, '_MISSING_', 999), null);
});

test('duplicate quest+msgId keeps last line', () => {
  const m = parseManifest({
    packName: 'dup',
    lines: [
      { quest: 'Q', msgId: 1, file: 'a.wav' },
      { quest: 'Q', msgId: 1, file: 'b.wav' },
    ],
  });
  assert.equal(getVoiceLine(m, 'Q', 1).file, 'b.wav');
});

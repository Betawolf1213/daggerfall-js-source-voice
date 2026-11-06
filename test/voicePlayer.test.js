// test/voicePlayer.test.js — Q4: voice player unit tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { VoicePlayer, setGlobalVoicePlayer, getGlobalVoicePlayer, playVoiceLine } from '../src/systems/quest/voicePlayer.js';
import { parseManifest } from '../src/systems/quest/voiceManifest.js';

function makeMockAudio(calls = []) {
  return {
    playOneShot(key, vol) { calls.push({ key, vol }); return 1.5; },
    registerSound(key, bytes) { calls.push({ key, bytes: bytes.length }); return true; },
  };
}

test('VoicePlayer.play looks up line and calls audio', () => {
  const log = [];
  const audio = makeMockAudio(log);
  const manifest = parseManifest({
    packName: 'test',
    lines: [
      { quest: 'Q1', msgId: 1010, file: 'q1_1010.wav' },
    ],
  });
  const vp = new VoicePlayer({ audio, manifest });
  const dur = vp.play('Q1', 1010);
  assert.equal(log.length, 1);
  assert.ok(log[0].key.includes('Q1') && log[0].key.includes('1010'));
  assert.equal(dur, 1.5);
});

test('VoicePlayer.play returns undefined when no line exists', () => {
  const audio = makeMockAudio([]);
  const vp = new VoicePlayer({ audio, manifest: parseManifest({ packName: 'empty', lines: [] }) });
  assert.equal(vp.play('Q1', 999), undefined);
});

test('VoicePlayer.play is silent when disabled', () => {
  const log = [];
  const audio = makeMockAudio(log);
  const manifest = parseManifest({
    packName: 'test',
    lines: [{ quest: 'Q1', msgId: 1, file: 'a.wav' }],
  });
  const vp = new VoicePlayer({ audio, manifest });
  vp.setEnabled(false);
  assert.equal(vp.play('Q1', 1), undefined);
  assert.equal(log.length, 0);
});

test('VoicePlayer.register calls audio.registerSound', () => {
  const log = [];
  const audio = makeMockAudio(log);
  const vp = new VoicePlayer({ audio });
  vp.register('Q1', 1, new Uint8Array([1, 2, 3]));
  assert.equal(log.length, 1);
  assert.equal(log[0].bytes, 3);
});

test('global voice player round-trip', () => {
  const vp = new VoicePlayer({});
  setGlobalVoicePlayer(vp);
  assert.equal(getGlobalVoicePlayer(), vp);
  // playVoiceLine delegates to global
  assert.equal(playVoiceLine('Q', 1), undefined); // no audio/manifest
});

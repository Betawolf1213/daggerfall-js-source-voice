// VOICE2 integration tests: verify the game-facing seams (voiceNet, HUD, settings) work correctly.
import test from 'node:test';
import assert from 'node:assert';
import { initVoiceNet, getVoiceNet, frameVoiceNet, destroyVoiceNet } from '../src/net/voiceNet.js';
import { buildVoiceHud } from '../src/ui/voiceHud.js';
import { voiceSettingsRows } from '../src/ui/voiceSettings.js';

test('voiceNet: init and singleton', () => {
  const vc = initVoiceNet({
    mintToken: async () => null,
    audioContext: () => null,
    destination: null,
  });
  assert(vc, 'initVoiceNet returns a client');
  assert.strictEqual(getVoiceNet(), vc, 'getVoiceNet returns the same singleton');
  destroyVoiceNet();
  assert.strictEqual(getVoiceNet(), null, 'getVoiceNet returns null after destroy');
});

test('voiceNet: frame with room/party/position', () => {
  const vc = initVoiceNet({
    mintToken: async () => null,
    audioContext: () => null,
    destination: null,
  });
  frameVoiceNet({
    room: 'cell:1.2',
    party: null,
    position: [100, 0, 200],
    facing: 0,
    peers: [],
  });
  assert.strictEqual(vc.room, 'cell:1.2', 'room is set');
  assert.strictEqual(vc.party, null, 'party is null');
  destroyVoiceNet();
});

test('voiceHud: builds and updates', () => {
  const vc = initVoiceNet({
    mintToken: async () => null,
    audioContext: () => null,
    destination: null,
  });
  const fakeDoc = {
    createElement: (tag) => ({
      className: '',
      setAttribute: () => {},
      innerHTML: '',
      classList: { toggle: () => {} },
      querySelector: () => ({ textContent: '' })
    })
  };
  const { root, update } = buildVoiceHud({ doc: fakeDoc });
  assert(root, 'buildVoiceHud returns an element');
  update(vc.state);
  destroyVoiceNet();
});

test('voiceSettings: builds rows', () => {
  const vc = initVoiceNet({
    mintToken: async () => null,
    audioContext: () => null,
    destination: null,
  });
  const fakeDoc = { createElement: (tag) => ({ className: '', innerHTML: '', querySelector: () => ({ addEventListener: () => {} }) }) };
  const rows = voiceSettingsRows({ doc: fakeDoc });
  assert(Array.isArray(rows), 'voiceSettingsRows returns an array');
  destroyVoiceNet();
});

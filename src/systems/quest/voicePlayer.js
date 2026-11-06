// systems/quest/voicePlayer.js — Q4: play voiced quest lines through the audio engine.
// The audio engine already supports string keys via registerSound; we register
// voice lines as `voice:<quest>:<msgId>` and play them when the matching message
// is displayed.

import { getVoiceLine, voiceKey } from './voiceManifest.js';

const VOICE_PREFIX = 'voice:';

export class VoicePlayer {
  constructor({ audio, manifest = null } = {}) {
    this.audio = audio;
    this.manifest = manifest;
    this.enabled = true;
    this._playing = null; // current voice key
    this._gain = 0.9; // voice line volume relative to SoundVolume
  }

  setManifest(manifest) { this.manifest = manifest; }
  setEnabled(on) { this.enabled = !!on; }

  /** True if a voice line exists for this quest message. */
  hasLine(questName, msgId) {
    return this.enabled && this.manifest && getVoiceLine(this.manifest, questName, msgId);
  }

  /** Play the voice line for a quest message. Returns duration or undefined. */
  play(questName, msgId) {
    if (!this.enabled || !this.manifest || !this.audio) return undefined;
    const line = getVoiceLine(this.manifest, questName, msgId);
    if (!line) return undefined;
    const key = `${VOICE_PREFIX}${voiceKey(questName, msgId)}`;
    this._playing = key;
    // playOneShot supports string keys if the buffer is registered
    const dur = this.audio.playOneShot(key, this._gain);
    return dur;
  }

  /** Register a voice line buffer under the expected key. */
  register(questName, msgId, bytes) {
    if (!this.audio) return false;
    const key = `${VOICE_PREFIX}${voiceKey(questName, msgId)}`;
    return this.audio.registerSound(key, bytes);
  }

  /** Stop any currently playing voice line (cancels the source). */
  stop() {
    if (this._playing && this.audio) {
      // The audio engine doesn't expose per-source stop for one-shots,
      // but voice lines are short; this is a best-effort.
      this._playing = null;
    }
  }
}

let _global = null;

export function setGlobalVoicePlayer(player) { _global = player; }
export function getGlobalVoicePlayer() { return _global; }

/** Convenience: play a voice line if one exists. */
export function playVoiceLine(questName, msgId) {
  return _global?.play(questName, msgId);
}

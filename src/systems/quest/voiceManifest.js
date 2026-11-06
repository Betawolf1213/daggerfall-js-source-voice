// systems/quest/voiceManifest.js — Q4: which message gets which voiced line.
// Each voice pack is a folder of WAVs + manifest.json; the manifest maps
// quest messages (by quest name + message id) to the file that voices them.
//
// Manifest shape:
//   { "packName": "caldera_voices",
//     "version": 1,
//     "lines": [
//       { "quest": "_CALDERA_", "msgId": 1010,
//         "speaker": "questgiver_male_breton",
//         "file": "caldera_1010.wav",
//         "tags": ["greeting"] }
//     ]
//   }
//
// The message id is from the quest script (e.g. `_CALDERA_` message 1010).
// If a message has variants, each variant can have its own line, or the
// first variant is used as default.

export const VOICE_MANIFEST_NAME = 'manifest.json';
export const VOICE_SAMPLE_RATE = 24000; // OmniVoice output

/** Build a lookup key from quest name and message id. */
export function voiceKey(questName, msgId) {
  return `${questName}:${msgId}`;
}

/** Parse a manifest, returning { name, version, map, speakers }.
 *  map is a Map<voiceKey, lineEntry>.
 */
export function parseManifest(json) {
  const name = json.packName || 'unnamed';
  const version = json.version ?? 1;
  const map = new Map();
  const speakers = new Set();
  for (const line of json.lines ?? []) {
    const key = voiceKey(line.quest, line.msgId);
    map.set(key, line);
    if (line.speaker) speakers.add(line.speaker);
  }
  return { name, version, map, speakers: [...speakers] };
}

/** True if this manifest covers the given quest message. */
export function hasVoice(manifest, questName, msgId) {
  return manifest.map.has(voiceKey(questName, msgId));
}

/** The line entry for a quest message, or null. */
export function getVoiceLine(manifest, questName, msgId) {
  return manifest.map.get(voiceKey(questName, msgId)) ?? null;
}

/** A default manifest with some tutorial lines. */
export function defaultManifest() {
  return {
    packName: 'default',
    version: 1,
    lines: [
      // Example: the first greeting in the tutorial
      { quest: '_TUTOR___', msgId: 1000, speaker: 'npc_male', file: 'tut_1000.wav', tags: ['greeting'] },
    ],
  };
}

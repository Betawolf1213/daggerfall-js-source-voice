# Q4 Voice Pipeline — Design Notes

## What it is
The Q4 voice layer gives quest authors the ability to attach voice lines to quest messages. When a message is displayed in-game, the matching voice line plays through the WebAudio engine.

## Architecture
- **Manifest**: `voiceManifest.js` — a JSON map from `(questName, msgId)` to voice file metadata (speaker, tags, file path).
- **Player**: `voicePlayer.js` — registers voice buffers under `voice:<quest>:<msgId>` keys and plays them via `audio.playOneShot`.
- **Wiring**: `voiceWire.js` — connects the quest machine's `showVoiceLine` hook to the VoicePlayer.
- **Quest Integration**: `quest.js` fires `hooks.showVoiceLine(quest, msgId)` when a message is queued for display.
- **World Integration**: `world.js` handles `showVoiceLine` by delegating to the host's voice player.
- **Machine Integration**: `machine.js` exposes `showVoiceLine` as a standard quest hook.

## Manifest Format
```json
{
  "packName": "caldera_voices",
  "version": 1,
  "lines": [
    { "quest": "_CALDERA_", "msgId": 1010, "speaker": "questgiver_male_breton", "file": "caldera_1010.wav", "tags": ["greeting"] }
  ]
}
```

## Runtime Behavior
- Voice lines are played once per quest session (tracked in `quest.oneTimeVoiceLinesPlayed`).
- If no voice line exists for a message, the hook silently skips.
- Voice lines are saved/restored with the quest envelope so replay state survives saves.

## Open Items
- **Baking**: OmniVoice (or other TTS) generates WAVs at author time; the manifest records the mapping.
- **Streaming**: Large voice packs could stream from the dev server rather than bundling.
- **Speaker Profiles**: Speaker tags (`questgiver_male_breton`) are conventions; the tool does not enforce them.

## Files
- `src/systems/quest/voiceManifest.js`
- `src/systems/quest/voicePlayer.js`
- `src/systems/quest/voiceWire.js`
- `src/systems/quest/quest.js` (hook call)
- `src/systems/quest/machine.js` (hook exposure)
- `src/scenes/world.js` (host handler)
- `test/voiceManifest.test.js`
- `test/voicePlayer.test.js`

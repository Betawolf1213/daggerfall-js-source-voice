// systems/quest/voiceWire.js — Q4: connect quest machine hooks to VoicePlayer.
// Machine sets `deps.showVoiceLine`; world.js wires it to the VoicePlayer in use.
import { getGlobalVoicePlayer } from './voicePlayer.js';

/** Standard hook: quest asks to play a voice line for message `id`. */
export function showVoiceLine(quest, msgId) {
  const player = getGlobalVoicePlayer();
  if (!player) return;
  // avoid replaying the same voiced line twice in one quest session
  const key = `${quest.questName}:${msgId}`;
  if (quest.oneTimeVoiceLinesPlayed && quest.oneTimeVoiceLinesPlayed.has(key)) return;
  quest.oneTimeVoiceLinesPlayed?.add(key);
  player.play(quest.questName, msgId);
}

/** Create a deps.showVoiceLine function that knows the voice player. */
export function voiceLineHook() {
  return (q, id) => showVoiceLine(q, id);
}

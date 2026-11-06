// debugStart.js — Q6: start a quest by URL and report where to jump, without walking to the giver.
// This module is NOT loaded by the live game unless ?quest is in the URL, so it adds no boot cost.
//
// The port's world.js reads URL params at boot (main.js -> bootWorld). After the quest bridge is
// built and game-start quests fired, if ?quest=<name> is present this module starts that quest
// immediately (StartQuestByName) and returns the jump target for the host to teleport.
//
// URL params consumed:
//   ?quest=<questName>      — start the named quest (required)
//   ?jump=site|giver|none   — target: site=first Place site, giver=questor NPC's place, none=don't move
//                             (default: site)
//
// Example:  http://localhost:5212/?classic=1&quest=FORAGB00&jump=site

/**
 * After the quest bridge is live, fire the debug quest start if the URL asks for one.
 * Returns the target site for the host to teleport; the host decides how (pixel coords,
 * interior door, etc.) because only the host has the maps object.
 * @param {{machine:object, questLists:object}} questBridge
 * @param {object} opts
 * @param {string} [opts.search] — location.search override for testing
 * @returns {{started:boolean, questName?:string, site?:object|null, jump?:string, note?:string}}
 */
export function tryDebugStart(questBridge, opts = {}) {
  if (!questBridge?.machine) return { started: false, note: 'no bridge' };
  const search = opts.search ?? (typeof location !== 'undefined' ? location.search : '');
  const params = new URLSearchParams(search);
  const questName = params.get('quest');
  if (!questName) return { started: false };

  const jump = params.get('jump') || 'site';
  const machine = questBridge.machine;

  const quest = machine.startQuestByName(questName);
  if (!quest) {
    console.warn(`[debugStart] quest "${questName}" did not start (parse failed or source missing)`);
    return { started: false, questName, note: 'start failed' };
  }
  console.log(`[debugStart] started "${questName}"`);

  const site = jump === 'none' ? null : pickJumpSite(quest, machine, jump);
  return { started: true, questName, site, jump };
}

/** Pick a site to jump to based on the jump mode. */
function pickJumpSite(quest, machine, jump) {
  if (jump === 'giver') {
    const giver = [...(quest.resources?.values() ?? [])].find((r) => r?.kind === 'Person' && r.isQuestor);
    if (giver?.place) return giver.place;
  }
  const firstPlace = [...(quest.resources?.values() ?? [])].find((r) => r?.kind === 'Place' && r.site);
  if (firstPlace?.site) return firstPlace.site;
  return machine.getAllActiveQuestSites?.().find((s) => s.questUid === quest.uid) ?? null;
}

/**
 * Build a debug-start URL from a quest name and optional jump target.
 * Pure; no DOM needed.
 */
export function debugUrl(base, questName, { jump = 'site', classic = true, extra = {} } = {}) {
  const u = new URL(base);
  if (classic) u.searchParams.set('classic', '1');
  u.searchParams.set('quest', questName);
  if (jump !== 'site') u.searchParams.set('jump', jump);
  for (const [k, v] of Object.entries(extra)) {
    if (v != null) u.searchParams.set(k, String(v));
  }
  return u.toString();
}

// @ts-check
// RAID-ASHORE (2026-10-17, the owner: "when pirates attack but your first boat (the one that is assigned to be your
// cabin if you press T > ship) You spawn and fight in land which is cool and way better than being teleported to a ship
// a mile away. Anyway the actual bug is that after you defeat the pirates they keep spawning but passive";
// bible/03-World/Naval-Refit.md RAID-ASHORE) - A VOYAGE'S RAID THROWN BACK WHERE THE PLAYER STANDS.
//
// Warm Ashes' voyage ambush (systems/warmAshesShips.js) starts WAQ_SHIP_SMALLRAID and boards "Your Ship" - and once a
// bank ship's cabin is linked to a sailing ship of the player's (systems/boatCabinOwnership.js), Transport > Ship opens
// THAT ship where she lies (world.js enterLinkedBankCabin): her deck or her cabin, at her quay by the land. The raid is
// fought there, its waves stood about the player (world.js tryPlaceFoe's open ground, or the cabin's own floor).
//
// The raid's crew is its own: five `_ally_` Warriors with every wave, five more each time five of them fall
// (`_callfriends_`, `_callfriends2_`, `_callfriends3_`), their team set back to the player's on EVERY quest tick by the
// `_setFoeInfight_` loop - one struck is an ally again a tick later (enemyTargets.js resetAllyTeamOnPlayerAttack, undone).
// The quest's win tasks remove the raiders and run "Leave Ship"; nothing in the script ever removes `_ally_`, and it ends
// only on its hour's clock. On "Your Ship" (WA_SEA_REGION, region 31) the IL's Leave Ship sails the player OFF the ship -
// its scene and the crew in it stay behind, out of the world. Ashore the IL's other arm completes the action and nothing
// more: the player stays where they fought, beside a crew that looks like the raiders (Warriors, named and drawn as any
// foe, counted as enemies near), never turns on them, and comes back five at a time as they are struck down - "they keep
// spawning but passive" - for the rest of the hour.
//
// So ashore the raid ENDS where it was fought (warmAshesShips.js LeaveShip, the port's arm - DECLARED, Port-Ledger A):
// every living foe the quest stood - its crew and any raider a reinforcement left - withdrawn from the pool it stands in
// (`over`), the street's or the room's, the dead left lying to be looted; the ship blocks back to their base; and the
// quest ended as its own `end quest` ends one (the machine tombstones it after its tick), so no wave and no crew is called
// again. Its message (1014, "The attackers have been fought off") is the quest's, said before the Leave Ship runs.
//
// RAID-WON (FIELD BUGS 2026-10-19, the Discord, [IMB]Monday: "If you get boarded.. repel the attackers.. board them..
// etc. You can use overview as your crew class as enemies"; bible/01-Overview/bugs/Field-Bugs-2026-10-19.md): AT SEA THE
// SAME LAW. A raid the sea fight started (scenes/naval/navalHost.js beginFight) and the player won - its leader down, or
// its wave killed and its Leave Ship the sea fight's - ran on: the small raid until its hour, the pirate attack until
// its `_reset_`, and its five `_ally_` Warriors (the hands it stood in my crew's place) stood on my deck after it, hostile
// on their mobile team, so the Overworld, a rest and a journey all said enemies were near for as long as I sailed. Won,
// it ends as one thrown back ashore does (`won`): its living foes withdrawn, its quest ended as its own `end quest`
// ends one.

/** A quest's own foes still standing, out of a pool's list - the quest resource behaviour's UID (world.js endRaid's law). */
export const questFoesOf = (quest, foes) => (quest ? (foes ?? []).filter((f) => f && !f.dead && f.questBehaviour?.questUID === quest.uid) : []);

/**
 * @param {{ pools: () => ({ foes: () => any[], remove: (foe: any) => void } | null)[] }} deps - the foe pools a raid's foes
 *   can stand in now: the street's (the exterior foes) and, indoors, the room's (the sailing cabin's own pool)
 */
export function createRaidAshore(deps) {
  /** The raids ended ashore whose quest has not yet ended (its `end quest`'s two ticks of grace - quest.js endQuest). */
  const ending = new Set();
  /** Every living foe of `quest` withdrawn from every pool. Answers how many went. */
  function withdraw(quest) {
    let n = 0;
    for (const pool of deps.pools?.() ?? []) {
      if (!pool) continue;
      for (const f of questFoesOf(quest, [...pool.foes()])) { pool.remove(f); n++; }
    }
    return n;
  }
  return {
    /** A raid thrown back ashore: its foes withdrawn now, and again as its quest ends - a wave a CreateFoe had in flight
     *  stands in its grace ticks (the quest's tasks run two more ticks after `end quest`), and is withdrawn with it.
     *  Answers how many went now. */
    over(quest) {
      if (!quest) return 0;
      ending.add(quest.uid);
      return withdraw(quest);
    },
    /** The quest machine's word that a quest ended (world.js onQuestEnded): a raid ended ashore withdraws what its last
     *  ticks stood. Answers how many went (0 for any other quest). */
    questEnded(quest) {
      if (!quest || !ending.has(quest.uid)) return 0;
      ending.delete(quest.uid);
      return withdraw(quest);
    },
    /** RAID-WON: a raid WON at sea (navalHost.js winBoarding, through world.js endRaid): ended as one thrown back ashore -
     *  its foes withdrawn now and as its quest ends (`over`), and its quest ended as its own `end quest` ends one
     *  (questBreak, endQuest: the machine tombstones it after its two ticks); one already ending its foes alone, one
     *  already ended its foes withdrawn once. Answers how many went now. */
    won(quest) {
      if (!quest) return 0;
      if (quest.questTombstoned) return withdraw(quest);
      const n = this.over(quest);
      if (!quest.questComplete && !(quest.ticksToEnd > 0)) { quest.questBreak = true; quest.endQuest(); }
      return n;
    },
    get ending() { return ending.size; },
  };
}

// @ts-check
// QL11 (2026-10-19, the owner: "Tying all our newly integrated features into quests"; bible/06-Systems/Questlines-Arc.md
// section 4.5): THE ACTS - what a player did in one of the game's features, said in one line where it happens
// (`noteAct('fish-caught')`, as a system tells the Tutorials of a first use - tutorials.js noteFirstUse), and heard by every running stamped
// quest (systems/questlines/qlLayer.js act). An objective may ask for one ({ "act": "fish-caught", "n": 3 }) and a
// questline's script may wait on one (`ql act fish-caught 3`, qlActions.js QlAct).
//
// A LEAF: the features import this and nothing of the layer. The quest bridge registers the layer as the sink, once
// (scenes/quest/questBridge.js - THE ONE CONSTRUCTION SEAM, as questMacros.js setMacroWorld is), and a page with no quests
// hears nothing. An act is the player's own client's word - it moves a quest's objective, never an account's currency
// (decision 8: the service pays only what it witnessed - server-account/src/questlines.js).
//
// test/systems/questlines/ql11_acts.test.js sweeps src/ both ways: every kind here has a producer, and every producer
// names a kind here.

/** Every act a feature says, by kind - what the player did, in the words an objective's writer reads. */
export const ACT_KINDS = Object.freeze({
  // gathering and making (Professions, Foraging, Deep Waters)
  'fish-caught': 'a fish caught',
  'herb-gathered': 'a plant gathered',
  'ore-mined': 'ore or gems mined',
  'wood-chopped': 'wood chopped',
  'piece-crafted': 'a piece made at a crafting station',
  // the loot's own laws
  'gem-socketed': 'a gem set in a socket',
  'piece-reforged': 'a piece reforged',
  // the tavern's tables
  'gambit-won': 'a game of the King\'s Gambit won',
  'cards-won': 'a hand of cards won',
  // the sea and the road
  'port-reached': 'a port reached under sail',
  'cargo-delivered': 'a cargo delivered',
  'ship-struck': 'a ship made to strike her colours',
  // NOT HERE: section 4.5's "a wagon's load hauled (Merchant Yards)". Nothing in the game finishes one - the yards trade
  // horses and wagons (systems/merchantYards.js), no counter sells a wagon's load (the trade window's wagon button is a
  // consumed no-op, ui/native/nativeTrade.js `usingWagon`) - so no feature could say it, and an objective bound to it
  // could never close. It comes back with the feature that hauls one, and its producer.
  // the world's events
  'raid-repelled': 'a raid on a town driven off',
  'arena-won': 'a bout won in the Arena',
  'revenant-knelt': 'a revenant made to kneel',
  'star-taken': 'a star taken on the Firmament',
  // the endgame (each also a receipt the service holds - section 5.3)
  'rite-broken': 'Dagon\'s Faithful\'s rite broken before the breach opened',
  'breach-closed': 'a Dagon\'s Breach closed',
  'elite-foe-slain': 'an elite foe slain in an Elite Dungeon',
  'redoubt-taken': 'a Redoubt taken in an Elite Breach',
  'valkynaz-felled': 'a Valkynaz\'s Redoubt taken in an Elite Breach',
  'hour-broken': 'the Brass Remnant broken in the Shattered Hour',
  'serpent-slain': 'the Sea Serpent slain',
});
export const ACT_IDS = Object.freeze(Object.keys(ACT_KINDS));

let _sink = null;
/** The bridge's registration: `fn(kind, n)` hears every act (the layer's act). Null unregisters. */
export function setActSink(fn) { _sink = typeof fn === 'function' ? fn : null; }

/** A feature's word: the player did `kind` (`n` times). Answers how many running quests heard it (0: none - or no
 *  quests on this page). A kind this file does not name is refused with a warning, never counted. */
export function noteAct(kind, n = 1) {
  if (!Object.hasOwn(ACT_KINDS, kind)) { console.warn(`[questlines] no act "${kind}"`); return 0; }
  const count = Math.floor(Number(n) || 0);
  if (count <= 0 || !_sink) return 0;
  try { return _sink(kind, count) | 0; } catch (e) { console.warn(`[questlines] the act "${kind}" was not heard (${e?.message ?? e})`); return 0; }
}

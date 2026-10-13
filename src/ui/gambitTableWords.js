// @ts-check
// KG3 (2026-10-13, bible/11-Multiplayer/Kings-Gambit.md sections 14.4-14.6 and 16): THE KING'S GAMBIT'S WORDS - every
// sentence the table says, one home, each one pattern through the text core (`t`, `cards.kingsGambit.*`) read when it
// is said, never at module load (tools/l10n/ROUTE-BRIEF.md), its numbers the law's own exports handed in as arguments
// (Plain Words law 3: a typed number is a mutant the pins kill). The panel (ui/gambitTableHud.js) and the table's half
// (scenes/gambitTableGame.js) read them.
//
// NAMES (14.6): a unit is named through Daggerfall Unity's own lookup (getLocalizedEnemyName - its pack's name for the
// creature or the calling), never the law's canonical English; a king is "{name}, King of {crown}" off the Bay deck's
// crowns (render/cardFaces.js SUIT_CROWNS) - never the law's KG_KINGS, the mod's classes; the regulars' and the kings'
// own names are never translated. NO PRONOUN GUESSED (D10): a regular is named, never "he" - the regulars are of both
// genders - and the mod's "He fields ...", "He will not sit down ...", "Protect him!" are said round the name or not at
// all. "Press", never "click": the table is a finger's too (CARDS-TOUCH).
//
// Not a DFU member: Daggerfall Unity has no such game - the mod does. Ledger A row (THE KING'S GAMBIT).
import {
  KG_COLS, KG_ROWS, KG_POINT_BUDGET, KG_MAX_UNITS, KG_RANGED_COST_FACTOR, KG_ACTIONS_PER_TURN, KG_POTIONS_PER_SIDE,
  KG_POTION_HEAL, KG_MOVE_RANGE, KG_RANGED_RANGE, KG_BLOW_LOW, KG_BLOW_SPREAD, KG_HAZARD_DAMAGE, KG_HAZARD_SPAWN_EVERY,
  KG_KING_LEVEL, KG_KING_HP, KG_KINGS, rosterUnit,
} from '../net/kingsGambit.js';
import { GAMBIT_STAKE_MULTS, GAMBIT_WIN_PAYS, crownIndex } from '../systems/gambitTableSession.js';
import { SUIT_CROWNS } from '../render/cardFaces.js';
import { t, getLocalizedEnemyName } from '../systems/textManager.js';

/** Percent of a factor, as the guide says it ("35% more"). */
const pct = (/** @type {number} */ x) => Math.round(x * 100);

// ── THE NAMES ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** A unit's name as the player reads it: Daggerfall Unity's own (a pack's), else the law's. @param {number} id */
export const unitName = (id) => getLocalizedEnemyName(id, rosterUnit(id)?.name ?? '?');
/** The crown's King off the Bay deck: their name and their crown's. @param {any} crown a GAMBIT_CROWNS key */
const crownKing = (crown) => { const c = SUIT_CROWNS[crownIndex(crown)]; return { name: c.courts[2].name, crown: c.crown }; };
/** A king's whole title, "{name}, King of {crown}" - a list's or a label's: the crowns, the army's line, the box's head.
 *  @param {any} crown a GAMBIT_CROWNS key */
export const kingName = (crown) => t('cards.kingsGambit.king.name', '{name}, King of {crown}', crownKing(crown));
/** A king inside a sentence, "King {name}" - the log's, a refusal's, a press's: a whole title there wants commas round it
 *  ("Your Gothryd, King of Daggerfall moves." - FOUND AT KG3). @param {any} crown a GAMBIT_CROWNS key */
export const kingShort = (crown) => t('cards.kingsGambit.king.short', 'King {name}', { name: crownKing(crown).name });
/** A piece's name inside a sentence: a king's by its side's crown, a unit's by its kind (the law's `unit`, a mobile type).
 *  @param {{side: number, unit: number, king: boolean}} p @param {string[]} crowns the two sides' */
export const pieceName = (p, crowns) => (p.king ? kingShort(crowns[p.side]) : unitName(p.unit));

/** A tier's name and its words (the mod's blurbs, said round the tier - never "he", AUDIT KG D10). @param {string} key */
export function tierName(key) {
  switch (key) {
    case 'amateur': return t('cards.kingsGambit.tier.amateur.name', 'Amateur');
    case 'seasoned': return t('cards.kingsGambit.tier.seasoned.name', 'Seasoned');
    case 'veteran': return t('cards.kingsGambit.tier.veteran.name', 'Veteran');
    default: return t('cards.kingsGambit.tier.grandmaster.name', 'Grandmaster');
  }
}
export function tierBlurb(/** @type {string} */ key) {
  switch (key) {
    case 'amateur': return t('cards.kingsGambit.tier.amateur.blurb', 'A few drinks in, and barely sure of the rules.');
    case 'seasoned': return t('cards.kingsGambit.tier.seasoned.blurb', 'Plays most nights, and knows the game.');
    case 'veteran': return t('cards.kingsGambit.tier.veteran.blurb', 'A shrewd tactician who rarely makes a mistake.');
    default: return t('cards.kingsGambit.tier.grandmaster.blurb', 'Legendary across the Iliac Bay. Bring your best army.');
  }
}
/** A board's name, by the law's layout key (the law keeps keys; the words are the client's - L10N4). @param {string} key */
export function layoutName(key) {
  switch (key) {
    case 'pillared-hall': return t('cards.kingsGambit.layout.pillaredHall', 'Pillared hall');
    case 'guard-rooms': return t('cards.kingsGambit.layout.guardRooms', 'Guard rooms');
    case 'ruined-keep': return t('cards.kingsGambit.layout.ruinedKeep', 'Ruined keep');
    case 'moat-and-bridges': return t('cards.kingsGambit.layout.moatAndBridges', 'Moat and bridges');
    default: return t('cards.kingsGambit.layout.openField', 'Open field');
  }
}
/** A hazard's name by its kind (the law's key). @param {string} kind */
export function hazardName(kind) {
  switch (kind) {
    case 'fire': return t('cards.kingsGambit.hazard.fire', 'Fire');
    case 'spikes': return t('cards.kingsGambit.hazard.spikes', 'Spikes');
    default: return t('cards.kingsGambit.hazard.poison', 'Poison');
  }
}

// ── THE FOUR BLOCKS (PLAIN-UI a: what it is, the next step, how it works, the words) ──────────────────────────────

/** WHAT THIS IS (law 1). */
export const gambitWhat = () => t('cards.kingsGambit.what', 'The King\'s Gambit is a game of armies and kings on a board of {cols} by {rows, plural, one {# cell} other {# cells}} laid on this table. Each side guards its king: fell the other king to win.', { cols: KG_COLS, rows: KG_ROWS });

/** HOW THE KING'S GAMBIT WORKS (law 4): seven short paragraphs, every number the law's. */
export function gambitGuide() {
  const [a, b, c] = GAMBIT_STAKE_MULTS;
  return [
    { head: t('cards.kingsGambit.guide.regular.head', 'Choose a regular'), body: t('cards.kingsGambit.guide.regular.body', 'Each regular plays at a tier. The higher the tier, the bigger the army, the more potions, the fewer blunders - and the higher the least stake.') },
    { head: t('cards.kingsGambit.guide.stake.head', 'Put down your stake'), body: t('cards.kingsGambit.guide.stake.body', 'Stake {a}, {b} or {c} times the regular\'s least stake. Win, and you take back {pay} times your stake. Lose, forfeit or stand up mid-game, and the regular keeps it.', { a, b, c, pay: GAMBIT_WIN_PAYS }) },
    { head: t('cards.kingsGambit.guide.army.head', 'Build your army'), body: t('cards.kingsGambit.guide.army.body', 'Up to {units, plural, one {# unit} other {# units}} for {points, plural, one {# point} other {# points}}. The stronger a unit, the more it costs; a ranged unit costs {pct}% more. Your king joins free.', { units: KG_MAX_UNITS, points: KG_POINT_BUDGET, pct: pct(KG_RANGED_COST_FACTOR - 1) }) },
    { head: t('cards.kingsGambit.guide.turn.head', 'Take your turn'), body: t('cards.kingsGambit.guide.turn.body', '{actions, plural, one {# action} other {# actions}} a turn: move a piece up to {move, plural, one {# cell} other {# cells}}, strike, or give one of your pieces a potion that heals {heal} health. You have {potions, plural, one {# potion} other {# potions}} a game.', { actions: KG_ACTIONS_PER_TURN, move: KG_MOVE_RANGE, heal: KG_POTION_HEAL, potions: KG_POTIONS_PER_SIDE }) },
    { head: t('cards.kingsGambit.guide.strike.head', 'Strike'), body: t('cards.kingsGambit.guide.strike.body', 'A melee piece strikes the cell beside it; a ranged piece shoots up to {range, plural, one {# cell} other {# cells}} when nothing blocks its line. A blow does {low}% to {high}% of the striker\'s attack.', { range: KG_RANGED_RANGE, low: pct(KG_BLOW_LOW), high: pct(KG_BLOW_LOW + KG_BLOW_SPREAD) }) },
    { head: t('cards.kingsGambit.guide.ground.head', 'Mind the ground'), body: t('cards.kingsGambit.guide.ground.body', 'Walls and pillars stop a piece and a shot; water stops a piece, not a shot. Every {every, plural, one {round} other {# rounds}} the warnings turn into fire ({fire}), spikes ({spikes}) or poison ({poison}): a piece that ends its own side\'s turn on one loses that much health.', { every: KG_HAZARD_SPAWN_EVERY, fire: KG_HAZARD_DAMAGE.fire, spikes: KG_HAZARD_DAMAGE.spikes, poison: KG_HAZARD_DAMAGE.poison }) },
    { head: t('cards.kingsGambit.guide.win.head', 'Win'), body: t('cards.kingsGambit.guide.win.body', 'Fell the other king - or every piece of the other side.') },
  ];
}

/** WORDS ON THIS TABLE (law 2): each term over its meaning. */
export function gambitWords() {
  return [
    { term: t('cards.kingsGambit.words.regular.term', 'Regular'), meaning: t('cards.kingsGambit.words.regular.meaning', 'One of the tavern\'s own, sitting at this table, who plays against you.') },
    { term: t('cards.kingsGambit.words.tier.term', 'Tier'), meaning: t('cards.kingsGambit.words.tier.meaning', 'How strong a regular plays: Amateur, Seasoned, Veteran or Grandmaster.') },
    { term: t('cards.kingsGambit.words.blunder.term', 'Blunder'), meaning: t('cards.kingsGambit.words.blunder.meaning', 'A careless action a regular takes now and then - the lower the tier, the more often.') },
    { term: t('cards.kingsGambit.words.leastStake.term', 'Least stake'), meaning: t('cards.kingsGambit.words.leastStake.meaning', 'The least gold a regular sits down for.') },
    { term: t('cards.kingsGambit.words.stake.term', 'Stake'), meaning: t('cards.kingsGambit.words.stake.meaning', 'The gold you put down. The table holds it until the game ends.') },
    { term: t('cards.kingsGambit.words.forFun.term', 'For fun'), meaning: t('cards.kingsGambit.words.forFun.meaning', 'A game with no gold: online, or when a regular has paid out all they will tonight.') },
    { term: t('cards.kingsGambit.words.crown.term', 'Crown'), meaning: t('cards.kingsGambit.words.crown.meaning', 'The kingdom whose King leads your army.') },
    { term: t('cards.kingsGambit.words.king.term', 'King'), meaning: t('cards.kingsGambit.words.king.meaning', 'Your most important piece. If your king falls, you lose.') },
    { term: t('cards.kingsGambit.words.army.term', 'Army'), meaning: t('cards.kingsGambit.words.army.meaning', 'The units you take into the game.') },
    { term: t('cards.kingsGambit.words.points.term', 'Points'), meaning: t('cards.kingsGambit.words.points.meaning', 'What you build your army with. Never gold.') },
    { term: t('cards.kingsGambit.words.level.term', 'Level'), meaning: t('cards.kingsGambit.words.level.meaning', 'How seasoned a unit is. Its attack grows with it.') },
    { term: t('cards.kingsGambit.words.health.term', 'Health'), meaning: t('cards.kingsGambit.words.health.meaning', 'How much harm a piece takes before it falls.') },
    { term: t('cards.kingsGambit.words.attack.term', 'Attack'), meaning: t('cards.kingsGambit.words.attack.meaning', 'How hard a piece strikes.') },
    { term: t('cards.kingsGambit.words.melee.term', 'Melee'), meaning: t('cards.kingsGambit.words.melee.meaning', 'Strikes only the cell beside it.') },
    { term: t('cards.kingsGambit.words.ranged.term', 'Ranged'), meaning: t('cards.kingsGambit.words.ranged.meaning', 'Shoots from afar, when nothing blocks the line.') },
    { term: t('cards.kingsGambit.words.autofill.term', 'Auto-fill'), meaning: t('cards.kingsGambit.words.autofill.meaning', 'Fills the rest of your army for you.') },
    { term: t('cards.kingsGambit.words.action.term', 'Turn and action'), meaning: t('cards.kingsGambit.words.action.meaning', 'Each turn gives you actions: a move, a strike or a potion is one.') },
    { term: t('cards.kingsGambit.words.move.term', 'Move'), meaning: t('cards.kingsGambit.words.move.meaning', 'A piece walks a few cells, around walls, pillars and water.') },
    { term: t('cards.kingsGambit.words.potion.term', 'Potion'), meaning: t('cards.kingsGambit.words.potion.meaning', 'Heals one of your pieces. Each side has a few a game.') },
    { term: t('cards.kingsGambit.words.round.term', 'Round'), meaning: t('cards.kingsGambit.words.round.meaning', 'Your turn and the other side\'s together.') },
    { term: t('cards.kingsGambit.words.hazard.term', 'Fire, Spikes and Poison'), meaning: t('cards.kingsGambit.words.hazard.meaning', 'Hazards on the board. A piece that ends its own side\'s turn on one is hurt.') },
    { term: t('cards.kingsGambit.words.warning.term', 'Warning'), meaning: t('cards.kingsGambit.words.warning.meaning', 'A cell where a hazard is coming. It hurts nobody yet.') },
    { term: t('cards.kingsGambit.words.ground.term', 'Wall, Pillar and Water'), meaning: t('cards.kingsGambit.words.ground.meaning', 'Ground no piece walks on. Walls and pillars block a shot; water does not.') },
    { term: t('cards.kingsGambit.words.layout.term', 'Layout'), meaning: t('cards.kingsGambit.words.layout.meaning', 'The shape of the board, dealt at random each game.') },
    { term: t('cards.kingsGambit.words.reach.term', 'Reach'), meaning: t('cards.kingsGambit.words.reach.meaning', 'The cells a piece can move to now.') },
    { term: t('cards.kingsGambit.words.range.term', 'Range and Target'), meaning: t('cards.kingsGambit.words.range.meaning', 'The cells a piece can strike, and a foe it can strike now.') },
    { term: t('cards.kingsGambit.words.fallen.term', 'Fallen'), meaning: t('cards.kingsGambit.words.fallen.meaning', 'The pieces a side has lost.') },
    { term: t('cards.kingsGambit.words.forfeit.term', 'Forfeit'), meaning: t('cards.kingsGambit.words.forfeit.meaning', 'Giving up the game - your stake is lost.') },
  ];
}

// ── THE SETUP ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** A regular's row: what makes the tier hard, the least stake, what is left of the night (14.5). */
export function regularLines(/** @type {{name: string, tier: any, nightLeft: number, forFun: boolean}} */ r, /** @type {boolean} */ friendly) {
  const T = r.tier, blunder = pct(T.blunder);
  return {
    tier: tierName(T.key),
    fields: blunder > 0
      ? t('cards.kingsGambit.regular.fields', 'An army of {points, plural, one {# point} other {# points}} - {potions, plural, one {# potion} other {# potions}} - blunders {pct}% of the time', { points: T.budget, potions: T.potions, pct: blunder })
      : t('cards.kingsGambit.regular.fieldsNever', 'An army of {points, plural, one {# point} other {# points}} - {potions, plural, one {# potion} other {# potions}} - never blunders', { points: T.budget, potions: T.potions }),
    least: t('cards.kingsGambit.regular.least', 'Sits down for {stake, number} gold or more', { stake: T.stake }),
    blurb: tierBlurb(T.key),
    night: friendly ? t('cards.kingsGambit.regular.online', 'Online, the regulars play for fun')
      : r.forFun ? t('cards.kingsGambit.regular.forFun', 'Plays for fun tonight')
        : t('cards.kingsGambit.regular.nightLeft', 'Can still pay {left, number} gold tonight', { left: r.nightLeft }),
  };
}
/** A stake's tile: "×{m} - {gold} gold". */
export const stakeLabel = (/** @type {number} */ m, /** @type {number} */ gold) => t('cards.kingsGambit.stake.pick', '×{m} - {gold, number} gold', { m, gold });
/** What the stake does, said before it is put down. */
export const stakeWhat = (/** @type {number} */ stake, /** @type {string} */ name) => t('cards.kingsGambit.stake.what', 'Win: you take back {pay, number} gold. Lose, forfeit or stand up mid-game: {name} keeps your {stake, number} gold.', { pay: stake * GAMBIT_WIN_PAYS, stake, name });
/** Why a stake's pick is refused: past the purse, or past the regular's night. */
export const stakePurse = (/** @type {number} */ gold, /** @type {number} */ stake) => t('cards.kingsGambit.stake.purse', 'Your purse holds {gold, number} gold - not enough for a stake of {stake, number}.', { gold, stake });
export const stakeNight = (/** @type {string} */ name, /** @type {number} */ left) => t('cards.kingsGambit.stake.night', '{name} can pay out only {left, number} gold more tonight.', { name, left });
/** The king's line under the crowns. */
export const kingLine = () => t('cards.kingsGambit.king.line', 'The crown changes only your king\'s face: every king plays alike - level {level}, {hp} health, attack {attack}.', { level: KG_KING_LEVEL, hp: KG_KING_HP, attack: KG_KINGS[0].atk });

// ── THE ARMY ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** A unit's numbers in words (THE UNIT, shown large). @param {{level: number, hp: number, atk: number, ranged: boolean}} u */
export const unitLine = (u) => (u.ranged
  ? t('cards.kingsGambit.unit.ranged', 'Level {level} - Health {hp} - Attack {attack} - Ranged ({range, plural, one {# cell} other {# cells}})', { level: u.level, hp: u.hp, attack: u.atk, range: KG_RANGED_RANGE })
  : t('cards.kingsGambit.unit.melee', 'Level {level} - Health {hp} - Attack {attack} - Melee', { level: u.level, hp: u.hp, attack: u.atk }));
/** A unit's cost in points (never gold). */
export const unitCost = (/** @type {number} */ cost) => t('cards.kingsGambit.unit.cost', '{cost, plural, one {# point} other {# points}}', { cost });
/** A tile's chips, short: level, health, attack, melee or ranged, cost. */
export const unitChips = (/** @type {{level: number, hp: number, atk: number, ranged: boolean, cost: number}} */ u) => [
  t('cards.kingsGambit.chip.level', 'Lv {n}', { n: u.level }),
  t('cards.kingsGambit.chip.health', 'HP {n}', { n: u.hp }),
  t('cards.kingsGambit.chip.attack', 'Atk {n}', { n: u.atk }),
  u.ranged ? t('cards.kingsGambit.chip.ranged', 'Ranged') : t('cards.kingsGambit.chip.melee', 'Melee'),
  t('cards.kingsGambit.chip.cost', '{n} pts', { n: u.cost }),
];
/** The army's two chips. */
export const pointsLeft = (/** @type {number} */ left) => t('cards.kingsGambit.army.pointsLeft', 'Points left {left} of {budget}', { left, budget: KG_POINT_BUDGET });
export const unitsHeld = (/** @type {number} */ n) => t('cards.kingsGambit.army.units', 'Units {n} of {max}', { n, max: KG_MAX_UNITS });
/** The king's line under the army. */
export const armyKingLine = (/** @type {string} */ crown) => t('cards.kingsGambit.army.king', 'Your king: {king} - free. If your king falls, you lose.', { king: kingName(crown) });
/** A press on a unit, said: it joined, or why not. */
export const unitJoined = (/** @type {number} */ id) => t('cards.kingsGambit.army.joined', '{name} joins your army.', { name: unitName(id) });
export const unitLeft = (/** @type {number} */ id) => t('cards.kingsGambit.army.left', '{name} leaves your army.', { name: unitName(id) });
export const unitTooDear = (/** @type {number} */ id, /** @type {number} */ left) => t('cards.kingsGambit.army.tooDear', '{name} costs {cost, plural, one {# point} other {# points}}; you have {left} left.', { name: unitName(id), cost: rosterUnit(id)?.cost ?? 0, left });
export const armyFull = () => t('cards.kingsGambit.army.full', 'Your army is full: {max, plural, one {# unit} other {# units}}.', { max: KG_MAX_UNITS });

// ── THE TURN ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** The actions left, in words beside the pips. */
export const actionsLeft = (/** @type {number} */ n) => t('cards.kingsGambit.turn.actions', '{n} of {max} actions left', { n, max: KG_ACTIONS_PER_TURN });

/** THE LAW'S REFUSALS, IN WORDS (gambitRefusal's and armyRefusal's, 14.9): a word the law answers said to the player. */
export function refusalWords(/** @type {string} */ word, /** @type {{piece?: string, target?: string}} */ a = {}) {
  switch (word) {
    case 'full': return t('cards.kingsGambit.refuse.full', '{piece} is at full health.', { piece: a.piece ?? '' });
    case 'potions': return t('cards.kingsGambit.refuse.potions', 'You have no potions left.');
    case 'cell': return t('cards.kingsGambit.refuse.cell', '{piece} cannot reach that cell.', { piece: a.piece ?? '' });
    case 'range': return t('cards.kingsGambit.refuse.range', '{target} is out of reach.', { target: a.target ?? '' });
    case 'target': return t('cards.kingsGambit.refuse.target', 'Strike a piece of the other side.');
    case 'piece': return t('cards.kingsGambit.refuse.piece', 'Choose one of your own pieces.');
    case 'turn': return t('cards.kingsGambit.refuse.turn', 'It is not your turn.');
    case 'ending': return t('cards.kingsGambit.refuse.ending', 'Your turn is ending.');
    case 'over': return t('cards.kingsGambit.refuse.over', 'The game is over.');
    case 'empty': return t('cards.kingsGambit.refuse.empty', 'Your army needs one unit at least.');
    case 'units': return t('cards.kingsGambit.refuse.units', 'Your army is full: {max, plural, one {# unit} other {# units}}.', { max: KG_MAX_UNITS });
    case 'points': return t('cards.kingsGambit.refuse.points', 'Your army costs more than {points, plural, one {# point} other {# points}}.', { points: KG_POINT_BUDGET });
    case 'rand': return t('cards.kingsGambit.refuse.rand', 'The table could not deal this game. Nothing was lost.');
    default: return t('cards.kingsGambit.refuse.shape', 'That cannot be done now.');
  }
}

// ── THE INFORMATION BOX ───────────────────────────────────────────────────────────────────────────────────────────

/** A cell, described (TileDescription's, in plain words): open floor, ground no piece walks on, a hazard, a warning. */
export function cellWords(/** @type {{tile: number, hazard: any, round: number}} */ c) {
  if (c.hazard?.active) return t('cards.kingsGambit.cell.hazard', '{kind}: a piece that ends its own side\'s turn here loses {damage} health.', { kind: hazardName(c.hazard.kind), damage: KG_HAZARD_DAMAGE[c.hazard.kind] });
  if (c.hazard) return t('cards.kingsGambit.cell.warning', 'A warning: it becomes {kind, select, fire {fire} spikes {spikes} other {poison}} at the end of round {round}, and hurts nobody until then.', { kind: c.hazard.kind, round: c.round });
  switch (c.tile) {
    case 1: return t('cards.kingsGambit.cell.wall', 'A wall: no piece walks through it, and it blocks a ranged shot.');
    case 2: return t('cards.kingsGambit.cell.pillar', 'A pillar: no piece walks through it, and it blocks a ranged shot.');
    case 3: return t('cards.kingsGambit.cell.water', 'Water: it cannot be crossed on foot, but ranged attacks pass over it.');
    default: return t('cards.kingsGambit.cell.floor', 'Open floor.');
  }
}
/** A piece's lines: its side, its numbers, its reach, whom it can strike now, a king's warning. */
export function pieceInfoLines(/** @type {{name: string, mine: boolean, regular: string, piece: any, foes: number}} */ x) {
  const p = x.piece;
  const lines = [
    x.mine ? t('cards.kingsGambit.info.mine', '{name} - yours', { name: x.name }) : t('cards.kingsGambit.info.theirs', '{name} - {regular}\'s', { name: x.name, regular: x.regular }),
    p.ranged
      ? t('cards.kingsGambit.info.ranged', 'Level {level} - Attack {attack} - Ranged: shoots up to {range, plural, one {# cell} other {# cells}}', { level: p.level, attack: p.atk, range: KG_RANGED_RANGE })
      : t('cards.kingsGambit.info.melee', 'Level {level} - Attack {attack} - Melee: strikes the cell beside it', { level: p.level, attack: p.atk }),
    t('cards.kingsGambit.info.health', 'Health {hp} of {max}', { hp: p.hp, max: p.maxHp }),
    t('cards.kingsGambit.info.moves', 'Moves up to {move, plural, one {# cell} other {# cells}} a move.', { move: KG_MOVE_RANGE }),
    t('cards.kingsGambit.info.foes', '{n, plural, =0 {No foe in reach now.} one {One foe in reach now.} other {# foes in reach now.}}', { n: x.foes }),
  ];
  if (p.king) lines.push(x.mine ? t('cards.kingsGambit.info.kingMine', 'If this king falls, you lose.') : t('cards.kingsGambit.info.kingTheirs', 'If this king falls, {name} loses.', { name: x.regular }));
  return lines;
}

// ── THE HEADERS, THE SECTIONS AND THE PRESSES ─────────────────────────────────────────────────────────────────────

/** The panel's header by its stage (14.5). */
export function gambitTitle(/** @type {{phase: string, round?: number, mine?: boolean, name?: string}} */ m) {
  if (m.phase === 'battle') return m.mine ? t('cards.kingsGambit.title.mine', 'Round {round} - your turn', { round: m.round }) : t('cards.kingsGambit.title.theirs', 'Round {round} - {name}\'s turn', { round: m.round, name: m.name });
  if (m.phase === 'army') return t('cards.kingsGambit.title.army', 'The King\'s Gambit - your army');
  if (m.phase === 'over') return t('cards.kingsGambit.title.over', 'The King\'s Gambit - the result');
  return t('cards.kingsGambit.title.setup', 'The King\'s Gambit');
}
/** The sections' heads. */
export const GAMBIT_HEADS = Object.freeze({
  get regulars() { return t('cards.kingsGambit.head.regulars', 'Choose a regular'); },
  get stake() { return t('cards.kingsGambit.head.stake', 'Your stake'); },
  get crown() { return t('cards.kingsGambit.head.crown', 'Your king'); },
  get unit() { return t('cards.kingsGambit.head.unit', 'The unit'); },
  get grid() { return t('cards.kingsGambit.head.grid', 'Recruit'); },
  get army() { return t('cards.kingsGambit.head.army', 'Your army'); },
  get info() { return t('cards.kingsGambit.head.info', 'The information box'); },
  get armies() { return t('cards.kingsGambit.head.armies', 'Armies'); },
  get guide() { return t('cards.kingsGambit.head.guide', 'How The King\'s Gambit works'); },
  get words() { return t('cards.kingsGambit.head.words', 'What the words mean'); },
});
/** The presses' words (14.5): every press says what it does, a press that costs gold says how much. */
export const GAMBIT_PRESS = Object.freeze({
  get next() { return t('cards.kingsGambit.press.next', 'Build your army'); },
  get autofill() { return t('cards.kingsGambit.press.autofill', 'Auto-fill'); },
  get clear() { return t('cards.kingsGambit.press.clear', 'Clear'); },
  get back() { return t('cards.kingsGambit.press.back', 'Back'); },
  get remove() { return t('cards.kingsGambit.press.remove', 'Remove'); },
  get startFun() { return t('cards.kingsGambit.press.startFun', 'Start the battle'); },
  get endTurn() { return t('cards.kingsGambit.press.endTurn', 'End turn'); },
  get forfeitFun() { return t('cards.kingsGambit.press.forfeitFun', 'Forfeit'); },
  get armed() { return t('cards.kingsGambit.press.armed', 'Press again to confirm'); },
  get stand() { return t('cards.kingsGambit.press.stand', 'Stand up'); },
  get again() { return t('cards.kingsGambit.press.again', 'Play again'); },
  get changeArmy() { return t('cards.kingsGambit.press.changeArmy', 'Change army'); },
  get otherRegular() { return t('cards.kingsGambit.press.otherRegular', 'Choose another regular'); },
  get leave() { return t('cards.kingsGambit.press.leave', 'Leave the table'); },
  get moveHere() { return t('cards.kingsGambit.press.moveHere', 'Move here'); },
  get cancel() { return t('cards.kingsGambit.press.cancel', 'Cancel'); },
  get more() { return t('cards.kingsGambit.press.more', 'More'); },
  get holdem() { return t('cards.kingsGambit.press.holdem', 'Play Hold\'em instead'); },
  get iliac() { return t('cards.kingsGambit.press.iliac', 'Play Iliac Hand instead'); },
});
export const pressStart = (/** @type {number} */ stake) => t('cards.kingsGambit.press.start', 'Start the battle - stake {stake, number} gold', { stake });
export const pressForfeit = (/** @type {number} */ stake) => t('cards.kingsGambit.press.forfeit', 'Forfeit - lose {stake, number} gold', { stake });
export const pressStandCost = (/** @type {number} */ stake) => t('cards.kingsGambit.press.standCost', 'Stand up - lose {stake, number} gold', { stake });
export const pressDrink = (/** @type {string} */ piece, /** @type {number} */ healed) => t('cards.kingsGambit.press.drink', 'Give {piece} a potion (+{healed})', { piece, healed });
export const pressStrike = (/** @type {string} */ name) => t('cards.kingsGambit.press.strike', 'Strike {name}', { name });
/** The press the Hold'em and Iliac Hand panels offer (section 3). */
export const playGambitWord = () => t('cards.kingsGambit.press.play', 'Play The King\'s Gambit');

// ── THE TURN'S CHIPS ──────────────────────────────────────────────────────────────────────────────────────────────

export const potionsChip = (/** @type {boolean} */ mine, /** @type {number} */ n, /** @type {string} */ name) => (mine
  ? t('cards.kingsGambit.chip.potionsMine', 'Your potions {n}', { n })
  : t('cards.kingsGambit.chip.potionsTheirs', '{name}\'s potions {n}', { n, name }));
export const fallenChip = (/** @type {boolean} */ mine, /** @type {number} */ n, /** @type {string} */ name) => (mine
  ? t('cards.kingsGambit.chip.fallenMine', 'Your fallen {n}', { n })
  : t('cards.kingsGambit.chip.fallenTheirs', '{name}\'s fallen {n}', { n, name }));
export const healthOf = (/** @type {number} */ hp, /** @type {number} */ max) => t('cards.kingsGambit.armies.health', '{hp} of {max}', { hp, max });

// ── THE NEXT STEP (law 1's live sentence) ─────────────────────────────────────────────────────────────────────────

/**
 * THE NEXT STEP, one sentence by the reader's state (14.4). `s` names it: 'noRegular', 'chooseRegular', 'online',
 * 'forFun', 'short', 'chooseStake', 'chooseKing', 'addUnit', 'start', 'yourTurn', 'warnings', 'piece', 'theirTurn',
 * 'ending', 'over'.
 * @param {string} s @param {{name?: string, stake?: number, n?: number}} [a]
 */
export function nextStep(s, a = {}) {
  switch (s) {
    case 'noRegular': return t('cards.kingsGambit.next.noRegular', 'No regular is free to play at this table.');
    case 'chooseRegular': return t('cards.kingsGambit.next.chooseRegular', 'Choose a regular to challenge.');
    case 'online': return t('cards.kingsGambit.next.online', 'Online, the regulars play for fun: choose your king, then build your army.');
    case 'forFun': return t('cards.kingsGambit.next.forFun', '{name} plays for fun tonight - no gold changes hands. Choose your king, then build your army.', { name: a.name ?? '' });
    case 'short': return t('cards.kingsGambit.next.short', '{name} will not sit down for less than {stake, number} gold. Come back with more, or choose another regular.', { name: a.name ?? '', stake: a.stake ?? 0 });
    case 'chooseStake': return t('cards.kingsGambit.next.chooseStake', 'Choose your stake.');
    case 'chooseKing': return t('cards.kingsGambit.next.chooseKing', 'Choose your king, then build your army.');
    case 'addUnit': return t('cards.kingsGambit.next.addUnit', 'Add a unit from the list, or press Auto-fill.');
    case 'start': return t('cards.kingsGambit.next.start', 'Your army is ready: start the battle when you are.');
    case 'yourTurn': return t('cards.kingsGambit.next.yourTurn', 'Your turn: {n, plural, one {# action} other {# actions}} left. Choose one of your pieces.', { n: a.n ?? 0 });
    case 'warnings': return t('cards.kingsGambit.next.warnings', 'Your turn: {n, plural, one {# action} other {# actions}} left. The warnings turn into hazards at the end of this round.', { n: a.n ?? 0 });
    case 'piece': return t('cards.kingsGambit.next.piece', 'Press a lit cell to move, a ringed foe to strike, or give the piece a potion.');
    case 'theirTurn': return t('cards.kingsGambit.next.theirTurn', '{name} is taking a turn.', { name: a.name ?? '' });
    case 'ending': return t('cards.kingsGambit.next.ending', 'Your turn is ending.');
    default: return t('cards.kingsGambit.next.over', 'Play again, change your army, or choose another regular.');
  }
}

// ── THE LOG (a line an event of the law - section 16's table) ─────────────────────────────────────────────────────

/**
 * A LOG LINE for one of the session's events, or null for one the log does not keep: the player in the second person,
 * the regular by name, one pattern an event. `names(piece)` names a piece by its number (it may have fallen since - the
 * event carries what the line needs); `regular` the regular's name.
 * @param {any} e @param {{regular: string, names: (id: number) => string, layout?: string}} x
 */
export function logLine(e, x) {
  const mine = e.side === 0;
  switch (e.t) {
    case 'game': return t('cards.kingsGambit.log.game', 'The board is laid: {layout}.', { layout: layoutName(e.layout) });
    case 'move': return mine ? t('cards.kingsGambit.log.moveMine', 'Your {piece} moves.', { piece: x.names(e.piece) }) : t('cards.kingsGambit.log.moveTheirs', '{name}\'s {piece} moves.', { name: x.regular, piece: x.names(e.piece) });
    case 'attack': {
      const a = { name: x.regular, piece: x.names(e.piece), target: x.names(e.target), damage: e.damage };
      if (e.killed) return mine ? t('cards.kingsGambit.log.killMine', 'Your {piece} strikes {target} for {damage} - it falls.', a) : t('cards.kingsGambit.log.killTheirs', '{name}\'s {piece} strikes your {target} for {damage} - it falls.', a);
      if (e.shot) return mine ? t('cards.kingsGambit.log.shotMine', 'Your {piece} shoots {target} for {damage}.', a) : t('cards.kingsGambit.log.shotTheirs', '{name}\'s {piece} shoots your {target} for {damage}.', a);
      return mine ? t('cards.kingsGambit.log.strikeMine', 'Your {piece} strikes {target} for {damage}.', a) : t('cards.kingsGambit.log.strikeTheirs', '{name}\'s {piece} strikes your {target} for {damage}.', a);
    }
    case 'potion': return mine ? t('cards.kingsGambit.log.potionMine', 'Your {piece} drinks a potion: +{healed}.', { piece: x.names(e.piece), healed: e.healed }) : t('cards.kingsGambit.log.potionTheirs', '{name}\'s {piece} drinks a potion: +{healed}.', { name: x.regular, piece: x.names(e.piece), healed: e.healed });
    case 'hazard': {
      const a = { kind: e.kind, piece: x.names(e.piece), damage: e.damage, name: x.regular };
      if (e.killed) return mine ? t('cards.kingsGambit.log.hazardKillMine', '{kind, select, fire {Fire} spikes {Spikes} other {Poison}} takes your {piece} for {damage} - it falls.', a) : t('cards.kingsGambit.log.hazardKillTheirs', '{kind, select, fire {Fire} spikes {Spikes} other {Poison}} takes {name}\'s {piece} for {damage} - it falls.', a);
      return mine ? t('cards.kingsGambit.log.hazardMine', '{kind, select, fire {Fire} spikes {Spikes} other {Poison}} bites your {piece} for {damage}.', a) : t('cards.kingsGambit.log.hazardTheirs', '{kind, select, fire {Fire} spikes {Spikes} other {Poison}} bites {name}\'s {piece} for {damage}.', a);
    }
    case 'armed': return t('cards.kingsGambit.log.armed', 'The warnings turn: {n, plural, one {# hazard is} other {# hazards are}} live now.', { n: e.cells.length });
    case 'warning': return t('cards.kingsGambit.log.warning', 'A warning: {kind, select, fire {fire is} spikes {spikes are} other {poison is}} coming to {n, plural, one {# cell} other {# cells}}.', { kind: e.kind, n: e.cells.length });
    case 'turn': return e.side === 0 ? t('cards.kingsGambit.log.turnMine', 'Round {round}: your turn.', { round: e.round }) : t('cards.kingsGambit.log.turnTheirs', 'Round {round}: {name}\'s turn.', { round: e.round, name: x.regular });
    case 'end': return mine ? t('cards.kingsGambit.log.endMine', 'You end your turn.') : t('cards.kingsGambit.log.endTheirs', '{name} ends the turn.', { name: x.regular });
    case 'forfeit': return t('cards.kingsGambit.log.forfeit', 'You forfeit the game.');
    case 'decided': return e.by === 'void' ? t('cards.kingsGambit.log.void', 'The game cannot go on: no contest.') : e.winner === 0 ? t('cards.kingsGambit.log.won', 'You win.') : t('cards.kingsGambit.log.lost', '{name} wins.', { name: x.regular });
    default: return null;
  }
}

// ── THE TABLE'S OWN LINES: the deal said, the regular's voice ─────────────────────────────────────────────────────

/** What the table says at the deal: the stake put down, or a game for fun. */
export const dealLine = (/** @type {string} */ name, /** @type {number} */ stake) => (stake
  ? t('cards.kingsGambit.say.deal', 'You put down {stake, number} gold and sit down to The King\'s Gambit with {name}.', { stake, name })
  : t('cards.kingsGambit.say.dealFun', 'You sit down to The King\'s Gambit with {name}, for fun.', { name }));
/** THE REGULAR'S VOICE (10.5; MEASURE KG3, section 16): the invitation as the player chooses the regular - the mod's own
 *  line - and a word at the end, the regular's win or loss, one of three by `roll` (a uniform in [0, 1)). */
export const barkInvite = () => t('cards.kingsGambit.bark.invite', 'Care for a game of The King\'s Gambit?');
export function barkEnd(/** @type {boolean} */ regularWon, /** @type {number} */ roll) {
  const k = Math.max(0, Math.min(2, Math.floor((Number(roll) || 0) * 3)));
  if (regularWon) {
    if (k === 0) return t('cards.kingsGambit.bark.won1', 'A fine game - and mine.');
    return k === 1 ? t('cards.kingsGambit.bark.won2', 'Better luck next time.') : t('cards.kingsGambit.bark.won3', 'The board is mine tonight.');
  }
  if (k === 0) return t('cards.kingsGambit.bark.lost1', 'Well played.');
  return k === 1 ? t('cards.kingsGambit.bark.lost2', 'You have my measure tonight.') : t('cards.kingsGambit.bark.lost3', 'Again, and I will have you.');
}

/** The save's refusal while a stake is down (5.7 - world.js's two doors). */
export const stakedSaveRefusal = () => t('cards.kingsGambit.save.staked', 'You cannot save with gold staked on the table.');

// ── THE RESULT ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The result's headline. @param {{winner: number|null, by: string}} over */
export function resultHead(over) {
  if (over.by === 'void') return t('cards.kingsGambit.result.void', 'No contest');
  if (over.winner === 0) return t('cards.kingsGambit.result.win', 'You win');
  return over.by === 'forfeit' ? t('cards.kingsGambit.result.loseForfeit', 'You lose - by forfeit') : t('cards.kingsGambit.result.lose', 'You lose');
}
/** The king's fall, its own sentence round the whole title: "{name}, King of {crown}, falls." */
export const kingFalls = (/** @type {string} */ crown) => t('cards.kingsGambit.result.kingFalls', '{name}, King of {crown}, falls.', crownKing(crown));
/** The gold, in one sentence. @param {{winner: number|null, by: string}} over @param {number} stake @param {string} name */
export function resultGold(over, stake, name) {
  if (!stake) return t('cards.kingsGambit.result.fun', 'Played for fun - no gold changed hands.');
  if (over.by === 'void' || over.winner === null) return t('cards.kingsGambit.result.back', 'No contest - your {stake, number} gold is back in your purse.', { stake });
  return over.winner === 0
    ? t('cards.kingsGambit.result.collect', 'You collect the pot: your {stake, number} gold back, plus {stake, number} gold from {name}.', { stake, name })
    : t('cards.kingsGambit.result.keeps', '{name} keeps your {stake, number} gold.', { stake, name });
}
/** A regular whose night ran out: the next game is for fun. */
export const nightSpent = (/** @type {string} */ name) => t('cards.kingsGambit.result.nightSpent', '{name} has paid out all they will tonight: the next game is for fun.', { name });

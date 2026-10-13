// @ts-check
// KG3 (2026-10-13, bible/11-Multiplayer/Kings-Gambit.md sections 3, 5.3, 5.7, 10, 14 and 16; the owner: "Dont come back
// until this is completed in full"): THE KING'S GAMBIT ON THE SEAT - the host's half of the game, its own module so the
// interior host (scenes/worldModes.js, THE FOUR HOSTS: the one with taverns) hands it what it needs and keeps one slot
// for it, as it keeps one for Hold'em and one for Iliac Hand (section 3: each game opens by closing the other two, and
// every road off the seat closes all three).
//
// THE EVENING (section 14.5): the setup - a regular from the table's free chairs (each at the tier the regular's seed
// gives, systems/gambitPatrons.js tierFor), the stake (the tier's least times one of the mod's three, from the purse) and
// the crown (kept on the character); the army - the mod's roster whole, as the cards' pictures; the battle - the law's
// game (net/kingsGambit.js) at the session's clock (systems/gambitTableSession.js), the regular playing as the mod's
// innkeeper played; the result after its beat. The panel is ui/gambitTableHud.js, the board on the cloth
// world/gambitCloth.js and render/gambitTableDraw.js.
//
// THE GOLD (5.7): the stake leaves the purse at the deal and the table holds it; a win pays twice it, a loss and a
// forfeit leave it with the regular - every road off the seat while a game is under way is a forfeit (close's
// `concede`); a game that did not stand (the table's source broke) hands it back. A REGULAR'S NIGHT: what a regular has
// paid out tonight, net, is the character's book (`gambitPurses`) - a stake past what is left of it is refused, and a
// regular whose night is spent plays for fun until tomorrow. Online - a realm character or an online page - the regulars
// play for fun (a regular's gold paid on the client is a faucet the realm never sees). A load's road settles nothing: the
// save waits while a stake is down (`staked`), so the save it loaded predates the deal.
//
// THE CLOTH UNDER THE HAND (14.3): a press on the board is a cell (`pointer` - the table point under it, the frame's own
// lens); under a finger it snaps to the nearest of the player's pieces, the lit cells and the ringed foes within
// GAMBIT_SNAP_PX and STAGES - Move here, Strike, Drink, with Cancel - and with a fine pointer it acts at once. The keys
// and the pad walk a cell cursor (`key`): the arrows or the d-pad move it, Enter, Space or the pad's A press its cell,
// Escape or the pad's B cancel - and with nothing to cancel ask the Stand up press, which asks twice while a stake is
// down (a stray Escape forfeited the stake as a step off the seat does).
//
// Not a DFU member: Daggerfall Unity has no such game - the mod does. Ledger A row (THE KING'S GAMBIT).
import { GambitTableSession, gambitNightLeft, gambitPursesAfter, stakeOf, gambitCrownRestore, crownIndex, GAMBIT_CROWNS, GAMBIT_LOG_MAX, GAMBIT_STAKE_MULTS } from '../systems/gambitTableSession.js';
import { tierFor, GAMBIT_TIERS } from '../systems/gambitPatrons.js';
import { KG_POINT_BUDGET, KG_COLS, KG_ROWS, KG_KING_CELL, armyRefusal, armyCost, canRecruit, autoFill, rosterUnit, pieceById, pieceAt, reachable, foesInRange } from '../net/kingsGambit.js';
import { gambitHudModel, createGambitTableHud, boardCursorStep } from '../ui/gambitTableHud.js';
import {
  pieceName, unitJoined, unitLeft, unitTooDear, armyFull, refusalWords, logLine, resultGold,
  dealLine, barkInvite, barkEnd,
} from '../ui/gambitTableWords.js';
import { gambitPlaces } from '../world/gambitCloth.js';
import { createGambitTableDraw } from '../render/gambitTableDraw.js';
import { tablePoint } from '../world/cardHand.js';
import { BARK_MS } from '../world/cardRegulars.js';
import { rayDirFromScreen, projectToScreen } from '../player/tapRay.js';
import { goldAmount, deductGold, addGold } from '../systems/court.js';
import { getPref, setPref } from '../systems/uiPrefs.js';
import { KINGS_GAMBIT_KEY } from '../systems/features.js';
import { DPAD_CODES } from '../ui/plusPad.js';

/** THE FEATURES SWITCH (10.7): on by default; off, no card table offers the game. */
export const gambitTableOn = () => !!getPref(KINGS_GAMBIT_KEY);
/** A press that costs gold asks twice: the first arms it this long (ui/seatTab.js SEAT_RELINQUISH_ARM_MS's way). */
export const GAMBIT_ARM_MS = 4000;
/** Under a finger a press snaps to the nearest of the player's pieces, the lit cells and the ringed foes within this
 *  many CSS px (14.3 - fifteen columns across a 390 px screen are 26 px a column at best). */
export const GAMBIT_SNAP_PX = 22;
/** The keys and the pad on the board's cursor (14.3): a code to its step, its press or its cancel. */
export const GAMBIT_CURSOR_KEYS = Object.freeze({
  ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown',
  [DPAD_CODES.left]: 'ArrowLeft', [DPAD_CODES.right]: 'ArrowRight', [DPAD_CODES.up]: 'ArrowUp', [DPAD_CODES.down]: 'ArrowDown',
});
export const GAMBIT_PRESS_KEYS = Object.freeze(['Enter', 'NumpadEnter', 'Space', 'JoystickButton0']);
export const GAMBIT_CANCEL_KEYS = Object.freeze(['Escape', 'JoystickButton1']);

/** A REGULAR'S CROWN (10.4): the regular's seed's - the four in the deck's suit order, by the seed mod 4 - and the next
 *  round that order when it is the player's. @param {number} seed @param {string} mine the player's crown key */
export function regularCrown(seed, mine) {
  const i = (seed >>> 0) % GAMBIT_CROWNS.length;
  return GAMBIT_CROWNS[GAMBIT_CROWNS[i] === mine ? (i + 1) % GAMBIT_CROWNS.length : i];
}
/** THE REGULARS AT THIS TABLE (14.5): each free chair's regular at the tier their seed gives, in tier order, then by
 *  chair. @param {{name: string, seed: number, chair: number}[]} regulars */
export const gambitRegulars = (regulars) => regulars.map((r) => ({ ...r, tier: tierFor(r.seed) }))
  .sort((a, b) => GAMBIT_TIERS.indexOf(a.tier) - GAMBIT_TIERS.indexOf(b.tier) || a.chair - b.chair);

/**
 * The game, opened on the seat. Answers its handle: `press`, `frame`, `draw`, `pointer` (a press on the cloth), `key`
 * (the board's cursor), `regularsNow` (who sits in the chairs, and what they say), `playing`, `staked`, `close`.
 * @param {{doc?: any, renderer: any, entity: any, say: (t: string) => void, holdCursor: () => (() => boolean), relock?: () => void,
 *   rand32: () => number, now: () => number, day: number|(() => number), key: string, friendly: boolean,
 *   regulars: {name: string, seed: number, chair: number}[], frame: any, mySeatFeet: number[], touch?: () => boolean,
 *   onHoldem: () => void, onIliac: () => void, onStand: () => void}} d
 */
export function openGambitTableGame(d) {
  const today = () => (typeof d.day === 'function' ? d.day() : d.day);
  const touch = () => !!d.touch?.();
  const g = {
    phase: /** @type {'setup'|'army'|'battle'|'over'} */ ('setup'), closed: false,
    regs: gambitRegulars(d.regulars), regular: /** @type {number|null} */ (null), stakeMult: /** @type {number|null} */ (null),
    crown: gambitCrownRestore(d.entity?.gambitCrown), army: /** @type {number[]} */ ([]), pressed: /** @type {number|null} */ (null), said: /** @type {string|null} */ (null),
    session: /** @type {GambitTableSession|null} */ (null), game: /** @type {any} */ (null), settled: false,
    selected: /** @type {number|null} */ (null), staged: /** @type {any} */ (null), info: /** @type {any} */ (null), cursor: /** @type {number[]|null} */ (null),
    why: /** @type {string|null} */ (null), armed: /** @type {'forfeit'|'stand'|null} */ (null), armedAt: 0,
    wordsOpen: false, armiesOpen: false, more: false, log: /** @type {string[]} */ ([]),
    barks: new Map(), places: gambitPlaces(d.frame, d.mySeatFeet), look: /** @type {any} */ (null), cam: /** @type {any} */ (null),
    draw: createGambitTableDraw(d.renderer, { doc: d.doc }), hud: /** @type {any} */ (null), release: d.holdCursor(),
  };
  // HOW IT WORKS stands open until the player - not the character: a preference - has finished one game; their own
  // fold or unfold holds from then on (14.4)
  const guideOpen = () => { const v = getPref('gambitGuideOpen'); return typeof v === 'boolean' ? v : !getPref('gambitPlayed'); };
  const purse = () => goldAmount(d.entity);
  /** A regular's row as the panel reads it: what is left of their night, and whether they play for fun tonight. */
  const rows = () => g.regs.map((r) => {
    const nightLeft = d.friendly ? 0 : gambitNightLeft(d.entity.gambitPurses, d.key, today(), r.name, r.tier);
    return { ...r, nightLeft, forFun: !d.friendly && nightLeft < r.tier.stake };
  });
  const chosen = () => (g.regular != null ? rows()[g.regular] ?? null : null);
  /** The stake the setup has chosen, as it stands now: 0 for fun, or null when no lawful pick is down. */
  const stakeNow = () => {
    const r = chosen();
    if (!r) return null;
    if (d.friendly || r.forFun) return 0;
    const gold = stakeOf(r.tier, g.stakeMult ?? 0);
    return gold > 0 && gold <= purse() && gold <= r.nightLeft ? gold : null;
  };
  const nameOf = (/** @type {number} */ id) => g.game?.names.get(id) ?? '?';
  const model = () => {
    const s = g.session;
    return gambitHudModel({
      phase: g.phase, regulars: rows(), regular: g.regular, friendly: d.friendly, purse: purse(), stakeMult: g.stakeMult, crown: g.crown,
      army: g.army, pressed: g.pressed, said: g.said,
      game: s && g.game ? { state: s.state, crowns: g.game.crowns, name: g.game.name, stake: g.game.stake, over: s.shown ? s.over : null, dealt: g.game.dealt, nightSpent: g.game.nightSpent } : null,
      selected: g.selected, staged: g.staged, info: g.info, why: g.why, armed: g.armed,
      guideOpen: guideOpen(), wordsOpen: g.wordsOpen, armiesOpen: g.armiesOpen, log: g.log, touch: touch(), more: g.more,
    });
  };
  /** The board's look on the cloth (render/gambitTableDraw.js paintGambitMat), read off the panel's own marks. */
  const lookOf = (/** @type {any} */ m) => {
    const st = g.session?.state;
    if (!st || !m.battle && !m.result) return st ? { layout: st.layout, tiles: st.tiles, hazards: st.hazards, pieces: st.pieces.map(pieceLook), selected: null, lit: [], range: [], targets: [], cursor: null, staged: null } : null;
    const b = m.battle;
    return {
      layout: st.layout, tiles: st.tiles, hazards: st.hazards, pieces: st.pieces.map(pieceLook),
      selected: b?.selected ?? null, lit: b?.lit ?? [], range: b?.range ?? [], targets: b?.targets ?? [],
      cursor: g.phase === 'battle' ? g.cursor : null, staged: b?.staged && b.staged.kind === 'move' ? { col: b.staged.col, row: b.staged.row } : null,
    };
  };
  const paint = () => {
    if (g.closed) return;
    const m = model();
    g.look = g.phase === 'battle' || g.phase === 'over' ? lookOf(m) : null;
    g.hud.render(m);
  };

  // ── THE GAME ───────────────────────────────────────────────────────────────────────────────────────────────────

  /** A bark over a regular's head (CARDS4b's layer). */
  const bark = (/** @type {string} */ name, /** @type {string} */ text, /** @type {number} */ now) => { if (name && text) g.barks.set(name, { text, until: now + BARK_MS }); };
  /** THE DEAL: the stake read again at the press (the purse may have shrunk since it was chosen), the session dealt,
   *  the gold taken and held by the table. */
  function deal(/** @type {number} */ now) {
    const r = chosen();
    const no = armyRefusal(g.army);
    if (!r) { g.phase = 'setup'; paint(); return; }
    if (no) { g.why = refusalWords(no); paint(); return; }
    const stake = stakeNow();
    if (stake === null) { g.phase = 'setup'; g.stakeMult = null; paint(); return; }   // the pick no longer stands: chosen again, said by the next step
    const session = new GambitTableSession({ army: g.army.slice(), regular: { name: r.name, seed: r.seed, tier: r.tier }, stake, rand32: d.rand32, now });
    if (session.over) { g.why = refusalWords('rand'); paint(); return; }   // the table could not deal: nothing taken
    if (stake > 0) deductGold(d.entity, stake);
    const st = session.state;
    const crowns = [g.crown, regularCrown(r.seed, g.crown)];
    g.session = session;
    g.settled = false;
    g.game = {
      stake, regular: r.name, name: r.name, tier: r.tier, crowns,
      dealt: [0, 1].map((s) => st.pieces.filter((p) => p.side === s).length),
      names: new Map(st.pieces.map((p) => [p.id, pieceName(p, crowns)])),   // a fallen piece is still said by name
      nightSpent: false,
    };
    g.phase = 'battle';
    g.selected = null; g.staged = null; g.info = null; g.why = null; g.armed = null; g.more = false; g.log = [];
    const king = st.pieces.find((p) => p.side === 0 && p.king);
    g.cursor = king ? [king.col, king.row] : KG_KING_CELL.slice();
    d.say(dealLine(r.name, stake));
    pump(now);
  }
  /** The session's events into the log, the game settled the moment it is decided, the result shown after its beat. */
  function pump(/** @type {number} */ now) {
    const s = g.session;
    if (!s) return false;
    const events = s.drain();
    for (const e of events) {
      const line = logLine(e, { regular: g.game.name, names: nameOf });
      if (line) g.log.push(line);
      if (e.t === 'decided') settle(now);
    }
    g.log = g.log.slice(-GAMBIT_LOG_MAX);
    if (events.length) {
      // a selection the game took away - its piece fallen, the turn passed - is let go
      const st = s.state;
      const sel = g.selected != null ? pieceById(st, g.selected) : null;
      if (!sel || st.turn !== 0 || st.ending || st.over) { g.selected = null; g.staged = null; }
      if (g.info?.piece != null && !pieceById(st, g.info.piece)) g.info = null;
    }
    if (s.shown && g.phase === 'battle') { g.phase = 'over'; g.armed = null; g.staged = null; g.selected = null; g.more = false; }
    return events.length > 0;
  }
  /** THE GOLD, once decided: the table pays out (a win's pot, or a stake that did not stand), the regular's night
   *  booked - a game for fun touches neither. The player has finished a game: the guide folds from now (14.4). */
  function settle(/** @type {number} */ now) {
    const s = g.session;
    if (!s?.over || g.settled) return;
    g.settled = true;
    const r = g.game;
    const gold = s.settlement() ?? { pay: 0, net: 0 };
    if (gold.pay > 0) addGold(d.entity, gold.pay);
    if (!d.friendly && r.stake > 0 && gold.net !== 0) {
      d.entity.gambitPurses = gambitPursesAfter(d.entity.gambitPurses, d.key, today(), r.name, gold.net);
      r.nightSpent = gold.net > 0 && gambitNightLeft(d.entity.gambitPurses, d.key, today(), r.name, r.tier) < r.tier.stake;
    }
    if (s.over.by !== 'void') d.say(resultGold(s.over, r.stake, r.name));
    if (s.over.winner !== null) bark(r.name, barkEnd(s.over.winner === 1, (d.rand32() >>> 0) / 2 ** 32), now);
    if (s.over.by === 'king' || s.over.by === 'forfeit') setPref('gambitPlayed', true);
  }
  /** The player's command (side 0): taken, or its refusal said. */
  function act(/** @type {any} */ cmd, /** @type {number} */ now) {
    const s = g.session;
    if (!s?.playing()) return;
    const piece = cmd.piece != null ? nameOf(cmd.piece) : '';
    const target = cmd.target != null ? nameOf(cmd.target) : '';
    const no = s.act(cmd, now);
    g.staged = null;
    if (no) { g.why = refusalWords(no, { piece, target }); return; }
    g.why = null;
    pump(now);
  }

  // ── THE PRESSES ────────────────────────────────────────────────────────────────────────────────────────────────

  /** A cell pressed on the board (the cloth, the cursor): the mod's OnCellClicked - select one's own piece, move to a
   *  lit cell, strike a ringed foe - staged under a finger, at once with a fine pointer; any other cell or piece is
   *  shown in the information box. */
  function cellPress(/** @type {number[]} */ cell, /** @type {boolean} */ stage, /** @type {number} */ now) {
    const s = g.session, st = s?.state;
    if (!st || g.phase !== 'battle') return;
    const [c, r] = cell;
    g.cursor = [c, r];
    const mine = s.playing() && st.turn === 0 && !st.ending;
    const sel = g.selected != null ? pieceById(st, g.selected) : null;
    const pc = pieceAt(st, c, r);
    if (pc && pc.side === 0) {
      g.info = { piece: pc.id }; g.staged = null;
      g.selected = mine ? (g.selected === pc.id ? null : pc.id) : null;
      return;
    }
    if (pc && sel && mine && foesInRange(st, sel).some((x) => x.id === pc.id)) {
      g.info = { piece: pc.id };
      if (stage) g.staged = { kind: 'attack', target: pc.id };
      else act({ type: 'attack', piece: sel.id, target: pc.id }, now);
      return;
    }
    if (!pc && sel && mine && reachable(st, sel).some(([x, y]) => x === c && y === r)) {
      if (stage) { g.staged = { kind: 'move', col: c, row: r }; g.info = { cell: [c, r] }; }
      else act({ type: 'move', piece: sel.id, col: c, row: r }, now);
      return;
    }
    g.info = pc ? { piece: pc.id } : { cell: [c, r] };
    g.staged = null;
    if (!pc) g.selected = null;   // an empty cell out of reach lets the piece go (the mod's)
  }
  /** @param {string} id @param {any} [value] */
  function press(id, value) {
    if (g.closed) return;
    const now = d.now();
    // A PRESS THAT COSTS GOLD ASKS TWICE (14.3): any other press disarms the first
    if (id !== 'say' && id !== g.armed) g.armed = null;
    if (id === 'say') { g.why = typeof value === 'string' ? value : null; paint(); return; }
    if (id === 'guide') { setPref('gambitGuideOpen', !!value); paint(); return; }   // the reader's own fold, kept (14.4)
    if (id === 'words') { g.wordsOpen = !!value; paint(); return; }
    if (id === 'armies') { g.armiesOpen = !!value; paint(); return; }
    if (id === 'holdem') { d.onHoldem(); return; }
    if (id === 'iliac') { d.onIliac(); return; }
    if (id === 'stand') {
      if (g.session?.playing() && g.armed !== 'stand') { g.armed = 'stand'; g.armedAt = now; paint(); return; }
      d.onStand();   // a game under way is forfeited by the close (every road off the seat)
      return;
    }
    g.why = null;
    if (g.phase === 'setup') setupPress(id, value, now);
    else if (g.phase === 'army') armyPress(id, value, now);
    else if (g.phase === 'battle') battlePress(id, value, now);
    else overPress(id, now);
    paint();
  }
  function setupPress(/** @type {string} */ id, /** @type {any} */ value, /** @type {number} */ now) {
    if (id === 'regular' && Number.isInteger(value) && g.regs[value]) {
      if (g.regular !== value) { g.regular = value; g.stakeMult = null; bark(g.regs[value].name, barkInvite(), now); }
    } else if (id === 'stake' && GAMBIT_STAKE_MULTS.includes(value)) g.stakeMult = value;
    else if (id === 'crown' && Number.isInteger(value) && GAMBIT_CROWNS[value]) { g.crown = GAMBIT_CROWNS[value]; d.entity.gambitCrown = g.crown; }
    else if (id === 'next' && stakeNow() !== null) g.phase = 'army';
  }
  function armyPress(/** @type {string} */ id, /** @type {any} */ value, /** @type {number} */ now) {
    if (id === 'unit' && rosterUnit(value)) {
      g.pressed = value;
      if (canRecruit(g.army, value)) { g.army = [...g.army, value]; g.said = unitJoined(value); return; }
      // why not, as the law words it: a thirteenth unit, or points the army no longer has
      g.said = armyRefusal([...g.army, value]) === 'units' ? armyFull() : unitTooDear(value, KG_POINT_BUDGET - armyCost(g.army));
      g.why = g.said;
    } else if (id === 'remove' && Number.isInteger(value) && g.army[value] != null) {
      const gone = g.army[value];
      g.army = g.army.filter((_, k) => k !== value);
      g.said = unitLeft(gone);
    } else if (id === 'autofill') {
      const filled = autoFill(g.army, KG_POINT_BUDGET, d.rand32);
      if (filled) { g.army = filled; g.said = null; } else g.why = refusalWords('rand');
    } else if (id === 'clear') { g.army = []; g.said = null; }
    else if (id === 'back') g.phase = 'setup';
    else if (id === 'start') deal(now);
  }
  function battlePress(/** @type {string} */ id, /** @type {any} */ value, /** @type {number} */ now) {
    const s = g.session, st = s?.state;
    if (!st) return;
    if (id === 'piece' && Number.isInteger(value)) {
      const pc = pieceById(st, value);
      if (pc) cellPress([pc.col, pc.row], true, now);   // a row is the panel's - a strike from it is staged, never at once
    } else if (id === 'cell' && Array.isArray(value)) cellPress(value, touch(), now);
    else if (id === 'move' && g.staged?.kind === 'move' && g.selected != null) act({ type: 'move', piece: g.selected, col: g.staged.col, row: g.staged.row }, now);
    else if (id === 'strike' && g.staged?.kind === 'attack' && g.selected != null) act({ type: 'attack', piece: g.selected, target: g.staged.target }, now);
    else if (id === 'cancel') { if (g.staged) g.staged = null; else { g.selected = null; g.info = null; } }
    else if (id === 'drink' && g.selected != null) act({ type: 'potion', piece: g.selected }, now);
    else if (id === 'end') act({ type: 'end' }, now);
    else if (id === 'more') g.more = !g.more;
    else if (id === 'forfeit') {
      if (!s.playing()) return;
      if (g.armed !== 'forfeit') { g.armed = 'forfeit'; g.armedAt = now; return; }
      g.armed = null;
      s.forfeit(now);
      pump(now);
    }
  }
  function overPress(/** @type {string} */ id, /** @type {number} */ now) {
    if (id === 'again') { g.phase = 'army'; deal(now); if (g.phase === 'army') g.phase = 'setup'; }   // a stake that no longer stands is chosen again
    else if (id === 'army') { g.phase = 'army'; g.session = null; g.game = null; g.look = null; }
    else if (id === 'regulars') { g.phase = 'setup'; g.session = null; g.game = null; g.look = null; g.stakeMult = null; }
  }

  // ── THE CLOTH AND THE KEYS ─────────────────────────────────────────────────────────────────────────────────────

  /** A PRESS ON THE CLOTH (14.3): `at` the press's CSS px on the canvas, `view` the canvas's size and the world strip
   *  (`{w, h, rect}`), `how` its pointer (`{touch, button}`). Answers whether the table took it - a press on the board,
   *  or anywhere on the table while a battle is on, is never the seat's swing or its step. */
  function pointer(/** @type {number[]} */ at, /** @type {{w: number, h: number, rect?: any}} */ view, /** @type {{touch?: boolean, button?: number}} */ how = {}) {
    if (g.closed || g.phase !== 'battle' || !g.cam || !g.session) return false;
    const { w, h, rect = null } = view, cam = g.cam;
    const ray = rayDirFromScreen(at[0], at[1], w, h, cam.proj, cam.view, cam.eye, rect);
    const p = ray ? tablePoint(cam.eye, ray, g.places.top) : null;
    if (!p || !onFelt(p)) return false;
    const now = d.now();
    g.armed = null;
    if ((how.button ?? 0) !== 0) { press('cancel'); return true; }   // another button on the table cancels - never the swing
    let cell = g.places.cellAt(p);
    if (how.touch) {
      // UNDER A FINGER: the nearest of the player's pieces, the lit cells and the ringed foes within GAMBIT_SNAP_PX
      const m = model();
      const st = g.session.state;
      const candidates = [...st.pieces.filter((x) => x.side === 0).map((x) => [x.col, x.row]), ...(m.battle?.lit ?? []), ...(m.battle?.targets ?? []).map((id) => { const x = pieceById(st, id); return x ? [x.col, x.row] : null; }).filter(Boolean)];
      let best = null, bestD = GAMBIT_SNAP_PX;
      for (const c of candidates) {
        const s = projectToScreen(g.places.at(c[0], c[1]), w, h, cam.proj, cam.view, rect);
        const dist = s.front ? Math.hypot(s.x - at[0], s.y - at[1]) : Infinity;
        if (dist <= bestD) { bestD = dist; best = c; }
      }
      cell = best ?? cell;
    }
    if (!cell) { paint(); return true; }   // the table round the board: taken, and nothing pressed
    g.why = null;
    cellPress(cell, !!how.touch, now);
    paint();
    return true;
  }
  /** Whether a table point lies on the felt (the board and the cloth round it). */
  const onFelt = (/** @type {number[]} */ p) => {
    const f = d.frame, a = [Math.sin(f.axisYaw), Math.cos(f.axisYaw)];
    const dx = p[0] - f.centre[0], dz = p[2] - f.centre[2];
    return Math.abs(dx * a[0] + dz * a[1]) <= f.halfLong && Math.abs(dx * a[1] - dz * a[0]) <= f.halfShort;
  };
  /** THE KEYS AND THE PAD ON THE BOARD (14.3): `code` a key's or a pad button's code. Answers whether it was taken. */
  function key(/** @type {string} */ code) {
    if (g.closed || g.phase !== 'battle' || !g.session) return false;
    const st = g.session.state;
    if (Object.hasOwn(GAMBIT_CURSOR_KEYS, code)) {
      g.cursor = boardCursorStep(g.cursor ?? KG_KING_CELL.slice(), GAMBIT_CURSOR_KEYS[code]);
      const pc = pieceAt(st, g.cursor[0], g.cursor[1]);
      g.info = pc ? { piece: pc.id } : { cell: g.cursor.slice() };
      g.armed = null;
      paint();
      return true;
    }
    if (GAMBIT_PRESS_KEYS.includes(code)) {
      g.armed = null;
      g.why = null;
      if (g.staged) press(g.staged.kind === 'move' ? 'move' : 'strike');
      else { cellPress(g.cursor ?? KG_KING_CELL.slice(), false, d.now()); paint(); }
      return true;
    }
    if (GAMBIT_CANCEL_KEYS.includes(code)) {
      if (g.staged || g.selected != null) press('cancel');
      else press('stand');   // nothing to cancel: the Stand up press - asked twice while a game is under way
      return true;
    }
    return false;
  }

  // ── THE FRAME ──────────────────────────────────────────────────────────────────────────────────────────────────

  function frame(/** @type {number} */ now) {
    if (g.closed) return;
    let changed = false;
    if (g.armed && now - g.armedAt >= GAMBIT_ARM_MS) { g.armed = null; changed = true; }
    if (g.session) { g.session.tick(now); changed = pump(now) || changed; }
    if (changed) paint();
  }

  const pieceLook = (/** @type {any} */ p) => ({ id: p.id, side: p.side, col: p.col, row: p.row, king: p.king, unit: p.unit });
  g.hud = createGambitTableHud({ onPress: press, doc: d.doc });
  paint();
  return {
    g, press, frame, pointer, key,
    /** The cloth's picture this frame (the room's own pass, after the decor): the board and its pieces; `cam` the
     *  frame's lens, kept for the next press on the cloth. */
    draw(/** @type {number} */ _now, /** @type {{proj: any, view: any, eye: number[]}} */ cam) {
      if (g.closed) return;
      if (cam) g.cam = { proj: cam.proj, view: Float32Array.from(cam.view), eye: cam.eye.slice() };
      if (!g.look) return;
      g.draw.draw({ places: g.places, look: g.look, crowns: g.game ? g.game.crowns.map(crownIndex) : [3, 0] });
    },
    /** The regulars in their chairs this frame - every free chair's, as the setup lists them - each with what they say. */
    regularsNow(/** @type {number} */ now) {
      return g.regs.map((r) => { const b = g.barks.get(r.name); return { name: r.name, seed: r.seed, chair: r.chair, say: b && now < b.until ? b.text : null }; });
    },
    /** The panel's box on the page (a press inside it is the panel's). */
    box: () => g.hud?.root?.getBoundingClientRect?.() ?? null,
    /** Whether a battle is under way (dealt and undecided). */
    playing: () => !g.closed && !!g.session?.playing(),
    /** Whether gold is down on the table - a stake held: the save waits on it, as on the Hold'em chips (5.7). */
    staked: () => !g.closed && !!g.session?.playing() && (g.game?.stake ?? 0) > 0,
    /** The game closes: a battle under way forfeited (the stake the regular's - every road off the seat), the panel,
     *  the draw and the cursor let go. `concede` false is a load's road: nothing settles (the save predates the deal).
     *  Once. */
    close({ concede = true } = {}) {
      if (g.closed) return;
      if (concede && g.session?.playing()) { g.session.forfeit(d.now()); pump(d.now()); }
      g.closed = true;
      g.hud?.destroy();
      g.draw?.destroy();
      if (g.release?.()) d.relock?.();
    },
  };
}

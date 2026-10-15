// @ts-check
// KG4 (2026-10-14, bible/11-Multiplayer/Kings-Gambit.md sections 10.1, 10.7 and 17): THE KING'S GAMBIT'S PIECES IN
// MOTION - pure, on the clock (performance.now()'s milliseconds), in the board's own cells (a column and a row, each a
// fraction where a piece is between cells): no renderer, no page. The host hands it the law's events as the session says
// them (`feed`) and asks it, each frame, where every card stands (`poses`); render/gambitTableDraw.js lays that on the
// cloth.
//
// THE MOD'S MOTION, CARRIED TO A STAND (10.1, every timing 2.10's, read off the mod's IL):
//   - THE WALK slides the stand cell to cell along the path the move took (net/kingsGambit.js reachPath, on the board
//     before the move - AUDIT KG C22) at MoveSpeed's 3.5 cells a second; the mod slides straight through what stands
//     between.
//   - A BLOW (the mod's attack visuals): its impact AttackTiming's default 0.2 s after the order (a card has no frames to
//     time it by); the LUNGE from 0.1 s before the impact, 0.28 s (LungeTime), sin-shaped, toward the foe - 0.15 of a
//     cell for a melee blow, 0.06 for a shot (lungeDir 0.5 or 0.2, times EffectOffset's 0.3; AUDIT KG C8). A SHOT's bolt
//     flies from the impact for 0.3 s (ProjectileTime) and lands then.
//   - THE HIT, from the moment a blow lands: 0.45 s (HitTime) - EffectOffset's knock of 0.22 of a cell along the blow,
//     dying away, and its jitter (sin 55k, cos 47k over the hit's share k) of 4 px on the mod's cell - (1080 - 190) / 13
//     px at a 1080-line screen, so 0.058 of a cell; none under reduced motion (14.8). The face flashes red the while.
//   - A POTION'S GLOW, 0.6 s (HealTime), green.
//   - A NUMBER rises 0.8 of a cell over 1 s (FloatTime) from where it was struck: "-8" a loss, "+30" a heal.
//   - THE FALL: 0.27 s after the blow lands (the mod's DeathFade's start), the card topples flat away from its attacker,
//     then slides to its owner's FALLEN PILE beside the board (10.1: the mod's 0.6 s fade becomes the fall and the slide,
//     together 0.6 s), where it lies counted.
//   - THE MUSTER: at the deal each side's cards are thrown onto the board from its owner's edge, the king first, then
//     every unit in the deployment's order (section 2.4), one each GAMBIT_MUSTER_BEAT_S (MEASURE, first guess 0.12 s),
//     each on Iliac Hand's throw (world/iliacCloth.js ILIAC_THROW_S) and stood up in its stand as it lands.
// A piece's motions queue: a second order given while the first still moves it waits for it, and a blow's foe is struck
// after its attacker has come.
//
// Not a DFU member: Daggerfall Unity has no such game - the mod does. Ledger A row (THE KING'S GAMBIT).
import { KG_COLS, KG_ROWS, reachPath } from '../net/kingsGambit.js';
import { ILIAC_THROW_S } from './iliacCloth.js';

/** MoveSpeed: cells a second. */
export const GAMBIT_WALK_CELLS_S = 3.5;
/** AttackTiming's defaults: the blow's impact after the order, and the lunge's lead before it (s). */
export const GAMBIT_IMPACT_S = 0.2;
export const GAMBIT_LUNGE_LEAD_S = 0.1;
/** LungeTime (s), and the lunge's reach in cells - a melee blow's and a shot's. */
export const GAMBIT_LUNGE_S = 0.28;
export const GAMBIT_LUNGE_MELEE = 0.15;
export const GAMBIT_LUNGE_SHOT = 0.06;
/** ProjectileTime (s): a bolt's flight. */
export const GAMBIT_SHOT_S = 0.3;
/** HitTime (s), the knock (cells) and the jitter (cells: the mod's 4 px on its cell at a 1080-line screen). */
export const GAMBIT_HIT_S = 0.45;
export const GAMBIT_KNOCK = 0.22;
export const GAMBIT_SHAKE = 4 / ((1080 - 190) / 13);
/** HealTime (s). */
export const GAMBIT_GLOW_S = 0.6;
/** FloatTime (s) and the rise (cells). */
export const GAMBIT_FLOAT_S = 1;
export const GAMBIT_FLOAT_RISE = 0.8;
/** The fall: from this long after the blow lands (s), the topple, then the slide to the pile - together DeathFade's 0.6 s. */
export const GAMBIT_FALL_AFTER_S = 0.27;
export const GAMBIT_TOPPLE_S = 0.25;
export const GAMBIT_PILE_SLIDE_S = 0.35;
/** MEASURE (KG4): the beat between the muster's throws (s). */
export const GAMBIT_MUSTER_BEAT_S = 0.12;
/** Where a thrown card comes from: this many cells past its owner's edge of the board. */
export const GAMBIT_THROW_FROM = 2.5;

const MS = 1000;
const clamp01 = (/** @type {number} */ x) => Math.max(0, Math.min(1, x));
/** The sideways of a step: a direction's unit vector in cells, or none. */
const unit = (/** @type {number} */ dc, /** @type {number} */ dr) => { const m = Math.hypot(dc, dr); return m > 0 ? [dc / m, dr / m] : [0, 0]; };

/**
 * THE FALLEN PILE of `side` on this lay: `[col, row]` in the board's cells, off the board on its owner's right hand at its
 * own edge (the Hold'em muck's way) - past the board's side from a long side, past its end from an end, where the felt
 * has the room (world/gambitCloth.js gambitPlaces: from an end the board fills the felt's width).
 * @param {boolean} end the host sits at the table's end @param {number} side
 */
export function gambitPile(end, side) {
  if (end) return side === 0 ? [KG_COLS - 2, KG_ROWS + 1.4] : [1, -2.4];
  return side === 0 ? [KG_COLS + 1.2, KG_ROWS - 2] : [-2.2, 1];
}

/** The step from one card of `side`'s pile to the next (cells): along the board's edge, away from its corner, so the
 *  pile's cards lie fanned and their count reads at a glance. @param {boolean} end @param {number} side */
export function gambitPileStep(end, side) {
  if (end) return side === 0 ? [-0.22, 0] : [0.22, 0];
  return side === 0 ? [0, -0.22] : [0, 0.22];
}

/**
 * The motion of one game's pieces. `feed(events, now, state)` takes what the session said (its events, each with its
 * clock `at`; `state` the law's state after them); `poses(state, now, opts)` answers the picture; `reset()` forgets it all.
 */
export function createGambitMotion() {
  /** What each piece was when last seen: the board before the next events. @type {Map<number, any>} */
  const known = new Map();
  /** @type {any} */ let tiles = null;
  /** Each piece's motions, in their order: `{kind, from, to, ...}` in ms. @type {Map<number, any[]>} */
  const moves = new Map();
  /** The fallen: id -> `{piece, at, dir, pile, index}` (the fall starts `at`). @type {Map<number, any>} */
  const fallen = new Map();
  /** The muster: id -> the throw's start. @type {Map<number, number>} */
  const throws = new Map();
  /** @type {any[]} */ let floats = [];
  /** @type {any[]} */ let shots = [];
  const piles = [0, 0];
  /** @type {boolean} */ let end = false;
  /** When a piece's last motion ends (ms). */
  const busy = (/** @type {number} */ id) => { const l = moves.get(id); return l?.length ? l[l.length - 1].until : -Infinity; };
  const push = (/** @type {number} */ id, /** @type {any} */ m) => { const l = moves.get(id) ?? []; l.push(m); moves.set(id, l); return m; };
  const see = (/** @type {any} */ state) => {
    if (!state) return;
    tiles = state.tiles;
    for (const p of state.pieces) known.set(p.id, { ...p });
  };
  /** A blow lands on `id` at `at` from direction `dir` (cells); `killed` it falls. */
  const strike = (/** @type {number} */ id, /** @type {number} */ at, /** @type {number[]} */ dir, /** @type {number} */ damage, /** @type {boolean} */ killed) => {
    const p = known.get(id);
    if (!p) return;
    push(id, { kind: 'hit', from: at, until: at + GAMBIT_HIT_S * MS, dir });
    floats.push({ col: p.col, row: p.row, text: `-${damage}`, at });
    if (killed && !fallen.has(id)) {
      const pile = gambitPile(end, p.side);
      fallen.set(id, { piece: { ...p }, at: at + GAMBIT_FALL_AFTER_S * MS, dir, pile, index: piles[p.side]++ });
    }
  };
  return {
    /** The lay: whether the host sits at an end (where the piles lie). @param {boolean} isEnd */
    lay(isEnd) { end = !!isEnd; },
    /** @param {any[]} events @param {number} now @param {any} state */
    feed(events, now, state) {
      for (const e of events) {
        const at = Number.isFinite(e.at) ? e.at : now;
        if (e.t === 'game') {
          // THE MUSTER: each side's king first, then its units in the deployment's order - the law's own
          known.clear(); moves.clear(); fallen.clear(); throws.clear(); floats = []; shots = []; piles[0] = piles[1] = 0;
          see(state);
          for (const side of [0, 1]) {
            const mine = (state?.pieces ?? []).filter((/** @type {any} */ p) => p.side === side);
            const order = [...mine.filter((/** @type {any} */ p) => p.king), ...mine.filter((/** @type {any} */ p) => !p.king)];
            order.forEach((/** @type {any} */ p, i) => throws.set(p.id, at + i * GAMBIT_MUSTER_BEAT_S * MS));
          }
          for (const [id, t0] of throws) push(id, { kind: 'throw', from: t0, until: t0 + ILIAC_THROW_S * MS });
        } else if (e.t === 'move') {
          const p = known.get(e.piece);
          if (!p) continue;
          const board = { tiles, hazards: [], pieces: [...known.values()].filter((x) => !fallen.has(x.id) || x.id === p.id) };
          const path = (tiles && reachPath(board, { ...p, col: e.from[0], row: e.from[1] }, e.to[0], e.to[1])) ?? [e.from, e.to];
          const from = Math.max(at, busy(p.id));
          push(p.id, { kind: 'walk', from, until: from + ((path.length - 1) / GAMBIT_WALK_CELLS_S) * MS, path });
          p.col = e.to[0]; p.row = e.to[1];
        } else if (e.t === 'attack') {
          const a = known.get(e.piece), t = known.get(e.target);
          if (!a || !t) continue;
          const from = Math.max(at, busy(a.id));
          const dir = unit(t.col - a.col, t.row - a.row);
          const impact = from + GAMBIT_IMPACT_S * MS;
          push(a.id, { kind: 'lunge', from: impact - GAMBIT_LUNGE_LEAD_S * MS, until: impact - GAMBIT_LUNGE_LEAD_S * MS + GAMBIT_LUNGE_S * MS, dir, reach: e.shot ? GAMBIT_LUNGE_SHOT : GAMBIT_LUNGE_MELEE });
          const lands = e.shot ? impact + GAMBIT_SHOT_S * MS : impact;
          if (e.shot) shots.push({ from: [a.col, a.row], to: [t.col, t.row], at: impact });
          strike(t.id, Math.max(lands, busy(t.id)), dir, e.damage, !!e.killed);
        } else if (e.t === 'potion') {
          const p = known.get(e.piece);
          if (!p) continue;
          const from = Math.max(at, busy(p.id));
          push(p.id, { kind: 'glow', from, until: from + GAMBIT_GLOW_S * MS });
          floats.push({ col: p.col, row: p.row, text: `+${e.healed}`, at: from });
        } else if (e.t === 'hazard') {
          const p = known.get(e.piece);
          if (p) strike(p.id, Math.max(at, busy(p.id)), [0, 0], e.damage, !!e.killed);
        }
      }
      see(state);
    },
    /**
     * THE PICTURE at `now`: `{pieces, floats, shots, piles}` - each piece `{id, side, king, unit, hp, maxHp, at: [col,
     * row], tip: [dc, dr] (the lunge, cells, at the card's top), shake: [dc, dr] (cells), flash, glow, thrown: null |
     * {k, from: [col, row]}, fall: null | {k, dir}, pile: null | {k, at: [col, row], index}}`; a float `{at: [col, row],
     * rise (cells), text, k}`; a shot `{at: [col, row], k}` (its four squares the draw lays behind it). `reduced` (reduced
     * motion) leaves the shake out.
     * @param {any} state @param {number} now @param {{reduced?: boolean}} [opts]
     */
    poses(state, now, { reduced = false } = {}) {
      /** @type {any[]} */ const out = [];
      const lay = (/** @type {any} */ p, /** @type {any} */ fall) => {
        const list = moves.get(p.id) ?? [];
        let at = [p.col, p.row], tip = [0, 0], shake = [0, 0], flash = false, glow = false, thrown = null;
        // the walk: where the walk under way stands now; a walk still to come starts from its first cell
        const walk = list.filter((m) => m.kind === 'walk' && m.until > now)[0];
        if (walk) {
          const n = walk.path.length - 1, s = clamp01((now - walk.from) / Math.max(1, walk.until - walk.from)) * n;
          const i = Math.min(n - 1, Math.floor(s)), f = s - i;
          const a = walk.path[i], b = walk.path[i + 1] ?? a;
          at = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        }
        for (const m of list) {
          if (now < m.from || now >= m.until) continue;
          const k = (now - m.from) / (m.until - m.from);
          if (m.kind === 'lunge') { const s = Math.sin(k * Math.PI) * m.reach; tip = [m.dir[0] * s, m.dir[1] * s]; }
          else if (m.kind === 'hit') {
            flash = true;
            if (!reduced) {
              const left = 1 - k;
              shake = [m.dir[0] * GAMBIT_KNOCK * left + Math.sin(k * 55) * GAMBIT_SHAKE * left, m.dir[1] * GAMBIT_KNOCK * left + Math.cos(k * 47) * GAMBIT_SHAKE * left];
            }
          } else if (m.kind === 'glow') glow = true;
        }
        const t0 = throws.get(p.id);
        if (t0 !== undefined && now < t0) return null;   // not dealt yet
        if (t0 !== undefined && now < t0 + ILIAC_THROW_S * MS) {
          const edge = p.side === 0 ? KG_ROWS - 1 + GAMBIT_THROW_FROM : -GAMBIT_THROW_FROM;
          thrown = { k: clamp01((now - t0) / (ILIAC_THROW_S * MS)), from: [p.col, edge] };
        }
        return { id: p.id, side: p.side, king: p.king, unit: p.unit, hp: p.hp, maxHp: p.maxHp, at, tip, shake, flash, glow, thrown, fall, pile: null };
      };
      for (const p of state?.pieces ?? []) { const x = lay(p, null); if (x) out.push(x); }
      // the fallen: struck, toppling, sliding to the pile, then lying in it
      for (const [, f] of fallen) {
        if (now < f.at) { const x = lay(f.piece, null); if (x) out.push(x); continue; }   // still standing until its fall
        const k = clamp01((now - f.at) / (GAMBIT_TOPPLE_S * MS));
        const s = clamp01((now - f.at - GAMBIT_TOPPLE_S * MS) / (GAMBIT_PILE_SLIDE_S * MS));
        const x = lay(f.piece, { k, dir: f.dir });
        if (!x) continue;
        if (now >= f.at + GAMBIT_TOPPLE_S * MS) x.pile = { k: s, at: f.pile, index: f.index };
        out.push(x);
      }
      const fl = floats.filter((f) => now >= f.at && now < f.at + GAMBIT_FLOAT_S * MS)
        .map((f) => { const k = (now - f.at) / (GAMBIT_FLOAT_S * MS); return { at: [f.col, f.row], rise: GAMBIT_FLOAT_RISE * k, text: f.text, k }; });
      const sh = shots.filter((s) => now >= s.at && now < s.at + GAMBIT_SHOT_S * MS)
        .map((s) => { const k = (now - s.at) / (GAMBIT_SHOT_S * MS); return { at: [s.from[0] + (s.to[0] - s.from[0]) * k, s.from[1] + (s.to[1] - s.from[1]) * k], from: s.from, to: s.to, k }; });
      return { pieces: out, floats: fl, shots: sh, piles: [piles[0], piles[1]] };
    },
    /** Whether anything still moves at `now` - the draw's reason to draw again. @param {number} now */
    moving(now) {
      for (const l of moves.values()) if (l.some((m) => now < m.until)) return true;
      for (const f of fallen.values()) if (now < f.at + (GAMBIT_TOPPLE_S + GAMBIT_PILE_SLIDE_S) * MS) return true;
      return floats.some((f) => now < f.at + GAMBIT_FLOAT_S * MS) || shots.some((s) => now < s.at + GAMBIT_SHOT_S * MS);
    },
    /** Forget the game (a new deal starts from its own muster). */
    reset() { known.clear(); moves.clear(); fallen.clear(); throws.clear(); floats = []; shots = []; piles[0] = piles[1] = 0; tiles = null; },
  };
}

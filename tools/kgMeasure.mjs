#!/usr/bin/env node
// KG2 (2026-10-13, bible/11-Multiplayer/Kings-Gambit.md section 12; the owner: "Do KG2"): THE TIERS, MEASURED - a
// regular of each tier (systems/gambitPatrons.js) dealt against an Auto-filled 300 and three potions, both seats played
// by the regulars' own rules (regularStep), the player's seat with no blunder unless asked; seeded, so every figure the
// record quotes is a command away.
//
// TWO GAMES THE REGULARS' RULES NEVER END, where a player at the table would, are counted apart:
//   'kings'  the two kings alone - the rules never walk a king at a foe (it moves only to flee one, or off a hazard), so
//            both stand where they are for good (every such game of the first runs stood to its cap);
//   'long'   past `--rounds` (200: no decided game of 1,200 measured ran past 68) - THE HAZARD DANCE, mostly: two pieces
//            across a cell with an active hazard on it, each stepping onto it to reach the other (in range, 50, less
//            the hazard's 40) and off it again on its turn's last action before it strikes (the escape comes before the
//            blow), turn after turn.
// The rounds a game took are averaged over the decided games alone.
//
//   node tools/kgMeasure.mjs                          # the record's run: 1,000 games a tier, seed 1
//   node tools/kgMeasure.mjs --games 200 --seed 7     # another sample
//   node tools/kgMeasure.mjs --player-blunder 0.15    # the player's seat blundering as a Seasoned regular does
import { isMain } from './lib/isMain.mjs';
import { KG_POINT_BUDGET, autoFill, finishTurn } from '../src/net/kingsGambit.js';
import { GAMBIT_TIERS, dealRegular, regularStep } from '../src/systems/gambitPatrons.js';

/** A xorshift32 source - the measure's own, seeded. @param {number} seed */
export const xorshift = (seed) => {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s; };
};

/** A game's seed in a sample: the sample's seed and the game's place in it, spread. */
export const gameSeed = (seed, g) => (Math.imul(seed, 1000003) + Math.imul(g, 7919) + 1) >>> 0;

/**
 * ONE GAME against a regular of `tier`, from `seed`: the player's army Auto-filled to KG_POINT_BUDGET, then the deal
 * (dealRegular), then turn after turn - each seat's actions by regularStep, the turn's end by finishTurn - one source for
 * all of it. Answers `{end, rounds}`: 'regular' or 'player' (who won), 'kings' (the two kings alone) or 'long'.
 * @param {{blunder: number, budget: number, potions: number}} tier @param {number} seed
 * @param {{playerBlunder?: number, rounds?: number}} [o]
 */
export function playRegular(tier, seed, { playerBlunder = 0, rounds = 200 } = {}) {
  const rnd = xorshift(seed);
  let st = dealRegular({ army: autoFill([], KG_POINT_BUDGET, rnd), tier, rand32: rnd });
  const player = { blunder: playerBlunder };
  while (!st.over) {
    if (st.round > rounds) return { end: 'long', rounds: st.round };
    if (st.pieces.every((p) => p.king)) return { end: 'kings', rounds: st.round };
    st = st.ending ? finishTurn(st, rnd).state : regularStep(st, st.turn, st.turn === 1 ? tier : player, rnd, rnd).state;
  }
  return { end: st.over.winner === 1 ? 'regular' : 'player', rounds: st.round };
}

/**
 * A TIER'S TALLY over `games` seeded games: `{regular, player, kings, long, rounds}` (rounds summed over the decided).
 * @param {{blunder: number, budget: number, potions: number}} tier
 * @param {{games?: number, seed?: number, playerBlunder?: number, rounds?: number}} [o]
 */
export function measureTier(tier, { games = 1000, seed = 1, ...opts } = {}) {
  const tally = { regular: 0, player: 0, kings: 0, long: 0, rounds: 0 };
  for (let g = 0; g < games; g++) {
    const r = playRegular(tier, gameSeed(seed, g), opts);
    tally[r.end]++;
    if (r.end === 'regular' || r.end === 'player') tally.rounds += r.rounds;
  }
  return tally;
}

/** The run: a line a tier. @param {string[]} argv */
function main(argv) {
  const arg = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 ? Number(argv[i + 1]) : dflt; };
  const games = arg('--games', 1000), seed = arg('--seed', 1), playerBlunder = arg('--player-blunder', 0), rounds = arg('--rounds', 200);
  if (![games, seed, playerBlunder, rounds].every(Number.isFinite) || games < 1) {
    console.error('usage: node tools/kgMeasure.mjs [--games N] [--seed S] [--player-blunder P] [--rounds R]');
    return 2;
  }
  console.log(`${games} games a tier, seed ${seed}, the player's seat blundering ${playerBlunder}`);
  const pct = (n, of) => `${(100 * n / of).toFixed(1)}%`.padStart(6);
  for (const tier of GAMBIT_TIERS) {
    const t = measureTier(tier, { games, seed, playerBlunder, rounds });
    const decided = t.regular + t.player;
    console.log(`${tier.key.padEnd(12)} regular ${pct(t.regular, games)}  player ${pct(t.player, games)}  kings alone ${pct(t.kings, games)}  long ${pct(t.long, games)}`
      + `  | of the decided: regular ${pct(t.regular, decided || 1)}, ${(t.rounds / (decided || 1)).toFixed(1)} rounds a game`);
  }
  return 0;
}

if (isMain(import.meta.url)) process.exitCode = main(process.argv.slice(2));

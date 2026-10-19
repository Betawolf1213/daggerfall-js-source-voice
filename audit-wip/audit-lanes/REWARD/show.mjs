// Print a quest's QBN as the game reads it with the questlines on (patched), with line numbers.
import { SNAP } from './_env.mjs';
const { questSource } = await import(`${SNAP}/test/qlSources.mjs`);
const name = process.argv[2]; const from = process.argv[3] ?? 'QBN:';
const lines = questSource(name, process.argv[4] !== 'off') ?? [];
const i = Math.max(0, lines.findIndex((l) => l.includes(from)));
lines.slice(i).forEach((l, k) => console.log(String(i + k + 1).padStart(4), l));

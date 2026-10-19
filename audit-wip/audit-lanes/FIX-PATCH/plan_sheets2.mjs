import { sheet, outcome, saveAll } from './editlib.mjs';
for (const [f, q] of [['merchants.json', 'K0C00Y05'], ['commoners.json', 'A0C01Y13'], ['mods.json', 'RRMSTARM2']]) delete sheet(f, q).success;
// RRMSTARM1: `done` holds whichever way the armorer heads - said as the success it is, not as the answers it lists
outcome(sheet('mods.json', 'RRMSTARM1'), 'done').on = { success: true };
saveAll();

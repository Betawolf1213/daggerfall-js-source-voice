// FIX-PATCH: the sheet files' changes - BRANCH-13, REWARD-6 / LAW-3, LAW-1, LAW-7, LAW-8, LAW-9 (see the report).
import { sheet, outcome, setSuccess, saveAll } from './editlib.mjs';
const FG = 'fightersGuild.json', KO = 'knightlyOrders.json', MG = 'magesGuild.json', TG = 'thievesGuild.json', DB = 'darkBrotherhood.json',
  HO = 'holyOrders.json', NO = 'nobility.json', ME = 'merchants.json', CO = 'commoners.json', VA = 'vampires.json', DA = 'daedra.json',
  MQ = 'mainQuest.json', MO = 'mods.json';

// BRANCH-13: the scroll burned and the relic kept are failures of the questor's errand - DFU's own failure, said so
Object.assign(outcome(sheet(ME, 'K0C01Y10'), 'burned'), { failure: true });
Object.assign(outcome(sheet(VA, 'P0B01L02'), 'kept'), { pay: 'none', failure: true });

// REWARD-6 / LAW-3: a pay the script can make - `own` where its own reward (a `get item`) is the reward, `none` where it pays nothing
const pay = (file, quest, ids, p) => { const s = sheet(file, quest); for (const id of ids) outcome(s, id).pay = p; };
pay(MQ, '_BRISIEN', ['met'], 'none');
pay(MQ, 'S0000008', ['emperor', 'sentinel', 'orsinium', 'underking', 'daggerfall'], 'own');
pay(MQ, 'S0000015', ['slain', 'claimed'], 'none');
pay(MQ, 'S0000015', ['tried'], 'own');
pay(MQ, 'S0000016', ['daggerfall', 'emperor', 'worms', 'orsinium', 'sentinel', 'underking', 'wayrest'], 'none');
pay(MQ, 'S0000018', ['soothed'], 'none');
pay(MQ, 'S0000020', ['read'], 'none');
pay(MQ, 'S0000022', ['spoke'], 'none');
for (const q of ['S0000100', 'S0000101', 'S0000102', 'S0000103', 'S0000104']) pay(MQ, q, ['over'], 'none');
pay(MQ, 'S0000503', ['shared', 'kept'], 'own');
pay(MQ, 'S0000977', ['lifted'], 'none');
pay(MQ, 'S0000988', ['revealed'], 'none');
pay(MQ, 'S0000999', ['done'], 'none');
pay(MQ, 'S0000002', ['overtaken'], 'own');
pay(MQ, 'S0000007', ['cured'], 'none');
pay(MG, 'N0B00Y17', ['searched', 'favour'], 'own');
pay(ME, 'K0C00Y04', ['told'], 'own');
pay(ME, 'K0C00Y09', ['slain'], 'own');

// LAW-1 (3): M0B11Y18 - the Queen has the letter and her hunt ran out of days: her man, not the traitor's
{
  const s = sheet(FG, 'M0B11Y18');
  const i = s.outcomes.findIndex((o) => o.id === 'failed');
  s.outcomes.splice(i, 0, { id: 'outrun', text: 'The Queen has the letter, but _traitor_ was never run to ground.', on: { all: [{ task: '_S.18_' }, { task: '_gettraitor_' }] }, pay: 'standard', standing: { Queen_Akorithi: 2 } });
}
// LAW-7: 40C00Y00 - `_S.06_` unsets what it waits on as it pays; `_bonk_` is the end that stays
Object.assign(outcome(sheet(DA, '40C00Y00'), 'both'), { on: { all: [{ task: '_S.17_' }, { task: '_bonk_' }] } });
Object.assign(outcome(sheet(DA, '40C00Y00'), 'done'), { on: { task: '_bonk_' } });
// LAW-8: $CUREWER - cured another way (the temple's Heal Curse, the witches' cure) before the hunt came
{
  const s = sheet(VA, '$CUREWER');
  const i = s.outcomes.findIndex((o) => o.id === 'failed');
  s.outcomes.splice(i, 0, { id: 'healed', text: 'You were cured of the curse another way, and _hunter_\'s hunt never came.', on: { all: [{ ended: true }, { not: { task: '_S.05_' } }] }, pay: 'own' });
}
// LAW-9: an outcome waits on the quest's pay, not on a deed done mid-quest - a timeout after it is DFU's failure
Object.assign(outcome(sheet(FG, 'M0B40Y05'), 'peace'), { on: { all: [{ task: '_victory_' }, { task: '_notkill_' }] } });
Object.assign(outcome(sheet(FG, 'M0B40Y05'), 'slain'), { on: { task: '_victory_' } });
Object.assign(outcome(sheet(KO, 'B0B81Y02'), 'artifact'), { on: { all: [{ task: '_S.33_' }, { task: '_success_' }] } });
Object.assign(outcome(sheet(KO, 'B0B81Y02'), 'refused'), { on: { all: [{ task: '_no_' }, { task: '_success_' }] } });
// A0C00Y16: five fates, none of them plain - the plain success has a row of its own
{
  const s = sheet(CO, 'A0C00Y16');
  const i = s.outcomes.findIndex((o) => o.id === 'failed');
  s.outcomes.splice(i, 0, { id: 'done', text: '_questgiver_ knows at last what became of _missingperson_.', on: { success: true }, pay: 'standard' });
}

// LAW-1 (2): the success fallback - the plain success, no choice, no betrayal (qlLaw.js fallbackOutcome)
const success = {
  [FG]: { M0B00Y17: 'tamed', M0B11Y18: 'loyal', M0B40Y05: 'slain' },
  [KO]: { B0B71Y03: 'artifact', B0B81Y02: 'slain' },
  [MG]: { N0B00Y09: 'loyal', N0B00Y17: 'found', N0B11Y18: 'slain', N0B21Y14: 'oracle' },
  [TG]: { O0A0AL00: 'joined', O0B00Y11: 'clean' },
  [DB]: { L0B00Y02: 'both' },
  [HO]: { C0B3XY09: 'destroyed', C0C00Y10: 'cured' },
  [NO]: { R0C10Y00: 'delivered', R0C10Y01: 'delivered', R0C10Y02: 'delivered', R0C10Y18: 'delivered', R0C11Y19: 'returned', R0C11Y28: 'ruler', R0C20Y22: 'delivered', R0C4XY23: 'delivered', R0C60Y24: 'delivered' },
  [ME]: { K0C00Y03: 'delivered', K0C00Y05: 'rescued', K0C00Y07: 'paid', K0C00Y09: 'alive', K0C01Y00: 'cousin', K0C30Y03: 'gold' },
  [CO]: { A0C00Y10: 'won', A0C00Y11: 'cured', A0C00Y14: 'delivered', A0C00Y15: 'delivered', A0C01Y06: 'slain', A0C01Y13: 'avenged', A0C10Y02: 'rescued', A0C10Y05: 'wed', A0C41Y18: 'destroyed' },
  [VA]: { $CUREVAM: 'cured', P0B00L06: 'clan' },
  [MQ]: { S0000001: 'told', S0000002: 'sealed', S0000003: 'lifted', S0000004: 'engaged', S0000005: 'alive', S0000006: 'delivered', S0000007: 'slain', S0000009: 'trap', S0000010: 'returned', S0000011: 'barenziah', S0000012: 'told', S0000013: 'read', S0000017: 'delivered', S0000021: 'soul', S0000500: 'freed', S0000501: 'slain' },
  [MO]: { RRMSTARM2: 'paid' },
};
for (const [file, m] of Object.entries(success)) for (const [q, id] of Object.entries(m)) setSuccess(sheet(file, q), id);
saveAll();
console.log('sheets written');

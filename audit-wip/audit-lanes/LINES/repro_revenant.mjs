// REPRO: introBay opens online at level 6 (qlLines.js), and its second step, QLIW02, waits on `ql act revenant-knelt`
// - said only by revenantFate.js beginYield for one of the player's own revenants. Online, revenants are HELD under
// Renown 10 (revenant.js RENOWN-GATE: revenantCandidate refuses every foe, none returns), so below Renown 10 the step
// can never finish: it fails at its 30-day clock and the runner offers it again, again.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { revenantHeld, REVENANT_MIN_RENOWN } = await import(SNAP + '/src/systems/revenant/revenant.js');
const { lineById } = await import(SNAP + '/src/systems/questlines/qlLines.js');
const { renownXpFor } = await import(SNAP + '/src/net/renown.js');
const bay = lineById('introBay');
console.log('introBay opens:', JSON.stringify(bay.opens), 'steps:', bay.steps.map((s) => s.quest).join(' '));
for (const renown of [1, 3, 6, 9, 10]) console.log(`online, Renown ${renown}: revenants held =`, revenantHeld({ online: true, renown }));
console.log('REVENANT_MIN_RENOWN', REVENANT_MIN_RENOWN, '- Renown XP to reach it:', renownXpFor(REVENANT_MIN_RENOWN));

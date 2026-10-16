// FINE-PEOPLE (FIELD BUGS 2026-10-16, bible/01-Overview/Field-Bugs-2026-10-16.md; the Discord's "Possible bug: Repeated
// ..." thread again, after FINE-MENDS: "I paid 2 x 600 gold today, and even though it said +5 reputation, my reputation
// didn't go up at all ... why I still have a penalty"; another: "It didn't work for me either"). A charge costs two names
// (court.js lowerRepForCrime, PlayerEntity.cs:2294-2298): the law's, and half of it off the region's People - spread up to
// the kingdom it hangs from, the Standing page's Kingdoms row, and read by every commoner's reaction (talk.js
// getReactionToPlayer). A sentence gives both back (raiseRepForSentence, REP2); the watch's fine (FINE-MENDS) and a
// temple's penance (REP4) mended the law's alone - the +5 the HUD said - and left the People and the kingdom the whole
// charge however much was paid. Now an answer short of the court gives the People half its points back too, spread as the
// charge spread, never past 0. Through the real watch (REP1's rig) and the real penance, over a faction tree carrying the
// field set FactionFile mints (test/court.test.js's own rule: never a thinner record).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { settleChallenge, doPenance, PENANCE_POINTS } from '../src/systems/standing.js';
import { createStandingWatch, STANDING_LOOK_MS, installLegalNotices } from '../src/scenes/standingHost.js';
import { createRegionConditions } from '../src/systems/regionConditions.js';
import { lowerRepForCrime, raiseRepForSentence, raisePeopleForAnswer, CRIMES, REPUTATION_LOSS_PER_CRIME } from '../src/systems/court.js';
import { FACTION_TYPES, SOCIAL_GROUPS, GUILD_GROUPS } from '../src/formats/factionFile.js';
import { createFactionRep, getReputation } from '../src/systems/factionRep.js';

const REGION = 3;
const KINGDOM = 201, PEOPLE = 518;   // FACTION.TXT's Daggerfall and People of Daggerfall
const FIELDS = ['id', 'parent', 'type', 'name', 'rep', 'summon', 'region', 'power', 'flags',
  'ruler', 'ally1', 'ally2', 'ally3', 'enemy1', 'enemy2', 'enemy3', 'face', 'race',
  'flat1', 'flat2', 'sgroup', 'ggroup', 'minf', 'maxf', 'vam', 'rank',
  'rulerNameSeed', 'rulerPowerBonus', 'children'];
const fac = (o) => { const b = {}; for (const k of FIELDS) b[k] = k === 'name' ? `f${o.id}` : k === 'children' ? null : 0; return Object.assign(b, o); };
/** The kingdom (a root, its People its child) and its People - the walk a crime's People half takes. */
const tree = () => createFactionRep(new Map([
  [KINGDOM, fac({ id: KINGDOM, parent: 0, type: FACTION_TYPES.Province, region: REGION, children: [PEOPLE] })],
  [PEOPLE, fac({ id: PEOPLE, parent: KINGDOM, type: FACTION_TYPES.People, sgroup: SOCIAL_GROUPS.Commoners, ggroup: GUILD_GROUPS.GeneralPopulace, region: REGION })],
]));
const charged = (crimes) => {
  const p = { legalRep: {}, goldPieces: 50_000, items: [], health: 50, regionConditions: createRegionConditions(), factionRep: tree() };
  for (const c of crimes) lowerRepForCrime(p, REGION, c);
  return p;
};
const names = (p) => [p.legalRep[REGION], getReputation(p.factionRep, PEOPLE), getReputation(p.factionRep, KINGDOM)];

function watchRig(p) {
  const t = { ms: 0, own: 5000, world: 5000 };
  const shown = [], said = [];
  const watch = createStandingWatch({
    playerEntity: p,
    townTalk: { showOverlay: (w) => shown.push(w), say: (l) => said.push(l) },
    arrestFlow: { inCourt: () => false, surrenderToChallenge: () => true },
    cityGuards: { guardSeesPlayer: () => ({ guard: true }) },
    guardPool: () => [], playerFeet: () => [0, 0, 0], regionIndex: () => REGION, regionName: () => 'Daggerfall',
    ownNow: () => t.own, worldNow: () => t.world, crimeResponse: () => {}, onStreet: () => true, blocked: () => false, clock: () => t.ms,
  });
  return { t, shown, said, look: () => { t.ms += STANDING_LOOK_MS; return watch.frame(); } };
}

test('FINE-PEOPLE: the reporter\'s fine - a murder and an assault charged (the law -28, the People and the kingdom -14), the watch\'s fine paid through the real stop: the law +5, the People and the kingdom +2 each, where the fine had left them whole; a second fine the same again', () => {
  const p = charged([CRIMES.Murder, CRIMES.Assault]);
  const law = REPUTATION_LOSS_PER_CRIME[CRIMES.Murder] + REPUTATION_LOSS_PER_CRIME[CRIMES.Assault];
  const half = Math.trunc(REPUTATION_LOSS_PER_CRIME[CRIMES.Murder] / 2) + Math.trunc(REPUTATION_LOSS_PER_CRIME[CRIMES.Assault] / 2);
  assert.deepEqual(names(p), [-law, -half, -half], 'the charge: two names, the kingdom taking the People\'s whole');
  const r = watchRig(p);
  const off = installLegalNotices({ playerEntity: p, say: (l) => r.said.push(l), regionName: () => 'Daggerfall' });
  try {
    assert.equal(r.look(), true, 'a known face, stopped');
    r.shown[0].input('KeyP');
    assert.match(r.said.join('\n'), /Your standing with the law of Daggerfall rises \(\+5\)\./);
    assert.deepEqual(names(p), [-law + 5, -half + 2, -half + 2], 'the People\'s half of the five, spread as the charge was');
    assert.equal(settleChallenge(p, REGION), PENANCE_POINTS);
    assert.deepEqual(names(p), [-law + 10, -half + 4, -half + 4]);
  } finally { off(); }
});

test('FINE-PEOPLE: a temple\'s penance gives the People half its points too; never past 0 - an answer mends a charge and buys no favour; a law mended by fewer points gives fewer back; no faction store, nothing thrown', () => {
  const p = charged([CRIMES.Assault]);   // the law -8, the People -4
  assert.equal(doPenance(p, REGION), PENANCE_POINTS);
  assert.deepEqual(names(p), [-8 + 5, -4 + 2, -4 + 2]);
  assert.equal(doPenance(p, REGION), 3, 'the law\'s last three');
  assert.deepEqual(names(p), [0, -1, -1], 'three points: the People one back (truncated, as the charge)');
  assert.equal(raisePeopleForAnswer(p, REGION, 5), 1, 'at most what the People are owed');
  assert.deepEqual(names(p).slice(1), [0, 0]);
  assert.equal(raisePeopleForAnswer(p, REGION, 5), 0, 'whole: nothing more');
  assert.deepEqual(names(p).slice(1), [0, 0]);
  p.factionRep.dict.get(PEOPLE).rep = 3;
  assert.equal(raisePeopleForAnswer(p, REGION, 5), 0, 'liked: neither more nor less');
  assert.equal(getReputation(p.factionRep, PEOPLE), 3);
  const near = charged([CRIMES.Murder]);   // the law -20, the People -10
  near.legalRep[REGION] = -12;
  assert.equal(settleChallenge(near, REGION), 2, 'two to the line');
  assert.deepEqual(names(near), [-10, -9, -9], 'the People half of two');
  const bare = { legalRep: { [REGION]: -20 }, items: [], regionConditions: createRegionConditions() };
  assert.equal(settleChallenge(bare, REGION), PENANCE_POINTS, 'no store: the law alone, as the charge');
  assert.equal(raisePeopleForAnswer(bare, REGION, 5), 0);
  assert.equal(raisePeopleForAnswer(p, REGION, 0), 0);
});

test('FINE-PEOPLE: the sentence\'s own refund is the yardstick and is unchanged - a served Pickpocketing gives the law and the People\'s half back whole (REP2)', () => {
  const p = charged([CRIMES.Pickpocketing]);
  raiseRepForSentence(p, { crime: CRIMES.Pickpocketing, regionIndex: REGION });
  assert.deepEqual(names(p), [0, 0, 0]);
});

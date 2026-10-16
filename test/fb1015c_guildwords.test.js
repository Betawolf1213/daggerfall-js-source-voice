// SEAT-WORDS and STANDING-WORDS (FIELD BUGS 2026-10-15c; Mac, asked what the guild system still left unsaid: "Seat-locked
// services", "Standing changes shown", "Probation warning", "Tutorial + guide words") and AUDIT GUILD-WORDS (Mac: "Lets
// audit everything"; bible/01-Overview/Audit-Guild-Words.md), which read them cold and fixed what it found: online, a
// service a seat opens says it is a seat's at any rank, and a knight is told the order's house is not given; the hold at 7
// pops the Chapters page; every Roll answer says what it moved - a quest's whole reward, a loss the owed absorbed, the
// owed paid at a login - and what it still owes; the review's warnings (a probation's stakes, a demotion before it lands)
// come first; the tutorial and the notice board's guide say the law as it is; and QSCRIPT-FREE: online, a quest's script
// costs nothing with the guild that gave it.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUILDS, joinGuild, membershipOf, membershipKey, activeMemberships, reviewDaysLeft, daySinceZero } from '../src/systems/guilds.js';
import { templeOf, orderOf } from '../src/systems/guildVariants.js';
import { createFactionRep, setReputation } from '../src/systems/factionRep.js';
import { serviceAccess, rankNeedsLines, probationWords, reviewWarnings, INSUFFICIENT_RANK_ID } from '../src/systems/guildServiceFlow.js';
import { receiveHouseDecision, claimHouse, NO_HOUSE_TEXT_ID, alreadyGivenHouseText } from '../src/systems/knightlyGifts.js';
import { seatedBook, rollMovesOf, rollKeptOf, ROLL_FACTIONS } from '../src/net/npcChapterLaw.js';
import { createRollTracker, rollEntityDoors } from '../src/net/npcRollTracker.js';
import { setStandingOwed, standingOwedOf } from '../src/systems/standingOwed.js';
import { standingLine, rollNoticeDoors } from '../src/scenes/rollNoticeHost.js';
import { setTutorialHandler, _resetTutorialTriggerForTests, tutorialById, forgetTutorialsSeen } from '../src/systems/tutorials.js';
import { affiliations } from '../src/systems/affiliations.js';
import { chapterGuide } from '../src/ui/noticeWindow.js';
import { ChangeReputeWith } from '../src/systems/quest/actions.js';

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r)); };
const day = (n) => ({ year: 405, dayOfYear: n });
const MAGES = GUILDS.MagesGuild.factionId, FIGHTERS = GUILDS.FightersGuild.factionId;
const ROLL = { rankCeiling: 7 };
const storeOf = (rows) => {
  const dict = new Map(Object.entries(rows).map(([id, v]) => [Number(id), { id: Number(id), parent: 0, rep: 0, flags: 0, power: 50, name: v.name,
    ally1: 0, ally2: 0, ally3: 0, enemy1: 0, enemy2: 0, enemy3: 0, children: null, type: 0, ggroup: 0 }]));
  const store = createFactionRep(dict);
  for (const [id, v] of Object.entries(rows)) setReputation(store, Number(id), v.rep);
  return store;
};
const skilled = (g, v) => ({ name: 'Tester', skills: Object.fromEntries(g.skills.map((s) => [s, v])) });
/** TEST THE SHAPE THE PRODUCER MINTS (AUDIT GUILD-WORDS L5-2): the character's book as the game holds it - the mortal and
 *  vampire books activeMemberships mints - joined through joinGuild. */
const memberAt = (g, rank, extra = {}, entity = {}) => {
  Object.assign(joinGuild(activeMemberships(entity), g, day(1)), { rank, ...extra });
  return entity;
};
const bookOf = (entity) => activeMemberships(entity);
const SEAT = 'Rank 8 offers this. Online, ranks 8 and 9 are chapter seats won by Merit, and a seat\'s services are at its own chapter\'s halls, for a member at rank 7. A notice board explains chapters.';
afterEach(() => { setStandingOwed(null); _resetTutorialTriggerForTests(); });

// ── SEAT-WORDS ──────────────────────────────────────────────────────

test('SEAT-WORDS: online a service only a seat\'s rank opens says so at any rank - the Mages\' Teleport, Zenithar\'s summoning; offline, a seat\'s holder at its own halls and a service no rank opens keep DFU\'s answers (mutants: the refusal gone, read only at 7, a rank the ceiling opens, the rank not the first)', () => {
  const g = GUILDS.MagesGuild;
  for (const rank of [7, 6, 3, 0]) {
    assert.deepEqual(serviceAccess(g, membershipOf(bookOf(memberAt(g, rank)), g), 'Teleport', ROLL), { allowed: false, text: SEAT }, `rank ${rank}: no review reaches 8 online`);
  }
  assert.deepEqual(serviceAccess(g, membershipOf(bookOf(memberAt(g, 2)), g), 'BuyMagicItems', ROLL), { allowed: false, textId: INSUFFICIENT_RANK_ID }, 'rank 3 opens it: a review still may');
  assert.deepEqual(serviceAccess(g, membershipOf(bookOf(memberAt(g, 7)), g), 'Teleport'), { allowed: false, textId: INSUFFICIENT_RANK_ID }, 'offline DFU\'s 3100');
  assert.deepEqual(serviceAccess(g, membershipOf(seatedBook(bookOf(memberAt(g, 7)), membershipKey(g), 8), g), 'Teleport', ROLL), { allowed: true }, 'a seat\'s holder at its halls');
  assert.deepEqual(serviceAccess(g, membershipOf(bookOf(memberAt(g, 7)), g), 'Repair', ROLL), { allowed: false, textId: INSUFFICIENT_RANK_ID }, 'no rank opens it');
  const z = templeOf('Zenithar');
  assert.equal(serviceAccess(z, membershipOf(bookOf(memberAt(z, 5)), z), 'DaedraSummoning', ROLL).text, SEAT);
});

test('SEAT-WORDS: online no knight is given the order\'s house - the seats bring none; a house the order gave says so; offline DFU\'s rank-9 record and grant, on a knightly order\'s own row (mutants: the online arm gone, the given house unread)', () => {
  const o = orderOf('Dragon');
  const knight = membershipOf(bookOf(memberAt(o, 7)), o);
  assert.equal(knight.guild, 'Order:Dragon', 'the order\'s own row');
  assert.deepEqual(receiveHouseDecision(knight, { rankCeiling: 7 }),
    { kind: 'refuse', line: 'Online, ranks 8 and 9 are the order\'s chapter seats, held while won by Merit - and a seat brings no house.' });
  const given = { ...knight };
  claimHouse(given);
  assert.deepEqual(receiveHouseDecision(given, { rankCeiling: 7 }), { kind: 'refuse', line: alreadyGivenHouseText() });
  assert.deepEqual(receiveHouseDecision(knight), { kind: 'refuse', textId: NO_HOUSE_TEXT_ID });
  assert.equal(receiveHouseDecision({ ...knight, rank: 9 }, { housesForSale: [{ buildingKey: 1 }], rolls: () => 0 }).kind, 'grant');
});

test('SEAT-WORDS: the hold at 7 is said and pops the Chapters page; the first word pops it for a member and not a stranger, and only the first; every move is said, and a quiet one says nothing (mutants: each door, the say unguarded, the entity unread, the first-word gate, the raw book)', () => {
  forgetTutorialsSeen();
  const asked = [];
  setTutorialHandler((id) => { asked.push(id); return true; });
  const said = [];
  const member = memberAt(GUILDS.MagesGuild, 7, {}, { factionRep: storeOf({ [MAGES]: { name: 'The Mages Guild', rep: 35 } }) });
  const doors = rollNoticeDoors({ entityOf: () => member, say: (s) => said.push(s) });
  doors.onCapped([MAGES]);
  assert.deepEqual([said.length, asked], [1, ['chapters']]);
  assert.match(said[0], /Mages Guild keeps ranks 8 and 9/);
  asked.length = 0;
  doors.onStanding([], false);
  assert.deepEqual([said.length, asked], [1, []], 'a quiet answer, not the first: nothing');
  doors.onStanding([{ f: MAGES, delta: 5, now: 35, owed: 0 }], true);
  assert.deepEqual([said.at(-1), asked], ['Standing: The Mages Guild +5 (now 35)', ['chapters']]);
  asked.length = 0;
  rollNoticeDoors({ entityOf: () => ({}), say: () => {} }).onStanding([], true);
  assert.deepEqual(asked, [], 'a stranger');
  assert.ok(tutorialById('chapters'), 'the page stands');
});

// ── STANDING-WORDS ──────────────────────────────────────────────────

test('STANDING-WORDS: the moves - a reward whole with what is owed, a loss the owed absorbed, the owed paid, a faction either word lacks unread (mutants: the owed uncounted, the paid unsaid, a rise alone)', () => {
  assert.deepEqual(rollMovesOf({ 40: 10, 41: 5 }, { 40: 4 }, { 40: 30, 41: 5 }, { 40: 9 }), [{ f: 40, delta: 25, now: 30, owed: 9 }]);
  assert.deepEqual(rollMovesOf({ 40: 30 }, { 40: 9 }, { 40: 30 }, { 40: 4 }), [{ f: 40, delta: -5, now: 30, owed: 4 }], 'the owed took the loss');
  assert.deepEqual(rollMovesOf({ 40: 40 }, { 40: 10 }, { 40: 50 }, {}), [{ f: 40, paid: 10, now: 50, owed: 0 }]);
  assert.deepEqual(rollMovesOf({ 40: 40 }, {}, { 40: 15 }, {}), [{ f: 40, delta: -25, now: 15, owed: 0 }]);
  assert.deepEqual(rollMovesOf({ 40: 40 }, {}, { 41: 1 }, {}), []);
});

test('STANDING-WORDS: one line - the guilds the character belongs to named, the sign, now and the owed, the owed paid; the rest counted; nothing moved, nothing said (mutants: each item, the fold, the empty line)', () => {
  const entity = memberAt(GUILDS.MagesGuild, 2, {}, memberAt(GUILDS.FightersGuild, 1, {}, { factionRep: storeOf({ [MAGES]: { name: 'The Mages Guild', rep: 35 } }) }));
  assert.equal(standingLine(entity, [{ f: MAGES, delta: 5, now: 35, owed: 0 }, { f: FIGHTERS, delta: -25, now: -20, owed: 0 }]),
    'Standing: The Mages Guild +5 (now 35), Fighters Guild -25 (now -20)');
  assert.equal(standingLine(entity, [{ f: MAGES, delta: 25, now: 40, owed: 10 }]), 'Standing: The Mages Guild +25 (now 40, 10 more to come)');
  assert.equal(standingLine(entity, [{ f: MAGES, paid: 10, now: 50, owed: 0 }]), 'Standing: The Mages Guild: 10 of what was owed arrived (now 50)');
  assert.equal(standingLine(entity, [{ f: MAGES, paid: 10, now: 50, owed: 5 }]), 'Standing: The Mages Guild: 10 of what was owed arrived (now 50, 5 more to come)');
  assert.equal(standingLine(entity, [{ f: MAGES, delta: -1, now: 34, owed: 0 }, { f: 42, delta: -1, now: 9, owed: 0 }, { f: 82, delta: 1, now: -9, owed: 0 }]),
    'Standing: The Mages Guild -1 (now 34), and 2 other guilds');
  assert.equal(standingLine(entity, [{ f: 42, delta: -1, now: 9, owed: 0 }]), 'Standing moved with 1 guild you do not belong to.');
  assert.equal(standingLine(entity, []), null);
  assert.equal(standingLine(entity, [{ f: MAGES, delta: 0, now: 35, owed: 0 }]), null);
});

const ALL = (over) => ({ ...Object.fromEntries(ROLL_FACTIONS.map((f) => [f, 0])), ...over });
const answer = (seq, rep, owed, extra = {}) => ({ ok: true, data: { roll: { seq, factions: ALL({ [MAGES]: rep }), owed, members: [], seats: [] }, ...extra } });

test('STANDING-WORDS: the tracker over the service\'s own answers - the first word\'s owed kept, a claim\'s whole reward with the owed, a loss the owed absorbed, cleared when it stops (mutants: the last word unread, the owed unkept, the first owed, the stop\'s clear, a rise alone)', async () => {
  const entity = { factionRep: storeOf({ [MAGES]: { name: 'The Mages Guild', rep: 10 } }), guildMemberships: { mortal: {}, vampire: {} } };
  const answers = [answer(1, 10, { [MAGES]: 4 }, { from: 1 }), answer(2, 30, { [MAGES]: 9 }, { credited: { [MAGES]: 20 } }),
    answer(3, 30, { [MAGES]: 4 }, { credited: { [MAGES]: 0 } }), { ok: false, error: 'chapters-closed' }];
  const io = { async read() { return answers.shift(); }, async claim() { return answers.shift(); } };
  const heard = [];
  let t = 1_000_000;
  const tracker = createRollTracker({ io, character: () => 'r0123456789abcdef0123', lease: () => 'a'.repeat(32), ...rollEntityDoors(() => entity), now: () => t,
    onStanding: (changes, first) => heard.push([changes, first]) });
  tracker.tick(); await settle();
  assert.deepEqual(heard, [[[], true]]);
  assert.equal(standingOwedOf(MAGES), 4, 'the first word\'s owed, shown at once');
  setReputation(entity.factionRep, MAGES, 35);   // a quest's +25
  t += 60_000; tracker.tick(); await settle();
  assert.deepEqual(heard[1], [[{ f: MAGES, delta: 25, now: 30, owed: 9 }], false]);
  setReputation(entity.factionRep, MAGES, 25);   // a crime's -5 - the owed takes it
  t += 60_000; tracker.tick(); await settle();
  assert.deepEqual(heard[2], [[{ f: MAGES, delta: -5, now: 30, owed: 4 }], false]);
  setReputation(entity.factionRep, MAGES, 31);
  t += 60_000; tracker.tick(); await settle();
  assert.equal(tracker.stopped, 'chapters-closed');
  assert.equal(standingOwedOf(MAGES), 0, 'stopped: nothing owed is said');
});

test('STANDING-WORDS: the next page\'s first word says the owed its read paid, against the kept adoption the Roll still stands at, the owed kept with it; a reseed is no second first word (mutants: the kept word unread, the kept owed, the first said twice)', async () => {
  const entity = { factionRep: storeOf({ [MAGES]: { name: 'The Mages Guild', rep: 40 } }), guildMemberships: { mortal: {}, vampire: {} } };
  let kept = { seq: 1, factions: ALL({ [MAGES]: 40 }), owed: { [MAGES]: 10 } };
  assert.deepEqual(rollKeptOf(kept)?.owed, { [MAGES]: 10 });
  const answers = [answer(1, 50, {}, { from: 1 }), { ok: false, error: 'roll-unseeded' }, answer(2, 50, {}, { from: 2 })];
  const io = { async read() { return answers.shift(); }, async claim() { return answers.shift(); } };
  const heard = [];
  let t = 1_000_000;
  const tracker = createRollTracker({ io, character: () => 'r0123456789abcdef0123', lease: () => 'a'.repeat(32), ...rollEntityDoors(() => entity), now: () => t,
    kept: () => kept, keep: (k) => { kept = k; }, onStanding: (changes, first) => heard.push([changes, first]) });
  tracker.tick(); await settle();
  assert.deepEqual(heard, [[[{ f: MAGES, paid: 10, now: 50, owed: 0 }], true]]);
  assert.deepEqual(kept.owed, {}, 'the owed kept with the adoption');
  setReputation(entity.factionRep, MAGES, 51);
  t += 60_000; tracker.tick(); await settle();   // roll-unseeded: read again
  t += 60_000; tracker.tick(); await settle();
  assert.equal(heard.length, 2);
  assert.equal(heard[1][1], false, 'once a page');
});

test('STANDING-WORDS: the hall\'s reputation row and the Standing page\'s book carry the owed (mutants: the owed row, the book\'s owed)', () => {
  const g = GUILDS.FightersGuild;
  const entity = memberAt(g, 1, {}, { factionRep: storeOf({ [FIGHTERS]: { name: 'The Fighters Guild', rep: 14 } }) });
  setStandingOwed({ [FIGHTERS]: 6 });
  assert.deepEqual(rankNeedsLines(skilled(g, 40), g, bookOf(entity), entity.factionRep), ['Next rank: Swordsman', 'Reputation 14 of 20 (6 more to come)']);
  const book = affiliations(entity);
  assert.deepEqual([book[0].owed, book[0].warnings], [6, []]);
});

// ── THE SEAT LINE ───────────────────────────────────────────────────

test('SEAT-WORDS: the seat line\'s arms - the owed beside the seat\'s 80, a probation first, the 80 met says the Turning alone (mutants: the owed, the probation, the boundary)', () => {
  const g = GUILDS.MagesGuild;
  const seats = 'Ranks 8 and 9 are each chapter\'s council and Master, won by Merit - no review gives them';
  const merit = 'Each Sunday\'s Turning seats the most Merit of the last 4 weeks, among members 14 real days in the guild, on accounts 7 real days old';
  setStandingOwed({ [MAGES]: 10 });
  assert.deepEqual(rankNeedsLines(skilled(g, 90), g, bookOf(memberAt(g, 7)), storeOf({ [MAGES]: { rep: 72 } }), ROLL),
    ['Next rank: Master Wizard', seats, 'Reputation 72 of 80 (10 more to come)', merit]);
  setStandingOwed(null);
  assert.deepEqual(rankNeedsLines(skilled(g, 90), g, bookOf(memberAt(g, 7)), storeOf({ [MAGES]: { rep: 80 } }), ROLL), ['Next rank: Master Wizard', seats, merit]);
  const onProbation = bookOf(memberAt(g, 7, { probation: true, lastRankChange: daySinceZero(day(10)) }));
  const lines = rankNeedsLines(skilled(g, 90), g, onProbation, storeOf({ [MAGES]: { rep: 75 } }), { ...ROLL, now: day(30) });
  assert.deepEqual(lines.slice(0, 2), [probationWords(8), 'Next rank: Master Wizard']);
});

// ── THE REVIEW'S WARNINGS ───────────────────────────────────────────

test('AUDIT GUILD-WORDS L1-2: a demotion is said before it lands - a Wizard at 62 told the review lowers it to Warlock and why, first in the hall\'s line and on the Standing page (mutants: the demotion unsaid, the reason, the rank read)', () => {
  const g = GUILDS.MagesGuild;
  const entity = memberAt(g, 7, {}, { factionRep: storeOf({ [MAGES]: { name: 'The Mages Guild', rep: 62 }, }), skills: skilled(g, 90).skills });
  const falls = 'Your next review lowers you to Warlock: Wizard needs reputation 70.';
  assert.deepEqual(reviewWarnings(entity, g, bookOf(entity), entity.factionRep, ROLL), [falls]);
  assert.equal(rankNeedsLines(entity, g, bookOf(entity), entity.factionRep, ROLL)[0], falls);
  assert.deepEqual(affiliations(entity)[0].warnings, [falls]);
  setReputation(entity.factionRep, MAGES, 45);
  assert.deepEqual(reviewWarnings(entity, g, bookOf(entity), entity.factionRep, ROLL), ['Your next review lowers you to Magician: Wizard needs reputation 70.'], 'three ranks down, named');
  setReputation(entity.factionRep, MAGES, 70);
  assert.deepEqual(reviewWarnings(entity, g, bookOf(entity), entity.factionRep, ROLL), [], 'at the line: nothing');
  // a seat's holder at its own hall: the review reads the book (7), never the seat's 9 - nothing falls
  setReputation(entity.factionRep, MAGES, 75);
  assert.equal(rankNeedsLines(entity, g, seatedBook(bookOf(entity), membershipKey(g), 9), entity.factionRep, { ...ROLL, book: bookOf(entity) }), null);
});

test('AUDIT GUILD-WORDS L1-3, L1-4, L1-7: a probation as its review will rule it - the days to the hall, the renewal and the end; a guild that never expels ends it; skills short of a member\'s hold it; said where no next rank is (mutants: each kind, the days, the raw book)', () => {
  const g = GUILDS.MagesGuild;
  const store = storeOf({ [MAGES]: { rep: -20 } });
  const entity = memberAt(g, 0, { probation: true, lastRankChange: daySinceZero(day(10)) }, { factionRep: store, skills: skilled(g, 40).skills });
  const m = membershipOf(bookOf(entity), g);
  assert.deepEqual([reviewDaysLeft(m, day(30)), reviewDaysLeft(m, day(40))], [8, 0]);
  assert.equal(probationWords(8), 'On probation: your review is at the guild\'s hall in 8 days or later. Below -10 you are expelled there, below 0 it runs 28 days more, and at 0 or more it ends.');
  assert.equal(probationWords(1), 'On probation: your review is at the guild\'s hall in 1 day or later. Below -10 you are expelled there, below 0 it runs 28 days more, and at 0 or more it ends.');
  assert.equal(probationWords(0), 'On probation: your review is at your next visit to the guild\'s hall. Below -10 you are expelled there, below 0 it runs 28 days more, and at 0 or more it ends.');
  assert.deepEqual(reviewWarnings(entity, g, bookOf(entity), store, { now: day(30) }), [probationWords(8)]);
  const lines = rankNeedsLines(entity, g, bookOf(entity), store, { now: day(30) });
  assert.deepEqual(lines.slice(0, 2), [probationWords(8), 'Next rank: Journeyman']);
  setReputation(store, MAGES, 20);   // mended, the review not yet run: nothing short, the probation still said
  assert.deepEqual(rankNeedsLines(entity, g, bookOf(entity), store, { now: day(30) }), [probationWords(8)]);
  const weak = memberAt(g, 0, { probation: true }, { factionRep: store, skills: skilled(g, 3).skills });
  assert.deepEqual(reviewWarnings(weak, g, bookOf(weak), store), ['On probation: your guild skills are short of a member\'s. It ends once one reaches 22 and a second 4 - and below -10 at a review you are expelled.']);
  const tg = GUILDS.ThievesGuild;
  const thief = memberAt(tg, 3, { probation: true }, { factionRep: storeOf({ [tg.factionId]: { rep: -5 } }), skills: skilled(tg, 40).skills });
  assert.equal(reviewWarnings(thief, tg, bookOf(thief), thief.factionRep)[0], 'On probation: it ends at your next review, at the guild\'s hall.');
  const seatHolder = memberAt(g, 7, { probation: true }, { factionRep: storeOf({ [MAGES]: { rep: -3 } }), skills: skilled(g, 90).skills });
  const seated = seatedBook(bookOf(seatHolder), membershipKey(g), 9);
  assert.equal(rankNeedsLines(seatHolder, g, seated, seatHolder.factionRep, { ...ROLL, book: bookOf(seatHolder) })?.[0], probationWords(null), 'a seat\'s hall: the probation still said');
});

// ── QSCRIPT-FREE ────────────────────────────────────────────────────

const FACTIONS = new Map([[40, { id: 40, parent: 0 }], [63, { id: 63, parent: 40 }], [41, { id: 41, parent: 0 }], [108, { id: 108, parent: 356 }],
  [356, { id: 356, parent: 0 }], [201, { id: 201, parent: 0 }], [846, { id: 846, parent: 844 }], [844, { id: 844, parent: 0 }], [368, { id: 368, parent: 0 }]]);
function scripted(source, { online = true, questFaction = 40, person }) {
  const calls = [];
  const quest = { factionId: questFaction, getPerson: () => person,
    hooks: { sharedClock: () => online, changeReputation: (...a) => calls.push(a), world: { getFactionData: (id) => FACTIONS.get(id) ?? null } } };
  const action = new ChangeReputeWith(null).createNew(source, quest);
  action.update(null);
  assert.equal(action.isComplete, true);
  return calls;
}

test('QSCRIPT-FREE: online a quest\'s script costs nothing with the guild that gave it - its questor (Guard the Guild\'s -30), a mage of its own faction (Protect an Honored Mage\'s -50); another faction\'s loss, every gain, a non-guild quest and the whole of it offline are DFU\'s (mutants: the waiver gone, the online gate, the gain, the questor, the root, the guild set)', () => {
  const questor = { factionId: 63, isQuestor: true };
  assert.deepEqual(scripted('change repute with _qgiver_ by -30', { person: questor }), [], 'Guard the Guild\'s treasure');
  assert.deepEqual(scripted('change repute with _sleepingmage_ by -50', { person: { factionId: 40 } }), [], 'the guild\'s own mage');
  assert.deepEqual(scripted('change repute with _villager_ by -20', { person: { factionId: 41 } }), [[41, -20, true]], 'another guild');
  assert.deepEqual(scripted('change repute with _qgiver_ by -30', { online: false, person: questor }), [[63, -30, true]], 'offline DFU\'s');
  assert.deepEqual(scripted('change repute with _qgiver_ by +5', { person: questor }), [[63, 5, true]], 'a gain');
  assert.deepEqual(scripted('change repute with _darkb_ by -15', { questFaction: 108, person: { factionId: 108 } }), [], 'the Brotherhood its own root');
  assert.deepEqual(scripted('change repute with _darkb_ by -15', { questFaction: 108, person: { factionId: 356 } }), [[356, -15, true]], 'its parent is not it');
  assert.deepEqual(scripted('change repute with _questgiver_ by -20', { questFaction: 201, person: { factionId: 201 } }), [[201, -20, true]], 'a commoner\'s quest');
  assert.deepEqual(scripted('change repute with _qgiver_ by -30', { questFaction: 41, person: { factionId: 63 } }), [[63, -30, true]], 'not this quest\'s questor nor guild');
  assert.deepEqual(scripted('change repute with _qgiver_ by -20', { questFaction: 368, person: { factionId: 846, isQuestor: true } }), [], 'an order\'s questor, its tree apart from the order\'s');
});

// ── THE WORDS ───────────────────────────────────────────────────────

test('SEAT-WORDS: the tutorial and the notice board\'s guide say the law - a review\'s 7, the seats\' 8 and 9, a quest\'s pace in real days and its own guild spared, a chair\'s services at its own halls, a writ\'s 2 and a receipt\'s 1 beyond the pace (mutants: a number not the law\'s)', () => {
  assert.deepEqual(tutorialById('guilds').points, ['Online, a review stops at rank 7: ranks 8 and 9 are chapter seats. See Guild Chapters.']);
  const ch = tutorialById('chapters');
  assert.deepEqual([ch.group, ch.title], ['online', 'Guild Chapters']);
  assert.deepEqual(ch.body, ['Online the realm keeps your guild standing. Quests raise it at most 15 a real day each, the rest following later, and no quest costs standing with the guild that gave it.',
    'Reviews promote you up to rank 7; ranks 8 and 9 are chapter seats, won by Merit at each Sunday\'s Turning. A notice board explains chapters.']);
  const guide = Object.fromEntries(chapterGuide());
  assert.equal(guide['Your rank'], 'A guild\'s own review still promotes you, up to rank 7. Ranks 8 and 9 are the chairs below; a chair\'s services are at its own chapter\'s halls, for a member at rank 7.');
  assert.equal(guide.Standing, 'The realm keeps your standing with each of these guilds. Quests raise it at most 15 a real day for each - a larger reward is owed and paid on the days after - and no quest costs you standing with the guild that gave it. Beyond that pace, a hall writ adds 2, and a closed Breach or a defended town adds 1 to each of your guilds that keeps a chapter there (2 more for the day\'s first, where the chapter asks for it).');
});

test('STANDING-WORDS: the Standing page draws the review\'s warnings and the owed under the guild, in the law\'s numbers (mutants: each note, the pace, the owed\'s number)', async () => {
  const { statsGuilds } = await import('../src/ui/enhancedMenu.js');
  const make = (tag) => ({ tag, className: '', textContent: '', children: [], append(...c) { this.children.push(...c); } });
  globalThis.document = { createElement: make };
  try {
    const g = GUILDS.FightersGuild;
    const entity = memberAt(g, 1, { probation: true }, { factionRep: storeOf({ [FIGHTERS]: { name: 'The Fighters Guild', rep: -3 } }), skills: skilled(g, 40).skills });
    setStandingOwed({ [FIGHTERS]: 6 });
    const detail = make('div');
    statsGuilds(detail, entity);
    const notes = detail.children.filter((c) => c.className === 'px-note').map((c) => c.textContent);
    assert.equal(notes.length, 2);
    assert.match(notes[0], /^On probation: your review is at /);
    assert.equal(notes[1], '6 more standing on the way, at most 15 a real day.');
  } finally { delete globalThis.document; }
});

test('SEAT-WORDS / STANDING-WORDS: the hosts - the gate and the house take the Roll\'s ceiling, the hall\'s line the character\'s date and the review\'s book, the streets\' tracker the module\'s doors through a lazy chat door and no door of its own over them (mutants: each seam, a door overridden)', () => {
  const wm = src('src/scenes/worldModes.js');
  assert.ok(wm.includes('const access = serviceAccess(guild, membershipOf(seated(), guild), service, { rankCeiling: host.rollPace?.(guild.factionId)?.book ?? null });'));
  assert.ok(wm.includes('const decision = receiveHouseDecision(kept, { rankCeiling: host.rollPace?.(guild.factionId)?.book ?? null,'));
  assert.ok(wm.includes('rankNeedsLines(playerEntity, guild, seated(), store, { rankCeiling: pace?.book ?? null, pace, now: ownDate(), book: memberships })'));
  const w = src('src/scenes/world.js');
  const start = w.indexOf('const rollTracker = onlineOn && realmSession ? createRollTracker({');
  const call = w.slice(start, w.indexOf('}) : null;', start));
  assert.ok(start > 0 && call.includes('...rollNoticeDoors({ entityOf: () => playerEntity, say: (text) => chatNotice(text) }),'));
  assert.doesNotMatch(call.slice(call.indexOf('...rollNoticeDoors(')), /\bon(Capped|Standing):/, 'no door of the host\'s own after the module\'s');
  assert.ok(src('src/ui/enhancedMenu.js').includes('const book = affiliations(entity, { now: dateFromClassicMinutes(Math.floor(ownMinutes())) });'));
});

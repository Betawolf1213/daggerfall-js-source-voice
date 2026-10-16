// SEAT-WORDS and STANDING-WORDS (FIELD BUGS 2026-10-15c; Mac, asked what the guild system still left unsaid: "Seat-locked
// services", "Standing changes shown", "Probation warning", "Tutorial + guide words"). Online, a service a seat opens
// says it is a seat's, and a knight is told the order's house is not given; the hold at 7 pops the Chapters page; every
// Roll answer says what it moved and what it still owes; a probation says its stakes; and the tutorial and the notice
// board's guide say how the standing and the ranks work online.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUILDS, joinGuild, membershipOf, membershipKey, reviewDaysLeft, daySinceZero } from '../src/systems/guilds.js';
import { templeOf } from '../src/systems/guildVariants.js';
import { createFactionRep, setReputation } from '../src/systems/factionRep.js';
import { serviceAccess, rankNeedsLines, probationWords, INSUFFICIENT_RANK_ID } from '../src/systems/guildServiceFlow.js';
import { receiveHouseDecision, NO_HOUSE_TEXT_ID, HOUSE_FLAG_MASK, alreadyGivenHouseText } from '../src/systems/knightlyGifts.js';
import { seatedBook } from '../src/net/npcChapterLaw.js';
import { createRollTracker, rollEntityDoors } from '../src/net/npcRollTracker.js';
import { setStandingOwed, standingOwedOf } from '../src/systems/standingOwed.js';
import { standingLine, rollNoticeDoors } from '../src/scenes/rollNoticeHost.js';
import { setTutorialHandler, _resetTutorialTriggerForTests, tutorialById, forgetTutorialsSeen } from '../src/systems/tutorials.js';
import { affiliations } from '../src/systems/affiliations.js';
import { chapterGuide } from '../src/ui/noticeWindow.js';

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r)); };
const day = (n) => ({ year: 405, dayOfYear: n });
const MAGES = GUILDS.MagesGuild.factionId;
const ROLL = { rankCeiling: 7 };
const storeOf = (rows) => {
  const dict = new Map(Object.entries(rows).map(([id, v]) => [Number(id), { id: Number(id), parent: 0, rep: 0, flags: 0, power: 50, name: v.name,
    ally1: 0, ally2: 0, ally3: 0, enemy1: 0, enemy2: 0, enemy3: 0, children: null, type: 0, ggroup: 0 }]));
  const store = createFactionRep(dict);
  for (const [id, v] of Object.entries(rows)) setReputation(store, Number(id), v.rep);
  return store;
};
const atRank = (g, rank, extra = {}) => {
  const book = {};
  Object.assign(joinGuild(book, g, day(1)), { rank, ...extra });
  return book;
};
afterEach(() => { setStandingOwed(null); _resetTutorialTriggerForTests(); });

// ── SEAT-WORDS ──────────────────────────────────────────────────────

test('SEAT-WORDS: at the Roll\'s 7 a service a seat opens says its rank and the seats - the Mages\' Teleport at 8, Zenithar\'s summoning at 8; below 7, offline, a seat\'s holder and a service no rank opens keep DFU\'s answers (mutants: the seat\'s refusal gone, at any rank, the rank not the first)', () => {
  const g = GUILDS.MagesGuild;
  const seat = 'Rank 8 offers this, and online ranks 8 and 9 are chapter seats won by Merit. A notice board explains how chapters work.';
  assert.deepEqual(serviceAccess(g, membershipOf(atRank(g, 7), g), 'Teleport', ROLL), { allowed: false, text: seat });
  assert.deepEqual(serviceAccess(g, membershipOf(atRank(g, 6), g), 'Teleport', ROLL), { allowed: false, textId: INSUFFICIENT_RANK_ID }, 'at 6 a review still may');
  assert.deepEqual(serviceAccess(g, membershipOf(atRank(g, 7), g), 'Teleport'), { allowed: false, textId: INSUFFICIENT_RANK_ID }, 'offline DFU\'s 3100');
  assert.deepEqual(serviceAccess(g, membershipOf(seatedBook(atRank(g, 7), membershipKey(g), 8), g), 'Teleport', ROLL), { allowed: true }, 'a seat\'s holder');
  assert.deepEqual(serviceAccess(g, membershipOf(atRank(g, 7), g), 'Repair', ROLL), { allowed: false, textId: INSUFFICIENT_RANK_ID }, 'no rank opens it');
  const z = templeOf('Zenithar');
  assert.equal(serviceAccess(z, membershipOf(atRank(z, 7), z), 'DaedraSummoning', ROLL).text, seat);
});

test('SEAT-WORDS: online no knight is given the order\'s house - the seats bring none; a house already given says so; offline DFU\'s rank-9 record (mutants: the online arm gone, the given house unread)', () => {
  const g = GUILDS.MagesGuild;   // a membership row's shape is the guild's; the decision reads its rank and flags alone
  const knight = membershipOf(atRank(g, 7), g);
  assert.deepEqual(receiveHouseDecision(knight, { rankCeiling: 7 }),
    { kind: 'refuse', line: 'Online, ranks 8 and 9 are the order\'s chapter seats, held while won by Merit - and a seat brings no house.' });
  assert.deepEqual(receiveHouseDecision({ ...knight, flags: HOUSE_FLAG_MASK }, { rankCeiling: 7 }), { kind: 'refuse', line: alreadyGivenHouseText() });
  assert.deepEqual(receiveHouseDecision(knight), { kind: 'refuse', textId: NO_HOUSE_TEXT_ID });
  assert.equal(receiveHouseDecision({ ...knight, rank: 9 }, { housesForSale: [{ buildingKey: 1 }], rolls: () => 0 }).kind, 'grant', 'offline 9 is given');
});

test('SEAT-WORDS: the hold at 7 is said and pops the Chapters page; a member\'s first word pops it too, a stranger\'s does not (mutants: the page not asked at the hold, at the first word, for a stranger)', () => {
  forgetTutorialsSeen();
  const asked = [];
  setTutorialHandler((id) => { asked.push(id); return true; });
  const said = [];
  const member = { guildMemberships: atRank(GUILDS.MagesGuild, 7) };
  const doors = rollNoticeDoors({ entityOf: () => member, say: (s) => said.push(s) });
  doors.onCapped([MAGES]);
  assert.deepEqual([said.length, asked], [1, ['chapters']]);
  assert.match(said[0], /Mages Guild keeps ranks 8 and 9/);
  asked.length = 0;
  doors.onStanding([], true);
  assert.deepEqual(asked, ['chapters']);
  asked.length = 0;
  rollNoticeDoors({ entityOf: () => ({ guildMemberships: {} }), say: () => {} }).onStanding([], true);
  assert.deepEqual(asked, [], 'a stranger');
  assert.ok(tutorialById('chapters'), 'the page stands');
});

// ── STANDING-WORDS ──────────────────────────────────────────────────

test('STANDING-WORDS: one line for what an answer moved - the faction\'s own name, the sign, the standing now and what is owed; nothing moved, nothing said (mutants: the owed unsaid, the sign, the empty line)', () => {
  const entity = { factionRep: storeOf({ [MAGES]: { name: 'The Mages Guild', rep: 35 } }) };
  assert.equal(standingLine(entity, [{ f: MAGES, delta: 5, now: 35, owed: 0 }, { f: 41, delta: -25, now: -20, owed: 0 }]),
    'Standing: The Mages Guild +5, now 35, Fighters Guild -25, now -20');
  assert.equal(standingLine(entity, [{ f: MAGES, delta: 15, now: 40, owed: 10 }]), 'Standing: The Mages Guild +15, now 40 (10 more to come)');
  assert.equal(standingLine(entity, []), null);
  assert.equal(standingLine(entity, [{ f: MAGES, delta: 0, now: 35, owed: 0 }]), null);
});

test('STANDING-WORDS: the tracker says each answer\'s moves against the Roll\'s last word, and keeps the owed for the windows - none at the first word, none once stopped (mutants: the last word unread, the owed unkept, the stop\'s clear)', async () => {
  const entity = { factionRep: storeOf({ [MAGES]: { name: 'The Mages Guild', rep: 10 } }), guildMemberships: { mortal: {}, vampire: {} } };
  const answer = (rep, owed, extra = {}) => ({ ok: true, data: { roll: { seq: 1, factions: { [MAGES]: rep }, owed, members: [], seats: [] }, from: 1, ...extra } });
  const answers = [answer(10, {}), answer(25, { [MAGES]: 10 }, { credited: { [MAGES]: 15 } }), { ok: false, error: 'chapters-closed' }];
  const io = { async read() { return answers.shift(); }, async claim() { return answers.shift(); } };
  const heard = [];
  let t = 1_000_000;
  const tracker = createRollTracker({ io, character: () => 'r0123456789abcdef0123', lease: () => 'a'.repeat(32), ...rollEntityDoors(() => entity), now: () => t,
    onStanding: (changes, first) => heard.push([changes, first]) });
  tracker.tick(); await settle();
  assert.deepEqual(heard, [[[], true]], 'the first word moves nothing');
  setReputation(entity.factionRep, MAGES, 35);   // a quest's +25, claimed
  t += 60_000; tracker.tick(); await settle();
  assert.deepEqual(heard[1], [[{ f: MAGES, delta: 15, now: 25, owed: 10 }], false]);
  assert.equal(standingOwedOf(MAGES), 10);
  setReputation(entity.factionRep, MAGES, 30);
  t += 60_000; tracker.tick(); await settle();
  assert.equal(tracker.stopped, 'chapters-closed');
  assert.equal(standingOwedOf(MAGES), 0, 'stopped: nothing owed is said');
});

test('STANDING-WORDS: the hall\'s reputation row says what the Roll still owes; the Standing page\'s book carries it (mutants: the owed row, the book\'s owed)', () => {
  const g = GUILDS.FightersGuild;
  const store = storeOf({ [g.factionId]: { name: 'The Fighters Guild', rep: 14 } });
  const skilled = { name: 'Tester', skills: Object.fromEntries(g.skills.map((s) => [s, 40])) };
  setStandingOwed({ [g.factionId]: 6 });
  assert.deepEqual(rankNeedsLines(skilled, g, atRank(g, 1), store), ['Next rank: Swordsman', 'Reputation 14 of 20 (6 more to come)']);
  const book = affiliations({ factionRep: store, guildMemberships: atRank(g, 1) });
  assert.deepEqual([book[0].owed, book[0].reviewIn], [6, null]);
});

// ── PROBATION ───────────────────────────────────────────────────────

test('STANDING-WORDS: a probation says its stakes - the days to its review on the character\'s own date, expulsion below -10, its end at 0 - first in the hall\'s line and on the Standing page (mutants: the days, the line not first, unsaid when nothing else is short)', () => {
  const g = GUILDS.MagesGuild;
  const store = storeOf({ [MAGES]: { name: 'The Mages Guild', rep: -20 } });
  const book = atRank(g, 0, { probation: true, lastRankChange: daySinceZero(day(10)) });
  assert.equal(reviewDaysLeft(membershipOf(book, g), day(30)), 8);
  assert.equal(reviewDaysLeft(membershipOf(book, g), day(40)), 0, 'due');
  const skilled = { name: 'Tester', skills: Object.fromEntries(g.skills.map((s) => [s, 40])) };
  const lines = rankNeedsLines(skilled, g, book, store, { now: day(30) });
  assert.equal(lines[0], 'On probation: at your review in 8 days, below -10 you are expelled - at 0 or more it ends.');
  assert.equal(lines[1], 'Next rank: Journeyman');
  assert.equal(probationWords(1), 'On probation: at your review in 1 day, below -10 you are expelled - at 0 or more it ends.');
  assert.equal(probationWords(0), 'On probation: at your next review here, below -10 you are expelled - at 0 or more it ends.');
  setReputation(store, MAGES, 20);   // mended, the review not yet run: nothing short, the probation still said
  assert.deepEqual(rankNeedsLines(skilled, g, book, store, { now: day(30) }), [probationWords(8)]);
  const row = affiliations({ factionRep: store, guildMemberships: book }, { now: day(30) })[0];
  assert.deepEqual([row.probation, row.reviewIn], [true, 8]);
});

// ── THE WORDS ───────────────────────────────────────────────────────

test('SEAT-WORDS: the tutorial says the online law - the Guilds page\'s point, the Chapters page with the day\'s pace and the review\'s 7 - and the notice board\'s guide says the rank and the standing in the law\'s numbers (mutants: a number not the law\'s)', () => {
  assert.deepEqual(tutorialById('guilds').points, ['Online, a review stops at rank 7: ranks 8 and 9 are chapter seats. See Guild Chapters.']);
  const ch = tutorialById('chapters');
  assert.deepEqual([ch.group, ch.title], ['online', 'Guild Chapters']);
  assert.match(ch.body[0], /at most 15 a day each/);
  assert.match(ch.body[1], /up to rank 7\./);
  const guide = Object.fromEntries(chapterGuide());
  assert.match(guide['Your rank'], /up to rank 7\. Ranks 8 and 9 are the chairs/);
  assert.match(guide.Standing, /at most 15 a day for each.*A hall writ adds 2, and a closed Breach or a defended town adds 1/);
});

test('SEAT-WORDS / STANDING-WORDS: the hosts - the gate and the house take the Roll\'s ceiling, the hall\'s line the character\'s own date, the streets\' tracker the notices through a lazy chat door, and the Standing page its notes (mutants: each seam)', () => {
  const wm = src('src/scenes/worldModes.js');
  assert.ok(wm.includes('const access = serviceAccess(guild, membershipOf(seated(), guild), service, { rankCeiling: host.rollRankCeiling?.() ?? null });'));
  assert.ok(wm.includes('const decision = receiveHouseDecision(kept, { rankCeiling: host.rollRankCeiling?.() ?? null,'));
  assert.ok(wm.includes('rankNeedsLines(playerEntity, guild, seated(), store, { rankCeiling: host.rollRankCeiling?.() ?? null, now: ownDate() })'));
  assert.ok(src('src/scenes/world.js').includes('...rollNoticeDoors({ entityOf: () => playerEntity, say: (text) => chatNotice(text) }),'));
  const menu = src('src/ui/enhancedMenu.js');
  assert.ok(menu.includes('const book = affiliations(entity, { now: dateFromClassicMinutes(Math.floor(ownMinutes())) });'));
  assert.ok(menu.includes("if (a.probation) detail.append(el('p', 'px-note', probationWords(a.reviewIn)));"));
  assert.ok(menu.includes("if (a.owed > 0) detail.append(el('p', 'px-note', t('pause.guilds.owed',"));
});

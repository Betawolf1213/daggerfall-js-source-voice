// QL12 (bible/06-Systems/Questlines-Arc.md section 4.4): THE GUILDS' LADDERS - each guild the player is a member of, read
// as a line of its own quests by the rank that opens them (systems/questlines/qlLadders.js): read off the membership
// book, the classic list's rows and the layer's record of what finished well - nothing new kept. And the window's page
// (ui/questlines/qlJournal.js qlLadderDetail) says what a ladder is, strikes what is done and marks a choice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ladders, guildOfMembership } from '../../../src/systems/questlines/qlLadders.js';
import { qlLadderDetail } from '../../../src/ui/questlines/qlJournal.js';
import { GUILD_GROUPS } from '../../../src/formats/factionFile.js';
import { fakePage } from '../../hudPage.mjs';

const FG = GUILD_GROUPS.FightersGuild;
const pools = new Map([[FG, [
  { name: 'M0B00Y06', membership: 'M', minReq: 0 },
  { name: 'M0B00Y16', membership: 'M', minReq: 0 },
  { name: 'M0B20Y02', membership: 'M', minReq: 2 },
  { name: 'M0B60Y10', membership: 'M', minReq: 6 },
  { name: 'M0C00Y11', membership: 'N', minReq: 0 },    // a non-member's - no rung of a member's ladder
  { name: 'M0B11Y18', membership: 'M', minReq: 15 },   // a reputation floor - no rung
]]]);

test('QL12 a guild\'s ladder: a member\'s rows by rank, promotions reached, the finished struck, the flagship marked', () => {
  const memberships = { [FG]: { guild: 'FightersGuild', rank: 2 } };
  const [l] = ladders({ memberships, pools, history: { M0B00Y06: 'done' } });
  assert.equal(l.key, 'FightersGuild');
  assert.equal(l.factionId, 41);
  assert.equal(l.rank, 2);
  assert.deepEqual(l.rungs.map((r) => [r.rank, r.reached]), [[0, true], [2, true], [6, false]]);
  assert.deepEqual(l.rungs[0].quests.map((q) => [q.name, q.done, q.flagship]), [['M0B00Y06', true, false], ['M0B00Y16', false, true]]);
  assert.ok(l.rungs.every((r) => r.title && typeof r.title === 'string'), 'each rung its rank\'s title');
  assert.equal(l.rankTitle, l.rungs[1].title);
});

test('QL12 no ladder for a guild the player only knows, nor for a book that is empty', () => {
  assert.deepEqual(ladders({ memberships: {}, pools }), []);
  assert.deepEqual(ladders({ memberships: { [FG]: { guild: 'FightersGuild', rank: -1 } }, pools }), [], 'not a member');
  assert.equal(guildOfMembership({ guild: 'Temple:Arkay' })?.name, 'Temple:Arkay');
  assert.equal(guildOfMembership({ guild: 'Nobody' }), null);
});

test('QL12 the ladder\'s page: what a ladder is, the rank held, each rung, the done struck and the choice explained', () => {
  const doc = fakePage();
  const box = qlLadderDetail(doc, { name: 'The Fighters Guild', rankTitle: 'Apprentice', rungs: [
    { rank: 0, title: 'Initiate', reached: true, quests: [{ name: 'M0B00Y06', title: 'Wild Animal', done: true, flagship: false }] },
    { rank: 6, title: 'Guardian', reached: false, quests: [{ name: 'M0B60Y10', title: 'Summoner', done: false, flagship: true }] },
  ] });
  const text = box.textContent;
  assert.match(text, /A guild.s own quests, by the rank that opens them/);
  assert.match(text, /Your rank: Apprentice/);
  assert.match(text, /Guardian \(not yet\)/);
  const rows = box.querySelectorAll('.px-qobj-row');
  assert.deepEqual(rows.map((r) => r.className.split(' ')[1]), ['done', 'next']);
  assert.match(rows[1].querySelector('.px-qobj-tag').title, /ends differently/);
});

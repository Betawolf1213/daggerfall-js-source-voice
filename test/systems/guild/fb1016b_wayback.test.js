// WAY-BACK (FIELD BUGS 2026-10-16b; Glade on Discord: "I failed a quest for the Mages Guild yesterday that put me down
// to -55 rep, now I'm at -53 rep, but they kicked me out so I can't do any quests to recover. It's unclear to me whether
// I'll have to remake my character or wait IRL weeks just to get back to 0"). Both roads back were open and nothing
// said either: a stranger may ask a hall's quest-giver for work, each quest done pays the guild DFU's +5, and a standing
// below 0 mends a point every 7 days of the character's own time. The hall (the enhanced skin), the join's refusal
// (both skins) and the Standing page now say so, with the numbers the law moves by.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUILDS, joinGuild, activeMemberships, guildOfFaction } from '../../../src/systems/guild/guilds.js';
import { templeOf, orderOf, DIVINES, ORDERS, resolveVariantGuild } from '../../../src/systems/guild/guildVariants.js';
import { canAccessService } from '../../../src/systems/guild/guildServices.js';
import { createFactionRep, setReputation } from '../../../src/systems/faction/factionRep.js';
import { wayBackLines } from '../../../src/systems/guild/guildServiceFlow.js';
import { setStandingOwed } from '../../../src/systems/standingOwed.js';
import { PORT_SPECS } from '../../../src/ui/enhanced/enhancedPorts.js';
import { GuildServiceWindow } from '../../../src/ui/guildServiceWindow.js';
import { loadQuestTables } from '../../../src/systems/quest/tables.js';
import { QuestMachine } from '../../../src/systems/quest/machine.js';
import { QuestListsManager } from '../../../src/systems/quest/questLists.js';
import { QuestOfferFlow } from '../../../src/systems/quest/offerFlow.js';
import { GUILD_GROUPS } from '../../../src/formats/factionFile.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const VENDOR = join(ROOT, 'vendor', 'dfu-quests');
const read = (p) => readFileSync(p, 'utf8').replace(/^﻿/, '');
const MAGES = GUILDS.MagesGuild.factionId;
const storeOf = (reps) => {
  const dict = new Map(Object.keys(reps).map((id) => [Number(id), { id: Number(id), parent: 0, rep: 0, flags: 0, power: 50,
    ally1: 0, ally2: 0, ally3: 0, enemy1: 0, enemy2: 0, enemy3: 0, children: null, type: -1, ggroup: 0, name: `F${id}` }]));   // FACTION_TYPES.None: no group of the page's by type (0 is the Daedra's)
  const store = createFactionRep(dict);
  for (const [id, rep] of Object.entries(reps)) setReputation(store, Number(id), rep);
  return store;
};
const DRIFT = 'Below 0 it also mends a point every 7 days of your own time - rests and journeys count.';
afterEach(() => setStandingOwed(null));

test('WAY-BACK: a stranger at -53 is told the standing the guild takes, the quests that reach it at DFU\'s +5 each, and REP4\'s week; online the Roll\'s day, and what it owes counts toward the line (mutants: the count floored, the owed not counted, the owed read offline, the pace said offline)', () => {
  const store = storeOf({ [MAGES]: -53 });
  assert.deepEqual(wayBackLines(GUILDS.MagesGuild, {}, store), [
    'Your standing with this guild is -53. It takes members at 0 or more.',
    'A stranger may still ask its quest-giver for work: each quest done raises your standing 5 - 11 more quests reach 0.',
    DRIFT,
  ]);
  assert.deepEqual(wayBackLines(GUILDS.MagesGuild, {}, store, { paced: true }), [
    'Your standing with this guild is -53. It takes members at 0 or more.',
    'A stranger may still ask its quest-giver for work: each quest done raises your standing 5 - 11 more quests reach 0.',
    DRIFT,
    'Online it rises at most 15 a real day (days turn at midnight UTC).',
  ]);
  setStandingOwed({ [MAGES]: 10 });
  const paced = wayBackLines(GUILDS.MagesGuild, {}, store, { paced: true });
  assert.equal(paced[1], 'A stranger may still ask its quest-giver for work: each quest done raises your standing 5 - 9 more quests reach 0.', 'the 10 owed counts');
  assert.equal(paced[3], 'Online it rises at most 15 a real day (days turn at midnight UTC) - 10 more is on the way.');
  assert.equal(wayBackLines(GUILDS.MagesGuild, {}, store)[1].includes('11 more quests'), true, 'offline nothing is owed');
  setStandingOwed({ [MAGES]: 60 });
  assert.equal(wayBackLines(GUILDS.MagesGuild, {}, store, { paced: true })[1], 'A stranger may still ask its quest-giver for work: each quest done raises your standing 5.', 'the owed reaches 0 on its own');
  setStandingOwed(null);
  assert.equal(wayBackLines(GUILDS.MagesGuild, {}, storeOf({ [MAGES]: -1 }))[1], 'A stranger may still ask its quest-giver for work: each quest done raises your standing 5 - 1 more quest reaches 0.');
});

test('WAY-BACK: said only where a join is offered and refused on the standing - not at 0, not to a member of the slot (this guild, or another temple or order in it), not for a guild joined by invitation, not without a store (mutants: the line at 0, the slot read as this guild alone, the invitation gate dropped)', () => {
  assert.equal(wayBackLines(GUILDS.MagesGuild, {}, storeOf({ [MAGES]: 0 })), null, 'at 0 the join takes the standing');
  const book = activeMemberships({});
  joinGuild(book, GUILDS.MagesGuild, { year: 405, dayOfYear: 1 });
  assert.equal(wayBackLines(GUILDS.MagesGuild, book, storeOf({ [MAGES]: -5 })), null, 'a member: the review\'s words are theirs');
  const mara = templeOf('Mara'), arkay = templeOf('Arkay');
  const arkayStore = storeOf({ [DIVINES.Arkay]: -20 });
  const temples = activeMemberships({});
  assert.equal(wayBackLines(arkay, temples, arkayStore).length, 3, 'a stranger to every temple: Arkay\'s way in');
  joinGuild(temples, mara, { year: 405, dayOfYear: 1 });
  assert.equal(wayBackLines(arkay, temples, arkayStore), null, 'Mara\'s member is offered no join at Arkay\'s (showsJoinButton)');
  assert.equal(wayBackLines(orderOf('Dragon'), {}, storeOf({ [ORDERS.Dragon]: -3 })).length, 3);
  assert.equal(wayBackLines(GUILDS.ThievesGuild, {}, storeOf({ [GUILDS.ThievesGuild.factionId]: -30 })), null, 'joined by invitation alone');
  assert.equal(wayBackLines(GUILDS.DarkBrotherhood, {}, storeOf({ [GUILDS.DarkBrotherhood.factionId]: -30 })), null);
  assert.equal(wayBackLines(GUILDS.MagesGuild, {}, null), null);
});

// The road the words name is real: through the vendored lists and the real offer flow, a stranger far below 0 is given
// the guild's Get Quest and drawn from its non-member quests - for every guild a stranger walks into.
loadQuestTables(Object.fromEntries(readdirSync(join(VENDOR, 'Tables')).filter((f) => f.endsWith('.txt'))
  .map((f) => [f.replace('.txt', ''), read(join(VENDOR, 'Tables', f))])));
const strangerPool = (guildGroup, factionId) => {
  const m = new QuestMachine({ nowSeconds: () => 0, playerLevel: () => 12, getReputation: () => -53 });
  const lists = new QuestListsManager({
    readListTable: (name) => { try { return read(join(VENDOR, 'Tables', `QuestList-${name}.txt`)); } catch { return null; } },
    getQuestSourceLines: () => null,
    parseQuest: () => null,
  });
  const flow = new QuestOfferFlow(m, lists, { getGuildFactionId: () => factionId, guildQuestListBox: true, sharedClock: () => true });
  flow.offerGuildQuest({ guildGroup, buildingFactionId: factionId,
    guild: { isMember: () => false, rank: -1, getReputation: () => -53, isSatisfyQuestReqByLevel: () => false } });
  return { names: flow.questPool.map((q) => q.name), factionId: flow._getFactionIdForGuild() };
};

test('WAY-BACK: the stranger\'s road is real - at -53 a non-member\'s Get Quest opens, and the Mages Guild, the Fighters Guild, a temple and an order each draw from their non-member quests, the reward\'s faction the guild\'s own (mutant: none here - a pin on the law the words read)', () => {
  for (const g of [GUILDS.MagesGuild, GUILDS.FightersGuild, templeOf('Arkay'), orderOf('Dragon')]) {
    assert.equal(canAccessService(g, null, 'Quests'), true, `${g.name}: a stranger's Get Quest`);
  }
  const classic = read(join(VENDOR, 'Tables', 'QuestList-Classic.txt'));
  const nonMember = (group) => [...classic.matchAll(new RegExp(`^(\\w+), ${group}, N, 0,`, 'gm'))].map((r) => r[1]);
  assert.deepEqual(nonMember('MagesGuild'), ['N0C00Y10', 'N0C00Y11', 'N0C00Y12', 'N0C00Y13']);
  for (const [group, groupName, factionId] of [[GUILD_GROUPS.MagesGuild, 'MagesGuild', MAGES], [GUILD_GROUPS.FightersGuild, 'FightersGuild', GUILDS.FightersGuild.factionId],
    [GUILD_GROUPS.HolyOrder, 'HolyOrder', DIVINES.Arkay], [GUILD_GROUPS.KnightlyOrder, 'KnightlyOrder', ORDERS.Dragon]]) {
    const pool = strangerPool(group, factionId);
    assert.ok(pool.names.length > 0, `${groupName}: work for a stranger`);
    for (const n of nonMember(groupName)) assert.ok(pool.names.includes(n), `${groupName}: ${n}`);
    assert.equal(pool.factionId, factionId, `${groupName}: the +5 is the guild's own`);
  }
});

test('WAY-BACK: the enhanced hall shows a stranger the way in above its buttons; a member keeps the next rank\'s line (mutant: the stranger\'s line not drawn)', () => {
  const lines = wayBackLines(GUILDS.MagesGuild, {}, storeOf({ [MAGES]: -53 }));
  const hooks = (member) => ({ member: () => member, service: () => 'Quests', rows: () => [], steps: () => [],
    rankNeeds: () => ['Next rank: Journeyman'], wayBack: () => lines });
  assert.deepEqual(PORT_SPECS.guild.view(new GuildServiceWindow(hooks(false))).blocks[0], { type: 'text', rows: lines, scroll: true });
  assert.deepEqual(PORT_SPECS.guild.view(new GuildServiceWindow(hooks(true))).blocks[0].rows, ['Next rank: Journeyman']);
  assert.equal(PORT_SPECS.guild.view(new GuildServiceWindow({ ...hooks(false), wayBack: () => null })).blocks.some((b) => b.type === 'text'), false);
});

test('WAY-BACK: the interior host hands the hall its way in, on the Roll\'s pace while it holds, and puts it under DFU\'s refusal of a join (mutants: the hook dropped, the refusal bare)', () => {
  const wm = read(join(ROOT, 'src/scenes/worldModes.js'));
  assert.ok(wm.includes('    const wayBack = () => wayBackLines(guild, memberships, store, { paced: !!host.rollPace?.(guild.factionId) });'));
  assert.ok(/\n {6}wayBack,\s+\/\/ WAY-BACK/.test(wm), 'the popup\'s hook');
  assert.ok(wm.includes('        if (!decision.eligible) return { rows: [...rows(decision.textId), ...(wayBack() ?? [])] };'), 'the refusal, then the way in');
});

test('WAY-BACK: the Standing page puts the hall\'s quest line under a guild, temple or order the join refuses - not under a kingdom, nor a standing at 0 (mutants: the note dropped, the variants unresolved)', async () => {
  const page = (id) => guildOfFaction(id, resolveVariantGuild(null));   // the page's own read: GetGuild, the variants resolved
  assert.equal(page(MAGES), GUILDS.MagesGuild);
  assert.equal(page(DIVINES.Arkay).name, 'Temple:Arkay');
  assert.equal(page(ORDERS.Dragon).name, 'Order:Dragon');
  assert.equal(page(201), null);
  const { statsEveryStanding } = await import('../../../src/ui/enhanced/enhancedMenu.js');
  const make = (tag) => ({ tag, className: '', textContent: '', children: [], append(...c) { this.children.push(...c); } });
  globalThis.document = { createElement: make };
  try {
    const rep = storeOf({ [GUILDS.FightersGuild.factionId]: 0, [MAGES]: -53, [DIVINES.Arkay]: -20, [ORDERS.Dragon]: 4 });
    const detail = make('div');
    statsEveryStanding(detail, { name: 'x', factionRep: rep, guildMemberships: {} });
    const notes = detail.children.filter((n) => n.className === 'px-note').map((n) => n.textContent);
    assert.deepEqual(notes, [
      'A stranger may still ask its quest-giver for work: each quest done raises your standing 5 - 11 more quests reach 0.',
      'A stranger may still ask its quest-giver for work: each quest done raises your standing 5 - 4 more quests reach 0.',
    ]);
    const at = detail.children.findIndex((n) => n.className === 'px-note');
    assert.equal(detail.children[at - 1].children[0].textContent, 'F' + MAGES, 'under its own row');
  } finally { delete globalThis.document; }
});

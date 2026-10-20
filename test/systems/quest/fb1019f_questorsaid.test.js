// QUESTOR-SAID (FIELD BUGS 2026-10-19f, players' private reports: a guild - the Fighters Guild, the Knights of the Dragon
// - refused a new quest with "That service is not available yet." while one of its quests was still open). DFU's law
// is kept: a questor whose quest is open offers nothing (DaggerfallGuildServicePopupWindow.GetQuest :550-553 -
// IsLastNPCClickedAnActiveQuestor, then CloseWindow). DFU says nothing there; the port's popup read the silence as no
// service at all. The door's close now says why and names the quest, and the popup says it.
//
// Driven through the real quest bridge (createQuestBridge - its machine, lists and offer flow) on the guide suites' world
// (test/guideWorld.mjs), the questor bound by the machine itself at the accept (Person.SetupQuestorNPC off the click the
// bridge stored), the boxes through the real ServiceFlowWindow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeWorld } from '../../guideWorld.mjs';   // loads the vendored quest tables too
import { createQuestBridge, questorBusyRows } from '../../../src/scenes/quest/questBridge.js';
import { QUEST_MESSAGES } from '../../../src/systems/quest/machine.js';
import { ACTIVE_QUESTOR } from '../../../src/systems/quest/offerFlow.js';
import { GUILD_GROUPS, SOCIAL_GROUPS } from '../../../src/formats/factionFile.js';
import { serviceDestination } from '../../../src/systems/guild/guildServiceFlow.js';
import { ServiceFlowWindow } from '../../../src/ui/guildServiceWindows.js';
import * as tm from '../../../src/systems/textManager.js';

const rd = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');

/** A guild quest whose questor is the NPC clicked at the offer (the classic quests' `Person _questgiver_ group Questor`). */
const questSource = (name, displayName) => [
  `Quest: ${name}`, ...(displayName ? [`DisplayName: ${displayName}`] : []), 'QRC:',
  `QuestorOffer:  [${QUEST_MESSAGES.QuestorOffer}]`, '<ce> Would you fetch the thing?', '',
  `RefuseQuest:  [${QUEST_MESSAGES.RefuseQuest}]`, '<ce> Bah. Off with you.', '',
  `AcceptQuest:  [${QUEST_MESSAGES.AcceptQuest}]`, '<ce> Good. The thing awaits.', '',
  'QBN:', 'Person _qgiver_ group Questor', '', 'variable _done_',
];
const LIST_HEAD = 'schema: *name, group, membership, minReq, flag, notes';
/** The hall's quest-giver as the RMB lists a person (worldModes openStaticNpc -> questBridge.clickNpc). */
const GIVER = Object.freeze({ rawX: 10, rawY: 0, rawZ: 20, position: 1234, factionID: 849, flags: 0, textureArchive: 182, textureRecord: 3 });
const HALL = Object.freeze({ mapId: 111, locationIndex: 0, buildingKey: 33 });
const FIGHTERS = { id: 849, parent: 0, type: 2, name: 'The Fighters Guild', sgroup: 0, ggroup: GUILD_GROUPS.FightersGuild, flat1: 0, flat2: 0, race: -1 };

function makeBridge({ group = 'FightersGuild', membership = 'M', displayName = 'The Offered Errand' } = {}) {
  const world = { ...makeWorld(), getFactionData: (id) => (id === FIGHTERS.id ? FIGHTERS : null) };
  const bridge = createQuestBridge({
    data: {
      readListTable: (n) => (n === 'Classic' ? [LIST_HEAD, `__OFR, ${group}, ${membership}, 0, 0, x`].join('\n') : null),
      getQuestSourceLines: (n) => (n === '__OFR' ? questSource('__OFR', displayName) : null),
    },
    world,
    classicSeconds: () => 0,
    playerEntity: { name: 'Hero Proudfoot', level: 3, gender: 'male' },
    getReputation: () => 0,
    dateTimeString: () => '13:30:00 on 4th of Morning Star, 3E405',
    midDateTimeString: () => '13:30:00 04 Morning Star 3E405',
    cityName: () => 'Bigtown',
  });
  bridge.giver = { ...GIVER };   // the scene's own record: the machine stands its questor behaviour on it
  return bridge;
}
/** The popup's guild, as worldModes' questOffer arm hands it: a Fighters member of rank 0. */
const askGuild = (bridge) => bridge.offerGuildQuest({ guildGroup: GUILD_GROUPS.FightersGuild, guild: { factionId: 41, name: 'Fighters Guild' }, membership: { factionId: 41, rank: 0 }, reputation: 0 });
/** Take the hall's quest: the giver clicked, the offer answered Yes. Answers the live quest. */
function takeQuest(bridge, ask = askGuild) {
  bridge.clickNpc(bridge.giver, HALL);
  const offer = ask(bridge);
  assert.equal(offer.kind, 'offer');
  assert.equal(offer.respond(true).kind, 'accepted');
  const [quest] = bridge.machine.quests.values();
  assert.equal(quest.getResource({ name: 'qgiver' }).isQuestor, true, 'the machine bound the giver clicked as the questor');
  return quest;
}

test('QUESTOR-SAID: a guild\'s quest-giver with your quest open says so, naming it - through the real window; and offers again once it is done', () => {
  const bridge = makeBridge();
  const quest = takeQuest(bridge);
  bridge.clickNpc(bridge.giver, HALL);   // back at the hall, the same giver
  const step = askGuild(bridge);
  assert.deepEqual(step, { kind: 'close', reason: ACTIVE_QUESTOR, quest }, 'mutants: the close bare, its reason or its quest dropped');
  assert.equal(step.quest, quest, 'the quest still open - the very one');
  const boxes = bridge.offerBoxes(step, () => []);
  assert.deepEqual(boxes, [{ rows: [{ text: 'You have not finished the work you were given here: The Offered Errand.', center: true }] }],
    'mutants: the chain empty - worldModes\' questOffer arm read that as "That service is not available yet."');
  let closed = 0;
  const win = new ServiceFlowWindow(boxes, { onClose: () => { closed++; } });
  assert.deepEqual(win.top.rows.map((r) => r.text), ['You have not finished the work you were given here: The Offered Errand.']);
  assert.equal(win.top.buttons, undefined, 'a click-anywhere box');
  win.click(10, 10);
  assert.equal(win.done, true);
  assert.equal(closed, 1);
  // DFU's law stands: done, the giver offers again
  quest.endQuest();
  bridge.machine.tick(); bridge.machine.tick();
  assert.equal(quest.questComplete, true);
  bridge.clickNpc(bridge.giver, HALL);
  assert.equal(askGuild(bridge).kind, 'offer', 'mutants: a finished quest still shutting the door');
});

test('QUESTOR-SAID: a quest with no DisplayName - the work alone, never an empty name', () => {
  const bridge = makeBridge({ displayName: null });
  const quest = takeQuest(bridge);
  assert.equal(quest.displayName || '', '');
  bridge.clickNpc(bridge.giver, HALL);
  assert.deepEqual(bridge.offerBoxes(askGuild(bridge), () => []), [{ rows: [{ text: 'You have not finished the work you were given here.', center: true }] }]);
  assert.deepEqual(questorBusyRows(null), [{ text: 'You have not finished the work you were given here.', center: true }]);
});

test('QUESTOR-SAID: the coven\'s Quest button the same (DaggerfallWitchesCovenPopupWindow.GetQuest :125-129); the social door keeps DFU\'s bare close, its talk session having declined first', () => {
  const coven = makeBridge({ group: 'Witches', membership: 'N' });
  const askCoven = (b) => b.offerCovenQuest(FIGHTERS.id, 0);
  const quest = takeQuest(coven, askCoven);
  coven.clickNpc(coven.giver, HALL);
  const step = askCoven(coven);
  assert.deepEqual(step, { kind: 'close', reason: ACTIVE_QUESTOR, quest });
  assert.deepEqual(coven.offerBoxes(step, () => []), [{ rows: questorBusyRows(quest) }]);
  // the social door (DaggerfallQuestOfferWindow): npcSession.isNpcOfferingQuest declines an active questor before the
  // door is reached; the door's own bail stays C#'s silent face
  const social = makeBridge({ group: 'Commoners', membership: 'N' });
  const askSocial = (b) => b.offerSocialQuest({ ...b.machine.getLastNPCClicked() }, SOCIAL_GROUPS.Commoners);
  takeQuest(social, askSocial);
  social.clickNpc(social.giver, HALL);
  const bare = askSocial(social);
  assert.deepEqual(bare, { kind: 'close' });
  assert.deepEqual(social.offerBoxes(bare, () => []), []);
});

test('QUESTOR-SAID: the words are the text core\'s (quest.offer.questorBusy, quest.offer.questorBusyUnnamed) - in French the French row, the quest\'s name in it; every whole language keeps {quest}', () => {
  const quest = { displayName: 'La course' };
  const rows = tm.loadStringTableCsv(rd('locales/fr/Port_Strings.csv'));
  const fr = new Map(rows);
  assert.ok(fr.get('quest.offer.questorBusy') && fr.get('quest.offer.questorBusyUnnamed'), 'French drafted');
  tm.patchLocaleTable('fr', 'Port_Strings', rows);
  try {
    tm.setLocale('fr');
    assert.deepEqual(questorBusyRows(quest), [{ text: fr.get('quest.offer.questorBusy').replace('{quest}', 'La course'), center: true }]);
    assert.deepEqual(questorBusyRows(null), [{ text: fr.get('quest.offer.questorBusyUnnamed'), center: true }]);
  } finally { tm.setLocale('en'); }
  const en = new Map(tm.loadStringTableCsv(rd('locales/en/Port_Strings.csv')));
  assert.equal(en.get('quest.offer.questorBusy'), 'You have not finished the work you were given here: {quest}.', 'the English catalog is the source\'s (tools/l10nExtract.mjs)');
  for (const code of ['bg', 'cs', 'da', 'de', 'es', 'fr', 'id', 'it', 'ko', 'nb', 'pt-BR', 'ro', 'ru']) {
    const row = new Map(tm.loadStringTableCsv(rd(`locales/${code}/Port_Strings.csv`)));
    assert.ok(row.get('quest.offer.questorBusy')?.includes('{quest}'), `${code} keeps {quest}`);
    assert.ok(row.get('quest.offer.questorBusyUnnamed'), `${code} drafted`);
  }
});

test('QUESTOR-SAID: what still reaches "That service is not available yet." is a service that is not there - every other cause says its own truth', () => {
  const modes = rd('src/scenes/worldModes.js');
  // the line answers a flow that is not there: a service no destination maps (genuinely unbuilt), a window whose art or
  // data has not come in, no quest machine or no FACTION.TXT
  assert.match(modes, /if \(!flow\) return \{ rows: \['That service is not available yet\.'\] \};/);
  assert.equal(serviceDestination('NoSuchService'), null, 'an unbuilt service has no destination');
  assert.match(modes, /function openServiceFlow\(destination, [^\n]*\n\s*if \(!destination\) return null;/);
  // the guild's quest door: a questor's close boxes its words (above); an empty chain - a drawn quest with no offer
  // message - is C#'s silent close, a dispatch of nothing, never the line
  assert.match(modes, /flow = boxes\.length \? new ServiceFlowWindow\(boxes, \{ onClose: \(\) => closeSelf\(\) \}\) : DOOR_REFUSED;/,
    'mutants: an empty chain left null - "not available yet" over a quest the guild could not offer');
  assert.match(modes, /if \(!win \|\| win\.refusedByDoor\) return null;/, 'the sentinel mounts nothing');
  assert.deepEqual(makeBridge().offerBoxes(null, () => []), []);
  // the potion and item makers mounted their window and answered null - the line pushed onto the popup they replaced
  assert.match(modes, /return mountServiceWindow\(potionWin\);/);
  assert.match(modes, /return mountServiceWindow\(itemWin\);/);
  assert.doesNotMatch(modes, /mountServiceWindow\((?:potionWin|itemWin)\);\n\s*return null;/);
});

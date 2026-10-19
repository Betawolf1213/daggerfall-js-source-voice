// DOC lane: the probe mutants, written as data (probes/list.json).
import { writeFileSync } from 'node:fs';
const LENS = ['test/ui/quest/audit_guide.test.js', 'test/ui/quest/guide3_herald.test.js', 'test/ui/quest/guide1_questLens.test.js', 'test/ui/quest/guide4_tracker.test.js', 'test/ui/quest/guide5_marks.test.js', 'test/ui/enhanced/guide2_wayThere.test.js', 'test/systems/quest/questshelf.test.js', 'test/systems/quest/qa2_nearsite.test.js', 'test/systems/quest/fb1017b_shamtrail.test.js', 'test/systems/l10n4_hardcoded.test.js', 'test/systems/l10n3d_sites.test.js'];
const BRIDGE = ['test/systems/quest/questbridge.test.js', 'test/systems/quest/audit24_questseams.test.js'];
const R = 'src/systems/questlines/qlRewards.js', L = 'src/systems/questlines/qlLayer.js', W = 'src/systems/questlines/qlLaw.js';
const N = 'src/systems/questlines/qlLineRunner.js', I = 'src/systems/questlines/qlLines.js', A = 'src/systems/questlines/qlActions.js';
const D = 'src/systems/questlines/qlLadders.js', J = 'src/ui/questlines/qlJournal.js', Q = 'src/ui/quest/questLens.js', K = 'src/net/accountClient.js';
const m = (name, file, old, nu, tests = BRIDGE, why = '') => ({ name, file, old, new: nu, tests, why });
const list = [
  m('R1-greater-no-rung-up', R, 'greater: Object.freeze({ gold: 1.25, gear: true, step: 1 }),', 'greater: Object.freeze({ gold: 1.25, gear: true, step: 0 }),', BRIDGE, 'the harder way no longer pays a rung up the gear ladder (section 5.2)'),
  m('R2-lesser-full-coin', R, 'lesser: Object.freeze({ gold: 0.75, gear: true, step: 0 }),', 'lesser: Object.freeze({ gold: 1, gear: true, step: 0 }),', BRIDGE, 'the merciful way pays full coin'),
  m('R3-greater-plain-coin', R, 'greater: Object.freeze({ gold: 1.25,', 'greater: Object.freeze({ gold: 1,', BRIDGE, 'the harder way pays no more coin'),
  m('R4-tier3-magic', R, "3: Object.freeze({ floor: 'rare', up: 0 }),", "3: Object.freeze({ floor: 'magic', up: 0 }),", BRIDGE, 'tier 3 pays Magic, not Rare'),
  m('R5-forbidden-unread', R, '  if (isForbiddenEquip(entity?.career ?? null, item)) return false;\n', '', BRIDGE, 'a class offered gear it may not equip'),
  m('R6-worst-weapon-skills', R, '.sort((a, b) => b.v - a.v || a.i - b.i)', '.sort((a, b) => a.v - b.v || a.i - b.i)', BRIDGE, 'the weapon is fitted to the two WORST weapon skills'),
  m('R7-betrayal-pays-gear', R, 'betrayal: Object.freeze({ gold: 1, gear: false, step: 0 }),', 'betrayal: Object.freeze({ gold: 1, gear: true, step: 0 }),', BRIDGE, 'a betrayal pays the betrayed guild\'s piece'),
  m('L1-letter-is-pay', L, "    if (resource?.itemName === 'letter') return;\n", '', BRIDGE, 'a letter handed over marks the quest paid'),
  m('L2-named-every-time', L, 'if (named && !history[`named:${quest.questName}`]) {', 'if (named) {', BRIDGE, 'a named piece more than once a character'),
  m('L3-offers-hoard', L, '      if (offers.length > OFFERS_MAX) offers = offers.slice(-OFFERS_MAX);\n', '', BRIDGE, 'rewards waiting grow without bound'),
  m('L4-legal-unmoved', L, '      if (Number.isSafeInteger(outcome.legal) && outcome.legal !== 0) ctx.changeLegalRep?.(outcome.legal);\n', '', BRIDGE, 'an outcome\'s legal standing never moves'),
  m('L5-ending-twice', L, 'if (!isStamped(quest) || quest.ql.moved) return null;', 'if (!isStamped(quest)) return null;', BRIDGE, 'a second end (a resync, a tombstone after end quest) pays standing and gear again'),
  m('L6-restore-ids-reset', L, 'nextOffer = Math.max(Number.isSafeInteger(data?.nextOffer) ? data.nextOffer : 1, ...offers.map((o) => o.id + 1), 1);', 'nextOffer = 1;', BRIDGE, 'a reload reuses a waiting offer\'s id'),
  m('L7-failure-struck-on-ladder', L, 'if (outcome ? !outcome.failure : quest.questSuccess) history[', 'if (true) history[', BRIDGE, 'a failed quest is struck as done on its guild ladder'),
  m('L8-no-tutorial', L, "      if (sheetFor(quest?.questName)) noteFirstUse('questlines');   // QL2: the first quest that shows objectives\n", '', [...BRIDGE, 'test/ui/tut1_tutorials.test.js'], 'the Tutorials\' Questlines page never pops'),
  m('L9-failure-pays-gear', L, 'if (!payProfileOf(outcome).gear || outcome.failure || !(quest.ql.paid || quest.questSuccess)) return null;', 'if (!payProfileOf(outcome).gear || !(quest.ql.paid || quest.questSuccess)) return null;', BRIDGE, 'a failure outcome offers gear'),
  m('W1-foe-dead-unspawned', W, '(f.killCount | 0) >= Math.max(1, f.spawnCount | 0)', '(f.killCount | 0) >= (f.spawnCount | 0)', BRIDGE, 'a foe never placed reads as dead'),
  m('W2-catchall-beats-success', W, '    if (o?.failure && quest.questSuccess && isCatchAll(o)) o = fallbackOutcome(quest, sheet) ?? o;\n', '', BRIDGE, 'a success whose row missed settles as the catch-all failure'),
  m('W3-opened-latch-dropped', W, '    const open = done || failed || !!st?.opened?.includes(o.id) || holds(', '    const open = done || failed || holds(', BRIDGE, 'an objective shown is hidden again when its open state clears'),
  m('W4-clock-not-started-runs', W, 'return !!r && !!r.clockEnabled && !r.clockFinished;', 'return !!r && !r.clockFinished;', BRIDGE, 'a clock never started reads as running'),
  m('N1-end-claim-no-choice', N, "queueClaim(at.line.id, at.index, 'end', outcome?.id ?? null);", "queueClaim(at.line.id, at.index, 'end', null);", BRIDGE, 'the end claim carries no choice: the Covens\' Hoard key (choice keep) is never paid'),
  m('N2-claim-one-try', N, 'export const CLAIM_TRIES = 5;', 'export const CLAIM_TRIES = 1;', BRIDGE, 'an unwitnessed claim is asked once a page'),
  m('N3-restore-forgets-open', N, "else if (!ended && !said) queueClaim(id, i, 'open');", "else if (false) queueClaim(id, i, 'open');", BRIDGE, 'a step whose opening claim was never answered is not re-opened on load'),
  m('N4-stale-step-moves-line', N, 'if (!rec || rec.done || rec.step !== at.index) return null;', 'if (!rec || rec.done) return null;', BRIDGE, 'an earlier step\'s quest ending again moves the line on'),
  m('I1-weir-road-ungated', I, "opens: { after: 'covensHoard', online: true },", 'opens: { online: true },', BRIDGE, 'the Weir Road opens before the Covens\' Hoard'),
  m('A1-name-underscores', A, "action.given = match.groups.given.replace(/_/g, ' ');", 'action.given = match.groups.given;', BRIDGE, 'a giver named "Ysolde_Marnhel"'),
  m('D1-orders-ladder-lost', D, "if (name.startsWith('Order:')) return orderOf(name.slice(6));", "if (name.startsWith('Order:')) return orderOf(name.slice(7));", BRIDGE, 'a knightly order member has no ladder'),
  m('J1-named-piece-unlabelled', J, "    if (p.named) card.append(el(doc, 'div', 'px-qpiece-tier px-qpiece-named', t('ql.journal.named', 'This quest\\u2019s own')));\n", '', BRIDGE, 'the named card is not marked as the quest\'s own'),
  m('Q1-objective-news-on-return', Q, 'if (was && doneNow.length) events.push(', 'if (doneNow.length) events.push(', LENS, 'a quest back after a look with no entries re-announces every objective done'),
  m('Q2-failed-is-current', Q, ".find((o) => o.state === 'open')?.text ?? null;", ".find((o) => o.state === 'open' || o.state === 'failed')?.text ?? null;", LENS, 'the tracker card shows a failed objective as the one to do now'),
  m('Q3-translation-ignored', Q, "const raw = typeof own === 'string' && own.trim() ? own : String(text ?? '');", "const raw = String(text ?? '');", LENS, 'a pack\'s QL.<quest>.<id> words are never read: the sheet\'s English always'),
  m('K1-claim-wrong-route', K, "const a = await post('/v1/ql/claim', body);", "const a = await post('/v1/ql/claims', body);", [], 'every claim 404s: no title, no key ever'),
  m('K2-dead-session-kept', K, "const a = await post('/v1/ql/claim', body); if (a?.error === 'auth') forgetSession(storage); return a; },", "const a = await post('/v1/ql/claim', body); return a; },", [], 'a dead session is never forgotten'),
  m('K3-account-always', K, '    account: () => storedSession(storage)?.id ?? null,   // whose the line\'s pay is: none signed in, none asked', "    account: () => 'acct',", [], 'serviceReady with nobody signed in'),
  m('X1-QLWR04-tier1', 'src/systems/questlines/sheets/questlines.json', '{"quest":"QLWR04","tier":4,', '{"quest":"QLWR04","tier":1,', BRIDGE, 'the Weir Road\'s ending pays tier-1 gear'),
];
writeFileSync(new URL('./list.json', import.meta.url), JSON.stringify(list, null, 1));
console.log(list.length, 'probes');

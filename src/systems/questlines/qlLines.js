// @ts-check
// QL12-QL16 (2026-10-19, the owner: "New questlines tying into and introduced the oblivion gates, abyss dungeons, elite
// dungeons and elite breaches. Staying true to Daggerfall's lore", "Tying all our newly integrated features into
// quests", "One unified place to view questlines"; bible/06-Systems/Questlines-Arc.md section 4): THE QUESTLINES - each a
// story told in quests, step after step, each step a script on the machine (systems/questlines/quests/<QUEST>.txt, read
// by the one loader - scenes/quest/questData.js) with its sheet (sheets/questlines.json) like any quest's.
//
// A LINE IS DATA: its steps' quests, the words the window shows of it, and when it opens. What it pays beyond its
// quests' own rewards is the service's (net/questlineClaims.js QL_SERVICE_LINES - the witnessed steps, the title, the
// Covens' Hoard's key), read by id here, never restated. The runner (qlLineRunner.js) starts a line's next step; the
// window (ui/questlines/qlJournal.js) draws the line.
//
//   THE DAGON CYCLE (4.1) - three lines, one story: the Burning Doors (Dagon's Breach), the Covens' Hoard (the Elite
//     Dungeons' gold-lit champions), the Weir Road (the Elite Breach). Online: every witness is a relay's receipt.
//   THE HOUR THAT WAS NOT (4.2) - the Abyss Dungeon, from the Order of the Hour. Online.
//   THE OLD COIL (4.3) - the Sea Serpent, from Sentinel's sailors. Online.
//   THE INTRODUCTIONS (4.5) - a short line for each Tutorials group with a feature to go to: the crafts, the gear's own
//     laws, the sea, the road, the tavern's tables, the Arena, the Bay's troubles, the Firmament. The Tutorials explain;
//     an introduction gives a reason to go, and pays for it.
//
// Every word through t() (the Port_Strings catalog): a line's title, its lead, its giver, each step's title. A step's
// title is its quest's DisplayName in English (test/systems/questlines/ql12_lines.test.js holds the two to one word).
import { t } from '../textManager.js';
import { QL_SERVICE_LINES } from '../../net/questlineClaims.js';

/**
 * @typedef {{ quest: string, title: () => string }} LineStep
 * @typedef {{ level?: number, after?: string, online?: boolean }} LineOpens
 *   `level` the character's level at least; `after` another line finished first; `online` only where the account
 *   service answers (every endgame line: its witnesses are the service's rows)
 * @typedef {{ id: string, group: 'cycle'|'hour'|'coil'|'intro', tutorial: string|null, tier: number,
 *   title: () => string, lead: () => string, giver: () => string, opens: LineOpens, steps: ReadonlyArray<LineStep> }} Line
 */

/** @param {Line} l @returns {Readonly<Line>} */
const line = (l) => Object.freeze({ ...l, opens: Object.freeze({ ...l.opens }), steps: Object.freeze(l.steps.map((s) => Object.freeze(s))) });

/** The lines, in the window's order: the Cycle, the Hour, the Coil, then the introductions. */
export const QL_LINES = Object.freeze([
  line({
    id: 'burningDoors', group: 'cycle', tutorial: null, tier: 3,
    title: () => t('ql.line.burningDoors', 'The Burning Doors'),
    lead: () => t('ql.line.burningDoors.lead', 'Someone is opening Dagon’s Breaches on purpose. A Master Conjurer of the Mages Guild wants to know who, and how.'),
    giver: () => t('ql.line.burningDoors.giver', 'Ysolde Marnhel, Master Conjurer of the Mages Guild of Wayrest'),
    opens: { level: 10, online: true },
    steps: [
      { quest: 'QLBD01', title: () => t('ql.step.QLBD01', 'A Letter from Wayrest') },
      { quest: 'QLBD02', title: () => t('ql.step.QLBD02', 'The Faithful') },
      { quest: 'QLBD03', title: () => t('ql.step.QLBD03', 'Breaking the Rite') },
      { quest: 'QLBD04', title: () => t('ql.step.QLBD04', 'Through the Burning Door') },
      { quest: 'QLBD05', title: () => t('ql.step.QLBD05', 'The Caged Broker') },
    ],
  }),
  line({
    id: 'covensHoard', group: 'cycle', tutorial: null, tier: 3,
    title: () => t('ql.line.covensHoard', 'The Covens’ Hoard'),
    lead: () => t('ql.line.covensHoard.lead', 'Dagon’s covens hoard the Battlespire’s keys in the deep places. Their champions glow gold.'),
    giver: () => t('ql.line.covensHoard.giver', 'Ysolde Marnhel, Master Conjurer of the Mages Guild of Wayrest'),
    opens: { after: 'burningDoors', online: true },
    steps: [
      { quest: 'QLCH01', title: () => t('ql.step.QLCH01', 'Gold-Lit') },
      { quest: 'QLCH02', title: () => t('ql.step.QLCH02', 'The Lieutenant') },
      { quest: 'QLCH03', title: () => t('ql.step.QLCH03', 'What the Key Opens') },
    ],
  }),
  line({
    id: 'weirRoad', group: 'cycle', tutorial: null, tier: 4,
    title: () => t('ql.line.weirRoad', 'The Weir Road'),
    lead: () => t('ql.line.weirRoad.lead', 'The Battlespire fell in 3E 398. One of its last class of Battlemages has never stopped living that year.'),
    giver: () => t('ql.line.weirRoad.giver', 'Corvane Tull, Battlemage of the Spire’s last class'),
    opens: { after: 'covensHoard', online: true },
    steps: [
      { quest: 'QLWR01', title: () => t('ql.step.QLWR01', 'The Weir Gate') },
      { quest: 'QLWR02', title: () => t('ql.step.QLWR02', 'The Torn Halls') },
      { quest: 'QLWR03', title: () => t('ql.step.QLWR03', 'A Warrior Duke') },
      { quest: 'QLWR04', title: () => t('ql.step.QLWR04', 'The Battlemage’s Account') },
    ],
  }),
  line({
    id: 'hourThatWasNot', group: 'hour', tutorial: null, tier: 4,
    title: () => t('ql.line.hourThatWasNot', 'The Hour That Was Not'),
    lead: () => t('ql.line.hourThatWasNot.lead', 'The priests of Akatosh feel a wound in time under the Bay, and brass where there should be stone.'),
    giver: () => t('ql.line.hourThatWasNot.giver', 'Prior Anselm Vey of the Order of the Hour'),
    opens: { level: 12, online: true },
    steps: [
      { quest: 'QLHR01', title: () => t('ql.step.QLHR01', 'Brass at Dusk') },
      { quest: 'QLHR02', title: () => t('ql.step.QLHR02', 'The Orrery of Endings') },
    ],
  }),
  line({
    id: 'oldCoil', group: 'coil', tutorial: null, tier: 3,
    title: () => t('ql.line.oldCoil', 'The Old Coil'),
    lead: () => t('ql.line.oldCoil.lead', 'Sentinel’s sailors say the World-Skin was shed once, and that what was shed still swims.'),
    giver: () => t('ql.line.oldCoil.giver', 'Hamid al-Rasheen, a packet captain of Sentinel'),
    opens: { level: 8, online: true },
    steps: [
      { quest: 'QLOC01', title: () => t('ql.step.QLOC01', 'The Sailors’ Tale') },
      { quest: 'QLOC02', title: () => t('ql.step.QLOC02', 'The Packet Lanes') },
      { quest: 'QLOC03', title: () => t('ql.step.QLOC03', 'The Shed Skin') },
    ],
  }),
  line({
    id: 'introCrafts', group: 'intro', tutorial: 'livelihood', tier: 1,
    title: () => t('ql.line.introCrafts', 'The Court Crafter'),
    lead: () => t('ql.line.introCrafts.lead', 'A crafter who works for the court wants an apprentice who can find their own materials.'),
    giver: () => t('ql.line.introCrafts.giver', 'a court crafter'),
    opens: { level: 2 },
    steps: [
      { quest: 'QLIP01', title: () => t('ql.step.QLIP01', 'Of Rod and Root') },
      { quest: 'QLIP02', title: () => t('ql.step.QLIP02', 'Ore and Timber') },
      { quest: 'QLIP03', title: () => t('ql.step.QLIP03', 'Made by Hand') },
    ],
  }),
  line({
    id: 'introGear', group: 'intro', tutorial: 'loot', tier: 1,
    title: () => t('ql.line.introGear', 'The Smith’s Secrets'),
    lead: () => t('ql.line.introGear.lead', 'An armourer offers to show you what a good piece of gear can still be made into.'),
    giver: () => t('ql.line.introGear.giver', 'an armourer'),
    opens: { level: 4 },
    steps: [
      { quest: 'QLIG01', title: () => t('ql.step.QLIG01', 'A Stone in the Setting') },
      { quest: 'QLIG02', title: () => t('ql.step.QLIG02', 'Tempered Again') },
    ],
  }),
  line({
    id: 'introSea', group: 'intro', tutorial: 'sea', tier: 2,
    title: () => t('ql.line.introSea', 'The Harbourmaster’s Word'),
    lead: () => t('ql.line.introSea.lead', 'A harbourmaster needs a captain. Any captain. Even you.'),
    giver: () => t('ql.line.introSea.giver', 'a harbourmaster'),
    opens: { level: 5 },
    steps: [
      { quest: 'QLIS01', title: () => t('ql.step.QLIS01', 'Under Sail') },
      { quest: 'QLIS02', title: () => t('ql.step.QLIS02', 'A Hold Full') },
      { quest: 'QLIS03', title: () => t('ql.step.QLIS03', 'Strike Your Colours') },
    ],
  }),
  line({
    id: 'introRoad', group: 'intro', tutorial: 'travel', tier: 1,
    title: () => t('ql.line.introRoad', 'The Merchant’s Road'),
    lead: () => t('ql.line.introRoad.lead', 'A stable master knows a merchant yard that pays well for a wagon’s load, if someone will haul it.'),
    giver: () => t('ql.line.introRoad.giver', 'a stable master'),
    opens: { level: 3 },
    steps: [
      { quest: 'QLIR01', title: () => t('ql.step.QLIR01', 'A Wagon’s Load') },
      { quest: 'QLIR02', title: () => t('ql.step.QLIR02', 'The Long Haul') },
    ],
  }),
  line({
    id: 'introTables', group: 'intro', tutorial: 'challenges', tier: 1,
    title: () => t('ql.line.introTables', 'A Seat at the Table'),
    lead: () => t('ql.line.introTables.lead', 'A tavern regular is looking for someone new to lose to. Or, better, to beat.'),
    giver: () => t('ql.line.introTables.giver', 'a tavern regular'),
    opens: { level: 2 },
    steps: [
      { quest: 'QLIT01', title: () => t('ql.step.QLIT01', 'A Hand of Cards') },
      { quest: 'QLIT02', title: () => t('ql.step.QLIT02', 'The King’s Gambit') },
    ],
  }),
  line({
    id: 'introArena', group: 'intro', tutorial: 'challenges', tier: 2,
    title: () => t('ql.line.introArena', 'The Herald’s Call'),
    lead: () => t('ql.line.introArena.lead', 'The Arena’s Herald is calling for new blood, and pays the first purse in advance of glory.'),
    giver: () => t('ql.line.introArena.giver', 'the Arena’s Herald'),
    opens: { level: 6, online: true },
    steps: [
      { quest: 'QLIA01', title: () => t('ql.step.QLIA01', 'First Blood') },
      { quest: 'QLIA02', title: () => t('ql.step.QLIA02', 'A Name in the Sand') },
    ],
  }),
  line({
    id: 'introBay', group: 'intro', tutorial: 'world', tier: 2,
    title: () => t('ql.line.introBay', 'The Bay’s Troubles'),
    lead: () => t('ql.line.introBay.lead', 'A captain of the watch has more trouble than soldiers: raiders on the roads, and the dead who will not lie down.'),
    giver: () => t('ql.line.introBay.giver', 'a captain of the watch'),
    opens: { level: 6, online: true },
    steps: [
      { quest: 'QLIW01', title: () => t('ql.step.QLIW01', 'Raiders at the Gate') },
      { quest: 'QLIW02', title: () => t('ql.step.QLIW02', 'The Kneeling Dead') },
    ],
  }),
  line({
    id: 'introFirmament', group: 'intro', tutorial: 'online', tier: 1,
    title: () => t('ql.line.introFirmament', 'Written in the Stars'),
    lead: () => t('ql.line.introFirmament.lead', 'An astrologer insists your fortune is written on the Firmament, and that you can write the rest yourself.'),
    giver: () => t('ql.line.introFirmament.giver', 'an astrologer'),
    opens: { level: 3, online: true },
    steps: [
      { quest: 'QLIF01', title: () => t('ql.step.QLIF01', 'The First Star') },
      { quest: 'QLIF02', title: () => t('ql.step.QLIF02', 'A Constellation of Your Own') },
    ],
  }),
]);

const BY_ID = new Map(QL_LINES.map((l) => [l.id, l]));
/** A line by its id, or null. */
export const lineById = (id) => BY_ID.get(id) ?? null;

const BY_QUEST = new Map(QL_LINES.flatMap((l) => l.steps.map((s, i) => [s.quest.toUpperCase(), { line: l, index: i }])));
/** The line and step a quest is, or null for a quest no line holds. */
export const lineStepOf = (questName) => BY_QUEST.get(String(questName ?? '').toUpperCase()) ?? null;

/** Every quest a line holds, upper-case - the Questlines family's set (ql1_sheets' "set is exact"). */
export const lineQuestNames = () => [...BY_QUEST.keys()];

/** What the service pays this line (net/questlineClaims.js), or null for a line it pays nothing. */
export const serviceOf = (line) => QL_SERVICE_LINES[line?.id] ?? null;

/** A step's witness kind (net/questlineClaims.js QL_WITNESS_KINDS), or null for a step the client's quest alone decides. */
export const witnessOf = (line, index) => serviceOf(line)?.witness?.[index] ?? null;

/**
 * Does the line open for this player now? `probe` answers the three questions: `level()`, `lineDone(id)`, `online()`.
 * @param {Readonly<Line>} l
 * @param {{ level: () => number, lineDone: (id: string) => boolean, online: () => boolean }} probe
 */
export function lineOpens(l, probe) {
  const o = l.opens;
  if (o.online && !probe.online()) return false;
  if (Number.isFinite(o.level) && probe.level() < /** @type {number} */ (o.level)) return false;
  if (o.after && !probe.lineDone(o.after)) return false;
  return true;
}

/** What a line still waits on, in words - the window's "Opens ..." line, or null when nothing stands in its way. */
export function opensWords(l, probe) {
  const o = l.opens;
  const parts = [];
  if (Number.isFinite(o.level) && probe.level() < /** @type {number} */ (o.level)) parts.push(t('ql.line.opensLevel', 'at level {n}', { n: o.level }));
  if (o.after && !probe.lineDone(o.after)) parts.push(t('ql.line.opensAfter', 'after {line}', { line: lineById(o.after)?.title() ?? o.after }));
  if (o.online && !probe.online()) parts.push(t('ql.line.opensOnline', 'online'));
  return parts.length ? t('ql.line.opens', 'Opens {when}.', { when: parts.join(', ') }) : null;
}

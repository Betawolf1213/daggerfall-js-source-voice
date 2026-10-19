// @ts-check
// QL2 (bible/06-Systems/Questlines-Arc.md section 6, decision 10): THE QUESTS TAB'S QUESTLINE PARTS - one home for the
// two faces that draw quests (the pause window's Quests tab, ui/enhanced/enhancedMenu.js pauseQuests; the chronicle
// the L key opens, ui/enhanced/enhancedChronicle.js), so they cannot disagree:
//
//   - WHAT TO DO: a stamped quest's objectives (the bridge's questLog row's `ql` - systems/questlines/qlLayer.js rowOf),
//     each as the machine's state has opened it - done struck, failed crossed, an optional one marked, alternatives
//     joined by "or" - never one the journal has not opened (decision 6);
//   - YOUR CHOICES: the branches taken, in the quest's own words;
//   - HOW IT ENDED: the outcome, once there is one;
//   - YOUR REWARD: what finishing pays - a choice of three pieces fitted to the player, at its tier's floor;
//   - THE REWARDS WAITING: an ended quest's three pieces, each with its Take (systems/questlines/qlLayer.js take);
//   - THE QUESTLINES (QL12-QL16): each line - what it is about and who gives it, its steps as a path (done, the one
//     under way, the ones to come), what it waits on, how it ended, the title it pays (qlLineRunner.js rows);
//   - THE GUILDS' LADDERS (section 4.4): each guild the player is a member of, its own quests by the rank that opens
//     them, the promotions as the rungs, the ones finished struck and the flagship ones marked (qlLadders.js).
//
// A window redesigned on purpose (SCOPE1): it cites this record, not DFU - the classic skin keeps DFU's logbook
// (ui/quest/questJournal.js). Plain words (bible/10-UI/Plain-Words.md): every heading says what it is, a press explains
// what a hover would, every number is read off the constant that enforces it (qlRewards.js TIER_FLOORS).
import { t } from '../../systems/textManager.js';
import { TIER_FLOORS, REWARD_CHOICES } from '../../systems/questlines/qlRewards.js';
import { affixLine } from '../../systems/loot/lootRarity.js';

/** @param {Document} doc @param {string} tag @param {string|null} [cls] @param {string|null} [text] */
const el = (doc, tag, cls = null, text = null) => {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/** The journal's divider (enhancedMenu.js pxDivider's markup - its look is the sheet's `.px-divider`). */
function divider(doc, word) {
  const d = el(doc, 'div', 'px-divider');
  d.append(el(doc, 'span', 'px-divword', word));
  return d;
}

/** The tier's floor, in words. */
export function floorWords(tier) {
  const floor = TIER_FLOORS[Math.min(4, Math.max(1, tier | 0))]?.floor ?? 'magic';
  return floor === 'rare' ? t('ql.journal.floorRare', 'Rare or better') : t('ql.journal.floorMagic', 'Magic or better');
}

/** What finishing a stamped quest pays, in one line: the script's own reward and a pick of REWARD_CHOICES pieces. */
export function rewardWords(tier) {
  return t('ql.journal.reward', 'Finish it to choose one of {n} pieces of gear fitted to you ({floor}), beside its own reward.', { n: REWARD_CHOICES, floor: floorWords(tier) });
}

/** The objective's mark: done, failed, or still to do. */
const MARK = Object.freeze({ done: '◆', failed: '✕', open: '◇' });

/**
 * THE BLOCK under a quest's name: what to do, the choices taken, how it ended and what it pays - or null for a quest
 * that is DFU's (no `ql`) or one with nothing to say yet. `ended` draws a finished quest's (its outcome, no reward line).
 * @param {Document} doc @param {any} ql the questLog row's `ql` @param {{ ended?: boolean }} [opts]
 */
export function qlObjectivesBlock(doc, ql, { ended = false } = {}) {
  if (!ql || !doc) return null;
  const objectives = (ql.objectives ?? []).filter((o) => o.state !== 'hidden');
  const choices = ql.choices ?? [];
  if (!objectives.length && !choices.length && !ql.outcome) return null;
  const box = el(doc, 'div', 'px-qobj');
  if (objectives.length) {
    box.append(divider(doc, t('ql.journal.toDo', 'What to do')));
    const list = el(doc, 'ul', 'px-qobj-list');
    list.setAttribute('aria-label', t('ql.journal.toDoLabel', 'What this quest asks of you'));
    let lastAny = null;
    for (const o of objectives) {
      if (o.any && o.any === lastAny) list.append(el(doc, 'li', 'px-qobj-or', t('ql.journal.or', 'or')));
      lastAny = o.any ?? null;
      const li = el(doc, 'li', `px-qobj-row ${o.state}`);
      const mark = el(doc, 'span', 'px-qobj-mark', MARK[o.state] ?? MARK.open);
      mark.setAttribute('aria-hidden', 'true');
      const text = el(doc, 'span', 'px-qobj-text', o.text);
      li.append(mark, text);
      // the state in words, for a reader that cannot see the mark (and a finger that cannot hover)
      const state = o.state === 'done' ? t('ql.journal.done', 'done') : o.state === 'failed' ? t('ql.journal.failed', 'failed') : null;
      if (state) li.append(el(doc, 'span', 'px-qobj-state', state));
      if (o.optional) li.append(el(doc, 'span', 'px-qobj-tag', t('ql.journal.optional', 'optional')));
      list.append(li);
    }
    box.append(list);
  }
  if (choices.length) {
    box.append(divider(doc, t('ql.journal.choices', 'Your choices')));
    for (const c of choices) {
      const p = el(doc, 'p', 'px-qobj-choice');
      p.append(el(doc, 'span', 'px-qobj-q', c.text), el(doc, 'span', 'px-qobj-a', c.choice));
      box.append(p);
    }
  }
  if (ql.outcome) {
    box.append(divider(doc, t('ql.journal.ended', 'How it ended')));
    box.append(el(doc, 'p', `px-qobj-outcome${ql.outcome.failure ? ' failed' : ''}`, ql.outcome.text));
  } else if (!ended && ql.tier) {
    box.append(el(doc, 'p', 'px-qobj-reward', rewardWords(ql.tier)));
  }
  return box;
}

/** A piece's tier in words (the loot ladder's names). */
const TIER_WORD = () => ({ magic: t('ql.journal.magic', 'Magic'), rare: t('ql.journal.rare', 'Rare'), legendary: t('ql.journal.legendary', 'Legendary') });
const KIND_WORD = () => ({ weapon: t('ql.journal.weapon', 'Weapon'), armor: t('ql.journal.armour', 'Armour'), jewel: t('ql.journal.jewel', 'Jewellery') });

/**
 * A REWARD WAITING: its quest, how it ended, and its pieces as cards - each its name, tier, kind and magic, with its
 * Take. `take(index)` hands the piece over (the layer's take - it goes the reward's way, RW1's pile over the pack).
 * @param {Document} doc @param {any} offer the layer's offer @param {(index: number) => void} take
 */
export function qlOfferDetail(doc, offer, take) {
  const box = el(doc, 'div', 'px-qoffer');
  box.append(el(doc, 'p', 'px-qobj-reward', t('ql.journal.offerLead', 'Choose one piece. The others are gone once you take it.')));
  const cards = el(doc, 'div', 'px-qoffer-cards');
  const tierWord = TIER_WORD(), kindWord = KIND_WORD();
  offer.pieces.forEach((p, i) => {
    const card = el(doc, 'div', 'px-qpiece');
    card.dataset.rarity = p.tier;
    card.append(el(doc, 'div', 'px-qpiece-name', p.item?.name ?? '?'));
    if (p.named) card.append(el(doc, 'div', 'px-qpiece-tier px-qpiece-named', t('ql.journal.named', 'This quest\u2019s own')));
    card.append(el(doc, 'div', 'px-qpiece-tier', `${tierWord[p.tier] ?? p.tier} · ${kindWord[p.kind] ?? p.kind}`));
    const lines = el(doc, 'ul', 'px-qpiece-lines');
    (p.item?.affixes ?? []).forEach((_, j) => { const line = affixLine(p.item, j); if (line) lines.append(el(doc, 'li', null, line)); });
    if (lines.children.length) card.append(lines);
    const b = el(doc, 'button', 'act', t('ql.journal.take', 'Take this'));
    b.title = t('ql.journal.takeTitle', 'Take {name}: it is set at your feet and your pack opens over it', { name: p.item?.name ?? '' });
    b.onclick = () => take(i);
    card.append(b);
    cards.append(card);
  });
  box.append(cards);
  return box;
}

/** The rail's row for a reward waiting: its quest's title. */
export const offerRowWords = (offer) => t('ql.journal.offerRow', 'Reward: {title}', { title: offer.title });

/** A line's state in words - the rail's tag and the page's. */
export const lineStateWords = (state) => ({
  running: t('ql.journal.lineRunning', 'Under way'),
  waiting: t('ql.journal.lineWaiting', 'Waiting for its next step'),
  done: t('ql.journal.lineDone', 'Finished'),
  locked: t('ql.journal.lineLocked', 'Not begun'),
})[state] ?? state;

/** A step's mark on the path: done, the one under way, one to come. */
const STEP_MARK = Object.freeze({ done: '◆', current: '◈', next: '◇' });

/**
 * A QUESTLINE'S PAGE: what it is about and who gives it, then its steps as the path walked - each done step struck
 * with how it ended, the step under way marked, the steps to come named (a line is a story the player can see the shape
 * of) - what it waits on, and how it ended or what finishing it earns. Every line says what a questline is, on the page
 * (plain words: the tab explains itself).
 * @param {Document} doc @param {any} line a row of the bridge's questLog `lines` (systems/questlines/qlLineRunner.js rows)
 * @param {{ titleText?: (key: string) => string }} [opts] the title's words (ui/playerBadge.js TITLE_TEXT)
 */
export function qlLineDetail(doc, line, { titleText = (k) => k } = {}) {
  const box = el(doc, 'div', 'px-qline');
  box.append(el(doc, 'p', 'px-qline-what', t('ql.journal.lineWhat', 'A questline is a story told in several quests, one after another. Each step is given when the last one ends.')));
  box.append(el(doc, 'p', 'px-qline-lead', line.lead));
  const giver = el(doc, 'p', 'px-qline-giver');
  giver.append(el(doc, 'span', 'px-qobj-tag', t('ql.journal.lineGiver', 'Given by')), el(doc, 'span', 'px-qline-who', ` ${line.giver}`));
  box.append(giver);
  box.append(el(doc, 'p', `px-qline-state ${line.state}`, lineStateWords(line.state)));
  if (line.opens) box.append(el(doc, 'p', 'px-qobj-reward', line.opens));
  box.append(divider(doc, t('ql.journal.lineSteps', 'The steps')));
  const list = el(doc, 'ol', 'px-qobj-list px-qline-steps');
  list.setAttribute('aria-label', t('ql.journal.lineStepsLabel', 'The steps of this questline, in order'));
  for (const s of line.steps ?? []) {
    const li = el(doc, 'li', `px-qobj-row ${s.state === 'done' ? 'done' : s.state === 'current' ? 'open' : 'next'}`);
    const mark = el(doc, 'span', 'px-qobj-mark', STEP_MARK[s.state] ?? STEP_MARK.next);
    mark.setAttribute('aria-hidden', 'true');
    const words = el(doc, 'span', 'px-qobj-text', s.title);
    li.append(mark, words);
    const state = s.state === 'done' ? t('ql.journal.done', 'done') : s.state === 'current' ? t('ql.journal.stepNow', 'now') : null;
    if (state) li.append(el(doc, 'span', 'px-qobj-state', state));
    if (s.witnessed) {
      const w = el(doc, 'span', 'px-qobj-tag', t('ql.journal.stepWitnessed', 'witnessed'));
      w.title = t('ql.journal.stepWitnessedTitle', 'Done in an endgame place: the account service checks it against that place’s own record before it pays');
      li.append(w);
    }
    list.append(li);
    if (s.state === 'done' && s.outcome) list.append(el(doc, 'li', 'px-qline-said', s.outcome));
  }
  box.append(list);
  if (line.outcome) {
    box.append(divider(doc, t('ql.journal.ended', 'How it ended')));
    box.append(el(doc, 'p', 'px-qobj-outcome', line.outcome));
  }
  if (line.honour) {
    const words = titleText(line.honour);
    box.append(el(doc, 'p', 'px-qobj-reward', line.state === 'done'
      ? t('ql.journal.lineTitleEarned', 'This questline earns the title {title}, held by your account.', { title: words })
      : t('ql.journal.lineTitle', 'Finish it to earn the title {title}, held by your account.', { title: words })));
  }
  return box;
}

/**
 * A GUILD'S LADDER: the guild's own quests, rung by rung - each rung a rank (a promotion), reached or still ahead, its
 * quests struck once finished and marked where they hold a choice. Says what a ladder is, on the page.
 * @param {Document} doc @param {any} ladder a row of the bridge's questLog `ladders`
 */
export function qlLadderDetail(doc, ladder) {
  const box = el(doc, 'div', 'px-qline');
  box.append(el(doc, 'p', 'px-qline-what', t('ql.journal.ladderWhat', 'A guild\u2019s own quests, by the rank that opens them. Each rank is a promotion; a quest marked with a choice ends more than one way.')));
  box.append(el(doc, 'p', 'px-qline-state running', t('ql.journal.ladderRank', 'Your rank: {title}', { title: ladder.rankTitle })));
  for (const rung of ladder.rungs ?? []) {
    box.append(divider(doc, rung.reached ? rung.title : t('ql.journal.ladderAhead', '{title} (not yet)', { title: rung.title })));
    const list = el(doc, 'ul', 'px-qobj-list');
    for (const q of rung.quests) {
      const li = el(doc, 'li', `px-qobj-row ${q.done ? 'done' : rung.reached ? 'open' : 'next'}`);
      const mark = el(doc, 'span', 'px-qobj-mark', q.done ? MARK.done : MARK.open);
      mark.setAttribute('aria-hidden', 'true');
      li.append(mark, el(doc, 'span', 'px-qobj-text', q.title ?? q.name));
      if (q.done) li.append(el(doc, 'span', 'px-qobj-state', t('ql.journal.done', 'done')));
      if (q.flagship) {
        const tag = el(doc, 'span', 'px-qobj-tag', t('ql.journal.ladderChoice', 'a choice'));
        tag.title = t('ql.journal.ladderChoiceTitle', 'This quest asks you to choose, and ends differently for each choice');
        li.append(tag);
      }
      list.append(li);
    }
    box.append(list);
  }
  return box;
}

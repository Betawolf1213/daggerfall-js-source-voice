// @ts-check
// ═══════════════════════════════════════════════════════════════════
// STANDING-WORDS and SEAT-WORDS (2026-10-16, bible/01-Overview/Field-Bugs-2026-10-15c.md; Mac, asked what the guild
// system still left unsaid: "Seat-locked services", "Standing changes shown", "Tutorial + guide words") - WHAT THE
// ROLL'S TRACKER SAYS, as the streaming host wires it (scenes/world.js; the shape is fishHost.js's: the host hands its
// doors in and spreads what comes back into createRollTracker).
//
//   THE HOLD. The book held at 7 was one chat line once a hold, and an Archmage who missed it found a Wizard (Discord:
//   "why did my rank on mages guild fall if i got max reputation"). The line stands, and the Chapters tutorial page
//   pops with it - a box, read once on this device and always again from the menu.
//   THE FIRST WORD. A member of any of the twenty-two coming online is shown the same page the first time.
//   THE STANDING. Nothing said a guild's standing moved: a quest's +5, a crime's loss through the faction tree, a hall
//   writ's +2, the owed paid on a later day. Every adoption now says what the Roll's word moved since its last, one line
//   - "Standing: Mages Guild +5, now 35 (10 more to come)" - its names the player's language's (FACTION.TXT's, else the
//   hall's), its numbers the Roll's own.
//
// THE FOUR HOSTS: the Roll's tracker is world.js's alone (built only online, for a realm character) - WIRED here;
// worldModes.js and dungeonContext.js are entered from it and read the same tracker through the host's doors;
// exterior.js, the offline fixed city, keeps no Roll (offline the standing is DFU's, unsaid as DFU's - nothing to wire).
// ═══════════════════════════════════════════════════════════════════
import { bookCappedLine, hallPosterName, ROLL_FACTIONS, rollFactionOfGuild } from '../net/npcChapterLaw.js';
import { getLocalizedFactionName, t } from '../systems/textManager.js';
import { noteFirstUse } from '../systems/tutorials.js';
import { activeMemberships } from '../systems/guilds.js';

/** A guild faction's name as the player reads it: the faction's own (FACTION.TXT's, in the player's language), else the
 *  hall's, else its number. */
export function standingName(/** @type {any} */ entity, /** @type {number} */ f) {
  const raw = entity?.factionRep?.dict?.get?.(f)?.name;
  return (raw != null ? getLocalizedFactionName(f, raw) : null) ?? hallPosterName(f) ?? String(f);
}

/** The twenty-two the character belongs to, by the active book (DFU's - a vampire's mortal guilds lie dormant). */
export const rollMembershipsOf = (/** @type {any} */ entity) => new Set(Object.values(activeMemberships(entity) ?? {})
  .map((m) => rollFactionOfGuild(m?.guild)).filter((f) => /** @type {readonly unknown[]} */ (ROLL_FACTIONS).includes(f)));

/** Whether the character belongs to any of the twenty-two the Roll keeps. */
export const holdsRollMembership = (/** @type {any} */ entity) => rollMembershipsOf(entity).size > 0;

/** One move, said (npcChapterLaw.js rollMovesOf's `{ f, delta | paid, now, owed }`). */
function standingItem(/** @type {any} */ entity, /** @type {{ f: number, delta?: number, paid?: number, now: number, owed: number }} */ c) {
  const args = { name: standingName(entity, c.f), now: c.now, owed: c.owed, paid: c.paid ?? 0,
    delta: Number(c.delta) > 0 ? `+${c.delta}` : String(c.delta ?? 0) };
  if (c.delta) {
    return c.owed > 0 ? t('chapters.standing.itemOwed', '{name} {delta} (now {now}, {owed} more to come)', args)
      : t('chapters.standing.item', '{name} {delta} (now {now})', args);
  }
  return c.owed > 0 ? t('chapters.standing.paidOwed', '{name}: {paid} of what was owed arrived (now {now}, {owed} more to come)', args)
    : t('chapters.standing.paid', '{name}: {paid} of what was owed arrived (now {now})', args);
}

/** THE STANDING'S LINE: one line for an adoption's moves - or null when nothing moved. The guilds the character belongs
 *  to are named; the rest are counted (AUDIT GUILD-WORDS L2-3: DFU's drift and REP4's recovery move every standing a
 *  point, and a line of twenty-two names said nothing). */
export function standingLine(/** @type {any} */ entity, /** @type {{ f: number, delta?: number, paid?: number, now: number, owed: number }[]} */ changes) {
  const moved = (changes ?? []).filter((c) => (Number.isSafeInteger(c?.delta) && c.delta !== 0) || (Number.isSafeInteger(c?.paid) && c.paid !== 0));
  if (!moved.length) return null;
  const mine = rollMembershipsOf(entity);
  const named = moved.filter((c) => mine.has(c.f)).map((c) => standingItem(entity, c));
  const others = moved.length - named.length;
  if (!named.length) return t('chapters.standing.othersOnly', 'Standing moved with {n, plural, one {# guild} other {# guilds}} you do not belong to.', { n: others });
  const list = others ? [...named, t('chapters.standing.others', 'and {n, plural, one {# other guild} other {# other guilds}}', { n: others })] : named;
  return t('chapters.standing.line', 'Standing: {list}', { list: list.join(', ') });
}

/**
 * The tracker's doors the host spreads in: `entityOf()` the playing character, `say(text)` the host's chat notice (a
 * lazy door - world.js declares its chat below the tracker).
 * @param {{ entityOf: () => any, say: (text: string) => void }} o
 */
export function rollNoticeDoors({ entityOf, say }) {
  return {
    // CHAP4b: the book held at 7, said once a hold - and SEAT-WORDS: the Chapters page with it
    onCapped: (/** @type {number[]} */ factions) => {
      const line = bookCappedLine(factions);
      if (line) say(line);
      noteFirstUse('chapters');
    },
    onStanding: (/** @type {{ f: number, delta?: number, paid?: number, now: number, owed: number }[]} */ changes, /** @type {boolean} */ first) => {
      if (first && holdsRollMembership(entityOf())) noteFirstUse('chapters');
      const line = standingLine(entityOf(), changes);
      if (line) say(line);
    },
  };
}

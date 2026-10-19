// @ts-check
// QL1/QL3 (bible/06-Systems/Questlines-Arc.md decisions 2 and 8, sections 2 and 5): THE LAYER - made once by the quest
// bridge (scenes/quest/questBridge.js createQuestBridge, THE ONE CONSTRUCTION SEAM: every host that has quests holds the
// bridge, so no host builds a layer of its own). It answers the machine's two questions - a starting quest's stamp
// (deps.questlinesStamp), a paying quest's gold (deps.questReward) - and the bridge's three: what moved this tick
// (look), what a journal row shows (rowOf), what a quest that ends is owed (ending: its outcome, standing and gear)
// and what its filed entry says of it (outcomeLine).
//
// WHAT IT KEEPS of its own (snapshot/restore, beside the machine's envelope in the bridge's save): the rewards waiting to
// be chosen - a quest's choice outlives the quest (the machine drops a tombstone after a week), so the three pieces are
// the character's from the moment they are rolled, until one is taken - and the questlines begun (QL12-QL16: its line
// runner's records, qlLineRunner.js).
import { startStamp, isStamped, observe, readObjectives, outcomeOf, outcomeNow, fallbackOutcome, tierOf } from './qlLaw.js';
import { sheetFor } from './qlSheets.js';
import { scaleGold, rewardTier, payOf, rollRewardChoice, rewardSeed, standingOf } from './qlRewards.js';
import { isGoldPieces } from '../inventory.js';
import { createLineRunner } from './qlLineRunner.js';
import { noteFirstUse } from '../tutorials.js';   // QL2: the Tutorials' Questlines page, the first quest stamped

/** How many rewards may wait to be chosen at once - a player who never chooses keeps the last few, never a hoard. */
export const OFFERS_MAX = 12;

/**
 * @param {{ machine: any, questLists?: any, ctx?: any, service?: any, nowMs?: () => number }} deps - `ctx` is the
 *   bridge's host context: carriesQuestItem, playerEntity, changeReputation, changeLegalRep, offerReward,
 *   onQuestlineOffer (the window's door), and for the lines (QL12): nowSeconds (the character's clock), online (an
 *   account to claim for), onHonour (a title or key the service paid), expand (the window's quiet read of quest text);
 *   `service` the account service's door (scenes/quest/questlineHost.js), null offline.
 */
export function createQuestlines({ machine, questLists = null, ctx = {}, service = null, nowMs = undefined }) {
  const probe = { carries: (r) => !!ctx.carriesQuestItem?.(r) };
  /** The rewards waiting: `[{ id, questName, title, outcome, tier, pieces: [{ item, tier, kind }] }]`, oldest first. */
  let offers = [];
  let nextOffer = 1;
  /** QL12 (section 4.4): the quests this character finished well while the questlines were on - upper-case name ->
   *  its outcome's id - so a guild's ladder (qlLadders.js) can mark what is done. Bounded by the pack's quest names. */
  let history = {};
  /** QL12-QL16: the questlines, run over this machine. */
  const runner = createLineRunner({
    machine, service, nowMs,
    ctx: {
      level: () => ctx.playerEntity?.level ?? 1,
      online: () => !!ctx.online?.(),
      nowSeconds: () => ctx.nowSeconds?.() ?? 0,
      onHonour: (h) => ctx.onHonour?.(h),
      outcomeText: (quest) => layer.outcomeLine(quest, ctx.expand),
    },
  });

  const layer = {
    /** machine deps.questlinesStamp: a fresh state with the quest's tier while the switch is on, else null. */
    stamp(quest) {
      const st = startStamp();
      if (!st) return null;
      if (sheetFor(quest?.questName)) noteFirstUse('questlines');   // QL2: the first quest that shows objectives
      const meta = questLists?.findQuestMeta?.(quest?.questName) ?? null;
      st.tier = tierOf({
        minReq: meta?.scope === 'init' ? null : meta?.quest?.minReq ?? null,
        social: meta?.scope === 'social',
        level: ctx.playerEntity?.level ?? 1,
        sheetTier: sheetFor(quest?.questName)?.tier ?? null,
      });
      return st;
    },

    /** After each machine tick: latch what each stamped quest's state has now shown. Answers the moves, quest by quest
     *  (`[{ quest, done, failed, chose, outcome }]` - only quests where something moved), for the herald. */
    look() {
      const news = [];
      for (const quest of machine.quests.values()) {
        if (!isStamped(quest) || quest.questTombstoned) continue;
        const sheet = sheetFor(quest.questName);
        if (!sheet) continue;
        const moved = observe(quest, sheet, probe);
        if (moved.done.length || moved.failed.length || moved.chose.length || moved.outcome) news.push({ quest, ...moved });
      }
      runner.look();   // QL12: each line's next step, when it is due
      return news;
    },

    /**
     * A journal row's questline part, or null for DFU's quest (unstamped, or no sheet): `{ tier, family, objectives,
     * choices, outcome }` - each objective `{ id, text, state, optional, group, any, mark }` with its text read in the
     * player's words through `expand` (the window's quiet read - ui/quest/questLens.js quietText), hidden ones left out.
     */
    rowOf(quest, expand = (_q, text, _key) => text) {
      if (!isStamped(quest)) return null;
      const sheet = sheetFor(quest.questName);
      if (!sheet) return null;
      const objectives = readObjectives(quest, sheet, probe).filter((o) => o.state !== 'hidden')
        .map((o) => ({ ...o, text: expand(quest, o.text, `${sheet.quest}.${o.id}`) }));
      const choices = (sheet.branches ?? []).filter((b) => quest.ql.choices[b.id]).map((b) => {
        const c = b.choices.find((x) => x.id === quest.ql.choices[b.id]);
        return { branch: b.id, text: expand(quest, b.text, `${sheet.quest}.${b.id}`), choice: c ? expand(quest, c.text, `${sheet.quest}.${b.id}.${c.id}`) : '' };
      });
      const o = outcomeOf(quest, sheet);
      return {
        tier: quest.ql.tier, family: sheet.family ?? null, objectives, choices,
        outcome: o ? { id: o.id, text: expand(quest, o.text, `${sheet.quest}.${o.id}`), failure: !!o.failure } : null,
      };
    },

    /**
     * machine deps.questReward - GivePc's moment (quest/actions.js): a gold reward scaled by the outcome the quest's state
     * holds NOW (not latched: a quest may pay before it ends - M0B00Y16 pays at the giant's death and ends at the
     * merchant's rescue), and the quest marked paid. `dfItem` is the script's reward item (null for `give pc nothing`);
     * `resource` its Item resource. A LETTER IS NOT PAY: `give pc _letter_` hands the player the quest's own mail (the
     * main quest's invitations - _BRISIEN, S0000988), which marks nothing paid.
     */
    reward(quest, dfItem, resource = null) {
      if (!isStamped(quest)) return;
      if (resource?.itemName === 'letter') return;
      const sheet = sheetFor(quest.questName);
      if (sheet) observe(quest, sheet, probe);
      if (sheet && dfItem && !quest.ql.paid) scaleGold(dfItem, outcomeNow(quest, sheet, probe) ?? fallbackOutcome({ ...quest, questSuccess: true }, sheet), isGoldPieces(dfItem));
      quest.ql.paid = true;
    },

    /**
     * machine deps.questEnding - the quest's own `end quest` (quest.js endQuest): the outcome SETTLED - the first whose
     * binding holds as the quest ends, else its success or failure fallback - the standing it names moved, and, for a
     * quest that paid (its script's GivePc, or a success) and an outcome that pays gear, its choice of three rolled and
     * set waiting. Once a quest (a resync's second end changes nothing). Answers the offer made, or null.
     */
    ending(quest) {
      if (!isStamped(quest) || quest.ql.moved) return null;
      const sheet = sheetFor(quest.questName);
      if (!sheet) return null;
      observe(quest, sheet, probe, { settle: true, ending: true });
      quest.ql.moved = true;
      const outcome = outcomeOf(quest, sheet);
      runner.ended(quest, outcome);   // QL12: a line's step - the line moves on, or offers it again
      if (outcome ? !outcome.failure : quest.questSuccess) history[String(quest.questName).toUpperCase()] = outcome?.id ?? 'done';
      if (!outcome) return null;
      for (const st of standingOf(outcome)) ctx.changeReputation?.(st.factionId, st.amount, false);
      if (Number.isSafeInteger(outcome.legal) && outcome.legal !== 0) ctx.changeLegalRep?.(outcome.legal);
      if (!payOf(outcome).gear || outcome.failure || !(quest.ql.paid || quest.questSuccess)) return null;
      const tier = rewardTier(quest.ql.tier, outcome);
      const pieces = rollRewardChoice({ seed: rewardSeed(quest), level: ctx.playerEntity?.level ?? 1, tier, entity: ctx.playerEntity ?? null });
      if (!pieces.length) return null;
      // QL3 (section 5.2): a questline's ending NAMES one piece - the card of its kind (or the first) carries the outcome's
      // name, rolled by the same producer as its two companions, so the item law reads it as any piece; once a character
      const named = outcome.named;
      if (named && !history[`named:${quest.questName}`]) {
        const p = pieces.find((x) => x.kind === named.kind) ?? pieces[0];
        p.item.name = named.name;
        p.named = true;
        history[`named:${quest.questName}`] = named.name;
      }
      const offer = { id: nextOffer++, questName: quest.questName, title: quest.displayName || quest.questName, outcome: outcome.id, tier, pieces };
      offers.push(offer);
      if (offers.length > OFFERS_MAX) offers = offers.slice(-OFFERS_MAX);
      ctx.onQuestlineOffer?.(offer);
      return offer;
    },

    /** The line the notebook files beside a stamped quest's ended entry - its outcome's words, read through `expand`
     *  (the quiet read), or null (DFU's quest, no sheet, no outcome). */
    outcomeLine(quest, expand = (_q, text, _key) => text) {
      if (!isStamped(quest)) return null;
      const sheet = sheetFor(quest.questName);
      const o = sheet ? outcomeOf(quest, sheet) : null;
      return o ? expand(quest, o.text, `${sheet.quest}.${o.id}`) : null;
    },

    /** QL11: an act the player did - a fish caught, a breach closed - heard by every running stamped quest, counted in
     *  its state (the `act` binding and `ql act` read it). A quest set aside or ending hears nothing. */
    act(kind, n = 1) {
      if (typeof kind !== 'string' || !kind || !(n > 0)) return 0;
      let heard = 0;
      for (const quest of machine.quests.values()) {
        if (!isStamped(quest) || quest.questComplete || quest.questTombstoned || quest.shelvedAt != null) continue;
        quest.ql.acts[kind] = (quest.ql.acts[kind] ?? 0) + Math.floor(n);
        heard++;
      }
      return heard;
    },

    /** The rewards waiting to be chosen, oldest first. */
    offers: () => offers.map((o) => ({ ...o })),

    /** The player takes piece `index` of offer `id`: it goes the reward's way (ctx.offerReward - RW1's pile, opened over
     *  the pack), and the offer is gone. Answers the item taken, or null. */
    take(id, index) {
      const i = offers.findIndex((o) => o.id === id);
      if (i < 0) return null;
      const piece = offers[i].pieces[index];
      if (!piece) return null;
      offers.splice(i, 1);
      ctx.offerReward?.(null, piece.item);
      return piece.item;
    },

    /** QL12-QL16: the questlines, every one, as the window draws them (qlLineRunner.js rows). */
    lines: () => runner.rows(),
    /** QL12 (section 4.4): what this character finished well, by quest name (a copy). */
    history: () => ({ ...history }),
    /** The line runner, for the pins. */
    runner,

    /** The layer's own save: the rewards waiting, and the questlines begun. */
    snapshot: () => ({ offers: structuredClone(offers), nextOffer, lines: runner.snapshot(), history: { ...history } }),
    restore(data) {
      runner.restore(data?.lines);
      history = {};
      if (data?.history && typeof data.history === 'object') for (const [k, v] of Object.entries(data.history)) if (typeof v === 'string' && /^(named:)?[A-Z0-9$_]{1,12}$/.test(k)) history[k] = v;
      offers = Array.isArray(data?.offers) ? data.offers.filter((o) => o && Number.isSafeInteger(o.id) && Array.isArray(o.pieces) && o.pieces.length).slice(-OFFERS_MAX).map((o) => structuredClone(o)) : [];
      nextOffer = Math.max(Number.isSafeInteger(data?.nextOffer) ? data.nextOffer : 1, ...offers.map((o) => o.id + 1), 1);
    },
  };
  return layer;
}

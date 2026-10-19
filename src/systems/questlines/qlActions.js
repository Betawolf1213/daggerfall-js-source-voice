// @ts-check
// QL4 (bible/06-Systems/Questlines-Arc.md section 2.3): THE QUESTLINES' ACTIONS - five lines a quest script may say
// that DFU's machine does not know, registered by the quest bridge beside DFU's 82 (scenes/quest/questBridge.js), as
// Jagget's four are (systems/quest/questActionsExtension.js, FORAGE1). Not DFU members; Port-Ledger A (QL4).
//
//   ask <message> choices <message> _task_ <message> _task_ [...]   two to four choices, each its own words (a message
//                                                                   of the quest's), the one taken sets its task. DFU's
//                                                                   `prompt` is its two-choice case with Yes and No for
//                                                                   words, and stays as it is; `promptmulti` names
//                                                                   BUTTONS.RCI records, fixed words. A branch is a
//                                                                   choice in the player's own words.
//   outcome _name_                                                  the outcome a path reached - written into a stamped
//                                                                   quest's state where the script decides it, rather
//                                                                   than read off a task (qlLaw.js observe's latch); a
//                                                                   DFU quest's (unstamped) says nothing.
//   ql act <kind> <n>                                               a trigger (QL11): true once the player has done <n>
//                                                                   acts of <kind> since the task was armed - a fish
//                                                                   caught, a breach closed, a Redoubt taken. The acts
//                                                                   are the layer's (qlLayer.js act), heard from the
//                                                                   features; a quest that is not stamped hears none.
//   ql paid                                                         the quest paid, quietly: its success and its
//                                                                   outcome's reward (qlLayer.js reward), without the
//                                                                   QuestComplete box `give pc nothing` raises - for a
//                                                                   branch's other way, whose words are its own (a box
//                                                                   that says "here is your gold" over a fee the player
//                                                                   waived is a lie).
//   ql name _person_ <Given_Name>                                   QL12: a questline's giver by their own name (Ysolde
//                                                                   Marnhel, who wrote the breach's book), where DFU
//                                                                   names a Person only from its name banks or FACTION.TXT's
//                                                                   individuals; underscores are spaces. Said first in the
//                                                                   start-up, before the talk shows the person.
import { ActionTemplate } from '../quest/actions.js';
import { Symbol as QuestSymbol } from '../quest/symbol.js';
import { isStamped } from './qlLaw.js';

const SYMBOL = '[a-zA-Z0-9_.]+';

/** `ask` - a choice in the player's own words. The host shows the question's message and the choices' messages
 *  (hooks.showChoice - a box, then a pick that cannot be dismissed without a choice, as PromptMulti's box cannot -
 *  PromptMulti.cs:87-88); the choice taken starts its task. COMPLETE ONLY ON THE ANSWER: while the question is up it is
 *  not asked again, and a question no one answered - the page reloaded under it, the box torn down with its scene - is
 *  asked again (the `asking` latch is no save state: a load asks afresh). A host that answers null (closed unanswered)
 *  is asked again too. allowRearm false, as PromptMulti: once answered, the task must be armed again to ask again. */
export class QlAsk extends ActionTemplate {
  static typeName = 'QlAsk';
  get saveShape() { return [['id'], ['choiceIds'], ['choiceTasks', 'symArray']]; }
  constructor(parentQuest) {
    super(parentQuest);
    this.allowRearm = false;
    this.asking = false;   // the question is up - transient: a load asks again
    this.id = 0;
    /** @type {number[]} */
    this.choiceIds = [];
    /** @type {any[]} */
    this.choiceTasks = [];
  }
  get pattern() { return new RegExp(`^\\s*ask (?<id>\\d+) choices (?<rest>(?:\\d+ ${SYMBOL}\\s*){2,4})$`); }
  createNew(source, parentQuest) {
    const match = this.test(source);
    if (!match) return null;
    const words = match.groups.rest.trim().split(/\s+/);
    if (words.length % 2 !== 0) return null;
    const action = new QlAsk(parentQuest);
    action.id = Number.parseInt(match.groups.id, 10);
    for (let i = 0; i < words.length; i += 2) {
      action.choiceIds.push(Number.parseInt(words[i], 10));
      action.choiceTasks.push(new QuestSymbol(words[i + 1]));
    }
    return action;
  }
  update(_caller) {
    if (this.asking) return;
    const quest = this.parentQuest;
    const message = quest.getMessage(this.id);
    const choices = this.choiceIds.map((id) => quest.getMessage(id));
    if (!message || choices.some((c) => !c)) {
      console.warn(`[quest] ${quest.questName}: ask ${this.id} names a message the quest does not have - nothing asked`);
      this.setComplete();
      return;
    }
    if (!quest.hooks?.showChoice) return;   // no host to ask: the question waits, as a prompt with no box does
    this.asking = true;
    quest.hooks.showChoice(quest, message, choices, (index) => {
      this.asking = false;
      const sym = Number.isInteger(index) ? this.choiceTasks[index] : null;
      if (!sym) return;   // closed unanswered: asked again on the next tick
      this.setComplete();
      quest.startTask(sym);
    });
  }
}

/** `outcome _name_` - the outcome a stamped quest reached, written where the script says it (first one stands). */
export class QlOutcome extends ActionTemplate {
  static typeName = 'QlOutcome';
  constructor(parentQuest) {
    super(parentQuest);
    /** @type {any} */
    this.outcomeSymbol = null;
  }
  get saveShape() { return [['outcomeSymbol', 'sym']]; }
  get pattern() { return new RegExp(`^\\s*outcome (?<name>${SYMBOL})\\s*$`); }
  createNew(source, parentQuest) {
    const match = this.test(source);
    if (!match) return null;
    const action = new QlOutcome(parentQuest);
    action.outcomeSymbol = new QuestSymbol(match.groups.name);
    return action;
  }
  update(_caller) {
    const quest = this.parentQuest;
    if (isStamped(quest) && !quest.ql.outcome && this.outcomeSymbol?.name) quest.ql.outcome = this.outcomeSymbol.name;
    this.setComplete();
  }
}

/** `ql act <kind> <n>` - a trigger on the acts a stamped quest has heard: true once <n> more than when its task was
 *  first asked. The count it started from is saved, so a reload never restarts it. */
export class QlAct extends ActionTemplate {
  static typeName = 'QlAct';
  get saveShape() { return [['kind'], ['count'], ['from']]; }
  constructor(parentQuest) {
    super(parentQuest);
    this.isTriggerCondition = true;
    this.kind = '';
    this.count = 1;
    /** @type {number|null} */
    this.from = null;
  }
  get pattern() { return /^\s*ql act (?<kind>[a-z][a-z0-9-]{0,39}) (?<n>\d+)\s*$/; }
  createNew(source, parentQuest) {
    const match = this.test(source);
    if (!match) return null;
    const action = new QlAct(parentQuest);
    action.kind = match.groups.kind;
    action.count = Math.max(1, Number.parseInt(match.groups.n, 10));
    return action;
  }
  checkTrigger(_caller) {
    const quest = this.parentQuest;
    if (!isStamped(quest)) return false;
    const heard = quest.ql.acts?.[this.kind] ?? 0;
    if (this.from == null) this.from = heard;
    return heard - this.from >= this.count;
  }
}

/** `ql paid` - GivePc's `nothing` arm without its box (quest/actions.js GivePc): the quest a success, and the layer told
 *  it paid at the script's own moment, so its outcome's gear waits as a reward's does. A DFU quest (unstamped) is still
 *  made a success - the line is the script's word that this way ends well. */
export class QlPaid extends ActionTemplate {
  static typeName = 'QlPaid';
  get pattern() { return /^\s*ql paid\s*$/; }
  createNew(source, parentQuest) {
    return this.test(source) ? new QlPaid(parentQuest) : null;
  }
  update(_caller) {
    const quest = this.parentQuest;
    quest.hooks?.questReward?.(quest, null);
    quest.questSuccess = true;
    this.setComplete();
  }
}

/** `ql name _person_ <Name>` - the person's name, the script's own (underscores read as spaces); saved with the person
 *  (quest/person.js's `displayName`), so a load keeps it. A symbol that is no person warns and is done. */
export class QlName extends ActionTemplate {
  static typeName = 'QlName';
  constructor(parentQuest) {
    super(parentQuest);
    /** @type {any} */
    this.personSymbol = null;
    this.given = '';
  }
  get saveShape() { return [['personSymbol', 'sym'], ['given']]; }
  get pattern() { return /^\s*ql name (?<sym>_[a-zA-Z0-9_.]+_) (?<given>[A-Za-z][A-Za-z'_-]{0,47})\s*$/; }
  createNew(source, parentQuest) {
    const match = this.test(source);
    if (!match) return null;
    const action = new QlName(parentQuest);
    action.personSymbol = new QuestSymbol(match.groups.sym);
    action.given = match.groups.given.replace(/_/g, ' ');
    return action;
  }
  update(_caller) {
    const person = this.parentQuest.getPerson?.(this.personSymbol);
    if (person) person.displayName = this.given;
    else console.warn(`[questlines] ql name: no person ${this.personSymbol?.original ?? this.personSymbol?.name}`);
    this.setComplete();
  }
}

/** The questlines' templates, in the order the bridge registers them (after DFU's 82 - a first-match scan, and no DFU
 *  pattern claims any of these lines: test/systems/questlines/ql4_actions.test.js). */
export const questlineActionTemplates = () => [new QlAsk(null), new QlOutcome(null), new QlAct(null), new QlPaid(null), new QlName(null)];

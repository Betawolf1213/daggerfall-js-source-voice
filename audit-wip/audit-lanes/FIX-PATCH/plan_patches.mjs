// FIX-PATCH: the patch files' changes - BRANCH-4/5/6/8/13/16 (see the report).
import { fam, rep, msg, addMsg, saveAll } from './editlib.mjs';
import { handinPatches } from '/home/user/daggerfall-js-source/tools/qlPatchKit.mjs';
import { baseText } from '/home/user/daggerfall-js-source/test/qlSources.mjs';
console.warn = () => {};
const FG = 'fightersGuild.json', KO = 'knightlyOrders.json', MG = 'magesGuild.json', DB = 'darkBrotherhood.json', HO = 'holyOrders.json',
  NO = 'nobility.json', ME = 'merchants.json', CO = 'commoners.json', WI = 'witches.json', VA = 'vampires.json';
const C = true, L = false;

// ---- Fighters Guild
// M0B50Y09 (BRANCH-4): cut again by the kit, its map reader copied to the second answer
fam('patches', FG).patches.M0B50Y09 = handinPatches('M0B50Y09', '_victory_', {
  ask: "The merchant's purse is light for a gargoyle, %pcf. How will you take your pay?",
  keep: 'The fee, as agreed.', alt: "Waive it for the Guild's name.",
}, { readers: 'copy', replace: true });
msg(FG, 'M0B60Y10', 1900, "It's done, then. Not a word of this to the Mages Guild - the client was very clear. We understand each other?", C);
msg(FG, 'M0B60Y10', 1901, 'Not a word. Pay me.', L);
msg(FG, 'M0B60Y10', 1902, "I'll tell the Mages Guild.", L);
msg(FG, 'M0B21Y19', 1900, '_daughter_ unwraps an heirloom from its cloth and holds it out to you. It is all she has left of her father.', C);
msg(FG, 'M0B21Y19', 1902, 'Refuse - she has lost enough.', L);

// ---- Knightly Orders (BRANCH-5: the keep gives what it offers; BRANCH-6: DFU's `give pc nothing` kept on the refusal)
const keepGold = (quest, item, declare) => {
  const text = baseText(quest).replace(/\r\n?/g, '\n');
  const m = /(_success_ task:\n\twhen _S\.02_ and _S\.01_ ?\n)(\tgive pc nothing ?\n)/.exec(text);
  const list = fam('patches', KO).patches[quest];
  if (!m || list[0].old !== m[1]) throw new Error(`${quest}: reward task not as read`);
  list[0] = { old: m[1] + m[2], new: `_success_ task:\n\twhen _qlkeep_\n\tgive pc ${item}\n`, count: 1 };
  if (declare) rep(KO, quest, '\nQBN:', `\nQBN:\nItem ${item} gold`);
  rep(KO, quest, '_qlaltpath_ task:\n\twhen _qlalt_\n\tql paid\n', '_qlaltpath_ task:\n\twhen _qlalt_\n\tgive pc nothing\n');
};
keepGold('B0B40Y08', '_qlgold_', true);
msg(KO, 'B0B40Y08', 1900, "The orcs' plunder from the caravans still lies in ___dungeon_, %pcf. By the old custom of arms, the spoils of a war band belong to the knight who broke it. Will you claim them?", C);
msg(KO, 'B0B40Y08', 1901, 'I claim them by the sword.', L);
msg(KO, 'B0B40Y08', 1902, 'Return them to the caravans.', L);
keepGold('B0B40Y09', '_gold_', false);
msg(KO, 'B0B40Y09', 1900, 'The herders whose cattle that giant ate have scraped together a purse for you, %pcf. It is not much - it is what the giant left them. Will you take it?', C);
msg(KO, 'B0B40Y09', 1901, 'I will. It was fairly earned.', L);
msg(KO, 'B0B40Y09', 1902, 'No. Let them buy new cattle.', L);
keepGold('B0B60Y12', '_gold_', false);
msg(KO, 'B0B60Y12', 1900, '_nobleman_ says the grave goods in ___dungeon_ are yours for your trouble, %pcf - the old woman has no more use for them. Will you take them?', C);
msg(KO, 'B0B60Y12', 1901, "I accept the heir's gift.", L);
msg(KO, 'B0B60Y12', 1902, 'Leave them with her ashes.', L);
keepGold('B0B80Y17', '_qlgold_', true);
msg(KO, 'B0B80Y17', 1900, "The lich's books of necromancy still lie in its lair in ___dungeon_, %pcf. The Mages Guild offers good coin to study them; the temple would see them burned. The choice is yours - you won them.", C);
msg(KO, 'B0B80Y17', 1901, 'Sell them to the Mages Guild.', L);
msg(KO, 'B0B80Y17', 1902, 'Burn them, as the temple asks.', L);
// B0B70Y14 (BRANCH-16: the question names no rogue mage before the questor does; BRANCH-6: the story told on the refusal)
msg(KO, 'B0B70Y14', 1900, '_qgiver_ holds out a purse of gold - an odd thing, in an order that does not pay its own. Will you take it?', C);
msg(KO, 'B0B70Y14', 1901, 'I will take the gold.', L);
msg(KO, 'B0B70Y14', 1902, 'No. I fight for glory.', L);
addMsg(KO, 'B0B70Y14', 1903, 'So you killed the Daedra, eh? It turns out we were duped by a rogue mage. She summoned a Daedra she could not control, and told us her story so we would slay it for free rather than pay the Fighters Guild. You will not take her gold? Then the Fighters Guild shall have it - it is the fee she cheated them of.');
rep(KO, 'B0B70Y14', '_qlaltpath_ task:\n\twhen _qlalt_\n\tql paid\n', '_qlaltpath_ task:\n\twhen _qlalt_\n\tsay 1903\n\tql paid\n');
// B0B70Y16 and B0B50Y11: DFU's box praises what the refusal turned down - the refusal says its own words
msg(KO, 'B0B70Y16', 1900, 'The order will ask who slew the dragon, %pcf. As we agreed - we both stood before it. You will tell them so, won\'t you?', C);
msg(KO, 'B0B70Y16', 1901, 'A bargain is a bargain.', L);
msg(KO, 'B0B70Y16', 1902, "I'll tell the order the truth.", L);
addMsg(KO, 'B0B70Y16', 1903, 'You tell the order the truth of the dragon\'s death. All hail %pcn, known from this point onward as a dragonslayer! _qgiver_ will not meet your eyes.');
rep(KO, 'B0B70Y16', '_qlaltpath_ task:\n\twhen _qlalt_\n\tql paid\n', '_qlaltpath_ task:\n\twhen _qlalt_\n\tsay 1903\n\tql paid\n');
msg(KO, 'B0B50Y11', 1900, '_nobleman_ is so pleased, %pcf, that a fountain is to be raised with your name carved upon it. Shall I tell _nobleman_ you accept the honour?', C);
msg(KO, 'B0B50Y11', 1901, 'Gladly. Carve my name on it.', L);
msg(KO, 'B0B50Y11', 1902, 'Make it a well, with no name.', L);
addMsg(KO, 'B0B50Y11', 1903, 'A well it shall be, then, for the common folk, and no name upon it. _nobleman_ will be pleased all the same.');
rep(KO, 'B0B50Y11', '_qlaltpath_ task:\n\twhen _qlalt_\n\tql paid\n', '_qlaltpath_ task:\n\twhen _qlalt_\n\tsay 1903\n\tql paid\n');

// ---- Mages Guild
msg(MG, 'N0B40Y07', 1902, 'I will burn the scroll.', L);

// ---- Dark Brotherhood
msg(DB, 'L0A01L00', 1900, 'Before the custom is kept, %pcn: a novice is paid a single gold coin for the first sanctioned death - and the devout give that coin to Mephala. Which will it be?', C);
addMsg(DB, 'L0A01L00', 1903, 'Well done, %pcn. _npc_ was stricken with sudden heart failure. You have shown you can kill with care and not just with a bared blade. You are now a full member of the Dark Brotherhood. Anytime you enter a town, you will know if there are any guild buildings there. Your coin goes to Mephala.');
rep(DB, 'L0A01L00', '_qlaltpath_ task:\n\twhen _qlalt_\n\tql paid\n', '_qlaltpath_ task:\n\twhen _qlalt_\n\tsay 1903\n\tql paid\n');
msg(DB, 'L0B40Y04', 1900, '_knight_ will not see the throne, and our client sits a step nearer to it. A royal so near a crown is worth more to us in debt than in coin, %pcf. Your fee - will you take it, or let it stand as a debt the client owes the Brotherhood?', C);
msg(DB, 'L0B40Y04', 1902, 'Let the debt stand.', L);
msg(DB, 'L0B60Y10', 1900, 'Before I pay you, %pcf: the old accounters would spend a fee like this on the mark\'s rites. Nine men killed in the Betony war, the stories say. That deserves a better grave than gossip. Your choice.', C);
msg(DB, 'L0B60Y10', 1901, 'Take the fee.', L);
msg(DB, 'L0B60Y10', 1902, "Pay for the veteran's rites.", L);

// ---- Holy Orders
msg(HO, 'C0B00Y02', 1900, '_guardian_ backs against the wall, the _item_ in hand. "It was only a game. _child_ played the part, and even _priest_ was fooled. Take the thing back - only let me go, and no one at __qgiver_ need ever know my name."', C);
msg(HO, 'C0B00Y02', 1901, 'Let _guardian_ go.', L);
msg(HO, 'C0B00Y02', 1902, 'Expose _guardian_.', L);
msg(HO, 'C0B00Y02', 1903, '_guardian_ presses the _item_ into your hands and is gone before you can change your mind.', C);
msg(HO, 'C0B00Y02', 1904, '_guardian_ hands over the _item_ and slinks out into the street. __qgiver_ will know the name of the knight who robbed a temple with a child\'s play-acting.', C);

// ---- Nobility
msg(NO, 'R0C11Y03', 1900, '_chemist_ sends word the heart came to %g2 fresh, and the daedra will not soon forget the name of the one who carried it. I have the gold we agreed, %pcf - or, if you would rather, the favour of my house, which at court is worth more.', C);
msg(NO, 'R0C11Y03', 1902, "Your house's favour instead.", L);
msg(NO, 'R0C11Y26', 1900, "The Ripper is dead, and the _reward_ gold I promised is yours, %pcf. Yet it was the women of ___qgiver_'s streets he hunted, and no one has ever paid them a copper for their fear. Will you take it, or shall they?", C);
msg(NO, 'R0C11Y26', 1901, "I'll take the gold.", L);
msg(NO, 'R0C11Y26', 1902, 'Give it to those he hunted.', L);
// R0C11Y16 (BRANCH-16): the question before the stranger's greeting is the player's own - DFU's box greets after it
msg(NO, 'R0C11Y16', 1900, 'A holy relic, and a fine one - some temple is missing it, and its priests would pay well to learn who has it now. Do you hand it over, and say nothing?', C);
msg(NO, 'R0C11Y16', 1901, 'Hand it over. I saw nothing.', L);
msg(NO, 'R0C11Y16', 1902, 'Take no gold. Tell the temple.', L);

// ---- Merchants (BRANCH-16 for K0C01Y10 too: DFU's box opens "Ah, the Bothdorjii Scroll")
msg(ME, 'K0C01Y10', 1900, '_qgiver_ holds out a hand for the Bothdorjii Scroll. The truth about the storm that wrecked your ship is its price - but the scroll wakes the servants of the Princes. Do you hand it over?', C);
msg(ME, 'K0C01Y10', 1901, 'Hand over the scroll.', L);
msg(ME, 'K0C01Y10', 1902, 'Burn the scroll here.', L);
msg(ME, 'K0C01Y10', 1903, 'You burned it? You witless %ra! Have you any notion what that scroll was worth? Get out of my sight. Whoever sent that storm after you, you will not hear it from me.', C);

// ---- Commoners
msg(CO, 'A0C01Y01', 1900, 'They\'re dead - both of them! You have saved my life, %pcf. Here is the gold we agreed, though the gods know I will need every coin if they come again for my land.', C);
msg(CO, 'A0C01Y01', 1901, 'Take the gold we agreed.', L);
msg(CO, 'A0C01Y01', 1902, 'Keep it. Buy stout locks.', L);
// A0C01Y03 (BRANCH-16: no thanks before the letter is read; BRANCH-6: the letter's lesson told on the refusal)
msg(CO, 'A0C01Y03', 1900, "_qgiver_ reaches for _hermit_'s letter with one hand and holds out the promised gold with the other.", C);
msg(CO, 'A0C01Y03', 1901, 'Take the gold, as promised.', L);
msg(CO, 'A0C01Y03', 1902, 'Keep it - a wedding gift.', L);
addMsg(CO, 'A0C01Y03', 1903, '_qgiver_ rips open the letter from _hermit_. "Kindness! Of course. Now I understand why _spouse_ sent me on this quest. It is not enough to love %g2, I have to show %g2 kindness as well. And you have shown me how, %pcf."');
rep(CO, 'A0C01Y03', '_qlaltpath_ task:\n\twhen _qlalt_\n\tql paid\n', '_qlaltpath_ task:\n\twhen _qlalt_\n\tsay 1903\n\tql paid\n');
msg(CO, 'A0C01Y06', 1900, 'Look - finish off _master_, and the gold I was paid to send you there is yours. Every coin. Only keep my name away from the guard, eh?', C);
msg(CO, 'A0C01Y06', 1901, 'Take the gold. Say nothing.', L);
msg(CO, 'A0C01Y06', 1902, 'No. The guard will hear of it.', L);
msg(CO, 'A0C01Y06', 1903, '_qgiver_ goes pale. "You wouldn\'t..." But you would, and the guard will hear of it before the day is out.', C);
// A0C01Y13 (BRANCH-13): the magistrate's way is a success the lover does not pay - `ql paid`, as the sheet's `lawful` says
msg(CO, 'A0C01Y13', 1900, 'Home, at last! I owe you my life, %pcn. Now give me that letter. _giver_ and _sister_ will learn what it is to be afraid.', C);
msg(CO, 'A0C01Y13', 1901, 'Give _lover_ the letter.', L);
msg(CO, 'A0C01Y13', 1902, 'Keep it for the magistrate.', L);
msg(CO, 'A0C01Y13', 1903, '_lover_ stares at you, then laughs bitterly. "The magistrate, then. Much good may it do you. You have my thanks - and nothing more."', C);
rep(CO, 'A0C01Y13', '_qlaltpath_ task:\n\twhen _qlalt_\n\tsay 1903\n', '_qlaltpath_ task:\n\twhen _qlalt_\n\tql paid\n\tsay 1903\n');
msg(CO, 'A0C41Y18', 1900, 'Of course, there is the coward\'s way - the way of whoever gave it to you. Give the _finger_ to some other poor soul, and the mummy will follow it instead of you. I would not. But the choice is yours.', C);
msg(CO, 'A0C41Y18', 1901, 'Destroy the mummy.', L);
msg(CO, 'A0C41Y18', 1902, 'Pass the _finger_ on.', L);
msg(CO, 'A0C41Y18', 1903, 'The next stranger on the road takes your package without a second look. Tonight, the mummy will come for someone else.', C);

// ---- Witches
msg(WI, 'Q0C4XY04', 1900, 'Thou hast it, %pcn, and still it beats! Quickly now, before it cools - what wouldst thou have of thy poor aunts for so fine a heart?', C);
msg(WI, 'Q0C4XY04', 1901, 'The _reward_ you promised.', L);
msg(WI, 'Q0C4XY04', 1902, 'Nothing. A gift for my aunts.', L);

// ---- Vampires
msg(VA, 'P0A01L00', 1900, 'The lesser one is ash, and %vam saw it done. Will you take the ring that marks you as one of us, %pcf - or bind yourself to the family in blood?', C);
msg(VA, 'P0A01L00', 1901, 'Take the ring of %vam.', L);
msg(VA, 'P0A01L00', 1902, 'Swear the blood-oath instead.', L);
addMsg(VA, 'P0A01L00', 1903, 'Excellent, %pcf. You\'ll make a fine member of %vam. Welcome to the family. I am known as _questgiver_. %vam will continue to watch your progress, and we may contact you from time to time on family business. Your oath is sworn, and the blood remembers.');
rep(VA, 'P0A01L00', '_qlaltpath_ task:\n\twhen _qlalt_\n\tql paid\n', '_qlaltpath_ task:\n\twhen _qlalt_\n\tsay 1903\n\tql paid\n');
msg(VA, 'P0B10L08', 1900, "So the Prince's coven has felt the teeth of %vam. Tell me, %pcf - is the Coven of ==daedra_ broken, or only bowed?", C);
msg(VA, 'P0B10L08', 1901, 'Broken. %reg belongs to %vam.', L);
msg(VA, 'P0B10L08', 1902, 'Only bowed. Let it be peace.', L);
// P0B01L02 (BRANCH-16): the vampire's greeting is DFU's box - the question before it is a hand held out
msg(VA, 'P0B01L02', 1900, '_vampire_ holds out a pale hand for the _vamprelic_ of the elder circle.', C);
msg(VA, 'P0B01L02', 1901, 'Give it to _vampire_.', L);
msg(VA, 'P0B01L02', 1902, 'Keep it for yourself.', L);
msg(VA, 'P0B01L02', 1903, 'You would keep a relic of the elder circle from %vam? How very ... mortal of you. Keep it, then, %pcf, and learn how long the patience of %vam lasts.', C);

saveAll();
console.log('patches written');

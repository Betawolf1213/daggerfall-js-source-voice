import sys; sys.path.insert(0, '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/FIX-SCRIPTS')
from ed import rep
Q = '/home/user/daggerfall-js-source/src/systems/questlines/quests/'
NEW = "-- AUDIT QUESTLINES LINES-10: a Person is made fresh in each step's quest (a new name, in whatever town the player\n-- stands in), so this step's giver is introduced as NEW - sent on by the last step's - never spoken of as the same one.\n"
SIGN = "-- AUDIT QUESTLINES LINES-26: the letter signs off on one line, its sender's name and calling - DFU's pack names a\n-- quest letter by its last line (ItemHelper.cs:335-348, itemInfo.js questLetterName).\n"
# ── the court crafter ──
rep(Q + 'QLIP01.txt', [
("-- plant gathered - Professions or Foraging. Nothing is taken: the crafter hears what was found.\n",
 "-- plant gathered - Professions or Foraging. Nothing is taken: the crafter hears what was found.\n" + SIGN),
("""<ce>                                  _crafter_
<ce>                             crafter to the court
""", """<ce>                       _crafter_, crafter to the court
"""),
("""<ce>        by somebody. Now you know where it comes from.
<ce>        Next time, the heavy work: ore and timber."
""", """<ce>        by somebody. Now you know where it comes from.
<ce>        Next, the heavy work: ore and timber. I will
<ce>        send word where to take it."
"""),
])
rep(Q + 'QLIP02.txt', [
("-- Quarrying, a vein's ore or a boulder's stone), wood chopped (Logging, or Foraging's axe). Nothing is taken.\n",
 "-- Quarrying, a vein's ore or a boulder's stone), wood chopped (Logging, or Foraging's axe). Nothing is taken.\n" + NEW),
("""%qdt:
 _crafter_, the court crafter at _store_ in
 __store_, has heavier work for me. I am to
 mine ore or stone three times and chop wood three
 times, and then go back to _store_ to say so.
""", """%qdt:
 Word from the court crafter: heavier work, and a
 colleague to judge it - _crafter_, who keeps the
 court's stock at _store_ in __store_. I am to
 mine ore or stone three times and chop wood three
 times, and then go to _store_ to say so.
"""),
("""<ce>       "Fish and herbs feed the kitchen and the still.
<ce>        Ore and timber are the bones of everything else.
<ce>        You have fed both now. Next, you make something
<ce>        of it yourself."
""", """<ce>       "The court's crafter said you would come back
<ce>        with blisters. Fish and herbs feed the kitchen
<ce>        and the still. Ore and timber are the bones of
<ce>        everything else. You have fed both now. Next,
<ce>        you make something of it yourself."
"""),
("""The court's crafter at _store_? Sends apprentices up the hills for ore, I hear.
<--->
_crafter_ makes for the court. Has a new apprentice, they say. Is that you?
""", """_crafter_ at _store_ keeps the court's stock. Sends apprentices up the hills for ore, I hear.
<--->
_crafter_ is judging the court crafter's new apprentice, they say. Is that you?
"""),
])
rep(Q + 'QLIP03.txt', [
("""-- minted at a station; a brew's potions are no piece, so the words name no alchemy). Nothing is taken.
""", """-- minted at a station; a brew's potions are no piece, nor a dish cooked at a fire - AUDIT QUESTLINES ACTS-4 - so the
-- words name no alchemy, and say a pot on the fire is supper, not a piece). Nothing is taken.
""" + NEW),
("""%qdt:
 _crafter_, the court crafter at _store_ in
 __store_, says a gatherer is only half a crafter.
 The other half is making. I am to make a piece of
 my own at a crafting station - a forge, a loom, a
 bench - and then go back to _store_ to say so.
""", """%qdt:
 Word again from the court crafter: a gatherer is
 only half a crafter. The other half is making. I
 am to make a piece of my own at a crafting
 station - a forge, a loom, a bench - and show it
 to _crafter_, who judges work for the court at
 _store_ in __store_.
"""),
("""<ce>         clothier's, the mason's bench here - any
<ce>          station will do. Then come back to me."
""", """<ce>         clothier's, the mason's bench here - any
<ce>         station will do. A pot on the fire is supper,
<ce>              not a piece. Then come back to me."
"""),
("""<ce>       "Then you need no master, and I have lost an
<ce>        apprentice. The court will hear your name one
<ce>        day. I would like it to hear you began here."
""", """<ce>       "Then you need no master, and the court crafter
<ce>        has lost an apprentice. The court will hear your
<ce>        name one day. I will tell it you began with us."
"""),
("""The court's crafter at _store_? Lost an apprentice to the trade, I hear.
""", """_crafter_ at _store_ judges work for the court. Waiting on an apprentice's piece, I hear.
"""),
])
# ── the smith ──
rep(Q + 'QLIG01.txt', [
("-- socket, from the pack or the Reforge's press). The gem is the player's own: a quest's gift would read as its pay.\n",
 "-- socket, from the pack or the Reforge's press). The gem is the player's own: a quest's gift would read as its pay.\n" + SIGN),
("""<ce>                                    _smith_
<ce>                                    armourer
""", """<ce>                               _smith_, armourer
"""),
])
rep(Q + 'QLIG02.txt', [
("-- reforgePiece, LOOT9: one line of a Magic or Rare piece rolled again, for Welkynd Shards and gold, at the Mages Guild).\n",
 "-- reforgePiece, LOOT9: one line of a Magic or Rare piece rolled again, for Welkynd Shards and gold, at the Mages Guild).\n" + NEW),
("""%qdt:
 _smith_, the armourer at _shop_ in __shop_,
 says the mages can do what no smith can: roll a
 piece's virtue again at the Reforge. I am to have
 a piece reforged at a Mages Guild, then go back to
 _shop_ to say how it went.
""", """%qdt:
 Word from the armourer who taught me to set a
 stone: the mages can do what no smith can, and
 roll a piece's virtue again at the Reforge. I am
 to have a piece reforged at a Mages Guild, then
 tell _smith_, an armourer at _shop_ in __shop_
 who knows the Reforge, how it went.
"""),
])
# ── the tables ──
rep(Q + 'QLIT01.txt', [
("-- the player's, against the locals or other players: systems/card, systems/iliac).\n",
 "-- the player's, against the locals or other players: systems/card, systems/iliac). AUDIT QUESTLINES LINES-27: the next\n-- step begins an hour after this one ends (qlLineRunner.js STEP_GAP_S) with another regular, so the regular sends the\n-- player on to a friend - never \"ask me tomorrow\".\n" + SIGN),
("""<ce>                                 _regular_
<ce>                        the corner table, _inn_
""", """<ce>                       _regular_, at the corner table
"""),
("""<ce>        want to see what you are really made of, there
<ce>        is another game. Ask me about it tomorrow."
""", """<ce>        want to see what you are really made of, there
<ce>        is another game. A friend of mine plays it. I
<ce>        will send you to them."
"""),
])
rep(Q + 'QLIT02.txt', [
("-- a game won against a tavern's regular or another player; Kings-Gambit.md).\n",
 "-- a game won against a tavern's regular or another player; Kings-Gambit.md).\n" + NEW),
("""%qdt:
 _regular_, a regular at _inn_ in __inn_, says
 cards are only luck. The King's Gambit is war
 across a card table: armies, kings and potions. I
 am to win a game of it - fell the other king and
 keep my own - then go back to _inn_ to say so.
""", """%qdt:
 The regular who staked me sent me on to a friend:
 _regular_, who sits at the board at _inn_ in
 __inn_ and says cards are only luck. The King's
 Gambit is war across a card table: armies, kings
 and potions. I am to win a game of it - fell the
 other king and keep my own - then go to _inn_.
"""),
])
# ── the road ──
rep(Q + 'QLIR01.txt', [
("-- the haulage. A wagon carries it if the player has one; the script cannot tell, and its words do not pretend to.\n",
 "-- the haulage. A wagon carries it if the player has one; the script cannot tell, and its words do not pretend to.\n" + SIGN),
("""<ce>                                   _master_
<ce>                                 stable master
""", """<ce>                           _master_, stable master
"""),
])
rep(Q + 'QLIR02.txt', [
("-- the stable master (`toting`), who pays.\n",
 "-- the stable master (`toting`), who pays. The player stands in the buyer's town when it begins, so its stable master\n-- is that town's, who has heard of the haul.\n" + NEW),
("""%qdt:
 _master_, the stable master at _inn_ in
 __inn_, has a longer road for me. A load of
 the stable's own is waiting with _seller_ at
 _yard_ in __yard_. I am to collect it and haul
 it all the way back to _inn_.
""", """%qdt:
 Word of my haul has reached _master_, a stable
 master at _inn_ in __inn_, who has a longer
 road for me. A load of the stable's own is waiting
 with _seller_ at _yard_ in __yard_. I am to
 collect it and haul it all the way back to _inn_.
"""),
])
# ── the stars ──
rep(Q + 'QLIF01.txt', [
("-- professions). Online, as the sky is.\n",
 "-- professions). Online, as the sky is.\n" + SIGN),
("""<ce>                                    _seer_
<ce>                                  astrologer
""", """<ce>                              _seer_, astrologer
"""),
])
rep(Q + 'QLIF02.txt', [
("-- own signs are the port's (Firmament.md section 3).\n",
 "-- own signs are the port's (Firmament.md section 3).\n" + NEW),
("""%qdt:
 _seer_, the astrologer at _temple_ in
 __temple_, says one star is a beginning and
 three are a shape. I am to take three more stars
 on the Firmament, then go back to _temple_ for
 a reading.
""", """%qdt:
 The astrologer who read my first star has sent
 me on to _seer_, who reads the sky at _temple_
 in __temple_: one star is a beginning, and three
 are a shape. I am to take three more stars on the
 Firmament, then go to _temple_ for a reading.
"""),
])
# ── the sea ──
rep(Q + 'QLIS01.txt', [
("-- (qlLines.js \"a harbourmaster\").\nQuest: QLIS01\n",
 "-- (qlLines.js \"a harbourmaster\").\n" + SIGN + "Quest: QLIS01\n"),
("""<ce>                                    _master_
<ce>                                  harbourmaster
""", """<ce>                             _master_, harbourmaster
"""),
])
rep(Q + 'QLIS03.txt', [
("-- the harbourmaster for the purse. The giver is unnamed, as the registry's (qlLines.js \"a harbourmaster\").\n",
 "-- the harbourmaster for the purse. The giver is unnamed, as the registry's (qlLines.js \"a harbourmaster\").\n" + NEW + SIGN),
("""%qdt:
 A note came from _master_, the harbourmaster at
 _tavern_ here in __tavern_. Pirates are taking
 ships off this coast. I am to meet one at sea and
 make her strike her colours, then come back to
 _tavern_ for my purse.
""", """%qdt:
 A note came from _master_, harbourmaster at
 _tavern_ here in __tavern_ and a friend of the
 one who sent me to sea. Pirates are taking ships
 off this coast. I am to meet one at sea and make
 her strike her colours, then come to _tavern_.
"""),
("""     You can sail and you can carry. Now the hard
 part. There are ships off this coast that take
 other ships, and the navy is never where they are.
""", """     The harbourmaster who sent you to sea says you
 can sail and you can carry. Now the hard part.
 There are ships off this coast that take other
 ships, and the navy is never where they are.
"""),
("""<ce>                                    _master_
<ce>                                  harbourmaster
""", """<ce>                             _master_, harbourmaster
"""),
("""There's talk at _tavern_ of a new captain. The harbourmaster's own find.
""", """There's talk at _tavern_ of a new captain, sent up the coast by another harbourmaster.
"""),
])
# ── the watch, the Arena ──
rep(Q + 'QLIW01.txt', [
("-- the town cleansed; raiders strike towns of the Bay every day - bandits, orcs or knights).\n",
 "-- the town cleansed; raiders strike towns of the Bay every day - bandits, orcs or knights).\n" + SIGN),
("""<ce>                                  _captain_
<ce>                              Captain of the Watch
""", """<ce>                    _captain_, Captain of the Watch
"""),
])
rep(Q + 'QLIA01.txt', [
("-- The giver is unnamed, as the registry's (qlLines.js \"the Arena's Herald\").\nQuest: QLIA01\n",
 "-- The giver is unnamed, as the registry's (qlLines.js \"the Arena's Herald\").\n-- AUDIT QUESTLINES LINES-26: the broadsheet ends on its crier's name - DFU's pack names a quest letter by its last line\n-- (ItemHelper.cs:335-348, itemInfo.js questLetterName); it was \"Letter: Somebody always bleeds.\"\nQuest: QLIA01\n"),
("""<ce>                Nobody dies on the Arena's sand.
<ce>                   Somebody always bleeds.
""", """<ce>                Nobody dies on the Arena's sand.
<ce>                   Somebody always bleeds.
<ce>
<ce>              The Herald of the Arena of Daggerfall
"""),
])

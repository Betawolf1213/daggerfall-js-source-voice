import sys; sys.path.insert(0, '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/FIX-SCRIPTS')
from ed import rep
Q = '/home/user/daggerfall-js-source/src/systems/questlines/quests/'
rep(Q + 'QLIW02.txt', [
("""-- step 1 ends: the captain's word is in the journal at once. The giver is unnamed (a captain of the watch, of the
-- region's ruling faction). A revenant rises where it rises, so the pay comes as a letter of thanks, not a return. The
-- act is the revenants' (qlActs.js revenant-knelt - systems/revenant/revenantFate.js: one of the player's own
-- revenants beaten until it yields; what is done with it then, kill or spare, is the player's and not this quest's).
""", """-- step 1 ends: the watch's word is in the journal at once. The giver is unnamed (a captain of the watch, of the
-- region's ruling faction) - and ANOTHER captain than step 1's, a Person being made fresh in each step's quest, so the
-- words name _captain_ as another of the watch's (AUDIT QUESTLINES LINES-10). A revenant rises where it rises, so the
-- pay comes as a letter of thanks, not a return - and the letter waits for a town by day, as a courier's does (GivePc's
-- notify form), the purse and the end waiting for the letter in the pack (`have _thanks_ set _paid_`, $CUREVAM's shape;
-- AUDIT QUESTLINES LINES-8: the purse and the end came in the letter's own tick, so a revenant that knelt outside a town
-- ended the quest with the letter never given, and "Wait in a town for word" was untrue). The act is the revenants'
-- (qlActs.js revenant-knelt - systems/revenant/revenantFate.js: one of the player's own revenants yields, whoever struck
-- it, and kneels to the player for judgement - so the words say "brought to its knees", never "beat", AUDIT QUESTLINES
-- ACTS-7; what is done with it then, kill or spare, is the player's and not this quest's).
"""),
("""QuestFail:  [1003]
<ce>          No word comes from _captain_ again.
""", """QuestFail:  [1003]
<ce>        The watch has stopped waiting to hear of it.
"""),
("""QuestLogEntry:  [1010]
%qdt:
 _captain_, a captain of the watch, sent word of
 the dead who will not lie down. Some foes I have
 fought do not stay beaten: they come back, named,
 stronger and better armed. Revenants. I am to beat
 one until it kneels. The captain will hear of it.
""", """QuestLogEntry:  [1010]
%qdt:
 Word from the watch, under the seal of _captain_,
 another of its captains: the dead will not lie
 down. Some foes I have fought do not stay beaten:
 they come back, named, stronger and better armed.
 Revenants. I am to see one of mine brought to its
 knees. Word of it will find me in a town, by day.
"""),
("""<ce>                                  _captain_
<ce>                              Captain of the Watch
""", """<ce>                    _captain_, Captain of the Watch
"""),
("""_knelt_ task:
	ql act revenant-knelt 1
	stop timer _wait_
	start timer _heard_

_heard_ task:
	give pc _thanks_ notify 1012
	give pc _gold_
	end quest
""", """_knelt_ task:
	ql act revenant-knelt 1
	stop timer _wait_
	start timer _heard_

_heard_ task:
	give pc _thanks_ notify 1012
	have _thanks_ set _paid_

_paid_ task:
	give pc _gold_
	end quest
"""),
])

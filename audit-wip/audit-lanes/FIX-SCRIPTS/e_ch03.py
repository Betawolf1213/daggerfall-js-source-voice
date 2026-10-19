import sys; sys.path.insert(0, '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/FIX-SCRIPTS')
from ed import rep
Q = '/home/user/daggerfall-js-source/src/systems/questlines/quests/'
rep(Q + 'QLCH03.txt', [
("""-- the service's words (net/questlineClaims.js `key`: the choice `keep` is paid a real Weir Key, once an account), so the
-- keep path pays nothing of the script's own (`ql paid`) - the key is its reward; the seal path pays in gold. Lore:
""", """-- the service's words (net/questlineClaims.js `key`: the choice `keep` is paid a real Weir Key, once an account). Both
-- paths pay the Guild's fee in gold; the seal path a rung up besides (the sheet's `greater`). AUDIT QUESTLINES LINES-4:
-- the keep path paid nothing of its own (`ql paid`) and said "Ysolde slides the key across the table to you" - but the
-- key is the ACCOUNT's, once (server-account/src/questlines.js: only while `ql_key` is 0), so a second character of the
-- house who kept it was paid nothing at all and told the key was theirs. Now the fee is paid either way, and 1030 says
-- before the choice, and 1040 after it, that a house has the key once (the port's family is the account's characters -
-- tutorialCatalogue.js `legacy`). Lore:
"""),
("""QuestComplete:  [1004]
<ce>         _gold_ gold: the Guild's fee and the Order's
<ce>                    thanks, together.
""", """QuestComplete:  [1004]
<ce>        Ysolde counts out _gold_ gold: the Guild's fee
<ce>         for a key brought up out of the deep places.
"""),
("""Message:  1030
<ce>          "Well, %pcf? Keep it, or let the Order seal it?"
""", """Message:  1030
<ce>       "Mind - the Guild gives a Spire key to a house
<ce>        once, %pcf. If one of your blood has taken one
<ce>        from us before you, there is none for you now.
<ce>        Well? Keep it, or let the Order seal it?"
"""),
("""Message:  1040
<ce>       Ysolde slides the key across the table to you.
<ce>       The priest of the Hour says nothing at all, and
<ce>                          leaves.
<ce>
<ce>       "Turn it when you are ready," Ysolde says, "and
<ce>        not before. There is a man who knows what waits
<ce>        on the other side better than I do. I think he
<ce>        will find you."
""", """Message:  1040
<ce>       The priest of the Hour says nothing at all, and
<ce>                          leaves.
<ce>
<ce>       "Kept, then," Ysolde says. "It goes to your
<ce>        house - unless one of your blood took the
<ce>        Guild's key before you. A house has it once.
<ce>        Turn it when you are ready, and not before.
<ce>        There is a man who knows what waits on the
<ce>        other side better than I do. He will find you."
"""),
("""_keepway_ task:
	when _tokeep_
	say 1040
	outcome _keep_
	ql paid
	end quest
""", """_keepway_ task:
	when _tokeep_
	say 1040
	outcome _keep_
	give pc _gold_
	end quest
"""),
])

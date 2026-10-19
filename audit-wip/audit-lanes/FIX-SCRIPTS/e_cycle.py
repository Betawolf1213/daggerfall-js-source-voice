import sys; sys.path.insert(0, '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/FIX-SCRIPTS')
from ed import rep
Q = '/home/user/daggerfall-js-source/src/systems/questlines/quests/'
rep(Q + 'QLBD01.txt', [
("""-- by a questor: the letter is the offer. Lore: Ysolde Marnhel wrote "On the Burning Doors" (systems/breachBook.js).
""", """-- by a questor: the letter is the offer. Lore: Ysolde Marnhel wrote "On the Burning Doors" (systems/breachBook.js).
-- AUDIT QUESTLINES LINES-24: the purse is the line's tier-3 band (300 to 600), as every other step of the Cycle's; and
-- the letter signs off with her name (LINES-26: DFU's pack names a quest letter by its last line, ItemHelper.cs:335).
"""),
("""<ce>                              Ysolde Marnhel
<ce>                Master Conjurer, the Mages Guild of Wayrest
""", """<ce>                 Ysolde Marnhel, Master Conjurer of Wayrest
"""),
("Item _gold_ gold range 150 to 250\n", "Item _gold_ gold range 300 to 600\n"),
])
rep(Q + 'QLBD05.txt', [
("""-- caged Broker").
""", """-- caged Broker"). AUDIT QUESTLINES LINES-23: the Covenant is Akatosh's with the Emperors' blood (portBooks.js "The
-- Covenant") - the Order of the Hour is Akatosh's, never the Covenant's keeper (1032, 1041).
"""),
("""Message:  1032
To the Order of the Hour, keepers of the Covenant. Let Akatosh's priests hold Dagon's fire.
""", """Message:  1032
To the Order of the Hour. Let Akatosh's priests hold Dagon's fire.
"""),
("""<ce>       "Akatosh's priests kept the Covenant before there
<ce>        was a Guild to study it. Dagon's fire will sit
<ce>        very quietly in their vaults. The Guild will
<ce>        grumble. Let it."
""", """<ce>       "Akatosh keeps his covenant with the Emperors'
<ce>        blood, not with priests. But his priests know a
<ce>        fire that should not burn when they see one.
<ce>        Dagon's will sit very quietly in their vaults.
<ce>        The Guild will grumble. Let it."
"""),
])
rep(Q + 'QLWR01.txt', [
("""-- (M0B30Y04's `_clearclick_`). Lore: canon - Jagar Tharn gave the Spire to Dagon, and in 3E 398 his legions took it;
-- the world is 3E 406. The port's own - Corvane, the torn halls, the Kyn's proving ground (Elite-Gates.md section 3).
""", """-- (M0B30Y04's `_clearclick_`). Lore: canon - Jagar Tharn gave the Spire to Dagon, and in 3E 398 his legions took it.
-- The port's own - Corvane, the torn halls, the Kyn's proving ground (Elite-Gates.md section 3). AUDIT QUESTLINES
-- LINES-9: no line counts the years since 3E 398 - the online calendar runs a game year about a real month
-- (net/wire.js sharedClassicMinutes), so "eight years" would be wrong by the winter; the words say "since the Spire
-- fell". LINES-10: Corvane keeps no room long (a fresh Place each step), and says so - never "I am always here".
"""),
("""<ce>       Corvane pushes a purse across the table: _gold_
<ce>       gold, some of it in coin eight years out of date.
<ce>                 "For the first Court."
""", """<ce>       Corvane pushes a purse across the table: _gold_
<ce>       gold, some of it in coin struck before the Spire
<ce>              fell. "For the first Court."
"""),
("""     Turn it. Raise the breach and take its first
 Court. The halls on the other side are the ones I
 slept in. Then come and find me at _tavern_ in
 __tavern_. I am always there.
""", """     Turn it. Raise the breach and take its first
 Court. The halls on the other side are the ones I
 slept in. Then come and find me at _tavern_ in
 __tavern_. I keep a room there, for now. I never
 keep one long.
"""),
("""The Battlemage? Sits in the corner and writes letters dated eight years ago.
""", """The Battlemage? Sits in the corner and writes letters dated 3E 398.
"""),
("""<ce>        up from his papers. "Turn the key. Raise the
<ce>        breach. I will be here. I am always here."
""", """<ce>        up from his papers. "Turn the key. Raise the
<ce>        breach. I will be here until you have."
"""),
])
rep(Q + 'QLWR02.txt', [
("""-- are in the journal at once (the last step ended at his table), and he waits at his tavern. WITNESSED
""", """-- are in the journal at once (the last step ended at his table), and he names the tavern he moves on to - a fresh
-- Place each step, and he keeps no room long (AUDIT QUESTLINES LINES-10). WITNESSED
"""),
("""%qdt:
 Corvane Tull wants more of the torn halls taken
 back: three Redoubts of an Elite Breach, from the
 Kyn who hold them for rank. He will wait for me
 at _tavern_ in __tavern_.
""", """%qdt:
 Corvane Tull is moving on - he keeps no room long -
 to _tavern_ in __tavern_. He wants more of the
 torn halls taken back: three Redoubts of an Elite
 Breach, from the Kyn who hold them for rank. He
 will wait for me there.
"""),
("""<ce>       "Three Redoubts, %pcf. I have counted every hall
<ce>        of that place every night for eight years. I can
<ce>        wait for three more."
""", """<ce>       "Three Redoubts, %pcf. I have counted every hall
<ce>        of that place every night since the Spire fell.
<ce>        I can wait for three more."
"""),
])
rep(Q + 'QLWR04.txt', [
("""     I know why the keys were given up. I have known
 for eight years. I need you to hear it before I
 write it down. _tavern_, in __tavern_.
""", """     I know why the keys were given up. I have known
 since the Spire fell. I need you to hear it before
 I write it down. _tavern_, in __tavern_.
"""),
("""<ce>        it. The Empire can judge the rest." He writes for
<ce>        a long time. When he looks up, the date at the
<ce>        top of the page reads 3E 406.
""", """<ce>        it. The Empire can judge the rest." He writes for
<ce>        a long time. When he looks up, the page is dated
<ce>        today, and not 3E 398.
"""),
])

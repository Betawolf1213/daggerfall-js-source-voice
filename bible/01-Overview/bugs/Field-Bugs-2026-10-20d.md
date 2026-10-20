# FIELD BUGS 2026-10-20d - a company of one, posted as one

One report from a player in the Discord's #general, handed on by the owner ("Look at ilovemybonks complaint"), read on
the code as it stands at main's `d883d3778`. The Elite Breach is the port's own (`11-Multiplayer/Elite-Gates.md`).
Daggerfall Unity has no other players and no Discord, so there is no DFU member to depart from. Ledger A (ELITE-GATES)
already covers the herald.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | "A reward for making it to redoubt 10 solo (yeah, they still did it first). I JUST HIT REDOUBT 20 SOLO AND BECAUSE I DID IT WRONG ITS SEEN AS COMPANY." | Every Redoubt the herald posts (10, 20, 30...) names "<opener>'s company". The news it is built from carried no company size, so one member got the words eight do | fixed (LONE-HERALD) |

## LONE-HERALD: a Redoubt taken alone is posted alone

`src/net/eliteGates/egBrain.js` `heraldCompany` and `redoubt`; `src/net/eliteGates/egHerald.js` `validEgHeraldTell`,
`egHeraldFold`, `egRedoubtPost`, `egFirstPost`, `egSealPost`.

THE REPORT. A player took Redoubt 20 (Hall 100) of the Battlespire alone. The first company to take Redoubt 10 did it
alone too, and the owner granted that player First of the Spire (`Elite-Gates.md` section 19, SPIRE-FIRST). This
player read the Spire as counting their run a company.

READ FIRST. The run is not in this repository. This session cannot read the Discord channel or the account service's
boards. So the report was read against every place a company's size is said, and each was driven with a breach of
one:

- **The boards** (`server-account/src/egHonours.js` `egDescentCompanies`, `egBracketOf`). A breach ranks by its
  entrants, every member admitted, earning or not (section 20, "Who counts"). That count is the end receipt's `n` and
  its `co`, both taken from `entrants(B)`. One member is the Alone bracket. Correct as designed.
- **The HUD and the recap** say *Company of N* only when N > 1 (`ui/eliteGates/egHud.js`). Correct.
- **The herald.** The tenth Redoubt's post was *<opener>'s company took Redoubt N of the Battlespire (Hall H) in T.*
  for every company. A Redoubt's news (`k: 'rd'`) carried the opener's name and the earners' names, but not the
  company's size, so the hub could not word one member any other way. The same breach played with one member and with
  three gave the same words: *M0's company took Redoubt 10 of the Battlespire (Hall 50) in 3:19.* First of the Spire
  and a seal's post were built the same way. A solo run is only called Alone in the Descent's top post, *A new top of
  the Descent (Alone): ...*, and that comes at the breach's end, only for a breach begun at Hall 1. So when the
  Redoubt fell, all the channel said was "company".

That is the defect, and the one this record fixes. The post is the first public word a Redoubt gets: it lands in
Discord seconds after the lord falls. The report came minutes after the Redoubt and quotes the word the post uses.

CHANGED.

- **The news carries the company.** A Valkynaz Redoubt's news says the company's entrants (`n`). That is the Descent's
  own count, so the post and the board never disagree about one member. For a company of one, the news leads with that
  member's name in the opener's place (`heraldCompany`). An opener who never stepped in (AUDIT EG IV lane3 #11) is not
  the one who went.
- **The hub keeps it.** `validEgHeraldTell` reads `n` from 1 to 8. Anything else reads 0, which means unsaid: news a room
  stored before this relay posts with the company's words, as it always did. `egHeraldFold` hands `n` to the tenth
  Redoubt's post, First of the Spire and a seal's post.
- **The words.** A company of one is named by its member, alone:
  - *Mara took Redoubt 20 of the Battlespire (Hall 100) alone in 40:00, from Redoubt 10.*
  - *First of the Spire: Mara is the first ever to take Redoubt 10 of the Battlespire (Hall 50), alone, in 1:17:40.*
    No name list follows, since it would repeat the one name.
  - *The way below the Galleries is open. Mara is the first through, alone.*

  Two or more keep *<opener>'s company*. A name is held to letters as every name the herald says is (`heraldName`), and
  a name that says nothing is *Someone*.

NOT CHANGED, AND THE OWNER'S TO DECIDE.

- **The boards.** The report's "because I did it wrong" may also mean the run did not begin at Hall 1. A breach begun
  at a deeper Redoubt ranks on the Depths and never on the Descent's Alone bracket (section 20; AUDIT EG0 A12: the
  start ratchet cannot buy a Descent row). A companion who answered the call and left counts toward the company too
  ("every member admitted, earning or not"), which puts a run in the Few. Both are the arc's rules, so neither was
  changed. If either is what the player meant, their Depths row and their Deepest Redoubts row stand. This session
  could not read which it was.
- **The reward.** No honour is for going alone. First of the Spire is for the first company to take Redoubt 10, which
  that player happened to do alone. A Redoubt 20 earns Wellhead-Walker and The Burning Stair for everyone
  (section 19's table). An honour for a solo Redoubt 20, or for the first to reach it, is a grant only the owner
  makes.
- **The law.** A company of one is still a company to the Spire's law (section 14, THE ERRAND FLOOR: "a party of one
  is a company"). Only the herald's words changed.

The relay is `world235`. The room-to-hub tell gains one field (`n`). No frame a client reads changes shape, so the
relay and the clients may deploy in either order. A tell with no size is posted with the company's words, as before.

Pins: `test/net/eliteGates/fb1020d_loneherald.test.js` (4). It plays breaches of one, of three, of a pair with one
fallen, and of an opener who never stepped in to their Court, then reads each through the hub's read and reckoning
to the words. `tools/mutants/fb1020d_loneherald.json` has 15 mutants, all dead. `egaudit5_a2.json`'s two herald
records were re-aimed by content (the news line and the fold's Redoubt line moved), and with `egeco_relay.json` all
138 are dead. The arc's record is `11-Multiplayer/Elite-Gates.md` section 20, LONE-HERALD.

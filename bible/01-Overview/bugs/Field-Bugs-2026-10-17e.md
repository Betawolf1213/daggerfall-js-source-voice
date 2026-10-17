# FIELD BUGS 2026-10-17e - The key's week, and the peers in the air

Two threads Mac handed over as screenshots on the evening of 2026-10-17: a direct message, and a picture from the
Oblivion Gate. Read on the code at main's `81710c3a7`.

| | Report | What it was | Done |
|---|---|---|---|
| 1 | A player, by direct message, the evening after KEY-LAW shipped: "bruhhhh it was that keyyyyy", over the notice "The realm's law has held this character three times. Its trading is frozen until October 24 at 3:21 AM, then opens on its own." - then "like 5 other people in reporting same thing" | Law 6 struck every Weir Key (KEY-LAW), and three keys taken up one after another made AUTO-HOLD's week. Migration 0125 lifted that week only for a character whose every law finding, ever, was the key's. A finding already judged and cleared (0123's Aetheric pieces, which the gate's own farmers wear) or one an older law laid stood in that history, so the week stood | fixed (KEY-LIFT) |

## KEY-LIFT: the key's week, lifted where the key made it

`server-account/migrations/0129_key_lift.sql` (new). No Worker, law, relay or client file moves.

FOUND. KEY-LAW (`Field-Bugs-2026-10-17.md`) found that law 6 held every Weir Key as a template no honest client mints. The
key is account-held and the pack is its face (`systems/eliteGates/weirKey.js` restackWeirKeys): a key spent leaves the
pack empty and the next checkpoint clean, and the next key rolled is a new hold - a strike (`server-account/src/verdict.js`
lawCountOf: a strike a hold, from a clean record). Three keys between the Breach going live and KEY-LAW's deploy were the
third strike, and the third strike is a week's hold whatever the next checkpoint says (AUTO-HOLD, LAW_HOLD_S). The
notice in the report is that hold with no piece named: law 7 finds nothing on the character now, and the week stands.

Migration 0125 lifted the week, the strikes and the hold for a character whose law findings were ONLY `template` on 575 -
every `law` row it had, from the INTEGRITY arc's cutover on. Two kinds of history stood in the way:

- a finding a staff act or a lift migration had already judged wrong and cleared. MAKER-KEPT's 0123 cleared every
  character held over Ruhn's Regalia enchanted before AETHERIC-MAKER (`Field-Bugs-2026-10-16c.md`), and left the findings
  in place, as every staff act does. Ruhn's Regalia is the gate boss's set, and its wearers are the players who farm the
  gate, which drops the keys;
- a finding an older law laid that a later law no longer makes, where no lift came with the move. It stood as a strike
  until it faded, so one of those and two keys were a week as well.

The report's timing fits the first: a week from 3:21 AM on 2026-10-17 in any American zone is after the Breach went live
(`399fe1605`, 03:50 UTC) and before KEY-LAW's account deploy (run 272, 12:49 UTC), so law 6 laid it and 0125 passed over
it.

Why no test saw it: `test/server/fb1017_keylaw_lift.test.js` built every character with no finding before the key's, and
pinned "a hold with any other finding untouched" as the conservative half - true of a finding that could still be
holding, not of one already cleared.

DFU has no realm, no law and no Weir Key. This is our own service's record, so no DFU member or ledger row moves.

FIXED. Migration 0129 reads only what still counts. A character's count was zeroed by its last staff `clear` or
`rollback` act (review.js), 0123's and 0125's lifts among them, but not by 0120's copies' `clear`, which zeroed no strike.
Only the law findings since then are read, and an excused finding is not one (it held nothing). A finding is the key's
when every piece it names is a Weir Key's `template` or an id on another piece (`uid`, never a strike - verdict.js). Every
other finding is one that could have struck without the key, including a count past its kept list (FINDINGS_KEPT) and an
unreadable list. Where a key's finding stands among fewer than three of those (judge.js STRIKES_FOR_TIMED), the key made
the week. The migration then lifts the timed hold and every timed hold served. The strikes kept are the most the other
findings could have struck (one each, and never more than the character was counted), and their fade counts from the
last of them. A character whose week an act made since (0120's `timed`) is left as it was, and so are staff's holds. The
hold lifts only where no other finding holds it (`law_sig` none, or the key's alone). A character still carrying another
piece stays held until it is gone, with its signature kept, so that checkpoint is no new strike. The key's own signature
is dropped: law 7 has judged every checkpoint since 0125's deploy and finds no key, so it stood for a clean record, and
kept it would have made the next real finding no strike. Each lift is written among the character's findings as a staff
act (`by: 'key-lift'`) with what it lifted and the strikes it kept.

The migration applies on the account deploy's next run (any change under `server-account/` runs it). It needs no new
Worker, so `ACCOUNT_VERSION` does not move.

`test/server/fb1017e_keylift.test.js` (3), through the real Worker and the real migrations. First, the report: a character
cleared by the real 0123, then held a week by three keys. 0125 leaves it held, 0129 lifts it whole, and its next
checkpoint carrying keys holds nothing. Second, a strike the real verdict laid on a forged piece, then two keys: the week
is lifted, the one strike is kept with its own finding's fade, and the piece taken up again is the second strike, not a
week. Third, what counts and what does not, across twelve characters. A person's clear and a rollback end the count, and
0120's copies' clear does not. An excused finding and an id on another piece strike nothing, and a count past its kept
list could. A carried piece's hold stands. Three other findings, 0120's week, staff's hold, a week with no key in it and
a character 0125 already lifted are all untouched. The first test fails on main: 0129 does not exist, and 0125 leaves the
week standing. `tools/mutants/fb1017e.json`: 15 mutants, all dead (each boundary, each exclusion, the threshold, the cap,
the kept strikes and their fade, the hold another piece makes, the key's signature, staff's).

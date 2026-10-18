# FIELD BUGS 2026-10-18b - "Letter of Credit vanishing from wallet"

One thread from the Discord's #bug-reports, handed over as a screenshot. shaman: *"I LOST NEARLY 2 million worth of
GOLD in letter of credits, they simply VANISHED from my wallet, i wish i had proof but this seriously cannot OVERLOOK"*,
then *"i grinded tens of dungeons for daedric items to sell just for it to simply vanish cuz the game is bugged? ... all i
have left is this"* over the Bank of the Empire's window. Online. Read on the code as it stands at main's `138604baa`.

The wallet (`06-Systems/Wallet.md`, WALLET1) holds nothing of its own: it shows the letters of credit in the pack
(`entity.items`, template 275), so a letter "vanishing from the wallet" is a letter that left the pack. Every door that
takes one out was read. One takes letters the player never chose to give and is a bug (LETTERS-HOME, below). The others
are the player's own acts or a law the owner chose. Which of them took this player's letters is not proven: the report
names no death and no deposit. What would prove it is under "What would prove it" below.

| | Door | What it does to a letter | Verdict |
|---|---|---|---|
| 1 | A revenant's kill (RVN8, `revenant.js revenantTakes`) | took one of the pack's five most valuable pieces - and a letter, worth its face, is the most valuable piece a pack holds | **BUG - LETTERS-HOME, fixed** |
| 2 | A death in the open zone (WILD1, `wildDropLaw.js wildCanLose`) | every letter drops into the remains, most valuable first, takeable by anyone for ten minutes after the respawn's wait | the owner's law (LETTERS-DROP, 2026-10-09: "letter of credits should be dropped") - unchanged |
| 3 | The bank's Deposit LOC (`banking.js depositAllLetters`) | every letter at face into the Empire's account; a defaulted loan garnishes it | DFU's DepositAll_LOC - the gold is in the account |
| 4 | A payment the coins cannot cover (`court.js deductGold`) | the letters pay first, then the coins (DFU's DeductGoldAmount) | DFU's order; every caller gates on coins plus letters |

## LETTERS-HOME: a revenant never takes a letter of credit

FOUND. RVN8's law (`12-Enhanced-AI/Feud-Arc.md` section 19, `06-Systems/Revenants.md` section 24) says a revenant that kills
the player takes one piece, "never a quest item, a summoned piece, the Materials Bag, gold or a locked piece". The code
read "gold" as the coin alone (`isGoldPieces`), and a letter of credit IS gold - its `value` is the gold it stands for, and
HACKED-GOLD treats it so everywhere else (`itemLaw.js` GOLD-INT, `peerWord.js`, the judge's wealth). So a letter was
takeable. The pick (`pickTaken`) draws among the equipped weapon and the five most valuable takeable pieces, by
`itemValueOf` - a letter's face - so a pack carrying letters from a run of daedric sales offered them as most of the
pool. A revenant holds three. Reproduced on the real module: a pack holding an equipped longsword, a dagger and three
letters of credit (650,000, 700,000 and 600,000) drew a letter on 583 of 1,000 ids (three of the pool's five), and 0 of
1,000 with the fix. The pins' take test is red on the unfixed law: three kills took letters out of the pack, onto the
record and into the standing body.

A letter taken that way was hard to get back. A slain body hands over what it carried, but only to its owner
(`exteriorFoes.js:"const stays = items.filter(neverPeerHanded);"` - a letter never rides a peer's word). A fallen
record whose body never carried it kept it for good, and one that escaped kept it.

CHANGED:
- `revenantMayTake` refuses a letter of credit (`revenant.js:"export const revenantMayTake = (item) =>"`, through
  `peerWord.js isLetterOfCredit`, the one test HACKED-GOLD reads). The pick, the take and a deserter's or a betrayer's
  split (`splitPack`, which asks the same law) all follow it. A deserter's letter now comes back to the pack with its gold.
- A letter a record already holds comes home at the mirror's merge (`ensureMirror`, the first ask after a load). It is
  read off the save's own copy of `took`, as RVN8 already reads it. That pack is the one the letter came out of, so it
  is never handed back twice. Living records, fallen ones whose body never carried it, and deserters are all covered.
  The record's other pieces stay its own.
- DECIDED here, named: the letter is handed back silently at the load, as AUDIT FEUD's hand-back on the line above it is
  (`revenant.js:"if (player && s?.took?.length && !s.defeated && !s.sworn && (r.gone || r.defeated || r.sworn))"`). It
  is the player's own letter returning to their wallet, not a find.
- Not changed: the wealth measure (`server-account/src/judge.js wealthOf`) never counted a revenant's `took`. A letter
  coming home therefore reads as a gain at the next checkpoint, as a piece won back off a revenant's body always has.
  The budget measures it and enforces nothing unless staff turned `enforce` on (`budget.js` BUDGET_DEFAULT).

THE FOUR HOSTS: no host line. The law and the merge are `systems/revenant/revenant.js`. The take runs at
`world.js respawnOnlinePlayer` (worldModes.js and dungeonContext.js die through it). exterior.js has no online respawn,
so it takes nothing, as Feud-Arc section 32 records.

Pinned by `test/systems/revenant/fb1018b_letters.test.js` (4): the law over the shop's, the bank's and the service's
letters; the pick and three kills' take through the real door (no letter drawn, taken, on the record or in the body,
the pack's letters whole); the deserter's letter back; and the load (a living and a fallen record each holding a letter
from before; both come home from the save's copy, the sword stays the revenant's, and a second load brings none
twice). `tools/mutants/fb1018b_letters.json` (3, all dead).

## What would prove which door it was

- A death in the open zone is recorded by the account service: `wild_falls` keeps each fall's records
  (`server-account/src/wild.js`, its `items` column). A row for the reporter's character carrying template 275 says the
  zone took them, and when.
- A revenant's theft is in the character's own record: the realm save's `modData.Revenant.list[].took`. A letter there
  comes home at the reporter's next load with this change.
- A deposit is in the account: the Empire's account (`bankAccounts[17]`) holds the gold.

What the reporter is owed: a revenant that killed you could take a letter of credit, which the game's own rule ("never
gold") was meant to forbid - that is fixed, and a letter one is still holding comes back to your wallet when you next
load. If your letters went at a death in the open zone, that drop is the zone's law, and the service's record of that
fall will say so.

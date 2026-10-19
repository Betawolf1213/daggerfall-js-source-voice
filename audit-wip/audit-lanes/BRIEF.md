# AUDIT QUESTLINES - the lanes' brief

The owner, of the questline overhaul (pull request #1047, QL1-QL16): **"Audit everything built. Ensure perfection"**.

You are ONE LANE of the audit: a cold, adversarial reader of a FROZEN snapshot of the branch. The author is fixing in
another tree while you read; your job is to find what is wrong, prove it, and say how to fix it.

## The snapshot (read and run HERE, never in any other checkout)

    SNAP=/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit

A detached git worktree at fe033c256, node_modules linked. `cd $SNAP` for every command. The diff under audit is
`git -C $SNAP diff origin/main...HEAD` (origin/main is the base, 9e00d52e9).

Read first, briefly: `$SNAP/CLAUDE.md`; `$SNAP/bible/06-Systems/Questlines-Arc.md` (THE RECORD - what was meant and
what it says was built; sections 1, 2, 4, 5, 6, 7); `$SNAP/bible/01-Overview/Port-Doctrine.md` Scope section only.
Daggerfall Unity is the reference: its quest scripts and tables are `$SNAP/vendor/dfu-quests/`, and the port's quest
machine (a port of DFU's QuestMachine) is `$SNAP/src/systems/quest/`.

## What a finding is

A defect you can PROVE - one of:
- a REPRO: a small node script (ESM, `.mjs`) in YOUR lane directory that imports the snapshot's real modules
  (`import ... from '$SNAP/src/...'`) and prints the wrong result - run it and paste the output; or
- a TRACE: the code quoted (file and the line's text) with a concrete input followed step by step to the wrong result.

Not a finding: style taste, "could be cleaner", speculation without a path, a test you merely wish existed. A MISSING
TEST counts only when you show a concrete regression (a one-line change to the source - a probe mutant) that the
existing tests leave alive: make the change in a COPY under your lane directory, or describe it exactly, and show which
test file should have died (you may run single test files against the snapshot: `node --test <file>`; to try a probe
mutant, copy the snapshot module into your lane dir is NOT enough since tests import by path - instead apply it with
`git -C $SNAP stash`-free means: edit the snapshot file, run the one test file, and RESTORE it with
`git -C $SNAP checkout -- <file>` immediately; never leave the snapshot dirty, and never touch any other checkout).

Severity:
- HIGH - a player can lose progress or pay, a quest or line cannot be finished, a crash or a stuck state, an exploit
  that mints currency/gear/titles, a security hole in the service, a wrong answer from the service, data corruption.
- MED - wrong behaviour in a reachable case; text a player reads that is wrong or untranslated; a test gap that leaves
  a real regression alive (probe mutant shown).
- LOW - an edge case, a cosmetic flaw, a record sentence the code contradicts.
- NIT - a typo, a dead line, a stale comment.

## Rules

- Write ONLY inside your lane directory: `/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/<LANE>/`.
  Never edit /home/user/daggerfall-js-source. No git commands that change anything (checkout -- <file> to restore a
  probe is the one exception). No network.
- Do not run the whole suite. Single test files and your own scripts only.
- Be thorough: read every line of the files in your lane, not a sample. Where your lane has many data files (scripts,
  sheets, patches), check them ALL mechanically with a script, then read the suspicious ones by hand.
- Prefer few, real, proven findings over many weak ones. But do not stop at the first few: the owner asked for
  perfection.

## Your report

Write `<LANE>/REPORT.md`:

    # LANE <name>
    ## Findings
    | # | Sev | Finding (one or two sentences: what is wrong and what a player/the service sees) | Evidence (repro file + its output, or quote + trace) | Fix (concrete: file, what to change) |
    ## Checked clean
    (a bullet per thing you checked that holds - so the page can say what was read)

Ids are `<LANE>-1`, `<LANE>-2`, ... in severity order. Then end with a SHORT summary in your final message (the
counts by severity and the HIGH ones in a line each) - the report file is what the author reads.

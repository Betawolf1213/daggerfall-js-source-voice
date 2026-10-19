# AUDIT QUESTLINES - the fixers' brief

The owner asked of the questline overhaul (PR #1047): **"Audit everything built. Ensure perfection"**. Eight audit lanes
read a frozen snapshot and reported findings with repros. You are a FIXER: you take a set of findings, verify each in
the LIVE tree, and fix it properly - or, where a fix would be wrong, decide it with a reason.

## Where

- The LIVE tree: `/home/user/daggerfall-js-source` (branch claude/quest-system-overhaul-klmr0v). You edit here.
- The lanes' reports and repros: `/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/<LANE>/`
  (REPORT.md + the repro scripts named there). The repros import a FROZEN snapshot at
  `.../scratchpad/ql-audit` - to re-run one against the live tree, copy it into YOUR scratch dir
  (`.../scratchpad/audit-lanes/FIX-<you>/`) and point its imports at `/home/user/daggerfall-js-source` instead.
- Read first: `/home/user/daggerfall-js-source/CLAUDE.md`; `bible/06-Systems/Questlines-Arc.md` (the record) - the
  sections your findings touch; the house's style is in the code you edit: match its comment density, naming, idiom
  (dense, cited comments; `// AUDIT QUESTLINES <ID>: why` on a changed site, as the existing `// AUDIT ...` comments do).

## The rules

1. **Own only your files.** Your package names the files you may edit. Other fixers are editing other files in the
   same tree at the same time. If a fix needs a file you do not own, do NOT edit it: write what is needed in your
   report. Make edits as small string replacements (the Edit tool, or a short python read-replace-write); re-read a
   file right before you edit it; never rewrite a whole file you did not create.
2. **No git.** No commit, stash, checkout, reset, add. The author commits.
3. **Prove each fix.** Before: reproduce the finding against the live tree (the lane's repro, adapted). After: the same
   repro shows it fixed. And PIN it: a test in the test file your package names that fails on the old code - prove it
   by a probe mutant (re-introduce the bug, run the test file, see it fail, restore). Name the mutant in the test's
   title, house style: `(mutants: ...)`.
4. **Run before you report**: `npx eslint <the files you touched>`, `npx tsc -p tsconfig.json` (whole project, ~1 min;
   errors in files you do not own that are not yours - say so), and the test files your package names plus any test that
   imports a module you changed (`grep -rl "<module>.js" test`). Never the whole suite.
5. **Player-facing words** (anything a player reads) in `.js` go through `t('key', 'English fallback', {vars})` from
   `src/systems/textManager.js` - never bare English (the l10n4_hardcoded ratchet fails it). Do NOT edit `locales/`;
   list every new key with its English in your report - the author translates. Quest script text (`.txt` scripts,
   patch JSON message text, sheet JSON text) is quest text, not t().
6. **Hosts do not grow** (CLAUDE.md HOST-SPLIT): never add lines to bootWorld, createWorldModes, buildDungeonContext,
   bootExterior, createNavalHost, createComeSailAwayRuntime.
7. **Daggerfall's voice** in any quest text: `<ce>`-centred spoken lines, rows ~45-55 characters, plain words, canon
   lore. Patch messages are numbered 1900+.

## Your report (your final message - the harness may refuse a report file; put it in the message)

For EVERY finding id in your package, one row: `| ID | FIXED / LEFT / PARTLY | what changed (files) | the pin: test
name + the probe mutant that it kills | anything left |`. Then: the new t() keys with their English; the files you
touched; the test files run and their pass/fail counts; anything you need from another owner.

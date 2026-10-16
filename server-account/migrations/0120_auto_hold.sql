-- AUTO-HOLD (2026-10-16, Mac: "We need to figure out a better system for trade banning. I dont want to have to manually
-- review"; bible/06-Systems/Integrity-Arc.md, AUTO-HOLD).
--
--   npx wrangler d1 migrations apply daggerfall-accounts --remote
--
-- Applied exactly once through the `d1_migrations` ledger, which the deploy runs (ACC1-CI).
--
-- THE LAW'S TIMED HOLD (server-account/src/verdict.js lawCountOf): the third strike holds a character's trade for a time
-- - a week, each one after it a month - and the strikes and the holds served fade a month after the last finding that
-- held. NULL / 0 for every row before this.
--   held_until  the timed hold's end (seconds), or NULL
--   law_holds   the timed holds served since the count last faded
--   law_at      when the fade counts from - the last finding that held, or the last timed hold's end
ALTER TABLE realm_characters ADD COLUMN held_until INTEGER;
ALTER TABLE realm_characters ADD COLUMN law_holds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE realm_characters ADD COLUMN law_at INTEGER;

-- THE COPIES' HOLD IS RETIRED: a copy locks its piece (item_dupes), never the character. Every 'dupe' hold standing is
-- lifted - its copied pieces stay locked - and the lift is written among the character's findings as a staff act is.
INSERT INTO realm_findings (player, char_id, seq, at, law, kind, detail)
  SELECT player, id, seq, CAST(strftime('%s', 'now') AS INTEGER), 0, 'staff', json_object('act', 'clear', 'by', 'auto-hold', 'was', 'dupe')
  FROM realm_characters WHERE held = 'dupe';
UPDATE realm_characters SET held = NULL, held_at = NULL, judge_rev = judge_rev + 1 WHERE held = 'dupe';

-- A LAW HOLD WAITING FOR STAFF (STRIKES_FOR_REVIEW come, as it was) becomes the first timed hold, a week from now.
INSERT INTO realm_findings (player, char_id, seq, at, law, kind, detail)
  SELECT player, id, seq, CAST(strftime('%s', 'now') AS INTEGER), 0, 'staff',
    json_object('act', 'timed', 'by', 'auto-hold', 'until', CAST(strftime('%s', 'now') AS INTEGER) + 604800)
  FROM realm_characters WHERE held = 'law' AND strikes >= 3;
UPDATE realm_characters SET held_until = CAST(strftime('%s', 'now') AS INTEGER) + 604800, law_holds = 1, strikes = 0,
  law_at = CAST(strftime('%s', 'now') AS INTEGER) + 604800, judge_rev = judge_rev + 1
  WHERE held = 'law' AND strikes >= 3;

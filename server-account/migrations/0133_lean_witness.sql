-- LEAN-WITNESS (2026-10-19, the account database overloaded again - "D1 DB is overloaded. Requests queued for too
-- long." on the harvest and the pixels, 18:05-18:25 UTC; bible/11-Multiplayer/Scale-Arc.md LEAN-WITNESS): A WITNESSED
-- KEY'S ANSWERS READ AS FAR AS THEY CAN MATTER.
--
--   npx wrangler d1 migrations apply daggerfall-accounts --remote
--
-- Applied exactly once through the `d1_migrations` ledger, which the
-- deploy runs (ACC1-CI). Deploy this service (acct159) with the site; no
-- relay change.
--
-- A hall's and a seat's facts are the first answer three accounts agree on (nodeLaw.js witnessedFact), and every
-- account's first answer is kept (INSERT OR IGNORE) - never trimmed. On the day 48,745 `npchall` rows stood for 2,425
-- towns and not one town had a second answer; one had 1,516 accounts saying the same thing. Every hall witness read
-- every report of its region's towns (npcHalls.js regionRows - 24,327 of them in the Daggerfall region, some 48,000
-- rows read a witness, 190 ms on the primary) to ask whether its account was to be ignored, and every counted report
-- moved the region's version so the next reader read them all again: 13.5% of the database's statement time of the day,
-- and 34% of it in the 02:30 overload. The seats' clock read all 32,775 `seat` rows each minute the same way.
--
-- An answer that agrees with a key's confirmation and was given after the second it confirmed changes nothing any law
-- reads: witnessedFact counts after its confirmation only the answers that differ, and seatIgnoredAccounts never counts
-- an agreeing answer. Such a row is LATE. A late row is kept - an account's first answer still stands, and the audit
-- lists count it - but the reads that judge (a witness's ignored, a region's chapters, the seats' kept facts) read the
-- key's rows that are not late, a handful a key, and ask a key's late rows only where an account they ignore answered
-- it (npcHalls.js, townSeats.js; Scale-Arc LEAN-WITNESS holds the proof).
--
--   witness_confirmed   each key's confirmation as the database keeps it: the answer, and the second its third agreeing
--                       account gave it (the confirming row, ordered by second and account as witnessedFact orders
--                       them). The rows of the key that agree with it and were given in a later second are late.
--
-- THE DATABASE KEEPS IT, NOT THE CALLERS: an answer inserted (the triggers below) and an answer deleted (a strike, an
-- account gone with ON DELETE CASCADE) settle their key in the same statement. An answer given at or before the
-- confirmation's second could move it - the key's rows all counted again, and the confirmation found again from all of
-- them. A strike lets its key's rows go late first (npcHalls.js strikeHall, townSeats.js strikeSeat), so deleting them
-- settles nothing, and drops the key's confirmation with them.
--
-- A REBUILD OF world_witness (as 0028, 0032, 0048, 0099 and 0132 rebuilt it to admit a kind) DROPS THIS COLUMN, ITS
-- INDEXES AND ITS TRIGGERS: carry `late` into the new table and make all of them again in the same migration.
-- test/server/lean_witness.test.js fails a tree whose migrations end without them.
ALTER TABLE world_witness ADD COLUMN late INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS witness_confirmed (
  kind   TEXT NOT NULL,
  key    TEXT NOT NULL,
  report TEXT NOT NULL,
  at     INTEGER NOT NULL,
  PRIMARY KEY (kind, key)
);

-- Every key of the two kinds confirmed as its rows stand: each answer's third account (ordered by second, then account),
-- and of those the first.
INSERT OR IGNORE INTO witness_confirmed (kind, key, report, at)
  SELECT kind, key, report, at FROM (
    SELECT kind, key, report, at, ROW_NUMBER() OVER (PARTITION BY kind, key ORDER BY at, account) AS first
    FROM (SELECT kind, key, report, account, at, ROW_NUMBER() OVER (PARTITION BY kind, key, report ORDER BY at, account) AS n
      FROM world_witness WHERE kind IN ('npchall', 'seat'))
    WHERE n = 3)
  WHERE first = 1;

-- And every agreeing answer of a later second late (each row asks its key's one confirmation, by its primary key) -
-- before the indexes below are made, so the update writes no index of them.
UPDATE world_witness SET late = 1
  WHERE kind IN ('npchall', 'seat') AND EXISTS (SELECT 1 FROM witness_confirmed c
    WHERE c.kind = world_witness.kind AND c.key = world_witness.key AND c.report = world_witness.report AND world_witness.at > c.at);

-- The reads that judge: a region's keys and a key's rows, the late ones in neither index.
CREATE INDEX IF NOT EXISTS idx_world_witness_lean_region ON world_witness (kind, region, key) WHERE late = 0;
CREATE INDEX IF NOT EXISTS idx_world_witness_lean_key ON world_witness (kind, key) WHERE late = 0;
-- An account's own answers: a witness's question whether it can be ignored at all, and the cascade when an account goes
-- (world_witness.account's foreign key had no index - every account deleted walked the whole table).
CREATE INDEX IF NOT EXISTS idx_world_witness_account ON world_witness (account, kind);

-- AN ANSWER INSERTED: one given at or before its key's confirmation can move it - every row counted again and the
-- confirmation dropped; the key confirmed from its rows that are not late (a no-op where it stands); every agreeing row
-- of a later second late.
CREATE TRIGGER IF NOT EXISTS witness_lean_in AFTER INSERT ON world_witness WHEN NEW.kind IN ('npchall', 'seat')
BEGIN
  UPDATE world_witness SET late = 0 WHERE kind = NEW.kind AND key = NEW.key AND late = 1
    AND EXISTS (SELECT 1 FROM witness_confirmed c WHERE c.kind = NEW.kind AND c.key = NEW.key AND NEW.at <= c.at);
  DELETE FROM witness_confirmed WHERE kind = NEW.kind AND key = NEW.key AND NEW.at <= at;
  INSERT OR IGNORE INTO witness_confirmed (kind, key, report, at)
    SELECT kind, key, report, at FROM (
      SELECT kind, key, report, account, at, ROW_NUMBER() OVER (PARTITION BY report ORDER BY at, account) AS n
      FROM world_witness WHERE kind = NEW.kind AND key = NEW.key AND late = 0)
    WHERE n = 3 ORDER BY at, account LIMIT 1;
  UPDATE world_witness SET late = 1 WHERE kind = NEW.kind AND key = NEW.key AND late = 0
    AND EXISTS (SELECT 1 FROM witness_confirmed c WHERE c.kind = NEW.kind AND c.key = NEW.key
      AND c.report = world_witness.report AND world_witness.at > c.at);
END;

-- AN ANSWER DELETED that was not late (a confirmer, an answer before the confirmation, a dissent): the key settled again
-- from every row that is left. A late one's going moves nothing.
CREATE TRIGGER IF NOT EXISTS witness_lean_out AFTER DELETE ON world_witness WHEN OLD.kind IN ('npchall', 'seat') AND OLD.late = 0
BEGIN
  UPDATE world_witness SET late = 0 WHERE kind = OLD.kind AND key = OLD.key AND late = 1;
  DELETE FROM witness_confirmed WHERE kind = OLD.kind AND key = OLD.key;
  INSERT OR IGNORE INTO witness_confirmed (kind, key, report, at)
    SELECT kind, key, report, at FROM (
      SELECT kind, key, report, account, at, ROW_NUMBER() OVER (PARTITION BY report ORDER BY at, account) AS n
      FROM world_witness WHERE kind = OLD.kind AND key = OLD.key AND late = 0)
    WHERE n = 3 ORDER BY at, account LIMIT 1;
  UPDATE world_witness SET late = 1 WHERE kind = OLD.kind AND key = OLD.key AND late = 0
    AND EXISTS (SELECT 1 FROM witness_confirmed c WHERE c.kind = OLD.kind AND c.key = OLD.key
      AND c.report = world_witness.report AND world_witness.at > c.at);
END;

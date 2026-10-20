-- YARD-SNAP (2026-10-19, the account database overloaded again; bible/11-Multiplayer/Scale-Arc.md YARD-SNAP): A TOWN'S
-- YARDS READ AS ONE ROW.
--
--   npx wrangler d1 migrations apply daggerfall-accounts --remote
--
-- Applied exactly once through the `d1_migrations` ledger, which the
-- deploy runs (ACC1-CI). Deploy this service (acct161) with the site; no
-- relay change.
--
-- Every caller standing in a town reads its yards (decor.js yardsOf): each yard piece of the town, ordered by its
-- building, then sorted in a temporary tree, DECOR_YARDS_TOWN_MAX (2,000) of them answered. On the day 673,882 such reads
-- read 1,400 rows each on average - the Daggerfall city's 3,357 sorted for its 2,000 - 9.1% of the database's statement
-- time, for an answer that changes only when a piece in the town's yards is placed, moved or taken away (a few hundred
-- times an hour).
--
--   home_yards   one row a town that ever stood a yard piece: `ver`, moved by the database itself on every yard row
--                written; `built`, the version `rows` was read at; `shape`, the build that read it (decor.js
--                YARD_SNAP_SHAPE: its columns, order and bound - a deploy that changes them reads the rows as they stand
--                until the clock builds the town again; AUDIT LEAN-READS B1); `rows`, the town's yard rows as yardsOf
--                reads them (each a JSON array of the columns decor.js YARD_SNAP_COLS names, in its order) - so a read is
--                one row where `built` is `ver` and the shape is the code's, and the rows as before where it is not. A
--                decor route's write builds its town's row again at once; the minute's clock builds any other (a home
--                released, an account gone, a sweep, another shape).
CREATE TABLE IF NOT EXISTS home_yards (
  map_id INTEGER PRIMARY KEY,
  ver    INTEGER NOT NULL DEFAULT 1,
  built  INTEGER NOT NULL DEFAULT 0,
  shape  TEXT,
  rows   TEXT
);

-- The read a row is built from, in its own order: the town's yard pieces by building, then placing, then id - no sort.
CREATE INDEX IF NOT EXISTS idx_home_decor_yard_order ON home_decor (map_id, yard, building_key, placed_at, id);
-- 0039's (map_id, yard) is that index's prefix - every read it answered, the new one answers, and every decor write paid
-- both (AUDIT LEAN-READS B8).
DROP INDEX IF EXISTS idx_home_decor_yard;

-- Every town that stands a yard piece now, built now - in the shape the code reads today (decor.js YARD_SNAP_SHAPE).
INSERT OR IGNORE INTO home_yards (map_id, ver, built) SELECT DISTINCT map_id, 1, 0 FROM home_decor WHERE yard = 1;
UPDATE home_yards SET built = ver, shape = '07a44e1f', rows = (SELECT json_group_array(json_array(map_id, building_key, id, model, flat_archive, flat_record, place, placed_at, item, paid, yard))
  FROM (SELECT map_id, building_key, id, model, flat_archive, flat_record, place, placed_at, item, paid, yard FROM home_decor
    WHERE map_id = home_yards.map_id AND yard = 1 ORDER BY building_key, placed_at, id LIMIT 2000));

-- A yard row written, by any route, a cascade or a sweep: its town's version moved (and the town's row made, the first
-- time). A row moved between towns or in or out of a yard moves both (a town it stays in, twice - a version is only ever
-- compared for being the one built).
CREATE TRIGGER IF NOT EXISTS home_yards_in AFTER INSERT ON home_decor WHEN NEW.yard = 1
BEGIN
  INSERT INTO home_yards (map_id) VALUES (NEW.map_id) ON CONFLICT (map_id) DO UPDATE SET ver = ver + 1;
END;
CREATE TRIGGER IF NOT EXISTS home_yards_out AFTER DELETE ON home_decor WHEN OLD.yard = 1
BEGIN
  UPDATE home_yards SET ver = ver + 1 WHERE map_id = OLD.map_id;
END;
CREATE TRIGGER IF NOT EXISTS home_yards_moved AFTER UPDATE ON home_decor WHEN OLD.yard = 1 OR NEW.yard = 1
BEGIN
  UPDATE home_yards SET ver = ver + 1 WHERE map_id = OLD.map_id AND OLD.yard = 1;
  INSERT INTO home_yards (map_id) SELECT NEW.map_id WHERE NEW.yard = 1
    ON CONFLICT (map_id) DO UPDATE SET ver = ver + 1;
END;

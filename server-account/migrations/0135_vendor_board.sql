-- VENDOR-BOARD (2026-10-19, the account database overloaded again; bible/11-Multiplayer/Scale-Arc.md VENDOR-BOARD): A
-- REGION'S TRADERS READ AS ONE ROW.
--
--   npx wrangler d1 migrations apply daggerfall-accounts --remote
--
-- Applied exactly once through the `d1_migrations` ledger, which the
-- deploy runs (ACC1-CI). Deploy this service (acct159) with the site; no
-- relay change.
--
-- Every client in a living town reads its region's traders (market.js marketVendors) every PATRON_READ_S, and the Notice
-- Board's Vendors tab on every open: two statements over every open trader listing of the region and its piece and home
-- (5,700 rows a read, 21 ms) and the region's patron sales of the day - 197,665 reads on the day, 7% of the database's
-- statement time, and in the 18:05 overload the read most asked again (1,517 asks in five minutes where 330 was the
-- rate). The answer is every caller's alike but for three facts about the caller's own character (its own house, its
-- guild's, a room it rents), and it moves only when a trader's listing, its piece, its house or a patron's sale is
-- written, or a listing's time runs out.
--
--   market_vendor_boards   one row a region read: `ver`, moved by the database itself on every such write (the row made
--                          by the first); `built`, the version `rows` was read at; `shape`, the reads that read it
--                          (keptBoard.js shapeOf - a deploy that changes them reads it again); `built_at`, the second it
--                          was read at, and `until`, the second its first listing runs out - the rows are the board for
--                          a caller whose second is between; `rows`, the board as every caller reads it (market.js
--                          vendorBoard). A read is the row while it is its version's and shape's and its second between;
--                          else it reads the board as before - writing nothing first - and keeps it last, only where the
--                          version has not moved since it read and no board kept meanwhile serves its second already.
--                          No row: version 0 (no write since this migration).
CREATE TABLE IF NOT EXISTS market_vendor_boards (
  region   INTEGER PRIMARY KEY,
  ver      INTEGER NOT NULL DEFAULT 1,
  built    INTEGER NOT NULL DEFAULT 0,
  shape    TEXT,
  built_at INTEGER NOT NULL DEFAULT 0,
  until    INTEGER NOT NULL DEFAULT 0,
  rows     TEXT
);

-- The board's next listing to run out, by its region (idx_market_vendor_region names the listing's age, not its end -
-- every open trader listing of the region was read for it; AUDIT LEAN-READS B8).
CREATE INDEX IF NOT EXISTS idx_market_vendor_expiry ON market_listings (region, expires_at) WHERE state = 'open' AND vendor_id IS NOT NULL;

-- A trader's listing written - listed, bought, cancelled, run out, swept - its region's board and (moved) the old one's:
-- the columns the board reads alone (AUDIT LEAN-READS B7: the hour's patron reckoning marks every trader listing of a
-- town, and the board's pixel and the courier's word are none of the board's).
CREATE TRIGGER IF NOT EXISTS vendor_board_listed AFTER INSERT ON market_listings WHEN NEW.vendor_id IS NOT NULL
BEGIN
  INSERT INTO market_vendor_boards (region) SELECT NEW.region WHERE NEW.region IS NOT NULL ON CONFLICT (region) DO UPDATE SET ver = ver + 1;
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_listing AFTER UPDATE OF id, kind, region, material, item, own, bought, units, price, fee, wear, at,
  expires_at, state, currency, seller, vendor_map, vendor_id ON market_listings WHEN OLD.vendor_id IS NOT NULL OR NEW.vendor_id IS NOT NULL
BEGIN
  INSERT INTO market_vendor_boards (region) SELECT r FROM (SELECT OLD.region AS r UNION SELECT NEW.region) WHERE r IS NOT NULL
    ON CONFLICT (region) DO UPDATE SET ver = ver + 1;
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_unlisted AFTER DELETE ON market_listings WHEN OLD.vendor_id IS NOT NULL
BEGIN
  INSERT INTO market_vendor_boards (region) SELECT OLD.region WHERE OLD.region IS NOT NULL ON CONFLICT (region) DO UPDATE SET ver = ver + 1;
END;

-- A trader standing in a room, moved or taken away (a piece a listing names stands there): its house's region. A
-- piece's place is asked only where it is JSON (json_extract throws on a record that is not, and a trigger's throw would
-- refuse the write: decor.js reads such a record as no piece).
CREATE TRIGGER IF NOT EXISTS vendor_board_trader_in AFTER INSERT ON home_decor
  WHEN NEW.yard = 0 AND CASE WHEN json_valid(NEW.place) THEN json_extract(NEW.place, '$.station') END = 'vendor'
BEGIN
  INSERT INTO market_vendor_boards (region) SELECT region FROM homes WHERE map_id = NEW.map_id AND building_key = NEW.building_key
    ON CONFLICT (region) DO UPDATE SET ver = ver + 1;
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_trader AFTER UPDATE ON home_decor
  WHEN (OLD.yard = 0 AND CASE WHEN json_valid(OLD.place) THEN json_extract(OLD.place, '$.station') END = 'vendor') OR (NEW.yard = 0 AND CASE WHEN json_valid(NEW.place) THEN json_extract(NEW.place, '$.station') END = 'vendor')
BEGIN
  INSERT INTO market_vendor_boards (region) SELECT DISTINCT region FROM homes
    WHERE (map_id = OLD.map_id AND building_key = OLD.building_key) OR (map_id = NEW.map_id AND building_key = NEW.building_key)
    ON CONFLICT (region) DO UPDATE SET ver = ver + 1;
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_trader_out AFTER DELETE ON home_decor
  WHEN OLD.yard = 0 AND CASE WHEN json_valid(OLD.place) THEN json_extract(OLD.place, '$.station') END = 'vendor'
BEGIN
  INSERT INTO market_vendor_boards (region) SELECT region FROM homes WHERE map_id = OLD.map_id AND building_key = OLD.building_key
    ON CONFLICT (region) DO UPDATE SET ver = ver + 1;
END;

-- A house changing hands, its door, its name, its region or its guild, or released (its pieces go after it, the cascade
-- finding no house to name - this moves its region first); and one made (a house that stands no trader yet moves its
-- region's board for nothing - and a row replaced, whose implied delete fires no trigger, moves it: AUDIT LEAN-READS B6).
CREATE TRIGGER IF NOT EXISTS vendor_board_house AFTER UPDATE OF player, char_id, owner_name, region, entry, guild_id ON homes
BEGIN
  INSERT INTO market_vendor_boards (region) SELECT r FROM (SELECT OLD.region AS r UNION SELECT NEW.region) WHERE r IS NOT NULL
    ON CONFLICT (region) DO UPDATE SET ver = ver + 1;
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_house_in AFTER INSERT ON homes
BEGIN
  INSERT INTO market_vendor_boards (region) SELECT NEW.region WHERE NEW.region IS NOT NULL ON CONFLICT (region) DO UPDATE SET ver = ver + 1;
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_house_gone AFTER DELETE ON homes
BEGIN
  INSERT INTO market_vendor_boards (region) SELECT OLD.region WHERE OLD.region IS NOT NULL ON CONFLICT (region) DO UPDATE SET ver = ver + 1;
END;

-- A patron's purchase told (the board says the region's day of them).
CREATE TRIGGER IF NOT EXISTS vendor_board_patron AFTER INSERT ON market_patron_sales
BEGIN
  INSERT INTO market_vendor_boards (region) SELECT NEW.region WHERE NEW.region IS NOT NULL ON CONFLICT (region) DO UPDATE SET ver = ver + 1;
END;

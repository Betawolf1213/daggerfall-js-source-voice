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
--   market_vendor_boards   one row a region read: `ver`, moved by the database itself on every such write; `built`, the
--                          version `rows` was read at; `until`, the second its first listing runs out (the rows stop being
--                          the board's then); `rows`, the board as every caller reads it (market.js vendorBoard). A read
--                          is the row while it is its version's and before `until`; else it reads the board as before
--                          and keeps it, written only where the version has not moved since it read.
CREATE TABLE IF NOT EXISTS market_vendor_boards (
  region INTEGER PRIMARY KEY,
  ver    INTEGER NOT NULL DEFAULT 1,
  built  INTEGER NOT NULL DEFAULT 0,
  until  INTEGER NOT NULL DEFAULT 0,
  rows   TEXT
);

-- A trader's listing written - listed, bought, cancelled, run out, swept - its region's board and (moved) the old one's.
CREATE TRIGGER IF NOT EXISTS vendor_board_listed AFTER INSERT ON market_listings WHEN NEW.vendor_id IS NOT NULL
BEGIN
  UPDATE market_vendor_boards SET ver = ver + 1 WHERE region = NEW.region;
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_listing AFTER UPDATE ON market_listings WHEN OLD.vendor_id IS NOT NULL OR NEW.vendor_id IS NOT NULL
BEGIN
  UPDATE market_vendor_boards SET ver = ver + 1 WHERE region IN (OLD.region, NEW.region);
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_unlisted AFTER DELETE ON market_listings WHEN OLD.vendor_id IS NOT NULL
BEGIN
  UPDATE market_vendor_boards SET ver = ver + 1 WHERE region = OLD.region;
END;

-- A trader standing in a room, moved or taken away (a piece a listing names stands there): its house's region. A
-- piece's place is asked only where it is JSON (json_extract throws on a record that is not, and a trigger's throw would
-- refuse the write: decor.js reads such a record as no piece).
CREATE TRIGGER IF NOT EXISTS vendor_board_trader_in AFTER INSERT ON home_decor
  WHEN NEW.yard = 0 AND CASE WHEN json_valid(NEW.place) THEN json_extract(NEW.place, '$.station') END = 'vendor'
BEGIN
  UPDATE market_vendor_boards SET ver = ver + 1 WHERE region = (SELECT region FROM homes WHERE map_id = NEW.map_id AND building_key = NEW.building_key);
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_trader AFTER UPDATE ON home_decor
  WHEN (OLD.yard = 0 AND CASE WHEN json_valid(OLD.place) THEN json_extract(OLD.place, '$.station') END = 'vendor') OR (NEW.yard = 0 AND CASE WHEN json_valid(NEW.place) THEN json_extract(NEW.place, '$.station') END = 'vendor')
BEGIN
  UPDATE market_vendor_boards SET ver = ver + 1 WHERE region IN (
    (SELECT region FROM homes WHERE map_id = OLD.map_id AND building_key = OLD.building_key),
    (SELECT region FROM homes WHERE map_id = NEW.map_id AND building_key = NEW.building_key));
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_trader_out AFTER DELETE ON home_decor
  WHEN OLD.yard = 0 AND CASE WHEN json_valid(OLD.place) THEN json_extract(OLD.place, '$.station') END = 'vendor'
BEGIN
  UPDATE market_vendor_boards SET ver = ver + 1 WHERE region = (SELECT region FROM homes WHERE map_id = OLD.map_id AND building_key = OLD.building_key);
END;

-- A house changing hands, its door, its name, its region or its guild, or released (its pieces go after it, the cascade
-- finding no house to name - this moves its region first).
CREATE TRIGGER IF NOT EXISTS vendor_board_house AFTER UPDATE OF player, char_id, owner_name, region, entry, guild_id ON homes
BEGIN
  UPDATE market_vendor_boards SET ver = ver + 1 WHERE region IN (OLD.region, NEW.region);
END;
CREATE TRIGGER IF NOT EXISTS vendor_board_house_gone AFTER DELETE ON homes
BEGIN
  UPDATE market_vendor_boards SET ver = ver + 1 WHERE region = OLD.region;
END;

-- A patron's purchase told (the board says the region's day of them).
CREATE TRIGGER IF NOT EXISTS vendor_board_patron AFTER INSERT ON market_patron_sales
BEGIN
  UPDATE market_vendor_boards SET ver = ver + 1 WHERE region = NEW.region;
END;

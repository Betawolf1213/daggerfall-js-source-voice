-- EG-PLAY (2026-10-11, the Elite Gates arc) - THE ELITE BREACH, AS THE SERVICE KEEPS IT.
--
--   npx wrangler d1 migrations apply daggerfall-accounts --remote
--
-- Applied exactly once through the `d1_migrations` ledger, which the deploy runs (ACC1-CI). Deploy this service
-- (acct116) with the relay (world195 opens the breaches and signs their `e1` receipts) and the site.
--
-- Mac: "an endless procedural breach for a party of 8 ... keys ... checkpoints". Design:
-- bible/11-Multiplayer/Elite-Gates.md sections 5 and 23.
--
-- THE BALANCE IS THE ACCOUNT'S (section 5): every dungeon drop is the client's own die, and a key from a forged drop
-- would open a real relay instance - so a Weir Key is a count on the account's row, and the item in the pack is its face
-- (the client restacks it to every answer that carries the count).
--   eg_keys      the Weir Keys held
--   eg_key_miss  the recorded gate kills in a row that rolled no key (the pity: the sixth gives one)
--   eg_live_b    the breach the account is in or holds (one at a time, opener or member), with eg_live_until its
--                bound - a lapsed one counts as clear, so no lost receipt locks an account out
--   eg_rh_day    the UTC day of the account's last Rehearsal (section 27.7: one a real day, no key)
--   eg_mercy     1 once the first breach's mercy has returned a stake (once ever)
ALTER TABLE players ADD COLUMN eg_keys INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN eg_key_miss INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN eg_live_b TEXT;
ALTER TABLE players ADD COLUMN eg_live_until INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN eg_rh_day INTEGER NOT NULL DEFAULT -1;
ALTER TABLE players ADD COLUMN eg_mercy INTEGER NOT NULL DEFAULT 0;
-- THE STAKES (section 23): a key held against a breach until it settles - SPENT by its first Redoubt or an end that is
-- not a void, RETURNED by a relay-signed void or the first breach's mercy. One row an open order (`ez`); the client's
-- request id `rq` makes an open idempotent (a crashed client asking again gets the same order back). `rh` a Rehearsal's
-- (no key held).
CREATE TABLE IF NOT EXISTS eg_stakes (
  ez      TEXT PRIMARY KEY,
  account TEXT NOT NULL,
  b       TEXT NOT NULL,
  rq      TEXT NOT NULL,
  rh      INTEGER NOT NULL DEFAULT 0,
  at      INTEGER NOT NULL,
  until   INTEGER NOT NULL,
  state   TEXT NOT NULL DEFAULT 'held',
  FOREIGN KEY (account) REFERENCES players(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_eg_stakes_rq ON eg_stakes (account, rq);
CREATE INDEX IF NOT EXISTS idx_eg_stakes_account ON eg_stakes (account);
-- THE REDOUBTS TAKEN: one row a (breach, account, Redoubt) - a receipt counts once whatever happens to it.
CREATE TABLE IF NOT EXISTS eg_redoubts (
  b       TEXT NOT NULL,
  account TEXT NOT NULL,
  w       INTEGER NOT NULL,
  h       INTEGER NOT NULL,
  t       INTEGER NOT NULL,
  at      INTEGER NOT NULL,
  PRIMARY KEY (b, account, w),
  FOREIGN KEY (account) REFERENCES players(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_eg_redoubts_account ON eg_redoubts (account);
-- THE ENDS: one row a (breach, account) - the deepest hall cleared and how the member's breach ended.
CREATE TABLE IF NOT EXISTS eg_runs (
  b       TEXT NOT NULL,
  account TEXT NOT NULL,
  h       INTEGER NOT NULL,
  why     TEXT NOT NULL,
  t       INTEGER NOT NULL,
  at      INTEGER NOT NULL,
  PRIMARY KEY (b, account),
  FOREIGN KEY (account) REFERENCES players(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_eg_runs_account ON eg_runs (account);
-- THE LAUNCH GIFT (section 5): every account that has closed a Dagon's Breach (a recorded kill, never the rite alone)
-- holds one key when this lands.
UPDATE players SET eg_keys = eg_keys + 1 WHERE EXISTS (SELECT 1 FROM gate_kills g WHERE g.account = players.id AND g.earned != 'rite');
-- EG-E2 (2026-10-12, Mac: "I said I want everything"; Elite-Gates.md sections 19 and 20) - THE FEATS, THE ANNALS, THE
-- HONOURS AND THE BOARDS (server-account/src/egHonours.js).
--   eg_annals   the Annals of 3E 398's pages the account was given (bit p page p - net/egAnnals.js), OR'ed at each end
--   eg_honours  the Spire's honours (egHonours.js EG_HONOUR: Spirewalker ... the four Masters), OR'ed at a recorded
--               non-Rehearsal Redoubt, held for good
ALTER TABLE players ADD COLUMN eg_annals INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN eg_honours INTEGER NOT NULL DEFAULT 0;
-- THE ENDS AS THE BOARDS RANK THEM: the company's size (`n`), the start Redoubt (`ew`), the Wager (`wg`, 1 wagered), the
-- falls (`fl`), the seconds from Hall 1's wake to the deepest hall's door (`td`, where the receipt says it), a
-- Rehearsal's (`rh`, never on a board) and the arena season of the receipt's issue (`season`).
ALTER TABLE eg_runs ADD COLUMN n INTEGER NOT NULL DEFAULT 0;
ALTER TABLE eg_runs ADD COLUMN ew INTEGER NOT NULL DEFAULT 0;
ALTER TABLE eg_runs ADD COLUMN wg INTEGER NOT NULL DEFAULT 0;
ALTER TABLE eg_runs ADD COLUMN fl INTEGER NOT NULL DEFAULT 0;
ALTER TABLE eg_runs ADD COLUMN td INTEGER;
ALTER TABLE eg_runs ADD COLUMN rh INTEGER NOT NULL DEFAULT 0;
ALTER TABLE eg_runs ADD COLUMN season INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_eg_runs_season ON eg_runs (season, h);
-- THE FEATS: one row an (account, lord) - the lord's three feat bits (net/egFeats.js) the account has held, OR'ed.
CREATE TABLE IF NOT EXISTS eg_feats (
  account TEXT NOT NULL,
  lord    TEXT NOT NULL,
  bits    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account, lord),
  FOREIGN KEY (account) REFERENCES players(id) ON DELETE CASCADE
);
-- SPIRE CHAMPION: one row a (season, Descent bracket, account) - each bracket's top ten companies at the season's end,
-- every member, holding the title through the next season; written the first time a read in the new season finds the
-- last one unkept.
CREATE TABLE IF NOT EXISTS eg_champions (
  season  INTEGER NOT NULL,
  bracket TEXT NOT NULL,
  account TEXT NOT NULL,
  PRIMARY KEY (season, bracket, account),
  FOREIGN KEY (account) REFERENCES players(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_eg_champions_account ON eg_champions (account);

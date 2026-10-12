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
-- EG-E3 (2026-10-12, Mac: "I said I want everything") - THE DUNGEON'S FIND (bible/11-Multiplayer/Elite-Gates.md
-- section 5). No relay witnesses an ordinary dungeon, so an elite's killer asks and the service rolls - bounded: one row
-- an account's asks of a tier (`super`, `elite`, `regular`) a real UTC day (`asks`, at most EG_FIND_PER_DAY -
-- server-account/src/eg.js findEg) and the keys they found (`found`), `wk` the arena week the day falls in (finds pay
-- at most EG_FIND_KEYS_PER_WEEK keys a week, summed by it).
CREATE TABLE IF NOT EXISTS eg_finds (
  account TEXT NOT NULL,
  day     INTEGER NOT NULL,
  tier    TEXT NOT NULL,
  wk      INTEGER NOT NULL,
  asks    INTEGER NOT NULL DEFAULT 0,
  found   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account, day, tier),
  FOREIGN KEY (account) REFERENCES players(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_eg_finds_week ON eg_finds (account, wk);

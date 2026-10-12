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
-- EG-E1 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md section 19) - WHAT A REDOUBT
-- PAYS, AND THE BROKER'S PANOPLY SINK (server-account/src/egEconomy.js).
--
-- A Redoubt's number pays once an account an arena week (src/net/arenaLaw.js arenaWeekOf); taken again that week it pays
-- its gold alone. The row says what the claim that wrote it paid, so a claim asked again answers the same:
--   wk      the arena week the row was claimed in (-1: a row from before EG-E1)
--   paid    1 for the account's first row of that Redoubt that week (never a Rehearsal's)
--   stones  the Deadlands Embers it paid (src/net/egPay.js egEmbersOf - a Valkynaz's, and a first this season); the
--           insignia's and the sink's purse (accounts.js EMBERS_EARNED_SQL) counts them
--   nonce   the claim that wrote it (the service's own draw - a refused re-claim of the same receipt carries none): the
--           Marks, the guild's deed, the pity and the key are written only while the row this claim wrote stands
--   forced  the Panoply passes the pity forced, a bit a pass
--   wkey    1 when a Valkynaz's Redoubt found its Weir Key
ALTER TABLE eg_redoubts ADD COLUMN wk INTEGER NOT NULL DEFAULT -1;
ALTER TABLE eg_redoubts ADD COLUMN paid INTEGER NOT NULL DEFAULT 0;
ALTER TABLE eg_redoubts ADD COLUMN stones INTEGER NOT NULL DEFAULT 0;
ALTER TABLE eg_redoubts ADD COLUMN nonce TEXT;
ALTER TABLE eg_redoubts ADD COLUMN forced INTEGER NOT NULL DEFAULT 0;
ALTER TABLE eg_redoubts ADD COLUMN wkey INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_eg_redoubts_pay ON eg_redoubts (account, w, wk, paid);
--   eg_pity     the Panoply passes in a row that drew no piece (EG_PANOPLY_PITY of them, and the next is forced)
--   eg_valk_wk  the arena week a Valkynaz's Redoubt last found the account a Weir Key (at most one a week)
ALTER TABLE players ADD COLUMN eg_pity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN eg_valk_wk INTEGER NOT NULL DEFAULT -1;
-- THE SINK: one Panoply piece of the buyer's choosing, once an account an arena week, for EG_SINK_EMBERS embers out of the
-- insignia's purse (`insignia_spent`) - one row a (account, week).
CREATE TABLE IF NOT EXISTS eg_sink (
  account TEXT NOT NULL,
  wk      INTEGER NOT NULL,
  piece   TEXT NOT NULL,
  at      INTEGER NOT NULL,
  PRIMARY KEY (account, wk),
  FOREIGN KEY (account) REFERENCES players(id) ON DELETE CASCADE
);

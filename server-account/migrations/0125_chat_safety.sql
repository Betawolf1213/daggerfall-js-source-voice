-- SAFE1-SAFE7 (2026-10-17) - THE CHAT SAFETY ARC: a player's block list, reports and the cases they gather into, the
-- moderation record nothing clears, bans, the reviewer's feed and its daily count, and the code of conduct agreed.
--
--   npx wrangler d1 migrations apply daggerfall-accounts --remote
--
-- Applied exactly once through the `d1_migrations` ledger, which the
-- deploy runs (ACC1-CI).
--
-- Mac: "Lets do every single thing here. I want a full fledged future proof system" - the plan answered to a player's
-- word that homophobia and harassment slid past a moderation team of three (bible/11-Multiplayer/Chat-Safety-Arc.md).
--
-- THE PLAYER'S ROW GAINS THREE:
--   banned_until  SAFE4: until when the account may not play (src/net/safety/safetyLaw.js BAN_FOREVER for good); NULL none
--   ban_reason    SAFE4: the reason the banned player is shown
--   conduct_v     SAFE7: the code of conduct's version the player agreed to (src/net/safety/conduct.js CONDUCT_VERSION)
--
-- blocks         SAFE1: who no longer hears whom - an account's own list (BLOCKS_MAX), never told to the blocked
-- mod_cases      SAFE3: the reports about one account gathered - ONE OPEN CASE AN ACCOUNT (mod_cases_open). `source`
--                'report' or 'review' (the reviewer opened it); `status` 'open', 'actioned' or 'dismissed'; `reports` and
--                `credible` the reporters and those who count toward the automatic mute; `ai_*` the reviewer's word
--                ('due', 'done', 'failed' or 'off' - off when the reviewer was off as it opened); `auto` what was done
--                without a moderator ('reports', 'review'); `discord_*` the case's card in the moderators' channel.
-- mod_reports    SAFE3: one row a reporter a case - their reason and note, and whether they counted (`counted`)
-- mod_case_lines SAFE3: the case's lines, each once - `sg` the relay's stamp a report carried (NULL for a line the
--                reviewer's feed carried, whose batch the relay signed)
-- mod_actions    SAFE4: EVERY ACT, KEPT - a mute, unmute, ban, unban or dismissal, who did it (an account's id, or
--                'auto:reports' / 'auto:review'), until when, why, and the case it answered. Never cleared: MOD1's
--                `muted_by` said who muted a player now; this says who did what, for good. STRIKES are its mutes and bans
--                of the last ninety days (STRIKE_WINDOW_S).
-- mod_feed       SAFE5: the relay's signed batches of public lines, waiting for the reviewer (`state` 'due', then
--                'done' with its lines dropped); a batch seen twice is kept once (its id). Swept after a day.
-- mod_ai_days    SAFE5: the reviewer's calls a day (MOD_AI_DAILY_MAX), swept after a month.
--
-- CASCADE: an account that is gone takes its blocks, its cases and their lines and reports, and the record of the acts
-- on it - an account deleted is not kept to be punished. (No route deletes an account today; the privacy policy's
-- section 12 says what may be kept when one does.)
ALTER TABLE players ADD COLUMN banned_until INTEGER;
ALTER TABLE players ADD COLUMN ban_reason TEXT;
ALTER TABLE players ADD COLUMN conduct_v TEXT;

CREATE TABLE IF NOT EXISTS blocks (
  player  TEXT NOT NULL,
  blocked TEXT NOT NULL,
  at      INTEGER NOT NULL,
  PRIMARY KEY (player, blocked),
  FOREIGN KEY (player) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_cases (
  id            TEXT PRIMARY KEY,
  target        TEXT NOT NULL,
  source        TEXT NOT NULL CHECK (source IN ('report', 'review')),
  status        TEXT NOT NULL CHECK (status IN ('open', 'actioned', 'dismissed')),
  opened_at     INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  reports       INTEGER NOT NULL DEFAULT 0,
  credible      INTEGER NOT NULL DEFAULT 0,
  ai_state      TEXT NOT NULL CHECK (ai_state IN ('due', 'done', 'failed', 'off')),
  ai_category   TEXT,
  ai_severity   INTEGER,
  ai_confidence REAL,
  ai_reason     TEXT,
  ai_mode       TEXT,
  ai_at         INTEGER,
  auto          TEXT,
  discord_state TEXT NOT NULL CHECK (discord_state IN ('due', 'posted', 'off')),
  discord_msg   TEXT,
  resolved_by   TEXT,
  resolved_at   INTEGER,
  resolution    TEXT,
  FOREIGN KEY (target) REFERENCES players(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS mod_cases_open ON mod_cases (target) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS mod_cases_ai_due ON mod_cases (updated_at) WHERE ai_state = 'due';
CREATE INDEX IF NOT EXISTS mod_cases_post_due ON mod_cases (updated_at) WHERE discord_state = 'due';
CREATE INDEX IF NOT EXISTS mod_cases_resolved ON mod_cases (resolved_at) WHERE resolved_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS mod_reports (
  case_id  TEXT NOT NULL,
  reporter TEXT NOT NULL,
  reason   TEXT NOT NULL,
  note     TEXT,
  at       INTEGER NOT NULL,
  counted  INTEGER NOT NULL CHECK (counted IN (0, 1)),
  PRIMARY KEY (case_id, reporter),
  FOREIGN KEY (case_id) REFERENCES mod_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_case_lines (
  case_id TEXT NOT NULL,
  at      INTEGER NOT NULL,
  sub     TEXT NOT NULL,
  name    TEXT NOT NULL,
  tab     TEXT NOT NULL,
  text    TEXT NOT NULL,
  sg      TEXT,
  PRIMARY KEY (case_id, at, sub),
  FOREIGN KEY (case_id) REFERENCES mod_cases(id) ON DELETE CASCADE
);

-- `id` is the rowid - no AUTOINCREMENT, whose sequence table the schema does not carry (0013's ledger); it orders
-- two actions in one second, nothing more.
CREATE TABLE IF NOT EXISTS mod_actions (
  id         INTEGER PRIMARY KEY,
  target     TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('mute', 'unmute', 'ban', 'unban', 'dismiss')),
  until      INTEGER,
  reason     TEXT,
  actor      TEXT NOT NULL,
  actor_name TEXT,
  case_id    TEXT,
  at         INTEGER NOT NULL,
  FOREIGN KEY (target) REFERENCES players(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS mod_actions_target ON mod_actions (target, at);

CREATE TABLE IF NOT EXISTS mod_feed (
  id    TEXT PRIMARY KEY,
  at    INTEGER NOT NULL,
  lines TEXT,
  state TEXT NOT NULL CHECK (state IN ('due', 'done'))
);
CREATE INDEX IF NOT EXISTS mod_feed_due ON mod_feed (at) WHERE state = 'due';

CREATE TABLE IF NOT EXISTS mod_ai_days (
  day   TEXT PRIMARY KEY,
  calls INTEGER NOT NULL
);

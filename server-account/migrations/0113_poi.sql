-- POI-1 (2026-10-14, Mac: "POI Tool (General Map Editor) - Realtime editor ... a tool my developers can use without
-- having to access the codebase"; asked who publishes: "I need to be able to approve changes").
--
--   npx wrangler d1 migrations apply daggerfall-accounts --remote
--
-- Applied exactly once through the `d1_migrations` ledger, which the deploy runs (ACC1-CI).
--
-- THE POI STORE (server-account/src/poi.js; bible/06-Systems/POI-Editor-Arc.md). A POI is a document (src/poi/poiLaw.js)
-- and the assets it names by sha256 (meshes, src/poi/poiMesh.js; textures, src/poi/poiImage.js) - the documents here, the
-- assets' bytes in R2 under `poi/a/<sha>`, their facts here.
--
-- EVERY CHANGE IS A REVISION AND NONE REACHES A PLAYER UNAPPROVED. A builder saves drafts and submits one; an approver
-- (APPROVER_HANDLES) approves or rejects it; an approved revision becomes the POI's LIVE one, and only live revisions are
-- in the feed the game reads. Taking a POI out of the world is a revision too (`kind` 'retire'), approved the same way.
-- Nothing is deleted: the history is the record of who changed what, and a rollback points `live_rev` at an earlier
-- approved revision.

CREATE TABLE IF NOT EXISTS poi_docs (
  id          TEXT PRIMARY KEY,               -- poi-<12 hex> (poiLaw.js POI_ID_RE)
  created_by  TEXT NOT NULL,                  -- players.id
  created_at  INTEGER NOT NULL,
  live_rev    INTEGER,                        -- the approved revision in the world; NULL: none (never approved, or retired)
  live_at     INTEGER,
  live_by     TEXT                            -- the approver who set it
);

CREATE TABLE IF NOT EXISTS poi_revs (
  poi_id      TEXT NOT NULL REFERENCES poi_docs(id),
  rev         INTEGER NOT NULL,               -- 1, 2, ... per POI
  kind        TEXT NOT NULL DEFAULT 'doc',    -- 'doc' (stand this document) or 'retire' (take the POI out of the world)
  doc         TEXT,                           -- the document as JSON (NULL for a retirement)
  base_rev    INTEGER,                        -- the revision it was made from (NULL for a first draft)
  author      TEXT NOT NULL,                  -- players.id
  author_name TEXT NOT NULL,                  -- the handle, as it was
  at          INTEGER NOT NULL,               -- last saved
  state       TEXT NOT NULL,                  -- 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_at INTEGER,
  reviewer    TEXT,                           -- players.id of the approver who decided
  reviewer_name TEXT,
  reviewed_at INTEGER,
  note        TEXT,                           -- the reviewer's word
  PRIMARY KEY (poi_id, rev)
);
CREATE INDEX IF NOT EXISTS poi_revs_state ON poi_revs (state, submitted_at);

CREATE TABLE IF NOT EXISTS poi_assets (
  sha         TEXT PRIMARY KEY,               -- sha256 of the bytes, hex
  kind        TEXT NOT NULL,                  -- 'mesh' | 'texture'
  bytes       INTEGER NOT NULL,
  meta        TEXT NOT NULL,                  -- JSON: a mesh's { submeshes, vertices, triangles, min, max }; a texture's { format, w, h }
  by          TEXT NOT NULL,                  -- players.id of the first uploader
  at          INTEGER NOT NULL,
  live        INTEGER NOT NULL DEFAULT 0      -- 1 once an approved revision names it: readable by anyone, the game included
);
CREATE INDEX IF NOT EXISTS poi_assets_by ON poi_assets (by, at);

-- THE FEED'S VERSION: one row, moved by every approval, rollback and retirement - the game's cheap "anything new?"
CREATE TABLE IF NOT EXISTS poi_feed (
  k           TEXT PRIMARY KEY,
  v           INTEGER NOT NULL,
  at          INTEGER NOT NULL
);
INSERT OR IGNORE INTO poi_feed (k, v, at) VALUES ('feed', 0, 0);

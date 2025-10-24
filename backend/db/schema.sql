-- backend/db/schema.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  points INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  badge_id TEXT NOT NULL, -- corresponds to trainings folder id e.g. 001-etika-digital
  title TEXT,
  points INTEGER,
  issuer TEXT,
  cid TEXT,
  issued_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT,
  data_hash TEXT,
  prev_hash TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  title TEXT,
  snippet TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS case_file (
  feedback_id TEXT PRIMARY KEY,
  case_json TEXT NOT NULL,
  priority_score INTEGER NOT NULL,
  cluster_id TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (feedback_id) REFERENCES feedback(id)
);

CREATE TABLE IF NOT EXISTS cluster (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cluster_member (
  cluster_id TEXT NOT NULL,
  feedback_id TEXT NOT NULL,
  similarity REAL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (cluster_id, feedback_id),
  FOREIGN KEY (cluster_id) REFERENCES cluster(id),
  FOREIGN KEY (feedback_id) REFERENCES feedback(id)
);

CREATE TABLE IF NOT EXISTS similarity_edge (
  feedback_id TEXT NOT NULL,
  similar_feedback_id TEXT NOT NULL,
  score REAL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (feedback_id, similar_feedback_id)
);

CREATE TABLE IF NOT EXISTS api_key (
  id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

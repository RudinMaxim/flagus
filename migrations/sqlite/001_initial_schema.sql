PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_by TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_by TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS user_groups (
    user_id TEXT,
    group_id TEXT,
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);

CREATE TABLE IF NOT EXISTS flag_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT,
    depth INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_by TEXT,
    updated_at TEXT,
    FOREIGN KEY (parent_id) REFERENCES flag_categories (id)
);

CREATE TABLE IF NOT EXISTS environments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_by TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS sdk_keys (
    id TEXT PRIMARY KEY,
    environment_id TEXT,
    key TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    is_active INTEGER NOT NULL,
    FOREIGN KEY (environment_id) REFERENCES environments (id)
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    expires_at TEXT,
    auto_delete INTEGER,
    status TEXT NOT NULL,
    enum TEXT,
    category_id TEXT,
    environment_id TEXT UNIQUE,
    client_ids TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_by TEXT,
    updated_at TEXT,
    FOREIGN KEY (category_id) REFERENCES flag_categories (id),
    FOREIGN KEY (environment_id) REFERENCES environments (id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    timestamp TEXT NOT NULL,
    ip_address TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS flag_ttl (
  flag_id TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  auto_delete INTEGER NOT NULL CHECK (auto_delete IN (0, 1)),
  FOREIGN KEY (flag_id) REFERENCES feature_flags(id) ON DELETE CASCADE
);

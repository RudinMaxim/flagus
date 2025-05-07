const sqlite3 = require('sqlite3');
const { promisify } = require('util');

async function runSeed() {
  const db = new sqlite3.Database('data/flugs.db');
  const exec = promisify(db.exec.bind(db));

  await exec(`
    PRAGMA foreign_keys = ON;

    DROP TABLE IF EXISTS flag_clients;
    DROP TABLE IF EXISTS feature_flags;
    DROP TABLE IF EXISTS flag_categories;
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS clients;
    DROP TABLE IF EXISTS flag_ttl;

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT,
      is_active TEXT
    );

    CREATE TABLE clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL
    );

    CREATE TABLE flag_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      parent_id TEXT REFERENCES flag_categories(id),
      depth INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      updated_at TEXT,
      updated_by TEXT
    );

    CREATE TABLE feature_flags (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      selected_enum TEXT,
      enum_values TEXT,
      category_id TEXT REFERENCES flag_categories(id),
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      updated_at TEXT,
      updated_by TEXT
    );

    CREATE TABLE flag_ttl (
      flag_id TEXT PRIMARY KEY REFERENCES feature_flags(id) ON DELETE CASCADE,
      expires_at DATETIME NOT NULL,
      auto_delete BOOLEAN NOT NULL DEFAULT 0
    );

    CREATE TABLE flag_clients (
      flag_id TEXT NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      PRIMARY KEY (flag_id, client_id)
    );

    CREATE TABLE audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      timestamp TEXT NOT NULL,
      ip_address TEXT
    );
  `);

  console.log('✅ Seed table completed successfully.');
  db.close();
}

runSeed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

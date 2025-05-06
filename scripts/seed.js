const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const crypto = require('crypto');

// Enums
const FlagType = {
  BOOLEAN: 'boolean',
  ENUM: 'enum',
};

const FlagStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SCHEDULED: 'scheduled',
  ARCHIVED: 'archived',
};

const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  TOGGLE: 'toggle',
};

const UserRole = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

async function runSeed() {
  const db = new sqlite3.Database('data/flugs.db');
  const exec = promisify(db.exec.bind(db));
  const run = (sql, params) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, err => {
        if (err) reject(err);
        else resolve();
      });
    });

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
      last_login TEXT
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

  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthISO = nextMonth;

  const adminId = crypto.randomUUID();
  await run(
    `INSERT INTO users
     (id, username, email, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      adminId,
      'admin',
      'admin@example.com',
      crypto
        .createHash('sha256')
        .update('admin123' + 'salt')
        .digest('hex'),
      UserRole.ADMIN,
      now,
    ]
  );

  const client1Id = crypto.randomUUID();
  const client2Id = crypto.randomUUID();

  await run(
    `INSERT INTO clients (id, name, description, created_at, created_by)
     VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
    [
      client1Id,
      'Client A',
      'Main client A',
      now,
      adminId,
      client2Id,
      'Client B',
      'Main client B',
      now,
      adminId,
    ]
  );

  const rootCategoryId = crypto.randomUUID();
  const uiCategoryId = crypto.randomUUID();

  await run(
    `INSERT INTO flag_categories
     (id, name, description, parent_id, depth, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [rootCategoryId, 'Root', 'Root flags', null, 0, now, adminId]
  );

  await run(
    `INSERT INTO flag_categories
     (id, name, description, parent_id, depth, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [uiCategoryId, 'UI', 'UI-related flags', rootCategoryId, 1, now, adminId]
  );

  const flagId = crypto.randomUUID();
  await run(
    `INSERT INTO feature_flags (
       id, key, name, description, type, status,
       selected_enum, enum_values, category_id,
       created_at, created_by, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      flagId,
      'NEW_DASHBOARD',
      'New Dashboard',
      'Enable new dashboard UI',
      FlagType.ENUM,
      FlagStatus.ACTIVE,
      'v1',
      JSON.stringify(['v1', 'v2', 'v3']),
      uiCategoryId,
      now,
      adminId,
      now,
    ]
  );

  await run(
    `INSERT INTO flag_ttl (flag_id, expires_at, auto_delete)
     VALUES (?, ?, ?)`,
    [flagId, nextMonthISO, 1]
  );  

  await run(`INSERT INTO flag_clients (flag_id, client_id) VALUES (?, ?), (?, ?)`, [
    flagId,
    client1Id,
    flagId,
    client2Id,
  ]);

  const auditId = crypto.randomUUID();
  await run(
    `INSERT INTO audit_logs (
       id, user_id, action, entity_id, entity_type,
       old_value, new_value, timestamp, ip_address
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      auditId,
      adminId,
      AuditAction.CREATE,
      flagId,
      'feature_flags',
      null,
      JSON.stringify({
        key: 'NEW_DASHBOARD',
        type: FlagType.ENUM,
        enumValues: ['v1', 'v2', 'v3'],
      }),
      now,
      '127.0.0.1',
    ]
  );

  console.log('✅ Seed completed successfully.');
  db.close();
}

runSeed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

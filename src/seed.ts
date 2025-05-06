import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import crypto from 'crypto';
import { FlagType, FlagStatus, AuditAction, UserRole } from './shared/kernel';

async function runSeed() {
  // 1. Open SQLite database
  const db = new sqlite3.Database('data/flugs.db');
  const exec = promisify(db.exec.bind(db));
  const run = (sql: string, params: any[]) =>
    new Promise<void>((resolve, reject) => {
      db.run(sql, params, err => {
        if (err) reject(err);
        else resolve();
      });
    });

  // 2. Enable foreign keys and create tables
  await exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS flag_categories (
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

    CREATE TABLE IF NOT EXISTS feature_flags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      category_id TEXT REFERENCES flag_categories(id),
      start_date TEXT,
      end_date TEXT,
      percentage INTEGER,
      client_ids TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      updated_at TEXT,
      updated_by TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
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

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_id, entity_type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `);

  const now = new Date().toISOString();

  // 3. Insert admin user
  const adminId = crypto.randomUUID();
  await run(
    `INSERT OR IGNORE INTO users
      (id, username, email, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      adminId,
      'admin',
      'admin@example.com',
      // В реальном приложении нужно использовать безопасное хеширование паролей
      crypto
        .createHash('sha256')
        .update('admin123' + 'some-salt')
        .digest('hex'),
      UserRole.ADMIN,
      now,
    ]
  );

  // 4. Insert categories
  const rootCategoryId = crypto.randomUUID();
  await run(
    `INSERT OR IGNORE INTO flag_categories
      (id, name, description, parent_id, depth, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [rootCategoryId, 'Основные фичи', 'Флаги для ключевого функционала', null, 0, now, adminId]
  );

  const uiCategoryId = crypto.randomUUID();
  await run(
    `INSERT OR IGNORE INTO flag_categories
      (id, name, description, parent_id, depth, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [uiCategoryId, 'Интерфейс', 'Флаги для интерфейса приложения', rootCategoryId, 1, now, adminId]
  );

  const apiCategoryId = crypto.randomUUID();
  await run(
    `INSERT OR IGNORE INTO flag_categories
      (id, name, description, parent_id, depth, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [apiCategoryId, 'API', 'Флаги для API', rootCategoryId, 1, now, adminId]
  );

  // 5. Insert feature flags
  // Boolean flag
  const dashboardFlagId = crypto.randomUUID();
  await run(
    `INSERT OR IGNORE INTO feature_flags
      (id, name, description, type, status, category_id,
       start_date, end_date, percentage, client_ids,
       created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dashboardFlagId,
      'new-dashboard',
      'Новая версия дашборда',
      FlagType.BOOLEAN,
      FlagStatus.ACTIVE,
      uiCategoryId,
      null,
      null,
      null,
      JSON.stringify([]),
      now,
      adminId,
    ]
  );

  // Percentage flag with time constraint
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

  const newApiFlag = crypto.randomUUID();
  await run(
    `INSERT OR IGNORE INTO feature_flags
      (id, name, description, type, status, category_id,
       start_date, end_date, percentage, client_ids,
       created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newApiFlag,
      'new-api-endpoints',
      'Новые эндпойнты API v2',
      FlagType.PERCENTAGE,
      FlagStatus.SCHEDULED,
      apiCategoryId,
      now,
      nextMonthDate.toISOString(),
      25, // 25% пользователей
      JSON.stringify(['client-1', 'client-2']),
      now,
      adminId,
    ]
  );

  // Client-specific flag
  const betaTestFlag = crypto.randomUUID();
  await run(
    `INSERT OR IGNORE INTO feature_flags
      (id, name, description, type, status, category_id,
       start_date, end_date, percentage, client_ids,
       created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      betaTestFlag,
      'beta-testers',
      'Доступ бета-тестерам',
      FlagType.BOOLEAN,
      FlagStatus.ACTIVE,
      rootCategoryId,
      null,
      null,
      null,
      JSON.stringify(['test-client-1', 'test-client-2', 'test-client-3']),
      now,
      adminId,
    ]
  );

  // 6. Insert audit logs
  const auditLog1 = crypto.randomUUID();
  await run(
    `INSERT OR IGNORE INTO audit_logs
      (id, user_id, action, entity_id, entity_type, old_value, new_value, timestamp, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      auditLog1,
      adminId,
      AuditAction.CREATE,
      rootCategoryId,
      'flag_categories',
      null,
      JSON.stringify({
        id: rootCategoryId,
        name: 'Основные фичи',
        description: 'Флаги для ключевого функционала',
        parentId: null,
        depth: 0,
      }),
      now,
      '127.0.0.1',
    ]
  );

  const auditLog2 = crypto.randomUUID();
  await run(
    `INSERT OR IGNORE INTO audit_logs
      (id, user_id, action, entity_id, entity_type, old_value, new_value, timestamp, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      auditLog2,
      adminId,
      AuditAction.CREATE,
      dashboardFlagId,
      'feature_flags',
      null,
      JSON.stringify({
        id: dashboardFlagId,
        name: 'new-dashboard',
        description: 'Новая версия дашборда',
        type: FlagType.BOOLEAN,
        status: FlagStatus.ACTIVE,
        categoryId: uiCategoryId,
      }),
      now,
      '127.0.0.1',
    ]
  );

  console.log('Seed completed successfully');
  db.close();
}

runSeed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { FlagStatus, FlagType } from './shared/kernel';

async function runSeed() {
  // 1. Открываем файл SQLite
  const db = new sqlite3.Database('data/flugs.db');
  const exec = promisify(db.exec.bind(db));
  const run = (sql: string, params: any[]) =>
    new Promise<void>((resolve, reject) => {
      db.run(sql, params, err => {
        if (err) reject(err);
        else resolve();
      });
    });

  // 2. Создаём таблицы, если их нет
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
  `);

  const now = new Date().toISOString();
  const adminId = 'seed-admin';

  // 3. Вставляем корневую категорию
  const categoryId = crypto.randomUUID();
  await run(
    `INSERT OR IGNORE INTO flag_categories
      (id, name, description, parent_id, depth, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [categoryId, 'Основные фичи', 'Флаги для ключевого функционала', null, 0, now, adminId]
  );

  // 4. Вставляем флаг
  await run(
    `INSERT OR IGNORE INTO feature_flags
      (id, name, description, type, status, category_id,
       start_date, end_date, percentage, client_ids,
       created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      'new-dashboard',
      'Новая версия дашборда',
      FlagType.BOOLEAN,
      FlagStatus.ACTIVE,
      categoryId,
      null,
      null,
      null,
      null,
      now,
      adminId,
    ]
  );

  console.log('Seed completed successfully');
  db.close();
}

runSeed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

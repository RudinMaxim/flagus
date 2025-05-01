export async function seedSchema(db) {
    await db.transaction(async () => {
        // Создаем таблицу флагов
        await db.exec(`
          CREATE TABLE IF NOT EXISTS flags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            enabled INTEGER DEFAULT 0,
            expired_at TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            environment TEXT NOT NULL DEFAULT 'development',
            percentage INTEGER DEFAULT 100,
            UNIQUE(name, environment)
          );
        `);

        // Индексы для повышения производительности запросов
        await db.exec(`
          CREATE INDEX IF NOT EXISTS idx_flags_name_env ON flags(name, environment);
        `);
    });
}

// Функция для начальной инициализации данных
export async function seedInitialData(db) {
    // Проверяем, есть ли уже данные в таблице флагов
    const existingFlags = await db.get('SELECT COUNT(*) as count FROM flags');

    if (existingFlags && existingFlags.count === 0) {
        await db.transaction(async () => {
            // Добавляем несколько тестовых флагов
            await db.run(`
              INSERT INTO flags (name, description, enabled, environment) 
              VALUES ('new_ui', 'Enable new user interface', 0, 'development');
            `);

            await db.run(`
              INSERT INTO flags (name, description, enabled, environment, percentage) 
              VALUES ('beta_feature', 'Beta testing feature', 1, 'development', 50);
            `);

            await db.run(`
                INSERT INTO flags (name, description, enabled, environment) 
                VALUES ('api_v2', 'Use API version 2', 0, 'production');
              `);
          });
    }
}
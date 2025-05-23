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
    FOREIGN KEY (flag_id) REFERENCES feature_flags (id) ON DELETE CASCADE
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups (user_id);

CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups (group_id);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags (key);

CREATE INDEX IF NOT EXISTS idx_feature_flags_environment_id ON feature_flags (environment_id);

CREATE INDEX IF NOT EXISTS idx_flag_categories_parent_id ON flag_categories (parent_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs (entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp);

CREATE INDEX IF NOT EXISTS idx_sdk_keys_environment_id ON sdk_keys (environment_id);

-- Create views for common queries
CREATE VIEW IF NOT EXISTS user_group_details AS
SELECT
    u.id AS user_id,
    u.username,
    u.email,
    u.role,
    g.id AS group_id,
    g.name AS group_name,
    g.description AS group_description
FROM
    users u
    LEFT JOIN user_groups ug ON u.id = ug.user_id
    LEFT JOIN groups g ON ug.group_id = g.id
WHERE
    u.is_active = 1;

CREATE VIEW IF NOT EXISTS feature_flag_details AS
SELECT
    ff.id AS flag_id,
    ff.key AS flag_key,
    ff.name AS flag_name,
    ff.type AS flag_type,
    ff.status,
    ff.expires_at,
    ff.category_id,
    fc.name AS category_name,
    e.id AS environment_id,
    e.name AS environment_name
FROM
    feature_flags ff
    LEFT JOIN flag_categories fc ON ff.category_id = fc.id
    LEFT JOIN environments e ON ff.environment_id = e.id;

-- Create triggers for automatic audit logging
CREATE TRIGGER IF NOT EXISTS audit_flag_update
AFTER UPDATE ON feature_flags
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        id,
        user_id,
        action,
        entity_id,
        entity_type,
        old_value,
        new_value,
        timestamp,
        ip_address
    )
    VALUES (
        'log-' || (SELECT hex(randomblob(16))),
        NEW.updated_by,
        'UPDATE',
        NEW.id,
        'feature_flag',
        json_object(
            'key', OLD.key,
            'status', OLD.status,
            'type', OLD.type,
            'expires_at', OLD.expires_at
        ),
        json_object(
            'key', NEW.key,
            'status', NEW.status,
            'type', NEW.type,
            'expires_at', NEW.expires_at
        ),
        datetime('now'),
        NULL
    );
END;

CREATE TRIGGER IF NOT EXISTS audit_flag_insert
AFTER INSERT ON feature_flags
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        id,
        user_id,
        action,
        entity_id,
        entity_type,
        old_value,
        new_value,
        timestamp,
        ip_address
    )
    VALUES (
        'log-' || (SELECT hex(randomblob(16))),
        NEW.created_by,
        'CREATE',
        NEW.id,
        'feature_flag',
        NULL,
        json_object(
            'key', NEW.key,
            'status', NEW.status,
            'type', NEW.type,
            'expires_at', NEW.expires_at
        ),
        datetime('now'),
        NULL
    );
END;

-- Create a trigger to enforce flag_ttl consistency
CREATE TRIGGER IF NOT EXISTS sync_flag_ttl
AFTER UPDATE OF expires_at, auto_delete ON feature_flags
FOR EACH ROW
WHEN NEW.expires_at IS NOT NULL
BEGIN
    INSERT OR REPLACE INTO flag_ttl (flag_id, expires_at, auto_delete)
    VALUES (NEW.id, NEW.expires_at, COALESCE(NEW.auto_delete, 0));
END;

-- Create a trigger to remove flag_ttl when expires_at is set to NULL
CREATE TRIGGER IF NOT EXISTS remove_flag_ttl
AFTER UPDATE OF expires_at ON feature_flags
FOR EACH ROW
WHEN NEW.expires_at IS NULL
BEGIN
    DELETE FROM flag_ttl WHERE flag_id = NEW.id;
END;

-- Enable foreign key constraints again for safety
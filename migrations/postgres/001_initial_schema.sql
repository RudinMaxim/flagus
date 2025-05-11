CREATE TYPE user_role AS ENUM ('admin', 'user', 'guest');

CREATE TYPE sdk_key_type AS ENUM ('client', 'server');

CREATE TYPE flag_type AS ENUM ('boolean', 'enum');

CREATE TYPE flag_status AS ENUM ('active', 'inactive', 'scheduled', 'archived');

CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'toggle', 'extend_ttl');

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        updated_by UUID,
        updated_at TIMESTAMP
    WITH
        TIME ZONE
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        updated_by UUID,
        updated_at TIMESTAMP
    WITH
        TIME ZONE
);

CREATE TABLE IF NOT EXISTS user_groups (
    user_id UUID REFERENCES users (id),
    group_id UUID REFERENCES groups (id),
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE IF NOT EXISTS flag_categories (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES flag_categories (id),
    depth INTEGER NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        updated_by UUID,
        updated_at TIMESTAMP
    WITH
        TIME ZONE
);

CREATE TABLE IF NOT EXISTS environments (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        updated_by UUID,
        updated_at TIMESTAMP
    WITH
        TIME ZONE
);

CREATE TABLE IF NOT EXISTS sdk_keys (
    id UUID PRIMARY KEY,
    environment_id UUID REFERENCES environments (id),
    key TEXT NOT NULL,
    type sdk_key_type NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        created_by UUID NOT NULL,
        is_active BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type flag_type NOT NULL,
    description TEXT,
    expires_at TIMESTAMP
    WITH
        TIME ZONE,
        auto_delete BOOLEAN,
        status flag_status NOT NULL,
        enum JSONB,
        category_id UUID REFERENCES flag_categories (id),
        environment_id UUID REFERENCES environments (id),
        client_ids UUID [],
        created_by UUID NOT NULL,
        created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        updated_by UUID,
        updated_at TIMESTAMP
    WITH
        TIME ZONE
);

CREATE TABLE IF NOT EXISTS flag_ttl (
    flag_id UUID PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_delete BOOLEAN NOT NULL,
    FOREIGN KEY (flag_id) REFERENCES feature_flags(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users (id),
    action audit_action NOT NULL,
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        ip_address INET
);

CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_feature_flags_key ON feature_flags (key);

CREATE INDEX idx_sdk_keys_key ON sdk_keys (key);
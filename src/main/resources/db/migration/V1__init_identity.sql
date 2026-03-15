-- ═══════════════════════════════════════════════
-- V1: Identity & Auth Schema
-- ═══════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Roles
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,   -- OWNER, MANAGER, SUPERVISOR, CASHIER, WAITER
    description VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username             VARCHAR(50) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    full_name            VARCHAR(100) NOT NULL,
    phone                VARCHAR(20),
    role_id              UUID NOT NULL REFERENCES roles(id),
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    max_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    last_login_at        TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh tokens (stored in Redis, but table tracks issued tokens for audit)
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity / audit log (APPEND ONLY — no DELETE privilege on this table)
CREATE TABLE activity_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(id),
    username      VARCHAR(50),                 -- denormalized for history
    action        VARCHAR(100) NOT NULL,       -- CANCEL_ORDER, DELETE_ITEM, etc.
    entity_type   VARCHAR(50),
    entity_id     UUID,
    details       JSONB,
    ip_address    VARCHAR(45),
    performed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default roles
INSERT INTO roles (name, description) VALUES
    ('OWNER',       'Full system access — unrestricted'),
    ('MANAGER',     'Branch management — prices, staff, reports'),
    ('SUPERVISOR',  'Shift supervisor — approve discounts, void orders'),
    ('CASHIER',     'POS operations — sell, collect payment'),
    ('WAITER',      'Floor staff — take orders only');

-- Seed default admin user (password: Admin@2025 — CHANGE IN PRODUCTION)
INSERT INTO users (username, password_hash, full_name, role_id, max_discount_percent)
VALUES (
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NqCRqJmu2', -- bcrypt of Admin@2025
    'System Administrator',
    (SELECT id FROM roles WHERE name = 'OWNER'),
    100
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_activity_user_action ON activity_logs(user_id, action, performed_at DESC);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username            VARCHAR(50)  NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    full_name           VARCHAR(100) NOT NULL,
    role                VARCHAR(20)  NOT NULL CHECK (role IN ('OWNER','MANAGER','SUPERVISOR','CASHIER','WAITER')),
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    max_discount_percent INT          NOT NULL DEFAULT 5,
    last_login_at       TIMESTAMP,
    pin                 VARCHAR(10),
    deleted             BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT now(),
    created_by          VARCHAR(100)
);

-- ─── ACTIVITY LOGS (append-only, no DELETE) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL,
    username     VARCHAR(100) NOT NULL,
    action       VARCHAR(100) NOT NULL,
    entity_type  VARCHAR(50),
    entity_id    UUID,
    details      TEXT,
    ip_address   VARCHAR(45),
    performed_at TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_user    ON activity_logs(user_id);
CREATE INDEX idx_activity_action  ON activity_logs(action);
CREATE INDEX idx_activity_date    ON activity_logs(performed_at DESC);

-- Seed default OWNER user (password: Admin@123)
INSERT INTO users (id, username, password_hash, full_name, role, max_discount_percent)
VALUES (
    gen_random_uuid(),
    'owner',
    '$2a$12$PtLr4kVMnDxheTjy0TGLaOb/eJCk4RCkGqnJECi2q3cxvRQLxb.lG',
    'Cafe Owner',
    'OWNER',
    100
) ON CONFLICT DO NOTHING;

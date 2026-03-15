-- ─── DEVICES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(50)    NOT NULL UNIQUE,
    type         VARCHAR(5)     NOT NULL CHECK (type IN ('PS4','PS5')),
    single_rate  NUMERIC(10,2)  NOT NULL DEFAULT 15.00,
    multi_rate   NUMERIC(10,2)  NOT NULL DEFAULT 20.00,
    status       VARCHAR(10)    NOT NULL DEFAULT 'FREE' CHECK (status IN ('FREE','ACTIVE','RESERVED')),
    active       BOOLEAN        NOT NULL DEFAULT TRUE,
    deleted      BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP      NOT NULL DEFAULT now(),
    created_by   VARCHAR(100)
);

-- ─── GAMING SESSIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaming_sessions (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       UUID           NOT NULL REFERENCES devices(id),
    device_name     VARCHAR(50)    NOT NULL,
    cashier_id      UUID           NOT NULL REFERENCES users(id),
    customer_id     UUID,
    started_at      TIMESTAMP      NOT NULL DEFAULT now(),
    ended_at        TIMESTAMP,
    current_type    VARCHAR(6)     NOT NULL DEFAULT 'SINGLE' CHECK (current_type IN ('SINGLE','MULTI')),
    status          VARCHAR(6)     NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CLOSED')),
    total_minutes   INT,
    gaming_amount   NUMERIC(10,2)  DEFAULT 0,
    linked_order_id UUID,
    deleted         BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT now(),
    created_by      VARCHAR(100)
);
CREATE INDEX idx_sessions_status ON gaming_sessions(status);
CREATE INDEX idx_sessions_device ON gaming_sessions(device_id);

-- ─── SESSION SEGMENTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_segments (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID           NOT NULL REFERENCES gaming_sessions(id) ON DELETE CASCADE,
    session_type    VARCHAR(6)     NOT NULL CHECK (session_type IN ('SINGLE','MULTI')),
    rate            NUMERIC(10,2)  NOT NULL,
    started_at      TIMESTAMP      NOT NULL,
    ended_at        TIMESTAMP,
    duration_minutes INT,
    amount          NUMERIC(10,2),
    deleted         BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT now(),
    created_by      VARCHAR(100)
);

-- ─── SEED DEVICES ────────────────────────────────────────────────────────────
INSERT INTO devices (name, type, single_rate, multi_rate) VALUES
    ('PS5 - Station 1', 'PS5', 20.00, 30.00),
    ('PS5 - Station 2', 'PS5', 20.00, 30.00),
    ('PS4 - Station 3', 'PS4', 15.00, 22.00),
    ('PS4 - Station 4', 'PS4', 15.00, 22.00)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════
-- V5: Gaming — Devices & Sessions
-- ═══════════════════════════════════════════════

CREATE TABLE gaming_devices (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(30) NOT NULL UNIQUE,  -- PS5-01, PS4-01, etc.
    device_type   VARCHAR(10) NOT NULL,          -- PS4, PS5
    single_rate   NUMERIC(8,2) NOT NULL,         -- Price per hour / single player
    multi_rate    NUMERIC(8,2) NOT NULL,          -- Price per hour / multi player
    status        VARCHAR(20) NOT NULL DEFAULT 'FREE', -- FREE, ACTIVE, RESERVED
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Each session = one period of continuous play on one device
CREATE TABLE gaming_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       UUID NOT NULL REFERENCES gaming_devices(id),
    linked_order_id UUID REFERENCES orders(id),  -- F&B order attached to this session
    cashier_id      UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, CLOSED
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    total_duration_minutes NUMERIC(8,2),
    gaming_amount   NUMERIC(10,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- When player switches Single↔Multi, a new segment is created
CREATE TABLE session_segments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   UUID NOT NULL REFERENCES gaming_sessions(id) ON DELETE CASCADE,
    session_type VARCHAR(10) NOT NULL,     -- SINGLE, MULTI
    rate         NUMERIC(8,2) NOT NULL,
    started_at   TIMESTAMPTZ NOT NULL,
    ended_at     TIMESTAMPTZ,
    duration_minutes NUMERIC(8,2),
    amount       NUMERIC(10,2)
);

-- Add FK on orders for gaming device
ALTER TABLE orders ADD CONSTRAINT fk_orders_device
    FOREIGN KEY (device_id) REFERENCES gaming_devices(id);

-- Seed PS devices
INSERT INTO gaming_devices (name, device_type, single_rate, multi_rate) VALUES
    ('PS5-01', 'PS5', 50, 70),
    ('PS5-02', 'PS5', 50, 70),
    ('PS5-03', 'PS5', 50, 70),
    ('PS4-01', 'PS4', 35, 50),
    ('PS4-02', 'PS4', 35, 50),
    ('PS4-03', 'PS4', 35, 50);

-- Indexes
CREATE INDEX idx_gaming_sessions_device_status ON gaming_sessions(device_id, status);
CREATE INDEX idx_gaming_sessions_active ON gaming_sessions(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_gaming_sessions_cashier ON gaming_sessions(cashier_id, started_at DESC);
CREATE INDEX idx_session_segments_session ON session_segments(session_id);

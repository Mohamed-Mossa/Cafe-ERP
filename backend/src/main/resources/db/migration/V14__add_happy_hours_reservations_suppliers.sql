-- ─── HAPPY HOURS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS happy_hours (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(100)   NOT NULL,
    discount_percent NUMERIC(5,2)   NOT NULL,
    start_time       TIME           NOT NULL,
    end_time         TIME           NOT NULL,
    days_of_week     VARCHAR(50)    NOT NULL DEFAULT 'MON,TUE,WED,THU,FRI,SAT,SUN',
    active           BOOLEAN        NOT NULL DEFAULT TRUE,
    deleted          BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ─── SUPPLIERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(100)   NOT NULL,
    contact_person   VARCHAR(100),
    phone            VARCHAR(20),
    email            VARCHAR(100),
    address          TEXT,
    notes            TEXT,
    active           BOOLEAN        NOT NULL DEFAULT TRUE,
    deleted          BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

ALTER TABLE inventory_purchases ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- ─── RESERVATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name    VARCHAR(100)   NOT NULL,
    customer_phone   VARCHAR(20)    NOT NULL,
    table_id         UUID,
    table_name       VARCHAR(50),
    party_size       INTEGER        NOT NULL DEFAULT 2,
    reservation_date DATE           NOT NULL,
    reservation_time TIME           NOT NULL,
    duration_minutes INTEGER        NOT NULL DEFAULT 120,
    deposit_amount   NUMERIC(10,2)  NOT NULL DEFAULT 0,
    deposit_paid     BOOLEAN        NOT NULL DEFAULT FALSE,
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    notes            TEXT,
    cashier_id       UUID,
    deleted          BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reservations_date ON reservations(reservation_date) WHERE deleted = FALSE;
CREATE INDEX idx_reservations_status ON reservations(status) WHERE deleted = FALSE;

-- Seed a sample happy hour
INSERT INTO happy_hours (name, discount_percent, start_time, end_time, days_of_week)
VALUES ('Afternoon Happy Hour', 15.00, '15:00', '17:00', 'MON,TUE,WED,THU,FRI')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════
-- V7: Shifts & Promotions
-- ═══════════════════════════════════════════════

-- Shifts
CREATE TABLE shifts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id       UUID NOT NULL REFERENCES users(id),
    opening_balance  NUMERIC(10,2) NOT NULL DEFAULT 0,
    expected_cash    NUMERIC(10,2),
    actual_cash      NUMERIC(10,2),
    cash_variance    NUMERIC(10,2),
    status           VARCHAR(10) NOT NULL DEFAULT 'OPEN',  -- OPEN, CLOSED
    opened_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at        TIMESTAMPTZ
);

CREATE TABLE petty_expenses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id     UUID NOT NULL REFERENCES shifts(id),
    category     VARCHAR(50) NOT NULL,   -- CLEANING, MAINTENANCE, EMERGENCY, TRANSPORT, OTHER
    description  VARCHAR(255),
    amount       NUMERIC(10,2) NOT NULL,
    recorded_by  UUID REFERENCES users(id),
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shift_reports (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id          UUID NOT NULL UNIQUE REFERENCES shifts(id),
    total_sales       NUMERIC(12,2) NOT NULL,
    cash_sales        NUMERIC(12,2) NOT NULL DEFAULT 0,
    card_sales        NUMERIC(12,2) NOT NULL DEFAULT 0,
    ewallet_sales     NUMERIC(12,2) NOT NULL DEFAULT 0,
    credit_sales      NUMERIC(12,2) NOT NULL DEFAULT 0,
    cafe_revenue      NUMERIC(12,2) NOT NULL DEFAULT 0,
    ps_revenue        NUMERIC(12,2) NOT NULL DEFAULT 0,
    takeaway_revenue  NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_expenses    NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_orders      INT NOT NULL DEFAULT 0,
    avg_order_value   NUMERIC(10,2),
    ps_sessions_count INT NOT NULL DEFAULT 0,
    report_data       JSONB,             -- Full report snapshot
    generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at           TIMESTAMPTZ
);

-- Promo codes (OWNER only creates them)
CREATE TABLE promo_codes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(50) NOT NULL UNIQUE,
    description         VARCHAR(255),
    discount_type       VARCHAR(10) NOT NULL,   -- PERCENT, FIXED
    discount_value      NUMERIC(10,2) NOT NULL,
    min_order_amount    NUMERIC(10,2),
    max_usage_count     INT NOT NULL DEFAULT 1,
    current_usage_count INT NOT NULL DEFAULT 0,
    applies_to          VARCHAR(20) NOT NULL DEFAULT 'ALL',  -- ALL, CAFE, GAMING
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version             INT NOT NULL DEFAULT 0  -- Optimistic locking
);

CREATE TABLE promo_usage_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id    UUID NOT NULL REFERENCES promo_codes(id),
    order_id         UUID NOT NULL REFERENCES orders(id),
    cashier_id       UUID NOT NULL REFERENCES users(id),
    customer_id      UUID REFERENCES customers(id),
    discount_applied NUMERIC(10,2) NOT NULL,
    used_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK on orders for promo code
ALTER TABLE orders ADD CONSTRAINT fk_orders_promo
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id);

-- Reservations
CREATE TABLE reservations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type  VARCHAR(10) NOT NULL,   -- TABLE, DEVICE
    resource_id    UUID NOT NULL,
    customer_id    UUID REFERENCES customers(id),
    guest_name     VARCHAR(100) NOT NULL,
    guest_phone    VARCHAR(20) NOT NULL,
    party_size     INT NOT NULL DEFAULT 2,
    scheduled_at   TIMESTAMPTZ NOT NULL,
    duration_hours NUMERIC(4,2),
    deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    deposit_paid   BOOLEAN NOT NULL DEFAULT FALSE,
    status         VARCHAR(15) NOT NULL DEFAULT 'CONFIRMED', -- CONFIRMED, SEATED, CANCELLED, NO_SHOW
    notes          TEXT,
    created_by     UUID REFERENCES users(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shifts_cashier ON shifts(cashier_id, opened_at DESC);
CREATE INDEX idx_shifts_status ON shifts(status) WHERE status = 'OPEN';
CREATE INDEX idx_petty_expenses_shift ON petty_expenses(shift_id);
CREATE INDEX idx_promo_active ON promo_codes(code, is_active, end_date) WHERE is_active = TRUE;
CREATE INDEX idx_promo_usage_code ON promo_usage_logs(promo_code_id, used_at DESC);
CREATE INDEX idx_reservations_schedule ON reservations(scheduled_at, resource_type, resource_id);
CREATE INDEX idx_reservations_today ON reservations(scheduled_at) WHERE status NOT IN ('CANCELLED', 'NO_SHOW');

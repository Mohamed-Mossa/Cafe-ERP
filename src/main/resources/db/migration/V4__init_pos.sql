-- ═══════════════════════════════════════════════
-- V4: POS — Tables, Orders, Payments
-- ═══════════════════════════════════════════════

CREATE TABLE cafe_tables (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(30) NOT NULL UNIQUE,  -- T-01, T-02, etc.
    capacity    INT NOT NULL DEFAULT 4,
    zone        VARCHAR(50),                  -- INDOOR, OUTDOOR, LOUNGE
    status      VARCHAR(20) NOT NULL DEFAULT 'FREE', -- FREE, OCCUPIED, BILLING, RESERVED
    position_x  INT NOT NULL DEFAULT 0,
    position_y  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    BIGSERIAL UNIQUE NOT NULL,    -- Sequential, never reused
    source          VARCHAR(20) NOT NULL,         -- TABLE, GAMING, TAKEAWAY
    table_id        UUID REFERENCES cafe_tables(id),
    device_id       UUID,                         -- FK to gaming_devices (V5)
    cashier_id      UUID NOT NULL REFERENCES users(id),
    customer_id     UUID,                         -- FK to customers (V6)
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, PAID, CANCELLED
    subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_type   VARCHAR(20),                 -- PERCENT, FIXED
    discount_value  NUMERIC(10,2),
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
    grand_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
    notes           TEXT,
    cancel_reason   VARCHAR(255),
    cancelled_by    UUID REFERENCES users(id),
    promo_code_id   UUID,                         -- FK added in V7
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMPTZ
);

CREATE TABLE order_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    product_name    VARCHAR(150) NOT NULL,        -- Denormalized
    unit_price      NUMERIC(10,2) NOT NULL,       -- Price at time of order
    quantity        INT NOT NULL DEFAULT 1,
    total_price     NUMERIC(10,2) NOT NULL,
    notes           VARCHAR(255),
    kitchen_status  VARCHAR(20) NOT NULL DEFAULT 'NEW',  -- NEW, PREPARING, READY, SERVED
    kitchen_sent_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID NOT NULL REFERENCES orders(id),
    method       VARCHAR(20) NOT NULL,  -- CASH, CARD, EWALLET, CREDIT
    amount       NUMERIC(10,2) NOT NULL,
    reference    VARCHAR(100),           -- card auth code, ewallet ref, etc.
    paid_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed tables
INSERT INTO cafe_tables (name, capacity, zone, position_x, position_y) VALUES
    ('T-01', 4, 'INDOOR', 0, 0), ('T-02', 4, 'INDOOR', 1, 0),
    ('T-03', 4, 'INDOOR', 2, 0), ('T-04', 4, 'INDOOR', 3, 0),
    ('T-05', 6, 'INDOOR', 0, 1), ('T-06', 6, 'INDOOR', 1, 1),
    ('T-07', 2, 'INDOOR', 2, 1), ('T-08', 2, 'INDOOR', 3, 1),
    ('T-09', 4, 'OUTDOOR', 0, 2), ('T-10', 4, 'OUTDOOR', 1, 2);

-- Indexes
CREATE INDEX idx_orders_status ON orders(status) WHERE status = 'OPEN';
CREATE INDEX idx_orders_cashier_date ON orders(cashier_id, created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_lines_order ON order_lines(order_id);
CREATE INDEX idx_order_lines_kitchen ON order_lines(kitchen_status) WHERE kitchen_status != 'SERVED';
CREATE INDEX idx_payments_order ON payments(order_id);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

CREATE TABLE IF NOT EXISTS orders (
    id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number         BIGINT         NOT NULL UNIQUE DEFAULT nextval('order_number_seq'),
    source               VARCHAR(20)    NOT NULL CHECK (source IN ('TABLE','GAMING','TAKEAWAY')),
    table_id             UUID,
    table_name           VARCHAR(50),
    device_id            UUID,
    device_name          VARCHAR(50),
    cashier_id           UUID           NOT NULL REFERENCES users(id),
    cashier_name         VARCHAR(100),
    status               VARCHAR(20)    NOT NULL DEFAULT 'OPEN'
                             CHECK (status IN ('OPEN','PENDING_PAYMENT','CLOSED','CANCELLED')),
    subtotal             NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount      NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_type        VARCHAR(20),
    tax_amount           NUMERIC(10, 2) NOT NULL DEFAULT 0,
    grand_total          NUMERIC(10, 2) NOT NULL DEFAULT 0,
    promo_code_id        UUID,
    promo_code_applied   VARCHAR(50),
    customer_id          UUID,
    customer_name        VARCHAR(100),
    loyalty_points_earned INT,
    closed_at            TIMESTAMP,
    deleted              BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP      NOT NULL DEFAULT now(),
    created_by           VARCHAR(100)
);
CREATE INDEX idx_orders_status      ON orders(status) WHERE deleted = FALSE;
CREATE INDEX idx_orders_cashier     ON orders(cashier_id);
CREATE INDEX idx_orders_table       ON orders(table_id) WHERE table_id IS NOT NULL;
CREATE INDEX idx_orders_device      ON orders(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_orders_closed_date ON orders(closed_at DESC) WHERE closed_at IS NOT NULL;

-- ─── ORDER LINES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_lines (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id     UUID           NOT NULL,
    product_name   VARCHAR(150)   NOT NULL,
    quantity       INT            NOT NULL,
    unit_price     NUMERIC(10, 2) NOT NULL,
    total_price    NUMERIC(10, 2) NOT NULL,
    notes          VARCHAR(300),
    kitchen_status VARCHAR(20)    NOT NULL DEFAULT 'NEW'
                       CHECK (kitchen_status IN ('NEW','PREPARING','READY','SERVED')),
    deleted        BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP      NOT NULL DEFAULT now(),
    created_by     VARCHAR(100)
);
CREATE INDEX idx_order_lines_order ON order_lines(order_id);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id        UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id  UUID           NOT NULL REFERENCES orders(id),
    method    VARCHAR(20)    NOT NULL CHECK (method IN ('CASH','CARD','EWALLET','CREDIT')),
    amount    NUMERIC(10, 2) NOT NULL,
    reference VARCHAR(100),
    paid_at   TIMESTAMP      NOT NULL DEFAULT now(),
    deleted   BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at TIMESTAMP     NOT NULL DEFAULT now(),
    created_by VARCHAR(100)
);

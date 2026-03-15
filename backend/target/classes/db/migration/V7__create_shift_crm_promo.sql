-- ─── SHIFTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id       UUID           NOT NULL REFERENCES users(id),
    cashier_name     VARCHAR(100)   NOT NULL,
    opening_balance  NUMERIC(10,2)  NOT NULL DEFAULT 0,
    expected_cash    NUMERIC(10,2),
    actual_cash      NUMERIC(10,2),
    cash_variance    NUMERIC(10,2),
    total_sales      NUMERIC(10,2)  NOT NULL DEFAULT 0,
    total_expenses   NUMERIC(10,2)  NOT NULL DEFAULT 0,
    net_cash         NUMERIC(10,2)  NOT NULL DEFAULT 0,
    status           VARCHAR(10)    NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
    closed_at        TIMESTAMP,
    closing_notes    TEXT,
    deleted          BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT now(),
    created_by       VARCHAR(100)
);
CREATE INDEX idx_shifts_cashier_status ON shifts(cashier_id, status);

-- ─── PETTY EXPENSES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS petty_expenses (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id    UUID           NOT NULL REFERENCES shifts(id),
    description VARCHAR(200)   NOT NULL,
    amount      NUMERIC(10,2)  NOT NULL,
    category    VARCHAR(100),
    receipt_ref VARCHAR(100),
    deleted     BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP      NOT NULL DEFAULT now(),
    created_by  VARCHAR(100)
);

-- ─── CUSTOMERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    phone          VARCHAR(20)    NOT NULL UNIQUE,
    full_name      VARCHAR(100)   NOT NULL,
    email          VARCHAR(150),
    tier           VARCHAR(10)    NOT NULL DEFAULT 'BRONZE' CHECK (tier IN ('BRONZE','SILVER','GOLD')),
    credit_balance NUMERIC(10,2)  NOT NULL DEFAULT 0,
    credit_limit   NUMERIC(10,2)  NOT NULL DEFAULT 0,
    total_points   INT            NOT NULL DEFAULT 0,
    total_spent    NUMERIC(10,2)  NOT NULL DEFAULT 0,
    active         BOOLEAN        NOT NULL DEFAULT TRUE,
    deleted        BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP      NOT NULL DEFAULT now(),
    created_by     VARCHAR(100)
);
CREATE INDEX idx_customer_phone ON customers(phone) WHERE deleted = FALSE;

-- ─── POINT TRANSACTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS point_transactions (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id   UUID           NOT NULL REFERENCES customers(id),
    points        INT            NOT NULL,
    type          VARCHAR(20)    NOT NULL,
    description   VARCHAR(200),
    order_id      UUID,
    order_amount  NUMERIC(10,2),
    balance_after INT            NOT NULL,
    deleted       BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP      NOT NULL DEFAULT now(),
    created_by    VARCHAR(100)
);
CREATE INDEX idx_points_customer ON point_transactions(customer_id);

-- ─── PROMO CODES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
    id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    code                  VARCHAR(30)    NOT NULL UNIQUE,
    description           VARCHAR(200)   NOT NULL,
    discount_type         VARCHAR(10)    NOT NULL CHECK (discount_type IN ('PERCENT','FIXED')),
    discount_value        NUMERIC(10,2)  NOT NULL,
    max_usage_count       INT            NOT NULL DEFAULT 1,
    current_usage_count   INT            NOT NULL DEFAULT 0,
    start_date            DATE           NOT NULL,
    end_date              DATE           NOT NULL,
    active                BOOLEAN        NOT NULL DEFAULT TRUE,
    created_by_owner_id   UUID           NOT NULL REFERENCES users(id),
    minimum_order_amount  NUMERIC(10,2),
    version               BIGINT         NOT NULL DEFAULT 0,
    deleted               BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP      NOT NULL DEFAULT now(),
    created_by            VARCHAR(100)
);
CREATE INDEX idx_promo_active ON promo_codes(code, active) WHERE active = TRUE AND deleted = FALSE;

-- ═══════════════════════════════════════════════
-- V6: CRM — Customers & Loyalty
-- ═══════════════════════════════════════════════

CREATE TABLE customers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone         VARCHAR(20) NOT NULL UNIQUE,
    name          VARCHAR(100),
    email         VARCHAR(150),
    birth_date    DATE,
    tier          VARCHAR(10) NOT NULL DEFAULT 'BRONZE',  -- BRONZE, SILVER, GOLD
    notes         TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    credit_limit  NUMERIC(10,2) NOT NULL DEFAULT 0,
    credit_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_spend   NUMERIC(12,2) NOT NULL DEFAULT 0,
    visit_count   INT NOT NULL DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loyalty_accounts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id      UUID NOT NULL UNIQUE REFERENCES customers(id),
    total_points     INT NOT NULL DEFAULT 0,
    available_points INT NOT NULL DEFAULT 0,
    lifetime_earned  INT NOT NULL DEFAULT 0,
    lifetime_redeemed INT NOT NULL DEFAULT 0,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE point_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_account_id  UUID NOT NULL REFERENCES loyalty_accounts(id),
    type                VARCHAR(20) NOT NULL,  -- EARN, REDEEM, EXPIRE, BONUS
    points              INT NOT NULL,           -- positive = earned, negative = redeemed
    order_id            UUID REFERENCES orders(id),
    description         VARCHAR(255),
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE debt_records (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id    UUID NOT NULL REFERENCES customers(id),
    order_id       UUID REFERENCES orders(id),
    amount         NUMERIC(10,2) NOT NULL,
    paid_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
    due_date       DATE,
    is_settled     BOOLEAN NOT NULL DEFAULT FALSE,
    notes          VARCHAR(255),
    created_by     UUID REFERENCES users(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK on orders for customer
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id);

-- Indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_tier ON customers(tier);
CREATE INDEX idx_customers_last_visit ON customers(last_visit_at DESC NULLS LAST);
CREATE INDEX idx_point_transactions_account ON point_transactions(loyalty_account_id, created_at DESC);
CREATE INDEX idx_debt_records_customer ON debt_records(customer_id) WHERE is_settled = FALSE;

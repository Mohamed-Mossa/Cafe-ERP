-- ─── SYSTEM SETTINGS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key     VARCHAR(100)   NOT NULL UNIQUE,
    setting_value   TEXT,
    description     VARCHAR(300),
    updated_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
    ('cafe_name',               'My Cafe',          'Cafe display name'),
    ('cafe_address',            '',                 'Cafe address for receipts'),
    ('cafe_phone',              '',                 'Cafe phone for receipts'),
    ('tax_rate_percent',        '0',                'Tax rate percentage'),
    ('receipt_footer',          'Thank you for visiting!', 'Receipt footer text'),
    ('loyalty_earn_rate',       '10',               'Points per 100 EGP spent'),
    ('loyalty_redeem_rate',     '10',               'EGP value per 100 points redeemed'),
    ('loyalty_expiry_months',   '6',                'Points expire after N months'),
    ('silver_threshold',        '500',              'Points needed for Silver tier'),
    ('gold_threshold',          '1500',             'Points needed for Gold tier'),
    ('gaming_min_minutes',      '15',               'Minimum billed minutes per session'),
    ('gaming_alert_minutes',    '5',                'Alert cashier N minutes before session hour ends'),
    ('match_mode_products',     '',                 'Comma-separated product IDs shown in Match Mode')
ON CONFLICT (setting_key) DO NOTHING;

-- ─── PACKAGES / MEMBERSHIPS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_packages (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)   NOT NULL,
    description     VARCHAR(300),
    device_type     VARCHAR(10)    NOT NULL DEFAULT 'ANY',  -- PS4, PS5, ANY
    session_type    VARCHAR(10)    NOT NULL DEFAULT 'ANY',  -- SINGLE, MULTI, ANY
    hours_included  NUMERIC(6,2)   NOT NULL,
    price           NUMERIC(10,2)  NOT NULL,
    validity_days   INTEGER        NOT NULL DEFAULT 90,
    active          BOOLEAN        NOT NULL DEFAULT TRUE,
    deleted         BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_packages (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID           NOT NULL REFERENCES customers(id),
    package_id      UUID           NOT NULL REFERENCES membership_packages(id),
    hours_remaining NUMERIC(6,2)   NOT NULL,
    hours_purchased NUMERIC(6,2)   NOT NULL,
    purchase_price  NUMERIC(10,2)  NOT NULL,
    expires_at      DATE           NOT NULL,
    active          BOOLEAN        NOT NULL DEFAULT TRUE,
    cashier_id      UUID,
    deleted         BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_packages_customer ON customer_packages(customer_id) WHERE deleted = FALSE;

-- ─── TOURNAMENTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150)   NOT NULL,
    game_name       VARCHAR(100)   NOT NULL,
    tournament_date DATE           NOT NULL,
    entry_fee       NUMERIC(10,2)  NOT NULL DEFAULT 0,
    max_players     INTEGER        NOT NULL DEFAULT 16,
    prize_pool      NUMERIC(10,2)  NOT NULL DEFAULT 0,
    status          VARCHAR(20)    NOT NULL DEFAULT 'UPCOMING', -- UPCOMING, ACTIVE, COMPLETED, CANCELLED
    notes           TEXT,
    cashier_id      UUID,
    deleted         BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_players (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id   UUID           NOT NULL REFERENCES tournaments(id),
    player_name     VARCHAR(100)   NOT NULL,
    player_phone    VARCHAR(20),
    customer_id     UUID,
    fee_paid        BOOLEAN        NOT NULL DEFAULT FALSE,
    fee_amount      NUMERIC(10,2)  NOT NULL DEFAULT 0,
    rank            INTEGER,
    checked_in      BOOLEAN        NOT NULL DEFAULT FALSE,
    notes           TEXT,
    cashier_id      UUID,
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tournament_players_tournament ON tournament_players(tournament_id);

-- ─── EXPENSES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_categories (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)   NOT NULL UNIQUE,
    parent_category VARCHAR(50),   -- OPERATIONAL, PURCHASES, MAINTENANCE, STAFF, MISC
    active          BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

INSERT INTO expense_categories (name, parent_category) VALUES
    ('Rent',             'OPERATIONAL'),
    ('Electricity',      'OPERATIONAL'),
    ('Gas',              'OPERATIONAL'),
    ('Water',            'OPERATIONAL'),
    ('Internet',         'OPERATIONAL'),
    ('Daily Ingredients','PURCHASES'),
    ('Supplies',         'PURCHASES'),
    ('Cleaning Materials','PURCHASES'),
    ('Equipment Repair', 'MAINTENANCE'),
    ('PlayStation Maintenance','MAINTENANCE'),
    ('Furniture Repair', 'MAINTENANCE'),
    ('Salary',           'STAFF'),
    ('Advance',          'STAFF'),
    ('Bonus',            'STAFF'),
    ('Transport',        'MISC'),
    ('Emergency',        'MISC'),
    ('Other',            'MISC')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS expenses (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID           REFERENCES expense_categories(id),
    category_name   VARCHAR(100)   NOT NULL,
    amount          NUMERIC(10,2)  NOT NULL,
    description     TEXT,
    expense_date    DATE           NOT NULL DEFAULT CURRENT_DATE,
    shift_id        UUID,          -- optional: linked to a shift
    recorded_by_id  UUID,
    recorded_by_name VARCHAR(100),
    deleted         BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON expenses(expense_date) WHERE deleted = FALSE;
CREATE INDEX idx_expenses_category ON expenses(category_name) WHERE deleted = FALSE;

-- ─── MATCH MODE: mark products as available in match mode ────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS available_in_match_mode BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Seed packages ────────────────────────────────────────────────────────────
INSERT INTO membership_packages (name, description, device_type, session_type, hours_included, price, validity_days)
VALUES
    ('Gamer Basic',   '10 hours on PS4 (Single)',   'PS4', 'SINGLE', 10, 300, 90),
    ('Pro Pack',      '20 hours mixed PS4/PS5',      'ANY', 'ANY',    20, 800, 90),
    ('VIP Pack',      '30 hours PS5 + 5 free drinks','PS5', 'MULTI',  30, 1300, 90)
ON CONFLICT DO NOTHING;

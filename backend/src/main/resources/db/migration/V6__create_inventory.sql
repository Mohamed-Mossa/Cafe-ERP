-- ─── INVENTORY ITEMS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
    id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(150)   NOT NULL,
    unit                 VARCHAR(20)    NOT NULL,
    current_stock        NUMERIC(10,4)  NOT NULL DEFAULT 0,
    reorder_level        NUMERIC(10,4)  NOT NULL DEFAULT 0,
    safety_stock         NUMERIC(10,4)  NOT NULL DEFAULT 0,
    average_cost         NUMERIC(10,4)  NOT NULL DEFAULT 0,
    deleted              BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP      NOT NULL DEFAULT now(),
    created_by           VARCHAR(100)
);
CREATE INDEX idx_inventory_low_stock ON inventory_items(current_stock, reorder_level)
    WHERE deleted = FALSE;

-- ─── STOCK LEDGER (append-only) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_ledger (
    id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id   UUID           NOT NULL REFERENCES inventory_items(id),
    quantity            NUMERIC(10,4)  NOT NULL,
    transaction_type    VARCHAR(20)    NOT NULL,
    reference_id        UUID,
    notes               VARCHAR(200),
    balance_after       NUMERIC(10,4)  NOT NULL,
    created_at          TIMESTAMP      NOT NULL DEFAULT now(),
    created_by          VARCHAR(100)
);
CREATE INDEX idx_ledger_item ON stock_ledger(inventory_item_id);

-- ─── PURCHASES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_purchases (
    id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id   UUID           NOT NULL REFERENCES inventory_items(id),
    item_name           VARCHAR(150)   NOT NULL,
    quantity            NUMERIC(10,4)  NOT NULL,
    unit                VARCHAR(20)    NOT NULL,
    unit_cost           NUMERIC(10,2)  NOT NULL,
    total_cost          NUMERIC(10,2)  NOT NULL,
    supplier_name       VARCHAR(100),
    invoice_number      VARCHAR(50),
    purchase_date       DATE,
    deleted             BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP      NOT NULL DEFAULT now(),
    created_by          VARCHAR(100)
);

-- ─── WASTAGE ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_wastage (
    id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id   UUID           NOT NULL REFERENCES inventory_items(id),
    item_name           VARCHAR(150)   NOT NULL,
    quantity            NUMERIC(10,4)  NOT NULL,
    unit                VARCHAR(20)    NOT NULL,
    reason              VARCHAR(200),
    reported_by         VARCHAR(100),
    deleted             BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP      NOT NULL DEFAULT now(),
    created_by          VARCHAR(100)
);

-- Seed common cafe ingredients
INSERT INTO inventory_items (name, unit, current_stock, reorder_level, safety_stock) VALUES
    ('Coffee Beans', 'g', 5000, 1000, 500),
    ('Full Cream Milk', 'ml', 10000, 2000, 1000),
    ('Sugar', 'g', 3000, 500, 200),
    ('Cocoa Powder', 'g', 2000, 400, 200),
    ('Vanilla Syrup', 'ml', 1500, 300, 150),
    ('Cups (Medium)', 'pcs', 200, 50, 20),
    ('Cups (Large)', 'pcs', 150, 50, 20)
ON CONFLICT DO NOTHING;

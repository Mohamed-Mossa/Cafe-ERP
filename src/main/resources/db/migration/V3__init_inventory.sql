-- ═══════════════════════════════════════════════
-- V3: Inventory Schema
-- ═══════════════════════════════════════════════

CREATE TABLE suppliers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone          VARCHAR(30),
    email          VARCHAR(150),
    address        TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    sku                 VARCHAR(50) UNIQUE,
    category            VARCHAR(50),       -- COFFEE, DAIRY, SUGAR, PACKAGING, CLEANING
    unit                VARCHAR(20) NOT NULL,  -- KG, LITER, PIECE, etc.
    current_stock       NUMERIC(12,4) NOT NULL DEFAULT 0,
    reorder_level       NUMERIC(12,4) NOT NULL DEFAULT 0,
    safety_stock        NUMERIC(12,4) NOT NULL DEFAULT 0,
    average_daily_usage NUMERIC(12,4),
    last_purchase_cost  NUMERIC(10,4),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK now that inventory_items exists
ALTER TABLE recipe_ingredients
    ADD CONSTRAINT fk_recipe_ingredients_item
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id);

-- Stock ledger (APPEND ONLY — event sourcing for stock)
CREATE TABLE stock_ledger (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    type              VARCHAR(20) NOT NULL,   -- IN, OUT, ADJUSTMENT, WASTAGE
    quantity          NUMERIC(12,4) NOT NULL, -- positive = in, negative = out
    reference_id      UUID,                   -- order_id, purchase_id, etc.
    reference_type    VARCHAR(50),            -- ORDER, PURCHASE, ADJUSTMENT, WASTAGE
    unit_cost         NUMERIC(10,4),
    notes             VARCHAR(255),
    performed_by      UUID REFERENCES users(id),
    performed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchases
CREATE TABLE purchases (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id    UUID REFERENCES suppliers(id),
    invoice_number VARCHAR(100),
    purchase_date  DATE NOT NULL,
    total_amount   NUMERIC(12,2),
    notes          TEXT,
    recorded_by    UUID REFERENCES users(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_lines (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id       UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity          NUMERIC(12,4) NOT NULL,
    unit_cost         NUMERIC(10,4) NOT NULL,
    total_cost        NUMERIC(12,2) NOT NULL
);

-- Wastage records
CREATE TABLE wastage_records (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity          NUMERIC(12,4) NOT NULL,
    reason            VARCHAR(50) NOT NULL,    -- EXPIRED, DAMAGED, SPILLED, OTHER
    description       VARCHAR(255),
    cost_value        NUMERIC(10,4),
    reported_by       UUID REFERENCES users(id),
    reported_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock count / physical inventory
CREATE TABLE stock_counts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    system_stock      NUMERIC(12,4) NOT NULL,
    physical_count    NUMERIC(12,4) NOT NULL,
    difference        NUMERIC(12,4) GENERATED ALWAYS AS (physical_count - system_stock) STORED,
    conducted_by      UUID REFERENCES users(id),
    conducted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventory_reorder ON inventory_items(current_stock, reorder_level) 
    WHERE is_active = TRUE;
CREATE INDEX idx_stock_ledger_item ON stock_ledger(inventory_item_id, performed_at DESC);
CREATE INDEX idx_stock_ledger_ref ON stock_ledger(reference_type, reference_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date DESC);

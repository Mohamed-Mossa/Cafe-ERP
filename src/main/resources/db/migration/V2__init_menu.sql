-- ═══════════════════════════════════════════════
-- V2: Menu — Categories, Products, Recipes
-- ═══════════════════════════════════════════════

CREATE TABLE categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    image_url     VARCHAR(500),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id               UUID NOT NULL REFERENCES categories(id),
    name                      VARCHAR(150) NOT NULL,
    sku                       VARCHAR(50) UNIQUE,
    selling_price             NUMERIC(10,2) NOT NULL,
    is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
    is_available_in_match_mode BOOLEAN NOT NULL DEFAULT FALSE,
    display_order             INT NOT NULL DEFAULT 0,
    image_url                 VARCHAR(500),
    -- Computed cost (updated by trigger/service when recipe changes)
    calculated_cost           NUMERIC(10,2),
    profit_margin_percent     NUMERIC(5,2),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE price_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id),
    old_price   NUMERIC(10,2),
    new_price   NUMERIC(10,2) NOT NULL,
    changed_by  UUID REFERENCES users(id),
    reason      VARCHAR(255),
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipes (Bill of Materials)
CREATE TABLE recipes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    yield_quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    yield_unit     VARCHAR(20) NOT NULL DEFAULT 'serving',
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recipe_ingredients (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id         UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL,  -- FK to inventory_items (added in V3)
    quantity          NUMERIC(10,4) NOT NULL,
    unit              VARCHAR(20) NOT NULL,
    notes             VARCHAR(255)
);

-- Seed categories
INSERT INTO categories (name, display_order) VALUES
    ('Hot Drinks',     1),
    ('Cold Drinks',    2),
    ('Desserts',       3),
    ('Sandwiches',     4),
    ('Meals',          5);

-- Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_match_mode ON products(is_available_in_match_mode) WHERE is_available_in_match_mode = TRUE;
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

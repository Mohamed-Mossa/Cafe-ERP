-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    icon          VARCHAR(50),
    display_order INT          NOT NULL DEFAULT 0,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    deleted       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now(),
    created_by    VARCHAR(100)
);

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id                       UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    sku                      VARCHAR(20)    NOT NULL UNIQUE,
    name                     VARCHAR(150)   NOT NULL,
    selling_price            NUMERIC(10, 2) NOT NULL,
    image_url                VARCHAR(500),
    active                   BOOLEAN        NOT NULL DEFAULT TRUE,
    available_in_match_mode  BOOLEAN        NOT NULL DEFAULT FALSE,
    display_order            INT            NOT NULL DEFAULT 0,
    category_id              UUID           NOT NULL REFERENCES categories(id),
    deleted                  BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at               TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at               TIMESTAMP      NOT NULL DEFAULT now(),
    created_by               VARCHAR(100)
);
CREATE INDEX idx_product_category ON products(category_id);
CREATE INDEX idx_product_active   ON products(active) WHERE active = TRUE AND deleted = FALSE;

-- ─── RECIPES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE REFERENCES products(id),
    notes      TEXT,
    deleted    BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by VARCHAR(100)
);

-- ─── RECIPE INGREDIENTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id         UUID           NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID           NOT NULL,
    quantity          NUMERIC(10, 4) NOT NULL,
    unit              VARCHAR(20)    NOT NULL,
    deleted           BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP      NOT NULL DEFAULT now(),
    created_by        VARCHAR(100)
);
CREATE INDEX idx_ingredient_recipe ON recipe_ingredients(recipe_id);

-- ─── PRICE HISTORY ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_history (
    id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID           NOT NULL REFERENCES products(id),
    old_price  NUMERIC(10, 2) NOT NULL,
    new_price  NUMERIC(10, 2) NOT NULL,
    changed_by VARCHAR(100),
    reason     VARCHAR(300),
    changed_at TIMESTAMP      NOT NULL DEFAULT now()
);

-- ─── SEED DATA ───────────────────────────────────────────────────────────────
INSERT INTO categories (name, icon, display_order) VALUES
    ('Hot Drinks',   'coffee',      1),
    ('Cold Drinks',  'cup-soda',    2),
    ('Desserts',     'cake',        3),
    ('Sandwiches',   'sandwich',    4),
    ('PlayStation',  'gamepad-2',   5)
ON CONFLICT DO NOTHING;

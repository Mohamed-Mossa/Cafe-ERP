-- ─── CAFE TABLES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cafe_tables (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(30) NOT NULL UNIQUE,
    capacity         INT         NOT NULL DEFAULT 4,
    status           VARCHAR(15) NOT NULL DEFAULT 'FREE' CHECK (status IN ('FREE','OCCUPIED','BILLING','RESERVED')),
    current_order_id UUID,
    position_x       INT         NOT NULL DEFAULT 0,
    position_y       INT         NOT NULL DEFAULT 0,
    deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP   NOT NULL DEFAULT now(),
    created_by       VARCHAR(100)
);

-- Seed tables
INSERT INTO cafe_tables (name, capacity, position_x, position_y) VALUES
    ('Table 1', 4, 1, 1), ('Table 2', 4, 2, 1), ('Table 3', 2, 3, 1),
    ('Table 4', 6, 1, 2), ('Table 5', 4, 2, 2), ('Table 6', 4, 3, 2),
    ('Table 7', 8, 1, 3), ('Table 8', 4, 2, 3)
ON CONFLICT DO NOTHING;

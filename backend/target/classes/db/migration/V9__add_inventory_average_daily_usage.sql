-- Add average daily usage and is_active flags to inventory items
ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS average_daily_usage NUMERIC(10,4) NOT NULL DEFAULT 0;

ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;


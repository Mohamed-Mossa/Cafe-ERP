-- Add optional category column to inventory items
ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS category VARCHAR(100);


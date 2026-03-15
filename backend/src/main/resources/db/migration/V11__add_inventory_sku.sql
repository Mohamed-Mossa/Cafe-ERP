-- Add optional SKU column to inventory items
ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS sku VARCHAR(100);


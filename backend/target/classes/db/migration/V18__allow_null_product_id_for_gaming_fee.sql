-- Gaming fee order lines have no product (they are auto-generated charges)
-- so product_id must be nullable in order_lines
ALTER TABLE order_lines ALTER COLUMN product_id DROP NOT NULL;

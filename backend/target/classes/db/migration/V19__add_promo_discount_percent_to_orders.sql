-- V19: Add promo discount percent to orders table
ALTER TABLE orders ADD COLUMN promo_discount_percent NUMERIC(5, 2);

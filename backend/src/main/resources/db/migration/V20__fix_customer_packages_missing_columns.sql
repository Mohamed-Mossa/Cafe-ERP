-- V20: Fix customer_packages missing columns that the entity expects.
-- The V15 migration created the table without package_name, device_type, session_type.
ALTER TABLE customer_packages
    ADD COLUMN IF NOT EXISTS package_name  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS device_type   VARCHAR(10),
    ADD COLUMN IF NOT EXISTS session_type  VARCHAR(10);

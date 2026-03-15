-- V16: Add missing auditing and entity columns
-- Fixes: Schema-validation: missing column [created_by] in table [customer_packages]
-- Also fixes customer_packages missing: package_name, device_type, session_type
-- Also fixes expenses missing: created_by

-- ─── customer_packages ────────────────────────────────────────────────────────
ALTER TABLE customer_packages
    ADD COLUMN IF NOT EXISTS created_by    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS package_name  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS device_type   VARCHAR(10),
    ADD COLUMN IF NOT EXISTS session_type  VARCHAR(10);

-- ─── expenses ─────────────────────────────────────────────────────────────────
ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- ─── membership_packages (also extends BaseEntity) ────────────────────────────
ALTER TABLE membership_packages
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- ─── tournaments ──────────────────────────────────────────────────────────────
ALTER TABLE tournaments
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- ─── tournament_players ───────────────────────────────────────────────────────
ALTER TABLE tournament_players
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- ─── expense_categories ───────────────────────────────────────────────────────
ALTER TABLE expense_categories
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted     BOOLEAN NOT NULL DEFAULT FALSE;
-- Add positional coordinates for gaming devices
ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS position_x INT NOT NULL DEFAULT 0;

ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS position_y INT NOT NULL DEFAULT 0;


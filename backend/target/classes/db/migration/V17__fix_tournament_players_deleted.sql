-- V17: Add missing deleted column to tournament_players
ALTER TABLE tournament_players
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
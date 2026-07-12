-- AlterTable
ALTER TABLE "user" ALTER COLUMN "timezone" SET DEFAULT 'America/Bogota';

-- Backfill rows still holding the old short timezone codes with real IANA identifiers
UPDATE "user" SET "timezone" = 'America/New_York' WHERE "timezone" = 'est';
UPDATE "user" SET "timezone" = 'America/Chicago' WHERE "timezone" = 'cst';
UPDATE "user" SET "timezone" = 'America/Denver' WHERE "timezone" = 'mst';
UPDATE "user" SET "timezone" = 'America/Los_Angeles' WHERE "timezone" = 'pst';

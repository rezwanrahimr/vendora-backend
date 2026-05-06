-- Backfill missing phone numbers before enforcing NOT NULL
UPDATE "User"
SET "phone" = CONCAT('missing-', "id")
WHERE "phone" IS NULL;

-- Enforce required mobile number on user records
ALTER TABLE "User"
ALTER COLUMN "phone" SET NOT NULL;

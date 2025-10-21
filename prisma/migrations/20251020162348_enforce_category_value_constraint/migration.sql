-- Make value column NOT NULL (it should already have values from seed)
-- First, update any null values (shouldn't be any after seed, but just in case)
UPDATE "categories" SET "value" = lower(replace(replace(replace("name", '/', '_'), ' ', '_'), '&', 'and')) WHERE "value" IS NULL;

-- AlterTable - Make value non-nullable
ALTER TABLE "categories" ALTER COLUMN "value" SET NOT NULL;

-- CreateIndex - Add unique constraint
CREATE UNIQUE INDEX "categories_userId_value_type_key" ON "categories"("userId", "value", "type");

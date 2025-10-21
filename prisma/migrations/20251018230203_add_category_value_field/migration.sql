-- DropIndex
DROP INDEX "public"."categories_userId_name_type_key";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "value" TEXT;

-- CreateIndex
CREATE INDEX "categories_value_idx" ON "categories"("value");

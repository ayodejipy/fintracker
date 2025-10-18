-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "commission" DECIMAL(10,2),
ADD COLUMN     "confidence" TEXT,
ADD COLUMN     "feeNote" TEXT,
ADD COLUMN     "flags" TEXT,
ADD COLUMN     "importSource" TEXT,
ADD COLUMN     "isImported" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDesc" TEXT,
ADD COLUMN     "otherFees" DECIMAL(10,2),
ADD COLUMN     "processingFee" DECIMAL(10,2),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "serviceFee" DECIMAL(10,2),
ADD COLUMN     "stampDuty" DECIMAL(10,2),
ADD COLUMN     "transferFee" DECIMAL(10,2),
ADD COLUMN     "userNote" TEXT,
ADD COLUMN     "vat" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 999,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_userId_idx" ON "categories"("userId");

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateIndex
CREATE INDEX "categories_isSystem_idx" ON "categories"("isSystem");

-- CreateIndex
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "categories_userId_name_type_key" ON "categories"("userId", "name", "type");

-- CreateIndex
CREATE INDEX "transactions_isImported_idx" ON "transactions"("isImported");

-- CreateIndex
CREATE INDEX "transactions_needsReview_idx" ON "transactions"("needsReview");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

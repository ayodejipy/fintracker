/*
  Warnings:

  - Added the required column `updatedAt` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringExpenseId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "transactions_isRecurring_idx" ON "transactions"("isRecurring");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurringExpenseId_fkey" FOREIGN KEY ("recurringExpenseId") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

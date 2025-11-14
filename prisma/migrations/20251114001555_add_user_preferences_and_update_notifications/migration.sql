/*
  Warnings:

  - You are about to drop the column `budgetAlerts` on the `notification_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `emailNotifications` on the `notification_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `goalAchievements` on the `notification_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `paymentReminders` on the `notification_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `pushNotifications` on the `notification_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `savingsReminders` on the `notification_preferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notification_preferences" DROP COLUMN "budgetAlerts",
DROP COLUMN "emailNotifications",
DROP COLUMN "goalAchievements",
DROP COLUMN "paymentReminders",
DROP COLUMN "pushNotifications",
DROP COLUMN "savingsReminders",
ADD COLUMN     "emailBudgetAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailGoalReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailMonthlyReports" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailWeeklyReports" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pushBudgetAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pushGoalReminders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pushMonthlyReports" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pushSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushWeeklyReports" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT NOT NULL DEFAULT 'en-NG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

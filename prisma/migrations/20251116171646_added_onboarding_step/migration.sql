-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';

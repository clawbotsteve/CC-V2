/*
  Warnings:

  - A unique constraint covering the columns `[posthogId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "featuresUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "firstSeenAt" TIMESTAMP(3),
ADD COLUMN     "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "lastFeatureUsed" TEXT DEFAULT '',
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingStartedAt" TIMESTAMP(3),
ADD COLUMN     "posthogId" TEXT,
ADD COLUMN     "referredBy" TEXT DEFAULT '',
ADD COLUMN     "totalLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSessions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "utmCampaign" TEXT DEFAULT '',
ADD COLUMN     "utmMedium" TEXT DEFAULT '',
ADD COLUMN     "utmSource" TEXT DEFAULT '',
ALTER COLUMN "name" SET DEFAULT '',
ALTER COLUMN "imageUrl" SET DEFAULT '',
ALTER COLUMN "referralCode" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "User_posthogId_key" ON "User"("posthogId");

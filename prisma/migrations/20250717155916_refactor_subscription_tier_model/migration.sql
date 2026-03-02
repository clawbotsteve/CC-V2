/*
  Warnings:

  - You are about to drop the column `devPriceMonthlyId` on the `SubscriptionTier` table. All the data in the column will be lost.
  - You are about to drop the column `devPriceYearlyId` on the `SubscriptionTier` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerMonth` on the `SubscriptionTier` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceMonthlyId` on the `SubscriptionTier` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceYearlyId` on the `SubscriptionTier` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('weekly', 'monthly', 'three_months', 'half_yearly', 'yearly', 'two_years', 'three_years');

-- AlterTable
ALTER TABLE "SubscriptionTier" DROP COLUMN "devPriceMonthlyId",
DROP COLUMN "devPriceYearlyId",
DROP COLUMN "pricePerMonth",
DROP COLUMN "stripePriceMonthlyId",
DROP COLUMN "stripePriceYearlyId",
ADD COLUMN     "devPriceId" TEXT DEFAULT '',
ADD COLUMN     "period" "BillingPeriod" NOT NULL DEFAULT 'monthly',
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
ADD COLUMN     "stripePriceId" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "ToolCreditCost" ALTER COLUMN "creditCost" SET DATA TYPE DOUBLE PRECISION;

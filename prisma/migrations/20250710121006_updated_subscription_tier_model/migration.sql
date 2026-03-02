-- AlterTable
ALTER TABLE "SubscriptionTier" ADD COLUMN     "devPriceMonthlyId" TEXT DEFAULT '',
ADD COLUMN     "devPriceYearlyId" TEXT DEFAULT '',
ADD COLUMN     "stripePriceMonthlyId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "stripePriceYearlyId" TEXT DEFAULT '';

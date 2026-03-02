-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('active', 'archived');

-- DropIndex
DROP INDEX "SubscriptionTier_tier_key";

-- AlterTable
ALTER TABLE "SubscriptionTier" ADD COLUMN     "status" "PlanStatus" NOT NULL DEFAULT 'active';

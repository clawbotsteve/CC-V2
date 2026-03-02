-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired');

-- AlterTable
ALTER TABLE "UserSubscription" ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'active';

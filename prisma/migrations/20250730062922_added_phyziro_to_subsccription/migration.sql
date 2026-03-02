-- AlterTable
ALTER TABLE "SubscriptionTier" ADD COLUMN     "phyziroPriceId" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "UserSubscription" ADD COLUMN     "phyziro_subscription_id" TEXT;

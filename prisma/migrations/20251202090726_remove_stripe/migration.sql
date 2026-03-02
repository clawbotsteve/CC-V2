/*
  Warnings:

  - You are about to rename columns from Stripe to Phyziro equivalents
  - The column `stripe_customer_id` on the `UserSubscription` table will be dropped (no Phyziro equivalent)
  - A unique constraint covering the columns `[phyziroId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Transaction_stripeId_key";

-- DropIndex
DROP INDEX "public"."UserSubscription_stripe_customer_id_key";

-- DropIndex
DROP INDEX "public"."UserSubscription_stripe_subscription_id_key";

-- AlterTable: Lora - RENAME to preserve data
ALTER TABLE "public"."Lora" 
RENAME COLUMN "stripePriceId" TO "phyziroPriceId";

-- AlterTable
ALTER TABLE "public"."SubscriptionTier" DROP COLUMN "stripePriceId";

-- AlterTable: Transaction - RENAME to preserve data
ALTER TABLE "public"."Transaction" 
RENAME COLUMN "stripeId" TO "phyziroId";

-- AlterTable: UserApiLimit - Add new column
ALTER TABLE "public"."UserApiLimit" 
ADD COLUMN "monthlyRemainingCredits" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: UserSubscription - RENAME to preserve data, DROP customer_id
ALTER TABLE "public"."UserSubscription" 
DROP COLUMN "stripe_customer_id";

ALTER TABLE "public"."UserSubscription"
DROP COLUMN "stripe_subscription_id";

ALTER TABLE "public"."UserSubscription"
RENAME COLUMN "stripe_current_period_end" TO "phyziro_current_period_end";

ALTER TABLE "public"."UserSubscription"
RENAME COLUMN "stripe_price_id" TO "phyziro_price_id";

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_phyziroId_key" ON "public"."Transaction"("phyziroId");

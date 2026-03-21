-- Add Stripe-native columns while keeping legacy phyziro_* columns for backward compatibility.
ALTER TABLE "UserSubscription"
  ADD COLUMN "stripe_price_id" TEXT,
  ADD COLUMN "stripe_current_period_end" TIMESTAMP(3),
  ADD COLUMN "stripe_subscription_id" TEXT;

CREATE INDEX "UserSubscription_stripe_subscription_id_idx"
  ON "UserSubscription"("stripe_subscription_id");

-- Backfill existing rows from legacy columns.
UPDATE "UserSubscription"
SET
  "stripe_price_id" = "phyziro_price_id",
  "stripe_current_period_end" = "phyziro_current_period_end",
  "stripe_subscription_id" = "phyziro_subscription_id"
WHERE
  "stripe_price_id" IS NULL
  AND "stripe_current_period_end" IS NULL
  AND "stripe_subscription_id" IS NULL;

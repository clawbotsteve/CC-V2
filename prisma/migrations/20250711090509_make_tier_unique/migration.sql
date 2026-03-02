/*
  Warnings:

  - A unique constraint covering the columns `[tier]` on the table `SubscriptionTier` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionTier_tier_key" ON "SubscriptionTier"("tier");

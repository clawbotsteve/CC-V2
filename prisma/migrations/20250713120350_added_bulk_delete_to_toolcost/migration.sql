-- DropForeignKey
ALTER TABLE "ToolCreditCost" DROP CONSTRAINT "ToolCreditCost_tierId_fkey";

-- AddForeignKey
ALTER TABLE "ToolCreditCost" ADD CONSTRAINT "ToolCreditCost_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reduce free plan monthly credits from 3 to 1 (single trial generation,
-- then upgrade paywall). Mirrors the prior 5→3 migration pattern.

-- 1) Update the Free subscription tier definition.
UPDATE "SubscriptionTier"
SET
  "creditsPerMonth" = 1,
  "updatedAt" = NOW()
WHERE "tier" = 'plan_free';

-- 2) Rebalance existing free users so they sit at the new monthly cap of 1
--    while preserving any non-monthly carry-over (e.g. credits purchased via
--    credit packs).
WITH free_users AS (
  SELECT us."userId"
  FROM "UserSubscription" us
  JOIN "SubscriptionTier" st ON st."id" = us."planId"
  WHERE st."tier" = 'plan_free'
),
recalc AS (
  SELECT
    ul."userId",
    GREATEST(COALESCE(ul."availableCredit", 0) - COALESCE(ul."monthlyRemainingCredits", 0), 0) AS carry_over
  FROM "UserApiLimit" ul
  JOIN free_users fu ON fu."userId" = ul."userId"
)
UPDATE "UserApiLimit" ul
SET
  "monthlyRemainingCredits" = 1,
  "availableCredit" = recalc.carry_over + 1,
  "updatedAt" = NOW()
FROM recalc
WHERE ul."userId" = recalc."userId";

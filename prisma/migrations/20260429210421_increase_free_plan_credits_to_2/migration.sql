-- Bump free plan monthly credits from 1 to 2 so the GPT Image 2 trial
-- still works after medium-quality moves from 1 → 2 credits in the same
-- release. Mirrors the prior 5→3 and 3→1 migration patterns.

-- 1) Update the Free subscription tier definition.
UPDATE "SubscriptionTier"
SET
  "creditsPerMonth" = 2,
  "updatedAt" = NOW()
WHERE "tier" = 'plan_free';

-- 2) Rebalance existing free users so they sit at the new monthly cap of 2
--    while preserving any non-monthly carry-over (credit packs, etc.).
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
  "monthlyRemainingCredits" = 2,
  "availableCredit" = recalc.carry_over + 2,
  "updatedAt" = NOW()
FROM recalc
WHERE ul."userId" = recalc."userId";

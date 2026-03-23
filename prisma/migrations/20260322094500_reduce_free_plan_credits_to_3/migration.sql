-- Reduce free plan monthly credits from 5 to 3 and backfill existing free users safely.

-- 1) Ensure the free subscription tier is updated.
UPDATE "SubscriptionTier"
SET
  "creditsPerMonth" = 3,
  "updatedAt" = NOW()
WHERE "tier" = 'plan_free';

-- 2) Align free users' monthlyRemainingCredits to 3 and preserve any non-monthly carry-over.
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
  "monthlyRemainingCredits" = 3,
  "availableCredit" = recalc.carry_over + 3,
  "updatedAt" = NOW()
FROM recalc
WHERE ul."userId" = recalc."userId";

-- ============================================
-- RETOOL AFFILIATE DASHBOARD QUERIES
-- ============================================

-- -----------------------------------------------
-- 1. ALL AFFILIATES OVERVIEW
-- Use in: Main affiliates table
-- -----------------------------------------------
SELECT
  a."id",
  a."userId",
  a."affiliateCode",
  a."commissionType",
  a."commissionRate",
  a."status",
  a."payoutMethod",
  a."payoutEmail",
  a."totalEarnings",
  a."totalPaidOut",
  a."pendingBalance",
  a."minimumPayout",
  a."notes",
  a."createdAt",
  u."name" AS user_name,
  u."email" AS user_email,
  COUNT(r."id") AS total_referrals,
  COUNT(CASE WHEN r."event" = 'subscription' THEN 1 END) AS conversions
FROM "Affiliate" a
LEFT JOIN "User" u ON u."userId" = a."userId"
LEFT JOIN "Referral" r ON r."referralCode" = a."affiliateCode"
GROUP BY a."id", u."name", u."email"
ORDER BY a."totalEarnings" DESC;


-- -----------------------------------------------
-- 2. SINGLE AFFILIATE DETAIL
-- Use in: Detail panel when clicking a row
-- Param: {{ affiliateTable.selectedRow.affiliateCode }}
-- -----------------------------------------------
SELECT
  r."id",
  r."referredUserId",
  r."event",
  r."planId",
  r."createdAt" AS referral_date,
  u."name" AS referred_user_name,
  u."email" AS referred_user_email,
  rr."referrerReward" / 100.0 AS commission_dollars,
  rr."refereeReward" AS credits_given
FROM "Referral" r
LEFT JOIN "User" u ON u."userId" = r."referredUserId"
LEFT JOIN "ReferralReward" rr ON rr."referralId" = r."id"
WHERE r."referralCode" = {{ affiliateCodeInput.value }}
ORDER BY r."createdAt" DESC;


-- -----------------------------------------------
-- 3. PENDING PAYOUTS
-- Use in: Payouts tab
-- -----------------------------------------------
SELECT
  ap."id",
  ap."affiliateId",
  a."affiliateCode",
  a."userId",
  u."name" AS affiliate_name,
  u."email" AS affiliate_email,
  a."payoutEmail",
  ap."amount",
  ap."status",
  ap."payoutMethod",
  ap."notes",
  ap."createdAt" AS requested_at,
  ap."processedAt"
FROM "AffiliatePayout" ap
JOIN "Affiliate" a ON a."id" = ap."affiliateId"
LEFT JOIN "User" u ON u."userId" = a."userId"
ORDER BY
  CASE ap."status"
    WHEN 'pending' THEN 1
    WHEN 'processing' THEN 2
    WHEN 'completed' THEN 3
    WHEN 'failed' THEN 4
  END,
  ap."createdAt" ASC;


-- -----------------------------------------------
-- 4. CREATE NEW AFFILIATE
-- Use in: "Add Affiliate" form button
-- Params: {{ userIdInput.value }}, {{ commissionTypeSelect.value }},
--         {{ commissionRateInput.value }}, {{ payoutMethodSelect.value }},
--         {{ payoutEmailInput.value }}, {{ notesInput.value }}
-- NOTE: Prefer using the API endpoint POST /api/admin/affiliate
--       as it auto-generates the affiliate code.
-- -----------------------------------------------
-- Via API (recommended — paste into Retool REST query):
-- POST {{BASE_URL}}/api/admin/affiliate
-- Body:
-- {
--   "userId": {{ userIdInput.value }},
--   "commissionType": {{ commissionTypeSelect.value }},
--   "commissionRate": {{ commissionRateInput.value }},
--   "payoutMethod": {{ payoutMethodSelect.value }},
--   "payoutEmail": {{ payoutEmailInput.value }},
--   "notes": {{ notesInput.value }}
-- }


-- -----------------------------------------------
-- 5. UPDATE AFFILIATE SETTINGS
-- Use in: Edit affiliate modal/form
-- -----------------------------------------------
UPDATE "Affiliate"
SET
  "commissionType" = {{ commissionTypeSelect.value }},
  "commissionRate" = {{ commissionRateInput.value }},
  "status" = {{ statusSelect.value }},
  "payoutMethod" = {{ payoutMethodSelect.value }},
  "payoutEmail" = {{ payoutEmailInput.value }},
  "minimumPayout" = {{ minimumPayoutInput.value }},
  "notes" = {{ notesInput.value }},
  "updatedAt" = NOW()
WHERE "id" = {{ affiliateTable.selectedRow.id }};


-- -----------------------------------------------
-- 6. MARK PAYOUT AS COMPLETED
-- Use in: "Approve Payout" button
-- -----------------------------------------------
-- Step 1: Update payout status
UPDATE "AffiliatePayout"
SET
  "status" = 'completed',
  "processedAt" = NOW(),
  "notes" = {{ payoutNotesInput.value }},
  "updatedAt" = NOW()
WHERE "id" = {{ payoutTable.selectedRow.id }};

-- Step 2: Update affiliate balances (run after step 1)
UPDATE "Affiliate"
SET
  "totalPaidOut" = "totalPaidOut" + {{ payoutTable.selectedRow.amount }},
  "pendingBalance" = "pendingBalance" - {{ payoutTable.selectedRow.amount }},
  "updatedAt" = NOW()
WHERE "id" = {{ payoutTable.selectedRow.affiliateId }};

-- NOTE: Or use the API endpoint PATCH /api/admin/affiliate/payout
-- which handles both steps atomically:
-- { "payoutId": "...", "status": "completed", "notes": "Paid via PayPal" }


-- -----------------------------------------------
-- 7. REJECT/FAIL PAYOUT
-- Use in: "Reject Payout" button
-- -----------------------------------------------
UPDATE "AffiliatePayout"
SET
  "status" = 'failed',
  "notes" = {{ rejectReasonInput.value }},
  "updatedAt" = NOW()
WHERE "id" = {{ payoutTable.selectedRow.id }};


-- -----------------------------------------------
-- 8. MONTHLY AFFILIATE PERFORMANCE SUMMARY
-- Use in: Dashboard stats/chart
-- -----------------------------------------------
SELECT
  DATE_TRUNC('month', r."createdAt") AS month,
  COUNT(r."id") AS total_conversions,
  SUM(rr."referrerReward") / 100.0 AS total_commission_paid,
  COUNT(DISTINCT r."refereeId") AS active_affiliates
FROM "Referral" r
LEFT JOIN "ReferralReward" rr ON rr."referralId" = r."id"
WHERE r."event" = 'subscription'
GROUP BY DATE_TRUNC('month', r."createdAt")
ORDER BY month DESC
LIMIT 12;


-- -----------------------------------------------
-- 9. TOP AFFILIATES (LEADERBOARD)
-- Use in: Dashboard leaderboard widget
-- -----------------------------------------------
SELECT
  a."affiliateCode",
  u."name" AS affiliate_name,
  u."email" AS affiliate_email,
  a."commissionRate",
  a."commissionType",
  a."totalEarnings",
  a."pendingBalance",
  COUNT(r."id") AS total_conversions
FROM "Affiliate" a
LEFT JOIN "User" u ON u."userId" = a."userId"
LEFT JOIN "Referral" r ON r."referralCode" = a."affiliateCode" AND r."event" = 'subscription'
WHERE a."status" = 'active'
GROUP BY a."id", u."name", u."email"
ORDER BY a."totalEarnings" DESC
LIMIT 10;

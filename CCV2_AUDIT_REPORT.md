# TraviaLabs (CC-V2) Full Codebase Audit Report

**Date:** March 8, 2026
**Branch:** `staging`
**Last commit:** `13759b6` — feat(landing): make discovery page default with Clerk modal CTAs

---

## 1. Phase 1 — TypeScript & Build Status

**`npx tsc --noEmit` — PASSED (zero errors)**

The codebase compiles clean. No type errors remain. The build script (`prisma generate && next build`) is correctly configured to avoid running migrations during build, which was a previous Railway failure point.

---

## 2. Landing Page & Middleware Auth — Issues Found

### Current State (Uncommitted Changes)

The working tree has two uncommitted modifications:

**`app/(landing)/page.tsx`** — Changed from a full discovery/marketing page (with Clerk sign-in CTAs) to a simple server-side redirect to `/dashboard`.

**`middleware.ts`** — Removed `/dashboard(.*)` from the `isProtectedRoute` matcher, making `/dashboard` accessible without auth.

### Analysis & Decision Needed

These two changes work together to create a **"dashboard-first" experience** — every visitor immediately lands on the dashboard page. Here's the tradeoff:

**Current behavior (uncommitted):**
- `/` redirects to `/dashboard` (no landing page)
- `/dashboard` is NOT auth-protected — anyone can view it
- `/tools/*` and `/settings/*` still require auth
- The dashboard page itself is a rich marketing/showcase page with tools, pricing, and CTAs

**Previous behavior (committed):**
- `/` showed a discovery page with "Create your first image" and "Login" buttons using Clerk modal
- `/dashboard` required authentication

**RECOMMENDATION:** The current uncommitted version is actually well-designed for launch. The "dashboard" page is really a combined marketing + discovery page, and keeping it publicly accessible makes sense. However, there is one concern:

> **BUG:** The dashboard page links directly to `/tools/image-generation`, `/tools/video-generation`, etc. These ARE auth-protected. A signed-out user clicking these links will be redirected to `/sign-in`. This is actually correct behavior — but the redirect message should be clear about why they need to sign in. Verify that the sign-in page communicates this well.

> **TYPO on dashboard page, line 176:** "Build AI influncers" should be "Build AI influencers"

> **BRANDING inconsistency:** The footer says "Tavira Labs" and copyright "2026 Tavira Labs" but the product is called "TraviaLabs" in other places. The email in the batch generation section references `team@taviralabs.ai`. Settle on one spelling.

---

## 3. Plan Gating & Credit Logic Audit

### Plan Name Mismatch — CRITICAL

There are **two different naming systems** for plans across the codebase, which could cause silent failures:

**`constants.ts` (used by frontend):**
- `plan_free`, `plan_starter_trial`, `plan_starter`, `plan_creator`, `plan_studio`
- Prices: Free / $19.99 / $49.99 / $149.99

**`constants/pricing-constants.ts` (used by DB seeding/backend):**
- `plan_free`, `plan_basic`, `plan_basic_3month`, `plan_pro`, `plan_pro_3month`, `plan_elite`, `plan_elite_3month`
- Prices: Free / $29.95 / $69.99 / $129.99

**`lib/plan-access.ts` resolveAccessTier():**
- Maps `elite`/`studio` → "studio"
- Maps `pro`/`creator` → "creator"
- Maps `basic`/`starter` → "starter"

This mapping bridges both naming systems, but it means:

1. **Price mismatch:** `constants.ts` says Starter is $19.99, but `pricing-constants.ts` says Basic (same tier) is $29.95. Which is correct for production?
2. **Credit mismatch:** `constants.ts` says Starter gets 200 credits, but `pricing-constants.ts` says Basic gets 300 credits.
3. **Stripe Price IDs in `constants.ts` are placeholders:** Values like `"price_starter_prod"` are NOT real Stripe IDs — these need to be replaced with actual Stripe/Phyziro price IDs before launch.

**ACTION REQUIRED:** Decide which set of plan names, prices, and credit amounts is canonical, then reconcile. The `pricing-constants.ts` file has real Phyziro price IDs wired up — that appears to be the production source of truth.

### Plan Access Matrix — Correct

The `plan-access.ts` logic is sound:

| Tool/Model | Free | Starter | Creator | Studio |
|---|---|---|---|---|
| Nano Banana Pro | Yes | Yes | Yes | Yes |
| Nano Banana 2 | No | Yes | Yes | Yes |
| Nano Banana 2 Edit | No | No | Yes | Yes |
| Soul 2 | No | No | No | Yes |
| Video (any) | No | Yes | Yes | Yes |
| Video (Kling only) | — | Yes | Yes | Yes |
| Video (Veo) | — | — | — | Yes |
| Upscale (Topaz) | No | Yes | Yes | Yes |
| Upscale (other) | No | No | Yes | Yes |

### Credit Cost Fallback Logic — Works but Duplicated

`get-credit-cost.ts` has the same fallback switch/case block duplicated twice (lines 48-103 and lines 123-186). If the DB lookup fails, it falls back to constants. This works but is a maintenance risk — if you update costs in one block, you must update both.

**RECOMMENDATION:** Extract the fallback logic into a single helper function called from both places.

### Free Tier Credit Check — Development Bypass Concern

In `check-available-credit.ts`:
- If `NODE_ENV === "development"`, credit checks are bypassed (`canUse: true`)
- If a DB table is missing, it also bypasses

This is fine for dev, but **verify that Railway production has `NODE_ENV=production` set explicitly.** If it defaults to development, all credit checks are bypassed in production.

---

## 4. Route Handler Audit

### Image Route (`/api/tools/image`)

- Auth check: Present and correct
- Plan gating: Uses `resolveAccessTier` + `canUseImageModel` — correct
- Credit check: Present with fallback
- DB writes: Wrapped in try/catch with degraded-mode support
- **Potential issue:** The GET handler does opportunistic provider sync (polling Fal for stuck jobs). This iterates over ALL user images and tries ALL endpoints for each stuck one. This could be slow for users with many images and may hit Fal rate limits.

### Video Route (`/api/tools/video`)

- Auth, plan gating, credit check: All present and correct
- Validation: Checks for prompt, image_url, and video_url (for motion control)
- **Note:** The `adherence` field defaults to 0 when model isn't "wan", and `duration` defaults to `data.duration!` with a non-null assertion. If duration is undefined for non-Wan models, this could throw.

### Upscale Route (`/api/tools/upscale`)

- Auth, plan gating, credit check: All present and correct
- Handles both image and video upscale paths

### User Info Route (`/api/user/info`)

- Has a solid fallback pattern: if anything fails, returns a degraded response with `meta.degraded: true`
- Calls `getOrAssignSubscription` which auto-creates a free plan subscription if none exists
- The `getPlanIdByTier` function self-heals missing free plan records — good defensive coding

---

## 5. Railway Deployment Configuration

### Environment Variables Needed

For **each** Railway environment (staging + production), set:

**Required — Auth:**
- `CLERK_SECRET_KEY` — Clerk backend key (different for staging vs prod)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk frontend key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`

**Required — Database:**
- `DATABASE_URL` — From Railway Postgres reference variable

**Required — App:**
- `NODE_ENV=production` (**CRITICAL** — without this, credit checks are bypassed)
- `NEXT_PUBLIC_APP_URL` — Your deployed URL (e.g., `https://staging.travialabs.ai`)
- `APP_URL` — Same as above (some internal calls use this)

**Required — AI Providers:**
- `FAL_KEY` — Fal.ai API key
- `FAL_API_KEY` — Same key (your .env has both; check which the code actually reads)
- `OPENAI_API_KEY`
- `REPLICATE_API_TOKEN`
- `HIGGSFIELD_BASE_URL`
- `HIGGSFIELD_API_KEY`

**Required — Billing:**
- `STRIPE_API_KEY` (or Phyziro equivalent)
- `STRIPE_WEBHOOK_SECRET`

**Note:** Your `.env` has `HIGGSFIELD_BASE_URL` defined twice — remove the duplicate.

### Build & Deploy Commands

**Build command:** `prisma generate && next build` (already correct in package.json)

**Start command:** `npx prisma migrate deploy && npx prisma db seed && next start`
**WARNING:** Running `db seed` on every start could be slow or cause issues if seeds aren't idempotent. Consider running migrations and seeds as a one-time release command instead.

### Post-Deploy Steps

1. Run migrations separately: `npx prisma migrate deploy`
2. Seed if this is the first deploy: `npx prisma db seed`
3. Verify health: Check `/api/user/info` returns valid JSON
4. Verify webhook endpoints are reachable from Clerk and your payment provider

---

## 6. Additional Issues Found

### Duplicate FAL_KEY env vars
Both `FAL_KEY` and `FAL_API_KEY` are in `.env`. Fal's SDK typically reads `FAL_KEY`. Check which one is actually used and remove the other.

### Dashboard Pricing vs Actual Pricing
The dashboard page hardcodes pricing plans (Free/$0, Starter/$19.99, Creator/$49.99, Studio/$149.99) but `pricing-constants.ts` uses different names and prices (Basic/$29.95, Pro/$69.99, Elite/$129.99). The user-facing dashboard is the most important — but whichever you pick, the backend must match.

### Stripe Price IDs are Placeholders
In `constants.ts`, the `planToPriceId` map uses placeholders like `"price_starter_prod"`. Meanwhile, `pricing-constants.ts` has what appear to be real Phyziro/Stripe price IDs. These need to be reconciled before payment flows will work.

### WAN Video References Still Present
The launch plan says "WAN removed where requested," but `get-credit-cost.ts` still has `wan_720p` variants with costs defined, and the video route still checks for model === "wan". If WAN is fully deprecated, clean up these references to avoid confusion.

### Start Script Runs Migrations + Seed on Every Boot
The `start` script in `package.json` runs `npx prisma migrate deploy && npx prisma db seed && next start`. This means every cold start or restart runs migrations and seeds. This is risky for production — migrations should be a release step, not a start step.

---

## 7. Recommended Next Steps (Priority Order)

1. **Reconcile plan naming and pricing** between `constants.ts` and `pricing-constants.ts` — decide on one canonical source
2. **Replace placeholder Stripe/Phyziro price IDs** in whichever constants file you keep
3. **Fix the typo** "influncers" → "influencers" on the dashboard page
4. **Standardize branding** — "TraviaLabs" vs "Tavira Labs"
5. **Commit the landing/middleware changes** once you're happy with the dashboard-first approach
6. **Set `NODE_ENV=production`** on Railway (both staging and prod)
7. **Separate migrations from start command** — move to a Railway release command
8. **Extract duplicate credit fallback logic** in `get-credit-cost.ts`
9. **Push to staging, smoke test, then promote to main**

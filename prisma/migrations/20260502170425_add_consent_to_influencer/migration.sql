-- Per-job likeness consent for avatar/influencer training. Captured at
-- submission time. New trainings created on/after 2026-05-02 are
-- REQUIRED to set consentAccepted=true; existing rows keep the
-- defaults (false / null timestamp / null version) for backward-compat
-- audit trail.

ALTER TABLE "Influencer" ADD COLUMN "consentAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Influencer" ADD COLUMN "consentAcceptedAt" TIMESTAMP(3);
ALTER TABLE "Influencer" ADD COLUMN "consentTermsVersion" TEXT;

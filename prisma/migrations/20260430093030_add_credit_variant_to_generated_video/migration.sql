-- Add a creditVariant column for the credit-cost lookup key
-- (e.g. "standard_5s", "kling_audio_10s", "seedance_v2_ref_5s").
-- Same pattern as the GeneratedImage migration from earlier today.
-- Optional / nullable for backward-compat with rows created before this
-- migration. The webhook + chargeUserForTool fall back to the legacy
-- `variant` enum if creditVariant is null.

ALTER TABLE "GeneratedVideo" ADD COLUMN "creditVariant" TEXT;

-- Add a creditVariant column for the credit-cost lookup key
-- (e.g. "gpt_image_2_medium", "nano_banana_2_1k"). Distinct from
-- `variant` which is the sfw/nsfw content classification.
--
-- Optional / nullable for backward-compat with rows created before this
-- migration. The webhook + chargeUserForTool fall back to the legacy
-- `variant` enum if creditVariant is null.

ALTER TABLE "GeneratedImage" ADD COLUMN "creditVariant" TEXT;

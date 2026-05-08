-- Character Studio fields on Influencer. The guided wizard creates an
-- Influencer the same way the legacy direct-upload flow does, but with
-- additional metadata captured during the multi-step setup. All columns
-- are nullable / defaulted so existing rows aren't affected.

ALTER TABLE "Influencer" ADD COLUMN "niche" TEXT;
ALTER TABLE "Influencer" ADD COLUMN "characterStudioCharType" TEXT;
ALTER TABLE "Influencer" ADD COLUMN "characterStudioBrand" TEXT;
ALTER TABLE "Influencer" ADD COLUMN "characterStudioProduct" TEXT;
ALTER TABLE "Influencer" ADD COLUMN "characterStudioRef" TEXT;
ALTER TABLE "Influencer" ADD COLUMN "characterStudioVariations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Influencer" ADD COLUMN "characterStudioPromptPack" JSONB;
ALTER TABLE "Influencer" ADD COLUMN "characterStudioStep" TEXT;

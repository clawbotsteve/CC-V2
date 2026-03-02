-- AlterTable
ALTER TABLE "public"."FaceEnhance" ADD COLUMN     "reason" JSONB;

-- AlterTable
ALTER TABLE "public"."FaceSwap" ADD COLUMN     "reason" JSONB;

-- AlterTable
ALTER TABLE "public"."GeneratedImage" ADD COLUMN     "reason" JSONB;

-- AlterTable
ALTER TABLE "public"."GeneratedVideo" ADD COLUMN     "reason" JSONB;

-- AlterTable
ALTER TABLE "public"."ImageAnalysis" ADD COLUMN     "reason" JSONB;

-- AlterTable
ALTER TABLE "public"."ImageEdit" ADD COLUMN     "reason" JSONB;

-- AlterTable
ALTER TABLE "public"."Upscaled" ADD COLUMN     "reason" JSONB;

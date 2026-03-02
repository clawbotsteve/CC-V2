-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('sfw', 'nsfw');

-- CreateEnum
CREATE TYPE "ImageVariant" AS ENUM ('sfw', 'nsfw');

-- CreateEnum
CREATE TYPE "VideoVariant" AS ENUM ('standard_5s', 'nsfw_5s', 'standard_10s', 'nsfw_10s', 'wan_720p');

-- AlterTable
ALTER TABLE "FaceSwap" ADD COLUMN     "nsfwFlag" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GeneratedImage" ADD COLUMN     "contentType" "ContentType" NOT NULL DEFAULT 'nsfw',
ADD COLUMN     "nsfwFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "variant" "ImageVariant" NOT NULL DEFAULT 'nsfw';

-- AlterTable
ALTER TABLE "GeneratedVideo" ADD COLUMN     "contentType" "ContentType" NOT NULL DEFAULT 'nsfw',
ADD COLUMN     "nsfwFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "variant" "VideoVariant" NOT NULL DEFAULT 'wan_720p';

-- AlterTable
ALTER TABLE "ImageAnalysis" ADD COLUMN     "nsfwFlag" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ImageEdit" ADD COLUMN     "nsfwFlag" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Upscaled" ADD COLUMN     "nsfwFlag" BOOLEAN NOT NULL DEFAULT false;

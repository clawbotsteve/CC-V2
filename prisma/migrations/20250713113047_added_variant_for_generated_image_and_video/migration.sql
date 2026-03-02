-- CreateEnum
CREATE TYPE "ImageGenerationVariant" AS ENUM ('standard', 'nsfw');

-- CreateEnum
CREATE TYPE "VideoGenerationVariant" AS ENUM ('standard_5s', 'nsfw_5s', 'standard_10s', 'nsfw_10s', 'standard_15s', 'nsfw_15s', 'wan_720p');

-- AlterTable
ALTER TABLE "GeneratedImage" ADD COLUMN     "variant" "ImageGenerationVariant" NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE "GeneratedVideo" ADD COLUMN     "variant" "VideoGenerationVariant" NOT NULL DEFAULT 'standard_10s';

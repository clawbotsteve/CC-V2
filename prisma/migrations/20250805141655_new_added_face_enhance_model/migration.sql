-- CreateEnum
CREATE TYPE "OutputFormat" AS ENUM ('png', 'jpeg');

-- CreateEnum
CREATE TYPE "SafetyLevel" AS ENUM ('1', '2', '3', '4', '5', '6');

-- CreateTable
CREATE TABLE "FaceEnhance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "editedUrl" TEXT NOT NULL,
    "aspectRatio" "AspectRatio" NOT NULL DEFAULT 'portrait_16_9',
    "guidanceScale" DOUBLE PRECISION NOT NULL DEFAULT 3.5,
    "InferenceStep" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "outputFormat" "OutputFormat" NOT NULL DEFAULT 'png',
    "safetyLevel" "SafetyLevel" NOT NULL DEFAULT '6',
    "nsfwFlag" BOOLEAN NOT NULL DEFAULT false,
    "generationTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GenerationStatus" NOT NULL DEFAULT 'queued',
    "creditUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaceEnhance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FaceEnhance_createdAt_idx" ON "FaceEnhance"("createdAt");

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('character', 'product', 'style', 'general');

-- CreateEnum
CREATE TYPE "SpeedLevel" AS ENUM ('standard', 'priority', 'fast', 'fastest');

-- CreateEnum
CREATE TYPE "SupportLevel" AS ENUM ('community_email', 'priority_email', 'dedicated', 'priority_chat');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('full_ai', 'photo', 'video');

-- CreateEnum
CREATE TYPE "ToolType" AS ENUM ('IMAGE_GENERATOR', 'VIDEO_GENERATOR', 'IMAGE_EDITOR', 'IMAGE_UPSCALER', 'PROMPT_GENERATOR', 'AVATAR_TO_VIDEO', 'AVATAR_TRAINING');

-- CreateEnum
CREATE TYPE "AspectRatio" AS ENUM ('square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "UserApiLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "availableAvatarSlot" INTEGER NOT NULL DEFAULT 0,
    "avatarSlotUsed" INTEGER NOT NULL DEFAULT 0,
    "availableCredit" INTEGER NOT NULL DEFAULT 0,
    "creditUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserApiLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "stripe_current_period_end" TIMESTAMP(3),

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Influencer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trainingPhoto" JSONB NOT NULL,
    "falAvatarId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "configUrl" TEXT,
    "creditUsed" INTEGER NOT NULL DEFAULT 0,
    "loraUrl" TEXT,
    "mode" "Mode" NOT NULL DEFAULT 'character',
    "status" "GenerationStatus" NOT NULL DEFAULT 'queued',

    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedVideo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adherence" DOUBLE PRECISION NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "creditUsed" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "generationTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "negativePrompt" TEXT,
    "status" "GenerationStatus" NOT NULL,

    CONSTRAINT "GeneratedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "pricePerMonth" DOUBLE PRECISION NOT NULL,
    "creditsPerMonth" INTEGER NOT NULL,
    "speed" "SpeedLevel" NOT NULL,
    "support" "SupportLevel" NOT NULL,
    "maxAvatarCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolCreditCost" (
    "id" TEXT NOT NULL,
    "tool" "ToolType" NOT NULL,
    "variant" TEXT,
    "creditCost" INTEGER NOT NULL,
    "tierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolCreditCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditPack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "autoTopUpAvailable" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "packId" TEXT NOT NULL,

    CONSTRAINT "CreditPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "prompt" TEXT NOT NULL DEFAULT 'No prompt',
    "aspectRatio" "AspectRatio" DEFAULT 'square',
    "generationTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GenerationStatus" NOT NULL,
    "creditUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upscaled" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalImage" TEXT NOT NULL,
    "upscaledImage" TEXT NOT NULL,
    "scale" DOUBLE PRECISION NOT NULL,
    "steps" INTEGER NOT NULL,
    "dynamic" INTEGER NOT NULL,
    "creativity" DOUBLE PRECISION NOT NULL,
    "resemblance" DOUBLE PRECISION NOT NULL,
    "promptAdherence" DOUBLE PRECISION NOT NULL,
    "safetyFilter" BOOLEAN NOT NULL,
    "prompt" TEXT,
    "negativePrompt" TEXT,
    "generationTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GenerationStatus" NOT NULL,
    "creditUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upscaled_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalImage" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "generationTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GenerationStatus" NOT NULL,
    "creditUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageEdit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "editedUrl" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "steps" INTEGER NOT NULL DEFAULT 30,
    "adherence" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "count" INTEGER NOT NULL DEFAULT 1,
    "safe" BOOLEAN NOT NULL DEFAULT true,
    "generationTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GenerationStatus" NOT NULL,
    "creditUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageEdit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaceSwap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceImage" TEXT NOT NULL,
    "targetImage" TEXT NOT NULL,
    "swapedUrl" TEXT,
    "generationTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GenerationStatus" NOT NULL,
    "creditUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaceSwap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserApiLimit_userId_key" ON "UserApiLimit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_stripe_customer_id_key" ON "UserSubscription"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_stripe_subscription_id_key" ON "UserSubscription"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserSubscription_planId_idx" ON "UserSubscription"("planId");

-- CreateIndex
CREATE INDEX "Influencer_createdAt_idx" ON "Influencer"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedVideo_createdAt_idx" ON "GeneratedVideo"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionTier_tier_key" ON "SubscriptionTier"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "ToolCreditCost_tierId_tool_variant_key" ON "ToolCreditCost"("tierId", "tool", "variant");

-- CreateIndex
CREATE UNIQUE INDEX "CreditPack_name_key" ON "CreditPack"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CreditPack_packId_key" ON "CreditPack"("packId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_stripeId_key" ON "Transaction"("stripeId");

-- CreateIndex
CREATE INDEX "GeneratedImage_userId_idx" ON "GeneratedImage"("userId");

-- CreateIndex
CREATE INDEX "Upscaled_createdAt_idx" ON "Upscaled"("createdAt");

-- CreateIndex
CREATE INDEX "ImageAnalysis_createdAt_idx" ON "ImageAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "ImageEdit_createdAt_idx" ON "ImageEdit"("createdAt");

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolCreditCost" ADD CONSTRAINT "ToolCreditCost_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "SubscriptionTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

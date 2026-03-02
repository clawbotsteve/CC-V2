/*
  Warnings:

  - You are about to drop the column `variant` on the `GeneratedImage` table. All the data in the column will be lost.
  - You are about to drop the column `variant` on the `GeneratedVideo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ToolCreditCost" DROP CONSTRAINT "ToolCreditCost_tierId_fkey";

-- AlterTable
ALTER TABLE "GeneratedImage" DROP COLUMN "variant";

-- AlterTable
ALTER TABLE "GeneratedVideo" DROP COLUMN "variant";

-- DropEnum
DROP TYPE "ImageGenerationVariant";

-- DropEnum
DROP TYPE "VideoGenerationVariant";

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lora" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "createdBy" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'queued',
    "isListed" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION,
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoraPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loraId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoraPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LoraPurchase_userId_loraId_key" ON "LoraPurchase"("userId", "loraId");

-- AddForeignKey
ALTER TABLE "ToolCreditCost" ADD CONSTRAINT "ToolCreditCost_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "SubscriptionTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lora" ADD CONSTRAINT "Lora_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoraPurchase" ADD CONSTRAINT "LoraPurchase_loraId_fkey" FOREIGN KEY ("loraId") REFERENCES "Lora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

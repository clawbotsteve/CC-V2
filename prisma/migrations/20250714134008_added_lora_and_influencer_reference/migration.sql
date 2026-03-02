/*
  Warnings:

  - A unique constraint covering the columns `[influencerId]` on the table `Lora` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Lora" DROP CONSTRAINT "Lora_influencerId_fkey";

-- DropIndex
DROP INDEX "Influencer_createdAt_idx";

-- AlterTable
ALTER TABLE "Lora" ALTER COLUMN "influencerId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Lora_influencerId_key" ON "Lora"("influencerId");

-- AddForeignKey
ALTER TABLE "Lora" ADD CONSTRAINT "Lora_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

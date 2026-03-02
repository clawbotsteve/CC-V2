/*
  Warnings:

  - You are about to drop the column `falAvatarId` on the `Influencer` table. All the data in the column will be lost.
  - You are about to drop the column `trainingPhoto` on the `Influencer` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- AlterTable
ALTER TABLE "Influencer" DROP COLUMN "falAvatarId",
DROP COLUMN "trainingPhoto",
ADD COLUMN     "avatarImageUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'female',
ADD COLUMN     "introPrompt" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "introVideoRequestId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "introVideoUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "trainingFile" JSONB,
ADD COLUMN     "triggerWord" TEXT NOT NULL DEFAULT '';

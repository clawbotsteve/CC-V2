/*
  Warnings:

  - You are about to drop the column `sourceImage` on the `FaceSwap` table. All the data in the column will be lost.
  - Added the required column `firstFace` to the `FaceSwap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstUserGender` to the `FaceSwap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secondFace` to the `FaceSwap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workflowType` to the `FaceSwap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FaceSwap" DROP COLUMN "sourceImage",
ADD COLUMN     "enableDetailer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firstFace" TEXT NOT NULL,
ADD COLUMN     "firstUserGender" TEXT NOT NULL,
ADD COLUMN     "secondFace" TEXT NOT NULL,
ADD COLUMN     "secondUserGender" TEXT,
ADD COLUMN     "upscale2x" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workflowType" TEXT NOT NULL;

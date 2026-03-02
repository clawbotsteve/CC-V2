/*
  Warnings:

  - You are about to drop the column `InferenceStep` on the `FaceEnhance` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ToolType" ADD VALUE 'FACE_ENHANCE';

-- AlterTable
ALTER TABLE "FaceEnhance" DROP COLUMN "InferenceStep",
ADD COLUMN     "inferenceStep" DOUBLE PRECISION NOT NULL DEFAULT 30;

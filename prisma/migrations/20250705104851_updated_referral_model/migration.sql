/*
  Warnings:

  - Added the required column `referredUserId` to the `Referral` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "referredUserId" TEXT NOT NULL;

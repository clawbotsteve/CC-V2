-- AlterTable
ALTER TABLE "Influencer" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Influencer" ADD COLUMN     "contentType" "ContentType" NOT NULL DEFAULT 'sfw';

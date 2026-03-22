CREATE TYPE "CreatorSubmissionStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "CreatorSubmission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "notes" TEXT,
  "status" "CreatorSubmissionStatus" NOT NULL DEFAULT 'pending',
  "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
  "rightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "mediaUrls" TEXT[],
  "reviewedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreatorSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CreatorSubmission_userId_idx" ON "CreatorSubmission"("userId");
CREATE INDEX "CreatorSubmission_status_idx" ON "CreatorSubmission"("status");
CREATE INDEX "CreatorSubmission_createdAt_idx" ON "CreatorSubmission"("createdAt" DESC);

-- Add ModerationLog table for compliance audit trail.
-- Records every moderatePrompt() decision (allowed and blocked) with the
-- triggering flags, so we can answer "who tried to generate what, when".

CREATE TABLE "ModerationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "flags" JSONB NOT NULL DEFAULT '[]',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ModerationLog_userId_idx" ON "ModerationLog"("userId");
CREATE INDEX "ModerationLog_allowed_idx" ON "ModerationLog"("allowed");
CREATE INDEX "ModerationLog_endpoint_idx" ON "ModerationLog"("endpoint");
CREATE INDEX "ModerationLog_createdAt_idx" ON "ModerationLog"("createdAt" DESC);

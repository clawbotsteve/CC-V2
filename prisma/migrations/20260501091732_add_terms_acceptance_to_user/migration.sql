-- Capture terms / AUP / age attestation per user. Bump termsVersion when the
-- legal pages change to re-prompt users for re-acceptance. Both fields are
-- optional; null means the user has not accepted the current version yet
-- and should be prompted by the attestation modal at next dashboard load.

ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "termsVersion" TEXT;

-- CreateTable
CREATE TABLE "public"."Affiliate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliateCode" TEXT NOT NULL,
    "commissionType" TEXT NOT NULL DEFAULT 'percentage',
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "payoutMethod" TEXT,
    "payoutEmail" TEXT,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaidOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimumPayout" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AffiliatePayout" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payoutMethod" TEXT NOT NULL,
    "payoutEmail" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliatePayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_userId_key" ON "public"."Affiliate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_affiliateCode_key" ON "public"."Affiliate"("affiliateCode");

-- CreateIndex
CREATE INDEX "AffiliatePayout_affiliateId_idx" ON "public"."AffiliatePayout"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliatePayout_status_idx" ON "public"."AffiliatePayout"("status");

-- AddForeignKey
ALTER TABLE "public"."AffiliatePayout" ADD CONSTRAINT "AffiliatePayout_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - Made the column `discountPercentage` on table `PromoCode` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PromoCode" ALTER COLUMN "discountPercentage" SET NOT NULL;

-- CreateTable
CREATE TABLE "PromoCodeUsage" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromoCodeUsage_promoCodeId_idx" ON "PromoCodeUsage"("promoCodeId");

-- CreateIndex
CREATE INDEX "PromoCodeUsage_userId_idx" ON "PromoCodeUsage"("userId");

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

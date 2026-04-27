/*
  Warnings:

  - A unique constraint covering the columns `[promoCodeId,userId]` on the table `PromoCodeUsage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeUsage_promoCodeId_userId_key" ON "PromoCodeUsage"("promoCodeId", "userId");

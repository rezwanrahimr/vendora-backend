-- CreateTable
CREATE TABLE "OfferRedemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "lastRedeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferRedemption_offerId_userId_idx" ON "OfferRedemption"("offerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferRedemption_offerId_userId_key" ON "OfferRedemption"("offerId", "userId");

-- AddForeignKey
ALTER TABLE "OfferRedemption" ADD CONSTRAINT "OfferRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRedemption" ADD CONSTRAINT "OfferRedemption_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

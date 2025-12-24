-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "estimatedValue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "termsAndConditions" TEXT;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'RSD',
ADD COLUMN     "currentPriceDisplay" TEXT NOT NULL DEFAULT '0 RSD/month',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

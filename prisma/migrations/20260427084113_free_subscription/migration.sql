-- AlterEnum
ALTER TYPE "SubscriptionPaymentStatus" ADD VALUE 'NOT_REQUIRED';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "freeReason" TEXT,
ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT false;

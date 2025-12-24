/*
  Warnings:

  - You are about to drop the column `ExpiryOfferNotifications` on the `AdminNotification` table. All the data in the column will be lost.
  - You are about to drop the column `SubscriptionRenewalReminders` on the `AdminNotification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AdminNotification" DROP COLUMN "ExpiryOfferNotifications",
DROP COLUMN "SubscriptionRenewalReminders",
ADD COLUMN     "expiryOfferNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subscriptionRenewalReminders" BOOLEAN NOT NULL DEFAULT true;

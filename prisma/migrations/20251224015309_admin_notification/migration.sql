-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL DEFAULT 'ADMIN_NOTIFICATION_SINGLETON_ID',
    "enablePushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "newOfferNotifications" BOOLEAN NOT NULL DEFAULT true,
    "ExpiryOfferNotifications" BOOLEAN NOT NULL DEFAULT true,
    "SubscriptionRenewalReminders" BOOLEAN NOT NULL DEFAULT true,
    "enableEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

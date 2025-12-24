-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "thumbnail" TEXT DEFAULT '';

-- CreateTable
CREATE TABLE "AdminGeneralSettings" (
    "id" TEXT NOT NULL DEFAULT 'ADMIN_GENERAL_SETTINGS_SINGLETON_ID',
    "defaultVendorId" TEXT,
    "defaultCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminGeneralSettings_pkey" PRIMARY KEY ("id")
);

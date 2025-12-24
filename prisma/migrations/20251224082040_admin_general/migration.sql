/*
  Warnings:

  - You are about to drop the column `defaultCategoryId` on the `AdminGeneralSettings` table. All the data in the column will be lost.
  - You are about to drop the column `defaultVendorId` on the `AdminGeneralSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AdminGeneralSettings" DROP COLUMN "defaultCategoryId",
DROP COLUMN "defaultVendorId",
ADD COLUMN     "defaultLanguage" TEXT DEFAULT 'en',
ADD COLUMN     "isAutoApproveForVendorOn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNewVendorRegistrationOn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isUnderMaintenance" BOOLEAN NOT NULL DEFAULT false;

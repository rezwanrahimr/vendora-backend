/*
  Warnings:

  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `businessAddress` on the `VendorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `VendorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `VendorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `taxId` on the `VendorProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `city` to the `VendorProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `streetAddress` to the `VendorProfile` table without a default value. This is not possible if the table is not empty.
  - The required column `vendorId` was added to the `VendorProfile` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `zipCode` to the `VendorProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isActive",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "VendorProfile" DROP COLUMN "businessAddress",
DROP COLUMN "description",
DROP COLUMN "phoneNumber",
DROP COLUMN "taxId",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "streetAddress" TEXT NOT NULL,
ADD COLUMN     "vendorId" TEXT NOT NULL,
ADD COLUMN     "zipCode" TEXT NOT NULL,
ALTER COLUMN "businessName" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "newOffer" BOOLEAN NOT NULL DEFAULT true,
    "renewalReminder" BOOLEAN NOT NULL DEFAULT true,
    "promotional" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

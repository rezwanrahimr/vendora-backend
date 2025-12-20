/*
  Warnings:

  - The primary key for the `Offer` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Offer" DROP CONSTRAINT "Offer_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Offer_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Offer_id_seq";

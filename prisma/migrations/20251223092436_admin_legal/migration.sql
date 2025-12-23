-- CreateTable
CREATE TABLE "AdminLegal" (
    "id" TEXT NOT NULL DEFAULT 'ADMIN_LEGAL_SINGLETON_ID',
    "TermsAndConditions" TEXT NOT NULL,
    "PrivacyPolicy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminLegal_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "twoFactorRecovery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "twoFactorSecret" TEXT;

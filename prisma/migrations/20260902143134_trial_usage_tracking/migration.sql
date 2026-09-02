-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN     "trialTryOnsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trialUsageCheckedAt" TIMESTAMP(3);

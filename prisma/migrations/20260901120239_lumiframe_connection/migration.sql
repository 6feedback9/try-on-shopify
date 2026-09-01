/*
  Warnings:

  - You are about to drop the column `lumionApiKey` on the `ShopSettings` table. All the data in the column will be lost.
  - You are about to drop the column `lumionBrandSlug` on the `ShopSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShopSettings" DROP COLUMN "lumionApiKey",
DROP COLUMN "lumionBrandSlug",
ADD COLUMN     "lumiframeEmail" TEXT,
ADD COLUMN     "lumiframePassword" TEXT,
ADD COLUMN     "lumiframeStoreId" TEXT;

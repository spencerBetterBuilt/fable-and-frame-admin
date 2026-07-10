-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "addOnQuantity" INTEGER;

-- AlterTable
ALTER TABLE "SessionType" ADD COLUMN     "addOnIncludedUnits" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "addOnUnitLabel" TEXT,
ADD COLUMN     "addOnUnitPriceCents" INTEGER,
ADD COLUMN     "isFullPayment" BOOLEAN NOT NULL DEFAULT true;

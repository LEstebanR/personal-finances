-- AlterTable
ALTER TABLE "Debt" DROP COLUMN "creditor",
  ADD COLUMN "minimumPayment" DECIMAL(15,2),
  ADD COLUMN "paymentDueDay" INTEGER;

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "creditLimit" DECIMAL(15,2),
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'loan';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "debtId" TEXT,
ALTER COLUMN "accountId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_debtId_idx" ON "Transaction"("debtId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

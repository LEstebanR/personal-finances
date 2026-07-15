-- AlterTable
ALTER TABLE "BudgetItem" ADD COLUMN "debtId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItem_debtId_date_key" ON "BudgetItem"("debtId", "date");

-- CreateIndex
CREATE INDEX "BudgetItem_debtId_idx" ON "BudgetItem"("debtId");

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

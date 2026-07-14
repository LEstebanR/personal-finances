-- AlterTable
ALTER TABLE "BudgetItem" ADD COLUMN     "subcategoryId" TEXT;

-- CreateIndex
CREATE INDEX "BudgetItem_subcategoryId_idx" ON "BudgetItem"("subcategoryId");

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

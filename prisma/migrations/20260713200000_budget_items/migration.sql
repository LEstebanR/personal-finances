-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetItem_userId_idx" ON "BudgetItem"("userId");

-- CreateIndex
CREATE INDEX "BudgetItem_categoryId_idx" ON "BudgetItem"("categoryId");

-- CreateIndex
CREATE INDEX "BudgetItem_date_idx" ON "BudgetItem"("date");

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing per-category monthly budgets into a single dated planned item
-- (dated the 1st of that month) so the totals aren't lost.
INSERT INTO "BudgetItem" ("id", "userId", "categoryId", "date", "amount", "description", "createdAt")
SELECT gen_random_uuid(), "userId", "categoryId", make_date("year", "month", 1), "amount", 'Migrado del presupuesto anterior', now()
FROM "Budget";

-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_userId_fkey";

-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_categoryId_fkey";

-- DropTable
DROP TABLE "Budget";

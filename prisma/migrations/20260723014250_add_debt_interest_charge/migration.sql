-- CreateTable
CREATE TABLE "DebtInterestCharge" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtInterestCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DebtInterestCharge_debtId_idx" ON "DebtInterestCharge"("debtId");

-- CreateIndex
CREATE INDEX "DebtInterestCharge_userId_idx" ON "DebtInterestCharge"("userId");

-- AddForeignKey
ALTER TABLE "DebtInterestCharge" ADD CONSTRAINT "DebtInterestCharge_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

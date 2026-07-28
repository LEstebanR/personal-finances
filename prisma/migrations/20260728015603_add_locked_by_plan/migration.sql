-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "lockedByPlan" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "lockedByPlan" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "lockedByPlan" BOOLEAN NOT NULL DEFAULT false;

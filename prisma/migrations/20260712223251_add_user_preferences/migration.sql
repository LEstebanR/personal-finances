-- AlterTable
ALTER TABLE "user" ADD COLUMN     "budgetPeriod" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'est';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "frequency" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "Subscription" ADD COLUMN "weekday" INTEGER;
ALTER TABLE "Subscription" ALTER COLUMN "dueDay" DROP NOT NULL;

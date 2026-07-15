-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "dueMonth" INTEGER;
ALTER TABLE "Subscription" DROP COLUMN "weekday";

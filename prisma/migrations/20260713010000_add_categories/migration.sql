-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable (nullable for now, backfilled below before being made required)
ALTER TABLE "Transaction" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "subcategoryId" TEXT;

-- Backfill: migrate existing free-text categories into real Category rows
INSERT INTO "Category" ("id", "userId", "name", "type", "isDefault", "createdAt")
SELECT gen_random_uuid(), t."userId", t."category", t."type", false, CURRENT_TIMESTAMP
FROM "Transaction" t
WHERE t."category" IS NOT NULL
GROUP BY t."userId", t."category", t."type";

UPDATE "Transaction" t
SET "categoryId" = c."id"
FROM "Category" c
WHERE c."userId" = t."userId"
  AND c."name" = t."category"
  AND c."type" = t."type"
  AND t."category" IS NOT NULL;

-- Any remaining rows without a category (shouldn't happen, safety net) fall back to an "Otros" category
INSERT INTO "Category" ("id", "userId", "name", "type", "isDefault", "createdAt")
SELECT gen_random_uuid(), t."userId", 'Otros', t."type", true, CURRENT_TIMESTAMP
FROM "Transaction" t
WHERE t."categoryId" IS NULL
GROUP BY t."userId", t."type";

UPDATE "Transaction" t
SET "categoryId" = c."id"
FROM "Category" c
WHERE t."categoryId" IS NULL
  AND c."userId" = t."userId"
  AND c."name" = 'Otros'
  AND c."type" = t."type";

-- AlterTable: category is now required, drop the old free-text column
ALTER TABLE "Transaction" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "Transaction" DROP COLUMN "category";

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE INDEX "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");

-- CreateIndex
CREATE INDEX "Subcategory_userId_idx" ON "Subcategory"("userId");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- CreateIndex
CREATE INDEX "Transaction_subcategoryId_idx" ON "Transaction"("subcategoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

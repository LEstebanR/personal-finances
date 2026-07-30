-- DataMigration: debt payments recorded before payments started mirroring
-- as expense transactions have no linked Transaction row, so they were
-- invisible to the budget and expense totals. Backfill one Transaction per
-- unlinked DebtPayment (categorized under "Deuda", creating that category
-- for the user if needed) without touching account/debt balances, since
-- those were already adjusted when the payment was originally created.
-- Only touches DebtPayment rows where transactionId IS NULL, so it's safe
-- to re-run.
DO $$
DECLARE
  payment RECORD;
  category_id TEXT;
  new_transaction_id TEXT;
BEGIN
  FOR payment IN
    SELECT dp.id, dp."accountId", dp."userId", dp.amount, dp.date, dp.note, d.name AS debt_name
    FROM "DebtPayment" dp
    JOIN "Debt" d ON d.id = dp."debtId"
    WHERE dp."transactionId" IS NULL
  LOOP
    SELECT id INTO category_id
    FROM "Category"
    WHERE "userId" = payment."userId" AND type = 'expense' AND lower(name) = 'deuda'
    LIMIT 1;

    IF category_id IS NULL THEN
      category_id := gen_random_uuid()::text;
      INSERT INTO "Category" (id, "userId", name, type, "isDefault", "createdAt")
      VALUES (category_id, payment."userId", 'Deuda', 'expense', true, now());
    END IF;

    new_transaction_id := gen_random_uuid()::text;
    INSERT INTO "Transaction" (id, "accountId", "debtId", "userId", amount, type, description, date, "categoryId", "subcategoryId", "createdAt")
    VALUES (
      new_transaction_id,
      payment."accountId",
      NULL,
      payment."userId",
      payment.amount,
      'expense',
      COALESCE(NULLIF(trim(payment.note), ''), 'Pago: ' || payment.debt_name),
      payment.date,
      category_id,
      NULL,
      now()
    );

    UPDATE "DebtPayment" SET "transactionId" = new_transaction_id WHERE id = payment.id;
  END LOOP;
END $$;

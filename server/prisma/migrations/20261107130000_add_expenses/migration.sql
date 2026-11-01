CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountPaisa" INTEGER NOT NULL,
    "spentAt" DATETIME NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Expense_spentAt_id_idx" ON "Expense"("spentAt", "id");
CREATE INDEX "Expense_category_spentAt_idx" ON "Expense"("category", "spentAt");

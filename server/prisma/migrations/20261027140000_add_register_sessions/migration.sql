-- CreateTable
CREATE TABLE "RegisterSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "RegisterSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "subtotalPaisa" INTEGER NOT NULL DEFAULT 0,
    "taxPaisa" INTEGER NOT NULL DEFAULT 0,
    "totalPaisa" INTEGER NOT NULL DEFAULT 0,
    "taxRateBps" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "sessionId" TEXT,
    "paidAt" DATETIME,
    "voidedAt" DATETIME,
    "voidedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RegisterSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "createdById", "id", "orderType", "paidAt", "receiptNumber", "status", "subtotalPaisa", "taxPaisa", "taxRateBps", "totalPaisa", "updatedAt", "voidedAt", "voidedReason") SELECT "createdAt", "createdById", "id", "orderType", "paidAt", "receiptNumber", "status", "subtotalPaisa", "taxPaisa", "taxRateBps", "totalPaisa", "updatedAt", "voidedAt", "voidedReason" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_receiptNumber_key" ON "Order"("receiptNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RegisterSession_staffId_status_idx" ON "RegisterSession"("staffId", "status");

-- CreateIndex
CREATE INDEX "RegisterSession_openedAt_idx" ON "RegisterSession"("openedAt");

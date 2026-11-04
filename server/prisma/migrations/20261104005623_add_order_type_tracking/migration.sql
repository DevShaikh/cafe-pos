/*
  Warnings:

  - You are about to drop the column `orderTypeVisibilityEnabled` on the `Settings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "cafeName" TEXT NOT NULL DEFAULT 'Cafe POS',
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "taxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "taxRateBps" INTEGER NOT NULL DEFAULT 800,
    "receiptFooter" TEXT DEFAULT 'Thank you for your visit!',
    "receiptPrefix" TEXT NOT NULL DEFAULT 'R',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("cafeName", "currency", "id", "receiptFooter", "receiptPrefix", "taxEnabled", "taxRateBps", "updatedAt") SELECT "cafeName", "currency", "id", "receiptFooter", "receiptPrefix", "taxEnabled", "taxRateBps", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

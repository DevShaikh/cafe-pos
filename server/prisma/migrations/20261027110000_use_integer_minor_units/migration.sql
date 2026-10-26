-- Convert PKR decimal amounts to integer paisa. Rates are stored in basis points.
-- Every conversion rounds to the nearest paisa (or basis point).

ALTER TABLE "Product" ADD COLUMN "pricePaisa" INTEGER NOT NULL DEFAULT 0;
UPDATE "Product"
SET "pricePaisa" = CAST(ROUND("price" * 100.0) AS INTEGER);
ALTER TABLE "Product" DROP COLUMN "price";

ALTER TABLE "Order" ADD COLUMN "subtotalPaisa" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "taxPaisa" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "totalPaisa" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "taxRateBps" INTEGER NOT NULL DEFAULT 0;
UPDATE "Order" SET
  "subtotalPaisa" = CAST(ROUND("subtotal" * 100.0) AS INTEGER),
  "taxPaisa" = CAST(ROUND("tax" * 100.0) AS INTEGER),
  "totalPaisa" = CAST(ROUND("total" * 100.0) AS INTEGER),
  "taxRateBps" = CAST(ROUND("taxRate" * 10000.0) AS INTEGER);
ALTER TABLE "Order" DROP COLUMN "subtotal";
ALTER TABLE "Order" DROP COLUMN "tax";
ALTER TABLE "Order" DROP COLUMN "total";
ALTER TABLE "Order" DROP COLUMN "taxRate";

ALTER TABLE "OrderItem" ADD COLUMN "unitPricePaisa" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "lineTotalPaisa" INTEGER NOT NULL DEFAULT 0;
UPDATE "OrderItem" SET
  "unitPricePaisa" = CAST(ROUND("unitPrice" * 100.0) AS INTEGER),
  "lineTotalPaisa" = CAST(ROUND("lineTotal" * 100.0) AS INTEGER);
ALTER TABLE "OrderItem" DROP COLUMN "unitPrice";
ALTER TABLE "OrderItem" DROP COLUMN "lineTotal";

ALTER TABLE "Payment" ADD COLUMN "amountPaisa" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "receivedPaisa" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "changePaisa" INTEGER;
UPDATE "Payment" SET
  "amountPaisa" = CAST(ROUND("amount" * 100.0) AS INTEGER),
  "receivedPaisa" = CASE WHEN "received" IS NULL THEN NULL ELSE CAST(ROUND("received" * 100.0) AS INTEGER) END,
  "changePaisa" = CASE WHEN "change" IS NULL THEN NULL ELSE CAST(ROUND("change" * 100.0) AS INTEGER) END;
ALTER TABLE "Payment" DROP COLUMN "amount";
ALTER TABLE "Payment" DROP COLUMN "received";
ALTER TABLE "Payment" DROP COLUMN "change";

ALTER TABLE "Settings" ADD COLUMN "taxRateBps" INTEGER NOT NULL DEFAULT 800;
UPDATE "Settings"
SET "taxRateBps" = CAST(ROUND("taxRate" * 10000.0) AS INTEGER);
ALTER TABLE "Settings" DROP COLUMN "taxRate";

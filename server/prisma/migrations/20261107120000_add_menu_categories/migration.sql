CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

UPDATE "Product"
SET "category" = trim("category")
WHERE "category" IS NOT NULL AND "category" <> trim("category");

INSERT INTO "Category" ("id", "name", "updatedAt")
SELECT lower(hex(randomblob(16))), MIN(trim("category")), CURRENT_TIMESTAMP
FROM "Product"
WHERE "category" IS NOT NULL AND trim("category") <> ''
GROUP BY lower(trim("category"));

UPDATE "Product"
SET "category" = (
    SELECT "name"
    FROM "Category"
    WHERE lower("name") = lower(trim("Product"."category"))
    LIMIT 1
)
WHERE "category" IS NOT NULL AND trim("category") <> '';

INSERT INTO "Category" ("id", "name", "updatedAt")
SELECT lower(hex(randomblob(16))), 'Uncategorized', CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM "Product"
    WHERE "category" IS NULL OR trim("category") = ''
)
AND NOT EXISTS (
    SELECT 1
    FROM "Category"
    WHERE lower("name") = lower('Uncategorized')
);

UPDATE "Product"
SET "category" = (
    SELECT "name"
    FROM "Category"
    WHERE lower("name") = lower('Uncategorized')
    LIMIT 1
)
WHERE "category" IS NULL OR trim("category") = '';

-- SQLite partial index: each cashier can have only one active register session.
CREATE UNIQUE INDEX "RegisterSession_one_open_per_staff"
ON "RegisterSession"("staffId")
WHERE "status" = 'OPEN';

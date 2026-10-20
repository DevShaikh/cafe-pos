import { prismaClient } from "../lib/prismaClient";

import AppError from "../utils/app-error";

/**
 * @description This function checks the database connection by executing a simple query.
 * If the query fails, it throws an AppError with a 500 status code and a descriptive message.
 * This function can be used to verify that the database is reachable and operational.
 * @throws {AppError} Throws an AppError if the database connection fails.
 */
export const checkDatabaseHealth = async () => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
  } catch (error) {
    throw new AppError(
      500,
      "DATABASE_ERROR",
      "Failed to connect to the database",
      { cause: error },
    );
  }
};

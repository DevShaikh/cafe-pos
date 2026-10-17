import { prismaClient } from "../lib/prismaClient";

import ApiError from "../utils/app-error";

/**
 * @description This function checks the database connection by executing a simple query.
 * If the query fails, it throws an ApiError with a 500 status code and a descriptive message.
 * This function can be used to verify that the database is reachable and operational.
 * @throws {ApiError} Throws an ApiError if the database connection fails.
 */
export const checkDatabaseHealth = async () => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
  } catch {
    throw new ApiError(
      500,
      "DATABASE_CONNECTION_ERROR",
      "Failed to connect to the database",
    );
  }
};

import { ERROR_CODES } from "../constants/error-codes";
import { prismaClient } from "../lib/prismaClient";
import AppError from "../utils/app-error";

/**
 * Fetches all products from the database.
 * @returns Products with integer `pricePaisa` values.
 * @throws AppError when the database query fails.
 */
export const getProducts = async () => {
  try {
    const products = await prismaClient.product.findMany();
    return products;
  } catch (error) {
    throw new AppError(
      500,
      ERROR_CODES.DATABASE_ERROR,
      "Failed to retrieve products from the database",
      { cause: error },
    );
  }
};

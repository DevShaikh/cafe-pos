import { prismaClient } from "../lib/prismaClient";

import ApiError from "../utils/app-error";

/**
 * @description Fetches all products from the database.
 * @returns {Promise<Product[]>} A promise that resolves to an array of products.
 * @throws {ApiError} Throws an ApiError if there is a database error.
 */
export const getProducts = async () => {
  try {
    const products = await prismaClient.product.findMany();
    // Prisma's Decimal drops trailing zeros in JSON ("120"), so send "120.00"
    return products.map((product) => ({
      ...product,
      price: product.price.toFixed(2),
    }));
  } catch {
    throw new ApiError(
      500,
      "Failed to retrieve products from the database",
      "Database Error",
    );
  }
};

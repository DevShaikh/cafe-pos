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
    return products;
  } catch {
    throw new ApiError(
      500,
      "Failed to retrieve products from the database",
      "Database Error",
    );
  }
};

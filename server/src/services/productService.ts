import { prismaClient } from "../lib/prismaClient";
import AppError from "../utils/app-error";

/**
 * Fetches all products from the database.
 * @returns A promise that resolves to an array of products, each with its price formatted to two decimal places.
 * @throws AppError when the database query fails.
 */
export const getProducts = async () => {
  try {
    const products = await prismaClient.product.findMany();
    return products.map((product) => ({
      ...product,
      price: product.price.toFixed(2),
    }));
  } catch (error) {
    throw new AppError(
      500,
      "DATABASE_ERROR",
      "Failed to retrieve products from the database",
      { cause: error },
    );
  }
};

import { prismaClient } from "../lib/prismaClient";
import AppError from "../utils/app-error";

/**
 * @description Fetches all products from the database.
 * @returns {Promise<Product[]>} A promise that resolves to an array of products.
 * @throws {AppError} Throws an AppError if there is a database error.
 */
export const getProducts = async () => {
  try {
    const products = await prismaClient.product.findMany();
    // Prisma's Decimal drops trailing zeros in JSON ("120"), so send "120.00"
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

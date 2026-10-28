import { prismaClient } from "../lib/prismaClient";
import AppError from "../utils/app-error";
import { ERROR_CODES } from "../constants/error-codes";

export interface GetProductsParams {
  search?: string;
  category?: string | null;
}

/**
 * Fetches products from the database with optional filtering.
 * @param params - Filtering options (search query and/or category)
 * @returns Products with integer pricePaisa values, optionally filtered
 * @throws AppError when the database query fails
 */
export const getProducts = async ({ search, category }: GetProductsParams) => {
  try {
    const where: Partial<{
      name?: string | { contains?: string; mode?: "insensitive" };
      category?: string | { equals?: string };
    }> = {};

    if (search && search.trim()) {
      where.name = { contains: search, mode: "insensitive" as const };
    }

    if (category && category.trim()) {
      where.category = { equals: category };
    }

    const products = await prismaClient.product.findMany({
      where,
      orderBy: [{ name: "asc" }],
    });
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

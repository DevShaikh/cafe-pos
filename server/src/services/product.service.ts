import { prismaClient } from "../lib/prismaClient";
import type { Prisma } from "../generated/prisma/client.js";
import AppError from "../utils/app-error";
import { ERROR_CODES } from "../constants/error-codes";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "../schemas/product";

export interface GetProductsParams {
  search?: string;
  category?: string | null;
  includeUnavailable?: boolean;
}

/**
 * Fetches products from the database with optional filtering.
 * @param params - Filtering options (search query and/or category)
 * @returns Products with integer pricePaisa values, optionally filtered
 * @throws AppError when the database query fails
 */
export const getProducts = async ({
  search,
  category,
  includeUnavailable = false,
}: GetProductsParams) => {
  try {
    const where: Partial<{
      name?: string | { contains?: string; mode?: "insensitive" };
      category?: string | { equals?: string };
      isAvailable?: boolean;
    }> = {};

    if (!includeUnavailable) {
      where.isAvailable = true;
    }

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

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function categoryConflict() {
  return new AppError(
    409,
    ERROR_CODES.CATEGORY_CONFLICT,
    "A category with this name already exists.",
  );
}

async function findCategoryByName(
  client: Pick<Prisma.TransactionClient, "category">,
  name: string,
) {
  const categories = await client.category.findMany({
    select: { name: true },
  });
  const key = name.toLowerCase();
  return categories.find(({ name: candidate }) =>
    candidate.toLowerCase() === key,
  ) ?? null;
}

export async function createProduct(input: CreateProductInput) {
  try {
    return await prismaClient.$transaction(async (tx) => {
      const category = await findCategoryByName(tx, input.category);
      if (!category) {
        throw new AppError(
          400,
          ERROR_CODES.CATEGORY_NOT_FOUND,
          "Choose an existing category for this product.",
        );
      }

      return tx.product.create({
        data: {
          ...input,
          category: category.name,
          description: input.description ?? null,
          imageUrl: input.imageUrl ?? null,
        },
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      500,
      ERROR_CODES.DATABASE_ERROR,
      "Failed to create the product.",
      { cause: error },
    );
  }
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
) {
  try {
    return await prismaClient.$transaction(async (tx) => {
      const current = await tx.product.findUnique({ where: { id } });
      if (!current) {
        throw new AppError(
          404,
          ERROR_CODES.PRODUCT_NOT_FOUND,
          "Product not found.",
        );
      }

      let categoryName: string | undefined;
      if (input.category !== undefined) {
        const category = await findCategoryByName(tx, input.category);
        if (!category) {
          throw new AppError(
            400,
            ERROR_CODES.CATEGORY_NOT_FOUND,
            "Choose an existing category for this product.",
          );
        }
        categoryName = category.name;
      }

      return tx.product.update({
        where: { id },
        data: {
          ...input,
          ...(categoryName !== undefined ? { category: categoryName } : {}),
        },
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      500,
      ERROR_CODES.DATABASE_ERROR,
      "Failed to update the product.",
      { cause: error },
    );
  }
}

export async function listCategories() {
  try {
    return await prismaClient.category.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    throw new AppError(
      500,
      ERROR_CODES.DATABASE_ERROR,
      "Failed to retrieve categories.",
      { cause: error },
    );
  }
}

export async function createCategory(name: string) {
  try {
    const existing = await findCategoryByName(prismaClient, name);
    if (existing) throw categoryConflict();
    return await prismaClient.category.create({ data: { name } });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (isUniqueConstraintError(error)) throw categoryConflict();
    throw new AppError(
      500,
      ERROR_CODES.DATABASE_ERROR,
      "Failed to create the category.",
      { cause: error },
    );
  }
}

export async function updateCategory(id: string, name: string) {
  try {
    return await prismaClient.$transaction(async (tx) => {
      const category = await tx.category.findUnique({ where: { id } });
      if (!category) {
        throw new AppError(
          404,
          ERROR_CODES.CATEGORY_NOT_FOUND,
          "Category not found.",
        );
      }

      const otherCategories = await tx.category.findMany({
        where: { NOT: { id } },
        select: { name: true },
      });
      const duplicate = otherCategories.some(
        (candidate) =>
          candidate.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) throw categoryConflict();

      const updated = await tx.category.update({
        where: { id },
        data: { name },
      });
      if (category.name !== name) {
        await tx.product.updateMany({
          where: { category: category.name },
          data: { category: name },
        });
      }
      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (isUniqueConstraintError(error)) throw categoryConflict();
    throw new AppError(
      500,
      ERROR_CODES.DATABASE_ERROR,
      "Failed to update the category.",
      { cause: error },
    );
  }
}

export async function deleteCategory(id: string) {
  try {
    return await prismaClient.$transaction(async (tx) => {
      const category = await tx.category.findUnique({ where: { id } });
      if (!category) {
        throw new AppError(
          404,
          ERROR_CODES.CATEGORY_NOT_FOUND,
          "Category not found.",
        );
      }

      const assignedProducts = await tx.product.count({
        where: { category: category.name },
      });
      if (assignedProducts > 0) {
        throw new AppError(
          409,
          ERROR_CODES.CATEGORY_IN_USE,
          "Reassign or archive products in this category before deleting it.",
        );
      }

      await tx.category.delete({ where: { id } });
      return { id };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      500,
      ERROR_CODES.DATABASE_ERROR,
      "Failed to delete the category.",
      { cause: error },
    );
  }
}

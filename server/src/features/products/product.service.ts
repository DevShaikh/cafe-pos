import { AppError } from "../../errors/app-error.js";
import type {
  CreateProductInput,
  ProductListQuery,
} from "./product.schemas.js";

export interface ProductRecord {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRepository {
  findMany(query: ProductListQuery): Promise<ProductRecord[]>;
  findById(id: string): Promise<ProductRecord | null>;
  create(input: CreateProductInput): Promise<ProductRecord>;
}

export interface ProductServiceContract {
  list(query: ProductListQuery): Promise<ProductRecord[]>;
  getById(id: string): Promise<ProductRecord>;
  create(input: CreateProductInput): Promise<ProductRecord>;
}

export class ProductService implements ProductServiceContract {
  constructor(private readonly products: ProductRepository) {}

  list(query: ProductListQuery): Promise<ProductRecord[]> {
    return this.products.findMany(query);
  }

  async getById(id: string): Promise<ProductRecord> {
    const product = await this.products.findById(id);

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    }

    return product;
  }

  create(input: CreateProductInput): Promise<ProductRecord> {
    return this.products.create(input);
  }
}

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { ERROR_CODES } from "../constants/error-codes";
import AppError from "../utils/app-error";

export const PRODUCT_IMAGE_DIRECTORY = path.resolve(
  process.env.PRODUCT_IMAGE_DIRECTORY ??
    path.resolve(__dirname, "../../data/product-images"),
);

const imageUrlPattern =
  /^\/api\/products\/images\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp))$/i;

function getImageExtension(data: Buffer): "jpg" | "png" | "webp" | null {
  if (
    data.length >= 8 &&
    data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return "png";
  }
  if (
    data.length >= 4 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff &&
    data[data.length - 2] === 0xff &&
    data[data.length - 1] === 0xd9
  ) {
    return "jpg";
  }
  if (
    data.length >= 12 &&
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export async function saveProductImage(data: Buffer) {
  const extension = getImageExtension(data);
  if (!extension) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Choose a valid JPG, PNG, or WebP image.",
    );
  }

  await mkdir(PRODUCT_IMAGE_DIRECTORY, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(PRODUCT_IMAGE_DIRECTORY, filename), data, {
    flag: "wx",
  });
  return `/api/products/images/${filename}`;
}

export function getProductImagePath(filename: string): string | null {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i.test(
      filename,
    )
  ) {
    return null;
  }
  return path.join(PRODUCT_IMAGE_DIRECTORY, filename);
}

export async function removeProductImage(imageUrl: string | null) {
  const match = imageUrl?.match(imageUrlPattern);
  const filename = match?.[1];
  if (!filename) return;
  await rm(path.join(PRODUCT_IMAGE_DIRECTORY, filename), { force: true });
}

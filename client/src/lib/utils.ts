import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats the price of a product in Pakistani Rupees (PKR) currency format.
 */
export const formatPrice = (amount: number) => {
  const formatted = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `PKR ${formatted}`;
};

export const formatPaisa = (amountPaisa: number) =>
  formatPrice(amountPaisa / 100);

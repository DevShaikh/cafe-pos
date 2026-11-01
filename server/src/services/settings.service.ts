import { prismaClient } from "../lib/prismaClient";
import { ERROR_CODES } from "../constants/error-codes";
import type { UpdateTaxSettingsInput } from "../schemas/settings";
import AppError from "../utils/app-error";

const taxSettingsSelect = {
  taxEnabled: true,
  taxRateBps: true,
  updatedAt: true,
} as const;

export async function getTaxSettings() {
  const settings = await prismaClient.settings.findUnique({
    where: { id: "singleton" },
    select: taxSettingsSelect,
  });
  if (!settings) {
    throw new AppError(
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Cafe settings are not configured.",
    );
  }
  return settings;
}

export async function updateTaxSettings(
  input: UpdateTaxSettingsInput,
  actorId: string,
) {
  return prismaClient.$transaction(async (tx) => {
    const before = await tx.settings.findUnique({
      where: { id: "singleton" },
      select: taxSettingsSelect,
    });
    if (!before) {
      throw new AppError(
        500,
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        "Cafe settings are not configured.",
      );
    }

    const after = await tx.settings.update({
      where: { id: "singleton" },
      data: input,
      select: taxSettingsSelect,
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "settings.tax_updated",
        entity: "settings",
        entityId: "singleton",
        before: JSON.stringify(before),
        after: JSON.stringify(after),
      },
    });

    return after;
  });
}

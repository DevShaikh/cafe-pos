import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prismaClient } from "../lib/prismaClient";
import { ERROR_CODES } from "../constants/error-codes";
import AppError from "../utils/app-error";
import { InitialSetupInput, LoginInput } from "../schemas/auth";
import configuration from "../config/env";

export const getActiveStaff = async () => {
  return prismaClient.staff.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};

export async function getSetupRequired() {
  return (await prismaClient.staff.count()) === 0;
}

export async function setupInitialAdmin(data: InitialSetupInput) {
  return prismaClient.$transaction(async (tx) => {
    if ((await tx.staff.count()) !== 0) {
      throw new AppError(
        409,
        ERROR_CODES.INITIAL_SETUP_COMPLETE,
        "Initial setup has already been completed.",
      );
    }

    const pinHash = await bcrypt.hash(data.pin, 12);
    const staff = await tx.staff.create({
      data: {
        name: data.name,
        pinHash,
        role: "ADMIN",
      },
    });
    await tx.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: {
        id: "singleton",
        cafeName: "Cafe POS",
        currency: "PKR",
        taxRateBps: 800,
        receiptPrefix: "R",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: staff.id,
        action: "auth.initial_setup",
        entity: "staff",
        entityId: staff.id,
      },
    });

    if (!configuration.jwtSecret) {
      throw new AppError(
        500,
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        "Authentication is not configured on this server.",
      );
    }

    const token = jwt.sign(
      { id: staff.id, role: staff.role, name: staff.name },
      configuration.jwtSecret,
      { expiresIn: "12h" },
    );
    return {
      token,
      staff: { id: staff.id, name: staff.name, role: staff.role },
    };
  });
}

export const login = async (data: LoginInput) => {
  const staff = await prismaClient.staff.findUnique({
    where: { id: data.staffId },
  });

  if (!staff || !staff.active) {
    throw new AppError(
      401,
      ERROR_CODES.UNAUTHORIZED,
      "Invalid credentials or inactive account",
    );
  }

  const isValidPin = await bcrypt.compare(data.pin, staff.pinHash);
  if (!isValidPin) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Invalid credentials");
  }

  if (!configuration.jwtSecret) {
    throw new AppError(
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Authentication is not configured on this server.",
    );
  }

  const token = jwt.sign(
    { id: staff.id, role: staff.role, name: staff.name },
    configuration.jwtSecret,
    { expiresIn: "12h" },
  );

  // Audit log (using your existing model)
  await prismaClient.auditLog.create({
    data: {
      actorId: staff.id,
      action: "auth.login",
      entity: "staff",
      entityId: staff.id,
    },
  });

  return {
    token,
    staff: { id: staff.id, name: staff.name, role: staff.role },
  };
};

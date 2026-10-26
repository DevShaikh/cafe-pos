import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prismaClient } from "../lib/prismaClient";
import { ERROR_CODES } from "../constants/error-codes";
import AppError from "../utils/app-error";
import { LoginInput } from "../schemas/auth";
import configuration from "../config/env";

export const getActiveStaff = async () => {
  return prismaClient.staff.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};

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

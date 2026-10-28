import { createHash } from "node:crypto";
import { ERROR_CODES } from "../constants/error-codes";
import { prismaClient } from "../lib/prismaClient";
import AppError from "../utils/app-error";
import type { ListSessionsInput } from "../schemas/session";
import type { Prisma } from "../generated/prisma/client.js";

function hashRequest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function replayOrConflict(
  tx: Prisma.TransactionClient,
  key: string,
  endpoint: string,
  requestHash: string,
) {
  const existing = await tx.idempotencyKey.findUnique({ where: { key } });
  if (!existing) return null;
  if (existing.endpoint !== endpoint || existing.requestHash !== requestHash) {
    throw new AppError(
      409,
      ERROR_CODES.IDEMPOTENCY_KEY_REUSED,
      "This idempotency key was already used for a different request.",
    );
  }
  return {
    statusCode: existing.statusCode,
    data: JSON.parse(existing.responseJson) as unknown,
  };
}

export async function getCurrentSession(staffId: string) {
  return prismaClient.registerSession.findFirst({
    where: { staffId, status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });
}

export async function listSessions(staffId: string, input: ListSessionsInput) {
  return prismaClient.registerSession.findMany({
    where: { staffId },
    take: input.limit,
    orderBy: { openedAt: "desc" },
  });
}

export async function openSession(staffId: string, idempotencyKey: string) {
  const endpoint = "POST /api/sessions";
  const requestHash = hashRequest({ staffId });
  return prismaClient.$transaction(async (tx) => {
    const replay = await replayOrConflict(tx, idempotencyKey, endpoint, requestHash);
    if (replay) return replay;

    const active = await tx.registerSession.findFirst({
      where: { staffId, status: "OPEN" },
    });
    if (active) {
      throw new AppError(409, ERROR_CODES.SESSION_ALREADY_OPEN, "You already have an open session.");
    }

    const session = await tx.registerSession.create({ data: { staffId } });
    await tx.auditLog.create({
      data: { actorId: staffId, action: "session.opened", entity: "session", entityId: session.id },
    });
    const responseJson = JSON.stringify(session);
    await tx.idempotencyKey.create({
      data: { key: idempotencyKey, endpoint, requestHash, responseJson, statusCode: 201 },
    });
    return { statusCode: 201, data: JSON.parse(responseJson) as unknown };
  });
}

export async function closeSession(
  sessionId: string,
  staffId: string,
  idempotencyKey: string,
) {
  const endpoint = `POST /api/sessions/${sessionId}/close`;
  const requestHash = hashRequest({ staffId, sessionId });
  return prismaClient.$transaction(async (tx) => {
    const replay = await replayOrConflict(tx, idempotencyKey, endpoint, requestHash);
    if (replay) return replay;

    const session = await tx.registerSession.findFirst({ where: { id: sessionId, staffId } });
    if (!session) throw new AppError(404, ERROR_CODES.SESSION_NOT_FOUND, "Session was not found.");
    if (session.status !== "OPEN") {
      throw new AppError(409, ERROR_CODES.SESSION_NOT_OPEN, "This session is already closed.");
    }

    const unpaidCount = await tx.order.count({ where: { sessionId, status: "PLACED" } });
    if (unpaidCount > 0) {
      throw new AppError(
        409,
        ERROR_CODES.SESSION_HAS_UNPAID_ORDERS,
        "Mark or void all unpaid orders before closing this session.",
      );
    }

    const closed = await tx.registerSession.update({
      where: { id: sessionId },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    await tx.auditLog.create({
      data: { actorId: staffId, action: "session.closed", entity: "session", entityId: sessionId },
    });
    const responseJson = JSON.stringify(closed);
    await tx.idempotencyKey.create({
      data: { key: idempotencyKey, endpoint, requestHash, responseJson, statusCode: 200 },
    });
    return { statusCode: 200, data: JSON.parse(responseJson) as unknown };
  });
}

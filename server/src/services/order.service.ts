import { createHash } from "node:crypto";
import { ERROR_CODES } from "../constants/error-codes";
import { prismaClient } from "../lib/prismaClient";
import type { Prisma } from "../generated/prisma/client.js";
import AppError from "../utils/app-error";
import type {
  CreateOrderInput,
  ListOrdersInput,
  RecordPaymentInput,
  SalesReportInput,
} from "../schemas/order";

const MAX_SQLITE_INT = 2_147_483_647;

function hashRequest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function calculateTotals(
  items: { unitPricePaisa: number; quantity: number }[],
  taxRateBps: number,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + BigInt(item.unitPricePaisa) * BigInt(item.quantity),
    BigInt(0),
  );
  const tax =
    (subtotal * BigInt(taxRateBps) + BigInt(5000)) / BigInt(10000);
  const total = subtotal + tax;

  if (total > BigInt(MAX_SQLITE_INT)) {
    throw new AppError(
      400,
      ERROR_CODES.ORDER_TOTAL_TOO_LARGE,
      "Order total exceeds the supported amount.",
    );
  }

  return {
    subtotalPaisa: Number(subtotal),
    taxPaisa: Number(tax),
    totalPaisa: Number(total),
  };
}

function idempotencyConflict() {
  return new AppError(
    409,
    ERROR_CODES.IDEMPOTENCY_KEY_REUSED,
    "This idempotency key was already used for a different request.",
  );
}

async function replayOrConflict(
  tx: Prisma.TransactionClient,
  key: string,
  endpoint: string,
  requestHash: string,
) {
  const existing = await tx.idempotencyKey.findUnique({ where: { key } });
  if (!existing) return null;

  if (
    existing.endpoint !== endpoint ||
    existing.requestHash !== requestHash
  ) {
    throw idempotencyConflict();
  }

  return {
    statusCode: existing.statusCode,
    data: JSON.parse(existing.responseJson) as unknown,
    replayed: true,
  };
}

export async function createOrder(
  input: CreateOrderInput,
  actorId: string,
  idempotencyKey: string,
) {
  const endpoint = "POST /api/orders";
  const requestHash = hashRequest({ actorId, input });

  return prismaClient.$transaction(async (tx) => {
    const replay = await replayOrConflict(
      tx,
      idempotencyKey,
      endpoint,
      requestHash,
    );
    if (replay) return replay;

    const settings = await tx.settings.findUnique({
      where: { id: "singleton" },
    });
    if (!settings) {
      throw new AppError(
        500,
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        "Cafe settings are not configured.",
      );
    }

    const session = await tx.registerSession.findFirst({
      where: { staffId: actorId, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });
    if (!session) {
      throw new AppError(
        409,
        ERROR_CODES.SESSION_REQUIRED,
        "Open a cashier session before creating an order.",
      );
    }

    const products = await tx.product.findMany({
      where: {
        id: { in: input.items.map(({ productId }) => productId) },
      },
    });
    if (
      products.length !== input.items.length ||
      products.some((product) => !product.isAvailable)
    ) {
      throw new AppError(
        409,
        ERROR_CODES.PRODUCT_UNAVAILABLE,
        "One or more products are unavailable.",
      );
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    const orderItems = input.items.map(({ productId, quantity }) => {
      const product = productsById.get(productId);
      if (!product) {
        throw new AppError(
          409,
          ERROR_CODES.PRODUCT_UNAVAILABLE,
          "One or more products are unavailable.",
        );
      }

      return {
        productId: product.id,
        nameSnapshot: product.name,
        unitPricePaisa: product.pricePaisa,
        quantity,
        lineTotalPaisa: product.pricePaisa * quantity,
      };
    });
    const totals = calculateTotals(orderItems, settings.taxRateBps);

    const counter = await tx.counter.upsert({
      where: { name: "receipt" },
      create: { name: "receipt", value: 1001 },
      update: { value: { increment: 1 } },
    });
    const receiptNumber = `${settings.receiptPrefix}-${counter.value}`;

    const order = await tx.order.create({
      data: {
        receiptNumber,
        orderType: input.orderType,
        ...totals,
        taxRateBps: settings.taxRateBps,
        createdById: actorId,
        sessionId: session.id,
        items: { create: orderItems },
        events: {
          create: {
            eventType: "order.placed",
            payload: JSON.stringify({ orderType: input.orderType }),
          },
        },
      },
      include: { items: true, payments: true },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "order.created",
        entity: "order",
        entityId: order.id,
        after: JSON.stringify({ receiptNumber, ...totals }),
      },
    });

    const responseJson = JSON.stringify(order);
    await tx.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        endpoint,
        requestHash,
        responseJson,
        statusCode: 201,
      },
    });

    return { statusCode: 201, data: JSON.parse(responseJson) as unknown };
  });
}

export async function listOrders(input: ListOrdersInput) {
  const where: Prisma.OrderWhereInput = {};
  if (input.from || input.to) {
    where.createdAt = {
      ...(input.from ? { gte: new Date(input.from) } : {}),
      ...(input.to ? { lt: new Date(input.to) } : {}),
    };
  }
  const unpaidWhere: Prisma.OrderWhereInput = {
    status: "PLACED",
    ...(where.createdAt ? { createdAt: where.createdAt } : {}),
  };

  const [page, unpaidCount] = await prismaClient.$transaction([
    prismaClient.order.findMany({
      where,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      take: input.limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { items: true, payments: true },
    }),
    prismaClient.order.count({ where: unpaidWhere }),
  ]);
  const hasMore = page.length > input.limit;
  const items = hasMore ? page.slice(0, input.limit) : page;

  return {
    items,
    unpaidCount,
    hasMore,
    nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
  };
}

export async function getSalesReport(input: SalesReportInput, staffId: string) {
  if (input.sessionId) {
    const session = await prismaClient.registerSession.findFirst({
      where: { id: input.sessionId, staffId },
      select: { id: true },
    });
    if (!session) {
      throw new AppError(404, ERROR_CODES.SESSION_NOT_FOUND, "Session was not found.");
    }
  }

  const where: Prisma.OrderWhereInput = {
    status: "PAID",
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
  };
  if (input.from || input.to) {
    where.paidAt = {
      ...(input.from ? { gte: new Date(input.from) } : {}),
      ...(input.to ? { lt: new Date(input.to) } : {}),
    };
  }

  const [summary, byOrderType] = await prismaClient.$transaction([
    prismaClient.order.aggregate({
      where,
      _sum: { totalPaisa: true },
      _count: { _all: true },
    }),
    prismaClient.order.groupBy({
      by: ["orderType"],
      where,
      orderBy: { orderType: "asc" },
      _sum: { totalPaisa: true },
      _count: { _all: true },
    }),
  ]);

  return {
    totalPaisa: summary._sum.totalPaisa ?? 0,
    paidOrderCount: summary._count._all,
    byOrderType: byOrderType.map((group) => ({
      orderType: group.orderType,
      totalPaisa: group._sum?.totalPaisa ?? 0,
      orderCount:
        group._count && typeof group._count !== "boolean"
          ? group._count._all ?? 0
          : 0,
    })),
  };
}

export async function getOrder(id: string) {
  const order = await prismaClient.order.findUnique({
    where: { id },
    include: { items: true, payments: true },
  });

  if (!order) {
    throw new AppError(404, ERROR_CODES.ORDER_NOT_FOUND, "Order was not found.");
  }
  return order;
}

export async function recordPayment(
  orderId: string,
  input: RecordPaymentInput,
  actorId: string,
  idempotencyKey: string,
) {
  const endpoint = `POST /api/orders/${orderId}/payments`;
  const requestHash = hashRequest({ actorId, orderId, input });

  return prismaClient.$transaction(async (tx) => {
    const replay = await replayOrConflict(
      tx,
      idempotencyKey,
      endpoint,
      requestHash,
    );
    if (replay) return replay;

    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new AppError(404, ERROR_CODES.ORDER_NOT_FOUND, "Order was not found.");
    }
    if (order.status !== "PLACED") {
      throw new AppError(
        409,
        ERROR_CODES.ORDER_NOT_PAYABLE,
        "Only unpaid orders can be marked as paid.",
      );
    }

    const paidAt = new Date();
    await tx.payment.create({
      data: {
        orderId,
        method: input.method,
        amountPaisa: order.totalPaisa,
        createdById: actorId,
      },
    });
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt },
      include: { items: true, payments: true },
    });

    await tx.orderEvent.create({
      data: {
        orderId,
        eventType: "order.paid",
        payload: JSON.stringify({ method: input.method, paidAt }),
      },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "order.paid",
        entity: "order",
        entityId: orderId,
        before: JSON.stringify({ status: order.status }),
        after: JSON.stringify({ status: "PAID", method: input.method }),
      },
    });

    const responseJson = JSON.stringify(updatedOrder);
    await tx.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        endpoint,
        requestHash,
        responseJson,
        statusCode: 200,
      },
    });

    return { statusCode: 200, data: JSON.parse(responseJson) as unknown };
  });
}

import { prismaClient } from "../lib/prismaClient";
import type { ListExpensesInput, CreateExpenseInput } from "../schemas/expense";

export async function listExpenses(input: ListExpensesInput) {
  const where = {
    ...(input.from || input.to
      ? {
          spentAt: {
            ...(input.from ? { gte: new Date(input.from) } : {}),
            ...(input.to ? { lt: new Date(input.to) } : {}),
          },
        }
      : {}),
    ...(input.category ? { category: input.category } : {}),
  };
  const [rows, aggregate] = await prismaClient.$transaction([
    prismaClient.expense.findMany({
      where,
      orderBy: [{ spentAt: "desc" }, { id: "desc" }],
      take: input.limit + 1,
      ...(input.cursor
        ? { cursor: { id: input.cursor }, skip: 1 }
        : {}),
      include: { createdBy: { select: { name: true } } },
    }),
    prismaClient.expense.aggregate({
      where,
      _sum: { amountPaisa: true },
      _count: { _all: true },
    }),
  ]);
  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    totalPaisa: aggregate._sum.amountPaisa ?? 0,
    totalCount: aggregate._count._all,
    hasMore,
    nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
  };
}

export async function createExpense(
  input: CreateExpenseInput,
  actorId: string,
) {
  const spentAt = new Date(input.spentAt);
  const note = input.note?.trim() || null;

  return prismaClient.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        description: input.description,
        category: input.category,
        amountPaisa: input.amountPaisa,
        spentAt,
        note,
        createdById: actorId,
      },
      include: { createdBy: { select: { name: true } } },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "expense.recorded",
        entity: "expense",
        entityId: expense.id,
        after: JSON.stringify({
          description: expense.description,
          category: expense.category,
          amountPaisa: expense.amountPaisa,
          spentAt: expense.spentAt,
          note: expense.note,
        }),
      },
    });

    return expense;
  });
}

"use client";

import axios from "axios";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Calculator,
  CalendarDays,
  ClipboardList,
  LoaderCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateExpense, useInfiniteExpenses } from "@/lib/hooks/expense.hooks";
import { makeDateFilters, dateRangeIsValid } from "@/lib/date-range";
import {
  expenseCategories,
  type ExpenseCategory,
} from "@/lib/services/expense.service";
import { formatPaisa } from "@/lib/utils";

const MAX_AMOUNT_PAISA = 2_147_483_647;

function amountToPaisa(value: string): number | null {
  const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;

  const wholePaisa = Number(match[1]) * 100;
  const fractionalPaisa = Number((match[2] ?? "").padEnd(2, "0"));
  const amountPaisa = wholePaisa + fractionalPaisa;
  if (
    !Number.isSafeInteger(amountPaisa) ||
    amountPaisa < 1 ||
    amountPaisa > MAX_AMOUNT_PAISA
  ) {
    return null;
  }
  return amountPaisa;
}

function localDateTimeValue(date = new Date()): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function localDateValue(date = new Date()): string {
  return localDateTimeValue(date).slice(0, 10);
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message ?? fallback;
  }
  return fallback;
}

function categoryLabel(category: ExpenseCategory): string {
  return expenseCategories.find((option) => option.value === category)?.label ?? category;
}

const ExpensesPage = () => {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("INGREDIENTS");
  const [amount, setAmount] = useState("");
  const [spentAt, setSpentAt] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "">("");

  useEffect(() => {
    setSpentAt(localDateTimeValue());
  }, []);

  const validRange = dateRangeIsValid(fromDate, toDate);
  const filters = {
    ...makeDateFilters(fromDate, toDate),
    ...(categoryFilter ? { category: categoryFilter } : {}),
  };
  const expensesQuery = useInfiniteExpenses(filters, validRange);
  const createMutation = useCreateExpense();
  const firstPage = expensesQuery.data?.pages[0];
  const expenses = expensesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const hasLoadedResults =
    validRange && !expensesQuery.isPending && !expensesQuery.isError;

  function setDatePreset(preset: "today" | "month") {
    const today = localDateValue();
    if (preset === "today") {
      setFromDate(today);
      setToDate(today);
      return;
    }

    setFromDate(`${today.slice(0, 7)}-01`);
    setToDate(today);
  }

  function clearFilters() {
    setFromDate("");
    setToDate("");
    setCategoryFilter("");
  }

  function setExpenseCategoryFilter(value: string) {
    setCategoryFilter(
      expenseCategories.find((option) => option.value === value)?.value ?? "",
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSavedMessage("");

    const amountPaisa = amountToPaisa(amount);
    if (!description.trim()) {
      setFormError("Enter what the expense was for.");
      return;
    }
    if (description.trim().length > 120) {
      setFormError("The description must be 120 characters or fewer.");
      return;
    }
    if (amountPaisa === null) {
      setFormError("Enter an amount greater than PKR 0.00 with up to two decimals.");
      return;
    }
    if (!spentAt || Number.isNaN(new Date(spentAt).getTime())) {
      setFormError("Choose a valid date and time for this expense.");
      return;
    }

    createMutation.mutate(
      {
        description: description.trim(),
        category,
        amountPaisa,
        spentAt: new Date(spentAt).toISOString(),
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          setDescription("");
          setAmount("");
          setSpentAt(localDateTimeValue());
          setNote("");
          setSavedMessage("Expense recorded.");
        },
      },
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4 pt-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Expense Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Record cafe purchases and calculate spending for any date range.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          title={
            fromDate || toDate || categoryFilter
              ? "Total for filters"
              : "Total expenses"
          }
          value={
            hasLoadedResults
              ? formatPaisa(firstPage?.totalPaisa ?? 0)
              : "—"
          }
          caption="Calculated from all matching records"
          icon={<Calculator size={19} />}
        />
        <SummaryCard
          title="Expense entries"
          value={hasLoadedResults ? String(firstPage?.totalCount ?? 0) : "—"}
          caption="Matching saved records"
          icon={<ClipboardList size={19} />}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.6fr)]">
        <Card className="rounded-2xl py-0 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3">
              <h2 className="text-base font-semibold">Record an expense</h2>
              <p className="text-sm text-muted-foreground">
                For example, enter &ldquo;Milk&rdquo; under Ingredients.
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <Field className="gap-1">
                <FieldLabel htmlFor="expense-description">Expense</FieldLabel>
                <Input
                  id="expense-description"
                  autoComplete="off"
                  maxLength={120}
                  placeholder="e.g. Buying milk"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  aria-invalid={Boolean(formError && !description.trim())}
                />
              </Field>

              <Field className="gap-1">
                <FieldLabel htmlFor="expense-category">Category</FieldLabel>
                <Select
                  value={category}
                  onValueChange={(value) => {
                    const selected = expenseCategories.find(
                      (option) => option.value === value,
                    );
                    if (selected) setCategory(selected.value);
                  }}
                >
                  <SelectTrigger id="expense-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="gap-1">
                <FieldLabel htmlFor="expense-amount">Amount (PKR)</FieldLabel>
                <Input
                  id="expense-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  aria-invalid={Boolean(formError && amountToPaisa(amount) === null)}
                />
              </Field>

              <Field className="gap-1">
                <FieldLabel htmlFor="expense-spent-at">Date and time</FieldLabel>
                <Input
                  id="expense-spent-at"
                  type="datetime-local"
                  value={spentAt}
                  onChange={(event) => setSpentAt(event.target.value)}
                />
              </Field>

              <Field className="gap-1">
                <FieldLabel htmlFor="expense-note">Note (optional)</FieldLabel>
                <Textarea
                  id="expense-note"
                  maxLength={500}
                  rows={2}
                  placeholder="Add a supplier or purchase detail"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-0 resize-none"
                />
              </Field>

              {formError && (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              )}
              {createMutation.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {getErrorMessage(createMutation.error, "Could not record this expense.")}
                </p>
              )}
              {savedMessage && (
                <p role="status" className="text-sm text-primary">
                  {savedMessage}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    Saving expense
                  </>
                ) : (
                  <>
                    <Plus />
                    Save expense
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="min-w-0 space-y-3">
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
              <Field className="min-w-36 flex-1 gap-1">
                <FieldLabel htmlFor="expenses-from-date">From</FieldLabel>
                <Input
                  id="expenses-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </Field>
              <Field className="min-w-36 flex-1 gap-1">
                <FieldLabel htmlFor="expenses-to-date">To</FieldLabel>
                <Input
                  id="expenses-to-date"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </Field>
              <Field className="min-w-40 flex-1 gap-1">
                <FieldLabel htmlFor="expenses-category-filter">Category</FieldLabel>
                <Select
                  value={categoryFilter || "all"}
                  onValueChange={(value) =>
                    value === "all"
                      ? setCategoryFilter("")
                      : setExpenseCategoryFilter(value)
                  }
                >
                  <SelectTrigger id="expenses-category-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {expenseCategories.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDatePreset("today")}>
                  Today
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDatePreset("month")}>
                  This month
                </Button>
                {(fromDate || toDate || categoryFilter) && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {!validRange && (
            <p role="alert" className="text-sm text-destructive">
              The end date must be the same as or later than the start date.
            </p>
          )}
          {expensesQuery.isError && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(expensesQuery.error, "Expense history could not be loaded.")}
            </p>
          )}

          <Card className="min-w-0 rounded-2xl py-0 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="font-semibold">Saved expenses</h2>
                  <p className="text-sm text-muted-foreground">
                    {hasLoadedResults
                      ? `${firstPage?.totalCount ?? 0} matching entries`
                      : "Expense history"}
                  </p>
                </div>
                <CalendarDays className="size-5 text-muted-foreground" />
              </div>

              {!validRange ? (
                <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Choose a valid date range to view expenses.
                </p>
              ) : expensesQuery.isPending ? (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : expensesQuery.isError ? null : expenses.length > 0 ? (
                <div className="divide-y divide-border">
                  {expenses.map((expense) => (
                    <article
                      key={expense.id}
                      className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-foreground">
                            {expense.description}
                          </h3>
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                            {categoryLabel(expense.category)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(expense.spentAt).toLocaleString("en-PK", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                          {" · "}{expense.createdBy.name}
                        </p>
                        {expense.note && (
                          <p className="mt-1 break-words text-sm text-muted-foreground">
                            {expense.note}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums text-foreground">
                        {formatPaisa(expense.amountPaisa)}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-12 text-center">
                  <ClipboardList className="mx-auto size-9 text-muted-foreground/60" />
                  <h3 className="mt-3 font-medium">No expenses found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Record a purchase or adjust the selected filters.
                  </p>
                </div>
              )}

              {expensesQuery.hasNextPage && (
                <div className="border-t border-border p-4 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => expensesQuery.fetchNextPage()}
                    disabled={expensesQuery.isFetchingNextPage}
                  >
                    {expensesQuery.isFetchingNextPage ? (
                      <>
                        <LoaderCircle className="animate-spin" />
                        Loading
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

function SummaryCard({
  title,
  value,
  caption,
  icon,
}: {
  title: string;
  value: string;
  caption: string;
  icon: ReactNode;
}) {
  return (
    <Card size="sm" className="rounded-2xl py-0 shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-xl font-bold tabular-nums text-foreground">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}

export default ExpensesPage;

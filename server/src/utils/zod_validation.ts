import type { ZodType } from "zod";

export default function validate<T>(schema: ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

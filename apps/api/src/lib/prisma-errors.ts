/**
 * File: prisma-errors.ts
 * Purpose: Recognises Prisma's unique-constraint error, which the run lock relies on.
 * Exports: isUniqueViolation
 * Used by: services/run-lock.ts
 */
import { Prisma } from "../../generated/prisma/client.js";

/** True for P2002, raised when a unique column (runs.activeSlug) already has the value. */
export function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

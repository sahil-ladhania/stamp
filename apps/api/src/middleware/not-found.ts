/**
 * File: not-found.ts
 * Purpose: Turns unmatched routes into a contract-shaped 404 response.
 * Exports: notFound
 * Used by: lib/server.ts
 */
import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../errors/app-error.js";

/** Runs after all routers; forwards NotFoundError to errorHandler. */
export function notFound(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new NotFoundError());
}

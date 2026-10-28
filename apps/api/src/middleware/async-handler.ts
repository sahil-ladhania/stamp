/**
 * File: async-handler.ts
 * Purpose: Forwards async route failures to the global error handler.
 * Exports: asyncHandler
 * Used by: routes/*.ts
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

/** Wraps a handler so rejected promises and sync throws reach errorHandler. */
export function asyncHandler(fn: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
/**
 * File: validate.ts
 * Purpose: Validates a request body, params or query against a Zod schema before the controller runs.
 * Exports: validate, getValid
 * Used by: routes/*.ts, controllers/*.ts
 */
import type { RequestHandler, Response } from "express";
import type { z } from "zod";
import { ValidationError } from "../errors/app-error.js";

export type ValidationSource = "body" | "params" | "query";

/** Parses the request part with the schema; failures become a 400 ValidationError. */
export function validate(
  schema: z.ZodType,
  source: ValidationSource,
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue?.path.join(".");
      const detail = issue?.message ?? "Check the request and try again.";
      next(new ValidationError(path ? `${path}: ${detail}` : detail));
      return;
    }
    res.locals[source] = result.data;
    next();
  };
}

/**
 * Reads the value `validate` stored, typed by the schema.
 * Re-parsing keeps this free of casts; a route that forgot `validate` fails loudly.
 */
export function getValid<S extends z.ZodType>(
  res: Response,
  source: ValidationSource,
  schema: S,
): z.infer<S> {
  return schema.parse(res.locals[source]);
}

/**
 * File: rate-limit.ts
 * Purpose: Per-IP rate limit whose limits come from env; answers 429 with Retry-After.
 * Exports: createRateLimit
 * Used by: app.ts
 */
import type { RequestHandler } from "express";
import { rateLimit, type AugmentedRequest } from "express-rate-limit";
import type { EnvConfig } from "../config.js";
import { RateLimitedError } from "../errors/app-error.js";
import { formatWait } from "../utils/format-wait.js";

const REQUEST_PROPERTY = "rateLimit";

/** Each call builds its own counter, so run starts and reports are limited separately. */
export function createRateLimit(
  config: Pick<EnvConfig, "RATE_LIMIT_MAX" | "RATE_LIMIT_WINDOW_SECONDS">,
  subject: string,
): RequestHandler {
  const windowMs = config.RATE_LIMIT_WINDOW_SECONDS * 1000;
  return rateLimit({
    windowMs,
    limit: config.RATE_LIMIT_MAX,
    // Our errorHandler sets Retry-After; no extra RateLimit-* headers.
    standardHeaders: false,
    legacyHeaders: false,
    requestPropertyName: REQUEST_PROPERTY,
    handler: (req, _res, next) => {
      const resetTime = (req as AugmentedRequest)[REQUEST_PROPERTY]?.resetTime;
      const waitMs = resetTime ? resetTime.getTime() - Date.now() : windowMs;
      const retryAfter = Math.max(1, Math.ceil(waitMs / 1000));
      next(
        new RateLimitedError(
          `Too many ${subject}. Try again in ${formatWait(retryAfter)}.`,
          retryAfter,
        ),
      );
    },
  });
}

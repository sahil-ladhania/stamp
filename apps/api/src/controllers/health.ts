/**
 * File: health.ts
 * Purpose: Liveness handler for the host's health check (Render) and local checks.
 * Exports: getHealth
 * Used by: routes/health.ts
 */
import type { Request, Response } from "express";

/** Returns a plain-text OK response for GET /api/health. */
export function getHealth(_req: Request, res: Response): void {
  res.send("Server is running...");
}
